// AC-14：診断をやり直しても履歴は残る。AC-16：データの全削除で初回の状態に戻る。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectSeed, loadContractFixture, exhaustedSeed } from '../helpers/seed.mjs';

test('AC14_今日の課題を出していない日に設定からやり直して別の領域を選ぶと_新しい領域の課題が出て完了の履歴は3件のまま', async ({ context, page, baseURL, request }, testInfo) => {
  // Given「今日の課題はまだ出していない」：起動時に「あり」なら今日の課題を出す（data.md の 4 の 6-4）ので、
  // 設定にいる間に課題が出ていない状態は task.exhausted（S7）だけ。backend/intermediate を出し終えた履歴（完了 3 件、残りは今日はできない）を seed にする。
  const tasks = await app.loadTasks(request);
  const { seed, list, nextDate } = exhaustedSeed(tasks, {
    area: 'backend',
    level: 'intermediate',
    firstOpenDate: '2026-09-01',
    reportFor: (i) => (i < 3 ? 'done' : 'no_time'),
  });
  expect(seed.history.filter((r) => r.report === 'done')).toHaveLength(3);
  testInfo.annotations.push({ type: 'seed', description: `${list.length} 行（done 3、no_time ${list.length - 3}）` });
  await injectSeed(context, seed);

  await app.fixDate(page, nextDate);
  await app.open(page, baseURL);
  await app.expectState(page, 'task.exhausted');
  await expect(app.tid(page, 'task.today')).toHaveCount(0);

  await app.goSettings(page);
  await app.tid(page, 'settings.redo').click();
  await app.expectState(page, 'diagnosis.question');
  await app.diagnose(page, { area: 'frontend', level: 'beginner', years: '1to3' });
  const task = await app.readTask(page);
  expect(task.area).toBe('frontend');
  expect(task.level).toBe('beginner');
  await app.shot(page, testInfo, 'AC14_task.today_frontend');

  await app.goHistory(page);
  const rows = await app.readHistoryRows(page);
  expect(rows.filter((r) => r.report === 'done')).toHaveLength(3);
  expect(rows).toHaveLength(list.length);
});

test('AC16_すべてのデータを削除すると再読み込みでdiagnosis.startになり_やり直した後の履歴は0件', async ({ context, page, baseURL }, testInfo) => {
  await injectSeed(context, loadContractFixture('seeds/seed-ac14-three-completed.json'));
  await app.fixDate(page, '2026-11-04');
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');

  await app.goSettings(page);
  await app.tid(page, 'settings.delete').click();
  await expect(app.tid(page, 'settings.delete.confirm')).toBeVisible();
  await app.shot(page, testInfo, 'AC16_settings.delete.confirm');
  await app.tid(page, 'settings.delete.confirm.ok').click();
  await app.expectState(page, 'diagnosis.start');

  await page.reload();
  await app.expectState(page, 'diagnosis.start');
  await app.diagnose(page, { area: 'database', level: 'intermediate', years: '3to5' });
  await app.goHistory(page);
  await expect(app.tid(page, 'history.row')).toHaveCount(0);
  await expect(app.tid(page, 'history.empty')).toBeVisible();
});
