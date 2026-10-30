// テストの土台。worker ごとにテスト用の静的サーバーを立て、baseURL を 127.0.0.1:<port>/engineer/ にする（W-11）。
// 配布物は global-setup.mjs がビルドしたもの（backend/dist/）。ビルドできていなければ、各テストがその理由で落ちる。
import { test as base, expect } from '@playwright/test';
import { createStaticServer } from '../server/static-server.mjs';

export const test = base.extend({
  dist: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      if (process.env.KYOUNOITTE_BUILD_ERROR) {
        throw new Error(`配布物を作れないので受け入れテストを動かせない：${process.env.KYOUNOITTE_BUILD_ERROR}`);
      }
      if (!process.env.KYOUNOITTE_DIST) {
        throw new Error('global-setup が配布物の場所（KYOUNOITTE_DIST）を渡していない');
      }
      await use(process.env.KYOUNOITTE_DIST);
    },
    { scope: 'worker' },
  ],
  server: [
    async ({ dist }, use) => {
      const server = await createStaticServer({ root: dist });
      await use(server);
      await server.close();
    },
    { scope: 'worker' },
  ],
  baseURL: async ({ server }, use) => {
    await use(server.url);
  },
});

export { expect };
