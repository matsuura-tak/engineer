// AC-17：幅 320 CSS px で文言が切れず横スクロールが出ない。AC-18：キーボードだけで診断から完了まで。
// AC-27：axe-core（WCAG 2.1 AA）で serious 以上の違反が 0 件（6 つの画面）。
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectSeed, loadContractFixture, exhaustedSeed } from '../helpers/seed.mjs';

const SEED = 'seeds/seed-ac14-three-completed.json';
// design/tokens.md の size.focus.width（3 px）。PRD AC-18 は「2 px 以上（design で決めた値があればその値以上）」。
const FOCUS_WIDTH_PX = 3;

// 画面を作る手順（状態ごと）。AC-17 と AC-27 で共通。
const SCREENS = {
  'diagnosis.start': async ({ page, baseURL }) => {
    await app.fixDate(page, '2026-11-03');
    await app.open(page, baseURL);
    await app.expectState(page, 'diagnosis.start');
  },
  'diagnosis.question': async ({ page, baseURL }) => {
    await app.fixDate(page, '2026-11-03');
    await app.open(page, baseURL);
    await app.expectState(page, 'diagnosis.start');
    await app.tid(page, 'diagnosis.start.begin').click();
    await app.expectState(page, 'diagnosis.question');
  },
  'task.today': async ({ context, page, baseURL }) => {
    await injectSeed(context, loadContractFixture(SEED));
    await app.fixDate(page, '2026-11-04');
    await app.open(page, baseURL);
    await app.expectState(page, 'task.today');
  },
  'task.done': async ({ context, page, baseURL }) => {
    await injectSeed(context, loadContractFixture(SEED));
    await app.fixDate(page, '2026-11-03');
    await app.open(page, baseURL);
    await app.expectState(page, 'task.done');
  },
  'task.exhausted': async ({ context, page, baseURL, request }) => {
    const tasks = await app.loadTasks(request);
    const { seed, nextDate } = exhaustedSeed(tasks, { area: 'backend', level: 'intermediate', firstOpenDate: '2026-09-01' });
    await injectSeed(context, seed);
    await app.fixDate(page, nextDate);
    await app.open(page, baseURL);
    await app.expectState(page, 'task.exhausted');
  },
  settings: async ({ context, page, baseURL }) => {
    await injectSeed(context, loadContractFixture(SEED));
    await app.fixDate(page, '2026-11-04');
    await app.open(page, baseURL);
    await app.expectState(page, 'task.today');
    await app.goSettings(page);
  },
};

// ---- AC-17 ----
test.describe('AC-17 幅 320 CSS px（deviceScaleFactor 2）', () => {
  test.use({ viewport: { width: 320, height: 568 }, deviceScaleFactor: 2 });

  for (const state of ['diagnosis.start', 'task.today', 'task.done', 'task.exhausted']) {
    test(`AC17_${state}_横スクロール0_切り詰め0_操作できる要素がすべて押せる`, async ({ context, page, baseURL, request }, testInfo) => {
      await SCREENS[state]({ context, page, baseURL, request });
      await app.shot(page, testInfo, `AC17_${state}_320`);

      const metrics = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const overflow = [];
        const ellipsis = [];
        for (const el of document.querySelectorAll('body *')) {
          if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth) overflow.push(el.tagName + (el.getAttribute('data-testid') ? `[${el.getAttribute('data-testid')}]` : ''));
          const cs = getComputedStyle(el);
          if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth) ellipsis.push(el.tagName + (el.getAttribute('data-testid') ? `[${el.getAttribute('data-testid')}]` : ''));
        }
        return { docWidth, clientWidth: document.documentElement.clientWidth, overflow, ellipsis };
      });
      testInfo.annotations.push({ type: 'scrollWidth', description: `${metrics.docWidth}（clientWidth ${metrics.clientWidth}）` });
      expect(metrics.docWidth, 'document.documentElement.scrollWidth').toBeLessThanOrEqual(320);
      expect(metrics.overflow, 'scrollWidth > clientWidth の要素').toEqual([]);
      expect(metrics.ellipsis, 'ellipsis で切り詰められた要素').toEqual([]);

      const interactive = page.locator('button, a[href], input:not([type="hidden"]), textarea, select, summary, [tabindex]:not([tabindex="-1"])').locator('visible=true');
      const n = await interactive.count();
      expect(n, '操作できる要素が 1 つ以上ある').toBeGreaterThan(0);
      const notPressable = [];
      for (let i = 0; i < n; i++) {
        const el = interactive.nth(i);
        if ((await el.getAttribute('aria-hidden')) === 'true') continue;
        await el.scrollIntoViewIfNeeded();
        const box = await el.boundingBox();
        const hit = await el.evaluate((node) => {
          const r = node.getBoundingClientRect();
          const target = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return target === node || node.contains(target) || (target instanceof HTMLLabelElement && target.control === node);
        });
        const label = await el.evaluate((node) => node.tagName + (node.getAttribute('data-testid') ? `[${node.getAttribute('data-testid')}]` : ''));
        if (!box || box.width <= 0 || box.height <= 0 || box.x < 0 || box.x + box.width > 320 || !hit) notPressable.push(`${label} box=${JSON.stringify(box)} hit=${hit}`);
      }
      expect(notPressable, 'scrollIntoView の後に押せない要素').toEqual([]);
    });
  }
});

// ---- AC-18 ----
test('AC18_Tab_Shift+Tab_Enter_Spaceだけで診断から完了まで進み_操作した要素がfocus-visibleで枠が3px以上', async ({ page, baseURL }, testInfo) => {
  await app.fixDate(page, '2026-11-03');
  await app.open(page, baseURL);
  await app.expectState(page, 'diagnosis.start');
  const records = [];
  const record = async (step) => {
    const s = await app.readFocusStyle(page);
    records.push({ step, ...s });
    return s;
  };
  const activate = async (testId, key, step) => {
    await app.tabTo(page, testId);
    const s = await record(step);
    expect(s.testId, step).toBe(testId);
    await page.keyboard.press(key);
  };

  await activate('diagnosis.start.begin', 'Enter', 'S1 診断を始める');
  await app.expectState(page, 'diagnosis.question');
  const progress = app.tid(page, 'diagnosis.progress');

  await activate('area.backend', 'Space', 'Q1 radio');
  await expect(app.tid(page, 'area.backend')).toBeChecked();
  await activate('diagnosis.next', 'Enter', 'Q1 次へ');
  await expect(progress).toHaveAttribute('data-question-index', '2');

  // Shift+Tab でも戻れる（Q2 の radio から前の要素へ）ことを 1 回だけ確かめ、Tab で戻る
  await app.tabTo(page, 'level.beginner');
  await page.keyboard.press('Shift+Tab');
  const back = await record('Q2 Shift+Tab');
  expect(back.testId).not.toBe('level.beginner');
  await activate('level.beginner', 'Space', 'Q2 radio');
  await expect(app.tid(page, 'level.beginner')).toBeChecked();
  await activate('diagnosis.next', 'Enter', 'Q2 次へ');
  await expect(progress).toHaveAttribute('data-question-index', '3');

  await activate('years.lt1', 'Space', 'Q3 radio');
  await expect(app.tid(page, 'years.lt1')).toBeChecked();
  await activate('diagnosis.finish', 'Enter', 'Q3 診断を終える');
  await app.expectState(page, 'task.today');

  await activate('task.report.done', 'Enter', 'S3 完了');
  await app.expectState(page, 'task.rate');
  await activate('task.rate.helpful', 'Enter', 'S4 役に立った');
  await app.expectState(page, 'task.done');
  await app.shot(page, testInfo, 'AC18_task.done');

  testInfo.annotations.push({ type: 'フォーカスの記録', description: JSON.stringify(records) });
  for (const r of records) {
    expect(r.focusVisible, `${r.step}（${r.testId}）が :focus-visible`).toBe(true);
    expect(Math.max(r.outlineWidth, r.boxShadowWidth), `${r.step}（${r.testId}）の枠の幅`).toBeGreaterThanOrEqual(FOCUS_WIDTH_PX);
  }
});

// ---- AC-27 ----
for (const state of ['diagnosis.start', 'diagnosis.question', 'task.today', 'task.done', 'task.exhausted', 'settings']) {
  test(`AC27_${state}_axe-coreでserious以上の違反が0件`, async ({ context, page, baseURL, request }, testInfo) => {
    await SCREENS[state]({ context, page, baseURL, request });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    await testInfo.attach(`axe_${state}.json`, { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    testInfo.annotations.push({ type: 'axe', description: `violations ${results.violations.length}（serious 以上 ${serious.length}）、passes ${results.passes.length}` });
    expect(serious.map((v) => `${v.id}（${v.impact}）: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`), 'serious 以上の違反').toEqual([]);
  });
}
