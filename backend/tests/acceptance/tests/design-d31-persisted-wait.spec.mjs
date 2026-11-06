// design D-31（AC にない状態）：S8 は描くたびに navigator.storage.persisted() を待つ。その「待つ上限」と「待つ間の操作」。
// 根拠：contracts/data.md 11「待つ上限は 1,000 ms」「待つ間は、前の画面がそのまま残り、その画面の操作も受け付けます」「待つ間に次の操作が始まったら、その操作を優先し、遅れて S8 を描きません」
// 「もう一度 S8 へ移る操作をしたら、後の操作の待ちだけが S8 を描きます」（コミット f40c61a）、contracts/test-hooks.md W-9「S8 の待つ上限を確かめるときは…」、design 4 の D-31、5 の S8。
// 名前は `DESIGN_D31_`（W-6）：確かめる結果（上限の後に注意なしで描かれる、待つ間の S2 の操作が通る、pageerror 0 件）は PRD AC-13 の Then
// （拒否を注入したとき S8 に settings.storage.notPersisted と書き出しの操作がある）にはない。AC13_ にすると、契約の新しい振る舞いだけが欠けたときに AC-13 が FAIL になる。
// 時間は契約「時間の計り方」の「文書が変わらない区間」のとおりページの中で計る（helpers/app.mjs の armTiming / readInterval）。sleep は使わず、
// 「答えが返った後」は stub が数える回数（readPersistedSettled）を待つ。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectSeed, loadContractFixture, injectPersistedStub, readPersistedSettled } from '../helpers/seed.mjs';

const SEED = 'seeds/seed-ac14-three-completed.json';
const DAY = '2026-11-04';
/** data.md 11 の待つ上限。 */
const LIMIT_MS = 1000;
/** 上限の後に S8 を描き終えるまでに許す幅（描画そのものの時間。上限の値ではない）。 */
const SLACK_MS = 500;

/** 印 persistRequested を入れた seed（W-9：印のない「あり」の seed は 6-4 で persist() を呼ぶ。このテストは persisted() だけを見る）。 */
function seedWithPersistRequested() {
  const seed = loadContractFixture(SEED);
  return { ...seed, device: { persistRequested: true } };
}

function collectPageErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e?.message ?? e)));
  return errors;
}

test('DESIGN_D31_persistedが1000msまでに返らないと_S8は上限の後にsettings.storage.notPersistedなしで描かれ_後から返っても描き直さず_pageerrorは0件', async ({ context, page, baseURL }, testInfo) => {
  // persisted() を上限よりずっと後（3,000 ms）に false で返す stub：上限までは「返らない」約束と同じで、上限の後に答えが返る経路も確かめられる（data.md 11「後から答えが返っても描き直しません」）。
  // 上限を置かない実装は答えが返る 3,000 ms まで待って描くので、区間の値でそれと分かる
  const DELAY_MS = 3000;
  await injectPersistedStub(context, { delayMs: DELAY_MS, value: false });
  await injectSeed(context, seedWithPersistRequested());
  const errors = collectPageErrors(page);
  await app.fixDate(page, DAY);
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  await app.armTiming(page);

  await app.tid(page, 'nav.settings').click();
  await app.expectState(page, 'settings');
  const waited = await app.readInterval(page, { startTestId: 'nav.settings', state: 'settings' });
  testInfo.annotations.push({ type: 'S8 を描くまで（ms）', description: `${waited}（上限 ${LIMIT_MS}、stub の答えは ${DELAY_MS} ms 後）` });
  expect(waited, '上限（1,000 ms）までは待つ').toBeGreaterThanOrEqual(LIMIT_MS);
  expect(waited, '上限の後にすぐ描く').toBeLessThanOrEqual(LIMIT_MS + SLACK_MS);
  expect(await readPersistedSettled(page), 'S8 を描いた時点では persisted() の答えはまだ返っていない').toBe(0);
  // 注意なし（「ない」と同じ扱い）。保存データは「あり」なので書き出しの操作はある
  await expect(app.tid(page, 'settings.storage.notPersisted')).toHaveCount(0);
  await expect(app.tid(page, 'settings.export')).toHaveCount(1);

  // 後から false が返っても描き直さない
  await expect.poll(() => readPersistedSettled(page), { timeout: app.WAIT_MS }).toBe(1);
  await expect(app.tid(page, 'settings.storage.notPersisted')).toHaveCount(0);
  expect(await app.readState(page)).toBe('settings');
  expect(errors, 'pageerror').toEqual([]);
});

test('DESIGN_D31_S8から入ったやり直しのS2でdiagnosis.cancelの直後にdiagnosis.nextを押すと_下書きのまま2問目に進みpageerror0件で_遅れてS8は描かれず_もう一度やめると後の待ちだけがS8を描く', async ({ context, page, baseURL }, testInfo) => {
  // data.md 11 の例（reviewer G2 r3 の要修正）：persisted() を約 800 ms 遅らせ、待つ間の S2 の操作が優先されること。
  // 「遅れて S8 を描かない」は、固定の秒数を待つ代わりに次の 2 つで見る：
  //   (1) 1 回目の「やめる」の答え（800 ms 後）が返った後も data-state が diagnosis.question のまま
  //   (2) 2 回目の「やめる」から S8 までの区間が stub の遅れ（800 ms）以上（1 回目の上限の timer（1,000 ms）が遅れて描いたなら、2 回目の click から 800 ms より前に settings になる）
  const DELAY_MS = 800;
  await injectPersistedStub(context, { delayMs: DELAY_MS, value: false });
  await injectSeed(context, seedWithPersistRequested());
  const errors = collectPageErrors(page);
  await app.fixDate(page, DAY);
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  await app.armTiming(page);

  await app.goSettings(page);
  await expect.poll(() => readPersistedSettled(page), { timeout: app.WAIT_MS }).toBe(1);
  await app.tid(page, 'settings.redo').click();
  await app.expectState(page, 'diagnosis.question');
  const progress = app.tid(page, 'diagnosis.progress');
  await expect(progress).toHaveAttribute('data-question-index', '1');
  await app.tid(page, 'area.frontend').check();

  // 「やめる」（S8 へ移る操作。persisted() を待つ）の直後に「次へ」
  await app.tid(page, 'diagnosis.cancel').click();
  await app.tid(page, 'diagnosis.next').click();
  // 次の問いに進み、その間の pageerror が 0 件（落ちたときに pageerror の中身も出るように一緒に見る）
  await expect
    .poll(async () => ({ index: await progress.getAttribute('data-question-index'), state: await app.readState(page), pageerror: [...errors] }), { timeout: app.WAIT_MS })
    .toEqual({ index: '2', state: 'diagnosis.question', pageerror: [] });

  // (1) 1 回目の答えが返った後も S2 のまま。下書き（1 問目の frontend）も残っている
  await expect.poll(() => readPersistedSettled(page), { timeout: app.WAIT_MS }).toBe(2);
  expect(await app.readState(page), '1 回目の「やめる」の答えが返った後も S2 のまま').toBe('diagnosis.question');
  await expect(progress).toHaveAttribute('data-question-index', '2');
  await app.tid(page, 'diagnosis.back').click();
  await expect(progress).toHaveAttribute('data-question-index', '1');
  await expect(app.tid(page, 'area.frontend'), '下書きのまま').toBeChecked();

  // (2) もう一度「やめる」：後の操作の待ちだけが S8 を描く（答え false なので注意あり）
  await app.tid(page, 'diagnosis.cancel').click();
  await app.expectState(page, 'settings');
  const waited = await app.readInterval(page, { startTestId: 'diagnosis.cancel', state: 'settings' });
  testInfo.annotations.push({ type: '2 回目の「やめる」から S8 まで（ms）', description: `${waited}（stub の答えは ${DELAY_MS} ms 後）` });
  expect(waited, '2 回目の「やめる」の答え（800 ms 後）で描かれた（1 回目の待ちが遅れて描いたのではない）').toBeGreaterThanOrEqual(DELAY_MS);
  expect(await readPersistedSettled(page)).toBe(3);
  await expect(app.tid(page, 'settings.storage.notPersisted')).toHaveCount(1);
  expect(errors, 'pageerror').toEqual([]);
});

test('DESIGN_D31_S8から入ったやり直しのS2でdiagnosis.cancelの直後に未選択のままdiagnosis.nextを押すと_error.diagnosis.requiredが出て1問目のままで_答えが返った後も遅れてS8は描かれず_もう一度やめると後の待ちだけがS8を描く', async ({ context, page, baseURL }, testInfo) => {
  // data.md 11「その操作が画面を移さないとき（必須のエラー、保存の失敗の表示）も同じです」：待つ間の操作が S2 を描き直さない（必須のエラーを出すだけ）ときも、
  // 前の「やめる」の待ちは捨てられ、遅れて S8 を描かない。上の 2 本目は「次へ」が 2 問目を描くので、描き直しで捨てる実装でも通る。この 1 本は描き直さない操作で確かめる。
  const DELAY_MS = 800;
  await injectPersistedStub(context, { delayMs: DELAY_MS, value: false });
  await injectSeed(context, seedWithPersistRequested());
  const errors = collectPageErrors(page);
  await app.fixDate(page, DAY);
  await app.open(page, baseURL);
  await app.expectState(page, 'task.today');
  await app.armTiming(page);

  await app.goSettings(page);
  await expect.poll(() => readPersistedSettled(page), { timeout: app.WAIT_MS }).toBe(1);
  await app.tid(page, 'settings.redo').click();
  await app.expectState(page, 'diagnosis.question');
  const progress = app.tid(page, 'diagnosis.progress');
  await expect(progress).toHaveAttribute('data-question-index', '1');

  // 「やめる」（S8 へ移る操作。persisted() を待つ）の直後に、何も選ばずに「次へ」→ 必須のエラー（画面を移さない操作）
  await app.tid(page, 'diagnosis.cancel').click();
  await app.tid(page, 'diagnosis.next').click();
  await expect(app.tid(page, 'error.diagnosis.required')).toHaveCount(1);
  await expect(progress).toHaveAttribute('data-question-index', '1');

  // 1 回目の「やめる」の答え（800 ms 後）が返った後も S2 の 1 問目のままで、エラーも残る（遅れて S8 を描かない）
  await expect.poll(() => readPersistedSettled(page), { timeout: app.WAIT_MS }).toBe(2);
  expect(await app.readState(page), '1 回目の「やめる」の答えが返った後も S2 のまま').toBe('diagnosis.question');
  await expect(progress).toHaveAttribute('data-question-index', '1');
  await expect(app.tid(page, 'error.diagnosis.required')).toHaveCount(1);
  await expect(app.tid(page, 'settings.title')).toHaveCount(0);

  // もう一度「やめる」：後の操作の待ちだけが S8 を描く（区間は stub の遅れ以上）
  await app.tid(page, 'diagnosis.cancel').click();
  await app.expectState(page, 'settings');
  const waited = await app.readInterval(page, { startTestId: 'diagnosis.cancel', state: 'settings' });
  testInfo.annotations.push({ type: '2 回目の「やめる」から S8 まで（ms）', description: `${waited}（stub の答えは ${DELAY_MS} ms 後）` });
  expect(waited, '2 回目の「やめる」の答えで描かれた').toBeGreaterThanOrEqual(DELAY_MS);
  expect(await readPersistedSettled(page)).toBe(3);
  await expect(app.tid(page, 'settings.storage.notPersisted')).toHaveCount(1);
  expect(errors, 'pageerror').toEqual([]);
});
