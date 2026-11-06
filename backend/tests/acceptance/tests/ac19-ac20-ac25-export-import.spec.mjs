// AC-19：データを 1 つのファイルに書き出せる。AC-20：書き出したファイルを別のブラウザで読み込むと同じ状態に戻る。
// AC-25：形式の版番号が新しいファイルは拒み、既存のデータは変わらない。
// AC-19 と AC-20 は同じ固定の日付（2026-11-03）で行う（W-3）。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectSeed, loadSeed, contractFixturePath } from '../helpers/seed.mjs';
import { validate } from '../helpers/schema.mjs';

const DAY = '2026-11-03';
const ANSWER_50 = 'インデックスは検索を速くするが、書き込みのたびに更新されるので、書き込みが多い表では増やしすぎない。'.slice(0, 50);

test('AC19_書き出すとJSONが1つダウンロードされ_診断_段階_履歴3件（50文字のanswer）_初めて開いた日_版番号を含む', async ({ context, page, baseURL }, testInfo) => {
  expect([...ANSWER_50]).toHaveLength(50);
  const seed = loadSeed('seed-two-done.json');
  await injectSeed(context, seed);
  await app.fixDate(page, DAY);
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  const task = await app.readTask(page);

  await app.tid(page, 'task.answer').fill(ANSWER_50);
  await expect(app.tid(page, 'task.answer.saved')).toBeVisible({ timeout: 1000 });
  await app.tid(page, 'task.report.done').click();
  await app.expectState(page, 'task.rate');
  await app.tid(page, 'task.rate.helpful').click();
  await app.expectState(page, 'task.done');

  await app.goSettings(page);
  const { json, suggestedFilename } = await app.exportJson(page);
  await expect(app.tid(page, 'settings.export.done')).toBeVisible();
  testInfo.annotations.push({ type: 'ダウンロード', description: suggestedFilename });

  const { ok, errors } = validate('data', json);
  expect(ok, `data.schema.json：${errors}`).toBe(true);
  expect(json.formatVersion).toBe(1);
  expect(json.app).toBe('kyounoitte');
  expect(json.firstOpenDate).toBe('2026-11-01');
  expect(json.diagnosis).toEqual(seed.diagnosis);
  expect(json.levels).toEqual({ backend: 'intermediate' });
  expect(json.device).toBeUndefined();
  expect(json.history).toHaveLength(3);
  const byId = Object.fromEntries(json.history.map((r) => [r.taskId, r]));
  expect(byId['backend-intermediate-001'].answer).toBe('');
  expect(byId['backend-intermediate-002'].answer).toBe('');
  expect(byId[task.id]).toMatchObject({ date: DAY, report: 'done', helpful: 'helpful', answer: ANSWER_50 });
});

test('AC20_保存データのないブラウザで読み込むと_診断と段階が同じで履歴3件（answerも同じ）_状態はtask.todayかtask.done', async ({ browser, context, page, baseURL }, testInfo) => {
  // 書き出し元（A）
  const seed = loadSeed('seed-three-done-one-answer.json');
  await injectSeed(context, seed);
  await app.fixDate(page, DAY);
  await app.open(page, baseURL);
  await app.expectState(page, 'task.done');
  await app.goSettings(page);
  const exported = await app.exportJson(page);
  await context.close();

  // 別のブラウザ（B）：保存データなし
  const contextB = await browser.newContext({ timezoneId: 'Asia/Tokyo', locale: 'ja-JP', acceptDownloads: true });
  const pageB = await contextB.newPage();
  await app.fixDate(pageB, DAY);
  await app.open(pageB, baseURL);
  await app.expectState(pageB, 'diagnosis.start');
  await app.goSettings(pageB);
  await expect(app.tid(pageB, 'settings.export')).toHaveCount(0);
  await app.tid(pageB, 'settings.import.file').setInputFiles(exported.file);
  await expect(app.tid(pageB, 'settings.import.confirm')).toHaveCount(0);
  await expect(app.tid(pageB, 'error.import.message')).toHaveCount(0);
  await expect(app.root(pageB)).toHaveAttribute('data-state', /^task\.(today|done)$/, { timeout: app.WAIT_MS });
  const stateB = await app.readState(pageB);
  testInfo.annotations.push({ type: '読み込み後の状態', description: stateB });
  expect(stateB).toBe('task.done');
  await app.shot(pageB, testInfo, 'AC20_after_import');

  await app.goHistory(pageB);
  const rows = await app.readHistoryRows(pageB);
  expect(rows.map((r) => r.taskId)).toEqual(['backend-intermediate-003', 'backend-intermediate-002', 'backend-intermediate-001']);
  await expect(app.tid(pageB, 'history.row').nth(2).getByTestId('history.row.answerText')).toHaveText(ANSWER_50, { useInnerText: false });

  await app.goSettings(pageB);
  const again = await app.exportJson(pageB);
  expect(again.json.diagnosis).toEqual(exported.json.diagnosis);
  expect(again.json.levels).toEqual(exported.json.levels);
  expect(again.json.firstOpenDate).toEqual(exported.json.firstOpenDate);
  expect(again.json.history).toEqual(exported.json.history);
  expect(again.json.history.map((r) => r.answer)).toEqual([ANSWER_50, '', '']);
  await contextB.close();
});

test('AC25_版番号が新しいファイルはerror.import.messageで拒み_履歴1件と診断と状態は変わらない', async ({ context, page, baseURL }, testInfo) => {
  const seed = loadSeed('seed-one-done.json');
  await injectSeed(context, seed);
  await app.fixDate(page, '2026-11-02');
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  const before = await app.readTask(page);

  await app.goSettings(page);
  await app.tid(page, 'settings.import.file').setInputFiles(contractFixturePath('data/invalid-newer-version.json'));
  await expect(app.tid(page, 'error.import.message')).toBeVisible();
  await expect(app.tid(page, 'error.import.reason.version')).toBeVisible();
  await expect(app.tid(page, 'settings.import.confirm')).toHaveCount(0);
  await app.shot(page, testInfo, 'AC25_settings_error.import');

  const { json } = await app.exportJson(page);
  expect(json.history).toHaveLength(1);
  expect(json.history[0]).toMatchObject({ taskId: 'backend-intermediate-001', report: 'done' });
  expect(json.diagnosis).toEqual(seed.diagnosis);
  expect(json.levels).toEqual(seed.levels);

  await app.tid(page, 'app.name').click();
  await app.expectState(page, 'task.today');
  expect((await app.readTask(page)).id).toBe(before.id);
  await app.goHistory(page);
  await expect(app.tid(page, 'history.row')).toHaveCount(1);
});
