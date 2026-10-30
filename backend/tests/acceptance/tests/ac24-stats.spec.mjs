// AC-24：統計の画面に、13 の指標を出すための値がそろっている（seed は contracts/fixtures/seeds/seed-ac24-stats.json、時刻は 2026-11-06）。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectSeed, loadContractFixture } from '../helpers/seed.mjs';

const EXPECTED = {
  'settings.stats.firstOpenDate.value': ['data-stat-first-open-date', '2026-11-01'],
  'settings.stats.issued.value': ['data-stat-issued', '5'],
  'settings.stats.completed.value': ['data-stat-completed', '3'],
  'settings.stats.firstDayCompleted.value': ['data-stat-first-day-completed', 'true'],
  'settings.stats.daysCompleted7d.value': ['data-stat-days-completed-7d', '3'],
  'settings.stats.helpful.value': ['data-stat-helpful', '2'],
  'settings.stats.rated.value': ['data-stat-rated', '2'],
  'settings.stats.tooHard.value': ['data-stat-too-hard', '1'],
  'settings.stats.noTime.value': ['data-stat-no-time', '1'],
};

test('AC24_統計の9つの値が期待どおりで_数値7つと日付1つは同じ文字が見え_真偽値はfirstDayCompleted.yesの文言が見える', async ({ context, page, baseURL, request }, testInfo) => {
  const ja = await app.loadStrings(request, 'ja');
  await injectSeed(context, loadContractFixture('seeds/seed-ac24-stats.json'));
  await app.fixDate(page, '2026-11-06');
  await app.open(page, baseURL);
  await app.expectState(page, 'task.done');

  await app.goSettings(page);
  await app.tid(page, 'settings.stats.open').click();
  await app.expectState(page, 'settings.stats');
  await app.shot(page, testInfo, 'AC24_settings.stats');

  for (const [testId, [attr, value]] of Object.entries(EXPECTED)) {
    const dd = app.tid(page, testId);
    await expect(dd, testId).toHaveCount(1);
    await expect(dd, `${attr}`).toHaveAttribute(attr, value);
    if (attr === 'data-stat-first-day-completed') {
      await expect(dd).toHaveText(ja['settings.stats.firstDayCompleted.yes']);
    } else {
      await expect(dd).toHaveText(value);
    }
    await expect(dd).toBeVisible();
  }
  await expect(app.tid(page, 'settings.stats.firstDayCompleted.yes')).toBeVisible();
  await expect(app.tid(page, 'settings.stats.firstDayCompleted.no')).toHaveCount(0);
});
