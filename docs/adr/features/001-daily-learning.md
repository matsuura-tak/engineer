# 技術設計メモ 001-daily-learning：診断と今日の学習（今日の一手）

- 書いた役：tech-lead　日付：2026-10-30（2026-11-06 に 1〜10 を FB 2 回目の形に書き直した：PRD r13、design r13。それより前の形は git の履歴のコミット 94bcc6a の時点）
- PRD：docs/prd/001-daily-learning.md（r13、AC-1〜AC-45。AC-30 は欠番で 44 件）　デザイン：design/001-daily-learning.md（r13、文言 194 キー）　契約：contracts/（HTTP の API はないので OpenAPI はない。一覧は contracts/README.md）
- 読み替え：型の「operationId」は「契約のファイルと項目」、「iOS」は「ブラウザ（Safari 17 以上、Chrome の最新 2 版）」に読み替える。spectral と oasdiff は使えないので、JSON Schema の検査と見本のテストで代える（指揮役の裁定 E2）。
- Takuma の決定 D1〜D10（2026-10-30。docs/approvals/001-daily-learning-G0.md の末尾）と、FB 1 回目（docs/approvals/001-daily-learning-FB1.md）、指揮役の決定（docs/approvals/delegation.md の 2026-11-05：Q12〜Q19、S7 の再読み込み、予算の割り直し）を反映した。一覧は 10。

## 0. FB 2 回目の改訂（2026-11-06、tech-lead。PRD r13、design r13）
PRD r13 で、課題は「3 問 × 3 択で選んで学ぶ」型になり、正誤の返し、正誤による段階、図の 6 型、案内役ミルが入った（AC-41〜AC-45 が増え、AC-8、AC-23、AC-31、AC-32 などが変わった）。契約は 4 回に分けて書き直した（コミット 902a0cd、7aafbbd、94bcc6a と今回）。ADR は 0002 の改訂 2、0006（課題集を 6 領域に分ける）、0007（esbuild で JS をまとめる）、0008（ミルの PNG と `<picture>`）。

## 1. 範囲、目標、非目標
- 範囲：ブラウザだけで動く Web アプリ（サーバーなし、登録なし）。3 問の自己診断、今日の課題（導入と図、3 問 × 3 択、正誤と説明の返し、まとめ）、正答数による段階の上下、履歴と統計、書き出しと読み込み、オフライン、日英の文言、案内役ミル。
- 目標：PRD 11 の AC-1〜AC-45（44 件）を、2 の表の契約とテストで満たす。非機能は 6。
- 非目標：アカウント、同期、外への送信（Q1 は A）、通知、課金、外部の AI。iOS のネイティブのアプリ。

## 2. 受け入れ条件の対応表
operationId は全行「なし（端末のみ）」。代わりに「データ」の列に契約のファイルと項目を書く。テストはすべて backend/tests/acceptance/（verifier）。「2」は Chromium と WebKit の両方、「C」は Chromium だけ、「JSON」はブラウザを使わずに JSON を検査する。行は 44（PRD の `^- AC-[0-9]+：` の数と同じ。AC-30 は PRD で欠番）。

| AC | 画面（design/） | operationId | データ（契約のファイルと項目） | 確かめるテスト |
|---|---|---|---|---|
| AC-1 | S1 → S2 | なし（端末のみ） | identifiers.md の 3、4：`diagnosis.progress` の `data-question-index`、`-total`。時間は test-hooks.md の「時間の計り方」 | 受け入れ 2：3 問、切り替え 500 ms |
| AC-2 | S2 → S3 | なし（端末のみ） | data.md の 4（6-4）、5（組と選び方）、ADR 0006（`diagnosis.finish` で領域のファイルを待つ）。`data-task-area`、`-level` | 受け入れ 2：回答を変えた 3 通り、1,000 ms |
| AC-3 | S3、課題集 | なし（端末のみ） | schemas/tasks.schema.json（intro、questions 3 × choices 3、answer、insight、figure、minutes 1〜15） | 受け入れ JSON（ajv、6 ファイル）とスクリーンショット |
| AC-4 | なし | なし（端末のみ） | test-hooks.md の W-6（件数、組ごとの件数、ID の重複 0）。予算は budgets.md の 2（`BUDGET2_`） | 受け入れ JSON |
| AC-5 | S3 → S4 → S5 | なし（端末のみ） | data.md の 2（3 問目で current を done の行に）、4（6-3）。identifiers.md の `task.done` | 受け入れ 2：再読み込みと翌日まで |
| AC-6 | S3（翌日） | なし（端末のみ） | data.md の 5（history と current にない最小の ID）、8（ID は 1 回だけ） | 受け入れ 2：seed と時刻の固定 |
| AC-7 | S3 → S6 | なし（端末のみ） | data.md の 2（no_time の行と answers、score）、4（6-3） | 受け入れ 2 |
| AC-8 | S3 → S5 → S3 | なし（端末のみ） | data.md の 5（段階の規則と 9 通りの表）、data.schema.json の `score`、`levelChange`。seed は fixtures/seeds/seed-ac8-*（10 件）と test-hooks.md の W-7 | 受け入れ 2：9 通り。単体（規則の関数） |
| AC-9 | S4 | なし（端末のみ） | data.md の 2（helpful は done の行だけ）、data.schema.json の allOf | 受け入れ 2 |
| AC-10 | S7 | なし（端末のみ） | data.md の 4（6-4）、5（S7 の変種と補足）、identifiers.md の `task.exhausted.*` | 受け入れ 2：本番の課題集から作る seed |
| AC-11 | S2、S3、S4 | なし（端末のみ） | data.md の 2（setItem 1 回）、test-hooks.md の W-9（失敗の注入） | 受け入れ 2 |
| AC-12 | 全画面 | なし（端末のみ） | service-worker.md の 3、5（FILES、cache から返す）、test-hooks.md の W-12、W-13 | 受け入れ 2：送信 0 件 |
| AC-13 | S3、S8 | なし（端末のみ） | data.md の 11、data.schema.json の `device.persistRequested`、test-hooks.md の W-9 | 受け入れ 2：拒否の注入 |
| AC-14 | S8 → S2 → S3 / S7 | なし（端末のみ） | data.md の 2（やり直しは current を書かない）、4、5。seed は seed-ac14-three-completed.json と W-7 の作り方 | 受け入れ 2：2 通り |
| AC-15 | S0 → S3 | なし（端末のみ） | budgets.md の 1（A の枠）と 4（読み込みの順番）、test-hooks.md の W-10、W-11、identifiers.md の `data-debug-load-ms` | 受け入れ C：5 回、2,000 ms |
| AC-16 | S8 → S1 | なし（端末のみ） | data.md の 7（removeItem はキー 1 つ） | 受け入れ 2 |
| AC-17 | 全画面（返しとまとめを含む） | なし（端末のみ） | identifiers.md の 3（testid）、design の 4 と D-50（図のラベル `overflow-wrap: anywhere`）、budgets.md の 5 | 受け入れ 2：文字 200%、幅 320 |
| AC-18 | S1 → S2 → S3 → S4 | なし（端末のみ） | identifiers.md の 3、test-hooks.md の「キーボードの移動キー」 | 受け入れ 2 |
| AC-19 | S8 | なし（端末のみ） | data.md の 7（書き出しは device を除く）、data.schema.json（answers、score）、test-hooks.md の W-9 | 受け入れ 2：download を ajv に通す |
| AC-20 | S8 / S1 | なし（端末のみ） | data.md の 6、7（読み込み、showCharacter はファイルの値） | 受け入れ 2 |
| AC-21 | S1 | なし（端末のみ） | data.md の 2（device.homeGuideClosed）、test-hooks.md の W-16 | 受け入れ 2：UA の偽装 |
| AC-22 | S1 | なし（端末のみ） | test-hooks.md の W-16（スタンドアロン） | 受け入れ 2 |
| AC-23 | S0 → S3 / S5。3 通り目は S8 → S2 | なし（端末のみ） | service-worker.md の 3（貯め終える前は fetch の失敗）、data.md の 4「課題集のファイル」、test-hooks.md の「時間の計り方」と W-12、W-13、W-17 | 受け入れ 2：3 通り |
| AC-24 | S9 | なし（端末のみ） | data.md の 9（13 の指標）、identifiers.md の 4 の `data-stat-*`。seed は seed-ac24-stats.json | 受け入れ 2：seed と時刻の固定 |
| AC-25 | S8 | なし（端末のみ） | data.md の 6（formatVersion が新しいものは拒む）。見本 fixtures/data/invalid-newer-version.json | 受け入れ 2 |
| AC-26 | 全画面 | なし（端末のみ） | strings.md の 2、3、schemas/strings.schema.json（194 キー）、test-hooks.md の W-14 | 受け入れ 2：en-US |
| AC-27 | 全画面（返し、まとめ、図） | なし（端末のみ） | dependencies.md の @axe-core/playwright、identifiers.md の 3 | 受け入れ 2：axe |
| AC-28 | S3 | なし（端末のみ） | service-worker.md の 6、test-hooks.md の「AC-28 の配布物の差し替え」（`--tasks-dir`） | 受け入れ 2 |
| AC-29 | 課題集 | なし（端末のみ） | schemas/tasks.schema.json、strings.md の 5（選択肢と説明が互いに異なる、正解の位置 20〜50%） | 受け入れ JSON |
| AC-31 | S3、S5 | なし（端末のみ） | test-hooks.md の「AC-31 の重なる要素の数え方」、design の D-53（未回答の S3 でミル 0 件） | 受け入れ 2 |
| AC-32 | S3（再読み込み） | なし（端末のみ） | data.md の 2（1 問ごとに current.answers）、4（S3 の復元）、data.schema.json の `current.answers` | 受け入れ 2 |
| AC-33 | S5 / S6 → S3 | なし（端末のみ） | data.md の 4（操作で出すとき）、9（nth-today）、test-hooks.md の「時間の計り方」 | 受け入れ 2：1,000 ms |
| AC-34 | 課題集（初級） | なし（端末のみ） | strings.md の 7.4（未経験向けの決まり） | 受け入れ JSON |
| AC-35 | S4 → S5 | なし（端末のみ） | data.md の 9（累計）、identifiers.md の `task.total.*`、`task.cheer` の `data-milestone`、strings.md の 7（語の検査）。seed は seed-ac35-six-completed.json と W-7 | 受け入れ 2：4 通りと JSON の語の検査 |
| AC-36 | S3 | なし（端末のみ） | data.md の 9（data-progress-index、-total）。seed は seed-ac36-three-issued.json | 受け入れ 2 |
| AC-37 | S4、S9 | なし（端末のみ） | data.md の 9（今週の完了日数）。seed は seed-ac24-stats.json | 受け入れ 2 |
| AC-38 | S5 | なし（端末のみ） | schemas/tasks.schema.json の `insight`、identifiers.md の `task.insight*` | 受け入れ 2 |
| AC-39 | S2 | なし（端末のみ） | strings.md（`area.<ID>.desc`）、strings.schema.json | 受け入れ 2 と JSON |
| AC-40 | S2 | なし（端末のみ） | data.schema.json の `diagnosis.years`（never）、identifiers.md の 5 | 受け入れ 2 |
| AC-41 | S3 | なし（端末のみ） | data.md の 2（答えは 1 回だけ書く）、data.schema.json の `choiceAnswer`、identifiers.md の `task.choice`、`data-choice-state`、`data-answer-result`、`task.question.status`。test-hooks.md の「時間の計り方」（300 ms）と「正誤の読み上げ」 | 受け入れ 2：300 ms。読み上げは G3 で手（VoiceOver） |
| AC-42 | S5、S10 | なし（端末のみ） | data.schema.json の `score`（answers の正解数と同じ）、data.md の 9、strings.md の 7（点数の語の検査） | 受け入れ 2 と JSON |
| AC-43 | 課題集 | なし（端末のみ） | strings.md の 7.3（文の調子、1 文 60 字） | 受け入れ JSON |
| AC-44 | S3 | なし（端末のみ） | schemas/tasks.schema.json の `figure`（型 6、ラベル数、alt）、identifiers.md の `task.figure`、`data-figure-part`。test-hooks.md の W-4（page.route で 6 型）、W-12（画像の要求 0。`img/miru-` を除く）、「線の対比」 | 受け入れ 2：幅 320、暗色、3:1 |
| AC-45 | S1、S3、S4、S7、S8 | なし（端末のみ） | data.schema.json の `showCharacter`、identifiers.md の `guide.*`、`data-mood`、ADR 0008、test-hooks.md の「ミルの整数倍」と「動きを減らす設定」、strings.md の 7（責める語） | 受け入れ 2 と JSON |

## 3. 構成図
```
[ブラウザ]
  index.html（CSP の meta 1 つ）──▶ js/app.js（esbuild でまとめた ES module 1 つ。ADR 0007）
     │  fetch（同じ origin）              │ localStorage `kyounoitte:data`（1 キー。ADR 0002）
     ├─▶ i18n/ja.json、en.json            │ navigator.storage.persist / persisted
     ├─▶ data/tasks-<領域>.json（6 つ。要る領域だけ。ADR 0006）
     └─▶ img/miru-<mood>[-dark].png（<picture>。ADR 0008）
  sw.js（Cache `kyounoitte-<版>`。install で FILES を全部貯め、以後 cache から返す。ADR 0003）
[GitHub Pages /engineer/]（静的な配布物だけ。外への送信なし）
```
- 書く役：配布物の元は backend-engineer、契約は tech-lead、受け入れテストは verifier。

## 4. 契約の変更と互換性
- 書き直した契約：data.md と schemas/data.schema.json（answers、score、levelChange、current.answers、showCharacter。申告は done、no_time、none）、identifiers.md、strings.md と schemas/strings.schema.json（194 キー）、schemas/tasks.schema.json（新しい型）、test-hooks.md（選択肢 → 返し 300 ms、W-4 の 6 ファイル、W-7 の seed の形、W-8、W-12 の resourceType とミルを除く数え方、W-17 の SW が貯め終える前のオフライン、図とミルと読み上げの確かめ方）、budgets.md（1 を A 150,000 と B 400,000 の 2 つの枠に、2 を新しい型の長さに、4 の preload、5 の使う機能）、service-worker.md（FILES に 6 ファイル、PNG 8 枚、app.js。貯め終える前は fetch の失敗）。
- 互換性：spectral と oasdiff は未検査（OpenAPI がない。指揮役の裁定 E2）。代わりに `cd backend && npm run check:contracts`（2026-11-06、tech-lead）：`ajv 8.20.0（Ajv2020、strict）`、`見本 122 件、期待と違う結果 0 件`、終了コード 0。古い形の見本 `data/invalid-v1-before-r13.json` と `data/invalid-old-report-too-hard.json` は「期待：落ちる → 落ちた」。formatVersion は 1 のまま（未公開。ADR 0002 の改訂 2）。
- seed の規則の確かめ：AC-8 の 10 件、AC-14、AC-35、AC-36 の seed に data.md の 5 の規則を当てる手書きの計算（スクラッチパッドの p4/rule.py。リポジトリの外）で、15 通りとも「次の段階」が data.md の 5 の表と test-hooks.md の W-7 のとおり（OK 15、終了コード 0）。
- 予算の見積もりのうち、合成の文で 1 ファイルの大きさを測る試しは、元の文が短く縮みすぎたので使わなかった（budgets.md の 2）。

## 5. データモデルと移行
- 保存データ：localStorage のキー 1 つ（端末の中だけ。個人情報は持たない：診断の回答、課題の ID、選んだ選択肢の位置と正誤、日付）。保存期間は利用者が消すまで。消し方は S8 の削除（removeItem）。形は data.schema.json。
- 移行：公開前なので formatVersion 1 のまま作り直し、移す手順はない（ADR 0002 の改訂 2。見直す条件：G1 が終わる前に公開したら版を上げる）。
- 課題集：配布物の 6 ファイル（formatVersion は tasks.schema.json）。課題は消さず、ID を使い回さない（identifiers.md の 5）。

## 6. 非機能の目標
| 目標 | 数字 | 測り方 |
|---|---|---|
| 初回に読む分 | gzip 後 150,000 バイト以下 | check-budget.mjs の A（budgets.md の 1） |
| SW が貯める分 | 400,000 バイト以下 | check-budget.mjs の B |
| 課題集の 1 ファイル | gzip 後 50,000 バイト以下 | check-budget.mjs と `BUDGET2_` |
| 開いてから課題まで | 2,000 ms 以下を 5 回とも | AC-15（W-10、W-11） |
| 選択肢 → 返し | 300 ms 以下 | AC-41（時間の計り方） |
| 診断の切り替え、課題を出す | 500 ms、1,000 ms 以下 | AC-1、AC-2、AC-33 |
| オフラインの再読み込み | 3,000 ms 以下 | AC-23（時間の計り方の文書が変わる区間） |
| 線の対比 | 3:1 以上 | AC-44（test-hooks.md の「線の対比」） |

## 7. 脅威モデル
新しい境界なし。PNG と課題集は同じ origin で、CSP の `img-src 'self'` と `connect-src 'self'` の範囲（ADR 0005）。読み込むファイルは新しい項目も data.schema.json で検査し、課題集はファイル名の領域とトップの `area` を確かめる（data.md の 4）。文字は textContent でだけ入れる。

## 8. 観測と KPI イベント
PRD 15 のイベントはどれも外に送らない（Q1 は A）。値は端末の統計（data.md の 9、AC-24）で見え、判定日に利用者が画面を送る。

## 9. 依存ライブラリの変更
- esbuild 0.28.2（devDependency。ビルドの時だけ。本番の依存は 0 のまま）と、lockfile の `@esbuild/*` の optional 依存 26 件（contracts/dependencies.md、ADR 0007）。解決とビルドの出力は ADR 0007 の「確かめたこと」（G1 tech-lead r3 の spike）。backend/package.json に入れるのは backend-engineer。

## 10. ADR と未確認
- ADR：0001（土台。0007 で一部を置き換え）、0002（保存。改訂 2）、0003（SW）、0004（受け入れテスト）、0005（CSP）、0006（6 領域）、0007（esbuild）、0008（ミル）。
- 作り手に頼むこと（契約の外）：check-budget.mjs を A と B の 2 つの枠に（backend-engineer）、build.mjs の `--tasks-dir` と `tasksDir`、6 ファイルの検査、app.js へのまとめ（backend-engineer）、backend/tests/unit/rules.test.mjs が参照する古い seed の名前（`seed-ac8-intermediate-*`）を新しい名前に（backend-engineer）、課題集 v3 を budgets.md の 2 の長さで（pdm）。
- 未確認：`serviceWorkers: 'block'` と setOffline の組での WebKit の fetch の失敗（test-hooks.md の W-17）、`page.emulateMedia({ contrast: 'more' })`（「線の対比」）、Safari 17 の実機での `<picture>` と `pixelated`（G4）、Linux の CI での WebKit の OS のライブラリ（ADR 0004）、課題集 v3 の実物の大きさ（budgets.md の 2 の 1,200 字は［推測］）。

## 確かめ（A）
- [x] 2 の表に PRD の全 AC があり、空の欄がない（`grep -cE '^- AC-[0-9]+：' docs/prd/001-daily-learning.md` → 44、2 の表の行 → 44。2026-11-06 に実行）
- [x] 3 の図のすべての要素に技術と責任が、すべての矢印に用途と通信方式がある
- [x] 契約のすべての operation に operationId、成功とエラーの例、認証の要否、AC 番号がある（読み替え：operation はない。各スキーマに正しい見本と壊した見本があり、description に AC 番号）
- [x] 4 に spectral と oasdiff の出力（または「未検査」と理由）がある（未検査（OpenAPI なし）と、代わりの check:contracts の 2026-11-06 の出力。公開前なので版 1 のまま：ADR 0002）
- [x] 5 の全エンティティに置き場所、個人情報か、保存期間、消し方がある（移す手順なし。理由は ADR 0002 の改訂 2）
- [x] 6 のすべての行に数字と測り方がある
- [x] 7 が「新しい境界なし」
- [x] 8 で、PRD 15 の全イベントに送る場所がある（すべて「送らない」）
- [x] 新しい依存に、解決とビルドの出力があり、dependencies.md の全列が埋まっている（esbuild。ADR 0007 と dependencies.md。2026-11-06 のその 1）

## 変更の記録
FB 2 回目の書き直し（2026-11-06、tech-lead。その 4）：1〜10 と確かめを PRD r13、design r13 の形にした。2 の表は 44 行。前の形は git の履歴（コミット 94bcc6a）。

G1 reviewer（設計）r1 の要修正と提案、pdm の G1 の確認（firstOpenDate）を反映した（2026-10-30、tech-lead）。1 行に 1 つの変更。
- M1：ADR 0002 の「結果」、test-hooks.md の W-9、この 2 の AC-11 の行を「なしか診断の途中の起動では setItem を呼ばない（AC-11 の注入はこの状態）。ありの起動では data.md の 2 のとおり最大 1 回」に揃えた。
- M1：data.md の 2 に同じ文を足し、参照の誤り「4 の (5)」を「4 の 6-1」「6-4」に直した。4 の 6-4 に「選べなくても 6-1 で移した行は 1 回保存する」を足した。
- P1：data.md の 6 に「日付の実在は検査しない。文字列のまま比べ、new Date() に渡さない」を足した。
- P2：data.md の 5 の 2 に「やり直しの診断で段階が変わった直後も同じ。PRD 11 の冒頭を参照」を足した（PRD の文は pdm）。
- P3：service-worker.md の 1 に「ポリシーは起動ごとに 1 回だけ作り、トップレベルに持つ」と spike（2 回目は Chromium と WebKit で TypeError）を足した。
- P4：budgets.md の 1 の数え方を zlib を正とし、文言の行を「約 6,500」と zlib（6,470）と gzip -9（6,440）の両方の値にした。
- P5：test-hooks.md の W-4 と ADR 0004 の確かめたことに「use（testOptions）でも newContext でも渡せる」と URL を足した。
- P6：identifiers.md の `task.external.tools` と `.item` を「`<dd>` の中の `<ul>` の `<li>`」にした。
- firstOpenDate：data.md の 2（表の 2 行と規則）、3（なしの例、スキーマの条件、S8 の表示）、4（23:55 と 0:05 の例）、6、7（書き出しはありだけ、なしのファイルは読まない、ファイルの値を使う）、8 を直した。
- firstOpenDate：data.schema.json の required から外し、allOf の 3 つ目（なければ diagnosis、levels、history が空）を足した。description を直した。
- firstOpenDate：fixtures の valid-guide-closed-only.json から firstOpenDate を外し、valid-guide-closed-then-in-progress.json と invalid-{in-progress,history,levels}-without-first-open-date.json を足した（34 → 38 件）。
- firstOpenDate：check-schemas.mjs に「なしなのに firstOpenDate がある」の検査を足した。ADR 0002 の「一緒に決めたこと」と「確かめたこと」、test-hooks.md の W-16、この 2 の AC-20、AC-21、4、5 を直した。
- 件数：ADR 0004、CLAUDE.md、この 4 の見本の件数を 38 にした。

Takuma の決定 D1〜D10 と PRD r6、design r4 に合わせた（2026-10-30、tech-lead）。1 行に 1 つの変更。
- Takuma の返事を待って仮に置いた印：設計メモの 1、6、7、8、10、ADR 0005、strings.md の 3 と 6、budgets.md の 1 を「Takuma の決定 Dn」に直した（その印の語の grep が contracts、docs/adr、CLAUDE.md で 0 件）。冒頭の PRD を r6、デザインを r4 にした。
- D5：budgets.md の 1 の表で manifest を殻の行からアイコンの行に移し、「アイコンと manifest で 10,000」にした（合計 150,000 は不変。design 8 の枠と同じ）。
- D5：budgets.md に 6 を足した（`./icon-180.png`、`./manifest.webmanifest` の 7 項目と置かない項目、`<head>` の 5 行、CSP との整合、確かめ方）。service-worker.md の 3 の FILES と ADR 0001 の表を確定の名前にした。test-hooks.md のサーバーに `.png` の Content-Type を足した。
- D3：strings.schema.json の `app.name` を const「今日の一手」にし、落ちる見本 fixtures/strings/invalid-app-name-english.json を足した。ADR 0001 のビルドが書き込むものに `apple-mobile-web-app-title` を足した。
- D10：data.md の 5 の「seed の古い行の level は levels[a] と同じ」を「その課題が出たときの段階」に直し、AC-8 の seed の表を足した。test-hooks.md の W-7 も同じに直した。
- D10：fixtures/seeds/ に seed-ac8-intermediate-too-hard-then-none.json（8 通り目）と seed-ac8-intermediate-after-advanced-two-too-hard.json（9 通り目）を足した。2 の AC-8 の行と ADR 0001 の単体テストを 9 通りにした。
- D9 と D10：data.md の 2 と 5 の「PRD 11 の冒頭を参照」を、参照先の語（「初めて開いた日」、「連続」の定義）が分かる書き方にした。
- U-7：data.md の 2 と ADR 0002 に「やり直しの診断で終える前に離れたら（やめる、nav、アプリ名、再読み込み、日付の変わり目）下書きを捨て、元の診断のまま」を足した（designer の申し送り）。
- 件数：4 の check-schemas の出力を貼り直した（38 → 41 件）。4 の表、ADR 0004、CLAUDE.md の件数を 41 にした。10 の未確認に `apple-mobile-web-app-title` と Pages の Content-Type を足した。

G2（受け入れテスト）の tech-lead r1 と reviewer r1 で「契約、ADR、CLAUDE.md の側で直す」とした項目を反映した（2026-10-31、tech-lead）。1 行に 1 つの変更。
- 依存の置き場所 B：ADR 0004 の決定に置き場所とコマンド `cd backend/tests/acceptance && npm ci && npx playwright install chromium webkit && npx playwright test` を書き、案 A、B、C を足した。test-hooks.md の「実行の環境」、dependencies.md（「入る package.json」の列と決まり）、CLAUDE.md を同じにした。
- ADR 0001：backend の devDependencies を ajv だけにし、`test:acceptance` を受け入れテストのフォルダで動かす形にした。`build` から `--version dev` を外し、版は呼ぶ人が `YYYY-MM-DD.N` で渡す（形に合わなければ終了コード 1。test-hooks.md の「ビルドの手順の約束」に正規表現）。check:contracts が backend/ の ajv で動く理由を書いた（G2 reviewer r1 の提案 6）。
- test-hooks.md：「キーボードの移動キー」（AC-18。WebKit は `Alt+Tab` と `Alt+Shift+Tab`、それ以外は `Tab` と `Shift+Tab`。Linux の WebKit は未確認）を足した。2 の AC-18 の行も直した。
- test-hooks.md：W-13 の対象に AC-12 を足した（オフラインにする前に SW の準備を待つ）。2 の AC-12 の行も直した。
- test-hooks.md：W-9 の失敗の注入を「テストが印を立てた後の次の 1 回」にし、W-7 の順番の理由と data.md の 1 の理由の文を合わせた。
- test-hooks.md：AC-31 の数え方の 3 に「題名とその祖先は数えない」を足した。
- test-hooks.md：W-7 に AC-14 の seed（本番の課題集から作る出し終えた履歴。seed-ac14-three-completed.json は Given を満たさない）を足した。2 の AC-14 の行も直した。PRD の Given の書き方は pdm への問い（G2 tech-lead r1 の未解決 (2)）。
- test-hooks.md の W-6 と budgets.md の 2：予算のテストの名前を `BUDGET2_` で始め、AC の表に混ぜないとした（G2 reviewer r1 の提案 4）。
- test-hooks.md（G2 tech-lead r2）：「時間の計り方」の節を足した（AC-1、AC-2 はページの中で click の capture から MutationObserver まで、AC-23 はテスト側の `commit` と 20 ms おきの `expect.poll`。案 (b) は選ばない）。W-3、W-10 に参照を足し、「キーボードの移動キー」の Linux の未確認に WebKit のソースの裏付けを足した（最初の CI で確かめるのは残す）。

PRD r7 と Takuma の Q11 の決定（A：AC-14 に 2 通り目を足す。2026-11-01）に合わせた（2026-11-01、tech-lead）。1 行に 1 つの変更。
- Q11：test-hooks.md の W-7 の AC-14 を 2 通り（1 通り目は出し終えた履歴、2 通り目は seed-ac14-three-completed.json の形で開いて `task.today` を出してからやり直し、翌日に固定して開く）にし、data.md の 2 にやり直しを終えた後の行き先（4 の 6-2〜6-4 と同じ）を 1 項足した。2 の AC-14 の行を 2 通りにし、冒頭の PRD を r7 にした。

実装の後の地図と依存の整理（2026-11-03、tech-lead）。1 行に 1 つの変更。
- contracts/dependencies.md に「推移的な依存」の節（扱いの決まり、確かめ方 3 つ、lockfile の 7 件の表）を足し、CLAUDE.md の段階を G2（実装）に、コマンドの「未確認」を backend/ で動かした結果に直した（受け入れテストは 133 本）。
- contracts/data.md の 10：「365 行 × 2,000 字で 1,000,000 字以下」は答えが日本語か英数字のときだけ成り立つので、字の種類ごとの長さの表、Chromium と WebKit で測った localStorage の上限、上限を超えたときの動きに書き直した（backend-engineer の G2 の報告）。6 の「保存の大きさ」と 7 の D の行の 1,000,000 字も同じ前提で読む。ADR 0001 の「確かめたこと」に backend/ で確認した追記を足した（G2 reviewer r1 の提案）。
- ADR 0002：U-6、検討した案の (a) と (b)、反論への答え、確かめたことの上限の数字を data.md の 10 に合わせ（答えが日本語か英数字のときの前提、測った上限）、見直す条件に「上限に届いたあとの扱いは v1 で手当てせず 002 以降」（指揮役の決定、docs/approvals/delegation.md）を足した。10 の未確認の localStorage の上限の行も測った値に直した。

design r6（05cdd4a）と design-reviewer G3 r1 の指摘 3、6、8 に合わせた（2026-11-04、tech-lead）。1 行に 1 つの変更。
- 指摘 3（D-30）：strings.schema.json の required と properties に `task.dayChanged`（差し込みなし）を足し、146 キーにした。fixtures/strings の 8 件すべてに同じキーを足した（invalid の 6 件は、元の 1 つの理由だけで落ちる形のまま）。文は design 7 と一字一句同じ（node で比べた）。
- 指摘 3：identifiers.md の 3（146 個、`task.dayChanged` の要素、置き場所、フォーカス、0 件になる画面、消える時機）、2 の `task.today` と `task.exhausted` の備考（data-state は増やさない）、6（task は 33）を直した。strings.md の 1、README.md、この 2 の AC-26 の行も 146 にした。
- 指摘 3：budgets.md の 1 の文言の行を 146 キーで測り直した（zlib 3,554 + 3,016 = 6,570、`gzip -9` 3,516 + 3,047 = 6,563。上限 8,000 は不変）。
- 指摘 3：data.md の 4 の「画面を開いたまま日付が変わったとき」を書き直した（対象の画面、手順 1〜4、結果、例 2 つ、対象の外）。data.md の 2 に「やり直しの判定も最大 1 回で、書きかけの答えを含める」を足した。ADR 0002 の「結果」も同じ。2 の AC-32 の行に参照を足した。
- 前日の答えが翌日の `current.answer` に入る件（探索 R3 の 2）：原因は、日付の変わり目の判定の後に描く S3 の `render()` が、捨てていない前日の答えの欄を `flushAnswer()` で新しい `current` に保存すること（main.js の 63〜66 行と 110 行）。data.md の 4 の手順 1（欄の値はメモリの `current.answer` に入れ、欄はそこで捨てる）で、実装がこの順にしか書けないようにした。
- 同じ節の手順 2：判定は保存を `getItem` で読み直してから行う（初めの案の「メモリの保存データで判定」をやめた。2026-11-04）。メモリで判定して保存すると、別のタブが後から保存した翌日の課題や申告を上書きして消すため。読んだ `current` が画面の課題（`date` と `taskId`）と同じときだけ、捨てた欄の値をその `answer` にする。setItem の回数は変わらない。
- 指摘 8（D-31）：data.md に 11（求める時機、手順、S8 の注意、理由、未確認）を足した。2 の表から「`persist()` の結果が返る」の行を外し、結果を保存しないことと、`device.persistRequested`、`persistGranted` を読むだけにすることを書いた。data.schema.json の 2 つの description を直した（形は変えない）。test-hooks.md の W-9 を `persist()` と `persisted()` の両方の注入にし、W-3 に「開いたまま日付を進める」を足した。8 の表と 2 の AC-13 の行、10 の未確認を直した。ADR 0002 の「一緒に決めたこと」に 1 項足した。
- 検査：`cd backend && npm run check:contracts` → `見本 41 件、期待と違う結果 0 件`、終了コード 0（2026-11-04、ajv 8.20.0。strings の 8 件はすべて期待どおり）。足したキーが要ることの確かめ：valid-ja.json から `task.dayChanged` を消すと `must have required property 'task.dayChanged'`、`{date}` を入れると `data/task.dayChanged must NOT be valid`。今の backend/public/i18n/ja.json と en.json は `must have required property 'task.dayChanged'` で落ちる（backend-engineer が足すまで、単体テスト i18n-files.test.mjs の 1 本が落ちる：94 本中 93 本が通る）。
- spike（リポジトリの外、@playwright/test 1.64.1。127.0.0.1 の新しいコンテキスト）：注入なしの `persisted()`、`persist()`、もう一度 `persisted()` は Chromium 156 と WebKit 27.2 のどちらも `false`、`false`、`false`。注入しなくても S8 の注意が出るので、seed で「あり」にした S8 のスクリーンショットにも注意が写る。

決めたこと（designer に任された 3 つ。2026-11-04、tech-lead）：
- U-14（`persist()` を求め直すか）：この時点の案は「求め直す（今日の課題を出した直後の S3 の後に、`persisted()` が false のときだけ。1 日 1 回まで）」だった。PRD 11 の冒頭（1 回だけ）との食い違いが残り、指揮役の決定（2026-11-04、docs/approvals/delegation.md）で取り下げた。今の形は下の「U-14 を PRD どおりに戻した」にある。
- U-15（S1 と S2 にも日付の確かめが及ぶ件）：保存データが「なし」と「診断の途中」の画面と S0 error では確かめず、操作をそのまま実行する（data.md の 4 の「対象の外」）。
  - 理由：これらの画面には移す課題がない。日付を使う保存（`firstOpenDate`、`completedOn`、今日の課題）は実行した時点の今日で書くので、日付が変わってから操作したときと結果が同じ。捨てると、知らせもないまま radio の確定が 1 回消え、S0 error では「再読み込み」が 1 回効かない。
  - いちばん強い反論：決まりが保存データの区分で変わり、規則が 1 つでなくなる。やり直しの S2（「あり」）は捨て、初回の S2 は捨てないので、見た目が同じ画面で振る舞いが違う。
  - それでも選んだ理由：やり直しの S2 の確定は今日の課題の有無に効く（data.md の 2）。日付をまたいだら前の日の課題を移す必要があり、PRD 11 の冒頭の決まりがそのまま当たる。初回の S2 には当たる対象がない。区分の定義は data.md の 3 のものを使い、新しい定義は足さない。
- aria-invalid（エラーの間の textarea。design-reviewer の指摘 6 の「直す方向」と designer の判断の違い）：付けない（designer の判断のまま）。枠（size.border.strong、color.error）と `aria-describedby`（補助文とエラーの文）だけにする。
  - 理由：`aria-invalid` は「入れた値がアプリの期待する形に合わない」ことを示す状態。値を検査した結果として付ける（https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid ）。ここのエラーは保存先の失敗（QuotaExceededError）で、答えの値は正しい。付けると、スクリーンリーダーが「無効な入力」と読み、利用者に直す必要のない答えを直させる。エラーの文は `role="alert"` ですぐ読まれ、欄に戻ると `aria-describedby` で読まれるので、赤い枠の意味は文字でも伝わる（WCAG 2.2 SC 1.3.1、1.4.1）。
  - いちばん強い反論：赤い枠は「この欄がエラー」という見た目の状態で、目で見る人と同じ状態を、支援技術はプログラムで受け取れない（describedby は説明で、状態ではない）。reviewer と axe はこの組み合わせを見落としと見る場合がある。
  - それでも選んだ理由：状態として渡すと、意味（値が不正）がずれる。説明の文で渡す方が正しい。見直す条件：axe か G4 の VoiceOver の確認で、エラーの文が欄から読まれないと分かったら。
- この 3 つと D-30 の契約は、自分では合格にしない。reviewer に反論を出してもらう（特に U-15 の区分による違い）。

U-14 を PRD どおりに戻した（指揮役の決定 2026-11-04「求め直さない」。tech-lead）。1 行に 1 つの変更。
- U-14 は指揮役の決定で求め直さない形にした。data.md の 11：`persist()` は保存データで初めて今日の課題を出した後の S3 で 1 回だけ。印 `device.persistRequested: true` は、印がないときに今日の課題（`current`）を作る保存（初回とやり直しの診断を終える、起動時と日付が変わった後と読み込みの後の 6-4）に含める。先に `persisted()` を調べない。結果（`persistGranted`）は書かない。S8 の注意は D-31 のまま（描くたびに `persisted()`、ない・例外なら出さない）。
- 元の契約（fcddc81 の前）との違い：元は「結果が返る」で `persistRequested` と `persistGranted` を別の保存で書いた。印のない「あり」のデータ（前の実装のデータ、印のない seed）の起動では 6-4 の保存と結果の保存で 2 回になり、data.md の 2 の「あり」の起動で最大 1 回と食い違う。非同期の保存は AC-11 の注入（印の後の次の 1 回）とも重なりうる。印を 6-4 などの保存に含め、結果を書かないことで setItem の回数を変えずに PRD の「1 回だけ」を守る。`persistGranted` は読む所がない（S8 は `persisted()`、イベントは記録しない：D6）。
- data.md の 2：表の 3 行（初回とやり直しの診断を終える、起動時の保存）に印を足し、表の下の文を「印は別の保存にしない。結果は保存しない」に直した。11 を書き直した（時機、条件、失敗と削除と読み込みのときの印、結果、理由、失うものと見直す条件、未確認）。PRD との食い違いの項は消した（食い違いがなくなった）。
- data.schema.json：`persistRequested` と `persistGranted` の description を直した（形は変えない。`formatVersion` は 1 のまま）。
- test-hooks.md の W-9：AC-13 の呼ぶ回数（初回の診断を終えた読み込みで 1 回、以後 0 回）、保存の印、印のない seed の扱いを書いた。注入は `persist()` と `persisted()` の両方を false のまま。
- ADR 0002 の「一緒に決めたこと」の persist の項、2 の AC-13 の行、8 の Storage Persist Answered の行、10 の Firefox の未確認を直した。
- いちばん強い反論：Chrome は断った要求を後で評価し直すので、毎日求めれば後で通る人がいる（https://web.dev/articles/persistent-storage ）。1 回だけでは、初回に断られた人は v1 の間ずっと永続にならない。それでも選ぶ理由：PRD と design の D-23 が 1 回で、確認が毎日出るブラウザ（Firefox）を作らない。断られた人には S8 の注意と書き出しがある（AC-13）。見直す条件は data.md の 11。
- 検査：`cd backend && npm run -s check:contracts` → 末尾 `見本 41 件、期待と違う結果 0 件`、終了コード 0（2026-11-04、ajv 8.20.0。description だけの変更なので合否は前と同じ）。

G2 r3 の判定（reviewer のコード r3、tech-lead のテスト r3）の提案と指揮役の決定（2026-11-04、docs/approvals/delegation.md の最後の 2 行）に合わせた（2026-11-04、tech-lead）。1 行に 1 つの変更。
- data.md の 11（S8 の待つ上限）：前は上限がなかった（`persisted()` が返らないと S8 に着けない）。今は「S8 へ移る操作の始めから 1,000 ms で答えが決まらなければ、注意なしで S8 を描き、後から返っても描き直さない」。指揮役の決定どおり。
- data.md の 11（待つ間の操作）：前は「待つ間に別の操作で画面が移ったら、遅れて S8 を描かない」だけで、移らない操作と、前の画面の状態の扱いがなかった（reviewer r3 の要修正：やり直しの S2 で `diagnosis.cancel` の後、待つ間に `diagnosis.next` で TypeError）。今は (1) 前の画面と操作は残す、(2) S8 へ移る操作は S8 を描くまで下書きなどを捨てない（捨てるのは描くとき）、(3) 待つ間に次の操作（`task.dayChanged` を外す操作と同じ範囲）が始まったらその操作を優先し、画面を移さない操作でも遅れて S8 を描かない、(4) もう一度 S8 へ移る操作をしたら後の待ちだけが描く。例に reviewer の再現の手順を書いた。
  - 選ばなかった案：(a) 待つ間は前の画面の操作を止める（`inert` など）。止める仕組みと解く仕組みが要り、1,000 ms の上限があっても「押しても効かない」時間を作る。(b) 下書きの null を onAnswer で見て何もしない。TypeError は消えるが、利用者が押した「次へ」が黙って捨てられ、その後に S8 が描かれる（押した操作が結果を持たない）。(c) をとった：最後に押した操作が効く、というふつうの規則で 1 つにまとまる。
  - いちばん強い反論：`diagnosis.cancel` を押したのに、待つ間の `diagnosis.next` で診断を終えることがある（やめたつもりが保存される）。それでも選ぶ理由：待つ時間は実測 61〜70 ms、上限 1,000 ms で、その間に押すのは「やめる」を取り消して進める意思と読むのが自然。保存されるのは利用者が選んだ回答だけで、壊れたデータは作らない。
- data.md の 11（失敗した保存と `persist()`）：前は「その保存が失敗しても `persist()` は呼びます」の 1 文で、診断を終える保存の失敗（S2 に留まる）でも呼ぶと読めた。今は「呼ぶきっかけは S3 を描いたこと」とし、6-4（起動時、日付の変わり目、読み込みの後）は失敗しても S3 を描くので呼ぶ、診断を終える保存は失敗すると S2 に留まるので呼ばず、再試行が成功して S3 を描いた後に 1 回、と分けた。今の実装（main.js の 278-288、302-312、188 行）の動きと同じで、実装の直しは要らない。
- budgets.md の 1：殻 26,000 → 32,000、アイコンと manifest 10,000 → 4,000（文言 8,000、課題集 106,000、合計 150,000 は不変）。殻を「JS 26,000（ADR 0001 の見直す条件と同じ線）＋ HTML と CSS 6,000」にした。理由と動かさなかった枠は budgets.md の 1 の「枠の見直し」。測った値（`node scripts/build.mjs --out <スクラッチパッド>/dist --version 2026-11-04.1 && node scripts/check-budget.mjs <同>/dist`）：殻 25,794（JS 22,135、CSS 2,794、HTML 865。node の zlib level 9 で拡張子ごとに足した）、文言 6,610、アイコンと manifest 2,173（生：icon-180.png 2,107、manifest 231）、課題集 30,193、合計 64,770、OK。
- budgets.md の 6：アイコンの生の大きさの上限 10,000 → 4,000、単体テストの確かめも 4,000 にした（1 の枠と合わせる）。今の icon-180.png（2,107）は通る。
- test-hooks.md の W-6：`DESIGN_<design の番号>_` の接頭辞を 1 行足した（AC にない design の状態だけのテスト。AC のループに足さず、G3 の AC の表に混ぜない。`BUDGET2_` と同じ扱い。tech-lead r3 の提案 4）。
- test-hooks.md の W-9：「保存データの印」の読み方（`page.evaluate` で `localStorage.getItem('kyounoitte:data')` を 1 回読み、テスト側で JSON.parse。setItem と removeItem はしない。data.schema.json に通してよい）と、S8 の待つ上限を確かめるときの `persisted()` の注入（返らない約束、遅らせた約束）を足した。
- 検査：`cd backend && npm run -s check:contracts` → 末尾 `見本 41 件、期待と違う結果 0 件`、終了コード 0（2026-11-04。スキーマと見本は変えていない）。
- 自分では合格にしない。reviewer に反論を出してもらう（特に待つ間の操作を優先する (c) と、アイコンの上限を下げたこと）。

PRD r10 と design r8 に合わせた書き直し（2026-11-05、tech-lead。G1 tech-lead r2 の 3 の (m)(n) と 4、5）：
- 見出し、1（目標を 40 件の AC と 1 秒に、非目標に連続記録と演出のライブラリ）、1.1 を足した（同じ日に続ける、修了と進級、解説、累計と節目、今週、n / N、演出、`never`、ID の付け替え、予算の割り直し、JS のファイルは 13 個のまま）。
- 2：AC-4、5、7、8、10、14、24、26 を PRD r10 に直し、AC-33〜AC-40 を足した（40 行）。
- 4：契約の一覧を r8 の中身にし、check-schemas の出力を 2026-11-05 の 52 件に差し替えた。エラーの表に `task.dayChanged` を足した。
- 5：r8 の形の変更、大きさの上限（252 行）、古いデータの削除の手当てを足した。
- 6：反応に AC-33、転送量に新しい枠、JS のファイル、動き、タイマーの行（今の 3 か所を grep で数えた）を足した。
- 7：新しい境界なしの 1 行を足した。8：Task Continued、Level Completed、Level Advanced を足した（16 件）。9：r8 の依存の変更なし。10：ADR 0002 と 0003 の改訂、未確認の項目を r8 に合わせた。
- 自分では合格にしない。reviewer に反論を出してもらう（特に ADR 0002 の (e)：公開前に版 1 のまま ID の意味を変えること）。

G1 reviewer r2 の要修正 3 件と提案の直し（2026-11-05、tech-lead。docs/reviews/001-daily-learning-G1-reviewer-r2.md）：
- 冒頭：PRD r11、design r9 にした。2 の AC-26 の行と 4 の表：差し込みを 26 キーにした。4：check-schemas の出力を取り直して貼った（差し込み 26 個、見本 52 件、0 件、終了コード 0）。
- test-hooks.md の W-7 の AC-14 の 2 通り目を PRD r11 に合わせた（やり直し → S3 のまま → 完了 → `task.next` → 同じ日に新しい領域の S3、`data-task-nth-today` は 2）。6-2 と 6-3 の参照も今の順に直した。
- ADR 0002：(e) の手当てを、使ったすべてのブラウザとホーム画面の Web アプリでの削除と、書き出しファイルでの確かめにした。検討した案に (h) と (e) との比較を足した。ID の固定テストを G4 の reviewer の確認項目にした。
- contracts/README.md の 146 を 174 に、identifiers.md の 3 の radio に `area.*.desc` を足した。CLAUDE.md の見本の件数に今の 52 件を添えた。
- 自分では合格にしない。reviewer に反論を出してもらう（特に (e) と (h) の比較）。
