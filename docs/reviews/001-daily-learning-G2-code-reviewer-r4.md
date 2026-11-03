PASS

## 指摘
- 要修正（verifier）、backend/tests/acceptance/tests/design-d31-persisted-wait.spec.mjs（2 本とも）：契約 contracts/data.md 11 の「待つ間に次の操作…が始まったら、その操作を優先し、遅れて S8 を描きません。その操作が画面を移さないとき（必須のエラー、保存の失敗の表示）も同じです」に自動テストがない。実装は正しい（main.js:68 の `app.seq += 1` が act() の始めにあり、自分の再現 spec が HEAD で両ブラウザ合格）が、作り手の未解決 (1) のとおり、この行を消しても受け入れ 153 本は全部通る（自分の変異 M4：DESIGN_D31_ 4 本 passed）。自分の再現 spec（何も選ばずに `diagnosis.cancel` → 待つ間に `diagnosis.next` で `error.diagnosis.required` → 答えが返った後も `diagnosis.question` のまま）は M4 で `Expected "diagnosis.question" Received "settings"` と落ちる。契約の文が明示する経路なので、DESIGN_D31_ に 1 本足す。手本：/private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/r4rev/required-wait.spec.mjs（契約の W-9 の注入だけを使い、実装の中を覗いていない）。G2 の判定は止めない（契約は満たしており、作り手自身が未解決 (1) と 9 の 7 に書いている）。
- 提案（tech-lead）、contracts/identifiers.md:46 と data.md 11「radio の確定」：view-start.js:170 の radio には change のハンドラがなく、`selected()` は submit の時点で読む（:206-208）。作り手の読み（「確定」＝「次へ」「決定」の submit。未解決 (2)）は r3 の `task.dayChanged` と同じで一貫しているが、「radio の確定」を「radio を選ぶだけでは含まない。確定のボタン」と言い切ると読み違いがなくなる。
- 提案、backend/tests/unit/build.test.mjs:41-46：枠の値（32,000 / 8,000 / 4,000 / 106,000、ICON_RAW_LIMIT 4,000）をテストに直書きしている。同じファイルの CSP の確かめは `contractCodeBlocks` で budgets.md から読んでいるので、枠も budgets.md 1 の表から読むと契約と実装のずれを機械で見つけられる。判定に数えない。
- 提案（r3 から継続、直っていない）、main.js:43、:194-195、:484：`app.persistAsked` はメモリの印。実害は r3 のとおりなし。
- 提案（既存。r3 と同じ）、main.js:70 と :143：act() の today() と render() の `app.day` の間の日付の変わり目（`git blame`：:70 は 1990cad、:143 は 13981918 で BASE 以前の構造）。
- 提案（既存。r1〜r3 と同じ）：リポジトリ直下の `.agents/`、`.codex/`、`AGENTS.md` は未追跡のまま。差分に入っておらず判定に数えない。
- 範囲外の注意：作業ツリーに未コミットの変更（`backend/tests/acceptance/tests/design-d31-persisted-wait.spec.mjs`、`tools/screenshots.mjs` の M、`evidence/g3r2-*` の未追跡）がある。この判定は 1560b36 の `git archive` の写しで行ったので影響しない。

未解決への答え：
- 作り手 (1)：上の要修正（実装は正しい。テストを verifier が足す）。(2)：上の提案（読みは妥当）。(3)：`act()` → `cancelRedo()`/`onBack` → `showSettings()` → `readNotPersisted()` の `setTimeout` までは同期で、契約「S8 へ移る操作の始めから」との差はマイクロ秒。問題なし。
- verifier (1)：act の `clearNotice()` を消すと、新しい `DESIGN_D30_知らせのあるS3で申告の保存が失敗して…` が両ブラウザで `Expected 0 Received 1` で落ちる（自分の変異 M1）。r3 の提案は解けた。(2)：`persist()` を遅れて呼ぶ実装はない。main.js:188-189（route：`showDay()` の直後に同期で `askPersist()`）、:285-286 と :309-310（commit の onOk：`showDay()` の直後に同期）、persist.js:5-10（`requestPersist` は `sm.persist()` をその場で呼ぶ）。main.js の `setTimeout` は :339（答えの欄の 300 ms）だけ。
- tech-lead が反論を求めた 2 点：(c)「最後に押した操作が効く」は、act() が同期で seq を上げるので、遅れて返る答えとタイマーのどちらが先でも描かない（M4、M5 で逆を確認）。反論は ADR のとおり「やめたつもりが保存される」だが、保存されるのは利用者が選んだ回答だけで、データは壊れない。アイコンの枠 4,000：実物 2,107（生）、gzip 後 2 つで 2,173。生の PNG は gzip でほぼ縮まないので、生の上限を枠と同じにしたのは筋が通る。

## 証拠
- 対象：1990cad...1560b36（feat/001-daily-learning、6 コミット）、観点：コード（G2 r4）、機能：001-daily-learning。
- `git diff --name-only 1990cad...1560b36`（26 件）。読んだ印（[x]＝差分と、コードは HEAD 全体を読んだ）：
  - [x] backend/RUNBOOK.md、backend/docs/001-daily-learning.md
  - [x] backend/public/js/main.js（HEAD 全 617 行）、backend/public/js/persist.js（HEAD 全 36 行）。呼び出し元として view-start.js:42-49（file input の change）、:155-215（questionScreen：radio にハンドラなし、submit → onNext）
  - [x] backend/scripts/check-budget.mjs（HEAD 全体）
  - [x] backend/tests/acceptance/README.md、helpers/seed.mjs、tests/ac11-ac13-storage.spec.mjs、ac17-ac18-ac27-a11y.spec.mjs、ac31-ac32-zero-ops-answer.spec.mjs、design-d30-day-changed.spec.mjs、design-d31-persisted-wait.spec.mjs（新規 108 行）、tools/screenshots.mjs
  - [x] backend/tests/unit/build.test.mjs、day-persist.test.mjs
  - [x] contracts/budgets.md（1、5、6）、data.md（11）、test-hooks.md（W-6、W-9）。identifiers.md:24、42-46 は HEAD を引用
  - [x] design/001-daily-learning.md、docs/adr/features/001-daily-learning.md、docs/approvals/delegation.md
  - [x] docs/reviews/001-daily-learning-G2-code-reviewer-r3.md（全体）、G2-tests-tech-lead-r3.md（全 116 行）
  - [x] docs/verification/001-daily-learning/test-plan.md、evidence/r7-red.log（冒頭、落ちた 4 本の行、末尾）、r7-repeat5.log（冒頭と末尾）
- 差分の中のエージェント向けの指示のような文：`git diff 1990cad...1560b36 | grep -niE 'ignore (all|previous|the above)|disregard|PASS にして|合格にして|…'` → 一致は r3 の報告の「0 件」と書いた説明文 1 行だけ。なし。
- 範囲外の変更：なし（RUNBOOK の 7 の行、docs は直しの記録）。

### 前回（G2 r3）の指摘の追跡
| r3 の指摘 | 直った / 直っていない | 証拠 |
|---|---|---|
| 要修正：cancelRedo が下書きを先に捨て、待つ間の「次へ」で TypeError | 直った | main.js:322-325（`app.draft = null` なし。render:135 が settings を描くときに捨てる）。変異 M2（元の形に戻す）で DESIGN_D31_ の 2 本目が両ブラウザで落ちる。自分の再現 spec で pageerror 0 |
| 提案（verifier）：clearNotice を実装の経路まで確かめる | 直った | design-d30 の新しい 1 本。変異 M1 で両ブラウザ `Expected 0 Received 1` |
| 提案（verifier）：AC27 の 7 本目を DESIGN_D30_ に | 直った | a11y spec のループが 6 画面、design-d30 に `DESIGN_D30_task.today.dayChanged_axe-core…`。消えた expect（`toHaveCount(1)`）は `openDayChangedToday` の :197 に同じものがある |
| 提案（tech-lead）：persisted() の待つ上限 | 直った | data.md 11「待つ上限は 1,000 ms」、persist.js:13-29、変異 M3 で DESIGN_D31_ 1 本目（Received 3009 / 3007）と単体 2 本が落ちる |
| 提案（tech-lead）：失敗した保存と persist() の読み方 | 直った（契約を明記） | data.md 11 の 2 つの道。実装 main.js:188-189、:280-289、:304-313 と同じ |
| 提案：app.persistAsked のメモリの印 | 直っていない（提案のまま） | main.js:43、:194 |
| 提案（tech-lead）：殻の枠 | 直った | budgets.md 1（殻 32,000、アイコンと manifest 4,000、合計 150,000 不変）、check-budget.mjs:13-19、自分のビルドで殻 26,160 / 32,000 |
| 既存：act と render の間の日付、未追跡ファイル | 変わらず（判定に数えない） | `git blame`、`git status --short` |

### AC 対応表（自分で動かした結果。写し /private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/copy4、node v24.22.1、Playwright 1.64.1、2026-11-04）
| AC / 契約 | 実装の場所 | テスト | 結果 |
|---|---|---|---|
| AC-13（persist 1 回、印、S8 の注意） | main.js:188-189、:285-286、:309-310（S3 の直後に同期）、persist.js:5-10 | AC13_…（「1 のまま」を追加）× 2、単体 day-persist | passed。コードで遅延呼び出しなし |
| AC-27（6 画面） | view-task.js（変更なし） | AC27_<state> × 6 × 2、DESIGN_D30_task.today.dayChanged_axe × 2 | passed |
| AC-32（保存を待たない経路） | main.js:84-95 dayChanged（held）、route:177-181 | AC32 × 5 × 2 | passed |
| data.md 11 待つ上限 1,000 ms、後から返っても描き直さない | persist.js:13-29（Promise.race、clearTimeout）、main.js:497-504 | DESIGN_D31_persistedが1000msまでに… × 2、単体 3 本 | passed。M3（上限なし）で落ちる |
| data.md 11 待つ間の操作 (1)〜(4) | main.js:68（act の seq）、:132-135（render が下書きを捨てる）、:322-325、persist.js:32-36 | DESIGN_D31_S8から入ったやり直しの… × 2、単体「S8 の待ち」、自分の再現 spec × 2 | passed。M2、M4、M5 で狙った物が落ちる。M4 は受け入れ 153 本が通る（上の要修正） |
| identifiers.md 3 知らせは次の操作の始めに外す | main.js:69 clearNotice | DESIGN_D30_知らせのあるS3で申告の保存が失敗して… × 2 | passed。M1 で落ちる |
| budgets.md 1、6 の枠 | check-budget.mjs:12-19 | 単体「内訳の枠は budgets.md の 1」、「アイコン…4,000 バイト以下」 | passed。icon 生 2,107 |

### テストを弱める変更の確認（コマンドと出力）
- `git diff --name-only 1990cad...1560b36 | grep -E '(AcceptanceTests|tests/acceptance)/|^\.claude/|^\.github/|…'` → 8 件、すべて verifier のコミット ea5f4ac（`git log -- <file>` で確認。backend-engineer の 1560b36 は tests/acceptance に触れていない）。`git diff --stat … -- .claude .github` → 空。
- skip / only / fixme / xfail の追加 → コードの一致 0 件（test-plan.md と r3 の報告の説明文 2 行だけ）。
- `git diff -U0 … -- '*tests*' | grep -iE '^[-+][^-+].*(assert|expect\(|…)' | cut -c1 | sort | uniq -c` → `59 +`、`2 -`。消えた 2 行：`await expect(app.tid(page, 'task.dayChanged')).toHaveCount(1)`（design-d30 の `openDayChangedToday` に同じ確かめ）、`assert.ok(info.bytes <= 10000, …)`（4000 に厳しくした）。
- 本番側のテスト分岐 `git diff -U0 … -- backend ':!*tests*' | grep -E '(XCTestConfigurationFilePath|…|__acceptance|globalThis\[|webdriver|playwright)'` → コードの一致 0 件（RUNBOOK と docs の md の説明文のみ）。
- テストの入力値 `git grep -nE '__acceptancePersistedSettled|__acceptancePersistCalls|2026-11-0[345]|seed-ac14|DELAY_MS|SLACK_MS' 1560b36 -- backend/public backend/scripts` → 一致は `ANSWER_DELAY_MS`（BASE 以前からの 300 ms。テスト値ではない）と check-budget のコメントだけ。
- 依存：`git diff … -- '*package.json' '*package-lock.json' '*.lock'` → 空。
- 秘密情報：`git log -p 1990cad..1560b36 | grep -inE 'sk-[a-z0-9_-]{16,}|…'` → 0 件。`.env` 0 件。

### 実行したコマンドと結果
- `cd copy4/backend && npm ci && npm run check:contracts && npm run test:unit && cd tests/acceptance && npm ci && npx playwright install chromium webkit && npx playwright test --reporter=line` → `見本 41 件、期待と違う結果 0 件`、単体 `tests 113 / pass 113 / fail 0 / skipped 0`、受け入れ `Running 153 tests using 5 workers` → `153 passed (36.9s)`、EXIT=0。ログ：/private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/r4-npm-test.log
- `rm -rf dist && npm run -s build -- --version 2026-11-04.21 && node scripts/check-budget.mjs dist` → 殻 26,160 / 32,000、文言 6,610 / 8,000、アイコンと manifest 2,173 / 4,000、課題集 30,193 / 106,000、合計 65,136 / 150,000、OK、EXIT=0（作り手の 26,159 / 65,135 との差 1 バイトは版の文字列の長さ）。JS の gzip 合計 22,500（ADR 0001 の線 26,000 の内）。dist の JS 13 個（public/js 12 + sw.js。上限 15）。icon-180.png 生 2,107。
- 自分の再現 spec（上の要修正の手本）を HEAD の写しで実行 → `2 passed (5.2s)`（Chromium / WebKit、pageerror 0）。
- 変異（写し copy4。終わった後 `diff` で public/js/main.js と persist.js が 1560b36 と同一）：

| 変異 | 落ちたテスト |
|---|---|
| M1：act() の `clearNotice()` を消す | DESIGN_D30_知らせのあるS3で申告の保存が失敗して… × 2（`Expected 0 Received 1`）。他の DESIGN_D30_ 8 本は通る |
| M2（A）：cancelRedo で `app.draft = null` を先にする | DESIGN_D31_S8から入ったやり直しの… × 2 |
| M3（C）：`Promise.race([answer])`（上限なし） | DESIGN_D31_persistedが1000msまでに… × 2（Received 3009 / 3007）、単体「既定は 1,000 ms」「本物のタイマー」（timeout） |
| M4（B）：act() の `app.seq += 1` を消す | DESIGN_D31_ 4 本は通る。自分の再現 spec × 2 が `Expected "diagnosis.question" Received "settings"` で落ちる |
| M5（D）：`isCurrent()` を見ない | 単体「S8 の待ち」、DESIGN_D31_ 2 本目 × 2、自分の再現 spec × 2 |

- grep（HEAD の backend/public）：`innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function|setHTMLUnsafe` 0 件。index.html の `style=|<style|on…=|<script>` 0 件。js の `.style.|cssText|setAttribute('style'|setAttribute('on` 0 件。`import(|toISOString|location.(search|hash)|URLSearchParams|withResolvers|groupBy|checkVisibility|light-dark|@starting-style|text-wrap|URL.parse|closedby|with { type` 0 件（budgets.md 5 の「使わない」）。CSP の meta 1 つで budgets.md:39 の文字列と同一。`localStorage` は main.js:157 と store.js のコメントだけ。
- 規則の引用はリポジトリ内の contracts/data.md 11、identifiers.md 3（:46）、budgets.md 1、5、6、test-hooks.md W-6 / W-9、docs/approvals/delegation.md（2026-11-04 の 2 行）を開いて行った。外部の URL は今回開いていない（新しく使った API は `Promise.race` と `setTimeout`/`clearTimeout` で、budgets.md 5 の表に「使わない」として載っていない）。

### 未検証
- Linux の CI での実行（CI の backend 側は D8 待ちで動いていない。r3 と同じ）。
- 実機の Safari / Chrome での `persisted()` の実際の遅れ（G4 で Takuma。data.md 11 の実測は Playwright の Chromium / WebKit のみ）。
