# 画面の識別子（001-daily-learning）

受け入れテストが画面を読むための、読み取り専用の印です（test-hooks.md の W-2、W-5、W-8、W-10、W-15）。
アプリはここにある名前と値だけを出します。テストはここにない名前を使いません。足すときは tech-lead がここに足してから使います。
画面と要素の対応は design/001-daily-learning.md の 2 と 6 にあります。

## 1. ルート要素
ルート要素は `<html>` です（design の 6 で tech-lead に任された決定）。

| 属性 | 値 | 書く時機 |
|---|---|---|
| `data-state` | 2 の 12 個のどれか | 静的な HTML の時点で `loading`。状態が変わるたびに、その状態の DOM を入れ終えた後に書き換える |
| `data-build-version` | 配布物の版。形は `YYYY-MM-DD.N`（例 `2026-11-30.1`）。ビルドの手順が静的な HTML に書き込む | 静的な HTML の時点から持つ。S8 の `settings.version` の `{version}` も同じ値（AC-28） |
| `data-debug-load-ms` | 0 以上の整数の文字列（ミリ秒） | 読み込みのたびに 1 回だけ。`task.today`、`task.done`、`task.skipped`、`task.exhausted` のどれかを最初に描き、`data-state` を書いた直後に `Math.round(performance.now())` を書く（AC-15。performance.now() の 0 はナビゲーションの開始）。本番にも残す |
| `lang` | `ja` か `en`（strings.md の言語の決まり） | 静的な HTML は `ja`。言語を決めた後に書き換える |

## 2. data-state の 12 個
| 値 | 画面 | 備考 |
|---|---|---|
| `loading` | S0 | 静的な HTML。JS が動くまで |
| `error` | S0 error | 2 つの変種は要素で見分ける：読めない＝`error.app.message`、保存先が使えない＝`error.app.storageUnavailable.message` |
| `diagnosis.start` | S1 | 案内 `home.addToHomeScreen` と `home.standalone` は状態を変えない |
| `diagnosis.question` | S2 | 初回もやり直しも同じ値 |
| `task.today` | S3 | 日付が変わった知らせの有無は `task.dayChanged` の件数で見る（3）。同じ日の 2 件目以降の課題（AC-33）も同じ値で、`data-task-nth-today`（4）で見分ける。値は増やさない |
| `task.rate` | S4 | 保存しない一時の状態。再読み込みすると `task.done` |
| `task.done` | S5 | |
| `task.skipped` | S6 | |
| `task.exhausted` | S7 | 2 つの変種（AC-10）は h1 の要素で見分ける：この段階を修了＝`task.exhausted.levelDone`、上級を修了＝`task.exhausted.allDone` |
| `settings` | S8 | ダイアログ `settings.import.confirm`、`settings.delete.confirm` は状態を変えない |
| `settings.stats` | S9 | |
| `history` | S10 | |

画面ごとの URL は持ちません（ハッシュも使わない）。再読み込みすると、data.md の「起動時の判定」の行き先に戻ります。

## 3. data-testid
決まり：
- 見える文字を持つ要素の `data-testid` は、その文字の文言キーと同じです。文言キーは 174 個で、一覧は 6 にあります（機械で読める原本は schemas/strings.schema.json の `required`）。
- 例外：変種の文言キー 5 個（`task.cheer.default`、`task.cheer.at7`、`task.cheer.at30`、`task.cheer.at100`、`task.next.note.last`）は `data-testid` に使いません。要素の `data-testid` は固定で（`task.cheer`、`task.next.note`）、中の文字だけがどれか 1 つの変種になります（design の 6、D-36、D-44）。テストは文字（ja.json / en.json の値）か `data-milestone`（4）で変種を見分けます。
- radio は `<input type="radio">` に `data-testid` を付けます（`area.*`、`level.beginner`／`level.intermediate`／`level.advanced`、`years.*`）。`value` は 5 の ID です。ラベルの文字に別の `data-testid` は付けません。`level.*.desc` はラベルの中の説明の要素に付けます。
- 出さない要素は DOM に置きません（`hidden` 属性や CSS で隠すだけにしない）。例：`in_app` の課題では `task.external.badge` が 0 件。閉じたダイアログも DOM から外します。例外は、見た目だけ隠したファイルの input（`home.standalone.importFile`、`settings.import.file`）です。
- 1 つの状態の中で、同じ `data-testid` は 1 つだけです。例外は繰り返す行（`history.row` とその中の要素、`task.external.tools.item`）です。
- 片方だけを出す組：`task.today.label`（その日の 1 件目）と `task.today.label.nth`（2 件目以降）、`task.skipped.levelHint` と `task.skipped.levelChanged`（同じ申告が 2 回続いて段階が変わったとき）、`task.exhausted.seenNext` と `task.exhausted.nextDone`（多くて 1 つ。D-40）。出さない方は DOM に置きません。
- `task.insight` と `task.insight.text` は S4、S5 だけに置きます（S3、S6 では 0 件。AC-38）。
- `settings.privacy` は、リンク先が決まるまで（design の U-9）DOM に置きません。
- `task.dayChanged`（S3、S7。design の D-30）は、画面を開いたまま日付が変わった後の最初の操作で着いたときだけ DOM に置きます（data.md の 4）。
  - 要素は `<p role="status" tabindex="-1">` です。文書順で、`<main>` の中の他のどの `data-testid` の要素よりも前に置きます（S3 は `task.today`、`task.progress`、`task.today.label`（または `.nth`）より前、S7 は h1 の `task.exhausted.levelDone`（または `task.exhausted.allDone`）より前）。
  - 描いた直後に `document.activeElement` になります。
  - それ以外（読み込みで着いた S3 / S7、ほかのすべての画面）では 0 件です。
  - 次の操作（ボタン、リンク、radio の確定、ファイルの選択）の始めに DOM から外します。答えの欄への入力では外しません。
  - `data-state` は `task.today` / `task.exhausted` のままです。知らせの有無は、この要素の件数で見ます。

文字を持たない要素の `data-testid`（37 個。文言キーではない。`task.progress.done` は文言キーでもあるが、属性を持つのでここにも書く）：
| data-testid | 要素 | 画面 |
|---|---|---|
| `task.today` | `<article>`。4 の `data-task-*` を持つ | S3 |
| `task.today.title` | `<h1>`。課題の題名（課題集から） | S3 |
| `task.why.text`、`task.how.text`、`task.goal.text` | 本文の入れ物。中の段落と `<code>` は strings.md の「課題の本文」 | S3 |
| `task.external.tools` | `<dl>`（要る道具。`<dd>` の中に `<ul>`） | S3（external） |
| `task.external.tools.item` | `<dd>` の中の `<ul>` の `<li>`（道具 1 つ。繰り返す） | S3（external） |
| `task.answer` | `<textarea>`（`maxlength="2000"`） | S3 |
| `task.total` | 累計の `<p>`。中に `<span>` の `task.total.label` と `task.total.value`（4 の `data-stat-completed`） | S4、S5、S7 |
| `task.total.prev` | 前の累計の `<span>`（`aria-hidden="true"`）。S4 を「完了」の直後に描いたときだけ `task.total` の中の同じ位置に置き、動きが終わると DOM から外す。`prefers-reduced-motion: reduce` では作らない（0 件）。D-43 | S4 |
| `task.rate.mark` | h1 `task.rate.title` の先頭の `<svg>`（`aria-hidden="true"`、`focusable="false"`）。中は `<path>` 1 つ。節目（`data-milestone` が `none` 以外）では `<circle>` 1 つが `<path>` より先にある。D-43 | S4 |
| `task.progress.done` | 終えた後の進み具合の `<p>`（文言キー `task.progress.done` の文字を持つ。4 の `data-progress-index`、`data-progress-total`）。D-44 | S4、S5 |
| `task.cheer` | 祝いの `<p>`。文字は `task.cheer.at7`、`.at30`、`.at100`、`.default` のどれか 1 つ。4 の `data-milestone`。D-36 | S4、S5 |
| `task.insight.text` | ひとこと解説の本文の `<p>`（課題集の `insight`。文言キーではない）。見出しは `<h2>` の `task.insight`。S5 では `task.next` の後ろ（D-45） | S4、S5（S3、S6 では 0 件） |
| `diagnosis.question` | `<fieldset>` | S2 |
| `home.standalone` | 案内の `<section>` | S1 |
| `home.standalone.importFile` | 隠した `<input type="file">` | S1 |
| `home.addToHomeScreen` | 案内の `<section>` | S1、S8 |
| `home.addToHomeScreen.steps` | 手順の `<ol>`（中の `<li>` は `.steps.1`〜`.4`） | S1、S8 |
| `settings.import.file` | 隠した `<input type="file">` | S8 |
| `settings.import.confirm`、`settings.delete.confirm` | `<dialog>` | S8、S0 error（削除） |
| `history.list` | `<ol>` | S10 |
| `history.row` | `<li>`（繰り返す。4 の属性を持つ） | S10 |
| `history.row.date`、`history.row.taskTitle`、`history.row.answerText` | 行の中の日付、題名、答えの本文 | S10 |
| `settings.stats.firstOpenDate.value`、`.issued.value`、`.completed.value`、`.firstDayCompleted.value`、`.daysCompleted7d.value`、`.daysCompletedWeek.value`、`.extraCompleted.value`、`.helpful.value`、`.rated.value`、`.tooHard.value`、`.noTime.value` | 値の `<dd>`（11 個。4 の `data-stat-*` を持つ） | S9 |

## 4. 値を持つ属性
| 要素 | 属性 | 値 |
|---|---|---|
| `task.today` | `data-task-id` | 課題の ID（5） |
| | `data-task-area` | 領域の ID（5） |
| | `data-task-level` | 段階の ID（5） |
| | `data-task-mode` | `in_app` か `external` |
| | `data-task-nth-today` | その日に出した課題の何件目か。1 から始まる整数の文字列（AC-33。日付が変わると 1 に戻る） |
| | `data-progress-index` | 表示中の課題（`current`）の領域と段階の組で、`history` にある行の数 + 1（`report` が `none` の行も数える。目標の組ではなく表示中の課題の組。tech-lead G1 r2 の要修正 2、AC-36） |
| | `data-progress-total` | その組の課題集の総数（v1 は初級・中級 14、上級 7） |
| `task.progress.done`（S4、S5） | `data-progress-index` | 完了した課題の組で、その課題が何件目だったか。その課題の S3 の値と同じ（`history` のうち、完了の行と同じ組の行を、その行まで数えた数） |
| | `data-progress-total` | 完了した課題の組の課題集の総数 |
| `task.total.value`（S4、S5、S7） | `data-stat-completed` | S9 の `data-stat-completed` と同じ整数の文字列（9 の数え方）。見える文字（`task.total.value` の `{count}`）も同じ整数で始まる。描いた直後から最終の値（AC-35） |
| `task.cheer`（S4、S5） | `data-milestone` | `7`、`30`、`100`、`none`（累計 `data-stat-completed` が 7、30、100 ならその値、それ以外は `none`）。文字は `task.cheer.at7`、`.at30`、`.at100`、`.default` に対応する |
| `task.week`（S5） | `data-stat-days-completed-week` | S9 の同じ属性と同じ整数（AC-37） |
| `diagnosis.progress` | `data-question-index` | `1`〜`3`（表示している質問の番号） |
| | `data-question-total` | `3` |
| `history.row` | `data-task-id` | 課題の ID |
| | `data-date` | 課題を出した日 `YYYY-MM-DD` |
| | `data-report` | `done`、`too_hard`、`too_easy`、`no_time`、`none`（申告のないまま日付が変わった） |
| | `data-helpful` | `helpful`、`not_helpful`、`unanswered`。`data-report="done"` の行だけに付ける |

- S10 の行は保存データの `history` の全行を新しい順（配列の逆順）に出します。`current`（まだ申告していない今日の課題）は出しません。
- 統計の値（S9。数え方は data.md の 9）。`data-stat-completed` は S4、S5、S7 の `task.total.value` にも、`data-stat-days-completed-week` は S5 の `task.week` にも付き、S9 と同じ値です。整数は 10 進の文字列、日付は `YYYY-MM-DD`、真偽値は `true` か `false` です。見える文字は、整数と日付は属性と同じ文字列、真偽値は `settings.stats.firstDayCompleted.yes` か `.no` の文言です。

| 属性 | 値の形 |
|---|---|
| `data-stat-first-open-date` | 日付 |
| `data-stat-issued` | 整数 |
| `data-stat-completed` | 整数 |
| `data-stat-first-day-completed` | 真偽値 |
| `data-stat-days-completed-7d` | 整数（0〜7） |
| `data-stat-days-completed-week` | 整数（0〜7。月曜から今日までに完了した日数。S5 の `task.week` にも付く） |
| `data-stat-extra-completed` | 整数（同じ日の 2 件目以降の完了件数。PRD 11「2 件目以降の完了」） |
| `data-stat-helpful` | 整数 |
| `data-stat-rated` | 整数 |
| `data-stat-too-hard` | 整数 |
| `data-stat-no-time` | 整数 |

## 5. ID の語彙：最初の公開から変えない（ADR 0002）
| 種類 | ID | 表示の文言キー |
|---|---|---|
| 領域（Q3） | `backend`、`frontend`、`database`、`infra`、`testing`、`git` | `area.<ID>`（バックエンド設計、フロントエンド、データベース、インフラとクラウド、テストと品質、Git とチーム開発） |
| 段階 | `beginner`、`intermediate`、`advanced` | `level.<ID>`（初級、中級、上級。PRD の初 / 中 / 上） |
| 経験年数 | `never`（未経験）、`lt1`、`1to3`、`3to5`、`gte5` | `years.<ID>` |
| 課題の型 | `in_app`、`external` | 印は `task.external.badge` |
| 申告 | `done`、`too_hard`、`too_easy`、`no_time`（と、日付が変わった `none`） | `report.done`、`.tooHard`、`.tooEasy`、`.noTime`、`.none` |
| 役に立ったか | `helpful`、`not_helpful`、`unanswered` | `helpful.yes`、`.no`、`.unanswered` |
| 課題の ID | `<領域>-<段階>-<3 桁>`（例 `backend-intermediate-007`） | 題名は課題集から |

- PRD の W-8 案の `completed` は使いません。申告の「完了」は `done` です（AC-32 の `none` と、design の `report.done` に合わせた。tech-lead G1 r1 の A）。

## 6. 文言キー（174 個。3 の例外 5 個を除いて data-testid としても使う）
- 原本は schemas/strings.schema.json の `required`。r7 で 28 個を足して 4 個（`task.done.message`、`task.skipped.message`、`task.exhausted.message`、`task.exhausted.detail`）を消し、r8 で 4 個を足した（146 → 170 → 174。design の 6.1）。
- data-testid に使わない例外（5 個）：`task.cheer.default`、`task.cheer.at7`、`task.cheer.at30`、`task.cheer.at100`（要素は `task.cheer`）、`task.next.note.last`（要素は `task.next.note`）。
- app（3）：`app.name`、`app.loading`、`app.noscript`
- nav（2）：`nav.history`、`nav.settings`
- error（13）：`error.app.message`、`error.app.detail`、`error.app.reload`、`error.app.exportRaw`、`error.app.delete`、`error.app.storageUnavailable.message`、`error.app.storageUnavailable.detail`、`error.diagnosis.required`、`error.storage.message`、`error.storage.retry`、`error.import.message`、`error.import.reason.version`、`error.import.reason.schema`
- diagnosis（13）：`diagnosis.start.title`、`diagnosis.start.lead.1`、`diagnosis.start.lead.2`、`diagnosis.start.lead.3`、`diagnosis.start.begin`、`diagnosis.progress`、`diagnosis.q1.legend`、`diagnosis.q2.legend`、`diagnosis.q3.legend`、`diagnosis.next`、`diagnosis.finish`、`diagnosis.back`、`diagnosis.cancel`
- home（9）：`home.standalone.import`、`home.standalone.importButton`、`home.addToHomeScreen.title`、`home.addToHomeScreen.why`、`home.addToHomeScreen.steps.1`、`home.addToHomeScreen.steps.2`、`home.addToHomeScreen.steps.3`、`home.addToHomeScreen.steps.4`、`home.addToHomeScreen.close`
- area（12）：`area.backend`、`area.frontend`、`area.database`、`area.infra`、`area.testing`、`area.git`、`area.backend.desc`、`area.frontend.desc`、`area.database.desc`、`area.infra.desc`、`area.testing.desc`、`area.git.desc`
- level（6）：`level.beginner`、`level.beginner.desc`、`level.intermediate`、`level.intermediate.desc`、`level.advanced`、`level.advanced.desc`
- years（5）：`years.never`、`years.lt1`、`years.1to3`、`years.3to5`、`years.gte5`
- task（52）：`task.dayChanged`、`task.today.label`、`task.today.label.nth`、`task.progress`、`task.meta`、`task.external.badge`、`task.external.tools.label`、`task.why`、`task.how`、`task.goal`、`task.answer.label`、`task.answer.help`、`task.answer.saved`、`task.answer.limit`、`task.report.note`、`task.report.done`、`task.report.tooHard`、`task.report.tooEasy`、`task.report.noTime`、`task.rate.title`、`task.rate.question`、`task.rate.helpful`、`task.rate.notHelpful`、`task.rate.close`、`task.total.label`、`task.total.value`、`task.progress.done`、`task.cheer.default`、`task.cheer.at7`、`task.cheer.at30`、`task.cheer.at100`、`task.insight`、`task.done.title`、`task.done.task`、`task.week`、`task.next.note`、`task.next.note.last`、`task.next`、`task.done.history`、`task.skipped.title`、`task.skipped.levelHint`、`task.skipped.levelChanged`、`task.skipped.history`、`task.exhausted.levelDone`、`task.exhausted.levelDone.detail`、`task.exhausted.next`、`task.exhausted.seenNext`、`task.exhausted.nextDone`、`task.exhausted.advance`、`task.exhausted.allDone`、`task.exhausted.allDone.detail`、`task.exhausted.redo`
- settings（47）：`settings.title`、`settings.data.title`、`settings.data.note`、`settings.storage.notPersisted`、`settings.export`、`settings.export.done`、`settings.import.note`、`settings.import`、`settings.import.confirm.title`、`settings.import.confirm.summary`、`settings.import.confirm.body`、`settings.import.confirm.ok`、`settings.import.confirm.cancel`、`settings.diagnosis.title`、`settings.diagnosis.current`、`settings.redo`、`settings.redo.note`、`settings.homeScreen.title`、`settings.homeScreen.open`、`settings.records.title`、`settings.stats.open`、`settings.history.open`、`settings.delete.title`、`settings.delete`、`settings.delete.confirm.title`、`settings.delete.confirm.body`、`settings.delete.confirm.ok`、`settings.delete.confirm.cancel`、`settings.version`、`settings.privacy`、`settings.stats.title`、`settings.stats.today`、`settings.stats.firstOpenDate`、`settings.stats.issued`、`settings.stats.completed`、`settings.stats.firstDayCompleted`、`settings.stats.firstDayCompleted.yes`、`settings.stats.firstDayCompleted.no`、`settings.stats.daysCompleted7d`、`settings.stats.daysCompletedWeek`、`settings.stats.extraCompleted`、`settings.stats.helpful`、`settings.stats.rated`、`settings.stats.tooHard`、`settings.stats.noTime`、`settings.stats.note`、`settings.stats.back`
- history（4）：`history.title`、`history.empty`、`history.empty.action`、`history.row.answer`
- report（5）：`report.done`、`report.tooHard`、`report.tooEasy`、`report.noTime`、`report.none`
- helpful（3）：`helpful.yes`、`helpful.no`、`helpful.unanswered`
