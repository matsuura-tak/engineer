# 受け入れテストのつなぎ口（001-daily-learning）

verifier G0 r3 の W-1〜W-16 を、名前と値まで決めたものです。構成の理由は docs/adr/0004-acceptance-test-setup.md。
大原則（PRD 11 の冒頭）：つなぎ口は本番の配布物に入れません。アプリの側にあるのは、読み取り専用の印（identifiers.md）とスキーマ（schemas/）だけです。URL の引数、`window.__test` のような入口、テスト用のビルドはありません。注入はすべて Playwright の側から行います。

## 実行の環境（W-11）
- 置き場所：`backend/tests/acceptance/`。設定は `backend/tests/acceptance/playwright.config.mjs` だけで動き、`cd backend && npx playwright test -c tests/acceptance` で走ります（2026-10-30 に、同じ形の仮のフォルダで、-c がフォルダの中の playwright.config.mjs を読むことを確かめた）。
- projects は `chromium` と `webkit` の 2 つ。`retries: 0`。
- テスト用の静的サーバー（`backend/tests/acceptance/server/` に verifier が node の組み込みだけで書く）：
  - 配布物は `backend/scripts/build.mjs`（ADR 0001。backend-engineer）でビルドしたフォルダを使う。`backend/public/` をそのまま配らない（版の刻印と SW のファイル一覧が入らないため）。
  - 配布物を `/engineer/` の下に置く（本番と同じパス。`/` で始まる URL の誤りを見つけるため）。baseURL は `http://127.0.0.1:<port>/engineer/`。127.0.0.1 は安全な文脈なので SW が動く。
  - GitHub Pages と同じヘッダーを返す：`Cache-Control: max-age=600`、`Accept-Encoding` に gzip があれば `Content-Encoding: gzip`、拡張子に合う `Content-Type`（`.js` は `text/javascript`、`.json` は `application/json`、`.webmanifest` は `application/manifest+json`）。`/engineer` は `/engineer/` に 301。ないファイルは 404。
  - 実行中に配る中身のフォルダを差し替える関数を持つ（AC-28）。
- ビルドの手順の約束（backend-engineer が作る。テストはこれだけを使う）：`node scripts/build.mjs --out <フォルダ> --version <版> [--tasks <tasks.json のパス>]`。`build({ out, version, tasks })` を export もする。`--tasks` を渡すと課題集をそのファイルに差し替える（スキーマに通らなければ失敗）。

## W-1 状態の初期化
- テストごとに新しいブラウザコンテキスト（保存、SW、キャッシュが空）。アプリの側のつなぎ口はない。

## W-2 画面の状態と識別子
- identifiers.md のとおり。ルート `<html>` の `data-state` と、要素の `data-testid`。

## W-3 時刻
- `page.clock.setFixedTime(…)`（Date と new Date だけを固定し、タイマーは動く）と、コンテキストの `timezoneId: 'Asia/Tokyo'`。`page.clock.install()` は使わない（答えの保存の 300 ms のタイマーが止まるため）。
- 日付を進めるときは `setFixedTime` を新しい日時で呼び直してから読み込む。
- AC-15 では時刻を固定しない（performance を上書きしないため）。
- SW は時刻を使わない（service-worker.md の 5）ので、SW の中に時刻が効かなくても結果は変わらない。
- AC-19 と AC-20 は同じ固定の日付で行う。日付が変わると、書き出したときの `current` が読み込みの後に `none` の行として `history` に移り、履歴が 1 行増える（data.md の 4）。

## W-4 課題集の URL と差し替え
- 課題集は配布物の `./data/tasks.json`（`/engineer/data/tasks.json`）で、実行時に fetch で読む。
- AC-10 と AC-30 は差し替えずに、本番の課題集のまま seed で「出し終えた」履歴を入れる（PRD r5）。
- それでも差し替えるときは `page.route` を使い、そのテストのコンテキストは `serviceWorkers: 'block'` にする（SW が返すと route を通らないため：tech-lead G0 r2 の spike B）。

## W-5 課題と段階の素性
- `[data-testid="task.today"]` の `data-task-id`、`data-task-area`、`data-task-level`、`data-task-mode`。値の語彙は identifiers.md の 5。
- 今の段階と診断の回答は、書き出しファイル（W-9）で読む。

## W-6 課題集のスキーマと検査
- スキーマ：contracts/schemas/tasks.schema.json。ajv（`ajv/dist/2020`、strict）で本番の tasks.json を検査する（AC-3、AC-29 の大半）。
- スキーマの外なので、テストのコードで数えるもの：件数（v1 は 126 以上、足す版は 252 以上）、18 の組ごとの件数（7 以上 / 14 以上）、ID の重複 0（AC-4）、組ごとの external の割合 20% 以下（AC-29）、本文の平均 600 字以下と gzip 後 106,000 バイト以下（budgets.md の 2）。

## W-7 データの投入（seed）
- 形：contracts/schemas/data.schema.json（保存の形と同じ）。見本：contracts/fixtures/seeds/ と contracts/fixtures/data/v1/。verifier は自分のフォルダに seed を置き、テストの中で ajv に通してから使う。
- 入れ方：`context.addInitScript` で localStorage のキー `kyounoitte:data` に JSON 文字列を書く。addInitScript は再読み込みのたびに動くので、印のキーで 1 回だけにする：
  ```js
  if (!localStorage.getItem('test:seeded')) { localStorage.setItem('kyounoitte:data', SEED); localStorage.setItem('test:seeded', '1'); }
  ```
  アプリは自分のキー以外に触らない（data.md の 1）ので、印は削除（AC-16）の後も残り、seed は入れ直されない。
- seed の setItem は、W-9 の失敗の注入より先に登録する（注入の「次の 1 回」を seed が使わないため）。
- AC-24 の seed は、時刻を固定する日（2026-11-06）の行を `history` に入れる。入れないと、開いたときにアプリがその日の課題を出し、`issued` が 1 増える（data.md の 4 の 6）。見本：fixtures/seeds/seed-ac24-stats.json。
- AC-8 の seed の古い行の `level` は、seed の `levels` の値と同じにする（data.md の 5）。見本：fixtures/seeds/seed-ac8-intermediate-one-too-hard.json。

## W-8 履歴の読み出し
- S10 の `[data-testid="history.row"]` の `data-task-id`、`data-date`、`data-report`（`done`、`too_hard`、`too_easy`、`no_time`、`none`）、`data-helpful`（`done` の行だけ。`helpful`、`not_helpful`、`unanswered`）。
- 「完了」は `done`（W-8 案の `completed` ではない）。S10 に出るのは `history` だけで、まだ申告していない今日の課題は出ない。

## W-9 失敗と拒否の注入、書き出しの形
- 保存の失敗（AC-11）：addInitScript で `Storage.prototype.setItem` を包み、次の 1 回だけ `new DOMException('injected', 'QuotaExceededError')` を投げる。アプリは保存 1 回につき setItem を 1 回だけ呼び、起動時には setItem を呼ばない（data.md の 2。診断の 2 問目の確定はちょうど 1 回の setItem）。
- 永続化の拒否（AC-13）：addInitScript で `StorageManager.prototype.persist = async () => false`。アプリは `navigator.storage.persist()` を、`task.today` を初めて描いた後に 1 回だけ呼ぶ（`device.persistRequested` が true なら呼ばない）。
- 書き出し：`page.waitForEvent('download')` で 1 件。中身は data.schema.json に通り、`device` を含まない。版の項目は `formatVersion`、今の値は 1。AC-25 のファイルは `formatVersion: 2` にする（fixtures/data/invalid-newer-version.json が見本）。
- 読み込み：隠した input（`settings.import.file`、`home.standalone.importFile`）に `setInputFiles`。

## W-10 読み込み時間
- ルートの `data-debug-load-ms`（identifiers.md の 1）。本番にも残る読み取り専用の値。

## W-11 AC-15 の制限
- Chromium だけ。`context.newCDPSession(page)` で：
  - `Network.enable` の後 `Network.emulateNetworkConditions`：`{ offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750 }`（下り 1.6 Mbps＝200,000 バイト/秒、上り 750 kbps）。
  - `Emulation.setCPUThrottlingRate`：`{ rate: 4 }`。
- 1 回ごとに新しいコンテキスト（キャッシュなし）に seed を入れ、制限をかけてから `goto`。`data-state="task.today"` を待って `data-debug-load-ms` を読む。5 回とも 2,000 以下。
- serviceWorkers は既定（allow）のまま。初めての訪問では SW はまだ動いておらず、登録は画面を描いた後（service-worker.md の 1）。
- 監査の道具 @axe-core/playwright（AC-27）は contracts/dependencies.md にある。

## W-12 通信の数え方（AC-12、AC-23）
- 「送信」＝ `page.on('response')` のうち `response.fromServiceWorker()` が false のもの + `page.on('requestfailed')` の件数。数える区間は「オフラインにした直後から、Then を確かめ終えるまで」。
- `page.on('request')` をそのまま数えない（SW が返した要求も request として出る：tech-lead G0 r2 の spike で 9 件）。
- Q1 は A（外に送らない）なので、除く送信先はない。
- オフラインは `context.setOffline(true)`。

## W-13 SW の準備（AC-23、AC-28）
- 「オフラインで開ける」の合図：`await page.evaluate(async () => { await navigator.serviceWorker.ready; return navigator.serviceWorker.controller !== null; })` が true。false なら `controllerchange` を待つ。SW は install で全ファイルを取り終えてから有効になる（service-worker.md の 3）ので、この合図の後はオフラインで開ける。
- SW を使うテストは serviceWorkers を既定（allow）にする。

## W-14 言語
- コンテキストの `locale: 'ja-JP'` / `'en-US'`。アプリは `navigator.language` が `ja` で始まれば日本語、それ以外は英語（strings.md の 2）。
- 文言ファイルは `/engineer/i18n/ja.json` と `/engineer/i18n/en.json`。テストはこれを読んで画面の文字と比べ、キーの差を数える。

## W-15 統計の値
- identifiers.md の 4 の `data-stat-*` と、data.md の 9 の数え方。「直近 7 日」は今日を含む 7 暦日（端末の日付）。

## W-16 スタンドアロンと iOS Safari の判定
- スタンドアロン：`navigator.standalone === true || matchMedia('(display-mode: standalone)').matches`。
- iOS の Safari：次の 2 つを両方満たす。
  - UA が `/iPhone|iPad|iPod/` に当たる、または（UA が `/Macintosh/` に当たり、かつ `navigator.maxTouchPoints > 1`）。後半は Mac の UA を送る iPadOS の Safari のため。
  - UA が `/CriOS|FxiOS|EdgiOS|OPiOS/` に当たらない（iOS の他のブラウザ）。
  - LINE などのアプリ内ブラウザの UA は未確認（G4 で実機）。
- 偽装：`devices['iPhone 15']` などの UA と、addInitScript で `Object.defineProperty(Navigator.prototype, 'standalone', { get: () => false })`（AC-22 は true）。iPad は Mac の UA と `Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => 5 })`。`display-mode` は偽装しない。
- 案内 `home.addToHomeScreen` は「保存データなし、iOS の Safari、スタンドアロンでない、`device.homeGuideClosed` が true でない」のときだけ出る。`home.standalone` は「保存データなし、スタンドアロン」のとき毎回出る（UA にかかわらない。AC-22）。

## AC-31 の重なる要素の数え方
`data-state="task.today"`（と `task.done`）を、操作 0 回で読んだ後に：
1. `page.getByRole('dialog')` の件数が 0（ネイティブの `<dialog>` は属性を書かなくても dialog の役割を持つ。閉じたダイアログは DOM にない：identifiers.md の 3）。
2. `[aria-modal="true"]` の件数が 0。
3. 計算済みの `position` が `fixed` か `sticky` の要素のうち、`[data-testid="task.today.title"]` の矩形と重なるものが 0（`getBoundingClientRect` で比べる。`task.done` では題名の代わりに `task.done.title`）。

## AC-28 の配布物の差し替え
1. `build({ out: 旧, version: '2026-11-30.1' })` と、課題を足した課題集で `build({ out: 新, version: '2026-12-14.1', tasks: 足した課題集 })` を作る。足す課題は、スキーマに通る未使用の ID（例 `backend-intermediate-900`）にする。
2. サーバーで旧を配り、seed を入れて読み込み、W-13 の合図を待つ。
3. サーバーの中身を新に差し替え、2 秒以上あけて再読み込み（最大 3 回）。毎回 `data-build-version` を記録する。
4. 新の値になった後は旧に戻らないこと、書き出しで履歴と診断と段階が差し替えの前と同じことを確かめる。

## 本番に入っていないことの確かめ（reviewer、G2）
- `grep -rnE "__test|[?&](reset|now|seed)=|location\.search" backend/public` が 0 件。
- アプリが読む URL の引数はない（`location.search` を読まない）。
