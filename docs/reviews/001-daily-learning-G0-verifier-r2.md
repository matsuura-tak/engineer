# 001-daily-learning G0 verifier r2

判定：PASS（重大なし。要修正 6 件、提案 11 件）
対象：feat/001-daily-learning の HEAD 0939c32525159d9ce621ee9dbc8c0c5e851a5b4e、docs/prd/001-daily-learning.md（全 367 行、r2 Web 版）
観点：受け入れ条件がテストできるか（docs/org/gates.md の G0、verifier の項目）。r1 の要修正 9 件と提案 5 件の追跡
日付：2026-10-29
指揮役の注記：判定の後に PR #3 がマージされ、app.json の stacks は `["backend"]` になった（下の「提案、.claude/org/app.json」の stacks の部分は対応済み。commands.backend_test は G1 の後に Takuma が入れる）。

## 指摘
重大はなし。AC-1〜AC-21 の 21 件すべてに番号、Given / When / Then、確かめ方、効く機会があり（grep で各 21 件）、11 章に測れない言葉はなかった（grep 0 件、終了コード 1）。Then はすべて件数、状態の名前、文言キー、秒数、ミリ秒、ピクセルのどれかで書かれている。合否を決められない AC はない。ただし、テストの期待値を実装前に固定するために G1 の前に直してほしい「要修正」が 6 件ある（うち 2 件は PRD の中の食い違い）。

- 要修正（食い違い）、docs/prd/001-daily-learning.md:218-219、AC-12。When は「AC-1、AC-2、AC-5〜AC-10 の操作を行う（再読み込みは含まない）」と言うが、AC-5:177、AC-7:189、AC-9:200 の Then は再読み込みを含み、AC-6:182 と AC-10:206 は When そのものが「ページを読み込む」である。Service Worker を入れない（:122）ので、オフラインでの再読み込みは失敗するはずで、「それぞれの Then がすべて満たされ」は成り立たない。直す方向：AC-12 の範囲を「AC-1、AC-2、AC-5（`task.rate` → `task.done` まで）、AC-7（`task.skipped` まで）、AC-9（選んだ場合）の、再読み込みの前までの Then」と列挙し直す。AC-6、AC-8、AC-10 を残すなら、時刻を実行中に進めるつなぎ口（下の W-3b）が要る。
- 要修正（食い違い）、:228-231（AC-14）と :109、:177（AC-5）。AC-14 の Then は「状態 `task.today` に新しい課題が出て」だが、9 章 :109 は「申告後はその日はもう課題が出ない」、AC-5 は同じ日に再読み込みしても `task.done` のままと言う。Given「完了した課題が 3 件ある」の 3 件目が今日なら、診断のやり直しで同じ日に 2 件目が出ることになり、AC-5 と矛盾する。やり直しが同日の抜け道になれば Task Issued が増えて完了率（13 章の主の指標）にも効く。直す方向：Given に「今日の課題はまだ申告していない」を足すか、「やり直した日はその日の申告の有無にかかわらず新しい課題を出す」と決めて AC-5 の例外として書く。どちらでもテストは書けるが期待値が変わる。
- 要修正、:265-267、AC-20。Given は「保存データがないブラウザ」だが、Then の後半「形式の版番号が合わないファイルでは `error.import.message` が出て、既存のデータは変わらない」は、既存のデータがなければ何も確かめられない。直す方向：壊したファイルの場合の Given を「診断済みで履歴 1 件がある」のように分け、「変わらない」の中身（履歴 1 件のまま、状態が変わらない）を書く。合わせて、データがあるブラウザに正しいファイルを読み込んだときの扱い（置き換える／確認を出す／拒む）を 1 行書く。
- 要修正、:213、AC-11。「それまでの回答が画面に残り」は、何が画面に見えていれば合格かが決まらない（前の質問の答えは画面に出ないのが普通）。直す方向：「いま表示している質問の番号が戻らず、選んでいた選択肢が選ばれたままで、やり直しの操作で保存が成功すると診断が最後まで進み、出た課題の `data-task-area` と `data-task-level` が失敗の前に答えた値と一致する」のように、見える結果で書く。
- 要修正、:246-250、AC-17。(1) 確かめ方が「スクリーンショットとアクセシビリティ監査」だけで、自動テストで数える方法がない（21 件中この 1 件だけ）。(2) Web では「…」は CSS の text-overflow で、見た目の記号を数えられない。直す方向：Then の測り方を決める。例：ビューポート幅 320 CSS px（deviceScaleFactor 2）で、`document.documentElement.scrollWidth` が 320 以下、`scrollWidth > clientWidth` で文字がはみ出す要素が 0 件、操作できる要素のすべてが scrollIntoView の後に押せる。監査に使う道具（axe-core など）は tech-lead が contracts/dependencies.md に書く。
- 要修正、:271-273、AC-21。案内をどのブラウザ・条件で出すかが書いていない。ホーム画面への追加は Safari の 7 日消去（E-7）への手当てなので iOS Safari だけに出す設計もありうるが、その場合、自動テスト（PC の Chromium / WebKit）では案内が出ず、合否を決められない。直す方向：「すべてのブラウザで出す」か「iOS Safari かつスタンドアロン表示でないときだけ出す」を Given に書く。後者なら、User-Agent の偽装（Playwright の device 設定）か、表示を強制するつなぎ口を W-11 に足す。

提案（AC の外、または直すかは作り手に任せる）：
- 提案、:177（AC-5）と :142。「答えるか閉じると `task.done`」の「閉じる」が、`task.rate` にある閉じる操作（要素）か、タブを閉じることかが読めない。AC-9:200 は「再読み込み」で書いている。閉じる操作があるなら designer の識別子に入れ、ないなら「再読み込み」に統一する。
- 提案、:195-196、AC-8。5 通りに「上」の上限（段階「上」で「簡単すぎ」2 回でも「上」のまま）と「簡単すぎ」1 回だけ（「中」のまま）がない。対称だと読めるが、境界値なので書いておくと期待値を迷わない。また、確かめ方の「段階を決める処理の自動テスト」は作り手の単体テストであり、受け入れテストは実装を import しない。受け入れテストは 5〜7 通りをすべてブラウザで（時刻の固定で日付を進めるか seed で）確かめるので、「ブラウザの自動テスト（全通り）」に変えてよい。
- 提案、:223-225、AC-13。`navigator.storage.persist()` をいつ求めるかが書いていない（r1 要修正 5 の通知と同じ型）。「診断を終えて `task.today` を初めて表示した後」のように状態で書くと、15 章の Storage Persist Answered のタイミングも決まる。
- 提案、:204-209（AC-10）と :228-233（AC-14）。`task.exhausted` から診断をやり直して同じ領域・同じ段階を選んだときに、同日に再び `task.exhausted` になるかを 1 行書く。
- 提案、:165、AC-3。「空でない」を「前後の空白を除いて 1 文字以上」、所要時間を「1 以上 15 以下の整数」にすると境界値が決まる。
- 提案、:255、AC-18。「フォーカスの表示（枠線）があった」は、`:focus-visible` に一致し、getComputedStyle の outline か box-shadow の幅が design/ で決めた値以上、のように数値で書くと揺れない。
- 提案、:267 と :319（AC-20、15 章）。Level Changed に `area` があるので段階は領域ごとに持つように読めるが、AC-19 の「現在の段階」が 1 つの値か領域ごとかが書いていない。書き出し JSON のスキーマ（W-9）で決まる。
- 提案、:278、12 章。「診断の各質問の切り替えは 0.5 秒以内」はどの AC にもないので G3 では測らない。測るなら AC-1 に足す。
- 提案、:284、12 章。英語（副）の AC がない（r1 提案 4 のまま）。文言キーの ja / en のそろいは G2 の作り手の検査で見るが、en で表示したときの AC-17 を回すかは G1 で決める。
- 提案、:148（つなぎ口）。`?reset=1` のような URL パラメータが本番でも効くと、リンクを踏ませるだけで他人のデータを消せる（データはブラウザの中だけなので被害は本人のデータ）。テストビルドだけで有効にするか、`localStorage` のフラグとの組み合わせで効くようにするかを tech-lead が決める。
- 提案、.claude/org/app.json。`stacks` が `["ios"]`、`commands.backend_test` が空のまま。Web 版では `stacks` を `["backend"]` にし、受け入れテストのコマンド（例：backend/tests/acceptance/ の設定だけで動く Playwright のコマンド）を入れる必要がある。.claude/ は Takuma だけが直せるので、指揮役から依頼する。

## 前回の指摘の追跡（r2）
| 前回の指摘 | 直った / 直っていない | 証拠 |
|---|---|---|
| 要修正 1（AC-1 の質問数が 9 章と食い違う） | 直った | 9 章 :107「3問」、AC-1 :153「質問の総数が 3」「n / 3」、Q5 :348 で 3 問に固定。1 画面 1 問も :107 |
| 要修正 2（AC-2「自己評価」がどれか、領域と段階を読む手段） | 直った | :159「目標の領域の自己評価と一致」。`data-task-area`、`data-task-level` を Then に明記、:148 に `data-task-id` |
| 要修正 3（「役に立った」を聞く状態の名前、閉じたときの扱い） | 直った | :142 `task.rate` を定義。AC-5 :177、AC-9 :199-201「選ばずに再読み込み → `task.done`、未回答が残る、再び聞かれない」 |
| 要修正 4（申告後の状態、「連続」の定義、申告した ID の除外、今日はできない・1 回だけの AC） | 直った（一部は提案に） | :143 `task.skipped`、:145「連続」の定義、:146 ID の除外。AC-7 :186-191 で 3 通り、AC-8 :195 で「難しすぎ」1 回だけ。「簡単すぎ」1 回だけと「上」の上限は上の提案 |
| 要修正 5（通知の許可を求めるタイミング） | 直った（AC が消えた） | 通知は v1 から外れた（:121 Web Push はやらない）。代わりの権限の AC は AC-13 `storage.persist()`。求めるタイミングは同じ型で未記載（提案） |
| 要修正 6（通知の本文） | 直った（AC が消えた） | 通知の AC なし。11 章に `notification.*` の文言キーなし |
| 要修正 7（AC-14 の機種と測り方） | 直った | AC-15 :237 アプリが自分で計って `data-debug-load-ms` に出す、5 回とも 2,000 以下、環境は tech-lead が contracts/ に決める |
| 要修正 8（AX5 で「画面外に出ない」） | 直った | AC-17 :249「縦スクロールで到達でき、押せる」。測り方の定義は新しい要修正 |
| 要修正 9（タスク集の件数の AC、スキーマ、数値の所要時間） | 直った | AC-4 :168-173（252 以上、18 組すべて 14 以上、ID 重複 0）。AC-3 :165「所要時間の数値項目（整数の分）」。スキーマと置き場所は :148 で G1 の tech-lead へ |
| 提案 1（「翌日」の境目） | 直った | :144「端末の日付が変わった後の最初の読み込みか操作」、AC-6 :182「端末のタイムゾーンの 0:00 以降」、:184 Asia/Tokyo 固定 |
| 提案 2（機内モードを再現できない、計測の除外） | 直った | AC-12 :217「自動テストでオフラインにする」、:219「送信は 0 件（Q1 で計測を入れる場合は計測の送信先を除く）」 |
| 提案 3（「保存データが 0 件」を見える結果に） | 直った | AC-16 :243「再読み込みで `diagnosis.start`、やり直し後の履歴 0 件」 |
| 提案 4（英語の AC） | 直っていない | 12 章 :284 に「英語（副）」はあるが AC はない。提案のまま残す |
| 提案 5（計測 SDK の通信先の除外） | 直った | AC-12 :219 に書かれた。Q1 :344 が決まるまで「0 件」の定義は条件つき |

## 証拠
- 対象：feat/001-daily-learning、HEAD 0939c32（r1 の e19c32e からの差分：docs/prd/001-daily-learning.md 396 行変更、docs/prd/product.md 58 行変更）
- 読んだファイル：docs/prd/001-daily-learning.md（全 367 行）、docs/prd/product.md（67 行）、docs/reviews/001-daily-learning-G0-verifier-r1.md、docs/templates/prd.md（11 章）、docs/templates/test-plan.md、docs/templates/review-report.md、docs/org/gates.md（G0）、.claude/org/app.json、contracts/（dependencies.md だけ）
- 実行したコマンドと結果（cwd /Users/takumamatsuura/src/engineer）：
  - `grep -oE 'AC-[0-9]+' docs/prd/001-daily-learning.md | sort -u` → AC-1〜AC-21 の 21 件、抜けなし。`grep -cE '^- AC-[0-9]+：'` → 21
  - 11 章（137〜276 行）で `^  - Given：`、`When：`、`Then：`、`確かめ方：`、`効く機会：` を数えた → すべて 21 件
  - 11 章で `適切|すばやく|わかりやすく|すぐに|素早|正しく|十分|なるべく|できるだけ|スムーズ|快適|速やか|ちゃんと|きちんと` → 0 件（終了コード 1）
  - 11 章で `確かめ方` の行のうち「自動テスト」を含まないもの → 1 件（AC-17 :250）
  - 11 章の状態名・文言キー（バッククォート）を抽出 → `diagnosis.start`、`diagnosis.question`、`task.today`、`task.rate`、`task.done`、`task.skipped`、`task.exhausted`、`task.exhausted.message`、`error.storage.message`、`error.import.message`、`settings.storage.notPersisted`、`home.addToHomeScreen` の 12 種。`data-` 属性は `data-task-id`、`data-task-area`、`data-task-level`、`data-debug-load-ms`、`data-testid` の 5 種
  - `ls backend ios` → どちらも存在しない。`ls contracts` → dependencies.md のみ。`ls design` → 空。受け入れテストの置き場所はまだない
  - `cat .claude/org/app.json` → stacks は `["ios"]`（判定時点）、commands はすべて空、paths.acceptance_tests に backend/tests/acceptance/ はある
- 開いた URL：なし（競合 URL の確認は tech-lead の担当）
- 未検証：なし（G0 は文書の判定のみ）

### AC ごとのテストできるか（Web 版）
「できる」は、下の W-1、W-3、W-4、W-10 の基本のつなぎ口がそろえばブラウザの自動テスト（Playwright 想定）で合否を決められるもの。「条件つき」は、PRD の修正か固有のつなぎ口が要るもの。
| AC | 判定 | 根拠と、要るつなぎ口、再現の仕方 |
|---|---|---|
| AC-1 | できる | 分母 3、最後の番号 3、`diagnosis.start`。W-1 で初期化し、進み具合の要素（W-10）を読む |
| AC-2 | 条件つき | 1 秒は要素の待ち時間 1,000 ms で測れる。`data-task-area` / `data-task-level` の値の語彙（6 領域は Q3、段階は「初 / 中 / 上」の文字列）が contracts/ に要る（W-5）。3 通りは診断の回答を変えて再現 |
| AC-3 | できる | 本番 JSON を全件読む。スキーマと置き場所（W-6）。所要時間は数値項目 |
| AC-4 | できる | 252 以上、18 組 × 14 以上、ID 重複 0。W-6 |
| AC-5 | できる | 完了 → `task.rate` → 答える → `task.done` → 同じ `?now` で再読み込み → `task.done`。「閉じる」の定義は提案 |
| AC-6 | できる | `?now` を day1 で完了、day2 で読み込み、`data-task-id` が過去の集合に含まれない。W-3、タイムゾーンは Playwright の timezoneId=Asia/Tokyo |
| AC-7 | 条件つき | `task.skipped` と再読み込みは測れる。「履歴に残る」を読むには履歴画面の識別子（行ごとの task-id、申告の種類）か書き出しファイルが要る（W-8） |
| AC-8 | できる | 5 通り（提案で 7 通り）をすべて `?now` で日付を進めて再現できる（最長 4 日）。seed（W-7）があれば短くなる。現在の段階の読み出し（W-5）があると Given「中」を直接確かめられる |
| AC-9 | 条件つき | 選ぶ・選ばず再読み込みの 2 通りは測れる。「履歴の行に helpful / not_helpful / 未回答」は W-8 が要る |
| AC-10 | できる | `?taskset=test2`（W-4）で 2 件にし、day1、day2 を申告、day3 に `task.exhausted`、`task.exhausted.message`、やり直しの操作 1 つ |
| AC-11 | 条件つき | 失敗の注入は `page.addInitScript` で localStorage.setItem に例外を仕込めるが、IndexedDB なら W-9 の注入のつなぎ口が確実。「画面に残る」の定義は要修正 |
| AC-12 | 条件つき | `context.setOffline(true)` と `page.on('request')` で送信を数える。再読み込みの食い違いは要修正。Q1 の決定で「0 件」の除外先が決まる |
| AC-13 | できる | `addInitScript` で `navigator.storage.persist` を `() => Promise.resolve(false)` に差し替える（WebKit では未定義のこともあるので W-9 の注入が望ましい）。`task.done`、履歴 1 件、`settings.storage.notPersisted`、案内の操作 1 つ |
| AC-14 | 条件つき | 3 件の完了は 3 日分の `?now` か seed。同日のやり直しの食い違いは要修正 |
| AC-15 | 条件つき | `data-debug-load-ms` を 5 回読む。「診断済みでキャッシュなし」は、Playwright の storageState で新しいコンテキストに状態だけ持ち込むか、seed（W-7）で作る。保存方式、対応ブラウザ、静的サーバーの起動は tech-lead（W-11）。CI の性能に依存するので、実機・本番 URL の計測は G4 の人 |
| AC-16 | できる | 削除の確定 → 再読み込み → `diagnosis.start` → 診断 → 履歴 0 件 |
| AC-17 | 条件つき | ビューポート 320 CSS px × DPR 2 で scrollWidth、はみ出し要素数、押せるかを数えられる。測り方の定義と監査の道具は要修正 |
| AC-18 | できる | `page.keyboard.press('Tab' / 'Enter' / 'Space')` だけで進め、`document.activeElement` と computed style を各操作で読む。枠線の数値は提案 |
| AC-19 | 条件つき | `page.waitForEvent('download')` で 1 件、ファイルを読む。項目名のスキーマが要る（W-9 の書き出し形式） |
| AC-20 | 条件つき | `setInputFiles` で読み込み。壊したファイルの Given は要修正。版番号の項目名はスキーマ次第 |
| AC-21 | 条件つき | 閉じる → 再読み込み → 表示なし → 設定に再表示の操作 1 つ。表示条件（ブラウザ）が要修正 |

できる：10、条件つき：11、できない：0。「条件つき」はすべて、要修正 6 件の決着と下のつなぎ口がそろえば「できる」になる。
空（AC-10）、エラー（AC-11、AC-20）、オフライン（AC-12）、権限を断った（AC-13）の AC はすべてある。

### つなぎ口の一覧（Web 版。G1 で tech-lead が contracts/ に書くもの）
| # | 何 | 案（名前は tech-lead が決めてよい） | 使う AC |
|---|---|---|---|
| W-1 | 状態の初期化 | `?reset=1`（保存データをすべて消す）。本番で効かせるかは提案のとおり決める | 全部 |
| W-2 | 画面の状態と識別子 | ルート要素に `data-state`（11 章の状態名）。要素に `data-testid`（文言キーと同名：`task.exhausted.message`、`error.storage.message`、`error.import.message`、`settings.storage.notPersisted`、`home.addToHomeScreen`。操作：`diagnosis.option.<値>`、`diagnosis.next`、`diagnosis.progress`、`task.action.complete / tooHard / tooEasy / noTime`、`task.rate.helpful / notHelpful`、`task.exhausted.redo`、`settings.redoDiagnosis`、`settings.deleteAll`、`settings.deleteAll.confirm`、`settings.export`、`settings.import`（file input）、`settings.home.reopen`、`error.storage.retry`、`home.addToHomeScreen.close`）。designer が design/ の 6 章で確定 | 全部 |
| W-3 | 時刻の固定 | `?now=2026-11-02T08:00:00+09:00`。再読み込みでも URL で渡す。(b) AC-12 で AC-6 / 8 / 10 を残すなら、実行中に時刻を進める手段（例：`window.__test.setNow()`）も要る | AC-5、6、7、8、9、10、14、20 |
| W-4 | タスク集の差し替え | `?taskset=test2`（領域 × 段階ごとに 2 件のテスト用 JSON） | AC-10、17 |
| W-5 | 課題と段階の素性 | `task.today` の要素に `data-task-id`、`data-task-area`、`data-task-level`。領域（Q3 の 6 つ）と段階（初 / 中 / 上）の値の語彙。現在の段階を読む場所（設定画面の `data-current-level` か書き出しファイル） | AC-2、6、8、14、20 |
| W-6 | タスク集のスキーマと置き場所 | `id`、`area`、`level`、`title`、`why`、`how`、`done_criteria`、`estimated_minutes`（整数）。本番 JSON のパス | AC-3、4 |
| W-7 | データの投入（seed） | `?seed=<名前>` でテスト用の保存データ（診断済み、完了 3 件、段階「中」、直近の申告）を入れる。版番号つきの保存形式と同じ JSON で | AC-8、14、15、16、19 |
| W-8 | 履歴の読み出し | 履歴画面の行に `data-task-id`、`data-date`、`data-report`（completed / too_hard / too_easy / no_time）、`data-helpful`（helpful / not_helpful / unanswered） | AC-7、9、13、14、16、20 |
| W-9 | 失敗と拒否の注入、書き出し形式 | `?failSave=next`（次の保存で例外）、`?persist=denied`（persist() が false）。書き出し JSON のスキーマ（版番号の項目名、診断の回答、段階、履歴） | AC-11、13、19、20 |
| W-10 | 計測値の露出 | ルート要素に `data-debug-load-ms`（ナビゲーション開始から `task.today` 表示まで） | AC-15 |
| W-11 | 実行環境 | 対応ブラウザと自動テストで使うブラウザ（Chromium / WebKit）、静的サーバーの起動と URL、Playwright と axe-core を contracts/dependencies.md に、受け入れテストのコマンドを app.json の `commands.backend_test` と CLAUDE.md に。AC-21 の案内の表示条件（UA の偽装の要否） | AC-15、17、21、全部 |
| W-12 | 通信の観測 | 計測（Q1 が B のとき）の送信先 URL を 1 つに固定し、テストで除外できるようにする | AC-12 |

状態の表（test-plan の 3 章）の見通し：初めて開く（W-1）、データがある（W-7）、オフライン（setOffline）、権限を断った（W-9）、言語（ja / en の切り替えは AC がないので G4 の人か範囲外）、大きい文字（AC-17 のビューポート）は自動。前の版からの更新は v1 のため範囲外（保存形式の版番号は W-7 / W-9 で 002 以降に備える）。バックグラウンドからの復帰は Web では「タブの切り替え」に読み替え、visibilitychange 後の日付の再判定（:144「最初の操作」）を探索で見る。容量不足（QuotaExceededError）は W-9 の注入で代用、それ以外は G4 の人。

- Takuma と tech-lead への質問：(1) Q1 の計測の手段（AC-12 の「0 件」の除外先）。(2) Q3 の 6 領域（W-5 の語彙）。(3) 保存の方式（localStorage か IndexedDB。AC-11、AC-15 の再現の仕方が変わる）。(4) AC-21 の案内をどのブラウザで出すか。(5) app.json の stacks と commands の更新（Takuma だけが直せる）。

書いたファイル：なし。コミット：なし。
