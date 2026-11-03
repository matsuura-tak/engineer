// 保存先（public/js/store.js。contracts/data.md の 1、2、7）。キーは kyounoitte:data だけ、1 回の保存は 1 回の setItem。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { openStore, save, removeAll, KEY } from '../../public/js/store.js';
import { fakeStorage, FIXTURES_DIR, readJsonFile } from './helpers.mjs';

const valid = readJsonFile(path.join(FIXTURES_DIR, 'data', 'v1', 'valid-all-fields.json'));

test('キーは kyounoitte:data', () => {
  assert.equal(KEY, 'kyounoitte:data');
});

test('何もなければ data=null（「なし」）', () => {
  const r = openStore(() => fakeStorage());
  assert.equal(r.kind, 'ok');
  assert.equal(r.data, null);
});

test('正しいデータは読める', () => {
  const r = openStore(() => fakeStorage({ [KEY]: JSON.stringify(valid) }));
  assert.equal(r.kind, 'ok');
  assert.deepEqual(r.data, valid);
});

test('壊れたデータは unreadable で、元の文字列をそのまま持つ（書き換えない）', () => {
  for (const name of ['invalid-not-json.json', 'invalid-extra-field.json', 'invalid-newer-version.json', 'invalid-answer-too-long.json']) {
    const raw = readFileSync(path.join(FIXTURES_DIR, 'data', name), 'utf8');
    const st = fakeStorage({ [KEY]: raw });
    const r = openStore(() => st);
    assert.equal(r.kind, 'unreadable', name);
    assert.equal(r.raw, raw);
    assert.equal(st.map.get(KEY), raw, '読むだけで消さない');
    assert.deepEqual(st.calls, ['getItem']);
  }
});

test('localStorage を開けない、読めないときは unavailable（例外を外に出さない）', () => {
  assert.equal(openStore(() => { throw new Error('SecurityError'); }).kind, 'unavailable');
  assert.equal(openStore(() => fakeStorage({}, { throwOn: ['getItem'] })).kind, 'unavailable');
});

test('save は 1 回の setItem で JSON を書き、容量切れなら false', () => {
  const st = fakeStorage();
  assert.equal(save(st, valid), true);
  assert.deepEqual(st.calls, ['setItem']);
  assert.deepEqual(JSON.parse(st.map.get(KEY)), valid);
  assert.deepEqual([...st.map.keys()], [KEY]);
  const full = fakeStorage({ [KEY]: 'old' }, { throwOn: ['setItem'] });
  assert.equal(save(full, valid), false);
  assert.equal(full.map.get(KEY), 'old', '失敗したら前のデータのまま');
});

test('removeAll は kyounoitte:data だけを消し、他のキーは残す（AC-16）', () => {
  const st = fakeStorage({ [KEY]: JSON.stringify(valid), other: 'keep' });
  assert.equal(removeAll(st), true);
  assert.equal(st.map.has(KEY), false);
  assert.equal(st.map.get('other'), 'keep');
  assert.equal(removeAll(fakeStorage({}, { throwOn: ['removeItem'] })), false);
});
