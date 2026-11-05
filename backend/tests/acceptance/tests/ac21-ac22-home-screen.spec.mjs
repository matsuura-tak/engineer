// AC-21：iOS の Safari では、診断の前にホーム画面への追加を 1 回だけ案内する。AC-22：ホーム画面から初めて開いたときは、読み込みへ案内する。
// 偽装は W-16：devices の UA と、addInitScript の navigator.standalone（iPad は Mac の UA と maxTouchPoints）。
import { devices } from '@playwright/test';
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectStandalone, injectMaxTouchPoints, contractFixturePath, loadContractFixture } from '../helpers/seed.mjs';

const iphone = devices['iPhone 15'];
const macSafariUA = devices['Desktop Safari'].userAgent;

async function expectGuideSteps(page, ja) {
  await expect(app.tid(page, 'home.addToHomeScreen')).toHaveCount(1);
  await expect(app.tid(page, 'home.addToHomeScreen.steps')).toHaveCount(1);
  for (const n of [1, 2, 3, 4]) await expect(app.tid(page, `home.addToHomeScreen.steps.${n}`)).toBeVisible();
  await expect(app.tid(page, 'home.addToHomeScreen.steps.4')).toHaveText(app.text(ja, 'home.addToHomeScreen.steps.4'));
}

test.describe('AC-21 iPhone の Safari の偽装', () => {
  test.use({ userAgent: iphone.userAgent, viewport: iphone.viewport, deviceScaleFactor: iphone.deviceScaleFactor, isMobile: iphone.isMobile, hasTouch: iphone.hasTouch });

  test('AC21_iOS_Safariでは診断の前に案内が出て_閉じると再読み込みしても出ず_設定から再び開ける', async ({ context, page, baseURL, request }, testInfo) => {
    const ja = await app.loadStrings(request, 'ja');
    await injectStandalone(context, false);
    await app.fixDate(page, '2026-11-03');
    await app.open(page, baseURL);
    await app.expectState(page, 'diagnosis.start');
    await expectGuideSteps(page, ja);
    await app.shot(page, testInfo, 'AC21_diagnosis.start_addToHomeScreen');

    await app.tid(page, 'home.addToHomeScreen.close').click();
    await expect(app.tid(page, 'home.addToHomeScreen')).toHaveCount(0);
    await page.reload();
    await app.expectState(page, 'diagnosis.start');
    await expect(app.tid(page, 'home.addToHomeScreen')).toHaveCount(0);

    await app.goSettings(page);
    await expect(app.tid(page, 'settings.homeScreen.open')).toHaveCount(1);
    await app.tid(page, 'settings.homeScreen.open').click();
    await expectGuideSteps(page, ja);
    await app.shot(page, testInfo, 'AC21_settings_addToHomeScreen');
  });
});

test.describe('AC-21 iPadOS の Safari の偽装（Mac の UA と maxTouchPoints > 1）', () => {
  test.use({ userAgent: macSafariUA });

  test('AC21_iPadOS_Safari（MacのUAとmaxTouchPoints5）でも診断の前に案内が出る', async ({ context, page, baseURL, request }) => {
    const ja = await app.loadStrings(request, 'ja');
    await injectStandalone(context, false);
    await injectMaxTouchPoints(context, 5);
    await app.fixDate(page, '2026-11-03');
    await app.open(page, baseURL);
    await app.expectState(page, 'diagnosis.start');
    await expectGuideSteps(page, ja);
  });
});

test('AC21_UAを偽装しないChromiumとWebKitでは案内が0回出る', async ({ page, baseURL }) => {
  await app.fixDate(page, '2026-11-03');
  await app.open(page, baseURL);
  await app.expectState(page, 'diagnosis.start');
  await expect(app.tid(page, 'home.addToHomeScreen')).toHaveCount(0);
  await page.reload();
  await app.expectState(page, 'diagnosis.start');
  await expect(app.tid(page, 'home.addToHomeScreen')).toHaveCount(0);
  await app.goSettings(page);
  await expect(app.tid(page, 'settings.homeScreen.open')).toHaveCount(0);
});

test('AC22_スタンドアロンで初めて開くと読み込みの案内が出て_再読み込みでも出て_ファイルを読み込むとAC-20の状態になる', async ({ context, page, baseURL, request }, testInfo) => {
  const ja = await app.loadStrings(request, 'ja');
  const fixture = loadContractFixture('data/v1/valid-export-three-completed.json');
  await injectStandalone(context, true);
  await app.fixDate(page, '2026-11-04');
  await app.open(page, baseURL);
  await app.expectState(page, 'diagnosis.start');

  await expect(app.tid(page, 'home.standalone.import')).toBeVisible();
  await expect(app.tid(page, 'home.standalone.import')).toHaveText(app.text(ja, 'home.standalone.import'));
  await expect(app.tid(page, 'home.standalone.importButton')).toHaveCount(1);
  await expect(app.tid(page, 'diagnosis.start.begin')).toHaveCount(1);
  await expect(app.tid(page, 'home.addToHomeScreen')).toHaveCount(0);
  await app.shot(page, testInfo, 'AC22_diagnosis.start_standalone');

  await page.reload();
  await app.expectState(page, 'diagnosis.start');
  await expect(app.tid(page, 'home.standalone.import')).toBeVisible();
  await expect(app.tid(page, 'home.standalone.importButton')).toHaveCount(1);

  await app.tid(page, 'home.standalone.importFile').setInputFiles(contractFixturePath('data/v1/valid-export-three-completed.json'));
  await expect(app.tid(page, 'error.import.message')).toHaveCount(0);
  await app.expectState(page, 'task.today');
  expect((await app.readTask(page)).id).toBe('backend-intermediate-004');

  await app.goHistory(page);
  const rows = await app.readHistoryRows(page);
  expect(rows.map((r) => r.taskId)).toEqual(['backend-intermediate-003', 'backend-intermediate-002', 'backend-intermediate-001']);

  await app.goSettings(page);
  const { json } = await app.exportJson(page);
  expect(json.diagnosis).toEqual(fixture.diagnosis);
  expect(json.levels).toEqual(fixture.levels);
  expect(json.firstOpenDate).toEqual(fixture.firstOpenDate);
  expect(json.history).toEqual(fixture.history);
  expect(json.current).toMatchObject({ date: '2026-11-04', taskId: 'backend-intermediate-004', answer: '' });
});
