# 001-daily-learning G2 受け入れテスト reviewer r3（観点：テスト。FB 1 回目の作り直しで 2 回目。a082726...a547172）

PASS

## 指摘
- 重大：なし
- 要修正：なし
- 提案（判定に数えない）：backend/tests/acceptance/helpers/check-seeds.mjs:42 の main の判定 `import.meta.url === \`file://${process.argv[1]}\`` は、フォルダのパスに空白や非 ASCII があると `import.meta.url` 側が percent-encoding されて一致せず、何も検査せずに終了コード 0 で終わる（静かな緑）。今の環境（この Mac と Linux の CI のパスは ASCII）では動くことを自分で確かめた（下の証拠）。`pathToFileURL(process.argv[1]).href` と比べると環境に依らない。
- 範囲外（判定に数えない）：差分の範囲には pdm のコミット 71f07c8（docs/prd/001-daily-learning/tasks.v2.json、tasks-review.md 7 章、docs/approvals/delegation.md の 1 行）が含まれる。verifier の変更ではないので観点の外だが、エージェント向けの指示のような文がないこと（grep 0 件）と、tasks.v2.json が tasks.schema に通り 126 件・12 組（中級 14、上級 7）・insight 126 件・ID 重複 0 であることは確かめた。

## 前回の指摘の追跡
| 前回の指摘 | 直った / 直っていない | 証拠 |
|---|---|---|
| reviewer r2 重大：completedSeed が目標の領域の `levels` を他の段階の行で上書き（seed.mjs:236-237） | 直った | seed.mjs:303 `for (const t of otherRows) if (t.area !== area) levels[t.area] = t.level;`。前回の sim-seed.mjs を再実行：`n=29: levels={"backend":"intermediate"} helper.nextId=backend-intermediate-014 -> L=intermediate next=backend-intermediate-014 (候補 1)`、`n=99: levels={"backend":"intermediate","frontend":"advanced","database":"advanced"} … next=backend-intermediate-014 (候補 1)`。さらに seed.mjs:308-312 で `pickNext(tasks, seed) !== nextId` なら例外にする自己確認が入り、直す前の `levels` の作り方を自分で再現すると n=29 は `backend-advanced-003`、n=99 は `null` になって自己確認に落ちることを確かめた（r3-negative.mjs） |
| reviewer r2 要修正：test-plan.md 10 章「テストの誤りで落ちたものは 0 件」と 2 章 AC-35 の行、末尾の確かめの印 | 直った | test-plan.md の差分：10 章 r8 の段に「この時点では…と書いたが、事実と違った」と明記、r9 の節を追加、2 章 AC-35 の行に seed の誤りと直しを追記、末尾の [x] の文も書き換え |
| tech-lead r4 要修正：injectSeed に W-7 の ID と組の確かめがない | 直った | seed.mjs:28-40 `assertSeedTaskIds`、:76-83 `injectSeed` が既定で呼ぶ。例外は `allowIdsNotInTasks: '<理由>'`（空文字や非文字列は例外）。tests/ での使用は 0 件（grep）。否定の確かめ：課題集にない ID、行の level 違い、current の area 違いの 3 通りがすべて捕まる（r3-negative.mjs の出力） |
| tech-lead r4 要修正：DESIGN_D43（reduce でない）で `task.total.value` のテキストを S4 直後の同じ evaluate で読んでいない | 直った | ac35-ac37-done-screen.spec.mjs:143-153 同じ evaluate で `textContent` を読み、`fill(text(ja,'task.total.value'),{count:11})` と `toBe` で比べる（契約「完了の演出の確かめ方」:209「S4 に着いた直後に読んだ値が最終の値」と一致） |
| tech-lead r4 提案：check-seeds.mjs の `<=` | 直った | `<` に変更。contracts/tools/check-schemas.mjs:44-48 と同じ条件（「なし」の firstOpenDate の検査も同じ） |
| tech-lead r4 提案：seed 組み立て関数の自己検査 | 直った | helpers/check-seed-builders.mjs（新規）。`npm run check:seeds` で自分で実行：seed 18 件・期待と違う結果 0 件、自己検査 21 件・期待と違う結果 0 件、終了コード 0 |
| tech-lead r4 提案：AC-33 の期待 ID | 直った | ac33-next.spec.mjs:47-48、:70-71 で `pickNext(tasks, seed, issuedIds)` と固定の `EXPECTED_IDS`（004→005→006）の両方と比べる。本番の 126 件の tasks.json と seed-ac14 で pickNext を自分で当てると 004、005、006（r3-negative.mjs） |
| reviewer r2 提案：`ja[key]` を `app.text` に | 直った | 下の「期待の値が変わっていないか」 |

## 指示書の 4 点への答え
1. 前回の重大と要修正：上の表のとおり直った。sim-seed.mjs の再実行で n=29、n=99 とも `backend-intermediate-014`。
2. 新しく足されたもの：
   - `assertSeedTaskIds` / `distTasks`：配布物の data/tasks.json を ID の照合にだけ読む（実装のモジュールは import しない）。`KYOUNOITTE_DIST` は global-setup.mjs が BASE より前（b2bffba、2026-10-31）から入れており、fixtures.mjs の `dist` fixture がビルド失敗を先に落とすので、赤の理由が「KYOUNOITTE_DIST がない」にすり替わることはない（r8-red-3.log と自分の実行で該当 0 件）。
   - `injectSeed` の `allowIdsNotInTasks`：理由の文字列が必須。使用 0 件。テストを弱める方向の逃げ道にはなっていない。
   - `pickNext`：data.md 5:108-110（`a = diagnosis.area`、`L = levels[a]`（なければ `diagnosis.level`）、history にも current にもない ID の最小）と一致。
   - `check-seed-builders.mjs` / `check-seeds.mjs` の semantic：上の表。semantic は check-schemas.mjs と同じ。
   - ac33 の期待 ID：既存の「過去と違う」「組が同じ」「nth」「issued」の確かめに追加（アサーションは増える方向）。
   - `ja[key]` → `app.text(ja, key)`：差分の − 行 26 行（`ja[` 46 か所）と + 行を `app.text(ja, X)`→`ja[X]` に正規化して比べると完全一致（差は DESIGN_D43 に新しく足した 1 行だけ）。期待の値は変わっていない。`app.text` はキーがなければ例外（app.mjs:255-258）なので、`undefined` を黙って比べることもない。
   - tools の `KYOUNOITTE_DIST`：screenshots.mjs:619、keyboard-tour.mjs:53 で buildDist の直後に入れる 1 行ずつ。判定のテストではない。
   - 他に変わった期待値：`git diff -U0 … | grep expect` で、ja→text 以外の変更は ac33 の追加 4 行だけ。
3. 悪い形：`grep -rnE "waitForTimeout|pause\(|test\.skip|test\.fixme|\.skip\(|\.only\(|retries|backend/public|__test|getByText|toContainText|location\.search|import\("` の結果は、r2 と同じ既存の 6 行（ac28:63 `pause(2000)` は PRD AC-28 の When、screenshots.mjs:61 は契約どおりの撮影前の待ち、`toContainText` 3 か所は文言ファイルの値との比較、config `retries: 0`）と app.mjs:231-232 の `node:fs` / `node:path` の動的 import（スクリーンショット保存の道具。本番コードではない）だけ。skip / fixme / only：0 件（`--list` の 219 本に skip / fixme なし。「skipped」の 10 件はすべて `task.skipped` の名前）。`backend/public` への参照 0、`grep -rnE "__test|[?&](reset|now|seed)=|location\.search|KYOUNOITTE" backend/public` 0 件。
4. 落ちている 96 件：r8-red-3.log を読み、さらに自分で全体を 1 回動かした（`npx playwright test --reporter=line`、再試行なし）：`96 failed`、`123 passed (1.6m)`、終了コード 1。落ちた 96 件の名前の集合は r8-red-3.log と完全に同じ（diff 空）。48 本 × chromium / webkit。最初の Error の分類（自分の実行と r8-red-3.log で同じ内訳）：`toHaveCount` 24（`task.next`、`task.exhausted.levelDone` / `allDone` が 0 件）、`toBe` 12（`data-task-nth-today` / `data-progress-*` が null）、「目標の組 backend/intermediate が 7 件で、未出を残せない」8、「次の一手に進む」が 1 つ 6、tasks.schema の insight 6、`settings.stats.daysCompletedWeek.value` 6、文言キー `task.next.note` 4 / `task.exhausted.levelDone` 4 / `area.backend.desc` 4+2+2、insight なし 2+2+2、210 件 2、`years.never` の radio 2、`task.dayChanged` の位置 2（levelDone がない）、その他 2 ずつ。すべて「実装が古くて要素・属性・キー・課題がない」。`SyntaxError|Cannot find module|ERR_MODULE_NOT_FOUND|ReferenceError|Test timeout of|KYOUNOITTE_DIST|W-7 の ID の決まりに合わない|completedSeed(n=…の誤り` は 0 件。ac35 の 10 / 29 / 99 と DESIGN_D43 非 reduce は「未出を残せない」で止まるため、直した completedSeed の経路はブラウザではまだ動いていないが、同じ構成の合成 210 件と本番の 126 件（pickNext）で確かめた。

## 証拠
- 対象：a082726...a547172、観点「テスト」（G2、verifier の受け入れテスト）。`git diff --name-only a082726...a547172`（22 ファイル。すべて読んだ）
  - [x] backend/tests/acceptance/helpers/check-seed-builders.mjs（全文、新規）
  - [x] backend/tests/acceptance/helpers/check-seeds.mjs（差分 + 全文）
  - [x] backend/tests/acceptance/helpers/seed.mjs（差分 + HEAD の全文）
  - [x] backend/tests/acceptance/package.json（差分：check:seeds に builders を連結）
  - [x] tests/ac01-ac02-diagnosis、ac08-level-rule、ac10-ac30-exhausted-external、ac21-ac22-home-screen、ac24-stats、ac39-ac40-diagnosis-r8、design-d30-day-changed、design-d40-d44-next-note（差分。すべて ja→app.text）
  - [x] tests/ac33-next.spec.mjs（差分 + 周辺）
  - [x] tests/ac35-ac37-done-screen.spec.mjs（差分 + :1-135 の全文）
  - [x] tools/keyboard-tour.mjs、tools/screenshots.mjs（差分 + S4 at30/at100 の :275-301）
  - [x] docs/approvals/delegation.md、docs/prd/001-daily-learning/tasks-review.md（差分。pdm、範囲外）
  - [x] docs/prd/001-daily-learning/tasks.v2.json（スキーマと件数を node で検査。本文は読んでいない：範囲外）
  - [x] docs/verification/001-daily-learning/evidence/r8-red-3.log（冒頭、集計、96 件の最初の Error をすべて）
  - [x] docs/verification/001-daily-learning/evidence/r9-check-seeds.log（全文）
  - [x] docs/verification/001-daily-learning/test-plan.md（差分：2 章 AC-35、8 章、10 章 r8 と r9、末尾の確かめ）
  - 呼び出し元として読んだもの：helpers/app.mjs（text / fill / loadTasks）、helpers/fixtures.mjs、helpers/paths.mjs、helpers/build.mjs、global-setup.mjs、contracts/tools/check-schemas.mjs の semantic、contracts/fixtures/seeds/seed-ac14-three-completed.json、backend/public/data/tasks.json（件数）
- 規則として開いたもの（2026-11-05、リポジトリ内）：contracts/test-hooks.md W-7（:52-、「seed の行と current の taskId は、本番の tasks.json にある ID だけにする。テストは seed を入れる前に、各 taskId が課題集にあり、行の area と level が ID の <領域>-<段階> と同じことを確かめ、違えば seed の誤りとして落とす」「他の領域の行を入れるときは、その領域の levels に最後の行の段階を入れる」「次に出る ID の期待値は、data.md の 5 の選び方…を本番の課題集に当てて求める」）、同「完了の演出の確かめ方」:204-215、contracts/data.md 5:108-110、docs/reviews/001-daily-learning-G2-tests-reviewer-r2.md、docs/reviews/001-daily-learning-G2-tests-tech-lead-r4.md、docs/templates/review-report.md
- AC 対応表：r2 の表（AC-1〜AC-40、design の DESIGN_D30/D40/D43/D44）から、テストの本数（219、23 ファイル）と名前の AC 番号（AC1_〜AC40_ の 40 個）に変化なし。この差分で確かめる結果が変わった行：AC-33（出る ID を pickNext と 004/005/006 の両方と比べる：強くなった）、AC-35 の 29 / 99（seed の誤りが直り、正しい実装で `backend-intermediate-014` が出て累計 30 / 100 を確かめられる形になった）、DESIGN_D43 非 reduce（S4 直後のテキストも最終の値と比べる：強くなった）。要素の有無だけを見るテストはない。
- 範囲外の変更：pdm の 71f07c8（上の指摘）。verifier の a547172 は backend/tests/acceptance/ と docs/verification/ の中だけ。.claude/、.github/、backend/public/ に変更なし（`git diff --name-only` に出ない）。
- テストを弱める変更の検査（手引き 3 のコマンド）：
  - `git diff --name-only … | grep -E '(tests/acceptance)/|^\.claude/|^\.github/|…'` → tests/acceptance の 16 ファイル（verifier の変更なので範囲内。全部読んだ）。.claude/、.github/、conftest 等：0 件
  - `git diff -U0 … | grep -E '^\+.*(skip|fixme|only…)'`：0 件
  - アサーションの増減（`^[-+][^-+].*expect\(`）：+34、−25（− はすべて ja[ の行の置き換え。正規化で一致）
  - テスト中だけ答えを変える分岐：backend/public に変更なし
- 実行したコマンドと結果：
  - `node <scratchpad>/sim-seed.mjs`（前回と同じスクリプト）：上の表の出力。終了コード 0
  - `node <scratchpad>/r3-negative.mjs`：`seed-ac14 pickNext (real): backend-intermediate-004 | after 004: …005 | after 004,005: …006`、`bad1 (missing id): caught`、`bad2 (level mismatch): caught`、`bad3 (current area mismatch): caught`、`n=29 … old-style … pick=backend-advanced-003 … -> old would be caught by the self-check`、`n=99 … pick=null … caught`
  - `cd backend/tests/acceptance && npm run check:seeds`：`課題集：…/dist/data/tasks.json（126 件）`、`seed 18 件、期待と違う結果 0 件`、`自己検査 21 件、期待と違う結果 0 件`、OK 39 行、NG 0 行、終了コード 0（/private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/r3-check-seeds.log）
  - `npx playwright test --list`：`Total: 219 tests in 23 files`
  - `npx playwright test --reporter=line`：`96 failed`、`123 passed (1.6m)`、終了コード 1（/private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/r3-full-run.log）。落ちた 96 件の名前は r8-red-3.log と同一（diff 空）
  - `node <scratchpad>/r3-v2.mjs`：`v2 count: 126 schema ok: true | insight present: 126 | dup ids: 0`、12 組（intermediate 14 × 6、advanced 7 × 6）
  - `git blame -L '/KYOUNOITTE_DIST = distDir/,+1' a547172 -- global-setup.mjs` → b2bffba（2026-10-31、BASE より前）
  - `git log a082726..a547172` → 71f07c8（pdm）、a547172（verifier）
- 開いた URL：なし（この観点で Web の規則は使わない。規則はすべてリポジトリ内の契約と PRD）
- 未検証：なし（補足：直した completedSeed の経路を正しい 210 件の実装に対してブラウザで動かすことは、実装がまだないのでできない。代わりに同じ構成の合成 210 件（check-seed-builders と sim-seed）と、本番 126 件での pickNext で確かめた）

## 記録
- 関門：G2（受け入れテスト）
- 判定した役：reviewer（テスト）
- 回：r3（FB 1 回目の作り直しで 2 回目）
- 対象：feat/001-daily-learning、a082726...a547172
- 日付：2026-11-05
