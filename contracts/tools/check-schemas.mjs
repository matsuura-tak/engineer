// 契約の検査（ADR 0004、設計メモ 4）。node の組み込みと ajv だけを使う。
// 使い方：ajv を入れたフォルダで実行する（例：cd backend && node ../contracts/tools/check-schemas.mjs）。
// 1. contracts/schemas/*.schema.json を JSON Schema 2020-12 のメタスキーマで検査し、strict で組み立てる。
// 2. contracts/fixtures/ の見本を検査する。valid-* と seed-* は通り、invalid-* は落ちるのが正しい。
// 3. data の valid-* と seed-* は、スキーマの外の決まり（contracts/data.md の「書き手が守る決まり」）も満たす。
// 期待と違う結果が 1 件でもあれば終了コード 1。
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(join(process.cwd(), 'noop.js'));
const Ajv2020 = require('ajv/dist/2020').default;
const ajvVersion = require('ajv/package.json').version;

const contracts = dirname(dirname(fileURLToPath(import.meta.url)));
const schemaDir = join(contracts, 'schemas');
const fixtureDir = join(contracts, 'fixtures');
const ajv = new Ajv2020({ strict: true, allErrors: true });
let failures = 0;
const say = (ok, msg) => { if (!ok) failures++; console.log(`${ok ? 'OK ' : 'NG '} ${msg}`); };

console.log(`ajv ${ajvVersion}（Ajv2020、strict）`);
const validators = {};
for (const f of readdirSync(schemaDir).filter((f) => f.endsWith('.schema.json')).sort()) {
  const schema = JSON.parse(readFileSync(join(schemaDir, f), 'utf8'));
  const metaOk = ajv.validateSchema(schema);
  say(metaOk === true, `メタスキーマ ${f}${metaOk ? '' : ' ' + ajv.errorsText(ajv.errors)}`);
  try { validators[f.replace('.schema.json', '')] = ajv.compile(schema); say(true, `組み立て ${f}`); }
  catch (e) { say(false, `組み立て ${f} ${e.message}`); }
}

const kindOf = (rel) => ({ tasks: 'tasks', data: 'data', seeds: 'data', strings: 'strings' })[rel.split('/')[0]];
const walk = (d) => readdirSync(d).flatMap((n) => statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]);

function semantic(doc) {
  const errs = [];
  const h = doc.history;
  for (let i = 1; i < h.length; i++) if (h[i].date <= h[i - 1].date) errs.push(`history[${i}] の日付が前の行より新しくない`);
  for (const r of h) if (r.date < doc.firstOpenDate) errs.push(`${r.date} が firstOpenDate より前`);
  if (doc.current) {
    if (h.length && doc.current.date <= h[h.length - 1].date) errs.push('current の日付が history の最後の行より新しくない');
    if (doc.current.date < doc.firstOpenDate) errs.push('current の日付が firstOpenDate より前');
  }
  const ids = [...h.map((r) => r.taskId), ...(doc.current ? [doc.current.taskId] : [])];
  if (new Set(ids).size !== ids.length) errs.push('同じ taskId が 2 回出ている');
  if (doc.diagnosis.completedOn && !doc.levels[doc.diagnosis.area]) errs.push('診断済みなのに levels に目標の領域がない');
  return errs;
}

let n = 0;
for (const file of walk(fixtureDir).sort()) {
  const rel = relative(fixtureDir, file);
  const kind = kindOf(rel);
  const name = basename(file);
  const expectValid = name.startsWith('valid-') || name.startsWith('seed-');
  if (!kind || !(expectValid || name.startsWith('invalid-'))) { say(false, `${rel} 名前の決まり（valid- / invalid- / seed-）に合わない`); continue; }
  n++;
  let doc, parseErr = null;
  try { doc = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { parseErr = e.message; }
  if (!validators[kind]) { say(false, `${rel} スキーマ ${kind} を組み立てられなかった`); continue; }
  const valid = parseErr === null && validators[kind](doc);
  const why = parseErr ? `JSON.parse の失敗` : valid ? '' : ajv.errorsText(validators[kind].errors, { separator: ' / ' }).slice(0, 160);
  if (expectValid) {
    const extra = valid && kind === 'data' ? semantic(doc) : [];
    say(valid && extra.length === 0, `${rel} 期待：通る → ${valid ? '通った' : '落ちた ' + why}${extra.length ? ' スキーマの外の決まり：' + extra.join('、') : ''}`);
  } else {
    say(!valid, `${rel} 期待：落ちる → ${valid ? '通ってしまった' : '落ちた（' + why + '）'}`);
  }
}
console.log(`見本 ${n} 件、期待と違う結果 ${failures} 件`);
process.exit(failures ? 1 : 0);
