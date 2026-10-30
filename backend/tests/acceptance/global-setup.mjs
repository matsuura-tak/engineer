// 配布物を 1 回だけビルドする（contracts/test-hooks.md「実行の環境」：配布物は backend/scripts/build.mjs でビルドしたフォルダを使う）。
// 結果は process.env で各ワーカーに渡す。ビルドできないときは例外にせず、理由を env に入れて各テストを落とす
// （設定の誤りではなく「アプリ（ビルドの手順）がまだない」ことがテストごとのログに残るようにするため）。
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { BACKEND_DIR, DIST_DIR, DIST_VERSION } from './helpers/paths.mjs';

export default async function globalSetup() {
  // ビルド済みの配布物を指して動かすとき（G3 で特定のビルドを検証する、など）は KYOUNOITTE_DIST を外から渡す。
  if (process.env.KYOUNOITTE_DIST) {
    if (!existsSync(path.join(process.env.KYOUNOITTE_DIST, 'index.html'))) {
      process.env.KYOUNOITTE_BUILD_ERROR = `KYOUNOITTE_DIST=${process.env.KYOUNOITTE_DIST} に index.html がない`;
    }
    return;
  }
  const buildScript = path.join(BACKEND_DIR, 'scripts', 'build.mjs');
  if (!existsSync(buildScript)) {
    process.env.KYOUNOITTE_BUILD_ERROR = `${path.relative(path.dirname(BACKEND_DIR), buildScript)} が見つからない（実装がまだない）`;
    return;
  }
  const r = spawnSync(process.execPath, [buildScript, '--out', DIST_DIR, '--version', DIST_VERSION], {
    cwd: BACKEND_DIR,
    encoding: 'utf8',
  });
  if (r.status !== 0) {
    process.env.KYOUNOITTE_BUILD_ERROR = `build.mjs が終了コード ${r.status} で失敗：${(r.stderr || r.stdout || '').trim().slice(0, 2000)}`;
    return;
  }
  if (!existsSync(path.join(DIST_DIR, 'index.html'))) {
    process.env.KYOUNOITTE_BUILD_ERROR = `ビルドの出力 ${DIST_DIR} に index.html がない`;
    return;
  }
  delete process.env.KYOUNOITTE_BUILD_ERROR;
  process.env.KYOUNOITTE_DIST = DIST_DIR;
}
