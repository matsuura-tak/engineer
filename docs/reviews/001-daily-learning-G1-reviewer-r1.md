# 判定の報告：001-daily-learning G1 reviewer（設計）r1

- 関門：G1
- 判定した役：reviewer（設計）
- 回：r1
- 対象：592777f...072d0e3（feat/001-daily-learning）。docs/adr/features/001-daily-learning.md、docs/adr/0001〜0005、contracts/（55 ファイル）
- 日付：2026-10-30
- 保存した役：指揮役（報告の文章はそのまま）

---

PASS

## 指摘
重大：なし。要修正 1 件、提案 6 件。

- 要修正 M1、docs/adr/0002-storage-localstorage-single-key.md:47「起動時に setItem を呼ばない」、contracts/test-hooks.md:58「起動時には setItem を呼ばない（data.md の 2…）」、docs/adr/features/001-daily-learning.md:27（AC-11 の行「起動時に setItem しない」）
  - 問題：contracts/data.md:13 は「起動の途中で保存するのは、4 の (5) で日付が変わった課題を移すときと、今日の課題を出すときだけ」と、起動時の保存を 2 つ認めている。data.md:48〜51（`none` の行への移し替えと `current` の保存）は AC-6、AC-32 に要る動きなので data.md が正しく、ADR 0002 と W-9 の文がそれと矛盾する。backend-engineer が ADR の文を文字どおり守ると、起動時に出した `current` と `none` の行が保存されず、AC-32 の「前日の 200 文字は書き出しファイルの `none` の行に残る」が崩れうる。AC-11 のテスト自体（保存データなし → 診断の途中なので起動時の保存は起きない）は影響を受けないため重大にしない。
  - 根拠：PRD AC-32（:371「申告のないまま日付が変わった課題は `report` が none の行として残る」）、contracts/data.md:13、:48〜51。
  - 直す方向：ADR 0002:47 と test-hooks.md:58 を「保存データが『なし』か『診断の途中』の起動では setItem を呼ばない（AC-11 の注入はこの状態で行う）。『あり』の起動では data.md の 2 のとおり最大 1 回」に直す。設計メモ :27 も同じ文に。
- 提案 P1、contracts/schemas/data.schema.json:398（`$defs/date` の pattern）：`2026-02-30` のような暦にない日付が通る（自分で ajv に通して true）。アプリの手書きの検査も同じ基準で足りるが、読み込むファイルの日付を `new Date()` で比べる処理があれば注意。直すなら data.md の 6 に「日付の実在は検査しない（文字列として比べる）」と 1 行書けば足りる。
- 提案 P2、contracts/data.md:62〜66（段階の規則）：「`none` の行を数えない」と「段階が変わった行で止める」は PRD :162「同じ種類の申告が、申告の履歴の新しい方から 2 件並ぶこと。間に『完了』か『今日はできない』が入れば途切れる」と矛盾しない（`none` は申告ではない。自分でこの規則を実装して AC-8 の 7 通りと `none` を挟む 1 通り、段階が変わった直後の 1 通りを通した：証拠）。ただし「やり直しの診断で段階を変えた直後は、前の段階の申告を持ち越さない」は PRD にない解釈なので、pdm に 1 行で確認して PRD 11 に足すとよい。
- 提案 P3、contracts/service-worker.md:8：`trusted-types kyounoitte-sw` には `'allow-duplicates'` がないので、同じ名前のポリシーを 2 回作ると TypeError になる。「ポリシーは起動ごとに 1 回だけ作り、モジュールのトップレベルに持つ」と 1 行足すと、作り手が register の呼び出しごとに作る誤りを防げる。
- 提案 P4、contracts/budgets.md:16：文言の gzip の値は自分で `zlib.gzipSync(level 9)` で測ると 3,501 + 2,969 = 6,470 バイト（tech-lead の 6,440 との差は圧縮の実装の差で、8,000 の枠には収まる）。数字を「約 6,500」にするか測り方（CLI か zlib か）を書く。
- 提案 P5、docs/adr/0004-acceptance-test-setup.md:44 と contracts/test-hooks.md:32：`serviceWorkers: 'block'` を「コンテキストの」設定と書いているが、Playwright の文書は testOptions（use）として説明している（下の引用）。どちらでも動くが、verifier が迷わないよう「use か newContext のどちらでも渡せる」と書く。
- 提案 P6、design/001-daily-learning.md:152 は要る道具を「`<dl>` の `<dd>` に `<ul>`」、contracts/identifiers.md:49〜50 は「`<dl>` と `<li>`」。両立するが、identifiers.md に「`<dd>` の中の `<ul>` の `<li>`」と書くと一致が読める。

## 証拠
- 対象：592777f...072d0e3（feat/001-daily-learning）、観点：設計（G1。契約と ADR）。`git log --oneline 592777f..072d0e3` は 072d0e3 の 1 コミットだけ。`git diff --name-only` の 55 件（すべて新規か全面の書き換え。`git blame` は全行 072d0e3）に読んだ印：
  - [x] .gitignore　[x] .tool-versions　[x] CLAUDE.md
  - [x] contracts/README.md　[x] budgets.md　[x] data.md　[x] dependencies.md　[x] identifiers.md　[x] service-worker.md　[x] strings.md　[x] test-hooks.md
  - [x] contracts/schemas/data.schema.json　[x] strings.schema.json　[x] tasks.schema.json　[x] contracts/tools/check-schemas.mjs
  - [x] contracts/fixtures/data/invalid-*.json（11 件）　[x] data/v1/valid-*.json（4 件）　[x] seeds/*.json（3 件）　[x] strings/*.json（7 件。invalid の 5 件は valid-ja との diff で壊した箇所を確認）　[x] tasks/*.json（9 件）
  - [x] docs/adr/0001　[x] 0002　[x] 0003　[x] 0004　[x] 0005　[x] docs/adr/features/001-daily-learning.md
  - .claude/ と .github/ の変更：なし（`git diff --name-only 592777f...072d0e3 -- .claude .github` が空）。差分の中にエージェント向けの指示のような文：なし（grep 0 件）。秘密情報：なし（craft-reviewer の grep 0 件）。
- 観点の表 1：AC 対応表（PRD r5 の 32 件。`grep -cE '^- AC-[0-9]+：'` → 32、設計メモ 2 の行 → 32。operationId は全行「なし（端末のみ）」）

| AC | 満たす契約の項目（自分で辿った） | 結果 |
|---|---|---|
| AC-1 | identifiers.md 4（`data-question-index`/`-total`）、design 2 の表 | 満たせる |
| AC-2 | data.md 5（組 `a`、`L`。`levels[a]` がなければ `diagnosis.level`）、identifiers.md 5 の ID | 満たせる |
| AC-3 | tasks.schema.json（4 要素 `minLength 1`＋`\S`、`minutes` 1〜15）。invalid-blank-goal、invalid-minutes-16 が落ちることを実行で確認 | 満たせる |
| AC-4 | test-hooks W-6（件数、組ごと、重複はテストのコードで数える。スキーマでは書けないことを自分で確認：重複 ID は true） | 満たせる |
| AC-5 | data.md 2（申告で `current` を外し `history` に行）、4 の 6-2（今日の行が `done` → S5） | 満たせる |
| AC-6 | data.md 5（候補は `history` と `current` にない ID）、W-3（`setFixedTime`、Asia/Tokyo） | 満たせる |
| AC-7 | schema の `report` enum、identifiers.md 4 の `data-report` | 満たせる |
| AC-8 | data.md 5 の規則を自分で実装し 7 通り＋2 通りを通した（下の出力。NG 0）。seed-ac8 は規則どおり | 満たせる |
| AC-9 | schema の `helpful`（`done` の行だけ。else で禁止。invalid-helpful-on-skipped が落ちる）、`data-helpful` | 満たせる |
| AC-10 | data.md 4 の 6-4（選べなければ S7、保存しない）、2（やり直しは今日出していなければ `current`） | 満たせる |
| AC-11 | data.md 2（1 回の保存＝1 回の setItem）、W-9。保存データなしの起動では setItem が起きない | 満たせる（M1 の文の矛盾は残る） |
| AC-12 | W-12（`fromServiceWorker` を除く＋`requestfailed`）、CSP `connect-src 'self'` | 満たせる |
| AC-13 | schema `device.persistRequested/Granted`、W-9 の `StorageManager.prototype.persist`、design S8 の `settings.storage.notPersisted` | 満たせる |
| AC-14 | data.md 2（やり直しは終えるときに 1 回。今日出していなければ `current`）、seed-ac14（11-03 まで、`current` なし） | 満たせる |
| AC-15 | W-11（遅延 150、下り 200,000 B/s、CPU 4 倍）、identifiers.md 1 の `data-debug-load-ms`、budgets.md 4 | 満たせる |
| AC-16 | data.md 7（`removeItem` だけ）、W-7 の印は残る | 満たせる |
| AC-17 | strings.md 5（`<pre>` なし、`<code>` は折り返す）、tasks.schema の ``` 禁止（invalid-code-fence が落ちる） | 満たせる |
| AC-18 | identifiers.md 3（操作する要素はすべて `data-testid`） | 満たせる |
| AC-19 | data.md 7（`device` を除いて書き出し）、schema の `history[].answer`、`firstOpenDate`、`formatVersion` | 満たせる |
| AC-20 | data.md 7 の読み込み 1〜5、W-3「AC-19 と AC-20 は同じ固定の日付」 | 満たせる |
| AC-21 | W-16（UA と `maxTouchPoints`）、`device.homeGuideClosed`、design S8 `settings.homeScreen.open` | 満たせる |
| AC-22 | W-16（`navigator.standalone`）、data.md 3「なし」の間は毎回 | 満たせる |
| AC-23 | service-worker.md 3（install で全ファイル）、5（navigate は index.html、ignoreSearch）、W-13 | 満たせる |
| AC-24 | data.md 9 の 9 値、identifiers.md 4 の `data-stat-*`（9 個）、seed-ac24（11-06 の行あり） | 満たせる |
| AC-25 | data.md 6（版を先に見る）、invalid-newer-version（`formatVersion: 2`）が落ちる | 満たせる |
| AC-26 | strings.schema.json の required 145＝properties 145、design 7 の 145 キーと差 0、identifiers.md 6 と差 0。W-14 | 満たせる |
| AC-27 | dependencies.md の @axe-core/playwright 4.14.0。CSP の下で動くことを自分で再現（下） | 満たせる |
| AC-28 | service-worker.md 2〜6、test-hooks「AC-28 の配布物の差し替え」、`build({ out, version, tasks })` | 満たせる |
| AC-29 | tasks.schema（`mode`、external は `tools` 1 件以上、in_app は 0 件と `https?://` 禁止。invalid-external-no-tools、-in-app-tools、-in-app-url、-unknown-mode が落ちる）、W-6 の 20% | 満たせる |
| AC-30 | identifiers.md 4 の `data-task-mode`、3（`in_app` では `task.external.badge` を DOM に置かない） | 満たせる |
| AC-31 | test-hooks「AC-31 の重なる要素の数え方」、identifiers.md 3（閉じたダイアログは DOM にない） | 満たせる |
| AC-32 | data.md 2（300 ms、`pagehide`、`visibilitychange`）、4 の 6-1（`none` の行へ） | 満たせる |

- 観点の表 2：エンドポイントの表の読み替え（HTTP の API はない。指揮役の裁定）。信頼の境界を越えるデータごとの検証と認可：

| 境界を越えるもの | 向き | 検証 | 認可の読み替え | 契約の場所 |
|---|---|---|---|---|
| 読み込むファイル（JSON） | 端末 → アプリ | 5,000,000 バイト上限 → JSON.parse → 版 → スキーマ全体（部分は読まない）。textContent でだけ表示 | 本人の操作（file input）だけ。URL の引数や `window.__test` はない | data.md 7、ADR 0005、test-hooks 末尾の grep |
| 課題集 tasks.json、文言 ja/en.json | 配布物 → アプリ | スキーマ（ajv は本番に入れず、手書きの検査を fixtures で突き合わせ）。textContent | 同じ origin の GET のみ（CSP `connect-src 'self'`） | tasks.schema、strings.schema、data.md 6 |
| localStorage `kyounoitte:data` | 同じ origin の他の Pages ↔ アプリ | 読むたびに全体をスキーマで検査 | 技術では防げない（受け入れ。RUNBOOK の決まり、見直す条件） | ADR 0005、設計メモ 7 の S/T/I |
| Cache Storage `kyounoitte-<版>` | 同じ origin の他の Pages ↔ SW | なし（受け入れ） | 自分の接頭辞だけに触る | service-worker.md 2、4 |
| 配布物の GET | GitHub Pages → ブラウザ | HTTPS（Enforce HTTPS は Takuma の設定待ち E3） | — | ADR 0005 |

- STRIDE：設計メモ 7 は 6 行（grep 6）。origin の共有（S、I）と読み込むファイル（T、D、E）の両方を扱い、受け入れた危険（S、R、I の一部）に理由がある。
- 非機能（設計メモ 6）：11 行すべてに数字と測り方がある。150,000 の内訳 26,000＋8,000＋10,000＋106,000＝150,000（自分で足した）。課題集 106,000 と平均 600 字は PRD 12（150 KB）と budgets.md 2 で一致。
- PRD 15 のイベント：13 件（grep 13）すべてに「送らない」と使う所がある。
- 元に戻しにくい判断 3 つへの、いちばん強い反論と ADR の答え：
  1. 厳しい保存スキーマと formatVersion（ADR 0002）：反論は「項目を 1 つ足すだけでも版を上げる必要があり、古いタブ（skipWaiting で混ざる）や未更新のブラウザは新しいデータを『読めない』として止まる。S0 error には『削除』があるので、利用者が新しいデータを消してしまう道がある」。ADR 0002 の (d) と「黙って消えるより止まる方が直せる」が答え。削除は確認ダイアログ経由で `exportRaw` が先にある（design S0）。AC-25 との両立：v1 は最初の版なので「今の版以下は移して読む」の実例はまだないが、fixtures/data/v1 を消さない決まりと単体テストの約束（data.md 6、ADR 0001）があり、矛盾はない。移行（1 版ずつ）と撤回（IndexedDB へ 3〜5 日）の手順あり。
  2. 段階の規則の解釈（data.md 5）：反論は「PRD は『none を数えない』『段階が変わったら数え直す』を書いていない。やり直しの診断で段階を変えた直後は、前の段階の申告が捨てられる」。自分の実装で PRD の 7 通りが全部一致し、`none` は PRD :162 の「申告」に当たらないので矛盾しない。残る解釈は P2 として pdm に確認を勧める。
  3. CSP に Trusted Types（ADR 0005）：反論は「主な利用者（iOS Safari 17〜25）には効かず、守りはテストの Chromium と WebKit の中だけ。SW の登録にポリシーが要り、ポリシー名の重複で例外になる道もある」。ADR の答えは「機械で止める方を選ぶ」「meta 1 行で戻せる」「Safari 26 未満が 10% を下回ったら見直す」。主張された spike を自分で再現した（下）。重複ポリシーは P3。
- 依存：3 件とも contracts/dependencies.md にあり、devDependencies・版固定・本番に入らない。`npm view` で実在、版、ライセンス、公開日を確認（@playwright/test 1.64.1 Apache-2.0 2026-10-14、@axe-core/playwright 4.14.0 MPL-2.0 2026-10-15、ajv 8.20.0 MIT 2026-04-24。表と一致）。`npm install` 2 回とも `found 0 vulnerabilities`。
- 「確かめ（A）」9 項目と「確かめ（B）」各 3 項目：すべて自分で確かめた。A-1（32 行、空欄なし）、A-2（図は要素 10、矢印 10。すべてに技術と責任、用途と方式）、A-3（各スキーマに valid と invalid の見本、description に AC 番号、エラーは文言の表）、A-4（未検査の理由と check-schemas の出力。再現一致）、A-5（4 エンティティに 4 列）、A-6、A-7、A-8、A-9（dependencies.md 10 列すべて埋まる）。B は 5 つの ADR とも案が 4〜5 個で全部に悪い点、反論・結果・見直す条件あり、確かめたことに URL とコマンドの結果あり。
- 実行したコマンドと結果（スクラッチパッド /private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/。リポジトリには node_modules もファイルも作っていない。`git status --short` は元からあった .agents/、.codex/、AGENTS.md だけ）
  - `npm install --save-exact ajv@8.20.0`（node v24.22.1）→ `ajv@8.20.0`、`found 0 vulnerabilities`。`node /Users/takumamatsuura/src/engineer/contracts/tools/check-schemas.mjs` → 設計メモ 4 に貼られた 41 行と 1 字違わず一致、`見本 34 件、期待と違う結果 0 件`、`exit=0`。
  - 壊した検査（break-test.mjs）：`$defs.date.type` を `strin` → `validateSchema = false（must be equal to one of the allowed values）`。未知のキーワード `minItemz` → `strict mode: unknown keyword: "minItemz"` の例外。`history[0].foo` を足す → false（additional properties）。`none` の行に `helpful` → false。`current.area` backend に `git-…` の ID → false。`completedOn` ありで `levels {}` → false。`formatVersion 0` → false。`firstOpenDate 2026-02-30` → true（P1）。tasks の title に改行 → false。external に https → true（正しい）。重複 ID → true（W-6 で数える、正しい）。strings の required 145＝properties 145、重複 0。
  - AC-8 の規則の再実装（ac8.mjs）：PRD の 7 通り＋「中, too_hard, none, too_hard → 初」＋「初（中から下がった直後）… → 初」＋「fixture seed-ac8 + too_hard → 初」の 11 件すべて OK、`NG 0`。
  - Playwright の spike の再現（pw-spike、@playwright/test 1.64.1、@axe-core/playwright 4.14.0、chromium-1248、webkit-2370。budgets.md 3 の CSP を meta に置いた静的ページを 127.0.0.1 の `/engineer/` で配る）：`npx playwright test -c tests` → `[chromium] innerHTML=blocked:TypeError register(string)=blocked:TypeError register(policy)=ok axe=["label:critical"]`、`[webkit]` も同じ、`2 passed (2.7s)`。service-worker.md:9 と ADR 0005:46〜48 の主張と一致。
  - 文言の gzip（zlib level 9）：ja 3,501、en 2,969（P4）。
  - 設計メモ、PRD、契約の突き合わせ：`comm -3` で design 7 の 145 キー、strings.schema の required、identifiers.md 6 の差はすべて空。差し込みのあるキー 10 個は design 7、strings.md 3、strings.schema で同じ集合。test-hooks の `## W-1`〜`## W-16` が 16 個。verifier r3 の W-2 の名前のうち `home.standalone.importAction`、`home.standalone.start`、`settings.home.reopen` は design で `home.standalone.importButton`、`diagnosis.start.begin`、`settings.homeScreen.open` に改名されて identifiers.md にある（抜けなし）。
- 開いた URL（2026-10-30）
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/require-trusted-types-for：「Disallows using strings with DOM XSS injection sink functions, and requires matching types created by Trusted Type policies」「el.innerHTML = attackerInput; // Rejects a string value; throws a TypeError」
  - https://bcd.developer.mozilla.org/bcd/api/v0/current/http.headers.Content-Security-Policy.require-trusted-types-for.json：chrome `"version_added":"83"`、safari `"26"`、safari_ios `"26"`（ADR 0005:49、budgets.md:35 の値と一致）
  - https://bcd.developer.mozilla.org/bcd/api/v0/current/html.elements.link.rel.modulepreload.json：safari `"17"`、safari_ios `"17"`、chrome `"66"`（ADR 0001:66 と一致）
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors：「This directive is not supported in the `<meta>` element」（ADR 0005:12 のとおり）
  - https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https：「People with admin permissions for a repository can enforce HTTPS for a GitHub Pages site」「transparently redirect all HTTP requests to HTTPS」（E3 が Takuma の設定であることの裏付け）
  - https://playwright.dev/docs/service-workers：「response.fromServiceWorker() return true when the request was handled a Service Worker's fetch handler」「To disable service workers, set testOptions.serviceWorkers to 'block'」（W-12、W-13 の根拠。P5）
- 未検証：なし（この判定の範囲で）。指揮役の裁定により数えないもの：backend/ がないので CLAUDE.md のコマンド（`npm test`、build.mjs、check-budget.mjs）は「未確認」の印付きのまま、iOS 実機の 3 項目は G4、Takuma の決定待ち 7 件（E3、E4、P4、D1〜D4）は推奨どおりの前提。AC-15 の時間と AC-28 の切り替えの spike は再現していない（ADR の数字は tech-lead の記録。G3 で verifier が本物の配布物で測る）。
