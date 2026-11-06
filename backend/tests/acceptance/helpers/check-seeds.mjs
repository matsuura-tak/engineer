// seeds/ と contracts/fixtures/seeds/ の JSON がすべて contracts/schemas/data.schema.json と、contracts/data.md の 8（書き手が守る決まり）と、
// test-hooks.md W-7 の ID の決まり（各 taskId が配布物の課題集にあり、行の area / level が ID の <領域>-<段階> と同じ）に合うかを確かめる。
// 使い方：cd backend/tests/acceptance && npm run check:seeds　（期待と違えば終了コード 1。続けて helpers/check-seed-builders.mjs も動く）
// 課題集は KYOUNOITTE_DIST の data/tasks.json。なければ backend/scripts/build.mjs で一時フォルダにビルドして読む（実装のモジュールは読まない）。
// スキーマの外の決まり（semantic）は contracts/tools/check-schemas.mjs の semantic と同じ（同じ日付の行、最後の行と同じ日の current は data.md 8 のとおり認める）。
import { readdirSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { SEEDS_DIR, CONTRACT_FIXTURES_DIR, DIST_VERSION } from './paths.mjs';
import { validate } from './schema.mjs';
import { buildDist } from './build.mjs';
import { distTasks, assertSeedTaskIds } from './seed.mjs';

export function semantic(doc) {
  const errs = [];
  const h = doc.history;
  const nashi = !doc.diagnosis.completedOn && h.length === 0 && !doc.diagnosis.area; // data.md の 3 の「なし」
  if (nashi && 'firstOpenDate' in doc) errs.push('「なし」なのに firstOpenDate がある（1 問目の確定の前には書かない）');
  // 日付の古い順。同じ日付の行は出した順に何行でも並ぶ（data.md の 8。AC-33 の同じ日の「次の一手に進む」）
  for (let i = 1; i < h.length; i++) if (h[i].date < h[i - 1].date) errs.push(`history[${i}] の日付が前の行より古い`);
  for (const r of h) if (r.date < doc.firstOpenDate) errs.push(`${r.date} が firstOpenDate より前`);
  if (doc.current) {
    if (h.length && doc.current.date < h[h.length - 1].date) errs.push('current の日付が history の最後の行より古い');
    if (doc.current.date < doc.firstOpenDate) errs.push('current の日付が firstOpenDate より前');
  }
  const ids = [...h.map((r) => r.taskId), ...(doc.current ? [doc.current.taskId] : [])];
  if (new Set(ids).size !== ids.length) errs.push('同じ taskId が 2 回出ている');
  if (doc.diagnosis.completedOn && !doc.levels[doc.diagnosis.area]) errs.push('診断済みなのに levels に目標の領域がない');
  return errs;
}

/** seed の ID の決まり（W-7）の結果を文字列の配列で返す（例外にせず数える）。 */
export function idErrors(doc, tasks) {
  try {
    assertSeedTaskIds(doc, tasks, 'seed');
    return [];
  } catch (e) {
    return [String(e.message).split('\n').slice(1).join('; ')];
  }
}

// main の判定は pathToFileURL で比べる（フォルダのパスに空白や非 ASCII があると `file://${argv[1]}` の素の文字列は percent-encoding された import.meta.url と一致せず、何も検査せずに終了コード 0 で終わる。reviewer G2 r3 の提案。r10）
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  let tmp = null;
  if (!process.env.KYOUNOITTE_DIST) {
    tmp = mkdtempSync(path.join(os.tmpdir(), 'kyounoitte-check-seeds-'));
    process.env.KYOUNOITTE_DIST = buildDist({ out: path.join(tmp, 'dist'), version: DIST_VERSION });
  }
  const tasks = distTasks();
  console.log(`課題集：${process.env.KYOUNOITTE_DIST}/data/tasks.json（${tasks.tasks.length} 件）`);
  let failures = 0;
  const targets = [
    { dir: SEEDS_DIR, label: 'seeds' },
    { dir: path.join(CONTRACT_FIXTURES_DIR, 'seeds'), label: 'contracts/fixtures/seeds' },
  ];
  let n = 0;
  for (const { dir, label } of targets) {
    const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
    for (const f of files) {
      n++;
      const doc = JSON.parse(readFileSync(path.join(dir, f), 'utf8'));
      const { ok, errors } = validate('data', doc);
      const sem = ok ? [...semantic(doc), ...idErrors(doc, tasks)] : [];
      const good = ok && sem.length === 0;
      if (!good) failures++;
      console.log(`${good ? 'OK ' : 'NG '} ${label}/${f}${ok ? '' : ' ' + errors}${sem.length ? ' ' + sem.join('; ') : ''}`);
    }
  }
  console.log(`seed ${n} 件、期待と違う結果 ${failures} 件`);
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  process.exit(failures ? 1 : 0);
}
