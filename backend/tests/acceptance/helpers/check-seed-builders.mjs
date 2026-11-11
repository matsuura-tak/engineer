// helpers/seed.mjs の seed を組み立てる関数（completedSeed、seenNextSeed、nextDoneSeed、beginnerDoneAtIntermediateSeed）の自己検査。
// 本番の課題集が 210 件（初級・中級 14、上級 7。PRD AC-4、W-6）になるまで赤の実行ではこれらの関数が動かないので、同じ構成の合成の課題集に当てて、
//   - seed が data.schema.json と data.md の 8 に通る
//   - 目標の領域の levels が目標の段階のまま（G2 tech-lead r4 と reviewer r2 の重大）
//   - data.md の 5 の選び方を当てた結果（次に出る ID）が期待の値（n=10 → backend-intermediate-011、n=29 と n=99 → backend-intermediate-014 など）
// を確かめる。使い方：cd backend/tests/acceptance && npm run check:seeds（check-seeds.mjs の後に動く）。期待と違えば終了コード 1。
// 合成の課題集の ID の付け方は W-7（<領域>-<段階>-NNN）。docs/prd/001-daily-learning/tasks.v2.json（下書き）があれば、その ID がすべて合成の ID に含まれることも見る（付け方の確かめだけ。本番の代わりにはしない）。
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { REPO_DIR } from './paths.mjs';
import { validate } from './schema.mjs';
import { semantic } from './check-seeds.mjs';
import { AREAS, LEVELS, completedSeed, seenNextSeed, nextDoneSeed, beginnerDoneAtIntermediateSeed, pickNext, tasksOf } from './seed.mjs';

const PER_LEVEL = { beginner: 14, intermediate: 14, advanced: 7 };
const FIRST = '2026-01-01';
const AREA = 'backend';

export function syntheticTasks() {
  const tasks = [];
  for (const area of AREAS) for (const level of LEVELS) for (let i = 1; i <= PER_LEVEL[level]; i++) {
    tasks.push({ id: `${area}-${level}-${String(i).padStart(3, '0')}`, area, level, mode: 'in_app' });
  }
  return { formatVersion: 1, tasks };
}

let failures = 0;
let n = 0;
function say(ok, msg) {
  n++;
  if (!ok) failures++;
  console.log(`${ok ? 'OK ' : 'NG '} ${msg}`);
}
function shape(seed, label) {
  const { ok, errors } = validate('data', seed);
  const sem = ok ? semantic(seed) : [];
  say(ok && sem.length === 0, `${label}：data.schema と data.md 8${ok ? '' : ' ' + errors}${sem.length ? ' ' + sem.join('; ') : ''}`);
}

const tasks = syntheticTasks();
say(tasks.tasks.length === 210, `合成の課題集は ${tasks.tasks.length} 件（初級・中級 14、上級 7）`);

for (const [nRows, expectedNext] of [[10, 'backend-intermediate-011'], [29, 'backend-intermediate-014'], [99, 'backend-intermediate-014']]) {
  let built;
  try {
    built = completedSeed(tasks, { n: nRows, area: AREA, level: 'intermediate', firstOpenDate: FIRST });
  } catch (e) {
    say(false, `completedSeed n=${nRows} が例外：${e.message}`);
    continue;
  }
  const { seed, nextId, nextDate } = built;
  shape(seed, `completedSeed n=${nRows}`);
  const done = seed.history.filter((r) => r.report === 'done').length;
  say(done === nRows, `completedSeed n=${nRows}：完了の行 ${done}`);
  say(seed.levels.backend === 'intermediate', `completedSeed n=${nRows}：levels.backend は ${seed.levels.backend}（目標の段階のまま）`);
  const picked = pickNext(tasks, seed);
  say(picked === expectedNext && nextId === expectedNext, `completedSeed n=${nRows}：data.md 5 で次に出る ID は ${picked}、nextId は ${nextId}（期待 ${expectedNext}）、levels=${JSON.stringify(seed.levels)}、開く日 ${nextDate}`);
  const areas = new Set(seed.history.map((r) => r.area));
  if (nRows === 99) say(areas.size >= 3, `completedSeed n=99：${areas.size} 領域にまたがる（W-7「3 領域以上」）`);
}

{
  const { seed, midUnissued } = seenNextSeed(tasks, { area: AREA, firstOpenDate: FIRST });
  shape(seed, 'seenNextSeed');
  const picked = pickNext(tasks, seed);
  const midRows = seed.history.filter((r) => r.area === AREA && r.level === 'intermediate').length;
  const midLeft = tasksOf(tasks, AREA, 'intermediate').filter((t) => !seed.history.some((r) => r.taskId === t.id)).length;
  say(picked === null && seed.levels.backend === 'beginner' && midRows === 2 && midLeft === 12 && midUnissued === 12,
    `seenNextSeed：次に出る ID は ${picked}（S7）、levels.backend=${seed.levels.backend}、中級の行 ${midRows}、中級の未出 ${midLeft}（seenNext）`);
}
{
  const { seed } = nextDoneSeed(tasks, { area: AREA, firstOpenDate: FIRST });
  shape(seed, 'nextDoneSeed');
  const picked = pickNext(tasks, seed);
  const midLeft = tasksOf(tasks, AREA, 'intermediate').filter((t) => !seed.history.some((r) => r.taskId === t.id)).length;
  say(picked === null && seed.levels.backend === 'beginner' && midLeft === 0 && seed.history.length === 28,
    `nextDoneSeed：次に出る ID は ${picked}（S7）、levels.backend=${seed.levels.backend}、中級の未出 ${midLeft}（nextDone）、行 ${seed.history.length}`);
}
{
  const { seed } = beginnerDoneAtIntermediateSeed(tasks, { area: AREA, firstOpenDate: FIRST });
  shape(seed, 'beginnerDoneAtIntermediateSeed');
  const picked = pickNext(tasks, seed);
  say(picked === 'backend-intermediate-001' && seed.history.length === 14, `beginnerDoneAtIntermediateSeed：次に出る ID は ${picked}（期待 backend-intermediate-001）、行 ${seed.history.length}`);
}

const v2 = path.join(REPO_DIR, 'docs', 'prd', '001-daily-learning', 'tasks.v2.json');
if (existsSync(v2)) {
  const ids = new Set(tasks.tasks.map((t) => t.id));
  const draft = JSON.parse(readFileSync(v2, 'utf8')).tasks;
  const outside = draft.filter((t) => !ids.has(t.id) || t.id !== `${t.area}-${t.level}-${t.id.split('-')[2]}`).map((t) => t.id);
  say(outside.length === 0, `課題集 v2 の下書き ${draft.length} 件の ID はすべて合成の ID の付け方に合う${outside.length ? '（合わない：' + outside.join(', ') + '）' : ''}`);
}

console.log(`自己検査 ${n} 件、期待と違う結果 ${failures} 件`);
process.exit(failures ? 1 : 0);
