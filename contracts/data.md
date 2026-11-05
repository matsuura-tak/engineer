# 保存データの決まり（001-daily-learning）

形は schemas/data.schema.json（formatVersion 1）です。ここには、スキーマで書けない読み書きの決まりを書きます。
判断の理由は docs/adr/0002-storage-localstorage-single-key.md にあります。

## 1. 置き場所
- localStorage のキー `kyounoitte:data` を 1 つだけ使います。値は保存データを `JSON.stringify` した文字列です。
- この origin（matsuura-tak.github.io）は、同じアカウントの他の GitHub Pages と共有しています。アプリはこのキーだけを読み書き・削除します。`localStorage.clear()`、キーの列挙、他のキーへの書き込みはしません。
- sessionStorage、IndexedDB、Cookie は使いません。

## 2. 書き込みの決まり
- 1 回の保存は、`localStorage.setItem('kyounoitte:data', 文字列)` をちょうど 1 回呼ぶことです。setItem を書き込みの試しなど、他の目的に使いません（AC-11 の失敗の注入が「テストが印を立てた後の次の 1 回」を数えるため。test-hooks.md の W-9）。
- 起動の途中で保存するのは、4 の 6-1 で日付が変わった課題を移すときと、6-4 で今日の課題を出すときだけです。この 2 つが重なったら 1 回の保存にまとめます。
- 画面を開いたまま日付が変わった後の操作で 4 の判定をやり直すとき（4 の「画面を開いたまま日付が変わったとき」）も、起動と同じく最大 1 回です。書きかけの答えは、別に保存せず、この 1 回に含めます。
- つまり、保存データが「なし」か「診断の途中」（3）の起動では setItem を呼びません（AC-11 の注入はこの状態で行う）。「あり」の起動では、上の 2 つのどちらかがあるときだけ、最大 1 回です。
- 保存する時機（これ以外では保存しない）：

| 操作 | 保存する中身 | 1 回で |
|---|---|---|
| 案内 `home.addToHomeScreen` を閉じる | `device.homeGuideClosed: true`（`firstOpenDate` は書かない） | はい |
| 初回の診断で 1 問目、2 問目を確定する | `diagnosis.area`、`diagnosis.level`。「なし」の状態で 1 問目を確定する保存では、`firstOpenDate` に今日も書く | はい |
| 初回の診断で 3 問目を確定する（診断を終える） | `diagnosis.years`、`diagnosis.completedOn`、`levels[area]`、今日の課題（`current`）、印がなければ `device.persistRequested: true`（11） | はい（まとめて 1 回） |
| やり直しの診断を終える | `diagnosis` を新しい回答で置き換え、`levels[area]`。保存データに今日の `current`（まだ申告していない今日の課題）がなければ、4 の「操作で出す」で新しい組から選んだ課題を `current` に（そのとき印がなければ `device.persistRequested: true` も。11）。選べなければ `current` は書かない（S7） | はい（まとめて 1 回） |
| 起動時に日付が変わった課題を移す、今日の課題を出す | `history` に足す、`current`。`current` を作るとき印がなければ `device.persistRequested: true`（11） | はい（まとめて 1 回） |
| 「次の一手に進む」`task.next`（S5、S6） | 4 の「操作で出す」で選んだ課題を `current` に。印がなければ `device.persistRequested: true` も（11）。選べなければ保存しない（S7 を描くだけ。変える値がない） | はい |
| 「次の段階に進む」`task.exhausted.advance`（S7 の levelDone） | `levels[a]` を 1 段上げ（`beginner` → `intermediate` → `advanced`）、4 の「操作で出す」で新しい組から選んだ課題を `current` に（印がなければ `device.persistRequested: true` も。11）。選べなければ上げた `levels[a]` だけを保存し、新しい段階の S7 を描く（中級なら levelDone、上級なら allDone。再読み込みの結果がぶれない：design の D-40） | はい（まとめて 1 回） |
| 答えを書く欄の入力 | `current.answer`。最後の入力から 300 ms 後。`pagehide` と `visibilitychange`（hidden）のときはすぐ。前に保存した値と同じなら保存しない | はい |
| 申告（4 種） | `current` を外し、`history` に行を足す。段階の規則で `levels` が変わればそれも | はい |
| 「役に立ったか」に答える | その行の `helpful` | はい |
| 読み込みで置き換える | ファイルの中身（`device` はこのブラウザの値を残す） | はい |
| すべて削除 | `localStorage.removeItem('kyounoitte:data')`（setItem ではない） | — |

- `persist()` を求めた印 `device.persistRequested: true` は、別の保存にしません。印がないときに今日の課題（`current`）を作る保存（上の表の初回とやり直しの診断を終える保存、`task.next` と `task.exhausted.advance` の保存、起動時の 6-4 の保存、4 の「画面を開いたまま日付が変わったとき」と 7 の読み込みの後の 6-4 の保存）に含めます（11）。`persist()` と `persisted()` の結果は保存しません。`device.persistGranted` は書かず、どの判定にも使いません（前の実装が書いた値を読めるようにスキーマに残す）。そのため永続化のための setItem はなく、「あり」の起動で最大 1 回の決まりは変わりません。
- やり直しの診断（S7 か S8 から入った S2）の回答は、メモリの下書きにだけ持ち、「診断を終える」（`diagnosis.finish`）で上の表の 1 回だけ保存します（ADR 0002 の U-7）。終える前に離れたとき（`diagnosis.cancel`、nav の `nav.history` と `nav.settings`、アプリ名 `app.name`、再読み込み、タブを閉じる、4 の「画面を開いたまま日付が変わったとき」）は、下書きを捨てます。保存せず、保存データは元の診断のままです。
  - 終えた後の行き先（PRD 11 の冒頭の「診断のやり直し」、design の 1 の S8 と S7 の行。r8 で「翌日から効く」をやめた）：
    - 保存データに今日の `current`（まだ申告していない今日の課題）があれば、その課題はそのままで S3 です（`data-task-id` は変わらない。AC-14 の 2 通り目）。新しい診断は、その課題を申告した後の `task.next` で出す課題から効きます。
    - 今日の `current` がなければ（今日の状態が S5、S6、S7。S7 と S8 のどちらから入っても同じ）、4 の「操作で出す」で新しい組から選び、S3 です（AC-14 の 1 通り目）。選べなければ S7 です（同じ領域と段階を選び直したときなど。AC-10）。この `current` は上の表のやり直しの保存に含めます（保存は 1 回）。
    - 出した件数（`issued`）は本人の操作（診断を終える、`task.next`、advance、やり直し）でだけ増えます。

- `firstOpenDate`（統計の「初めて開いた日」。意味は PRD 11 の冒頭の「初めて開いた日」。D9）は、保存データが「なし」（3）の状態で初回の診断の 1 問目を確定する保存（`diagnosis.area` を書く保存）のときに、その時点の今日（4 の「今日」）を書きます。「診断の途中」と「あり」の状態の保存（2 問目以降、1 問目の答え直し、やり直しの診断、申告など）では変えません。
  - `device` だけの保存（案内を閉じた `homeGuideClosed`）では書きません。開いただけの日、案内を閉じて診断せずに去った日は数えないので、iOS の Safari と他のブラウザで「初めて開いた日に完了したか」（9）が同じ基準になります（例：11-01 に案内を閉じて去り、11-03 に診断して完了 → `firstOpenDate` は 11-03、first-day-completed は true）。
  - 削除（7。`removeItem`）の後に診断すれば、その 1 問目の日が新しい `firstOpenDate` です。読み込み（7）では、ファイルの値をそのまま使います。
  - 名前 `firstOpenDate`、`data-stat-first-open-date`、文言キーは変えません（ID を変えない決まり。ADR 0002）。
- 保存に失敗したら（setItem の例外。QuotaExceededError を含む）、画面の中身はそのまま残し、その操作の近くに `error.storage.message` と `error.storage.retry` を出します（design の 5）。やり直しの操作は同じ中身で setItem をもう 1 回呼びます。
- 起動時に今日の課題を出す保存が失敗したら、課題は画面に出し（メモリに持つ）、`error.storage.message` を出します。次の保存に含めます。
- `task.next` と `task.exhausted.advance` の保存が失敗したら、画面は S5 / S6 / S7 のままで、ボタンの直上に `error.storage.message` と `error.storage.retry` を出します（design の 5）。メモリの保存データも変えません（advance なら段階は上がっていない）。`error.storage.retry` は同じ中身の setItem をもう 1 回呼び、成功したら S3（advance で選べなかったときは新しい段階の S7）を描きます。起動時の保存と違い、失敗したまま S3 は描きません。

## 3. 「保存データ」の 3 つの区分
読めた保存データを次のように分けます。起動時の判定（4）、読み込みの確認（7）、設定の画面（design の S8）で同じ定義を使います。
- あり：`diagnosis.completedOn` がある、または `history` が 1 行以上。
- 診断の途中：「あり」ではなく、`diagnosis.area` がある（1〜2 問だけ答えた）。
- なし：キーがない、または上のどちらでもない（例：`device` だけで、`diagnosis` と `levels` が空、`history` が 0 行。`firstOpenDate` はない。AC-21 で案内を閉じた後の状態。見本：fixtures/data/v1/valid-guide-closed-only.json）。
- スキーマでは、`firstOpenDate` を省けるのは `diagnosis` と `levels` が空で `history` が 0 行のときだけです（data.schema.json の allOf の 3 つ目）。「診断の途中」と「あり」では必ずあります。
- 設定の画面（S8）の「保存データがないとき」の表示（書き出し、診断、記録、削除を出さない）は、「なし」と「診断の途中」の両方で使います。統計（9）と書き出しは「あり」のときだけなので、`firstOpenDate` は必ずあります。

## 4. 起動時の判定（行き先の順番）
上から順に調べ、最初に当てはまったものに進みます。
1. 枠の中に入れられている（`window.top !== window.self`）→ 何も始めない（`data-state="loading"` のまま。ADR 0005）。
2. 保存先が使えない：`window.localStorage` を参照するか `getItem` を呼ぶと例外が出る → `data-state="error"`、`error.app.storageUnavailable.*`（S0 error の変種 (2)）。
3. 読めない：値があり、JSON.parse に失敗する、6 の検査に通らない、または `formatVersion` が今の版より新しい → `data-state="error"`、`error.app.*`（S0 error の変種 (1)）。部分だけ読むことはしない。
4. 診断の途中 → S2 の、まだ答えていない最初の質問。答えた質問の回答を radio に戻す。
5. なし → S1（`diagnosis.start`）。
6. あり → 次の順で今日の状態を決める。
   1. `current` があり、その `date` が今日でない → `current` を `report: "none"` の行として `history` に足し、`current` を外す（答えは行に残る。AC-32）。
   2. `current` がある（今日の日付）→ S3（`task.today`）。答えを書く欄に `current.answer` を戻す。同じ日の 2 件目以降（`history` に今日の行がある）でも S3 です（AC-33 の「再読み込みしても同じ `data-task-id`」）。
   3. `history` に今日の日付の行がある → 今日の最後の行（配列で最も後ろの今日の行）の `report` が `done` なら S5（`task.done`）、それ以外なら S6（`task.skipped`）。同じ日に何行あっても最後の行で決めます。
   4. 5 の規則で今日の課題を選ぶ。選べたら `current` に入れて保存し、S3。選べなければ S7（`task.exhausted`。`current` は保存しない。1 で行を移したときは、その移しだけを 1 回保存する）。

- 2 と 3 の順（2026-11-05 に入れ替えた。G1 tech-lead r2 の 3 の (b)）：同じ日に `task.next` で 2 件目を出すと、今日の行と今日の `current` が両方あります。`current` を先に見ないと、再読み込みで 2 件目の S3 が S5 / S6 に化けます。今日の行と今日の `current` が同時にあるのは、`task.next`、advance、やり直しで出した後（と、その状態を書き出したファイルを読み込んだ後）です。
- design-reviewer G1 r2 の提案 2 の順（読めない → 保存先が使えない → 診断の途中 → なし → あり）と、2 と 3（保存先、読めない）の順が逆です。読めるかを調べるには先に getItem が成功している必要があるためで、この 2 つは同時には起きないので、結果は同じです。

### 操作で出すとき（`task.next`、`task.exhausted.advance`、やり直しの診断を終えて今日の `current` がないとき）
- 6 の 2 と 3（今日の `current`、今日の行）を見ずに、6 の 4 へ進みます。選べたら `current` に入れて保存し（2 の表。1 回）、S3。選べなければ S7 です。
  - `task.next` で選べないとき：保存しません（変わる値がない）。
  - advance で選べないとき：上げた `levels[a]` だけを保存し、新しい段階の S7 です。
  - やり直しで選べないとき：新しい `diagnosis` と `levels[area]` だけを保存し、S7 です。
- 選ぶ組は、そのときの `diagnosis.area` と `levels[a]` です（5）。申告で段階が動いた直後の `task.next` は、新しい段階から選びます（AC-8 の 10 通り目）。
- 押す前に日付が変わっていたら、操作はせず、下の「画面を開いたまま日付が変わったとき」に進みます。
- 出せる数に上限はなく、確認も出しません（PRD Q15 は A。AC-33）。

### S7 を再読み込みしたとき（指揮役の決定 2026-11-05。docs/approvals/delegation.md）
- S7 は保存しない状態です。今日の行がある日に操作（`task.next`、やり直し）で着いた S7 を再読み込みすると、6 の 3 で今日の最後の行の S5 / S6 に戻ります。`task.next` をもう一度押すと S7 になります。
- 読み込みで着いた S7（今日の行も今日の `current` もない日）は、再読み込みしても 6 の 4 で S7 です。
- advance で選べず新しい段階の S7 になったときも、今日の行があれば再読み込みで S5 / S6 に戻ります。保存した `levels[a]` は上がったままです。
- 「今日」は端末の日付です。`new Date()` の `getFullYear()`、`getMonth()`、`getDate()` から `YYYY-MM-DD` を作ります。`toISOString()` は UTC なので使いません。
- 画面を開いたまま日付が変わったとき（PRD 11「翌日（…最初の読み込みか操作）」と、冒頭の「日付をまたいだ申告はできない」。design の D-30）：
  - 対象は、画面を描いたときの保存データが「あり」（3）だった画面です（S3〜S10、やり直しの S2、その上のダイアログ）。
  - 対象の画面では、操作（ボタン、リンク、radio の確定、ファイルの選択）のたびに今日を計算し直します。画面を描いた日と違えば、その操作はせず、次の 1〜4 を行います。
    1. 答えの保存のタイマーを止めます。答えを書く欄があれば、その値をメモリに持ち（ここでは保存しない）、欄はここで捨てます。捨てた欄の値を後から保存しません（翌日の `current.answer` に前日の答えを入れないため。AC-32）。
    2. 起動のときと同じく `getItem` で保存を読み直し、この 4 の判定順で行き先を決めます（読めない、保存先が使えないなら S0 error。「なし」なら S1、「診断の途中」なら S2）。
       - 読んだ `current` が、画面に出していた課題（`date` と `taskId` が同じ）なら、その `answer` を 1 で持った値に置き換えてから 6 の判定をします。違えば（別のタブがもう移した）1 の値は使いません。
       - 6-1 の移しと 6-4 の今日の課題（と 1 の値）は 1 回の保存にまとめます（2）。保存に失敗したら、起動時の保存の失敗と同じに扱います（2 の最後の項。移した行と答えはメモリにあり、次の保存に含める）。
       - 読み直す理由：別のタブがこのタブより後に保存していることがあります（例：別のタブで翌日の課題を出した、申告した）。メモリの値で判定して保存すると、その保存を上書きして消します。読み直しは `getItem` だけで、setItem の回数（2）は変わりません。
    3. やり直しの診断の下書きを捨て（2）、開いていたダイアログを閉じます。
    4. 着いた先が S3（`task.today`）か S7（`task.exhausted`）なら、知らせ `task.dayChanged` を出してフォーカスを移します（identifiers.md の 3）。知らせは保存せず、次の操作か再読み込みで消えます。S5 / S6 に着いたとき（別のタブで今日の申告を済ませていたときだけ起きる）は出しません。
       - 例外（design の U-17。2026-11-05）：取り消した操作が `task.next` のときは、S3 / S7 に着いても知らせを出しません。S5 / S6 には `current` がないので 1 で移す課題がなく、6 の 4 で翌日の 1 件目が出ます（`data-task-nth-today` は 1）。結果が本人の意図（次の課題を出す）と同じだからです。
       - `task.exhausted.advance` は例外にしません。段階は上がらず（保存しない）、知らせを出します。S4 の評価、nav、`app.name`、申告も今までどおり知らせを出します。
       - 実装は、操作の入口に操作の名前を渡し、`task.next` のときだけ知らせを描かない形にします。
  - 結果：前の課題は `report: "none"` の行として `history` にあり、書きかけの答えはその行の `answer` にあります。新しい `current.answer` は空です。完了、評価、やり直しの診断の確定は保存されません。
  - 例：23:55 に出した課題を、画面を開いたまま 0:05 に「完了」しようとすると、完了は保存されません（`done` の行も `task.rate` もない）。その課題は 6-1 で `report: "none"` の行に移り、6-4 で翌日の課題が出て、S3 の先頭に `task.dayChanged` が出ます。
  - 例：11-05 23:59 に完了し、`task.rate` のまま 0:01 に「役に立った」を押すと、評価は保存されません（`helpful` は `unanswered` のまま）。S3 に翌日の課題と `task.dayChanged` が出ます。
  - 対象の外（design の U-15）：「なし」と「診断の途中」の画面（S1、初回の S2、保存データがないときの S8）と S0 error では日付を確かめず、操作をそのまま実行します。
    - 理由：履歴に移す課題がありません。日付を使う保存（`firstOpenDate`、`completedOn`、今日の課題）は実行した時点の今日で書くので、日付が変わった後に操作したときと同じ結果になります。
    - 例：初回の診断の 2 問目を 23:59 に出し、0:01 に確定すると、そのまま保存して 3 問目に進みます。3 問目を確定した日が `completedOn` で、その日の課題が出ます。
- ヘッダーのアプリ名 `app.name` を押したときも、4 の判定をやり直します（診断の途中なら S2。design-reviewer G1 r2 の提案 2）。

## 5. 今日の課題の選び方と、段階の規則
- 組：目標の領域 `a = diagnosis.area` と、段階 `L = levels[a]`（なければ `diagnosis.level`）。
- 候補：課題集のうち `area = a` かつ `level = L` で、ID が `history` のどの行にも `current` にもないもの。
- 選ぶ：候補のうち ID が最も小さいもの（文字列の比較。3 桁の 0 埋めなので番号の順と同じ）。`mode` で順番を変えない（PRD 11）。
- 段階の規則（申告を保存するときに行う。AC-8）：
  1. 申告した行の領域を `a` とする。`history` から、領域が `a` で `report` が `none` でない行を新しい順に並べる。
  2. その並びの先頭から、行の `level` が今の `levels[a]` と同じ行が続く間だけを取る（違う段階の行に当たったら止める。段階が変わる前の申告を次の判定に持ち越さないため。やり直しの診断で段階が変わった直後も同じ。PRD 11 の冒頭の「連続」の定義。D10）。
  3. 取った行の先頭 2 行がどちらも `too_hard` なら `levels[a]` を 1 段下げる。どちらも `too_easy` なら 1 段上げる。`beginner` より下、`advanced` より上には動かない。
  4. 変わった段階は次に出す課題から効く（同じ日の `task.next` でも、翌日の 6-4 でも。PRD 11 の冒頭、r8）。表示中の課題は変えない（申告の後なので `current` はもうない）。
- 進級（`task.exhausted.advance`。PRD 11 の冒頭の「修了と進級」）：`levels[a]` を 1 段上げます。申告の規則とは別の操作ですが、段階が変わるので、上の 2 により「連続」はそこから数え直しになります。上級では advance を出しません（allDone）。
- AC-8 の 10 通りの期待値は、この規則で全部そのとおりになります。seed の各行の `level` は、その課題が出たときの段階にします（PRD 11 の AC-8 の確かめ方）。多くの通りでは seed の `levels[a]` と同じ値ですが、9 通り目は `levels[a]` が `intermediate` で、古い 2 行が `advanced` です。
- AC-8 の seed の見本（どれも目標の領域は `backend`。テストは最後の行の翌日 2026-11-03 に時刻を固定して開き、画面で直近の 1 件を申告し、2026-11-04 に固定して開く）：

| 通り | 見本 | 古い方の履歴（古い順） | 画面で申告 | 2026-11-04 の `data-task-level` |
|---|---|---|---|---|
| 1 通り目 | fixtures/seeds/seed-ac8-intermediate-one-too-hard.json | 中で完了、中で難しすぎ | 難しすぎ | `beginner` |
| 8 通り目 | fixtures/seeds/seed-ac8-intermediate-too-hard-then-none.json | 中で難しすぎ、中で `none` | 難しすぎ | `beginner`（`none` は数えず流れも切らない） |
| 9 通り目 | fixtures/seeds/seed-ac8-intermediate-after-advanced-two-too-hard.json | 上で難しすぎ、上で難しすぎ（`levels` は `intermediate`） | 難しすぎ | `intermediate`（`advanced` の 2 行は数えない） |

  - 残りの 6 通りの seed は、上の形で古い行の `report` と `level`、`levels` を変えて verifier が作ります（test-hooks.md の W-7）。
  - 10 通り目（同じ日に 2 件とも画面で申告。PRD r10）：fixtures/seeds/seed-ac8-intermediate-same-day.json（段階は中、履歴は前日 2026-11-02 の完了 1 行だけ）。時刻を 2026-11-03 に固定して開き、S3 で難しすぎ → S6（`task.skipped.levelHint`）→ `task.next` → S3（`data-task-nth-today` が 2、`data-task-level` が `intermediate`）→ 難しすぎ → S6（`task.skipped.levelChanged`。`{level}` は初級）→ `task.next` → S3 の `data-task-level` が `beginner`。時刻は動かしません。

### S7 の変種と補足の 1 文（design の D-40。AC-10）
S7 を描くときの組を `a = diagnosis.area`、`L = levels[a]` とします。
- `L` が `advanced` なら allDone（`task.exhausted.allDone`、`.allDone.detail`、`task.exhausted.redo` だけ）。それ以外は levelDone（`task.exhausted.advance` と `task.exhausted.redo`）。
- levelDone の補足は、次の段階 `N`（`L` の 1 つ上）の組 `(a, N)` で決めます。多くて 1 つです。
  - `(a, N)` にまだ出していない課題が 1 件以上あり、かつ `history` に `area = a` で `level = N` の行が 1 つ以上ある → `task.exhausted.seenNext`。
  - `(a, N)` の課題をすべて出し終えている（未出が 0 件）→ `task.exhausted.nextDone`。
  - どちらでもない → 置かない。
- 「まだ出していない」は 5 の候補と同じ判定です（`history` と `current` のどの行の ID でもない）。
- `{total}`（`.levelDone.detail`、`.allDone.detail`）は課題集の `(a, L)` の件数、`{nextLevel}` は `level.<N>` の文言、`{desc}` は `level.<N>.desc` の文言です（strings.md の 3）。

### 課題集に ID がない行（別の版のファイルを読み込んだとき。G1 tech-lead r2 の (h)）
- 題名は ID そのものを出します（S5 の `task.done.task`、S10 の `history.row.taskTitle`。今の作りと同じ）。
- S4 / S5 の `task.insight` と `task.insight.text` は置きません（0 件）。`task.progress.done` の `{total}` は課題集のその組の件数のままです。
- `current` の ID が課題集にないとき（S3）は、今の作り（backend/public/js/main.js:329。題名は ID、本文の 3 つは空、道具なし）のまま変えません。`task.progress` の `{total}` は課題集のその組の件数です。

## 6. 読むときの検査と、版の移し方
- 順番：JSON.parse → オブジェクトか → `formatVersion` が整数で今の版（1）より大きければ「版が新しい」→ 今の版より小さければ 1 版ずつ今の形に移す → スキーマの検査。v1 は最初の版なので、移す手順はまだありません。
- アプリの中の検査は手で書きます（ajv は CSP の下で動かないため。ADR 0005）。手で書いた検査は、contracts/fixtures/ のすべての見本で ajv と同じ合否になることを、単体テストで確かめます（ADR 0004）。
- 移した結果は、次に保存するときに今の版で書きます。古い版の形では書きません。
- 日付（`firstOpenDate`、`diagnosis.completedOn`、各行と `current` の `date`）は形 `YYYY-MM-DD` だけを検査し、暦にあるか（例：`2026-02-30`）は検査しません。日付は文字列のまま比べ、`new Date()` に渡しません（直近 7 暦日の境目も、端末の今日から作った `YYYY-MM-DD` の文字列と比べる）。
- `firstOpenDate` がないのは「なし」のときだけ（3）。それ以外で欠けていればスキーマで落ちます。
- 読み手が知らない項目か値を書く変更（新しい領域の ID、新しい申告の種類、新しい項目）は、必ず `formatVersion` を上げます。スキーマは知らない項目を拒むので、版を上げずに足すと、古いアプリと古いアプリへの読み込みが「読めない」になります。
- contracts/fixtures/data/v1/ の見本は消しません。版を上げた後も、新しいアプリがこれを読めることを単体テストで確かめ続けます。

## 7. 書き出し、読み込み、壊れたデータの保存、削除
- 書き出し（AC-19）：保存データが「あり」のときだけ出します（3 の S8 の表示）。保存データから `device` を除いたものを `JSON.stringify(データ, null, 2)` にし、`Blob`（`application/json`）と `<a download>` で保存します。ファイル名は `kyounoitte-YYYY-MM-DD.json`（今日の日付）。作った URL は `URL.revokeObjectURL` で消します。
- 読み込み（AC-20、AC-22、AC-25）：
  1. ファイルの大きさが 5,000,000 バイトを超えたら読まずに「形式が違う」。
  2. `file.text()` → 6 の順で検査。版が新しければ `error.import.message` と `error.import.reason.version`、それ以外の失敗は `error.import.message` と `error.import.reason.schema`。確認は出さず、データは変えない。
     - スキーマに通っても、ファイルの中身が「なし」（3。`firstOpenDate` もない）なら `error.import.reason.schema` で止める。アプリは「なし」を書き出さないので手で作ったファイルしかなく、置き換えると削除と同じになるのに削除の確認を通らないため。
  3. 今のブラウザの保存データが「あり」なら `settings.import.confirm` を出す（要約の `{count}` は `history` の行数、`{date}` は `firstOpenDate`）。「なし」か「診断の途中」なら確認を出さない。
  4. 置き換える：ファイルの中身に、今のブラウザの `device` を付けて 1 回で保存する（結合しない）。ファイルの `device` は使わない。`firstOpenDate` はファイルの値をそのまま使う。
  5. 4 の判定をやり直す（`task.today` か `task.done` など。端末の日付による）。
- 壊れたデータの保存（S0 error の `error.app.exportRaw`）：getItem で読んだ文字列をそのまま `Blob` にし、`kyounoitte-raw-YYYY-MM-DD.json` で保存します。
- 削除（AC-16）：`removeItem('kyounoitte:data')` だけを行い、S1 を描きます。キャッシュ（配布物）は消しません。

## 8. 書き手が守る決まり（スキーマの外）
アプリはこれを守って書きます。読むときは、守られていなくても止まらずに動きます（例：日付の順が乱れていても、4 の 6-3 は配列で最も後ろの今日の行で決め、統計は 9 のとおり行を数えるだけ）。contracts/tools/check-schemas.mjs は、valid と seed の見本がこれを守っているかも確かめます。
- `history` は日付の古い順。同じ日付の行は出した順に何行でも並ぶ（同じ日の `task.next`。AC-33。2026-11-05 に「1 つまで」をやめた）。
- どの行の日付も `firstOpenDate` 以上。`current` の日付は `history` の最後の行の日付以上（同じ日の 2 件目以降は同じ日付）。
- 「なし」の状態では `firstOpenDate` を書かない（2）。
- 同じ課題の ID は `history` と `current` を通して 1 回だけ（AC-6）。
- 診断済みなら `levels[diagnosis.area]` がある。

## 9. 統計と画面の数の数え方（AC-24、AC-33、AC-35〜AC-37。identifiers.md の 4）
統計（S9 の `data-stat-*`）：
| 値 | 数え方 |
|---|---|
| first-open-date | `firstOpenDate` |
| issued | `history` の行数 + `current` があれば 1 |
| completed | `report` が `done` の行数 |
| first-day-completed | `report` が `done` で、日付が `firstOpenDate` の行があるか |
| days-completed-7d | `report` が `done` の行の日付のうち、今日を含む直近 7 暦日（今日から 6 日前まで）に入る日付の数（同じ日は 1 つ） |
| days-completed-week | `report` が `done` の行の日付のうち、今週の月曜から今日までに入る日付の数（同じ日は 1 つ。0〜7）。月曜は `ymdShift(now, -((now.getDay() + 6) % 7))`（`now` は端末の今の `Date`。backend/public/js/dates.js の関数）で作った `YYYY-MM-DD` で、文字列のまま比べる（ISO 8601 の週。PRD 11 の冒頭の「今週」、design の D-39） |
| extra-completed | 日付ごとに `max(0, その日の report が done の行数 − 1)` を足し合わせた数（PRD 11 の冒頭の「2 件目以降の完了」。その日に先に申告した done 以外の行は数に入らない） |
| helpful | `helpful` が `helpful` の行数 |
| rated | `helpful` が `helpful` か `not_helpful` の行数（未回答を除く） |
| too-hard | `report` が `too_hard` の行数 |
| no-time | `report` が `no_time` の行数 |

画面の数（S3〜S7。どれも保存しない。保存データから毎回同じ値になるので、再読み込みしても変わらない）：
| 値 | 置く所 | 数え方 |
|---|---|---|
| その日の何件目（`data-task-nth-today`、`task.today.label.nth` の `{nth}`） | S3 | `history` のうち日付が `current.date` の行数 + 1。1 なら `task.today.label`、2 以上なら `task.today.label.nth` |
| この段階の n / N（`data-progress-index` / `-total`、`task.progress` の `{index}` / `{total}`） | S3 | index＝`history` のうち `area` と `level` が `current` と同じ行の数 + 1（`report` を問わず `none` の行も数える）。total＝課題集のその組の件数。表示中の課題（`current`）の組で数え、目標の組では数えない（G1 tech-lead r2 の要修正 2。S3 のまま診断をやり直すと違うため） |
| 終えた課題の n / N（`task.progress.done` の属性と差し込み） | S4、S5 | 完了した行（S4 は申告した行、S5 は今日の最後の行）を `r` とする。index＝`history` の先頭から `r` までのうち、`area` と `level` が `r` と同じ行の数（`r` を含む）。total＝課題集の `(r.area, r.level)` の件数。その課題の S3 の index と同じ値になる |
| 累計（`task.total.value` の `{count}` と `data-stat-completed`） | S4、S5、S7 | 統計の completed と同じ。S4 は申告を保存した後の値（申告した 1 件を含む） |
| 前の累計（`task.total.prev`） | S4（「完了」の直後だけ） | 累計 − 1。`prefers-reduced-motion: reduce` では作らない（identifiers.md の 3） |
| 祝い（`task.cheer` の `data-milestone` と文言） | S4、S5 | 累計が 7、30、100 ならその数の文字列と `task.cheer.at7` / `.at30` / `.at100`。それ以外は `none` と `task.cheer.default`（`{count}` は累計） |
| 今週（`task.week` の `{days}` と `data-stat-days-completed-week`） | S5 | 統計の days-completed-week と同じ |
| 組の最後（`task.next.note` の文言） | S5、S6 | 今の組 `(diagnosis.area, levels[a])`（申告で段階が動いたら動いた後の段階）に、まだ出していない課題が 0 件なら `task.next.note.last`、1 件以上なら `task.next.note`。`task.next` を押すと S7 になるかと同じ判定（4 の「操作で出す」） |
| 段階が変わった（S6 の `task.skipped.levelHint` / `.levelChanged`） | S6 | 今日の最後の行 `r` の `report` が `too_hard` か `too_easy` のときだけ、どちらか 1 つを置く（`no_time` ではどちらも置かない）。次の両方を満たせば `levelChanged`、満たさなければ `levelHint`：(1) `r` を申告した時点に 5 の規則を当てはめると段階が動く（`history` の `r` までの行を、`levels[a]` を `r.level` と読んで 5 の 1〜3 に通す。`beginner` の難しすぎ、`advanced` の簡単すぎは動かない）。(2) 今の `levels[r.area]` が、その動いた先の段階と同じ。`{level}` は動いた先の `level.*` の文言。履歴から決めるので、再読み込みしても同じ |

- S7 の値は 5 の「S7 の変種と補足の 1 文」です。

## 10. 大きさ
- 答えは 2,000 字まで（UTF-16 の単位で数える `textarea` の `maxlength="2000"`。上限に達したら `task.answer.limit`）。スキーマの `maxLength` はコードポイントで数えるので、欄に入った答えは必ず検査を通ります。
- 保存データの文字列（`JSON.stringify` の結果）の長さは、答えの字の種類で変わります。答えの 1 字は JSON で 1〜6 字です：日本語、英数字、絵文字はそのまま。改行、タブ、`"`、`\` は 2 字。そのほかの制御文字（U+0000〜U+001F）と対のないサロゲートは 6 字（`\uXXXX`）。
- 1 年分（`history` 365 行と `current`。答えはすべて 2,000 字）の長さは次のとおりです。答え以外の部分は合計 59,179 字（1 行あたり約 160 字）です（2026-11-03 に tech-lead が node 24.22.1 で測った）。

| 答えの中身（各 2,000 字） | 保存データの長さ（字） |
|---|---|
| 日本語か英数字だけ | 791,179 |
| コードの例（改行、タブ、`"` を含む。JSON で約 1.15 倍） | 902,077 |
| すべて改行、タブ、`"`、`\` のどれか | 1,523,179 |
| すべて制御文字（手では打てず、貼り付けでしか入らない） | 4,451,179 |

- 単体テスト（backend-engineer）は 1 行目の形（`あ` × 2,000 を 366 か所）で、長さが 1,000,000 字以下であることを確かめます。目的は、答え以外の部分が増えすぎていないことの確かめです。字の種類で答えの上限を変えたり、答えの字を削ったりはしません。
- localStorage の上限（2026-11-03、Playwright 1.64.1 で 1 つのキーに入る値の長さを測った）：Chromium 156 は字の種類によらず 5,242,865 字（UTF-16 の単位）。WebKit 27.2 は、値が Latin-1 の字だけなら 5,242,865 字、日本語などを 1 字でも含むと 2,621,432 字（1 字を 2 バイトで数える）。本物の Safari 17 の値と、この origin を共有する他のページ（1）が使う分は未確認です。
- 上の 1 年分の行は、どれも Chromium の上限に入ります。WebKit で 1 年分が上限を超えるのは、日本語を含んだうえで答えのほとんどが制御文字のときだけです。ふつうの答えでも、日本語の 2,000 字を毎日書き続けると約 3.3 年（2,621,432 ÷ 1 日あたり約 2,160 字）で WebKit の上限に届きます。
- 上限を超えたとき：setItem が QuotaExceededError を投げ、前に保存した値はそのまま残ります（Chromium と WebKit で確かめた）。2 の「保存に失敗したら」で扱い、画面の入力も残ります。保存済みのデータは失われませんが、`history` は増えるだけなので、その後の保存は失敗し続けます。v1 には記録を減らす操作がなく、手当ては書き出し（7）です（ADR 0002 の見直す条件）。

## 11. 保存の永続化（`navigator.storage`。AC-13、PRD 11 の冒頭、design の D-23 と D-31。U-14 は指揮役の決定 2026-11-04 で求め直さない）
- 求める時機：保存データで初めて今日の課題を出した直後に 1 回だけです（PRD 11 の冒頭「診断を終えて `task.today` を初めて表示した後に1回だけ」、design の D-23）。後の S3 では求め直しません。
  - 条件：今日の課題（`current`）を作る保存（2 の表の初回とやり直しの診断を終える保存、`task.next` と `task.exhausted.advance` の保存（4 の「操作で出す」）、起動時の 6-4、4 の「画面を開いたまま日付が変わったとき」の 6-4、7 の読み込みの後の 6-4）をするときに、保存する前のデータの `device.persistRequested` が true でなく、`navigator.storage.persist` が関数であること。
  - このとき、その保存に `device.persistRequested: true` を含め（setItem は 1 回のまま。2）、その S3 を描いた後に `navigator.storage.persist()` を 1 回呼びます。先に `persisted()` を調べることはしません。
  - ふつうの使い方では、初回の診断を終える保存がこれに当たり、以後は印があるので呼びません。印のない「あり」のデータ（前の実装で作ったデータ、印のない seed）では、次に今日の課題を出す保存で 1 回だけ呼びます。今日の課題がもうある起動（4 の 6-2、6-3）では呼びません。
  - `persist()` を呼ぶきっかけは「その S3 を描いたこと」です。保存の成否ではありません。保存が失敗したときは、S3 を描くかどうかで次の 2 つに分かれます（2026-11-04、reviewer G2 r3 の提案に答えて明記）。
    - 失敗しても S3 を描く保存（4 の 6-4。起動時、「画面を開いたまま日付が変わったとき」、7 の読み込みの後）：2 の最後の項のとおり課題を画面に出し、その S3 を描いた後に `persist()` を 1 回呼びます。印はメモリの保存データにあり、次の保存に含まれます。
    - 失敗すると S3 を描かない保存（初回とやり直しの診断を終える保存。2 の「保存に失敗したら」で S2 に留まる）：S2 に留まる間は呼びません。`error.storage.retry` で同じ中身の保存が成功し、S3 を描いた後に 1 回呼びます。再試行せずに離れたら（やめる、nav、再読み込み）、印はメモリにも残らず、次に今日の課題を作る保存で同じ条件をもう一度調べます。
    - どちらの道でも、印 1 つにつき呼ぶのは 1 回です（削除の後の新しい保存データは別。次の項）。
  - 削除（7）は `device` ごと消すので、その後に診断し直すと、新しい保存データとしてもう 1 回求めます。読み込み（7）は今のブラウザの `device` を残すので、印も残ります。
  - `persist()` が例外か reject のときは何もしません（印は上の保存に含めたままで、求め直しません）。
- 結果：画面には何も出さず、結果は保存しません（`device.persistGranted` は書かない。2）。結果が返ったときに `track('Storage Persist Answered')` の入口を呼びます（PRD 15。D6 で記録しない）。保存データの形は変えません（`formatVersion` は 1 のまま）。
- 設定の画面（S8）の注意 `settings.storage.notPersisted`：保存データが「あり」のときだけ、S8 を描くたびに `persisted()` を待ちます。
  - `false` のときだけ出します。ない、例外、reject のときは出しません（「許可しませんでした」と言い切れないため）。
  - 答えを待ってから S8 の DOM を入れ、その後で `data-state="settings"` を書きます（identifiers.md の 1）。待つ間に読み込み中の表示は出しません。
  - 待つ上限は 1,000 ms です（S8 へ移る操作の始めから数える）。それまでに答えが決まらなければ、注意を出さずに（「ない」と同じ扱い）S8 を描きます。後から答えが返っても描き直しません（指揮役の決定 2026-11-04。実測は Chromium 61 ms、WebKit 70 ms：reviewer G2 r3）。
  - 待つ間は、前の画面がそのまま残り、その画面の操作も受け付けます。操作を止める仕組みは置きません。
    - S8 へ移る操作は、S8 を描くまで、前の画面が使うメモリの状態（やり直しの下書き、答えの欄の保存待ちなど）を変えません。捨てるもの（2 の「終える前に離れたとき」の下書きなど）は、S8 を描くときに捨てます。
    - 待つ間に次の操作（identifiers.md の 3 の `task.dayChanged` と同じ範囲：ボタン、リンク、radio の確定、ファイルの選択。答えの欄への入力は含まない）が始まったら、その操作を優先し、遅れて S8 を描きません。その操作が画面を移さないとき（必須のエラー、保存の失敗の表示）も同じです。もう一度 S8 へ移る操作をしたら、後の操作の待ちだけが S8 を描きます。
    - 例：S8 から入ったやり直しの S2 で `diagnosis.cancel` を押し、待つ間に `diagnosis.next`（3 問目では `diagnosis.finish`）を押すと、下書きのまま次の問いに進むか、診断を終えます。例外を出さず、遅れて S8 も描きません（reviewer G2 r3 の要修正：下書きを先に捨てると `diagnosis.next` が TypeError になった）。
  - 保存データが「なし」か「診断の途中」の S8 には、この注意を置きません（design の S8）。
- 理由：PRD 11 の冒頭と design の D-23 が「1 回だけ」で、指揮役が PRD を変えない形に決めました（docs/approvals/delegation.md の 2026-11-04 の U-14）。S8 の注意が古くなる問題（design-reviewer G3 r1 の 8）は、注意を `persisted()` で決めることで解けます。
  - 印を今日の課題を出す保存に含める理由：結果が返ってから印と結果を書く別の保存（2026-11-03 までの契約の 2 の表の「`persist()` の結果が返る」の行）を置くと、印のない「あり」のデータの起動で、6-4 の保存と結果の保存の 2 回になり、2 の「最大 1 回」と食い違います。非同期の保存は、AC-11 の「印を立てた後の次の 1 回」の注入とも重なりえます。結果を保存しても使う所がありません（S8 は `persisted()`。PRD 15 のイベントも記録しない：D6）。
- 求め直さないことで失うもの：Chrome は断った要求を後で同じ基準（利用の度合い、インストール、ブックマーク、通知の許可）で評価し直し、確認は出しません（https://web.dev/articles/persistent-storage ）。毎日求めれば後で通る人がいますが、v1 ではそれを取りません。Safari はホーム画面の Web アプリとして開いたかなどで決めます（https://webkit.org/blog/14403/updates-to-storage-policy/ ）。
  - 見直す条件：G4 か公開後に「データが消えた」の報告（PRD 14）があり、そのブラウザで `persisted()` が false だったら、求め直す案（その日の最初の S3 で `persisted()` が false のときだけ。設計メモの変更の記録）を PRD の直し（pdm）と一緒に考えます。
- 未確認：Firefox は確認を出します（web.dev）。求めるのは保存データごとに 1 回だけなので、出ても 1 回です。Firefox は対応ブラウザの外なので、受け入れテストでは確かめません。Safari 17 が確認を出さないことは、公式の文書では見つけていません（G4 で Takuma が実機で見る）。
