PASS

## 指摘
AC にひも付く不具合は 0 件。下はすべて AC の外（提案）。PRD とテストの食い違いは「なし」。
- 提案　docs/verification/001-daily-learning/evidence/exploration/R3.log の 2、4、6（AC なし。AC-5、AC-9、AC-14 の Given はどれも同じ日の中）：画面を開いたまま日付が変わった後の最初の操作（「完了」「役に立った」「次へ」）が表示中の課題には効かず捨てられ、翌日の課題に置き換わる。前日の課題は `none` の行になり答えは残る（データは壊れない）。押した直後の保存で翌日の `current.answer` に前日の答えが一瞬入り、pagehide の保存で消える。PRD 11 の冒頭にも design 5 にも契約にも扱いがないので、pdm と tech-lead が「操作の時点で日付が変わっていたら表示中の課題に効かせる／効かせない」を決める（実装は backend-engineer）。
- 提案　exploration/R4.log（AC-28 は満たす）：差し替え後 0.5 秒おきの再読み込みでは 6 回（3 秒）たっても新版にならない。2 秒以上あければ 2〜3 回で新版になり、旧版に戻らない。RUNBOOK 3 の手順どおりで問題なし。
- 提案　evidence/screenshots/S8_settings_light.png（AC-13 は拒否の注入が前提）：注入なしでも headless の Chromium / WebKit は `persist()` に false を返すので、保存データのある S8 に常に `settings.storage.notPersisted` が出る。G4 で Takuma が実機の Safari と Chrome で、ふつうの利用者にこの注意が常に出ないかを見る。
- 提案（申し送り）　keyboard-tour-*.log：`settings.privacy` が S8 にない。契約 identifiers.md 3「リンク先が決まるまで（design の U-9）DOM に置きません」のとおり。U-9 は pdm が G5 の前に決める。
- 道具が「問題」と数えたダイアログ内の BODY へのフォーカスは不具合ではない（`showModal()` の外は inert で、ヘッドレスではブラウザの枠に出る瞬間。後ろの `settings.*` に止まったことは 0 回）。

## 証拠
- コミット e13d68f1a91e14a0f5303847768063473277ec54。環境：macOS 27.2、Node v24.22.1、@playwright/test 1.64.1、Chromium 156.0.8078.4、WebKit 27.2、@axe-core/playwright 4.14.0。静的サーバー 127.0.0.1:<port>/engineer/、配布物 2026-11-30.1 を一時フォルダにビルド。
- 全件：`cd backend/tests/acceptance && npm ci && npx playwright test --retries=0 --reporter=list,json` → 終了コード 0、133 passed / 0 failed / 0 skipped / flaky 0（chromium 67、webkit 66）。ログ docs/verification/001-daily-learning/evidence/g3-full-run.log、JSON g3-full-run.json。
- 5 回繰り返し：`npx playwright test -g 'AC(1|2|5|6|7|8|9|10|11|12|13|14|15|16|19|20|22|23|24|25|28|31|32)_' --repeat-each=5 --retries=0` → 終了コード 0、445 passed / 0 failed（別々の 89 本 × 5 回、1 本ずつ 5 回とも passed）。影響「大」の AC（R1〜R5）と AC-20 の 2 本を含む。evidence/g3-repeat5.log、g3-repeat5.json。
- AC ごとの動いた数と飛ばした数、計った時間の値（AC-1 2/1/1 ms、AC-2 ≤ 13 ms、AC-15 891〜911 ms、AC-23 44〜140 ms、AC-28 旧→新→新）は verification.md の 2 章。全 32 AC が PASS、飛ばし 0、未検証 0。
- 受け入れテストの変更：G2 のテストの判定（f981670）の後は a7fc7e9 の helpers/app.mjs（exportJson の複製）1 件だけで、根拠は AC-20 Given と W-9（5 章）。作業ツリーに受け入れテストの変更なし。`npx playwright test --list` は 133 本のまま。
- 4 章の検査：sleep 0、skip/fixme/only 0、retry 0（文字列 2 件は識別子 `error.storage.retry`）、@testable・実装の import 0、AC の抜け 0（PRD の 32 個すべてがテスト名にあり、AC のないテストは契約が求めた BUDGET2_ の 1 本）、表示の文字・並び順 6 件はすべて理由つき（6 章）。
- スクリーンショット：127 枚（chromium 82：通常の状態は light / dark / ax5 / en の 4 通り、幅 320 は S1 と backend-beginner-005 の S3。webkit 45：全場面の light）。design 5 の S0〜S10 の全状態と 2 つのダイアログ。ax5 はルートの font-size 200%（CSSOM。index.tsv の rootFontSize 32px）、幅 320 は viewport 320×568、ダークは colorScheme dark、英語は locale en-US（lang=en）。横スクロール 0（全枚で scrollWidth = clientWidth）。一覧 evidence/screenshots/index.tsv、撮った道具 backend/tests/acceptance/tools/screenshots.mjs（playwright test の対象外）。
- axe：94 画面（chromium 49 + webkit 45、design 5 の全画面・全状態）で violations 0（serious 以上 0）。AC-27 の 6 画面 × 2 も 0。evidence/screenshots/axe/axe-summary.tsv と JSON 94 個。
- キーボードだけの一巡：AC-18（S1→S5、10 要素 focus-visible・outline 3 px）に加えて S5→履歴→details→設定→削除のダイアログ（初期フォーカス cancel、Escape で閉じて settings.delete に戻る）→統計→やり直し（radio は矢印）→やめる→アプリ名、を chromium（Tab）と webkit（Alt+Tab）で到達。evidence/keyboard-tour-chromium.log、keyboard-tour-webkit.log。
- 探索：R1（読み込み 18 操作：5,000,001 バイト境界、拒否 7 種でデータ不変、置き換えで結合なし、firstOpenDate と device の扱いが data.md 7 どおり）、R2（段階 12 日：領域ごとに独立、none は数えず流れも切らない、交互で不変、levelHint は too_hard/too_easy だけ）、R3（日付またぎ：上の提案 #1）、R4（SW：オフラインで index.html / ?v=1 / 新しいタブ / manifest / icon / tasks.json / en.json / sw.js すべて 200 fromSW、console.error 0、旧版に戻らず）、R5（保存の失敗 6 か所：error は問題の直下、入力は残り、retry で setItem 1 回、起動時の失敗でも課題が残る）。evidence/exploration/R1〜R5.log と png 11 枚。使い捨てのスクリプトは消した。
- 予算（AC ではない）：check-budget 62,960 / 150,000 バイト（終了コード 0）、CSP の meta 1 つ、`__test|?reset=|location.search` 0 件、check:seeds 10 件 OK、check:contracts 41 件 OK、単体 94 pass。
- レポート：/Users/takumamatsuura/src/engineer/docs/verification/001-daily-learning/verification.md（13 章すべて。状態の表 9 行、揺れの表、変更の表、検査の表、監査の表、探索 5 本、スクリーンショットの表、未検証）。
- 未検証（13 章）：本物の iPhone/iPad の Safari（ホーム画面、7 日消去、persist の実際、OS の文字サイズ最大、ダーク、VoiceOver）、Linux の WebKit の Tab、GitHub Pages の本番（配布の仕組みがまだない）、本物の Chrome、apple-mobile-web-app-title。
- 新しく置いたファイル（コミットしていない）：backend/tests/acceptance/tools/screenshots.mjs、tools/keyboard-tour.mjs、docs/verification/001-daily-learning/verification.md、evidence/ の下（約 23 MB。g3-full-run.json 1.3 MB と g3-repeat5.json が大きい。要らなければ指揮役の判断で JSON だけ外してよい）。
