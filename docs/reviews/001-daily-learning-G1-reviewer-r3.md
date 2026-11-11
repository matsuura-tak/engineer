# 001-daily-learning G1 reviewer r3（観点：設計。FB 2 回目。bacf2d5...52309f4）

FAIL

## 指摘

### 重大
1. 重大、contracts/test-hooks.md:185,188（W-17 の #56。今回 52309f4 で足した行）
   - 何が問題か：AC-23 の 3 通り目の手順が、ほかの契約とぶつかっています。手順は「診断済みの seed で開き、`task.today` を待つ（今日の `current` ができる）→ `settings.redo` → 別の領域 → `diagnosis.finish` が失敗 → 4. オンラインに戻して `task.next.retry` → `data-task-area` が選んだ領域」です。ところが contracts/data.md:47 は「保存データに今日の `current` があれば、その課題はそのままで S3（`data-task-id` は変わらない。AC-14 の 2 通り目）」と決めています。正しい実装では、戻った S3 は前の領域（backend）の課題のままなので、手順 4 は落ちます。逆に手順 4 に合わせると AC-14 の 2 通り目を壊します。しかもこの経路は、利用者が SW にないファイルの組へ移る操作になっていません。PRD AC-23 の Given（`task.exhausted` にいる。docs/prd/001-daily-learning.md:381）とも違います。設計メモ docs/adr/features/001-daily-learning.md:43 の「3 通り目は S8 → S2」も同じ食い違いを持っています。
   - 根拠：PRD AC-23 の 3 通り目（:381〜:383）、AC-14 の 2 通り目（:327〜:329）、data.md:47〜48、:104。
   - 直す方向：#56 の始まりを今日の `current` がない状態にします。例：AC-10 と同じく本番の課題集から作った出し終えた seed で S7 にし、`task.exhausted.redo` から入る。または今日の done の行がある S5 から入る。そのうえで、手順 4 の期待が data.md:48 の行き先と同じであることを書きます。設計メモの AC-23 の行も直します。

### 要修正
2. 要修正、contracts/data.md:163〜164（段階の規則の穴と復元の規則）
   - 何が問題か：data.md:164 は、規則の外に残るのは「やり直しを 2 回続けたときだけ」と書いています。ほかの経路でも起きます。
     - 経路：中で done（score 1）→ やり直しで同じ領域の「初」を選ぶ。初の組は出し終えているので、選べず S7 になり（data.md:48）、行は増えない → S7 の levelDone で advance して中に戻す（data.md:31）→ 中で done（score 0）。
     - data.md:156〜160 の止まる行（段階が違う行、`levelChange` を持つ行）が間にないので、前の中の行まで数えて「初」に下がります。
     - PRD:216 は「段階が変わった後は新しい段階の行から数え直す」、PRD:220 は「進級は…数え直しの起点になる」と書いており、これに反します。data.md:163 の「上の 2 により数え直し」は、間に前の段階の行があるときしか成り立ちません。
   - 根拠：スクラッチパッドで data.md の 5 の 1〜5 をそのまま書いた模型を動かしました（下の証拠）。結果は「次の段階 = beginner」でした。対照として、間に初の行が 1 つあると intermediate のままです。AC-8 の表の 9 通りは同じ模型で 10 件とも OK でした。
   - 直す方向：次のどちらかにします。
     - (a) やり直しと advance で `levels[a]` が変わった事実を保存します。例：領域ごとに「数え始める行の番号」を持つ。形が変わるので、ADR 0002 の改訂 2 の中（G1 が PASS する前）でやり、「3 度目」にしないこと。
     - (b) この経路を仕様として許します。その場合は data.md:164 の「だけ」を直し、PRD:220 との差を pdm に上げます。
3. 要修正、contracts/test-hooks.md:176（W-12 の AC-44。今回足した行）
   - 何が問題か：図の画像の要求を「数える区間は『オフラインにした直後から、Then を確かめ終えるまで』」と書いています。AC-44 の手順（W-4 の page.route と seed）にはオフラインにする段がないので、区間が決まりません。これでは 0 件を空のまま通すことがあります。
   - 根拠：PRD AC-44（:502〜:505）。
   - 直す方向：「`goto` の前から Then を確かめ終えるまで」などと書き直します。
4. 要修正、contracts/budgets.md:41（1,200 字［推測］の根拠の数）
   - 何が問題か：「r10 の型の 210 件（平均約 410 字）で 1 字あたり約 0.69 バイト」は計算が合いません。69,313 ÷（210 × 410）= 0.805 です。今の backend/public/data/tasks.json で自分で測ると、id などを除いた文字列の平均が 390.6 字、0.845 バイト/字でした。
     - さらに、領域ごとのファイルは縮みにくくなります（ADR 0006:61 の backend 35 件が 12,525 で 1 件 358 バイト。1 ファイルのときは 330 バイトで、約 8% 悪い）。
     - これで直すと 1 件約 1,260 バイトです。1 領域 42 件（252 件版）は約 53,000 で 50,000 を超えます。28 件（168 件版）は約 35,300、21 件（v1）は約 26,500 です。
     - PRD にある版（126 件と 168 件）は収まり、見直しの線 40,000 の手前です。ただし「252 件版で約 41,000」という文は誤りです。
   - 直す方向：比を測った値に直し、252 件版の行を消すか、平均を下げます。歯止めの「1 ファイル 50,000」は今のままでよいです。
5. 要修正、docs/adr/0007-bundle-js-with-esbuild.md（結果の節）。関係する所は contracts/test-hooks.md:9、docs/adr/0004、CLAUDE.md の受け入れテストのコマンド。
   - 何が問題か：今の build.mjs は node: の組み込みだけを import しています（backend/scripts/build.mjs:9〜12）。受け入れテストの global-setup.mjs:19 はこの build.mjs を動かします。ADR 0007 で build.mjs が esbuild を読むようになると、`cd backend/tests/acceptance && npm ci && npx playwright test` だけでは backend/node_modules に esbuild がなく、新しく clone した所では落ちます。
     - ADR 0004:28 は、案 A を「受け入れテストのフォルダの外の依存に頼る」という理由で退けました。ADR 0007 は、その依存を書かないまま作っています。
     - CI のコマンド `cd backend && npm ci && npm test` は先に入れるので通ります。
   - 直す方向：ADR 0007 の「結果」と test-hooks.md の「実行の環境」と CLAUDE.md に、受け入れテストを単独で動かす前に `cd backend && npm ci` が要ることを書きます。または global-setup が分かる文で止まるようにします。
6. 要修正、contracts/data.md:97〜103 と contracts/identifiers.md:21（S0 error の 3 つ目の変種）。docs/adr/0006-task-set-split-by-area.md:20、:26 も。
   - 何が問題か：
     - 契約は新しい状態を足しましたが、design r13 の 5.1（#1〜#3）と S0 の行（design/001-daily-learning.md:198）にこの状態がありません。data.md:103 も自分で「未解決」と書いています。
     - ADR 0006:20 は「S2 は `error.tasks.offline` ではなく S0 error」、:26 は「未解決 1 は次の回で決める」のままです。これは data.md:90 の決定（取れないときと同じ扱いにする）と食い違います。
     - ADR 0006:43〜44 の「失敗の場所は S2 と S10 の 2 か所」も、今は 3 か所です。
   - 直す方向：designer が 5.1 の行と S0 の行を足します。tech-lead は ADR 0006 の「中身」と反論への答えを今の決定に直します。
7. 要修正、CLAUDE.md:10、:61（902a0cd で直した行）
   - 何が問題か：「契約（contracts/）はまだ r10 の形で、次の回から r13 に書き直す」「SW が貯める分の枠と課題集の 1 件の上限は、次の回の contracts/budgets.md で決め直す」が、HEAD では事実と違います。契約はもう書き直してあり、枠は budgets.md:9〜21 で 400,000、平均は 1,200 です。
   - 直す方向：地図を今の契約に合わせます。

### 提案
- 既存（BASE より前の行。git blame で 0406818f と f09f4dea。判定に数えない）：test-hooks.md に古い行が残っています。G2 の前に直さないと、AC-4、AC-35 などのテストが本番の課題集 126 件で落ちるか、作れません。
  - :47〜49（W-6 の件数「v1 は 210 以上、初級 14、中級 14…」「external の割合 20%」）は、PRD AC-4（126 件、18 組すべて 7 以上、168 件版で初級 14）と AC-29（全件 in_app）とぶつかります。
  - :51 の例の名前（480 字、105000）も古い値です。
  - :65「中級は 14 件ある」、:73「目標の組から 13 件まで、1 領域の 35 件」、:83「未出が 12 件」は、1 組 7 件（PRD AC-36 の Given）と合いません。
  - :89 の `task.report.done` は identifiers.md:186 で消した識別子です。
  - :25 の「答えの保存の 300 ms のタイマー」は書く欄と一緒になくなりました。
- data.md:104、ADR 0006 の決定 (1)：今日の `current` があるやり直しでは、新しい領域のファイルは使いません（data.md:47）。それでも `diagnosis.finish` が読み込みを待つので、SW が貯める前のオフラインでは、要らないファイルのせいでやり直しを終えられません。「課題を選ぶときだけ待つ」にする案です。
- budgets.md:10 の A に、S3 で先読みする correct と incorrect の 2 枚（ADR 0008:173、合わせて約 780 バイト）が入っていません。枠には余裕がありますが、数え方をそろえます。
- ADR 0007 の状態は「提案」ですが、service-worker.md:20（FILES の `./js/app.js`）と budgets.md:57 は承認した前提で書いてあります。この判定の後に、ADR の状態と CLAUDE.md:59 の「承認までは ADR 0001 のまま」をそろえます。ADR 0007:151 の esbuild の URL 3 つは未確認のままです。

## 証拠
- 対象：bacf2d5...52309f4（HEAD は 52309f491631a0aee301ee1289dceaf2de4ea78e）、観点は設計（G1）。範囲は contracts/、docs/adr/、CLAUDE.md と、PRD r13 と design r13。
  - `git diff --name-only bacf2d5...52309f4` は 145 ファイルです。読んだ印は次のとおりです。
  - 全部読んだ：CLAUDE.md（差分）、contracts/budgets.md、data.md、dependencies.md、service-worker.md、test-hooks.md、docs/adr/features/001-daily-learning.md、0006、0007、0008。
  - 差分だけ読んだ：docs/adr/0001、0002。
  - 一部（grep と節）だけ：contracts/identifiers.md（1〜3 の表、:180〜:199）、strings.md（節の見出し、4、5.3）、schemas/data.schema.json（$defs と最上位）、strings.schema.json（required の 194 件）、tasks.schema.json（area の行）、tools/check-schemas.mjs（関数と定数）。
  - 開いて読んでいない：fixtures の 122 件。check:contracts の合否と、seed の ID の grep だけで見ました。
  - PRD は :205〜:524 を読みました。design は 5.1、7、:37、:74、:87、:198、:200 を読みました。
- AC 対応表（44 行。PRD の `^- AC-[0-9]+：` は 44、設計メモの行も 44 で、番号の集合は同じ）。operationId はどれも「なし（端末のみ）」なので、データの列だけを確かめました。
  - 契約で満たせる（指摘なし）：AC-1、2、3、5、6、7、9、10、11、12、13、15、16、17、18、19、20、21、22、24、25、26、27、28、29、31、32、33、34、36、37、38、39、40、41、42、43、45。
    - 根拠の所：data.md の 2、4、5、9、11、test-hooks.md の時間の計り方（選択肢 → 返し 300 ms は :139〜:141）、W-3、W-7、W-9、W-13、W-16、strings.md の 7、identifiers.md の 2〜4。
  - AC-8：data.md の 5 の表の 9 通りは模型で 10 件とも OK。ただし規則の外の経路がある（要修正 2）。
  - AC-14：data.md:45〜49 で満たせる。test-hooks.md:89 の識別子が古い（提案、既存）。
  - AC-23：1・2 通り目は service-worker.md の 3 と 5、data.md:93〜101 で満たせる。3 通り目は W-17 #56 がぶつかる（重大 1）。
  - AC-44：W-4 で 6 型、「線の対比」で 3:1。画像の要求を数える区間が決まらない（要修正 3）。
  - AC-4、AC-35：スキーマと W-6 で検査の形はある。件数の決まりが PRD と違う（提案、既存）。
- エンドポイントの表（読み込む入口と保存の境界に読み替えた）：

| 入口 | 誰が書けるか | 何を確かめるか | 使う所 | 上限 |
|---|---|---|---|---|
| 書き出しファイルの読み込み | 利用者（信頼しない） | 5,000,000 バイトで止める、JSON.parse、formatVersion、手書きのスキーマ検査（ajv と同じ合否を単体テストで確かめる）、「なし」は拒む、`device` はこのブラウザの値を残す（data.md:211〜216、:199〜200） | textContent だけで描く（strings.md:65） | 5 MB、18,000 行 |
| 課題集 6 ファイル | 同じ origin の配布物。ビルドで 6 つとも tasks.schema に通す | ok、JSON、tasks が配列、ファイル名の領域とトップの area と各課題の area と ID の領域が同じ（data.md:86〜91） | URL の領域は data.schema の enum を通った値だけ（$defs.area） | 1 ファイル 50,000 |
| ミルの PNG 8 枚 | 同じ origin | img-src 'self' だけ（budgets.md:47） | `<picture>`、aria-hidden | 1 枚 600 |
| localStorage `kyounoitte:data` | このアプリ。同じアカウントの他の Pages とも origin を共有する（data.md:8。既存） | 起動のたびにスキーマで検査し、通らなければ S0 error（data.md:72） | — | 1 回の保存は setItem 1 回 |

  - 空欄はありません。他人のデータに届く入口はありません（サーバーなし）。
- 元に戻しにくい判断への、いちばん強い反論：
  - ADR 0002 の改訂 2（formatVersion 1 のまま作り直す）
    - 反論：「公開前」という前提が崩れると、版 1 が 2 つの意味を持ちます。
    - 確かめたこと：2026-11-08 12:04 JST に `curl -sI https://matsuura-tak.github.io/engineer/` は `HTTP/2 404`、`git ls-tree -r --name-only origin/main | grep -c '^backend/public/'` は `0` でした。古い形のデータが残りうるのは、本番と別の origin（127.0.0.1 など）だけです。
    - ADR に答えと見直す条件（:見直す条件（改訂 2））があるので、受け入れます。ただし要修正 2 の (a) で形を変えるなら、改訂 2 の中で行うこと。
  - ADR 0006（6 領域のファイル）
    - 反論：SW の install は全部取れなければ失敗する作りで、約 350 KB に増えます。貯め終えるまでの抜けは S2、S10、S0 の 3 つ目の 3 か所あります。
    - ADR の答え（段階の変化と進級でネットワークを使わない）は妥当です。ただし 3 つ目の変種は design にありません（要修正 6）。
  - ADR 0007（esbuild で 1 ファイルにまとめる）
    - 反論：ネイティブのバイナリと install script を持つ 0.x の道具が入り口になります。
    - 本番の依存 0 は、metafile の inputs の確かめ（ADR 0007:101）と dependencies.md の確かめ方 1〜3 で守れます。
    - 新しく作る依存の向き（要修正 5）が ADR に書かれていません。
  - ADR 0008（ミルの PNG を `<picture>` で切り替える）
    - 反論：色が固定で、コントラストを上げる設定に追従できません。
    - 絵は aria-hidden の飾りで、形は輪郭が持つという答えと、見直す条件があるので、受け入れます。
  - test-hooks.md の新しいつなぎ口：選択肢 → 返しの区間、W-4 の page.route、W-7 の score 2、W-12 の resourceType、W-17 の serviceWorkers: 'block' は、どれも Playwright の側だけです。本番には読み取り専用の印しか入れず、URL の引数も読みません（test-hooks.md:4、:254〜:256）。本番に入らない形です。
  - 契約と仕様 r13：文言は 194 キーで、design の 7 の表、strings.schema の required、valid-ja と valid-en の値がすべて一致しました（差 0）。状態は design 5.1 の 75 行（#17〜22 を含む）に、契約の S0 の 3 つ目がありません（要修正 6）。
- 実行したコマンドと結果：
  - `cd backend && npm run check:contracts`：終了コード 0。先頭は `ajv 8.20.0（Ajv2020、strict）`、末尾は `strings/valid-ja.json と valid-en.json の差し込みの名前がすべてのキーでそろう（差し込みのあるキー 29 個）`、`tasks の valid-* の正解の位置（27 問）：0 が 9、1 が 9、2 が 9（20% 以上 50% 以下）`、`見本 122 件、期待と違う結果 0 件`。OK の行は 130、NG の行は 0 でした。
  - `grep -cE '^- AC-[0-9]+：' docs/prd/001-daily-learning.md` → 44。設計メモの行 → 44。番号の diff は空でした。
  - 文言の比較（node で design の 7 の表を読んだ）→ `design 7 keys 194`、`schema-not-design: none`、`design-not-schema: none`、`value diffs ja 0 en 0`。
  - r10 の tasks.json の比（node）→ `tasks 210 avg string chars(non-id) 390.6 gzip 69313 bytes/char 0.845`。
  - スクラッチパッドの規則の模型 /private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/r/rule.mjs → `やり直し(中→初、行なし)→進級(初→中) の後の 1 件目 score 0：次の段階 = beginner`、対照は `intermediate`。同じフォルダの table.mjs → AC-8 の 1〜9 通り（7 は a、b）がすべて OK。
  - `git blame -s` で、test-hooks.md:47〜49、:65、:73、:83 は 0406818f、:89 は f09f4dea（どちらも BASE より前）。:176、:185〜:188 は 52309f49、data.md:164 は 7aafbbd0、budgets.md:41 は 52309f49。
- 開いた URL と日付（2026-11-08）：
  - https://github.com/advisories?query=esbuild ：esbuild の勧告は GHSA-gv7w-rqvm-qjhr（Withdrawn）、GHSA-g7r4-m6w7-qqqr、GHSA-67mh-4wv8-2f99 の 3 件でした。
  - https://github.com/advisories/GHSA-g7r4-m6w7-qqqr ：Affected versions ">= 0.27.3, < 0.28.1"、Patched "0.28.1"、"The development server contains a path traversal vulnerability on Windows when serving files from `servedir`."。0.28.2 は範囲の外です。
- 未検証：
  - fixtures 122 件の中身を 1 件ずつは開いていません（合否は check:contracts の出力で見ました）。
  - identifiers.md、strings.md、3 つのスキーマ、check-schemas.mjs は全行を読んでいません。ADR 0001 と 0002 は差分だけで、全文は読んでいません。design r13 も上に書いた節だけです。
  - GHSA-67mh-4wv8-2f99 の影響範囲は開いていません。osv.dev も見ていません。
  - 設計メモ:82 の seed の 15 通りの再計算はしていません（AC-8 の表の 9 通りだけ確かめました）。
  - 受け入れテストは指示どおり動かしていません。

## 記録
- 関門：G1
- 判定した役：reviewer（設計。fable が上限のため opus で動かした）
- 回：r3（FB 2 回目の作り直しで 1 回目）
- 対象：feat/001-daily-learning、bacf2d5...52309f4
- 日付：2026-11-08
