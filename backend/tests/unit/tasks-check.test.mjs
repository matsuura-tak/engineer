// 課題集の手書きの検査（scripts/lib/tasks-check.mjs）が ajv と同じ合否になり、配る課題集が PRD の下書き（tasks.v1.json）と同じで、スキーマに通る。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { validateTasks } from '../../scripts/lib/tasks-check.mjs';
import { ajvValidator, walk, FIXTURES_DIR, BACKEND_DIR, REPO_DIR, readJsonFile } from './helpers.mjs';

const ajv = ajvValidator('tasks');

for (const file of walk(path.join(FIXTURES_DIR, 'tasks'))) {
  const name = path.basename(file);
  const expectValid = name.startsWith('valid-');
  test(`課題集の見本 ${name}：手書きの検査と ajv が同じ合否`, () => {
    const doc = readJsonFile(file);
    const ajvOk = ajv(doc) === true;
    const errs = validateTasks(doc);
    assert.equal(errs.length === 0, ajvOk, `手書き：${errs.join(' / ')}`);
    assert.equal(ajvOk, expectValid);
  });
}

test('public/data/tasks.json は docs/prd/001-daily-learning/tasks.v1.json と同じバイト列', () => {
  const a = readFileSync(path.join(BACKEND_DIR, 'public', 'data', 'tasks.json'));
  const b = readFileSync(path.join(REPO_DIR, 'docs', 'prd', '001-daily-learning', 'tasks.v1.json'));
  assert.ok(a.equals(b));
});

test('配る課題集が ajv と手書きの両方に通り、ID が重複しない', () => {
  const doc = readJsonFile(path.join(BACKEND_DIR, 'public', 'data', 'tasks.json'));
  assert.equal(ajv(doc), true, JSON.stringify(ajv.errors?.slice(0, 3)));
  assert.deepEqual(validateTasks(doc), []);
  const ids = doc.tasks.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 126);
});
