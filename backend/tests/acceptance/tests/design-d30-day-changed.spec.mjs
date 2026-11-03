// design D-30（AC にない状態）：画面を開いたまま日付が変わった後の最初の操作で着いた S3 / S7 の知らせ `task.dayChanged`。
// 根拠：PRD 11 の冒頭「日付をまたいだ申告はできない」、design/001-daily-learning.md の 2（表の下「AC にない状態」）、4 の D-30、5 の S3 / S7、7 の task.dayChanged、
// contracts/data.md の 4「画面を開いたまま日付が変わったとき」、contracts/identifiers.md の 3、contracts/test-hooks.md の W-3（読み込まずに setFixedTime を呼び直す）。
// PRD の AC の Then にない要素（知らせ）を確かめるので、名前は `DESIGN_D30_`（AC 番号を付けず、G3 の AC の表には混ぜない。test-plan.md の 2 章）。
// U-15（design 10、contracts/data.md 4「対象の外」、docs/approvals/delegation.md 2026-11-04）：初回の S2 では日付を確かめず、そのまま実行する。名前は `DESIGN_U15_`。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectSeed, loadContractFixture, makeSeed, tasksOf, addDays } from '../helpers/seed.mjs';

const SEED = 'seeds/seed-ac14-three-completed.json';
const DAY = '2026-11-04';
const NEXT = '2026-11-05';

/** 知らせの要素の確かめ（identifiers.md 3）：1 件、role=status、描いた直後に activeElement、<main> の中の他の data-testid より前。 */
async function expectDayChangedNotice(page, firstTestIdOfScreen, ja) {
  const notice = app.tid(page, 'task.dayChanged');
  await expect(notice).toHaveCount(1);
  await expect(notice).toBeVisible();
  await expect(notice).toHaveAttribute('role', 'status');
  await expect(notice).toHaveText(ja['task.dayChanged']);
  await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? null), { timeout: app.WAIT_MS }).toBe('task.dayChanged');
  const precedes = await page.evaluate(
    (id) => {
      const notice = document.querySelector('[data-testid="task.dayChanged"]');
      const first = document.querySelector(`[data-testid="${id}"]`);
      if (!notice || !first) return null;
      return Boolean(notice.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING);
    },
    firstTestIdOfScreen,
  );
  expect(precedes, `task.dayChanged が ${firstTestIdOfScreen} より前にある`).toBe(true);
}

test('DESIGN_D30_画面を開いたまま翌日になった後に完了を押すと_翌日のS3の先頭にtask.dayChangedが1件でフォーカスがあり_入力では消えず_次の操作と再読み込みで消える', async ({ context, page, baseURL, request }, testInfo) => {
  const ja = await app.loadStrings(request, 'ja');
  expect(ja).toHaveProperty(['task.dayChanged']);
  await injectSeed(context, loadContractFixture(SEED));
  await app.fixDate(page, DAY, '23:55:00');
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  const task = await app.readTask(page);
  await expect(app.tid(page, 'task.dayChanged')).toHaveCount(0);

  await app.fixDate(page, NEXT, '00:05:00');
  await app.tid(page, 'task.report.done').click();
  await app.expectState(page, 'task.today');
  const next = await app.readTask(page);
  expect(next.id).not.toBe(task.id);
  await expectDayChangedNotice(page, 'task.today.label', ja);
  await app.shot(page, testInfo, 'DESIGN_D30_task.today_dayChanged');

  // 答えの欄への入力では消えない（identifiers.md 3）
  await app.tid(page, 'task.answer').fill('翌日に書いた答え');
  await expect(app.tid(page, 'task.answer.saved')).toBeVisible({ timeout: 1000 });
  await expect(app.tid(page, 'task.dayChanged')).toHaveCount(1);

  // 次の操作（ヘッダーのアプリ名。4 の判定をやり直して同じ日の S3 に戻る）の始めに消える
  await app.tid(page, 'app.name').click();
  await app.expectState(page, 'task.today');
  expect((await app.readTask(page)).id).toBe(next.id);
  await expect(app.tid(page, 'task.dayChanged')).toHaveCount(0);

  // 再読み込みで着いた S3 にもない
  await page.reload();
  await app.expectState(page, 'task.today');
  expect((await app.readTask(page)).id).toBe(next.id);
  await expect(app.tid(page, 'task.dayChanged')).toHaveCount(0);
});

test('DESIGN_D30_task.rateのまま翌日になった後に役に立ったを押すと_評価は記録されずhelpfulはunansweredのままで_翌日のS3にtask.dayChangedが1件', async ({ context, page, baseURL, request }) => {
  // PRD 11 の冒頭の例「11-05 23:59 に完了し、task.rate のまま 0:01 に「役に立った」を押すと、評価は保存されません」（契約 data.md 4 の例）
  const ja = await app.loadStrings(request, 'ja');
  await injectSeed(context, loadContractFixture(SEED));
  await app.fixDate(page, DAY, '23:59:00');
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  const task = await app.readTask(page);
  await app.tid(page, 'task.report.done').click();
  await app.expectState(page, 'task.rate');

  await app.fixDate(page, NEXT, '00:01:00');
  await app.tid(page, 'task.rate.helpful').click();
  await app.expectState(page, 'task.today');
  const next = await app.readTask(page);
  expect(next.id).not.toBe(task.id);
  await expectDayChangedNotice(page, 'task.today.label', ja);

  await app.goHistory(page);
  const rows = await app.readHistoryRows(page);
  const row = rows.find((r) => r.taskId === task.id);
  expect(row).toMatchObject({ date: DAY, report: 'done', helpful: 'unanswered' });
  expect(rows.filter((r) => r.taskId === task.id)).toHaveLength(1);
});

test('DESIGN_D30_最後の課題を開いたまま翌日になった後に完了を押すと_task.exhaustedの先頭にtask.dayChangedが1件でフォーカスがあり_前の課題はnoneの行に移る', async ({ context, page, baseURL, request }, testInfo) => {
  // S7 でも知らせが出る（design 5 の S7、identifiers.md 3）。本番の課題集の backend/intermediate を、最後の 1 件を残して出し終えた seed を作る（W-4、W-7）
  const ja = await app.loadStrings(request, 'ja');
  const tasks = await app.loadTasks(request);
  const list = tasksOf(tasks, 'backend', 'intermediate');
  expect(list.length, 'backend/intermediate の課題の数').toBeGreaterThanOrEqual(7);
  const firstOpenDate = '2026-09-01';
  const seed = makeSeed({
    area: 'backend',
    level: 'intermediate',
    firstOpenDate,
    rows: list.slice(0, -1).map((t) => ({ taskId: t.id, report: 'done', mode: t.mode, helpful: 'helpful' })),
  });
  const last = list.at(-1);
  const day = addDays(firstOpenDate, list.length - 1);
  await injectSeed(context, seed);
  await app.fixDate(page, day, '23:55:00');
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  expect((await app.readTask(page)).id, '残した最後の課題が出る').toBe(last.id);

  await app.fixDate(page, addDays(day, 1), '00:05:00');
  await app.tid(page, 'task.report.done').click();
  await app.expectState(page, 'task.exhausted');
  await expectDayChangedNotice(page, 'task.exhausted.message', ja);
  await expect(app.tid(page, 'task.exhausted.redo')).toHaveCount(1);
  await app.shot(page, testInfo, 'DESIGN_D30_task.exhausted_dayChanged');

  await app.goHistory(page);
  const rows = await app.readHistoryRows(page);
  expect(rows[0]).toMatchObject({ taskId: last.id, date: day, report: 'none' });
  expect(rows.filter((r) => r.report === 'done')).toHaveLength(list.length - 1);
});

test('DESIGN_U15_初回の診断の2問目を23時59分に出して0時1分に確定すると_そのまま3問目に進み_firstOpenDateは1問目の日でcompletedOnと課題の日付は確定した日', async ({ page, baseURL }, testInfo) => {
  // 保存データが「なし」「診断の途中」の画面では日付を確かめず、操作をそのまま実行する（contracts/data.md 4「対象の外（design の U-15）」の例）
  await app.fixDate(page, '2026-11-03', '23:59:00');
  await app.open(page, baseURL);
  await app.expectState(page, 'diagnosis.start');
  await app.tid(page, 'diagnosis.start.begin').click();
  await app.expectState(page, 'diagnosis.question');
  const progress = app.tid(page, 'diagnosis.progress');
  await expect(progress).toHaveAttribute('data-question-index', '1');
  await app.tid(page, 'area.frontend').check();
  await app.tid(page, 'diagnosis.next').click();
  await expect(progress).toHaveAttribute('data-question-index', '2');
  await app.tid(page, 'level.beginner').check();

  await app.fixDate(page, '2026-11-04', '00:01:00');
  await app.tid(page, 'diagnosis.next').click();
  await expect(progress).toHaveAttribute('data-question-index', '3');
  await expect(app.tid(page, 'task.dayChanged')).toHaveCount(0);
  await app.tid(page, 'years.lt1').check();
  await app.tid(page, 'diagnosis.finish').click();
  await app.expectState(page, 'task.today');
  const task = await app.readTask(page);
  expect(task.area).toBe('frontend');
  expect(task.level).toBe('beginner');
  await expect(app.tid(page, 'task.dayChanged')).toHaveCount(0);

  await app.goSettings(page);
  const { json } = await app.exportJson(page);
  testInfo.annotations.push({ type: '日付', description: JSON.stringify({ firstOpenDate: json.firstOpenDate, completedOn: json.diagnosis?.completedOn, current: json.current?.date }) });
  expect(json.firstOpenDate).toBe('2026-11-03');
  expect(json.diagnosis).toMatchObject({ area: 'frontend', level: 'beginner', years: 'lt1', completedOn: '2026-11-04' });
  expect(json.current).toMatchObject({ date: '2026-11-04', taskId: task.id, answer: '' });
  expect(json.history).toEqual([]);
});
