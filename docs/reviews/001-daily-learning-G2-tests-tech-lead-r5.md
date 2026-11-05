# 001-daily-learning G2 受け入れテスト tech-lead r5（FB 1 回目の作り直しで 2 回目。a082726...a547172）

PASS

r4 の指摘は 7 件ともすべて直っていました（重大 1、要修正 2、提案 4。契約の側の提案は 5 で扱います）。新しく足された assertSeedTaskIds、allowIdsNotInTasks、pickNext、check-seed-builders.mjs にも、新しい重大と要修正はありません。落ちている 96 件は、どれも「実装が古いので正しい赤」です。

## 指摘
重大と要修正はありません。提案が 4 件です。

- **提案**　backend/tests/acceptance/helpers/seed.mjs:77-83（injectSeed の allowIdsNotInTasks）
  - 何が問題か：理由を渡すと、assertSeedTaskIds が丸ごと飛ばされます。そのため「行の area / level が ID の `<領域>-<段階>` と同じ」の確かめも外れます。W-7 が認める例外は「課題集にない ID」だけです。注釈を書くことも、コメントで頼んでいるだけで、強制されていません。いまこの引数を使うテストは 0 本なので、結果は変わりません。
  - 根拠：contracts/test-hooks.md:61
  - 直す方向：理由があるときも、ID の前半と area / level が同じかは確かめます。あわせて testInfo を受け取り、注釈を injectSeed の中で足します。
- **提案**　backend/tests/acceptance/tests/ac35-ac37-done-screen.spec.mjs:121-133（DESIGN_D43 の reduce の側）
  - 何が問題か：reduce の側では、累計のテキストを、繰り返し待つ toHaveText（expectTotalAndCheer）だけで読んでいます。契約は「reduce の有無によらず、S4 に着いた直後に読んだ値が最終の値」です。CSS の演出なら getAnimations が 0 件なので心配はありません。ただ、JS で数え上げる作りは見逃します。
  - 根拠：contracts/test-hooks.md:209
  - 直す方向：reduce でない側（:141-153）と同じく、1 回の evaluate で textContent も読んで比べます。
- **提案**　docs/verification/001-daily-learning/evidence/r8-red-3.log:1
  - 何が問題か：どのコミットで実行したかが、ログにありません。
  - 直す方向：先頭に `git rev-parse HEAD` の出力と、実行したコマンドを入れます。
- **提案（契約の側。次の委任で tech-lead が書く）**　contracts/test-hooks.md:70
  - 答え：直すのが望ましいです。ただし重大度は提案で、G2 は止めません。
  - 理由：今のテストは正しく、seed の中の自己確認と check-seed-builders.mjs で守られています。それでも契約は「他の領域」の書き方しか定めていません。r8 の誤りはこの書かれていない所から生まれ、判定する側も条文で直接は示せませんでした。足すだけの変更で、実装とテストへの影響はありません。
  - 足す文の案：「目標の領域の `levels` は目標の段階のまま（同じ領域の別の段階の行では書き換えない）。作った seed に data.md の 5 を当てて、次に出る ID が目標の組の最小の未出であることを確かめる」

## 前回の指摘の追跡
| 前回（r4）の指摘 | 結果 | 証拠 |
|---|---|---|
| 重大：completedSeed が目標の領域の levels まで上書きする | 直った | seed.mjs:293 は `if (t.area !== area)` だけで levels を書く。:298-302 で pickNext と nextId が違えば例外にする。私の合成の課題集に当てた結果と、実際のアプリに当てた結果は下の証拠 |
| 要修正：injectSeed に W-7 の ID の確かめがない | 直った | seed.mjs:28-40 の assertSeedTaskIds を :79-80 で呼ぶ。わざと誤らせた seed 4 通りを、4 通りとも落とした（下の証拠） |
| 要修正：DESIGN_D43 の reduce でない側がテキストを繰り返し待って読む | 直った | spec:141-153 で、S4 に着いた直後の同じ evaluate の中で textContent を読み、`fill(task.total.value, {count:11})` と比べている。`task.total.prev` は value の兄弟の要素で、value の中には入らない（identifiers.md:62、design 286 行目、566 行目）。そのため textContent に途中の値は混ざらない |
| 提案：check-seeds の比べ方が `<=` | 直った | semantic が contracts/tools/check-schemas.mjs:38-54 と同じ中身になった |
| 提案：seed を作る関数の自己検査 | 直った | check-seed-builders.mjs を足し、check:seeds から動く。期待の ID はファイルに書かれた値（011 / 014 / 014、001）で、pickNext の答えだけに頼っていない |
| 提案：AC-33 の 2 件目と 3 件目は「過去と違う」しか見ない | 直った | ac33:47-48 と :70-71 で、pickNext の答えと、書かれた値（004 → 005 → 006）の両方と比べる。申告は done か no_time なので、途中で段階は変わらない（data.md 5 の 3） |

## 証拠
- 対象：a082726...a547172。受け入れテストと検証の 18 ファイルは、すべて差分を読みました。
  - helpers の 3 つ：check-seed-builders.mjs（新規）、check-seeds.mjs、seed.mjs
  - package.json
  - tests/ の 10 本：ac01、ac08、ac10、ac21、ac24、ac33、ac35、ac39、design-d30、design-d40-d44
  - tools/ の 2 つ：keyboard-tour.mjs、screenshots.mjs
  - test-plan.md と r9-check-seeds.log
  - r8-red-3.log は、落ちた所を全件読みました
  - 範囲の外で読んでいないもの：docs/prd/001-daily-learning/tasks.v2.json、tasks-review.md、docs/approvals/delegation.md（pdm と指揮役の担当）
- 観点の表

| 観点 | 結果 |
|---|---|
| 1. completedSeed n=10 / 29 / 99 | 2 つの方法で確かめた。(a) 私のスクリプト（14/14/7 の合成の課題集。seed.mjs と別に data.md 5 を自分で書いた）：次に出る ID は 011 / 014 / 014 で、nextId と同じ。levels.backend は 3 つとも intermediate。n=99 は `{"backend":"intermediate","frontend":"advanced","database":"advanced"}` で 3 領域。data.md 8 の誤りは 0 件。(b) 今の実装（古いアプリ）に合成の 210 件を入れてビルドし、AC-35 を動かした：n=10 / 29 / 99 とも、injectSeed（ajv と W-7）を通り、アプリが出した `data-task-id` が nextId と同じだった（spec:40 を通過）。落ちたのは次の行 :41 の readStats で、r8 の識別子 `settings.stats.daysCompletedWeek.value` がないため |
| 1. seenNext / nextDone / beginnerDoneAtIntermediate | seenNext は levels が beginner、16 行、S7、中級の未出 12。nextDone は 28 行、S7。beginnerDoneAtIntermediate は次が backend-intermediate-001。どれも data.md 8 の誤りは 0 件 |
| 2. pickNext | data.md 5 の 108-110 行目どおり。L は levels[a]、なければ diagnosis.level。history と current を除く。比べ方は文字列。levels を空にすると diagnosis.level に戻り、extraIssued も効く（私のスクリプトで確認） |
| 2. assertSeedTaskIds | W-7 の 61 行目どおり。history と current の両方を見る。課題集にない ID、area の違い、level の違い、current の ID の 4 通りを、4 通りとも例外にした。KYOUNOITTE_DIST がないときも例外にする |
| 2. check-seed-builders.mjs | W-7 の 68-72 行目と data.md 5、8 に合う。合成の課題集の作り方（初級と中級 14、上級 7、ID は `<領域>-<段階>-NNN`）は W-6 と W-7 どおり |
| 3. DESIGN_D43 のテキスト | reduce でない側は契約どおり。reduce の側は上の提案 |
| 4. 赤の理由 | r8-red-3.log は 96 failed（48 本 × 2 ブラウザ）、123 passed、終了コード 1。最初の Error を 96 件すべて分けた（下の内訳）。W-7 の ID の確かめ、import、構文、KYOUNOITTE_DIST のどれかで落ちたものは 0 件。AC-33 は新しく足した ID の比べ（:47-48）を通り、:50 の `data-task-nth-today` が null で落ちる |
| 5. test-hooks.md:70 | 直すのが望ましい（提案）。上の指摘 |

- 赤の 96 件の内訳（最初の Error。件数は 2 ブラウザの合計）

| 理由 | 件数 |
|---|---|
| 識別子 `task.next` がない | 14 |
| `data-task-nth-today` か `data-progress-*` がない（Received: null） | 12 |
| 中級が 7 件で「未出を残せない」 | 8 |
| insight がない（AC-3、AC-30、AC-34、AC-28 の新版の検査） | 6 + 2 |
| 「次の一手に進む」が 1 つ（`task.next` がない） | 6 |
| `task.exhausted.levelDone` か `allDone` がない | 6 + 4 |
| `settings.stats.daysCompletedWeek.value` がない | 6 |
| 文言キー（`area.*.desc`、`task.exhausted.levelDone`、`task.next.note`）がない | 4 + 4 + 4 + 2 + 2 |
| 課題集が 210 件に届かない | 2 |
| 1〜2 件目、翌日の 1 件目（r8 の属性がない） | 2 + 2 |
| insight（AC-38） | 2 + 2 |
| `area.git.desc` がない | 2 |
| `years.never` の radio がない | 2 |
| `task.dayChanged` の前後（levelDone がない） | 2 |

- 実行したコマンドと結果
  - `node /private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/seedcheck.mjs`：上の表の 1 の (a) の値。seeds/ 10 件と contracts/fixtures/seeds/ 8 件も、すべて OK
  - `node /private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/neg-r5.mjs`：わざと誤らせた seed 4 通りを 4 通りとも例外にした。理由が空文字の allowIdsNotInTasks は例外になり、理由を書くと通った。pickNext は levels がないとき backend-intermediate-004、extraIssued に 004 を渡すと 005
  - `cd backend/tests/acceptance && npm run check:seeds`（pipefail 付き）：終了コード 0。`seed 18 件、期待と違う結果 0 件`、`自己検査 21 件、期待と違う結果 0 件`
  - `npx playwright test --list`：`Total: 219 tests in 23 files`
  - `npx playwright test tests/ac33-next.spec.mjs tests/ac35-ac37-done-screen.spec.mjs --project=chromium --output=<スクラッチパッド>/pw-r5`：12 failed、1 passed。理由は r8-red-3.log の同じ行と同じ
  - `node scripts/build.mjs --out <スクラッチパッド>/syn210/dist --version 2026-11-05.1 --tasks <スクラッチパッド>/syn210/tasks.json`：19 ファイル、終了コード 0。合成の 210 件は今の課題集を写し、ID を付け替えて作った
  - `KYOUNOITTE_DIST=<スクラッチパッド>/syn210/dist npx playwright test`（上と同じ 2 ファイル、chromium）：12 failed、1 passed。AC35 の 10 / 29 / 99 と DESIGN_D43 の reduce でない側は、4 本とも spec:40 の ID の比べを通り、:41 の readStats で落ちた
  - ログ：/private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/pw-r5.log と /private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/pw-r5-syn.log
  - 副作用：backend/tests/acceptance/playwright-report/ が上書きされました。.gitignore の 37 行目で無視されるフォルダで、git status に変化はありません
- 読んだファイル
  - 前回の判定：docs/reviews/001-daily-learning-G2-tests-tech-lead-r4.md
  - 契約：contracts/test-hooks.md（W-7 の 52-86 行目、「完了の演出の確かめ方」の 204-215 行目）、contracts/data.md（3、5、8）、contracts/identifiers.md:62、contracts/strings.md:36、contracts/tools/check-schemas.mjs:38-54
  - design/001-daily-learning.md の 108、195、286、566 行目
  - テストの側：helpers/app.mjs:247-265、global-setup.mjs、helpers/build.mjs、playwright.config.mjs、backend/scripts/build.mjs の引数
  - 形：docs/templates/review-report.md
- 開いた URL：なし
- 未検証：なし
  - 正しい実装に対して緑になるかは、G2 の性質上まだ確かめられません。代わりに、古いアプリと合成の 210 件で、seed と「次に出る ID」がテストの期待どおりになる所までを確かめました。
  - DESIGN_D43 の新しいテキストの比べと、AC-33 の 2 件目と 3 件目の ID の比べは、手前の行で止まるため、まだ実行されていません。中身は読んで確かめました。

## 記録
- 関門：G2（受け入れテスト）
- 判定した役：tech-lead
- 回：r5（FB 1 回目の作り直しで 2 回目）
- 対象：feat/001-daily-learning、a082726...a547172
- 日付：2026-11-05
