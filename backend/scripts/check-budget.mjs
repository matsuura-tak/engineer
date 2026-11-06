// 転送量の予算（contracts/budgets.md の 1 と 6）。node の組み込みだけで動く。
//   node scripts/check-budget.mjs <配布物のフォルダ>
// 各ファイルを zlib.gzipSync(buf, { level: 9 }) にした大きさの合計が 150,000 バイト以下なら終了コード 0、超えたら 1。
// 内訳の枠（殻 32,000、文言 9,000、アイコンと manifest 4,000、課題集 105,000。2026-11-05 の枠の見直し）は表に出す。budgets.md の 1 のとおり、
// 枠を超えても合計を守れば通す（どれかを超えるときは他を減らして合計を守る）。icon-180.png は生の大きさも 4,000 バイト以下（6）。
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { listFiles } from './build.mjs';

export const TOTAL_LIMIT = 150_000;
export const ICON_RAW_LIMIT = 4_000;
export const GROUPS = [
  { name: '殻（HTML、CSS、JS、sw.js）', limit: 32_000, match: (f) => /\.(html|css|js)$/.test(f) },
  { name: '文言（ja.json、en.json）', limit: 9_000, match: (f) => f.startsWith('i18n/') },
  { name: 'アイコンと manifest', limit: 4_000, match: (f) => f === 'icon-180.png' || f === 'manifest.webmanifest' },
  { name: '課題集 tasks.json', limit: 105_000, match: (f) => f === 'data/tasks.json' },
];

/** @returns {{ files: Array<{ file: string, raw: number, gzip: number }>, total: number, groups: Array<{ name: string, limit: number, gzip: number }>, ok: boolean, problems: string[] }} */
export function measure(dir) {
  const files = listFiles(dir).map((file) => {
    const buf = readFileSync(path.join(dir, file));
    return { file, raw: buf.length, gzip: gzipSync(buf, { level: 9 }).length };
  });
  const total = files.reduce((s, f) => s + f.gzip, 0);
  const groups = GROUPS.map((g) => ({ name: g.name, limit: g.limit, gzip: files.filter((f) => g.match(f.file)).reduce((s, f) => s + f.gzip, 0) }));
  const other = files.filter((f) => !GROUPS.some((g) => g.match(f.file)));
  const problems = [];
  if (total > TOTAL_LIMIT) problems.push(`合計 ${total} バイトが上限 ${TOTAL_LIMIT} を超えた`);
  const icon = files.find((f) => f.file === 'icon-180.png');
  if (icon && icon.raw > ICON_RAW_LIMIT) problems.push(`icon-180.png の生の大きさ ${icon.raw} バイトが ${ICON_RAW_LIMIT} を超えた`);
  if (other.length) groups.push({ name: `どの枠にも入らない（${other.map((f) => f.file).join('、')}）`, limit: 0, gzip: other.reduce((s, f) => s + f.gzip, 0) });
  return { files, total, groups, ok: problems.length === 0, problems };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2];
  if (!dir) {
    console.error('使い方：node scripts/check-budget.mjs <配布物のフォルダ>');
    process.exit(1);
  }
  const r = measure(path.resolve(dir));
  const w = Math.max(...r.files.map((f) => f.file.length));
  console.log(`${'ファイル'.padEnd(w)}  生（バイト）  gzip -9（zlib）`);
  for (const f of r.files) console.log(`${f.file.padEnd(w)}  ${String(f.raw).padStart(11)}  ${String(f.gzip).padStart(14)}`);
  console.log('');
  for (const g of r.groups) {
    const mark = g.limit === 0 ? '' : g.gzip <= g.limit ? '（枠内）' : '（枠を超えた。合計で判定）';
    console.log(`${g.name}: ${g.gzip}${g.limit ? ` / ${g.limit}` : ''} ${mark}`);
  }
  console.log(`合計（gzip 後）: ${r.total} / ${TOTAL_LIMIT}`);
  for (const p of r.problems) console.error(`NG: ${p}`);
  console.log(r.ok ? 'OK' : 'NG');
  process.exit(r.ok ? 0 : 1);
}
