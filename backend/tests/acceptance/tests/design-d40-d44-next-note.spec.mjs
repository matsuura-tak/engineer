// design の「AC にない状態」（W-6 の DESIGN_ の決まり）：
//   D-40（design 5.1 #33、#53）：S7 levelDone の補足の 1 文。次の段階の組に未出があり履歴にその組の行があれば task.exhausted.seenNext、次の段階の組も出し終えていれば task.exhausted.nextDone。
//     多くて 1 つ。判定は contracts/data.md の 5「S7 の変種と補足の 1 文」。文は design r9 の 7（contracts/fixtures/strings/valid-ja.json と同じ）。
//   D-44（design 5.1 #51、#54）：S5 / S6 で、今の組（申告で段階が動いたら動いた後）に未出が 0 件なら task.next.note の文字が task.next.note.last（{area}、{level} は次に出す組）。
//     #54 は task.skipped.levelChanged と重なる場合（{level} は変わった先の初級）。判定は data.md の 9「組の最後」。
// seed は helpers/seed.mjs の seenNextSeed / nextDoneSeed / beginnerDoneAtIntermediateSeed / completedSeed（test-hooks.md W-7 の作り方。本番の課題集から ID で作る）。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectSeed, loadContractFixture, seenNextSeed, nextDoneSeed, beginnerDoneAtIntermediateSeed, completedSeed, tasksOf } from '../helpers/seed.mjs';

const AREA = 'backend';
const FIRST = '2026-06-01';

test('DESIGN_D40_初級を出し終え中級の行があり中級に未出が残るS7はlevelDoneにseenNextが1件でnextDoneが0件_advanceで未出の中級の最小IDが出る', async ({ context, page, baseURL, request }, testInfo) => {
  const ja = await app.loadStrings(request, 'ja');
  const tasks = await app.loadTasks(request);
  const { seed, nextDate, midUnissued } = seenNextSeed(tasks, { area: AREA, firstOpenDate: FIRST });
  expect(midUnissued).toBeGreaterThanOrEqual(1);
  await injectSeed(context, seed);
  await app.fixDate(page, nextDate);
  await app.open(page, baseURL);
  await app.expectState(page, 'task.exhausted');
  await expect(app.tid(page, 'task.exhausted.levelDone')).toHaveText(app.fill(app.text(ja, 'task.exhausted.levelDone'), { area: app.text(ja, `area.${AREA}`), level: app.text(ja, 'level.beginner') }));
  await expect(app.tid(page, 'task.exhausted.seenNext')).toHaveCount(1);
  await expect(app.tid(page, 'task.exhausted.seenNext')).toHaveText(app.fill(app.text(ja, 'task.exhausted.seenNext'), { nextLevel: app.text(ja, 'level.intermediate') }));
  await expect(app.tid(page, 'task.exhausted.seenNext')).toBeVisible();
  await expect(app.tid(page, 'task.exhausted.nextDone')).toHaveCount(0);
  await expect(app.tid(page, 'task.exhausted.advance')).toHaveCount(1);
  await app.shot(page, testInfo, 'DESIGN_D40_task.exhausted_seenNext');

  await app.tid(page, 'task.exhausted.advance').click();
  await app.expectState(page, 'task.today');
  const task = await app.readTask(page);
  expect(task.level).toBe('intermediate');
  expect(task.id, '履歴にある中級の 2 件を除いた最小の ID').toBe(tasksOf(tasks, AREA, 'intermediate')[2].id);
});

test('DESIGN_D40_初級と中級を出し終えて段階が初級のS7はlevelDoneにnextDoneが1件でseenNextが0件_advanceで中級のS7になり補足は0件', async ({ context, page, baseURL, request }, testInfo) => {
  const ja = await app.loadStrings(request, 'ja');
  const tasks = await app.loadTasks(request);
  const { seed, nextDate } = nextDoneSeed(tasks, { area: AREA, firstOpenDate: FIRST });
  await injectSeed(context, seed);
  await app.fixDate(page, nextDate);
  await app.open(page, baseURL);
  await app.expectState(page, 'task.exhausted');
  await expect(app.tid(page, 'task.exhausted.levelDone')).toHaveText(app.fill(app.text(ja, 'task.exhausted.levelDone'), { area: app.text(ja, `area.${AREA}`), level: app.text(ja, 'level.beginner') }));
  await expect(app.tid(page, 'task.exhausted.nextDone')).toHaveCount(1);
  await expect(app.tid(page, 'task.exhausted.nextDone')).toHaveText(app.fill(app.text(ja, 'task.exhausted.nextDone'), { nextLevel: app.text(ja, 'level.intermediate') }));
  await expect(app.tid(page, 'task.exhausted.nextDone')).toBeVisible();
  await expect(app.tid(page, 'task.exhausted.seenNext')).toHaveCount(0);
  await app.shot(page, testInfo, 'DESIGN_D40_task.exhausted_nextDone');

  await app.tid(page, 'task.exhausted.advance').click();
  await app.expectState(page, 'task.exhausted');
  await expect(app.tid(page, 'task.exhausted.levelDone')).toHaveText(app.fill(app.text(ja, 'task.exhausted.levelDone'), { area: app.text(ja, `area.${AREA}`), level: app.text(ja, 'level.intermediate') }));
  await expect(app.tid(page, 'task.exhausted.seenNext')).toHaveCount(0);
  await expect(app.tid(page, 'task.exhausted.nextDone')).toHaveCount(0);
  await expect(app.tid(page, 'task.exhausted.advance')).toHaveCount(1);
});

test('DESIGN_D44_組の13件を出した翌日に14件目を完了したS5のtask.next.noteはnote.lastの文で_task.nextでS7', async ({ context, page, baseURL, request }, testInfo) => {
  const ja = await app.loadStrings(request, 'ja');
  const tasks = await app.loadTasks(request);
  const total = tasksOf(tasks, AREA, 'intermediate').length;
  const { seed, nextDate, nextId } = completedSeed(tasks, { n: total - 1, area: AREA, level: 'intermediate', firstOpenDate: FIRST, maxFromTarget: total - 1 });
  await injectSeed(context, seed);
  await app.fixDate(page, nextDate);
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  const task = await app.readTask(page);
  expect(task.id).toBe(nextId);
  expect(task.progressIndex).toBe(String(total));
  await app.tid(page, 'task.report.done').click();
  await app.expectState(page, 'task.rate');
  await app.tid(page, 'task.rate.close').click();
  await app.expectState(page, 'task.done');
  const note = app.tid(page, 'task.next.note');
  await expect(note).toHaveCount(1);
  await expect(note).toHaveText(app.fill(app.text(ja, 'task.next.note.last'), { area: app.text(ja, `area.${AREA}`), level: app.text(ja, 'level.intermediate') }));
  await expect(app.tid(page, 'task.progress.done')).toHaveAttribute('data-progress-index', String(total));
  await expect(app.tid(page, 'task.progress.done')).toHaveAttribute('data-progress-total', String(total));
  await app.shot(page, testInfo, 'DESIGN_D44_task.done_note.last');
  await app.next(page, { to: 'task.exhausted' });
  await expect(app.tid(page, 'task.exhausted.levelDone')).toHaveCount(1);
});

test('DESIGN_D44_未出が残るS5のtask.next.noteは通常の文', async ({ context, page, baseURL, request }) => {
  const ja = await app.loadStrings(request, 'ja');
  await injectSeed(context, loadContractFixture('seeds/seed-ac14-three-completed.json'));
  await app.fixDate(page, '2026-11-03');
  await app.open(page, baseURL);
  await app.expectState(page, 'task.done');
  await expect(app.tid(page, 'task.next.note')).toHaveText(app.text(ja, 'task.next.note'));
});

test('DESIGN_D44_初級を出し終えて中級に進んだ後に中級で難しすぎを2回申告したS6はlevelChangedの後にnote.lastが初級の文で出る', async ({ context, page, baseURL, request }, testInfo) => {
  const ja = await app.loadStrings(request, 'ja');
  const tasks = await app.loadTasks(request);
  const { seed, nextDate, mid } = beginnerDoneAtIntermediateSeed(tasks, { area: AREA, firstOpenDate: FIRST });
  await injectSeed(context, seed);
  await app.fixDate(page, nextDate);
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  const first = await app.readTask(page);
  expect(first.id).toBe(mid[0].id);
  expect(first.level).toBe('intermediate');

  await app.tid(page, 'task.report.tooHard').click();
  await app.expectState(page, 'task.skipped');
  await expect(app.tid(page, 'task.skipped.levelHint')).toHaveCount(1);
  await expect(app.tid(page, 'task.skipped.levelChanged')).toHaveCount(0);
  await expect(app.tid(page, 'task.next.note'), '1 回目：中級に未出が残るので通常の文').toHaveText(app.text(ja, 'task.next.note'));

  await app.next(page);
  const second = await app.readTask(page);
  expect(second.id).toBe(mid[1].id);
  expect(second.nthToday).toBe('2');
  await app.tid(page, 'task.report.tooHard').click();
  await app.expectState(page, 'task.skipped');
  await expect(app.tid(page, 'task.skipped.levelChanged')).toHaveCount(1);
  await expect(app.tid(page, 'task.skipped.levelChanged')).toHaveText(app.fill(app.text(ja, 'task.skipped.levelChanged'), { level: app.text(ja, 'level.beginner') }));
  await expect(app.tid(page, 'task.skipped.levelHint')).toHaveCount(0);
  const note = app.tid(page, 'task.next.note');
  await expect(note).toHaveCount(1);
  await expect(note).toHaveText(app.fill(app.text(ja, 'task.next.note.last'), { area: app.text(ja, `area.${AREA}`), level: app.text(ja, 'level.beginner') }));
  // 文書順：levelChanged の後に note（design 5.1 #54）
  expect(await page.evaluate(() => {
    const a = document.querySelector('[data-testid="task.skipped.levelChanged"]');
    const b = document.querySelector('[data-testid="task.next.note"]');
    return !!a && !!b && Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  }), 'levelChanged が note より前').toBe(true);
  await app.shot(page, testInfo, 'DESIGN_D44_task.skipped_levelChanged_note.last');

  await app.next(page, { to: 'task.exhausted' });
  await expect(app.tid(page, 'task.exhausted.levelDone')).toHaveText(app.fill(app.text(ja, 'task.exhausted.levelDone'), { area: app.text(ja, `area.${AREA}`), level: app.text(ja, 'level.beginner') }));
  await expect(app.tid(page, 'task.exhausted.seenNext'), '中級に未出が残り履歴に中級の行があるので seenNext').toHaveCount(1);
});
