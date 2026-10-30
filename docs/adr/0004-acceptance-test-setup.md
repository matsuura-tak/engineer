# ADR 0004：受け入れテストは Playwright の Chromium と WebKit で、設定を受け入れテストのフォルダの中だけに置く

- 状態：提案（G1 で reviewer が判定する）
- 書いた役：tech-lead　日付：2026-10-30
- 関係する PRD、設計メモ、契約：docs/prd/001-daily-learning.md（11 の冒頭、AC-1〜AC-32）、docs/adr/features/001-daily-learning.md、contracts/test-hooks.md、contracts/dependencies.md
- 元に戻す手間：大（受け入れテストをすべて書き直す）

## 背景
- PRD の確かめ方は、ブラウザの自動テスト（オフライン、時刻の固定、UA の偽装、SW、ダウンロード、ファイルの選択、CDP の制限、axe-core）を前提にしている。対応ブラウザは Safari と Chrome。
- 組織の決まり：受け入れテストは受け入れテストのフォルダの中の設定だけで動く。verifier が書き、作り手は触らない。依存は contracts/dependencies.md の表だけ。
- HTTP の API がないので、spectral と oasdiff は使えない（指揮役の裁定 E2：JSON Schema の検査と見本のテストで代える）。

## 決定
- `@playwright/test` 1.64.1 で、projects は chromium と webkit。設定は `backend/tests/acceptance/playwright.config.mjs`。コマンドは `cd backend && npx playwright test -c tests/acceptance`。
- テスト用の静的サーバーは、verifier が node の組み込みだけで書き、GitHub Pages と同じパス（/engineer/）とヘッダーを返す（test-hooks.md）。
- 監査は `@axe-core/playwright` 4.14.0。課題集、書き出し、seed、文言ファイルの検査は `ajv` 8.20.0（テストと単体テストの中だけ）。
- 契約の検査は `contracts/tools/check-schemas.mjs`（ajv で 3 つのスキーマをメタスキーマで検査し、見本の合否を確かめる）。backend の `npm test` の最初に走る（ADR 0001 の scripts）。

## 検討した案
| 案 | 良い点 | 悪い点 | 選ばなかった理由 |
|---|---|---|---|
| (a) Playwright の Chromium と WebKit（採用） | PRD の確かめ方がすべて API にある（clock、setOffline、fromServiceWorker、addInitScript、CDP）。WebKit で Safari に近い挙動を見られる | WebKit は Safari 17 そのものではない（最新の WebKit のビルド） | — |
| (b) Playwright の Chromium だけ | 速い。CI が軽い | Safari 固有の挙動（SW、ダウンロード、Trusted Types の有無）を見逃す | 主な利用者は iPhone の Safari |
| (c) WebdriverIO と safaridriver で本物の Safari | Safari そのもの | macOS の実行環境が要り、時刻の固定、オフライン、SW の応答の見分けが難しい | 確かめ方の半分が書けない。本物の Safari は G4 の実機で見る |
| (d) 静的サーバーに既存のパッケージ（serve、http-server） | 書く量が少ない | 依存が増え、Cache-Control と gzip を GitHub Pages に合わせにくい | ヘッダーを合わせることが AC-28 の要（G1 r1 の spike 2） |
| (e) スキーマの検査を ajv でなく手書きだけにする | 依存が 1 つ減る | 手書きの検査が正しいかを確かめる基準がない | 本番の手書きの検査を ajv と突き合わせることで、両方を守る |

## いちばん強い反論と、それでも選んだ理由
- 反論：Playwright の WebKit で通っても、iOS の Safari 17 で動く保証はない。特に Blob の書き出し、ホーム画面の Web アプリ、7 日の消去は実機でしか分からない。
- それでも選んだ理由：使わない機能の一覧（budgets.md の 5）で Safari 17 との差を減らし、実機の 3 項目は G0 の承認で G4 に回してある（docs/approvals/001-daily-learning-G0.md）。自動テストは毎回、実機は版ごとに 1 回、と役を分ける。

## 結果
- 楽になること：PRD の 32 件すべてを 2 つのエンジンで自動で確かめられる。G3 の証拠（出力、スクリーンショット、axe の JSON）が同じ道具から出る。
- 難しくなること、守り続けること：ブラウザのバイナリ（`npx playwright install chromium webkit`）を CI と手元に入れる。Playwright の版を上げるときは、clock と SW の挙動を確かめ直す。
- 元に戻すとき：別の道具に移るなら、つなぎ口（test-hooks.md）はそのままで、テストのコードだけを書き直す。5 日以上。

## 見直す条件
- G4 の実機で、WebKit の受け入れテストが通ったのに Safari で落ちる項目が 1 件でも出た。
- @playwright/test か @axe-core/playwright が 12 か月更新されない。
- サーバーを持ち、HTTP の API ができた（そのときは OpenAPI、spectral、oasdiff に戻す）。

## 確かめたこと
- 2026-10-30、スクラッチパッドの仮の backend/tests/acceptance/playwright.config.mjs で `npx playwright test -c tests/acceptance` → `✓ [chromium] … ✓ [webkit] … 2 passed (1.8s)`、`info.config.configFile` が tests/acceptance/playwright.config.mjs。
- Playwright 1.64.1 の型定義に `setFixedTime(`、`fromServiceWorker(): boolean`、`serviceWorkers?: "allow"|"block"`、`setOffline(`、`newCDPSession(` がある（grep の件数 4、1、4、1、2）。`setFixedTime` の説明は「keeps all the timers running」。
- tech-lead G1 r1 の spike 3 と、この ADR の spike：Trusted Types を含む厳しい CSP の下で、@axe-core/playwright 4.14.0 が Chromium 156 と WebKit 27.2 で動き、わざと置いた違反を `label:critical` で見つけた。
- `node contracts/tools/check-schemas.mjs`（ajv 8.20.0）：見本 34 件、期待と違う結果 0 件、終了コード 0。わざと壊したスキーマ（`type: 'strin'`）はメタスキーマの検査で false、未知のキーワードは strict で例外。出力は設計メモの 4。
- https://playwright.dev/docs/browsers（WebKit は最新の WebKit のビルド。G1 r1 で開いた）

## 確かめ（B）
- [x] 案が2つ以上あり、どの案にも悪い点が書いてある
- [x] 反論、悪い結果、見直す条件が空でない
- [x] 確かめたことに、URL かコマンドの出力がある
