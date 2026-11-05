# テスト計画 001-daily-learning：診断と今日の学習（Web アプリ「今日の一手」）

- 書いた役：verifier　日付：2026-11-05（r8：Takuma の FB 1 回目を受けた PRD r11（AC 32 → 40）、design r9、契約の更新（ADR 0002 の課題 ID の付け替え、test-hooks.md W-6 / W-7、budgets.md 2、identifiers.md 4 の新しい属性）に合わせて、実装より先に書き直した。前半（2026-11-05、215778d）：リスク表、AC-1〜AC-40 の表、design 5.1 の 54 行の状態の表、つなぎ口、PRD r11 で変わった AC（AC-4、AC-5、AC-7、AC-10、AC-12 (a)、AC-14 の 2 通り目、AC-24）と BUDGET2_ の書き直し、seed と helpers の付け替え対応。後半（同日。この版）：AC-8 の 10 通り目、AC-33〜AC-40（新しいファイル 4 つ）、AC-27 の `task.exhausted` 2 変種、AC-17 の levelDone、AC-13 の `task.next` / advance の印、DESIGN_D40_ / D43_ / D44_、design 5.1 の r8 / r9 の行（screenshots.mjs）。直した所は 10 章。r7 までの履歴は 10 章の末尾）
- 実装のコードを見ずに書いた：はい（backend/public/ は開いていない。読んだのは下のファイルだけ）
- 読んだファイル（PRD、design/、contracts/ と、指揮役が指定した ADR・型・前回の判定）：
  - docs/prd/001-daily-learning.md（r11。11 の冒頭の決まり（申告の後に続けて進む、段階と診断は「次に出す課題」から効く、修了と進級、進み具合、今週、累計、「2 件目以降の完了」）、AC-1〜AC-40、12）
  - design/001-daily-learning.md（r9。5 状態、5.1 の 54 行、6 識別子、7 文言）
  - contracts/README.md、data.md（4 起動時の判定と「操作で出すとき」「S7 を再読み込みしたとき」「画面を開いたまま日付が変わったとき」、5 選び方と段階の規則、S7 の変種、9 統計と画面の数、11 永続化）、strings.md（7 語の検査）、identifiers.md（1〜6）、test-hooks.md（W-1〜W-16、時間の計り方、完了の演出、AC-31、AC-28、キーボード）、budgets.md（2）、schemas/strings.schema.json（required 174）、fixtures/seeds/*（8 件）、fixtures/strings/valid-ja.json と valid-en.json（文言の形。本番の i18n/*.json はテストが HTTP で読む）
  - docs/adr/0002-storage-localstorage-single-key.md（課題 ID の付け替え、`never`）
  - docs/reviews/001-daily-learning-G0-verifier-r4.md（観点 4 の見積もり）、docs/reviews/001-daily-learning-G1-reviewer-r2.md（W-7 の AC-14 の直し）、docs/templates/test-plan.md
  - 今の backend/tests/acceptance/（自分の成果物）

## 1. リスク
影響「大」は、自動テスト、3 章の行、6 章の探索 1 本。
| # | リスク | 影響 | 起きやすさ | 関わる AC | 試す深さ |
|---|---|---|---|---|---|
| R1 | 保存データが消える、読めなくなる（削除、読み込みの置き換え、版の違い、保存の失敗、課題 ID の付け替え後の古いデータ） | 大 | 中 | AC-11、AC-13、AC-16、AC-19、AC-20、AC-25、AC-28 | 自動（Chromium と WebKit）、状態の表（データあり、更新、権限）、探索 1 本 |
| R2 | 課題の選び方と段階の規則が違う（同じ課題が 2 回出る、段階が動かない・動きすぎる、同じ日の 2 件目で段階が効かない、進級の後の「連続」が持ち越される） | 大 | 大（r8 で規則が増えた） | AC-2、AC-6、AC-8（10 通り）、AC-10、AC-14、AC-33 | 自動（デシジョンテーブル 10 列 + 進級）、探索 1 本 |
| R3 | 数が違う（統計 11 値、累計、進み具合 n / N、今週、その日の何件目、出した件数） | 大 | 大（r8 で 5 つ増えた） | AC-5、AC-7、AC-24、AC-33、AC-35、AC-36、AC-37 | 自動（seed から手で計算した値と比べる）、探索 1 本 |
| R4 | 主な流れが最後まで進まない（診断 → 課題 → 完了 → 次の一手、修了 → 進級） | 大 | 中 | AC-1、AC-2、AC-5、AC-9、AC-10、AC-18、AC-31、AC-33 | 自動（キーボードだけの経路を含む）、探索 1 本 |
| R5 | オフラインと再読み込みで動かない、外に送る | 大 | 中 | AC-12、AC-23、AC-28 | 自動（送信 0 件を数える）、状態の表（オフライン） |
| R6 | 日付の扱い（翌日の判定、開いたまま日付が変わる、タイムゾーン、月曜の計算） | 大 | 中 | AC-6、AC-24、AC-32、AC-36、AC-37、DESIGN_D30 | 自動（時刻の固定で 2 日と週をまたぐ）、探索は R3 に含める |
| R7 | 課題集の品質（件数、字数、初級の決まり、解説、外で行う課題の印） | 中 | 中 | AC-3、AC-4、AC-29、AC-30、AC-34、AC-38、BUDGET2_ | 自動（JSON 全件） |
| R8 | アクセシビリティと文言（320 px、キーボード、axe、英語、祝いの語） | 中 | 中 | AC-17、AC-18、AC-26、AC-27、AC-35（語）、AC-39、AC-40 | 自動（代表の画面） |
| R9 | iOS の案内とスタンドアロン | 小 | 小 | AC-21、AC-22 | 自動（偽装） |
| R10 | 読み込み時間 | 小 | 小 | AC-15 | 自動（Chromium の制限で 5 回） |

## 2. 受け入れ条件とテストの対応
名前は `AC<番号>_<結果>`。予算は `BUDGET2_`、AC にない design の状態は `DESIGN_<番号>_`（W-6）。r8 の後半で、全行を実際のテストの名前にそろえた（`*` は同じ接頭辞の複数本）。
| AC | リスク | 技法 | 試す値（境界、遷移、ルールの列） | 種類 | ファイル::テストの名前 | 確かめる結果（具体的な値） |
|---|---|---|---|---|---|---|
| AC-1 | R4 | 状態遷移 | S1 → S2(1) → S2(2) → S2(3)。3 区間の時間 | 画面 | ac01-ac02-diagnosis::AC1_* | `diagnosis.start` → `diagnosis.question`、`data-question-total`=3、index 1〜3、3 区間とも ≤500 ms（ページの中で計る） |
| AC-2 | R2、R4 | 同値分割（3 通り） | (backend, intermediate)、(frontend, beginner)、(git, advanced) | 画面 | ac01-ac02-diagnosis::AC2_* | 3 問目の確定から ≤1,000 ms で `task.today`、`task.today` 1 件、`data-task-area` と `data-task-level` が選んだ値 |
| AC-3 | R7 | 全件検査 | 全件の 4 要素と minutes | JSON | ac03-ac04-ac29-tasks-json::AC3_* | tasks.schema に通り、trim 後 ≥1 字、1 ≤ minutes ≤ 15 の違反 0 件 |
| AC-4 | R7 | 境界値（r11 の数） | 全体 210、初級・中級の組 14、上級の組 7、ID の重複 | JSON | ac03-ac04-ac29-tasks-json::AC4_課題集は210件以上で初級と中級の12組が14件以上_上級の6組が7件以上_IDの重複が0件 | 全体 ≥210、18 組（12 組 ≥14、6 組 ≥7）、重複 0 |
| 予算 | R7 | 境界値 | 5 つの字数の平均、gzip | JSON | ::BUDGET2_本文4要素と解説の字数の平均が480字以下、::BUDGET2_課題集はgzip後105000バイト以下 | 平均 ≤480（コードポイント）、gzip -9 ≤105,000 バイト |
| AC-5 | R3、R4 | 状態遷移 | 完了 → rate → 答える／答えずに再読み込み → done → 再読み込み ×2 | 画面 | ac05-ac06-ac07-ac09-report::AC5_完了するとtask.rateになり_答えるとtask.done_同じ日に再読み込みしてもtask.doneのままで_task.nextを押さない限りissuedは4のまま、::AC5_完了して答えずに再読み込みするとtask.doneになり_issuedは4のまま | `task.rate` → `task.done`、再読み込み後も `task.done`、`task.today` 0 件、`task.next` 1 件（押さない）、`data-stat-issued` が開いた直後も後も 4、履歴 4 行で先頭が done |
| AC-6 | R2、R6 | 代表 | 前日に完了 → 翌日 | 画面 | ::AC6_翌日には過去に出した課題のIDと一致しない課題が出る | 翌日 `task.today`、ID が seed の 3 件と前日の 1 件のどれとも違う、`data-task-nth-today`=1 |
| AC-7 | R3、R4 | 同値分割（3 通り） | too_hard、too_easy、no_time | 画面 | ::AC7_<report>を申告するとtask.skippedになり履歴に残り_再読み込みしてもtask.skippedのままで_task.nextを押さない限りissuedは4のまま | `task.skipped`、履歴 4 行で先頭の `data-report` が申告の値、再読み込み後も `task.skipped`、`task.next` 1 件、`data-stat-issued`=4 |
| AC-8 | R2 | デシジョンテーブル（10 列。5 通り目は 2 本） | 1〜9：seed で古い 1 件 + 画面で 1 件 → 翌日。10：同じ日に 2 件 + `task.next` ×2 | 画面 | ac08-level-rule::AC8_<n>通り目_*（1〜9）、::AC8_10通り目_中で同じ日に難しすぎ2件_task.nextで同じ日の次がbeginner | 翌日の `data-task-level`：1 beginner、2 advanced、3〜5 intermediate、6 beginner、7 advanced、8 beginner、9 intermediate。10：`task.skipped.levelHint` → next → nth 2・intermediate → `task.skipped.levelChanged` → next → beginner |
| AC-9 | R4 | 同値分割（4 通り） | helpful、notHelpful、再読み込み、close | 画面 | ::AC9_*（4 本） | `task.done`、再読み込み後に `task.rate.helpful` 0 件、`data-helpful` が helpful / not_helpful / unanswered / unanswered |
| AC-10 | R2、R4 | ペアワイズ全組（段階 2 × When 2 = 4） | beginner / advanced × 翌日の読み込み / 同日の `task.next` | 画面 | ac10-ac30-exhausted-external::AC10_初級を出し終えて<翌日に読み込む／同じ日にtask.nextを押す>と_levelDone…、::AC10_上級を出し終えて…_allDone… | 初級：`task.exhausted.levelDone` 1 件（文言は `{area}`=バックエンド設計、`{level}`=初級の差し込み）、`task.exhausted.advance` 1、`task.exhausted.redo` 1、`allDone` 0。advance → 同じ日に `task.today`、level=intermediate、area=backend、ID はその組の最小、nth-today は翌日 1／同日 2、再読み込み後も同じ ID。上級：`allDone` 1、`redo` 1、`advance` 0、`levelDone` 0。redo で backend / advanced を選ぶと同じ日に再び `task.exhausted`（`allDone` 1、`task.today` 0） |
| AC-11 | R1 | 失敗の注入 | 2 問目の確定で setItem が 1 回だけ例外 | 画面 | ac11-ac13-storage::AC11_* | `error.storage.message` 1 件、やり直し 1 件、index=2 のまま、選択肢が選ばれたまま、やり直しで 3 問目 → 課題の area / level が答えと一致 |
| AC-12 | R5 | 代表 + 送信の数え方 | (a) AC-1、2、5、9、33 の操作、(b) AC-7 | 画面 | ac12-ac23-offline::AC12_オフラインでもAC-1_AC-2_AC-5_AC-9_AC-33の操作が動き_送信は0件、::AC12_オフラインでもAC-7の申告が動き_送信は0件 | オフラインで各 Then の再読み込みより前の部分、`task.next` → `task.today` ≤1,000 ms、nth-today 2、ID が違う、送信 0 件 |
| AC-13 | R1 | 拒否の注入 | persist / persisted を false | 画面 | ac11-ac13-storage::AC13_* | `task.done`、履歴 1 件、`settings.storage.notPersisted` 1 件、`settings.export` 1 件、persist は 1 回だけ |
| AC-14 | R2、R1 | 状態遷移（2 通り） | 1：S7 からやり直し。2：S3 からやり直し → 完了 → next | 画面 | ac14-ac16-redo-delete::AC14_今日の課題を出していない日に…、::AC14_今日の課題が出ている日に設定からやり直して別の領域を選んでも_同じdata-task-idのtask.todayのままで完了の履歴は3件_完了してtask.nextを押すと同じ日に新しい領域の課題が出る | 1：`task.today` の area=frontend、完了 3 件のまま、行数は seed と同じ。2：やり直し直後は同じ ID、area=backend、完了 3 件。完了 → next で同じ日に area=frontend、level=beginner、ID が違う、nth-today 2、完了 4 件 |
| AC-15 | R10 | 計測 5 回 | CDP の制限 | 画面（Chromium） | ac15-load-time::AC15_* | `data-debug-load-ms` 5 回とも ≤2,000 |
| AC-16 | R1 | 代表 | 完了 3 件 → 削除 | 画面 | ::AC16_* | 再読み込みで `diagnosis.start`、やり直し後の履歴 0 件 |
| AC-17 | R8 | 境界値（幅 320） | 4 状態 | 画面 | ac17-ac18-ac27-a11y::AC17_* | scrollWidth ≤320、はみ出す要素 0、ellipsis 0、操作できる要素が押せる（`task.exhausted` は levelDone の変種：初級を出し終えた seed。テスト名は AC17_task.exhausted.levelDone_*） |
| AC-18 | R8、R4 | 経路 | Tab / Shift+Tab / Enter / Space だけ | 画面 | ::AC18_* | `task.done` に到達、各操作で `:focus-visible`、枠 ≥2 px（design は 3 px） |
| AC-19 | R1 | 代表 | 完了 3 件（1 件は 50 字の答え） | 画面 | ac19-ac20-ac25-export-import::AC19_* | ダウンロード 1 件、diagnosis、levels、history 3 行（answer 50 字 1 件、空 2 件）、firstOpenDate、formatVersion 1 |
| AC-20 | R1 | 代表 | AC-19 のファイルを別のコンテキストへ | 画面 | ::AC20_* | diagnosis と levels が同じ、履歴 3 行と answer が同じ、状態は `task.today` か `task.done` |
| AC-21 | R9 | 同値分割（偽装あり／なし） | iPhone UA + standalone false、偽装なし | 画面 | ac21-ac22-home-screen::AC21_* | 案内 1 件と `home.addToHomeScreen.steps`、閉じた後の再読み込みで 0 件、設定に再び開く操作 1 件。偽装なしは 0 件 |
| AC-22 | R9 | 代表 | standalone true | 画面 | ::AC22_* | `home.standalone.import` 1 件、読み込みの操作 1 件、開始 1 件、`home.addToHomeScreen` 0 件、再読み込みで再び出る、読み込むと AC-20 の状態 |
| AC-23 | R5 | 同値分割（2 状態 × reload / 新しいタブ） | `task.today`、`task.done` | 画面 | ac12-ac23-offline::AC23_*（2 本） | ≤3,000 ms（テスト側の時計）、同じ ID／`task.done`、送信 0 件 |
| AC-24 | R3、R6 | 手で計算した期待値 | seed-ac24-stats.json、2026-11-06（金） | 画面 | ac24-stats::AC24_統計の11の値が期待どおりで_数値9つと日付1つは同じ文字が見え_真偽値はfirstDayCompleted.yesの文言が見える | 開いた状態 `task.skipped`。first-open 2026-11-01、issued 6、completed 4、first-day true、7d 3、week 2、extra 1、helpful 2、rated 2、too-hard 1、no-time 1。見える文字も同じ、真偽値は `.yes` の文言 |
| AC-25 | R1 | 境界値（版 +1） | formatVersion 2 | 画面 | ::AC25_* | `error.import.message`、履歴 1 件のまま、状態と診断が前と同じ |
| AC-26 | R8 | 同値分割（ja / en） | locale | 画面 | ac26-language::AC26_* | en の `diagnosis.start` の文言が en.json と一致、キーの差 0 件 |
| AC-27 | R8 | 監査 | 6 画面（`task.exhausted` は levelDone と allDone の 2 変種。表示 7） | 画面 | ac17-ac18-ac27-a11y::AC27_<画面>_axe-coreでserious以上の違反が0件（7 本。`task.exhausted` は AC27_task.exhausted.levelDone_* と AC27_task.exhausted.allDone_*） | serious 以上 0 件 |
| AC-28 | R1、R5 | 代表 | 旧版 → 新版（課題 1 件多い） | 画面 | ac28-update::AC28_* | 3 回以内に新版の `data-build-version`、戻らない、履歴 3 件と診断と段階が同じ |
| AC-29 | R7 | 全件検査 | 18 組の external の割合、URL、tools | JSON | ac03-ac04-ac29-tasks-json::AC29_* | external ≤20%、in_app に URL 0 と tools 空、external は tools ≥1 |
| AC-30 | R7 | 同値分割（external / in_app） | in_app を出し終えた翌日 | 画面 | ac10-ac30-exhausted-external::AC30_*（2 本） | `data-task-mode`=external、`task.external.badge` と tools の各項目が見える。in_app の日は badge 0 件。external 0 件なら「該当なし」 |
| AC-31 | R4 | 同値分割（`task.today` / `task.done`） | 操作 0 回 | 画面 | ac31-ac32-zero-ops-answer::AC31_* | dialog 0、aria-modal 0、題名を覆う fixed 0、題名・4 要素・答えの欄・4 つの申告が同じ画面 |
| AC-32 | R1、R6 | 境界値（200 字）、2 経路 + 翌日 | 新しいタブ、再読み込み、翌日 | 画面 | ::AC32_* | 同じ ID と 200 字、翌日は空で書き出しの none の行の answer に 200 字 |
| AC-33 | R3、R4 | 状態遷移（2 起点） | `task.done` から、`task.skipped` から。3 件目まで | 画面 | ac33-next::AC33_<task.done／task.skipped>からtask.nextで1秒以内に同じ日の2件目と3件目が出て_IDは過去と違い_組は同じ_issuedが1ずつ増え_再読み込みでも同じID_ダイアログ0件（2 本。1 秒はページの中で計る：armTiming / readInterval） | ≤1,000 ms で `task.today`、ID が過去と違う、area / level 同じ、nth-today 2 → 3、issued +1 ずつ、再読み込みで同じ ID、ダイアログ 0 |
| AC-34 | R7 | 全件検査（初級） | minutes、6 語（空白を除いて部分一致）、external の tools | JSON | ac34-ac38-tasks-json-r8::AC34_初級の全件がminutes10以下で6語が0件でexternalのtoolsがブラウザか開発者ツールを含む（守り：初級 ≥84 件） | 違反 0 件（strings.md 7.2） |
| AC-35 | R3 | 境界値（節目 7、30、100 と 11） + 語の検査 | 完了 6、29、99、10 件の seed | 画面 + JSON | ac35-ac37-done-screen::AC35_累計<n>で完了するとtask.rateとtask.doneに累計<n+1>が見え_task.cheerのdata-milestoneが<m>で文言が<key>（4 本：6、10、29、99。10 / 29 / 99 は helpers/seed.mjs の completedSeed が W-7 の決まりで作る）、::AC35_ja.jsonとen.jsonの全キーの値に連続途切れ逃したstreakmissedが0件。演出（D-43）は同じファイルの DESIGN_D43_*（2 本：reduce で getAnimations 0・task.total.prev 0、reduce でないとき getAnimations ≥1） | `task.rate` と `task.done` の `task.total.value` の `data-stat-completed`=7 / 30 / 100 / 11、`task.cheer` の `data-milestone`=7 / 30 / 100 / none、文言が `.at7` / `.at30` / `.at100` / `.default`。語 0 件 |
| AC-36 | R3 | 代表（none の行を含む） | seed-ac36-three-issued.json、2026-11-04 | 画面 | ::AC36_3件出した翌日のtask.todayのdata-progress-indexが4でtotalが14で_同じ2つの数がtask.progressの文言に見える | index 4、total 14、`task.progress` の文言に 4 と 14 |
| AC-37 | R3、R6 | 2 つの時刻 | 2026-11-06 → next → 完了、2026-11-09（月） | 画面 | ::AC37_金曜にtask.nextで出た課題を完了するとtask.doneのtask.weekと統計のdays-completed-weekが3でextraは1のまま_翌週の月曜は0 | `task.week` の `data-stat-days-completed-week`=3、統計も 3、extra 1 のまま。11-09 は 0 |
| AC-38 | R7 | 全件検査 + 2 経路 | insight 1〜120、改行・バッククォートなし。完了 / 申告 | JSON + 画面 | ac34-ac38-tasks-json-r8::AC38_課題集の全件のinsightが前後の空白を除いて1〜120字で改行とバッククォートを含まない、ac35-ac37-done-screen::AC38_task.todayではtask.insight.textが0件で_完了するとtask.rateとtask.doneにその課題のinsightが見え_再読み込みしても見える、::AC38_難しすぎを申告したtask.skippedではtask.insight.textが0件（3 本） | `task.today` で `task.insight.text` 0、`task.rate` と `task.done` で insight と一致、`task.skipped` で 0 |
| AC-39 | R8 | 境界値（1〜40 字、幅 320） | 6 領域の desc | 画面 + JSON | ac39-ac40-diagnosis-r8::AC39_1問目の6つの領域にarea.descの説明が見え_jaとenの文言ファイルで6件とも1〜40字、::AC39_幅320で1問目を表示するとscrollWidthが320以下（2 本） | `area.<ID>.desc` 6 件が見える、ja / en とも 1〜40 字、幅 320 で scrollWidth ≤320 |
| AC-40 | R8 | 境界値（選択肢 5） | `years.never` | 画面 | ::AC40_3問目の選択肢が5つでyears.neverのvalueがneverで_選んで終えると書き出しのdiagnosis.yearsがnever | 3 問目の radio 5 つ、`value`=never が 1 つ、書き出しの `diagnosis.years`=never |

## 3. 試す状態
### 3.1 型の 9 行
| 状態 | 選んだもの | 作り方 | どのテストで、または理由 |
|---|---|---|---|
| 初めて起動 | 自動 | 新しいコンテキスト（W-1） | AC-1、AC-2、AC-18、AC-21、AC-22、AC-26、AC-39、AC-40 |
| データがある | 自動 | addInitScript で seed（W-7） | AC-5〜AC-10、AC-14、AC-24、AC-30〜AC-37 |
| 前の版からの更新（版を飛ばす更新も） | 自動（配布物の差し替え）＋範囲外（保存の版） | AC-28 の旧 → 新。保存の `formatVersion` は 1 だけで前の版がない（data.md 6。版 2 は AC-25 で拒む） | AC-28、AC-25。課題 ID の付け替え前の保存データは未公開なので扱わない（ADR 0002 (e)。G3 の前に使ったブラウザのデータを削除：reviewer G1 r2 の要修正 3） |
| オフライン、サーバーエラー | 自動 | `context.setOffline(true)`、送信の数え方（W-12） | AC-12、AC-23。サーバーエラー（500）は範囲外：読み込み後に通信しない（design 5 の冒頭） |
| 権限を断った | 自動 | persist / persisted の注入（W-9） | AC-13、DESIGN_D31 |
| バックグラウンドから復帰 | 範囲外（Web。タブの切り替えは AC-32 の新しいタブで代える） | — | AC-23、AC-32 |
| 言語と地域（ja、en） | 自動 | locale（W-14） | AC-26、tools/screenshots.mjs の en |
| 大きい文字、ダークモード | G4 の人（AX5）＋自動（幅 320 を 200% の代わり：AC-17、AC-39）＋スクリーンショット（ダーク：tools/screenshots.mjs の `prefers-color-scheme: dark`） | — | AC-17、AC-39、5.1 の全状態 |
| 容量不足、電話などの割り込み | 自動（容量不足は QuotaExceededError の注入：AC-11）、割り込みは範囲外（Web） | W-9 | AC-11、DESIGN_D30 |

### 3.2 design 5.1 の 54 行（スクリーンショットを撮る単位。tools/screenshots.mjs と受け入れテストの shot）
| # | 画面と状態 | 選んだもの | テストか道具 |
|---|---|---|---|
| 1 | S0 loading | 自動 | screenshots.mjs（JS を止めて開く） |
| 2 | S0 error（読めない） | 自動 | screenshots.mjs |
| 3 | S0 error（保存先が使えない） | 自動 | screenshots.mjs |
| 4 | S1 通常 | 自動 | AC-1、screenshots.mjs |
| 5 | S1 iOS の案内 | 自動 | AC-21 |
| 6 | S1 スタンドアロンの案内 | 自動 | AC-22 |
| 7 | S1 読み込みの失敗 | 自動 | screenshots.mjs（版が新しいファイル） |
| 8 | S2 1 問目（ヒント文） | 自動 | AC-39、screenshots.mjs（S2_question_1） |
| 9 | S2 2 問目 | 自動 | screenshots.mjs |
| 10 | S2 3 問目（`years.never`） | 自動 | AC-40、screenshots.mjs（S2_question_3） |
| 11 | S2 未選択のエラー | 自動 | screenshots.mjs |
| 12 | S2 保存の失敗 | 自動 | AC-11 |
| 13 | S2 やり直し | 自動 | screenshots.mjs |
| 14 | S3 通常（1 件目、`task.progress`） | 自動 | AC-2、AC-36 |
| 15 | S3 external | 自動 | AC-30 |
| 16 | S3 同じ日の 2 件目 | 自動 | AC-33、screenshots.mjs（S3_task.today_nth2） |
| 17 | S3 保存しました | 自動 | AC-32 |
| 18 | S3 上限 2,000 字 | 自動 | screenshots.mjs |
| 19 | S3 答えの保存の失敗 | 自動 | screenshots.mjs |
| 20 | S3 申告の保存の失敗 | 自動 | DESIGN_D30、screenshots.mjs |
| 21 | S3 `task.dayChanged` | 自動 | DESIGN_D30 |
| 22 | S4 通常（累計 11） | 自動 | AC-35（10 → 11）、screenshots.mjs（S4_task.rate_total11。描いて 1 秒後に撮る） |
| 23 | S4 節目 7 | 自動 | AC-35、screenshots.mjs（S4_task.rate_at7。1 秒後） |
| 24 | S4 節目 30 | 自動 | AC-35、screenshots.mjs（S4_task.rate_at30。1 秒後） |
| 25 | S4 節目 100 | 自動 | AC-35、screenshots.mjs（S4_task.rate_at100。1 秒後） |
| 26 | S4 回答の保存の失敗 | 自動 | screenshots.mjs |
| 27 | S5 通常（D-45 の順） | 自動 | AC-5、AC-37、AC-38 |
| 28 | S5 再読み込み後 | 自動 | AC-5 |
| 29 | S5 `task.next` の保存の失敗 | 自動 | screenshots.mjs（S5_error_storage_next） |
| 30 | S6 難しすぎ（levelHint） | 自動 | AC-7 |
| 31 | S6 今日はできない | 自動 | AC-7 |
| 32 | S7 levelDone（初級。補足なし） | 自動 | AC-10（初級 × 2）、AC-17、AC-27（levelDone） |
| 33 | S7 levelDone（seenNext） | 自動 | DESIGN_D40_（helpers/seed.mjs の seenNextSeed。W-7 の作り方）、screenshots.mjs（S7_task.exhausted_seenNext） |
| 34 | S7 allDone | 自動 | AC-10（上級 × 2）、AC-27（allDone） |
| 35 | S7 `task.dayChanged` | 自動 | DESIGN_D30 |
| 36 | S7 advance の保存の失敗 | 自動 | screenshots.mjs（S7_error_storage_advance） |
| 37 | S8 診断済み | 自動 | AC-13、screenshots.mjs |
| 38 | S8 永続化の注意 | 自動 | AC-13 |
| 39 | S8 書き出しました | 自動 | AC-19 |
| 40 | S8 読み込みの失敗（2 通り） | 自動 | AC-25、screenshots.mjs |
| 41 | S8 iOS の節 | 自動 | AC-21 |
| 42 | S8 保存データなし | 自動 | screenshots.mjs |
| 43 | `settings.import.confirm` | 自動 | AC-20 の確認の変種（screenshots.mjs） |
| 44 | `settings.delete.confirm` | 自動 | AC-16 |
| 45 | import.confirm の保存の失敗 | 自動 | screenshots.mjs |
| 46 | S9 通常（11 行） | 自動 | AC-24 |
| 47 | S9 診断直後 | 自動 | screenshots.mjs |
| 48 | S10 通常（同じ日に 2 行、none の行） | 自動 | AC-24 の seed（同じ日に 2 行）、AC-36 の seed（none の行）、screenshots.mjs |
| 49 | S10 空 | 自動 | AC-16 |
| 50 | S6 `task.next` の保存の失敗 | 自動 | screenshots.mjs（S6_error_storage_next） |
| 51 | S5 `task.next.note.last` | 自動 | DESIGN_D44_（completedSeed で 13 件 → 14 件目を完了）、screenshots.mjs（S5_task.done_note.last） |
| 52 | S6 `task.skipped.levelChanged` | 自動 | AC-8 の 10 通り目、screenshots.mjs（S6_task.skipped_levelChanged） |
| 53 | S7 levelDone（nextDone） | 自動 | DESIGN_D40_（nextDoneSeed）、screenshots.mjs（S7_task.exhausted_nextDone） |
| 54 | S6 levelChanged + note.last | 自動 | DESIGN_D44_（beginnerDoneAtIntermediateSeed。中級で難しすぎ 2 回）、screenshots.mjs（S6_task.skipped_levelChanged_note.last） |

幅 320 / 390、ライト / ダーク、通常の状態の英語と AX5 は tools/screenshots.mjs が撮る（G3）。VoiceOver と実機の Safari は G4 の人。

## 4. テストのつなぎ口と接続先
| 何 | 名前 | contracts/ の場所 |
|---|---|---|
| 状態の初期化 | テストごとに新しいコンテキスト | test-hooks.md W-1 |
| 画面の状態と識別子 | `<html>` の `data-state`（12 個）、`data-build-version`、`data-debug-load-ms`、要素の `data-testid`（文言キー 174 と文字を持たない 37） | identifiers.md 1〜3 |
| 課題の素性 | `task.today` の `data-task-id`、`-area`、`-level`、`-mode`、`-nth-today`、`data-progress-index`、`-total`（helpers/app.mjs の readTask） | identifiers.md 4、W-5 |
| 完了後の画面の数 | `task.total.value` の `data-stat-completed`、`task.cheer` の `data-milestone`、`task.progress.done`、`task.week` の `data-stat-days-completed-week` | identifiers.md 4、data.md 9 |
| 時刻 | `page.clock.setFixedTime`、`timezoneId: 'Asia/Tokyo'`。AC-15 では固定しない | W-3 |
| 課題集 | `/engineer/data/tasks.json`。差し替えない（seed で出し終える） | W-4、W-6 |
| seed | `kyounoitte:data` に addInitScript（印 `test:seeded`）。ID は本番の課題集にあるものだけ（helpers/check-seeds.mjs、中身は ID で引く）。見本は fixtures/seeds/ の 8 件 | W-7、data.schema.json |
| 履歴の読み出し | `history.row` の `data-task-id`、`-date`、`-report`、`-helpful` | W-8 |
| 保存の失敗、永続化の拒否 | `Storage.prototype.setItem` の 1 回だけの例外、`persist` / `persisted` を false | W-9 |
| 書き出しと読み込み | `download`、`setInputFiles` | W-9、data.md 7 |
| 統計 | `data-stat-*` 11 個（helpers/app.mjs の readStats） | W-15、identifiers.md 4 |
| 時間の計り方 | ページの中（click の capture → MutationObserver。表の 4 区間 + `task.next`）、文書が変わる区間はテスト側の時計 | test-hooks.md「時間の計り方」 |
| 送信の数え方、SW の準備 | `fromServiceWorker()` でない応答 + requestfailed、`navigator.serviceWorker.ready` と controller | W-12、W-13 |
| 言語 | locale、`/engineer/i18n/*.json` | W-14 |
| スタンドアロンと iOS Safari | `Navigator.prototype.standalone`、devices の UA、`maxTouchPoints` | W-16 |
| 完了の演出 | `reducedMotion`、`document.getAnimations()`、`task.total.prev` | test-hooks.md「完了の演出の確かめ方」 |
| 語の検査 | strings.md 7.1（ja 3 語、en `\b(streak|missed)\b` i）、7.2（初級の 6 語と tools） | strings.md 7 |
| 回線と CPU の制限 | CDP（150 ms、200,000 B/s、CPU 4 倍） | W-11 |
| 配布物のビルドと差し替え | `node backend/scripts/build.mjs --out <一時> --version …`、静的サーバーの `setRoot` | test-hooks.md「AC-28 の配布物の差し替え」 |
| キーボードの移動キー | WebKit は Alt+Tab、それ以外は Tab | test-hooks.md「キーボードの移動キー」 |

contracts/ にないつなぎ口はない。

## 5. 動かすコマンドと設定
受け入れテストのフォルダの中の設定だけで動く（playwright.config.mjs、package.json、global-setup.mjs、server/）。
- iOS：なし（iOS のアプリは作らない。CLAUDE.md）
- バックエンド（この機能の受け入れテスト）：
  ```sh
  cd backend/tests/acceptance && npm ci && npx playwright install chromium webkit && npx playwright test
  ```
  seed の検査：`cd backend/tests/acceptance && npm run check:seeds`
- 判定の実行では再試行を付けない（`retries: 0`。`--retries` を渡さない）。
- 揺れの確認：影響「大」の AC と一度でも落ちたテストを、同じコマンドを 5 回。
- 前半の分だけ（r8-red.log）：`npx playwright test tests/ac03-ac04-ac29-tasks-json.spec.mjs tests/ac05-ac06-ac07-ac09-report.spec.mjs tests/ac10-ac30-exhausted-external.spec.mjs tests/ac12-ac23-offline.spec.mjs tests/ac14-ac16-redo-delete.spec.mjs tests/ac24-stats.spec.mjs tests/design-d30-day-changed.spec.mjs`
- 後半（r8-red-2.log）：全体 `npx playwright test`（`--list` で 219 tests in 23 files）

## 6. 探索のチャーター
| リスク | チャーター | 区切り |
|---|---|---|
| R1 | 保存データを、書き出し → 削除 → 読み込み → 同じ日に `task.next` → 書き出し、の順で往復させ、行と `current` と `levels` が欠けたり増えたりしないかを見つける | 40 操作 |
| R2 | 段階の規則を、同じ日の申告（難しすぎ → next → 簡単すぎ → next → 難しすぎ）と進級（advance）と、やり直しの診断（段階だけ変える）を混ぜて探り、「連続」の数え直しが起点どおりかと、同じ ID が 2 回出ないかを見つける | 40 操作 |
| R3 | 同じ日に 3 件以上進め、日付をまたぎ（23:59 → 0:01）、週をまたいで、`data-task-nth-today`、`data-progress-index`、累計、今週、issued、extra が手で数えた値と合うかを見つける | 30 分 |
| R4 | キーボードだけで診断 → 完了 → 次の一手 → 修了 → 進級まで進め、フォーカスの行き先と `task.dayChanged` のフォーカスを見つける | 40 操作 |
| R5 | SW が有効な後にオフラインで `task.next`、advance、やり直しを行い、送信と失敗の要求が 0 件かを見つける | 30 分 |

## 7. 画面で確かめるもの
受け入れテストの `app.shot` が test-results/ に撮り、G3 で evidence/screenshots/ に写す。
| AC | 手順 | ファイル名 |
|---|---|---|
| AC-5 | 完了 → rate → done | AC5_task.rate.png、AC5_task.done.png |
| AC-7 | 3 通りの申告 | AC7_task.skipped_<report>.png |
| AC-10 | 初級 / 上級 × reload / next、advance の後 | AC10_task.exhausted_levelDone_<via>.png、AC10_task.exhausted_allDone_<via>.png、AC10_task.today_after_advance_<via>.png |
| AC-14 | やり直し直後と同日の next | AC14_task.today_same_id_after_redo.png、AC14_task.today_frontend_same_day.png |
| AC-24 | 統計 | AC24_settings.stats.png |
| AC-30 | external / in_app | AC30_task.today_external.png、AC30_task.today_in_app.png |
| AC-8 | 10 通り目の 2 回目の S6 と同じ日の 3 件目 | AC8_10_task.skipped_levelChanged.png、AC8_10_task.today_beginner_same_day.png |
| AC-33 | 2 件目と 3 件目 | AC33_<from>_task.today_nth2.png、AC33_<from>_task.today_nth3.png |
| AC-35 | 4 通りの S4 と S5 | AC35_task.rate_total<7／11／30／100>.png、AC35_task.done_total<…>.png |
| AC-36 | 進み具合 | AC36_task.today_progress_4_of_14.png |
| AC-37 | 今週 3 | AC37_task.done_week3.png |
| AC-38 | S4 と S5 の解説 | AC38_task.rate_insight.png、AC38_task.done_insight.png |
| AC-39、AC-40 | 1 問目（通常と幅 320）、3 問目 | AC39_diagnosis.question_1.png、AC39_diagnosis.question_1_320.png、AC40_diagnosis.question_3.png |
| design | D-40、D-44 | DESIGN_D40_task.exhausted_<seenNext／nextDone>.png、DESIGN_D44_task.done_note.last.png、DESIGN_D44_task.skipped_levelChanged_note.last.png |
| 全状態 | tools/screenshots.mjs（5.1 の 54 行 × 幅 2 × ライト / ダーク、通常は en と AX5 も） | evidence/screenshots/ |

## 8. 赤の証拠（実装の前に落ちたこと）
- ログ：docs/verification/001-daily-learning/evidence/r8-red.log（前半の 7 ファイル、Chromium と WebKit）と r8-red-2.log（後半。全体を `npx playwright test` で 1 回、再試行なし。件数と分類は報告と 10 章）
- 実行したコマンドと終了コード：5 章の「前半の分だけ」のコマンド。結果は 10 章の r8 の記録と報告に書く
- 落ちた理由：実装が G3 PASS 時点（27509e4）のままで、r8 の要素（`task.next`、`task.exhausted.levelDone` / `allDone` / `advance`、`data-task-nth-today`、`settings.stats.daysCompletedWeek.value` など）がなく、課題集が 126 件のため。詳しくは 10 章

## 9. 範囲の外
- 実機の Safari、VoiceOver、AX5 の操作感、LINE などのアプリ内ブラウザ（G4 の人）。
- サーバーエラー（500、タイムアウト）：読み込み後に通信しない。初回のオフラインはブラウザのエラーページ（design 5 の冒頭）。
- 用語の説明の有無（AC-34 の確かめ方の後半）：指揮役が読んで docs/approvals/ に残す。
- 公開後に足す 252 件版の AC-4：その版のテストは G4 で `MIN_PER_LEVEL` を 14 にして差し替える。
- 課題 ID の付け替え前の保存データ（未公開。ADR 0002 (e)）。

## 10. 変更の記録
### r8（2026-11-05。実装より先。前半）
- helpers/app.mjs：`readTask` に `nthToday`、`progressIndex`、`progressTotal`（identifiers.md 4）、`next()`（`task.next` を押して待つ）、`STAT_ATTRS` と `readStats()`（11 値）を足した。
- tests/ac03-ac04-ac29-tasks-json.spec.mjs：AC4 を PRD r11 の数（210、14、7）に。BUDGET2_ を 2 本に分け、5 つの字数の平均 480 と gzip 105,000 に（budgets.md 2、W-6）。
- tests/ac05-ac06-ac07-ac09-report.spec.mjs：AC5 を 2 本に（答える／答えずに再読み込み）、AC5 と AC7 に `task.next` 1 件と `data-stat-issued`=4 の不変を足した（PRD r11 の AC-5、AC-7 の Then「次の一手に進む」を押さない限り…（統計の出した件数は変わらない））。AC6 に nth-today 1 を足した。
- tests/ac10-ac30-exhausted-external.spec.mjs：AC10 の 1 本を 4 本に置き換えた（初級 / 上級 × 翌日 / 同日の next。PRD r11 の AC-10）。AC30 の課題集の守りの数を AC-4 の r11 の値に。
- tests/ac12-ac23-offline.spec.mjs：AC12 (a) に AC-33 の操作（`task.next` → ≤1,000 ms、nth 2）を足した（PRD r11 の AC-12 の When）。
- tests/ac14-ac16-redo-delete.spec.mjs：AC14 の 2 通り目を「やり直し → 同じ ID → 完了 → next → 同じ日に新しい領域」に（PRD r11 の AC-14 の Then。G1 reviewer r2 の要修正 1 で直った W-7）。
- tests/ac24-stats.spec.mjs：新しい seed（6 行、完了 4）と 11 値、開いた状態は `task.skipped`（PRD r11 の AC-24、W-7）。
- tests/design-d30-day-changed.spec.mjs：S7 の h1 を `task.exhausted.message` から `task.exhausted.levelDone` に（design r9 の 5.1 #32、identifiers.md 2。文言キー `task.exhausted.message` は strings.schema の required にない）。
- tools/screenshots.mjs：`backend-beginner-005` を ID で決め打ちしていた AC-17 の行を、課題集からインラインコードが最も長い課題を引く形に（W-7「中身を ID で決め打ちしない」）。S7 の名前を `S7_task.exhausted_levelDone` に。
- seeds/：10 件は付け替え後も本番の課題集にある ID だけ（check:seeds OK）。`seed-ac8-beginner-one-too-hard.json` は段階の規則だけを見るので残した（W-7）。
- 後半（同日。実装より先）：
  - 新しいファイル 4 つ：tests/ac33-next.spec.mjs（AC-33 × 2）、tests/ac34-ac38-tasks-json-r8.spec.mjs（AC-34、AC-38 の JSON）、tests/ac35-ac37-done-screen.spec.mjs（AC-35 × 4 + 語、AC-36、AC-37、AC-38 の画面 × 2、DESIGN_D43_ × 2）、tests/ac39-ac40-diagnosis-r8.spec.mjs（AC-39 × 2、AC-40）。design の状態は tests/design-d40-d44-next-note.spec.mjs（DESIGN_D40_ × 2、DESIGN_D44_ × 3）。
  - tests/ac08-level-rule.spec.mjs：10 通り目を足した（PRD r11 の AC-8。seed は contracts/fixtures/seeds/seed-ac8-intermediate-same-day.json、時刻は動かさない）。
  - tests/ac11-ac13-storage.spec.mjs：印のない seed で `task.next` と `task.exhausted.advance` の保存に `device.persistRequested` が入り persist() が 1 回であることを 2 本足した（data.md の 11、W-9）。
  - tests/ac17-ac18-ac27-a11y.spec.mjs：`task.exhausted` の到達を levelDone（初級を出し終えた seed）と allDone（上級）の 2 つに分け、AC-27 を 7 本に（PRD r11 の AC-27）。AC-17 は levelDone。
  - helpers/seed.mjs：completedSeed（W-7「AC-35 の seed」の決まり）、seenNextSeed / nextDoneSeed（W-7「design の 5.1 #33」）、beginnerDoneAtIntermediateSeed（5.1 #54）。
  - tools/screenshots.mjs：5.1 の #16、#22〜#25（S4 は描いて 1 秒後に撮り、`task.total.prev` が 0 件であることを確かめる）、#29、#33、#36、#50〜#54 を足した。S4 の通常は累計 11（#22）に移し、累計 4 の S4_task.rate はライトだけ。
  - 語の検査（AC-35）は ja.json と en.json の両方に ja の 3 語と en の正規表現を当て、先に strings.schema に通す（strings.md の 7.1）。
  - helpers/app.mjs：`text(strings, key)` を足し、`fill` は template が文字列でなければ「文言ファイルにキーがない」と分かる形で落とす（実装が古くてキーがないときに TypeError で落ちて理由が読めなかったため。期待は変えていない）。
  - 実行（r8-red-2.log。`npx playwright test`、再試行なし、2 回動かして同じ結果）：219 本中 123 passed、96 failed（48 本 × chromium / webkit）、skipped 0。落ちた 48 本はすべて「実装が G3 PASS 時点（27509e4）のままで r8 の機能がない」：課題集に insight がなく 126 件（AC-3、AC-4、AC-30、AC-34、AC-38、AC-28 の新版の検査）、中級が 7 件で AC-35 の 10 / 29 / 99 件の seed を作れない（completedSeed が「未出を残せない」で止める）、i18n に r8 の文言キー（`area.*.desc`、`task.next.note` など）がない（AC-26、AC-35 の語、AC-39、DESIGN_D40 / D44）、r8 の識別子（`task.next`、`data-task-nth-today`、`data-progress-*`、`settings.stats.daysCompletedWeek.value`、`task.exhausted.levelDone` / `allDone`、`task.insight.text`、`years.never`）がない（AC-5〜AC-8、AC-10、AC-12〜AC-14、AC-17、AC-24、AC-27、AC-33、AC-36、AC-37、AC-40、DESIGN_D30、DESIGN_D43）。テストの誤りで落ちたものは 0 件。
  - 範囲の外で気づいたこと（直していない）：なし。

### r7 まで
- r7（2026-11-04）：DESIGN_D31_ を 1 本足した（155 本）。r6：G2 の判定 tech-lead r3 と reviewer r3、契約の更新（f40c61a）に合わせた。r5：design r6（D-30、D-31、U-14、U-15）と契約（3b7068a、3689e3d）に合わせた。r4：PRD r7 の AC-14 の 2 通り目。r3：G2 の tech-lead r2 の「時間の計り方」。r2：G2 の r1 の指摘。r1：最初の版（AC-1〜AC-32）。

## 確かめ（提出前に verifier が印を付ける。reviewer はこれを信じずに確かめる）
- [x] 読んだファイルが PRD、design/、contracts/（と指揮役が指定した ADR・型・判定）だけで、冒頭に全部並んでいる。
- [x] PRD のすべての AC 番号（AC-1〜AC-40）が 2 章と、テストの名前にある（grep の突き合わせは報告）。AC のないテストは BUDGET2_ と DESIGN_（D30、D31、D40、D43、D44）だけ（W-6 の決まり）。
- [x] 2 章の全行に、技法、試す値、具体的な値の結果がある。
- [x] 影響「大」のリスク（R1〜R6）のすべてに、自動テスト、3 章の行、6 章のチャーターがある。
- [x] 3 章の 9 行と 5.1 の 54 行すべてに選んだものがあり、範囲外には理由がある。
- [x] 4 章のつなぎ口がすべて contracts/ にある。
- [x] 受け入れテストのフォルダで、sleep、skip、xfail、retry、@testable import の grep の件数を報告に書いた（`pause` は AC-28 の When の「2 秒以上の間隔」のためだけ：helpers/app.mjs）。
- [x] 8 章の赤の証拠（r8-red.log、r8-red-2.log）があり、落ちた理由が「機能がまだない」こと（テストの誤りで落ちたものは報告で分けた）。
