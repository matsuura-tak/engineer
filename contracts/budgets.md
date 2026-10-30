# 予算、CSP、対応ブラウザ（001-daily-learning）

PRD 12（速さ、配布、対応ブラウザ）と AC-15、AC-17 を、作り手が守れる数字にしたものです。
判断の理由は docs/adr/0001-web-foundation-no-build-es-modules.md と docs/adr/0005-csp-and-trust-boundaries.md。

## 1. 転送量（PRD 12：初回の転送量は圧縮後 150 KB 以下）
- 数え方：ビルドした配布物のフォルダのすべてのファイルを、それぞれ gzip の最大圧縮（`zlib.gzipSync(buf, { level: 9 })`、`gzip -9` と同じ）にした大きさの合計。
- 上限：150,000 バイト（KB を 1,000 バイトとして読む。1,024 より厳しい側）。
- 検査：`node scripts/check-budget.mjs <配布物のフォルダ>`（backend-engineer が node の組み込みだけで書く）。上限を超えたら終了コード 1。G3 の証拠には、ファイルごとの大きさと合計を出した出力を貼る。
- 公開後：本番の URL のファイルを `curl --compressed` で取った転送量の合計（GitHub Pages は gzip を返す。br は返さない：tech-lead G1 r1 の curl）。
- 内訳の上限（合計が 150,000 に収まるように分けた。どれかを超えるときは、他を減らして合計を守る）：

| 部分 | 上限（gzip 後のバイト） | 根拠 |
|---|---|---|
| 殻（HTML、CSS、すべての JS、sw.js、manifest） | 26,000 | spike の殻は約 15,800 バイト（60 KB の代わりの JS を含む） |
| 文言（ja.json と en.json の 2 つ） | 8,000 | fixtures/strings の 145 キーの見本を詰めて gzip -9 にすると 3,453 + 2,987 = 6,440（2026-10-30） |
| ホーム画面のアイコン（置く場合。Takuma の決定待ち P4） | 10,000 | 180 × 180 の PNG 1 枚 |
| 課題集 tasks.json | 106,000 | 252 件 × 平均 600 字の合成で 106,113（spike） |

- 初めての訪問では SW が同じファイルを `cache: 'reload'` でもう一度取るので、実際の通信は最大でこの 2 倍です。SW の登録は最初の画面を描いた後なので、AC-15 の 2 秒には入りません（service-worker.md の 1）。

## 2. 課題集の長さ（pdm が下書きを始める前に知らせる。指揮役の裁定 E5）
- 1 件ごとの上限（スキーマで落とす）：題名 60 字、なぜ今これか 200 字、やり方 400 字、完了の目安 200 字、道具は 5 件まで・各 40 字。所要時間は 1〜15 の整数。
- 全体の上限（受け入れテストで数える。JSON Schema では書けない）：
  - 4 つの本文（title、why、how、goal）の字数の合計を件数で割った値が 600 以下。v1 の 126 件版も、公開後の 252 件版も。
  - tasks.json の gzip 後の大きさが 106,000 バイト以下。
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

- 使ってよい（同じ互換データで Safari 17 以下）：ES modules、`<link rel="modulepreload">`（17）、`<dialog>` と `showModal`（15.4）、`StorageManager.persist`（15.2）、`Blob.text`（14）、`Intl.PluralRules`（13）、`Set.prototype.union`（17）、`URL.canParse`（17）、`structuredClone`（15.4）、`:has()`（15.4）、`overflow-wrap: anywhere`（15.4）、`display-mode` のメディアクエリ（13）。
- 効かなくても困らないもの：`accent-color`（Safari 26.2）は radio がシステムの色になるだけ。`prefers-reduced-transparency`（Safari にない）は半透明のままになるだけ。
- reviewer は G2 で、上の「使わない」を grep で探します。
