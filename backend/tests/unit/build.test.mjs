// ビルドと転送量の予算（scripts/build.mjs、scripts/check-budget.mjs。ADR 0001、contracts/test-hooks.md、contracts/budgets.md）。
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { build, listFiles } from '../../scripts/build.mjs';
import { measure, TOTAL_LIMIT } from '../../scripts/check-budget.mjs';
import { BACKEND_DIR, contractCodeBlocks } from './helpers.mjs';

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

// ---- 配布物が契約と同じ（contracts/budgets.md の 3 と 6。G2 reviewer r1 の要修正）----
// 契約の文字列はテストに写さず、budgets.md の該当の節のコードブロックをそのつど読んで比べる。

/** HTML の属性値を、ブラウザが読むのと同じ文字に戻す（このファイルで使う 5 つの参照だけ）。 */
const decodeAttr = (v) => v.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** <head> の中身と、CSP の meta の content を取り出す。 */
function readHead(html) {
  const m = /<head>([\s\S]*?)<\/head>/i.exec(html);
  assert.ok(m, '<head>…</head> がない');
  return m[1];
}
function cspContents(html) {
  return [...html.matchAll(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"\s*>/gi)].map((x) => decodeAttr(x[1]));
}

/** PNG の署名と IHDR の幅と高さ（16〜23 バイト目）。 */
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
function pngInfo(buf) {
  return {
    signature: buf.subarray(0, 8).equals(PNG_SIGNATURE),
    ihdr: buf.subarray(12, 16).toString('latin1'),
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bytes: buf.length,
  };
}

describe('配布物が契約の文字列と同じ（contracts/budgets.md の 3、6）', () => {
  let dir;
  let out;
  before(() => {
    dir = tmp();
    out = path.join(dir, 'dist');
    build({ out, version: '2026-11-03.1' });
  });
  after(() => rmSync(dir, { recursive: true, force: true }));

  test('CSP：index.html の meta は 1 つだけで、content が budgets.md の 3 の文字列と 1 文字も違わない', () => {
    const blocks = contractCodeBlocks('budgets.md', 3);
    assert.equal(blocks.length, 1, 'budgets.md の 3 のコードブロックは CSP の 1 つだけのはず');
    const expected = blocks[0].text;
    assert.match(expected, /^default-src /, '契約から CSP の文字列を読めていない');
    const html = readFileSync(path.join(out, 'index.html'), 'utf8');
    assert.equal((html.match(/http-equiv="Content-Security-Policy"/g) ?? []).length, 1, 'grep -c で 1（PRD 12）');
    const found = cspContents(readHead(html));
    assert.equal(found.length, 1, 'CSP の meta が <head> の中に 1 つ');
    assert.equal(found[0], expected);
  });

  test('manifest：manifest.webmanifest を JSON.parse した値が budgets.md の 6 の JSON と深く等しい', () => {
    const block = contractCodeBlocks('budgets.md', 6).find((b) => b.lang === 'json');
    assert.ok(block, 'budgets.md の 6 に json のコードブロックがない');
    const expected = JSON.parse(block.text);
    assert.equal(Object.keys(expected).length, 7, '契約の manifest は 7 項目');
    const actual = JSON.parse(readFileSync(path.join(out, 'manifest.webmanifest'), 'utf8'));
    assert.deepStrictEqual(actual, expected);
  });

  test('アイコン：icon-180.png の先頭 8 バイトが PNG の署名、IHDR が 180×180、10,000 バイト以下', () => {
    const info = pngInfo(readFileSync(path.join(out, 'icon-180.png')));
    assert.equal(info.signature, true, '先頭 8 バイトが 89 50 4E 47 0D 0A 1A 0A でない');
    assert.equal(info.ihdr, 'IHDR', '最初のチャンクが IHDR でない');
    assert.equal(info.width, 180);
    assert.equal(info.height, 180);
    assert.ok(info.bytes <= 10000, `${info.bytes} バイト`);
  });

  test('<head>：index.html の <head> に budgets.md の 6 の 5 行が 1 行ずつそのままある', () => {
    const block = contractCodeBlocks('budgets.md', 6).find((b) => b.lang === 'html');
    assert.ok(block, 'budgets.md の 6 に html のコードブロックがない');
    const expected = block.text.split('\n').map((l) => l.trim()).filter(Boolean);
    assert.equal(expected.length, 5, '契約の <head> は 5 行');
    const headLines = readHead(readFileSync(path.join(out, 'index.html'), 'utf8'))
      .split('\n')
      .map((l) => l.trim());
    for (const line of expected) {
      assert.equal(headLines.filter((l) => l === line).length, 1, `<head> にない（か 2 つある）：${line}`);
    }
  });
});
