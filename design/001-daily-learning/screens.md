# 画面の図（文字）001-daily-learning

design/001-daily-learning.md の補助。幅 320 CSS px（AC-17 の条件）での並びを文字で描く。
`[ ]` は副操作のボタン（枠）、`[[ ]]` は主操作のボタン（塗り）、`<u>…</u>` はリンク（下線）。縦の線 `|` は本文の列の左右の線（space.4 の余白の内側）。`┌ ┐ └ ┘` は 1 px の枠（案内とダイアログ、入力欄）。色は付けない。r6（2026-11-03）：S1 の案内を枠で描き、S3 に「日付が変わった後」の図を足し、S8 と S10 の注記を直した（design-reviewer G3 r1 の 3、4、8、11）。r7（2026-11-05。仕様 r7、FB-1〜FB-3）：S2 に 1 問目（ヒント文）の図を足し、S3 に進み具合の行、S4 と S5 を累計・祝い・解説・今週・次の一手の並びに描き直し、S6 と S7（2 変種）の図を足し、S9 を 11 行にした。r8（2026-11-05。仕様 r8）：S1 の lead.1 と S8 の `settings.redo.note` を仕様 7 の r7 の文に直した（design-reviewer G1 r3 の要修正 3）。S2 の 2 問目の legend に「この領域で」。S4 に完了の印と `task.progress.done`、祝いの既定の文を `{count}` の形に。S5 を「解説をボタンの後ろ」の並びに描き直し（D-45）、`task.next.note.last` の注記。S6 に段階が変わった変種、S7 に `task.exhausted.nextDone` と再読み込みの注記。r9（2026-11-05。仕様 r9）：S4 の印と文字の間（space.2）、累計の value と prev の包み（D-43、提案 2）。S5 と S6 の `task.next.note.last` を次に出す組について言う文に（D-44 (2)、design-reviewer G1 r4 の要修正 1）。S6 に levelChanged と note.last が重なる注記。

## S1 diagnosis.start（iOS の Safari、非スタンドアロン、閉じた印なし）
```
| 今日の一手                        設定 |   ← header（static。診断前は nav に「設定」だけ。設定 → S8 の「保存データなし」の表示。AC-20、AC-21 のため）
|                                        |
| 3 問に答えると、今日の学習が 1 つ出ます |   h1 text.title
|                                        |
| コードを書いたことがない人から現役のエン |   lead.1〜.3（text.body。lead.1 は r7 で差し替えた文：仕様 7）
| ジニアまで使えます。15 分（初級は 10 分） |
| で終わる課題が毎日 1 つ出て、やりたい日  |
| は続けて進めます。                      |
| 登録はありません。入力したデータは…    |
| 難しすぎ・簡単すぎの申告が 2 回続くと…  |
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

## S3 task.today（external の例）
```
| 今日の一手                 履歴  設定 |   header（nav は flex-wrap で 2 行目に落ちてよい）
|                                        |
| 今日の課題 2026-10-30                  |   task.today.label（text.small、secondary。同じ日の 2 件目以降は task.today.label.nth「今日 2 件目の課題 2026-10-30」）
| この段階の 4 / 14 件目                 |   task.progress（text.small、secondary。r7。AC-36。data-progress-index=4、-total=14 は article task.today の属性）
| 自分のリポジトリの直近 10 コミットを    |   h1 task.today.title（text.title。折り返す）
| 読み、1 つを分割し直す                 |
| Git とチーム開発 / 中級 / 所要時間 15 分 |   task.meta（text.small。1 行の文として折り返す）
| [外で行う]                             |   task.external.badge（枠だけの印。external のときだけ）
| 要る道具                               |   dl > dt（text.heading）
| ・ターミナル                           |   dd > ul（課題集の tools）
| ・Git                                  |
|                                        |
| なぜ今これか                           |   h2 task.why（text.heading）
| …本文…                                 |
| やり方                                 |   h2 task.how
| …本文（行内の code は等幅）…           |
| 完了の目安                             |   h2 task.goal
| …本文…                                 |
|                                        |
| 答え（任意）                           |   label task.answer.label（text.heading）
| 採点はしません。入力は自動で保存され、  |   task.answer.help（text.small）
| 今日中なら開き直しても残ります。        |
| ┌────────────────────────────────┐     |   textarea task.answer（rows=6、16 px、枠 color.border）
| │                                │     |
| │                                │     |
| └────────────────────────────────┘     |
| 保存しました                           |   task.answer.saved（role=status、color.success、text.small）
|                                        |
| 申告すると、この課題は履歴に移ります。  |   task.report.note（text.small。r7 で差し替え）
| 続けるかどうかは、その後に選べます。    |
| [[ 完了 ]]                             |   主操作（列いっぱい）
| [ 難しすぎ ]  [ 簡単すぎ ]             |   副操作 3 つ（flex-wrap。320 px では 1 列に 1 つずつ）
| [ 今日はできない ]                     |
```
初期表示（幅 320、文字 100%）に、ヘッダー、ラベル、進み具合、題名、meta、「なぜ今これか」の 2 行目までが入る（差をつける点 1。r7 で進み具合の 1 行が増えた）。

### S3 task.today（画面を開いたまま日付が変わった後の最初の操作の直後。D-30）
```
| 今日の一手                 履歴  設定 |
|                                        |
| 日付が変わったため、直前の操作は無効に |   task.dayChanged（p role=status tabindex=-1。text.body、color.warning。フォーカスはここに移り、画面の先頭が見える）
| なりました。前の課題は履歴にあります。 |
|                                        |
| 今日の課題 2026-10-31                  |   task.today.label（以下は通常の S3 と同じ。答えの欄は空）
| …翌日の課題の題名…                     |   h1
```
出るのは「操作」で翌日の S3（か S7）に着いたときだけ（読み込みでは出ない）。次の操作（ボタン、リンク）か再読み込みで消える。textarea への入力では消えない。S7 では h1 `task.exhausted.levelDone`（か `.allDone`）の上に同じ知らせ。

## S4 task.rate（r7：累計、祝い、解説を足した。r8：完了の印と演出、進み具合。D-34〜D-36、D-38、D-43、D-44）
```
| 今日の一手                 履歴  設定 |
|                                        |
| ✓ 完了しました                         |   h1（フォーカスを移す）。先頭の ✓ は inline SVG task.rate.mark（1em、線は color.success、aria-hidden。✓ と文字の間は space.2）。描いた直後に線が 400 ms で描かれる。節目（7 / 30 / 100）では ✓ を囲む円が先に 400 ms で描かれる（D-43）
| これまでに完了した課題  7 件           |   p task.total：span task.total.label（text.small、secondary）+ span task.total.value（text.title、color.text。data-stat-completed=7。最初から最終の値）。描いた直後は同じ位置に aria-hidden の span task.total.prev「6 件」が重なり（value と prev は position: relative の inline-block の包みの中。prev は value の子にしない）、300 ms の時点で prev が上へ消え、value が下から上がる（250 ms）。入らなければ値が 2 行目に落ちる（prev は包みの中で value を追う）
| この段階の 4 / 14 件目でした           |   p task.progress.done（text.small、secondary。data-progress-index=4、-total=14。r8。D-44）
| 7 件目を終えました。最初の節目です。    |   p task.cheer（text.body。data-milestone=7。文言は task.cheer.at7。節目のときだけ color.success。節目以外は task.cheer.default「11 件目を終えました。」で color.text。cheer 自体は動かない）
|                                        |
| ひとこと解説                           |   h2 task.insight（text.heading）
| …課題集の insight（1〜120 字）…        |   p task.insight.text（text.body）
|                                        |
| この課題は役に立ちましたか             |   task.rate.question
| [ 役に立った ]                         |   同格の副操作 2 つ（縦に積む）
| [ 立たなかった ]                       |
| 今回は答えない                         |   task.rate.close（文字のボタン、44 px の高さ）
```
「次の一手に進む」はこの画面には置かない（S5 で出す。D-34）。演出は 1 秒未満で 1 回だけ（通常 550 ms、節目 950 ms で静止）。3 つのボタンは最初から押せる。`prefers-reduced-motion: reduce` では、印は完成した形、数字は最終の値で、prev は作らない（1 秒後の見た目は同じ）。S5 ではこの演出は起きない。

## S5 task.done（r7：確認ページの型。r8：解説をボタンの後ろに。D-4、D-39、D-44、D-45）
```
| 今日の一手                 履歴  設定 |
|                                        |
| 完了を記録しました                     |   h1 task.done.title（S4 から来たらフォーカスを移す。印はない）
| 完了した課題：…題名…                   |   task.done.task（text.small、secondary）
| これまでに完了した課題  7 件           |   task.total（S4 と同じ値。静止。prev はない）
| この段階の 4 / 14 件目でした           |   task.progress.done（S4 と同じ。r8）
| 7 件目を終えました。最初の節目です。    |   task.cheer（S4 と同じ。節目のときだけ color.success）
|                                        |
| 今週（月曜から）の完了日数：3 日        |   task.week（text.body。data-stat-days-completed-week=3。曜日の並びもドットも出さない）
|                                        |
| 明日も課題が 1 件出ます。続けるなら、次 |   task.next.note（text.body。次に出す組を出し終えているとき（押すと S7）は task.next.note.last「バックエンド設計の初級の課題は、すべて出し終えています。次に進むと、修了の案内が出ます。」（{area} は今の領域、{level} は次に出す組の段階）：D-44 (2)。r9）
| の一手に進めます。                      |
| [ 次の一手に進む ]                     |   task.next（副操作の形：枠。塗りにしない。列いっぱい、44 px 以上。押すと同期で S3（組の最後なら S7）、フォーカスは次の画面の h1）
|                                        |
| ひとこと解説                           |   h2 task.insight（r8 でボタンの後ろに。S4 で読んだ文を読み返せる位置：D-45）
| …課題集の insight…                     |   task.insight.text
| <u>履歴を見る</u>                      |   task.done.history（上下に space.3）
```
再読み込みしても同じ画面（今日の最後の行が done）。何件目でも同じ並び。確認も催促もない。幅 390 ではボタンの上端が約 446 px で初期表示に入る見込み（幅 320 では約 472 px で、表示域の目安 460 px を超えて入らない。仕様 8。r9 で 430 / 455 から直した）。

## S6 task.skipped（r7：次の一手を足した。解説、累計、祝いは出さない）
```
| 今日の一手                 履歴  設定 |
|                                        |
| 申告を記録しました                     |   h1 task.skipped.title（フォーカスを移す）
| 同じ申告が 2 回続くと、次に出す課題から |   task.skipped.levelHint（too_hard / too_easy で、段階がまだ変わらないとき。no_time では出ない）
| 段階が変わります。                      |
|                                        |
| 明日も課題が 1 件出ます。続けるなら、次 |   task.next.note（次に出す組を出し終えているとき（押すと S7）は task.next.note.last「{area}の{level}の課題は、すべて出し終えています。…」。{level} は次に出す組の段階：D-44 (2)。r9）
| の一手に進めます。                      |
| [ 次の一手に進む ]                     |   task.next
| <u>履歴を見る</u>                      |   task.skipped.history
```
段階が変わったとき（同じ申告の 2 回目。AC-8。r8。D-44）：`task.skipped.levelHint` の代わりに `task.skipped.levelChanged`「同じ申告が 2 回続いたので、次に出す課題から段階が初級になります。」（{level} は変わった先の段階名）。他は同じ。変わった先の組をすでに出し終えているとき（初級を修了して中級に進み、「難しすぎ」2 回で初級に戻った。仕様 5.1 の #54）は、この文の次の行に task.next.note.last「バックエンド設計の初級の課題は、すべて出し終えています。次に進むと、修了の案内が出ます。」が並ぶ。note.last は次に出す組について言うので、levelChanged の後でも事実と合う（r9。design-reviewer G1 r4 の要修正 1）。

## S7 task.exhausted（levelDone：初級を出し終えた。r7。D-40）
```
| 今日の一手                 履歴  設定 |
|                                        |
| バックエンド設計の初級を修了しました   |   h1 task.exhausted.levelDone（フォーカスを移す。操作で日付をまたいで着いたときは上に task.dayChanged）
| これまでに完了した課題  14 件          |   task.total
| この段階の 14 件をすべて出し終えました。 |   task.exhausted.levelDone.detail
| 次の段階に進むと、その課題は今日から出  |
| ます。                                  |
| 次の段階は中級です。仕事や学習でコード  |   task.exhausted.next（{nextLevel} と level.intermediate.desc。r8 で文末に句点）
| を書いている（人に聞きながらでもよい）。|
| 中級の課題は、前に出したものを除いて続  |   task.exhausted.seenNext（履歴に同じ領域の中級の行があり、中級に未出の課題が残るときだけ。「難しすぎ」2 回で下がった後に初級を出し終えた場合）。中級もすべて出し終えていれば代わりに task.exhausted.nextDone「中級の課題も、すでにすべて出し終えています。進むと、その次の案内が出ます。」（r8。D-40）
| きます。難しいときは、別の領域を選ぶこ  |
| ともできます。                          |
| [[ 中級に進む ]]                       |   task.exhausted.advance（主操作。塗り。段階を上げて保存し、同じ日に中級の課題を出して S3。中級も出し終えていれば中級の S7 を描く）
| [ 別の領域を選ぶ ]                     |   task.exhausted.redo（副操作。→ S2。「やめる」で S7 に戻る）
```
再読み込み（r8。tech-lead G1 r2 の要修正 1）：今日の行がある日に `task.next` ややり直しで着いた S7 は、再読み込みすると S5 / S6 に戻る（S7 は保存しない）。もう一度「次の一手に進む」を押すと S7。読み込みで着いた S7（今日の行がない日）は再読み込みしても S7。

### S7 task.exhausted（allDone：上級を出し終えた）
```
| 今日の一手                 履歴  設定 |
|                                        |
| バックエンド設計の上級を修了しました   |   h1 task.exhausted.allDone
| これまでに完了した課題  35 件          |   task.total
| 上級の課題 7 件をすべて出し終えました。 |   task.exhausted.allDone.detail
| 上級の新しい課題は次の版で足します。そ  |
| れまでは、別の領域を選べます（診断のや  |
| り直しで、同じ領域の別の段階も選べま    |
| す）。                                  |
| [[ 別の領域を選ぶ ]]                   |   task.exhausted.redo（この変種では主操作。task.exhausted.advance は 0 件）
```

## S8 settings（診断済み、persist() を断られた、iOS の Safari）
```
| 今日の一手                 履歴  設定 |
|                                        |
| 設定                                   |   h1
|                                        |
| データ                                 |   h2
| 入力したデータはこのブラウザの中だけに  |   settings.data.note
| 保存され、外には送りません。…          |
| このブラウザは保存の永続化を許可しませ  |   settings.storage.notPersisted（color.warning。S8 を出すたびに persisted() を読み、false のときだけ：D-31）
| んでした。…ファイルに書き出しておいて  |
| ください。                              |
| [[ ファイルに書き出す ]]               |   主操作
| 書き出しました                         |   settings.export.done（role=status。押した後だけ）
| 書き出したファイル（.json）を選びます。 |   settings.import.note
| …置き換わります。                      |
| [ ファイルを読み込む ]                 |   button settings.import（隠した input type=file settings.import.file の click() を呼ぶ）
| このファイルは読み込めませんでした。…  |   error.import.message（失敗のときだけ。role=alert）
| ファイルの形式がこの版より新しいです。… |   error.import.reason.version
|                                        |
| 診断                                   |   h2
| いまの領域：バックエンド設計、段階：中級 |
| [ 診断をやり直す ]                     |
| まだ申告していない今日の課題はそのまま  |   settings.redo.note（text.small。r7 の文：仕様 7。「新しい診断は次に出す課題から効きます。申告した後にやり直すと、新しい診断の課題が今日のうちに出ます。履歴は残ります。」と続く）
| 残り、新しい診断は次に出す課題から効き  |
| ます。…                                |
|                                        |
| ホーム画面                             |   h2（iOS の Safari、非スタンドアロンだけ）
| [ ホーム画面に追加する手順を見る ]     |   押すと直下に home.addToHomeScreen を開く
|                                        |
| 記録                                   |   h2
| <u>統計を見る</u>                      |
| <u>履歴を見る</u>                      |
|                                        |
| 削除                                   |   h2
| [ すべてのデータを削除 ]               |   取り消せない操作（枠と文字が color.error）
|                                        |
| 版 1.0.0                               |   settings.version（text.small）
| <u>プライバシーについて</u>            |   settings.privacy
```

### S8 settings（保存データなし。S1 か初回の S2 の「設定」から来たとき。契約 data.md 3 の「なし」と「診断の途中」の両方でこの表示。design-reviewer r1 の 1、r2 の 2）
```
| 今日の一手                        設定 |   header（nav は「設定」だけ。aria-current）
|                                        |
| 設定                                   |   h1
|                                        |
| データ                                 |   h2
| 入力したデータはこのブラウザの中だけに  |   settings.data.note
| 保存され、外には送りません。…          |
| 書き出したファイル（.json）を選びます。 |   settings.import.note
| …置き換わります。                      |
| [[ ファイルを読み込む ]]               |   settings.import（この表示では主操作の形。隠した settings.import.file の click()）
| このファイルは読み込めませんでした。…  |   error.import.message（失敗のときだけ）
|                                        |
| ホーム画面                             |   h2（iOS の Safari、非スタンドアロンだけ）
| [ ホーム画面に追加する手順を見る ]     |   settings.homeScreen.open
|                                        |
| 版 1.0.0                               |   settings.version
| <u>プライバシーについて</u>            |   settings.privacy（単独のリンク。44 × 44）
```
書き出し、診断、記録、削除の節は出さない（「診断の途中」でも同じ）。読み込みに成功すると今日の状態（S3 / S5 / S6 / S7）へ移り、確認ダイアログは出ない（AC-20。「診断の途中」でも確認なし：契約 data.md 7）。

## ダイアログ settings.delete.confirm
```
┌──────────────────────────────────┐
│ すべてのデータを削除しますか      │   h2（aria-labelledby）
│ 診断の回答、履歴、答えがこのブラウ │   .body
│ ザから消え、最初の画面に戻ります。 │
│ この操作は元に戻せません。…       │
│ [ 削除する ]                      │   .ok（color.error の枠と文字）
│ [ やめる ]                        │   .cancel（初期フォーカス）
└──────────────────────────────────┘
```
後ろの画面は color.overlay で暗くなる。ダイアログは開くときに DOM に足し、閉じたら外す。
`settings.import.confirm` は h2、`.summary`（履歴 n 件、初めて開いた日）、`.body`、`[ 置き換える ]`、`[ やめる ]`。

## S9 settings.stats
```
| 今日の一手                 履歴  設定 |
|                                        |
| 統計                                   |   h1
| 今日 2026-11-06                        |   settings.stats.today（text.small）
|                                        |
| 初めて開いた日                         |   dt（text.heading）
| 2026-11-01                             |   dd（data-stat-first-open-date）
| 出した課題の件数                       |
| 6                                      |   dd（data-stat-issued。AC-24 の seed の値：r7）
| 完了した件数                           |
| 4                                      |
| 初めて開いた日に完了したか             |
| 完了した                               |   settings.stats.firstDayCompleted.yes
| 直近 7 日に完了した日数                |
| 3                                      |
| 今週（月曜から）の完了日数             |   r7（data-stat-days-completed-week）
| 2                                      |
| 同じ日の 2 件目以降の完了件数          |   r7（data-stat-extra-completed）
| 1                                      |
| 「役に立った」の件数                   |
| 2                                      |
| 「役に立ったか」に答えた件数           |
| 2                                      |
| 「難しすぎ」の件数                     |
| 1                                      |
| 「今日はできない」の件数               |
| 1                                      |
|                                        |
| この値は、このブラウザの記録から計算し  |   settings.stats.note（text.small）
| ています。…                            |
| <u>設定に戻る</u>                      |
```

## S10 history（1 行の例と空）
```
| 2026-10-30                             |   li（data-date、data-task-id、data-report=done、data-helpful=helpful）
| …課題の題名…                           |
| 完了 ・ 役に立った                     |   report.done、helpful.yes（文字。色なし）
| ▸ 答えを見る                           |   details > summary（答えがあるときだけ。印 ▸ の左端を列の左の線にそろえる：tokens 4「開閉」）
| ────────────────────────────────────── |   区切り（1 px、color.border）
```
空：`まだ履歴はありません。課題を申告すると、ここに残ります。` と `[[ 今日の課題へ ]]`。
