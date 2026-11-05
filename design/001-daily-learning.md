# デザイン仕様 001-daily-learning：診断と今日の学習（今日の一手）

- 対象の PRD：docs/prd/001-daily-learning.md（r10、G0 承認済み（2026-11-05、委任による再承認。コミット f6a19a1）。AC-1〜AC-40）
- 調査：design/001-daily-learning-research.md（この仕様より先に書いた。r1 はコミット 854cf47、r2 はコミット 3d9c9e6）。方向性は案A「一枚の紙」に、r2 の案A'「手応えを足す」（調査 7.1）
- 書いた役：designer　日付：2026-11-05（r7。r7 は Takuma の FB 1 回目（FB-1 初級＝未経験、FB-2 同じ日に続けて進む、FB-3 面白さ）を反映した PRD r10（AC-33〜AC-40、AC-10 と AC-24 の書き直し）と調査 r2（6.1、7.1、8.1 の問い 10〜15）、指揮役の決定（docs/approvals/delegation.md 2026-11-05：Q12〜Q19、累計の大きさ、週の始まり）に合わせた。D-4 を書き直し、D-34〜D-42 を足した。文言は 28 キーを足し 4 キーを消して 170 キー。直した箇所の一覧は 11。r6 は G3 r1 の design-reviewer の指摘 3（日付が変わった後の知らせ：D-30、`task.dayChanged` を足して 146 キー）、提案 8（永続化の注意は今の状態で決める：D-31）、9（上限の色：D-32）、10（起きないエラーを「なし」に）、11（案内の枠：D-33）と、指摘 4〜6（実装の差。tokens.md の文を明確にした）を反映。直した箇所の一覧は 11。r2 は G1 r1 の design-reviewer と tech-lead の指摘を反映。r3 は G1 r2 の design-reviewer の提案 1〜4 と、契約（contracts/data.md、identifiers.md）で確定した事項との整合。r4 は Takuma の決定 D1〜D5（docs/approvals/001-daily-learning-G0.md 末尾、2026-10-30）で U-1〜U-4 と U-13 を確定にした。r5 は PRD r7（AC-14 の Given と 2 通り目。Q11 は A）と契約の確定（contracts/budgets.md 6 の `<head>` 5 行、contracts/data.md 2 のやり直しを終えた後の行き先）に合わせた 2 点の小さな直し。直した箇所の一覧は 11）
- 図：design/001-daily-learning/screens.md（文字で描いた画面の図）
- トークン：design/tokens.md（色、文字、余白。この仕様はトークンの名前だけを使う）
- 原則の番号 B-1〜B-6 は .claude/skills/craft-designer/SKILL.md にある。
- 読み替え：ブラウザだけで動く Web アプリなので、型の「標準部品（SwiftUI）」は「ネイティブの HTML 要素と WAI-ARIA の型」、「HIG の URL」は「WCAG 2.2 / WAI-ARIA APG / MDN の URL」、「accessibilityIdentifier」は「`data-testid`」、「VoiceOver のラベル」は「アクセシブルな名前（VoiceOver、TalkBack、NVDA が読む名前）」、「AX5」は「ブラウザの拡大 200%（幅 320 CSS px）と OS の文字サイズ最大」に読み替える。指揮役の裁定（2026-10-30）による。
- 文言キーの決まり：`<画面か領域>.<要素>[.<変種>]`。小文字の camelCase をドットでつなぐ。PRD が指定したキー（`home.standalone.import`、`task.external.badge`、`settings.stats.firstDayCompleted.yes` など）はそのまま使う。見える文字を持つ要素の `data-testid` はその文言キーと同じ。文字を持たない要素（入力欄、画面の入れ物、行、ダイアログ）の `data-testid` は 6 に書く。`.1`、`.2` で終わる子キーを持つキーはリストで、親キーはリストの入れ物（`<ol>`）に付ける。
- 状態名（ルート要素の `data-state`）：PRD の 10 個 `diagnosis.start`、`diagnosis.question`、`task.today`、`task.rate`、`task.done`、`task.skipped`、`task.exhausted`、`settings`、`settings.stats`、`history` に、殻の 2 個 `loading`、`error` を足した 12 個。ダイアログ（`settings.import.confirm`、`settings.delete.confirm`）と案内（`home.addToHomeScreen`、`home.standalone.import`）は状態を変えず、`data-testid` で見つける。`task.exhausted` の 2 変種（levelDone / allDone。AC-10）も状態の値は 1 つで、h1 の `data-testid`（`task.exhausted.levelDone` / `task.exhausted.allDone`）で見分ける。同じ日の 2 件目以降の課題（AC-33）も `task.today` のままで、`task.today` の要素の `data-task-nth-today` で見分ける。

## 1. 画面の流れ
画面の番号：S1 `diagnosis.start`、S2 `diagnosis.question`、S3 `task.today`、S4 `task.rate`、S5 `task.done`、S6 `task.skipped`、S7 `task.exhausted`、S8 `settings`、S9 `settings.stats`、S10 `history`。殻：S0 `loading` / `error`。

```
[URL を開く] → S0 loading（JS が動くまで）
   判定順（契約 data.md の 4。上から順に調べ、最初に当てはまった行き先へ）：枠の中に入れられている → loading のまま（ADR 0005）／ 保存先が使えない → S0 error (2) ／ 読めない → S0 error (1) ／ 診断の途中 → S2 ／ なし → S1 ／ あり → 今日の状態（S3 / S5 / S6 / S7）。「あり」「途中」「なし」の定義は契約 data.md の 3（design-reviewer r2 の 2）
   ├ 保存データなし → S1 diagnosis.start
   │     ├ スタンドアロン表示（navigator.standalone === true か display-mode: standalone）
   │     │     → S1 に案内 home.standalone.import（読み込みの操作つき。保存データがない間は毎回）
   │     ├ iOS の Safari でスタンドアロンでない、かつ閉じた印がない
   │     │     → S1 に案内 home.addToHomeScreen（閉じると印を保存して二度と出ない）
   │     └ 「診断を始める」→ S2 ×3（1 / 3 → 2 / 3 → 3 / 3）→ 「診断を終える」
   │            → S3 task.today（1 件目）。初めて S3 を出した直後に navigator.storage.persist() を 1 回だけ呼ぶ（画面には何も出ない。後の日に求め直さない：U-14 で決定、契約 data.md 11）。S8 の注意は、S8 を出すたびに navigator.storage.persisted() で今の状態を読んで決める（D-31）
   ├ 診断の途中（初回の診断で、回答が 1〜2 問だけ保存されている。契約 data.md 3：「あり」ではなく `diagnosis.area` がある）→ S2 のまだ答えていない最初の質問。保存した回答は radio に戻す（tech-lead r1 M2）。nav は初回の S2 と同じ（「設定」だけ）
   ├ 保存データあり、今日まだ課題を出していない
   │     ├ 出せる課題がある → S3 task.today
   │     └ ない → S7 task.exhausted（levelDone か allDone）→「次の段階に進む」→ S3、または「別の領域を選ぶ」→ S2（1 / 3 から。「やめる」で S7 に戻る：design-reviewer r1 の 8）→ 終える → S3 か S7
   ├ 保存データあり、今日の最後の課題を完了済み（同じ日に何件あっても、最後の行で決める。契約 data.md 4） → S5 task.done
   ├ 保存データあり、今日の最後の課題を申告済み（難しすぎ、簡単すぎ、今日はできない） → S6 task.skipped
   ├ 保存データあり、今日の課題がまだ申告されていない（同じ日の 2 件目以降でも同じ） → S3 task.today
   ├ 保存データが読めない（形式に合わない） → S0 error
   └ 保存先が使えない（localStorage の読み書きが例外を出す） → S0 error（`error.app.storageUnavailable.*`。tech-lead r1 P1）

S3 task.today（この段階の n / N 件目と、その日の何件目かを持つ：AC-36、AC-33）
   ├ 「完了」→ S4 task.rate（累計、祝い、ひとこと解説、役に立ったかの問い：AC-35、AC-38）→「役に立った」「立たなかった」「今回は答えない」、または再読み込み → S5 task.done（累計、祝い、解説、今週の完了日数、「次の一手に進む」：AC-35、AC-37、AC-38、AC-33）
   ├ 「難しすぎ」「簡単すぎ」「今日はできない」→ S6 task.skipped（解説も累計も祝いも出さない。「次の一手に進む」だけ：AC-33、AC-38）
   └ 答えの欄：最後の入力から 1 秒以内に保存（間隔は contracts/ で決める。案 300 ms）。pagehide と visibilitychange（hidden）でも保存する。同じ日に開き直すと復元（tech-lead r1 M1）
S5 task.done / S6 task.skipped
   ├ 「次の一手に進む」`task.next` → 同じ日に次の課題を出す（今の段階と診断に従う。申告で段階が動いていれば新しい段階。AC-8 の 10 通り目）→ S3（`data-task-nth-today` が 1 増える。1 秒以内、同期で描き、フォーカスを h1 へ）。出せる課題がなければ S7。上限も確認のダイアログもない（AC-33。PRD の Q15 は A）
   ├ 押さなければ再読み込みしても S5 / S6 のまま（AC-5、AC-7）
   └ 「履歴を見る」→ S10
S7 task.exhausted（目標の領域の今の段階の課題をすべて出し終えた。AC-10。2 変種）
   ├ levelDone（段階が初級か中級）：h1 `task.exhausted.levelDone` → 主操作「{次の段階}に進む」`task.exhausted.advance` → その領域の段階を 1 つ上げ、同じ日に次の課題を出す → S3（出せなければ再び S7：次の段階も尽きているとき）。副操作「別の領域を選ぶ」`task.exhausted.redo` → S2（1 / 3 から。「やめる」で S7 に戻る）
   └ allDone（段階が上級）：h1 `task.exhausted.allDone` → 主操作「別の領域を選ぶ」`task.exhausted.redo` だけ（`task.exhausted.advance` は 0 件）
       どちらも、S2 で診断を終えると、新しい診断に合う課題を同じ日に出して S3（同じ領域と段階を選び直せば再び S7。PRD 11「診断のやり直し」）

ヘッダーの nav：診断前（S1、初回の S2、保存データなしの S8）は「設定」→ S8 だけ。診断後のすべての画面（やり直しの S2 を含む。S7 か S8 から入った S2 は診断を終えた後なので、nav は「履歴」と「設定」）は「履歴」→ S10 と「設定」→ S8（design-reviewer r1 の 1、r2 の 3）。アプリ名 `app.name` → 上の判定順をやり直す：あり → 今日の状態（S3 / S5 / S6 / S7）、なし → S1、診断の途中 → S2（再読み込みと同じ行き先。design-reviewer r2 の 2、契約 data.md 4）
S8 settings
   ├ 「ファイルに書き出す」→ JSON をダウンロード（画面は変わらない。「書き出しました」の知らせ）
   ├ 「ファイルを読み込む」→ ファイルを選ぶ → 検査
   │     ├ 版が新しい、形式が違う → S8 に error.import.message（確認は出ない）
   │     ├ 保存データあり → ダイアログ settings.import.confirm →「置き換える」→ 置き換え → 今日の状態（S3 / S5 / S6 / S7）
   │     └ 保存データなし、または診断の途中（S1 の案内から、または S1 か初回の S2 の「設定」で来た S8 から読み込んだとき）→ 確認なしで置き換え（契約 data.md 7）→ 今日の状態
   ├ 「診断をやり直す」→ S2（1 / 3 から。「やめる」で S8 に戻る）→ 終える → まだ申告していない今日の課題（S3）があれば S3 のまま（同じ課題。新しい診断は「次の一手に進む」で出す課題から効く）。S5 / S6 / S7 からやり直したときは、新しい診断に合う課題を同じ日に出して S3（出せなければ S7）。出した件数は本人の操作でだけ増える（PRD 11「診断のやり直し」。r8 で「翌日から効く」をやめた）
   ├ 「統計を見る」→ S9 →「設定に戻る」→ S8
   ├ 「履歴を見る」→ S10
   ├ 「ホーム画面に追加する手順を見る」（iOS の Safari でスタンドアロンでないときだけ）→ S8 の中に home.addToHomeScreen を開く
   └ 「すべてのデータを削除」→ ダイアログ settings.delete.confirm →「削除する」→ S1（保存データなし）
翌日（端末の日付が変わった後の最初の読み込みか操作）→ S3（出せる課題がなければ S7）
   ├ 読み込みで着いたとき → 通常の S3 / S7（知らせは出さない。AC-6）
   └ 画面を開いたまま日付が変わった後の最初の操作（ボタン、リンク、radio の確定。`task.next` と `task.exhausted.advance` も含む。契約 data.md 4）で着いたとき → その操作は実行されず、前の課題は申告なし（`report` が none）で履歴に移り、S3 / S7 の先頭に知らせ `task.dayChanged`（フォーカスをここへ）。次の操作か再読み込みで消える（D-30）。S5 / S6 で日付が変わった後に `task.next` を押したときは、移る課題がない（今日の最後の課題は申告済み）ので知らせは出さず、翌日の 1 件目を出す（`data-task-nth-today` は 1）
```

## 2. 受け入れ条件と画面の対応
verifier はこの表から受け入れテストを書く。識別子の詳しい一覧は 6。

| AC | 画面（状態） | 操作と、テストが読む識別子 |
|---|---|---|
| AC-1 | S1 → S2 | S1 の `diagnosis.start.begin` を押す → S2 の `diagnosis.progress`（`data-question-index`、`data-question-total`=3）を読み、radio を選んで `diagnosis.next`（3 問目は `diagnosis.finish`）を押す。切り替えは同期（500 ms 以内） |
| AC-2 | S2 → S3 | `diagnosis.finish` を押す → `data-state="task.today"`、`[data-testid="task.today"]` の `data-task-area`、`data-task-level` |
| AC-3 | S3（と課題集の JSON） | 4 要素は `task.today.title`（h1）と、`<h2>` `task.why` / `task.how` / `task.goal` それぞれの直後の段落 `task.why.text` / `task.how.text` / `task.goal.text`、所要時間は `task.meta`（design-reviewer r1 の 3）。全件の検査は JSON に対して行う（画面の対応はスクリーンショットのみ） |
| AC-4 | 対応なし | 課題集の JSON の件数の検査。画面には出ない（S7 が尽きたときの表示） |
| AC-5 | S3 → S4 → S5 | `task.report.done` → `data-state="task.rate"` → `task.rate.helpful` か再読み込み → `data-state="task.done"`。再読み込みしても `task.done` のままで、`task.next` を押さない限り `data-stat-issued`（S9）は変わらない |
| AC-6 | S3 | 翌日の読み込みで `data-state="task.today"`、`data-task-id` が履歴のどの行とも違う |
| AC-7 | S3 → S6、S10 | `task.report.tooHard` / `task.report.tooEasy` / `task.report.noTime` → `data-state="task.skipped"`。S10 の `[data-testid="history.row"]` の `data-report`、`data-task-id`。再読み込みしても `task.skipped` のままで、`task.next` を押さない限り新しい課題は出ない |
| AC-8 | S3（1〜9 通り目は翌日の S3、10 通り目は同じ日の S3） | 翌日の S3 の `data-task-level`。10 通り目：S3 の `task.report.tooHard` → S6 の `task.next` → S3（`data-task-nth-today`=2）の `task.report.tooHard` → S6 の `task.next` → S3（`data-task-nth-today`=3）の `data-task-level` が beginner |
| AC-9 | S4 → S5、S10 | `task.rate.helpful` / `task.rate.notHelpful` / `task.rate.close` / 再読み込み → `task.done`。S10 の行の `data-helpful` |
| AC-10 | S7（2 変種）→ S3 / S2 | 翌日の読み込み、または S5 / S6 の `task.next` で `data-state="task.exhausted"`。段階が beginner：h1 `task.exhausted.levelDone` が 1 件、`task.exhausted.advance` が 1 件、`task.exhausted.redo` が 1 件。`task.exhausted.advance` → 同じ日に `data-state="task.today"`、`[data-testid="task.today"]` の `data-task-level` が intermediate、`data-task-area` は同じ。段階が advanced：h1 `task.exhausted.allDone` が 1 件、`task.exhausted.redo` が 1 件、`task.exhausted.advance` が 0 件。`task.exhausted.redo` → S2 → 同じ領域と段階 → `diagnosis.finish` → 同じ日に再び `task.exhausted` |
| AC-11 | S2（エラー） | 2 問目で `diagnosis.next` → 保存の失敗 → `error.storage.message`、`error.storage.retry`。`data-question-index`=2 のまま、radio の `checked` が保たれる → `error.storage.retry` → 3 問目 |
| AC-12 | S1〜S6 | オフラインで AC-1、AC-2、AC-5、AC-7、AC-9 と同じ操作。送信 0 件（画面は通常と同じ。5 のオフライン列） |
| AC-13 | S3 → S5、S8 | persist() の拒否を注入 → 完了 → 再読み込み → `task.done`。S8 に `settings.storage.notPersisted` と `settings.export`。S8 は描くたびに `navigator.storage.persisted()` を読むので、テストの注入は `persist()` と `persisted()` の両方を false にする（D-31。つなぎ口は契約 test-hooks.md：tech-lead） |
| AC-14 | 1 通り目：S7 → S8 → S2 → S3、S10。2 通り目：S3（今日の課題あり）→ S8 → S2 → S3（同じ課題）→ S4 → S5 → `task.next` → S3 | 1 通り目（Given は `task.exhausted`）：S7 の `nav.settings` → S8 の `settings.redo` → S2 → 別の領域 → `diagnosis.finish` → 同じ日に S3 の `data-task-area` が新しい領域。S10 の完了の行が 3 件のまま。2 通り目（PRD r8 で書き直し）：S3（`task.today`。`data-task-id` を控える）の `nav.settings` → S8 の `settings.redo` → S2 → 別の領域 → `diagnosis.finish` → S3 のまま（状態 `task.today`、`data-task-id` がやり直しの前と同じ）。S10 の完了の行が 3 件のまま。その課題を `task.report.done` → S4 → S5 の `task.next` → 同じ日に S3 の `data-task-area` が新しい領域。行き先は 1 の S8 の「診断をやり直す」の行と契約 data.md 2（やり直しの診断の保存と終えた後の行き先。r8 に合わせて tech-lead が直す）のとおり |
| AC-15 | S0 → S3 | ルートの `data-debug-load-ms`（S3 を表示した時点で書く） |
| AC-16 | S8 → ダイアログ → S1 | `settings.delete` → `[data-testid="settings.delete.confirm"]` の `settings.delete.confirm.ok` → 再読み込み → `diagnosis.start` |
| AC-17 | S1、S3、S5、S7 | 幅 320 で scrollWidth、ellipsis 0 件（トークンの `overflow-wrap: anywhere`、ellipsis 不使用）。S5 は累計の行（`task.total`）と今週の行を含み、S7 は levelDone の変種（要素が多い方）で撮る。S2 の 1 問目（ヒント文つき）は AC-39 で別に数える |
| AC-18 | S1 → S2 → S3 → S4 → S5 | Tab / Shift+Tab / Enter / Space だけで `diagnosis.start.begin` → radio → `diagnosis.next` → `diagnosis.finish` → `task.report.done` → `task.rate.helpful`。`:focus-visible` の outline が 3 px（tokens の size.focus.width） |
| AC-19 | S8 | `settings.export` → ダウンロード（JSON）。`settings.export.done` の知らせ |
| AC-20 | S1 → S8（保存データなし）、または S1 の案内 | 保存データのないブラウザで S1 のヘッダーの `nav.settings` → S8（保存データなしの表示。読み込みが主操作）→ 隠した `<input type="file">`（`settings.import.file`。見えるボタンは `settings.import`）に setInputFiles → 検査 → 保存データなしなので確認なし → 今日の状態。S1 のスタンドアロンの案内から読むときは `home.standalone.importFile` に setInputFiles（design-reviewer r1 の 1、4） |
| AC-21 | S1、S8 | S1 の `[data-testid="home.addToHomeScreen"]` の中に `home.addToHomeScreen.steps`。`home.addToHomeScreen.close` → 再読み込みで出ない。S1 の `nav.settings` → S8（保存データなし）の `settings.homeScreen.open` で再び開く（診断の前でも行ける：design-reviewer r1 の 1）。偽装なしでは 0 回 |
| AC-22 | S1 | `home.standalone.import`（文）、`home.standalone.importButton`（読み込みの見えるボタン。テストは `home.standalone.importFile` に setInputFiles）、`diagnosis.start.begin`。`home.addToHomeScreen` は出ない。再読み込みで再び出る |
| AC-23 | S0 → S3 / S5 | オフラインで再読み込み → 3 秒以内に同じ `data-state`（と `data-task-id`）。画面は通常と同じ |
| AC-24 | S9 | `settings.stats.open` → `data-state="settings.stats"`。`data-stat-first-open-date`、`data-stat-issued`、`data-stat-completed`、`data-stat-first-day-completed`、`data-stat-days-completed-7d`、`data-stat-days-completed-week`、`data-stat-extra-completed`、`data-stat-helpful`、`data-stat-rated`、`data-stat-too-hard`、`data-stat-no-time` を持つ `<dd>`（11 個）と、同じ値の見える文字。真偽値は `settings.stats.firstDayCompleted.yes` / `.no`。seed の 11-06 の行があるので、開いたときの状態は S6 |
| AC-25 | S8（エラー） | 版が新しいファイルを選ぶ → `error.import.message` と `error.import.reason.version`。確認は出ない。履歴と状態は変わらない |
| AC-26 | S1（全画面） | locale en-US で S1 の文言が en と一致。キーの差 0 件（7 の表が日英の原本） |
| AC-27 | S1、S2、S3、S5、S7（levelDone と allDone の 2 変種）、S8（表示は 7 つ） | axe-core で serious 以上 0 件（4.5:1 以上のトークン、ボタンとリンクの名前、radio の `<fieldset>`/`<legend>`、`<label>`、ヒント文はラベルの中） |
| AC-28 | S0（ルート）、S8 | ルートの `data-build-version`。S8 の `settings.version` に同じ値が見える。切り替えは Service Worker の仕事で画面には知らせを出さない（PRD 10） |
| AC-29 | 対応なし | 課題集の JSON の `mode`、`tools`、URL の検査。画面には出ない（S3 の印は AC-30） |
| AC-30 | S3 | `[data-testid="task.today"]` の `data-task-mode`、`task.external.badge`、`task.external.tools` の `<li>`。`in_app` では `task.external.badge` が 0 件 |
| AC-31 | S3、S5 | 操作 0 回で `data-state`。S3 に `task.today.title`、4 要素、`task.answer`、4 つの `task.report.*`。重なる要素（ダイアログ、`position: fixed`）が 0 件（ヘッダーは `position: static`。ダイアログは閉じたら DOM から外す。数え方は contracts/：tech-lead r1 P3） |
| AC-32 | S3、S8 | `task.answer` に入力 → 最後の入力から 1 秒以内に保存して `task.answer.saved` → 再読み込み → 同じ `data-task-id` と同じ内容。翌日は空。S8 の書き出しの `answer` |
| AC-33 | S5 / S6 → S3（2 件目、3 件目） | S5 の `task.next`（または S6 の `task.next`）→ 1 秒以内に `data-state="task.today"`、`[data-testid="task.today"]` の `data-task-id` が履歴のどの行とも違い、`data-task-area` と `data-task-level` が直前と同じ、`data-task-nth-today`=2、S9 の `data-stat-issued` が 1 増える。再読み込みしても同じ `data-task-id` の `task.today`。もう 1 回繰り返して `data-task-nth-today`=3。3 件目までに `role="dialog"` が 0 件、`task.next` 以外に押す操作がない（上限の知らせも 0 件）。1 秒の計り方は契約 test-hooks.md「時間の計り方」（始点は `task.next` の操作、終点は `data-state` が `task.today` になる時点：tech-lead） |
| AC-34 | 対応なし | 課題集の JSON の検査（初級の全件）。画面には出ない |
| AC-35 | S3 → S4 → S5 | seed（完了 6 件）で `task.report.done` → S4 の `task.total.value`（`data-stat-completed`=7。見える文字は「7 件」/「7 tasks」）と `task.cheer`（`data-milestone`=7、文言は `task.cheer.at7`）→ `task.rate.close` → S5 に同じ `task.total.value` と `task.cheer`。累計 30、100 では `data-milestone`=30 / 100（`task.cheer.at30` / `.at100`）、11 では `data-milestone`=none（`task.cheer.default`）で、祝いの文言が節目と違う。語の検査は ja.json と en.json の全キーの値（7 の表が原本。2026-11-05 の時点で 5 語とも 0 件） |
| AC-36 | S3 | 翌日の S3 の `[data-testid="task.today"]` の `data-progress-index`=4、`data-progress-total`=14 と、`task.progress` の見える文字（「この段階の 4 / 14 件目」/「Task 4 of 14 at this level」）に同じ 2 つの数 |
| AC-37 | S6 → S3 → S4 → S5、S9 | AC-24 の seed（2026-11-06 金曜に固定。開くと S6）の `task.next` → S3 の `task.report.done` → S4 → S5 の `task.week`（`data-stat-days-completed-week`=3。見える文字に 3）。S9 の `data-stat-days-completed-week`=3、`data-stat-extra-completed`=1。2026-11-09 月曜に固定して開くと S9 の `data-stat-days-completed-week`=0。先週の日数を出す要素は S5 にも S9 にも置かない（6 に識別子を定義しない） |
| AC-38 | S3、S4、S5、S6 | S3 では `task.insight.text` が 0 件（DOM に置かない）。`task.report.done` → S4 の `task.insight.text` に課題集の `insight` の文字列、S5 でも同じ。`task.report.tooHard` → S6 では `task.insight.text` が 0 件。JSON の全件検査は AC-3 と同じテストの中 |
| AC-39 | S2（1 問目） | radio のラベルの中の `area.backend.desc` … `area.git.desc`（6 件。ja と en で 1〜40 文字）。幅 320 で `diagnosis.question` の 1 問目の `document.documentElement.scrollWidth` が 320 以下 |
| AC-40 | S2（3 問目）→ S3、S8 | 3 問目の radio が 5 つで、`years.never` の `value` が未経験の ID（tech-lead が identifiers.md 5 に決める。案は `never`：tech-lead G0 r4 の提案 4）。選んで `diagnosis.finish` → S8 の `settings.export` の JSON の `diagnosis.years` にその ID |

対応なし：AC-4、AC-29、AC-34（課題集の JSON だけを検査する AC で、画面の要素がない）。AC-3 と AC-38 は画面の要素の場所だけ対応する（JSON の検査は verifier）。

AC にない状態（PRD 11 の冒頭の規則「日付をまたいだ申告はできない」の画面側。D-30）：画面を開いたまま日付が変わった後の最初の操作で着いた S3 / S7 の `task.dayChanged`（`role="status"`、フォーカスがここに移る）。受け入れテストの AC 表にはないが、G3 の「全画面と全状態」の対象なので、verifier は探索 R3 の 2 の手順（S3 を出す → 日付を進める → 再読み込みせずに `task.report.done`）で `task.dayChanged` が 1 件、`document.activeElement` がそれ、`history.row` の末尾が `data-report="none"`、`task.answer` が空、であることを確かめ、スクリーンショットを残す。読み込みで着いた翌日の S3 には `task.dayChanged` が 0 件。

## 3. 画面の仕事と主操作、標準部品
主操作は 1 画面に 1 つ（B-2）。標準部品はネイティブの HTML 要素と WAI-ARIA APG の型。ランドマーク（`<header>`、`<nav>`、`<main>`）は全画面で共通（https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/ 、2026-10-30 確認）。ヘッダーは `position: static`（固定しない。R-18、AC-31）で、アプリ名のリンク `app.name` と nav のリンク。nav は診断前（S1、初回の S2、保存データなしの S8。「保存データなし」は契約 data.md 3 の「なし」と「診断の途中」の両方）は `nav.settings` だけ、診断後（S3〜S7、診断済みの S8〜S10、S7 か S8 から入ったやり直しの S2）は `nav.history` と `nav.settings`（今いる画面には `aria-current="page"`。design-reviewer r2 の 3）。診断前から設定へ行けるのは、保存データのないブラウザでの読み込み（AC-20）と案内の再表示（AC-21）に要るため（design-reviewer r1 の 1）。

| 画面 | 仕事（1文） | 主操作 | 使う標準部品 | 標準から外れる所（本来の部品、理由、対応） |
|---|---|---|---|---|
| S0 殻（loading / error） | JS が動くまでの地を出し、保存データが読めないときに次の一手を出す | `error.app.reload`（再読み込み） | `<main>`、`<h1>`、`<p>`、`<noscript>`、`<button>` | なし |
| S1 diagnosis.start | 何が起きるかを 10 行以内で伝え、診断を始めさせる | `diagnosis.start.begin` | `<main>`、`<h1>`、`<p>`、`<button>`、案内は `<section aria-labelledby>`、手順は `<ol>`、スタンドアロンの読み込みは `<button>` + 隠した `<input type="file">` | ファイルの読み込み：本来は `<input type="file">` そのもの。理由：そのままでは「ファイルを読み込む」の文字を文言キーで出せず、他のボタンと形を揃えられない。対応：見える `<button>` が隠した input の `click()` を呼び、フォーカスと名前はボタンが持つ（9「ファイルの読み込みの部品」。design-reviewer r1 の 4）。案内は重ねず本文の一部として置く（ダイアログにしない。R-18、AC-31 の「重なる要素 0」と同じ考え） |
| S2 diagnosis.question | 1 問だけ見せて答えさせ、確定ごとに保存する | `diagnosis.next`（3 問目は `diagnosis.finish`） | `<form>`、`<fieldset>`、`<legend>`、`<input type="radio">`、`<label>`（1 問目と 2 問目は、選択肢の名前とヒント文 `area.*.desc` / `level.*.desc` を同じ `<label>` の中に置く：D-41）、`<button>`、進み具合は `<p>`、エラーは `<p role="alert">` | なし。選んだ時点では進まず、ボタンで確定する（WCAG 2.2 SC 3.2.2 On Input：選択で文脈を変えない） |
| S3 task.today | 今日の課題 1 件を、開いた瞬間に読める形で出し、この段階の何件目かを添え、答えを書かせ、申告させる | `task.report.done` | `<article>`、`<h1>`、`<p>`（日付、進み具合 `task.progress`、meta）、`<span>`（印）、`<dl>`（道具）、`<h2>`+`<p>`（4 要素）、`<label>`+`<textarea>`、`<p role="status">` ×3（保存の知らせ、上限、日付が変わった知らせ。最後は `tabindex="-1"` でフォーカスを受ける：D-30）、`<button>` ×4 | なし。進み具合は文字だけで `<progress>` を使わない（D-37） |
| S4 task.rate | 完了の直後に、累計とひとこと解説を返してから、役に立ったかを 1 回だけ聞く | 答える（`task.rate.helpful` と `task.rate.notHelpful` を同格の副操作として並べ、どちらも勧めない） | `<main>`、`<h1>`、`<p>`（累計、祝い）、`<h2>`+`<p>`（ひとこと解説）、`<p>`（問い）、`<button>` ×3 | なし |
| S5 task.done | 終えた事実（累計、祝い、解説、今週の完了日数）を 1 画面で返し、続けるか止めるかを本人に委ねる | `task.next`（「次の一手に進む」。形は副操作（枠）で、塗りにしない：D-4） | `<main>`、`<h1>`、`<p>`、`<h2>`+`<p>`（ひとこと解説）、`<button>`、`<a>` | なし |
| S6 task.skipped | 申告を記録した事実と段階の規則を伝え、続けるか止めるかを本人に委ねる | `task.next`（形は副操作：D-4） | `<main>`、`<h1>`、`<p>`、`<button>`、`<a>` | なし |
| S7 task.exhausted（levelDone / allDone） | 段階（または領域）を修了したことを伝え、次の段階へ進むか別の領域を選ばせる | levelDone：`task.exhausted.advance`（塗り）。allDone：`task.exhausted.redo`（塗り。唯一の操作） | `<main>`、`<h1>`、`<p>`（累計、説明、次の段階の説明）、`<button>` ×2（allDone は ×1）、操作で日付をまたいで着いたときだけ `<p role="status" tabindex="-1">`（D-30） | なし |
| S8 settings | データを守る操作（書き出し、読み込み）と、診断のやり直し、削除、記録への入口を 1 画面に置く | `settings.export`（保存データがないとき＝契約 data.md 3 の「なし」と「診断の途中」の両方では `settings.export` が出ないので `settings.import` を主操作にする。design-reviewer r1 の 1） | `<main>`、`<h1>`、`<section>`+`<h2>`、`<button>`、`<button>` + 隠した `<input type="file">`（読み込み）、`<dialog>`、`<a>`、`<p role="status">`、`<p role="alert">` | ファイルの読み込み：S1 と同じ型（本来の部品、理由、対応は S1 の行と 9。design-reviewer r1 の 4） |
| S9 settings.stats | 13 の指標と 1 対 1 の 11 の値を、スクリーンショット 1 枚で送れる形で出す | `settings.stats.back` | `<main>`、`<h1>`、`<p>`、`<dl>`（`<dt>`/`<dd>`）、`<a>` | なし。グラフは使わない（色と 2 次元が増える。R-16） |
| S10 history | 出した課題と申告を新しい順に見せ、書いた答えを読み返せるようにする | `history.empty.action`（0 件のとき）/ 行の `history.row.answer`（答えの開閉） | `<main>`、`<h1>`、`<ol>`+`<li>`、`<details>`+`<summary>`、`<a>` | なし |
| ダイアログ settings.import.confirm / settings.delete.confirm | 取り消せない操作の前に、何が消えるかを見せて確かめる | `.ok`（取り消せない操作のボタン） | ネイティブの `<dialog>`（`showModal()` で開く。開くときに DOM に足し、閉じたら DOM から外す。dialog の役割と modal はネイティブが持つので属性を重ねて書かない。Escape で閉じる、閉じたら呼び出し元へフォーカスを戻す） | なし（R-20。重なる要素の数え方は contracts/：tech-lead r1 P3） |

## 4. 決定と根拠
| 決定 | 根拠（R-n） | 原則（URL か B-n） |
|---|---|---|
| D-1 初回は S1（説明 10 行以内と「診断を始める」1 つ）→ S2 ×3 → S3。2 回目以降は開いたら S3 / S5 / S6 / S7 で、説明も案内も挟まない | R-7（ルールの説明は 10 行未満）、R-2・R-3・R-4（競合は登録が先）、R-5（地図が先） | B-1、B-2。差をつける点 1 |
| D-2 診断は 1 画面 1 問、進み具合「質問 n / 3」、ネイティブの radio、確定はボタン | R-8（one thing per page）、R-21（radio の操作） | https://www.w3.org/WAI/ARIA/apg/patterns/radio/ 、https://www.w3.org/WAI/WCAG22/Understanding/on-input.html |
| D-3 S3 は題名を h1 にし、4 要素を h2 と段落で縦に並べ、申告 4 つは末尾。「完了」だけを塗りの主操作にし、他 3 つは枠の副操作 | R-6（1 日 1 つ）、R-16（320 px）、R-17（44 px） | B-1、B-2、B-3 |
| D-4（r7 で書き直し。FB-2、FB-3）S5 と S6 は「確認ページ」の型で組む：終えた事実 → 次に起きること → 次に要るもの、の順。S5 は、h1（完了を記録した）→ 完了した課題の題名 1 行（Takuma の決定 D4、2026-10-30）→ 累計（D-35）→ 祝い（D-36）→ ひとこと解説（D-38）→ 今週の完了日数（D-39）→ `task.next.note`（明日も 1 件出る。続けるなら進める）→ `task.next`（副操作の形の枠のボタン 1 つ）→ 履歴へのリンク。S6 は h1（申告を記録した）→ `task.skipped.levelHint`（難しすぎ / 簡単すぎのとき）→ `task.next.note` → `task.next` → 履歴へのリンクで、解説も累計も祝いも労いも置かない（事実だけ）。「次の一手に進む」は塗りの主操作にせず、確認も催促も「もう 1 件どうですか」の再表示も置かず、何件目でも同じ位置に同じ 1 文と 1 ボタン。押すと同期で S3 を描き、フォーカスを h1 へ移す。連続日数、「途切れ」、次の課題の題名は出さない。再読み込みしても同じ画面に戻る | R-53（確認ページ：what happens next と次に要るリンク。戻れること）、R-44（Continue の連鎖の逆）、R-60（confirmshaming と nagging を置かない）、R-32（何度も出る画面に動きを足さない）、R-46（抜けを見せない）、R-6（データと注意を奪わない） | https://design-system.service.gov.uk/patterns/confirmation-pages/ 、https://www.deceptive.design/types/nagging 、B-1、B-2。差をつける点 2（調査 6.1） |
| D-5 答えの欄は課題の本文の下、申告の上に `<textarea>` を 1 つ。ラベルに「任意」。保存は最後の入力から 1 秒以内に黙って行い（pagehide と visibilitychange でも）、「保存しました」を `role="status"` で出す | R-19（status messages）、R-25（16 px）、R-26 | https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html 、B-1 |
| D-6 外で行う課題の印は、題名の直下に文字だけの印「外で行う」と、「要る道具」の定義リスト。色もアイコンも使わない | R-7（色は意味にだけ）、R-15（枠は 3:1） | https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html 、B-5 |
| D-7 空とエラーは「何が起きたか」+「次の一手のボタン」の 2 要素。読み込み中に「0 件」を出さない | R-9、R-10 | https://www.nngroup.com/articles/empty-state-interface-design/ 、B-1 |
| D-8 エラーは問題の近く（入力欄の直下、ボタンの直上）に文字で出し、入力を保ち、やり直しのボタンを添える。エラーの知らせは `role="alert"` | R-10（near the element、preserve input）、R-19 | https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html 、https://www.w3.org/WAI/ARIA/apg/patterns/alert/ |
| D-9 取り消せない操作（全削除、読み込みの置き換え）は `<dialog>` で確認し、何が消えるかを文で見せる。初期フォーカスは「やめる」 | R-20 | https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ 、https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html |
| D-10 ホーム画面の案内（AC-21）は S1 の説明と「診断を始める」の間に、本文の一部として置く。ダイアログや固定のバナーにしない | R-18（固定のバナーがフォーカスを隠す）、R-24 | https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html 、B-2 |
| D-11 統計は 9 つの値（r7 で 11 に：D-42）を `<dl>` で縦に並べ、ラベルは PRD 13 の指標の語。グラフも色も使わない。日付は ISO 8601（YYYY-MM-DD）で、`data-stat-*` と見える文字を同じ値にする（Takuma の決定 D2、2026-10-30） | R-16、案A（研究 7） | B-1、B-5 |
| D-12 ダークモードは OS の設定に従い、独自の切り替えを置かない。`color-scheme: light dark` | R-22 | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme 、B-2 |
| D-13 動きは「保存しました」と `app.loading` の不透明度だけ。`prefers-reduced-motion: reduce` で 0 ms | R-23 | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion 、B-6 |
| D-14 本文 16 px、行間 1.6、14 px 未満なし、書体はシステムの sans-serif 1 つ、文字の段階は 4 つ | R-26、R-25 | https://design.digital.go.jp/foundations/typography/ 、B-4 |
| D-15 色は地 1 つ、文字 2 つ、主操作 1 色、意味色 3 つ（成功、注意、エラー）、枠、フォーカスだけ。すべて 3 通りの値（ライト、ダーク、上げる）を tokens に持ち、比を 9 に書く | R-13（カラフルさの好み）、R-14、R-15 | https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html 、B-5 |
| D-16 押せる範囲は 44 × 44 CSS px 以上（主操作、申告、設定の操作、radio のラベル）。単独のリンクは上下に space.3 の内側と `min-width: 44px` で 44 × 44 にする（tokens 4） | R-17 | https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html |
| D-17 フォーカスの枠は 3 px の `outline` と 2 px の `outline-offset`、色は color.focus | R-15 | https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html |
| D-18 幅 320 px で横スクロール 0：要素は常に縦に積み、申告の副操作 3 つは `flex-wrap` で折り返す。`text-overflow: ellipsis` を使わない | R-16 | https://www.w3.org/WAI/WCAG22/Understanding/reflow.html 、B-3 |
| D-19 文言はです・ます、絵文字と感嘆符なし、ボタンは動詞。完了の直後の 1 文だけ労い（事実の言い方）。英語は同じ調子で動詞始まり | R-11、R-12（性格語） | https://www.nngroup.com/articles/tone-of-voice-dimensions/ 、B-1 |
| D-20 アイコンを使わない（0 個）。意味は文字と枠で伝える。閉じるボタンも文字「閉じる」 | R-7（絵文字は読み上げに向かない）、R-2（busy の不満） | https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html 、B-2 |
| D-21 リンクは下線を必ず付ける（色だけで区別しない） | R-7 | https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html |
| D-22 S10 の行の答えは `<details>`/`<summary>` で畳む（長い答えで一覧が崩れない。キーボードで開閉できる） | R-16 | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details |
| D-23 権限（保存の永続化）は画面で求めず、初めて S3 を出した直後に `persist()` を 1 回だけ呼ぶ。断られたら S8 に注意と「書き出す」を置く | R-9（次の一手）、PRD 11 の冒頭 | B-1 |
| D-24 読み込みの失敗は、選んだファイルのそば（読み込みのボタンの直下）に「読めなかった」+「理由と直し方」の 2 文。確認は出さない | R-10 | https://www.nngroup.com/articles/error-messages-scoring-rubric/ |
| D-25 `forced-colors: active` では色の値を持たず、枠と下線で意味を保つ（印は枠、リンクは下線、エラーは文字） | R-15 | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors |
| D-26 S3 の申告（完了、難しすぎ、簡単すぎ、今日はできない）に数秒の取り消しを置かない。予防は事前の注記 `task.report.note` と、主操作（塗り）と副操作（枠）の形と文言の違い（D-3）で行う。理由：(1) AC-5 と AC-7 の Then は申告の直後にその日の状態が確定し「再読み込みしても変わらない」ことで、数秒の猶予はこの読み方を変える。(2) 取り消しの知らせとボタンは S4 / S6 に重ねる要素になり、B-2 と D-10（重ねない）に反する。(3) 申告は法的・金銭的な入力ではなく、間違いの影響は 1 日 1 件で、段階は同じ申告が 2 回続いたときだけ動く（AC-8）ので、1 回の押し間違いで段階は変わらない。(4) 毎日の主操作に確認を足すと「手早い」に反する（design-reviewer r1 の 7） | R-6（1 日 1 つ、3 分で終える）、R-10（予防の文は問題の近くに） | https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html 、B-2 |
| D-27 ファイルの読み込みは S1 と S8 で同じ型：見える `<button>`（副操作の形。保存データなしの S8 では主操作の形）が、隠した `<input type="file">` の `click()` を呼ぶ。input は `tabindex="-1"` と `aria-hidden="true"` でフォーカスと読み上げの順から外し、フォーカスの枠と名前はボタンが持つ。テストは input に setInputFiles する（9） | R-17（押せる範囲）、R-15（フォーカスの枠） | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file 、https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html 、B-6 |
| D-28 ホバーと押した瞬間の見た目は tokens 4 の決まりだけ（ホバーは下線、押した瞬間は塗りと文字の入れ替え）。新しい色も transition も足さない | R-15（枠と状態の 3:1）、R-7（色は意味にだけ） | https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html 、B-5 |
| D-29 ホーム画面のアイコンと manifest を置く。アイコンは `apple-touch-icon` 180 × 180 px の PNG 1 枚（生の大きさ 4,000 バイト以下。契約 budgets.md の 1 と 6。2026-11-04 に 10,000 から下げた）で、地は color.bg（ライト）1 色、中央に「一」1 字を color.text（ライト）。影、枠、グラデーション、別の色は使わない。manifest は `name` と `short_name`「今日の一手」、`display: standalone`、`start_url` と `scope` は `./`。形の詳細は 8（Takuma の決定 D5、2026-10-30） | R-24（iOS は `apple-touch-icon` 180 × 180 を読む）、R-7（色は意味にだけ） | https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html 、B-2、B-5 |
| D-30 画面を開いたまま日付が変わった後の最初の操作（ボタン、リンク、radio の確定。契約 data.md 4）は実行せず（PRD 11 の冒頭。指揮役の決定 2026-11-03：docs/approvals/delegation.md）、着いた翌日の S3（か S7）の `<main>` の先頭に知らせ `task.dayChanged`（`<p role="status" tabindex="-1">`、text.body、color.warning）を 1 つ出し、フォーカスをそこへ移す（画面の先頭までスクロールする）。文は「日付が変わった」「直前の操作は無効」「前の課題は履歴にある」の 3 点で、どの操作（申告、評価、nav、アプリ名）の後でも同じ 1 キー。履歴へのリンクは足さない（ヘッダーの `nav.history` が 1 タップで届く。B-2）。読み込みで翌日に着いたときは出さない（AC-6 の通常の経路）。次の操作か再読み込みで消え、保存しない。着いた先が S1 / S2（保存データなし、診断の途中）のときは出さない（履歴に移る課題がない） | R-27（1 状態の可視化、9 問題を正確に示す）、R-28（`tabindex="-1"` でフォーカスを移す）、R-19（status）、R-10（エラーの見た目にしない、責めない） | https://www.nngroup.com/articles/ten-usability-heuristics/ 、https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html 、B-1、B-2 |
| D-31 S8 の `settings.storage.notPersisted` は、S8 を描くたびに `navigator.storage.persisted()` で今の状態を読み、`false` のときだけ出す。保存した `device.persistGranted` は表示の判定に使わない（古くなる。指揮役の決定 2026-11-03）。`persisted()` がない、または例外のときは出さない（「許可しませんでした」と言い切れないため）。`persist()` は後の日に求め直さない（U-14 で決定。指揮役の決定 2026-11-04、契約 data.md 11） | R-29（断られた要求は後で評価し直される。`persisted()` で今の状態）、R-27（8 出続ける注意は効き目が薄れる）、R-31 | https://web.dev/articles/persistent-storage 、B-1 |
| D-32 `task.answer.limit`（上限に達した）は color.warning、`role="status"`。入力が受け付けられなくなった理由を伝える注意で、エラーではない（入力は保たれ、直す操作もない）。8 の色の一覧に足す | R-10（Warnings should not look like errors）、R-19 | https://www.nngroup.com/articles/error-messages-scoring-rubric/ 、B-5 |
| D-33 案内（`home.addToHomeScreen`、`home.standalone`）は四方を 1 px の color.border で囲む（塗りと影はない）。理由：「閉じる」（または読み込み）で消える範囲を見せるためで、余白だけでは「閉じる」が何を消すかが見えない。これが tokens 1「箱を置かない」の唯一の例外で、他の場所には広げない | R-30（境界の中は一群と受け取られる。使いすぎると散らかる）、R-18（重ねずに本文の一部として置く） | https://www.nngroup.com/articles/common-region/ 、B-1、B-2 |
| D-34（r7）完了の直後は S4 の 1 画面に収める：h1「完了しました」→ 累計 → 祝い → ひとこと解説 → 「役に立ったか」の問い → 答える 2 ボタンと「今回は答えない」。解説を読んでから答える順にし、画面を分けて「Continue」を重ねない。「次の一手に進む」は S4 には置かず、S5 / S6 にだけ置く（1 画面に求める答えは 1 つ：問いに答えるか閉じるか） | R-44（Duolingo は 4 画面以上に分ける）、R-53（終えた直後に返すものを 1 画面に）、R-56（staged disclosure）、R-57（retrieval の後に確かめる）、R-35（put the most important information first） | https://www.nngroup.com/articles/progressive-disclosure/ 、B-1、B-2 |
| D-35（r7）累計（完了した課題の総数。S9 の `data-stat-completed` と同じ値）は S4、S5、S7 に 1 行：ラベル `task.total.label`（text.small、color.text.secondary）と値 `task.total.value`（「{count} 件」。text.title、color.text）。値は本文より大きい唯一の非見出しの文字で、色は付けない。新しい text style は足さない（B-4 の 4 段に収めるため text.title を使う）。指揮役の決定 2026-11-05（docs/approvals/delegation.md：本文より大きい text style で 1 行出す。案A'） | R-34（feedback は文字で。色や動きに頼らない）、R-16（320 px で折り返す）、R-43（連続記録の数字と同じ効き目の証拠はない。だから数字は大きくするが、動きと色は足さない）、調査 7.1 の案A' | https://developer.apple.com/design/human-interface-guidelines/feedback 、B-4、B-5 |
| D-36（r7）節目の祝いは文だけ：`task.cheer` の要素 1 つに、累計が 7 / 30 / 100 のときはそれぞれ `task.cheer.at7` / `.at30` / `.at100`、それ以外は `task.cheer.default` の文言を入れ、`data-milestone` に 7 / 30 / 100 / none を書く。文は数えられる事実（「7 件目を終えました。最初の節目です。」）で、感嘆符、絵文字、「すごい」のような評価の語を使わない。色は color.text のまま（節目でも変えない）。動きは入れない：紙吹雪、拡大、キャラクター、音は置かず、不透明度の変化も付けない。したがって `prefers-reduced-motion: reduce` でも見た目は同じで、別の見え方を用意しない。「連続」「途切れ」「逃した」「streak」「missed」は文言ファイルの全キーで 0 件（AC-35） | R-42、R-43（節目は少ない日だけ特別。動きは連続記録と一体の効き目で、累計に同じ証拠はない）、R-35（light and congratulatory でも「Let's do it!」より「Send」。interjections は不誠実に響く）、R-32（動きは目的のためだけに。頻繁な操作に足さない）、R-33、R-38、R-40（動きを減らす設定）、R-39（自動の動きは 5 秒以内）、R-41（注意を奪う動きは dark pattern）、R-46（失う恐れで動かさない） | https://developer.apple.com/design/human-interface-guidelines/motion 、https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html 、B-2、B-5 |
| D-37（r7）S3 の進み具合は文字だけ：日付の行の直後、h1 の前に `task.progress`「この段階の {index} / {total} 件目」（text.small、color.text.secondary。S2 の「質問 n / 3」と同じ位置と text style）。`<progress>` も棒も使わない。同じ日の 2 件目以降は日付の行を `task.today.label.nth`「今日 {nth} 件目の課題 {date}」に差し替える（1 件目は `task.today.label` のまま）。値は `task.today` の要素の `data-progress-index`、`data-progress-total`、`data-task-nth-today` | R-37（progress indicator は待ち時間用で一時的。学習の進み具合は対象外）、R-59（`<progress>` には別のラベルが要る）、R-65（GOV.UK は「Completed」を文字で示す）、R-16 | https://developer.apple.com/design/human-interface-guidelines/progress-indicators 、B-1、B-4 |
| D-38（r7）ひとこと解説は `<h2>` `task.insight`「ひとこと解説」+ `<p>` `task.insight.text`（課題集の `insight`。text.body）。折りたたまない（`<details>` は開く操作が 1 つ増える）。S4 と S5 で、祝いの直後、問い（S4）か今週の行（S5）の直前に置く。S3 と S6 の DOM には置かない（AC-38 の 0 件）。見出しに「答え」「正解」の語を使わない | R-56（staged disclosure：考える → 答える → 解説）、R-57（retrieval の後に確かめる。先に出すと retrieval にならない）、R-58（折りたたみは操作が増える）、R-55（plain language） | https://www.learningscientists.org/blog/2016/6/23-1 、B-1 |
| D-39（r7）今週の完了日数は文と数字だけ：`task.week`「今週（月曜から）の完了日数：{days} 日」を S5 の末尾（`task.next.note` の前）と S9 の `<dl>` に出す。曜日の並び、7 つのドット、灰色の抜けた日、先週の値は出さない（先週の識別子を定義しない：AC-37）。「月曜から」は省かない（`ja-JP` の暦の慣習は日曜始まりで、PRD の週は ISO 8601 の月曜始まり）。指揮役の決定 2026-11-05（docs/approvals/delegation.md） | R-46（抜けた日の灰色は「直したいエラー」に見える）、R-61（`ja` と `en-US` の firstDay は 7）、R-62（ISO の週は月曜始まり）、R-63（Apple の週の要約は数だけ）、R-16 | https://en.wikipedia.org/wiki/ISO_week_date 、B-1、B-5 |
| D-40（r7）S7 は 2 変種。levelDone（初級か中級を出し終えた）：h1 `task.exhausted.levelDone`「{area}の{level}を修了しました」→ 累計（D-35）→ `task.exhausted.levelDone.detail`（この段階の {total} 件をすべて出した。進むと今日から出る）→ `task.exhausted.next`（次の段階の名前と、診断の選択肢と同じ 1 行の説明 `level.<次>.desc`）→（次の段階の課題をすでに出したことがあるときだけ `task.exhausted.seenNext`：前に出したものを除いて続く。難しければ別の領域も選べる）→ 主操作 `task.exhausted.advance`「{nextLevel}に進む」（塗り）→ 副操作 `task.exhausted.redo`「別の領域を選ぶ」。allDone（上級を出し終えた）：h1 `task.exhausted.allDone`「{area}の上級を修了しました」→ 累計 → `task.exhausted.allDone.detail`（上級の {total} 件をすべて出した。新しい課題は次の版。別の領域、または同じ領域の別の段階を選べる）→ `task.exhausted.redo`（塗り。唯一の操作）。「難しすぎ」2 回で下がった先の組を出し終えていた場合（tech-lead G0 r3 の提案 4）は、levelDone の `task.exhausted.seenNext` の条件（履歴に同じ領域で次の段階の行がある）に当たるので、進む先の段階名をそのまま言い、責めず隠さず、別の領域の選択肢を添える。段階の説明は診断の選択肢と同じキーを使う（paiza の S〜E の 1 行定義の型） | R-51（paiza：順に解くとレベルアップ。ランクに 1 行の定義）、R-52（Exercism：終えると次が開く）、R-65（修了を文字で）、R-35（avoid blame。次の一手を明示）、R-53（確認ページ：次に起きることと次に要るもの）、R-9（空の状態は何が起きたか + 次の一手） | https://design-system.service.gov.uk/patterns/confirmation-pages/ 、B-1、B-2 |
| D-41（r7）診断の入口を未経験に開く：S1 の `diagnosis.start.lead.1` を「コードを書いたことがない人から現役のエンジニアまで使えます」の趣旨に差し替え、S2 の 1 問目の各選択肢にヒント文 `area.<ID>.desc`（1 文、句点なし、リンクなし、ja / en とも 40 字以内、専門用語を使わない）、2 問目の段階の説明を PRD 9 の趣旨（初級＝コードをほとんど書いたことがない、中級＝仕事や学習で書いている（人に聞きながらでもよい）、上級＝設計を決め、人に教えている）に書き直し、3 問目の先頭に `years.never`「まだコードを書いたことがない」を足す（5 択。数直線の順）。ヒント文と説明は radio の `<label>` の中（text.small、color.text.secondary）に置き、読み上げでは選択肢の名前に続けて読まれる。別の説明画面やキャラクターは足さない | R-54（radio のヒント文：1 文、句点なし、リンクなし。読み上げは全文）、R-55（技術用語は先に説明する。専門家にも平易な言葉）、R-36（onboarding は文脈の中のヒントで。別の流れを足さない）、R-50（Progate は「大丈夫」を先に置くが、不満は用語）、R-8（one thing per page） | https://design-system.service.gov.uk/components/radios/ 、https://www.nngroup.com/articles/plain-language-experts/ 、B-1 |
| D-42（r7）S9 に 2 行を足して 11 行にする：`settings.stats.daysCompletedWeek`（今週（月曜から）の完了日数。`data-stat-days-completed-week`）を `daysCompleted7d` の直後に、`settings.stats.extraCompleted`（同じ日の 2 件目以降の完了件数。`data-stat-extra-completed`）をその直後に。ラベルは PRD 13 の指標の語。形は D-11 のまま（`<dl>`、グラフも色もなし） | R-16、R-61（「月曜から」を明記） | B-1、B-5 |

## 5. 画面ごとの状態
該当しない状態は「なし」と理由。オフラインは全画面で通常と同じ（アプリは読み込み後に通信を使わない。AC-12。Service Worker で再読み込みも同じ：AC-23）。初めての訪問でキャッシュがないままオフラインのときは、ブラウザ自身のエラーページになり、アプリの画面はない（対応は範囲の外）。「一部だけ読めたとき」は、保存は 1 キーの JSON を全体で検査して通るか落ちるかの 2 択（部分の読み込みをしない。読み込むファイルも同じ）なので、S0 の error 以外は「なし」。「権限を断られたとき」は、求める権限が初めて S3 を出した直後の `persist()` だけ（7）なので、S3 と S8 以外は「なし」。design-reviewer r1 の 2 により、すべての「なし」に理由を書く。

| 画面 | 通常 | 空 | 読み込み中 | エラー | オフライン | 権限を断られたとき | 一部だけ読めたとき |
|---|---|---|---|---|---|---|---|
| S0 殻 | JS が動くまで `data-state="loading"`。ヘッダーのアプリ名だけ。1 秒たっても JS が動かなければ `app.loading` の文が不透明度で現れる（CSS だけ）。`<noscript>` に `app.noscript`。この 2 文は JS が動く前に出るので、HTML に日英を併記する（「読み込んでいます / Loading」の形。キーは 7 に残し、ビルドの手順で HTML に書き込む。tech-lead r1 P2） | なし（殻は内容を持たない） | 上の loading そのもの。スピナーも「0 件」も出さない（R-9） | (1) 保存データが形式に合わない → `data-state="error"`。`error.app.message`（何が起きたか）、`error.app.detail`（直し方）、主操作 `error.app.reload`、副操作 `error.app.exportRaw`（壊れたデータをそのままファイルに保存）、`error.app.delete`（確認ダイアログ `settings.delete.confirm` を経て削除 → S1）。PRD にない挙動なので 10 に書く（U-5）。(2) 保存先が使えない（localStorage の読み書きが例外を出す。Cookie とサイトデータを止めた設定など。どの設定で起きるかは未確認：tech-lead r1 P1）→ `data-state="error"`。`error.app.storageUnavailable.message` + `error.app.storageUnavailable.detail`、主操作 `error.app.reload` だけ。書き出すデータも削除するデータもないので `.exportRaw` と `.delete` は出さない | 通常と同じ | なし（この画面で求める権限はない。権限は S3 の `persist()` だけ：7） | 上のエラー (1) と同じ扱い（部分は読まない） |
| S1 diagnosis.start | ヘッダーはアプリ名と `nav.settings`（「履歴」は出さない。design-reviewer r1 の 1）。h1 `diagnosis.start.title`、`diagnosis.start.lead.1`〜`.3`、主操作 `diagnosis.start.begin`。スタンドアロンなら説明の直後に `<section>` `home.standalone.import` + 見えるボタン `home.standalone.importButton`（隠した `home.standalone.importFile` の `click()` を呼ぶ。9）。iOS の Safari（非スタンドアロン、閉じた印なし）なら説明と主操作の間に `<section>` `home.addToHomeScreen`（`.title`、`.why`、`.steps` の `<ol>` 4 項目、`.close`） | なし（この画面が「保存データなし」の表示そのもの） | なし（殻の loading の後に同期で出る） | 読み込み（スタンドアロンの案内から）の失敗 → `home.standalone.importButton` の直下に `error.import.message` + `error.import.reason.version` か `.schema`（`role="alert"`）。データは変わらない | 通常と同じ | なし（この画面で求める権限はない） | なし（保存は 1 キーの JSON を全体で検査し、部分の読み込みはしない） |
| S2 diagnosis.question | `diagnosis.progress`（質問 n / 3、`data-question-index`、`data-question-total`）、`<fieldset>` の `<legend>` `diagnosis.q1.legend` / `q2` / `q3`、radio（q1：`area.*` 6 つに各 1 行のヒント文 `area.*.desc`（AC-39。D-41）、q2：`level.*` 3 つに説明 `level.*.desc`、q3：`years.*` 5 つ。先頭は `years.never`（AC-40））、主操作 `diagnosis.next`（3 問目は `diagnosis.finish`）、副操作 `diagnosis.back`（2 問目以降）、やり直しのときだけ `diagnosis.cancel`（S8 から入ったら S8 へ、S7 から入ったら S7 へ戻る。design-reviewer r1 の 8）。初回の診断の途中（回答が 1〜2 問だけ保存されている）で開き直したときは、まだ答えていない最初の質問を出し、「前の質問へ」で戻った質問には保存した回答を radio の `checked` に戻す（tech-lead r1 M2）。ヘッダーの nav：初回の S2（途中の再開を含む）は `nav.settings` だけ、やり直しの S2（S7 か S8 から）は `nav.history` と `nav.settings`（design-reviewer r2 の 3）。nav で離れたときの下書きの扱いは U-7 | なし（選択肢は固定） | なし（殻の loading の後に同期で出る） | (1) 未選択で確定 → `<legend>` の直下に `error.diagnosis.required`（`role="alert"`）。進まない。(2) 保存の失敗（AC-11）→ 主操作の直上に `error.storage.message` と `error.storage.retry`。質問の番号と選択は保つ。`error.storage.retry` で保存に成功すれば次の質問へ | 通常と同じ | なし（この画面で求める権限はない） | なし（診断の途中の保存は「一部」ではなく途中の状態として通常の列で扱う：M2。壊れた JSON は S0 の error） |
| S3 task.today | `task.today.label`（今日の課題 YYYY-MM-DD。同じ日の 2 件目以降は `task.today.label.nth`「今日 {nth} 件目の課題 YYYY-MM-DD」：D-37）、`task.progress`（この段階の n / N 件目。text.small。`task.today` の要素の `data-progress-index`、`data-progress-total`、`data-task-nth-today` と同じ値：AC-36、AC-33）、h1 `task.today.title`、`task.meta`（領域 / 段階 / 所要時間）、`external` なら印 `task.external.badge` と `<dl>` `task.external.tools`（`<dd>` に道具の `<ul>`）、`<h2>` `task.why` / `task.how` / `task.goal` と段落、`<label>` `task.answer.label` + `task.answer.help` + `<textarea>`（`data-testid="task.answer"`）+ `task.answer.saved`（`role="status"`、保存の 150 ms 後に出て、次の入力で消える）、`task.report.note`、主操作 `task.report.done`、副操作 `task.report.tooHard` / `.tooEasy` / `.noTime`。答えの保存は最後の入力から 1 秒以内（間隔は contracts/ で決める。案 300 ms）で、`pagehide` と `visibilitychange`（hidden）のときにも保存する（tech-lead r1 M1）。長い題名は折り返す。答えの欄は上限 `answer.max`（10 に書く。contracts/ で決める）に達すると `task.answer.limit`（`role="status"`、color.warning：D-32）。申告の取り消しは置かない（D-26）。日付が変わった後（D-30）：画面を開いたまま端末の日付が変わった後の最初の操作（表示中の課題への申告、S4 の評価、nav と `app.name` のリンク、やり直しの S2 の確定。契約 data.md 4）は実行されず、翌日の S3 に差し替わる。この S3 は `<main>` の先頭（`task.today.label` の上）に `task.dayChanged`（`<p role="status" tabindex="-1">`、text.body、color.warning）を 1 つ持ち、描いた直後にフォーカスをそこへ移す（画面の先頭までスクロールする）。前の課題は `report` が none の行として履歴にあり、書きかけの答えはその行に保存されている。新しい S3 の答えの欄は空（AC-32）。知らせは次の操作（ボタン、リンク）か再読み込みで消え、textarea への入力では消えない。保存しない（`data-state` は `task.today` のまま） | なし（出せる課題がないときは S7 に移る） | なし（殻の loading の後に同期で出る。AC-15 は殻の loading の時間） | (1) 答えの自動保存の失敗 → textarea の直下に `error.storage.message`（`role="alert"`）+ `error.storage.retry`。入力は保つ。エラーが出ている間、textarea の枠は size.border.strong の color.error で、`aria-describedby` に補助文とエラーの文の両方を入れる（`aria-invalid` は付けない：tokens 4）。(2) 申告の保存の失敗 → 申告のボタン群の直上に同じ 2 つ。状態は S3 のまま、答えも保つ | 通常と同じ | 初めて S3 を出した直後の `persist()` が断られても S3 は変わらない（知らせは S8。AC-13） | なし（部分の読み込みはしない） |
| S4 task.rate | h1 `task.rate.title`（フォーカスを移す）→ 累計 `task.total`（`task.total.label` + `task.total.value`。D-35）→ 祝い `task.cheer`（`data-milestone`。D-36）→ `<h2>` `task.insight` + `task.insight.text`（D-38）→ `task.rate.question` → `task.rate.helpful`、`task.rate.notHelpful`（同格の副操作）→ 文字のボタン `task.rate.close`。「次の一手に進む」は置かない（D-34） | なし（固定の問いとボタン 3 つ、累計と解説は必ずある。一覧を持たない） | なし（S3 の申告の直後に同期で描く） | 回答の保存の失敗 → ボタン群の直上に `error.storage.message` + `error.storage.retry`。選んだ答えは保つ。`insight` が空のときは起きない（スキーマで 1 字以上を保証。AC-38） | 通常と同じ | なし（この画面で求める権限はない） | なし（部分の読み込みはしない） |
| S5 task.done | h1 `task.done.title`（フォーカスを移す）→ `task.done.task`（完了した課題の題名。text.small、color.text.secondary）→ 累計 `task.total` → 祝い `task.cheer` → `<h2>` `task.insight` + `task.insight.text` → `task.week`（今週（月曜から）の完了日数。`data-stat-days-completed-week`。D-39）→ `task.next.note` → `task.next`（副操作の形の枠のボタン。D-4）→ リンク `task.done.history`。再読み込みしても同じ（契約 data.md 4：今日の最後の行が done）。S4 から来ても、再読み込みで来ても同じ要素 | なし（固定の文と題名 1 行、累計、解説、今週の行で、一覧を持たない。今週の完了日数は最低 1（今日）） | なし（殻の loading の後、または S4 の直後に同期で描く） | `task.next` を押した後の保存の失敗（次の課題を出す保存）→ `task.next` の直上に `error.storage.message` + `error.storage.retry`。画面は S5 のまま。`error.storage.retry` で保存に成功すれば S3 | 通常と同じ | なし（この画面で求める権限はない） | なし（部分の読み込みはしない） |
| S6 task.skipped | h1 `task.skipped.title`（フォーカスを移す）→ too_hard / too_easy のときだけ `task.skipped.levelHint` → `task.next.note` → `task.next` → リンク `task.skipped.history`。解説、累計、祝い、労いは出さない（D-4。`task.insight.text` は 0 件：AC-38） | なし（固定の文だけで、一覧を持たない） | なし（殻の loading の後、または S3 の申告の直後に同期で描く） | `task.next` を押した後の保存の失敗 → S5 と同じ（`task.next` の直上に 2 つ。画面は S6 のまま） | 通常と同じ | なし（この画面で求める権限はない） | なし（部分の読み込みはしない） |
| S7 task.exhausted | levelDone（段階が初級か中級）：h1 `task.exhausted.levelDone`（フォーカスを移す）→ 累計 `task.total` → `task.exhausted.levelDone.detail` → `task.exhausted.next`（次の段階の名前と 1 行の説明）→（次の段階の行が履歴にあるときだけ `task.exhausted.seenNext`）→ 主操作 `task.exhausted.advance`（→ 同じ日に S3。出せなければ S7 のまま描き直す）→ 副操作 `task.exhausted.redo`（→ S2。「やめる」で S7 に戻る）。allDone（段階が上級）：h1 `task.exhausted.allDone` → 累計 → `task.exhausted.allDone.detail` → 主操作 `task.exhausted.redo`（`task.exhausted.advance` は 0 件）。操作で日付をまたいで着いたときは h1 の上に `task.dayChanged`（S3 と同じ部品と扱い。D-30） | この画面が「出せる課題 0 件」の空の表示そのもの（何が起きたか + 次の一手。D-40） | なし（殻の loading の後、または `task.next` / `task.exhausted.advance` の直後に同期で描く。課題集は配布物に入っていて通信しない） | `task.exhausted.advance` を押した後の保存の失敗（段階を上げて次の課題を出す保存）→ `task.exhausted.advance` の直上に `error.storage.message` + `error.storage.retry`。画面は S7 のまま、段階も変わらない | 通常と同じ | なし（この画面で求める権限はない） | なし（部分の読み込みはしない） |
| S8 settings | h1 `settings.title`。節「データ」：`settings.data.note`、（断られたときだけ）`settings.storage.notPersisted`、主操作 `settings.export`、`settings.export.done`（`role="status"`）、`settings.import.note`、見えるボタン `settings.import`（隠した `settings.import.file`（`<input type="file" accept=".json,application/json">`）の `click()` を呼ぶ。9）。節「診断」：`settings.diagnosis.current`、`settings.redo`、`settings.redo.note`。節「ホーム画面」（iOS の Safari で非スタンドアロンのときだけ）：`settings.homeScreen.open` → 同じ場所に `home.addToHomeScreen` を開く。節「記録」：`settings.stats.open`、`settings.history.open`。節「削除」：`settings.delete`（取り消せない操作のボタン）。末尾：`settings.version`、`settings.privacy`（単独のリンク。44 × 44） | 保存データがないとき（S1 か初回の S2 の `nav.settings` から来たとき。契約 data.md 3 の「なし」と「診断の途中」の両方でこの表示を使う）：ヘッダーの nav は「設定」だけ。節「データ」は `settings.data.note`、`settings.import.note`、`settings.import` だけを出し、`settings.import` を主操作の形（塗り）にする（`settings.export` が出ないため。B-2。design-reviewer r1 の 1）。節「ホーム画面」（iOS の Safari）と末尾（版、プライバシー）は出す。書き出し、診断、記録、削除は出さない（する事がない。B-1。「診断の途中」でも同じ：書き出す記録も統計もまだなく、途中の回答は S2 の「前の質問へ」で直せるので、やり直しと削除を置く理由がない）。「診断の途中」で読み込むと確認なしで置き換わる（契約 data.md 7。失うのは 1〜2 問の選択だけで、`settings.import.note` が置き換わると伝えている）。定義は契約 data.md 3（あり＝`diagnosis.completedOn` があるか `history` が 1 行以上、途中＝「あり」でなく `diagnosis.area` がある、なし＝それ以外） | なし（ファイルの検査は同期で、数 KB なら一瞬。大きさの上限は contracts/） | (1) 読み込み：`settings.import` の直下に `error.import.message` + `error.import.reason.version` / `.schema`（`role="alert"`）。確認は出ない。データは変わらない。(2) 書き出しと削除の保存の失敗：なし（書き出しは読むだけでファイルを作り、保存を行わない。削除は 1 キーの `removeItem` で、容量の失敗が起きない。保存先そのものが使えないときは起動時に S0 の error (2) で止まり、S8 に着かない。design-reviewer G3 r1 の 10） | 通常と同じ | 保存が永続でないとき：S8 を描くたびに `navigator.storage.persisted()` を読み（描く前に答えを待つ。数 ms で、読み込み中の表示は出さない）、`false` のときだけ `settings.storage.notPersisted`（color.warning。エラーの見た目にしない：R-10）を `settings.export` の直上に出す。保存した `device.persistGranted` は表示の判定に使わない。`persisted()` がない、または例外のときは出さない（D-31）。ファイル選択を取り消したとき：何も起きない（フォーカスはボタンのまま） | なし（部分の読み込みはしない。読み込むファイルも全体で検査して通るか落ちるかの 2 択） |
| S9 settings.stats | h1 `settings.stats.title`、`settings.stats.today`（今日 YYYY-MM-DD）、`<dl>` 11 行（`settings.stats.firstOpenDate` … `.noTime`。6 の表の順。r7 で `.daysCompletedWeek` と `.extraCompleted` を足した：D-42）、`settings.stats.note`、リンク `settings.stats.back` | 診断直後で課題 0 件：値は 0 と初めて開いた日（「0」は本当の 0 なので出す。読み込み中の偽の 0 ではない）。月曜の朝は今週の完了日数が 0 で、それも本当の 0 | なし（保存から同期で計算して描く） | なし（表示だけ。保存の読み取りに失敗すれば S0 の error） | 通常と同じ | なし（この画面で求める権限はない） | なし（部分の読み込みはしない） |
| S10 history | h1 `history.title`、`<ol>` に新しい順の `<li>`（`data-testid="history.row"`、`data-task-id`、`data-date`、`data-report`、`data-helpful`）。行の中：日付（YYYY-MM-DD、text.small）、題名、`report.*`、done のときだけ `helpful.*`、答えがあれば `<details>` `history.row.answer`。件数が多くても全件を 1 列で出す（28 日で 28 行、1 年で 365 行。分けない） | 0 件：`history.empty` + 主操作 `history.empty.action`（今日の課題へ） | なし（履歴は保存から同期で読んで描く。365 行でも段階的には読まない） | なし（表示だけ。保存の読み取りに失敗すれば S0 の error） | 通常と同じ | なし（この画面で求める権限はない） | なし（部分の読み込みはしない） |
| ダイアログ settings.import.confirm | `.title`、`.summary`（ファイルの中身：履歴 n 件、初めて開いた日）、`.body`、`.ok`（取り消せない操作のボタン）、`.cancel`（初期フォーカス）。開くときに DOM に足し、閉じたら外す（tech-lead r1 P3） | なし（文とボタン 2 つだけで、一覧を持たない） | なし（ファイルの要約は開く前に計算済みで、開くのは同期） | 置き換えの保存の失敗 → ダイアログの中に `error.storage.message` + `error.storage.retry` | 通常と同じ | なし（ダイアログで求める権限はない） | なし（部分の読み込みはしない） |
| ダイアログ settings.delete.confirm | `.title`、`.body`、`.ok`、`.cancel`（初期フォーカス）。開くときに DOM に足し、閉じたら外す | なし（文とボタン 2 つだけで、一覧を持たない） | なし（開くのは同期で、読むデータがない） | なし（削除は 1 キーの `removeItem` で、容量の失敗が起きない。保存先が使えないときは S0 の error (2) で止まり、このダイアログに着かない。design-reviewer G3 r1 の 10） | 通常と同じ | なし（ダイアログで求める権限はない） | なし（部分の読み込みはしない） |

### 5.1 全画面・全状態の一覧（G3 でスクリーンショットを撮る単位。r7 で足した）
verifier と design-reviewer が「全画面と全状態」を数える単位。幅 320 CSS px（AC-17 の条件）と幅 390 px の 2 通り、ライトとダークの 2 通りで撮る（計 4 枚 / 状態）。`prefers-reduced-motion` は見た目を変えないので別に撮らない（D-13、D-36）。r7 で足した状態には「r7」の印。

| # | 画面 | 状態（変種） | どう出すか | r7 |
|---|---|---|---|---|
| 1 | S0 | loading（1 秒後の `app.loading` が見える） | JS を止めて開く | |
| 2 | S0 | error（読めない） | 壊れた JSON を seed | |
| 3 | S0 | error（保存先が使えない） | localStorage が例外を出す注入 | |
| 4 | S1 | 通常（案内なし） | 保存データなし | |
| 5 | S1 | iOS の Safari の案内 `home.addToHomeScreen` | UA の偽装 | |
| 6 | S1 | スタンドアロンの案内 `home.standalone` | `display-mode: standalone` の偽装 | |
| 7 | S1 | 読み込みの失敗（案内の中にエラー） | 版が新しいファイル | |
| 8 | S2 | 1 問目（領域 6 つとヒント文） | 診断を始める | r7（ヒント文） |
| 9 | S2 | 2 問目（段階 3 つと説明） | 1 問目を確定 | r7（説明の差し替え） |
| 10 | S2 | 3 問目（経験年数 5 つ） | 2 問目を確定 | r7（`years.never`） |
| 11 | S2 | 未選択のエラー | 選ばずに確定 | |
| 12 | S2 | 保存の失敗（AC-11） | 保存の失敗を注入 | |
| 13 | S2 | やり直し（`diagnosis.cancel` と nav の「履歴」がある） | S8 の `settings.redo` | |
| 14 | S3 | 通常（in_app。1 件目） | 診断を終える | r7（`task.progress`） |
| 15 | S3 | external（印と道具） | external の課題を seed | |
| 16 | S3 | 同じ日の 2 件目（`task.today.label.nth`、`data-task-nth-today`=2） | S5 の `task.next` | r7 |
| 17 | S3 | 保存しました（`task.answer.saved`） | 答えを入力して 1 秒 | |
| 18 | S3 | 上限（`task.answer.limit`） | 2,000 字を入力 | |
| 19 | S3 | 答えの保存の失敗 | 保存の失敗を注入 | |
| 20 | S3 | 申告の保存の失敗 | 同上 | |
| 21 | S3 | 日付が変わった知らせ `task.dayChanged` | 開いたまま日付を進めて申告 | |
| 22 | S4 | 通常（累計 11、`task.cheer.default`） | 完了 10 件の seed で完了 | r7 |
| 23 | S4 | 節目 7（`task.cheer.at7`） | 完了 6 件の seed で完了 | r7 |
| 24 | S4 | 節目 30 | 完了 29 件の seed | r7 |
| 25 | S4 | 節目 100 | 完了 99 件の seed | r7 |
| 26 | S4 | 回答の保存の失敗 | 保存の失敗を注入 | |
| 27 | S5 | 通常（累計、祝い、解説、今週、次の一手） | S4 で答える | r7 |
| 28 | S5 | 再読み込み後（同じ要素） | 再読み込み | |
| 29 | S5 | `task.next` の保存の失敗 | 保存の失敗を注入 | r7 |
| 30 | S6 | 難しすぎ（`task.skipped.levelHint` あり） | `task.report.tooHard` | r7（次の一手） |
| 31 | S6 | 今日はできない（levelHint なし） | `task.report.noTime` | r7（次の一手） |
| 32 | S7 | levelDone（初級。`task.exhausted.seenNext` なし） | 初級を出し終えた seed | r7 |
| 33 | S7 | levelDone（`task.exhausted.seenNext` あり） | 中級の行がある状態で初級を出し終えた seed（難しすぎ 2 回で下がった後） | r7 |
| 34 | S7 | allDone（上級） | 上級を出し終えた seed | r7 |
| 35 | S7 | 日付が変わった知らせ | 開いたまま日付を進めて操作 | |
| 36 | S7 | `task.exhausted.advance` の保存の失敗 | 保存の失敗を注入 | r7 |
| 37 | S8 | 診断済み（通常） | nav の「設定」 | r7（`settings.redo.note` の文） |
| 38 | S8 | 永続化を断られた注意 | `persisted()` を false に注入 | |
| 39 | S8 | 書き出しました | `settings.export` | |
| 40 | S8 | 読み込みの失敗（version / schema の 2 通り） | ファイルを選ぶ | |
| 41 | S8 | iOS の Safari（ホーム画面の節と案内を開いた状態） | UA の偽装 → `settings.homeScreen.open` | |
| 42 | S8 | 保存データなし | S1 の `nav.settings` | |
| 43 | ダイアログ | `settings.import.confirm` | 保存データありで読み込む | |
| 44 | ダイアログ | `settings.delete.confirm` | `settings.delete` | |
| 45 | ダイアログ | `settings.import.confirm` の保存の失敗 | 保存の失敗を注入 | |
| 46 | S9 | 通常（11 行。AC-24 の seed） | `settings.stats.open` | r7（2 行） |
| 47 | S9 | 診断直後（0 と初めて開いた日） | 診断直後 | |
| 48 | S10 | 通常（同じ日に 2 行以上、`report.none` の行、答えの開閉） | AC-24 の seed + none の行 | r7（同じ日の 2 行） |
| 49 | S10 | 空 | 診断直後 | |

## 6. 要素と識別子
受け入れテストが使う。`data-testid` は 7 の文言キーと同じ名前（文字を持たない要素はここで決める）。ルート要素（`<html>` か `<body>`。tech-lead が決める）は `data-state`、`data-build-version`、`data-debug-load-ms` を持つ。

| 画面 | 要素 | data-testid（または属性） | アクセシブルな名前（読み上げ） |
|---|---|---|---|
| 共通 | ルート | `data-state`、`data-build-version`、`data-debug-load-ms`（S3 を表示した時点で書く） | — |
| 共通 | ヘッダーのアプリ名（リンク） | `app.name` | 「今日の一手」 |
| 共通 | nav のリンク | `nav.history`、`nav.settings`（診断前は `nav.settings` だけ。design-reviewer r1 の 1） | 「履歴」「設定」（今いる画面は aria-current） |
| S0 | 読み込みの文、noscript、エラーの文と操作 | `app.loading`、`app.noscript`、`error.app.message`、`error.app.detail`、`error.app.storageUnavailable.message`、`error.app.storageUnavailable.detail`、`error.app.reload`、`error.app.exportRaw`、`error.app.delete` | 文言のとおり |
| S1 | 題名、説明、主操作 | `diagnosis.start.title`、`diagnosis.start.lead.1`〜`.3`、`diagnosis.start.begin` | 「診断を始める」 |
| S1 | スタンドアロンの案内 | `<section>` は `home.standalone`（`aria-labelledby` で `home.standalone.import` を指す）、文 `home.standalone.import`、見えるボタン `home.standalone.importButton`（`<button>`）、隠した `<input type="file">` は `home.standalone.importFile`（`aria-hidden`、テストは setInputFiles） | 「ファイルを読み込む」（ボタン。input は読み上げの順に入らない） |
| S1、S8 | ホーム画面の案内 | `<section>` は `home.addToHomeScreen`（`aria-labelledby` で `.title`）、`home.addToHomeScreen.title`、`.why`、`<ol>` `.steps`、`<li>` `.steps.1`〜`.4`、`.close` | 「閉じる」 |
| S2 | 進み具合 | `diagnosis.progress`（`data-question-index`、`data-question-total`） | 「質問 1 / 3」 |
| S2 | 質問と選択肢 | `<fieldset>` は `diagnosis.question`、`<legend>` は `diagnosis.q1.legend` / `q2` / `q3`。radio の `<input>` は `area.backend` … `years.gte5` と `years.never`（値のキー。`value` は contracts/ の ID。未経験の ID は tech-lead が決める：案 `never`）。q1 のヒント文は `area.backend.desc` … `area.git.desc`、q2 の説明は `level.beginner.desc` 等（どちらもラベルの中の `<span>`。D-41） | legend の文 + 選択肢の文（例：「バックエンド設計 画面の裏側で、データを受け渡す仕組み」「初級 コードをほとんど書いたことがない」） |
| S2 | 操作とエラー | `diagnosis.next`、`diagnosis.finish`、`diagnosis.back`、`diagnosis.cancel`、`error.diagnosis.required`、`error.storage.message`、`error.storage.retry` | 文言のとおり |
| S3 | 日付が変わった知らせ（操作で日付をまたいだときだけ） | `task.dayChanged`（`<p role="status" tabindex="-1">`。`<main>` の先頭。描いた直後にフォーカスを移す） | 文言のとおり（2 文） |
| S3 | 課題の入れ物 | `<article>` は `task.today`（`data-task-id`、`data-task-area`、`data-task-level`、`data-task-mode`、r7 で足した `data-task-nth-today`（その日の何件目か。1 から）、`data-progress-index`（この組で出した件数 + 1。none の行も数える）、`data-progress-total`（この組の総数）） | — |
| S3 | 進み具合 | `task.progress`（「この段階の n / N 件目」。`<p>`。h1 の前） | 文言のとおり |
| S3 | 課題の文 | `task.today.label`（1 件目）または `task.today.label.nth`（同じ日の 2 件目以降。同じ位置）、`task.today.title`（h1）、`task.meta`、`task.external.badge`、`<dl>` `task.external.tools`（`<dt>` が `task.external.tools.label`、`<dd>` の中の `<ul>` の `<li>` が `task.external.tools.item`。契約 identifiers.md 3 と同じ構造）、`<h2>` `task.why` / `task.how` / `task.goal` と段落 `task.why.text` / `task.how.text` / `task.goal.text` | 見出しの文、本文 |
| S3 | 答えの欄 | `<label>` `task.answer.label`、補助 `task.answer.help`（`aria-describedby`）、`<textarea>` `task.answer`、`task.answer.saved`（`role="status"`）、`task.answer.limit`（`role="status"`）。エラーの間は `aria-describedby` にエラーの文も入る | 「答え（任意）」+ 補助の文（エラーの間はエラーの文も） |
| S3 | 申告 | `task.report.note`、`task.report.done`、`task.report.tooHard`、`task.report.tooEasy`、`task.report.noTime` | 「完了」「難しすぎ」「簡単すぎ」「今日はできない」 |
| S4、S5、S7 | 累計 | `<p>` `task.total`（入れ物。文字を持たない）の中に `<span>` `task.total.label` と `<span>` `task.total.value`（文言 `task.total.value`「{count} 件」。`data-stat-completed` に整数の文字列。S9 の `data-stat-completed` と同じ値。見える文字は整数で始まる） | 「これまでに完了した課題 7 件」 |
| S4、S5 | 祝い | `<p>` `task.cheer`（`data-milestone` は `7` / `30` / `100` / `none`。文字は `task.cheer.at7` / `.at30` / `.at100` / `.default` のどれか 1 つ。`settings.stats.firstDayCompleted.value` と同じ型：要素の識別子は固定で、文言キーは変種） | 文言のとおり |
| S4、S5 | ひとこと解説 | `<h2>` `task.insight`、`<p>` `task.insight.text`（課題集の `insight`。文言キーではない。S3 と S6 では 0 件） | 「ひとこと解説」+ 本文 |
| S4 | 文と操作 | `task.rate.title`、`task.rate.question`、`task.rate.helpful`、`task.rate.notHelpful`、`task.rate.close` | 「役に立った」「立たなかった」「今回は答えない」 |
| S5 | 今週 | `<p>` `task.week`（`data-stat-days-completed-week` に整数の文字列。S9 と同じ値） | 「今週（月曜から）の完了日数：3 日」 |
| S5、S6 | 次の一手 | `task.next.note`（`<p>`）、`task.next`（`<button>`。副操作の形） | 「次の一手に進む」 |
| S5 | 文とリンク | `task.done.title`、`task.done.task`、`task.done.history` | 「履歴を見る」 |
| S6 | 文とリンク | `task.skipped.title`、`task.skipped.levelHint`、`task.skipped.history` | 「履歴を見る」 |
| S7 | levelDone の文と操作 | `task.exhausted.levelDone`（h1）、`task.exhausted.levelDone.detail`、`task.exhausted.next`、`task.exhausted.seenNext`（条件つき）、`task.exhausted.advance`（主操作）、`task.exhausted.redo` | 「中級に進む」「別の領域を選ぶ」 |
| S7 | allDone の文と操作 | `task.exhausted.allDone`（h1）、`task.exhausted.allDone.detail`、`task.exhausted.redo`（主操作。`task.exhausted.advance` は 0 件） | 「別の領域を選ぶ」 |
| S8 | 節と操作 | `settings.title`、`settings.data.title`、`settings.data.note`、`settings.storage.notPersisted`、`settings.export`、`settings.export.done`、`settings.import.note`、`settings.import`（見える `<button>`）、`settings.import.file`（隠した `<input type="file">`。`aria-hidden`、テストは setInputFiles）、`settings.diagnosis.title`、`settings.diagnosis.current`、`settings.redo`、`settings.redo.note`、`settings.homeScreen.title`、`settings.homeScreen.open`、`settings.records.title`、`settings.stats.open`、`settings.history.open`、`settings.delete.title`、`settings.delete`、`settings.version`、`settings.privacy`、`error.import.message`、`error.import.reason.version`、`error.import.reason.schema` | 「ファイルに書き出す」「ファイルを読み込む」「診断をやり直す」「統計を見る」「履歴を見る」「すべてのデータを削除」 |
| S8 | 読み込みの確認 | `<dialog>` `settings.import.confirm`（`aria-labelledby` で `.title`）、`.title`、`.summary`、`.body`、`.ok`、`.cancel` | 「置き換える」「やめる」 |
| S8 | 削除の確認 | `<dialog>` `settings.delete.confirm`、`.title`、`.body`、`.ok`、`.cancel` | 「削除する」「やめる」 |
| S9 | 値 | `settings.stats.title`、`settings.stats.today`、`<dt>` はラベルのキー、`<dd>` は同じキー + `.value`：`settings.stats.firstOpenDate.value`（`data-stat-first-open-date`）、`.issued.value`（`data-stat-issued`）、`.completed.value`（`data-stat-completed`）、`.firstDayCompleted.value`（`data-stat-first-day-completed`。文は `.yes` / `.no`）、`.daysCompleted7d.value`（`data-stat-days-completed-7d`）、`.daysCompletedWeek.value`（`data-stat-days-completed-week`。r7）、`.extraCompleted.value`（`data-stat-extra-completed`。r7）、`.helpful.value`（`data-stat-helpful`）、`.rated.value`（`data-stat-rated`）、`.tooHard.value`（`data-stat-too-hard`）、`.noTime.value`（`data-stat-no-time`）、`settings.stats.note`、`settings.stats.back` | `<dt>` の文 + 値 |
| S10 | 行 | `history.title`、`<ol>` `history.list`、`<li>` `history.row`（`data-task-id`、`data-date`、`data-report`、`data-helpful`）、行の中：`history.row.date`、`history.row.taskTitle`、`report.done` / `.tooHard` / `.tooEasy` / `.noTime` / `.none`、`helpful.yes` / `.no` / `.unanswered`、`<details>` の `<summary>` `history.row.answer`、答えの本文 `history.row.answerText`、空：`history.empty`、`history.empty.action` | 「答えを見る」（details は開閉の状態も読む） |

### 6.1 r7 で足した識別子の一覧（tech-lead が contracts/identifiers.md に写す）
文言キー（28 個。identifiers.md 6 に足す。`data-testid` としても使う）：`task.progress`、`task.today.label.nth`、`task.total.label`、`task.total.value`、`task.cheer.default`、`task.cheer.at7`、`task.cheer.at30`、`task.cheer.at100`、`task.insight`、`task.week`、`task.next`、`task.next.note`、`task.exhausted.levelDone`、`task.exhausted.levelDone.detail`、`task.exhausted.next`、`task.exhausted.seenNext`、`task.exhausted.advance`、`task.exhausted.allDone`、`task.exhausted.allDone.detail`、`area.backend.desc`、`area.frontend.desc`、`area.database.desc`、`area.infra.desc`、`area.testing.desc`、`area.git.desc`、`years.never`、`settings.stats.daysCompletedWeek`、`settings.stats.extraCompleted`。消す文言キー（4 個）：`task.done.message`、`task.skipped.message`、`task.exhausted.message`、`task.exhausted.detail`。合計 146 → 170。`task.cheer.at7` / `.at30` / `.at100` / `.default` の 4 つは `data-testid` としては使わず（要素は `task.cheer`）、`settings.stats.firstDayCompleted.yes` / `.no` と同じ扱い。

| data-testid（文字を持たない要素。identifiers.md 3 に足す） | 要素 | 画面 |
|---|---|---|
| `task.total` | 累計の `<p>`（中に `task.total.label` と `task.total.value`） | S4、S5、S7 |
| `task.cheer` | 祝いの `<p>`（文字は `task.cheer.*` の 1 つ。`data-milestone` を持つ） | S4、S5 |
| `task.insight.text` | ひとこと解説の `<p>`（課題集の `insight`） | S4、S5（S3、S6 では 0 件） |
| `settings.stats.daysCompletedWeek.value`、`settings.stats.extraCompleted.value` | 値の `<dd>`（`data-stat-days-completed-week`、`data-stat-extra-completed` を持つ） | S9 |

| 値を持つ属性（identifiers.md 4 に足す） | 要素 | 値 |
|---|---|---|
| `data-task-nth-today` | `task.today` | その日に出した課題の何件目か（1 から。整数の文字列） |
| `data-progress-index` | `task.today` | 目標の領域と今の段階の組で出した件数 + 1（none の行も数える。PRD 11「進み具合」） |
| `data-progress-total` | `task.today` | その組の課題の総数（v1 は初級・中級 14、上級 7） |
| `data-stat-completed` | `task.total.value` | S9 の `data-stat-completed` と同じ整数 |
| `data-milestone` | `task.cheer` | `7`、`30`、`100`、`none` |
| `data-stat-days-completed-week` | `task.week`（S5）、`settings.stats.daysCompletedWeek.value`（S9） | 月曜から今日までに完了した日数（0〜7） |
| `data-stat-extra-completed` | `settings.stats.extraCompleted.value` | 同じ日の 2 件目以降の完了件数（PRD 11「2 件目以降の完了」） |

ID の語彙（identifiers.md 5 に足す）：経験年数に未経験の ID を 1 つ（案 `never`。tech-lead G0 r4 の提案 4。`report` の `none` と混ざらない語）。文言キーは `years.<ID>` なので、ID が `never` でなければキーの末尾もそれに合わせる（10 の U-16）。

## 7. 文言
です・ます、絵文字と感嘆符なし、ボタンは動詞。英語は plain、direct、動詞始まり（調査 5）。プレースホルダーは `{name}` で、数の複数形は ICU の `{n, plural, one {…} other {…}}`（日本語は複数形がないので数だけ）。日付は ISO 8601（YYYY-MM-DD）を両言語で使う（`data-date`、`data-stat-first-open-date` と見える文字を同じ値にするため。AC-7、AC-24。Takuma の決定 D2、2026-10-30）。アプリ名 `app.name` は英語表示でも「今日の一手」のまま（Takuma の決定 D3、2026-10-30）。課題集の本文と `tools` は日本語のみ（PRD Q4）で、ここには含めない。この表が ja と en の文言ファイルの原本（AC-26 の「片方にしかないキー 0 件」）。文字がデータから来る要素の `data-testid`（`task.today.title`、`task.why.text`、`task.how.text`、`task.goal.text`、`task.insight.text`、`task.external.tools.item`、`history.row.taskTitle`、`history.row.answerText`、`history.row.date`、`settings.stats.*.value`）と、文言の変種を入れ替える入れ物（`task.cheer`、`task.total`）は文言キーではなく、6 の表だけにある。r7 で足した差し込み：`{index}`、`{total}`（`task.progress`、`task.exhausted.*.detail`）、`{nth}`（`task.today.label.nth`）、`{count}`（`task.total.value`。en は plural）、`{days}`（`task.week`）、`{nextLevel}`、`{desc}`（`task.exhausted.next`、`.seenNext`、`.advance`）。r7 の合計は 170 キー（146 + 28 − 4。一覧は 6.1）。

| キー | 日本語 | 英語 | 使う場所 |
|---|---|---|---|
| app.name | 今日の一手 | 今日の一手 | ヘッダー。英語表示でも「今日の一手」のまま（Takuma の決定 D3、2026-10-30。ローマ字や英語名は置かない） |
| app.loading | 読み込んでいます | Loading | S0（1 秒後。HTML に「読み込んでいます / Loading」と日英を併記：tech-lead r1 P2） |
| app.noscript | このページは JavaScript が必要です。ブラウザの設定で JavaScript を有効にしてください。 | This page needs JavaScript. Turn on JavaScript in your browser settings. | S0（HTML に日英を併記：tech-lead r1 P2） |
| nav.history | 履歴 | History | ヘッダー |
| nav.settings | 設定 | Settings | ヘッダー |
| error.app.message | 保存データを読めませんでした。 | Saved data could not be read. | S0 error |
| error.app.detail | このブラウザに保存された「今日の一手」のデータが、壊れているか、この版では読めない形です。再読み込みしても直らない場合は、データをファイルに保存してから削除し、最初からやり直してください。 | The data saved in this browser is damaged or in a format this version cannot read. If reloading does not fix it, save the data to a file, delete it, and start over. | S0 error |
| error.app.reload | 再読み込み | Reload | S0 error（主操作） |
| error.app.exportRaw | 壊れたデータをファイルに保存 | Save the damaged data to a file | S0 error |
| error.app.delete | すべてのデータを削除 | Delete all data | S0 error（確認あり） |
| error.app.storageUnavailable.message | このブラウザでは保存を使えません。 | Storage is not available in this browser. | S0 error（保存先が使えない。h1） |
| error.app.storageUnavailable.detail | ブラウザの設定で、このサイトのデータの保存（Cookie とサイトデータ）が止められています。保存を許可してから再読み込みしてください。プライベートブラウズでも起きることがあります。 | Your browser settings block this site from saving data (cookies and site data). Allow it, then reload. This can also happen in private browsing. | S0 error（保存先が使えない） |
| diagnosis.start.title | 3 問に答えると、今日の学習が 1 つ出ます | Answer 3 questions to get today's task | S1 h1 |
| diagnosis.start.lead.1 | コードを書いたことがない人から現役のエンジニアまで使えます。15 分（初級は 10 分）で終わる課題が毎日 1 つ出て、やりたい日は続けて進めます。 | For anyone from first-time coders to working engineers. A task that takes 15 minutes (10 for Beginner) comes every day, and you can keep going on days you want to. | S1（r7 で差し替え。D-41。PRD の E-21） |
| diagnosis.start.lead.2 | 登録はありません。入力したデータはこのブラウザの中だけに保存され、外には送りません。 | No sign-up. Your data stays in this browser and is never sent anywhere. | S1 |
| diagnosis.start.lead.3 | 難しすぎ・簡単すぎの申告が 2 回続くと、次の課題から段階が変わります。 | Report a task as too hard or too easy twice in a row, and the level changes from the next task. | S1（r7：「次の日から」→「次の課題から」。PRD 11） |
| diagnosis.start.begin | 診断を始める | Start | S1 主操作 |
| home.standalone.import | 別のブラウザで入力したデータは、自動では引き継がれません。書き出したファイルがあれば、ここで読み込めます。 | Data entered in another browser is not carried over automatically. If you exported a file, you can import it here. | S1（スタンドアロン） |
| home.standalone.importButton | ファイルを読み込む | Import a file | S1（スタンドアロン） |
| home.addToHomeScreen.title | ホーム画面に追加してから始めることをおすすめします | We recommend adding this to your Home Screen before you start | S1、S8 |
| home.addToHomeScreen.why | Safari は 7 日間使わないと、このサイトの保存データを消すことがあります。ホーム画面に追加した「今日の一手」は、この対象になりません。 | Safari may delete this site's saved data after 7 days without use. A Home Screen copy of 今日の一手 is not affected. | S1、S8 |
| home.addToHomeScreen.steps.1 | 画面の下（iPad では上）の共有ボタンを押します。 | Tap the Share button at the bottom of the screen (top on iPad). | S1、S8（ol） |
| home.addToHomeScreen.steps.2 | 「ホーム画面に追加」を選び、「追加」を押します。 | Choose "Add to Home Screen", then tap "Add". | S1、S8（ol） |
| home.addToHomeScreen.steps.3 | ホーム画面の「今日の一手」を開いて、診断を始めます。 | Open 今日の一手 from your Home Screen and start the diagnosis. | S1、S8（ol） |
| home.addToHomeScreen.steps.4 | すでに Safari で診断した場合：Safari のデータは引き継がれません。Safari の「設定」で「ファイルに書き出す」を押し、ホーム画面の「今日の一手」の「設定」で「ファイルを読み込む」を押してください。 | If you already did the diagnosis in Safari: Safari's data is not carried over. In Safari, open Settings and tap "Export to a file"; then in the Home Screen copy, open Settings and tap "Import a file". | S1、S8（ol） |
| home.addToHomeScreen.close | 閉じる | Close | S1、S8 |
| diagnosis.progress | 質問 {n} / {total} | Question {n} of {total} | S2 |
| diagnosis.q1.legend | 伸ばしたい領域を 1 つ選んでください | Choose one area you want to grow in | S2 |
| diagnosis.q2.legend | {area}の今の段階に近いものを選んでください | Choose the level closest to where you are in {area} | S2 |
| diagnosis.q3.legend | コードを書いてきた年数に近いものを選んでください | How long have you been writing code? | S2（r7：「実務で」を外した。未経験も答えられる文に） |
| area.backend | バックエンド設計 | Backend design | S2、S3、S8 |
| area.frontend | フロントエンド | Frontend | 同上 |
| area.database | データベース | Databases | 同上 |
| area.infra | インフラとクラウド | Infrastructure and cloud | 同上 |
| area.testing | テストと品質 | Testing and quality | 同上 |
| area.git | Git とチーム開発 | Git and team development | 同上 |
| area.backend.desc | 画面の裏側で、データを受け渡す仕組み | Behind the screen, handling data | S2 q1 のヒント文（r7。AC-39：ja / en とも 1〜40 字。1 文、句点なし、リンクなし、専門用語なし：D-41） |
| area.frontend.desc | ブラウザに映る画面と、その動き | The screen you see in the browser | 同上 |
| area.database.desc | データのしまい方と、取り出し方 | How data is stored and looked up | 同上 |
| area.infra.desc | アプリを動かす土台（サーバーや設定） | Machines and settings that run an app | 同上 |
| area.testing.desc | 正しく動くかを確かめ、壊れにくくする方法 | Checking that code works, now and later | 同上 |
| area.git.desc | 変更の記録と、ほかの人との共同作業 | Tracking changes and working as a team | 同上 |
| level.beginner | 初級 | Beginner | S2、S3、S8 |
| level.beginner.desc | コードをほとんど書いたことがない | Little or no experience writing code | S2、S7（`task.exhausted.next` の {desc}）。r7 で PRD 9 の趣旨に書き直した（Q12 の A。初級＝未経験）。主語を置かず、S7 の文に差し込んでも読める形 |
| level.intermediate | 中級 | Intermediate | S2、S3、S8 |
| level.intermediate.desc | 仕事や学習でコードを書いている（人に聞きながらでもよい） | Writing code at work or for study, with help when needed | S2、S7。r7 で広げた（旧初級と旧中級を含む） |
| level.advanced | 上級 | Advanced | S2、S3、S8 |
| level.advanced.desc | 設計を決め、人に教えている | Making design decisions and teaching others | S2、S7（英語だけ r7 で主語を外した） |
| years.never | まだコードを書いたことがない | I have not written code yet | S2（3 問目の先頭。r7。AC-40。`value` は未経験の ID：6.1） |
| years.lt1 | 1 年未満 | Less than 1 year | S2 |
| years.1to3 | 1〜3 年 | 1 to 3 years | S2 |
| years.3to5 | 3〜5 年 | 3 to 5 years | S2 |
| years.gte5 | 5 年以上 | 5 years or more | S2 |
| diagnosis.next | 次へ | Next | S2 主操作 |
| diagnosis.finish | 診断を終える | Finish | S2 主操作（3 問目） |
| diagnosis.back | 前の質問へ | Back | S2 |
| diagnosis.cancel | やめる | Cancel | S2（やり直しのときだけ。S8 から入ったら S8、S7 から入ったら S7 に戻る） |
| error.diagnosis.required | 選択肢を 1 つ選んでください。 | Choose one option. | S2 |
| error.storage.message | 保存できませんでした。入力はそのまま残っています。 | Could not save. Your input is still here. | S2、S3、S4、ダイアログ `settings.import.confirm`（S8 の書き出しと削除では起きない：5） |
| error.storage.retry | もう一度保存する | Save again | 同上 |
| task.dayChanged | 日付が変わったため、直前の操作は無効になりました。前の課題は履歴にあります。 | The date changed, so your last action was not applied. The previous task is in your history. | S3、S7（操作で日付をまたいだときだけ。`role="status"`、color.warning。D-30） |
| task.today.label | 今日の課題 {date} | Today's task {date} | S3（その日の 1 件目） |
| task.today.label.nth | 今日 {nth} 件目の課題 {date} | Task {nth} today, {date} | S3（同じ日の 2 件目以降。`task.today.label` と同じ位置。r7。D-37） |
| task.progress | この段階の {index} / {total} 件目 | Task {index} of {total} at this level | S3（h1 の前。text.small。r7。AC-36。D-37） |
| task.meta | {area} / {level} / 所要時間 {minutes} 分 | {area} / {level} / {minutes, plural, one {# minute} other {# minutes}} | S3 |
| task.external.badge | 外で行う | Outside the browser | S3（external） |
| task.external.tools.label | 要る道具 | Tools you need | S3（external、dt） |
| task.why | なぜ今これか | Why this, now | S3 h2 |
| task.how | やり方 | How to do it | S3 h2 |
| task.goal | 完了の目安 | What done looks like | S3 h2 |
| task.answer.label | 答え（任意） | Your answer (optional) | S3 label |
| task.answer.help | 採点はしません。入力は自動で保存され、今日中なら開き直しても残ります。 | Not graded. Saved automatically; it stays if you come back today. | S3 |
| task.answer.saved | 保存しました | Saved | S3 status |
| task.answer.limit | 上限の {max} 文字に達しました。 | You have reached the limit of {max} characters. | S3（`role="status"`。color.warning：D-32） |
| task.report.note | 申告すると、この課題は履歴に移ります。続けるかどうかは、その後に選べます。 | After you report, this task moves to your history. You can choose whether to continue afterwards. | S3（r7 で差し替え。FB-2） |
| task.report.done | 完了 | Done | S3 主操作 |
| task.report.tooHard | 難しすぎ | Too hard | S3 |
| task.report.tooEasy | 簡単すぎ | Too easy | S3 |
| task.report.noTime | 今日はできない | Not today | S3 |
| task.rate.title | 完了しました | Done | S4 h1 |
| task.rate.question | この課題は役に立ちましたか | Was this task useful? | S4 |
| task.rate.helpful | 役に立った | Useful | S4 |
| task.rate.notHelpful | 立たなかった | Not useful | S4 |
| task.rate.close | 今回は答えない | Skip | S4 |
| task.total.label | これまでに完了した課題 | Completed so far | S4、S5、S7（text.small、color.text.secondary。r7。D-35） |
| task.total.value | {count} 件 | {count, plural, one {# task} other {# tasks}} | S4、S5、S7（text.title。要素は `data-stat-completed` を持つ。r7。AC-35） |
| task.cheer.default | 今日も前に進みました。 | You moved forward today. | S4、S5 の `task.cheer`（累計が 7、30、100 以外。r7。D-36） |
| task.cheer.at7 | 7 件目を終えました。最初の節目です。 | Task 7 done. That is the first milestone. | S4、S5 の `task.cheer`（累計が 7。r7。AC-35） |
| task.cheer.at30 | 30 件目を終えました。2 つ目の節目です。 | Task 30 done. That is the second milestone. | S4、S5 の `task.cheer`（累計が 30） |
| task.cheer.at100 | 100 件目を終えました。最後の節目です。 | Task 100 done. That is the last milestone. | S4、S5 の `task.cheer`（累計が 100。節目は 3 つだけなので「最後」と言い切る：正直） |
| task.insight | ひとこと解説 | Insight | S4、S5 h2（r7。本文 `task.insight.text` は課題集から。AC-38。D-38） |
| task.done.title | 完了を記録しました | Completion saved | S5 h1（r7 で差し替え。「今日の一手は終わりです」は FB-2 で成り立たなくなった） |
| task.done.task | 完了した課題：{title} | Completed: {title} | S5 |
| task.week | 今週（月曜から）の完了日数：{days} 日 | Days completed this week (from Monday): {days} | S5（要素は `data-stat-days-completed-week` を持つ。r7。AC-37。D-39。「月曜から」は省かない） |
| task.next.note | 明日も課題が 1 件出ます。続けるなら、次の一手に進めます。 | Another task comes tomorrow. If you want, you can go on to the next one now. | S5、S6（`task.next` の直前。r7。D-4） |
| task.next | 次の一手に進む | Start the next task | S5、S6（副操作の形のボタン。r7。AC-33） |
| task.done.history | 履歴を見る | View history | S5 リンク |
| task.skipped.title | 申告を記録しました | Report saved | S6 h1（r7 で差し替え） |
| task.skipped.levelHint | 同じ申告が 2 回続くと、次に出す課題から段階が変わります。 | If you give the same report twice in a row, the level changes from the next task. | S6（too_hard / too_easy。r7：「次の日から」→「次に出す課題から」） |
| task.skipped.history | 履歴を見る | View history | S6 リンク |
| task.exhausted.levelDone | {area}の{level}を修了しました | You completed {level} in {area} | S7 h1（levelDone。r7。AC-10。{level} は今の段階の `level.*`） |
| task.exhausted.levelDone.detail | この段階の {total} 件をすべて出し終えました。次の段階に進むと、その課題は今日から出ます。 | All {total, plural, one {# task} other {# tasks}} at this level have been issued. If you move up, the next level's tasks start today. | S7（levelDone。{total} は `data-progress-total` と同じ組の総数） |
| task.exhausted.next | 次の段階は{nextLevel}です。{desc} | The next level is {nextLevel}: {desc} | S7（levelDone。{nextLevel} は次の段階の `level.*`、{desc} はその `level.*.desc`。D-40） |
| task.exhausted.seenNext | {nextLevel}の課題は、前に出したものを除いて続きます。難しいときは、別の領域を選ぶこともできます。 | {nextLevel} continues with the tasks you have not seen yet. If it is too hard, you can also choose another area. | S7（levelDone。履歴に同じ領域で次の段階の行があるときだけ。「難しすぎ」2 回で下がった先を出し終えた場合に当たる：tech-lead G0 r3 の提案 4。D-40） |
| task.exhausted.advance | {nextLevel}に進む | Move up to {nextLevel} | S7 主操作（levelDone だけ。r7。AC-10） |
| task.exhausted.allDone | {area}の上級を修了しました | You completed Advanced in {area} | S7 h1（allDone。r7。AC-10） |
| task.exhausted.allDone.detail | 上級の課題 {total} 件をすべて出し終えました。上級の新しい課題は次の版で足します。それまでは、別の領域を選べます（診断のやり直しで、同じ領域の別の段階も選べます）。 | All {total, plural, one {# Advanced task has} other {# Advanced tasks have}} been issued. New Advanced tasks will be added in the next version. Until then, you can choose another area (redoing the diagnosis also lets you pick another level in the same area). | S7（allDone） |
| task.exhausted.redo | 別の領域を選ぶ | Choose another area | S7（levelDone では副操作、allDone では主操作。操作と識別子は r6 までの「診断をやり直す」と同じ：S2 へ。文言だけ r7 で差し替え。AC-10） |
| settings.title | 設定 | Settings | S8 h1 |
| settings.data.title | データ | Data | S8 h2 |
| settings.data.note | 入力したデータはこのブラウザの中だけに保存され、外には送りません。別のブラウザや端末に移すには、ファイルに書き出して読み込みます。 | Your data is stored only in this browser and never sent anywhere. To move it to another browser or device, export it to a file and import it there. | S8 |
| settings.storage.notPersisted | このブラウザは保存の永続化を許可しませんでした。しばらく使わないとデータが消えることがあります。ファイルに書き出しておいてください。 | This browser did not allow persistent storage. Your data may be deleted if you do not use the site for a while. Export it to a file to keep it. | S8（断られたとき。color.warning） |
| settings.export | ファイルに書き出す | Export to a file | S8 主操作 |
| settings.export.done | 書き出しました | Exported | S8 status |
| settings.import.note | 書き出したファイル（.json）を選びます。このブラウザのデータは、ファイルの内容に置き換わります。 | Choose an exported file (.json). The data in this browser will be replaced with the file's contents. | S8 |
| settings.import | ファイルを読み込む | Import a file | S8（見えるボタン。保存データがないときは主操作の形） |
| error.import.message | このファイルは読み込めませんでした。このブラウザのデータは変わっていません。 | This file could not be imported. The data in this browser has not changed. | S8、S1 |
| error.import.reason.version | ファイルの形式がこの版より新しいです。「今日の一手」を再読み込みして最新の版にしてから、もう一度読み込んでください。 | The file format is newer than this version. Reload 今日の一手 to get the latest version, then try again. | S8、S1 |
| error.import.reason.schema | 「今日の一手」が書き出したファイルではないか、内容が壊れています。「ファイルに書き出す」で作った .json ファイルを選んでください。 | This is not a file exported by 今日の一手, or its contents are damaged. Choose a .json file created with "Export to a file". | S8、S1 |
| settings.import.confirm.title | ファイルの内容で置き換えますか | Replace your data with this file? | ダイアログ |
| settings.import.confirm.summary | ファイルの中身：履歴 {count} 件、初めて開いた日 {date} | In the file: {count, plural, one {# history entry} other {# history entries}}, first opened on {date} | ダイアログ |
| settings.import.confirm.body | このブラウザの診断の回答、履歴、答えは、ファイルの内容に置き換わります（結合はしません）。この操作は元に戻せません。 | Your diagnosis answers, history, and written answers in this browser will be replaced by the file's contents (not merged). This cannot be undone. | ダイアログ |
| settings.import.confirm.ok | 置き換える | Replace | ダイアログ |
| settings.import.confirm.cancel | やめる | Cancel | ダイアログ |
| settings.diagnosis.title | 診断 | Diagnosis | S8 h2 |
| settings.diagnosis.current | いまの領域：{area}、段階：{level} | Current area: {area}, level: {level} | S8 |
| settings.redo | 診断をやり直す | Redo the diagnosis | S8 |
| settings.redo.note | まだ申告していない今日の課題はそのまま残り、新しい診断は次に出す課題から効きます。申告した後にやり直すと、新しい診断の課題が今日のうちに出ます。履歴は残ります。 | A task you have not reported yet stays as it is; the new diagnosis applies from the next task issued. If you redo it after reporting, a task for the new diagnosis is issued today. Your history is kept. | S8（r7 で差し替え。PRD 11「診断のやり直し」） |
| settings.homeScreen.title | ホーム画面 | Home Screen | S8 h2（iOS の Safari） |
| settings.homeScreen.open | ホーム画面に追加する手順を見る | Show how to add to the Home Screen | S8 |
| settings.records.title | 記録 | Records | S8 h2 |
| settings.stats.open | 統計を見る | View stats | S8 |
| settings.history.open | 履歴を見る | View history | S8 |
| settings.delete.title | 削除 | Delete | S8 h2 |
| settings.delete | すべてのデータを削除 | Delete all data | S8（取り消せない操作） |
| settings.delete.confirm.title | すべてのデータを削除しますか | Delete all data? | ダイアログ |
| settings.delete.confirm.body | 診断の回答、履歴、答えがこのブラウザから消え、最初の画面に戻ります。この操作は元に戻せません。先に「ファイルに書き出す」で残しておくこともできます。 | Your diagnosis answers, history, and written answers will be removed from this browser, and you will return to the first screen. This cannot be undone. You can keep a copy first with "Export to a file". | ダイアログ |
| settings.delete.confirm.ok | 削除する | Delete | ダイアログ |
| settings.delete.confirm.cancel | やめる | Cancel | ダイアログ |
| settings.version | 版 {version} | Version {version} | S8 末尾 |
| settings.privacy | プライバシーについて | Privacy | S8 リンク（URL は 10） |
| settings.stats.title | 統計 | Stats | S9 h1 |
| settings.stats.today | 今日 {date} | Today {date} | S9 |
| settings.stats.firstOpenDate | 初めて開いた日 | First opened | S9 dt（値は契約 data.md 2 の `firstOpenDate`＝初回の診断の 1 問目を確定した日。文言は PRD 13 の指標の語のまま変えない：10 の「決まったこと」r3） |
| settings.stats.issued | 出した課題の件数 | Tasks issued | S9 dt |
| settings.stats.completed | 完了した件数 | Tasks completed | S9 dt |
| settings.stats.firstDayCompleted | 初めて開いた日に完了したか | Completed a task on the first day | S9 dt |
| settings.stats.firstDayCompleted.yes | 完了した | Yes | S9 dd |
| settings.stats.firstDayCompleted.no | 完了していない | No | S9 dd |
| settings.stats.daysCompleted7d | 直近 7 日に完了した日数 | Days with a completed task in the last 7 days | S9 dt |
| settings.stats.daysCompletedWeek | 今週（月曜から）の完了日数 | Days completed this week (from Monday) | S9 dt（r7。AC-24、AC-37。値は `data-stat-days-completed-week`。D-42） |
| settings.stats.extraCompleted | 同じ日の 2 件目以降の完了件数 | Completed as the 2nd task or later in a day | S9 dt（r7。AC-24。値は `data-stat-extra-completed`。PRD 13 の入力指標 5） |
| settings.stats.helpful | 「役に立った」の件数 | Rated useful | S9 dt |
| settings.stats.rated | 「役に立ったか」に答えた件数 | Rated (useful or not) | S9 dt |
| settings.stats.tooHard | 「難しすぎ」の件数 | Reported too hard | S9 dt |
| settings.stats.noTime | 「今日はできない」の件数 | Reported not today | S9 dt |
| settings.stats.note | この値は、このブラウザの記録から計算しています。外には送りません。報告するときは、この画面のスクリーンショットを送ってください。 | These values are calculated from the records in this browser and never sent anywhere. To report them, send a screenshot of this screen. | S9 |
| settings.stats.back | 設定に戻る | Back to settings | S9 リンク |
| history.title | 履歴 | History | S10 h1 |
| history.empty | まだ履歴はありません。課題を申告すると、ここに残ります。 | No history yet. Tasks you report will appear here. | S10 |
| history.empty.action | 今日の課題へ | Go to today's task | S10 主操作 |
| history.row.answer | 答えを見る | Show answer | S10 summary |
| report.done | 完了 | Done | S10 |
| report.tooHard | 難しすぎ | Too hard | S10 |
| report.tooEasy | 簡単すぎ | Too easy | S10 |
| report.noTime | 今日はできない | Not today | S10 |
| report.none | 申告なし | Not reported | S10（日付が変わった課題） |
| helpful.yes | 役に立った | Useful | S10 |
| helpful.no | 立たなかった | Not useful | S10 |
| helpful.unanswered | 未回答 | Not rated | S10 |

権限と確認の求め方：
- 保存の永続化（`navigator.storage.persist()`）：画面で理由を説明する事前の画面は置かない。初めて S3 を表示した直後に 1 回だけ呼ぶ（PRD 11 の冒頭）。ブラウザは多くの場合に確認を出さずに決める。S8 を出すたびに `navigator.storage.persisted()` で今の状態を読み、永続でなければ `settings.storage.notPersisted` と「ファイルに書き出す」を置き、報酬で釣らない（D-31）。後の日に求め直さない（U-14 で決定。契約 data.md 11）。
- ファイルの読み込み：見えるボタンが隠した `<input type="file">` の `click()` を呼び、ブラウザ標準の選択ダイアログだけを使う（9）。取り消したら何もしない。
- 通知、位置情報、カメラ：使わない。

## 8. 見た目
- 使うトークン（色、文字、余白）：design/tokens.md のすべて。色は color.bg、color.text、color.text.secondary、color.action.primary、color.action.onPrimary、color.border、color.focus、color.success、color.warning、color.error の 10 個だけ。文字は text.title、text.heading、text.body、text.small。余白は space.1〜space.6。r7 で足した要素の文字：`task.total.value` は text.title（見出し以外で唯一。D-35）、`task.total.label`、`task.progress`、`task.today.label.nth`、ヒント文 `area.*.desc` と説明 `level.*.desc` は text.small、`task.cheer`、`task.insight.text`、`task.week`、`task.next.note`、`task.exhausted.*.detail`、`task.exhausted.next`、`task.exhausted.seenNext` は text.body、`task.insight` は text.heading。1 画面の段は S4 / S5 / S7 で text.title、text.heading、text.body、text.small の 4 つ（B-4 の上限）。
- 新しく足すトークン：なし（r7 でも足さない。累計の大きさに新しい text style を足す案は B-4 の 4 段を超えるので退け、text.title を使う：D-35、10 の U-18）。tokens.md はこの機能で初版で、意味の名前と、ライト、ダーク、上げる（ライト、ダーク）の値は tokens.md の 1 にあり、比は 9 の表。r7 では tokens.md 2 の text.title の「使う所」に累計の値を足しただけで、値は変えていない。
- 使う SF Symbols の名前：なし。Web アプリでアイコンを 0 個にした（D-20）。印、状態、閉じるはすべて文字。
- 画面の並び（縦の線）：全画面で本文の列を size.content.max（640 px）に収めて中央に置き、要素の見える左端を列の左の線にそろえる（B-3）。「見える左端」は、文字の要素では文字の左端、枠のあるボタンと入力欄と案内では枠の左端、`<summary>` では開閉の印。内側の余白を持つ単独のリンクと `<summary>` は、その分を負の margin で戻してそろえる（tokens 4「リンク」「開閉」。design-reviewer G3 r1 の 4）。ボタンの幅の規則（幅 480 px 未満は列いっぱい）は、どの入れ物の中でも同じ（tokens 4。design-reviewer G3 r1 の 5）。案内（`home.addToHomeScreen`、`home.standalone`）だけは四方を 1 px の枠で囲み、枠の左端を列の線にそろえ、中の要素は枠の内側 space.4 の線にそろえる（D-33）。左右の余白は space.4（幅 600 px 未満）か space.5。題名の上は space.6、節の間は space.5、段落の間は space.4、ボタンの間は space.3、ラベルと入力欄の間は space.2。
- 性格語が表れている場所（調査 5）：
  - ひとつ：S3 で画面に課題が 1 件だけあり、一覧も地図もない（進み具合は「この段階の n / N 件目」の文字 1 行だけ：D-37）。ヘッダーの nav はリンク 2 つだけ。S5 / S6 に次の課題の題名を出さず、「次の一手に進む」は 1 ボタン（D-4）。
  - 静か：地が 1 色で、カード、影、グラデーション、アイコン、絵文字がない（tokens 1、D-20）。動きは不透明度の 150 ms だけ（D-13）。色が付く所は次の一覧がすべて（design-reviewer r1 の 9）。
    - color.action.primary：主操作の塗り（`diagnosis.start.begin`、`diagnosis.next` / `.finish`、`task.report.done`、`task.exhausted.advance`（levelDone）、`task.exhausted.redo`（allDone のときだけ。levelDone では枠の副操作）、`settings.export`、保存データなしの S8 の `settings.import`、`history.empty.action`、`error.app.reload`）、リンクの文字、radio の `accent-color`。color.focus（同じ値）はフォーカスの枠。
    - color.success：`task.answer.saved`、`settings.export.done`。
    - color.warning：`settings.storage.notPersisted`、`home.addToHomeScreen.title`（案内の h2）、`task.answer.limit`（D-32）、`task.dayChanged`（D-30）。
    - color.error：エラーの文（`error.*`）とエラーのときの入力欄の枠、取り消せない操作のボタンの枠と文字（`settings.delete`、`error.app.delete`、`settings.delete.confirm.ok`、`settings.import.confirm.ok`）。
    - color.overlay：ダイアログの `::backdrop`。
    - これ以外は color.bg、color.text、color.text.secondary、color.border だけ。ホバーと押した瞬間も新しい色を足さない（tokens 4、D-28）。
  - 正直：S1 の `diagnosis.start.lead.2`（外に送らない）と `.3`（段階が変わる規則）、S7 の `task.exhausted.levelDone.detail` / `.allDone.detail`（すべて出し終えたと言い切り、上級の新しい課題は次の版と言う）と `task.exhausted.seenNext`（戻る先を隠さない）、`task.cheer.at100`（最後の節目と言い切る）、`task.next.note`（明日も 1 件出る。続けるかは本人）、`home.standalone.import`（引き継がれない）、`settings.delete.confirm.body`（元に戻せない）、S9 の `settings.stats.note`（計算の出どころ）。
  - 手早い：S3 は開いて操作 0 回で題名が h1（AC-31）。S2 は 1 画面 1 問で確定は 1 ボタン。ボタンの文言はすべて動詞か 2〜6 文字の名詞（完了、次へ、閉じる）。「次の一手に進む」は S5 / S6 から 1 タップで次の S3（AC-33 の 1 秒以内、同期）。
  - 手応え（r7 で足した。調査 5）：S4 と S5 の `task.total`（累計の数字が text.title で 1 行）、`task.cheer`（事実の 1 文。節目だけ文が変わる）、`task.insight`（その課題でいちばん大事な 1 文）。S3 の `task.progress`（この段階の n / N 件目）。S7 の h1「修了しました」と「{次の段階}に進む」。どれも文字だけで、色も動きも足さない（D-35、D-36）。
- 差をつける点が表れている場所（調査 6、6.1）：
  1. 課題そのものがホーム画面：S3 の初期表示。ヘッダー（アプリ名と nav）の直下に `task.today.label`、`task.progress`、h1 `task.today.title`、続けて `task.why`。読み込みが終わった瞬間に題名と「なぜ今これか」が最初の画面に入る（幅 320 px、文字 100% で、題名から「なぜ今これか」の 2 行目までが初期表示に収まるように、ヘッダーの高さを 56 px 以内にする。r7 で `task.progress` の 1 行（text.small、約 22 px）が増えたが、それでも収まる）。
  2. 終えた直後に、静かに返ってくる「手応え」（r7 で置き換え。調査 6.1）：S4 の h1「完了しました」の直後に `task.total`（累計が 1 増えている）と `task.cheer`、`task.insight`。紙吹雪も「Continue」の連鎖もなく、1 画面に収まる（D-34）。「次の一手に進む」は S5 / S6 の末尾に枠のボタン 1 つで、押さなければ `task.next.note` の「明日も課題が 1 件出ます」で終われる（D-4）。決定的な瞬間は「『完了』を押した 0.5 秒後に、その課題でいちばん大事な 1 文が読め、累計が 1 増えている」こと。
- ホーム画面のアイコンと manifest（D-29。tech-lead r1 P4 → U-13 → Takuma の決定 D5、2026-10-30。実際の PNG と manifest は backend-engineer が作る）：
  - ファイルと置き場所：アイコンは配布物のルートの `./icon-180.png`（元は backend/public/icon-180.png：ADR 0001 の表）、manifest は `./manifest.webmanifest`。どちらも service-worker.md の 3 の FILES に入れ、budgets.md の 1 の枠（アイコンと manifest で gzip 後 4,000 バイト。2026-11-04 に 10,000 から下げた。実物は 2 つで 2,173）に数える。CSP は `img-src 'self'` と `manifest-src 'self'` で足りる（budgets.md の 3）。
  - HTML の `<head>`（契約 budgets.md の 6 の 5 行と同じ。URL はすべて相対：budgets.md の 4）：`<title>今日の一手</title>`、`<meta name="apple-mobile-web-app-title" content="今日の一手">`、`<meta name="apple-mobile-web-app-capable" content="yes">`、`<link rel="apple-touch-icon" href="./icon-180.png">`、`<link rel="manifest" href="./manifest.webmanifest">`。`<title>` と `apple-mobile-web-app-title` の値は文言 `app.name`（ja と en で同じ「今日の一手」。D3）で、ホーム画面に置いたときの名前がアイコンの下に出る。`apple-mobile-web-app-capable` は R-24 の作法どおり（AC-22 のスタンドアロンの判定に要る）。`apple-mobile-web-app-title` は Apple の公式の文書で確かめていない（budgets.md の 6 の注のとおり。効かなくても `<title>` と manifest の `name` が同じ値なので結果は同じ）。
  - アイコンの形：
    - 寸法：180 × 180 px、PNG、1 枚だけ（iOS は manifest の `icons` を使わず `apple-touch-icon` を読む：R-24。167 × 167 の iPad 用は置かず、iOS に縮小させる）。大きさは生で 4,000 バイト以下（budgets.md の 6。2 色の PNG なので 2 KB 前後の想定。G2 r3 の実物は 2,107 バイト）。
    - 色：地は color.bg のライトの値（#FFFFFF）1 色で全面。字は color.text のライトの値（#1F1F1F）。比は 16.48:1（9 の表の「color.text on color.bg」ライトの組と同じ）。この 2 色以外は使わない。影、枠、グラデーション、角丸は描かない（角丸は iOS が付ける。B-2）。ダークモードの別版は作らない（iOS のホーム画面のアイコンは 1 枚で、ホーム画面が暗くても白いタイルは読める）。
    - 文字：「一」1 字（U+4E00）。アプリ名「今日の一手」の 1 字で、性格語「ひとつ」（1 日 1 つ）をそのまま表す。画面の中のアイコン 0 個（D-20）とは別で、これは OS のホーム画面に置く「名札」。
    - 書体：tokens 2 と同じシステムの sans-serif（作る環境では Hiragino Sans、太さ 700。`font-family: system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif`）。字の横幅がアイコンの幅の 60%（108 px。±4 px の誤差は可）になる大きさにし、字の箱の中心をアイコンの中心（90, 90）に置く。横棒の太さは書体の 700 のまま（約 12〜18 px）で、太らせない。
    - 作り方（backend-engineer。1 行）：依存に既にある Playwright の Chromium で、`<body>` を 180 × 180 px・地 #FFFFFF・中央に「一」だけの HTML（上の書体と色。`deviceScaleFactor: 1`）を `page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 180, height: 180 } })` で PNG にし、`node scripts/check-budget.mjs` で 4,000 バイト以下を確かめる。
  - manifest（`./manifest.webmanifest`、`Content-Type: application/manifest+json`）の項目はこの 7 つだけ：

    | 項目 | 値 | 理由 |
    |---|---|---|
    | `name` | 今日の一手 | D3（英語でも同じ名前）。英語版の manifest は作らない |
    | `short_name` | 今日の一手 | 5 字なので `name` と同じ |
    | `lang` | ja | 名前が日本語のため |
    | `start_url` | ./ | 相対（budgets.md の 4）。クエリは付けない（D6：記録しない） |
    | `scope` | ./ | SW の scope と同じ（service-worker.md の 1） |
    | `display` | standalone | AC-22 の `display-mode: standalone`。Android の Chrome もここでスタンドアロンになる |
    | `icons` | `[{ "src": "./icon-180.png", "sizes": "180x180", "type": "image/png" }]` | 同じ PNG 1 枚。他の寸法は置かない（150 KB の枠と B-2） |

    `theme_color` と `background_color` は置かない。置くとライトの地の色が Android の起動画面とツールバーに固定され、ダークモード（tokens 1）と合わなくなるため。`description` も置かない（ストアに載せないので読む人がいない）。
  - 置くと変わること：Android の Chrome も「ホーム画面に追加」でスタンドアロンになり、S1 の `home.standalone.import` が出る（AC-22 の判定 `display-mode: standalone` に含まれる）。
- 参考にした原則のページ（URL、2026-10-30 確認）：https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html 、https://www.w3.org/WAI/WCAG22/Understanding/on-input.html 、https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html 、https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html 、https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html 、https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html 、https://www.w3.org/WAI/ARIA/apg/patterns/alert/ 、https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/ 、https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast 、https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors 、https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details 、https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file（ファイルの読み込みの部品。D-27）、https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html（D-27）。調査にある R-14〜R-26 の URL も使う。r7 で足した原則のページ（調査 r2 の R-32〜R-65。2026-11-05 確認）：HIG Motion https://developer.apple.com/design/human-interface-guidelines/motion 、HIG Feedback https://developer.apple.com/design/human-interface-guidelines/feedback 、HIG Writing https://developer.apple.com/design/human-interface-guidelines/writing 、HIG Progress indicators https://developer.apple.com/design/human-interface-guidelines/progress-indicators 、HIG Onboarding https://developer.apple.com/design/human-interface-guidelines/onboarding （いずれも本文は Apple のドキュメント配信用 JSON から取り出した：調査 8 の末尾）、WCAG 2.2 SC 2.3.3 https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html 、SC 2.2.2 https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html 、GOV.UK Confirmation pages https://design-system.service.gov.uk/patterns/confirmation-pages/ 、GOV.UK Radios https://design-system.service.gov.uk/components/radios/ 、NN/g Progressive disclosure https://www.nngroup.com/articles/progressive-disclosure/ 、NN/g Plain language https://www.nngroup.com/articles/plain-language-experts/ 、Deceptive Patterns https://www.deceptive.design/types/nagging 。r1 では HIG の本文が取れなかったが、r2 で 6 ページを JSON 経路で引用した。

## 9. アクセシビリティ
- いちばん大きい文字（ブラウザの拡大 200%、幅 320 CSS px、OS の文字サイズ最大）で並びを変える場所：
  - ヘッダー：アプリ名と nav のリンク 2 つは `flex-wrap` で、入らなければ nav が 2 行目に落ちる。
  - S3 の `task.meta`：1 行の文として折り返す（横並びの 3 列にしない）。申告の副操作 3 つは `flex-wrap` で、幅 480 px 未満と拡大時は 1 列に 1 つずつ縦に積む。主操作「完了」は常に列いっぱい。`task.today.label`（または `.nth`）と `task.progress` は別の行（横に並べない）。
  - S2 の radio：選択肢の名前とヒント文（`area.*.desc`、`level.*.desc`）は同じ `<label>` の中で縦に積む（名前の下にヒント文。横に並べない）。ラベルは radio の右に置き、折り返す。
  - S4 / S5 / S7 の累計 `task.total`：ラベル（text.small）と値（text.title）は 1 行に並べてよいが（`flex-wrap`、間は space.2、下端をそろえる）、入らなければ値が 2 行目に落ちる。値を切らない。
  - S5 / S6 の `task.next`：常に列いっぱい（幅 480 px 未満）。`task.next.note` はその上の段落。S7 の 2 ボタン（`advance`、`redo`）は縦に積む（横に並べない）。
  - S3 の `task.external.tools`：`<dt>` と `<dd>` を常に縦に積む。
  - S9 の `<dl>`：`<dt>` と `<dd>` を常に縦に積む（横並びの表にしない）。
  - S10 の行：日付、題名、申告、評価を縦に積む（横並びにしない）。
  - ダイアログ：幅は min(列の幅, 480 px)。ボタン 2 つは縦に積む（「やめる」が下）。
  - すべての要素の高さを固定しない（WCAG 2.2 SC 1.4.12 の行間 1.5、段落間 2 倍の上書きでも切れない）。
- 色だけで区別していないか：外で行う印は文字「外で行う」と枠。保存の知らせは文字「保存しました」。上限と日付が変わった知らせは文字（color.warning は添えるだけ）。エラーは文字と `role="alert"`。リンクは下線。radio の選択はネイティブの印。主操作と副操作は塗りと枠の違いに加えて文言で区別する（WCAG 2.2 SC 1.4.1）。節目の祝いは文が変わるだけで、色は変えない（D-36）。累計の大きさは文字の大きさだけで伝え、`task.total.label` が意味を文字で言う（R-34）。
- 動きを減らす設定、透明度を下げる設定のとき：`prefers-reduced-motion: reduce` で不透明度の変化を 0 ms にする（知らせは即時に出る）。S4 / S5 / S7 の累計、祝い、解説、修了には動きがそもそもないので、設定の有無で見た目は変わらない（D-36）。半透明はダイアログの `::backdrop` だけで、`prefers-reduced-transparency: reduce` では不透明の color.bg と同じ地に枠線の見た目にする。`prefers-contrast: more` では tokens の「上げる」の値。`forced-colors: active` ではシステム色に任せ、印とボタンの枠、リンクの下線で意味を保つ（D-25）。
- VoiceOver（TalkBack、NVDA）の読み上げ順：DOM の順＝見た目の順。
  - S1：`<header>`（アプリ名 → 設定）→ `<main>`：h1 → 説明 3 段落 →（スタンドアロンの案内：文 → 読み込むボタン。隠した input は読み上げの順に入らない）→（ホーム画面の案内：見出し → 理由 → 手順 1〜4 → 閉じる）→ 診断を始める。
  - S2：ヘッダー → 進み具合「質問 1 / 3」→ `<legend>` → 選択肢（radio のラベル。q1 は領域名とヒント文、q2 は段階名と説明を 1 つのラベルにする。R-54 のとおり、ラベル全体が 1 つの名前として読まれる）→（エラー）→ 次へ → 前の質問へ →（やめる）。質問が切り替わったら `<main>` の先頭（進み具合）にフォーカスを移す。
  - S3：ヘッダー（アプリ名 → 履歴 → 設定）→（日付が変わった知らせ `task.dayChanged`：操作で日付をまたいだときだけ。描いた直後にフォーカスがここへ移るので、最初に読まれる。D-30）→ 今日の課題と日付（2 件目以降は「今日 2 件目の課題 …」）→ この段階の n / N 件目 → h1 題名 → 領域 / 段階 / 所要時間 →（外で行う → 要る道具の一覧）→ h2 なぜ今これか → 本文 → h2 やり方 → 本文 → h2 完了の目安 → 本文 → ラベル「答え（任意）」+ 補助文 → textarea →（保存しました：フォーカスを奪わず `role="status"` で読む）→ 申告の注記 → 完了 → 難しすぎ → 簡単すぎ → 今日はできない。`task.next` で着いた S3 は h1 にフォーカスを移す（読み込みで着いた S3 はフォーカスを動かさない。AC-31）。
  - S4：ヘッダー → h1 完了しました → これまでに完了した課題 7 件 → 祝いの 1 文 → h2 ひとこと解説 → 解説の本文 → 問い → 役に立った → 立たなかった → 今回は答えない。状態が変わったら h1 にフォーカスを移す。累計と祝いは `role="status"` にしない（画面ごと差し替わり、h1 から順に読まれるため。二重に読ませない）。
  - S5：ヘッダー → h1 完了を記録しました → 完了した課題：題名 → これまでに完了した課題 7 件 → 祝いの 1 文 → h2 ひとこと解説 → 本文 → 今週（月曜から）の完了日数：3 日 → 明日も課題が 1 件出ます… → 次の一手に進む → 履歴を見る。S4 から来たら h1 にフォーカスを移す。
  - S6：ヘッダー → h1 申告を記録しました →（同じ申告が 2 回続くと…）→ 明日も課題が 1 件出ます… → 次の一手に進む → 履歴を見る。
  - S7（levelDone）：ヘッダー →（日付が変わった知らせ）→ h1 バックエンド設計の初級を修了しました → これまでに完了した課題 14 件 → この段階の 14 件をすべて出し終えました… → 次の段階は中級です。仕事や学習でコードを書いている… →（中級の課題は、前に出したものを除いて続きます…）→ 中級に進む → 別の領域を選ぶ。allDone：h1 → 累計 → 上級の課題 7 件をすべて出し終えました… → 別の領域を選ぶ。`task.next` や `task.exhausted.advance` で着いたら h1 にフォーカスを移す。
  - S8：ヘッダー → h1 設定 → データ（注記 →（注意）→ 書き出す →（書き出しました）→ 読み込みの注記 → 読み込む →（エラー））→ 診断 → ホーム画面 → 記録 → 削除 → 版 → プライバシー。ダイアログは開いたら「やめる」にフォーカス、閉じたら呼び出したボタンに戻す。保存データなしのとき：ヘッダー（アプリ名 → 設定）→ h1 設定 → データ（注記 → 読み込みの注記 → 読み込む →（エラー））→（ホーム画面）→ 版 → プライバシー。
  - ファイルの読み込みの部品（S1 と S8 で同じ型。D-27。design-reviewer r1 の 4）：見える `<button>`（`home.standalone.importButton` / `settings.import`）が、隠した `<input type="file" accept=".json,application/json">`（`home.standalone.importFile` / `settings.import.file`）の `click()` を呼ぶ。input は視覚的に隠す（`position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%)`。`display: none` と `visibility: hidden` にはしない：MDN の `<input type="file">` のページは、この 2 つを支援技術が「操作できない部品」と解釈するため見えない状態で残す例を示している。2026-10-30 確認。MDN の例は `<label>` を押し口にするが、label は Tab で止まらないので、この仕様では `<button>` と `click()` にする）。input に `tabindex="-1"` と `aria-hidden="true"` を付け、Tab 順と読み上げの順から外す。フォーカスは常にボタンにあり、`:focus-visible` の枠（3 px、color.focus）はボタンに出る（AC-18）。アクセシブルな名前は見えるボタンの文字「ファイルを読み込む」で、input には名前を付けない（読み上げの対象外）。input の `change` で検査を始め、失敗はボタンの直下に出す（D-24）。選択を取り消したら何も起きず、フォーカスはボタンのまま。テストは input の `data-testid` に setInputFiles する（`change` が発火する）。
  - 全画面で、見える文字がアクセシブルな名前の先頭に入る（WCAG 2.2 SC 2.5.3）。`aria-label` で見える文字と違う名前を付けない。
- 英語が長くなったとき（疑似言語の代わりに、英語の文言と、その 2 倍の長さの文字列で確かめる画面）：S3（申告の 4 ボタンと `task.meta`、`task.dayChanged` の 2 文、`task.progress`「Task 4 of 14 at this level」。英語「Not today」「Outside the browser」）、S2 の 1 問目（ヒント文の最長「Checking that code works, now and later」39 字と 2 問目の「Writing code at work or for study, with help when needed」56 字。幅 320 で折り返す：AC-39）、S5（「Days completed this week (from Monday): 3」、「Start the next task」、`task.total` の「7 tasks」）、S7（「Move up to Intermediate」、「Choose another area」、`task.exhausted.allDone.detail` の長文）、S8（設定の操作 7 つ。「Show how to add to the Home Screen」が最も長い）、S1（`home.addToHomeScreen.steps.4` の長文と「Import a file」）、S9（「Completed as the 2nd task or later in a day」）、ダイアログ（`settings.import.confirm.summary` の複数形）。どの画面もボタンの文字は折り返し可能（`white-space: normal`）で、幅は列いっぱいに広がるので切れない。
- 押せる範囲：`<button>`（r7 で足した `task.next`、`task.exhausted.advance` を含む）、radio の `<label>`（ヒント文を含めた全体）、`<summary>`、単独の `<a>`（ヘッダーのアプリ名 `app.name`、`nav.history`、`nav.settings`、`task.done.history`、`task.skipped.history`、`settings.stats.open`、`settings.history.open`、`settings.stats.back`、`settings.privacy`）は 44 × 44 CSS px 以上（tokens の size.target.min。リンクは `display: inline-block`、上下 space.3 の内側、`min-width: 44px`：tokens 4）。文中のリンクはこの機能にはない（`settings.privacy` も独立した行の単独のリンクとして扱う。design-reviewer r1 の 5）。ヘッダーの高さは nav のリンクとアプリ名（どちらも約 50 px：16 px × 1.6 + space.3 × 2 = 49.6 px）を入れても 56 px 以内（8 の差をつける点 1。design-reviewer r2 の 1）。
- キーボード：Tab 順は DOM 順。`<dialog>` はフォーカスを閉じ込め、Escape で閉じる。`<details>` は Enter / Space で開閉。radio は矢印で移動し Space で選ぶ（R-21）。フォーカスの枠は 3 px の `outline` と 2 px の `outline-offset`（AC-18 の 2 px 以上）。

コントラスト（WCAG 2.2 の式で計算。独自の色の組ごと。小数 3 桁目を四捨五入して 2 桁（design-reviewer r1 の 6）。基準は 16 px の文字が 4.5:1 以上、24 px 以上か 18.5 px 以上の太字の文字と操作部品の枠が 3:1 以上：R-14、R-15）
| 前景（文字、アイコン、枠）と背景の組 | ライト | ダーク | コントラストを上げる（ライト / ダーク） |
|---|---|---|---|
| color.text on color.bg（本文、見出し、印の文字と枠） | 16.48:1 | 15.29:1 | 21.00:1 / 21.00:1 |
| color.text.secondary on color.bg（日付、注記） | 7.00:1 | 8.93:1 | 13.58:1 / 15.91:1 |
| color.action.primary on color.bg（主操作の塗りと枠、リンクの文字） | 6.70:1 | 8.89:1 | 9.84:1 / 12.21:1 |
| color.action.onPrimary on color.action.primary（主操作の文字） | 6.70:1 | 8.24:1 | 9.84:1 / 12.21:1 |
| color.border on color.bg（副操作のボタン、入力欄の枠） | 5.33:1 | 5.57:1 | 21.00:1 / 21.00:1 |
| color.focus on color.bg（フォーカスの枠。offset 2 px で地と接する） | 6.70:1 | 8.89:1 | 9.84:1 / 12.21:1 |
| color.success on color.bg（保存しました） | 6.29:1 | 10.43:1 | 9.95:1 / 14.28:1 |
| color.warning on color.bg（永続化の注意） | 7.48:1 | 11.36:1 | 10.70:1 / 15.25:1 |
| color.error on color.bg（エラーの文字と枠、削除のボタン） | 6.57:1 | 7.84:1 | 9.39:1 / 11.83:1 |
| 押した瞬間（`:active`）の入れ替え：color.action.primary on color.action.onPrimary、color.bg on color.text、color.bg on color.error | 6.70:1、16.48:1、6.57:1 | 8.24:1、15.29:1、7.84:1 | 上の行と同じ組の入れ替えなので同じ値（9.84 / 21.00 / 9.39、12.21 / 21.00 / 11.83） |
| color.overlay（黒 50%）を color.bg に重ねた地と、ダイアログの地 color.bg | 3.95:1 | 1.06:1 | 3.95:1 / 1.00:1 |
| color.overlay を重ねた地と、ダイアログの枠 color.border | 1.35:1 | 5.92:1 | 5.32:1 / 21.00:1 |
| （上 2 行：どの設定でも、地の差か枠のどちらかで境目が 3:1 以上。design-reviewer r1 の 11） | | | |
| radio | システム色（`color-scheme` と `accent-color` に従う） | 同左 | 同左 |

## 10. 決まっていないこと
Takuma か tech-lead に決めてほしいこと。仕様はここに書いた暫定で進める。U-1〜U-4 と U-13 は r4 で、U-14 と U-15 は 2026-11-04 に決まった（下の「決まったこと」）。r7 で U-16〜U-19 を足した。番号は他の文書（docs/adr/features/001-daily-learning.md、docs/reviews/）が引くので欠番のまま残す。
- U-5（tech-lead、PRD にない挙動）：保存データが形式に合わないときの S0 の error 状態（`error.app.*`。再読み込み、壊れたデータのファイル保存、削除）と、保存先が使えないときの変種（`error.app.storageUnavailable.*`。tech-lead r1 P1）。PRD の 10 の「保存の方式を後から変えてデータを失う」の手当てとして置いたが、PRD の AC にはない。tech-lead r1 の確定案は「採る。error にする条件は JSON.parse の失敗、スキーマ不一致、formatVersion が新しい、localStorage の例外」。確定は ADR。
- U-6（tech-lead）：答えの欄の文字数の上限 `answer.max`（localStorage の容量の都合。`task.answer.limit` の {max}）。
- U-7（tech-lead）：診断のやり直し（S8 → S2）の保存の仕方。初回は質問ごとに保存する（AC-11）が、やり直しの途中で「やめる」を押したときに元の診断が壊れないよう、やり直しは下書きに保存して「診断を終える」で確定する作りを求める。PRD の「回答は質問ごとに確定したときに保存する」は初回の規則として読んだ。
- U-8（tech-lead）：経験年数の 4 区分（`years.lt1`、`years.1to3`、`years.3to5`、`years.gte5`）と段階の表示名（初級 / 中級 / 上級）、領域の ID。PRD は区分の中身を決めていない。tech-lead r1 の確定案は仕様の値をそのまま ID にする（領域 backend / frontend / database / infra / testing / git、段階 beginner / intermediate / advanced、年数 lt1 / 1to3 / 3to5 / gte5）。文言キーの末尾はこれと同じなので、仕様の表記は変えない。確定は contracts/。
- U-9（pdm）：`settings.privacy` のリンク先（docs/support/ のプライバシーのページの URL）。G5 の前に決まるまでリンクは出さない。
- U-10（verifier、PRD の読み方）：AC-21 の状態の説明（PRD 11 の冒頭）は案内を「重ねて出す」と書くが、AC-21 の Then は「画面に案内がある」で足りるので、R-18 と AC-31 に合わせて重ねずに本文の一部として置いた（D-10）。テストは `[data-testid="home.addToHomeScreen"]` の存在で見る。
- U-11（verifier、識別子の名前）：PRD が仮に置いた `task-answer` を、他のキーと同じドット区切りの `task.answer` にした。tech-lead r1 の確定案も `task.answer`。確定は contracts/。
- U-12（Takuma、見た目）：radio のラベル全体を 44 px の高さにし、q2 の段階に 1 行の説明（`level.*.desc`）を付けた。説明は自己評価のぶれを減らすためだが、PRD の 3 問の文面は pdm と Takuma が最終的に決める。
- 決まったこと（U-14。2026-11-04 に閉じた。design-reviewer G3 r1 の 8 から出た問い）：後の S3 で `navigator.storage.persist()` を求め直すか。
  - 決定：求め直さない。PRD 11 の冒頭のとおり、初めて今日の課題（`task.today`）を出した後に 1 回だけ呼ぶ（D-23）。S8 の注意 `settings.storage.notPersisted` は、S8 を開くたびに `navigator.storage.persisted()` で今の状態を読んで決める（D-31）。指揮役（Takuma から承認を委任）の決定 2026-11-04：docs/approvals/delegation.md。契約の形は contracts/data.md の 11（呼ぶ条件は、今日の課題を作る保存のときに `device.persistRequested` が true でないこと。印はその保存に含め、結果は保存しない）。
  - 理由：PRD を変えずに済む。注意が出続ける問題（提案 8）は D-31 で解ける。Firefox のように確認を出すブラウザで毎日確認が出るおそれがない。
  - 選ばなかった案（designer の意見：1 日 1 回まで求め直す）：その日の最初の S3 を描いた直後、`persisted()` が false のときだけ呼ぶ。Chrome は断った要求を利用の度合い、インストール、ブックマークで後に評価し直す（R-29）ので、毎日使う人ほど通りやすく、守る価値の高いデータほど守れる。画面は変えない（通ったら S8 の注意が消えるだけ）。退けた理由は、上限の記録に `device` の日付（例 `device.persistRequestedOn`）が要り契約の形が変わること、Firefox は確認を出す（R-29）ので毎日確認が出る人が生まれ、確認が出るブラウザを見分ける手段がないこと。見直す条件は contracts/data.md 11 の末尾（公開後に「データが消えた」の報告があり、そのブラウザで `persisted()` が false のとき）。
- 決まったこと（U-15。2026-11-04 に閉じた。D-30 の周辺）：S1 / S2（初回）と S0 error で日付が変わった後の操作は、捨てずにそのまま実行する（tech-lead の決定を指揮役が採用：docs/approvals/delegation.md 2026-11-04「移す課題がなく、黙って捨てる方が害が大きい」）。履歴に移る課題がないので D-30 の知らせは出さない。画面の仕様はこのままで変更なし。
- U-16（tech-lead、ID）：経験年数の未経験の ID。文言キーは `years.never` と置いた（tech-lead G0 r4 の提案 4 の `never`。`report` の `none` と混ざらない）。identifiers.md 5 で別の ID にするなら、キーの末尾をその ID に合わせる（7 の表と 6.1 を直す）。
- U-17（tech-lead、契約 data.md 4 の読み方）：S5 / S6 で画面を開いたまま日付が変わった後に `task.next` を押したとき。今日の最後の課題は申告済みで履歴に移す課題がないので、D-30 の知らせは出さず、翌日の 1 件目を出して S3 にする（1 の流れの末尾）。「その操作はせず」を文字どおり読むと、押した操作を捨てて翌日の S3 に差し替えることになるが、結果（翌日の 1 件目が出る。`data-task-nth-today` は 1）は同じ。知らせを出さない判断でよいかを契約の側で確定する。
- U-18（Takuma、見た目）：累計の値 `task.total.value` の大きさ。指揮役の決定（2026-11-05）「本文より大きい text style で 1 行」を text.title（24 px、700）で満たした（D-35）。もっと大きく（例：32 px）出すには tokens.md に 5 つ目の text style を足すことになり、B-4 の「1 画面に多くても 4 段」を S4 / S5 / S7 で超える。大きさの判断は見た目の好みなので、完成した画面（G3）で Takuma が見て、大きくしたければ 5 段目を足す（戻せる。文言と識別子は変わらない）。
- U-19（tech-lead、`task.exhausted.seenNext` の条件）：「次の段階の課題をすでに出したことがある」を「保存データの `history` に、目標の領域で、次の段階の `level` を持つ行が 1 つ以上ある」と置いた（D-40）。「難しすぎ」2 回で下がった先を出し終えた場合（tech-lead G0 r3 の提案 4）はこの条件に必ず当たる。やり直しの診断で段階を下げた後に戻る場合も当たるが、文（前に出したものを除いて続く）はその場合も正しい。この条件で実装できるかを契約で確定する。
- 決まったこと（r4 で閉じた。Takuma の決定 D1〜D5、2026-10-30。docs/approvals/001-daily-learning-G0.md の末尾「G1 の途中で出た決定」。返事は「すべて推奨どおり」）：
  - U-1 → D1：主操作の色は青（color.action.primary = ライト #1D4ED8 / ダーク #8AB4F8。tokens.md の 1）。変更なし。
  - U-2 → D2：日付は両言語で ISO 8601（2026-11-01）。7 の前書きと D-11 に明記。AC-24 の読み方は変えない。
  - U-3 → D3：英語表示でもアプリ名は「今日の一手」のまま。ローマ字や英語名は置かない。7 の `app.name` に明記。
  - U-4 → D4：S5 に完了した課題の題名を 1 行残す（`task.done.task`）。D-4、5 の S5、screens.md の S5 のとおり。変更なし。
  - U-13 → D5：ホーム画面のアイコン（白地に「一」1 字、180 px の PNG）と manifest を置く。決定時の大きさの上限は 10,000 バイト以下で、2026-11-04 に契約 budgets.md の 1 と 6 で 4,000 に下げた（11）。確定の形は 8 と D-29。PNG は backend-engineer が作る。
- 決まったこと（r2 で閉じた）：申告の取り消しは置かない（D-26）。ファイルの読み込みの部品は S1 と S8 で同じ型（D-27）。ホバーと押した瞬間は tokens 4（D-28）。ダイアログの背景は color.overlay（tokens 1）。
- 決まったこと（r3 で閉じた。契約との整合）：
  - U-5、U-6、U-7、U-8、U-11 の確定先は contracts/（data.md、identifiers.md）と ADR。仕様の表記は契約と同じ（`answer.max` は 2000：data.md 10）。
  - `settings.stats.firstOpenDate`（「初めて開いた日」/「First opened」）の文言は変えない。契約 data.md 2 で値は「初回の診断の 1 問目を確定した日」になった（案内を閉じただけの日は数えない）が、(1) PRD 13 の指標と AC-24 の Given は「初めて開いた日」の語で書かれ、利用者が送る S9 のスクリーンショットをこの語で読む約束になっている。(2) 同じ語は `settings.stats.firstDayCompleted`（「初めて開いた日に完了したか」）と `settings.import.confirm.summary` にもあり、変えるなら 3 キーをそろえて PRD 13 の語も変えることになる。(3) D-1 の流れ（S1 → 診断）では、開いた日と 1 問目の日は同じ日で、違うのは案内を閉じて診断せずに去った人だけ。その人にとっても「使い始めた日」の意味で読める。英語「First opened」も同じ理由で残す。別の語（「始めた日」）がよければ Takuma の決定で 3 キーの文言だけを変える（キーと `data-stat-first-open-date` は変えない：ADR 0002）。

## 11. 変更の記録
### G1 r6 → r7（PRD r10（FB-1〜FB-3）、調査 r2、指揮役の決定 2026-11-05。指揮役の指示書「5b」）
| 指示書の項目 | 直した所 |
|---|---|
| 1 D-4 を FB-2、FB-3 に合わせる | 4 の D-4 を書き直した（確認ページの型。`task.next` は副操作の形で S5 / S6 に 1 つ。催促なし）。D-34（S4 の 1 画面）。1 の流れ（S5 / S6 → `task.next` → S3 / S7）、3 の S5 / S6 の仕事と主操作、5 の S5 / S6、6、7（`task.next`、`task.next.note`。`task.done.message` と `task.skipped.message` を消した）、8 の差をつける点 2、9 の読み上げ順 |
| 2 完了直後（解説、累計、節目、今週） | D-35（累計：text.title の 1 行。指揮役の決定）、D-36（節目：4 キー、文だけ、動きなし、reduce でも同じ）、D-38（解説：h2 + p、折りたたまない、S3 / S6 に置かない）、D-39（今週：「月曜から」を省かない。指揮役の決定）。3、5、6 の S4 / S5、7 の `task.total.*`、`task.cheer.*`、`task.insight`、`task.week`、8 の性格語「手応え」、9。語の検査は 7 の全キーで 0 件（docs の確かめ） |
| 3 S3 の n / N とその日の何件目 | D-37。1、3、5、6 の S3（`task.progress`、`task.today.label.nth`、`data-progress-index` / `-total`、`data-task-nth-today`）、7、8 の差をつける点 1（ヘッダー 56 px でも収まる）、9 |
| 4 S7 の 2 変種 | D-40。1 の流れ、2 の AC-10、3、5、6 の S7、7（`task.exhausted.levelDone` / `.levelDone.detail` / `.next` / `.seenNext` / `.advance` / `.allDone` / `.allDone.detail`。`.message` と `.detail` を消し、`.redo` の文言を「別の領域を選ぶ」に）。下がった先を出し終えた場合は `task.exhausted.seenNext`（条件は U-19） |
| 5 診断（S1 / S2） | D-41。7 の `diagnosis.start.lead.1`（差し替え）、`.lead.3`、`diagnosis.q3.legend`、`area.*.desc` ×6（ja 15〜20 字、en 32〜39 字。確かめは報告のコマンド）、`level.*.desc` ×3（PRD 9 と Q12 の A）、`years.never`（AC-40。ID は U-16）。3、5、6 の S2、9 |
| 6 S9 | D-42。3、5、6 の S9（11 行）、7 の `settings.stats.daysCompletedWeek`、`.extraCompleted`、2 の AC-24 |
| 7 文言の表と識別子 | 7 の前書き（差し込み、総数 170）、6.1（28 キー、消す 4 キー、文字を持たない要素 4 つ、属性 7 つ、ID 1 つ。tech-lead が identifiers.md に写す） |
| 8 全画面・全状態の表 | 5.1 を新設（49 の状態。r7 で足した状態に印） |
| 9 U-15 | 10 の U-15 を「決まったこと」に（delegation.md 2026-11-04）。U-16〜U-19 を足した |
| 共通 | ヘッダー（PRD r10、調査 r2、r7）、冒頭の状態名の注記（`task.exhausted` の 2 変種と `data-task-nth-today`）、2 の AC-5、AC-7、AC-8、AC-14、AC-17、AC-27、AC-33〜AC-40、対応なしの行、8 の参考のページ、9 の AX5 と押せる範囲と英語の長さ、確かめ。tokens.md 2 の text.title の「使う所」に累計の値（値は変えていない）。screens.md の S2、S3、S4、S5、S6、S7、S9 の図 |

- 2026-11-04（r6 のまま。予算の数字を契約に合わせた）：tech-lead が contracts/budgets.md の 1 と 6 で、アイコンと manifest の枠を 10,000 から 4,000 バイト（gzip 後）に、アイコンの生の上限を 10,000 から 4,000 バイトに変えた（コミット f40c61a。殻は 26,000 → 32,000、合計 150,000 は同じ）のに合わせ、4 の D-29、8 のアイコンと manifest の項（置き場所、寸法、作り方の 3 か所）、10 の D5 の「10,000 バイト以下」を 4,000 に直した。10 の D5 には決定時の数（10,000）を記録として残した。殻の 26,000 はこの仕様に書いていなかった。アイコンの形（2 色、「一」1 字、180 × 180）、画面、文言、トークンは変えていない。
- 2026-11-04（r6 のまま。U-14 を閉じた）：指揮役の決定「persist() を求め直さない」（docs/approvals/delegation.md、contracts/data.md 11）に合わせ、1 の流れの persist の行、4 の D-31、7 の権限の文から「求め直すかは U-14」を消し、10 の U-14 を「決まったこと」にした（designer の 1 日 1 回の案は「選ばなかった案」として残す）。画面、文言、トークンは変えていない。
### G3 r5 → r6（design-reviewer G3 r1 の指摘 3、提案 8〜11 と、指摘 4〜6 の文の明確化。指揮役の決定 2026-11-03：docs/approvals/delegation.md）
| 指摘 | 直した所 |
|---|---|
| 指摘 3（要修正。日付が変わった後の最初の操作に知らせがない） | 4 に D-30。1 の流れの末尾（操作で着いたときだけ知らせ）、2 の表の下（AC にない状態の扱い）、3 の S3 と S7 の部品、5 の S3 と S7 の通常、6 の S3 の行、7 に `task.dayChanged`（145 → 146 キー）、8 の色の一覧、9 の読み上げ順と英語の長さ。screens.md に S3 の図を 1 つ。research に R-27、R-28 |
| 提案 8（永続化の注意が古くなる） | 4 に D-31。1 の流れの persist の行、2 の AC-13（テストは persisted() も注入）、5 の S8 の権限、7 の権限の文。10 に U-14（persist() を求め直すか。designer の意見つき。決めるのは tech-lead）。research に R-29、R-31。screens.md の S8 の注記 |
| 提案 9（`task.answer.limit` の色） | 4 に D-32。color.warning に決め、8 の一覧と tokens.md 1 の color.warning の意味に足した。5 と 6 と 7 の S3 に `role="status"` |
| 提案 10（起きないエラーの状態） | 5 の S8 のエラー (2) と削除の確認ダイアログのエラーを「なし（理由）」に。7 の `error.storage.message` の使う場所から S8 を外した（ダイアログ `settings.import.confirm` は残る） |
| 提案 11（案内の箱） | 4 に D-33。箱を残す。tokens.md 1 に例外の 1 文、4 に「案内」の行。screens.md の S1 の図を枠で描き直した。8 の並びの行に明記。research に R-30 |
| 指摘 4（リンクと summary の左端。実装の差） | 仕様は変えず、文をはっきりさせた：tokens.md 4 の「リンク」に負の margin-left、「開閉」の行を追加。8 の並びの行に「見える左端を列の線に」 |
| 指摘 5（副操作のボタンの幅。実装の差） | tokens.md 4 のボタン（主操作）の行に「どの入れ物にあっても同じ」。8 の並びの行 |
| 指摘 6（エラーのときの入力欄の枠。実装の差） | tokens.md 4 の入力欄の行に、エラーの間の枠（size.border.strong、color.error）と `aria-describedby`。`aria-invalid` は付けない（理由を書いた）。5 と 6 の S3 |
| 共通 | ヘッダーを r6 に。確かめを D-1〜D-33、146 キーに。research は R-27〜R-31 の追加だけ（1〜7 は変えていない） |

### G2 r4 → r5（PRD r7 と契約の確定に合わせた 2 点。小さな直しだけ）
| 元 | 直した所 |
|---|---|
| PRD r7 の AC-14（Given を `task.exhausted` に明記。2 通り目を追加。Q11 は A） | 2 の AC-14 の行を 2 通りに（1 通り目：S7 → S8 → S2 → S3。2 通り目：S3（今日の課題あり）→ S8 → S2 → S3 のまま同じ課題、翌日 S3 が新しい領域）。1 の流れの S8 の「診断をやり直す」の行（出していれば元の状態のまま。新しい診断は明日から効く）と契約 data.md 2（やり直しを終えた後の行き先）に矛盾はなく、1 は変えていない |
| 契約 budgets.md の 6（`<head>` の 5 行） | 8 のアイコンと manifest の項の `<head>` に `<title>` と `apple-mobile-web-app-title`（値はどちらも「今日の一手」）を足し、契約の 5 行と同じにした。D-29 の本文は変えていない（`<head>` の詳細は 8 に委ねている） |
| 共通 | ヘッダーを r5 に、対象の PRD を r7 に。文言キーの総数は 145 のまま。research、tokens.md、screens.md は直していない |

### G1 r3 → r4（Takuma の決定 D1〜D5。小さな直しだけ）
| 決定 | 直した所 |
|---|---|
| D1（U-1。主操作の色は青） | 10 の「決まったこと（r4）」に移した。tokens.md の値は変えない |
| D2（U-2。日付は ISO 8601） | 7 の前書きと 4 の D-11 に決定の印。10 に移した |
| D3（U-3。英語でも「今日の一手」） | 7 の前書きと `app.name` の使う場所（「英語の表記は 10」を消した）。10 に移した |
| D4（U-4。完了画面に題名 1 行） | 4 の D-4 に決定の印。10 に移した。5 の S5 と screens.md の S5 は変更なし |
| D5（U-13。アイコンと manifest） | 4 に D-29 を足した。8 の項を確定の形に書き直した（ファイル名 `./icon-180.png` と `./manifest.webmanifest`、HTML の `<link>`、寸法、色のトークン名、文字、書体、幅 60%、作り方 1 行、manifest の 7 項目と置かない項目）。10 に移した。tokens.md の 1 に「アイコンは color.bg と color.text のライトの値だけ」の 1 行。確かめの 1 行目を D-1〜D-29 に |
| 共通 | ヘッダーを r4 に。11 の r1 → r2 の P4 の行を「r4 で D5 として確定」に書き換えた（Takuma の判断を待つ旨の語をファイルから消すため）。文言キーの総数は 145 のまま。research は直していない |

### G1 r2 → r3（design-reviewer r2 の提案 1〜4 と、契約との整合）
| 指摘 | 直した所 |
|---|---|
| design-reviewer r2 の 1（提案。`app.name` の押せる範囲） | 9 の押せる範囲の列挙に `app.name` を足し、ヘッダーの高さの計算に含めた。tokens.md の 4「リンク」の括弧に `app.name` を足した |
| design-reviewer r2 の 2（提案。起動時の判定順） | 1 の流れの冒頭に判定順を 1 行（契約 data.md 4 のとおり：枠の中 → 保存先が使えない → 読めない → 診断の途中 → なし → あり。提案の「読めない → 保存先が使えない」とは前後が逆で、契約に従う）。アプリ名の行き先を「判定順をやり直す（途中は S2）」に揃えた。「あり / 途中 / なし」の定義を契約 data.md 3 に合わせた（1 の流れ、5 の S8） |
| design-reviewer r2 の 3（提案。やり直しの S2 の nav） | 1 の nav の行、3 の冒頭、5 の S2 を「初回の S2 は `nav.settings` だけ、やり直しの S2（S7 か S8 から）は `nav.history` と `nav.settings`」に。screens.md の S2 の図に注記 |
| design-reviewer r2 の 4（提案。確かめの欄） | 確かめの 1 行目を D-1〜D-28 に、4 行目を「文字と枠の組の最小は 5.33:1。color.overlay の組（1.06:1、1.35:1）は地か枠のどちらかで 3:1 以上」に |
| 契約 data.md 3、44（S8 の「保存データなし」の表示を「なし」と「途中」の両方で使う） | 採る。3 の S8 の主操作、5 の S8 の空、1 の流れ（読み込みの確認なし）、screens.md の S8（保存データなし）の見出しと末尾の文に明記。理由は 5 の S8 の空 |
| 契約 data.md 2（`firstOpenDate` の意味） | 文言は変えない。理由は 10 の「決まったこと（r3）」。7 の `settings.stats.firstOpenDate` の使う場所に意味を書いた。キーの総数は 145 のまま |
| 契約 identifiers.md 3（`task.external.tools` の構造） | 一致を確認（`<dl>` → `<dd>` → `<ul>` → `<li>`。5 の S3、screens.md の S3、tokens.md の 4）。6 の S3 の行に `<dd>` の中の `<ul>` の `<li>` と明記 |

### G1 r1 → r2
design-reviewer r2 と tech-lead が追跡するための一覧。行番号は r2 のこのファイル。

| 指摘 | 直した所 |
|---|---|
| design-reviewer 1（重大。S1 から設定に行けない） | 1 の流れ（nav の行と、保存データなしの読み込みの行）、2 の AC-20・AC-21・AC-22、3 の冒頭の文と S8 の主操作、5 の S1 の通常と S8 の空（読み込みを主操作に）、6 の nav の行、9 の S1 と S8 の読み上げ順。screens.md の S8（保存データなし）の図を追加 |
| design-reviewer 2（重大。理由のない「なし」12 セル） | 5 の全行。S4〜S7、S10、ダイアログ 2 つの空と読み込み中に理由を足し、権限と一部だけ読めたときの「なし」にも理由を足した（表の前の説明も） |
| design-reviewer 3（要修正。4 要素の形） | 2 の AC-3（`<dd>` → `<h2>` と段落）。tokens.md の 4「定義リスト」を統計と要る道具に限定し、「見出しと段落（課題の 4 要素）」の行を足した |
| design-reviewer 4（要修正。ファイル読み込みの部品） | 3 の S1・S8（本来の部品、理由、対応）、4 の D-27、5 の S1・S8、6 の S1・S8、7 の権限の文、9「ファイルの読み込みの部品」。tokens.md の 4 に「ファイルの読み込み」の行。screens.md の S1 と S8 |
| design-reviewer 5（要修正。リンクの押せる範囲） | 4 の D-16、9 の押せる範囲（`settings.privacy` を単独のリンクに）、tokens.md の 4「リンク」（上下 space.3、`min-width: 44px`） |
| design-reviewer 6（提案。注記） | 9 のコントラストの注記を「小数 3 桁目を四捨五入」に。値はそのまま |
| design-reviewer 7（提案。申告の取り消し） | 置かない。理由は 4 の D-26 |
| design-reviewer 8（提案。S7 からのやり直しの「やめる」） | 1 の流れ、5 の S2・S7、7 の `diagnosis.cancel` の使う場所（S7 に戻す） |
| design-reviewer 9（提案。色の使い所） | 8 の「静か」に色ごとの一覧（warning の案内の見出し、error の削除ボタンを含む） |
| design-reviewer 10（提案。ホバーと押した瞬間） | tokens.md の 4「ホバーと押した瞬間」、4 の D-28、9 のコントラストの表（入れ替えの組） |
| design-reviewer 11（提案。背景の値） | tokens.md の 1 に color.overlay、4「ダイアログ」を名前で参照。9 の表に重ねた地の比 |
| tech-lead M1（答えの保存の間隔） | 1 の流れ、2 の AC-32、4 の D-5、5 の S3 |
| tech-lead M2（診断の途中の行き先） | 1 の流れ、5 の S2 と S8（「保存データあり」の定義は契約） |
| tech-lead P1（保存が使えない） | 1 の流れ、5 の S0、6 の S0、7 に `error.app.storageUnavailable.message` / `.detail` を追加（143 → 145 キー）、10 の U-5 |
| tech-lead P2（殻の 2 文） | 5 の S0、7 の `app.loading` と `app.noscript` の使う場所（HTML に日英を併記。キーは残す） |
| tech-lead P3（ダイアログ） | 2 の AC-31、3 のダイアログの行、5 のダイアログ 2 行（開くときに足し、閉じたら外す。数え方は契約） |
| tech-lead P4（アイコンと manifest） | 8 の項と 10 の U-13（r2 では Takuma に決めてもらう項として置いた。r4 で D5 として確定） |
| tech-lead A（U-8、U-11 の確定案） | 10 の U-5、U-8、U-11 に確定案を書いた。仕様の表記は変えていない（確定案と同じ） |

## 確かめ（提出前に designer が印を付ける。design-reviewer はこれを信じずに確かめる）
- [x] 調査が先にあり、決定表のすべての行に R-n と原則がある（R-n は調査に実在する）：D-1〜D-42。調査は 854cf47（r1）と 3d9c9e6（r2）でコミット済み（r2 は仕様 r7 より先）。D-34〜D-42 の R は R-32〜R-65 の範囲で、調査 8 に実在する
- [x] 全画面に、仕事、主操作1つ、使う標準部品がある（3 の表。S0〜S10 とダイアログ。S7 は 2 変種とも主操作 1 つ）
- [x] 全画面の7つの状態が埋まっている（5 の表。「なし」のすべてに理由がある。5.1 に全画面・全状態の 49 行）
- [x] 押せる範囲が 44x44pt 以上（`app.name` と nav のリンク、`task.next`、`task.exhausted.advance`、ヒント文つきの radio のラベルを含む）。コントラストが基準を満たし、独自の色の組に数字が3通りある（9 の表。r7 で新しい色の組は足していない。文字と枠の組の最小は 5.33:1（color.border、ライト）。color.overlay を重ねた地とダイアログの組は 1.06:1 と 1.35:1 の値があるが、地か枠のどちらかで 3:1 以上になる設計で、表の注記のとおり）
- [x] AX5 での並びと、VoiceOver の読み上げ順が書いてある（9。r7 で S2 のヒント文、S3 の進み具合、S4〜S7 を足した）
- [x] 性格語と差をつける点が、画面のどこに表れているか書いてある（8。「手応え」と差をつける点 2 を r7 で置き換えた。ホーム画面のアイコンの「一」は性格語「ひとつ」）
- [x] 文言が日英そろい、テストで使う要素に accessibilityIdentifier（data-testid）がある（6、6.1、7。170 キー。ja と en の全キーに「連続」「途切れ」「逃した」「streak」「missed」は 0 件。契約 strings.schema.json と identifiers.md への追加は tech-lead）
