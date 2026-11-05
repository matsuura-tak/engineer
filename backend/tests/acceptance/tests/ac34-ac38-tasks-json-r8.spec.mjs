// AC-34（PRD r11。FB-1）：初級の課題集は未経験向けの決まりを全件で満たす。AC-38 の JSON の側：全件の insight が 1〜120 字で改行とバッククォートを含まない。
// 決まりは contracts/strings.md の 7.2（AC-34）と PRD AC-38 の Then（字数はコードポイント。tasks.schema の maxLength と同じ）。本番の data/tasks.json を W-4 の URL で読む。
// 守り：初級が 0 件や課題集が壊れていても緑にならないように、先に tasks.schema に通し、初級の件数が AC-4（PRD r11）の 6 組 × 14 = 84 以上であることを確かめる。
import { test, expect } from '../helpers/fixtures.mjs';
import { loadTasks } from '../helpers/app.mjs';
import { validate } from '../helpers/schema.mjs';

// strings.md 7.2 の語（半角 U+0020 と全角 U+3000 の空白を除いてから部分一致）
const AC34_WORDS = ['自分のAPI', '自分のリポジトリ', '自分のサービス', '自分のチーム', '実務で', '業務で'];
const AC34_TOOLS = ['ブラウザ', '開発者ツール'];
const MIN_BEGINNER_TOTAL = 84;
const stripSpaces = (s) => String(s).replace(/[ 　]/g, '');
const cp = (s) => (typeof s === 'string' ? [...s].length : -1);

test('AC34_初級の全件がminutes10以下で6語が0件でexternalのtoolsがブラウザか開発者ツールを含む', async ({ request }, testInfo) => {
  const tasks = await loadTasks(request);
  const { ok, errors } = validate('tasks', tasks);
  expect(ok, `tasks.schema.json：${errors}`).toBe(true);
  const beginners = tasks.tasks.filter((t) => t.level === 'beginner');
  testInfo.annotations.push({ type: '初級の件数', description: `${beginners.length}（external ${beginners.filter((t) => t.mode === 'external').length}）` });
  expect(beginners.length, `初級の件数（${MIN_BEGINNER_TOTAL} 以上。AC-4）`).toBeGreaterThanOrEqual(MIN_BEGINNER_TOTAL);

  const bad = [];
  for (const t of beginners) {
    if (!Number.isInteger(t.minutes) || t.minutes > 10) bad.push(`${t.id}: minutes=${t.minutes}（10 以下）`);
    for (const [field, text] of [['title', t.title], ['why', t.why], ['how', t.how], ['goal', t.goal], ['insight', t.insight]]) {
      const hay = stripSpaces(text ?? '');
      for (const w of AC34_WORDS) if (hay.includes(stripSpaces(w))) bad.push(`${t.id}: ${field} に「${w}」`);
    }
    if (t.mode === 'external') {
      if (!Array.isArray(t.tools) || t.tools.length < 1) bad.push(`${t.id}: external に tools がない`);
      for (const tool of t.tools ?? []) {
        const s = stripSpaces(tool);
        if (!AC34_TOOLS.some((k) => s.includes(k))) bad.push(`${t.id}: tools「${tool}」がブラウザ／開発者ツールを含まない`);
      }
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('AC38_課題集の全件のinsightが前後の空白を除いて1〜120字で改行とバッククォートを含まない', async ({ request }, testInfo) => {
  const tasks = await loadTasks(request);
  expect(tasks.tasks.length, '課題集の件数').toBeGreaterThan(0);
  const bad = [];
  let max = 0;
  for (const t of tasks.tasks) {
    if (typeof t.insight !== 'string') {
      bad.push(`${t.id}: insight がない`);
      continue;
    }
    const n = cp(t.insight.trim());
    max = Math.max(max, n);
    if (n < 1 || n > 120) bad.push(`${t.id}: insight の字数 ${n}（1〜120）`);
    if (/[\r\n]/.test(t.insight)) bad.push(`${t.id}: insight に改行`);
    if (t.insight.includes('`')) bad.push(`${t.id}: insight にバッククォート`);
  }
  testInfo.annotations.push({ type: 'insight', description: `${tasks.tasks.length} 件、最長 ${max} 字` });
  expect(bad, bad.join('\n')).toEqual([]);
});
