# 001-daily-learning G0 verifier r1

判定：PASS（重大なし。要修正 9 件、提案 5 件）
対象：feat/001-daily-learning の HEAD e19c32e1190c67334243bcd806bda2d5cdf0be4a
観点：受け入れ条件がテストできるか（docs/org/gates.md の G0、verifier の項目）
日付：2026-10-29

## 指摘
重大はなし。16 件の AC すべてに番号、Given / When / Then、確かめ方、効く機会があり、Then に測れない言葉はなかった（下の grep）。ただし、テストの期待値を実装前に固定するために、G1 の前に PRD を直してほしい「要修正」が 9 件ある。どれも AC の測りやすさの問題で、合否の判定ができない AC はない。

- 要修正、docs/prd/001-daily-learning.md:100 と :130、AC-1。9 章の診断の項目（目標の領域 1、経験年数 1、6 領域の自己評価 6、使える時間 1）を数えると 9 問で、AC-1 の「n / 8」と AC-2 の Given「8 問すべてに答えた」と食い違う（6 領域の自己評価が 1 問扱いなら 4 問）。食い違い。直す方向：質問の総数を 1 つに決め（8 なら 6 領域の自己評価の数え方を書く）、AC-1 の Then の分母をその値にする。テストは「進み具合の分母 = その値」「最後の質問の番号 = その値」で書く。
- 要修正、:136、AC-2。「段階は自己評価と一致」の「自己評価」は 6 領域分あり、どれと一致するのか書いていない。直す方向：「目標の領域の自己評価と一致する」のように 1 つに決める。合わせて、画面から課題の領域と段階を読む手段（識別子の値）が要る（つなぎ口 H-3）。
- 要修正、:148 と :166、AC-4 と AC-7。AC-4 は「完了」を申告すると状態 `task.done` になると言い、AC-7 は「役に立った」を選ぶと `task.done` に「戻る」と言う。「役に立った」を聞く状態の名前がなく、完了の直後に表示される状態がどちらか決められない。食い違い。直す方向：聞く状態を名付ける（例：`task.rate`）か、「`task.done` の中で聞く」と書く。「聞かずに閉じた／再起動した」ときに再び聞くかも 1 行書く（「1 回だけ」の意味を固定するため）。
- 要修正、:102 と :157-162、AC-6。「難しすぎ」「簡単すぎ」「今日はできない」を申告した直後の状態の名前がない（AC-4 の「完了」だけ定義されている）。「2 回連続」の数え方（間に「完了」や「今日はできない」が入ると途切れるか。同じ日に代わりの課題が出て同日に 2 回目が起きうるか）と、申告した課題を次の選択から除くか（AC-5 の「完了した ID」と AC-8 の「すべて完了した」に関わる）が書いていない。直す方向：申告後の状態（例：`task.skipped`。その日はもう課題が出ない、など）と「連続」の定義を Then に足す。4 つの申告は 9 章で「当たり前」なので、「今日はできない」と 1 回だけの「簡単すぎ」にも AC を置くか「なし」の理由を書く。
- 要修正、:187-192、AC-11。通知の許可をいつ求めるか（どの状態の後か）が PRD にない。Given「許可しない を選んだ」に至る手順を test-plan に書けない。直す方向：求めるタイミングを状態の名前で 1 行書く（例：診断を終えて `task.today` を初めて表示した後、または設定で通知をオンにしたとき）。
- 要修正、:196、AC-12。「通知の本文はその日の課題の題名」は、翌日の課題が「翌日に起動したとき」に決まる（AC-5 の When）なら、07:30 の時点で題名が決まっていないことになる。直す方向：「翌日の課題は、その日の最後の申告の時点で決まり、通知の予約時に本文へ入れる」と書くか、本文を固定の文言キー（例：`notification.daily.body`）にする。どちらでもテストは書けるが、期待値が変わる。
- 要修正、:205-210、AC-14。(1) 「iPhone 12 相当のシミュレーター」は、最低対応 iOS 版が未設定（CLAUDE.md）で機種名も決まっていないため再現できない。(2) XCUITest から測る「起動から表示まで」には、テストランナーの接続の時間が含まれ、アプリが速くても 2 秒を超えうる。直す方向：測り方を 1 つに決める。推奨は「アプリが process 開始から `task.today` 表示までを自分で計り、テスト用の識別子の値として出す」（つなぎ口 H-9）か XCTApplicationLaunchMetric。機種と iOS 版は tech-lead が contracts/ か test-plan に書く。シミュレーターの計測は Mac の性能を測ることになるので、実機の計測は G4 の人に回す。
- 要修正、:220、AC-16。「操作できる要素が画面外に出ない」は、AX5 で課題の 4 要素（題名、なぜ今これか、やり方、完了の目安）を 1 画面に収めることを求めており、スクロールを許さない読み方だと満たせない。直す方向：「すべての操作できる要素がスクロールで到達でき、押せる（isHittable）」のように、スクロールを認めた形で書く。「…」0 か所は、staticTexts のラベルの末尾と performAccessibilityAudit（textClipped）で数えられる。
- 要修正、:106 と :121 と :139-144、AC-3。9 章は「6 領域 × 3 段階 × 14 件 = 252 件」、10 章は「件数は G3 の検証で数える」と言うが、件数を Then に持つ AC がない。verifier が G3 で数える根拠になる AC が要る。直す方向：AC-3 の Then に「同梱タスク集の件数は 252 件以上で、領域 × 段階の組ごとに 14 件以上」を足す。合わせて、「単体テスト」は ios-engineer の領分なので、受け入れテストで全件を読めるよう、タスク集 JSON のスキーマ（`id`、`area`、`level`、`title`、`why`、`how`、`done_criteria`、`estimated_minutes` のような数値の所要時間）と置き場所を contracts/ に書く（つなぎ口 H-4）。「完了の目安に書かれた所要時間 ≤ 15」は、文章から数字を読むのではなく数値の項目で判定する。

提案（AC の外、または直すかは作り手に任せる）：
- 提案、:153-154、AC-5。「翌日」の境目（端末のタイムゾーンの 0 時）と、日付をまたいで起動したままのときの扱いを 1 行書く。つなぎ口 H-2 の時計で再現する。
- 提案、:181-186、AC-10。Given「機内モード」はシミュレーターの XCUITest から切り替えられない。つなぎ口 H-6（全通信を失敗させる launch argument と、送信の件数を読む手段）で再現する。「計測のイベント以外」は Q5（計測の手段）が決まるまで列挙できない。Q5 が C（計測しない）なら「送信 0 件」と書き直せる。
- 提案、:214、AC-15。「保存データが 0 件」は外から見えない。「再起動で `diagnosis.start`」「診断をやり直した後の完了一覧が 0 件」「予約された通知が 0 件」のように、見える結果で書く。
- 提案、:229、12 章。英語（副）の AC がない。文言キーの ja と en のそろいは G2 の ios-engineer の検査で見るが、en で表示したときの AC-16 を test plan の構成（Application Language）で回す予定。
- 提案、18 章 Q5。計測 SDK を入れる場合、AC-10 の「0 件」の判定に SDK の通信先を除外する手段が要る。tech-lead の費用と可否の確認と一緒に決める。

## 証拠
- 読んだファイル：docs/prd/001-daily-learning.md（全 307 行）、docs/prd/product.md、docs/templates/prd.md、docs/templates/test-plan.md、docs/org/gates.md、docs/templates/review-report.md、.claude/org/app.json
- 実行したコマンドと結果：
  - `grep -oE 'AC-[0-9]+' docs/prd/001-daily-learning.md | sort -u` → AC-1〜AC-16 の 16 件、抜けなし
  - 11 章（124〜222 行）で `^- AC-`、`  - Given`、`  - When`、`  - Then`、`  - 確かめ方`、`  - 効く機会` を数えた → すべて 16 件
  - 11 章で `適切|すばやく|わかりやすく|すぐに|素早|正しく|十分|なるべく|できるだけ|スムーズ|快適` を grep → 0 件（終了コード 1）
  - `ls ios/` → 存在しない。受け入れテストの置き場所はまだない（G1 以降で作る）
- 開いた URL：なし（競合 URL の確認は tech-lead の担当）

### AC ごとのテストできるか
| AC | 判定 | 根拠と、要るつなぎ口 |
|---|---|---|
| AC-1 | 条件つき | 状態名と「n / 8」は具体的。分母が 9 章の数と合わない（要修正）。H-1、H-10 |
| AC-2 | 条件つき | 1 秒、1 件、領域と段階の一致は測れる。「自己評価」の対象を固定する。課題の領域・段階・ID を読む H-3 が要る。H-1、H-7、H-10 |
| AC-3 | 条件つき | 4 要素が空でない、所要時間 ≤ 15 は JSON の数値項目があれば全件を数えられる。H-4。件数の AC がない（要修正） |
| AC-4 | 条件つき | 完了 → `task.done` → 再起動で `task.done` は測れる。AC-7 との状態の食い違いを直してから期待値を固定する。H-2、H-10 |
| AC-5 | できる | ID が前日と異なり、完了した ID と一致しない。H-2、H-3、H-7 |
| AC-6 | 条件つき | 翌日の段階の値は測れる。申告後の状態と「連続」の定義が要る（要修正）。H-2、H-3、H-7 |
| AC-7 | 条件つき | `task.done`、再び聞かれない、一覧に答えが残るは測れる。聞く状態の名前が要る（要修正）。H-10 |
| AC-8 | できる | `task.exhausted`、`task.exhausted.message`、やり直しの操作 1 つ。H-5、H-2 |
| AC-9 | できる | `error.save.message`、回答が残る、やり直しの操作 1 つ。H-8、H-10 |
| AC-10 | 条件つき | 機内モードはシミュレーターで切り替えられない。H-6 で全通信を失敗させる。「計測のイベント」は Q5 待ち |
| AC-11 | 条件つき | 許可を求めるタイミングが未定（要修正）。XCUIProtectedResource に通知はないため（https://developer.apple.com/documentation/xctest/xcuiprotectedresource）、未回答に戻すには入れ直しか H-9 の上書きが要る。H-2 |
| AC-12 | 条件つき | 実際の配信は XCUITest から観測できない。「予約された通知」を読む H-9 が要る。本文の期待値は要修正の決着で変わる。実機の配信は G4 |
| AC-13 | できる | 新しい課題、一覧 3 件のまま。H-7、H-10 |
| AC-14 | 条件つき | 2 秒、5 回は具体的。機種と測り方が未定（要修正）。H-9 |
| AC-15 | できる | 再起動で `diagnosis.start` は測れる。「0 件」は見える結果に言い換える（提案）。H-10 |
| AC-16 | 条件つき | AX5 は launch argument で作れ、「…」0 か所と監査は測れる。「画面外に出ない」の読み方を直す（要修正）。H-5 |

できる：5、条件つき：11、できない：0。「条件つき」はすべて、要修正の決着と下のつなぎ口がそろえば「できる」になる。

### つなぎ口の一覧（G1 で tech-lead が contracts/ に書くもの）
| # | 何 | 案（名前は tech-lead が決めてよい） | 使う AC |
|---|---|---|---|
| H-1 | 状態の初期化 | launch argument `-ResetState`（保存データと予約済み通知をすべて消して起動） | 全部 |
| H-2 | 時刻の固定と日付の進行 | `-TestNow 2026-11-02T08:00:00+09:00`、`-TestTimeZone Asia/Tokyo` | AC-4、5、6、8、11、12、13 |
| H-3 | 課題の素性の読み出し | `task.today` の画面に `task.id`、`task.area`、`task.level` の accessibilityIdentifier（value に値） | AC-2、5、6、8 |
| H-4 | タスク集のスキーマと置き場所 | contracts/ に JSON スキーマ（`id`、`area`、`level`、`title`、`why`、`how`、`done_criteria`、`estimated_minutes`（整数））と ja の本番 JSON のパス | AC-2、3、5 |
| H-5 | タスク集の差し替え | `-TaskSet <名前>` でテスト用 JSON（2 件）に差し替える | AC-8、16 |
| H-6 | 通信の遮断と送信の件数 | `-NetworkMode offline` と、送信の件数を読む手段（または `-AnalyticsBaseURL` でスタブに向ける） | AC-10 |
| H-7 | データの投入（seed） | `-SeedDiagnosis area=<領域>,level=<段階>`、`-SeedCompleted <件数>`、`-SeedLastReport too_hard\|too_easy`、`-SeedLevel` | AC-2、5、6、13、14、15 |
| H-8 | 保存の失敗の注入 | `-FailNextSave diagnosis` | AC-9 |
| H-9 | 通知の状態の上書きと予約の読み出し、計測値の露出 | `-NotificationAuth notDetermined\|denied\|granted`。`settings.notification.pending`（value に件数・発火時刻・本文の JSON）。`debug.launchToTaskMs` | AC-11、12、14、15 |
| H-10 | 画面の識別子 | designer が design/001-daily-learning.md の 6 章で確定する。少なくとも：`diagnosis.start`、`diagnosis.progress`、`diagnosis.question.<n>`、`diagnosis.option.<値>`、`diagnosis.next`、`task.today`、`task.title`、`task.why`、`task.how`、`task.doneCriteria`、`task.action.complete`、`task.action.tooHard`、`task.action.tooEasy`、`task.action.noTime`、`task.rate.helpful`、`task.rate.notHelpful`、`task.done`、`task.exhausted`、`task.exhausted.redo`、`history.list`、`history.row.<id>`、`settings.notification.toggle`、`settings.notification.time`、`settings.notification.denied`、`settings.notification.openSettings`、`settings.redoDiagnosis`、`settings.deleteAll`、`settings.deleteAll.confirm`、`error.save.message`、`error.save.retry` | 全部 |
| H-11 | 実行の環境 | 最低対応 iOS 版、AC-14 の機種と iOS 版、Xcode の版を CLAUDE.md か contracts/ に。app.json の `commands.ios_test` を空でなくする | AC-14、全部 |

状態の表（test-plan の 3 章）の見通し：初めて起動（H-1）、データがある（H-7）、オフライン（H-6）、権限を断った（H-9 と入れ直し）、復帰、言語、大きい文字とダークは自動にできる。前の版からの更新は v1 のため範囲外。容量不足と割り込みは G4 の人。

- 未検証：なし（G0 は文書の判定のみ）。
- Takuma と tech-lead への質問：(1) Q5 の計測の手段（AC-10 の「0 件」の定義に直結）。(2) 最低対応 iOS 版と AC-14 の機種（H-11）。(3) 診断の質問の総数（AC-1 と 9 章の食い違い）。

書いたファイル：なし。コミット：なし。
