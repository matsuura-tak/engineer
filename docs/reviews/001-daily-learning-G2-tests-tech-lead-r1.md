# 判定の報告：001-daily-learning G2（受け入れテスト）tech-lead r1

- 関門：G2（verifier の変更：受け入れテストとテスト計画）
- 判定した役：tech-lead
- 回：r1
- 対象：dcc3589...a6facf4（feat/001-daily-learning、HEAD a6facf4）。backend/tests/acceptance/、docs/verification/001-daily-learning/
- 日付：2026-10-31
- 保存した役：指揮役（報告の文章はそのまま）

---

FAIL

1件の重大で FAIL です。AC-18 のテストは、macOS 上の Playwright WebKit ではどんな正しい実装でも通りません。spike で確かめました。そのほかは契約によく合っていて、識別子とつなぎ口の名前の食い違いは 0 件です。

## 指摘

**重大**

- `backend/tests/acceptance/tests/ac17-ac18-ac27-a11y.spec.mjs:103-155`、`helpers/app.mjs:186-195`（tabTo）
  - 何が問題か：macOS の Playwright WebKit 27.2 では、ふつうの `Tab` がボタン、radio、リンクに止まりません。そのため `tabTo('diagnosis.start.begin')` は 40 回押しても届かず、実装と関係なく必ず落ちます。
    - spike（スクラッチパッドの tab.mjs）で、`Tab` を 6 回押したときのフォーカスの順は次のとおりでした。
      - chromium：`link > r1 > btn > ta > BODY > link`
      - webkit：`ta > BODY > ta > BODY …`
    - `Alt+Tab` にすると、WebKit も `link > r1 > btn > ta` を回りました。これは Safari の既定（Option+Tab ですべての項目に移る）と同じふるまいです。
  - 根拠：PRD AC-18（Chromium と WebKit の両方で通す前提）、G3「全 AC が PASS」。
  - 直す方向：
    - verifier：tabTo の移動キーを、WebKit なら `Alt+Tab` と `Alt+Shift+Tab`、それ以外なら `Tab` と `Shift+Tab` にする。
    - tech-lead：test-hooks.md に「キーボードの移動キー」の項を足す。
    - Linux の WebKit（CI）で `Tab` と `Alt+Tab` がどう動くかは未確認です。最初の CI で、両方の出力を残してください。

**要修正**

- `tests/ac12-ac23-offline.spec.mjs:11-17`、`:43-48`（AC-12）
  - 何が問題か：`diagnosis.start` が出た直後にオフラインにしています。アプリは load の後に SW を登録するので、`sw.js` の取得と競り合います。
    - spike（スクラッチパッドの offline.mjs）で、load の 50 ms 後に register し、すぐオフラインにしました。
    - 結果は chromium が送信 0 件、webkit が `failed http://127.0.0.1:…/engineer/sw.js` の 1 件でした。WebKit では、W-12 の数え方で 1 件として数えられます。
    - つまり、正しい実装でも WebKit で揺れて落ちます。
  - 直す方向：
    - verifier：オフラインにする前に `waitServiceWorkerReady`（W-13）を待つ。PRD の「読み込み終えた後に」の読み方とも合います。
    - tech-lead：test-hooks.md の W-13 の見出し（:80）の対象に AC-12 を足す。

- `tests/ac10-ac30-exhausted-external.spec.mjs:34-39`（AC-30 の external）
  - 何が問題か：中身のない配布物（`data/tasks.json` が `{"tasks":[]}`）に対して、このテストは通りました。stub の実行で、chromium と webkit の両方とも、通ったのはこの 1 本だけです。「該当なし」の枝が、壊れた課題集や空の課題集でも緑になります。
  - 直す方向：「該当なし」で抜ける前に、次を確かめる。
    - tasks.schema.json に通ること
    - 件数が 126 以上で、18 組すべてが 7 件以上であること

- `docs/verification/001-daily-learning/evidence/red.log:6-7`、`test-plan.md:157`
  - 何が問題か：red.log の 131 本は、すべてフィクスチャの段階で落ちています。テストの本体は 1 行も動いていません。
    - 「スクラッチパッドの最小の HTML で確かめた」と書いてありますが、その出力がありません。
    - 私が同じやり方で動かした結果は次のとおりです。
      - chromium：65 failed / 1 passed
      - webkit：64 failed / 1 passed
      - 落ちた理由は、どれも「まだない」でした（`data-state` が loading のまま、件数 0、`build.mjs` の Cannot find module、i18n の必須キーがない）。通った 1 本は上の AC-30 です。
  - 直す方向：stub の配布物（`KYOUNOITTE_DIST`）での実行の出力を、両方のブラウザ分 evidence に足す。理由ごとの件数も付ける。

- `tests/ac01-ac02-diagnosis.spec.mjs:15-16`、`:43-45`（AC-1。未解決 (4)）
  - 何が問題か：PRD 12 は「500 ミリ秒 × 3 と AC-2 の 1 秒」を別々に数えています。3 回の 500 ms は「始める→1問目」「1→2」「2→3」と読むのが筋で、今のテストは「始める→1問目」を計っていません。
  - 直す方向：`diagnosis.start.begin` から `data-question-index=1` までを 500 ms 以下で計り、4 つの区間を記録する。3問目から課題までは今のまま 1,000 ms 以下（AC-2）。

**提案**

- `helpers/seed.mjs:45-64`（AC-11 の失敗の注入）
  - 契約 W-9 は「次の 1 回」と書いていますが、テストは「印を立てた後の次の 1 回」です。結果は同じで、より正確なので、契約の方をこの形に合わせます（tech-lead が test-hooks.md:58 を直す）。
- `tests/ac31-ac32-zero-ops-answer.spec.mjs:20`（未解決 (3)）
  - 題名の祖先を除くのは正しいです。祖先は子孫を覆えません。契約の方を直します（test-hooks.md:104 に「題名とその祖先は除く」を足す）。
- `tests/ac26-language.spec.mjs:7`
  - 比べるキーが 7 個に固定されています。画面にある `data-testid` のうち、文言キーで差し込みのないものをすべて en.json と比べる方が、取りこぼしがありません。
- `tests/ac11-ac13-storage.spec.mjs:44-45`
  - `persist` を包むときに呼ばれた回数を数え、1 回であることも確かめると、拒否の注入が実際に効いたことが分かります（W-9）。
- `tests/ac14-ac16-redo-delete.spec.mjs:14`
  - 完了 3 件が最初の 3 日に置かれています。PRD の「過去 3 日」に合わせるなら、最後の 3 行を done にします。
- `global-setup.mjs:22`、`helpers/paths.mjs:13`
  - backend/dist を上書きしています。ビルドの出力先を `mkdtemp` などの一時フォルダにすれば、受け入れテストのフォルダの外を書き換えずに済みます。
- `tests/ac28-update.spec.mjs:18`
  - 一時フォルダを消していません。`finally` で消します。
- `tests/ac03-ac04-ac29-tasks-json.spec.mjs:47`
  - budgets.md 2 の予算を `AC4_` の名前で置いています。G3 の AC の表に混ざらないように、`BUDGET2_` のような名前にします。
- `server/static-server.mjs:15`
  - `.js` に `; charset=utf-8` が付いています。契約は `text/javascript` で、MIME の本体は合っているので害はありません。GitHub Pages の実際の値は未確認です（G4 の curl で確かめる）。

## 未解決 (1)〜(5) への答え（案）

### (1) 依存の置き場所：B に決めます（tests/acceptance に置いたまま）

理由は 4 つです。
- 「受け入れテストのフォルダの中の設定だけで動く」を、設定だけでなく依存と lock まで満たせます。
- verifier が自分の道具の版を持てます。backend-engineer の変更で Playwright の版がずれません。
- backend/ がまだない今でも、赤を動かせました。
- backend 自身に要るのは ajv だけです（check:contracts と単体テスト）。

2 つのコピーができる問題は、backend/package.json に @playwright/test と @axe-core/playwright を入れなければ起きません。

動作の確認：
- `cd backend && npx --no-install playwright test -c tests/acceptance` は、今のままでは `npx canceled due to missing packages` で動きませんでした。
- `npm --prefix tests/acceptance test -- --list` と `node tests/acceptance/node_modules/.bin/playwright test -c tests/acceptance --list` は、どちらも 131 本と出ました。

次に直すファイル（tech-lead）：
- **ADR 0004:14**：コマンドを `cd backend/tests/acceptance && npm ci && npx playwright test` にし、依存の置き場所の決定を足す。
- **ADR 0001:26 と :34**：backend の devDependencies は ajv だけにする。`"test:acceptance": "npm --prefix tests/acceptance ci && npm --prefix tests/acceptance test"` にする。
- **contracts/dependencies.md:9**：表に「どの package.json に入るか」の列を足す。@playwright/test と @axe-core/playwright は backend/tests/acceptance/package.json、ajv は両方。
- **contracts/test-hooks.md:7**：実行のコマンドを同じに直す。
- **CLAUDE.md**：
  - 受け入れテストのコマンド：`cd backend/tests/acceptance && npm ci && npx playwright install chromium webkit && npx playwright test`。`--list` までは確かめました。
  - バックエンドのテスト：`cd backend && npm ci && npm test`。backend/package.json がまだないので未確認です。
- **app.json の backend_test の案**（Takuma に依頼）：`cd backend && npm ci && npm test`。

### (2) AC-14：pdm への問いと、契約の直し

pdm への問い：
- AC-14 の Given「今日の課題はまだ出していない」と、設定からのやり直しは、目標の組を出し終えた日（task.exhausted）にしか同時に起きません。PRD 11 の冒頭に「翌日の最初の読み込みで task.today」とあり、data.md 4 の 6-4 も同じだからです。
- そこで、Given を次のように直してよいかを聞きます：「…今日の課題はまだ出していない（目標の領域と段階の課題を出し終えて task.exhausted にいる）」
- あわせて、「すでに課題を出した日にやり直すと、新しい診断は翌日から効く」（11 の冒頭）を確かめる AC が今はありません。AC-14 に 2 通り目として足すかも聞きます。

契約の直し（tech-lead）：
- test-hooks.md W-7 に 1 行足す：「AC-14 の seed は、AC-10 と同じく本番の課題集から作る、出し終えた履歴（完了 3 件を含む）にする。fixtures/seeds/seed-ac14-three-completed.json は開くと今日の課題が出るので、AC-14 の Given を満たさない（名前は残し、AC-5 などの見本にする）」
- 設計メモ docs/adr/features/001-daily-learning.md:30 の AC-14 の行も同じに直す。
- 見本は課題集の中身に依存するので、固定の seed は置きません。

### (3) AC-31 の祖先の除外

上の提案のとおり、テストの方が正しいので、契約を直します。

### (4) AC-1 の 3 回目

上の要修正のとおりです。「始める→1問目」を 500 ms で足し、3問目から課題までは 1,000 ms（AC-2）のままにします。PRD の AC-1 の「3 回とも」の書き方は、次の版で pdm に直してもらう問いにします。

### (5) その他

- 予算のテストの名前：提案のとおり `BUDGET2_` などにします。
- AC-30 の「該当なし」：PRD が認めているので、それ自体はよいです。ただし上の要修正の守りを足し、G3 の報告では PASS ではなく「該当なし」と書きます。
- manifest と icon を探索 R4 で見ること：budgets.md 6 のとおり、verifier の判断でよいです。
- global-setup が backend/dist を上書きすること：提案のとおり一時フォルダにします。
- AC-28 が build.mjs の `--tasks` に依存すること：契約（test-hooks.md「ビルドの手順の約束」）どおりです。global-setup と helpers/build.mjs の呼び出しは `node scripts/build.mjs --out --version [--tasks]` と一致しているので、直すものはありません。
- tech-lead 側の小さな食い違い：ADR 0001:31 の `--version dev` は、identifiers.md の `YYYY-MM-DD.N` の形に合いません。次の直しで決めます。

## 証拠

**対象**：`git diff dcc3589...a6facf4`（41 ファイル。backend/tests/acceptance/ の全ファイルと test-plan.md、red.log をすべて読んだ）。判定の途中で HEAD が 77a29de に進みましたが、reviewer の報告 1 件が足されただけで、テストの変更はありません。

**観点の表**（AC、テスト、つなぎ口、確かめている結果）：

| AC | テスト | つなぎ口 | 確かめている結果 |
|---|---|---|---|
| 1、2 | ac01 | W-2、W-3 | n/3 の文字、3問で終わる、時間、領域と段階が一致（3 通り） |
| 3、4、29 | ac03 | W-6 | スキーマ、件数、組ごとの件数、ID の重複、external の割合、予算 |
| 5、6、7、9 | ac05 | W-7、W-8 | 状態、再読み込みしても変わらない、履歴の data-report と data-helpful |
| 8 | ac08（10 本） | W-7、W-5 | 翌日の data-task-level（9 通り） |
| 10、30 | ac10 | W-4、W-7 | exhausted、文言、やり直しても exhausted、external の印と道具（守りの欠け：要修正） |
| 11、13 | ac11 | W-9 | 質問の番号、選択が残る、やり直し後の課題、notPersisted |
| 12、23 | ac12 | W-12、W-13 | 送信の件数、3 秒以内、同じ ID（AC-12 の競り合い：要修正） |
| 14、16 | ac14 | W-7 | 新しい領域、done が 3 件、削除後は 0 件 |
| 15 | ac15 | W-11 の CDP の値が一字一句一致 | 5 回の data-debug-load-ms |
| 17、18、27 | ac17 | — | scrollWidth、押せるか、focus-visible と枠の幅（WebKit の Tab：重大）、axe |
| 19、20、25 | ac19 | W-9 | 書き出しの中身をスキーマと値で、読み込み後に書き出して同じ |
| 21、22 | ac21 | W-16 | 案内の有無と閉じた後、読み込み後の状態 |
| 24 | ac24 | W-15 | 9 個の data-stat-* と見える文字 |
| 26 | ac26 | W-14 | lang、文言 7 キー、キーの差 0 |
| 28 | ac28 | AC-28 の手順 | 版の推移、旧版に戻らない、書き出しが同じ |
| 31、32 | ac31 | AC-31 の数え方 | 重なる要素 0、答えの復元、none の行の answer |

- 32 個の AC 番号は、すべてテストの名前にあります。
- 識別子：テストが使う data-testid 87 個と data-* 22 種は、すべて identifiers.md にあります。`settings.stats.*.value` は契約では `.issued.value` のような省略形で書かれていますが、同じものです。
- `.exists`、`waitForTimeout`、`test.skip`、`.only`、`page.route`、`clock.install` は 0 件です。
- アプリのコードの import、`location.search`、`__test`、`public/` への参照も 0 件です。

**読んだファイル**：
- contracts/：test-hooks.md、identifiers.md、data.md、service-worker.md、budgets.md、strings.md、dependencies.md、fixtures/seeds、fixtures/data/v1
- PRD 11 と 12
- ADR 0001、0003、0004
- design/tokens.md（size.focus.width 3 px）
- .gitignore、.claude/org/app.json
- docs/templates/review-report.md、docs/org/gates.md

**実行したコマンドと結果**：
- `cd backend/tests/acceptance && npm ci` → found 0 vulnerabilities。`npm ls --depth=0` で @axe-core/playwright 4.14.0、@playwright/test 1.64.1、ajv 8.20.0。
- `npx playwright test --list` → 131 本（16 ファイル）。`--project=chromium` は 66 本（16 ファイル）、`--project=webkit` は 65 本（15 ファイル）。
- `node ../../../contracts/tools/check-schemas.mjs` → 見本 41 件、期待と違う結果 0 件。
- `npm run check:seeds` → seed 10 件、期待と違う結果 0 件。
- `cd backend && npx --no-install playwright test -c tests/acceptance --list` → `npx canceled due to missing packages`。
- `npm --prefix tests/acceptance test -- --list` と `node tests/acceptance/node_modules/.bin/playwright test -c tests/acceptance --list` → どちらも 131 本。
- `KYOUNOITTE_DIST=<scratchpad>/stubdist npx playwright test --project=chromium|webkit` → chromium 65 failed / 1 passed、webkit 64 failed / 1 passed。通ったのは AC30 の external の 1 本。出力は `/private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/stub-chromium.log` と `/private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/stub-webkit.log`。
- spike の tab.mjs と tab2.mjs、offline.mjs（`/private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/spike/`）→ 結果は上の重大と要修正に書いたとおり。
- 静的サーバーを直接たたいた結果：
  - `/engineer` は 301 で `Location: /engineer/`
  - gzip を受け付けると `Content-Encoding: gzip` と `Cache-Control: max-age=600`
  - `.json` は `application/json`
  - ないファイルは 404

**開いた URL**：なし。

**未検証**：
- Linux の WebKit での Tab と Alt+Tab のふるまい
- 依存が 2 か所にあるときの「2 つのコピー」のエラー。verifier の報告のままで、私は再現していません。B なら起きません。
- GitHub Pages が `.js` に返す Content-Type
- Safari の Option+Tab についての Apple の公式文書（開いていません）

**ファイルへの影響**：リポジトリの追跡しているファイルは変えていません。npm ci と stub の実行で、backend/tests/acceptance/ の node_modules/、test-results/、playwright-report/ を作り、上書きしました。どれも .gitignore 済みで、verifier の赤の実行の test-results は上書きされています。
