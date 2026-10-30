// AC-28：配布物を新しい版に差し替えると、オンラインで 3 回以内の読み込みで新しい版に切り替わり、履歴と診断は変わらない。
// 手順は contracts/test-hooks.md「AC-28 の配布物の差し替え」。旧版と新版は backend/scripts/build.mjs の CLI で作る。
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectSeed, loadContractFixture } from '../helpers/seed.mjs';
import { buildDist } from '../helpers/build.mjs';
import { createStaticServer } from '../server/static-server.mjs';
import { assertValid } from '../helpers/schema.mjs';

const OLD_VERSION = '2026-11-30.1';
const NEW_VERSION = '2026-12-14.1';
const NEW_TASK_ID = 'backend-intermediate-900';

test('AC28_差し替え後2秒おきの再読み込み3回以内でdata-build-versionが新版になり_旧版に戻らず_履歴3件と診断と段階は同じ', async ({ browser }, testInfo) => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'kyounoitte-ac28-'));
  const oldDist = buildDist({ out: path.join(tmp, 'old'), version: OLD_VERSION });
  const oldTasks = JSON.parse(readFileSync(path.join(oldDist, 'data', 'tasks.json'), 'utf8'));
  const base = oldTasks.tasks.find((t) => t.id.startsWith('backend-intermediate-'));
  expect(base, '旧版に backend-intermediate の課題がある').toBeTruthy();
  const newTasks = {
    ...oldTasks,
    tasks: [...oldTasks.tasks, { ...base, id: NEW_TASK_ID, mode: 'in_app', tools: [], title: '新版で足した課題（受け入れテスト）' }],
  };
  assertValid('tasks', newTasks, '新版の課題集');
  const newTasksFile = path.join(tmp, 'tasks-new.json');
  writeFileSync(newTasksFile, JSON.stringify(newTasks));
  const newDist = buildDist({ out: path.join(tmp, 'new'), version: NEW_VERSION, tasks: newTasksFile });

  const server = await createStaticServer({ root: oldDist });
  const context = await browser.newContext({ timezoneId: 'Asia/Tokyo', locale: 'ja-JP', acceptDownloads: true, baseURL: server.url });
  try {
    const seed = loadContractFixture('seeds/seed-ac14-three-completed.json');
    await injectSeed(context, seed);
    const page = await context.newPage();
    await app.fixDate(page, '2026-11-04');
    await app.open(page, server.url);
    await app.expectState(page, 'task.today');
    expect(await app.readBuildVersion(page)).toBe(OLD_VERSION);
    await app.waitServiceWorkerReady(page);
    await app.goSettings(page);
    await expect(app.tid(page, 'settings.version')).toContainText(OLD_VERSION);
    const before = await app.exportJson(page);

    // 配布物を新版に差し替える
    server.setRoot(newDist);
    const served = await (await page.request.get('data/tasks.json')).json();
    expect(served.tasks.length, '新版の課題集の件数が旧版より多い').toBeGreaterThan(oldTasks.tasks.length);

    const versions = [];
    let switched = false;
    for (let i = 1; i <= 3; i++) {
      await app.pause(2000); // PRD AC-28 When：2 秒以上の間隔を空けて再読み込み
      await page.reload();
      await expect(app.root(page)).toHaveAttribute('data-state', /^(task\.today|settings)$/);
      const v = await app.readBuildVersion(page);
      versions.push(v);
      if (v === NEW_VERSION) switched = true;
      if (switched) expect(v, `${i} 回目：新版になった後に旧版に戻らない`).toBe(NEW_VERSION);
    }
    testInfo.annotations.push({ type: 'data-build-version × 3', description: versions.join(', ') });
    expect(versions, '3 回目までのどこかで新版').toContain(NEW_VERSION);
    expect(versions[versions.length - 1]).toBe(NEW_VERSION);

    // 新版でも履歴 3 件、診断、段階は差し替えの前と同じ
    if ((await app.readState(page)) !== 'settings') {
      await app.expectState(page, 'task.today');
      await app.goSettings(page);
    }
    await expect(app.tid(page, 'settings.version')).toContainText(NEW_VERSION);
    const after = await app.exportJson(page);
    expect(after.json.history).toHaveLength(3);
    expect(after.json.history).toEqual(before.json.history);
    expect(after.json.diagnosis).toEqual(before.json.diagnosis);
    expect(after.json.levels).toEqual(before.json.levels);
    await app.shot(page, testInfo, 'AC28_settings_new_version');
  } finally {
    await context.close();
    await server.close();
  }
});
