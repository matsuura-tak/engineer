# 001-daily-learning G1 tech-lead r2（仕様 r7 を今の構成で作れるか、コミット a2f235f）

PASS

仕様 r7 は今の構成のまま作れます。新しい依存、新しい権限、新しい外への送信、新しい JS のファイル、CSP の変更はどれも要りません。新しい境界もありません。
ただし、仕様の側に書き足してほしい箇所が 2 つあります（要修正 2 件。どちらも designer）。契約の側でやることは「3. 契約に要る変更」にまとめました。

## 指摘
- **要修正 1**（design/001-daily-learning.md:41、:45、:192。S7 の行）
  - 問題：S7 は保存しない状態です。そのため、今日の行がある日に S7 に着いた場合、再読み込みすると S7 ではなく S5 か S6 に戻ります。着き方は 2 通りあります。
    - S5 / S6 で `task.next` を押し、出せる課題がなかった。
    - S5 / S6 / S7 から診断をやり直し、新しい組に課題がなかった。
  - 根拠：data.md 4 の判定（6-2 と 6-3 を入れ替えた後の形）では、今日の最後の行で S5 か S6 が決まります。AC-5 は「再読み込みしても `task.done`」を求めています。組を出し終えた日の再読み込みでも、S5 は S5 のままでないといけません。
  - 仕様には、S7 を再読み込みしたときの行き先が書いてありません。G3 のスクリーンショットや探索で「S7 のまま」を期待されると食い違います。
  - 直す方向：5 の S7 の行に 1 文足す。「今日の行がある日に操作で着いた S7 は、再読み込みすると S5 / S6 に戻る。`task.next` をもう一度押すと S7 になる」。
  - 選ばなかった案：S7 を保存する印を足す案です。スキーマの形が変わるのに、得られるものは再読み込みの 1 画面だけなので勧めません。
- **要修正 2**（design/001-daily-learning.md:304。6.1 の `data-progress-index`）
  - 問題：「目標の領域と今の段階の組」で数える、と書いてあります。AC-14 の 2 通り目では、まだ申告していない S3 のまま診断をやり直すので、目標の組と表示中の課題の組が違います。目標の組で数えると、表示中の課題とは別の組の n / N が出ます。
  - 直す方向：「表示中の課題（`current`）の領域と段階の組で、`history` にある行の数 + 1」と書く。`data-progress-total` も同じ組の総数にする。契約（identifiers.md 4、data.md 9）もこの定義にします。PRD の AC-36 の Given にはやり直しがないので、PRD は直さなくて済みます。
- **提案 1**（design/001-daily-learning.md:421、:604。U-19）
  - 次の段階の課題も全部出し終えている場合、`task.exhausted.seenNext` の「前に出したものを除いて続きます」は事実と合いません。
  - 起きる例：中級を全部出した後に「難しすぎ」が 2 回続いて初級に下がり、初級も出し終えている。
  - 直す方向：表示の条件に「次の段階の組に、まだ出していない課題が 1 件以上ある」を足す。数えるのは条件 1 つ分の手間です。めったに起きないので、今のままにする選択もあります。
- **提案 2**（design/001-daily-learning.md:45、:192）
  - S7 で `advance` を押し、次の段階も出し終えていたときの扱いが「S7 のまま描き直す」だけです。段階を上げた値を保存するかが読み取れません。
  - 契約では、上げた `levels` を保存し、新しい段階の levelDone（上級なら allDone）を描く形にします。こうすると再読み込みの結果がぶれません。仕様にもこの 1 文を書いてください。
- **提案 3**（design/001-daily-learning.md:314、:420）
  - 7 の冒頭は `{desc}` を `.seenNext` と `.advance` の差し込みにも挙げていますが、`{desc}` を使うのは `task.exhausted.next` だけです。
  - `task.exhausted.next` は `{desc}`（句点なし）で終わるので、日英とも文の終わりの句読点がありません。

## 証拠
- 対象：feat/001-daily-learning の HEAD a2f235f。`git diff --stat 27509e4 a2f235f -- design/` で変わったのは 4 ファイル（+493/-118）です。
  - [x] design/001-daily-learning.md：全 705 行のうち、1〜10 と 6.1 と 7 を全部読んだ
  - [x] design/001-daily-learning/screens.md：grep で確かめた
  - [x] design/tokens.md：差分を読んだ
  - [x] design/001-daily-learning-research.md：U と R の参照だけ見た
- 観点：見てほしいこと 1〜5 と、docs/org/gates.md:47（今の構成でこのデザインを作れる）。

### 1. 決定、状態、識別子、文言を作れるか
どの決定も「作れる」です。下の表の「要ること」が、それぞれで要る作業です。

| 決定 | 要ること | 備考 |
|---|---|---|
| D-4（S5 / S6 の確認ページと `task.next`） | 次の課題を出して保存する（setItem 1 回）。S5 / S6 からは data.md 4 の 6-2（今日の行で S5 / S6）を飛ばして 6-4 へ進む | 同期で描ける。pickTask は 210 件を 1 周するだけ |
| D-34（S4 の 1 画面） | 累計、祝い、解説を足す | 画面の組み方の変更だけ |
| D-35（累計） | 完了の行数を数え、`data-stat-completed` に出す。`span` に text.title を当てる | 新しいトークンは要らない |
| D-36（祝い） | 節目ごとに別のキー。累計が 7 / 30 / 100 なら `data-milestone` にその数、それ以外は `none` | strings.md 3 に select を足す必要はなくなった（G0 r4 の残りの 1 つが片付いた） |
| D-37（この段階の n / N） | 同じ組の行の数 + 1 と、組の総数を出す。2 件目以降の数は、今日の行の数 + 1 | 定義は要修正 2 のとおり |
| D-38（ひとこと解説） | tasks.schema に `insight` を必須で足す。S3 と S6 では DOM に置かない | 課題集とアプリは同じ配布物で入れ替わるので、新旧が混ざらない。課題集に ID がないときの扱いは 3 の (h) |
| D-39（今週の完了日数） | 端末の日付から `ymdShift(now, -((getDay()+6)%7))` で月曜を出し、文字列のまま比べる | dates.js に今ある関数で足りる。`toISOString` は使わない |
| D-40（S7 の 2 変種、advance、seenNext） | advance は `levels[a]` と `current` を setItem 1 回で保存する。seenNext は `history.some(area===a && level===次)` で決める | 要修正 1、提案 1〜2 |
| D-41（ヒント文、`years.never`） | label の中に span を置く。data.schema の years の enum に 1 つ足す | U-16 は下の 2 |
| D-42（統計の 2 行） | data.md 9 に数え方を 2 行足す | 2 件目以降の完了＝日付ごとに max(0, その日の完了の件数 − 1) を足し合わせる。AC-24 の seed で 1、AC-37 の後も 1 のまま |

- 5.1 の 49 状態：どれも今のつなぎ口で出せます。使うのは seed、W-9 の保存の失敗の注入、W-16 の偽装、W-3 の日付を進める手順です。新しく要る seed は「初級を出し終え、中級の行もある」（#33）と、累計 6 / 10 / 29 / 99（#22〜#25）です。
- 識別子 6.1：どれも作れます。identifiers.md に写すときの注意は 2 つです。
  - `task.cheer.*` の 4 キーは data-testid に使いません。6 の見出しの「すべて data-testid としても使う」に、`firstDayCompleted.yes` / `.no` と同じ例外として書き足します。
  - 3 の `task.dayChanged` の置き場所は、今「`task.exhausted.message` の上」と書いてあります。これを消えるキーでない形（S7 は h1 の上、S3 は `task.today.label` か `.nth` の上）に直します。
- 文言 170 キー：表から機械で取り出すと、重なりのないちょうど 170 キーです。
  - 足すキー 28、消すキー 4、文を変えたキー 11。
  - 差し込みのあるキーは 10 → 21。どのキーも ja と en で差し込みの名前がそろっています。
  - 今の i18n.js の format に新しい 11 キーを通しました。どれも `{}` が残らずに展開されます（en の plural、`{desc}` の入れ子の値も含む）。
  - AC-35 の語（ja の「連続」「途切れ」「逃した」、en の `\bstreak\b`、`\bmissed\b`）は、大文字と小文字を区別しない形で数えても 0 件です。感嘆符も 0 件です。
  - `area.*.desc` の長さは ja が 15〜20 字、en が 32〜39 字で、どれも 40 字以内です（AC-39）。
- 作れないもの：なし。
- 高くつくもの：
  - S7 の分かれ道（advance、次の段階も出し終えている場合、再読み込み）と、その受け入れテストの seed。
  - 課題 ID の付け替え（ADR 0002）に合わせて、seed と見本を作り直すこと。
  - 課題集 210 件と解説そのもの（pdm の仕事。技術の手間ではない）。

### 2. U-16、U-17、U-19 への技術の答え
- **U-16**：ID は `never` にします（案のとおり）。
  - 申告の `none` と grep で混ざりません。文言キーは `years.never` のままで直しは要りません。
  - data.schema の years の enum に足し、validate.js の YEARS の先頭に入れます（radio の並び順）。
- **U-17**：仕様の案を採ります。
  - data.md 4 の「画面を開いたまま日付が変わったとき」の 4 に例外を 1 つ足します。「取り消した操作が `task.next` のときは知らせを出さない」。
  - 判定のやり直しは今と同じです（6-1 で移す課題がなく、6-4 で翌日の 1 件目、`data-task-nth-today`=1）。結果が本人の意図と同じなので、知らせを出す理由がありません。
  - 実装は、操作の入口（main.js の `act`）に操作の名前を渡すだけです。
  - `task.exhausted.advance` は例外にしません（段階は上がらないので「直前の操作は無効」が正しい）。S4 の評価、nav、`app.name` も今のまま知らせを出します。
- **U-19**：条件「`history` に、目標の領域で次の段階の `level` を持つ行が 1 つ以上ある」は、そのまま実装できます。
  - 行の `level` は出したときの段階で、課題 ID の段階と同じ値です。1 行で書けます。
  - 提案 1 の端の場合だけ、条件を足すかを designer が決めてください。

### 3. 契約に要る変更（次のステップで tech-lead が書く案）
- **(a) data.md 2（書き込みの決まり）**
  - 表に「`task.next`」の行を足す：中身は `current`（印がなければ `device.persistRequested`）、setItem は 1 回。
  - 表に「`task.exhausted.advance`」の行を足す：`levels[a]` を 1 段上げて `current`。出せなければ `levels` だけ。setItem は 1 回。
  - やり直しの行を書き換える：S5 / S6 / S7 からのやり直しは、同じ日に `current` を作る。
  - 「翌日の 6-4 から効く」（:33）を「次に出す課題から」に直す。
  - 11 の「今日の課題を作る保存」の一覧に、`task.next`、advance、やり直しを足す。
- **(b) data.md 4（起動時の判定）**
  - 6-2 と 6-3 を入れ替える（今日の `current` があれば S3、なければ今日の最後の行で S5 / S6）。
  - 操作で出すとき（`task.next`、advance、やり直しの後）は、今日の行を見ずに 6-4 へ進む、と書く。
  - U-17 の例外を足す。
  - 要修正 1 の再読み込みの行き先を足す。
- **(c) data.md 5 の 4**：「翌日の課題から効く」（:91）を「次に出す課題から（同じ日の `task.next` でも）」に直す。
- **(d) data.md 8 と check-schemas.mjs**
  - 「同じ日付の行は 1 つまで」（data.md:126）を「日付の古い順。同じ日付の行は出した順」に直す。
  - 「current の日付は最後の行より新しい」（:127）を「以上」に直す。
  - check-schemas.mjs:41 と :44 の `<=` を `<` に直す。
  - 読み手が寛容であることの例（「同じ日の行が 2 つあれば新しい方を使う」）は、今は正しい形になったので書き換える。
- **(e) data.md 9（統計の数え方）**：2 行足す。
  - days-completed-week：完了の行の日付のうち、月曜から今日までに入る日付の数。
  - extra-completed：上の 1 の D-42 の行の式。
- **(f) identifiers.md**
  - 3：data-testid を 5 個足す（`task.total`、`task.cheer`、`task.insight.text`、`settings.stats.daysCompletedWeek.value`、`.extraCompleted.value`）。`task.dayChanged` の置き場所を直す。
  - 4：値を持つ属性を 7 つ足す（6.1 の表のとおり。`data-progress-*` の定義は要修正 2 のとおり）。
  - 5：`never` を足す。
  - 6：146 → 170 キー。消す 4 キーを外す。
- **(g) strings.md と schemas/strings.schema.json**
  - 3 の差し込みの表に 11 行足す（`task.progress`、`.today.label.nth`、`.total.value`、`.week`、`.exhausted.levelDone`、`.levelDone.detail`、`.next`、`.seenNext`、`.advance`、`.allDone`、`.allDone.detail`）。
  - スキーマの required を 170 キーにし、差し込みの pattern を 21 キー分にする。
  - 新しい節「語の検査」を足す。中身は次の 3 つ。
    - AC-35：ja は 3 語の部分一致。en は `/\b(streak|missed)\b/i`。PRD は大文字と小文字の扱いを決めていないので、厳しい側の i を案にする。
    - AC-34：本文 4 要素と解説から `[ 　]` を除いてから 6 語の部分一致。external の tools の全項目に「ブラウザ」か「開発者ツール」が入っていること。
    - どちらも課題集の本文と解説は AC-35 の対象に含めない。
- **(h) schemas/tasks.schema.json**
  - `insight` を必須にする：1〜120（maxLength）、`\S`、改行 `\n` と「`」を拒む。
  - S5 で課題集に ID がないとき（別の版から読み込んだ履歴）は、h2 と解説を置かず、題名は ID にする。今の titleOf と同じ扱い。
- **(i) schemas/data.schema.json**：years の enum に `never` を足す。formatVersion は 1 のまま（ADR 0002 の書き換えで理由を書く）。
- **(j) test-hooks.md**
  - 「時間の計り方」の表に 1 行足す：始点の testid は `task.next`、終点は `data-state` が `task.today`、上限 1,000 ms（H-4）。
  - W-6 を書き換える：件数は 210 以上（252 版は 252 以上）、組ごとに 14 / 14 / 7 以上、BUDGET2 は 4 の新しい値。
  - W-7 を書き換える：AC-24 の seed（11-04 に 2 行）、AC-35 の 4 通り、AC-36、AC-8 の 10 通り目、#33（seenNext あり）の作り方。
- **(k) budgets.md**：1 の枠と 2 の平均を 4 のとおりに直す。
- **(l) fixtures**
  - data に足す：valid（同じ日に 2 行、`never`）、invalid（知らない years）。
  - seeds：seed-ac24-stats.json を PRD r10 の Given に作り直す（今の見本は 11-04 が 1 行で 11-06 が done。PRD r10 は 11-04 に完了 2 行、11-06 に no_time）。seed-ac35 を少なくとも 1 件足す。
  - tasks：valid-sample に `insight` を足す。invalid を 4 つ足す（insight がない、121 字、改行、バッククォート）。今ある invalid にも `insight` を足し、落ちる理由を 1 つに保つ。
  - strings：valid-ja / valid-en を 170 キーにし、新しい差し込みの invalid を 1 つ足す。
- **(m) ADR 0002**
  - ID の凍結を「最初の公開（2026-11-30 の仮置き）から」に書き換える。
  - 課題 ID の付け替え（G0 r3 の案：旧初級 → 中級 001〜007、旧中級 → 中級 008〜014、新しい初級は 001〜014）と `never` を足すことは、公開前なので formatVersion 1 のまま、と書く。
  - 公開の時点で、ID の一覧を固定して足すことしか許さない単体テストを置く、と書く。
  - 根拠：`curl -sI https://matsuura-tak.github.io/engineer/` は今日（2026-11-05）も `HTTP/2 404` で、外に出た版 1 の読み手がいません。
  - 手当て：Takuma のブラウザのデータは一度「すべてのデータを削除」してもらう（ADR に書き、指揮役から伝える）。
- **(n) その他**
  - service-worker.md 3 の FILES：JS のファイルを増やしたときだけ足す（5 のとおり、増やさない案）。
  - CLAUDE.md の「いまの段階」（G3 と書いてある）を G1 に直す。

### 4. 予算の見積もり（gzip level 9）
- 今の実測（`cd backend && node scripts/check-budget.mjs public`、終了コード 0）：

| 部分 | 今 / 枠 | 内訳 |
|---|---|---|
| 殻 | 25,871 / 32,000 | JS 22,385（モジュール 21,602 + sw.js 783）、CSS 2,794、HTML 692 |
| 文言 | 6,610 / 8,000 | |
| アイコンと manifest | 2,173 / 4,000 | |
| 課題集 | 30,193 / 106,000 | |
| 合計 | 64,847 / 150,000 | |

- **文言（実測）**：design 7 の 170 キーから作った ja.json / en.json を、今のファイルと同じ整形（2 字下げ）で gzip しました。
  - 結果は 4,227 + 3,615 = **7,842 / 8,000**（98%）です。参考に、詰めた形は 7,800、今の 146 キーは 6,610 です。
  - 余りは 158 バイトしかなく、文言を少し直すだけで枠を超えます。
- **JS（spike の見積もり）**：今の js/ の写しに、r7 の処理を実装に近い形で足して数えました。
  - 足した処理：rules に今日の件数、進み具合、今週、2 件目以降、節目、次の段階、seenNext、次の課題、advance。view-task に S4 / S5 / S6 / S7 の 2 変種、進み具合の行、`.nth`。main に onNext、onAdvance、S5 / S7 の組み立て。
  - 結果：main.js +416、rules.js +573、view-task.js +827、合わせて **+1,816**。JS は 22,385 → 24,201 です。
  - spike で数えていないもの：古い 4 画面の削除（減る）、6-2 と 6-3 の入れ替え、U-17 の例外、統計の 2 行、YEARS、CSS（増える）。これを見込んで［推測］JS は **約 24,100〜24,800 / 26,000**（ADR 0001 の見直しの線）、殻は約 28,000〜29,000 / 32,000 です。殻の枠は変えなくて足ります。
- **課題集**：r3 の spike で、210 件、解説 120 字の約 75,100（252 件版は約 92,700）です。合計は約 113,600 / 150,000 の見込みです。
- **割り直しの案**（合計 150,000 は変えない。PRD AC-4 の「上限の値は tech-lead が見直す」に当たる）

| 部分 | 今 | 案 | 理由 |
|---|---|---|---|
| 殻 | 32,000 | 32,000 | JS 26,000 + HTML と CSS 6,000 のまま。JS の線が先に効く |
| 文言 | 8,000 | **9,000** | 7,842 に約 15% の余り |
| アイコンと manifest | 4,000 | 4,000 | |
| 課題集 | 106,000 | **105,000** | 252 件版の約 92,700 に約 12,000 の余り |

  - あわせて budgets.md 2 の平均を「4 要素と解説の字数の平均 600 以下」から **「480 以下」** に下げます。
  - 理由：r3 の spike（約 410 字で 92,700、600 字で 125,300。1 字あたり約 172 バイト）から、105,000 に収まる平均は約 480 字です［推測］。600 字のままだと、平均を守っても gzip の上限を超えます（G0 r3 の指摘）。
  - 下書きの約束が変わるので、pdm には指揮役から伝えてください。本当の歯止めは gzip のテスト（`BUDGET2_`）で、平均の値は G2 で実物の下書きを数えて確かめます。

### 5. JS のファイルの数
- 今は 13 個です：`backend/public/js/` の 12 個（dates、dom、files、i18n、main、persist、rules、store、validate、view-settings、view-start、view-task）と sw.js。上限は 15 個です（ADR 0001:41）。
- spike は新しいファイルなし（13 個）で書けました。view-task.js は生で約 12.8 KB になります。
- 読みやすさのために S4〜S7 を別のファイル（例 view-after.js）に分けても 14 個で、上限に収まります。分けるなら service-worker.md 3 の FILES と modulepreload にも足します。

### 読んだファイル
- design/001-daily-learning.md（r7）、design/tokens.md の差分、design/001-daily-learning/screens.md（grep）
- docs/prd/001-daily-learning.md（11 の冒頭、AC-10、AC-24、AC-33〜AC-40、:236）
- docs/reviews/001-daily-learning-G0-tech-lead-r3.md（G1 でやること、3 の予算）、同 r4、同 verifier-r4（H-1〜H-6）
- contracts/data.md、identifiers.md、strings.md、budgets.md、test-hooks.md、schemas/data.schema.json と tasks.schema.json（該当箇所）と strings.schema.json（required、pattern）、tools/check-schemas.mjs、fixtures/ の一覧と seed-ac24-stats.json
- docs/adr/0001（:41、:58、:62）、0002（全文）
- backend/public/js/ の rules.js、i18n.js、dates.js、view-task.js（S4〜S7）、main.js（act、dayChanged、showToday〜showExhausted）、validate.js（定数）
- docs/org/gates.md（G1）、docs/templates/review-report.md

### 実行したコマンドと結果
- `git diff --stat 27509e4 a2f235f -- design/`：4 ファイル、493 行追加、118 行削除。
- `cd backend && node scripts/check-budget.mjs public`：上の表のとおり。OK、終了コード 0。
- `cd backend && npm run -s check:contracts`：見本 41 件、期待と違う結果 0 件、終了コード 0（今の契約。r7 の分はまだ入れていない）。
- `node scratchpad/g1r7/strings.mjs design/001-daily-learning.md <repo>`：
  - keys 170、dup []、pretty gzip ja 4,227 / en 3,615 / 合計 7,842
  - added 28、removed 4、changed ja 11、差し込みのあるキー 21（MISMATCH 0）
  - forbidden words []、exclaim []、area.*.desc は ja 15〜20、en 32〜39
- `node scratchpad/g1r7/fmt.mjs backend/public/js/i18n.js`：新しい 11 キーを日英で展開して、LEFTOVER は 0 件。
- `node --check` を spike の js/*.js にかけて構文エラー 0。`node scratchpad/g1r7/size.mjs`：`modules 21602 -> 23418 +1816 ; with sw.js 22385 -> 24201`。
- `curl -sI https://matsuura-tak.github.io/engineer/` と `…/data/tasks.json`：どちらも `HTTP/2 404`（未公開。formatVersion 1 のままにする根拠）。
- grep：check-schemas.mjs:41 と :44 の `<=`、data.schema.json:43 の years の enum、identifiers.md:43 の `task.exhausted.message`、data.md:91、:126、:127、budgets.md:18、:32。

### 開いた URL と確認した日付
- https://matsuura-tak.github.io/engineer/（2026-11-05、curl。404）

### 未検証
- G1 の判定に要る項目の未検証：なし。
- JS と課題集の最後の大きさは、G2 で実物を数える項目です。ここでは spike の見積もりで判定しています。

### 質問（指揮役へ）
- 要修正 1 の「S7 は再読み込みで S5 / S6 に戻る」を受け入れてよいか。受け入れない場合は、保存の形を変える（印を足す）判断が要り、ADR 0002 で扱うことになります。
- 予算の割り直し（文言 9,000、課題集 105,000、平均 480 字）を、pdm の下書きの前に伝えてよいか。

### spike の後始末
- リポジトリには何も書いていません。コミットもしていません。
- 作ったのはスクラッチパッドの中だけです。
  - /private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/g1r7/strings.mjs（文言の取り出しと数え上げ）
  - /private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/g1r7/ja.json と en.json（170 キーの写し）
  - /private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/g1r7/fmt.mjs（format の確かめ）
  - /private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/g1r7/js/ と sw.js、size.mjs（JS の増え方の spike）

## 記録（指揮役が保存するときに書き足す）
- 関門：G1
- 判定した役：tech-lead
- 回：r2（G1 の tech-lead の判定。r1 は docs/reviews/001-daily-learning-G1-tech-lead-r1.md）
- 対象：design/001-daily-learning.md r7 ほか（feat/001-daily-learning、27509e4...a2f235f）
- 日付：2026-11-05
