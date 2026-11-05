# 画面の図（文字）001-daily-learning

design/001-daily-learning.md の補助。幅 320 CSS px（AC-17 の条件）での並びを文字で描く。
`[ ]` は副操作のボタン（枠）、`[[ ]]` は主操作のボタン（塗り）、`<u>…</u>` はリンク（下線）。縦の線 `|` は本文の列の左右の線（space.4 の余白の内側）。`┌ ┐ └ ┘` は 1 px の枠（案内とダイアログ、入力欄）。色は付けない。r6（2026-11-03）：S1 の案内を枠で描き、S3 に「日付が変わった後」の図を足し、S8 と S10 の注記を直した（design-reviewer G3 r1 の 3、4、8、11）。r7（2026-11-05。仕様 r7、FB-1〜FB-3）：S2 に 1 問目（ヒント文）の図を足し、S3 に進み具合の行、S4 と S5 を累計・祝い・解説・今週・次の一手の並びに描き直し、S6 と S7（2 変種）の図を足し、S9 を 11 行にした。r8（2026-11-05。仕様 r8）：S1 の lead.1 と S8 の `settings.redo.note` を仕様 7 の r7 の文に直した（design-reviewer G1 r3 の要修正 3）。S2 の 2 問目の legend に「この領域で」。S4 に完了の印と `task.progress.done`、祝いの既定の文を `{count}` の形に。S5 を「解説をボタンの後ろ」の並びに描き直し（D-45）、`task.next.note.last` の注記。S6 に段階が変わった変種、S7 に `task.exhausted.nextDone` と再読み込みの注記。r9（2026-11-05。仕様 r9）：S4 の印と文字の間（space.2）、累計の value と prev の包み（D-43、提案 2）。S5 と S6 の `task.next.note.last` を次に出す組について言う文に（D-44 (2)、design-reviewer G1 r4 の要修正 1）。S6 に levelChanged と note.last が重なる注記。 **r11（2026-11-06。仕様 r11、PRD r13 の FB2）**：S1 にミル（案内役）と lead.1 / lead.3 の新しい文、S3 を「問 0 / 3」と「返し」の 2 図に描き直し、図の 6 型の図、S4 をまとめ（正答数、ミル、累計…）、S5 に正答数、S6 を申告 1 種類、S7 にミル、S8 に節「案内役」、S9 を 13 行、S10 に正答数と「選んだ答えを見る」。答えの欄、難しすぎ／簡単すぎ、「完了」ボタン、外で行う課題の印は消した。`┃` は図の強調の箱（3 px の color.figure.accent）。

## S1 diagnosis.start（iOS の Safari、非スタンドアロン、閉じた印なし）
```
| 今日の一手                        設定 |   ← header（static。診断前は nav に「設定」だけ。設定 → S8 の「保存データなし」の表示。AC-20、AC-21 のため）
|                                        |
| 3 問に答えると、今日の学習が 1 つ出ます |   h1 text.title
|                                        |
| コードを書いたことがない人から現役のエン |   lead.1〜.3（text.body。lead.1 と lead.3 は r11 で差し替えた文：仕様 7）
| ジニアまで使えます。15 分（初級は 10 分） |
| で終わる課題が出ます。読んで、3 問の選択  |
| 肢を選ぶだけで、その場で正誤と理由が分か |
| ります。                                |
| 登録はありません。入力したデータは…    |
| 正答数に合わせて、次の課題から段階が自動 |
| で変わります。                          |
|                                        |
| ┌────┐  ミル                           |   aside guide.character（data-mood=idle、aria-label=ミル。r11。D-53）：img guide.sprite 96×96（aria-hidden、pixelated）
| │ ・ ・│  │3 問に答えてください。今日の  |   p guide.name（text.small、color.guide）、p guide.say（text.body。左に 2 px の縦線 color.guide。文言 guide.intro）
| └────┘  │一手を決めます。              |   幅 480 未満では絵の下に縦に積む。showCharacter が false なら 0 件
|                                        |
| ┌────────────────────────────────────┐ |   section home.addToHomeScreen（案内。四方 1 px の枠 color.border。tokens 4「案内」）
| │ ホーム画面に追加してから始めること │ |   h2 .title（color.warning）
| │ をおすすめします                   │ |
| │ Safari は 7 日間使わないと…       │ |   .why
| │ 1. 画面の下（iPad では上）の共有… │ |   .steps（ol）
| │ 2. 「ホーム画面に追加」を選び…     │ |
| │ 3. ホーム画面の「今日の一手」を…   │ |
| │ 4. すでに Safari で診断した場合：… │ |
| │ [ 閉じる ]                         │ |   .close（副操作。幅は枠の内側いっぱい：tokens 4 のボタンの幅の規則）
| └────────────────────────────────────┘ |
|                                        |
| [[ 診断を始める ]]                     |   主操作（列いっぱい、44 px 以上）
```
スタンドアロン表示のとき：説明の直後に `home.standalone.import` の文と `[ ファイルを読み込む ]`（見えるボタン `home.standalone.importButton`。隠した `<input type="file">` `home.standalone.importFile` の `click()` を呼ぶ。S8 と同じ型）が、同じ枠の案内（section `home.standalone`）として入り、ホーム画面の案内は出ない。

## S0 error（保存先が使えない。tech-lead r1 P1）
```
| 今日の一手                             |   header（アプリ名だけ）
|                                        |
| このブラウザでは保存を使えません。     |   h1 error.app.storageUnavailable.message
| ブラウザの設定で、このサイトのデータの  |   error.app.storageUnavailable.detail
| 保存（Cookie とサイトデータ）が止められ |
| ています。…                            |
| [[ 再読み込み ]]                       |   error.app.reload（主操作。書き出しと削除は出さない）
```
保存データが形式に合わないときの error は、h1 `error.app.message`、`error.app.detail`、`[[ 再読み込み ]]`、`[ 壊れたデータをファイルに保存 ]`、`[ すべてのデータを削除 ]`（color.error）。

## S2 diagnosis.question（初回の 1 問目。r7：ヒント文 AC-39）
```
| 今日の一手                        設定 |   header（初回の S2 と途中の再開は nav に「設定」だけ。S7 か S8 から入ったやり直しの S2 は診断後なので「履歴  設定」。design-reviewer r2 の 3）
|                                        |
| 質問 1 / 3                             |   diagnosis.progress（text.small、data-question-index=1）
|                                        |
| 伸ばしたい領域を 1 つ選んでください     |   legend（text.heading）
| ( ) バックエンド設計                   |   radio + label（高さ 44 px 以上、間 space.2。名前とヒント文は同じ label の中で縦に積む）
|     画面の裏側で、データを受け渡す仕組み |   area.backend.desc（text.small、secondary。1 文、句点なし。D-41）
| ( ) フロントエンド                     |
|     ブラウザに映る画面と、その動き      |   area.frontend.desc
| ( ) データベース                       |
|     データのしまい方と、取り出し方      |
| ( ) インフラとクラウド                 |
|     アプリを動かす土台（サーバーや設定）|
| ( ) テストと品質                       |
|     正しく動くかを確かめ、壊れにくくする |
|     方法                                |
| ( ) Git とチーム開発                   |
|     変更の記録と、ほかの人との共同作業  |
|                                        |
| [[ 次へ ]]                             |   主操作
```

### S2 diagnosis.question（初回の 2 問目）
```
| 今日の一手                        設定 |
|                                        |
| 質問 2 / 3                             |   diagnosis.progress（text.small、data-question-index=2）
|                                        |
| この領域（バックエンド設計）で、今の段階 |   legend（text.heading。r8：「この領域で」を足した。D-41）
| に近いものを選んでください              |
| ( ) 初級                               |   radio + label（高さ 44 px 以上、間 space.2）
|     コードをほとんど書いたことがない    |   level.beginner.desc（text.small、同じ label の中。r7 で PRD 9 の趣旨に）
| (•) 中級                               |
|     仕事や学習でコードを書いている（人に |   level.intermediate.desc
|     聞きながらでもよい）                |
| ( ) 上級                               |
|     設計を決め、人に教えている          |
|                                        |
| 保存できませんでした。入力はそのまま残っ |   error.storage.message（AC-11 のときだけ。role=alert、color.error）
| ています。                              |
| [ もう一度保存する ]                   |   error.storage.retry
|                                        |
| [[ 次へ ]]                             |   主操作（3 問目は「診断を終える」）
| [ 前の質問へ ]                         |   副操作
```
3 問目（r7）：legend「コードを書いてきた年数に近いものを選んでください」、radio 5 つ：`( ) まだコードを書いたことがない`（`years.never`。先頭）、`( ) 1 年未満`、`( ) 1〜3 年`、`( ) 3〜5 年`、`( ) 5 年以上`。ヒント文はない。

## S3 task.today（r11：問 0 / 3。開いた直後。導入の図は flow の例）
```
| 今日の一手                 履歴  設定 |   header（position: static）
|                                        |
| 今日の課題 2026-11-06                  |   task.today.label（text.small、secondary。2 件目以降は task.today.label.nth）
| この段階の 4 / 14 件目                 |   task.progress（text.small、secondary。data-progress-index=4、-total=14 は article task.today の属性）
| 直近の課題の正答数に合わせて、段階を    |   task.level.adjusted.down（段階が変わった直後の課題だけ。text.body、color.text。D-60）
| 初級にしました。                       |
| リクエストが届いてから返事を返すまで    |   h1 task.today.title（text.title。折り返す）
| バックエンド設計 / 初級 / 所要時間 10 分 |   task.meta（text.small。1 行の文として折り返す）
|                                        |
| …導入の本文（intro。300 字以内。       |   p task.intro.text（text.body。行内の code は等幅）
| なぜ今これかを含む）…                  |
| ┌──────────┐    ┌──────────┐    ┌──────────┐ |   figure task.figure（role=img、aria-label=alt、data-figure-type=flow、data-figure-of=intro、data-figure-highlight=1）
| │ 受け取る │ →  ┃ 確かめる ┃ →  │ 返す     │ |   箱 [data-figure-part=box]（枠 2 px color.text、角 8 px）、矢印は inline SVG [data-figure-part=line]（stroke 2 px color.text）
| └──────────┘    └──────────┘    └──────────┘ |   強調の箱（┃）は枠 3 px の color.figure.accent、ラベル 700 の color.figure.accent。幅 480 未満では縦に積み矢印は ↓
|                                        |
| 問 1 / 3                               |   h2 task.question.heading（text.heading、tabindex=-1）。section task.question（data-question-number=1。答える前は data-answer-result なし）
| …問題文（100 字以内。場面から始まる）… |   p task.question.text（text.body）
| [ 届いた値をそのまま保存する         ] |   button task.choice（data-choice-index=0。副操作の形：枠 1 px color.border、左寄せ、44 px 以上、列いっぱい）
| [ 値を確かめてから保存する           ] |   button task.choice（data-choice-index=1）
| [ 保存してから値を確かめる           ] |   button task.choice（data-choice-index=2）。3 つは role=group task.question.choices の中（aria-labelledby は h2）
|                                        |
| 今日はやめておくと、この課題は答えた分  |   task.skip.note（text.small、secondary。D-26）
| だけ履歴に残ります。続けたくなったら、  |
| 次の一手に進めます。                    |
| [ 今日はやめておく ]                   |   button task.skip（副操作の形。列いっぱい。D-3）
```
初期表示（幅 390、文字 100%）に、ヘッダー、ラベル、進み具合、題名、meta、導入の 3〜4 行と図の先頭が入る（仕様 8）。`guide.character` は 0 件（AC-31）。`task.insight.text` は DOM にない（AC-38）。

## S3 task.today（r11：問 1 に不正解で答えた返し。問 2 はまだ出ていない）
```
| 問 1 / 3                               |
| …問題文…                               |
| [ 届いた値をそのまま保存する   選んだ答え ] |   task.choice（data-choice-state=selected-incorrect、aria-disabled=true。枠 2 px color.border。末尾に span task.choice.tag.selected（text.small））
| [ ✓ 値を確かめてから保存する   正解      ] |   task.choice（data-choice-state=correct、aria-disabled=true。先頭に svg task.answer.mark（color.success、aria-hidden）、末尾に span task.choice.tag.correct（text.small、color.success））
| [ 保存してから値を確かめる             ] |   task.choice（data-choice-state=none、aria-disabled=true。見た目は変えない）
|                                        |
| 惜しい                                 |   div task.question.feedback（不透明度 0→1、150 ms。reduce では即時）> p role=status task.answer.result.incorrect（text.heading、color.text。正解のときは「✓ 正解」で color.success）
| ┌────┐  ミル                           |   aside guide.character（data-mood=incorrect、aria-label=ミル）：img guide.sprite 96×96（aria-hidden、pixelated）を左、右に p guide.name（text.small、color.guide）
| │ ಠ_ಠ│  │もう一度、図と問題文を見て    |   p guide.say（text.body。左に 2 px の縦線 color.guide。文言 guide.incorrect）。幅 480 未満では絵の下に縦に積む
| └────┘  │みましょう。                  |
|                                        |
| 選んだ答えについて                     |   p task.question.explain.label.selected（text.small、secondary）
| …選んだ選択肢の explain（120 字以内）… |   p task.question.explain（data-explain-for=selected。中身は explain と等しい）
| 正解について                           |   p task.question.explain.label.correct（不正解のときだけ）
| …正解の選択肢の explain…               |   p task.question.explain（data-explain-for=correct）
| [[ 次の問題へ ]]                       |   button task.question.next（主操作。問 3 の後は task.summary.open「まとめへ」）
|                                        |
| 今日はやめておくと、…                   |   task.skip.note と task.skip は最後の問の下に残る
| [ 今日はやめておく ]                   |
```
選択肢を押してから `data-answer-result` が付くまで 300 ms 以内（AC-41）。「次の問題へ」で問 2 が下に足され（問 1 の返しは残り、ミルは消える）、問 2 の h2 にフォーカスが移る（D-64）。再読み込みで復元した返しにはミルが出ない（D-53）。`showCharacter` が false なら `guide.character` は 0 件で、他は同じ。

## 図の 6 型（r11。D-50、D-51。上：幅 480 以上、下：幅 480 未満。┃ は強調の箱）
```
flow（箱と矢印 2〜5）           layers（積み重ね 2〜5）        compare（見出し 2 + 行 1〜3）
┌────┐ → ┃────┃ → ┌────┐        ┌──────────────┐                ┌──────────┬──────────┐
└────┘   ┃────┃   └────┘        │ 画面         │                │ 同期     │ 非同期   │  見出し（700、下枠 2 px）
                                 ├──────────────┤                ├──────────┼──────────┤
幅 480 未満：                    ┃ API          ┃  強調          │ 待つ     ┃ 待たない ┃  行（対。強調は 1 セル）
┌────┐                           ├──────────────┤                └──────────┴──────────┘
└────┘                           │ データベース │                常に 2 列。ラベルは列の中で折り返す
  ↓                              └──────────────┘
┃────┃  強調                     常に縦（labels[0] が上）
  ↓
┌────┐
└────┘

sequence（番号つき 2〜5）        tree（親 1 + 子 2〜4）          split（1 → 2〜3）
(1) 書く                         ┌──────┐                        ┌──────┐
(2) 確かめる   ← 強調：丸と      │ 親   │                        │ 入力 │
(3) 送る         ラベルが橙      └──┬───┘                        └──┬───┘
番号は CSS counter の ::before     ┌──┴─┬────┐   線 2 px（border）   → 子 1 ┃ → 子 2 ┃ ← 矢印は SVG
常に縦                          ┌┴─┐┌┴─┐┌┴──┐                     幅 480 未満：縦に並べ、左の縦線から
                                │子││子││子 │                     各子へ矢印（→）
                                └──┘└──┘└───┘
                                幅 480 未満：子を縦 1 列、左に縦の線と各子への短い横線
```
どの型も `task.figure` に `background-color: var(--color-bg)` を明示し、線（`[data-figure-part="line"]`）の `border-color` / `stroke` と地の比を 3:1 以上にする（AC-44 の (a)。D-52）。文字は axe-core。図の中に `<img>` はない。

## S4 task.rate（r11：まとめ。正答数、ミル celebrate、累計、進み具合、祝い、解説、役に立ったか。D-34、D-43、D-59）
```
| 今日の一手                 履歴  設定 |
|                                        |
| ✓ 完了しました                         |   article task.rate（data-score=2）> h1 task.rate.title（フォーカス）。先頭の ✓ は task.rate.mark（400 ms で描かれる。節目は円が先）
| 3 問中 2 問に正解しました              |   p task.rate.score（text.body。「点」の語なし）
| ┌────┐  ミル                           |   aside guide.character（data-mood=celebrate）。絵は静止
| │ ^ω^│  │2 問は見えていました。あと 1  |   p guide.say（文言 guide.rate.score2。節目なら guide.rate.milestone）
| └────┘  │問は次に生きます。            |
| これまでに完了した課題  11 件          |   p task.total：label（text.small）+ value（text.title。data-stat-completed=11。300 ms から前の値 10 が上へ消え 11 が下から：D-43）
| この段階の 4 / 14 件目でした           |   p task.progress.done（text.small、secondary）
| 11 件目を終えました。                  |   p task.cheer（data-milestone=none。節目は at7 / at30 / at100 で color.success）
|                                        |
| ひとこと解説                           |   h2 task.insight
| …課題集の insight（1〜120 字）…        |   p task.insight.text
|                                        |
| この課題は役に立ちましたか             |   task.rate.question
| [ 役に立った ]                         |   同格の副操作 2 つ（縦）
| [ 立たなかった ]                       |
| 今回は答えない                         |   task.rate.close（文字のボタン、44 px）
```
演出は印と数字だけで 1 秒未満（通常 550 ms、節目 950 ms）。ミルは動かない。`prefers-reduced-motion: reduce` では最終の状態だけ。「次の一手に進む」は S5。

## S5 task.done（r11：正答数の行を足した。D-4、D-45）
```
| 完了を記録しました                     |   article task.done（data-score=2）> h1 task.done.title（フォーカス）
| 完了した課題：…題名…                   |   task.done.task（text.small、secondary）
| 3 問中 2 問に正解しました              |   task.rate.score（同じ文言キー）
| これまでに完了した課題  11 件          |   task.total（静止）
| この段階の 4 / 14 件目でした           |   task.progress.done
| 11 件目を終えました。                  |   task.cheer
| 今週（月曜から）の完了日数：3 日        |   task.week
| 明日も課題が 1 件出ます。続けるなら、次 |   task.next.note（組の最後なら task.next.note.last）
| の一手に進めます。                      |
| 次の課題のファイルをまだ取り込めていま  |   （オフラインで次の組が無いときだけ）p role=alert error.tasks.offline（color.error）+ button task.next.retry「もう一度進む」。D-61
| せん。ネットにつないでから…            |
| [ 次の一手に進む ]                     |   task.next（副操作の形。列いっぱい）
| ひとこと解説                           |   h2 task.insight + task.insight.text（ボタンの後ろ：D-45）
| …insight…                              |
| <u>履歴を見る</u>                      |   task.done.history
```
ミルは出ない（D-53）。再読み込みしても同じ。

## S6 task.skipped（r11：申告は「今日はやめておく」の 1 種類。段階の文は消えた）
```
| 今日はやめておきました                 |   h1 task.skipped.title（フォーカス）
| 明日も課題が 1 件出ます。続けるなら、次 |   task.next.note（か .last）
| の一手に進めます。                      |
| [ 次の一手に進む ]                     |   task.next（オフラインで次の組が無ければ直上に error.tasks.offline + task.next.retry）
| <u>履歴を見る</u>                      |   task.skipped.history
```
解説、累計、祝い、正答数、ミルは出さない。答えた分（answers、score）は履歴の行にだけ残る（S10）。

## S7 task.exhausted（r11：ミル celebrate を h1 の直後に。levelDone の例）
```
| バックエンド設計の初級を修了しました   |   h1 task.exhausted.levelDone（フォーカス）
| ┌────┐  ミル                           |   aside guide.character（data-mood=celebrate）
| │ ^ω^│  │この段階の課題は、全部見まし  |   guide.say（文言 guide.exhausted.levelDone。allDone は guide.exhausted.allDone）
| └────┘  │た。次に進めます。            |
| これまでに完了した課題  14 件          |   task.total
| この段階の 14 件をすべて出し終えました。|   task.exhausted.levelDone.detail
| 次の段階に進むと、その課題は今日から出  |
| ます。                                  |
| 次の段階は中級です。仕事や学習でコード  |   task.exhausted.next（{nextLevel}、{desc}）
| を書いている（人に聞きながらでもよい）。|
| （中級の課題は、前に出したものを除いて  |   task.exhausted.seenNext か .nextDone（条件つき。D-40）
| 続きます。…）                          |
| 次の課題のファイルをまだ取り込めていま  |   （オフラインで次の段階の組が無いときだけ）error.tasks.offline + task.next.retry。D-61
| せん。…                                 |
| [[ 中級に進む ]]                       |   task.exhausted.advance（主操作）
| [ 別の領域を選ぶ ]                     |   task.exhausted.redo（副操作）
```
allDone：h1 `task.exhausted.allDone` → ミル → 累計 → `task.exhausted.allDone.detail` → `task.exhausted.redo`（主操作）。r10 と同じ。

## S8 settings（r11：節「案内役」を「診断」の直後に。診断済み、iOS の Safari の例）
```
| 設定                                   |   h1
| データ                                 |   h2 settings.data.title（r10 と同じ：注記、注意、書き出す、読み込む）
| …                                      |
| 診断                                   |   h2 settings.diagnosis.title（r10 と同じ）
| いまの領域：バックエンド設計、段階：初級 |
| [ 診断をやり直す ]                     |
| …注記…                                 |
| 案内役                                 |   h2 settings.character.title（r11。D-56）
| [x] 案内役のミルを表示する             |   input type=checkbox settings.character.show（checked=showCharacter）+ label settings.character.show.label（44 px）
| 非表示にしても、解説、累計、祝いの文は  |   p settings.character.note（text.small、secondary）
| 出ます。                               |
| ホーム画面                             |   h2（iOS の Safari だけ。r10 と同じ）
| 記録 / 削除 / 版 / プライバシー        |   r10 と同じ
```
保存データなしの S8（S1 から来たとき）：「データ」（読み込みだけ）→ 「案内役」→（ホーム画面）→ 版、プライバシー（U-25）。

## S9 settings.stats（r11：13 行。tooHard を消し、答えた問題数、正解した問題数、正答 1 問以下の課題数を足した）
```
| 統計                                   |   h1
| 今日 2026-11-06                        |   settings.stats.today
| 初めて開いた日        2026-11-01       |   dl：dt は text.heading、dd は text.body（縦に積む）。dd は data-stat-*
| 出した課題の件数      6                |
| 完了した件数          4                |
| 初めて開いた日に完了したか  完了した    |   dd の中に span .yes / .no
| 直近 7 日に完了した日数    3           |
| 今週（月曜から）の完了日数  2          |
| 同じ日の 2 件目以降の完了件数  1       |
| 「役に立った」の件数   2               |
| 「役に立ったか」に答えた件数  2        |
| 答えた問題数          13               |   settings.stats.questionsAnswered（data-stat-questions-answered。r11）
| 正解した問題数        10               |   settings.stats.questionsCorrect（data-stat-questions-correct。r11）
| 正答 1 問以下で完了した課題数  1       |   settings.stats.lowScoreTasks（data-stat-low-score-tasks。r11）
| 「今日はやめておく」の件数  1          |   settings.stats.noTime（data-stat-no-time）
| …注記…                                 |   settings.stats.note
| <u>設定に戻る</u>                      |   settings.stats.back
```

## S10 history（r11：1 行の例。正答数と「選んだ答えを見る」を足し、答えの本文の開閉を消した）
```
| 履歴                                   |   h1
| 2026-11-06                             |   li history.row（data-task-id、data-date、data-report=done、data-helpful=helpful、data-score=2）> history.row.date（text.small）
| リクエストが届いてから返事を返すまで    |   history.row.taskTitle
| 完了 ・ 3 問中 2 問 ・ 役に立った       |   report.done、history.row.score、helpful.yes（縦に積んでもよい）
| ▸ 選んだ答えを見る                     |   details > summary history.row.answers（44 px）
|   1. 届いた値をそのまま保存する  惜しい |   ol > li history.row.answer.item（data-question-number=1、data-correct=false。文字は選択肢の text + task.answer.result.incorrect の文言）
|   2. 値を確かめてから保存する    正解   |   data-correct=true
|   3. …                           正解   |
| 2026-11-05                             |   no_time の行：report.noTime「今日はやめておく」。答えた問があれば history.row.score と details、なければどちらも出さない
| …題名…                                 |
| 今日はやめておく ・ 3 問中 1 問          |
| 2026-11-04                             |   none の行：report.none「申告なし」（日付が変わった課題）
```
空：`history.empty` + 主操作 `history.empty.action`（r10 と同じ）。

## ダイアログ settings.delete.confirm、settings.import.confirm
r10 と同じ（文言の「答え」を「選んだ答え」に変えただけ）。
