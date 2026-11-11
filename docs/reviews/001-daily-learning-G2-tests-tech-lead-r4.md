# 001-daily-learning G2 受け入れテスト tech-lead r4（FB 1 回目の作り直しで 1 回目。9dcd77f...15cbc84）

FAIL

AC-35 の 29→30 と 99→100 の 2 通り（2 ブラウザで 4 本）が、正しい実装に対しても緑になりません。原因は seed を作る helpers/seed.mjs の completedSeed です。これ以外のつなぎ口、識別子、文言キー、差し込み、data.md 4・9・11、予算の期待値はおおむね契約どおりでした。

## 指摘
- **重大**　backend/tests/acceptance/helpers/seed.mjs:236-237
  - 何が問題か：completedSeed の `for (const t of otherRows) levels[t.area] = t.level;` が、目標の領域 `backend` の `levels` まで上書きしています。
  - 起きること：14/14/7 の構成（v1 の 210 件と同じ）で作って確かめました。
    - n=29：他の組の行は 16 件で、`backend-beginner-*` 14 件と `backend-advanced-001〜002` です。`levels.backend` が `advanced` になり、data.md 5 の選び方では `backend-advanced-003` が出ます。テストが待つのは `backend-intermediate-014` です。
    - n=99：`levels` が `{"backend":"advanced","frontend":"advanced","database":"advanced"}` になります。backend の上級 7 件を出し終えているので S7 になり、`task.today` を待つ所で落ちます。
  - 影響：AC35_累計29 と AC35_累計99（AC-35 の確かめ方が求める節目の 30 と 100）、tools/screenshots.mjs:291 と 298 の S4_task.rate_at30 と S4_task.rate_at100 は、実装が正しくても合格しません。
  - 赤で見つからなかった理由：今の tasks.json は 126 件の旧版で、中級は 7 件です。そのため r8-red-2.log では手前の「未出を残せない」で止まり、この誤りが隠れました。
  - 根拠：test-hooks.md W-7「AC-35 の seed」（目標の組は `backend`、`intermediate`。上書きするのは「他の領域」の `levels`）、data.md 5。
  - 直す方向：`t.area !== area` の行だけ `levels` を書きます。あわせて、作った seed に data.md 5 の選び方を当てた結果が `nextId` と同じことを、seed の中か呼び出し側で確かめます。
- **要修正**　backend/tests/acceptance/helpers/seed.mjs:28（injectSeed）と docs/verification/001-daily-learning/test-plan.md:157
  - 何が問題か：W-7 は「テストは seed を入れる前に、各 `taskId` が課題集にあり、行の `area` と `level` が ID の `<領域>-<段階>` と同じことを確かめ、違えば落とす」と決めています。この確かめはどこにもありません。injectSeed がするのは ajv だけです。test-plan:157 は helpers/check-seeds.mjs が確かめると書いていますが、check-seeds.mjs は tasks.json を読みません。
  - 直す方向：injectSeed（か、それを呼ぶ前の共通の関数）で本番の tasks.json の ID と `<領域>-<段階>` を照らします。わざと課題集にない ID を入れるテストだけ、注釈付きで外す引数を設けます。
- **要修正**　backend/tests/acceptance/tests/ac35-ac37-done-screen.spec.mjs:140-146（DESIGN_D43_reduceでないとき…）
  - 何が問題か：「完了の演出の確かめ方」は、`task.total.value` のテキストが S4 に着いた直後に読んだ時点で最終の値であることを求めています。`page.evaluate` で読んでいるのは `data-stat-completed` だけです。テキストは後の `toHaveText` で読んでおり、これは繰り返し待つので、文字が数え上げる演出でも合格してしまいます。
  - 直す方向：同じ evaluate の中で `textContent` も読み、`fill(ja['task.total.value'], { count: 11 })` と比べます。
- **提案**　backend/tests/acceptance/helpers/check-seeds.mjs:11、13
  - 何が問題か：`<=` で「同じ日付の行」と「最後の行と同じ日の current」を誤りにしています。data.md 8 は 2026-11-05 から、どちらも認めています（contracts/tools/check-schemas.mjs は `<`）。今の seeds/ 10 件には当たる行がないので、結果は変わりません。
  - 直す方向：check-schemas.mjs の semantic とそろえます。
- **提案**　helpers/seed.mjs の completedSeed、seenNextSeed、nextDoneSeed、beginnerDoneAtIntermediateSeed
  - 何が問題か：課題集が 210 件版になるまで、赤の実行ではこれらの関数が動きません。
  - 直す方向：14/14/7 の合成の課題集に当てる小さな自己検査（seed がスキーマに通り、data.md 8 を守り、選ばれる ID と組が期待どおりか）を、check:seeds と同じ形で置きます。下の自分のスクリプトがその形です。
- **提案**　backend/tests/acceptance/tests/ac33-next.spec.mjs:57
  - 何が問題か：2 件目と 3 件目の ID は「過去と違う」しか見ていません。
  - 直す方向：W-7「次に出る ID の期待値は data.md 5 を本番の課題集に当てて求める」に合わせ、期待の ID（seed-ac14 からは 004 → 005 → 006）とも比べると、選び方の誤りも見つかります。
- **提案（tech-lead の側の直し。今回は書いていません）**　contracts/test-hooks.md:70
  - 何が問題か：「他の領域の行を入れるときは、その領域の `levels` に…」は、同じ領域の別の段階の行の扱いを書いていません。それが上の重大の一因です。
  - 直す方向：次の契約の更新で「目標の領域の `levels` は目標の段階のまま」と足します。指揮役が判断してください。

## 証拠
- 対象：9dcd77f...15cbc84。`git diff --name-only` の 21 ファイルはすべて読みました。
  - 全文：helpers/seed.mjs、helpers/app.mjs、ac08、ac10-ac30、ac11-ac13、ac14-ac16、ac24、ac33、ac34-ac38、ac35-ac37、ac39-ac40、design-d40-d44
  - 差分：ac03、ac05、ac12、ac17、design-d30
  - grep で見た所：tools/screenshots.mjs の S4 の行
  - 要約と失敗の理由：r8-red.log、r8-red-2.log
  - 関係する節：test-plan.md
- 観点の表

| 観点 | 結果 |
|---|---|
| 1. つなぎ口（W-1〜W-16） | 合う。seed は addInitScript と印 `test:seeded`、時刻は setFixedTime、拒否の注入は persist と persisted の両方、保存データは getItem 1 回で読む |
| 1. 時間の計り方 | 合う。AC-33 は回ごとに task.next の click から task.today の記録まで計り、再読み込みの後に armTiming を入れ直している。AC-12 は同じ文書の仕掛けを使う |
| 1. 完了の演出 | reduce の側は合う（getAnimations 0、task.total.prev 0、task.rate.mark 1）。screenshots.mjs:57-62 も 1 秒待ってから prev が 0 件かを見ている。reduce でないときのテキストは上の要修正 |
| 1. W-7 の seed | ID を課題集と照らす確かめは要修正。AC-35 の seed の作り方は重大 |
| 2. 識別子 | テストが使う data-testid 91 個は、すべて identifiers.md の 3（文言キー 174 から例外 5 を除いたもの + 文字を持たない要素）にある。data-* 属性もすべて identifiers.md にある。要素は表示の文字でなく識別子で探している |
| 2. 差し込み | fill の差し込み名は strings.md 3 の表の 26 キーと合う。素朴な正規表現で出た食い違い 10 件は、`${AREA}` と省略記法 `{ count }` の読み違いで、grep で 1 件ずつ見て合っていた |
| 3. AC-24 | 11 値とも data.md 9 どおり。開いた状態は task.skipped で issued 6 |
| 3. AC-33 | issued は 4 → 5 → 6。再読み込みは 6-2 で task.today のまま |
| 3. AC-35 | 6 と 10 は合う。29 と 99 は重大 |
| 3. AC-36 | index 4、total 14 |
| 3. AC-37 | 11-06 は week 3、extra 1、completed 5。11-09 は week 0 |
| 3. AC-13 の新しい 2 本 | data.md 11 どおり。task.next と advance の保存に印が入り、persist は 1 回。S7 では呼ばず、再読み込みでは 0 回 |
| 3. AC-8 の 10 通り目 | levelHint → levelChanged（{level} は初級）→ beginner。nth は 3 |
| 3. 6-2 と 6-3 の入れ替え | AC-14 の 2 通り目は 11-04、AC-13 の新しいテストは 11-03 で task.done、DESIGN_D44 は 11-03 で task.done。どれも入れ替えの後の契約どおり |
| 4. seed の関数 | seenNextSeed、nextDoneSeed、beginnerDoneAtIntermediateSeed、completedSeed(n=10) は data.schema と data.md 8 を満たし、期待の状態になる。completedSeed の n=29 と 99 は重大 |
| 5. 予算 | BUDGET2_ は 480 字と 105,000 バイト。AC-4 の下限は 14/14/7 と 210 件。budgets.md 2 と W-6 に合う |
| 赤の理由 | r8-red-2.log は 96 failed（48 本 × 2 ブラウザ）、123 passed。失敗の理由は要素や属性がない、キーがない、tasks.json に insight がなく 126 件、で「まだない」に当たる。ビルドや import のエラーは 0 件 |

- 実行したコマンドと結果
  - `cd backend/tests/acceptance && npx playwright test --list`：`Total: 219 tests in 23 files`。AC1〜AC40 はすべてテストの名前にある（ないものは 0 件）。BUDGET2_ は 4 本、DESIGN_ は 32 本。
  - `node <スクラッチパッド>/seedcheck.mjs`：14/14/7 の合成の課題集で各関数を作り、スキーマと data.md 8 と W-7 の ID の規則、data.md 5 の選び方を当てた。
    - `completedSeed n=10: levels={"backend":"intermediate"} helper.nextId=backend-intermediate-011 app-would-pick=backend-intermediate-011`
    - `completedSeed n=29: levels={"backend":"advanced"} helper.nextId=backend-intermediate-014 app-would-pick={"L":"advanced","next":"backend-advanced-003"}`
    - `completedSeed n=99: levels={"backend":"advanced","frontend":"advanced","database":"advanced"} helper.nextId=backend-intermediate-014 app-would-pick={"L":"advanced","next":"(S7)"}`
    - seenNext：levels beginner、16 行、S7、中級の未出 12、data.md 8 の誤り 0。nextDone：28 行、S7、誤り 0。beginnerDoneAtIntermediate：次は backend-intermediate-001、誤り 0。
    - seeds/ の 10 件と contracts/fixtures/seeds/ の 8 件は、どれも W-7 の ID の規則と data.md 8 で OK。
  - `node <スクラッチパッド>/ids.mjs`：`testids used: 91`、`not in contract: none`、`data-* attrs not in identifiers.md: []`、valid-ja の差し込みのあるキーは 26。
  - `npm --prefix backend/tests/acceptance run check:seeds`：`seed 10 件、期待と違う結果 0 件`。
  - `grep -rn '\.exists'` は 0 件。`grep -rnE "__test|location\.search" backend/public` も 0 件。
  - 本番の tasks.json はまだ 126 件で、どの組も 7 件（node で数えた）。
  - スクリプトは /private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/seedcheck.mjs と /private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/ids.mjs です。
- 読んだ契約：contracts/test-hooks.md、data.md、identifiers.md、strings.md、budgets.md（1〜5）、tools/check-schemas.mjs、docs/prd/001-daily-learning.md の AC-8〜AC-15 と AC-24〜AC-40、docs/org/gates.md の G2、docs/templates/review-report.md。
- 開いた URL：なし。
- 未検証
  - 本物の 210 件版の tasks.json が、まだリポジトリにありません。そのため seed の関数は合成の課題集でしか動かしていません（組の件数と ID の付け方は W-6 と W-7 の決まりで作りました）。
  - 受け入れテストを、正しい実装に対して動かしてはいません（実装がまだないため）。

## 記録
- 関門：G2（受け入れテスト）
- 判定した役：tech-lead
- 回：r4（r1〜r3 は FB 前の周回。FB 1 回目の作り直しで 1 回目）
- 対象：feat/001-daily-learning、9dcd77f...15cbc84（backend/tests/acceptance/、docs/verification/001-daily-learning/）
- 日付：2026-11-05
