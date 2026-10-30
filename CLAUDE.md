# アプリの地図

このファイルはこのアプリの地図です。tech-lead（テックリード）が手入れし、100行以内に保ちます。
アプリ名と一言の説明は .claude/org/app.json の app_name と idea にあります。
組織の決まりは .claude/rules/org.md、関門は docs/org/gates.md、進み具合は docs/progress.md を読みます。

## 概要
- 何のアプリか：「今日の一手」。3 問の自己診断に答えると、毎日 15 分で終わる学習の課題が 1 つ出る、ブラウザだけで動く Web アプリ（サーバーなし、登録なし）。データはブラウザの中だけ。
- 使う人：すでにコードを書いている実務 1〜5 年目のエンジニア（docs/prd/product.md）。
- いまの段階：001-daily-learning の G1（設計）。コードはまだない。公開先は https://matsuura-tak.github.io/engineer/（GitHub Pages）。

## ビルド/テストのコマンド
.claude/org/app.json の commands と同じものを書きます。CI は app.json の方を使います。
コマンドを変えたら、app.json の更新を Takuma に頼みます（.claude/ は Takuma だけが直せます）。
受け入れテストは、受け入れテストのフォルダの中の設定（backend/tests/acceptance/playwright.config.mjs）だけで動きます。
- iOS のビルド、iOS のテスト：なし（iOS のアプリは作らない。stacks は backend だけ）
- バックエンドのテスト（app.json の backend_test に入れる案。未確認：G2 で backend-engineer が確かめる）：
  `cd backend && npm ci && npx playwright install --with-deps chromium webkit && npm test`
  - `npm test` の中身（ADR 0001 の scripts）：契約の検査 → 単体テスト → 受け入れテスト
- 個別のコマンド（どれも backend/ で実行）：
  - 契約の検査：`node ../contracts/tools/check-schemas.mjs`（確認済み：2026-10-30、ajv 8.20.0 を入れたフォルダから同じスクリプトを実行し、見本 38 件、期待と違う結果 0 件、終了コード 0。backend/ からは未確認）
  - 単体テスト：`node --test 'tests/unit/**/*.test.mjs'`（形は Node 24.22.1 で確認済み。フォルダを渡す形 `tests/unit/` は失敗する。backend/ では未確認）
  - 受け入れテスト：`npx playwright test -c tests/acceptance`（-c がフォルダの中の playwright.config.mjs を読むことは、同じ形の仮のフォルダで確認済み。本物のテストは未確認）
  - ビルド：`node scripts/build.mjs --out dist --version <YYYY-MM-DD.N>`（未確認。backend-engineer が作る）
  - 転送量の予算：`node scripts/check-budget.mjs dist`（未確認。150,000 バイト以下で終了コード 0）
- 作る物（backend-engineer。ADR 0001）：backend/package.json と package-lock.json（devDependencies は contracts/dependencies.md の 3 件を版の固定で）、scripts/build.mjs、scripts/check-budget.mjs。
- Node は 24（.tool-versions）。

## 構成
既定の場所です。app.json の paths を変えたら、この表も同じに直します。

| 場所 | 中身 | 書く役 |
|---|---|---|
| backend/public/ | 配布物の元（index.html、CSS、ES modules、sw.js、data/tasks.json、i18n/ja.json と en.json） | backend-engineer（tasks.json の中身は pdm の下書きを写す） |
| backend/scripts/ | ビルド（写して版を刻印する）と転送量の検査 | backend-engineer |
| backend/tests/unit/ | 単体テスト（node --test） | backend-engineer |
| backend/tests/acceptance/ | 受け入れテスト、設定、テスト用の静的サーバー | verifier |
| backend/docs/、backend/RUNBOOK.md | 実装ノート、運用手順書 | backend-engineer |
| backend/dist/ | ビルドの出力（コミットしない） | — |
| contracts/schemas/ | JSON Schema（課題集、保存データ＝書き出し＝seed、文言） | tech-lead |
| contracts/ のその他 | 保存の決まり、識別子、つなぎ口、SW、予算と CSP、見本（fixtures/）、検査（tools/）、依存の許可リスト | tech-lead |
| .gitignore、.tool-versions、README.md、Makefile など | ルートの設定ファイル | tech-lead |
| design/ | 調査、画面の仕様、デザイントークン、文言の原本（7 の表） | designer |
| docs/prd/、docs/support/、metadata/ | PRD、サポートとプライバシーのページ、掲載文 | pdm |
| docs/adr/ | 技術判断の記録（0001〜）、機能ごとの技術設計メモ（docs/adr/features/） | tech-lead |
| docs/verification/ | テスト計画、検証レポート、証拠 | verifier |
| docs/progress.md、docs/reviews/、docs/approvals/ | 進捗、判定の記録、Takuma の承認 | 指揮役 |
| .claude/、.github/ | 組織の定義と CI、Pages の公開（キットと Takuma が管理） | Takuma だけ |

## このアプリだけの決まり
- 対応ブラウザ：Safari 17 以上（iOS、iPadOS、macOS）と Chrome の最新 2 版。Safari 17.0 にない機能は使わない（contracts/budgets.md の 5）。自動テストは Playwright の Chromium と WebKit。
- 本番の依存ライブラリは 0 件。JS はまとめずに ES modules のまま配る。動的な `import()` は使わない。JS のファイルは 15 個まで（ADR 0001）。
- URL はすべて相対（`./…`）。本番は `/engineer/` の下で動く。
- CSP は contracts/budgets.md の 3 の文字列を meta で 1 つだけ。インラインのスクリプト、スタイル、`style` 属性、イベント属性を書かない。文字は textContent でだけ入れ、`innerHTML` などは使わない（ADR 0005）。
- 保存は localStorage のキー `kyounoitte:data` だけ。他のキーに触らない。1 回の保存は 1 回の setItem。形を変えるなら `formatVersion` を上げる（ADR 0002、contracts/data.md）。
- 領域、段階、経験年数、課題の ID は変えない。課題は消さず、ID を使い回さない（contracts/identifiers.md の 5）。
- テストのつなぎ口を本番に入れない。URL の引数を読まない（contracts/test-hooks.md）。
- 転送量は gzip 後の合計 150,000 バイト以下。課題集は 1 件の本文が平均 600 字以下（contracts/budgets.md）。
- 日付は端末の日付の `YYYY-MM-DD`（`toISOString` は使わない）。
