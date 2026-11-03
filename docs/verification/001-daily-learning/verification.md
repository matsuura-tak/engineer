# 検証レポート 001-daily-learning：診断と今日の学習（Web アプリ「今日の一手」）

判定：PASS

- 関門：G3（機能完了）　r2（design-reviewer G3 r1 の FAIL を受けた design r6、契約 f40c61a、受け入れテスト 155 本、実装 1560b36 の上でやり直した。r1 は e13d68f の上の 2026-11-03 の報告）
- 検証した役：verifier　日時：2026-11-04 01:25〜01:40（JST）
- コミット：1560b36c8d2f946b0dc063b8fbce9e07d22f87a1（feat/001-daily-learning の最新）。作業ツリーの受け入れテストの変更は、この r2 で足した `DESIGN_D31_` 1 本（tests/design-d31-persisted-wait.spec.mjs）と、証拠を撮る道具 tools/screenshots.mjs の直しだけ（5 章）
- 環境：macOS 27.2（26B123）、Node v24.22.1、@playwright/test 1.64.1、Chromium 156.0.8078.4（chromium-1248）、WebKit 27.2（webkit-2370）、@axe-core/playwright 4.14.0、ajv 8.20.0。iOS のアプリはないので Xcode とシミュレーターは使わない。接続先：受け入れテストのフォルダの静的サーバー `http://127.0.0.1:<port>/engineer/`（配布物は `backend/scripts/build.mjs --version 2026-11-30.1` で mkdtemp の一時フォルダにビルド）。timezoneId Asia/Tokyo、locale ja-JP（AC-26 の 1 本だけ en-US）
- 読み替え（test-plan の冒頭と同じ）：「シミュレーター」は Playwright の Chromium と WebKit、「再起動」は再読み込みと新しいタブ、「AX5」はルートの文字サイズ 200%（9 章）と幅 320 CSS px、「performAccessibilityAudit()」は axe-core。
- G3 の FAIL 条件の確認：FAIL か未検証の AC 0 件、飛ばしたテスト 0 件、揺れたテスト 0 件、PRD の根拠のない受け入れテストの変更 0 件、0 件であるべき検査はすべて 0 件（6 章）。design-reviewer G3 r1 の verifier 向けの指摘 1、2、7 と提案 12 はすべて閉じた（9 章の表、7 章）。

### design-reviewer G3 r1 の指摘への答え（verifier 分）
| 指摘 | 答え | 証拠 |
|---|---|---|
| 1（重大）S6 と S0 loading の通常の 4 通りがない | S6 task.skipped（too_hard）と S0 loading を light / dark / ax5 / en の 4 通りで撮った。新しい状態 S3 / S7 の `task.dayChanged` も 4 通り | evidence/screenshots/S6_task.skipped_too_hard_{light,dark,ax5,en}.png、S0_loading_{light,dark,ax5,en}.png、S3_task.today_dayChanged_{light,dark,ax5,en}.png、S7_task.exhausted_dayChanged_{light,dark,ax5,en}.png |
| 2（要修正）ダイアログの ax5 で主な操作が見えない | 文字を 200% にしてからダイアログを開き、表示域だけを撮った（fullPage でない）。初期フォーカスの「やめる」は表示域の中（top 627〜bottom 728 / 844）。移動キー（chromium Tab、webkit Alt+Tab）3 回で「削除する」「置き換える」に届き、届いた ok も表示域の中（top 501〜603）。両ブラウザ × 2 ダイアログの 4 組とも ok | evidence/screenshots/dialog-ax5-focus.tsv、dialog_settings.{delete,import}.confirm_ax5.png と `_ax5_tabOk.png`（webkit/ にも同名） |
| 7（要修正）axe の画面数と incomplete の記録 | 95 画面で、JSON 95 個 = axe-summary.tsv 95 行 = この報告の 95。incomplete は JSON に target、html、理由（messageKey と data）を残し、axe-summary.tsv に件数と target の列を足した。6 ノードすべて同じ 1 種で、見送る理由は 7 章 | evidence/screenshots/axe/axe-summary.tsv、axe/*.json |
| 12（提案）英語が長い 3 つの文言の置き場所の en | `S3_task.today_external_en.png`（Outside the browser）、`S8_homeScreen_guide_en.png`（Show how to add to the Home Screen）、`S1_addToHomeScreen_en.png`（steps.4）。切れ・重なり・横スクロールなし | index.tsv の scrollWidth/clientWidth（全 148 行で等しい） |
| 4〜6（backend-engineer の直し。見えること） | リンクと `<summary>` の左端が列の線にそろった（S5 / S6 / S8 / S9 / S10 の `_light.png`、`S6_task.skipped_too_hard_ax5.png` の「履歴を見る」）、副操作のボタンが列いっぱい（`S2_error_storage_light.png` の「もう一度保存する」、`S1_addToHomeScreen_light.png` の「閉じる」、`S1_standalone_import_light.png`）、エラー中の textarea の枠が color.error の太い枠（`S3_error_storage_answer_light.png`） | 同左。判定は design-reviewer r2 |

## 1. 実行したコマンドと結果
どのコマンドにも再試行を付けていない（`--retries=0` を明示。設定も `retries: 0`）。出力は evidence/ のログに全文があり、ここには最後の数行を貼る。

### コマンド 1（この機能の受け入れテスト全件）
- コマンド：`cd backend/tests/acceptance && npm ci && npx playwright test --retries=0 --reporter=list,json`（PLAYWRIGHT_JSON_OUTPUT_NAME=evidence/g3r2-full-run.json）
- 終了コード：0
- テストの件数（成功 / 失敗 / 飛ばした）：155 / 0 / 0（chromium 78、webkit 77。AC-15 は chromium だけ：W-11）
- 出力：docs/verification/001-daily-learning/evidence/g3r2-full-run.log（164 行）、JSON は evidence/g3r2-full-run.json（annotation に計った時間と件数）

```text
# date: 2026-11-04 01:30:42 +0900
# commit: 1560b36c8d2f946b0dc063b8fbce9e07d22f87a1
# cmd: cd backend/tests/acceptance && npm ci && npx playwright test --retries=0 --reporter=list,json
# node: v24.22.1
（…155 本の ✓ の行…）
  155 passed (36.0s)
# exit: 0
```

### コマンド 2（影響「大」の AC、`DESIGN_` の全件、一度でも落ちたテストを 5 回ずつ）
- コマンド：`cd backend/tests/acceptance && npx playwright test -g 'AC(1|2|5|6|7|8|9|10|11|12|13|14|15|16|19|20|22|23|24|25|28|31|32)_|DESIGN_' --repeat-each=5 --retries=0 --reporter=list,json`
- 対象：test-plan 1 章の影響「大」のリスク R1〜R5 に関わる AC（AC-1、2、5〜16、19、20、22〜25、28、31、32）、`DESIGN_D30_` 5 本・`DESIGN_D31_` 3 本・`DESIGN_U15_` 1 本（両ブラウザ）、一度でも落ちたテスト（AC-20 の 2 本：G2 の後の ENOENT。`DESIGN_D31_` 2 本：実装前の r7-red.log）
- 終了コード：0
- テストの件数（成功 / 失敗 / 飛ばした）：555 / 0 / 0（別々のテスト 111 本 × 5 回。JSON で 1 本ずつ 5 回とも passed であることを数えた：distinct 111、runs 555、5 回でないもの []、flaky 0）
- 出力：evidence/g3r2-repeat5.log、evidence/g3r2-repeat5.json

```text
# cmd: npx playwright test -g 'AC(1|2|5|6|7|8|9|10|11|12|13|14|15|16|19|20|22|23|24|25|28|31|32)_|DESIGN_' --repeat-each=5 --retries=0 --reporter=list,json
  555 passed (2.6m)
# exit: 0
```

### コマンド 3（契約が受け入れテストに求めた予算と、PRD 12 の非機能要件の証拠。AC ではない）
- `cd backend/tests/acceptance && npm run check:seeds` → 終了コード 0、seed 10 件、期待と違う結果 0 件
- `cd backend && node scripts/build.mjs --out <一時> --version 2026-11-30.1` → 終了コード 0（20 ファイル）。`node scripts/check-budget.mjs <一時>` → 終了コード 0、合計（gzip 後）65,133 / 150,000 バイト（殻 26,157 / 32,000、文言 6,610 / 8,000、アイコンと manifest 2,173 / 4,000、課題集 30,193 / 106,000。枠は f40c61a で見直した budgets.md 2 のとおり）
- `grep -c 'Content-Security-Policy' <一時>/index.html` → 1。`grep -rnE "__test|[?&](reset|now|seed)=|location\.search" backend/public` → 0 件（test-hooks.md「本番に入っていないことの確かめ」）
- `cd backend && npm run check:contracts` → 見本 41 件、期待と違う結果 0 件。`node --test 'tests/unit/**/*.test.mjs'` → 113 pass / 0 fail（参考。backend-engineer の単体テスト）
- 予算の受け入れテスト `BUDGET2_課題集の本文の平均600字以下_gzip後106000バイト以下`：両ブラウザで passed。平均の字数 287.1、gzip 後 30,193 バイト

### コマンド 4（スクリーンショットと axe、キーボードの一巡。受け入れテストの本数は変えない：tools/ は `tests/` の外で `*.spec.mjs` でない）
- `cd backend/tests/acceptance && node tools/screenshots.mjs --out docs/verification/001-daily-learning/evidence/screenshots --browser both`（screenshots/ をいったん空にしてから）→ 終了コード 0、148 枚（問題 0）、axe 95 画面。初回は webkit の `S8_export_done` だけに color-contrast の違反 1 件が出た（9 章末尾：知らせが不透明度で現れる途中を axe が計った道具の問題。#1B6E3A が #40855a に見え 4.44:1）。道具を「計算済みの opacity が 1 になるまで待つ」に直し（`waitOpaque`。sleep ではない）、`--only '^(S8_export_done|S3_answer_saved)$'` で両ブラウザを撮り直して違反 0。合計は変わらず 148 枚、axe 95 画面（違反 0、incomplete 6 ノード）。ログ：evidence/screenshots-run.log、一覧：evidence/screenshots/index.tsv（148 行）、axe：evidence/screenshots/axe/axe-summary.tsv（95 行）と JSON 95 個、ダイアログの ax5 のフォーカス：evidence/screenshots/dialog-ax5-focus.tsv（4 行）。index.tsv に載せない追加の PNG はダイアログの `_ax5_tabOk.png` 4 枚（PNG の総数 152）
- `node tools/keyboard-tour.mjs --browser chromium --log evidence/keyboard-tour-chromium.log` → 終了コード 1、`--browser webkit` → 終了コード 1。r1 と同じ「問題」2 件で、どちらも不具合ではない（7 章：`settings.privacy` は契約で DOM に置かない、ダイアログの BODY はブラウザの枠へのフォーカス）。ログ：evidence/keyboard-tour-chromium.log、evidence/keyboard-tour-webkit.log

## 2. 受け入れ条件ごとの結果
動いたテストの数は chromium + webkit の合計（コマンド 1）。飛ばしたテストは全 AC で 0。証拠のスクリーンショットのパスは evidence/screenshots/ からの相対（chromium。webkit は webkit/ の下に同名）。annotation の値は evidence/g3r2-full-run.json から写した。
| AC | 結果（PASS / FAIL / 未検証） | 動いたテストの数 | 飛ばしたテストの数 | 証拠（テストの名前、ログの行、スクリーンショットのパス） |
|---|---|---|---|---|
| AC-1 | PASS | 2 | 0 | AC1_初めて開くと診断が始まり3問で終わる_進み具合n/3_切り替え500ms以内。計った時間 ms（始める→1、1→2、2→3、3→課題）：chromium 2, 1, 1, 2、webkit 2, 1, 1, 3（上限 500、500、500、1,000）。S1_diagnosis.start_light.png、S2_question_1〜3_light.png |
| AC-2 | PASS | 6 | 0 | AC2_…_backend_intermediate / _frontend_beginner / _git_advanced。finish → task.today ms：chromium 3 / 7 / 2、webkit 2 / 3 / 2（上限 1,000）。S3_task.today_light.png |
| AC-3 | PASS | 2 | 0 | AC3_課題集の全件が4要素を持ち所要時間が1〜15分（配布物の data/tasks.json を HTTP で全件） |
| AC-4 | PASS | 2 | 0 | AC4_課題集は126件以上で18組すべて7件以上でIDの重複が0件。全体 126、18 組すべて 7 |
| AC-5 | PASS | 2 | 0 | AC5_完了するとtask.rateになり_答えるとtask.done_同じ日に再読み込みしてもtask.doneのまま。S4_task.rate_light.png、S5_task.done_light.png |
| AC-6 | PASS | 2 | 0 | AC6_翌日には過去に出した課題のIDと一致しない課題が出る |
| AC-7 | PASS | 6 | 0 | AC7_too_hard / too_easy / no_time を申告すると…。S6_task.skipped_too_hard_{light,dark,ax5,en}.png、_too_easy_light.png、_no_time_light.png |
| AC-8 | PASS | 20 | 0 | AC8_1通り目〜9通り目（5a、5b を含む 10 本 × 2）。annotation の翌日の段階：1 beginner、2 advanced、3 intermediate、4 intermediate、5a intermediate、5b intermediate、6 beginner、7 advanced、8 beginner、9 intermediate（test-plan 2 章の期待と同じ） |
| AC-9 | PASS | 8 | 0 | AC9_役に立った / 立たなかった / 選ばずに再読み込み / 今回は答えない（4 本 × 2） |
| AC-10 | PASS | 2 | 0 | AC10_課題が尽きるとtask.exhaustedと文言とやり直しの操作が出て_…。出し終えた件数 7。S7_task.exhausted_light.png |
| AC-11 | PASS | 2 | 0 | AC11_2問目の保存が失敗してもerror.storage.messageと選択が残り_…。S2_error_storage_light.png |
| AC-12 | PASS | 4 | 0 | AC12_オフラインでも AC-1_AC-2_AC-5_AC-9 の操作が動き_送信は0件（切り替え ms chromium 2, 1, 1, 2、webkit 1, 1, 0, 1）／ AC12_オフラインでもAC-7の申告が動き_送信は0件。送信 0 件 |
| AC-13 | PASS | 2 | 0 | AC13_persistを断られても完了と再読み込みでtask.done_履歴1件_設定にnotPersistedと書き出しがある。persist() は診断を終えた読み込みで 1 回、同じ日と翌日の再読み込みで 0 回、device {persistRequested: true}。S8_settings_notPersisted_light.png |
| AC-14 | PASS | 4 | 0 | AC14_今日の課題を出していない日に…（seed 7 行、最後の 3 行 done、今日 2026-09-08）／ AC14_今日の課題が出ている日に…（やり直しの前 backend-intermediate-004、翌日 frontend）。S2_redo_fromSettings_light.png |
| AC-15 | PASS | 1（chromium だけ：W-11） | 0 | AC15_遅い回線とCPU4倍の制限でキャッシュなしに開き_data-debug-load-msが5回とも2000以下。値 920, 905, 922, 914, 923 ms |
| AC-16 | PASS | 2 | 0 | AC16_すべてのデータを削除すると再読み込みでdiagnosis.startになり_やり直した後の履歴は0件。dialog_settings.delete.confirm_light.png、S10_history_empty_light.png |
| AC-17 | PASS | 8 | 0 | AC17_diagnosis.start / task.today / task.done / task.exhausted_横スクロール0_切り詰め0_操作できる要素がすべて押せる。scrollWidth 320 / clientWidth 320。S1_diagnosis.start_w320.png、S3_task.today_backend-beginner-005_w320.png（長いインラインコード） |
| AC-18 | PASS | 2 | 0 | AC18_移動キー(Tab系)とEnter_Spaceだけで診断から完了まで進み_操作した要素がfocus-visibleで枠が3px以上。10 要素すべて focusVisible true、outline 3 px（chromium Tab、webkit Alt+Tab） |
| AC-19 | PASS | 2 | 0 | AC19_書き出すとJSONが1つダウンロードされ_…。kyounoitte-2026-11-03.json。S8_export_done_light.png |
| AC-20 | PASS | 2 | 0 | AC20_保存データのないブラウザで読み込むと_…。読み込み後の状態 task.done。5 回繰り返しでも落ちない（4 章）。dialog_settings.import.confirm_light.png |
| AC-21 | PASS | 6 | 0 | AC21_iOS_Safari…／ AC21_iPadOS_Safari…／ AC21_UAを偽装しない…0回。S1_addToHomeScreen_{light,en}.png、S8_homeScreen_guide_{light,en}.png |
| AC-22 | PASS | 2 | 0 | AC22_スタンドアロンで初めて開くと読み込みの案内が出て_…。S1_standalone_import_light.png |
| AC-23 | PASS | 4 | 0 | AC23_task.today…／ AC23_task.done…。表示までの ms（再読み込み / 新しいタブ）：chromium 31 / 100、37 / 74、webkit 46 / 119、77 / 121（上限 3,000）。送信 0 + 0 件 |
| AC-24 | PASS | 2 | 0 | AC24_統計の9つの値が期待どおりで_…。S9_settings.stats_light.png |
| AC-25 | PASS | 2 | 0 | AC25_版番号が新しいファイルはerror.import.messageで拒み_履歴1件と診断と状態は変わらない。S8_import_error_version_light.png |
| AC-26 | PASS | 4 | 0 | AC26_en-US…一致し_キーの差が0件（ja 146、en 146）／ AC26_ja-JP…。S1_diagnosis.start_en.png |
| AC-27 | PASS | 12 | 0 | AC27_<PRD の 6 画面>_axe-coreでserious以上の違反が0件。violations 0（7 章）。知らせのある S3 の監査は `DESIGN_D30_task.today.dayChanged_…`（下の design の表） |
| AC-28 | PASS | 2 | 0 | AC28_差し替え後2秒おきの再読み込み3回以内で…。data-build-version × 3：2026-11-30.1 → 2026-12-14.1 → 2026-12-14.1 |
| AC-29 | PASS | 2 | 0 | AC29_各組でexternalが20%以下_…。external は infra ×3、testing/advanced、git ×3 の各 1/7 |
| AC-30 | PASS（該当なし ではない。課題集に external が 7 件ある） | 4 | 0 | AC30_in_appを出し終えた翌日はexternalの課題が出て_印と要る道具が題名と同じ画面に見える（git-advanced-005、tools 2 件）／ AC30_in_appの課題を出した日は…印が0件。S3_task.today_external_{light,en}.png |
| AC-31 | PASS | 4 | 0 | AC31_診断済みで開くと操作0回でtask.todayが見え_…重なる要素0件／ AC31_今日の課題を完了済みなら…。dialogs 0、modals 0、fixed [] |
| AC-32 | PASS | 10 | 0 | AC32_200文字を入力して再読み込みすると…／ …タブを閉じ新しいタブで開くと…／ …翌日に開くと…noneの行のanswerに残る（`task.dayChanged` 0 件）／ …画面を開いたまま翌日になった後に読み込まずに完了を押すと…／ …保存を待たずに…完了を押すと…。前日の行 {date 2026-11-04, backend-intermediate-004, none, answer 200 文字}、翌日の欄は空。S3_answer_saved_light.png |

AC 番号のないテスト（AC の表とは別。契約 W-6）：
| 名前の接頭辞 | 根拠 | 本数（chromium + webkit） | 結果 | 証拠 |
|---|---|---|---|---|
| `BUDGET2_` | 契約 budgets.md 2、W-6 | 2 | PASS | 平均 287.1 字、gzip 後 30,193 バイト（コマンド 3） |
| `DESIGN_D30_`（S3 の知らせ、入力では消えず次の操作と再読み込みで消える／ `task.rate` のまま翌日の評価／ 最後の課題の翌日に S7 の知らせ／ 知らせのある S3 で申告の保存が失敗しても次の操作の始めに 0 件／ 知らせのある S3 の axe） | design r6 の D-30、data.md 4、identifiers.md 3 | 10 | PASS | S3_task.today_dayChanged_{light,dark,ax5,en}.png、S7_task.exhausted_dayChanged_{light,dark,ax5,en}.png。axe serious 以上 0（AC-27 と同じ規則） |
| `DESIGN_D31_`（`persisted()` が 1,000 ms までに返らないと注意なしで描き、後から返っても描き直さない／ 待つ間の `diagnosis.next` が優先され、遅れて S8 を描かず、もう一度やめると後の待ちだけが描く／ 待つ間の未選択の `diagnosis.next`（必須のエラー。画面を移さない操作）でも同じ：r2 で足した 1 本） | 契約 data.md 11（f40c61a）、W-9、design D-31 | 6 | PASS | S8 を描くまで：chromium 1,008 ms、webkit 1,004 ms（上限 1,000、stub の答えは 3,000 ms 後）。2 回目の「やめる」から S8 まで：803 / 804（chromium）、801 / 803（webkit）ms（stub 800 ms） |
| `DESIGN_U15_`（初回の S2 で日付が変わった後の確定はそのまま進む） | design 10 の U-15、data.md 4「対象の外」 | 2 | PASS | `data-question-index` 3、`task.dayChanged` 0 件、completedOn と課題の日付は確定した日 |

## 3. 状態ごとの結果
| 状態 | 選んだもの（自動 / G4 の人 / 範囲外） | 結果 | 証拠のパス、または理由 |
|---|---|---|---|
| 初めて起動 | 自動 | PASS | 新しいコンテキスト（保存、SW、キャッシュが空）で AC-1、2、11、12、13、18、21、22、26、27。S1_diagnosis.start_light.png、S2_question_1_light.png |
| データがある | 自動 | PASS | addInitScript の seed（W-7）で AC-5〜10、14〜17、19、20、23〜25、28、30〜32。S3_task.today_light.png、S5_task.done_light.png、S10_history_light.png |
| 前の版からの更新 | 自動（配布物の版）＋範囲外（保存データの版） | PASS（配布物） | AC-28：旧 2026-11-30.1 → 新 2026-12-14.1 で履歴 3 件と診断が同じ。r1 の探索 R4 で 0.5 秒おきの再読み込みでも旧版に戻らない。保存データの formatVersion は 1 が最初の版で前の版がない（data.md 6）。`device.persistGranted` を書いた前の実装（e13d68f）のデータはスキーマに残っていて読める（契約 data.md 2） |
| オフライン、サーバーエラー | 自動（オフライン）＋範囲外（サーバーエラー） | PASS（オフライン） | AC-12（操作）、AC-23（再読み込みと新しいタブ）。r1 の探索 R4 で manifest、icon、tasks.json、en.json、sw.js のオフライン応答。静的ホスティングの 5xx はアプリの画面がない（design 5 の冒頭） |
| 権限を断った | 自動（その場、返らない、遅い）＋範囲外（あとから） | PASS | AC-13（`persist()` と `persisted()` の両方を false に注入、`persist()` は 1 回）。`DESIGN_D31_` 3 本（`persisted()` が 3,000 ms 後／ 800 ms 後に返る注入）。探索 S8wait（返らない約束：8 章）。S8_settings_notPersisted_light.png。あとから撤回する操作は Web の persist にない。補足：注入なしでも headless の Chromium / WebKit は `persisted()` に false を返すので S8_settings_light.png にも notPersisted が出る（11 章 #3。D-31 で S8 は毎回 `persisted()` を読むので、実機で許可されれば注意は消える） |
| バックグラウンドから復帰 | 自動 | PASS | AC-32（再読み込み、タブを閉じて新しいタブ、画面を開いたまま翌日）、AC-23（新しいタブ）、`DESIGN_D30_` 5 本、`DESIGN_U15_`。画面を開いたまま日付が変わる場合の探索 R3（8 章：ダイアログ、別のタブ、保存の失敗、S7 からのやり直し） |
| 言語と地域（ja、en） | 自動 | PASS | AC-26（en-US、ja-JP）。英語の全画面：S0〜S10 とダイアログの `_en.png`、英語が長い 3 つの置き場所（S3 external、S8 ホーム画面の案内、S1 の案内）の `_en.png`（lang=en を index.tsv に記録） |
| 大きい文字、ダークモード | 自動（幅 320、文字 200%、ダーク）＋G4 の人（実機の OS の文字サイズ最大とダーク） | PASS（崩れ、切れ、横スクロールなし。ダイアログの ax5 で「やめる」が見え、移動キーで ok に届く） | AC-17（幅 320）。`_ax5.png`（ルートの font-size 200%。ヘッダーの nav が 2 行目に落ち、申告のボタンは縦積み：design 9 のとおり）、`_dark.png`（colorScheme dark）。index.tsv の scrollWidth/clientWidth は全 148 枚で等しい（横スクロール 0）。dialog-ax5-focus.tsv の 4 行すべて ok。実機の見た目は G4 で Takuma |
| 容量不足、割り込み | 自動（容量不足の注入）＋範囲外（割り込み） | PASS | AC-11（QuotaExceededError）、`DESIGN_D30_`（知らせのある S3 で申告の保存の失敗）。探索 R3 の 12〜13（日付をまたいだ移しと翌日の課題の保存の失敗 → retry で 1 回にまとめて保存）。r1 の探索 R5。電話などの割り込みは Web にはなく、タブの切り替えで代える |

## 4. 揺れの確認
コマンドは 1 章のコマンド 2（`--repeat-each=5 --retries=0`）。1 本ずつ 5 回とも passed（evidence/g3r2-repeat5.json を数えた：別々のテスト 111 本、実行 555、失敗 0）。
| テストの名前 | コマンド | 回数 | 落ちた回数 | 原因の型 |
|---|---|---|---|---|
| AC1_（chromium、webkit） | コマンド 2 | 5 × 2 | 0 | — |
| AC2_ × 3（両ブラウザ） | コマンド 2 | 5 × 6 | 0 | — |
| AC5_、AC6_、AC10_、AC11_、AC13_、AC16_、AC19_、AC22_、AC24_、AC25_、AC28_（両ブラウザ、各 1 本） | コマンド 2 | 5 × 22 | 0 | — |
| AC7_ × 3、AC9_ × 4、AC32_ × 5（両ブラウザ） | コマンド 2 | 5 × 24 | 0 | — |
| AC8_ × 10（両ブラウザ） | コマンド 2 | 5 × 20 | 0 | — |
| AC12_ × 2、AC14_ × 2、AC23_ × 2、AC31_ × 2（両ブラウザ） | コマンド 2 | 5 × 16 | 0 | — |
| AC15_（chromium） | コマンド 2 | 5 | 0 | — |
| AC20_（両ブラウザ。G2 の後に一度 ENOENT で落ちたテスト） | コマンド 2 | 5 × 2 | 0 | —（落ちた原因は Playwright が閉じたコンテキストのダウンロードを消すこと＝後片付けの型。a7fc7e9 で複製に直した） |
| DESIGN_D30_ × 5、DESIGN_U15_（両ブラウザ） | コマンド 2 | 5 × 12 | 0 | — |
| DESIGN_D31_ × 3（両ブラウザ。実装前の r7-red.log で落ちていた 2 本と、r2 で足した 1 本。時間の区間を見るテスト） | コマンド 2 | 5 × 6 | 0 | —（区間は契約「文書が変わらない区間」どおりページの中で計り、上限 1,000 に対し 1,004〜1,008、stub 800 に対し 801〜804 ms で安定） |

## 5. 受け入れテストの変更
- この機能のテストを最初に入れたコミット：a6facf4（`git log --oneline origin/main..HEAD -- backend/tests/acceptance` のいちばん下）
- 判定済みの範囲：G2 のテストの判定 r3（a0a5c40、tech-lead PASS）まで。G2 r3 の後の変更は `git diff a0a5c40..HEAD -- backend/tests/acceptance`（コミット ea5f4ac の 1 件）と、この r2 の作業ツリーの変更（`git status --short backend/tests/acceptance`：2 ファイル）。
| ファイル:行 | 何を変えたか | PRD の根拠（AC 番号と PRD の文） |
|---|---|---|
| コミット ea5f4ac（tests/design-d31-persisted-wait.spec.mjs 新規 108 行、tests/design-d30-day-changed.spec.mjs +55、tests/ac31-ac32-zero-ops-answer.spec.mjs +28、tests/ac17-ac18-ac27-a11y.spec.mjs −17 +4、tests/ac11-ac13-storage.spec.mjs +3、helpers/seed.mjs +39、README、tools/screenshots.mjs） | G2 r3 の tech-lead（要修正 1、提案 1〜3）と reviewer（提案 2）と契約 f40c61a に合わせた。AC-27 の 7 本目 `AC27_task.today.dayChanged_…` を `DESIGN_D30_` に移し（消した expect 3 行は同じ確かめを design-d30 の `openDayChangedToday` に移した）、AC-32 の 5 本目、`DESIGN_D30_` 1 本、`DESIGN_D31_` 2 本を足し、AC-13 に「1 のまま」を足した。1 行ずつの根拠は test-plan 10 章の r6 の表 | 契約 data.md 11（S8 の待つ上限、待つ間の操作）、test-hooks.md W-6（`DESIGN_` の名前）と W-9（印の読み方、`persisted()` の遅延注入）、PRD AC-27 Given の 6 画面、AC-32 Then「前日の行の answer に残る」、AC-13 Then。既存の Then を弱めた箇所はない（消した expect は移しただけ） |
| tests/design-d31-persisted-wait.spec.mjs:110-150（r2、未コミット） | `DESIGN_D31_S8から入ったやり直しのS2でdiagnosis.cancelの直後に未選択のままdiagnosis.nextを押すと_error.diagnosis.requiredが出て1問目のままで_答えが返った後も遅れてS8は描かれず_もう一度やめると後の待ちだけがS8を描く` を 1 本足した。既存のテストは変えていない（消した行 0） | 契約 data.md 11「その操作が画面を移さないとき（必須のエラー、保存の失敗の表示）も同じです」。backend-engineer の未解決「act() の `app.seq += 1` を消しても落ちるテストがない」に対して、画面を描き直さない操作で待ちが捨てられることを押さえる（2 本目は `diagnosis.next` が 2 問目を描くので、描き直しで捨てる実装でも通る）。AC の Then にないので W-6 の `DESIGN_` |
| tools/screenshots.mjs（r2、未コミット。受け入れテストではない） | S0_loading、S6 too_hard、S7 dayChanged を 4 通りに、S1 の案内・S3 external・S8 の案内に `en` を追加、ダイアログは 200% にしてから開き表示域だけを撮ってフォーカスを記録、axe の incomplete の target と理由を JSON と tsv に、知らせの opacity 1 を待つ `waitOpaque` | design-reviewer G3 r1 の指摘 1、2、7、12（証拠の撮り方。判定の基準は変えない） |

`npx playwright test --list` は 155 本（コマンド 1 と同じ件数。r1 の 133 → ea5f4ac で 153 → r2 で 155）。

## 6. 検査の件数
受け入れテストのフォルダの tests、helpers、server、global-setup.mjs、playwright.config.mjs（node_modules、tools、test-results を除く）。
| 検査 | コマンド | 件数 | 理由 |
|---|---|---|---|
| sleep で待つ | `grep -rnE 'sleep\(\|usleep\|Thread\.sleep\|time\.sleep\|asyncio\.sleep\|waitForTimeout' tests helpers server global-setup.mjs playwright.config.mjs` | 0 | — |
| 飛ばす、失敗を許す | `grep -rnE 'XCTSkip\|XCTExpectFailure\|pytest\.mark\.skip\|skipif\|xfail\|pytest\.skip\|unittest\.skip\|test\.skip\|test\.fixme\|test\.only\|\.skip\(' …` | 0 | — |
| 再試行 | `grep -rniE 'retry\|rerun' …` | 0（文字列の一致は 5 件：tests/ac11-ac13-storage.spec.mjs:28、:33、tests/design-d30-day-changed.spec.mjs:185（コメント）、:194、:200。すべて契約の識別子 `error.storage.retry` を指す文字列で、再試行ではない） | 設定は `retries: 0`、判定のコマンドは `--retries=0` |
| 中を覗く import | `grep -rnE '@testable' …` と、`import … from` の行で node:、@playwright、@axe-core、ajv、./ と ../helpers、../server 以外のもの | 0 | backend/public、backend/scripts の import なし。配布物は HTTP、ビルドは CLI（spawnSync） |
| AC 番号の抜け（PRD にあってテストにない、その逆） | `grep -oE 'AC-[0-9]+' docs/prd/001-daily-learning.md \| sort -u` と `grep -rhoE "test\(.AC[0-9]+_" tests \| grep -oE 'AC[0-9]+' \| sort -u` | 0（PRD の AC-1〜AC-32 の 32 個すべてがテストの名前にあり、テスト側に PRD にない番号はない。PRD の grep に「AC-33」が 1 件出るが 18 章の Q11 の選択肢 B の文で、AC の定義ではない） | AC 番号のないテストは `BUDGET2_` の 1 本と `DESIGN_` の 9 本（契約 W-6。2 章の別表） |
| 表示の文字や並び順で探す | `grep -rnE "getByText\|getByLabel\|text=\|hasText\|getByRole\|\.nth\(\|boundBy\|\.first\(\)\|\.last\(\)" tests helpers` | 6 | `getByRole('dialog')` 1 件（ac31:12）は test-hooks.md「AC-31 の重なる要素の数え方」1 が指定した数え方。`.nth()` 5 件（ac19:79 履歴 3 行目の answerText、ac17:86 操作できる要素の全件ループ、ac10:71-72 道具の項目の全件ループ、helpers/app.mjs:160 履歴の行の全件ループ）はすべて data-testid で絞った集合の繰り返しで、並び順で 1 つを選ぶものではない |
| 付け足し：setTimeout、Date.now、performance.now | `grep -rnE 'setTimeout\|Date\.now\|performance\.now' tests helpers` | 16（コメント 7、コード 9） | コード：helpers/app.mjs:63、:76 の performance.now は契約「文書が変わらない区間」の計測。ac12-ac23:86、:89、:98、:101 の Date.now は契約「文書が変わる区間」の計測。helpers/app.mjs:256 の setTimeout は SW が登録されないときに止まらないための上限、:331 の `pause` は PRD AC-28 が決めた「2 秒以上の間隔」のためだけ。helpers/seed.mjs:117 の setTimeout は W-9 が許した `persisted()` の遅延注入（stub の側。テストは「答えが返った回数」を待つ） |

## 7. アクセシビリティ監査
受け入れテスト AC-27（PRD の 6 画面 × 2 ブラウザ、タグ wcag2a / wcag2aa / wcag21a / wcag21aa、serious 以上 0 件が Then）と `DESIGN_D30_task.today.dayChanged_axe-core…`（同じ規則）に加えて、G3 の道具で design 5 の全画面・全状態（47 の場面）に axe-core を流した（同じタグ。ライトと幅 320 の変種。chromium 48 画面 + webkit 47 画面 = 95）。結果の JSON：evidence/screenshots/axe/<browser>_<場面>_<変種>.json（95 個。violations の全文と、incomplete のノードごとの target、html、failureSummary、理由）、一覧：evidence/screenshots/axe/axe-summary.tsv（95 行。violations、serious+、incomplete の件数と target）。
| 画面 | テストの名前 | 結果 | 見つかった問題 |
|---|---|---|---|
| S0 loading、error（読めない、JSON でない、保存先が使えない、削除の確認） | tools/screenshots.mjs（S0_*） | 違反 0（両ブラウザ） | 削除の確認（S0_error_dialog_delete）に incomplete 1 ノード（下の「incomplete」） |
| S1 diagnosis.start（通常、幅 320、iOS の案内、スタンドアロンの案内、案内の読み込みエラー） | AC27_diagnosis.start_…（passes 10）＋ tools（S1_*） | 違反 0（両ブラウザ） | なし |
| S2 diagnosis.question（1〜3 問目、未選択のエラー、保存の失敗、途中の再開、やり直し） | AC27_diagnosis.question_…（passes 12）＋ tools（S2_*） | 違反 0 | なし |
| S3 task.today（通常、日付が変わった知らせ、幅 320 の長いコード、external、保存しました、上限、自動保存の失敗、申告の失敗） | AC27_task.today_…（passes 21）、DESIGN_D30_task.today.dayChanged_…＋ tools（S3_*） | 違反 0 | なし（S3_answer_saved は知らせの opacity 1 を待って監査：1 章のコマンド 4） |
| S4 task.rate（通常、保存の失敗） | tools（S4_*） | 違反 0 | なし |
| S5 task.done | AC27_task.done_…（passes 8）＋ tools | 違反 0 | なし |
| S6 task.skipped（too_hard、too_easy、no_time） | tools（S6_*） | 違反 0 | なし |
| S7 task.exhausted（通常、日付が変わった知らせ） | AC27_task.exhausted_…（passes 10）＋ tools（S7_*） | 違反 0 | なし |
| S8 settings（通常、保存データなし、診断の途中、notPersisted、書き出しました、読み込みエラー 2 種、ホーム画面の案内） | AC27_settings_…（passes 20）＋ tools（S8_*） | 違反 0 | なし（S8_export_done は知らせの opacity 1 を待って監査） |
| ダイアログ settings.import.confirm、settings.delete.confirm | tools（dialog_*） | 違反 0 | incomplete 1 ノードずつ（下） |
| S9 settings.stats（値あり、0） | tools（S9_*） | 違反 0 | なし |
| S10 history（行あり、答えを開いた、空） | tools（S10_*） | 違反 0 | なし |

incomplete（axe が判定できなかったもの。違反ではない）：6 ノード。すべて `color-contrast`（impact serious）で、ダイアログを開いた 3 場面 × 2 ブラウザ（chromium / webkit の `S0_error_dialog_delete_light`、`dialog_settings.import.confirm_light`、`dialog_settings.delete.confirm_light`）のダイアログ本文の `<p>`（target `p[data-testid="settings.delete.confirm.body"]`、`p[data-testid="settings.import.confirm.body"]`）1 ノードずつ。理由は axe の messageKey `elmPartiallyObscuring`「Element's background color could not be determined because it partially overlaps other elements」（JSON の `incomplete[].nodes[].reasons`）。見送る理由：`<dialog>` は `showModal()` で後ろの文書（inert）と `::backdrop` の上に重なるので、axe は本文の地を決められない。本文の地はダイアログ自身の color.bg（不透明）で、文字は color.text。design 9 の表のとおり 16.48:1（ライト）、15.29:1（ダーク）で、design-reviewer G3 r1 も自分で計算して基準を満たすと書いている。同じ `<p>` の文字色と地は S8 本体の本文（incomplete なし、違反なし）と同じトークン。
- `S0_error_dialog_delete` と `dialog_settings.delete.confirm` のノードは同じダイアログ（S0 error と S8 から同じ部品を開く）。

キーボードだけの一巡（evidence/keyboard-tour-chromium.log、keyboard-tour-webkit.log。移動キーは契約「キーボードの移動キー」どおり chromium が Tab、webkit が Alt+Tab。r2 で撮り直し）：
- AC-18 の受け入れテスト（S1 → S2 ×3 → S3 → S4 → S5。10 要素すべて focus-visible、outline 3 px）に加え、S5 → 履歴（Enter）→ `<summary>` を Enter で開き Space で閉じる → 前へ（Shift+Tab / Alt+Shift+Tab）→ 設定 → 削除のダイアログ（初期フォーカス `settings.delete.confirm.cancel`、Escape で閉じてフォーカスが `settings.delete` に戻り、データは消えない）→ 統計 → 戻る → やり直し（S2 の先頭にフォーカス。radio は ArrowDown で次を選ぶ）→ やめる → 設定 → アプリ名で今日の課題、まで両ブラウザで届いた。
- 道具が「問題」と数えた 2 件は r1 と同じで不具合ではない：(1) `settings.privacy` に止まらない＝契約 identifiers.md 3「`settings.privacy` は、リンク先が決まるまで（design の U-9）DOM に置きません」のとおり要素がない（13 章に申し送り）。(2) ダイアログの中で Tab を押し続けると `cancel` の後に activeElement が BODY になる＝`showModal()` の外の文書は inert で、ヘッドレスではフォーカスがブラウザの枠へ出る瞬間（WebKit は `<dialog>` 自身に止まる）。ダイアログの後ろの要素（`settings.*`）に止まったことは 1 回もない。
- ダイアログの ax5（文字 200%）でのフォーカス（evidence/screenshots/dialog-ax5-focus.tsv）：初期フォーカス cancel が表示域の中（top 627〜728 / 844）、移動キー 3 回（cancel → BODY（ブラウザの枠）→（webkit は `<dialog>`）→ ok）で ok に届き、ok も表示域の中（top 501〜603）。ダイアログの中身は 200% で表示域を超え、`<dialog>` がスクロールして初期フォーカスの「やめる」を見せる（`dialog_settings.delete.confirm_ax5.png` は題名が上に隠れ、本文の末尾と 2 つのボタンが見える）。
- VoiceOver / TalkBack の読み上げは G4 で Takuma（13 章）。

## 8. 探索セッション
r2 では、design r6 と契約 f40c61a で変わった所を中心に、test-plan 6 章の R3 のチャーターをやり直し、S8 の待つ上限と待つ間の操作のチャーターを 1 本足した。R1、R2、R4、R5 は r1（e13d68f）の結果をそのまま残す（evidence/exploration/R1.log、R2.log、R4.log、R5.log。R1〜R5 に関わる受け入れテストは r2 の全件と 5 回繰り返しで通っている。実装の差分 e13d68f → 1560b36 は main.js、persist.js、rules.js、view-task.js、app.css、check-budget.mjs で、保存の失敗の扱いと SW は変えていないと backend/docs に書かれているが、自分では実装を読んでいない）。使い捨てのスクリプト（Playwright のライブラリで操作し、手順ごとに data-state と保存の中身を記録。受け入れテストのフォルダの tools/ に置き、終わったら消した）で行い、ログは evidence/exploration/R3-r2.log と S8wait-r2.log、スクリーンショットは exploration/R3_0<n>_<名前>.png（r2 の 5 枚：R3_01_dayChanged_after_done、R3_02_dialog_delete_after_midnight、R3_03_tabA_arrives_done_no_notice、R3_04_dayChanged_save_failed、R3_05_exhausted_redo_after_midnight。r1 の R3_02_done_after_midnight と R3_06_exception は r1 のまま残した）。すべて chromium、viewport 390 × 844、配布物 2026-11-30.1。保存の中身は `localStorage['kyounoitte:data']`（contracts/data.md）をテスト側から読んだ。

### セッション 3（R3 のやり直し：画面を開いたまま日付が変わる。D-30、U-15）
- チャーター：23:55 に出した課題を 0:05 に「完了」、S8 のまま、ダイアログを開いたまま、別のタブが先に翌日の課題を出した／申告を済ませた、日付をまたいだ保存の失敗、S7 に着く場合と S7 からのやり直しの途中、を `setFixedTime` の差し替えで探り、知らせ・フォーカス・保存の回数・答えの行き先が契約 data.md 4 のとおりか、データが消えたり重複したりしないかを見つける
- 区切り（予定と実際）：30 分 → 15 操作（約 25 秒）
- 試したこと（R3-r2.log の番号）：
  1. 23:55 に答えを書きかけ → 0:05 に「完了」→ `task.today` のまま別の課題（004 → 005）、`task.dayChanged` 1 件、activeElement がその知らせ、scrollY 0、欄は空、操作の中の setItem は 1 回、`task.rate` に進まない。保存：前日の行は none で答え「23 時 55 分に書きかけ」、新しい `current.answer` は ''（r1 の #1「押した直後の保存で翌日の `current.answer` に前日の答えが入る」は直っている）
  2. 翌日の欄に入力 → 知らせは 1 件のまま（入力では消えない）。3. `nav.history` → 履歴 4 行、none の行 1 件。4. `app.name` → S3、知らせ 0 件（同じ日）
  5. S8 のまま日付が変わり `nav.history` → 履歴には行かず `task.today` に着き知らせ 1 件（契約 4「その操作はせず」。nav のリンクも対象）。6. `app.name` → 知らせ 0 件
  7. 削除の確認を開いたまま日付が変わり「削除する」→ 削除されず（保存データはある）、ダイアログは閉じ、S3 に知らせ 1 件（R3_02_dialog_delete_after_midnight.png）
  8. 読み込みの確認を開いたまま日付が変わり「置き換える」→ 置き換わらず（firstOpenDate は seed の 2026-11-01 のまま）、S3 に知らせ 1 件
  9〜10. タブ A（11-04、答え書きかけ）を開いたまま、タブ B を 11-05 に開く → B が移して 005 を出す。A で「完了」→ A も 005、知らせ 1 件、11-04 の行は 1 件だけ（重複なし）、A の書きかけは自動保存で B が移す前に行に入っていた
  11. タブ B が 11-05 の課題を完了（S5）した後、A で「難しすぎ」→ A は `task.done`（S5）に着き、知らせ 0 件（契約 4 の 4「S5 / S6 に着いたときは出しません」）、too_hard は保存されない（R3_03_tabA_arrives_done_no_notice.png）
  12〜13. 日付が変わった後の「完了」で、移しと翌日の課題の保存（1 回にまとめた setItem）を失敗させる → 翌日の課題 005 が画面に出て知らせ 1 件、`error.storage.message` + `error.storage.retry`、保存は前のまま（R3_04_dayChanged_save_failed.png）。retry → setItem 1 回、エラー 0、知らせ 0 件（次の操作の始めに消えた）、保存に none の行（答え「失敗の前の答え」）と `current` 11-05 の両方（契約 data.md 2「起動時の保存の失敗と同じ」）
  14. 最後の課題を開いたまま翌日に「今日はできない」→ `task.exhausted`、知らせ 1 件、フォーカスは知らせ、`current` なし、最後の行は none
  15. S7 からやり直しの S2 の 2 問目で翌々日に「次へ」→ `task.exhausted` に戻り知らせ 1 件、diagnosis は元の backend/intermediate のまま（下書きを捨てた）、history は 7 行のまま（R3_05_exhausted_redo_after_midnight.png）
- 見つけた不具合：なし（r1 の #1 は design r6 と契約で扱いが決まり、実装は契約の 15 の場面すべてで一致した）
- 疑問：なし
- 次に試すこと：3 つのタブで同時に日付をまたいだときの保存の順（契約は「別のタブがもう移した」の 2 タブまで）
- 使い捨てのテスト：消した（データの結果は AC-32 の 5 本、知らせは `DESIGN_D30_` 5 本と `DESIGN_U15_` が受け入れテストとして押さえている）

### セッション 6（S8 の待つ上限と待つ間の操作。D-31、data.md 11）
- チャーター：`persisted()` が永遠に返らない、待つ間の申告、待つ間の入力（操作に含まない）、S9 との往復（描くたびに待つ）、待つ間に日付が変わる、を注入で探り、上限 1,000 ms の後に注意なしで描かれること、待つ間の操作が優先され遅れて S8 が描かれないこと、入力が失われないことを見つける
- 区切り：40 操作 → 9 操作（約 6 秒）
- 試したこと（S8wait-r2.log の番号）：
  1. `persisted()` が返らない約束 → `nav.settings` から S8 まで 1,094 ms（上限の後）、`settings.storage.notPersisted` 0 件、`settings.export` 1 件。2. S9 → 戻る → 1,046 ms（描くたびに待つ）
  3. S3 で `nav.settings` の直後に「簡単すぎ」→ `task.skipped` のまま、答え（800 ms 後）が返った後も S6 のまま（遅れて S8 を描かない）、too_easy は保存されている
  4〜5. S3 で `nav.settings` の直後に答えの欄へ入力 → S8 は描かれ（入力は操作に含まない：data.md 11）、`current.answer` に「待つ間の入力」が保存され、`app.name` で戻った S3 の欄にも残る
  6〜9. 23:59 に `nav.settings`（待ち 800 ms）→ 待つ間に 0:00:30 になる → S8 は描かれ、保存は 11-04 の `current` のまま（まだ移していない）。S8 から「履歴を見る」→ 履歴 3 行（11-04 の課題は `current` のままで履歴にない）、S8 → S9 の issued は 4。`app.name` → S3 で 11-04 の行を none に移し 11-05 の課題が出るが、知らせは 0 件
- 見つけた不具合：なし（AC の範囲では）。6〜9 は 11 章 #5（提案）
- 疑問：「画面を描いた日」を、S8 へ移る操作の始めの日にするか、描いた時点の日にするか（契約 data.md 4 は「画面を描いたとき」、11 は「S8 へ移る操作の始めから数える」）。待ちの中で日付が変わる 1 秒の窓でだけ違いが出る
- 次に試すこと：待つ間にタブを閉じる／再読み込みしたときに S8 の遅れた描画が新しい文書に出ないこと（文書が変わるので出ないはず）
- 使い捨てのテスト：消した（上限と待つ間の操作は `DESIGN_D31_` 3 本が押さえている）

## 9. スクリーンショットとログ
置き場所：docs/verification/001-daily-learning/evidence/。すべて `ls` で見つかる（index.tsv の全 148 行のファイルがある）。
撮り方：backend/tests/acceptance/tools/screenshots.mjs。viewport 390 × 844、deviceScaleFactor 2（スマホ）、幅 320 の変種は 320 × 568。ダークは `colorScheme: 'dark'`（`prefers-color-scheme: dark`）。大きい文字（ax5）は、design 9 の「OS の文字サイズ最大」の読み替えとして `document.documentElement.style.fontSize = '200%'` を CSSOM で入れた（tokens.md 冒頭：文字と余白は rem で、ブラウザの文字サイズ設定に追従する。index.tsv の rootFontSize 列が 32px）。ダイアログは 200% にしてから開き、表示域だけを撮る（design-reviewer G3 r1 の 2）。英語は `locale: 'en-US'`（index.tsv の lang 列が en）。chromium で 99 枚（通常の状態 14 場面は light / dark / ax5 / en の 4 通り、英語が長い 3 場面は light + en、ほかは light、幅 320 は 2 場面）、webkit で 49 枚（全場面の light、幅 320 の 1 場面、ダイアログ 2 つの ax5）。index.tsv に載せない `_ax5_tabOk.png` が 4 枚（chromium 2、webkit 2。PNG の総数 152 = chromium 101 + webkit 51）。どの場面をどの seed と日付で作ったかは tools/screenshots.mjs の SCENARIOS に 1 場面ずつ書いてある。
| ファイル（evidence/screenshots/ からの相対。webkit/ の下に同名の light） | 画面と状態 | 見た目 | 対応する AC |
|---|---|---|---|
| S0_loading_{light,dark,ax5,en}.png | S0 殻：JS を止めて 1 秒後の `app.loading`（日英併記。en も同じ見た目） | 4 通り（r2 で dark、ax5、en を追加） | —（design 5 S0 通常 = loading） |
| S0_error_invalidData_{light,dark,ax5,en}.png | S0 error (1)：スキーマに合わない保存データ。`error.app.message` + reload / exportRaw / delete | 4 通り | —（design 5 S0 エラー (1)、U-5） |
| S0_error_notJson_light.png | S0 error (1)：JSON でない保存データ | ライト | 同上 |
| S0_error_storageUnavailable_light.png | S0 error (2)：localStorage が例外。reload だけ | ライト | —（design 5 S0 エラー (2)） |
| S0_error_dialog_delete_light.png | S0 error から `settings.delete.confirm` | ライト | —（design 5 S0） |
| S1_diagnosis.start_{light,dark,ax5,en}.png、S1_diagnosis.start_w320.png | S1 通常（＋幅 320） | 4 通り + 幅 320 | AC-1、AC-17、AC-26 |
| S1_addToHomeScreen_{light,en}.png | S1 iOS Safari の案内（iPhone 15 の UA、standalone false）。en は `home.addToHomeScreen.steps.4` の長文（design 9） | ライト、英語（r2 で en を追加） | AC-21 |
| S1_standalone_import_light.png | S1 スタンドアロンの読み込みの案内（副操作のボタンは列いっぱい） | ライト | AC-22 |
| S1_standalone_import_error_light.png | S1 案内からの読み込みの失敗（版が新しい） | ライト | AC-22、AC-25 |
| S2_question_1_{light,dark,ax5,en}.png、S2_question_2_light.png、S2_question_3_light.png | S2 1〜3 問目（進み具合 n / 3） | 4 通り（1 問目）、ライト | AC-1 |
| S2_error_required_light.png | S2 未選択で確定 → `error.diagnosis.required` | ライト | —（design 5 S2 エラー (1)） |
| S2_error_storage_light.png | S2 2 問目の保存の失敗 → `error.storage.message` + retry（retry は列いっぱい） | ライト | AC-11 |
| S2_resume_inProgress_light.png | S2 途中の再開（valid-in-progress.json） | ライト | —（design 5 S2 通常、M2） |
| S2_redo_fromSettings_light.png | S2 やり直し（`diagnosis.cancel` と nav 2 つ） | ライト | AC-14 |
| S3_task.today_{light,dark,ax5,en}.png | S3 通常（seed-ac14、2026-11-04） | 4 通り | AC-2、AC-31 |
| S3_task.today_dayChanged_{light,dark,ax5,en}.png | S3 操作で日付をまたいだ知らせ `task.dayChanged`（`<main>` の先頭、color.warning、2 文）。欄は空 | 4 通り（r2 で追加） | —（design 5 S3 通常、D-30。`DESIGN_D30_`） |
| S3_task.today_backend-beginner-005_w320.png | S3 幅 320、長いインラインコード（backend-beginner-005） | 幅 320（chromium、webkit） | AC-17 |
| S3_task.today_external_{light,en}.png | S3 external（印と要る道具。git-advanced-005）。en は `task.external.badge`「Outside the browser」 | ライト、英語（r2 で en を追加） | AC-30 |
| S3_answer_saved_light.png | S3 `task.answer.saved`（opacity 1 を待って撮った） | ライト | AC-32 |
| S3_answer_limit_light.png | S3 2,000 字で `task.answer.limit`（color.warning：D-32） | ライト | —（design 5 S3、data.md） |
| S3_error_storage_answer_light.png | S3 自動保存の失敗（textarea の直下。textarea の枠は size.border.strong の color.error） | ライト | —（design 5 S3 エラー (1)） |
| S3_error_storage_report_light.png | S3 申告の保存の失敗（ボタン群の直上） | ライト | —（design 5 S3 エラー (2)） |
| S4_task.rate_{light,dark,ax5,en}.png | S4 通常 | 4 通り | AC-5、AC-9 |
| S4_error_storage_light.png | S4 回答の保存の失敗 | ライト | —（design 5 S4 エラー） |
| S5_task.done_{light,dark,ax5,en}.png | S5 通常（seed-ac14、2026-11-03） | 4 通り | AC-5、AC-31 |
| S6_task.skipped_too_hard_{light,dark,ax5,en}.png、_too_easy_light.png、_no_time_light.png | S6（too_hard と too_easy は `levelHint` あり、no_time はなし） | 4 通り（too_hard。r2 で dark、ax5、en を追加）、ライト | AC-7 |
| S7_task.exhausted_{light,dark,ax5,en}.png | S7 通常（空の表示そのもの） | 4 通り | AC-10 |
| S7_task.exhausted_dayChanged_{light,dark,ax5,en}.png | S7 操作で日付をまたいだ知らせ（h1 の上） | 4 通り（r2 で追加） | —（design 5 S7、D-30。`DESIGN_D30_`） |
| S8_settings_{light,dark,ax5,en}.png | S8 通常（保存データあり。headless の `persisted()` が false なので notPersisted も出ている：11 章 #3） | 4 通り | AC-13、AC-19、AC-28 |
| S8_settings_noData_light.png | S8 保存データなし（読み込みが主操作、書き出し・診断・記録・削除なし） | ライト | —（design 5 S8 空） |
| S8_settings_inProgress_light.png | S8 診断の途中 | ライト | —（design 5 S8 空） |
| S8_settings_notPersisted_light.png | S8 `settings.storage.notPersisted`（`persist()` と `persisted()` の拒否を注入） | ライト | AC-13 |
| S8_export_done_light.png | S8 `settings.export.done`（opacity 1 を待って撮った） | ライト | AC-19 |
| S8_import_error_version_light.png | S8 読み込みの失敗（版が新しい） | ライト | AC-25 |
| S8_import_error_schema_light.png | S8 読み込みの失敗（スキーマ：unknown-area） | ライト | —（design 5 S8 エラー (1)） |
| S8_homeScreen_guide_{light,en}.png | S8 ホーム画面の案内を開いた。en は `settings.homeScreen.open`「Show how to add to the Home Screen」 | ライト、英語（r2 で en を追加） | AC-21 |
| dialog_settings.import.confirm_{light,dark,ax5,en}.png、dialog_settings.import.confirm_ax5_tabOk.png | ダイアログ settings.import.confirm（要約：履歴 3 件、初めて開いた日 2026-11-01）。表示域だけ。ax5 は 200% にしてから開いた。`_tabOk` は移動キーで ok に届いた後 | 4 通り + ax5 の Tab 後（webkit は light と ax5、ax5 の Tab 後） | AC-20 |
| dialog_settings.delete.confirm_{light,dark,ax5,en}.png、dialog_settings.delete.confirm_ax5_tabOk.png | ダイアログ settings.delete.confirm。同上 | 同上 | AC-16 |
| S9_settings.stats_{light,dark,ax5,en}.png | S9 通常（seed-ac24、2026-11-06） | 4 通り | AC-24 |
| S9_settings.stats_zero_light.png | S9 診断直後（0 と初めて開いた日） | ライト | AC-24（design 5 S9 空） |
| S10_history_{light,dark,ax5,en}.png | S10 3 行（seed-three-done-one-answer） | 4 通り | AC-5、AC-19 |
| S10_history_answerOpen_light.png | S10 `<details>` を開いた | ライト | AC-19、AC-32 |
| S10_history_empty_light.png | S10 空（`history.empty` と主操作） | ライト | AC-16 |
| webkit/*.png（51 枚：index.tsv の 49 + tabOk 2） | 上の全場面のライト（S0〜S10、ダイアログ、幅 320 の 1 場面）とダイアログ 2 つの ax5 | ライト、ax5（WebKit 27.2） | 同上 |
| screenshots/index.tsv | 148 枚の一覧（ブラウザ、viewport、変種、場面、AC、期待した data-state と実際、lang、rootFontSize、scrollWidth/clientWidth、結果） | — | — |
| screenshots/dialog-ax5-focus.tsv | ダイアログの ax5 のフォーカス（初期フォーカス、cancel と ok の位置、押したキー、結果）4 行 | — | AC-16、AC-20（design 9） |
| screenshots/axe/axe-summary.tsv、axe/*.json（95） | axe の結果（incomplete の件数と target を含む） | — | AC-27 |
| g3r2-full-run.log、g3r2-full-run.json | コマンド 1 | — | 全 AC |
| g3r2-repeat5.log、g3r2-repeat5.json | コマンド 2 | — | 影響「大」の AC、`DESIGN_` |
| screenshots-run.log | コマンド 4（全件と、2 場面の撮り直し） | — | — |
| keyboard-tour-chromium.log、keyboard-tour-webkit.log | キーボードの一巡（r2） | — | AC-18 |
| exploration/R3-r2.log、S8wait-r2.log、exploration/R3_0{1..5}_*.png | 探索（8 章。r2） | — | 11 章 |
| exploration/R1.log、R2.log、R3.log、R4.log、R5.log と r1 の png | r1 の探索（8 章の冒頭） | — | — |
| g3-full-run.*、g3-repeat5.*、r7-red.log、r7-repeat5.log ほか | r1 と、テストを書いたときの証拠（test-plan 8 章） | — | — |

受け入れテストの実行で撮ったスクリーンショット（test-results/ の中）は、同じ場面を上の道具で撮り直したので写していない（test-results/ は .gitignore 済み）。

道具の問題として直した 1 件（製品の不具合ではない）：初回の全件で webkit の `S8_export_done` に axe の color-contrast 違反 1 件（`settings.export.done`、前景 #40855a、4.44:1）が出た。design/tokens.md の color.success は #1B6E3A（白地で 6.29:1）で、#40855a はそれを白と約 0.8 で混ぜた色、つまり知らせが不透明度で現れる途中（design 9 の reduced-motion の対象）を axe が計ったもの。同じ場面の chromium と、opacity 1 を待って撮り直した両ブラウザでは違反 0。

## 10. 前の機能の受け入れテスト（回帰）
| 機能 | コマンド | 終了コード | 成功 / 失敗 / 飛ばした |
|---|---|---|---|
| なし（001-daily-learning が最初の機能） | — | — | — |

## 11. 見つかった問題
AC にひも付く不具合は 0 件。下はすべて AC の外で気づいたもの（提案）。#1、#2、#4 は r1 からの持ち越しで、#1 は閉じた。
| # | 内容 | 再現の手順 | 再現するテストの名前 | AC | 重大度（重大 / 要修正 / 提案） | 直す役 |
|---|---|---|---|---|---|---|
| 1 | （r1）画面を開いたまま日付が変わった後の最初の操作の扱い → design r6 の D-30 と契約 data.md 4 で決まり、実装 1560b36 は契約のとおり（知らせ、フォーカス、保存 1 回、翌日の `current.answer` は空、ダイアログと別のタブと保存の失敗でも一致） | 8 章のセッション 3 | AC32_ の 4、5 本目、DESIGN_D30_ 5 本、DESIGN_U15_ | AC-32 | 閉じた | — |
| 2 | （r1）配布物の差し替えの後、0.5 秒おきの再読み込みでは 6 回（3 秒）たっても新版にならない。2 秒以上あければ 2〜3 回で新版（AC-28 は満たす） | r1 の exploration/R4.log | なし | —（AC-28 は「2 秒以上あけて」） | 提案 | backend-engineer（RUNBOOK 3 の手順を守る。直す必要はない） |
| 3 | 注入なしでも headless の Chromium と WebKit では `persisted()` が false を返し、保存データのある S8 に常に `settings.storage.notPersisted` が出る（S8_settings_light.png と S8_settings_notPersisted_light.png が同じ見た目）。D-31 で S8 は毎回 `persisted()` を読むので、実機で許可されれば消える | seed-ac14 で S8 を開く | なし | —（AC-13 は拒否の注入が前提） | 提案 | G4 で Takuma が実機の Safari と Chrome で、ふつうの利用者にこの注意が常に出ないかを見る |
| 4 | `settings.privacy` が S8 にない（design 6 の表にはある）。契約 identifiers.md 3「リンク先が決まるまで（design の U-9）DOM に置きません」のとおりで、U-9 は pdm が G5 の前に決める | S8 を開く。keyboard-tour-*.log | なし | — | 提案（申し送り） | pdm（U-9）→ tech-lead（契約）→ backend-engineer |
| 5 | S8 へ移る操作の `persisted()` の待ち（上限 1,000 ms）の間に日付が変わると、S8 は「描いた日」が翌日になるので、その後の S8 / S9 / S10 の操作では前日の `current` を履歴に移さない（S10 に前日の行がなく、S9 の issued に前日の課題が数えられたまま）。`app.name` で移るが、そのときは知らせが出ない。データは失われず、再読み込みでも移る。起きるのは待ちの 1 秒の窓が 0:00 をまたいだときだけ | 8 章のセッション 6 の 6〜9（S8wait-r2.log） | なし | —（AC にない。契約 data.md 4「画面を描いたとき」と 11「S8 へ移る操作の始めから数える」の間） | 提案 | tech-lead が「画面を描いた日」を操作の始めの日にするかを決める（契約 1 行）。決まれば backend-engineer |

## 12. PRD とテストの食い違い
なし。r2 で足した 1 本も PRD の AC には触れない（契約 data.md 11 と design D-31 の振る舞いで、名前は `DESIGN_D31_`）。

## 13. 未検証のものと理由
- 本物の iPhone / iPad の Safari 17 以上（ホーム画面への追加、スタンドアロンの `navigator.standalone`、7 日消去、`persist()` と `persisted()` の実際の返事、OS の文字サイズ最大、ダークモード、VoiceOver の読み上げ順）：この環境では Playwright の WebKit 27.2 と偽装（W-16）まで。G4 で Takuma が実機で確かめる（ADR 0004、PRD 12、design 9）。
- Linux の WebKit（CI）での `Tab` / `Alt+Tab` のふるまい：macOS では contracts/test-hooks.md「キーボードの移動キー」どおり。CI の最初の実行で evidence/tab-keys.log と同じ出力を残す（契約の「未確認」）。
- GitHub Pages の本番 `https://matsuura-tak.github.io/engineer/`：配布の仕組み（.github/ のワークフロー）がまだない（RUNBOOK 3）。本番の `Content-Type`（manifest）、HTTPS、`/engineer/` の下での SW の scope は、Takuma が配った後に RUNBOOK 3 の確かめで見る。
- Chrome の最新 2 版（本物の Chrome）：Playwright の Chromium 156 で代えた。
- `apple-mobile-web-app-title` が効くか：design 8 の注のとおり未確認（効かなくても `<title>` と manifest の `name` が同じ）。
- r2 で足した `DESIGN_D31_` の 1 本が、backend-engineer の言う「act() の `app.seq += 1` を消した実装」で本当に落ちるか：実装を変えずに確かめる手段がないので、変異の確認は G3 の reviewer か backend-engineer に頼む（テストの作りとしては、必須のエラーは S2 を描き直さないので、描き直しで待ちを捨てる実装では 1 回目の答えが返った後に S8 が描かれ `data-state` が `settings` になって落ちる）。
- 11 章 #5 の扱い：決まっていないので「未検証」ではなく「未決」。AC には影響しない。
