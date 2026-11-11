# 001-daily-learning G2 受け入れテスト reviewer r2（観点：テスト。FB 1 回目の作り直しで 1 回目。9dcd77f...15cbc84）

FAIL

## 指摘

- 重大：backend/tests/acceptance/helpers/seed.mjs:236-237（`completedSeed`）。他の組の行を入れるとき `for (const t of otherRows) levels[t.area] = t.level;` が目標の領域（`backend`）の行も対象にするため、`levels.backend` が目標の段階 `intermediate` でなく最後に入れた backend の行の段階（`advanced`）に上書きされる。`others` は `AREAS × LEVELS` から目標の組だけを除くので、`backend-beginner-*`（14 件）と `backend-advanced-*`（7 件）が先頭に並び、n=29 以上で必ず起きる。結果、契約 data.md 5 の選び方（`L = levels[a]`）を当てると、n=29 では `backend-advanced-003` が出て `expect(task.id).toBe(expectedId)`（ac35-ac37-done-screen.spec.mjs:40）で落ち、n=99 では backend/advanced が全件出し終えで `task.exhausted` になり `expectState('task.today')`（同 :38）で落ちる。つまり AC-35 の「29 → 30」「99 → 100」の 2 本（× 2 エンジン = 4 件）と tools/screenshots.mjs の `S4_task.rate_at30` / `at100`（design 5.1 #24、#25）は、正しい実装（課題集 210 件）に対しても落ちる「テストの誤り」である。根拠：contracts/test-hooks.md W-7「AC-35 の seed」の「他の領域の行を入れるときは、その領域の `levels` に最後の行の段階を入れる」（他の領域に限る。目標の領域の段階は目標の段階のまま）、contracts/data.md 5「組：目標の領域 `a = diagnosis.area` と、段階 `L = levels[a]`」。再現：下の証拠の「自分で動かした」の sim-seed.mjs の出力（n=29: `levels={"backend":"advanced"}` → 選ばれるのは `backend-advanced-003`、n=99: 候補 0 件）。今の r8-red-2.log では課題集が 126 件（中級 7 件）のため `completedSeed` が「未出を残せない」で先に止まり、この誤りが隠れている。直す方向：`levels` の更新を `t.area !== area` の行だけにする（または `others` から目標の領域を丸ごと除く）。直した後、同じ sim で n=29 → `backend-intermediate-014`、n=99 → `backend-intermediate-014` になることを確かめる。
- 要修正：docs/verification/001-daily-learning/test-plan.md 10 章 r8 後半「テストの誤りで落ちたものは 0 件」と「確かめ」の最後の印。上の重大により、AC-35 の 29 / 99 件の 2 本は「実装が古いので正しい赤」ではなく「seed の誤りを含む赤」。直した上で、この文と 2 章 AC-35 の行の「W-7 の決まりで作る」を事実に合わせる。
- 提案（既存）：contracts/test-hooks.md W-7「テストは seed を入れる前に、各 `taskId` が課題集にあり、行の `area` と `level` が ID の `<領域>-<段階>` と同じことを確かめ、違えば seed の誤りとして落とす」に対応する実行時の検査が、contracts/fixtures/seeds/ の見本を読む `loadContractFixture`（helpers/seed.mjs:15-18。スキーマだけ）にも `injectSeed`（同 :28-39）にもない。helpers/check-seeds.mjs は seeds/ だけを見る手動の道具で、ID が本番の課題集にあるかは見ない（a6facf4、BASE より前）。今は各テストが出る ID を `backend-intermediate-007` などと期待していることで間接的に守られている。`injectSeed` に `tasks` を渡して ID と組を照合する関数を 1 つ足すと W-7 どおりになる。判定には数えない。
- 提案：ac35-ac37-done-screen.spec.mjs、design-d40-d44-next-note.spec.mjs などで文言を `ja[key]` で直接引いている箇所（例 :52、:57、:168、:188）は、helpers/app.mjs の `text(strings, key)` を使うと、キーがないときの赤の理由が同じ形でそろう。`fill` は既に文字列でなければ落とすので正しさには影響しない。

その他、指示書の 5 点への答え：
1. AC ごとの Then（下の表）：AC-33〜AC-40、変わった AC-4/5/7/8（10 通り目）/10/12/14/24 は、いずれも PRD r11 の Then の値（ID、`data-task-nth-today`、`data-stat-issued` の増減、`data-progress-*`、`data-stat-completed`、`data-milestone`、文言、`data-stat-days-completed-week`、書き出しの `diagnosis.years`、字数）まで確かめている。要素の有無だけで終わるテストはない。
2. 落ちている 96 件：r8-red-2.log の 96 件の最初の Error をすべて読んだ（下の証拠）。import / ビルド / 構文のエラーは 0 件（`grep -nE "SyntaxError|Cannot find module|ERR_MODULE_NOT_FOUND|ReferenceError|Test timeout of"` が空）。理由は「insight がない / 126 件」「r8 の文言キー（`area.backend.desc`、`task.next.note`）がない」「r8 の識別子（`task.next`、`data-task-nth-today`、`settings.stats.daysCompletedWeek.value`、`task.exhausted.levelDone` など）がない」「`completedSeed` が中級 7 件で止まる」の 4 種で、どれも実装が古いことによる。ただし上の重大のとおり、AC-35 の 29 / 99 の 2 本は実装がそろっても落ちる。
3. seed と W-7：固定の見本 5 件（seed-ac14/ac24/ac35/ac36/ac8-same-day）は ID を組の番号としてだけ使い、中身は課題集から引いている（AC-38 の insight は `tasks.tasks.find(...)`）。screenshots.mjs の `backend-beginner-005` の決め打ちは「インラインコードが最も長い課題を課題集から引く」形に直っている。`seenNextSeed` / `nextDoneSeed` / `beginnerDoneAtIntermediateSeed` は 210 件の合成課題集で data.md 5 と 9 のとおりの状態になる（sim の出力）。`completedSeed` だけが上の重大。
4. 悪い形：`grep -rnE "waitForTimeout|pause\(|test\.skip|test\.fixme|\.skip\(|\.only\(|backend/public|__test|getByText|location\.search"` の結果は 3 か所だけ。(a) ac28-update.spec.mjs:63 `pause(2000)` は BASE より前（a6facf48、2026-10-31）で、PRD AC-28 の When「2 秒以上の間隔を空けて再読み込みする」のためであり、状態の待ちには使っていない（既存、問題なし）。(b) tools/screenshots.mjs:61 `waitForTimeout(1000)` は判定のテストではなくスクリーンショットの道具で、contracts/test-hooks.md「完了の演出の確かめ方」の「`data-state` が `task.rate` になってから 1 秒（`page.waitForTimeout(1000)`）待って撮る」と design 5.1 冒頭「S4 は演出が終わった後（描いてから 1 秒後）に撮り」のとおり。撮る直前に `task.total.prev` が 0 件であることを確かめている（:62）。問題なし。(c) `toContainText` 2 か所は文言ファイルの値との比較で、表示の文字で要素を探してはいない。skip / only / retries（config は `retries: 0`）/ 実装の import（`backend/public` への参照 0）/ テストのつなぎ口（`grep -rnE "__test|[?&](reset|now|seed)=|location\.search" backend/public` = 0 件）なし。
5. 演出（DESIGN_D43_）：reduce のとき `getAnimations().length === 0`、`task.total.prev` 0 件、`task.rate.mark` 1 件、累計は最終の値（契約の「reduce のとき」と一致）。reduce でないとき S4 直後に `getAnimations().length >= 1`、`data-stat-completed` が描いた直後から最終の値、`task.total.prev` は expect の自動待ちで 0 件になる（契約の「reduce でないとき」「`task.total.value` のテキストは…描いた直後に読んだ値が最終の値」と一致）。`test.use({ reducedMotion: 'reduce' })` は契約の指定どおり。名前は `DESIGN_D43_` で AC の表に混ぜていない（W-6）。

## 証拠
- 対象：9dcd77f...15cbc84、観点「テスト」（G2、verifier の受け入れテスト）。`git diff --name-only 9dcd77f...15cbc84`（21 ファイル。すべて読んだ：[x]）
  - [x] backend/tests/acceptance/helpers/app.mjs（全文）
  - [x] backend/tests/acceptance/helpers/seed.mjs（全文）
  - [x] backend/tests/acceptance/tests/ac03-ac04-ac29-tasks-json.spec.mjs（差分）
  - [x] backend/tests/acceptance/tests/ac05-ac06-ac07-ac09-report.spec.mjs（差分）
  - [x] backend/tests/acceptance/tests/ac08-level-rule.spec.mjs（差分 + DAY1/DAY2）
  - [x] backend/tests/acceptance/tests/ac10-ac30-exhausted-external.spec.mjs（差分）
  - [x] backend/tests/acceptance/tests/ac11-ac13-storage.spec.mjs（差分）
  - [x] backend/tests/acceptance/tests/ac12-ac23-offline.spec.mjs（差分 + 全文の前半）
  - [x] backend/tests/acceptance/tests/ac14-ac16-redo-delete.spec.mjs（差分）
  - [x] backend/tests/acceptance/tests/ac17-ac18-ac27-a11y.spec.mjs（差分）
  - [x] backend/tests/acceptance/tests/ac24-stats.spec.mjs（差分）
  - [x] backend/tests/acceptance/tests/ac33-next.spec.mjs（全文）
  - [x] backend/tests/acceptance/tests/ac34-ac38-tasks-json-r8.spec.mjs（全文）
  - [x] backend/tests/acceptance/tests/ac35-ac37-done-screen.spec.mjs（全文）
  - [x] backend/tests/acceptance/tests/ac39-ac40-diagnosis-r8.spec.mjs（全文）
  - [x] backend/tests/acceptance/tests/design-d30-day-changed.spec.mjs（差分）
  - [x] backend/tests/acceptance/tests/design-d40-d44-next-note.spec.mjs（全文）
  - [x] backend/tests/acceptance/tools/screenshots.mjs（差分）
  - [x] docs/verification/001-daily-learning/evidence/r8-red-2.log（冒頭、集計行、96 件の最初の Error 行をすべて）
  - [x] docs/verification/001-daily-learning/evidence/r8-red.log（冒頭と集計：70 tests、34 failed、36 passed）
  - [x] docs/verification/001-daily-learning/test-plan.md（見出し一覧、2 章の AC-8/33/35〜38 の行、4 章、8 章、10 章、末尾の確かめ）
  - 呼び出し元として読んだもの：helpers/fixtures.mjs、helpers/check-seeds.mjs、global-setup.mjs、playwright.config.mjs（grep）、ac28-update.spec.mjs:60-65（blame）
- 規則として開いたもの（2026-11-05、リポジトリ内）：docs/prd/001-daily-learning.md r11 の 11（AC-1〜AC-40 全文）、contracts/test-hooks.md 全文、contracts/identifiers.md 全文、contracts/data.md 全文、contracts/strings.md 3 と 7、design/001-daily-learning.md の D-43 と 5.1 冒頭・#22〜#25、contracts/fixtures/strings/valid-ja.json、contracts/fixtures/seeds/ の 5 見本、docs/templates/review-report.md、docs/org/gates.md

### AC 対応表（AC 番号、テスト名、確かめている結果）
| AC | テスト（ファイル::名前） | 確かめている結果（要素の有無でなく値） | 判定 |
|---|---|---|---|
| AC-1、AC-2 | ac01-ac02-diagnosis（BASE から変更なし。`--list` で AC1_/AC2_ あり） | 3 区間 ≤500 ms、`task.today` ≤1,000 ms、area/level 一致 | 変更なし |
| AC-3 | ac03::AC3_課題集の全件が4要素を持ち所要時間が1〜15分 | tasks.schema に通る、4 要素 trim ≥1、1≤minutes≤15 | OK |
| AC-4（r11） | ac03::AC4_課題集は210件以上で初級と中級の12組が14件以上_上級の6組が7件以上_IDの重複が0件 | 全体 ≥210、組ごと 14/14/7、重複 [] | OK |
| AC-5（r8） | ac05::AC5_…_task.nextを押さない限りissuedは4のまま、::AC5_完了して答えずに再読み込みすると… | `task.rate`→`task.done`、再読み込み後も `task.done`、`data-stat-issued` が 4 のまま、履歴の行 report/helpful | OK |
| AC-6 | ac05::AC6_翌日には… | ID が過去と不一致、nth-today 1 | OK |
| AC-7（r8） | ac05::AC7_<too_hard/too_easy/no_time>…issuedは4のまま（3 本） | `task.skipped`、履歴の `data-report`/`data-task-id`、再読み込み後も `task.skipped`、issued 4 | OK |
| AC-8（10 通り目） | ac08::AC8_10通り目_中で同じ日に難しすぎ2件_task.nextで同じ日の次がbeginner | levelHint→next→nth 2 intermediate→levelChanged（文言 {level}=初級）→next→nth 3 `beginner`、再読み込みで同じ ID | OK |
| AC-9 | ac05::AC9_*（変更なし） | — | 変更なし |
| AC-10（r8） | ac10::AC10_初級を出し終えて<翌日/同日next>…、::AC10_上級を出し終えて…（4 本） | levelDone 文言 {area}{level}、advance 1/redo 1、advance 後 `task.today` level intermediate・area 同じ・ID 最小・nth、再読み込みで同じ ID；allDone 文言、advance 0、redo→同じ組→再び `task.exhausted` | OK |
| AC-11 | ac11::AC11_*（変更なし） | — | 変更なし |
| AC-12（r11 で AC-33 追加） | ac12::AC12_オフラインでもAC-1_AC-2_AC-5_AC-9_AC-33の操作が動き_送信は0件 | next ≤1,000 ms、2 件目 ID 違い・nth 2・組同じ、履歴 1 行、送信 0 | OK |
| AC-13（追加 2 本） | ac11::AC13_印のない保存データで今日の行がある日にtask.nextで…persistは1回…、::AC13_…advanceで…persistは1回 | `persist()` 回数 0→1→0、保存データの `device.persistRequested` true、`persistGranted` なし、`levels.backend` | OK |
| AC-14（2 通り目 r8） | ac14::AC14_今日の課題が出ている日に…完了してtask.nextを押すと同じ日に新しい領域の課題が出る | ID 同じ、area backend、完了 3 件、完了→next→area frontend/level beginner/nth 2、完了 4 件 | OK |
| AC-15、16、18〜23、25、26、28〜32 | 変更なし（`--list` に AC15_〜AC32_ あり） | — | 変更なし |
| AC-17（levelDone） | ac17::AC17_task.exhausted.levelDone_横スクロール0_… | levelDone 1、advance 1 の到達後に AC-17 の検査 | OK |
| AC-24（r11） | ac24::AC24_統計の11の値が期待どおりで_… | 11 値（issued 6、completed 4、week 2、extra 1 など）と文言 | OK |
| AC-27（2 変種） | ac17::AC27_task.exhausted.levelDone_…、::AC27_task.exhausted.allDone_…（7 本） | serious 以上 0 | OK |
| AC-33 | ac33::AC33_<task.done/task.skipped>からtask.nextで1秒以内に…（2 本） | ≤1,000 ms（ページ内計測）、ID 不一致、area/level 同じ、nth 2→3、issued 4→5→6、再読み込みで同じ ID、dialog/aria-modal 0 | OK |
| AC-34 | ac34::AC34_初級の全件がminutes10以下で6語が0件でexternalのtoolsがブラウザか開発者ツールを含む | minutes ≤10、6 語 0（空白除去・部分一致）、tools の全項目、初級 ≥84 の守り | OK |
| AC-35 | ac35::AC35_累計<6/10/29/99>で完了すると…（4 本）、::AC35_ja.jsonとen.jsonの全キーの値に…0件 | S4/S5/再読み込みで `data-stat-completed`、文言 `{count}`、`data-milestone`、cheer の文言が default と異なる、統計も同じ値；語 0 件（≥348 値） | 6 と 10 は OK。29 と 99 は seed の誤り（重大） |
| AC-36 | ac35::AC36_3件出した翌日の…indexが4でtotalが14で… | `data-progress-index` 4、`-total` 14、`task.progress` 文言 | OK |
| AC-37 | ac35::AC37_金曜にtask.nextで出た課題を完了すると…3でextraは1のまま_翌週の月曜は0 | `task.week` 属性 3 と文言、統計 week 3、extra 1、completed 5、11-09 で week 0 | OK |
| AC-38 | ac34::AC38_課題集の全件のinsightが…、ac35::AC38_task.todayでは…0件で…見え…、::AC38_難しすぎを申告した…0件 | 1〜120 cp・改行・` なし；S3 で 0 件かつ文書に insight の文字列なし、S4/S5/再読み込みで insight と一致、S6 で 0 | OK |
| AC-39 | ac39::AC39_1問目の6つの領域にarea.descの説明が見え_…、::AC39_幅320で… | 6 件の文言一致・可視・label 内、ja/en 1〜40 cp、scrollWidth ≤320 | OK |
| AC-40 | ac39::AC40_3問目の選択肢が5つでyears.neverのvalueがneverで_… | visible radio 5、value never 1、書き出しの `diagnosis.years` never、level は選んだまま | OK |
| design（AC にない） | DESIGN_D30_（h1 を levelDone に）、DESIGN_D40_ ×2、DESIGN_D43_ ×2、DESIGN_D44_ ×3 | data.md 5「S7 の変種と補足」と 9「組の最後」「段階が変わった」の値 | OK（名前は W-6 どおり） |

- 範囲外の変更：なし（差分は backend/tests/acceptance/ と docs/verification/001-daily-learning/ だけ。.claude/、.github/、backend/public/ に変更なし）

### 実行したコマンドと結果
- `cd backend/tests/acceptance && npx playwright test --list` → `Total: 219 tests in 23 files`、[chromium]/[webkit] 行 219。名前にある AC 番号：AC1_〜AC40_ の 40 個すべて。
- `npx playwright test tests/ac35-ac37-done-screen.spec.mjs tests/ac33-next.spec.mjs tests/ac34-ac38-tasks-json-r8.spec.mjs --project=chromium --reporter=line` → exit 1、`14 failed`、`1 passed (10.6s)`。各テストの最初の Error：AC38(JSON)「backend-beginner-001: insight がない」、AC34「tasks.schema.json：data/tasks/0 must have required property 'insight'」、AC35 10/29/99 と DESIGN_D43 非 reduce「目標の組 backend/intermediate が 7 件で、未出を残せない」、AC33 ×2「expect(received).toBe(expected)」（nth-today）、AC35 語「ja.json が strings.schema.json に通る：… 'area.backend.desc'」、AC36「toBe」、AC38(画面)「backend-intermediate-004 の insight」、AC35 6 と DESIGN_D43 reduce「settings.stats.daysCompletedWeek.value」、AC37「toHaveCount」。通ったのは AC38_難しすぎ…0件（古い実装でも 0 件のため）。
- 自分で書いた sim（/private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/sim-seed.mjs。初級・中級 14、上級 7 の合成課題集 210 件で helpers/seed.mjs を呼び、data.md 5 の選び方を当てた）の出力：
  - `n=10: levels={"backend":"intermediate"} helper.nextId=backend-intermediate-011 -> L=intermediate next=backend-intermediate-011 (候補 4)`
  - `n=29: levels={"backend":"advanced"} helper.nextId=backend-intermediate-014 -> L=advanced next=backend-advanced-003 (候補 5)`
  - `n=99: levels={"backend":"advanced","frontend":"advanced","database":"advanced"} helper.nextId=backend-intermediate-014 -> L=advanced next=null (候補 0)`
  - `seenNextSeed: levels={"backend":"beginner"} rows=16 -> 候補 0`、`nextDoneSeed: rows=28 -> 候補 0`、`beginnerDoneAtIntermediateSeed: levels={"backend":"intermediate"} rows=14 -> next=backend-intermediate-001 候補 14`（3 つは契約どおり）
- `node -e …backend/public/data/tasks.json` → 126 件、18 組すべて 7 件、insight あり 0 件（赤の理由の裏付け）
- `grep -rnE "waitForTimeout|pause\(|test\.skip|test\.fixme|\.skip\(|\.only\(|retries|backend/public|__test|getByText|toContainText|location\.search" backend/tests/acceptance/{tests,helpers,tools,playwright.config.mjs,global-setup.mjs}` → ac39:75 と ac28:52,80 の `toContainText`（文言ファイルの値との比較）、ac28:63 `pause(2000)`、playwright.config.mjs:18 `retries: 0`、tools/screenshots.mjs:61 `waitForTimeout(1000)` の 6 行のみ。skip / fixme / only / 実装の import：0 件。
- `grep -rnE "__test|[?&](reset|now|seed)=|location\.search" backend/public | wc -l` → 0（test-hooks.md 末尾の reviewer の確かめ）
- `git blame -L 60,65 15cbc84 -- …ac28-update.spec.mjs` → `pause(2000)` は a6facf48（2026-10-31、BASE より前）。`git blame -L 55,65 15cbc84 -- …screenshots.mjs` → `settleS4` の `waitForTimeout(1000)` は 15cbc84（この差分）。
- r8-red-2.log：`Running 219 tests using 5 workers`、`96 failed`、`123 passed (2.0m)`。落ちた 48 本 × 2 の最初の Error を awk で全件抽出し、上の 4 種に分類。`grep -nE "SyntaxError|Cannot find module|ERR_MODULE_NOT_FOUND|ReferenceError|Test timeout of"` → 0 件。AC40 の失敗は `locator('input[type="radio"]').visible()` Expected 5 / Received 4（visible の radio が数えられていることの確認）。
- r8-red.log：`Running 70 tests`、`34 failed`、`36 passed`。
- `git diff 9dcd77f...15cbc84 -- docs/verification/001-daily-learning/test-plan.md` を読み、10 章の「テストの誤りで落ちたものは 0 件」の記述を確認（上の要修正）。
- 開いた URL：なし（この観点で Web の規則は使わない。規則はすべてリポジトリ内の PRD、design、contracts を 2026-11-05 に開いた）
- 未検証：なし（WebKit では自分で動かしていないが、r8-red-2.log の WebKit 48 件の最初の Error が Chromium と同じ理由であることを全件読んで確かめた。seed の誤りは Node の sim で両エンジンに依らず再現した）

## 記録
- 関門：G2（受け入れテスト）
- 判定した役：reviewer（テスト）
- 回：r2（r1 は FB 前の周回。FB 1 回目の作り直しで 1 回目）
- 対象：feat/001-daily-learning、9dcd77f...15cbc84
- 日付：2026-11-05
