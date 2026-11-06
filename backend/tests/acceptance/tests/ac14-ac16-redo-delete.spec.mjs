// AC-14：診断をやり直しても履歴は残る。AC-16：データの全削除で初回の状態に戻る。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectSeed, loadContractFixture, exhaustedSeed, addDays } from '../helpers/seed.mjs';

test('AC14_今日の課題を出していない日に設定からやり直して別の領域を選ぶと_新しい領域の課題が出て完了の履歴は3件のまま', async ({ context, page, baseURL, request }, testInfo) => {
  // Given「過去 3 日に完了した課題が 3 件あり、今日の課題はまだ出していない」：起動時に「あり」なら今日の課題を出す（data.md の 4 の 6-4）ので、
  // 設定にいる間に課題が出ていない状態は task.exhausted（S7）だけ。本番の課題集から backend/intermediate を出し終えた履歴を作り（W-7 の AC-14 の行）、
  // 最後の 3 行（今日の直前の 3 日）を done、残りを no_time にする。contracts/fixtures/seeds/seed-ac14-three-completed.json は開くと今日の課題が出るので使わない。
  const tasks = await app.loadTasks(request);
  const { seed, list, nextDate, lastDate } = exhaustedSeed(tasks, {
    area: 'backend',
    level: 'intermediate',
    firstOpenDate: '2026-09-01',
    reportFor: (i, _t, total) => (i >= total - 3 ? 'done' : 'no_time'),
  });
  const doneRows = seed.history.filter((r) => r.report === 'done');
  expect(doneRows).toHaveLength(3);
  expect(doneRows.map((r) => r.date), '完了 3 件は今日の直前の 3 日').toEqual([addDays(nextDate, -3), addDays(nextDate, -2), addDays(nextDate, -1)]);
  expect(doneRows[2].date).toBe(lastDate);
  testInfo.annotations.push({ type: 'seed', description: `${list.length} 行（最後の 3 行 ${doneRows.map((r) => r.date).join('、')} が done、残り ${list.length - 3} 行が no_time）。今日 ${nextDate}` });
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

test('AC14_今日の課題が出ている日に設定からやり直して別の領域を選んでも_同じdata-task-idのtask.todayのままで完了の履歴は3件_完了してtask.nextを押すと同じ日に新しい領域の課題が出る', async ({ context, page, baseURL }, testInfo) => {
  // 2 通り目（PRD r11 の AC-14 の Then。11 の冒頭「診断のやり直し」：まだ申告していない今日の課題があればそのまま残り（ID は変わらない）、
  // 申告の後に「次の一手に進む」で出す課題から新しい診断に従う）。
  // seed は契約の見本 seed-ac14-three-completed.json（完了 3 件、最後の行は 2026-11-03、current なし）。W-7 の AC-14 の 2 通り目の行のとおり
  // 最後の行より後の日 2026-11-04 に固定して開く（2026-11-03 だと 4 の 6-3 で task.done になる）。やり直しで選ぶ領域は seed の backend 以外（frontend）。時刻は動かさない。
  const seed = loadContractFixture('seeds/seed-ac14-three-completed.json');
  expect(seed.history.filter((r) => r.report === 'done'), 'seed の完了は 3 件').toHaveLength(3);
  expect(seed.history.at(-1).date).toBe('2026-11-03');
  expect(seed.current).toBeUndefined();
  await injectSeed(context, seed);

  await app.fixDate(page, '2026-11-04');
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  const before = await app.readTask(page);
  expect(before.id).toBeTruthy();
  expect(before.area).toBe('backend');
  expect(before.nthToday).toBe('1');
  testInfo.annotations.push({ type: 'やり直しの前', description: `2026-11-04 の task.today：${before.id}（${before.area}/${before.level}）` });

  // When：設定から診断をやり直し、別の領域（frontend）を選んで 3 問に答える
  await app.goSettings(page);
  await app.tid(page, 'settings.redo').click();
  await app.expectState(page, 'diagnosis.question');
  await app.diagnose(page, { area: 'frontend', level: 'beginner', years: '1to3' });

  // Then：task.today のままで data-task-id がやり直しの前と同じ（新しい課題は出ない）
  await app.expectState(page, 'task.today');
  const after = await app.readTask(page);
  expect(after.id).toBe(before.id);
  expect(after.area).toBe('backend');
  await app.shot(page, testInfo, 'AC14_task.today_same_id_after_redo');

  // Then：履歴の完了は 3 件のまま（S10 に出るのは history だけで、今日の課題は出ない。W-8）
  await app.goHistory(page);
  const rowsAfterRedo = await app.readHistoryRows(page);
  expect(rowsAfterRedo.filter((r) => r.report === 'done')).toHaveLength(3);
  expect(rowsAfterRedo).toHaveLength(3);

  // Then：その課題を完了して「次の一手に進む」を押すと、同じ日のうちに task.today の data-task-area が新しく選んだ領域（frontend）
  await page.reload();
  await app.expectState(page, 'task.today');
  expect((await app.readTask(page)).id).toBe(before.id);
  await app.tid(page, 'task.report.done').click();
  await app.expectState(page, 'task.rate');
  await app.tid(page, 'task.rate.helpful').click();
  await app.expectState(page, 'task.done');
  await app.next(page);
  const sameDay = await app.readTask(page);
  expect(sameDay.area).toBe('frontend');
  expect(sameDay.level).toBe('beginner');
  expect(sameDay.id).not.toBe(before.id);
  expect(sameDay.nthToday, '今日の 2 件目').toBe('2');
  await app.shot(page, testInfo, 'AC14_task.today_frontend_same_day');

  // 履歴：完了は 4 件（やり直しの前の課題を完了した分）。新しい課題（current）は S10 に出ない
  await app.goHistory(page);
  const rowsSameDay = await app.readHistoryRows(page);
  expect(rowsSameDay.filter((r) => r.report === 'done')).toHaveLength(4);
  expect(rowsSameDay[0]).toMatchObject({ taskId: before.id, date: '2026-11-04', report: 'done' });
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
