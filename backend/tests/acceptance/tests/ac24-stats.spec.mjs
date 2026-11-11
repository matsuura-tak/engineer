// AC-24（PRD r11）：統計の画面に、13 の指標を出すための値がそろっている（11 値）。
// seed は contracts/fixtures/seeds/seed-ac24-stats.json（初めて開いた日 2026-11-01（日）、current なし、6 行：完了 4 件（11-01、11-03、11-04 ×2）、
// 難しすぎ 1 件（11-02）、今日はできない 1 件（11-06）、完了のうち役に立った 2 件、未回答 2 件）。時刻は 2026-11-06（金）。
// 11-06 の行があるので開いた状態は task.skipped で、出した件数は 6 のまま増えない（W-7）。期待値は PRD の AC-24 の Then（数え方は data.md の 9）。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectSeed, loadContractFixture } from '../helpers/seed.mjs';

const EXPECTED = {
  'settings.stats.firstOpenDate.value': ['data-stat-first-open-date', '2026-11-01'],
  'settings.stats.issued.value': ['data-stat-issued', '6'],
  'settings.stats.completed.value': ['data-stat-completed', '4'],
  'settings.stats.firstDayCompleted.value': ['data-stat-first-day-completed', 'true'],
  'settings.stats.daysCompleted7d.value': ['data-stat-days-completed-7d', '3'],
  'settings.stats.daysCompletedWeek.value': ['data-stat-days-completed-week', '2'],
  'settings.stats.extraCompleted.value': ['data-stat-extra-completed', '1'],
  'settings.stats.helpful.value': ['data-stat-helpful', '2'],
  'settings.stats.rated.value': ['data-stat-rated', '2'],
  'settings.stats.tooHard.value': ['data-stat-too-hard', '1'],
  'settings.stats.noTime.value': ['data-stat-no-time', '1'],
};

test('AC24_統計の11の値が期待どおりで_数値9つと日付1つは同じ文字が見え_真偽値はfirstDayCompleted.yesの文言が見える', async ({ context, page, baseURL, request }, testInfo) => {
  const ja = await app.loadStrings(request, 'ja');
  const seed = loadContractFixture('seeds/seed-ac24-stats.json');
  expect(seed.history, 'seed は 6 行').toHaveLength(6);
  expect(seed.current).toBeUndefined();
  await injectSeed(context, seed);
  await app.fixDate(page, '2026-11-06');
  await app.open(page, baseURL);
  await app.expectState(page, 'task.skipped');

  await app.goSettings(page);
  await app.tid(page, 'settings.stats.open').click();
  await app.expectState(page, 'settings.stats');
  await app.shot(page, testInfo, 'AC24_settings.stats');

  expect(Object.keys(EXPECTED)).toHaveLength(11);
  for (const [testId, [attr, value]] of Object.entries(EXPECTED)) {
    const dd = app.tid(page, testId);
    await expect(dd, testId).toHaveCount(1);
    await expect(dd, `${attr}`).toHaveAttribute(attr, value);
    if (attr === 'data-stat-first-day-completed') {
      await expect(dd).toHaveText(app.text(ja, 'settings.stats.firstDayCompleted.yes'));
    } else {
      await expect(dd).toHaveText(value);
    }
    await expect(dd).toBeVisible();
  }
  await expect(app.tid(page, 'settings.stats.firstDayCompleted.yes')).toBeVisible();
  await expect(app.tid(page, 'settings.stats.firstDayCompleted.no')).toHaveCount(0);
});
