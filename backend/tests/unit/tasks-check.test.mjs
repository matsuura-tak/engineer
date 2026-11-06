// 課題集の手書きの検査（scripts/lib/tasks-check.mjs）が ajv と同じ合否になり、配る課題集が PRD の下書き（tasks.v2.json。docs/approvals/delegation.md で採用）と同じで、スキーマに通る。
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

test('public/data/tasks.json は docs/prd/001-daily-learning/tasks.v2.json と同じバイト列', () => {
  const a = readFileSync(path.join(BACKEND_DIR, 'public', 'data', 'tasks.json'));
  const b = readFileSync(path.join(REPO_DIR, 'docs', 'prd', '001-daily-learning', 'tasks.v2.json'));
  assert.ok(a.equals(b));
});

test('配る課題集が ajv と手書きの両方に通り、ID が重複しない', () => {
  const doc = readJsonFile(path.join(BACKEND_DIR, 'public', 'data', 'tasks.json'));
  assert.equal(ajv(doc), true, JSON.stringify(ajv.errors?.slice(0, 3)));
  assert.deepEqual(validateTasks(doc), []);
  const ids = doc.tasks.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 210);
});

test('配る課題集の組：初級と中級の 12 組は 14 件、上級の 6 組は 7 件、組ごとの external は 20% 以下（AC-4、AC-29）', () => {
  const doc = readJsonFile(path.join(BACKEND_DIR, 'public', 'data', 'tasks.json'));
  const groups = new Map();
  for (const t of doc.tasks) {
    const k = `${t.area}/${t.level}`;
    const g = groups.get(k) ?? { n: 0, ext: 0 };
    g.n += 1;
    if (t.mode === 'external') g.ext += 1;
    groups.set(k, g);
  }
  assert.equal(groups.size, 18);
  for (const [k, g] of groups) {
    assert.ok(g.n >= (k.endsWith('/advanced') ? 7 : 14), `${k} は ${g.n} 件`);
    assert.ok(g.ext / g.n <= 0.2, `${k} の external は ${g.ext}/${g.n}`);
  }
});

test('配る課題集の本文と解説の平均は 480 字以下、初級は 10 分以下（budgets.md の 2、AC-34）', () => {
  const doc = readJsonFile(path.join(BACKEND_DIR, 'public', 'data', 'tasks.json'));
  const cp = (s) => [...s].length;
  const sum = doc.tasks.reduce((n, t) => n + cp(t.title) + cp(t.why) + cp(t.how) + cp(t.goal) + cp(t.insight), 0);
  assert.ok(sum / doc.tasks.length <= 480, `平均 ${sum / doc.tasks.length}`);
  for (const t of doc.tasks.filter((x) => x.level === 'beginner')) assert.ok(t.minutes <= 10, t.id);
});
