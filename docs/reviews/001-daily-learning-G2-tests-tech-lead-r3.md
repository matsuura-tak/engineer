PASS

結論：重大は 0 件で、通してよいです。要修正が 1 件（AC-27 の 7 本目の名前）、提案が 4 件あります。
実装 1990cad の上で全 145 本を自分で動かし、すべて合格しました。変わったテスト 10 本を 5 回ずつくり返したときも 100/100 で、揺れは見つかっていません。

## 指摘
**重大**：なし

**要修正**
- 対象：`backend/tests/acceptance/tests/ac17-ac18-ac27-a11y.spec.mjs:3`、`:55-64`、`:173` と、`docs/verification/001-daily-learning/test-plan.md:59`、`:81`、`:92`
- 何が問題か：AC-27 の 7 本目 `AC27_task.today.dayChanged_…` が、自分たちで決めた名前の付け方と合っていません。
  - PRD の AC-27 の Given は「6 つの画面」です。知らせのある S3 は、design の 2 の表の下で「AC にない状態」とされています。
  - test-plan.md:79 では「知らせだけが落ちたときに AC-32 を FAIL にしないため `DESIGN_D30_` にした」と決めています。ところがこの 7 本目だけは `AC27_` の名前です。
  - このままだと、知らせの色（color.warning）のコントラストだけが落ちたときに、PRD の 6 画面は合格していても、G3 の表で AC-27 が FAIL になります。
- 直す方向：監査そのものは残します（role=status と color.warning の文字を監査する価値があるため）。名前を `DESIGN_D30_task.today.dayChanged_axe-coreでserious以上の違反が0件` に変え、ループから外して単独のテストか design-d30-day-changed.spec.mjs に移します。test-plan の 2 章では AC-27 の行を 6 本に戻し、design の表に 1 行足します。

**提案**
1. 対象：`ac11-ac13-storage.spec.mjs:53`、`:64`、`:87`。`persist()` の回数を読む時点に隙があります。自分で変異を入れて確かめました（下の証拠）。
   - (a) 遅れて呼ぶ実装（翌日の S3 で 2.5 秒後）は通ってしまいます。verifier が書いていた「理論上の隙」が実際にあることを確かめました。
   - (b) verifier が書いていない隙がもう 1 つあります。初日に 1.5 秒遅れて 2 回目を呼ぶ実装も通ります。`expect.poll(...).toBe(1)` は「1 に届いた」ことしか見ず、「1 のまま」かは見ていないためです。
   - 今の実装は描いた直後に同期で呼んでいます（`backend/public/js/main.js:187-188`）。そのため、今の実装を間違って通してはいません。
   - 直す方向：`:64` の `page.reload()` の直前（申告と評価の後）に `expect(await readPersistCalls(page)).toBe(1)` を足すと、(b) の隙が約 1 秒以上に広がります。(a) は時間を区切る限り残るので、test-plan の 9 章に「遅れて呼ぶ実装は G3 の reviewer がコードで見る」と書けば足ります。
2. 対象：`ac31-ac32-zero-ops-answer.spec.mjs:119-120`。AC32 の 4 本目は、`task.answer.saved` を待って保存が済んでから日付を変えています。
   - そのため、data.md の 4 の 1（保存前の欄の値をメモリに持ち、その 1 回の保存に含める）の経路を通りません。
   - 直す方向：答えを入力して保存を待たずに日付を変えて押し、`none` の行の `answer` が入力した値になることを確かめる 1 本を足します（`DESIGN_` か AC32）。保存のタイマーが先に動いても結果は同じ値なので、正しい実装が落ちることはありません。
3. 対象：`helpers/seed.mjs:95-98`（`readStoredData`）。読んだ値を `assertValid('data', …)` に通すと、印のほかに形の崩れも見つけられます。
4. 対象：`contracts/test-hooks.md` の W-9 と W-6（tech-lead が自分で直すもの。別の設計の作業として）。
   - W-9 の「保存データの印」を、どう読むか（`page.evaluate` で `localStorage.getItem('kyounoitte:data')` を読むだけ）を明記します。
   - W-6 の `BUDGET2_` と同じように、`DESIGN_` の接頭辞も契約に 1 行書きます。

## 見てほしい点への答え
1. 契約とつなぎ口どおりか：はい。
   - 新しいテストが使う data-testid の 17 個は、すべて identifiers.md か strings.schema.json にあります（下の証拠）。
   - 時刻は W-3（読み込まずに `setFixedTime` を呼び直す）、拒否の注入は W-9（`persist` と `persisted` の両方）どおりです。
   - 有無だけを見る確かめはありません。結果まで見ています：保存データの `device`、書き出しの `history` と `current`、S10 の行の `report` と `helpful`、`document.activeElement`、文書順（compareDocumentPosition）、回数。
2. `DESIGN_` と AC32 に結び付けた判断：妥当です。
   - PRD 11 の冒頭が、前日の答えが `none` の行に残ることを「（AC-32）」と参照しているので、データの結果は AC32 にしてよいです。
   - 知らせの要素は design の 97 行目で「AC にない状態」とされているので `DESIGN_` が正しいです。
   - AC-27 の 7 本目は、監査は残し、名前だけ `DESIGN_D30_` に変えます（上の要修正）。
3. `readStoredData` は契約の範囲内です。
   - W-9 は「確かめるのは、上の回数、保存データの印、S8 の表示」と書いています。
   - 書き出しには `device` が入らない（W-9）ので、印は localStorage を読むほかに見る方法がありません。
   - 保存の形は data.schema.json で決めた公開の契約なので、実装の中を覗くことには当たりません。読むだけで、アプリの側につなぎ口もありません。
4. 揺れ：時刻の固定は W-3 どおりで、フォーカスは `expect.poll` で待っています。5 回のくり返しで落ちたものは 0 です。理論上の隙は提案 1 のとおり実際にありますが、今の実装を間違って通してはいないので、重大ではありません。
5. 自分で動かした結果：全 145 本が合格しました（下の証拠）。

## 前回の指摘の追跡
該当なし（今回は r2 の後の新しい変更の判定です。r2 の要修正「時間の計り方」で直したところは、今回の差分で変わっていません）。

## 証拠
- 対象：`b9b37e1...139d2d2 -- backend/tests/acceptance docs/verification`。観点は「テストが契約とつなぎ口どおりか」。実装は 1990cad の上で動かしました。すべて読んだファイル：
  - README.md
  - helpers/seed.mjs
  - tests/ac11-ac13-storage.spec.mjs
  - tests/ac17-ac18-ac27-a11y.spec.mjs
  - tests/ac31-ac32-zero-ops-answer.spec.mjs
  - tests/design-d30-day-changed.spec.mjs
  - evidence/r6-red.log（失敗の行と理由）
  - test-plan.md（変わった行）

  tools/screenshots.mjs は testDir の外なので、差分の量だけを見ました。
- 観点の表：

  | AC / 名前 | テスト | つなぎ口 | 確かめている結果 |
  |---|---|---|---|
  | AC-13 | AC13_persistを断られても… | W-9 の拒否（persist と persisted）、W-3、readStoredData | 初日の回数が 1。`device.persistRequested` が true で、`persistGranted` がない。task.done で履歴 1 件、notPersisted、export 1 件。同じ日の再読み込みで 0。翌日の S3 から S8 まで進んで 0、印は true のまま |
  | AC-32 | 翌日に開くと…（既存） | W-3、W-7、W-9 の書き出し | 既存の結果に加えて、`task.dayChanged` が 0 件 |
  | AC-32 | 画面を開いたまま翌日になった後に…（新規） | W-3（読み込まない） | task.rate に進まない。別の ID で答えの欄が空。再読み込みしても同じ ID。書き出しで前日の行は none の 1 行だけ、answer は 200 字、current は 11-05 |
  | AC-27 | AC27_task.today.dayChanged（新規） | W-3、W-7 | axe で serious 以上が 0 件。名前は要修正 |
  | D-30 | DESIGN_D30 ×3 | W-3、W-7、W-4（本番の課題集） | 件数 1、role=status、文言が ja の値、activeElement、文書順で先頭。入力で消えず、app.name と再読み込みで消える。S4 の評価は helpful が unanswered の 1 行のまま。S7 は none の行で、done の行の数は seed と同じ |
  | U-15 | DESIGN_U15 | W-3 | 3 問目へそのまま進む。知らせは 0 件。firstOpenDate は 11-03、completedOn と current.date は 11-04、history は [] |

- 読んだファイル：
  - contracts/test-hooks.md 1-135 行（W-3、W-7、W-9、時間の計り方）
  - contracts/data.md 1-82 行、155-179 行（2、3、4、11）
  - contracts/identifiers.md 1-70 行
  - docs/prd/001-daily-learning.md 154-165、256-262、340-346、370-376 行
  - design/001-daily-learning.md（54、97、107、111、149、162、166、261、459 行）
  - backend/tests/acceptance/helpers/app.mjs、helpers/seed.mjs、global-setup.mjs、playwright.config.mjs
  - docs/reviews/001-daily-learning-G2-tests-tech-lead-r2.md の冒頭
  - 回数の読み方を評価するためだけに、backend/public/js/persist.js と main.js の 175-205 行
- 実行したコマンドと結果（どれも `backend/tests/acceptance` で実行。出力はスクラッチパッド）：
  - `npx playwright test --list`
    - 結果：`Total: 145 tests in 17 files`（@playwright/test 1.64.1）
  - `npx playwright test --retries=0 --reporter=list --output=<scratch>/pw-out`
    - 結果：`145 passed (34.2s)`、終了コード 0
    - ログ：/private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/full-run.log
  - 変わったテスト 4 ファイルを `-g "AC13_|AC32_|DESIGN_|dayChanged" --repeat-each=5 --retries=0`
    - 結果：`100 passed (33.6s)`
    - ログ：/private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/repeat.log
  - 変異の確かめ（リポジトリの外）：`node scripts/build.mjs --out <scratch>/m{1,2,3}/dist --version 2026-11-04.1` の main.js の `if (r.askPersist) askPersist();`（3 か所）を書き換え、`KYOUNOITTE_DIST=<scratch>/mN/dist npx playwright test tests/ac11-ac13-storage.spec.mjs -g AC13_` で AC-13 を動かした結果：

    | 変異 | 結果 | 意味 |
    |---|---|---|
    | m1：今日の課題を出すたびに呼ぶ | 2 failed（`翌日の S3 の後の persist() の回数` が Expected 0、Received 1） | 求め直しを見つけられる |
    | m2：翌日の S3 で 2.5 秒遅れて呼ぶ | 2 passed | 提案 1 (a) の隙 |
    | m3：初日に 1.5 秒遅れて 2 回目を呼ぶ | 2 passed | 提案 1 (b) の隙 |

  - testid の照合：差分で足された `tid(page, '…')` などに出る 17 個を、identifiers.md と strings.schema.json で grep しました。0 件のものはありませんでした（`task.dayChanged` は 5、`task.today.label` は 4、`app.name` は 3 など）。
  - `grep -rnE 'getByText|getByLabel|hasText|waitForTimeout|\.only\(|\.skip\('`（design-d30-day-changed.spec.mjs、helpers/seed.mjs）
    - 結果：0 件
  - r6-red.log：16 failed、129 passed。落ちた理由は次の 4 つで、どれも新しい振る舞いや新しいキーが「まだない」ことです。ビルドや import の失敗は 0 件でした。
    - `device.persistGranted は書かれない`（古い実装が書いていた）
    - i18n/ja.json に `task.dayChanged` がない（AC26。契約の 146 キー）
    - `task.dayChanged` の件数が 0
    - `data-question-index` が 2 のまま（U15）
  - `git status --short`：前からあった `.agents/`、`.codex/`、`AGENTS.md` だけ。リポジトリのファイルは書いていません。テストの出力は `--output` でスクラッチパッドに置き、ビルドは global-setup の一時フォルダとスクラッチパッドに出しました。
- 開いた URL と確認した日付：なし（2026-11-04 にリポジトリの中だけで判定しました）
- 未検証：なし

## 記録
- 関門：G2（受け入れテストの変更）
- 判定した役：tech-lead
- 回：r3（前回は r2）
- 対象：b9b37e1...139d2d2（backend/tests/acceptance、docs/verification）。実装 1990cad の上で実行
- 日付：2026-11-04
