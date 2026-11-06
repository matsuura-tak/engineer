# 001-daily-learning G0 verifier r3

判定：PASS（重大なし。要修正 2 件、提案 10 件）
対象：feat/001-daily-learning の HEAD e5914806899035b93823019012e4d5143f080d79、docs/prd/001-daily-learning.md（全 418 行、r3 Web 版、AC-1〜AC-27）
観点：受け入れ条件がテストできるか（docs/org/gates.md の G0、verifier の項目）。r2 の要修正 6 件と提案 11 件の追跡
日付：2026-10-29

## 指摘
重大はなし。27 件すべてに番号、Given / When / Then、確かめ方、効く機会があり（grep で各 27 件）、11 章に測れない言葉はない（grep 0 件、終了コード 1）。確かめ方に「自動テスト」を含まない AC は 0 件（r2 では AC-17 の 1 件）。Then はすべて件数、状態の名前、文言キー、data 属性の値、秒数、ミリ秒、ピクセルで書かれている。合否を決められない AC はない。r2 の要修正 6 件はすべて直り、提案 11 件のうち 10 件は PRD に取り込まれ、1 件（app.json）は Takuma の作業で対応済み（stacks は `["backend"]`。commands.backend_test は G1 の後）。

テストの期待値を実装前に固定するために、G1 の前に直してほしい「要修正」が 2 件ある。どちらも数行で済む。

- 要修正、docs/prd/001-daily-learning.md:205-208、AC-8。Given「段階と直近の申告の履歴を seed で投入」の seed が、実装の作りによっては「ありえない状態」になる。段階は領域ごとに保存する（:154 `levels: { backend: "中" }`）ので、段階を「申告のときに更新して保存する」実装なら、`levels.backend = "中"` と履歴 [難しすぎ, 難しすぎ] は同時に存在しない（2 回目の申告の時点で「初」になっているはず）。その実装は seed「中」をそのまま信じて翌日も「中」を出し、利用者から見て正しいのにテストが落ちる。逆に「出すときに履歴から段階を計算する」実装なら seed のとおり通る。どちらが正しいかを PRD の文だけでは決められない。直す方向（どちらか 1 つ）：(a) 確かめ方を「段階と、直近の 1 件を除く申告の履歴を seed で投入し、直近の 1 件は画面で申告してから、時刻を翌日に固定して開く」に変える（実装の作りに依存しない。1 通りあたり 2 日分）。(b) 11 章の状態の説明に「段階は、課題を出すときに申告の履歴から決め直す」と 1 行書く（seed が有効になる）。推奨は (a)。
- 要修正、:303、AC-24。「同じ 8 つの値が画面の文言として見える」のうち `data-stat-first-day-completed` が true のとき、画面に見える文言が何かが決まらない（画面に "true" の文字が出るとは考えにくく、「はい」などの文言になる）。数値 6 つと日付 1 つは文字どおり見えるかを確かめられるが、真偽値だけ期待する文字列を実装前に固定できない。直す方向：「真偽値は文言キー `settings.stats.firstDayCompleted.yes` / `.no` で見える」のように文言キーで書くか、「見える値は数値 6 つと日付 1 つ、真偽値は data 属性のみ」と範囲を狭める。

提案（AC の外、または直すかは作り手に任せる）：
- 提案、:223-225、AC-11。Given「2 問目に答えた状態で、次の 1 回だけ書き込みが例外を返す」と When「2 問目の回答を確定する」は、「各質問の回答を確定するたびに保存する」ことを暗に求めている。診断の最後にまとめて保存する実装だと、2 問目では保存が起きず、エラーが 3 問目の後に出てテストが落ちる。9 章の自己診断の行か AC-11 の Given に「回答を確定するたびに保存する」を 1 行書くと、作り手が迷わない。
- 提案、:289-291、AC-22。Given はスタンドアロン表示だけで、User-Agent の条件がない（AC-21 は iOS Safari の UA を条件にしている）。テストは既定の UA（Chromium、WebKit）で `navigator.standalone = true` にして開くので、実装が「iOS の UA かつスタンドアロン」に絞ると落ちる。意図どおりなら「UA にかかわらず」と 1 語足す。また、題名の「初めて開いたとき」に対し、読み込まずに再読み込みしたときに再び案内が出るかが Then にない（出るなら「保存データがない間は毎回」、出ないなら閉じた印を保存する）。
- 提案、:276-281（AC-20）、:306-311（AC-25）、:156。:156 は「保存データがあるブラウザに正しいファイルを読み込むとき」だけ `settings.import.confirm` を出すと言うが、AC-20（データなし）の When にも AC-25（壊れたファイル）の When にも「確定する」がある。「確定」が確認ダイアログか、ファイルを選んだ後の「読み込む」ボタンかで、テストの手順が変わる（テストは条件分岐を書かない）。流れを 1 行で決めてほしい。例：「ファイルを選ぶ → 検査（版が新しければ `error.import.message`、確認は出さない）→ 保存データがあれば `settings.import.confirm` → 置き換え」。
- 提案、:165、AC-1。進み具合「n / 3」を表示の文字で確かめると、designer の表記（「1/3」「質問 1 / 3」）に依存して揺れる。`diagnosis.progress` の要素に `data-question-index` と `data-question-total` を持たせると、文字の形に依存しない。テストは当面 `/1\s*\/\s*3/` の正規表現で読む。
- 提案、:261、AC-17。「`scrollWidth > clientWidth` となる要素が 0 件」は、課題の「やり方」にコードの断片（`pre` の横スクロール）があると必ず落ちる。課題集にコードを入れないと決めるか、WCAG 1.4.10 の例外（2 次元の配置が要る内容）として `pre` / `code` の `overflow-x: auto` を除くと書く。課題集を書く前に決めた方がよい。
- 提案、:273、AC-19。Then の「含まれる」4 つに「初めて開いた日」がない。seed の形は保存の形式と同じ（:160）で、AC-24 の seed には初めて開いた日が要るので、書き出しファイルにも入るはず。AC-19 の Then に足すと、AC-20 で読み込んだ後に AC-24 の統計が保たれることまで確かめられる。
- 提案、:301-303、AC-24。「直近 7 日」の窓（今日を含む 7 暦日か、昨日までの 7 日か。端末のタイムゾーン）が 13 章にも AC にもない。AC-24 の seed は窓の境目を避けているので合否は決まるが、13 章の KPI の数え方は境目で変わる。1 行で決めると、テストに境界値の 1 通り（7 日前の完了が入るか）を足せる。
- 提案、:216-220、AC-10。確かめ方の「テスト用のタスク集に差し替える」は、タスク集を実行時に fetch で読む作り（下の W-4）と、そのテストで Service Worker を止めることが前提になる。代わりに「目標の領域と段階の 14 件すべてを出し終えた履歴を seed で投入する」形にすると、本番のタスク集のままで差し替えのつなぎ口なしに確かめられる。どちらでも合否は決まる。
- 提案、:319-321、AC-27。監査の 6 画面に、ダイアログ（`task.rate`、`home.addToHomeScreen`、`settings.import.confirm`、削除の確認）と `diagnosis.question` の 3 問それぞれが入っていない。axe-core の監査は 1 画面あたり数秒なので、足しても枠に響かない。
- 提案、11 章全体。「設定の画面」「統計の画面」「履歴の画面」に状態の名前（`data-state` の値）がない（AC-13、16、19、24、27 で参照）。designer が design/ で `settings`、`settings.stats`、`history` のように決めれば足りる。

## 前回の指摘の追跡（r2）
| 前回の指摘 | 直った / 直っていない | 証拠 |
|---|---|---|
| 要修正 1（AC-12 が再読み込みを含む AC を列挙し、Service Worker なしで成り立たない） | 直った | :230 When を「AC-1、AC-2、AC-5（`task.rate` → `task.done` まで）、AC-7（`task.skipped` まで）、AC-9（選んだ場合）」に列挙し直し、:231 Then「再読み込みより前の部分」。再読み込みは AC-23（Service Worker、:117、:294-299）に分けた |
| 要修正 2（AC-14 のやり直しが同日の 2 件目を出し AC-5 と矛盾） | 直った | :155 やり直しの規則（その日に出していなければ直後に出す、出していれば翌日から。AC-5 の例外は作らない）。AC-14 Given :241「今日の課題はまだ出していない」 |
| 要修正 3（AC-20 の壊れたファイルの Given が「データなし」で確かめられない。データありへの読み込みの扱い） | 直った | AC-25 :306-311 に分離（Given「完了の履歴 1 件」、Then「履歴 1 件のまま、状態は前と同じ」）。:156 データありは `settings.import.confirm` → 置き換え（結合しない）。「今の版以下は移して読み、新しい版は拒む」 |
| 要修正 4（AC-11「それまでの回答が画面に残り」が見える結果でない） | 直った | :225「表示している質問の番号は 2 のままで、選んでいた選択肢が選ばれたまま…出た課題の `data-task-area` と `data-task-level` が失敗の前に答えた値と一致」 |
| 要修正 5（AC-17 に自動で数える方法がない、「…」を数えられない） | 直った | :259 幅 320 CSS px（DPR 2）、:261 `scrollWidth` ≤ 320、はみ出し 0 件、`text-overflow: ellipsis` で切り詰め 0 件、scrollIntoView 後に押せる。監査は AC-27 に分け、道具は :322 で tech-lead が dependencies.md に |
| 要修正 6（AC-21 の表示条件がない） | 直った | :283 Given「iOS の Safari で、スタンドアロン表示でない（UA を偽装し `navigator.standalone` を false）」、:285「偽装しない Chromium と WebKit では 0 回」、:157 判定の規則 |
| 提案 1（AC-5「閉じる」の定義） | 直った | :149「答えるか、答えずにページを離れる（再読み込み、タブを閉じる）」、`task.rate.close` は designer の任意で再読み込みと同じ扱い。AC-5 :189「答えるか再読み込みすると」 |
| 提案 2（AC-8 に「上」の上限と「簡単すぎ」1 回、ブラウザで全通り） | 直った | :207 7 通り。:208「ブラウザの自動テスト…実装の関数は呼ばない」。ただし seed の有効性が新しい要修正 |
| 提案 3（persist() を求めるタイミング） | 直った | :158「`task.today` を初めて表示した後に 1 回だけ」、AC-13 Given :235 |
| 提案 4（`task.exhausted` から同じ領域・段階でやり直したとき） | 直った | :155、AC-10 Then :219「同じ日のうちに再び `task.exhausted`」 |
| 提案 5（AC-3 の境界値） | 直った | :177「前後の空白を除いて 1 文字以上」「1 以上 15 以下」 |
| 提案 6（AC-18 のフォーカスの枠を数値で） | 直った | :267「`:focus-visible` に一致し、outline か box-shadow の幅が 2 CSS ピクセル以上」 |
| 提案 7（段階が領域ごとか） | 直った | :154 領域ごと、AC-19 :273「領域ごとの現在の段階」 |
| 提案 8（12 章の 0.5 秒がどの AC にもない） | 直った | AC-1 :165「500 ミリ秒以内」、:166「3 回とも記録」、12 章 :327 |
| 提案 9（英語の AC がない） | 直った | AC-26 :312-317（locale en-US、文言ファイルの一致、ja / en のキーの差 0 件） |
| 提案 10（`?reset=1` が本番で効く危険） | 直った | :160「つなぎ口は本番の配布物に入れない」、:141 はまりやすい所、reviewer が G2 で確かめる |
| 提案 11（app.json の stacks と commands） | 対応済み（PRD の外） | `cat .claude/org/app.json` → stacks `["backend"]`。commands.backend_test は空（G1 の後に Takuma が入れる。Q9 (3)） |

## 証拠
- 対象：feat/001-daily-learning、HEAD e591480（r2 の判定を保存した 042c0f8 からの差分：docs/prd/001-daily-learning.md 266 行変更、docs/prd/product.md 11 行変更、docs/progress.md 1 行、docs/reviews/001-daily-learning-G0-tech-lead-r1.md 新規）
- 読んだファイル：docs/prd/001-daily-learning.md（全 418 行）、docs/prd/product.md（r3 の差分）、docs/reviews/001-daily-learning-G0-verifier-r2.md、docs/reviews/001-daily-learning-G0-tech-lead-r1.md、docs/templates/review-report.md、docs/templates/test-plan.md、docs/org/gates.md（G0）、.claude/org/app.json
- 実行したコマンドと結果（cwd /Users/takumamatsuura/src/engineer）：
  - `grep -oE 'AC-[0-9]+' docs/prd/001-daily-learning.md | sort -u` → AC-1〜AC-27 の 27 件、抜けなし。`grep -cE '^- AC-[0-9]+：'` → 27
  - 11 章（144〜325 行）で `^  - Given：`、`When：`、`Then：`、`確かめ方：`、`効く機会：` を数えた → すべて 27 件
  - 11 章で `適切|すばやく|わかりやすく|すぐに|素早|正しく|十分|なるべく|できるだけ|スムーズ|快適|速やか|ちゃんと|きちんと|自然に|簡単に|問題なく` → 0 件（終了コード 1）
  - 11 章で `確かめ方` の行のうち「自動テスト」を含まないもの → 0 件（終了コード 1。r2 は 1 件）
  - 11 章のバッククォートの語を抽出 → 状態名 7 種、文言キー 8 種、data 属性 17 種
  - `git diff 042c0f8..HEAD --stat`、`ls backend ios contracts design` → backend/ と ios/ はまだない。contracts/ は dependencies.md のみ、design/ は空。`cat .claude/org/app.json` → stacks `["backend"]`、commands はすべて空
- 開いた URL：なし（Playwright の機能は tech-lead r1 の spike の結果と自分の知識で判断した。「Playwright で可」は G1 で contracts/ と一緒に確定する）
- 未検証：なし（G0 は文書の判定のみ）

### AC ごとのテストできるか（27 件）
「できる」は、基本のつなぎ口（W-1 新しいコンテキスト、W-2 識別子、W-3 時刻の固定、W-6 タスク集のスキーマと置き場所、W-7 seed の形と保存のキー、W-9 書き出しのスキーマ）がそろえば、Playwright のブラウザの自動テストで合否を決められるもの。「条件つき」は、要修正の決着か、固有のつなぎ口・決定が要るもの。
| AC | 判定 | 根拠と、要るつなぎ口、再現の仕方 |
|---|---|---|
| AC-1 | できる | 新しいコンテキストで開く。`data-state` = diagnosis.start、`diagnosis.progress` の文字を 3 回読む。切り替えの 500 ms は壁時計で 3 回計る。進み具合の文字の形は提案 |
| AC-2 | 条件つき | 1 秒は待ち時間 1,000 ms。`data-task-area` / `data-task-level` の値の語彙（Q3 の 6 領域、段階の文字列）が contracts/ に要る（W-5）。3 通りは回答を変える |
| AC-3 | できる | 本番 JSON を全件読む（W-6 のパス）。trim 後 1 文字以上、1 ≤ 分 ≤ 15 |
| AC-4 | できる | 252 以上、18 組 × 14 以上、ID 重複 0。Q2 で E を選ぶと数字が 126 と 7 に変わる |
| AC-5 | できる | 完了 → `task.rate` → 答える → `task.done` → 同じ固定時刻で reload → `task.done`。答えずに reload の経路も |
| AC-6 | できる | timezoneId=Asia/Tokyo、clock を day1 で完了、day2 に固定して reload、`data-task-id` が過去の集合にない |
| AC-7 | できる | 3 通り。`task.skipped`、履歴の行の `data-report` と `data-task-id`（W-8）、reload 後も `task.skipped` |
| AC-8 | 条件つき | 7 通りの値は決まっている。seed の有効性（要修正 1）の決着が要る |
| AC-9 | できる | 選ぶ／選ばず reload の 2 通り。履歴の `data-helpful`。再び聞かれない = `task.rate` が出ない |
| AC-10 | 条件つき | タスク集の差し替えは page.route で JSON を差し替える。タスク集を実行時に fetch で読むことと、そのテストで `serviceWorkers: 'block'` にすることが前提（W-4）。代替は 14 件を出し終えた seed（提案） |
| AC-11 | 条件つき | addInitScript で `Storage.prototype.setItem` を 1 回だけ例外にする。保存が localStorage で、1 回の保存が 1 回の setItem であること（ADR、W-9）が前提。回答ごとの保存は提案 |
| AC-12 | 条件つき | `context.setOffline(true)` と `page.on('request')`。「0 件」の除外先は Q1 の決定で決まる（W-12） |
| AC-13 | できる | addInitScript で `navigator.storage.persist` を `false` に。`task.done`、履歴 1 件、`settings.storage.notPersisted`、書き出しの操作 1 つ |
| AC-14 | できる | seed で 3 日分の完了、時刻を 4 日目に固定。やり直し → 別の領域 → `data-task-area` 一致、履歴 3 件のまま |
| AC-15 | 条件つき | Chromium の CDP で遅延 150 ms、下り 1.6 Mbps、CPU 4 倍遅い（契約で確定、W-11）。新しいコンテキストに seed を入れて goto、`data-debug-load-ms` を 5 回読む。clock は使わない。spike では 1,665〜1,674 ms で 2 秒に近く、転送量次第で揺れる |
| AC-16 | できる | 削除の確定 → reload → `diagnosis.start` → 診断 → 履歴 0 件 |
| AC-17 | できる | viewport 320 × DPR 2 で 4 状態。scrollWidth、はみ出し要素、ellipsis の要素、click の実行可能性を数える。コードの横スクロールは提案 |
| AC-18 | できる | `page.keyboard.press` の Tab / Shift+Tab / Enter / Space だけ。各操作の前に `:focus-visible` と getComputedStyle を読む |
| AC-19 | できる | `page.waitForEvent('download')` で 1 件、JSON を読んで 4 項目。項目名は W-9 |
| AC-20 | できる | 新しいコンテキストで `setInputFiles`。診断の回答と段階の一致は再び書き出して JSON を比べる（ラウンドトリップ）。「確定」の流れは提案 |
| AC-21 | 条件つき | Playwright の device（iPhone の UA）で偽装し、addInitScript で `navigator.standalone` を false に定義。iOS Safari の UA の判定規則が contracts/ にあり、テストの偽装 UA がそれに合うことが前提（W-16）。`display-mode: standalone` は Playwright で偽装できないので使わない |
| AC-22 | 条件つき | addInitScript で `navigator.standalone` を true。UA の条件の有無（提案）を決めると期待値が固まる（W-16） |
| AC-23 | 条件つき | `navigator.serviceWorker.ready` と controller の存在を待ってから setOffline → reload と `context.newPage()` + goto の 2 通り、3 秒は壁時計。Service Worker が install 中に配布物をすべてキャッシュすることを契約に要る（W-13）。「送信 0 件」は Service Worker から返した応答を除く定義が要る（W-12） |
| AC-24 | 条件つき | seed（5 件）と clock 2026-11-06 で 8 つの `data-stat-*` を読む。画面の文言の真偽値は要修正 2 |
| AC-25 | できる | 版番号の項目名と今の値（W-9）を使って +1 したファイルを `setInputFiles`。`error.import.message`、履歴 1 件、再書き出しで前と同じ JSON |
| AC-26 | 条件つき | コンテキストの `locale: 'en-US'` / `'ja-JP'`。文言ファイルの置き場所と形式、testid = 文言キーの規則、言語の判定規則が contracts/ に要る（W-14） |
| AC-27 | できる | @axe-core/playwright で WCAG 2.1 A / AA のタグ、6 画面で impact serious / critical が 0。結果の JSON を evidence/ に保存。依存は dependencies.md（W-11） |

できる：16、条件つき：11、できない：0。「条件つき」は、要修正 2 件の決着と、下のつなぎ口（W-4、W-5、W-11〜W-16）と Takuma の決定（Q1、Q2、Q3）がそろえば「できる」になる。
空（AC-10）、エラー（AC-11、AC-25）、オフライン（AC-12、AC-23）、権限を断った（AC-13）、言語（AC-26）、大きい文字（AC-17）、キーボード（AC-18）、監査（AC-27）の AC はすべてある。

### つなぎ口の一覧（更新版。G1 で tech-lead が contracts/ に書くもの）
11 章冒頭（:160）の「本番の配布物に入れない」と両立する形に直した。アプリの側に残るのは読み取り専用の識別子・属性とスキーマだけで、URL の引数や `window.__test` のような実行の入口は 1 つもない。すべての注入は Playwright の側（新しいコンテキスト、addInitScript、clock、route、setOffline、locale、userAgent）から行う。
| # | 何 | 案（名前は tech-lead が決めてよい） | 入れる側 | 使う AC |
|---|---|---|---|---|
| W-1 | 状態の初期化 | テストごとに新しいブラウザコンテキスト（保存、SW、キャッシュが空）。アプリ側のつなぎ口は不要 | テスト | 全部 |
| W-2 | 画面の状態と識別子 | ルートに `data-state`（11 章の 7 状態 + 設定・統計・履歴の状態名：提案）。要素に `data-testid`（文言キーと同名）。r2 の一覧に足すもの：`home.addToHomeScreen.steps`、`home.standalone.import`、`home.standalone.importAction`、`home.standalone.start`、`settings.import.confirm`、`settings.import.confirm.ok`、`settings.stats`、`settings.home.reopen`、`task.rate.close`（任意）、`diagnosis.progress`（+ `data-question-index` / `data-question-total`：提案）。designer が design/ 6 章で確定 | アプリ（読み取り専用） | 全部 |
| W-3 | 時刻の固定 | Playwright の `page.clock.setFixedTime` とコンテキストの `timezoneId: 'Asia/Tokyo'`。reload 後も効く。実行中に進めるのは `setFixedTime` を再び呼ぶだけ。AC-15 では使わない | テスト | AC-5〜10、13、14、20、23、24、25 |
| W-4 | タスク集の差し替え | `page.route` でタスク集の URL を差し替える。前提：タスク集は実行時に fetch で読む静的 JSON で、URL が contracts/ に固定されている。差し替えるテストは `serviceWorkers: 'block'`。代替は 14 件を出し終えた seed（提案） | テスト（アプリは URL の固定だけ） | AC-10、17 |
| W-5 | 課題と段階の素性 | `task.today` の要素に `data-task-id`、`data-task-area`、`data-task-level`。領域（Q3）と段階の値の語彙（表示の文字でなく固定の ID）。現在の段階と診断の回答の読み出しは書き出しのラウンドトリップで行う | アプリ（読み取り専用） | AC-2、6、8、14、20、25 |
| W-6 | タスク集のスキーマと置き場所 | JSON Schema（`id`、`area`、`level`、`title`、`why`、`how`、`done_criteria`、`estimated_minutes`）と本番 JSON のパス | アプリ | AC-3、4、10 |
| W-7 | データの投入（seed） | addInitScript で localStorage のキー（契約で固定）に保存の形式の JSON を書く。保存の形式 = 書き出しの形式（版番号、診断の回答、領域ごとの段階、履歴の行、初めて開いた日、案内を閉じた印、persist の回答）。seed は 7 通り以上を受け入れテストのフォルダに JSON で置く | テスト（アプリは形式の公開だけ） | AC-8、13〜16、19、20、23〜25 |
| W-8 | 履歴の読み出し | 履歴の行に `data-task-id`、`data-date`、`data-report`（completed / too_hard / too_easy / no_time）、`data-helpful`（helpful / not_helpful / unanswered） | アプリ（読み取り専用） | AC-7、9、13、14、16、25 |
| W-9 | 失敗と拒否の注入、書き出し形式 | addInitScript で `Storage.prototype.setItem`（次の 1 回だけ `QuotaExceededError`）と `navigator.storage.persist`（`false`）を差し替える。前提：保存は localStorage のキー 1 つで、1 回の保存 = 1 回の setItem（ADR）。書き出し JSON のスキーマと版番号の項目名と今の値（例：`formatVersion: 1`） | テスト（アプリはスキーマと ADR） | AC-11、13、19、20、25 |
| W-10 | 計測値の露出 | ルートに `data-debug-load-ms`（`performance.timeOrigin` から `task.today` の描画まで、アプリが計る）。本番に残してよい（読み取り専用） | アプリ | AC-15 |
| W-11 | 実行環境 | Playwright（Chromium、WebKit）と @axe-core/playwright を contracts/dependencies.md に。静的サーバーの起動と base URL、AC-15 の CDP の制限値、圧縮後の転送量の上限。受け入れテストのコマンドを app.json の `commands.backend_test` と CLAUDE.md に | 契約と app.json | AC-15、27、全部 |
| W-12 | 通信の観測 | 「送信」の定義：`page.on('request')` のうち Service Worker から返した応答（`response.fromServiceWorker()`）を除いたもの。Q1 で B なら計測の送信先 URL を 1 つに固定して除外 | 契約（定義）とテスト | AC-12、23 |
| W-13（新） | Service Worker の準備 | SW は install の `waitUntil` で配布物をすべてキャッシュし、`navigator.serviceWorker.ready` と `controller` の存在が「オフラインで開ける」と同値になること。SW のスコープと登録の URL | アプリ（作り方の約束） | AC-23 |
| W-14（新） | 文言ファイル | ja / en の置き場所と形式（平らなキーの JSON）、`data-testid` = 文言キーの規則、言語の判定（`navigator.language` の先頭が en なら英語、それ以外は日本語） | アプリ | AC-26 |
| W-15（新） | 統計の値 | 統計の画面の要素に `data-stat-first-open-date`（YYYY-MM-DD）、`-issued`、`-completed`、`-first-day-completed`（"true" / "false"）、`-days-completed-7d`、`-helpful`、`-rated`、`-too-hard`。「直近 7 日」の窓の定義（提案） | アプリ（読み取り専用） | AC-24 |
| W-16（新） | スタンドアロンと iOS Safari の判定規則 | `navigator.standalone === true || matchMedia('(display-mode: standalone)').matches` と、iOS Safari の UA の正規表現。テストは Playwright の device の UA と addInitScript の `navigator.standalone` で偽装するので、規則が contracts/ にあれば偽装がそれに合うかを事前に確かめられる | 契約 | AC-21、22 |

状態の表（test-plan の 3 章）の見通し：初めて開く（W-1）、データがある（W-7）、オフライン（setOffline、AC-12、23）、権限を断った（W-9、AC-13）、言語（locale、AC-26）、大きい文字（viewport 320、AC-17）は自動。前の版からの更新は v1 のため範囲外。バックグラウンドからの復帰は「タブの切り替え」に読み替え、日付が変わった後の最初の操作（:151）は AC にないので探索で見る。容量不足は W-9 の注入で代用、それ以外は G4 の人。ダークモードは AC がないので G4 の人。

- Takuma と tech-lead への質問（判定には影響しないが、G1 の前に決まると「条件つき」が減る）：(1) Q1 の計測の手段。(2) Q2 の件数（AC-4 の数字）。(3) Q3 の 6 領域（W-5 の語彙）。(4) 保存の方式の ADR（localStorage のキー 1 つ）。(5) タスク集を実行時に fetch で読む作りにするか（W-4）。(6) AC-8 の直し方 (a) か (b) か。

書いたファイル：なし。コミット：なし。
