// 画面を開いたまま日付が変わったとき（contracts/data.md の 4）、U-15、保存の永続化（data.md の 2 と 11、design の D-31）。
// main.js の route() と同じ順（openStore → planDay → changed なら save を 1 回）を、保存先の代わり（fakeStorage）で動かす。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import * as R from '../../public/js/rules.js';
import { openStore, save, KEY } from '../../public/js/store.js';
import { validateData } from '../../public/js/validate.js';
import { canRequestPersist, requestPersist, readNotPersisted, drawWhenPersistedKnown, PERSISTED_WAIT_MS } from '../../public/js/persist.js';
import { BACKEND_DIR, FIXTURES_DIR, fakeStorage, readJsonFile } from './helpers.mjs';

const TASKS = readJsonFile(path.join(BACKEND_DIR, 'public', 'data', 'tasks.json')).tasks;
const seed = (name) => readJsonFile(path.join(FIXTURES_DIR, 'seeds', name));
const DAY = '2026-11-04';
const NEXT = '2026-11-05';

/** main.js の route() と同じ手順。保存の回数を storage.calls で数える。 */
function routeOnce(storage, today, opts = {}) {
  const s = openStore(() => storage);
  assert.equal(s.kind, 'ok');
  const r = R.planDay(s.data, today, TASKS, opts);
  if (r.changed) assert.equal(save(storage, r.data), true);
  return r;
}

const stored = (storage) => JSON.parse(storage.map.get(KEY));
const setItems = (storage) => storage.calls.filter((c) => c === 'setItem').length;

/** DAY に今日の課題を出した後の保存データ（印あり）。 */
function dayWithCurrent({ mark = true } = {}) {
  const st = fakeStorage({ [KEY]: JSON.stringify(seed('seed-ac14-three-completed.json')) });
  const r = routeOnce(st, DAY, { canPersist: mark });
  assert.equal(r.state, 'task.today');
  return { st, current: stored(st).current };
}

test('日付の変わり目：前日の課題は答えごと none の行に移り、翌日の current.answer は空で、保存は 1 回だけ（data.md の 4、AC-32）', () => {
  const { st, current } = dayWithCurrent();
  st.calls.length = 0;
  const held = { value: '前日に書いた答え', shown: { date: current.date, taskId: current.taskId } };
  const r = routeOnce(st, NEXT, { canPersist: true, shown: held.shown, held: held.value });
  assert.equal(r.state, 'task.today');
  assert.equal(r.askPersist, false, '印があるので persist() は呼ばない');
  assert.deepEqual(st.calls, ['getItem', 'setItem']);
  const d = stored(st);
  assert.equal(d.current.date, NEXT);
  assert.equal(d.current.answer, '');
  assert.notEqual(d.current.taskId, current.taskId);
  const moved = d.history.at(-1);
  assert.deepEqual(moved, { ...current, report: 'none', answer: '前日に書いた答え' });
  assert.deepEqual(validateData(d), []);
});

test('日付の変わり目：別のタブがもう移していたら、欄の値で上書きせず、保存もしない（data.md の 4 の 2「読み直す理由」）', () => {
  const { st, current } = dayWithCurrent();
  // 別のタブが NEXT に開いて、答えを書いて保存した
  const other = fakeStorage({ [KEY]: st.map.get(KEY) });
  routeOnce(other, NEXT, { canPersist: true });
  const otherData = stored(other);
  otherData.current.answer = '別のタブの答え';
  st.map.set(KEY, JSON.stringify(otherData));
  st.calls.length = 0;

  const r = routeOnce(st, NEXT, { canPersist: true, shown: { date: current.date, taskId: current.taskId }, held: 'このタブの古い答え' });
  assert.equal(r.state, 'task.today');
  assert.equal(r.changed, false);
  assert.deepEqual(st.calls, ['getItem'], 'setItem は 0 回');
  assert.equal(stored(st).current.answer, '別のタブの答え');
  assert.equal(stored(st).history.at(-1).answer, '', '前日の行の答えも別のタブが書いた値のまま');
});

test('日付の変わり目：別のタブが今日の申告を済ませていたら S5 で、保存しない（data.md の 4 の 4）', () => {
  const { st, current } = dayWithCurrent();
  const d = stored(st);
  d.history.push({ ...d.current, report: 'none' });
  delete d.current;
  const t = R.pickTask(d, TASKS);
  d.history.push({ date: NEXT, taskId: t.id, area: t.area, level: t.level, mode: t.mode, answer: '', report: 'done', helpful: 'unanswered' });
  st.map.set(KEY, JSON.stringify(d));
  st.calls.length = 0;
  const r = routeOnce(st, NEXT, { canPersist: true, shown: { date: current.date, taskId: current.taskId }, held: 'x' });
  assert.equal(r.state, 'task.done');
  assert.equal(setItems(st), 0);
});

test('carryAnswer：date か taskId が違えば、または値が同じなら元の data をそのまま返す', () => {
  const data = { current: { date: DAY, taskId: 'a-1', answer: 'old' } };
  assert.equal(R.carryAnswer(data, { date: DAY, taskId: 'a-2' }, 'new'), data);
  assert.equal(R.carryAnswer(data, { date: NEXT, taskId: 'a-1' }, 'new'), data);
  assert.equal(R.carryAnswer(data, { date: DAY, taskId: 'a-1' }, 'old'), data);
  assert.equal(R.carryAnswer(data, null, 'new'), data);
  assert.equal(R.carryAnswer(data, { date: DAY, taskId: 'a-1' }, null), data);
  const next = R.carryAnswer(data, { date: DAY, taskId: 'a-1' }, 'new');
  assert.equal(next.current.answer, 'new');
  assert.equal(data.current.answer, 'old', '渡した data は書き換えない');
});

test('U-15：日付を確かめるのは、描いたときの保存データが「あり」の画面だけ（S1、初回の S2、データなしの S8、S0 error は確かめない）', () => {
  const exists = seed('seed-ac14-three-completed.json');
  const inProgress = readJsonFile(path.join(FIXTURES_DIR, 'data', 'v1', 'valid-in-progress.json'));
  const guideOnly = readJsonFile(path.join(FIXTURES_DIR, 'data', 'v1', 'valid-guide-closed-only.json'));
  assert.equal(R.checksDay('diagnosis.start', null), false);
  assert.equal(R.checksDay('diagnosis.start', guideOnly), false);
  assert.equal(R.checksDay('diagnosis.question', inProgress), false);
  assert.equal(R.checksDay('settings', null), false);
  assert.equal(R.checksDay('settings', inProgress), false);
  assert.equal(R.checksDay('error', exists), false);
  for (const s of ['task.today', 'task.rate', 'task.done', 'task.skipped', 'task.exhausted', 'settings', 'settings.stats', 'history', 'diagnosis.question']) {
    assert.equal(R.checksDay(s, exists), true, s);
  }
});

test('U-15：初回の診断の 2 問目を前日に出して翌日に確定しても、その日の日付で保存して 3 問目へ（firstOpenDate は 1 問目の日）', () => {
  let d = R.answerInitial(null, 1, 'frontend', '2026-11-03');
  d = R.answerInitial(d, 2, 'beginner', DAY);
  const r = R.markPersist(R.finishInitial(d, 'lt1', DAY, TASKS), true);
  assert.equal(r.data.firstOpenDate, '2026-11-03');
  assert.equal(r.data.diagnosis.completedOn, DAY);
  assert.equal(r.data.current.date, DAY);
  assert.equal(r.data.current.answer, '');
  assert.deepEqual(validateData(r.data), []);
});

test('persist の印：初回の診断を終える保存に device.persistRequested: true が入り、persistGranted は書かない（data.md の 2、11）', () => {
  let d = R.answerInitial(null, 1, 'backend', DAY);
  d = R.answerInitial(d, 2, 'intermediate', DAY);
  const r = R.markPersist(R.finishInitial(d, '1to3', DAY, TASKS), true);
  assert.equal(r.askPersist, true);
  assert.deepEqual(r.data.device, { persistRequested: true });
  assert.deepEqual(validateData(r.data), []);
  // persist が関数でないブラウザでは印を書かず、求めない
  const r2 = R.markPersist(R.finishInitial(d, '1to3', DAY, TASKS), false);
  assert.equal(r2.askPersist, false);
  assert.equal(r2.data.device, undefined);
});

test('persist の印：印のない「あり」で 6-4 の起動は setItem 1 回（印と今日の課題をまとめる）で、persist() を 1 回求める', () => {
  const st = fakeStorage({ [KEY]: JSON.stringify(seed('seed-ac14-three-completed.json')) });
  const r = routeOnce(st, DAY, { canPersist: true });
  assert.equal(r.state, 'task.today');
  assert.equal(r.askPersist, true);
  assert.deepEqual(st.calls, ['getItem', 'setItem']);
  const d = stored(st);
  assert.equal(d.device.persistRequested, true);
  assert.equal('persistGranted' in d.device, false);
  assert.equal(d.current.date, DAY);
});

test('persist の印：印ありの 6-3（今日の課題がもうある）起動は setItem 0 回で、persist() を求めない', () => {
  const { st } = dayWithCurrent({ mark: true });
  st.calls.length = 0;
  const r = routeOnce(st, DAY, { canPersist: true });
  assert.equal(r.state, 'task.today');
  assert.equal(r.askPersist, false);
  assert.deepEqual(st.calls, ['getItem']);
});

test('persist の印：印のない 6-3 起動でも求めない（今日の課題を作る保存でないため。data.md の 11）', () => {
  const { st } = dayWithCurrent({ mark: false });
  assert.equal(stored(st).device, undefined);
  st.calls.length = 0;
  const r = routeOnce(st, DAY, { canPersist: true });
  assert.equal(r.askPersist, false);
  assert.deepEqual(st.calls, ['getItem']);
});

test('persist の印：印ありで翌日の課題が出る起動（6-1 と 6-4）は setItem 1 回で、persist() を求めない', () => {
  const { st } = dayWithCurrent({ mark: true });
  st.calls.length = 0;
  const r = routeOnce(st, NEXT, { canPersist: true });
  assert.equal(r.state, 'task.today');
  assert.equal(r.askPersist, false);
  assert.equal(setItems(st), 1);
});

test('persist の印：前の実装が書いた persistGranted はそのまま残し、新しく書かない', () => {
  const s = seed('seed-ac14-three-completed.json');
  s.device = { persistRequested: true, persistGranted: false };
  const st = fakeStorage({ [KEY]: JSON.stringify(s) });
  const r = routeOnce(st, DAY, { canPersist: true });
  assert.equal(r.askPersist, false);
  assert.deepEqual(stored(st).device, { persistRequested: true, persistGranted: false });
});

test('requestPersist：persist() を 1 回呼び、結果が返ったら onAnswered。例外と reject は外に出さない', async () => {
  let calls = 0;
  let answered = 0;
  const onAnswered = () => {
    answered += 1;
  };
  requestPersist({ persist: async () => { calls += 1; return false; } }, onAnswered);
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(calls, 1);
  assert.equal(answered, 1);

  requestPersist({ persist: () => { throw new Error('x'); } }, onAnswered);
  requestPersist({ persist: () => Promise.reject(new Error('x')) }, onAnswered);
  requestPersist(undefined, onAnswered);
  requestPersist({}, onAnswered);
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(answered, 1);
  assert.equal(canRequestPersist(undefined), false);
  assert.equal(canRequestPersist({ persist: 1 }), false);
  assert.equal(canRequestPersist({ persist() {} }), true);
});

test('S8 の注意：persisted() が false のときだけ出す。true、ない、例外、reject、false 以外の値では出さない（D-31）', async () => {
  assert.equal(await readNotPersisted({ persisted: async () => false }), true);
  assert.equal(await readNotPersisted({ persisted: async () => true }), false);
  assert.equal(await readNotPersisted({ persisted: async () => undefined }), false);
  assert.equal(await readNotPersisted({}), false);
  assert.equal(await readNotPersisted(undefined), false);
  assert.equal(await readNotPersisted({ persisted: () => { throw new Error('x'); } }), false);
  assert.equal(await readNotPersisted({ persisted: () => Promise.reject(new Error('x')) }), false);
});

/** setTimeout と clearTimeout の代わり。fire(id) で上限に達したことにする。 */
function fakeTimers() {
  const timers = new Map();
  const cleared = [];
  let next = 1;
  return {
    timers,
    cleared,
    setTimeout(fn, ms) {
      const id = next++;
      timers.set(id, { fn, ms });
      return id;
    },
    clearTimeout(id) {
      cleared.push(id);
      timers.delete(id);
    },
    fire(id) {
      const t = timers.get(id);
      timers.delete(id);
      t.fn();
    },
  };
}

/** 外から答えを決められる persisted()。 */
function deferredPersisted() {
  const d = { calls: 0 };
  d.sm = {
    persisted: () => {
      d.calls += 1;
      return new Promise((resolve) => {
        d.resolve = resolve;
      });
    },
  };
  return d;
}

const tick = () => new Promise((r) => setTimeout(r, 0));

test('S8 の待つ上限：既定は 1,000 ms で、上限までに答えが決まらなければ false（注意を出さない。data.md の 11）', async () => {
  assert.equal(PERSISTED_WAIT_MS, 1000);
  const ft = fakeTimers();
  const d = deferredPersisted();
  let result = 'pending';
  readNotPersisted(d.sm, { timers: ft }).then((v) => {
    result = v;
  });
  assert.equal(d.calls, 1);
  assert.equal(ft.timers.size, 1);
  const [[id, t]] = [...ft.timers];
  assert.equal(t.ms, 1000);
  await tick();
  assert.equal(result, 'pending', '上限の前は決まらない');
  ft.fire(id);
  await tick();
  assert.equal(result, false, '上限に達したら false');
  // 後から false が返っても結果は変わらない
  d.resolve(false);
  await tick();
  assert.equal(result, false);
});

// timeout：上限の仕組みが壊れたら、待ち続けずに落とす
test('S8 の待つ上限：返らない persisted() でも本物のタイマーで上限の後に false', { timeout: 2000 }, async () => {
  const started = Date.now();
  const v = await readNotPersisted({ persisted: () => new Promise(() => {}) }, { limitMs: 30 });
  assert.equal(v, false);
  assert.ok(Date.now() - started >= 25, `${Date.now() - started} ms`);
});

test('S8 の待つ上限：上限の前に答えが決まったらタイマーを消す（答え false、true、例外のどれでも）', async () => {
  for (const [persisted, expected] of [
    [async () => false, true],
    [async () => true, false],
    [() => Promise.reject(new Error('x')), false],
    [() => { throw new Error('x'); }, false],
  ]) {
    const ft = fakeTimers();
    const v = await readNotPersisted({ persisted }, { timers: ft });
    assert.equal(v, expected);
    assert.equal(ft.timers.size, 0, 'タイマーが残らない');
    assert.deepEqual(ft.cleared, [1], '置いたタイマーを消した');
  }
});

test('S8 の待ち：待つ間に次の操作が始まったら描かない。後の待ちだけが描く（data.md の 11、reviewer G2 r3 の要修正）', async () => {
  // main.js と同じ形：act() が seq を 1 増やし、showSettings がその値を覚える
  const app = { seq: 0 };
  const act = (fn) => () => {
    app.seq += 1;
    fn();
  };
  const drawn = [];
  const waits = [];
  const showSettings = (label) => {
    const d = deferredPersisted();
    const ft = fakeTimers();
    const seq = app.seq;
    waits.push({ d, ft });
    drawWhenPersistedKnown(d.sm, () => seq === app.seq, (np) => drawn.push([label, np]), { timers: ft });
  };
  act(() => showSettings('1 回目のやめる'))();
  act(() => {})(); // 待つ間の「次へ」（画面を移す操作）
  waits[0].d.resolve(false);
  await tick();
  assert.deepEqual(drawn, [], '答えが返っても遅れて S8 を描かない');

  act(() => showSettings('2 回目のやめる'))();
  act(() => {})(); // 画面を移さない操作（必須のエラー）でも捨てる
  waits[1].ft.fire(1);
  await tick();
  assert.deepEqual(drawn, [], '上限に達しても描かない');

  act(() => showSettings('3 回目のやめる'))();
  act(() => showSettings('4 回目のやめる'))(); // もう一度 S8 へ移る操作
  waits[2].d.resolve(false);
  waits[3].d.resolve(true);
  await tick();
  assert.deepEqual(drawn, [['4 回目のやめる', false]], '後の待ちだけが描く');

  act(() => showSettings('5 回目のやめる'))();
  waits[4].d.resolve(false);
  await tick();
  assert.deepEqual(drawn.at(-1), ['5 回目のやめる', true], '操作がなければ答えで描く');
});
