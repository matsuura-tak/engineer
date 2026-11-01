# 受け入れテストのつなぎ口（001-daily-learning）

verifier G0 r3 の W-1〜W-16 を、名前と値まで決めたものです。構成の理由は docs/adr/0004-acceptance-test-setup.md。
大原則（PRD 11 の冒頭）：つなぎ口は本番の配布物に入れません。アプリの側にあるのは、読み取り専用の印（identifiers.md）とスキーマ（schemas/）だけです。URL の引数、`window.__test` のような入口、テスト用のビルドはありません。注入はすべて Playwright の側から行います。

## 実行の環境（W-11）
- 置き場所：`backend/tests/acceptance/`。設定は `backend/tests/acceptance/playwright.config.mjs` だけで動きます。
- 依存の置き場所（ADR 0004 の「依存の置き場所」。B）：@playwright/test、@axe-core/playwright、ajv は `backend/tests/acceptance/package.json` と、その package-lock.json に置きます。backend/package.json には @playwright/test と @axe-core/playwright を入れません（2 つのコピーを作らないため）。
- 実行のコマンド：`cd backend/tests/acceptance && npm ci && npx playwright install chromium webkit && npx playwright test`。backend の `npm test` からは `npm run test:acceptance` が同じことをします（ADR 0001 の scripts）。`cd backend && npx playwright test -c tests/acceptance` の形は使いません（backend/ に @playwright/test がないので動かない）。
- projects は `chromium` と `webkit` の 2 つ。`retries: 0`。
- テスト用の静的サーバー（`backend/tests/acceptance/server/` に verifier が node の組み込みだけで書く）：
  - 配布物は `backend/scripts/build.mjs`（ADR 0001。backend-engineer）でビルドしたフォルダを使う。`backend/public/` をそのまま配らない（版の刻印と SW のファイル一覧が入らないため）。
  - 配布物を `/engineer/` の下に置く（本番と同じパス。`/` で始まる URL の誤りを見つけるため）。baseURL は `http://127.0.0.1:<port>/engineer/`。127.0.0.1 は安全な文脈なので SW が動く。
  - GitHub Pages と同じヘッダーを返す：`Cache-Control: max-age=600`、`Accept-Encoding` に gzip があれば `Content-Encoding: gzip`、拡張子に合う `Content-Type`（`.js` は `text/javascript`、`.json` は `application/json`、`.webmanifest` は `application/manifest+json`、`.png` は `image/png`）。`/engineer` は `/engineer/` に 301。ないファイルは 404。
  - 実行中に配る中身のフォルダを差し替える関数を持つ（AC-28）。
- ビルドの手順の約束（backend-engineer が作る。テストはこれだけを使う）：`node scripts/build.mjs --out <フォルダ> --version <版> [--tasks <tasks.json のパス>]`。`--version` は必須で、identifiers.md の `data-build-version` の形 `YYYY-MM-DD.N`（正規表現 `^[0-9]{4}-[0-9]{2}-[0-9]{2}\.[1-9][0-9]*$`。例 `2026-11-30.1`）に合わなければ終了コード 1（`dev` のような値は受け付けない）。`build({ out, version, tasks })` を export もする。`--tasks` を渡すと課題集をそのファイルに差し替える（スキーマに通らなければ失敗）。

## W-1 状態の初期化
- テストごとに新しいブラウザコンテキスト（保存、SW、キャッシュが空）。アプリの側のつなぎ口はない。

## W-2 画面の状態と識別子
- identifiers.md のとおり。ルート `<html>` の `data-state` と、要素の `data-testid`。

## W-3 時刻
- `page.clock.setFixedTime(…)`（Date と new Date だけを固定し、タイマーは動く）と、コンテキストの `timezoneId: 'Asia/Tokyo'`。`page.clock.install()` は使わない（答えの保存の 300 ms のタイマーが止まるため）。
- 日付を進めるときは `setFixedTime` を新しい日時で呼び直してから読み込む。
- AC-15 では時刻を固定しない（performance を上書きしないため）。
- setFixedTime の下では、ページの `performance` は Playwright の置き換えになり、`Date.now()` は止まる。AC-1、AC-2、AC-23 の秒数は「時間の計り方」の節のとおりに計る。
- SW は時刻を使わない（service-worker.md の 5）ので、SW の中に時刻が効かなくても結果は変わらない。
- AC-19 と AC-20 は同じ固定の日付で行う。日付が変わると、書き出したときの `current` が読み込みの後に `none` の行として `history` に移り、履歴が 1 行増える（data.md の 4）。

## W-4 課題集の URL と差し替え
- 課題集は配布物の `./data/tasks.json`（`/engineer/data/tasks.json`）で、実行時に fetch で読む。
- AC-10 と AC-30 は差し替えずに、本番の課題集のまま seed で「出し終えた」履歴を入れる（PRD r5）。
- それでも差し替えるときは `page.route` を使い、そのテストでは `serviceWorkers: 'block'` にする（SW が返すと route を通らないため：tech-lead G0 r2 の spike B）。渡し方は、テストの設定の `use`（`test.use({ serviceWorkers: 'block' })`。Playwright の文書は testOptions として説明）でも、`browser.newContext({ serviceWorkers: 'block' })` でもよい（https://playwright.dev/docs/service-workers 、https://playwright.dev/docs/api/class-browser ）。

## W-5 課題と段階の素性
- `[data-testid="task.today"]` の `data-task-id`、`data-task-area`、`data-task-level`、`data-task-mode`。値の語彙は identifiers.md の 5。
- 今の段階と診断の回答は、書き出しファイル（W-9）で読む。

## W-6 課題集のスキーマと検査
- スキーマ：contracts/schemas/tasks.schema.json。ajv（`ajv/dist/2020`、strict）で本番の tasks.json を検査する（AC-3、AC-29 の大半）。
- スキーマの外なので、テストのコードで数えるもの：件数（v1 は 126 以上、足す版は 252 以上）、18 の組ごとの件数（7 以上 / 14 以上）、ID の重複 0（AC-4）、組ごとの external の割合 20% 以下（AC-29）、本文の平均 600 字以下と gzip 後 106,000 バイト以下（budgets.md の 2）。
- budgets.md の 2 の予算のテストは、名前を `BUDGET2_` で始めます（例 `BUDGET2_本文の平均は600字以下`）。`AC<番号>_` の名前を付けず、G3 の AC の表に混ぜません。検証レポートでは AC の表とは別の「予算」の行に、合否と値を書きます。

## W-7 データの投入（seed）
- 形：contracts/schemas/data.schema.json（保存の形と同じ）。見本：contracts/fixtures/seeds/ と contracts/fixtures/data/v1/。verifier は自分のフォルダに seed を置き、テストの中で ajv に通してから使う。
- 入れ方：`context.addInitScript` で localStorage のキー `kyounoitte:data` に JSON 文字列を書く。addInitScript は再読み込みのたびに動くので、印のキーで 1 回だけにする：
  ```js
  if (!localStorage.getItem('test:seeded')) { localStorage.setItem('kyounoitte:data', SEED); localStorage.setItem('test:seeded', '1'); }
  ```
  アプリは自分のキー以外に触らない（data.md の 1）ので、印は削除（AC-16）の後も残り、seed は入れ直されない。
- seed の setItem は、W-9 の失敗の注入より先に登録する（失敗は印を立てた後の 1 回だけなので seed は落ちないが、順番も守る）。
- AC-24 の seed は、時刻を固定する日（2026-11-06）の行を `history` に入れる。入れないと、開いたときにアプリがその日の課題を出し、`issued` が 1 増える（data.md の 4 の 6）。見本：fixtures/seeds/seed-ac24-stats.json。
- AC-8 の seed の各行の `level` は、その課題が出たときの段階にする（PRD 11 の AC-8 の確かめ方、data.md の 5）。見本は fixtures/seeds/ の `seed-ac8-*`（3 件。対応は data.md の 5 の表）。9 通り目の seed だけは、`levels` が `intermediate` で古い 2 行の `level` が `advanced` になる。
- AC-14 の seed は 2 通り（PRD r7 の AC-14 の確かめ方。Q11 は A）。
  - 1 通り目（`task.exhausted` からやり直す）：出し終えた履歴（完了 3 件を含む）。AC-10 と同じく本番の課題集から作る（今の組の課題をすべて `history` に入れ、そのうち直近 3 日の 3 件を `done` にする）。PRD の Given「今日の課題はまだ出していない」は、data.md の 4 の 6-4 の下では、目標の組を出し終えた日（`task.exhausted`）にしか作れないため。固定の seed は置かない（課題集の中身に依存するため）。
  - 2 通り目（`task.today` からやり直す）：fixtures/seeds/seed-ac14-three-completed.json の形（完了 3 件、最後の行は 2026-11-03、`current` なし）で開き、`task.today` とその `data-task-id` を確かめてからやり直す。時刻は最後の行より後の日（例 2026-11-04）に固定する（2026-11-03 に開くと 4 の 6-2 で `task.done` になる）。やり直しで選ぶ領域は seed の `backend` 以外にする。
    - やり直しの直後：data.md の 2 の表（今日の課題を出した後のやり直しは `current` を書かない）と、終えた後の行き先（同じ 2）により、4 の 6-3 で `task.today` のままで `data-task-id` はやり直しの前と同じ。
    - 翌日（例 2026-11-05）に固定して開く：4 の 6-1 で前日の課題が `report: "none"` の行に移り、6-4 で新しい `diagnosis.area` と `levels` の課題が出る（`data-task-area` が新しく選んだ領域）。完了した課題は 3 件のまま（`none` は完了でない。S10 の行は 4 行になる）。
  - seed-ac14-three-completed.json は 1 通り目の Given を満たさない（開くと今日の課題が出る）。完了 3 件の履歴の見本として、AC-14 の 2 通り目のほか AC-5、AC-16 などにも使う。

## W-8 履歴の読み出し
- S10 の `[data-testid="history.row"]` の `data-task-id`、`data-date`、`data-report`（`done`、`too_hard`、`too_easy`、`no_time`、`none`）、`data-helpful`（`done` の行だけ。`helpful`、`not_helpful`、`unanswered`）。
- 「完了」は `done`（W-8 案の `completed` ではない）。S10 に出るのは `history` だけで、まだ申告していない今日の課題は出ない。

## W-9 失敗と拒否の注入、書き出しの形
- 保存の失敗（AC-11）：addInitScript で `Storage.prototype.setItem` を包み、テストが印（ページの `globalThis` に置くテスト側の変数。アプリは読まない）を立てた後の次の 1 回だけ `new DOMException('injected', 'QuotaExceededError')` を投げる。投げたら印を下ろす。アプリは保存 1 回につき setItem を 1 回だけ呼ぶ。保存データが「なし」か「診断の途中」の起動では setItem を呼ばない（AC-11 の注入はこの状態で行う）。「あり」の起動では data.md の 2 のとおり最大 1 回（診断の 2 問目の確定はちょうど 1 回の setItem）。
- 永続化の拒否（AC-13）：addInitScript で `StorageManager.prototype.persist = async () => false`。アプリは `navigator.storage.persist()` を、`task.today` を初めて描いた後に 1 回だけ呼ぶ（`device.persistRequested` が true なら呼ばない）。
- 書き出し：`page.waitForEvent('download')` で 1 件。中身は data.schema.json に通り、`device` を含まない。版の項目は `formatVersion`、今の値は 1。AC-25 のファイルは `formatVersion: 2` にする（fixtures/data/invalid-newer-version.json が見本）。
- 読み込み：隠した input（`settings.import.file`、`home.standalone.importFile`）に `setInputFiles`。

## W-10 読み込み時間
- ルートの `data-debug-load-ms`（identifiers.md の 1）。本番にも残る読み取り専用の値。
- 読むのは AC-15 だけ。アプリが出す値なので、AC-1、AC-2、AC-23 の秒数には使わない（「時間の計り方」の節）。

## W-11 AC-15 の制限
- Chromium だけ。`context.newCDPSession(page)` で：
  - `Network.enable` の後 `Network.emulateNetworkConditions`：`{ offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750 }`（下り 1.6 Mbps＝200,000 バイト/秒、上り 750 kbps）。
  - `Emulation.setCPUThrottlingRate`：`{ rate: 4 }`。
- 1 回ごとに新しいコンテキスト（キャッシュなし）に seed を入れ、制限をかけてから `goto`。`data-state="task.today"` を待って `data-debug-load-ms` を読む。5 回とも 2,000 以下。
- serviceWorkers は既定（allow）のまま。初めての訪問では SW はまだ動いておらず、登録は画面を描いた後（service-worker.md の 1）。
- 監査の道具 @axe-core/playwright（AC-27）は contracts/dependencies.md にある。

## 時間の計り方（AC-1、AC-2、AC-23 の秒数）
G2 tech-lead r2 の要修正への決定です。今の `expect(...).toHaveAttribute` で終わりを待つ形は、Playwright の確かめる間隔（270 ms を過ぎると 500 ms おき）の分だけ値が長くなるので使いません。
- 決定：文書が変わらない区間（AC-1、AC-2。AC-12 で同じ操作を計るときも）は、ページの中で計る（案 (a)）。文書が変わる区間（AC-23 の再読み込みと新しいタブ）は、テストの側の時計と 20 ms おきの `expect.poll` で計る。
- AC-15 との違い：AC-15 の `data-debug-load-ms`（W-10）はアプリが出す値で、時計を固定しないテストで読む。AC-1、AC-2、AC-23 の値はテストが計る値で、アプリは何も書かない。本番の配布物には何も入れない。
- 値は ms の整数（小数は切り上げ）で annotation に残し、G3 の証拠にする。合否は「値 ≤ 上限」。

### 文書が変わらない区間（AC-1、AC-2）
1. 仕掛け：計る文書で、最初に計る click の前に `page.evaluate` で 1 回だけ入れる（再読み込みしたら入れ直す）。記録はテスト側の変数 `globalThis.__acceptanceTiming` に置く（W-9 の印と同じく、アプリは読まない）。
2. 始点：`window` に capture 段の `click` リスナー（`addEventListener('click', h, { capture: true })`）を置き、`performance.now()` と、`event.target.closest('[data-testid]')` の `data-testid` を記録する。始点にするのは、計る操作の testid（下の表）の click のうち最後の 1 件。radio の `check()` も click を出す（spike 1 で `area.backend` の click も記録された）ので、testid で分ける。
3. 終点：`new MutationObserver(cb).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-state', 'data-question-index'] })`。cb では変化の記録でなく、その時点の DOM を読む（`<html>` の `data-state` と、`[data-testid="diagnosis.progress"]` の `data-question-index`。なければ null）。前の記録から変わったら、`performance.now()` と一緒に記録する。childList も見るのは、アプリが要素を作り直す実装でも取りこぼさないため（spike 1 は作り直す実装で計った）。
4. 区間と終点の条件（終点は、始点より後の記録のうち、条件を満たす最初のもの）：

   | 区間 | 始点の testid | 終点の条件 | 上限 |
   |---|---|---|---|
   | 始める → 1 問目 | `diagnosis.start.begin` | `data-state` が `diagnosis.question`、`data-question-index` が `1` | 500 ms |
   | n 問目 → n+1 問目（n＝1、2） | `diagnosis.next` | `data-state` が `diagnosis.question`、`data-question-index` が n+1 | 500 ms |
   | 3 問目 → 課題 | `diagnosis.finish` | `data-state` が `task.today` | 1,000 ms（AC-2） |

5. 値＝終点 − 始点。差を取った後で、今の expect で状態と中身を確かめる（expect は正しさの確かめで、時間には使わない）。始点か終点の記録がなければ「計れなかった」として落とす（null や 0 を通さない）。
6. 終点は DOM が変わった時刻で、画面に塗られる次のフレーム（60 Hz で約 17 ms）は含めない。AC-15 の `data-debug-load-ms` も `data-state` を書いた直後の時刻なので、定義をそろえる。`data-state` はその状態の DOM を入れ終えた後に書く（identifiers.md の 1）ので、終点の時点で中身はある。
7. W-3 の setFixedTime の下でも使える。ページの `performance.now()` は Playwright の置き換え（`() => clock.performanceNow()`）になるが、同じ文書の中の差は実際の時間どおりに進む（spike 1）。ページの `Date.now()` は止まっているので使わない。
8. 設計メモ 6 の「申告から次の状態まで」の記録（AC-5、AC-7）も、この仕掛けで計ってよい（始点は申告のボタンの testid、終点は `data-state`）。

### 文書が変わる区間（AC-23）
1. 始点：`page.reload({ waitUntil: 'commit' })`、新しいタブは `page2.goto(url, { waitUntil: 'commit' })` を呼ぶ直前の、テスト側の `Date.now()`。既定の `waitUntil`（load）は使わない（load を待つ分だけ長くなるため）。
2. 終点：`await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute('data-state')).catch(() => null), { intervals: [20], timeout: 3000 }).toBe(状態)` が返った直後の `Date.now()`。`.catch(() => null)` は、ナビゲーションの途中の evaluate の失敗を「まだ」として扱うため。
3. 値＝終点 − 始点。ずれは「間隔 20 ms と往復 1 回」まで（spike 6 で +7〜+30 ms）。始点はナビゲーションより前、終点は状態を見た後なので、本当の値より短くなることはない。
4. 同じ `data-task-id` の確かめと W-12 の送信の数え方は、終点の後に行う（時間に含めない）。
5. ページの中で計らない理由：setFixedTime の下では、新しい文書の `performance.now()` も `Event` の `timeStamp` も、その文書のナビゲーションの開始を 0 にしない（spike 4）。時計を固定しなければ合う（spike 5）が、AC-23 は seed の日付のために時計を固定する（W-3）。

### 選ばなかった方法
- 計る区間の expect に `{ timeout: 上限 }` を渡す（案 (b)）：間隔は 100 ms 以下になるが、約 100 ms のずれが残り、G3 の値も実際より大きいまま。AC-23 の 3,000 ms では timeout ÷ 5 が 500 を超えるので、500 ms の間隔が外れず効かない。
- AC-23 もページの中で計る：上の 5 のとおり、時計を固定したテストでは値が合わない。

### spike（tech-lead、2026-10-31。リポジトリの外。@playwright/test 1.64.1、macOS、Chromium と WebKit）
本当の遅れ（アプリの代わりの stub が setTimeout で状態を変えるまで）に対する、計った値（ms。chromium / webkit）：

| 計り方 | 0 | 300 | 450 | 900 | 2,500 |
|---|---|---|---|---|---|
| spike 1：今の expect の待ち（click の前 → toHaveAttribute） | 48 / 27 | 828 / 836 | 827 / 828 | 1,335 / 1,334 | — |
| spike 1：ページの中（click の capture → MutationObserver。時計固定） | 15 / 1 | 302 / 302 | 452 / 452 | 903 / 902 | — |
| spike 4：ページの中、新しいタブ（Event の timeStamp。時計固定） | 219 / 367 | — | 2,194 / 2,349 | — | 8,318 / 8,430 |
| spike 4：同じとき、テスト側の expect の待ち | 17 / 23 | — | 808 / 815 | — | 2,837 / 2,839 |
| spike 5：ページの中、新しいタブ（時計を固定しない） | 4 / 4 | — | 456 / 454 | — | 2,505 / 2,504 |
| spike 6：テスト側、再読み込み（commit と expect.poll 20 ms。時計固定） | 9 / 10 | 316 / 317 | 460 / 479 | 912 / 917 | 2,522 / 2,527 |
| spike 6：テスト側、新しいタブ（同上） | 7 / 11 | 324 / 320 | 468 / 480 | 930 / 925 | 2,512 / 2,521 |

## W-12 通信の数え方（AC-12、AC-23）
- 「送信」＝ `page.on('response')` のうち `response.fromServiceWorker()` が false のもの + `page.on('requestfailed')` の件数。数える区間は「オフラインにした直後から、Then を確かめ終えるまで」。
- `page.on('request')` をそのまま数えない（SW が返した要求も request として出る：tech-lead G0 r2 の spike で 9 件）。
- Q1 は A（外に送らない）なので、除く送信先はない。
- オフラインは `context.setOffline(true)`。

## W-13 SW の準備（AC-12、AC-23、AC-28）
- AC-12 でも、オフラインにする前にこの合図を待つ（アプリは画面を描いた後に SW を登録するので、待たないと `sw.js` の取得とオフラインが競る。WebKit では `sw.js` の requestfailed が W-12 の 1 件に数えられる：tech-lead G2 r1 の spike）。PRD の「読み込み終えた後に」をこの合図で読む。
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
- 案内 `home.addToHomeScreen` は「保存データなし、iOS の Safari、スタンドアロンでない、`device.homeGuideClosed` が true でない」のときだけ出る。閉じた後の保存データは `device` だけで、`firstOpenDate` はない（data.md の 2。見本：fixtures/data/v1/valid-guide-closed-only.json）。`home.standalone` は「保存データなし、スタンドアロン」のとき毎回出る（UA にかかわらない。AC-22）。

## キーボードの移動キー（AC-18）
- 「次の要素へ」と「前の要素へ」のキー：
  - WebKit：`Alt+Tab` と `Alt+Shift+Tab`。
  - それ以外（Chromium）：`Tab` と `Shift+Tab`。
- 理由：macOS の Playwright WebKit（27.2）では、ふつうの `Tab` がボタン、radio、リンクに止まらず、textarea と body だけを回る。`Alt+Tab` ではすべての要素を回る（Safari の既定の「Option+Tab ですべての項目に移る」と同じ）。tech-lead G2 r1 の spike：`Tab` を 6 回押したフォーカスの順は chromium が `link > r1 > btn > ta > BODY > link`、webkit が `ta > BODY > ta > BODY …`。webkit で `Alt+Tab` にすると `link > r1 > btn > ta`。
- 確定（決定）を押すキー（`Enter`、`Space`）はどちらのエンジンでも同じ。
- 未確認：Linux の WebKit（CI）での `Tab` と `Alt+Tab` のふるまい。最初の CI の実行で、両方のキーで回したフォーカスの順の出力を evidence に残す。Linux で `Tab` だけで回るなら、このキーの表を直す。
  - WebKit のソースの裏付け（動かしたのではなく、読んだもの。2026-10-31 に取得した main）：Source/WebCore/page/EventHandler.cpp の `tabsToAllFormControls` は、`PLATFORM(COCOA)` 以外では常に true（5129-5157 行。「We always allow tabs to all controls」）。Option+Tab で向きを反転するのも Cocoa だけ（`eventInvertsTabsToLinksClientCallResult`、5097-5105 行）。`defaultTabEventHandler` が移動を止めるのは Ctrl と Meta だけで、Alt は止めない（5482-5504 行）。リンクに移るかを決める TabsToLinks の既定は GTK と WPE で true（Source/WTF/Scripts/Preferences/UnifiedWebPreferences.yaml の 6207-6215 行）。
  - 読めること：Linux の WebKit では、`Tab` でも `Alt+Tab` でも、ボタン、radio、リンクに移る。今のキーの表（WebKit は `Alt+Tab`）のままで回れる見込み。
  - 残ること：Playwright の Linux 版 WebKit が、これらの既定を変えていないかはソースからは分からない。実際に動かしての確認は、上のとおり最初の CI に残す。

## AC-31 の重なる要素の数え方
`data-state="task.today"`（と `task.done`）を、操作 0 回で読んだ後に：
1. `page.getByRole('dialog')` の件数が 0（ネイティブの `<dialog>` は属性を書かなくても dialog の役割を持つ。閉じたダイアログは DOM にない：identifiers.md の 3）。
2. `[aria-modal="true"]` の件数が 0。
3. 計算済みの `position` が `fixed` か `sticky` の要素のうち、`[data-testid="task.today.title"]` の矩形と重なるものが 0（`getBoundingClientRect` で比べる。`task.done` では題名の代わりに `task.done.title`）。題名とその祖先（`el === title || el.contains(title)`）は数えない（祖先は子孫の下に描かれ、題名を覆わないため）。

## AC-28 の配布物の差し替え
1. `build({ out: 旧, version: '2026-11-30.1' })` と、課題を足した課題集で `build({ out: 新, version: '2026-12-14.1', tasks: 足した課題集 })` を作る。足す課題は、スキーマに通る未使用の ID（例 `backend-intermediate-900`）にする。
2. サーバーで旧を配り、seed を入れて読み込み、W-13 の合図を待つ。
3. サーバーの中身を新に差し替え、2 秒以上あけて再読み込み（最大 3 回）。毎回 `data-build-version` を記録する。
4. 新の値になった後は旧に戻らないこと、書き出しで履歴と診断と段階が差し替えの前と同じことを確かめる。

## 本番に入っていないことの確かめ（reviewer、G2）
- `grep -rnE "__test|[?&](reset|now|seed)=|location\.search" backend/public` が 0 件。
- アプリが読む URL の引数はない（`location.search` を読まない）。
