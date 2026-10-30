// AC-26：ブラウザの言語が英語なら画面の文言が英語で出る（locale en-US と ja-JP の 2 通り。W-14）。
// 文言ファイルは配布物の i18n/ja.json と i18n/en.json。キーの差 0 件、両方が strings.schema.json に通る。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { validate } from '../helpers/schema.mjs';

const KEYS = ['diagnosis.start.title', 'diagnosis.start.lead.1', 'diagnosis.start.lead.2', 'diagnosis.start.lead.3', 'diagnosis.start.begin', 'nav.settings', 'app.name'];

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
  for (const k of KEYS) await expect(app.tid(page, k), k).toHaveText(strings[k]);
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
