// AC-11：保存に失敗しても入力は失われない（W-9 の失敗の注入）。AC-13：保存の永続化を断っても使える（W-9 の拒否の注入）。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectStorageFailure, armStorageFailure, injectPersistDenied, readPersistCalls } from '../helpers/seed.mjs';

const TODAY = '2026-11-03';

test('AC11_2問目の保存が失敗してもerror.storage.messageと選択が残り_やり直すと3問目に進み課題が回答と一致する', async ({ context, page, baseURL }, testInfo) => {
  await injectStorageFailure(context);
  await app.fixDate(page, TODAY);
  await app.open(page, baseURL);
  await app.expectState(page, 'diagnosis.start');
  await app.tid(page, 'diagnosis.start.begin').click();
  await app.expectState(page, 'diagnosis.question');
  const progress = app.tid(page, 'diagnosis.progress');

  await expect(progress).toHaveAttribute('data-question-index', '1');
  await app.tid(page, 'area.database').check();
  await app.tid(page, 'diagnosis.next').click();
  await expect(progress).toHaveAttribute('data-question-index', '2');
  await app.tid(page, 'level.advanced').check();

  // 次の 1 回の setItem だけ QuotaExceededError
  await armStorageFailure(page);
  await app.tid(page, 'diagnosis.next').click();

  await expect(app.tid(page, 'error.storage.message')).toBeVisible();
  await expect(app.tid(page, 'error.storage.retry')).toHaveCount(1);
  await expect(progress).toHaveAttribute('data-question-index', '2');
  await expect(app.tid(page, 'level.advanced')).toBeChecked();
  await app.shot(page, testInfo, 'AC11_diagnosis.question_error.storage');

  await app.tid(page, 'error.storage.retry').click();
  await expect(progress).toHaveAttribute('data-question-index', '3');
  await expect(app.tid(page, 'error.storage.message')).toHaveCount(0);
  await app.tid(page, 'years.3to5').check();
  await app.tid(page, 'diagnosis.finish').click();
  await app.expectState(page, 'task.today');
  const task = await app.readTask(page);
  expect(task.area).toBe('database');
  expect(task.level).toBe('advanced');
});

test('AC13_persistを断られても完了と再読み込みでtask.done_履歴1件_設定にnotPersistedと書き出しがある', async ({ context, page, baseURL }, testInfo) => {
  await injectPersistDenied(context);
  await app.fixDate(page, TODAY);
  await app.open(page, baseURL);
  await app.expectState(page, 'diagnosis.start');
  await app.diagnose(page, { area: 'testing', level: 'beginner', years: '1to3' });
  const task = await app.readTask(page);
  // 拒否の注入が効いたこと：task.today を初めて描いた後に persist() がちょうど 1 回呼ばれる（W-9）
  await expect.poll(() => readPersistCalls(page), { timeout: app.WAIT_MS }).toBe(1);
  testInfo.annotations.push({ type: 'persist() の呼び出し', description: '1 回（拒否を返した）' });

  await app.tid(page, 'task.report.done').click();
  await app.expectState(page, 'task.rate');
  await app.tid(page, 'task.rate.helpful').click();
  await app.expectState(page, 'task.done');
  await page.reload();
  await app.expectState(page, 'task.done');

  await app.goHistory(page);
  const rows = await app.readHistoryRows(page);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ taskId: task.id, report: 'done' });

  await app.goSettings(page);
  await expect(app.tid(page, 'settings.storage.notPersisted')).toBeVisible();
  await expect(app.tid(page, 'settings.export')).toHaveCount(1);
  await app.shot(page, testInfo, 'AC13_settings_notPersisted');
});
