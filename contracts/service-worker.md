# Service Worker の決まり（001-daily-learning）

AC-12、AC-23、AC-28、つなぎ口 W-13。判断の理由は docs/adr/0003-service-worker-update.md。
v1 の Service Worker（以下 SW）は「配布物を先に取っておいて返す」ことと「配り直した版に切り替わる」ことだけをします（PRD 10）。

## 1. 登録
- ファイルは配布物のルートの `sw.js`。登録は `navigator.serviceWorker.register(url, { scope: './' })`。URL は相対の `./sw.js`。
- 本番の CSP は Trusted Types を求める（budgets.md の 3）ので、`window.trustedTypes` があれば、名前 `kyounoitte-sw` のポリシーの `createScriptURL` を通した値を渡します。ポリシーは `./sw.js` 以外の文字列を受け取ったら例外を出します。`trustedTypes` がないブラウザ（Safari 17〜25）では文字列のまま渡します。
  - spike（2026-10-30、Playwright 1.64.1）：Trusted Types を求める CSP の下では、文字列のまま register すると Chromium と WebKit の両方で TypeError になり、ポリシーを通すと両方で成功した。
- 登録する時機：最初の画面（`data-state` が `loading` 以外）を描いた後、`load` イベントの後。AC-15 の読み込みと帯域を取り合わないため。
- `navigator.serviceWorker` がない環境（安全でない文脈など）では登録しません。アプリはそのまま動きます。

## 2. 版とキャッシュの名前
- `sw.js` の先頭に `const VERSION = '<data-build-version と同じ値>'` と、先に取っておくファイルの一覧 `const FILES = [...]` を置きます。どちらもビルドの手順が書き込みます（ADR 0001）。リリースのたびに sw.js のバイトが変わり、ブラウザが新しい版を見つけます。
- キャッシュの名前は `kyounoitte-` + VERSION。接頭辞 `kyounoitte-` は、同じ origin の他のページのキャッシュと分けるためです。

## 3. install
- `caches.open(名前)` → `cache.addAll(FILES.map((u) => new Request(u, { cache: 'reload' })))` を `event.waitUntil` に渡します。1 つでも取れなければ install は失敗し、古い版のまま動きます。
- `cache: 'reload'` は必須です。GitHub Pages は `Cache-Control: max-age=600` を返すので、これがないと新しい SW がブラウザの HTTP キャッシュから古いファイルを取ることがあります（tech-lead G1 r1 の spike 2：Chromium で 5 回とも古い版のままだった）。
- `self.skipWaiting()` を呼びます。
- FILES は配布物のすべてのファイルです（`./index.html`、CSS、すべての JS モジュール、`./data/tasks.json`、`./i18n/ja.json`、`./i18n/en.json`、`./manifest.webmanifest` とアイコン（置く場合））。`./sw.js` 自身は入れません。ビルドの手順は、配布物のフォルダのファイルと FILES が一致することを確かめ、違えば失敗します。

## 4. activate
- 名前が `kyounoitte-` で始まり、今の名前でないキャッシュだけを消します。他の接頭辞のキャッシュには触りません。
- `self.clients.claim()` を `event.waitUntil` の中で呼びます。

## 5. fetch
- 扱うのは、メソッドが GET で、URL の origin が自分と同じで、パスが SW の scope の下にある要求だけです。それ以外は `respondWith` を呼ばず、ブラウザに任せます。
- 画面の読み込み（`request.mode === 'navigate'`）は、今のキャッシュの `./index.html` を返します（`/engineer/`、`/engineer/index.html`、`?` 付きの URL のどれでも）。
- それ以外は `caches.match(request, { ignoreSearch: true, cacheName: 今の名前 })` で返します。キャッシュになければ `fetch(request)` をそのまま返します（実行中にキャッシュへ足すことはしない）。
- 時刻を使いません（受け入れテストの時刻の固定は SW の中には効かないため）。

## 6. 切り替わり方（AC-28）
- ブラウザは画面の読み込みのたびに sw.js の更新を調べます。新しい sw.js があれば、install（全ファイルを取る）→ skipWaiting → activate → claim の順で新しい版が動きます。
- その読み込みの画面は古い版のままで、次の読み込みから新しい版になります。tech-lead の spike（G0 r2、G1 r1）では、2 秒おきの再読み込みで Chromium と WebKit の両方とも 2 回目から新しい版になりました。
- 「新しい版があります」の知らせは出しません（PRD 10）。
- 画面は最初に全モジュールを読み終え、動的な `import()` を使いません（ADR 0001）。古い画面が、後から新しい版のファイルを読むことはありません。
- 古い版の画面を開いたままのタブがあると、その画面は新しいキャッシュの下で古い JS のまま動きます。保存データの形（formatVersion）を変えるリリースでは、この組み合わせが起きても壊れないこと（古い画面が新しい版のデータを「読めない」として止まるだけで、上書きしない）を、その版の ADR で確かめます。

## 7. 本番での注意（RUNBOOK に書く。backend-engineer）
- GitHub Pages の配信（Fastly）は sw.js を含むファイルを最大 600 秒キャッシュします。公開から最大 10 分は、新しい sw.js が届かないことがあります。
- 初めての訪問では、画面のファイルを取った後に SW が同じファイルを `cache: 'reload'` でもう一度取るので、転送量は配布物の合計の最大 2 倍です（budgets.md の 1）。
