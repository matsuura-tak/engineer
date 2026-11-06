# アプリの地図

このファイルはこのアプリの地図です。tech-lead（テックリード）が手入れし、100行以内に保ちます。
アプリ名と一言の説明は .claude/org/app.json の app_name と idea にあります。
組織の決まりは .claude/rules/org.md、関門は docs/org/gates.md、進み具合は docs/progress.md を読みます。

## 概要
- 何のアプリか：「今日の一手」。3 問の自己診断に答えると、毎日 15 分で終わる学習の課題が 1 つ出る、ブラウザだけで動く Web アプリ（サーバーなし、登録なし）。データはブラウザの中だけ。
- 使う人：すでにコードを書いている実務 1〜5 年目のエンジニア（docs/prd/product.md）。
- いまの段階：001-daily-learning は Takuma の FB 2 回目の作り直しで G1（PRD r13、design r13。G1 のデザインの判定は design-reviewer r6、tech-lead r3 とも PASS）。2026-11-06 に ADR 0002 の改訂 2 と 0006〜0008 を提案した（reviewer の反論待ち）。契約（contracts/）はまだ r10 の形で、次の回から r13 に書き直す。実装と受け入れテストはその後に追従する。公開先は https://matsuura-tak.github.io/engineer/（GitHub Pages。2026-11-06 は未公開で 404。公開は 2026-12-07 の仮置き）。

## ビルド/テストのコマンド
.claude/org/app.json の commands と同じものを書きます。CI は app.json の方を使います。
コマンドを変えたら、app.json の更新を Takuma に頼みます（.claude/ は Takuma だけが直せます）。
受け入れテストは、受け入れテストのフォルダの中の設定（backend/tests/acceptance/playwright.config.mjs）だけで動きます。
- iOS のビルド、iOS のテスト：なし（iOS のアプリは作らない。stacks は backend だけ）
- 下の結果はどれも r10 の形の実装（2026-11-05、HEAD a7383da）のもの。FB 2 回目の作り直しの後は未確認（G2 で確かめ直す。ADR 0007 の後は build に esbuild が入る）。
- バックエンドのテスト（app.json の backend_test の案。Takuma の決定 D8 で Takuma が main で入れる。2026-11-05 の時点で app.json の backend_test はまだ空。2026-11-05 に backend/ で終了コード 0。ただし 1 回目は WebKit の 5 件が `context.close` の trace の ENOENT（test-results の中のファイルがない）で落ち、同じコードの 2 回目と 3 回目は全件合格。原因は未確認）：
  `cd backend && npm ci && npm test`
  - `npm test` の中身（ADR 0001 の scripts）：契約の検査 → 単体テスト → 受け入れテスト（`test:acceptance` が受け入れテストのフォルダで npm ci とブラウザの入れ方までする）。結果（2026-11-05）：見本 52 件 OK、単体 158/158、受け入れ 219 passed
  - Linux の CI で WebKit の OS のライブラリ（`npx playwright install-deps`）が要るかは未確認（ADR 0004）
- 受け入れテスト（依存は受け入れテストのフォルダの package.json だけ。ADR 0004）：
  `cd backend/tests/acceptance && npm ci && npx playwright install chromium webkit && npx playwright test`（2026-11-05 に `--list` で `Total: 219 tests in 23 files`。AC-15 の Chromium の 5 回は 1136, 1087, 1087, 1081, 1080 ms）
- 個別のコマンド（どれも backend/ で実行）：
  - 契約の検査：`npm run check:contracts`（= `node ../contracts/tools/check-schemas.mjs`。ajv は実行したフォルダから探すので backend/package.json に ajv が要る。2026-11-05 に backend/ で確認：見本 52 件、期待と違う結果 0 件、終了コード 0）
  - 単体テスト：`node --test 'tests/unit/**/*.test.mjs'`（2026-11-05 に backend/ で確認：158 件中 158 件合格、終了コード 0。フォルダを渡す形 `tests/unit/` は終了コード 1）
  - ビルド：`npm run build -- --version <YYYY-MM-DD.N>`（= `node scripts/build.mjs --out dist --version …`。2026-11-05 に `--out` を一時フォルダにして確認：20 ファイル、終了コード 0。`--version dev` は終了コード 1）
  - 転送量の予算：`node scripts/check-budget.mjs dist`（2026-11-05 に確認：gzip 後の合計 109,554 / 150,000 バイト、殻 30,023 / 32,000（JS 25,829。見直しの線 27,000 は ADR 0001）、終了コード 0）
- 依存：backend/package.json の devDependencies は今 ajv 8.20.0 だけ。ADR 0007 が承認されたら esbuild 0.28.2 を足す（lockfile に `@esbuild/*` の optional 26 件。npm 12 が止める install script は止めたまま）。lockfile には ajv が持ち込む 4 件もある。推移的な依存の決まりと確かめ方は contracts/dependencies.md。入れるのは `npm ci` だけ。
- Node は 24（.tool-versions）。

## 構成
既定の場所です。app.json の paths を変えたら、この表も同じに直します。

| 場所 | 中身 | 書く役 |
|---|---|---|
| backend/public/ | 配布物の元（index.html、CSS、JS のソースの ES modules、sw.js、課題集（ADR 0006 の後は data/tasks-<領域>.json の 6 つ）、i18n/ja.json と en.json、manifest.webmanifest、icon-180.png、ミルの絵 img/miru-*.png の 8 枚（ADR 0008）） | backend-engineer（tasks.json の中身は pdm の下書きを写す） |
| backend/scripts/ | ビルド（写して版を刻印し、ADR 0007 の後は JS をまとめる）と転送量の検査 | backend-engineer |
| backend/tests/unit/ | 単体テスト（node --test） | backend-engineer |
| backend/tests/acceptance/ | 受け入れテスト、設定、テスト用の静的サーバー | verifier |
| backend/docs/、backend/RUNBOOK.md | 実装ノート、運用手順書 | backend-engineer |
| backend/dist/ | ビルドの出力（コミットしない。ADR 0007 の後は JS は js/app.js と sw.js の 2 つ） | — |
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
- 本番の依存ライブラリは 0 件（ADR 0001）。JS のソースは ES modules で書き、配るときは esbuild（devDependency）で 1 つの `js/app.js` にまとめる。sw.js はまとめない。動的な `import()` は使わない。JS のファイルの数の上限と見直しの線 27,000 はなくし、殻の枠で見る（ADR 0007。提案中で、承認までは ADR 0001 のまま）。
- URL はすべて相対（`./…`）。本番は `/engineer/` の下で動く。
- CSP は contracts/budgets.md の 3 の文字列を meta で 1 つだけ。インラインのスクリプト、スタイル、`style` 属性、イベント属性を書かない。文字は textContent でだけ入れ、`innerHTML` などは使わない（ADR 0005）。
- 保存は localStorage のキー `kyounoitte:data` だけ。他のキーに触らない。1 回の保存は 1 回の setItem。公開の後に形を変えるなら `formatVersion` を上げる。FB 2 回目の作り直し（公開前）は版 1 のまま（ADR 0002 の改訂 2、contracts/data.md）。
- 領域、段階、経験年数、課題の ID は最初の公開から変えない。課題は消さず、ID を使い回さない（contracts/identifiers.md の 5、ADR 0002）。
- テストのつなぎ口を本番に入れない。URL の引数を読まない（contracts/test-hooks.md）。
- 転送量は初回に読む分が gzip 後 150,000 バイト以下。課題集は 6 領域のファイルに分け、診断の 1 問目の確定で先に取る（ADR 0006）。SW が貯める分の枠と課題集の 1 件の上限は、次の回の contracts/budgets.md で決め直す。
- 案内役ミルの絵は PNG を `<picture>` で切り替える。data: の画像と `style` 属性は使わない（ADR 0008）。
- 日付は端末の日付の `YYYY-MM-DD`（`toISOString` は使わない）。
