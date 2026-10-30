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
- つまり、保存データが「なし」か「診断の途中」（3）の起動では setItem を呼びません（AC-11 の注入はこの状態で行う）。「あり」の起動では、上の 2 つのどちらかがあるときだけ、最大 1 回です。
- 保存する時機（これ以外では保存しない）：

| 操作 | 保存する中身 | 1 回で |
|---|---|---|
| 案内 `home.addToHomeScreen` を閉じる | `device.homeGuideClosed: true`（`firstOpenDate` は書かない） | はい |
| 初回の診断で 1 問目、2 問目を確定する | `diagnosis.area`、`diagnosis.level`。「なし」の状態で 1 問目を確定する保存では、`firstOpenDate` に今日も書く | はい |
| 初回の診断で 3 問目を確定する（診断を終える） | `diagnosis.years`、`diagnosis.completedOn`、`levels[area]`、今日の課題（`current`） | はい（まとめて 1 回） |
| やり直しの診断を終える | `diagnosis` を新しい回答で置き換え、`levels[area]`。今日まだ課題を出していなければ `current` も | はい |
| 起動時に日付が変わった課題を移す、今日の課題を出す | `history` に足す、`current` | はい（まとめて 1 回） |
| 答えを書く欄の入力 | `current.answer`。最後の入力から 300 ms 後。`pagehide` と `visibilitychange`（hidden）のときはすぐ。前に保存した値と同じなら保存しない | はい |
| 申告（4 種） | `current` を外し、`history` に行を足す。段階の規則で `levels` が変わればそれも | はい |
| 「役に立ったか」に答える | その行の `helpful` | はい |
| `persist()` の結果が返る | `device.persistRequested: true`、`device.persistGranted` | はい |
| 読み込みで置き換える | ファイルの中身（`device` はこのブラウザの値を残す） | はい |
| すべて削除 | `localStorage.removeItem('kyounoitte:data')`（setItem ではない） | — |

- やり直しの診断（S7 か S8 から入った S2）の回答は、メモリの下書きにだけ持ち、「診断を終える」（`diagnosis.finish`）で上の表の 1 回だけ保存します（ADR 0002 の U-7）。終える前に離れたとき（`diagnosis.cancel`、nav の `nav.history` と `nav.settings`、アプリ名 `app.name`、再読み込み、タブを閉じる、4 の「画面を開いたまま日付が変わったとき」）は、下書きを捨てます。保存せず、保存データは元の診断のままです。

- `firstOpenDate`（統計の「初めて開いた日」。意味は PRD 11 の冒頭の「初めて開いた日」。D9）は、保存データが「なし」（3）の状態で初回の診断の 1 問目を確定する保存（`diagnosis.area` を書く保存）のときに、その時点の今日（4 の「今日」）を書きます。「診断の途中」と「あり」の状態の保存（2 問目以降、1 問目の答え直し、やり直しの診断、申告など）では変えません。
  - `device` だけの保存（案内を閉じた `homeGuideClosed`、`persistRequested` と `persistGranted`）では書きません。開いただけの日、案内を閉じて診断せずに去った日は数えないので、iOS の Safari と他のブラウザで「初めて開いた日に完了したか」（9）が同じ基準になります（例：11-01 に案内を閉じて去り、11-03 に診断して完了 → `firstOpenDate` は 11-03、first-day-completed は true）。
  - 削除（7。`removeItem`）の後に診断すれば、その 1 問目の日が新しい `firstOpenDate` です。読み込み（7）では、ファイルの値をそのまま使います。
  - 名前 `firstOpenDate`、`data-stat-first-open-date`、文言キーは変えません（ID を変えない決まり。ADR 0002）。
- 保存に失敗したら（setItem の例外。QuotaExceededError を含む）、画面の中身はそのまま残し、その操作の近くに `error.storage.message` と `error.storage.retry` を出します（design の 5）。やり直しの操作は同じ中身で setItem をもう 1 回呼びます。
- 起動時に今日の課題を出す保存が失敗したら、課題は画面に出し（メモリに持つ）、`error.storage.message` を出します。次の保存に含めます。

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
   2. `history` に今日の日付の行がある → `report` が `done` なら S5（`task.done`）、それ以外なら S6（`task.skipped`）。
   3. `current` がある（今日の日付）→ S3（`task.today`）。答えを書く欄に `current.answer` を戻す。
   4. 5 の規則で今日の課題を選ぶ。選べたら `current` に入れて保存し、S3。選べなければ S7（`task.exhausted`。`current` は保存しない。1 で行を移したときは、その移しだけを 1 回保存する）。

design-reviewer G1 r2 の提案 2 の順（読めない → 保存先が使えない → 診断の途中 → なし → あり）と、2 と 3 の順が逆です。読めるかを調べるには先に getItem が成功している必要があるためで、2 と 3 は同時には起きないので、結果は同じです。
- 「今日」は端末の日付です。`new Date()` の `getFullYear()`、`getMonth()`、`getDate()` から `YYYY-MM-DD` を作ります。`toISOString()` は UTC なので使いません。
- 画面を開いたまま日付が変わったとき：操作（ボタン、リンク、radio の確定）のたびに今日を計算し直し、画面を描いた日と違えば、書きかけの答えを保存してから、その操作はせずに 4 の判定をやり直します（PRD 11「翌日（…最初の読み込みか操作）」）。
  - 例：23:55 に出した課題を、画面を開いたまま 0:05 に「完了」しようとすると、完了は保存されず（`done` の行も `task.rate` もない）、その課題は 6-1 で `report: "none"` の行に移り、6-4 で翌日の課題が出ます。
- ヘッダーのアプリ名 `app.name` を押したときも、4 の判定をやり直します（診断の途中なら S2。design-reviewer G1 r2 の提案 2）。

## 5. 今日の課題の選び方と、段階の規則
- 組：目標の領域 `a = diagnosis.area` と、段階 `L = levels[a]`（なければ `diagnosis.level`）。
- 候補：課題集のうち `area = a` かつ `level = L` で、ID が `history` のどの行にも `current` にもないもの。
- 選ぶ：候補のうち ID が最も小さいもの（文字列の比較。3 桁の 0 埋めなので番号の順と同じ）。`mode` で順番を変えない（PRD 11）。
- 段階の規則（申告を保存するときに行う。AC-8）：
  1. 申告した行の領域を `a` とする。`history` から、領域が `a` で `report` が `none` でない行を新しい順に並べる。
  2. その並びの先頭から、行の `level` が今の `levels[a]` と同じ行が続く間だけを取る（違う段階の行に当たったら止める。段階が変わる前の申告を次の判定に持ち越さないため。やり直しの診断で段階が変わった直後も同じ。PRD 11 の冒頭の「連続」の定義。D10）。
  3. 取った行の先頭 2 行がどちらも `too_hard` なら `levels[a]` を 1 段下げる。どちらも `too_easy` なら 1 段上げる。`beginner` より下、`advanced` より上には動かない。
  4. 変わった段階は翌日の課題から効く（今日はもう課題を出さない）。
- AC-8 の 9 通りの期待値は、この規則で全部そのとおりになります。seed の各行の `level` は、その課題が出たときの段階にします（PRD 11 の AC-8 の確かめ方）。多くの通りでは seed の `levels[a]` と同じ値ですが、9 通り目は `levels[a]` が `intermediate` で、古い 2 行が `advanced` です。
- AC-8 の seed の見本（どれも目標の領域は `backend`。テストは最後の行の翌日 2026-11-03 に時刻を固定して開き、画面で直近の 1 件を申告し、2026-11-04 に固定して開く）：

| 通り | 見本 | 古い方の履歴（古い順） | 画面で申告 | 2026-11-04 の `data-task-level` |
|---|---|---|---|---|
| 1 通り目 | fixtures/seeds/seed-ac8-intermediate-one-too-hard.json | 中で完了、中で難しすぎ | 難しすぎ | `beginner` |
| 8 通り目 | fixtures/seeds/seed-ac8-intermediate-too-hard-then-none.json | 中で難しすぎ、中で `none` | 難しすぎ | `beginner`（`none` は数えず流れも切らない） |
| 9 通り目 | fixtures/seeds/seed-ac8-intermediate-after-advanced-two-too-hard.json | 上で難しすぎ、上で難しすぎ（`levels` は `intermediate`） | 難しすぎ | `intermediate`（`advanced` の 2 行は数えない） |

  - 残りの 6 通りの seed は、上の形で古い行の `report` と `level`、`levels` を変えて verifier が作ります（test-hooks.md の W-7）。

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
アプリはこれを守って書きます。読むときは、守られていなくても止まらずに動きます（例：同じ日の行が 2 つあれば新しい方を使う）。contracts/tools/check-schemas.mjs は、valid と seed の見本がこれを守っているかも確かめます。
- `history` は日付の古い順で、同じ日付の行は 1 つまで。
- どの行の日付も `firstOpenDate` 以上。`current` の日付は `history` の最後の行より新しい。
- 「なし」の状態では `firstOpenDate` を書かない（2）。
- 同じ課題の ID は `history` と `current` を通して 1 回だけ（AC-6）。
- 診断済みなら `levels[diagnosis.area]` がある。

## 9. 統計の数え方（AC-24。identifiers.md の 4）
| 値 | 数え方 |
|---|---|
| first-open-date | `firstOpenDate` |
| issued | `history` の行数 + `current` があれば 1 |
| completed | `report` が `done` の行数 |
| first-day-completed | `report` が `done` で、日付が `firstOpenDate` の行があるか |
| days-completed-7d | `report` が `done` の行の日付のうち、今日を含む直近 7 暦日（今日から 6 日前まで）に入る日付の数（同じ日は 1 つ） |
| helpful | `helpful` が `helpful` の行数 |
| rated | `helpful` が `helpful` か `not_helpful` の行数（未回答を除く） |
| too-hard | `report` が `too_hard` の行数 |
| no-time | `report` が `no_time` の行数 |

## 10. 大きさ
- 答えは 2,000 字まで（UTF-16 の単位で数える `textarea` の `maxlength="2000"`。上限に達したら `task.answer.limit`）。
- 1 年（365 行）すべてに 2,000 字の答えがあっても、保存データの文字列は 1,000,000 字以下になります（1 行の答え以外の部分は約 150 字）。単体テストで、365 行の見本を作って長さを確かめます。
- localStorage の 1 origin あたりの上限は、ブラウザごとに約 5 MB と言われていますが、未確認です（この origin を他のページと共有している点にも注意）。上限を超えたときの QuotaExceededError は 2 の「保存に失敗したら」で扱います。
