# デザイン仕様 001-daily-learning：診断と今日の学習（今日の一手）

- 対象の PRD：docs/prd/001-daily-learning.md（r5、G0 承認済み。AC-1〜AC-32）
- 調査：design/001-daily-learning-research.md（この仕様より先に書いた。コミット 854cf47）。方向性は案A「一枚の紙」
- 書いた役：designer　日付：2026-10-30（r3。r2 は G1 r1 の design-reviewer と tech-lead の指摘を反映。r3 は G1 r2 の design-reviewer の提案 1〜4 と、契約（contracts/data.md、identifiers.md）で確定した事項との整合。直した箇所の一覧は 11）
- 図：design/001-daily-learning/screens.md（文字で描いた画面の図）
- トークン：design/tokens.md（色、文字、余白。この仕様はトークンの名前だけを使う）
- 原則の番号 B-1〜B-6 は .claude/skills/craft-designer/SKILL.md にある。
- 読み替え：ブラウザだけで動く Web アプリなので、型の「標準部品（SwiftUI）」は「ネイティブの HTML 要素と WAI-ARIA の型」、「HIG の URL」は「WCAG 2.2 / WAI-ARIA APG / MDN の URL」、「accessibilityIdentifier」は「`data-testid`」、「VoiceOver のラベル」は「アクセシブルな名前（VoiceOver、TalkBack、NVDA が読む名前）」、「AX5」は「ブラウザの拡大 200%（幅 320 CSS px）と OS の文字サイズ最大」に読み替える。指揮役の裁定（2026-10-30）による。
- 文言キーの決まり：`<画面か領域>.<要素>[.<変種>]`。小文字の camelCase をドットでつなぐ。PRD が指定したキー（`home.standalone.import`、`task.external.badge`、`settings.stats.firstDayCompleted.yes` など）はそのまま使う。見える文字を持つ要素の `data-testid` はその文言キーと同じ。文字を持たない要素（入力欄、画面の入れ物、行、ダイアログ）の `data-testid` は 6 に書く。`.1`、`.2` で終わる子キーを持つキーはリストで、親キーはリストの入れ物（`<ol>`）に付ける。
- 状態名（ルート要素の `data-state`）：PRD の 10 個 `diagnosis.start`、`diagnosis.question`、`task.today`、`task.rate`、`task.done`、`task.skipped`、`task.exhausted`、`settings`、`settings.stats`、`history` に、殻の 2 個 `loading`、`error` を足した 12 個。ダイアログ（`settings.import.confirm`、`settings.delete.confirm`）と案内（`home.addToHomeScreen`、`home.standalone.import`）は状態を変えず、`data-testid` で見つける。

## 1. 画面の流れ
画面の番号：S1 `diagnosis.start`、S2 `diagnosis.question`、S3 `task.today`、S4 `task.rate`、S5 `task.done`、S6 `task.skipped`、S7 `task.exhausted`、S8 `settings`、S9 `settings.stats`、S10 `history`。殻：S0 `loading` / `error`。

```
[URL を開く] → S0 loading（JS が動くまで）
   判定順（契約 data.md の 4。上から順に調べ、最初に当てはまった行き先へ）：枠の中に入れられている → loading のまま（ADR 0005）／ 保存先が使えない → S0 error (2) ／ 読めない → S0 error (1) ／ 診断の途中 → S2 ／ なし → S1 ／ あり → 今日の状態（S3 / S5 / S6 / S7）。「あり」「途中」「なし」の定義は契約 data.md の 3（design-reviewer r2 の 2）
   ├ 保存データなし → S1 diagnosis.start
   │     ├ スタンドアロン表示（navigator.standalone === true か display-mode: standalone）
   │     │     → S1 に案内 home.standalone.import（読み込みの操作つき。保存データがない間は毎回）
   │     ├ iOS の Safari でスタンドアロンでない、かつ閉じた印がない
   │     │     → S1 に案内 home.addToHomeScreen（閉じると印を保存して二度と出ない）
   │     └ 「診断を始める」→ S2 ×3（1 / 3 → 2 / 3 → 3 / 3）→ 「診断を終える」
   │            → S3 task.today（1 件目）。初めて S3 を出した直後に navigator.storage.persist() を 1 回だけ呼ぶ（画面には何も出ない）
   ├ 診断の途中（初回の診断で、回答が 1〜2 問だけ保存されている。契約 data.md 3：「あり」ではなく `diagnosis.area` がある）→ S2 のまだ答えていない最初の質問。保存した回答は radio に戻す（tech-lead r1 M2）。nav は初回の S2 と同じ（「設定」だけ）
   ├ 保存データあり、今日まだ課題を出していない
   │     ├ 出せる課題がある → S3 task.today
   │     └ ない → S7 task.exhausted →「診断をやり直す」→ S2（1 / 3 から。「やめる」で S7 に戻る：design-reviewer r1 の 8）→ 終える → S3 か S7
   ├ 保存データあり、今日の課題を完了済み → S5 task.done
   ├ 保存データあり、今日の課題を申告済み（難しすぎ、簡単すぎ、今日はできない） → S6 task.skipped
   ├ 保存データが読めない（形式に合わない） → S0 error
   └ 保存先が使えない（localStorage の読み書きが例外を出す） → S0 error（`error.app.storageUnavailable.*`。tech-lead r1 P1）

S3 task.today
   ├ 「完了」→ S4 task.rate →「役に立った」「立たなかった」「今回は答えない」、または再読み込み → S5 task.done
   ├ 「難しすぎ」「簡単すぎ」「今日はできない」→ S6 task.skipped
   └ 答えの欄：最後の入力から 1 秒以内に保存（間隔は contracts/ で決める。案 300 ms）。pagehide と visibilitychange（hidden）でも保存する。同じ日に開き直すと復元（tech-lead r1 M1）

ヘッダーの nav：診断前（S1、初回の S2、保存データなしの S8）は「設定」→ S8 だけ。診断後のすべての画面（やり直しの S2 を含む。S7 か S8 から入った S2 は診断を終えた後なので、nav は「履歴」と「設定」）は「履歴」→ S10 と「設定」→ S8（design-reviewer r1 の 1、r2 の 3）。アプリ名 `app.name` → 上の判定順をやり直す：あり → 今日の状態（S3 / S5 / S6 / S7）、なし → S1、診断の途中 → S2（再読み込みと同じ行き先。design-reviewer r2 の 2、契約 data.md 4）
S8 settings
   ├ 「ファイルに書き出す」→ JSON をダウンロード（画面は変わらない。「書き出しました」の知らせ）
   ├ 「ファイルを読み込む」→ ファイルを選ぶ → 検査
   │     ├ 版が新しい、形式が違う → S8 に error.import.message（確認は出ない）
   │     ├ 保存データあり → ダイアログ settings.import.confirm →「置き換える」→ 置き換え → 今日の状態（S3 / S5 / S6 / S7）
   │     └ 保存データなし、または診断の途中（S1 の案内から、または S1 か初回の S2 の「設定」で来た S8 から読み込んだとき）→ 確認なしで置き換え（契約 data.md 7）→ 今日の状態
   ├ 「診断をやり直す」→ S2（1 / 3 から。「やめる」で S8 に戻る）→ 終える → 今日まだ出していなければ S3 か S7、出していれば元の状態（S3 / S5 / S6）のまま。新しい診断は明日から効く
   ├ 「統計を見る」→ S9 →「設定に戻る」→ S8
   ├ 「履歴を見る」→ S10
   ├ 「ホーム画面に追加する手順を見る」（iOS の Safari でスタンドアロンでないときだけ）→ S8 の中に home.addToHomeScreen を開く
   └ 「すべてのデータを削除」→ ダイアログ settings.delete.confirm →「削除する」→ S1（保存データなし）
翌日（端末の日付が変わった後の最初の読み込みか操作）→ S3（出せる課題がなければ S7）
```

## 2. 受け入れ条件と画面の対応
verifier はこの表から受け入れテストを書く。識別子の詳しい一覧は 6。

| AC | 画面（状態） | 操作と、テストが読む識別子 |
|---|---|---|
| AC-1 | S1 → S2 | S1 の `diagnosis.start.begin` を押す → S2 の `diagnosis.progress`（`data-question-index`、`data-question-total`=3）を読み、radio を選んで `diagnosis.next`（3 問目は `diagnosis.finish`）を押す。切り替えは同期（500 ms 以内） |
| AC-2 | S2 → S3 | `diagnosis.finish` を押す → `data-state="task.today"`、`[data-testid="task.today"]` の `data-task-area`、`data-task-level` |
| AC-3 | S3（と課題集の JSON） | 4 要素は `task.today.title`（h1）と、`<h2>` `task.why` / `task.how` / `task.goal` それぞれの直後の段落 `task.why.text` / `task.how.text` / `task.goal.text`、所要時間は `task.meta`（design-reviewer r1 の 3）。全件の検査は JSON に対して行う（画面の対応はスクリーンショットのみ） |
| AC-4 | 対応なし | 課題集の JSON の件数の検査。画面には出ない（S7 が尽きたときの表示） |
| AC-5 | S3 → S4 → S5 | `task.report.done` → `data-state="task.rate"` → `task.rate.helpful` か再読み込み → `data-state="task.done"`。再読み込みしても `task.done` |
| AC-6 | S3 | 翌日の読み込みで `data-state="task.today"`、`data-task-id` が履歴のどの行とも違う |
| AC-7 | S3 → S6、S10 | `task.report.tooHard` / `task.report.tooEasy` / `task.report.noTime` → `data-state="task.skipped"`。S10 の `[data-testid="history.row"]` の `data-report`、`data-task-id` |
| AC-8 | S3 | 翌日の S3 の `data-task-level` |
| AC-9 | S4 → S5、S10 | `task.rate.helpful` / `task.rate.notHelpful` / `task.rate.close` / 再読み込み → `task.done`。S10 の行の `data-helpful` |
| AC-10 | S7 → S2 | `data-state="task.exhausted"`、`task.exhausted.message`、`task.exhausted.redo` → S2 → 同じ領域と段階 → `task.exhausted` |
| AC-11 | S2（エラー） | 2 問目で `diagnosis.next` → 保存の失敗 → `error.storage.message`、`error.storage.retry`。`data-question-index`=2 のまま、radio の `checked` が保たれる → `error.storage.retry` → 3 問目 |
| AC-12 | S1〜S6 | オフラインで AC-1、AC-2、AC-5、AC-7、AC-9 と同じ操作。送信 0 件（画面は通常と同じ。5 のオフライン列） |
| AC-13 | S3 → S5、S8 | persist() の拒否を注入 → 完了 → 再読み込み → `task.done`。S8 に `settings.storage.notPersisted` と `settings.export` |
| AC-14 | S8 → S2 → S3、S10 | `settings.redo` → S2 → 別の領域 → `diagnosis.finish` → S3 の `data-task-area`。S10 の行が 3 件のまま |
| AC-15 | S0 → S3 | ルートの `data-debug-load-ms`（S3 を表示した時点で書く） |
| AC-16 | S8 → ダイアログ → S1 | `settings.delete` → `[data-testid="settings.delete.confirm"]` の `settings.delete.confirm.ok` → 再読み込み → `diagnosis.start` |
| AC-17 | S1、S3、S5、S7 | 幅 320 で scrollWidth、ellipsis 0 件（トークンの `overflow-wrap: anywhere`、ellipsis 不使用） |
| AC-18 | S1 → S2 → S3 → S4 → S5 | Tab / Shift+Tab / Enter / Space だけで `diagnosis.start.begin` → radio → `diagnosis.next` → `diagnosis.finish` → `task.report.done` → `task.rate.helpful`。`:focus-visible` の outline が 3 px（tokens の size.focus.width） |
| AC-19 | S8 | `settings.export` → ダウンロード（JSON）。`settings.export.done` の知らせ |
| AC-20 | S1 → S8（保存データなし）、または S1 の案内 | 保存データのないブラウザで S1 のヘッダーの `nav.settings` → S8（保存データなしの表示。読み込みが主操作）→ 隠した `<input type="file">`（`settings.import.file`。見えるボタンは `settings.import`）に setInputFiles → 検査 → 保存データなしなので確認なし → 今日の状態。S1 のスタンドアロンの案内から読むときは `home.standalone.importFile` に setInputFiles（design-reviewer r1 の 1、4） |
| AC-21 | S1、S8 | S1 の `[data-testid="home.addToHomeScreen"]` の中に `home.addToHomeScreen.steps`。`home.addToHomeScreen.close` → 再読み込みで出ない。S1 の `nav.settings` → S8（保存データなし）の `settings.homeScreen.open` で再び開く（診断の前でも行ける：design-reviewer r1 の 1）。偽装なしでは 0 回 |
| AC-22 | S1 | `home.standalone.import`（文）、`home.standalone.importButton`（読み込みの見えるボタン。テストは `home.standalone.importFile` に setInputFiles）、`diagnosis.start.begin`。`home.addToHomeScreen` は出ない。再読み込みで再び出る |
| AC-23 | S0 → S3 / S5 | オフラインで再読み込み → 3 秒以内に同じ `data-state`（と `data-task-id`）。画面は通常と同じ |
| AC-24 | S9 | `settings.stats.open` → `data-state="settings.stats"`。`data-stat-first-open-date`、`data-stat-issued`、`data-stat-completed`、`data-stat-first-day-completed`、`data-stat-days-completed-7d`、`data-stat-helpful`、`data-stat-rated`、`data-stat-too-hard`、`data-stat-no-time` を持つ `<dd>` と、同じ値の見える文字。真偽値は `settings.stats.firstDayCompleted.yes` / `.no` |
| AC-25 | S8（エラー） | 版が新しいファイルを選ぶ → `error.import.message` と `error.import.reason.version`。確認は出ない。履歴と状態は変わらない |
| AC-26 | S1（全画面） | locale en-US で S1 の文言が en と一致。キーの差 0 件（7 の表が日英の原本） |
| AC-27 | S1、S2、S3、S5、S7、S8 | axe-core で serious 以上 0 件（4.5:1 以上のトークン、ボタンとリンクの名前、radio の `<fieldset>`/`<legend>`、`<label>`） |
| AC-28 | S0（ルート）、S8 | ルートの `data-build-version`。S8 の `settings.version` に同じ値が見える。切り替えは Service Worker の仕事で画面には知らせを出さない（PRD 10） |
| AC-29 | 対応なし | 課題集の JSON の `mode`、`tools`、URL の検査。画面には出ない（S3 の印は AC-30） |
| AC-30 | S3 | `[data-testid="task.today"]` の `data-task-mode`、`task.external.badge`、`task.external.tools` の `<li>`。`in_app` では `task.external.badge` が 0 件 |
| AC-31 | S3、S5 | 操作 0 回で `data-state`。S3 に `task.today.title`、4 要素、`task.answer`、4 つの `task.report.*`。重なる要素（ダイアログ、`position: fixed`）が 0 件（ヘッダーは `position: static`。ダイアログは閉じたら DOM から外す。数え方は contracts/：tech-lead r1 P3） |
| AC-32 | S3、S8 | `task.answer` に入力 → 最後の入力から 1 秒以内に保存して `task.answer.saved` → 再読み込み → 同じ `data-task-id` と同じ内容。翌日は空。S8 の書き出しの `answer` |

対応なし：AC-4、AC-29（課題集の JSON だけを検査する AC で、画面の要素がない）。AC-3 は画面の 4 要素の場所だけ対応する。

## 3. 画面の仕事と主操作、標準部品
主操作は 1 画面に 1 つ（B-2）。標準部品はネイティブの HTML 要素と WAI-ARIA APG の型。ランドマーク（`<header>`、`<nav>`、`<main>`）は全画面で共通（https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/ 、2026-10-30 確認）。ヘッダーは `position: static`（固定しない。R-18、AC-31）で、アプリ名のリンク `app.name` と nav のリンク。nav は診断前（S1、初回の S2、保存データなしの S8。「保存データなし」は契約 data.md 3 の「なし」と「診断の途中」の両方）は `nav.settings` だけ、診断後（S3〜S7、診断済みの S8〜S10、S7 か S8 から入ったやり直しの S2）は `nav.history` と `nav.settings`（今いる画面には `aria-current="page"`。design-reviewer r2 の 3）。診断前から設定へ行けるのは、保存データのないブラウザでの読み込み（AC-20）と案内の再表示（AC-21）に要るため（design-reviewer r1 の 1）。

| 画面 | 仕事（1文） | 主操作 | 使う標準部品 | 標準から外れる所（本来の部品、理由、対応） |
|---|---|---|---|---|
| S0 殻（loading / error） | JS が動くまでの地を出し、保存データが読めないときに次の一手を出す | `error.app.reload`（再読み込み） | `<main>`、`<h1>`、`<p>`、`<noscript>`、`<button>` | なし |
| S1 diagnosis.start | 何が起きるかを 10 行以内で伝え、診断を始めさせる | `diagnosis.start.begin` | `<main>`、`<h1>`、`<p>`、`<button>`、案内は `<section aria-labelledby>`、手順は `<ol>`、スタンドアロンの読み込みは `<button>` + 隠した `<input type="file">` | ファイルの読み込み：本来は `<input type="file">` そのもの。理由：そのままでは「ファイルを読み込む」の文字を文言キーで出せず、他のボタンと形を揃えられない。対応：見える `<button>` が隠した input の `click()` を呼び、フォーカスと名前はボタンが持つ（9「ファイルの読み込みの部品」。design-reviewer r1 の 4）。案内は重ねず本文の一部として置く（ダイアログにしない。R-18、AC-31 の「重なる要素 0」と同じ考え） |
| S2 diagnosis.question | 1 問だけ見せて答えさせ、確定ごとに保存する | `diagnosis.next`（3 問目は `diagnosis.finish`） | `<form>`、`<fieldset>`、`<legend>`、`<input type="radio">`、`<label>`、`<button>`、進み具合は `<p>`、エラーは `<p role="alert">` | なし。選んだ時点では進まず、ボタンで確定する（WCAG 2.2 SC 3.2.2 On Input：選択で文脈を変えない） |
| S3 task.today | 今日の課題 1 件を、開いた瞬間に読める形で出し、答えを書かせ、申告させる | `task.report.done` | `<article>`、`<h1>`、`<p>`、`<span>`（印）、`<dl>`（道具）、`<h2>`+`<p>`（4 要素）、`<label>`+`<textarea>`、`<p role="status">`、`<button>` ×4 | なし |
| S4 task.rate | 完了の直後に、役に立ったかを 1 回だけ聞く | 答える（`task.rate.helpful` と `task.rate.notHelpful` を同格の副操作として並べ、どちらも勧めない） | `<main>`、`<h1>`、`<p>`、`<button>` ×3 | なし |
| S5 task.done | 今日は終わりだと言い切り、次の課題を見せない | `task.done.history`（履歴へのリンク。目立たせない） | `<main>`、`<h1>`、`<p>`、`<a>` | なし |
| S6 task.skipped | 今日は終わりだと言い切り、段階の規則を正直に伝える | `task.skipped.history` | `<main>`、`<h1>`、`<p>`、`<a>` | なし |
| S7 task.exhausted | 課題が尽きたことを隠さず伝え、診断のやり直しへ進ませる | `task.exhausted.redo` | `<main>`、`<h1>`、`<p>`、`<button>` | なし |
| S8 settings | データを守る操作（書き出し、読み込み）と、診断のやり直し、削除、記録への入口を 1 画面に置く | `settings.export`（保存データがないとき＝契約 data.md 3 の「なし」と「診断の途中」の両方では `settings.export` が出ないので `settings.import` を主操作にする。design-reviewer r1 の 1） | `<main>`、`<h1>`、`<section>`+`<h2>`、`<button>`、`<button>` + 隠した `<input type="file">`（読み込み）、`<dialog>`、`<a>`、`<p role="status">`、`<p role="alert">` | ファイルの読み込み：S1 と同じ型（本来の部品、理由、対応は S1 の行と 9。design-reviewer r1 の 4） |
| S9 settings.stats | 13 の指標と 1 対 1 の 9 つの値を、スクリーンショット 1 枚で送れる形で出す | `settings.stats.back` | `<main>`、`<h1>`、`<p>`、`<dl>`（`<dt>`/`<dd>`）、`<a>` | なし。グラフは使わない（色と 2 次元が増える。R-16） |
| S10 history | 出した課題と申告を新しい順に見せ、書いた答えを読み返せるようにする | `history.empty.action`（0 件のとき）/ 行の `history.row.answer`（答えの開閉） | `<main>`、`<h1>`、`<ol>`+`<li>`、`<details>`+`<summary>`、`<a>` | なし |
| ダイアログ settings.import.confirm / settings.delete.confirm | 取り消せない操作の前に、何が消えるかを見せて確かめる | `.ok`（取り消せない操作のボタン） | ネイティブの `<dialog>`（`showModal()` で開く。開くときに DOM に足し、閉じたら DOM から外す。dialog の役割と modal はネイティブが持つので属性を重ねて書かない。Escape で閉じる、閉じたら呼び出し元へフォーカスを戻す） | なし（R-20。重なる要素の数え方は contracts/：tech-lead r1 P3） |

## 4. 決定と根拠
| 決定 | 根拠（R-n） | 原則（URL か B-n） |
|---|---|---|
| D-1 初回は S1（説明 10 行以内と「診断を始める」1 つ）→ S2 ×3 → S3。2 回目以降は開いたら S3 / S5 / S6 / S7 で、説明も案内も挟まない | R-7（ルールの説明は 10 行未満）、R-2・R-3・R-4（競合は登録が先）、R-5（地図が先） | B-1、B-2。差をつける点 1 |
| D-2 診断は 1 画面 1 問、進み具合「質問 n / 3」、ネイティブの radio、確定はボタン | R-8（one thing per page）、R-21（radio の操作） | https://www.w3.org/WAI/ARIA/apg/patterns/radio/ 、https://www.w3.org/WAI/WCAG22/Understanding/on-input.html |
| D-3 S3 は題名を h1 にし、4 要素を h2 と段落で縦に並べ、申告 4 つは末尾。「完了」だけを塗りの主操作にし、他 3 つは枠の副操作 | R-6（1 日 1 つ）、R-16（320 px）、R-17（44 px） | B-1、B-2、B-3 |
| D-4 S5 と S6 は次の課題もストリークも見せず、1 文で終える。S5 は完了した課題の題名を 1 行だけ残す（Job の「最近学んだことを言える」のため） | R-6（spend only three minutes）、PRD 10（ストリーク非採用） | B-2。差をつける点 2 |
| D-5 答えの欄は課題の本文の下、申告の上に `<textarea>` を 1 つ。ラベルに「任意」。保存は最後の入力から 1 秒以内に黙って行い（pagehide と visibilitychange でも）、「保存しました」を `role="status"` で出す | R-19（status messages）、R-25（16 px）、R-26 | https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html 、B-1 |
| D-6 外で行う課題の印は、題名の直下に文字だけの印「外で行う」と、「要る道具」の定義リスト。色もアイコンも使わない | R-7（色は意味にだけ）、R-15（枠は 3:1） | https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html 、B-5 |
| D-7 空とエラーは「何が起きたか」+「次の一手のボタン」の 2 要素。読み込み中に「0 件」を出さない | R-9、R-10 | https://www.nngroup.com/articles/empty-state-interface-design/ 、B-1 |
| D-8 エラーは問題の近く（入力欄の直下、ボタンの直上）に文字で出し、入力を保ち、やり直しのボタンを添える。エラーの知らせは `role="alert"` | R-10（near the element、preserve input）、R-19 | https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html 、https://www.w3.org/WAI/ARIA/apg/patterns/alert/ |
| D-9 取り消せない操作（全削除、読み込みの置き換え）は `<dialog>` で確認し、何が消えるかを文で見せる。初期フォーカスは「やめる」 | R-20 | https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ 、https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html |
| D-10 ホーム画面の案内（AC-21）は S1 の説明と「診断を始める」の間に、本文の一部として置く。ダイアログや固定のバナーにしない | R-18（固定のバナーがフォーカスを隠す）、R-24 | https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html 、B-2 |
| D-11 統計は 9 つの値を `<dl>` で縦に並べ、ラベルは PRD 13 の指標の語。グラフも色も使わない。日付は ISO 8601（YYYY-MM-DD）で、`data-stat-*` と見える文字を同じ値にする | R-16、案A（研究 7） | B-1、B-5 |
| D-12 ダークモードは OS の設定に従い、独自の切り替えを置かない。`color-scheme: light dark` | R-22 | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme 、B-2 |
| D-13 動きは「保存しました」と `app.loading` の不透明度だけ。`prefers-reduced-motion: reduce` で 0 ms | R-23 | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion 、B-6 |
| D-14 本文 16 px、行間 1.6、14 px 未満なし、書体はシステムの sans-serif 1 つ、文字の段階は 4 つ | R-26、R-25 | https://design.digital.go.jp/foundations/typography/ 、B-4 |
| D-15 色は地 1 つ、文字 2 つ、主操作 1 色、意味色 3 つ（成功、注意、エラー）、枠、フォーカスだけ。すべて 3 通りの値（ライト、ダーク、上げる）を tokens に持ち、比を 9 に書く | R-13（カラフルさの好み）、R-14、R-15 | https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html 、B-5 |
| D-16 押せる範囲は 44 × 44 CSS px 以上（主操作、申告、設定の操作、radio のラベル）。単独のリンクは上下に space.3 の内側と `min-width: 44px` で 44 × 44 にする（tokens 4） | R-17 | https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html |
| D-17 フォーカスの枠は 3 px の `outline` と 2 px の `outline-offset`、色は color.focus | R-15 | https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html |
| D-18 幅 320 px で横スクロール 0：要素は常に縦に積み、申告の副操作 3 つは `flex-wrap` で折り返す。`text-overflow: ellipsis` を使わない | R-16 | https://www.w3.org/WAI/WCAG22/Understanding/reflow.html 、B-3 |
| D-19 文言はです・ます、絵文字と感嘆符なし、ボタンは動詞。完了の直後の 1 文だけ労い（事実の言い方）。英語は同じ調子で動詞始まり | R-11、R-12（性格語） | https://www.nngroup.com/articles/tone-of-voice-dimensions/ 、B-1 |
| D-20 アイコンを使わない（0 個）。意味は文字と枠で伝える。閉じるボタンも文字「閉じる」 | R-7（絵文字は読み上げに向かない）、R-2（busy の不満） | https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html 、B-2 |
| D-21 リンクは下線を必ず付ける（色だけで区別しない） | R-7 | https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html |
| D-22 S10 の行の答えは `<details>`/`<summary>` で畳む（長い答えで一覧が崩れない。キーボードで開閉できる） | R-16 | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details |
| D-23 権限（保存の永続化）は画面で求めず、初めて S3 を出した直後に `persist()` を 1 回だけ呼ぶ。断られたら S8 に注意と「書き出す」を置く | R-9（次の一手）、PRD 11 の冒頭 | B-1 |
| D-24 読み込みの失敗は、選んだファイルのそば（読み込みのボタンの直下）に「読めなかった」+「理由と直し方」の 2 文。確認は出さない | R-10 | https://www.nngroup.com/articles/error-messages-scoring-rubric/ |
| D-25 `forced-colors: active` では色の値を持たず、枠と下線で意味を保つ（印は枠、リンクは下線、エラーは文字） | R-15 | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors |
| D-26 S3 の申告（完了、難しすぎ、簡単すぎ、今日はできない）に数秒の取り消しを置かない。予防は事前の注記 `task.report.note` と、主操作（塗り）と副操作（枠）の形と文言の違い（D-3）で行う。理由：(1) AC-5 と AC-7 の Then は申告の直後にその日の状態が確定し「再読み込みしても変わらない」ことで、数秒の猶予はこの読み方を変える。(2) 取り消しの知らせとボタンは S4 / S6 に重ねる要素になり、B-2 と D-10（重ねない）に反する。(3) 申告は法的・金銭的な入力ではなく、間違いの影響は 1 日 1 件で、段階は同じ申告が 2 回続いたときだけ動く（AC-8）ので、1 回の押し間違いで段階は変わらない。(4) 毎日の主操作に確認を足すと「手早い」に反する（design-reviewer r1 の 7） | R-6（1 日 1 つ、3 分で終える）、R-10（予防の文は問題の近くに） | https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html 、B-2 |
| D-27 ファイルの読み込みは S1 と S8 で同じ型：見える `<button>`（副操作の形。保存データなしの S8 では主操作の形）が、隠した `<input type="file">` の `click()` を呼ぶ。input は `tabindex="-1"` と `aria-hidden="true"` でフォーカスと読み上げの順から外し、フォーカスの枠と名前はボタンが持つ。テストは input に setInputFiles する（9） | R-17（押せる範囲）、R-15（フォーカスの枠） | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file 、https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html 、B-6 |
| D-28 ホバーと押した瞬間の見た目は tokens 4 の決まりだけ（ホバーは下線、押した瞬間は塗りと文字の入れ替え）。新しい色も transition も足さない | R-15（枠と状態の 3:1）、R-7（色は意味にだけ） | https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html 、B-5 |

## 5. 画面ごとの状態
該当しない状態は「なし」と理由。オフラインは全画面で通常と同じ（アプリは読み込み後に通信を使わない。AC-12。Service Worker で再読み込みも同じ：AC-23）。初めての訪問でキャッシュがないままオフラインのときは、ブラウザ自身のエラーページになり、アプリの画面はない（対応は範囲の外）。「一部だけ読めたとき」は、保存は 1 キーの JSON を全体で検査して通るか落ちるかの 2 択（部分の読み込みをしない。読み込むファイルも同じ）なので、S0 の error 以外は「なし」。「権限を断られたとき」は、求める権限が初めて S3 を出した直後の `persist()` だけ（7）なので、S3 と S8 以外は「なし」。design-reviewer r1 の 2 により、すべての「なし」に理由を書く。

| 画面 | 通常 | 空 | 読み込み中 | エラー | オフライン | 権限を断られたとき | 一部だけ読めたとき |
|---|---|---|---|---|---|---|---|
| S0 殻 | JS が動くまで `data-state="loading"`。ヘッダーのアプリ名だけ。1 秒たっても JS が動かなければ `app.loading` の文が不透明度で現れる（CSS だけ）。`<noscript>` に `app.noscript`。この 2 文は JS が動く前に出るので、HTML に日英を併記する（「読み込んでいます / Loading」の形。キーは 7 に残し、ビルドの手順で HTML に書き込む。tech-lead r1 P2） | なし（殻は内容を持たない） | 上の loading そのもの。スピナーも「0 件」も出さない（R-9） | (1) 保存データが形式に合わない → `data-state="error"`。`error.app.message`（何が起きたか）、`error.app.detail`（直し方）、主操作 `error.app.reload`、副操作 `error.app.exportRaw`（壊れたデータをそのままファイルに保存）、`error.app.delete`（確認ダイアログ `settings.delete.confirm` を経て削除 → S1）。PRD にない挙動なので 10 に書く（U-5）。(2) 保存先が使えない（localStorage の読み書きが例外を出す。Cookie とサイトデータを止めた設定など。どの設定で起きるかは未確認：tech-lead r1 P1）→ `data-state="error"`。`error.app.storageUnavailable.message` + `error.app.storageUnavailable.detail`、主操作 `error.app.reload` だけ。書き出すデータも削除するデータもないので `.exportRaw` と `.delete` は出さない | 通常と同じ | なし（この画面で求める権限はない。権限は S3 の `persist()` だけ：7） | 上のエラー (1) と同じ扱い（部分は読まない） |
| S1 diagnosis.start | ヘッダーはアプリ名と `nav.settings`（「履歴」は出さない。design-reviewer r1 の 1）。h1 `diagnosis.start.title`、`diagnosis.start.lead.1`〜`.3`、主操作 `diagnosis.start.begin`。スタンドアロンなら説明の直後に `<section>` `home.standalone.import` + 見えるボタン `home.standalone.importButton`（隠した `home.standalone.importFile` の `click()` を呼ぶ。9）。iOS の Safari（非スタンドアロン、閉じた印なし）なら説明と主操作の間に `<section>` `home.addToHomeScreen`（`.title`、`.why`、`.steps` の `<ol>` 4 項目、`.close`） | なし（この画面が「保存データなし」の表示そのもの） | なし（殻の loading の後に同期で出る） | 読み込み（スタンドアロンの案内から）の失敗 → `home.standalone.importButton` の直下に `error.import.message` + `error.import.reason.version` か `.schema`（`role="alert"`）。データは変わらない | 通常と同じ | なし（この画面で求める権限はない） | なし（保存は 1 キーの JSON を全体で検査し、部分の読み込みはしない） |
| S2 diagnosis.question | `diagnosis.progress`（質問 n / 3、`data-question-index`、`data-question-total`）、`<fieldset>` の `<legend>` `diagnosis.q1.legend` / `q2` / `q3`、radio（q1：`area.*` 6 つ、q2：`level.*` 3 つに説明 `level.*.desc`、q3：`years.*` 4 つ）、主操作 `diagnosis.next`（3 問目は `diagnosis.finish`）、副操作 `diagnosis.back`（2 問目以降）、やり直しのときだけ `diagnosis.cancel`（S8 から入ったら S8 へ、S7 から入ったら S7 へ戻る。design-reviewer r1 の 8）。初回の診断の途中（回答が 1〜2 問だけ保存されている）で開き直したときは、まだ答えていない最初の質問を出し、「前の質問へ」で戻った質問には保存した回答を radio の `checked` に戻す（tech-lead r1 M2）。ヘッダーの nav：初回の S2（途中の再開を含む）は `nav.settings` だけ、やり直しの S2（S7 か S8 から）は `nav.history` と `nav.settings`（design-reviewer r2 の 3）。nav で離れたときの下書きの扱いは U-7 | なし（選択肢は固定） | なし（殻の loading の後に同期で出る） | (1) 未選択で確定 → `<legend>` の直下に `error.diagnosis.required`（`role="alert"`）。進まない。(2) 保存の失敗（AC-11）→ 主操作の直上に `error.storage.message` と `error.storage.retry`。質問の番号と選択は保つ。`error.storage.retry` で保存に成功すれば次の質問へ | 通常と同じ | なし（この画面で求める権限はない） | なし（診断の途中の保存は「一部」ではなく途中の状態として通常の列で扱う：M2。壊れた JSON は S0 の error） |
| S3 task.today | `task.today.label`（今日の課題 YYYY-MM-DD）、h1 `task.today.title`、`task.meta`（領域 / 段階 / 所要時間）、`external` なら印 `task.external.badge` と `<dl>` `task.external.tools`（`<dd>` に道具の `<ul>`）、`<h2>` `task.why` / `task.how` / `task.goal` と段落、`<label>` `task.answer.label` + `task.answer.help` + `<textarea>`（`data-testid="task.answer"`）+ `task.answer.saved`（`role="status"`、保存の 150 ms 後に出て、次の入力で消える）、`task.report.note`、主操作 `task.report.done`、副操作 `task.report.tooHard` / `.tooEasy` / `.noTime`。答えの保存は最後の入力から 1 秒以内（間隔は contracts/ で決める。案 300 ms）で、`pagehide` と `visibilitychange`（hidden）のときにも保存する（tech-lead r1 M1）。長い題名は折り返す。答えの欄は上限 `answer.max`（10 に書く。contracts/ で決める）に達すると `task.answer.limit`。申告の取り消しは置かない（D-26） | なし（出せる課題がないときは S7 に移る） | なし（殻の loading の後に同期で出る。AC-15 は殻の loading の時間） | (1) 答えの自動保存の失敗 → textarea の直下に `error.storage.message`（`role="alert"`）+ `error.storage.retry`。入力は保つ。(2) 申告の保存の失敗 → 申告のボタン群の直上に同じ 2 つ。状態は S3 のまま、答えも保つ | 通常と同じ | 初めて S3 を出した直後の `persist()` が断られても S3 は変わらない（知らせは S8。AC-13） | なし（部分の読み込みはしない） |
| S4 task.rate | h1 `task.rate.title`、`task.rate.question`、`task.rate.helpful`、`task.rate.notHelpful`（同格の副操作）、文字のボタン `task.rate.close` | なし（固定の問いとボタン 3 つだけで、一覧を持たない） | なし（S3 の申告の直後に同期で描く） | 回答の保存の失敗 → ボタン群の直上に `error.storage.message` + `error.storage.retry`。選んだ答えは保つ | 通常と同じ | なし（この画面で求める権限はない） | なし（部分の読み込みはしない） |
| S5 task.done | h1 `task.done.title`、`task.done.message`、`task.done.task`（完了した課題の題名。text.small、color.text.secondary）、リンク `task.done.history` | なし（固定の 2 文と題名 1 行だけで、一覧を持たない） | なし（殻の loading の後、または S4 の直後に同期で描く） | なし（表示だけ。保存の読み取りに失敗すれば S0 の error） | 通常と同じ | なし（この画面で求める権限はない） | なし（部分の読み込みはしない） |
| S6 task.skipped | h1 `task.skipped.title`、`task.skipped.message`、too_hard / too_easy のときだけ `task.skipped.levelHint`、リンク `task.skipped.history` | なし（固定の文だけで、一覧を持たない） | なし（殻の loading の後、または S3 の申告の直後に同期で描く） | なし（表示だけ。保存の読み取りに失敗すれば S0 の error） | 通常と同じ | なし（この画面で求める権限はない） | なし（部分の読み込みはしない） |
| S7 task.exhausted | h1 `task.exhausted.message`、`task.exhausted.detail`、主操作 `task.exhausted.redo`（→ S2。「やめる」で S7 に戻る） | この画面が「課題 0 件」の空の表示そのもの（何が起きたか + 次の一手） | なし（殻の loading の後に同期で描く。課題集は配布物に入っていて通信しない） | なし（表示だけ。保存の読み取りに失敗すれば S0 の error） | 通常と同じ | なし（この画面で求める権限はない） | なし（部分の読み込みはしない） |
| S8 settings | h1 `settings.title`。節「データ」：`settings.data.note`、（断られたときだけ）`settings.storage.notPersisted`、主操作 `settings.export`、`settings.export.done`（`role="status"`）、`settings.import.note`、見えるボタン `settings.import`（隠した `settings.import.file`（`<input type="file" accept=".json,application/json">`）の `click()` を呼ぶ。9）。節「診断」：`settings.diagnosis.current`、`settings.redo`、`settings.redo.note`。節「ホーム画面」（iOS の Safari で非スタンドアロンのときだけ）：`settings.homeScreen.open` → 同じ場所に `home.addToHomeScreen` を開く。節「記録」：`settings.stats.open`、`settings.history.open`。節「削除」：`settings.delete`（取り消せない操作のボタン）。末尾：`settings.version`、`settings.privacy`（単独のリンク。44 × 44） | 保存データがないとき（S1 か初回の S2 の `nav.settings` から来たとき。契約 data.md 3 の「なし」と「診断の途中」の両方でこの表示を使う）：ヘッダーの nav は「設定」だけ。節「データ」は `settings.data.note`、`settings.import.note`、`settings.import` だけを出し、`settings.import` を主操作の形（塗り）にする（`settings.export` が出ないため。B-2。design-reviewer r1 の 1）。節「ホーム画面」（iOS の Safari）と末尾（版、プライバシー）は出す。書き出し、診断、記録、削除は出さない（する事がない。B-1。「診断の途中」でも同じ：書き出す記録も統計もまだなく、途中の回答は S2 の「前の質問へ」で直せるので、やり直しと削除を置く理由がない）。「診断の途中」で読み込むと確認なしで置き換わる（契約 data.md 7。失うのは 1〜2 問の選択だけで、`settings.import.note` が置き換わると伝えている）。定義は契約 data.md 3（あり＝`diagnosis.completedOn` があるか `history` が 1 行以上、途中＝「あり」でなく `diagnosis.area` がある、なし＝それ以外） | なし（ファイルの検査は同期で、数 KB なら一瞬。大きさの上限は contracts/） | (1) 読み込み：`settings.import` の直下に `error.import.message` + `error.import.reason.version` / `.schema`（`role="alert"`）。確認は出ない。データは変わらない。(2) 書き出し・削除の保存の失敗 → その操作の直下に `error.storage.message` + `error.storage.retry` | 通常と同じ | `persist()` を断られたとき：`settings.storage.notPersisted`（color.warning。エラーの見た目にしない：R-10）を `settings.export` の直上に出す。ファイル選択を取り消したとき：何も起きない（フォーカスはボタンのまま） | なし（部分の読み込みはしない。読み込むファイルも全体で検査して通るか落ちるかの 2 択） |
| S9 settings.stats | h1 `settings.stats.title`、`settings.stats.today`（今日 YYYY-MM-DD）、`<dl>` 9 行（`settings.stats.firstOpenDate` … `.noTime`。6 の表の順）、`settings.stats.note`、リンク `settings.stats.back` | 診断直後で課題 0 件：値は 0 と初めて開いた日（「0」は本当の 0 なので出す。読み込み中の偽の 0 ではない） | なし（保存から同期で計算して描く） | なし（表示だけ。保存の読み取りに失敗すれば S0 の error） | 通常と同じ | なし（この画面で求める権限はない） | なし（部分の読み込みはしない） |
| S10 history | h1 `history.title`、`<ol>` に新しい順の `<li>`（`data-testid="history.row"`、`data-task-id`、`data-date`、`data-report`、`data-helpful`）。行の中：日付（YYYY-MM-DD、text.small）、題名、`report.*`、done のときだけ `helpful.*`、答えがあれば `<details>` `history.row.answer`。件数が多くても全件を 1 列で出す（28 日で 28 行、1 年で 365 行。分けない） | 0 件：`history.empty` + 主操作 `history.empty.action`（今日の課題へ） | なし（履歴は保存から同期で読んで描く。365 行でも段階的には読まない） | なし（表示だけ。保存の読み取りに失敗すれば S0 の error） | 通常と同じ | なし（この画面で求める権限はない） | なし（部分の読み込みはしない） |
| ダイアログ settings.import.confirm | `.title`、`.summary`（ファイルの中身：履歴 n 件、初めて開いた日）、`.body`、`.ok`（取り消せない操作のボタン）、`.cancel`（初期フォーカス）。開くときに DOM に足し、閉じたら外す（tech-lead r1 P3） | なし（文とボタン 2 つだけで、一覧を持たない） | なし（ファイルの要約は開く前に計算済みで、開くのは同期） | 置き換えの保存の失敗 → ダイアログの中に `error.storage.message` + `error.storage.retry` | 通常と同じ | なし（ダイアログで求める権限はない） | なし（部分の読み込みはしない） |
| ダイアログ settings.delete.confirm | `.title`、`.body`、`.ok`、`.cancel`（初期フォーカス）。開くときに DOM に足し、閉じたら外す | なし（文とボタン 2 つだけで、一覧を持たない） | なし（開くのは同期で、読むデータがない） | 削除の失敗 → 同上 | 通常と同じ | なし（ダイアログで求める権限はない） | なし（部分の読み込みはしない） |

## 6. 要素と識別子
受け入れテストが使う。`data-testid` は 7 の文言キーと同じ名前（文字を持たない要素はここで決める）。ルート要素（`<html>` か `<body>`。tech-lead が決める）は `data-state`、`data-build-version`、`data-debug-load-ms` を持つ。

| 画面 | 要素 | data-testid（または属性） | アクセシブルな名前（読み上げ） |
|---|---|---|---|
| 共通 | ルート | `data-state`、`data-build-version`、`data-debug-load-ms`（S3 を表示した時点で書く） | — |
| 共通 | ヘッダーのアプリ名（リンク） | `app.name` | 「今日の一手」 |
| 共通 | nav のリンク | `nav.history`、`nav.settings`（診断前は `nav.settings` だけ。design-reviewer r1 の 1） | 「履歴」「設定」（今いる画面は aria-current） |
| S0 | 読み込みの文、noscript、エラーの文と操作 | `app.loading`、`app.noscript`、`error.app.message`、`error.app.detail`、`error.app.storageUnavailable.message`、`error.app.storageUnavailable.detail`、`error.app.reload`、`error.app.exportRaw`、`error.app.delete` | 文言のとおり |
| S1 | 題名、説明、主操作 | `diagnosis.start.title`、`diagnosis.start.lead.1`〜`.3`、`diagnosis.start.begin` | 「診断を始める」 |
| S1 | スタンドアロンの案内 | `<section>` は `home.standalone`（`aria-labelledby` で `home.standalone.import` を指す）、文 `home.standalone.import`、見えるボタン `home.standalone.importButton`（`<button>`）、隠した `<input type="file">` は `home.standalone.importFile`（`aria-hidden`、テストは setInputFiles） | 「ファイルを読み込む」（ボタン。input は読み上げの順に入らない） |
| S1、S8 | ホーム画面の案内 | `<section>` は `home.addToHomeScreen`（`aria-labelledby` で `.title`）、`home.addToHomeScreen.title`、`.why`、`<ol>` `.steps`、`<li>` `.steps.1`〜`.4`、`.close` | 「閉じる」 |
| S2 | 進み具合 | `diagnosis.progress`（`data-question-index`、`data-question-total`） | 「質問 1 / 3」 |
| S2 | 質問と選択肢 | `<fieldset>` は `diagnosis.question`、`<legend>` は `diagnosis.q1.legend` / `q2` / `q3`。radio の `<input>` は `area.backend` … `years.gte5`（値のキー。`value` は contracts/ の ID）。q2 の説明は `level.beginner.desc` 等 | legend の文 + 選択肢の文（例：「初級 基本は知っているが、実務では人に聞きながら進める」） |
| S2 | 操作とエラー | `diagnosis.next`、`diagnosis.finish`、`diagnosis.back`、`diagnosis.cancel`、`error.diagnosis.required`、`error.storage.message`、`error.storage.retry` | 文言のとおり |
| S3 | 課題の入れ物 | `<article>` は `task.today`（`data-task-id`、`data-task-area`、`data-task-level`、`data-task-mode`） | — |
| S3 | 課題の文 | `task.today.label`、`task.today.title`（h1）、`task.meta`、`task.external.badge`、`<dl>` `task.external.tools`（`<dt>` が `task.external.tools.label`、`<dd>` の中の `<ul>` の `<li>` が `task.external.tools.item`。契約 identifiers.md 3 と同じ構造）、`<h2>` `task.why` / `task.how` / `task.goal` と段落 `task.why.text` / `task.how.text` / `task.goal.text` | 見出しの文、本文 |
| S3 | 答えの欄 | `<label>` `task.answer.label`、補助 `task.answer.help`（`aria-describedby`）、`<textarea>` `task.answer`、`task.answer.saved`（`role="status"`）、`task.answer.limit` | 「答え（任意）」+ 補助の文 |
| S3 | 申告 | `task.report.note`、`task.report.done`、`task.report.tooHard`、`task.report.tooEasy`、`task.report.noTime` | 「完了」「難しすぎ」「簡単すぎ」「今日はできない」 |
| S4 | 文と操作 | `task.rate.title`、`task.rate.question`、`task.rate.helpful`、`task.rate.notHelpful`、`task.rate.close` | 「役に立った」「立たなかった」「今回は答えない」 |
| S5 | 文とリンク | `task.done.title`、`task.done.message`、`task.done.task`、`task.done.history` | 「履歴を見る」 |
| S6 | 文とリンク | `task.skipped.title`、`task.skipped.message`、`task.skipped.levelHint`、`task.skipped.history` | 「履歴を見る」 |
| S7 | 文と操作 | `task.exhausted.message`（h1）、`task.exhausted.detail`、`task.exhausted.redo` | 「診断をやり直す」 |
| S8 | 節と操作 | `settings.title`、`settings.data.title`、`settings.data.note`、`settings.storage.notPersisted`、`settings.export`、`settings.export.done`、`settings.import.note`、`settings.import`（見える `<button>`）、`settings.import.file`（隠した `<input type="file">`。`aria-hidden`、テストは setInputFiles）、`settings.diagnosis.title`、`settings.diagnosis.current`、`settings.redo`、`settings.redo.note`、`settings.homeScreen.title`、`settings.homeScreen.open`、`settings.records.title`、`settings.stats.open`、`settings.history.open`、`settings.delete.title`、`settings.delete`、`settings.version`、`settings.privacy`、`error.import.message`、`error.import.reason.version`、`error.import.reason.schema` | 「ファイルに書き出す」「ファイルを読み込む」「診断をやり直す」「統計を見る」「履歴を見る」「すべてのデータを削除」 |
| S8 | 読み込みの確認 | `<dialog>` `settings.import.confirm`（`aria-labelledby` で `.title`）、`.title`、`.summary`、`.body`、`.ok`、`.cancel` | 「置き換える」「やめる」 |
| S8 | 削除の確認 | `<dialog>` `settings.delete.confirm`、`.title`、`.body`、`.ok`、`.cancel` | 「削除する」「やめる」 |
| S9 | 値 | `settings.stats.title`、`settings.stats.today`、`<dt>` はラベルのキー、`<dd>` は同じキー + `.value`：`settings.stats.firstOpenDate.value`（`data-stat-first-open-date`）、`.issued.value`（`data-stat-issued`）、`.completed.value`（`data-stat-completed`）、`.firstDayCompleted.value`（`data-stat-first-day-completed`。文は `.yes` / `.no`）、`.daysCompleted7d.value`（`data-stat-days-completed-7d`）、`.helpful.value`（`data-stat-helpful`）、`.rated.value`（`data-stat-rated`）、`.tooHard.value`（`data-stat-too-hard`）、`.noTime.value`（`data-stat-no-time`）、`settings.stats.note`、`settings.stats.back` | `<dt>` の文 + 値 |
| S10 | 行 | `history.title`、`<ol>` `history.list`、`<li>` `history.row`（`data-task-id`、`data-date`、`data-report`、`data-helpful`）、行の中：`history.row.date`、`history.row.taskTitle`、`report.done` / `.tooHard` / `.tooEasy` / `.noTime` / `.none`、`helpful.yes` / `.no` / `.unanswered`、`<details>` の `<summary>` `history.row.answer`、答えの本文 `history.row.answerText`、空：`history.empty`、`history.empty.action` | 「答えを見る」（details は開閉の状態も読む） |

## 7. 文言
です・ます、絵文字と感嘆符なし、ボタンは動詞。英語は plain、direct、動詞始まり（調査 5）。プレースホルダーは `{name}` で、数の複数形は ICU の `{n, plural, one {…} other {…}}`（日本語は複数形がないので数だけ）。日付は ISO 8601（YYYY-MM-DD）を両言語で使う（`data-date`、`data-stat-first-open-date` と見える文字を同じ値にするため。AC-7、AC-24）。課題集の本文と `tools` は日本語のみ（PRD Q4）で、ここには含めない。この表が ja と en の文言ファイルの原本（AC-26 の「片方にしかないキー 0 件」）。文字がデータから来る要素の `data-testid`（`task.today.title`、`task.why.text`、`task.how.text`、`task.goal.text`、`task.external.tools.item`、`history.row.taskTitle`、`history.row.answerText`、`history.row.date`、`settings.stats.*.value`）は文言キーではなく、6 の表だけにある。

| キー | 日本語 | 英語 | 使う場所 |
|---|---|---|---|
| app.name | 今日の一手 | 今日の一手 | ヘッダー（英語の表記は 10） |
| app.loading | 読み込んでいます | Loading | S0（1 秒後。HTML に「読み込んでいます / Loading」と日英を併記：tech-lead r1 P2） |
| app.noscript | このページは JavaScript が必要です。ブラウザの設定で JavaScript を有効にしてください。 | This page needs JavaScript. Turn on JavaScript in your browser settings. | S0（HTML に日英を併記：tech-lead r1 P2） |
| nav.history | 履歴 | History | ヘッダー |
| nav.settings | 設定 | Settings | ヘッダー |
| error.app.message | 保存データを読めませんでした。 | Saved data could not be read. | S0 error |
| error.app.detail | このブラウザに保存された「今日の一手」のデータが、壊れているか、この版では読めない形です。再読み込みしても直らない場合は、データをファイルに保存してから削除し、最初からやり直してください。 | The data saved in this browser is damaged or in a format this version cannot read. If reloading does not fix it, save the data to a file, delete it, and start over. | S0 error |
| error.app.reload | 再読み込み | Reload | S0 error（主操作） |
| error.app.exportRaw | 壊れたデータをファイルに保存 | Save the damaged data to a file | S0 error |
| error.app.delete | すべてのデータを削除 | Delete all data | S0 error（確認あり） |
| error.app.storageUnavailable.message | このブラウザでは保存を使えません。 | Storage is not available in this browser. | S0 error（保存先が使えない。h1） |
| error.app.storageUnavailable.detail | ブラウザの設定で、このサイトのデータの保存（Cookie とサイトデータ）が止められています。保存を許可してから再読み込みしてください。プライベートブラウズでも起きることがあります。 | Your browser settings block this site from saving data (cookies and site data). Allow it, then reload. This can also happen in private browsing. | S0 error（保存先が使えない） |
| diagnosis.start.title | 3 問に答えると、今日の学習が 1 つ出ます | Answer 3 questions to get today's task | S1 h1 |
| diagnosis.start.lead.1 | すでにコードを書いているエンジニア向けです。1 日 1 つ、15 分で終わる課題を出します。 | For engineers who already write code. One task a day, done in 15 minutes. | S1 |
| diagnosis.start.lead.2 | 登録はありません。入力したデータはこのブラウザの中だけに保存され、外には送りません。 | No sign-up. Your data stays in this browser and is never sent anywhere. | S1 |
| diagnosis.start.lead.3 | 難しすぎ・簡単すぎの申告が 2 回続くと、次の日から段階が変わります。 | Report a task as too hard or too easy twice in a row, and the level changes from the next day. | S1 |
| diagnosis.start.begin | 診断を始める | Start | S1 主操作 |
| home.standalone.import | 別のブラウザで入力したデータは、自動では引き継がれません。書き出したファイルがあれば、ここで読み込めます。 | Data entered in another browser is not carried over automatically. If you exported a file, you can import it here. | S1（スタンドアロン） |
| home.standalone.importButton | ファイルを読み込む | Import a file | S1（スタンドアロン） |
| home.addToHomeScreen.title | ホーム画面に追加してから始めることをおすすめします | We recommend adding this to your Home Screen before you start | S1、S8 |
| home.addToHomeScreen.why | Safari は 7 日間使わないと、このサイトの保存データを消すことがあります。ホーム画面に追加した「今日の一手」は、この対象になりません。 | Safari may delete this site's saved data after 7 days without use. A Home Screen copy of 今日の一手 is not affected. | S1、S8 |
| home.addToHomeScreen.steps.1 | 画面の下（iPad では上）の共有ボタンを押します。 | Tap the Share button at the bottom of the screen (top on iPad). | S1、S8（ol） |
| home.addToHomeScreen.steps.2 | 「ホーム画面に追加」を選び、「追加」を押します。 | Choose "Add to Home Screen", then tap "Add". | S1、S8（ol） |
| home.addToHomeScreen.steps.3 | ホーム画面の「今日の一手」を開いて、診断を始めます。 | Open 今日の一手 from your Home Screen and start the diagnosis. | S1、S8（ol） |
| home.addToHomeScreen.steps.4 | すでに Safari で診断した場合：Safari のデータは引き継がれません。Safari の「設定」で「ファイルに書き出す」を押し、ホーム画面の「今日の一手」の「設定」で「ファイルを読み込む」を押してください。 | If you already did the diagnosis in Safari: Safari's data is not carried over. In Safari, open Settings and tap "Export to a file"; then in the Home Screen copy, open Settings and tap "Import a file". | S1、S8（ol） |
| home.addToHomeScreen.close | 閉じる | Close | S1、S8 |
| diagnosis.progress | 質問 {n} / {total} | Question {n} of {total} | S2 |
| diagnosis.q1.legend | 伸ばしたい領域を 1 つ選んでください | Choose one area you want to grow in | S2 |
| diagnosis.q2.legend | {area}の今の段階に近いものを選んでください | Choose the level closest to where you are in {area} | S2 |
| diagnosis.q3.legend | 実務でコードを書いてきた年数を選んでください | How many years have you written code at work? | S2 |
| area.backend | バックエンド設計 | Backend design | S2、S3、S8 |
| area.frontend | フロントエンド | Frontend | 同上 |
| area.database | データベース | Databases | 同上 |
| area.infra | インフラとクラウド | Infrastructure and cloud | 同上 |
| area.testing | テストと品質 | Testing and quality | 同上 |
| area.git | Git とチーム開発 | Git and team development | 同上 |
| level.beginner | 初級 | Beginner | S2、S3、S8 |
| level.beginner.desc | 基本は知っているが、実務では人に聞きながら進める | I know the basics but ask others as I go at work | S2 |
| level.intermediate | 中級 | Intermediate | S2、S3、S8 |
| level.intermediate.desc | 実務の大半を 1 人で進められる | I can handle most work tasks on my own | S2 |
| level.advanced | 上級 | Advanced | S2、S3、S8 |
| level.advanced.desc | 設計を決め、人に教えている | I make design decisions and teach others | S2 |
| years.lt1 | 1 年未満 | Less than 1 year | S2 |
| years.1to3 | 1〜3 年 | 1 to 3 years | S2 |
| years.3to5 | 3〜5 年 | 3 to 5 years | S2 |
| years.gte5 | 5 年以上 | 5 years or more | S2 |
| diagnosis.next | 次へ | Next | S2 主操作 |
| diagnosis.finish | 診断を終える | Finish | S2 主操作（3 問目） |
| diagnosis.back | 前の質問へ | Back | S2 |
| diagnosis.cancel | やめる | Cancel | S2（やり直しのときだけ。S8 から入ったら S8、S7 から入ったら S7 に戻る） |
| error.diagnosis.required | 選択肢を 1 つ選んでください。 | Choose one option. | S2 |
| error.storage.message | 保存できませんでした。入力はそのまま残っています。 | Could not save. Your input is still here. | S2、S3、S4、S8、ダイアログ |
| error.storage.retry | もう一度保存する | Save again | 同上 |
| task.today.label | 今日の課題 {date} | Today's task {date} | S3 |
| task.meta | {area} / {level} / 所要時間 {minutes} 分 | {area} / {level} / {minutes, plural, one {# minute} other {# minutes}} | S3 |
| task.external.badge | 外で行う | Outside the browser | S3（external） |
| task.external.tools.label | 要る道具 | Tools you need | S3（external、dt） |
| task.why | なぜ今これか | Why this, now | S3 h2 |
| task.how | やり方 | How to do it | S3 h2 |
| task.goal | 完了の目安 | What done looks like | S3 h2 |
| task.answer.label | 答え（任意） | Your answer (optional) | S3 label |
| task.answer.help | 採点はしません。入力は自動で保存され、今日中なら開き直しても残ります。 | Not graded. Saved automatically; it stays if you come back today. | S3 |
| task.answer.saved | 保存しました | Saved | S3 status |
| task.answer.limit | 上限の {max} 文字に達しました。 | You have reached the limit of {max} characters. | S3 |
| task.report.note | 申告すると、今日はもう課題が出ません。 | After you report, no more tasks today. | S3 |
| task.report.done | 完了 | Done | S3 主操作 |
| task.report.tooHard | 難しすぎ | Too hard | S3 |
| task.report.tooEasy | 簡単すぎ | Too easy | S3 |
| task.report.noTime | 今日はできない | Not today | S3 |
| task.rate.title | 完了しました | Done | S4 h1 |
| task.rate.question | この課題は役に立ちましたか | Was this task useful? | S4 |
| task.rate.helpful | 役に立った | Useful | S4 |
| task.rate.notHelpful | 立たなかった | Not useful | S4 |
| task.rate.close | 今回は答えない | Skip | S4 |
| task.done.title | 今日の一手は終わりです | That's it for today | S5 h1 |
| task.done.message | 今日も前に進みました。次の課題は明日出ます。 | You moved forward today. The next task comes tomorrow. | S5 |
| task.done.task | 完了した課題：{title} | Completed: {title} | S5 |
| task.done.history | 履歴を見る | View history | S5 リンク |
| task.skipped.title | 今日はここまでです | That's it for today | S6 h1 |
| task.skipped.message | 次の課題は明日出ます。 | The next task comes tomorrow. | S6 |
| task.skipped.levelHint | 同じ申告が 2 回続くと、次の日から段階が変わります。 | If you give the same report twice in a row, the level changes from the next day. | S6（too_hard / too_easy） |
| task.skipped.history | 履歴を見る | View history | S6 リンク |
| task.exhausted.message | この領域と段階の課題は、すべて出しました | You have seen every task for this area and level | S7 h1 |
| task.exhausted.detail | 新しい課題は次の版で足します。それまでは、診断をやり直して別の領域か段階を選べます。 | New tasks will be added in the next version. Until then, you can redo the diagnosis and choose another area or level. | S7 |
| task.exhausted.redo | 診断をやり直す | Redo the diagnosis | S7 主操作 |
| settings.title | 設定 | Settings | S8 h1 |
| settings.data.title | データ | Data | S8 h2 |
| settings.data.note | 入力したデータはこのブラウザの中だけに保存され、外には送りません。別のブラウザや端末に移すには、ファイルに書き出して読み込みます。 | Your data is stored only in this browser and never sent anywhere. To move it to another browser or device, export it to a file and import it there. | S8 |
| settings.storage.notPersisted | このブラウザは保存の永続化を許可しませんでした。しばらく使わないとデータが消えることがあります。ファイルに書き出しておいてください。 | This browser did not allow persistent storage. Your data may be deleted if you do not use the site for a while. Export it to a file to keep it. | S8（断られたとき。color.warning） |
| settings.export | ファイルに書き出す | Export to a file | S8 主操作 |
| settings.export.done | 書き出しました | Exported | S8 status |
| settings.import.note | 書き出したファイル（.json）を選びます。このブラウザのデータは、ファイルの内容に置き換わります。 | Choose an exported file (.json). The data in this browser will be replaced with the file's contents. | S8 |
| settings.import | ファイルを読み込む | Import a file | S8（見えるボタン。保存データがないときは主操作の形） |
| error.import.message | このファイルは読み込めませんでした。このブラウザのデータは変わっていません。 | This file could not be imported. The data in this browser has not changed. | S8、S1 |
| error.import.reason.version | ファイルの形式がこの版より新しいです。「今日の一手」を再読み込みして最新の版にしてから、もう一度読み込んでください。 | The file format is newer than this version. Reload 今日の一手 to get the latest version, then try again. | S8、S1 |
| error.import.reason.schema | 「今日の一手」が書き出したファイルではないか、内容が壊れています。「ファイルに書き出す」で作った .json ファイルを選んでください。 | This is not a file exported by 今日の一手, or its contents are damaged. Choose a .json file created with "Export to a file". | S8、S1 |
| settings.import.confirm.title | ファイルの内容で置き換えますか | Replace your data with this file? | ダイアログ |
| settings.import.confirm.summary | ファイルの中身：履歴 {count} 件、初めて開いた日 {date} | In the file: {count, plural, one {# history entry} other {# history entries}}, first opened on {date} | ダイアログ |
| settings.import.confirm.body | このブラウザの診断の回答、履歴、答えは、ファイルの内容に置き換わります（結合はしません）。この操作は元に戻せません。 | Your diagnosis answers, history, and written answers in this browser will be replaced by the file's contents (not merged). This cannot be undone. | ダイアログ |
| settings.import.confirm.ok | 置き換える | Replace | ダイアログ |
| settings.import.confirm.cancel | やめる | Cancel | ダイアログ |
| settings.diagnosis.title | 診断 | Diagnosis | S8 h2 |
| settings.diagnosis.current | いまの領域：{area}、段階：{level} | Current area: {area}, level: {level} | S8 |
| settings.redo | 診断をやり直す | Redo the diagnosis | S8 |
| settings.redo.note | 今日の課題を出した後にやり直した場合、新しい診断は明日の課題から効きます。履歴は残ります。 | If you redo it after today's task was issued, the new diagnosis applies from tomorrow's task. Your history is kept. | S8 |
| settings.homeScreen.title | ホーム画面 | Home Screen | S8 h2（iOS の Safari） |
| settings.homeScreen.open | ホーム画面に追加する手順を見る | Show how to add to the Home Screen | S8 |
| settings.records.title | 記録 | Records | S8 h2 |
| settings.stats.open | 統計を見る | View stats | S8 |
| settings.history.open | 履歴を見る | View history | S8 |
| settings.delete.title | 削除 | Delete | S8 h2 |
| settings.delete | すべてのデータを削除 | Delete all data | S8（取り消せない操作） |
| settings.delete.confirm.title | すべてのデータを削除しますか | Delete all data? | ダイアログ |
| settings.delete.confirm.body | 診断の回答、履歴、答えがこのブラウザから消え、最初の画面に戻ります。この操作は元に戻せません。先に「ファイルに書き出す」で残しておくこともできます。 | Your diagnosis answers, history, and written answers will be removed from this browser, and you will return to the first screen. This cannot be undone. You can keep a copy first with "Export to a file". | ダイアログ |
| settings.delete.confirm.ok | 削除する | Delete | ダイアログ |
| settings.delete.confirm.cancel | やめる | Cancel | ダイアログ |
| settings.version | 版 {version} | Version {version} | S8 末尾 |
| settings.privacy | プライバシーについて | Privacy | S8 リンク（URL は 10） |
| settings.stats.title | 統計 | Stats | S9 h1 |
| settings.stats.today | 今日 {date} | Today {date} | S9 |
| settings.stats.firstOpenDate | 初めて開いた日 | First opened | S9 dt（値は契約 data.md 2 の `firstOpenDate`＝初回の診断の 1 問目を確定した日。文言は PRD 13 の指標の語のまま変えない：10 の「決まったこと」r3） |
| settings.stats.issued | 出した課題の件数 | Tasks issued | S9 dt |
| settings.stats.completed | 完了した件数 | Tasks completed | S9 dt |
| settings.stats.firstDayCompleted | 初めて開いた日に完了したか | Completed a task on the first day | S9 dt |
| settings.stats.firstDayCompleted.yes | 完了した | Yes | S9 dd |
| settings.stats.firstDayCompleted.no | 完了していない | No | S9 dd |
| settings.stats.daysCompleted7d | 直近 7 日に完了した日数 | Days with a completed task in the last 7 days | S9 dt |
| settings.stats.helpful | 「役に立った」の件数 | Rated useful | S9 dt |
| settings.stats.rated | 「役に立ったか」に答えた件数 | Rated (useful or not) | S9 dt |
| settings.stats.tooHard | 「難しすぎ」の件数 | Reported too hard | S9 dt |
| settings.stats.noTime | 「今日はできない」の件数 | Reported not today | S9 dt |
| settings.stats.note | この値は、このブラウザの記録から計算しています。外には送りません。報告するときは、この画面のスクリーンショットを送ってください。 | These values are calculated from the records in this browser and never sent anywhere. To report them, send a screenshot of this screen. | S9 |
| settings.stats.back | 設定に戻る | Back to settings | S9 リンク |
| history.title | 履歴 | History | S10 h1 |
| history.empty | まだ履歴はありません。課題を申告すると、ここに残ります。 | No history yet. Tasks you report will appear here. | S10 |
| history.empty.action | 今日の課題へ | Go to today's task | S10 主操作 |
| history.row.answer | 答えを見る | Show answer | S10 summary |
| report.done | 完了 | Done | S10 |
| report.tooHard | 難しすぎ | Too hard | S10 |
| report.tooEasy | 簡単すぎ | Too easy | S10 |
| report.noTime | 今日はできない | Not today | S10 |
| report.none | 申告なし | Not reported | S10（日付が変わった課題） |
| helpful.yes | 役に立った | Useful | S10 |
| helpful.no | 立たなかった | Not useful | S10 |
| helpful.unanswered | 未回答 | Not rated | S10 |

権限と確認の求め方：
- 保存の永続化（`navigator.storage.persist()`）：画面で理由を説明する事前の画面は置かない。初めて S3 を表示した直後に 1 回だけ呼ぶ（PRD 11 の冒頭）。ブラウザは多くの場合に確認を出さずに決める。断られたら S8 に `settings.storage.notPersisted` と「ファイルに書き出す」を置き、報酬で釣らない。
- ファイルの読み込み：見えるボタンが隠した `<input type="file">` の `click()` を呼び、ブラウザ標準の選択ダイアログだけを使う（9）。取り消したら何もしない。
- 通知、位置情報、カメラ：使わない。

## 8. 見た目
- 使うトークン（色、文字、余白）：design/tokens.md のすべて。色は color.bg、color.text、color.text.secondary、color.action.primary、color.action.onPrimary、color.border、color.focus、color.success、color.warning、color.error の 10 個だけ。文字は text.title、text.heading、text.body、text.small。余白は space.1〜space.6。
- 新しく足すトークン：tokens.md がこの機能で初版なので、すべて新規。意味の名前と、ライト、ダーク、上げる（ライト、ダーク）の値は tokens.md の 1 にあり、比は 9 の表。
- 使う SF Symbols の名前：なし。Web アプリでアイコンを 0 個にした（D-20）。印、状態、閉じるはすべて文字。
- 画面の並び（縦の線）：全画面で本文の列を size.content.max（640 px）に収めて中央に置き、要素の左端を列の左の線にそろえる（B-3）。左右の余白は space.4（幅 600 px 未満）か space.5。題名の上は space.6、節の間は space.5、段落の間は space.4、ボタンの間は space.3、ラベルと入力欄の間は space.2。
- 性格語が表れている場所（調査 5）：
  - ひとつ：S3 で画面に課題が 1 件だけあり、一覧も地図も進み具合もない。ヘッダーの nav はリンク 2 つだけ。S5 / S6 に次の課題を出さない。
  - 静か：地が 1 色で、カード、影、グラデーション、アイコン、絵文字がない（tokens 1、D-20）。動きは不透明度の 150 ms だけ（D-13）。色が付く所は次の一覧がすべて（design-reviewer r1 の 9）。
    - color.action.primary：主操作の塗り（`diagnosis.start.begin`、`diagnosis.next` / `.finish`、`task.report.done`、`task.exhausted.redo`、`settings.export`、保存データなしの S8 の `settings.import`、`history.empty.action`、`error.app.reload`）、リンクの文字、radio の `accent-color`。color.focus（同じ値）はフォーカスの枠。
    - color.success：`task.answer.saved`、`settings.export.done`。
    - color.warning：`settings.storage.notPersisted`、`home.addToHomeScreen.title`（案内の h2）。
    - color.error：エラーの文（`error.*`）とエラーのときの入力欄の枠、取り消せない操作のボタンの枠と文字（`settings.delete`、`error.app.delete`、`settings.delete.confirm.ok`、`settings.import.confirm.ok`）。
    - color.overlay：ダイアログの `::backdrop`。
    - これ以外は color.bg、color.text、color.text.secondary、color.border だけ。ホバーと押した瞬間も新しい色を足さない（tokens 4、D-28）。
  - 正直：S1 の `diagnosis.start.lead.2`（外に送らない）と `.3`（段階が変わる規則）、S7 の `task.exhausted.message`（尽きたと言い切る）、`home.standalone.import`（引き継がれない）、`settings.delete.confirm.body`（元に戻せない）、S9 の `settings.stats.note`（計算の出どころ）。
  - 手早い：S3 は開いて操作 0 回で題名が h1（AC-31）。S2 は 1 画面 1 問で確定は 1 ボタン。ボタンの文言はすべて動詞か 2〜6 文字の名詞（完了、次へ、閉じる）。
- 差をつける点が表れている場所（調査 6）：
  1. 課題そのものがホーム画面：S3 の初期表示。ヘッダー（アプリ名と nav）の直下に `task.today.label` と h1 `task.today.title`、続けて `task.why`。読み込みが終わった瞬間に題名と「なぜ今これか」が最初の画面に入る（幅 320 px、文字 100% で、題名から「なぜ今これか」の 2 行目までが初期表示に収まるように、ヘッダーの高さを 56 px 以内にする）。
  2. 「今日はここまで」と言い切る終わりの画面：S5 の h1 `task.done.title` と `task.done.message` の 2 行と、小さなリンク 1 つ。S4 は 1 問だけで `task.rate.close` で抜けられる。
- ホーム画面のアイコンと manifest（tech-lead r1 P4。U-13 として Takuma の決定待ち。置かない場合はこの項と U-13 を削る）：
  - 置くもの：`apple-touch-icon`（180 × 180 px の PNG 1 枚、10 KB 以下）と `manifest.webmanifest`（`name` と `short_name` は「今日の一手」、`display: standalone`、`start_url` と `scope` は `./`、`icons` は同じ PNG 1 枚）。どちらも初回転送 150 KB の中に数える。iOS は manifest の icons を使わず `apple-touch-icon` を読む（R-24）。
  - 絵柄の案（D-20「画面の中のアイコン 0 個」と案A「一枚の紙」に合う最小の案）：地は color.bg のライトの値（#FFFFFF）1 色、中央に文字「一」1 字を color.text のライトの値（#1F1F1F）、書体はシステムの sans-serif の 700、字の幅はアイコンの幅の 60%。角丸はシステムが付けるので描かない。影、枠、グラデーションなし。「一」はアプリ名「今日の一手」の 1 字で、性格語「ひとつ」（1 日 1 つ）をそのまま表す。ダークモードの別版は作らない（iOS のホーム画面アイコンは 1 枚）。
  - 置くと変わること：Android の Chrome も「ホーム画面に追加」でスタンドアロンになり、S1 の `home.standalone.import` が出る（AC-22 の判定 `display-mode: standalone` に含まれる）。
- 参考にした原則のページ（URL、2026-10-30 確認）：https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html 、https://www.w3.org/WAI/WCAG22/Understanding/on-input.html 、https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html 、https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html 、https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html 、https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html 、https://www.w3.org/WAI/ARIA/apg/patterns/alert/ 、https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/ 、https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast 、https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors 、https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details 、https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file（ファイルの読み込みの部品。D-27）、https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html（D-27）。調査にある R-14〜R-26 の URL も使う。HIG は本文が取れなかったので引用しない（調査 8 の末尾）。

## 9. アクセシビリティ
- いちばん大きい文字（ブラウザの拡大 200%、幅 320 CSS px、OS の文字サイズ最大）で並びを変える場所：
  - ヘッダー：アプリ名と nav のリンク 2 つは `flex-wrap` で、入らなければ nav が 2 行目に落ちる。
  - S3 の `task.meta`：1 行の文として折り返す（横並びの 3 列にしない）。申告の副操作 3 つは `flex-wrap` で、幅 480 px 未満と拡大時は 1 列に 1 つずつ縦に積む。主操作「完了」は常に列いっぱい。
  - S3 の `task.external.tools`：`<dt>` と `<dd>` を常に縦に積む。
  - S9 の `<dl>`：`<dt>` と `<dd>` を常に縦に積む（横並びの表にしない）。
  - S10 の行：日付、題名、申告、評価を縦に積む（横並びにしない）。
  - ダイアログ：幅は min(列の幅, 480 px)。ボタン 2 つは縦に積む（「やめる」が下）。
  - すべての要素の高さを固定しない（WCAG 2.2 SC 1.4.12 の行間 1.5、段落間 2 倍の上書きでも切れない）。
- 色だけで区別していないか：外で行う印は文字「外で行う」と枠。保存の知らせは文字「保存しました」。エラーは文字と `role="alert"`。リンクは下線。radio の選択はネイティブの印。主操作と副操作は塗りと枠の違いに加えて文言で区別する（WCAG 2.2 SC 1.4.1）。
- 動きを減らす設定、透明度を下げる設定のとき：`prefers-reduced-motion: reduce` で不透明度の変化を 0 ms にする（知らせは即時に出る）。半透明はダイアログの `::backdrop` だけで、`prefers-reduced-transparency: reduce` では不透明の color.bg と同じ地に枠線の見た目にする。`prefers-contrast: more` では tokens の「上げる」の値。`forced-colors: active` ではシステム色に任せ、印とボタンの枠、リンクの下線で意味を保つ（D-25）。
- VoiceOver（TalkBack、NVDA）の読み上げ順：DOM の順＝見た目の順。
  - S1：`<header>`（アプリ名 → 設定）→ `<main>`：h1 → 説明 3 段落 →（スタンドアロンの案内：文 → 読み込むボタン。隠した input は読み上げの順に入らない）→（ホーム画面の案内：見出し → 理由 → 手順 1〜4 → 閉じる）→ 診断を始める。
  - S2：ヘッダー → 進み具合「質問 1 / 3」→ `<legend>` → 選択肢（radio のラベル。q2 は段階名と説明を 1 つのラベルにする）→（エラー）→ 次へ → 前の質問へ →（やめる）。質問が切り替わったら `<main>` の先頭（進み具合）にフォーカスを移す。
  - S3：ヘッダー（アプリ名 → 履歴 → 設定）→ 今日の課題と日付 → h1 題名 → 領域 / 段階 / 所要時間 →（外で行う → 要る道具の一覧）→ h2 なぜ今これか → 本文 → h2 やり方 → 本文 → h2 完了の目安 → 本文 → ラベル「答え（任意）」+ 補助文 → textarea →（保存しました：フォーカスを奪わず `role="status"` で読む）→ 申告の注記 → 完了 → 難しすぎ → 簡単すぎ → 今日はできない。
  - S4：ヘッダー → h1 完了しました → 問い → 役に立った → 立たなかった → 今回は答えない。状態が変わったら h1 にフォーカスを移す。
  - S8：ヘッダー → h1 設定 → データ（注記 →（注意）→ 書き出す →（書き出しました）→ 読み込みの注記 → 読み込む →（エラー））→ 診断 → ホーム画面 → 記録 → 削除 → 版 → プライバシー。ダイアログは開いたら「やめる」にフォーカス、閉じたら呼び出したボタンに戻す。保存データなしのとき：ヘッダー（アプリ名 → 設定）→ h1 設定 → データ（注記 → 読み込みの注記 → 読み込む →（エラー））→（ホーム画面）→ 版 → プライバシー。
  - ファイルの読み込みの部品（S1 と S8 で同じ型。D-27。design-reviewer r1 の 4）：見える `<button>`（`home.standalone.importButton` / `settings.import`）が、隠した `<input type="file" accept=".json,application/json">`（`home.standalone.importFile` / `settings.import.file`）の `click()` を呼ぶ。input は視覚的に隠す（`position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%)`。`display: none` と `visibility: hidden` にはしない：MDN の `<input type="file">` のページは、この 2 つを支援技術が「操作できない部品」と解釈するため見えない状態で残す例を示している。2026-10-30 確認。MDN の例は `<label>` を押し口にするが、label は Tab で止まらないので、この仕様では `<button>` と `click()` にする）。input に `tabindex="-1"` と `aria-hidden="true"` を付け、Tab 順と読み上げの順から外す。フォーカスは常にボタンにあり、`:focus-visible` の枠（3 px、color.focus）はボタンに出る（AC-18）。アクセシブルな名前は見えるボタンの文字「ファイルを読み込む」で、input には名前を付けない（読み上げの対象外）。input の `change` で検査を始め、失敗はボタンの直下に出す（D-24）。選択を取り消したら何も起きず、フォーカスはボタンのまま。テストは input の `data-testid` に setInputFiles する（`change` が発火する）。
  - 全画面で、見える文字がアクセシブルな名前の先頭に入る（WCAG 2.2 SC 2.5.3）。`aria-label` で見える文字と違う名前を付けない。
- 英語が長くなったとき（疑似言語の代わりに、英語の文言と、その 2 倍の長さの文字列で確かめる画面）：S3（申告の 4 ボタンと `task.meta`。英語「Not today」「Outside the browser」）、S8（設定の操作 7 つ。「Show how to add to the Home Screen」が最も長い）、S1（`home.addToHomeScreen.steps.4` の長文と「Import a file」）、ダイアログ（`settings.import.confirm.summary` の複数形）。どの画面もボタンの文字は折り返し可能（`white-space: normal`）で、幅は列いっぱいに広がるので切れない。
- 押せる範囲：`<button>`、radio の `<label>`、`<summary>`、単独の `<a>`（ヘッダーのアプリ名 `app.name`、`nav.history`、`nav.settings`、`task.done.history`、`task.skipped.history`、`settings.stats.open`、`settings.history.open`、`settings.stats.back`、`settings.privacy`）は 44 × 44 CSS px 以上（tokens の size.target.min。リンクは `display: inline-block`、上下 space.3 の内側、`min-width: 44px`：tokens 4）。文中のリンクはこの機能にはない（`settings.privacy` も独立した行の単独のリンクとして扱う。design-reviewer r1 の 5）。ヘッダーの高さは nav のリンクとアプリ名（どちらも約 50 px：16 px × 1.6 + space.3 × 2 = 49.6 px）を入れても 56 px 以内（8 の差をつける点 1。design-reviewer r2 の 1）。
- キーボード：Tab 順は DOM 順。`<dialog>` はフォーカスを閉じ込め、Escape で閉じる。`<details>` は Enter / Space で開閉。radio は矢印で移動し Space で選ぶ（R-21）。フォーカスの枠は 3 px の `outline` と 2 px の `outline-offset`（AC-18 の 2 px 以上）。

コントラスト（WCAG 2.2 の式で計算。独自の色の組ごと。小数 3 桁目を四捨五入して 2 桁（design-reviewer r1 の 6）。基準は 16 px の文字が 4.5:1 以上、24 px 以上か 18.5 px 以上の太字の文字と操作部品の枠が 3:1 以上：R-14、R-15）
| 前景（文字、アイコン、枠）と背景の組 | ライト | ダーク | コントラストを上げる（ライト / ダーク） |
|---|---|---|---|
| color.text on color.bg（本文、見出し、印の文字と枠） | 16.48:1 | 15.29:1 | 21.00:1 / 21.00:1 |
| color.text.secondary on color.bg（日付、注記） | 7.00:1 | 8.93:1 | 13.58:1 / 15.91:1 |
| color.action.primary on color.bg（主操作の塗りと枠、リンクの文字） | 6.70:1 | 8.89:1 | 9.84:1 / 12.21:1 |
| color.action.onPrimary on color.action.primary（主操作の文字） | 6.70:1 | 8.24:1 | 9.84:1 / 12.21:1 |
| color.border on color.bg（副操作のボタン、入力欄の枠） | 5.33:1 | 5.57:1 | 21.00:1 / 21.00:1 |
| color.focus on color.bg（フォーカスの枠。offset 2 px で地と接する） | 6.70:1 | 8.89:1 | 9.84:1 / 12.21:1 |
| color.success on color.bg（保存しました） | 6.29:1 | 10.43:1 | 9.95:1 / 14.28:1 |
| color.warning on color.bg（永続化の注意） | 7.48:1 | 11.36:1 | 10.70:1 / 15.25:1 |
| color.error on color.bg（エラーの文字と枠、削除のボタン） | 6.57:1 | 7.84:1 | 9.39:1 / 11.83:1 |
| 押した瞬間（`:active`）の入れ替え：color.action.primary on color.action.onPrimary、color.bg on color.text、color.bg on color.error | 6.70:1、16.48:1、6.57:1 | 8.24:1、15.29:1、7.84:1 | 上の行と同じ組の入れ替えなので同じ値（9.84 / 21.00 / 9.39、12.21 / 21.00 / 11.83） |
| color.overlay（黒 50%）を color.bg に重ねた地と、ダイアログの地 color.bg | 3.95:1 | 1.06:1 | 3.95:1 / 1.00:1 |
| color.overlay を重ねた地と、ダイアログの枠 color.border | 1.35:1 | 5.92:1 | 5.32:1 / 21.00:1 |
| （上 2 行：どの設定でも、地の差か枠のどちらかで境目が 3:1 以上。design-reviewer r1 の 11） | | | |
| radio | システム色（`color-scheme` と `accent-color` に従う） | 同左 | 同左 |

## 10. 決まっていないこと
Takuma か tech-lead に決めてほしいこと。仕様はここに書いた暫定で進める。
- U-1（Takuma、見た目）：主操作の色を青（color.action.primary = #1D4ED8 / ダーク #8AB4F8）に置いた。性格語「静か」に合う無彩色寄りの 1 色として選んだが、ブランドとして別の色がよければ tokens.md の 1 行を変えるだけで済む（比は計算し直す）。
- U-2（Takuma、見た目）：日付を両言語で ISO 8601（2026-11-01）にした。AC-24 の「見える文字と data-stat が同じ値」と `data-date` を一致させるため。日本語で「2026年11月1日」にしたい場合は、AC-24 の読み方（属性と見える文字の対応）を verifier と決め直す。
- U-3（Takuma）：英語表示のときのアプリ名。`app.name` と文中の名前は英語でも「今日の一手」のまま置いた。ローマ字（Kyou no Itte）や英語名が要るか。
- U-4（Takuma、見た目）：S5 に完了した課題の題名を 1 行残す（`task.done.task`）か、h1 と 1 文だけにするか。D-4 は残す側に置いた。
- U-5（tech-lead、PRD にない挙動）：保存データが形式に合わないときの S0 の error 状態（`error.app.*`。再読み込み、壊れたデータのファイル保存、削除）と、保存先が使えないときの変種（`error.app.storageUnavailable.*`。tech-lead r1 P1）。PRD の 10 の「保存の方式を後から変えてデータを失う」の手当てとして置いたが、PRD の AC にはない。tech-lead r1 の確定案は「採る。error にする条件は JSON.parse の失敗、スキーマ不一致、formatVersion が新しい、localStorage の例外」。確定は ADR。
- U-6（tech-lead）：答えの欄の文字数の上限 `answer.max`（localStorage の容量の都合。`task.answer.limit` の {max}）。
- U-7（tech-lead）：診断のやり直し（S8 → S2）の保存の仕方。初回は質問ごとに保存する（AC-11）が、やり直しの途中で「やめる」を押したときに元の診断が壊れないよう、やり直しは下書きに保存して「診断を終える」で確定する作りを求める。PRD の「回答は質問ごとに確定したときに保存する」は初回の規則として読んだ。
- U-8（tech-lead）：経験年数の 4 区分（`years.lt1`、`years.1to3`、`years.3to5`、`years.gte5`）と段階の表示名（初級 / 中級 / 上級）、領域の ID。PRD は区分の中身を決めていない。tech-lead r1 の確定案は仕様の値をそのまま ID にする（領域 backend / frontend / database / infra / testing / git、段階 beginner / intermediate / advanced、年数 lt1 / 1to3 / 3to5 / gte5）。文言キーの末尾はこれと同じなので、仕様の表記は変えない。確定は contracts/。
- U-9（pdm）：`settings.privacy` のリンク先（docs/support/ のプライバシーのページの URL）。G5 の前に決まるまでリンクは出さない。
- U-10（verifier、PRD の読み方）：AC-21 の状態の説明（PRD 11 の冒頭）は案内を「重ねて出す」と書くが、AC-21 の Then は「画面に案内がある」で足りるので、R-18 と AC-31 に合わせて重ねずに本文の一部として置いた（D-10）。テストは `[data-testid="home.addToHomeScreen"]` の存在で見る。
- U-11（verifier、識別子の名前）：PRD が仮に置いた `task-answer` を、他のキーと同じドット区切りの `task.answer` にした。tech-lead r1 の確定案も `task.answer`。確定は contracts/。
- U-12（Takuma、見た目）：radio のラベル全体を 44 px の高さにし、q2 の段階に 1 行の説明（`level.*.desc`）を付けた。説明は自己評価のぶれを減らすためだが、PRD の 3 問の文面は pdm と Takuma が最終的に決める。
- U-13（Takuma、見た目。tech-lead r1 P4）：ホーム画面のアイコン（`apple-touch-icon` 180 px の PNG、10 KB 以下）と manifest（`name`、`display: standalone`、`start_url` と `scope` は `./`）を置くか。置く場合の形と絵柄の案（白地に「一」1 字）は 8 に書いた。Takuma の決定待ち。置かない場合は 8 の項とこの U-13 を削り、iOS のアイコンはページの縮小画像のままになる。
- 決まったこと（r2 で閉じた）：申告の取り消しは置かない（D-26）。ファイルの読み込みの部品は S1 と S8 で同じ型（D-27）。ホバーと押した瞬間は tokens 4（D-28）。ダイアログの背景は color.overlay（tokens 1）。
- 決まったこと（r3 で閉じた。契約との整合）：
  - U-5、U-6、U-7、U-8、U-11 の確定先は contracts/（data.md、identifiers.md）と ADR。仕様の表記は契約と同じ（`answer.max` は 2000：data.md 10）。
  - `settings.stats.firstOpenDate`（「初めて開いた日」/「First opened」）の文言は変えない。契約 data.md 2 で値は「初回の診断の 1 問目を確定した日」になった（案内を閉じただけの日は数えない）が、(1) PRD 13 の指標と AC-24 の Given は「初めて開いた日」の語で書かれ、利用者が送る S9 のスクリーンショットをこの語で読む約束になっている。(2) 同じ語は `settings.stats.firstDayCompleted`（「初めて開いた日に完了したか」）と `settings.import.confirm.summary` にもあり、変えるなら 3 キーをそろえて PRD 13 の語も変えることになる。(3) D-1 の流れ（S1 → 診断）では、開いた日と 1 問目の日は同じ日で、違うのは案内を閉じて診断せずに去った人だけ。その人にとっても「使い始めた日」の意味で読める。英語「First opened」も同じ理由で残す。別の語（「始めた日」）がよければ Takuma の決定で 3 キーの文言だけを変える（キーと `data-stat-first-open-date` は変えない：ADR 0002）。

## 11. 変更の記録
### G1 r2 → r3（design-reviewer r2 の提案 1〜4 と、契約との整合）
| 指摘 | 直した所 |
|---|---|
| design-reviewer r2 の 1（提案。`app.name` の押せる範囲） | 9 の押せる範囲の列挙に `app.name` を足し、ヘッダーの高さの計算に含めた。tokens.md の 4「リンク」の括弧に `app.name` を足した |
| design-reviewer r2 の 2（提案。起動時の判定順） | 1 の流れの冒頭に判定順を 1 行（契約 data.md 4 のとおり：枠の中 → 保存先が使えない → 読めない → 診断の途中 → なし → あり。提案の「読めない → 保存先が使えない」とは前後が逆で、契約に従う）。アプリ名の行き先を「判定順をやり直す（途中は S2）」に揃えた。「あり / 途中 / なし」の定義を契約 data.md 3 に合わせた（1 の流れ、5 の S8） |
| design-reviewer r2 の 3（提案。やり直しの S2 の nav） | 1 の nav の行、3 の冒頭、5 の S2 を「初回の S2 は `nav.settings` だけ、やり直しの S2（S7 か S8 から）は `nav.history` と `nav.settings`」に。screens.md の S2 の図に注記 |
| design-reviewer r2 の 4（提案。確かめの欄） | 確かめの 1 行目を D-1〜D-28 に、4 行目を「文字と枠の組の最小は 5.33:1。color.overlay の組（1.06:1、1.35:1）は地か枠のどちらかで 3:1 以上」に |
| 契約 data.md 3、44（S8 の「保存データなし」の表示を「なし」と「途中」の両方で使う） | 採る。3 の S8 の主操作、5 の S8 の空、1 の流れ（読み込みの確認なし）、screens.md の S8（保存データなし）の見出しと末尾の文に明記。理由は 5 の S8 の空 |
| 契約 data.md 2（`firstOpenDate` の意味） | 文言は変えない。理由は 10 の「決まったこと（r3）」。7 の `settings.stats.firstOpenDate` の使う場所に意味を書いた。キーの総数は 145 のまま |
| 契約 identifiers.md 3（`task.external.tools` の構造） | 一致を確認（`<dl>` → `<dd>` → `<ul>` → `<li>`。5 の S3、screens.md の S3、tokens.md の 4）。6 の S3 の行に `<dd>` の中の `<ul>` の `<li>` と明記 |

### G1 r1 → r2
design-reviewer r2 と tech-lead が追跡するための一覧。行番号は r2 のこのファイル。

| 指摘 | 直した所 |
|---|---|
| design-reviewer 1（重大。S1 から設定に行けない） | 1 の流れ（nav の行と、保存データなしの読み込みの行）、2 の AC-20・AC-21・AC-22、3 の冒頭の文と S8 の主操作、5 の S1 の通常と S8 の空（読み込みを主操作に）、6 の nav の行、9 の S1 と S8 の読み上げ順。screens.md の S8（保存データなし）の図を追加 |
| design-reviewer 2（重大。理由のない「なし」12 セル） | 5 の全行。S4〜S7、S10、ダイアログ 2 つの空と読み込み中に理由を足し、権限と一部だけ読めたときの「なし」にも理由を足した（表の前の説明も） |
| design-reviewer 3（要修正。4 要素の形） | 2 の AC-3（`<dd>` → `<h2>` と段落）。tokens.md の 4「定義リスト」を統計と要る道具に限定し、「見出しと段落（課題の 4 要素）」の行を足した |
| design-reviewer 4（要修正。ファイル読み込みの部品） | 3 の S1・S8（本来の部品、理由、対応）、4 の D-27、5 の S1・S8、6 の S1・S8、7 の権限の文、9「ファイルの読み込みの部品」。tokens.md の 4 に「ファイルの読み込み」の行。screens.md の S1 と S8 |
| design-reviewer 5（要修正。リンクの押せる範囲） | 4 の D-16、9 の押せる範囲（`settings.privacy` を単独のリンクに）、tokens.md の 4「リンク」（上下 space.3、`min-width: 44px`） |
| design-reviewer 6（提案。注記） | 9 のコントラストの注記を「小数 3 桁目を四捨五入」に。値はそのまま |
| design-reviewer 7（提案。申告の取り消し） | 置かない。理由は 4 の D-26 |
| design-reviewer 8（提案。S7 からのやり直しの「やめる」） | 1 の流れ、5 の S2・S7、7 の `diagnosis.cancel` の使う場所（S7 に戻す） |
| design-reviewer 9（提案。色の使い所） | 8 の「静か」に色ごとの一覧（warning の案内の見出し、error の削除ボタンを含む） |
| design-reviewer 10（提案。ホバーと押した瞬間） | tokens.md の 4「ホバーと押した瞬間」、4 の D-28、9 のコントラストの表（入れ替えの組） |
| design-reviewer 11（提案。背景の値） | tokens.md の 1 に color.overlay、4「ダイアログ」を名前で参照。9 の表に重ねた地の比 |
| tech-lead M1（答えの保存の間隔） | 1 の流れ、2 の AC-32、4 の D-5、5 の S3 |
| tech-lead M2（診断の途中の行き先） | 1 の流れ、5 の S2 と S8（「保存データあり」の定義は契約） |
| tech-lead P1（保存が使えない） | 1 の流れ、5 の S0、6 の S0、7 に `error.app.storageUnavailable.message` / `.detail` を追加（143 → 145 キー）、10 の U-5 |
| tech-lead P2（殻の 2 文） | 5 の S0、7 の `app.loading` と `app.noscript` の使う場所（HTML に日英を併記。キーは残す） |
| tech-lead P3（ダイアログ） | 2 の AC-31、3 のダイアログの行、5 のダイアログ 2 行（開くときに足し、閉じたら外す。数え方は契約） |
| tech-lead P4（アイコンと manifest） | 8 の項と 10 の U-13（Takuma の決定待ち） |
| tech-lead A（U-8、U-11 の確定案） | 10 の U-5、U-8、U-11 に確定案を書いた。仕様の表記は変えていない（確定案と同じ） |

## 確かめ（提出前に designer が印を付ける。design-reviewer はこれを信じずに確かめる）
- [x] 調査が先にあり、決定表のすべての行に R-n と原則がある（R-n は調査に実在する）：D-1〜D-28。調査は 854cf47 でコミット済み
- [x] 全画面に、仕事、主操作1つ、使う標準部品がある（3 の表。S0〜S10 とダイアログ）
- [x] 全画面の7つの状態が埋まっている（5 の表。「なし」のすべてに理由がある：r2 で数えて 0 件の理由なし）
- [x] 押せる範囲が 44x44pt 以上（`app.name` と nav のリンクを含む）。コントラストが基準を満たし、独自の色の組に数字が3通りある（9 の表。文字と枠の組の最小は 5.33:1（color.border、ライト）。color.overlay を重ねた地とダイアログの組は 1.06:1 と 1.35:1 の値があるが、地か枠のどちらかで 3:1 以上になる設計で、表の注記のとおり）
- [x] AX5 での並びと、VoiceOver の読み上げ順が書いてある（9）
- [x] 性格語と差をつける点が、画面のどこに表れているか書いてある（8）
- [x] 文言が日英そろい、テストで使う要素に accessibilityIdentifier（data-testid）がある（6、7）
