// 画面を操作し、読むための共通の関数。要素は contracts/identifiers.md の data-testid でだけ探す。
// 待つのは状態（data-state）や要素の変化だけ。待ち時間の定数は WAIT_MS の 1 か所。
import { test, expect } from '@playwright/test';

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

/**
 * 今日の課題の素性（W-5、identifiers.md の 4）。
 * r8（PRD r11）で足した 3 つ：nthToday（data-task-nth-today。その日の何件目か。AC-33）、progressIndex / progressTotal
 * （data-progress-index / -total。表示中の課題の組で何件目か と その組の総数。AC-36）。属性がなければ null（実装が古いと null になり、期待の値と比べて落ちる）。
 */
export async function readTask(page) {
  const el = tid(page, 'task.today');
  await expect(el).toHaveCount(1);
  return {
    id: await el.getAttribute('data-task-id'),
    area: await el.getAttribute('data-task-area'),
    level: await el.getAttribute('data-task-level'),
    mode: await el.getAttribute('data-task-mode'),
    nthToday: await el.getAttribute('data-task-nth-today'),
    progressIndex: await el.getAttribute('data-progress-index'),
    progressTotal: await el.getAttribute('data-progress-total'),
    title: (await tid(page, 'task.today.title').textContent())?.trim(),
  };
}

/**
 * 「次の一手に進む」（task.next。PRD 11 の冒頭、AC-33）を押して、to の状態（既定 task.today。組を出し終えていれば task.exhausted）を待つ。
 * 時間（AC-33 の 1 秒）は、同じ文書で armTiming を呼んでいれば readInterval({ startTestId: 'task.next', state: 'task.today' }) で読む
 * （契約「時間の計り方」の表の「次の一手に進む → 課題」の行）。この関数は押して待つだけで、時間は読まない。
 */
export async function next(page, { to = 'task.today', timeout = WAIT_MS } = {}) {
  await expect(tid(page, 'task.next')).toHaveCount(1);
  await tid(page, 'task.next').click();
  await expectState(page, to, timeout);
}

/** 統計の 11 の属性名（identifiers.md の 4、data.md の 9）。data-testid → data-stat-*。 */
export const STAT_ATTRS = {
  'settings.stats.firstOpenDate.value': 'data-stat-first-open-date',
  'settings.stats.issued.value': 'data-stat-issued',
  'settings.stats.completed.value': 'data-stat-completed',
  'settings.stats.firstDayCompleted.value': 'data-stat-first-day-completed',
  'settings.stats.daysCompleted7d.value': 'data-stat-days-completed-7d',
  'settings.stats.daysCompletedWeek.value': 'data-stat-days-completed-week',
  'settings.stats.extraCompleted.value': 'data-stat-extra-completed',
  'settings.stats.helpful.value': 'data-stat-helpful',
  'settings.stats.rated.value': 'data-stat-rated',
  'settings.stats.tooHard.value': 'data-stat-too-hard',
  'settings.stats.noTime.value': 'data-stat-no-time',
};

/**
 * 設定 → 統計（settings.stats）を開き、11 の data-stat-* を読む（W-15）。戻り値のキーは属性名（例 'data-stat-issued'）。
 * 画面は settings.stats のまま戻る。元の画面に戻るには再読み込み（起動時の判定で今日の状態に戻る。data.md の 4）。
 */
export async function readStats(page) {
  if ((await readState(page)) !== 'settings') await goSettings(page);
  await tid(page, 'settings.stats.open').click();
  await expectState(page, 'settings.stats');
  const out = {};
  for (const [testId, attr] of Object.entries(STAT_ATTRS)) {
    const dd = tid(page, testId);
    await expect(dd, testId).toHaveCount(1);
    out[attr] = await dd.getAttribute(attr);
  }
  return out;
}

/**
 * 時間の計り方（contracts/test-hooks.md「時間の計り方」の「文書が変わらない区間」。AC-1、AC-2。AC-12 で同じ操作を計るときも）。
 * 計る文書に 1 回だけ仕掛ける（再読み込みしたら入れ直す）。記録はテスト側の変数 globalThis.__acceptanceTiming（アプリは読まない）。
 *   始点：window の capture 段の click で performance.now() と、event.target.closest('[data-testid]') の data-testid を記録する。
 *   終点：MutationObserver（document、subtree、childList、attributes：data-state と data-question-index）。cb ではその時点の DOM
 *         （<html> の data-state、diagnosis.progress の data-question-index）を読み、前の記録から変わったら performance.now() と一緒に記録する。
 * setFixedTime の下でも、同じ文書の中の performance.now() の差は実際の時間どおりに進む（契約の 7）。Date.now() は止まるので使わない。
 */
export const TIMING_KEY = '__acceptanceTiming';

export async function armTiming(page) {
  await page.evaluate((key) => {
    if (globalThis[key]) return;
    const log = (globalThis[key] = { clicks: [], marks: [] });
    addEventListener(
      'click',
      (e) => {
        const el = e.target instanceof Element ? e.target.closest('[data-testid]') : null;
        log.clicks.push({ id: el?.getAttribute('data-testid') ?? null, t: performance.now() });
      },
      { capture: true },
    );
    const snap = () => ({
      state: document.documentElement.getAttribute('data-state'),
      index: document.querySelector('[data-testid="diagnosis.progress"]')?.getAttribute('data-question-index') ?? null,
    });
    let last = snap();
    new MutationObserver(() => {
      const now = snap();
      if (now.state === last.state && now.index === last.index) return;
      last = now;
      log.marks.push({ ...now, t: performance.now() });
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-state', 'data-question-index'] });
  }, TIMING_KEY);
}

/**
 * 区間の値（ms の整数。小数は切り上げ）＝終点 − 始点（契約の 4、5）。
 *   始点：startTestId の click のうち最後の 1 件（radio の check() も click を出すので testid で分ける）。
 *   終点：始点より後の記録のうち、state（と index）が一致する最初のもの。
 * 始点か終点の記録がなければ「計れなかった」として例外（null や 0 を通さない）。
 */
export async function readInterval(page, { startTestId, state, index = null }) {
  const log = await page.evaluate((key) => globalThis[key] ?? null, TIMING_KEY);
  if (!log) throw new Error(`時間の記録がない（armTiming をこの文書で呼んでいない）：${startTestId} → ${state}${index ? ` / ${index}` : ''}`);
  const start = log.clicks.filter((c) => c.id === startTestId).at(-1);
  if (!start) throw new Error(`始点の click の記録がない：${startTestId}（記録：${log.clicks.map((c) => c.id).join(', ') || 'なし'}）`);
  const end = log.marks.find((m) => m.t >= start.t && m.state === state && (index === null || m.index === index));
  if (!end) {
    const seen = log.marks.filter((m) => m.t >= start.t).map((m) => `${m.state}/${m.index}`).join(', ') || 'なし';
    throw new Error(`終点の記録がない：${startTestId} → data-state=${state}${index ? `、data-question-index=${index}` : ''}（始点の後の記録：${seen}）`);
  }
  return Math.ceil(end.t - start.t);
}

/**
 * 診断に答える。S1 なら「診断を始める」を押してから。S2 の 3 問に radio（area.*、level.*、years.*）で答え、最後に diagnosis.finish。
 * 時間は契約「時間の計り方」のとおりページの中で計る（始点：操作の click の capture 段、終点：data-state / data-question-index が条件を満たした
 * DOM の変化）。差を取った後で expect で状態と中身を確かめる（expect は時間には使わない）。
 * PRD AC-1「確定してから次の質問が表示されるまで 500 ms」、AC-2「1 秒以内に task.today が表示され」。
 * 戻り値（ms の整数）：
 *   beginMs     「診断を始める」→ 1 問目（data-state=diagnosis.question、data-question-index=1）。S1 から始めなかったときは null
 *   transitions [1 問目 → 2 問目, 2 問目 → 3 問目]
 *   finishMs    diagnosis.finish → finishTo の状態（既定 task.today）。finishTo が null なら計らず null
 */
export async function diagnose(page, { area, level, years = '1to3' }, { finishTo = 'task.today', finishTimeout = WAIT_MS } = {}) {
  const progress = tid(page, 'diagnosis.progress');
  await armTiming(page);
  let beginMs = null;
  if ((await readState(page)) === 'diagnosis.start') {
    await tid(page, 'diagnosis.start.begin').click();
    await expectState(page, 'diagnosis.question');
    await expect(progress).toHaveAttribute('data-question-index', '1');
    beginMs = await readInterval(page, { startTestId: 'diagnosis.start.begin', state: 'diagnosis.question', index: '1' });
  }
  await expectState(page, 'diagnosis.question');
  const transitions = [];

  await expect(progress).toHaveAttribute('data-question-index', '1');
  await tid(page, `area.${area}`).check();
  await tid(page, 'diagnosis.next').click();
  await expect(progress).toHaveAttribute('data-question-index', '2');
  transitions.push(await readInterval(page, { startTestId: 'diagnosis.next', state: 'diagnosis.question', index: '2' }));

  await tid(page, `level.${level}`).check();
  await tid(page, 'diagnosis.next').click();
  await expect(progress).toHaveAttribute('data-question-index', '3');
  transitions.push(await readInterval(page, { startTestId: 'diagnosis.next', state: 'diagnosis.question', index: '3' }));

  await tid(page, `years.${years}`).check();
  await tid(page, 'diagnosis.finish').click();
  let finishMs = null;
  if (finishTo) {
    await expectState(page, finishTo, finishTimeout);
    finishMs = await readInterval(page, { startTestId: 'diagnosis.finish', state: finishTo });
  }
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

/**
 * 設定の「書き出し」でダウンロードした JSON を読む（W-9）。設定の画面にいること。
 * 戻り値の file は、ダウンロードしたファイルを `download.saveAs` でそのテストの出力フォルダ（test-results/<テスト>/exports/）に
 * byte 単位で複製したもの。`download.path()` のファイルはコンテキストを閉じると Playwright が消すので（AC-20 は書き出し元の
 * コンテキストを閉じてから別のコンテキストに読み込ませる）、閉じても残る複製を返す。中身は書き直さない（JSON に通すのは検査のためだけ）。
 */
let exportSeq = 0;
export async function exportJson(page) {
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: WAIT_MS }), tid(page, 'settings.export').click()]);
  const suggestedFilename = download.suggestedFilename();
  const { readFileSync, mkdirSync } = await import('node:fs');
  const { join } = await import('node:path');
  const dir = test.info().outputPath('exports');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${++exportSeq}-${suggestedFilename || 'export.json'}`);
  await download.saveAs(file);
  return { json: JSON.parse(readFileSync(file, 'utf8')), file, suggestedFilename };
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

/** 文言ファイルの値（W-14）。キーがなければ、TypeError でなく「キーがない」と分かる形で落とす（実装が古くてキーがないときの赤の理由を読めるように）。 */
export function text(strings, key) {
  if (typeof strings?.[key] !== 'string') throw new Error(`文言ファイルにキー ${key} がない（機能がまだない、または strings.schema の required と食い違う）`);
  return strings[key];
}

/** {n} の差し込み（strings.md の 3。plural は使わないキーだけに使う）。template が文字列でなければ「キーがない」として落とす。 */
export function fill(template, values) {
  if (typeof template !== 'string') throw new Error(`差し込む文言がない（文言ファイルにキーがない）：${String(template)}。差し込み ${JSON.stringify(values)}`);
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

/**
 * SW の準備（W-13）：ready と controller。
 * navigator.serviceWorker.ready は SW が登録されないと解決しないので、WAIT_MS と競わせて「SW が登録されない」と分かる形で落とす
 * （待つためのタイマーではなく、止まらないための上限）。
 */
export async function waitServiceWorkerReady(page) {
  await page.evaluate(async (waitMs) => {
    const ready = (async () => {
      const reg = await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
      }
      return reg.active !== null && navigator.serviceWorker.controller !== null;
    })();
    const gaveUp = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`SW が登録されない：navigator.serviceWorker.ready と controller が ${waitMs} ms で満たされない（W-13）`)), waitMs),
    );
    return Promise.race([ready, gaveUp]);
  }, WAIT_MS);
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
  const browser = page.context().browser();
  if (!browser) throw new Error('ブラウザの種類が分からない（page.context().browser() が null）。移動キーを決められない');
  return browser.browserType().name();
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
