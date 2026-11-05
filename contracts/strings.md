# 文言と本文の決まり（001-daily-learning）

形は schemas/strings.schema.json です。文の原本は design/001-daily-learning.md の 7（日英の表）です。
AC-26、AC-34、AC-35、つなぎ口 W-14。

## 1. 文言ファイル
- 置き場所：`backend/public/i18n/ja.json` と `backend/public/i18n/en.json`（配布物の中では `./i18n/ja.json`、`./i18n/en.json`）。
- 形：平らなキーの JSON（入れ子にしない。`settings.import` と `settings.import.note` が両方あるため）。値は空でない文字列。
- ja と en は、どちらも strings.schema.json に通ります。スキーマは 174 個のキーをすべて必須にし、それ以外のキーを拒むので、2 つのファイルのキーの集合は必ず同じになります（AC-26 の「片方にしかないキー 0 件」）。
- 差し込みのあるキー（25 個。3 の表）は、スキーマがその差し込みの名前を含むことを求めます。差し込みのないキー（149 個）は `{` と `}` を含めません。ja と en で、キーごとの差し込みの名前の集合は同じです（contracts/tools/check-schemas.mjs が valid-ja と valid-en で確かめる）。
- キーの数は 146 → 170（design r7：28 個を足し、`task.done.message`、`task.skipped.message`、`task.exhausted.message`、`task.exhausted.detail` を消した）→ 174（design r8：`task.progress.done`、`task.next.note.last`、`task.skipped.levelChanged`、`task.exhausted.nextDone` を足した）。
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

差し込みのあるキーは次の 25 個です（schemas/strings.schema.json の pattern、fixtures/strings/valid-ja.json と同じ）。「en は plural」の 5 個は、en の値が `{name, plural, …}` の形で、ja は数だけです。

| キー | 差し込み | 入れる値 |
|---|---|---|
| `diagnosis.progress` | `{n}`、`{total}` | 質問の番号、3 |
| `diagnosis.q2.legend` | `{area}` | `area.<ID>` の文言 |
| `task.today.label` | `{date}` | 今日 `YYYY-MM-DD`（その日の 1 件目） |
| `task.today.label.nth` | `{nth}`、`{date}` | `data-task-nth-today` と同じ整数（2 以上）、今日 `YYYY-MM-DD` |
| `task.progress` | `{index}`、`{total}` | S3 の `data-progress-index`、`data-progress-total` と同じ整数（identifiers.md の 4） |
| `task.meta` | `{area}`、`{level}`、`{minutes}` | `area.<ID>`、`level.<ID>` の文言、所要時間の整数（en は plural） |
| `task.answer.limit` | `{max}` | 2000 |
| `task.total.value` | `{count}` | 累計の完了件数。`data-stat-completed` と同じ整数（en は plural）。S4 の `task.total.prev` も同じ文言で、`{count}` は 1 少ない整数 |
| `task.progress.done` | `{index}`、`{total}` | `task.progress.done` の要素の `data-progress-index`、`data-progress-total` と同じ整数（完了した課題の S3 と同じ値） |
| `task.cheer.default` | `{count}` | `task.total.value` と同じ整数（累計が 7、30、100 以外のとき。`data-milestone` は `none`） |
| `task.done.task` | `{title}` | 課題の題名 |
| `task.week` | `{days}` | `data-stat-days-completed-week` と同じ整数（0〜7） |
| `task.skipped.levelChanged` | `{level}` | 変わった先の段階の `level.<ID>` の文言 |
| `task.exhausted.levelDone` | `{area}`、`{level}` | 今の組の `area.<ID>`、`level.<ID>` の文言 |
| `task.exhausted.levelDone.detail` | `{total}` | 今の組の課題の総数（`data-progress-total` と同じ数え方。en は plural） |
| `task.exhausted.next` | `{nextLevel}`、`{desc}` | 次の段階の `level.<ID>` の文言、その `level.<ID>.desc` の文言（句点なし） |
| `task.exhausted.seenNext` | `{nextLevel}` | 次の段階の `level.<ID>` の文言 |
| `task.exhausted.nextDone` | `{nextLevel}` | 次の段階の `level.<ID>` の文言 |
| `task.exhausted.advance` | `{nextLevel}` | 次の段階の `level.<ID>` の文言 |
| `task.exhausted.allDone` | `{area}` | 今の組の `area.<ID>` の文言 |
| `task.exhausted.allDone.detail` | `{total}` | 上級の組の課題の総数（en は plural） |
| `settings.import.confirm.summary` | `{count}`、`{date}` | ファイルの `history` の行数（en は plural）、`firstOpenDate` |
| `settings.diagnosis.current` | `{area}`、`{level}` | 今の目標の領域と `levels[area]` の文言 |
| `settings.version` | `{version}` | `data-build-version` と同じ値 |
| `settings.stats.today` | `{date}` | 今日 `YYYY-MM-DD` |

- 差し込みのない変種：`task.cheer.at7`、`.at30`、`.at100`（累計が 7、30、100 のとき）と `task.next.note.last` は差し込みを持ちません（identifiers.md の 3 の例外。`data-testid` には使わない）。

- 日付は両言語とも ISO 8601 の `YYYY-MM-DD` です（design の U-2。Takuma の決定 D2、2026-10-30）。

## 4. 画面に文字を出す方法
- 文字は `textContent`（か `createTextNode`）でだけ入れます。`innerHTML`、`outerHTML`、`insertAdjacentHTML`、`document.write` は使いません。
- 本番の CSP の `require-trusted-types-for 'script'`（budgets.md の 3）により、Chromium と Safari 26 以降ではこれらの代入が TypeError で止まります。受け入れテストは Chromium と WebKit で動くので、使えば落ちます。

## 5. 課題の本文（課題集の title、why、how、goal、tools）
- 課題集は日本語だけです（PRD Q4）。英語の画面でも本文は日本語のまま出します。
- 本文はプレーンな文字列です。HTML、Markdown のコードブロック（```）、URL のリンクにはしません。
- 段落：`\n` で分けます。`task.why.text`、`task.how.text`、`task.goal.text` の要素は入れ物で、空でない 1 行ごとに `<p>` を 1 つ作ります。
- 行内のコード：前後をバッククォート（1 文字ずつ）で囲んだ部分を `<code>` にします（中身は textContent）。閉じていないバッククォートは文字のまま出します。
- `<pre>` は使いません（AC-17 の横スクロール 0）。`<code>` は `overflow-wrap: anywhere` で折り返します。
- 題名 `title` は改行を含みません（スキーマで拒む）。

## 6. JS が動く前の文（静的な HTML）
- `app.loading` と `app.noscript` は、ビルドの手順（ADR 0001）が ja と en のファイルから「日本語 / 英語」の形で HTML に書き込みます（tech-lead G1 r1 の P2、design の S0）。
- 静的な HTML の `<title>` と、ヘッダーの `app.name` も、ビルドの手順が ja.json の値を書き込みます。`app.name` の値は ja と en の両方で「今日の一手」です（Takuma の決定 D3、2026-10-30。ローマ字や英語名は置かない）。strings.schema.json は `app.name` をこの値に固定しています（fixtures/strings/invalid-app-name-english.json が落ちる見本）。manifest の `name` と `short_name`、`apple-mobile-web-app-title` も同じ値です（budgets.md の 6）。

## 7. 語の検査（AC-34、AC-35）
語は contracts/tools/check-schemas.mjs の `AC35_JA`、`AC35_EN`、`AC34_WORDS`、`AC34_TOOLS` と同じです。語を変えるときは、この節と check-schemas.mjs を一緒に直します（tech-lead）。契約の検査は fixtures/ の見本に、受け入れテストは本番の `backend/public/i18n/*.json` と `backend/public/data/tasks.json` に同じ決まりを当てます。

### 7.1 文言ファイル（AC-35）
- 対象：`ja.json` と `en.json` の全キーの値（174 × 2）。課題集の本文と解説（tasks.json の `title`、`why`、`how`、`goal`、`tools`、`insight`）は含めません。
- ja：値に「連続」「途切れ」「逃した」が部分一致で 0 件（「途切れない」も当たる。意図どおり）。ja.json だけでなく en.json の値にも当てます。
- en：値に `/\b(streak|missed)\b/i` が 0 件（単語の境界で比べるので `dismissed` は当たらない）。PRD は大文字と小文字の扱いを決めていないので、厳しい側の `i` を付けます（tech-lead G1 r2 の (g)）。ja.json の値にも当てます。

### 7.2 初級の課題集（AC-34）
- 対象：tasks.json のうち `level` が `beginner` の全件。
- 所要時間：`minutes` が 10 以下。
- 語：本文の 4 要素（`title`、`why`、`how`、`goal`）と解説 `insight` から、半角の空白（U+0020）と全角の空白（U+3000）を除いてから、「自分のAPI」「自分のリポジトリ」「自分のサービス」「自分のチーム」「実務で」「業務で」の部分一致が 0 件（語の側も空白を除いた形。「自分の API」も「自分のAPI」も当たる）。要素ごとに比べ、要素をまたいだ一致は数えません（check-schemas.mjs は要素を `\n` でつないでから比べるので同じ結果）。
- 道具：`mode` が `external` の全件で、`tools` のすべての項目が、空白を除いた後に「ブラウザ」か「開発者ツール」を部分一致で含む（端末、エディタ、リポジトリを要らない）。
- 用語を本文で説明しているかは機械で検査しません（PRD の AC-34 の「確かめ方」。指揮役が読んで docs/approvals/ に残す）。
