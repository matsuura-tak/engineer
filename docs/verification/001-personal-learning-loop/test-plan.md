# テスト計画 001-personal-learning-loop：外部学習の取り込みと日次3分の実践思考・忘却曲線復習ループ

- 書いた役：verifier　日付：2026-10-30
- 実装のコードを見ずに書いた：はい（書いた時点で `backend/` には受け入れテスト以外のファイルが0件。`find backend -type f -not -path 'backend/tests/acceptance/*'` が0件）
- 読んだファイル（PRD、design/、contracts/ と、指揮役の指示書が挙げたものだけ）：
  - docs/prd/001-personal-learning-loop.md（11章 AC-1〜AC-9、12章 非機能、9章・10章の値の根拠）
  - design/ → 中身なし（`.gitkeep` だけ）。設計メモの1行目にある `design/001-personal-learning-loop.md` は存在しない。画面の識別子は設計メモ 2章・3章 Seam #4 にあるものを使った
  - contracts/openapi.yaml
  - contracts/dependencies.md（Schemathesis の有無の確認だけ。記載なし）
  - docs/adr/features/001-personal-learning-loop.md（技術設計メモ）
  - docs/reviews/001-personal-learning-loop-G0-verifier-r1.md（G0 で挙げたつなぎ口）
  - CLAUDE.md、.claude/org/app.json、.claude/agents/verifier.md、.claude/skills/craft-verifier/SKILL.md、docs/org/gates.md、docs/templates/test-plan.md

## 1. リスク
影響「大」の例：データが消える、数や金額が間違う、他人のデータが見える、起動で落ちる、主な流れが最後まで進まない。
影響「大」は、自動テスト、3章の行、6章の探索1本。影響「小」は代表のテスト1本。

| # | リスク | 影響（大中小） | 起きやすさ（大中小） | 関わる AC | 試す深さ |
|---|---|---|---|---|---|
| R1 | XP・レベル・残りXPの計算を間違える（加算漏れ、二重加算、レベルの境界 99/100 のずれ） | 大（数が間違う） | 中 | AC-1, AC-3, AC-4, AC-5 | 自動：デシジョンテーブル（達成観点数 0〜3）＋境界値（99, 100, 199, 200）。3章「データがある」。探索 C1 |
| R2 | SM-2 の間隔・EF・次回日時を間違え、復習日がずれるかカードが期限から消える | 大（数が間違う、データが実質消える） | 中 | AC-4 | 自動：grade 1〜4 の全列、rep 0/1/2 以上、四捨五入の 0.5、EF の下限 1.3、評価後のセッションの残数。探索 C2 |
| R3 | 本日のセッションの上限・並び・期限の判定を間違え、6問を超えて並ぶか、期限のカードが出ない | 大（主な流れが最後まで進まない） | 中 | AC-2, AC-6 | 自動：期限ちょうど／1秒後の境界、7枚中の古い順5枚、未回答3件中の最古1件、時刻を3日進める。探索 C3 |
| R4 | SSRF：内部 IP・localhost・file:// にサーバーが要求を出し、内部の情報が漏れる | 大（情報が漏れる） | 中 | AC-9 | 自動：ループバックの待ち受けへの要求が0件、11種の URL、スタブのヘッダを付けても SSRF が先。探索 C4 |
| R5 | 外部 URL の取得失敗・タイムアウトで登録がエラーになるか 3 秒を超え、インプットが止まる | 大（主な流れが進まない） | 中 | AC-8, AC-1 | 自動：stub_timeout、stub_error、予約テストドメイン2種で 201 と 3,000ms 以内。探索 C5 |
| R6 | 通信が切れたときにブラウザの入力が消える | 大（利用者が書いたデータが消える） | 中 | AC-8 | 自動：識別子の有無と再送の二重作成なし。G4 の人：実際に切断して入力が残るか。探索 C6 |
| R7 | サーバーが起動しない、再起動で保存したデータが消える | 大（起動で落ちる、データが消える） | 小 | 全 AC（とくに AC-1） | 自動：全テストが本物のプロセスを起動して動く。再起動の後も XP・問題・カードが残る。探索 C7 |
| R8 | 不正な入力が保存され、XP やカードが壊れる | 中 | 中 | AC-7 | 自動：memo・grade・answer・matched_rubric_count の境界と型（真偽値 true、文字列 "3" を含む）と、保存されていないことの確認 |
| R9 | 再試行（同じ要求の二度送り）で学習が二重に作られ、XP が二重に入る | 中（数が間違う） | 中 | AC-8 | 自動：同じ Idempotency-Key で2回送って1件だけ |
| R10 | 空状態でクラッシュ・空白になる、文言が PRD と違う | 中 | 小 | AC-6 | 自動：API の値と文言。G4 の人：画面の表示 |
| R11 | 権限を断ったブラウザで日次ループが進まない | 中 | 小 | AC-9 | 自動：HTML が権限 API を呼ばない。G4 の人：権限をすべて拒否して AC-1〜AC-5 を通す |

## 2. 受け入れ条件とテストの対応
すべての AC に1つ以上のテストを付ける。名前に AC 番号を入れる（AC-3 なら test_AC3_<結果>）。AC のないテストは作らない。
技法：同値分割と境界値、状態遷移、デシジョンテーブル、ペアワイズ、代表の1例。
共通：時刻は `X-Test-Now: 2026-10-30T09:00:00Z`（以下「基準時刻」）。テストごとに `POST /api/v1/test/reset` で空にしてから始める。ファイルはすべて `backend/tests/acceptance/`。

| AC | リスク | 技法 | 試す値（境界、遷移、ルールの列） | 種類（API / 画面） | ファイル::テストの名前 | 確かめる結果（具体的な値） |
|---|---|---|---|---|---|---|
| AC-1 | R1, R5 | 代表の1例 | title `Redisキャッシュ設計`、memo は PRD の文、URL なし、領域は自動 | API | test_ac1_create_learning.py::test_AC1_URLなし領域自動_3秒以内に201で15XPと3観点の問題1問と初回カードが返り保存される | 3,000ms 以内に 201。`earned_xp` 15、`category` は6領域のどれか、`url_fetch_status` `not_provided`、`rubric_items` 3件で index 0/1/2 が `premise_constraints`/`tradeoff_comparison`/`failure_edge_cases`、`challenge.status` `pending`、`review_card` は `interval_days` 1・`ease_factor` 2.5・`repetition_count` 0・`next_review_at` 2026-10-31T09:00:00Z。その後の summary でその領域 15・ほか5領域 0、セッションの `active_challenge` が作った問題、基準時刻では `total_due_count` 0、1日後は 1 でそのカード |
| AC-1 | R7 | 状態遷移（登録→再起動→読む） | 領域 `data` で1件登録し、同じ `DEVFORGE_DB_PATH` のままサーバーのプロセスを止めて起動し直す | API | test_ac1_create_learning.py::test_AC1_登録の後にサーバーを再起動しても_XPと問題とカードが残る | 再起動の後も `data` の `total_xp` 15、`active_challenge` が同じ `challenge_id`、1日後の `due_reviews` が同じ `card_id` の1件 |
| AC-1 | R5 | 同値分割（URL あり・取得成功） | `https://ok.example.test/redis` ＋ `X-Test-Url-Fetch-Mode: stub_ok` | API | test_ac1_create_learning.py::test_AC1_公開URLあり取得成功_201でurl_fetch_statusがfetched | 3,000ms 以内に 201、`url_fetch_status` `fetched`、`url` が入力どおり、`earned_xp` 15 |
| AC-1 | R1 | 同値分割（領域の指定6種） | `category` = architecture, backend, data, reliability, security, trend | API | test_ac1_create_learning.py::test_AC1_領域を指定_6領域それぞれ指定どおりに15XPが入る | 6回とも 201 で `category` が指定どおり。summary で6領域すべて 15、全体 `total_xp` 90 |
| AC-1 | R8 | 境界値（有効な側） | memo 10文字（全角 `キャッシュ設計の要点`）、2,000文字（全角 `設計`×1000） | API | test_ac1_create_learning.py::test_AC1_メモ境界値10文字と2000文字_どちらも201 | どちらも 3,000ms 以内に 201、`memo` が入力どおり。全体 `total_xp` 30 |
| AC-2 | R3 | 境界値＋同値分割 | 未回答3件（作成 10/28 09:00、10/29 09:00、10/29 10:00）＋完了1件、期限到来7枚（10/23〜10/28 と基準時刻ちょうど。投入順はばらばら）、期限前2枚（基準時刻＋1秒、11/02） | API | test_ac2_today_session.py::test_AC2_未回答3件と期限到来7枚_1秒以内に200で問題1件とカード古い順5件と総数7 | 1,000ms 以内に 200。`active_challenge.challenge_id` `chl_ac2_old`（最古）、`due_reviews` が d1→d5 の5件の順、`total_due_count` 7、`total_session_items` 6、`estimated_seconds` 180 以下、`session_label_ja` `本日のセッション（全6問・目安3分）`、`is_empty` false |
| AC-2 | R3 | 状態遷移（時刻を進める） | 上と同じデータで `X-Test-Now` を基準時刻＋3日 | API | test_ac2_today_session.py::test_AC2_現在時刻を3日進める_期限到来の総数が9になり表示は5件のまま | `total_due_count` 9、`due_reviews` は同じ d1→d5 の5件 |
| AC-3 | R1 | 代表の1例＋状態遷移（pending→completed） | data 45 XP、streak 2、最終学習日 10/29、matched 3 | API | test_ac3_submit_challenge.py::test_AC3_3観点すべて達成_1秒以内に200でcompletedと50XPと連続日数が1増え保存される | 1,000ms 以内に 200。`status` `completed`、`earned_xp` 50、`total_xp` 95、`level` 1、`streak_days` 3、`model_points` 3件（空でない文字列）。その後 `active_challenge` null、summary の data 95・`streak_days` 3 |
| AC-3 | R1 | デシジョンテーブル（matched 0〜3）＋境界値（レベル） | (0, 79→99, L1)、(1, 70→100, L2)、(2, 70→110, L2)、(3, 150→200, L3) | API | test_ac3_submit_challenge.py::test_AC3_達成観点数0から3_XPは20から50でレベルの境界100をまたぐ | `earned_xp` が 20/30/40/50、`total_xp` と `level` が左の値。各 1,000ms 以内 |
| AC-3 | R1 | デシジョンテーブル（当日初回か） | streak 0・最終学習日なし→1、streak 2・前日→3、streak 2・当日→2 | API | test_ac3_submit_challenge.py::test_AC3_連続日数_当日初回なら1増え当日2回目なら増えない | 応答と summary の `streak_days` が 1 / 3 / 2 |
| AC-4 | R2 | 代表の1例（PRD の値）＋状態遷移 | rep 1・ivl 1・ef 2.5 の期限到来カード＋もう1枚の期限到来カード、grade 3 | API | test_ac4_grade_review.py::test_AC4_rep1でgrade3_1秒以内に200でrep2と間隔6日と10XPになり未消化が1件減る | 1,000ms 以内に 200。`repetition_count` 2、`interval_days` 6、`ease_factor` 2.5、`next_review_at` 2026-11-05T09:00:00Z、`earned_xp` 10、`total_xp` 55、`remaining_due_count` 1。その後のセッションの `total_due_count` 2→1 で残りはもう1枚だけ。6日後はそのカードが再び期限到来 |
| AC-4 | R2 | デシジョンテーブル（grade 1〜4 の全列） | 評価前 rep 1・ivl 1・ef 2.5 | API | test_ac4_grade_review.py::test_AC4_rep1から4段階それぞれ_rep間隔EFと次回日時が契約の式どおり | grade 1→(0, 1, 2.3)、2→(2, 1, 2.35)、3→(2, 6, 2.5)、4→(2, 8, 2.6)（rep, interval, ef）。`next_review_at` は基準時刻＋interval 日、`earned_xp` 10、`remaining_due_count` 1 |
| AC-4 | R2 | 境界値（四捨五入の 0.5、EF の下限） | rep2・ivl6・ef2.5 で grade3 と grade4、rep3・ivl10 で grade2、ef1.3 で grade1、ef1.4 で grade2 | API | test_ac4_grade_review.py::test_AC4_rep2以上と下限_四捨五入とease_factorの下限1点3 | (3, 15, 2.5)、(3, 20, 2.6)（19.5 を 20 に）、(4, 12, 2.35)、(0, 1, 1.3)、(2, 1, 1.3)。`next_review_at` は基準時刻＋interval 日 |
| AC-5 | R1 | 代表の1例 | architecture 120、backend 45、data 75、reliability 30、security 0、trend 15、streak 3 | API | test_ac5_skills_summary.py::test_AC5_学習実績あり_1秒以内に200で6領域のXPとレベルと残りXPと全体の値が返る | 1,000ms 以内に 200。6領域すべてあり、`label_ja` が PRD 9章の名前、(total, level, 残り) = (120,2,80)(45,1,55)(75,1,25)(30,1,70)(0,1,100)(15,1,85)。全体 `total_xp` 285、`streak_days` 3、`weekly_mastered_count` 0、`overall_level` は 1 以上の整数（式が未定義。未解決 7） |
| AC-5 | R1 | 境界値 | 99、100、199、200、0、1 | API | test_ac5_skills_summary.py::test_AC5_レベルの境界_99は1で100は2で199は2で200は3 | (99,1,1)(100,2,100)(199,2,1)(200,3,100)(0,1,100)(1,1,99) |
| AC-5 | R1 | 同値分割（数える／数えない） | 7日内に完了した問題2件、10日以上前に完了1件、未回答1件、grade 3 と 4 のカード（7日内）、grade 2（7日内）、grade 3（15日前） | API | test_ac5_skills_summary.py::test_AC5_直近7日間の達成数_思考問題クリア2件と復習grade3以上2件で4 | `weekly_mastered_count` 4。7日の端は PRD・契約で決まっていないので、端から1日以上離した値だけを使う |
| AC-6 | R10 | 代表の1例（データ0件） | reset の直後 | API | test_ac6_empty_state.py::test_AC6_学習データ0件_セッションは空で6領域すべて0XPレベル1 | どちらも 200、1,000ms 以内（AC-6 には秒数がないため PRD 12章の最大 1,000ms を使う）。`active_challenge` null、`due_reviews` []、`total_due_count` 0、`total_session_items` 0、`estimated_seconds` 0、`is_empty` true、`session_label_ja` が PRD の空状態の文言と一字一句同じ。6領域すべて (0, 1, 100)、全体 (`total_xp` 0, `overall_level` 1, `streak_days` 0, `weekly_mastered_count` 0) |
| AC-6 | R10 | 同値分割（学習済みだが本日分0件） | 完了済みの問題1件、明日が期限のカード1枚、data 65 XP | API | test_ac6_empty_state.py::test_AC6_学習済みでも本日の未回答0件と期限到来0枚_セッションは空 | セッションは上と同じ空の値。summary の data は 65 のまま |
| AC-6 | R10 | 代表の1例（画面のつなぎ口） | `GET /` | API（HTML） | test_ac6_empty_state.py::test_AC6_画面HTMLに空状態ガイドと登録フォームへの誘導ボタンの識別子がある | 200、`text/html`。HTML に `data-testid="app-root"`、`"empty-state-guide"`、`"empty-state-cta-btn"`、`"learning-form"` がある（画面に表示されることは 7章で G4 の人） |
| AC-7 | R8 | 境界値＋同値分割（型） | memo 9文字、2,001文字、空、キーなし、null、数値 | API | test_ac7_validation_error.py::test_AC7_メモが9文字と2001文字と空と欠落と型違い_1秒以内に400で保存されない | 6通りとも 1,000ms 以内に 400、`application/problem+json`、`error.code` `VALIDATION_ERROR`、`error.message` に `memo`。その後 `total_xp` 0、1か月後のセッションでも問題 null・カード 0 |
| AC-7 | R8 | 境界値＋同値分割（型） | grade 0、5、-1、3.5、"3"、true、null、キーなし | API | test_ac7_validation_error.py::test_AC7_gradeが0と5とマイナスと小数と文字列と真偽値とnullと欠落_1秒以内に400でカードは変わらない | 8通りとも 1,000ms 以内に 400、`VALIDATION_ERROR`、`error.message` に `grade`。カードは期限到来のまま rep 1・ivl 1・ef 2.5、data は 45 のまま |
| AC-7 | R8 | 境界値 | answer 9文字・2,001文字、matched_rubric_count -1・4 | API | test_ac7_validation_error.py::test_AC7_回答が9文字と2001文字と達成観点数がマイナス1と4_400で問題は未回答のまま | 4通りとも 1,000ms 以内に 400、`VALIDATION_ERROR`、`error.message` にそのフィールド名。問題は `pending` のまま、data は 45 のまま。（PRD AC-7 の文は memo と grade だけを挙げる。契約が submitChallenge の 400 を AC-7 に結び付けているため AC-7 に置いた） |
| AC-8 | R5 | 同値分割（失敗の種類4つ） | stub_timeout＋`https://timeout.example.test/article`、stub_error＋`https://error.example.test/article`、ヘッダなし＋`https://timeout.example.test/slow`、ヘッダなし＋`https://error.example.test/missing` | API | test_ac8_fallback_and_offline.py::test_AC8_URL取得がタイムアウトと接続失敗_3秒以内に201でfallback_usedとメモから問題とカードができる | 4通りとも 3,000ms 以内に 201、`url_fetch_status` `fallback_used`、`earned_xp` 15、`rubric_items` 3件、初回カードの値は AC-1 と同じ。その後 `total_xp` 60、1日後の `total_due_count` 4 |
| AC-8 | R9 | 状態遷移（送信→同じ要求の再送） | `Idempotency-Key: ac8-resend-0001` で同じ本文を2回 | API | test_ac8_fallback_and_offline.py::test_AC8_通信切断後の再試行_同じIdempotency_Keyで2回送っても1件だけ作られる | 2回目も 201 で `learning_id` が1回目と同じ。`total_xp` 15、1日後の `total_due_count` 1 |
| AC-8 | R6 | 代表の1例（画面のつなぎ口） | `GET /?api_base_url=http://127.0.0.1:59999` | API（HTML） | test_ac8_fallback_and_offline.py::test_AC8_接続先を到達不能にした画面HTMLにエラーバナーと再試行ボタンと入力欄の識別子がある | 200、`text/html`。`learning-form`、`title-input`、`url-input`、`memo-input`、`submit-learning-btn`、`offline-error-banner`、`retry-submit-btn` の `data-testid` がある（入力が残りバナーが出ることは 7章で G4 の人） |
| AC-9 | R4 | 代表の1例＋つなぎ口の順番 | テストの中で立てた `127.0.0.1:<空きポート>` の待ち受けを指す URL を、ヘッダなし・`live`・`stub_ok` の3通りで | API | test_ac9_ssrf_and_permissions.py::test_AC9_ループバックの待ち受けを指すURL_400で待ち受けへの要求は0件 | 3通りとも 400、`error.code` `INVALID_URL_SCHEME_OR_HOST`、`error.message` に `url`。待ち受けが受けた要求 0件、`total_xp` 0 |
| AC-9 | R4 | 同値分割（帯域とスキーム） | `http://127.0.0.1:8000/admin`、`http://169.254.169.254/latest/meta-data/`、`file:///etc/passwd`、`http://localhost/`、`http://LOCALHOST:8000/admin`、`http://10.0.0.1/`、`http://172.16.0.1/`、`http://172.31.255.255/`、`http://192.168.1.1/`、`http://[::1]/`、`ftp://ftp.example.test/file.txt`（すべて `stub_ok` 付き） | API | test_ac9_ssrf_and_permissions.py::test_AC9_プライベートとリンクローカルとlocalhostと非HTTPスキーム_すべて400で保存されない | 11通りとも 400、`INVALID_URL_SCHEME_OR_HOST`。その後 `total_xp` 0、1か月後のセッションでも問題 null・カード 0 |
| AC-9 | R11 | 代表の1例（画面） | `GET /` | API（HTML） | test_ac9_ssrf_and_permissions.py::test_AC9_画面HTMLは通知やクリップボードなどのブラウザ権限APIを呼ばない | `data-testid="app-root"` があり、`Notification.requestPermission`、`navigator.clipboard`、`navigator.permissions`、`getUserMedia`、`navigator.geolocation`、`PushManager` が0件（権限を拒否したブラウザでの完走は 7章で G4 の人） |

## 3. 試す状態
全行で「自動」「G4 の人」「範囲外」のどれかを選ぶ。範囲外には理由を書く。空欄は不可。
（このアプリは `stacks: ["backend"]` のブラウザ UI。iOS の作り方の欄は、ブラウザとサーバーでの作り方に読み替えた）

| 状態 | 選んだもの | 作り方 | どのテストで、または理由 |
|---|---|---|---|
| 初めて起動 | 自動 | 新しい一時フォルダの `DEVFORGE_DB_PATH` でサーバーを起動し、テストごとに `POST /api/v1/test/reset` | test_AC6_学習データ0件_…、ほか全テストの setUp |
| データがある | 自動 | `POST /api/v1/test/seed`（XP、連続日数、問題、カード）と、本物の `POST /api/v1/learnings` | AC-2・AC-3・AC-4・AC-5・AC-7 の seed を使うテスト、test_AC1_登録の後にサーバーを再起動しても_… |
| 前の版からの更新（版を飛ばす更新も） | 範囲外（初回リリースで前の版がない。`git tag` が0件）。代わりに、同じ DB でのサーバーの再起動を自動で試す | 同じ `DEVFORGE_DB_PATH` のままプロセスを止めて起動し直す | test_AC1_登録の後にサーバーを再起動しても_XPと問題とカードが残る。次の機能からは、この機能のタグで作った DB を新しい版で開くテストを足す |
| オフライン、サーバーエラー（500、タイムアウト） | 自動（外部 URL の失敗）＋ G4 の人（ブラウザとサーバーの通信の切断） | 外部 URL：`X-Test-Url-Fetch-Mode: stub_timeout / stub_error` と予約テストドメイン。切断：`GET /?api_base_url=http://127.0.0.1:59999` で開き、登録を押す | 自動：test_AC8_URL取得がタイムアウトと接続失敗_…、test_AC8_通信切断後の再試行_…。G4 の人：7章 AC-8 の手順 |
| 権限を断った（その場で、あとから設定で） | 自動（HTML が権限 API を呼ばない）＋ G4 の人 | ブラウザのサイト設定で通知・クリップボードを「ブロック」にしてから開く。開いた後に設定でブロックに変えて再読み込みする | 自動：test_AC9_画面HTMLは通知やクリップボードなどのブラウザ権限APIを呼ばない。G4 の人：7章 AC-9 の手順 |
| バックグラウンドから復帰 | G4 の人 | 学習メモの入力の途中で別のタブに切り替え、戻る | 入力が残るかを見る。PRD に復帰の約束がないため、消えても AC の不具合ではなく「提案」として記録する |
| 言語と地域（ja、en） | G4 の人 | `GET /?lang=ja` と `GET /?lang=en` | PRD 12章の非機能（文言キーの欠落0件）で、AC がないため自動テストは作らない。G3 の design-reviewer と G4 で見る |
| 大きい文字、ダークモード | G4 の人 | ブラウザの拡大 200%、OS のダーク | PRD 12章（200% で文字切れ0件）。AC がないため自動テストは作らない |
| 容量不足、電話などの割り込み | 範囲外（ローカルの単一利用者の環境で、ディスク満杯を入れるつなぎ口が契約になく、AC もない） | なし | 探索 C7 で、DB ファイルを書き込み禁止にしたときに 500 の problem+json になるかを観察するだけにする |

## 4. テストのつなぎ口と接続先
テストが状態を作るために使うもの。contracts/ にないものは、tech-lead への依頼として報告の「未解決」に書く。

| 何（初期化、データの投入、接続先、時刻の固定） | 名前（launch argument、環境変数、API） | contracts/ の場所 |
|---|---|---|
| サーバーの起動 | `python3 -m backend.app`（テストは同じインタプリタの `sys.executable -m backend.app`）、作業フォルダはリポジトリの根 | contracts/ になし。CLAUDE.md「ローカルサーバー起動（実装後）」。ポートを変える方法は定義なし（未解決 2） |
| 接続先 | `http://127.0.0.1:8000`。起動前に 8000 が使われていたら失敗させる | contracts/openapi.yaml `servers` |
| DB の分離 | 環境変数 `DEVFORGE_DB_PATH`（一時フォルダの `acceptance.sqlite3`）。`APP_ENV` は子プロセスの環境から外す | contracts/ になし。CLAUDE.md「DB とトランザクション」、設計メモ 3章 Seam #1、7章 E |
| 初期化 | `POST /api/v1/test/reset` | contracts/openapi.yaml `resetTestState` |
| データの投入 | `POST /api/v1/test/seed`（`category_xp`、`streak_days`、`last_study_date`、`challenges`、`review_cards`、`last_grade`、`graded_at`、`completed_at`） | contracts/openapi.yaml `seedTestState`、`TestSeedRequest` |
| 時刻の固定 | ヘッダ `X-Test-Now` | contracts/openapi.yaml `components.parameters.TestNowHeader` |
| 外部 URL の取得 | ヘッダ `X-Test-Url-Fetch-Mode`（`stub_ok` / `stub_timeout` / `stub_error`）、予約テストドメイン `ok.example.test`・`timeout.example.test`・`error.example.test` | ヘッダは contracts/openapi.yaml `TestUrlFetchModeHeader`。個々のドメイン名は設計メモ 3章 Seam #3 だけ（契約は `*.example.test` とだけ書く。未解決 4） |
| 再送の二重作成の防止 | ヘッダ `Idempotency-Key` | contracts/openapi.yaml `IdempotencyKeyHeader`。再送のときの応答（状態コードと中身）は定義なし（未解決 5） |
| 画面の接続先の切り替え | `GET /?api_base_url=<URL>` | contracts/openapi.yaml `getWebAppUi` の parameters |
| 画面の識別子 | `data-testid`：app-root、learning-form、title-input、url-input、memo-input、submit-learning-btn、offline-error-banner、retry-submit-btn、empty-state-guide、empty-state-cta-btn | 契約にあるのは `app-root`（例の HTML）だけ。ほかは設計メモ 2章・3章 Seam #4 だけ（未解決 1） |
| 外部への要求が0件の確認 | テストの中で `127.0.0.1:<空きポート>` に待ち受けを立て、受けた要求を数える | つなぎ口は不要（テストの側だけで完結） |
| 既存のサーバーに向ける（任意） | 環境変数 `DEVFORGE_ACCEPTANCE_BASE_URL`。付けるとサーバーを起動しない。再起動のテストは失敗する（飛ばさない） | 受け入れテストの側の設定で、アプリの設定ではない。G3 の判定では付けない |

## 5. 動かすコマンドと設定
受け入れテストは、受け入れテストのフォルダの中の設定だけで動かす（作り手の conftest.py やスキームに左右されないため）。
- iOS：対象外（`.claude/org/app.json` の `stacks` が `["backend"]`）
- バックエンド：`python3 -m unittest discover -s backend/tests/acceptance -t backend/tests/acceptance -p "test_*.py"`（CLAUDE.md の受け入れテストのコマンド。リポジトリの根で動かす。`app.json` の `commands.backend_test` はまだ空で、Takuma の更新待ち）
  - 設定は `backend/tests/acceptance/acceptance_support.py` だけ（起動、接続先、待ちの上限 `STARTUP_DEADLINE_SECONDS = 10`、HTTP の待ちの上限 10 秒、AC の値）。外部パッケージ0件、`__init__.py` なし、上のフォルダの設定に頼らない
  - サーバーはテストの実行中に1回起動し、全テストで使い回し、終わったら止めて一時フォルダを消す。テストごとに `test/reset` で状態を空にする
- 判定の実行では再試行を付けない（unittest にはその機能がなく、付けない）。
- 揺れの確認：同じコマンドを5回。順番に頼らないことは、1本ずつ別のプロセスで動かすのと、並びを変えて動かすので確かめる（unittest 標準にランダム順の機能がないため。赤の証拠の 4 節にやり方の例）。

## 6. 探索のチャーター
影響「大」のリスクごとに1本。G3 で行い、結果は verification.md の8章に書く。

| リスク | チャーター（<対象> を <手段や条件> で探り、<知りたいこと> を見つける） | 区切り（30分か40操作） |
|---|---|---|
| R1 | 登録・回答・評価を混ぜて続けた XP の合計を、`skills/summary` と各応答の `total_xp` を突き合わせながら探り、加算漏れ・二重加算・領域の取り違え・レベルの境界のずれを見つける | 30分 |
| R2 | 1枚のカードを grade をばらばらに10回評価し、`X-Test-Now` を `next_review_at` に合わせて進めながら探り、間隔が 0 以下・EF が 1.3 未満・期限から消えるカードを見つける | 40操作 |
| R3 | 期限到来のカードを 0・1・5・6・50 枚、未回答の問題を 0・1・2 件にした組み合わせで `sessions/today` を探り、6問を超える、並びが古い順でない、`estimated_seconds` が 180 を超える場合を見つける | 30分 |
| R4 | SSRF の回り道（`http://127.1/`、`http://0.0.0.0/`、`http://2130706433/`、`http://[::ffff:127.0.0.1]/`、`http://localhost./`、大文字小文字、ユーザー情報付き `http://a@127.0.0.1/`、公開ドメインからのリダイレクト）で探り、テストの待ち受けに要求が届く URL を見つける | 30分 |
| R5 | 外部 URL の取得を、スタブのヘッダと予約ドメインの食い違う組み合わせ（`stub_ok`＋`timeout.example.test` など）、長い URL（2,048 文字の前後）、title なし、で探り、3,000ms を超える・500 になる・`url_fetch_status` が3つの値以外になる場合を見つける（遅い応答や 512KB 超の応答を返す本物の待ち受けはループバックで、SSRF で拒否されるため使えない。必要なら G3 で tech-lead と相談） | 30分 |
| R6 | ブラウザで登録の途中に接続先を到達不能にし（`?api_base_url=`、サーバーの停止）、再試行・二度押し・再読み込みを混ぜて探り、入力が消える、二重に登録される場合を見つける | 40操作 |
| R7 | サーバーを登録の直後・評価の直後に止めて起動し直す、DB ファイルを読み取り専用にする、`DEVFORGE_DB_PATH` を存在しないフォルダにする、で探り、データが消える・起動で落ちて理由が出ない場合を見つける | 30分 |

## 7. 画面で確かめるもの
自動のテストで確かめにくいもの。G3 でスクリーンショットを docs/verification/001-personal-learning-loop/evidence/ に撮る。
外部パッケージ0件の決まり（CLAUDE.md、contracts/dependencies.md）のため、ブラウザを動かす自動テストの道具がない。画面の動きは G4 の人（G3 では verifier が手で撮る）に回す（未解決 9）。

| AC | 手順 | 撮るスクリーンショットのファイル名（AC3_オフライン.png の形） |
|---|---|---|
| AC-1 | 空の状態で `GET /` を開き、title・memo を入れて登録し、生成された問題1問（`challenge-card`）と `+15 XP`（`xp-badge`）が出るのを見る | AC1_登録結果.png |
| AC-2 | seed で未回答2件＋期限到来7枚にして `GET /` を開き、「本日のセッション（全6問・目安3分）」と問題1問・カード5枚を見る | AC2_本日のセッション.png |
| AC-3 | 問題に回答し、達成観点数を選んで送り、獲得 XP とルーブリックの解説（`model-points-list`）を見る | AC3_回答結果.png |
| AC-4 | カードの答えを見て grade 3 を押し、本日の残りが1件減るのを見る | AC4_評価後.png |
| AC-5 | ダッシュボード（`skills-summary-panel`）で6領域のレベル・XP・次レベルまでの残り、連続日数を見る | AC5_スキルツリー.png |
| AC-6 | reset の直後に `GET /` を開き、空状態の文言（PRD の文と一字一句）と誘導ボタンがあり、押すと登録フォームに移るのを見る。クラッシュや空白でないこと | AC6_空状態.png |
| AC-7 | memo を9文字で登録し、入力エラーの文言（`validation-error-banner`）が出て、入力が残るのを見る | AC7_入力エラー.png |
| AC-8 | `GET /?api_base_url=http://127.0.0.1:59999` で開き、title・URL・memo を入れて登録し、入力が消えずにバナー「通信に失敗しました。入力内容は保持されています」と「再試行」ボタンが出るのを見る。接続先を戻して再試行し、1件だけ登録されるのを見る | AC8_オフライン.png、AC8_再試行後.png |
| AC-9 | ブラウザのサイト設定で通知・クリップボードをすべてブロックし、AC-1〜AC-5 の操作を通して、エラー（コンソールの未捕捉の例外を含む）が0件なのを見る。`file:///etc/passwd` を URL に入れて登録し、エラーの文言を見る | AC9_権限拒否.png、AC9_SSRF拒否.png |

## 8. 赤の証拠（実装の前に落ちたこと）
- ログ：docs/verification/001-personal-learning-loop/evidence/red.log
- 実行したコマンドと終了コード：`python3 -m unittest discover -s backend/tests/acceptance -t backend/tests/acceptance -p "test_*.py"` → 終了コード 1、`Ran 28 tests`、`FAILED (errors=28)`、FAIL 0、読み込みの失敗（ImportError / SyntaxError）0
- 落ちた理由（1行。「機能がまだない」ことを示す）：28件すべて「サーバーが起動できない（`python3 -m backend.app` が終了コード 1 で終わった）」。サーバーの出力は `No module named backend.app`（`backend/` に実装がまだない）
- 参考（合否の証拠ではない）：契約の例と式から書いた使い捨ての偽サーバー（リポジトリの外）で同じ起動の道を通し、28件が最後まで動くこと、1本ずつ・並びを変えても動くことを確かめた（red.log の 4 節）

## 9. 範囲の外
- 存在しない `challenge_id` / `card_id` の 404：契約にはあるが PRD に AC がない（AC のないテストは作らない）。探索 R2 で観察する
- `APP_ENV=production` のときのテスト用エンドポイントの 403：設計メモでは単体テスト（G2）の担当
- CORS、Content-Type が JSON でない POST の拒否、`X-Request-Id`、telemetry のイベント：設計メモの非機能・脅威モデルの項目で、PRD に AC がない
- `lang=en` の表示、200% の拡大、コントラスト：PRD 12章の非機能で AC がない（3章で G4 の人）
- 解答済みの問題をもう一度送る、空白だけの memo、絵文字の文字数の数え方：PRD と契約に期待する結果がない（未解決 8 で質問）
- 連続日数が2日以上空いたときの値、`overall_level` の式、直近7日の端：PRD と契約で決まっていない（未解決 6・7）
- 公開ドメインへの本物の取得（`live` での `https://example.com/` など）：外部インターネットに依存するため受け入れテストでは使わない

## 確かめ（提出前に verifier が印を付ける。reviewer はこれを信じずに確かめる）
- [x] 読んだファイルが PRD、design/、contracts/ だけで、冒頭に全部並んでいる。（指示書が挙げた設計メモ・G0 の報告・CLAUDE.md・役のファイルも読み、冒頭に並べた。実装のコードは開いていない）
- [x] PRD のすべての AC 番号が、2章とテストの名前にある。AC のないテストがない。（PRD：AC-1〜AC-9、テスト：AC1_〜AC9_、AC のないテスト 0件、28件）
- [x] 2章の全行に、技法、試す値、具体的な値の結果がある。「正しく」「適切に」だけの結果がない。
- [x] 影響「大」のリスクのすべてに、自動テスト、3章の行、6章のチャーターがある。（R1〜R7）
- [x] 3章の9行すべてに選んだものがあり、範囲外には理由がある。
- [x] 4章のつなぎ口がすべて contracts/ にあるか、「未解決」に依頼として書いた。
- [x] 受け入れテストのフォルダで、sleep、skip、xfail、XCTExpectFailure、retry、@testable import が0件（grep のコマンドと件数を報告に書いた）。（retry は1件：設計メモの識別子 `retry-submit-btn` で、再試行の仕組みではない）
- [x] 8章の赤の証拠があり、落ちた理由が書き間違いではなく「機能がまだない」こと。
