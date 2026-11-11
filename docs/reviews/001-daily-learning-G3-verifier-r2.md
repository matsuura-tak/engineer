PASS

001-daily-learning G3 検証 r2（コミット 1560b36c8d2f946b0dc063b8fbce9e07d22f87a1、feat/001-daily-learning）。design-reviewer G3 r1 の verifier 向けの指摘 1、2、7 と提案 12 を閉じ、受け入れテスト全件と 5 回繰り返しが通り、AC にひも付く不具合は 0 件。レポート：/Users/takumamatsuura/src/engineer/docs/verification/001-daily-learning/verification.md（r2、13 章）。

## 指摘
AC にひも付く不具合は 0 件。PRD とテストの食い違いは「なし」。下はすべて AC の外（提案）。
- 提案（新規 #5）　evidence/exploration/S8wait-r2.log の 6〜9（AC なし。契約 data.md 4「画面を描いたとき」と 11「S8 へ移る操作の始めから数える」の間）：S8 へ移る操作の `persisted()` の待ち（上限 1,000 ms）の間に 0:00 をまたぐと、S8 の「描いた日」が翌日になり、その後の S8 / S9 / S10 の操作では前日の `current` を履歴に移さない（S10 に前日の行がなく、S9 の issued に数えられたまま）。`app.name` で移るが知らせは出ない。データは失われない。tech-lead が「画面を描いた日」を操作の始めの日にするかを契約 1 行で決める。
- 提案（持ち越し #2、#3、#4）：SW の 0.5 秒おきの再読み込み（AC-28 は満たす）、headless では `persisted()` が常に false で S8 に注意が出る（G4 で Takuma が実機で確認。D-31 で毎回読むので実機で許可されれば消える）、`settings.privacy` は契約どおり DOM にない（U-9 は pdm）。
- r1 の #1（日付が変わった後の操作）は design r6 / 契約で決まり、実装は探索の 15 場面すべてで契約と一致したので閉じた。
- 道具の問題として直した 1 件（製品の不具合ではない）：初回の全件で webkit の S8_export_done に axe の color-contrast 違反 1 件（#40855a、4.44:1）が出たが、知らせが不透明度で現れる途中を axe が計ったもの（トークン color.success #1B6E3A は 6.29:1）。tools/screenshots.mjs を「計算済み opacity が 1 になるまで待つ」に直して撮り直し、違反 0。
- backend-engineer の未解決（act() の `app.seq += 1` を消しても落ちるテストがない）：`DESIGN_D31_` を 1 本足した（画面を移さない操作＝未選択の `diagnosis.next` の必須のエラーで待ちを捨て、遅れて S8 を描かない。tests/design-d31-persisted-wait.spec.mjs:110）。変異で本当に落ちるかは実装を変えずに確かめられないので、reviewer か backend-engineer に頼む（13 章）。

## 証拠
- 環境：macOS 27.2、Node v24.22.1、@playwright/test 1.64.1、Chromium 156（chromium-1248）、WebKit 27.2（webkit-2370）、@axe-core/playwright 4.14.0。静的サーバー 127.0.0.1:<port>/engineer/、配布物 2026-11-30.1 を一時フォルダにビルド。
- 全件：`cd backend/tests/acceptance && npm ci && npx playwright test --retries=0 --reporter=list,json` → 終了コード 0、155 passed / 0 failed / 0 skipped（chromium 78、webkit 77。r1 の 133 → ea5f4ac 153 → r2 155）。evidence/g3r2-full-run.log、g3r2-full-run.json。
- 5 回繰り返し：`npx playwright test -g 'AC(1|2|5|6|7|8|9|10|11|12|13|14|15|16|19|20|22|23|24|25|28|31|32)_|DESIGN_' --repeat-each=5 --retries=0` → 終了コード 0、555 passed / 0 failed（別々の 111 本 × 5、1 本ずつ 5 回とも passed、flaky 0）。影響「大」の AC、DESIGN_ 9 本、一度でも落ちた AC-20 と DESIGN_D31_ を含む。evidence/g3r2-repeat5.log、g3r2-repeat5.json。
- 全 32 AC が PASS、飛ばし 0、未検証 0（verification.md 2 章の表に AC ごとの本数と値）。DESIGN_D30_ 10、DESIGN_D31_ 6、DESIGN_U15_ 2、BUDGET2_ 2 は AC の表とは別の表で PASS。計った値：AC-1 2/1/1/2 ms、AC-2 ≤ 7 ms、AC-15 905〜923 ms、AC-23 31〜121 ms、D31 の上限 1,004〜1,008 ms（上限 1,000）。
- スクリーンショット：148 枚（index.tsv 148 行）+ ダイアログの `_ax5_tabOk.png` 4 枚 = PNG 152（chromium 101、webkit 51）。横スクロール 0（全行で scrollWidth = clientWidth）。design-reviewer r1 の組：
  - 指摘 1：evidence/screenshots/S6_task.skipped_too_hard_{light,dark,ax5,en}.png、S0_loading_{light,dark,ax5,en}.png、S3_task.today_dayChanged_{light,dark,ax5,en}.png、S7_task.exhausted_dayChanged_{light,dark,ax5,en}.png（webkit/ に light、dayChanged も）
  - 指摘 2：dialog_settings.{delete,import}.confirm_ax5.png（200% にしてから開き表示域だけ）と `_ax5_tabOk.png`（chromium と webkit/）。evidence/screenshots/dialog-ax5-focus.tsv：4 組とも初期フォーカス cancel が表示域内（top 627〜728 / 844）、Tab（webkit Alt+Tab）3 回で ok に届き表示域内（top 501〜603）。不具合なし。
  - 提案 12：S3_task.today_external_en.png、S8_homeScreen_guide_en.png、S1_addToHomeScreen_en.png
  - 幅 320：S1_diagnosis.start_w320.png、S3_task.today_backend-beginner-005_w320.png。指摘 4〜6 の直しが見える：S5/S6/S8/S9/S10 の light と S6 ax5（リンクの左端）、S2_error_storage_light / S1_addToHomeScreen_light / S1_standalone_import_light（副操作の幅）、S3_error_storage_answer_light（textarea の color.error の枠）。
- axe：95 画面で JSON 95 個 = axe-summary.tsv 95 行 = レポートの 95（chromium 48 + webkit 47、光と幅 320）。violations 0（serious 以上 0）。incomplete 6 ノード：すべて color-contrast の `elmPartiallyObscuring`、ダイアログ本文の `<p>`（settings.delete.confirm.body / settings.import.confirm.body）3 場面 × 2 ブラウザ。JSON に target、html、理由を残した。見送る理由（7 章）：`<dialog>` が inert な文書と backdrop に重なるため axe が地を決められないだけで、本文の地は不透明な color.bg、文字は color.text（16.48:1 / 15.29:1）。
- キーボードの一巡：両ブラウザで r1 と同じ経路を到達。道具の「問題」2 件は r1 と同じで不具合ではない（settings.privacy は契約、BODY はブラウザの枠）。evidence/keyboard-tour-{chromium,webkit}.log。
- 探索（evidence/exploration/R3-r2.log、S8wait-r2.log、R3_01〜05 の png）：R3 15 操作（完了、S8 のまま、削除／置き換えの確認を開いたまま → 実行されずデータ不変、別のタブが先に移した／申告済み → S5 で知らせなし、保存の失敗 → retry で 1 回にまとめて保存、S7 の知らせ、S7 からのやり直し途中）すべて契約 data.md 4 のとおり。S8wait 9 操作（返らない約束で 1,094 / 1,046 ms、待つ間の申告で遅れた S8 なし、待つ間の入力は残る、待つ間の日付またぎ = #5）。使い捨てのスクリプトは消した。
- 4 章の検査：sleep 0、skip/fixme/only 0、retry 0（文字列 5 件は識別子 `error.storage.retry`）、@testable・実装の import 0、AC の抜け 0、表示の文字・並び順 6 件はすべて理由つき、setTimeout 等 16（コメント 7、コード 9、すべて契約の計測か注入）。
- 受け入れテストの変更（5 章）：G2 r3 の判定 a0a5c40 の後は ea5f4ac（test-plan 10 章に根拠）と r2 の 1 本追加だけ。既存の Then を弱めた箇所 0（消した expect 3 行は同じ確かめの移動）。
- 予算ほか：check-budget 65,133 / 150,000（終了コード 0、新しい枠内）、CSP meta 1、つなぎ口の grep 0、check:seeds 10 件 OK、check:contracts 41 件 OK、単体 113 pass。

## 変更したファイル（コミットしていない）
- /Users/takumamatsuura/src/engineer/backend/tests/acceptance/tests/design-d31-persisted-wait.spec.mjs（DESIGN_D31_ 1 本を追加。155 本）
- /Users/takumamatsuura/src/engineer/backend/tests/acceptance/tools/screenshots.mjs（4 通りの追加、en の追加、ダイアログの撮り方とフォーカスの記録、axe の incomplete の詳細、waitOpaque）
- /Users/takumamatsuura/src/engineer/docs/verification/001-daily-learning/test-plan.md（r7：追加した 1 本、本数 155、10 章と確かめ）
- /Users/takumamatsuura/src/engineer/docs/verification/001-daily-learning/verification.md（r2）
- /Users/takumamatsuura/src/engineer/docs/verification/001-daily-learning/evidence/（g3r2-full-run.*、g3r2-repeat5.*、screenshots/ を撮り直し、screenshots-run.log、keyboard-tour-*.log、exploration/R3-r2.log、S8wait-r2.log、R3_01〜05 の png。約 30 MB。r1 の g3-* と r7-* は残した）

## 未検証
- 実機の Safari / Chrome（persist と persisted の実際、OS の文字サイズ最大、VoiceOver）、Linux CI の WebKit の Tab、GitHub Pages の本番、`apple-mobile-web-app-title`：r1 と同じ（13 章）。
- 追加した DESIGN_D31_ の 1 本が `app.seq += 1` を消した実装で落ちるか（変異の確認は reviewer か backend-engineer）。
- #5 の扱いは未決（tech-lead）。
