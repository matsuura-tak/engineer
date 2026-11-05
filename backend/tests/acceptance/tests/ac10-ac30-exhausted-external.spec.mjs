// AC-10（PRD r11。FB-3）：段階の課題をやり切ると「修了」として知らせ、次の段階へ進むか別の領域を選べる。
//   初級と上級の 2 通り × 翌日の読み込みと同じ日の「次の一手に進む」の 2 通り = 4 本。
//   初級：h1 task.exhausted.levelDone、task.exhausted.advance 1 つ、task.exhausted.redo 1 つ。advance を押すと同じ日に task.today で level は intermediate、area は変わらない。
//   上級：h1 task.exhausted.allDone、redo 1 つ、advance 0 件。redo で同じ領域と段階を選ぶと同じ日に再び task.exhausted。
// AC-30：外で行う課題には、画面に印と要る道具が出る。
// どちらも課題集を差し替えず、本番の課題集から「出し終えた」履歴を seed に作る（PRD 11 AC-10 の確かめ方、W-4、W-7）。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectSeed, exhaustedSeed, makeSeed, tasksOf, addDays } from '../helpers/seed.mjs';
import { validate } from '../helpers/schema.mjs';

const FIRST = '2026-09-01';
const AREA = 'backend';
const AREAS = ['backend', 'frontend', 'database', 'infra', 'testing', 'git'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const NEXT_LEVEL = { beginner: 'intermediate', intermediate: 'advanced' };

/**
 * 目標の組（backend × level）を出し終えて task.exhausted に着く。
 *   via 'reload'：全件を出した履歴を seed にし、最後の行の翌日に開く（PRD の When「翌日にページを読み込む」）。
 *   via 'next'  ：最後の 1 件を残した履歴を seed にし、その翌日に開いて最後の課題を完了 → task.done → 「次の一手に進む」（PRD の When「同じ日に次の一手に進む」）。
 * 戻り値は、その日と、advance の後の task.today に期待する data-task-nth-today（reload は 1、next は 2：data.md の 9）。
 */
async function reachExhausted({ context, page, baseURL, tasks, level, via }) {
  const list = tasksOf(tasks, AREA, level);
  expect(list.length, `${AREA}/${level} の件数`).toBeGreaterThanOrEqual(7);
  if (via === 'reload') {
    const { seed, nextDate } = exhaustedSeed(tasks, { area: AREA, level, firstOpenDate: FIRST });
    await injectSeed(context, seed);
    await app.fixDate(page, nextDate);
    await app.open(page, baseURL);
    await app.expectState(page, 'task.exhausted');
    return { day: nextDate, nthAfterAdvance: '1', issued: list.length };
  }
  const seed = makeSeed({ area: AREA, level, firstOpenDate: FIRST, rows: list.slice(0, -1).map((t) => ({ taskId: t.id, report: 'done', mode: t.mode, helpful: 'helpful' })) });
  const day = addDays(FIRST, list.length - 1);
  await injectSeed(context, seed);
  await app.fixDate(page, day);
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  expect((await app.readTask(page)).id, '残した最後の課題が出る').toBe(list.at(-1).id);
  await app.tid(page, 'task.report.done').click();
  await app.expectState(page, 'task.rate');
  await app.tid(page, 'task.rate.close').click();
  await app.expectState(page, 'task.done');
  await app.next(page, { to: 'task.exhausted' });
  return { day, nthAfterAdvance: '2', issued: list.length };
}

for (const via of ['reload', 'next']) {
  const viaName = via === 'reload' ? '翌日に読み込む' : '同じ日にtask.nextを押す';

  test(`AC10_初級を出し終えて${viaName}と_levelDoneと次の段階へ進むと別の領域を選ぶが出て_進むと同じ日にintermediateのtask.today`, async ({ context, page, baseURL, request }, testInfo) => {
    const ja = await app.loadStrings(request, 'ja');
    const tasks = await app.loadTasks(request);
    const { nthAfterAdvance } = await reachExhausted({ context, page, baseURL, tasks, level: 'beginner', via });

    await expect(app.tid(page, 'task.exhausted.levelDone')).toHaveCount(1);
    await expect(app.tid(page, 'task.exhausted.levelDone')).toHaveText(app.fill(app.text(ja, 'task.exhausted.levelDone'), { area: app.text(ja, `area.${AREA}`), level: app.text(ja, 'level.beginner') }));
    await expect(app.tid(page, 'task.exhausted.allDone')).toHaveCount(0);
    await expect(app.tid(page, 'task.exhausted.advance')).toHaveCount(1);
    await expect(app.tid(page, 'task.exhausted.redo')).toHaveCount(1);
    await expect(app.tid(page, 'task.today')).toHaveCount(0);
    await app.shot(page, testInfo, `AC10_task.exhausted_levelDone_${via}`);

    await app.tid(page, 'task.exhausted.advance').click();
    await app.expectState(page, 'task.today');
    const task = await app.readTask(page);
    expect(task.level).toBe('intermediate');
    expect(task.area).toBe(AREA);
    expect(task.nthToday).toBe(nthAfterAdvance);
    expect(task.id, '次の段階の組の ID のうち最小').toBe(tasksOf(tasks, AREA, 'intermediate')[0].id);
    await app.shot(page, testInfo, `AC10_task.today_after_advance_${via}`);

    // 同じ日に再読み込みしても、進んだ先の課題のまま（data.md の 4 の 6-2）
    await page.reload();
    await app.expectState(page, 'task.today');
    expect((await app.readTask(page)).id).toBe(task.id);
  });

  test(`AC10_上級を出し終えて${viaName}と_allDoneと別の領域を選ぶが出て次の段階へ進むは0件_同じ領域と段階でやり直すと同じ日に再びtask.exhausted`, async ({ context, page, baseURL, request }, testInfo) => {
    const ja = await app.loadStrings(request, 'ja');
    const tasks = await app.loadTasks(request);
    await reachExhausted({ context, page, baseURL, tasks, level: 'advanced', via });

    await expect(app.tid(page, 'task.exhausted.allDone')).toHaveCount(1);
    await expect(app.tid(page, 'task.exhausted.allDone')).toHaveText(app.fill(app.text(ja, 'task.exhausted.allDone'), { area: app.text(ja, `area.${AREA}`) }));
    await expect(app.tid(page, 'task.exhausted.levelDone')).toHaveCount(0);
    await expect(app.tid(page, 'task.exhausted.advance')).toHaveCount(0);
    await expect(app.tid(page, 'task.exhausted.redo')).toHaveCount(1);
    await expect(app.tid(page, 'task.today')).toHaveCount(0);
    await app.shot(page, testInfo, `AC10_task.exhausted_allDone_${via}`);

    await app.tid(page, 'task.exhausted.redo').click();
    await app.expectState(page, 'diagnosis.question');
    await app.diagnose(page, { area: AREA, level: 'advanced', years: 'gte5' }, { finishTo: 'task.exhausted' });
    await expect(app.tid(page, 'task.exhausted.allDone')).toHaveCount(1);
    await expect(app.tid(page, 'task.exhausted.advance')).toHaveCount(0);
    await expect(app.tid(page, 'task.today')).toHaveCount(0);
  });
}

test('AC30_in_appを出し終えた翌日はexternalの課題が出て_印と要る道具が題名と同じ画面に見える', async ({ context, page, baseURL, request }, testInfo) => {
  const ja = await app.loadStrings(request, 'ja');
  const tasks = await app.loadTasks(request);
  // 「該当なし」の枝が、壊れた課題集や空の課題集でも緑にならないための守り（tech-lead G2 r1 の要修正）：
  // 課題集そのものが本物（tasks.schema.json に通り、AC-4（PRD r11）の量：210 件以上、初級と中級は 14 以上、上級は 7 以上）であることを先に確かめる。
  const { ok, errors } = validate('tasks', tasks);
  expect(ok, `tasks.schema.json：${errors}`).toBe(true);
  expect(tasks.tasks.length, '課題集の件数（210 以上）').toBeGreaterThanOrEqual(210);
  for (const a of AREAS) for (const l of LEVELS) expect(tasksOf(tasks, a, l).length, `組 ${a}/${l} の件数`).toBeGreaterThanOrEqual(l === 'advanced' ? 7 : 14);

  const externals = tasks.tasks.filter((t) => t.mode === 'external');
  if (externals.length === 0) {
    // PRD AC-30 Given：本番の課題集に external が 0 件なら「該当なし」と記録して AC-29 で代える（G3 の報告では PASS ではなく「該当なし」と書く）。
    testInfo.annotations.push({ type: '該当なし', description: `課題集 ${tasks.tasks.length} 件に external の課題が 0 件（AC-29 で代える）` });
    expect(externals).toHaveLength(0);
    return;
  }
  const first = [...externals].sort((a, b) => (a.id < b.id ? -1 : 1))[0];
  const { area, level } = first;
  const expected = tasksOf(tasks, area, level).filter((t) => t.mode === 'external')[0];
  const { seed, nextDate } = exhaustedSeed(tasks, { area, level, firstOpenDate: FIRST, only: 'in_app' });
  await injectSeed(context, seed);

  await app.fixDate(page, nextDate);
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  const task = await app.readTask(page);
  testInfo.annotations.push({ type: 'external の課題', description: `${task.id} tools=${JSON.stringify(expected.tools)}` });
  expect(task.id).toBe(expected.id);
  expect(task.mode).toBe('external');
  await expect(app.tid(page, 'task.today.title')).toHaveText(expected.title);
  await expect(app.tid(page, 'task.external.badge')).toBeVisible();
  await expect(app.tid(page, 'task.external.badge')).toHaveText(app.text(ja, 'task.external.badge'));
  const items = app.tid(page, 'task.external.tools.item');
  await expect(items).toHaveCount(expected.tools.length);
  for (let i = 0; i < expected.tools.length; i++) {
    await expect(items.nth(i)).toBeVisible();
    await expect(items.nth(i)).toHaveText(expected.tools[i]);
  }
  await app.shot(page, testInfo, 'AC30_task.today_external');
});

test('AC30_in_appの課題を出した日はdata-task-modeがin_appで印が0件', async ({ context, page, baseURL, request }, testInfo) => {
  const tasks = await app.loadTasks(request);
  let combo = null;
  for (const area of AREAS) {
    for (const level of LEVELS) {
      const list = tasksOf(tasks, area, level);
      if (list.length && list[0].mode === 'in_app') {
        combo = { area, level, task: list[0] };
        break;
      }
    }
    if (combo) break;
  }
  expect(combo, 'ID が最小の課題が in_app の組が 1 つ以上ある').not.toBeNull();
  await injectSeed(context, makeSeed({ area: combo.area, level: combo.level, firstOpenDate: '2026-11-01', rows: [] }));

  await app.fixDate(page, '2026-11-03');
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  const task = await app.readTask(page);
  expect(task.id).toBe(combo.task.id);
  expect(task.mode).toBe('in_app');
  await expect(app.tid(page, 'task.external.badge')).toHaveCount(0);
  await expect(app.tid(page, 'task.external.tools')).toHaveCount(0);
  await app.shot(page, testInfo, 'AC30_task.today_in_app');
});
