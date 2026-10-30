// AC-12：一度読み込んだ後は、ネットワークがなくても画面の中の操作がすべて動く（送信 0 件）。
// AC-23：一度読み込んだ後は、オフラインで再読み込みしても動く（3 秒以内、送信 0 件。Service Worker）。
// 送信の数え方は W-12（fromServiceWorker でない応答 + requestfailed）。
// AC-12 でも、オフラインにする前に W-13（SW の準備）を待つ。PRD AC-12 Given「ページを読み込み終えた後に」をこの合図で読む
// （アプリは画面を描いた後に SW を登録するので、待たないと sw.js の取得とオフラインが競る：tech-lead G2 r1 の spike）。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectSeed, loadContractFixture } from '../helpers/seed.mjs';

const SEED = 'seeds/seed-ac14-three-completed.json';

test('AC12_オフラインでもAC-1_AC-2_AC-5_AC-9の操作が動き_送信は0件', async ({ context, page, baseURL }, testInfo) => {
  await app.fixDate(page, '2026-11-03');
  await app.open(page, baseURL);
  await app.expectState(page, 'diagnosis.start');
  await app.waitServiceWorkerReady(page);

  await context.setOffline(true);
  const net = app.networkCounter(page);
  net.start();

  // AC-1 と AC-2 の Then（時間は click の直前から表示を確かめ終えるまで：helpers/app.mjs の diagnose）
  const { beginMs, transitions, finishMs } = await app.diagnose(page, { area: 'infra', level: 'intermediate', years: '3to5' }, { finishTo: 'task.today' });
  testInfo.annotations.push({ type: '切り替えの時間 ms（始める→1、1→2、2→3、3→課題）', description: `${beginMs}, ${transitions.join(', ')}, ${finishMs}` });
  expect(beginMs, '始める → 1 問目').toBeLessThanOrEqual(500);
  expect(transitions[0], '1 問目 → 2 問目').toBeLessThanOrEqual(500);
  expect(transitions[1], '2 問目 → 3 問目').toBeLessThanOrEqual(500);
  expect(finishMs, '3 問目 → task.today（AC-2 の 1 秒）').toBeLessThanOrEqual(1000);
  const task = await app.readTask(page);
  expect(task.area).toBe('infra');
  expect(task.level).toBe('intermediate');

  await app.tid(page, 'task.report.done').click();
  await app.expectState(page, 'task.rate');
  await app.tid(page, 'task.rate.helpful').click();
  await app.expectState(page, 'task.done');
  await app.goHistory(page);
  const rows = await app.readHistoryRows(page);
  expect(rows[0]).toMatchObject({ taskId: task.id, report: 'done', helpful: 'helpful' });
  await app.shot(page, testInfo, 'AC12_offline_history');

  net.stop();
  testInfo.annotations.push({ type: '送信', description: `${net.count} 件 ${net.log.join(' | ')}` });
  expect(net.count, `送信：${net.log.join(' | ')}`).toBe(0);
});

test('AC12_オフラインでもAC-7の申告が動き_送信は0件', async ({ context, page, baseURL }, testInfo) => {
  await app.fixDate(page, '2026-11-03');
  await app.open(page, baseURL);
  await app.expectState(page, 'diagnosis.start');
  await app.waitServiceWorkerReady(page);

  await context.setOffline(true);
  const net = app.networkCounter(page);
  net.start();

  await app.diagnose(page, { area: 'git', level: 'beginner', years: 'lt1' });
  const task = await app.readTask(page);
  await app.tid(page, 'task.report.noTime').click();
  await app.expectState(page, 'task.skipped');
  await app.goHistory(page);
  const rows = await app.readHistoryRows(page);
  expect(rows[0]).toMatchObject({ taskId: task.id, report: 'no_time' });

  net.stop();
  testInfo.annotations.push({ type: '送信', description: `${net.count} 件 ${net.log.join(' | ')}` });
  expect(net.count, `送信：${net.log.join(' | ')}`).toBe(0);
});

async function offlineReloadAndNewTab({ context, page, baseURL, testInfo, state, expectSameId }) {
  await app.waitServiceWorkerReady(page);
  const before = state === 'task.today' ? await app.readTask(page) : null;
  await context.setOffline(true);

  // (1) 再読み込み
  const net1 = app.networkCounter(page);
  net1.start();
  const t1 = Date.now();
  await page.reload();
  await app.expectState(page, state, 3000);
  const reloadMs = Date.now() - t1;
  if (expectSameId) expect((await app.readTask(page)).id).toBe(before.id);
  net1.stop();
  await app.shot(page, testInfo, `AC23_${state}_offline_reload`);

  // (2) 同じブラウザの新しいタブで同じ URL（ホーム画面からの起動の代わり）
  const page2 = await context.newPage();
  const net2 = app.networkCounter(page2);
  net2.start();
  const t2 = Date.now();
  await page2.goto(baseURL);
  await app.expectState(page2, state, 3000);
  const newTabMs = Date.now() - t2;
  if (expectSameId) expect((await app.readTask(page2)).id).toBe(before.id);
  net2.stop();

  testInfo.annotations.push({ type: '表示までの ms（再読み込み / 新しいタブ）', description: `${reloadMs} / ${newTabMs}` });
  testInfo.annotations.push({ type: '送信', description: `${net1.count} + ${net2.count} 件 ${[...net1.log, ...net2.log].join(' | ')}` });
  expect(reloadMs).toBeLessThanOrEqual(3000);
  expect(newTabMs).toBeLessThanOrEqual(3000);
  expect(net1.count + net2.count, `送信：${[...net1.log, ...net2.log].join(' | ')}`).toBe(0);
}

test('AC23_task.todayを表示した後にオフラインで再読み込みと新しいタブ_3秒以内に同じdata-task-id_送信0件', async ({ context, page, baseURL }, testInfo) => {
  await injectSeed(context, loadContractFixture(SEED));
  await app.fixDate(page, '2026-11-04');
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  await offlineReloadAndNewTab({ context, page, baseURL, testInfo, state: 'task.today', expectSameId: true });
});

test('AC23_task.doneを表示した後にオフラインで再読み込みと新しいタブ_3秒以内にtask.done_送信0件', async ({ context, page, baseURL }, testInfo) => {
  await injectSeed(context, loadContractFixture(SEED));
  await app.fixDate(page, '2026-11-03');
  await app.open(page, baseURL);
  await app.expectState(page, 'task.done');
  await offlineReloadAndNewTab({ context, page, baseURL, testInfo, state: 'task.done', expectSameId: false });
});
