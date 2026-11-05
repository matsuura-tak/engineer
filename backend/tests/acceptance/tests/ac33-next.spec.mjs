// AC-33（PRD r11。FB-2）：申告の後に「次の一手に進む」で、同じ日に次の課題が出る。task.done からと task.skipped からの 2 通り。
//   Then：1 秒以内に task.today、ID は過去に出したどれとも違う、area / level は直前と同じ、data-task-nth-today が 2、統計の issued が 1 増える、
//   再読み込みしても同じ data-task-id の task.today。もう 1 回で nth-today 3。3 件目を出すまでに上限や確認のダイアログは 0 件。
// 1 秒は契約「時間の計り方」の「次の一手に進む → 課題」の行（始点 task.next の click、終点 data-state が task.today。ページの中で計る。helpers/app.mjs の armTiming / readInterval）。
// seed は contracts/fixtures/seeds/seed-ac14-three-completed.json（backend / intermediate の 001〜003 を完了。目標の組に未出が 11 件：Given「2 件以上」）。2026-11-04 に固定して開く。
// 「出した件数」は統計の data-stat-issued（data.md の 9：history の行数 + current があれば 1）。開いた直後 4 → 2 件目で 5 → 3 件目で 6。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectSeed, loadContractFixture } from '../helpers/seed.mjs';

const SEED = 'seeds/seed-ac14-three-completed.json';
const TODAY = '2026-11-04';
const NEXT_LIMIT_MS = 1000;

/** 上限や確認のダイアログが 0 件（AC-31 の数え方の 1 と 2 と同じ：role=dialog、aria-modal="true"）。 */
async function expectNoDialog(page, label) {
  await expect(page.getByRole('dialog'), `${label}：role=dialog`).toHaveCount(0);
  await expect(page.locator('[aria-modal="true"]'), `${label}：aria-modal`).toHaveCount(0);
}

/** 今の課題を申告して、from の状態（task.done か task.skipped）にする。 */
async function reportTo(page, from) {
  if (from === 'task.done') {
    await app.tid(page, 'task.report.done').click();
    await app.expectState(page, 'task.rate');
    await app.tid(page, 'task.rate.close').click();
  } else {
    await app.tid(page, 'task.report.noTime').click();
  }
  await app.expectState(page, from);
}

for (const from of ['task.done', 'task.skipped']) {
  test(`AC33_${from}からtask.nextで1秒以内に同じ日の2件目と3件目が出て_IDは過去と違い_組は同じ_issuedが1ずつ増え_再読み込みでも同じID_ダイアログ0件`, async ({ context, page, baseURL }, testInfo) => {
    const seed = loadContractFixture(SEED);
    const issuedIds = seed.history.map((r) => r.taskId);
    await injectSeed(context, seed);
    await app.fixDate(page, TODAY);
    await app.open(page, baseURL);
    await app.expectState(page, 'task.today');
    const first = await app.readTask(page);
    expect(issuedIds).not.toContain(first.id);
    issuedIds.push(first.id);
    expect(first.nthToday).toBe('1');
    const issued0 = Number((await app.readStats(page))['data-stat-issued']);
    expect(issued0, '開いた直後の issued（seed 3 行 + current）').toBe(4);
    await page.reload();
    await app.expectState(page, 'task.today');

    const timings = [];
    let prev = first;
    for (const nth of ['2', '3']) {
      await app.armTiming(page);
      await reportTo(page, from);
      await expectNoDialog(page, `${from}（${nth} 件目を出す前）`);
      await app.next(page);
      const ms = await app.readInterval(page, { startTestId: 'task.next', state: 'task.today' });
      timings.push(ms);
      expect(ms, `task.next → task.today（${nth} 件目。AC-33 の 1 秒）`).toBeLessThanOrEqual(NEXT_LIMIT_MS);
      await expectNoDialog(page, `${from}（${nth} 件目を出した直後）`);

      const task = await app.readTask(page);
      expect(issuedIds, `${nth} 件目の ID は過去に出したどれとも違う`).not.toContain(task.id);
      expect(task.area).toBe(prev.area);
      expect(task.level).toBe(prev.level);
      expect(task.nthToday, 'data-task-nth-today').toBe(nth);
      await expect(app.tid(page, 'task.today.label.nth')).toHaveCount(1);
      await expect(app.tid(page, 'task.today.label')).toHaveCount(0);
      await app.shot(page, testInfo, `AC33_${from}_task.today_nth${nth}`);
      issuedIds.push(task.id);

      const issued = Number((await app.readStats(page))['data-stat-issued']);
      expect(issued, `${nth} 件目を出した後の issued`).toBe(issued0 + Number(nth) - 1);

      await page.reload();
      await app.expectState(page, 'task.today');
      const again = await app.readTask(page);
      expect(again.id, '再読み込みしても同じ data-task-id').toBe(task.id);
      expect(again.nthToday).toBe(nth);
      prev = task;
    }
    testInfo.annotations.push({ type: '次の一手に進む → 課題 ms（2 件目、3 件目）', description: timings.join(', ') });
    testInfo.annotations.push({ type: '出した ID の順', description: issuedIds.join(' → ') });
  });
}
