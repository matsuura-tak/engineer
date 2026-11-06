PASS

## 指摘
- 提案（要確認。tech-lead）、contracts/data.md:132「1 年（365 行）すべてに 2,000 字の答えがあっても、保存データの文字列は 1,000,000 字以下になります」：答えの文字が JSON で 1 字のまま（日本語や英字）なら成り立つが、`"` や改行ばかりなら 2 字、制御文字なら `\u0001` の 6 字になるため成り立たない。自分で計算：「あ」× 2,000 → 791,179 字、`"` × 2,000 → 1,523,179 字、U+0001 × 2,000 → 4,451,179 字（検査はどれも通る）。実装の欠陥ではなく契約の文の前提（「1 行の答え以外の部分は約 150 字」＝文字が 1 字のままという想定）の書き方の問題。容量超えは data.md の 2 の「保存に失敗したら」で扱われ（store.js:21-28 は例外を false で返し、前のデータを残す）、AC にもない。G2 は止めない。直す方向：tech-lead が data.md:132 に「JSON のエスケープで増える分は含まない」か「最悪の場合でも約 4.5M 字で、localStorage の約 5 MB（UTF-16 単位）に収まる見込み。超えたら 2 の扱い」を追記する。
- 提案（既存。r1 と同じ）、リポジトリ直下の `.agents/`、`.codex/`、`AGENTS.md` は未追跡のまま（`git status --short`）。差分には入っておらず判定に数えない。

## 前回の指摘の追跡（r2）
| 前回の指摘 | 直った / 直っていない | 証拠 |
|---|---|---|
| 要修正 (1) CSP の文字列が budgets.md の 3 と 1 文字も違わないことの単体テスト（budgets.md:34、ADR 0001:42） | 直った | build.test.mjs:125-135「CSP：index.html の meta は 1 つだけで…」。helpers.mjs:66-86 `contractCodeBlocks('budgets.md', 3)` が contracts/budgets.md の「## 3.」節のコードブロックをそのつど読む（文字列の写しなし）。meta の数（grep -c 相当）と `<head>` 内の content を `assert.equal` で比較。写しを壊すと落ちる：配布物の 1 文字、meta × 2、契約側に空白 1 つ → いずれも exit=1 でこのテストが落ちた（下のコマンド） |
| 要修正 (2) manifest が budgets.md の 6 の JSON と深く等しい、icon-180.png の署名と IHDR 180×180 と 10,000 バイト以下、`<head>` の 5 行（budgets.md:98） | 直った | build.test.mjs:137-144（manifest。契約の json ブロックを JSON.parse して `deepStrictEqual`、7 項目）、146-153（アイコン。先頭 8 バイト、IHDR、幅・高さ、バイト数）、155-166（`<head>`。契約の html ブロック 5 行がビルド後の `<head>` に 1 行ずつちょうど 1 回）。壊すと落ちる：manifest に theme_color、契約側の sizes 192x192、PNG 幅 181、署名 2 バイト目、apple-touch-icon の行を消す、manifest の行を `<body>` へ移す → いずれも exit=1 |
| 要修正 (3) 365 行 × 2,000 字が 1,000,000 字以下（data.md:132、ADR 0001:42） | 直った | validate.test.mjs:96-137。365 通りの日付、current にも 2,000 字、`text.length <= 1_000_000`、`validateData` と ajv の両方を通す、`save()` が 1 回の setItem で保存長が一致。自分の計算でも 791,179 字。壊すと落ちる：store.js の保存を整形 JSON に → exit=1 |
| 要修正 (4) 差し込みの 10 キーを `format()` の実物に通すテスト（ADR 0001:42、strings.md の 3） | 直った | i18n-files.test.mjs:74-125。テストのキー 10 個は strings.md:26-35 の表と集合一致（自分で抽出して diff → 同一）。「`{`/`}` を含むキーは ja と en とも 10 個だけ」（strings.md:10）、ja と en の実物で全差し込みが埋まり `{}` が残らず値が入る、en の plural が one/other で形を変える。壊すと落ちる：en の `{version}`→`{ver}`、ja の `{minutes}` を消す、i18n.js の `#` 置換を消す、app.name に `{x}` → いずれも exit=1 |
| 提案 make-icon.mjs の扱いを明記 | 直った | backend/RUNBOOK.md:17-22「アイコンを作り直すとき」（手で 1 回だけ、build と npm test と CI では動かさない、配布物に入らない）、backend/docs/001-daily-learning.md:63。RUNBOOK の記述を確認：build.mjs:92 は `cpSync(PUBLIC_DIR, …)` で public/ だけを写す、dependencies.md:11,18 は Playwright を受け入れテストのフォルダだけに置く、`node --test tests/unit/build.test.mjs` は 9/9 で動く |
| 提案 ADR 0001:71 の古い「未確認」 | 直っていない（判定に数えない。r1 でも「判定には数えない」と書いた tech-lead の範囲） | 差分に docs/adr/ はない |
| 提案 main.js:555-560 の読み込み失敗時の表示 | 直っていない（r1 で「002 以降で検討」とした提案。判定に数えない） | 差分に public/ はない |

## 証拠
- 対象：dfc9eb4...7660d5f（feat/001-daily-learning、1 コミット 7660d5f、backend-engineer）、観点：コード（G2 r2）、機能：001-daily-learning。
- `git diff --name-only dfc9eb4...7660d5f`（6 件。[x]＝差分と HEAD の全体を読んだ）：
  - [x] backend/RUNBOOK.md
  - [x] backend/docs/001-daily-learning.md
  - [x] backend/tests/unit/build.test.mjs（HEAD 全 166 行）
  - [x] backend/tests/unit/helpers.mjs（HEAD 全 86 行）
  - [x] backend/tests/unit/i18n-files.test.mjs（HEAD 全 125 行）
  - [x] backend/tests/unit/validate.test.mjs（HEAD 全 137 行）
- 読んだ入力：docs/reviews/001-daily-learning-G2-code-reviewer-r1.md、contracts/budgets.md（全体）、contracts/data.md の 10、contracts/strings.md の 1〜6、docs/adr/0001 の 30-76 行、docs/templates/review-report.md。テストが触る本番側：backend/public/index.html、manifest.webmanifest、js/store.js、js/i18n.js、scripts/build.mjs（該当行）、scripts/make-icon.mjs（該当行）、contracts/dependencies.md（該当行）。
- 差分の中にエージェント向けの指示のような文：なし（「tech-lead に確かめる」は作り手の未解決の記録で、判定を変える指示ではない）。
- 範囲外の変更：なし。6 件はすべて r1 の要修正・提案への対応（テスト 4 ファイル、RUNBOOK、実装ノート）。public/、scripts/、contracts/、.claude/、.github/、tests/acceptance/ は変わっていない（`git diff --stat dfc9eb4...7660d5f -- backend/public backend/scripts contracts .claude .github` → 空）。

### 見てほしい点への答え
1. 要修正 4 点はそれぞれ契約の求めるとおりに自動で確かめられている（上の追跡表）。契約から読んでいるのは (1) と (2) の manifest と `<head>`（`contractCodeBlocks` が budgets.md の節をそのつど読む。契約側を壊しても落ちることを確認）。(2) のアイコンと (3) の 1,000,000 と (4) のキー名は契約の数値・名前をテストに写している（契約が数値や表で書いているので妥当。キー名は表と集合一致を自分で確認）。壊すと落ちることは写しで 14 通り確かめた（下）。
2. テストを弱める変更：なし。消えた行は import の書き換え 3 行だけで、アサーションの削除 0（`-` 0、`+` 35）。skip/only/fixme 0 件。受け入れテスト、.claude/、.github/、テスト設定の変更 0 件。本番コードにテスト中だけ答えを変える分岐の追加 0 件（public/ に差分なし）。テストの入力値（`2026-11-03.1`、`2026-11-04`、`backend-intermediate-008`、`1_000_000` など）は本番コードに出ない。
3. 未解決の長さの件：G2 を止めるものではない（上の提案。契約の文の前提の書き方の問題で、実装の挙動は data.md の 2 のとおり保存失敗として扱われ前のデータが残る。AC にない）。tech-lead の契約の文の見直しを「要確認」として指揮役に上げる。

### テストを弱める変更の確認（コマンドと出力）
- `git diff --name-only dfc9eb4...7660d5f | grep -E '(AcceptanceTests|tests/acceptance)/|^\.claude/|^\.github/|\.xctestplan$|\.xcscheme$|\.pbxproj$|conftest\.py$|pytest\.ini$|pyproject\.toml$'` → 0 件（exit=1）
- `git diff -U0 dfc9eb4...7660d5f | grep -E '^\+.*(XCTSkip|\.disabled\(|withKnownIssue|XCTExpectFailure|pytest\.(mark\.)?skip|skipif|xfail|unittest\.skip|test\.skip|\.skip\(|\.fixme\(|\.only\(|\.todo\()'` → 0 件
- `git diff -U0 dfc9eb4...7660d5f -- '*Tests*' '*tests*' | grep -iE '^[-+][^-+].*(assert|#expect|#require|expect\()' | cut -c1 | sort | uniq -c` → `35 +`（`-` は 0）
- `git diff -U0 dfc9eb4...7660d5f -- '*tests*' | grep -E '^-[^-]'` → import 3 行だけ（`import { test } from 'node:test'`、`import { BACKEND_DIR } from './helpers.mjs'`、`import { ajvValidator, walk, FIXTURES_DIR, readJsonFile } from './helpers.mjs'`。いずれも同じ行で名前を足した置き換え）
- `git diff -U0 dfc9eb4...7660d5f -- ios backend ':!*Tests*' ':!*tests*' | grep -E '^\+.*(XCTestConfigurationFilePath|UITest|isRunningTests|PYTEST_CURRENT_TEST|#if DEBUG|NODE_ENV|process\.env)'` → 0 件
- `git grep -nE '2026-11-03\.1|2026-11-04|2025-10-30|backend-intermediate-008|791|1_000_000' -- backend/public backend/scripts` → 0 件
- 秘密情報：`git log -p dfc9eb4..7660d5f | grep -inE 'sk-[a-z0-9_-]{16,}|…|(api[_-]?key|secret|password)[" ]*[:=]'` → 0 件
- 件数の突き合わせ：`test(` の数は build 5→9、i18n-files 7→10（+ `for` の 2 言語分 = 実行時 11）、validate 7→8 → 合計 +9。BASE の 85（r1）+ 9 = 94 で、自分の実行の 94 と一致。作り手の「9 本」「94/94」と一致。

### 実行したコマンドと結果（node v24.22.1、macOS、2026-11-03）
- `cd backend && node --test 'tests/unit/**/*.test.mjs'`（HEAD 7660d5f）→ `tests 94 / pass 94 / fail 0 / skipped 0`
- `cd backend && npm ci && npm test` → 契約の検査「見本 41 件、期待と違う結果 0 件」、単体 `tests 94 / pass 94 / fail 0 / skipped 0`、受け入れ `133 passed (39.7s)`、`EXIT=0`。ログ：/private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/r2/npm-test.log
- `npm run check:contracts` → 見本 41 件、期待と違う結果 0 件。`node --test tests/unit/build.test.mjs`（RUNBOOK の手順）→ 9/9。
- 壊して確かめ（backend/、contracts/、docs/prd/ をスクラッチパッド /private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/r2/repo/ に写し、1 か所ずつ壊して該当のテストファイルを流し、元に戻す。壊さない写しは 94/94。終わった後 `diff -rq` で写しの public/ と budgets.md がリポジトリと同一）。スクリプト：同フォルダの break.sh。結果はすべて exit=1 で狙ったテストが落ちた：
  - CSP の 1 文字（`kyounoitte-sw`→`-sW`）、CSP の meta × 2、契約側の CSP に空白 1 つ → 「CSP：…1 文字も違わない」
  - manifest に theme_color、契約側の sizes を 192x192 → 「manifest：…深く等しい」
  - PNG の幅 181、署名 2 バイト目 → 「アイコン：…」
  - apple-touch-icon の行を消す、manifest の行を `<body>` へ移す → 「<head>：…5 行」
  - store.js の保存を `JSON.stringify(data, null, 2)` → 「365 行 × 答え 2,000 字…」
  - en の `{version}`→`{ver}`、ja の `{minutes}` を消す → 「差し込みの 10 キーを en/ja.json の実物で…」（strings.schema の AC-26 テストも落ちる）
  - i18n.js の `#` 置換を消す → 「en の plural…」（既存の format テストも落ちる）
  - ja の app.name に `{x}` → 「差し込みのあるキーは…10 個だけ」
- 365 行の長さ（自分の計算、validate.js と dates.js を写しから import）：「あ」791,179、`a` 791,179、`"` 1,523,179、改行 1,523,179、U+0001 4,451,179。いずれも `validateData` の誤り 0。
- strings.md:26-35 の表のキーと i18n-files.test.mjs の `PLACEHOLDER_KEYS` のキーを抽出して `diff` → 同一（10 件）。
- `git status --short` は実行の前後とも `.agents/ .codex/ AGENTS.md`（未追跡、BASE 以前からの手元のファイル）だけ。リポジトリのファイルは書いていない。

### 開いた URL と確認した日付
- なし（コードの観点。規則はリポジトリ内の contracts/、docs/adr/ を開いて引用した。外部の規則の引用は不要）。

### 未検証
- なし。
