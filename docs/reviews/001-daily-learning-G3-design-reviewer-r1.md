FAIL

この判定（001-daily-learning、G3 の design-reviewer、r1）は FAIL です。理由は 2 つあります。

- **スクリーンショットの不足（重大）**：仕様にある「画面×状態」のうち、通常の状態のスクリーンショットが 4 通り（ライト、ダーク、AX5、英語）そろっていない画面があります。S6 task.skipped と S0 loading です。手引きでは、足りない組があれば FAIL です。
- **点数**：採点表は 11 / 16 点で、合格の 13 点に届きません。0 点のカテゴリも E の 1 つあります。

画面そのものはおおむね仕様どおりです。
- 文言は日英とも 145 キーすべてが仕様 7 の表と一字一句同じでした。
- 色は 4 通りの設定すべてで基準を満たします（自分で計算しました）。
- 原則 P-1、P-2 については、毎日開く人の手間は増えていません。

不足の撮り直しと、要修正（仕様との差 3 件、状態の設計の抜け 1 件、監査の記録 1 件）を直せば、r2 で通る見込みです。

## 指摘

1. **重大**：通常の状態のスクリーンショットが 4 通りそろっていません。
   - 場所：docs/verification/001-daily-learning/evidence/screenshots/index.tsv
     - S6 は `S6_task.skipped_{too_hard,too_easy,no_time}_light.png` の light だけで、dark、ax5、en がありません。
     - S0 の通常の状態（design 5 の S0「通常」= loading）は `S0_loading_light.png` だけで、dark と ax5 がありません。en は HTML に日英を併記しているので、同じ見た目でかまいません。
   - 根拠：gates.md G3「全画面と全状態のスクリーンショットがあり、通常の状態はライト、ダーク、AX5、英語の4通り」。手引きの「足りない組を証拠に書いて FAIL」。
   - 直す方向（verifier）：tools/screenshots.mjs の S6 と S0_loading の場面に normal の 4 通りを足して撮り直します。必要な組は下の「証拠」に挙げました。

2. **要修正**：ダイアログの AX5 のスクリーンショットでは、主な操作が見えていません。
   - 場所：`dialog_settings.delete.confirm_ax5.png`、`dialog_settings.import.confirm_ax5.png`
   - 見えたこと：本文の後ろで「削除する」の枠の上端だけが見え、「やめる」は見えません。
   - 原因：tools/screenshots.mjs:402 でダイアログを開いた後にルートの文字を 200% にし、:411 で `fullPage: true` で撮っているためです。利用者が実際に見る画面と違います。
   - 計算では、ダイアログの中身は 200% で約 1,000 CSS px あり、表示域（844 CSS px）を超えます。既定の `dialog:modal` は overflow: auto なので、スクロールすれば届くはずです。ただし証拠はありません。
   - 根拠：手引き G3 の「AX5：主な操作が画面の外に消えていない」。design 9 の「ダイアログ：ボタン 2 つは縦に積む」。
   - 直す方向（verifier）：文字を 200% にしてからダイアログを開き、表示域だけを撮ります。初期フォーカスの「やめる」が見えていることと、Tab で「削除する」に届くことを記録します。届かなければ backend-engineer がダイアログに max-height と overflow を明示します。

3. **要修正**：画面を開いたまま日付が変わった後の最初の操作には、何が起きたかの知らせがありません。
   - 場所：docs/verification/001-daily-learning/evidence/exploration/R3_02_done_after_midnight.png、R3.log
   - 見えたこと：前日の課題で「完了」を押すと、黙って別の課題（翌日分）に差し替わります。前日の課題は「申告なし」で履歴に移ります。
   - 振る舞いは PRD 11 の冒頭（r6「日付をまたいだ申告はできない」）どおりです。ただし design 5 にこの場面の状態も文言キーもありません。タブを開いたまま翌朝に「完了」を押す人は珍しくないと考えます［推測］。その人は完了が記録されなかったことに気づけません。
   - 根拠：Nielsen 1（システムの状態が見える）と 9（エラーの認識と回復）https://www.nngroup.com/articles/ten-usability-heuristics/ 。PRD 13 の完了率に直接効きます。
   - 直す方向：
     - pdm と tech-lead が verifier の #1（操作を効かせるか捨てるか）を決めます。
     - designer が S3 に `role="status"` の 1 文のキーを足します。例：`task.dayChanged`「日付が変わったため、前の課題は申告なしで履歴に残しました。今日の課題です。」。次の一手（履歴へ）も決めます。
     - あわせて、前日の答えが翌日の `current.answer` に一時的に入る件を tech-lead が見ます。

4. **要修正**：単独のリンクと `<summary>` の文字が、列の左の線から 8 CSS px 右にずれています。
   - 場所：backend/public/app.css:263-267、:501（`.link` と `summary` の `padding: var(--space-3) var(--space-2)`）。ヘッダーの `app.name` だけは :135 で `margin-left: calc(-1 * var(--space-2))` で戻してあります。
   - 見える所：
     - `S5_task.done_en.png` の View history、`S6_task.skipped_too_hard_light.png` の履歴を見る
     - `S8_settings_light.png` の統計を見る、履歴を見る
     - `S9_settings.stats_en.png` の Back to settings
     - `S10_history_light.png` の答えを見る
     - `S10_history_ax5.png` の 2 行目の nav
   - 根拠：design/001-daily-learning.md:354「要素の左端を列の左の線にそろえる（B-3）」。
   - 直す方向：行の先頭に置く `.link` と `summary` に、ヘッダーと同じ負の margin-left を付けます。押せる範囲の 44×44 は保ちます。

5. **要修正**：同じ副操作のボタンなのに、幅が画面によって違います。
   - 場所：
     - `error.storage.retry`（`S2_error_storage_light.png`、`S3_error_storage_answer_light.png`）
     - `home.addToHomeScreen.close`（`S1_addToHomeScreen_light.png`）
     - `home.standalone.importButton`（`S1_standalone_import_light.png`）
   - 見えたこと：幅 480 px 未満なのに中身の幅です。S8 などの副操作は列いっぱいです。
   - 原因：この 3 つが `.actions` の外にあり、app.css:299-304 の規則が効かないためです（view-start.js:18-25、:89）。
   - 根拠：tokens.md 4「ボタン（副操作）…寸法は主操作と同じ」と、主操作の「幅は列いっぱい（幅 480 px 未満）」。手引き G「同じ働きの要素は全画面で同じ部品」。
   - 直す方向：3 つを `.actions` で包むか、480 px 未満の幅の規則を `.btn` 全体に当てます。

6. **要修正**：エラーのときの入力欄の枠が、仕様どおりになっていません。
   - 場所：`S3_error_storage_answer_light.png`（textarea の枠が color.error になっていない）。app.css:28 の `--size-border-strong` は定義だけで使われていません。
   - 根拠：design 8「color.error：…エラーのときの入力欄の枠」、tokens.md 3 の size.border.strong「エラーの枠（入力欄がエラーのとき）」。文字のエラーは出ているので、色だけで伝えている問題ではありません。
   - 直す方向：エラーの間は textarea に `aria-invalid="true"` を付け、CSS で 2 px の color.error の枠にします。

7. **要修正**（verifier）：監査の記録が検証レポートと合いません。
   - verification.md:52、:142 は「axe 94 画面」です。実際には axe/ の JSON が 91 個、axe-summary.tsv も 91 行です。
   - ダイアログの 6 画面（chromium と webkit の `dialog_settings.*_light.json`、`S0_error_dialog_delete_light.json`）に、`incomplete` の `color-contrast`（serious）が 1 ノードずつあります。レポートはこれに触れていません。JSON は件数しか持たないので、どのノードかも分かりません。
   - ダイアログの中の色の組は自分で計算して基準を満たしました（証拠）。それでも、手引きの「出た問題を見送ったなら理由が書いてある」を満たしていません。
   - 直す方向：画面数を直します。incomplete のノードの target を残し、見送る理由（例：backdrop の下の inert な要素）を 7 章に書きます。

8. **提案**：verifier の #3（S8 の「永続化を許可しませんでした」）の見え方の評価です。
   - 見た目は仕様どおりです。color.warning で、書き出すボタンの直上にあり、やることが書いてあります。毎日開く S3 には出ないので、P-2 の負担にはなりません。
   - 気になるのは中身が古くなる点です。実装は初めて S3 を出したときの persist() の答えを保存し（main.js:341-355）、S8 はその値だけを見ます（main.js:476）。
   - Chrome は利用の度合いやインストールで後から許可を判断し直します（web.dev。「A denied request can be retried later」）。それでも一度 false なら、注意は消えずに出続けます。実機の Chrome でも新しいサイトでは false がふつうと考えます［推測］。常に出る注意は効き目が薄れます（Nielsen 8）。
   - 直す方向：S8 を出すときに `navigator.storage.persisted()` で今の状態を読みます（確認は出ません）。あわせて、後の S3 で persist() を 1 回だけ求め直すかを tech-lead と designer が決めます（contracts/data.md の device.persistGranted に関わります）。実機での見え方は G4 で Takuma が見ます。

9. **提案**：`task.answer.limit` が color.warning で出ています（view-task.js:49、`S3_answer_limit_light.png`）。design 8 の色の使い所の一覧（「これ以外は使わない」）にありません。一覧に足すか、color.text.secondary にします。

10. **提案**：仕様の状態が、実装では起きない所があります。design 5 の S8 エラー (2)（書き出しと削除の保存の失敗）と、削除の確認ダイアログの保存の失敗です。書き出しは保存しません。削除は removeItem です（store.js:32、探索 R5）。design 5 を「なし（理由）」に直すと、仕様と画面が一致します。

11. **提案**：S1 の案内（`.notice`、app.css:459）が四方を枠で囲んだ箱です。screens.md の S1 の図には箱がなく、tokens.md 1 には「カード、面…置かない。区切りは余白と 1 px の線だけ」とあります。案内を本文と見分けるために箱を残すなら、tokens と図に書き足します。

12. **提案**：英語が日本語の 2 倍を超える文言のうち、置き場所の英語のスクリーンショットがないものがあります。
    - `task.external.badge`「Outside the browser」
    - `settings.homeScreen.open`「Show how to add to the Home Screen」
    - `home.addToHomeScreen.steps.4`
    - design 9:413 が確かめる場所に挙げています。`S3_task.today_external`、`S8_homeScreen_guide`、`S1_addToHomeScreen` の en を足すと閉じます。

## 採点表

| カテゴリ | 点 | ★ごとの結果と証拠 |
|---|---|---|
| A 根拠 | 2 | ★調査が先：満たす。調査 854cf47（2026-10-30 07:18:12）が仕様 0d83baf（07:35:08）より前です。調査はその後変わっていません（git log は 1 件だけ）。R は 26 件で、URL か確認日のない R は 0 件です。<br>★決定表：満たす。D-1〜D-29 の 29 行すべてに R-n と原則があります（python）。仕様にあって調査にない R は 0 件です（comm の出力が空）。<br>★狙い：満たす。仕様は G1 r2 の判定の後、r5 まで小さな直しだけです。画面にも表れています。「ひとつ」は S3 に課題 1 件と nav 2 つ。「静か」は影、グラデーション、アイコンが 0（app.css の shadow と gradient は 0 件）。「正直」は S7 の h1 と S1 の lead.2。差をつける点 1 は、幅 320 の S3 の最初の画面に題名と「なぜ今これか」の 2 行目まで入っていることです（`S3_task.today_backend-beginner-005_w320.png`。2 行目は約 304 CSS px の位置で、表示域は 568）。 |
| B HIG と標準部品 | 2 | ★標準部品：満たす。radio は `<fieldset>`、`<legend>`、`<label>` です（view-start.js:179-181）。ダイアログは `<dialog>` と showModal、履歴の答えは `<details>` と `<summary>`、ボタンはすべて `<button type=button>` です（dom.js）。<br>★逸脱：満たす。ファイルの読み込みは D-27 のとおりです。input に `tabindex=-1` と `aria-hidden`（view-start.js:45）、`.visually-hidden` で clip-path を使っています。Liquid Glass は該当しません（Web）。 |
| C バウハウス | 1 | ★B-1、B-2：満たす。どの画面も主操作は 1 つで、いちばん目立ちます。S1 診断を始める、S2 次へ、S3 完了、S7 やり直す、S8 書き出す（データなしでは読み込む）、S0 再読み込み（各 light と en のスクリーンショット）。S4 は仕様どおり同格の 2 つです。飾りは 0 です。<br>文字は 4 段、書体は 1 つで満たします（app.css の 1.5rem、1rem の 700 と 400、0.875rem）。<br>色の意味は一部ずれています（指摘 9）。<br>揃える線はリンクで 8 px ずれています（指摘 4、要修正）。 |
| D 使いやすさ | 2 | Nielsen の重大な違反はありません。<br>取り消せない操作には確認があります（dialog の 2 つの画面。初期フォーカスは cancel、Escape で `settings.delete` に戻る：keyboard-tour-chromium.log）。<br>エラーの文言は「何が起きたか」と「どうするか」の組です（S0_error_invalidData、S8_import_error_version、S2_error_storage）。<br>日付が変わる場面の知らせの抜けは要修正です（指摘 3）。 |
| E 状態 | 0 | ★全画面の 7 つの状態：満たさない（G3）。仕様の 13 行 × 7 列は G1 r2 から変わらず、そろっています。しかし、実際の画面の通常の状態の 4 通りが S6 と S0 loading で欠けています（指摘 1、重大）。<br>ほかの状態（エラー、空、権限を断られた、一部だけ読めた）は light ですべてあります。S2 の 2 つのエラー、S3 の 2 つのエラーと上限、S4 のエラー、S8 のデータなし、途中、notPersisted、読み込みエラー 2 種、S9 の 0、S10 の空です。<br>日付が変わる場面の文言キーがありません（指摘 3）。 |
| F アクセシビリティ | 1 | ★コントラスト：満たす。4 通りの全部の組を自分で計算しました。文字の最小は 6.29（success、ライト）、枠の最小は 5.33（border、ライト）です。app.css の 16 進の値はすべて tokens.md にあります（差は空集合）。<br>★押せる範囲：満たす。CSS から計算しました。`.btn` と `.link` は min-height と min-width が 2.75rem（44 px）、`summary` と `.choice` は min-height が 2.75rem です。radio は label 全体が押せる範囲です。ブラウザの中で実寸は測っていません。AC-17 の受け入れテストは、押せることだけを確かめています。<br>★アイコンだけの操作：該当なし。アイコンは 0 個で、aria-label も 0 件です（grep）。<br>そのほか：リンクには下線があります。AX5 では nav が 2 行目に落ち、申告のボタンは縦に積まれます（`S3_task.today_ax5.png`、`S10_history_ax5.png`）。reduced-motion で 0 ms、forced-colors で枠を保ちます（app.css）。ダイアログの AX5 の証拠と、axe の incomplete の記録が足りません（指摘 2、7）。 |
| G 一貫性 | 1 | 色はトークンの値だけです（上の差は空集合）。<br>同じ働きの副操作のボタンの幅がそろっていません（指摘 5）。エラーの枠のトークンが使われていません（指摘 6）。 |
| H 文言 | 2 | 日英：ja と en が 145 キーずつで、design 7 の表と一字一句同じです（差 0：python）。英語はすべて en の画面で確かめました。<br>ボタンは動詞です。<br>英語が長い文言は、S3 の en で Not today と 12 minutes が切れていません。未確認の 3 つは提案 12 です。<br>見える文字は名前の先頭に入っています。aria-label は使わず、ボタンの文字がそのまま名前です。 |

- 合計：11 / 16 点です。0 点のカテゴリが 1 つ（E）あり、★の未達が 1 つあります（E の G3 のスクリーンショット）。合格の線（★をすべて満たし、0 点がなく、13 点以上）を満たしません。
- 直す順番：指摘 1 と 2（verifier の撮り直し）で E は 2 点、F も上がる見込みです。指摘 4〜6（backend-engineer）で C と G も 2 点に戻れば、最大 16 点です。

### 第一印象（スクリーンショットだけを見て、何の画面で主な操作はどれかを 1 文で）と仕様の比較
- S0 error：保存データが読めないと伝え、再読み込みさせる画面です。仕様と合います。
- S1：3 問に答えれば今日の学習が出ると説明し、「診断を始める」を押させる画面です。合います。iOS の案内があるときは、主操作が最初の画面の外に出ます。D-10 の仕様どおりです。
- S2：質問に 1 つ答えて「次へ」を押す画面です。合います。
- S3：今日の課題 1 件を読んで「完了」を押す画面です。合います。
- S4：役に立ったかを答える画面です。合います。
- S5、S6：今日は終わりと伝える画面です。合います。
- S7：課題が尽きたと伝え、やり直させる画面です。合います。
- S8：データを書き出す画面です。合います。
- S9：記録の値を並べ、スクリーンショットで送らせる画面です。合います。
- S10：過去の課題と申告の一覧です。合います。

### Nielsen 5（エラーの予防）と 9（エラーからの回復）
- S0：5 削除は確認を通ります（`S0_error_dialog_delete_light.png`）。9 再読み込み、壊れたデータのファイル保存、削除があります。保存先が使えないときは、直し方と再読み込みを出します。
- S1：5 取り消せない操作はありません。9 読み込みに失敗すると、ボタンの直下に理由と直し方を出し、データは変えません（`S1_standalone_import_error_light.png`）。
- S2：5 未選択では進みません（`S2_error_required_light.png`）。9 保存に失敗しても選択を保ち、主操作の直上にやり直しのボタンを出します（`S2_error_storage_light.png`）。
- S3：5 申告の前に注記があり、完了は塗り、ほかは枠のボタンです。9 自動保存に失敗すると textarea の直下にエラーとやり直しを出し、入力を保ちます（`S3_error_storage_answer_light.png`）。日付が変わった後の操作だけ、回復の手がかりがありません（指摘 3）。
- S4：5 該当なし。9 保存に失敗したら、選んだ答えを保ってやり直せます（`S4_error_storage_light.png`）。
- S5、S6、S9：表示だけで、5 と 9 は該当なしです。
- S7：5 該当なし。9 やり直しへ進め、「やめる」で S7 に戻れます。
- S8：5 削除と置き換えには確認があり、初期フォーカスは「やめる」です。9 読み込みに失敗すると、理由と直し方を出し、データは変えません（`S8_import_error_version_light.png`、`S8_import_error_schema_light.png`）。
- S10：5 該当なし。9 0 件のときは「今日の課題へ」を出します。
- ダイアログ：5 初期フォーカスは「やめる」です。9 置き換えの保存に失敗すると、ダイアログの中でやり直せます（exploration/R5_04_import_error.png）。

### 依頼の見てほしい点への答え
1. **全画面と全状態、要素、文言、色、44 px**：文言は全件一致です。色はトークンだけです。44 px は CSS からの計算で満たします。欠けているのは S6 と S0 loading の 4 通りです（指摘 1）。仕様との差は指摘 4、5、6、9、10、11 です。
2. **ダーク、ax5、英語、幅 320**：127 枚すべてで scrollWidth は clientWidth と同じでした（index.tsv）。重なりも切れもありません。長いインラインコード（`S3_task.today_backend-beginner-005_w320.png` の orders = db.query(…)）は折り返しています。ダイアログの ax5 だけ、証拠が足りません（指摘 2）。
3. **エラーと注意**：どれも問題の近くに文字で出て、やり直しの一手があります。永続化の注意は仕様どおりです（評価は指摘 8）。
4. **フォーカス**：AC-18 は両方のブラウザで outline 3 px です。キーボードの一巡は両方のブラウザで最後まで届きました。ダイアログの初期フォーカスは cancel で、Escape で呼び出し元に戻ります（keyboard-tour-*.log）。ダイアログの外の BODY に出るのはブラウザの枠へのフォーカスで、後ろの要素には止まりません。verifier の判断を確かめました。
5. **P-1、P-2**：開いてから操作 0 回で S3 が出て、重なる要素は 0 です（AC-31、`S3_task.today_light.png`）。答えの欄は課題の画面の中にあり、自動で保存されます。毎日の手間を増やす要素は見つかりませんでした。例外は日付をまたぐ場面です（指摘 3）。
6. **headless で persist() が false になる件**：見た目は適切で、毎日の経路の外にあります。中身が古くなる点は指摘 8 です。

## 証拠
- 対象：feat/001-daily-learning、HEAD f01a6ee。実装は e13d68f から変わっていません（`git diff --stat e13d68f HEAD -- backend/public backend/scripts` は空）。design/ は 1870161（r5）のままです。
- G3 で撮り直してほしいスクリーンショット（足りない組）：
  - `S6_task.skipped_too_hard_{dark,ax5,en}.png`（too_hard は levelHint を含むのでこれを選びます。webkit は light だけで足ります）
  - `S0_loading_{dark,ax5}.png`（en は日英併記なので、撮るかは任意です）
  - ダイアログ 2 つの ax5：文字を 200% にしてから開き、表示域だけを撮ります。初期フォーカスの「やめる」が見えていることを確かめます。
- 読んだファイル：
  - docs/prd/001-daily-learning.md（1〜370 行）
  - design/001-daily-learning.md（全行）、design/001-daily-learning/screens.md、design/tokens.md
  - docs/verification/001-daily-learning/verification.md（全行）
  - docs/reviews/001-daily-learning-G1-design-reviewer-r2.md、docs/org/gates.md、docs/templates/review-report.md
  - backend/public/app.css（全行）、js/dom.js、js/view-settings.js:1-92、js/view-start.js（抜き書き）、js/main.js（persist の行）
  - backend/tests/acceptance/tests/ac17-ac18-ac27-a11y.spec.mjs:75-100、tools/screenshots.mjs（撮り方の行）
  - evidence/keyboard-tour-chromium.log
- 開いたスクリーンショット（パスは docs/verification/001-daily-learning/evidence/ から）：
  - screenshots/ の S1_diagnosis.start_light、S1_diagnosis.start_ax5、S1_addToHomeScreen_light、S1_standalone_import_error_light、S0_loading_light、S0_error_invalidData_light
  - S2_question_1_ax5、S2_question_1_en、S2_error_required_light、S2_error_storage_light
  - S3_task.today_light、S3_task.today_dark、S3_task.today_ax5、S3_task.today_en、S3_task.today_backend-beginner-005_w320、S3_task.today_external_light、S3_error_storage_answer_light、S3_answer_limit_light
  - S4_task.rate_light、S5_task.done_en、S6_task.skipped_too_hard_light、S7_task.exhausted_en
  - S8_settings_light、S8_settings_noData_light、S8_import_error_version_light、S9_settings.stats_en、S10_history_light、S10_history_ax5
  - dialog_settings.delete.confirm_light、dialog_settings.delete.confirm_ax5、dialog_settings.import.confirm_dark
  - screenshots/webkit/S2_question_2_light、exploration/R3_02_done_after_midnight.png
- 実行したコマンドと結果：
  - `git log --diff-filter=A --format='%h %ci %s' -- design/001-daily-learning-research.md design/001-daily-learning.md` → 0d83baf 2026-10-30 07:35:08（仕様）、854cf47 2026-10-30 07:18:12（調査）。調査の log は 854cf47 の 1 件だけです。
  - `grep -cE '^\| R-[0-9]+' …research.md` → 26。URL か確認日のない R → 0。`comm -23`（仕様にあって調査にない R）→ 空。
  - 決定表の python → 29 行で、R か原則の欠けは [] です。
  - 文言の python（ja.json と en.json を design 7 の表と比べる）→ ja 145、en 145、表 145。片方にしかないキーは 0、文字の違いは 0 です。
  - コントラスト（WCAG の式。ライト / ダーク / 上げる・ライト / 上げる・ダーク）：
    - text/bg 16.48 / 15.29 / 21.0 / 21.0、sec/bg 7.0 / 8.93 / 13.58 / 15.91
    - primary/bg 6.7 / 8.89 / 9.84 / 12.21、onPrimary/primary 6.7 / 8.24 / 9.84 / 12.21
    - border/bg 5.33 / 5.57 / 21.0 / 21.0、focus/bg 6.7 / 8.89 / 9.84 / 12.21
    - success/bg 6.29 / 10.43 / 9.95 / 14.28、warning/bg 7.48 / 11.36 / 10.7 / 15.25、error/bg 6.57 / 7.84 / 9.39 / 11.83
    - :active の入れ替え bg/text 16.48 / 15.29 / 21 / 21、bg/error 6.57 / 7.84 / 9.39 / 11.83
    - overlay（#808080 / #090909 / #808080 / #000000）とダイアログの地 3.95 / 1.06 / 3.95 / 1.0、ダイアログの枠 1.35 / 5.92 / 5.32 / 21.0。どの設定でも、地か枠のどちらかで 3:1 以上です。
  - app.css の 16 進の色と tokens.md の差（python）→ set()。`grep -c "shadow\|gradient" app.css` → 0。aria-label は 0 件、svg と img は 0 件です。
  - index.tsv：全 127 行で scrollWidth と clientWidth が同じです。normal の 4 通りがあるのは S0_error_invalidData、S1、S2 q1、S3、S4、S5、S7、S8、S9、S10、ダイアログ 2 つです。S6 と S0_loading は light だけです。
  - axe：`ls axe/*.json | wc -l` → 91。violations の合計 0、incomplete の color-contrast（serious）が 6 ファイルで 1 ノードずつです（JSON は件数だけ）。screenshots-run.log:123 は「axe：91 画面」です。
  - `grep -n "aria-invalid\|border-strong" app.css js/*.js` → app.css:28 の定義だけです。
  - `grep -n persist js/*.js` → main.js:341-355（1 回だけ求めて device.persistGranted に保存）、:476（S8 はその値を見る）。
- 開いた URL：https://web.dev/articles/persistent-storage （2026-11-03）。Chrome は確認を出さずに判断し、利用の度合い、インストールやブックマーク、通知の許可で決めます。「A denied request can be retried later」とあります。`persisted()` で今の状態を読めます。
- 未検証（★以外）：
  - ダイアログの AX5 で主操作が見えて届くか（指摘 2）
  - 押せる範囲のブラウザの中での実寸（CSS からの計算で★は満たすとしました）
  - 実機の Safari と Chrome での persist() の返事と、注意の出方（G4）
  - 英語が長い 3 つの文言の置き場所（提案 12）
  - axe の incomplete 6 ノードの中身（指摘 7）
- 書いたファイル：なし。

## 記録（指揮役が保存するときに書き足す）
- 関門：G3
- 判定した役：design-reviewer
- 回：r1
- 対象：feat/001-daily-learning（f01a6ee。実装は e13d68f、design は 1870161）
- 日付：2026-11-03
