// AC-26：ブラウザの言語が英語なら画面の文言が英語で出る（locale en-US と ja-JP の 2 通り。W-14）。
// 文言ファイルは配布物の i18n/ja.json と i18n/en.json。キーの差 0 件、両方が strings.schema.json に通る。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { validate } from '../helpers/schema.mjs';

// 画面に必ずあるキー（design 6 の S1：題名、説明 3 つ、主操作、ヘッダーのアプリ名と設定）。比べる対象はこれに限らず、
// 画面にある data-testid のうち文言キーで差し込み（{…}）のないものすべて（tech-lead G2 r1 の提案）。
const MUST_KEYS = ['diagnosis.start.title', 'diagnosis.start.lead.1', 'diagnosis.start.lead.2', 'diagnosis.start.lead.3', 'diagnosis.start.begin', 'nav.settings', 'app.name'];

async function checkStart(page, baseURL, request, lang, testInfo) {
  const ja = await app.loadStrings(request, 'ja');
  const en = await app.loadStrings(request, 'en');
  const onlyJa = Object.keys(ja).filter((k) => !(k in en));
  const onlyEn = Object.keys(en).filter((k) => !(k in ja));
  testInfo.annotations.push({ type: 'キーの数', description: `ja ${Object.keys(ja).length}、en ${Object.keys(en).length}` });
  expect(onlyJa, 'ja にしかないキー').toEqual([]);
  expect(onlyEn, 'en にしかないキー').toEqual([]);
  for (const [name, doc] of [['ja', ja], ['en', en]]) {
    const { ok, errors } = validate('strings', doc);
    expect(ok, `i18n/${name}.json が strings.schema.json に通る：${errors}`).toBe(true);
  }

  const strings = lang === 'ja' ? ja : en;
  await app.fixDate(page, '2026-11-03');
  await app.open(page, baseURL);
  await app.expectState(page, 'diagnosis.start');
  await expect(app.root(page)).toHaveAttribute('lang', lang);
  // 描画されている要素だけ（identifiers.md 3「見える文字を持つ要素」。noscript や display:none の殻は除く）
  const onScreen = await page.evaluate(() => [...document.querySelectorAll('[data-testid]')].filter((el) => el.getClientRects().length > 0).map((el) => el.getAttribute('data-testid')));
  const keys = [...new Set(onScreen)].filter((k) => k in strings && !/\{/.test(strings[k]));
  testInfo.annotations.push({ type: `比べたキー（${lang}）`, description: `${keys.length} 個：${keys.join(', ')}` });
  expect(keys, '画面にある文言キー（差し込みなし）').toEqual(expect.arrayContaining(MUST_KEYS));
  for (const k of keys) await expect(app.tid(page, k), k).toHaveText(strings[k]);
  await app.shot(page, testInfo, `AC26_diagnosis.start_${lang}`);
}

test.describe('AC-26 locale en-US', () => {
  test.use({ locale: 'en-US' });
  test('AC26_en-USではdiagnosis.startの文言が英語の文言ファイルと一致し_キーの差が0件', async ({ page, baseURL, request }, testInfo) => {
    await checkStart(page, baseURL, request, 'en', testInfo);
  });
});

test.describe('AC-26 locale ja-JP', () => {
  test.use({ locale: 'ja-JP' });
  test('AC26_ja-JPではdiagnosis.startの文言が日本語の文言ファイルと一致する', async ({ page, baseURL, request }, testInfo) => {
    await checkStart(page, baseURL, request, 'ja', testInfo);
  });
});
