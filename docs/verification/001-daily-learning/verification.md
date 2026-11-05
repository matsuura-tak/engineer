# 検証レポート 001-daily-learning：診断と今日の学習（Web アプリ「今日の一手」）

判定：PASS

- 関門：G3（機能完了）　r3（r2 の後に PRD r10（AC-33〜AC-40）、design r7〜r9、課題集 v2（210 件）、実装の書き直し（53155c8 まで）、受け入れテストの書き直し（219 本。G2 tests PASS e1b2b71、4fa1857）を受けて、全部をやり直した。前半（2026-11-05 20:59〜21:11、HEAD 32236ec、コミット ccc2010 の evidence/g3r3-*）と後半（2026-11-05 21:18〜21:45、HEAD 7a59e84、evidence/g3r4-*）の 2 回に分けた。32236ec と 7a59e84 の差は契約 test-hooks.md の 3 行（W-11 の並列の禁止、S4 の撮り方）、docs/approvals、前半の証拠だけで、実装（backend/public、backend/scripts）と受け入れテスト（tests/、helpers/）は 1 行も変わっていない（`git diff --name-only 32236ec..HEAD -- backend/public backend/scripts backend/tests` は 0 件）。前半の 5 回の繰り返しと探索は同じ実装に対するもので、全件は HEAD でもう一度流した）
- 検証した役：verifier　日時：2026-11-05 20:59〜21:45（JST）
- コミット：7a59e8415de426d9eb40f09e8f6397eb5ba090fa（feat/001-daily-learning の最新）。作業ツリーの変更は受け入れテストのフォルダの 4 ファイル（playwright.config.mjs、package.json、README.md、tools/screenshots.mjs。5 章）と docs/verification/ だけ。tests/ と helpers/ は変えていない
- 環境：macOS 27.2、Node v24.22.1、@playwright/test 1.64.1、Chromium 156.0.8078.4（chromium-1248）、WebKit 27.2（webkit-2370）、@axe-core/playwright 4.14.0、ajv 8.20.0。iOS のアプリはないので Xcode とシミュレーターは使わない。接続先：受け入れテストのフォルダの静的サーバー `http://127.0.0.1:<port>/engineer/`（配布物は `backend/scripts/build.mjs --version 2026-11-30.1` で mkdtemp の一時フォルダにビルド。GitHub Pages と同じパスとヘッダー）。timezoneId Asia/Tokyo、locale ja-JP（AC-26 の 1 本と撮影の `en` は en-US）。workers 5（CI でない既定）。AC-15 だけは project `chromium-ac15` で全件の後に 1 本だけ動く（W-11）
- 読み替え（test-plan の冒頭と同じ）：「シミュレーター」は Playwright の Chromium と WebKit、「再起動」は再読み込みと新しいタブ、「AX5」はルートの文字サイズ 200%（design 9）と幅 320 CSS px、「performAccessibilityAudit()」は axe-core（wcag2a、wcag2aa、wcag21a、wcag21aa）。
- G3 の FAIL 条件の確認：FAIL か未検証の AC 0 件、飛ばしたテスト 0 件、揺れたテスト 0 件（AC-15 の扱いは 4 章）、PRD の根拠のない受け入れテストの変更 0 件（5 章）、0 件であるべき検査はすべて 0 件（6 章）。`git diff --name-only origin/main...HEAD -- .claude .github` は空。

### r2 からの差分（要点）
| 何 | r2（2026-11-04、1560b36） | r3（この報告） |
|---|---|---|
| PRD | r7（AC-1〜AC-32） | r10（AC-1〜AC-40。AC-10 と AC-24 を書き直し） |
| 受け入れテスト | 155 本 | 219 本（AC 40 個すべて。`BUDGET2_` 2 本、`DESIGN_` 16 本） |
| 課題集 | 126 件 | 210 件（AC-4：12 組 14 件、6 組 7 件） |
| AC-15 の流し方 | 全件と並列 | 他のテストと並列にしない（契約 W-11、2026-11-05 の指揮役の決定。1 章のコマンド 1、2） |
| スクリーンショット | 148 枚、axe 95 画面 | 186 枚（+ ダイアログの `_tabOk.png` 4 枚）、axe 127 画面。S4 の 4 場面（通常 11、節目 7 / 30 / 100）、design 5.1 の r7〜r9 の行、#45、#34 の 4 通りを足した |

## 1. 実行したコマンドと結果
どのコマンドにも再試行を付けていない（`--retries=0` を明示。設定も `retries: 0`）。出力は evidence/ のログに全文があり（先頭に日付、コミット、コマンド。末尾に終了コード）、ここには要点を貼る。同じ時間に受け入れテストを動かす役はいない（指揮役の確認）。

### コマンド 1（この機能の受け入れテスト全件。HEAD、直した設定）
- コマンド：`cd backend/tests/acceptance && PLAYWRIGHT_JSON_OUTPUT_NAME=evidence/g3r4-full-run.json npx playwright test --retries=0 --reporter=list,json`
- 終了コード：0
- テストの件数（成功 / 失敗 / 飛ばした）：219 / 0 / 0（chromium 109、webkit 109、chromium-ac15 1。JSON の stats：expected 219、unexpected 0、skipped 0、flaky 0）
- 出力：evidence/g3r4-full-run.log、evidence/g3r4-full-run.json。AC-15 は 219 本目で、JSON の startTime は他のテストの最後の終わりの 454 ms 後（同じ時間に他の worker は動いていない）。`data-debug-load-ms` × 5 = 1120, 1089, 1096, 1101, 1097

```text
# date: 2026-11-05 21:20:24 +0900
# commit: 7a59e8415de426d9eb40f09e8f6397eb5ba090fa
Running 219 tests using 5 workers
（…218 本の ✓…）
  ✓  219 [chromium-ac15] › tests/ac15-load-time.spec.mjs:7:1 › AC15_遅い回線とCPU4倍の制限でキャッシュなしに開き_data-debug-load-msが5回とも2000以下 (8.6s)
  219 passed (1.3m)
# exit: 0
```

### コマンド 2（AC-15 だけを 5 回。workers 1、他のテストなし）
- コマンド：`cd backend/tests/acceptance && PLAYWRIGHT_JSON_OUTPUT_NAME=evidence/g3r4-repeat5-ac15.json npm run test:ac15 -- --repeat-each=5 --retries=0 --reporter=list,json`（`test:ac15` = `playwright test --project=chromium-ac15 --no-deps --workers=1`）
- 終了コード：0
- テストの件数：5 / 0 / 0
- 出力：evidence/g3r4-repeat5-ac15.log、.json。`data-debug-load-ms` × 5 × 5 回 = 1142, 1101, 1098, 1097, 1088 / 1096, 1095, 1094, 1102, 1101 / 1098, 1101, 1097, 1101, 1112 / 1138, 1112, 1112, 1105, 1102 / 1107, 1090, 1100, 1098, 1108（最大 1,142。上限 2,000）

### コマンド 3（前半：全件。HEAD 32236ec、直す前の設定＝AC-15 も 5 workers の並列）
- コマンド：`cd backend/tests/acceptance && PLAYWRIGHT_JSON_OUTPUT_NAME=evidence/g3r3-full-run.json npx playwright test --retries=0 --reporter=list,json`
- 終了コード：1
- テストの件数：218 / 1 / 0。落ちたのは AC-15（chromium）の 1 本：5 回の値 1098, 1078, 2249, 1091, 1102（3 回目が上限 2,000 を超えた）
- 出力：evidence/g3r3-full-run.log、.json。扱いは 4 章（原因は並列の負荷。指揮役の決定 (b) で契約 W-11 に「並列にしない」が入り、設定を直してコマンド 1、2）

### コマンド 4（前半：影響「大」の AC、`DESIGN_` の全件、一度でも落ちたテストを 5 回ずつ）
- コマンド：`cd backend/tests/acceptance && PLAYWRIGHT_JSON_OUTPUT_NAME=evidence/g3r3-repeat5.json npx playwright test -g 'AC(1|2|5|6|7|8|9|10|11|12|13|14|16|18|19|20|23|24|25|28|31|32|33|35|36|37)_|DESIGN_' --repeat-each=5 --retries=0 --reporter=list,json`
- 対象：test-plan 1 章の影響「大」のリスク R1〜R6 に関わる AC と `DESIGN_` 全件、実装前の赤で落ちていたテスト（AC-8、10、18、28、31、32、20）
- 終了コード：0
- テストの件数：780 / 0 / 0（別々のテスト 156 本 × 5 回）
- 出力：evidence/g3r3-repeat5.log（792 行）、.json

### コマンド 5（前半：AC-15 を 5 回、workers 1）
- コマンド：`npx playwright test tests/ac15-load-time.spec.mjs --project=chromium --repeat-each=5 --workers=1 --retries=0 --reporter=list,json`
- 終了コード：0。件数 5 / 0 / 0。出力：evidence/g3r3-repeat5-ac15.log、.json

### コマンド 6（スクリーンショットと axe。受け入れテストの本数は変えない：tools/ は `tests/` の外で `*.spec.mjs` でない）
- コマンド：`cd backend/tests/acceptance && node tools/screenshots.mjs --out docs/verification/001-daily-learning/evidence/screenshots --browser both`（screenshots/ を空にしてから）
- 終了コード：0。撮った 179 枚（問題 0）、axe 123 画面（違反のある画面 0、incomplete 8 ノード）。出力：evidence/g3r4-screenshots-axe.log（同じコマンドの 1 回目（21:23）は 179 枚・問題 0 だったが、ログの exit の行を書く echo のパスを打ち間違えて終了コードを記録できなかったので、やり直した 2 回目をこのログにした。1 回目の PNG は 2 回目で上書きした）
- 追加：`node tools/screenshots.mjs --out … --browser both --only '^(S7_task.exhausted_allDone|S5_task.done_afterRate)$'` → 終了コード 0、7 枚（問題 0）、axe 4 画面（違反 0、incomplete 0）。出力：evidence/g3r4-screenshots-axe-added.log。design 5.1 と突き合わせて足りなかった #34（S7 allDone。5.1 冒頭は allDone も「通常」= 4 通り）と #27（S4 で答えて着く S5）の場面
- 合計：index.tsv 186 行（chromium 121、webkit 65）、PNG 190 枚（+ ダイアログの ax5 の `_tabOk.png` 4 枚）、axe 127 画面（JSON 127 個 = axe-summary.tsv 127 行）、dialog-ax5-focus.tsv 4 行すべて ok、`scrollWidth/clientWidth` は 186 行すべて等しい（横スクロール 0）、result は 186 行すべて ok
- S4 の撮り方：契約「完了の演出の確かめ方」の「スクリーンショット」の行どおり、`task.rate` になってから `waitForTimeout(1000)`、さらに `task.total.prev` が DOM から消える（件数 0）まで待って撮る（tools/screenshots.mjs の `settleS4`）。前半で chromium の `S4_task.rate_at100` が 1 回「1 秒後も prev が残っている」で撮れなかった件（evidence/g3r3-screenshots-axe.log、-at100.log）は、この直しで両ブラウザ × 2 回とも ok

### コマンド 7（キーボードの一巡。道具）
- `cd backend/tests/acceptance && node tools/keyboard-tour.mjs --browser chromium --log docs/verification/001-daily-learning/evidence/g3r4-keyboard-tour-chromium.log` → 終了コード 1。`--browser webkit` → 終了コード 1。どちらも「問題」2 件で、r1 / r2 と同じ 2 件（`settings.privacy` に止まらない：契約 identifiers.md で S8 にその要素は置かない。ダイアログの BODY：`<dialog>` の Tab がブラウザの枠（BODY）を 1 回通るネイティブの動き。design 9 の「Escape で閉じる、閉じたら呼び出し元へ戻す」は満たす）。不具合ではない。r2 との差は S5 の Tab の順に `task.next` が入ったこと（design r8 の D-45 で足したボタン。期待どおり）。ログ：evidence/g3r4-keyboard-tour-{chromium,webkit}.log、同 .stdout.log

### コマンド 8（前半：探索。使い捨てのテスト）
- `npx playwright test tests/explore-g3r3.spec.mjs --retries=0 --reporter=list,json` → 終了コード 1（8 本中 6 passed、2 failed。落ちた `EXPLORE_R2R3R4_35件` は探索テストの側の誤り：`task.next.note.last` の `{area}` `{level}` を差し込んでいなかった）→ 直して同じテストだけ → 終了コード 1（再読み込み後の同じ差し込み）→ 直して → 終了コード 0（2 passed）。ログ：evidence/g3r3-explore.log、-2.log、-3.log、exploration/g3r3-explore*.json、手順ごとの記録と PNG は exploration/g3r3/。spec は tests/ から消し、写しを exploration/g3r3/explore-g3r3.spec.mjs.txt に残した（`npx playwright test --list` は 219 本）

### コマンド 9（backend の `npm test`。backend/package.json は変えていない）
- コマンド：`cd backend && npm test`（= `check:contracts` → `test:unit` → `test:acceptance`（`cd tests/acceptance && npm ci && npx playwright install chromium webkit && npx playwright test`））
- 終了コード：0（2026-11-05 21:33、1 回。他に受け入れテストを動かす役はいない）。契約の検査：見本 52 件、期待と違う結果 0 件。単体：pass 158 / fail 0 / skipped 0。受け入れ：219 passed（chromium 109、webkit 109、chromium-ac15 1。AC-15 は 219 本目で最後に 1 本だけ。1.7m）
- 出力：evidence/g3r4-npm-test.log

### コマンド 10（契約が受け入れテストに求めた検査）
- `cd backend/tests/acceptance && npm run check:seeds` → 終了コード 0、自己検査 21 件、期待と違う結果 0 件
- `npx playwright test --list` → `Total: 219 tests in 23 files`（chromium 109、webkit 109、chromium-ac15 1）
- 予算の受け入れテスト `BUDGET2_`：平均の字数 390.6（210 件。上限 480）、gzip 後 69,313 バイト（上限 105,000）。両ブラウザで passed（コマンド 1）

## 2. 受け入れ条件ごとの結果
動いたテストの数は chromium + webkit の合計（コマンド 1。AC-15 は chromium-ac15 だけ：W-11）。飛ばしたテストは全 AC で 0。annotation の値は evidence/g3r4-full-run.json から写した。スクリーンショットのパスは evidence/screenshots/ からの相対（chromium。webkit は webkit/ の下に同名）。
| AC | 結果（PASS / FAIL / 未検証） | 動いたテストの数 | 飛ばしたテストの数 | 証拠（テストの名前、ログの行、スクリーンショットのパス） |
|---|---|---|---|---|
| AC-1 | PASS | 2 | 0 | AC1_初めて開くと診断が始まり3問で終わる_進み具合n/3_切り替え500ms以内。計った時間 ms（始める→1、1→2、2→3、3→課題）：chromium 5, 2, 1, 4、webkit 0, 1, 1, 2（上限 500、500、500、1,000）。S1_diagnosis.start_{light,dark,ax5,en,w320}.png、S2_question_1〜3_light.png |
| AC-2 | PASS | 6 | 0 | AC2_…_backend_intermediate / _frontend_beginner / _git_advanced。確定 → task.today ms：chromium 7 / 3 / 3、webkit 1 / 2 / 2（上限 1,000）。S3_task.today_{light,dark,ax5,en}.png |
| AC-3 | PASS | 2 | 0 | AC3_課題集の全件が4要素を持ち所要時間が1〜15分（配布物の data/tasks.json を HTTP で全件） |
| AC-4 | PASS | 2 | 0 | AC4_課題集は210件以上で初級と中級の12組が14件以上_上級の6組が7件以上_IDの重複が0件。全体 210、12 組すべて 14、6 組すべて 7 |
| AC-5 | PASS | 4 | 0 | AC5_完了するとtask.rateになり_答えるとtask.done_…issuedは4のまま、AC5_完了して答えずに再読み込みするとtask.doneになり_issuedは4のまま。S4_task.rate_light.png、S5_task.done_{light,dark,ax5,en}.png、S5_task.done_afterRate_light.png |
| AC-6 | PASS | 2 | 0 | AC6_翌日には過去に出した課題のIDと一致しない課題が出る |
| AC-7 | PASS | 6 | 0 | AC7_too_hard / too_easy / no_time を申告するとtask.skippedになり…。S6_task.skipped_too_hard_{light,dark,ax5,en}.png、_too_easy_light.png、_no_time_light.png |
| AC-8 | PASS | 22 | 0 | AC8_1通り目〜9通り目（5a、5b を含む 10 本）+ AC8_10通り目（同じ日に 2 件 → next で beginner）。翌日の段階：1 beginner、2 advanced、3〜5b intermediate、6 beginner、7 advanced、8 beginner、9 intermediate、10 intermediate → intermediate → beginner（test-plan 2 章の期待と同じ）。S6_task.skipped_levelChanged_light.png |
| AC-9 | PASS | 8 | 0 | AC9_役に立った / 立たなかった / 選ばずに再読み込み / 今回は答えない（4 本 × 2） |
| AC-10 | PASS | 8 | 0 | AC10_初級を出し終えて翌日に読み込む／同じ日にtask.nextを押すと_levelDone…、AC10_上級を出し終えて…_allDone…（4 本 × 2）。S7_task.exhausted_levelDone_{light,dark,ax5,en}.png、S7_task.exhausted_allDone_{light,dark,ax5,en}.png |
| AC-11 | PASS | 2 | 0 | AC11_2問目の保存が失敗してもerror.storage.messageと選択が残り_…。S2_error_storage_light.png |
| AC-12 | PASS | 4 | 0 | AC12_オフラインでもAC-1_AC-2_AC-5_AC-9_AC-33の操作が動き_送信は0件（切り替え ms chromium 3, 2, 0, 13、webkit 1, 1, 1, 2。task.next → 課題 1 ms）、AC12_オフラインでもAC-7の申告が動き_送信は0件。送信 0 件 |
| AC-13 | PASS | 6 | 0 | AC13_persistを断られても…（persist() は診断を終えた読み込みで 1 回、再読み込み後 0 回、device {persistRequested: true}）、AC13_印のない保存データで…task.next…1 回、AC13_…advance…1 回。S8_settings_notPersisted_light.png |
| AC-14 | PASS | 4 | 0 | AC14_今日の課題を出していない日に…（seed 14 行、最後の 3 行 done、今日 2026-09-15）、AC14_今日の課題が出ている日に…（やり直しの前 backend-intermediate-004 → 完了 → next で frontend）。S2_redo_fromSettings_light.png |
| AC-15 | PASS | 1（chromium-ac15 だけ：W-11） | 0 | AC15_遅い回線とCPU4倍の制限でキャッシュなしに開き_data-debug-load-msが5回とも2000以下。HEAD で全件の中 1 回（1120, 1089, 1096, 1101, 1097）+ 単独 5 回（最大 1,142）。前半の揺れの扱いは 4 章 |
| AC-16 | PASS | 2 | 0 | AC16_すべてのデータを削除すると再読み込みでdiagnosis.startになり_やり直した後の履歴は0件。dialog_settings.delete.confirm_{light,dark,ax5,en}.png、S10_history_empty_light.png |
| AC-17 | PASS | 8 | 0 | AC17_diagnosis.start / task.today / task.done / task.exhausted.levelDone_横スクロール0_切り詰め0_操作できる要素がすべて押せる。scrollWidth 320 / 320。S1_diagnosis.start_w320.png、S3_task.today_longest_inline_code_w320.png |
| AC-18 | PASS | 2 | 0 | AC18_移動キー(Tab系)とEnter_Spaceだけで診断から完了まで進み_操作した要素がfocus-visibleで枠が3px以上（chromium Tab、webkit Alt+Tab。`years.never` を Space で選ぶ）。全要素 focusVisible true、outline 3 px |
| AC-19 | PASS | 2 | 0 | AC19_書き出すとJSONが1つダウンロードされ_…（kyounoitte-2026-11-03.json）。S8_export_done_light.png |
| AC-20 | PASS | 2 | 0 | AC20_保存データのないブラウザで読み込むと_…（読み込み後の状態 task.done）。dialog_settings.import.confirm_{light,dark,ax5,en}.png、dialog_settings.import.confirm_error_storage_light.png |
| AC-21 | PASS | 6 | 0 | AC21_iOS_Safari…、AC21_iPadOS_Safari…、AC21_UAを偽装しない…0回。S1_addToHomeScreen_{light,en}.png、S8_homeScreen_guide_{light,en}.png |
| AC-22 | PASS | 2 | 0 | AC22_スタンドアロンで初めて開くと読み込みの案内が出て_…。S1_standalone_import_light.png、S1_standalone_import_error_light.png |
| AC-23 | PASS | 4 | 0 | AC23_task.today…、AC23_task.done…。表示までの ms（再読み込み / 新しいタブ）：chromium 64 / 115、68 / 109、webkit 123 / 152、126 / 87（上限 3,000）。送信 0 + 0 件 |
| AC-24 | PASS | 2 | 0 | AC24_統計の11の値が期待どおりで_数値9つと日付1つは同じ文字が見え_真偽値はfirstDayCompleted.yesの文言が見える。S9_settings.stats_{light,dark,ax5,en}.png |
| AC-25 | PASS | 2 | 0 | AC25_版番号が新しいファイルはerror.import.messageで拒み_履歴1件と診断と状態は変わらない。S8_import_error_version_light.png |
| AC-26 | PASS | 4 | 0 | AC26_en-US…一致し_キーの差が0件（ja 174、en 174）、AC26_ja-JP…。S1_diagnosis.start_en.png ほか `_en.png` 21 枚 |
| AC-27 | PASS | 14 | 0 | AC27_<6 画面。task.exhausted は levelDone と allDone>_axe-coreでserious以上の違反が0件（7 本 × 2）。violations 0（passes 10 / 12 / 21 / 10 / 10 / 10 / 20）。7 章 |
| AC-28 | PASS | 2 | 0 | AC28_差し替え後2秒おきの再読み込み3回以内で…。data-build-version × 3：2026-11-30.1 → 2026-12-14.1 → 2026-12-14.1 |
| AC-29 | PASS | 2 | 0 | AC29_各組でexternalが20%以下_in_appにURLもtoolsもなく_externalはtoolsが1件以上。external は初級の 6 組に各 1/14 |
| AC-30 | PASS | 4 | 0 | AC30_in_appを出し終えた翌日はexternalの課題が出て_印と要る道具が題名と同じ画面に見える（backend-beginner-013、tools ["ブラウザ"]）、AC30_in_appの課題を出した日は…印が0件。S3_task.today_external_{light,en}.png |
| AC-31 | PASS | 4 | 0 | AC31_診断済みで開くと操作0回でtask.todayが見え_…重なる要素0件、AC31_今日の課題を完了済みなら…。dialogs 0、modals 0、fixed [] |
| AC-32 | PASS | 10 | 0 | AC32_200文字を入力して再読み込みすると…／…新しいタブで開くと…／…翌日に開くと…noneの行のanswerに残る／…開いたまま翌日になった後に…完了を押すと…／…保存を待たずに…（5 本 × 2）。前日の行 {2026-11-04, backend-intermediate-004, none, answer 200 文字}。S3_answer_saved_light.png、S3_answer_limit_light.png |
| AC-33 | PASS | 4 | 0 | AC33_task.done／task.skippedからtask.nextで1秒以内に同じ日の2件目と3件目が出て…（2 本 × 2）。next → 課題 ms：2, 4 / 4, 2。ID の順 backend-intermediate-001 → … → 006。S3_task.today_nth2_light.png |
| AC-34 | PASS | 2 | 0 | AC34_初級の全件がminutes10以下で6語が0件でexternalのtoolsがブラウザか開発者ツールを含む（初級 84 件、external 6） |
| AC-35 | PASS | 10 | 0 | AC35_累計6 / 10 / 29 / 99で完了すると…data-milestoneが7 / none / 30 / 100…（4 本 × 2）、AC35_ja.jsonとen.jsonの全キーの値に…0件（348 値）。S4_task.rate_total11_{light,dark,ax5,en}.png、S4_task.rate_at7_{light,dark,ax5,en}.png、S4_task.rate_at30_light.png、S4_task.rate_at100_light.png |
| AC-36 | PASS | 2 | 0 | AC36_3件出した翌日のtask.todayのdata-progress-indexが4でtotalが14で_同じ2つの数がtask.progressの文言に見える |
| AC-37 | PASS | 2 | 0 | AC37_金曜にtask.nextで出た課題を完了すると…days-completed-weekが3で…翌週の月曜は0（2026-11-06: 3、2026-11-09: 0） |
| AC-38 | PASS | 6 | 0 | AC38_課題集の全件のinsightが…1〜120字…（210 件、最長 85 字）、AC38_task.todayではtask.insight.textが0件で_完了するとtask.rateとtask.doneにその課題のinsightが見え_再読み込みしても見える、AC38_難しすぎを申告したtask.skippedでは…0件 |
| AC-39 | PASS | 4 | 0 | AC39_1問目の6つの領域にarea.descの説明が見え_jaとenの文言ファイルで6件とも1〜40字（ja 15〜20、en 32〜39）、AC39_幅320で1問目を表示するとscrollWidthが320以下。S2_question_1_{light,dark,ax5,en}.png |
| AC-40 | PASS | 2 | 0 | AC40_3問目の選択肢が5つでyears.neverのvalueがneverで_選んで終えると書き出しのdiagnosis.yearsがnever。S2_question_3_light.png |

AC 番号のないテスト（AC の表とは別。契約 W-6）：
| 名前の接頭辞 | 根拠 | 本数（chromium + webkit） | 結果 | 証拠 |
|---|---|---|---|---|
| `BUDGET2_` | 契約 budgets.md 2、W-6 | 4 | PASS | 平均 390.6 字、gzip 後 69,313 バイト |
| `DESIGN_D30_`（S3 の知らせ、`task.rate` のまま翌日の評価、最後の課題の翌日に S7 の知らせ、知らせのある S3 で申告の保存の失敗、知らせのある S3 の axe） | design D-30、data.md 4、identifiers.md 3 | 10 | PASS | S3_task.today_dayChanged_{light,dark,ax5,en}.png、S7_task.exhausted_dayChanged_{light,dark,ax5,en}.png。axe serious 以上 0 |
| `DESIGN_D31_`（`persisted()` が 1,000 ms までに返らないと注意なしで描く、待つ間の `diagnosis.next`、待つ間の未選択の `diagnosis.next`） | data.md 11、W-9、design D-31 | 6 | PASS | S8 を描くまで 1,023 ms（上限 1,000、stub は 3,000 ms 後）。2 回目の「やめる」から S8 まで 802 / 802 ms（stub 800） |
| `DESIGN_D40_`（S7 の `seenNext`、`nextDone`） | design D-40、5.1 #33 と #53 | 4 | PASS | S7_task.exhausted_seenNext_light.png、S7_task.exhausted_nextDone_light.png |
| `DESIGN_D43_`（reduce で getAnimations 0・prev 0、reduce でないとき ≥1。描いた直後の累計が最終の値） | design D-43、契約「完了の演出の確かめ方」 | 4 | PASS | コマンド 1 |
| `DESIGN_D44_`（S5 の `note.last`、S6 の `levelChanged` + `note.last`） | design D-44、5.1 #51 と #54 | 6 | PASS | S5_task.done_note.last_light.png、S6_task.skipped_levelChanged_note.last_light.png |
| `DESIGN_U15_`（初回の S2 で日付が変わった後の確定） | design 10 の U-15、data.md 4 | 2 | PASS | firstOpenDate 2026-11-03、completedOn と課題の日付 2026-11-04 |

## 3. 状態ごとの結果
| 状態 | 選んだもの（自動 / G4 の人 / 範囲外） | 結果 | 証拠のパス、または理由 |
|---|---|---|---|
| 初めて起動 | 自動 | PASS | 新しいコンテキスト（保存、SW、キャッシュが空）で AC-1、2、11、12、13、18、21、22、26、27、39、40。S1_diagnosis.start_light.png、S2_question_1_light.png |
| データがある | 自動 | PASS | addInitScript の seed（W-7。配布物の課題集と ID を照らす）で AC-5〜10、13〜17、19、20、23〜25、28、30〜33、35〜38。S3_task.today_light.png、S5_task.done_light.png、S10_history_{light,dark,ax5,en}.png |
| 前の版からの更新 | 自動（配布物の版）＋範囲外（保存データの版） | PASS（配布物） | AC-28：旧 2026-11-30.1 → 新 2026-12-14.1 で履歴 3 件と診断と段階が同じ。保存データの formatVersion は 1 が最初の版で前の版がない（data.md 6。版 2 は AC-25 で拒む）。課題 ID の付け替え前の保存データは未公開（ADR 0002 (e)、test-plan 9） |
| オフライン、サーバーエラー | 自動（オフライン）＋範囲外（サーバーエラー） | PASS（オフライン） | AC-12（操作。AC-33 の task.next を含む）、AC-23（再読み込みと新しいタブ）。静的ホスティングの 5xx はアプリの画面がない（design 5 の冒頭、test-plan 9） |
| 権限を断った | 自動（その場、返らない、遅い）＋範囲外（あとから） | PASS | AC-13 の 3 本（`persist()` と `persisted()` を false に注入、呼ぶ回数）、`DESIGN_D31_` 3 本。S8_settings_notPersisted_light.png。あとから撤回する操作は Web の persist にない。補足：注入なしでも headless の両ブラウザは `persisted()` に false を返すので S8_settings_light.png にも注意が出る（11 章の提案 3） |
| バックグラウンドから復帰 | 自動（タブの切り替えで代える）＋範囲外（Web に電話などの割り込みはない） | PASS | AC-32（新しいタブ、開いたまま翌日）、AC-23（新しいタブ）、`DESIGN_D30_`、`DESIGN_U15_`。探索 R3_U17（8 章） |
| 言語と地域（ja、en） | 自動 | PASS | AC-26（en-US、ja-JP。キー 174 = 174）。英語の全画面：`_en.png` 21 枚（index.tsv の lang=en 20 枚。S0_loading_en は JS を止めて撮るので lang は殻の ja のまま）。英語が長い置き場所（S3 external、S8 の案内、S1 の案内、S7 allDone）の `_en.png` に切れ・重なりなし |
| 大きい文字、ダークモード | 自動（幅 320、文字 200%、ダーク）＋G4 の人（実機の OS の文字サイズ最大とダーク） | PASS | AC-17、AC-39（幅 320）。`_ax5.png` 20 枚（ルートの font-size 32px。横スクロール 0）、`_dark.png` 18 枚、`_w320.png` 3 枚。dialog-ax5-focus.tsv の 4 行すべて ok（200% でも初期フォーカスの「やめる」と、移動キー 3 回で届く「置き換える／削除する」が表示域の中）。探索 R8_320_200（S1〜S5 の 7 画面で scrollWidth 320、はみ出す要素 0） |
| 容量不足、割り込み | 自動（容量不足の注入）＋範囲外（割り込み） | PASS | AC-11（QuotaExceededError）、`DESIGN_D30_`（知らせのある S3 で申告の保存の失敗）、探索 R3_U17（日付が変わった後の task.next の保存の失敗 → retry 1 回で復帰）。撮影：S2 / S3 ×2 / S4 / S5 / S6 / S7 / ダイアログの保存の失敗（design 5.1 #12、#19、#20、#26、#29、#50、#36、#45） |

design 5.1 の 54 行とテスト・道具の対応は evidence/g3r3-state-table.md（前半）。後半で変わった行：#25（S4 節目 100：両ブラウザ ok）、#27（S5_task.done_afterRate を足した）、#34（S7_task.exhausted_allDone の 4 通りを足した）、#45（dialog_settings.import.confirm_error_storage を足した。未撮影 → ok）。54 行すべてに自動のテストか道具の証拠がある。

## 4. 揺れの確認
| テストの名前 | コマンド | 回数 | 落ちた回数 | 原因の型 |
|---|---|---|---|---|
| 影響「大」の AC（AC-1、2、5〜14、16、18〜20、23〜25、28、31〜33、35〜37）と `DESIGN_` 全件、実装前の赤で落ちていたテスト。156 本（両ブラウザ） | コマンド 4（32236ec。実装は HEAD と同じ） | 5 × 156 = 780 | 0 | — |
| AC15_（chromium） | コマンド 3（5 workers の並列） | 1 | 1（5 回の値のうち 1 回が 2,249 ms） | 環境（並列の負荷）。test-plan 1 章で R10 は影響「小」。CPU 4 倍の制限の下で他の 4 worker が同時にビルド・ブラウザ・axe を動かすと、アプリの速さでなく機械の空きを測ることになる。指揮役の決定 (b)（docs/approvals/delegation.md 2026-11-05）で契約 W-11 に「他のテストと並列にしない」が入り、期待値 2,000 と 5 回は変えない |
| AC15_（chromium） | コマンド 5（32236ec、workers 1） | 5 | 0 | — |
| AC15_（chromium-ac15） | コマンド 1（HEAD。全件の後に 1 本だけ）、コマンド 2（HEAD、workers 1） | 1 + 5 | 0 | —（30 回の計測の最大 1,142 ms。前半の 25 回も最大 1,354 ms） |

AC-15 の判定について：「同じコミットで結果が揺れるテストがある AC は未検証」の決まりに照らすと、32236ec の並列の実行では 1 回落ちた。落ちた条件（並列）は契約が禁じた条件で、契約の条件（並列にしない）の下では 32236ec で 5 回、HEAD で 6 回（計測 55 回）とも上限の半分近くで通り、値のばらつきは 1,078〜1,354 ms に収まる。これを「環境の条件を契約で確定した上で揺れなし」と判定し、AC-15 を PASS にした。この読み方に異論があれば AC-15 だけを「未検証」に差し替える（他の AC の判定は変わらない）。

## 5. 受け入れテストの変更
- この機能のテストを最初に入れたコミット：a6facf4（`git log --oneline origin/main..HEAD -- backend/tests/acceptance` のいちばん下）
- 判定済みの範囲：G2 の受け入れテストの判定（reviewer r3、tech-lead r5。コミット e1b2b71）まで。その後の変更は `git log e1b2b71..HEAD -- backend/tests/acceptance` の 1 件（4fa1857）と、この r3 の作業ツリーの 4 ファイル（`git status --short backend/tests/acceptance`）。`git diff 4fa1857..HEAD -- backend/tests/acceptance` は空。
| ファイル:行 | 何を変えたか | PRD の根拠（AC 番号と PRD の文） |
|---|---|---|
| コミット 4fa1857：tests/ac17-ac18-ac27-a11y.spec.mjs（3 問目で選ぶ radio を `years.lt1` → `years.never`）、tests/ac35-ac37-done-screen.spec.mjs（`DESIGN_D43_` の reduce の側でも S4 に着いた直後の 1 回の evaluate で `data-stat-completed` と文言を読み、7 と比べる expect を 2 行足した）、helpers/seed.mjs、helpers/check-seeds.mjs（seed の自己検査） | 既存の Then を弱めた行はない（消した expect は `years.lt1` → `years.never` の同じ確かめ） | AC-18 When「Tab、Shift+Tab、Enter、Space だけ」（矢印キーを含まないので radio の組で選べるのは先頭）と AC-40「3 問目の選択肢が 5 つで先頭が `years.never`」。AC-35 Then「`task.total.value` の `data-stat-completed` が 7」と契約「完了の演出の確かめ方」（reduce の有無によらず S4 に着いた直後に読んだ値が最終の値）。G2 code reviewer r5 の記録（docs/reviews/001-daily-learning-G2-code-reviewer-r5.md）が参照 |
| playwright.config.mjs（r3、未コミット） | project を chromium、webkit、chromium-ac15 の 3 つに。chromium と webkit は `testIgnore: /ac15-/`、chromium-ac15 は `testMatch: /ac15-/`、`dependencies: ['chromium', 'webkit']`（全件の後に動く）、`fullyParallel: false`。`retries: 0`、timeout、expect、use は変えていない | 契約 test-hooks.md「W-11 AC-15 の制限」の行「AC-15 は他のテストと並列にしない（AC-15 だけを workers 1 で別に流す）」（7a59e84）。AC-15 の期待値 2,000 ms と 5 回（PRD AC-15 Then）は変えていない。テスト（tests/ac15-load-time.spec.mjs）も変えていない |
| package.json（r3、未コミット） | scripts に `test:ac15`（`playwright test --project=chromium-ac15 --no-deps --workers=1`）を足した。`test` と `check:seeds` はそのまま | 同上（AC-15 だけを workers 1 で別に流す入口）。依存は変えていない（contracts/dependencies.md の 3 件のまま） |
| README.md（r3、未コミット） | 上の 2 つの説明 | — |
| tools/screenshots.mjs（r3、未コミット。受け入れテストではない） | `settleS4`：1 秒待った後に `task.total.prev` の件数が 0 になるまで待つ（`waitForFunction`。前は 1 秒後に 0 でなければ error）。場面を 3 つ足した：`dialog_settings.import.confirm_error_storage`（5.1 #45）、`S7_task.exhausted_allDone`（5.1 #34。4 通り）、`S5_task.done_afterRate`（5.1 #27） | 契約「完了の演出の確かめ方」の「スクリーンショット」の行（7a59e84）。design 5.1 の #45、#34（冒頭「S7 の levelDone / allDone は 4 通り」）、#27。判定の基準（AC の Then）は変えていない |

`npx playwright test --list` は 219 本（4fa1857 の時点と同じ。project の分け方を変えても本数は変わらない）。

## 6. 検査の件数
受け入れテストのフォルダの tests、helpers、server、global-setup.mjs、playwright.config.mjs（node_modules、tools、test-results を除く）。tools/screenshots.mjs の `waitForTimeout(1000)` 1 か所は契約「完了の演出の確かめ方」の「スクリーンショット」の行が指定した待ち（演出を終わらせるため。受け入れテストではない）。
| 検査 | コマンド | 件数 | 理由 |
|---|---|---|---|
| sleep で待つ | `grep -rnE 'sleep\(\|usleep\|Thread\.sleep\|time\.sleep\|asyncio\.sleep\|waitForTimeout' tests helpers server global-setup.mjs playwright.config.mjs` | 0 | — |
| 飛ばす、失敗を許す | `grep -rnE 'XCTSkip\|XCTExpectFailure\|pytest\.mark\.skip\|skipif\|xfail\|pytest\.skip\|unittest\.skip\|test\.skip\|test\.fixme\|test\.only\|\.skip\(' …` | 0 | — |
| 再試行 | `grep -rniE 'retry\|rerun' …` | 0（文字列の一致は 5 件：tests/ac11-ac13-storage.spec.mjs:28、:33、tests/design-d30-day-changed.spec.mjs:185（コメント）、:194、:200。すべて契約の識別子 `error.storage.retry` で、再試行ではない） | 設定は `retries: 0`、判定のコマンドは `--retries=0` |
| 中を覗く import | `grep -rn '@testable' …` と、`import … from` の行で node:、@playwright/test、@axe-core/playwright、ajv、./、../helpers、../server 以外のもの | 0 | backend/public、backend/scripts の import なし。配布物は HTTP、ビルドは CLI（spawnSync） |
| AC 番号の抜け（PRD にあってテストにない、その逆） | `grep -oE 'AC-[0-9]+' docs/prd/001-daily-learning.md \| sort -u` と `grep -rhoE "test\(.AC[0-9]+_" tests \| grep -oE 'AC[0-9]+' \| sort -u` の diff | 0（AC-1〜AC-40 の 40 個が両方にある） | AC 番号のないテストは `BUDGET2_` 2 本と `DESIGN_` 16 本（契約 W-6。2 章の別表） |
| 表示の文字や並び順で探す | `grep -rnE "getByText\|getByLabel\|text=\|hasText\|getByRole\|\.nth\(\|boundBy\|\.first\(\)\|\.last\(\)" tests helpers` | 7 | `getByRole('dialog')` 2 件（ac31:12、ac33:20）は契約「AC-31 の重なる要素の数え方」1 が指定した数え方。`.nth()` 5 件（ac19:79 履歴 3 行目の answerText、ac10:139-140 道具の項目の全件ループ、ac17:100 操作できる要素の全件ループ、helpers/app.mjs:210 履歴の行の全件ループ）は data-testid で絞った集合の繰り返しで、並び順で 1 つを選ぶものではない |

## 7. アクセシビリティ監査
受け入れテスト AC-27（PRD の 6 画面。`task.exhausted` は levelDone と allDone の 2 変種で 7 本 × 2 ブラウザ。タグ wcag2a / wcag2aa / wcag21a / wcag21aa、serious 以上 0 件が Then）と `DESIGN_D30_task.today.dayChanged_axe-core…`（同じ規則）に加えて、道具で design 5.1 の全画面・全状態（63 場面）に axe-core を流した（同じタグ。ライトと幅 320 の変種。chromium 65 画面 + webkit 62 画面 = 127）。結果の JSON：evidence/screenshots/axe/<browser>_<場面>_<変種>.json（127 個）、一覧：evidence/screenshots/axe/axe-summary.tsv（127 行）。
| 画面 | テストの名前 | 結果 | 見つかった問題 |
|---|---|---|---|
| S0 loading、error（読めない、JSON でない、保存先が使えない、削除の確認） | tools（S0_*） | 違反 0（両ブラウザ） | 削除の確認に incomplete 1 ノード（下） |
| S1 diagnosis.start（通常、幅 320、iOS の案内、スタンドアロンの案内、案内の読み込みエラー） | AC27_diagnosis.start_…（passes 10）＋ tools（S1_*） | 違反 0 | なし |
| S2 diagnosis.question（1〜3 問目、未選択、保存の失敗、途中の再開、やり直し） | AC27_diagnosis.question_…（passes 12）＋ tools（S2_*） | 違反 0 | なし |
| S3 task.today（通常、日付が変わった知らせ、幅 320 の長いコード、external、同じ日の 2 件目、保存しました、上限、答えと申告の保存の失敗） | AC27_task.today_…（passes 21）、DESIGN_D30_task.today.dayChanged_…＋ tools（S3_*） | 違反 0 | なし |
| S4 task.rate（通常 11、節目 7 / 30 / 100、保存の失敗） | tools（S4_*。演出が終わった後に監査） | 違反 0 | なし |
| S5 task.done（seed から、S4 から、note.last、next の保存の失敗） | AC27_task.done_…（passes 10）＋ tools（S5_*） | 違反 0 | なし |
| S6 task.skipped（too_hard、too_easy、no_time、levelChanged、levelChanged + note.last、next の保存の失敗） | tools（S6_*） | 違反 0 | なし |
| S7 task.exhausted（levelDone、allDone、seenNext、nextDone、日付が変わった知らせ、advance の保存の失敗） | AC27_task.exhausted.levelDone_…、AC27_task.exhausted.allDone_…（passes 10）＋ tools（S7_*） | 違反 0 | なし |
| S8 settings（通常、保存データなし、診断の途中、notPersisted、書き出しました、読み込みエラー 2 種、ホーム画面の案内） | AC27_settings_…（passes 20）＋ tools（S8_*） | 違反 0 | なし |
| ダイアログ settings.import.confirm（通常、保存の失敗）、settings.delete.confirm | tools（dialog_*） | 違反 0 | incomplete 1〜2 ノード（下） |
| S9 settings.stats（値あり、0） | tools（S9_*） | 違反 0 | なし |
| S10 history（行あり、答えを開いた、空） | tools（S10_*） | 違反 0 | なし |

incomplete（axe が判定できなかったもの。違反ではない）：8 ノード。すべて `color-contrast`（impact serious）で、ダイアログを開いた 4 場面（`S0_error_dialog_delete`、`dialog_settings.import.confirm`、`dialog_settings.delete.confirm`：両ブラウザ。`dialog_settings.import.confirm_error_storage`：chromium の 2 ノード）のダイアログの本文 `<p>` と、保存の失敗の `.msg-error`。理由は axe の messageKey `elmPartiallyObscuring`（JSON の `incomplete[].nodes[].reasons`）。見送る理由は r2 と同じ：`<dialog>` は `showModal()` で後ろの文書と `::backdrop` の上に重なるので axe は地を決められないが、地はダイアログ自身の color.bg（不透明）で、文字は color.text と color.error。design 9 の表のとおり 16.48:1 と 5.9:1 以上（design-reviewer G3 r1 も計算して満たすと書いた）。同じ色の組は S8 本体の本文とエラー文（incomplete なし、違反なし）と同じトークン。VoiceOver と実機の Safari の確認は G4 の Takuma。

## 8. 探索セッション
前半（2026-11-05、HEAD 32236ec。実装は HEAD と同じ）。使い捨ての spec を tests/explore-g3r3.spec.mjs に書いて両ブラウザで動かし、手順ごとの記録（JSON と PNG）を evidence/exploration/g3r3/ に残し、spec は tests/ から消した（写し：exploration/g3r3/explore-g3r3.spec.mjs.txt）。期待する値は PRD 11、contracts/data.md 4、5、9、identifiers.md 3、4 から（実装は見ていない）。
### セッション 1（R2 + R3 + R4）
- チャーター：同じ日に初級 → 中級 → 上級 → allDone まで 35 件を進め、段階の規則（advance）、`data-task-nth-today`、`data-progress-index`、累計と節目、今週、issued、extra、`note.last` が手で数えた値と合うか。同じ ID が 2 回出ないか
- 区切り：予定 40 操作 → 実際 35 件 × 3 操作（完了 → 評価 → next）+ 統計と履歴の確認
- 試したこと：backend の初級 14 件 → S7 levelDone（seenNext / nextDone 0 件）→ advance → 中級 14 件 → S7 levelDone → advance → 上級 7 件 → S7 allDone（advance 0 件）。各件で nth 1〜35、progress n/14・n/7、累計 1〜35、節目 7 と 30 で `data-milestone`、`note.last` が 14、28、35 件目で出る。S7 の再読み込みで S5。統計：issued 35、completed 35、extra 34、helpful 18、rated 35、days-completed-week 1。35 件の ID に重複なし
- 見つけた不具合：なし。探索テストの側の誤り 2 回（`note.last` の `{area}` `{level}` の差し込み）を直して通した（1 章のコマンド 8）
- 証拠：exploration/g3r3/{chromium,webkit}_EXPLORE_R2R3R4_log.json、exploration/g3r3/R2R3R4_35_{chromium,webkit}/EXPLORE_S3_nth12.png、EXPLORE_S4_at7.png、EXPLORE_S4_at30.png、EXPLORE_S7_levelDone_beginner.png、EXPLORE_S7_levelDone_intermediate.png、EXPLORE_S7_allDone.png、EXPLORE_S9_after35.png、EXPLORE_S10_after35.png
### セッション 2（R3、U-17）
- チャーター：画面を開いたまま日付が変わった後の `task.next` と、保存の失敗からの再試行（U-17：再試行の入口に操作の名前を渡す。a7383da の直し）
- 区切り：予定 30 分 → 実際 約 15 操作
- 試したこと：S6（task.skipped）で日付を進め、保存の失敗を注入して `task.next` → `error.storage.retry` 1 回で `task.today`（dayChanged 0 件、翌日の 1 件目 backend-intermediate-007、progress 7/14）。current と最後の行が data.md 4 どおり
- 見つけた不具合：なし。証拠：exploration/g3r3/{chromium,webkit}_EXPLORE_U17_log.json
### セッション 3（R1）
- チャーター：書き出し → 削除 → 読み込み → 同じ日に `task.next` → 書き出し、で行と `current` と `levels` が欠けたり増えたりしないか
- 区切り：予定 40 操作 → 実際 約 20 操作
- 試したこと：書き出し e1（履歴 3 件、levels、current）→ 削除 → 読み込み（確認ダイアログ → 置き換える）→ `task.next` → 書き出し e2。e1 と e2 の diagnosis、levels、history の 3 行が同じで、e2 に next の行が 1 行足されただけ。device はこのブラウザの値
- 見つけた不具合：なし。証拠：exploration/g3r3/{chromium,webkit}_EXPLORE_R1_exports.json
### セッション 4（R8：幅 320 × 文字 200%）
- チャーター：未経験の入口（`years.never`、`area.*.desc`）、節目、修了を幅 320 CSS px と文字 200% で通し、はみ出しと横スクロールがないか
- 区切り：予定 40 操作 → 実際 約 25 操作
- 試したこと：S1、S2 の 1〜3 問目（desc 6 件、radio 5 件で先頭 `years.never`）、S3、S4 節目 7、S5 の 7 画面で scrollWidth 320 = clientWidth 320、表示域からはみ出す要素 0
- 見つけた不具合：なし。証拠：exploration/g3r3/{chromium,webkit}_EXPLORE_320_200_results.json
### セッション 5（R5：SW が有効な後のオフライン）
- r1（2026-11-03、e13d68f の実装）の exploration/R5.log（オフラインで `task.next`、advance、やり直し、送信と失敗の要求 0 件、manifest / icon / tasks.json / en.json / sw.js のオフライン応答）。HEAD では探索し直していない。HEAD の自動テスト AC-12（AC-33 の `task.next` を含む操作がオフラインで動き送信 0 件）と AC-23（再読み込みと新しいタブ）が同じ経路を覆う。13 章に書く

## 9. スクリーンショットとログ
置き場所：docs/verification/001-daily-learning/evidence/。全一覧は evidence/screenshots/index.tsv（186 行：file、browser、viewport、variant、scenario、ac、expectedState、state、lang、rootFontSize、scrollWidth/clientWidth、result）。幅 390 × 844 @2（iPhone 15 相当）、`w320` は 320 × 568。通常の状態は light、dark、ax5（ルート 200%）、en の 4 通り、ほかはライト。webkit は webkit/ の下にライト（ダイアログは ax5 も）。
| ファイル | 画面と状態 | 見た目（ライト / ダーク / AX5 / 英語） | 対応する AC |
|---|---|---|---|
| screenshots/S0_loading_{light,dark,ax5,en}.png、S0_error_invalidData_{light,dark,ax5,en}.png、S0_error_notJson_light.png、S0_error_storageUnavailable_light.png、S0_error_dialog_delete_light.png | S0（5.1 #1〜#3） | 4 通り（loading、error） | — |
| S1_diagnosis.start_{light,dark,ax5,en,w320}.png、S1_addToHomeScreen_{light,en}.png、S1_standalone_import_light.png、S1_standalone_import_error_light.png | S1（#4〜#7） | 4 通り + 幅 320 | AC-1、17、21、22、26 |
| S2_question_1_{light,dark,ax5,en}.png、S2_question_2_light.png、S2_question_3_light.png、S2_error_required_light.png、S2_error_storage_light.png、S2_redo_fromSettings_light.png、S2_resume_inProgress_light.png | S2（#8〜#13） | 4 通り（1 問目） | AC-1、11、14、39、40 |
| S3_task.today_{light,dark,ax5,en}.png、S3_task.today_external_{light,en}.png、S3_task.today_nth2_light.png、S3_task.today_longest_inline_code_w320.png、S3_answer_saved_light.png、S3_answer_limit_light.png、S3_error_storage_answer_light.png、S3_error_storage_report_light.png、S3_task.today_dayChanged_{light,dark,ax5,en}.png | S3（#14〜#21） | 4 通り（通常、dayChanged） | AC-2、17、30、31、32、33、36 |
| S4_task.rate_light.png、S4_task.rate_total11_{light,dark,ax5,en}.png、S4_task.rate_at7_{light,dark,ax5,en}.png、S4_task.rate_at30_light.png、S4_task.rate_at100_light.png、S4_error_storage_light.png | S4（#22〜#26。演出の後） | 4 通り（通常 11、節目 7） | AC-5、9、35、38 |
| S5_task.done_{light,dark,ax5,en}.png、S5_task.done_afterRate_light.png、S5_task.done_note.last_light.png、S5_error_storage_next_light.png | S5（#27〜#29、#51） | 4 通り | AC-5、31、37、38 |
| S6_task.skipped_too_hard_{light,dark,ax5,en}.png、S6_task.skipped_too_easy_light.png、S6_task.skipped_no_time_light.png、S6_task.skipped_levelChanged_light.png、S6_task.skipped_levelChanged_note.last_light.png、S6_error_storage_next_light.png | S6（#30、#31、#50、#52、#54） | 4 通り | AC-7、8、33 |
| S7_task.exhausted_levelDone_{light,dark,ax5,en}.png、S7_task.exhausted_allDone_{light,dark,ax5,en}.png、S7_task.exhausted_seenNext_light.png、S7_task.exhausted_nextDone_light.png、S7_task.exhausted_dayChanged_{light,dark,ax5,en}.png、S7_error_storage_advance_light.png | S7（#32〜#36、#53） | 4 通り（levelDone、allDone、dayChanged） | AC-10、17 |
| S8_settings_{light,dark,ax5,en}.png、S8_settings_noData_light.png、S8_settings_inProgress_light.png、S8_settings_notPersisted_light.png、S8_export_done_light.png、S8_import_error_version_light.png、S8_import_error_schema_light.png、S8_homeScreen_guide_{light,en}.png | S8（#37〜#42） | 4 通り | AC-13、19、21、25 |
| dialog_settings.import.confirm_{light,dark,ax5,en}.png、dialog_settings.import.confirm_ax5_tabOk.png、dialog_settings.import.confirm_error_storage_light.png、dialog_settings.delete.confirm_{light,dark,ax5,en}.png、dialog_settings.delete.confirm_ax5_tabOk.png | ダイアログ（#43〜#45） | 4 通り + ax5 のフォーカス | AC-16、20 |
| S9_settings.stats_{light,dark,ax5,en}.png、S9_settings.stats_zero_light.png | S9（#46、#47） | 4 通り | AC-24 |
| S10_history_{light,dark,ax5,en}.png、S10_history_answerOpen_light.png、S10_history_empty_light.png | S10（#48、#49） | 4 通り | AC-5、16、19、24、32 |
| screenshots/webkit/*.png（65 枚） | 上の全場面のライト（ダイアログは ax5 と `_tabOk` も） | ライト | 同上 |
| screenshots/axe/axe-summary.tsv、axe/*.json（127） | axe の結果（incomplete の件数と target を含む） | — | AC-27 |
| screenshots/dialog-ax5-focus.tsv | ダイアログの ax5 のフォーカス（4 行 ok） | AX5 | AC-16、20 |
| g3r4-full-run.log / .json、g3r4-repeat5-ac15.log / .json、g3r3-full-run.log / .json、g3r3-repeat5.log / .json、g3r3-repeat5-ac15.log / .json | 1 章のコマンド 1〜5 | — | 全 AC |
| g3r4-screenshots-axe.log、g3r4-screenshots-axe-added.log、g3r3-screenshots-axe.log、g3r3-screenshots-axe-at100.log | 撮影と axe のログ | — | — |
| g3r4-keyboard-tour-{chromium,webkit}.log、同 .stdout.log | キーボードの一巡 | — | AC-18 |
| g3r3-explore.log、-2.log、-3.log、exploration/g3r3/、exploration/g3r3-explore*.json | 探索（8 章） | — | — |
| g3r3-state-table.md | design 5.1 の 54 行の対応表（前半） | — | — |
| g3r4-npm-test.log | backend の `npm test` | — | — |

前半で撮った `S4_task.rate_at100_light_FAILED.png`（ccc2010 に入った失敗の写し）は、screenshots/ を空にして撮り直したので作業ツリーから消えている（index.tsv にもない）。同じく、r2 の名前のまま残っていた古い PNG と axe の JSON（`S3_task.today_backend-beginner-005_w320`、`S4_task.rate_{ax5,dark,en}`、`S7_task.exhausted_{light,dark,ax5,en}`。r3 の場面の名前は `S3_task.today_longest_inline_code_w320`、`S4_task.rate_total11_*`、`S7_task.exhausted_levelDone_*`）も消えている（`git status` の D の行）。index.tsv の 186 行と、フォルダの PNG（190 枚 = 186 + `_tabOk` 4）は 1 対 1。

## 10. 前の機能の受け入れテスト（回帰）
| 機能 | コマンド | 終了コード | 成功 / 失敗 / 飛ばした |
|---|---|---|---|
| 該当なし（001 が最初の機能。前の機能の受け入れテストはない） | — | — | — |

## 11. 見つかった問題
AC の範囲の不具合はなし。
| # | 内容 | 再現の手順 | 再現するテストの名前 | AC | 重大度（重大 / 要修正 / 提案） | 直す役 |
|---|---|---|---|---|---|---|
| 1 | AC-15 が全件の並列実行で 1 回だけ 2,249 ms（4 章）。設定と契約で解決済み | 32236ec の設定で `npx playwright test`（5 workers） | AC15_（コマンド 3） | AC-15 | 提案（環境。実装の不具合ではない） | verifier（済：playwright.config.mjs、package.json） |
| 2 | 撮影の道具の S4 at100 が 1 回「1 秒後も prev が残っている」（前半）。契約の撮り方に合わせて解決済み | — | — | — | 提案（道具） | verifier（済：tools/screenshots.mjs） |
| 3 | headless の Chromium / WebKit は `persisted()` に false を返すので、注入なしの S8 でも `settings.storage.notPersisted` が出る（S8_settings_light.png）。実機で許可されれば消える（D-31 で S8 は毎回 `persisted()` を読む） | S8 を開く | — | — | 提案（撮影の環境） | G4 で Takuma が実機の見た目を確認 |
| 4 | キーボードの一巡の「問題」2 件（`settings.privacy` に止まらない、ダイアログの Tab が BODY を通る）は仕様どおり（1 章のコマンド 7） | — | — | — | 提案（道具の判定の読み方） | — |

## 12. PRD とテストの食い違い
なし。この r3 で受け入れテスト（tests/、helpers/）は 1 行も直していない。
| AC | PRD の文 | テストか実装のふるまい | 決めてほしいこと |
|---|---|---|---|
| — | — | — | — |

## 13. 未検証のものと理由
- 実機の Safari 17（iOS、iPadOS、macOS）と Chrome：Playwright の WebKit 27.2 と Chromium 156 は Safari 17 そのものではない（契約 budgets.md 5）。`pathLength`、`<dialog>`、SW の動きは実機で G4 の Takuma が見る。
- VoiceOver、実機の OS の文字サイズ最大、ダークの実機の見た目、ホーム画面への追加とスタンドアロン（test-plan 9）：G4 の人。
- Linux の CI：`npx playwright install-deps` が要るかは未確認（ADR 0004、CLAUDE.md）。この報告はすべて macOS で動かした。CI の緑は指揮役が確かめる。
- R5（SW が有効な後のオフライン）の探索は r1 の実装（e13d68f）に対するもので、HEAD では自動テスト AC-12 と AC-23 だけ（8 章のセッション 5）。
- `app.json` の commands.backend_test はまだ空（CLAUDE.md。Takuma の決定 D8）。CI がどのコマンドで受け入れテストを流すかは、この報告の範囲の外。
