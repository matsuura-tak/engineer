// テスト用の静的サーバー（contracts/test-hooks.md「実行の環境（W-11）」）。node の組み込みだけで書く。
// - 配布物を /engineer/ の下で配る（本番の GitHub Pages と同じパス）。
// - GitHub Pages と同じヘッダー：Cache-Control: max-age=600、Accept-Encoding に gzip があれば Content-Encoding: gzip、拡張子に合う Content-Type。
// - /engineer は /engineer/ に 301。ないファイルは 404。?query は無視する。
// - 実行中に配る中身のフォルダを差し替える setRoot(newRoot) を持つ（AC-28）。
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

export const PREFIX = '/engineer';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript', // 契約（test-hooks.md「実行の環境」）どおり charset を付けない
  '.mjs': 'text/javascript',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json',
  '.woff2': 'font/woff2',
};

/**
 * @param {{ root: string, host?: string, port?: number }} opts
 * @returns {Promise<{ url: string, origin: string, port: number, root: () => string, setRoot: (r: string) => void, close: () => Promise<void> }>}
 */
export async function createStaticServer({ root, host = '127.0.0.1', port = 0 }) {
  let currentRoot = path.resolve(root);

  const server = http.createServer(async (req, res) => {
    try {
      const method = req.method ?? 'GET';
      if (method !== 'GET' && method !== 'HEAD') {
        res.writeHead(405, { Allow: 'GET, HEAD' });
        res.end();
        return;
      }
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? host}`);
      let pathname = decodeURIComponent(url.pathname);

      if (pathname === PREFIX) {
        res.writeHead(301, { Location: `${PREFIX}/` });
        res.end();
        return;
      }
      if (!pathname.startsWith(`${PREFIX}/`)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404');
        return;
      }
      let rel = pathname.slice(PREFIX.length + 1);
      if (rel === '' || rel.endsWith('/')) rel += 'index.html';
      const file = path.resolve(currentRoot, rel);
      if (file !== currentRoot && !file.startsWith(currentRoot + path.sep)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404');
        return;
      }

      let body;
      try {
        const stat = await fs.stat(file);
        if (stat.isDirectory()) {
          res.writeHead(301, { Location: `${pathname}/` });
          res.end();
          return;
        }
        body = await fs.readFile(file);
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404');
        return;
      }

      const ext = path.extname(file).toLowerCase();
      const headers = {
        'Content-Type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
        'Cache-Control': 'max-age=600',
        Vary: 'Accept-Encoding',
      };
      const accept = String(req.headers['accept-encoding'] ?? '');
      if (/\bgzip\b/.test(accept)) {
        body = gzipSync(body, { level: 9 });
        headers['Content-Encoding'] = 'gzip';
      }
      headers['Content-Length'] = body.length;
      res.writeHead(200, headers);
      if (method === 'HEAD') res.end();
      else res.end(body);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(String(e && e.message ? e.message : e));
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve());
  });
  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  const origin = `http://${host}:${actualPort}`;

  return {
    origin,
    port: actualPort,
    url: `${origin}${PREFIX}/`,
    root: () => currentRoot,
    setRoot(newRoot) {
      currentRoot = path.resolve(newRoot);
    },
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections?.();
        server.close(() => resolve());
      }),
  };
}

// 単独で動かすとき（手で画面を見る用）：node server/static-server.mjs <配布物のフォルダ> [port]
if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const root = process.argv[2];
  if (!root) {
    console.error('使い方：node server/static-server.mjs <配布物のフォルダ> [port]');
    process.exit(2);
  }
  const s = await createStaticServer({ root, port: Number(process.argv[3] ?? 0) });
  console.log(s.url);
}
