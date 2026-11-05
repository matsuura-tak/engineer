# 001-daily-learning G2 コード reviewer r5（FB 1 回目の作り直しで 1 回目。e7e12fe...4fa1857）

PASS

## 指摘
- 要修正（小）：/Users/takumamatsuura/src/engineer/backend/public/js/main.js:97-104（`commit` の再試行 `onFail(act(() => commit(next, onOk, onFail)))`）と :445-461（`issueByAction`）。`error.storage.retry` の入口を `act()` で包むときに操作の名前 `op` を渡していないので、`task.next` の保存が失敗し、再試行を押す前に日付が変わると、`dayChanged('')` → `R.showsDayChanged('', 'task.today')` が true になり `task.dayChanged` が描かれる。根拠：contracts/data.md 4「画面を開いたまま日付が変わったとき」の 4 の例外（U-17）「取り消した操作が `task.next` のときは、S3 / S7 に着いても知らせを出しません」「実装は、操作の入口に操作の名前を渡し、`task.next` のときだけ知らせを描かない形にします」。起きるのは「保存の失敗 ＋ 日付が変わってからの再試行」の稀な経路で、結果（翌日の 1 件目が出る）は正しく、データは壊れない。作り手も未解決として報告している。直す方向：`commit(next, onOk, onFail, op = '')` にして再試行を `act(() => commit(next, onOk, onFail, op), op)` で包み、`issueByAction` から `where === 'next' ? 'task.next' : 'task.exhausted.advance'` を渡す（advance の再試行は今までどおり知らせを出す。data.md 4「`task.exhausted.advance` は例外にしません」）。
- 提案：JS の gzip 後の合計が 25,805 バイト（自分のビルドで測った。sw.js を含む 13 ファイル）で、ADR 0001「見直す条件」の線 26,000 まで 195 バイト。線は超えていないので判定には数えない。次に処理を足すと超える見込みが高いので、budgets.md 1「守ること」（JS が 26,000 を超えたら ADR 0001 の見直す条件に当たる）に従い、tech-lead が先に方針（コメントの扱い、ビルドの道具）を決めておくとよい（docs/approvals/delegation.md 2026-11-05 の決定「超えたら G2 の reviewer と tech-lead に判定させる」）。
- 提案（範囲外。tech-lead の文書）：/Users/takumamatsuura/src/engineer/CLAUDE.md の「ビルド/テストのコマンド」の数値（単体 85、受け入れ 133、転送量 62,960、「実装と受け入れテストはこれから追従する」）がこの差分の後の実物（単体 155、受け入れ 219、gzip 合計 109,530）と合わない。作り手は .claude/ と同様に CLAUDE.md を直せないので、指揮役から tech-lead に更新を頼む。
- 提案（既存。判定に数えない）：/Users/takumamatsuura/src/engineer/backend/public/js/main.js:136（`render()` の先頭の `flushAnswer()`）。nav や `app.name` で S3 を離れるときに、書きかけの答えが保存される（setItem 1 回）。data.md 2 の「保存する時機（これ以外では保存しない）」の答えの行は「最後の入力から 300 ms 後。`pagehide` と `visibilitychange`（hidden）のときはすぐ」で、画面を離れる操作は書かれていない。`git blame` で BASE より前（13981918、2026-11-03）からある行なので既存。害はなく（答えを失わない方向）、契約の表に「画面を離れるとき」を足すか、実装を 300 ms とイベントだけにするかを tech-lead が決めればよい。
- 提案（verifier、作り手の未確認 11）：U-17（`task.next` を取り消したときに知らせを出さない）を画面で確かめる受け入れテストがない。単体 next-advance.test.mjs の「U-17」は `showsDayChanged` の純粋関数だけ。design-d30 の 12 本は通るが `task.next` の経路は含まない。足すかは verifier の判断。

## 証拠
- 対象：e7e12fe...4fa1857、観点「コード（G2）」、機能 001-daily-learning。`git diff --name-only e7e12fe...4fa1857`（32 ファイル。すべて読んだ：✔）。パスは /Users/takumamatsuura/src/engineer/ の下。
  - ✔ backend/RUNBOOK.md、✔ backend/docs/001-daily-learning.md（差分全文。エージェント向けの指示のような文はなし）
  - ✔ backend/public/app.css、✔ backend/public/data/tasks.json（中身は機械で検査）、✔ backend/public/i18n/en.json、✔ backend/public/i18n/ja.json（fixtures と同一）、✔ backend/public/js/main.js（全文）、✔ backend/public/js/rules.js（全文）、✔ backend/public/js/validate.js、✔ backend/public/js/view-settings.js、✔ backend/public/js/view-start.js、✔ backend/public/js/view-task.js（全文）
  - ✔ backend/scripts/check-budget.mjs、✔ backend/scripts/lib/tasks-check.mjs
  - ✔ backend/tests/acceptance/helpers/check-seeds.mjs、✔ helpers/seed.mjs、✔ tests/ac17-ac18-ac27-a11y.spec.mjs、✔ tests/ac35-ac37-done-screen.spec.mjs（4 件とも 4fa1857 だけで変わっており、コミットの題と docs/verification/001-daily-learning/test-plan.md の r10 の節のとおり verifier の変更。G2 テストの判定で扱われたもの。中身は seed の検査を強める、check-seeds の main 判定を直す、AC18 の 3 問目を先頭の `years.never` に変える、D43 reduce に累計の確かめを足す、で、弱める変更はない）
  - ✔ backend/tests/unit/build.test.mjs、✔ fake-dom.mjs、✔ i18n-files.test.mjs、✔ next-advance.test.mjs（全文）、✔ rules.test.mjs、✔ tasks-check.test.mjs、✔ view-task.test.mjs（全文）
  - ✔ docs/approvals/delegation.md、✔ docs/progress.md（指揮役の記録。範囲外）
  - ✔ docs/verification/001-daily-learning/evidence/r10-check-seeds.log、r10-injectseed-negative.log、r10-repeat5.log、r9-green.log（先頭と末尾）、✔ test-plan.md（verifier。範囲外）
  - 呼び出し元として読んだ未変更ファイル：backend/public/js/dom.js、store.js、persist.js、dates.js、files.js、i18n.js、index.html（CSP と modulepreload）
- 規則として開いて引用したもの（2026-11-05）：docs/prd/001-daily-learning.md（r11。11 の冒頭と AC-1〜AC-40）、design/001-daily-learning.md（r9。4 の D-30、D-34〜D-45、5、5.1、6、6.1）、design/tokens.md（5 の motion）、contracts/data.md（2、4、5、8、9、11）、contracts/identifiers.md、contracts/strings.md、contracts/budgets.md（1、2、3、5）、contracts/test-hooks.md（「完了の演出の確かめ方」「本番に入っていないことの確かめ」）、contracts/dependencies.md、docs/adr/0001（見直す条件：JS gzip 26,000、ファイル 15 個、動的 import なし）、0002、0005、docs/adr/features/001-daily-learning.md（1.1、2、6）、docs/templates/review-report.md。

### 観点の表（AC 対応表。結果は自分で動かしたもの：単体 155/155、受け入れ 219/219）
| AC | 実装の場所（backend/public/js、行） | テスト | 結果 |
|---|---|---|---|
| AC-1、AC-2 | view-start.js questionScreen:155、main.js onAnswer:260、rules.js answerInitial:160 / finishInitial:178 | 受け入れ ac01-ac02、単体 rules「診断：…AC-40」 | 合格 |
| AC-3、AC-4、AC-29 | data/tasks.json（tasks.v2.json と `cmp` 同一）、scripts/lib/tasks-check.mjs:9-37 | 受け入れ ac03-ac04-ac29、単体 tasks-check（210 件、18 組、external 20%）。自分の検査：210 件、重複 0、初級・中級 12 組は各 14、上級 6 組は各 7、external 最大 2/14 | 合格 |
| AC-5、AC-7、AC-9 | rules.js reportTask:202 / rateTask:213 / startOfDay:109（6-2 → 6-3）、main.js onReport:371 / showRate:394 | 受け入れ ac05-ac06-ac07-ac09、単体 next-advance「起動：今日の行が何行あっても…」 | 合格 |
| AC-6 | rules.js pickTask:42（history と current にない最小 ID） | 受け入れ同上、単体 rules「pickTask は…」 | 合格 |
| AC-8 | rules.js applyLevelRule:68（段階の違う行で止める）、levelNotice:334、view-task.js skippedScreen:254 | 受け入れ ac08（10 通り）、単体 rules（9 通り、seed 3 件）、next-advance「AC-8 10 通り目」「levelNotice」 | 合格 |
| AC-10 | rules.js exhaustedInfo:345 / advanceLevel:126 / levelAbove:63、main.js onAdvance:467 / issueByAction:445、view-task.js exhaustedScreen:271 | 受け入れ ac10-ac30、design-d40-d44、単体 next-advance「advance」2 本、「S7 の補足」 | 合格 |
| AC-11、AC-13 | store.js save（setItem 1 回）、rules.js markPersist:146 / planDay:153、main.js route:172 / askPersist:193 / commit:97 | 受け入れ ac11-ac13、design-d31、単体 next-advance（setItem の回数と印）、day-persist | 合格 |
| AC-12、AC-23 | sw.js、main.js fetchJson:629（相対 URL の JSON 3 つだけ）、CSP connect-src 'self' | 受け入れ ac12-ac23 | 合格 |
| AC-14 | rules.js finishRedo:187（今日の current があれば上書きしない）、main.js onAnswer の redo:268-290 | 受け入れ ac14-ac16、単体 next-advance「やり直し」2 本 | 合格 |
| AC-15 | main.js render:145-148（data-debug-load-ms） | 受け入れ ac15（Chromium） | 合格 |
| AC-16 | main.js openDeleteConfirm:525、store.js removeAll | 受け入れ ac14-ac16 | 合格 |
| AC-17、AC-18、AC-27 | app.css、dom.js、view-task.js（svg は aria-hidden、prev は aria-hidden） | 受け入れ ac17-ac18-ac27 | 合格 |
| AC-19、AC-20、AC-25 | files.js、rules.js exportOf:231 / importReplacement:237、main.js onImportFile:476 | 受け入れ ac19-ac20-ac25 | 合格 |
| AC-21、AC-22 | main.js isIosSafari:58 / isStandalone:54 / showStart:223 | 受け入れ ac21-ac22 | 合格 |
| AC-24 | rules.js stats:269 / mondayOf:245 / extraCompleted:261、view-settings.js STAT_ROWS:132-144 | 受け入れ ac24、単体 rules「統計の 11 の値」「今週は月曜始まり」「2 件目以降の完了」 | 合格 |
| AC-26 | i18n/ja.json、en.json（174 キー。fixtures/strings/valid-*.json と値まで同一）、i18n.js | 受け入れ ac26、単体 i18n-files（26 キーの差し込み） | 合格 |
| AC-28 | sw.js、scripts/build.mjs | 受け入れ ac28、単体 build | 合格 |
| AC-30 | view-task.js todayScreen:36-46 | 受け入れ ac10-ac30 | 合格 |
| AC-31、AC-32 | main.js route:172 / showToday:327 / saveAnswer:350、rules.js carryAnswer:138 / moveStale:90 | 受け入れ ac31-ac32、design-d30 | 合格 |
| AC-33 | rules.js nextTask:119 / nthToday:295 / startOfDay:112（6-2 が先）、main.js onNext:463 / issueByAction:445、view-task.js todayScreen:22-25,112 | 受け入れ ac33、単体 next-advance「task.next」3 本、「issued」 | 合格 |
| AC-34、AC-38 | tasks.json、tasks-check.mjs:34-37（insight）、view-task.js insightParts:193（S4、S5 だけ。todayScreen と skippedScreen には置かない） | 受け入れ ac34-ac38、単体 tasks-check。自分の検査：初級 84 件で 10 分以下・6 語 0 件・external の tools はブラウザ/開発者ツール、insight 51〜85 字で改行・バッククォート 0 | 合格 |
| AC-35 | rules.js completedCount:253 / milestoneOf:312 / doneInfo:317、view-task.js totalLine:159 / doneFacts:174、app.css .cheer.is-milestone | 受け入れ ac35-ac37（4 通り、語の検査、reduce）、単体 next-advance「AC-35」、view-task（D-35、D-36）。自分の検査：ja/en の 5 語 0 件 | 合格 |
| AC-36 | rules.js progressOfCurrent:300 / progressOfRow:305、view-task.js todayScreen:28,113-114 / doneFacts:176-183 | 受け入れ ac35-ac37、単体 next-advance「AC-36」 | 合格 |
| AC-37 | rules.js daysCompletedWeek:257、view-task.js doneScreen:246、view-settings.js | 受け入れ ac35-ac37、単体 next-advance「AC-37」 | 合格 |
| AC-39、AC-40 | view-start.js QUESTIONS:150（area.*.desc を label の中に）、validate.js YEARS:6（never が先頭） | 受け入れ ac39-ac40、単体 view-task「D-41」、rules | 合格 |
| design D-43（AC の外） | view-task.js rateMark:149（createElementNS、pathLength=1、節目は circle が先）/ totalLine:159（value は最終の値、prev は兄弟で aria-hidden、animationend/animationcancel で外す）/ rateScreen:200（matchMedia reduce ならクラスなし・prev なし）、app.css:475-571（no-preference の中だけ animation、draw 400、tick 250、delay 300、節目は +400。JS のタイマーなし） | 受け入れ DESIGN_D43 2 本 × 2 エンジン、単体 view-task 2 本 | 合格 |
| design D-30、U-15、U-17 | main.js act:65 / dayChanged:84 / route:188、rules.js checksDay:21 / showsDayChanged:360 | 受け入れ design-d30、単体 next-advance「U-17」 | 合格（再試行の入口だけ上の要修正） |

範囲外の変更ファイル：docs/approvals/delegation.md、docs/progress.md（指揮役）、docs/verification/…（verifier）、backend/tests/acceptance/…（verifier）。PRD と指示書の範囲を超えた機能の追加はない。

### 契約・ADR・CLAUDE.md の決まりの確認（自分の grep と読み）
- 1 回の保存は 1 回の setItem：`setItem` は store.js:23 の 1 か所だけ。route は `r.changed` のときだけ 1 回（6-1 と 6-4 をまとめる）、`task.next` / advance / やり直しは issueByAction / commit で 1 回、選べないときは保存しない（nextTask changed=false）。単体 next-advance で回数を数えて確認（setItems 1 / 0）。
- textContent だけ、CSP、インラインなし：`innerHTML|outerHTML|insertAdjacentHTML|document.write|eval(|new Function|setHTMLUnsafe|toISOString|import(` 0 件。`style=|<style|\son[a-z]+=` 0 件、js の `.style.|cssText|setAttribute('style'|setAttribute('on` 0 件。index.html の CSP meta 1 つで budgets.md 3 の文字列と一致。SVG は createElementNS（view-task.js:143-147）。
- テストのつなぎ口なし：`__test|[?&](reset|now|seed)=|location.search|location.hash|URLSearchParams|__acceptance|window.__|globalThis.__|webdriver|playwright` 0 件。
- ES modules・依存 0・動的 import なし・相対 URL：非相対の import 0 件、`/` で始まる URL 0 件（SVG の名前空間 URL を除く）、JS は public/js 12 個 ＋ sw.js ＝ 13（ADR 0001 の 15 以下）、modulepreload 12 個。backend/package-lock.json は差分なし（依存の追加なし）。
- タイマー：`setTimeout` は persist.js:23、files.js:16、main.js:341 の 3 行だけ、`setInterval|requestAnimationFrame` 0 件（設計メモ 6 のとおり。演出は CSS だけ）。
- ネットワーク：`sendBeacon|XMLHttpRequest|WebSocket` 0 件、`fetch(` は main.js:630（配布物の JSON）と sw.js の 2 行だけ。
- budgets.md 5「使わない」機能（import attributes、withResolvers、groupBy、checkVisibility、light-dark、@starting-style、text-wrap、URL.parse、closedby、Iterator helpers）：0 件。CSS の入れ子なし。
- 演出が D-43 と tokens 5 どおりか：時間の表（通常 0〜400 / 300〜550、節目 0〜400 / 400〜800 / 700〜950）を app.css の animation-delay（`--motion-draw`、`calc(--motion-delay-tick + --motion-draw)`）で確認。reduce では `@media (prefers-reduced-motion: no-preference)` の外なので animation が付かず、JS も prev を作らない（受け入れ DESIGN_D43 reduce で getAnimations 0・prev 0 を自分の実行で確認）。D-45 / D-34 / D-40 の並びは view-task.test.mjs の testid の順で確認。

### テストを弱める変更の検査（craft-reviewer 3「コード」2）
- A `git diff --name-only … | grep -E '(AcceptanceTests|tests/acceptance)/|^\.claude/|^\.github/|…'` → backend/tests/acceptance/ の 4 件（上のとおり verifier の 4fa1857。.claude/ と .github/ は 0 件）。
- B `git diff -U0 … | grep -E '^\+.*(XCTSkip|…|test\.skip|\.only\(|\.fixme\()'` → 0 件。
- C `git diff -U0 … -- '*tests*' | grep -iE '^[-+][^-+].*(assert|expect\()' | cut -c1 | sort | uniq -c` → `249 +` / `15 -`。消えた 15 行は rules.test.mjs の AC-24 の統計テストを「緩い相対比較」から PRD の Then の値への `deepEqual` に書き換えたもの（強くなった）と、ac17 の AC18 で `years.lt1` → `years.never`（design r9 の 3 問目の先頭に合わせた。確かめる操作の数は同じ）。
- D `git diff -U0 … -- backend ':!*tests*' | grep -E '^\+.*(isRunningTests|#if DEBUG|__test|…)'` → 本番コードでは 0 件（出たのは backend/docs の grep の記述だけ）。
- テストの入力値の決め打ち：`git grep -n 'backend-intermediate-004\|frontend-beginner-003\|2026-11-0' -- backend/public/js` 相当の確認として、rules.js と view-task.js に固定の ID・日付・件数の分岐はない（読んで確認。節目の 7/30/100 は PRD の値）。

### 実行したコマンドと結果（2026-11-05、macOS、node v24.22.1、HEAD 4fa1857）
- `cd backend && npm run -s check:contracts` → `見本 52 件、期待と違う結果 0 件`、exit 0。
- `cd backend && node --test 'tests/unit/**/*.test.mjs'` → `tests 155 / pass 155 / fail 0 / skipped 0`、exit 0。
- `node scripts/build.mjs --out <スクラッチパッド>/dist --version 2026-11-05.1` → `20 ファイル`、exit 0。
- `node scripts/check-budget.mjs <スクラッチパッド>/dist` → 殻 29,999 / 32,000、文言 8,045 / 9,000、アイコンと manifest 2,173 / 4,000、課題集 69,313 / 105,000、合計 109,530 / 150,000、OK、exit 0。JS（sw.js 含む 13 ファイル）の gzip 合計 25,805（作り手の 25,806 との差 1 は sw.js の版の文字列）。CSS 3,329、HTML 865。
- tasks.json の自分の検査（node）：210 件、重複 0、18 組（初級・中級 14、上級 7）、external は組ごと最大 2/14、4 要素＋解説の平均 390.6 字、insight 51〜85 字、gzip 69,313、初級 84 件の AC-34 の語・分・tools の違反 0、minutes 1〜15、in_app の URL 0、tools の違反 0。`cmp docs/prd/001-daily-learning/tasks.v2.json backend/public/data/tasks.json` 差なし。ajv（tasks.schema.json）OK。
- i18n：ja/en とも 174 キーで contracts/fixtures/strings/valid-*.json と値まで同一、ajv（strings.schema.json）OK、AC-35 の語（連続・途切れ・逃した・\bstreak\b・\bmissed\b）0 件。
- 受け入れテスト（自分で実行。`cd backend/tests/acceptance && npx playwright test --reporter=line`、retries 0）：`Running 219 tests using 5 workers` → `219 passed (1.0m)`、exit 0。先に新しい画面の 6 ファイル（ac35-ac37、ac33、ac10-ac30、design-d30、design-d40-d44、ac08）だけで `82 passed (39.2s)`、exit 0。ログ：/private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/acceptance-full.log、同 acceptance-subset.log、同 cmds.log。
- `git log --format='%h %an %s' e7e12fe..4fa1857 -- backend/tests/acceptance/` → 4fa1857 だけ（題「受け入れテスト：AC18 の前提と G2 の提案（verifier、219/219）」）。
- `git blame -L '/flushAnswer();/,+1' e7e12fe -- backend/public/js/main.js` → 13981918（2026-11-03）。既存の根拠。
- 作り手の報告の件数との照合（読んだのは上の確認の後）：単体 155、受け入れ 219、JS 13 個、予算の 4 行、tasks 210 件、文言 174 キーはすべて自分の出力と一致。「殻 30,001」「JS 25,806」は版の文字列の差で 2 バイト以内。
- 開いた URL：なし（コードの観点。規則はリポジトリの PRD、design、contracts、ADR を開いて引用した。日付は 2026-11-05）。
- 作業ツリーの補足：ルートに未追跡の AGENTS.md、.agents/、.codex/ がある（この差分の外。AGENTS.md は CLAUDE.md の型の写しで、指示のような文はなかった。判定には関係しない）。

### 未検証
- なし（この関門で確かめるべきもので確かめられなかったものはない）。
- 後の関門に送るもの（契約がそう定めている）：Safari 17 実機での `pathLength` と演出の見た目（budgets.md 5、G4 で Takuma）。Linux の CI での受け入れテスト（ADR 0004。ここでは macOS）。AC-34 の「用語の説明」は機械で検査できず、指揮役の記録 docs/approvals/delegation.md 2026-11-05 の範囲。

## 記録
- 関門：G2（コード）
- 判定した役：reviewer
- 回：r5（r1〜r4 は FB 前の周回。FB 1 回目の作り直しで 1 回目）
- 対象：feat/001-daily-learning、e7e12fe...4fa1857
- 日付：2026-11-05
