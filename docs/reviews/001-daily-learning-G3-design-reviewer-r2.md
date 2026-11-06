PASS

001-daily-learning の G3 デザイン判定 r2 は PASS です。採点表は 16 / 16 点で、★はすべて満たし、0 点のカテゴリもありません。

- r1 の 12 項目は、すべて直っていることを確かめました。
- 新しい状態 `task.dayChanged` の見た目と仕様は一致しています。日英、色、位置、AX5、フォーカスの移動を見ました。
- 新しい重大な指摘はありません。下の提案 3 つは、合否と点数に影響しません。

## 指摘
新しい重大な指摘も要修正もありません。r2 では重大なものだけを新しく書く決まりなので、残りは提案にしました。

1. **提案**：S10 の「答えを見る」に開閉の印がなく、リンクと同じ見た目です。
   - 場所：backend/public/app.css:518-525（`summary { display: inline-block; … text-decoration: underline; color: action.primary }`）。`display: inline-block` にしたため、`list-item` の印 ▸ が消えています。
   - 証拠：`evidence/screenshots/S10_history_light.png` と `S10_history_answerOpen_light.png` で、開く前も開いた後も印がありません。
   - 仕様との差：design/001-daily-learning/screens.md の S10 は「▸ 答えを見る」です。tokens.md 4 の「開閉」の行（r5）も「見える左端（開閉の印）」と書いています。
   - 影響：開いているかどうかが見た目では分からず、移動するリンクとも見分けがつきません（Nielsen 1、4）。読み上げではネイティブの summary が開閉の状態を伝えるので、重大ではありません。
   - 直す方向：summary を `display: list-item` に戻して印を見せる。または、仕様の図と tokens から印を消す。どちらかで仕様と画面をそろえます。

2. **提案**：design/001-daily-learning.md:459 で、U-15 がまだ「決まっていないこと」に残っています。
   - 実際には決まっています。docs/approvals/delegation.md（2026-11-04）は「そのまま実行する」とし、contracts/data.md:78 も「対象の外」と確定しています。
   - 10 の「決まったこと」に移すと、仕様と契約がそろいます。

3. **提案（手順）**：R-27〜R-31 は、仕様 r6 と同じコミット 05cdd4a で足されています。
   - research の冒頭と仕様の「確かめ」は「仕様 r6 より先に書いた」としていますが、git では先かどうかを確かめられません。
   - ★の条件（ファイルを作った順。調査 854cf47 が仕様 0d83baf より前）は満たします。
   - 次からは、research を足すコミットを仕様より先に分けてください。

## 採点表
| カテゴリ | 点 | ★ごとの結果と証拠 |
|---|---|---|
| A 根拠 | 2 | ★調査が先：満たす。`git log --diff-filter=A` の結果は、調査 854cf47（2026-10-30 07:18:12）が仕様 0d83baf（07:35:08）より前です。R は 31 件で、URL か確認日のない R は 0 件です。仕様にあって調査にない R も 0 件です（comm の出力が空）。<br>★決定表：満たす。D-1〜D-33 の 33 行すべてに R-n と原則（URL か B-n）があります（python の結果は欠けなし）。新しい D-30〜D-33 は、R-27〜R-30 と NN/g、WCAG の URL を引いています。<br>★狙い：満たす。r1 から変わっていません。R-30 の引用は WebFetch で一致を確かめました。 |
| B HIG と標準部品 | 2 | ★標準部品：満たす。新しい知らせはネイティブの `<p role="status" tabindex="-1">` です（view-task.js:13-15）。ダイアログは `<dialog>`、開閉は `<details>` のままです。<br>★逸脱：満たす。逸脱はファイルの読み込み（D-27）だけです。案内の枠は D-33 と tokens 1 に唯一の例外として書かれています。 |
| C バウハウス | 2 | ★B-1、B-2：満たす。新しい状態でも主操作は 1 つで、塗りのボタンです（S3 の dayChanged は「完了」、S7 の dayChanged は「Redo the diagnosis」）。知らせは文字だけで、飾りはありません（`grep -c "shadow\|gradient" app.css` は 0）。<br>揃える線：直りました。リンクの左端が h1 の線にそろっています（S6_too_hard_ax5、S8_settings_light、S10_history_light）。<br>色の意味：直りました。warning の一覧に limit と dayChanged が足され、実装と同じです。 |
| D 使いやすさ | 2 | Nielsen の重大な違反はありません。<br>日付が変わった後の操作では、何が起きたかと前の課題の行き先が出ます（S3/S7_dayChanged、R3-r2.log の 1、5、7、8、14、15）。<br>確認ダイアログを開いたまま日付が変わった場合、「削除する」「置き換える」は実行されず、データは変わりません。そのうえで知らせが出ます（R3-r2.log の 7、8）。<br>保存に失敗したときは知らせとやり直しが並び、やり直すと 1 回の保存にまとまります（R3-r2.log の 12、13、R3_04_dayChanged_save_failed.png）。 |
| E 状態 | 2 | ★全画面の 7 つの状態：満たす。<br>通常の状態の 4 通り（light、dark、ax5、en）は、chromium の 16 場面すべてにあります（index.tsv を awk で集計）。S0_loading、S6 too_hard、S3 と S7 の dayChanged、ダイアログ 2 つを含みます。<br>ほかの状態は light でそろっています。S8 のエラー (2) と削除のダイアログのエラーは「なし（理由）」に直りました（design 5）。 |
| F アクセシビリティ | 2 | ★コントラスト：満たす。自分で計算し、4 通り（ライト / ダーク / 上げる・ライト / 上げる・ダーク）すべてで基準を超えます（下の「証拠」）。新しい組は warning/bg で 7.48 / 11.36 / 10.7 / 15.25、エラーの枠 error/bg で 6.57 / 7.84 / 9.39 / 11.83 です。app.css の 16 進の色はすべて tokens.md にあります（差は空集合）。<br>★押せる範囲：満たす。`.btn`、`.link`、`summary` の min-height は 2.75rem（44 px）のままです（app.css:207-208、266-267、520）。ダイアログの ax5 では「やめる」の高さが 101 CSS px です（627〜728。dialog-ax5-focus.tsv）。<br>★アイコンだけの操作：該当なし。aria-label は 0 件で、aria-labelledby だけです。<br>ダイアログの ax5 では、初期フォーカスの cancel と ok がどちらも表示域の中にあり、移動キー 3 回で ok に届きます。chromium と webkit の両方です。<br>axe は 95 画面で違反 0 です。incomplete の 6 ノードは target と見送る理由が 7 章にあり、JSON からも同じ target を取り出せました。 |
| G 一貫性 | 2 | 副操作のボタンが列いっぱいになりました（`.btn { width:100% }` を 480 px 未満で。S2_error_storage_light、S1_addToHomeScreen_en）。<br>エラーの枠は `--size-border-strong` と color.error を使っています（app.css の `textarea.is-error`、S3_error_storage_answer_light）。<br>summary の印の差は提案 1 です。 |
| H 文言 | 2 | ja と en は 146 キーずつで、design 7 の表と一字一句同じでした（python で違い 0）。<br>英語の長い文言は、置き場所の en で切れていません（S3_task.today_external_en の「Outside the browser」、S8_homeScreen_guide_en の「Show how to add to the Home Screen」、S1_addToHomeScreen_en の steps.4、S3/S7_dayChanged_en）。 |

- 合計：16 / 16 点です。★の未達 0、0 点のカテゴリ 0 で、合格の線（★をすべて、0 点なし、13 点以上）を満たします。

### 第一印象と仕様の比較（新しい状態だけ）
- S3 dayChanged：日付が変わり、直前の操作が無効になったと伝える画面です。そのうえで今日の課題を読ませ、「完了」を押させます。D-30 と合います。
- S7 dayChanged：同じ知らせの後に、課題が尽きたことを伝え、やり直させます。合います。

### Nielsen 5 と 9（変わった所）
- S3 と S7 の dayChanged：
  - 5：前の日の操作は実行されません。確認中の削除と置き換えも実行されないので、思わぬデータの変化を防ぎます。
  - 9：何が起きたかと前の課題の場所を、文で示します。保存に失敗したときは、やり直しを出します。
- S3 の答えの保存に失敗したとき：9 枠を color.error にし、`aria-describedby` にエラーの文を足します。入力は残ります。
- ほかの画面：r1 から変わっていません（r1 の表のとおり）。

### P-1 と P-2
- 毎日の経路（開く → S3）には何も足していません。知らせは、画面を開いたまま日付が変わった後の操作で着いたときだけ出ます。読み込みで着いたときは 0 件です（DESIGN_D30_、R3-r2.log の 4、6）。
- 新しい S3 の答えの欄は空です。書きかけの答えは、前の行に残ります（R3-r2.log の 1）。
- S8 の注意は、開くたびに persisted() で決まります（persist.js:13-29）。なので出続けません（P-2）。

## 前回の指摘の追跡
| 前回の指摘 | 直った / 直っていない | 証拠 |
|---|---|---|
| 1 重大：S6 と S0 loading の 4 通りがない | 直った | screenshots/S6_task.skipped_too_hard_{light,dark,ax5,en}.png、S0_loading_{light,dark,ax5,en}.png。index.tsv の集計で、通常の 16 場面すべてに 4 通りがある |
| 2 要修正：ダイアログの AX5 で主な操作が見えない | 直った | dialog_settings.delete.confirm_ax5.png（本文の末尾と 2 つのボタンが表示域にある）、import.confirm_ax5_tabOk.png（ok にフォーカスの枠）。dialog-ax5-focus.tsv の 4 行がすべて ok。webkit/ にも同じ組がある |
| 3 要修正：日付が変わった後に知らせがない | 直った | 仕様は design D-30、5 と 6 の S3 と S7、7 の `task.dayChanged`。実装は view-task.js:13-15、main.js:65-95、app.css の `.day-changed`。画面は S3/S7_dayChanged の 4 通りずつ。動作は R3-r2.log の 15 場面、DESIGN_D30_ 10 本 PASS |
| 4 要修正：リンクと summary の左端 | 直った | app.css の `.screen p > .link:only-child` と summary の margin-left、nav の margin-left。S6_too_hard_{ax5,en,dark}、S8_settings_light、S10_history_light で h1 の線にそろう |
| 5 要修正：副操作のボタンの幅 | 直った | app.css の 480 px 未満で `.btn { width:100% }`。S2_error_storage_light の「もう一度保存する」、S1_addToHomeScreen_en の「Close」、S8_homeScreen_guide_en |
| 6 要修正：エラー中の textarea の枠 | 直った | app.css の `textarea.is-error`（size.border.strong、color.error）、view-task.js の syncAnswerError（aria-describedby に 2 つの id）。S3_error_storage_answer_light.png。aria-invalid を付けない判断は tokens 4 と delegation.md 2026-11-04 にある |
| 7 要修正：axe の記録 | 直った | JSON 95 個 = axe-summary.tsv 95 行（ヘッダーを除く）= verification.md の 95。violations 0。incomplete 6 ノードの target をすべて取り出せた（下の「証拠」）。理由は verification.md:177 |
| 提案 8：persist の注意が古くなる | 直った | D-31、persist.js の readNotPersisted（上限 1,000 ms、false のときだけ出す）。U-14 は「求め直さない」で閉じた（delegation.md） |
| 提案 9：limit の色 | 直った | D-32。design 8 の warning の一覧と tokens 1 に足した |
| 提案 10：起きないエラーの状態 | 直った | design 5 の S8 (2) と削除のダイアログを「なし（理由）」に。7 の error.storage.message の使う場所から S8 を外した |
| 提案 11：案内の箱 | 直った | D-33、tokens 1 の例外の 1 文、4 の「案内」の行、screens.md の S1 の図を枠で描き直した |
| 提案 12：英語の長い文言の置き場所 | 直った | S3_task.today_external_en.png、S8_homeScreen_guide_en.png、S1_addToHomeScreen_en.png。切れも横スクロールもない |

## 証拠
- 対象：feat/001-daily-learning の eabf7bb。r1 の f01a6ee との差を見ました。
  - `git diff --stat f01a6ee HEAD -- design docs/prd backend/public contracts docs/approvals backend/scripts`：design 4 ファイル、backend/public 8 ファイル（app.css、i18n 2 つ、index.html、main.js、persist.js、rules.js、view-task.js）。design と app.css、view-task.js の差は全部読みました。
- 読んだファイル：
  - docs/reviews/001-daily-learning-G3-design-reviewer-r1.md、docs/reviews/001-daily-learning-G3-verifier-r2.md（冒頭〜未検証）
  - design/001-daily-learning.md、screens.md、tokens.md、001-daily-learning-research.md（f01a6ee からの差の全部）
  - docs/approvals/delegation.md、docs/org/gates.md の G3、docs/prd/001-daily-learning.md:109-110（P-1、P-2）
  - verification.md（15〜19、61、105、119、160〜183、223〜272 行）、evidence/exploration/R3-r2.log
  - backend/public/js/persist.js、main.js:60-95、view-task.js の差、app.css の差
- 開いたスクリーンショット（docs/verification/001-daily-learning/evidence/ から）：
  - screenshots/ の dialog_settings.delete.confirm_ax5、dialog_settings.import.confirm_ax5_tabOk
  - S3_task.today_dayChanged_{light,dark,ax5,en}、S7_task.exhausted_dayChanged_en
  - S6_task.skipped_too_hard_{ax5,dark,en}、S0_loading_{ax5,dark}
  - S2_error_storage_light、S1_addToHomeScreen_en、S3_error_storage_answer_light、S3_task.today_light、S2_question_1_light
  - S10_history_light、S10_history_answerOpen_light、S8_settings_light、S8_homeScreen_guide_en、S3_task.today_external_en
  - exploration/R3_04_dayChanged_save_failed.png
- 実行したコマンドと結果：
  - 調査が先：`git log --diff-filter=A --format='%h %ci %s' -- design/001-daily-learning-research.md design/001-daily-learning.md` → 0d83baf 2026-10-30 07:35:08（仕様）、854cf47 2026-10-30 07:18:12（調査）。R-27〜R-31 は 05cdd4a（仕様 r6 と同じコミット）。
  - R の数：`grep -cE '^\| R-[0-9]+'` → 31。URL か確認日のない R → 0。`comm -23`（仕様にあって調査にない R）→ 空。
  - 決定表の python：D の行 33、R か原則の欠けはなし。
  - 文言の python：ja 146、en 146、表 146。片方にしかないキー 0、表にないキー 0、文字の違い 0。
  - index.tsv の awk：scrollWidth ≠ clientWidth か result ≠ ok の行は 0。通常の 4 通りは S0_error_invalidData、S0_loading、S1、S2 q1、S3、S3 dayChanged、S4、S5、S6 too_hard、S7、S7 dayChanged、S8、S9、S10、ダイアログ 2 つ。
  - axe の python：JSON 95 個、violations 0。incomplete は 6 ノードで、すべて color-contrast（serious）。target は `p[data-testid="settings.delete.confirm.body"]` が 4 つ、`settings.import.confirm.body` が 2 つ。
  - コントラスト（WCAG の式。トークンの値から。順にライト / ダーク / 上げる・ライト / 上げる・ダーク）：

    | 組 | ライト | ダーク | 上げる・ライト | 上げる・ダーク |
    |---|---|---|---|---|
    | text/bg | 16.48 | 15.29 | 21.0 | 21.0 |
    | secondary/bg | 7.0 | 8.93 | 13.58 | 15.91 |
    | primary/bg | 6.7 | 8.89 | 9.84 | 12.21 |
    | onPrimary/primary | 6.7 | 8.24 | 9.84 | 12.21 |
    | border/bg | 5.33 | 5.57 | 21.0 | 21.0 |
    | success/bg | 6.29 | 10.43 | 9.95 | 14.28 |
    | warning/bg（dayChanged、limit） | 7.48 | 11.36 | 10.7 | 15.25 |
    | error/bg（文字と textarea の枠） | 6.57 | 7.84 | 9.39 | 11.83 |

    - フォーカスの枠と error の枠は 1.02〜1.13 で並びます。ただし枠は outline-offset 2 px で地の上にあるので、効くのは地との比（primary/bg と同じ値）です。
  - 色とトークン：app.css の 16 進の色と tokens.md の差（python）は set()。`grep -c "shadow\|gradient" app.css` は 0。aria-label は 0 件（aria-labelledby の 8 件だけ）。
  - 押せる範囲：`grep -n "size-target-min\|min-height\|min-width" app.css` → :207-208、:266-267、:520 が 2.75rem。
  - `grep -n "U-15" design/001-daily-learning.md contracts/data.md` → design:459 は未決のまま、data.md:78 は確定（提案 2）。
- 開いた URL と確認した日付：https://www.nngroup.com/articles/common-region/ （2026-11-04）。「items within a boundary are perceived as a group」「busy, cluttered designs」「using whitespace alone … reduces the visual complexity」があり、2020-07-12 の記事です。R-30 の記述と合います。
- 未検証（どれも★ではありません。★はすべて証拠付きで満たします）：
  - 実機の Safari と Chrome での persisted() の値、OS の文字サイズ最大、VoiceOver の読み上げ（G4 で Takuma が確認）。
  - webkit での summary の印の出方（提案 1。chromium の画像だけで見ました）。
- 書いたファイル：なし。

## 記録
- 関門：G3
- 判定した役：design-reviewer
- 回：r2
- 対象：feat/001-daily-learning（eabf7bb。実装は 1560b36、design は r6：05cdd4a、b9b37e1、121cd64）
- 日付：2026-11-04
