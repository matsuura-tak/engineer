# 001-daily-learning G0 tech-lead r2

判定：PASS（重大0件、要修正4件、提案5件）
対象：feat/001-daily-learning の HEAD e591480。docs/prd/001-daily-learning.md（r3、418行、AC-1〜AC-27）
観点：実現性、非機能要件、費用、第1部の根拠（docs/org/gates.md の G0 のうち tech-lead の項目）
日付：2026-10-29

## 指摘
r1 の重大2件はどちらも直っている。E-6 と E-7 の引用は、自分でページを開いて原文どおりにあることを確かめた。「G0 の前の確認」の12項目もすべて満たしている。27件の AC はどれも、サーバーなしの静的な Web アプリとして作れる（spike で確かめた）。

ただし、G1 の前に直してほしい要修正が4件ある。とくに Y1 は、Q2 の推奨（E 案）と 10 章の書き方が食い違っている。

- 要修正 Y1：docs/prd/001-daily-learning.md:126 と :129、:396（Q2 の E 案）。新しい版の配り方を確かめる AC がない
  - :126 は「v1 の Service Worker は配布物のキャッシュだけ。更新の配り方は 002 以降」と書いている。一方で、Q2 の推奨 E 案は「公開後14日までに残りの126件を足す」。キャッシュを先に返す Service Worker では、配り直した課題集やバグの直しが、すでに使っている人に届かない作りにもなりえる。届かなければ、15日目から task.exhausted が出て、28日の判定（13）が崩れる。
  - spike の結果：sw.js のバイトを変え、キャッシュの名前を v2 にし、skipWaiting と clients.claim を入れて配り直した。2秒おきに読み込み直すと、Chromium と WebKit の両方で2回目の読み込みから新しい課題集（4件）に切り替わった。保存データは残った。0.5秒おきだと、Chromium では3回目でもまだ古いまま（2,2,2）だった。切り替わる時機は一定ではない。
  - 直す方向：:126 を「バックグラウンドでの更新と通知は 002。新しい版に切り替わる仕組みは v1 に入れる」と書き分ける。AC を1つ足す。例：「配布物を新しい版に差し替えた後、オンラインで読み込みを3回以内くり返すと新しい課題集が使われ、履歴と診断は変わらない」。
- 要修正 Y2：:297（AC-23）と :231（AC-12）。Service Worker があると「ネットワークへの送信は 0 件」を数え違える
  - Service Worker がキャッシュから返した要求でも、Playwright の request イベントは出る。spike：オフラインで、再読み込み、次の日の読み込み、新しいタブを1回ずつ行った。実際にはネットワークに出ていないのに、page の request イベントは9件、両方のブラウザで出た。応答はすべて fromServiceWorker が true だった。request イベントをそのまま数えるテストは、正しく作った実装でも落ちる。
  - 直す方向：「送信」を「Service Worker が返していない応答（response.fromServiceWorker() が false）と、失敗した要求（requestfailed）の合計」と定義する。PRD に1行書くか、「数え方は tech-lead が contracts/ に決める」と書く。
- 要修正 Y3：:327 と :331（12 の非機能要件）。測り方が足りない行がある
  - 「配布」の行（HTTPS、meta の CSP）には、数字も測り方もない。直す方向の例：「http:// を開くと https:// に転送される（curl -sI で 301）」「本番の HTML に Content-Security-Policy の meta が1つある（grep）」。
  - 150KB の測り方が「本番の配布物を curl --compressed で取る」になっている。G3 の時点では、まだ本番に公開していない（本番デプロイは Takuma だけが行う）。ローカルの静的サーバーは圧縮しないことが多い。直す方向：G3 では「配布物の各ファイルを gzip -9 で圧縮した大きさの合計」、公開後は「本番の URL に curl --compressed」と分ける。
- 要修正 Y4：:26（E-5）、:40、docs/prd/product.md:23。Mimo の件数が実際と違う
  - PRD は Mimo を「日本語ないんか」の1件としているが、JP の RSS（47件）には日本語への対応を望むレビューが7件ある（2026-02-22、2025-11-07、2025-07-28、2024-12-14、2024-11-04、2024-04-09、2021-11-06）。少なく書いているだけで主張は崩れないが、根拠の数字としては誤り。直す方向：「47件中7件」に直す。product.md の「各1件」も同じように直す。他のアプリの件数は合っていた（Sololearn は57件中7件、Codecademy Go は8件中1件）。

提案（作り手に任せる。一部は G1 で tech-lead が決める）：
- 提案 P1：:289（AC-22）。Given に iOS の条件がない。そのままでは、デスクトップの Chrome で「アプリとしてインストール」した人や、Android でインストールした人にも「Safari のデータは引き継がれない」が出る。これらの環境では保存をブラウザと共有するので、文言が当てはまらない。直す方向：Given に「UA が iOS」を足すか、文言を Safari に限らない書き方にする。
- 提案 P2：:157（iOS Safari の判定は UA による）。iPadOS の Safari は既定で Mac の UA を送る（WWDC19 Session 203。https://www.macrumors.com/2019/06/06/safari-on-ipados-optimized-for-desktop-websites ）。UA だけで判定すると iPad の人に案内が出ない。G1 で `navigator.maxTouchPoints > 1` を加える案を検討する。また、LINE や Slack のアプリ内ブラウザで開いた人は、保存の行き先が Safari と別になることがあるが、7 の失敗2に入っていない。実機でしか確かめられない（未確認）。
- 提案 P3：:349（13 の「表示までの時間」の行）。A 案では、判定日の 2026-12-14 に測る手段がない。直す方向：AC-24 の統計に、最後の load_ms を9つ目の値として足す。または、判定日を G4 にする。
- 提案 P4：:312-316（AC-26）。ja でも en でもない言語（fr など）のときにどちらを出すかが書いていない。1行で決めると期待値が揺れない。
- 提案 P5（G1 で tech-lead が決める項目の記録）：AC-12 は最初の読み込みの後にオフラインでどの領域でも診断して課題を出す必要があるため、全領域の課題集を最初の読み込みで持つか、Service Worker で先に取っておく必要がある（r1 の「その日の領域の1ファイルだけ読む」案は使えない）。圧縮後 150KB に収まるかは課題1件の長さで決まる（この PRD の日本語は gzip で約0.33倍：69,216 → 22,733 バイト。1件が約400字なら収まり、600字前後だと超える見込み［推測］）。Service Worker があるテストでは page.route でタスク集を差し替えられないので、差し替えるテストは serviceWorkers: 'block'、AC-23 は 'allow' で動かす。時刻の固定は `?now=` ではなく context.clock を推奨。どうしても `?now=` を使うなら、Service Worker は URL の引数を無視して応える作り（ignoreSearch）にする。

## 証拠

### 読んだファイル
docs/prd/001-daily-learning.md（全418行）、docs/prd/product.md（全68行）、docs/reviews/001-daily-learning-G0-tech-lead-r1.md、docs/reviews/001-daily-learning-G0-verifier-r2.md、docs/templates/prd.md、docs/org/gates.md、.claude/org/app.json（stacks ["backend"]、commands は空）、CLAUDE.md、docs/templates/review-report.md

### r1 の指摘ごとの追跡
| r1 の指摘 | 結果 | 証拠（r3 の行） |
|---|---|---|
| 重大1 ホーム画面の Web アプリが Safari と保存を共有しない | 直った | :28 の E-7 に Bug 181849 Comment 3 の原文（ページで確認済み）。手当てが :59、:84、:92、:98、:119、:142。:148 で案内を diagnosis.start の前に出す。AC-21（:282-287）の手順に書き出しと読み込み。AC-22（:288-293）でホーム画面から初めて開いたときの読み込みの案内。:5 で削る順も決めた |
| 重大2 E-6 の freeCodeCamp の引用 | 直った | :27 の「they just say "Write this code" but there's not nearly enough explanation」（Jeffrey Bortolin、2024-09-05）がページにあった。TJ の 2026-03-17 もあった |
| 要修正 オフラインでの再読み込み（Service Worker） | 直った | :117 でやることに入れた。:126、AC-23（:294-299）、:328。配り直しの扱いは新しい Y1 |
| 要修正 12 の数字と測り方 | 一部直った | 500ms、150KB と測り方、:332 のアクセシビリティは直った。:331 の配布の行と 150KB の測る時機が残る（Y3） |
| 要修正 13 の統計の画面と AC | 直った | :115、AC-24（:300-305）の8つの値、:337、13 の表の A の列 |
| 要修正 B 案の説明 | 直った | :338、E-11（:32）、Q1（:395） |
| 要修正 IP の記録 | 直った | :14、:31（E-10）、:329、:362、:385、product.md:19、:45 |
| 要修正 AC-15 の計測の条件 | 直った | :247、:250 |
| 要修正 つなぎ口を本番に入れない | 直った | :160、:141 |
| 要修正 E-5 の出典と件数 | 一部直った | URL は直った。Sololearn（57件中7件）と Codecademy Go（8件中1件）は合っている。Mimo の「1件」は誤り（Y4） |
| 提案 AC-20 の版番号 | 直った | :156、:140、AC-25（:306-311） |
| 提案 Enki の日付 | 直った | :23、:39。RSS で確認 |
| 提案 時間の枠と課題集の量 | 直った | :5、Q2（:396） |
| 提案 AC-8 の確かめ方 | 直った | :207-208。7通りで、実装の関数を呼ばない形 |
| 提案 組織の形 | Takuma に回った | Q9（:403） |

### 「G0 の前の確認」を自分で確かめた結果
| 項目 | 結果 | 証拠 |
|---|---|---|
| 3 にアプリ3件以上とアプリ以外の代替。アプリの行に URL と引用 | 満たす | アプリ4件（:39-42）、Web 3件（:43-45）、アプリ以外（:46）。RSS で引用と日付をすべて確認 |
| 根拠に印があり、［推測］だけの結論がない。URL が3つ以上 | 満たす | E-1〜E-11 に印。引用はすべてページにあった（件数の誤りは Y4） |
| Job が1つで、画面名と機能名がない | 満たす | :17 |
| 機会と解決案がそれぞれ3つ以上 | 満たす | 機会4つ（:64-67）、解決案5つ（:72-76） |
| 6 の全行と 7 の5行、結び付けた先 | 満たす | 6 は6行（:81-86）、7 は5行（:91-95） |
| 8 の推奨、いちばん強い反論、作らない場合 | 満たす | :98-100 |
| 9 のすべてに Kano と効く機会 | 満たす | :109-120 の12行 |
| 10 のやらないことと理由 | 満たす | :124-135 |
| 全 AC に Given、When、Then、確かめ方、効く機会があり、曖昧な語がない | 満たす | grep で各27件。曖昧な語は0件 |
| 13 にガードレールがあり、主の指標が見かけの指標でない | 満たす | :343-349。測る手段の穴は P3 |
| 14 の全行に数値、日付、行動、pdm 以外の判定役 | 満たす | :354-359 |
| 15 の全イベントにプライバシー表示の区分 | 満たす | :366-378 の13件 |

### AC ごとの実現性（構成：静的な HTML、CSS、JS、Service Worker を GitHub Pages で配る。テストは Playwright の Chromium と WebKit）
| AC | 判定 | 根拠 |
|---|---|---|
| AC-1 | 作れる | 標準の DOM。500ms はテストの側で計れる |
| AC-2 | 作れる | 同梱の JSON から規則で選ぶ |
| AC-3 | 作れる | タスク集の JSON Schema を G1 で contracts/ に書く |
| AC-4 | 作れる（技術の面） | 件数は Q2 の危険 |
| AC-5 | 作れる | spike A：context.clock と Service Worker を併用し、オフラインで再読み込みしても固定した時刻のまま |
| AC-6 | 作れる | r1 spike 1、spike A |
| AC-7 | 作れる | 状態と履歴を保存するだけ |
| AC-8 | 作れる | seed と context.clock で翌日に開き、data-task-level を読む |
| AC-9 | 作れる | 未回答は読み込みのときに判定する |
| AC-10 | 作れる | spike B：Service Worker が効いていると page.route で差し替えられない。serviceWorkers:'block' なら差し替わる。両ブラウザで同じ |
| AC-11 | 作れる | r1 spike 4 |
| AC-12 | 作れる | r1 spike 5。「送信」の数え方は Y2 |
| AC-13 | 作れる | r1 spike 3 |
| AC-14 | 作れる | 診断と履歴を別に持つ |
| AC-15 | 作れる | r1 spike 6。CDP による制限は Chromium だけ |
| AC-16 | 作れる | 自分のキーだけを消す |
| AC-17 | 作れる | 幅 320 の viewport と計算済みのスタイル |
| AC-18 | 作れる | activeElement と :focus-visible |
| AC-19 | 作れる | r1 spike 7。iOS 実機のホーム画面 Web アプリで保存できるかは未確認（未検証1） |
| AC-20 | 作れる | file input とスキーマの検査 |
| AC-21 | 作れる | spike C：devices['iPhone 15'] の UA と standalone=false で案内が出た（両ブラウザ）。UA の偽装なしでは出なかった |
| AC-22 | 作れる | spike C：Navigator.prototype.standalone を true にすると読み込みの案内が出て、ホーム画面の案内は出なかった（両ブラウザ）。iOS 以外の扱いは P1 |
| AC-23 | 作れる | spike：Service Worker でキャッシュの照合時に URL の引数を無視する（ignoreSearch）作りなら、オフラインの再読み込み、次の日の `?now=`、新しいタブがすべて task.today になった（16〜37ms）。引数まで一致させる作りでは失敗。送信の数え方は Y2 |
| AC-24 | 作れる | seed の値は筋が通っている |
| AC-25 | 作れる | 版番号の比較 |
| AC-26 | 作れる | Playwright の locale |
| AC-27 | 作れる（新しい依存。テストだけ） | spike D：@axe-core/playwright 4.14.0 で両ブラウザとも color-contrast（serious）と button-name（critical）を見つけた。G1 で contracts/dependencies.md に足す |

### 公開と権限で気になる点
r1 の項目（IP の記録、meta の CSP、origin の共有、通知なし、読み込むファイルは信頼できない入力）は変わらない。新しく気になる点：Service Worker の配り直し（Y1）、iPad とアプリ内ブラウザ（P2）。新しい信頼の境界：読み込むファイルと、テスト用ビルドの URL の引数（本番に入れないことは :160）。

### 利用者1,000人あたりの月の費用
0円で、r1 から変わらない。GitHub Pages は無料（1 GB、月 100 GB の soft limit をページで確認）。1,000人 × 月30回 × 最大150KB でも約4.5GB/月。Service Worker の後はほとんどがキャッシュから出る。GoatCounter も無料。独自ドメインにする場合だけ年額がかかる（料金は未確認）。

### 開いた URL と確認結果（2026-10-29）
- https://se.trustpilot.com/review/freecodecamp.org と ?page=2：Jeffrey Bortolin 2024-09-05、TJ 2026-03-17、Andrea 2024-08-19 の引用あり。41件、3.5 も一致
- https://bugs.webkit.org/show_bug.cgi?id=181849：Comment 3（2022-02-01）の原文あり。Status NEW
- https://www.macrumors.com/2025/06/18/safari-changes-on-ios-26/：「every website added to the Home Screen via Safari opens as a web app, even if it is not configured to be.」あり
- https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/：7日の記述と「Web applications added to the home screen are not part of Safari and thus have their own counter of days of use.」あり
- https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages（E-10）：IP の記録の文あり
- https://www.goatcounter.com/help/sessions（E-11）：「concat(siteID, User-Agent, IP)」「8 hours」「never stored」あり
- https://www.goatcounter.com/：「doesn't track users with unique identifiers and doesn't need a GDPR notice」あり
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits：1 GB と月 100 GB
- https://playwright.dev/docs/service-workers：serviceWorkers: 'block'、fromServiceWorker() の説明あり
- Apple のレビュー RSS：Sololearn JP 57件中7件（一致）、Mimo JP 47件中7件（PRD の1件と食い違う：Y4）、Codecademy Go JP 8件中1件（一致）、Enki US 201件（引用3件を確認）
- iPadOS の UA：https://www.macrumors.com/2019/06/06/safari-on-ipados-optimized-for-desktop-websites 、https://developer.apple.com/videos/play/wwdc2019/203

### 実行したコマンドと結果
- `grep -cE '^- AC-[0-9]+：' docs/prd/001-daily-learning.md` → 27。Given、When、Then、確かめ方、効く機会 → 各27件。曖昧な語の grep → 0件。AC-1〜AC-27 で抜けなし
- Apple の RSS を python3 -I で読んだ → 上の件数と日付
- `wc -c` と `gzip -9c | wc -c`（PRD の日本語で圧縮の比率）→ 69,216 → 22,733 バイト
- spike（Playwright 1.64.1、@axe-core/playwright 4.14.0、node v24.22.1。スクラッチパッドの中、静的サーバー 127.0.0.1:8765）
  - t_sw.js：`chromium ign reload same ?now state=task.today … ms=16`、`chromium ign goto next-day ?now state=task.today`、`chromium ign new tab same url state=task.today ms=23`、`chromium ign page requests 9`（responses はすべて [SW]、failed []）、`chromium exact reload same ?now FAIL page.reload: net::ERR_FAILED`。WebKit の ign も成功（18〜37ms）、exact は "Load failed"
  - t_misc.js：A `clock+SW offline reload now= 2026-11-01T23:00:00.291Z`（両ブラウザ）。B `route tasks.json with serviceWorkers=allow … 2`、`=block … 3`。C `iPhone15 UA standalone-spoof=false … guide=true importMsg=false`、`=true … guide=false importMsg=true`、`no UA spoof … guide=false`。D `axe 4.14.0 violations: ["button-name:critical","color-contrast:serious"]`
  - t_upd.js：0.5秒おき `chromium … 2,2,2`、`webkit … 2,2,4`。2秒おき `chromium … 2,4,4,4,4`、`webkit … 2,4,4,4,4`、`localStorage kept= {"d":1}`
- `git status --short` → 空

### 未検証（Takuma か G4 に回す項目）
1. iOS 実機のホーム画面 Web アプリでの書き出し（Blob と a[download]）と、file input での読み込み。AC-19 と AC-22 の流れの要。Takuma への質問：G4 で実機（iOS 26）を使い、「Safari で書き出す → ホーム画面に追加 → ホーム画面から読み込む」を試してもらえるか。失敗したときの代わりの案：G1 で Web Share API を検討する。それでもだめなら、:5 の順に従って AC-21 と AC-22 を削る。
2. persist() で許された保存が ITP の7日消去を免除されるか。設計はこれに頼らない（:84）。
3. 実際の課題集を圧縮した後の大きさ（P5）。G1 で下書きを使って測る。
4. アプリ内ブラウザ（LINE、Slack など）での保存の行き先（P2）。実機でしか確かめられない。
5. 独自ドメインの料金（Q7）。

書いたファイルはない。コミットもしていない。spike はスクラッチパッドの中だけで行い、静的サーバーは止めた。
