# 001-daily-learning G0 verifier r5（PRD r12、コミット 77fd9d3。FB 2 回目の作り直しで 1 回目）

PASS

## 指摘
重大はなし。44 件（AC-1〜AC-45、AC-30 は欠番）すべてに Given / When / Then / 確かめ方 / 効く機会があり（各 44 件）、11 章（205〜512 行）に測れない言葉は 0 件。新しい AC と変えた AC（25 件）の Then はすべて状態の名前、文言キー、data 属性の値、件数、ミリ秒、字数で書かれていて、合否を決められる。G1 の前に 1 行ずつで直してほしい「要修正」が 4 件、提案が 12 件。

- 要修正、docs/prd/001-daily-learning.md:383（AC-23 Then「`task.today` なら同じ `data-task-id` と導入の図とキャラクター」）と :235（11 冒頭「出る場所は … `task.today` の返し（各問）」）、:508（AC-45 2 通り目 Given「`task.today` の 1 問目にいる（キャラクターは既定の表示）」）。1 問も答えていない `task.today`（導入 + 1 問目）に `guide.character` が 0 件か 1 件かが決まっていない。出る場所の一覧は「返し」だけを挙げ、出ない場所の一覧にも `task.today` の導入はないが、AC-23 は再読み込み後の `task.today` に「キャラクター」があると読める。期待値が 0 か 1 かでテストが変わる（AC-23、AC-31 の「覆う `position: fixed` 0 件」、AC-45 1・3 通り目）。直す方向：11 冒頭の出る／出ない場所に「`task.today` の導入と未回答の問」を明記し、AC-23 の Then を「`guide.character` の件数と `data-mood` が再読み込み前と同じ」に書く。
- 要修正、:502（AC-44 Then「図の中の文字と線の色が背景に対して 3:1 以上」）。「線」と「背景」にあたる要素の印がなく、axe-core の color-contrast は文字だけを見るので、線の対比は計算済みスタイルから求めるしかないが、どの要素の `stroke` / `border-color` と、どの要素の `background-color` を取るかが決まらない（r4 の AC-37「先週の日数は出ない」と同じ型）。直す方向（どちらか）：(a) 図の部位に印（例：`data-figure-part="label|line|box"`）を置き、背景は図の要素の `background-color` と書く（tech-lead が identifiers.md に）。(b) design/tokens.md の図の色のトークン（ライト・ダークそれぞれの線・文字・背景）を数値で検査し、画面では文字だけ axe で見る、と書く。
- 要修正、:502（AC-44 Then「`<img>` と外部の画像ファイルへの要求は 0 件」）。範囲がページ全体だと、キャラクターの絵を PNG のスプライト（FB2 の読み取り「小さな SVG か PNG のスプライト」、Q25「4 枚の SVG」）にする案と衝突し、`task.today` の返しで `<img>` が 1 件以上になり得る。直す方向：「図の要素（`[data-figure-type]`）の中の `<img>` が 0 件で、図のための画像（resourceType が image で URL が図に属する）の要求が 0 件」のように図に限る。キャラクターの絵の形は tech-lead の判定に任せる。
- 要修正、:489（AC-42 Then「ja は「点」「ランク」「レベルアップ」「XP」が 0 件」）。「点」1 文字の部分一致は「採点」「時点」「要点」にも当たる。今の ja.json には `採点はしません。`（73 行）があり、そのままでは「採点しない」と言う文が落ちる。直す方向：ja の照合の決まりを 1 行で書く（例：「部分一致。『採点』『観点』『時点』は除く」か、「『[0-9０-９]点』『点数』『得点』『満点』『高得点』を数える」）。en の `\b(points?|score|rank|XP|level up)\b` は大文字小文字を区別しないと書く（文頭の "Score" を逃さない。AC-35、AC-45 の en も同じ）。

提案（直すかは pdm に任せる。合否は決まる）：
- 提案、:497（AC-43）。「せよ」の部分一致は「させよう」「いずれにせよ」「にせよ」に当たる。文末（「せよ」の直後が「。」「！」「？」か末尾）に限ると誤検知がない。「書き出し」も「ログを書き出す」のような技術の語に当たるが、意図どおりなら残してよい。
- 提案、:497（AC-43）。「。」「！」「？」で区切る手順を 1 行で（空の文は捨てる、`code` の中の「。」でも区切る、最後の文に句点がなくても 1 文と数える）。
- 提案、:418（AC-29）「`pre` のコードブロックが 0 件」。tasks.schema.json の説明（121 行）は「コードブロック（```）は使わない」なので、「連続する 3 つのバッククォートが 0 件」と書くと数え方が一意になる。`tools` は「存在しないか空配列」と書く。
- 提案、:262（AC-3）「導入の図 … が前後の空白を除いて 1 文字以上」。図はオブジェクトなので「`figure.alt` が 1 文字以上」か「`figure` がある（型の検査は AC-29）」に。
- 提案、:346（AC-17）2 つ目の `task.today`「説明 2 つと図」。問の図は任意（11 冒頭）なので、「導入の図」か「問に図のある課題を seed で選ぶ」かを決める。
- 提案、:280（AC-7）「「難しすぎ」「簡単すぎ」の操作は 0 件」。数える識別子を書く（例：「`data-testid` が `task.report.too_hard`、`task.report.too_easy` の要素が 0 件」か AC-37 と同じく「identifiers.md に定義しない」）。
- 提案、:430（AC-32）「3 問目は未回答で選択肢 3 つが押せる」。「`data-answer-result` がなく、各選択肢の `data-choice-state` が none（または未設定）で disabled でない」と書くと一意。
- 提案、:508（AC-45）。(1) 台詞の 40 字は「ja.json と en.json の `guide.*` の全キーの値が 40 字以内（コードポイント）」と文言ファイルで数えると全件を見られる。en の 40 字（英語で約 7 語）が意図どおりかを designer に確かめてほしい。(2) `getAnimations()` は `{ subtree: true }` で子孫も数えると書く。(3) 「問題文と選択肢の要素の中に 0 件」は要素の識別子（仮に `task.question`、`task.choice`）を添える。
- 提案、:387、:452（AC-24、AC-36）の「今日はできない」と :277（AC-7）の「今日はやめておく」。同じ申告（`no_time`）なので語を 1 つにそろえる。
- 提案、:236、:489（11 冒頭と AC-42）の `report` が `complete`。契約（data.md、data.schema.json、identifiers.md 98 行）は `done`。PRD は「仮に置く」と書いているので判定には影響しないが、G1 で tech-lead がどちらかに確定するまで両方の名が残る。
- 提案、:436（AC-33 確かめ方「tech-lead が足し」）。「次の一手に進む → 課題」の行は contracts/test-hooks.md の表（141 行）にすでにある。残るのは AC-41 の「選択肢 → 返し」の行だけ。
- 提案、:383（AC-23）と Q24。課題集を組ごとに分ける案（A）を採るなら、「SW が貯め終える前にオフラインになり、別の組へ移る」ときの動き（PRD は「tech-lead が契約に書く」）に観察できる結果（状態の名前か文言キー）を 1 行足す。今の AC-23 は全部貯まった後しか見ない。

## 証拠
- 対象：feat/001-daily-learning、`git diff 230200d 77fd9d3 -- docs/prd/`（001-daily-learning.md 506 行変更、product.md 10 行変更）。読んだ印：docs/prd/001-daily-learning.md（1〜11、12、18、G0 の前の確認。11 章は全文）[x]、docs/prd/product.md（r6 の差分）[x]、docs/approvals/001-daily-learning-FB2.md [x]、docs/reviews/001-daily-learning-G0-verifier-r4.md [x]、contracts/test-hooks.md（見出し、W-7、W-8、時間の計り方）[x]、contracts/identifiers.md（testid と属性の行）[x]、contracts/data.md（report、統計の行）[x]、contracts/schemas/data.schema.json（report の enum）[x]、contracts/schemas/tasks.schema.json（説明の行）[x]、contracts/strings.md（68〜69 行）[x]、docs/verification/001-daily-learning/test-plan.md（見出し）[x]、backend/tests/acceptance/（tests/ の名前と件数、helpers の export、seeds/ の一覧）[x]、docs/org/gates.md（G0）[x]、docs/templates/review-report.md [x]。実装コード（backend/public/ の JS、CSS、HTML）は開いていない。tasks.json と i18n の JSON はデータとして集計しただけ。playwright は動かしていない。

### 観点 1：新しい AC と変えた AC（25 件）のテストできるか
| AC | 判定 | Then の値（抜粋）と、要るつなぎ口 |
|---|---|---|
| AC-3 | できる | 題名・導入・問題 3・insight が 1 字以上、minutes 1〜15 の整数。図は提案 4 |
| AC-4 | できる | 126 以上、18 組 ≥ 7、重複 0。12-21 版は 168、初級 6 組 ≥ 14。今の 210 件（旧型）は落ちる（正しい赤） |
| AC-5 | できる | 2 問答え → 3 問目 → まとめへ → `task.rate` → `task.done`、再読み込みで同じ、`data-stat-issued` 不変 |
| AC-7 | できる | 2 通り。`task.skipped`、`data-report` no_time、2 通り目は answers 1 件と score、`issued` 不変。too_hard/too_easy 0 件は提案 6 |
| AC-8 | できる | 9 通り（7 通り目は 2 seed）。値はすべて level の名前。9 通り目は score 1 を 2 件 → `task.level.adjusted.down`。seed は score つきで全部作り直し（H-1） |
| AC-12 | できる | 操作の列が 7 AC 分に増える。送信 0 件は W-12 のまま |
| AC-15 | できる | `data-debug-load-ms` 5 回 ≤ 2,000。終点の定義（導入の図、選択肢 3 つまで）を identifiers.md 14 行に反映（H-3）。Q24 の決着に依らず計れる |
| AC-17 | できる | 6 状態、scrollWidth ≤ 320、overflow 0、ellipsis 0、押せる。提案 5 |
| AC-18 | できる | `task.rate` 到達、focus-visible、枠 2px、答えた後に選び直せない（Enter 後に属性不変） |
| AC-19 | できる | score 3,1,2、answers 各 3、`showCharacter` false。answers の形は H-1 |
| AC-20 | できる | 書き出し元と同じ、非表示のまま、`task.today` か `task.done` |
| AC-23 | 条件つき | 3 秒、同じ ID、送信 0。「キャラクター」の件数が未決（要修正 1） |
| AC-24 | できる | 13 値を検算した：issued 6、completed 4、7d 3（10-31〜11-06 に 11-01, 03, 04）、week 2（11-02〜06 に 03, 04）、extra 1、helpful 2、rated 2、answered 13（12+1+0）、correct 10（3+1+2+3+1）、low 1、no-time 1、first-day true、too-hard 要素 0。数値 11 + 日付 1 + 真偽 1 = 13 |
| AC-27 | できる | 8 画面 9 表示、serious 以上 0 |
| AC-29 | できる | mode、字数、型 6 種と labels の範囲（9 の表と一致：木 1+2〜4=3〜5、分岐 1+2〜3=3〜4）、378 問の正解位置 20〜50%、URL 0。`pre` は提案 3 |
| AC-31 | できる | 題名・導入・図・1 問目・選択肢 3・やめておく、dialog 0、fixed 0 |
| AC-32 | できる | index 2、correct/incorrect の返し、翌日は index 0 と none 行の answers 2・score 1。提案 7 |
| AC-34 | できる | 初級全件 minutes ≤ 10、6 語 0 件（空白除去）。手作業の分は明記 |
| AC-36 | できる | 3 行（complete、no_time、none）→ index 4、total 7。seed-ac36 は作り直し（14 → 7） |
| AC-38 | できる | 1〜120 字、`task.insight.text` が S3（3 問目の返しを含む）と S6 で 0 件 |
| AC-41 | できる | 2 通り。300 ms、`data-answer-result`、`data-choice-state`、explain 1 件 / 2 件、選び直し不可、index 1、`data-mood`。時間の行は H-4 |
| AC-42 | 条件つき | `data-score` 2、`task.rate.score`、insight、履歴 complete/2。語の検査は「点」の決まり待ち（要修正 4）。今の ja.json で 1 件当たる |
| AC-43 | できる | 1 文 60 字、6 語 0、命令形 0、です・ます 1 以上。提案 1、2 |
| AC-44 | 条件つき | 6 型 × 2 配色、`data-figure-type`、role/aria-label、labels 可視、scrollWidth ≤ 320。線の対比（要修正 2）と img の範囲（要修正 3）が未決 |
| AC-45 | できる | 3 通り。1 件 / 0 件、mood idle/incorrect/celebrate、aria-hidden、40 字、getAnimations 0、非表示で 0 件かつ解説・累計・祝いあり。語は `guide.*` と `task.level.adjusted.*` に限定済み。提案 8 |

できる 21、条件つき 4（AC-23、AC-42、AC-44 ×2 の要修正で決まる）、できない 0。空（AC-10）、エラー（AC-11、AC-25）、オフライン（AC-12、AC-23）、権限（AC-13）、言語（AC-26）、幅 320（AC-17、AC-39、AC-44）、キーボード（AC-18）、監査（AC-27）、動きを減らす（AC-45）の AC がある。

### 観点 2：範囲と数え方が決まっているか
- AC-41（正誤と説明）：決まっている。問の要素の `data-answer-result`、各選択肢の `data-choice-state`（4 値）、`task.question.explain` の件数（1 / 2）と中身（課題集の `explain` と等しい）、`data-task-question-index`。300 ms は始点（選択肢の click）と終点（`data-answer-result` が付く）が書かれており、今の仕掛け（MutationObserver）に `attributeFilter` を 1 つ足せば計れる。
- AC-43（文の調子の全件検査）：対象（`intro`、各問 `text`、各 `explain`、`insight`）、区切り（。！？）、上限（60 コードポイント、`code` 込み）、禁止語 6、命令形 2、必須の語 5 のどれかが `intro` と `text` に 1 回以上、がそろう。「せよ」の誤検知と区切りの細部だけ提案。手作業の 2 項目（場面から始まる、2 人称）は指揮役の記録と明記。
- AC-44（図の型）：型 6 と ID、labels の個数と字数、alt 1〜80 字、`data-figure-type`、`role="img"`、`aria-label`、幅 320、ライト・ダーク 2 配色、12 枚のスクリーンショットまで決まっている。決まっていないのは「線」の対比を何から取るか（要修正 2）と `<img>` 0 件の範囲（要修正 3）。
- AC-45（キャラクター）：出る 4 か所と出ない 5 か所、`data-mood` 4 値、`aria-hidden`、40 字、`showCharacter`、reduced-motion の数え方（test-hooks.md 208〜216 行の仕掛けで計れる）、語の検査の範囲（`guide.*` と `task.level.adjusted.*`）と語 7 + 6。未回答の `task.today` だけ未決（要修正 1）。
- AC-42（点数の語の禁止）：範囲は「ja.json と en.json の全キーの値」で決まっている。ja の「点」の照合の決まりが未決（要修正 4）。en は単語の境界で決まる（大文字小文字の指定だけ足す）。

### 観点 3：新しく要るつなぎ口（G1 で tech-lead が contracts/ に書くもの）
| # | 何 | 案 | 使う AC |
|---|---|---|---|
| H-1 | 保存の形（data.schema.json、data.md、`formatVersion`） | 履歴の行と `current` に `answers`（各要素は選んだ `choiceIndex` 0〜2 と `correct` の真偽、または index だけで正誤は課題集から引く、のどちらか）、`score` 0〜3、`report` の値の名（PRD `complete` / 契約 `done`。`too_hard`、`too_easy` は消す）、`showCharacter`（既定 true）。4 の起動の判定（3 問目に答えた時点で履歴へ）、5 の段階の規則（score で下げ 2 件・上げ 3 件、同じ level だけ数える）、9 の統計 3 つの数え方。fixtures/seeds/ の全見本（ac8 ×4、ac14、ac24、ac35、ac36）を score つきで作り直す | AC-5、7、8、19、20、24、32、35、36、37、42 |
| H-2 | 課題集（tasks.schema.json、identifiers.md 5、budgets.md 2） | `mode`、`intro`、`figure{type,labels[],highlight?,alt}`（type の ID 6 つ、labels の個数の範囲を型ごとに）、`questions[3]{text,figure?,choices[3]{text,explain},answer}`、`minutes`、`insight`。`goal`、`why`、`how`、`tools` を外す。「```」の扱い。BUDGET2 の上限（Q24） | AC-3、4、29、34、38、43、44 |
| H-3 | 識別子（identifiers.md 3、4、6） | 属性：`data-task-question-index`、`data-task-question-total`、`data-choice-index`、`data-choice-state`、`data-answer-result`、`data-score`（`task.rate`、`task.done`、`history.row`）、`data-figure-type`、`data-mood`、`data-stat-questions-answered`、`data-stat-questions-correct`、`data-stat-low-score-tasks`（`data-stat-too-hard` を外す）。testid：問の要素、選択肢、`task.question.explain`、「次の問題へ」、「まとめへ」、正誤の文言（`task.answer.result.correct` / `.incorrect`）、`task.skip`（`task.report.*` を外す）、図の要素と部位（要修正 2）、`guide.character` と絵の要素と台詞の要素、`settings.character.show`、`task.level.adjusted.down` / `.up`。AC-15 の終点（図と選択肢 3 つまで）を 14 行に反映 | AC-7、15、17、18、23、24、27、31、32、41、42、44、45 |
| H-4 | 時間の計り方の表 | 「選択肢 → 返し」：始点は選択肢の click、終点は問の要素に `data-answer-result` が付く時点、300 ms。MutationObserver の `attributeFilter` に `data-answer-result` を足す。「次の一手に進む → 課題」はすでにある | AC-41、12 |
| H-5 | 語の検査の決まり（strings.md か test-hooks.md） | AC-42（全キー、ja の「点」の決まり、en は大文字小文字を区別しない）、AC-45（`guide.*` と `task.level.adjusted.*`、7 語 + 6 語、40 字の単位）、AC-43（区切りと `code` の扱い、「せよ」の位置）、AC-35 と AC-34 は今のまま | AC-34、35、42、43、45 |
| H-6 | 画面の環境の偽装 | `colorScheme: 'dark'`（AC-44。Playwright の context か `emulateMedia`）、`reducedMotion: 'reduce'`（208 行にある）、AC-44 のテスト用の課題集の差し替え（W-4 で足りる見込み） | AC-44、45 |
| H-7 | 配布物の形（Q24 が A のとき） | SW の FILES に組ごとのファイル、貯め終える前のオフラインの動き（提案 12）、AC-28 の差し替えで組のファイルも新版に、AC-23 で「別の組に移っても送信 0」 | AC-15、23、28 |
| H-8 | 画像の要求の数え方 | W-12 の記録に resourceType を持たせ、図の `<img>` と画像の要求を数える範囲（要修正 3） | AC-44 |

### 観点 4：今の受け入れテストの見積もり
今のテストは 82 本（`grep -cE '^\s*test\(' tests/*.spec.mjs`、23 ファイル。指揮役の 219 は `--list` の件数と思われ、今回は動かしていない）。
- 消す（4 本）：`AC30_` の 4 本（AC-30 は欠番）。too_hard / too_easy に頼る seed 6 ファイル（seeds/seed-ac8-* の 4、seed-three-done-one-answer、ほか）と `data-stat-too-hard` の読み出し。
- 書き直す（約 30 本）：ac03-ac04-ac29（5。新しいスキーマと 126 件）、ac05-ac06-ac07-ac09（8。「完了」ボタンが 3 問の回答に変わる）、ac08（2 → 9 通り。seed は score つき）、ac17-ac18-ac27（3。6 状態、3 問をキーボードで、9 表示の監査）、ac24（1。新しい seed と 13 値）、ac31-ac32（7。見える要素と「答えた問題」の再開）、ac12-ac23（4。操作の列と図・キャラクター）。
- 直す（約 30 本）：ac10（AC10 の 4。完了の経路だけ）、ac11-ac13（AC13 の完了）、ac14-ac16（AC14 2 通り目の完了）、ac15（終点の要素）、ac19-ac20-ac25（answers、score、showCharacter）、ac28（seed の形）、ac33（完了の経路）、ac34-ac38（tools の条件を外す、AC38 の経路）、ac35-ac37（8。完了の経路）、design-d30（答えた分の持ち越し）、design-d40-d44（design r7 の結果次第）。
- 変えずに再実行（約 15 本）：ac01-ac02、AC11、ac21-ac22、ac26、ac39-ac40、design-d31（seed の形だけ合わせる）。
- 足す（約 25 本）：AC41 ×2、AC42 ×2（画面、語）、AC43 ×1、AC44 ×2〜3（6 型 × 2 配色をループ、img と要求）、AC45 ×5（3 通り、reduced motion、語）、AC8 +7、AC7 +0（2 通りのまま）、AC17 +0（6 状態を 1 本の中で）、AC27 +0、AC12 の操作追加は既存の本数のまま。
- helpers：app.mjs に `answer(choiceIndex)`、`readQuestion`、`readFigure`、`readCharacter`、`goSummary`、fixtures.mjs の `makeSeed` / `completedSeed` / `exhaustedSeed` に answers と score、seed.mjs の検査（ID と area/level の照合はそのまま）。tools/screenshots.mjs は design 5.1 の状態の表に合わせて直す。
- 書き直し後の見込み：約 105 本（× 2 エンジン − AC-15 の webkit）。

- 実行したコマンドと結果（cwd /Users/takumamatsuura/src/engineer）：
  - `grep -oE 'AC-[0-9]+' docs/prd/001-daily-learning.md | sort -u` → AC-1〜AC-45 の 45 個（AC-30 は欠番の注記の行で出る）。
  - 11 章（205〜512 行）で `^- AC-[0-9]+：` → 44 件。`^  - (Given|When|Then|確かめ方|効く機会)：` → 各 44 件。
  - 11 章で `適切|すばやく|わかりやすく|すぐに|素早|正しく|十分|なるべく|できるだけ|スムーズ|快適|速やか|ちゃんと|きちんと|自然に|簡単に|問題なく|目立|見やすく|楽しい|わくわく|pop|責めない|趣旨` → 2 行（「責めない文言で、AC-45 の禁止語の対象」と AC-42「趣旨の文言（文言キー `task.rate.score`）」）。どちらも禁止語の一覧と文言キーで測れる形になっている。
  - `grep -noE '[^"]{0,6}(点|ランク|レベルアップ|XP)[^"]{0,6}' backend/public/i18n/ja.json` → 1 件（73 行 `採点はしません。`。要修正 4 の根拠）。en.json の `\b(points?|score|rank|xp|level up)\b`（-i）→ 0 件。
  - `grep -nEi 'miss|streak|連続|途切|逃し' backend/public/i18n/{en,ja}.json` → 0 件（終了コード 1）。`"(guide\.|task\.level\.adjusted)` → 0 件（キーはまだない）。
  - tasks.json（python3 -I）：210 件、キーは area/goal/how/id/insight/level/minutes/mode/title/tools/why、`questions` / `figure` / `answer` を持つ件数 0。組は 14 件（初級・中級）。r12 の AC-3、4、29、43 はすべて落ちる（正しい赤）。
  - `grep -cE '^\s*test\(' backend/tests/acceptance/tests/*.spec.mjs` → 合計 82（23 ファイル）。AC 名の分布は `AC30_` 4、`AC8_` 5、`AC32_` 7、`DESIGN_D30_` 12 など。
  - contracts/schemas/data.schema.json 494〜500 行 → `report` の enum は done / too_hard / too_easy / no_time / none（PRD r12 の `complete` と不一致。提案 10）。
  - contracts/test-hooks.md 141 行 → 「次の一手に進む → 課題」の行はすでにある（提案 11）。208〜216 行 → reducedMotion の仕掛けと spike がある。
  - `git diff --stat 230200d 77fd9d3 -- docs/prd/` → 2 ファイル、+299 / −217。
- 開いた URL と確認した日付：なし。
- 未検証：なし（G0 は文書の判定のみ。playwright は指示どおり動かしていない）。

- 指揮役と tech-lead への質問（判定には影響しない）：(1) Q24（課題集を組ごとに分けるか）は G1 の前に決まるか。AC-15、AC-23、AC-28 のテストの形が変わる。(2) `report` の値の名は `complete` と `done` のどちらにするか。(3) キャラクターの絵は SVG か PNG か（要修正 3 の範囲の決め方に関わる）。(4) en の台詞の 40 字は designer の意図か。

書いたファイル：なし。コミット：なし。

## 記録
- 関門：G0
- 判定した役：verifier
- 回：r5（FB2 の作り直しでは r1）
- 対象：docs/prd/001-daily-learning.md r12（77fd9d3）、product.md r6、`git diff 230200d 77fd9d3 -- docs/prd/`
- 日付：2026-11-05
