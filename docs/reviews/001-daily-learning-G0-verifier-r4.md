# 001-daily-learning G0 verifier r4（PRD r8、コミット 967aca1）

PASS

## 指摘
重大はなし。40 件すべてに Given / When / Then / 確かめ方 / 効く機会があり（各 40 件）、11 章（176〜454 行）に測れない言葉は 0 件。変えた AC と新しい AC（16 件）の Then はすべて状態の名前、文言キー、data 属性の値、件数、ミリ秒で書かれていて、合否を決められる。G1 の前に 1 行ずつで直してほしい「要修正」が 4 件、提案が 9 件。

- 要修正、docs/prd/001-daily-learning.md:352-354（AC-24）と :430-433（AC-37）、seed の食い違い。AC-24 の Given は「出した 6 件 = 完了 4 + 難しすぎ 1 + 今日はできない 1」で、2026-11-06 に開いて `issued` が 6 のままであるには、11-06 の行が履歴になければならない（なければ起動時に今日の課題が出て 7 になる。contracts/data.md 4 の 6-4、test-hooks.md W-7「AC-24 の seed は 11-06 の行を入れる」。今の見本 fixtures/seeds/seed-ac24-stats.json も 11-06 の行を持つ）。完了は 11-01、11-03、11-04 ×2 なので、11-06 の行は「難しすぎ」か「今日はできない」になり、開くと `task.skipped`。すると AC-37 の When「今日の課題を完了する」は、そのままでは押せない（先に「次の一手に進む」が要る）。直す方向（どちらか）：(a) AC-24 の Given に「難しすぎは 11-02、今日はできないは 11-06」と日付を書き、AC-37 の When を「『次の一手に進む』を押してから、出た課題を完了する」にする。(b) AC-24 の seed に `current`（11-06、未申告）を入れて 6 件目とし（`issued` は `history` + `current`。data.md 9）、申告の行を 5 件に減らすか件数を 7 に直す。推奨は (a)（AC-37 が「同じ日の 2 件目」の経路も兼ねる）。
- 要修正、:418-421（AC-35）、語の検査の範囲。「`task.rate`、`task.done`、`task.skipped`、`task.exhausted`、`task.today`、`settings.stats` の文言に…0 件」は、文言ファイルが平らなキー（strings.md 1）なので「どのキーが どの画面の文言か」が決まらない（`task.today` には `area.*`、`level.*`、`task.report.*` も出る）。確かめ方は「ja と en の文言ファイルを読む」なので、範囲を「ja.json と en.json の全キーの値（課題集の本文と解説は含めない）」と書き、照合を「部分一致」と明記してほしい（「途切れ」は「途切れない」にも当たる。それでよいなら 10 章の意図どおり）。en は `missed` が `dismissed` に当たるので、単語の境界（`\bmissed\b`、`\bstreak\b`）で数えると書くと誤検知がない。今の ja.json と en.json は 5 語とも 0 件（grep、終了コード 1）。
- 要修正、:433（AC-37）、「先週の日数は画面に出ない」が観察できる結果でない。`data-stat-days-completed-week` が 0 であることは確かめられるが、「出ない」は要素の名前がないと数えられない。削るか、「`task.done` と `settings.stats` に先週の日数を出す要素（識別子）は置かない」のように識別子の有無で書く。
- 要修正、:212（11 冒頭のつなぎ口の段落）と :418（AC-35）、累計と祝いの要素の識別子。「完了後の画面の累計（`data-stat-completed` と同じ値を持つ要素）」と「文言キー `task.done.cheer`」は、identifiers.md にまだない。さらに「節目（7、30、100）の文言はそれ以外と異なる」は、1 つのキー `task.done.cheer` では表せない（strings.md 3 の差し込みは `{name}` と plural だけ。節目で文を変えるには別のキーか select が要る）。PRD の側では「節目のキーは designer が決め、tech-lead が identifiers.md に書く」と 1 行足し、G1 で確定してほしい（テストは要素の識別子で探すので、名前が決まらないと書けない）。

提案（直すかは pdm に任せる。合否は決まる）：
- 提案、:256-260（AC-8）。10 通り目は 2 件とも画面で申告するので、Given「直近の 1 件を除く申告の履歴を seed で投入」と合わない。10 通り目の seed を「段階『中』、履歴は完了 1 件」のように書くと迷わない。
- 提案、:412-415（AC-34）。語の照合で「自分の API」の空白の扱い（「自分のAPI」も数えるか）。今の課題集は空白ありで書かれている（`自分の API` 3 件）が、新しい 84 件で揺れるので「空白を除いて比べる」と書くと安全。参考：今の初級 42 件は、語が当たる 7 件、11 分以上 10 件、`external` 2 件（道具に「ターミナル」）で、書き直し前は AC-34 が落ちる（正しい赤）。
- 提案、:424-427（AC-36）。「出し終えた件数」に `report` が none の行（申告のないまま日付が変わった）を含むかを 1 語で決める（「出した」なら含む）。
- 提案、:436-439（AC-38）。`insight` の字数の単位（コードポイント。tasks.schema の `maxLength` と同じ）と、改行とバッククォートを含めないこと（画面の文字列と等しいかを比べるため）。
- 提案、:442-445（AC-39）。40 文字の単位（コードポイント）。幅 320 の確認は `diagnosis.question` の 1 問目で行うので、AC-17 の 4 状態とは別に AC-39 のテストで数えると書く。
- 提案、:448-451（AC-40）。「Q13 で B なら外す」の条件付きの AC は、G1 の前に指揮役が決める（委任）。B なら AC の数が 39 になるので、承認の記録に残す。
- 提案、:268-272（AC-10）。「別の領域を選ぶ」は今の `task.exhausted.redo` と同じ操作でよいか（同じなら識別子を変えずに済む）。AC-27 の監査の `task.exhausted` は levelDone と allDone の 2 変種があるので、両方を監査の対象にすると書くとよい（数秒）。
- 提案、:406-409（AC-33）。1 秒は契約「時間の計り方」の表に「次の一手に進む → 課題」（始点 `task.next`、終点 `data-state=task.today`、1,000 ms）を足せば今の仕掛けで計れる。tech-lead へ。
- 提案、:145-175（10 章）、:232（AC-4）。同じ日に複数の行を持つ形は contracts/data.md 8「同じ日付の行は 1 つまで」と check-schemas.mjs（41、44 行）と衝突する。PRD はすでに「tech-lead が formatVersion の扱いを ADR に決める」と書いているので、G1 の tech-lead の入力として明示する。

## 証拠
- 対象：feat/001-daily-learning、`git diff 0ff6a82 967aca1 -- docs/prd/`（001-daily-learning.md 470 行変更、product.md 50 行変更）。読んだ印：docs/prd/001-daily-learning.md（全 580 行。11〜15、18 は全文、1〜10 は 9 と 10 を全文）[x]、docs/prd/product.md（r4 の差分）[x]、docs/approvals/001-daily-learning-FB1.md [x]、docs/reviews/001-daily-learning-G0-verifier-r3.md [x]、contracts/test-hooks.md（全文）[x]、contracts/identifiers.md（全文）[x]、contracts/data.md（2〜9）[x]、contracts/strings.md [x]、contracts/schemas/tasks.schema.json、data.schema.json（history、formatVersion）[x]、contracts/fixtures/seeds/seed-ac24-stats.json [x]、docs/verification/001-daily-learning/test-plan.md（2 章、7 章、10 章）[x]、backend/tests/acceptance/（テスト名の一覧、seeds/、helpers/app.mjs の export）[x]、docs/org/gates.md（G0）[x]、docs/templates/review-report.md [x]。実装コード（backend/public/）は開いていない（tasks.json と i18n の JSON はデータとして grep しただけ）。

### 観点 1：変えた AC と新しい AC（16 件）のテストできるか
| AC | 判定 | 根拠（Then の値）と、要るつなぎ口 |
|---|---|---|
| AC-4 | できる | 210 以上、初級・中級 12 組 ≥ 14、上級 6 組 ≥ 7、重複 0。今の 126 件は落ちる（正しい赤）。BUDGET2 の上限は tech-lead が見直す（W-6） |
| AC-5 | できる | `task.rate` → `task.done`、再読み込みで `task.done`、`data-stat-issued` が前後で同じ。契約 data.md 4 の 6-2 のまま |
| AC-7 | できる | 3 通り。`task.skipped`、`data-report`、再読み込みで同じ、`issued` 不変 |
| AC-8 | できる | 1〜9 通り目は値も手順も r7 と同じ（When の語だけ）。10 通り目は「中」で同じ日に too_hard → next → too_hard → next → `beginner`。契約 data.md 5-4「翌日から効く」の改訂が要る（H-2） |
| AC-10 | できる | 初（14 件出し終え）と上（7 件）× 翌日 / 同日 next の 4 本。`task.exhausted.levelDone` / `.allDone`、advance 1 件 / 0 件、advance 後に `data-task-level` = intermediate で area 不変。識別子は H-1 |
| AC-12 | できる | (a) に AC-33 の next を足す。送信 0 件は W-12 のまま |
| AC-14 | できる | 2 通り目：S3 でやり直し → 同じ `data-task-id` → 完了 → next → 新しい area。契約 data.md 2「翌日の 6-4 から効く」の改訂が要る（H-2） |
| AC-24 | 条件つき | 11 の値はすべて決まる（issued 6、completed 4、7d 3、week 2、extra 1、helpful 2、rated 2、too-hard 1、no-time 1、true、11-01）。要修正 1（11-06 の行）の決着が要る。新しい属性 2 つは H-1 |
| AC-33 | できる | `task.done` / `task.skipped` からの 2 通り。1 秒は契約の表に行を足す。`data-task-nth-today` 2 → 3、`issued` +1、再読み込みで同じ ID、`role=dialog` 0 件。再読み込みで S3 に戻るには data.md 4 の 6-2 の改訂が要る（H-2） |
| AC-34 | できる | level=beginner の全件で minutes ≤ 10、4 要素 + insight に 6 語が 0 件、external の tools が「ブラウザ」か「開発者ツール」を含む。用語の説明は指揮役の手作業と明記されている（自動の範囲外として正しい） |
| AC-35 | 条件つき | 6→7、29→30、99→100、10→11 の 4 seed。累計の要素と `task.done.cheer` の識別子（要修正 4）、語の範囲（要修正 2）の決着が要る |
| AC-36 | できる | 3 件出し終えた seed → 翌日 → `data-progress-index` 4、`data-progress-total` 14、同じ数字が文字で見える |
| AC-37 | 条件つき | 完了後に week 3、11-09 に開いて 0。要修正 1 と 3 の決着が要る |
| AC-38 | できる | JSON：全件 insight 1〜120。画面：S3 で `task.insight.text` 0 件、S4 と S5 で insight の文字列、S6 で 0 件 |
| AC-39 | できる | `area.<ID>.desc` 6 件が見え、ja / en で 1〜40 字、幅 320 で `scrollWidth` ≤ 320 |
| AC-40 | できる | 3 問目の radio 5 件、`value` に未経験の ID、書き出しの `diagnosis.years` がその ID。ID と enum は H-2 |

できる 13、条件つき 3（AC-24、AC-35、AC-37。いずれも上の要修正で決まる）、できない 0。空（AC-10）、エラー（AC-11、25）、オフライン（AC-12、23）、権限（AC-13）、言語（AC-26）、大きい文字（AC-17、39）、キーボード（AC-18）、監査（AC-27）の AC は r7 から変わらずある。

### 観点 2：新しく要るつなぎ口（今の contracts/test-hooks.md で足りるもの／足りないもの）
足りる：W-1（新しいコンテキスト）、W-3（時刻の固定。同じ日の操作は固定したまま）、W-7 の入れ方、W-8、W-9、W-12、W-13、W-14（語の検査は i18n の JSON を読む）、「時間の計り方」の仕掛け（始点の testid を足すだけ）。
足りない（G1 で tech-lead が contracts/ に書くもの）：
| # | 何 | 案 | 使う AC |
|---|---|---|---|
| H-1 | 識別子（identifiers.md 3、4、6） | testid：`task.next`（S5、S6）、`task.exhausted.advance`、`task.exhausted.levelDone`、`task.exhausted.allDone`、`task.done.cheer`（節目のキーも）、`task.insight.text`、累計の要素（例 `task.done.total`。`data-stat-completed` を持つ）、今週の要素（例 `task.done.week`。`data-stat-days-completed-week` を持つ）、`area.<ID>.desc` ×6、`years.<未経験の ID>`、`settings.stats.extraCompleted(.value)`、`settings.stats.daysCompletedWeek(.value)`。属性：`task.today` に `data-task-nth-today`、`data-progress-index`、`data-progress-total`。S9 に `data-stat-extra-completed`、`data-stat-days-completed-week`。strings.schema.json の required に新しいキー | AC-10、33、35〜40、24 |
| H-2 | 保存の形と起動の判定（data.md 2、4、5、8、check-schemas.mjs、data.schema.json） | 同じ日に複数の行（8 の「1 つまで」と tools の 41・44 行を外す）、`formatVersion` の扱い（ADR）、4 の 6-2（今日の done 行 + 今日の `current` → S3）、5-4（段階は次に出す課題から）、2（やり直しは次に出す課題から。S5/S6/S7 からのやり直しは同じ日に出す）、9 に extra-completed と days-completed-week の数え方、`years` の enum に未経験の ID（identifiers.md 5 と data.schema） | AC-8、10、14、24、33、35、37、40 |
| H-3 | 課題集（tasks.schema.json、budgets.md 2） | `insight`（必須、1〜120、改行なし）、BUDGET2 の上限（210 件 + 解説） | AC-4、34、38 |
| H-4 | 時間の計り方の表 | 「次の一手に進む → 課題」：始点 `task.next`、終点 `data-state=task.today`、1,000 ms | AC-33、12 |
| H-5 | seed の見本（fixtures/seeds/） | AC-24 の新しい seed（11-04 ×2 と 11-06 の行。要修正 1 の決着どおり）、AC-8 の 10 通り目、AC-35 の 4 通り（done 6、29、99、10）、AC-36（14 件の組で 3 件出し終え）、AC-10 の初と上（本番の課題集から動的に作る。固定の見本は不要） | AC-8、10、24、35、36、37 |
| H-6 | 語の検査の決まり（strings.md か test-hooks.md） | AC-35 の 5 語と範囲（全キー、部分一致、en は単語の境界）、AC-34 の 6 語と空白の扱い | AC-34、35 |

### 観点 3：否定の条件と文言の検査の範囲
- AC-35（連続・途切れ・逃した・streak・missed が 0 件）：対象の「画面」が文言ファイルのキーに対応づかないので、範囲は未決（要修正 2）。決まれば ja.json と en.json を読んで数えるだけで、今は 0 件。
- AC-34（6 語が 0 件）：範囲は決まっている（初級の全件、4 要素 + insight、部分一致）。空白の揺れだけ提案。
- AC-38（`task.insight.text` が S3 と S6 で 0 件）：識別子の件数で数えられる（identifiers.md 3「出さない要素は DOM に置かない」）。範囲は決まっている。
- AC-33（ダイアログ 0 件）：`role=dialog` と `aria-modal` の件数（AC-31 の数え方と同じ）。決まっている。
- AC-37「先週の日数は画面に出ない」：数える対象がない（要修正 3）。

### 観点 4：今の受け入れテスト（78 本 × 2 エンジン = 155 件）のうち書き直しの見積もり
- 書き直す（7 本、18 件）：AC4（件数 126→210、7→14）、AC5（`issued` 不変を足す）、AC7 ×3（同上）、AC10（1 本 → 初/上 × 翌日/同日の 4 本に置き換え）、AC12 (a)（AC-33 の操作を足す）、AC14 の 2 通り目（翌日 → 完了して next）、AC24（新しい seed と 11 値）。
- 足す（約 20 本、約 40 件）：AC8 の 10 通り目 1、AC10 +3、AC33 2、AC34 1、AC35 5（4 seed + 語）、AC36 1、AC37 2、AC38 3（JSON 1 + 画面 2）、AC39 1、AC40 1。
- 変えないが再実行（71 本）：AC1〜3、6、8（1〜9 通り目の 10 本）、9、11、13、15〜23、25〜32、DESIGN_D30/D31。ただし H-2 で `formatVersion` を上げるなら seeds/ の 10 ファイルと helpers/fixtures.mjs（出し終えた seed の生成）を機械的に直す。helpers/app.mjs は `readTask` に属性 3 つと `next()` を足す程度。
- design の更新（D-4 を FB-3 に合わせて直す）で `task.exhausted` の h1 が `task.exhausted.message` から levelDone/allDone に変わるなら、AC-17 / AC-27 の `task.exhausted` 到達ヘルパーの期待は変わらず、DESIGN_D30 の 3 本目も `task.exhausted` のままで通る見込み。

- 実行したコマンドと結果（cwd /Users/takumamatsuura/src/engineer）：
  - `grep -oE 'AC-[0-9]+' docs/prd/001-daily-learning.md | sort -u` → AC-1〜AC-40 の 40 件、抜けなし。
  - 11 章（176〜454 行）で `^  - (Given|When|Then|確かめ方|効く機会)：` → 各 40 件。
  - 11 章で `適切|すばやく|わかりやすく|すぐに|素早|正しく|十分|なるべく|できるだけ|スムーズ|快適|速やか|ちゃんと|きちんと|自然に|簡単に|問題なく|目立|見やすく` → 0 件（終了コード 1）。
  - `grep -nEi 'miss|streak|連続|途切|逃し' backend/public/i18n/en.json backend/public/i18n/ja.json` → 0 件（終了コード 1）。
  - tasks.json の 6 語（python3 -I で集計）：全 126 件で 自分の API 3、自分のリポジトリ 14、自分のサービス 15、自分のチーム 2、実務で 1。初級 42 件のうち語が当たる 7 件、11 分以上 10 件、external 2 件（tools に「ターミナル」）。`insight` は 0 件。組は 18 × 7 件。
  - `cd backend/tests/acceptance && npx playwright test --list` → `Total: 155 tests in 18 files`（78 本 × 2 − AC-15 の webkit 分）。
  - contracts/fixtures/seeds/seed-ac24-stats.json → `current` なし、5 行（11-01 done、11-02 too_hard、11-03 done、11-04 no_time、11-06 done unanswered）。r8 の Given（完了 4 件、11-06 に完了なし）とは一致しない（要修正 1）。
  - contracts/tools/check-schemas.mjs の 41、44 行 → 同じ日の行を拒む（H-2）。
- 開いた URL：なし。
- 未検証：なし（G0 は文書の判定のみ）。

- 指揮役と tech-lead への質問（判定には影響しない）：(1) Q13（AC-40）と Q15〜Q19 は G1 の前に決まるか（AC-40 と AC-4、AC-24 の値が変わる）。(2) `formatVersion` を 2 にするか（seeds の直し方が変わる）。(3) 「別の領域を選ぶ」を今の `task.exhausted.redo` のままにするか。

書いたファイル：なし。コミット：なし。
