// 状態を決める規則（public/js/rules.js。contracts/data.md の 3、4、5、7、9）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import * as R from '../../public/js/rules.js';
import { validateData } from '../../public/js/validate.js';
import { BACKEND_DIR, FIXTURES_DIR, readJsonFile } from './helpers.mjs';

const TASKS = readJsonFile(path.join(BACKEND_DIR, 'public', 'data', 'tasks.json')).tasks;
const seed = (name) => readJsonFile(path.join(FIXTURES_DIR, 'seeds', name));

const row = (date, n, level, report, extra = {}) => ({
  date,
  taskId: `backend-${level}-${String(n).padStart(3, '0')}`,
  area: 'backend',
  level,
  mode: 'in_app',
  answer: '',
  report,
  ...(report === 'done' ? { helpful: 'unanswered' } : {}),
  ...extra,
});

/** 古い 2 行（olders）の後に、今日 current を出して report を申告し、翌日の段階を返す。 */
function nextLevel({ levels, olders, report }) {
  const data = {
    formatVersion: 1,
    app: 'kyounoitte',
    firstOpenDate: '2026-11-01',
    diagnosis: { area: 'backend', level: levels.backend, years: '1to3', completedOn: '2026-11-01' },
    levels,
    history: olders,
  };
  const day3 = R.startOfDay(data, '2026-11-03', TASKS);
  assert.equal(day3.state, 'task.today');
  const after = R.reportTask(day3.data, report, '');
  assert.deepEqual(validateData(after), []);
  const day4 = R.startOfDay(after, '2026-11-04', TASKS);
  assert.equal(day4.state, 'task.today');
  return day4.data.current.level;
}

const I = 'intermediate';
const AC8 = [
  // [通り, levels, 古い 2 行の (段階, 申告), 画面の申告, 期待]
  ['1：中で完了、中で難しすぎ → 難しすぎ', I, [[I, 'done'], [I, 'too_hard']], 'too_hard', 'beginner'],
  ['2：中で簡単すぎ → 簡単すぎ', I, [[I, 'done'], [I, 'too_easy']], 'too_easy', 'advanced'],
  ['3：難しすぎの後に完了で途切れる', I, [[I, 'too_hard'], [I, 'done']], 'too_hard', I],
  ['4：難しすぎと簡単すぎが混ざると動かない', I, [[I, 'done'], [I, 'too_easy']], 'too_hard', I],
  ['5：今日はできないで途切れる', I, [[I, 'too_hard'], [I, 'no_time']], 'too_hard', I],
  ['6：初級で難しすぎが続いても下がらない', 'beginner', [['beginner', 'done'], ['beginner', 'too_hard']], 'too_hard', 'beginner'],
  ['7：上級で簡単すぎが続いても上がらない', 'advanced', [['advanced', 'done'], ['advanced', 'too_easy']], 'too_easy', 'advanced'],
  ['8：中で難しすぎ、中で none → 難しすぎ（none は数えず流れも切らない）', I, [[I, 'too_hard'], [I, 'none']], 'too_hard', 'beginner'],
  ['9：上で難しすぎ 2 回（levels は中）→ 難しすぎ（段階の違う行は数えない）', I, [['advanced', 'too_hard'], ['advanced', 'too_hard']], 'too_hard', I],
];

for (const [name, level, olders, report, expected] of AC8) {
  test(`AC-8 段階の規則 ${name} → ${expected}`, () => {
    const rows = olders.map(([lv, rep], i) => row(`2026-11-0${i + 1}`, i + 1, lv, rep));
    assert.equal(nextLevel({ levels: { backend: level }, olders: rows, report }), expected);
  });
}

test('AC-8 契約の seed 3 件（1、8、9 通り目）が data.md の 5 の表どおり', () => {
  const cases = [
    ['seed-ac8-intermediate-one-too-hard.json', 'beginner'],
    ['seed-ac8-intermediate-too-hard-then-none.json', 'beginner'],
    ['seed-ac8-intermediate-after-advanced-two-too-hard.json', 'intermediate'],
  ];
  for (const [file, expected] of cases) {
    const s = seed(file);
    assert.equal(nextLevel({ levels: s.levels, olders: s.history, report: 'too_hard' }), expected, file);
  }
});

test('変わった段階は翌日から効く（申告した日は新しい課題を出さない）', () => {
  const s = seed('seed-ac8-intermediate-one-too-hard.json');
  const day3 = R.startOfDay(s, '2026-11-03', TASKS);
  const after = R.reportTask(day3.data, 'too_hard', '');
  assert.equal(after.levels.backend, 'beginner');
  const sameDay = R.startOfDay(after, '2026-11-03', TASKS);
  assert.equal(sameDay.state, 'task.skipped');
  assert.equal(sameDay.issued, false);
  assert.equal(sameDay.data.current, undefined);
});

test('pickTask は目標の組で、出していない課題のうち ID が最小のもの（AC-6）', () => {
  const s = seed('seed-ac8-intermediate-one-too-hard.json');
  assert.equal(R.pickTask(s, TASKS).id, 'backend-intermediate-003');
  const used = structuredClone(s);
  used.current = { date: '2026-11-03', taskId: 'backend-intermediate-003', area: 'backend', level: I, mode: 'in_app', answer: '' };
  assert.equal(R.pickTask(used, TASKS).id, 'backend-intermediate-004');
});

test('課題を出し尽くすと task.exhausted（AC-10、AC-14）', () => {
  const s = seed('seed-ac14-three-completed.json');
  const r = R.startOfDay(s, '2026-11-30', TASKS.filter((t) => s.history.some((h) => h.taskId === t.id)));
  assert.equal(r.state, 'task.exhausted');
  assert.equal(r.issued, false);
});

test('日付が変わると、申告のない current は report=none の行になり答えも残る（AC-32）', () => {
  const s = seed('seed-ac8-intermediate-one-too-hard.json');
  const day3 = R.startOfDay(s, '2026-11-03', TASKS);
  const typed = R.setAnswer(day3.data, 'あ'.repeat(200));
  const day4 = R.startOfDay(typed, '2026-11-04', TASKS);
  const last = day4.data.history.at(-1);
  assert.equal(last.report, 'none');
  assert.equal(last.answer, 'あ'.repeat(200));
  assert.equal(last.helpful, undefined);
  assert.equal(day4.data.current.answer, '');
  assert.notEqual(day4.data.current.taskId, last.taskId);
  assert.deepEqual(validateData(day4.data), []);
});

test('同じ日にもう一度開いても課題は増えず、データも変えない', () => {
  const s = seed('seed-ac8-intermediate-one-too-hard.json');
  const first = R.startOfDay(s, '2026-11-03', TASKS);
  const again = R.startOfDay(first.data, '2026-11-03', TASKS);
  assert.equal(again.state, 'task.today');
  assert.equal(again.changed, false);
  assert.equal(again.data, first.data);
});

test('規則の関数は渡したデータを書き換えない', () => {
  const s = seed('seed-ac8-intermediate-one-too-hard.json');
  const before = JSON.stringify(s);
  const d = R.startOfDay(s, '2026-11-03', TASKS).data;
  const snap = JSON.stringify(d);
  R.reportTask(d, 'done', 'x');
  R.setAnswer(d, 'y');
  R.exportOf(d);
  R.withDevice(d, { homeGuideClosed: true });
  assert.equal(JSON.stringify(s), before);
  assert.equal(JSON.stringify(d), snap);
});

test('診断：1 問目で firstOpenDate を書き、領域を変えると 2 問目以降を消す（data.md の 2、3）', () => {
  const a = R.answerInitial(null, 1, 'backend', '2026-11-01');
  assert.equal(a.firstOpenDate, '2026-11-01');
  assert.equal(R.classify(a), 'inProgress');
  assert.equal(R.firstUnanswered(a.diagnosis), 2);
  const b = R.answerInitial(a, 2, 'beginner', '2026-11-02');
  assert.equal(b.firstOpenDate, '2026-11-01', '2 回目以降は上書きしない');
  const c = R.answerInitial(b, 1, 'git', '2026-11-02');
  assert.equal(c.diagnosis.level, undefined);
  assert.equal(c.firstOpenDate, '2026-11-01');
  const done = R.finishInitial(R.answerInitial(c, 2, 'beginner', '2026-11-02'), 'lt1', '2026-11-02', TASKS);
  assert.equal(done.state, 'task.today');
  assert.equal(done.data.current.taskId, 'git-beginner-001');
  assert.equal(R.classify(done.data), 'exists');
  assert.deepEqual(validateData(done.data), []);
});

test('完了の申告は helpful=unanswered で記録し、評価で置き換える（AC-7）', () => {
  const s = seed('seed-ac8-intermediate-one-too-hard.json');
  const d = R.reportTask(R.startOfDay(s, '2026-11-03', TASKS).data, 'done', 'ans');
  assert.equal(d.history.at(-1).helpful, 'unanswered');
  const rated = R.rateTask(d, '2026-11-03', 'not_helpful');
  assert.equal(rated.history.at(-1).helpful, 'not_helpful');
  const skipped = R.reportTask(R.startOfDay(s, '2026-11-03', TASKS).data, 'no_time', '');
  assert.equal(skipped.history.at(-1).helpful, undefined);
  assert.deepEqual(validateData(rated), []);
  assert.deepEqual(validateData(skipped), []);
});

test('書き出しは device を除き、読み込みは今のブラウザの device を残す（data.md の 7）', () => {
  const s = R.withDevice(seed('seed-ac24-stats.json'), { homeGuideClosed: true });
  const out = R.exportOf(s);
  assert.equal(out.device, undefined);
  const fileWithDevice = { ...out, device: { persistRequested: true } };
  const replaced = R.importReplacement(fileWithDevice, { device: { homeGuideClosed: true } });
  assert.deepEqual(replaced.device, { homeGuideClosed: true });
  assert.equal(R.importReplacement(fileWithDevice, null).device, undefined);
  assert.deepEqual(replaced.history, out.history);
});

test('統計の 9 つの値（AC-24、data.md の 9）を seed-ac24-stats で数える', () => {
  const s = seed('seed-ac24-stats.json');
  const today = s.current?.date ?? s.history.at(-1).date;
  const d = new Date(`${today}T12:00:00`);
  const weekStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 6);
  const ws = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
  const st = R.stats(s, today, ws);
  const h = s.history;
  assert.equal(st.issued, h.length + (s.current ? 1 : 0));
  assert.equal(st.completed, h.filter((r) => r.report === 'done').length);
  assert.equal(st.tooHard, h.filter((r) => r.report === 'too_hard').length);
  assert.equal(st.noTime, h.filter((r) => r.report === 'no_time').length);
  assert.equal(st.rated, h.filter((r) => ['helpful', 'not_helpful'].includes(r.helpful)).length);
  assert.ok(st.daysCompleted7d <= 7);
  assert.equal(st.firstOpenDate, s.firstOpenDate);
});

test('直近 7 暦日は今日から 6 日前までで、同じ日は 1 つに数える', () => {
  const rows = ['2026-10-27', '2026-10-28', '2026-11-01', '2026-11-03'].map((dt, i) => row(dt, i + 1, I, 'done'));
  const data = { history: rows, firstOpenDate: '2026-10-27' };
  assert.equal(R.stats(data, '2026-11-03', '2026-10-28').daysCompleted7d, 3);
  assert.equal(R.stats(data, '2026-11-03', '2026-10-28').firstDayCompleted, true);
});
