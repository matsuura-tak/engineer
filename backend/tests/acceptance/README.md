# 受け入れテスト（001-daily-learning「今日の一手」）

verifier が PRD（docs/prd/001-daily-learning.md）、design/、contracts/ だけを読んで書いた受け入れテストです。実装のコードは読んでいません。
計画と期待値は docs/verification/001-daily-learning/test-plan.md、実装前に落ちた記録は同じフォルダの evidence/red.log にあります。

## 動かし方
このフォルダの設定（playwright.config.mjs）だけで動きます。Node は 24（.tool-versions）。

```sh
cd backend/tests/acceptance
npm ci                                   # 依存は contracts/dependencies.md の 3 件だけ（版を固定）
npx playwright install chromium webkit   # ブラウザのバイナリ
npx playwright test                      # 判定の実行。再試行は 0（retries: 0）
```

- global-setup.mjs が `node backend/scripts/build.mjs --out <一時フォルダ>/dist --version 2026-11-30.1` で配布物を 1 回ビルドし（出力先は mkdtemp の一時フォルダ。backend/dist は使わず、終わったら消す）、各ワーカーが `server/static-server.mjs` で `http://127.0.0.1:<port>/engineer/` の下に配ります（GitHub Pages と同じパスとヘッダー）。
- 実行のコマンドはこのフォルダの中でだけ動きます（依存がこのフォルダの package.json にあるため。契約 test-hooks.md「実行の環境」、ADR 0004 の B）。`cd backend && npx playwright test -c tests/acceptance` の形は使いません。
- ビルド済みの配布物を検証するときは `KYOUNOITTE_DIST=<フォルダ> npx playwright test`（ビルドを飛ばしてそのフォルダを配る）。
- ビルドできないとき（build.mjs がない、失敗する）は、各テストがその理由で落ちます。設定の誤りではありません。
- 揺れの確認（G3）：同じコマンドを 5 回。1 回でも落ちればその AC は未検証。
- seed の検査：`npm run check:seeds`（seeds/ の JSON が contracts/schemas/data.schema.json と data.md の 8 に合うか）。
- 1 つの AC だけ：`npx playwright test -g AC8_`、1 つのブラウザだけ：`--project=chromium`。

## 構成
| 場所 | 中身 |
|---|---|
| playwright.config.mjs | projects は chromium と webkit。timezoneId Asia/Tokyo、locale ja-JP。AC-15（CDP の制限）は chromium だけ（webkit は `ac15-` を対象外） |
| global-setup.mjs | 配布物のビルド（1 回。一時フォルダに出し、teardown で消す）。結果を env で各ワーカーに渡す |
| server/static-server.mjs | テスト用の静的サーバー（node の組み込みだけ。gzip、`Cache-Control: max-age=600`、Content-Type、`/engineer` → `/engineer/` の 301、404、実行中の差し替え `setRoot`） |
| helpers/fixtures.mjs | worker ごとのサーバーと baseURL |
| helpers/app.mjs | 画面の操作と読み出し（data-testid、data-state、履歴の行、書き出し、送信の数え方 W-12、SW の準備 W-13、キーボードの移動キー：WebKit は Alt+Tab、それ以外は Tab） |
| helpers/seed.mjs | seed の投入（W-7）、保存の失敗と persist の拒否の注入（W-9）、standalone と UA の偽装（W-16）、課題集から「出し終えた」履歴を作る |
| helpers/schema.mjs | contracts/schemas を ajv（2020-12、strict）で検査 |
| helpers/build.mjs | build.mjs の CLI を呼ぶ（AC-28 の旧版と新版） |
| seeds/ | この機能の seed（contracts/fixtures/seeds/ にない分。すべて data.schema.json に通る） |
| tests/*.spec.mjs | 受け入れテスト。テスト名は `AC<番号>_<結果>`。budgets.md 2 の予算の 1 本だけ `BUDGET2_`（AC ではない。W-6） |

## 守っていること
- 要素は contracts/identifiers.md の `data-testid` と `data-*` でだけ探す。表示の文字では探さない（文字は文言ファイル i18n/*.json の値と比べる）。
- 待つのは状態や要素の変化だけ（expect / toHaveAttribute / toHaveCount）。`waitForTimeout` や sleep は使わない。例外は AC-28 の PRD が決めた「2 秒以上の間隔」（helpers/app.mjs の `pause`）の 1 か所だけ。
- つなぎ口はすべて Playwright の側（addInitScript、clock、setOffline、CDP、setInputFiles）。本番の配布物には何も入れない。
- 実装のモジュールを import しない。配布物は HTTP で、ビルドは CLI で使う。
- `test.skip`、`test.fixme`、`retries` を使わない。
