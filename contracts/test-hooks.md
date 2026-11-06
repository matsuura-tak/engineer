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
- ビルドの手順の約束（backend-engineer が作る。テストはこれだけを使う）：`node scripts/build.mjs --out <フォルダ> --version <版> [--tasks-dir <フォルダ>]`。`--version` は必須で、identifiers.md の `data-build-version` の形 `YYYY-MM-DD.N`（正規表現 `^[0-9]{4}-[0-9]{2}-[0-9]{2}\.[1-9][0-9]*$`。例 `2026-11-30.1`）に合わなければ終了コード 1（`dev` のような値は受け付けない）。`build({ out, version, tasksDir })` を export もする（同期の関数。ADR 0007）。`--tasks-dir` を渡すと、課題集 6 つをそのフォルダの `tasks-<領域>.json` に差し替える（6 つともそろい、スキーマと手書きの検査に通らなければ失敗。ADR 0006。2026-11-06 に 1 つの `--tasks <tasks.json>` から改めた）。

## W-1 状態の初期化
- テストごとに新しいブラウザコンテキスト（保存、SW、キャッシュが空）。アプリの側のつなぎ口はない。

## W-2 画面の状態と識別子
- identifiers.md のとおり。ルート `<html>` の `data-state` と、要素の `data-testid`。

## W-3 時刻
- `page.clock.setFixedTime(…)`（Date と new Date だけを固定し、タイマーは動く）と、コンテキストの `timezoneId: 'Asia/Tokyo'`。`page.clock.install()` は使わない（答えの保存の 300 ms のタイマーが止まるため）。
- 日付を進めるときは `setFixedTime` を新しい日時で呼び直してから読み込む。
- 画面を開いたまま日付を進めるとき（data.md の 4 の「画面を開いたまま日付が変わったとき」、identifiers.md の 3 の `task.dayChanged`）は、`setFixedTime` を呼び直し、読み込まずに操作する。アプリは操作のたびに `new Date()` を読むので、これで足りる（探索 R3 の 2 で確かめた）。
- AC-15 では時刻を固定しない（performance を上書きしないため）。
- setFixedTime の下では、ページの `performance` は Playwright の置き換えになり、`Date.now()` は止まる。AC-1、AC-2、AC-23 の秒数は「時間の計り方」の節のとおりに計る。
- SW は時刻を使わない（service-worker.md の 5）ので、SW の中に時刻が効かなくても結果は変わらない。
- AC-19 と AC-20 は同じ固定の日付で行う。日付が変わると、書き出したときの `current` が読み込みの後に `none` の行として `history` に移り、履歴が 1 行増える（data.md の 4）。

## W-4 課題集の URL と差し替え
- 課題集は配布物の `./data/tasks-<領域>.json` の 6 つ（`/engineer/data/tasks-backend.json` など。領域は identifiers.md の 5）で、アプリは要る領域だけを実行時に fetch で読む（data.md の 4「課題集のファイル」）。SW は install で 6 つすべてを貯める（service-worker.md の 3）。
- AC-10 は差し替えずに、本番の課題集のまま seed で「出し終えた」履歴を入れる（PRD r5）。
- AC-44 の図の 6 型と、課題集の中身を決めて見たいテスト：`page.route('**/data/tasks-<領域>.json', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 見本 }))` で、目当ての領域のファイルだけを見本に差し替える。見本は contracts/fixtures/tasks/valid-sample-six-figure-types.json を写し、トップの `area`、課題の `area` と ID の領域を、差し替えるファイルの領域にそろえる（そろわないとアプリは「取れない」と扱う：data.md の 4）。seed の `diagnosis.area` も同じ領域にする。
- 配布物ごと差し替えるとき（AC-28）はビルドの `--tasks-dir` を使う（実行の環境の節）。
- それでも差し替えるときは `page.route` を使い、そのテストでは `serviceWorkers: 'block'` にする（SW が返すと route を通らないため：tech-lead G0 r2 の spike B）。渡し方は、テストの設定の `use`（`test.use({ serviceWorkers: 'block' })`。Playwright の文書は testOptions として説明）でも、`browser.newContext({ serviceWorkers: 'block' })` でもよい（https://playwright.dev/docs/service-workers 、https://playwright.dev/docs/api/class-browser ）。

## W-5 課題と段階の素性
- `[data-testid="task.today"]` の `data-task-id`、`data-task-area`、`data-task-level`、`data-task-mode`。値の語彙は identifiers.md の 5。
- 今の段階と診断の回答は、書き出しファイル（W-9）で読む。

## W-6 課題集のスキーマと検査
- スキーマ：contracts/schemas/tasks.schema.json。ajv（`ajv/dist/2020`、strict）で本番の 6 ファイルをそれぞれ検査する（AC-3、AC-29 の大半）。
- スキーマの外なので、テストのコードで数えるもの（2026-11-05 に直した。Takuma の決定 Q17、指揮役の決定「予算の割り直し」：docs/approvals/delegation.md）：
  - 件数：v1 は 210 以上。上級を足す 252 件版（12-14 の予定）は 252 以上。
  - 18 の組ごとの件数：v1 は初級 14 以上、中級 14 以上、上級 7 以上。252 件版はどの組も 14 以上。
  - ID の重複 0（AC-4）、組ごとの external の割合 20% 以下（AC-29）、初級の決まり（AC-34。語の検査は strings.md の 7）。
  - 予算（budgets.md の 2）：1 件の本文（2 の「数える項目」）の字数の平均が 1,200 以下、6 ファイルのどれも gzip 後 50,000 バイト以下（budgets.md の 1 の「課題集の 1 ファイル」）。
- budgets.md の 2 の予算のテストは、名前を `BUDGET2_` で始めます（例 `BUDGET2_本文と解説の平均は480字以下`、`BUDGET2_課題集はgzip後105000バイト以下`）。`AC<番号>_` の名前を付けず、G3 の AC の表に混ぜません。検証レポートでは AC の表とは別の「予算」の行に、合否と値を書きます。
- design の「AC にない状態」（design/001-daily-learning.md の 2 の表の下と 10 の決定。例：D-30 の知らせ `task.dayChanged`、U-15）だけを確かめるテストは、名前を `DESIGN_<design の番号>_` で始めます（例 `DESIGN_D30_…`、`DESIGN_U15_…`）。`AC<番号>_` の名前を付けず、AC のループ（例：AC-27 の「6 つの画面」）にも足さず、G3 の AC の表に混ぜません。検証レポートでは AC の表とは別の「design の状態」の行に合否を書きます（`BUDGET2_` と同じ扱い。G2 tech-lead r3 の提案 4）。

## W-7 データの投入（seed）
- 形：contracts/schemas/data.schema.json（保存の形と同じ）。見本：contracts/fixtures/seeds/ と contracts/fixtures/data/v1/。verifier は自分のフォルダに seed を置き、テストの中で ajv に通してから使う。
- 入れ方：`context.addInitScript` で localStorage のキー `kyounoitte:data` に JSON 文字列を書く。addInitScript は再読み込みのたびに動くので、印のキーで 1 回だけにする：
  ```js
  if (!localStorage.getItem('test:seeded')) { localStorage.setItem('kyounoitte:data', SEED); localStorage.setItem('test:seeded', '1'); }
  ```
  アプリは自分のキー以外に触らない（data.md の 1）ので、印は削除（AC-16）の後も残り、seed は入れ直されない。
- seed の setItem は、W-9 の失敗の注入より先に登録する（失敗は印を立てた後の 1 回だけなので seed は落ちないが、順番も守る）。
- 課題 ID の参照（2026-11-05 の付け替えの後。旧初級 → `<領域>-intermediate-001`〜`007`、旧中級 → `<領域>-intermediate-008`〜`014`、新しい初級（未経験向け）→ `<領域>-beginner-001`〜`014`、上級は変えない。ADR 0002 への記録は G1 tech-lead r2 の (m) で別に行う）：
  - seed の行と `current` の `taskId` は、本番の課題集（6 ファイル）にある ID だけにする。テストは seed を入れる前に、各 `taskId` が課題集にあり、行の `area` と `level` が ID の `<領域>-<段階>` と同じことを確かめ、違えば seed の誤りとして落とす。例外は、課題集にない ID をわざと入れるテスト（data.md の 5「課題集に ID がない行」）だけで、そのテストは注釈にそう書く。
  - ID は組の中の番号として使う。課題の中身（題名、本文、型、道具）を ID で決め打ちしない。付け替えで同じ ID の中身が変わったため（例：`backend-intermediate-001` の中身は旧初級の 1 件目）。中身が要るときは、テストの中で課題集から ID で引く。
  - 次に出る ID の期待値は、data.md の 5 の選び方（組の ID のうち `history` にも `current` にもない最も小さいもの）を本番の課題集に当てて求める。fixtures/seeds/ の見本は、どれも `backend-intermediate-` の 001 から古い順に使い、中級は 14 件あるので、付け替えの後もそのまま使える。
  - 付け替えの前に作った seed のうち `*-beginner-*` を使うものは、中身が新しい初級に変わった。段階の規則だけを見る seed はそのまま使えるが、中身や件数（旧初級は 7 件）に頼る seed は作り直す。
- 行の形（2026-11-06。PRD r13、ADR 0002 の改訂 2）：どの行も `answers`（`{ choice, correct }` の配列）と `score`（`correct` が true の数）を持つ。`done` は answers 3 件と `helpful`、`no_time` と `none` は 0〜2 件で `helpful` を持たない。`correct` は保存した事実なので、本番の課題集の `answer` と合わせなくてよい（見本は正解を `choice: 1`、不正解を `choice: 0` にした）。段階の規則（data.md の 5）を動かしたくない seed は、`done` の行の `score` を 2 にする（2 は「1 以下」にも「3」にも当たらないので、何件続いても段階は動かない）。規則で段階が動いた形を作る seed だけ、動いた行に `levelChange` を書く。
- AC-24 の seed（PRD r13）：fixtures/seeds/seed-ac24-stats.json。初めて開いた日 2026-11-01、`current` なし、6 行：11-01 done score 3・役に立った、11-02 none（answers 1 件で正解、score 1）、11-03 done score 1・役に立った、11-04 done score 2・未回答、11-04 done score 3・未回答、11-06 no_time（answers 0 件）。答えた問 13、正解 10（3 + 1 + 1 + 2 + 3。PRD の式の並びと同じ値）、低い正答数の完了 1。時刻を 2026-11-06 に固定して開くと、今日の行があるので `task.skipped`（data.md の 4 の 6-3）で、`issued` は 6 のまま。今日の行を入れないと、開いたときにアプリがその日の課題を出し、`issued` が 1 増える（4 の 6-4）。期待値は PRD の AC-24 の Then（数え方は data.md の 9）。AC-37 もこの seed から始める。
- AC-35 の seed は 4 通り（PRD の AC-35 の確かめ方）。完了の行が 6、10、29、99 の seed で開き、今日の課題を画面で完了して、S4 の累計 7、11、30、100 と `task.cheer` の `data-milestone`（7、`none`、30、100）と文言を比べる。
  - 6 件：fixtures/seeds/seed-ac35-six-completed.json（2026-11-01〜11-06 に `backend-intermediate-001`〜`006` を 1 日 1 件、どれも score 2 で完了。`device.persistRequested` は true）。時刻を 2026-11-07 に固定して開くと S3 で `backend-intermediate-007` が出る。画面で何問正解しても段階は動かない（上の「行の形」）。
  - 10、29、99 件：固定の見本は置かず、verifier が同じ形で作る。決まり：
    - 完了の行（`report: "done"`、answers 3 件、score 2）を n 行。1 つの ID は 1 回だけ（data.md の 8）。score を 2 にそろえ、画面で完了する 1 件で段階が動かないようにする。
    - 目標の組（`backend`、`intermediate`）には未出を 1 件以上残す（開いたときに今日の課題を出すため）。目標の組からは 13 件まで使い、残りは他の組の ID を使う（99 件は 1 領域の 35 件を超えるので、3 領域以上にまたがる）。他の組の行を古い方に、目標の組の行を新しい方に置く。他の領域の行を入れるときは、その領域の `levels` に最後の行の段階を入れる（data.md の 8 は `levels[diagnosis.area]` だけを求めるが、アプリが書く形に寄せる）。
    - 目標の領域の `levels` は目標の段階のまま（同じ領域の別の段階の行では書き換えない）。作った seed に data.md の 5 を当てて、次に出る ID が目標の組の最小の未出であることを確かめる（2026-11-05 に足した。G2 tech-lead r5 の提案）。
    - 日付は古い順で、同じ日に何行並べてもよい（data.md の 8）。どの行も `firstOpenDate` 以上。時刻は最後の行の翌日に固定する（最後の行の日に開くと 4 の 6-3 で `task.done` になる）。
    - ajv に通し、統計の `data-stat-completed` が n であることを完了の前に確かめる。
- AC-36 の seed：fixtures/seeds/seed-ac36-three-issued.json（目標の組 `backend` / `intermediate` の 001〜003 の 3 行：11-01 done score 2、11-02 no_time（answers 1 件）、11-03 none（answers 0 件））。時刻を 2026-11-04 に固定して開くと S3 で、`data-task-id` は `backend-intermediate-004`、`data-progress-index` は 4、`data-progress-total` は課題集のその組の件数（PRD の Given は 7 件の組。data.md の 9）。
- AC-8 の seed（9 通り。data.md の 5 の表）：見本は fixtures/seeds/ の `seed-ac8-<通り>-*.json` の 10 件（7 通り目は `7a-beginner-floor` と `7b-advanced-ceiling`）。各行の `level` はその課題が出たときの段階。時刻は最後の行の翌日に固定して開き、S3 で問 3 つを、表の「画面で答える score」になるように答える（正解は本番の課題集の `answer` を引く）。まとめへ進んだ後、`task.next` を押して出た S3 の `data-task-level` を表の値と比べ、書き出しで `levels.backend` と最後の行の `levelChange` を確かめる。8 通り目の seed だけ、`levels` が `intermediate` で古い 2 行の `level` が `advanced`（2 行目に `levelChange: "down"`）。
  - 9 通り目：seed-ac8-9-same-day-two.json（段階は中、前日 2026-11-02 の done score 3 の 1 行だけ）。時刻を 2026-11-03 に固定したまま、画面で score 1 → まとめ → `task.next` → score 1 → まとめ → `task.next` と進め、最後の S3 の `data-task-level` が `beginner` で、`task.level.adjusted.down` が 1 つ見える（data.md の 5 の「段階が変わった知らせ」）。時刻は動かさない。
- design の 5.1 #33（S7 levelDone で `task.exhausted.seenNext` がある状態。design/001-daily-learning.md の 5.1）：固定の見本は置かない（課題集の中身に依存するため。AC-10 と同じ）。作り方：
  - `diagnosis` は `backend` / `intermediate`、`levels.backend` は `beginner`、`current` なし。
  - `history` の古い順に、`backend-intermediate-001` と `002` を `level: "intermediate"` の done score 1 で 2 日（2 行目に `levelChange: "down"`。この 2 行で初級に下がった形。data.md の 5）。続けて本番の課題集の `backend-beginner-*` をすべて `level: "beginner"` の done score 2 で入れる（score 3 を 3 行続けると段階の規則で中級に上がる形になり、`levels` と食い違う）。
  - 時刻は最後の行の翌日に固定して開く。目標の組（`backend`、`beginner`）の未出が 0 件なので S7（data.md の 4 の 6-4）、`levels` が `beginner` なので levelDone。次の段階の組（`backend`、`intermediate`）に未出が 12 件あり、`history` に中級の行があるので `task.exhausted.seenNext` が 1 つ（data.md の 5「S7 の変種と補足の 1 文」）。
  - 対の確かめ（任意）：中級の 2 行を外すと補足なし、中級の 14 件をすべて `history` に入れると `task.exhausted.nextDone`。
- AC-14 の seed は 2 通り（PRD r11 の AC-14 の確かめ方。Q11 は A。2 通り目は PRD r8 で「翌日」から「同じ日に次へ進む」に変わった）。
  - 1 通り目（`task.exhausted` からやり直す）：出し終えた履歴（完了 3 件を含む）。AC-10 と同じく本番の課題集から作る（今の組の課題をすべて `history` に入れ、そのうち直近 3 日の 3 件を `done` にする）。PRD の Given「今日の課題はまだ出していない」は、data.md の 4 の 6-4 の下では、目標の組を出し終えた日（`task.exhausted`）にしか作れないため。固定の seed は置かない（課題集の中身に依存するため）。
  - 2 通り目（`task.today` からやり直す）：fixtures/seeds/seed-ac14-three-completed.json の形（完了 3 件、最後の行は 2026-11-03、`current` なし）で開き、`task.today` とその `data-task-id` を確かめてからやり直す。時刻は最後の行より後の日（例 2026-11-04）に固定する（2026-11-03 に開くと 4 の 6-3 で `task.done` になる。6-2 と 6-3 の順は 2026-11-05 に入れ替えた）。やり直しで選ぶ領域は seed の `backend` 以外にする。
    - やり直しの直後：data.md の 2 の表（今日の課題を出した後のやり直しは `current` を書かない）と、終えた後の行き先（同じ 2）により、今日の `current` が残るので 4 の 6-2 で `task.today` のまま。確かめること：S3 のまま、`data-task-id` がやり直しの前と同じ、`data-task-area` は `backend` のまま。S10 の完了（`data-report="done"`）は 3 行のまま。
    - 続けて同じ日のうちに（時刻は動かさない）、その課題を完了（`task.report.done`）→ S4（`task.rate`。`task.rate.helpful` などで答えるか閉じる）→ S5（`task.done`）→ `task.next` を押す（design の 2 の AC-14 の行と同じ流れ）：4 の「操作で出すとき」で新しい `diagnosis.area` と `levels` の組から選び、S3 です。確かめること：`data-task-area` が新しく選んだ領域、`data-task-nth-today` が `2`（今日の完了の行 1 + 1。data.md の 9）、`data-task-id` がやり直しの前の課題と違う。完了した課題はこのとき 4 件（PRD の Then の「3 件のまま」は、完了を押す前のやり直しの直後に確かめる）。
  - seed-ac14-three-completed.json は 1 通り目の Given を満たさない（開くと今日の課題が出る）。完了 3 件の履歴の見本として、AC-14 の 2 通り目のほか AC-5、AC-16 などにも使う。

## W-8 履歴の読み出し
- S10 の `[data-testid="history.row"]` の `data-task-id`、`data-date`、`data-report`（`done`、`no_time`、`none`）、`data-score`（0〜3）、`data-helpful`（`done` の行だけ。`helpful`、`not_helpful`、`unanswered`）。`history.row.answer.item` の `data-correct`（identifiers.md の 3 と 4）。
- 「完了」は `done`（W-8 案の `completed` ではない）。S10 に出るのは `history` だけで、まだ申告していない今日の課題は出ない。

## W-9 失敗と拒否の注入、書き出しの形
- 保存の失敗（AC-11）：addInitScript で `Storage.prototype.setItem` を包み、テストが印（ページの `globalThis` に置くテスト側の変数。アプリは読まない）を立てた後の次の 1 回だけ `new DOMException('injected', 'QuotaExceededError')` を投げる。投げたら印を下ろす。アプリは保存 1 回につき setItem を 1 回だけ呼ぶ。保存データが「なし」か「診断の途中」の起動では setItem を呼ばない（AC-11 の注入はこの状態で行う）。「あり」の起動では data.md の 2 のとおり最大 1 回（診断の 2 問目の確定はちょうど 1 回の setItem）。
- 永続化の拒否（AC-13）：addInitScript で `StorageManager.prototype.persist = async () => false` と `StorageManager.prototype.persisted = async () => false` の両方を入れる（data.md の 11）。
  - S8 の注意 `settings.storage.notPersisted` は、S8 を描くたびに `persisted()` を読んで決まる。`persist()` だけを注入すると、エンジンの既定の `persisted()` の値で結果が変わる。
  - アプリは `persist()` を、保存データで初めて今日の課題を出した後の S3 で 1 回だけ呼ぶ（`device.persistRequested` が true なら呼ばない。求め直さない。data.md の 11）。初回の診断を終えた読み込みではちょうど 1 回。その後は 0 回（同じ日の再読み込みの `task.done`、日付を進めて翌日の課題が出た S3 も 0 回）。
  - 初回の診断を終える保存（3 問目の確定。setItem 1 回）に `device.persistRequested: true` が入る。`device.persistGranted` は書かれない。確かめるのは、上の回数、保存データの印、S8 の表示。
  - 「保存データの印」の読み方：`page.evaluate(() => localStorage.getItem('kyounoitte:data'))` で文字列を読み、テスト側で `JSON.parse` して `device.persistRequested` と `device.persistGranted` を見るだけです。読むのは `getItem` 1 回で、`setItem` も `removeItem` もしません（AC-11 の注入の回数と、アプリの保存の回数を変えないため）。読んだ値は contracts/schemas/data.schema.json に ajv で通してよい（形の崩れも見つけられる）。書き出し（下）には `device` が入らないので、印はこの方法でだけ読みます。保存の形は公開の契約（data.schema.json）なので、アプリの中を覗くことには当たりません。
  - S8 の待つ上限（data.md の 11。1,000 ms）を確かめるときは、addInitScript で `StorageManager.prototype.persisted` を、返らない約束（`() => new Promise(() => {})`）か、`setTimeout` で遅らせて `false` を返す約束にしてよい。W-3 の `setFixedTime` の下でもタイマーは動きます。確かめるのは、上限の後に S8 が注意なしで描かれること、待つ間の操作が優先されて遅れて S8 が描かれないこと、`pageerror` が 0 件であること。
  - 印のない「あり」の seed で開くと、その起動で今日の課題を出したとき（data.md の 4 の 6-4）に 1 回呼ぶ。回数を数えるテストは初回の診断から始めるか、seed に `device: { "persistRequested": true }` を入れる。
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
- AC-15 は他のテストと並列にしない（AC-15 だけを workers 1 で別に流す）。他の worker の負荷が混ざると、測りたいアプリの速さが測れないため（2026-11-05 の指揮役の決定、docs/approvals/delegation.md）。期待値 2,000 ms、5 回、1 回ごとに新しいコンテキスト、は上のとおりで変えない。
- serviceWorkers は既定（allow）のまま。初めての訪問では SW はまだ動いておらず、登録は画面を描いた後（service-worker.md の 1）。
- 監査の道具 @axe-core/playwright（AC-27）は contracts/dependencies.md にある。

## 時間の計り方（AC-1、AC-2、AC-23、AC-33、AC-41 の秒数）
G2 tech-lead r2 の要修正への決定です。今の `expect(...).toHaveAttribute` で終わりを待つ形は、Playwright の確かめる間隔（270 ms を過ぎると 500 ms おき）の分だけ値が長くなるので使いません。
- 決定：文書が変わらない区間（AC-1、AC-2、AC-33。AC-12 で同じ操作を計るときも）は、ページの中で計る（案 (a)）。文書が変わる区間（AC-23 の再読み込みと新しいタブ）は、テストの側の時計と 20 ms おきの `expect.poll` で計る。
- AC-15 との違い：AC-15 の `data-debug-load-ms`（W-10）はアプリが出す値で、時計を固定しないテストで読む。AC-1、AC-2、AC-23、AC-33 の値はテストが計る値で、アプリは何も書かない。本番の配布物には何も入れない。
- 値は ms の整数（小数は切り上げ）で annotation に残し、G3 の証拠にする。合否は「値 ≤ 上限」。

### 文書が変わらない区間（AC-1、AC-2、AC-33、AC-41）
1. 仕掛け：計る文書で、最初に計る click の前に `page.evaluate` で 1 回だけ入れる（再読み込みしたら入れ直す）。記録はテスト側の変数 `globalThis.__acceptanceTiming` に置く（W-9 の印と同じく、アプリは読まない）。
2. 始点：`window` に capture 段の `click` リスナー（`addEventListener('click', h, { capture: true })`）を置き、`performance.now()` と、`event.target.closest('[data-testid]')` の `data-testid` を記録する。始点にするのは、計る操作の testid（下の表）の click のうち最後の 1 件。radio の `check()` も click を出す（spike 1 で `area.backend` の click も記録された）ので、testid で分ける。
3. 終点：`new MutationObserver(cb).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-state', 'data-question-index', 'data-answer-result'] })`。cb では変化の記録でなく、その時点の DOM を読む（`<html>` の `data-state` と、`[data-testid="diagnosis.progress"]` の `data-question-index`。なければ null。AC-41 では、始点の click の `event.target.closest('[data-testid="task.question"]')` の `data-question-number` も始点と一緒に記録し、cb ではその番号の `task.question` の `data-answer-result` を読む）。前の記録から変わったら、`performance.now()` と一緒に記録する。childList も見るのは、アプリが要素を作り直す実装でも取りこぼさないため（spike 1 は作り直す実装で計った）。
4. 区間と終点の条件（終点は、始点より後の記録のうち、条件を満たす最初のもの）：

   | 区間 | 始点の testid | 終点の条件 | 上限 |
   |---|---|---|---|
   | 始める → 1 問目 | `diagnosis.start.begin` | `data-state` が `diagnosis.question`、`data-question-index` が `1` | 500 ms |
   | n 問目 → n+1 問目（n＝1、2） | `diagnosis.next` | `data-state` が `diagnosis.question`、`data-question-index` が n+1 | 500 ms |
   | 3 問目 → 課題 | `diagnosis.finish` | `data-state` が `task.today` | 1,000 ms（AC-2） |
   | 次の一手に進む → 課題（`task.done` からと `task.skipped` から） | `task.next` | `data-state` が `task.today` | 1,000 ms（AC-33） |
   | 選択肢 → 返し（問 1〜3 のそれぞれ） | `task.choice` | 始点で記録した番号の `task.question` に `data-answer-result`（`correct` か `incorrect`）が付く | 300 ms（AC-41） |

   「選択肢 → 返し」の区間（2026-11-06。design の D-47、U-29）：アプリは選択肢の click の handler の中で、同期で次の順に行い、`data-answer-result` を最後に付けます（終点の時点で返しはそろっている）。(1) setItem 1 回（失敗したら error を出して終わり、属性は付けない）、(2) 3 つの選択肢に `data-choice-state` と `aria-disabled="true"`、(3) 返しの中身（`task.question.status` の中の正誤の `<p>`、ミルの `<aside>` と `<img>`（src は入れ、デコードは待たない）、説明、「次の問題へ」か「まとめへ」）、(4) `task.today` の `data-task-question-index` を 1 増やす、(5) その問の `data-answer-result`。答えた後の 2 回目の click は記録に残っても、`data-answer-result` は変わらないので終点に使われない（始点は最初の click にする：同じ番号で 2 件目の始点を取らない）。

   AC-33 は同じ文書で 2 件目と 3 件目を続けて出すので、`task.next` を押すたびに 1 つの値を取る（始点はその回の click、終点はそれより後で条件を満たす最初の記録）。間に「完了」などで `data-state` が `task.rate` や `task.done` に変わるので、前の回の `task.today` は終点に使われない。再読み込みの確かめ（AC-33 の「再読み込みしても同じ」）の後に続けて計るときは、1 の仕掛けを入れ直す。目標の組を出し終えて `task.exhausted` になったら終点の記録がないので「計れなかった」で落ちる（AC-33 の Given の「未出が 2 件以上」を seed で満たす）。

5. 値＝終点 − 始点。差を取った後で、今の expect で状態と中身を確かめる（expect は正しさの確かめで、時間には使わない）。始点か終点の記録がなければ「計れなかった」として落とす（null や 0 を通さない）。
6. 終点は DOM が変わった時刻で、画面に塗られる次のフレーム（60 Hz で約 17 ms）は含めない。AC-15 の `data-debug-load-ms` も `data-state` を書いた直後の時刻なので、定義をそろえる。`data-state` はその状態の DOM を入れ終えた後に書く（identifiers.md の 1）ので、終点の時点で中身はある。
7. W-3 の setFixedTime の下でも使える。ページの `performance.now()` は Playwright の置き換え（`() => clock.performanceNow()`）になるが、同じ文書の中の差は実際の時間どおりに進む（spike 1）。ページの `Date.now()` は止まっているので使わない。
8. 設計メモ 6 の「申告から次の状態まで」の記録（AC-5、AC-7）も、この仕掛けで計ってよい（始点は申告のボタンの testid、終点は `data-state`）。

### 文書が変わる区間（AC-23 の 1・2 通り目）
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

## W-12 通信の数え方（AC-12、AC-23、AC-44）
- 「送信」＝ `page.on('response')` のうち `response.fromServiceWorker()` が false のもの + `page.on('requestfailed')` の件数。数えた 1 件ごとに `{ url, resourceType: request.resourceType(), fromServiceWorker, failed }` を記録し、annotation に残す（0 件でなかったときに、何が出たかを G3 の証拠で読めるようにする）。
- AC-44 の「図の画像の要求が 0」：S3 を描いてから図を確かめ終えるまでの `page.on('request')` のうち、`request.resourceType() === 'image'` で、URL のパスが `/engineer/img/miru-` で始まらないものが 0 件（図は HTML と CSS と inline SVG だけ：design の D-50。ミルの絵は ADR 0008 で数えない）。ここでは SW が返した要求も数える（図が画像を持たないことを確かめたいので、通信の有無は問わない）。数える区間は「オフラインにした直後から、Then を確かめ終えるまで」。
- `page.on('request')` をそのまま数えない（SW が返した要求も request として出る：tech-lead G0 r2 の spike で 9 件）。
- Q1 は A（外に送らない）なので、除く送信先はない。
- オフラインは `context.setOffline(true)`。

## W-17 SW が貯め終える前のオフライン（AC-23 の 3 通り目、design の 5.1 #47 と #56。2026-11-06）
目当ての領域のファイルを、先読みを待たずにオフラインで取らせる手順です。SW が動くと install で 6 ファイルを貯めてしまい、この状態を作れないので、SW を止めて開きます。
1. コンテキスト：`browser.newContext({ serviceWorkers: 'block', timezoneId: 'Asia/Tokyo', locale })`。SW は登録されず、領域のファイルはふつうの通信でだけ取れる（service-worker.md の 3「貯め終える前」）。
2. #47（初回の診断）：保存データなしで開き、`diagnosis.start.begin` → 1 問目で目当ての領域の radio を選ぶ → `context.setOffline(true)` → `diagnosis.next`（1 問目の確定。ここでアプリが領域のファイルの先読みを始め、オフラインなので失敗する）→ 2 問目、3 問目を選ぶ → `diagnosis.finish`。
   #56（やり直しで別の領域へ）：診断済みの seed（目標の領域 `backend`）で開き、`task.today` を待つ（`tasks-backend.json` はこの時点で読み終えている）→ S8 の `settings.redo` → 1 問目で `backend` 以外の領域を選ぶ → `context.setOffline(true)` → `diagnosis.next` → 2 問目、3 問目 → `diagnosis.finish`。
   setOffline は、目当ての領域のファイルの要求が出る前（1 問目の確定の前）に呼ぶ。確定の後に呼ぶと先読みが間に合って、この状態にならないことがある。
3. 確かめること：`data-state` が `diagnosis.question` のまま、`data-question-index` が 3、選んだ 3 つの radio が checked のまま、`error.tasks.offline` と `task.next.retry` が 1 つずつ、`diagnosis.finish` を押す前と後で `localStorage.getItem('kyounoitte:data')` が同じ（保存しない。読むのは getItem だけ：W-9）、`pageerror` が 0 件。目当ての領域のファイルの `requestfailed` が 1 件以上（W-12 の記録に出る）。
4. `context.setOffline(false)` → `task.next.retry` → `data-state` が `task.today` で、`data-task-area` が選んだ領域。
5. 未確認：`serviceWorkers: 'block'` と `setOffline(true)` の組で、WebKit の fetch が失敗として返ること（Chromium と WebKit の両方で、G2 の最初の実行の出力を evidence に残す）。

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

## 完了の演出の確かめ方（AC-35、design の D-43 と 5.1）
アプリは演出のためのつなぎ口を持ちません。テストはブラウザの仕組みだけで確かめます。
- 動きを減らす設定：コンテキストの `reducedMotion: 'reduce'`（`browser.newContext({ reducedMotion: 'reduce' })`）か `page.emulateMedia({ reducedMotion: 'reduce' })`（https://playwright.dev/docs/api/class-page#page-emulate-media ）。どちらでも `matchMedia('(prefers-reduced-motion: reduce)').matches` が true になる。
- reduce のとき：「完了」を押して `data-state` が `task.rate`（S4）になった直後に、`page.evaluate(() => document.getAnimations().length)` が 0、`[data-testid="task.total.prev"]` の件数が 0。`task.rate.mark` はある（形は完成したもの）。
- reduce でないとき：S4 に着いた直後は `document.getAnimations().length` が 1 以上（印の線。CSS の animation-fill-mode が forwards か both なら、終わった後も getAnimations に残る：下の spike）。件数の上限は決めない（作りで変わるため）。
- `task.total.value` のテキストは、reduce の有無によらず、S4 に着いた直後に読んだ値が最終の値（新しい累計の文言。`data-stat-completed` も同じ値）。途中の値は `task.total.prev`（`aria-hidden`）にだけある。
- スクリーンショット（5.1 の S4 の行）：reduce でない設定で、`data-state` が `task.rate` になってから 1 秒（`page.waitForTimeout(1000)`）待ち、さらに `[data-testid="task.total.prev"]` が DOM から消える（件数が 0 になる。`animationend` で外れる）まで待って撮る。演出は通常 550 ms、節目 950 ms で止まる（design/tokens.md の 5）。1 秒は節目の 950 ms に対して余裕が 50 ms しかないので、消えるまで待つことで撮影の時点を演出の終わりの後にそろえる（2026-11-05 の指揮役の決定）。`page.screenshot` は既定（`animations: 'allow'`）のまま撮る。`expect(page).toHaveScreenshot` は既定が `'disabled'`（終わりまで早送りする）なので、使うなら `animations: 'allow'` を渡す（backend/tests/acceptance/node_modules の playwright の型定義で確認。https://playwright.dev/docs/api/class-page#page-screenshot ）。
- W-3 の setFixedTime の下でも、CSS のアニメーションは実際の時間で進む（固定されるのは `Date`。ページの `performance.now()` は W-3 の置き換えでも差は進む）。
- spike（tech-lead、2026-11-05。リポジトリの外。Playwright の Chromium 156.0.8078.4 と WebKit 27.2。D-43 と同じ SVG（`pathLength="1"` のチェックと円、`stroke-dasharray: 1`、`@keyframes` で `stroke-dashoffset` 1 → 0、400 ms、fill both、`@media (prefers-reduced-motion: no-preference)` の中だけでアニメーションを付ける））：
  - 両方で `path.pathLength.baseVal` が 1、始めの `stroke-dashoffset` が 1px、600 ms 後に 0px、アニメーションは 2 件で `finished`（currentTime 400）のまま残る。
  - `reducedMotion: 'reduce'` では両方で `getAnimations()` が 0 件、`stroke-dashoffset` は最初から 0px。
  - WebKit は Safari 17 そのものではない（budgets.md の 5）。

## 図、ミル、正誤の読み上げの確かめ方（AC-41、AC-44、AC-45、design の D-48、D-52、D-53、D-57。2026-11-06）
- 線の対比（AC-44、D-52。G1 tech-lead r3 の提案 1）：`[data-testid="task.figure"]` の中の `[data-figure-part="line"]` の要素ごとに、色を次のように読む。`<svg>` なら計算済みの `stroke`。それ以外は、上右下左の辺ごとに計算済みの `border-<辺>-width` が `0px` でない辺の `border-<辺>-color`（`border-color` は 4 辺をまとめた値で、辺ごとに違うと 4 つの値の列になるので使わない）。地は `task.figure` の計算済みの `background-color`（D-50 で明示する。`rgba(0, 0, 0, 0)` なら地がないとして落とす）。両方とも `rgb()` / `rgba()` に解決される（G1 tech-lead r3 の spike）。WCAG の相対輝度で比を出し、3:1 以上。強調の枠（`[data-figure-part="box"]` の highlight の位置）も同じ式で 3:1 以上。ライトとダーク（`colorScheme`）、コントラストを上げる設定（`forced-colors` ではなく `prefers-contrast: more`。`page.emulateMedia({ contrast: 'more' })` が使えなければ未確認と書く）で行う。期待の目安（design/tokens.md の 1。補助の (b)）：線はライト 5.02、ダーク 8.99、上げる設定 9.06 と 13.78。箱の枠は 16.48 と 15.29。測った値が目安と 0.05 より大きく違えば、実装が別の色を当てている疑いとして annotation に残す（合否は 3:1）。
- ミルの整数倍（AC-45、D-54、ADR 0008）：`[data-testid="guide.sprite"]` の `<img>` が `complete` になるまで待ち、`getBoundingClientRect().width / naturalWidth` と `height / naturalHeight` がどちらも整数（今は 96 / 48 = 2）。計算済みの `image-rendering` が `pixelated`。読み込まれた絵は今の配色の 1 枚だけ（ライトは `miru-<mood>.png`、ダークは `miru-<mood>-dark.png`。`page.on('request')` の URL で数える）。
- 動きを減らす設定（AC-45、D-57）：`reducedMotion: 'reduce'` で、返しを描いた直後とミルが出た直後に、`[data-testid="guide.character"]` の要素の `getAnimations({ subtree: true }).length` が 0（`document.getAnimations()` は他の部分の動きも含むので、ミルの確かめには使わない）。S4 の確かめは上の「完了の演出の確かめ方」のまま。
- 正誤の読み上げ（AC-41、D-48）：自動のテストで確かめるのは形だけ。各 `task.question` を描いた時点で、空の `[data-testid="task.question.status"]`（`role="status"`、`aria-live="polite"`）が DOM にあり、答えた後にその中に `task.answer.result.correct` か `.incorrect` の `<p>` が 1 つだけある（`<p>` に role は付けない）。実際に読み上げられるかは、G3 で手で確かめる（macOS か iOS の Safari の VoiceOver で、問 1 に正解、問 2 に不正解で答え、「正解」「惜しい」が読まれることを、手順と結果の記録で証拠にする。Playwright は読み上げを確かめられない）。

## AC-31 の重なる要素の数え方
`data-state="task.today"`（と `task.done`）を、操作 0 回で読んだ後に：
1. `page.getByRole('dialog')` の件数が 0（ネイティブの `<dialog>` は属性を書かなくても dialog の役割を持つ。閉じたダイアログは DOM にない：identifiers.md の 3）。
2. `[aria-modal="true"]` の件数が 0。
3. 計算済みの `position` が `fixed` か `sticky` の要素のうち、`[data-testid="task.today.title"]` の矩形と重なるものが 0（`getBoundingClientRect` で比べる。`task.done` では題名の代わりに `task.done.title`）。題名とその祖先（`el === title || el.contains(title)`）は数えない（祖先は子孫の下に描かれ、題名を覆わないため）。

## AC-28 の配布物の差し替え
1. `build({ out: 旧, version: '2026-11-30.1' })` と、課題を足した課題集で `build({ out: 新, version: '2026-12-14.1', tasksDir: 足した 6 ファイルのフォルダ })` を作る（本番の 6 ファイルを写し、1 つに課題を足す）。足す課題は、スキーマに通る未使用の ID（例 `backend-intermediate-900`）にする。
2. サーバーで旧を配り、seed を入れて読み込み、W-13 の合図を待つ。
3. サーバーの中身を新に差し替え、2 秒以上あけて再読み込み（最大 3 回）。毎回 `data-build-version` を記録する。
4. 新の値になった後は旧に戻らないこと、書き出しで履歴と診断と段階が差し替えの前と同じことを確かめる。

## 本番に入っていないことの確かめ（reviewer、G2）
- `grep -rnE "__test|[?&](reset|now|seed)=|location\.search" backend/public` が 0 件。
- アプリが読む URL の引数はない（`location.search` を読まない）。
