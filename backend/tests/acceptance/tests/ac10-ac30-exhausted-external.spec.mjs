// AC-10：課題が尽きたら隠さず知らせ、診断のやり直しへ案内する。AC-30：外で行う課題には、画面に印と要る道具が出る。
// どちらも課題集を差し替えず、本番の課題集から「出し終えた」履歴を seed に作る（PRD 11 AC-10 の確かめ方、W-4）。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectSeed, exhaustedSeed, makeSeed, tasksOf } from '../helpers/seed.mjs';

const FIRST = '2026-09-01';

test('AC10_課題が尽きるとtask.exhaustedと文言とやり直しの操作が出て_同じ領域と段階でやり直すと同じ日に再びtask.exhausted', async ({ context, page, baseURL, request }, testInfo) => {
  const ja = await app.loadStrings(request, 'ja');
  const tasks = await app.loadTasks(request);
  const { seed, list, nextDate } = exhaustedSeed(tasks, { area: 'backend', level: 'intermediate', firstOpenDate: FIRST });
  testInfo.annotations.push({ type: '出し終えた件数', description: String(list.length) });
  await injectSeed(context, seed);

  await app.fixDate(page, nextDate);
  await app.open(page, baseURL);
  await app.expectState(page, 'task.exhausted');
  await expect(app.tid(page, 'task.exhausted.message')).toHaveText(ja['task.exhausted.message']);
  await expect(app.tid(page, 'task.exhausted.redo')).toHaveCount(1);
  await expect(app.tid(page, 'task.today')).toHaveCount(0);
  await app.shot(page, testInfo, 'AC10_task.exhausted');

  await app.tid(page, 'task.exhausted.redo').click();
  await app.expectState(page, 'diagnosis.question');
  await app.diagnose(page, { area: 'backend', level: 'intermediate', years: '1to3' }, { finishTo: 'task.exhausted' });
  await expect(app.tid(page, 'task.today')).toHaveCount(0);
});

test('AC30_in_appを出し終えた翌日はexternalの課題が出て_印と要る道具が題名と同じ画面に見える', async ({ context, page, baseURL, request }, testInfo) => {
  const ja = await app.loadStrings(request, 'ja');
  const tasks = await app.loadTasks(request);
  const externals = tasks.tasks.filter((t) => t.mode === 'external');
  if (externals.length === 0) {
    // PRD AC-30 Given：本番の課題集に external が 0 件なら「該当なし」と記録して AC-29 で代える。
    testInfo.annotations.push({ type: '該当なし', description: '課題集に external の課題が 0 件（AC-29 で代える）' });
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
  await expect(app.tid(page, 'task.external.badge')).toHaveText(ja['task.external.badge']);
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
  for (const area of ['backend', 'frontend', 'database', 'infra', 'testing', 'git']) {
    for (const level of ['beginner', 'intermediate', 'advanced']) {
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
