# 検証レポート 001-daily-learning：診断と今日の学習（Web アプリ「今日の一手」）

判定：PASS

- 関門：G3（機能完了）
- 検証した役：verifier　日時：2026-11-03 23:13〜23:40（JST）
- コミット：e13d68f1a91e14a0f5303847768063473277ec54（feat/001-daily-learning、PR #4 の最新）。作業ツリーに受け入れテストの変更なし（`git status --short backend/tests/acceptance` が空）
- 環境：macOS 27.2（26B123）、Node v24.22.1、@playwright/test 1.64.1、Chromium 156.0.8078.4（chromium-1248）、WebKit 27.2（webkit-2370）、@axe-core/playwright 4.14.0、ajv 8.20.0。iOS のアプリはないので Xcode とシミュレーターは使わない（Xcode 27.2 は入っている）。接続先：受け入れテストのフォルダの静的サーバー `http://127.0.0.1:<port>/engineer/`（配布物は `backend/scripts/build.mjs --version 2026-11-30.1` で mkdtemp の一時フォルダにビルド）。timezoneId Asia/Tokyo、locale ja-JP（AC-26 の 1 本だけ en-US）
- 読み替え（test-plan の冒頭と同じ）：「シミュレーター」は Playwright の Chromium と WebKit、「再起動」は再読み込みと新しいタブ、「AX5」はルートの文字サイズ 200%（9 章）と幅 320 CSS px、「performAccessibilityAudit()」は axe-core。
- G3 の FAIL 条件の確認：FAIL か未検証の AC 0 件、飛ばしたテスト 0 件、揺れたテスト 0 件、PRD の根拠のない受け入れテストの変更 0 件、0 件であるべき検査はすべて 0 件（6 章）。

## 1. 実行したコマンドと結果
どのコマンドにも再試行を付けていない（`--retries=0` を明示。設定も `retries: 0`）。出力は evidence/ のログに全文があり、ここには最後の数行を貼る。

### コマンド 1（この機能の受け入れテスト全件）
- コマンド：`cd backend/tests/acceptance && npm ci && npx playwright test --retries=0 --reporter=list,json`（PLAYWRIGHT_JSON_OUTPUT_NAME=evidence/g3-full-run.json）
- 終了コード：0
- テストの件数（成功 / 失敗 / 飛ばした）：133 / 0 / 0（chromium 67、webkit 66。AC-15 は chromium だけ：W-11）
- 出力：docs/verification/001-daily-learning/evidence/g3-full-run.log（148 行）、JSON は evidence/g3-full-run.json（annotation に計った時間と件数）

```text
# date: 2026-11-03 23:13:43 +0900
# commit: e13d68f1a91e14a0f5303847768063473277ec54
# cmd: cd backend/tests/acceptance && npm ci && npx playwright test --retries=0 --reporter=list,json
# node: v24.22.1
（…133 本の ✓ の行…）
  133 passed (38.4s)
# exit: 0
```

### コマンド 2（影響「大」の AC と一度でも落ちたテストを 5 回ずつ）
- コマンド：`cd backend/tests/acceptance && npx playwright test -g 'AC(1|2|5|6|7|8|9|10|11|12|13|14|15|16|19|20|22|23|24|25|28|31|32)_' --repeat-each=5 --retries=0 --reporter=list,json`
- 対象：test-plan 1 章の影響「大」のリスク R1〜R5 に関わる AC（AC-1、2、5〜16、19、20、22〜25、28、31、32）と、G2 の後に一度 ENOENT で落ちた AC-20 の 2 本（evidence/ac20-enoent-before-fix.log）
- 終了コード：0
- テストの件数（成功 / 失敗 / 飛ばした）：445 / 0 / 0（別々のテスト 89 本 × 5 回。JSON で 1 本ずつ 5 回とも passed であることを数えた）
- 出力：evidence/g3-repeat5.log、evidence/g3-repeat5.json

```text
# cmd: npx playwright test -g 'AC(1|2|5|6|7|8|9|10|11|12|13|14|15|16|19|20|22|23|24|25|28|31|32)_' --repeat-each=5 --retries=0 --reporter=list,json
  445 passed (2.1m)
# exit: 0
```

### コマンド 3（契約が受け入れテストに求めた予算と、PRD 12 の非機能要件の証拠。AC ではない）
- `cd backend/tests/acceptance && npm run check:seeds` → 終了コード 0、seed 10 件、期待と違う結果 0 件
- `cd backend && node scripts/build.mjs --out <一時> --version 2026-11-30.1` → 終了コード 0（19 ファイル）。`node scripts/check-budget.mjs <一時>/dist` → 終了コード 0、合計（gzip 後）62,960 / 150,000 バイト（殻 24,084 / 26,000、文言 6,510 / 8,000、アイコンと manifest 2,173 / 10,000、課題集 30,193 / 106,000）
- `grep -c 'Content-Security-Policy' dist/index.html` → 1。`grep -rnE "__test|[?&](reset|now|seed)=|location\.search" backend/public` → 0 件（test-hooks.md「本番に入っていないことの確かめ」）
- `cd backend && npm run check:contracts` → 見本 41 件、期待と違う結果 0 件。`node --test 'tests/unit/**/*.test.mjs'` → 94 pass / 0 fail（参考。backend-engineer の単体テスト）
- 予算の受け入れテスト `BUDGET2_課題集の本文の平均600字以下_gzip後106000バイト以下`：両ブラウザで passed。平均の字数 287.1、gzip 後 30,193 バイト

### コマンド 4（スクリーンショットと axe、キーボードの一巡。受け入れテストの本数は変えない：tools/ は `tests/` の外で `*.spec.mjs` でない）
- `cd backend/tests/acceptance && node tools/screenshots.mjs --out docs/verification/001-daily-learning/evidence/screenshots --browser both` → 終了コード 0、118 枚（問題 0）、axe 91 画面で違反 0。続けて `--only '^S0_loading$'`（opacity 1 を待つ直し。両ブラウザ）と `--only '^(dialog_|S0_error_invalidData)'`（ダイアログ 2 つと S0 error を 4 通りに。chromium）で撮り直し、合計 127 枚、axe 94 画面。ログ：evidence/screenshots-run.log、一覧：evidence/screenshots/index.tsv（127 行）、axe：evidence/screenshots/axe/axe-summary.tsv（94 行）と JSON 94 個
- `node tools/keyboard-tour.mjs --browser chromium --log evidence/keyboard-tour-chromium.log` → 終了コード 1、`--browser webkit` → 終了コード 1。どちらも道具の「問題」2 件は、下の 7 章で見たとおり不具合ではない（`settings.privacy` は契約で DOM に置かない、ダイアログの BODY はブラウザの枠へのフォーカス）。ログ：evidence/keyboard-tour-chromium.log、evidence/keyboard-tour-webkit.log

## 2. 受け入れ条件ごとの結果
動いたテストの数は chromium + webkit の合計（コマンド 1）。飛ばしたテストは全 AC で 0。証拠のスクリーンショットのパスは evidence/screenshots/ からの相対（chromium。webkit は webkit/ の下に同名）。annotation の値は evidence/g3-full-run.json から写した。
| AC | 結果（PASS / FAIL / 未検証） | 動いたテストの数 | 飛ばしたテストの数 | 証拠（テストの名前、ログの行、スクリーンショットのパス） |
|---|---|---|---|---|
| AC-1 | PASS | 2 | 0 | AC1_初めて開くと診断が始まり3問で終わる_進み具合n/3_切り替え500ms以内。計った時間 ms（始める→1、1→2、2→3、3→課題）：chromium 2, 1, 1, 3、webkit 2, 1, 1, 1（上限 500、500、500、1,000）。S1_diagnosis.start_light.png、S2_question_1〜3_light.png |
| AC-2 | PASS | 6 | 0 | AC2_…_backend_intermediate / _frontend_beginner / _git_advanced。finish → task.today ms：chromium 5 / 13 / 2、webkit 1 / 1 / 3（上限 1,000）。S3_task.today_light.png |
| AC-3 | PASS | 2 | 0 | AC3_課題集の全件が4要素を持ち所要時間が1〜15分（配布物の data/tasks.json を HTTP で全件） |
| AC-4 | PASS | 2 | 0 | AC4_課題集は126件以上で18組すべて7件以上でIDの重複が0件。全体 126、18 組すべて 7 |
| AC-5 | PASS | 2 | 0 | AC5_完了するとtask.rateになり_答えるとtask.done_同じ日に再読み込みしてもtask.doneのまま。S4_task.rate_light.png、S5_task.done_light.png |
| AC-6 | PASS | 2 | 0 | AC6_翌日には過去に出した課題のIDと一致しない課題が出る |
| AC-7 | PASS | 6 | 0 | AC7_too_hard / too_easy / no_time を申告すると…。S6_task.skipped_too_hard / too_easy / no_time_light.png |
| AC-8 | PASS | 20 | 0 | AC8_1通り目〜9通り目（5a、5b を含む 10 本 × 2）。annotation の翌日の段階：1 beginner、2 advanced、3 intermediate、4 intermediate、5a intermediate、5b intermediate、6 beginner、7 advanced、8 beginner、9 intermediate（test-plan 2 章の期待と同じ） |
| AC-9 | PASS | 8 | 0 | AC9_役に立った / 立たなかった / 選ばずに再読み込み / 今回は答えない（4 本 × 2） |
| AC-10 | PASS | 2 | 0 | AC10_課題が尽きるとtask.exhaustedと文言とやり直しの操作が出て_…。出し終えた件数 7。S7_task.exhausted_light.png |
| AC-11 | PASS | 2 | 0 | AC11_2問目の保存が失敗してもerror.storage.messageと選択が残り_…。S2_error_storage_light.png |
| AC-12 | PASS | 4 | 0 | AC12_オフラインでも AC-1_AC-2_AC-5_AC-9 の操作が動き_送信は0件（切り替え ms chromium 2, 2, 1, 4、webkit 1, 2, 1, 1）／ AC12_オフラインでもAC-7の申告が動き_送信は0件。送信 0 件 |
| AC-13 | PASS | 2 | 0 | AC13_persistを断られても完了と再読み込みでtask.done_履歴1件_設定にnotPersistedと書き出しがある。persist() 1 回。S8_settings_notPersisted_light.png |
| AC-14 | PASS | 4 | 0 | AC14_今日の課題を出していない日に…（seed 7 行、最後の 3 行 done、今日 2026-09-08）／ AC14_今日の課題が出ている日に…（やり直しの前 backend-intermediate-004、翌日 frontend）。S2_redo_fromSettings_light.png |
| AC-15 | PASS | 1（chromium だけ：W-11） | 0 | AC15_遅い回線とCPU4倍の制限でキャッシュなしに開き_data-debug-load-msが5回とも2000以下。値 911, 906, 897, 891, 896 ms |
| AC-16 | PASS | 2 | 0 | AC16_すべてのデータを削除すると再読み込みでdiagnosis.startになり_やり直した後の履歴は0件。dialog_settings.delete.confirm_light.png、S10_history_empty_light.png |
| AC-17 | PASS | 8 | 0 | AC17_diagnosis.start / task.today / task.done / task.exhausted_横スクロール0_切り詰め0_操作できる要素がすべて押せる。scrollWidth 320 / clientWidth 320。S1_diagnosis.start_w320.png、S3_task.today_backend-beginner-005_w320.png（長いインラインコード） |
| AC-18 | PASS | 2 | 0 | AC18_移動キー(Tab系)とEnter_Spaceだけで診断から完了まで進み_操作した要素がfocus-visibleで枠が3px以上。10 要素すべて focusVisible true、outline 3 px（chromium Tab、webkit Alt+Tab） |
| AC-19 | PASS | 2 | 0 | AC19_書き出すとJSONが1つダウンロードされ_…。kyounoitte-2026-11-03.json。S8_export_done_light.png |
| AC-20 | PASS | 2 | 0 | AC20_保存データのないブラウザで読み込むと_…。読み込み後の状態 task.done。5 回繰り返しでも落ちない（4 章）。dialog_settings.import.confirm_light.png |
| AC-21 | PASS | 6 | 0 | AC21_iOS_Safari…／ AC21_iPadOS_Safari…／ AC21_UAを偽装しない…0回。S1_addToHomeScreen_light.png、S8_homeScreen_guide_light.png |
| AC-22 | PASS | 2 | 0 | AC22_スタンドアロンで初めて開くと読み込みの案内が出て_…。S1_standalone_import_light.png |
| AC-23 | PASS | 4 | 0 | AC23_task.today…／ AC23_task.done…。表示までの ms（再読み込み / 新しいタブ）：chromium 44 / 61、69 / 75、webkit 140 / 100、125 / 78（上限 3,000）。送信 0 + 0 件 |
| AC-24 | PASS | 2 | 0 | AC24_統計の9つの値が期待どおりで_…。S9_settings.stats_light.png |
| AC-25 | PASS | 2 | 0 | AC25_版番号が新しいファイルはerror.import.messageで拒み_履歴1件と診断と状態は変わらない。S8_import_error_version_light.png |
| AC-26 | PASS | 4 | 0 | AC26_en-US…一致し_キーの差が0件（ja 145、en 145）／ AC26_ja-JP…。S1_diagnosis.start_en.png |
| AC-27 | PASS | 12 | 0 | AC27_<6 画面>_axe-coreでserious以上の違反が0件。violations 0（7 章） |
| AC-28 | PASS | 2 | 0 | AC28_差し替え後2秒おきの再読み込み3回以内で…。data-build-version × 3：2026-11-30.1 → 2026-12-14.1 → 2026-12-14.1 |
| AC-29 | PASS | 2 | 0 | AC29_各組でexternalが20%以下_…。external は infra ×3、testing/advanced、git ×3 の各 1/7 |
| AC-30 | PASS（該当なし ではない。課題集に external が 7 件ある） | 4 | 0 | AC30_in_appを出し終えた翌日はexternalの課題が出て_印と要る道具が題名と同じ画面に見える（git-advanced-005、tools 2 件）／ AC30_in_appの課題を出した日は…印が0件。S3_task.today_external_light.png |
| AC-31 | PASS | 4 | 0 | AC31_診断済みで開くと操作0回でtask.todayが見え_…重なる要素0件／ AC31_今日の課題を完了済みなら…。dialogs 0、modals 0、fixed [] |
| AC-32 | PASS | 6 | 0 | AC32_200文字を入力して再読み込みすると…／ …タブを閉じ新しいタブで開くと…／ …翌日に開くと…noneの行のanswerに残る。S3_answer_saved_light.png |

AC 番号のないテスト：`BUDGET2_` の 1 本だけ（契約 W-6、budgets.md 2 が求めたもの。1 章のコマンド 3）。

## 3. 状態ごとの結果
| 状態 | 選んだもの（自動 / G4 の人 / 範囲外） | 結果 | 証拠のパス、または理由 |
|---|---|---|---|
| 初めて起動 | 自動 | PASS | 新しいコンテキスト（保存、SW、キャッシュが空）で AC-1、2、11、12、13、18、21、22、26、27。S1_diagnosis.start_light.png、S2_question_1_light.png |
| データがある | 自動 | PASS | addInitScript の seed（W-7）で AC-5〜10、14〜17、19、20、23〜25、28、30〜32。S3_task.today_light.png、S5_task.done_light.png、S10_history_light.png |
| 前の版からの更新 | 自動（配布物の版）＋範囲外（保存データの版） | PASS（配布物） | AC-28：旧 2026-11-30.1 → 新 2026-12-14.1 で履歴 3 件と診断が同じ。探索 R4（8 章）で 0.5 秒おきの再読み込みでも旧版に戻らない。保存データの formatVersion は 1 が最初の版で前の版がない（data.md 6） |
| オフライン、サーバーエラー | 自動（オフライン）＋範囲外（サーバーエラー） | PASS（オフライン） | AC-12（操作）、AC-23（再読み込みと新しいタブ）。探索 R4 で manifest、icon、tasks.json、en.json、sw.js のオフライン応答。静的ホスティングの 5xx はアプリの画面がない（design 5 の冒頭） |
| 権限を断った | 自動（その場）＋範囲外（あとから） | PASS | AC-13（persist() の拒否の注入、1 回）。S8_settings_notPersisted_light.png。あとから撤回する操作は Web の persist にない。補足：注入なしでも headless の Chromium / WebKit は persist() に false を返すので、S8_settings_light.png にも notPersisted が出ている（11 章 #3） |
| バックグラウンドから復帰 | 自動 | PASS | AC-32（再読み込み、タブを閉じて新しいタブ）、AC-23（新しいタブ）。画面を開いたまま日付が変わる場合は探索 R3（8 章） |
| 言語と地域（ja、en） | 自動 | PASS | AC-26（en-US、ja-JP）。英語の全画面：S1〜S10 とダイアログの `_en.png`（lang=en を index.tsv に記録） |
| 大きい文字、ダークモード | 自動（幅 320、文字 200%、ダーク）＋G4 の人（実機の OS の文字サイズ最大とダーク） | PASS（崩れ、切れ、横スクロールなし） | AC-17（幅 320）。`_ax5.png`（ルートの font-size 200%。ヘッダーの nav が 2 行目に落ち、申告のボタンは縦積み：design 9 のとおり）、`_dark.png`（colorScheme dark）。index.tsv の scrollWidth/clientWidth は全 127 枚で等しい（横スクロール 0）。実機の見た目は G4 で Takuma |
| 容量不足、割り込み | 自動（容量不足の注入）＋範囲外（割り込み） | PASS | AC-11（QuotaExceededError）。探索 R5 で答えの自動保存、申告、「役に立った」、読み込みの置き換え、削除、起動時の各 setItem（8 章）。電話などの割り込みは Web にはなく、タブの切り替えで代える |

## 4. 揺れの確認
コマンドは 1 章のコマンド 2（`--repeat-each=5 --retries=0`）。1 本ずつ 5 回とも passed（evidence/g3-repeat5.json を数えた：別々のテスト 89 本、実行 445、失敗 0）。
| テストの名前 | コマンド | 回数 | 落ちた回数 | 原因の型 |
|---|---|---|---|---|
| AC1_（chromium、webkit） | コマンド 2 | 5 × 2 | 0 | — |
| AC2_ × 3（両ブラウザ） | コマンド 2 | 5 × 6 | 0 | — |
| AC5_、AC6_、AC10_、AC11_、AC13_、AC16_、AC19_、AC22_、AC24_、AC25_、AC28_（両ブラウザ、各 1 本） | コマンド 2 | 5 × 22 | 0 | — |
| AC7_ × 3、AC9_ × 4、AC32_ × 3（両ブラウザ） | コマンド 2 | 5 × 20 | 0 | — |
| AC8_ × 10（両ブラウザ） | コマンド 2 | 5 × 20 | 0 | — |
| AC12_ × 2、AC14_ × 2、AC23_ × 2、AC31_ × 2（両ブラウザ） | コマンド 2 | 5 × 16 | 0 | — |
| AC15_（chromium） | コマンド 2 | 5 | 0 | — |
| AC20_（両ブラウザ。G2 の後に一度 ENOENT で落ちたテスト） | コマンド 2 | 5 × 2 | 0 | — （落ちた原因は Playwright が閉じたコンテキストのダウンロードを消すこと＝後片付けの型。a7fc7e9 で複製に直した：5 章） |

## 5. 受け入れテストの変更
- この機能のテストを最初に入れたコミット：a6facf4（`git log --oneline origin/main..HEAD -- backend/tests/acceptance` のいちばん下）
- コマンド：`git diff a6facf4..HEAD -- backend/tests/acceptance`。G2 のテストの判定（r2：b2bffba、r3：478ef41、r4：f981670）までの変更は test-plan.md 10 章に 1 行ずつ根拠がある。G2 のコードの判定の後（`git diff f981670..HEAD -- backend/tests/acceptance`）の変更は次の 1 件だけで、作業ツリーに未コミットの変更はない。
| ファイル:行 | 何を変えたか | PRD の根拠（AC 番号と PRD の文） |
|---|---|---|
| backend/tests/acceptance/helpers/app.mjs:171-189（コミット a7fc7e9） | `exportJson` が `download.path()` の代わりに `download.saveAs` でテストの出力フォルダに byte 単位で複製し、その複製を返す。期待する値、spec、Then は変えていない | AC-20 Given「保存データがないブラウザで、AC-19 のファイル（版番号が今の版）がある」。test-hooks.md W-9「書き出し：`page.waitForEvent('download')` で 1 件」「読み込み：隠した input に `setInputFiles`」。書き出し元のコンテキストを閉じると Playwright 1.64.1 がダウンロードのファイルを消すため（evidence/ac20-enoent-before-fix.log）、PRD の Given を作る手段の直しであって期待の変更ではない |

G3 で新しく置いたのは tools/screenshots.mjs と tools/keyboard-tour.mjs（証拠を撮る道具。`tests/` の外で `*.spec.mjs` でないので `playwright test` の対象外）。`npx playwright test --list` の本数は 133 のまま（コマンド 1 と同じ件数）。

## 6. 検査の件数
受け入れテストのフォルダの tests、helpers、server、global-setup.mjs、playwright.config.mjs（node_modules、tools、test-results を除く）。
| 検査 | コマンド | 件数 | 理由 |
|---|---|---|---|
| sleep で待つ | `grep -rnE 'sleep\(\|usleep\|Thread\.sleep\|time\.sleep\|asyncio\.sleep\|waitForTimeout' tests helpers server global-setup.mjs playwright.config.mjs` | 0 | — |
| 飛ばす、失敗を許す | `grep -rnE 'XCTSkip\|XCTExpectFailure\|pytest\.mark\.skip\|skipif\|xfail\|pytest\.skip\|unittest\.skip\|test\.skip\|test\.fixme\|test\.only\|\.skip\(' …` | 0 | — |
| 再試行 | `grep -rniE 'retry\|rerun' …` | 0（文字列の一致は 2 件：tests/ac11-ac13-storage.spec.mjs:28、:33。どちらも契約の識別子 `error.storage.retry` を指す文字列で、再試行ではない） | 設定は `retries: 0`、判定のコマンドは `--retries=0` |
| 中を覗く import | `grep -rnE '@testable' …` と、`import … from` の行で node:、@playwright、@axe-core、ajv、./ と ../helpers、../server 以外のもの | 0 | backend/public、backend/scripts の import なし。配布物は HTTP、ビルドは CLI（spawnSync） |
| AC 番号の抜け（PRD にあってテストにない、その逆） | `grep -oE 'AC-[0-9]+' docs/prd/001-daily-learning.md \| sort -u` と `grep -rhoE "test\(.AC[0-9]+_" tests \| grep -oE 'AC[0-9]+' \| sort -u` | 0（PRD の AC-1〜AC-32 の 32 個すべてがテストの名前にあり、テスト側に PRD にない番号はない。PRD の grep に「AC-33」が 1 件出るが 18 章の Q11 の選択肢 B の文で、AC の定義ではない） | AC 番号のないテストは `BUDGET2_` の 1 本（契約 W-6） |
| 表示の文字や並び順で探す | `grep -rnE "getByText\|getByLabel\|text=\|hasText\|getByRole\|\.nth\(\|boundBy\|\.first\(\)\|\.last\(\)" tests helpers` | 6 | `getByRole('dialog')` 1 件（ac31:12）は test-hooks.md「AC-31 の重なる要素の数え方」1 が指定した数え方。`.nth()` 5 件（ac19:79 履歴 3 行目の answerText、ac17:86 操作できる要素の全件ループ、ac10:71-72 道具の項目の全件ループ、helpers/app.mjs:160 履歴の行の全件ループ）はすべて data-testid で絞った集合の繰り返しで、並び順で 1 つを選ぶものではない |
| 付け足し：setTimeout、Date.now、performance.now | `grep -rnE 'setTimeout\|Date\.now\|performance\.now' tests helpers` | 14（コメント 6、コード 8） | コード：helpers/app.mjs:63、:76 の performance.now は契約「文書が変わらない区間」の計測。ac12-ac23:86、:89、:98、:101 の Date.now は契約「文書が変わる区間」の計測。helpers/app.mjs:256 の setTimeout は SW が登録されないときに止まらないための上限（待つためではない）、:331 の `pause` は PRD AC-28 が決めた「2 秒以上の間隔」のためだけ |

## 7. アクセシビリティ監査
受け入れテスト AC-27（6 画面 × 2 ブラウザ、タグ wcag2a / wcag2aa / wcag21a / wcag21aa、serious 以上 0 件が Then）に加えて、G3 の道具で design 5 の全画面・全状態（47 の場面）に axe-core を流した（同じタグ。ライトと幅 320 の変種。chromium 49 画面 + webkit 45 画面 = 94）。結果の JSON：evidence/screenshots/axe/<browser>_<場面>_<変種>.json、一覧：evidence/screenshots/axe/axe-summary.tsv。
| 画面 | テストの名前 | 結果 | 見つかった問題 |
|---|---|---|---|
| S0 loading、error（読めない、JSON でない、保存先が使えない、削除の確認） | tools/screenshots.mjs（S0_*） | 違反 0（両ブラウザ） | なし |
| S1 diagnosis.start（通常、幅 320、iOS の案内、スタンドアロンの案内、案内の読み込みエラー） | AC27_diagnosis.start_…（passes 10）＋ tools（S1_*） | 違反 0（両ブラウザ） | なし |
| S2 diagnosis.question（1〜3 問目、未選択のエラー、保存の失敗、途中の再開、やり直し） | AC27_diagnosis.question_…（passes 12）＋ tools（S2_*） | 違反 0 | なし |
| S3 task.today（通常、幅 320 の長いコード、external、保存しました、上限、自動保存の失敗、申告の失敗） | AC27_task.today_…（passes 21）＋ tools（S3_*） | 違反 0 | なし |
| S4 task.rate（通常、保存の失敗） | tools（S4_*） | 違反 0 | なし |
| S5 task.done | AC27_task.done_…（passes 8）＋ tools | 違反 0 | なし |
| S6 task.skipped（too_hard、too_easy、no_time） | tools（S6_*） | 違反 0 | なし |
| S7 task.exhausted | AC27_task.exhausted_…（passes 10）＋ tools | 違反 0 | なし |
| S8 settings（通常、保存データなし、診断の途中、notPersisted、書き出しました、読み込みエラー 2 種、ホーム画面の案内） | AC27_settings_…（passes 20）＋ tools（S8_*） | 違反 0 | なし |
| ダイアログ settings.import.confirm、settings.delete.confirm | tools（dialog_*） | 違反 0 | なし |
| S9 settings.stats（値あり、0） | tools（S9_*） | 違反 0 | なし |
| S10 history（行あり、答えを開いた、空） | tools（S10_*） | 違反 0 | なし |

キーボードだけの一巡（evidence/keyboard-tour-chromium.log、keyboard-tour-webkit.log。移動キーは契約「キーボードの移動キー」どおり chromium が Tab、webkit が Alt+Tab）：
- AC-18 の受け入れテスト（S1 → S2 ×3 → S3 → S4 → S5。10 要素すべて focus-visible、outline 3 px）に加え、S5 → 履歴（Enter）→ `<summary>` を Enter で開き Space で閉じる → 前へ（Shift+Tab / Alt+Shift+Tab）→ 設定 → 削除のダイアログ（初期フォーカス `settings.delete.confirm.cancel`、Escape で閉じてフォーカスが `settings.delete` に戻り、データは消えない）→ 統計 → 戻る → やり直し（S2 の先頭 `diagnosis.progress` にフォーカスが移る。radio は ArrowDown で次を選ぶ）→ やめる → 設定 → アプリ名で今日の課題、まで両ブラウザで届いた。
- 道具が「問題」と数えた 2 件は不具合ではない：(1) `settings.privacy` に止まらない＝契約 identifiers.md 3「`settings.privacy` は、リンク先が決まるまで（design の U-9）DOM に置きません」のとおり要素がない（13 章に申し送り）。(2) ダイアログの中で Tab を押し続けると `cancel` の後に activeElement が BODY になる＝`showModal()` の外の文書は inert で、ヘッドレスではフォーカスがブラウザの枠へ出る瞬間（WebKit は `<dialog>` 自身に止まる）。ダイアログの後ろの要素（`settings.*`）に止まったことは 1 回もない。
- VoiceOver / TalkBack の読み上げは G4 で Takuma（13 章）。

## 8. 探索セッション
test-plan 6 章のチャーターごとに 1 本（影響「大」の R1〜R5）。使い捨てのスクリプト（Playwright のライブラリで操作し、手順ごとに data-state と保存の中身を記録。スクラッチパッドに置き、終わったら消した）で行い、ログは evidence/exploration/R<n>.log、スクリーンショットは exploration/R<n>_<手順>_<名前>.png。すべて chromium、viewport 390 × 844、配布物 2026-11-30.1。保存の中身は `localStorage['kyounoitte:data']`（contracts/data.md）をテスト側から読んだ。

### セッション 1（R1：読み込みの確認ダイアログと置き換え・拒否）
- チャーター：`settings.import.confirm` を、同じ日・違う日・`current` のあるファイル・空の history・`device` を含むファイル・5,000,000 バイト超・JSON でないファイルで探り、置き換えの前後で履歴が結合されず、拒否のときにデータが 1 文字も変わらないか、`firstOpenDate` がファイルの値になるかを見つける
- 区切り（予定と実際）：40 操作 → 18 操作（2 秒）。seed-ac14、2026-11-04
- 試したこと：同じ日のファイル → 確認（要約「履歴 3 件、初めて開いた日 2026-11-01」、初期フォーカス `cancel`）→ やめる（保存の文字列が同一、フォーカスは `settings.import` に戻る）→ 置き換える（履歴 3 = ファイルの 3、結合なし、`device` はこのブラウザの値）。違う日（firstOpenDate 2026-10-01、git/advanced、1 件）→ firstOpenDate と diagnosis と levels がファイルの値、統計の first-open-date も 2026-10-01。`current` と `device` を含む見本 valid-all-fields.json → `current` はファイルの値、`device` はファイルのもの（homeGuideClosed）を使わずこのブラウザの値（data.md 7-4 のとおり）。空の history（診断済み）→ 確認「履歴 0 件」→ 置き換えで task.today。5,000,001 バイト → 461 ms で `error.import.reason.schema`、データ不変（7-1）。4,999,999 バイト → 読んで確認が出る。JSON でない、他のアプリ、余分な項目、UTC の日時、「なし」（firstOpenDate なし）、空のファイル、formatVersion 0 → すべて `error.import.message` + `reason.schema`（`role=alert`）、データは 1 文字も変わらない、確認は出ない。診断の途中のブラウザ → S8 は読み込みだけ（export / redo / delete 0）、読み込むと確認なしで置き換わり task.today（data.md 7-3）
- 見つけた不具合：なし
- 疑問：なし
- 次に試すこと：壊れた保存データ（S0 error）からの `error.app.exportRaw` のファイルを S8 で読み込んだときの拒否の文言（今回は未実施）
- 使い捨てのテスト：消した（評価は data.md 7 の各行と一致したので再現するテストは不要）

### セッション 2（R2：段階の規則）
- チャーター：領域をまたぐ申告、やり直しで段階を変えた直後、`none` が 2 行続く、`too_easy` → `too_hard` の交互で探り、`levels` が領域ごとに独立して動くか、`task.skipped.levelHint` が too_hard / too_easy のときだけ出るかを見つける
- 区切り：40 操作 → 12 操作（12 日分、302 秒。1 日ごとに setFixedTime と再読み込み）
- 試したこと：backend 中級で too_hard ×2 → 翌日 beginner（hint 1）。同じ日に git/advanced へやり直し → その日は backend の課題のまま、`levels` は {backend: beginner, git: advanced}（backend は消えない）。翌日から git/advanced、too_hard ×2 → git intermediate、backend は beginner のまま（領域ごとに独立）。too_easy / too_hard / too_easy の交互 3 日 → intermediate のまま。`none` 2 日（1 日は答えだけ書く）→ 段階不変、`none` の行に答えが残る。11-08 too_easy → none → none → 11-11 too_easy → 翌日 advanced（`none` は数えず流れも切らない：data.md 5、AC-8 の 8 通り目と同じ）。`levelHint` は too_hard / too_easy の 7 回すべてで 1 件、`none` と done の日は 0 件
- 見つけた不具合：なし
- 疑問：なし
- 次に試すこと：やり直しで同じ領域の段階だけ変えた直後の申告（levels の上書きと 2 回連続の数え方）
- 使い捨てのテスト：消した。証拠 exploration/R2.log、R2_12_history.png

### セッション 3（R3：画面を開いたまま日付が変わる）
- チャーター：23:55 に出した課題を 0:05 に「完了」、答えを書いている途中、`task.rate` のまま、`settings` のまま、やり直しの S2 の途中、を `setFixedTime` の差し替えで探り、前日の課題が `none` の行に移って答えが残り、翌日の課題が出て、`task.rate` に進まないかを見つける
- 区切り：30 分 → 6 操作（37 秒。最後の 1 操作はロケーターの待ちで中断）
- 試したこと：(a) 23:55 に答えを書きかけ → 0:05 に再読み込みせず「完了」→ `task.rate` には進まず、前日の課題は `none` の行（答え「23 時 55 分に書きかけ」は残る）、翌日の課題（005）が `task.today` に出る（R3_02_done_after_midnight.png）。ただし押した直後の保存では新しい `current`（005）の `answer` に前日の文字列が入っており、再読み込み後は ''（pagehide の保存が空の欄で上書きしたと読める）。(b) `task.rate` のまま 0:01 に「役に立った」→ 記録されず（前日の行は done / unanswered）、翌日の課題が出る。(c) `settings` のまま日付が変わり `app.name` → 翌日の課題、履歴 4 行（前日は none）。(d) やり直しの S2 の 2 問目で日付が変わり「次へ」→ 3 問目に進まず翌日の `task.today`（R3_06_exception.png。やり直しの回答は捨てられ、diagnosis は前のまま）。再読み込み後に同じ日付の行の重複はなく、`current` は翌日の 1 件だけ
- 見つけた不具合（11 章の番号）：#1（提案）
- 疑問：日付が変わった後の最初の操作をどう扱うかは PRD にも design 5 にも契約にもない（test-plan 3 章でも探索に回していた）。「表示している課題に対して操作を効かせる」か「操作を捨てて翌日の課題を出す（今の実装）」かは pdm と tech-lead の決め
- 次に試すこと：23:59 に申告の保存が失敗し 0:01 に retry したとき、どの日の行に書かれるか
- 使い捨てのテスト：消した（AC の範囲外なので再現するテストは足していない。足すなら決めた後に AC 番号つきで）

### セッション 4（R4：Service Worker）
- チャーター：差し替え後 0.5 秒おきの再読み込み、`?v=1` 付きの URL、`/engineer/index.html`、新しいタブ、manifest と icon-180.png のオフライン応答、install の途中でオフライン、で探り、古い版に戻る・白い画面・`net::ERR_FAILED` が出ないかを見つける
- 区切り：40 操作 → 5 操作 + 追試 3 通り（9 秒 + 約 40 秒）
- 試したこと：旧版で SW の準備（cache `kyounoitte-2026-11-30.1`）→ 新版に差し替え 0.5 秒おきに 6 回再読み込み → 6 回とも旧版のまま（新版にならないが、白い画面も console.error も `net::ERR_FAILED` も 0）。追試（R4.log の末尾）：500 ms × 6 は旧版のままで、その後 2.5 秒あけて 1 回で新版（cache も新版だけ）。1,000 ms × 6 は 3 回目で新版、2,000 ms × 6 は 2 回目で新版、どちらも以後は旧版に戻らない。オフラインで `/engineer/index.html`、`/engineer/?v=1`、`/engineer/`（新しいタブ）→ すべて 200、fromServiceWorker、task.today、requestfailed 0。オフラインの fetch：manifest.webmanifest（application/manifest+json、231 B）、icon-180.png（image/png、2,107 B）、data/tasks.json、i18n/en.json、sw.js（text/javascript）→ すべて 200（budgets.md 6）。初めての訪問で commit 直後にオフライン → `net::ERR_INTERNET_DISCONNECTED`（ブラウザのエラーページ。design 5 の冒頭のとおり範囲の外）、オンラインに戻して再読み込みで diagnosis.start
- 見つけた不具合：なし（#2 は提案として記録）
- 疑問：0.5 秒おきの再読み込みでは更新が完了しない（install の途中で次の navigation が来る）。PRD AC-28 の「2 秒以上あけて 3 回以内」は満たす
- 次に試すこと：新版の install の途中でタブを閉じて開き直したときの版
- 使い捨てのテスト：消した。証拠 exploration/R4.log

### セッション 5（R5：保存の失敗の注入）
- チャーター：答えの自動保存、申告、「役に立ったか」、読み込みの置き換え、削除の直後、の各 setItem で注入し、`error.storage.message` が問題の近くに出て入力が保たれ、retry で同じ中身が 1 回で保存されるか、起動時の保存の失敗で課題が画面に残るかを見つける
- 区切り：40 操作 → 6 操作（2 秒）。setItem の回数はテスト側の包みで数えた
- 試したこと：自動保存の失敗 → `error.storage.message`（`role=alert`、textarea の直下、次が `error.storage.retry`）、入力は残り、retry で setItem 1 回・保存された answer が同じ（R5_01）。申告（難しすぎ）の失敗 → S3 のまま、答えも残り、retry で setItem 1 回・task.skipped（R5_02）。「立たなかった」の失敗 → S4 のまま、retry で task.done・helpful not_helpful。読み込みの置き換えの失敗 → ダイアログの中に error、データは前のまま、retry で置き換わり履歴 5（R5_04）。削除 → removeItem なので失敗は起きず diagnosis.start（印は残る）。起動時の保存（今日の課題を出す）の失敗 → 課題は画面に残り error + retry が出る、retry で `current` が保存され、再読み込みで同じ課題（R5_06_startup_error.png）
- 見つけた不具合：なし
- 疑問：なし
- 次に試すこと：retry 自体が 2 回続けて失敗したときの表示
- 使い捨てのテスト：消した。証拠 exploration/R5.log

## 9. スクリーンショットとログ
置き場所：docs/verification/001-daily-learning/evidence/。すべて `ls` で見つかる（index.tsv の全行のファイルがある：`awk -F'\t' 'NR>1{print $1}' screenshots/index.tsv | while read f; do test -f screenshots/$f || echo MISSING $f; done` が空）。
撮り方：backend/tests/acceptance/tools/screenshots.mjs。viewport 390 × 844、deviceScaleFactor 2（スマホ）、幅 320 の変種は 320 × 568。ダークは `colorScheme: 'dark'`（`prefers-color-scheme: dark`）。大きい文字（ax5）は、design 9 の「OS の文字サイズ最大」の読み替えとして `document.documentElement.style.fontSize = '200%'` を CSSOM で入れた（tokens.md 冒頭：文字と余白は rem で、ブラウザの文字サイズ設定に追従する。index.tsv の rootFontSize 列が 32px）。英語は `locale: 'en-US'`（index.tsv の lang 列が en）。chromium で 82 枚（通常の状態は light / dark / ax5 / en の 4 通り、ほかは light、幅 320 は 2 場面）、webkit で 45 枚（light だけ。幅 320 の 1 場面を含む）。どの場面をどの seed と日付で作ったかは tools/screenshots.mjs の SCENARIOS に 1 場面ずつ書いてある。
| ファイル（evidence/screenshots/ からの相対。webkit/ の下に同名の light） | 画面と状態 | 見た目 | 対応する AC |
|---|---|---|---|
| S0_loading_light.png | S0 殻：JS を止めて 1 秒後の `app.loading`（日英併記） | ライト（chromium、webkit） | —（design 5 S0） |
| S0_error_invalidData_{light,dark,ax5,en}.png | S0 error (1)：スキーマに合わない保存データ。`error.app.message` + reload / exportRaw / delete | 4 通り | —（design 5 S0 エラー (1)、U-5） |
| S0_error_notJson_light.png | S0 error (1)：JSON でない保存データ | ライト | 同上 |
| S0_error_storageUnavailable_light.png | S0 error (2)：localStorage が例外。reload だけ | ライト | —（design 5 S0 エラー (2)） |
| S0_error_dialog_delete_light.png | S0 error から `settings.delete.confirm` | ライト | —（design 5 S0） |
| S1_diagnosis.start_{light,dark,ax5,en}.png、S1_diagnosis.start_w320.png | S1 通常（＋幅 320） | 4 通り + 幅 320 | AC-1、AC-17、AC-26 |
| S1_addToHomeScreen_light.png | S1 iOS Safari の案内（iPhone 15 の UA、standalone false） | ライト | AC-21 |
| S1_standalone_import_light.png | S1 スタンドアロンの読み込みの案内 | ライト | AC-22 |
| S1_standalone_import_error_light.png | S1 案内からの読み込みの失敗（版が新しい） | ライト | AC-22、AC-25 |
| S2_question_1_{light,dark,ax5,en}.png、S2_question_2_light.png、S2_question_3_light.png | S2 1〜3 問目（進み具合 n / 3） | 4 通り（1 問目）、ライト | AC-1 |
| S2_error_required_light.png | S2 未選択で確定 → `error.diagnosis.required` | ライト | —（design 5 S2 エラー (1)） |
| S2_error_storage_light.png | S2 2 問目の保存の失敗 → `error.storage.message` + retry | ライト | AC-11 |
| S2_resume_inProgress_light.png | S2 途中の再開（valid-in-progress.json） | ライト | —（design 5 S2 通常、M2） |
| S2_redo_fromSettings_light.png | S2 やり直し（`diagnosis.cancel` と nav 2 つ） | ライト | AC-14 |
| S3_task.today_{light,dark,ax5,en}.png | S3 通常（seed-ac14、2026-11-04） | 4 通り | AC-2、AC-31 |
| S3_task.today_backend-beginner-005_w320.png | S3 幅 320、長いインラインコード（backend-beginner-005） | 幅 320（chromium、webkit） | AC-17 |
| S3_task.today_external_light.png | S3 external（印と要る道具。git-advanced-005） | ライト | AC-30 |
| S3_answer_saved_light.png | S3 `task.answer.saved` | ライト | AC-32 |
| S3_answer_limit_light.png | S3 2,000 字で `task.answer.limit` | ライト | —（design 5 S3、data.md） |
| S3_error_storage_answer_light.png | S3 自動保存の失敗（textarea の直下） | ライト | —（design 5 S3 エラー (1)） |
| S3_error_storage_report_light.png | S3 申告の保存の失敗（ボタン群の直上） | ライト | —（design 5 S3 エラー (2)） |
| S4_task.rate_{light,dark,ax5,en}.png | S4 通常 | 4 通り | AC-5、AC-9 |
| S4_error_storage_light.png | S4 回答の保存の失敗 | ライト | —（design 5 S4 エラー） |
| S5_task.done_{light,dark,ax5,en}.png | S5 通常（seed-ac14、2026-11-03） | 4 通り | AC-5、AC-31 |
| S6_task.skipped_too_hard_light.png、_too_easy_light.png、_no_time_light.png | S6（too_hard と too_easy は `levelHint` あり、no_time はなし） | ライト | AC-7 |
| S7_task.exhausted_{light,dark,ax5,en}.png | S7 通常（空の表示そのもの） | 4 通り | AC-10 |
| S8_settings_{light,dark,ax5,en}.png | S8 通常（保存データあり） | 4 通り | AC-13、AC-19、AC-28 |
| S8_settings_noData_light.png | S8 保存データなし（読み込みが主操作、書き出し・診断・記録・削除なし） | ライト | —（design 5 S8 空） |
| S8_settings_inProgress_light.png | S8 診断の途中 | ライト | —（design 5 S8 空） |
| S8_settings_notPersisted_light.png | S8 `settings.storage.notPersisted`（persist の拒否を注入） | ライト | AC-13 |
| S8_export_done_light.png | S8 `settings.export.done` | ライト | AC-19 |
| S8_import_error_version_light.png | S8 読み込みの失敗（版が新しい） | ライト | AC-25 |
| S8_import_error_schema_light.png | S8 読み込みの失敗（スキーマ：unknown-area） | ライト | —（design 5 S8 エラー (1)） |
| S8_homeScreen_guide_light.png | S8 ホーム画面の案内を開いた | ライト | AC-21 |
| dialog_settings.import.confirm_{light,dark,ax5,en}.png | ダイアログ settings.import.confirm（要約：履歴 3 件、初めて開いた日 2026-11-01） | 4 通り | AC-20 |
| dialog_settings.delete.confirm_{light,dark,ax5,en}.png | ダイアログ settings.delete.confirm | 4 通り | AC-16 |
| S9_settings.stats_{light,dark,ax5,en}.png | S9 通常（seed-ac24、2026-11-06） | 4 通り | AC-24 |
| S9_settings.stats_zero_light.png | S9 診断直後（0 と初めて開いた日） | ライト | AC-24（design 5 S9 空） |
| S10_history_{light,dark,ax5,en}.png | S10 3 行（seed-three-done-one-answer） | 4 通り | AC-5、AC-19 |
| S10_history_answerOpen_light.png | S10 `<details>` を開いた | ライト | AC-19、AC-32 |
| S10_history_empty_light.png | S10 空（`history.empty` と主操作） | ライト | AC-16 |
| webkit/*.png（45 枚） | 上の全場面のライト（S0〜S10、ダイアログ、幅 320 の 1 場面） | ライト（WebKit 27.2） | 同上 |
| screenshots/index.tsv | 127 枚の一覧（ブラウザ、viewport、変種、場面、AC、期待した data-state と実際、lang、rootFontSize、scrollWidth/clientWidth、結果） | — | — |
| screenshots/axe/axe-summary.tsv、axe/*.json（94） | axe の結果 | — | AC-27 |
| g3-full-run.log、g3-full-run.json | コマンド 1 | — | 全 AC |
| g3-repeat5.log、g3-repeat5.json | コマンド 2 | — | 影響「大」の AC |
| screenshots-run.log | コマンド 4 | — | — |
| keyboard-tour-chromium.log、keyboard-tour-webkit.log | キーボードの一巡 | — | AC-18 |
| exploration/R1.log〜R5.log、exploration/R*_*.png | 探索（8 章） | — | 11 章 |

受け入れテストの実行で撮ったスクリーンショット（AC21_、AC11_、AC13_、AC10_ など。test-results/ の中）は、同じ場面を上の道具で撮り直したので写していない（test-results/ は .gitignore 済み）。

## 10. 前の機能の受け入れテスト（回帰）
| 機能 | コマンド | 終了コード | 成功 / 失敗 / 飛ばした |
|---|---|---|---|
| なし（001-daily-learning が最初の機能） | — | — | — |

## 11. 見つかった問題
AC にひも付く不具合は 0 件。下はすべて AC の外で気づいたもの（提案）。
| # | 内容 | 再現の手順 | 再現するテストの名前 | AC | 重大度（重大 / 要修正 / 提案） | 直す役 |
|---|---|---|---|---|---|---|
| 1 | 画面を開いたまま日付が変わった後の最初の操作（「完了」「役に立った」「次へ」）が、表示中の課題には効かず捨てられ、翌日の課題に置き換わる。前日の課題は `none` の行になり答えは残る（データは壊れない）。押した直後の保存で翌日の `current.answer` に前日の答えが入り、pagehide の保存で消える（画面には出ない） | seed-ac14 を 2026-11-04 23:55 に開く → 答えを書く → `setFixedTime` で 2026-11-05 00:05 → 「完了」を押す。exploration/R3.log の 2、4、6 | なし（AC の範囲外。扱いを決めた後に AC 番号つきで足す） | —（AC-5、AC-9、AC-14 の Given はどれも同じ日の中） | 提案 | pdm と tech-lead が扱いを決める（PRD 11 の冒頭か contracts/data.md 4 に「操作の時点で日付が変わっていたら、表示中の課題にその操作を効かせる／効かせない」を 1 行）。実装は backend-engineer |
| 2 | 配布物の差し替えの後、0.5 秒おきの再読み込みでは 6 回（3 秒）たっても新版にならない。2 秒以上あければ 2〜3 回で新版になり、その後に旧版へ戻ることはない（AC-28 は満たす） | exploration/R4.log の 2 と追試 | なし | —（AC-28 は「2 秒以上あけて」） | 提案 | backend-engineer（RUNBOOK 3 の「2 秒おきに 3 回以内」の手順をそのまま守る。直す必要はない） |
| 3 | 注入なしでも headless の Chromium と WebKit では `persist()` が false を返し、保存データのある S8 に常に `settings.storage.notPersisted` が出る（S8_settings_light.png と S8_settings_notPersisted_light.png が同じ見た目）。実装はこの環境の返事どおりに動いている | seed-ac14 で S8 を開く | なし | —（AC-13 は拒否の注入が前提） | 提案 | G4 で Takuma が実機の Safari と Chrome で、ふつうの利用者にこの注意が常に出ないかを見る（出るなら文言の見直しは pdm と designer） |
| 4 | `settings.privacy` が S8 にない（design 6 の表にはある）。契約 identifiers.md 3「リンク先が決まるまで（design の U-9）DOM に置きません」のとおりで、U-9 は pdm が G5 の前に決める | S8 を開く。keyboard-tour-*.log | なし | — | 提案（申し送り） | pdm（U-9）→ tech-lead（契約）→ backend-engineer |

## 12. PRD とテストの食い違い
なし。

## 13. 未検証のものと理由
- 本物の iPhone / iPad の Safari 17 以上（ホーム画面への追加、スタンドアロンの `navigator.standalone`、7 日消去、`persist()` の実際の返事、OS の文字サイズ最大、ダークモード、VoiceOver の読み上げ順）：この環境では Playwright の WebKit 27.2 と偽装（W-16）まで。G4 で Takuma が実機で確かめる（ADR 0004、PRD 12、design 9）。
- Linux の WebKit（CI）での `Tab` / `Alt+Tab` のふるまい：macOS では contracts/test-hooks.md「キーボードの移動キー」どおり。CI の最初の実行で evidence/tab-keys.log と同じ出力を残す（契約の「未確認」）。
- GitHub Pages の本番 `https://matsuura-tak.github.io/engineer/`：配布の仕組み（.github/ のワークフロー）がまだない（RUNBOOK 3）。本番の `Content-Type`（manifest）、HTTPS、`/engineer/` の下での SW の scope は、Takuma が配った後に RUNBOOK 3 の確かめで見る。
- Chrome の最新 2 版（本物の Chrome）：Playwright の Chromium 156 で代えた。
- `apple-mobile-web-app-title` が効くか：design 8 の注のとおり未確認（効かなくても `<title>` と manifest の `name` が同じ）。
- 11 章 #1 の扱い（日付が変わった後の最初の操作）：決まっていないので「未検証」ではなく「未決」。AC には影響しない。
