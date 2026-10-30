// 受け入れテストの設定（ADR 0004、contracts/test-hooks.md「実行の環境（W-11）」）。
// この設定だけで動く：`cd backend/tests/acceptance && npm ci && npx playwright install chromium webkit && npx playwright test`（contracts/test-hooks.md「実行の環境」）。
// 依存（@playwright/test、@axe-core/playwright、ajv）はこのフォルダの package.json に置く（ADR 0004 の B）。`cd backend && npx playwright test -c tests/acceptance` の形は使わない。
// projects は chromium と webkit の 2 つ。retries は 0（判定の実行で再試行を使わない）。
import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: path.join(here, 'tests'),
  testMatch: /.*\.spec\.mjs$/,
  outputDir: path.join(here, 'test-results'),
  globalSetup: path.join(here, 'global-setup.mjs'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: path.join(here, 'playwright-report') }]],
  use: {
    // baseURL は helpers/fixtures.mjs の server フィクスチャが上書きする（127.0.0.1:<port>/engineer/）。
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
    viewport: { width: 1024, height: 768 },
    acceptDownloads: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    testIdAttribute: 'data-testid',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], locale: 'ja-JP', timezoneId: 'Asia/Tokyo', viewport: { width: 1024, height: 768 } },
    },
    {
      name: 'webkit',
      // AC-15 の回線と CPU の制限は Chromium の CDP だけ（W-11）なので、webkit では ac15 のファイルを対象にしない。
      testIgnore: /ac15-/,
      use: { ...devices['Desktop Safari'], locale: 'ja-JP', timezoneId: 'Asia/Tokyo', viewport: { width: 1024, height: 768 } },
    },
  ],
});
