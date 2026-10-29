# 画面の図（文字）001-daily-learning

design/001-daily-learning.md の補助。幅 320 CSS px（AC-17 の条件）での並びを文字で描く。
`[ ]` は副操作のボタン（枠）、`[[ ]]` は主操作のボタン（塗り）、`<u>…</u>` はリンク（下線）。縦の線 `|` は本文の列の左右の線（space.4 の余白の内側）。色は付けない。

## S1 diagnosis.start（iOS の Safari、非スタンドアロン、閉じた印なし）
```
| 今日の一手                        設定 |   ← header（static。診断前は nav に「設定」だけ）
|                                        |
| 3 問に答えると、今日の学習が 1 つ出ます |   h1 text.title
|                                        |
| すでにコードを書いているエンジニア向けで |   lead.1〜.3（text.body）
| す。1 日 1 つ、15 分で終わる課題を出しま |
| す。                                   |
| 登録はありません。入力したデータは…    |
| 難しすぎ・簡単すぎの申告が 2 回続くと…  |
|                                        |
| ホーム画面に追加してから始めることをお  |   section home.addToHomeScreen（h2、color.warning）
| すすめします                           |
| Safari は 7 日間使わないと…           |   .why
| 1. 画面の下（iPad では上）の共有ボタン…|   .steps（ol）
| 2. 「ホーム画面に追加」を選び…         |
| 3. ホーム画面の「今日の一手」を開いて… |
| 4. すでに Safari で診断した場合：…     |
| [ 閉じる ]                             |   .close（44 px）
|                                        |
| [[ 診断を始める ]]                     |   主操作（列いっぱい、44 px 以上）
```
スタンドアロン表示のとき：説明の直後に `home.standalone.import` の文と `[ ファイルを読み込む ]` が入り、ホーム画面の案内は出ない。

## S2 diagnosis.question（2 問目）
```
| 今日の一手                        設定 |
|                                        |
| 質問 2 / 3                             |   diagnosis.progress（text.small、data-question-index=2）
|                                        |
| バックエンド設計の今の段階に近いものを  |   legend（text.heading）
| 選んでください                          |
| ( ) 初級                               |   radio + label（高さ 44 px 以上、間 space.2）
|     基本は知っているが、実務では人に…   |   level.beginner.desc（text.small、同じ label の中）
| (•) 中級                               |
|     実務の大半を 1 人で進められる       |
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

## S3 task.today（external の例）
```
| 今日の一手                 履歴  設定 |   header（nav は flex-wrap で 2 行目に落ちてよい）
|                                        |
| 今日の課題 2026-10-30                  |   task.today.label（text.small、secondary）
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
| 申告すると、今日はもう課題が出ません。  |   task.report.note（text.small）
| [[ 完了 ]]                             |   主操作（列いっぱい）
| [ 難しすぎ ]  [ 簡単すぎ ]             |   副操作 3 つ（flex-wrap。320 px では 1 列に 1 つずつ）
| [ 今日はできない ]                     |
```
初期表示（幅 320、文字 100%）に、ヘッダー、ラベル、題名、meta、「なぜ今これか」の 2 行目までが入る（差をつける点 1）。

## S4 task.rate
```
| 今日の一手                 履歴  設定 |
|                                        |
| 完了しました                           |   h1（フォーカスを移す）
| この課題は役に立ちましたか             |
| [ 役に立った ]                         |   同格の副操作 2 つ（縦に積む）
| [ 立たなかった ]                       |
| 今回は答えない                         |   task.rate.close（文字のボタン、44 px の高さ）
```

## S5 task.done
```
| 今日の一手                 履歴  設定 |
|                                        |
| 今日の一手は終わりです                 |   h1
| 今日も前に進みました。次の課題は明日出  |   task.done.message
| ます。                                  |
| 完了した課題：…題名…                   |   task.done.task（text.small、secondary）
| <u>履歴を見る</u>                      |   task.done.history（上下に space.3）
```
S6 task.skipped は h1 と文が変わり、too_hard / too_easy のときだけ `task.skipped.levelHint` が 1 行増える。S7 task.exhausted は h1 `task.exhausted.message`、`task.exhausted.detail`、`[[ 診断をやり直す ]]`。

## S8 settings（診断済み、persist() を断られた、iOS の Safari）
```
| 今日の一手                 履歴  設定 |
|                                        |
| 設定                                   |   h1
|                                        |
| データ                                 |   h2
| 入力したデータはこのブラウザの中だけに  |   settings.data.note
| 保存され、外には送りません。…          |
| このブラウザは保存の永続化を許可しませ  |   settings.storage.notPersisted（color.warning。断られたときだけ）
| んでした。…ファイルに書き出しておいて  |
| ください。                              |
| [[ ファイルに書き出す ]]               |   主操作
| 書き出しました                         |   settings.export.done（role=status。押した後だけ）
| 書き出したファイル（.json）を選びます。 |   settings.import.note
| …置き換わります。                      |
| [ ファイルを読み込む ]                 |   label > input type=file
| このファイルは読み込めませんでした。…  |   error.import.message（失敗のときだけ。role=alert）
| ファイルの形式がこの版より新しいです。… |   error.import.reason.version
|                                        |
| 診断                                   |   h2
| いまの領域：バックエンド設計、段階：中級 |
| [ 診断をやり直す ]                     |
| 今日の課題を出した後にやり直した場合、… |   settings.redo.note（text.small）
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
| 5                                      |   dd（data-stat-issued）
| 完了した件数                           |
| 3                                      |
| 初めて開いた日に完了したか             |
| 完了した                               |   settings.stats.firstDayCompleted.yes
| 直近 7 日に完了した日数                |
| 3                                      |
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
| ▸ 答えを見る                           |   details > summary（答えがあるときだけ）
| ────────────────────────────────────── |   区切り（1 px、color.border）
```
空：`まだ履歴はありません。課題を申告すると、ここに残ります。` と `[[ 今日の課題へ ]]`。
