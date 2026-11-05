# 001-daily-learning G0 tech-lead r3（PRD r8、コミット 967aca1）

FAIL

## 指摘
重大は 1 件です。PRD の E-13 にある Duolingo のレビューの引用が、実際のページの文と違います。それ以外の 40 件の AC は、今の構成（ブラウザだけ、サーバーなし、本番の依存 0、JS 15 ファイルまで、gzip 合計 150,000 バイト、Safari 17 以上）のまま作れます。この 1 行を直せば、r4 は PASS にできる見込みです。

- **重大 1**：docs/prd/001-daily-learning.md:35（E-13）。引用した不満がページにない
  - PRD の引用：「続けることに前よりプレッシャーを感じます…このシステムには個人的に無理を感じ」（11-03、評価 4、1600 日継続中）。これを連続記録の副作用として挙げている。
  - JP のレビュー RSS の原文（2026-11-03、評価 4）：「英語で1600日続けています。 毎月のクエストポイントの要求が昔は50だったのに今70になったのを見て、嫌なプレッシャーを感じました。…このシステムには個人的に無理を感じています。」
  - 前半の「続けることに前よりプレッシャーを感じます」はレビューのどこにもない。この人が「無理を感じる」と言っているのは月ごとのクエストのポイントで、連続記録ではない。1600 日続けている人なので、どちらかといえば連続記録が効いている例。
  - この引用は Q16（連続記録を入れない）の根拠に使われているので、ずれたままにできない。
  - 直す方向：原文どおりに引き直し、副作用の種類を「クエストのポイントの圧」と書き分ける。または E-13 から外す。他の 5 件の引用はページにあった（下の証拠）。

- **要修正 1**：:353（AC-24 の Given）と :431（AC-37）。seed が決まりきらず、2 つの AC がそのままでは両立しない
  - AC-24 の seed は、出した課題 6、完了 4、難しすぎ 1、今日はできない 1。履歴は 6 行で、`current` は置けない（置くと出した数が 7 になる）。
  - 時刻を 2026-11-06 に固定して開くと、11-06 の行がない限り、起動の処理（contracts/data.md:61 の 6-4）が今日の課題を自動で 1 件出す。すると `data-stat-issued` は 7 になり、期待値の 6 と合わない。
  - 6 に保つには、難しすぎか今日はできないの行を 11-06 の日付にするしかない。その場合、開いたときの状態は `task.skipped` になる。
  - ところが AC-37 は同じ seed から「今日の課題を完了する」と書いている。完了するには、先に「次の一手に進む」が要る。
  - 直す方向（pdm）：AC-24 の Given に、難しすぎと今日はできないの 2 行の日付を書く（どちらか 1 行は 2026-11-06）。AC-37 の When を「次の一手に進む → 完了」にするか、AC-37 に専用の seed を書く。

- **提案 1**：:35（E-13）。ライフの不満（「レジェンドレベルをした時に必ずライフが足らないように調整」）と、通知の不満（「ストーカーの様な」）も「連続記録の副作用」にまとめられている。引用はページにあったが、ライフと通知は連続記録とは別の仕組み。種類ごとに書き分けると、Q16 の根拠が正確になる。
- **提案 2**：docs/prd/product.md:43。「（001 の E-12）」は E-13 の誤り。
- **提案 3**：:436（AC-38）。`task.insight.text` を「文言キー」と呼んでいるが、解説の中身は課題集から来るので、文言ファイルのキーではない。G1 で、文字を持たない要素の data-testid として identifiers.md の 3 に入れる（tech-lead が行う）。
- **提案 4**：PRD 11 の「修了と進級」。難しすぎ 2 回で段階が下がった先の組をもう出し終えていると、`task.exhausted` で「次の段階へ進む」が出て、難しすぎた段階に戻すことになる。仕様として誤りではないが、画面の文をどうするかは designer に任せる。
- **G1 で tech-lead が行うこと（PRD の直しは要らない）**：
  - contracts/budgets.md の 2 の「平均 600 字」と「gzip 後 106,000 バイト」が噛み合わない（詳細は証拠の 3）。
  - data.md の書き手の決まり 8（:126「同じ日付の行は 1 つまで」）、起動時の判定 4 の 6-2 と 6-3 の順番（:59）、段階の規則 5 の 4（:91「翌日から効く」）を直す。
  - ADR 0002 の「ID は変えない」を「最初の公開から凍結する」に書き換える。

## 証拠
- 対象：feat/001-daily-learning の HEAD 967aca1。docs/prd/001-daily-learning.md（r8、580 行、AC-1〜AC-40）、docs/prd/product.md（r4）。`git diff --stat 0ff6a82 967aca1` で変わったのは、PRD、product.md、docs/progress.md の 3 ファイル。PRD と product.md は全部読んだ。
- 観点：実現性、保存の形、予算、第 1 部の根拠、時間の枠、費用、Q12〜Q19（docs/org/gates.md の G0 のうち tech-lead の項目）。

### 1. 新しい AC と変えた AC の実現性
構成は r7 と同じです：静的な HTML、CSS、ES modules、Service Worker、localStorage のキー 1 つ。テストは Playwright の Chromium と WebKit。

| AC | 判定 | 根拠 |
|---|---|---|
| AC-4（210 件、初級と中級は各 14 件） | 作れる | 件数とスキーマはテストで数える。予算に収まることは 3 で計算した |
| AC-5（完了の後、求めない限り次は出ない） | 作れる | r7 と同じ動き。今日の行が複数になるので、起動の判定を「今日の `current` があれば S3、なければ今日の最後の行の申告で S5 か S6」の順に変える（data.md 4 の 6-2 と 6-3 を入れ替える） |
| AC-7（3 種類の申告の後も同じ） | 作れる | AC-5 と同じ |
| AC-8（10 通り目：同じ日の 2 回連続で、次に出す課題から段階が動く） | 作れる | 段階の規則は申告を保存するときに行う。data.md 5 の 4 の「翌日から」を「次に出す課題から」に変えるだけ。同じ日に申告が 2 件並ぶのは、data.md 5 の 1〜3 の並べ方のままで数えられる |
| AC-10（修了と進級） | 作れる | 「次の段階へ進む」は `levels[a]` を 1 段上げる変更と新しい `current` を、1 回の setItem で保存する。全件を出した seed は 14 行か 7 行 |
| AC-12（オフラインで、次へ進む、修了、進級も動く） | 作れる | 新しく通信を使う操作はない。課題集は最初の読み込みで全件を持っている |
| AC-14（やり直した診断は次に出す課題から効く） | 作れる | `task.done`、`task.skipped`、`task.exhausted` からやり直したときは、診断と段階と新しい `current` を 1 回で保存する。`task.today` からやり直したときは `current` をそのまま残す |
| AC-24（値を 2 つ追加：今週の完了日数、2 件目以降の完了） | 作れる（seed は要修正 1） | どちらも history から計算できる。今週の始まり（月曜）は `new Date()` の getDay から日付の文字列を作る。日付どうしは文字列のまま比べる（data.md 6） |
| AC-33（次の一手に進む） | 作れる | 押したら `current` に次の課題を入れて 1 回で保存する。その日の何件目かは「今日の日付の行の数 + 1」。出した件数は今の数え方（history の行数 + current）のままで合う |
| AC-34（初級の決まり） | 作れる | 所要時間、禁止の語、道具の語は JSON を全件読むテストで調べる。「用語に 1 文の説明がある」は機械で判定できず、指揮役が人の目で見る。この扱いは PRD のとおりでよい |
| AC-35（累計と祝い、禁止の語は 0 件） | 作れる | 累計は完了した行の数。節目の 7、30、100 は文言で分ける。今の ja.json に「連続」「途切」「逃し」は 0 件。en.json に「streak」「missed」も 0 件（"in a row" は 2 件あるが禁止の語ではない。その文は designer が直す） |
| AC-36（この段階の何件目か） | 作れる | 同じ領域と段階で出した課題の数 + 1 と、その組の総数。どちらも課題集と history から出る |
| AC-37（今週の完了日数） | 作れる（seed は要修正 1） | AC-24 と同じ計算 |
| AC-38（ひとこと解説） | 作れる | tasks.schema.json の各課題に `insight`（1〜120 字）を必須の項目として足す（今のスキーマは知らない項目を拒む）。表示は textContent で入れる。`task.done` で再読み込みしても、今日の最後の行の課題 ID から解説を引ける |
| AC-39（領域の 1 行の説明） | 作れる | 文言に 6 キー足すだけ。英語で 40 字以内は短いが書ける長さ。幅 320 での確かめ方は AC-17 と同じ |
| AC-40（経験年数に「まだ書いたことがない」） | 作れる | data.schema の years の候補に 1 つ足す。ID は G1 で tech-lead が決める（案は `never`。申告の `none` と grep で混ざらない） |
| AC-15（2 秒） | 作れる | spike（下）。合成の大きい課題集でも 1,262〜1,280 ms |
| ほかの AC（1〜3、6、9、11、13、15〜23、25〜32） | 作れる | r7 で G3 PASS（docs/verification/001-daily-learning/verification.md）。r8 で直接は変わらない。課題 ID を付け直すので、テストの seed は直す（verifier。課題 ID を書いたファイルは backend/tests と contracts/fixtures に 151 個） |

- 審査と権限：App Store の審査はない。新しい権限、通知、バックグラウンドの処理、外への送信はない。解説は同じ origin の課題集の中にある静的な文で、textContent で入れる。読み込むファイルの検査は今の境界のまま。**新しい境界なし**。
- イベント（15）：足した 3 つ（Task Continued、Level Completed、Level Advanced）はどれもアプリの中で起きることなので、アプリの側で取れる。D6 により記録はしない。
- 12（非機能）：全行に数字と測り方がある。

### 2. 保存の形（意見）
- **formatVersion は 1 のままを推奨。** 理由は 3 つ。
  - まだ公開していない。`curl -sI https://matsuura-tak.github.io/engineer/` は `HTTP/2 404` で、外に出ている版 1 の読み手も、書き出したファイルもない。
  - 前例がある。ADR 0002:29 で firstOpenDate の形を変えたときも「v1 はまだ配っていないので、版は上げない」とした。
  - 版を 2 に上げると、1 から 2 へ移す処理（ID の付け替えの表を含む）とそのテストが要るのに、得をする利用者が 0 人。
- いちばん強い反論：Takuma の確認用のブラウザと、テストの見本には、古い ID の版 1 のデータが残る。古い `levels: beginner` は、新しい課題集では「未経験」の意味で読まれてしまう。
  - 手当て：公開前のデータとして扱い、Takuma には一度「すべてのデータを削除」してもらう。見本（contracts/fixtures/、seed）は G1 と G2 で作り直す。
  - ADR 0002 の「ID は変えない」「見本は消さない」は、最初の公開（2026-11-30 の仮置き）から守ると書き換える。公開の時点で、ID の一覧（領域と段階つき）を固定し、足すことしか許さない単体テストを置く。
- スキーマで変わるのは years の候補を 1 つ足すことだけ。書き手の決まり（data.md 8）は 2 点変える。「同じ日付の行は 1 つまで」はやめる。「current の日付は history の最後の行より新しい」は「最後の行以上」にする。今ある版 1 の見本は、新しい決まりにもそのまま合う（前より緩くなるだけ）。
- **1 回の保存は 1 回の setItem のまま保てる。** 新しい操作はどれも 1 回で書ける。次の一手に進む＝`current`（印がなければ persistRequested も）。進級＝`levels` と `current`。同じ日のやり直し＝`diagnosis`、`levels`、`current`。修了で課題が尽きたときは書かない。起動のときの「最大 1 回」も変わらない。
- 保存の大きさ：一度出した ID は二度と出さない（AC-6）。そのため、1 日に何件進めても history の行数は課題集の件数（210 件、のちに 252 件）が上限になる。252 行 × (2,000 + 約 160) ≈ 54.5 万字で、WebKit の上限 2,621,432 字の約 21%。委任の記録（2026-11-03）で挙げた「約 3.3 年で上限」の心配は、課題集が約 1,200 件を超えるまで起きない。
- 課題 ID の付け替え（案。G1 で ADR に書く）：
  - 旧初級 `<a>-beginner-001〜007` → `<a>-intermediate-001〜007`
  - 旧中級 `<a>-intermediate-001〜007` → `<a>-intermediate-008〜014`
  - 新しい初級 → `<a>-beginner-001〜014`
  - 上級は `001〜007` のまま。12-14 の版で `008〜014` を足す
  - 今の選び方（候補のうち ID が最も小さいもの。data.md 5）のままで、中級は旧初級から先に出る。並び順の項目を足す必要はない。ID の形 `<領域>-<段階>-<3 桁>` とスキーマの検査も変えずに済む。

### 3. 課題集の予算の見積もり（実測から）
- 今の実測：`cd backend && node scripts/check-budget.mjs public`
  - 殻 25,871 / 32,000、文言 6,610 / 8,000、アイコンと manifest 2,173 / 4,000、課題集 30,193 / 106,000、合計 64,847 / 150,000、OK、終了コード 0
- 今の課題集の中身（node で読んだ）：126 件。4 つの本文の平均は 287.1 字（初級 302.3、中級 279.6、上級 279.5）。gzip 後は 1 件あたり 239.6 バイト。external は 7 件。所要時間の内訳は 10 分 32 件、12 分 55 件、15 分 39 件。
- spike：scratchpad/spike/budget.mjs。新しく書く文の代わりに、docs の地の文を重ならないように切って入れた。
  - 校正：今の 126 件と同じ長さで代わりの文を入れると gzip は 24,149 で、実物 30,193 の 0.800 倍。代わりの文は実物より約 20% よく縮むので、代わりの文の分は 0.8 で割って直した。

| 場合 | spike の gzip | 0.8 で直した見積もり |
|---|---|---|
| 210 件（新しい初級の本文 300 字、解説 60 字） | 58,428 | 約 65,500 |
| 210 件（新しい初級 300 字、解説 120 字＝上限） | 66,098 | **約 75,100** |
| 210 件（新しい初級 400 字、解説 120 字） | 72,261 | 約 82,800 |
| 252 件（12-14 の版。上級も 300 字、解説 120 字） | 80,203 | **約 92,700** |
| 252 件 × 平均 600 字（すべて新しい文。予算 2 の上限ちょうど） | 100,242 | 約 125,300（106,000 を超える） |
| 210 件 × 平均 600 字 | 81,766 | 約 102,200 |

- 結論：210 件と解説（上限 120 字）は約 75,100 バイトで、課題集の枠 106,000 に収まる。合計も約 25,900 + 7,700（文言の増加込み）+ 2,200 + 75,100 ≈ 110,900 で、150,000 に収まる。12-14 の 252 件版は約 92,700、合計で約 128,500。
- 噛み合わない点（G1 で tech-lead が直す）：予算 2 の「解説を含む平均 600 字以下」を守っても、実物の縮み方なら 252 件で約 125,000 バイトになり、106,000 を超える。gzip の上限の方が先に効くので、検査そのものは `BUDGET2_` のテストで守られる。ただし pdm への約束としては食い違っている。
  - 直す方向：平均の上限を、解説を含めて約 500 字に下げる（252 件 × 500 字で約 105,000 の見込み）。あわせて、枠の割り方を見直す。案は殻 34,000、文言 10,000、アイコンと manifest 4,000、課題集 102,000（合計 150,000 は変えない）。
- 文言の見込み：1 キーあたり gzip で ja 約 24.5 バイト、en 約 20.8 バイト（3,575 / 146、3,035 / 146）。r8 で約 23 キー増えると約 +1,040 で、約 7,650 / 8,000。余りが小さいので、上の枠の見直しに入れる。
- JS の見込み：今 22,385（殻から CSS と HTML を引いた値）。r8 の処理で gzip +1,500〜3,000 の見込み［推測］。ADR 0001 の見直しの線 26,000 に近づくので、G2 で数える。JS のファイルは今 13 個（sw.js を含む）で、上限の 15 個までに 2 個の余りがある。
- AC-15 の spike：scratchpad/spike/load.mjs。AC-15 のテストと同じ制限（遅延 150 ms、下り 200,000 B/s、CPU 4 倍遅い。Chromium）で、ビルドを scratchpad に出して測った。
  - 今の課題集（126 件）：`1053, 998, 930, 933, 920` ms
  - 合成の 252 件（gzip 98,915。合計 133,855 / 150,000 で OK）：`1276, 1280, 1274, 1274, 1262` ms
  - 予算の上限近くでも 2,000 ms まで約 720 ms の余りがある。

### 4. 第 1 部と「G0 の前の確認」（印を信じずに確かめた）
| 項目 | 結果 | 証拠 |
|---|---|---|
| 3 にアプリ 3 件以上とアプリ以外の代替。アプリの行に URL と引用 | 満たす | :50〜:56（Progate、Mimo、Sololearn、Enki、paiza、Web 3 件、アプリ以外 1 行）。Progate の引用 3 件は RSS で確かめた |
| 根拠に印があり、［推測］だけの結論がない。URL が 3 つ以上 | **満たさない（重大 1）** | E-1〜E-21 に印はある。E-13 の引用 1 件がページにない。他に確かめた引用はページにあった |
| Job が 1 つで、画面名と機能名がない | 満たす | :18 |
| 機会と解決案がそれぞれ 3 つ以上 | 満たす | O-1〜O-5（:74〜:78）、S-1〜S-9（:83〜:91）。捨てた理由もある |
| 6 の全行と 7 の 5 行、結び付けた先 | 満たす | 6 は 6 行（:96〜:101）、7 は 5 行（:106〜:110） |
| 8 の推奨、いちばん強い反論、作らない場合 | 満たす | :113〜:115 |
| 9 のすべてに Kano と効く機会 | 満たす | :128〜:143 |
| 10 のやらないことと理由 | 満たす | :147〜:160 |
| 全 AC に Given、When、Then、確かめ方、効く機会 | 満たす | grep で AC 40、Given 40、When 40、Then 40、確かめ方 40、効く機会 40。番号は AC-1〜AC-40 で抜けがない。曖昧な語（適切、すばやく など）の grep は 0 件 |
| 13 にガードレールがあり、主の指標が見かけの指標でない | 満たす | :177〜:185。ガードレール 4 行 |
| 14 の全行に数値、日付、取る行動、pdm 以外の判定役 | 満たす | :191〜:196（verifier と tech-lead） |
| 15 の全イベントにプライバシー表示の区分 | 満たす | :203〜:218 の 16 件 |
| 第 1 部が約 120 行以内 | 満たす | :12〜:115 |

- E-20 と E-21（実データ）も自分で確かめた。
  - E-20：旧初級 42 件の本文に「自分の API」3 件、「自分のリポジトリ」2 件、「自分のサービス」1 件、「実務で」1 件、「障害」5 件がある。
  - E-21：ja.json の `diagnosis.start.lead.1`「すでにコードを書いているエンジニア向けです。…」、`level.beginner.desc`「基本は知っているが、実務では人に聞きながら進める」。`area.*.desc` はない。

### 5. 時間の枠と費用
- **3 週は現実的。**
  - 前の周回は、G0（10-29）から G3 PASS（11-04）まで 7 日で、126 件の課題集も含んでいた（docs/progress.md:15〜:39）。
  - r8 で増える仕事の見込み［推測］：G1（design r7、契約、ADR 0002 の書き換え、設計メモ）2〜3 日。課題集（初級 84 件、解説 210 行、ID の付け替え）と指揮役の初級の目視 3〜4 日。受け入れテスト（新しい 8 件、変えた 7 件、seed の付け替え）2〜3 日。実装 2〜3 日。G2 と G3 で 2〜3 日。合わせて 11〜16 日で、3 週（11-06〜11-26）に収まる。
  - 制約：「書く役は同時に 1 体だけ」なので、課題集を書く間は実装もテストも進まない。課題集は、G1 の判定（読むだけの役は並列にできる）を待つ間に書かせると早い。
- **利用者 1,000 人あたりの月の費用は 0 円（変わらない）。**
  - 転送量：最初の訪問は最大で約 134 KB × 2（SW がもう一度取る分）≈ 270 KB。版を月に 4 回出しても、1,000 × 5 × 270 KB ≈ 1.4 GB/月。SW がない場合でも 1,000 × 30 回 × 134 KB ≈ 4 GB/月。
  - GitHub Pages の上限：「Published GitHub Pages sites may be no larger than 1 GB」「soft bandwidth limit of 100 GB per month」（2026-11-05 にページで確認）。外部の API は使わない。

### 6. Q12〜Q19 に技術の面から反対はあるか
- Q12 A：反対なし。B（4 段階）だと、段階の ID、AC-8 の seed、契約の語彙、design の表が全部変わる。A は ID の付け替えだけで済み、選び方の規則も変えずに済む（2）。ただし「ID は変えない」の書き換えが要る。
- Q13 A：反対なし。years の候補を 1 つ足し、公開前なので版は上げない（2）。
- Q14：技術の問いではない。
- Q15 A（上限なし）：反対なし。履歴は課題集の件数で頭打ちになるので、保存の上限の心配が減る（2）。上限を後から足すのも、数を 1 つ置くだけ。
- Q16 A：反対なし。連続日数は history の日付から計算できるので、後から足しても保存の形は変わらない（PRD の「戻せる」は正しい）。
- Q17 A（210 件）：反対なし。予算に収まる（3）。
- Q18 A：反対なし。tasks.schema に必須の項目を 1 つ足すだけ。課題集とアプリは同じ配布物で一緒に入れ替わるので（ADR 0003、AC-28）、新旧が混ざる心配はない。予算の書き方は 3 のとおり G1 で直す。
- Q19 A：値はどちらも history から出せる。seed の書き方は要修正 1。

### 読んだファイル
- PRD とその前後：docs/prd/001-daily-learning.md（全行）、docs/prd/product.md（r4 の差分）、docs/approvals/001-daily-learning-FB1.md、docs/approvals/delegation.md、docs/reviews/001-daily-learning-G0-tech-lead-r2.md、docs/org/gates.md、docs/templates/review-report.md、docs/progress.md
- 契約：contracts/data.md（全行）、identifiers.md、budgets.md、test-hooks.md（W-6 のあたり）、schemas/data.schema.json、schemas/tasks.schema.json、fixtures/seeds/seed-ac24-stats.json
- ADR：docs/adr/0002（ID と版の行）
- 実装とテスト：backend/scripts/check-budget.mjs、backend/scripts/build.mjs（--tasks の引数）、backend/public/（tasks.json、ja.json、en.json、js/ の一覧）、backend/tests/acceptance/（playwright.config.mjs、ac15-load-time.spec.mjs、server/static-server.mjs、helpers/seed.mjs、helpers/build.mjs）、docs/verification/001-daily-learning/verification.md（AC-15 の値）

### 実行したコマンドと結果
- `node scripts/check-budget.mjs public` → 合計 64,847 / 150,000、OK、終了コード 0（3）
- node で tasks.json を集計 → 3 の数字。旧初級の禁止の語の数 → 4 の数字
- `node budget.mjs`（scratchpad）→ 3 の表
- `node gen-tasks.mjs … 252 600` → `tasks 252 raw 330663 gzip 98915`
- `node scripts/build.mjs --out <scratchpad>/dist-big --version 2026-11-05.1 --tasks <scratchpad>/tasks-252x600.json` と `--out <scratchpad>/dist-base` → どちらも「ビルドした（20 ファイル）」。dist-big の check-budget → 合計 133,855 / 150,000、OK
- `node load.mjs`（Chromium、AC-15 と同じ制限）→ base `1053, 998, 930, 933, 920`、big `1276, 1280, 1274, 1274, 1262`
- `grep -cE '^- AC-[0-9]+：'` → 40。Given、When、Then、確かめ方、効く機会も各 40。曖昧な語の grep → 0 件
- `grep` で ja.json と en.json の「連続」「途切」「逃し」「streak」「missed」→ 0 件（"in a row" が en に 2 件）
- `curl -sI https://matsuura-tak.github.io/engineer/` → `HTTP/2 404`（まだ公開していない）
- Apple の JP レビュー RSS（python3 -I と urllib）：Progate は 269 件（2018-01-24〜2026-06-02）、Duolingo は mostrecent が 500 件（2026-10-15〜11-03）と mosthelpful
- `git status --short` → 私の変更はない。未追跡の docs/reviews/001-daily-learning-G0-verifier-r4.md は私が作ったものではない。

### 開いた URL と確認した日付（2026-11-05）
- https://apps.apple.com/jp/app/progate/id1335868128 ：評価 1,180 件（PRD は 1,179）。ページに出ているレビューには引用がない。RSS で次の 3 件を確かめた。
  - 2020-03-19、評価 2「当たり前のように専門用語を使ってきて腹が立ちました。 用語などの意味を知るためにこのアプリを入れたのに本末転倒です。」→ ある
  - 2025-12-02「Web版は日本語なのにアプリは全部英語」→ ある
  - 2026-06-02「解約したのに請求を半年以上されていた」→ ある
- https://progate.com/ ：「未経験でも、独学でも大丈夫」「スライド学習」「税込 ¥ 990~ /月」→ ある
- Duolingo の JP の RSS（https://apps.apple.com/jp/app/duolingo/id570060128 のレビュー）：
  - 45 日連続（10-31）、700 日連続（11-01）、ストーカー（11-02）、修学旅行（11-02）、ライフ（11-03）、競争するだけのクラブ（2019-09-16）→ ある
  - 1600 日の引用 → 原文と違う（重大 1）
- https://blog.duolingo.com/putting-in-work-the-habit-of-language-learning ：「learners who reach a streak of 7 days are 2.4x more likely to use Duolingo the next day」、5% → ある（2021-01-08）
- https://blog.duolingo.com/improving-the-streak ：「Establishing a goal appeared to be a barrier to forming a daily habit」、3.3%、10.5% → ある（2020-11-19）
- https://academic.oup.com/jcr/article/49/6/1095/6649024 ：「consumers consider maintaining a logged streak to be a meaningful goal in and of itself」→ ある（Silverman & Barasch）
- https://mobbin.com/blog/streaks-are-about-losing-a-study-of-859-streak-designs ：「Breaking a streak rarely just resets the number. It resets the motivation.」、859 件、Lally の「did not materially affect the habit formation process」→ ある。ページに「2010」の年は書いていない。
- https://paiza.jp/works/mondai ：「メニューは上から順番に解いていくとレベルアップできるようにまとめられた問題集です。」、D〜S のランク → ある
- https://www.sololearn.com/ ：「Pro users that set up daily goals have the highest lesson completion rate of 92%!」→ ある
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits ：1 GB、月 100 GB、online business と SaaS の禁止 → ある

### 未検証
- 新しく書く初級の文と解説の縮み方（3 の見積もりは、代わりの文を 0.8 で直した値）。G1 で下書きを実際に測り、G3 の `BUDGET2_` で確かめる。
- 文言と JS の増え方（3 の見込み）。G2 で check-budget で数える。
- r2 から持ち越した実機の項目（iOS のホーム画面の Web アプリで書き出しと読み込みができるか、アプリ内ブラウザの保存先）。G4 で確かめる。
- E-18 の Brilliant と Exercism、E-16 の Yu-kai Chou の引用は今回は開いていない（関門の条件の「1 件以上」は上で満たした）。

### spike の後始末
spike はスクラッチパッドの中だけで行った（/private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/spike/ の budget.mjs、gen-tasks.mjs、load.mjs、tasks-252x600.json、dist-base/、dist-big/）。リポジトリには何も書いていない。静的サーバーとブラウザは閉じた。コミットはしていない。

### 大きな判断なので、反論してほしいこと（reviewer）
2 の「formatVersion 1 のまま、公開前に ID を付け替え、ID の凍結は最初の公開から」という案。G1 で ADR 0002 の書き換えとして出すので、そこで反論してほしい。

## 記録（指揮役が保存するときに書き足す）
- 関門：G0
- 判定した役：tech-lead
- 回：r3
- 対象：docs/prd/001-daily-learning.md r8、docs/prd/product.md r4（feat/001-daily-learning、0ff6a82...967aca1）
- 日付：2026-11-05
