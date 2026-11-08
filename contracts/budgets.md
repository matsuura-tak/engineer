# 予算、CSP、対応ブラウザ（001-daily-learning）

PRD 12（速さ、配布、対応ブラウザ）と AC-15、AC-17 を、作り手が守れる数字にしたものです。
判断の理由は docs/adr/0001-web-foundation-no-build-es-modules.md と docs/adr/0005-csp-and-trust-boundaries.md。

## 1. 転送量（PRD 12：初回の転送量は圧縮後 150 KB 以下。2026-11-06 に 2 つの枠に分けた：ADR 0006、0007、0008）
- 数え方：ファイルごとに gzip の最大圧縮（node の `zlib.gzipSync(buf, { level: 9 })`）にした大きさ。正は zlib の値です（`gzip -9` の CLI は実装により数十バイト違う）。PNG（アイコンとミル）は gzip がほとんど効かないので、生のバイト数で数えます（ADR 0008）。KB は 1,000 バイトとして読みます（1,024 より厳しい側）。
- JS はまとめた後の `./js/app.js` 1 つと `./sw.js` で数えます（ADR 0007。ソースのモジュールごとの大きさは数えない。ファイルの数の上限 15 はなくした）。
- 枠は 2 つです。
  - A. 初回に読む分（PRD 12 の 150 KB）：保存データのない初めての訪問で、画面が要求するもの。殻 + 文言 2 つ + アイコンと manifest + ミル 3 枚（S1 の 1 枚と、S3 を描いた時点で先読みする correct と incorrect の 2 枚。ADR 0008 の「先読み」）+ 課題集の 1 ファイル（初回の診断の 1 問目の領域）。上限 150,000 バイト。
  - B. SW が貯める分：service-worker.md の 3 の FILES のすべて（課題集 6 ファイルとミル 8 枚を含む）。上限 400,000 バイト。端末の保存の量（Cache Storage）と、初めての訪問の 2 回目の取得（下）の上限を決めるための枠で、PRD 12 の数字ではありません。
- 内訳の上限（どれかを超えるときは、tech-lead が他を減らして A と B を守る。課題集の枠からは取らない）：

| 部分 | 上限（バイト） | A に数える | B に数える | 根拠 |
|---|---|---|---|---|
| 殻（`index.html`、CSS、`./js/app.js`、`./sw.js`。gzip 後） | 32,000 | 32,000 | 32,000 | G1 tech-lead r3 の 8：esbuild でまとめる形で 26,700〜29,300［推測］。2026-11-06 の実物（まとめる前）は 30,022。ADR 0007 の見直す条件もこの枠で見る |
| 文言（`ja.json` と `en.json` の 2 つ。gzip 後） | 10,000 | 10,000 | 10,000 | 2026-11-06 に 9,000 から上げた（G1 tech-lead r3 の提案 4）。design の 7 の表（189 キー）から作ると 4,754 + 4,078 = 8,832。194 キーの fixtures/strings の値は G2 で実物を測る |
| ホーム画面のアイコン `icon-180.png`（生）と `manifest.webmanifest`（gzip 後） | 4,000 | 4,000 | 4,000 | 変えない（2026-11-04 の見直し）。G2 r3 の実装で 2,173 |
| ミル（`./img/miru-*.png`、生） | 1 枚 600、8 枚の合計 4,000 | 1,800（3 枚。2026-11-08 に 1 枚から直した：S3 の先読みの 2 枚を数える。G1 reviewer r3 の提案） | 4,000（8 枚） | ADR 0008：48×48 の索引色で 1 枚 382〜411、8 枚で 3,140（2026-11-06 の `file` と大きさ） |
| 課題集の 1 ファイル（`./data/tasks-<領域>.json`、gzip 後） | 50,000 | 50,000（1 ファイル） | 300,000（6 ファイル） | ADR 0006。G1 tech-lead r3 の 8：6 領域で 1 ファイル約 30,000〜32,000［推測］。2 の平均の上限とあわせて決めた |
| 合計 | — | 97,800（上限 150,000） | 350,000（上限 400,000） | — |

- A の余り（52,200）は、課題集の 2 ファイル目のためにとっておきます。診断済みのデータで、キャッシュのないブラウザが開くとき（AC-15、やり直しの診断の後の `current.area` が `diagnosis.area` と違うとき）は、起動で 2 ファイルまで読みます（data.md の 4「課題集のファイル」）。そのときも 97,800 + 50,000 = 147,800 で 150,000 に収まります。3 ファイル目（`history` の最後の行が今日の別の領域の行）は、同じ日にやり直しと完了を重ねたときだけで、その端末では SW が貯めているので数えません。
- 検査：`node scripts/check-budget.mjs <配布物のフォルダ>`（backend-engineer）。A と B と内訳の上限を出し、A か B のどちらかを超えたら終了コード 1。A の課題集には、6 ファイルのうち最大のものを数えます。A のミルには、8 枚のうち大きい方から 3 枚を数えます（どの配色と表情の組でも上限の側になる）。G3 の証拠には、ファイルごとの大きさと A、B の合計を出した出力を貼ります。2026-11-06 の時点の check-budget.mjs は 1 つの合計で見る前の形で、直しは backend-engineer に頼む（設計メモの 10）。
- 公開後：本番の URL のファイルを `curl --compressed` で取った転送量で、A の内訳を数えます（GitHub Pages は gzip を返す。br は返さない：tech-lead G1 r1 の curl）。
- 見直す条件（ADR 0006）：最大の 1 ファイルが 40,000 を超える、または A が 130,000（枠の約 87%）を超えたら、18 組に分ける案を考え直す。
- 初めての訪問では、SW が FILES を `cache: 'reload'` でもう一度取ります（service-worker.md の 3）。実際の通信は A + B（最大 550,000 バイト）です。SW の登録は最初の画面を描いた後なので、AC-15 の 2 秒には入りません（service-worker.md の 1）。
- これまでの枠（1 つの合計 150,000 の内訳：殻 32,000、文言 9,000、アイコンと manifest 4,000、課題集 tasks.json 105,000）と、その見直しの記録（2026-11-04、2026-11-05）は git の履歴（コミット 94bcc6a の時点のこのファイル）にあります。

## 2. 課題集の長さ（pdm が課題集 v3 を書く前に知らせる。指揮役の裁定 E5。2026-11-06 に PRD r13 の型に改めた）
- 1 件ごとの上限（スキーマ schemas/tasks.schema.json で落とす。字数はコードポイント）：
  - 題名 `title` 60、導入 `intro` 300、解説 `insight` 120、所要時間 `minutes` は 1〜15 の整数。
  - 問 `questions` はちょうど 3。問の文 `text` 100。選択肢 `choices` はちょうど 3 で、`text` 40、説明 `explain` 120。正解 `answer` は 0〜2。
  - 図 `figure`（導入と問に任意）：ラベル `labels` は各 1〜12 字、数は型ごと（比較は 4、6、8。他は 2〜5 か 3〜5 か 3〜4：スキーマの allOf）、強調 `highlight` はラベルの位置、説明 `alt` 80。
  - 1 件の最大は、図なしで 2,220 字（60 + 300 + 120 + 3 ×（100 + 3 ×（40 + 120）））、図を 4 つ（導入と 3 問）に置くと約 2,900 字です。上限いっぱいで書く前提ではありません。
- 全体の上限（受け入れテストで数える。JSON Schema では書けない）：
  - 数える項目：`title`、`intro`、`insight`、各問の `text`、各選択肢の `text` と `explain`、図の `labels` と `alt`。1 件ごとの合計を、全件（6 ファイルを合わせて）で割った平均が 1,200 字以下。
  - 6 ファイルのどれも、gzip 後 50,000 バイト以下（1 の表）。これが本当の歯止めで、平均はその手前の約束です（pdm の下書きの目安）。
  - 字数は JS の文字列の長さではなく、コードポイントの数（`[...str].length`）で数える。
  - この 2 つのテストの名前は `BUDGET2_` で始めます（test-hooks.md の W-6）。PRD の AC ではないので `AC<番号>_` の名前を付けず、G3 の AC の表に混ぜません。検証レポートでは「予算」の行として別に書きます。
- 1,200 の根拠［推測。2026-11-08 に測り直した：G1 reviewer r3 の要修正 4］：
  - 1 字あたり：r10 の型の backend/public/data/tasks.json（210 件）で、`id`、`area`、`level`、`mode`、`type` を除いた文字列の平均は 391.6 字、gzip 後 69,313 バイトで、1 字あたり約 0.843 バイト（JSON の項目名を含む。reviewer の測り方では 390.6 字、0.845）。前に書いた「平均約 410 字、0.69 バイト」は計算が合っていませんでした（69,313 ÷（210 × 410）= 0.805）。
  - 領域ごとのファイルは縮みにくい：1 件あたり、1 つのファイルの 330 バイトに対し、領域ごとでは 358 バイト（ADR 0006 の確かめたことの backend 35 件 12,525）〜 360 バイト（2026-11-08 に tech-lead が backend を JSON に書き直して測った 12,613）で、約 8〜9% 悪い。
  - 見積もり：平均 1,200 字なら 1,200 × 0.845 ≒ 1,010 バイト、項目名の増え（問と選択肢で約 +150）で約 1,160、領域ごとの悪化 8% で 1 件約 1,260 バイト。1 領域 21 件（v1 の 126 件）で約 26,500、28 件（168 件版。2026-12-21）で約 35,300 で、50,000 にも見直しの線 40,000（1 の「見直す条件」）にも収まります。
  - PRD r13 にない 252 件版（1 領域 42 件）は約 52,900 で 50,000 を超えます。その版を作るときは、平均を約 1,100 字以下に下げるか、ADR 0006 の見直し（40,000 の線）を先に行います。前に書いた「252 件版で約 41,000」は誤りでした。
  - 実物の値は、pdm の下書きが出たら G2 で数え直し、外れていたらこの平均を直します（ファイルの枠 50,000 は変えない）。
- 合成の文で見積もる試し（文言の見本を切り貼りして 28 件を作る）は、元の文が短く同じ断片が繰り返して縮みすぎたので、根拠に使っていません（設計メモの 4）。
- 前の値（4 つの本文と解説で平均 480 字、tasks.json 105,000 バイト）は r10 の型の 1 ファイルの課題集で決めたもので、git の履歴にあります。

## 3. CSP（本番の HTML の `<meta http-equiv="Content-Security-Policy">` に 1 つだけ）
```
default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'; require-trusted-types-for 'script'; trusted-types kyounoitte-sw
```
- 確かめ方：`grep -c 'http-equiv="Content-Security-Policy"' <配布物>/index.html` が 1（PRD 12）。文字列は上と 1 文字も違わないことを単体テストで比べる。
- インラインの `<script>`、`<style>`、`style="…"` 属性、`on…="…"` 属性は書けません。CSSOM（`el.style.setProperty`）での値の設定はできます。
- `require-trusted-types-for 'script'` と `trusted-types kyounoitte-sw`：`innerHTML` などへの文字列の代入を止め、作ってよいポリシーを SW の登録用の 1 つに限ります（strings.md の 4、service-worker.md の 1）。Safari 17〜25 はこの 2 つを知らないので無視し、Chromium と Safari 26 以降で効きます（MDN の互換データ 8.1.7：safari 26、chrome 83）。
  - spike（2026-10-30、Playwright 1.64.1、Chromium 156 と WebKit 27.2）：この CSP の下で、innerHTML への代入は両方で TypeError になり、Playwright の addInitScript、click、fill と @axe-core/playwright 4.14.0 の監査は両方で動いた（わざと置いた label のない textarea を `label:critical` で見つけた）。
- meta の CSP では `frame-ancestors` が効きません。代わりに、枠の中で開かれたら始めない（data.md の 4 の 1。ADR 0005）。
- 外の origin への通信、Web フォント、外部の画像はありません。

## 4. 読み込みの順番（AC-15）
- 静的な HTML の `<head>` に、`<link rel="modulepreload" href="./js/app.js">` を 1 つ（ADR 0007）と、`<link rel="preload" as="fetch" crossorigin>` を `./i18n/ja.json` と `./i18n/en.json` に置きます（spike では、置くと約 330 ms 速くなった）。言語は JS が動くまで決まらないので、文言は 2 つとも先に取ります。
- 課題集は preload しません。どの領域のファイルが要るかは保存データを読むまで決まらないためです（data.md の 4「課題集のファイル」）。app.js は保存データを読んだらすぐ、要る領域のファイルを並べて取り始めます。
- すべての URL は相対（`./…`）にします。本番は `/engineer/` の下で動くので、`/` で始まる URL は使いません。

## 5. 対応ブラウザと、使わない機能
- 対応：Safari 17 以上（iOS、iPadOS、macOS）と Chrome の最新 2 版（Android、PC）。自動テストは Playwright の Chromium と WebKit（WebKit は Safari 17 そのものではない）。実機の Safari は G4 で Takuma が確かめます。
- Safari 17.0 にない機能は使いません。主な例（MDN の互換データ @mdn/browser-compat-data 8.1.7 を 2026-10-30 に引いた値）：

| 使わない | Safari で使えるのは | 代わり |
|---|---|---|
| import attributes（`with { type: 'json' }`） | 17.2 | `fetch` と `response.json()` |
| CSS の入れ子 | 17.2 | 平らなセレクタ |
| `Promise.withResolvers` | 17.4 | `new Promise` |
| `Object.groupBy` | 17.4 | `reduce` |
| `Element.checkVisibility` | 17.4 | `getBoundingClientRect` |
| CSS の `light-dark()` | 17.5 | `@media (prefers-color-scheme: dark)` |
| `@starting-style`、`text-wrap: balance` | 17.5 | 使わない |
| Iterator helpers（`.map` など） | 18.4 | 配列にしてから |
| `URL.parse` | 18 | `new URL` と try |
| `<dialog closedby>` | なし（iOS） | Escape は `cancel` イベント |

- 使ってよい（同じ互換データで Safari 17 以下）：ES modules、`<link rel="modulepreload">`（17）、`<dialog>` と `showModal`（15.4）、`StorageManager.persist` と `persisted`（15.2。persisted は https://github.com/mdn/browser-compat-data の api/StorageManager.json で 2026-11-04 に確認）、`Blob.text`（14）、`Intl.PluralRules`（13）、`Set.prototype.union`（17）、`URL.canParse`（17）、`structuredClone`（15.4）、`:has()`（15.4）、`overflow-wrap: anywhere`（15.4）、`display-mode` のメディアクエリ（13）。
- 完了の演出で使う（design の D-43。MDN の互換データ @mdn/browser-compat-data 8.1.8 の main を 2026-11-05 に引いた値。どれも Safari 17.0 より前から使える）：

| 機能 | Safari（macOS、iOS は mirror） | Chrome | 根拠 |
|---|---|---|---|
| SVG の `pathLength` 属性（`<path>`） | 14 | 50 | https://github.com/mdn/browser-compat-data/blob/main/svg/elements/path.json の `pathLength`。https://developer.mozilla.org/docs/Web/SVG/Reference/Attribute/pathLength |
| SVG の `pathLength` 属性（`<circle>`） | 14 | 57 | https://github.com/mdn/browser-compat-data/blob/main/svg/elements/circle.json の `pathLength` |
| CSS の `@keyframes`（接頭辞なし） | 9 | 43 | https://github.com/mdn/browser-compat-data/blob/main/css/at-rules/keyframes.json 。https://developer.mozilla.org/docs/Web/CSS/Reference/At-rules/@keyframes |
| CSS の `animation`（接頭辞なし） | 9 | 43 | https://github.com/mdn/browser-compat-data/blob/main/css/properties/animation.json |
| CSS の `stroke-dashoffset` と `stroke-dasharray` | 4 | 1 | https://github.com/mdn/browser-compat-data/blob/main/css/properties/stroke-dashoffset.json と stroke-dasharray.json。長さの値なので @keyframes で補間される（https://drafts.csswg.org/fill-stroke-3/#stroke-dashoffset ） |
| `@media (prefers-reduced-motion)` と `matchMedia` での読み | 10.1 | 74 | https://github.com/mdn/browser-compat-data/blob/main/css/at-rules/media.json の `prefers-reduced-motion`。https://developer.mozilla.org/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion |

  - 互換データには「@keyframes で stroke-dashoffset を動かす」組み合わせの行がない。Playwright の WebKit 27.2 と Chromium 156 で、`pathLength="1"`、`stroke-dasharray: 1`、`stroke-dashoffset` 1 → 0 の 400 ms のアニメーションが動き、`reducedMotion: 'reduce'` では動かないことを確かめた（test-hooks.md の「完了の演出の確かめ方」の spike）。WebKit 27.2 は Safari 17.0 ではないので、Safari 17 の実機での見た目は G4 で Takuma が確かめる（未確認）。
  - 実機で `pathLength` が効かなかったときの代わり：`pathLength` を外し、`stroke-dasharray` と `stroke-dashoffset` の始めの値に実長を書く。チェック `M6 12.5l4 4L18 8` は √32 + √136.25 ≈ 17.33（spike の `getTotalLength()` も両方で 17.33）、円 `r="10.5"` は 2π × 10.5 ≈ 65.97（`getTotalLength()` は WebKit 65.98、Chromium 65.55 の近似なので、計算した値を使う）。少し長めの値（チェック 18、円 66）にしても見た目は同じ。
  - アニメーションは `@media (prefers-reduced-motion: no-preference)` の中か、JS が `matchMedia('(prefers-reduced-motion: reduce)').matches` で付けるクラスだけで付ける（design の D-43）。
- 問、図、ミルで使う（2026-11-06。MDN の互換データ @mdn/browser-compat-data の main を raw.githubusercontent.com から引いた値。npm の最新は 8.1.8。どれも Safari 17.0 より前から使える。iOS の Safari はどれも mirror）：

| 機能 | Safari | Chrome | 根拠 |
|---|---|---|---|
| `<picture>` | 9.1 | 38 | https://github.com/mdn/browser-compat-data/blob/main/html/elements/picture.json |
| `<source media>`（`<picture>` の中で `prefers-color-scheme` を見る） | 3.1 | 3 | https://github.com/mdn/browser-compat-data/blob/main/html/elements/source.json の `media` |
| `image-rendering: pixelated` | 10 | 41 | https://github.com/mdn/browser-compat-data/blob/main/css/properties/image-rendering.json の `pixelated` |
| `overflow-wrap: anywhere`（図のラベル：D-50） | 15.4 | 80 | https://github.com/mdn/browser-compat-data/blob/main/css/properties/overflow-wrap.json の `anywhere` |

  - `<source>` は `media` だけを使い、`type`（AVIF、WebP）は使わない（ADR 0008）。
  - G1 tech-lead r3 の 9 は `accent-color` を Safari 15.4 と書いたが、2026-11-06 に引き直すと 26.2 だった（r3 の誤り）。下の「効かなくても困らないもの」のまま扱う。
- 効かなくても困らないもの：`accent-color`（Safari 26.2。https://github.com/mdn/browser-compat-data/blob/main/css/properties/accent-color.json 、2026-11-06）は radio がシステムの色になるだけ。`prefers-reduced-transparency`（Safari にない）は半透明のままになるだけ。
- reviewer は G2 で、上の「使わない」を grep で探します。

## 6. ホーム画面のアイコンと manifest（Takuma の決定 D5。design/001-daily-learning.md の 8 と D-29）
- ファイル（元は `backend/public/`、配布物のルートに置く。backend-engineer が作る）：
  - `./icon-180.png`：180 × 180 px の PNG 1 枚。ファイルの大きさ（生）も 4,000 バイト以下（2026-11-04 に 10,000 から下げた。1 の「枠の見直し」）。色、字、書体、作り方は design の 8。
  - `./manifest.webmanifest`：配るときの `Content-Type` は `application/manifest+json`。テスト用のサーバーはこの値を返します（test-hooks.md の「実行の環境」）。GitHub Pages が返す値は未確認で、公開後に `curl -sI https://matsuura-tak.github.io/engineer/manifest.webmanifest` で確かめます（G4）。
  - どちらも service-worker.md の 3 の FILES に入れ、1 の表の「ホーム画面のアイコンと manifest」の枠に数えます。
- manifest の中身は、次の 7 項目だけです（JSON。項目の順は問わない。これ以外の項目を置かない）：
  ```json
  {
    "name": "今日の一手",
    "short_name": "今日の一手",
    "lang": "ja",
    "start_url": "./",
    "scope": "./",
    "display": "standalone",
    "icons": [{ "src": "./icon-180.png", "sizes": "180x180", "type": "image/png" }]
  }
  ```
  - 置かない項目：`theme_color`、`background_color`（ダークモードと合わなくなる）、`description`、`id`、他の寸法のアイコン。英語版の manifest は作りません（D3）。
  - `start_url` にクエリを付けません（D6：イベントを記録しない。アプリは URL の引数も読まない：test-hooks.md）。
  - `name` と `short_name` は文言の `app.name`（ja と en の両方で「今日の一手」。strings.md の 6）と同じ値です。
- 静的な HTML の `<head>` に置くもの（URL はすべて相対。4）：
  ```html
  <title>今日の一手</title>
  <meta name="apple-mobile-web-app-title" content="今日の一手">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <link rel="apple-touch-icon" href="./icon-180.png">
  <link rel="manifest" href="./manifest.webmanifest">
  ```
  - `<title>` と `apple-mobile-web-app-title` の値はどちらも ja.json の `app.name` で、ビルドの手順が書き込みます（strings.md の 6、ADR 0001）。言語を決めた後も JS は `document.title` を変えません。
  - `apple-mobile-web-app-capable` は Apple の Safari HTML Reference にある（https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html 、2026-10-30 確認）。`apple-mobile-web-app-title` は Apple の公式の文書で見つけていない（未確認）。効かなくても、iOS は `<title>` か manifest の `name` を使い、どれも同じ値なので結果は同じです。
- CSP（3）との整合：manifest は `manifest-src 'self'`、アイコンは `img-src 'self'` で許されます。どちらも同じ origin の相対 URL なので、CSP の文字列は変えません。
- 確かめ方：
  - 単体テスト（backend-engineer。G2）：配布物の `manifest.webmanifest` を `JSON.parse` した値が上の JSON と深く等しい。`icon-180.png` の先頭 8 バイトが PNG の印、IHDR の幅と高さ（16〜23 バイト目）が 180 と 180、大きさが 4,000 バイト以下。`index.html` の `<head>` に上の 5 行がある。
  - 受け入れテスト（verifier）：テスト用のサーバーから `./manifest.webmanifest` と `./icon-180.png` が 200 と上の `Content-Type` で返り、一度読み込んだ後はオフラインでも Service Worker から返る（AC-12、AC-23 の範囲。どの AC の Then にもないので、足すかは verifier の判断）。
  - 実機（G4、Takuma）：iOS の Safari の「ホーム画面に追加」で、名前が「今日の一手」、アイコンが白地に「一」。
