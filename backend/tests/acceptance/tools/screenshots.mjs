// G3 の証拠を撮る道具（verifier）。受け入れテストではない（tests/ の外で *.spec.mjs でもないので playwright test の対象外。本数は 153 のまま）。
// design/001-daily-learning.md の 5（全画面・全状態）と contracts/identifiers.md の 2（data-state 12 値）・3（2 つのダイアログ）をそろえ、
// 通常の状態はライト、ダーク、大きい文字（ax5 の読み替え）、英語の 4 通り、ほかはライトで撮る。撮った画面ごとに axe-core（AC-27 と同じタグ）も流す。
//
//   node tools/screenshots.mjs --out <evidence のフォルダ> [--browser chromium|webkit|both]
//
// 画面は contracts/identifiers.md の data-testid と data-state でだけ探す。実装のモジュールは import しない（配布物は build.mjs の CLI で作り HTTP で配る）。
// 大きい文字（ax5）：design 9 の「OS の文字サイズ最大」の読み替えとして、`document.documentElement.style.fontSize = '200%'` を CSSOM で入れる
//   （tokens.md 冒頭：文字と余白は rem で、ブラウザの文字サイズ設定に追従する。CSP は CSSOM のプロパティ代入を止めない）。
//   幅 320 の方（ブラウザの拡大 200% の読み替え。PRD AC-17）は viewport 320 × 568 で別に撮る。
import { chromium, webkit, devices } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStaticServer } from '../server/static-server.mjs';
import { buildDist } from '../helpers/build.mjs';
import { DIST_VERSION, STORAGE_KEY, SEEDED_MARK } from '../helpers/paths.mjs';
import {
  injectSeed, injectStorageFailure, armStorageFailure, injectPersistDenied, injectStandalone,
  loadSeed, loadContractFixture, contractFixturePath, exhaustedSeed, makeSeed, tasksOf, addDays,
} from '../helpers/seed.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => (a.startsWith('--') ? [a.slice(2), arr[i + 1]] : [])).filter((x) => x.length));
const OUT = path.resolve(args.out ?? 'screenshots-out');
const BROWSERS = args.browser === 'webkit' ? ['webkit'] : args.browser === 'chromium' ? ['chromium'] : ['chromium', 'webkit'];
// --only <正規表現>：一致する scenario だけ撮り直し、既存の index.tsv と axe-summary.tsv の該当行を置き換える
const ONLY = args.only ? new RegExp(args.only) : null;
import { existsSync } from 'node:fs';
function mergeTsv(file, header, rows, keyOf) {
  let existing = [];
  if (ONLY && existsSync(file)) existing = readFileSync(file, 'utf8').trim().split('\n').slice(1).filter((l) => !rows.some((r) => keyOf(r) === keyOf(l.split('\t'))));
  writeFileSync(file, [header, ...existing, ...rows.map((r) => r.join('\t'))].join('\n') + '\n');
}
const WAIT = 10_000;
/** ダイアログの ax5 でのフォーカスの記録（dialog-ax5-focus.tsv）。 */
const dialogLines = [];
const PHONE = { width: 390, height: 844 };
const NARROW = { width: 320, height: 568 };
const iphone = devices['iPhone 15'];

const jst = (ymd, t = '10:00:00') => new Date(`${ymd}T${t}+09:00`);
const tid = (page, id) => page.getByTestId(id);
async function waitState(page, state) {
  await page.waitForFunction((s) => document.documentElement.getAttribute('data-state') === s, state, { timeout: WAIT });
}
async function waitVisible(page, id) {
  await tid(page, id).waitFor({ state: 'visible', timeout: WAIT });
}
/** 不透明度で現れる知らせ（task.answer.saved、settings.export.done：design 9 の reduced-motion の対象）は、計算済みの opacity が 1 になるまで待ってから撮る・監査する。
 *  途中の半透明で axe が文字色を地と混ぜて計ると（例：#1B6E3A が #40855a に見え 4.44:1）、本当の色（6.29:1）と違う結果になる。 */
async function waitOpaque(page, id) {
  await waitVisible(page, id);
  await page.waitForFunction((i) => { const el = document.querySelector(`[data-testid="${i}"]`); return !!el && getComputedStyle(el).opacity === '1'; }, id, { timeout: WAIT });
}
async function rawStorage(context, value) {
  await context.addInitScript(({ key, mark, value }) => {
    if (!localStorage.getItem(mark)) {
      localStorage.setItem(key, value);
      localStorage.setItem(mark, '1');
    }
  }, { key: STORAGE_KEY, mark: SEEDED_MARK, value });
}
async function open(page, baseURL, ymd) {
  if (ymd) await page.clock.setFixedTime(jst(ymd));
  await page.goto(baseURL);
}
async function diagnose(page, { area, level, years = '1to3' }) {
  if ((await page.locator('html').getAttribute('data-state')) === 'diagnosis.start') await tid(page, 'diagnosis.start.begin').click();
  await waitState(page, 'diagnosis.question');
  await tid(page, `area.${area}`).check();
  await tid(page, 'diagnosis.next').click();
  await tid(page, `level.${level}`).check();
  await tid(page, 'diagnosis.next').click();
  await tid(page, `years.${years}`).check();
  await tid(page, 'diagnosis.finish').click();
}
const AC14 = () => loadContractFixture('seeds/seed-ac14-three-completed.json');
const AC24 = () => loadContractFixture('seeds/seed-ac24-stats.json');

// 画面と状態の一覧。normal: true は 4 通り（light、dark、ax5、en）で撮る。narrow: true は幅 320 でも撮る。
// 各 run は (context, page, env) で画面を作り、最後に期待する data-state を返す（確かめに使う）。
const SCENARIOS = [
  { name: 'S0_loading', ac: '—（design 5 S0 通常 = loading）', normal: true, state: 'loading',
    async run(context, page, env) {
      await context.route('**/js/*.js', (r) => r.abort());
      await page.goto(env.baseURL);
      // app.loading は CSS だけで 1 秒後に不透明度で現れる（design 5 S0）。opacity 0 でも Playwright は visible とみなすので、計算済みの opacity が 1 になるのを待つ
      await page.waitForFunction(() => { const el = document.querySelector('[data-testid="app.loading"]'); return !!el && getComputedStyle(el).opacity === '1'; }, null, { timeout: WAIT });
    } },
  { name: 'S0_error_invalidData', ac: '—（design 5 S0 エラー (1)）', normal: true, state: 'error',
    async run(context, page, env) {
      await rawStorage(context, '{"formatVersion":1,"app":"kyounoitte","firstOpenDate":"2026-11-01","history":[{"date":"x"}]}');
      await open(page, env.baseURL, '2026-11-04');
      await waitState(page, 'error');
      await waitVisible(page, 'error.app.message');
    } },
  { name: 'S0_error_notJson', ac: '—（design 5 S0 エラー (1)）', state: 'error',
    async run(context, page, env) {
      await rawStorage(context, '{"formatVersion":1,');
      await open(page, env.baseURL, '2026-11-04');
      await waitState(page, 'error');
      await waitVisible(page, 'error.app.exportRaw');
    } },
  { name: 'S0_error_storageUnavailable', ac: '—（design 5 S0 エラー (2)）', state: 'error',
    async run(context, page, env) {
      await context.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); }, configurable: true });
      });
      await open(page, env.baseURL, '2026-11-04');
      await waitState(page, 'error');
      await waitVisible(page, 'error.app.storageUnavailable.message');
    } },
  { name: 'S0_error_dialog_delete', ac: '—（design 5 S0 エラー (1) → settings.delete.confirm）', state: 'error',
    async run(context, page, env) {
      await rawStorage(context, '{"formatVersion":1,"app":"kyounoitte","firstOpenDate":"2026-11-01","history":[{"date":"x"}]}');
      await open(page, env.baseURL, '2026-11-04');
      await waitState(page, 'error');
      await tid(page, 'error.app.delete').click();
      await waitVisible(page, 'settings.delete.confirm');
    } },
  { name: 'S1_diagnosis.start', ac: 'AC-1、AC-26', normal: true, narrow: true, state: 'diagnosis.start',
    async run(context, page, env) { await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'diagnosis.start'); } },
  { name: 'S1_addToHomeScreen', ac: 'AC-21', state: 'diagnosis.start', ua: 'iphone', extra: ['en'] /* design 9：home.addToHomeScreen.steps.4 の長い英語 */,
    async run(context, page, env) {
      await injectStandalone(context, false);
      await open(page, env.baseURL, '2026-11-04');
      await waitState(page, 'diagnosis.start');
      await waitVisible(page, 'home.addToHomeScreen.steps.4');
    } },
  { name: 'S1_standalone_import', ac: 'AC-22', state: 'diagnosis.start', ua: 'iphone',
    async run(context, page, env) {
      await injectStandalone(context, true);
      await open(page, env.baseURL, '2026-11-04');
      await waitState(page, 'diagnosis.start');
      await waitVisible(page, 'home.standalone.importButton');
    } },
  { name: 'S1_standalone_import_error', ac: 'AC-22、AC-25（design 5 S1 エラー）', state: 'diagnosis.start', ua: 'iphone',
    async run(context, page, env) {
      await injectStandalone(context, true);
      await open(page, env.baseURL, '2026-11-04');
      await waitState(page, 'diagnosis.start');
      await tid(page, 'home.standalone.importFile').setInputFiles(contractFixturePath('data/invalid-newer-version.json'));
      await waitVisible(page, 'error.import.message');
    } },
  { name: 'S2_question_1', ac: 'AC-1', normal: true, state: 'diagnosis.question',
    async run(context, page, env) {
      await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'diagnosis.start');
      await tid(page, 'diagnosis.start.begin').click(); await waitState(page, 'diagnosis.question');
    } },
  { name: 'S2_question_2', ac: 'AC-1', state: 'diagnosis.question',
    async run(context, page, env) {
      await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'diagnosis.start');
      await tid(page, 'diagnosis.start.begin').click(); await waitState(page, 'diagnosis.question');
      await tid(page, 'area.frontend').check(); await tid(page, 'diagnosis.next').click();
      await page.waitForFunction(() => document.querySelector('[data-testid="diagnosis.progress"]')?.getAttribute('data-question-index') === '2');
    } },
  { name: 'S2_question_3', ac: 'AC-1', state: 'diagnosis.question',
    async run(context, page, env) {
      await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'diagnosis.start');
      await tid(page, 'diagnosis.start.begin').click(); await waitState(page, 'diagnosis.question');
      await tid(page, 'area.frontend').check(); await tid(page, 'diagnosis.next').click();
      await tid(page, 'level.beginner').check(); await tid(page, 'diagnosis.next').click();
      await page.waitForFunction(() => document.querySelector('[data-testid="diagnosis.progress"]')?.getAttribute('data-question-index') === '3');
    } },
  { name: 'S2_error_required', ac: '—（design 5 S2 エラー (1)）', state: 'diagnosis.question',
    async run(context, page, env) {
      await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'diagnosis.start');
      await tid(page, 'diagnosis.start.begin').click(); await waitState(page, 'diagnosis.question');
      await tid(page, 'diagnosis.next').click();
      await waitVisible(page, 'error.diagnosis.required');
    } },
  { name: 'S2_error_storage', ac: 'AC-11', state: 'diagnosis.question',
    async run(context, page, env) {
      await injectStorageFailure(context);
      await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'diagnosis.start');
      await tid(page, 'diagnosis.start.begin').click(); await waitState(page, 'diagnosis.question');
      await tid(page, 'area.database').check(); await tid(page, 'diagnosis.next').click();
      await tid(page, 'level.advanced').check();
      await armStorageFailure(page);
      await tid(page, 'diagnosis.next').click();
      await waitVisible(page, 'error.storage.message');
    } },
  { name: 'S2_resume_inProgress', ac: '—（design 5 S2 通常：途中の再開）', state: 'diagnosis.question',
    async run(context, page, env) {
      await injectSeed(context, loadContractFixture('data/v1/valid-in-progress.json'));
      await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'diagnosis.question');
    } },
  { name: 'S2_redo_fromSettings', ac: 'AC-14（diagnosis.cancel あり）', state: 'diagnosis.question',
    async run(context, page, env) {
      await injectSeed(context, AC14());
      await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'task.today');
      await tid(page, 'nav.settings').click(); await waitState(page, 'settings');
      await tid(page, 'settings.redo').click(); await waitState(page, 'diagnosis.question');
      await waitVisible(page, 'diagnosis.cancel');
    } },
  { name: 'S3_task.today', ac: 'AC-2、AC-31', normal: true, state: 'task.today',
    async run(context, page, env) { await injectSeed(context, AC14()); await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'task.today'); } },
  { name: 'S3_task.today_dayChanged', ac: '—（design 5 S3、D-30：操作で日付をまたいだ知らせ）', normal: true, state: 'task.today',
    async run(context, page, env) {
      await injectSeed(context, AC14()); await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'task.today');
      await tid(page, 'task.answer').fill('23 時 55 分に書きかけ'); await waitVisible(page, 'task.answer.saved');
      await page.clock.setFixedTime(jst('2026-11-05', '00:05:00'));
      await tid(page, 'task.report.done').click(); await waitState(page, 'task.today'); await waitVisible(page, 'task.dayChanged');
      if ((await tid(page, 'task.answer').inputValue()) !== '') throw new Error('翌日の答えの欄が空でない');
    } },
  { name: 'S3_task.today_longest_inline_code', ac: 'AC-17（長いインラインコード）', narrow: true, narrowOnly: true, state: 'task.today',
    async run(context, page, env) {
      // W-7：課題の中身を ID で決め打ちしない。本文（why、how、goal）のインラインコード（バッククォート）が最も長い課題を課題集から引き、
      // 同じ組でそれより小さい ID を done の行にした seed で開く（data.md の 5：候補のうち ID が最小のものが出る）。
      const longest = env.tasks.tasks
        .map((t) => ({ t, len: Math.max(0, ...[t.why, t.how, t.goal].join('\n').split('`').filter((_, i) => i % 2 === 1).map((c) => [...c].length)) }))
        .sort((a, b) => b.len - a.len || (a.t.id < b.t.id ? -1 : 1))[0].t;
      const before = tasksOf(env.tasks, longest.area, longest.level).filter((t) => t.id < longest.id);
      const seed = makeSeed({ area: longest.area, level: longest.level, firstOpenDate: '2026-09-01',
        rows: before.map((t) => ({ taskId: t.id, report: 'done', mode: t.mode, helpful: 'helpful' })) });
      await injectSeed(context, seed);
      await open(page, env.baseURL, addDays('2026-09-01', before.length)); await waitState(page, 'task.today');
      const id = await tid(page, 'task.today').getAttribute('data-task-id');
      if (id !== longest.id) throw new Error(`期待した課題でない：${id}（期待 ${longest.id}）`);
    } },
  { name: 'S3_task.today_external', ac: 'AC-30', state: 'task.today', extra: ['en'] /* design 9：task.external.badge「Outside the browser」 */,
    async run(context, page, env) {
      const { seed, nextDate } = exhaustedSeed(env.tasks, { area: 'git', level: 'advanced', firstOpenDate: '2026-09-01', only: 'in_app' });
      await injectSeed(context, seed);
      await open(page, env.baseURL, nextDate); await waitState(page, 'task.today');
      await waitVisible(page, 'task.external.badge');
    } },
  { name: 'S3_answer_saved', ac: 'AC-32', state: 'task.today',
    async run(context, page, env) {
      await injectSeed(context, AC14()); await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'task.today');
      await tid(page, 'task.answer').fill('N+1 はループの中で 1 件ずつ取りに行くこと。JOIN か IN でまとめる。');
      await waitOpaque(page, 'task.answer.saved');
    } },
  { name: 'S3_answer_limit', ac: '—（design 5 S3：answer.max）', state: 'task.today',
    async run(context, page, env) {
      await injectSeed(context, AC14()); await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'task.today');
      await tid(page, 'task.answer').fill('あ'.repeat(2000));
      await waitVisible(page, 'task.answer.limit');
    } },
  { name: 'S3_error_storage_answer', ac: '—（design 5 S3 エラー (1)）', state: 'task.today',
    async run(context, page, env) {
      await injectStorageFailure(context);
      await injectSeed(context, AC14()); await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'task.today');
      await armStorageFailure(page);
      await tid(page, 'task.answer').fill('保存に失敗する答え');
      await waitVisible(page, 'error.storage.message');
    } },
  { name: 'S3_error_storage_report', ac: '—（design 5 S3 エラー (2)）', state: 'task.today',
    async run(context, page, env) {
      await injectStorageFailure(context);
      await injectSeed(context, AC14()); await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'task.today');
      await armStorageFailure(page);
      await tid(page, 'task.report.done').click();
      await waitVisible(page, 'error.storage.message');
    } },
  { name: 'S4_task.rate', ac: 'AC-5、AC-9', normal: true, state: 'task.rate',
    async run(context, page, env) {
      await injectSeed(context, AC14()); await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'task.today');
      await tid(page, 'task.report.done').click(); await waitState(page, 'task.rate');
    } },
  { name: 'S4_error_storage', ac: '—（design 5 S4 エラー）', state: 'task.rate',
    async run(context, page, env) {
      await injectStorageFailure(context);
      await injectSeed(context, AC14()); await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'task.today');
      await tid(page, 'task.report.done').click(); await waitState(page, 'task.rate');
      await armStorageFailure(page);
      await tid(page, 'task.rate.helpful').click();
      await waitVisible(page, 'error.storage.message');
    } },
  { name: 'S5_task.done', ac: 'AC-5、AC-31', normal: true, state: 'task.done',
    async run(context, page, env) { await injectSeed(context, AC14()); await open(page, env.baseURL, '2026-11-03'); await waitState(page, 'task.done'); } },
  { name: 'S6_task.skipped_too_hard', ac: 'AC-7（levelHint あり）', normal: true, state: 'task.skipped',
    async run(context, page, env) {
      await injectSeed(context, AC14()); await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'task.today');
      await tid(page, 'task.report.tooHard').click(); await waitState(page, 'task.skipped'); await waitVisible(page, 'task.skipped.levelHint');
    } },
  { name: 'S6_task.skipped_too_easy', ac: 'AC-7', state: 'task.skipped',
    async run(context, page, env) {
      await injectSeed(context, AC14()); await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'task.today');
      await tid(page, 'task.report.tooEasy').click(); await waitState(page, 'task.skipped');
    } },
  { name: 'S6_task.skipped_no_time', ac: 'AC-7（levelHint なし）', state: 'task.skipped',
    async run(context, page, env) {
      await injectSeed(context, AC14()); await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'task.today');
      await tid(page, 'task.report.noTime').click(); await waitState(page, 'task.skipped');
      if ((await tid(page, 'task.skipped.levelHint').count()) !== 0) throw new Error('no_time で levelHint が出た');
    } },
  { name: 'S7_task.exhausted_levelDone', ac: 'AC-10', normal: true, state: 'task.exhausted',
    async run(context, page, env) {
      const { seed, nextDate } = exhaustedSeed(env.tasks, { area: 'backend', level: 'intermediate', firstOpenDate: '2026-09-01' });
      await injectSeed(context, seed); await open(page, env.baseURL, nextDate); await waitState(page, 'task.exhausted');
    } },
  { name: 'S7_task.exhausted_dayChanged', ac: '—（design 5 S7、D-30：操作で日付をまたいだ知らせ）', normal: true, state: 'task.exhausted',
    async run(context, page, env) {
      const list = tasksOf(env.tasks, 'backend', 'intermediate');
      const firstOpenDate = '2026-09-01';
      const seed = makeSeed({ area: 'backend', level: 'intermediate', firstOpenDate,
        rows: list.slice(0, -1).map((t) => ({ taskId: t.id, report: 'done', mode: t.mode, helpful: 'helpful' })) });
      const day = addDays(firstOpenDate, list.length - 1);
      await injectSeed(context, seed); await open(page, env.baseURL, day); await waitState(page, 'task.today');
      await page.clock.setFixedTime(jst(addDays(day, 1), '00:05:00'));
      await tid(page, 'task.report.done').click(); await waitState(page, 'task.exhausted'); await waitVisible(page, 'task.dayChanged');
    } },
  { name: 'S8_settings', ac: 'AC-13、AC-19、AC-28', normal: true, state: 'settings',
    async run(context, page, env) {
      await injectSeed(context, AC14()); await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'task.today');
      await tid(page, 'nav.settings').click(); await waitState(page, 'settings');
    } },
  { name: 'S8_settings_noData', ac: '—（design 5 S8 空）', state: 'settings',
    async run(context, page, env) {
      await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'diagnosis.start');
      await tid(page, 'nav.settings').click(); await waitState(page, 'settings');
      if ((await tid(page, 'settings.export').count()) !== 0) throw new Error('保存データなしで settings.export が出た');
    } },
  { name: 'S8_settings_inProgress', ac: '—（design 5 S8 空：診断の途中）', state: 'settings',
    async run(context, page, env) {
      await injectSeed(context, loadContractFixture('data/v1/valid-in-progress.json'));
      await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'diagnosis.question');
      await tid(page, 'nav.settings').click(); await waitState(page, 'settings');
    } },
  { name: 'S8_settings_notPersisted', ac: 'AC-13', state: 'settings',
    async run(context, page, env) {
      await injectPersistDenied(context); // persist() と persisted() の両方を false にする（W-9、design D-31）
      await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'diagnosis.start');
      await diagnose(page, { area: 'testing', level: 'beginner' }); await waitState(page, 'task.today');
      await tid(page, 'nav.settings').click(); await waitState(page, 'settings');
      await waitVisible(page, 'settings.storage.notPersisted');
    } },
  { name: 'S8_export_done', ac: 'AC-19', state: 'settings',
    async run(context, page, env) {
      await injectSeed(context, AC14()); await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'task.today');
      await tid(page, 'nav.settings').click(); await waitState(page, 'settings');
      const [dl] = await Promise.all([page.waitForEvent('download', { timeout: WAIT }), tid(page, 'settings.export').click()]);
      await dl.path();
      await waitOpaque(page, 'settings.export.done');
    } },
  { name: 'S8_import_error_version', ac: 'AC-25', state: 'settings',
    async run(context, page, env) {
      await injectSeed(context, AC14()); await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'task.today');
      await tid(page, 'nav.settings').click(); await waitState(page, 'settings');
      await tid(page, 'settings.import.file').setInputFiles(contractFixturePath('data/invalid-newer-version.json'));
      await waitVisible(page, 'error.import.reason.version');
    } },
  { name: 'S8_import_error_schema', ac: '—（design 5 S8 エラー (1)）', state: 'settings',
    async run(context, page, env) {
      await injectSeed(context, AC14()); await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'task.today');
      await tid(page, 'nav.settings').click(); await waitState(page, 'settings');
      await tid(page, 'settings.import.file').setInputFiles(contractFixturePath('data/invalid-unknown-area.json'));
      await waitVisible(page, 'error.import.reason.schema');
    } },
  { name: 'S8_homeScreen_guide', ac: 'AC-21', state: 'settings', ua: 'iphone', extra: ['en'] /* design 9：settings.homeScreen.open「Show how to add to the Home Screen」 */,
    async run(context, page, env) {
      await injectStandalone(context, false);
      await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'diagnosis.start');
      await tid(page, 'home.addToHomeScreen.close').click();
      await tid(page, 'nav.settings').click(); await waitState(page, 'settings');
      await tid(page, 'settings.homeScreen.open').click();
      await waitVisible(page, 'home.addToHomeScreen.steps.4');
    } },
  // ダイアログ 2 つ：run で S8 まで進み、文字を 200%（ax5）にした後に openDialog で開く（design-reviewer G3 r1 の 2：利用者が見るとおり、大きい文字のままダイアログを開く）。
  // 撮るのは表示域だけ（fullPage でない）。ax5 では初期フォーカスの「やめる」が表示域に見え、移動キーで「削除する／置き換える」に届くかを記録する（dialog: に ok と cancel の id）。
  { name: 'dialog_settings.import.confirm', ac: 'AC-20', normal: true, state: 'settings', viewportOnly: true,
    dialog: { id: 'settings.import.confirm', ok: 'settings.import.confirm.ok', cancel: 'settings.import.confirm.cancel' },
    async run(context, page, env) {
      await injectSeed(context, AC14()); await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'task.today');
      await tid(page, 'nav.settings').click(); await waitState(page, 'settings');
    },
    async openDialog(page) {
      await tid(page, 'settings.import.file').setInputFiles(contractFixturePath('data/v1/valid-export-three-completed.json'));
      await waitVisible(page, 'settings.import.confirm');
    } },
  { name: 'dialog_settings.delete.confirm', ac: 'AC-16', normal: true, state: 'settings', viewportOnly: true,
    dialog: { id: 'settings.delete.confirm', ok: 'settings.delete.confirm.ok', cancel: 'settings.delete.confirm.cancel' },
    async run(context, page, env) {
      await injectSeed(context, AC14()); await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'task.today');
      await tid(page, 'nav.settings').click(); await waitState(page, 'settings');
    },
    async openDialog(page) {
      await tid(page, 'settings.delete').click();
      await waitVisible(page, 'settings.delete.confirm');
    } },
  { name: 'S9_settings.stats', ac: 'AC-24', normal: true, state: 'settings.stats',
    async run(context, page, env) {
      await injectSeed(context, AC24()); await open(page, env.baseURL, '2026-11-06');
      await page.waitForFunction(() => /^task\./.test(document.documentElement.getAttribute('data-state') ?? ''));
      await tid(page, 'nav.settings').click(); await waitState(page, 'settings');
      await tid(page, 'settings.stats.open').click(); await waitState(page, 'settings.stats');
    } },
  { name: 'S9_settings.stats_zero', ac: 'AC-24（design 5 S9 空）', state: 'settings.stats',
    async run(context, page, env) {
      await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'diagnosis.start');
      await diagnose(page, { area: 'infra', level: 'intermediate' }); await waitState(page, 'task.today');
      await tid(page, 'nav.settings').click(); await waitState(page, 'settings');
      await tid(page, 'settings.stats.open').click(); await waitState(page, 'settings.stats');
    } },
  { name: 'S10_history', ac: 'AC-5、AC-19', normal: true, state: 'history',
    async run(context, page, env) {
      await injectSeed(context, loadSeed('seed-three-done-one-answer.json')); await open(page, env.baseURL, '2026-11-03');
      await page.waitForFunction(() => /^task\./.test(document.documentElement.getAttribute('data-state') ?? ''));
      await tid(page, 'nav.history').click(); await waitState(page, 'history');
    } },
  { name: 'S10_history_answerOpen', ac: 'AC-19、AC-32', state: 'history',
    async run(context, page, env) {
      await injectSeed(context, loadSeed('seed-three-done-one-answer.json')); await open(page, env.baseURL, '2026-11-03');
      await page.waitForFunction(() => /^task\./.test(document.documentElement.getAttribute('data-state') ?? ''));
      await tid(page, 'nav.history').click(); await waitState(page, 'history');
      await tid(page, 'history.row.answer').first().click();
      await waitVisible(page, 'history.row.answerText');
    } },
  { name: 'S10_history_empty', ac: 'AC-16（design 5 S10 空）', state: 'history',
    async run(context, page, env) {
      await open(page, env.baseURL, '2026-11-04'); await waitState(page, 'diagnosis.start');
      await diagnose(page, { area: 'git', level: 'beginner' }); await waitState(page, 'task.today');
      await tid(page, 'nav.history').click(); await waitState(page, 'history');
      await waitVisible(page, 'history.empty');
    } },
];

const VARIANTS = {
  light: { colorScheme: 'light', locale: 'ja-JP' },
  dark: { colorScheme: 'dark', locale: 'ja-JP' },
  ax5: { colorScheme: 'light', locale: 'ja-JP', bigText: true },
  en: { colorScheme: 'light', locale: 'en-US' },
  w320: { colorScheme: 'light', locale: 'ja-JP', viewport: NARROW },
};

async function capture(browserName, browser, scenario, variantName, env, rows, axeRows) {
  const v = VARIANTS[variantName];
  const ctxOpts = {
    viewport: v.viewport ?? PHONE, deviceScaleFactor: 2, locale: v.locale, colorScheme: v.colorScheme,
    timezoneId: 'Asia/Tokyo', acceptDownloads: true,
  };
  if (scenario.ua === 'iphone') Object.assign(ctxOpts, { userAgent: iphone.userAgent, isMobile: browserName === 'chromium' ? true : undefined, hasTouch: true });
  const context = await browser.newContext(ctxOpts);
  const page = await context.newPage();
  const file = path.join(OUT, browserName === 'chromium' ? '' : browserName, `${scenario.name}_${variantName}.png`);
  const row = { file: path.relative(OUT, file), browser: browserName, scenario: scenario.name, variant: variantName, ac: scenario.ac,
    viewport: `${ctxOpts.viewport.width}x${ctxOpts.viewport.height}@2`, expectedState: scenario.state, state: null, lang: null, fontSize: null, result: 'ok', error: '' };
  try {
    await scenario.run(context, page, env);
    if (v.bigText) {
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    }
    // ダイアログは文字の大きさを決めた後に開く（利用者が見るとおり）
    if (scenario.openDialog) await scenario.openDialog(page);
    row.state = await page.locator('html').getAttribute('data-state');
    row.lang = await page.locator('html').getAttribute('lang');
    row.fontSize = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
    row.scrollWidth = await page.evaluate(() => `${document.documentElement.scrollWidth}/${document.documentElement.clientWidth}`);
    if (row.state !== scenario.state) { row.result = 'state-mismatch'; }
    mkdirSync(path.dirname(file), { recursive: true });
    await page.screenshot({ path: file, fullPage: !scenario.viewportOnly });
    if (scenario.dialog && v.bigText) {
      // 初期フォーカスの「やめる」が表示域に見えるか、移動キーで ok に届き、届いた ok が表示域に見えるか（design-reviewer G3 r1 の 2）
      const next = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
      const rectOf = (id) => page.evaluate((id) => {
        const el = document.querySelector(`[data-testid="${id}"]`); if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight, visible: r.top >= 0 && r.bottom <= window.innerHeight };
      }, id);
      const activeId = () => page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName ?? null);
      const initial = await activeId(); const cancelRect = await rectOf(scenario.dialog.cancel);
      let okId = null; let pressed = 0;
      for (; pressed < 6 && okId !== scenario.dialog.ok; pressed++) { await page.keyboard.press(next); okId = await activeId(); }
      const okRect = await rectOf(scenario.dialog.ok);
      const tabFile = file.replace(/\.png$/, '_tabOk.png');
      await page.screenshot({ path: tabFile, fullPage: false });
      const ok = initial === scenario.dialog.cancel && cancelRect?.visible && okId === scenario.dialog.ok && okRect?.visible;
      const line = `${browserName}\t${scenario.name}\t${variantName}\tinitialFocus=${initial}\tcancel=${JSON.stringify(cancelRect)}\t${next}×${pressed}→${okId}\tok=${JSON.stringify(okRect)}\t${ok ? 'ok' : 'NG'}\t${path.relative(OUT, tabFile)}`;
      dialogLines.push(line); console.log(`  dialog ${line}`);
      if (!ok) { row.result = 'dialog-focus'; row.error = line; }
    }
    if (variantName === 'light' || variantName === 'w320') {
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const axeFile = path.join(OUT, 'axe', `${browserName}_${scenario.name}_${variantName}.json`);
      mkdirSync(path.dirname(axeFile), { recursive: true });
      // incomplete（axe が判定できなかったもの）は、ノードの target と理由を残す（design-reviewer G3 r1 の 7）
      const incomplete = results.incomplete.map((i) => ({ id: i.id, impact: i.impact, description: i.description, help: i.help,
        nodes: i.nodes.map((n) => ({ target: n.target, html: n.html.slice(0, 300), failureSummary: n.failureSummary ?? null,
          reasons: [...n.any, ...n.all, ...n.none].map((c) => ({ id: c.id, message: c.message, data: c.data ?? null })) })) }));
      writeFileSync(axeFile, JSON.stringify({ url: results.url, state: row.state, violations: results.violations, incomplete, passes: results.passes.length }, null, 2));
      axeRows.push({ browser: browserName, scenario: scenario.name, variant: variantName, state: row.state,
        violations: results.violations.length, serious: results.violations.filter((x) => ['serious', 'critical'].includes(x.impact)).length,
        ids: results.violations.map((x) => `${x.id}(${x.impact}×${x.nodes.length})`).join(' '), passes: results.passes.length,
        incomplete: incomplete.reduce((n, i) => n + i.nodes.length, 0),
        incompleteIds: incomplete.map((i) => `${i.id}(${i.impact}×${i.nodes.length}:${i.nodes.map((n) => n.target.join(' ')).join('|')})`).join(' '),
        file: path.relative(OUT, axeFile) });
    }
  } catch (e) {
    row.result = 'error'; row.error = String(e.message ?? e).split('\n')[0].slice(0, 300);
    try { mkdirSync(path.dirname(file), { recursive: true }); await page.screenshot({ path: file.replace(/\.png$/, '_FAILED.png'), fullPage: true }); } catch {}
  } finally {
    await context.close();
  }
  rows.push(row);
  console.log(`${row.result.padEnd(14)} ${browserName.padEnd(8)} ${variantName.padEnd(5)} ${scenario.name} ${row.error}`);
}

async function main() {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'kyounoitte-shots-'));
  const dist = buildDist({ out: path.join(tmp, 'dist'), version: DIST_VERSION });
  const server = await createStaticServer({ root: dist });
  const tasks = JSON.parse(readFileSync(path.join(dist, 'data', 'tasks.json'), 'utf8'));
  const env = { baseURL: server.url, tasks };
  const rows = []; const axeRows = [];
  try {
    for (const browserName of BROWSERS) {
      const browser = await (browserName === 'webkit' ? webkit : chromium).launch();
      for (const sc of SCENARIOS) {
        if (ONLY && !ONLY.test(sc.name)) continue;
        const variants = browserName === 'chromium'
          ? (sc.narrowOnly ? ['w320'] : [...(sc.normal ? ['light', 'dark', 'ax5', 'en'] : ['light']), ...(sc.extra ?? []), ...(sc.narrow && !sc.narrowOnly ? ['w320'] : [])])
          : (sc.narrowOnly ? ['w320'] : ['light', ...(sc.dialog ? ['ax5'] : [])]);
        for (const vn of variants) await capture(browserName, browser, sc, vn, env, rows, axeRows);
      }
      await browser.close();
    }
  } finally {
    await server.close();
    rmSync(tmp, { recursive: true, force: true });
  }
  mergeTsv(path.join(OUT, 'index.tsv'), 'file\tbrowser\tviewport\tvariant\tscenario\tac\texpectedState\tstate\tlang\trootFontSize\tscrollWidth/clientWidth\tresult\terror',
    rows.map((r) => [r.file, r.browser, r.viewport, r.variant, r.scenario, r.ac, r.expectedState, r.state, r.lang, r.fontSize, r.scrollWidth, r.result, r.error]), (c) => c[0]);
  mergeTsv(path.join(OUT, 'axe', 'axe-summary.tsv'), 'browser\tscenario\tvariant\tstate\tviolations\tserious+\tids\tpasses\tincomplete\tincompleteIds\tfile',
    axeRows.map((r) => [r.browser, r.scenario, r.variant, r.state, r.violations, r.serious, r.ids, r.passes, r.incomplete, r.incompleteIds, r.file]), (c) => c[10]);
  if (dialogLines.length) mergeTsv(path.join(OUT, 'dialog-ax5-focus.tsv'), 'browser\tscenario\tvariant\tinitialFocus\tcancelRect\tkeys→active\tokRect\tresult\ttabOkFile', dialogLines.map((l) => l.split('\t')), (c) => `${c[0]}/${c[1]}`);
  const bad = rows.filter((r) => r.result !== 'ok');
  console.log(`\n撮った：${rows.length} 枚（問題 ${bad.length}）。axe：${axeRows.length} 画面、違反のある画面 ${axeRows.filter((r) => r.violations > 0).length}、incomplete のノード ${axeRows.reduce((n, r) => n + r.incomplete, 0)}`);
  process.exit(bad.length ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
