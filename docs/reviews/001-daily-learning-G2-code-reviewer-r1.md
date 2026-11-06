PASS

## 指摘

- 要修正、backend/tests/unit/（build.test.mjs:14-39、i18n-files.test.mjs）：契約と ADR が「単体テストで確かめる」と書いている 4 点のテストがない。(1) CSP の文字列が budgets.md の 3 と 1 文字も違わないこと（contracts/budgets.md:34「文字列は上と 1 文字も違わないことを単体テストで比べる」、ADR 0001:42）。(2) 配布物の manifest.webmanifest が budgets.md の 6 の JSON と深く等しい、icon-180.png の先頭 8 バイトと IHDR の 180×180、index.html の `<head>` の 5 行（contracts/budgets.md:98「単体テスト（backend-engineer。G2）」）。(3) 365 行 × 2,000 字の保存データが 1,000,000 字以下（contracts/data.md:132「単体テストで、365 行の見本を作って長さを確かめます」、ADR 0001:42）。(4) 差し込みのある 10 キー（ADR 0001:42。strings.schema の placeholder 検査で一部は代替されるが、`format()` を 10 キーの実物に通すテストがない）。`grep -nE 'Content-Security-Policy|manifest|IHDR|apple-touch-icon|1_000_000|365' tests/unit/*.mjs` は 0 件。私が手で確かめた範囲ではどれも満たしている（CSP は diff で一致、manifest は契約の 7 項目と同じ、PNG は `89504e47…49484452 000000b4 000000b4` で 2,107 バイト、365 行は 789,341 字）ので重大にはしないが、契約が求める自動の確かめを足すこと。直す方向：build.test.mjs に (1)(2) を、validate.test.mjs か rules.test.mjs に (3) を、i18n-files.test.mjs に (4) を足す。
- 提案、docs/adr/0001-web-foundation-no-build-es-modules.md:71：「未確認：backend/ はまだないので…」が古い（作り手と tech-lead も挙げている）。ADR の「確かめたこと」は書いた時点の記録なので、CLAUDE.md が直っていれば判定には数えない。行末に「2026-11-03 に backend/ で確認（CLAUDE.md）」の 1 行を足すと混乱が減る。
- 提案、backend/public/js/main.js:555-560：`./i18n/<lang>.json` か `./data/tasks.json` を取れないと `console.error` だけで `data-state="loading"` のまま止まり、画面に何も出ない。S0 error の変種は契約で 2 つだけ（identifiers.md:21）なので契約違反ではなく AC にもないが、SW のキャッシュが壊れたときなどに利用者が再読み込みの手がかりを持てない。002 以降で検討。
- 提案、backend/scripts/make-icon.mjs:14-15：ビルドにもテストにも使わない 1 回きりの道具だが、verifier のフォルダ（tests/acceptance/node_modules）の Playwright を `createRequire` で借りている。依存の決まり（contracts/dependencies.md「入る package.json」の列）の外側に backend-engineer のスクリプトが乗る形なので、RUNBOOK か実装ノートに「手で 1 回だけ。CI では動かさない」を明記するか、生成物の PNG だけを残してスクリプトを docs/ に移す。
- 提案（範囲外・未追跡）、リポジトリ直下の `.agents/`、`.codex/`、`AGENTS.md`（`git status` で untracked）：差分には入っておらず判定に数えないが、AGENTS.md は CLAUDE.md を `.Codex/` 参照に書き換えた写しで、エージェント向けの指示ファイル。コミットするなら Takuma の判断で（.claude/ と同じ扱い）。

## 証拠

- 対象：3274f8c...60eba11（feat/001-daily-learning）、観点：コード（G2）、機能：001-daily-learning。
- `git diff --name-only 3274f8c...HEAD`（45 件。[x]＝全体を読んだ、[c]＝コマンドで中身を確かめた）：
  - [x] CLAUDE.md　[x] backend/RUNBOOK.md　[x] backend/docs/001-daily-learning.md　[c] backend/package-lock.json（5 件すべて dev）　[x] backend/package.json
  - [x] backend/public/app.css　[c] backend/public/data/tasks.json（126 件、18 組 × 7、重複 0、external は組ごと 0〜1 件、in_app に URL 0、平均 287.1 字、docs/prd の tasks.v1.json と `cmp` で同一）　[c] backend/public/i18n/en.json、ja.json（145 キー、集合一致、app.name は両方「今日の一手」）　[c] backend/public/icon-180.png（PNG 署名、IHDR 180×180、2,107 バイト）　[x] backend/public/index.html
  - [x] js/dates.js　[x] js/dom.js　[x] js/files.js　[x] js/i18n.js　[x] js/main.js　[x] js/rules.js　[x] js/store.js　[x] js/validate.js　[x] js/view-settings.js　[x] js/view-start.js　[x] js/view-task.js　[c] manifest.webmanifest（契約の 7 項目と同じ）　[x] sw.js
  - [x] scripts/build.mjs　[x] scripts/check-budget.mjs　[x] scripts/lib/tasks-check.mjs　[x] scripts/make-icon.mjs
  - [x] backend/tests/acceptance/helpers/app.mjs（verifier。全体と差分）
  - [x] tests/unit/build.test.mjs　[x] dates.test.mjs　[x] helpers.mjs　[x] i18n-files.test.mjs　[x] rules.test.mjs　[x] store.test.mjs　[x] tasks-check.test.mjs　[x] validate.test.mjs
  - [x] contracts/dependencies.md（差分）　[x] docs/adr/features/001-daily-learning.md（差分）　[x] docs/progress.md（差分）　[x] docs/verification/001-daily-learning/test-plan.md（差分）
  - [c] evidence/ac20-after-fix-x5.log、ac20-after-fix.log、ac20-enoent-before-fix.log（ENOENT 2 件の行を確認）、npm-test-after-ac20-fix.log（末尾 `133 passed`、`EXIT=0`）
- 入力として全体を読んだもの：docs/prd/001-daily-learning.md（r7、AC-1〜32）、contracts/data.md、identifiers.md、test-hooks.md、service-worker.md、budgets.md、strings.md、docs/adr/0001〜0005、docs/org/gates.md の G2、docs/templates/review-report.md。design/001-daily-learning.md と tokens.md は該当箇所（nav、S2/S4/S8、focus の幅）だけ grep で参照。

### AC 対応表（実装の場所、テスト、自分で動かした結果）
受け入れテストはすべて `cd backend && npm ci && npm test` で私が動かし、chromium 67 本（BUDGET2 を含む）+ webkit 66 本（AC-15 は Chromium だけ）= 133 passed、終了コード 0。

| AC | 実装（ファイル:行） | テスト（受け入れ＝名前の接頭辞と本数 / 単体） | 結果 |
|---|---|---|---|
| AC-1、2 | view-start.js:119-221、main.js:179-268、rules.js:93-117 | AC1 ×1、AC2 ×3 / rules.test「診断：1 問目で firstOpenDate…」 | 合格 |
| AC-3、4、29 | data/tasks.json、scripts/lib/tasks-check.mjs:15-85、build.mjs:82-86 | AC3、AC4、AC29 各 ×1、BUDGET2 ×1 / tasks-check.test | 合格。自分の集計も上の [c] のとおり |
| AC-5、6、7、9 | rules.js:36-45（pickTask）、73-91（startOfDay）、132-153（reportTask、rateTask）、main.js:325-389 | AC5 ×1、AC6 ×1、AC7 ×3、AC9 ×4 / rules.test（pickTask、完了の申告は…） | 合格 |
| AC-8 | rules.js:52-71（applyLevelRule） | AC8 ×10 / rules.test 9 通り + 契約の seed 3 件 + 翌日から効く | 合格。seed 1 通り目で自分でも `{"backend":"beginner"}` を確認 |
| AC-10、30 | rules.js:86-87、view-task.js:23-33、158-179、main.js:391-395 | AC10 ×1、AC30 ×2 / rules.test「課題を出し尽くすと…」 | 合格。移した行と exhausted の組み合わせも自分で実行（changed=true、current なし、検査 0 件） |
| AC-11 | main.js:72-79（commit）、247-256、view-start.js:213-215、store.js:21-28 | AC11 ×1 / store.test「save は 1 回の setItem…」 | 合格 |
| AC-12、23 | sw.js 全体、main.js:529-542 | AC12 ×2、AC23 ×2 / build.test（FILES 一致） | 合格 |
| AC-13 | main.js:341-358、view-settings.js:42 | AC13 ×1 | 合格 |
| AC-14、16 | rules.js:119-124、main.js:270-280、451-468、store.js:30-37 | AC14 ×2、AC16 ×1 / store.test removeAll | 合格。同日のやり直しで current が保たれ翌日に新領域の課題が出ることを自分でも実行 |
| AC-15 | index.html:14-27、main.js:116-119 | AC15 ×1（chromium） | 合格 |
| AC-17、18、27 | app.css:106、192-196、282-285、view-* | AC17 ×4、AC18 ×1、AC27 ×6 | 合格 |
| AC-19、20、25 | files.js、rules.js:161-172、validate.js:150-164、main.js:402-449、479-483 | AC19、AC20、AC25 各 ×1 / validate.test、i18n-files.test（読み込み） | 合格 |
| AC-21、22 | main.js:50-58、179-201、470-508、view-start.js:76-147 | AC21 ×3、AC22 ×1 | 合格 |
| AC-24 | rules.js:174-189、view-settings.js:144-173、main.js:510-518 | AC24 ×1 / rules.test 統計、直近 7 暦日 | 合格 |
| AC-26 | i18n.js:3-5、i18n/*.json | AC26 ×2 / i18n-files.test | 合格 |
| AC-28 | sw.js:7-21、build.mjs:105-111 | AC28 ×1 / build.test | 合格 |
| AC-31、32 | main.js:140-153、282-323、rules.js:76-82、126-130 | AC31 ×2、AC32 ×3 / rules.test「日付が変わると…」 | 合格 |

範囲外の変更：なし。差分の全ファイルが AC、ADR 0001 の「作る物」、G2 の合格条件（実装ノート、RUNBOOK）、tech-lead の文書、verifier の証拠のどれかに紐づく。

### 指示書の「見てほしい点」への答え
1. AC ごとの実装：上の表。テストに合わせただけの分岐、テスト専用の道はない（`git grep -nE '2026-1[01]-|seed-|ANSWER_50|127\.0\.0\.1|test-results' -- public/ scripts/` は tasks.json の ID と build.mjs のエラー文の例だけ。テスト中だけ答えを変える分岐の grep は 0 件）。
2. 保存の決まり：起動の順番は main.js:124-153 が data.md 4 の 1〜6 と同じ順（枠 → 使えない → 読めない → 途中 → なし → あり）。壊れたデータは store.js:16-17 で raw のまま返し消さない（store.test で `calls=['getItem']` を確認）。1 回の保存＝1 回の setItem（store.js:23）。起動時の保存は route() の 1 回だけ（rules.startOfDay が 6-1 の移しと 6-4 の発行を 1 つの data にまとめ、`changed` で 1 回）。formatVersion は validate.js:118、158。firstOpenDate は rules.js:103 で「なし」の 1 問目だけ（rules.test で 2 問目以降と答え直しで変わらないことを確認）。段階の規則は rules.js:54-69 で none を飛ばし（連続を切らない）、`level !== now` で止める（9 通り目）。
3. 日付：dates.js は get* から組み立て、`toISOString` は public/ に 0 件（grep）。境目は main.js:60-70 の act() が操作ごとに今日を計算し直し、答えを flush してから decide() に戻す（data.md 4「画面を開いたまま日付が変わったとき」）。
4. SW：cache-first（sw.js:40-45、ignoreSearch あり）、navigate は index.html（30-38）、`cache: 'reload'`（10）、skipWaiting（8）、claim（19）、`kyounoitte-` の古いキャッシュだけ削除（18）、時刻は使わない。Trusted Types のポリシーは main.js:16-24 でモジュールのトップレベルに 1 回だけ。登録は最初の描画後の load の後（529-542）。
5. セキュリティ：CSP は index.html:5 と budgets.md:32 を diff して一致、meta は 1 つ。`innerHTML|outerHTML|insertAdjacentHTML|document.write|eval(|new Function|toISOString|import(` は public/ で 0 件。インラインの style/script/イベント属性 0 件、`<script>` は main.js の 1 つ。文字は dom.js の textContent/createTextNode だけ。読み込むファイルは files.js:20（5,000,000 バイト）→ validate.js の許可リスト検査（知らない項目を拒む。`__proto__` も Object.keys に出るので拒まれ、validate.test で Object.prototype が汚れないことを確認）→ 「なし」を拒む（files.js:29）。localStorage に触るのは main.js:125 の 1 か所、キーは store.js:4 の 1 つ。枠の中では始めない（main.js:551）。fetch は同じ origin の 2 ファイルと SW の取り損ねだけ。秘密情報：`git log -p 3274f8c..HEAD` の正規表現 grep 0 件、`.env` 0 件。
6. 予算と禁止事項：Safari 17.0 にない機能（import attributes、Promise.withResolvers、Object.groupBy、checkVisibility、light-dark、@starting-style、text-wrap: balance、URL.parse、closedby、Iterator helpers）は grep 0 件。CSS の入れ子なし（`@media` の中の平らなセレクタだけ）。動的 import 0 件。JS は public/js 11 + sw.js = 12（build.mjs:124-125 でも 15 を上限に検査）。`/` で始まる URL 0 件。gzip 合計 62,962 / 150,000（内訳：殻 24,086、文言 6,510、アイコンと manifest 2,173、課題集 30,193。作り手の 62,960 との差 2 バイトは版の文字列）。
7. 単体テスト：85/85。意味のある確かめになっている（ajv との突き合わせ、9 通り、TZ を変えた子プロセス、規則の関数が入力を書き換えない、失敗時の前のデータ保持）。足りない 4 点は要修正に書いた。build.mjs：`--version dev` で終了コード 1、出力フォルダは作られない。check-budget.mjs：200,000 バイトのランダムなファイルで `NG` と終了コード 1。
8. verifier の helpers/app.mjs：差分は `exportJson` の中だけ。`download.path()` の一時ファイルを `download.saveAs` で test-results の中に byte 複製して返す形で、中身の書き直しはない。spec（ac19-ac20-ac25-export-import.spec.mjs）と expect は変わっておらず（weaken-3 の出力は `+` 158 行、`-` 0 行）、AC-20 の Then（診断・段階・履歴 3 件・answer の一致、`task.done`）はそのまま。弱めていない。1398191（backend-engineer）は tests/acceptance、.claude、.github に触れていない（`git show --stat` が空）。
9. 未解決：gitleaks → 私の正規表現 grep で 0 件（提案：CI に gitleaks を入れる）。Linux の WebKit と Pages の workflow → .github は Takuma の範囲で、コードの欠陥ではない。ただし docs/org/gates.md:54「その変更の領域の CI…が緑。app.json の commands のうち、その領域のものが空でない」は、backend_test が空でワークフローもない現状では満たされていない。これはコードの観点の判定とは別の関門の条件なので、指揮役が Takuma の D8 で解いてから G2 を閉じること（要確認）。ADR 0001:71 → 提案。MPL-2.0 → 反論なし。axe-core は改変せずテストだけで使い配布物に入らない（確かめ方 2 と 3 がどちらも 0 行）ので、MPL-2.0 の義務（改変した Covered Software の配布時の公開）は生じない読み。いちばん強い反論は「将来 axe-core を本番に入れるか改変したときに義務が出る」だが、許可リストの文（「テストだけで使い、配らない」）と確かめ方 2・3 がそれを止める。BASE の時点で直接の依存の表にすでに MPL-2.0 として載っていた行（dependencies.md:19）でもある。法律の最終判断は私の役の外なので、確定は Takuma。

### テストを弱める変更の確認（コマンドと出力）
- `git diff --name-only 3274f8c...HEAD | grep -E '(AcceptanceTests|tests/acceptance)/|^\.claude/|^\.github/|\.xctestplan$|\.xcscheme$|\.pbxproj$|conftest\.py$|pytest\.ini$|pyproject\.toml$'` → `backend/tests/acceptance/helpers/app.mjs`（verifier の a7fc7e9。全体を読み、上の 8 のとおり弱めていない）
- `git diff -U0 3274f8c...HEAD | grep -E '^\+.*(XCTSkip|\.disabled\(|withKnownIssue|XCTExpectFailure|pytest\.(mark\.)?skip|skipif|xfail|unittest\.skip|test\.skip|\.skip\(|\.fixme\()'` → 0 件
- `git diff -U0 3274f8c...HEAD -- '*Tests*' '*tests*' | grep -iE '^[-+][^-+].*(assert|#expect|#require|expect\()' | cut -c1 | sort | uniq -c` → `158 +`（`-` は 0）
- `git diff -U0 3274f8c...HEAD -- ios backend ':!*Tests*' ':!*tests*' | grep -E '^\+.*(XCTestConfigurationFilePath|UITest|isRunningTests|PYTEST_CURRENT_TEST|#if DEBUG|NODE_ENV|process\.env)'` → 0 件
- test-hooks.md「本番に入っていないことの確かめ」：`grep -rnE "__test|[?&](reset|now|seed)=|location\.(search|hash)|URLSearchParams|window\.__|testHook" backend/public` → 0 件

### 依存
- backend/package-lock.json（新規）：ajv 8.20.0 MIT、fast-deep-equal 3.1.3 MIT、fast-uri 3.1.9 BSD-3-Clause、json-schema-traverse 1.0.0 MIT、require-from-string 2.0.2 MIT。すべて `dev`。contracts/dependencies.md の直接の表と推移的な表に全件ある。`npm ci` → `added 5 packages… found 0 vulnerabilities`（受け入れテストのフォルダも `added 10 packages… found 0 vulnerabilities`）。
- 開いた URL（2026-11-03）：https://github.com/advisories/GHSA-2g4f-4pwh-qvx6（ajv ReDoS。「Affected: >= 7.0.0-alpha.0, < 8.18.0」「Patched: 8.18.0」→ 8.20.0 は対象外）、https://github.com/advisories/GHSA-v88g-cgmw-v5xw（ajv Prototype Pollution。「< 6.12.3」→ 対象外）、https://github.com/advisories/GHSA-w74x-v6f9-j3xg 、https://github.com/advisories/GHSA-wjr9-j795-jxcr 、https://github.com/advisories/GHSA-xhq7-xmqj-769h 、https://github.com/advisories/GHSA-333x-w4r6-6crp（fast-uri、2026-10-23 公開の 4 件。いずれも「Patched versions: 2.4.8, 3.1.9, 4.2.3」→ 3.1.9 は修正版）。https://osv.dev/list?ecosystem=npm&q=ajv（同じ 2 件と、別名パッケージ ajv-8.11.0 の MAL-2024-1739 で、本件の ajv ではない）。
- 配布物：`find dist -name node_modules -o -name 'package*.json'` 0 行、`grep -rhoE "(import|from) +['\"][^'\"]+['\"]" dist/js dist/sw.js | grep -vE "['\"]\.\.?/"` 0 行。

### 実行したコマンドと結果（要約）
- `cd backend && npm ci && npm test`（node v24.22.1、npm 12.2.1、macOS）→ 契約の検査「見本 41 件、期待と違う結果 0 件」、単体 `tests 85 / pass 85 / fail 0 / skipped 0`、受け入れ `133 passed (43.7s)`、`EXIT=0`。ログ：/private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/npm-test.log
- `node scripts/build.mjs --out <scratchpad>/dist --version 2026-11-03.9` → 「19 ファイル」、終了コード 0。`--version dev` → 終了コード 1、フォルダなし。
- `node scripts/check-budget.mjs <scratchpad>/dist` → 合計 62,962 / 150,000、OK、終了コード 0。ランダム 200,000 バイトのフォルダ → NG、終了コード 1。
- CSP の diff（一致）、grep 一式、tasks.json と i18n と lockfile の集計、rules.js の境界ケース（移し + exhausted、同日やり直し + 翌日、365 行の長さ 789,341）は node で実行。
- `git status --short` は実行の前後で `.agents/ .codex/ AGENTS.md`（未追跡、BASE 以前からの手元のファイル）だけで、リポジトリのファイルは書いていない。

### 未検証
なし（コードの観点で必要な確認はすべて手元で実行した。CI での backend テストは存在しないため動かせていないが、これは上の 9 のとおり関門の条件として指揮役に上げるもので、コードの判定の未検証には数えない）。
