// 文言（public/js/i18n.js、public/i18n/*.json。contracts/strings.md）と、読み込みの入口（public/js/files.js。contracts/data.md の 7）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { pickLang, format } from '../../public/js/i18n.js';
import { readImport, IMPORT_MAX_BYTES } from '../../public/js/files.js';
import { ajvValidator, BACKEND_DIR, FIXTURES_DIR, readJsonFile } from './helpers.mjs';

const strings = ajvValidator('strings');

test('配る文言 ja.json と en.json が strings.schema.json に通り、キーの集合が同じ（AC-26）', () => {
  const ja = readJsonFile(path.join(BACKEND_DIR, 'public', 'i18n', 'ja.json'));
  const en = readJsonFile(path.join(BACKEND_DIR, 'public', 'i18n', 'en.json'));
  assert.equal(strings(ja), true, JSON.stringify(strings.errors?.slice(0, 3)));
  assert.equal(strings(en), true, JSON.stringify(strings.errors?.slice(0, 3)));
  assert.deepEqual(Object.keys(ja).sort(), Object.keys(en).sort());
  assert.equal(Object.keys(ja).length, 145);
});

test('pickLang：ja で始まれば ja、それ以外と空は en', () => {
  assert.equal(pickLang('ja-JP'), 'ja');
  assert.equal(pickLang('JA'), 'ja');
  assert.equal(pickLang('en-US'), 'en');
  assert.equal(pickLang('fr'), 'en');
  assert.equal(pickLang(undefined), 'en');
});

test('format：差し込みと plural、知らない名前はそのまま残す', () => {
  assert.equal(format('履歴 {count} 件、{date}', { count: 3, date: '2026-11-01' }), '履歴 3 件、2026-11-01');
  const en = '{n, plural, one {# entry} other {# entries}}';
  assert.equal(format(en, { n: 1 }, 'en'), '1 entry');
  assert.equal(format(en, { n: 2 }, 'en'), '2 entries');
  assert.equal(format(en, { n: 0 }, 'en'), '0 entries');
  assert.equal(format('{x} と {y}', { x: 'a' }), 'a と {y}');
  assert.equal(format('閉じない {x', { x: 1 }), '閉じない {x');
});

test('format：差し込む値は文字として入る（<script> を解釈しない。表示は textContent）', () => {
  assert.equal(format('{v}', { v: '<img src=x onerror=alert(1)>' }), '<img src=x onerror=alert(1)>');
});

const file = (text, size) => {
  const f = new File([text], 'x.json', { type: 'application/json' });
  if (size !== undefined) Object.defineProperty(f, 'size', { value: size });
  return f;
};

test('読み込み：正しいファイルは ok、版が新しければ version、その他は schema（AC-20、AC-25）', async () => {
  const valid = readFileSync(path.join(FIXTURES_DIR, 'data', 'v1', 'valid-export-three-completed.json'), 'utf8');
  assert.equal((await readImport(file(valid))).ok, true);
  const newer = readFileSync(path.join(FIXTURES_DIR, 'data', 'invalid-newer-version.json'), 'utf8');
  assert.deepEqual(await readImport(file(newer)), { ok: false, reason: 'version' });
  assert.deepEqual(await readImport(file('{oops')), { ok: false, reason: 'schema' });
  assert.deepEqual(await readImport(null), { ok: false, reason: 'schema' });
});

test('読み込み：5,000,000 バイトを超えるファイルは読まずに schema', async () => {
  let read = false;
  const big = file('{}', IMPORT_MAX_BYTES + 1);
  big.text = async () => {
    read = true;
    return '{}';
  };
  assert.deepEqual(await readImport(big), { ok: false, reason: 'schema' });
  assert.equal(read, false);
});

test('読み込み：スキーマに通っても中身が「なし」なら schema で止める（削除の確認を素通りさせない）', async () => {
  const none = JSON.stringify({ formatVersion: 1, app: 'kyounoitte', diagnosis: {}, levels: {}, history: [] });
  assert.deepEqual(await readImport(file(none)), { ok: false, reason: 'schema' });
});
