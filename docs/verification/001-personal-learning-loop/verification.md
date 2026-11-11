# 検証レポート 001-personal-learning-loop

置き場所：docs/verification/001-personal-learning-loop/verification.md

判定：PASS

- 関門：G3
- 検証した役：verifier　日時：2026-11-12 01:33 JST
- コミット：`99429364e8d35643d2571d47abfeda96401aa264`
- 環境：macOS 27.2 (Build 26B123)、Xcode 27.2 (Build 27B52、ただし `.claude/org/app.json` の `stacks` が `["backend"]` のため iOS シミュレーター実行は対象外)、Python 3.9.6（標準 `unittest`、外部パッケージ依存 0 件）、SQLite 3.54.0（WAL モード）、バックエンド接続先 `http://127.0.0.1:<動的空きローカルポート>`（`python3 -B -m backend.app` を `DEVFORGE_HOST=127.0.0.1`・`DEVFORGE_PORT=<空きポート>`・一時フォルダの `DEVFORGE_DB_PATH` でブラックボックスプロセス起動して本物の HTTP で接続）。

## 1. 実行したコマンドと結果
コマンドごとに書く。判定の実行では再試行を付けない（-retry-tests-on-failure、--reruns）。出力は省略せず、長ければ最後の 30 行を貼る。

### コマンド 1（受け入れテスト全31件の再試行なし実行：`evidence/green.log`）
- コマンド：`PYTHONDONTWRITEBYTECODE=1 python3 -B -m unittest discover -v -s backend/tests/acceptance -t backend/tests/acceptance -p "test_*.py"`
- 終了コード：`0`
- テストの件数（成功 / 失敗 / 飛ばした）：`31 / 0 / 0`
- 出力（全36行・省略なし）：

```text
test_AC1_URLなし領域自動_3秒以内に201で15XPと3観点の問題1問と初回カードが返り保存される (test_ac1_create_learning.AC1_CreateLearningTest) ... ok
test_AC1_メモ境界値10文字と2000文字_どちらも201 (test_ac1_create_learning.AC1_CreateLearningTest) ... ok
test_AC1_公開URLあり取得成功_201でurl_fetch_statusがfetched (test_ac1_create_learning.AC1_CreateLearningTest) ... ok
test_AC1_登録の後にサーバーを再起動しても_XPと問題とカードが残る (test_ac1_create_learning.AC1_CreateLearningTest) ... ok
test_AC1_領域を指定_6領域それぞれ指定どおりに15XPが入る (test_ac1_create_learning.AC1_CreateLearningTest) ... ok
test_AC2_未回答3件と期限到来7枚_1秒以内に200で問題1件とカード古い順5件と総数7 (test_ac2_today_session.AC2_TodaySessionTest) ... ok
test_AC2_現在時刻を3日進める_期限到来の総数が9になり表示は5件のまま (test_ac2_today_session.AC2_TodaySessionTest) ... ok
test_AC3_3観点すべて達成_1秒以内に200でcompletedと50XPと連続日数が1増え保存される (test_ac3_submit_challenge.AC3_SubmitChallengeTest) ... ok
test_AC3_連続日数_2日以上空いた間はsummaryが0で回答すると1に戻る (test_ac3_submit_challenge.AC3_SubmitChallengeTest) ... ok
test_AC3_連続日数_当日初回なら1増え当日2回目なら増えない (test_ac3_submit_challenge.AC3_SubmitChallengeTest) ... ok
test_AC3_達成観点数0から3_XPは20から50でレベルの境界100をまたぐ (test_ac3_submit_challenge.AC3_SubmitChallengeTest) ... ok
test_AC4_rep1から4段階それぞれ_rep間隔EFと次回日時が契約の式どおり (test_ac4_grade_review.AC4_GradeReviewTest) ... ok
test_AC4_rep1でgrade3_1秒以内に200でrep2と間隔6日と10XPになり未消化が1件減る (test_ac4_grade_review.AC4_GradeReviewTest) ... ok
test_AC4_rep2以上と下限_四捨五入とease_factorの下限1点3 (test_ac4_grade_review.AC4_GradeReviewTest) ... ok
test_AC5_レベルの境界_99は1で100は2で199は2で200は3 (test_ac5_skills_summary.AC5_SkillsSummaryTest) ... ok
test_AC5_学習実績あり_1秒以内に200で6領域のXPとレベルと残りXPと全体の値が返る (test_ac5_skills_summary.AC5_SkillsSummaryTest) ... ok
test_AC5_直近7日間の境界_ちょうど168時間前と現在時刻は含み168時間1秒前は含まない (test_ac5_skills_summary.AC5_SkillsSummaryTest) ... ok
test_AC5_直近7日間の達成数_思考問題クリア2件と復習grade3以上2件で4 (test_ac5_skills_summary.AC5_SkillsSummaryTest) ... ok
test_AC6_学習データ0件_セッションは空で6領域すべて0XPレベル1 (test_ac6_empty_state.AC6_EmptyStateTest) ... ok
test_AC6_学習済みでも本日の未回答0件と期限到来0枚_セッションは空 (test_ac6_empty_state.AC6_EmptyStateTest) ... ok
test_AC6_画面HTMLに空状態ガイドと登録フォームへの誘導ボタンの識別子がある (test_ac6_empty_state.AC6_EmptyStateTest) ... ok
test_AC7_gradeが0と5とマイナスと小数と文字列と真偽値とnullと欠落_1秒以内に400でカードは変わらない (test_ac7_validation_error.AC7_ValidationErrorTest) ... ok
test_AC7_メモが9文字と2001文字と空と欠落と型違い_1秒以内に400で保存されない (test_ac7_validation_error.AC7_ValidationErrorTest) ... ok
test_AC7_回答が9文字と2001文字と達成観点数がマイナス1と4_400で問題は未回答のまま (test_ac7_validation_error.AC7_ValidationErrorTest) ... ok
test_AC7_空白だけと前後空白を除いて9文字以下のmemoとanswer_1秒以内に400で保存されない (test_ac7_validation_error.AC7_ValidationErrorTest) ... ok
test_AC8_URL取得がタイムアウトと接続失敗_3秒以内に201でfallback_usedとメモから問題とカードができる (test_ac8_fallback_and_offline.AC8_FallbackAndOfflineTest) ... ok
test_AC8_接続先を到達不能にした画面HTMLにエラーバナーと再試行ボタンと入力欄の識別子がある (test_ac8_fallback_and_offline.AC8_FallbackAndOfflineTest) ... ok
test_AC8_通信切断後の再試行_同じIdempotency_Keyで2回送っても1件だけ作られる (test_ac8_fallback_and_offline.AC8_FallbackAndOfflineTest) ... ok
test_AC9_プライベートとリンクローカルとlocalhostと非HTTPスキーム_すべて400で保存されない (test_ac9_ssrf_and_permissions.AC9_SsrfAndPermissionsTest) ... ok
test_AC9_ループバックの待ち受けを指すURL_400で待ち受けへの要求は0件 (test_ac9_ssrf_and_permissions.AC9_SsrfAndPermissionsTest) ... ok
test_AC9_画面HTMLは通知やクリップボードなどのブラウザ権限APIを呼ばない (test_ac9_ssrf_and_permissions.AC9_SsrfAndPermissionsTest) ... ok

----------------------------------------------------------------------
Ran 31 tests in 2.060s

OK
```

### コマンド 2（影響「大」の AC テストを含む全31件の5回連続反復＋モジュール逆順実行：`evidence/repeat-5x.log`）
- コマンド：`for i in 1 2 3 4 5; do PYTHONDONTWRITEBYTECODE=1 python3 -B -m unittest discover -v -s backend/tests/acceptance -t backend/tests/acceptance -p "test_*.py"; done`（続けて `PYTHONPATH=backend/tests/acceptance PYTHONDONTWRITEBYTECODE=1 python3 -B -m unittest -v test_ac9_ssrf_and_permissions ... test_ac1_create_learning` で AC-9→AC-1 の逆順実行）
- 終了コード：`0`（RUN 1〜5 すべて `0`、逆順実行も `0`）
- テストの件数（成功 / 失敗 / 飛ばした）：各回 `31 / 0 / 0`（5回連続合計 `155 / 0 / 0`＋逆順実行 `31 / 0 / 0`＝延べ `186 / 0 / 0`）
- 出力（各回の結果と `evidence/repeat-5x.log` の末尾 36 行）：

```text
=== RUN 1 / 5 === Ran 31 tests in 2.065s / OK / RUN_1_EXIT_CODE=0
=== RUN 2 / 5 === Ran 31 tests in 2.064s / OK / RUN_2_EXIT_CODE=0
=== RUN 3 / 5 === Ran 31 tests in 2.058s / OK / RUN_3_EXIT_CODE=0
=== RUN 4 / 5 === Ran 31 tests in 2.065s / OK / RUN_4_EXIT_CODE=0
=== RUN 5 / 5 === Ran 31 tests in 2.052s / OK / RUN_5_EXIT_CODE=0
=== REVERSE ORDER CHECK (AC9 -> AC1) ===
test_AC9_プライベートとリンクローカルとlocalhostと非HTTPスキーム_すべて400で保存されない (test_ac9_ssrf_and_permissions.AC9_SsrfAndPermissionsTest) ... ok
test_AC9_ループバックの待ち受けを指すURL_400で待ち受けへの要求は0件 (test_ac9_ssrf_and_permissions.AC9_SsrfAndPermissionsTest) ... ok
test_AC9_画面HTMLは通知やクリップボードなどのブラウザ権限APIを呼ばない (test_ac9_ssrf_and_permissions.AC9_SsrfAndPermissionsTest) ... ok
test_AC8_URL取得がタイムアウトと接続失敗_3秒以内に201でfallback_usedとメモから問題とカードができる (test_ac8_fallback_and_offline.AC8_FallbackAndOfflineTest) ... ok
test_AC8_接続先を到達不能にした画面HTMLにエラーバナーと再試行ボタンと入力欄の識別子がある (test_ac8_fallback_and_offline.AC8_FallbackAndOfflineTest) ... ok
test_AC8_通信切断後の再試行_同じIdempotency_Keyで2回送っても1件だけ作られる (test_ac8_fallback_and_offline.AC8_FallbackAndOfflineTest) ... ok
test_AC7_gradeが0と5とマイナスと小数と文字列と真偽値とnullと欠落_1秒以内に400でカードは変わらない (test_ac7_validation_error.AC7_ValidationErrorTest) ... ok
test_AC7_メモが9文字と2001文字と空と欠落と型違い_1秒以内に400で保存されない (test_ac7_validation_error.AC7_ValidationErrorTest) ... ok
test_AC7_回答が9文字と2001文字と達成観点数がマイナス1と4_400で問題は未回答のまま (test_ac7_validation_error.AC7_ValidationErrorTest) ... ok
test_AC7_空白だけと前後空白を除いて9文字以下のmemoとanswer_1秒以内に400で保存されない (test_ac7_validation_error.AC7_ValidationErrorTest) ... ok
test_AC6_学習データ0件_セッションは空で6領域すべて0XPレベル1 (test_ac6_empty_state.AC6_EmptyStateTest) ... ok
test_AC6_学習済みでも本日の未回答0件と期限到来0枚_セッションは空 (test_ac6_empty_state.AC6_EmptyStateTest) ... ok
test_AC6_画面HTMLに空状態ガイドと登録フォームへの誘導ボタンの識別子がある (test_ac6_empty_state.AC6_EmptyStateTest) ... ok
test_AC5_レベルの境界_99は1で100は2で199は2で200は3 (test_ac5_skills_summary.AC5_SkillsSummaryTest) ... ok
test_AC5_学習実績あり_1秒以内に200で6領域のXPとレベルと残りXPと全体の値が返る (test_ac5_skills_summary.AC5_SkillsSummaryTest) ... ok
test_AC5_直近7日間の境界_ちょうど168時間前と現在時刻は含み168時間1秒前は含まない (test_ac5_skills_summary.AC5_SkillsSummaryTest) ... ok
test_AC5_直近7日間の達成数_思考問題クリア2件と復習grade3以上2件で4 (test_ac5_skills_summary.AC5_SkillsSummaryTest) ... ok
test_AC4_rep1から4段階それぞれ_rep間隔EFと次回日時が契約の式どおり (test_ac4_grade_review.AC4_GradeReviewTest) ... ok
test_AC4_rep1でgrade3_1秒以内に200でrep2と間隔6日と10XPになり未消化が1件減る (test_ac4_grade_review.AC4_GradeReviewTest) ... ok
test_AC4_rep2以上と下限_四捨五入とease_factorの下限1点3 (test_ac4_grade_review.AC4_GradeReviewTest) ... ok
test_AC3_3観点すべて達成_1秒以内に200でcompletedと50XPと連続日数が1増え保存される (test_ac3_submit_challenge.AC3_SubmitChallengeTest) ... ok
test_AC3_連続日数_2日以上空いた間はsummaryが0で回答すると1に戻る (test_ac3_submit_challenge.AC3_SubmitChallengeTest) ... ok
test_AC3_連続日数_当日初回なら1増え当日2回目なら増えない (test_ac3_submit_challenge.AC3_SubmitChallengeTest) ... ok
test_AC3_達成観点数0から3_XPは20から50でレベルの境界100をまたぐ (test_ac3_submit_challenge.AC3_SubmitChallengeTest) ... ok
test_AC2_未回答3件と期限到来7枚_1秒以内に200で問題1件とカード古い順5件と総数7 (test_ac2_today_session.AC2_TodaySessionTest) ... ok
test_AC2_現在時刻を3日進める_期限到来の総数が9になり表示は5件のまま (test_ac2_today_session.AC2_TodaySessionTest) ... ok
test_AC1_URLなし領域自動_3秒以内に201で15XPと3観点の問題1問と初回カードが返り保存される (test_ac1_create_learning.AC1_CreateLearningTest) ... ok
test_AC1_メモ境界値10文字と2000文字_どちらも201 (test_ac1_create_learning.AC1_CreateLearningTest) ... ok
test_AC1_公開URLあり取得成功_201でurl_fetch_statusがfetched (test_ac1_create_learning.AC1_CreateLearningTest) ... ok
test_AC1_登録の後にサーバーを再起動しても_XPと問題とカードが残る (test_ac1_create_learning.AC1_CreateLearningTest) ... ok
test_AC1_領域を指定_6領域それぞれ指定どおりに15XPが入る (test_ac1_create_learning.AC1_CreateLearningTest) ... ok

----------------------------------------------------------------------
Ran 31 tests in 2.097s

OK
REVERSE_ORDER_EXIT_CODE=0
```

### コマンド 3（単一ページ Web UI・アクセシビリティ HTTP 検証および R1〜R7 探索テスト：`evidence/ui-a11y-check.log`、`evidence/exploratory.log`）
- コマンド：ブラックボックス起動した `PYTHONDONTWRITEBYTECODE=1 python3 -B -m backend.app` に対し標準ライブラリ `urllib.request` / `html.parser` で `GET /`・`GET /?lang=ja`・`GET /?lang=en`・`GET /?api_base_url=http://127.0.0.1:59999` および `/api/v1/*` の HTTP 検証・7チャーター探索を実行（使い捨てスクリプトは標準入力から実行しリポジトリ内にファイル残存なし）
- 終了コード：`0`
- テストの件数（成功 / 失敗 / 飛ばした）：Web UI・アクセシビリティ検査 16 項目すべて合格、探索テスト 7 セッション（計 188 HTTP 操作＋3 CLI 異常系起動検査）すべて合格
- 出力（`evidence/exploratory.log` 先頭 28 行）：

```text
=== SESSION 1 (R1 / C1): XP accumulation, level boundaries, streak & re-submit guards ===
  [PASS] Session 1 completed (25 HTTP ops): XP={'architecture': 55, 'backend': 55, 'data': 65, 'reliability': 75, 'security': 45, 'trend': 55}, total=350, overall_lv=4, streak=3, weekly_mastered=11, 409/422/replay verified.

=== SESSION 2 (R2 / C2): 12 sequential SM-2 grades, EF>=1.3, 404/409 & validation precedence ===
  [PASS] Session 2 completed (53 HTTP ops): trace=[(1, 3, 1, 1, 2.5), (2, 4, 2, 8, 2.6), (3, 2, 3, 10, 2.45), (4, 1, 0, 1, 2.25), (5, 1, 0, 1, 2.05), (6, 1, 0, 1, 1.85), (7, 1, 0, 1, 1.65), (8, 1, 0, 1, 1.45), (9, 1, 0, 1, 1.3), (10, 2, 1, 1, 1.3), (11, 3, 2, 6, 1.3), (12, 4, 3, 10, 1.4)]

=== SESSION 3 (R3 / C3): Session matrix (0/1/5/6/50 due cards x 0/1/2 pending challenges) ===
  [PASS] Session 3 completed (31 HTTP ops): all 15 combinations + tie-break + +09:00 offset passed (<1s, <=6 items, <=180s).

=== SESSION 4 (R4 / C4): SSRF bypass vectors (decimal/hex/octal IP, IPv6-mapped, userinfo, trailing dot, CGNAT) ===
  Trap hits: 0 (must be 0)
  Tested 40 SSRF requests across 20 vectors; non-400 results: []

=== SESSION 5 (R5 / C5): Stub header vs reserved domain precedence, URL/title/emoji boundaries & UI fallback ===
  Empty string url='' returned status=400 ({'code': 'INVALID_URL_SCHEME_OR_HOST', 'message': 'url には公開 http/https URL のみ指定できます（ローカルホストやプライベートIPは指定できません）', 'field': 'url'})
  [PASS] Session 5 completed (14 HTTP ops): precedence 6/6, URL 2048->201 / 2049->400, title 200->201 / 201->400, ZWJ emoji 10cp->201, UI unknown fallback (Other/その他=True, problem.title=True).

=== SESSION 6 (R6 / C6): Concurrent Idempotency-Key race, 4xx->201 retry with same key, key length & UI draft logic ===
  Empty Idempotency-Key='' status=400 (VALIDATION_ERROR)
  [PASS] Session 6 completed (15 HTTP ops): 5-way concurrent race -> 1 record (4 replayed), 400->201 key reuse OK, cross-endpoint key -> 422, key length 1/128->201 & 129->400, UI JS (localStorage draft=False, Idempotency-Key=True, api_base_url injected=True).

=== SESSION 7 (R7 / C7): Restart durability, read-only DB 500 problem+json, invalid env exit codes & APP_ENV=production ===
  Read-only DB POST status=500, content-type=application/problem+json; charset=utf-8, body={"type":"https://devforge.local/problems/internal-error","title":"サーバー内部エラーが発生しました","status":500,"detail":"予期しないサーバー内部エラーが発生しました","instance":"/api/v1/learnings","error":{"code":"INTERNAL_ERROR","message":"予期しないサーバー内部エラーが発生しました"}}
  Bad DEVFORGE_DB_PATH -> exit=2, stderr="Startup configuration error: Invalid DEVFORGE_DB_PATH='.../no_such_parent_dir/x.sqlite3': parent directory '.../no_such_parent_dir' does not exist"
  Bad DEVFORGE_HOST=0.0.0.0 -> exit=2, stderr="Startup configuration error: Invalid DEVFORGE_HOST='0.0.0.0': non-loopback binding is refused because authentication is disabled"
  Bad DEVFORGE_PORT=70000 -> exit=2, stderr="Startup configuration error: Invalid DEVFORGE_PORT='70000': port out of range (1..65535)"
  [PASS] Session 7 completed (10 HTTP ops + 3 CLI checks): restart durability OK, read-only DB -> 500 INTERNAL_ERROR & live recovery OK, bad env vars exit!=0 with var names, APP_ENV=production 403 & header ignore OK.
```

## 2. 受け入れ条件ごとの結果
揺れたテストがある AC は、通っても未検証にする。

| AC | 結果（PASS / FAIL / 未検証） | 動いたテストの数 | 飛ばしたテストの数 | 証拠（テストの名前、ログの行、スクリーンショットのパス） |
|---|---|---|---|---|
| AC-1 | PASS | 5 | 0 | `test_ac1_create_learning.py`：`test_AC1_URLなし領域自動_3秒以内に201で15XPと3観点の問題1問と初回カードが返り保存される`、`test_AC1_メモ境界値10文字と2000文字_どちらも201`、`test_AC1_公開URLあり取得成功_201でurl_fetch_statusがfetched`、`test_AC1_登録の後にサーバーを再起動しても_XPと問題とカードが残る`、`test_AC1_領域を指定_6領域それぞれ指定どおりに15XPが入る`（`docs/verification/001-personal-learning-loop/evidence/green.log` L1-L5、`evidence/repeat-5x.log`、`evidence/exploratory.log` L1-L2, L14-L16, L22-L27） |
| AC-2 | PASS | 2 | 0 | `test_ac2_today_session.py`：`test_AC2_未回答3件と期限到来7枚_1秒以内に200で問題1件とカード古い順5件と総数7`、`test_AC2_現在時刻を3日進める_期限到来の総数が9になり表示は5件のまま`（`docs/verification/001-personal-learning-loop/evidence/green.log` L6-L7、`evidence/repeat-5x.log`、`evidence/exploratory.log` L7-L8） |
| AC-3 | PASS | 4 | 0 | `test_ac3_submit_challenge.py`：`test_AC3_3観点すべて達成_1秒以内に200でcompletedと50XPと連続日数が1増え保存される`、`test_AC3_連続日数_2日以上空いた間はsummaryが0で回答すると1に戻る`、`test_AC3_連続日数_当日初回なら1増え当日2回目なら増えない`、`test_AC3_達成観点数0から3_XPは20から50でレベルの境界100をまたぐ`（`docs/verification/001-personal-learning-loop/evidence/green.log` L8-L11、`evidence/repeat-5x.log`、`evidence/exploratory.log` L1-L2） |
| AC-4 | PASS | 3 | 0 | `test_ac4_grade_review.py`：`test_AC4_rep1から4段階それぞれ_rep間隔EFと次回日時が契約の式どおり`、`test_AC4_rep1でgrade3_1秒以内に200でrep2と間隔6日と10XPになり未消化が1件減る`、`test_AC4_rep2以上と下限_四捨五入とease_factorの下限1点3`（`docs/verification/001-personal-learning-loop/evidence/green.log` L12-L14、`evidence/repeat-5x.log`、`evidence/exploratory.log` L4-L5） |
| AC-5 | PASS | 4 | 0 | `test_ac5_skills_summary.py`：`test_AC5_レベルの境界_99は1で100は2で199は2で200は3`、`test_AC5_学習実績あり_1秒以内に200で6領域のXPとレベルと残りXPと全体の値が返る`、`test_AC5_直近7日間の境界_ちょうど168時間前と現在時刻は含み168時間1秒前は含まない`、`test_AC5_直近7日間の達成数_思考問題クリア2件と復習grade3以上2件で4`（`docs/verification/001-personal-learning-loop/evidence/green.log` L15-L18、`evidence/repeat-5x.log`、`evidence/exploratory.log` L1-L2） |
| AC-6 | PASS | 3 | 0 | `test_ac6_empty_state.py`：`test_AC6_学習データ0件_セッションは空で6領域すべて0XPレベル1`、`test_AC6_学習済みでも本日の未回答0件と期限到来0枚_セッションは空`、`test_AC6_画面HTMLに空状態ガイドと登録フォームへの誘導ボタンの識別子がある`（`docs/verification/001-personal-learning-loop/evidence/green.log` L19-L21、`evidence/repeat-5x.log`、`evidence/ui-a11y-check.log` L3, L186） |
| AC-7 | PASS | 4 | 0 | `test_ac7_validation_error.py`：`test_AC7_gradeが0と5とマイナスと小数と文字列と真偽値とnullと欠落_1秒以内に400でカードは変わらない`、`test_AC7_メモが9文字と2001文字と空と欠落と型違い_1秒以内に400で保存されない`、`test_AC7_回答が9文字と2001文字と達成観点数がマイナス1と4_400で問題は未回答のまま`、`test_AC7_空白だけと前後空白を除いて9文字以下のmemoとanswer_1秒以内に400で保存されない`（`docs/verification/001-personal-learning-loop/evidence/green.log` L22-L25、`evidence/repeat-5x.log`） |
| AC-8 | PASS | 3 | 0 | `test_ac8_fallback_and_offline.py`：`test_AC8_URL取得がタイムアウトと接続失敗_3秒以内に201でfallback_usedとメモから問題とカードができる`、`test_AC8_接続先を到達不能にした画面HTMLにエラーバナーと再試行ボタンと入力欄の識別子がある`、`test_AC8_通信切断後の再試行_同じIdempotency_Keyで2回送っても1件だけ作られる`（`docs/verification/001-personal-learning-loop/evidence/green.log` L26-L28、`evidence/repeat-5x.log`、`evidence/ui-a11y-check.log` L6, L187、`evidence/exploratory.log` L14-L20, L29-L59） |
| AC-9 | PASS | 3 | 0 | `test_ac9_ssrf_and_permissions.py`：`test_AC9_プライベートとリンクローカルとlocalhostと非HTTPスキーム_すべて400で保存されない`、`test_AC9_ループバックの待ち受けを指すURL_400で待ち受けへの要求は0件`、`test_AC9_画面HTMLは通知やクリップボードなどのブラウザ権限APIを呼ばない`（`docs/verification/001-personal-learning-loop/evidence/green.log` L29-L31、`evidence/repeat-5x.log`、`evidence/exploratory.log` L10-L12） |

## 3. 状態ごとの結果
test-plan の3章の選んだものを写す。「自動」の行には結果と証拠を、ほかの行には理由か G4 への申し送りを書く。

| 状態 | 選んだもの（自動 / G4 の人 / 範囲外） | 結果 | 証拠のパス、または理由 |
|---|---|---|---|
| 初めて起動 | 自動 | PASS | 新しい一時フォルダの `DEVFORGE_DB_PATH` でサーバーを起動し、`test_AC6_学習データ0件_セッションは空で6領域すべて0XPレベル1` および全テストの `setUp`（`POST /api/v1/test/reset`）で確認。サーバー起動〜初回 `GET /` 応答は `104.9ms`（目標 500ms 以内）。証拠：`docs/verification/001-personal-learning-loop/evidence/green.log` L19、`evidence/ui-a11y-check.log` L1 |
| データがある | 自動 | PASS | `POST /api/v1/test/seed` と本物の `POST /api/v1/learnings` を使う AC-1〜AC-5・AC-7 のテスト、および `test_AC1_登録の後にサーバーを再起動しても_XPと問題とカードが残る` で確認。証拠：`docs/verification/001-personal-learning-loop/evidence/green.log` L4, L6-L18、`evidence/exploratory.log` L1-L8, L22-L27 |
| 前の版からの更新 | 範囲外 | 該当なし（再起動互換は PASS） | 初回リリース（機能 `001`）のため公開済みの前の版がなく `git tag` も 0 件。代替として同一 `DEVFORGE_DB_PATH` でのプロセス停止・再起動時のスキーマ再初期化互換と全レコード保持を `test_AC1_登録の後にサーバーを再起動しても_...`（`evidence/green.log` L4）および探索セッション 7（`evidence/exploratory.log` L22-L27）で確認し PASS。次機能からは本機能のタグで作った SQLite DB を新しい版で開く更新テストを追加する |
| オフライン、サーバーエラー | 自動（外部 URL の失敗）＋ G4 の人（ブラウザとサーバーの通信の切断） | 自動分 PASS / G4 申し送り | 自動：`test_AC8_URL取得がタイムアウトと接続失敗_...`、`test_AC8_通信切断後の再試行_...`、`test_AC8_接続先を到達不能にした画面HTMLに...`（`evidence/green.log` L26-L28）、および探索セッション 6・7（`evidence/exploratory.log` L18-L27, L29-L59：5並列再送の冪等制御、読み取り専用DB時の HTTP 500 `application/problem+json` と復旧、UI JS の `localStorage` 下書き保存 `devforge_draft_learning_v1` と `Idempotency-Key` 再利用を確認）。G4 申し送り：`test-plan.md` 7章 AC-8 の手順（実ブラウザで `?api_base_url=http://127.0.0.1:59999` を開いて入力保持・エラーバナー表示・再試行を実機確認）を G4 で Takuma に申し送る |
| 権限を断った | 自動（HTML が権限 API を呼ばない）＋ G4 の人 | 自動分 PASS / G4 申し送り | 自動：`test_AC9_画面HTMLは通知やクリップボードなどのブラウザ権限APIを呼ばない`（`evidence/green.log` L31：`Notification.requestPermission`、`navigator.clipboard`、`navigator.permissions`、`getUserMedia`、`navigator.geolocation`、`PushManager` がすべて 0 件）。G4 申し送り：`test-plan.md` 7章 AC-9 の手順（ブラウザのサイト設定で通知・クリップボードを「ブロック」にして AC-1〜AC-5 を通しコンソール未捕捉例外 0 件を確認）を G4 で Takuma に申し送る |
| バックグラウンドから復帰 | G4 の人 | G4 申し送り | PRD にタブ復帰時の AC がないため `test-plan.md` 3章どおり G4 の Takuma 確認へ申し送る（学習メモ入力中に別タブへ切り替え・戻った際に入力が残るかを確認。なお `GET /` の JS で `localStorage` キー `devforge_draft_learning_v1` に入力下書きを自動保存・復元する実装になっていることを `evidence/exploratory.log` L33-L37, L58-L59 で確認済み） |
| 言語と地域（ja、en） | G4 の人 | G4 申し送り（HTTP 検査 PASS） | PRD 12章の非機能要件（AC なし）のため `test-plan.md` 3章では G4 の人を選択。G3 のブラックボックス HTTP 検査（`evidence/ui-a11y-check.log` L1-L42, L185-L188, L592）で `GET /`（`html lang="ja"`）と `GET /?lang=en`（`html lang="en"`）の日英全 70 文言キーの完全一致（欠落 0 件・`null` 0 件）および `GET /api/v1/skills/summary` の 6 領域 `label_ja` / `label_en` を確認済み。実ブラウザでの日英表示確認を G4 へ申し送る |
| 大きい文字、ダークモード | G4 の人 | G4 申し送り（CSS 検査 PASS） | PRD 12章の非機能要件（AC なし）のため `test-plan.md` 3章では G4 の人を選択。G3 のブラックボックス HTTP 検査（`evidence/ui-a11y-check.log` L43-L184, L570-L583）で `@media (prefers-color-scheme: dark)` と `:root[data-theme="dark"]`、`overflow-wrap: anywhere`、レスポンシブ `minmax(min(100%, ...), 1fr)` グリッド、44x44px 以上の押下領域、Light/Dark 全 11 組のコントラスト比（最小 6.70:1 / 7.41:1 >= WCAG AA 4.5:1）を確認済み。実ブラウザでの 200% 文字拡大（文字切れ・重なり 0 件）とダーク表示目視を G4 へ申し送る |
| 容量不足、割り込み | 範囲外 | 該当なし（観察項目 PASS） | ローカル単一利用者環境でディスク満杯を注入する契約つなぎ口および該当 AC がないため範囲外。`test-plan.md` 3章の計画どおり探索セッション 7（`evidence/exploratory.log` L23, L27）で DB ファイルを読み取り専用（`0444`）にした状態で `POST /api/v1/learnings` を送り、クラッシュせず HTTP 500 `application/problem+json`（`error.code: "INTERNAL_ERROR"`）を返し権限復旧後にそのまま正常書き込みへ復帰することを確認 |

## 4. 揺れの確認
影響「大」の AC のテストと、一度でも落ちたテストを繰り返す。1回でも落ちたら、その AC は未検証。
`test-plan.md` 1章の影響「大」のリスク（R1〜R7）は全 AC（とくに R7 が全 AC、R1〜R6 が AC-1・AC-2・AC-3・AC-4・AC-5・AC-6・AC-8・AC-9）に関わるため、全31件の受け入れテストスイートを5回連続で反復実行し、さらにモジュール逆順（AC-9→AC-1）でも実行した（証拠：`docs/verification/001-personal-learning-loop/evidence/repeat-5x.log`）。一度も落ちたテストは 0 件である。

| テストの名前 | コマンド | 回数 | 落ちた回数 | 原因の型（待ち方、順番、時刻、外部サービス、後片付け） |
|---|---|---|---|---|
| `test_ac1_create_learning.py::test_AC1_URLなし領域自動_3秒以内に201で15XPと3観点の問題1問と初回カードが返り保存される` | `PYTHONDONTWRITEBYTECODE=1 python3 -B -m unittest discover -v -s backend/tests/acceptance -t backend/tests/acceptance -p "test_*.py"` | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac1_create_learning.py::test_AC1_メモ境界値10文字と2000文字_どちらも201` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac1_create_learning.py::test_AC1_公開URLあり取得成功_201でurl_fetch_statusがfetched` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac1_create_learning.py::test_AC1_登録の後にサーバーを再起動しても_XPと問題とカードが残る` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac1_create_learning.py::test_AC1_領域を指定_6領域それぞれ指定どおりに15XPが入る` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac2_today_session.py::test_AC2_未回答3件と期限到来7枚_1秒以内に200で問題1件とカード古い順5件と総数7` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac2_today_session.py::test_AC2_現在時刻を3日進める_期限到来の総数が9になり表示は5件のまま` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac3_submit_challenge.py::test_AC3_3観点すべて達成_1秒以内に200でcompletedと50XPと連続日数が1増え保存される` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac3_submit_challenge.py::test_AC3_連続日数_2日以上空いた間はsummaryが0で回答すると1に戻る` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac3_submit_challenge.py::test_AC3_連続日数_当日初回なら1増え当日2回目なら増えない` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac3_submit_challenge.py::test_AC3_達成観点数0から3_XPは20から50でレベルの境界100をまたぐ` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac4_grade_review.py::test_AC4_rep1から4段階それぞれ_rep間隔EFと次回日時が契約の式どおり` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac4_grade_review.py::test_AC4_rep1でgrade3_1秒以内に200でrep2と間隔6日と10XPになり未消化が1件減る` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac4_grade_review.py::test_AC4_rep2以上と下限_四捨五入とease_factorの下限1点3` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac5_skills_summary.py::test_AC5_レベルの境界_99は1で100は2で199は2で200は3` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac5_skills_summary.py::test_AC5_学習実績あり_1秒以内に200で6領域のXPとレベルと残りXPと全体の値が返る` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac5_skills_summary.py::test_AC5_直近7日間の境界_ちょうど168時間前と現在時刻は含み168時間1秒前は含まない` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac5_skills_summary.py::test_AC5_直近7日間の達成数_思考問題クリア2件と復習grade3以上2件で4` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac6_empty_state.py::test_AC6_学習データ0件_セッションは空で6領域すべて0XPレベル1` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac6_empty_state.py::test_AC6_学習済みでも本日の未回答0件と期限到来0枚_セッションは空` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac6_empty_state.py::test_AC6_画面HTMLに空状態ガイドと登録フォームへの誘導ボタンの識別子がある` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac7_validation_error.py::test_AC7_gradeが0と5とマイナスと小数と文字列と真偽値とnullと欠落_1秒以内に400でカードは変わらない` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac7_validation_error.py::test_AC7_メモが9文字と2001文字と空と欠落と型違い_1秒以内に400で保存されない` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac7_validation_error.py::test_AC7_回答が9文字と2001文字と達成観点数がマイナス1と4_400で問題は未回答のまま` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac7_validation_error.py::test_AC7_空白だけと前後空白を除いて9文字以下のmemoとanswer_1秒以内に400で保存されない` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac8_fallback_and_offline.py::test_AC8_URL取得がタイムアウトと接続失敗_3秒以内に201でfallback_usedとメモから問題とカードができる` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac8_fallback_and_offline.py::test_AC8_接続先を到達不能にした画面HTMLにエラーバナーと再試行ボタンと入力欄の識別子がある` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac8_fallback_and_offline.py::test_AC8_通信切断後の再試行_同じIdempotency_Keyで2回送っても1件だけ作られる` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac9_ssrf_and_permissions.py::test_AC9_プライベートとリンクローカルとlocalhostと非HTTPスキーム_すべて400で保存されない` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac9_ssrf_and_permissions.py::test_AC9_ループバックの待ち受けを指すURL_400で待ち受けへの要求は0件` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |
| `test_ac9_ssrf_and_permissions.py::test_AC9_画面HTMLは通知やクリップボードなどのブラウザ権限APIを呼ばない` | 同上 | 5 | 0 | 該当なし（揺れ 0 件） |

## 5. 受け入れテストの変更
- この機能のテストを最初に入れたコミット：`7dd3cef1e580d45c84ba2e44817bb2e15f7ac19f`（`7dd3cef`）
- コマンド：`git diff 7dd3cef..HEAD -- backend/tests/acceptance`
- 実装開始後の変更確認：`git diff 776b7b4..HEAD -- backend/tests/acceptance` → **出力 0 行（変更 0 件）**。すべての変更はバックエンド実装コミット（`215bc30`）より前に、契約追補コミット `d8e4568` に合わせて期待値を厳格化・境界値テストを追加した `776b7b4`（この時点で製品実装コードは 0 件）のみで行われており、実装に合わせてテストを弱めた箇所は 0 件である。

| ファイル:行 | 何を変えたか | PRD の根拠（AC 番号と PRD の文） |
|---|---|---|
| `backend/tests/acceptance/acceptance_support.py:6-16, 43, 81-84, 116-126` | 既定ポート `8000` 固定と事前ポート開放検査（`_port_is_open`）を廃し、動的に確保した空きローカルポートを `DEVFORGE_HOST=127.0.0.1`・`DEVFORGE_PORT=<空きポート>` として `python3 -m backend.app` に渡して独立起動する方式に変更（およびコメントの契約行番号更新） | **AC-1〜AC-9 共通**：PRD 11章 AC-1 L120「Given：バックエンドとDBが稼働しており」・12章 L177「学習データはローカルDBに保存」および契約つなぎ口 `contracts/openapi.yaml` L24-L28。ポート 8000 が使用中の環境でも本物のバックエンドプロセスを確実に独立起動して全 AC を検証するため |
| `backend/tests/acceptance/acceptance_support.py:348-350` | `assertTestIdInHtml` で単一引用符 `data-testid='…'` も許容していた仮実装を廃し、契約追補 D-1（`contracts/openapi.yaml` L73）に従い二重引用符 `data-testid="…"` の厳密一致へ厳格化 | **AC-6・AC-8・AC-9**：PRD 11章 AC-6 L152「空状態メッセージ…と学習登録フォームへの誘導ボタンが表示される」、AC-8 L164「エラーバナー…と『再試行』ボタンを表示する」、AC-9 L170「画面上のテキスト入力とバッジ表示のみで…完了する」、12章 L178「操作ボタン・入力欄に `aria-label`（iOSでは `accessibilityLabel` / `accessibilityIdentifier`）」 |
| `backend/tests/acceptance/test_ac3_submit_challenge.py:3-5, 24-25, 91-125` | `test_AC3_連続日数_当日初回なら1増え当日2回目なら増えない` に回答前の `skills/summary` の `streak_days` 確認を追加し、さらに最終学習日が2日以上前の連続切れ境界テスト `test_AC3_連続日数_2日以上空いた間はsummaryが0で回答すると1に戻る` を新規追加 | **AC-3・AC-5**：PRD 9章4行目 L99「連続学習日数（`streak_days`）の更新を行う」、9章5行目 L100「連続学習日数…を一覧表示する」、11章 AC-3 L134「更新後の `streak_days`（当日初回完了時は `+1`）」、AC-5 L146「全体の…`streak_days`…が表示される」（契約 `contracts/openapi.yaml` L481-L485, L823-L824 で定めた連続切れ時の `0` 表示と完了時 `1` リセット） |
| `backend/tests/acceptance/test_ac5_skills_summary.py:3-5, 12, 20, 48, 55-80, 83, 101-118` | `overall_level` の検証を「整数かつ 1 以上」から具体的な計算値（`285 XP → 3`、および境界値 `99→1, 100→2, 599→6, 600→7`）へ厳格化し、さらに直近7日間（`now - 168時間 <= t <= now`）の両端境界テスト `test_AC5_直近7日間の境界_ちょうど168時間前と現在時刻は含み168時間1秒前は含まない` を新規追加 | **AC-5**：PRD 9章5行目 L100「現在レベル（`floor(total_xp / 100) + 1`）」、11章 AC-5 L146「`level`（`floor(total_xp / 100) + 1`）…さらに全体の `total_xp`, `overall_level`, `streak_days`, `weekly_ mastered_count` が表示される」、13章 L187「直近7日間で思考問題クリアまたは復習 `grade >= 3` を達成した件数」（契約 `contracts/openapi.yaml` L821-L828） |
| `backend/tests/acceptance/test_ac7_validation_error.py:4-6, 101-150` | 半角空白・全角空白（`\u3000`）・タブ改行のみの文字列、および前後空白を除くと9文字以下になる `memo` と `answer` が1秒以内に HTTP 400（`VALIDATION_ERROR`）となり DB に保存されないことを確かめる `test_AC7_空白だけと前後空白を除いて9文字以下のmemoとanswer_1秒以内に400で保存されない` を新規追加 | **AC-7・AC-1・AC-3**：PRD 11章 AC-1 L120「メモ本文…（10文字以上2,000文字以下）」、AC-3 L133「回答テキスト（10文字以上2,000文字以下）」、AC-7 L157-L158「`memo` が9文字以下または2,001文字以上で `POST /api/v1/learnings` を呼ぶ…1秒（1,000ms）以内に HTTP 400 が返り、レスポンスJSONに `error.code`（`"VALIDATION_ERROR"`）と具体的なフィールド名を含む `error.message`…が含まれ、DBにはレコードが保存されず」（契約 `contracts/openapi.yaml` L186-L190, L479） |

## 6. 検査の件数
craft-verifier の4章の grep。上の5行は0件であること。最後の行は0件でなければ1件ずつ理由を書く。

| 検査 | コマンド | 件数 | 理由 |
|---|---|---|---|
| sleep で待つ | `grep -rnE 'sleep\(|usleep|Thread\.sleep|time\.sleep|asyncio\.sleep' backend/tests/acceptance` | 0件 | なし（起動待ちは `proc.wait(timeout=0.05)` と HTTP 疎通確認のみで `sleep` 不使用） |
| 飛ばす、失敗を許す | `grep -rnE 'XCTSkip|XCTExpectFailure|pytest\.mark\.skip|skipif|xfail|pytest\.skip|unittest\.skip|skipTest' backend/tests/acceptance` | 0件 | なし |
| 再試行 | `grep -rniE 'retry|rerun' backend/tests/acceptance` および 1章実行コマンド行の確認 | 0件（識別子文字列の生一致 1件） | テストの再試行機構・再試行オプションは 0 件（1章の実行コマンド行も 0 件）。`grep -rniE 'retry|rerun'` でヒットする唯一の行 `backend/tests/acceptance/test_ac8_fallback_and_offline.py:79`（`"retry-submit-btn"`）は、PRD AC-8 の通信切断時「再試行」ボタンに対応する契約指定の必須 DOM 識別子 `data-testid="retry-submit-btn"`（`contracts/openapi.yaml` L83）が初期 HTML に含まれるかを確認するリテラル文字列であり、テストを再試行するコードではない |
| 中を覗く import | `grep -rnE '@testable import|^[[:space:]]*(from|import)[[:space:]]+backend(\.|[[:space:]]|$)' backend/tests/acceptance` | 0件 | なし（`backend.*` の import は 0 件。別プロセス `python3 -m backend.app` へ `urllib.request` で実 HTTP 通信のみ実施） |
| AC 番号の抜け（PRD にあってテストにない、その逆） | `comm -3 <(grep -oE 'AC-[0-9]+' docs/prd/001-personal-learning-loop.md \| sort -u) <(grep -rhoE 'def test_AC[0-9]+_' backend/tests/acceptance \| sed -E 's/def test_AC([0-9]+)_/AC-\1/' \| sort -u)` および `grep -rnE 'def test_' backend/tests/acceptance \| grep -vE 'def test_AC[0-9]+_'` | 0件 | なし（PRD の AC-1〜AC-9 全 9 件とテストの `AC1_`〜`AC9_` 全 9 種が過不足なく一致し、AC 番号を持たないテスト関数も 0 件） |
| 表示の文字や並び順で探す | `grep -rnE '(buttons\|staticTexts\|textFields\|cells\|switches)\["\|element\(boundBy:' backend/tests/acceptance`（および `grep -rnE 'AC2_SESSION_LABEL\|AC6_EMPTY_MESSAGE' backend/tests/acceptance`） | 0件（JSON API 文言フィールド検証 2件） | 画面要素を表示文字や並び順で探すコードは 0 件であり、`GET /` の HTML 検証はすべて `assertTestIdInHtml` による `data-testid="…"` のみで探している。なお API レスポンス JSON の文言定数照合が 2 件あるが、(1) `test_ac2_today_session.py:72`（`AC2_SESSION_LABEL`）は PRD AC-2 L128 および `contracts/openapi.yaml` L424 が定める JSON プロパティ `session_label_ja` の値検証、(2) `test_ac6_empty_state.py:32`（`AC6_EMPTY_MESSAGE`）は PRD AC-6 L152 および `contracts/openapi.yaml` L435 が定める空状態メッセージ文字列の JSON プロパティ `session_label_ja` 検証であり、UI 要素探索ではない |

## 7. アクセシビリティ監査
design/ の全画面の performAccessibilityAudit() の結果。通っても、VoiceOver での確認は G4 の人に回す。

`.claude/org/app.json` が `stacks: ["backend"]`（`ios` なし）であるため、`.claude/skills/feature/SKILL.md` L21 により iOS シミュレーター上の `performAccessibilityAudit()` は対象外である。代わりに、PRD 12章および技術設計メモ 6章「アクセシビリティ・多言語」に従い、稼働中のローカルサーバーが返す単一ページ Web UI（`GET /`、`GET /?lang=ja`、`GET /?lang=en`、`GET /?api_base_url=http://127.0.0.1:59999`）に対してブラックボックス HTTP 取得による DOM・CSS・コントラスト・多言語の検査を実施した（証拠：`docs/verification/001-personal-learning-loop/evidence/ui-a11y-check.log`）。実ブラウザでの 200% 文字拡大目視および VoiceOver（スクリーンリーダー）・キーボード操作確認は `test-plan.md` 3章・7章どおり G4 の Takuma 確認へ申し送る。

| 画面 | テストの名前 | 結果 | 見つかった問題 |
|---|---|---|---|
| iOS 画面全般（対象外） | `performAccessibilityAudit()`（`stacks: ["backend"]` のため対象外） | 対象外 | なし（`.claude/org/app.json` に `ios` スタックがないため `.claude/skills/feature/SKILL.md` L21 により対象外） |
| 単一ページ Web UI `GET /`（日本語既定・`GET /?lang=ja`） | ブラックボックス HTTP DOM/CSS 検査（`evidence/ui-a11y-check.log` L1-L24, L43-L188, L570-L583）＋ `test_AC6_画面HTMLに...` / `test_AC9_画面HTMLは...` | PASS（実機 VoiceOver・200% 拡大目視は G4 申し送り） | 実描画要素の問題 0 件。`<html lang="ja">`、必須 10 個を含む全 24 個の `data-testid`、全 16 個の操作要素（`button` / `input` / `textarea` / `select`）すべてに日本語 `aria-label` 設定済み（ラベル欠落 0 件）、エラーバナー 2 種に `role="alert"`、`.btn` / `.input` / `.select` / `.textarea` / `.rubric-check` に `min-height: 44px`（`.btn` は `min-width: 44px` も指定）、`:focus-visible` アウトライン `3px`、`overflow-wrap: anywhere`、Light/Dark 全 11 配色ペアで WCAG AA 4.5:1 以上（Light 最小 `6.70:1`、Dark 最小 `7.41:1`）を確認。なお未使用 CSS `.btn-danger` について 11 章 #1 に「提案」1件を記録 |
| 単一ページ Web UI `GET /?lang=en`（英語表示） | ブラックボックス HTTP DOM/i18n 検査（`evidence/ui-a11y-check.log` L5, L25-L42, L188, L592） | PASS（実ブラウザ目視・VoiceOver は G4 申し送り） | 0 件。`<html lang="en">`、必須 10 個を含む全 24 個の `data-testid`、全 16 個の操作要素すべてに英語 `aria-label` 設定済み（ラベル欠落 0 件）、日英文言辞書 70 キーが `ja` / `en` 完全一致（欠落キー 0 件・`null` 0 件）、`GET /api/v1/skills/summary` の 6 領域すべてに `label_ja` / `label_en` 出力を確認 |
| 単一ページ Web UI `GET /?api_base_url=...`（オフラインつなぎ口・XSS 検査） | `test_AC8_接続先を到達不能にした画面HTMLに...` ＋ ブラックボックス HTTP XSS 検査（`evidence/ui-a11y-check.log` L6, L184） | PASS（実ブラウザ切断・再試行目視は G4 申し送り） | 0 件。必須 10 個の `data-testid` 出力、および `?api_base_url`・`?lang` に `"><script>alert(1)</script>` を注入した際に HTML エスケープされ生 `<script>` が一切出力されないことを確認 |

## 8. 探索セッション
test-plan の6章のチャーターごとに書く（すべての実行出力は `docs/verification/001-personal-learning-loop/evidence/exploratory.log` に保存）。

### セッション 1（リスク R1 / チャーター C1）
- チャーター：登録・回答・評価を混ぜて続けた XP の合計を、`skills/summary` と各応答の `total_xp` を突き合わせながら探り、加算漏れ・二重加算・領域の取り違え・レベルの境界のずれを見つける
- 区切り（予定と実際。時間か操作の数）：予定 30分 ／ 実際 25 HTTP 操作（約8分、`evidence/exploratory.log` L1-L2）
- 試したこと：
  - 6領域すべてに学習を1件ずつ登録（各 `+15 XP`）し、同日に達成観点数 `0〜3` を変えて全6問の思考問題に回答（`+20〜+50 XP`）、各応答の `total_xp` と `streak_days`（当日複数回完了でも `1` のまま）を確認。
  - 完了済みの思考問題に対し、①同じ `Idempotency-Key` と同じ本文で再送（HTTP 200＋`Idempotent-Replayed: true`、XP 二重加算なし）、②同じキーで別本文を送信（HTTP 422 `IDEMPOTENCY_KEY_MISMATCH`）、③キーなしで再送（HTTP 409 `CHALLENGE_ALREADY_COMPLETED`）を検証。
  - 翌日（`X-Test-Now` を `+1日`）に6枚のカードを `grade=3` で評価（各 `+10 XP`、`streak_days=2`、`weekly_mastered_count=12`）し、さらにその翌日（`+2日`）に期限到来したカード1枚を `grade=1`（忘れた）で再評価して、`streak_days=3` になりつつ契約 L827 どおり `weekly_mastered_count` が `12 → 11` に減ることを確認。
  - `last_study_date` より1日前の `X-Test-Now` で `skills/summary` を呼び、契約 D-6 どおり `streak_days` が `3` のまま維持されることを確認。
- 見つけた不具合（11章の番号）：なし
- 疑問：なし（連続日数・週間達成数のカード再評価時の減算・409/422 すべて契約どおり）
- 次に試すこと：G4 で実ブラウザ上から連続して登録→回答→カード評価を行った際の画面上の XP バッジ・プログレスバー即時反映を目視確認する
- 使い捨てのテスト：消した（リポジトリ外の標準入力スクリプトで実行し `evidence/exploratory.log` に記録）

### セッション 2（リスク R2 / チャーター C2）
- チャーター：1枚のカードを grade をばらばらに10回評価し、`X-Test-Now` を `next_review_at` に合わせて進めながら探り、間隔が 0 以下・EF が 1.3 未満・期限から消えるカードを見つける
- 区切り（予定と実際。時間か操作の数）：予定 40操作 ／ 実際 53 HTTP 操作（`evidence/exploratory.log` L4-L5）
- 試したこと：
  - 登録直後の1枚のカード（`rep=0, ivl=1, ef=2.5`）に対し、評価系列 `[3, 4, 2, 1, 1, 1, 1, 1, 1, 2, 3, 4]` の計 12 回連続で `X-Test-Now` を進めながら評価を実行。
  - 各ステップで `next_review_at` の **1秒前** に `sessions/today` を呼んで期限到来に含まれないこと（`total_due_count == 0`）と、その時点で `grade` を送ると HTTP 409（`REVIEW_CARD_NOT_DUE`）になることを確認し、続けて `next_review_at` **ちょうど**で期限到来に現れ HTTP 200 で更新されることを確認。
  - `grade=1` を6回連続で与えても `ease_factor` が `2.25 → 2.05 → 1.85 → 1.65 → 1.45 → 1.3` で下限 `1.3` にクランプされ、`interval_days` が常に `1` 以上を保ち、その後の `grade=2, 3, 4` で `(rep=1, ivl=1, ef=1.3) → (rep=2, ivl=6, ef=1.3) → (rep=3, ivl=10, ef=1.4)` と正確に回復することを確認。
  - `test-plan.md` 9章の観察項目である存在しない `card_id` / `challenge_id` の HTTP 404（`RESOURCE_NOT_FOUND`）、および検査順序（対象不在 404 が本文不正 400 より先、本文不正 400 が期限前 409 より先）を確認。
- 見つけた不具合（11章の番号）：なし
- 疑問：なし
- 次に試すこと：なし（SM-2 の全状態遷移とエラー優先順位が契約と完全一致）
- 使い捨てのテスト：消した（リポジトリ外の標準入力スクリプトで実行し `evidence/exploratory.log` に記録）

### セッション 3（リスク R3 / チャーター C3）
- チャーター：期限到来のカードを 0・1・5・6・50 枚、未回答の問題を 0・1・2 件にした組み合わせで `sessions/today` を探り、6問を超える、並びが古い順でない、`estimated_seconds` が 180 を超える場合を見つける
- 区切り（予定と実際。時間か操作の数）：予定 30分 ／ 実際 31 HTTP 操作（約6分、`evidence/exploratory.log` L7-L8）
- 試したこと：
  - `due_cards ∈ {0, 1, 5, 6, 50}` × `pending_challenges ∈ {0, 1, 2}` の全 15 通りの組み合わせを逆順シード投入で作成し、すべてのケースで応答時間 `< 1,000ms`、`len(due_reviews) == min(due_cards, 5)`、`total_due_count == due_cards`、`total_session_items <= 6`、`0 <= estimated_seconds <= 180`、`active_challenge` が最古の未回答1件になることを確認。
  - 同一 `next_review_at` を持つカード複数枚（`crd_001`, `crd_000` を逆順投入）で第2ソートキー `card_id ASC` により `crd_000 → crd_001` の順で安定ソートされることを確認。
  - `X-Test-Now: 2026-10-30T18:00:00+09:00`（JST オフセット表記）を送り、UTC `2026-10-30T09:00:00Z` と同じ期限判定になることを確認。
- 見つけた不具合（11章の番号）：なし
- 疑問：なし
- 次に試すこと：なし
- 使い捨てのテスト：消した（リポジトリ外の標準入力スクリプトで実行し `evidence/exploratory.log` に記録）

### セッション 4（リスク R4 / チャーター C4）
- チャーター：SSRF の回り道（`http://127.1/`、`http://0.0.0.0/`、`http://2130706433/`、`http://[::ffff:127.0.0.1]/`、`http://localhost./`、大文字小文字、ユーザー情報付き `http://a@127.0.0.1/`、公開ドメインからのリダイレクト）で探り、テストの待ち受けに要求が届く URL を見つける
- 区切り（予定と実際。時間か操作の数）：予定 30分 ／ 実際 40 HTTP 操作（20種のバイパス URL × `live` / `stub_ok` の2モード、`evidence/exploratory.log` L10-L12）
- 試したこと：
  - ローカルに罠 HTTP サーバー（`127.0.0.1:<空きポート>`）を起動した状態で、短縮 IPv4 `http://127.1:<port>/`、未指定アドレス `http://0.0.0.0:<port>/`、10進整数 IPv4 `http://2130706433:<port>/`、16進 IPv4 `http://0x7f000001:<port>/`・`http://0x7f.1:<port>/`、8進 IPv4 `http://0177.0.0.1:<port>/`、IPv4 射影 IPv6 `http://[::ffff:127.0.0.1]:<port>/`・`http://[0:0:0:0:0:ffff:7f00:1]:<port>/`、IPv6 未指定 `http://[::]:<port>/`、末尾ドット `http://localhost.:<port>/`、サブドメイン `http://sub.localhost:<port>/`、大文字小文字混在 `HTTP://LoCaLhOsT:<port>/`、認証情報付き `http://a@127.0.0.1:<port>/`・`http://user:pass@localhost:<port>/`、CGNAT `http://100.64.0.1/`、マルチキャスト `http://224.0.0.1/`、ブロードキャスト `http://255.255.255.255/`、`javascript:alert(1)`、`data:text/html,hello`、ホスト欠落 `http:///missing-host` の計 20 種をヘッダなし（`live`）と `X-Test-Url-Fetch-Mode: stub_ok` の両方で送信。
  - 40 リクエストすべてが HTTP 400（`INVALID_URL_SCHEME_OR_HOST`）で即座に拒否され、罠サーバーへの到達が **0 件**であることを確認（なお公開ドメインからの内部 IP リダイレクト遮断は外部 DNS に出ない受け入れテスト方針のため、契約 L159 と単体テスト責務の設計どおり）。
- 見つけた不具合（11章の番号）：なし
- 疑問：なし
- 次に試すこと：なし
- 使い捨てのテスト：消した（リポジトリ外の標準入力スクリプトで実行し `evidence/exploratory.log` に記録）

### セッション 5（リスク R5 / チャーター C5）
- チャーター：外部 URL の取得を、スタブのヘッダと予約ドメインの食い違う組み合わせ（`stub_ok`＋`timeout.example.test` など）、長い URL（2,048 文字の前後）、title なし、で探り、3,000ms を超える・500 になる・`url_fetch_status` が3つの値以外になる場合を見つける
- 区切り（予定と実際。時間か操作の数）：予定 30分 ／ 実際 14 HTTP 操作（約6分、`evidence/exploratory.log` L14-L16）
- 試したこと：
  - スタブヘッダと予約ドメインの食い違う6通り（`stub_ok`＋`timeout.example.test`、`stub_ok`＋`error.example.test`、`stub_timeout`＋`ok.example.test`、`stub_error`＋`ok.example.test`、`live`/ヘッダなし＋未知の `other-sub.example.test`）を `title` 未指定で送信し、すべて 3,000ms 以内に HTTP 201 となり契約 D-4 どおりヘッダ側が優先され `title` もメモから自動補完されることを確認。
  - `url` 長さ境界：2,048文字ちょうど（HTTP 201）、2,049文字（HTTP 400 `VALIDATION_ERROR`）。`title` 長さ境界：200文字（HTTP 201）、201文字（HTTP 400 `VALIDATION_ERROR`）。結合絵文字 `👨‍👩‍👧`×2（ちょうど 10 Unicode コードポイント）の `memo` が契約 L187 どおり HTTP 201 になることを確認。
  - JSON で `url: ""`（空文字列）を直接送ると HTTP 400（`INVALID_URL_SCHEME_OR_HOST`）となる一方、ブラウザ UI の JS（`evidence/exploratory.log` L45：`url: urlEl.value.trim() ? urlEl.value.trim() : null`）では空欄を `null` に正規化して送るため問題なく `not_provided`（201）になることを確認。
  - 設計メモ 4章（L189-L190）で依頼されていた未知の `SkillCategory` / `UrlFetchStatus` / `error.code` フォールバック表記（`その他` / `Other`、`problem.title` 参照）が UI に実装されていることを確認。
- 見つけた不具合（11章の番号）：なし
- 疑問：API に直接 `{"url": ""}` を送った場合は `null` と異なり HTTP 400（`INVALID_URL_SCHEME_OR_HOST`）になるが、契約 L148「ホストがない…なら 400」およびスキーマ `url: string | null` に忠実であり、UI 側も `null` に変換しているため整合している。
- 次に試すこと：なし
- 使い捨てのテスト：消した（リポジトリ外の標準入力スクリプトで実行し `evidence/exploratory.log` に記録）

### セッション 6（リスク R6 / チャーター C6）
- チャーター：ブラウザで登録の途中に接続先を到達不能にし（`?api_base_url=`、サーバーの停止）、再試行・二度押し・再読み込みを混ぜて探り、入力が消える、二重に登録される場合を見つける
- 区切り（予定と実際。時間か操作の数）：予定 40操作 ／ 実際 15 HTTP 操作＋クライアント JS 配信内容確認（`evidence/exploratory.log` L18-L20, L29-L59）
- 試したこと：
  - 5スレッドから同時に同一 `Idempotency-Key` で `POST /api/v1/learnings` を並列送信し、全5件が同一 `learning_id` の HTTP 201 を返し、うち4件に `Idempotent-Replayed: true` が付き、`total_xp` が 1回分（`15 XP`）のみ加算されることを確認。
  - 不正な入力（`memo` 文字数不足で HTTP 400）に付けた `Idempotency-Key` がキャッシュされず、入力修正後に同じキーで再送すると HTTP 201 で新規登録できること（契約 L180）を確認。
  - 同じ `Idempotency-Key` を別エンドポイント（`submitChallenge`）に使い回すと HTTP 422（`IDEMPOTENCY_KEY_MISMATCH`）になること、キー長境界（空文字 `""` と 129文字は HTTP 400 `VALIDATION_ERROR`、1文字と 128文字は HTTP 201）を確認。
  - `GET /?api_base_url=http://127.0.0.1:59999` の配信 HTML/JS を確認し、`data-api-base-url` 属性への注入、`window.localStorage`（キー `devforge_draft_learning_v1`）への入力下書き保存とリロード時復元、通信失敗時に入力欄を消去せず `offline-error-banner` を表示し `retry-submit-btn` で同じ `pendingLearningIdemKey` を使って再送する処理を確認。
- 見つけた不具合（11章の番号）：なし
- 疑問：なし
- 次に試すこと：G4 で Takuma が実ブラウザ上で `?api_base_url=http://127.0.0.1:59999` の送信失敗→リロード→接続復帰再送を目視確認する
- 使い捨てのテスト：消した（リポジトリ外の標準入力スクリプトで実行し `evidence/exploratory.log` に記録）

### セッション 7（リスク R7 / チャーター C7）
- チャーター：サーバーを登録の直後・評価の直後に止めて起動し直す、DB ファイルを読み取り専用にする、`DEVFORGE_DB_PATH` を存在しないフォルダにする、で探り、データが消える・起動で落ちて理由が出ない場合を見つける
- 区切り（予定と実際。時間か操作の数）：予定 30分 ／ 実際 10 HTTP 操作＋3 CLI 異常系起動確認（約8分、`evidence/exploratory.log` L22-L27）
- 試したこと：
  - 学習登録の直後にサーバーを `SIGTERM` で停止→再起動し、停止前の `Idempotency-Key` で再送しても `Idempotent-Replayed: true` で同じレコードが返ること、続けて思考問題回答とカード評価を行った直後に再度停止→再起動しても `total_xp: 75`・`streak_days: 2`・`weekly_mastered_count: 2` が1件も欠損せず残ることを確認。
  - 稼働中に SQLite DB ファイルと親ディレクトリを読み取り専用（`0444` / `0555`）に変更して `POST /api/v1/learnings` を実行し、プロセスが落ちずに HTTP 500 `application/problem+json`（`error.code: "INTERNAL_ERROR"`）を返し、権限を `0644` / `0755` に戻すと再起動なしでそのまま HTTP 201 の書き込みに復帰することを確認。
  - 不正な環境変数での起動拒否を確認：①存在しない親フォルダの `DEVFORGE_DB_PATH` → 終了コード `2`・標準エラーに `DEVFORGE_DB_PATH` 出力、②非ループバック `DEVFORGE_HOST=0.0.0.0` → 終了コード `2`・標準エラーに `DEVFORGE_HOST` 出力、③範囲外ポート `DEVFORGE_PORT=70000` → 終了コード `2`・標準エラーに `DEVFORGE_PORT` 出力。
  - `APP_ENV=production` で起動し、`/api/v1/test/reset` と `/api/v1/test/seed` がともに HTTP 403（`TEST_SEAM_DISABLED`）になり、`X-Test-Now: 1999-01-01T00:00:00Z` が無視されて実サーバー時刻が使われることを確認。
- 見つけた不具合（11章の番号）：なし
- 疑問：なし
- 次に試すこと：次の機能（`002`）以降で、本機能の DB ファイルを新しい版で開くマイグレーション回帰テストを追加する
- 使い捨てのテスト：消した（リポジトリ外の標準入力スクリプトで実行し `evidence/exploratory.log` に記録）

## 9. スクリーンショットとログ
置き場所：docs/verification/001-personal-learning-loop/evidence/。ここに書いたファイルは、すべて `ls` で見つかること。
`.claude/org/app.json` が `stacks: ["backend"]`（`ios` なし）であり、かつ外部パッケージ依存 0 件（Playwright 等のヘッドレスブラウザなし）の決まりであるため、`.claude/skills/feature/SKILL.md` L21 および `test-plan.md` 7章に従い iOS シミュレーターの画面スクリーンショットは対象外とし、ブラウザ画面の目視確認は G4 の Takuma 確認へ申し送る。G3 で取得したすべての実行ログは以下の 5 ファイルであり、すべて `ls docs/verification/001-personal-learning-loop/evidence/` で実在を確認済みである。

| ファイル | 画面と状態 | 見た目（ライト / ダーク / AX5 / 英語） | 対応する AC |
|---|---|---|---|
| `docs/verification/001-personal-learning-loop/evidence/red.log` | 実装前の赤の証拠ログ（`backend.app` 未実装により全31件 Error） | 該当なし（CLI / HTTP テストログ） | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9 |
| `docs/verification/001-personal-learning-loop/evidence/green.log` | G3 再試行なしの受け入れテスト全31件実行ログ（`Ran 31 tests in 2.060s` / `OK`） | 該当なし（API・初期 HTML ログ） | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9 |
| `docs/verification/001-personal-learning-loop/evidence/repeat-5x.log` | G3 影響「大」を含む全31件の5回連続反復＋逆順実行ログ（延べ186件すべて `OK`・失敗0件） | 該当なし（API・初期 HTML ログ） | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9 |
| `docs/verification/001-personal-learning-loop/evidence/ui-a11y-check.log` | 単一ページ Web UI（`GET /`、`/?lang=ja`、`/?lang=en`、`/?api_base_url=...`）のブラックボックス HTTP 検査ログ（起動 104.9ms、必須10 `data-testid`、全16要素 `aria-label`、`44px` 指定、XSS エスケープ） | ライト / ダーク配色コントラスト比計算（WCAG AA 適合）・日本語 / 英語全 70 キー検証を含む | AC-1, AC-5, AC-6, AC-8, AC-9 |
| `docs/verification/001-personal-learning-loop/evidence/exploratory.log` | 影響「大」のリスク R1〜R7 全7チャーター（C1〜C7）の探索テスト実行ログ（XP/連続日数、SM-2 12連続評価、50枚上限、SSRF 20種、スタブ優先順位、5並列冪等キー、再起動永続化・読み取り専用DB 500復帰・本番403） | 該当なし（API・UI 配信 JS・CLI 検証ログ） | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9 |

## 10. 前の機能の受け入れテスト（回帰）
| 機能 | コマンド | 終了コード | 成功 / 失敗 / 飛ばした |
|---|---|---|---|
| 該当なし（`001-personal-learning-loop` が最初の機能 `001` であり、前の機能が存在しない） | 該当なし | 該当なし | 該当なし |

## 11. 見つかった問題
AC にひも付かない指摘は「提案」にとどめる。AC の範囲の不具合には、再現するテストを先に足す。
AC にひも付く「重大」「要修正」の不具合は **0 件**であった。AC の外で気づいた将来の保守向け「提案」1件を記録する。

| # | 内容 | 再現の手順 | 再現するテストの名前 | AC | 重大度（重大 / 要修正 / 提案） | 直す役 |
|---|---|---|---|---|---|---|
| 1 | `GET /` が返す `<style>` 内の未使用 CSS クラス `.btn-danger`（配信 HTML L164：`background-color: var(--danger-text); color: #FFFFFF;`）は、ダークモード時に `--danger-text` が `#FEF2F2` へ変わるため、将来いずれかのボタン要素に `.btn-danger` を付与するとダークモード時のコントラスト比が `1.07:1` に低下する（現在の HTML/JS では `.btn-danger` を使用している要素は 0 件であり、実描画される全要素は Light `6.70:1` 以上・Dark `7.41:1` 以上を満たしている） | `GET /` のレスポンス HTML の `<style>` ブロック内 `.btn-danger` と `@media (prefers-color-scheme: dark)` の `--danger-text` を確認する（`evidence/ui-a11y-check.log` L86, L134-L135, L586-L587） | なし（未使用 CSS クラスで AC 範囲外のため再現テスト追加不要） | 該当なし（AC 外） | 提案 | backend-engineer |

## 12. PRD とテストの食い違い
テストも実装も直さずに止めたもの。指揮役が pdm か Takuma に回す。

| AC | PRD の文 | テストか実装のふるまい | 決めてほしいこと |
|---|---|---|---|
| 該当なし | なし（PRD 11章 AC-5 L146 のタイポ `` `weekly_ mastered_count` `` は G1 契約 `contracts/openapi.yaml` L819 で `weekly_mastered_count` に正規化済みであり、テスト・実装ともに一致） | 食い違いなし | なし |

## 13. 未検証のものと理由
なし
