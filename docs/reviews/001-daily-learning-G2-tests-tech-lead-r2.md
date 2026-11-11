# 判定の報告：001-daily-learning G2（受け入れテスト）tech-lead r2

- 関門：G2（verifier の変更：受け入れテストとテスト計画）
- 判定した役：tech-lead
- 回：r2
- 対象：f339a95...b2bffba（feat/001-daily-learning、HEAD b2bffba）。backend/tests/acceptance/、docs/verification/001-daily-learning/
- 日付：2026-10-31
- 保存した役：指揮役（報告の文章はそのまま）

---

PASS

前回の指摘（tech-lead r1 の重大 1、要修正 4、提案 9 と、reviewer r1 の要修正 1、提案 6）はすべて直っていました。自分で作った stub でも確かめています。AC-18 は WebKit でも Alt+Tab で最後まで進み、Chromium と WebKit の両方で通りました。重大はありません。

新しい要修正が 1 件あります。時間を計るテストで、Playwright の待ち方が原因で、計った値が実際より最大で約 500 ms 長くなります。間違って通すことはありません。ただ、切り替えが 270 ms を超える実装だと、正しくても落ちることがあります。r1 からある問題で、r1 の私の判定では見落としていました。

## 指摘

**重大**：なし

**要修正**

- 対象の行
  - `backend/tests/acceptance/helpers/app.mjs:54-85`（diagnose）
  - `tests/ac01-ac02-diagnosis.spec.mjs:23-51`、`:66-69`
  - `tests/ac12-ac23-offline.spec.mjs:23-28`、`:78-100`（3 秒の再読み込み）
- 何が問題か：時間の終わりを `expect(...).toHaveAttribute` で待っているので、値が Playwright の確かめる間隔の分だけ長くなります。
  - 確かめる間隔は 0、20、50、100、100、500 ms（node_modules/playwright-core/lib/coreBundle.js:25280 の `backoffScale = [20, 50, 100, 100, 500]`）です。500 は、timeout ÷ 5 より大きいときだけ外れます。
  - 今は timeout が 5,000 ms（expect の既定）か WAIT_MS の 10,000 ms なので、500 ms は外れません。そのため、約 270 ms を過ぎると 500 ms おきにしか確かめません。
  - stub で、遅れを決めて計った結果です（両ブラウザ）。

    | 本当の遅れ | 計った値 | 結果 |
    |---|---|---|
    | 300 ms | 814〜825 | 500 ms を超えて落ちる |
    | 450 ms | 817〜832 | 500 ms を超えて落ちる |
    | 900 ms（finish） | 1,323〜1,329 | 1,000 ms を超えて落ちる |

  - つまり、AC-1 では 270〜500 ms、AC-2 では約 770〜1,000 ms の正しい実装が落ちます。G3 の証拠の annotation に残る値も、実際より大きくなります。
  - reviewer r1 の要修正（finishMs が `task.today` を待つ）を直したことで、AC-2 は既定の 10 s を待つようになりました。直す前の 1,000 ms の待ちより間隔が粗くなっています。
  - design は「切り替えは同期、transition なし」（design 2 章 AC-1 の行、tokens.md:90）なので、実際に落ちる見込みは低いです。G3 の前に直してください。
- 根拠：PRD AC-1「確定してから次の質問が表示されるまで 500 ms」、AC-2「1 秒以内」、PRD 12。
- 直す方向
  - verifier：時間をページの中で計る。click の前に `page.evaluate` で 2 つを仕掛けます。
    - capture 段の click リスナーで `performance.now()` を取る。
    - MutationObserver（`<html>` の `data-state` と `diagnosis.progress` の `data-question-index`）で、目的の値になった時刻を取る（W-9 と同じく、テスト側の globalThis の変数を使う）。
    - 差を取ったあとで、今の expect で状態を確かめる。
  - 小さく直すだけなら、計る区間の expect に `{ timeout: 上限 }` を渡します。こうすると間隔が 100 ms 以下になり、ずれは最大で約 100 ms に縮みます。
  - tech-lead（私）：test-hooks.md に「時間の計り方」の節を足し、どちらの方法にするかを契約で決めます。

**提案**

- `tests/ac01-ac02-diagnosis.spec.mjs:32`：`ja['diagnosis.progress']` がないと、`fill(undefined)` が TypeError になります（文言の足りない stub で再現）。赤の理由が「テストの誤り」に見えるので、先に `expect(ja).toHaveProperty('diagnosis.progress')` を置きます。
- `helpers/app.mjs:175-181`（waitServiceWorkerReady）：`navigator.serviceWorker.ready` は SW がないと解決しないので、テストの 60 s の timeout まで止まります（verifier の stub の理由 B）。`WAIT_MS` との競争にすると、「SW が登録されない」と落ちた理由が分かります。
- `helpers/app.mjs:200-202`（engineOf）：`browser()` が null のときは黙って chromium として扱います。今の使い方では null になりません（stub の実行で annotation「webkit：次へ Alt+Tab」を確認）。Playwright の `browserName` フィクスチャを使うか、null なら例外にするとより安全です。
- `helpers/fixtures.mjs:2`：コメントが「backend/dist/」のまま古くなっています（今は mkdtemp）。
- 契約（tech-lead が直す）：test-hooks.md:112 の Linux WebKit の「未確認」に、WebKit のソースの裏付けを書き足します。
  - 出典：Source/WebCore/page/EventHandler.cpp。
  - Cocoa 以外では `tabsToAllFormControls` が常に true です。`defaultTabEventHandler` が止めるのは Ctrl と Meta だけで、Alt は止めません。
  - したがって Linux でも、Alt+Tab はボタンと radio に移ると読めます。実際に動かしての確認は、契約どおり最初の CI に残します。

## 前回の指摘の追跡（r2）

| 前回の指摘 | 直った / 直っていない | 証拠 |
|---|---|---|
| tech-lead 重大：AC-18 の Tab が WebKit で止まらない | 直った | app.mjs:195-224（navKeys、pressPrev）、ac17:104-158、test-hooks.md:106-112。自分の stub（S1 から done まで動く）で、両ブラウザとも AC18 が通った。annotation は「webkit：次へ Alt+Tab」で、記録した要素はすべて focus-visible が true、枠は 3 px。同じ stub で枠を 1 px にすると、両方とも「Received: 1」で落ちる（空振りしていない）。判定はブラウザの種類で行い、projects の名前には頼っていない |
| 要修正：AC-12 の SW とオフラインの競り合い | 直った | ac12:16、:51 で waitServiceWorkerReady を待つ。SW 付きの stub で AC12 の 2 本が両ブラウザとも通り、送信は 0 件 |
| 要修正：AC-30 の「該当なし」が空の課題集でも緑 | 直った | ac10:36-43。空の課題集：両方とも `tasks.schema.json：data/tasks must NOT have fewer than 1 items` で落ちる。126 件、in_app だけの課題集：「該当なし（126 件）」で通る（PRD の想定どおり）。external を含む課題集：`Expected "task.today" Received "diagnosis.start"`（アプリがまだない）で落ちる。本番の課題集は AC-4 と同じ条件を満たすはずなので、この守りで誤って落ちることはない |
| 要修正：stub での実行の出力がない | 直った | stub-chromium.log と stub-webkit.log の `#` 以外の行が、スクラッチパッドにある生の出力（stub-chromium.out、stub-webkit.out）と一致。違いは空行と `exit=1` だけ。件数は 65 failed / 1 passed と 64 / 1。理由 A〜G の合計は 65 と 64 で合う。tab-keys.log も生の出力（tab-keys.out）と一致 |
| 要修正：AC-1 が「始める→1問目」を計っていない | 直った（計り方の新しい要修正あり） | ac01:20-51 で 4 区間を計り、上限は 500 / 500 / 500 / 1,000 ms |
| 提案：W-9 の「次の 1 回」 | 直った（契約） | test-hooks.md:63 |
| 提案：AC-31 の祖先を除く | 直った（契約） | test-hooks.md:118 |
| 提案：AC-26 の比べるキー | 直った | ac26:7-9、:29-34。描画されている文言キーのうち差し込みのないもの全部と比べ、7 個が含まれることも確かめる。identifiers.md:37 の決まりと合う |
| 提案：AC-13 の persist の回数 | 直った | seed.mjs:66-85、ac11:51-53（expect.poll で 1 回） |
| 提案：AC-14 の done を最後の 3 行に | 直った | ac14:6-21：done 3 行の日付が今日の -3、-2、-1 日で、`lastDate` と一致することを確かめる。seed.mjs:116-118 では日付を古い順に並べるので、確かめる順も合う |
| 提案：global-setup を mkdtemp と teardown に | 直った | global-setup.mjs:24-41。Playwright の runner（playwright/lib/runner/index.js:6566-6570）は、globalSetup が返す関数を後片付けとして呼ぶ。global-setup は runner のプロセスで 1 回だけ動き、worker は読むだけなので、2 worker でもぶつからない。外から渡した KYOUNOITTE_DIST は消さない |
| 提案：ac28 の一時フォルダを finally で消す | 直った | ac28:17-26 |
| 提案：`BUDGET2_` に改名 | 直った | ac03:47、test-hooks.md:43。AC 番号のないテストは BUDGET2_ の 1 本だけ |
| 提案：`.js` は `text/javascript` | 直った | static-server.mjs:15-16 と test-hooks.md:14 が一致 |
| reviewer 要修正：AC-2 の finishMs が click の往復だけ | 直った（計り方の新しい要修正あり） | app.mjs:80-85、ac01:66-69、ac12:23-28 |
| reviewer 提案 1：AC-31 の契約 | 直った | test-hooks.md:118 |
| reviewer 提案 2：AC-14 の Given | テストは直った。PRD は pdm への問いのまま | PRD の Given の文言は変わっていないが、テストは書いてあるとおり満たす（過去 3 日に done 3 件、今日は task.exhausted） |
| reviewer 提案 3：AC-1 の 3 回 | テストは直った。PRD の文言は pdm への問い | ac01 の 4 区間 |
| reviewer 提案 4：予算テストの名前 | 直った | 上の BUDGET2_ の行と同じ |
| reviewer 提案 5：G3 で「該当なし」を書く | 直った（テスト計画） | test-plan 2 章の AC-30 の行と 10 章。annotation に件数が付いた（ac10:48） |
| reviewer 提案 6：check-schemas の ajv を backend に | 範囲外のため未着手 | backend/package.json がまだない。ADR 0001 の B に従い、backend-engineer が作るときの項目 |

## 証拠

**対象**
- `git diff f339a95...b2bffba`（21 ファイル）。backend/tests/acceptance/ の変更 16 ファイルと test-plan.md の差分は全部読んだ。
- evidence は red.log、stub-*.log、tab-keys.log の冒頭と、件数、理由の表を読んだ。
- `.claude`、`.github`、contracts、docs/prd、design の変更は 0 件。

**観点の表（r2 で変わった AC だけ。ほかは r1 の表のまま）**

| AC | テスト | つなぎ口 | 確かめている結果 |
|---|---|---|---|
| 1 | ac01::AC1_ | W-2 | n/3、3 問、4 区間の時間（計り方は要修正） |
| 2 | ac01::AC2_ ×3 | W-2、W-5 | finishMs ≤ 1,000、領域と段階が一致 |
| 12 | ac12::AC12_ ×2 | W-12、W-13 | SW の準備の後にオフライン。4 区間、done と helpful、no_time、送信 0 |
| 13 | ac11::AC13_ | W-9 | persist の呼び出し 1 回、done、履歴、notPersisted |
| 14 | ac14::AC14_ | W-7 | seed の done の日付が -3〜-1 日、新しい領域、done 3 行 |
| 18 | ac17::AC18_ | 移動キーの節 | 9 要素の focus-visible と枠 3 px（WebKit は Alt+Tab） |
| 26 | ac26::AC26_ ×2 | W-14 | lang、描画されている文言キー全部、キーの差 0 |
| 30 | ac10::AC30_ ×2 | W-4、W-6、W-7 | 課題集が本物か（スキーマ、126 件、18 組×7 件）、external の表示 |
| 予算 2 | ac03::BUDGET2_ | W-6 | 平均 600 字、gzip 106,000 バイト |

- PRD の AC の集合（32）と、テスト名の AC の集合は一致（`diff` で差 0）。
- 差分で使っている識別子はすべて identifiers.md にある。
- 次の件数はすべて 0 件：`test.skip`、`.only`、`.fixme`、`waitForTimeout`、`.exists`。

**読んだファイル**
- docs/reviews/…G2-tests-tech-lead-r1.md、…G2-tests-reviewer-r1.md
- backend/tests/acceptance/：README、global-setup、playwright.config、helpers/app、seed、paths、fixtures、schema、build、server/static-server、tests の ac01、03、10、11、12、14、17、26、28
- test-plan.md の差分、evidence の 4 ファイル
- contracts/：test-hooks.md（全文）、identifiers.md 1〜4、data.md 3〜8、schemas/tasks.schema.json
- PRD の AC-13〜16、design/tokens.md:90、:102、design 2 章 AC-1 の行
- docs/org/gates.md、docs/templates/review-report.md

**実行したコマンドと結果**
- `cd backend/tests/acceptance && npm ci`：found 0 vulnerabilities。依存は @axe-core/playwright 4.14.0、@playwright/test 1.64.1、ajv 8.20.0。
- `npx playwright test --list`：Total: 131 tests in 16 files。`--project=chromium` は 66 本、`--project=webkit` は 65 本。
- `npx playwright test --reporter=list`（アプリなし）：exit 1、`131 failed`。Error はすべて「配布物を作れないので受け入れテストを動かせない：backend/scripts/build.mjs が見つからない（実装がまだない）」の 1 種類で、131 件。red.log の件数と理由に一致し、red.log には SyntaxError、TypeError、Cannot find module が 0 件。
- 自分の stub（S1 から S2 の 3 問、task.today、task.rate、task.done、no_time、履歴まで動き、SW と 126 件の課題集を持つ）で：
  - `KYOUNOITTE_DIST=<stub> npx playwright test -g 'AC18_|AC12_|AC30_|AC1_|AC2_'`（両ブラウザ）：14 passed、4 failed。AC18、AC12 ×2、AC2 ×3 は両ブラウザで通った。落ちたのは AC1（stub の文言に `diagnosis.progress` がなく TypeError。上の提案）と、AC30 の in_app（stub が seed を読まないので `diagnosis.start` のまま）。
  - 文言を足して再実行すると、AC1 は両ブラウザで通った。区間の時間は chromium が 81、38、39、29 ms、webkit が 42、37、35、40 ms。
  - 対照実験（わざと壊した stub）：枠 1 px：AC18 が 2 failed（Received: 1）。finish を 1,200 ms 遅らせる：6 failed（1,323〜1,365 ms）。遅れ 300、450、900 ms：上の要修正の表のとおり。空の課題集：AC30 がスキーマで落ちる。external を含む課題集：AC30 が状態の不一致（アプリがまだない）で落ちる。
- `grep -n backoffScale node_modules/playwright-core/lib/coreBundle.js`：25280 行目に `[20, 50, 100, 100, 500]` と、timeout ÷ 5 で外す処理がある。
- `grep -n globalSetupResult node_modules/playwright/lib/runner/index.js`：6569-6570 行目で、返した関数を呼ぶ。
- `curl -sfL https://raw.githubusercontent.com/WebKit/WebKit/main/Source/WebCore/page/EventHandler.cpp`：5097-5105 行と 5129-5150 行は、Option+Tab の反転が Cocoa だけで、Cocoa 以外は「We always allow tabs to all controls」。5482-5504 行の defaultTabEventHandler は Ctrl と Meta だけを止める。
- `git status --short`：追跡しているファイルの変更はなし。node_modules と test-results は .gitignore 済みで、上書きした。

**開いた URL（2026-10-31）**
- https://raw.githubusercontent.com/WebKit/WebKit/main/Source/WebCore/page/EventHandler.cpp（WebFetch の後、curl で全文）

**スクラッチパッドのファイル**
- `/private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/g2r2/`（app/ と壊した版、tools/gen-tasks.mjs、run-a.out、run-b.json、r2-red.out）

**未検証**
- G2 の判定に要るもの：なし。
- 契約が後の段階で確かめると決めているもの：Linux の WebKit（CI）での Alt+Tab（WebKit のソースでは移ると読める。最初の CI で確かめる）。GitHub Pages が `.js` に返す Content-Type（G4 で curl）。
