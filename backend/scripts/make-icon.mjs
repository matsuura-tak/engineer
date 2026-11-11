// ホーム画面のアイコン public/icon-180.png を作る（design/001-daily-learning.md の 8、D-29。Takuma の決定 D5）。1 回だけ手で動かす道具。
//   node scripts/make-icon.mjs
// 依存を増やさないため、受け入れテストのフォルダに既にある Playwright の Chromium を借りる
// （先に `cd tests/acceptance && npm ci && npx playwright install chromium`）。
// 180 × 180 の canvas を白（color.bg のライト #FFFFFF）で塗り、「一」（U+4E00）を color.text のライト #1F1F1F で、
// システムの sans-serif の太さ 700 で描く。字の墨の横幅を 108 px（幅の 60%）にし、墨の箱の中心を (90, 90) に置く。
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const backend = path.resolve(here, '..');
const require = createRequire(path.join(backend, 'tests', 'acceptance', 'package.json'));
const { chromium } = require('@playwright/test');

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 180, height: 180 }, deviceScaleFactor: 1 });
  const result = await page.evaluate(() => {
    const SIZE = 180;
    const TARGET = 108;
    const family = 'system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif';
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    const measure = (px) => {
      ctx.font = `700 ${px}px ${family}`;
      return ctx.measureText('一');
    };
    // 墨の横幅が 108 px になる大きさを二分探索で探す
    let lo = 10;
    let hi = 400;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      const m = measure(mid);
      const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
      if (w < TARGET) lo = mid;
      else hi = mid;
    }
    const px = (lo + hi) / 2;
    const m = measure(px);
    const inkW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const inkH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = '#1F1F1F';
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    // 墨の箱の左上を (90 - inkW/2, 90 - inkH/2) に置く
    const x = SIZE / 2 - inkW / 2 + m.actualBoundingBoxLeft;
    const y = SIZE / 2 - inkH / 2 + m.actualBoundingBoxAscent;
    ctx.fillText('一', x, y);
    return { dataUrl: canvas.toDataURL('image/png'), px, inkW, inkH };
  });
  const png = Buffer.from(result.dataUrl.split(',')[1], 'base64');
  const out = path.join(backend, 'public', 'icon-180.png');
  writeFileSync(out, png);
  console.log(`icon-180.png：${png.length} バイト、字の大きさ ${result.px.toFixed(1)} px、墨の幅 ${result.inkW.toFixed(1)} px、高さ ${result.inkH.toFixed(1)} px`);
} finally {
  await browser.close();
}
