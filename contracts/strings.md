# 文言と本文の決まり（001-daily-learning）

形は schemas/strings.schema.json です。文の原本は design/001-daily-learning.md の 7（日英の表）です。
AC-26、つなぎ口 W-14。

## 1. 文言ファイル
- 置き場所：`backend/public/i18n/ja.json` と `backend/public/i18n/en.json`（配布物の中では `./i18n/ja.json`、`./i18n/en.json`）。
- 形：平らなキーの JSON（入れ子にしない。`settings.import` と `settings.import.note` が両方あるため）。値は空でない文字列。
- ja と en は、どちらも strings.schema.json に通ります。スキーマは 146 個のキーをすべて必須にし、それ以外のキーを拒むので、2 つのファイルのキーの集合は必ず同じになります（AC-26 の「片方にしかないキー 0 件」）。
- 差し込みのあるキー（10 個）は、スキーマがその差し込みの名前を含むことを求めます。差し込みのないキーは `{` と `}` を含めません。
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

| キー | 差し込み | 入れる値 |
|---|---|---|
| `diagnosis.progress` | `{n}`、`{total}` | 質問の番号、3 |
| `diagnosis.q2.legend` | `{area}` | `area.<ID>` の文言 |
| `task.today.label` | `{date}` | 今日 `YYYY-MM-DD` |
| `task.meta` | `{area}`、`{level}`、`{minutes}` | `area.<ID>`、`level.<ID>` の文言、所要時間の整数（en は plural） |
| `task.answer.limit` | `{max}` | 2000 |
| `task.done.task` | `{title}` | 課題の題名 |
| `settings.import.confirm.summary` | `{count}`、`{date}` | ファイルの `history` の行数（en は plural）、`firstOpenDate` |
| `settings.diagnosis.current` | `{area}`、`{level}` | 今の目標の領域と `levels[area]` の文言 |
| `settings.version` | `{version}` | `data-build-version` と同じ値 |
| `settings.stats.today` | `{date}` | 今日 `YYYY-MM-DD` |

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
