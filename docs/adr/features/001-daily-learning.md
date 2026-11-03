# 技術設計メモ 001-daily-learning：診断と今日の学習（今日の一手）

- 書いた役：tech-lead　日付：2026-10-30
- PRD：docs/prd/001-daily-learning.md（r7、AC-1〜AC-32）　デザイン：design/001-daily-learning.md（r6）　契約：contracts/（HTTP の API はないので OpenAPI はない。一覧は contracts/README.md）
- 読み替え：型の「operationId」は「契約のファイルと項目」、「iOS」は「ブラウザ（Safari 17 以上、Chrome の最新 2 版）」に読み替える。spectral と oasdiff は使えないので、JSON Schema の検査と見本のテストで代える（指揮役の裁定 E2）。
- Takuma の決定 D1〜D10（2026-10-30、すべて推奨どおり。docs/approvals/001-daily-learning-G0.md の末尾）を反映した。決定と反映先の一覧は 10。

## 1. 範囲、目標、非目標
- 範囲：ブラウザだけで動く静的な Web アプリ（HTML、CSS、ES modules、Service Worker）と同梱の課題集。保存は localStorage のキー 1 つ。配布は GitHub Pages の `/engineer/`。受け入れテストは Playwright（Chromium と WebKit）。
- 目標：PRD の 32 件の AC を、つなぎ口を本番に入れずに自動で確かめられる形で満たす。開いてから 2 秒、初回の転送量 150,000 バイト以下、外への送信 0 件。
- 非目標：サーバー、アカウント、同期、Web Push、裏での更新、更新の知らせ、ブラウザの中でのコードの実行、計測の送信（PRD 10）。イベントの記録（8。Takuma の決定 D6）。

## 2. 受け入れ条件の対応表
operationId は全行「なし（端末のみ）」。代わりに「データ」の列に契約のファイルと項目を書く。テストはすべて backend/tests/acceptance/（verifier）。「2」は Chromium と WebKit の両方、「C」は Chromium だけ、「JSON」はブラウザを使わずに JSON を検査する。
| AC | 画面（design/） | operationId | データ（契約のファイルと項目） | 確かめるテスト |
|---|---|---|---|---|
| AC-1 | S1 → S2 | なし（端末のみ） | identifiers.md：`diagnosis.progress` の `data-question-index`、`-total` | 受け入れ 2：3 問と切り替え 500 ms を 3 回 |
| AC-2 | S2 → S3 | なし（端末のみ） | data.md の 5（組と選び方）、`data-task-area`、`-level` | 受け入れ 2：回答を変えた 3 通り |
| AC-3 | S3、課題集 | なし（端末のみ） | schemas/tasks.schema.json（4 要素の `\S`、`minutes` 1〜15） | 受け入れ JSON（ajv）と S3 のスクリーンショット |
| AC-4 | なし | なし（端末のみ） | tasks.json の件数、組ごとの件数、ID の重複（test-hooks.md の W-6） | 受け入れ JSON |
| AC-5 | S3 → S4 → S5 | なし（端末のみ） | data.md の 2（申告で `current` を外し `history` に `done` の行、`helpful: unanswered`）、4 の 6-2 | 受け入れ 2：答える／再読み込み |
| AC-6 | S3 | なし（端末のみ） | data.md の 4 の 6-1、5（ID は `history` と `current` にないもの） | 受け入れ 2：W-3 で翌日 |
| AC-7 | S3 → S6、S10 | なし（端末のみ） | `history[].report`（`too_hard`、`too_easy`、`no_time`）、`history.row` の `data-report` | 受け入れ 2：3 通り |
| AC-8 | S3 | なし（端末のみ） | data.md の 5（段階の規則と seed の表）、`levels`、`history[].level`（その課題が出たときの段階）、fixtures/seeds/seed-ac8-*（1、8、9 通り目） | 受け入れ 2：9 通り。単体：規則 |
| AC-9 | S4 → S5、S10 | なし（端末のみ） | `history[].helpful`、`data-helpful` | 受け入れ 2：選ぶ／再読み込み |
| AC-10 | S7 → S2 | なし（端末のみ） | data.md の 4 の 6-4、5（候補が 0 → S7、保存しない） | 受け入れ 2：seed で 7 件を出し終えた |
| AC-11 | S2 | なし（端末のみ） | data.md の 2（1 問ごとに 1 回の setItem。保存データが「なし」か「診断の途中」の起動では setItem を呼ばない（AC-11 の注入はこの状態で行う）。「あり」の起動では data.md の 2 のとおり最大 1 回）、W-9 | 受け入れ 2：setItem の失敗の注入 |
| AC-12 | S1〜S6 | なし（端末のみ） | test-hooks.md の W-12（送信の数え方）、W-13（オフラインにする前に SW の準備を待つ）、CSP の `connect-src 'self'` | 受け入れ 2：オフライン |
| AC-13 | S3 → S5、S8 | なし（端末のみ） | data.md の 11（印 `device.persistRequested` がないときに今日の課題を出す保存へ印を含め、その S3 の後に `persist()` を 1 回。求め直さない。S8 は描くたびに `persisted()`。結果は保存しない）、W-9 | 受け入れ 2：`persist()` と `persisted()` の拒否の注入。呼ぶ回数（初回 1 回、以後 0 回）と保存の印 |
| AC-14 | 1 通り目：S7 → S8 → S2 → S3、S10。2 通り目：S3 → S8 → S2 → S3（同じ課題）、翌日 S3、S10 | なし（端末のみ） | 1 通り目：data.md の 2（やり直しは終えるときに 1 回、行き先）、4 の 6-4。seed は AC-10 と同じく本番の課題集から作る「出し終えた」履歴（直近 3 日の 3 件が `done`）。2 通り目：data.md の 2（今日の課題を出した後は `current` を書かない、行き先）、4 の 6-3（直後は同じ `data-task-id`）、翌日の 6-1 と 6-4（`data-task-area` が新しい領域）。seed は fixtures/seeds/seed-ac14-three-completed.json の形で 2026-11-04 に開く（test-hooks.md の W-7） | 受け入れ 2：2 通り |
| AC-15 | S0 → S3 | なし（端末のみ） | `data-debug-load-ms`、W-11 の制限、budgets.md の 1 と 4 | 受け入れ C：5 回 |
| AC-16 | S8 → ダイアログ → S1 | なし（端末のみ） | data.md の 7（`removeItem` だけ）、W-7 の印 | 受け入れ 2 |
| AC-17 | S1、S3、S5、S7 | なし（端末のみ） | strings.md の 5（`<pre>` なし、`<code>` は折り返す）、tasks.schema.json の「```」の禁止 | 受け入れ 2：幅 320 |
| AC-18 | S1 → S5 | なし（端末のみ） | identifiers.md（操作する要素の `data-testid`）、test-hooks.md の「キーボードの移動キー」（WebKit は `Alt+Tab`） | 受け入れ 2：キーボードだけ |
| AC-19 | S8 | なし（端末のみ） | schemas/data.schema.json（書き出し＝保存。`device` を除く）、data.md の 7 | 受け入れ 2：ダウンロードを ajv で検査 |
| AC-20 | S1 → S8 | なし（端末のみ） | data.md の 7（読み込みの流れ。`firstOpenDate` はファイルの値）、`history[].answer` | 受け入れ 2：setInputFiles、同じ固定の日付（W-3） |
| AC-21 | S1、S8 | なし（端末のみ） | test-hooks.md の W-16（iOS Safari の判定）、`device.homeGuideClosed`（`device` だけの保存。`firstOpenDate` は書かない：data.md の 2、fixtures/data/v1/valid-guide-closed-only.json） | 受け入れ 2：偽装あり／なし |
| AC-22 | S1 | なし（端末のみ） | W-16（スタンドアロンの判定）、data.md の 3（「なし」の間は毎回） | 受け入れ 2 |
| AC-23 | S0 → S3 / S5 | なし（端末のみ） | contracts/service-worker.md、W-12、W-13 | 受け入れ 2：再読み込みと新しいタブ |
| AC-24 | S9 | なし（端末のみ） | data.md の 9、identifiers.md の 4 の `data-stat-*`、fixtures/seeds/seed-ac24-stats.json | 受け入れ 2 |
| AC-25 | S8 | なし（端末のみ） | data.md の 6 と 7（版を先に見る）、fixtures/data/invalid-newer-version.json | 受け入れ 2 |
| AC-26 | S1 | なし（端末のみ） | schemas/strings.schema.json（146 キー必須、他を拒む）、strings.md の 2 | 受け入れ 2：locale ja-JP／en-US |
| AC-27 | S1、S2、S3、S5、S7、S8 | なし（端末のみ） | contracts/dependencies.md（@axe-core/playwright 4.14.0） | 受け入れ 2：axe の JSON を証拠に |
| AC-28 | S0、S8 | なし（端末のみ） | service-worker.md、`data-build-version`、test-hooks.md の「AC-28 の配布物の差し替え」 | 受け入れ 2：2 秒おき 3 回 |
| AC-29 | なし | なし（端末のみ） | tasks.schema.json（`mode`、`tools`、in_app の URL の禁止）、組ごとの 20%（W-6） | 受け入れ JSON |
| AC-30 | S3 | なし（端末のみ） | `data-task-mode`、`task.external.badge`、`task.external.tools.item`、data.md の 5 | 受け入れ 2：external と in_app |
| AC-31 | S3、S5 | なし（端末のみ） | test-hooks.md の「AC-31 の重なる要素の数え方」、identifiers.md の 3（閉じたダイアログは DOM にない） | 受け入れ 2 |
| AC-32 | S3、S8 | なし（端末のみ） | `current.answer`（300 ms、pagehide、visibilitychange）、data.md の 4 の 6-1（`none` の行に移す）と「画面を開いたまま日付が変わったとき」（前日の答えは `none` の行に、新しい `current.answer` は空） | 受け入れ 2：新しいタブ、再読み込み、翌日。画面を開いたままの翌日は G3 の「AC にない状態」（design 2 の表の下） |

## 3. 構成図
システムコンテキストとコンテナを 1 枚にした。信頼の境界は 2 つ：origin の共有（同じアカウントの他の Pages と保存とキャッシュを共有する）と、端末のファイル（読み込むファイルは信頼しない）。

```mermaid
flowchart LR
  user["利用者（人）：今日の課題を読み、答えを書き、申告する"]
  takuma["Takuma（人）：配布物を公開する"]
  actions["GitHub Actions（CI。Takuma が .github/ に作る）：backend/scripts/build.mjs で配布物を作り Pages に置く"]
  pages["GitHub Pages と Fastly（静的ホスティング）：/engineer/ の配布物を gzip と max-age=600 で配る"]
  file["端末のファイル（JSON）：書き出したデータ。読み込むときは信頼しない入力"]
  subgraph origin["信頼の境界：origin matsuura-tak.github.io（同じアカウントの他の Pages と共有）"]
    page["画面（HTML、CSS、ES modules。依存 0）：状態を決めて描き、保存し、書き出す"]
    sw["Service Worker（sw.js）：配布物を先に取っておき、scope の GET をキャッシュから返す"]
    cache["Cache Storage（kyounoitte-版）：配布物の写し"]
    ls["localStorage（キー kyounoitte:data）：保存データ（JSON、formatVersion 1）"]
    others["他の Pages（Takuma の他のリポジトリ）：同じ localStorage と Cache Storage が見える"]
  end
  takuma -->|"git push と Actions の実行（HTTPS）"| actions
  actions -->|"配布物のアップロード（GitHub の API、HTTPS）"| pages
  user -->|"URL を開く、タップ、キー入力（ブラウザの操作）"| page
  page -->|"ナビゲーションと fetch の GET（HTTPS。SW が先に受ける）"| sw
  sw -->|"キャッシュにないときだけ GET（HTTPS）"| pages
  sw -->|"install で全ファイルを取り、fetch で読む（Cache API）"| cache
  page -->|"getItem、setItem、removeItem（同期の Web Storage API）"| ls
  page -->|"Blob と a download で書き出す（ファイル保存）"| file
  user -->|"input type=file で選ぶ（ファイル選択。5 MB まで、スキーマで検査）"| page
  others -.->|"読み書きできてしまう（同じ origin。決まりで防ぐ：ADR 0005）"| ls
```
- ブラウザの外に出る通信は、配布物の GET だけ（初回と、SW の更新の確認）。利用者のデータを送る矢印はない（AC-12、AC-23）。

## 4. 契約の変更と互換性
HTTP の operation はない。代わりに契約のファイルの一覧（すべて新規）：
| 契約 | 足す / 変える | AC | 認証 | 作る POST の Idempotency-Key |
|---|---|---|---|---|
| schemas/tasks.schema.json | 足す | AC-3、AC-4、AC-29、AC-30 | 不要（端末のみ） | 対象外 |
| schemas/data.schema.json | 足す | AC-5〜AC-11、AC-13、AC-14、AC-16、AC-19〜AC-25、AC-32 | 不要 | 対象外 |
| schemas/strings.schema.json | 足す | AC-26 | 不要 | 対象外 |
| data.md、strings.md、identifiers.md、test-hooks.md、service-worker.md、budgets.md | 足す | 全 AC | 不要 | 対象外 |
| fixtures/（41 件）、tools/check-schemas.mjs | 足す | 上と同じ | 不要 | 対象外 |

- spectral の出力：未検査（OpenAPI なし。指揮役の裁定 E2）。
- oasdiff breaking の出力：未検査（OpenAPI なし）。main に契約はなく、すべて新規。
- 代わりの検査：`node contracts/tools/check-schemas.mjs`（ajv 8.20.0 を入れたスクラッチパッドで実行。backend ができたら `cd backend && node ../contracts/tools/check-schemas.mjs`）。2026-10-30 の出力（全文。Takuma の決定 D3、D10 を反映し、見本を 38 件から 41 件にした後に実行し直した）：
```
ajv 8.20.0（Ajv2020、strict）
OK  メタスキーマ data.schema.json
OK  組み立て data.schema.json
OK  メタスキーマ strings.schema.json
OK  組み立て strings.schema.json
OK  メタスキーマ tasks.schema.json
OK  組み立て tasks.schema.json
OK  data/invalid-answer-too-long.json 期待：落ちる → 落ちた（data/current/answer must NOT have more than 2000 characters）
OK  data/invalid-current-before-diagnosis.json 期待：落ちる → 落ちた（data/diagnosis must have required property 'completedOn' / data must match "then" schema）
OK  data/invalid-done-without-helpful.json 期待：落ちる → 落ちた（data/history/2 must have required property 'helpful' / data/history/2 must match "then" schema）
OK  data/invalid-extra-field.json 期待：落ちる → 落ちた（data must NOT have additional properties）
OK  data/invalid-helpful-on-skipped.json 期待：落ちる → 落ちた（data/history/3 must NOT be valid / data/history/3 must match "else" schema）
OK  data/invalid-history-without-first-open-date.json 期待：落ちる → 落ちた（data/history must NOT have more than 0 items / data must match "then" schema）
OK  data/invalid-in-progress-without-first-open-date.json 期待：落ちる → 落ちた（data/diagnosis must NOT have more than 0 properties / data must match "then" schema）
OK  data/invalid-levels-without-first-open-date.json 期待：落ちる → 落ちた（data/levels must NOT have more than 0 properties / data must match "then" schema）
OK  data/invalid-newer-version.json 期待：落ちる → 落ちた（data/formatVersion must be equal to constant）
OK  data/invalid-not-json.json 期待：落ちる → 落ちた（JSON.parse の失敗）
OK  data/invalid-other-app.json 期待：落ちる → 落ちた（data/app must be equal to constant）
OK  data/invalid-unknown-area.json 期待：落ちる → 落ちた（data/levels must NOT have additional properties）
OK  data/invalid-utc-datetime.json 期待：落ちる → 落ちた（data/history/0/date must match pattern "^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$"）
OK  data/invalid-years-without-level.json 期待：落ちる → 落ちた（data/diagnosis must have required property 'completedOn' / data must match "then" schema / data/diagnosis must have property level when property years is presen）
OK  data/v1/valid-all-fields.json 期待：通る → 通った
OK  data/v1/valid-export-three-completed.json 期待：通る → 通った
OK  data/v1/valid-guide-closed-only.json 期待：通る → 通った
OK  data/v1/valid-guide-closed-then-in-progress.json 期待：通る → 通った
OK  data/v1/valid-in-progress.json 期待：通る → 通った
OK  seeds/seed-ac14-three-completed.json 期待：通る → 通った
OK  seeds/seed-ac24-stats.json 期待：通る → 通った
OK  seeds/seed-ac8-intermediate-after-advanced-two-too-hard.json 期待：通る → 通った
OK  seeds/seed-ac8-intermediate-one-too-hard.json 期待：通る → 通った
OK  seeds/seed-ac8-intermediate-too-hard-then-none.json 期待：通る → 通った
OK  strings/invalid-app-name-english.json 期待：落ちる → 落ちた（data/app.name must be equal to constant）
OK  strings/invalid-empty-value.json 期待：落ちる → 落ちた（data/nav.history must NOT have fewer than 1 characters / data/nav.history must match pattern "\S"）
OK  strings/invalid-extra-key.json 期待：落ちる → 落ちた（data must NOT have additional properties）
OK  strings/invalid-missing-key.json 期待：落ちる → 落ちた（data must have required property 'task.rate.close'）
OK  strings/invalid-placeholder-missing.json 期待：落ちる → 落ちた（data/diagnosis.progress must match pattern "\{total[,}]"）
OK  strings/invalid-unexpected-placeholder.json 期待：落ちる → 落ちた（data/nav.history must NOT be valid）
OK  strings/valid-en.json 期待：通る → 通った
OK  strings/valid-ja.json 期待：通る → 通った
OK  tasks/invalid-blank-goal.json 期待：落ちる → 落ちた（data/tasks/0/goal must match pattern "\S"）
OK  tasks/invalid-code-fence.json 期待：落ちる → 落ちた（data/tasks/2/how must NOT be valid）
OK  tasks/invalid-external-no-tools.json 期待：落ちる → 落ちた（data/tasks/1/tools must NOT have fewer than 1 items / data/tasks/1 must match "then" schema）
OK  tasks/invalid-id-area-mismatch.json 期待：落ちる → 落ちた（data/tasks/0/id must match pattern "^backend-" / data/tasks/0 must match "then" schema）
OK  tasks/invalid-in-app-tools.json 期待：落ちる → 落ちた（data/tasks/0/tools must NOT have more than 0 items / data/tasks/0 must match "else" schema）
OK  tasks/invalid-in-app-url.json 期待：落ちる → 落ちた（data/tasks/0/how must NOT be valid / data/tasks/0 must match "else" schema）
OK  tasks/invalid-minutes-16.json 期待：落ちる → 落ちた（data/tasks/0/minutes must be <= 15）
OK  tasks/invalid-unknown-mode.json 期待：落ちる → 落ちた（data/tasks/0/mode must be equal to one of the allowed values）
OK  tasks/valid-sample.json 期待：通る → 通った
見本 41 件、期待と違う結果 0 件
exit=0
```
- 検査が空振りでないこと：スキーマの `formatVersion` の type を `strin` に壊すとメタスキーマの検査が false（`must be equal to one of the allowed values`）、未知のキーワード `minItemz` は strict で `unknown keyword` の例外（同じ日、スクラッチパッドで実行）。
- `firstOpenDate` の条件（2026-10-30、スクラッチパッドの ajv 8.20.0。data.schema.json の allOf の 3 つ目：`firstOpenDate` がなければ `diagnosis` と `levels` は 0 項目、`history` は 0 行）：
```
device だけ（valid-guide-closed-only.json） → true
device だけ＋persist の印 → true
空（device もない） → true
device だけ＋1 問目（firstOpenDate なし） → false（/diagnosis must NOT have more than 0 properties / / must match "then" schema）
device だけ＋1 問目＋firstOpenDate → true
firstOpenDate 2026-02-30（P1） → true
072d0e3 の data と seed の見本 18 件：旧と新のスキーマで合否が同じ 18 件、違う 0 件
```
- check-schemas.mjs の「なしなのに firstOpenDate がある」の検査が空振りでないこと：072d0e3 の valid-guide-closed-only.json（`firstOpenDate` あり）だけを置いた写しで実行 → `NG  data/v1/valid-guide-closed-only.json 期待：通る → 通った スキーマの外の決まり：「なし」なのに firstOpenDate がある（1 問目の確定の前には書かない）`、`見本 1 件、期待と違う結果 1 件`、exit=1。
- AC-8 の seed が規則を見分けること（2026-10-30、スクラッチパッドの node v24.22.1。data.md の 5 の規則を書かれたとおりに書き、seed の history に「画面で申告した難しすぎ 1 件（今の `levels[a]`）」を足して計算）：1 通り目 → `beginner`、8 通り目 → `beginner`、9 通り目 → `intermediate`（3 件とも期待どおり）。わざと誤った規則でも動かした：段階の止めを外すと 9 通り目が `beginner`（NG）、`none` を数えると 8 通り目が `intermediate`（NG）。どちらの誤りも seed で見つかる。
- 互換性を壊す変更：なし（新規）。以後の決まり：読み手が知らない項目か値を書く変更は `formatVersion` を上げる。古い版は 1 版ずつ移して読み、新しい版は拒む（ADR 0002、data.md の 6）。
- 返す enum に値を足すとき：保存データのスキーマは知らない値を拒むので、値を足すことは版を上げることと同じ。古いアプリは「版が新しい」として `error.import.reason.version` か S0 error を出し、データを上書きしない。verifier に頼む項目：fixtures/data/v1/ の 5 件が今のアプリで読めること（読み込みで同じ状態になる）と、`formatVersion: 2` のファイルが拒まれること（AC-25）。
- エラーと文言（problem+json の代わり）：
| 起きること | 画面に出す文言キー |
|---|---|
| 起動時に保存先が使えない | `error.app.storageUnavailable.message`、`.detail` |
| 起動時に保存データが読めない（壊れた、スキーマ違い、版が新しい） | `error.app.message`、`.detail`、`.reload`、`.exportRaw`、`.delete` |
| 保存（setItem）の失敗 | `error.storage.message`、`error.storage.retry` |
| 読み込むファイルの版が新しい | `error.import.message`、`error.import.reason.version` |
| 読み込むファイルが壊れた、形が違う、5,000,000 バイトを超える | `error.import.message`、`error.import.reason.schema` |
| 診断で選ばずに確定 | `error.diagnosis.required` |
| 答えが 2,000 字に達した | `task.answer.limit` |

## 5. データモデルと移行
| エンティティ | 正しいデータの置き場所 | 個人情報か | 保存期間 | 消し方 |
|---|---|---|---|---|
| 保存データ（診断の回答、領域ごとの段階、今日の課題、履歴と答え、初めて開いた日（初回の診断の 1 問目を確定した日。data.md の 2）、このブラウザの印）。形は data.schema.json | 端末（localStorage `kyounoitte:data`） | はい（自己評価、経験年数、学習の履歴、自由記述の答え。名前やメールは持たない） | 利用者が消すまで。Safari は 7 日使わないと消すことがある | 設定の「すべてのデータを削除」（`removeItem`）、ブラウザのサイトデータの削除 |
| 書き出しファイル（`device` を除いた保存データ） | 端末のファイル（利用者が置いた場所） | はい（同上） | 利用者が消すまで | 利用者がファイルを消す |
| 課題集 tasks.json、文言 ja.json と en.json | 配布物（GitHub Pages）と Cache Storage | いいえ | 版ごと。古い版のキャッシュは activate で消す | 新しい版の SW が消す |
| 配信の記録（IP アドレス） | GitHub（アプリの外） | はい | GitHub の決まりによる | アプリからは消せない。プライバシーのページに書く（PRD 17） |

- SwiftData の版：該当なし（Web）。代わりに `formatVersion` 1。移す手順は v1 なのでまだない（data.md の 6）。
- 前の版の保存データを開けるかのテスト（verifier と backend-engineer に頼む項目）：contracts/fixtures/data/v1/ の 5 件を、単体テストで手書きの検査に通し、受け入れテストで読み込む。版を上げた後も消さずに読み続ける。
- サーバーの DB：なし。

## 6. 非機能の目標
型の iOS の行は Web に読み替えた。API の行と電池の行は、サーバーと裏の処理がないので「配布物の更新」と「裏の処理」に置き換えた。
| 項目 | 目標 | 測り方と時期 | 確かめる役 |
|---|---|---|---|
| 反応 | 診断の質問の切り替えは 500 ms 以内（AC-1）。申告から次の状態まで 500 ms 以内 | AC-1 の受け入れテストで 3 回。申告は AC-5 と AC-7 のテストで click から `data-state` が変わるまでを記録（G3） | verifier |
| 起動 | 開いてから `task.today` まで 2,000 ms 以内（遅延 150 ms、下り 1.6 Mbps、CPU 4 倍）。見直しの線は 1,600 ms | AC-15 の `data-debug-load-ms` を Chromium で 5 回（G3）。公開後は G4 で Takuma が実機で計った値（PRD 13） | verifier |
| オフライン（画面ごと） | 全画面が見られて操作できる（一度読み込んだ後）。再読み込みと新しいタブで 3,000 ms 以内に同じ状態。外への送信 0 件 | AC-12、AC-23 の受け入れテスト（setOffline、W-12 の数え方。G3） | verifier |
| 転送量 | gzip 後の合計 150,000 バイト以下（内訳は budgets.md の 1） | `node scripts/check-budget.mjs dist`（G3）、公開後は本番に `curl --compressed` | verifier |
| 配布物の更新 | 差し替えから 3 回以内の読み込みで新しい版（2 秒おき） | AC-28 の受け入れテスト（G3） | verifier |
| 裏の処理（電池の代わり） | 常駐するタイマー 0 件（`setInterval` を使わない）。タイマーは答えの保存の 300 ms と、`app.loading` の 1 秒の CSS だけ | `grep -rn 'setInterval' backend/public` が 0 件（G2） | reviewer |
| セキュリティ | CSP の meta が 1 つで budgets.md の 3 と一致。`innerHTML`、`outerHTML`、`insertAdjacentHTML`、`document.write`、`eval`、`new Function` が 0 件。HTTPS の転送（301） | `grep -c 'http-equiv="Content-Security-Policy"'` が 1 と単体テスト（G2）、上の語の grep が 0 件（G2）、公開後に `curl -sI http://matsuura-tak.github.io/engineer/` が 301（Enforce HTTPS は公開時に Takuma が入れる：決定 D7） | reviewer |
| プライバシー | 利用者のデータの送信 0 件。`fetch` を呼ぶのは配布物の 3 つの JSON だけ。`sendBeacon`、`XMLHttpRequest`、`WebSocket` が 0 件 | AC-12、AC-23（G3）、`grep -rnE 'sendBeacon|XMLHttpRequest|WebSocket' backend/public` が 0 件で、`fetch(` の行が 3 つの JSON の読み込みだけ（G2、G4） | reviewer |
| 保存の大きさ | 365 行、各 2,000 字の答えでも保存データは 1,000,000 字以下 | 単体テストで見本を作って長さを測る（G2） | backend-engineer |
| アクセシビリティ | 幅 320 で横スクロール 0、フォーカスの枠 2 px 以上、axe の serious 以上 0 件 | AC-17、AC-18、AC-27（G3） | verifier |
| 対応ブラウザ | Safari 17 以上と Chrome の最新 2 版。budgets.md の 5 の「使わない」機能が 0 件 | 受け入れテストを Chromium と WebKit で（G3）、`grep` で使わない機能を探す（G2）、実機の Safari（G4、Takuma） | reviewer、verifier |

## 7. 脅威モデル
- 何を作るか：守るものは、利用者の保存データ（自己評価、履歴、自由記述の答え）と、画面が正しい課題を出すこと。境界は 3 の図の 2 つ（origin の共有、読み込むファイル）。サーバー、認証、課金、外への送信はない。
- それで十分か：残る大きな危険は origin の共有で、受け入れた（原因を作れるのは Takuma の他のリポジトリだけで、決まりと見直す条件で扱う。ADR 0005）。Safari 17〜25 では Trusted Types が効かないが、innerHTML の禁止は Chromium と WebKit の受け入れテストで機械で守られるので、配る前に見つかる。

| STRIDE | 起きうること | 対応（減らす / なくす / 移す / 受け入れる） | 確かめるテストか確認 |
|---|---|---|---|
| なりすまし（S） | 同じ origin の他の Pages が、ルートの scope の SW で `/engineer/` の画面を偽る | 受け入れる＋減らす：Takuma の他の Pages にルートの SW を置かない決まりを RUNBOOK に書く。独自のドメインは見直す条件（ADR 0005） | RUNBOOK の確認（G4、reviewer） |
| 改ざん（T） | 読み込むファイルや、拡張機能・他のページが localStorage を書き換える。通信の途中で配布物を書き換える | 減らす：読むたびに全体をスキーマで検査し、通らなければ止まる（部分は読まない）。5,000,000 バイトの上限。HTTPS（Enforce HTTPS は公開時に Takuma が入れる：決定 D7） | AC-25、fixtures/data/invalid-*、単体テスト（手書きの検査＝ajv）、公開後の curl |
| 否認（R） | 申告や削除を「していない」と言う | 受け入れる：アカウントも利害のある取引もなく、記録は本人のブラウザの中だけ | なし（理由をここに書いた） |
| 情報の漏れ（I） | 利用者のデータが外に送られる。同じ origin の他のページが読む。書き出したファイルが他人に渡る | なくす：外への送信の手段がない（CSP の `connect-src 'self'`、W-12 の 0 件）。受け入れる：origin の共有（上）とファイルの扱い（利用者の手元。設定の画面の文言で知らせる） | AC-12、AC-23、6 のプライバシーの grep |
| サービスの妨害（D） | 巨大なファイルや、上限いっぱいの保存で画面が止まる。他のページが localStorage を使い切る | 減らす：読み込みは 5,000,000 バイトまで、答えは 2,000 字まで。QuotaExceededError は `error.storage.*` で知らせて入力を残す | AC-11、単体テスト（365 行で 1,000,000 字以下） |
| 権限の格上げ（E） | 読み込むファイルや課題集の文字列から HTML を差し込んでスクリプトを動かす（XSS）。枠に入れて削除を押させる。テスト用の入口から他人のデータを消す | なくす：textContent だけ、CSP の `script-src 'self'` と Trusted Types、枠の中では始めない、本番につなぎ口を置かない（URL の引数を読まない） | 受け入れテストが Trusted Types の下で動く（innerHTML は例外になる）、test-hooks.md の末尾の grep（G2） |

## 8. 観測と KPI イベント
- 前提（Takuma の決定 D6。PRD r6 の 15）：PRD 15 のイベントは記録も送信もしない。アプリには何もしない `track(name, props)` の入口を 1 つだけ置き、各イベントの場所で呼ぶ（将来 B の計測を足す場所。中身は空で、保存も送信もしない）。理由：どの AC もイベントの記録を求めておらず、KPI は統計の画面（AC-24）と聞き取りで測る（PRD 13 の A）。
- ログ：`console` に利用者のデータを出さない。エラーの種類だけを `console.error` に出してよい。
- 性能：`data-debug-load-ms`（AC-15）だけ。MetricKit の代わりの仕組みは持たない（公開後に計り直す手段は v1 にない。PRD 13）。

| PRD 15 のイベント | 送る場所 | 使う所 |
|---|---|---|
| Page Loaded | 送らない（track() の入口だけ。load_ms は `data-debug-load-ms`） | KPI の表示時間は G4 の実機の値 |
| Diagnosis Started、Diagnosis Completed | 送らない（入口だけ） | 初日の完了率は統計の画面の first-day-completed |
| Task Issued、Task Completed、Task Skipped、Task Rated | 送らない（入口だけ） | 完了率、役に立った率、難しすぎ・今日はできないの申告率は統計の画面の issued、completed、helpful、rated、too-hard、no-time。撤退基準も同じ値 |
| Level Changed | 送らない（入口だけ） | なし（`levels` は書き出しで見られる） |
| Storage Persist Answered | 送らない（`track()` の入口だけ。結果は保存しない。求めた印 `device.persistRequested` だけを今日の課題を出す保存に含める。設定の注意は `persisted()` で今の状態を読む：data.md の 11） | なし |
| Home Screen Guide Closed | 送らない（`device.homeGuideClosed` に保存） | なし |
| Data Exported、Data Imported、Data Deleted | 送らない（入口だけ） | 「データが消えた」は聞き取り（PRD 13） |

## 9. 依存ライブラリの変更
- 足す（すべて backend の devDependencies、本番には入らない）：@playwright/test 1.64.1、@axe-core/playwright 4.14.0、ajv 8.20.0。表は contracts/dependencies.md（版、ライセンス、公開日、代わりの標準、外す手間、ADR 0004）。
- 解決の出力（2026-10-30、スクラッチパッド、node v24.22.1、npm 12.2.1）：`npm install --save-dev --save-exact …` の後の `npm ls --depth=0` → `@axe-core/playwright@4.14.0`、`@playwright/test@1.64.1`、`ajv@8.20.0`。`found 0 vulnerabilities`。
- 動いた出力：受け入れテストの形の確認（`npx playwright test -c tests/acceptance` → `2 passed (1.8s)`）、CSP と Trusted Types の下での axe（`label:critical` を検出、Chromium 156、WebKit 27.2）、4 の check-schemas の出力。
- 実行時の依存：0 件（ADR 0001）。

## 10. ADR と未確認
- この機能で書いた ADR：
  - docs/adr/0001-web-foundation-no-build-es-modules.md（まとめない ES modules、依存 0、写して刻印するビルド、置き場所と package.json の scripts）
  - docs/adr/0002-storage-localstorage-single-key.md（localStorage の 1 キー、formatVersion、ID を変えない、U-5〜U-8 と U-11）
  - docs/adr/0003-service-worker-update.md（先に全部取る、skipWaiting、`cache: 'reload'`）
  - docs/adr/0004-acceptance-test-setup.md（Playwright の 2 エンジン、設定はフォルダの中、axe、ajv、自作の静的サーバー）
  - docs/adr/0005-csp-and-trust-boundaries.md（厳しい CSP と Trusted Types、枠の中では始めない、origin の共有）
- Takuma の決定（2026-10-30、D1〜D10。すべて推奨どおり。docs/approvals/001-daily-learning-G0.md）と反映先：
  - D7（設計メモの E3）HTTPS の転送（Enforce HTTPS）は公開時に Takuma が Pages の設定で入れる：6 のセキュリティの行、7 の T、ADR 0005。
  - D6（E4）イベントは記録しない（`track()` の入口だけ）：1 の非目標、8。PRD r6 の 15 も同じ文。
  - D5（P4、design U-13）ホーム画面のアイコン `./icon-180.png` と `./manifest.webmanifest` を置く：budgets.md の 1（10,000 バイトの枠）と 6（manifest の 7 項目、`<head>` の 5 行、確かめ方）、service-worker.md の 3（FILES）、ADR 0001 の表。CSP は変えない（`img-src 'self'`、`manifest-src 'self'`）。
  - D1 主操作の色（青）：契約への影響なし（design/tokens.md だけ）。
  - D2 日付は両言語とも ISO：strings.md の 3、identifiers.md の 4（見える文字と属性が同じ値）。
  - D3 英語でもアプリ名は「今日の一手」：strings.md の 6、strings.schema.json の `app.name` の const、budgets.md の 6。
  - D4 完了画面に題名を 1 行残す（`task.done.task`）：strings.schema.json がこのキーを必須にしている。変更なし。
  - D8 app.json の `commands.backend_test` は G2 の直前に Takuma が main で入れる：CLAUDE.md のコマンドの節。
  - D9「初めて開いた日」＝初回の診断の 1 問目を確定した日：data.md の 2（PRD r6 の 11 の冒頭と同じ。変更は参照の書き方だけ）。
  - D10 AC-8 の 8 通り目と 9 通り目：data.md の 5（seed の表、各行の `level` はその課題が出たときの段階）、fixtures/seeds/ に 2 件、test-hooks.md の W-7、ADR 0001 の単体テストの数。
- 未確認の項目、確かめる方法、確かめる役：
  - backend/package.json、build.mjs、check-budget.mjs、単体テスト、受け入れテストのコマンドは、まだ動かしていない（backend/ がない）。G2 で backend-engineer と verifier が動かし、出力を出す。
  - localStorage の 1 origin あたりの上限：2026-11-03 に Playwright で測った（Chromium 5,242,865 字、WebKit で日本語を含むと 2,621,432 字。data.md の 10）。公式の数字、本物の Safari 17 の値、origin を共有する他のページが使う分は未確認。見直す条件で監視する（ADR 0002）。
  - どのブラウザ設定で localStorage が例外になるか（S0 error の変種 (2)）：G4 で Takuma が実機で 1 つ試す（Safari の「すべての Cookie をブロック」）。
  - LINE などのアプリ内ブラウザの UA と保存の行き先、iOS 実機のホーム画面の Web アプリでの書き出しと読み込み、persist() の 7 日の免除：G0 の承認で G4 に回した（未検証に数えない）。
  - meta の CSP で frame-ancestors が効かないことの各ブラウザの挙動：確かめていない。枠の中で始めない作りなので結果に影響しない。
  - `apple-mobile-web-app-title` を iOS がホーム画面の名前に使うこと：Apple の公式の文書で見つけていない（Safari HTML Reference の meta の一覧にない）。`<title>` と manifest の `name` が同じ値なので結果は変わらない。G4 に Takuma が実機で名前を見る（budgets.md の 6）。
  - GitHub Pages が `.webmanifest` に返す `Content-Type`：公開後に curl で確かめる（G4。budgets.md の 6）。
  - `persist()` の確認の表示：Firefox は確認を出す（web.dev）。求めるのは保存データごとに 1 回だけ（data.md の 11）なので、出ても 1 回。Safari 17 が確認を出さないことは公式の文書にない。Firefox は対応ブラウザの外。Safari は G4 で Takuma が実機で見る。

## 確かめ（A）
- [x] 2 の表に PRD の全 AC があり、空の欄がない（`grep -cE '^- AC-[0-9]+：' docs/prd/001-daily-learning.md` → 32、2 の表の行 → 32。2026-10-30 に実行）
- [x] 3 の図のすべての要素に技術と責任が、すべての矢印に用途と通信方式がある
- [x] 契約のすべての operation に operationId、成功とエラーの例、認証の要否、AC 番号がある。エラーは problem+json（読み替え：operation はない。各スキーマに正しい見本と壊した見本があり、description に AC 番号、エラーは 4 の文言の表）
- [x] 4 に spectral と oasdiff の出力（または「未検査」と理由）がある。互換性を壊すなら ADR と大きな版の上げがある（未検査（OpenAPI なし）と、代わりの check-schemas の出力。新規なので壊す変更なし）
- [x] 5 の全エンティティに置き場所、個人情報か、保存期間、消し方がある。モデルを変えたなら MigrationStage がある（新規。移す手順の決まりは data.md の 6）
- [x] 6 のすべての行に数字と測り方がある
- [x] 7 が STRIDE の6行か「新しい境界なし」のどちらか。受け入れた危険に理由がある
- [x] 8 で、PRD 15 の全イベントに送る場所がある（13 件すべて「送らない」）
- [x] 新しい依存に、解決とビルドの出力があり、dependencies.md の全列が埋まっている（ビルドの出力の代わりに、解決と、実際に動かしたテストの形の出力）

## 変更の記録
G1 reviewer（設計）r1 の要修正と提案、pdm の G1 の確認（firstOpenDate）を反映した（2026-10-30、tech-lead）。1 行に 1 つの変更。
- M1：ADR 0002 の「結果」、test-hooks.md の W-9、この 2 の AC-11 の行を「なしか診断の途中の起動では setItem を呼ばない（AC-11 の注入はこの状態）。ありの起動では data.md の 2 のとおり最大 1 回」に揃えた。
- M1：data.md の 2 に同じ文を足し、参照の誤り「4 の (5)」を「4 の 6-1」「6-4」に直した。4 の 6-4 に「選べなくても 6-1 で移した行は 1 回保存する」を足した。
- P1：data.md の 6 に「日付の実在は検査しない。文字列のまま比べ、new Date() に渡さない」を足した。
- P2：data.md の 5 の 2 に「やり直しの診断で段階が変わった直後も同じ。PRD 11 の冒頭を参照」を足した（PRD の文は pdm）。
- P3：service-worker.md の 1 に「ポリシーは起動ごとに 1 回だけ作り、トップレベルに持つ」と spike（2 回目は Chromium と WebKit で TypeError）を足した。
- P4：budgets.md の 1 の数え方を zlib を正とし、文言の行を「約 6,500」と zlib（6,470）と gzip -9（6,440）の両方の値にした。
- P5：test-hooks.md の W-4 と ADR 0004 の確かめたことに「use（testOptions）でも newContext でも渡せる」と URL を足した。
- P6：identifiers.md の `task.external.tools` と `.item` を「`<dd>` の中の `<ul>` の `<li>`」にした。
- firstOpenDate：data.md の 2（表の 2 行と規則）、3（なしの例、スキーマの条件、S8 の表示）、4（23:55 と 0:05 の例）、6、7（書き出しはありだけ、なしのファイルは読まない、ファイルの値を使う）、8 を直した。
- firstOpenDate：data.schema.json の required から外し、allOf の 3 つ目（なければ diagnosis、levels、history が空）を足した。description を直した。
- firstOpenDate：fixtures の valid-guide-closed-only.json から firstOpenDate を外し、valid-guide-closed-then-in-progress.json と invalid-{in-progress,history,levels}-without-first-open-date.json を足した（34 → 38 件）。
- firstOpenDate：check-schemas.mjs に「なしなのに firstOpenDate がある」の検査を足した。ADR 0002 の「一緒に決めたこと」と「確かめたこと」、test-hooks.md の W-16、この 2 の AC-20、AC-21、4、5 を直した。
- 件数：ADR 0004、CLAUDE.md、この 4 の見本の件数を 38 にした。

Takuma の決定 D1〜D10 と PRD r6、design r4 に合わせた（2026-10-30、tech-lead）。1 行に 1 つの変更。
- Takuma の返事を待って仮に置いた印：設計メモの 1、6、7、8、10、ADR 0005、strings.md の 3 と 6、budgets.md の 1 を「Takuma の決定 Dn」に直した（その印の語の grep が contracts、docs/adr、CLAUDE.md で 0 件）。冒頭の PRD を r6、デザインを r4 にした。
- D5：budgets.md の 1 の表で manifest を殻の行からアイコンの行に移し、「アイコンと manifest で 10,000」にした（合計 150,000 は不変。design 8 の枠と同じ）。
- D5：budgets.md に 6 を足した（`./icon-180.png`、`./manifest.webmanifest` の 7 項目と置かない項目、`<head>` の 5 行、CSP との整合、確かめ方）。service-worker.md の 3 の FILES と ADR 0001 の表を確定の名前にした。test-hooks.md のサーバーに `.png` の Content-Type を足した。
- D3：strings.schema.json の `app.name` を const「今日の一手」にし、落ちる見本 fixtures/strings/invalid-app-name-english.json を足した。ADR 0001 のビルドが書き込むものに `apple-mobile-web-app-title` を足した。
- D10：data.md の 5 の「seed の古い行の level は levels[a] と同じ」を「その課題が出たときの段階」に直し、AC-8 の seed の表を足した。test-hooks.md の W-7 も同じに直した。
- D10：fixtures/seeds/ に seed-ac8-intermediate-too-hard-then-none.json（8 通り目）と seed-ac8-intermediate-after-advanced-two-too-hard.json（9 通り目）を足した。2 の AC-8 の行と ADR 0001 の単体テストを 9 通りにした。
- D9 と D10：data.md の 2 と 5 の「PRD 11 の冒頭を参照」を、参照先の語（「初めて開いた日」、「連続」の定義）が分かる書き方にした。
- U-7：data.md の 2 と ADR 0002 に「やり直しの診断で終える前に離れたら（やめる、nav、アプリ名、再読み込み、日付の変わり目）下書きを捨て、元の診断のまま」を足した（designer の申し送り）。
- 件数：4 の check-schemas の出力を貼り直した（38 → 41 件）。4 の表、ADR 0004、CLAUDE.md の件数を 41 にした。10 の未確認に `apple-mobile-web-app-title` と Pages の Content-Type を足した。

G2（受け入れテスト）の tech-lead r1 と reviewer r1 で「契約、ADR、CLAUDE.md の側で直す」とした項目を反映した（2026-10-31、tech-lead）。1 行に 1 つの変更。
- 依存の置き場所 B：ADR 0004 の決定に置き場所とコマンド `cd backend/tests/acceptance && npm ci && npx playwright install chromium webkit && npx playwright test` を書き、案 A、B、C を足した。test-hooks.md の「実行の環境」、dependencies.md（「入る package.json」の列と決まり）、CLAUDE.md を同じにした。
- ADR 0001：backend の devDependencies を ajv だけにし、`test:acceptance` を受け入れテストのフォルダで動かす形にした。`build` から `--version dev` を外し、版は呼ぶ人が `YYYY-MM-DD.N` で渡す（形に合わなければ終了コード 1。test-hooks.md の「ビルドの手順の約束」に正規表現）。check:contracts が backend/ の ajv で動く理由を書いた（G2 reviewer r1 の提案 6）。
- test-hooks.md：「キーボードの移動キー」（AC-18。WebKit は `Alt+Tab` と `Alt+Shift+Tab`、それ以外は `Tab` と `Shift+Tab`。Linux の WebKit は未確認）を足した。2 の AC-18 の行も直した。
- test-hooks.md：W-13 の対象に AC-12 を足した（オフラインにする前に SW の準備を待つ）。2 の AC-12 の行も直した。
- test-hooks.md：W-9 の失敗の注入を「テストが印を立てた後の次の 1 回」にし、W-7 の順番の理由と data.md の 1 の理由の文を合わせた。
- test-hooks.md：AC-31 の数え方の 3 に「題名とその祖先は数えない」を足した。
- test-hooks.md：W-7 に AC-14 の seed（本番の課題集から作る出し終えた履歴。seed-ac14-three-completed.json は Given を満たさない）を足した。2 の AC-14 の行も直した。PRD の Given の書き方は pdm への問い（G2 tech-lead r1 の未解決 (2)）。
- test-hooks.md の W-6 と budgets.md の 2：予算のテストの名前を `BUDGET2_` で始め、AC の表に混ぜないとした（G2 reviewer r1 の提案 4）。
- test-hooks.md（G2 tech-lead r2）：「時間の計り方」の節を足した（AC-1、AC-2 はページの中で click の capture から MutationObserver まで、AC-23 はテスト側の `commit` と 20 ms おきの `expect.poll`。案 (b) は選ばない）。W-3、W-10 に参照を足し、「キーボードの移動キー」の Linux の未確認に WebKit のソースの裏付けを足した（最初の CI で確かめるのは残す）。

PRD r7 と Takuma の Q11 の決定（A：AC-14 に 2 通り目を足す。2026-11-01）に合わせた（2026-11-01、tech-lead）。1 行に 1 つの変更。
- Q11：test-hooks.md の W-7 の AC-14 を 2 通り（1 通り目は出し終えた履歴、2 通り目は seed-ac14-three-completed.json の形で開いて `task.today` を出してからやり直し、翌日に固定して開く）にし、data.md の 2 にやり直しを終えた後の行き先（4 の 6-2〜6-4 と同じ）を 1 項足した。2 の AC-14 の行を 2 通りにし、冒頭の PRD を r7 にした。

実装の後の地図と依存の整理（2026-11-03、tech-lead）。1 行に 1 つの変更。
- contracts/dependencies.md に「推移的な依存」の節（扱いの決まり、確かめ方 3 つ、lockfile の 7 件の表）を足し、CLAUDE.md の段階を G2（実装）に、コマンドの「未確認」を backend/ で動かした結果に直した（受け入れテストは 133 本）。
- contracts/data.md の 10：「365 行 × 2,000 字で 1,000,000 字以下」は答えが日本語か英数字のときだけ成り立つので、字の種類ごとの長さの表、Chromium と WebKit で測った localStorage の上限、上限を超えたときの動きに書き直した（backend-engineer の G2 の報告）。6 の「保存の大きさ」と 7 の D の行の 1,000,000 字も同じ前提で読む。ADR 0001 の「確かめたこと」に backend/ で確認した追記を足した（G2 reviewer r1 の提案）。
- ADR 0002：U-6、検討した案の (a) と (b)、反論への答え、確かめたことの上限の数字を data.md の 10 に合わせ（答えが日本語か英数字のときの前提、測った上限）、見直す条件に「上限に届いたあとの扱いは v1 で手当てせず 002 以降」（指揮役の決定、docs/approvals/delegation.md）を足した。10 の未確認の localStorage の上限の行も測った値に直した。

design r6（05cdd4a）と design-reviewer G3 r1 の指摘 3、6、8 に合わせた（2026-11-04、tech-lead）。1 行に 1 つの変更。
- 指摘 3（D-30）：strings.schema.json の required と properties に `task.dayChanged`（差し込みなし）を足し、146 キーにした。fixtures/strings の 8 件すべてに同じキーを足した（invalid の 6 件は、元の 1 つの理由だけで落ちる形のまま）。文は design 7 と一字一句同じ（node で比べた）。
- 指摘 3：identifiers.md の 3（146 個、`task.dayChanged` の要素、置き場所、フォーカス、0 件になる画面、消える時機）、2 の `task.today` と `task.exhausted` の備考（data-state は増やさない）、6（task は 33）を直した。strings.md の 1、README.md、この 2 の AC-26 の行も 146 にした。
- 指摘 3：budgets.md の 1 の文言の行を 146 キーで測り直した（zlib 3,554 + 3,016 = 6,570、`gzip -9` 3,516 + 3,047 = 6,563。上限 8,000 は不変）。
- 指摘 3：data.md の 4 の「画面を開いたまま日付が変わったとき」を書き直した（対象の画面、手順 1〜4、結果、例 2 つ、対象の外）。data.md の 2 に「やり直しの判定も最大 1 回で、書きかけの答えを含める」を足した。ADR 0002 の「結果」も同じ。2 の AC-32 の行に参照を足した。
- 前日の答えが翌日の `current.answer` に入る件（探索 R3 の 2）：原因は、日付の変わり目の判定の後に描く S3 の `render()` が、捨てていない前日の答えの欄を `flushAnswer()` で新しい `current` に保存すること（main.js の 63〜66 行と 110 行）。data.md の 4 の手順 1（欄の値はメモリの `current.answer` に入れ、欄はそこで捨てる）で、実装がこの順にしか書けないようにした。
- 同じ節の手順 2：判定は保存を `getItem` で読み直してから行う（初めの案の「メモリの保存データで判定」をやめた。2026-11-04）。メモリで判定して保存すると、別のタブが後から保存した翌日の課題や申告を上書きして消すため。読んだ `current` が画面の課題（`date` と `taskId`）と同じときだけ、捨てた欄の値をその `answer` にする。setItem の回数は変わらない。
- 指摘 8（D-31）：data.md に 11（求める時機、手順、S8 の注意、理由、未確認）を足した。2 の表から「`persist()` の結果が返る」の行を外し、結果を保存しないことと、`device.persistRequested`、`persistGranted` を読むだけにすることを書いた。data.schema.json の 2 つの description を直した（形は変えない）。test-hooks.md の W-9 を `persist()` と `persisted()` の両方の注入にし、W-3 に「開いたまま日付を進める」を足した。8 の表と 2 の AC-13 の行、10 の未確認を直した。ADR 0002 の「一緒に決めたこと」に 1 項足した。
- 検査：`cd backend && npm run check:contracts` → `見本 41 件、期待と違う結果 0 件`、終了コード 0（2026-11-04、ajv 8.20.0。strings の 8 件はすべて期待どおり）。足したキーが要ることの確かめ：valid-ja.json から `task.dayChanged` を消すと `must have required property 'task.dayChanged'`、`{date}` を入れると `data/task.dayChanged must NOT be valid`。今の backend/public/i18n/ja.json と en.json は `must have required property 'task.dayChanged'` で落ちる（backend-engineer が足すまで、単体テスト i18n-files.test.mjs の 1 本が落ちる：94 本中 93 本が通る）。
- spike（リポジトリの外、@playwright/test 1.64.1。127.0.0.1 の新しいコンテキスト）：注入なしの `persisted()`、`persist()`、もう一度 `persisted()` は Chromium 156 と WebKit 27.2 のどちらも `false`、`false`、`false`。注入しなくても S8 の注意が出るので、seed で「あり」にした S8 のスクリーンショットにも注意が写る。

決めたこと（designer に任された 3 つ。2026-11-04、tech-lead）：
- U-14（`persist()` を求め直すか）：この時点の案は「求め直す（今日の課題を出した直後の S3 の後に、`persisted()` が false のときだけ。1 日 1 回まで）」だった。PRD 11 の冒頭（1 回だけ）との食い違いが残り、指揮役の決定（2026-11-04、docs/approvals/delegation.md）で取り下げた。今の形は下の「U-14 を PRD どおりに戻した」にある。
- U-15（S1 と S2 にも日付の確かめが及ぶ件）：保存データが「なし」と「診断の途中」の画面と S0 error では確かめず、操作をそのまま実行する（data.md の 4 の「対象の外」）。
  - 理由：これらの画面には移す課題がない。日付を使う保存（`firstOpenDate`、`completedOn`、今日の課題）は実行した時点の今日で書くので、日付が変わってから操作したときと結果が同じ。捨てると、知らせもないまま radio の確定が 1 回消え、S0 error では「再読み込み」が 1 回効かない。
  - いちばん強い反論：決まりが保存データの区分で変わり、規則が 1 つでなくなる。やり直しの S2（「あり」）は捨て、初回の S2 は捨てないので、見た目が同じ画面で振る舞いが違う。
  - それでも選んだ理由：やり直しの S2 の確定は今日の課題の有無に効く（data.md の 2）。日付をまたいだら前の日の課題を移す必要があり、PRD 11 の冒頭の決まりがそのまま当たる。初回の S2 には当たる対象がない。区分の定義は data.md の 3 のものを使い、新しい定義は足さない。
- aria-invalid（エラーの間の textarea。design-reviewer の指摘 6 の「直す方向」と designer の判断の違い）：付けない（designer の判断のまま）。枠（size.border.strong、color.error）と `aria-describedby`（補助文とエラーの文）だけにする。
  - 理由：`aria-invalid` は「入れた値がアプリの期待する形に合わない」ことを示す状態。値を検査した結果として付ける（https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid ）。ここのエラーは保存先の失敗（QuotaExceededError）で、答えの値は正しい。付けると、スクリーンリーダーが「無効な入力」と読み、利用者に直す必要のない答えを直させる。エラーの文は `role="alert"` ですぐ読まれ、欄に戻ると `aria-describedby` で読まれるので、赤い枠の意味は文字でも伝わる（WCAG 2.2 SC 1.3.1、1.4.1）。
  - いちばん強い反論：赤い枠は「この欄がエラー」という見た目の状態で、目で見る人と同じ状態を、支援技術はプログラムで受け取れない（describedby は説明で、状態ではない）。reviewer と axe はこの組み合わせを見落としと見る場合がある。
  - それでも選んだ理由：状態として渡すと、意味（値が不正）がずれる。説明の文で渡す方が正しい。見直す条件：axe か G4 の VoiceOver の確認で、エラーの文が欄から読まれないと分かったら。
- この 3 つと D-30 の契約は、自分では合格にしない。reviewer に反論を出してもらう（特に U-15 の区分による違い）。

U-14 を PRD どおりに戻した（指揮役の決定 2026-11-04「求め直さない」。tech-lead）。1 行に 1 つの変更。
- U-14 は指揮役の決定で求め直さない形にした。data.md の 11：`persist()` は保存データで初めて今日の課題を出した後の S3 で 1 回だけ。印 `device.persistRequested: true` は、印がないときに今日の課題（`current`）を作る保存（初回とやり直しの診断を終える、起動時と日付が変わった後と読み込みの後の 6-4）に含める。先に `persisted()` を調べない。結果（`persistGranted`）は書かない。S8 の注意は D-31 のまま（描くたびに `persisted()`、ない・例外なら出さない）。
- 元の契約（fcddc81 の前）との違い：元は「結果が返る」で `persistRequested` と `persistGranted` を別の保存で書いた。印のない「あり」のデータ（前の実装のデータ、印のない seed）の起動では 6-4 の保存と結果の保存で 2 回になり、data.md の 2 の「あり」の起動で最大 1 回と食い違う。非同期の保存は AC-11 の注入（印の後の次の 1 回）とも重なりうる。印を 6-4 などの保存に含め、結果を書かないことで setItem の回数を変えずに PRD の「1 回だけ」を守る。`persistGranted` は読む所がない（S8 は `persisted()`、イベントは記録しない：D6）。
- data.md の 2：表の 3 行（初回とやり直しの診断を終える、起動時の保存）に印を足し、表の下の文を「印は別の保存にしない。結果は保存しない」に直した。11 を書き直した（時機、条件、失敗と削除と読み込みのときの印、結果、理由、失うものと見直す条件、未確認）。PRD との食い違いの項は消した（食い違いがなくなった）。
- data.schema.json：`persistRequested` と `persistGranted` の description を直した（形は変えない。`formatVersion` は 1 のまま）。
- test-hooks.md の W-9：AC-13 の呼ぶ回数（初回の診断を終えた読み込みで 1 回、以後 0 回）、保存の印、印のない seed の扱いを書いた。注入は `persist()` と `persisted()` の両方を false のまま。
- ADR 0002 の「一緒に決めたこと」の persist の項、2 の AC-13 の行、8 の Storage Persist Answered の行、10 の Firefox の未確認を直した。
- いちばん強い反論：Chrome は断った要求を後で評価し直すので、毎日求めれば後で通る人がいる（https://web.dev/articles/persistent-storage ）。1 回だけでは、初回に断られた人は v1 の間ずっと永続にならない。それでも選ぶ理由：PRD と design の D-23 が 1 回で、確認が毎日出るブラウザ（Firefox）を作らない。断られた人には S8 の注意と書き出しがある（AC-13）。見直す条件は data.md の 11。
- 検査：`cd backend && npm run -s check:contracts` → 末尾 `見本 41 件、期待と違う結果 0 件`、終了コード 0（2026-11-04、ajv 8.20.0。description だけの変更なので合否は前と同じ）。

G2 r3 の判定（reviewer のコード r3、tech-lead のテスト r3）の提案と指揮役の決定（2026-11-04、docs/approvals/delegation.md の最後の 2 行）に合わせた（2026-11-04、tech-lead）。1 行に 1 つの変更。
- data.md の 11（S8 の待つ上限）：前は上限がなかった（`persisted()` が返らないと S8 に着けない）。今は「S8 へ移る操作の始めから 1,000 ms で答えが決まらなければ、注意なしで S8 を描き、後から返っても描き直さない」。指揮役の決定どおり。
- data.md の 11（待つ間の操作）：前は「待つ間に別の操作で画面が移ったら、遅れて S8 を描かない」だけで、移らない操作と、前の画面の状態の扱いがなかった（reviewer r3 の要修正：やり直しの S2 で `diagnosis.cancel` の後、待つ間に `diagnosis.next` で TypeError）。今は (1) 前の画面と操作は残す、(2) S8 へ移る操作は S8 を描くまで下書きなどを捨てない（捨てるのは描くとき）、(3) 待つ間に次の操作（`task.dayChanged` を外す操作と同じ範囲）が始まったらその操作を優先し、画面を移さない操作でも遅れて S8 を描かない、(4) もう一度 S8 へ移る操作をしたら後の待ちだけが描く。例に reviewer の再現の手順を書いた。
  - 選ばなかった案：(a) 待つ間は前の画面の操作を止める（`inert` など）。止める仕組みと解く仕組みが要り、1,000 ms の上限があっても「押しても効かない」時間を作る。(b) 下書きの null を onAnswer で見て何もしない。TypeError は消えるが、利用者が押した「次へ」が黙って捨てられ、その後に S8 が描かれる（押した操作が結果を持たない）。(c) をとった：最後に押した操作が効く、というふつうの規則で 1 つにまとまる。
  - いちばん強い反論：`diagnosis.cancel` を押したのに、待つ間の `diagnosis.next` で診断を終えることがある（やめたつもりが保存される）。それでも選ぶ理由：待つ時間は実測 61〜70 ms、上限 1,000 ms で、その間に押すのは「やめる」を取り消して進める意思と読むのが自然。保存されるのは利用者が選んだ回答だけで、壊れたデータは作らない。
- data.md の 11（失敗した保存と `persist()`）：前は「その保存が失敗しても `persist()` は呼びます」の 1 文で、診断を終える保存の失敗（S2 に留まる）でも呼ぶと読めた。今は「呼ぶきっかけは S3 を描いたこと」とし、6-4（起動時、日付の変わり目、読み込みの後）は失敗しても S3 を描くので呼ぶ、診断を終える保存は失敗すると S2 に留まるので呼ばず、再試行が成功して S3 を描いた後に 1 回、と分けた。今の実装（main.js の 278-288、302-312、188 行）の動きと同じで、実装の直しは要らない。
- budgets.md の 1：殻 26,000 → 32,000、アイコンと manifest 10,000 → 4,000（文言 8,000、課題集 106,000、合計 150,000 は不変）。殻を「JS 26,000（ADR 0001 の見直す条件と同じ線）＋ HTML と CSS 6,000」にした。理由と動かさなかった枠は budgets.md の 1 の「枠の見直し」。測った値（`node scripts/build.mjs --out <スクラッチパッド>/dist --version 2026-11-04.1 && node scripts/check-budget.mjs <同>/dist`）：殻 25,794（JS 22,135、CSS 2,794、HTML 865。node の zlib level 9 で拡張子ごとに足した）、文言 6,610、アイコンと manifest 2,173（生：icon-180.png 2,107、manifest 231）、課題集 30,193、合計 64,770、OK。
- budgets.md の 6：アイコンの生の大きさの上限 10,000 → 4,000、単体テストの確かめも 4,000 にした（1 の枠と合わせる）。今の icon-180.png（2,107）は通る。
- test-hooks.md の W-6：`DESIGN_<design の番号>_` の接頭辞を 1 行足した（AC にない design の状態だけのテスト。AC のループに足さず、G3 の AC の表に混ぜない。`BUDGET2_` と同じ扱い。tech-lead r3 の提案 4）。
- test-hooks.md の W-9：「保存データの印」の読み方（`page.evaluate` で `localStorage.getItem('kyounoitte:data')` を 1 回読み、テスト側で JSON.parse。setItem と removeItem はしない。data.schema.json に通してよい）と、S8 の待つ上限を確かめるときの `persisted()` の注入（返らない約束、遅らせた約束）を足した。
- 検査：`cd backend && npm run -s check:contracts` → 末尾 `見本 41 件、期待と違う結果 0 件`、終了コード 0（2026-11-04。スキーマと見本は変えていない）。
- 自分では合格にしない。reviewer に反論を出してもらう（特に待つ間の操作を優先する (c) と、アイコンの上限を下げたこと）。
