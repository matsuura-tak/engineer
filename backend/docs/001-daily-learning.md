# 実装ノート：001-daily-learning（今日の一手）

- 書いた役：backend-engineer　日付：2026-11-03（ステップ 13。前の backend-engineer の作りかけを引き継いで検査し、単体テスト、この文書、RUNBOOK を足した）。2026-11-04：design r6 と契約の更新（data.md の 2、4、11、identifiers.md の task.dayChanged、test-hooks.md の W-3、W-9）と、G3 の design-reviewer r1 の指摘 4〜6 を実装した（8 の「G3 design r6 の直し」）。2026-11-04（2 回目）：reviewer G2 r3 の要修正（やり直しの S2 で「やめる」の後に「次へ」で TypeError）と、契約 f40c61a（data.md の 11 の S8 の待つ上限と待つ間の操作、budgets.md の 1 と 6 の枠）を実装した（8 の「G2 r3 の要修正と契約 f40c61a の直し」）
- 入力：docs/prd/001-daily-learning.md（r7）、design/001-daily-learning.md（r6）、design/tokens.md（r5）、docs/approvals/delegation.md（2026-11-03、11-04）、contracts/（data、strings、identifiers、test-hooks、service-worker、budgets、dependencies、schemas、fixtures、tools）、docs/adr/0001〜0005、docs/adr/features/001-daily-learning.md、docs/verification/001-daily-learning/test-plan.md
- 形：サーバーなしの静的な Web アプリ（ADR 0001）。HTTP の API、DB、認証、外部サービスはない。手引きの API と DB 向けの節は、当てはまらない理由を書いて「対象外」にした。

## 1. 契約との対応表
contracts/openapi.yaml はない（API がない）。代わりに、AC ごとに実装の場所とテストを並べる。受け入れテストは backend/tests/acceptance/tests/ のファイル名、単体テストは backend/tests/unit/ のファイル名。

| AC | 中身 | 実装の場所 | 受け入れテスト | 単体テスト |
|---|---|---|---|---|
| AC-1、AC-2 | 3 問の診断と、直後の 1 件目 | js/view-start.js（startScreen、questionScreen）、js/main.js（showStart、showQuestion、onAnswer）、js/rules.js（answerInitial、finishInitial） | ac01-ac02-diagnosis | rules（診断：1 問目で firstOpenDate…） |
| AC-3、AC-4、AC-29 | 課題集の形、件数、in_app の割合 | public/data/tasks.json（= docs/prd/001-daily-learning/tasks.v1.json）、scripts/lib/tasks-check.mjs、scripts/build.mjs | ac03-ac04-ac29-tasks-json | tasks-check |
| AC-5、AC-6、AC-7、AC-9 | 申告、同じ課題を出さない、役に立ったの評価、1 日 1 回 | js/view-task.js（todayScreen、rateScreen、doneScreen、skippedScreen）、js/main.js（onReport、showRate）、js/rules.js（pickTask、reportTask、rateTask、startOfDay） | ac05-ac06-ac07-ac09-report | rules（pickTask…、完了の申告は…） |
| AC-8 | 段階の規則（2 回連続） | js/rules.js（applyLevelRule、reportTask） | ac08-level-rule | rules（AC-8 の 9 通り、契約の seed 3 件、翌日から効く） |
| AC-10、AC-30 | 課題が尽きた、外で行う印 | js/view-task.js（exhaustedScreen、todayScreen の external の部分）、js/rules.js（startOfDay） | ac10-ac30-exhausted-external | rules（課題を出し尽くすと…） |
| AC-11、AC-13 | 回答ごとの保存、保存先が使えない、壊れたデータ、persist() は 1 回だけで結果は保存しない、S8 の注意は persisted() で決める | js/store.js、js/persist.js（canRequestPersist、requestPersist、readNotPersisted、drawWhenPersistedKnown、PERSISTED_WAIT_MS）、js/rules.js（markPersist、planDay）、js/main.js（decide、route、commit、askPersist、showSettings、drawSettings、showError、retryStartupSave）、js/view-start.js（errorScreen、storageError） | ac11-ac13-storage、design-d31-persisted-wait（DESIGN_D31_ の 2 本。AC の外） | store、day-persist（persist の印…、requestPersist…、S8 の注意…、S8 の待つ上限…、S8 の待ち…） |
| AC-12、AC-23 | 送信 0 件、オフラインの再読み込み | public/sw.js、js/main.js（scheduleServiceWorker、fetchJson は同じ origin の配布物だけ） | ac12-ac23-offline | build（FILES の一致） |
| AC-14、AC-16 | 診断のやり直し、全部の削除 | js/main.js（startRedo、cancelRedo、openDeleteConfirm）、js/rules.js（finishRedo）、js/store.js（removeAll） | ac14-ac16-redo-delete | store（removeAll）、rules |
| AC-15 | 遅い回線で 2 秒 | index.html の modulepreload と preload、js/main.js（data-debug-load-ms） | ac15-load-time（Chromium だけ） | build（modulepreload の一致は build.mjs が検査） |
| AC-17、AC-18、AC-27 | 320px、200%、axe | public/app.css、js/dom.js | ac17-ac18-ac27-a11y | — |
| AC-19、AC-20、AC-25 | 書き出し、読み込み、新しい版を拒む | js/files.js（download、readImport）、js/rules.js（exportOf、importReplacement）、js/main.js（onImportFile、replaceWith、openImportConfirm） | ac19-ac20-ac25-export-import | validate、i18n-files（読み込み）、rules（書き出しは device を除き…） |
| AC-21、AC-22 | ホーム画面の案内、スタンドアロンの読み込みの案内 | js/main.js（isIosSafari、isStandalone、showStart）、js/view-start.js（guideSection、importer） | ac21-ac22-home-screen | — |
| AC-24 | 統計の 9 つの値 | js/rules.js（stats）、js/view-settings.js（statsScreen）、js/main.js（showStats） | ac24-stats | rules（統計の 9 つの値、直近 7 暦日） |
| AC-26 | 日英の文言 | public/i18n/ja.json と en.json、js/i18n.js | ac26-language | i18n-files |
| AC-28 | 新しい版に 3 回以内で切り替わる | public/sw.js（skipWaiting、clients.claim、古い kyounoitte- のキャッシュを消す）、scripts/build.mjs（版の書き込み） | ac28-update | build |
| AC-31、AC-32 | 操作 0 回で今日の課題、書きかけの答え | js/main.js（route、showToday、saveAnswer、flushAnswer）、js/rules.js（setAnswer、startOfDay） | ac31-ac32-zero-ops-answer | rules（日付が変わると…答えも残る） |
| design D-30、U-15（AC の外） | 画面を開いたまま日付が変わった後の最初の操作：操作をせず読み直して判定、`task.dayChanged`。「なし」「途中」の画面と S0 error は日付を確かめない | js/main.js（act、clearNotice、dayChanged、render の lead と checkDay）、js/rules.js（checksDay、carryAnswer、planDay）、js/view-task.js（dayChangedNotice） | design-d30-day-changed、ac17-ac18-ac27-a11y（AC27_task.today.dayChanged） | day-persist（日付の変わり目…、U-15…、carryAnswer…） |
| design-reviewer G3 r1 の 4〜6 | 行の先頭のリンクと summary の左端、480 px 未満のボタンの幅、答えの保存のエラーの枠 | public/app.css（`.site-header nav`、`.screen p > .link:only-child`、`summary`、`.btn` の幅、`textarea.is-error`）、js/view-task.js（todayScreen の syncAnswerError） | ac17-ac18-ac27-a11y（押せること、切れないこと） | —（8 の Playwright の実測） |

## 2. 認可の表と交差テスト
対象外。サーバーも利用者のアカウントもない。データは利用者のブラウザの localStorage（キー `kyounoitte:data`）にだけあり、他人の行という概念がない。信頼の境界は 2 つ（docs/adr/features/001-daily-learning.md の 3）で、次のように扱った。
- 読み込むファイル（信頼しない）：JSON.parse → 版 → 手書きの検査（validate.js。知らない項目を拒む許可リスト）を通ったものだけを使う。5,000,000 バイトを超えたら読まない。表示はすべて textContent（innerHTML などは 0 件。8 の grep）。単体テスト：validate（知らない項目…、__proto__…）、i18n-files（読み込み：…）。
- 同じ origin の他の Pages：同じ localStorage と Cache Storage が見える。アプリは自分のキーと `kyounoitte-` で始まるキャッシュにしか触らない（store.test の removeAll、sw.js の activate）。他の Pages にルートの SW を置かない決まりは RUNBOOK の 6。

## 3. データの変更
DB のマイグレーションはない（squawk、up と down のログは対象外）。保存データの形は contracts/data.md の v1（`formatVersion: 1`）で、移す手順はまだない（v1 が最初の版）。新しい版のファイルは拒む（AC-25）。形を変えるときは formatVersion を上げ、古い版を読んで移す手順を足す（data.md の 6）。contracts/fixtures/data/v1/ の見本は validate.test が読み続ける。

## 4. 互換性
oasdiff は対象外（OpenAPI がない）。古い版のアプリとの関係は次のとおり。
- 新しい版を配ると、SW が古い版のキャッシュを消して 3 回以内の読み込みで切り替わる（AC-28、受け入れテストで確認）。保存データは残る。
- 課題の ID は消さず使い回さない（identifiers.md の 5）。tasks-check.test が tasks.json の ID の重複 0 件と 126 件を確かめる。
- 2026-11-04 の変更で保存データの形は変えていない（`formatVersion` は 1 のまま）。前の実装が書いた `device.persistGranted` は読めるまま残し（validate.js とスキーマは許す）、新しくは書かない（data.md の 2）。前の版のアプリが新しい版の保存データを読んでも、`persistGranted` は省略できる項目なので「読めない」にならない。前の版は `persistRequested` が true なら persist() を呼ばないので、印を書いた後に古い版に戻しても求め直さない。

## 5. 失敗の扱い
Idempotency-Key、ページング、RFC 9457 は対象外（HTTP の API がない）。代わりに次を決めた。
- 保存は 1 回の setItem。失敗（容量、使えない）は false を返し、前のデータのまま（store.test の save）。起動時の保存の失敗は `error.storage.message` と再試行（main.js の retryStartupSave）。
- 壊れたデータは消さず、`error.app.exportRaw` で元の文字列のまま保存できる（store.test：読むだけで消さない）。
- 読み込みの失敗は 2 種類だけ：`error.import.reason.version` と `error.import.reason.schema`（data.md の 7）。
- 配布物（i18n と tasks.json）を読めないときは console に名前だけを出して止まる（中身を出さない）。
- 画面を開いたまま日付が変わった後の操作（data.md の 4）：答えのタイマーを止めて欄の値をメモリに持ち、`getItem` で読み直してから判定する。読んだ `current` の `date` と `taskId` が画面の課題と同じときだけ答えを置き換える（別のタブの保存を上書きしない）。6-1 の移しと 6-4 の今日の課題と答えは 1 回の setItem。失敗したら起動時の保存の失敗と同じ扱い（S3 / S7 に `error.storage.message` と再試行）。
- 永続化（data.md の 11）：`persist()` と `persisted()` の例外と reject は握りつぶす（persist.js）。印 `device.persistRequested` は今日の課題を作る保存に含めるので、永続化のための setItem はない。
- S8 の `persisted()` の待ち（data.md の 11）：上限 1,000 ms（persist.js の `PERSISTED_WAIT_MS`）。上限までに決まらなければ注意なしで描き、後から返っても描き直さない。答えが先に決まったらタイマーを消す。待つ間に次の操作（act() を通る操作）が始まったら、その待ちは描かない。

## 6. 個人データと削除の地図
| 置き場所 | 中身 | 消し方 | 確かめ |
|---|---|---|---|
| localStorage `kyounoitte:data` | 診断、段階、履歴、答えの本文、初めて開いた日、device の印 | 設定の「すべて削除」（AC-16）：removeItem だけ | 受け入れ ac14-ac16-redo-delete、store.test の removeAll |
| 書き出したファイル | 上から device を除いたもの | 利用者の端末の上。アプリは消せない（PRD と support のページで知らせる。pdm の範囲） | — |
| Cache Storage `kyounoitte-<版>` | 配布物だけ（個人データなし） | 新しい版の activate で古い版を消す | ac28-update |
| GitHub Pages の接続記録 | IP アドレス（GitHub が持つ） | アプリからは消せない。PRD 1 の紹介文とプライバシーのページで知らせる | — |
サーバーに送る個人データは 0 件（AC-12 の受け入れテストで送信 0 件）。

## 7. 運用
- ログ：本番のコードは console.error を 1 か所だけ使い、エラーの名前（`e.name`）だけを出す。利用者の答えや保存データを出さない。
- 指標、アラート：v1 はイベントを記録しない（PRD 15、D6。main.js の `track()` は入口だけで何もしない）。
- 回数の上限、外部サービスの費用：外部サービスなし。月額 0 円（GitHub Pages の無料枠。帯域の目安は RUNBOOK の 7）。
- 大きさの上限：答えは 2,000 字（textarea の maxlength と検査）、読み込むファイルは 5,000,000 バイト、history は 20,000 行まで。
- 手で動かす道具：scripts/make-icon.mjs（public/icon-180.png を作る）。手で 1 回だけ動かす道具で、ビルドと CI では動かさない。依存は受け入れテストのフォルダ（tests/acceptance/node_modules）の Playwright を借りる（backend/package.json には足さない）。手順は RUNBOOK の 2「アイコンを作り直すとき」。G2 reviewer r1 の提案への対応（2026-11-03）。

## 8. 実行したコマンドと出力（2026-11-03、macOS、node v24.22.1）
- `cd backend && npm ci && npm run check:contracts` → `見本 41 件、期待と違う結果 0 件`、終了コード 0。
- `cd backend && node --test 'tests/unit/**/*.test.mjs'` → `tests 85 / pass 85 / fail 0`。
- `cd backend/tests/acceptance && npm ci && npx playwright install chromium webkit && npx playwright test --reporter=line` → `131 passed / 2 failed`。落ちたのは AC20 の 2 本（chromium、webkit）だけ。理由は 9 の 1。
- `cd backend && npm ci && npm test` → 契約の検査 41 件 OK、単体 85 件 OK、受け入れ 131 passed / 2 failed（AC20）で終了コード 1。
- `node scripts/build.mjs --out <一時フォルダ>/dist --version 2026-11-03.1 && node scripts/check-budget.mjs <一時フォルダ>/dist` → 殻 24,084 / 26,000、文言 6,510 / 8,000、アイコンと manifest 2,173 / 10,000、課題集 30,193 / 106,000、合計（gzip 後）62,960 / 150,000、OK、終了コード 0。（当時の枠。2026-11-04 の枠の見直しの後の値は下の「G2 r3 の要修正と契約 f40c61a の直し」）
- 禁止の API：`grep -rnE 'innerHTML|outerHTML|insertAdjacentHTML|eval\(|new Function|toISOString|import\(' public/` → 0 件。
- インラインのスタイルとイベント属性：`grep -rnE 'style=|<style|[[:space:]]on[a-z]+=' public/` → public/ の HTML、CSS、JS では 0 件（tasks.json の課題の本文に `style={{ margin: 8 }}` の文字が 1 か所あるが、課題の文で textContent で出す）。index.html の `<script>` は `src="./js/main.js"` の 1 つだけ。
- CSP：index.html の meta は contracts/budgets.md の 3 の文字列と同じ。2026-11-03 の追記からは build.test の単体テストで、budgets.md の節から読んだ文字列と配布物の content を比べる（下の「G2 r1 の要修正の直し」）。
- 保存先：`grep -rnE 'localStorage|sessionStorage|indexedDB|document\.cookie' public/js public/sw.js` → main.js の `window.localStorage` の 1 か所だけ（キーは store.js の `kyounoitte:data` だけ）。
- テストのつなぎ口、URL の引数：`grep -rnE 'location\.(search|hash)|URLSearchParams|__test|window\.__|testHook' public/` → 0 件。
- ネットワーク：fetch は main.js の fetchJson（`./i18n/<lang>.json` と `./data/tasks.json`、同じ origin）と sw.js のキャッシュの取り損ねだけ。
- JS のファイル：public/js が 11 個と sw.js の合わせて 12 個（15 個まで）。
- data-state：identifiers.md の 2 の 12 値がすべてコードにある。data-testid：契約は文言キー 145 と文字なし 30 の 175 個。コードに文字列のまま書かれた 91 個はすべて契約にあり（契約にない名前は 0 件）、残りは `area.${v}`、`settings.stats.${key}.value` のような組み立てで作る。`settings.privacy` は契約どおり DOM に置かない。
- 依存：package-lock.json は ajv 8.20.0 と、ajv の依存の fast-deep-equal 3.1.3、fast-uri 3.1.9、json-schema-traverse 1.0.0、require-from-string 2.0.2。contracts/dependencies.md の行は ajv 8.20.0（依存は ajv が持ち込むもの）。
- 鍵の混入：`grep -rnE 'service_role|SERVICE_ROLE' backend/public backend/scripts` → 0 件。
- 320px：作業用の Playwright のスクリプト（受け入れテストのフォルダの node_modules を読むだけ。backend/ には置いていない）で、配布物をビルドし、幅 320、deviceScaleFactor 2 で backend-beginner-005、frontend-beginner-007、database-beginner-002 を出して測った。Chromium と WebKit の 6 通りとも `scrollWidth=320`、画面からはみ出した `code` は 0 件。効いているのは app.css の `code { overflow-wrap: anywhere; }`（195 行目）と本文の `overflow-wrap: anywhere`（106 行目）。
- 未検査：gitleaks、squawk、oasdiff、schemathesis はこの端末に入っていない（`which` で見つからない）。squawk、oasdiff、schemathesis は対象外（DB と API がない）。gitleaks は代わりに上の grep だけ。

### G2 r1 の要修正の直し（2026-11-03、macOS、node v24.22.1）
docs/reviews/001-daily-learning-G2-code-reviewer-r1.md の要修正（契約と ADR 0001 が「単体テストで確かめる」と書く 4 点）に単体テストを足した。契約の文字列はテストに写さず、tests/unit/helpers.mjs の `contractCodeBlocks(file, number)` が contracts/budgets.md の「## 3.」「## 6.」の節のコードブロックをそのつど読む。

| 指摘 | テスト（ファイル：名前） | 契約 |
|---|---|---|
| (1) | build.test：CSP：index.html の meta は 1 つだけで、content が budgets.md の 3 の文字列と 1 文字も違わない | budgets.md の 3、ADR 0001 |
| (2) | build.test：manifest：manifest.webmanifest を JSON.parse した値が budgets.md の 6 の JSON と深く等しい | budgets.md の 6 |
| (2) | build.test：アイコン：icon-180.png の先頭 8 バイトが PNG の署名、IHDR が 180×180、4,000 バイト以下（2026-11-04 に 10,000 から。budgets.md の 1 の「枠の見直し」） | budgets.md の 6 |
| (2) | build.test：<head>：index.html の <head> に budgets.md の 6 の 5 行が 1 行ずつそのままある | budgets.md の 6 |
| (3) | validate.test：365 行 × 答え 2,000 字の保存データは JSON の長さが 1,000,000 字以下で、検査（手書きと ajv）を通り、1 回の setItem で入る | data.md の 10、ADR 0001 |
| (4) | i18n-files.test：差し込みのあるキーは ja と en のどちらも strings.md の表の 10 個だけ | strings.md の 1、3 |
| (4) | i18n-files.test：差し込みの 10 キーを ja.json の実物で format() に通すと、差し込みが全部埋まり { と } が残らない | strings.md の 3、ADR 0001 |
| (4) | i18n-files.test：差し込みの 10 キーを en.json の実物で format() に通すと、差し込みが全部埋まり { と } が残らない | strings.md の 3、ADR 0001 |
| (4) | i18n-files.test：en の plural（task.meta の minutes、settings.import.confirm.summary の count）は 1 と 2 以上で形が変わり、どちらも埋まる | strings.md の 3 |

- 365 行の見本の長さ：791,179 字（答えは「あ」× 2,000、current にも 2,000 字、levels は 6 領域すべて）。
- わざと壊すと落ちることの確かめ：スクラッチパッドに backend/ と contracts/ を写し、写しを 1 か所ずつ壊して該当のテストファイルを流した（リポジトリのファイルは壊していない）。CSP の 1 文字（`kyounoitte-sw` → `kyounoitte-sW`）、CSP の meta を 2 つ、契約の側の CSP に空白 1 つ、manifest に `theme_color`、manifest の sizes を 192x192、PNG の幅を 181、PNG の署名の 2 バイト目、`<head>` から apple-touch-icon の行を消す、manifest の行を `<body>` に移す、validate.js の history の上限を 300、store.js の保存を整形、en の `{version}` を `{ver}`、ja の task.meta から `{minutes}` を消す、i18n.js の `#` の置き換えを消す、ja の app.name に `{x}` を足す、答えを `"` × 2,000 にする（1,523,179 字）。どれも狙ったテストが落ち（終了コード 1）、壊さない写しでは全部通った。
- `cd backend && node --test 'tests/unit/**/*.test.mjs'` → `tests 94 / pass 94 / fail 0`（前の 85 件 + 9 件）、終了コード 0。
- `cd backend && npm ci && npm test` → 契約の検査 `見本 41 件、期待と違う結果 0 件`、単体 `tests 94 / pass 94 / fail 0`、受け入れ `133 passed (45.5s)`、終了コード 0。

### G3 design r6 と design-reviewer r1 の指摘 4〜6 の直し（2026-11-04、macOS、node v24.22.1、Playwright 1.64.1）
前の落ち方（docs/verification/001-daily-learning/evidence/r6-red.log）：AC13、AC26 × 2、AC27 task.today.dayChanged、DESIGN_D30 × 3、DESIGN_U15 の 8 本 × 2 ブラウザ = 16 本。

変えたこと：
| 項目 | 実装 | 契約、design |
|---|---|---|
| 文言 `task.dayChanged`（146 キー） | public/i18n/ja.json、en.json（design 7 の表の文と同じ） | strings.schema.json、identifiers.md の 3 |
| 日付が変わった後の操作 | main.js の act() が、描いたときの保存データが「あり」の画面（`R.checksDay`）でだけ日付を確かめ、違えば dayChanged()：タイマーを止めて欄の値を持ち `app.answer = null` → 下書きを捨ててダイアログを閉じる → decide()（getItem で読み直す）→ route() の `R.planDay` が `carryAnswer`（date と taskId が同じときだけ置き換え）→ startOfDay → 印 → 保存 1 回 | data.md の 4、design の D-30 |
| U-15 | S1、初回の S2、データなしの S8、S0 error は `checkDay = false` で、そのまま実行（日付は実行した時点の今日で書く） | data.md の 4「対象の外」 |
| 知らせ | view-task.js の dayChangedNotice：`<p role="status" tabindex="-1" data-testid="task.dayChanged" class="day-changed warning">`。render の `lead` として `<main>` の最初の子に置く（画面の `article[data-testid="task.today"]` より前。identifiers.md の 3「他のどの data-testid の要素よりも前」）。描いた直後に `focus({ preventScroll: true })` と `scrollTo(0, 0)`。act() の始めに外す（textarea の input は act を通らないので外れない）。保存しない | identifiers.md の 3、design 5 の S3 / S7 |
| persist | `R.markPersist`：今日の課題を作る結果（`issued`）で、印が true でなく persist が関数なら、その保存に `device.persistRequested: true` を含める（setItem は 1 回のまま）。S3 を描いた後に askPersist() で 1 回だけ呼ぶ。初回とやり直しの診断を終える保存、起動時の 6-4、日付が変わった後の 6-4、読み込みの後の 6-4 のすべてが planDay か markPersist を通る。前の maybePersist()（結果を `persistGranted` に書く 2 回目の保存）は消した。同じ文書で 2 回呼ばない印をメモリにも持ち、削除で下ろす | data.md の 2、11、W-9 |
| S8 の注意 | （2 回目の直しで上限と待つ間の操作を足した。下の節）showSettings()：「あり」なら `readNotPersisted(navigator.storage)` を待ち、`app.seq`（render ごとに増える）が同じときだけ drawSettings() で DOM と data-state を書く。false のときだけ `settings.storage.notPersisted`。ない、例外、reject、false 以外は出さない。「なし」「途中」はすぐ描く | data.md の 11、design の D-31 |
| 指摘 4 | `.site-header nav` に `margin-left: calc(-1 * var(--space-2))`（2 行目に落ちたときの左端）、`.screen p > .link:only-child` と `summary` に同じ負の margin-left。内側の余白は変えないので押せる範囲は同じ | tokens 4「リンク」「開閉」、design 8 |
| 指摘 5 | 480 px 未満の規則を `.btn { width: 100% }` にした（`.actions` の外のボタンにも効く） | tokens 4「ボタン（主操作）」 |
| 指摘 6 | todayScreen の syncAnswerError()：answer の枠にエラーがある間だけ textarea に `is-error`、`aria-describedby="task-answer-help task-answer-error"`（エラーの文に id）。消えたら戻す。CSS は `textarea.is-error { border: var(--size-border-strong) solid var(--color-error) }` と、太った 1 px を内側の余白から引く。`aria-invalid` は付けない。style 属性は使わない | tokens 4「入力欄」、delegation.md 2026-11-04 |
| 単体テスト | tests/unit/day-persist.test.mjs（14 件）、i18n-files.test.mjs の件数を 146 に | — |

実行したコマンドと出力：
- `cd backend && npm ci && npm test` → 契約 `見本 41 件、期待と違う結果 0 件`、単体 `tests 108 / pass 108 / fail 0`、受け入れ `Running 145 tests using 5 workers` → `145 passed (31.5s)`、終了コード 0。
- `rm -rf dist && npm run build -- --version 2026-11-04.1 && node scripts/check-budget.mjs dist` → 殻 25,794 / 26,000、文言 6,610 / 8,000、アイコンと manifest 2,173 / 10,000、課題集 30,193 / 106,000、合計（gzip 後）64,770 / 150,000、`OK`、終了コード 0（当時の枠）。dist の JS は 13 個（public/js 12 個 + sw.js。15 個まで）。
  - 初めのビルドでは殻が 28,231 / 26,000（枠を超えた。合計は 67,207 で OK）だった。差の 4,140 バイトの多くは足した日本語のコメントだったので、コメントを契約の節の番号だけに縮め、persist.js を短くして 25,794 にした。殻の残りは 206 バイト。
- 禁止の API：`grep -rnE 'innerHTML|outerHTML|insertAdjacentHTML|eval\(|new Function|toISOString|import\(' public/` → 0 件。
- インラインのスタイルとイベント属性：`grep -rnE 'style=|<style|[[:space:]]on[a-z]+=' public/index.html public/app.css public/js public/sw.js` → 0 件。`<script>` は index.html の `src="./js/main.js"` の 1 つだけ。
- 保存先：`grep -rnE 'localStorage|sessionStorage|indexedDB|document\.cookie' public/js public/sw.js` → main.js:156 の `window.localStorage` と store.js:1 のコメントだけ。キーは store.js の `kyounoitte:data` だけ。
- テストのつなぎ口、URL の引数：`grep -rnE 'location\.(search|hash)|URLSearchParams|__test|window\.__|globalThis\.__|testHook' public/` → 0 件。
- 新しく使った API と CSS：`focus({ preventScroll })`（Safari 15）、`window.scrollTo`、`classList`、`StorageManager.persisted`（15.2。budgets.md の 5）、`:only-child`。Safari 17.0 にないものは 0。
- 指摘 4〜6 の実測：スクラッチパッドの Playwright のスクリプト（受け入れテストのフォルダの node_modules を読むだけ。backend/ には置いていない）。今の dist と、HEAD（139d2d2）の public/ を同じ手順で測った。幅 390（nav は 320、文字 200%）、Asia/Tokyo、2026-11-04。

| 測ったもの | HEAD（Chromium / WebKit） | 直した後（Chromium / WebKit） |
|---|---|---|
| 文字の左端 − 列の線：`task.done.history`、`settings.stats.open`、`settings.history.open`、`settings.stats.back`、`history.row.answer`（summary） | +8 / +8 px | 0 / 0 px |
| 同じ：`nav.history`（幅 320、文字 200% で 2 行目） | +16 / +16 px | 0 / 0 px |
| リンクと summary の箱（押せる範囲） | 96×49.6 / 89.9×49.6 | 変わらない（44×44 以上） |
| `error.storage.retry` の幅（幅 320、列 288） | 162 / 152.2 | 288 / 288 |
| `home.addToHomeScreen.close` の幅（案内の中の列 254） | 82 / 78.3 | 254 / 254 |
| `home.standalone.importButton` の幅（案内の中の列 254） | 177.1 / 167.0 | 254 / 254 |
| `error.storage.retry` の幅（幅 600。480 以上は内容に合わせる） | 162 / 152.2 | 162 / 152.2（変わらない） |
| 答えの保存の失敗中の textarea：枠の太さ、色、aria-describedby、aria-invalid | 1px、rgb(107,107,107)、`task-answer-help`、なし | 2px、rgb(180,35,24)（= color.error #B42318）、`task-answer-help task-answer-error`、なし |
| 再試行で保存できた後 | — | 1px、rgb(107,107,107)、`task-answer-help`（戻る） |

### G2 r3 の要修正と契約 f40c61a の直し（2026-11-04、macOS、node v24.22.1、Playwright 1.64.1）
前の落ち方（docs/verification/001-daily-learning/evidence/r7-red.log）：DESIGN_D31_ の 2 本 × 2 ブラウザ = 4 本。

変えたこと：
| 項目 | 実装 | 契約 |
|---|---|---|
| 待つ上限 | persist.js の `readNotPersisted(sm, { limitMs = 1000, timers = globalThis })`：`persisted()` の答えと `setTimeout(limitMs)` を `Promise.race` で競わせ、上限が先なら false（注意なし）。決まったら `clearTimeout`。`Promise.withResolvers` は使わない。数え始めは showSettings() を呼んだ時点（S8 へ移る操作の act() の中） | data.md の 11「待つ上限は 1,000 ms」 |
| 後から返っても描き直さない | 上限で決まった Promise はもう変わらない。drawSettings は 1 回の待ちにつき最大 1 回 | data.md の 11 |
| 待つ間の操作を優先 | main.js の act() の始めで `app.seq += 1`。showSettings() は act() の後の seq を覚え、`drawWhenPersistedKnown(sm, () => seq === app.seq, draw)` で、答えか上限の時点で seq が同じときだけ描く。画面を移さない操作（必須のエラー、保存の失敗の表示）も act() を通るので捨てられる。もう一度 S8 へ移る操作をしたら、前の待ちの seq は古くなり、後の待ちだけが描く。答えの欄への入力は act() を通らないので捨てない | data.md の 11「待つ間に次の操作が始まったら…」、identifiers.md の 3 と同じ範囲 |
| TypeError（reviewer G2 r3 の要修正） | main.js の cancelRedo()：`app.draft = null` を先にしない。origin が settings なら showSettings()（下書きは S8 を描く render が `state !== 'diagnosis.question'` で捨てる）、それ以外は route()（はじめに下書きを捨てて同期で描く） | data.md の 11「S8 へ移る操作は、S8 を描くまで…変えません」、例の「diagnosis.cancel → diagnosis.next」 |
| 予算 | check-budget.mjs：殻 32,000、アイコンと manifest 4,000、`ICON_RAW_LIMIT` 4,000、冒頭のコメント。build.test のアイコンの上限 4,000、枠の値の単体テストを 1 本。RUNBOOK の 2 の 4,000 | budgets.md の 1「枠の見直し」、6 |
| RUNBOOK | 7 の表に「設定を押してから画面が変わるまでに間がある（最大で約 1 秒）」の行 | — |
| 単体テスト | day-persist.test.mjs に 4 本（上限の既定 1,000 と上限で false・後の答えで変わらない、本物のタイマーで返らない persisted() が false（timeout 2,000 ms）、決まったらタイマーを消す、待つ間に操作があったら描かず後の待ちだけ描く）。build.test.mjs に 1 本（枠の値） | — |

実行したコマンドと出力：
- `cd backend && npm ci && npm test` → 終了コード 0。契約 `見本 41 件、期待と違う結果 0 件`、単体 `tests 113 / pass 113 / fail 0 / skipped 0`、受け入れ `Running 153 tests using 5 workers` → `153 passed (36.5s)`（DESIGN_D31_ の 2 本 × 2 も passed：chromium 3.4s / 3.9s、webkit 3.9s / 3.9s）。単体テストに timeout を足した後にもう一度流して、終了コード 0、単体 113 / 113、受け入れ `153 passed (37.2s)`。
- `rm -rf dist && npm run build -- --version 2026-11-04.10 && node scripts/check-budget.mjs dist` → 殻 26,159 / 32,000、文言 6,610 / 8,000、アイコンと manifest 2,173 / 4,000、課題集 30,193 / 106,000、合計（gzip 後）65,135 / 150,000、`OK`、終了コード 0。殻のうち JS（sw.js を含む）22,499（ADR 0001 の見直しの線 26,000 の内）、CSS 2,794、HTML 866。icon-180.png の生 2,107 バイト（4,000 以下）。dist の JS は 13 個（public/js 12 個 + sw.js。15 個まで）。
- grep（backend/public）：`innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function|setHTMLUnsafe` 0 件。index.html の `style=|<style|on…=|<script>` 0 件、js の `.style.|cssText|setAttribute('style'|setAttribute('on` 0 件、CSP の meta 1 つ。`localStorage` は main.js:157 と store.js のコメント、キーは store.js の `kyounoitte:data` だけ。`location.(search|hash)|URLSearchParams|__test|__acceptance|window.__|globalThis.__|testHook|webdriver|playwright` 0 件。`import(|toISOString` 0 件。`withResolvers` 0 件（public/ と scripts/）。budgets.md 5 の使わない機能 0 件（`structuredClone` は Safari 15.4 で対象外）。新しく使った API は `Promise.race` と `setTimeout`/`clearTimeout` だけ。
- reviewer の再現（スクラッチパッドの r4repro/race-r4.mjs。受け入れテストのフォルダの helper と node_modules を読むだけ）：`persisted()` を 1.5 秒遅らせ、S8 から入ったやり直しの S2 で `area.frontend` → `diagnosis.cancel` → `diagnosis.next`、2 秒待つ。Chromium と WebKit とも `pageErrors: 0`、`data-state` は diagnosis.question、`data-question-index` 2、保存データは変わらない。`nav.settings` から S8 まで 1,107 ms / 1,139 ms（上限 1,000 の後に描いた）。
- 画面を移さない操作（r4repro/required-r4.mjs）：何も選ばずに「やめる」→ 待つ間に「次へ」（必須のエラー）→ 1.5 秒待つ。Chromium と WebKit とも `data-state` は diagnosis.question のまま、`error.diagnosis.required` 1 件、pageerror 0 件。
- 壊して確かめ（スクラッチパッドの写し mut4。終わった後 `diff -r` で public/ が元と同じ）：
  | 変異 | 落ちたテスト |
  |---|---|
  | A：cancelRedo で下書きを先に捨てる（元の形） | DESIGN_D31_S8から入ったやり直しのS2で… × 2（chromium、webkit） |
  | B：act() の `app.seq += 1` を消す | 受け入れテストは 4 本とも通る（「次へ」は画面を移し render が seq を上げるため）。required-r4.mjs では両ブラウザで遅れて `settings` を描き、必須のエラー 0 件になる（9 の 7） |
  | C：上限のタイマーを置かない | DESIGN_D31_persistedが1000msまでに… × 2、単体 3 本（上限の既定、本物のタイマー（timeout で落ちる）、タイマーを消す） |
  | D：drawWhenPersistedKnown で isCurrent を見ない | 単体「S8 の待ち：待つ間に次の操作が始まったら描かない…」 |
  | E：決まったときに clearTimeout しない | 単体「S8 の待つ上限：上限の前に答えが決まったらタイマーを消す…」 |

## 9. 未確認のこと
1. （解決済み。verifier が a7fc7e9 で、閉じる前にファイルを複製する形に直し、受け入れは 133 passed）AC20 の受け入れテストの不具合：tests/ac19-ac20-ac25-export-import.spec.mjs の 57 行目で `context.close()` を呼んでから、67 行目で書き出したファイル `exported.file`（`download.path()` の一時ファイル）を読み込ませている。Playwright はダウンロードを作ったコンテキストを閉じるとそのファイルを消すので、ENOENT で落ちる。Playwright 1.64.1 で確認した（閉じる前は存在、閉じた後は存在しない）。テストの写しを作業用フォルダに作り、閉じる前にファイルを別の場所へ複製する 1 行だけを足して流すと、Chromium と WebKit の 2 本とも通った（実装は AC20 を満たす）。受け入れテストは verifier の範囲なので直していない。
2. Linux の CI で WebKit の OS のライブラリが要るか（ADR 0004）：macOS でだけ動かした。
3. GitHub Pages が `.webmanifest` に返す Content-Type：公開後に確かめる（設計メモ 10）。
4. 保存データの長さの見積もり（data.md の 10）：「2,000 字の答え × 365 行で 1,000,000 字以下」は、JSON で 1 字のままの文字（日本語や英字）なら成り立つ（791,179 字）。答えが改行や `"` ばかりだと JSON の中で 2 字になり 1,523,179 字、制御文字（U+0001 など）だと `\u0001` の 6 字になり 4,451,179 字で、どれも検査は通る。容量を超えたときは保存の失敗（data.md の 2）として扱われ、前のデータは残る。契約の文の読み方は tech-lead に確かめる（報告の未解決）。
5. （解決済み。契約 f40c61a で上限 1,000 ms が決まり、2026-11-04 に実装した）`navigator.storage.persisted()` が返らないブラウザで S8 に移れない件。
6. 実機の Safari と Chrome での `persist()` の返事と S8 の注意の出方（G4 で Takuma が見る。data.md の 11）。
7. act() の `app.seq += 1`（画面を移さない操作で S8 の待ちを捨てる）を、消したら落ちる自動テストがない。受け入れテストの DESIGN_D31_ は画面を移す「次へ」だけを見ており、単体テストは main.js を読み込めない（DOM が要り、依存は ajv だけ）ので同じ形の写しで確かめている。スクラッチパッドの required-r4.mjs で、消すと遅れて S8 を描くことは確かめた。受け入れテストに「待つ間に必須のエラー」の 1 本を足すかは verifier の判断。
8. 待つ間に radio を選ぶだけ（「次へ」を押さない）の操作は act() を通らないので、S8 の待ちを捨てない（S8 を描くときに下書きは捨てる）。identifiers.md の 3 の「radio の確定」を、今の実装（`task.dayChanged` の知らせと同じ）では「次へ」などの確定のボタンと読んでいる。

## チェックリスト（craft-backend-engineer の 6）
- [x] 対応表の行の数が、技術設計メモの 4 の表の operation の数と同じ。→ API の operation は 0。代わりに AC-1〜AC-32 をすべて 1 の表に並べた。
- [ ] 交差テストの数が、ID を受け取るエンドポイントの数以上。→ 対象外（エンドポイントなし、利用者は 1 人）。
- [ ] 3章のテストのうち当てはまるものが、本物の DB で通ったログがある。→ 対象外（DB なし）。当てはまる「割り当てすぎ」（知らない項目を拒む）、「上限」（答え 2,000 字、ファイル 5MB）、「削除」は単体テストと受け入れテストで通った（8）。
- [x] schemathesis、oasdiff、squawk、advisors、gitleaks の出力がある（使わない道具は「対象外」と理由）。→ 8 の最後の行。gitleaks は未検査。
- [ ] マイグレーションの up、down、up のログがあり、列を消す変更は最低対応版より後になっている。→ 対象外（マイグレーションなし。保存の形は formatVersion で扱う。3）。
- [x] 削除の地図の行ごとに、テストか RUNBOOK の手作業の手順がある。→ 6 と RUNBOOK の 5。
- [x] 環境変数の名前が RUNBOOK にあり、値はコードにもログにもない。→ 本番の環境変数は 0 個。テストの KYOUNOITTE_DIST だけ RUNBOOK の 1 に書いた。
- [x] 外部サービスごとに、月額の見積もりと、利用上限か請求アラートがある。→ 外部サービスは GitHub Pages だけ（無料）。RUNBOOK の 7。
- [x] 報告の「自己点検」に API1 から API10 の10行がある。
- 2026-11-04 の直しでも上の印は変わらない（API、DB、外部サービス、環境変数は増えていない）。
- 2026-11-04（2 回目、G2 r3 の要修正と契約 f40c61a）の直しでも上の印は変わらない。
