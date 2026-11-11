# 001-daily-learning G0 tech-lead r1

判定：FAIL（重大 2 件、要修正 9 件、提案 5 件）
対象：feat/001-daily-learning の HEAD 0939c32。docs/prd/001-daily-learning.md（r2 Web 版、366 行）
観点：実現性、非機能要件、費用、第1部の根拠（docs/org/gates.md の G0、tech-lead の項目）
日付：2026-10-29
指揮役の注記：iOS 向けの r1 は方針変更のため途中で止めた。これが Web 版への最初の tech-lead 判定。

## 指摘
重大が2件あるので FAIL です。どちらも PRD を数行直せば済みます。技術の面では、21件すべての AC がサーバーなしの Web アプリとして作れます（下の「AC ごとの実現性」）。

- 重大、docs/prd/001-daily-learning.md:57、:82、:90、:115、:270-275（AC-21）、:28（E-7）
  - 何が問題か：データ消失への手当てが「ホーム画面に追加すれば Safari の7日消去を避けられる」という前提に乗っていますが、この前提は成り立ちません。iOS のホーム画面の Web アプリは、Safari と保存を共有しません。
  - 根拠1：WebKit Bug 181849 の Comment 3（2022-02-01）に "The current behavior (on Apple platforms) is by design." "Home Screen apps are created as isolated entities without shared state with the browser." とある（https://bugs.webkit.org/show_bug.cgi?id=181849 、状態は NEW のまま）。
  - 根拠2：iOS 26 からは、ホーム画面に追加したサイトがすべて既定で Web アプリとして開く（https://www.macrumors.com/2025/06/18/safari-changes-on-ios-26/ ）。
  - 結果：AC-21 は案内を「診断を終えて最初の task.today」で出します。案内に従った人は、ホーム画面から開くと空の状態（diagnosis.start）から始まります。それまでの回答と履歴は Safari 側に残り、7日後に消えます。主に使う端末はスマホです（product.md:10）。手当てに従った人ほど「データが消えた」というガードレール（13）に当たります。
  - 直す方向：
    - iOS の Safari で、まだホーム画面の Web アプリになっていない場合（display-mode: standalone でない場合）は、診断の前（diagnosis.start）に案内を出す。
    - または、案内の中で書き出しと読み込み（AC-19、AC-20）による引き継ぎを手順に入れる。
    - E-7 と 6 の「今ある証拠」に、保存が共有されないことを書き足す。
    - ホーム画面から初めて開いたときのふるまいを AC に足す。
- 重大、docs/prd/001-daily-learning.md:27（E-6）
  - 何が問題か：freeCodeCamp への不満として引いた「Write this code…without explaining」は、この形ではページにありません。
  - 確かめた結果：https://se.trustpilot.com/review/freecodecamp.org の1ページ目にも2ページ目にも、"without explaining" はない。2ページ目にあるのは、Jeffrey Bortolin（2024-09-05）の「they just say "Write this code" but there's not nearly enough explanation」。3ページ目は 404。
  - 手引きの基準では、ページにない引用は重大になります。主張の中身は同じページで支えられているので、直すのは1行です。
  - 直す方向：原文どおりに引き直す。3 の表（:42）の「Many steps and explanations are skipped」はそのまま使えます。
- 要修正、docs/prd/001-daily-learning.md:122 と :279（オフラインでの再読み込み）
  - オフラインでの再読み込み（Service Worker）が v1 の外になっていますが、v1 に入れるべきです。
  - 根拠（spike 5 と 8）：Service Worker がないと、オフラインでの再読み込みは Chromium で net::ERR_INTERNET_DISCONNECTED、WebKit で "internal error" になった。Service Worker を入れると、両方とも task.today を出せた。
  - 実際の使われ方：ホーム画面の Web アプリは起動のたびに読み込み直します。モバイルの Safari も、裏に回したタブを読み込み直すことがあります。このため、通勤中のオフラインでは AC-12 の想定（再読み込みなし）がほとんど成り立ちません。
  - 費用：Service Worker は約10行で、依存ライブラリは要りません。
  - 直す方向：9 の「やること」に移し、「一度読み込んだ後はオフラインで再読み込み（ホーム画面からの起動を含む）しても task.today か task.done が出る」AC を足す。
- 要修正、docs/prd/001-daily-learning.md:278、:283（12 の非機能要件）：数字か測り方のない行があります。
  - 「診断の各質問の切り替えは 0.5 秒以内」：測り方がない。
  - 「初回の転送量の上限」：数字がない（G1 で決める案は下の (b)）。
  - 「すべての操作にアクセシブルな名前」と「コントラスト（designer が G1 で3通り）」：測り方と数字がない。「3通り」は iOS の考え方で、Web では WCAG 1.4.3（4.5:1）を axe などの監査で数える形になる。
  - 直す方向：行ごとに「数字と測り方」の組にする。
- 要修正、docs/prd/001-daily-learning.md:113 と :288（13 の計測）
  - A 案では、主の指標と撤退基準（14 の全行）を「設定の画面の統計」で測ります。ところが、その画面を確かめる AC がありません。さらに、9 の統計の項目（出した件数、完了した件数、役に立った件数）には、13 と 14 の判定に要る値の一部がありません。
  - 足りない値：直近7日の完了日数、初めて開いた日の完了、「難しすぎ」の件数。
  - 直す方向：統計の画面に出す値を 13 の指標と1対1にそろえ、その表示を AC にする。
- 要修正、docs/prd/001-daily-learning.md:288（13 の B 案の説明）
  - 「B を選ぶ場合は、同じ指標を 15 のイベントの件数から出す」は成り立ちません。
  - 根拠：GoatCounter のセッションは「site、User-Agent、IP」から作った鍵を8時間だけ持ち、IP と UA を保存しない（https://www.goatcounter.com/help/sessions ）。そのため、利用者ごとの指標（:295、:296、:297）は件数から出せない。:344 の Q1 の反論とも食い違っています。
  - 直す方向：B で出せる指標と出せない指標を書き分ける。
- 要修正、docs/prd/001-daily-learning.md:14、:280、:334（データの外への送信）
  - 「どこにも送りません」と書いていますが、配信元の GitHub Pages は訪問者の IP アドレスを記録します。
  - 根拠：「the visitor's IP address is logged and stored for security purposes」（https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages ）。
  - 直す方向：「入力したデータはブラウザの外に送らない。ページの配信元（GitHub）は接続の記録として IP アドレスを保存する」と書き分け、docs/support/ のプライバシーのページにも入れる。
- 要修正、docs/prd/001-daily-learning.md:237（AC-15）の「ネットワークの制限なし」
  - この条件では何も測れません。
  - 根拠（spike）：制限なしの localhost では 12〜16ms（Chromium）、9〜11ms（WebKit）。遅い回線を模した条件（遅延 150ms、下り 1.6Mbps、CPU 4倍遅い。Chromium の CDP で設定）で、未圧縮 245KB のタスク集を読むと、1,665〜1,674ms。2秒の線に近い。Playwright の page.clock は performance も上書きする（https://playwright.dev/docs/clock ）。このため AC-15 の計測では、時刻を固定するつなぎ口を使えない。
  - 直す方向：環境を「tech-lead が contracts/ に決めた回線と CPU の制限の下で」に変える。
- 要修正、docs/prd/001-daily-learning.md:148（11 章冒頭のテストのつなぎ口）
  - URL の引数（例：?reset=1、?taskset=、seed）を本番の配布物に入れると、データを消したり書き換えたりする仕掛けになります。誰かがリンクを送るだけで、受け取った人のデータを消せてしまいます。
  - 直す方向：「つなぎ口は本番の配布物に入れない（テスト用のビルドだけか、テストのコード側から差し込む）」と1行書く。具体的な形は G1 で決めます（下の (e)）。
- 要修正、docs/prd/001-daily-learning.md:26（E-5）
  - 出典の「上の3つの URL」は Enki、Sololearn、Mimo を指しますが、本文は Codecademy Go を挙げています。
  - 確かめた結果：Codecademy Go の不満は https://apps.apple.com/jp/app/codecademy-go/id1376029326 にあった（RSS の8件中1件「日本語で翻訳出来る様にして欲しい」2025-04-30）。Sololearn の「日本語に対応してほしい」は 2018-01-24 の1件だけで、「繰り返し」の裏付けとしては弱い。
  - 直す方向：URL を正し、件数を書く。
- 提案、docs/prd/001-daily-learning.md:267（AC-20）：「形式の版番号が合わない」をすべて拒むと、v2 のときに v1 のファイルを読めません。「今の版以下は移して読み込み、今より新しい版は拒む」と書くと、後で AC を変えずに済みます。
- 提案、docs/prd/001-daily-learning.md:37、:38：Enki の引用は 2019-03-07 と 2024-02-13 のもので、古いものを含みます。引用に日付を付けてください。引用はアプリのページの HTML ではなく、Apple のレビュー一覧（RSS）にありました。出典の書き方は今のままでよいです。
- 提案、docs/prd/001-daily-learning.md:5、:112、:345（時間の枠と課題集の量）：252件を1週で下書きすると1日に約50件です。Takuma が全件を見る時間（1件2分として約8時間）も3週の中に要ります。これは技術ではなく枠の危険なので、Q2 と一緒に Takuma に見せてください。
- 提案、docs/prd/001-daily-learning.md:196（AC-8）：「段階を決める処理の自動テスト」は、実装の関数を受け入れテストから呼ぶ形になりやすいです。受け入れテストはそのフォルダの設定だけで動かす決まりなので、5通りを「seed したブラウザで翌日の data-task-level を見る」形にすることを勧めます。
- 提案（Takuma への質問。指揮役経由）、組織の形について
  - gates.md の G2（backend-engineer の変更の「本物の DB で結合テスト」「API1〜API10」）、G4（TestFlight）、G5（審査提出）は、静的な Web アプリには当てはまりません。
  - G1 の「spectral と oasdiff の出力」は、HTTP の API がないため「未検査（API なし）」になる見込みです。
  - backend/ を公開する方法：Pages はブランチから公開する場合、ルートか /docs しか選べません（https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site ）。/docs は組織の文書なので使えません。残る道は、.github/ の Actions のワークフロー（Takuma だけが触れる）か、gh-pages ブランチです。
  - どれも PRD の外の話なので、G0 の判定には数えていません。

## 証拠
- 読んだファイル：docs/prd/001-daily-learning.md（全行）、docs/prd/product.md、docs/templates/prd.md、docs/org/gates.md（G0）、docs/templates/review-report.md、docs/reviews/001-daily-learning-G0-verifier-r1.md、docs/progress.md、.claude/org/app.json、CLAUDE.md、contracts/dependencies.md（表は空）。docs/adr/ は空。backend/ と ios/ はまだない。

### 「G0 の前の確認」を自分で確かめた結果
| 項目 | 結果 | 証拠の PRD の行 |
|---|---|---|
| 3 にアプリ3件以上、アプリ以外の代替1つ以上、アプリの行に URL と引用 | 満たす | :37-40 にアプリ4件（すべて URL と引用あり。Apple の RSS で引用がすべて見つかった）、:41-43 に Web 3件、:44 にアプリ以外 |
| 根拠に印、［推測］だけの結論がない、URL が3つ以上 | 印は満たす（URL 18種）。引用の正しさは満たさない | :27 E-6 の引用がページにない（重大）。:26 E-5 の出典がずれている（要修正） |
| Job が1つで、画面名と機能名がない | 満たす | :17 |
| 機会と解決案がそれぞれ3つ以上、採った理由と捨てた理由 | 満たす | 機会は :62-65 の4つ、解決案は :70-74 の5つ |
| 6 の全行と 7 の5行、結び付けた先 | 形は満たす | :79-84、:89-93。ただし :82 の証拠に事実の誤りがある（重大1） |
| 8 の推奨、いちばん強い反論、作らない場合 | 満たす | :96-98 |
| 9 のすべてに Kano と効く機会 | 満たす | :107-116 |
| 10 のやらないことと理由 | 満たす | :120-130 |
| 全 AC に Given、When、Then、確かめ方、効く機会があり、数字のない形容詞がない | 満たす | `grep -cE '^- AC-[0-9]+：'` → 21。各欄も21件ずつ。曖昧な語の grep は0件 |
| 13 にガードレールがあり、主の指標が見かけの指標でない。基準値と判定日 | 満たす | :293-299。測る手段の穴は要修正 |
| 14 の全行に、数値、日付、行動、pdm 以外の判定役 | 満たす | :304-309 |
| 15 の全イベントにプライバシー表示の区分 | 満たす | :316-327 の12件 |

### AC ごとの実現性（構成：静的な HTML、CSS、JS と GitHub Pages。テストは Playwright）
| AC | 判定 | 根拠 |
|---|---|---|
| AC-1 | 今の構成で作れる | 標準の DOM。テストに Playwright（新しい依存。テストだけで使う。G1 で dependencies.md に足す） |
| AC-2 | 作れる | 同梱の JSON から規則で選ぶだけ。1秒の線には余裕がある |
| AC-3 | 作れる | タスク集の JSON Schema を G1 で contracts/ に書く |
| AC-4 | 作れる（技術の面） | 件数を数えるだけ。252件を書くことは Q2 と時間の枠の危険 |
| AC-5 | 作れる | spike 1：時刻を固定すると、読み込み直しても 2026-11-02 のまま |
| AC-6 | 作れる | spike 1：timezoneId を Asia/Tokyo にし、時刻を 2026-11-01T15:30Z に固定すると、端末の日付が 2026-11-02 になった |
| AC-7 | 作れる | 状態と履歴を保存するだけ |
| AC-8 | 作れる | 純粋な関数で書ける。受け入れテストはブラウザと seed で（提案） |
| AC-9 | 作れる | 未回答を残すのは読み込みのときに判定する |
| AC-10 | 作れる | テスト用のタスク集への差し替えは、本番の配布物に入れない（要修正） |
| AC-11 | 作れる | spike 4：Storage.prototype.setItem を差し替えると QuotaExceededError を注入できた（Chromium、WebKit） |
| AC-12 | 作れる（再読み込みなし） | spike 5：オフライン中の操作の送信は 0 件。再読み込みは Service Worker なしで失敗、ありで成功（spike 8） |
| AC-13 | 作れる | spike 3：persist() の拒否を注入できた。ヘッドレスの Chromium と WebKit は何もしなくても false を返した。「許された」側の試験にも差し替えが要る |
| AC-14 | 作れる | 診断と履歴を別のキーで持つ |
| AC-15 | 作れる（計測の条件の直しが要る） | spike 6：アプリが自分で計った値を data 属性に出せた。制限なしの localhost では無意味（12ms）。clock と一緒に使えない |
| AC-16 | 作れる | 同じ持ち主の github.io のページは origin を共有する（PSL に載るのは github.io の単位）。消すのは自分のキーだけにする |
| AC-17 | 作れる | 拡大率は Playwright で直接設定できないので、幅 320 CSS px の viewport で代える（WCAG 1.4.10 の定義と同じ）。監査には axe-core を使う（新しい依存、テストだけ） |
| AC-18 | 作れる | キーボードの操作と、計算済みのスタイルでフォーカスの枠を確かめる |
| AC-19 | 作れる | spike 7：Blob と a[download] で export.json をダウンロードし、中身を読めた。iOS 実機のホーム画面 Web アプリでの保存は未確認 |
| AC-20 | 作れる | file input と JSON の検査で作れる。読み込むファイルは信頼できない入力なので、textContent で表示し、スキーマで検査する |
| AC-21 | 作れる（表示と1回だけ） | ただし狙いの効果が出ない。ホーム画面の Web アプリは保存を共有しない（重大1） |

### pdm が確かめてほしいと言っている点
- (a) 保存の方式：localStorage のキーを1つ（アプリ名と v1）にし、中身を書き出しファイルと同じ形の JSON（formatVersion を持つ）にすることを推奨［推測］。persist() は Safari では「ホーム画面の Web アプリとして開いたか」などの経験則で許される（https://webkit.org/blog/14403/updates-to-storage-policy/ ）。persist() が ITP の7日消去を免除するかは公式の記述がなく「未確認」。設計はこれに頼らない。決めるのは G1 の ADR。
- (b) 対応ブラウザ：推奨は Safari 17 以上（iOS、macOS）と Chrome の最新2版（Android、PC）。CI は Playwright の Chromium と WebKit。AC-15 は Chromium で CDP の回線と CPU の制限（遅延 150ms、下り 1.6Mbps、CPU 4倍遅い）の下で測る。初回の転送量の上限は圧縮後の合計で 150KB 以下を案にする。タスク集を領域ごとの JSON に分け、その日に使う1つだけを読む［推測］。実機の Safari での確認は G4 で Takuma に頼む。
- (c) Service Worker は v1 に入れることを推奨（要修正）。
- (d) GitHub Pages の規約：商用でない無料の公開は範囲内。1GB、月 100GB が目安。「online business」「SaaS」は禁止なので、将来の課金のときは配信先を変える。リポジトリは PUBLIC なので Free のプランでも使える。公開の経路は .github/ のワークフローが要る（Takuma の作業）。
- (e) つなぎ口は G1 で contracts/ に書ける形。多くは Playwright の側から差し込めるので、アプリにコードは要らない。アプリの側に要るのは data-testid と data-task-*、data-debug-load-ms、テスト用タスク集の置き場所、seed の形の4つだけ。contracts/ に書く中身：タスク集と書き出しファイルの JSON Schema（2020-12）と、つなぎ口の一覧。OpenAPI はないので spectral と oasdiff は使わない。

### 公開と権限で気になる点（Web なので審査はない）
- 配信元：GitHub Pages は IP を記録する（要修正）。HTTP のヘッダーを設定できないので、CSP は meta で書く。meta では frame-ancestors が効かないので、クリックジャッキングの手当てを G1 の脅威モデルに入れる。
- 同じ origin：既定の URL（<owner>.github.io/<repo>）にすると、Takuma の他のプロジェクトのページと保存を共有する。独自ドメインなら分かれる（Q7 に関係する）。
- ブラウザの権限：v1 は通知を使わない。persist() は Chrome では聞かずに経験則で決まる。カメラ、位置、クリップボードは使わない。
- データ保護：外部に送るのは B 案の GoatCounter だけ。Cookie はない。読み込むファイルは信頼できない入力として扱う（XSS の対策）。
- 新しい信頼の境界：読み込むファイルと URL の引数の2つ。G1 で STRIDE を軽く書く。

### 利用者1,000人あたりの月の費用
0円。GitHub Pages は無料。帯域は 1,000人 × 月30回 × 300KB で約 9GB/月となり、目安の 100GB の範囲。B 案の GoatCounter も無料。独自ドメインにする場合だけ年額のドメイン代がかかる（料金は未確認）。

### 開いた競合の URL と確認結果（2026-10-29）
- Enki：https://apps.apple.com/us/app/enki-learn-coding-programming/id993753145 。Apple のレビュー RSS（201件）で4つとも見つかった。評価数 1,113 も一致。
- Mimo JP：RSS（47件）で引用4件を確認。評価数 JP 1,033、US 110,885 で一致。
- Sololearn JP：引用3件を確認。評価数 JP 2,591、US 82,126 で一致。
- Progate：引用3件を確認。評価数 1,179 も一致。
- Exercism フォーラム：https://forum.exercism.org/t/what-happens-if-no-mentor-takes-my-request/7271 。2つの引用と日付を確認。
- Exercism Trustpilot：https://ie.trustpilot.com/review/exercism.org 。引用、18件、2.3 を確認。
- freeCodeCamp Trustpilot：https://se.trustpilot.com/review/freecodecamp.org 。2件の引用を確認。「without explaining」はなかった（重大2）。
- roadmap.sh：「All 96 roadmaps」「+3.2M Registered Users」を確認。
- dev.to：2つの引用と 2025-03-07 の日付を確認。
- SmartyMe：RSS で「super long onboarding」（2026-05-11）を確認。
- WebKit 10218（E-7）と 13878（E-8）：記述が PRD と一致。ただし E-7 には保存が共有されない点が抜けている（重大1）。

### 実行したコマンドと結果
- `grep -cE '^- AC-[0-9]+：' docs/prd/001-daily-learning.md` → 21。Given、When、Then、確かめ方、効く機会も各21件。曖昧な語の grep は0件。
- `gh repo view --json visibility` → PUBLIC。`curl -s publicsuffix.org/list/public_suffix_list.dat | grep github.io` → 13833行に github.io。
- Apple の RSS を python3 -I で読み、引用を検索した。
- spike はリポジトリの外（スクラッチパッド）で行った。Playwright 1.64.1、Chrome Headless Shell 156、WebKit 27.2、node v24.22.1。
  - Chromium：`1 clock+tz: {"localDate":"2026-11-02",...}`、`1 after reload: 2026-11-02`、`7 download: export.json {"formatVersion":1,"history":[1,2,3]}`、`3 persisted: false | 4 saveError: QuotaExceededError`、`5 requests while offline (in-page ops): 0`、`5 reload offline without SW: FAIL page.reload: net::ERR_INTERNET_DISCONNECTED`、`8 reload offline with SW: {"testid":"task.today",...}`、`6 load ms (Slow-4G-like 150ms/1.6Mbps, CPU x4, 245KB tasks.json uncompressed): 1674,1674,1674,1674,1665`、`6b load ms (no throttling, localhost): 12,12,16,12,12`
  - WebKit：1、3、4、5、7、8 は同じ。5 の再読み込みは "WebKit encountered an internal error"。6b は 11,9,9,9,10。

### 開いた URL（2026-10-29）
上の競合の URL のほか：https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/ 、https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ 、https://webkit.org/blog/14403/updates-to-storage-policy/ 、https://bugs.webkit.org/show_bug.cgi?id=181849 、https://www.macrumors.com/2025/06/18/safari-changes-on-ios-26/ 、https://playwright.dev/docs/clock 、https://playwright.dev/docs/emulation 、https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist 、https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits 、https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages 、https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site 、https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features 、https://www.goatcounter.com/ 、https://www.goatcounter.com/help/sessions 、https://publicsuffix.org/list/public_suffix_list.dat

### 未検証
1. persist() で許された保存が ITP の7日消去を免除されるか。設計はこれに頼らない前提にする。
2. iOS 実機のホーム画面 Web アプリで、書き出しファイルを保存できるか（AC-19）。G4 で Takuma の実機に頼む。
3. 実際のタスク集を圧縮した後の大きさ。G1 で下書きを使って測る。
4. Firefox で persist() が確認を出すか。
5. 独自ドメインの料金。

書いたファイルはありません。コミットもしていません。spike はスクラッチパッドの中だけで、リポジトリには残していません。
