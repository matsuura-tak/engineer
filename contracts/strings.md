# 文言と本文の決まり（001-daily-learning）

形は schemas/strings.schema.json（文言）と schemas/tasks.schema.json（課題集）です。文言の原本は design/001-daily-learning.md（r13）の 7（日英の表）です。
AC-3、AC-26、AC-29、AC-34、AC-35、AC-38、AC-41〜AC-45、つなぎ口 W-14。

## 1. 文言ファイル
- 置き場所：`backend/public/i18n/ja.json` と `backend/public/i18n/en.json`（配布物の中では `./i18n/ja.json`、`./i18n/en.json`）。
- 形：平らなキーの JSON（入れ子にしない。`settings.import` と `settings.import.note` が両方あるため）。値は空でない文字列。
- ja と en は、どちらも strings.schema.json に通ります。スキーマは 194 個のキー（design r13 の 7、identifiers.md の 6）をすべて必須にし、それ以外のキーを拒むので、2 つのファイルのキーの集合は必ず同じになります（AC-26 の「片方にしかないキー 0 件」）。
- 差し込みのあるキー（29 個。3 の表）は、スキーマがその差し込みの名前を含むことを求めます。差し込みのないキー（165 個）は `{` と `}` を含めません。ja と en で、キーごとの差し込みの名前の集合は同じです（contracts/tools/check-schemas.mjs が valid-ja と valid-en で確かめる）。
- 案内役の台詞 `guide.*`（15 個）は差し込みを持たず、1〜40 字です（コードポイント。スキーマの `$defs/guide` の maxLength。AC-45、D-55）。
- キーの数の経緯：146 → 170（design r7）→ 174（design r8）→ 194（design r11〜r13：40 個を足し、20 個を消した。足したもの、消したものは identifiers.md の 6）。差し込みは 26 → 29（`task.answer.limit`、`task.skipped.levelChanged` を消し、`task.question.heading`、`task.rate.score`、`task.level.adjusted.down`、`.up`、`history.row.score` を足した）。
- キーを足す・消すときは、先に design/ の 7 と strings.schema.json を直します（tech-lead）。文言ファイルだけを直してもスキーマの検査で落ちます。

## 2. 言語の決め方
- `navigator.language` を小文字にして `ja` で始まれば日本語、それ以外はすべて英語（PRD 12。ja でも en でもない言語は英語）。
- verifier G0 r3 の W-14 案（「en で始まれば英語、それ以外は日本語」）は PRD と逆なので採りません。
- `navigator.languages` は見ません。決めた言語を `<html lang>` に書きます。
- テストは Playwright のコンテキストの `locale`（`ja-JP`、`en-US`）で切り替えます。

## 3. 差し込みの書き方（この 2 つだけ）
- `{name}`：値をそのまま入れる。
- `{name, plural, one {…} other {…}}`：`new Intl.PluralRules(言語).select(数)` の結果のカテゴリを使い、そのカテゴリがなければ `other`。中の `#` を数に置き換える。カテゴリは `one` と `other` だけ。入れ子はしない。
- ライブラリは使いません（30 行ほどの自作。ADR 0001）。

差し込みのあるキーは次の 29 個です（schemas/strings.schema.json の pattern、fixtures/strings/valid-ja.json と同じ。design r13 の 7）。「en は plural」の 5 個は、en の値が `{name, plural, …}` の形で、ja は数だけです。

| キー | 差し込み | 入れる値 |
|---|---|---|
| `diagnosis.progress` | `{n}`、`{total}` | 質問の番号、3 |
| `diagnosis.q2.legend` | `{area}` | `area.<ID>` の文言 |
| `task.today.label` | `{date}` | 今日 `YYYY-MM-DD`（その日の 1 件目） |
| `task.today.label.nth` | `{nth}`、`{date}` | `data-task-nth-today` と同じ整数（2 以上）、今日 `YYYY-MM-DD` |
| `task.progress` | `{index}`、`{total}` | S3 の `data-progress-index`、`data-progress-total` と同じ整数（identifiers.md の 4） |
| `task.meta` | `{area}`、`{level}`、`{minutes}` | `area.<ID>`、`level.<ID>` の文言、所要時間の整数（en は plural） |
| `task.question.heading` | `{n}`、`{total}` | その問の `data-question-number`（1〜3）、3 |
| `task.rate.score` | `{n}`、`{total}` | 正答数（S4 と S5 の要素の `data-score` と同じ整数、0〜3）、3。点数の語を使わない（7.1、AC-42） |
| `task.total.value` | `{count}` | 累計の完了件数。`data-stat-completed` と同じ整数（en は plural）。S4 の `task.total.prev` も同じ文言で、`{count}` は 1 少ない整数 |
| `task.progress.done` | `{index}`、`{total}` | `task.progress.done` の要素の `data-progress-index`、`data-progress-total` と同じ整数（完了した課題の S3 と同じ値） |
| `task.cheer.default` | `{count}` | `task.total.value` と同じ整数（累計が 7、30、100 以外のとき。`data-milestone` は `none`） |
| `task.done.task` | `{title}` | 課題の題名 |
| `task.week` | `{days}` | `data-stat-days-completed-week` と同じ整数（0〜7） |
| `task.level.adjusted.down` | `{level}` | 規則で下がった後の `levels[area]` の `level.<ID>` の文言（data.md の 5、D-60）。禁止語の対象（7.2） |
| `task.level.adjusted.up` | `{level}` | 規則で上がった後の `levels[area]` の `level.<ID>` の文言。禁止語の対象（7.2） |
| `task.next.note.last` | `{area}`、`{level}` | 今の領域 `diagnosis.area` の `area.<ID>` の文言、次に出す組の段階 `levels[area]` の `level.<ID>` の文言（申告で段階が動いていれば動いた先。いま終えた課題の段階ではない。data.md の 9、design の D-44 (2)） |
| `task.exhausted.levelDone` | `{area}`、`{level}` | 今の組の `area.<ID>`、`level.<ID>` の文言 |
| `task.exhausted.levelDone.detail` | `{total}` | 今の組の課題の総数（`data-progress-total` と同じ数え方。en は plural） |
| `task.exhausted.next` | `{nextLevel}`、`{desc}` | 次の段階の `level.<ID>` の文言、その `level.<ID>.desc` の文言（句点なし） |
| `task.exhausted.seenNext` | `{nextLevel}` | 次の段階の `level.<ID>` の文言 |
| `task.exhausted.nextDone` | `{nextLevel}` | 次の段階の `level.<ID>` の文言 |
| `task.exhausted.advance` | `{nextLevel}` | 次の段階の `level.<ID>` の文言 |
| `task.exhausted.allDone` | `{area}` | 今の組の `area.<ID>` の文言 |
| `task.exhausted.allDone.detail` | `{total}` | 上級の組の課題の総数（en は plural） |
| `history.row.score` | `{n}`、`{total}` | その行の `score`（S10 の行の `data-score` と同じ整数）、3。答えた問が 1 件以上の行だけ（D-62） |
| `settings.import.confirm.summary` | `{count}`、`{date}` | ファイルの `history` の行数（en は plural）、`firstOpenDate` |
| `settings.diagnosis.current` | `{area}`、`{level}` | 今の目標の領域と `levels[area]` の文言 |
| `settings.version` | `{version}` | `data-build-version` と同じ値 |
| `settings.stats.today` | `{date}` | 今日 `YYYY-MM-DD` |

- 差し込みのない変種：`task.cheer.at7`、`.at30`、`.at100`（累計が 7、30、100 のとき）は差し込みを持ちません（identifiers.md の 3 の例外。`data-testid` には使わない）。変種の `task.next.note.last` は design r9 から `{area}`、`{level}` を持ちます（上の表。`data-testid` に使わないのは同じ）。

- 日付は両言語とも ISO 8601 の `YYYY-MM-DD` です（design の U-2。Takuma の決定 D2、2026-10-30）。

## 4. 画面に文字を出す方法
- 文字は `textContent`（か `createTextNode`）でだけ入れます。`innerHTML`、`outerHTML`、`insertAdjacentHTML`、`document.write` は使いません。
- 本番の CSP の `require-trusted-types-for 'script'`（budgets.md の 3）により、Chromium と Safari 26 以降ではこれらの代入が TypeError で止まります。受け入れテストは Chromium と WebKit で動くので、使えば落ちます。

## 5. 課題集（schemas/tasks.schema.json。ADR 0006）
### 5.1 ファイル
- 課題集は日本語だけです（PRD Q4）。英語の画面でも本文は日本語のまま出します。
- 1 領域 1 ファイル：`backend/public/data/tasks-<領域>.json`（配布物の中では `./data/tasks-<領域>.json`。領域は identifiers.md の 5 の 6 つ）。1 ファイルに 3 段階すべてを入れます。`tasks.json` はなくします。
- 形：`{ "formatVersion": 2, "area": "<領域>", "tasks": [ … ] }`。`formatVersion` 2 は「選んで学ぶ」型です（1 は r10 の `why`、`how`、`goal`、`tools` の型で、もう読みません）。
- スキーマが確かめること：`tasks` のすべての `area` と、ID の `<領域>` がトップの `area` と同じ。ID の `<段階>` が `level` と同じ。
- スキーマで書けないこと（手書きの検査。build.mjs、check-schemas.mjs、受け入れテストが同じ決まりを当てる）：
  - ファイル名の `<領域>` とトップの `area` が同じ。
  - ID が 6 ファイルを合わせて重ならない（AC-4）。
  - 図の `highlight` が `labels` の数より小さい。
  - 同じ問の 3 つの選択肢で、`text` が互いに異なり、`explain` も互いに異なる（AC-29）。
  - 6 ファイルを合わせた全問で、正解の位置（`answer` の 0、1、2）ごとの件数がどれも全体の 20% 以上 50% 以下（AC-29。v1 は 378 問）。
  - 文の調子（7.3。AC-43）と初級の決まり（7.4。AC-34）。
- 読み込んだファイルが手書きの検査「ファイル名の領域とトップの `area` が同じ」に通らないときは、取れなかったときと同じに扱います（D-61：S2 は `error.tasks.offline` と `task.next.retry`、S10 は `history.row.unavailable`）。新しい文言キーは足しません。配る前に build.mjs が 6 ファイルすべてをスキーマと手書きの検査に通し、1 つでも落ちればビルドを止めるので、本番では起きない前提です。

### 5.2 項目と出す場所（字数はすべてコードポイント）
| 項目 | 字数 | 改行 | 行内のコード | 出す場所 |
|---|---|---|---|---|
| `title` | 1〜60 | なし | なし | `task.today.title`、`task.done.task` の `{title}`、S10 の行 |
| `intro` | 1〜300 | なし | あり | `task.intro.text`（`<p>` 1 つ） |
| `figure`（必須） | — | — | — | 導入の `task.figure`（`data-figure-of="intro"`） |
| `questions` | ちょうど 3 件 | — | — | `task.question`（`data-question-number` 1〜3） |
| `questions[].text` | 1〜100 | なし | あり | `task.question.text` |
| `questions[].figure`（任意） | — | — | — | 問の `task.figure`（`data-figure-of="question"`） |
| `questions[].choices` | ちょうど 3 件 | — | — | `task.choice`（`data-choice-index` 0〜2） |
| `choices[].text` | 1〜40 | なし | あり | `task.choice` の文字 |
| `choices[].explain` | 1〜120 | なし | あり | `task.question.explain`（AC-41） |
| `questions[].answer` | 整数 0〜2 | — | — | 正解の `choices` の index。`data-choice-state`、`data-answer-result` を決める |
| `insight` | 1〜120 | なし | なし | `task.insight.text`（`task.rate` と `task.done` だけ。AC-38） |
| `figure.type` | 6 つの ID | — | — | `data-figure-type`（flow、layers、compare、sequence、tree、split） |
| `figure.labels` | 型ごとの数、各 1〜12 | なし | なし | `task.figure.label`（文字は labels の文字列と等しい：AC-44） |
| `figure.highlight`（任意） | 整数、labels の数より小さい | — | — | `data-figure-highlight`。ないときは強調なし |
| `figure.alt` | 1〜80 | なし | なし | `task.figure` の `aria-label`（AC-44） |

- 型ごとのラベルの数（PRD r13 の AC-29、design r13 の D-51）：flow 2〜5、layers 2〜5、compare 4、6、8（見出し 2 と、2 つずつの行 1〜3）、sequence 2〜5、tree 3〜5（親 1 と子 2〜4）、split 3〜4（1 → 2〜3）。
- `mode` は v1 では `in_app` だけを受け付けます（P-1、AC-29）。`external` は identifiers.md の 5 の語彙に残しますが、課題集のスキーマでは拒みます。`tools` は項目ごと外しました（`additionalProperties: false` で拒む。PRD の「存在しないか空の配列」より厳しい側）。
- `minutes` は 1〜15 の整数（AC-3）。初級は 10 以下（7.4）。
- すべての文字の項目で：前後の空白を除いて 1 字以上（`\S` を含む）、改行（`\r`、`\n`）なし、連続する 3 つのバッククォート（コードブロック）なし、`http://` と `https://` なし（AC-29）。

### 5.3 画面での出し方
- 本文はプレーンな文字列です。HTML、Markdown のコードブロック、URL のリンクにはしません。
- 行内のコード（5.2 の表で「あり」の項目だけ）：前後をバッククォート（1 文字ずつ）で囲んだ部分を `<code>` にします（中身は textContent）。閉じていないバッククォートは文字のまま出します。「なし」の項目はスキーマがバッククォートを拒みます（`insight` は AC-38、`labels` は画面の文字と labels を等しくするため、`alt` は読み上げに記号を出さないため）。
- `<pre>` は使いません（AC-17 の横スクロール 0）。`<code>` は `overflow-wrap: anywhere` で折り返します。
- 字数の上限はコードポイントで数えます（ajv の `maxLength` もコードポイントで数える。fixtures/tasks/valid-boundary-lengths.json は 𠮷 を含めて上限ちょうど）。

## 6. JS が動く前の文（静的な HTML）
- `app.loading` と `app.noscript` は、ビルドの手順（ADR 0001）が ja と en のファイルから「日本語 / 英語」の形で HTML に書き込みます（tech-lead G1 r1 の P2、design の S0）。
- 静的な HTML の `<title>` と、ヘッダーの `app.name` も、ビルドの手順が ja.json の値を書き込みます。`app.name` の値は ja と en の両方で「今日の一手」です（Takuma の決定 D3、2026-10-30。ローマ字や英語名は置かない）。strings.schema.json は `app.name` をこの値に固定しています（fixtures/strings/invalid-app-name-english.json が落ちる見本）。manifest の `name` と `short_name`、`apple-mobile-web-app-title` も同じ値です（budgets.md の 6）。

## 7. 語と文の検査（AC-34、AC-35、AC-42、AC-43、AC-45）
語は contracts/tools/check-schemas.mjs の `WORDS_JA`、`WORDS_JA_ONLY`、`WORDS_EN`、`GUIDE_JA`、`GUIDE_EN`、`AC43_*`、`AC34_WORDS` と同じです。語を変えるときは、この節と check-schemas.mjs を一緒に直します（tech-lead）。契約の検査は fixtures/ の見本に、受け入れテストは本番の `backend/public/i18n/*.json` と `backend/public/data/tasks-*.json`（6 ファイル）に同じ決まりを当てます。

### 7.1 文言ファイルの全キー（AC-35、AC-42、D-65）
- 対象：`ja.json` と `en.json` の全キーの値（194 × 2）。課題集は含めません（課題集は 7.3、7.4）。
- 日本語の語（部分一致で 0 件）：「連続」「途切れ」「逃した」（AC-35）、「点数」「得点」「満点」「ランク」「レベルアップ」と、正規表現 `/[0-9０-９]点/`（AC-42）。ja.json と en.json の両方の値に当てます。「採点」「観点」「時点」「要点」は当たりません（fixtures/strings/valid-ja-words-not-banned.json）。
- 「XP」：大文字と小文字を区別しない部分一致 `/XP/i` で 0 件。ja.json の値にだけ当てます（en.json に当てると explanation、expect に当たるため。en は次の単語の検査で見る）。
- 英語の語：`/\b(streak|missed|points?|score|rank|xp|level up)\b/i` が 0 件（単語の境界で比べ、大文字小文字を区別しない。AC-35、AC-42）。ja.json と en.json の両方の値に当てます。`dismissed`、`scores`、`ranked` は当たりません（valid-en-words-not-banned.json）。数は「問」で書きます（`task.rate.score` の値も対象）。

### 7.2 案内役の台詞と段階の知らせ（AC-45、D-55）
- 対象：キーが `guide.` か `task.level.adjusted.` で始まる値（15 + 2 個）。ja.json と en.json の両方に、次の両方を当てます。
- 日本語の語（部分一致で 0 件）：「残念」「ダメ」「失敗」「間違い」「不正解」「サボ」「まだやって」。
- 英語の語：`/\b(fail|failed|failure|wrong|stupid|lazy)\b/i` が 0 件。
- 字数：`guide.*` の値は ja と en とも 1〜40 字（コードポイント）。strings.schema.json が `maxLength: 40` で確かめます（invalid-guide-41-codepoints.json）。

### 7.3 課題集の文の調子（AC-43。全件）
- 対象：各課題の `intro`、各問の `text`、各選択肢の `explain`、`insight`。項目ごとに当て、項目をまたいでは数えません（`title`、`choices[].text`、`labels`、`alt` は対象外）。
- 1 文は 60 字以下（コードポイント）。区切り：「。」「！」「？」（全角）の直後で切ります。行内の `code` の中の「。」でも切り、`code` の中の字も数えます。空の文は捨て、末尾に句点がなくても最後の文として数えます（JS では `s.split(/(?<=[。！？])/)`）。
- 語（部分一致で 0 件）：「書き出し」「書き出す」「メモし」「書いてみ」「書きまし」「ノートに」。
- 命令形：「しなさい」は部分一致で 0 件。「せよ」は文末（直後が「。」「！」「？」か文字列の末尾：`/せよ(?=[。！？]|$)/`）だけを数え、0 件。「させよう」「いずれにせよ、」は当たりません（valid-sentence-rule-edges.json）。
- です・ます：`intro` と各問の `text` のそれぞれに、「です」「ます」「でしょう」「ましょう」「ください」のどれかが 1 回以上。
- 機械で検査しないこと：「問題文が場面から始まる」「2 人称が『あなた』」（指揮役が 126 件を読んで記録する。PRD AC-43 の確かめ方）。

### 7.4 初級の課題集（AC-34）
- 対象：`level` が `beginner` の全件。
- 所要時間：`minutes` が 10 以下。
- 語：`intro`、各問の `text`、各選択肢の `explain`、`insight` から、半角の空白（U+0020）と全角の空白（U+3000）を除いてから、「自分のAPI」「自分のリポジトリ」「自分のサービス」「自分のチーム」「実務で」「業務で」の部分一致が 0 件（語の側も空白を除いた形。「自分の API」も「実務 で」も当たる）。項目ごとに比べ、項目をまたいだ一致は数えません。
- r10 の道具の条件（`tools` に「ブラウザ」か「開発者ツール」）は、`tools` がなくなったので外しました（PRD r13 の AC-34）。
- 用語を本文で説明しているかは機械で検査しません（指揮役が初級の 42 件を読んで docs/approvals/ に残す）。
