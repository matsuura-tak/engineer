// 手で写した保存データの検査（public/js/validate.js）が、contracts/fixtures/ のすべての見本で ajv と同じ合否になる（contracts/data.md の 6、ADR 0004）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { readDocument, validateData, CURRENT_VERSION, ANSWER_MAX } from '../../public/js/validate.js';
import { ymdShift } from '../../public/js/dates.js';
import { save, KEY } from '../../public/js/store.js';
import { ajvValidator, walk, FIXTURES_DIR, readJsonFile, fakeStorage } from './helpers.mjs';

const ajv = ajvValidator('data');
const files = [...walk(path.join(FIXTURES_DIR, 'data')), ...walk(path.join(FIXTURES_DIR, 'seeds'))];

test('見本の数が 0 でない（data と seeds）', () => {
  assert.ok(files.length >= 20, `見本 ${files.length} 件`);
});

for (const file of files) {
  const rel = path.relative(FIXTURES_DIR, file);
  const name = path.basename(file);
  const expectValid = name.startsWith('valid-') || name.startsWith('seed-');
  test(`見本 ${rel}：手書きの検査と ajv が同じ合否で、期待（${expectValid ? '通る' : '落ちる'}）どおり`, () => {
    const text = readFileSync(file, 'utf8');
    let doc;
    let parsed = true;
    try {
      doc = JSON.parse(text);
    } catch {
      parsed = false;
    }
    const ajvOk = parsed && ajv(doc) === true;
    const mine = readDocument(text);
    assert.equal(mine.ok, ajvOk, `手書き=${mine.ok}（${(mine.errors ?? []).join(' / ')}）、ajv=${ajvOk}`);
    assert.equal(mine.ok, expectValid);
  });
}

test('版が新しいファイルは reason=version、それ以外の失敗は reason=schema（AC-25、data.md の 7）', () => {
  const newer = readFileSync(path.join(FIXTURES_DIR, 'data', 'invalid-newer-version.json'), 'utf8');
  assert.equal(readDocument(newer).reason, 'version');
  assert.equal(readDocument('{not json').reason, 'schema');
  assert.equal(readDocument('[]').reason, 'schema');
  assert.equal(readDocument('null').reason, 'schema');
  assert.equal(readDocument('"x"').reason, 'schema');
  const other = readFileSync(path.join(FIXTURES_DIR, 'data', 'invalid-other-app.json'), 'utf8');
  assert.equal(readDocument(other).reason, 'schema');
});

test('formatVersion が小数や文字列なら版でなく形の誤り', () => {
  const base = readJsonFile(path.join(FIXTURES_DIR, 'data', 'v1', 'valid-all-fields.json'));
  for (const v of [1.5, '2', 0, -1]) {
    const r = readDocument(JSON.stringify({ ...base, formatVersion: v }));
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'schema', `formatVersion=${JSON.stringify(v)}`);
  }
  assert.equal(CURRENT_VERSION, 1);
});

test('answer は 2000 コードポイントまで（絵文字は 1 字と数える）', () => {
  const base = readJsonFile(path.join(FIXTURES_DIR, 'data', 'v1', 'valid-all-fields.json'));
  assert.ok(base.history.length > 0);
  const withAnswer = (a) => {
    const d = structuredClone(base);
    d.history[0].answer = a;
    return d;
  };
  assert.deepEqual(validateData(withAnswer('😀'.repeat(ANSWER_MAX))), []);
  assert.notDeepEqual(validateData(withAnswer('😀'.repeat(ANSWER_MAX + 1))), []);
  assert.notDeepEqual(validateData(withAnswer(5)), []);
});

test('知らない項目（割り当てすぎ）を足すと、どの階層でも落ちる', () => {
  const base = readJsonFile(path.join(FIXTURES_DIR, 'data', 'v1', 'valid-all-fields.json'));
  const cases = [
    (d) => (d.isAdmin = true),
    (d) => (d.diagnosis.role = 'admin'),
    (d) => (d.history[0].userId = 'x'),
    (d) => (d.device.other = true),
    (d) => (d.levels.cooking = 'beginner'),
  ];
  for (const mutate of cases) {
    const d = structuredClone(base);
    if (!d.device) d.device = {};
    mutate(d);
    assert.equal(ajv(d), false);
    assert.notDeepEqual(validateData(d), [], mutate.toString());
  }
});

test('__proto__ を含むファイルでも Object.prototype を汚さない', () => {
  const r = readDocument('{"__proto__":{"polluted":true},"formatVersion":1,"app":"kyounoitte","diagnosis":{},"levels":{},"history":[]}');
  assert.equal({}.polluted, undefined);
  assert.equal(r.ok, false, '__proto__ は知らない項目として落ちる');
});

// contracts/data.md の 10「大きさ」：365 行すべてに 2,000 字の答えがあっても 1,000,000 字以下（ADR 0001。G2 reviewer r1 の要修正）。
test('365 行 × 答え 2,000 字の保存データは JSON の長さが 1,000,000 字以下で、検査（手書きと ajv）を通り、1 回の setItem で入る', () => {
  const start = new Date(2025, 10, 4);
  const answer = 'あ'.repeat(ANSWER_MAX); // UTF-16 で 2,000 単位、コードポイントでも 2,000（data.md の 10、textarea の maxlength）
  assert.equal(answer.length, 2000);
  const levels = ['beginner', 'intermediate', 'advanced'];
  const history = Array.from({ length: 365 }, (_, i) => {
    const level = levels[i % 3];
    return {
      date: ymdShift(start, i),
      taskId: `backend-${level}-${String((i % 7) + 1).padStart(3, '0')}`,
      area: 'backend',
      level,
      mode: 'in_app',
      report: 'done',
      answer,
      helpful: 'not_helpful',
    };
  });
  const data = {
    formatVersion: CURRENT_VERSION,
    app: 'kyounoitte',
    firstOpenDate: history[0].date,
    diagnosis: { area: 'backend', level: 'intermediate', years: '1to3', completedOn: history[0].date },
    levels: { backend: 'intermediate', frontend: 'beginner', database: 'advanced', infra: 'beginner', testing: 'intermediate', git: 'advanced' },
    current: { date: ymdShift(start, 365), taskId: 'backend-intermediate-008', area: 'backend', level: 'intermediate', mode: 'in_app', answer },
    history,
    device: { homeGuideClosed: true, persistRequested: true, persistGranted: false },
  };
  assert.equal(new Set(history.map((r) => r.date)).size, 365, '日付は 365 通り');
  assert.equal(history.at(-1).date, '2026-11-03');
  const text = JSON.stringify(data);
  assert.ok(text.length <= 1_000_000, `JSON の長さ ${text.length} 字`);
  assert.deepEqual(validateData(data), []);
  assert.equal(ajv(data), true, JSON.stringify(ajv.errors?.slice(0, 3)));
  const r = readDocument(text);
  assert.equal(r.ok, true, (r.errors ?? []).join(' / '));
  const storage = fakeStorage();
  assert.equal(save(storage, r.data), true);
  assert.deepEqual(storage.calls, ['setItem']);
  assert.equal(storage.map.get(KEY).length, text.length);
});
