// G3 の証拠：キーボードだけで一巡できるか（verifier）。受け入れテストではない（playwright test の対象外）。
// AC-18 の受け入れテストは S1 → S2 ×3 → S3 → S4 → S5 を通す。この道具はその外側（S3 のヘッダーと申告、S8 の全操作とダイアログの
// フォーカスの閉じ込めと Escape、S10 の details、S9 の戻るリンク）を移動キー（contracts/test-hooks.md「キーボードの移動キー（AC-18）」：
// WebKit は Alt+Tab、それ以外は Tab）と Enter / Space / Escape / 矢印だけで回り、止まった要素の data-testid の順を記録する。
//
//   node tools/keyboard-tour.mjs --browser chromium|webkit --log <ログのパス>
import { chromium, webkit } from '@playwright/test';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStaticServer } from '../server/static-server.mjs';
import { buildDist } from '../helpers/build.mjs';
import { DIST_VERSION } from '../helpers/paths.mjs';
import { injectSeed, loadSeed } from '../helpers/seed.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => (a.startsWith('--') ? [a.slice(2), arr[i + 1]] : [])).filter((x) => x.length));
const browserName = args.browser ?? 'chromium';
const keys = browserName === 'webkit' ? { next: 'Alt+Tab', prev: 'Alt+Shift+Tab' } : { next: 'Tab', prev: 'Shift+Tab' };
const lines = [];
const log = (s) => { lines.push(s); console.log(s); };
const active = (page) => page.evaluate(() => {
  const el = document.activeElement;
  const id = el?.getAttribute('data-testid') ?? (el ? el.tagName : null);
  return { id, focusVisible: !!el && el !== document.body && el.matches(':focus-visible'), outline: el && el !== document.body ? getComputedStyle(el).outlineWidth : null };
});
const state = (page) => page.locator('html').getAttribute('data-state');
async function waitState(page, s) { await page.waitForFunction((x) => document.documentElement.getAttribute('data-state') === x, s, { timeout: 10_000 }); }

/** 移動キーで一周する：BODY に戻るか同じ要素に戻るまで押し、順を返す（上限 60）。 */
async function cycle(page, label) {
  const order = [];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press(keys.next);
    const a = await active(page);
    order.push(`${a.id}${a.focusVisible ? '' : '(focus-visible なし)'}${a.outline && a.outline !== '3px' && a.id !== 'BODY' ? `(outline ${a.outline})` : ''}`);
    if (a.id === 'BODY' && i > 0) break;
  }
  log(`[${label}] ${keys.next} の順：${order.join(' > ')}`);
  return order;
}
async function tabTo(page, id, max = 60) {
  for (let i = 0; i < max; i++) {
    const a = await active(page);
    if (a.id === id) return a;
    await page.keyboard.press(keys.next);
  }
  throw new Error(`${keys.next} を ${max} 回押しても ${id} に届かない`);
}

async function main() {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'kyounoitte-kbd-'));
  const dist = buildDist({ out: path.join(tmp, 'dist'), version: DIST_VERSION });
  const server = await createStaticServer({ root: dist });
  const browser = await (browserName === 'webkit' ? webkit : chromium).launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
  const page = await context.newPage();
  const problems = [];
  try {
    log(`# browser: ${browserName}、移動キー：${keys.next} / ${keys.prev}、日付 2026-11-03、seed seed-three-done-one-answer.json`);
    await injectSeed(context, loadSeed('seed-three-done-one-answer.json'));
    await page.clock.setFixedTime(new Date('2026-11-03T10:00:00+09:00'));
    await page.goto(server.url);
    await waitState(page, 'task.done');
    log(`S5 task.done に到達（操作 0 回）`);
    const s5 = await cycle(page, 'S5 task.done');
    for (const need of ['app.name', 'nav.history', 'nav.settings', 'task.done.history']) if (!s5.some((x) => x.startsWith(need))) problems.push(`S5：${need} に止まらない`);

    // S5 → 履歴（リンクを Enter）
    await tabTo(page, 'task.done.history'); await page.keyboard.press('Enter'); await waitState(page, 'history');
    log(`S5 task.done.history を Enter → ${await state(page)}`);
    const s10 = await cycle(page, 'S10 history');
    if (!s10.some((x) => x.startsWith('history.row.answer'))) problems.push('S10：history.row.answer（summary）に止まらない');
    await tabTo(page, 'history.row.answer');
    await page.keyboard.press('Enter');
    const opened = await page.evaluate(() => document.activeElement?.closest('details')?.open ?? null);
    log(`S10 history.row.answer を Enter → details.open=${opened}`);
    if (opened !== true) problems.push('S10：summary を Enter で details が開かない');
    await page.keyboard.press('Space');
    const closed = await page.evaluate(() => document.activeElement?.closest('details')?.open ?? null);
    log(`S10 history.row.answer を Space → details.open=${closed}`);

    // 履歴 → 設定（nav.settings を Enter）
    await page.keyboard.press(keys.prev); // 1 つ戻れること
    log(`S10 ${keys.prev} → ${(await active(page)).id}`);
    await tabTo(page, 'nav.settings'); await page.keyboard.press('Enter'); await waitState(page, 'settings');
    log(`S10 nav.settings を Enter → ${await state(page)}`);
    const s8 = await cycle(page, 'S8 settings');
    for (const need of ['settings.export', 'settings.import', 'settings.redo', 'settings.stats.open', 'settings.history.open', 'settings.delete', 'settings.privacy'])
      if (!s8.some((x) => x.startsWith(need))) problems.push(`S8：${need} に止まらない`);
    if (s8.some((x) => x.startsWith('settings.import.file'))) problems.push('S8：隠した input settings.import.file に止まる（tabindex -1 のはず）');

    // 削除のダイアログ：初期フォーカス cancel、閉じ込め、Escape、戻り先
    await tabTo(page, 'settings.delete'); await page.keyboard.press('Enter');
    await page.getByTestId('settings.delete.confirm').waitFor({ state: 'visible', timeout: 10_000 });
    const initial = await active(page);
    log(`S8 settings.delete を Enter → ダイアログ、初期フォーカス ${initial.id}`);
    if (initial.id !== 'settings.delete.confirm.cancel') problems.push(`ダイアログの初期フォーカスが cancel でない：${initial.id}`);
    const inDialog = [];
    for (let i = 0; i < 6; i++) { await page.keyboard.press(keys.next); inDialog.push((await active(page)).id); }
    log(`ダイアログ内で ${keys.next} ×6：${inDialog.join(' > ')}`);
    if (inDialog.some((x) => !x.startsWith('settings.delete.confirm'))) problems.push(`ダイアログの外にフォーカスが出た：${inDialog.join(' > ')}`);
    await page.keyboard.press('Escape');
    await page.getByTestId('settings.delete.confirm').waitFor({ state: 'detached', timeout: 10_000 });
    const back = await active(page);
    log(`Escape → ダイアログが閉じ、フォーカス ${back.id}、data-state ${await state(page)}`);
    if (back.id !== 'settings.delete') problems.push(`Escape の後のフォーカスが settings.delete でない：${back.id}`);
    if ((await page.evaluate(() => localStorage.getItem('kyounoitte:data') !== null)) !== true) problems.push('Escape で削除された');

    // 統計 → 戻る
    await tabTo(page, 'settings.stats.open'); await page.keyboard.press('Enter'); await waitState(page, 'settings.stats');
    log(`S8 settings.stats.open を Enter → ${await state(page)}`);
    const s9 = await cycle(page, 'S9 settings.stats');
    if (!s9.some((x) => x.startsWith('settings.stats.back'))) problems.push('S9：settings.stats.back に止まらない');
    await tabTo(page, 'settings.stats.back'); await page.keyboard.press('Enter'); await waitState(page, 'settings');
    log(`S9 settings.stats.back を Enter → ${await state(page)}`);

    // やり直し → S2 の radio を矢印で選ぶ → やめる で S8 へ戻る
    await tabTo(page, 'settings.redo'); await page.keyboard.press('Enter'); await waitState(page, 'diagnosis.question');
    log(`S8 settings.redo を Enter → ${await state(page)}（${(await active(page)).id} にフォーカス）`);
    const s2 = await cycle(page, 'S2 diagnosis.question（やり直し）');
    if (!s2.some((x) => x.startsWith('diagnosis.cancel'))) problems.push('S2 やり直し：diagnosis.cancel に止まらない');
    await tabTo(page, 'area.backend');
    await page.keyboard.press('ArrowDown');
    const chosen = await page.evaluate(() => document.querySelector('[data-testid="diagnosis.question"] input:checked')?.getAttribute('data-testid') ?? null);
    log(`S2 radio で ArrowDown → checked=${chosen}、フォーカス ${(await active(page)).id}`);
    if (chosen !== 'area.frontend') problems.push(`矢印で次の radio が選ばれない：${chosen}`);
    await tabTo(page, 'diagnosis.cancel'); await page.keyboard.press('Enter'); await waitState(page, 'settings');
    log(`S2 diagnosis.cancel を Enter → ${await state(page)}`);

    // app.name で今日の課題へ
    await tabTo(page, 'app.name'); await page.keyboard.press('Enter');
    await page.waitForFunction(() => /^task\./.test(document.documentElement.getAttribute('data-state') ?? ''));
    log(`S8 app.name を Enter → ${await state(page)}`);
  } catch (e) {
    problems.push(`例外：${e.message.split('\n')[0]}`);
  } finally {
    await browser.close(); await server.close(); rmSync(tmp, { recursive: true, force: true });
  }
  log(`# 問題：${problems.length} 件${problems.length ? '\n' + problems.map((p) => `- ${p}`).join('\n') : ''}`);
  if (args.log) { mkdirSync(path.dirname(args.log), { recursive: true }); writeFileSync(args.log, lines.join('\n') + '\n'); }
  process.exit(problems.length ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
