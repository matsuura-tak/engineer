# 001-daily-learning G1 reviewer r2（観点：設計。27509e4...79e33f3）

PASS

## 指摘

- 要修正、/Users/takumamatsuura/src/engineer/contracts/test-hooks.md:81-86（W-7 の AC-14）：2 通り目の手順が PRD r11 の AC-14 と食い違う。W-7 は「（PRD r7 の AC-14 の確かめ方）… 翌日（例 2026-11-05）に固定して開く：4 の 6-1 で前日の課題が none の行に移り、6-4 で新しい diagnosis.area の課題が出る」と書くが、PRD r11 の AC-14 2 通り目の Then は「その課題を完了して「次の一手に進む」を押すと、同じ日のうちに task.today の data-task-area が新しく選んだ領域と一致する」（docs/prd/001-daily-learning.md:295）。data.md 2（やり直しの行き先）と設計メモ 2 の AC-14 行は PRD どおりなので契約の中身で AC は満たせるが、verifier が W-7 から seed と手順を写すと 2 通り目の Then を確かめないテストになる。`git blame` ではこの 6 行は 6f6ff8e5（2026-11-01、BASE より前）だが、PRD の変更（r8）はこの差分の範囲なので既存扱いにしない。直す方向：W-7 の 2 通り目を「やり直し → S3 のまま（同じ data-task-id）→ 完了 → task.next → 同じ日に新しい領域の S3、nth-today は 2」に書き直し、「PRD r7」の参照を r11 にする。
- 要修正、/Users/takumamatsuura/src/engineer/docs/adr/features/001-daily-learning.md:4（冒頭）、:56（AC-26 行）、:108（4 の表）、:175（貼った出力の末尾）、/Users/takumamatsuura/src/engineer/contracts/README.md:10：文書の更新漏れ。設計メモは「design r8、PRD r10、差し込み 25 キー」のまま。HEAD の契約は design r9 に追従して差し込みは 26 キー（`task.next.note.last` に `{area}`、`{level}`。strings.md:10 と、自分で動かした check-schemas の末尾「差し込みのあるキー 26 個」）。最後のコミット 79e33f3 は contracts/ の 12 件だけを変え、設計メモは 0a392ce 以降触られていない。contracts/README.md は「146 個のキー」のまま（174 が正）。直す方向：設計メモの冒頭を design r9・PRD r11、AC-26 行と 4 の表を 26 キーにし、check-schemas の出力を貼り直す。README の 146 を 174 に。
- 要修正、/Users/takumamatsuura/src/engineer/docs/adr/0002-storage-localstorage-single-key.md:60（(e) の手当て）：「Takuma には、確認用のブラウザで一度、設定の「すべてのデータを削除」を押してもらう」が単数で、保存の置き場所が複数ある前提を書いていない。PRD E-7（docs/prd/001-daily-learning.md:29）は「ホーム画面に追加した Web アプリは … Safari と保存を共有しない」とし、G3 では iOS Safari とホーム画面、Mac の Safari と Chrome で確かめている可能性がある。古い意味の版 1 データが残ったブラウザでは、新しい初級 `*-beginner-001〜007` が「出した扱い」（AC-6）になり n / N と累計がずれる（止まらない。ADR 自身が (d) を退けた理由と同じ種類の危険）。直す方向：手当てを「G3 の前に、使ったすべてのブラウザとホーム画面の Web アプリで削除。確かめは S8 の書き出しファイルに `*-beginner-*` の行がないこと」の形にし、指揮役が docs/progress.md の G3 の前提に書く。(e) 自体は、未公開（自分の `curl -sI` でも 404）で PRD 6 の実現性（保存）の行が「公開前なので変えられる」と認めているので、重大にしない。
- 提案、docs/adr/0002-storage-localstorage-single-key.md:47-52：検討した案に「(h) formatVersion を 2 に上げ、版 1 は未公開の試作として読まず S0 error（exportRaw と削除）にする（対応表を持たない）」がない。(f) の「ずっと残る処理」を避けつつ、手元の古いデータを黙って読み替えず止められる案で、(e) との比較を 1 行書くと反論への答えが強くなる。採る必要はない。
- 提案、docs/adr/0002-storage-localstorage-single-key.md:69：ID を固定する単体テストを「公開の日の前の最後のビルドで作る」としているが、関門に結び付いていない。G4 か G5 の合格条件（reviewer の確認項目）に「固定テストがある」を入れると忘れにくい。
- 提案、contracts/identifiers.md:39：radio の説明の行が「`level.*.desc` はラベルの中の説明の要素に付けます」だけで、`area.*.desc`（AC-39、design 9「S2 の radio：選択肢の名前とヒント文（area.*.desc、level.*.desc）は同じ label の中」）に触れていない。同じ文に `area.*.desc` を足す。
- 提案（既存）、contracts/data.md:66（4 の 6-3）：今日の最後の行の `report` が `none` のとき S6（`task.skipped`）になる。アプリは `none` の行を前日の日付でしか書かないので通常は起きないが、端末の時計を戻した後や手で作ったファイルでは起きる。8 の「守られていなくても止まらずに動く」の範囲なので判定に数えない。
- 提案（範囲外、designer）、design/001-daily-learning.md:84（2 の AC-12 行）：PRD r11 の AC-12 の When は AC-33（次の一手に進む）を含むが、design 2 の AC-12 行は「AC-1、AC-2、AC-5、AC-7、AC-9」のまま。契約側は W-12 で操作を限定していないので AC は満たせる。

## 証拠
- 対象：27509e4...79e33f3、観点「設計」（契約と ADR で PRD r11 の AC-1〜AC-40 を満たせるか）。`git diff --name-only 27509e4...79e33f3 -- contracts/ docs/adr/ CLAUDE.md`（42 件。全件読んだ：[x]）
  - [x] CLAUDE.md（diff）
  - [x] contracts/budgets.md、data.md、identifiers.md、strings.md、test-hooks.md（全文）、contracts/tools/check-schemas.mjs（全文と diff）
  - [x] contracts/schemas/data.schema.json、tasks.schema.json（diff）、strings.schema.json（node で required 174、properties 174、additionalProperties false、差し込み pattern 26 キーを数えた）
  - [x] contracts/fixtures/data/invalid-unknown-years.json、data/v1/valid-same-day-rows-never.json、seeds/seed-ac24-stats.json、seed-ac35-six-completed.json、seed-ac36-three-issued.json、seed-ac8-intermediate-same-day.json（中身を dump。seed-ac35 は check-schemas の結果で）
  - [x] contracts/fixtures/strings/ 9 件、tasks/ 15 件（check-schemas を自分で動かし、期待どおりの 52 件に含まれる。valid-ja / valid-en は design 7 の表と全 174 キーの文を node で比べて差 0）
  - [x] docs/adr/0002-storage-localstorage-single-key.md（全文）、0003-service-worker-update.md（diff）、docs/adr/features/001-daily-learning.md（全文）
  - あわせて読んだ：docs/prd/001-daily-learning.md（r11、全文）、design/001-daily-learning.md（r9 の冒頭、2、7、10、D-30、D-40、D-43、D-44、11 の r9 の行）、docs/approvals/delegation.md の 2026-11-05 の行、docs/org/gates.md、docs/templates/review-report.md
- 観点の表 1：AC 対応表（operationId はすべて「なし（端末のみ）」。「確かめ」は自分で読んで突き合わせた結果）

| AC | 契約（ファイル:項目） | データ | 確かめ |
|---|---|---|---|
| 1 | identifiers.md 4 `data-question-index/-total`、test-hooks「時間の計り方」 | — | 区間の表に 3 区間と上限 500 ms |
| 2 | data.md 5、identifiers.md 4 `data-task-area/-level` | diagnosis、levels | 組＝diagnosis.area と levels[a]（なければ diagnosis.level） |
| 3 | tasks.schema.json（4 要素 `\S`、minutes 1〜15） | tasks.json | invalid-blank-goal、invalid-minutes-16 が落ちる（自分の実行） |
| 4 | test-hooks W-6（210 / 組 14・14・7 / ID 重複 0）、budgets.md 2 | tasks.json | W-6 の数字が PRD r11 と一致。予算は `BUDGET2_` で別 |
| 5 | data.md 2（申告で current を外し done の行）、4 の 6-2/6-3 | history、current | 再読み込み：current なし → 6-3 で最後の行 done → S5。issued は行数+current なので不変 |
| 6 | data.md 4 の 6-1、5（候補は history と current にない ID） | history | — |
| 7 | data.md 2、4 の 6-3、identifiers.md 4 `data-report` | history | 6-3 で最後の行が done 以外 → S6 |
| 8 | data.md 5（規則 1〜4、10 通り目の手順）、seeds/seed-ac8-* 4 件 | levels、history[].level | 10 通り目を規則で追った：too_hard→（too_hard,done）不変→next→中 002→too_hard→（too_hard,too_hard）→beginner→next→beginner。seed は中・11-02 done 1 行で PRD の Given と一致 |
| 9 | data.md 2（helpful）、identifiers.md 4 `data-helpful` | history[].helpful | — |
| 10 | data.md 4「操作で出すとき」「S7 を再読み込みしたとき」、5「S7 の変種」、2 の advance 行 | levels、current | 翌日読み込み→6-4 で選べず S7。advance は levels+current を 1 回。同じ組を選び直すと選べず S7 |
| 11 | data.md 2（なし・診断の途中の起動で setItem 0 回）、W-9 | — | — |
| 12 | W-12、W-13、budgets.md 3 `connect-src 'self'` | — | W-12 は操作を限定しないので AC-33 の操作も数えられる |
| 13 | data.md 11、W-9（persist と persisted の両方） | device.persistRequested | task.next と advance の保存にも印を含める（setItem 1 回のまま） |
| 14 | data.md 2（やり直しの行き先 2 項）、4「操作で出すとき」、W-7 | diagnosis、levels、current | 1 通り目：今日の current なし→新しい組から選び S3。2 通り目：current そのまま→申告→next→新しい組。W-7 の 2 通り目の手順だけ PRD r11 とずれる（要修正 1） |
| 15 | identifiers.md 1 `data-debug-load-ms`、W-11、budgets.md 1 と 4 | — | — |
| 16 | data.md 7（removeItem だけ） | — | — |
| 17 | strings.md 5（pre なし）、tasks.schema の ``` 禁止 | — | invalid-code-fence が落ちる |
| 18 | identifiers.md 3、test-hooks「キーボードの移動キー」 | — | — |
| 19 | data.schema.json（device を除く）、data.md 7 | 全体 | — |
| 20 | data.md 7 の読み込み 1〜5、W-3（同じ日付） | 全体 | — |
| 21 | W-16、data.md 2（device だけの保存。firstOpenDate なし） | device.homeGuideClosed | valid-guide-closed-only が通る |
| 22 | W-16、data.md 3 | — | — |
| 23 | service-worker.md、W-12、W-13 | — | — |
| 24 | data.md 9（11 値）、identifiers.md 4、seeds/seed-ac24-stats.json | history | seed から data.md 9 の数え方で自分で計算：issued 6、completed 4、firstDay true、7d 3、week 2（月曜 11-02）、extra 1、helpful 2、rated 2、tooHard 1、noTime 1 → PRD の Then と全部一致 |
| 25 | data.md 6（版を先に見る）、invalid-newer-version | formatVersion | 落ちる（自分の実行） |
| 26 | strings.schema.json（174 required、他を拒む）、strings.md 2 | ja/en | required 174＝design 7 の 174 行＝identifiers.md 6 の 174 個（node で差 0） |
| 27 | dependencies.md（@axe-core/playwright） | — | r8 で依存の変更なし（設計メモ 9） |
| 28 | service-worker.md、`data-build-version`、test-hooks「AC-28」 | — | — |
| 29 | tasks.schema.json（mode、tools、URL）、W-6（20%） | tasks.json | invalid-in-app-url、invalid-external-no-tools が落ちる |
| 30 | identifiers.md 4 `data-task-mode`、3 `task.external.*` | — | — |
| 31 | test-hooks「AC-31 の重なる要素」 | — | — |
| 32 | data.md 2（300 ms、pagehide）、4 の 6-1 と「日付が変わったとき」の手順 1 | current.answer | 前日の答えは none の行に、新しい current.answer は空 |
| 33 | data.md 2（task.next 1 回）、4「操作で出すとき」、8（同じ日付の行）、9（nth）、時間の計り方（task.next → task.today、1,000 ms） | current、history | 再読み込み：6-2 を 6-3 より先に見るので同じ data-task-id の S3。check-schemas の順序検査は `<` に緩めてあり valid-same-day-rows-never（同じ日 2 行＋current）が通る |
| 34 | strings.md 7.2、check-schemas の AC34_WORDS / AC34_TOOLS、W-6 | tasks.json | 語と空白の除き方が PRD の Then と同じ |
| 35 | data.md 9（累計、祝い）、identifiers.md 3・4（`task.cheer` の `data-milestone`、`task.total.value`）、strings.md 7.1、seed-ac35、「完了の演出の確かめ方」 | history | S4 は申告後の値なので 6→7。語の検査：check-schemas の AC35_JA/EN が valid-ja/en に通った |
| 36 | identifiers.md 4 `data-progress-*`、data.md 9、seed-ac36 | history | seed は 001〜003（done、too_hard、none）→ 11-04 に 004、index 3+1=4、total 14 |
| 37 | data.md 9（days-completed-week、extra-completed）、`task.week` | history | AC-24 seed から next→完了で week 3（11-03、04、06）、extra は 11-06 の done が 1 件なので 1 のまま。11-09 は 0 |
| 38 | tasks.schema.json `insight`（必須、1〜120、改行・バッククォート禁止）、identifiers.md 3（S4、S5 だけ）、data.md 5 末尾 | tasks.json | invalid-insight-{missing,too-long,newline,backtick} が落ち、valid-insight-120-codepoints が通る |
| 39 | strings.schema.json の `area.*.desc` 6 キー、identifiers.md 6 | ja/en | 6 キーが required にある |
| 40 | data.schema.json years に `never`（先頭）、identifiers.md 5、invalid-unknown-years | diagnosis.years | 通る／落ちる（自分の実行） |

- 観点の表 2：エンドポイントの表（読み替え：信頼の境界を越える入口）

| 入口 | 誰が | 確かめること | 返す・書くもの | 上限 |
|---|---|---|---|---|
| localStorage `kyounoitte:data` の読み（起動、日付の変わり目） | 本人のブラウザ（同 origin の他ページも読める：ADR 0005 で受け入れ） | JSON.parse → formatVersion → スキーマ全体（部分は読まない）data.md 6 | 画面の状態 | history maxItems 20,000、答え 2,000 字 |
| 書き出しファイルの読み込み（S8、S1） | 利用者が選んだファイル（信頼しない） | 5,000,000 バイト → 版 → スキーマ → 「なし」の中身は拒む → 置き換え確認 data.md 7 | device を残して 1 回の setItem | 5,000,000 バイト |
| 課題集 tasks.json、文言 ja/en.json（fetch、同 origin） | 配布物（SW 経由） | tasks.schema / strings.schema（ビルドと受け入れテストで検査。画面は textContent だけ） | — | 予算 105,000 / 9,000 |
| 保存（setItem） | アプリだけ | 1 回の保存＝1 回の setItem。task.next、advance、申告、やり直しの各行（data.md 2 の表） | — | QuotaExceeded は error.storage.* |
| テストのつなぎ口 | Playwright の側だけ | アプリ側は読み取り専用の印（data-*）とスキーマのみ。時間の計り方は page.evaluate の listener、演出は getAnimations/reducedMotion、W-7 は addInitScript | — | `grep -rnE "__test|[?&](reset|now|seed)=|location\.search" backend/public` が 0 件（G2 で reviewer） |

- 観点の表 3：元に戻しにくい判断と、いちばん強い反論

| 判断 | 自分で出した反論 | ADR の答え／移行の手順 | 判定 |
|---|---|---|---|
| ADR 0002 (e)：公開前に版 1 のまま課題 ID の意味を付け替え | 版 1 のまま意味を変えると、手元の古いデータは「読めない」でなく「黙って読み替わる」。手当てが人の操作（削除）1 つで、しかも置き場所は複数（E-7：ホーム画面は Safari と別） | 未公開（自分の curl も 404）、見本は作り直し済み（52 件）、公開時点で ID 固定テスト、公開後は (f)。削除の手当ては単数で書かれている | 要修正 3 で手当ての範囲を直す。重大ではない（失う利用者が 0 人、PRD 6 が公開前の変更を認める） |
| 同じ日に複数の行（data.md 8 の撤廃、6-2/6-3 の入れ替え） | 今日の行と今日の current が同時にあるとき、古い順で見ると S3 が S5 に化ける。また古い current と今日の行が同時にあり得るか | 6-2 を先に見る理由が書いてある。古い current と今日の行は、行が current の申告か 6-1 の移しでしか生まれず、current は 1 つなので同時に生まれない（自分で追った） | 矛盾なし。1 回の保存＝1 回の setItem は各操作の行で守られる |
| 予算の割り直し（文言 9,000、課題集 105,000、平均 480） | 文言の余りが 1,000 弱（10%）で、次の文言追加で枠を超える | budgets.md 1 に「殻の枠を超えそうなら文言の余りを移す。課題集から取らない」。480 は直線補間の［推測］と明記し、本当の歯止めは gzip のテスト | 妥当。自分で測った valid-ja/en の gzip（詰めて level 9）は 4,301 + 3,698 = 7,999（契約の 7,997 と 2 バイト差、整形の違い） |
| 控えめな演出（Safari 17 対応） | WebKit 27.2 は Safari 17 ではない | budgets.md 5 に MDN BCD の版と、効かないときの代わり（実長 18 / 66）。実機は G4 | BCD を自分で開いて一致を確認（下の URL） |

- 実行したコマンドと結果：
  - `cd backend && npm run -s check:contracts` → 末尾 `strings/valid-ja.json と valid-en.json の差し込みの名前がすべてのキーでそろう（差し込みのあるキー 26 個）` / `見本 52 件、期待と違う結果 0 件` / `exit=0`（2026-11-05。全行は設計メモ 4 の貼り付けと同じだが差し込みが 26）
  - node で strings.schema.json：`required: 174 properties: 174 additionalProperties: false`、差し込み pattern 26 キー（一覧は strings.md 3 の表と同じ）。design 7 の表（174 行）と valid-ja / valid-en の文：`ja text differs: 0`、`en text differs: 0`。identifiers.md 6 のキー 174 とスキーマの差 0
  - node で seed-ac24-stats.json から data.md 9 の数え方：`{"issued":6,"completed":4,"firstDay":true,"d7":3,"week":2,"monday":"2026-11-02","extra":1,"helpful":2,"rated":2,"tooHard":1,"noTime":1}`
  - node で文言の gzip（JSON.stringify で詰めて level 9）：`ja 4301 en 3698 sum 7999`
  - `git log --oneline 27509e4..79e33f3`（21 件）、`git show --stat 79e33f3`（contracts/ の 12 件のみ）、`git log -1 -- docs/adr/features/001-daily-learning.md` → 0a392ce 2026-11-05
  - `git blame -L 81,86 contracts/test-hooks.md` → 6f6ff8e5 2026-11-01（BASE 27509e4 は 2026-11-04）
  - `ls backend/public/js | wc -l` → 12、sw.js あり（設計メモ 6 の「13 個」と一致）
  - `curl -sI https://matsuura-tak.github.io/engineer/` → `HTTP/2 404`、`server: GitHub.com`（2026-11-05 08:47 UTC。HEAD だけで、リポジトリの中身は送っていない）
- 開いた URL と確認した日付（2026-11-05）：
  - https://raw.githubusercontent.com/mdn/browser-compat-data/main/svg/elements/path.json → `svg.elements.path.pathLength.__compat`：chrome "50"、safari "14"、safari_ios "mirror"（budgets.md 5 の表と一致）
  - https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/at-rules/media.json → `prefers-reduced-motion`：chrome "74"、safari "10.1"、safari_ios "mirror"（一致）
  - https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/pathLength と …/@media/prefers-reduced-motion：互換表は本文に取れず、上の BCD で代えた
- 未検証：なし（Safari 17 の実機での演出の見た目は設計メモ 10 と budgets.md 5 のとおり G4 の項目で、G1 の確かめの対象ではない）

## 記録
- 関門：G1
- 判定した役：reviewer（設計）
- 回：r2（r1 は docs/reviews/001-daily-learning-G1-reviewer-r1.md。FB 1 回目後の作り直しの G1 では 1 回目）
- 対象：feat/001-daily-learning、27509e4...79e33f3（contracts/、docs/adr/、CLAUDE.md。あわせて PRD r11、design r9）
- 日付：2026-11-05
