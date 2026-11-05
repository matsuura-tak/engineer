// AC-39（PRD r11。FB-1）：診断の 1 問目の 6 つの領域に、文言キー area.<ID>.desc の 1 行の説明が見え、ja と en で 6 件とも 1〜40 字（コードポイント）。幅 320 で scrollWidth ≤ 320。
// AC-40（PRD r11。FB-1、Q13 の A）：3 問目の選択肢が 5 つで、そのうち 1 つの value が未経験の ID `never`（identifiers.md の 5）。選んで終えると書き出しの diagnosis.years が never。
// 要素は identifiers.md の 3（radio は <input type="radio"> に data-testid、`area.*.desc` はラベルの中の説明の要素）。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';

const AREAS = ['backend', 'frontend', 'database', 'infra', 'testing', 'git'];
const YEARS = ['never', 'lt1', '1to3', '3to5', 'gte5'];
const TODAY = '2026-11-03';
const cp = (s) => (typeof s === 'string' ? [...s.trim()].length : -1);

async function openQuestion1(page, baseURL) {
  await app.fixDate(page, TODAY);
  await app.open(page, baseURL);
  await app.expectState(page, 'diagnosis.start');
  await app.tid(page, 'diagnosis.start.begin').click();
  await app.expectState(page, 'diagnosis.question');
  await expect(app.tid(page, 'diagnosis.progress')).toHaveAttribute('data-question-index', '1');
}

test('AC39_1問目の6つの領域にarea.descの説明が見え_jaとenの文言ファイルで6件とも1〜40字', async ({ page, baseURL, request }, testInfo) => {
  const ja = await app.loadStrings(request, 'ja');
  const en = await app.loadStrings(request, 'en');
  await openQuestion1(page, baseURL);
  await app.shot(page, testInfo, 'AC39_diagnosis.question_1');

  const lengths = [];
  for (const a of AREAS) {
    const key = `area.${a}.desc`;
    const desc = app.tid(page, key);
    await expect(desc, key).toHaveCount(1);
    await expect(desc, key).toBeVisible();
    await expect(desc, key).toHaveText(ja[key]);
    // 説明は選択肢と同じ label の中（identifiers.md の 3）
    await expect(desc.locator('xpath=ancestor::label[1]'), `${key} の label`).toHaveCount(1);
    await expect(app.tid(page, `area.${a}`)).toHaveCount(1);
    for (const [lang, strings] of [['ja', ja], ['en', en]]) {
      const n = cp(strings[key]);
      lengths.push(`${lang} ${key}=${n}`);
      expect(n, `${lang} の ${key} の字数（1〜40）`).toBeGreaterThanOrEqual(1);
      expect(n, `${lang} の ${key} の字数（1〜40）`).toBeLessThanOrEqual(40);
    }
  }
  testInfo.annotations.push({ type: 'area.*.desc の字数', description: lengths.join(', ') });
});

test.describe('AC-39 幅 320 CSS px（AC-17 と同じ条件）', () => {
  test.use({ viewport: { width: 320, height: 568 }, deviceScaleFactor: 2 });

  test('AC39_幅320で1問目を表示するとscrollWidthが320以下', async ({ page, baseURL }, testInfo) => {
    await openQuestion1(page, baseURL);
    await expect(app.tid(page, 'area.git.desc')).toBeVisible();
    const m = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
    testInfo.annotations.push({ type: 'scrollWidth', description: `${m.scrollWidth}（clientWidth ${m.clientWidth}）` });
    await app.shot(page, testInfo, 'AC39_diagnosis.question_1_320');
    expect(m.scrollWidth, 'document.documentElement.scrollWidth').toBeLessThanOrEqual(320);
  });
});

test('AC40_3問目の選択肢が5つでyears.neverのvalueがneverで_選んで終えると書き出しのdiagnosis.yearsがnever', async ({ page, baseURL, request }, testInfo) => {
  const ja = await app.loadStrings(request, 'ja');
  await openQuestion1(page, baseURL);
  await app.tid(page, 'area.frontend').check();
  await app.tid(page, 'diagnosis.next').click();
  await expect(app.tid(page, 'diagnosis.progress')).toHaveAttribute('data-question-index', '2');
  await app.tid(page, 'level.beginner').check();
  await app.tid(page, 'diagnosis.next').click();
  await expect(app.tid(page, 'diagnosis.progress')).toHaveAttribute('data-question-index', '3');

  const radios = page.locator('input[type="radio"]').locator('visible=true');
  await expect(radios, '3 問目の radio').toHaveCount(5);
  for (const y of YEARS) await expect(app.tid(page, `years.${y}`), `years.${y}`).toHaveCount(1);
  const never = app.tid(page, 'years.never');
  await expect(never).toHaveAttribute('value', 'never');
  await expect(never.locator('xpath=ancestor::label[1]'), 'years.never のラベル').toContainText(ja['years.never']);
  expect(await radios.evaluateAll((els) => els.filter((e) => e.value === 'never').length), 'value が never の radio').toBe(1);
  await app.shot(page, testInfo, 'AC40_diagnosis.question_3');

  await never.check();
  await app.tid(page, 'diagnosis.finish').click();
  await app.expectState(page, 'task.today');
  const task = await app.readTask(page);
  expect(task.area).toBe('frontend');
  expect(task.level, '段階の規則（AC-8）に影響しない：選んだ段階のまま').toBe('beginner');

  await app.goSettings(page);
  const { json } = await app.exportJson(page);
  expect(json.diagnosis.years).toBe('never');
  expect(json.diagnosis.area).toBe('frontend');
  expect(json.diagnosis.level).toBe('beginner');
});
