# 判定の報告：001-daily-learning G1 tech-lead r1

- 関門：G1（デザインの実現性）
- 判定した役：tech-lead
- 回：r1
- 対象：design/001-daily-learning.md、design/tokens.md、design/001-daily-learning/screens.md（feat/001-daily-learning、0d83baf）
- 日付：2026-10-30
- 保存した役：指揮役（報告の文章はそのまま）

---

PASS

デザイン仕様は、いまの構成（静的 HTML/CSS/JS、localStorage、Service Worker、GitHub Pages、サーバーなし）で作れます。
- 本番の配布物に足す依存ライブラリは 0 件です。要るのはテスト用の 3〜4 件だけです。
- Web フォントとアイコンは 0 個です。spike では、仕様の作り（preload を使う）で 150 KB と 2 秒の両方に収まりました。ただし公開後に足す 252 件版の課題集は、1 件の本文が約 650 字を超えると 150 KB を超えます。これは契約で上限として決めます。
- 重大な指摘はありません。要修正は 2 件で、どちらも designer が 1〜2 行直せば済みます。

## 指摘
- 要修正 M1、design/001-daily-learning.md:35「答えの欄：入力の 1 秒後に保存」
  - 問題：PRD の決まりは「最後の入力から 1 秒以内に保存」（docs/prd/001-daily-learning.md:116、:378）で、AC-32 のテストは「最後の入力から 1 秒待って」から閉じます（:369）。仕様どおりちょうど 1 秒後に保存すると、テストが閉じる時刻と保存の時刻がほぼ同じになり、落ちたり通ったりします。
  - 直す方向：「最後の入力から 1 秒以内（間隔は contracts/ で決める。案 300 ms）。pagehide と visibilitychange（hidden）でも保存する」と書く。
- 要修正 M2、design/001-daily-learning.md:17-30（画面の流れ）と :144（S0 の行）。初回の診断の途中で再読み込みしたときの行き先がない
  - 問題：初回の診断は質問ごとに保存します（AC-11、PRD :114）。そのため「1〜2 問だけ答えた保存データ」が実際にできます。ところが流れの表は「保存データなし → S1」「保存データあり → S3/S5/S6/S7」「読めない → S0 error」の 3 つしかありません。作り手が「保存データあり」と読むと、S3 で課題を選ぶ処理が落ちます。
  - 直す方向：流れに 1 行足す。例：「診断の途中（回答が 1〜2 問）→ S2 のまだ答えていない最初の質問。選んだ値を戻す」。「保存データあり」の定義（診断を終えたか、履歴が 1 件以上）は契約で決めます。
- 提案 P1：保存先が使えないときの状態がない（S0 の表 :144）
  - 起動のときに localStorage に触ると例外が出るブラウザの設定（Cookie をすべて止めるなど）では、S0 の loading のまま止まります。
  - 直す方向：S0 の error に「保存が使えない」の変種と文言 2 キーを足す。足さない場合は、ADR で「error.app.* で代用する」と決めます。どの設定で例外になるかは未確認です（実機で確かめていない）。
- 提案 P2：JS が動く前の文の言語（:144、:193、`app.loading`、`app.noscript`）
  - 殻の文は静的な HTML に入ります。CSP の下ではインラインのスクリプトを書けない（ハッシュを付けない限り）ので、ブラウザの言語に合わせて出し分けられません。
  - 直す方向：殻の 2 つの文だけ日英を併記する（例「読み込んでいます / Loading」）。文言ファイルのキーはそのまま残し、ビルドの手順で HTML に書き込みます。
- 提案 P3：ダイアログの書き方（:108 は `role="dialog"`、`aria-modal="true"` を明示する書き方）
  - AC-31 は重なる要素を「`role="dialog"` と `aria-modal="true"` の要素」で数えます（PRD :178）。しかしネイティブの `<dialog>` は属性を書かなくても dialog の役割を持つので、CSS の属性セレクタでは数えられません。
  - 直す方向：仕様は「ネイティブの `<dialog>` を使い、開くときに DOM に足して、閉じたら外す」とだけ書く。数え方（`getByRole('dialog')` と `[aria-modal="true"]` と固定配置の要素）は契約に書きます。
- 提案 P4：ホーム画面のアイコンとマニフェストがない（D-20 は画面の中のアイコンが 0 個という決まり）
  - iOS でホーム画面に追加すると、アイコンはページの縮小画像になります。
  - 直す方向：apple-touch-icon（180 px の PNG 1 枚、10 KB 以下）と manifest（name、display: standalone、start_url と scope は ./）を置くかを、designer と Takuma が決める。置くなら 150 KB の中に数えます。

## 次のステップ（契約と ADR）に要るもの

### A. 未決 U-5〜U-8、U-11 の確定案（ここでは決めない）
- U-5（S0 の error）：採る。PRD の範囲を変えずに、壊れた保存データに対する空とエラーの手当てになるからです。
  - error にする条件：JSON.parse が失敗する。スキーマに合わない。formatVersion が今の版より新しい。localStorage の読み出しが例外を出す（P1）。
  - 部分だけ読む作りはしない（仕様の「一部だけ読めたとき＝なし」と合う）。exportRaw は文字列をそのまま Blob にして書き出す。
- U-6（answer.max）：2,000 字の案。
  - 根拠：365 日 × 2,000 字 ≒ 73 万字（UTF-16 で約 1.5 MB）で、localStorage の上限（1 origin あたり約 5 MB。数字は未確認）に余裕がある。
  - 注意：この origin は matsuura-tak.github.io の他のページと共有する。
  - 上限に達したら `task.answer.limit` を出す。保存のときの QuotaExceededError は error.storage.* に回す。
- U-7（やり直しの下書き）：やり直しの回答はメモリだけに持ち、「診断を終える」で 1 回だけ保存する。
  - 初回は質問ごとに保存する（M2 の途中の状態を持つ）。
  - やり直しの途中で再読み込みしたら、元の診断のまま今日の状態に戻る（下書きは捨てる）。
- U-8（ID）：仕様の値をそのまま ID にする。
  - 領域：backend / frontend / database / infra / testing / git
  - 段階：beginner / intermediate / advanced
  - 経験年数：lt1 / 1to3 / 3to5 / gte5
  - 課題の ID：`<area>-<level>-<3 桁>`
  - 保存データと書き出しファイルに残るので、一度決めたら変えない。課題を消さない、ID を使い回さない。これを ADR に書く。
- U-11：`task.answer` を採る。PRD の `task-answer` は仮置きだったので（:176）。
- そのほかの語彙
  - `data-report`：done / too_hard / too_easy / no_time / none。verifier r3 の W-8 は completed だが、仕様の screens.md と PRD の AC-32（none）に合わせて done にする。
  - `data-helpful`：helpful / not_helpful / unanswered。完了していない行には属性を付けない。
  - 言語の判定：PRD 12（:384）に従い「ja で始まれば日本語、それ以外は英語」。verifier の W-14 の「en で始まれば英語、それ以外は日本語」は PRD と逆なので、こちらは採らない。

### B. 契約（contracts/）に要るもの
HTTP の API はないので OpenAPI は書きません。JSON Schema 2020-12 と、短い Markdown の決まりで書きます。

1. `contracts/schemas/tasks.schema.json`（W-6、AC-3、AC-29）
   - 項目：formatVersion、tasks[]（id、area、level、mode、minutes（1〜15 の整数）、title、why、how、goal、tools）。
   - mode が external なら tools は 1 件以上、in_app なら 0 件（if/then で書く）。in_app の本文 4 つに http:// と https:// を含めない（not/pattern で書く）。
   - 文字数の上限：題名 60、why 200、how 300、goal 150（案）。
   - 252 件版の予算：圧縮後 110 KB 以下（1 件の本文を平均 600 字以下にする）。pdm が下書きを始める前に知らせる必要がある。
   - 組ごとの件数、external の割合（20% 以下）、ID の重複は JSON Schema で書けないので、受け入れテストのコードで数える。
   - 本文はプレーンな文字列にする。段落は `\n` で分ける。行内のコードはバッククォートで囲み、アプリが DOM の API（textContent）で `<code>` にする。innerHTML は使わない。
2. `contracts/schemas/data.schema.json`（W-7、W-9。保存の形＝書き出しの形＝seed の形）
   - 項目：formatVersion: 1、firstOpenDate、diagnosis（area、levels（領域ごと）、years、完了の印。途中の回答）、current（date、taskId、answer、状態）、history[]（date、taskId、area、level、mode、report、helpful、answer）、flags（homeGuideClosed、persistAnswered）。
   - 「保存データあり」の定義：診断を終えたか、履歴が 1 件以上。flags や firstOpenDate しかない場合は「なし」として扱う（AC-20、AC-22 の確認の有無が決まる）。
   - 日付が変わったら current を report: none の行として history に移す（AC-32、AC-6）。
   - 移行の決まり：今の版以下のファイルは移して読み、新しい版は拒む（AC-25）。
   - 読み込むファイルは 5 MB を超えたら読まずに schema のエラーにする。
3. `contracts/strings.md` と文言ファイルのスキーマ（W-14、AC-26）
   - 平らなキーの JSON（`settings.import` と `settings.import.note` が両方あるので、入れ子にはできない）。ja と en でキーの集合が同じ。
   - 差し込みの書き方は `{name}` と `{n, plural, one {…} other {…}}` の 2 つだけ。Intl.PluralRules と 30 行ほどの自作で足り、ライブラリは入れない。
4. `contracts/identifiers.md`（W-2、W-5、W-8、W-10、W-15）
   - ルート要素は `<html>`。静的な HTML の時点で `data-state="loading"` と `data-build-version` を持つ。
   - data-state の 12 の値、data-testid の全一覧（仕様の 6 と 7。143 キーは grep で重複 0 を確認した）、`data-task-*`、`data-stat-*` の値の形（日付は YYYY-MM-DD、真偽値は "true" / "false"）、`data-debug-load-ms`（task.today を描いた後の performance.now() を整数で）。
5. `contracts/test-hooks.md`（W-1〜W-16）
   - 保存のキーの名前は 1 つ（アプリ名の接頭辞を付ける。同じ origin で共有するため）。1 回の保存は 1 回の setItem。
   - setItem の失敗の注入、persist() の拒否の注入。
   - スタンドアロンの判定：`navigator.standalone === true` か display-mode: standalone。
   - iOS Safari の判定：UA が iPhone、iPad、iPod か、Macintosh で maxTouchPoints > 1。CriOS、FxiOS、EdgiOS を除く。アプリ内ブラウザの UA は未確認。
   - AC-31 の重なる要素の数え方（P3）。
   - 「送信」の数え方：fromServiceWorker の応答を除いた要求と requestfailed の合計（PRD :170）。
   - AC-15 の制限：遅延 150 ms、下り 1.6 Mbps、CPU 4 倍、Chromium の CDP で。
   - 時刻：context.clock と timezoneId Asia/Tokyo。日付は getFullYear などの端末の日付で作る（toISOString は UTC になるので使わない）。
   - 配布物の置き場所（案：backend/public/）。すべての URL を相対にする（本番は /engineer/ の下で動くため）。
   - テスト用の静的サーバーは GitHub Pages と同じヘッダーを返す（gzip と `Cache-Control: max-age=600`）。AC-28 は配布物のフォルダを差し替える。
   - serviceWorkers：既定は allow、配布物を差し替えるテストだけ block。
6. `contracts/service-worker.md`（W-13、AC-23、AC-28）
   - install で配布物の全ファイルを先に取っておく。取るときは `new Request(url, {cache: 'reload'})` を必ず使う。
   - cache-first で返し、URL の引数は無視する（ignoreSearch）。同じ origin の GET だけを扱い、実行中に足すキャッシュはない。
   - skipWaiting と clients.claim を入れる。
   - activate で消すのは自分の接頭辞のキャッシュだけ（origin を他のページと共有しているため）。
   - sw.js にビルドの版を埋め込み、リリースのたびにバイトを変える。新しい版の知らせは出さない。
   - 本番では Fastly が sw.js を最大 600 秒キャッシュするので、公開から最大 10 分は古い版のままになりうる。これは RUNBOOK に書く。
7. `contracts/budgets.md`
   - 配布物の全ファイルを gzip -9 で圧縮した合計が 150 KB 以下。node の組み込みだけで書いた検査で落とす。
   - CSP の文字列（案）：`default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'`
   - meta の CSP では frame-ancestors が効かない。style 属性も書けない（CSSOM で値を入れるのは可）。
   - modulepreload と preload を必ず置く（spike で約 330 ms 速くなった）。

### C. ADR に要る判断（どれも本当に選べた案が 2 つ以上ある）
- ADR 土台（Web）：ビルドなしで ES modules と modulepreload を使う。案は (a) ビルドなし（推奨）、(b) esbuild で 1 ファイルにまとめる、(c) Vite。
  - あわせて決めること：実行時の依存は 0、Node 24（.tool-versions）、単体テストは `node --test`、リリースのスクリプト（版の刻印、先に取っておく一覧、予算の検査）、配布物の置き場所。
  - 対応ブラウザ：Safari 17 以上と Chrome の最新 2 版。Playwright の WebKit は最新の WebKit のビルドで Safari 17 そのものではないので、使わない機能の一覧（import attributes、CSS の入れ子、Promise.withResolvers など）を契約に書き、G4 の実機で確かめる。
- ADR 保存：localStorage のキー 1 つで、版番号を付け、書き出しの形と同じにする。案は (a) localStorage の 1 キー、(b) IndexedDB、(c) 複数のキー。
  - U-5〜U-8 の決定と、ID を変えない決まりもここに書く。
- ADR Service Worker の更新：案は (a) cache-first、skipWaiting、cache:'reload'（推奨。spike で確認）、(b) HTML だけ network-first、(c) 「更新があります」の知らせ（PRD 10 で 002 以降に回した）。
- ADR 受け入れテストの構成：Playwright で Chromium と WebKit。設定は backend/tests/acceptance/ の中だけに置く。依存は backend/package.json と package-lock.json。GitHub Pages を真似た静的サーバー、axe-core、ajv（テストだけ）も決める。
- ADR CSP と信頼の境界
  - 新しい境界：読み込むファイル（信頼しない入力）と、origin の共有（Takuma の他の Pages のリポジトリから同じ localStorage と Cache Storage が見え、ルートのスコープの SW があれば /engineer/ の要求を横取りできる）。
  - 足りないところ：frame-ancestors がないので、フレームに入れられたら抜け出すコードを置くかどうか。
  - 設計メモに STRIDE の簡単な表を書く。

### D. contracts/dependencies.md に足すもの（すべて backend の devDependencies。本番の配布物には入れない）
| ライブラリ | 版 | ライセンス | 最後の更新 | 用途 |
|---|---|---|---|---|
| @playwright/test | 1.64.1 | Apache-2.0 | 2026-10-29 | 受け入れテスト（Chromium と WebKit） |
| @axe-core/playwright | 4.14.0 | MPL-2.0 | 2026-10-27 | AC-27 の監査（axe-core 4.14.0 を使う） |
| ajv | 8.20.0 | MIT | 2026-04-24 | テストの中だけで、課題集、書き出し、seed を JSON Schema で検査する |

- ajv は new Function を使うので、CSP の下のブラウザでは動きません。アプリの中の検査は手で書き、ajv と同じ結果になることを見本のファイルで確かめます。
- 実行時の依存は 0 件です。文言、日付、検査、SW はすべて標準の API で書きます。

### E. 指揮役と Takuma への質問
1. backend/package.json は私の書ける範囲の外です。ADR に書いたうえで backend-engineer に作ってもらう形でよいですか。それまで CLAUDE.md のテストのコマンドは「未確認」と書きます。app.json の commands は Q9(3) のとおり、その後に Takuma に頼みます。
2. HTTP の API がないので、spectral と oasdiff は使えません。設計メモには「未検査（OpenAPI なし）」と書きます。代わりに JSON Schema 自体の検査と、古い版の見本ファイルを読めるかのテストを置く形でよいか、関門の読み替えとして裁定してください（Q9(2) と同じ種類）。
3. GitHub Pages の「Enforce HTTPS」は Takuma がリポジトリの設定で入れる必要があります。`http://octocat.github.io/` は転送されずに 200 を返したので、既定で必ず転送されるとは限りません。PRD 12 の「301 で https に転送」はこの設定に頼っています。
4. PRD 15（:415）の「イベントはブラウザの中に記録するだけ」について。どの AC もイベントの記録を求めていないので、記録用の配列を保存せず、何もしない `track()` の入口 1 つ（将来 B を足す場所）だけにする案で進めてよいですか。pdm に確かめるかどうかの判断を求めます。
5. 課題集の長さの予算（252 件で 1 件平均 600 字以下、項目ごとの上限）を、pdm が下書きを始める前に伝えてください。

## 証拠
- 対象：feat/001-daily-learning の HEAD 0d83baf。design/001-daily-learning.md（414 行）、design/001-daily-learning/screens.md、design/tokens.md。調査（854cf47）が仕様（0d83baf）より先のコミットであることを `git log -- design/` で確かめた。

- 画面ごとに要るデータと操作（すべて端末の中で、ネットワークは使わない）
| 画面 | 読むもの | 書くもの | 作れるか |
|---|---|---|---|
| S0 | 保存の 1 キー、静的な HTML の data-build-version | なし（error から exportRaw と削除） | 作れる（P1、P2） |
| S1 | 保存データの有無、standalone、UA、flags | flags.homeGuideClosed | 作れる（AC-21、AC-22 は G0 の spike C で確認済み） |
| S2 | 診断の途中の回答 | 質問ごとの回答（初回）、メモリの下書き（やり直し） | 作れる（M2） |
| S3 | tasks.json、履歴、段階、current | current.answer（間をおいて保存）、申告、persist() | 作れる（M1） |
| S4/S5/S6 | current | helpful、report | 作れる |
| S7 | tasks.json と出した ID の集合 | なし | 作れる |
| S8 | 全データ | 書き出し（Blob）、読み込み（file.text と検査）、削除 | 作れる（CSP の下での Blob の書き出しは spike で確認） |
| S9 | 履歴から計算した 9 つの値 | なし | 作れる |
| S10 | 履歴 | なし | 作れる（details と summary） |
| ダイアログ | ファイルの要約 | 置き換え、削除 | 作れる（P3） |
- 標準から外れた独自の部品は 0 件です（仕様の 3 の表はすべて「なし」）。作り直しが要るアクセシビリティの範囲はありません。オフラインの表示は「通常と同じ」で、読み込み後はネットワークを使わない作りと合っています。

- 指示書で特に確かめるよう言われた項目
  - AC-31：作れる。ヘッダーは固定しない。案内は本文の一部。数え方は P3 と契約。
  - AC-21/22：作れる。iPad は maxTouchPoints で判定する。Playwright の iPad の UA は古い形なので、テストでは UA と maxTouchPoints の両方を偽装する。
  - AC-28：作れる。ただし cache:'reload' が必須（spike 2）。
  - AC-32：作れる（M1）。
  - AC-19/20：作れる（spike 2 で、CSP の下の Blob の書き出しを 2 つのブラウザで確認）。

- 読んだファイル：docs/prd/001-daily-learning.md（全 479 行）、design/001-daily-learning.md（全 414 行）、design/tokens.md、design/001-daily-learning/screens.md、design/001-daily-learning-research.md（1〜40 行）、docs/reviews/001-daily-learning-G0-tech-lead-r2.md、docs/reviews/001-daily-learning-G0-verifier-r3.md、docs/approvals/001-daily-learning-G0.md、docs/templates/review-report.md、docs/org/gates.md、.claude/org/app.json、CLAUDE.md、contracts/dependencies.md

- 実行したコマンドと結果（spike はすべてスクラッチパッド /private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/spike/ の中で行った。Playwright 1.64.1、node v24.22.1）
  - 識別子の照合（python3 -I）：仕様の 7 は 143 キーで重複 0。2 と 5 の識別子のうち 6 と 7 にないのは `answer.max`（契約の定数）だけ。
  - 文言ファイルの大きさ：ja は 143 キーで 10,419 → 3,369 B（gzip -9）、en は 8,666 → 2,921 B。
  - 課題集の大きさ（gen/gen.py。リポジトリの日本語の文を切り出して作った合成の課題集）：
    - 126 件 × 400 / 600 / 800 字 → 42,236 / 56,813 / 70,933 B
    - 252 件 × 400 / 600 / 800 字 → 74,039 / 106,113 / 143,593 B
    - 252 × 800 は文が足りず使い回したので、実際より小さく出ている。
  - spike 1、AC-15（t_load.mjs。gzip を返すサーバー、Chromium、CDP で遅延 150 ms・下り 1.6 Mbps・CPU 4 倍、seed あり、5 回）：
    - 126-600：preload あり 765,725,719,727,726 ms、なし 1041〜1058 ms。合計 73,347 B
    - 252-600：preload あり 970〜978 ms、なし 1299〜1317 ms。合計 123,123 B
    - 252-800：preload あり 1166〜1169 ms、なし 1489〜1509 ms。合計 161,038 B（150 KB を超える）
    - 殻（HTML、CSS、60 KB の JS、文言、SW）は約 15.8 KB。
    - 限界：localhost で TLS がなく、JS は代わりのファイル。目安の値として扱う。
  - spike 2、AC-28（t_upd.mjs。サーバーは `Cache-Control: max-age=600` と gzip。2 秒おきに再読み込み）：
    - chromium、cache:'reload' なし：v1/126 が 5 回続き、切り替わらない。
    - chromium、cache:'reload' あり：v1/126、v2/252、v2/252、v2/252、v2/252
    - webkit：どちらでも 2 回目から v2。
    - 履歴はどの場合も 3 件のまま。CSP の下での Blob の書き出しは true（2 つのブラウザ）。CSP の違反は 0。
  - spike 3（t_axe.mjs）：厳しい meta CSP の下でも @axe-core/playwright 4.14.0 は 2 つのブラウザで動いた（わざと置いた label のない textarea を `label:critical` として見つけた。CSP の違反は 0）。
  - `curl -sI --compressed https://pages.github.com/`、`https://octocat.github.io/` → `cache-control: max-age=600`、`content-encoding: gzip`（br は返さない）。
  - `curl -sI http://octocat.github.io/` → 200（転送されない）。`http://pages.github.com/` → 301 で https へ。
  - `https://matsuura-tak.github.io/engineer/` → 404（まだ公開していない）。
  - hstspreload の API：github.io は "unknown"。
  - `npm view`：@playwright/test 1.64.1、@axe-core/playwright 4.14.0、axe-core 4.14.0、ajv 8.20.0、esbuild 0.28.2。ライセンスと更新日は D の表のとおり。
  - `grep -n 'new Function' node_modules/axe-core/axe.js` → 4622、4637 行（ブラウザの中では CSP に止められうる書き方。spike 3 では、Playwright から差し込む形なら問題が出なかった）。
  - `git status --short` → .agents/、.codex/、AGENTS.md が未追跡（もとからあったもの。私は書いていない）。

- 開いた URL（2026-10-30）
  - https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency（Limited availability、Experimental。対応していないブラウザでは効かないだけの使い方にする）
  - https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist（Baseline Widely available、2021-12 から。安全な文脈が必要）
  - https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https（github.io は自動で HTTPS になる。転送は管理者が入れる「HTTPS enforcement」の設定）
  - https://playwright.dev/docs/browsers（WebKit は「derived from the latest WebKit main branch sources」）
  - https://hstspreload.org/api/v2/status?domain=github.io

- 未検証：なし（この判定の範囲で）。
  - 次の項目は、G0 の承認の記録（docs/approvals/001-daily-learning-G0.md「G4 で改めて頼む」）と PRD で G4 に回すと決まっているので、この判定の未検証には数えていません。
    - iOS の実機で、ホーム画面の Web アプリから Blob を書き出せるかと、file input で読み込めるか。
    - アプリ内ブラウザ（LINE など）の UA と保存の行き先。
    - persist() で 7 日の消去が免除されるか。
  - 指揮役が「これも G1 の未検証に数える」と判断する場合、型の決まりではこの判定は FAIL になります。
  - P1 の「どの設定で localStorage が例外になるか」は未確認ですが、P1 は提案で、合否には関係しません。
- 書いたファイル：リポジトリにはなし。コミットもしていない。spike はスクラッチパッドの中だけで行い、サーバーは各スクリプトの最後で止めた。

---

## 指揮役の裁定（2026-10-30）
- iOS 実機の3項目は G0 の承認で G4 に回すと決めているので、G1 の未検証には数えない。判定は PASS のまま。
- E1：backend/package.json は backend-engineer が作る（ADR に書く）。E2：OpenAPI がないので spectral と oasdiff は「未検査（OpenAPI なし）」とし、JSON Schema の検査と古い版の見本ファイルのテストで代える（関門の読み替え。/retro で提案）。E3、E4、P4 は Takuma に聞く。E5 は pdm の課題集の下書きの指示書に入れる。
