# デザイン仕様 001-daily-learning：診断と今日の学習（今日の一手）

- 対象の PRD：docs/prd/001-daily-learning.md（r13。G0 の判定は verifier r5 と tech-lead r5 がどちらも PASS。AC-1〜AC-45、AC-30 は欠番。FB 2 回目 docs/approvals/001-daily-learning-FB2.md）
- 調査：design/001-daily-learning-research.md（この仕様より先に書いた。r1 はコミット 854cf47、r2 は 3d9c9e6、r3 は 74e68d2）。方向性は案A「一枚の紙」＋ r2 の案A'「手応えを足す」＋ r3 の案D「5 色」（調査 7.2。Takuma が選んだ：FB2 の Q28）
- 書いた役：designer　日付：2026-11-06（**r12**。G1 design-reviewer r5（FAIL 12 / 16）と tech-lead r3（PASS、要修正 3）の指摘を直した：U-24（再読み込みで復元した返しにもミルを出す：D-53）、正誤の `role="status"` の入れ物を描いた時点から置く（D-48）、3 問目に答えたら `task.skip` を外す（D-3）、U-28（`guide.incorrect`）、`{total}`、状態の表の「なし」に理由、課題集を 6 領域に分ける前提（S2 と S10 のオフライン：D-61）、ミルの台詞を正誤 3 本ずつ（D-55、U-30）、図の横並びの条件（D-51）、ほか。一覧は 11。文言は 194 キー。r11：PRD r13（FB2：選んで学ぶ型、正誤の返し、図の 6 型、案内役のキャラクター）と調査 r3（3.2〜3.4、4.2、6.2、7.2、8.1 の 16〜20）に合わせて書き直した。Takuma が選んだもの：案内役はミル（カメレオン。design/001-daily-learning/characters/README.md の 7、`miru-*`）、配色は案D「5 色」（図の強調は橙 color.figure.accent、案内役の色 color.guide）。課題の画面 S3 を「導入と図 → 問 1〜3（3 択、選ぶと 300 ms 以内に正誤と説明）→ まとめ」に変え、答えを書く欄、難しすぎ／簡単すぎ、「完了」ボタンを消した。D-3、D-5、D-6、D-13、D-15、D-18、D-19、D-20、D-26、D-34、D-36、D-43、D-44 を書き直し、D-46〜D-65 を足した。文言は 20 キーを消し 35 キーを足して 189 キー。tokens.md に色 2 つと寸法 3 つ（r8）。直した箇所の一覧は 11。r10 までの経緯は 11 の「r10 以前」）
- 図：design/001-daily-learning/screens.md（文字で描いた画面の図。r11 で S3、S4、S5、S6、S7、S8、S9、S10 を描き直した）。案内役の絵：design/001-daily-learning/characters/（ミルの PNG 8 枚、画素の原本 miru.txt、コントラスト contrast.md）
- トークン：design/tokens.md（色、文字、余白、図の寸法。この仕様はトークンの名前だけを使う）
- 原則の番号 B-1〜B-6 は .claude/skills/craft-designer/SKILL.md にある。
- 読み替え：ブラウザだけで動く Web アプリなので、型の「標準部品（SwiftUI）」は「ネイティブの HTML 要素と WAI-ARIA の型」、「HIG の URL」は「WCAG 2.2 / WAI-ARIA APG / MDN の URL」、「accessibilityIdentifier」は「`data-testid`」、「VoiceOver のラベル」は「アクセシブルな名前」、「AX5」は「ルートの文字サイズ 200%（G3 の画像は幅 390）と OS の文字サイズ最大」に読み替える。指揮役の裁定（2026-10-30）による。
- 文言キーの決まり：`<画面か領域>.<要素>[.<変種>]`。小文字の camelCase をドットでつなぐ。PRD が指定したキー（`task.answer.result.correct`、`task.level.adjusted.down`、`error.tasks.offline`、`settings.character.show`、`guide.*` など）はそのまま使う。見える文字を持つ要素の `data-testid` はその文言キーと同じ。文字を持たない要素（入れ物、行、図、絵、ダイアログ）の `data-testid` は 6 に書く。変種のキー（`task.cheer.*`、`guide.*` の台詞、`task.answer.result.*`）は、要素の識別子を固定し、文言キーだけが入れ替わる型と、キーそのものを識別子にする型があり、どちらかは 6 の表に書く。
- 状態名（ルート要素の `data-state`）：PRD の 10 個 `diagnosis.start`、`diagnosis.question`、`task.today`、`task.rate`、`task.done`、`task.skipped`、`task.exhausted`、`settings`、`settings.stats`、`history` に、殻の 2 個 `loading`、`error` を足した 12 個（r10 と同じ）。`task.today` の中の進み（導入、問 1〜3 の未回答と回答済み）は状態名を変えず、`task.today` の要素の `data-task-question-index`（答えた問題の数 0〜3）で見分ける（PRD 11 の冒頭）。

## 1. 画面の流れ
画面の番号：S1 `diagnosis.start`、S2 `diagnosis.question`、S3 `task.today`、S4 `task.rate`、S5 `task.done`、S6 `task.skipped`、S7 `task.exhausted`、S8 `settings`、S9 `settings.stats`、S10 `history`。殻：S0 `loading` / `error`。案内役（ミル）が出る画面は S1、S3（返し）、S4、S7 の 4 つだけ（D-53）。

```
[URL を開く] → S0 loading（JS が動くまで）
   判定順（契約 data.md の 4）：枠の中 → loading のまま／保存先が使えない → S0 error (2)／読めない → S0 error (1)／診断の途中 → S2／なし → S1／あり → 今日の状態（S3 / S5 / S6 / S7）
   ├ 保存データなし → S1 diagnosis.start（ミル idle と台詞 guide.intro。AC-45）
   │     ├ スタンドアロン表示 → S1 に案内 home.standalone.import
   │     ├ iOS の Safari でスタンドアロンでない、かつ閉じた印がない → S1 に案内 home.addToHomeScreen
   │     └ 「診断を始める」→ S2 ×3（1 / 3 → 2 / 3 → 3 / 3。ミルは出ない。1 問目の確定で領域のファイルを裏で取り始める）→ 「診断を終える」（ファイルが SW に無くオフライン → S2 の 3 / 3 のまま error.tasks.offline + task.next.retry：D-61）
   │            → S3 task.today（1 件目。問 0 / 3。ミルは出ない：AC-31）。初めて S3 を出した直後に persist() を 1 回だけ（D-23）
   ├ 診断の途中 → S2 のまだ答えていない最初の質問
   ├ 保存データあり、今日まだ課題を出していない → 出せる → S3（current.answers が空）／ない → S7
   ├ 保存データあり、今日の最後の課題が完了（report done。まとめの回答の有無を問わない） → S5 task.done
   ├ 保存データあり、今日の最後の課題が「今日はやめておく」（no_time） → S6 task.skipped
   ├ 保存データあり、今日の課題の途中（current がある。答えた問が 0〜2） → S3（答えた問の返しを復元し、次の問を出す：AC-32）
   └ 読めない／保存先が使えない → S0 error

S3 task.today（D-46。data-task-question-index は 0 → 1 → 2 → 3）
   題名、導入の本文、導入の図（AC-44）、問 1（問題文、任意の図、選択肢 3 つ）、「今日はやめておく」
   ├ 選択肢を押す（1 回だけ。AC-41）→ 300 ms 以内に同じ問の直下に返し：正誤の文言と印 → ミル（correct / incorrect。この問だけ）→ 選んだ選択肢の説明（不正解なら正解の説明も）→ 主操作「次の問題へ」。index が 1 増え、保存（current.answers）
   ├ 「次の問題へ」→ 問 2 を問 1 の下に足す（問 1 の返しは残る。問 1 のミルは消える）→ … → 問 3 の返し → 主操作「まとめへ」（3 問目に答えた時点で履歴に移る：report done、score、answers。「今日はやめておく」は DOM から外す：D-3）
   ├ 「まとめへ」→ S4 task.rate
   ├ 「今日はやめておく」task.skip（導入でも途中でも）→ S6 task.skipped（answers と score は答えた分だけ残る。AC-7）
   ├ 再読み込み（途中。答えた問が n = 1〜2 件）→ 同じ S3。答えた問の返しは見え、ミルは問 n の返しにだけ 1 件（data-mood は answers[n-1].correct）。問 n の「次の問題へ」は出さず、問 n+1 を未回答で出す。フェードは当てず、フォーカスは動かさない（D-53、D-64。U-24 の決定）。3 問目に答えた後に「まとめへ」を押さずに再読み込み → S5（PRD r13-1）
   └ 段階が変わった直後の課題（AC-8）→ 題名の上に task.level.adjusted.down / .up の 1 文（D-60）
S4 task.rate（まとめ。D-59）：h1「完了しました」（印の演出：D-43）→ 正答数 task.rate.score（点数の語なし：AC-42）→ ミル celebrate と台詞（正答数で変わる：D-55）→ 累計 → この段階の n / N 件目でした → 祝い → ひとこと解説 → 役に立ったか（AC-9）
   ├ 「役に立った」「立たなかった」「今回は答えない」または再読み込み → S5 task.done
S5 task.done / S6 task.skipped
   ├ 「次の一手に進む」task.next → 同じ日に次の課題 → S3（nth-today が 1 増える）。出せる課題がなければ S7（次の課題は同じ領域のファイルの中なので、ファイルの取り直しは無い：D-61）
   ├ 押さなければ再読み込みしても S5 / S6 のまま（AC-5、AC-7）
   └ 「履歴を見る」→ S10
S7 task.exhausted（levelDone / allDone。ミル celebrate と台詞 guide.exhausted.*）
   ├ levelDone：「{次の段階}に進む」→ S3（次の段階の 1 件目。同じ領域のファイルの中なので取り直しは無い：D-61）
   ├ 「別の領域を選ぶ」→ S2（「やめる」で S7 に戻る。終えるときに別の領域のファイルが SW に無くオフライン → S2 のまま error.tasks.offline + task.next.retry：AC-23 の 3 通り目、D-61）
   └ 再読み込みの扱いは r10 と同じ（今日の行がある日に操作で着いた S7 は S5 / S6 に戻る）
ヘッダーの nav、S8 settings（読み込み、書き出し、やり直し、削除、統計、履歴、ホーム画面。r11 で節「案内役」settings.character.show を足した：D-56）、S9、S10、翌日の扱い、日付が変わった知らせ（D-30）は r10 と同じ。やり直しの診断は「次に出す課題」から効く（S3 の途中にやり直しても表示中の課題は変わらない）。
```

## 2. 受け入れ条件と画面の対応
verifier はこの表から受け入れテストを書く。識別子の詳しい一覧は 6。r11 で変えた行には「r11」。

| AC | 画面（状態） | 操作と、テストが読む識別子 |
|---|---|---|
| AC-1 | S1 → S2 | S1 の `diagnosis.start.begin` を押す → S2 の `diagnosis.progress`（`data-question-index`、`data-question-total`=3）を読み、radio を選んで `diagnosis.next`（3 問目は `diagnosis.finish`）を押す。切り替えは同期（500 ms 以内） |
| AC-2 | S2 → S3 | `diagnosis.finish` を押す → `data-state="task.today"`、`[data-testid="task.today"]` の `data-task-area`、`data-task-level` |
| AC-3（r11） | S3（と課題集の JSON） | 題名 `task.today.title`（h1）、導入 `task.intro.text`、導入の図 `task.figure`（`data-figure-of="intro"`。`aria-label` が `figure.alt`）、問 1 の `task.question.text`、所要時間は `task.meta`。3 問の問題文と `insight` の全件検査は JSON に対して行う（画面はスクリーンショット） |
| AC-4 | 対応なし | 課題集の JSON の件数の検査 |
| AC-5（r11） | S3 → S4 → S5 | 問 1、問 2 に答え（各 `task.choice` → `task.question.next`）、問 3 に答えて `task.summary.open` → `data-state="task.rate"` → `task.rate.helpful` か再読み込み → `data-state="task.done"`。再読み込みしても `task.done` のままで、`task.next` を押さない限り `data-stat-issued`（S9）は変わらない |
| AC-6 | S3 | 翌日の読み込みで `data-state="task.today"`、`data-task-id` が履歴のどの行とも違う |
| AC-7（r11） | S3 → S6、S10 | 1 通り目：問 0 / 3 で `task.skip`。2 通り目：問 1 に答えてから `task.skip` → `data-state="task.skipped"`。S10 の `history.row` の `data-report`=no_time、`data-task-id`、`data-score`（2 通り目は答えた分）。再読み込みしても `task.skipped` のまま。3 問目に答えた後の S3 では `task.skip` と `task.skip.note` が 0 件（D-3）。S3 の申告の操作は `task.skip` の 1 つだけ（`task.report.*` の識別子は 6 に定義しない。identifiers.md で確かめる） |
| AC-8（r11） | S3（翌日、または同じ日の `task.next` の後） | 翌日の S3、または `task.next` で着いた S3 の `[data-testid="task.today"]` の `data-task-level`。9 通り目：段階が下がった直後の S3 に `task.level.adjusted.down` が 1 件（D-60）。上がった直後は `task.level.adjusted.up` |
| AC-9 | S4 → S5、S10 | `task.rate.helpful` / `task.rate.notHelpful` / `task.rate.close` / 再読み込み → `task.done`。S10 の行の `data-helpful` |
| AC-10 | S7（2 変種）→ S3 / S2 | r10 と同じ（h1 `task.exhausted.levelDone` / `.allDone`、`task.exhausted.advance`、`task.exhausted.redo`、`task.exhausted.seenNext` / `.nextDone`）。r11：どちらの変種にも `guide.character`（`data-mood`=celebrate）が 1 件（非表示の設定なら 0 件） |
| AC-11 | S2（エラー） | r10 と同じ（`error.storage.message`、`error.storage.retry`、radio の `checked` が保たれる） |
| AC-12（r11） | S1〜S6 | オフラインで AC-1、AC-2、AC-5、AC-7、AC-9、AC-41 と同じ操作。送信 0 件。画面は通常と同じ（図と絵は配布物にある） |
| AC-13 | S3 → S5、S8 | r10 と同じ（`persist()` と `persisted()` の両方を false に注入。S8 に `settings.storage.notPersisted`） |
| AC-14（r11） | 1 通り目：S7 → S8 → S2 → S3。2 通り目：S3 → S8 → S2 → S3（同じ課題）→ 3 問に答える → S4 → S5 → `task.next` → S3 | r10 と同じ流れ。2 通り目の「その課題を完了する」は `task.report.done` ではなく、3 問に答えて `task.summary.open` |
| AC-15 | S0 → S3 | ルートの `data-debug-load-ms`（S3 の題名、導入、図、問 1 の選択肢 3 つまで描いた時点で書く） |
| AC-16 | S8 → ダイアログ → S1 | r10 と同じ |
| AC-17（r11） | S1、S3（問 0 / 3）、S3（問 1 に不正解の返し。説明 2 つ）、S4、S5、S7（levelDone） | 幅 320 で `scrollWidth` 320 以下、`scrollWidth > clientWidth` の要素 0 件（図 `task.figure` と `task.figure.label` を含む）、ellipsis 0 件。S3 の 2 通り目は `guide.character` が 1 件ある状態で撮る |
| AC-18（r11） | S1 → S2 → S3 → S4 | Tab / Shift+Tab / Enter / Space / 矢印だけで `diagnosis.start.begin` → radio → `diagnosis.next` → `diagnosis.finish` → `task.choice`（Enter か Space）→ `task.question.next` → … → `task.summary.open`。`:focus-visible` の outline が 3 px（tokens の size.focus.width）。答えた後の `task.choice` は `aria-disabled="true"` でフォーカスできるが、Enter / Space で `data-choice-state` は変わらない（D-47、D-64） |
| AC-19（r11） | S8 | `settings.export` → JSON。履歴の行に `answers`（`{ choice, correct }` × 0〜3）と `score` |
| AC-20 | S1 → S8、または S1 の案内 | r10 と同じ |
| AC-21 | S1、S8 | r10 と同じ |
| AC-22 | S1 | r10 と同じ |
| AC-23（r12） | S0 → S3 / S5。3 通り目：S8 → S2 | 1・2 通り目：オフラインで再読み込み → 3 秒以内に同じ `data-state`、`data-task-id`、`data-task-question-index`=1、`task.figure` の `data-figure-type` が同じ、`guide.character` の件数と `data-mood` が再読み込み前と同じ（返しの直後も復元後も 1 件。`data-mood` は `answers[0].correct` から correct か incorrect：D-53。U-24 の決定 2026-11-06）。復元では問 1 の `task.question.next` が 0 件、問 2 の `task.choice` ×3 が押せる。3 通り目（課題集は 6 領域に分けるので `task.next` と `task.exhausted.advance` ではファイルを取り直さない：D-61。「やり直しの診断で別の領域へ移る `diagnosis.finish`」と読み替える）：`serviceWorkers: 'block'` で開き、S8 の `settings.redo` → S2 で別の領域を選び、3 問目を選んでから setOffline → `diagnosis.finish` → S2 のまま（`data-question-index`=3、radio の `checked` は保たれる）`error.tasks.offline` 1 件と `task.next.retry` 1 件、`data-stat-issued` は増えず、保存データは変わらない → オンラインで `task.next.retry` → `task.today`（新しい領域の 1 件目） |
| AC-24（r11） | S9 | `settings.stats.open` → `<dd>` 13 個：`data-stat-first-open-date`、`-issued`、`-completed`、`-first-day-completed`、`-days-completed-7d`、`-days-completed-week`、`-extra-completed`、`-helpful`、`-rated`、`-questions-answered`、`-questions-correct`、`-low-score-tasks`、`-no-time`。`data-stat-too-hard` は 0 件（6 に定義しない） |
| AC-25 | S8（エラー） | r10 と同じ |
| AC-26（r11） | S1（全画面） | locale en-US で S1 の文言が en と一致。キーの差 0 件（7 の表が日英の原本。`guide.*` を含む） |
| AC-27（r11） | S1（ミルあり）、S2、S3（問 0 / 3）、S3（不正解の返し）、S4、S5、S7（2 変種）、S8（表示は 9 つ） | axe-core で serious 以上 0 件（4.5:1 以上のトークン、`task.choice` の名前、`task.figure` の `role="img"` と `aria-label`、`guide.sprite` の `aria-hidden`、`task.question.status` の `role="status"`（空のときも含む）） |
| AC-28 | S0（ルート）、S8 | r10 と同じ |
| AC-29 | 対応なし | 課題集の JSON の検査（画面は AC-3、AC-41、AC-44） |
| AC-31（r11） | S3、S5 | 操作 0 回で `data-state`。S3 に `task.today.title`、`task.intro.text`、`task.figure`、問 1 の `task.question.text` と `task.choice` ×3、`task.skip` が同じ画面にあり、`guide.character` が 0 件、重なる要素（dialog、`position: fixed`）が 0 件 |
| AC-32（r11） | S3 | 問 1 に正解、問 2 に不正解で答えた状態で再読み込み（または新しいタブ）→ 同じ `data-task-id`、`data-task-question-index`=2、問 1 と問 2 の `task.question` に `data-answer-result`（correct / incorrect）と `task.question.explain`（1 つと 2 つ）が見え、問 3 の `task.question` に `data-answer-result` がなく、`task.choice` ×3 が `data-choice-state`=none で `aria-disabled` なし。問 2 の返しに `guide.character` 1 件（`data-mood`=incorrect）、問 1 の返しには 0 件、問 2 の `task.question.next` は 0 件（D-53）。復元ではフォーカスを動かさない（`document.activeElement` は body：D-64）。翌日は新しい課題で index 0、前日の行は `report`=none、`answers` 2 件、`score` 1 |
| AC-33 | S5 / S6 → S3 | r10 と同じ（`task.next` → 1 秒以内に `task.today`、`data-task-nth-today` が増える、dialog 0 件） |
| AC-34 | 対応なし | 課題集の JSON の検査 |
| AC-35（r11） | S3 → S4 → S5 | 3 問に答えて `task.summary.open` → S4 の `task.total.value`（`data-stat-completed`=7）と `task.cheer`（`data-milestone`=7、`task.cheer.at7`）→ S5 に同じ。演出（D-43）と reduce の確かめは r10 と同じ。語の検査は ja.json と en.json の全キーの値（`guide.*` を含む） |
| AC-36 | S3（S4、S5 にも） | r10 と同じ（`data-progress-index`、`data-progress-total`、`task.progress`、`task.progress.done`） |
| AC-37 | S6 → S3 → S4 → S5、S9 | r10 と同じ（`task.week`、`data-stat-days-completed-week`）。S3 の完了は 3 問に答える |
| AC-38（r11） | S3、S4、S5、S6 | S3 では `task.insight.text` が 0 件（DOM に置かない）。`task.summary.open` → S4 の `task.insight.text`、S5 でも同じ。`task.skip` → S6 では 0 件 |
| AC-39 | S2（1 問目） | r10 と同じ |
| AC-40 | S2（3 問目）→ S3、S8 | r10 と同じ |
| AC-41（r11） | S3（問 1） | `task.choice`（`data-choice-index` 0〜2）を押す → 300 ms 以内に `task.question` の `data-answer-result`=correct / incorrect、押した `task.choice` の `data-choice-state`=selected-correct / selected-incorrect、文言 `task.answer.result.correct` / `.incorrect` が、答える前から DOM にある空の `task.question.status`（`role="status"`、`aria-live="polite"`）の中に見える（`data-testid` も同名：D-48）。正解：`task.question.explain` が 1 つ（`data-explain-for="selected"`）。不正解：2 つ（selected と correct）、正解の `task.choice` が `data-choice-state`=correct。他の `task.choice` を押しても属性は変わらない。`task.question.next` が 1 つ現れ、`data-task-question-index`=1。`guide.character` の `data-mood` が correct / incorrect（表示の設定のとき）、`guide.say` の文は `guide.correct.1` / `guide.incorrect.1`（問の番号で選ぶ：D-55） |
| AC-42（r11） | S3 → S4、S10 | 問 3 に正解（正解 2、不正解 1）→ `task.summary.open` → S4 の `[data-testid="task.rate"]` の `data-score`=2、`task.rate.score` の文（「3 問中 2 問に正解しました」）、`task.insight.text`。S10 の行の `data-report`=done、`data-score`=2。語の検査は ja と en の全キーの値（D-65：ja に「点」「ランク」「レベルアップ」「XP」なし、en に points / score / rank / xp / level up なし） |
| AC-43 | 対応なし | 課題集の JSON の検査 |
| AC-44（r11） | S3（6 型 × ライト / ダーク） | `task.figure` の `data-figure-type`（flow / layers / compare / sequence / tree / split）、`role="img"`、`aria-label`=`alt`、`task.figure.label` の文字がすべて見え、`scrollWidth` 320 以下。線：`[data-figure-part="line"]` の計算済み `border-color`（箱と連結線）か `stroke`（矢印の SVG）と、`task.figure` の計算済み `background-color`（color.bg を明示する：D-52）の比が 3:1 以上。文字は axe-core。`task.figure` の中の `<img>` 0 件、図のための画像の要求 0 件（ミルの PNG は `guide.sprite` で、図の外） |
| AC-45（r11） | S1、S2、S3、S4、S8 | 1 通り目：S1 に `guide.character` 1 件（`data-mood`=idle。`guide.sprite` は `aria-hidden="true"`、幅と高さが 96 CSS px＝48 の 2 倍：D-54）、S2 で 0 件。2 通り目：答える前の S3 で 0 件、不正解の返しで 1 件（incorrect）、`task.question.next` で 0 件、S4 で 1 件（celebrate）。`task.question` の中の `task.question.text` と `task.choice` に `guide.character` は 0 件（`guide.character` は `task.question` の中の返しの区画 `task.question.feedback` にある：6）。reduce で `guide.character` の subtree に動くアニメーション 0 件。3 通り目：S8 の `settings.character.show`（`<label>`）を押して `settings.character.show.input` の `checked` を false にする → S1、S3 の返し、S4 で 0 件。S4 の `task.insight.text`、`task.total`、`task.cheer` は残る。語の検査：`guide.*` と `task.level.adjusted.*` の値（7 の表。禁止語 0 件、40 字以内） |

対応なし：AC-4、AC-29、AC-34、AC-43（課題集の JSON だけを検査する AC）。AC-30 は欠番。AC にない状態（D-30 の `task.dayChanged`）は r10 と同じ扱いで、verifier は探索で確かめる。

## 3. 画面の仕事と主操作、標準部品
主操作は 1 画面に 1 つ（B-2）。標準部品はネイティブの HTML 要素と WAI-ARIA APG の型。ランドマーク、ヘッダー、nav は r10 と同じ（ヘッダーは `position: static`。R-18、AC-31）。

| 画面 | 仕事（1文） | 主操作 | 使う標準部品 | 標準から外れる所（本来の部品、理由、対応） |
|---|---|---|---|---|
| S0 殻（loading / error） | JS が動くまでの地を出し、保存データが読めないときに次の一手を出す | `error.app.reload` | `<main>`、`<h1>`、`<p>`、`<noscript>`、`<button>` | なし |
| S1 diagnosis.start | 何が起きるかを 10 行以内で伝え、案内役を 1 回だけ紹介し、診断を始めさせる | `diagnosis.start.begin` | `<main>`、`<h1>`、`<p>`、`<aside>`（ミル：`guide.character`。絵は `<img>` か `<svg>`、台詞は `<p>`）、`<button>`、案内は `<section aria-labelledby>`、`<ol>`、隠した `<input type="file">` | ファイルの読み込み（r10 と同じ：D-27）。案内役の絵：本来は文字だけ（D-20）。理由：FB2-5（Takuma の要望）と PRD 9 の S-13。対応：絵は `aria-hidden`、台詞は文字で DOM にあり、設定で消せる（D-53、D-56） |
| S2 diagnosis.question | 1 問だけ見せて答えさせ、確定ごとに保存する | `diagnosis.next`（3 問目は `diagnosis.finish`） | `<form>`、`<fieldset>`、`<legend>`、`<input type="radio">`、`<label>`、`<button>`、`<p role="alert">`（未選択、保存の失敗、r12：領域のファイルが無くオフライン `error.tasks.offline`：D-61） | なし（r10 と同じ） |
| S3 task.today | 今日の課題 1 件を、題名と導入と図と問 1 が開いた瞬間に読める形で出し、問ごとに 1 回だけ選ばせて、その場で正誤と理由を返す | 表示中の問の `task.choice` ×3（同格。答えた後は `task.question.next`、問 3 の後は `task.summary.open`）。「今日はやめておく」`task.skip` は副操作 | `<article>`、`<h1>`、`<p>`、`<figure>`（図：`role="img"`）、`<section>`（問ごと）＋`<h2>`、`<div role="group" aria-labelledby>`（選択肢の入れ物）、`<button>`（選択肢。`aria-disabled` で確定後も読める）、`<div role="status" aria-live="polite">`（正誤の入れ物。描いた時点から空で置く：D-48）、`<aside>`（ミル）、`<p>`（説明）、`<button>`（次へ／まとめへ／やめておく） | 選択肢：本来は `<input type="radio">`＋確定ボタン（S2 の型）。理由：PRD 9「1 問につき 1 回、タップで選ぶと 300 ms 以内に返す」（FB2-2）で、選んだ瞬間に確定する操作は radio の「選択で文脈を変えない」（SC 3.2.2）と合わない。対応：列いっぱいの `<button>` を縦に 3 つ（44 px 以上、R-69）、答えた後は 3 つとも `aria-disabled="true"`（文字は読める。フォーカスできるが押せない）、正誤は描いた時点から置いた `role="status"` の入れ物に文字を入れて読み上げる（D-47、D-48）。図：本来は `<img>` と `alt`。理由：課題集は型とラベルだけを持ち画像ファイルを持たない（AC-44）。対応：`<figure role="img" aria-label>` の中に HTML と CSS で描き、ラベルは DOM の文字、子は role=img の中で presentational（D-50） |
| S4 task.rate | 完了の直後に、正答数、案内役の一言、累計、この段階の n / N、解説を 1 画面で返してから、役に立ったかを 1 回だけ聞く | 答える（`task.rate.helpful` と `task.rate.notHelpful` を同格の副操作として並べる） | `<main>`、`<article>`（`data-score`）、`<h1>`（印 `task.rate.mark`）、`<p>`（正答数、累計、進み具合、祝い）、`<aside>`（ミル celebrate）、`<h2>`+`<p>`（解説）、`<button>` ×3 | 完了の印（D-43。r10 と同じ）。案内役の絵（S1 と同じ対応） |
| S5 task.done | 終えた事実（正答数、累計、n / N、祝い、今週）を返し、続けるか止めるかを本人に委ねる | `task.next`（副操作の形：D-4） | `<main>`、`<article>`（`data-score`）、`<h1>`、`<p>`、`<button>`、`<h2>`+`<p>`、`<a>` | なし。ミルは出ない（D-53） |
| S6 task.skipped | 見送りを記録した事実を伝え、続けるか止めるかを本人に委ねる | `task.next` | `<main>`、`<h1>`、`<p>`、`<button>`、`<a>` | なし |
| S7 task.exhausted | 段階（または領域）の修了を祝い、次の段階へ進むか別の領域を選ばせる | levelDone：`task.exhausted.advance`。allDone：`task.exhausted.redo` | `<main>`、`<h1>`、`<aside>`（ミル celebrate）、`<p>`、`<button>` | 案内役の絵（S1 と同じ対応） |
| S8 settings | データを守る操作、診断のやり直し、案内役の表示、削除、記録への入口を 1 画面に置く | `settings.export`（保存データなしでは `settings.import`） | r10 と同じ＋`<input type="checkbox">`＋`<label>`（案内役の表示：D-56） | ファイルの読み込み（D-27） |
| S9 settings.stats | 13 の指標と 1 対 1 の 13 の値を、スクリーンショット 1 枚で送れる形で出す | `settings.stats.back` | `<main>`、`<h1>`、`<p>`、`<dl>`、`<a>` | なし |
| S10 history | 出した課題と結果（申告、正答数、選んだ答え）を新しい順に見せる | `history.empty.action`（0 件）/ 行の `history.row.answers`（選んだ答えの開閉） | `<main>`、`<h1>`、`<ol>`+`<li>`、`<details>`+`<summary>`、`<ol>`（選んだ答え 3 つ）、`<a>`、`<p>`（r12：領域のファイルを読めない行の注記 `history.row.unavailable`：D-61） | なし |
| ダイアログ settings.import.confirm / settings.delete.confirm | 取り消せない操作の前に、何が消えるかを見せて確かめる | `.ok` | ネイティブの `<dialog>`（r10 と同じ） | なし |

## 4. 決定と根拠
根拠のない決定は書かない。根拠は調査の R 番号、原則は WCAG / APG / MDN / HIG の URL か B 番号。r11 で書き直した行には「r11 で書き直し」、足した行は D-46 から。変えていない行は r10 のまま。

| 決定 | 根拠（R-n） | 原則（URL か B-n） |
|---|---|---|
| D-1 初回は S1（説明 10 行以内と「診断を始める」1 つ）→ S2 ×3 → S3。2 回目以降は開いたら S3 / S5 / S6 / S7 で、説明も案内も挟まない | R-7（ルールの説明は 10 行未満）、R-2・R-3・R-4（競合は登録が先）、R-5（地図が先） | B-1、B-2。差をつける点 1 |
| D-2 診断は 1 画面 1 問、進み具合「質問 n / 3」、ネイティブの radio、確定はボタン | R-8（one thing per page）、R-21（radio の操作） | https://www.w3.org/WAI/ARIA/apg/patterns/radio/ 、https://www.w3.org/WAI/WCAG22/Understanding/on-input.html |
| D-3（r11 で書き直し。FB2-2）S3 は題名を h1 にし、導入の本文 → 導入の図 → 問 1〜3（答えた問は残り、次の問が下に足される）→ 「今日はやめておく」を縦 1 列に並べる。申告の操作は `task.skip` の 1 つだけで副操作の形。「完了」ボタンは置かず、3 問目に答えた時点で完了になる（AC-42）。r12：3 問目に答えたら `task.skip` と `task.skip.note` を DOM から外す（完了した課題を no_time で上書きする操作を残さない：design-reviewer r5 の 3）。`task.skip.note` は 1 文にし、`task.skip` の `aria-describedby` で結ぶ（r5 の 11）。答えを書く欄は置かない（PRD 10） | R-6（1 日 1 つ）、R-16（320 px）、R-17（44 px）、R-66（返しは対象の直近に）、R-75（Duolingo の並び） | B-1、B-2、B-3 |
| D-4（r7 で書き直し。FB-2、FB-3）S5 と S6 は「確認ページ」の型で組む：終えた事実 → 次に起きること → 次に要るもの、の順。S5 は、h1（完了を記録した）→ 完了した課題の題名 1 行（Takuma の決定 D4、2026-10-30）→ 正答数 `task.rate.score`（r11。D-59）→ 累計（D-35）→ この段階の n / N 件目でした（D-44）→ 祝い（D-36）→ 今週の完了日数（D-39）→ `task.next.note`（明日も 1 件出る。続けるなら進める。次に出す組を出し終えているときは `task.next.note.last`：D-44）→ `task.next`（副操作の形の枠のボタン 1 つ）→ ひとこと解説（D-38。r8 でボタンの後ろに移した：D-45）→ 履歴へのリンク。S6 は h1（今日はやめておきました。r11）→（r11：段階の文 `task.skipped.levelHint` / `.levelChanged` は消した。段階は正誤で動き、知らせは次の S3 に出す：D-44 (3)、D-60）→ `task.next.note`（か `.last`）→ `task.next` → 履歴へのリンクで、解説も累計も祝いも労いも置かない（事実だけ）。「次の一手に進む」は塗りの主操作にせず、確認も催促も「もう 1 件どうですか」の再表示も置かず、何件目でも同じ位置に同じ 1 文と 1 ボタン。押すと同期で S3 を描き、フォーカスを h1 へ移す。連続日数、「途切れ」、次の課題の題名は出さない。再読み込みしても同じ画面に戻る | R-53（確認ページ：what happens next と次に要るリンク。戻れること）、R-44（Continue の連鎖の逆）、R-60（confirmshaming と nagging を置かない）、R-32（何度も出る画面に動きを足さない）、R-46（抜けを見せない）、R-6（データと注意を奪わない） | https://design-system.service.gov.uk/patterns/confirmation-pages/ 、https://www.deceptive.design/types/nagging 、B-1、B-2。差をつける点 2（調査 6.1） |
| D-5（r11 で書き直し）答えの欄は置かない（PRD 10「答えを書く欄」）。途中の保存は、問に答えた時点で `current.answers` に同期で保存する（AC-32）。「保存しました」の知らせは出さない（答えた事実は返しそのものが示す。B-2） | R-19（status は必要な所だけ）、R-66 | https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html 、B-1、B-2 |
| D-6（r11 で書き直し）外で行う課題の印と道具の一覧は置かない（v1 の課題集は全件 `in_app`：AC-29。`external` の語彙は契約に残るが画面の要素と文言キーは定義しない。`data-task-mode` は出す） | PRD 10 の「外で行う課題」の行、R-6 | B-1、B-2 |
| D-7 空とエラーは「何が起きたか」+「次の一手のボタン」の 2 要素。読み込み中に「0 件」を出さない | R-9、R-10 | https://www.nngroup.com/articles/empty-state-interface-design/ 、B-1 |
| D-8 エラーは問題の近く（入力欄の直下、ボタンの直上）に文字で出し、入力を保ち、やり直しのボタンを添える。エラーの知らせは `role="alert"` | R-10（near the element、preserve input）、R-19 | https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html 、https://www.w3.org/WAI/ARIA/apg/patterns/alert/ |
| D-9 取り消せない操作（全削除、読み込みの置き換え）は `<dialog>` で確認し、何が消えるかを文で見せる。初期フォーカスは「やめる」 | R-20 | https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ 、https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html |
| D-10 ホーム画面の案内（AC-21）は S1 の説明と「診断を始める」の間に、本文の一部として置く。ダイアログや固定のバナーにしない | R-18（固定のバナーがフォーカスを隠す）、R-24 | https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html 、B-2 |
| D-11 統計は 9 つの値（r7 で 11 に：D-42）を `<dl>` で縦に並べ、ラベルは PRD 13 の指標の語。グラフも色も使わない。日付は ISO 8601（YYYY-MM-DD）で、`data-stat-*` と見える文字を同じ値にする（Takuma の決定 D2、2026-10-30） | R-16、案A（研究 7） | B-1、B-5 |
| D-12 ダークモードは OS の設定に従い、独自の切り替えを置かない。`color-scheme: light dark` | R-22 | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme 、B-2 |
| D-13（r11 で書き直し）動きは 4 つだけ：「書き出しました」と `app.loading` の不透明度（motion.fade、150 ms）、S3 の返しの区画 `task.question.feedback` が現れるときの不透明度（motion.fade、150 ms。300 ms の返しの中に収まる）、S4 を描いた直後の完了の演出（D-43。1 秒未満、1 回）。画面の切り替え、図、案内役の絵には動きを付けない（絵は表情の差し替えだけ）。`prefers-reduced-motion: reduce` ではどれも 0 ms（@keyframes は `(prefers-reduced-motion: no-preference)` の中にだけ書く：tech-lead r5） | R-23、R-32、R-67（頻繁な操作に動きを足さない）、R-72 | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion 、B-6 |
| D-14 本文 16 px、行間 1.6、14 px 未満なし、書体はシステムの sans-serif 1 つ、文字の段階は 4 つ | R-26、R-25 | https://design.digital.go.jp/foundations/typography/ 、B-4 |
| D-15（r11 で書き直し。案D「5 色」）色は地 1 つ、文字 2 つ、主操作 1 色、意味色 3 つ（成功、注意、エラー）、枠、フォーカスに、図の強調 1 色（color.figure.accent：橙）と案内役の色 1 色（color.guide：ミルの紫）を足した 12 個。足した 2 色は図の強調（枠と文字）と案内役（名前の文字と台詞の左の線）だけに使い、主操作と意味色に流用しない。すべて 3 通りの値（ライト、ダーク、上げる）を tokens に持ち、比を 9 に書く | R-13、R-14、R-15、R-68（同じ色に別の意味を持たせない）、R-69、R-71、R-89（地との明度差で選ぶ）、調査 7.2 の案D | https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html 、https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html 、B-5 |
| D-16 押せる範囲は 44 × 44 CSS px 以上（主操作、申告、設定の操作、radio のラベル）。単独のリンクは上下に space.3 の内側と `min-width: 44px` で 44 × 44 にする（tokens 4） | R-17 | https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html |
| D-17 フォーカスの枠は 3 px の `outline` と 2 px の `outline-offset`、色は color.focus | R-15 | https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html |
| D-18（r11 で書き直し）幅 320 px で横スクロール 0：要素は常に縦に積む。選択肢 3 つは常に縦。返しの区画は幅 480 px 未満で絵と文字を縦に積む（D-54）。図は型ごとに 480 px 未満で縦に組み直す（D-51）。`text-overflow: ellipsis` を使わない | R-16、R-73（compact では幅を使い切る） | https://www.w3.org/WAI/WCAG22/Understanding/reflow.html 、B-3 |
| D-19（r11 で書き直し）文言はです・ます、絵文字と感嘆符なし、ボタンは動詞。案内役の台詞だけ「くだける」側に 1 段寄せ（問いかけと短い相づちを許す）、それでも感嘆符、絵文字、評価語（「すごい」）は使わない。正誤の文言は「正解」「惜しい」（「不正解」「間違い」「残念」「失敗」は全キーで 0 件：AC-45）。英語は同じ調子で動詞始まり | R-11、R-12（性格語「一緒に」）、R-35（interjections は不誠実に響く）、R-74（personalization は台詞だけ）、調査 5 の r3 の追記 | https://www.nngroup.com/articles/tone-of-voice-dimensions/ 、https://developer.apple.com/design/human-interface-guidelines/writing 、B-1 |
| D-20（r11 で書き直し）アイコンは置かない。例外は 3 つだけで、どれも `aria-hidden` にし意味は文字が持つ：(1) S4 の完了の印 `task.rate.mark`（D-43）、(2) 正解の印 `task.answer.mark`（返しの文言「正解」の先頭と、正解の選択肢の中。D-48。線 1 本のチェックで D-43 と同じ path）、(3) 図の矢印（流れと分岐。D-51）。案内役の絵は「アイコン」ではなく挿絵で、D-53 で扱う。閉じるボタンも文字「閉じる」 | R-7、R-34、R-70（記号は色の補助）、R-73（形で補う） | https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html 、B-2 |
| D-21 リンクは下線を必ず付ける（色だけで区別しない） | R-7 | https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html |
| D-22 S10 の行の答えは `<details>`/`<summary>` で畳む（長い答えで一覧が崩れない。キーボードで開閉できる） | R-16 | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details |
| D-23 権限（保存の永続化）は画面で求めず、初めて S3 を出した直後に `persist()` を 1 回だけ呼ぶ。断られたら S8 に注意と「書き出す」を置く | R-9（次の一手）、PRD 11 の冒頭 | B-1 |
| D-24 読み込みの失敗は、選んだファイルのそば（読み込みのボタンの直下）に「読めなかった」+「理由と直し方」の 2 文。確認は出さない | R-10 | https://www.nngroup.com/articles/error-messages-scoring-rubric/ |
| D-25 `forced-colors: active` では色の値を持たず、枠と下線で意味を保つ（印は枠、リンクは下線、エラーは文字） | R-15 | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors |
| D-26（r11 で書き直し）選択肢の確定と「今日はやめておく」に数秒の取り消しを置かない。選択肢：1 回で確定（PRD 10「選び直し」）し、押し間違いの影響は 1 問の正誤で、段階は 2〜3 件の履歴で動く（AC-8）ので 1 回では変わらない。予防は、選択肢の文字を列いっぱいに読めるようにし（44 px、間 space.2）、押した瞬間の見た目（tokens 4）で押したことを返す。「今日はやめておく」：事前の注記 `task.skip.note`（履歴に移り、次の一手で続けられる）と副操作の形で予防する。理由は r10 の (1)〜(4) と同じ | R-6、R-10、R-17 | https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html 、B-2 |
| D-27 ファイルの読み込みは S1 と S8 で同じ型：見える `<button>`（副操作の形。保存データなしの S8 では主操作の形）が、隠した `<input type="file">` の `click()` を呼ぶ。input は `tabindex="-1"` と `aria-hidden="true"` でフォーカスと読み上げの順から外し、フォーカスの枠と名前はボタンが持つ。テストは input に setInputFiles する（9） | R-17（押せる範囲）、R-15（フォーカスの枠） | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file 、https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html 、B-6 |
| D-28 ホバーと押した瞬間の見た目は tokens 4 の決まりだけ（ホバーは下線、押した瞬間は塗りと文字の入れ替え）。新しい色も transition も足さない | R-15（枠と状態の 3:1）、R-7（色は意味にだけ） | https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html 、B-5 |
| D-29 ホーム画面のアイコンと manifest を置く。アイコンは `apple-touch-icon` 180 × 180 px の PNG 1 枚（生の大きさ 4,000 バイト以下。契約 budgets.md の 1 と 6。2026-11-04 に 10,000 から下げた）で、地は color.bg（ライト）1 色、中央に「一」1 字を color.text（ライト）。影、枠、グラデーション、別の色は使わない。manifest は `name` と `short_name`「今日の一手」、`display: standalone`、`start_url` と `scope` は `./`。形の詳細は 8（Takuma の決定 D5、2026-10-30） | R-24（iOS は `apple-touch-icon` 180 × 180 を読む）、R-7（色は意味にだけ） | https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html 、B-2、B-5 |
| D-30 画面を開いたまま日付が変わった後の最初の操作（ボタン、リンク、radio の確定。契約 data.md 4）は実行せず（PRD 11 の冒頭。指揮役の決定 2026-11-03：docs/approvals/delegation.md）、着いた翌日の S3（か S7）の `<main>` の先頭に知らせ `task.dayChanged`（`<p role="status" tabindex="-1">`、text.body、color.warning）を 1 つ出し、フォーカスをそこへ移す（画面の先頭までスクロールする）。文は「日付が変わった」「直前の操作は無効」「前の課題は履歴にある」の 3 点で、どの操作（申告、評価、nav、アプリ名）の後でも同じ 1 キー。履歴へのリンクは足さない（ヘッダーの `nav.history` が 1 タップで届く。B-2）。読み込みで翌日に着いたときは出さない（AC-6 の通常の経路）。次の操作か再読み込みで消え、保存しない。着いた先が S1 / S2（保存データなし、診断の途中）のときは出さない（履歴に移る課題がない） | R-27（1 状態の可視化、9 問題を正確に示す）、R-28（`tabindex="-1"` でフォーカスを移す）、R-19（status）、R-10（エラーの見た目にしない、責めない） | https://www.nngroup.com/articles/ten-usability-heuristics/ 、https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html 、B-1、B-2 |
| D-31 S8 の `settings.storage.notPersisted` は、S8 を描くたびに `navigator.storage.persisted()` で今の状態を読み、`false` のときだけ出す。保存した `device.persistGranted` は表示の判定に使わない（古くなる。指揮役の決定 2026-11-03）。`persisted()` がない、または例外のときは出さない（「許可しませんでした」と言い切れないため）。`persist()` は後の日に求め直さない（U-14 で決定。指揮役の決定 2026-11-04、契約 data.md 11） | R-29（断られた要求は後で評価し直される。`persisted()` で今の状態）、R-27（8 出続ける注意は効き目が薄れる）、R-31 | https://web.dev/articles/persistent-storage 、B-1 |
| D-32（r12：対象のキー `task.answer.limit` は r11 で消した（答えを書く欄が無い）ので、この決定は空にし、番号だけ残す。color.warning の使い所は D-30、D-31 と案内の h2：tokens.md 1） | R-10 | B-5 |
| D-33 案内（`home.addToHomeScreen`、`home.standalone`）は四方を 1 px の color.border で囲む（塗りと影はない）。理由：「閉じる」（または読み込み）で消える範囲を見せるためで、余白だけでは「閉じる」が何を消すかが見えない。これが tokens 1「箱を置かない」の唯一の例外で、他の場所には広げない | R-30（境界の中は一群と受け取られる。使いすぎると散らかる）、R-18（重ねずに本文の一部として置く） | https://www.nngroup.com/articles/common-region/ 、B-1、B-2 |
| D-34（r11 で書き直し。FB2-3）完了の直後は S4 の 1 画面に収める：h1「完了しました」→ 正答数 `task.rate.score`（「3 問中 {n} 問に正解しました」。点数の語を使わない：AC-42）→ ミル（celebrate。台詞は正答数で変わる：D-55）→ 累計 → この段階の n / N 件目でした → 祝い → ひとこと解説 → 「役に立ったか」の問い → 答える 2 ボタンと「今回は答えない」。正答数を先に置く理由：FB2-3「合っていたかが分かる」の答えがこの画面の仕事で、問 1〜3 の返しの合計を最初に 1 行で言う。「次の一手に進む」は S4 に置かない | R-44、R-53、R-56、R-57、R-35（最も大事な情報を先に）、R-75（正解と自分の答えを並べる型の総括） | https://www.nngroup.com/articles/progressive-disclosure/ 、B-1、B-2 |
| D-35（r7）累計（完了した課題の総数。S9 の `data-stat-completed` と同じ値）は S4、S5、S7 に 1 行：ラベル `task.total.label`（text.small、color.text.secondary）と値 `task.total.value`（「{count} 件」。text.title、color.text）。値は本文より大きい唯一の非見出しの文字で、色は付けない（S4 で数字が増える動きは D-43。動きの後も色は color.text）。新しい text style は足さない（B-4 の 4 段に収めるため text.title を使う。r8：Takuma の答え「控えめな演出」で手応えは動きと色が補うので、5 段目は足さずに閉じた：10 の U-18）。指揮役の決定 2026-11-05（docs/approvals/delegation.md：本文より大きい text style で 1 行出す。案A'） | R-34（feedback は文字で受け取れるように。色や動きだけに頼らない）、R-16（320 px で折り返す）、R-43（連続記録の数字と同じ効き目の証拠はない。だから数字を大きくし、動きは D-43 の 1 秒未満に留める）、調査 7.1 の案A' | https://developer.apple.com/design/human-interface-guidelines/feedback 、B-4、B-5 |
| D-36（r7。r8 で文と色を直した）節目の祝いの文：`task.cheer` の要素 1 つに、累計が 7 / 30 / 100 のときはそれぞれ `task.cheer.at7` / `.at30` / `.at100`、それ以外は `task.cheer.default`「{count} 件目を終えました。」の文言を入れ、`data-milestone` に 7 / 30 / 100 / none を書く。文は数えられる事実（「7 件目を終えました。最初の節目です。」「11 件目を終えました。」）で、初めての完了でも事実のまま（「今日も」のような回数を前提にした語は使わない：design-reviewer G1 r3 の提案 6）。感嘆符、絵文字、「すごい」のような評価の語を使わない。色：節目のときだけ文字を color.success にする（文が節目を言うので色は添えるだけ。色だけで意味を伝えない）。節目でないときは color.text。動き：`task.cheer` 自体は動かない（動くのは D-43 の印と累計の数字だけ）。紙吹雪、拡大、キャラクター、音は置かない。「連続」「途切れ」「逃した」「streak」「missed」は文言ファイルの全キーで 0 件（AC-35） **r11 の追記**：ミルは S4 で常に celebrate（節目でなくても。AC-45）で、節目かどうかは台詞 `guide.rate.milestone` と `task.cheer` の文と色で分ける（D-55）。「紙吹雪、拡大、キャラクター、音は置かない」のうちキャラクターは r11 で外した（FB2-5） | R-42、R-43（節目は少ない日だけ特別）、R-35（light and congratulatory でも「Let's do it!」より「Send」。interjections は不誠実に響く）、R-34（色で出す feedback は文字でも受け取れるように）、R-46（失う恐れで動かさない）、R-7（色は意味にだけ） | https://developer.apple.com/design/human-interface-guidelines/writing 、https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html 、B-2、B-5 |
| D-37（r7）S3 の進み具合は文字だけ：日付の行の直後、h1 の前に `task.progress`「この段階の {index} / {total} 件目」（text.small、color.text.secondary。S2 の「質問 n / 3」と同じ位置と text style）。`<progress>` も棒も使わない。同じ日の 2 件目以降は日付の行を `task.today.label.nth`「今日 {nth} 件目の課題 {date}」に差し替える（1 件目は `task.today.label` のまま）。値は `task.today` の要素の `data-progress-index`、`data-progress-total`、`data-task-nth-today`。r8：`data-progress-index` は「表示中の課題（`current`）の領域と段階の組で、`history` にある行の数 + 1」（none の行も数える）、`data-progress-total` はその組の総数。目標の組ではなく表示中の課題の組で数える（まだ申告していない S3 のまま診断をやり直すと目標の組と違うため：tech-lead G1 r2 の要修正 2、AC-14 の 2 通り目）。終えた後（S4、S5）の同じ数は D-44 | R-37（progress indicator は待ち時間用で一時的。学習の進み具合は対象外）、R-59（`<progress>` には別のラベルが要る）、R-65（GOV.UK は「Completed」を文字で示す）、R-16 | https://developer.apple.com/design/human-interface-guidelines/progress-indicators 、B-1、B-4 |
| D-38（r7）ひとこと解説は `<h2>` `task.insight`「ひとこと解説」+ `<p>` `task.insight.text`（課題集の `insight`。text.body）。折りたたまない（`<details>` は開く操作が 1 つ増える）。S4 では祝いの直後、問いの直前に置く（終えた直後に読む場所）。S5 では `task.next` の後ろ、履歴のリンクの前に置く（r8。S4 で読んだ文を読み返せる位置に残し、続けるか止めるかの決定を先に見せる：D-45）。S3 と S6 の DOM には置かない（AC-38 の 0 件）。r11：S4 では祝いの直後、問いの直前（ミルは正答数の直後で、解説の前：D-34）。見出しに「答え」「正解」の語を使わない | R-56（staged disclosure：考える → 答える → 解説）、R-57（retrieval の後に確かめる。先に出すと retrieval にならない）、R-58（折りたたみは操作が増える）、R-55（plain language） | https://www.learningscientists.org/blog/2016/6/23-1 、B-1 |
| D-39（r7）今週の完了日数は文と数字だけ：`task.week`「今週（月曜から）の完了日数：{days} 日」を S5 の末尾（`task.next.note` の前）と S9 の `<dl>` に出す。曜日の並び、7 つのドット、灰色の抜けた日、先週の値は出さない（先週の識別子を定義しない：AC-37）。「月曜から」は省かない（`ja-JP` の暦の慣習は日曜始まりで、PRD の週は ISO 8601 の月曜始まり）。指揮役の決定 2026-11-05（docs/approvals/delegation.md） | R-46（抜けた日の灰色は「直したいエラー」に見える）、R-61（`ja` と `en-US` の firstDay は 7）、R-62（ISO の週は月曜始まり）、R-63（Apple の週の要約は数だけ）、R-16 | https://en.wikipedia.org/wiki/ISO_week_date 、B-1、B-5 |
| D-40（r7）S7 は 2 変種。levelDone（初級か中級を出し終えた）：h1 `task.exhausted.levelDone`「{area}の{level}を修了しました」→ 累計（D-35）→ `task.exhausted.levelDone.detail`（この段階の {total} 件をすべて出した。進むと今日から出る）→ `task.exhausted.next`（次の段階の名前と、診断の選択肢と同じ 1 行の説明 `level.<次>.desc`）→（補足の 1 文。r8 で条件を 2 つに分けた：(a) 次の段階の組にまだ出していない課題が 1 件以上あり、かつ履歴にその組の行があるときは `task.exhausted.seenNext`：前に出したものを除いて続く。難しければ別の領域も選べる。(b) 次の段階の組をすべて出し終えているときは `task.exhausted.nextDone`：進むとその次の案内が出る。どちらでもなければ出さない。tech-lead G1 r2 の提案 1）→ 主操作 `task.exhausted.advance`「{nextLevel}に進む」（塗り）→ 副操作 `task.exhausted.redo`「別の領域を選ぶ」。`advance` は段階を 1 つ上げて保存し、同じ日に次の課題を出して S3。次の段階も出し終えていれば、上げた段階を保存したうえで新しい段階の S7 を描く（tech-lead G1 r2 の提案 2）。S7 は保存しない状態なので、今日の行がある日に操作で着いた S7 は再読み込みで S5 / S6 に戻る（指揮役の決定 2026-11-05）。allDone（上級を出し終えた）：h1 `task.exhausted.allDone`「{area}の上級を修了しました」→ 累計 → `task.exhausted.allDone.detail`（上級の {total} 件をすべて出した。新しい課題は次の版。別の領域、または同じ領域の別の段階を選べる）→ `task.exhausted.redo`（塗り。唯一の操作）。「難しすぎ」2 回で下がった先の組を出し終えていた場合（tech-lead G0 r3 の提案 4）は、levelDone の `task.exhausted.seenNext` の条件（履歴に同じ領域で次の段階の行がある）に当たるので、進む先の段階名をそのまま言い、責めず隠さず、別の領域の選択肢を添える。段階の説明は診断の選択肢と同じキーを使う（paiza の S〜E の 1 行定義の型） | R-51（paiza：順に解くとレベルアップ。ランクに 1 行の定義）、R-52（Exercism：終えると次が開く）、R-65（修了を文字で）、R-35（avoid blame。次の一手を明示）、R-53（確認ページ：次に起きることと次に要るもの）、R-9（空の状態は何が起きたか + 次の一手） | https://design-system.service.gov.uk/patterns/confirmation-pages/ 、B-1、B-2 |
| D-41（r7）診断の入口を未経験に開く：S1 の `diagnosis.start.lead.1` を「コードを書いたことがない人から現役のエンジニアまで使えます」の趣旨に差し替え、S2 の 1 問目の各選択肢にヒント文 `area.<ID>.desc`（1 文、句点なし、リンクなし、ja / en とも 40 字以内、専門用語を使わない）、2 問目の段階の説明を PRD 9 の趣旨（初級＝コードをほとんど書いたことがない、中級＝仕事や学習で書いている（人に聞きながらでもよい）、上級＝設計を決め、人に教えている）に書き直し、3 問目の先頭に `years.never`「まだコードを書いたことがない」を足す（5 択。数直線の順）。ヒント文と説明は radio の `<label>` の中（text.small、color.text.secondary）に置き、読み上げでは選択肢の名前に続けて読まれる。置き場所の注記（r8。design-reviewer G1 r3 の提案 8）：R-54 の GOV.UK はヒントを `<label>` の外に置き `aria-describedby` で結ぶ型で、この仕様とは置き場所が違う。R-54 から採るのは文の書き方（1 文、句点なし、リンクなし）と「読み上げソフトはヒントを読む」の 2 点だけ。label の中に置く理由は、押せる範囲をヒント文まで広げられること（R-17）と、名前の一部として必ず読まれること、9 個分の id の対応を作らずに済むこと。WCAG 2.2 SC 2.5.3（見える文字が名前の先頭）はどちらでも満たす。2 問目の legend は「この領域（{area}）で、今の段階に近いものを選んでください」にし、段階の説明（コード全般の経験の言い方）をその領域での経験として読めるようにする（提案 9）。別の説明画面は足さない（r11：案内役ミルは S1 に 1 回出るが、S2 には出さない：D-53） | R-54（radio のヒント文：1 文、句点なし、リンクなし。読み上げは全文。置き場所は採らない）、R-17（押せる範囲）、R-55（技術用語は先に説明する。専門家にも平易な言葉）、R-36（onboarding は文脈の中のヒントで。別の流れを足さない）、R-50（Progate は「大丈夫」を先に置くが、不満は用語）、R-8（one thing per page） | https://design-system.service.gov.uk/components/radios/ 、https://www.nngroup.com/articles/plain-language-experts/ 、B-1 |
| D-42（r7）S9 に 2 行を足して 11 行にする：`settings.stats.daysCompletedWeek`（今週（月曜から）の完了日数。`data-stat-days-completed-week`）を `daysCompleted7d` の直後に、`settings.stats.extraCompleted`（同じ日の 2 件目以降の完了件数。`data-stat-extra-completed`）をその直後に。ラベルは PRD 13 の指標の語。形は D-11 のまま（`<dl>`、グラフも色もなし） | R-16、R-61（「月曜から」を明記） | B-1、B-5 |
| D-43（r8。Takuma の答え「控えめな演出を足す」：docs/approvals/001-daily-learning-FB1.md の末尾）完了の瞬間の演出は、S4 を「完了」の直後に描いたときに 1 回だけ、1 秒未満で、次の 2 つの要素だけが動く。**(1) 完了の印** `task.rate.mark`：h1「完了しました」の先頭に置く inline SVG（印と文字の間は space.2。`viewBox="0 0 24 24"`、幅と高さ 1em（text.title の 24 px に追従）、`aria-hidden="true"`、`focusable="false"`。中は `<path d="M6 12.5l4 4L18 8" pathLength="1">` のチェック 1 本。線は `stroke: currentColor`（h1 の中で印だけ color.success）、太さ 2.5（viewBox の単位）、`stroke-linecap: round`。塗りなし）。描かれ方は `stroke-dasharray: 1` と `stroke-dashoffset` を 1 → 0 にする @keyframes（motion.draw、ease-out）。**(2) 累計の数字** `task.total.value`：描いた時点から最終の値（新しい累計）と `data-stat-completed` を持つが、motion.delay.tick（300 ms）までは不透明度 0。同じ位置に `aria-hidden="true"` の `<span>` `task.total.prev`（前の累計 = count − 1 を `task.total.value` と同じ文言で。value と prev を `position: relative` の inline-block の包み（`<span>`。識別子なし）に入れ、prev を `position: absolute` で重ねる。prev は value の子にしない（value の textContent を「7 件6 件」にしない：AC-35）。包みの大きさは value が決めるので、値が 2 行目に落ちる幅でも prev は value に重なる：6、9。design-reviewer G1 r4 の提案 2、r9）を置き、300 ms の時点で prev が上へ 0.3em 動いて消え（不透明度 1 → 0）、value が下から 0.3em 上がって現れる（不透明度 0 → 1）。どちらも motion.tick（250 ms）、ease-out。prev は `animationend` で DOM から外す。拡大、回転、ぼかし、色の点滅はしない（R-40 の引き金を避ける）。**節目（累計 7 / 30 / 100）の「少し特別」**：印の中にチェックより先に円 `<circle cx="12" cy="12" r="10.5" pathLength="1">` を描き（motion.draw）、円が描き終わってからチェックを描く（motion.draw の遅延）。数字の動きは円の分だけ遅れる（motion.delay.tick + motion.draw = 700 ms から）。`task.cheer` の文字を color.success にする（D-36）。節目でないときは円を置かず、チェックだけ。**時間の表**（0 は S4 を描いた時点）：通常＝チェック 0〜400 ms、数字 300〜550 ms、以後静止（550 ms）。節目＝円 0〜400 ms、チェック 400〜800 ms、数字 700〜950 ms、以後静止（950 ms）。どちらも 1 秒未満で 1 回だけ、自動で繰り返さない（Takuma の「1 秒未満」。R-39 の 5 秒より十分短い）。**操作を待たせない**：3 つのボタンは描いた瞬間から押せ、途中で押せば S5 へ移る（R-32「Let people cancel motion」）。**他の画面では動かない**：S5（S4 から進んだ後も、再読み込みでも）、S6、S7 では印も prev も作らず、累計は静止した最終の値。S4 を再読み込みすると S5 なので、演出が再生されることはない。同じ日の 2 件目以降の完了でも S4 では同じ演出（1 件ごとの完了が同じ瞬間だから。待たせないので「何度も出る画面に動きを足さない」（R-32、調査 2.1）に反しない）。**`prefers-reduced-motion: reduce` のとき**：動きなしで最終の状態だけ。印（節目なら円とチェック）は完成した形で出る（`stroke-dashoffset: 0`）、`task.total.prev` は作らない、`task.total.value` は最初から不透明度 1。色（印と節目の文の color.success）は reduce でも同じ（色は WCAG の motion animation に含まれない：R-38。静止した色であって点滅や変化ではない）。したがって 1 秒後の見た目は reduce の有無で同じで、5.1 で別に撮らない。verifier は reduce を偽装して `document.getAnimations()` が 0 件、`task.total.prev` が 0 件を確かめる（AC-35 の行）。**読み上げ**：印は `aria-hidden`、prev も `aria-hidden`、value は最初から最終の値で `aria-live` を付けない（S4 は h1 にフォーカスを移し、h1 から順に読む：9）。途中の値（prev）は読み上げの対象に入らない。**色の組**：color.success on color.bg（印の線は非文字で 3:1 以上、節目の `task.cheer` は 16 px の文字で 4.5:1 以上）：6.29 / 10.43 / 9.95 / 14.28（9 の表の既存の行。新しい色は足さない）。`forced-colors: active` では `currentColor` がシステム色になり、印は線として残る。**作り**：動きは app.css のクラスと @keyframes だけ（CSP：`style` 属性とインラインのスタイルを使わない。契約 budgets.md 3）。SVG は `createElementNS` で作り `innerHTML` を使わない（ADR 0005）。JS は view-task.js の中で、`matchMedia('(prefers-reduced-motion: reduce)').matches` のときはクラスを付けず prev を作らない。新しいファイルも依存も要らない。`pathLength` は Safari 14 から使える（tech-lead が契約 budgets.md 5 の一覧で確かめた。実機で効かなかったときの代わりは dasharray と dashoffset に実長を書く：チェック約 17.33、円約 65.97。10 の U-21、閉じた）。**入れないもの**：紙吹雪、音、拡大、連続記録、ハート。**r11 の追記（FB2-5）**：ミル（celebrate）は S4 の正答数の直後に静止した絵として置く（D-53）。D-43 の動きは印と数字だけで、絵は動かない。印の 400 ms と数字の 250 ms はそのまま。「キャラクターを置かない」は r11 で外した | R-32（purposefully、brevity and precision、cancel できる、頻繁な操作に足さない）、R-33（Reduce Motion では zooming、scaling を減らす。fade で代える）、R-38（SC 2.3.3：操作で始まる動きは無効にできる。色と不透明度は motion animation に含まれない）、R-39（SC 2.2.2：5 秒以内）、R-40（引き金は拡大、回転、多方向、周辺視野の横移動）、R-41（unobtrusive、brief、subtle。注意を奪う動きは dark pattern）、R-34（feedback は文字でも受け取れるように）、R-42、R-43（節目の日だけ少し特別）、R-46（失う恐れで動かさない）、R-23 | https://developer.apple.com/design/human-interface-guidelines/motion 、https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html 、https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html 、B-5、B-6 |
| D-44（r11 で書き直し）終えた後に進み具合と次に起きることを返す。(1) `task.progress.done`（S4 と S5。r10 と同じ）。(2) `task.next.note.last`（S5 と S6。r10 と同じ）。(3) 段階の変化は申告ではなく正誤で起きる（AC-8）ので、S6 の `task.skipped.levelHint` / `.levelChanged` は消し、変化の知らせは次の課題の S3 に `task.level.adjusted.down` / `.up` で出す（D-60） | R-27、R-53、R-65、R-35、R-51 | https://design-system.service.gov.uk/patterns/confirmation-pages/ 、B-1 |
| D-45（r8。design-reviewer G1 r3 の提案 5）S5 の並びは、決定に要るものを先に、読み返すものを後に：h1 → 題名 → 正答数（r11。D-59）→ 累計 → この段階の n / N 件目でした → 祝い → 今週の完了日数 → `task.next.note`（か `.last`）→ `task.next` → h2 ひとこと解説 + 本文 → 履歴へのリンク。解説をボタンの後ろに置く理由：S4 で読んだ直後で、S5 の仕事は「続けるか止めるか」の決定。続ける人は 1 件ごとに S4 → S5 を通るので、ボタンまでに読み直す文を増やさない（R-44 の「two obligatory clicks」に近づけない）。解説は消さず（再読み込みで読み返せる。AC-38）、位置だけ下げる。S4 から来ても再読み込みでも同じ並び（AC-5）。初期表示に入るかの見積もり（トークンから。実測は G3）：幅 390 でボタンの上端は約 446 px（ヘッダー 56 + 題名の上 32 + h1 34 + 題名 2 行 45 + 累計 34 + 進み具合 22 + 祝い 26 + 今週 26 + 注記 2 行 51 + 余白 16 × 6 と節の間 24 = 446。r8 の「約 430」は足し違い：design-reviewer G1 r4 の提案 4、r9）で、表示域の目安 664 px に入る。幅 320 では約 472 px（祝いも 2 行）で、表示域の目安 460 px を超え、初期表示には入らない（8 に明記。320 は AC-17 の折り返しの条件で、初期表示の条件ではない） | R-53（確認ページ：次に起きることと次に要るものを先に）、R-56（読み返すものは後ろに）、R-44（Continue の連鎖を避ける）、R-27（7 効率）、R-16 | https://design-system.service.gov.uk/patterns/confirmation-pages/ 、https://www.nngroup.com/articles/progressive-disclosure/ 、B-1、B-2 |
| D-46（r11。FB2-1、FB2-2）S3 の流れは「導入と図 → 問 1 → 返し → 次の問題へ → 問 2 → … → 問 3 の返し → まとめへ」の 1 列。問は答えるまで次を出さず（未回答の問は 1 つだけ DOM にある）、答えた問は返しごと残す（AC-32 の復元と、問 1 の返しを読み返しながら問 2 を考えられるようにするため）。各問は `<section data-testid="task.question">` で、`<h2>` `task.question.heading`「問 {n} / {total}」→ `task.question.text` →（任意の図）→ `role="group"` の選択肢 3 つ → 返しの区画 `task.question.feedback`（答えた後だけ）。「次の問題へ」を押すと次の問の h2 にフォーカスを移し、前の問のミルは消える（D-53）。r12：再読み込みで復元したときは、答えた問 n の返しに「次の問題へ」を置かず（押したかどうかは保存しない：tech-lead r3 の要修正 1）、問 n+1 を未回答で足す。「まとめへ」は問 3 の返しの直下。`data-task-question-index` は答えた問の数で、`task.today` の要素に持つ | R-66（返しは対象の直近に）、R-74（spatial contiguity、coherence）、R-75（問題 → 答える → 返し → 次へ）、R-82（解説を読んでから問題に挑む）、R-8（1 画面 1 つの問い）、R-56（staged disclosure）、調査 3.2 の示唆 1 | https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/ 、https://www.nngroup.com/articles/progressive-disclosure/ 、B-1、B-2 |
| D-47（r11。AC-41、AC-18）選択肢は列いっぱいの `<button data-testid="task.choice">` を縦に 3 つ（間 space.2、高さ 44 px 以上、文字は左寄せで折り返す、副操作の形：枠 size.border の color.border）。押すと同期で確定し、300 ms 以内に返しを描いてから `data-answer-result` を付ける（契約 test-hooks.md の区間。tech-lead r5 の (4)）。答えた後は 3 つとも `aria-disabled="true"` を付け（`disabled` は付けない：フォーカスでき、文字が読め、`forced-colors` で灰色にならない）、押しても何も起きない（Enter / Space も同じ）。`data-choice-state` は selected-correct / selected-incorrect / correct / none。選んだ選択肢の枠は size.border.strong（2 px）にし、選んだ印を文字 `task.choice.tag.selected`「選んだ答え」で添える。正解の選択肢（選んだかどうかを問わない）には印 `task.answer.mark`（チェック、color.success）と文字 `task.choice.tag.correct`「正解」を添える。none の選択肢は見た目を変えない（薄くしない：コントラストを保つ）。r12：保存に失敗したとき（5 の S3）は 3 つとも押せるままで、別の選択肢を押せばその選択肢で保存を試み、成功した答えで返しを描く（エラーは成功するまで残る）。`error.storage.retry` は最後に押した選択肢を再び試す（design-reviewer r5 の 9）。`aria-disabled="true"` の選択肢にはホバーと押した瞬間の見た目を当てない（tokens.md 4。r5 の 8） | R-69（タップの的、色だけに頼らない）、R-17、R-21（キーボード）、R-15（枠 3:1）、調査 3.2 の示唆 3 と 6 | https://www.w3.org/WAI/ARIA/apg/patterns/button/ 、https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html 、https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html 、B-1 |
| D-48（r11。AC-41、調査 r3 の示唆 5）正誤は文言 ＋ 印 ＋ 色の 3 つで示し、赤と緑の対にしない。正解：`<p role="status" data-testid="task.answer.result.correct">` に印 `task.answer.mark`（inline SVG、1em、color.success、`aria-hidden`）＋文字「正解」（text.heading、color.success）。不正解：`<p role="status" data-testid="task.answer.result.incorrect">` に文字「惜しい」（text.heading、color.text）だけ。印は、選んだ選択肢の太い枠と「選んだ答え」の文字、正解の選択肢のチェックで示す。不正解に color.error を使わない（エラーと同じ色で意味が衝突する：R-68）。色は正解の緑 1 つで、不正解は色を足さない。r12（design-reviewer r5 の 2、tech-lead r3 の 3）：live region は中身を変える前に DOM にあることが要る（MDN）ので、各 `task.question` を描いた時点で、選択肢の group の直後に空の `<div role="status" aria-live="polite" data-testid="task.question.status">` を置き、答えたときにその中へ `task.answer.result.correct` / `.incorrect` の `<p>` を入れる（`<p>` に `role="status"` は付けない。`data-testid` と文言キーは変えない）。再読み込みの復元では中身ごと描いてよい（読ませる必要がない）。入れ物は 1 問に 1 つで、説明の段落は入れない（読み上げが長くなる。説明は DOM の順で続けて読める）。G3 で Safari の VoiceOver で実際に読まれることを確かめる（5.1 の #75） | R-66、R-68、R-69（red-green pairing を避ける）、R-70（記号で補う）、R-19（status）、E-27（笑わない、責めない） | https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html 、https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html 、https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions 、B-5 |
| D-49（r11。AC-41、FB2-3）説明は常に出し、任意で開かせない。正解のとき：`task.question.explain.label.selected`「選んだ答えについて」（text.small、color.text.secondary）＋ `<p data-testid="task.question.explain" data-explain-for="selected">`（中身は選んだ選択肢の `explain` そのもの。text.body）。不正解のとき：上に加えて `task.question.explain.label.correct`「正解について」＋ `<p data-testid="task.question.explain" data-explain-for="correct">`（正解の `explain`）。順は「選んだ答え → 正解」（自分の答えから読む：R-75 の型）。折りたたまない | R-75（Duolingo は任意で開かせるが、当アプリは常に出す：差をつける点 2）、R-58（折りたたみは操作が増える）、R-57、E-26、E-27 | https://www.nngroup.com/articles/progressive-disclosure/ 、B-1 |
| D-50（r11。AC-44）図の共通の形：`<figure data-testid="task.figure" role="img" aria-label="{alt}" data-figure-type data-figure-of="intro|question" data-figure-highlight="{index}">`。中は HTML と CSS だけ（矢印の小さな形は `createElementNS` の inline SVG。`<img>` も画像ファイルも持たない。tech-lead r5 の (3)）。role=img の子は presentational なので、ラベルは読み上げの対象にならず、意味は `alt`（中身を説明する文。課題集）が持つ。地：`background-color: var(--color-bg)` を図の要素に明示する（透明にしない。線の対比の測定に要る：D-52）。箱：枠 size.figure.border（2 px）の color.text、角 size.radius.figure（8 px）、内側 space.2 と space.3、塗りなし。ラベル：`<span data-testid="task.figure.label" data-figure-part="label">`、text.body、color.text、`overflow-wrap: anywhere`。強調（`highlight` の位置）：枠を size.figure.border.accent（3 px）の color.figure.accent にし、ラベルを太さ 700 で color.figure.accent にする（色と太さの両方で示す）。線と矢印：`data-figure-part="line"`、2 px、color.text。図には動きも背景の模様も付けない。幅は列いっぱい（max は size.content.max）。図の上下の外側は space.4 | R-71（線は 3:1）、R-73（few key pieces、色だけに頼らない、形で補う、ラベルは短く、compact では幅を使い切る、中身を説明する）、R-74（signaling は 1 か所）、R-67（動きなし）、R-90（手描き風は採らない）、調査 3.3 の示唆 1〜6、tech-lead r5 の 2 (3) と (5) | https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html 、https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/ 、B-1、B-5、B-6 |
| D-51（r11。AC-44）6 型の組み方（r12 で横並びの条件を直した：design-reviewer r5 の 10。横並びにするのは「図の幅 600 px 以上、かつ箱（tree と split は子）が 3 個以下」のときだけ。それ以外は縦。文字 200% でも崩れないように、高さを固定しない。根拠：幅 600 の列 568 px から矢印 24 × 2 と間 8 × 4 を引いて 3 で割ると 162 px、内側 24 px を引いた 138 px に 16 px の文字が 8 字入り、12 字のラベルが 2 行で収まる。箱 4 個では文字の幅 101 px（4 字 × 3 行）、5 個では 82 px なので縦にする。幅 480〜599 の 3 個では 98 px（6 字 × 2 行）で読めるが、規則を 1 つにするため 600 で切る）。**flow（箱と矢印 2〜5）**：横並びの条件を満たすときだけ横 1 列に箱と「→」。それ以外は縦 1 列に箱と「↓」。矢印は inline SVG（`data-figure-part="line"`、stroke 2 px、`stroke-linecap: round`、幅 24 px）。**layers（積み重ね 2〜5）**：常に縦に積む（labels[0] が上）。隣り合う箱は枠を共有（上の箱の下枠を省く）。**compare（見出し 2 と行 1〜3。ラベル 4〜8）**：常に 2 列の grid（列の間 space.2）。1 行目は見出し（太さ 700、下枠 2 px）、以下は labels[2i]、labels[2i+1] の対。ラベルは列の中で折り返す（幅 320：列 288 を 2 列と間 8 に分けて 140 px、内側 24 px を引いた 116 px に 16 px の文字が 7 字で、12 字は 2 行。文字 200% の幅 390：余白と内側も rem で 2 倍になり、文字の幅は約 103 px で 32 px の文字が 3 字、12 字は 4 行。高さを固定しないので崩れない。r12 で数字を直した）。**sequence（番号つき 2〜5）**：常に縦。各段は番号の丸（枠 2 px、直径 32 px、文字 text.body 700）＋ラベル。番号は CSS の counter（`::before`）で描き、`alt` に順序を書く。**tree（親 1 と子 2〜4）**：横並びの条件（幅 600 以上かつ子 3 個以下）を満たすときだけ親の箱の下に子を横 1 列（間 space.2。親から子へ縦の線 1 本と横の線 1 本。`data-figure-part="line"` の `border`） / それ以外は子を縦 1 列にし左に縦の線（border-left 2 px）と各子への短い横線。**split（1 → 2〜3）**：tree と同じ配置で、線の代わりに矢印（inline SVG）を使う（分岐は「向き」、木は「所属」）。強調は 6 型とも「ラベルの箱 1 つ」（compare は 1 セル、sequence は 1 段）で、`highlight` がなければ強調なし | R-16（reflow）、R-73、R-74、調査 3.3 の示唆 3、tech-lead r5 の提案 3（compare は 4〜8） | https://www.w3.org/WAI/WCAG22/Understanding/reflow.html 、B-3 |
| D-52（r11。AC-44 の線の対比。tech-lead と合わせる案）PRD r13 の (a) を採る：図の部位に `data-figure-part`（label / line / box）を置き、`line` の要素の計算済みの `border-color`（箱と連結線）か `stroke`（矢印の SVG）と、図の要素 `task.figure` の計算済みの `background-color`（D-50 で color.bg を明示する）を比べる。理由：(1) トークンの数値だけを検査する (b) では、実装が別の色を当てても検査が通る。(2) `background-color` を明示すれば「透明」の問題が消える。(3) 強調の枠（color.figure.accent）は `box` の `border-color` で、同じ式で地と 3:1 以上を確かめられる。補助として tokens.md 1 の表の数値（9 の表に転記）を (b) の形でも持ち、ライト 5.02 / ダーク 8.99 / 上げる 9.06 と 13.78 を G1 の契約に書く。箱の枠（color.text）は 16.48 / 15.29 | R-71、R-15、verifier r5 の要修正 2 | https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html |
| D-53（r11。AC-45、PRD 9・11）案内役ミルが出る場所は 4 か所だけ：S1（idle、台詞 `guide.intro`）、S3 の表示中の問の返しの区画 `task.question.feedback`（correct / incorrect。答えた直後に返しと一緒に出て、「次の問題へ」で次の問に進むと消える。r12：再読み込みで復元した返しにも出す（指揮役の決定 2026-11-06。AC-23 の件数が前後で同じになる）。復元の規則：答えた問が n 件（1〜2）のとき、問 n の返しにだけ出し、`data-mood` は `answers[n-1].correct` から決める。問 1〜n−1 の返しには出さない。問 n の「次の問題へ」は出さず、問 n+1 を未回答で出す。返しの区画のフェードは当てない。問 n+1 に答えると、ミルは問 n+1 の返しへ移る）、S4（celebrate。正答数の直後）、S7（celebrate。h1 の直後）。出ない場所：S2、S3 の導入と未回答の問（1 問も答えていない S3 では `guide.character` が 0 件：AC-31）、`task.question.text` と `task.choice` の中、S5、S6、S8、S9、S10、S0、エラーの中。要素は `<aside data-testid="guide.character" data-mood="idle|correct|incorrect|celebrate" aria-label="{guide.name}">` の中に絵 `guide.sprite`（`aria-hidden="true"`。PNG を `<picture>` で切り替える `<img alt="">`：tech-lead r3 の 3 の推し。ADR で確定：U-27）。S3 を描いた時点で、今の配色の correct と incorrect の 2 枚を `new Image()` で先に読む（返しの 300 ms に絵のデコードを待たせない：tech-lead r3 の提案 3）、名前 `guide.name`（text.small、color.guide）、台詞 `guide.say`（text.body、color.text。中身は `guide.*` の 1 つ）。絵の大きさと位置は 4 表情で同じ（正誤で絵を大きくしない、笑わない） | R-76（正解のときだけ動く型を採らない）、R-77、R-85（簡素な絵に愛着）、E-27（笑ってくる、の逆）、E-30（意味のないキャラクターへの不満 → 出る場所を固定）、調査 3.4 の示唆 1、6.2 の差をつける点 2 | https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/ 、B-1、B-2 |
| D-54（r11。FB2-6、AC-45）絵は 48×48 の索引色 PNG（8 色以内。ミルは 7 色：characters/miru.txt）を画面で 2 倍の 96×96 CSS px に固定して出す（`width: 96px; height: 96px; image-rendering: pixelated`。rem にしない：文字の拡大で非整数倍にならないため。AC-45 の整数倍）。ライトとダークで輪郭だけが違う 2 枚（`miru-<mood>.png`、`miru-<mood>-dark.png`）。仕様の前提は PNG のまま `<picture>`（`<source media="(prefers-color-scheme: dark)">`）で切り替える案 (b)（tech-lead r3 の 3：配色ごとに 1 枚だけ要求される。ADR で確定：U-27。案 (a) でも仕様は変わらない）。返しの区画の並び：幅 480 px 以上は絵を左（96 px）、右に名前と台詞と説明（間 space.3）。480 px 未満と文字 200% は絵の下に名前と台詞を縦に積む。台詞の左に 2 px の縦線（color.guide）を引き、ミルの発言だと分かるようにする（吹き出しは描かない：B-2）。体の塗り #B48CE0 は地と 2.70 しかないが、形は輪郭（color.text。16.48 / 15.29）で持つ（SC 1.4.11 は輪郭で満たす。目と口の線と体は 6.10） | R-86（8 色以内）、R-87（4 色で作れるものが良い。拡大は整数倍）、R-85、tech-lead r5 の 3（pixelated は Safari 10 から）、characters/README.md 7.1 と 7.4、contrast.md r2 | https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering 、B-6 |
| D-55（r11。AC-45）台詞は `guide.*` の 15 キー（7。r12）。1 回 40 字以内（コードポイント。ja と en とも）、です・ます、問いか事実か短い相づち、感嘆符と絵文字と評価語なし、催促なし、禁止語（残念、ダメ、失敗、間違い、不正解、サボ、まだやって、fail、wrong、stupid、lazy）0 件。正解 `guide.correct.1`〜`.3`、不正解 `guide.incorrect.1`〜`.3`（r12：問の番号 n で `guide.correct.{n}` / `guide.incorrect.{n}` を選ぶ。1 日 3 回とも同じ 1 文だと読み飛ばす飾りに寄る（design-reviewer r5 の 7）ので 3 本にし、規則は固定でテストできる。不正解は一緒に考える文：問題文に戻す、2 つの説明を見比べる、正解の説明を読んでまとめへ。G3 で Takuma に見てもらう：U-30）、S4 は正答数で `guide.rate.score0`〜`.score3`（0 問でも責めず、3 問でも評価語を使わない）、節目（7 / 30 / 100）は `guide.rate.milestone` を優先、S7 は `guide.exhausted.levelDone` / `.allDone`。課題の中身に触れる台詞（「順番がポイントでした」）は課題ごとの文を持てないので置かず、課題に依らない文にする。名前 `guide.name`「ミル」/「Miru」は台詞の上に小さく出す。en の 40 字は約 7 語で、15 本とも収まることを 7 で数えた（11）。`guide.rate.score1` は確かめられない問いをやめ、事実の文にした（r5 の 7） | R-35（評価語と interjection を避ける）、R-60（催促しない）、R-74（personalization は会話調の台詞で、本文は変えない）、R-85（heartfelt）、調査 3.4 の示唆 5、5 の r3 の追記 | https://developer.apple.com/design/human-interface-guidelines/writing 、B-1 |
| D-56（r11。AC-45）設定 S8 に節「案内役」：`<label data-testid="settings.character.show">`「案内役のミルを表示する」の中に `<input type="checkbox" data-testid="settings.character.show.input">`（r12：見える文字を持つ要素の `data-testid` は文言キー、文字を持たない input は `.input`：design-reviewer r5 の 11）（既定 on。保存データ `showCharacter`）と注記 `settings.character.note`「非表示でも解説、累計、祝いは出ます」。外すと 4 か所すべてで `guide.character` が 0 件になり、解説、累計、祝い、正誤の文言と印はそのまま。ネイティブの checkbox（ラベル全体 44 px、`accent-color`）。保存は変えた時点で同期（失敗したら `error.storage.message` + `error.storage.retry` を直下に） | R-21（ネイティブ部品）、R-17、E-30（キャラクター不要の人がいる）、PRD 13 のガードレール（非表示の割合） | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/checkbox 、B-1 |
| D-57（r11。AC-45、D-43 との関係）`prefers-reduced-motion: reduce` のとき、ミルの絵と台詞は静止した最終の状態で出る（動きはもともと無い。返しの区画の不透明度 motion.fade も 0 ms）。`guide.character` の subtree に CSS アニメーションを書かない（`@keyframes` は返しの区画の親に当て、reduce では当てない）。D-43 の「控えめな演出」との関係：S4 で動くのは印（400 ms）と数字（250 ms）だけで、ミルは動かない。S3 の返しで動くのは区画の不透明度（150 ms）だけ。したがって「控えめ」（1 秒未満、1 回、拡大なし）はミルを足しても変わらない | R-32、R-33、R-38、R-67、R-72、R-39 | https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html 、B-6 |
| D-58（r11。案D、Q28）tokens.md 1 に color.figure.accent（橙：ライト #B45309、ダーク #F2A33A、上げる #7A3400 / #FFC877。地との比 5.02 / 8.99 / 9.06 / 13.78。線 3:1 と文字 4.5:1 をどの設定でも満たす）と color.guide（ミルの紫：ライト #7E55C2（体の陰の色）、ダーク #B48CE0（体の色）、上げる #5B2FA8 / #DCCBF5。地との比 5.30 / 6.93 / 8.69 / 13.90。名前の 14 px の文字と 2 px の線に使う）を足す。橙は color.warning と色相が近い（比 1.49 / 1.26）ので、同じ部品の中に並べない：color.warning は文（`task.dayChanged`、`settings.storage.notPersisted`、案内の h2）だけ、color.figure.accent は図の中（3 px の枠と 700 の文字）だけに限る。S3 で `task.dayChanged`（画面の先頭の文）と図（本文の中の枠）が同じ画面に出ることはあるが、場所と形が違う。見た目で混ざると Takuma が判断したら第 2 候補の紫系（characters/README.md 3）に替える（10 の U-23） | R-68、R-69、R-71、R-89、R-13、調査 7.2、characters/README.md 3 と 7.4 | https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html 、https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html 、B-5 |
| D-59（r11。AC-42）正答数は `task.rate.score`「3 問中 {n} 問に正解しました」（{n} は 0〜3、{total} は 3。text.body、color.text。要素 `task.rate` と `task.done` の `data-score`）。0 問のときも同じ形（「3 問中 0 問に正解しました」）で、責める語も慰める語も足さない（ミルの `guide.rate.score0` が一緒に考える 1 文を言う）。S5 でも同じ 1 行を h1 の直後に出す。「点」「得点」「満点」「スコア」「ランク」の語は全キーで使わない | R-35（avoid blame）、R-53（事実を先に）、E-27（点数で責められる不満）、PRD 10（点数と XP） | https://developer.apple.com/design/human-interface-guidelines/writing 、B-1 |
| D-60（r11。AC-8）段階が変わった直後の課題の S3 に、`task.progress` の直後（h1 の前）に `<p data-testid="task.level.adjusted.down">`「直近の課題の正答数に合わせて、段階を{level}にしました。」または `.up`「直近の 3 件が全問正解だったので、段階を{level}に上げました。」（text.body、color.text。色を付けない：注意でもエラーでもない）。その課題の S3 にだけ出し、再読み込みでも出る（表示中の課題が「段階が変わった後の最初の課題」である間）。次の課題からは出ない。{level} は変わった先の `level.*`。禁止語の対象（AC-45） | R-27（システムの状態を見せる）、R-35（blame しない）、R-51（paiza：段階の変化を 1 行で）、R-10（注意をエラーに見せない） | https://www.nngroup.com/articles/ten-usability-heuristics/ 、B-1 |
| D-61（r12 で書き直し。AC-23 の 3 通り目。PRD 11「組のファイルを貯め終える前のオフライン」。課題集は 6 領域に分ける：指揮役の仮の決定 2026-11-06。G1 の ADR で確定）領域のファイルは 1 領域 1 ファイルで全段階を含むので、`task.next`（S5 / S6）と `task.exhausted.advance`（S7）ではファイルを取り直さず、オフラインの例外は無い。ファイルが要るのは (1) S2 の `diagnosis.finish`（初回は 1 問目の確定で裏で取り始め、終えるときに待つ。やり直しで別の領域へ移るときも同じ）と (2) S10 の、履歴にある別の領域の行（題名と選んだ選択肢の文）だけ。(1) SW が貯め終える前にオフラインで取れないときは、S2 を 3 / 3 のまま変えず、radio の回答を保ち、保存せず、`diagnosis.finish` の直上に `<p role="alert" data-testid="error.tasks.offline">`「課題のファイルをまだ取り込めていません。ネットにつないでから、もう一度進めてください。」と `task.next.retry`「もう一度進む」（副操作の形。`diagnosis.finish` と同じ処理を呼ぶ）を出す。統計の出した件数は増えない。(2) S10 では行を消さず、`history.row.taskTitle` に題名の代わりに課題の ID（`data-task-id` と同じ文字）を出し、題名の直下に `history.row.unavailable`（text.small、color.text.secondary。エラーの色にしない：その場で直す操作が無い）を 1 行出し、`history.row.answers` は出さない（選択肢の文が無い）。`history.row.score` と申告は保存データにあるので出す。行に `data-title-unavailable="true"` | R-10（問題の近く、何が起きたか、どう直すか、責めない）、R-9（次の一手のボタン）、R-27（1 状態の可視化）、tech-lead r3 の要修正 2 と 7 | https://www.nngroup.com/articles/error-messages-scoring-rubric/ 、B-1 |
| D-62（r11。AC-7、AC-42）S10 の行：日付、題名、`report.done` / `.noTime` / `.none`、正答数 `history.row.score`「3 問中 {n} 問」（答えた問が 0 件の行は出さない）、done のときだけ `helpful.*`、答えた問があれば `<details>` `history.row.answers`「選んだ答えを見る」の中に `<ol>` で問ごとに「{選んだ選択肢の text}」＋ 文字「正解」/「惜しい」（`task.answer.result.*` と同じ文言。`history.row.answer.item`、`data-correct`）。答えを書く欄が無くなったので `history.row.answer` / `.answerText` は消す。行の `data-score`。r12：領域のファイルを読めない行は D-61 (2) | R-16、R-22、R-58（畳む操作は読み返すものだけ） | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details 、B-1 |
| D-63（r11。AC-24）S9 は 13 行：r10 の 11 行から `settings.stats.tooHard` を消し、`settings.stats.questionsAnswered`（答えた問題数）、`.questionsCorrect`（正解した問題数）、`.lowScoreTasks`（正答 1 以下で完了した課題数）を `.rated` の直後に足す。形は D-11 のまま | R-16、PRD 13 の指標 | B-1、B-5 |
| D-64（r11。AC-18）キーボード：選択肢は `<button>` なので Tab で順に止まり、Enter / Space で確定する。確定後は次に現れた `task.question.next` へフォーカスを移さず、DOM の順で Tab すれば届く（結果の文は `role="status"` で読まれる。フォーカスを勝手に動かさない：SC 3.2.2）。「次の問題へ」を押したら次の問の h2（`tabindex="-1"`）へフォーカスを移す（新しく現れた内容の先頭）。「まとめへ」で S4 の h1 へ。r12：再読み込みで復元した S3 ではフォーカスを動かさない（読み込みで着いた画面は文書の先頭から読む：他の画面の読み込みと同じ。問 n+1 の h2 へ移すのは `task.question.next` の経路だけ） | R-21、R-28（`tabindex="-1"` でフォーカスを移す）、R-19 | https://www.w3.org/WAI/WCAG22/Understanding/on-input.html 、https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html |
| D-65（r11。AC-42、AC-45 の語の決まり）文言ファイルの全キーで使わない語：ja「[0-9０-９]点」「点数」「得点」「満点」「ランク」「レベルアップ」「XP」「連続」「途切れ」「逃した」。en：`\b(points?|score|rank|xp|level up|streak|missed)\b`。`guide.*` と `task.level.adjusted.*` ではさらに「残念」「ダメ」「失敗」「間違い」「不正解」「サボ」「まだやって」、en `\b(fail|failed|failure|wrong|stupid|lazy)\b` を使わない。7 の表を書いた時点でスクリプトで 0 件を確かめた（11） | R-35、R-60、E-27、PRD の AC-35、AC-42、AC-45 | B-1 |

## 5. 画面ごとの状態
該当しない状態は「なし」と理由（r12：すべての「なし」に理由を書いた。design-reviewer r5 の 6。「権限」と「一部だけ読めたとき」の列の「冒頭の理由」はこの段落を指す）。オフラインは全画面で通常と同じ（アプリは読み込み後に通信を使わない。AC-12。図は HTML と CSS、ミルの絵は配布物にあり SW が貯める：AC-23）。例外は、課題集を 6 領域に分ける前提（D-61）で、SW が貯め終える前にオフラインで別の領域のファイルが要るとき（S2 の `diagnosis.finish`、S10 の別の領域の行）。S5、S6、S7 では起きない（次の課題と次の段階は同じ領域のファイルの中）。「一部だけ読めたとき」は、保存は 1 キーの JSON を全体で検査して通るか落ちるかの 2 択なので S0 の error 以外は「なし」。「権限を断られたとき」は、求める権限が初めて S3 を出した直後の `persist()` だけなので、S3 と S8 以外は「なし」。r10 から変えていない行は要点だけ書き、詳細は r10（git の履歴。コミット 7516095 の時点）と同じ。

| 画面 | 通常 | 空 | 読み込み中 | エラー | オフライン | 権限を断られたとき | 一部だけ読めたとき |
|---|---|---|---|---|---|---|---|
| S0 殻 | r10 と同じ（`data-state="loading"`。1 秒後に `app.loading`。`<noscript>`） | なし（殻は内容を持たない） | 上の loading そのもの（R-9） | r10 と同じ：(1) 読めない → `error.app.*`（reload、exportRaw、delete）。(2) 保存先が使えない → `error.app.storageUnavailable.*` + reload | 通常と同じ | なし（この画面で求める権限はない） | エラー (1) と同じ扱い |
| S1 diagnosis.start | ヘッダー（アプリ名、`nav.settings`）。h1 `diagnosis.start.title`、`diagnosis.start.lead.1`〜`.3`、ミル `guide.character`（idle。`guide.sprite`、`guide.name`、`guide.say`=`guide.intro`。lead の直後、主操作の前：D-53）、主操作 `diagnosis.start.begin`。案内（スタンドアロン、iOS の Safari）は r10 と同じ。`showCharacter` が false ならミルは 0 件 | なし（この画面が「保存データなし」の表示そのもの） | なし（同期で出る） | 読み込み（案内から）の失敗 → r10 と同じ `error.import.*` | 通常と同じ | なし（冒頭の理由） | なし（冒頭の理由） |
| S2 diagnosis.question | r10 と同じ（進み具合、legend、radio、ヒント文、次へ／終える／前へ／やめる）。ミルは出ない。r12：1 問目の確定で領域のファイルを裏で取り始める（画面は変えない） | なし（選択肢は固定） | なし（画面は同期で描く。領域のファイルの取得は裏で始め、`diagnosis.finish` だけがその完了を待つ：待つ間は 3 / 3 のまま `diagnosis.finish` に `aria-busy="true"` を付けて 2 度押しを無視し、1 秒を超えたら直上に `app.loading` の文を出す：R-9） | r10 と同じ（未選択、保存の失敗） | 通常と同じ。例外（r12）：`diagnosis.finish` で領域のファイルが SW に無くオフライン → S2 の 3 / 3 のまま、radio の回答を保ち、保存せず、`diagnosis.finish` の直上に `error.tasks.offline` + `task.next.retry`。オンラインで `task.next.retry` → S3（初回と、やり直しで別の領域へ移るとき：D-61、AC-23 の 3 通り目） | なし（冒頭の理由） | なし（冒頭の理由） |
| S3 task.today（問 0 / 3：開いた直後） | `task.today.label`（か `.nth`）、`task.progress`、（段階が変わった直後の課題なら `task.level.adjusted.down` / `.up`：D-60）、h1 `task.today.title`、`task.meta`、`task.intro.text`、導入の図 `task.figure`（`data-figure-of="intro"`）、問 1 の `task.question`（`task.question.heading`、`task.question.text`、任意の図、`task.choice` ×3。`data-answer-result` なし）、`task.skip.note` と `task.skip`。`guide.character` は 0 件（AC-31）。`task.insight.text` は DOM にない（AC-38）。日付が変わった知らせ `task.dayChanged`（D-30）は r10 と同じ | なし（出せる課題がないときは S7） | なし（AC-15 は殻の loading の時間） | 選択肢を押した後の保存の失敗（`current.answers`）→ 押した問の選択肢の直下に `error.storage.message` + `error.storage.retry`（`role="alert"`）。返しは描かず、`data-answer-result` は付けず、選択肢は押せるまま。`error.storage.retry` で保存に成功すれば返しを描く。r12：別の選択肢を押せばその選択肢で保存を試み、成功した答えで返しを描く（エラーは成功するまで残る）。`error.storage.retry` は最後に押した選択肢を再び試す（D-47） | 通常と同じ | 初めて S3 を出した直後の `persist()` が断られても S3 は変わらない（知らせは S8） | なし（冒頭の理由） |
| S3 task.today（問 n に答えた返し。n = 1〜3） | 答えた問の `task.question`（`data-answer-result`=correct / incorrect）の、描いた時点から置いてある `task.question.status`（`role="status"`）に `task.answer.result.correct`（印＋「正解」）か `.incorrect`（「惜しい」）が入り、その直下に返しの区画 `task.question.feedback`：`guide.character`（correct / incorrect。台詞は `guide.correct.{n}` / `guide.incorrect.{n}`。いま答えた問だけ）→ 説明（`task.question.explain.label.selected` + `task.question.explain`。不正解なら `.label.correct` + 2 つ目）→ 主操作 `task.question.next`（問 3 の後は `task.summary.open`）。3 つの `task.choice` は `aria-disabled="true"`、`data-choice-state` が selected-correct / selected-incorrect / correct / none。前の問の返しは残り、ミルは消えている。「今日はやめておく」は問 1、2 の後は最後の問の下に残り、問 3 に答えたら `task.skip` と `task.skip.note` を DOM から外す（D-3）。再読み込みで復元した返し（n = 1〜2）：問 n の返しにミル 1 件（`answers[n-1].correct`）、問 n の `task.question.next` なし、問 n+1 を未回答で出す、フェードなし、フォーカスは動かさない（D-53、D-64。U-24） | なし（返しは選んだ選択肢と課題集から同期で描く。一覧を持たない） | なし（返しは同期。300 ms 以内） | 「次の問題へ」の保存は要らない（答えた時点で保存済み）。3 問目に答えたときの履歴への移動の保存の失敗 → 問 3 の選択肢の直下に `error.storage.message` + `error.storage.retry`（返しは描かない。選び直しは上の行と同じ） | 通常と同じ | なし（求めるのは初めて S3 を出した直後の `persist()` だけで、返しでは求めない） | なし（冒頭の理由） |
| S3 task.today（今日はやめておく） | `task.skip` を押す → 同期で S6。確認は出ない（D-26）。3 問目に答えた後は `task.skip` が無い（D-3） | なし（操作 1 つで、一覧を持たない） | なし（保存と S6 の描画は同期） | 保存の失敗 → `task.skip` の直上に `error.storage.message` + `error.storage.retry`。S3 のまま、答えた返しも保つ | 通常と同じ | なし（冒頭の理由） | なし（冒頭の理由） |
| S4 task.rate | `<article data-testid="task.rate" data-score>`：h1 `task.rate.title`（印 `task.rate.mark`。フォーカスを移す）→ `task.rate.score` → `guide.character`（celebrate。`guide.rate.score0`〜`.score3`、節目なら `guide.rate.milestone`）→ `task.total`（演出：D-43）→ `task.progress.done` → `task.cheer` → `<h2>` `task.insight` + `task.insight.text` → `task.rate.question` → `task.rate.helpful`、`task.rate.notHelpful` → `task.rate.close`。`showCharacter` が false ならミルは 0 件で他は同じ | なし（固定の要素。一覧を持たない） | なし（S3 の「まとめへ」の直後に同期で描く） | 回答の保存の失敗 → ボタン群の直上に `error.storage.message` + `error.storage.retry` | 通常と同じ | なし（冒頭の理由） | なし（冒頭の理由） |
| S5 task.done | `<article data-testid="task.done" data-score>`：h1 `task.done.title`（フォーカス）→ `task.done.task` → `task.rate.score`（同じ文言キー）→ `task.total`（静止）→ `task.progress.done` → `task.cheer` → `task.week` → `task.next.note`（か `.last`）→ `task.next` → `<h2>` `task.insight` + `task.insight.text` → `task.done.history`。ミルは出ない。再読み込みでも同じ | なし（固定の文。一覧を持たない） | なし（S4 の回答か再読み込みの直後に同期で描く） | `task.next` の後の保存の失敗 → `task.next` の直上に `error.storage.*`（r10 と同じ） | 通常と同じ（r12：次の課題は同じ領域のファイルの中にあるので、オフラインの例外は無い：D-61） | なし（冒頭の理由） | なし（冒頭の理由） |
| S6 task.skipped | h1 `task.skipped.title`（フォーカス）→ `task.next.note`（か `.last`）→ `task.next` → `task.skipped.history`。解説、累計、祝い、正答数、ミルは出さない（`task.insight.text` 0 件：AC-38） | なし（固定の文。一覧を持たない） | なし（同期で描く） | S5 と同じ | 通常と同じ（S5 と同じ理由：D-61） | なし（冒頭の理由） | なし（冒頭の理由） |
| S7 task.exhausted | levelDone：h1 `task.exhausted.levelDone`（フォーカス）→ `guide.character`（celebrate。`guide.exhausted.levelDone`）→ `task.total` → `task.exhausted.levelDone.detail` → `task.exhausted.next` →（`task.exhausted.seenNext` か `.nextDone`）→ `task.exhausted.advance` → `task.exhausted.redo`。allDone：h1 `task.exhausted.allDone` → `guide.character`（celebrate。`guide.exhausted.allDone`）→ `task.total` → `task.exhausted.allDone.detail` → `task.exhausted.redo`。日付が変わった知らせと再読み込みの扱いは r10 と同じ | この画面が「出せる課題 0 件」の空の表示そのもの（D-40） | なし（同期で描く。課題集は配布物） | `task.exhausted.advance` の保存の失敗 → 直上に `error.storage.*`（r10 と同じ） | 通常と同じ（r12：次の段階は同じ領域のファイルの中にあるので、`task.exhausted.advance` にオフラインの例外は無い。「別の領域を選ぶ」の先の S2 で起きる：D-61） | なし（冒頭の理由） | なし（冒頭の理由） |
| S8 settings | r10 の節（データ、診断、ホーム画面、記録、削除、版、プライバシー）に、節「案内役」（`settings.character.title`、`settings.character.show`（checkbox。既定 on）、`settings.character.note`）を節「診断」の直後に足す。保存データなしのときは r10 と同じ表示で、節「案内役」も出す（診断前の S1 にもミルが出るため。`showCharacter` は保存データ「なし」でも書ける：契約 data.md。tech-lead と合わせる：10 の U-25） | 保存データなし（r10 と同じ） | なし（節は固定で同期に描く。`persisted()` の答えが来るまでは注意を出さないだけ：D-31） | (1) 読み込みの失敗（r10 と同じ）。(2) `settings.character.show` の保存の失敗 → checkbox の直下に `error.storage.message` + `error.storage.retry`。checkbox の見た目は押した後の値のまま | 通常と同じ | 永続でないとき `settings.storage.notPersisted`（r10 と同じ：D-31） | なし（冒頭の理由） |
| S9 settings.stats | h1、`settings.stats.today`、`<dl>` 13 行（6 の順。D-63）、`settings.stats.note`、`settings.stats.back` | 診断直後は 0 と初めて開いた日（本当の 0） | なし（13 の値は保存データから同期で計算する） | なし（表示だけ。保存しない） | 通常と同じ | なし（冒頭の理由） | なし（冒頭の理由） |
| S10 history | h1、`<ol>` に新しい順の `history.row`（`data-task-id`、`data-date`、`data-report`、`data-helpful`、`data-score`）。行の中：日付、題名、`report.done` / `.noTime` / `.none`、`history.row.score`（答えた問が 1 件以上）、done なら `helpful.*`、答えた問が 1 件以上なら `<details>` `history.row.answers`（D-62） | 0 件：`history.empty` + `history.empty.action` | 行は保存データから同期で描く。別の領域のファイルは SW の cache から非同期に読み、読めるまでその行の題名の位置に課題の ID を出し、読めたら題名と `history.row.answers` に差し替える（r12） | 領域のファイルを読めない行（SW に無くオフライン）→ 題名の代わりに課題の ID、題名の直下に `history.row.unavailable`、`history.row.answers` なし、行に `data-title-unavailable="true"`。他の行と、その行の `history.row.score` と申告はそのまま（D-61 (2)。r12） | 通常と同じ | なし（冒頭の理由） | なし（冒頭の理由） |
| ダイアログ settings.import.confirm / settings.delete.confirm | r10 と同じ | なし（固定の文） | なし（同期で開く） | r10 と同じ | 通常と同じ | なし（冒頭の理由） | なし（冒頭の理由） |

### 5.1 全画面・全状態の一覧（G3 でスクリーンショットを撮る単位）
撮る条件は r10 と同じ（通常の状態はライト、ダーク、AX5（文字 200%、幅 390）、英語の 4 通り。ほかはライト 1 枚。幅 390。S4 は演出の 1 秒後）。AC-44 の図 6 型 × 2 配色（幅 320）は受け入れテストが撮る（#17〜#22）。r11 で足した行には「r11」。

| # | 画面 | 状態（変種） | どう出すか | r11 |
|---|---|---|---|---|
| 1 | S0 | loading | JS を止めて開く | |
| 2 | S0 | error（読めない） | 壊れた JSON を seed | |
| 3 | S0 | error（保存先が使えない） | localStorage の例外を注入 | |
| 4 | S1 | 通常（ミル idle、案内なし） | 保存データなし | r11（ミル） |
| 5 | S1 | iOS の Safari の案内 | UA の偽装 | |
| 6 | S1 | スタンドアロンの案内 | `display-mode: standalone` の偽装 | |
| 7 | S1 | 読み込みの失敗（案内の中） | 版が新しいファイル | |
| 8 | S1 | ミル非表示 | `showCharacter` false の seed | r11 |
| 9 | S2 | 1 問目（ヒント文） | 診断を始める | |
| 10 | S2 | 2 問目 | 1 問目を確定 | |
| 11 | S2 | 3 問目 | 2 問目を確定 | |
| 12 | S2 | 未選択のエラー | 選ばずに確定 | |
| 13 | S2 | 保存の失敗（AC-11） | 注入 | |
| 14 | S2 | やり直し（`diagnosis.cancel` あり） | S8 の `settings.redo` | |
| 15 | S3 | 通常（問 0 / 3。題名、導入、図 flow、問 1） | 診断を終える | r11 |
| 16 | S3 | 同じ日の 2 件目（`task.today.label.nth`） | S5 の `task.next` | |
| 17〜22 | S3 | 図の 6 型（flow、layers、compare、sequence、tree、split。各ライトとダーク、幅 320） | 型ごとの課題を seed（AC-44） | r11 |
| 23 | S3 | 問 1 に正解の返し（印、「正解」、ミル correct、説明 1 つ、「次の問題へ」） | 正解を押す | r11 |
| 24 | S3 | 問 1 に不正解の返し（「惜しい」、ミル incorrect、説明 2 つ、正解の選択肢にチェック） | 不正解を押す | r11 |
| 25 | S3 | 問 2 が出た（問 1 の返しは残り、ミルは 0 件） | `task.question.next` | r11 |
| 26 | S3 | 問 3 の返しと「まとめへ」（`task.skip` と `task.skip.note` は無い：D-3） | 問 3 に答える | r12 |
| 27 | S3 | 再読み込みで復元（問 2 まで答えた。問 2 の返しにミル 1 件（`data-mood` は問 2 の結果）、問 1 の返しにミル 0 件、問 2 の「次の問題へ」なし、問 3 は未回答。フェードなし、フォーカスは文書の先頭） | AC-32 | r12（U-24） |
| 28 | S3 | 問の図あり（`data-figure-of="question"`） | 問に図を持つ課題を seed | r11 |
| 29 | S3 | 段階が変わった直後（`task.level.adjusted.down`） | AC-8 の 9 通り目 | r11 |
| 30 | S3 | 段階が上がった直後（`task.level.adjusted.up`） | AC-8 の 2 通り目の翌日 | r11 |
| 31 | S3 | ミル非表示の返し | `showCharacter` false で答える | r11 |
| 32 | S3 | 選択肢の保存の失敗 | 注入 | r11 |
| 33 | S3 | 「今日はやめておく」の保存の失敗 | 注入 | r11 |
| 34 | S3 | 日付が変わった知らせ | 開いたまま日付を進めて答える | |
| 35 | S4 | 通常（正答 2、累計 11、`task.cheer.default`、ミル celebrate） | 完了 10 件の seed。1 秒後 | r11 |
| 36 | S4 | 正答 0（`guide.rate.score0`） | 3 問とも不正解 | r11 |
| 37 | S4 | 正答 3（`guide.rate.score3`） | 3 問とも正解 | r11 |
| 38 | S4 | 節目 7（円とチェック、`task.cheer.at7`、`guide.rate.milestone`） | 完了 6 件の seed | r11（ミル） |
| 39 | S4 | 節目 30 | 完了 29 件の seed | |
| 40 | S4 | 節目 100 | 完了 99 件の seed | |
| 41 | S4 | ミル非表示 | `showCharacter` false | r11 |
| 42 | S4 | 回答の保存の失敗 | 注入 | |
| 43 | S5 | 通常（正答数、累計、進み具合、祝い、今週、次の一手、解説） | S4 で答える | r11（正答数） |
| 44 | S5 | 再読み込み後 | 再読み込み | |
| 45 | S5 | `task.next.note.last` | 組の 13 件を出した seed で 14 件目を完了 | |
| 46 | S5 | `task.next` の保存の失敗 | 注入 | |
| 47 | S2 | 初回の診断でオフライン（3 / 3 のまま `diagnosis.finish` の直上に `error.tasks.offline` + `task.next.retry`。radio は保たれる） | `serviceWorkers: 'block'` で開き、2 問目の確定の後に setOffline → `diagnosis.finish` | r12（6 領域。r11 の S5 の行は起きなくなったので置き換えた） |
| 48 | S6 | 導入で見送り（答え 0 件） | 問 0 / 3 で `task.skip` | r11 |
| 49 | S6 | 途中で見送り（答え 1 件。画面は 48 と同じで、S10 の行の `data-score` が違う） | 問 1 に答えて `task.skip` | r11 |
| 50 | S6 | `task.next.note.last` | 組の最後を見送り | |
| 51 | S6 | `task.next` の保存の失敗 | 注入 | |
| 52 | S7 | levelDone（中級。ミル celebrate） | 中級を出し終えた seed | r11（ミル） |
| 53 | S7 | levelDone（`task.exhausted.seenNext`） | r10 の #33 と同じ | |
| 54 | S7 | levelDone（`task.exhausted.nextDone`） | r10 の #53 と同じ | |
| 55 | S7 | allDone（上級。ミル celebrate） | 上級を出し終えた seed | r11（ミル） |
| 56 | S2 | やり直しの診断で別の領域へ移るときのオフライン（AC-23 の 3 通り目） | S8 の `settings.redo` → 別の領域を選び、setOffline → `diagnosis.finish` | r12（r11 の S7 の行を置き換えた） |
| 57 | S7 | 日付が変わった知らせ | 開いたまま日付を進めて操作 | |
| 58 | S7 | `task.exhausted.advance` の保存の失敗 | 注入 | |
| 59 | S8 | 診断済み（通常。節「案内役」あり） | nav の「設定」 | r11 |
| 60 | S8 | 案内役を非表示にした（checkbox が off） | `settings.character.show` を外す | r11 |
| 61 | S8 | 永続化を断られた注意 | `persisted()` を false | |
| 62 | S8 | 書き出しました | `settings.export` | |
| 63 | S8 | 読み込みの失敗（version / schema） | ファイルを選ぶ | |
| 64 | S8 | iOS の Safari（ホーム画面の節と案内） | UA の偽装 | |
| 65 | S8 | 保存データなし（節「案内役」は出す） | S1 の `nav.settings` | r11 |
| 66 | S8 | checkbox の保存の失敗 | 注入 | r11 |
| 67 | ダイアログ | `settings.import.confirm` | 保存データありで読み込む | |
| 68 | ダイアログ | `settings.delete.confirm` | `settings.delete` | |
| 69 | ダイアログ | `settings.import.confirm` の保存の失敗 | 注入 | |
| 70 | S9 | 通常（13 行。AC-24 の seed） | `settings.stats.open` | r11（13 行） |
| 71 | S9 | 診断直後（0） | 診断直後 | |
| 72 | S10 | 通常（done の行に正答数と「選んだ答えを見る」を開いた状態、no_time の行、none の行） | AC-24 の seed | r11 |
| 73 | S10 | 空 | 診断直後 | |
| 74 | S10 | 領域のファイルを読めない行（題名の代わりに ID、`history.row.unavailable`、「選んだ答えを見る」なし） | 2 領域の履歴の seed を `serviceWorkers: 'block'` で開き、setOffline → `nav.history` | r12（D-61 (2)） |
| 75 | S3 | 返しの読み上げ（VoiceOver） | G3 で Safari の VoiceOver を使い、選択肢を押した後に「正解」/「惜しい」が読まれることを手で確かめる（スクリーンショットではなく記録を残す） | r12（D-48） |

状態の数：画面の通常と変種を合わせて 73 行（#17〜22 は 6 型 × 2 配色で 12 枚）。r10 の 54 行から、答えの欄と自己申告に関わる 7 行（r10 の #15、#17〜#20、#30、#52、#54 のうち残したものを除く）を消し、r11 で 26 行を足した。r12：#47 と #56 を S2 の行に置き換え（6 領域では S5 と S7 のオフラインは起きない）、#74（S10）と #75（S3 の読み上げ）を足して 75 行。番号は撮る順ではなく通し番号。

## 6. 要素と識別子
受け入れテストが使う。`data-testid` は 7 の文言キーと同じ名前（文字を持たない要素はここで決める）。ルート要素は `data-state`、`data-build-version`、`data-debug-load-ms` を持つ。r10 から変えていない行は要点だけ（詳細は r10）。r11 で消した識別子：`task.answer`、`task.answer.label`、`.help`、`.saved`、`.limit`、`task.report.note`、`task.report.done`、`.tooHard`、`.tooEasy`、`.noTime`、`task.why`、`.how`、`.goal`（と `.text` ×3）、`task.external.badge`、`task.external.tools`（と `.label`、`.item`）、`task.skipped.levelHint`、`.levelChanged`、`settings.stats.tooHard`（と `.value`、`data-stat-too-hard`）、`report.tooHard`、`.tooEasy`、`history.row.answer`、`.answerText`。

| 画面 | 要素 | data-testid（または属性） | アクセシブルな名前（読み上げ） |
|---|---|---|---|
| 共通 | ルート、ヘッダー、nav | r10 と同じ（`data-state`、`data-build-version`、`data-debug-load-ms`、`app.name`、`nav.history`、`nav.settings`） | — |
| 共通（S1、S3、S4、S7） | 案内役 | `<aside>` `guide.character`（`data-mood`：idle / correct / incorrect / celebrate。`aria-label` は `guide.name` の文字）。中：絵 `guide.sprite`（`aria-hidden="true"`。`<img alt="">` か `<svg>`。表示の幅と高さ 96 CSS px）、名前 `guide.name`（`<p>`）、台詞 `guide.say`（`<p>`。中身は `guide.*` の 1 つ。台詞のキーは `data-testid` にしない：`task.cheer.*` と同じ型） | 「ミル」+ 台詞（絵は読まれない） |
| S0、S1、S2 | r10 と同じ | `app.loading`、`app.noscript`、`error.app.*`、`diagnosis.*`、`home.*`、`area.*`、`level.*`、`years.*`、`error.diagnosis.required`、`error.storage.*`、r12：S2 の `error.tasks.offline` + `task.next.retry`（`diagnosis.finish` の直上：D-61） | 文言のとおり |
| S3 | 日付が変わった知らせ、段階の知らせ | `task.dayChanged`（r10 と同じ）、`task.level.adjusted.down` / `.up`（`<p>`。段階が変わった直後の課題だけ。D-60） | 文言のとおり |
| S3 | 課題の入れ物 | `<article>` `task.today`（`data-task-id`、`data-task-area`、`data-task-level`、`data-task-mode`、`data-task-nth-today`、`data-progress-index`、`data-progress-total`、r11：`data-task-question-index`（答えた問の数 0〜3）、`data-task-question-total`（3）） | — |
| S3 | 進み具合、日付、題名、meta | `task.progress`、`task.today.label`（か `.nth`）、`task.today.title`（h1）、`task.meta`（r10 と同じ） | 文言のとおり |
| S3 | 導入 | `<p>` `task.intro.text`（課題集の `intro`。文言キーではない） | 本文 |
| S3 | 図（導入と問） | `<figure>` `task.figure`（`role="img"`、`aria-label`=`figure.alt`、`data-figure-type`：flow / layers / compare / sequence / tree / split、`data-figure-of`：intro / question、`data-figure-highlight`：強調する `labels` の index か無し）。中：箱 `[data-figure-part="box"]`（`data-figure-index`：labels の index。強調の箱は `data-figure-highlighted="true"`）、ラベル `task.figure.label`（`[data-figure-part="label"]`）、線と矢印 `[data-figure-part="line"]`（箱の連結線は `<span>`/`<div>` の border、矢印は `<svg>` の `stroke`） | `alt` の文（子は presentational） |
| S3 | 問 | `<section>` `task.question`（`data-question-number`：1〜3。答えた後 `data-answer-result`：correct / incorrect）。中：`<h2>` `task.question.heading`（`tabindex="-1"`）、`<p>` `task.question.text`（課題集の `text`）、任意の `task.figure`、`<div role="group" aria-labelledby="{heading の id}">` `task.question.choices`、r12：その直後に空の `<div role="status" aria-live="polite">` `task.question.status`（答えたら `task.answer.result.*` の `<p>` が入る：D-48） | 「問 1 / 3」+ 問題文 |
| S3 | 選択肢 | `<button>` `task.choice`（`data-choice-index`：0〜2。答えた後 `data-choice-state`：selected-correct / selected-incorrect / correct / none と `aria-disabled="true"`）。中：選択肢の文字（課題集 `choices[i].text`）、答えた後に `<span>` `task.choice.tag.selected`（選んだ答え）と／または `task.answer.mark`（`<svg aria-hidden>`）+ `task.choice.tag.correct`（正解） | 選択肢の文字（答えた後は「… 選んだ答え」「… 正解」が続く。aria-disabled は「使用不可」と読まれる） |
| S3 | 正誤（r12） | `<p>` `task.answer.result.correct`（印 `task.answer.mark` + 文字）か `task.answer.result.incorrect`。`task.question.status` の中（D-48） | 「正解」/「惜しい」 |
| S3 | 返しの区画 | `<div>` `task.question.feedback`（答えた問だけ。`task.question.status` の直下）。中：`guide.character`（いま答えた問だけ。復元では最後に答えた問だけ：D-53。台詞は `guide.correct.{n}` / `guide.incorrect.{n}`）、`<p>` `task.question.explain.label.selected`、`<p>` `task.question.explain`（`data-explain-for="selected"`。中身は選んだ選択肢の `explain`）、不正解なら `task.question.explain.label.correct` と 2 つ目の `task.question.explain`（`data-explain-for="correct"`）、`<button>` `task.question.next`（問 1、2）か `task.summary.open`（問 3） | 「正解」/「惜しい」→ ミルの台詞 → 「選んだ答えについて」+ 説明 →（「正解について」+ 説明）→ 「次の問題へ」/「まとめへ」 |
| S3 | 申告 | `<p>` `task.skip.note`（r12：1 文。`task.skip` の `aria-describedby`）、`<button>` `task.skip`（副操作の形。3 問目に答えた後は DOM に無い：D-3） | 「今日はやめておく」 |
| S4 | 入れ物、文、操作 | `<article>` `task.rate`（`data-score`：0〜3）、`task.rate.title`（h1。印 `task.rate.mark`）、`<p>` `task.rate.score`、`guide.character`（celebrate）、`task.total`（`.label`、`.value`、`.prev`：r10）、`task.progress.done`、`task.cheer`（`data-milestone`）、`task.insight` + `task.insight.text`、`task.rate.question`、`task.rate.helpful`、`task.rate.notHelpful`、`task.rate.close` | 「完了しました」「3 問中 2 問に正解しました」… |
| S5 | 入れ物、文、操作 | `<article>` `task.done`（`data-score`）、`task.done.title`、`task.done.task`、`task.rate.score`、`task.total`、`task.progress.done`、`task.cheer`、`task.week`、`task.next.note`（文言は `.note` か `.note.last`）、`task.next`、`task.insight` + `task.insight.text`、`task.done.history`（r12：`error.tasks.offline` は S5 に出ない：D-61） | 「次の一手に進む」 |
| S6 | 文、操作 | `task.skipped.title`、`task.next.note`、`task.next`、`task.skipped.history` | 「履歴を見る」 |
| S7 | 文、操作 | r10 と同じ（`task.exhausted.levelDone` / `.allDone`、`.detail`、`.next`、`.seenNext` / `.nextDone`、`.advance`、`.redo`）+ `guide.character`（celebrate） | 「中級に進む」「別の領域を選ぶ」 |
| S8 | 節と操作 | r10 と同じ（`settings.*`、`error.import.*`、ダイアログ）+ 節「案内役」：`<h2>` `settings.character.title`、`<label>` `settings.character.show`（見える文字。中に `<input type="checkbox">` `settings.character.show.input`（`checked` が `showCharacter`）。r12）、`<p>` `settings.character.note` | 「案内役のミルを表示する」（checkbox の状態も読む） |
| S9 | 値 | `settings.stats.title`、`.today`、`<dt>` はラベルのキー、`<dd>` は `.value`：`firstOpenDate`（`data-stat-first-open-date`）、`issued`、`completed`、`firstDayCompleted`（中に `.yes` / `.no`）、`daysCompleted7d`、`daysCompletedWeek`、`extraCompleted`、`helpful`、`rated`、r11：`questionsAnswered`（`data-stat-questions-answered`）、`questionsCorrect`（`data-stat-questions-correct`）、`lowScoreTasks`（`data-stat-low-score-tasks`）、`noTime`（`data-stat-no-time`）の 13 個。`settings.stats.note`、`.back` | `<dt>` の文 + 値 |
| S10 | 行 | `history.title`、`<ol>` `history.list`、`<li>` `history.row`（`data-task-id`、`data-date`、`data-report`、`data-helpful`、r11：`data-score`）。行の中：`history.row.date`、`history.row.taskTitle`（r12：ファイルを読めない行は課題の ID の文字）、`<p>` `history.row.unavailable`（読めない行だけ。r12）、`report.done` / `.noTime` / `.none`、`<p>` `history.row.score`（答えた問が 1 件以上）、`helpful.yes` / `.no` / `.unanswered`、`<details>` の `<summary>` `history.row.answers`、`<ol>` の `<li>` `history.row.answer.item`（`data-question-number`、`data-correct`：true / false。文字は選んだ選択肢の `text` + 「正解」/「惜しい」）、空：`history.empty`、`history.empty.action` | 「選んだ答えを見る」 |

### 6.1 r11 で足した識別子の一覧（tech-lead が contracts/identifiers.md に写す）
文言キー（35 個。identifiers.md 6 に足す）：`task.question.heading`、`task.answer.result.correct`、`task.answer.result.incorrect`、`task.question.explain.label.selected`、`task.question.explain.label.correct`、`task.choice.tag.selected`、`task.choice.tag.correct`、`task.question.next`、`task.summary.open`、`task.skip`、`task.skip.note`、`task.rate.score`、`task.level.adjusted.down`、`task.level.adjusted.up`、`error.tasks.offline`、`task.next.retry`、`guide.name`、`guide.intro`、`guide.correct.1`、`.2`、`.3`、`guide.incorrect.1`、`.2`、`.3`、`guide.rate.score0`、`guide.rate.score1`、`guide.rate.score2`、`guide.rate.score3`、`guide.rate.milestone`、`guide.exhausted.levelDone`、`guide.exhausted.allDone`、`settings.character.title`、`settings.character.show`、`settings.character.note`、`settings.stats.questionsAnswered`、`settings.stats.questionsCorrect`、`settings.stats.lowScoreTasks`、`history.row.score`、`history.row.answers`、r12：`history.row.unavailable`。消す文言キー（20 個）：`task.answer.label`、`task.answer.help`、`task.answer.saved`、`task.answer.limit`、`task.report.note`、`task.report.done`、`task.report.tooHard`、`task.report.tooEasy`、`task.report.noTime`、`task.why`、`task.how`、`task.goal`、`task.external.badge`、`task.external.tools.label`、`task.skipped.levelHint`、`task.skipped.levelChanged`、`settings.stats.tooHard`、`report.tooHard`、`report.tooEasy`、`history.row.answer`。合計 174 → 189（r11）→ 194（r12：`guide.correct` と `guide.incorrect` を 3 本ずつにして +4、`history.row.unavailable` +1）。`data-testid` として使わない文言キー：`guide.intro`、`guide.correct.*`、`guide.incorrect.*`、`guide.rate.*`、`guide.exhausted.*`（要素は `guide.say`）、`task.next.note.last`、`task.cheer.*`（r10 と同じ）。`settings.character.show` は `<label>` の `data-testid`（見える文字を持つ要素はその文言キー）で、`<input>` は `settings.character.show.input`（r12）。

| data-testid（文字を持たない要素。identifiers.md 3 に足す） | 要素 | 画面 |
|---|---|---|
| `guide.character` | 案内役の `<aside>`（`data-mood`） | S1、S3、S4、S7 |
| `guide.sprite` | 絵（`aria-hidden`。96 × 96 CSS px） | 同上 |
| `guide.say` | 台詞の `<p>`（文字は `guide.*` の 1 つ） | 同上 |
| `task.intro.text` | 導入の `<p>`（課題集の `intro`） | S3 |
| `task.figure` | 図の `<figure>`（`role="img"`） | S3 |
| `task.figure.label` | 図のラベルの `<span>` | S3 |
| `task.question` | 問の `<section>` | S3 |
| `task.question.text` | 問題文の `<p>` | S3 |
| `task.question.choices` | 選択肢の入れ物（`role="group"`） | S3 |
| `task.question.status` | 正誤の入れ物 `<div role="status" aria-live="polite">`（描いた時点から空。r12） | S3 |
| `task.choice` | 選択肢の `<button>` | S3 |
| `task.answer.mark` | 正解の印の `<svg>`（`aria-hidden`。返しの文言の先頭と、正解の選択肢の中） | S3 |
| `task.question.feedback` | 返しの区画の `<div>` | S3 |
| `task.question.explain` | 説明の `<p>`（`data-explain-for`） | S3 |
| `task.rate`、`task.done` | まとめと完了の `<article>`（`data-score`） | S4、S5 |
| `settings.character.show.input` | checkbox の `<input>`（`checked` が `showCharacter`。r12） | S8 |
| `settings.stats.questionsAnswered.value`、`.questionsCorrect.value`、`.lowScoreTasks.value` | 値の `<dd>` | S9 |
| `history.row.answer.item` | 選んだ答えの `<li>` | S10 |

| 値を持つ属性（identifiers.md 4 に足す） | 要素 | 値 |
|---|---|---|
| `data-task-question-index`、`data-task-question-total` | `task.today` | 答えた問の数（0〜3）、3 |
| `data-question-number` | `task.question`、`history.row.answer.item` | 1〜3 |
| `data-answer-result` | `task.question` | correct / incorrect（答えた後だけ） |
| `data-choice-index` | `task.choice` | 0〜2 |
| `data-choice-state` | `task.choice` | selected-correct / selected-incorrect / correct / none（答えた後だけ。答える前は付けない） |
| `data-explain-for` | `task.question.explain` | selected / correct |
| `data-title-unavailable` | `history.row` | true（領域のファイルを読めない行だけ。r12） |
| `data-score` | `task.rate`、`task.done`、`history.row` | 0〜3 |
| `data-figure-type` | `task.figure` | flow / layers / compare / sequence / tree / split |
| `data-figure-of` | `task.figure` | intro / question |
| `data-figure-highlight` | `task.figure` | 強調する `labels` の index（無ければ属性なし） |
| `data-figure-part` | 図の中の要素 | box / label / line |
| `data-figure-index`、`data-figure-highlighted` | 図の箱 | labels の index、true（強調の箱だけ） |
| `data-mood` | `guide.character` | idle / correct / incorrect / celebrate |
| `data-correct` | `history.row.answer.item` | true / false |
| `data-stat-questions-answered`、`data-stat-questions-correct`、`data-stat-low-score-tasks` | S9 の `<dd>` | 整数の文字列 |

ID の語彙（identifiers.md 5）：図の型の ID は上の 6 つ。申告の値は `done` / `no_time` / `none`（`too_hard`、`too_easy` は外す。PRD r13-2）。

## 7. 文言
です・ます、絵文字と感嘆符なし、ボタンは動詞。英語は plain、direct、動詞始まり。案内役の台詞（`guide.*`）だけ、です・ます調のまま問いかけと短い相づちを許す（D-19）。プレースホルダーは `{name}`、数の複数形は ICU の `{n, plural, …}`。日付は ISO 8601（D2）。アプリ名は英語でも「今日の一手」（D3）。課題集の本文（`intro`、`text`、`choices[].text`、`explain`、`insight`、`figure.labels`、`figure.alt`）は日本語のみで、ここには含めない。この表が ja と en の文言ファイルの原本（AC-26）。文字がデータから来る要素（`task.today.title`、`task.intro.text`、`task.question.text`、`task.choice` の文字、`task.question.explain`、`task.figure.label`、`task.insight.text`、`history.row.taskTitle`、`history.row.answer.item` の選択肢の文字）と、変種を入れ替える入れ物（`task.cheer`、`task.total`、`task.next.note`、`guide.say`）は文言キーではなく 6 の表だけにある。r11 の差し込み：`{n}`、`{total}`（`task.question.heading`、`task.rate.score`、`history.row.score`）、`{level}`（`task.level.adjusted.*`）。r11 の合計は 189 キー（r10 の 174 から 20 を消し 35 を足した。一覧は 6.1）。r12 の合計は 194 キー（`guide.correct` と `guide.incorrect` を問の番号つきの 3 本ずつに置き換えて +4、`history.row.unavailable` +1。差し込みの日英の食い違いは 0：`task.rate.score` と `history.row.score` の ja に `{total}` を足した）。語の検査（D-65）は 11 のスクリプトで 0 件を確かめた。

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
| diagnosis.start.lead.1 | コードを書いたことがない人から現役のエンジニアまで使えます。毎日 1 つ、15 分（初級は 10 分）で終わる課題が出ます。読んで、3 問の選択肢を選ぶだけで、その場で正誤と理由が分かります。 | For anyone from first-time coders to working engineers. One task a day, 15 minutes (10 for Beginner): read, pick an answer for 3 questions, and see right away whether you were right and why. | S1（r11 で差し替え。FB2-2、FB2-3） |
| diagnosis.start.lead.2 | 登録はありません。入力したデータはこのブラウザの中だけに保存され、外には送りません。 | No sign-up. Your data stays in this browser and is never sent anywhere. | S1 |
| diagnosis.start.lead.3 | 正答数に合わせて、次の課題から段階が自動で変わります。 | The level adjusts automatically from the next task, based on how many you get right. | S1（r11 で差し替え。AC-8。「点」の語を使わない：D-65） |
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
| diagnosis.q2.legend | この領域（{area}）で、今の段階に近いものを選んでください | In this area ({area}), choose the level closest to where you are | S2（r8 で「この領域で」を足した。段階の説明はコード全般の経験の言い方なので、この領域での経験として読めるようにする：design-reviewer G1 r3 の提案 9、D-41） |
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
| task.rate.title | 完了しました | Done | S4 h1（先頭に印 `task.rate.mark`。印は文字を持たず、h1 の文字はこのまま：D-43） |
| task.rate.question | この課題は役に立ちましたか | Was this task useful? | S4 |
| task.rate.helpful | 役に立った | Useful | S4 |
| task.rate.notHelpful | 立たなかった | Not useful | S4 |
| task.rate.close | 今回は答えない | Skip | S4 |
| task.total.label | これまでに完了した課題 | Completed so far | S4、S5、S7（text.small、color.text.secondary。r7。D-35） |
| task.total.value | {count} 件 | {count, plural, one {# task} other {# tasks}} | S4、S5、S7（text.title。要素は `data-stat-completed` を持つ。r7。AC-35。S4 の `task.total.prev` も同じ文言で count − 1：D-43） |
| task.progress.done | この段階の {index} / {total} 件目でした | That was task {index} of {total} at this level | S4、S5（`task.total` の直後。text.small。r8。D-44。値は完了した課題の S3 の `task.progress` と同じ） |
| task.cheer.default | {count} 件目を終えました。 | Task {count} done. | S4、S5 の `task.cheer`（累計が 7、30、100 以外。r7。r8 で `{count}` を使う事実の文に：D-36、design-reviewer G1 r3 の提案 6。{count} は `task.total.value` と同じ整数） |
| task.cheer.at7 | 7 件目を終えました。最初の節目です。 | Task 7 done. That is the first milestone. | S4、S5 の `task.cheer`（累計が 7。r7。AC-35） |
| task.cheer.at30 | 30 件目を終えました。2 つ目の節目です。 | Task 30 done. That is the second milestone. | S4、S5 の `task.cheer`（累計が 30） |
| task.cheer.at100 | 100 件目を終えました。最後の節目です。 | Task 100 done. That is the last milestone. | S4、S5 の `task.cheer`（累計が 100。節目は 3 つだけなので「最後」と言い切る：正直） |
| task.insight | ひとこと解説 | Insight | S4、S5 h2（r7。本文 `task.insight.text` は課題集から。AC-38。D-38） |
| task.done.title | 完了を記録しました | Completion saved | S5 h1（r7 で差し替え。「今日の一手は終わりです」は FB-2 で成り立たなくなった） |
| task.done.task | 完了した課題：{title} | Completed: {title} | S5 |
| task.week | 今週（月曜から）の完了日数：{days} 日 | Days completed this week (from Monday): {days} | S5（要素は `data-stat-days-completed-week` を持つ。r7。AC-37。D-39。「月曜から」は省かない） |
| task.next.note | 明日も課題が 1 件出ます。続けるなら、次の一手に進めます。 | Another task comes tomorrow. If you want, you can go on to the next one now. | S5、S6（`task.next` の直前。r7。D-4。組の最後の 1 件の後は `.last` に差し替える） |
| task.next.note.last | {area}の{level}の課題は、すべて出し終えています。次に進むと、修了の案内が出ます。 | You have seen every {level} task in {area}. If you go on, you will see the completion screen. | S5、S6 の `task.next.note` の要素（`task.next` を押すと S7 になる状態のときだけ。{area} は今の領域、{level} は次に出す組の段階（申告で段階が動いていれば動いた先）。いま終えた課題ではなく次に出す組について言う。r8。文は r9。D-44 (2)。design-reviewer G1 r3 の要修正 1、r4 の要修正 1） |
| task.next | 次の一手に進む | Start the next task | S5、S6（副操作の形のボタン。r7。AC-33） |
| task.done.history | 履歴を見る | View history | S5 リンク |
| task.skipped.title | 今日はやめておきました | Skipped for today | S6 h1（r11 で差し替え。申告が 1 種類になったので事実をそのまま言う） |
| task.skipped.history | 履歴を見る | View history | S6 リンク |
| task.exhausted.levelDone | {area}の{level}を修了しました | You completed {level} in {area} | S7 h1（levelDone。r7。AC-10。{level} は今の段階の `level.*`） |
| task.exhausted.levelDone.detail | この段階の {total} 件をすべて出し終えました。次の段階に進むと、その課題は今日から出ます。 | All {total, plural, one {# task} other {# tasks}} at this level have been issued. If you move up, the next level's tasks start today. | S7（levelDone。{total} は `data-progress-total` と同じ組の総数） |
| task.exhausted.next | 次の段階は{nextLevel}です。{desc}。 | The next level is {nextLevel}: {desc}. | S7（levelDone。{nextLevel} は次の段階の `level.*`、{desc} はその `level.*.desc`（句点なし）。r8 で文末に句点を足した：tech-lead G1 r2 の提案 3。D-40） |
| task.exhausted.seenNext | {nextLevel}の課題は、前に出したものを除いて続きます。難しいときは、別の領域を選ぶこともできます。 | {nextLevel} continues with the tasks you have not seen yet. If it is too hard, you can also choose another area. | S7（levelDone。履歴に同じ領域で次の段階の行があり、かつ次の段階の組にまだ出していない課題が 1 件以上あるときだけ（r8 で後半の条件を足した：tech-lead G1 r2 の提案 1）。「難しすぎ」2 回で下がった先を出し終えた場合に当たる：tech-lead G0 r3 の提案 4。D-40） |
| task.exhausted.nextDone | {nextLevel}の課題も、すでにすべて出し終えています。進むと、その次の案内が出ます。 | All {nextLevel} tasks have already been issued too. If you move up, you will see what comes next. | S7（levelDone。次の段階の組をすべて出し終えているときだけ。`seenNext` の代わりに出す。r8。D-40） |
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
| settings.import.confirm.body | このブラウザの診断の回答、履歴、選んだ答えは、ファイルの内容に置き換わります（結合はしません）。この操作は元に戻せません。 | Your diagnosis answers, history, and chosen answers in this browser will be replaced by the file's contents (not merged). This cannot be undone. | ダイアログ（r11：「答え」→「選んだ答え」） |
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
| settings.delete.confirm.body | 診断の回答、履歴、選んだ答え、案内役の設定がこのブラウザから消え、最初の画面に戻ります。この操作は元に戻せません。先に「ファイルに書き出す」で残しておくこともできます。 | Your diagnosis answers, history, chosen answers, and the guide setting will be removed from this browser, and you will return to the first screen. This cannot be undone. You can keep a copy first with "Export to a file". | ダイアログ（r12：案内役の設定を足した。削除で `showCharacter` も消える：tech-lead r3 の提案 5） |
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
| settings.stats.noTime | 「今日はやめておく」の件数 | Skipped (not today) | S9 dt（r11：文言を `task.skip` に合わせた） |
| settings.stats.note | この値は、このブラウザの記録から計算しています。外には送りません。報告するときは、この画面のスクリーンショットを送ってください。 | These values are calculated from the records in this browser and never sent anywhere. To report them, send a screenshot of this screen. | S9 |
| settings.stats.back | 設定に戻る | Back to settings | S9 リンク |
| history.title | 履歴 | History | S10 h1 |
| history.empty | まだ履歴はありません。課題を終えるか、今日はやめておくと、ここに残ります。 | No history yet. Tasks you finish or skip will appear here. | S10（r11） |
| history.empty.action | 今日の課題へ | Go to today's task | S10 主操作 |
| report.done | 完了 | Done | S10 |
| report.noTime | 今日はやめておく | Skipped | S10（r11：`task.skip` に合わせた） |
| report.none | 申告なし | Not reported | S10（日付が変わった課題） |
| helpful.yes | 役に立った | Useful | S10 |
| helpful.no | 立たなかった | Not useful | S10 |
| helpful.unanswered | 未回答 | Not rated | S10 |
| task.question.heading | 問 {n} / {total} | Question {n} of {total} | S3 の各問の h2（r11。D-46。{total} は 3） |
| task.answer.result.correct | 正解 | Correct | S3 の返し（`role="status"`。先頭に印 `task.answer.mark`。text.heading、color.success。r11。AC-41。D-48） |
| task.answer.result.incorrect | 惜しい | Not quite | S3 の返し（`role="status"`。text.heading、color.text。印は選んだ選択肢の太い枠と正解のチェック。r11。D-48） |
| task.question.explain.label.selected | 選んだ答えについて | About your answer | S3 の説明のラベル（text.small、secondary。r11。D-49） |
| task.question.explain.label.correct | 正解について | About the correct answer | S3 の説明のラベル（不正解のときだけ。r11。D-49） |
| task.choice.tag.selected | 選んだ答え | Your answer | S3 の選んだ選択肢の中（text.small。r11。D-47） |
| task.choice.tag.correct | 正解 | Correct | S3 の正解の選択肢の中（印 `task.answer.mark` の後。text.small、color.success。r11。D-47） |
| task.question.next | 次の問題へ | Next question | S3 主操作（問 1、問 2 の返しの直下。r11。AC-41） |
| task.summary.open | まとめへ | See the summary | S3 主操作（問 3 の返しの直下。r11。AC-42） |
| task.skip.note | やめても、答えた分は履歴に残ります。 | Your answers so far stay in your history. | S3（`task.skip` の直前。text.small。`task.skip` の `aria-describedby`。r12 で 1 文にした：design-reviewer r5 の 11。D-26） |
| task.skip | 今日はやめておく | Not today | S3 副操作（r11。AC-7。PRD の `task.skip`） |
| task.rate.score | {total} 問中 {n} 問に正解しました | You got {n} of {total} questions right | S4、S5（h1 の直後。text.body。{n} は `data-score`、{total} は 3。r11。AC-42。D-59。「点」「score」を使わない） |
| task.level.adjusted.down | 直近の課題の正答数に合わせて、段階を{level}にしました。 | Based on your recent answers, the level is now {level}. | S3（段階が下がった直後の課題。`task.progress` の直後。text.body、color.text。r11。AC-8。D-60。禁止語の対象） |
| task.level.adjusted.up | 直近の 3 件が全問正解だったので、段階を{level}に上げました。 | You answered every question right in the last 3 tasks, so the level is now {level}. | S3（段階が上がった直後の課題。r11。AC-8。D-60） |
| error.tasks.offline | 課題のファイルをまだ取り込めていません。ネットにつないでから、もう一度進めてください。 | The task file has not been downloaded yet. Connect to the internet, then try again. | S2（`role="alert"`。`diagnosis.finish` の直上。r12：6 領域に分けるので S5、S6、S7 では出ない。AC-23。D-61） |
| task.next.retry | もう一度進む | Try again | S2（副操作。`error.tasks.offline` の直下。`diagnosis.finish` と同じ処理を呼ぶ。r12。D-61） |
| guide.name | ミル | Miru | 案内役の名前（`guide.character` の `aria-label` と、台詞の上の小さな文字。text.small、color.guide。r11。D-53） |
| guide.intro | 3 問に答えてください。今日の一手を決めます。 | Three questions, then today's move. | S1（idle。r11。D-55） |
| guide.correct.1 | そのとおりです。理由も読んでおきましょう。 | That is it. Read the why, too. | S3 の問 1 の正解の返し（correct。r12：問の番号で選ぶ。D-55） |
| guide.correct.2 | 合っています。説明で根拠を確かめましょう。 | Right. Check the reason in the note. | S3 の問 2 の正解の返し（r12） |
| guide.correct.3 | 合っています。最後の説明も読んでおきましょう。 | Right again. Read the last why, too. | S3 の問 3 の正解の返し（r12） |
| guide.incorrect.1 | もう一度、問題文を見てみましょう。 | Let's read the question again. | S3 の問 1 の不正解の返し（incorrect。「一緒に考える」。r12：U-28 の決定。D-55） |
| guide.incorrect.2 | 選んだ答えと正解の説明を、見比べてみましょう。 | Compare the two explanations below. | S3 の問 2 の不正解の返し（r12） |
| guide.incorrect.3 | 正解の説明を読んでから、まとめへ進みましょう。 | Read the correct one, then move on. | S3 の問 3 の不正解の返し（r12） |
| guide.rate.score0 | 今日は 3 問とも、説明を読み直す回でしたね。 | Today was for reading the whys. | S4（celebrate。正答 0。責めず、慰めず。r11。D-55） |
| guide.rate.score1 | 1 問は見えていました。残り 2 問は説明に答えがあります。 | You saw one. The whys cover the rest. | S4（正答 1。r12：確かめられない問い「読めましたか」をやめ、事実の文に：design-reviewer r5 の 7） |
| guide.rate.score2 | 2 問は見えていました。あと 1 問は次に生きます。 | You saw two. One will come back. | S4（正答 2。r11） |
| guide.rate.score3 | 3 問とも見えていました。今日の一手は終わりです。 | You saw all three. Today's move is done. | S4（正答 3。評価語なし。r11） |
| guide.rate.milestone | 節目の日です。ここまでの数を見てください。 | A milestone. See the count so far. | S4（累計 7 / 30 / 100 のとき `guide.rate.score*` の代わりに。r11。D-55） |
| guide.exhausted.levelDone | この段階の課題は、全部見ました。次に進めます。 | Every task here is seen. Move up? | S7 levelDone（celebrate。r11。D-55） |
| guide.exhausted.allDone | この領域は、全部見ました。別の領域も見てみますか。 | All of this area is seen. Try another? | S7 allDone（celebrate。r11。D-55） |
| settings.character.title | 案内役 | Guide | S8 h2（r11。D-56） |
| settings.character.show | 案内役のミルを表示する | Show Miru, the guide | S8 checkbox のラベル（`<label>` の `data-testid`。input は `.input`：r12。既定 on。保存データ `showCharacter`。AC-45。D-56） |
| settings.character.note | 非表示にしても、解説、累計、祝いの文は出ます。 | Even when hidden, the insight, totals, and milestone messages still appear. | S8（r11。D-56） |
| settings.stats.questionsAnswered | 答えた問題数 | Questions answered | S9 dt（r11。AC-24。`data-stat-questions-answered`。D-63） |
| settings.stats.questionsCorrect | 正解した問題数 | Questions answered correctly | S9 dt（r11。`data-stat-questions-correct`） |
| settings.stats.lowScoreTasks | 正答 1 問以下で完了した課題数 | Tasks completed with 1 or fewer correct | S9 dt（r11。`data-stat-low-score-tasks`。「点」を使わない） |
| history.row.score | {total} 問中 {n} 問 | {n} of {total} right | S10 の行（答えた問が 1 件以上の行。{total} は 3。r11。D-62） |
| history.row.answers | 選んだ答えを見る | Show your answers | S10 summary（r11。D-62） |
| history.row.unavailable | この領域のファイルをまだ取り込めていません。題名と選んだ答えは、ネットにつないで開き直すと出ます。 | This area's task file has not been downloaded yet. The title and your answers will appear once you reopen online. | S10 の行（領域のファイルを読めない行だけ。題名の直下。text.small、secondary。r12。D-61 (2)） |

権限と確認の求め方：r10 と同じ（保存の永続化は初めて S3 を表示した直後に 1 回だけ：D-23、D-31。ファイルの読み込みはブラウザ標準の選択ダイアログ。通知、位置情報、カメラは使わない）。

## 8. 見た目
- 使うトークン（色、文字、余白）：design/tokens.md のすべて。色は r10 の 10 個に color.figure.accent と color.guide を足した 12 個（D-15、D-58）。文字は text.title、text.heading、text.body、text.small の 4 段のまま（B-4）。r11 で足した要素の文字：`task.question.heading` は text.heading、`task.question.text`、`task.choice`、`task.question.explain`、`task.intro.text`、`task.rate.score`、`task.level.adjusted.*`、`guide.say`、`task.figure.label` は text.body、`task.answer.result.*` は text.heading（正解は color.success、惜しいは color.text）、`task.question.explain.label.*`、`task.choice.tag.*`、`task.skip.note`、`guide.name`、`history.row.score` は text.small。図の強調のラベルは text.body の太さ 700。余白は space.1〜space.6 と、図の寸法 size.figure.border（2 px）、size.figure.border.accent（3 px）、size.radius.figure（8 px）。
- 新しく足すトークン（r11。tokens.md r8）：color.figure.accent（ライト #B45309、ダーク #F2A33A、上げる #7A3400 / #FFC877）、color.guide（ライト #7E55C2、ダーク #B48CE0、上げる #5B2FA8 / #DCCBF5）、size.figure.border、size.figure.border.accent、size.radius.figure。比は 9 の表。text style と動きのトークンは足していない（返しの区画の不透明度は既存の motion.fade）。
- 使う SF Symbols の名前：なし。アイコンは 0 個のまま、`aria-hidden` の印が 3 種（完了の印、正解の印、図の矢印。D-20）。案内役の絵はドット絵の PNG（D-54）。
- 画面の並び（縦の線）：r10 と同じ（本文の列 size.content.max、要素の見える左端を列の左の線にそろえる。B-3）。r11 で足した要素：選択肢の `<button>` は枠の左端を列の線に、返しの区画は絵の左端（横並び）か文字の左端（縦積み）を列の線に、図は枠の左端を列の線にそろえる。図の中の箱は列いっぱいか grid の列に沿う。
- 性格語が表れている場所（調査 5。r3 で 6 語）：
  - ひとつ：S3 に未回答の問は常に 1 つだけ（D-46）。申告の操作は `task.skip` の 1 つ（D-3）。図は導入に 1 つ（問の図は任意）。案内役は 1 体で、1 画面に 1 か所（D-53）。
  - 静か：地が 1 色で、カード、影、グラデーション、吹き出し、背景の模様がない（tokens 1、D-50、D-54）。動きは不透明度 150 ms と S4 の演出だけ（D-13、D-57）。色が付く所は次の一覧がすべて：
    - color.action.primary：主操作の塗り（`diagnosis.start.begin`、`diagnosis.next` / `.finish`、`task.question.next`、`task.summary.open`、`task.exhausted.advance`（levelDone）、`task.exhausted.redo`（allDone）、`settings.export`、保存データなしの S8 の `settings.import`、`history.empty.action`、`error.app.reload`）、リンクの文字、radio と checkbox の `accent-color`。color.focus（同じ値）はフォーカスの枠。
    - color.success：`task.answer.result.correct` の文字と印、正解の選択肢の印と `task.choice.tag.correct`、`settings.export.done`、S4 の完了の印、節目の `task.cheer`（D-43、D-36、D-48）。
    - color.warning：`settings.storage.notPersisted`、`home.addToHomeScreen.title`、`task.dayChanged`（D-30）。
    - color.error：エラーの文（`error.*`。`error.tasks.offline` を含む）、取り消せない操作のボタン。
    - color.figure.accent：図の強調の箱の枠とラベルだけ（D-50）。
    - color.guide：`guide.name` の文字と台詞の左の線だけ（D-54）。
    - color.overlay：ダイアログの `::backdrop`。これ以外は color.bg、color.text、color.text.secondary、color.border だけ。
  - 正直：`task.rate.score`（0 問でも同じ形で言う：D-59）、`task.level.adjusted.*`（段階が下がったことを隠さない：D-60）、`task.answer.result.incorrect`「惜しい」（「不正解」と言わないが、正解の選択肢を示して説明を 2 つ出す：D-48、D-49）、`error.tasks.offline`（取り込めていないと言う）、S1 の `diagnosis.start.lead.2` / `.3`、S7 の `.detail`、`task.cheer.at100`、`settings.delete.confirm.body`（r10 と同じ）。
  - 手早い：S3 は開いて操作 0 回で題名、導入、図、問 1 の選択肢（AC-31）。選択肢は 1 タップで確定し 300 ms 以内に返す（AC-41）。1 課題は「選ぶ → 次へ」× 3 と「まとめへ」の 7 タップで終わる（P-2）。
  - 手応え：S3 の各問の返し（正誤の文言と印、説明）、S4 の `task.rate.score`、完了の印と累計の動き（D-43）、`task.progress.done`、`task.cheer`、`task.insight`。
  - 一緒に（r3 で足した）：ミルが正解でも不正解でも同じ大きさで返しの隣にいて（D-53）、不正解では「一緒に考える」顔（incorrect）で問題文や 2 つの説明に戻す台詞 `guide.incorrect.1`〜`.3`（D-55。U-28）。正答 0 でも責めない `guide.rate.score0`。図は本文の中身を表す 1 枚で、飾りではない（D-50）。
- 差をつける点が表れている場所（調査 6、6.1、6.2）：
  1. 課題そのものがホーム画面：S3 の初期表示。ヘッダーの直下に `task.today.label`、`task.progress`、h1、`task.meta`、`task.intro.text` の 2 行目まで（幅 320、文字 100%）。図と問 1 はその下に続く。
  2. 選んだ直後の 0.3 秒に「なぜ」が必ず出て、案内役が不正解でも同じ顔の大きさで隣にいる（調査 6.2）：S3 で選択肢を押すと 300 ms 以内に、同じ問の直下に「正解」の印と文字（または「惜しい」）、ミルの表情と 1 文、選んだ答えの説明（不正解なら正解の説明も）が並ぶ（D-46〜D-49、D-53）。説明は任意で開かせず常に出す。決定的な瞬間は「押した 0.3 秒後に、合っていたかと、なぜかが同じ場所に見えること」。r2 の「終えた直後の手応え」（D-43、S4）はこの 2 の続きとして残す。
- S3 の初期表示の見積もり（幅 390、文字 100%。実測は G3）：ヘッダー 56 + 題名の上 32 + ラベル 22 + 進み具合 22 + h1 34（1 行）+ meta 22 + 余白 16 × 3 = 236 px で導入の本文が始まり、表示域の目安 664 px の中に導入 3〜4 行（約 100 px）と図の先頭が入る。問 1 はスクロール 1 回で見える（幅 320 では導入の 2 行目まで）。
- ホーム画面のアイコンと manifest（D-29）：r10 と同じ。
- 参考にした原則のページ（URL。r10 の一覧に r11 で足したもの。2026-11-05 と 2026-11-06 に確認）：WAI-ARIA APG Button https://www.w3.org/WAI/ARIA/apg/patterns/button/ 、MDN image-rendering https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering 、MDN input type=checkbox https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/checkbox 、WCAG 2.2 SC 2.4.3 https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html 、HIG Charts（調査 R-73。JSON 経路）、HIG Color（R-68）、WCAG 1.4.1（R-69）、1.4.11（R-71）。調査 r3 の R-66〜R-91 の URL も使う。r10 までの一覧は git の履歴（コミット 7516095 の design/001-daily-learning.md の 8）。

## 9. アクセシビリティ
- いちばん大きい文字（ルートの文字サイズ 200%）で並びを変える場所：
  - r10 と同じ：ヘッダー、`task.meta`、S2 の radio、`task.total`、S5 / S6 の `task.next`、S7 の 2 ボタン、S9 の `<dl>`、S10 の行、ダイアログ。
  - S3 の選択肢：常に縦 1 列（横に並べない）。文字は折り返す。選んだ印 `task.choice.tag.*` は選択肢の文字の後ろに続け、入らなければ 2 行目に落ちる。
  - S3 の返しの区画：幅 480 px 未満か文字 200% では、絵（96 px 固定）の下に名前、台詞、説明を縦に積む（D-54）。絵は拡大しない（整数倍を保つ）。
  - 図：flow は縦（↓）、tree と split は子を縦、compare は 2 列のままラベルが折り返す、layers と sequence はもともと縦（D-51。横並びは幅 600 以上かつ箱 3 個以下だけなので、200% の幅 390 では起きない）。高さを固定しない。compare は 200% で文字の幅約 103 px、1 行 3 字で 12 字が 4 行（D-51 の数字。r12 で直した）。
  - S8 の checkbox：ラベルは折り返す。checkbox は左に固定。
- 色だけで区別していないか：正誤は文言（「正解」「惜しい」）＋ 印（チェック、太い枠、「選んだ答え」「正解」の文字）＋ 色（正解だけ color.success）の 3 つ（D-48。WCAG 2.2 SC 1.4.1）。図の強調は 3 px の枠と 700 の文字で、色を外しても分かる（D-50）。案内役の表情は絵の違いで、台詞の文が意味を言う。段階の知らせは文字だけ（D-60）。r10 の項目（リンクの下線、エラーの文字、節目の文、累計のラベル、完了の印の `aria-hidden`）はそのまま。
- 動きを減らす設定、透明度を下げる設定のとき：`prefers-reduced-motion: reduce` で motion.* を 0 ms（返しの区画は即時に出る。S4 の演出は最終の状態だけ。ミルは静止：D-57）。`guide.character` の subtree と `task.figure` に `@keyframes` を当てない。`prefers-reduced-transparency: reduce` は r10 と同じ（ダイアログの `::backdrop` だけ）。`prefers-contrast: more` では tokens の「上げる」の値（図の強調 9.06 / 13.78、ミルの名前 8.69 / 13.90）。`forced-colors: active` ではシステム色に任せ、図の枠と線、選択肢の枠、正解の印（`currentColor`）、リンクの下線で意味を保つ。ミルの PNG は `forced-colors` でも変わらない（画像）。
- VoiceOver（TalkBack、NVDA）の読み上げ順：DOM の順＝見た目の順。
  - S1：ヘッダー → h1 → 説明 3 段落 → ミル（`<aside>` の名前「ミル」→ 台詞。絵は読まれない）→（案内）→ 診断を始める。
  - S3（問 0 / 3）：ヘッダー →（日付が変わった知らせ）→ 今日の課題と日付 → この段階の n / N 件目 →（段階の知らせ）→ h1 題名 → 領域 / 段階 / 所要時間 → 導入の本文 → 図（`aria-label` の文を 1 つの画像として読む。中のラベルは読まない）→ h2「問 1 / 3」→ 問題文 →（問の図）→ 選択肢の group（名前は h2）→ 選択肢 1、2、3 → やめておくの注記 → 今日はやめておく。`task.next` で着いた S3 は h1 にフォーカス。
  - S3（返しの直後）：フォーカスは押した選択肢に残る（`aria-disabled`）。描いた時点から DOM にある `task.question.status`（`role="status"`、polite）に「正解」/「惜しい」が入り、読み上げられる（D-48。G3 で Safari の VoiceOver で確かめる：5.1 の #75）。Tab を進めると、選択肢（残り 2 つ、使用不可）→ ミルの台詞は Tab で止まらない（読み上げのカーソルで読む：「ミル」→ 台詞）→ 説明のラベルと本文（同上）→ 次の問題へ。「次の問題へ」で次の問の h2 にフォーカスを移す（D-64）。
  - S4：ヘッダー → h1 完了しました → 3 問中 2 問に正解しました → ミル（名前 → 台詞）→ これまでに完了した課題 7 件 → この段階の 4 / 14 件目でした → 祝い → h2 ひとこと解説 → 本文 → 問い → 役に立った → 立たなかった → 今回は答えない。h1 にフォーカス。
  - S5：ヘッダー → h1 → 完了した課題 → 3 問中 2 問に正解しました → 累計 → n / N → 祝い → 今週 → 注記 → 次の一手に進む → h2 解説 → 本文 → 履歴を見る。
  - S7：ヘッダー →（知らせ）→ h1 → ミル（名前 → 台詞）→ 累計 → … → ボタン（r10 と同じ順）。
  - S8：… → 診断 → 案内役（h2 → checkbox「案内役のミルを表示する、チェックボックス、オン」→ 注記）→ ホーム画面 → …。
  - S10：行ごとに日付 → 題名 → 申告 → 3 問中 2 問 → 評価 → 選んだ答えを見る（details。開くと「{選択肢} 正解」「{選択肢} 惜しい」の順）。
  - 全画面で、見える文字がアクセシブルな名前の先頭に入る（SC 2.5.3）。`guide.character` の `aria-label` は見える `guide.name` と同じ文字。
- 英語が長くなったとき（疑似言語の代わりに、英語の文言とその 2 倍の長さで確かめる画面）：S3（`task.skip.note` の 1 文、「Not quite」、説明のラベル「About the correct answer」、選択肢の文字に「Your answer」「Correct」が続く行、「See the summary」、`task.level.adjusted.up` の長文）、S3 の返し（ミルの台詞 40 字と絵の横並び：幅 480 以上で右の列が 640 − 96 − 12 = 532 px、2 倍の 80 字でも 2 行）、S4（「You got 2 of 3 questions right」、`guide.rate.score1`）、S7（`guide.exhausted.levelDone`）、S8（「Show Miru, the guide」「Even when hidden, …」）、S9（「Tasks completed with 1 or fewer correct」）、S10（「Show your answers」「2 of 3 right」、`history.row.unavailable` の 2 文）、S2（`error.tasks.offline` の 2 文）。図のラベルは課題集の日本語のみ（英語の課題集はない：PRD Q4）。r10 の画面は r10 と同じ。
- 押せる範囲：`<button>`（`task.choice` ×3、`task.question.next`、`task.summary.open`、`task.skip`、`task.next.retry` を含む）、radio と checkbox の `<label>`、`<summary>`、単独の `<a>` は 44 × 44 CSS px 以上（tokens の size.target.min）。図の中に押せるものはない。ミルは押せない（押すと何かが起きる期待を作らない：B-2）。
- キーボード：Tab 順は DOM 順。選択肢は `<button>` で Enter / Space。答えた後は `aria-disabled` でフォーカスできるが反応しない（AC-18）。「次の問題へ」で次の問の h2（`tabindex="-1"`）へ。`<details>` は Enter / Space。フォーカスの枠は 3 px の `outline` と 2 px の `outline-offset`（AC-18 の 2 px 以上）。選択肢の枠が 2 px になっても `outline-offset` で地と接し 3:1 を保つ。`aria-disabled` の選択肢にはホバーと押した瞬間の見た目を当てない（tokens.md 4。r12）。再読み込みで復元した S3 ではフォーカスを動かさない（D-64）。

コントラスト（WCAG 2.2 の式。独自の色の組ごと。小数 3 桁目を四捨五入して 2 桁。基準は 16 px の文字が 4.5:1 以上、24 px 以上か 18.5 px 以上の太字の文字と操作部品の枠と図の線が 3:1 以上：R-14、R-15、R-69、R-71。r11 で足した行には「r11」。計算は 11 のスクリプト）
| 前景（文字、アイコン、枠）と背景の組 | ライト | ダーク | コントラストを上げる（ライト / ダーク） |
|---|---|---|---|
| color.text on color.bg（本文、見出し、印の文字と枠、r11：図の箱の枠と線、選択肢の文字、「惜しい」） | 16.48:1 | 15.29:1 | 21.00:1 / 21.00:1 |
| color.text.secondary on color.bg（日付、注記、説明のラベル） | 7.00:1 | 8.93:1 | 13.58:1 / 15.91:1 |
| color.action.primary on color.bg（主操作の塗りと枠、リンクの文字） | 6.70:1 | 8.89:1 | 9.84:1 / 12.21:1 |
| color.action.onPrimary on color.action.primary（主操作の文字） | 6.70:1 | 8.24:1 | 9.84:1 / 12.21:1 |
| color.border on color.bg（副操作のボタン、選択肢の枠（1 px と 2 px）、checkbox） | 5.33:1 | 5.57:1 | 21.00:1 / 21.00:1 |
| color.focus on color.bg（フォーカスの枠） | 6.70:1 | 8.89:1 | 9.84:1 / 12.21:1 |
| color.success on color.bg（r11：「正解」の 16 px 太字の文字と印の線（非文字 3:1）、`task.choice.tag.correct` の 14 px の文字（4.5:1）。r8：完了の印、節目の文） | 6.29:1 | 10.43:1 | 9.95:1 / 14.28:1 |
| color.warning on color.bg（注意の文） | 7.48:1 | 11.36:1 | 10.70:1 / 15.25:1 |
| color.error on color.bg（エラーの文字と枠。`error.tasks.offline` を含む） | 6.57:1 | 7.84:1 | 9.39:1 / 11.83:1 |
| color.figure.accent on color.bg（r11：図の強調の枠 3 px（非文字 3:1）と、強調のラベル 16 px 太字（4.5:1 を目標。太字 18.5 px 未満なので 4.5:1 で見る）。どの設定でも両方を満たす） | 5.02:1 | 8.99:1 | 9.06:1 / 13.78:1 |
| color.guide on color.bg（r11：`guide.name` の 14 px の文字（4.5:1）と台詞の左の 2 px の線（3:1）） | 5.30:1 | 6.93:1 | 8.69:1 / 13.90:1 |
| ミルの輪郭（color.text）on color.bg（r11：絵の形。SC 1.4.11 は輪郭で満たす。PNG はライト #1F1F1F、ダーク #E8E8E8 の 2 枚で、「上げる」では切り替えない（#E8E8E8 on #000000 = 17.14）） | 16.48:1 | 15.29:1 | 16.48:1 / 17.14:1 |
| ミルの目と口の線 #1F1F1F on 体 #B48CE0（r11：表情が読めるか。参考） | 6.10:1 | 6.10:1 | 6.10:1 / 6.10:1 |
| ミルの体 #B48CE0 on color.bg（r11：参考。形は輪郭で持つ） | 2.70:1 | 6.93:1 | 2.70:1 / 7.77:1 |
| color.figure.accent と color.warning（r11：参考。色相が近い 2 色の差。同じ部品に並べない：D-58） | 1.49:1 | 1.26:1 | 1.18:1 / 1.11:1 |
| 押した瞬間の入れ替え、color.overlay の 2 行、radio | r10 と同じ | 同左 | 同左 |

## 10. 決まっていないこと
U-5〜U-22 の記録（決まったことを含む）は r10 と同じで、git の履歴（コミット 7516095）にある。番号は欠番のまま残す。r11 で足した：
- U-23（Takuma、見た目）：図の強調の橙 color.figure.accent（#B45309 / #F2A33A）は color.warning と色相が近い（9 の表の参考の行）。同じ部品に並べない決まり（D-58）で分けたが、S3 で `task.dayChanged`（注意の文）と図の強調が同じ画面に出る場面がある。G3 の画面を見て混ざると判断したら、第 2 候補の紫系（characters/README.md 3：ライト #7E22CE、ダーク #C4B5FD、上げる #581C87 / #DDD6FE）に替える（戻せる。トークンの値だけ）。
- U-24（閉じた。指揮役の決定 2026-11-06：docs/approvals/delegation.md）：復元した返しにもミルを出す。規則は D-53（問 n の返しにだけ、`data-mood` は `answers[n-1].correct`、問 n の「次の問題へ」なし、フェードなし）とD-64（フォーカスは動かさない）。AC-23 の 1・2 通り目は前後とも 1 件（2 の表）。
- U-25（tech-lead）：`showCharacter` を保存データ「なし」（S1 だけ見た状態）でも書けるか。S1 にミルが出るので、S8（保存データなし）にも節「案内役」を置いた（5 の S8）。契約 data.md の「なし」の定義（`diagnosis.area` がない）と両立するか、`device` の下に置くかは tech-lead。
- U-26（閉じた。tech-lead r3 の提案 2）：`data-task-question-index` と `data-task-question-total` は `task.today` の要素に置く（6）。verifier は `[data-testid="task.today"]` から読む。PRD 11 の「ルートの要素」は pdm が「`task.today` の要素に」と直す（指揮役へ：報告の未解決）。
- U-27（tech-lead、ADR）：仕様の前提は PNG のまま `<picture>` で切り替える案 (b)（tech-lead r3 の 3 の推し。D-54。配置は `./img/miru-<mood>[-dark].png`、SW の FILES に足す、AC-44 の画像の要求の数え方からは接頭辞 `img/miru-` で除く）。ADR で確定したら閉じる。案 (a) でも仕様は変わらない（96 px 固定、`aria-hidden`、ライトとダークで輪郭が変わる）。
- U-28（閉じた。指揮役の決定 2026-11-06）：`guide.incorrect.1` を「もう一度、問題文を見てみましょう。」/「Let's read the question again.」にした（7。en 30 字）。問 2、3 の文は U-30。
- U-29（tech-lead、契約）：`task.question.explain` の中身は `explain` と文字列で等しい（AC-41）。ラベル（「選んだ答えについて」）を別の要素にしたのはそのため。契約 test-hooks.md の「選択肢 → 返し」の区間の終点（`data-answer-result` が付く時点）までに説明 1〜2 つとミルを描き終える順を、tech-lead r5 の (4) のとおり契約に書く。
- U-30（Takuma、G3 で見てもらう）：ミルの返しの台詞を正誤 3 本ずつにし、問の番号で選ぶ（D-55。design-reviewer r5 の 7：毎回同じ 1 文だと飾りに寄る）。6 本の文（7 の `guide.correct.1`〜`.3`、`guide.incorrect.1`〜`.3`）と `guide.rate.score1` の言い換えを G3 の画面で見て、口調が合わなければ文だけ替える（戻せる。40 字と禁止語の検査は AC-45 のまま）。

## 11. 変更の記録
### G1 r11 → r12（design-reviewer r5（FAIL 12 / 16）と tech-lead r3（PASS）の指摘。指揮役の決定 2026-11-06：U-24、U-28、6 領域。指揮役の指示書 2026-11-06）
- 前書き：r12 の要約。
- 1：S2 の流れにファイルの先読みとオフラインの例外、S3 の再読み込み（ミル 1 件、「次の問題へ」なし）、問 3 の後の「今日はやめておく」なし、S5 / S6 / S7 のオフラインの例外を消し、S7 の「別の領域を選ぶ」の先の S2 に移した。
- 2：AC-23（1・2 通り目は前後とも 1 件。3 通り目は S8 → S2 の `diagnosis.finish`）、AC-7（問 3 の後の `task.skip` 0 件）、AC-32（復元のミルと「次の問題へ」とフォーカス）、AC-41（`task.question.status`、台詞のキー）、AC-27、AC-45（`settings.character.show` は label、`.input`）。
- 3：S2 の部品にオフラインの alert、S3 の `role="status"` を入れ物に、S7 から alert を外し、S10 に注記の `<p>`。
- 4：D-3（問 3 の後に `task.skip` を外す、注記 1 文）、D-32（空にした）、D-46（復元で「次の問題へ」なし）、D-47（選び直し、`aria-disabled` のホバー）、D-48（status の入れ物を先に置く。MDN の URL）、D-51（横並びは幅 600 以上かつ 3 個以下。数字）、D-53（復元でも出す。規則。PNG と先読み）、D-54（`<picture>` を前提）、D-55（15 キー。正誤 3 本ずつ。`score1` を事実の文に）、D-56（label と input の識別子）、D-61（6 領域。S2 と S10）、D-62、D-64（復元でフォーカスを動かさない）。
- 5：冒頭（6 領域、「なし」の理由）。S2（先読み、読み込み中、オフライン）、S3 の 3 行（status、台詞、skip、復元、選び直し）、S5 / S6 / S7（オフラインの例外なし）、S8、S9、S10（読み込み中とエラー）、ダイアログ。理由のない「なし」は 0。5.1：#26、#27、#47、#56 を書き換え、#74、#75 を足して 75 行。
- 6：`task.question.status`、正誤の行、`settings.character.show.input`（`.label` を消した）、`history.row.unavailable`、`data-title-unavailable`、S2 の `error.tasks.offline`、S5 / S6 / S7 から外した。6.1 の数：文言キー 35 → 40（`guide.correct.*` 3、`guide.incorrect.*` 3、`history.row.unavailable`）、文字を持たない要素 18 行、属性 16 行。
- 7：`task.skip.note`（1 文）、`task.rate.score` と `history.row.score`（ja に {total}）、`error.tasks.offline`（S2。「次の」を外した）、`task.next.retry`（S2）、`guide.correct.1`〜`.3`、`guide.incorrect.1`〜`.3`（`guide.correct`、`guide.incorrect` を置き換え）、`guide.rate.score1`、`settings.character.show`（注記）、`settings.delete.confirm.body`（案内役の設定）、`history.row.unavailable`（新規）。189 → 194。
- 8：性格語「一緒に」の行。9：図の数字、読み上げ（status の入れ物、VoiceOver）、英語の長さ、キーボード。10：U-24、U-26、U-28 を閉じ、U-27 に前提、U-30 を足した。
- tokens.md r9：1 の color.warning から「答えの上限」を消し、4 に `aria-disabled` の行。screens.md：S2 のオフライン、S3（status の入れ物、ミルの顔、台詞、注記 1 文、復元）、図の 6 型の条件、S5 / S6 / S7 のオフラインの行を消し、S8 の label、S10 の読めない行。
- 取り入れなかった提案：なし。tech-lead r3 の提案 1（D-52 の longhand）、4（文言の枠）、6（D-60 の事実の保存）は契約と ADR の側で、仕様の直しは要らない（tech-lead の報告のとおり）。
- 実行したコマンド（2026-11-06）：`python3 scratchpad/verify.py`（7 の表：194 キー、重複 0、空欄 0、感嘆符 0、禁止語（D-65）0 件、`guide.*` 15 キーの ja と en は 40 字以内、差し込み `{…}` の日英の食い違い 0 件）。同じスクリプトで 5 の表：14 行 × 8 列、理由のない「なし」0 個、4 の表：D-1〜D-65 の 65 行に R と原則の欠け 0、5.1：75 行。
### G1 r10 → r11（PRD r13（FB2）、調査 r3、Takuma の選択（ミル、5 色）。指揮役の指示書「5b」2026-11-06）
- 前書き：対象の PRD を r13 に、方向性に案D を足した。状態名の注記に `data-task-question-index` を足した。
- 1：S3 の流れを「導入と図 → 問 1〜3 → まとめへ」に書き直し、S4 をまとめに、S1 と S7 にミルを足し、S5 / S6 / S7 のオフラインの例外（D-61）を足した。
- 2：AC-3、5、7、8、10、12、14、17、18、19、23、24、26、27、31、32、35、38 の行を書き直し、AC-41〜AC-45 を足した。
- 3：S1、S3、S4、S5、S6、S7、S8、S9、S10 の仕事と部品を書き直し、標準から外れる所（選択肢の `<button>`、図の `<figure role="img">`、案内役の絵）を足した。
- 4：D-3、D-5、D-6、D-13、D-15、D-18、D-19、D-20、D-26、D-34、D-44 を書き直し、D-36 と D-43 に r11 の追記、D-46〜D-65 を足した（S3 の流れ、選択肢、正誤、説明、図の共通と 6 型、線の対比の測り方、ミルの出る場所・大きさ・台詞・非表示・reduce、5 色のトークン、正答数、段階の知らせ、オフライン、履歴、統計、キーボード、語の決まり）。
- 5：S3 を 3 行（問 0 / 3、返し、やめておく）に分け、S4〜S10 を書き直した。5.1 は 73 行（r10 の 54 行）。
- 6：消した識別子 20 余り、足した識別子（6.1：文言キー 35、文字を持たない要素 17 行、属性 15 行）。
- 7：20 キーを消し、35 キーを足し、8 キーの文を変えた（`diagnosis.start.lead.1`、`.lead.3`、`settings.import.confirm.body`、`settings.delete.confirm.body`、`task.skipped.title`、`history.empty`、`settings.stats.noTime`、`report.noTime`）。174 → 189。
- 8：色 12 個、性格語に「一緒に」、差をつける点 2 を置き換え、S3 の初期表示の見積もり。9：選択肢、返し、図、checkbox の AX5 と読み上げ、コントラストの表に 6 行。10：U-23〜U-29。
- tokens.md r8：color.figure.accent、color.guide、size.figure.border、size.figure.border.accent、size.radius.figure、部品 5 行（選択肢、返しの区画、図、案内役、チェックボックス）。
- screens.md：S1、S3（2 通り）、S4、S5、S6、S7、S8、S9、S10 を描き直した。
- 実行したコマンド（2026-11-06）：`node scratchpad/contrast.mjs`（9 の表の r11 の行と D-58 の値。出力：figure.accent on bg 5.02 / 8.99 / 9.06 / 13.78、guide on bg 5.30 / 6.93 / 8.69 / 13.90、accent vs warning 1.49 / 1.26 / 1.18 / 1.11、eye line on body 6.10、outline on bg 16.48 / 15.29 / 16.48 / 17.14）。`node scratchpad/check-words.mjs design/001-daily-learning.md`（7 の表：189 キー、重複 0、r11 の 35 キーすべてあり、消した 20 キーなし、禁止語（D-65）0 件、感嘆符 0 件、`guide.*` 11 キーの ja は最長 26 字、en は最長 40 字、2 の表に AC-1〜AC-45（AC-30 を除く）すべてあり）。
### r10 以前
r1〜r10 の記録（G1 r1 → r2、r2 → r3、r3 → r4、G2 r4 → r5、G3 r5 → r6、G1 r6 → r7、r7 → r8、r8 → r9、G3 r9 → r10）は git の履歴（コミット 7516095 の design/001-daily-learning.md の 11）にある。r11 はこの機能の型を変えたので、r10 以前の記録はここに写さない。

## 確かめ（提出前に designer が印を付ける。design-reviewer はこれを信じずに確かめる）
- [x] 調査が先にあり、決定表のすべての行に R-n と原則がある（R-n は調査に実在する。r11 で引いた R-66〜R-91 は調査 r3 の 8）
- [x] 全画面に、仕事、主操作1つ、使う標準部品がある（3。標準から外れる所に本来の部品、理由、対応）
- [x] 全画面の7つの状態が埋まっている（5。「なし」には理由。r12：理由のない「なし」0）
- [x] 押せる範囲が 44x44pt 以上。コントラストが基準を満たし、独自の色の組に数字が3通りある（9 の表。r11 の 2 色は 4 値）
- [x] AX5 での並びと、VoiceOver の読み上げ順が書いてある（9）
- [x] 性格語と差をつける点が、画面のどこに表れているか書いてある（8）
- [x] 文言が日英そろい、テストで使う要素に accessibilityIdentifier（`data-testid`）がある（7、6。194 キー。差し込みの日英の食い違い 0）
