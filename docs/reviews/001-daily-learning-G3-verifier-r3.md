# 001-daily-learning G3 verifier r3（FB 1 回目の作り直し。HEAD 7a59e84）

PASS

## 指摘
- 提案（AC-15、docs/verification/001-daily-learning/verification.md 4 章）：AC-15 は前半（HEAD 32236ec、5 workers の並列）で 1 回だけ 2,249 ms で落ちた。契約 W-11（7a59e84）が「他のテストと並列にしない」と決めた条件の下では、32236ec で 5 回、HEAD 7a59e84 で全件の中 1 回 + 単独 5 回（計測 55 回）とも最大 1,354 ms（後半は最大 1,142 ms）で 0 回落ちた。これを「環境の条件を契約で確定した上で揺れなし」と読んで PASS にした。この読み方に異論があれば AC-15 だけを「未検証」に差し替える（他の AC の判定は変わらない）。
- 提案（tools、AC の外）：design 5.1 と突き合わせたところ、#34（S7 allDone）が道具になく、5.1 冒頭は allDone も「通常」として 4 通りを求めているので足した。#27（S4 で答えて着く S5）の経路の場面と #45（import.confirm の保存の失敗）も足した。54 行すべてに証拠がそろった。
- 提案（範囲の外。backend/package.json は触っていない）：backend の `test:acceptance` は `npx playwright test` のままで、AC-15 は project `chromium-ac15` の `dependencies` で全件の後に 1 本だけ動くので、backend/package.json の変更は要らなかった（`cd backend && npm test` で確認済み：evidence/g3r4-npm-test.log）。注意点が 1 つ：dependencies の project に失敗があると Playwright は chromium-ac15 を動かさず「skipped」と数える。全件が緑でない実行では AC-15 の結果を `npm run test:ac15` で別に取る（README と config のコメントに書いた）。
- 質問（13 章）：R5（SW が有効な後のオフライン）の探索は r1 の実装（e13d68f）に対するもので、HEAD では自動テスト AC-12 と AC-23 だけ。HEAD で探索し直すかは指揮役の判断。
- 食い違い：なし。受け入れテスト（tests/、helpers/）は 1 行も直していない。

## 証拠
- HEAD：7a59e8415de426d9eb40f09e8f6397eb5ba090fa。作業ツリーの変更は backend/tests/acceptance/{playwright.config.mjs, package.json, README.md, tools/screenshots.mjs} と docs/verification/001-daily-learning/ だけ。コミットはしていない。
- 設定の直し（契約 W-11）：project を chromium（testIgnore ac15）、webkit（testIgnore ac15）、chromium-ac15（testMatch ac15、dependencies ['chromium','webkit']、fullyParallel false）の 3 つに。acceptance の package.json に `test:ac15` = `playwright test --project=chromium-ac15 --no-deps --workers=1` を追加。`npx playwright test --list` は 219 本（109 + 109 + 1）で変わらない。
- 全件 1 回（HEAD）：`cd backend/tests/acceptance && PLAYWRIGHT_JSON_OUTPUT_NAME=evidence/g3r4-full-run.json npx playwright test --retries=0 --reporter=list,json` → 終了コード 0、219 / 0 / 0（flaky 0）。AC-15 は 219 本目で、他のテストの最後の終わりの 454 ms 後に開始。値 1120, 1089, 1096, 1101, 1097。ログ：/Users/takumamatsuura/src/engineer/docs/verification/001-daily-learning/evidence/g3r4-full-run.log、.json
- AC-15 を 5 回：`PLAYWRIGHT_JSON_OUTPUT_NAME=evidence/g3r4-repeat5-ac15.json npm run test:ac15 -- --repeat-each=5 --retries=0 --reporter=list,json` → 終了コード 0、5 / 0 / 0。25 計測の最大 1,142 ms（上限 2,000）。ログ：evidence/g3r4-repeat5-ac15.log、.json
- backend の npm test：`cd backend && npm test` → 終了コード 0（契約の見本 52 件 0 件違い、単体 158 pass / 0 fail / 0 skipped、受け入れ 219 passed、AC-15 は最後に 1 本）。ログ：evidence/g3r4-npm-test.log
- 前半（32236ec、実装とテストは HEAD と同一：`git diff --name-only 32236ec..HEAD -- backend/public backend/scripts backend/tests` は 0 件）：全件 218 passed / 1 failed（AC-15 の並列）、影響「大」の AC と DESIGN_ 全件 156 本 × 5 = 780 / 0 / 0、AC-15 workers 1 で 5 / 0 / 0。ログ：evidence/g3r3-full-run.log、g3r3-repeat5.log、g3r3-repeat5-ac15.log
- スクリーンショット：`node tools/screenshots.mjs --out docs/verification/001-daily-learning/evidence/screenshots --browser both`（空にしてから）→ 終了コード 0、179 枚（問題 0）、axe 123 画面 違反 0。追加 `--only '^(S7_task.exhausted_allDone|S5_task.done_afterRate)$'` → 終了コード 0、7 枚。合計 index.tsv 186 行（chromium 121、webkit 65）、PNG 190 枚（+ ダイアログの ax5 の _tabOk 4 枚）、axe 127 画面（違反 0、incomplete 8 ノード＝ダイアログの地を axe が決められない既知の 1 種 elmPartiallyObscuring）、通常の状態 18 場面が light / dark / ax5 / en の 4 通り（dark 18、ax5 20、en 21、w320 3）、横スクロール 0（186 行で scrollWidth = clientWidth）、dialog-ax5-focus.tsv 4 行 ok。S4 の撮り方は契約どおり「1 秒待ち、さらに task.total.prev が消えるまで待つ」（settleS4）に直し、前半で 1 回失敗した at100 は両ブラウザで ok。ログ：evidence/g3r4-screenshots-axe.log（同じコマンドの 1 回目は exit の行を書く echo のパスを打ち間違えたため記録できず、やり直した 2 回目をログにした。ログ冒頭に明記）、evidence/g3r4-screenshots-axe-added.log
- design 5.1 の 54 行との突き合わせ：evidence/g3r3-state-table.md（前半）に対し、後半で #25（at100 ok）、#27（S5_task.done_afterRate 追加）、#34（S7_task.exhausted_allDone 4 通り追加）、#45（dialog_settings.import.confirm_error_storage 追加）が埋まり、54 行すべてに証拠がある。r2 の古い名前の PNG（S7_task.exhausted_*、S4_task.rate_{ax5,dark,en}、…_FAILED.png など 10 件）は撮り直しで消えた（git status の D の行。verification.md 9 章に記載）。
- キーボードの一巡：`node tools/keyboard-tour.mjs --browser chromium|webkit --log …` → 終了コード 1 × 2。「問題」2 件は r1 / r2 と同じ既知の仕様どおり（settings.privacy は DOM に置かない、dialog の Tab が BODY を通る）。r2 との差は S5 の Tab の順に task.next が入ったこと（D-45、期待どおり）。ログ：evidence/g3r4-keyboard-tour-{chromium,webkit}.log、同 .stdout.log
- 4 章の検査（tests、helpers、server、global-setup.mjs、playwright.config.mjs）：sleep 0、飛ばす 0、再試行 0（error.storage.retry の文字列 5 件は識別子）、@testable / 実装の import 0、AC 番号の抜け 0（PRD の AC-1〜AC-40 とテストの名前が一致。AC のないテストは BUDGET2_ 2 本と DESIGN_ 16 本：契約 W-6）、表示の文字や並び順 7 件（getByRole('dialog') 2 件は契約「AC-31 の数え方」、.nth() 5 件は data-testid で絞った集合の全件ループ）。
- 受け入れテストの変更：G2 tests PASS（e1b2b71）の後は 4fa1857 の 1 件（AC-18 の years.never、DESIGN_D43 の描いた直後の値。根拠 AC-18 When、AC-40、AC-35 Then、契約「完了の演出の確かめ方」）と、この r3 の 4 ファイル（根拠：契約 W-11、契約「完了の演出の確かめ方」の撮影の行、design 5.1 #27 / #34 / #45）。tests/ と helpers/ の変更 0。
- 検証レポート：/Users/takumamatsuura/src/engineer/docs/verification/001-daily-learning/verification.md（r3、判定 PASS。AC-1〜AC-40 の合否と証拠、状態の表、揺れ、変更の確かめ、検査の件数、監査、探索 5 セッション（前半の 4 本 + r1 の R5）、スクリーンショット一覧、未検証：Safari 17 実機、VoiceOver、実機の AX5 / ダーク、Linux CI の install-deps、R5 の HEAD での探索、app.json の backend_test）。9 章に書いたファイルはすべて ls で存在を確かめた。
- 備考：ENOENT は後半で 0 件（他に受け入れテストを動かす役はいなかった）。

## 記録
- 関門：G3
- 判定した役：verifier
- 回：r3（FB 1 回目の作り直しで 1 回目。前半はコミット ccc2010 の証拠）
- 対象：feat/001-daily-learning、HEAD 7a59e84
- 日付：2026-11-05
