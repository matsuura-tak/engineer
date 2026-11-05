// 受け入れテストの設定（ADR 0004、contracts/test-hooks.md「実行の環境（W-11）」）。
// この設定だけで動く：`cd backend/tests/acceptance && npm ci && npx playwright install chromium webkit && npx playwright test`（contracts/test-hooks.md「実行の環境」）。
// 依存（@playwright/test、@axe-core/playwright、ajv）はこのフォルダの package.json に置く（ADR 0004 の B）。`cd backend && npx playwright test -c tests/acceptance` の形は使わない。
// projects は chromium、webkit と、AC-15 だけの chromium-ac15 の 3 つ。retries は 0（判定の実行で再試行を使わない）。
//
// AC-15（読み込みの時間。CPU 4 倍と回線の制限）は他のテストと並列にしない（contracts/test-hooks.md「W-11 AC-15 の制限」、2026-11-05 の指揮役の決定）：
// - chromium と webkit の project は ac15 のファイルを対象にしない（testIgnore）。
// - chromium-ac15 は dependencies で chromium と webkit の後に動く（Playwright は dependencies のすべてのテストが終わってから従属する project を始めるので、
//   同じ時間に他の worker は動いていない）。テストは 1 本で、project の fullyParallel も false（--repeat-each でも同じ worker で順に動く）。
//   `npx playwright test` の 1 つのコマンドで全件が流れる（backend の `npm test` → `test:acceptance` も同じ）。
// - AC-15 だけを動かすときは `npm run test:ac15`（= `playwright test --project=chromium-ac15 --no-deps --workers=1`。--no-deps がないと dependencies の全件も動く）。
// - 注意：dependencies の project に失敗があると Playwright は chromium-ac15 を動かさず「skipped」と数える。全件が緑でない実行の AC-15 の結果は、`npm run test:ac15` で別に取る。
import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const common = { locale: 'ja-JP', timezoneId: 'Asia/Tokyo', viewport: { width: 1024, height: 768 } };

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
    ...common,
    acceptDownloads: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    testIdAttribute: 'data-testid',
  },
  projects: [
    {
      name: 'chromium',
      // AC-15 は chromium-ac15 で別に流す（W-11）。
      testIgnore: /ac15-/,
      use: { ...devices['Desktop Chrome'], ...common },
    },
    {
      name: 'webkit',
      // AC-15 の回線と CPU の制限は Chromium の CDP だけ（W-11）なので、webkit では ac15 のファイルを対象にしない。
      testIgnore: /ac15-/,
      use: { ...devices['Desktop Safari'], ...common },
    },
    {
      name: 'chromium-ac15',
      // AC-15 だけ。chromium と webkit の全件が終わってから、他の worker が動いていない状態で流す（W-11）。
      testMatch: /ac15-.*\.spec\.mjs$/,
      dependencies: ['chromium', 'webkit'],
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'], ...common },
    },
  ],
});
