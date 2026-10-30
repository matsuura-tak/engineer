// AC-3、AC-4、AC-29：同梱の課題集（配布物の data/tasks.json）を全件読んで検査する（W-6）。
// 期待値は PRD 11 の AC-3（4 要素が 1 文字以上、1 ≤ 分 ≤ 15）、AC-4（126 以上、18 組 × 7 以上、ID の重複 0）、
// AC-29（mode、external は組の 20% 以下、in_app に URL も tools もない、external は tools 1 件以上）と budgets.md の 2（BUDGET2_）。
import { gzipSync } from 'node:zlib';
import { test, expect } from '../helpers/fixtures.mjs';
import { loadTasks } from '../helpers/app.mjs';
import { validate } from '../helpers/schema.mjs';

const AREAS = ['backend', 'frontend', 'database', 'infra', 'testing', 'git'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const trimLen = (s) => (typeof s === 'string' ? s.trim().length : 0);

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

test('AC4_課題集は126件以上で18組すべて7件以上でIDの重複が0件', async ({ request }, testInfo) => {
  const tasks = await loadTasks(request);
  const n = tasks.tasks.length;
  const counts = {};
  for (const a of AREAS) for (const l of LEVELS) counts[`${a}/${l}`] = 0;
  for (const t of tasks.tasks) counts[`${t.area}/${t.level}`] = (counts[`${t.area}/${t.level}`] ?? 0) + 1;
  const ids = tasks.tasks.map((t) => t.id);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  testInfo.annotations.push({ type: '件数', description: `全体 ${n}、組ごと ${JSON.stringify(counts)}` });

  expect(n, '全体の件数').toBeGreaterThanOrEqual(126);
  expect(Object.keys(counts)).toHaveLength(18);
  for (const [combo, c] of Object.entries(counts)) expect(c, `組 ${combo} の件数`).toBeGreaterThanOrEqual(7);
  expect(dup, 'ID の重複').toEqual([]);
});

test('BUDGET2_課題集の本文の平均600字以下_gzip後106000バイト以下', async ({ request }, testInfo) => {
  // contracts/budgets.md の 2（受け入れテストで数える）。PRD の AC ではないので名前は BUDGET2_（test-hooks.md W-6）。
  // 検証レポートでは AC の表とは別の「予算」の行に合否と値を書く。
  const res = await request.get('data/tasks.json');
  expect(res.status()).toBe(200);
  const raw = await res.body();
  const tasks = JSON.parse(raw.toString('utf8'));
  const total = tasks.tasks.reduce((s, t) => s + [...t.title].length + [...t.why].length + [...t.how].length + [...t.goal].length, 0);
  const avg = total / tasks.tasks.length;
  const gz = gzipSync(raw, { level: 9 }).length;
  testInfo.annotations.push({ type: '平均の字数 / gzip 後', description: `${avg.toFixed(1)} / ${gz}` });
  expect(avg).toBeLessThanOrEqual(600);
  expect(gz).toBeLessThanOrEqual(106_000);
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
