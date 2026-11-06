// AC-3、AC-4、AC-29：同梱の課題集（配布物の data/tasks.json）を全件読んで検査する（W-6）。
// 期待値は PRD r11 の 11：AC-3（4 要素が 1 文字以上、1 ≤ 分 ≤ 15）、AC-4（v1 は 210 以上、初級と中級の 12 組が 14 以上、上級の 6 組が 7 以上、ID の重複 0）、
// AC-29（mode、external は組の 20% 以下、in_app に URL も tools もない、external は tools 1 件以上）と budgets.md の 2（BUDGET2_：5 つの字数の平均 480 以下、gzip 後 105,000 以下）。
import { gzipSync } from 'node:zlib';
import { test, expect } from '../helpers/fixtures.mjs';
import { loadTasks } from '../helpers/app.mjs';
import { validate } from '../helpers/schema.mjs';

const AREAS = ['backend', 'frontend', 'database', 'infra', 'testing', 'git'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];
// AC-4（PRD r11）：v1 の組ごとの下限。初級と中級は 14、上級は 7（公開後に足す 252 件版では上級も 14：その版のテストは G4 で差し替える）。
const MIN_PER_LEVEL = { beginner: 14, intermediate: 14, advanced: 7 };
const MIN_TOTAL = 210;
const trimLen = (s) => (typeof s === 'string' ? s.trim().length : 0);
const cp = (s) => (typeof s === 'string' ? [...s].length : 0);

test('AC3_課題集の全件が4要素を持ち所要時間が1〜15分', async ({ request }) => {
  const res = await request.get('data/tasks.json');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type'] ?? '').toContain('application/json');
  const tasks = await res.json();

  const { ok, errors } = validate('tasks', tasks);
  expect(ok, `tasks.schema.json：${errors}`).toBe(true);

  const bad = [];
  for (const t of tasks.tasks) {
    if (trimLen(t.title) < 1 || trimLen(t.why) < 1 || trimLen(t.how) < 1 || trimLen(t.goal) < 1) bad.push(`${t.id}: 4 要素が空`);
    if (!Number.isInteger(t.minutes) || t.minutes < 1 || t.minutes > 15) bad.push(`${t.id}: minutes=${t.minutes}`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
  expect(tasks.tasks.length).toBeGreaterThan(0);
});

test('AC4_課題集は210件以上で初級と中級の12組が14件以上_上級の6組が7件以上_IDの重複が0件', async ({ request }, testInfo) => {
  const tasks = await loadTasks(request);
  const n = tasks.tasks.length;
  const counts = {};
  for (const a of AREAS) for (const l of LEVELS) counts[`${a}/${l}`] = 0;
  for (const t of tasks.tasks) counts[`${t.area}/${t.level}`] = (counts[`${t.area}/${t.level}`] ?? 0) + 1;
  const ids = tasks.tasks.map((t) => t.id);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  testInfo.annotations.push({ type: '件数', description: `全体 ${n}、組ごと ${JSON.stringify(counts)}` });

  expect(n, `全体の件数（${MIN_TOTAL} 以上）`).toBeGreaterThanOrEqual(MIN_TOTAL);
  expect(Object.keys(counts)).toHaveLength(18);
  for (const [combo, c] of Object.entries(counts)) {
    const level = combo.split('/')[1];
    expect(c, `組 ${combo} の件数（${MIN_PER_LEVEL[level]} 以上）`).toBeGreaterThanOrEqual(MIN_PER_LEVEL[level]);
  }
  expect(dup, 'ID の重複').toEqual([]);
});

test('BUDGET2_本文4要素と解説の字数の平均が480字以下', async ({ request }, testInfo) => {
  // contracts/budgets.md の 2（受け入れテストで数える）。PRD の AC ではないので名前は BUDGET2_（test-hooks.md W-6）。
  // 字数はコードポイント（[...str].length）。5 つ（title、why、how、goal、insight）の合計を件数で割る。
  const tasks = await loadTasks(request);
  const total = tasks.tasks.reduce((s, t) => s + cp(t.title) + cp(t.why) + cp(t.how) + cp(t.goal) + cp(t.insight), 0);
  const avg = total / tasks.tasks.length;
  testInfo.annotations.push({ type: '平均の字数（5 つ）', description: `${avg.toFixed(1)}（${tasks.tasks.length} 件）` });
  expect(avg).toBeLessThanOrEqual(480);
});

test('BUDGET2_課題集はgzip後105000バイト以下', async ({ request }, testInfo) => {
  const res = await request.get('data/tasks.json');
  expect(res.status()).toBe(200);
  const raw = await res.body();
  const gz = gzipSync(raw, { level: 9 }).length;
  testInfo.annotations.push({ type: 'gzip 後', description: `${gz} バイト（元 ${raw.length}）` });
  expect(gz).toBeLessThanOrEqual(105_000);
});

test('AC29_各組でexternalが20%以下_in_appにURLもtoolsもなく_externalはtoolsが1件以上', async ({ request }, testInfo) => {
  const tasks = await loadTasks(request);
  const groups = {};
  for (const t of tasks.tasks) {
    const k = `${t.area}/${t.level}`;
    groups[k] ??= { n: 0, external: 0 };
    groups[k].n++;
    if (t.mode === 'external') groups[k].external++;
  }
  const bad = [];
  for (const t of tasks.tasks) {
    if (t.mode !== 'in_app' && t.mode !== 'external') bad.push(`${t.id}: mode=${t.mode}`);
    const text = [t.title, t.why, t.how, t.goal].join('\n');
    if (t.mode === 'in_app') {
      if (/https?:\/\//.test(text)) bad.push(`${t.id}: in_app に URL`);
      if (!Array.isArray(t.tools) || t.tools.length !== 0) bad.push(`${t.id}: in_app に tools`);
    }
    if (t.mode === 'external' && (!Array.isArray(t.tools) || t.tools.length < 1)) bad.push(`${t.id}: external に tools がない`);
  }
  const ratios = Object.fromEntries(Object.entries(groups).map(([k, g]) => [k, `${g.external}/${g.n}`]));
  testInfo.annotations.push({ type: '組ごとの external', description: JSON.stringify(ratios) });
  expect(Object.keys(groups)).toHaveLength(18);
  for (const [k, g] of Object.entries(groups)) {
    expect(g.external, `組 ${k} の external ${g.external}/${g.n}（20% 以下）`).toBeLessThanOrEqual(g.n * 0.2);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});
