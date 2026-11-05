// AC-35（PRD r11。FB-3）：完了の直後に累計と祝いの文が出て、連続や途切れの語は出ない。累計 6 → 7、10 → 11、29 → 30、99 → 100 の 4 通り + 語の検査。
// AC-36：今日の課題に、この段階の何件目かが出る（seed-ac36-three-issued.json、2026-11-04。index 4、total 14）。
// AC-37：今週の完了日数が、完了の直後の画面と統計に出る（AC-24 の seed、2026-11-06 金 → task.next → 完了 → 3。翌週の月曜 2026-11-09 は 0）。
// AC-38 の画面の側：task.today では task.insight.text が 0 件、完了の後の task.rate と task.done でその課題の insight が見え、task.skipped では 0 件。
// 要素と値：identifiers.md の 4（task.total.value の data-stat-completed、task.cheer の data-milestone、task.week の data-stat-days-completed-week、
// task.today の data-progress-index / -total）。数え方は data.md の 9。seed は W-7（AC-35 の 10、29、99 件は helpers/seed.mjs の completedSeed で W-7 の決まりどおりに作る）。
// 演出（design D-43）は contracts/test-hooks.md「完了の演出の確かめ方」：reduce で getAnimations 0 件と task.total.prev 0 件。AC にない状態なので名前は DESIGN_D43_（W-6）。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectSeed, loadContractFixture, completedSeed } from '../helpers/seed.mjs';
import { validate } from '../helpers/schema.mjs';

const AREA = 'backend';
const LEVEL = 'intermediate';
const FIRST = '2026-01-01';
const AC14_SEED = 'seeds/seed-ac14-three-completed.json';

/** 累計 n 件の seed で開き、task.today と統計の completed = n を確かめてから、task.today に戻す。 */
async function openWithCompleted({ context, page, baseURL, request, n }) {
  let seed;
  let day;
  let expectedId;
  if (n === 6) {
    seed = loadContractFixture('seeds/seed-ac35-six-completed.json');
    day = '2026-11-07';
    expectedId = 'backend-intermediate-007';
  } else {
    const tasks = await app.loadTasks(request);
    const built = completedSeed(tasks, { n, area: AREA, level: LEVEL, firstOpenDate: FIRST });
    seed = built.seed;
    day = built.nextDate;
    expectedId = built.nextId;
  }
  expect(seed.history.filter((r) => r.report === 'done'), `seed の完了の行は ${n}`).toHaveLength(n);
  await injectSeed(context, seed);
  await app.fixDate(page, day);
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  const task = await app.readTask(page);
  expect(task.id).toBe(expectedId);
  expect((await app.readStats(page))['data-stat-completed'], '完了の前の統計の completed').toBe(String(n));
  await page.reload();
  await app.expectState(page, 'task.today');
  return task;
}

/** S4 / S5 の累計と祝い（identifiers.md の 4、data.md の 9）。 */
async function expectTotalAndCheer(page, ja, { count, milestone, cheerKey }) {
  const total = app.tid(page, 'task.total.value');
  await expect(total).toHaveCount(1);
  await expect(total).toHaveAttribute('data-stat-completed', String(count));
  await expect(total).toHaveText(app.fill(ja['task.total.value'], { count }));
  await expect(total).toBeVisible();
  const cheer = app.tid(page, 'task.cheer');
  await expect(cheer).toHaveCount(1);
  await expect(cheer).toHaveAttribute('data-milestone', milestone);
  const expected = cheerKey === 'task.cheer.default' ? app.fill(ja[cheerKey], { count }) : ja[cheerKey];
  await expect(cheer).toHaveText(expected);
  await expect(cheer).toBeVisible();
  if (cheerKey !== 'task.cheer.default') {
    expect(expected, '節目の文言は節目でないとき（task.cheer.default）と異なる').not.toBe(app.fill(ja['task.cheer.default'], { count }));
  }
}

const CASES = [
  { n: 6, milestone: '7', cheerKey: 'task.cheer.at7' },
  { n: 10, milestone: 'none', cheerKey: 'task.cheer.default' },
  { n: 29, milestone: '30', cheerKey: 'task.cheer.at30' },
  { n: 99, milestone: '100', cheerKey: 'task.cheer.at100' },
];

for (const c of CASES) {
  const count = c.n + 1;
  test(`AC35_累計${c.n}で完了するとtask.rateとtask.doneに累計${count}が見え_task.cheerのdata-milestoneが${c.milestone}で文言が${c.cheerKey}`, async ({ context, page, baseURL, request }, testInfo) => {
    const ja = await app.loadStrings(request, 'ja');
    await openWithCompleted({ context, page, baseURL, request, n: c.n });

    await app.tid(page, 'task.report.done').click();
    await app.expectState(page, 'task.rate');
    await expectTotalAndCheer(page, ja, { count, milestone: c.milestone, cheerKey: c.cheerKey });
    // 演出が終わってから撮る（task.total.prev は animationend で DOM から外れる：identifiers.md の 3、test-hooks.md「完了の演出の確かめ方」）
    await expect(app.tid(page, 'task.total.prev')).toHaveCount(0);
    await app.shot(page, testInfo, `AC35_task.rate_total${count}`);

    await app.tid(page, 'task.rate.close').click();
    await app.expectState(page, 'task.done');
    await expectTotalAndCheer(page, ja, { count, milestone: c.milestone, cheerKey: c.cheerKey });
    await app.shot(page, testInfo, `AC35_task.done_total${count}`);

    await page.reload();
    await app.expectState(page, 'task.done');
    await expectTotalAndCheer(page, ja, { count, milestone: c.milestone, cheerKey: c.cheerKey });
    expect((await app.readStats(page))['data-stat-completed'], '完了の後の統計の completed').toBe(String(count));
  });
}

test('AC35_ja.jsonとen.jsonの全キーの値に連続途切れ逃したstreakmissedが0件', async ({ request }, testInfo) => {
  // strings.md の 7.1：ja の 3 語は部分一致、en は /\b(streak|missed)\b/i。どちらの語も両方のファイルの値に当てる。課題集の本文は含めない。
  const JA_WORDS = ['連続', '途切れ', '逃した'];
  const EN_RE = /\b(streak|missed)\b/i;
  const bad = [];
  let checked = 0;
  for (const lang of ['ja', 'en']) {
    const strings = await app.loadStrings(request, lang);
    const { ok, errors } = validate('strings', strings);
    expect(ok, `${lang}.json が strings.schema.json に通る：${errors}`).toBe(true);
    for (const [k, v] of Object.entries(strings)) {
      checked++;
      for (const w of JA_WORDS) if (String(v).includes(w)) bad.push(`${lang} ${k}: 「${w}」`);
      const m = String(v).match(EN_RE);
      if (m) bad.push(`${lang} ${k}: "${m[1]}"`);
    }
  }
  testInfo.annotations.push({ type: '検査した値', description: `${checked} 件（ja + en）` });
  expect(checked).toBeGreaterThanOrEqual(174 * 2);
  expect(bad, bad.join('\n')).toEqual([]);
});

test.describe('DESIGN_D43 完了の演出（prefers-reduced-motion: reduce）', () => {
  test.use({ reducedMotion: 'reduce' });
  test('DESIGN_D43_reduceで完了するとtask.rateのgetAnimationsが0件でtask.total.prevが0件_task.rate.markはあり累計は最終の値', async ({ context, page, baseURL, request }) => {
    const ja = await app.loadStrings(request, 'ja');
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), 'reduce の偽装').toBe(true);
    await openWithCompleted({ context, page, baseURL, request, n: 6 });
    await app.tid(page, 'task.report.done').click();
    await app.expectState(page, 'task.rate');
    const m = await page.evaluate(() => ({ animations: document.getAnimations().length, prev: document.querySelectorAll('[data-testid="task.total.prev"]').length }));
    expect(m.animations, 'document.getAnimations().length').toBe(0);
    expect(m.prev, 'task.total.prev の件数').toBe(0);
    await expect(app.tid(page, 'task.rate.mark')).toHaveCount(1);
    await expectTotalAndCheer(page, ja, { count: 7, milestone: '7', cheerKey: 'task.cheer.at7' });
  });
});

test('DESIGN_D43_reduceでないとき完了直後のtask.rateにgetAnimationsが1件以上あり_累計は描いた直後から最終の値', async ({ context, page, baseURL, request }) => {
  const ja = await app.loadStrings(request, 'ja');
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);
  await openWithCompleted({ context, page, baseURL, request, n: 10 });
  await app.tid(page, 'task.report.done').click();
  await app.expectState(page, 'task.rate');
  const m = await page.evaluate(() => ({
    animations: document.getAnimations().length,
    total: document.querySelector('[data-testid="task.total.value"]')?.getAttribute('data-stat-completed') ?? null,
  }));
  expect(m.animations, 'S4 に着いた直後の document.getAnimations().length').toBeGreaterThanOrEqual(1);
  expect(m.total, '描いた直後の data-stat-completed').toBe('11');
  await expect(app.tid(page, 'task.rate.mark')).toHaveCount(1);
  await expect(app.tid(page, 'task.total.prev')).toHaveCount(0);
  await expectTotalAndCheer(page, ja, { count: 11, milestone: 'none', cheerKey: 'task.cheer.default' });
});

test('AC36_3件出した翌日のtask.todayのdata-progress-indexが4でtotalが14で_同じ2つの数がtask.progressの文言に見える', async ({ context, page, baseURL, request }, testInfo) => {
  const ja = await app.loadStrings(request, 'ja');
  const seed = loadContractFixture('seeds/seed-ac36-three-issued.json');
  expect(seed.history.map((r) => r.report)).toEqual(['done', 'too_hard', 'none']);
  await injectSeed(context, seed);
  await app.fixDate(page, '2026-11-04');
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  const task = await app.readTask(page);
  expect(task.id).toBe('backend-intermediate-004');
  expect(task.nthToday).toBe('1');
  expect(task.progressIndex, 'data-progress-index').toBe('4');
  expect(task.progressTotal, 'data-progress-total').toBe('14');
  const progress = app.tid(page, 'task.progress');
  await expect(progress).toHaveCount(1);
  await expect(progress).toBeVisible();
  await expect(progress).toHaveText(app.fill(ja['task.progress'], { index: 4, total: 14 }));
  await app.shot(page, testInfo, 'AC36_task.today_progress_4_of_14');
});

test('AC37_金曜にtask.nextで出た課題を完了するとtask.doneのtask.weekと統計のdays-completed-weekが3でextraは1のまま_翌週の月曜は0', async ({ context, page, baseURL, request }, testInfo) => {
  const ja = await app.loadStrings(request, 'ja');
  await injectSeed(context, loadContractFixture('seeds/seed-ac24-stats.json'));
  await app.fixDate(page, '2026-11-06');
  await app.open(page, baseURL);
  await app.expectState(page, 'task.skipped');
  await app.next(page);
  const task = await app.readTask(page);
  expect(task.nthToday, '11-06 の 2 件目').toBe('2');
  await app.tid(page, 'task.report.done').click();
  await app.expectState(page, 'task.rate');
  await app.tid(page, 'task.rate.close').click();
  await app.expectState(page, 'task.done');
  const week = app.tid(page, 'task.week');
  await expect(week).toHaveCount(1);
  await expect(week).toHaveAttribute('data-stat-days-completed-week', '3');
  await expect(week).toHaveText(app.fill(ja['task.week'], { days: 3 }));
  await expect(week).toBeVisible();
  await app.shot(page, testInfo, 'AC37_task.done_week3');
  const stats = await app.readStats(page);
  expect(stats['data-stat-days-completed-week']).toBe('3');
  expect(stats['data-stat-extra-completed'], '11-06 の完了はその日の最初の 1 件なので extra は 1 のまま').toBe('1');
  expect(stats['data-stat-completed']).toBe('5');

  await app.fixDate(page, '2026-11-09');
  await page.reload();
  await app.expectState(page, 'task.today');
  const monday = await app.readStats(page);
  expect(monday['data-stat-days-completed-week'], '翌週の月曜').toBe('0');
  expect(monday['data-stat-extra-completed']).toBe('1');
  testInfo.annotations.push({ type: 'days-completed-week', description: `2026-11-06: 3、2026-11-09: 0` });
});

test('AC38_task.todayではtask.insight.textが0件で_完了するとtask.rateとtask.doneにその課題のinsightが見え_再読み込みしても見える', async ({ context, page, baseURL, request }, testInfo) => {
  const ja = await app.loadStrings(request, 'ja');
  const tasks = await app.loadTasks(request);
  await injectSeed(context, loadContractFixture(AC14_SEED));
  await app.fixDate(page, '2026-11-04');
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  const task = await app.readTask(page);
  const insight = tasks.tasks.find((t) => t.id === task.id)?.insight;
  expect(typeof insight, `${task.id} の insight`).toBe('string');
  await expect(app.tid(page, 'task.insight.text')).toHaveCount(0);
  await expect(app.tid(page, 'task.insight')).toHaveCount(0);
  expect(await page.evaluate((s) => document.body.textContent.includes(s), insight), 'task.today の文書に insight の文字列がない').toBe(false);

  await app.tid(page, 'task.report.done').click();
  await app.expectState(page, 'task.rate');
  await expect(app.tid(page, 'task.insight.text')).toHaveCount(1);
  await expect(app.tid(page, 'task.insight.text')).toHaveText(insight);
  await expect(app.tid(page, 'task.insight.text')).toBeVisible();
  await expect(app.tid(page, 'task.insight')).toHaveText(ja['task.insight']);
  await app.shot(page, testInfo, 'AC38_task.rate_insight');

  await app.tid(page, 'task.rate.helpful').click();
  await app.expectState(page, 'task.done');
  await expect(app.tid(page, 'task.insight.text')).toHaveText(insight);
  await expect(app.tid(page, 'task.insight.text')).toBeVisible();
  await app.shot(page, testInfo, 'AC38_task.done_insight');

  await page.reload();
  await app.expectState(page, 'task.done');
  await expect(app.tid(page, 'task.insight.text')).toHaveText(insight);
  testInfo.annotations.push({ type: 'insight', description: `${task.id}: ${insight}` });
});

test('AC38_難しすぎを申告したtask.skippedではtask.insight.textが0件', async ({ context, page, baseURL }) => {
  await injectSeed(context, loadContractFixture(AC14_SEED));
  await app.fixDate(page, '2026-11-04');
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  await app.tid(page, 'task.report.tooHard').click();
  await app.expectState(page, 'task.skipped');
  await expect(app.tid(page, 'task.insight.text')).toHaveCount(0);
  await expect(app.tid(page, 'task.insight')).toHaveCount(0);
  await page.reload();
  await app.expectState(page, 'task.skipped');
  await expect(app.tid(page, 'task.insight.text')).toHaveCount(0);
});
