# 001-daily-learning G3 design-reviewer r3（FB 1 回目の作り直し。HEAD f46a189。開いた画像は指定の 24 枚）

PASS

（001-daily-learning G3 デザインの判定 r3。指示書のとおり、開いた画像は指定の 24 枚だけです。採点表は 15/16 で、★はすべて満たしました。重大はありません。要修正が 1 件あります。）

## 指摘
- **要修正 1**（G3 の撮影の仕方が仕様と合っていない）
  - 場所：design/001-daily-learning.md:206（5.1 の前書き）と docs/verification/001-daily-learning/evidence/screenshots/index.tsv
  - 何が問題か
    - (a) 5.1 は AX5 を「ブラウザの拡大 200%、幅 320」と決めています。verification.md の冒頭の読み替えも「ルートの文字サイズ 200% と幅 320 CSS px」です。ところが `_ax5.png` の 20 枚は、すべて `390x844@2 32px` で撮られています（`awk` で数えた値は下の「証拠」）。
    - 幅 320 と 200% を合わせた条件で確かめたのは、探索 R8 の S1〜S5 の 7 画面だけです。しかも数値の確認だけで、画像はありません。S6〜S10 とダイアログは、この条件では見ていません。
    - (b) 5.1 は「幅 320 と 390、ライトとダークで 1 つの状態につき 4 枚」と書いています。実際は、通常でない状態はライトで幅 390 の 1 枚だけです。
  - 根拠：仕様 5.1 の前書きと 9 の 562 行目（いちばん大きい文字の条件）。docs/org/gates.md の G3「実際の画面が design/ の仕様どおり」。
  - なぜ重大ではないか：gates の最低線（通常の状態はライト、ダーク、AX5、英語。ほかの状態はライト）は満たしています。390 幅の AX5 で見た範囲では、重なり、意味が分からなくなる切れ、主な操作の消失はありません。
  - 直す方向：どちらか一方にそろえます。
    - verifier が通常の状態の `_ax5` を幅 320 で撮り直す。
    - designer が 5.1 の前書きを gates の最低線に合わせて書き直す（4 枚 / 状態をやめる。AX5 の幅を 390 にするか、320 にするかを決める）。
- **提案 1**（前回 r2 の提案 1。直っていない）
  - 場所：backend/public/app.css:621-629
  - 何が問題か：`summary { display:inline-block; … text-decoration:underline }` のままで、開閉の印がありません。仕様 8 の 519 行目は「`<summary>` では開閉の印」を見える左端にすると書いています。
  - 扱い：重大度は r2 と同じ提案のままにします。S10 の画像は今回の範囲の外なので、CSS だけで確かめました。
  - 直す方向：r2 と同じです。`display:list-item` に戻すか、仕様と tokens から印を消すかのどちらかで、仕様と画面をそろえます。
- **提案 2**（S7 levelDone の撮り方）
  - 場所：S7_task.exhausted_levelDone_light.png
  - 何が問題か：5.1 の #32 は「levelDone（初級）」です。撮られているのは「バックエンド設計の中級を修了しました → 上級に進む」でした。初級から中級へ進む形は seenNext と nextDone の画像で見えるので、実害は小さいです。
  - 直す方向：#32 の行を初級にした画像を撮るか、5.1 の文言を「levelDone（中級）」に直します。
- **提案 3**（FB-1。直すのは pdm の課題集）
  - 場所：S3_task.today_longest_inline_code_w320.png
  - 何が問題か：初級の課題の「やり方 1」で、HTML と JS が本文の中に行内コードとして続けて書かれています。幅 320 では `getElementById("btn"` の後ろで改行されます。横スクロールはなく、読めます。ただ、未経験の人には、どこまでがコードか追いにくい組み方です。
  - 根拠：R-55（平易な言葉）と FB-1。
  - 直す方向：複数行のコードは、課題集の側でコードのブロック（1 行に 1 文）に分けます。
- **指示書の前提との違い**：指示書は「実測（通常 550 ms、節目 950 ms）は verification.md にある」と書いています。しかし verification.md には 550 と 950 の文字がありません（grep で 0 件）。あるのは `DESIGN_D43_` の結果だけです（reduce のとき getAnimations が 0 件で prev も 0 件、reduce でないときは 1 件以上。両ブラウザで PASS）。
  - 時間は実装の CSS の宣言から計算して確かめました（下の「FB-3」）。値は決まった形で出るので「未検証」にはしていません。動いている最中の時間は計っていません。

## FB への対応（見ることの 1〜5）
1. **新しい画面と状態は仕様 r9 どおり**
   - S1：lead が「コードを書いたことがない人から現役のエンジニアまで使えます。…やりたい日は続けて進めます」（S1_diagnosis.start_light.png、_w320.png）。
   - S2
     - 1 問目：6 つの領域それぞれにヒント文があります。ja と en とも句点はありません（S2_question_1_light.png、S2_question_1_en.png）。
     - 2 問目：legend が「この領域（フロントエンド）で、今の段階に近いもの…」で、初級の説明は「コードをほとんど書いたことがない」です（S2_question_2_light.png）。
     - 3 問目：先頭が「まだコードを書いたことがない」の 5 択です（S2_question_3_light.png）。
   - S3：「この段階の 4 / 14 件目」。同じ日の 2 件目は「今日 2 件目の課題 2026-11-04」と「5 / 14」（S3_task.today_light.png、S3_task.today_nth2_light.png）。
   - S4：並びは D-34 / D-44 どおりです（印 → h1 → 累計 → n/N 件目でした → 祝い → 解説 → 問い → 2 ボタンと「今回は答えない」）。
     - 通常（累計 11）は、緑のチェックだけで、祝いの文は color.text です。
     - 節目 7 と 100 は、円とチェックで、文は緑です（「最初の節目です。」「最後の節目です。」）。ダークと AX5 でも同じ要素です（S4_* の 5 枚）。
   - S5
     - 並びは D-45 どおりです（h1 → 題名 → 累計 → 3/14 件目でした → 祝い → 今週 → note → 次の一手 → 解説 → 履歴）。英語と AX5 も同じ並びです（S5_task.done_light.png、_en.png、_ax5.png）。
     - note.last の文は r9 のとおりです：「バックエンド設計の中級の課題は、すべて出し終えています。次に進むと、修了の案内が出ます。」（S5_task.done_note.last_light.png）
   - S6：levelChanged と note.last が重なる場合です。「…段階が初級になります。」の後に「バックエンド設計の初級の課題は、すべて出し終えています。…」が続きます。累計、祝い、解説はありません（S6_task.skipped_levelChanged_note.last_light.png）。
   - S7：4 変種とも D-40 どおりです。
     - levelDone：補足なし。
     - seenNext：「中級の課題は、前に出したものを除いて続きます。難しいときは…」。
     - nextDone：「中級の課題も、すでにすべて出し終えています。…」。
     - allDone：塗りの「別の領域を選ぶ」1 つだけです。
   - S9：11 行で、「今週（月曜から）の完了日数」と「同じ日の 2 件目以降の完了件数」が足されています。グラフも色もありません（S9_settings.stats_light.png）。
   - S5_task.done_en.png の課題の題名と解説が日本語なのは、PRD の 464 行目「課題集と解説は v1 では日本語のみ」に沿ったものです。
2. **FB-3（控えめな演出）**：Takuma が選んだ選択肢の中身に、項目ごとに合っています。
   - 「1 秒未満の短い動き（数字が増える、チェックが描かれる）」
     - app.css:521-566 で、チェックは `stroke-dashoffset` 1→0、数字は prev が上へ 0.3em 動いて消え、value が下から 0.3em 上がって現れます。
     - 終わる時刻は、通常が max(400, 300+250) = 550 ms、節目が max(400+400, 300+400+250) = 950 ms です（python3 で計算）。
   - 「色を出す」：印は color.success、節目の文も color.success です。
   - 「節目では少し特別」：円が先に描かれます（at7 と at100 の画像）。
   - 「視差効果を減らす設定がオンのときは動きを出さない」
     - app.css:85-90 で motion を 0ms にしています。動きは `no-preference` のときだけ付けます。
     - view-task.js:198 の reducedMotion で、prev を作りません。
     - `DESIGN_D43_` は両ブラウザで PASS（g3r4-full-run.log:94、203）。
   - 「連続記録やハートを入れない」
     - i18n の ja と en で「連続、途切れ、逃した、streak、missed」は 0 件です。
     - 感嘆符も 0 件です。
     - 拡大、回転、ぼかしの keyframes もありません。
   - 罪悪感につながる表現はありません。S6 は事実だけで、責める語もありません。
3. **FB-1（未経験の人の入口と、幅 320）**
   - 入口の言葉は、専門用語を言い換えています（「画面の裏側で、データを受け渡す仕組み」「アプリを動かす土台（サーバーや設定）」）。初級の課題でも「JavaScript（ブラウザの中で動くプログラム）」と補っています。
   - 幅 320 の長い行内コードは、折り返されて横スクロールなしで読めます（AC-17 は scrollWidth 320/320）。組み方は提案 3。
4. **FB-2（S5 の「次の一手に進む」が初期表示に入るか）**
   - 幅 390 では、ボタンの上端が画像で y≈850 px（DPR 2）、つまり約 425 CSS px です。表示域 844 の中に入ります。仕様の見積もり 446 px より上です。
   - note.last のある S5 では約 403 px、S6 では約 260 px です。
   - いずれも画像の画素位置から読んだ値で、DOM で計った値ではありません。★の項目ではないので、合否には使っていません。
5. **前回の提案 1**：直っていません。指摘の提案 1 のとおりです。

## 採点表
| カテゴリ | 点 | ★ごとの結果と証拠 |
|---|---|---|
| A 根拠 | 2 | ★調査が先：満たす。git log で調査 854cf47（07:18）が仕様 0d83baf（07:35）より古いです。R は 65 個で、URL か確認日のない R は 0 個、調査にない R-n は 0 個（出力が空）。<br>★決定表：満たす。D-34〜D-45 の全行に R-n と URL / B-n があります（4 の表を grep で確かめた）。<br>★狙い：満たす。差をつける点 2（確認ページの型）が S5 と S6 に出ています。ターゲットと性格語は G1 r4 の PASS の後に変わっていません。「正直」は note.last と levelChanged に表れています。 |
| B HIG と標準部品 | 2 | ★標準部品：満たす。ネイティブの radio、button、dl、details、dialog を使っています（仕様 3 と画面）。<br>★逸脱：満たす。唯一の SVG の印は D-20 の例外として書かれていて、aria-hidden と focusable=false です（view-task.js:152）。 |
| C バウハウス | 2 | ★B-1、B-2：満たす。全画面に h1 が 1 つと主操作が 1 つあります（S7 は塗りが 1 つ。S5 は D-4 で意図して副の形の 1 ボタン）。グラデーションと影は 0 件です（app.css を grep）。演出は FB-3 という仕事に結びついています。 |
| D 使いやすさ | 2 | Nielsen 5（エラーの予防）：S7 の advance は保存してから S3 に移り、S2 は未選択を確定させません。<br>Nielsen 9（エラーからの回復）：保存の失敗には全画面に retry があります（5.1 の #12、#19、#20、#26、#29、#36、#45、#50。verification.md の 3 章）。<br>重大な違反はありません。 |
| E 状態 | 2 | ★7 つの状態：満たす。5.1 の 54 行すべてに証拠があります（verification.md の 3 章と g3r3-state-table.md）。index.tsv は 186 行で、result はすべて ok です。<br>0 件、大量の件数、長い文字は、S9 の zero、累計 100、幅 320 の長いコードで見ています。 |
| F アクセシビリティ | 1 | ★コントラスト：満たす。自分で計算した値は「証拠」にあり、全部の組が基準を超えます。<br>★的 44×44：満たす。`.btn`、`.link`、`.choice`、`summary` が min-height と min-width で --size-target-min（2.75rem = 44px）です（app.css:213、272、371、623）。<br>★アイコンだけの操作：満たす。該当するものがありません（D-20）。印と prev は aria-hidden です（view-task.js:152、164）。axe は 127 画面で violations 0、serious 以上 0 です。incomplete 8 件はダイアログの部分的に隠れた要素で、理由が書かれています。<br>動きを減らす設定の代わりがあります（上の FB-3）。<br>1 点にした理由：AX5 の幅 320 の撮影が仕様と違う（要修正 1）。 |
| G 一貫性 | 2 | 色はトークンだけで、app.css の 16 進の色は :root と media の定義の中だけです。同じ働きの要素は同じ部品です（次の一手は S5 と S6 で同じ文と位置。累計の行は S4、S5、S7 で同じ）。summary の印は提案 1 です。 |
| H 文言 | 2 | ja と en はそろっています（AC-26 で 174 = 174 キー）。ボタンは動詞です（「次の一手に進む」「Start the next task」「中級に進む」）。英語の S5 は置き場所で切れていません（S5_task.done_en.png）。名前はネイティブの文字なので、見える文字が名前の先頭に入ります（WCAG 2.5.3）。 |

合計：2+2+2+2+2+1+2+2 = **15/16**。★はすべて満たし、0 点のカテゴリはなく、13 点以上なので、合否の線を満たします。PASS です。

## 前回の指摘の追跡
| 前回の指摘 | 直った / 直っていない | 証拠 |
|---|---|---|
| r2 の提案 1：summary の開閉の印 | 直っていない（提案のまま） | app.css:621-629 は `display:inline-block`、`text-decoration:underline` のまま |

## 証拠
- **対象**：feat/001-daily-learning の HEAD f46a189 時点の作業ツリー（backend/public と、verifier の evidence）。実装は verification.md のとおり 7a59e84 から変わっていません。
- **見た画像**（すべて /Users/takumamatsuura/src/engineer/docs/verification/001-daily-learning/evidence/screenshots/ の下）
  - S1, S2：S1_diagnosis.start_light.png、S1_diagnosis.start_w320.png、S2_question_1_light.png、S2_question_1_en.png、S2_question_2_light.png、S2_question_3_light.png
  - S3：S3_task.today_light.png、S3_task.today_nth2_light.png、S3_task.today_longest_inline_code_w320.png
  - S4：S4_task.rate_total11_light.png、S4_task.rate_total11_dark.png、S4_task.rate_at7_light.png、S4_task.rate_at100_light.png、S4_task.rate_total11_ax5.png
  - S5, S6：S5_task.done_light.png、S5_task.done_note.last_light.png、S5_task.done_en.png、S5_task.done_ax5.png、S6_task.skipped_levelChanged_note.last_light.png
  - S7, S9：S7_task.exhausted_levelDone_light.png、S7_task.exhausted_allDone_light.png、S7_task.exhausted_seenNext_light.png、S7_task.exhausted_nextDone_light.png、S9_settings.stats_light.png
  - それぞれで見えたことは、上の「FB への対応」の 1 に書きました。
- **第一印象**（画像だけを見て書いた 1 文。どれも仕様の目的と合います）
  - S4：「終えたことを確かめて、役に立ったかに答える画面」。
  - S5：「記録されたことを確かめ、続けるか止めるかを決める画面」。
  - S7：「修了を知り、次の段階に進むかを決める画面」。
- **読んだファイル**
  - 承認、型、関門：docs/approvals/001-daily-learning-FB1.md、docs/templates/review-report.md、docs/org/gates.md（G3）
  - 仕様とトークン：design/001-daily-learning.md（D-4、D-13、D-20、D-34〜D-45、5.1、206 行目、519 行目、562 行目）、design/tokens.md（5）
  - 検証：docs/verification/001-daily-learning/verification.md（冒頭、コマンド 6、3 章、7 章、8 章、9 章、11 章、13 章）
  - 前回の判定：docs/reviews/001-daily-learning-G3-design-reviewer-r2.md（提案 1）
  - 実装：backend/public/app.css（1-110、475-570、615-630）、backend/public/js/view-task.js の grep、backend/public/i18n/en.json の grep
  - テスト：backend/tests/acceptance/tests/ac17-ac18-ac27-a11y.spec.mjs:85-115
  - PRD：docs/prd/001-daily-learning.md の 143 行目と 464 行目
- **実行したコマンドと結果**
  - `git log --diff-filter=A … design/001-daily-learning-research.md design/001-daily-learning.md`
    - 結果：0d83baf 2026-10-30 07:35 仕様、854cf47 2026-10-30 07:18 調査
  - R の数とその確かめ
    - `grep -cE '^\| R-[0-9]+'` → 65
    - URL か確認日のない R → 0
    - `comm -23 …`（調査にない R-n）→ 空
  - index.tsv
    - result の列（12 列目）→ `186 ok`
    - variant / viewport / rootFontSize → ax5 20 枚はすべて `390x844@2 32px`、dark 18、en 21、light 124、w320 3（320x568）
  - axe-summary.tsv → 127 行、violations 0、serious 以上 0、incomplete 8
  - 演出の終わる時刻：`python3 -c "print(max(400,300+250), max(400+400,300+400+250))"` → `550 950`
  - `grep -ciE '連続|途切れ|逃した|streak|missed'` i18n の ja と en → 0 / 0。ja の感嘆符 → 0
  - コントラスト（WCAG の式。app.css のトークンの値から計算）

    | 組 | ライト | ダーク | コントラストを上げる（ライト） | コントラストを上げる（ダーク） |
    |---|---|---|---|---|
    | text / bg | 16.48 | 15.29 | 21.0 | 21.0 |
    | text.secondary / bg | 7.0 | 8.93 | 13.58 | 15.91 |
    | link / bg | 6.7 | 8.89 | 9.84 | 12.21 |
    | on-primary / primary | 6.7 | 8.24 | 9.84 | 12.21 |
    | border / bg | 5.33 | 5.57 | 21.0 | 21.0 |
    | success / bg | 6.29 | 10.43 | 9.95 | 14.28 |

    - 基準は、文字 4.5:1 以上、非文字（枠と印）3:1 以上です。全部の組が満たします。
- **開いた URL**：なし。G3 の今回の範囲として、競合の確かめは G1 r3 と r4 の分に依ります。
- **未検証**
  - ★の項目ではないもの：実機の Safari 17、VoiceOver の実際の読み上げ、OS の文字サイズ最大は G4 の Takuma の確認です（verification.md の 13 章）。幅 320 で 200% の画像は要修正 1 です。演出の時間を動かして計った値もありません（CSS の宣言から計算）。
  - ★の未検証：なし。

## 記録
- 関門：G3
- 判定した役：design-reviewer
- 回：r3（FB 1 回目の作り直しで 1 回目。前の 1 体は作業の上限で報告なし）
- 対象：feat/001-daily-learning、HEAD f46a189
- 日付：2026-11-05
