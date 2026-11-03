// AC-11：保存に失敗しても入力は失われない（W-9 の失敗の注入）。AC-13：保存の永続化を断っても使える（W-9 の拒否の注入）。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectStorageFailure, armStorageFailure, injectPersistDenied, readPersistCalls, readStoredData } from '../helpers/seed.mjs';

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
  // W-9：persist() と persisted() の両方を false にする（S8 の注意は persisted() で決まる。design D-31）
  await injectPersistDenied(context);
  await app.fixDate(page, TODAY);
  await app.open(page, baseURL);
  await app.expectState(page, 'diagnosis.start');
  await app.diagnose(page, { area: 'testing', level: 'beginner', years: '1to3' });
  const task = await app.readTask(page);
  // 拒否の注入が効いたこと：初回の診断を終えて task.today を初めて描いた後に persist() がちょうど 1 回（PRD 11 の冒頭「1回だけ」、W-9、data.md 11）
  await expect.poll(() => readPersistCalls(page), { timeout: app.WAIT_MS }).toBe(1);
  // 保存データの印：初回の診断を終える保存に device.persistRequested: true が入り、結果（persistGranted）は書かれない（data.md 2 の表と 11、W-9）
  const stored = await readStoredData(page);
  expect(stored?.device?.persistRequested, 'device.persistRequested').toBe(true);
  expect(stored?.device ?? {}, 'device.persistGranted は書かれない').not.toHaveProperty('persistGranted');
  testInfo.annotations.push({ type: 'persist() の呼び出し', description: `診断を終えた読み込みで 1 回（拒否を返した）。device: ${JSON.stringify(stored?.device)}` });

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
  // 同じ日の再読み込み（task.done）では persist() を求め直さない：この文書（再読み込み後）での回数が 0（W-9、data.md 11）
  expect(await readPersistCalls(page), '同じ日の再読み込みの後の persist() の回数').toBe(0);

  // 翌日の S3（今日の課題が新しく出る読み込み）でも求め直さない（PRD 11 の冒頭「1回だけ」、design U-14 の決定、data.md 11）。
  // persist() は S3 を描いた後に呼ばれるので、S3 の後に S8 まで進んで（persisted() を待って描く画面）から回数を読む
  await app.fixDate(page, '2026-11-04');
  await page.reload();
  await app.expectState(page, 'task.today');
  expect((await app.readTask(page)).id).not.toBe(task.id);
  await app.goSettings(page);
  await expect(app.tid(page, 'settings.storage.notPersisted')).toBeVisible();
  expect(await readPersistCalls(page), '翌日の S3 の後の persist() の回数').toBe(0);
  expect((await readStoredData(page))?.device?.persistRequested, '翌日も device.persistRequested は true のまま').toBe(true);
  testInfo.annotations.push({ type: 'persist() の呼び出し（再読み込み後）', description: '同じ日の task.done で 0 回、翌日の task.today で 0 回' });
});
