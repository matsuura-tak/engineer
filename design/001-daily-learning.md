# デザイン仕様 001-daily-learning：診断と今日の学習（今日の一手）

- 対象の PRD：docs/prd/001-daily-learning.md（r5、G0 承認済み。AC-1〜AC-32）
- 調査：design/001-daily-learning-research.md（この仕様より先に書いた。コミット 854cf47）。方向性は案A「一枚の紙」
- 書いた役：designer　日付：2026-10-30
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
   ├ 保存データなし → S1 diagnosis.start
   │     ├ スタンドアロン表示（navigator.standalone === true か display-mode: standalone）
   │     │     → S1 に案内 home.standalone.import（読み込みの操作つき。保存データがない間は毎回）
   │     ├ iOS の Safari でスタンドアロンでない、かつ閉じた印がない
   │     │     → S1 に案内 home.addToHomeScreen（閉じると印を保存して二度と出ない）
   │     └ 「診断を始める」→ S2 ×3（1 / 3 → 2 / 3 → 3 / 3）→ 「診断を終える」
   │            → S3 task.today（1 件目）。初めて S3 を出した直後に navigator.storage.persist() を 1 回だけ呼ぶ（画面には何も出ない）
   ├ 保存データあり、今日まだ課題を出していない
   │     ├ 出せる課題がある → S3 task.today
   │     └ ない → S7 task.exhausted →「診断をやり直す」→ S2（1 / 3 から）→ 終える → S3 か S7
   ├ 保存データあり、今日の課題を完了済み → S5 task.done
   ├ 保存データあり、今日の課題を申告済み（難しすぎ、簡単すぎ、今日はできない） → S6 task.skipped
   └ 保存データが読めない（形式に合わない） → S0 error

S3 task.today
   ├ 「完了」→ S4 task.rate →「役に立った」「立たなかった」「今回は答えない」、または再読み込み → S5 task.done
   ├ 「難しすぎ」「簡単すぎ」「今日はできない」→ S6 task.skipped
   └ 答えの欄：入力の 1 秒後に保存（同じ日に開き直すと復元）

ヘッダーの nav（診断後のすべての画面）：「履歴」→ S10、「設定」→ S8。アプリ名 →今日の状態（S3 / S5 / S6 / S7）
S8 settings
   ├ 「ファイルに書き出す」→ JSON をダウンロード（画面は変わらない。「書き出しました」の知らせ）
   ├ 「ファイルを読み込む」→ ファイルを選ぶ → 検査
   │     ├ 版が新しい、形式が違う → S8 に error.import.message（確認は出ない）
   │     ├ 保存データあり → ダイアログ settings.import.confirm →「置き換える」→ 置き換え → 今日の状態（S3 / S5 / S6 / S7）
   │     └ 保存データなし（S1 の案内から読み込んだとき）→ 確認なしで置き換え → 今日の状態
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
| AC-3 | S3（と課題集の JSON） | 4 要素は `task.today.title`（h1）、`task.why`、`task.how`、`task.goal` の各 `<dd>`、所要時間は `task.meta`。全件の検査は JSON に対して行う（画面の対応はスクリーンショットのみ） |
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
| AC-20 | S8（または S1 の案内） | `settings.import` の `<input type="file">`（`data-testid="settings.import.file"`）に setInputFiles → 保存データなしなら確認なし → 今日の状態 |
| AC-21 | S1、S8 | S1 の `[data-testid="home.addToHomeScreen"]` の中に `home.addToHomeScreen.steps`。`home.addToHomeScreen.close` → 再読み込みで出ない。S8 の `settings.homeScreen.open` で再び開く。偽装なしでは 0 回 |
| AC-22 | S1 | `home.standalone.import`（文）、`home.standalone.importButton`（読み込み）、`diagnosis.start.begin`。`home.addToHomeScreen` は出ない。再読み込みで再び出る |
| AC-23 | S0 → S3 / S5 | オフラインで再読み込み → 3 秒以内に同じ `data-state`（と `data-task-id`）。画面は通常と同じ |
| AC-24 | S9 | `settings.stats.open` → `data-state="settings.stats"`。`data-stat-first-open-date`、`data-stat-issued`、`data-stat-completed`、`data-stat-first-day-completed`、`data-stat-days-completed-7d`、`data-stat-helpful`、`data-stat-rated`、`data-stat-too-hard`、`data-stat-no-time` を持つ `<dd>` と、同じ値の見える文字。真偽値は `settings.stats.firstDayCompleted.yes` / `.no` |
| AC-25 | S8（エラー） | 版が新しいファイルを選ぶ → `error.import.message` と `error.import.reason.version`。確認は出ない。履歴と状態は変わらない |
| AC-26 | S1（全画面） | locale en-US で S1 の文言が en と一致。キーの差 0 件（7 の表が日英の原本） |
| AC-27 | S1、S2、S3、S5、S7、S8 | axe-core で serious 以上 0 件（4.5:1 以上のトークン、ボタンとリンクの名前、radio の `<fieldset>`/`<legend>`、`<label>`） |
| AC-28 | S0（ルート）、S8 | ルートの `data-build-version`。S8 の `settings.version` に同じ値が見える。切り替えは Service Worker の仕事で画面には知らせを出さない（PRD 10） |
| AC-29 | 対応なし | 課題集の JSON の `mode`、`tools`、URL の検査。画面には出ない（S3 の印は AC-30） |
| AC-30 | S3 | `[data-testid="task.today"]` の `data-task-mode`、`task.external.badge`、`task.external.tools` の `<li>`。`in_app` では `task.external.badge` が 0 件 |
| AC-31 | S3、S5 | 操作 0 回で `data-state`。S3 に `task.today.title`、4 要素、`task.answer`、4 つの `task.report.*`。`role="dialog"`、`aria-modal`、`position: fixed` が 0 件（ヘッダーは `position: static`） |
| AC-32 | S3、S8 | `task.answer` に入力 → 1 秒後に `task.answer.saved` → 再読み込み → 同じ `data-task-id` と同じ内容。翌日は空。S8 の書き出しの `answer` |

対応なし：AC-4、AC-29（課題集の JSON だけを検査する AC で、画面の要素がない）。AC-3 は画面の 4 要素の場所だけ対応する。

## 3. 画面の仕事と主操作、標準部品
主操作は 1 画面に 1 つ（B-2）。標準部品はネイティブの HTML 要素と WAI-ARIA APG の型。ランドマーク（`<header>`、`<nav>`、`<main>`）は全画面で共通（https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/ 、2026-10-30 確認）。ヘッダーは `position: static`（固定しない。R-18、AC-31）で、アプリ名のリンク `app.name` と、診断後だけ `nav.history`、`nav.settings` のリンク（今いる画面には `aria-current="page"`）。

| 画面 | 仕事（1文） | 主操作 | 使う標準部品 | 標準から外れる所（本来の部品、理由、対応） |
|---|---|---|---|---|
| S0 殻（loading / error） | JS が動くまでの地を出し、保存データが読めないときに次の一手を出す | `error.app.reload`（再読み込み） | `<main>`、`<h1>`、`<p>`、`<noscript>`、`<button>` | なし |
| S1 diagnosis.start | 何が起きるかを 10 行以内で伝え、診断を始めさせる | `diagnosis.start.begin` | `<main>`、`<h1>`、`<p>`、`<button>`、案内は `<section aria-labelledby>`、手順は `<ol>` | なし。案内は重ねず本文の一部として置く（ダイアログにしない。R-18、AC-31 の「重なる要素 0」と同じ考え） |
| S2 diagnosis.question | 1 問だけ見せて答えさせ、確定ごとに保存する | `diagnosis.next`（3 問目は `diagnosis.finish`） | `<form>`、`<fieldset>`、`<legend>`、`<input type="radio">`、`<label>`、`<button>`、進み具合は `<p>`、エラーは `<p role="alert">` | なし。選んだ時点では進まず、ボタンで確定する（WCAG 2.2 SC 3.2.2 On Input：選択で文脈を変えない） |
| S3 task.today | 今日の課題 1 件を、開いた瞬間に読める形で出し、答えを書かせ、申告させる | `task.report.done` | `<article>`、`<h1>`、`<p>`、`<span>`（印）、`<dl>`（道具）、`<h2>`+`<p>`（4 要素）、`<label>`+`<textarea>`、`<p role="status">`、`<button>` ×4 | なし |
| S4 task.rate | 完了の直後に、役に立ったかを 1 回だけ聞く | 答える（`task.rate.helpful` と `task.rate.notHelpful` を同格の副操作として並べ、どちらも勧めない） | `<main>`、`<h1>`、`<p>`、`<button>` ×3 | なし |
| S5 task.done | 今日は終わりだと言い切り、次の課題を見せない | `task.done.history`（履歴へのリンク。目立たせない） | `<main>`、`<h1>`、`<p>`、`<a>` | なし |
| S6 task.skipped | 今日は終わりだと言い切り、段階の規則を正直に伝える | `task.skipped.history` | `<main>`、`<h1>`、`<p>`、`<a>` | なし |
| S7 task.exhausted | 課題が尽きたことを隠さず伝え、診断のやり直しへ進ませる | `task.exhausted.redo` | `<main>`、`<h1>`、`<p>`、`<button>` | なし |
| S8 settings | データを守る操作（書き出し、読み込み）と、診断のやり直し、削除、記録への入口を 1 画面に置く | `settings.export` | `<main>`、`<h1>`、`<section>`+`<h2>`、`<button>`、`<input type="file">`（`<label>` で包む）、`<dialog>`、`<a>`、`<p role="status">`、`<p role="alert">` | なし |
| S9 settings.stats | 13 の指標と 1 対 1 の 9 つの値を、スクリーンショット 1 枚で送れる形で出す | `settings.stats.back` | `<main>`、`<h1>`、`<p>`、`<dl>`（`<dt>`/`<dd>`）、`<a>` | なし。グラフは使わない（色と 2 次元が増える。R-16） |
| S10 history | 出した課題と申告を新しい順に見せ、書いた答えを読み返せるようにする | `history.empty.action`（0 件のとき）/ 行の `history.row.answer`（答えの開閉） | `<main>`、`<h1>`、`<ol>`+`<li>`、`<details>`+`<summary>`、`<a>` | なし |
| ダイアログ settings.import.confirm / settings.delete.confirm | 取り消せない操作の前に、何が消えるかを見せて確かめる | `.ok`（取り消せない操作のボタン） | `<dialog>`（`showModal()`、`role="dialog"`、`aria-modal="true"`、Escape で閉じる、閉じたら呼び出し元へフォーカスを戻す） | なし（R-20） |

## 4. 決定と根拠
| 決定 | 根拠（R-n） | 原則（URL か B-n） |
|---|---|---|
| D-1 初回は S1（説明 10 行以内と「診断を始める」1 つ）→ S2 ×3 → S3。2 回目以降は開いたら S3 / S5 / S6 / S7 で、説明も案内も挟まない | R-7（ルールの説明は 10 行未満）、R-2・R-3・R-4（競合は登録が先）、R-5（地図が先） | B-1、B-2。差をつける点 1 |
| D-2 診断は 1 画面 1 問、進み具合「質問 n / 3」、ネイティブの radio、確定はボタン | R-8（one thing per page）、R-21（radio の操作） | https://www.w3.org/WAI/ARIA/apg/patterns/radio/ 、https://www.w3.org/WAI/WCAG22/Understanding/on-input.html |
| D-3 S3 は題名を h1 にし、4 要素を h2 と段落で縦に並べ、申告 4 つは末尾。「完了」だけを塗りの主操作にし、他 3 つは枠の副操作 | R-6（1 日 1 つ）、R-16（320 px）、R-17（44 px） | B-1、B-2、B-3 |
| D-4 S5 と S6 は次の課題もストリークも見せず、1 文で終える。S5 は完了した課題の題名を 1 行だけ残す（Job の「最近学んだことを言える」のため） | R-6（spend only three minutes）、PRD 10（ストリーク非採用） | B-2。差をつける点 2 |
| D-5 答えの欄は課題の本文の下、申告の上に `<textarea>` を 1 つ。ラベルに「任意」。保存は黙って行い、「保存しました」を `role="status"` で出す | R-19（status messages）、R-25（16 px）、R-26 | https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html 、B-1 |
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
| D-16 押せる範囲は 44 × 44 CSS px 以上（主操作、申告、設定の操作、radio のラベル）。リンクは単独で置くとき上下に余白を足す | R-17 | https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html |
| D-17 フォーカスの枠は 3 px の `outline` と 2 px の `outline-offset`、色は color.focus | R-15 | https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html |
| D-18 幅 320 px で横スクロール 0：要素は常に縦に積み、申告の副操作 3 つは `flex-wrap` で折り返す。`text-overflow: ellipsis` を使わない | R-16 | https://www.w3.org/WAI/WCAG22/Understanding/reflow.html 、B-3 |
| D-19 文言はです・ます、絵文字と感嘆符なし、ボタンは動詞。完了の直後の 1 文だけ労い（事実の言い方）。英語は同じ調子で動詞始まり | R-11、R-12（性格語） | https://www.nngroup.com/articles/tone-of-voice-dimensions/ 、B-1 |
| D-20 アイコンを使わない（0 個）。意味は文字と枠で伝える。閉じるボタンも文字「閉じる」 | R-7（絵文字は読み上げに向かない）、R-2（busy の不満） | https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html 、B-2 |
| D-21 リンクは下線を必ず付ける（色だけで区別しない） | R-7 | https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html |
| D-22 S10 の行の答えは `<details>`/`<summary>` で畳む（長い答えで一覧が崩れない。キーボードで開閉できる） | R-16 | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details |
| D-23 権限（保存の永続化）は画面で求めず、初めて S3 を出した直後に `persist()` を 1 回だけ呼ぶ。断られたら S8 に注意と「書き出す」を置く | R-9（次の一手）、PRD 11 の冒頭 | B-1 |
| D-24 読み込みの失敗は、選んだファイルのそば（読み込みのボタンの直下）に「読めなかった」+「理由と直し方」の 2 文。確認は出さない | R-10 | https://www.nngroup.com/articles/error-messages-scoring-rubric/ |
| D-25 `forced-colors: active` では色の値を持たず、枠と下線で意味を保つ（印は枠、リンクは下線、エラーは文字） | R-15 | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors |

## 5. 画面ごとの状態
該当しない状態は「なし」と理由。オフラインは全画面で通常と同じ（アプリは読み込み後に通信を使わない。AC-12。Service Worker で再読み込みも同じ：AC-23）。初めての訪問でキャッシュがないままオフラインのときは、ブラウザ自身のエラーページになり、アプリの画面はない（対応は範囲の外）。「一部だけ読めたとき」は、保存は 1 キーの JSON を全体で検査して通るか落ちるかの 2 択（部分の読み込みをしない。読み込むファイルも同じ）なので、S0 の error 以外は「なし」。

| 画面 | 通常 | 空 | 読み込み中 | エラー | オフライン | 権限を断られたとき | 一部だけ読めたとき |
|---|---|---|---|---|---|---|---|
| S0 殻 | JS が動くまで `data-state="loading"`。ヘッダーのアプリ名だけ。1 秒たっても JS が動かなければ `app.loading` の文が不透明度で現れる（CSS だけ）。`<noscript>` に `app.noscript` | なし（殻は内容を持たない） | 上の loading そのもの。スピナーも「0 件」も出さない（R-9） | 保存データが形式に合わない → `data-state="error"`。`error.app.message`（何が起きたか）、`error.app.detail`（直し方）、主操作 `error.app.reload`、副操作 `error.app.exportRaw`（壊れたデータをそのままファイルに保存）、`error.app.delete`（確認ダイアログ `settings.delete.confirm` を経て削除 → S1）。PRD にない挙動なので 10 に書く | 通常と同じ | なし | 上のエラーと同じ扱い（部分は読まない） |
| S1 diagnosis.start | h1 `diagnosis.start.title`、`diagnosis.start.lead.1`〜`.3`、主操作 `diagnosis.start.begin`。スタンドアロンなら説明の直後に `<section>` `home.standalone.import` + `home.standalone.importButton`。iOS の Safari（非スタンドアロン、閉じた印なし）なら説明と主操作の間に `<section>` `home.addToHomeScreen`（`.title`、`.why`、`.steps` の `<ol>` 4 項目、`.close`） | なし（この画面が「保存データなし」の表示そのもの） | なし（殻の loading の後に同期で出る） | 読み込み（スタンドアロンの案内から）の失敗 → `home.standalone.importButton` の直下に `error.import.message` + `error.import.reason.version` か `.schema`（`role="alert"`） | 通常と同じ | なし（この画面で求める権限はない） | なし |
| S2 diagnosis.question | `diagnosis.progress`（質問 n / 3、`data-question-index`、`data-question-total`）、`<fieldset>` の `<legend>` `diagnosis.q1.legend` / `q2` / `q3`、radio（q1：`area.*` 6 つ、q2：`level.*` 3 つに説明 `level.*.desc`、q3：`years.*` 4 つ）、主操作 `diagnosis.next`（3 問目は `diagnosis.finish`）、副操作 `diagnosis.back`（2 問目以降）、やり直しのときだけ `diagnosis.cancel` | なし（選択肢は固定） | なし（同期） | (1) 未選択で確定 → `<legend>` の直下に `error.diagnosis.required`（`role="alert"`）。進まない。(2) 保存の失敗（AC-11）→ 主操作の直上に `error.storage.message` と `error.storage.retry`。質問の番号と選択は保つ。`error.storage.retry` で保存に成功すれば次の質問へ | 通常と同じ | なし | なし |
| S3 task.today | `task.today.label`（今日の課題 YYYY-MM-DD）、h1 `task.today.title`、`task.meta`（領域 / 段階 / 所要時間）、`external` なら印 `task.external.badge` と `<dl>` `task.external.tools`（`<dd>` に道具の `<ul>`）、`<h2>` `task.why` / `task.how` / `task.goal` と段落、`<label>` `task.answer.label` + `task.answer.help` + `<textarea>`（`data-testid="task.answer"`）+ `task.answer.saved`（`role="status"`、保存の 150 ms 後に出て、次の入力で消える）、`task.report.note`、主操作 `task.report.done`、副操作 `task.report.tooHard` / `.tooEasy` / `.noTime`。長い題名は折り返す。答えの欄は上限 `answer.max`（10 に書く。contracts/ で決める）に達すると `task.answer.limit` | なし（出せる課題がないときは S7 に移る） | なし（同期。AC-15 は殻の loading の時間） | (1) 答えの自動保存の失敗 → textarea の直下に `error.storage.message`（`role="alert"`）+ `error.storage.retry`。入力は保つ。(2) 申告の保存の失敗 → 申告のボタン群の直上に同じ 2 つ。状態は S3 のまま、答えも保つ | 通常と同じ | 初めて S3 を出した直後の `persist()` が断られても S3 は変わらない（知らせは S8。AC-13） | なし |
| S4 task.rate | h1 `task.rate.title`、`task.rate.question`、`task.rate.helpful`、`task.rate.notHelpful`（同格の副操作）、文字のボタン `task.rate.close` | なし | なし | 回答の保存の失敗 → ボタン群の直上に `error.storage.message` + `error.storage.retry`。選んだ答えは保つ | 通常と同じ | なし | なし |
| S5 task.done | h1 `task.done.title`、`task.done.message`、`task.done.task`（完了した課題の題名。text.small、color.text.secondary）、リンク `task.done.history` | なし | なし | なし（表示だけ。保存の読み取りに失敗すれば S0 の error） | 通常と同じ | なし | なし |
| S6 task.skipped | h1 `task.skipped.title`、`task.skipped.message`、too_hard / too_easy のときだけ `task.skipped.levelHint`、リンク `task.skipped.history` | なし | なし | なし（表示だけ） | 通常と同じ | なし | なし |
| S7 task.exhausted | h1 `task.exhausted.message`、`task.exhausted.detail`、主操作 `task.exhausted.redo` | この画面が「課題 0 件」の空の表示そのもの（何が起きたか + 次の一手） | なし | なし（表示だけ） | 通常と同じ | なし | なし |
| S8 settings | h1 `settings.title`。節「データ」：`settings.data.note`、（断られたときだけ）`settings.storage.notPersisted`、主操作 `settings.export`、`settings.export.done`（`role="status"`）、`settings.import.note`、`settings.import`（`<label>` で包んだ `<input type="file" accept=".json,application/json">`）。節「診断」：`settings.diagnosis.current`、`settings.redo`、`settings.redo.note`。節「ホーム画面」（iOS の Safari で非スタンドアロンのときだけ）：`settings.homeScreen.open` → 同じ場所に `home.addToHomeScreen` を開く。節「記録」：`settings.stats.open`、`settings.history.open`。節「削除」：`settings.delete`（取り消せない操作のボタン）。末尾：`settings.version`、`settings.privacy`（リンク） | 保存データがないとき（S1 から来たとき）：節「データ」の読み込みだけと、節「ホーム画面」、末尾を出す。書き出し、診断、記録、削除は出さない（する事がない。B-1） | ファイルの検査は同期（数 KB）。なし | (1) 読み込み：`settings.import` の直下に `error.import.message` + `error.import.reason.version` / `.schema`（`role="alert"`）。確認は出ない。データは変わらない。(2) 書き出し・削除の保存の失敗 → その操作の直下に `error.storage.message` + `error.storage.retry` | 通常と同じ | `persist()` を断られたとき：`settings.storage.notPersisted`（color.warning。エラーの見た目にしない：R-10）を `settings.export` の直上に出す。ファイル選択を取り消したとき：何も起きない | なし |
| S9 settings.stats | h1 `settings.stats.title`、`settings.stats.today`（今日 YYYY-MM-DD）、`<dl>` 9 行（`settings.stats.firstOpenDate` … `.noTime`。6 の表の順）、`settings.stats.note`、リンク `settings.stats.back` | 診断直後で課題 0 件：値は 0 と初めて開いた日（「0」は本当の 0 なので出す。読み込み中の偽の 0 ではない） | なし（同期） | なし（表示だけ） | 通常と同じ | なし | なし |
| S10 history | h1 `history.title`、`<ol>` に新しい順の `<li>`（`data-testid="history.row"`、`data-task-id`、`data-date`、`data-report`、`data-helpful`）。行の中：日付（YYYY-MM-DD、text.small）、題名、`report.*`、done のときだけ `helpful.*`、答えがあれば `<details>` `history.row.answer`。件数が多くても全件を 1 列で出す（28 日で 28 行、1 年で 365 行。分けない） | 0 件：`history.empty` + 主操作 `history.empty.action`（今日の課題へ） | なし | なし（表示だけ） | 通常と同じ | なし | なし |
| ダイアログ settings.import.confirm | `.title`、`.summary`（ファイルの中身：履歴 n 件、初めて開いた日）、`.body`、`.ok`（取り消せない操作のボタン）、`.cancel`（初期フォーカス） | なし | なし | 置き換えの保存の失敗 → ダイアログの中に `error.storage.message` + `error.storage.retry` | 通常と同じ | なし | なし |
| ダイアログ settings.delete.confirm | `.title`、`.body`、`.ok`、`.cancel`（初期フォーカス） | なし | なし | 削除の失敗 → 同上 | 通常と同じ | なし | なし |

## 6. 要素と識別子
受け入れテストが使う。`data-testid` は 7 の文言キーと同じ名前（文字を持たない要素はここで決める）。ルート要素（`<html>` か `<body>`。tech-lead が決める）は `data-state`、`data-build-version`、`data-debug-load-ms` を持つ。

| 画面 | 要素 | data-testid（または属性） | アクセシブルな名前（読み上げ） |
|---|---|---|---|
| 共通 | ルート | `data-state`、`data-build-version`、`data-debug-load-ms`（S3 を表示した時点で書く） | — |
| 共通 | ヘッダーのアプリ名（リンク） | `app.name` | 「今日の一手」 |
| 共通 | nav のリンク | `nav.history`、`nav.settings` | 「履歴」「設定」（今いる画面は aria-current） |
| S0 | 読み込みの文、noscript、エラーの文と操作 | `app.loading`、`app.noscript`、`error.app.message`、`error.app.detail`、`error.app.reload`、`error.app.exportRaw`、`error.app.delete` | 文言のとおり |
| S1 | 題名、説明、主操作 | `diagnosis.start.title`、`diagnosis.start.lead.1`〜`.3`、`diagnosis.start.begin` | 「診断を始める」 |
| S1 | スタンドアロンの案内 | `<section>` は `home.standalone`（`aria-labelledby` で `home.standalone.import` を指す）、文 `home.standalone.import`、ボタン `home.standalone.importButton`、`<input type="file">` は `home.standalone.importFile` | 「ファイルを読み込む」 |
| S1、S8 | ホーム画面の案内 | `<section>` は `home.addToHomeScreen`（`aria-labelledby` で `.title`）、`home.addToHomeScreen.title`、`.why`、`<ol>` `.steps`、`<li>` `.steps.1`〜`.4`、`.close` | 「閉じる」 |
| S2 | 進み具合 | `diagnosis.progress`（`data-question-index`、`data-question-total`） | 「質問 1 / 3」 |
| S2 | 質問と選択肢 | `<fieldset>` は `diagnosis.question`、`<legend>` は `diagnosis.q1.legend` / `q2` / `q3`。radio の `<input>` は `area.backend` … `years.gte5`（値のキー。`value` は contracts/ の ID）。q2 の説明は `level.beginner.desc` 等 | legend の文 + 選択肢の文（例：「初級 基本は知っているが、実務では人に聞きながら進める」） |
| S2 | 操作とエラー | `diagnosis.next`、`diagnosis.finish`、`diagnosis.back`、`diagnosis.cancel`、`error.diagnosis.required`、`error.storage.message`、`error.storage.retry` | 文言のとおり |
| S3 | 課題の入れ物 | `<article>` は `task.today`（`data-task-id`、`data-task-area`、`data-task-level`、`data-task-mode`） | — |
| S3 | 課題の文 | `task.today.label`、`task.today.title`（h1）、`task.meta`、`task.external.badge`、`<dl>` `task.external.tools`（`<dt>` が `task.external.tools.label`、`<li>` は `task.external.tools.item`）、`<h2>` `task.why` / `task.how` / `task.goal` と段落 `task.why.text` / `task.how.text` / `task.goal.text` | 見出しの文、本文 |
| S3 | 答えの欄 | `<label>` `task.answer.label`、補助 `task.answer.help`（`aria-describedby`）、`<textarea>` `task.answer`、`task.answer.saved`（`role="status"`）、`task.answer.limit` | 「答え（任意）」+ 補助の文 |
| S3 | 申告 | `task.report.note`、`task.report.done`、`task.report.tooHard`、`task.report.tooEasy`、`task.report.noTime` | 「完了」「難しすぎ」「簡単すぎ」「今日はできない」 |
| S4 | 文と操作 | `task.rate.title`、`task.rate.question`、`task.rate.helpful`、`task.rate.notHelpful`、`task.rate.close` | 「役に立った」「立たなかった」「今回は答えない」 |
| S5 | 文とリンク | `task.done.title`、`task.done.message`、`task.done.task`、`task.done.history` | 「履歴を見る」 |
| S6 | 文とリンク | `task.skipped.title`、`task.skipped.message`、`task.skipped.levelHint`、`task.skipped.history` | 「履歴を見る」 |
| S7 | 文と操作 | `task.exhausted.message`（h1）、`task.exhausted.detail`、`task.exhausted.redo` | 「診断をやり直す」 |
| S8 | 節と操作 | `settings.title`、`settings.data.title`、`settings.data.note`、`settings.storage.notPersisted`、`settings.export`、`settings.export.done`、`settings.import.note`、`settings.import`（`<label>`）、`settings.import.file`（`<input type="file">`）、`settings.diagnosis.title`、`settings.diagnosis.current`、`settings.redo`、`settings.redo.note`、`settings.homeScreen.title`、`settings.homeScreen.open`、`settings.records.title`、`settings.stats.open`、`settings.history.open`、`settings.delete.title`、`settings.delete`、`settings.version`、`settings.privacy`、`error.import.message`、`error.import.reason.version`、`error.import.reason.schema` | 「ファイルに書き出す」「ファイルを読み込む」「診断をやり直す」「統計を見る」「履歴を見る」「すべてのデータを削除」 |
| S8 | 読み込みの確認 | `<dialog>` `settings.import.confirm`（`aria-labelledby` で `.title`）、`.title`、`.summary`、`.body`、`.ok`、`.cancel` | 「置き換える」「やめる」 |
| S8 | 削除の確認 | `<dialog>` `settings.delete.confirm`、`.title`、`.body`、`.ok`、`.cancel` | 「削除する」「やめる」 |
| S9 | 値 | `settings.stats.title`、`settings.stats.today`、`<dt>` はラベルのキー、`<dd>` は同じキー + `.value`：`settings.stats.firstOpenDate.value`（`data-stat-first-open-date`）、`.issued.value`（`data-stat-issued`）、`.completed.value`（`data-stat-completed`）、`.firstDayCompleted.value`（`data-stat-first-day-completed`。文は `.yes` / `.no`）、`.daysCompleted7d.value`（`data-stat-days-completed-7d`）、`.helpful.value`（`data-stat-helpful`）、`.rated.value`（`data-stat-rated`）、`.tooHard.value`（`data-stat-too-hard`）、`.noTime.value`（`data-stat-no-time`）、`settings.stats.note`、`settings.stats.back` | `<dt>` の文 + 値 |
| S10 | 行 | `history.title`、`<ol>` `history.list`、`<li>` `history.row`（`data-task-id`、`data-date`、`data-report`、`data-helpful`）、行の中：`history.row.date`、`history.row.taskTitle`、`report.done` / `.tooHard` / `.tooEasy` / `.noTime` / `.none`、`helpful.yes` / `.no` / `.unanswered`、`<details>` の `<summary>` `history.row.answer`、答えの本文 `history.row.answerText`、空：`history.empty`、`history.empty.action` | 「答えを見る」（details は開閉の状態も読む） |

## 7. 文言
です・ます、絵文字と感嘆符なし、ボタンは動詞。英語は plain、direct、動詞始まり（調査 5）。プレースホルダーは `{name}` で、数の複数形は ICU の `{n, plural, one {…} other {…}}`（日本語は複数形がないので数だけ）。日付は ISO 8601（YYYY-MM-DD）を両言語で使う（`data-date`、`data-stat-first-open-date` と見える文字を同じ値にするため。AC-7、AC-24）。課題集の本文と `tools` は日本語のみ（PRD Q4）で、ここには含めない。この表が ja と en の文言ファイルの原本（AC-26 の「片方にしかないキー 0 件」）。文字がデータから来る要素の `data-testid`（`task.today.title`、`task.why.text`、`task.how.text`、`task.goal.text`、`task.external.tools.item`、`history.row.taskTitle`、`history.row.answerText`、`history.row.date`、`settings.stats.*.value`）は文言キーではなく、6 の表だけにある。

| キー | 日本語 | 英語 | 使う場所 |
|---|---|---|---|
| app.name | 今日の一手 | 今日の一手 | ヘッダー（英語の表記は 10） |
| app.loading | 読み込んでいます | Loading | S0（1 秒後） |
| app.noscript | このページは JavaScript が必要です。ブラウザの設定で JavaScript を有効にしてください。 | This page needs JavaScript. Turn on JavaScript in your browser settings. | S0 |
| nav.history | 履歴 | History | ヘッダー |
| nav.settings | 設定 | Settings | ヘッダー |
| error.app.message | 保存データを読めませんでした。 | Saved data could not be read. | S0 error |
| error.app.detail | このブラウザに保存された「今日の一手」のデータが、壊れているか、この版では読めない形です。再読み込みしても直らない場合は、データをファイルに保存してから削除し、最初からやり直してください。 | The data saved in this browser is damaged or in a format this version cannot read. If reloading does not fix it, save the data to a file, delete it, and start over. | S0 error |
| error.app.reload | 再読み込み | Reload | S0 error（主操作） |
| error.app.exportRaw | 壊れたデータをファイルに保存 | Save the damaged data to a file | S0 error |
| error.app.delete | すべてのデータを削除 | Delete all data | S0 error（確認あり） |
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
| diagnosis.cancel | やめる | Cancel | S2（やり直しのときだけ） |
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
| settings.import | ファイルを読み込む | Import a file | S8 |
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
| settings.stats.firstOpenDate | 初めて開いた日 | First opened | S9 dt |
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
- ファイルの読み込み：`<input type="file">` のブラウザ標準の選択ダイアログだけ。取り消したら何もしない。
- 通知、位置情報、カメラ：使わない。

## 8. 見た目
- 使うトークン（色、文字、余白）：design/tokens.md のすべて。色は color.bg、color.text、color.text.secondary、color.action.primary、color.action.onPrimary、color.border、color.focus、color.success、color.warning、color.error の 10 個だけ。文字は text.title、text.heading、text.body、text.small。余白は space.1〜space.6。
- 新しく足すトークン：tokens.md がこの機能で初版なので、すべて新規。意味の名前と、ライト、ダーク、上げる（ライト、ダーク）の値は tokens.md の 1 にあり、比は 9 の表。
- 使う SF Symbols の名前：なし。Web アプリでアイコンを 0 個にした（D-20）。印、状態、閉じるはすべて文字。
- 画面の並び（縦の線）：全画面で本文の列を size.content.max（640 px）に収めて中央に置き、要素の左端を列の左の線にそろえる（B-3）。左右の余白は space.4（幅 600 px 未満）か space.5。題名の上は space.6、節の間は space.5、段落の間は space.4、ボタンの間は space.3、ラベルと入力欄の間は space.2。
- 性格語が表れている場所（調査 5）：
  - ひとつ：S3 で画面に課題が 1 件だけあり、一覧も地図も進み具合もない。ヘッダーの nav はリンク 2 つだけ。S5 / S6 に次の課題を出さない。
  - 静か：地が 1 色で、カード、影、グラデーション、アイコン、絵文字がない（tokens 1、D-20）。色は主操作の「完了」と意味色（`task.answer.saved` の成功、`settings.storage.notPersisted` の注意、エラーの文）だけ。動きは不透明度の 150 ms だけ（D-13）。
  - 正直：S1 の `diagnosis.start.lead.2`（外に送らない）と `.3`（段階が変わる規則）、S7 の `task.exhausted.message`（尽きたと言い切る）、`home.standalone.import`（引き継がれない）、`settings.delete.confirm.body`（元に戻せない）、S9 の `settings.stats.note`（計算の出どころ）。
  - 手早い：S3 は開いて操作 0 回で題名が h1（AC-31）。S2 は 1 画面 1 問で確定は 1 ボタン。ボタンの文言はすべて動詞か 2〜6 文字の名詞（完了、次へ、閉じる）。
- 差をつける点が表れている場所（調査 6）：
  1. 課題そのものがホーム画面：S3 の初期表示。ヘッダー（アプリ名と nav）の直下に `task.today.label` と h1 `task.today.title`、続けて `task.why`。読み込みが終わった瞬間に題名と「なぜ今これか」が最初の画面に入る（幅 320 px、文字 100% で、題名から「なぜ今これか」の 2 行目までが初期表示に収まるように、ヘッダーの高さを 56 px 以内にする）。
  2. 「今日はここまで」と言い切る終わりの画面：S5 の h1 `task.done.title` と `task.done.message` の 2 行と、小さなリンク 1 つ。S4 は 1 問だけで `task.rate.close` で抜けられる。
- 参考にした原則のページ（URL、2026-10-30 確認）：https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html 、https://www.w3.org/WAI/WCAG22/Understanding/on-input.html 、https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html 、https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html 、https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html 、https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html 、https://www.w3.org/WAI/ARIA/apg/patterns/alert/ 、https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/ 、https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast 、https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors 、https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details 。調査にある R-14〜R-26 の URL も使う。HIG は本文が取れなかったので引用しない（調査 8 の末尾）。

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
  - S1：`<header>`（アプリ名）→ `<main>`：h1 → 説明 3 段落 →（スタンドアロンの案内：文 → 読み込むボタン）→（ホーム画面の案内：見出し → 理由 → 手順 1〜4 → 閉じる）→ 診断を始める。
  - S2：ヘッダー → 進み具合「質問 1 / 3」→ `<legend>` → 選択肢（radio のラベル。q2 は段階名と説明を 1 つのラベルにする）→（エラー）→ 次へ → 前の質問へ →（やめる）。質問が切り替わったら `<main>` の先頭（進み具合）にフォーカスを移す。
  - S3：ヘッダー（アプリ名 → 履歴 → 設定）→ 今日の課題と日付 → h1 題名 → 領域 / 段階 / 所要時間 →（外で行う → 要る道具の一覧）→ h2 なぜ今これか → 本文 → h2 やり方 → 本文 → h2 完了の目安 → 本文 → ラベル「答え（任意）」+ 補助文 → textarea →（保存しました：フォーカスを奪わず `role="status"` で読む）→ 申告の注記 → 完了 → 難しすぎ → 簡単すぎ → 今日はできない。
  - S4：ヘッダー → h1 完了しました → 問い → 役に立った → 立たなかった → 今回は答えない。状態が変わったら h1 にフォーカスを移す。
  - S8：ヘッダー → h1 設定 → データ（注記 →（注意）→ 書き出す →（書き出しました）→ 読み込みの注記 → 読み込む →（エラー））→ 診断 → ホーム画面 → 記録 → 削除 → 版 → プライバシー。ダイアログは開いたら「やめる」にフォーカス、閉じたら呼び出したボタンに戻す。
  - 全画面で、見える文字がアクセシブルな名前の先頭に入る（WCAG 2.2 SC 2.5.3）。`aria-label` で見える文字と違う名前を付けない。
- 英語が長くなったとき（疑似言語の代わりに、英語の文言と、その 2 倍の長さの文字列で確かめる画面）：S3（申告の 4 ボタンと `task.meta`。英語「Not today」「Outside the browser」）、S8（設定の操作 7 つ。「Show how to add to the Home Screen」が最も長い）、S1（`home.addToHomeScreen.steps.4` の長文と「Import a file」）、ダイアログ（`settings.import.confirm.summary` の複数形）。どの画面もボタンの文字は折り返し可能（`white-space: normal`）で、幅は列いっぱいに広がるので切れない。
- 押せる範囲：`<button>`、radio の `<label>`、`<summary>`、単独の `<a>` は 44 × 44 CSS px 以上（tokens の size.target.min）。本文の中のリンク（`settings.privacy`）は行の高さのままでよい（WCAG 2.2 SC 2.5.8 の文中の例外）。
- キーボード：Tab 順は DOM 順。`<dialog>` はフォーカスを閉じ込め、Escape で閉じる。`<details>` は Enter / Space で開閉。radio は矢印で移動し Space で選ぶ（R-21）。フォーカスの枠は 3 px の `outline` と 2 px の `outline-offset`（AC-18 の 2 px 以上）。

コントラスト（WCAG 2.2 の式で計算。独自の色の組ごと。四捨五入せず小数 2 桁で切り捨て。基準は 16 px の文字が 4.5:1 以上、24 px 以上か 18.5 px 以上の太字の文字と操作部品の枠が 3:1 以上：R-14、R-15）
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
| radio、`<input type="file">`、`<dialog>` の `::backdrop` | システム色（`color-scheme` と `accent-color` に従う） | 同左 | 同左 |

## 10. 決まっていないこと
Takuma か tech-lead に決めてほしいこと。仕様はここに書いた暫定で進める。
- U-1（Takuma、見た目）：主操作の色を青（color.action.primary = #1D4ED8 / ダーク #8AB4F8）に置いた。性格語「静か」に合う無彩色寄りの 1 色として選んだが、ブランドとして別の色がよければ tokens.md の 1 行を変えるだけで済む（比は計算し直す）。
- U-2（Takuma、見た目）：日付を両言語で ISO 8601（2026-11-01）にした。AC-24 の「見える文字と data-stat が同じ値」と `data-date` を一致させるため。日本語で「2026年11月1日」にしたい場合は、AC-24 の読み方（属性と見える文字の対応）を verifier と決め直す。
- U-3（Takuma）：英語表示のときのアプリ名。`app.name` と文中の名前は英語でも「今日の一手」のまま置いた。ローマ字（Kyou no Itte）や英語名が要るか。
- U-4（Takuma、見た目）：S5 に完了した課題の題名を 1 行残す（`task.done.task`）か、h1 と 1 文だけにするか。D-4 は残す側に置いた。
- U-5（tech-lead、PRD にない挙動）：保存データが形式に合わないときの S0 の error 状態（`error.app.*`。再読み込み、壊れたデータのファイル保存、削除）。PRD の 10 の「保存の方式を後から変えてデータを失う」の手当てとして置いたが、PRD の AC にはない。採るかどうかと、保存の形式の検査の規則は ADR で決める。
- U-6（tech-lead）：答えの欄の文字数の上限 `answer.max`（localStorage の容量の都合。`task.answer.limit` の {max}）。
- U-7（tech-lead）：診断のやり直し（S8 → S2）の保存の仕方。初回は質問ごとに保存する（AC-11）が、やり直しの途中で「やめる」を押したときに元の診断が壊れないよう、やり直しは下書きに保存して「診断を終える」で確定する作りを求める。PRD の「回答は質問ごとに確定したときに保存する」は初回の規則として読んだ。
- U-8（tech-lead）：経験年数の 4 区分（`years.lt1`、`years.1to3`、`years.3to5`、`years.gte5`）と段階の表示名（初級 / 中級 / 上級）、領域の ID。PRD は区分の中身を決めていない。ID は contracts/ で確定し、文言キーの末尾はそれに合わせて直してよい。
- U-9（pdm）：`settings.privacy` のリンク先（docs/support/ のプライバシーのページの URL）。G5 の前に決まるまでリンクは出さない。
- U-10（verifier、PRD の読み方）：AC-21 の状態の説明（PRD 11 の冒頭）は案内を「重ねて出す」と書くが、AC-21 の Then は「画面に案内がある」で足りるので、R-18 と AC-31 に合わせて重ねずに本文の一部として置いた（D-10）。テストは `[data-testid="home.addToHomeScreen"]` の存在で見る。
- U-11（verifier、識別子の名前）：PRD が仮に置いた `task-answer` を、他のキーと同じドット区切りの `task.answer` にした。
- U-12（Takuma、見た目）：radio のラベル全体を 44 px の高さにし、q2 の段階に 1 行の説明（`level.*.desc`）を付けた。説明は自己評価のぶれを減らすためだが、PRD の 3 問の文面は pdm と Takuma が最終的に決める。

## 確かめ（提出前に designer が印を付ける。design-reviewer はこれを信じずに確かめる）
- [x] 調査が先にあり、決定表のすべての行に R-n と原則がある（R-n は調査に実在する）：D-1〜D-25。調査は 854cf47 でコミット済み
- [x] 全画面に、仕事、主操作1つ、使う標準部品がある（3 の表。S0〜S10 とダイアログ）
- [x] 全画面の7つの状態が埋まっている（5 の表。該当しない所は「なし」と理由）
- [x] 押せる範囲が 44x44pt 以上。コントラストが基準を満たし、独自の色の組に数字が3通りある（9 の表。最小は 5.33:1）
- [x] AX5 での並びと、VoiceOver の読み上げ順が書いてある（9）
- [x] 性格語と差をつける点が、画面のどこに表れているか書いてある（8）
- [x] 文言が日英そろい、テストで使う要素に accessibilityIdentifier（data-testid）がある（6、7）
