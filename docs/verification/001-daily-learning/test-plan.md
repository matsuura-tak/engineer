# テスト計画 001-daily-learning：診断と今日の学習（Web アプリ「今日の一手」）

- 書いた役：verifier　日付：2026-11-04（r5：design r6（D-30 の知らせ `task.dayChanged`、D-31 の `persisted()`、U-14 と U-15 の決定）と契約の更新（3b7068a、3689e3d。data.md 4 と 11、identifiers.md 3、test-hooks.md W-3 と W-9）に合わせて、AC-13 と AC-32 を直し、AC-27 と AC-32 に 1 本ずつ、AC にない design の状態の `DESIGN_` を 4 本足した。直した所は 10 章、赤の証拠は 8 章の r6-red.log。r4：PRD r7（承認済み。Q11 は A）で AC-14 に足された 2 通り目のテストを 1 本足した。直した所は 10 章。r3：G2 の判定 tech-lead r2 の要修正「時間の計り方」と提案 4 件を反映。r2 の反映も 10 章）
- 実装のコードを見ずに書いた：はい（backend/ は空。読んだのは下のファイルだけ）
- 読んだファイル（PRD、design/、contracts/ と、指揮役が指定した ADR・型・前回の判定）：
  - docs/prd/001-daily-learning.md（r7。11 の冒頭の決まり（「診断のやり直し」の行を含む）と AC-1〜AC-32（AC-14 の 2 通り目を含む）、12、18 の Q11）
  - design/001-daily-learning.md（r4。1 流れ、2 AC と画面の対応、5 状態、6 識別子、7 文言）、design/001-daily-learning/screens.md、design/tokens.md（size.focus.width 3 px）
  - contracts/README.md、data.md、strings.md、identifiers.md、test-hooks.md（W-1〜W-16、AC-31 の数え方、AC-28 の差し替え、静的サーバーのヘッダー）、service-worker.md、budgets.md、dependencies.md、schemas/data.schema.json、tasks.schema.json、strings.schema.json、fixtures/seeds/*、fixtures/data/v1/*、fixtures/data/invalid-newer-version.json、fixtures/tasks/valid-sample.json、fixtures/strings/valid-*.json、tools/check-schemas.mjs
  - docs/adr/0001、0002、0003、0004、0005、docs/adr/features/001-daily-learning.md（2 の対応表）
  - r5 で読み直したもの：design/001-daily-learning.md（r6。1 の流れの「翌日」、2 の表の下「AC にない状態」、4 の D-30 と D-31、5 の S3 / S7 / S8、7 の `task.dayChanged`、10 の U-14（決定済み）と U-15）、contracts/data.md（2、4「画面を開いたまま日付が変わったとき」と「対象の外（design の U-15）」、11）、contracts/identifiers.md（3 の `task.dayChanged`、146 キー）、contracts/test-hooks.md（W-3「画面を開いたまま日付を進めるとき」、W-9 の AC-13 の注入と呼ぶ回数）、contracts/schemas/strings.schema.json（required 146）、docs/prd/001-daily-learning.md（11 の冒頭「日付をまたいだ申告はできない」と「`navigator.storage.persist()` は…1回だけ」、AC-13、AC-27、AC-32）、docs/approvals/delegation.md（2026-11-03 と 2026-11-04 の決定）、evidence/exploration/R3.log（日付をまたぐ探索の手順）
  - docs/templates/test-plan.md、docs/org/gates.md、CLAUDE.md、docs/reviews/001-daily-learning-G0-verifier-r3.md（W-1〜W-16 の元）、docs/reviews/001-daily-learning-G2-tests-tech-lead-r1.md、docs/reviews/001-daily-learning-G2-tests-reviewer-r1.md（r2 で反映）、docs/reviews/001-daily-learning-G2-tests-tech-lead-r2.md と contracts/test-hooks.md「時間の計り方」（r3 で反映）、contracts/test-hooks.md W-7 の AC-14 の 2 通り目の行と contracts/data.md 2「終えた後の行き先」（r4 で反映）
- 読み替え：Web アプリなので、型の「launch argument」は「Playwright の addInitScript、clock、setOffline、CDP、locale、UA」、「再起動」は「再読み込みと新しいタブ」、「API の受け入れテスト」は「配布物の JSON（課題集、文言）を HTTP で読む検査」に読み替える。
- テストの置き場所：backend/tests/acceptance/（設定、サーバー、ヘルパー、seed、tests/）。動かし方は同じフォルダの README.md。

## 1. リスク
影響「大」は、自動テスト、3 章の行、6 章の探索 1 本。影響「小」は代表のテスト 1 本。
| # | リスク | 影響 | 起きやすさ | 関わる AC | 試す深さ |
|---|---|---|---|---|---|
| R1 | 履歴や診断が消える、または置き換わる（読み込みの置き換え、削除、版の差し替え、7 日消去への手当ての書き出し・読み込みが壊れる） | 大 | 中 | AC-16、AC-19、AC-20、AC-22、AC-25、AC-28 | 自動（書き出しの JSON をスキーマと値で比べる。版の差し替えの前後で deep equal）、3 章「データがある」「前の版」、探索 1 本 |
| R2 | 段階の規則（2 回連続）や統計の数が間違う（利用者の段階がずれる、KPI の判定を誤る） | 大 | 中 | AC-8、AC-24、AC-9、AC-7 | 自動（AC-8 は 9 通り 10 本を seed → 画面で申告 → 翌日の順で。AC-24 は 9 値すべて）、探索 1 本 |
| R3 | 主な流れが最後まで進まない（開く → 診断 3 問 → 課題 → 申告 → 翌日に次の課題） | 大 | 中 | AC-1、AC-2、AC-5、AC-6、AC-7、AC-10、AC-31 | 自動（Chromium と WebKit）、3 章「初めて起動」「データがある」、探索 1 本 |
| R4 | オフラインや更新で開けない、古い版のまま残る（通勤中に使えない。公開後に足した課題が届かない） | 大 | 中 | AC-12、AC-23、AC-28、AC-15 | 自動（送信 0 件の数え方 W-12、SW の準備 W-13、2 秒おき 3 回）、3 章「オフライン」、探索 1 本 |
| R5 | 保存の失敗や永続化の拒否で入力が失われる、または止まる | 大 | 小 | AC-11、AC-13、AC-32 | 自動（失敗と拒否の注入 W-9。答えの 1 秒以内の保存と翌日の none の行）、3 章「権限」「容量不足」、探索 1 本 |
| R6 | スマホの幅・大きい文字・キーボード・支援技術で操作できない | 中 | 中 | AC-17、AC-18、AC-27 | 自動（幅 320、移動キーだけ（WebKit は Alt+Tab。test-hooks.md「キーボードの移動キー」）、axe-core 6 画面）、3 章「大きい文字」 |
| R7 | 課題集の質と量が足りない（4 要素の欠け、組の不足、external の超過、ID の重複） | 中 | 中 | AC-3、AC-4、AC-29、AC-30 | 自動（配布物の JSON を全件。画面の印は AC-30） |
| R8 | iOS の Safari で案内が出ない、またはどのブラウザにも出てしまう。スタンドアロンで読み込みに辿り着けない | 中 | 中 | AC-21、AC-22 | 自動（iPhone の UA、iPad の Mac UA + maxTouchPoints、偽装なし、standalone true） |
| R9 | 英語の環境で日本語のまま、または文言キーの欠け | 小 | 小 | AC-26 | 代表 2 本（en-US、ja-JP）とキーの差 0 件 |

## 2. 受け入れ条件とテストの対応
ファイルはすべて backend/tests/acceptance/tests/。テスト名は `AC<番号>_<結果>`（grep で数えられる）。chromium と webkit の両方で動かす（AC-15 だけ chromium）。seed の形はすべて contracts/schemas/data.schema.json に通したもの。日付は `page.clock.setFixedTime`（W-3）で固定し、timezoneId は Asia/Tokyo。
| AC | リスク | 技法 | 試す値（境界、遷移、ルールの列） | 種類 | ファイル::テストの名前 | 確かめる結果（具体的な値） |
|---|---|---|---|---|---|---|
| AC-1 | R3 | 状態遷移、境界（500 ms） | 保存なし → S1 → S2 ×3 → S3。時刻 2026-11-03 | 画面 | ac01-ac02-diagnosis.spec.mjs::AC1_初めて開くと診断が始まり3問で終わる_進み具合n/3_切り替え500ms以内 | `data-state` が `diagnosis.start` → `diagnosis.question`。`diagnosis.progress` の `data-question-index` が 1、2、3、`data-question-total` が 3、文字が ja の「質問 n / 3」。4 区間を記録：始める→1 問目、1→2、2→3 が各 500 ms 以下（PRD 12「AC-1 で 3 回計る」）、3→課題が 1,000 ms 以下（AC-2）。時間は契約「時間の計り方」の「文書が変わらない区間」のとおりページの中で計る（始点：操作の testid の click の capture 段の `performance.now()`、終点：MutationObserver が `data-state=diagnosis.question` と `data-question-index=n+1`（課題は `data-state=task.today`）を見た時刻。記録は `globalThis.__acceptanceTiming`。ms の整数に切り上げて annotation に残す。記録がなければ落とす）。差を取った後に expect で状態と中身を確かめる（expect は時間に使わない）。最後の番号が 3 で、課題の後に progress が 0 件。ja.json に `diagnosis.progress` があることを先に確かめる |
| AC-2 | R3 | 同値分割（領域 × 段階を変えた 3 通り） | (backend, intermediate, 1to3)、(frontend, beginner, lt1)、(git, advanced, gte5) | 画面 | 同::AC2_診断を終えると1秒以内に課題が1件出て領域と段階が一致する_<area>_<level>（3 本） | `diagnosis.finish` の click（capture 段の `performance.now()`）から `data-state=task.today` になった DOM の変化までを、ページの中で計った値（helpers/app.mjs の diagnose の finishMs。契約「時間の計り方」）が 1,000 ms 以下。`[data-testid="task.today"]` が 1 件、`data-task-area` と `data-task-level` が回答と一致 |
| AC-3 | R7 | 全数検査、境界（1〜15） | 配布物 `data/tasks.json` の全件 | JSON | ac03-ac04-ac29-tasks-json.spec.mjs::AC3_課題集の全件が4要素を持ち所要時間が1〜15分 | 200 と `application/json`。tasks.schema.json に通る。全件で title、why、how、goal の trim 後が 1 文字以上、minutes が整数で 1 以上 15 以下。違反の一覧が [] |
| AC-4 | R7 | 全数検査、件数 | 全体、18 組、ID | JSON | 同::AC4_課題集は126件以上で18組すべて7件以上でIDの重複が0件 | 全体 ≥ 126、組が 18 で各 ≥ 7、重複 ID が [] |
| AC-5 | R3 | 状態遷移（S3 → S4 → S5、再読み込み ×2） | seed-ac14（3 件完了）、2026-11-04 | 画面 | ac05-ac06-ac07-ac09-report.spec.mjs::AC5_完了するとtask.rateになり_答えるとtask.done_同じ日に再読み込みしてもtask.doneのまま | `task.rate` → `task.done`。再読み込み 2 回とも `task.done` で `task.today` が 0 件。履歴の先頭の行が {taskId, date 2026-11-04, report done} |
| AC-6 | R3 | 状態遷移（翌日） | 11-04 に完了 → 11-05 に読み込み | 画面 | 同::AC6_翌日には過去に出した課題のIDと一致しない課題が出る | 11-04 の ID が seed の 001〜003 にない。11-05 に `task.today` で、ID が {001, 002, 003, 11-04 の ID} のどれとも違い、領域 backend |
| AC-7 | R2、R3 | 同値分割（3 種） | too_hard、too_easy、no_time | 画面 | 同::AC7_<report>を申告するとtask.skippedになり履歴に残り_再読み込みしても新しい課題は出ない（3 本） | `task.skipped`。履歴 4 行で先頭が {taskId, date, report=その種類}。再読み込みで `task.skipped` のまま、`task.today` 0 件 |
| AC-8 | R2 | デシジョンテーブル（9 通り。5 通り目は「または」で 2 本） | data.md 5 の表。seed（段階と古い 2 行）→ 11-03 に画面で申告 → 11-04 | 画面 | ac08-level-rule.spec.mjs::AC8_1通り目…AC8_9通り目（10 本） | 11-03 の `data-task-level` が seed の段階。11-04 の `data-task-level`：1 beginner、2 advanced、3 intermediate、4 intermediate、5a intermediate、5b intermediate、6 beginner、7 advanced、8 beginner、9 intermediate。どちらの日も ID が seed と重ならない |
| AC-9 | R2 | 同値分割（選ぶ ×2、閉じる、再読み込み） | helpful、not_helpful、close、reload | 画面 | 同（ac05…）::AC9_役に立ったを選ぶ…helpful ／ AC9_立たなかった…not_helpful ／ AC9_選ばずに再読み込み…unanswered ／ AC9_今回は答えない…unanswered（4 本） | `task.done` になり、再読み込みで `task.rate.helpful` が 0 件（再び聞かれない）。履歴の先頭の `data-helpful` が helpful / not_helpful / unanswered / unanswered |
| AC-10 | R3 | 空、状態遷移 | 本番の課題集の backend/intermediate を全件出し終えた seed（件数は課題集から動的）。翌日 | 画面 | ac10-ac30-exhausted-external.spec.mjs::AC10_課題が尽きるとtask.exhaustedと文言とやり直しの操作が出て_同じ領域と段階でやり直すと同じ日に再びtask.exhausted | `task.exhausted`、`task.exhausted.message` の文字が ja の値、`task.exhausted.redo` が 1 件、`task.today` 0 件。redo → S2 → 同じ組 → 同じ日に `task.exhausted` |
| AC-11 | R5 | エラーの注入（次の 1 回） | 2 問目（database, advanced）の確定で setItem が QuotaExceededError | 画面 | ac11-ac13-storage.spec.mjs::AC11_2問目の保存が失敗してもerror.storage.messageと選択が残り_やり直すと3問目に進み課題が回答と一致する | `error.storage.message` 表示、`error.storage.retry` 1 件、`data-question-index` 2 のまま、`level.advanced` が checked。retry → index 3、message 0 件。finish → `task.today` で area database、level advanced |
| AC-12 | R4 | オフライン（送信 0 件） | 読み込み後、W-13（SW の準備）の合図を待ってから setOffline（PRD の「読み込み終えた後に」をこの合図で読む。待たないと `sw.js` の取得と競る）。(a) AC-1、2、5、9 (b) AC-1、2、7 | 画面 | ac12-ac23-offline.spec.mjs::AC12_オフラインでもAC-1_AC-2_AC-5_AC-9の操作が動き_送信は0件 ／ AC12_オフラインでもAC-7の申告が動き_送信は0件 | 各 AC の再読み込みより前の Then（(a) は始める→1、1→2、2→3 が各 500 ms、3→課題が 1,000 ms を AC-1、AC-2 と同じ計り方（ページの中。契約「時間の計り方」）で、領域、`task.done`、履歴の helpful。(b) は `task.skipped`、no_time）。fromServiceWorker でない応答 + requestfailed が 0 件（W-12） |
| AC-13 | R5 | 権限の拒否の注入、回数（1 回だけ） | `StorageManager.prototype.persist` と `persisted` の両方が false（W-9、D-31）。testing/beginner を診断（2026-11-03）→ 完了 → 同じ日に再読み込み → 2026-11-04 に再読み込み | 画面 | 同（ac11…）::AC13_persistを断られても完了と再読み込みでtask.done_履歴1件_設定にnotPersistedと書き出しがある | 診断を終えた読み込みで `persist()` がちょうど 1 回（`expect.poll`）、保存データ（localStorage の `kyounoitte:data`）の `device.persistRequested` が true で `persistGranted` がない（data.md 2 の表と 11）。再読み込みで `task.done`、履歴 1 行 {taskId, done}、S8 に `settings.storage.notPersisted` が見え `settings.export` が 1 件、再読み込み後の文書で `persist()` が 0 回。翌日（11-04）の再読み込みで `task.today`（別の ID）→ S8 でも notPersisted が見え、`persist()` が 0 回、`persistRequested` が true のまま（PRD 11 の冒頭「1回だけ」、U-14 の決定） |
| AC-14 | R1、R2 | 状態遷移（2 通り。1 通り目：S7 → S8 → S2 → S3。2 通り目：S3 → S8 → S2 → S3（同日）→ 翌日の S3） | 1 通り目：本番の課題集から作る backend/intermediate を出し終えた seed（W-7 の AC-14 の 1 通り目の行。最後の 3 行＝今日の直前の 3 日が done、残りは no_time）。翌日 → `task.exhausted` → 設定 → やり直し → frontend/beginner。2 通り目（PRD r7、Q11 は A）：契約の見本 seed-ac14-three-completed.json（done 3 件、最後の行 2026-11-03、`current` なし）を 2026-11-04 に固定して開き `task.today`（2026-11-03 だと 6-2 で `task.done` になる） → 設定 → やり直し → backend 以外の frontend/beginner → 同日のまま → 2026-11-05 に固定して再読み込み | 画面 | ac14-ac16-redo-delete.spec.mjs::AC14_今日の課題を出していない日に設定からやり直して別の領域を選ぶと_新しい領域の課題が出て完了の履歴は3件のまま、同::AC14_今日の課題が出ている日に設定からやり直して別の領域を選んでも_その日は同じdata-task-idのtask.todayのままで完了の履歴は3件_翌日は新しい領域の課題が出る | 1 通り目：seed の done 3 行の日付が今日の -3、-2、-1 日。`task.today` の `data-task-area` が frontend、level beginner。履歴の done が 3 行、行数は seed と同じ。2 通り目：やり直しの前の `task.today` の `data-task-area` が backend で `data-task-id` を控える。やり直しの直後は `data-state` が `task.today` のままで `data-task-id` が前と同じ（area も backend のまま）、履歴の done が 3 行で行数 3。2026-11-05 に再読み込みすると `task.today` の `data-task-area` が frontend、level beginner、`data-task-id` が前と違う。履歴の done が 3 行のままで行数 4、`data-date` 2026-11-04 の行が `data-report` none で `data-task-id` が前の課題（PRD 11 の冒頭「診断のやり直し」、data.md 2「終えた後の行き先」、4 の 6-1）。1 通り目とは別の Then なので言い換えではない |
| AC-15 | R4 | 性能（5 回、境界 2,000） | Chromium。CDP：latency 150、下り 200,000 B/s、上り 93,750 B/s、CPU 4 倍。新しいコンテキスト × 5、seed-diagnosed-2026-10、時刻は固定しない | 画面 | ac15-load-time.spec.mjs::AC15_遅い回線とCPU4倍の制限でキャッシュなしに開き_data-debug-load-msが5回とも2000以下 | `task.today` を待って `data-debug-load-ms`（整数の文字列）を 5 回読み、全部 2,000 以下。値を annotation に残す |
| AC-16 | R1 | 状態遷移（削除 → 初回） | seed-ac14、11-04。S8 → dialog → ok → 再読み込み → 診断 | 画面 | 同（ac14…）::AC16_すべてのデータを削除すると再読み込みでdiagnosis.startになり_やり直した後の履歴は0件 | `settings.delete.confirm` が見え、ok で `diagnosis.start`。再読み込みでも `diagnosis.start`。診断後の `history.row` 0 件、`history.empty` が見える |
| AC-17 | R6 | 境界（幅 320、dSF 2）、4 状態 | diagnosis.start、task.today、task.done、task.exhausted | 画面 | ac17-ac18-ac27-a11y.spec.mjs::AC17_<state>_横スクロール0_切り詰め0_操作できる要素がすべて押せる（4 本） | `documentElement.scrollWidth` ≤ 320、`scrollWidth > clientWidth` の要素 []、ellipsis で切り詰めた要素 []、操作できる要素が 1 以上あり、scrollIntoView 後に box が 0〜320 に収まり elementFromPoint が自分（押せない一覧が []） |
| AC-18 | R6 | 状態遷移（キーボードだけ） | 移動キー（Chromium は Tab / Shift+Tab、WebKit は Alt+Tab / Alt+Shift+Tab：test-hooks.md「キーボードの移動キー」、evidence/tab-keys.log）と Enter、Space で S1 → S2 ×3 → S3 → S4 → S5 | 画面 | 同::AC18_移動キー(Tab系)とEnter_Spaceだけで診断から完了まで進み_操作した要素がfocus-visibleで枠が3px以上 | `task.done` に到達。操作した 9 要素すべてで `:focus-visible` が true、outline か box-shadow の幅が 3 px 以上（tokens の size.focus.width） |
| AC-19 | R1 | 代表（3 件、50 文字） | seed-two-done、11-03 に 50 文字を書いて完了 → 書き出し | 画面 | ac19-ac20-ac25-export-import.spec.mjs::AC19_書き出すとJSONが1つダウンロードされ_診断_段階_履歴3件（50文字のanswer）_初めて開いた日_版番号を含む | download 1 件。data.schema.json に通る。formatVersion 1、app kyounoitte、firstOpenDate 2026-11-01、diagnosis が seed と同じ、levels {backend: intermediate}、device なし、history 3 件で 001・002 の answer が ''、今日の行が {date 11-03, done, helpful, answer=50 文字} |
| AC-20 | R1 | 往復（書き出し → 別のコンテキストで読み込み） | seed-three-done-one-answer を A で書き出し → 保存なしの B に setInputFiles。同じ 11-03 | 画面 | 同::AC20_保存データのないブラウザで読み込むと_診断と段階が同じで履歴3件（answerも同じ）_状態はtask.todayかtask.done | B で `settings.export` 0 件（保存なし）→ 読み込み後 `settings.import.confirm` 0 件、`error.import.message` 0 件、状態 `task.done`（11-03 に done）。履歴 003、002、001 の順、001 の answerText が 50 文字。再書き出しの diagnosis、levels、firstOpenDate、history が A と deep equal、answer が [50 文字, '', ''] |
| AC-21 | R8 | 同値分割（偽装 3 通り） | iPhone 15 の UA + standalone false、Mac Safari UA + maxTouchPoints 5、偽装なし。11-03 | 画面 | ac21-ac22-home-screen.spec.mjs::AC21_iOS_Safariでは診断の前に案内が出て_閉じると再読み込みしても出ず_設定から再び開ける ／ AC21_iPadOS_Safari（MacのUAとmaxTouchPoints5）でも診断の前に案内が出る ／ AC21_UAを偽装しないChromiumとWebKitでは案内が0回出る | 偽装あり：`diagnosis.start` に `home.addToHomeScreen` 1 件、`.steps` 1 件、`.steps.1`〜`.4` が見え、`.steps.4` の文字が ja の値。close → 0 件、再読み込みでも 0 件。S8 に `settings.homeScreen.open` 1 件 → 押すと案内 1 件。偽装なし：0 件（再読み込み後も）、`settings.homeScreen.open` 0 件 |
| AC-22 | R8、R1 | 状態遷移（案内 → 読み込み） | standalone true、保存なし、11-04。fixtures/data/v1/valid-export-three-completed.json | 画面 | 同::AC22_スタンドアロンで初めて開くと読み込みの案内が出て_再読み込みでも出て_ファイルを読み込むとAC-20の状態になる | `home.standalone.import` が見え文字が ja の値、`home.standalone.importButton` 1、`diagnosis.start.begin` 1、`home.addToHomeScreen` 0。再読み込みで同じ。読み込み → `task.today` で ID backend-intermediate-004、履歴 3 行、書き出しの diagnosis・levels・firstOpenDate・history が見本と等しく current が {11-04, 004, ''} |
| AC-23 | R4 | オフライン（再読み込み、新しいタブ）× 2 状態 | seed-ac14。task.today（11-04）、task.done（11-03）。W-13 の合図の後に setOffline | 画面 | ac12-ac23-offline.spec.mjs::AC23_task.today…3秒以内に同じdata-task-id_送信0件 ／ AC23_task.done…3秒以内にtask.done_送信0件 | 再読み込みと新しいタブの両方で 3,000 ms 以内に同じ状態（today は同じ `data-task-id`）。時間は契約「時間の計り方」の「文書が変わる区間」のとおりテスト側で計る：`Date.now()` → `page.reload({ waitUntil: 'commit' })` / `page2.goto(url, { waitUntil: 'commit' })` → `expect.poll(data-state, { intervals: [20], timeout: 3000 })` が返った直後の `Date.now()`（ずれは 20 ms と往復 1 回まで）。同じ `data-task-id` と送信の数え方は終点の後。送信が合計 0 件 |
| AC-24 | R2 | 全数（9 値） | fixtures/seeds/seed-ac24-stats.json、2026-11-06 | 画面 | ac24-stats.spec.mjs::AC24_統計の9つの値が期待どおりで_数値7つと日付1つは同じ文字が見え_真偽値はfirstDayCompleted.yesの文言が見える | first-open-date 2026-11-01、issued 5、completed 3、first-day-completed true、days-completed-7d 3、helpful 2、rated 2、too-hard 1、no-time 1。各 `.value` の文字が属性と同じ（真偽値は ja の `settings.stats.firstDayCompleted.yes`、`.no` は 0 件） |
| AC-25 | R1 | エラー（版 +1） | seed-one-done、11-02。fixtures/data/invalid-newer-version.json | 画面 | ac19…::AC25_版番号が新しいファイルはerror.import.messageで拒み_履歴1件と診断と状態は変わらない | `error.import.message` と `error.import.reason.version` が見え、`settings.import.confirm` 0 件。書き出しで history 1 件（001 done）、diagnosis と levels が seed と同じ。アプリ名 → `task.today` で ID が前と同じ、履歴 1 行 |
| AC-26 | R9 | ペア（locale 2 通り） | en-US、ja-JP | 画面 + JSON | ac26-language.spec.mjs::AC26_en-USではdiagnosis.startの文言が英語の文言ファイルと一致し_キーの差が0件 ／ AC26_ja-JPでは…一致する | `<html lang>` が en / ja。画面にある `data-testid` のうち文言キーで差し込み（`{…}`）のないものすべての文字がその言語のファイルの値（title、lead.1〜3、begin、nav.settings、app.name の 7 個は必ず含まれること）。ja にしかないキー []、en にしかないキー []。両ファイルが strings.schema.json に通る |
| AC-27 | R6 | 監査（6 画面 + S3 の変種 1 つ） | diagnosis.start、diagnosis.question、task.today、task.done、task.exhausted、settings と、task.today.dayChanged（seed-ac14 を 11-04 23:55 に開き、11-05 0:05 に固定して読み込まずに `task.report.done` → 知らせ `task.dayChanged` のある S3。design D-30 の `role="status"` と color.warning の文字）。タグ wcag2a、wcag2aa、wcag21a、wcag21aa | 画面 | ac17…::AC27_<state>_axe-coreでserious以上の違反が0件（7 本） | impact が serious か critical の違反が []。結果の JSON を添付 |
| AC-28 | R1、R4 | 状態遷移（版の切り替え）、往復 | 旧 2026-11-30.1 → 新 2026-12-14.1（課題 backend-intermediate-900 を足す）。seed-ac14、11-04。SW の合図の後に差し替え、2 秒おき最大 3 回 | 画面 | ac28-update.spec.mjs::AC28_差し替え後2秒おきの再読み込み3回以内でdata-build-versionが新版になり_旧版に戻らず_履歴3件と診断と段階は同じ | 差し替え前 `data-build-version` と `settings.version` が旧。新版の tasks.json の件数 > 旧。3 回の記録に新版があり、新版になった後は旧に戻らず、最後が新版。書き出しの history（3 件）、diagnosis、levels が差し替え前と deep equal |
| AC-29 | R7 | 全数検査、境界（20%） | 全件の mode、組ごとの external、本文の URL、tools | JSON | ac03…::AC29_各組でexternalが20%以下_in_appにURLもtoolsもなく_externalはtoolsが1件以上 | 18 組で external ≤ n × 0.2。mode が in_app / external 以外 0。in_app の 4 要素に `http(s)://` 0、tools が []。external の tools ≥ 1。違反の一覧 [] |
| AC-30 | R7 | 同値分割（external、in_app） | external のある組の in_app を全部出し終えた seed → 翌日。in_app：ID 最小が in_app の組を診断済みにして初日 | 画面 | ac10…::AC30_in_appを出し終えた翌日はexternalの課題が出て_印と要る道具が題名と同じ画面に見える ／ AC30_in_appの課題を出した日はdata-task-modeがin_appで印が0件 | 先に課題集が本物であることを確かめる（tasks.schema.json に通る、126 件以上、18 組すべて 7 件以上。壊れた・空の課題集で「該当なし」が緑にならない守り）。`data-task-mode` external、ID がその組の external の最小 ID、`task.today.title` が課題の title、`task.external.badge` が見え文字が ja、`task.external.tools.item` の件数と文字が tools と一致。in_app：mode in_app、badge 0 件、tools 0 件。課題集に external が 0 件なら「該当なし」を annotation に残し、G3 の報告では PASS ではなく「該当なし」と書く（PRD の指示） |
| AC-31 | R3 | 代表（2 状態）、重なり 0 | seed-ac14。task.today（11-04）、task.done（11-03）。操作 0 回 | 画面 | ac31-ac32-zero-ops-answer.spec.mjs::AC31_診断済みで開くと操作0回でtask.todayが見え…重なる要素0件 ／ AC31_今日の課題を完了済みなら操作0回でtask.doneが見え_重なる要素0件 | `data-state` が task.today / task.done。today では title、why.text、how.text、goal.text、answer、report ×4 が各 1 件で見える。role=dialog 0、aria-modal 0、題名と重なる fixed/sticky（祖先を除く）[] |
| AC-32 | R5 | 状態遷移（再読み込み、新しいタブ、翌日に開く、画面を開いたまま翌日になった後の最初の操作）、境界（200 文字、1 秒） | seed-ac14、11-04 に 200 文字 → `task.answer.saved` を 1,000 ms 以内に待つ。4 本目は W-3 のとおり読み込まずに 11-05 0:05 に固定して `task.report.done` | 画面 | 同::AC32_200文字を入力して再読み込みすると… ／ AC32_…タブを閉じ新しいタブで開くと… ／ AC32_翌日に開くと新しい課題の答えの欄は空で_前日の200文字は書き出しのnoneの行のanswerに残る ／ AC32_画面を開いたまま翌日になった後に読み込まずに完了を押すと_完了は記録されず翌日の課題の答えの欄は空で_前日の200文字は書き出しのnoneの行のanswerに残る（4 本） | 同じ `data-task-id`、textarea の value が 200 文字そのまま。翌日に開く：別の ID、value ''、`task.dayChanged` 0 件（読み込みで着いた S3。identifiers.md 3）、書き出しの前日の行が {date 11-04, report none, answer 200 文字}、current が {11-05, 新 ID, ''}。開いたまま翌日の完了（PRD 11 の冒頭「日付をまたいだ申告はできない…書きかけの答えは none の行に残る（AC-32）」）：`task.rate` に進まず `task.today` で別の ID、value ''、再読み込みしても同じ ID で value ''、書き出しで前日の課題の行は none の 1 行だけ（done の行がない）で answer 200 文字、current が {11-05, 新 ID, ''} |

予算（PRD の AC ではない。契約が受け入れテストで数えるよう求めたもの。G3 の検証レポートでは AC の表とは別の「予算」の行に合否と値を書く）：
| 予算 | 根拠 | ファイル::テストの名前 | 確かめる結果 |
|---|---|---|---|
| budgets.md の 2（課題集の長さ） | contracts/budgets.md 2、test-hooks.md W-6 | ac03-ac04-ac29-tasks-json.spec.mjs::BUDGET2_課題集の本文の平均600字以下_gzip後106000バイト以下 | title、why、how、goal の字数の合計 ÷ 件数 ≤ 600。tasks.json の gzip(level 9) ≤ 106,000 バイト |

design の状態（PRD の AC の Then にない要素や振る舞い。G3 の検証レポートでは AC の表とは別の「design の状態」の行に合否を書き、AC の合否に混ぜない）：
| 状態 | 根拠 | ファイル::テストの名前 | 確かめる結果 |
|---|---|---|---|
| D-30 操作で日付をまたいで着いた S3 の知らせ | design 2 の表の下「AC にない状態」、4 の D-30、5 の S3、7 の `task.dayChanged`、identifiers.md 3、data.md 4、PRD 11 の冒頭 | design-d30-day-changed.spec.mjs::DESIGN_D30_画面を開いたまま翌日になった後に完了を押すと_翌日のS3の先頭にtask.dayChangedが1件でフォーカスがあり_入力では消えず_次の操作と再読み込みで消える | seed-ac14 を 11-04 23:55 に開く（`task.dayChanged` 0 件）→ 11-05 0:05 に固定して `task.report.done` → `task.today` で別の ID、`task.dayChanged` が 1 件、`role="status"`、文字が ja の値、`document.activeElement`、`task.today.label` より前。textarea に入力して保存されても 1 件のまま。`app.name` を押すと同じ ID の `task.today` で 0 件。再読み込みでも 0 件 |
| D-30 S4（`task.rate`）のまま日付をまたいだ評価 | PRD 11 の冒頭と data.md 4 の例「11-05 23:59 に完了し、`task.rate` のまま 0:01 に「役に立った」を押すと、評価は保存されません」 | 同::DESIGN_D30_task.rateのまま翌日になった後に役に立ったを押すと_評価は記録されずhelpfulはunansweredのままで_翌日のS3にtask.dayChangedが1件 | 11-04 23:59 に完了 → `task.rate` → 11-05 0:01 に `task.rate.helpful` → `task.today` で別の ID、知らせ 1 件（上と同じ確かめ）。履歴のその課題の行は {date 11-04, done, helpful unanswered} の 1 行だけ |
| D-30 操作で日付をまたいで着いた S7 の知らせ | design 5 の S7、identifiers.md 3（S7 は `task.exhausted.message` の上） | 同::DESIGN_D30_最後の課題を開いたまま翌日になった後に完了を押すと_task.exhaustedの先頭にtask.dayChangedが1件でフォーカスがあり_前の課題はnoneの行に移る | 本番の課題集の backend/intermediate を最後の 1 件を残して done にした seed（firstOpenDate 2026-09-01、1 日 1 行）→ 最後の課題が出る日の 23:55 に開き ID が残した課題 → 翌日 0:05 に固定して `task.report.done` → `task.exhausted`、知らせ 1 件（`task.exhausted.message` より前、activeElement）、`task.exhausted.redo` 1 件。履歴の先頭が {残した課題, その日, none}、done の行数は seed と同じ |
| U-15 初回の S2 で日付が変わった後の確定 | design 10 の U-15、data.md 4「対象の外（design の U-15）」の例、docs/approvals/delegation.md 2026-11-04 | 同::DESIGN_U15_初回の診断の2問目を23時59分に出して0時1分に確定すると_そのまま3問目に進み_firstOpenDateは1問目の日でcompletedOnと課題の日付は確定した日 | 11-03 23:59 に 1 問目（frontend）を確定、2 問目（beginner）を 11-04 0:01 に確定 → `data-question-index` 3、`task.dayChanged` 0 件 → 終えると `task.today`（frontend / beginner、知らせ 0 件）。書き出しの firstOpenDate 2026-11-03、completedOn 2026-11-04、current.date 2026-11-04、history [] |

名前の決め方（r5。指揮役の指示「AC-32 か AC-5 に結び付けられるならその AC の名前、結び付けられないなら DESIGN_ のような接頭辞」）：データの結果（完了が記録されない、答えの欄が空、前日の答えが none の行に残る）は PRD 11 の冒頭が「（AC-32）」と参照し AC-32 の Then と同じ値なので `AC32_` にした。知らせの要素 `task.dayChanged`（件数、role、フォーカス、位置、消える時機）は design が「AC にない状態」と明記し PRD のどの AC の Then にもないので、`DESIGN_D30_` にして AC の表から外した（知らせだけが落ちたときに AC-32 を FAIL にしないため。`BUDGET2_` と同じ扱い）。U-15 も同様に `DESIGN_U15_`。AC-5 には結び付けなかった（AC-5 は「完了するとその日はもう課題が出ない」で、日付をまたいだ完了が実行されないことは AC-5 の Then にない）。

テストの定義は 52 個（r5 で AC-27 の `task.today.dayChanged`、AC-32 の 4 本目、`DESIGN_` 4 本を足した。r4 で AC-14 の 2 通り目を 1 個足した。ループの展開で 1 ブラウザあたり 73 本、chromium 73 + webkit 72 = 145 本。AC-15 は chromium だけ）。AC 番号のないテストは上の `BUDGET2_` の 1 本と `DESIGN_` の 4 本で、前者は契約（W-6、budgets.md 2）がこの名前で置くよう求めたもの、後者は design r6 の「AC にない状態」。

## 3. 試す状態
iOS の行は Web に読み替える。
| 状態 | 選んだもの | 作り方 | どのテストで、または理由 |
|---|---|---|---|
| 初めて起動（初めて開く） | 自動 | 新しいブラウザコンテキスト（W-1）。保存、SW、キャッシュが空 | AC-1、AC-2、AC-11、AC-12、AC-13、AC-18、AC-21、AC-22、AC-26、AC-27（S1、S2） |
| データがある | 自動 | addInitScript で `kyounoitte:data` に seed（W-7）。contracts/fixtures/seeds と seeds/、課題集から動的に作る「出し終えた」seed | AC-5〜AC-10、AC-14〜AC-17、AC-19、AC-20、AC-23〜AC-25、AC-28、AC-30〜AC-32 |
| 前の版からの更新（版を飛ばす更新も） | 自動（配布物の版）＋範囲外（保存データの版） | 配布物：AC-28 で旧版（2026-11-30.1）を読み込んだ後に新版（2026-12-14.1）に差し替える。保存データ：formatVersion は 1 が最初の版で、前の版が存在しない | AC-28。保存データの版の移行は v1 では存在しない（data.md の 6「移す手順はまだありません」）。002 以降で formatVersion を上げるときに足す |
| オフライン、サーバーエラー | 自動（オフライン）＋範囲外（サーバーエラー） | `context.setOffline(true)`（W-12）。SW の準備は W-13 | AC-12（再読み込みなし）、AC-23（再読み込みと新しいタブ）。サーバーエラー（500、タイムアウト）は、アプリが読み込み後に通信せず、静的ホスティングの 5xx は「初回に開けない」だけで画面の状態がない（design 5 の冒頭）ため範囲外 |
| 権限を断った（その場で、あとから設定で） | 自動（その場）＋範囲外（あとから） | `StorageManager.prototype.persist = async () => false` と `persisted = async () => false` の両方（W-9、D-31。S8 の注意は `persisted()` で決まる） | AC-13（求めるのは 1 回だけ：同じ日と翌日の再読み込みで 0 回）。「あとから設定で」は Web の persist に撤回の操作がなく、ブラウザの設定で「サイトデータを消す」は保存データの消失そのもの（手当ては AC-19、AC-20） |
| バックグラウンドから復帰（タブの切り替え、タブを閉じて開き直す） | 自動 | タブを閉じて同じ URL を新しいタブで開く、再読み込み（AC-32）。`page.close()` → `context.newPage()` | AC-32（書きかけの答えが残る）、AC-23（新しいタブ）。「画面を開いたまま日付が変わった後の最初の操作」は r5 で自動にした：`setFixedTime` を呼び直して読み込まずに操作（W-3）。AC-32 の 4 本目（データの結果）、`DESIGN_D30_` 3 本（S3 / S4 / S7 の知らせ）、`DESIGN_U15_`（初回の S2）、AC-27 の `task.today.dayChanged`。探索 R3 は G3 で引き続き行う |
| 言語と地域（ja、en） | 自動 | コンテキストの `locale`（W-14） | AC-26（en-US、ja-JP）。他の AC は ja-JP |
| 大きい文字、ダークモード | 自動（幅 320）＋G4 の人（OS の文字サイズ最大、ダーク） | viewport 320 × 568、deviceScaleFactor 2（PRD AC-17：拡大 200% の代わり） | AC-17。ダークは AC がない（design D-12、tokens の 3 通りの値）ので G4 で Takuma が実機で見る。`prefers-color-scheme: dark` のスクリーンショットは G3 の証拠として撮る（7 章） |
| 容量不足、割り込み | 自動（容量不足の注入）＋範囲外（割り込み） | setItem の QuotaExceededError（W-9） | AC-11。電話などの割り込みは Web にはなく、タブの切り替えで代える（上の復帰の行） |

## 4. テストのつなぎ口と接続先
すべて Playwright の側から差し込む。アプリの側は読み取り専用の印とスキーマだけ（test-hooks.md の大原則）。
| 何 | 名前 | contracts/ の場所 |
|---|---|---|
| 状態の初期化 | 新しいブラウザコンテキスト | test-hooks.md W-1 |
| 画面の状態と識別子 | `<html data-state>`、`data-build-version`、`data-debug-load-ms`、`data-testid`（146 キー + 30 個。r6 で `task.dayChanged` が増えた。AC-26 はキーの数を strings.schema.json の required と文言ファイルの差で見るので固定の数は持たない） | identifiers.md 1〜3、W-2、W-10 |
| 時刻 | `page.clock.setFixedTime`、`timezoneId: 'Asia/Tokyo'`。AC-15 では使わない。画面を開いたまま日付を進めるときは `setFixedTime` を呼び直して読み込まずに操作する（アプリは操作のたびに `new Date()` を読む） | W-3 |
| 課題集 | `/engineer/data/tasks.json`。差し替えは使わない（AC-10、AC-30 は seed） | W-4、W-6 |
| 課題の素性 | `task.today` の `data-task-id`、`-area`、`-level`、`-mode` | identifiers.md 4、5、W-5 |
| スキーマ | tasks.schema.json、data.schema.json、strings.schema.json を ajv 2020 strict で | W-6、W-7、W-9、dependencies.md |
| seed | `localStorage['kyounoitte:data']` に addInitScript。印 `test:seeded` で 1 回だけ | W-7、data.md 1 |
| 履歴の読み出し | `history.row` の `data-task-id`、`-date`、`-report`（done / too_hard / too_easy / no_time / none）、`-helpful` | W-8、identifiers.md 4 |
| 保存の失敗 | `Storage.prototype.setItem` を包み次の 1 回だけ QuotaExceededError（印を立ててから） | W-9、data.md 2 |
| 永続化の拒否 | `StorageManager.prototype.persist = async () => false` と `StorageManager.prototype.persisted = async () => false` の両方。`persist()` の回数はテスト側の変数で数える。印 `device.persistRequested` は localStorage の `kyounoitte:data` を読む（W-9「確かめるのは、上の回数、保存データの印、S8 の表示」） | W-9、data.md 1、2、11 |
| 書き出し | `page.waitForEvent('download')`、formatVersion 1、device を含まない | W-9、data.md 7 |
| 読み込み | 隠した input `settings.import.file`、`home.standalone.importFile` に setInputFiles | W-9、identifiers.md 3 |
| 日付が変わった知らせ | `task.dayChanged`（`<p role="status" tabindex="-1">`。S3 / S7。操作で日付をまたいだときだけ 1 件、描いた直後に activeElement、`<main>` の他の `data-testid` より前。次の操作か再読み込みで 0 件） | identifiers.md 3、data.md 4、design D-30 |
| 回線と CPU の制限 | CDP `Network.emulateNetworkConditions`（150 ms、200,000 B/s、93,750 B/s）、`Emulation.setCPUThrottlingRate` 4 | W-11 |
| 送信の数え方 | `response.fromServiceWorker()` が false の応答 + `requestfailed` | W-12、PRD 11 の冒頭 |
| SW の準備 | `navigator.serviceWorker.ready` と `controller` | W-13、service-worker.md |
| 言語 | `locale` ja-JP / en-US、`/engineer/i18n/ja.json`、`en.json` | W-14、strings.md |
| 統計の値 | `data-stat-*` 9 個 | W-15、identifiers.md 4、data.md 9 |
| スタンドアロンと iOS Safari | `Navigator.prototype.standalone`、devices の UA、`maxTouchPoints` | W-16 |
| 重なる要素の数え方 | role=dialog、`[aria-modal="true"]`、題名の矩形と重なる fixed / sticky | test-hooks.md「AC-31 の重なる要素の数え方」 |
| 配布物のビルドと差し替え | `node backend/scripts/build.mjs --out <mkdtemp の一時フォルダ> --version 2026-11-30.1 [--tasks]`（backend/dist は使わない。終わったら消す）、静的サーバーの `setRoot` | test-hooks.md「AC-28 の配布物の差し替え」「ビルドの手順の約束」 |
| キーボードの移動キー | WebKit は `Alt+Tab` / `Alt+Shift+Tab`、それ以外は `Tab` / `Shift+Tab`（helpers/app.mjs の navKeys）。確定は Enter、Space | test-hooks.md「キーボードの移動キー（AC-18）」 |
| 静的サーバー | `/engineer/`、gzip、`Cache-Control: max-age=600`、Content-Type（`.js` は `text/javascript`）、301、404 | test-hooks.md「実行の環境（W-11）」、budgets.md 6 |

contracts/ にないつなぎ口はない。r1 で「未解決」に書いた食い違い（AC-14 の seed、依存の置き場所と実行のコマンド、AC-31 の祖先の除外、AC-1 の 3 回目）は、tech-lead が契約（test-hooks.md W-7、実行の環境、AC-31 の数え方、キーボードの移動キー）と ADR 0004 を直し（f339a95）、テストはそれに合わせた。残る問いは PRD の側（AC-14 の Given の書き方、AC-1 の「3 回」の明記）で pdm に向けたもの。

## 5. 動かすコマンドと設定
受け入れテストのフォルダの中の設定だけで動く（playwright.config.mjs、package.json、global-setup.mjs、server/）。
- iOS：なし（iOS のアプリは作らない。CLAUDE.md）
- バックエンド（この機能の受け入れテスト）：
  ```sh
  cd backend/tests/acceptance && npm ci && npx playwright install chromium webkit && npx playwright test
  ```
  依存はこのフォルダの package.json にある（ADR 0004 の B、contracts/dependencies.md）。`cd backend && npx playwright test -c tests/acceptance` の形は使わない（契約「実行の環境」）。
- ビルド済みの配布物を検証するとき：`KYOUNOITTE_DIST=<フォルダ> npx playwright test`。
- 判定の実行では再試行を付けない（`retries: 0`。`--retries` を渡さない）。
- 揺れの確認：同じコマンドを 5 回。影響「大」の AC（R1〜R5：AC-1、2、5〜16、19、20、22〜25、28、31、32）と、一度でも落ちたテストが対象。
- 証拠：スクリーンショットと axe の JSON は test-results/（.gitignore 済み）に出し、G3 で docs/verification/001-daily-learning/evidence/ に写す。AC-1、AC-2、AC-12、AC-23 の計った時間（ms）はテストの annotation に残る（`--reporter=list,json` の JSON で読める）。G3 では AC ごとの値を verification.md に写す。
- 時間の計測が合っていることの確かめ（実装の前。契約「時間の計り方」）：遅れを設定できる stub（リポジトリに入れない）を `KYOUNOITTE_DIST` に指し、`npx playwright test -g 'AC1_|AC2_|AC12_|AC23_' --reporter=list,json` を遅れ 0 / 300 / 900 ms で両ブラウザ。結果は evidence/timing.log（8 章）。

## 6. 探索のチャーター
影響「大」のリスクごとに 1 本。G3 で行い、結果は verification.md の 8 章に書く。
| リスク | チャーター | 区切り |
|---|---|---|
| R1 | 読み込みの確認ダイアログ（`settings.import.confirm`）を、同じ日・違う日・`current` のあるファイル・空の history・`device` を含むファイル・5,000,000 バイト超・JSON でないファイルで探り、置き換えの前後で履歴が結合されず、拒否のときにデータが 1 文字も変わらないか、`firstOpenDate` がファイルの値になるかを見つける | 40 操作 |
| R2 | 段階の規則を、領域をまたぐ申告（backend で 2 回、git で 1 回）、やり直しで段階を変えた直後、`none` が 2 行続く、`too_easy` → `too_hard` の交互で探り、`levels` が領域ごとに独立して動くか、`task.skipped.levelHint` が too_hard / too_easy のときだけ出るかを見つける | 40 操作 |
| R3 | 画面を開いたまま日付が変わる（23:55 に出した課題を 0:05 に「完了」、答えを書いている途中、`task.rate` のまま、`settings` のまま、やり直しの S2 の途中）を `setFixedTime` の差し替えで探り、前日の課題が `none` の行に移って答えが残り、翌日の課題が出て、`task.rate` に進まないかを見つける | 30 分 |
| R4 | SW を、差し替え後 0.5 秒おきの再読み込み、`?v=1` 付きの URL、`/engineer/index.html`、新しいタブ、manifest と icon-180.png のオフライン応答（budgets.md 6）、install の途中でオフライン、で探り、古い版に戻る・白い画面・`net::ERR_FAILED` が出ないかを見つける | 40 操作 |
| R5 | 保存の失敗を、答えの自動保存、申告、「役に立ったか」、読み込みの置き換え、削除の直後、の各 setItem で注入し、`error.storage.message` が問題の近くに出て入力が保たれ、retry で同じ中身が 1 回で保存されるか、起動時の保存の失敗で課題が画面に残るかを見つける | 40 操作 |

## 7. 画面で確かめるもの
自動テストが撮るもの（test-results/ → G3 で evidence/ に写す）と、G3 で追加で撮るもの。通常の状態はライト、ダーク、幅 320（AX5 の読み替え）、英語の 4 通り（名前は `<画面>_<状態>_<light|dark|w320|en>.png`）。
| AC | 手順 | 撮るスクリーンショットのファイル名 |
|---|---|---|
| AC-1 | S1 と S2 の 3 問 | AC1_diagnosis.start.png、AC1_diagnosis.question_1〜3.png |
| AC-2、AC-3 | 診断直後の S3（3 通り） | AC2_task.today_<area>_<level>.png |
| AC-5、AC-7 | S4、S5、S6（3 種） | AC5_task.rate.png、AC5_task.done.png、AC7_task.skipped_<report>.png |
| AC-8 | 翌日の S3（10 本） | AC8_<通り>_task.today_2026-11-04.png |
| AC-10 | S7 | AC10_task.exhausted.png |
| AC-11 | S2 のエラー | AC11_diagnosis.question_error.storage.png |
| AC-13 | S8（notPersisted） | AC13_settings_notPersisted.png |
| AC-16 | 削除の確認 | AC16_settings.delete.confirm.png |
| AC-17 | 幅 320 の 4 状態 | AC17_<state>_320.png |
| AC-21、AC-22 | S1 の案内（iOS Safari、スタンドアロン）、S8 の案内 | AC21_diagnosis.start_addToHomeScreen.png、AC21_settings_addToHomeScreen.png、AC22_diagnosis.start_standalone.png |
| AC-24 | S9（判定日に利用者が送る画面と同じ） | AC24_settings.stats.png |
| AC-25 | S8 の読み込みエラー | AC25_settings_error.import.png |
| AC-26 | S1 の ja と en | AC26_diagnosis.start_ja.png、AC26_diagnosis.start_en.png |
| AC-28 | 新版の S8 | AC28_settings_new_version.png |
| AC-30 | S3 の external と in_app | AC30_task.today_external.png、AC30_task.today_in_app.png |
| AC-31 | 操作 0 回の S3、S5 | AC31_task.today_zero_ops.png、AC31_task.done_zero_ops.png |
| AC-32 | 再読み込み後の S3、開いたまま翌日になった後の完了で着いた S3 | AC32_task.today_after_reload.png、AC32_task.today_after_day_changed_by_operation.png |
| （design D-30） | 知らせのある S3 と S7 | DESIGN_D30_task.today_dayChanged.png、DESIGN_D30_task.exhausted_dayChanged.png（tools/screenshots.mjs では S3_task.today_dayChanged の 4 通りと S7_task.exhausted_dayChanged） |
| （G3 で追加） | 全画面 S0〜S10 とダイアログのダーク（`colorScheme: 'dark'`）、英語、幅 320。S0 error の 2 変種、S10 の空と行あり、S8 の保存データなし | <画面>_<状態>_<dark|en|w320>.png |

## 8. 赤の証拠（実装の前に落ちたこと）
### r5（design r6 と契約の更新に合わせた直しと追加。実装はまだ追従していない）
- ログ：docs/verification/001-daily-learning/evidence/r6-red.log（コミット b9b37e1 の作業ツリー。受け入れテストの変更は未コミット。日時はログの冒頭）
- 実行したコマンドと終了コード：`cd backend/tests/acceptance && npx playwright test --retries=0 --reporter=list` → 終了コード 1、145 本中 129 passed、16 failed、飛ばし 0（chromium 8 + webkit 8。同じ 8 本が両ブラウザで同じ理由で落ちた）
- 落ちた 8 本と理由（どれも r6 の新しい振る舞いにまだ実装が追従していないことで、テストの書き間違いではない。既存のテスト（r4 までの 133 本のうち、直した AC-13 と AC-26 以外）はすべて通っている）：
  | テスト | 落ちた所 | 理由 |
  |---|---|---|
  | AC13_persistを断られても… | `device.persistGranted は書かれない`（received false） | 今の実装は `persist()` の結果を `device.persistGranted` に保存する（2026-11-03 までの契約）。r6 の契約（data.md 11、指揮役の決定「persistGranted を保存しない」）では書かない。`persist()` 1 回と `persistRequested: true` はもう通っている |
  | AC26_en-US…、AC26_ja-JP… | `i18n/ja.json が strings.schema.json に通る：data must have required property 'task.dayChanged'` | 文言ファイルに r6 の 146 キー目 `task.dayChanged` がまだない（AC-26 は固定の数でなくスキーマの required との差で見るので、145 → 146 に自動で追いついた） |
  | AC27_task.today.dayChanged_… | 画面を作る手順の `task.dayChanged` が 1 件（received 0） | 知らせの要素がまだない |
  | DESIGN_D30_画面を開いたまま翌日になった後に完了を押すと… | `expect(ja).toHaveProperty(['task.dayChanged'])` | 同上（文言キーがまだない。知らせの要素も 0 件） |
  | DESIGN_D30_task.rateのまま…、DESIGN_D30_最後の課題を… | `task.dayChanged` が 1 件（received 0） | 知らせの要素がまだない。データの結果（評価が unanswered のまま、none の行、`task.exhausted`）はその前の expect を通っている |
  | DESIGN_U15_初回の診断の2問目を… | `data-question-index` が 3（received 2） | 今の実装は初回の S2 でも日付が変わった後の確定を捨てる（探索 R3 の 6 で見た振る舞い）。r6 の契約（data.md 4「対象の外」、U-15 の決定）ではそのまま実行する |
- 通った新しいテスト：AC32_画面を開いたまま翌日になった後に読み込まずに完了を押すと…（両ブラウザ）。データの結果（完了が記録されない、none の行に 200 文字、翌日の答えの欄が空）は今の実装でもう満たしている（指揮役の決定 2026-11-03 の「前日の答えが翌日の current.answer に一瞬入る件」も、再読み込みの前後とも value '' で通った）。
- 既存のテストを弱めていない：`git diff -- backend/tests/acceptance` で消した行に `expect` は 0 件（消したのはコメント 5 行、import と for の行の置き換え、annotation の 1 行）。

### r4 まで
- ログ：docs/verification/001-daily-learning/evidence/red.log（r4 で取り直し。コミット 6f6ff8e の作業ツリー（AC-14 の 2 通り目を足した未コミットの状態）。日時はログの冒頭）
- 実行したコマンドと終了コード：`cd backend/tests/acceptance && npm ci && npx playwright install chromium webkit && npx playwright test --reporter=list` → 終了コード 1、133 本すべて失敗（chromium 67、webkit 66）、成功 0、飛ばし 0。r3 の 131 本に AC-14 の 2 通り目（両ブラウザで 2 本）が増えたもので、落ちた理由は r3 と同じ
- 落ちた理由（1 行）：配布物を作る `backend/scripts/build.mjs` がまだなく（実装前）、global-setup がその理由を各テストに渡して全テストが「配布物を作れない：backend/scripts/build.mjs が見つからない（実装がまだない）」で落ちた。
- テストの書き間違いではないことの証拠（stub の配布物での実行。tech-lead G2 r1 の要修正）：スクラッチパッドに最小の配布物（`data-state="diagnosis.start"` の HTML と testid 7 個、空の課題集 `{"tasks":[]}`、必須キーの足りない文言ファイル。JS も SW もない。リポジトリに入れない）を作り、`KYOUNOITTE_DIST` に指して両ブラウザで動かした。
  - evidence/stub-chromium.log：65 failed / 1 passed（66 本）、終了コード 1
  - evidence/stub-webkit.log：64 failed / 1 passed（65 本）、終了コード 1
  - 落ちた理由ごとの件数（chromium / webkit。各ログの冒頭の表に 1 本ずつ）：
    | 理由 | chromium | webkit |
    |---|---|---|
    | A 状態が変わらない（`data-state` が `diagnosis.start` のまま。アプリの JS がない） | 46 | 45 |
    | B SW がない（`waitServiceWorkerReady` が返らない。AC-12 の 2 本） | 2 | 2 |
    | C 課題集が空（tasks.json の tasks が 0 件。AC-3、4、10、14、29、30 ×2、BUDGET2、AC-17 / 27 の exhausted） | 10 | 10 |
    | D 文言ファイルに必須キーがない（AC-26 ×2） | 2 | 2 |
    | E build.mjs がない（AC-28 の旧版と新版のビルド） | 1 | 1 |
    | F 要素がない（AC-21 の案内 ×2、AC-22） | 3 | 3 |
    | G stub 自体の axe の違反（AC-27 diagnosis.start。axe が動いたことの確認） | 1 | 1 |
  - 通った 1 本（両ブラウザとも `AC17_diagnosis.start`）：stub の S1 が幅 320 で横スクロールも切り詰めもなく 3 つの操作要素が押せるので、Then を本当に満たして通った（空振りではない）。
  - AC-30 の external：r1 では空の課題集で「該当なし」として通っていたが、守り（tasks.schema.json、126 件以上、18 組 7 件以上）を足した r2 では落ちる（理由 C）。
  - AC-18（webkit）：tabTo が `Alt+Tab` で `diagnosis.start.begin` に届き、Enter の後に状態が変わらないこと（理由 A）で落ちる。r1 の「Tab を 40 回押しても届かない」ではない。
- 時間の計測の確認（r3。契約「時間の計り方」）：evidence/timing.log。遅れを 0 / 300 / 900 ms に設定できる stub（S1 → S2 → task.today → task.done / task.skipped → history、seed の読み書き、SW、126 件の課題集。begin、next、finish と起動の描画を setTimeout で遅らせる）で AC-1、AC-2、AC-12、AC-23 の 8 本 × 2 ブラウザを動かした。
  - ページの中の区間（AC-1、AC-2、AC-12 (a)）：計った値が、遅れ 0 で chromium 12〜16 / webkit 0〜2、遅れ 300 で 301〜302 / 301〜302、遅れ 900 で 901〜903 / 900〜902。r2 の expect の待ち（遅れ 300 で 814〜825）のずれは消えた。
  - テスト側の区間（AC-23）：遅れ 0 で 13〜76、300 で 321〜337、900 で 920〜940（契約の見込み +7〜+30 ms より新しいタブが少し大きい。46〜76 は新しいタブの最初の往復を含む）。
  - 結果：遅れ 0 と 300 は 16 本すべて通る（終了コード 0）。遅れ 900 は AC-1 と AC-12 (a) が両ブラウザで「始める → 1 問目 Expected <= 500 Received 900〜902」で落ち、AC-2（上限 1,000）と AC-23（上限 3,000）は通る（12 passed / 4 failed、終了コード 1）。上限を超えたものだけが落ちる。
  - 付け足し：SW のない stub で `waitServiceWorkerReady` が 10,000 ms で「SW が登録されない：navigator.serviceWorker.ready と controller が 10000 ms で満たされない（W-13）」と落ちる（以前はテストの timeout 60 s まで止まっていた）。
- キーボードの移動キーの確認：evidence/tab-keys.log（stub にリンク、radio、ボタン、textarea を置き、`Tab` と `Alt+Tab` を 6 回。WebKit の `Tab` は textarea と BODY だけ、`Alt+Tab` はすべてに届く。Chromium はどちらでもすべてに届く）。

## 9. 範囲の外
- 実機の Safari（iOS 17 以上）、ホーム画面への追加の実際の動作、7 日消去、LINE などのアプリ内ブラウザ：G4 で Takuma が実機で確かめる（ADR 0004、PRD 12）。
- ダークモード、OS の文字サイズ最大、VoiceOver / TalkBack：AC がない。G3 でスクリーンショットを撮り、G4 の人が見る。
- 初回の転送量 150 KB 以下と CSP の meta が 1 つ：PRD 12 の非機能要件で AC ではない。G3 で `node scripts/check-budget.mjs dist` と `grep -c` の出力を証拠に書く（backend-engineer の単体テストが主）。
- manifest.webmanifest と icon-180.png の内容：どの AC の Then にもない（budgets.md 6）。G3 の探索（R4）でオフラインの応答と Content-Type を見る。単体テストは backend-engineer。
- 保存データの版の移行（formatVersion 2 以降）：v1 には存在しない。
- サーバーエラー（5xx）：静的ホスティングで、アプリの画面の状態がない。
- 課題集の中身の質（文章として役に立つか）：Takuma の全件確認（Q2）と 13 の「役に立った」率で見る。

## 10. 判定への対応で直した所
### r5（design r6 と契約の更新（3b7068a、3689e3d）への対応。指揮役の委任指示書 2026-11-04）
| 指摘（判定、重大度） | どこをどう直したか | 根拠 |
|---|---|---|
| AC-13 の注入が `persist()` だけで、S8 の注意は `persisted()` で決まるようになった（design-reviewer G3 r1 の提案 8 → design D-31、契約 W-9） | helpers/seed.mjs の `injectPersistDenied` に `StorageManager.prototype.persisted = async () => false` を足した。tools/screenshots.mjs の S8_settings_notPersisted は同じ helper を使うので追従 | test-hooks.md W-9「`persist = async () => false` と `persisted = async () => false` の両方」、design 2 の AC-13 の行、D-31 |
| AC-13 で `persist()` を呼ぶ回数と保存データの印を確かめる（tech-lead の直し 2） | ac11-ac13-storage.spec.mjs の AC13：診断を終えた読み込みで 1 回（既存）、保存データの `device.persistRequested` が true で `persistGranted` がない（helpers/seed.mjs に `readStoredData` を足した）、同じ日の再読み込み後の文書で 0 回、翌日の再読み込み（`task.today` → S8）後も 0 回で印が true のまま。Then の既存の expect は変えていない | PRD 11 の冒頭「診断を終えて `task.today` を初めて表示した後に1回だけ求める」、PRD AC-13 Then、test-hooks.md W-9（初回の診断を終えた読み込みでちょうど 1 回、その後は 0 回、`device.persistRequested: true`、`persistGranted` は書かれない）、data.md 2 の表と 11、docs/approvals/delegation.md 2026-11-04（U-14、persistGranted） |
| 145 を数える箇所（tech-lead の直し 3） | 受け入れテストのコードにはない（`grep -rn '145' helpers tests tools` が 0 件）。AC-26 は strings.schema.json の required と文言ファイルの差で見るので、r6-red.log で `task.dayChanged` の欠けとして落ちた。test-plan の 4 章の「145 キー」を 146 に直した | identifiers.md 3「文言キーは 146 個」、strings.schema.json の required（146） |
| 画面を開いたまま翌日になる場合のテストがない（design r6 の D-30、指揮役の決定 2026-11-03。探索 R3 で手で確かめていた） | ac31-ac32-zero-ops-answer.spec.mjs に AC32 の 4 本目（データの結果）を足し、既存の「AC32_翌日に開くと…」に `task.dayChanged` 0 件を足した。tests/design-d30-day-changed.spec.mjs を新しく作り、`DESIGN_D30_` 3 本（S3 の知らせと消える時機、S4 のまま評価、S7 の知らせ）と `DESIGN_U15_` 1 本。ac17-ac18-ac27-a11y.spec.mjs の AC27 に `task.today.dayChanged` を足した（7 本目）。tools/screenshots.mjs に S3_task.today_dayChanged（4 通り）と S7_task.exhausted_dayChanged を足した。名前の決め方は 2 章の design の表の下 | PRD 11 の冒頭「日付をまたいだ申告はできない」（AC-32 を参照）と AC-32 の Then、design 2 の表の下「AC にない状態」（verifier への手順の指定）、4 の D-30、5 の S3 / S7、7 の `task.dayChanged`、10 の U-15、identifiers.md 3、data.md 4（例の 2 つと「対象の外」）、test-hooks.md W-3「画面を開いたまま日付を進めるとき」 |
| 本数が変わったので証拠を取り直す | evidence/r6-red.log（145 本：129 passed、16 failed。8 章の r5） | craft-verifier 2 章「赤の証拠」 |

取り込まなかったもの（理由）：
- AC-17（幅 320）に `task.today.dayChanged` を足すこと：指揮役の指示にも design 2 の表にもない。知らせの英語の長さは design 9 の「英語が長くなったとき」の対象なので、G3 の tools/screenshots.mjs（S3_task.today_dayChanged の en と w320 ではなく normal の 4 通り）で見る。
- `task.dayChanged` の色（color.warning）とスクロール位置：見た目は design-reviewer の G3 の対象で、受け入れテストでは role、文字、フォーカス、位置（文書順）だけを見る。

### r4（PRD r7 の承認（Q11 は A）への対応：AC-14 の 2 通り目）
| 指摘（判定、重大度） | どこをどう直したか | 根拠 |
|---|---|---|
| AC-14 に 2 通り目（今日の課題がすでに出ている日にやり直しても、その日は新しい課題が出ず、翌日から新しい診断が効く）が足された（PRD r7、Q11 = A。tech-lead G2 r1 の未解決 (2) の問い） | ac14-ac16-redo-delete.spec.mjs に `AC14_今日の課題が出ている日に設定からやり直して別の領域を選んでも_その日は同じdata-task-idのtask.todayのままで完了の履歴は3件_翌日は新しい領域の課題が出る` を 1 本足した（2 章の AC-14 の行）。seed は契約の見本 seed-ac14-three-completed.json をそのまま使い、2026-11-04 に固定して開き、frontend/beginner でやり直し、2026-11-05 に固定して再読み込みする。1 通り目のテスト、ヘルパー、ほかのテストは変えていない | PRD r7 の AC-14 の Then の 2 通り目と確かめ方の 2 通り目、11 の冒頭「診断のやり直し」、18 の Q11。contracts/test-hooks.md W-7 の AC-14 の 2 通り目の行、contracts/data.md 2「終えた後の行き先」と 4 の 6-1〜6-4 |
| 本数が変わったので証拠を取り直す | red.log を 6f6ff8e の作業ツリーで取り直し（133 failed、理由は r3 と同じ）。8 章 | craft-verifier 2 章「赤の証拠」 |

### r3（G2 の判定 tech-lead r2 への対応）
テストを直すのは、PRD の行か契約の節で根拠を示せるときだけ。1 行に 1 指摘。
| 指摘（判定、重大度） | どこをどう直したか | 根拠 |
|---|---|---|
| 時間の終わりを expect の待ちで取るので、計った値が確かめる間隔の分（最大約 500 ms）長くなる（tech-lead、要修正） | helpers/app.mjs に `armTiming`（計る文書に 1 回だけ：window の capture 段の click で `performance.now()` と testid を記録、MutationObserver（document、subtree、childList、attributes：`data-state`、`data-question-index`）でその時点の DOM を読み、変わったら `performance.now()` と記録。`globalThis.__acceptanceTiming`）と `readInterval`（始点＝その testid の最後の click、終点＝始点より後で条件を満たす最初の記録。ms に切り上げ。記録がなければ例外）を足し、`diagnose` の beginMs、transitions、finishMs をこれで計る。ac01-ac02-diagnosis.spec.mjs の AC1 の 4 区間も同じ。差を取った後で expect で状態を確かめる。AC-12 (a) は `diagnose` 経由で同じ計り方 | contracts/test-hooks.md「時間の計り方」の「文書が変わらない区間」1〜7。PRD AC-1「500 ms」、AC-2「1 秒以内」、PRD 12。Then は変えていない |
| 同上（AC-23 の再読み込みと新しいタブ） | ac12-ac23-offline.spec.mjs の `offlineReloadAndNewTab`：始点は `page.reload({ waitUntil: 'commit' })` / `page2.goto(baseURL, { waitUntil: 'commit' })` の直前の `Date.now()`、終点は `expect.poll(() => data-state（evaluate の失敗は null）, { intervals: [20], timeout: 3000 }).toBe(state)` が返った直後の `Date.now()`。同じ `data-task-id` と送信の数え方は終点の後 | contracts/test-hooks.md「時間の計り方」の「文書が変わる区間」1〜5。PRD AC-23「3 秒以内」 |
| `ja['diagnosis.progress']` がないと `fill(undefined)` の TypeError になり、赤の理由がテストの誤りに見える（tech-lead、提案） | ac01 の AC1 の冒頭で `expect(ja).toHaveProperty(['diagnosis.progress'])`（配列：キーの「.」を経路に読ませない） | strings.schema.json の必須キー、W-14。Then は変えていない |
| `waitServiceWorkerReady` が SW のないときテストの 60 s の timeout まで止まる（tech-lead、提案） | ページの中で `ready` → `controller` の約束を WAIT_MS（10,000 ms）の上限と `Promise.race` し、「SW が登録されない：…（W-13）」で落とす。上限は待つためではなく止まらないための timer（setTimeout の 2 件目。確かめの項目に書いた） | test-hooks.md W-13。確かめ：timing.log の付け足し |
| `engineOf` が `browser()` の null を黙って chromium にする（tech-lead、提案） | null なら「ブラウザの種類が分からない」の例外にした | test-hooks.md「キーボードの移動キー（AC-18）」（判定はブラウザの種類で行う） |
| helpers/fixtures.mjs:2 のコメントが「backend/dist/」のまま（tech-lead、提案） | mkdtemp の一時フォルダ（`KYOUNOITTE_DIST`）に直した | コメントだけ。ADR 0004 |
| 計測の仕方を変えたので証拠を取り直す | red.log を 009322d の作業ツリーで取り直し（131 failed、理由は同じ）。evidence/timing.log を足した（8 章） | craft-verifier 2 章「赤の証拠」 |

取り込まなかったもの（理由）：
- 契約の Linux WebKit の「未確認」への裏付け（tech-lead 提案 5）：tech-lead が契約の方に書いた（test-hooks.md「キーボードの移動キー」）。テストの変更はない。
- 設計メモ 6 の「申告から次の状態まで」（AC-5、AC-7）の記録（契約の 8「計ってよい」）：PRD の AC-5、AC-7 に秒数の Then がないので計らない。足すなら G3 の探索で。

### r2（G2 の判定 tech-lead r1 / reviewer r1 への対応）
テストを直すのは、PRD の行か契約の節で根拠を示せるときだけ（役割ファイル「やらないこと」）。1 行に 1 指摘。
| 指摘（判定、重大度） | どこをどう直したか | 根拠 |
|---|---|---|
| AC-18 の Tab が WebKit で止まらない（tech-lead、重大） | helpers/app.mjs の `tabTo` を `navKeys(page)` 経由にし、WebKit は `Alt+Tab` / `Alt+Shift+Tab`、それ以外は `Tab` / `Shift+Tab`。`pressPrev` を足し、ac17-ac18-ac27-a11y.spec.mjs の直書きの `Shift+Tab` を置き換え、テスト名を `AC18_移動キー(Tab系)とEnter_Space…` に。確かめ：evidence/tab-keys.log（両ブラウザで `Tab` と `Alt+Tab` を 6 回） | test-hooks.md「キーボードの移動キー（AC-18）」。PRD AC-18 の Then は変えていない |
| AC-12 で SW の登録とオフラインが競る（tech-lead、要修正） | ac12-ac23-offline.spec.mjs の AC-12 の 2 本で、`setOffline(true)` の前に `waitServiceWorkerReady` | test-hooks.md W-13（AC-12 を対象に追加）。PRD AC-12 Given「ページを読み込み終えた後に」 |
| AC-30 の「該当なし」が空の課題集でも緑（tech-lead、要修正） | ac10-ac30-exhausted-external.spec.mjs：抜ける前に tasks.schema.json に通ること、126 件以上、18 組すべて 7 件以上を確かめる | PRD AC-30 Given「本番の課題集に external が 0 件なら」（本番の課題集＝AC-4 の量を満たすもの）、W-6 |
| stub の実行の出力がない（tech-lead、要修正） | evidence/stub-chromium.log、stub-webkit.log を足し、理由ごとの件数を 8 章に書いた。red.log の冒頭の文もこれに合わせた | craft-verifier 2 章「赤の証拠」 |
| AC-1 の「始める→1問目」を計っていない（tech-lead、要修正。reviewer 提案 3） | ac01-ac02-diagnosis.spec.mjs の AC1：`diagnosis.start.begin` の click から `data-question-index=1` までを 500 ms 以下で計り、4 区間（始める→1、1→2、2→3、3→課題）を annotation に残す。3→課題は 1,000 ms のまま | PRD 12「各質問の切り替えは 500 ミリ秒以内（AC-1 で 3 回計る）」「AC-1 の切り替え 500 ミリ秒 × 3 と AC-2 の 1 秒」 |
| AC-2 の計測が click の往復だけ（reviewer、要修正） | helpers/app.mjs の `diagnose` が `finishTo`（と `finishTimeout`）を待った後に `finishMs` を確定する。AC2 の 3 本と AC-12 (a) は `finishTo: 'task.today'` で呼び、返った `finishMs` に `≤ 1000` を掛ける。`beginMs` も返し、AC-12 (a) で `≤ 500` | PRD AC-2 Then「1秒以内に状態 `task.today` が表示され」。Then は変えていない |
| 予算のテストが `AC4_` の名前（tech-lead 提案、reviewer 提案 4） | `BUDGET2_課題集の本文の平均600字以下_gzip後106000バイト以下` に改名。2 章の AC-4 の行から外し、「予算」の表に移した | test-hooks.md W-6、budgets.md 2 |
| AC-14 の seed（tech-lead 提案、reviewer 提案 2） | ac14-ac16-redo-delete.spec.mjs：本番の課題集から作る「出し終えた」履歴のまま、done を最後の 3 行（今日の -3、-2、-1 日）にし、日付を確かめる。`exhaustedSeed` の `reportFor` に `total` を渡す。fixtures の seed-ac14-three-completed.json は AC-14 では使わない（AC-5 などの見本としては使う） | test-hooks.md W-7 の AC-14 の行、PRD AC-14 Given「過去 3 日に完了した課題が 3 件」 |
| 古いコマンドのコメント（tech-lead） | playwright.config.mjs の冒頭と README を契約の形（`cd backend/tests/acceptance && npm ci && npx playwright install chromium webkit && npx playwright test`）に。5 章も同じ | test-hooks.md「実行の環境」、ADR 0004 の B |
| AC-26 の比べるキーが 7 個固定（tech-lead 提案） | ac26-language.spec.mjs：描画されている `data-testid` のうち、文言キーで差し込み（`{…}`）のないものすべてをその言語のファイルと比べる。7 個が必ず含まれることも確かめる | PRD AC-26 Then「状態 `diagnosis.start` の文言が英語の文言ファイルのものと一致し」、identifiers.md 3、strings.md 1 |
| AC-13 で persist の回数（tech-lead 提案） | helpers/seed.mjs の `injectPersistDenied` が呼ばれた回数をテスト側の変数に数え、ac11-ac13-storage.spec.mjs で `task.today` の後に 1 回であることを `expect.poll` で確かめる | test-hooks.md W-9「`task.today` を初めて描いた後に 1 回だけ呼ぶ」 |
| global-setup が backend/dist を上書き（tech-lead 提案） | global-setup.mjs：`mkdtemp` の一時フォルダにビルドし、teardown（返す関数）で消す。paths.mjs の `DIST_DIR` を外した。README も | craft-verifier（受け入れテストのフォルダの外を書き換えない）。ADR 0004 |
| AC-28 の一時フォルダを消していない（tech-lead 提案） | ac28-update.spec.mjs：本体を `run()` に移し、`finally` で `rmSync` | 同上 |
| `.js` の Content-Type（tech-lead 提案） | server/static-server.mjs：`.js` と `.mjs` を `text/javascript`（charset なし） | test-hooks.md「実行の環境」の表 |
| AC-20 が実装と関係なく ENOENT で落ちる（backend-engineer の報告。G3 の前に verifier が再現：evidence/ac20-enoent-before-fix.log） | helpers/app.mjs の `exportJson`：`download.path()` のファイルはコンテキストを閉じると Playwright 1.64.1 が消すので、`download.saveAs` でそのテストの出力フォルダ（test-results/<テスト>/exports/）に byte 単位で複製し、その複製を `file` として返す。読み込ませるファイルは書き出したものの複製で、中身は書き直さない。spec と期待する値は変えていない。確かめ：evidence/ac20-after-fix.log（6 本合格）、ac20-after-fix-x5.log（5 回とも 6 本合格）、npm-test-after-ac20-fix.log（133 本合格、終了コード 0） | PRD AC-20 Given「保存データがないブラウザで、AC-19 のファイル（版番号が今の版）がある」。test-hooks.md W-9「書き出し：`page.waitForEvent('download')` で 1 件」「読み込み：隠した input に `setInputFiles`」。Then は変えていない |

取り込まなかったもの（理由）：
- W-9「次の 1 回」の文言、AC-31 の祖先の除外：tech-lead が契約の方を直した（f339a95）。テストはもとから直した契約の形なので変更なし。
- AC-1 の「3 回」の読み方と AC-14 の Given の書き方の明記：PRD の側で pdm に向けた問い。テストは PRD 12 の読み方（上の表）で書き、PRD が変わったら合わせる。
- Linux の WebKit での `Tab` / `Alt+Tab`：この環境（macOS）では確かめられない。最初の CI の実行で evidence/tab-keys.log と同じ出力を残す（契約「未確認」）。
- AC-30 の「該当なし」の annotation を G3 の報告に必ず書く（reviewer 提案 5）：テストの変更ではなく G3 の報告の決まり。2 章の AC-30 の行に書いた。

## 確かめ（提出前に verifier が印を付ける。reviewer はこれを信じずに確かめる）
- [x] 読んだファイルが PRD、design/、contracts/（と指揮役が指定した ADR、型、前回の判定）だけで、冒頭に全部並んでいる。
- [x] PRD のすべての AC 番号（32）が、2 章とテストの名前にある（`grep -oE 'AC-[0-9]+' docs/prd/001-daily-learning.md | sort -u` と `grep -rhoE "AC[0-9]+_" tests | sort -u` の差は「AC-33」の 1 行だけで、これは PRD 18 の Q11 の文中（「AC の数は 32 のまま」の案の説明）に出る番号で AC ではない）。AC 番号のないテストは契約が求める `BUDGET2_` の 1 本と、design r6 の「AC にない状態」の `DESIGN_` 4 本（2 章の予算と design の表。r5）。
- [x] 2 章の全行に、技法、試す値、具体的な値の結果がある。「正しく」「適切に」だけの結果がない。
- [x] 影響「大」のリスク（R1〜R5）のすべてに、自動テスト、3 章の行、6 章のチャーターがある。
- [x] 3 章の 9 行すべてに選んだものがあり、範囲外には理由がある。
- [x] 4 章のつなぎ口がすべて contracts/ にある。契約と仕様の食い違いは報告の「未解決」に書いた。
- [x] 受け入れテストのフォルダで（r5 で数え直し）、sleep（`sleep\(|usleep|Thread\.sleep|time\.sleep|asyncio\.sleep|waitForTimeout`）0 件、skip / xfail / fixme / only 0 件、`retry|rerun` は tests/ と helpers/ で `error.storage.retry`（契約の識別子を指す文字列）を除いて 0 件（設定の `retries: 0` と README の説明は除く）、`@testable` と実装の import 0 件、`setTimeout` 2 件（helpers/app.mjs の pause：AC-28 の PRD が決めた 2 秒の間隔。helpers/app.mjs の waitServiceWorkerReady：SW が登録されないときに WAIT_MS で止まらないための上限で、待つためではない）。`Date.now` は 6 件（ac12-ac23 の AC-23 の始点と終点の 4 件と、helpers/seed.mjs の addDays のコメントと計算。契約「文書が変わる区間」）、`performance.now` は 7 件（helpers/app.mjs の armTiming とそのコメント。契約「文書が変わらない区間」）。表示の文字で探す locator（`getByText|getByLabel|text=|hasText`）0 件（`getByRole('dialog')` 1 件は test-hooks.md の AC-31 の数え方、`.nth()` 5 件は繰り返す行と道具の項目）。`localStorage` を読むのは helpers/seed.mjs の seed の投入（W-7）と `readStoredData`（W-9「保存データの印」）だけ。
- [x] r2、r3、r4 の直しは、判定の指摘（r4 は PRD r7 の変更）ごとに 10 章の表に「どこをどう直したか」と根拠（PRD の行か契約の節）を書いた。
- [x] 時間の計測（AC-1、AC-2、AC-12、AC-23）が契約「時間の計り方」のとおりで、stub の本当の遅れに対して AC-1 / AC-2 は +0〜+3 ms、AC-23 は +13〜+40 ms に収まることを両ブラウザで確かめた（evidence/timing.log）。
- [x] 8 章の赤の証拠があり、落ちた理由が書き間違いではなく「機能がまだない」こと。r5 の r6-red.log では、落ちた 16 本（8 本 × 2 ブラウザ）がすべて r6 の新しい振る舞い（`task.dayChanged`、146 キー目、`persistGranted` を書かない、U-15）に関わり、それ以外の 129 本は通った。
- [x] r5 の直しで既存の expect を消していない（`git diff` で消した行に `expect` は 0 件）。
