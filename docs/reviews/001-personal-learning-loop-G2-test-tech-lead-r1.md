PASS

## 指摘
- 提案、backend/tests/acceptance/acceptance_support.py:342（呼び出し元：backend/tests/acceptance/test_ac9_ssrf_and_permissions.py:69,90）、`assertProblem` が `self.assertIn(field_name, message)`（大文字・小文字を区別）で `error.message` 内に英小文字 `"url"` を必須としている。`contracts/openapi.yaml:339` の `ssrfBlocked` 例には `"url には公開 http/https URL のみ指定できます..."` とあるため契約の例とは整合しているが、PRD AC-9 および契約本文は `error.code: "INVALID_URL_SCHEME_OR_HOST"` のみを必須としており、技術設計メモ 4章の文言表（`docs/adr/features/001-personal-learning-loop.md:196`）では大文字 `"URL"` のみ（`"指定されたURLは許可されていません..."`）となっている、根拠：docs/prd/001-personal-learning-loop.md:170、contracts/openapi.yaml:147-160,339,1707-1730、docs/adr/features/001-personal-learning-loop.md:196、直す方向：必要に応じて `field_name.lower() in message.lower() or error.get("field") == field_name` とするか AC-9 では `field_name=None` を許容すると、設計メモの日本語文言をそのまま返した実装でも偽陽性なく検証できる。
- 提案、backend/tests/acceptance/test_ac8_fallback_and_offline.py:63-74、`test_AC8_通信切断後の再試行_同じIdempotency_Keyで2回送っても1件だけ作られる` は同一 `learning_id` の返却と XP・カードの二重作成防止（AC-8 の結果）を適切に確かめているが、契約追補で定義された再生応答ヘッダ `Idempotent-Replayed: true`（1回目には付かず2回目の再生時のみ付与）までは確認していない、根拠：contracts/openapi.yaml:178,218-220,1090-1097、直す方向：必要に応じて 1回目の応答に `Idempotent-Replayed` がないことと 2回目に `"true"` が付くことのアサーションを足すと、契約の冪等再生ヘッダ仕様も機械的に検証できる。

## 証拠
- 対象：`f8bb41604edcc6ad1ea6c6aca31642cc73697cdf...776b7b44e083955e757d02da689f1b46760f87c5`（観点：機能 `001-personal-learning-loop` の実装前受け入れテスト G2 判定。間の `d8e4568` は tech-lead による契約追補であり、verifier のコミット `7dd3cef` と `776b7b4` を中心に最新 `HEAD` `776b7b4` の全差分ファイルを読了）
  - [x] `CLAUDE.md`
  - [x] `backend/tests/acceptance/acceptance_support.py`
  - [x] `backend/tests/acceptance/test_ac1_create_learning.py`
  - [x] `backend/tests/acceptance/test_ac2_today_session.py`
  - [x] `backend/tests/acceptance/test_ac3_submit_challenge.py`
  - [x] `backend/tests/acceptance/test_ac4_grade_review.py`
  - [x] `backend/tests/acceptance/test_ac5_skills_summary.py`
  - [x] `backend/tests/acceptance/test_ac6_empty_state.py`
  - [x] `backend/tests/acceptance/test_ac7_validation_error.py`
  - [x] `backend/tests/acceptance/test_ac8_fallback_and_offline.py`
  - [x] `backend/tests/acceptance/test_ac9_ssrf_and_permissions.py`
  - [x] `contracts/openapi.yaml`
  - [x] `docs/adr/features/001-personal-learning-loop.md`
  - [x] `docs/verification/001-personal-learning-loop/evidence/red.log`
  - [x] `docs/verification/001-personal-learning-loop/test-plan.md`

- 観点の表：

### 1. AC-1〜AC-9 ごとの契約・つなぎ口整合性と結果検証の表（全31件）
| AC | テストファイル・テスト名（計31件） | 使う `operationId`（メソッド・パス）とスキーマ | 使うつなぎ口（環境変数・ヘッダ・シード・`data-testid`） | 確かめている AC の具体的な結果（要素の有無だけでないこと） | 判定 |
|---|---|---|---|---|---|
| AC-1 | `test_ac1_create_learning.py`（5件）：<br>1. `test_AC1_URLなし領域自動_3秒以内に201で15XPと3観点の問題1問と初回カードが返り保存される`<br>2. `test_AC1_登録の後にサーバーを再起動しても_XPと問題とカードが残る`<br>3. `test_AC1_公開URLあり取得成功_201でurl_fetch_statusがfetched`<br>4. `test_AC1_領域を指定_6領域それぞれ指定どおりに15XPが入る`<br>5. `test_AC1_メモ境界値10文字と2000文字_どちらも201` | `createLearning`（`POST /api/v1/learnings`：`CreateLearningRequest` → 201 `CreateLearningResponse`）、結果確認に `getSkillsSummary`・`getTodaySession`、初期化に `resetTestState` | `DEVFORGE_HOST`, `DEVFORGE_PORT`, `DEVFORGE_DB_PATH`、プロセス再起動（`restart_server`）、`X-Test-Now`、`X-Test-Url-Fetch-Mode: stub_ok`、予約ドメイン `ok.example.test` | 3,000ms 以内に HTTP 201、`learning_id`、6領域 `category`、`earned_xp: 15`、`url_fetch_status`（`not_provided` / `fetched`）、`rubric_items` 3件の `(index, perspective)`、初回カード（`interval_days: 1, ease_factor: 2.5, repetition_count: 0, next_review_at: +1日`）に加え、後続 GET およびプロセス再起動後の SQLite 永続化・XP 加算・翌日期限到来まで検証。画面表示は `test-plan.md` 7章 `AC1_登録結果.png` に割り当て | PASS |
| AC-2 | `test_ac2_today_session.py`（2件）：<br>1. `test_AC2_未回答3件と期限到来7枚_1秒以内に200で問題1件とカード古い順5件と総数7`<br>2. `test_AC2_現在時刻を3日進める_期限到来の総数が9になり表示は5件のまま` | `seedTestState`（`POST /api/v1/test/seed`：`TestSeedRequest`）、`getTodaySession`（`GET /api/v1/sessions/today` → 200 `TodaySessionResponse`） | `POST /api/v1/test/reset`、`POST /api/v1/test/seed`、`X-Test-Now`（基準時刻ちょうど・+1秒境界・+3日進行） | 1,000ms 以内に HTTP 200、`active_challenge` が未回答最古の1件のみ（完了済み除外）、`due_reviews` が期限の古い順5件（投入順と無関係）、`total_due_count: 7`（3日後は `9`）、`total_session_items: 6`、`estimated_seconds <= 180`、`session_label_ja == "本日のセッション（全6問・目安3分）"`、`is_empty: false` を検証 | PASS |
| AC-3 | `test_ac3_submit_challenge.py`（4件）：<br>1. `test_AC3_3観点すべて達成_1秒以内に200でcompletedと50XPと連続日数が1増え保存される`<br>2. `test_AC3_達成観点数0から3_XPは20から50でレベルの境界100をまたぐ`<br>3. `test_AC3_連続日数_当日初回なら1増え当日2回目なら増えない`<br>4. `test_AC3_連続日数_2日以上空いた間はsummaryが0で回答すると1に戻る` | `seedTestState`、`submitChallenge`（`POST /api/v1/challenges/{challenge_id}/submit`：`SubmitChallengeRequest` → 200 `SubmitChallengeResponse`）、結果確認に `getTodaySession`・`getSkillsSummary` | `POST /api/v1/test/seed`（`category_xp`, `streak_days`, `last_study_date`, `challenges`）、`X-Test-Now` | 1,000ms 以内に HTTP 200、`status: "completed"`、`earned_xp`（20/30/40/50）、`total_xp` とレベル境界（99→Lv1, 100→Lv2, 200→Lv3）、`streak_days`（初回1・前日+1・当日不変・2日以上空きは summary 0 → 回答後 1）、`model_points` 非空3件、および後続 GET で `active_challenge: null` と XP・連続日数の保存まで検証 | PASS |
| AC-4 | `test_ac4_grade_review.py`（3件）：<br>1. `test_AC4_rep1でgrade3_1秒以内に200でrep2と間隔6日と10XPになり未消化が1件減る`<br>2. `test_AC4_rep1から4段階それぞれ_rep間隔EFと次回日時が契約の式どおり`<br>3. `test_AC4_rep2以上と下限_四捨五入とease_factorの下限1点3` | `seedTestState`、`gradeReviewCard`（`POST /api/v1/reviews/{card_id}/grade`：`GradeReviewRequest` → 200 `GradeReviewResponse`）、結果確認に `getTodaySession`・`getSkillsSummary` | `POST /api/v1/test/seed`（`review_cards`, `category_xp`）、`X-Test-Now`（評価時および +6日後） | 1,000ms 以内に HTTP 200、`grade` 1〜4 全列の `(repetition_count, interval_days, ease_factor)`、`round_half_up`（19.5→20）と EF 下限 1.3、`next_review_at`、`earned_xp: 10`、`remaining_due_count: 1`、後続セッションでの未消化1件減少と6日後の再到来・XP 集計反映まで検証 | PASS |
| AC-5 | `test_ac5_skills_summary.py`（4件）：<br>1. `test_AC5_学習実績あり_1秒以内に200で6領域のXPとレベルと残りXPと全体の値が返る`<br>2. `test_AC5_レベルの境界_99は1で100は2で199は2で200は3`<br>3. `test_AC5_直近7日間の達成数_思考問題クリア2件と復習grade3以上2件で4`<br>4. `test_AC5_直近7日間の境界_ちょうど168時間前と現在時刻は含み168時間1秒前は含まない` | `seedTestState`、`getSkillsSummary`（`GET /api/v1/skills/summary` → 200 `SkillsSummaryResponse`） | `POST /api/v1/test/seed`（`category_xp`, `streak_days`, `last_study_date`, `completed_at`, `last_grade`, `graded_at`）、`X-Test-Now` | 1,000ms 以内に HTTP 200、固定6領域すべての `label_ja`・`total_xp`・`level`・`xp_to_next_level`、境界値（0, 1, 99, 100, 199, 200）、全体 `total_xp`・`overall_level`（`floor(total_xp/100)+1`）、`streak_days`、`weekly_mastered_count`（`now - 168h <= t <= now` 両端含む境界と `last_grade >= 3` 条件）を検証 | PASS |
| AC-6 | `test_ac6_empty_state.py`（3件）：<br>1. `test_AC6_学習データ0件_セッションは空で6領域すべて0XPレベル1`<br>2. `test_AC6_学習済みでも本日の未回答0件と期限到来0枚_セッションは空`<br>3. `test_AC6_画面HTMLに空状態ガイドと登録フォームへの誘導ボタンの識別子がある` | `resetTestState`、`seedTestState`、`getTodaySession`、`getSkillsSummary`、`getWebAppUi`（`GET /` → 200 `text/html`） | `POST /api/v1/test/reset`、`POST /api/v1/test/seed`、`X-Test-Now`、`data-testid`（`app-root`, `empty-state-guide`, `empty-state-cta-btn`, `learning-form`） | 1,000ms 以内に HTTP 200、`active_challenge: null`、`due_reviews: []`、`total_due_count: 0`、`is_empty: true`、PRD と一字一句一致する `session_label_ja`、6領域 `(0, 1, 100)`、学習済み完了後の XP 維持、および初期 HTML の必須 `data-testid` を検証（実画面表示は `test-plan.md` 7章 `AC6_空状態.png` で確認） | PASS |
| AC-7 | `test_ac7_validation_error.py`（4件）：<br>1. `test_AC7_メモが9文字と2001文字と空と欠落と型違い_1秒以内に400で保存されない`<br>2. `test_AC7_gradeが0と5とマイナスと小数と文字列と真偽値とnullと欠落_1秒以内に400でカードは変わらない`<br>3. `test_AC7_回答が9文字と2001文字と達成観点数がマイナス1と4_400で問題は未回答のまま`<br>4. `test_AC7_空白だけと前後空白を除いて9文字以下のmemoとanswer_1秒以内に400で保存されない` | `createLearning`、`gradeReviewCard`、`submitChallenge`（各 400 `application/problem+json` / `ProblemDetails`）、副作用なしの確認に `getSkillsSummary`・`getTodaySession` | `POST /api/v1/test/reset`、`POST /api/v1/test/seed`、`X-Test-Now` | 1,000ms 以内に HTTP 400、`Content-Type: application/problem+json`、`error.code == "VALIDATION_ERROR"`、該当フィールド名を含む `error.message`（真偽値 `True` や全角空白・トリム後9文字以下を含む）に加え、DB に保存されず既存カード・未回答問題・XP が不変であることまで検証 | PASS |
| AC-8 | `test_ac8_fallback_and_offline.py`（3件）：<br>1. `test_AC8_URL取得がタイムアウトと接続失敗_3秒以内に201でfallback_usedとメモから問題とカードができる`<br>2. `test_AC8_通信切断後の再試行_同じIdempotency_Keyで2回送っても1件だけ作られる`<br>3. `test_AC8_接続先を到達不能にした画面HTMLにエラーバナーと再試行ボタンと入力欄の識別子がある` | `createLearning`（201 `CreateLearningResponse`）、`getWebAppUi`（`GET /?api_base_url=...` → 200 `text/html`）、永続化確認に `getSkillsSummary`・`getTodaySession` | `X-Test-Url-Fetch-Mode`（`stub_timeout`, `stub_error`）、予約ドメイン（`timeout.example.test`, `error.example.test`）、`Idempotency-Key`、`?api_base_url=http://127.0.0.1:59999`、`data-testid` 7個 | URL タイムアウト・失敗4通りすべてで 3,000ms 以内に HTTP 201（`url_fetch_status: "fallback_used"`）となり XP とカードが保存されること、同一 `Idempotency-Key` 再送で同一 `learning_id` かつ XP 15・カード1枚のみ作られること、到達不能 URL 指定時の HTML に必須7識別子があることを検証（実ブラウザ入力保持は `test-plan.md` 7章で確認） | PASS |
| AC-9 | `test_ac9_ssrf_and_permissions.py`（3件）：<br>1. `test_AC9_ループバックの待ち受けを指すURL_400で待ち受けへの要求は0件`<br>2. `test_AC9_プライベートとリンクローカルとlocalhostと非HTTPスキーム_すべて400で保存されない`<br>3. `test_AC9_画面HTMLは通知やクリップボードなどのブラウザ権限APIを呼ばない` | `createLearning`（400 `ProblemDetails`）、`getWebAppUi`（`GET /` → 200 `text/html`）、未保存確認に `getSkillsSummary`・`getTodaySession` | ローカル `_HitCounter` HTTP 待ち受け、`X-Test-Url-Fetch-Mode`（なし / `live` / `stub_ok`）、`data-testid="app-root"` | `stub_ok` 付きを含めループバック・プライベートIP・`169.254.169.254`・`localhost`・`[::1]`・`file://`・`ftp://` の全ケースで HTTP 400（`INVALID_URL_SCHEME_OR_HOST`）、ローカル待ち受けへの実到達リクエスト `0` 件、XP・問題・カード未保存、および画面 HTML がブラウザ権限 API 6種を呼ばないことを検証 | PASS |

### 2. 契約（`contracts/openapi.yaml`）のつなぎ口・環境変数・ヘッダ・識別子との照合表
| 区分 | テストが使う項目 | `contracts/openapi.yaml` / `CLAUDE.md` の根拠箇所 | 整合結果 |
|---|---|---|---|
| 起動コマンド | `sys.executable -m backend.app`（`cwd=REPO_ROOT`） | `contracts/openapi.yaml:25`、`CLAUDE.md:22-23` | 一致 |
| 環境変数 | `DEVFORGE_HOST=127.0.0.1`、`DEVFORGE_PORT=<空きポート>`、`DEVFORGE_DB_PATH=<一時フォルダ>/acceptance.sqlite3`、`APP_ENV` 除外 | `contracts/openapi.yaml:26-33`、`CLAUDE.md:24-29`（`DEVFORGE_ACCEPTANCE_BASE_URL` はテストハーネス側の任意上書き用で `test-plan.md:103` に明記） | 一致 |
| 全8 `operationId` | `getWebAppUi` (`GET /`), `createLearning` (`POST /api/v1/learnings`), `getTodaySession` (`GET /api/v1/sessions/today`), `submitChallenge` (`POST /api/v1/challenges/{challenge_id}/submit`), `gradeReviewCard` (`POST /api/v1/reviews/{card_id}/grade`), `getSkillsSummary` (`GET /api/v1/skills/summary`), `resetTestState` (`POST /api/v1/test/reset`), `seedTestState` (`POST /api/v1/test/seed`) | `contracts/openapi.yaml:54-1086`（全8エンドポイントのパス・メソッド・ステータスコード・JSON フィールド名すべて一致） | 一致 |
| テスト・冪等ヘッダ | `X-Test-Now`、`X-Test-Url-Fetch-Mode`（`live`, `stub_ok`, `stub_timeout`, `stub_error`）、`Idempotency-Key` | `contracts/openapi.yaml:1099-1142`、各 operation の `parameters` | 一致 |
| 予約テストドメイン | `ok.example.test`、`timeout.example.test`、`error.example.test` | `contracts/openapi.yaml:166-174` | 一致 |
| 画面 `data-testid` | `app-root`, `learning-form`, `title-input`, `url-input`, `memo-input`, `submit-learning-btn`, `offline-error-banner`, `retry-submit-btn`, `empty-state-guide`, `empty-state-cta-btn`（計10個） | `design/` は `.gitkeep` のみ（`stacks: ["backend"]`）のため、`contracts/openapi.yaml:68-86,117-119` および `docs/adr/features/001-personal-learning-loop.md:91,99`（D-1）と照合し10個すべて一致 | 一致 |

### 3. `test-plan.md`「確かめ」および G2 受け入れテスト基準の自力検証
| 確認項目 | 検証結果 | 根拠（実行コマンド・行番号） |
|---|---|---|
| PRD の全 AC（AC-1〜AC-9）にテストがあり、テスト名に AC 番号が入り、AC のないテストが0件 | 満たす | PRD AC 数 9件、テストメソッド 31件、`test-plan.md` 2章 31行が完全一致。全31件が `test_AC[1-9]_` で始まることを AST 解析で確認 |
| 要素の有無（`.exists` 等）だけで終わるテストがない | 満たす | `grep -rn '\.exists' backend/tests/acceptance` は `acceptance_support.py:88` の `os.path.exists(_STATE.log_path)` 1件のみ。HTML の `data-testid` を見る3テスト（AC-6, AC-8, AC-9）も、同じ AC 内で API の保存結果・空状態値・SSRF 遮断を検証し、実画面確認を `test-plan.md` 7章に明記 |
| `sleep`、`skip`、`xfail`、`XCTExpectFailure`、`retry`、`@testable import`、および `backend.*` の直接 import が0件 | 満たす | `grep` で検査し、`time.sleep`・スキップ・再試行・`backend` パッケージ import すべて 0件（ヒットはコメント説明1件と契約の `retry-submit-btn` 識別子1件のみ） |
| `red.log` と自力実行の失敗理由がビルド/構文/import 不備ではなく「まだ実装がない」こと | 満たす | 全10ファイルの AST 構文検査 OK。`red.log` および `HEAD`（`776b7b4`）での自力実行ともに `Ran 31 tests` → `FAILED (errors=31)`（`FAIL=0`）、全31件の原因が `No module named backend.app` |
| `.claude/` と `.github/` を変更していない | 満たす | `git diff --name-only f8bb4160...776b7b44 -- .claude .github` の出力が空（0件） |

- 読んだファイル：
  - `.claude/agents/tech-lead.md`
  - `.claude/skills/craft-tech-lead/SKILL.md`
  - `docs/org/gates.md`
  - `docs/templates/review-report.md`
  - `.claude/org/app.json`
  - `CLAUDE.md`
  - `contracts/dependencies.md`
  - `contracts/openapi.yaml`
  - `docs/prd/001-personal-learning-loop.md`
  - `docs/adr/001-python-stdlib-sqlite-architecture.md`
  - `docs/adr/features/001-personal-learning-loop.md`
  - `docs/reviews/001-personal-learning-loop-G0-tech-lead-r1.md`
  - `docs/reviews/001-personal-learning-loop-G1-reviewer-r1.md`
  - `docs/verification/001-personal-learning-loop/test-plan.md`
  - `docs/verification/001-personal-learning-loop/evidence/red.log`
  - `backend/tests/acceptance/acceptance_support.py`
  - `backend/tests/acceptance/test_ac1_create_learning.py`
  - `backend/tests/acceptance/test_ac2_today_session.py`
  - `backend/tests/acceptance/test_ac3_submit_challenge.py`
  - `backend/tests/acceptance/test_ac4_grade_review.py`
  - `backend/tests/acceptance/test_ac5_skills_summary.py`
  - `backend/tests/acceptance/test_ac6_empty_state.py`
  - `backend/tests/acceptance/test_ac7_validation_error.py`
  - `backend/tests/acceptance/test_ac8_fallback_and_offline.py`
  - `backend/tests/acceptance/test_ac9_ssrf_and_permissions.py`

- 実行したコマンドと結果：
  - `git log --oneline f8bb41604edcc6ad1ea6c6aca31642cc73697cdf..776b7b44e083955e757d02da689f1b46760f87c5` → `7dd3cef`（verifier 初回）、`d8e4568`（tech-lead 契約追補）、`776b7b4`（verifier 契約追補同期）の3コミットを確認
  - `git show --stat 7dd3cef` / `git show 776b7b4` → verifier の変更が `backend/tests/acceptance/` と `docs/verification/001-personal-learning-loop/` のみであることを確認
  - `git diff --name-only f8bb41604edcc6ad1ea6c6aca31642cc73697cdf...776b7b44e083955e757d02da689f1b46760f87c5 -- .claude .github` → 空出力（保護対象の変更0件）
  - `python3 -m unittest discover -s backend/tests/acceptance -t backend/tests/acceptance -p "test_*.py"` → 終了コード `1`、`Ran 31 tests in 0.047s`、`FAILED (errors=31)`、全31件が `No module named backend.app` で失敗（テスト側の ImportError / SyntaxError は0件）
  - `ruby -ryaml` + `python3 -B -c` による契約・テスト計画・AST 照合 → `OpenAPI version: 3.1.0`（全8 operation 正常パース）、`Total test methods: 31`、`Total test-plan rows: 31`、`Diff methods vs plan: set()`、`ACs covered: ['AC-1', ..., 'AC-9']`、`Tests without AC prefix: []`、`AST syntax check OK for all 10 files`
  - `grep -rn '\.exists' backend/tests/acceptance` → `acceptance_support.py:88`（ログファイル有無確認）の1件のみ
  - `grep -rnE 'sleep|skip|xfail|XCTExpectFailure|retry|@testable' backend/tests/acceptance` → `acceptance_support.py:22`（docstring の `sleep を使わない` 説明）と `test_ac8_fallback_and_offline.py:79`（`retry-submit-btn` 識別子）の2件のみ
  - `grep -rnE '^\s*(import|from)\s+backend\b' backend/tests/acceptance` → 0件
  - `git status` → `nothing to commit, working tree clean`（読み取り専用を維持）

- 開いた URL と確認した日付：なし

- 未検証：なし

## 記録（指揮役が保存するときに書き足す）
- 関門：G2（受け入れテスト）
- 判定した役：tech-lead
- 回：r1
- 対象：`backend/tests/acceptance/*`, `docs/verification/001-personal-learning-loop/*`（`f8bb41604edcc6ad1ea6c6aca31642cc73697cdf...776b7b44e083955e757d02da689f1b46760f87c5`）
- 日付：2026-11-11
