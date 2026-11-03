# ADR 0001：Web の土台は、まとめずに ES modules のまま配り、実行時の依存を 0 にする

- 状態：提案（G1 で reviewer が判定する）
- 書いた役：tech-lead　日付：2026-10-30
- 関係する PRD、設計メモ、契約：docs/prd/001-daily-learning.md（12）、docs/adr/features/001-daily-learning.md、contracts/budgets.md、contracts/service-worker.md
- 元に戻す手間：中（まとめる道具を後から足すのは 1〜2 日。配布物の URL と SW のファイル一覧が変わる）

## 背景
- Takuma の決定で、v1 はブラウザだけで動く Web アプリ（サーバーなし）。GitHub Pages の `https://matsuura-tak.github.io/engineer/` で配る（Q7）。組織のスタックは backend だけで、Web のコードは backend/ に置く。
- 目標：遅い回線と CPU 4 倍の制限で開いてから 2 秒（AC-15）、初回の転送量は gzip 後 150 KB 以下（PRD 12）。本番の CSP はインラインのスクリプトを許さない（budgets.md の 3）。
- 対応ブラウザ：Safari 17 以上と Chrome の最新 2 版。枠は 3 週。作るのは AI の作り手で、レビューも AI。読める量が少ないほど見落としが減る。

## 決定
- JS は変換もまとめもせず、ネイティブの ES modules のファイルのまま配る。`<head>` に全モジュールの `modulepreload` と、JSON 3 つの `preload` を置く。動的な `import()` は使わない。
- 本番の配布物に入る依存ライブラリは 0 件。文言の差し込み、日付、データの検査、SW は標準の API で自分で書く。
- 「ビルド」は写して刻印するだけ：`backend/scripts/build.mjs` が `backend/public/` を出力のフォルダに写し、版（`data-build-version`、sw.js の `VERSION`）、SW のファイル一覧 `FILES`、静的な HTML の日英の 2 文と `<title>`、`apple-mobile-web-app-title` を書き込む。予算の検査は `backend/scripts/check-budget.mjs`。どちらも node の組み込みだけで書く。

## 置き場所と作る物（backend-engineer が作る。tech-lead は書かない）
| 場所 | 中身 |
|---|---|
| backend/public/ | 配布物の元（index.html、CSS、JS のモジュール、sw.js、data/tasks.json、i18n/ja.json、i18n/en.json、manifest.webmanifest、icon-180.png（Takuma の決定 D5。contracts/budgets.md の 6）） |
| backend/scripts/build.mjs、check-budget.mjs | 上の「ビルド」と予算の検査。`build({ out, version, tasks })` を export する（contracts/test-hooks.md） |
| backend/tests/unit/ | 単体テスト（`node --test`）。ファイル名は `*.test.mjs` |
| backend/tests/acceptance/ | 受け入れテスト（verifier。ADR 0004） |
| backend/dist/ | ビルドの出力。コミットしない（.gitignore） |
| backend/package.json、package-lock.json | `"type": "module"`、`"private": true`、`"engines": { "node": ">=24 <25" }`、devDependencies は ajv 8.20.0 だけ（版の固定。@playwright/test と @axe-core/playwright は受け入れテストのフォルダの package.json にだけ置く：ADR 0004 の「依存の置き場所」、contracts/dependencies.md） |

package.json の scripts（この名前で作る。CLAUDE.md のコマンドがこれを使う）：
```json
{
  "build": "node scripts/build.mjs --out dist",
  "check:contracts": "node ../contracts/tools/check-schemas.mjs",
  "test:unit": "node --test 'tests/unit/**/*.test.mjs'",
  "test:acceptance": "cd tests/acceptance && npm ci && npx playwright install chromium webkit && npx playwright test",
  "test": "npm run check:contracts && npm run test:unit && npm run test:acceptance"
}
```
- `build` は版を持たない。版は呼ぶ人が渡す：`npm run build -- --version 2026-11-30.1`。build.mjs は `--version` がないか、identifiers.md の `data-build-version` の形 `YYYY-MM-DD.N`（正規表現は contracts/test-hooks.md の「ビルドの手順の約束」）に合わなければ終了コード 1（前の案の `--version dev` は形に合わないのでやめた。2026-10-31）。
- `check:contracts`：check-schemas.mjs は ajv を、スクリプトの場所でなく実行したフォルダ（`process.cwd()`）から探す。npm の scripts は backend/ で動くので、backend/package.json に ajv が入っていれば動く。入っていないと `Cannot find module 'ajv/dist/2020'` で落ちる（G2 reviewer r1 の提案 6 の答え。2026-10-31 にスクラッチパッドの backend/ の写しで、ajv だけを入れて `npm run check:contracts` → 見本 41 件、期待と違う結果 0 件、終了コード 0。外すと同じエラー）。
- `test:acceptance` は受け入れテストのフォルダで依存とブラウザを入れてから動かす（ADR 0004）。`npm test` だけで、新しい手元でも 3 つが順に動く。
- 層とモジュールの数の上限：JS のファイルは 15 個まで（modulepreload の数と、読む人の量を抑えるため）。class の継承、DI の仕組み、状態管理のライブラリは作らない。
- 単体テストで確かめること（最低限）：手書きのデータの検査が contracts/fixtures/ のすべてで ajv と同じ合否、段階の規則の 9 通り（data.md の 5。AC-8）、日付の作り方（Asia/Tokyo 以外の TZ でも端末の日付）、差し込みの 10 キー、CSP の文字列が budgets.md と一致、`FILES` と出力のフォルダのファイルが一致、365 行の保存データが 1,000,000 字以下（答えが日本語か英数字のとき。改行や制御文字では JSON の長さが増える。data.md の 10）。

## 検討した案
| 案 | 良い点 | 悪い点 | 選ばなかった理由 |
|---|---|---|---|
| (a) まとめない ES modules（採用） | 道具が 0。配る物と書いた物が同じで、レビューと不具合の追跡が簡単。CSP と相性がよい | 要求の数が増える（モジュールの数だけ）。縮めない分だけ生の大きさが増える | — |
| (b) esbuild で 1 ファイルにまとめる | 要求が 1 つ。縮められる | 依存が 1 件増え、配る物が生成物になる。ソースマップを配るか決める必要 | spike で、preload を置けば (a) でも 252 件版で 970〜978 ms（目標の半分）。gzip が効くので縮める利益は小さい |
| (c) Vite（開発サーバーとビルド） | 開発中の再読み込みが速い。広く使われている | 依存が多く（数十件）、設定と更新の手間。base の設定を誤ると /engineer/ で壊れる | 画面は 11 個で、HMR の利益より持つ物の重さが大きい |
| (d) UI の小さなライブラリ（Preact、Lit など） | 画面の差分の描き直しを書かなくてよい | 実行時の依存が入り、150 KB と CSP（Trusted Types）を確かめ直す必要 | 画面はどれも状態が変わったら丸ごと描き直せば足りる大きさ |

## いちばん強い反論と、それでも選んだ理由
- 反論：型の検査（TypeScript）がなく、モジュールの数が増えると遅い回線で要求の待ちが重なる。AI が書くコードの誤りを型で止められない。
- それでも選んだ理由：待ちは modulepreload で並べられ、spike の数字に余裕がある（2 秒に対して 1 秒以下）。型の代わりに、契約（JSON Schema）と単体テストと、2 つのエンジンの受け入れテストで止める。型が要ると分かったら (b) と同じく、道具を 1 つ足すだけで戻れる。

## 結果
- 楽になること：依存の更新がない（本番）。レビューで配布物そのものを読める。CSP の `script-src 'self'` だけで動く。
- 難しくなること、守り続けること：モジュールは 15 個まで。動的な `import()` を使わない（古い画面が新しい版のファイルを読まないため。service-worker.md の 6）。Safari 17.0 にない機能を使わない（budgets.md の 5）。
- 元に戻すとき：build.mjs に esbuild の呼び出しを足し、FILES と modulepreload の一覧を出力に合わせる。1〜2 日。

## 見直す条件
- JS の gzip 後の合計が 26,000 バイトを超える、または JS のファイルが 15 個を超える。
- AC-15 の 5 回の最大値が 1,600 ms（目標の 80%）を超える。
- 型の誤りが原因の不具合が、G3 か公開後に 2 件を超える。
- 最低の対応を Safari 18 以上に上げる（使わない機能の一覧を見直す）。

## 確かめたこと
- spike（tech-lead G1 r1、Playwright 1.64.1、node v24.22.1、Chromium の CDP で遅延 150 ms・下り 1.6 Mbps・CPU 4 倍）：252 件 × 600 字で preload あり 970〜978 ms、なし 1,299〜1,317 ms。126 件 × 600 字で 719〜765 ms。
- MDN の互換データ（@mdn/browser-compat-data 8.1.7、2026-10-30）：`html.elements.link.rel.modulepreload` は Safari 17、`html.elements.script.type.module` は Safari 10.1。
- `node --test 'tests/unit/**/*.test.mjs'` は Node 24.22.1 で動いた（`ℹ tests 1`、`ℹ pass 1`）。`node --test tests/unit/` はフォルダを指すと `Cannot find module` で失敗したので、scripts は glob の形にした。
- 未確認：backend/ はまだないので、本物の build.mjs と check-budget.mjs と package.json の scripts は動かしていない（G2 で backend-engineer が確かめる）。scripts の形（`check:contracts`、`test:unit`、`test:acceptance`、`test`）は、2026-10-31 にスクラッチパッドの backend/ の写しで `npm ci && npm test` を動かし、契約の検査と単体テスト（仮の 1 件）が通り、受け入れテストが 131 件とも「build.mjs が見つからない」で落ちる（実装前の赤）ところまで確かめた。
- 2026-11-03 の追記：上の未確認は backend/ で確認した（`npm test` が終了コード 0。コマンドごとの結果は CLAUDE.md）。上の行は書いた時点の記録として残す。

## 確かめ（B）
- [x] 案が2つ以上あり、どの案にも悪い点が書いてある
- [x] 反論、悪い結果、見直す条件が空でない
- [x] 確かめたことに、URL かコマンドの出力がある
