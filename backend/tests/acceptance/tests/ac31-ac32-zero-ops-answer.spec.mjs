// AC-31：診断済みなら、開いてから操作 0 回で今日の課題が見える（重なる要素 0 件。数え方は contracts/test-hooks.md「AC-31 の重なる要素の数え方」）。
// AC-32：途中で閉じても、同じ日なら書きかけの答えから再開できる（再読み込み、新しいタブ、翌日）。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectSeed, loadContractFixture } from '../helpers/seed.mjs';

const SEED = 'seeds/seed-ac14-three-completed.json';
const ANSWER_200 = 'テスト答え12345'.repeat(20);

/** 重なる要素：dialog の役割、aria-modal、題名の矩形と重なる position: fixed / sticky（題名の祖先は除く）。 */
async function countOverlays(page, titleTestId) {
  const dialogs = await page.getByRole('dialog').count();
  const modals = await page.locator('[aria-modal="true"]').count();
  const fixed = await page.evaluate((id) => {
    const title = document.querySelector(`[data-testid="${id}"]`);
    if (!title) return -1;
    const r = title.getBoundingClientRect();
    const hits = [];
    for (const el of document.querySelectorAll('body *')) {
      if (el === title || el.contains(title)) continue;
      const pos = getComputedStyle(el).position;
      if (pos !== 'fixed' && pos !== 'sticky') continue;
      const b = el.getBoundingClientRect();
      if (b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top) hits.push(el.tagName + (el.getAttribute('data-testid') ? `[${el.getAttribute('data-testid')}]` : ''));
    }
    return hits;
  }, titleTestId);
  return { dialogs, modals, fixed };
}

test('AC31_診断済みで開くと操作0回でtask.todayが見え_題名と4要素と答えの欄と4つの申告が同じ画面にあり_重なる要素0件', async ({ context, page, baseURL }, testInfo) => {
  await injectSeed(context, loadContractFixture(SEED));
  await app.fixDate(page, '2026-11-04');
  await app.open(page, baseURL);
  await page.waitForLoadState('load');
  await app.expectState(page, 'task.today');
  await app.shot(page, testInfo, 'AC31_task.today_zero_ops');

  for (const id of ['task.today.title', 'task.why.text', 'task.how.text', 'task.goal.text', 'task.answer', 'task.report.done', 'task.report.tooHard', 'task.report.tooEasy', 'task.report.noTime']) {
    await expect(app.tid(page, id), id).toHaveCount(1);
    await expect(app.tid(page, id), id).toBeVisible();
  }
  expect(await app.readState(page)).toBe('task.today');
  const o = await countOverlays(page, 'task.today.title');
  testInfo.annotations.push({ type: '重なる要素', description: JSON.stringify(o) });
  expect(o.dialogs).toBe(0);
  expect(o.modals).toBe(0);
  expect(o.fixed).toEqual([]);
});

test('AC31_今日の課題を完了済みなら操作0回でtask.doneが見え_重なる要素0件', async ({ context, page, baseURL }, testInfo) => {
  await injectSeed(context, loadContractFixture(SEED));
  await app.fixDate(page, '2026-11-03');
  await app.open(page, baseURL);
  await page.waitForLoadState('load');
  await app.expectState(page, 'task.done');
  await app.shot(page, testInfo, 'AC31_task.done_zero_ops');
  await expect(app.tid(page, 'task.done.title')).toBeVisible();
  const o = await countOverlays(page, 'task.done.title');
  testInfo.annotations.push({ type: '重なる要素', description: JSON.stringify(o) });
  expect(o.dialogs).toBe(0);
  expect(o.modals).toBe(0);
  expect(o.fixed).toEqual([]);
});

async function typeAnswer(context, page, baseURL) {
  await injectSeed(context, loadContractFixture(SEED));
  await app.fixDate(page, '2026-11-04');
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  const task = await app.readTask(page);
  expect([...ANSWER_200]).toHaveLength(200);
  await app.tid(page, 'task.answer').fill(ANSWER_200);
  // 最後の入力から 1 秒以内に保存（PRD 9、AC-32 の Given）。保存の合図 task.answer.saved を待つ。
  await expect(app.tid(page, 'task.answer.saved')).toBeVisible({ timeout: 1000 });
  return task;
}

test('AC32_200文字を入力して再読み込みすると_同じdata-task-idで答えがそのまま入っている', async ({ context, page, baseURL }, testInfo) => {
  const task = await typeAnswer(context, page, baseURL);
  await page.reload();
  await app.expectState(page, 'task.today');
  expect((await app.readTask(page)).id).toBe(task.id);
  await expect(app.tid(page, 'task.answer')).toHaveValue(ANSWER_200);
  await app.shot(page, testInfo, 'AC32_task.today_after_reload');
});

test('AC32_200文字を入力してタブを閉じ新しいタブで開くと_同じdata-task-idで答えがそのまま入っている', async ({ context, page, baseURL }) => {
  const task = await typeAnswer(context, page, baseURL);
  await page.close();
  const page2 = await context.newPage();
  await page2.goto(baseURL);
  await app.expectState(page2, 'task.today');
  expect((await app.readTask(page2)).id).toBe(task.id);
  await expect(app.tid(page2, 'task.answer')).toHaveValue(ANSWER_200);
});

test('AC32_翌日に開くと新しい課題の答えの欄は空で_前日の200文字は書き出しのnoneの行のanswerに残る', async ({ context, page, baseURL }, testInfo) => {
  const task = await typeAnswer(context, page, baseURL);
  await app.fixDate(page, '2026-11-05');
  await page.reload();
  await app.expectState(page, 'task.today');
  const next = await app.readTask(page);
  expect(next.id).not.toBe(task.id);
  await expect(app.tid(page, 'task.answer')).toHaveValue('');
  // 読み込みで着いた翌日の S3 には、日付が変わった知らせはない（identifiers.md 3、design D-30：知らせは操作で日付をまたいだときだけ）
  await expect(app.tid(page, 'task.dayChanged')).toHaveCount(0);

  await app.goSettings(page);
  const { json } = await app.exportJson(page);
  const row = json.history.find((r) => r.taskId === task.id);
  testInfo.annotations.push({ type: '前日の行', description: JSON.stringify({ ...row, answer: `${row?.answer?.length} 文字` }) });
  expect(row).toMatchObject({ date: '2026-11-04', report: 'none', answer: ANSWER_200 });
  expect(json.current).toMatchObject({ date: '2026-11-05', taskId: next.id, answer: '' });
});

test('AC32_画面を開いたまま翌日になった後に読み込まずに完了を押すと_完了は記録されず翌日の課題の答えの欄は空で_前日の200文字は書き出しのnoneの行のanswerに残る', async ({ context, page, baseURL }, testInfo) => {
  // PRD 11 の冒頭「日付をまたいだ申告はできない」（AC-32 を参照）、AC-32 の Then の翌日の部分。契約 data.md 4「画面を開いたまま日付が変わったとき」、W-3（読み込まずに setFixedTime を呼び直す）
  const task = await typeAnswer(context, page, baseURL);
  await app.fixDate(page, '2026-11-05', '00:05:00');
  await app.tid(page, 'task.report.done').click();
  // 完了は実行されず、翌日の課題が S3 に出る（task.rate に進まない）
  await app.expectState(page, 'task.today');
  const next = await app.readTask(page);
  expect(next.id).not.toBe(task.id);
  await expect(app.tid(page, 'task.answer')).toHaveValue('');
  await app.shot(page, testInfo, 'AC32_task.today_after_day_changed_by_operation');

  // 再読み込みしても翌日の課題のままで、答えの欄は空（前日の答えが翌日の current.answer に入っていない）
  await page.reload();
  await app.expectState(page, 'task.today');
  expect((await app.readTask(page)).id).toBe(next.id);
  await expect(app.tid(page, 'task.answer')).toHaveValue('');

  await app.goSettings(page);
  const { json } = await app.exportJson(page);
  const rows = json.history.filter((r) => r.taskId === task.id);
  testInfo.annotations.push({ type: '前日の行', description: JSON.stringify(rows.map((r) => ({ ...r, answer: `${r.answer.length} 文字` }))) });
  expect(rows, '前日の課題の行は none の 1 行だけ（done の行がない）').toHaveLength(1);
  expect(rows[0]).toMatchObject({ date: '2026-11-04', report: 'none', answer: ANSWER_200 });
  expect(json.current).toMatchObject({ date: '2026-11-05', taskId: next.id, answer: '' });
});

test('AC32_200文字を入力して保存を待たずに画面を開いたまま翌日になった後に完了を押すと_前日の200文字は書き出しのnoneの行のanswerに残り翌日の課題の答えの欄は空', async ({ context, page, baseURL }, testInfo) => {
  // AC-32 の Then「前日の 200 文字は書き出しファイルの前日の課題の行の answer に残っている」を、保存の合図 task.answer.saved を待たずに日付をまたぐ経路で確かめる
  // （契約 data.md 4 の 1：答えの保存のタイマーを止め、欄の値をメモリに持ち、6-1 の移しと 6-4 の今日の課題と 1 回の保存にまとめる。tech-lead G2 r3 の提案 2）。
  // 保存のタイマー（300 ms）が先に動いても none の行の answer は同じ値なので、どちらの順でも結果は変わらない。
  await injectSeed(context, loadContractFixture(SEED));
  await app.fixDate(page, '2026-11-04', '23:59:00');
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  const task = await app.readTask(page);
  expect([...ANSWER_200]).toHaveLength(200);
  await app.tid(page, 'task.answer').fill(ANSWER_200);
  // 保存を待たずに日付を進めて（W-3）完了を押す
  await app.fixDate(page, '2026-11-05', '00:01:00');
  await app.tid(page, 'task.report.done').click();
  await app.expectState(page, 'task.today');
  const next = await app.readTask(page);
  expect(next.id).not.toBe(task.id);
  await expect(app.tid(page, 'task.answer')).toHaveValue('');

  await app.goSettings(page);
  const { json } = await app.exportJson(page);
  const rows = json.history.filter((r) => r.taskId === task.id);
  testInfo.annotations.push({ type: '前日の行', description: JSON.stringify(rows.map((r) => ({ ...r, answer: `${r.answer.length} 文字` }))) });
  expect(rows, '前日の課題の行は none の 1 行だけ').toHaveLength(1);
  expect(rows[0]).toMatchObject({ date: '2026-11-04', report: 'none', answer: ANSWER_200 });
  expect(json.current).toMatchObject({ date: '2026-11-05', taskId: next.id, answer: '' });
});
