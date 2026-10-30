// AC-5：完了すると、その日はもう課題が出ない。AC-6：翌日には過去に出していない課題が出る。
// AC-7：難しすぎ・簡単すぎ・今日はできない → task.skipped。AC-9：「役に立った」は完了の直後に 1 回だけ聞く。
// seed は contracts/fixtures/seeds/seed-ac14-three-completed.json（3 件完了、11-01〜11-03）。2026-11-04 に固定して開くと今日の課題が出る。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectSeed, loadContractFixture } from '../helpers/seed.mjs';

const SEED = 'seeds/seed-ac14-three-completed.json';
const SEEDED_IDS = ['backend-intermediate-001', 'backend-intermediate-002', 'backend-intermediate-003'];
const TODAY = '2026-11-04';

async function openToday(context, page, baseURL, day = TODAY) {
  await injectSeed(context, loadContractFixture(SEED));
  await app.fixDate(page, day);
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  return app.readTask(page);
}

test('AC5_完了するとtask.rateになり_答えるとtask.done_同じ日に再読み込みしてもtask.doneのまま', async ({ context, page, baseURL }, testInfo) => {
  const task = await openToday(context, page, baseURL);
  await app.tid(page, 'task.report.done').click();
  await app.expectState(page, 'task.rate');
  await app.shot(page, testInfo, 'AC5_task.rate');
  await app.tid(page, 'task.rate.helpful').click();
  await app.expectState(page, 'task.done');
  await app.shot(page, testInfo, 'AC5_task.done');

  await page.reload();
  await app.expectState(page, 'task.done');
  await expect(app.tid(page, 'task.today')).toHaveCount(0);
  await page.reload();
  await app.expectState(page, 'task.done');

  await app.goHistory(page);
  const rows = await app.readHistoryRows(page);
  expect(rows[0]).toMatchObject({ taskId: task.id, date: TODAY, report: 'done' });
});

test('AC6_翌日には過去に出した課題のIDと一致しない課題が出る', async ({ context, page, baseURL }) => {
  const first = await openToday(context, page, baseURL);
  expect(SEEDED_IDS).not.toContain(first.id);
  await app.tid(page, 'task.report.done').click();
  await app.expectState(page, 'task.rate');
  await app.tid(page, 'task.rate.close').click();
  await app.expectState(page, 'task.done');

  await app.fixDate(page, '2026-11-05');
  await page.reload();
  await app.expectState(page, 'task.today');
  const next = await app.readTask(page);
  expect([...SEEDED_IDS, first.id]).not.toContain(next.id);
  expect(next.area).toBe('backend');
});

for (const [button, report] of [
  ['task.report.tooHard', 'too_hard'],
  ['task.report.tooEasy', 'too_easy'],
  ['task.report.noTime', 'no_time'],
]) {
  test(`AC7_${report}を申告するとtask.skippedになり履歴に残り_再読み込みしても新しい課題は出ない`, async ({ context, page, baseURL }, testInfo) => {
    const task = await openToday(context, page, baseURL);
    await app.tid(page, button).click();
    await app.expectState(page, 'task.skipped');
    await app.shot(page, testInfo, `AC7_task.skipped_${report}`);

    await app.goHistory(page);
    const rows = await app.readHistoryRows(page);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({ taskId: task.id, date: TODAY, report });

    await page.reload();
    await app.expectState(page, 'task.skipped');
    await expect(app.tid(page, 'task.today')).toHaveCount(0);
  });
}

test('AC9_役に立ったを選ぶとtask.doneになり_再び聞かれず_履歴のdata-helpfulがhelpful', async ({ context, page, baseURL }) => {
  const task = await openToday(context, page, baseURL);
  await app.tid(page, 'task.report.done').click();
  await app.expectState(page, 'task.rate');
  await app.tid(page, 'task.rate.helpful').click();
  await app.expectState(page, 'task.done');
  await page.reload();
  await app.expectState(page, 'task.done');
  await expect(app.tid(page, 'task.rate.helpful')).toHaveCount(0);
  await app.goHistory(page);
  const rows = await app.readHistoryRows(page);
  expect(rows[0]).toMatchObject({ taskId: task.id, report: 'done', helpful: 'helpful' });
});

test('AC9_立たなかったを選ぶと履歴のdata-helpfulがnot_helpful', async ({ context, page, baseURL }) => {
  const task = await openToday(context, page, baseURL);
  await app.tid(page, 'task.report.done').click();
  await app.expectState(page, 'task.rate');
  await app.tid(page, 'task.rate.notHelpful').click();
  await app.expectState(page, 'task.done');
  await app.goHistory(page);
  const rows = await app.readHistoryRows(page);
  expect(rows[0]).toMatchObject({ taskId: task.id, report: 'done', helpful: 'not_helpful' });
});

test('AC9_選ばずに再読み込みするとtask.doneになり_履歴のdata-helpfulがunanswered', async ({ context, page, baseURL }) => {
  const task = await openToday(context, page, baseURL);
  await app.tid(page, 'task.report.done').click();
  await app.expectState(page, 'task.rate');
  await page.reload();
  await app.expectState(page, 'task.done');
  await page.reload();
  await app.expectState(page, 'task.done');
  await app.goHistory(page);
  const rows = await app.readHistoryRows(page);
  expect(rows[0]).toMatchObject({ taskId: task.id, report: 'done', helpful: 'unanswered' });
});

test('AC9_今回は答えないを押すとtask.doneになり_履歴のdata-helpfulがunanswered', async ({ context, page, baseURL }) => {
  const task = await openToday(context, page, baseURL);
  await app.tid(page, 'task.report.done').click();
  await app.expectState(page, 'task.rate');
  await app.tid(page, 'task.rate.close').click();
  await app.expectState(page, 'task.done');
  await page.reload();
  await app.expectState(page, 'task.done');
  await app.goHistory(page);
  const rows = await app.readHistoryRows(page);
  expect(rows[0]).toMatchObject({ taskId: task.id, report: 'done', helpful: 'unanswered' });
});
