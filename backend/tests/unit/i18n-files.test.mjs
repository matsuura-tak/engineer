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

// ---- 差し込みのある 10 キー（contracts/strings.md の 3 の表、ADR 0001。G2 reviewer r1 の要修正）----
// 表の「差し込み」の名前と「入れる値」の種類を写す（文言そのものは写さず、配る ja.json と en.json の実物を使う）。
const ja = readJsonFile(path.join(BACKEND_DIR, 'public', 'i18n', 'ja.json'));
const en = readJsonFile(path.join(BACKEND_DIR, 'public', 'i18n', 'en.json'));
const firstTaskTitle = readJsonFile(path.join(BACKEND_DIR, 'public', 'data', 'tasks.json')).tasks[0].title;
const PLACEHOLDER_KEYS = (S) => ({
  'diagnosis.progress': { n: 2, total: 3 },
  'diagnosis.q2.legend': { area: S['area.database'] },
  'task.today.label': { date: '2026-11-03' },
  'task.meta': { area: S['area.backend'], level: S['level.intermediate'], minutes: 15 },
  'task.answer.limit': { max: 2000 },
  'task.done.task': { title: firstTaskTitle },
  'settings.import.confirm.summary': { count: 41, date: '2026-10-30' },
  'settings.diagnosis.current': { area: S['area.git'], level: S['level.advanced'] },
  'settings.version': { version: '2026-11-03.1' },
  'settings.stats.today': { date: '2026-11-04' },
});

test('差し込みのあるキーは ja と en のどちらも strings.md の表の 10 個だけ', () => {
  const expected = Object.keys(PLACEHOLDER_KEYS(ja)).sort();
  assert.equal(expected.length, 10);
  for (const [name, S] of [['ja', ja], ['en', en]]) {
    const withBrace = Object.keys(S)
      .filter((k) => /[{}]/.test(S[k]))
      .sort();
    assert.deepEqual(withBrace, expected, `${name}.json`);
  }
});

for (const [lang, S] of [['ja', ja], ['en', en]]) {
  test(`差し込みの 10 キーを ${lang}.json の実物で format() に通すと、差し込みが全部埋まり { と } が残らない`, () => {
    for (const [key, values] of Object.entries(PLACEHOLDER_KEYS(S))) {
      const template = S[key];
      for (const name of Object.keys(values)) {
        assert.match(template, new RegExp(`\\{${name}(\\}|, plural, )`), `${lang} ${key} に差し込み {${name}} がない`);
      }
      const out = format(template, values, lang);
      assert.doesNotMatch(out, /[{}]/, `${lang} ${key} → ${out}`);
      for (const v of Object.values(values)) assert.ok(out.includes(String(v)), `${lang} ${key} に ${v} が入っていない → ${out}`);
    }
  });
}

test('en の plural（task.meta の minutes、settings.import.confirm.summary の count）は 1 と 2 以上で形が変わり、どちらも埋まる', () => {
  const one = format(en['task.meta'], { area: 'A', level: 'L', minutes: 1 }, 'en');
  const other = format(en['task.meta'], { area: 'A', level: 'L', minutes: 15 }, 'en');
  const oneCount = format(en['settings.import.confirm.summary'], { count: 1, date: '2026-10-30' }, 'en');
  const otherCount = format(en['settings.import.confirm.summary'], { count: 41, date: '2026-10-30' }, 'en');
  for (const s of [one, other, oneCount, otherCount]) assert.doesNotMatch(s, /[{}#]/, s);
  assert.notEqual(one.replace('1', 'N'), other.replace('15', 'N'), 'minutes の one と other が同じ文');
  assert.notEqual(oneCount.replace('1', 'N'), otherCount.replace('41', 'N'), 'count の one と other が同じ文');
});
