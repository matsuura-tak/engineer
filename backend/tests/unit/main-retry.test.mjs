// main.js の保存の再試行（commit）と issueByAction（contracts/data.md の 4「画面を開いたまま日付が変わったとき」の U-17 の例外、2 の失敗）。
// main.js は読み込むと画面を組み立てるので import しない。act、commit、issueByAction の本文を原本から切り出し、まわりを差し替えて動かす。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { BACKEND_DIR } from './helpers.mjs';

const SRC = readFileSync(path.join(BACKEND_DIR, 'public', 'js', 'main.js'), 'utf8');

/** `function name(` から、行頭の `}` までを切り出す。 */
function fnSource(name) {
  const start = SRC.indexOf(`\nfunction ${name}(`);
  assert.ok(start >= 0, `main.js に function ${name} がない`);
  const end = SRC.indexOf('\n}\n', start);
  assert.ok(end > start);
  return SRC.slice(start, end + 3);
}

/** act、commit、issueByAction を、保存先と日付と画面を差し替えて組み立てる。 */
function harness() {
  const env = { day: '2026-11-03', saveOk: false, dayChangedOps: [], shown: [], errors: [], saved: [] };
  const build = new Function(
    'env',
    `
    const app = { seq: 0, notice: null, checkDay: true, day: env.day, storage: {}, data: null };
    const today = () => env.day;
    const clearNotice = () => {};
    const dayChanged = (op) => env.dayChangedOps.push(op);
    const save = (_s, next) => { if (env.saveOk) env.saved.push(next); return env.saveOk; };
    const R = { markPersist: (r) => r };
    const canRequestPersist = () => true;
    const navigator = { storage: {} };
    const showDay = (state) => env.shown.push(state);
    const track = () => {};
    const askPersist = () => {};
    ${fnSource('act')}
    ${fnSource('commit')}
    ${fnSource('issueByAction')}
    return { app, act, commit, issueByAction };
    `,
  );
  return { env, ...build(env) };
}

const view = (env) => ({ showError: (where, retry) => env.errors.push({ where, retry }) });
const issued = { changed: true, issued: true, askPersist: false, state: 'task.today', data: { n: 2 } };

test('U-17：task.next の保存が失敗し、日付が変わってから再試行すると、入口に op "task.next" が渡る（知らせを出さない側）', () => {
  const h = harness();
  h.issueByAction(issued, view(h.env), 'next');
  assert.equal(h.env.errors.length, 1);
  assert.equal(h.env.errors[0].where, 'next');
  h.env.day = '2026-11-04';
  h.env.errors[0].retry();
  assert.deepEqual(h.env.dayChangedOps, ['task.next']);
  assert.deepEqual(h.env.saved, [], '日付が変わったら保存し直さない');
});

test('U-17：advance の再試行は op "task.exhausted.advance"（知らせを出す側）。日付が同じなら再試行で 1 回保存して描く', () => {
  const h = harness();
  h.issueByAction(issued, view(h.env), 'advance');
  h.env.day = '2026-11-04';
  h.env.errors[0].retry();
  assert.deepEqual(h.env.dayChangedOps, ['task.exhausted.advance']);

  const g = harness();
  g.issueByAction(issued, view(g.env), 'next');
  g.env.saveOk = true;
  g.env.errors[0].retry();
  assert.deepEqual(g.env.dayChangedOps, []);
  assert.deepEqual(g.env.saved, [issued.data]);
  assert.deepEqual(g.env.shown, ['task.today']);
  assert.equal(g.app.data, issued.data);
});

test('commit：op を渡さない呼び出し元の再試行は今までどおり op ""。2 回目の失敗の再試行にも同じ op が続く', () => {
  const h = harness();
  const retries = [];
  h.commit({ n: 1 }, () => {}, (retry) => retries.push(retry));
  retries[0]();
  assert.equal(retries.length, 2, '日付が同じで失敗すれば、もう一度再試行の入口を渡す');
  h.env.day = '2026-11-04';
  retries[1]();
  assert.deepEqual(h.env.dayChangedOps, ['']);

  const g = harness();
  g.issueByAction(issued, view(g.env), 'next');
  g.env.errors[0].retry();
  assert.equal(g.env.errors.length, 2);
  g.env.day = '2026-11-04';
  g.env.errors[1].retry();
  assert.deepEqual(g.env.dayChangedOps, ['task.next']);
});
