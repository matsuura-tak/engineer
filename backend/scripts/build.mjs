// ビルド＝写して刻印するだけ（ADR 0001、contracts/test-hooks.md「ビルドの手順の約束」）。node の組み込みだけで動く。
//   node scripts/build.mjs --out <フォルダ> --version <YYYY-MM-DD.N> [--tasks <tasks.json のパス>]
// 1. backend/public/ を出力のフォルダに写す（隠しファイルは写さない）。
// 2. index.html に版（data-build-version）、<title>、apple-mobile-web-app-title、ヘッダーのアプリ名、app.loading と app.noscript の日英を書き込む。
// 3. sw.js に VERSION と FILES（配布物の全ファイル。sw.js 自身を除く）を書き込む。
// 4. --tasks があれば課題集をそのファイルに差し替える。課題集は必ずスキーマ（手書きの検査）に通す。
// 5. 出力のフォルダのファイルと FILES、modulepreload と js/ のファイルが一致することを確かめる。違えば失敗。
// 版が形に合わない、検査に落ちた、などの失敗は終了コード 1。
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateTasks } from './lib/tasks-check.mjs';

const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(BACKEND_DIR, 'public');
export const VERSION_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}\.[1-9][0-9]*$/;
const MAX_JS_FILES = 15;

class BuildError extends Error {}

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** フォルダの中のファイル（相対パス、/ 区切り、並べた順）。隠しファイルは数えない。 */
export function listFiles(dir, base = dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith('.')) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full, base));
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out.sort();
}

function readJson(file, label) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    throw new BuildError(`${label} を JSON として読めない：${e.message}`);
  }
}

function checkStrings(ja, en) {
  for (const [name, doc] of [['ja', ja], ['en', en]]) {
    if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) throw new BuildError(`i18n/${name}.json がオブジェクトでない`);
    for (const [k, v] of Object.entries(doc)) if (typeof v !== 'string' || !/\S/.test(v)) throw new BuildError(`i18n/${name}.json の ${k} が空`);
  }
  const a = Object.keys(ja).sort().join('\n');
  const b = Object.keys(en).sort().join('\n');
  if (a !== b) throw new BuildError('i18n/ja.json と en.json のキーの集合が違う');
  for (const k of ['app.name', 'app.loading', 'app.noscript']) if (!(k in ja)) throw new BuildError(`i18n/ja.json に ${k} がない`);
}

/** 出力のフォルダを空にしてよいかを確かめる（ビルドの出力だけを消す）。 */
function prepareOut(out) {
  const resolved = path.resolve(out);
  const forbidden = [PUBLIC_DIR, BACKEND_DIR, path.dirname(BACKEND_DIR), path.parse(resolved).root];
  if (forbidden.includes(resolved) || PUBLIC_DIR.startsWith(resolved + path.sep)) throw new BuildError(`--out ${out} には書けない（元のフォルダかその親）`);
  if (resolved.startsWith(PUBLIC_DIR + path.sep)) throw new BuildError(`--out ${out} は public/ の中には置けない`);
  if (existsSync(resolved)) {
    if (!statSync(resolved).isDirectory()) throw new BuildError(`--out ${out} はフォルダでない`);
    const entries = readdirSync(resolved);
    const isOldBuild = entries.includes('index.html') && entries.includes('sw.js');
    if (entries.length > 0 && !isOldBuild) throw new BuildError(`--out ${out} は空でなく、前のビルドの出力にも見えない（消さずに止める）`);
    rmSync(resolved, { recursive: true, force: true });
  }
  mkdirSync(resolved, { recursive: true });
  return resolved;
}

/**
 * @param {{ out: string, version: string, tasks?: string }} o
 * @returns {{ out: string, files: string[] }}
 */
export function build({ out, version, tasks } = {}) {
  if (typeof version !== 'string' || !VERSION_RE.test(version)) {
    throw new BuildError(`--version は YYYY-MM-DD.N の形（例 2026-11-30.1）にする：${version ?? '（なし）'}`);
  }
  if (!out) throw new BuildError('--out がない');

  // 入力を先に全部検査してから書く（途中で落ちても出力を半端に残さない）
  const taskSource = tasks ? path.resolve(tasks) : path.join(PUBLIC_DIR, 'data', 'tasks.json');
  if (!existsSync(taskSource)) throw new BuildError(`課題集 ${taskSource} がない`);
  const taskBytes = readFileSync(taskSource);
  const taskErrors = validateTasks(readJson(taskSource, '課題集'));
  if (taskErrors.length) throw new BuildError(`課題集がスキーマに通らない：${taskErrors.slice(0, 5).join(' / ')}`);
  const ja = readJson(path.join(PUBLIC_DIR, 'i18n', 'ja.json'), 'i18n/ja.json');
  const en = readJson(path.join(PUBLIC_DIR, 'i18n', 'en.json'), 'i18n/en.json');
  checkStrings(ja, en);

  const dist = prepareOut(out);
  cpSync(PUBLIC_DIR, dist, { recursive: true, filter: (src) => !path.basename(src).startsWith('.') });
  writeFileSync(path.join(dist, 'data', 'tasks.json'), taskBytes);

  // index.html
  const indexFile = path.join(dist, 'index.html');
  const html = readFileSync(indexFile, 'utf8')
    .replaceAll('{{BUILD_VERSION}}', version)
    .replaceAll('{{APP_NAME}}', escapeHtml(ja['app.name']))
    .replaceAll('{{APP_LOADING}}', escapeHtml(`${ja['app.loading']} / ${en['app.loading']}`))
    .replaceAll('{{APP_NOSCRIPT}}', escapeHtml(`${ja['app.noscript']} / ${en['app.noscript']}`));
  if (html.includes('{{')) throw new BuildError('index.html に書き込めなかった印 {{…}} が残っている');
  writeFileSync(indexFile, html);

  // FILES：配布物のすべてのファイル（sw.js 自身を除く。service-worker.md の 3）
  const files = listFiles(dist).filter((f) => f !== 'sw.js');
  const fileUrls = files.map((f) => `./${f}`);
  const swFile = path.join(dist, 'sw.js');
  const sw = readFileSync(swFile, 'utf8');
  if (!sw.includes("'{{BUILD_VERSION}}'") || !sw.includes('[/* {{FILES}} */]')) throw new BuildError('sw.js に VERSION と FILES の印がない');
  writeFileSync(swFile, sw.replace("'{{BUILD_VERSION}}'", JSON.stringify(version).replace(/"/g, "'")).replace('[/* {{FILES}} */]', JSON.stringify(fileUrls)));

  // 確かめる：FILES と出力のフォルダ、modulepreload と js/、JS の数
  const written = readFileSync(swFile, 'utf8');
  const m = /const FILES = (\[[^\]]*\]);/.exec(written);
  const listed = m ? JSON.parse(m[1]) : [];
  const actual = listFiles(dist)
    .filter((f) => f !== 'sw.js')
    .map((f) => `./${f}`);
  if (JSON.stringify(listed) !== JSON.stringify(actual)) throw new BuildError('sw.js の FILES と配布物のファイルが一致しない');
  const jsFiles = actual.filter((f) => f.startsWith('./js/'));
  const preloads = [...html.matchAll(/<link rel="modulepreload" href="([^"]+)">/g)].map((x) => x[1]).sort();
  if (JSON.stringify(preloads) !== JSON.stringify([...jsFiles].sort())) throw new BuildError('index.html の modulepreload と js/ のファイルが一致しない');
  const allJs = [...actual.filter((f) => f.endsWith('.js')), './sw.js'];
  if (allJs.length > MAX_JS_FILES) throw new BuildError(`JS のファイルが ${allJs.length} 個（${MAX_JS_FILES} 個まで：ADR 0001）`);
  for (const f of ['./data/tasks.json', './i18n/ja.json', './i18n/en.json']) {
    if (!html.includes(`<link rel="preload" as="fetch" crossorigin href="${f}">`)) throw new BuildError(`index.html に ${f} の preload がない`);
  }
  return { out: dist, files: actual };
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out' || a === '--version' || a === '--tasks') {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) throw new BuildError(`${a} に値がない`);
      o[a.slice(2)] = v;
      i++;
    } else {
      throw new BuildError(`知らない引数 ${a}（使い方：--out <フォルダ> --version <YYYY-MM-DD.N> [--tasks <tasks.json>]）`);
    }
  }
  return o;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const r = build(parseArgs(process.argv.slice(2)));
    console.log(`ビルドした：${r.out}（${r.files.length + 1} ファイル）`);
  } catch (e) {
    console.error(`ビルドの失敗：${e instanceof BuildError ? e.message : e.stack}`);
    process.exit(1);
  }
}
