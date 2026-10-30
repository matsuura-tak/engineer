// 配布物のビルド（contracts/test-hooks.md「ビルドの手順の約束」）：node scripts/build.mjs --out <フォルダ> --version <版> [--tasks <tasks.json>]
// AC-28 で旧版と新版を作るために使う。実装のモジュールは import しない（CLI だけを使う）。
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { BACKEND_DIR } from './paths.mjs';

export function buildDist({ out, version, tasks }) {
  const args = [path.join(BACKEND_DIR, 'scripts', 'build.mjs'), '--out', out, '--version', version];
  if (tasks) args.push('--tasks', tasks);
  const r = spawnSync(process.execPath, args, { cwd: BACKEND_DIR, encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`build.mjs（--version ${version}）が終了コード ${r.status}：${(r.stderr || r.stdout || '').trim().slice(0, 2000)}`);
  }
  return out;
}
