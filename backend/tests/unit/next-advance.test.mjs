// 同じ日に続けて出す規則（public/js/rules.js。contracts/data.md の 2、4、5、9、11。PRD r11 の AC-8 10 通り目、AC-10、AC-13、AC-14、AC-33、AC-35〜AC-37、design の D-40、D-44、U-17）。
// 保存の回数は main.js と同じ手順（規則 → markPersist → changed なら save を 1 回）を fakeStorage で数える。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import * as R from '../../public/js/rules.js';
import { openStore, save, KEY } from '../../public/js/store.js';
import { validateData } from '../../public/js/validate.js';
import { BACKEND_DIR, FIXTURES_DIR, fakeStorage, readJsonFile } from './helpers.mjs';

const TASKS = readJsonFile(path.join(BACKEND_DIR, 'public', 'data', 'tasks.json')).tasks;
const seed = (name) => readJsonFile(path.join(FIXTURES_DIR, 'seeds', name));
const v1 = (name) => readJsonFile(path.join(FIXTURES_DIR, 'data', 'v1', name));
const idsOf = (area, level) => TASKS.filter((t) => t.area === area && t.level === level).map((t) => t.id).sort();

const rowOf = (date, id, report, extra = {}) => {
  const t = TASKS.find((x) => x.id === id);
  return { date, taskId: id, area: t.area, level: t.level, mode: t.mode, answer: '', report, ...(report === 'done' ? { helpful: 'unanswered' } : {}), ...extra };
};

const base = (area, level, history, extra = {}) => ({
  formatVersion: 1,
  app: 'kyounoitte',
  firstOpenDate: history[0]?.date ?? '2026-11-01',
  diagnosis: { area, level, years: '1to3', completedOn: history[0]?.date ?? '2026-11-01' },
  levels: { [area]: level },
  history,
  ...extra,
});

/** main.js の issueByAction と同じ：markPersist → changed なら setItem 1 回。 */
function act(storage, r, canPersist = true) {
  const m = R.markPersist(r, canPersist);
  if (m.changed) assert.equal(save(storage, m.data), true);
  return m;
}
const setItems = (st) => st.calls.filter((c) => c === 'setItem').length;
const stored = (st) => JSON.parse(st.map.get(KEY));

// ---- 4 の 6 の順（2026-11-05 の入れ替え）----

test('起動：今日の current と今日の行が両方あれば、6-2 が先で S3（2 件目の再読み込みが S5 / S6 に化けない）', () => {
  const d = v1('valid-same-day-rows-never.json');
  assert.deepEqual(validateData(d), []);
  const r = R.startOfDay(d, '2026-11-05', TASKS);
  assert.equal(r.state, 'task.today');
  assert.equal(r.changed, false);
  assert.equal(r.data.current.taskId, 'frontend-beginner-003');
  assert.equal(R.nthToday(r.data), 3);
});

test('起動：今日の行が何行あっても、配列で最も後ろの今日の行で S5 / S6 を決める', () => {
  const h = [rowOf('2026-11-03', 'backend-intermediate-001', 'too_hard'), rowOf('2026-11-03', 'backend-intermediate-002', 'done')];
  assert.equal(R.startOfDay(base('backend', 'intermediate', h), '2026-11-03', TASKS).state, 'task.done');
  const h2 = [h[1], { ...h[0] }];
  assert.equal(R.startOfDay(base('backend', 'intermediate', h2), '2026-11-03', TASKS).state, 'task.skipped');
});

// ---- task.next ----

test('task.next：S5 から同じ日の 2 件目を current に入れ、setItem は 1 回、印がなければ device.persistRequested も同じ保存に（data.md の 2、11、AC-13）', () => {
  const s = seed('seed-ac14-three-completed.json');
  const day = '2026-11-03';
  const st = fakeStorage({ [KEY]: JSON.stringify(s) });
  const o = openStore(() => st);
  const opened = R.planDay(o.data, day, TASKS, { canPersist: true });
  assert.equal(opened.state, 'task.done');
  assert.equal(opened.changed, false);
  assert.equal(opened.askPersist, false, '今日の課題がもうある起動（6-3）では求めない');
  st.calls.length = 0;
  const m = act(st, R.nextTask(opened.data, day, TASKS));
  assert.equal(m.state, 'task.today');
  assert.equal(m.issued, true);
  assert.equal(m.askPersist, true);
  assert.equal(setItems(st), 1);
  const d = stored(st);
  assert.equal(d.device.persistRequested, true);
  assert.equal(d.current.date, day);
  assert.equal(d.current.taskId, 'backend-intermediate-004');
  assert.equal(R.nthToday(d), 2);
  assert.equal(R.stats(d, new Date(2026, 10, 3)).issued, 4);
  assert.deepEqual(validateData(d), []);
  // 再読み込みしても同じ ID（6-2）
  const again = R.startOfDay(d, day, TASKS);
  assert.equal(again.state, 'task.today');
  assert.equal(again.data.current.taskId, d.current.taskId);
  assert.equal(again.changed, false);
  // 印があるので次の task.next では求めない
  const after = R.reportTask(d, 'no_time', '');
  const m2 = act(st, R.nextTask(after, day, TASKS));
  assert.equal(m2.askPersist, false);
  assert.equal(R.nthToday(m2.data), 3);
});

test('task.next：組を出し終えていれば S7 で保存しない（changed=false）。S7 を再読み込みすると今日の最後の行の S5 / S6 に戻る', () => {
  const ids = idsOf('backend', 'intermediate');
  const h = ids.map((id, i) => rowOf(i === ids.length - 1 ? '2026-11-20' : `2026-11-${String(i + 1).padStart(2, '0')}`, id, 'done'));
  const d = base('backend', 'intermediate', h);
  const st = fakeStorage({ [KEY]: JSON.stringify(d) });
  const m = act(st, R.nextTask(d, '2026-11-20', TASKS));
  assert.equal(m.state, 'task.exhausted');
  assert.equal(m.changed, false);
  assert.equal(m.askPersist, false, 'S7 では persist() を呼ばない');
  assert.equal(setItems(st), 0);
  assert.equal(R.startOfDay(d, '2026-11-20', TASKS).state, 'task.done');
  // 読み込みで着いた S7（今日の行も current もない日）は再読み込みしても S7
  assert.equal(R.startOfDay(d, '2026-11-21', TASKS).state, 'task.exhausted');
});

test('task.next：今日の current がもうあれば上書きしない（別のタブが出した後）', () => {
  const d = v1('valid-same-day-rows-never.json');
  const r = R.nextTask(d, '2026-11-05', TASKS);
  assert.equal(r.state, 'task.today');
  assert.equal(r.changed, false);
  assert.equal(r.data.current.taskId, 'frontend-beginner-003');
});

test('AC-8 10 通り目：中で同じ日に難しすぎ 2 件 → task.next で同じ日の 3 件目が beginner。途中の S6 は levelHint → levelChanged（初級）', () => {
  const day = '2026-11-03';
  const s = seed('seed-ac8-intermediate-same-day.json');
  const first = R.startOfDay(s, day, TASKS);
  assert.equal(first.state, 'task.today');
  assert.equal(first.data.current.level, 'intermediate');
  assert.equal(R.nthToday(first.data), 1);
  let d = R.reportTask(first.data, 'too_hard', '');
  assert.equal(R.startOfDay(d, day, TASKS).state, 'task.skipped');
  assert.deepEqual(R.levelNotice(d, day), { kind: 'levelHint', level: null });
  const second = R.nextTask(d, day, TASKS);
  assert.equal(second.data.current.level, 'intermediate');
  assert.equal(R.nthToday(second.data), 2);
  d = R.reportTask(second.data, 'too_hard', '');
  assert.equal(d.levels.backend, 'beginner');
  assert.deepEqual(R.levelNotice(d, day), { kind: 'levelChanged', level: 'beginner' });
  const third = R.nextTask(d, day, TASKS);
  assert.equal(third.state, 'task.today');
  assert.equal(third.data.current.level, 'beginner');
  assert.equal(third.data.current.area, 'backend');
  assert.equal(R.nthToday(third.data), 3);
  const ids = [first, second, third].map((x) => x.data.current.taskId);
  assert.equal(new Set([...ids, ...s.history.map((r) => r.taskId)]).size, ids.length + s.history.length, 'ID は過去と重ならない');
  assert.deepEqual(validateData(third.data), []);
  assert.equal(R.startOfDay(third.data, day, TASKS).data.current.taskId, ids[2], '再読み込みしても同じ ID');
});

// ---- S6 の段階の知らせ ----

test('levelNotice：no_time と done では null、初級の難しすぎと上級の簡単すぎは levelHint（動かない）、段階がその後に別の理由で戻っていれば levelHint', () => {
  const day = '2026-11-03';
  const mk = (level, reports) => {
    const ids = idsOf('backend', level);
    const h = reports.map((rep, i) => rowOf(i === reports.length - 1 ? day : `2026-11-0${i + 1}`, ids[i], rep));
    return base('backend', level, h);
  };
  assert.equal(R.levelNotice(mk('intermediate', ['done', 'no_time']), day), null);
  assert.equal(R.levelNotice(mk('intermediate', ['too_hard', 'done']), day), null);
  assert.equal(R.levelNotice(mk('intermediate', ['done', 'too_hard']), day).kind, 'levelHint');
  assert.equal(R.levelNotice(mk('beginner', ['too_hard', 'too_hard']), day).kind, 'levelHint');
  assert.equal(R.levelNotice(mk('advanced', ['too_easy', 'too_easy']), day).kind, 'levelHint');
  const up = mk('intermediate', ['too_easy', 'too_easy']);
  up.levels.backend = 'advanced';
  assert.deepEqual(R.levelNotice(up, day), { kind: 'levelChanged', level: 'advanced' });
  up.levels.backend = 'intermediate';
  assert.equal(R.levelNotice(up, day).kind, 'levelHint', '(2) 今の levels が動いた先と違う');
  assert.equal(R.levelNotice(up, '2026-11-04'), null, '今日の行がない');
});

// ---- task.exhausted.advance ----

test('advance：初級を出し終えた S7 から levels を中級に上げ、同じ日に中級の最小の未出 ID を current に（setItem 1 回、印も）', () => {
  const ids = idsOf('backend', 'beginner');
  const h = ids.map((id, i) => rowOf(`2026-11-${String(i + 1).padStart(2, '0')}`, id, 'done'));
  const d = base('backend', 'beginner', h);
  const day = '2026-11-20';
  assert.equal(R.startOfDay(d, day, TASKS).state, 'task.exhausted');
  const st = fakeStorage({ [KEY]: JSON.stringify(d) });
  const m = act(st, R.advanceLevel(d, day, TASKS));
  assert.equal(m.state, 'task.today');
  assert.equal(m.issued, true);
  assert.equal(m.askPersist, true);
  assert.equal(setItems(st), 1);
  const saved = stored(st);
  assert.equal(saved.levels.backend, 'intermediate');
  assert.equal(saved.current.taskId, 'backend-intermediate-001');
  assert.equal(saved.device.persistRequested, true);
  assert.deepEqual(validateData(saved), []);
  assert.deepEqual(R.progressOfCurrent(saved, TASKS), { index: 1, total: 14 });
});

test('advance：次の段階も出し終えていれば levels だけを保存して新しい段階の S7（persist は呼ばない）。上級では何もしない', () => {
  const h = [...idsOf('backend', 'beginner'), ...idsOf('backend', 'intermediate')].map((id, i) => rowOf(`2026-10-${String(i + 1).padStart(2, '0')}`, id, 'done'));
  const d = base('backend', 'beginner', h);
  const st = fakeStorage({ [KEY]: JSON.stringify(d) });
  const info = R.exhaustedInfo(d, TASKS);
  assert.equal(info.variant, 'levelDone');
  assert.equal(info.note, 'nextDone');
  const m = act(st, R.advanceLevel(d, '2026-11-20', TASKS));
  assert.equal(m.state, 'task.exhausted');
  assert.equal(m.issued, false);
  assert.equal(m.askPersist, false);
  assert.equal(setItems(st), 1);
  const saved = stored(st);
  assert.equal(saved.levels.backend, 'intermediate');
  assert.equal(saved.current, undefined);
  const info2 = R.exhaustedInfo(saved, TASKS);
  assert.deepEqual([info2.variant, info2.level, info2.nextLevel, info2.note], ['levelDone', 'intermediate', 'advanced', null], '中級の S7 で補足なし');
  // 上級の allDone
  const adv = base('backend', 'advanced', idsOf('backend', 'advanced').map((id, i) => rowOf(`2026-11-0${i + 1}`, id, 'done')));
  const allDone = R.exhaustedInfo(adv, TASKS);
  assert.deepEqual(allDone, { variant: 'allDone', area: 'backend', level: 'advanced', total: 7, nextLevel: null, note: null });
  const noop = R.advanceLevel(adv, '2026-11-20', TASKS);
  assert.equal(noop.changed, false);
  assert.equal(noop.data, adv);
});

test('S7 の補足（D-40）：中級の行があり中級に未出が残れば seenNext、中級の行がなければ補足なし', () => {
  const pre = ['backend-intermediate-001', 'backend-intermediate-002'].map((id, i) => rowOf(`2026-10-0${i + 1}`, id, 'too_hard'));
  const beg = idsOf('backend', 'beginner').map((id, i) => rowOf(`2026-10-${String(i + 10).padStart(2, '0')}`, id, 'done'));
  const d = base('backend', 'beginner', [...pre, ...beg]);
  d.diagnosis.level = 'intermediate';
  assert.deepEqual(validateData(d), []);
  assert.equal(R.startOfDay(d, '2026-11-01', TASKS).state, 'task.exhausted');
  const info = R.exhaustedInfo(d, TASKS);
  assert.deepEqual(info, { variant: 'levelDone', area: 'backend', level: 'beginner', total: 14, nextLevel: 'intermediate', note: 'seenNext' });
  const adv = R.advanceLevel(d, '2026-11-01', TASKS);
  assert.equal(adv.data.current.taskId, 'backend-intermediate-003', '未出の中級の最小 ID');
  const without = base('backend', 'beginner', beg);
  assert.equal(R.exhaustedInfo(without, TASKS).note, null);
});

// ---- やり直しの行き先（data.md の 2）----

test('やり直し（AC-14 の 2 通り目）：今日の current があれば同じ課題のまま S3。完了して task.next で新しい領域の課題、その日の 2 件目', () => {
  const s = seed('seed-ac14-three-completed.json');
  const day = '2026-11-04';
  const opened = R.startOfDay(s, day, TASKS);
  const before = opened.data.current.taskId;
  const redo = R.finishRedo(opened.data, { area: 'frontend', level: 'intermediate', years: 'never' }, day, TASKS);
  assert.equal(redo.state, 'task.today');
  assert.equal(redo.changed, true, 'diagnosis を保存する');
  assert.equal(redo.issued, false);
  assert.equal(redo.data.current.taskId, before);
  assert.equal(redo.data.current.area, 'backend');
  assert.deepEqual(R.progressOfCurrent(redo.data, TASKS), { index: 4, total: 14 }, '表示中の課題の組で数える');
  assert.equal(R.stats(redo.data, new Date(2026, 10, 4)).completed, 3);
  const done = R.reportTask(redo.data, 'done', '');
  const next = R.nextTask(done, day, TASKS);
  assert.equal(next.data.current.area, 'frontend');
  assert.equal(next.data.current.taskId, 'frontend-intermediate-001');
  assert.equal(R.nthToday(next.data), 2);
  assert.equal(R.stats(next.data, new Date(2026, 10, 4)).completed, 4);
  assert.deepEqual(validateData(next.data), []);
});

test('やり直し：今日の current がなければ（S5、S6、S7）同じ日に新しい組から current。同じ組を選び直して出し終えていれば S7 で current なし', () => {
  const s = seed('seed-ac14-three-completed.json');
  const fromS5 = R.finishRedo(s, { area: 'git', level: 'beginner', years: 'lt1' }, '2026-11-03', TASKS);
  assert.equal(R.startOfDay(s, '2026-11-03', TASKS).state, 'task.done');
  assert.equal(fromS5.state, 'task.today');
  assert.equal(fromS5.issued, true);
  assert.equal(fromS5.data.current.taskId, 'git-beginner-001');
  assert.equal(fromS5.data.current.date, '2026-11-03');
  assert.equal(R.markPersist(fromS5, true).data.device.persistRequested, true);

  const adv = base('backend', 'advanced', idsOf('backend', 'advanced').map((id, i) => rowOf(`2026-11-0${i + 1}`, id, 'done')));
  const same = R.finishRedo(adv, { area: 'backend', level: 'advanced', years: 'gte5' }, '2026-11-20', TASKS);
  assert.equal(same.state, 'task.exhausted');
  assert.equal(same.changed, true);
  assert.equal(same.data.current, undefined);
  assert.equal(R.markPersist(same, true).askPersist, false);
});

// ---- 画面の数（data.md の 9）----

test('AC-36：3 件出した翌日の S3 の進み具合は 4 / 14（none の行も数える）', () => {
  const r = R.startOfDay(seed('seed-ac36-three-issued.json'), '2026-11-04', TASKS);
  assert.equal(r.data.current.taskId, 'backend-intermediate-004');
  assert.deepEqual(R.progressOfCurrent(r.data, TASKS), { index: 4, total: 14 });
  const done = R.reportTask(r.data, 'done', '');
  assert.deepEqual(R.progressOfRow(done.history, done.history.length - 1, TASKS), { index: 4, total: 14 }, '終えた課題の n / N は S3 と同じ');
});

test('AC-35：累計と節目。6 件の seed で 7 件目を完了すると累計 7、data-milestone は 7。前の累計は 6', () => {
  const s = seed('seed-ac35-six-completed.json');
  const r = R.startOfDay(s, '2026-11-07', TASKS);
  assert.equal(r.data.current.taskId, 'backend-intermediate-007');
  const done = R.reportTask(r.data, 'done', '');
  const count = R.completedCount(done);
  assert.equal(count, 7);
  assert.equal(R.milestoneOf(count), '7');
  assert.deepEqual([6, 8, 11, 29, 30, 99, 100, 101].map(R.milestoneOf), ['none', 'none', 'none', 'none', '30', 'none', '100', 'none']);
});

test('AC-37：金曜に task.next で出た課題を完了すると今週は 3 日のまま、extra は 1（同じ日の 2 件目）。翌週の月曜は 0', () => {
  const s = seed('seed-ac24-stats.json');
  const fri = new Date(2026, 10, 6, 10, 0);
  const m = R.nextTask(s, '2026-11-06', TASKS);
  assert.equal(m.state, 'task.today');
  const done = R.reportTask(m.data, 'done', '');
  const st = R.stats(done, fri);
  assert.equal(st.daysCompletedWeek, 3);
  assert.equal(st.extraCompleted, 1, '11-04 の 2 件目だけ。11-06 は no_time の後の done 1 件なので数えない');
  assert.equal(R.daysCompletedWeek(done, new Date(2026, 10, 9)), 0);
});

test('組の最後（D-44）：未出があれば通常の文、0 件なら note.last で、差し込みは次に出す組（段階が動いた後の段階）', () => {
  const ids = idsOf('backend', 'intermediate');
  const h13 = ids.slice(0, 13).map((id, i) => rowOf(`2026-10-${String(i + 1).padStart(2, '0')}`, id, 'done'));
  const d13 = base('backend', 'intermediate', h13);
  assert.equal(R.nextNote(d13, TASKS).last, false);
  const r = R.startOfDay(d13, '2026-11-01', TASKS);
  const done = R.reportTask(r.data, 'done', '');
  assert.deepEqual(R.nextNote(done, TASKS), { last: true, area: 'backend', level: 'intermediate' });
  assert.equal(R.nextTask(done, '2026-11-01', TASKS).state, 'task.exhausted', 'note.last なら task.next は S7');

  // 初級を出し終えて中級に進み、中級で難しすぎ 2 回 → 初級に戻る。初級は出し終えているので note.last は初級の文
  const beg = idsOf('backend', 'beginner').map((id, i) => rowOf(`2026-10-${String(i + 1).padStart(2, '0')}`, id, 'done'));
  let d = base('backend', 'beginner', beg);
  d = R.advanceLevel(d, '2026-11-01', TASKS).data;
  d = R.reportTask(d, 'too_hard', '');
  d = R.nextTask(d, '2026-11-01', TASKS).data;
  d = R.reportTask(d, 'too_hard', '');
  assert.equal(d.levels.backend, 'beginner');
  assert.deepEqual(R.levelNotice(d, '2026-11-01'), { kind: 'levelChanged', level: 'beginner' });
  assert.deepEqual(R.nextNote(d, TASKS), { last: true, area: 'backend', level: 'beginner' });
});

test('出した件数（issued）は本人の操作でだけ増える：同じ日の起動を何度しても変わらない', () => {
  const s = seed('seed-ac14-three-completed.json');
  let d = s;
  for (let i = 0; i < 3; i++) d = R.startOfDay(d, '2026-11-03', TASKS).data;
  assert.equal(R.stats(d, new Date(2026, 10, 3)).issued, 3);
  d = R.nextTask(d, '2026-11-03', TASKS).data;
  assert.equal(R.stats(d, new Date(2026, 10, 3)).issued, 4);
});

// ---- U-17 ----

test('U-17：日付が変わった後に取り消した操作が task.next なら知らせを出さない。advance やほかの操作は S3 / S7 で出し、S5 / S6 では出さない', () => {
  assert.equal(R.showsDayChanged('task.next', 'task.today'), false);
  assert.equal(R.showsDayChanged('task.next', 'task.exhausted'), false);
  assert.equal(R.showsDayChanged('task.exhausted.advance', 'task.today'), true);
  assert.equal(R.showsDayChanged('task.exhausted.advance', 'task.exhausted'), true);
  assert.equal(R.showsDayChanged('', 'task.today'), true);
  assert.equal(R.showsDayChanged('', 'task.done'), false);
  assert.equal(R.showsDayChanged('task.next', 'task.skipped'), false);
  // S5 のまま翌日になって task.next を押す：移す current はなく、6-4 で翌日の 1 件目（nth 1）
  const s = seed('seed-ac14-three-completed.json');
  const r = R.planDay(s, '2026-11-04', TASKS, { canPersist: true });
  assert.equal(r.state, 'task.today');
  assert.equal(R.nthToday(r.data), 1);
});
