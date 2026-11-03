// ビルドと転送量の予算（scripts/build.mjs、scripts/check-budget.mjs。ADR 0001、contracts/test-hooks.md、contracts/budgets.md）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { build, listFiles } from '../../scripts/build.mjs';
import { measure, TOTAL_LIMIT } from '../../scripts/check-budget.mjs';
import { BACKEND_DIR } from './helpers.mjs';

const tmp = () => mkdtempSync(path.join(os.tmpdir(), 'kyounoitte-unit-'));

test('ビルドすると版が index.html と sw.js に入り、FILES が配布物と一致し、JS は 15 個以下', (t) => {
  const dir = tmp();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const out = path.join(dir, 'dist');
  const r = build({ out, version: '2026-11-03.1' });
  const html = readFileSync(path.join(out, 'index.html'), 'utf8');
  assert.match(html, /data-build-version="2026-11-03\.1"/);
  assert.doesNotMatch(html, /\{\{/);
  const sw = readFileSync(path.join(out, 'sw.js'), 'utf8');
  assert.match(sw, /'2026-11-03\.1'/);
  const files = JSON.parse(/const FILES = (\[[^\]]*\]);/.exec(sw)[1]);
  assert.deepEqual(files, listFiles(out).filter((f) => f !== 'sw.js').map((f) => `./${f}`));
  assert.deepEqual(files, r.files);
  const js = listFiles(out).filter((f) => f.endsWith('.js'));
  assert.ok(js.length <= 15, `JS ${js.length} 個`);
});

test('配布物は gzip 後の合計 150,000 バイト以下（contracts/budgets.md の 1）', (t) => {
  const dir = tmp();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const out = path.join(dir, 'dist');
  build({ out, version: '2026-11-03.1' });
  const m = measure(out);
  assert.ok(m.ok, m.problems.join(' / '));
  assert.ok(m.total <= TOTAL_LIMIT, `合計 ${m.total}`);
});

test('版の形が違うと終了コード 1 で、出力を作らない', () => {
  const dir = tmp();
  try {
    for (const v of ['2026-11-03', '2026-11-03.0', 'v1', '']) {
      const out = path.join(dir, `dist-${v || 'empty'}`);
      const r = spawnSync(process.execPath, ['scripts/build.mjs', '--out', out, '--version', v], { cwd: BACKEND_DIR, encoding: 'utf8' });
      assert.equal(r.status, 1, `--version ${v}`);
      assert.equal(listFiles(dir).some((f) => f.startsWith(`dist-${v || 'empty'}/`)), false);
    }
    const r = spawnSync(process.execPath, ['scripts/build.mjs', '--out', path.join(dir, 'x')], { cwd: BACKEND_DIR, encoding: 'utf8' });
    assert.equal(r.status, 1, '--version なし');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('スキーマに通らない課題集（--tasks）はビルドを止める', () => {
  const dir = tmp();
  try {
    const bad = path.join(dir, 'tasks.json');
    writeFileSync(bad, readFileSync(path.join(BACKEND_DIR, '..', 'contracts', 'fixtures', 'tasks', 'invalid-minutes-16.json')));
    const r = spawnSync(process.execPath, ['scripts/build.mjs', '--out', path.join(dir, 'dist'), '--version', '2026-11-03.1', '--tasks', bad], {
      cwd: BACKEND_DIR,
      encoding: 'utf8',
    });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /課題集がスキーマに通らない/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('元のフォルダや、ビルドの出力でない空でないフォルダには書かない', () => {
  assert.throws(() => build({ out: path.join(BACKEND_DIR, 'public'), version: '2026-11-03.1' }));
  assert.throws(() => build({ out: BACKEND_DIR, version: '2026-11-03.1' }));
  const dir = tmp();
  try {
    writeFileSync(path.join(dir, 'keep.txt'), 'x');
    assert.throws(() => build({ out: dir, version: '2026-11-03.1' }), /消さずに止める/);
    assert.equal(readFileSync(path.join(dir, 'keep.txt'), 'utf8'), 'x');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
