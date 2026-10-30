// AC-15：ページを開いてから課題の表示まで 2 秒以内（Chromium だけ。W-11 の回線と CPU の制限）。
// 時刻は固定しない（W-3：performance を上書きしないため）。seed の日付は実行日より前（2026-10）。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectSeed, loadSeed } from '../helpers/seed.mjs';

test('AC15_遅い回線とCPU4倍の制限でキャッシュなしに開き_data-debug-load-msが5回とも2000以下', async ({ browser, baseURL, browserName }, testInfo) => {
  expect(browserName, 'この AC は Chromium の CDP で制限をかける（W-11）').toBe('chromium');
  const seed = loadSeed('seed-diagnosed-2026-10.json');
  const values = [];
  for (let i = 0; i < 5; i++) {
    const context = await browser.newContext({ timezoneId: 'Asia/Tokyo', locale: 'ja-JP' });
    await injectSeed(context, seed);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200_000, uploadThroughput: 93_750 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    await page.goto(baseURL);
    await app.expectState(page, 'task.today');
    const ms = await app.root(page).getAttribute('data-debug-load-ms');
    expect(ms, 'data-debug-load-ms は 0 以上の整数の文字列').toMatch(/^\d+$/);
    values.push(Number(ms));
    if (i === 0) await app.shot(page, testInfo, 'AC15_task.today');
    await context.close();
  }
  testInfo.annotations.push({ type: 'data-debug-load-ms × 5', description: values.join(', ') });
  for (const v of values) expect(v).toBeLessThanOrEqual(2000);
});
