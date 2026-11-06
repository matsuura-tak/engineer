# 判定の報告：001-daily-learning G2（受け入れテスト）reviewer（テスト）r1

- 関門：G2（verifier の変更：受け入れテストとテスト計画）
- 判定した役：reviewer（テスト）
- 回：r1
- 対象：dcc3589...a6facf4（feat/001-daily-learning、HEAD a6facf4）。backend/tests/acceptance/（41 ファイル）、docs/verification/001-daily-learning/
- 日付：2026-10-31
- 保存した役：指揮役（報告の文章はそのまま）

---

PASS

## 指摘
重大：なし

要修正：
- 要修正 1、backend/tests/acceptance/helpers/app.mjs:72-75 と tests/ac01-ac02-diagnosis.spec.mjs:60-63、tests/ac12-ac23-offline.spec.mjs:19-23。`diagnose()` を `finishTo: null` で呼ぶと、`finishMs` は `diagnosis.finish` の click が返った時点で確定し、`task.today` の表示を待たない。AC-2（3 本）と AC-12 (a) はこの値に `≤ 1000` を掛け、annotation「最後の回答から task.today まで ms」として残すが、計っているのは click の往復だけで遷移の時間ではない。1 秒の上限は直後の `expectState(page, 'task.today', 1000)` の timeout で間接的に効いている（開始が click の解決後なので実効の上限は click + 1,000 ms）。根拠：PRD AC-2 Then「1秒以内に状態 `task.today` が表示され」、確かめ方（G3 の証拠に計測値を残す）。直す方向：AC-1 の 3 回目（ac01 の 29-37 行）と同じく、テスト側で t0 を click の前に取り、`expectState` の後に差を取る（または `diagnose` が `finishTo` の timeout を受け取り、待った後に `finishMs` を確定する）。Then は変えない。

提案（判定に数えない）：
- 提案 1（未解決 (3)）、tests/ac31-ac32-zero-ops-answer.spec.mjs:20。重なる要素の数え方で題名の祖先（`el.contains(title)`）を除外している。contracts/test-hooks.md「AC-31 の重なる要素の数え方」3 には祖先の除外の文がないが、祖先は子孫の下に描かれ「題名を覆う」（PRD AC-31 Then）ことはないので、論理的には妥当で Then を変えていない。tech-lead が test-hooks.md に「題名の祖先は除く」を 1 行足して契約とテストをそろえるとよい。
- 提案 2（未解決 (2)）、tests/ac14-ac16-redo-delete.spec.mjs:6-38。PRD AC-14 の Given「過去 3 日に完了した課題が 3 件あり、今日の課題はまだ出していない」は、contracts/data.md 4 の 6-4（「あり」の起動では今日の課題を必ず出す）の下では S7（組を出し終えた）以外に作れない。verifier は done 3 + no_time 4 の「出し終えた」seed で S7 → S8 → S2 → S3 とし、Then（新しい領域の課題、done の行 3 件、行数は seed と同じ）は PRD どおり。妥当。pdm が AC-14 の Given を「目標の組の課題を出し終えて `task.exhausted` にいる（完了 3 件を含む）」に書き直すと、契約と PRD の食い違いが消える。
- 提案 3（未解決 (4)）、tests/ac01-ac02-diagnosis.spec.mjs:43-45。1→2、2→3 を 500 ms、3→`task.today` を 1,000 ms で判定。PRD AC-1 Then「回答を確定してから次の質問が表示されるまで」は 3 問目には「次の質問」がないので、3 回目を AC-2 の 1 秒で読むのは筋が通る。ただし PRD 12「各質問の切り替えは 500 ミリ秒以内（AC-1 で 3 回計る）」とは読みが揺れる（「診断を始める」→ 1 問目は計っていない）。pdm が AC-1 の「3 回」をどの 3 遷移か明記するとよい。
- 提案 4（未解決 (5)）、tests/ac03-ac04-ac29-tasks-json.spec.mjs:47-59。budgets.md 2 の予算（平均 600 字、gzip 106,000 バイト）を `AC4_課題集の量の予算_…` の名前で置いている。contracts/test-hooks.md W-6 と budgets.md 2 が「受け入れテストで数える」と求めているので置くこと自体は契約どおり。docs/templates/test-plan.md 2「AC のないテストは作らない」との整合は、pdm が AC-4 の Then に budgets.md 2 を参照で足すか、tech-lead が契約に「AC-4 の一部として数える」と書けば閉じる。
- 提案 5、tests/ac10-ac30-exhausted-external.spec.mjs:34-39。課題集に `external` が 0 件なら annotation「該当なし」で通る（PRD AC-30 Given の文どおり）。G3 ではこの annotation の有無を検証レポートに必ず書くこと（通ったが Then を確かめていない場合があるため）。
- 提案 6（既存。この差分の外）、contracts/tools/check-schemas.mjs。`cd backend && node ../contracts/tools/check-schemas.mjs` は `Cannot find module 'ajv/dist/2020'` で落ちる（backend/package.json と backend/node_modules がまだない）。未解決 (1) と同じ根（依存の置き場所）。tech-lead の裁定に含める。

未解決 (1)（tech-lead が裁く。判定に数えない）：依存は backend/tests/acceptance/package.json にあり、`cd backend/tests/acceptance && npx playwright test` で動く（自分で確認）。ADR 0004 / test-hooks.md / CLAUDE.md の形 `cd backend && npx playwright test -c tests/acceptance` は backend/ に node_modules がないと `@playwright/test` を解決できないので、どちらかに統一が要る。

## 証拠
- 対象：dcc3589...a6facf4（HEAD a6facf4、1 コミット、matsuura-tak 2026-10-31）、観点「受け入れテスト（G2、verifier の変更）」。`git diff --name-only dcc3589...a6facf4`（41 件、全部読んだ。[x]）：
  - [x] backend/tests/acceptance/README.md、global-setup.mjs、package.json、package-lock.json（node で parse して全パッケージ名を確認）、playwright.config.mjs
  - [x] helpers/app.mjs、build.mjs、check-seeds.mjs、fixtures.mjs、paths.mjs、schema.mjs、seed.mjs
  - [x] server/static-server.mjs
  - [x] seeds/ 10 件（seed-ac8-* 6、seed-diagnosed-2026-10、seed-one-done、seed-three-done-one-answer、seed-two-done）
  - [x] tests/ 16 ファイル（ac01-ac02、ac03-ac04-ac29、ac05-ac06-ac07-ac09、ac08、ac10-ac30、ac11-ac13、ac12-ac23、ac14-ac16、ac15、ac17-ac18-ac27、ac19-ac20-ac25、ac21-ac22、ac24、ac26、ac28、ac31-ac32）
  - [x] docs/verification/001-daily-learning/test-plan.md、evidence/red.log（3,293 行。先頭 20 行と末尾 40 行を読み、残りは grep で件数と理由を数えた）
- 参照として読んだファイル：docs/prd/001-daily-learning.md（r6 全文）、design/001-daily-learning.md（2、5、6、7 の該当行）、design/tokens.md（size.focus.width 3 px）、contracts/README.md、test-hooks.md、identifiers.md、data.md、strings.md、service-worker.md、budgets.md、dependencies.md、schemas/data.schema.json と tasks.schema.json（該当行）、fixtures/seeds/ 5 件、fixtures/data/v1/valid-export-three-completed.json、fixtures/data/invalid-newer-version.json、docs/adr/0004、docs/templates/test-plan.md、review-report.md、docs/org/gates.md

### AC 対応表（確かめている結果。要素の有無だけのテストはなし）
| AC | テスト（ファイル::名前の先頭） | 確かめている結果（値） |
|---|---|---|
| AC-1 | ac01::AC1_ | `data-state` start→question、`data-question-index` 1/2/3、`-total` 3、文字が ja の `diagnosis.progress` の差し込み、1→2・2→3 ≤ 500 ms、3→today ≤ 1,000 ms、progress が 4 問目で 0 件 |
| AC-2 | ac01::AC2_ ×3 | finish → `task.today` 1,000 ms 以内（timeout）、`task.today` 1 件、`data-task-area`/`-level` が回答と一致（要修正 1 の計測値の問題あり） |
| AC-3 | ac03::AC3_ | 200・application/json、tasks.schema.json 通過、全件 4 要素 trim ≥ 1、minutes 整数 1〜15、違反一覧 [] |
| AC-4 | ac03::AC4_ ×2 | 全体 ≥ 126、18 組 ≥ 7、重複 ID []、平均 ≤ 600 字、gzip ≤ 106,000 |
| AC-5 | ac05::AC5_ | rate → done、reload ×2 で done・today 0 件、履歴先頭 {taskId, 11-04, done} |
| AC-6 | ac05::AC6_ | 11-04 の ID が seed にない、11-05 の ID が seed + 11-04 のどれとも違う、area backend |
| AC-7 | ac05::AC7_ ×3 | skipped、履歴 4 行で先頭 {taskId, date, report}、reload で skipped・today 0 件 |
| AC-8 | ac08::AC8_ ×10 | 1 日目の level = seed、2 日目の level が 9 通り（5 は 2 本）の期待値、ID が重ならない。seed の内容を data.md 5 の規則で検算して全 10 本一致 |
| AC-9 | ac05::AC9_ ×4 | done、reload で `task.rate.helpful` 0 件、`data-helpful` helpful/not_helpful/unanswered/unanswered |
| AC-10 | ac10::AC10_ | exhausted、message の文字 = ja、redo 1 件、today 0 件、redo→question→同じ組→同じ日に exhausted |
| AC-11 | ac11::AC11_ | message 表示、retry 1 件、index 2 のまま、`level.advanced` checked、retry→index 3・message 0 件、課題 database/advanced |
| AC-12 | ac12::AC12_ ×2 | AC-1/2/5/9 と AC-7 の再読み込み前 Then、fromServiceWorker でない応答 + requestfailed = 0 |
| AC-13 | ac11::AC13_ | reload で done、履歴 1 行 {taskId, done}、notPersisted 可視、export 1 件 |
| AC-14 | ac14::AC14_ | today の area frontend / level beginner、done 行 3、行数 = seed（提案 2） |
| AC-15 | ac15::AC15_ | 新コンテキスト ×5、CDP 150 ms / 200,000 / 93,750 / CPU 4、`data-debug-load-ms` が整数で 5 回とも ≤ 2,000 |
| AC-16 | ac14::AC16_ | confirm 可視、ok→start、reload→start、診断後 history.row 0・history.empty 可視 |
| AC-17 | ac17::AC17_ ×4 | scrollWidth ≤ 320、overflow []、ellipsis []、操作要素 ≥ 1 で押せない一覧 [] |
| AC-18 | ac17::AC18_ | done 到達、9 要素すべて `:focus-visible` true、枠 ≥ 3 px |
| AC-19 | ac19::AC19_ | download 1、schema 通過、formatVersion 1、firstOpenDate 11-01、diagnosis = seed、levels、device なし、history 3（answer ''/''/50 字） |
| AC-20 | ac19::AC20_ | B で export 0 件→import→confirm 0・error 0→done、行順 003/002/001、answerText 50 字、再書き出しが A と deep equal |
| AC-21 | ac21::AC21_ ×3 | iPhone / iPad（Mac UA + maxTouchPoints 5）：案内 1、steps.1〜4 可視、steps.4 = ja、close→0、reload→0、settings.homeScreen.open 1→案内。偽装なし：0、reload 0、open 0 |
| AC-22 | ac21::AC22_ | standalone.import 可視・文字 = ja、importButton 1、begin 1、addToHomeScreen 0、reload で同じ、import→today ID 004、行 3、書き出しが見本と等しく current {11-04, 004, ''} |
| AC-23 | ac12::AC23_ ×2 | SW ready 後 offline、reload と新タブで 3,000 ms 以内に同じ状態（today は同じ ID）、送信 0 |
| AC-24 | ac24::AC24_ | 9 つの `data-stat-*` の値、見える文字 = 属性（真偽値は `.yes` の文言、`.no` 0 件） |
| AC-25 | ac19::AC25_ | error.import.message・reason.version 可視、confirm 0、書き出し history 1（001 done）、diagnosis/levels = seed、app.name→today 同じ ID、行 1 |
| AC-26 | ac26::AC26_ ×2 | `<html lang>`、7 キーの文字 = その言語のファイル、ja/en 片方にしかないキー []、両ファイル schema 通過 |
| AC-27 | ac17::AC27_ ×6 | serious/critical の違反 []、結果 JSON を添付 |
| AC-28 | ac28::AC28_ | 旧版の `data-build-version`・settings.version、新版 tasks.json 件数 > 旧、2 秒おき 3 回の版の記録、新版後に旧に戻らず最後が新版、history 3・diagnosis・levels が前後で deep equal |
| AC-29 | ac03::AC29_ | 18 組で external ≤ 20%、mode 不正 0、in_app に URL 0・tools []、external に tools ≥ 1 |
| AC-30 | ac10::AC30_ ×2 | external：ID = 組の external 最小、mode、題名 = title、badge 可視・文字 = ja、tools.item 件数と文字一致。in_app：mode、badge 0、tools 0。external 0 件なら「該当なし」（提案 5） |
| AC-31 | ac31::AC31_ ×2 | 操作 0 回で today/done、today は 9 要素各 1 件可視、dialog 0、aria-modal 0、fixed/sticky の重なり []（提案 1） |
| AC-32 | ac31::AC32_ ×3 | reload / 新タブで同じ ID と value = 200 字、翌日は別 ID・value ''、書き出しの前日行 {11-04, none, 200 字}、current {11-05, 新 ID, ''} |

- 範囲外の変更：なし（AC4 の予算テストは contracts/budgets.md 2・test-hooks.md W-6 が受け入れテストで数えるよう求めたもの。提案 4）。
- つなぎ口と境界：使う識別子はすべて contracts/identifiers.md にある（`task.rate.close`、`settings.homeScreen.open`、`task.answer.saved`、`history.row.answerText` は design 7 の表でも確認）。注入は addInitScript / clock / setOffline / CDP / setInputFiles だけ。`page.evaluate` 10 か所はすべて DOM の読み取り、`navigator.serviceWorker`、テスト側 flag の設定で、アプリの関数は呼んでいない。`__test`、`location.search`、URL 引数：0 件。実装の import：0 件（import 元は helpers/server/node 組み込み/許可された 3 依存のみ）。`clock.install`：0 件。
- 時刻：config の `timezoneId: 'Asia/Tokyo'`、ad-hoc コンテキスト（AC-15、AC-20、AC-28）も明示。AC-15 は固定しない（W-3）。
- 自分で動かしたコマンドと結果：
  - `cd backend/tests/acceptance && npm ci` → found 0 vulnerabilities。`npm ls --depth=0` → @axe-core/playwright@4.14.0、@playwright/test@1.64.1、ajv@8.20.0（dependencies.md の 3 件と版が一致）。lockfile の全パッケージ 10（3 + 推移 7）。
  - `npx playwright test --list` → `Total: 131 tests in 16 files`、[chromium] 66、[webkit] 65、名前の AC 番号 32 種。
  - `npx playwright test --reporter=line` → `131 failed`、exit 1。`--reporter=list` の Error 行は 1 種類 ×131：`配布物を作れないので受け入れテストを動かせない：backend/scripts/build.mjs が見つからない（実装がまだない）`。
  - red.log：3,293 行、✘ 131（chromium 66、webkit 65）、`131 failed`（3160 行目）、✓/passed/skipped 0 行、同じ Error 文 131 件、SyntaxError/TypeError/Cannot find module 0 件。自分の実行と一致。
  - 配線の確認：スクラッチパッドの最小 HTML（`data-state="diagnosis.start"` と begin ボタンだけ、i18n と tasks.json は空同然）を `KYOUNOITTE_DIST` に指して `--project=chromium -g 'AC1_|AC3_|AC21_UA|AC26_ja'` → 4 failed。落ちた理由は `Expected "diagnosis.question" Received "diagnosis.start"`、`tasks.schema.json：data must have required property 'formatVersion'`、`strings.schema.json … 'app.name'`、`waiting for getByTestId('nav.settings')`。サーバー・baseURL・request・schema が動き、アプリの不足で落ちることを確認（設定の誤りではない）。
  - clock の範囲：`page.clock.setFixedTime` を page1 に掛け、同じ context の page2（fixDate なし）で `new Date()` → chromium・webkit とも `Wed Nov 04 2026 10:00:00 GMT+0900`。固定はコンテキスト全体に効くので、AC-23・AC-32 の新しいタブは問題ない（重大の候補として挙げかけ、再現でくつがえした）。
  - `npm run check:seeds` → seed 10 件、期待と違う結果 0 件。
  - PRD の AC 集合と test 名の AC 集合の diff → `sets equal`（32 = 32）。`test(` の定義 45。test-plan 2 章の AC 行 32 + 予算 1、3 章 9 行すべてに選んだものと範囲外の理由、R1〜R5（大）すべてに自動テスト・3 章の行・6 章のチャーター。
  - テストを弱める変更：`git diff --name-only dcc3589...a6facf4 -- .claude .github` → 空。`git diff -U0 … | grep -E '^\+.*(test\.skip|test\.fixme|test\.only|xfail|…)'` → README の「使わない」の説明 1 行だけ。`waitForTimeout|sleep\(` → 0 件。`setTimeout` → helpers/app.mjs:222 の `pause`（AC-28 の 2 秒の間隔）1 件。`retr(y|ies)|rerun` → `error.storage.retry` の識別子 2、`retries: 0` と README の説明 3。`getByText|getByLabel|text=|hasText` → 0 件。`getByRole` → AC-31 の `dialog` 1 件（契約どおり）。`.nth(` 5 件（繰り返す行と道具の項目）。
  - 秘密情報：`git log -p dcc3589..a6facf4 | grep -inE '<パターン>'` → red.log の `test-results/ac10-ac30-exhausted-extern…/trace.zip` 4 行だけ（`sk-[a-z0-9_-]{16,}` が `task-exhausted-chromium` に当たった誤検出。開いて確認）。`.env` 0 件。エージェント向けの指示文（ignore previous / 判定を PASS など）→ 0 件。
  - `git status --short --untracked-files=no` → 空（自分はファイルを変えていない。node_modules と test-results は .gitignore 済み）。
- 開いた URL：なし（この観点では PRD・契約・ADR・design と自分の実行だけで判定した）。
- 未検証：なし（本物の配布物での合格は実装前なので対象外。赤の再現、本数、理由、配線、つなぎ口はすべて自分で確かめた）。
