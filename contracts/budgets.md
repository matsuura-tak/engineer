# 予算、CSP、対応ブラウザ（001-daily-learning）

PRD 12（速さ、配布、対応ブラウザ）と AC-15、AC-17 を、作り手が守れる数字にしたものです。
判断の理由は docs/adr/0001-web-foundation-no-build-es-modules.md と docs/adr/0005-csp-and-trust-boundaries.md。

## 1. 転送量（PRD 12：初回の転送量は圧縮後 150 KB 以下）
- 数え方：ビルドした配布物のフォルダのすべてのファイルを、それぞれ gzip の最大圧縮（node の `zlib.gzipSync(buf, { level: 9 })`）にした大きさの合計。正は zlib の値です。`gzip -9` の CLI は実装により数十バイト違います（下の文言の行）。
- 上限：150,000 バイト（KB を 1,000 バイトとして読む。1,024 より厳しい側）。
- 検査：`node scripts/check-budget.mjs <配布物のフォルダ>`（backend-engineer が node の組み込みだけで書く）。上限を超えたら終了コード 1。G3 の証拠には、ファイルごとの大きさと合計を出した出力を貼る。
- 公開後：本番の URL のファイルを `curl --compressed` で取った転送量の合計（GitHub Pages は gzip を返す。br は返さない：tech-lead G1 r1 の curl）。
- 内訳の上限（合計が 150,000 に収まるように分けた。どれかを超えるときは、他を減らして合計を守る）：

| 部分 | 上限（gzip 後のバイト） | 根拠 |
|---|---|---|
| 殻（HTML、CSS、すべての JS、sw.js） | 32,000 | 2026-11-04 に 26,000 から上げた（下の「枠の見直し」）。内訳は JS（sw.js を含む）の上限 26,000 と、HTML と CSS の 6,000。G2 r3 の実装で 25,794（JS 22,135、CSS 2,794、HTML 865）。最初の根拠は spike の殻の約 15,800 バイト（60 KB の代わりの JS を含む） |
| 文言（ja.json と en.json の 2 つ） | 8,000 | 約 6,600。fixtures/strings の 146 キーの見本を `JSON.stringify` で詰めて `zlib.gzipSync(level 9)` にすると 3,554 + 3,016 = 6,570（node v24.22.1）。同じものを Apple の gzip 487.40.2 の `gzip -9` にすると 3,516 + 3,047 = 6,563（2026-11-04。145 キーのときは 2026-10-30 に 6,470 と 6,440） |
| ホーム画面のアイコン `icon-180.png` と `manifest.webmanifest`（Takuma の決定 D5。6） | 4,000 | 2026-11-04 に 10,000 から下げた（下の「枠の見直し」）。180 × 180 の 2 色の PNG 1 枚（design 8 の想定は 2 KB 前後。実物は生 2,107 バイト）と、7 項目の JSON（生 231 バイト）。G2 r3 の実装で 2 つの gzip 後の合計 2,173 |
| 課題集 tasks.json | 106,000 | 252 件 × 平均 600 字の合成で 106,113（spike） |

- 枠の見直し（2026-11-04、tech-lead。reviewer G2 r3 の提案と指揮役の決定。合計 150,000 は変えない）：
  - 前の枠：殻 26,000、文言 8,000、アイコンと manifest 10,000、課題集 106,000（合計 150,000）。今の枠：殻 32,000、文言 8,000、アイコンと manifest 4,000、課題集 106,000（合計 150,000）。
  - なぜ：殻の残りが 206 バイトで、次の文言や処理の追加で必ず枠を超える。殻の 26,000 は JS だけの見直しの線（ADR 0001 の見直す条件「JS の gzip 後の合計が 26,000 バイトを超える」）と同じ数で、HTML と CSS（いま 3,659）の分を見ていなかった。殻を「JS 26,000 ＋ HTML と CSS 6,000」にして、ADR 0001 の線と食い違わないようにした。
  - どこから：アイコンと manifest の枠（実物 2,173 で 7,827 の余り）から 6,000 を移した。4,000 は実物の約 1.8 倍で、2 色の PNG の作り直し（design 8 の作り方）の揺れを見込む。
  - 動かさなかった枠：課題集の 106,000 は 2 の「1 件の本文の平均 600 字以下」の 252 件版から決めた値（spike で 106,113）で、下げると 2 の上限（pdm の下書きの約束）も下げることになる。文言の 8,000 は 146 キーで 6,610 で、残りの 1,390 は新しい文言のために残す。
  - 守ること：JS が 26,000 を超えたら、殻の枠の中でも ADR 0001 の見直す条件に当たる（ビルドの道具を足すかを決め直す）。殻の枠を超えそうになったら、先に文言の余りを移すかを tech-lead が決め、課題集の枠からは取らない。
  - 合わせて直したもの：6 のアイコンの生の大きさの上限も 4,000 にした（gzip しても PNG はほとんど縮まないため、生の上限が枠より大きいと枠が意味を持たない）。design/001-daily-learning.md の D-29、8、10 の「10,000 バイト以下」は designer が直す（G2 r3 の後の報告）。
- 初めての訪問では SW が同じファイルを `cache: 'reload'` でもう一度取るので、実際の通信は最大でこの 2 倍です。SW の登録は最初の画面を描いた後なので、AC-15 の 2 秒には入りません（service-worker.md の 1）。

## 2. 課題集の長さ（pdm が下書きを始める前に知らせる。指揮役の裁定 E5）
- 1 件ごとの上限（スキーマで落とす）：題名 60 字、なぜ今これか 200 字、やり方 400 字、完了の目安 200 字、道具は 5 件まで・各 40 字。所要時間は 1〜15 の整数。
- 全体の上限（受け入れテストで数える。JSON Schema では書けない）：
  - 4 つの本文（title、why、how、goal）の字数の合計を件数で割った値が 600 以下。v1 の 126 件版も、公開後の 252 件版も。
  - tasks.json の gzip 後の大きさが 106,000 バイト以下。
  - この 2 つのテストの名前は `BUDGET2_` で始めます（test-hooks.md の W-6）。PRD の AC ではないので `AC<番号>_` の名前を付けず、G3 の AC の表に混ぜません。検証レポートでは「予算」の行として別に書きます。
- 1 件の本文が平均で約 650 字を超えると、252 件版で 150 KB を超えます（tech-lead G1 r1 の spike）。

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
- 静的な HTML の `<head>` に、`<link rel="modulepreload">` をすべての JS モジュールに、`<link rel="preload" as="fetch" crossorigin>` を `./data/tasks.json`、`./i18n/ja.json`、`./i18n/en.json` に置きます（spike では、置くと約 330 ms 速くなった）。言語は JS が動くまで決まらないので、文言は 2 つとも先に取ります。
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
- 効かなくても困らないもの：`accent-color`（Safari 26.2）は radio がシステムの色になるだけ。`prefers-reduced-transparency`（Safari にない）は半透明のままになるだけ。
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
