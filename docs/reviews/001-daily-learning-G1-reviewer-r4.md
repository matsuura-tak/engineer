# 001-daily-learning G1 reviewer r4（観点：設計。FB 2 回目。308603a...cc3953a）

PASS

## 指摘
重大と要修正はありません。r3 の指摘はすべて直っていました（下の追跡の表）。この回で新しく見つけた重大もありません。以下の提案は判定に数えません。

### 提案
1. 提案。docs/prd/001-daily-learning.md:383 の AC-23 の Then（指示書の 3）
   - 何が問題か：3 通り目の Then は「状態は `task.exhausted` のまま」です。契約では、読み替えた後も S2（`diagnosis.question`）のままで、そこに `error.tasks.offline` と `task.next.retry` を出します（contracts/test-hooks.md:190〜191）。
   - 食い違いとは見ません。PRD:233 は「状態は操作の前のまま（`task.exhausted` など）」と書いています。AC-23 の Given（:381）も「読み替える。期待値は同じ」と書いています。読み替えた後の操作は `diagnosis.finish` なので、「操作の前」は S2 です。契約は :233 の決まりのとおりです。
   - 直す方向：PRD を直す必要はありません。ただし G3 の AC の表で、Then の字面と比べて揉める余地が残ります。pdm に、AC-23 の Then へ「6 領域に分けたときは S2 のまま」の 1 文を足してもらうのが安全です。足さない場合は、検証レポートに読み替えの根拠（:233、:381）を書けば足ります。
2. 提案。contracts/data.md:238 と data.md の 7（読み込み）
   - 何が問題か：`levelStart` が「行数以下」「levels にある領域だけ」という決まりは、check-schemas.mjs が見本で確かめるだけです。アプリが起動するときと読み込むときに、この決まりで弾くのか、そのまま受け入れるのかが書かれていません。
   - 影響：行数より大きい値の手書きのファイルを読み込むと、規則が黙って効かなくなります。クラッシュやデータが消えることはありません。
   - 直す方向：data.md の 7 に、どちらの扱いにするかを 1 行で書きます（読めないとして弾くか、そのまま使うか）。
3. 提案。contracts/dependencies.md:11（この差分の外の行）
   - 何が問題か：「承認は G1 の reviewer の反論の後」が残っています。ADR 0007:3 は「承認」、docs/approvals/delegation.md の 2026-11-08 の行は「r4 で反論が残らなければ確定」です。
   - 直す方向：この PASS を受けて、文言を「承認（2026-11-08）」にそろえます。
4. 提案。design/001-daily-learning.md:198 の S0 error (3) に h1 を置かないこと（指示書の 4）
   - 受け入れられると判断しました。理由は 3 つです。
     - AC-27 の Given（PRD:405）の 8 画面に S0 error は入っていません。
     - verification.md:202 の axe の設定は、タグ wcag2a、wcag2aa、wcag21a、wcag21aa です。
     - `page-has-heading-one` のタグは `["cat.semantics","best-practice"]` で、WCAG のタグではありません。受け入れテストのフォルダの axe-core 4.14.0 で自分で確かめました。
   - 文は `<p role="alert">` で読み上げられ、操作は 1 つだけです。
   - 直すなら、新しいキーを足さずに描いた時点で `task.next.retry` にフォーカスを移す形です（任意）。

## 前回の指摘の追跡（r3）
| 前回の指摘 | 直った / 直っていない | 証拠 |
|---|---|---|
| 重大 1：W-17 の #56 が data.md:47（今日の `current` は残る）とぶつかる | 直った | 入口が S7 の `task.exhausted.redo` に変わりました。seed は「出し終えた」形で、今日の `current` も今日の行もありません（test-hooks.md:187）。S3 から入る形は使わないと明記しています（:188）。手順 4 の期待は data.md:48 の 2 つ目（新しい組から選ぶ）と同じで、`data-task-id` は最小の ID、`issued` は行数 + 1 です（:191。数え方は data.md:245 の「行数 + current」と一致）。設計メモの AC-23 の行と design:268（#56）も同じ形でした |
| 要修正 2：段階の規則の穴 | 直った（決定 (a)） | 2 の表の保存（data.md:24、:31、:123〜124）、規則の 3 つ目の止まる行（:159〜163）、:168〜171、:238、スキーマの `levelStart`、ADR 0002:40〜73、:160。模型の結果は下の証拠。13 件すべて OK でした |
| 要修正 3：AC-44 で数える区間 | 直った | test-hooks.md:178。`goto` の前から数え始め、`task.today` を確かめてから 0 件を数えます |
| 要修正 4：1,200 字の根拠の数 | 直った | budgets.md:41〜46。計算を自分でやり直しました。69,313 ÷（210 × 391.6）= 0.843。1,200 × 0.845 + 150 = 1,164、× 1.08 ≒ 1,257。21 件で 26,397、28 件で 35,196、42 件で 52,794 です。どれも文中の値（約 26,500、35,300、52,900）と合います。「252 件版で約 41,000」の文は取り消されています |
| 要修正 5：受け入れテストの前の `cd backend && npm ci` | 直った | ADR 0007:3、:66〜71（ADR 0004 の案 A とは向きが違うことへの答え、分かる文で止める）、test-hooks.md:9〜11、CLAUDE.md:20〜21、ADR 0004 の追記 |
| 要修正 6：S0 error の 3 つ目が design と ADR 0006 にない | 直った | design r14 の :109、:198、D-61、5.1 の #76、7 の表（新しいキーなし、194 キーのまま）。ADR 0006:18（3 か所）と、中身と反論への答えを直した。identifiers.md:21 の 3 つの変種とも一致 |
| 要修正 7：CLAUDE.md:10、:61 | 直った | CLAUDE.md:10、:45（A 150,000、B 400,000、1 ファイル 50,000、平均 1,200）。63 行で 100 行以内 |
| 提案：test-hooks.md の古い行（既存） | 直った | 件数 126 と 7 件の組（:49〜50）、例の名前（:53）、`task.report.done` → `task.choice` の 3 回（:166）、300 ms のタイマー（:27）、6 件、5 件、7 件（:136、:145、:159〜160） |
| 提案：「課題を選ぶときだけ待つ」 | 採らない理由が書かれた | data.md:104〜107、ADR 0006。下の反論の 4 で、理由が成り立つことを確かめました |
| 提案：A にミル 3 枚 | 直った | budgets.md:9、:19、:21、:24〜25。32,000 + 10,000 + 4,000 + 1,800 + 50,000 = 97,800、余りは 52,200 で計算が合います |
| 提案：ADR 0007 の状態 | 直った | ADR 0007:3 は「承認（委任）」、CLAUDE.md:37。dependencies.md:11 だけが古い（提案 3） |

## 証拠
- 対象：308603a...cc3953a、観点は設計（G1、FB 2 回目の r4）。`git diff --name-only` の一覧（18 件）と読んだ印は次のとおりです。
  - [差分を全部] CLAUDE.md
  - [差分を全部] contracts/budgets.md
  - [差分を全部] contracts/data.md
  - [中身を node で全行出した] contracts/fixtures/data/invalid-level-start-beyond-history.json
  - [中身を node で全行出した] contracts/fixtures/data/invalid-level-start-negative.json
  - [中身を node で全行出した] contracts/fixtures/data/invalid-level-start-without-levels.json
  - [中身を node で全行出した] contracts/fixtures/data/v1/valid-level-start-after-redo-advance.json
  - [全文] contracts/fixtures/seeds/seed-ac8-10-restart-after-redo-advance.json
  - [差分を全部] contracts/schemas/data.schema.json
  - [差分を全部] contracts/test-hooks.md
  - [差分を全部] contracts/tools/check-schemas.mjs
  - [差分を全部。単語単位の差分でも確かめた] design/001-daily-learning.md
  - [差分を全部] docs/adr/0002-storage-localstorage-single-key.md
  - [差分を全部] docs/adr/0004-acceptance-test-setup.md
  - [差分を全部] docs/adr/0006-task-set-split-by-area.md
  - [差分を全部] docs/adr/0007-bundle-js-with-esbuild.md
  - [差分を全部] docs/adr/features/001-daily-learning.md
  - [差分を全部] docs/approvals/delegation.md
  - 差分の中に、エージェントへの指示のような文はありませんでした（grep で確かめた）。
- AC 対応表：PRD と、design の 2 の表を除く AC の行は、この差分で変わっていません（docs/prd/ は差分にありません）。r3 の 44 行の判定を引き継ぎます。変わった行だけを書きます。operationId はどれも「なし（端末のみ）」です。
  - AC-8：data.md の 5（止まる行の 3 つ目は `levelStart`）、2 の表、seed 11 件で満たせます。模型で確かめました。
  - AC-23：1・2 通り目は r3 と同じです。3 通り目は S7 → S2 → S3（test-hooks.md:187〜191、design:268）で満たせます。Then の字面については提案 1。
  - AC-44：test-hooks.md:178 で区間が決まりました。
  - AC-14：2 通り目の完了の手順が r13 の操作（`task.choice` を 3 回）になりました（:166）。
- エンドポイントの表：r3 と同じです（入口は 4 つ、空欄なし、他人のデータに届く入口なし）。変わったのは 1 か所です。localStorage `kyounoitte:data` の「何を確かめるか」に `levelStart` が入りました。スキーマで 0 以上の整数、6 領域の enum だけを確かめ、「なし」の区分では空です（data.schema.json の allOf の 3 つ目）。行数以下は書き手の決まりです（提案 2）。
- 元に戻しにくい判断への、いちばん強い反論（指示書の 2）：
  1. `levelStart` の形（行の番号。L1）
     - 反論：配列の位置に意味を持たせると、行を消す、並べ替える、まとめる機能を将来作ったときに黙って壊れます。
     - ADR 0002:73 に、その場合の見直す条件があります。data.md:291 によると履歴は 18,000 行を上限に増えるだけで、削る処理がないので、今は番号がずれません。
     - 「版 1 を 3 回変える」という反論には、任意の項目で、前の正しいデータもそのまま通ると答えています。2026-11-08 の curl は 404 で、未公開です。受け入れます。
     - 同じ段階を選び直したときは数え直しません。これは PRD:216 の「段階が変わった後は」の字面どおりです（模型のケース 3）。
  2. 書く時機
     - 書くのはやり直しで段階が変わったときと advance だけで、規則で段階が動いたときは `levelChange` が同じ役をします。
     - 段階を変える操作がこの 3 つしかないことは、data.md の 2 の表で確かめました。日付が変わったときの移し、skip、next、読み込み、削除は `levels` を変えません。
  3. 検査
     - check:contracts で、3 件の invalid が意図した理由で落ちます。負の数はスキーマで落ち、行数を超える値と levels にない領域は意味の検査で落ちます。valid と seed は通ります（下の出力）。
  4. 「課題を選ぶときだけ待つ」を採らなかった理由
     - data.md:48 では、今日の `current` があるやり直しの後は前の課題のまま S3 になり、その後の `task.next` は新しい `diagnosis.area` から選びます（:125）。
     - S2 で待たないと、`task.next` が新しい領域のファイルを初めて読む操作になり、:109 の「取り直さない」が崩れます。理由は成り立ちます。
     - 悪い結果（オフラインではやり直しを終えられない）と見直す条件が書いてあるので、受け入れます。
  5. W-17 の #56 の手順
     - 「出し終えた」backend / intermediate の seed は levelDone の S7 になり、`task.exhausted.redo` で入れます（design:207）。
     - 初めの起動で読むのは tasks-backend.json だけです。選ぶ git はまだ読んでいないので、「SW にないファイルの組へ移る操作」になります。
  6. S0 error の 3 つ目
     - route で 1 ファイルだけ abort し、SW は block なので route を通ります。保存しないことと、unroute の後に取り直せることを確かめる手順で、成り立ちます。
     - h1 は提案 4。
  7. ADR 0007 の承認と npm ci の前提
     - 反論：受け入れテストが、テストのフォルダの外にある devDependency に頼ることになり、ADR 0004 が退けた向きと同じではないか。
     - 答えは ADR 0007:68 にあります。テストと本番で同じ版の esbuild でまとめるためで、テストの道具は今までどおりテストのフォルダだけに置きます。止まるときは分かる文を出します（:69）。
     - 前提の形がまだ実物で確かめていないこと（esbuild が backend/package.json にない）は、CLAUDE.md:20 に正直に書いてあります。これは G2 で確かめます。受け入れます。
  8. budgets の数え直し：上の追跡の表のとおり、計算は合っています。
- 実行したコマンドと結果：
  - 段階の規則の模型：`node /private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/r4/rule4.mjs contracts/fixtures/seeds/seed-ac8-10-restart-after-redo-advance.json`
    - 中身は、data.md の 5 の 1〜5（止まる行の 3 つ目の `i < S` を含む）と、2 の表のやり直しと advance の保存です。r3 の r/rule.mjs を新しい規則に合わせて書き直しました。出力は次のとおりです。
    ```
    OK 経路 1（やり直しの行き先 S7、advance の行き先 S3、levelStart 8）：intermediate（期待 intermediate）
    OK 経路 1 の対照（levelStart を読まない）：beginner（期待 beginner）
    OK やり直し 2 回（S3、S3）：intermediate（期待 intermediate）
    OK 同じ段階のやり直し（数え直さない＝下がる）：beginner（期待 beginner）
    OK 下がった（beginner）後に初を出し終えて advance → 中 done 1：intermediate（期待 intermediate）
    OK 　続けて中 done 1（2 件目で下がる）：beginner（期待 beginner）
    OK 上げる側の数え直し：intermediate（期待 intermediate）
    OK current ありで段階を往復（S3(current のまま)）→ その課題 done 0：intermediate（期待 intermediate）
    OK current ありで中→初、中の current を done 0：beginner（期待 beginner）
    OK 別の領域へ行って同じ段階で戻る（levelStart.backend=なし、既存の規則：領域ごとの連続）：beginner（期待 beginner）
    OK 規則で下がった後にやり直しで中へ → 中 done 1：intermediate（期待 intermediate）
    OK seed-ac8-10 を開いて score 0：intermediate（期待 intermediate）
    OK seed-ac8-10 の対照（levelStart なし）：beginner（期待 beginner）
    ```
    - 指示書の経路「中 done 1 → やり直し 初（S7）→ advance 中 → 中 done 0」は intermediate のままです（r3 では beginner でした）。
    - 数え直しの抜けとして、ほかに 7 つの経路を試しました。やり直し 2 回、current があるままの往復、規則で下がった後のやり直し、上げる側、下がった直後の advance、ほかの領域との往復、同じ段階のやり直し。どれも PRD:216、:220 の字面どおりでした。
    - 「ほかの領域へ行って同じ段階で戻ると、前の行から数え続ける」は、BASE の前からある「領域ごとの連続」の決まりで、段階は変わっていないので PRD と食い違いません。
  - `cd backend && npm run check:contracts`：終了コード 0。全文は /private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/r4/check.log。抜き出しは次のとおりです。
    ```
    ajv 8.20.0（Ajv2020、strict）
    OK  data/invalid-level-start-beyond-history.json 期待：落ちる → 落ちた（スキーマの外の決まり：levelStart.backend（9）が history の行数（8）より大きい）
    OK  data/invalid-level-start-negative.json 期待：落ちる → 落ちた（data/levelStart/backend must be >= 0）
    OK  data/invalid-level-start-without-levels.json 期待：落ちる → 落ちた（スキーマの外の決まり：levelStart.git があるのに levels.git がない）
    OK  data/v1/valid-level-start-after-redo-advance.json 期待：通る → 通った
    OK  seeds/seed-ac8-10-restart-after-redo-advance.json 期待：通る → 通った
    OK  strings/valid-ja.json と valid-en.json の差し込みの名前がすべてのキーでそろう（差し込みのあるキー 29 個）
    OK  tasks の valid-* の正解の位置（27 問）：0 が 9、1 が 9、2 が 9（20% 以上 50% 以下）
    見本 127 件、期待と違う結果 0 件
    ```
    - OK を含む行は 135、NG の行は 0 でした。見本の件数は r3 の 122 から 127 に増え、新しい 5 件と合います。
  - axe の規則：`node -e '…getRules().find(x=>x.ruleId==="page-has-heading-one")…'`（backend/tests/acceptance で実行）→ `page-has-heading-one ["cat.semantics","best-practice"] 4.14.0`
  - `wc -l CLAUDE.md` → 63。`git diff HEAD --stat` は空でした（作業ツリーは HEAD と同じ）。
  - grep で確かめたこと（data.md:245 の issued、data.md:291 の 18,000 行の上限、identifiers.md:21、PRD:216、:220、:233、:380〜384、:405〜407）。
- 開いた URL と確認した日付：この回は規則のページを開く必要がありませんでした（設計の観点で、Apple、OWASP の規則を根拠にした指摘はありません）。r3 の esbuild の勧告の確認（2026-11-08）を引き継ぎます。
- 未検証：なし（指示書の範囲の中）。
  - 範囲の外で、まだ確かめられていないもの（G2 で確かめる）：受け入れテストは指示どおり動かしていません。`serviceWorkers: 'block'` と setOffline の組で WebKit の fetch が失敗として返るか（test-hooks.md:193）。esbuild を入れた後の `cd backend && npm ci` から始める受け入れテストの形（CLAUDE.md:20）。

## 記録
- 関門：G1
- 判定した役：reviewer（設計。fable が上限のため opus）
- 回：r4（FB 2 回目の作り直しで 2 回目）
- 対象：feat/001-daily-learning、308603a...cc3953a
- 日付：2026-11-08
