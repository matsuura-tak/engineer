// seeds/ の JSON がすべて contracts/schemas/data.schema.json と、contracts/data.md の 8（書き手が守る決まり）に合うかを確かめる。
// 使い方：cd backend/tests/acceptance && npm run check:seeds　（期待と違えば終了コード 1）
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { SEEDS_DIR } from './paths.mjs';
import { validate } from './schema.mjs';

function semantic(doc) {
  const errs = [];
  const h = doc.history;
  for (let i = 1; i < h.length; i++) if (h[i].date <= h[i - 1].date) errs.push(`history[${i}] の日付が前の行より新しくない`);
  for (const r of h) if (r.date < doc.firstOpenDate) errs.push(`${r.date} が firstOpenDate より前`);
  if (doc.current && h.length && doc.current.date <= h[h.length - 1].date) errs.push('current の日付が history の最後の行より新しくない');
  const ids = [...h.map((r) => r.taskId), ...(doc.current ? [doc.current.taskId] : [])];
  if (new Set(ids).size !== ids.length) errs.push('同じ taskId が 2 回出ている');
  if (doc.diagnosis.completedOn && !doc.levels[doc.diagnosis.area]) errs.push('診断済みなのに levels に目標の領域がない');
  return errs;
}

let failures = 0;
const files = readdirSync(SEEDS_DIR).filter((f) => f.endsWith('.json')).sort();
for (const f of files) {
  const doc = JSON.parse(readFileSync(path.join(SEEDS_DIR, f), 'utf8'));
  const { ok, errors } = validate('data', doc);
  const sem = ok ? semantic(doc) : [];
  const good = ok && sem.length === 0;
  if (!good) failures++;
  console.log(`${good ? 'OK ' : 'NG '} seeds/${f}${ok ? '' : ' ' + errors}${sem.length ? ' ' + sem.join('; ') : ''}`);
}
console.log(`seed ${files.length} 件、期待と違う結果 ${failures} 件`);
process.exit(failures ? 1 : 0);
