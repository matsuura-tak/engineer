PASS

## 指摘
- 要修正、backend/public/js/main.js:320-325（cancelRedo）と :497-507（showSettings）：やり直しの S2 で「やめる」（origin が settings）を押すと `app.draft = null` にしてから `showSettings()` が `persisted()` を待つ。待つ間は S2 がそのまま表示されて操作できるので、その間に「次へ」を押すと onAnswer（:269）の `app.draft.area` で `TypeError: Cannot read properties of null (reading 'area')` が未処理のまま出る（自分で再現：`persisted()` を 1.5 秒遅らせる stub で「やめる」→「次へ」。pageerror に TypeError 1 件、最終の data-state は settings、保存データは変わらない）。実機の Chromium / WebKit では persisted() が 61 / 70 ms で返る（自分の実測）ので人が踏む幅は小さく、データも壊れないため G2 は止めない。BASE では showSettings が同期だったので、この差分で新しく生まれた経路。根拠：contracts/data.md 11「待つ間に別の操作で画面が移ったら、遅れて S8 を描きません」は画面の移りだけを決めており、待つ間の S2 の操作の扱いは未定義。直す方向：`cancelRedo` で下書きを捨てるのを render に任せる（render が `state !== 'diagnosis.question'` で捨てる）か、onAnswer の redo 分岐で `app.draft` が null なら何もしない。
- 提案（verifier）、backend/tests/acceptance/tests/design-d30-day-changed.spec.mjs:62-66：「次の操作の始めに消える」の確かめが `app.name`（4 の判定をやり直して再描画する操作）なので、act() の `clearNotice()` を消しても 4 本とも通る（自分の変異で確認。再描画が知らせを外すため）。契約 identifiers.md 3「次の操作（…）の始めに DOM から外します」を実装の経路（act の clearNotice）まで確かめるなら、再描画しない操作（申告の保存を失敗させて S3 に留まる、`error.storage.retry`）で 0 件を見る 1 本が要る。弱めてはいないので判定に数えない。
- 提案（verifier）、backend/tests/acceptance/tests/ac17-ac18-ac27-a11y.spec.mjs:151-152：AC27 の 7 本目 `task.today.dayChanged` は PRD AC-27 の「6 つの画面」の外（verifier 自身の未解決）。design-d30 と同じく `DESIGN_D30_` にすると、知らせの変種だけが落ちたときに AC-27 を FAIL にしないで済む。内容は妥当（serious 以上 0 件を自分の実行で確認）。
- 提案（tech-lead に質問）、contracts/data.md 11 と main.js:503：`persisted()` が返らないと S8（書き出しの入口）に着けない。契約に待つ上限がなく実装も置いていない（作り手の未解決 1）。実測は 61 / 70 ms なので v1 を止めないが、契約で「N ms で返らなければ注意なしで描く」などの逃げ道を決めるかは tech-lead の判断。
- 提案（tech-lead に質問）、contracts/data.md 11「その保存が失敗しても persist() は呼びます」と main.js:278-288、:302-312：起動時の 6-4（route）は保存に失敗しても S3 を描いて persist() を呼ぶが、初回とやり直しの診断を終える保存（commit）は失敗すると S2 に留まり、再試行が成功して S3 を描いた後に呼ぶ。結果はどちらも 1 回で、同じ文の「S3 を描いた後に 1 回」とは整合する。契約の文をどちらに読むかを tech-lead が決めれば足りる。
- 提案、main.js:192-196 と :484：`app.persistAsked` はメモリの印（作り手の未解決 4）。別のタブで削除→新しい診断を途中まで進め、このタブで引き継いで終えると、印 `persistRequested: true` は保存されるが persist() はこの文書では呼ばれない。永続化は origin 単位で、この文書はもう 1 回呼んでいるので実害はない。
- 提案（tech-lead）、contracts/budgets.md 1：殻の残りが 205 バイト（自分のビルドで 25,795 / 26,000）。次の文言や処理の追加で必ず枠を超えるので、枠の見直しか削る対象を先に決めておく。
- 提案（既存）、main.js:69 と :142：act() が today() を比べてから render() が `app.day = today()` を書くまでの間に日付が変われば、古いデータの画面に新しい日付が付き、次の操作では日付の変わり目を見逃す（次に route を通る操作で正しく移る）。BASE の `act()` も同じ構造で、幅はマイクロ秒。判定に数えない。
- 提案（既存。r1、r2 と同じ）：リポジトリ直下の `.agents/`、`.codex/`、`AGENTS.md` は未追跡のまま。差分に入っておらず判定に数えない。

未解決への答え（指示書の 2）：どれも G2 を止めない。(作り手 1) 上の提案。(作り手 2) `task.dayChanged` を `<main>` の最初の子に置くのは identifiers.md 3「文書順で、<main> の中の他のどの data-testid の要素よりも前」に合う。自分の実行で `task.today.label` より前と activeElement を確認。(作り手 3) 上の提案。(作り手 4) 上の提案。(verifier の AC-27) 上の提案。(verifier の AC-13 の隙) 実装は route():187-188 で showDay の直後に同期で askPersist() を呼ぶので、S8 まで進んでから読む形で漏れない。(verifier の readStoredData) test-hooks.md W-9「確かめるのは、上の回数、保存データの印、S8 の表示」が印の確かめを求めており、localStorage を読む以外に手段がない。(tech-lead) 読み直しで「読めない」→ S0 error は data.md 4 の手順 2 の文のとおりで、別のタブが壊れた値を書いたときだけ。

## 証拠
- 対象：e13d68f...1990cad（feat/001-daily-learning、10 コミット）、観点：コード（G2 r3）、機能：001-daily-learning。
- `git diff --name-only e13d68f...1990cad` は 293 件。読んだ印（[x]＝差分と HEAD の全体を読んだ）：
  - [x] CLAUDE.md、backend/RUNBOOK.md、backend/docs/001-daily-learning.md
  - [x] backend/public/app.css、i18n/en.json、i18n/ja.json、index.html、js/main.js（HEAD 全 621 行）、js/persist.js（新規 18 行）、js/rules.js（全 217 行）、js/view-task.js（全 201 行）。呼び出し元として js/view-start.js の errorSlots（27-39 行）
  - [x] backend/tests/acceptance/README.md、helpers/seed.mjs、tests/ac11-ac13-storage.spec.mjs、ac17-ac18-ac27-a11y.spec.mjs、ac31-ac32-zero-ops-answer.spec.mjs、design-d30-day-changed.spec.mjs（新規）、tools/keyboard-tour.mjs（新規。`--list` で playwright test の対象外を確認）、tools/screenshots.mjs（新規、同上）
  - [x] backend/tests/unit/day-persist.test.mjs（新規 215 行）、i18n-files.test.mjs
  - [x] contracts/README.md、budgets.md、data.md、identifiers.md、strings.md、test-hooks.md、schemas/data.schema.json、schemas/strings.schema.json、fixtures/strings/*.json（8 件）
  - [x] design/001-daily-learning.md、001-daily-learning/screens.md、tokens.md、001-daily-learning-research.md
  - [x] docs/adr/0002-storage-localstorage-single-key.md、docs/adr/features/001-daily-learning.md、docs/approvals/delegation.md、docs/progress.md、docs/verification/001-daily-learning/test-plan.md
  - [x] docs/reviews/001-daily-learning-G3-design-reviewer-r1.md（指摘 1〜5 の本文）、G3-verifier-r1.md（冒頭）、docs/verification/001-daily-learning/verification.md（冒頭）、docs/reviews/001-daily-learning-G2-code-reviewer-r2.md（前回の判定）
  - [x] evidence のテキスト（r6-red.log、g3-full-run.log、g3-repeat5.log、keyboard-tour-*.log、screenshots-run.log、exploration/R1〜R5.log、index.tsv、axe-summary.tsv、axe/*.json、g3-*.json）：冒頭と末尾を読み、全件を grep でエージェント向けの指示のような文（ignore/disregard/PASS にして など）を探して 0 件
  - 対象外として中身を見ていないもの：evidence の PNG 138 枚（`file` で全部が PNG 画像であることだけ確認。e13d68f 時点の G3 の証拠で、design-reviewer の対象）
- 差分の中にエージェント向けの指示のような文：なし。
- 範囲外の変更：なし。app.css の 3 点（負の margin、`.btn` の幅、`textarea.is-error`）と view-task.js の syncAnswerError は AC ではなく design-reviewer G3 r1 の指摘 4〜6（指示書の範囲）。design/、docs/、evidence は G3 の直しの記録。

### AC 対応表（自分で動かした結果。写し /private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/copy、node v24.22.1、Playwright 1.64.1、2026-11-04）
| AC / 状態 | 実装の場所 | テスト | 結果 |
|---|---|---|---|
| AC-13（persist 1 回、印、S8 の注意） | rules.js:107-118 markPersist / planDay、main.js:176-196 route / askPersist、:278-312、persist.js、main.js:497-507 showSettings | AC13_persistを断られても…（1 本 × 2）、単体 day-persist 8 本 | passed。変異（印を無視）で「翌日の S3 の後の persist() の回数 Expected 0 Received 1」で落ちる |
| AC-26（146 キー） | i18n/ja.json:55、en.json:55、strings.schema.json | AC26 × 2、単体 i18n-files | passed。契約の検査 41 件 OK |
| AC-27（7 画面） | view-task.js:13-15 dayChangedNotice | AC27_<state> × 7 × 2 | passed（serious 以上 0） |
| AC-32（開いたまま翌日） | main.js:65-94 act / dayChanged、rules.js:99-104 carryAnswer、:114-119 planDay | AC32 × 4 × 2、単体「日付の変わり目」3 本 | passed。変異（carryAnswer を無効）で単体 2 本が落ちる |
| design D-30（知らせ、フォーカス、位置、消える時機） | main.js:131-153 render の lead、:77-80 clearNotice | DESIGN_D30 × 3 × 2 | passed。変異（lead.focus を消す）で 3 本が activeElement null で落ちる。変異（clearNotice を消す）では落ちない（上の提案） |
| design U-15（なし・途中・error では確かめない） | rules.js:20-22 checksDay、main.js:143 | DESIGN_U15 × 2、単体 U-15 2 本 | passed。変異（state を無視）で単体 1 本、変異（checkDay を無視）で DESIGN_U15 が `data-question-index` Expected 3 Received 2 で落ちる |
| design-reviewer G3 r1 の 4〜6 | app.css:144、:276-278、:306-309、:445-448、:522、:585-587、view-task.js:52-62 | 受け入れテストなし（設計の判定の対象）。自分の Playwright の実測（下） | 幅 390：`task.done.history` の文字の左端 16 = 列の左端 16（Chromium / WebKit とも）。`error.storage.retry` の幅 358 = 親の幅 358。答えの保存の失敗中の textarea：`2px rgb(180, 35, 24)`、aria-describedby `task-answer-help task-answer-error`、`#task-answer-error` は `error.storage.message`、aria-invalid なし。再試行で保存できた後：`1px rgb(107, 107, 107)`、`task-answer-help` に戻る |

契約との突き合わせ（data.md 4 の手順 1〜4）：1 タイマー停止と欄の値の保持、欄を捨てる（main.js:83-90。`app.answer = null` の後に render の flushAnswer が走るので前日の答えは新しい current に入らない）。2 getItem で読み直す（decide:155-169 → openStore）、date と taskId が同じときだけ置き換え（carryAnswer）、別のタブが移していれば使わない、6-1 と 6-4 と答えを 1 回の setItem（route:182-185。単体「別のタブがもう移していたら…setItem 0 回」で確認）、失敗は起動時と同じ（saveFailed → retryStartupSave）。3 下書きを捨てダイアログを閉じる（:91-92）。4 S3 / S7 だけ lead を付け S5 / S6 は付けない（showToday:343、showExhausted:418、showDone / showSkipped には lead なし）。U-15：`checksDay` が state error と「あり」以外を除外。11：印は今日の課題を作る保存に含め（markPersist の `issued`）、結果は保存しない（persistGranted を書く箇所 0 件。`git grep persistGranted -- backend/public` は validate.js の読み取り検査だけ）、S8 は persisted() を待ち `=== false` のときだけ、例外・reject・なしは出さない（persist.js:12-17）、待つ間に画面が移れば描かない（seq:502-504）。test-hooks W-3 / W-9 のとおり。

### テストを弱める変更の確認（コマンドと出力）
- `git diff --name-only e13d68f...1990cad | grep -E '(AcceptanceTests|tests/acceptance)/|^\.claude/|^\.github/|…'` → 8 件（README、helpers/seed.mjs、tests の 4 件、tools の 2 件）。すべて verifier のコミット 139d2d2 と f01a6ee（`git show --name-only` で確認。backend-engineer の 1990cad は tests/acceptance に触れていない）。.claude/、.github/ は 0 件。
- skip / only / fixme / xfail の追加：`git diff -U0 … | grep -E '^\+.*(XCTSkip|…|test\.skip|test\.fixme|test\.only|\.only\()'` → コードの一致 0 件（test-plan.md の「0 件」と書いた説明文 2 行だけ）。
- `git diff -U0 … -- '*Tests*' '*tests*' | grep -iE '^[-+][^-+].*(assert|expect\(|#expect|#require)' | cut -c1 | sort | uniq -c` → `125 +`、`1 -`。消えた 1 行は i18n-files.test.mjs の `assert.equal(Object.keys(ja).length, 145)` を 146 に置き換えたもの。
- 本番側のテスト分岐：`git diff -U0 … -- backend ':!*tests*' | grep -E '(XCTestConfigurationFilePath|UITest|isRunningTests|PYTEST_CURRENT_TEST|#if DEBUG|__acceptance|globalThis\[|webdriver|playwright)'` → 0 件。
- テストの入力値：`git grep -nE '2026-11-0[345]|__acceptancePersistCalls|前日に書いた答え|seed-ac14' -- backend/public backend/scripts` → 0 件。
- 依存：`git diff … -- '*package.json' '*package-lock.json'` → 空。
- 秘密情報：`git log -p e13d68f..1990cad | grep -inE 'sk-[a-z0-9_-]{16,}|…'` → 一致 6 行はすべて g3-full-run.json の添付ファイルのパス（`task-today-…` の中の `sk-today…` が正規表現に当たった偽陽性）。`.env` 0 件。

### 実行したコマンドと結果
- `cd backend && npm ci && npm run check:contracts` → `見本 41 件、期待と違う結果 0 件`、exit 0。
- `npm run test:unit` → `tests 108 / pass 108 / fail 0 / skipped 0`。
- `cd tests/acceptance && npm ci && npx playwright install chromium webkit && npx playwright test --reporter=line` → `145 passed (36.2s)`、exit 0。`--list` → `Total: 145 tests in 17 files`（DESIGN_ 8 本）。ログ：/private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/acc-run.log
- `rm -rf dist && npm run build -- --version 2026-11-04.9 && node scripts/check-budget.mjs dist` → 殻 25,795 / 26,000、文言 6,610 / 8,000、アイコンと manifest 2,173 / 10,000、課題集 30,193 / 106,000、合計 64,771 / 150,000、OK、exit 0。dist の JS は 13 個（js/ 12 + sw.js。上限 15）。
- grep（backend/public）：`innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function|setHTMLUnsafe` 0 件。index.html の `style=|on[a-z]+=|<style|<script>…` 0 件（meta の CSP は budgets.md 3 と同じ文字列、1 つ）。js の `.style.|cssText|setAttribute('style'|setAttribute('on` 0 件。`localStorage` は main.js:156 とstore.js のコメントだけ。`import(` 0 件。`location.search|hash|URLSearchParams` 0 件。`toISOString` 0 件。budgets.md 5 の「使わない」（import attributes、CSS の入れ子、Promise.withResolvers、Object.groupBy、checkVisibility、light-dark、@starting-style、text-wrap、URL.parse、closedby）0 件。
- 壊して確かめ（写し /…/scratchpad/mut、終わった後 `diff -r` で元と同一）：上の AC 対応表の変異 4 + 4。単体の変異ではすべて狙ったテストが落ちた（写しに docs/prd がない分の tasks.json の 1 本は写しの都合で落ちたもの）。
- 実測（/…/scratchpad/measure.mjs、race.mjs。受け入れテストの写しの helper で配布物を作り静的サーバーで開く）：上の表と要修正の再現。S8 の persisted() 待ち：Chromium 61 ms、WebKit 70 ms、注入なしで `persisted()` は両方 false、`settings.storage.notPersisted` 1 件。

### 開いた URL と確認した日付（2026-11-04）
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/HTMLElement.json：`focus` の `options_preventScroll_parameter` は safari "15"、safari_ios "15.5"（main.js:149 の `focus({ preventScroll: true })` は Safari 17 で使える）。
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/StorageManager.json：`persist` と `persisted` は safari "15.2"、safari_ios "mirror"（budgets.md 5 の記述と一致）。
- 規則はリポジトリ内の contracts/data.md 2、4、11、identifiers.md 3、test-hooks.md W-3 / W-9、budgets.md 1、3、5、docs/approvals/delegation.md（2026-11-03、11-04）を開いて引用した。

### 前回（G2 r2）の指摘の追跡
| 前回の指摘 | 直った / 直っていない | 証拠 |
|---|---|---|
| 提案（tech-lead）data.md:132 の長さの文の前提 | 直った（r2 の後、24dcd46 と 3add898） | HEAD の data.md 10 に字の種類ごとの長さと測った上限がある |
| 提案（既存）未追跡の .agents/ .codex/ AGENTS.md | 直っていない（判定に数えない） | `git status --short` |

### 未検証
- コードの観点で確かめるべきことに未検証はなし。中身を見ていないものは evidence の PNG 138 枚（上の「対象外」。コードではなく e13d68f 時点の G3 の証拠で、G3 の design-reviewer r2 の対象）。Linux の CI での実行（CI の backend 側は D8 待ちで動いていない。前回と同じ）。
