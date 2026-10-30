// 画面を操作し、読むための共通の関数。要素は contracts/identifiers.md の data-testid でだけ探す。
// 待つのは状態（data-state）や要素の変化だけ。待ち時間の定数は WAIT_MS の 1 か所。
import { expect } from '@playwright/test';

export const WAIT_MS = 10_000;

/** 'YYYY-MM-DD' の 10:00（Asia/Tokyo）の Date。W-3 の setFixedTime に渡す。 */
export function jst(ymd, time = '10:00:00') {
  return new Date(`${ymd}T${time}+09:00`);
}

export async function fixDate(page, ymd, time) {
  await page.clock.setFixedTime(jst(ymd, time));
}

export const root = (page) => page.locator('html');

export async function expectState(page, state, timeout = WAIT_MS) {
  await expect(root(page)).toHaveAttribute('data-state', state, { timeout });
}

export async function readState(page) {
  return root(page).getAttribute('data-state');
}

export async function open(page, baseURL) {
  await page.goto(baseURL);
}

export const tid = (page, id) => page.getByTestId(id);

/** 今日の課題の素性（W-5）。 */
export async function readTask(page) {
  const el = tid(page, 'task.today');
  await expect(el).toHaveCount(1);
  return {
    id: await el.getAttribute('data-task-id'),
    area: await el.getAttribute('data-task-area'),
    level: await el.getAttribute('data-task-level'),
    mode: await el.getAttribute('data-task-mode'),
    title: (await tid(page, 'task.today.title').textContent())?.trim(),
  };
}

/**
 * 診断に答える。S1 なら「診断を始める」を押してから。S2 の 3 問に radio（area.*、level.*、years.*）で答え、最後に diagnosis.finish。
 * 時間はすべて「操作（click）の直前の t0」から「次の画面の印を確かめ終えた後」までの差（PRD AC-1「確定してから次の質問が表示されるまで」、
 * AC-2「1 秒以内に task.today が表示され」）。click の往復だけを計らない。
 * 戻り値：
 *   beginMs     「診断を始める」→ 1 問目（data-question-index=1）。S1 から始めなかったときは null
 *   transitions [1 問目 → 2 問目, 2 問目 → 3 問目]
 *   finishMs    diagnosis.finish → finishTo の状態（既定 task.today）。finishTo が null なら click が返るまで
 */
export async function diagnose(page, { area, level, years = '1to3' }, { finishTo = 'task.today', finishTimeout = WAIT_MS } = {}) {
  const progress = tid(page, 'diagnosis.progress');
  let beginMs = null;
  if ((await readState(page)) === 'diagnosis.start') {
    const tb = Date.now();
    await tid(page, 'diagnosis.start.begin').click();
    await expectState(page, 'diagnosis.question');
    await expect(progress).toHaveAttribute('data-question-index', '1');
    beginMs = Date.now() - tb;
  }
  await expectState(page, 'diagnosis.question');
  const transitions = [];

  await expect(progress).toHaveAttribute('data-question-index', '1');
  await tid(page, `area.${area}`).check();
  let t0 = Date.now();
  await tid(page, 'diagnosis.next').click();
  await expect(progress).toHaveAttribute('data-question-index', '2');
  transitions.push(Date.now() - t0);

  await tid(page, `level.${level}`).check();
  t0 = Date.now();
  await tid(page, 'diagnosis.next').click();
  await expect(progress).toHaveAttribute('data-question-index', '3');
  transitions.push(Date.now() - t0);

  await tid(page, `years.${years}`).check();
  t0 = Date.now();
  await tid(page, 'diagnosis.finish').click();
  if (finishTo) await expectState(page, finishTo, finishTimeout);
  const finishMs = Date.now() - t0;
  return { beginMs, transitions, finishMs };
}

export async function goSettings(page) {
  await tid(page, 'nav.settings').click();
  await expectState(page, 'settings');
}

export async function goHistory(page) {
  await tid(page, 'nav.history').click();
  await expectState(page, 'history');
}

/** 履歴の行（W-8）。新しい順。 */
export async function readHistoryRows(page) {
  const rows = tid(page, 'history.row');
  const n = await rows.count();
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = rows.nth(i);
    out.push({
      taskId: await r.getAttribute('data-task-id'),
      date: await r.getAttribute('data-date'),
      report: await r.getAttribute('data-report'),
      helpful: await r.getAttribute('data-helpful'),
    });
  }
  return out;
}

/** 設定の「書き出し」でダウンロードした JSON を読む（W-9）。設定の画面にいること。 */
export async function exportJson(page) {
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: WAIT_MS }), tid(page, 'settings.export').click()]);
  const file = await download.path();
  const { readFileSync } = await import('node:fs');
  return { json: JSON.parse(readFileSync(file, 'utf8')), file, suggestedFilename: download.suggestedFilename() };
}

/** 文言ファイル（W-14）。 */
export async function loadStrings(request, lang) {
  const res = await request.get(`i18n/${lang}.json`);
  expect(res.status(), `i18n/${lang}.json の状態コード`).toBe(200);
  return res.json();
}

/** 課題集（W-4、W-6）。 */
export async function loadTasks(request) {
  const res = await request.get('data/tasks.json');
  expect(res.status(), 'data/tasks.json の状態コード').toBe(200);
  return res.json();
}

/** {n} の差し込み（strings.md の 3。plural は使わないキーだけに使う）。 */
export function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in values ? String(values[k]) : m));
}

/** 送信の数え方（W-12）：fromServiceWorker でない応答 + requestfailed。start() の後から数える。 */
export function networkCounter(page) {
  let sends = 0;
  const log = [];
  const onResponse = (res) => {
    if (!res.fromServiceWorker()) {
      sends++;
      log.push(`response ${res.status()} ${res.url()}`);
    }
  };
  const onFailed = (req) => {
    sends++;
    log.push(`requestfailed ${req.url()} ${req.failure()?.errorText ?? ''}`);
  };
  return {
    start() {
      page.on('response', onResponse);
      page.on('requestfailed', onFailed);
    },
    stop() {
      page.off('response', onResponse);
      page.off('requestfailed', onFailed);
    },
    get count() {
      return sends;
    },
    get log() {
      return log;
    },
  };
}

/** SW の準備（W-13）：ready と controller。 */
export async function waitServiceWorkerReady(page) {
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return reg.active !== null;
    await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    return navigator.serviceWorker.controller !== null;
  });
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null), { timeout: WAIT_MS })
    .toBe(true);
}

/** スクリーンショット（証拠）。test-results の中に <name>.png を残し、報告にも添える。 */
export async function shot(page, testInfo, name) {
  const file = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await testInfo.attach(name, { path: file, contentType: 'image/png' });
  return file;
}

/**
 * キーボードの移動キー（contracts/test-hooks.md「キーボードの移動キー（AC-18）」）。
 * WebKit は Alt+Tab / Alt+Shift+Tab（macOS の Playwright WebKit では Tab がボタン、radio、リンクに止まらない。Safari の「Option+Tab ですべての項目に移る」と同じ）。
 * それ以外（Chromium）は Tab / Shift+Tab。確定のキー（Enter、Space）はどちらも同じ。
 */
export function engineOf(page) {
  return page.context().browser()?.browserType().name() ?? 'chromium';
}

export function navKeys(page) {
  return engineOf(page) === 'webkit' ? { next: 'Alt+Tab', prev: 'Alt+Shift+Tab' } : { next: 'Tab', prev: 'Shift+Tab' };
}

/** 「前の要素へ」を 1 回押す（AC-18 の Shift+Tab の確認）。 */
export async function pressPrev(page) {
  await page.keyboard.press(navKeys(page).prev);
}

/** 移動キーだけで data-testid の要素にフォーカスを移す（AC-18）。見つからなければ例外。 */
export async function tabTo(page, testId, { shift = false, max = 40 } = {}) {
  const keys = navKeys(page);
  const key = shift ? keys.prev : keys.next;
  for (let i = 0; i < max; i++) {
    const current = await page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? null);
    if (current === testId) return;
    await page.keyboard.press(key);
  }
  const last = await page.evaluate(() => document.activeElement?.outerHTML?.slice(0, 200));
  throw new Error(`${key} を ${max} 回押しても data-testid="${testId}" にフォーカスが来ない（最後：${last}）`);
}

/** フォーカスの見た目（AC-18）：activeElement の :focus-visible と、outline / box-shadow の幅（CSS px）。 */
export async function readFocusStyle(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return { testId: null, focusVisible: false, outlineWidth: 0, boxShadowWidth: 0 };
    const cs = getComputedStyle(el);
    const outlineWidth = cs.outlineStyle === 'none' ? 0 : parseFloat(cs.outlineWidth) || 0;
    let boxShadowWidth = 0;
    for (const part of cs.boxShadow.split(/,(?![^(]*\))/)) {
      const nums = part.match(/-?\d+(\.\d+)?px/g);
      if (nums && nums.length >= 4) boxShadowWidth = Math.max(boxShadowWidth, parseFloat(nums[3]));
    }
    return {
      testId: el.getAttribute('data-testid'),
      focusVisible: el.matches(':focus-visible'),
      outlineWidth,
      boxShadowWidth,
    };
  });
}

/**
 * 待つためではなく、PRD が「2 秒以上の間隔を空けて再読み込みする」と決めている AC-28 の When のためだけに使う。
 * 状態の変化を待つ所では使わない（waitFor / expect で待つ）。
 */
export const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 配布物の版（identifiers.md の 1）。 */
export async function readBuildVersion(page) {
  return root(page).getAttribute('data-build-version');
}
