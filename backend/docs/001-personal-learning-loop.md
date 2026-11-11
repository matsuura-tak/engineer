# 実装ノート 001-personal-learning-loop：外部学習の取り込みと日次3分の実践思考・忘却曲線復習ループ

- 機能名：`001-personal-learning-loop`
- 書いた役：backend-engineer
- 日付：2026-11-12
- 参照した文書：`docs/prd/001-personal-learning-loop.md`、`contracts/openapi.yaml`、`contracts/dependencies.md`、`docs/adr/001-python-stdlib-sqlite-architecture.md`、`docs/adr/features/001-personal-learning-loop.md`、`docs/verification/001-personal-learning-loop/test-plan.md`

---

## 1. 契約との対応表

技術設計メモ（`docs/adr/features/001-personal-learning-loop.md` 4章）の operation 数（全8件）と1対1で一致している。

| # | operationId | メソッド・パス | 実装ファイル | 認可のルール | テスト名（`backend/tests/unit/` および `backend/tests/acceptance/`） |
|---|---|---|---|---|---|
| 1 | `getWebAppUi` | `GET /` | `backend/app.py`, `backend/ui.py` | 認証不要（ループバックバインド限定・単一ユーザー環境）。HTML エスケープおよび `api_base_url` スキーム検証を実施 | `test_api_integration.py::TestProductionModeWebUiAndDeletion::test_get_web_ui_contains_all_required_testids_lang_switch_and_xss_safe_api_base_url`, `test_ac6_empty_state.py`, `test_ac8_fallback_and_offline.py`, `test_ac9_ssrf_and_permissions.py` |
| 2 | `createLearning` | `POST /api/v1/learnings` | `backend/app.py`, `backend/service.py`, `backend/url_fetcher.py`, `backend/generator.py` | 認証不要（ループバックバインド＋同一オリジン CORS＋`Content-Type: application/json`＋64KB上限）。SSRF 検証通過のみ許可、`Idempotency-Key` 対応 | `test_api_integration.py::TestLearningAndIdempotency::test_create_learning_persists_in_real_sqlite_and_ignores_mass_assignment`, `test_idempotency_replay_and_mismatch_422_and_error_recovery`, `test_ssrf_and_fetcher.py::TestSsrfAndUrlFetcher::*`, `test_ac1_create_learning.py` |
| 3 | `getTodaySession` | `GET /api/v1/sessions/today` | `backend/app.py`, `backend/service.py` | 認証不要（ループバックバインド・単一ユーザーローカル SQLite 参照）。未回答問題最大1件・期限到来カード最大5件に制限 | `test_api_integration.py::TestSessionCapAbuseAndErrorSafety::test_today_session_caps_at_1_challenge_and_5_reviews_even_with_large_dataset`, `test_ac2_today_session.py`, `test_ac6_empty_state.py` |
| 4 | `submitChallenge` | `POST /api/v1/challenges/{challenge_id}/submit` | `backend/app.py`, `backend/service.py`, `backend/domain.py` | 認証不要（同一オリジン CORS＋`application/json` 必須）。`challenge_id` の実在・種別・DB インスタンス一致検証（不一致は 404 `RESOURCE_NOT_FOUND`）、完了済み再送は 409 `CHALLENGE_ALREADY_COMPLETED`、`Idempotency-Key` 対応 | `test_api_integration.py::TestAuthorizationAndCrossResource::test_submit_challenge_with_nonexistent_id_returns_404`, `test_submit_challenge_with_review_card_id_cross_type_returns_404`, `test_submit_challenge_cross_instance_id_returns_404`, `test_submit_challenge_already_completed_returns_409`, `test_ac3_submit_challenge.py` |
| 5 | `gradeReviewCard` | `POST /api/v1/reviews/{card_id}/grade` | `backend/app.py`, `backend/service.py`, `backend/domain.py` | 認証不要（同一オリジン CORS＋`application/json` 必須）。`card_id` の実在・種別・DB インスタンス一致検証（不一致は 404 `RESOURCE_NOT_FOUND`）、期限前評価は 409 `REVIEW_CARD_NOT_DUE`、`Idempotency-Key` 対応 | `test_api_integration.py::TestAuthorizationAndCrossResource::test_grade_review_with_nonexistent_id_returns_404`, `test_grade_review_with_challenge_id_cross_type_returns_404`, `test_grade_review_cross_instance_id_returns_404`, `test_grade_review_not_due_returns_409`, `test_ac4_grade_review.py` |
| 6 | `getSkillsSummary` | `GET /api/v1/skills/summary` | `backend/app.py`, `backend/service.py`, `backend/domain.py` | 認証不要（ループバックバインド・固定6領域のみ返却） | `test_domain_and_migrations.py::TestDomainCalculations::*`, `test_contract_conformance.py::TestOpenApiContractConformance::test_all_endpoints_return_exact_contract_fields_without_extra_properties`, `test_ac5_skills_summary.py` |
| 7 | `resetTestState` | `POST /api/v1/test/reset` | `backend/app.py`, `backend/service.py` | `APP_ENV=production` 時は HTTP 403 `TEST_SEAM_DISABLED` で拒否。非本番環境かつ同一オリジンのみ許可 | `test_api_integration.py::TestProductionModeWebUiAndDeletion::test_production_mode_blocks_test_reset_and_seed_with_403_and_ignores_test_headers`, `test_delete_and_reset_clears_all_tables_and_routes_match_contract` |
| 8 | `seedTestState` | `POST /api/v1/test/seed` | `backend/app.py`, `backend/service.py` | `APP_ENV=production` 時は HTTP 403 `TEST_SEAM_DISABLED` で拒否。非本番環境かつ同一オリジン・`application/json` のみ許可 | `test_api_integration.py::TestProductionModeWebUiAndDeletion::test_production_mode_blocks_test_reset_and_seed_with_403_and_ignores_test_headers`, `test_contract_conformance.py` |

---

## 2. 認可の表と交差テストの結果。ログインなしの入口と理由

### ログインなしの入口と理由
- 本機能（`001-personal-learning-loop`）は PRD 10節「やらないこと（ユーザーアカウント登録・ログイン・マルチテナント認証）」、`contracts/openapi.yaml`（全 operation で `security: []`）、および技術設計メモ 7章（脅威モデル）の決定どおり、利用者本人のローカル環境（`127.0.0.1:8000`）で摩擦ゼロで動かす単一ユーザー育成エンジンのため、全8エンドポイントがログイン不要である。
- 第三者や悪意ある外部サイトからの不正操作を防ぐため、以下の防御をすべての入口に適用している：
  1. **ループバック待ち受け強制（`backend/config.py`）**：`DEVFORGE_HOST` に `127.0.0.0/8`, `::1`, `localhost` 以外（例：`0.0.0.0` や LAN IP）が指定された場合は起動せず終了コード `2` で拒否する。
  2. **同一オリジン検証と JSON 強制（`backend/app.py`）**：外部 `Origin`（例：`https://attacker.example.com`）からの状態変更リクエストを拒否し、ボディを持つ POST は `Content-Type: application/json` 以外を HTTP 400 で遮断する。
  3. **本番モードでのテスト口遮断（`backend/app.py`, `backend/service.py`）**：`APP_ENV=production` 時は `/api/v1/test/*` を HTTP 403 `TEST_SEAM_DISABLED` で拒否し、`X-Test-Now` と `X-Test-Url-Fetch-Mode` を無視する。

### 認可の表
| 主体 | 対象リソース（SQLite テーブル） | 許可される操作 | アプリ層・DB層での強制方法 |
|---|---|---|---|
| ローカル利用者（ループバック接続・同一オリジン） | `learnings`, `challenges`, `review_cards`, `skill_progress`, `user_stats` | `createLearning`, `getTodaySession`, `submitChallenge`, `gradeReviewCard`, `getSkillsSummary` | 許可リストによる入力フィールド抽出（Mass Assignment 防止）、UUID ベース予測不能 ID、SQLite `FOREIGN KEY`・`CHECK` 制約、プレースホルダ `?` バインド |
| 別プロファイル / 異種リソース ID 指定 | `challenges` (`challenge_id`), `review_cards` (`card_id`) | なし（HTTP 404 `RESOURCE_NOT_FOUND`） | テーブル主キー照合により存在しない ID・異種 ID（`card_id` と `challenge_id` の入れ替え）・別インスタンス DB の ID をすべて 404 で拒否 |
| 外部 Web オリジン（クロスオリジン） | 全 POST エンドポイント | なし（HTTP 400 `VALIDATION_ERROR` 拒否） | `_verify_same_origin_for_mutation()` と `Content-Type: application/json` 強制 |
| 本番環境（`APP_ENV=production`）でのテスト操作 | `/api/v1/test/reset`, `/api/v1/test/seed`, テスト用ヘッダ | なし（HTTP 403 `TEST_SEAM_DISABLED` / ヘッダ無視） | `is_production` ガードにより処理前に遮断 |

### 交差テストの結果
ID を受け取るエンドポイントは `submitChallenge`（`challenge_id`）と `gradeReviewCard`（`card_id`）の **2個** であり、これに対して以下の **6本**（2個以上）の交差・未存在 ID テストを本物の SQLite DB 2インスタンス（User A DB / User B DB）上で実行し、すべて HTTP 404 `RESOURCE_NOT_FOUND` になることを確認した：
1. `test_submit_challenge_with_nonexistent_id_returns_404`（PASS）
2. `test_submit_challenge_with_review_card_id_cross_type_returns_404`（PASS：`card_id` を `challenges/{id}/submit` に送信 → 404）
3. `test_submit_challenge_cross_instance_id_returns_404`（PASS：プロファイル A の `challenge_id` をプロファイル B のサーバーへ送信 → 404）
4. `test_grade_review_with_nonexistent_id_returns_404`（PASS）
5. `test_grade_review_with_challenge_id_cross_type_returns_404`（PASS：`challenge_id` を `reviews/{id}/grade` に送信 → 404）
6. `test_grade_review_cross_instance_id_returns_404`（PASS：プロファイル A の `card_id` をプロファイル B のサーバーへ送信 → 404）

---

## 3. データの変更

- **マイグレーションファイル**：
  - UP：`backend/migrations/001_initial_schema.up.sql`
  - DOWN：`backend/migrations/001_initial_schema.down.sql`
  - ランナー：`backend/migrations/__init__.py`, `backend/migrations/__main__.py`
- **3段（足す、移す、消す）のどこか**：
  - 初回スキーマ（v1）のため **第1段「足す（Add）」のみ**。既存の列の削除・改名・型変更は 0 件。
  - `NOT NULL`、`PRIMARY KEY`、`FOREIGN KEY ... ON DELETE CASCADE`、`CHECK` 制約をすべて SQLite テーブル定義に付与し、外部キー列には索引 `idx_challenges_learning_id` および `idx_review_cards_learning_id` を作成した。
- **ローカルでの `up -> down -> up` 実行ログ**：
  ```
  $ python3 -m backend.migrations up --db /tmp/devforge_mig_verify.sqlite3 && \
    python3 -m backend.migrations down --db /tmp/devforge_mig_verify.sqlite3 && \
    python3 -m backend.migrations up --db /tmp/devforge_mig_verify.sqlite3 && \
    rm -f /tmp/devforge_mig_verify.sqlite3*
  migrate_up ok: newly_applied=[1] current_versions=[1] tables=['challenges', 'idempotency_keys', 'learnings', 'review_cards', 'schema_migrations', 'skill_progress', 'telemetry_events', 'user_stats']
  migrate_down ok: rolled_back=[1] current_versions=[] tables=['schema_migrations']
  migrate_up ok: newly_applied=[1] current_versions=[1] tables=['challenges', 'idempotency_keys', 'learnings', 'review_cards', 'schema_migrations', 'skill_progress', 'telemetry_events', 'user_stats']
  ```
- **`squawk` の出力**：
  - 対象外・未検査（理由：`squawk` は PostgreSQL DDL 専用のリンターであり、本アプリは ADR 001 により SQLite を採用しているため対象外。またワークスペース環境にも `squawk` は未インストール）。
  ```
  $ command -v squawk || echo "squawk: not installed"
  squawk: not installed
  ```

---

## 4. 互換性

- **`oasdiff breaking` の出力**：
  - **新規**（`origin/main` ブランチに `contracts/openapi.yaml` が存在しない初回契約のため破壊的変更なし。また環境に `oasdiff` は未インストール）。
  ```
  $ git show origin/main:contracts/openapi.yaml 2>&1 || true
  fatal: path 'contracts/openapi.yaml' exists on disk, but not in 'origin/main'
  $ command -v oasdiff || echo "oasdiff: not installed"
  oasdiff: not installed
  ```
- **最低対応版への影響**：
  - 初回リリース（v1.0.0）のため既存の公開済みクライアント版は存在せず、最低対応版の引き上げは不要。
  - 将来の enum 追加やエラーコード追加に備え、UI デコーダが未知の `SkillCategory` / `UrlFetchStatus` を `unknown`（`その他` / `Other`）として扱い、未知の `error.code` を受けてもクラッシュせず `ProblemDetails.title` を表示することを `test_domain_and_migrations.py::TestUiI18nAndForwardCompatibility::test_unknown_enum_and_unknown_error_code_fallbacks` で検証済み。

---

## 5. 失敗の扱い

- **冪等にした操作とキーの保持期間**：
  - 対象操作：`createLearning`（`POST /api/v1/learnings`）、`submitChallenge`（`POST /api/v1/challenges/{challenge_id}/submit`）、`gradeReviewCard`（`POST /api/v1/reviews/{card_id}/grade`）の全3つの状態変更 POST。
  - 保持期間：初回の 2xx 成功時刻から **24時間（86,400秒）** `idempotency_keys` テーブルに保存する。4xx/5xx 応答時は保存しないため、入力修正後に同じキーで再送可能。
  - 判定方式：`sha256(METHOD + " " + PATH + "\n" + canonical_json_body)` を比較し、一致時は保存済みのステータスコード・本文と `Idempotent-Replayed: true` ヘッダを返し、不一致時は HTTP 422 `IDEMPOTENCY_KEY_MISMATCH` を返す。同一キーの同時要求はキー単位ロック＋`BEGIN IMMEDIATE` トランザクションで直列化する。
- **一覧・入力・外部通信の上限**：
  - `GET /api/v1/sessions/today`：`active_challenge` は古い順に最大 **1件**、`due_reviews` は期限が古い順に最大 **5件**（計最大6問、`estimated_seconds` 上限 **180秒**）。
  - `GET /api/v1/skills/summary`：固定 **6領域**。
  - リクエスト本文上限：**64KB（65,536 bytes）**、`memo` / `answer` は **10〜2,000文字**（前後空白除去後10文字以上）、`title` は **200文字**、`url` は **2,048文字**。
  - 外部 URL 取得上限（`UrlFetcher`）：全体タイムアウト **2.0秒**、最大読込サイズ **512KB（524,288 bytes）**、リダイレクト最大 **3回**。公開 URL の取得失敗・タイムアウト時はエラーにせず `url_fetch_status: "fallback_used"`（HTTP 201）でメモ本文から生成する。
- **エラーの RFC 9457 `type` と `error.code` の一覧**：
  | `type` | `error.code` | HTTP 状態コード | 用途 |
  |---|---|---|---|
  | `https://devforge.local/problems/validation-error` | `VALIDATION_ERROR` | 400 | 文字数・型・範囲・Content-Type・Origin・Idempotency-Key 長さ不正 |
  | `https://devforge.local/problems/invalid-url-scheme-or-host` | `INVALID_URL_SCHEME_OR_HOST` | 400 | 非 http(s) スキーム、`localhost`、プライベート/ループバック/リンクローカル/CGNAT IP 指定（SSRF 遮断） |
  | `https://devforge.local/problems/test-seam-disabled` | `TEST_SEAM_DISABLED` | 403 | `APP_ENV=production` 時の `/api/v1/test/*` 呼び出し |
  | `https://devforge.local/problems/resource-not-found` | `RESOURCE_NOT_FOUND` | 404 | 存在しない `challenge_id` / `card_id` または未定義ルート |
  | `https://devforge.local/problems/challenge-already-completed` | `CHALLENGE_ALREADY_COMPLETED` | 409 | 回答済み問題へのキーなし・別キー再提出 |
  | `https://devforge.local/problems/review-card-not-due` | `REVIEW_CARD_NOT_DUE` | 409 | 復習期限到来前のカードへの評価送信 |
  | `https://devforge.local/problems/idempotency-key-mismatch` | `IDEMPOTENCY_KEY_MISMATCH` | 422 | 同一 `Idempotency-Key` での異なるメソッド・パス・本文送信 |
  | `https://devforge.local/problems/rate-limit-exceeded` | `RATE_LIMIT_EXCEEDED` | 429 | 分あたりリクエスト上限超過（`Retry-After` ヘッダ同梱） |
  | `https://devforge.local/problems/internal-error` | `INTERNAL_ERROR` | 500 | 予期しない内部障害（スタックトレース・SQL 非露出） |

---

## 6. 個人データと削除の地図

本アプリは氏名・メールアドレス・電話番号・位置情報等の直接個人情報を収集しないが、利用者が入力した学習メモ・履歴データを以下の地図に従って完全消去できる。

| 置き場所 | 保存内容 | 個人情報か | 保存期間 | 消し方 | 確かめるテスト / RUNBOOK 手順 |
|---|---|---|---|---|---|
| SQLite `learnings` 表 | 学習タイトル、参照 URL、メモ本文、領域、XP | いいえ（技術メモのみ） | 利用者が削除するまで | `python3 -m backend.migrations purge --db <DB>` または `LearningLoopService.purge_all_user_data()` | `test_api_integration.py::TestProductionModeWebUiAndDeletion::test_delete_and_reset_clears_all_tables_and_routes_match_contract` |
| SQLite `challenges` 表 | 生成問題、3観点ルーブリック、記述回答 | いいえ | 利用者が削除するまで | 親 `learnings` 削除時 `ON DELETE CASCADE` または `purge_all_user_data()` | 同上（削除後 0 件を検証） |
| SQLite `review_cards` 表 | 復習カード表裏、SM-2 間隔・EF・次回日時 | いいえ | 利用者が削除するまで | 親 `learnings` 削除時 `ON DELETE CASCADE` または `purge_all_user_data()` | 同上（削除後 0 件を検証） |
| SQLite `skill_progress` / `user_stats` 表 | 6領域累計 XP、連続学習日数、最終学習日 | いいえ | 利用者が削除するまで | `purge_all_user_data()` で全領域 XP `0`・連続日数 `0`・最終学習日 `NULL` に初期化 | 同上（XP 合計 0・初期状態を検証） |
| SQLite `idempotency_keys` 表 | 冪等キー、リクエストハッシュ、成功応答 JSON | いいえ | 作成から24時間 | 24時間経過時に自動無効化・削除、`purge_expired_records()` / `purge_all_user_data()` で削除 | 同上（削除後 0 件を検証） |
| SQLite `telemetry_events` 表 | PRD 15節の匿名利用イベント統計 | いいえ（匿名統計のみ） | 作成から90日間 | `purge_expired_records()`（90日超削除）または `purge_all_user_data()` | 同上（削除後 0 件を検証） |
| ブラウザ `localStorage`（`devforge_draft_learning_v1`） | 通信切断時の未送信フォーム下書き | いいえ | 登録成功（HTTP 201）時まで | 登録成功時に自動削除。手動削除は `backend/RUNBOOK.md` 5節に記載 | `backend/RUNBOOK.md` 5節（手作業が残る所） |
| オブジェクト Storage / 外部 SaaS / Apple SIWA | なし（不使用） | 対象外 | 対象外 | 外部ストレージ・外部送信なし | `contracts/dependencies.md`、AST 依存検査 |
| 標準出力アクセスログ | リクエスト ID、操作名、状態コード、処理時間 | いいえ（メモ本文・PII 非出力） | プロセス実行中またはログローテーション期限（30日推奨） | ログファイル削除手順を `backend/RUNBOOK.md` 5節に記載 | `test_api_integration.py::TestSessionCapAbuseAndErrorSafety::test_500_error_body_hides_traceback_and_sql_and_logs_contain_zero_secrets` |
| SQLite バックアップスナップショット | DB ファイルの複製 | いいえ | 世代管理分（直近7世代推奨） | 古いスナップショットファイル削除手順を `backend/RUNBOOK.md` 3節・5節に記載 | `backend/RUNBOOK.md` 3節・5節 |

---

## 7. 運用

- **構造化ログの項目（JSON 1行形式、`backend/logging_utils.py`）**：
  - 出力する項目：`timestamp`（UTC ISO8601）、`request_id`（UUIDv4）、`user_id`（仮名固定 `"local_user"`）、`operation`（`operationId` または `ssrf_redirect_blocked` 等）、`method`、`path`（クエリ文字列除外）、`result`（`success` / `client_error` / `server_error` / `blocked`）、`status_code`、`processing_ms`、`error_code`（エラー時のみ）。
  - 出力しない項目（強制サニタイズ）：`memo`、`answer`、パスワード、トークン、セッション ID、鍵、DB 接続パス、メールアドレス、改行コード（`\r`, `\n` は空白置換）。
- **4つの黄金指標（Golden Signals）**：
  1. **遅延（Latency）**：構造化ログおよび `telemetry_events` の `processing_ms`（目標：参照・回答・評価 p95 <= 500ms、学習登録 <= 3,000ms）。
  2. **量（Traffic）**：分あたりリクエスト数、`telemetry_events` の `Learning Created` / `Session Started` / `Session Completed` 件数。
  3. **エラー（Errors）**：`status_code >= 500` の件数・比率（目標：5xx 率 < 0.5%、PRD 撤退基準3：7日間で 5xx またはデータ消失で非発生率 < 99.0% なら新規リリース停止）。
  4. **飽和（Saturation）**：SQLite DB＋WAL ファイルサイズ、429 `RATE_LIMIT_EXCEEDED` 発生数、SQLite `busy_timeout` 待ち時間。
- **アラート条件（症状ベース・即応可能なもののみ）**：
  - **Alert-1（重大：5xx エラー発生）**：`status_code >= 500` が1件以上記録されたとき → `backend/RUNBOOK.md` 4節の手順で直近変更の確認・DB 整合性検査・必要時バックアップ復元を行う。
  - **Alert-2（警告：変換 SLA 超過）**：`operation == "createLearning"` の `processing_ms > 3000` が発生したとき → `UrlFetcher` の 2.0秒タイムアウト設定とディスク I/O を確認する。
  - **Alert-3（監視：SSRF リダイレクト遮断）**：`operation == "ssrf_redirect_blocked"` が記録されたとき → 不審な短縮 URL・リダイレクト元ドメインを確認する。
- **回数の上限（レート制限）**：
  - `SlidingWindowRateLimiter` により60秒スライディングウィンドウで既定 **600回/分**（環境変数 `DEVFORGE_RATE_LIMIT_PER_MINUTE` で変更可）に制限し、超過時は HTTP 429 と `Retry-After` ヘッダを返す。
- **外部サービスごとの月額見積もり**：
  - 外部 API・外部 SaaS 依存：**0件（`$0.00 / 月`）**。問題生成はローカル決定論的エンジン（`RuleBasedChallengeGenerator`）、DB はローカル SQLite のため従量課金は一切発生しない。
  - 参考（将来クラウド単一 VPS 上で個人/小規模ホスティングする場合）：1 vCPU / 1GB RAM インスタンス 1台あたり約 **$5.00〜$7.00 / 月**（帯域・ストレージ上限アラートを $10/月に設定：詳細は `backend/RUNBOOK.md` 6節）。

---

## 8. 実行したコマンドと出力

### 8.1 単体・結合テストおよび受け入れテスト（`app.json` の `commands.backend_test`）
本物の SQLite ファイル DB と本物の HTTP サーバープロセスを用いて、単体・結合テスト **38件** と受け入れテスト **31件**（計 **69件**）がすべて合格した。

```
$ python3 -m unittest discover -s backend/tests/unit -p "test_*.py" && python3 -m unittest discover -s backend/tests/acceptance -t backend/tests/acceptance -p "test_*.py"
......................................
----------------------------------------------------------------------
Ran 38 tests in 1.872s

OK
...............................
----------------------------------------------------------------------
Ran 31 tests in 2.053s

OK
```

### 8.2 5章の検査コマンドと出力

1. **契約とのルート差分検査 & `schemathesis`**：
   - `schemathesis` は外部パッケージ追加禁止（`contracts/dependencies.md`）かつ環境に未インストールのため未検査。代替として `python3 -m backend.app --list-routes` と `contracts/openapi.yaml` の全 `operationId`・メソッド・パスの完全一致検査、および `test_contract_conformance.py` による全8エンドポイントのレスポンスキー集合検証を実行し、差分 **0件** を確認した。
   ```
   $ command -v schemathesis || echo "schemathesis: not installed"
   schemathesis: not installed

   $ python3 -m backend.app --list-routes
   getWebAppUi GET /
   createLearning POST /api/v1/learnings
   getTodaySession GET /api/v1/sessions/today
   submitChallenge POST /api/v1/challenges/{challenge_id}/submit
   gradeReviewCard POST /api/v1/reviews/{card_id}/grade
   getSkillsSummary GET /api/v1/skills/summary
   resetTestState POST /api/v1/test/reset
   seedTestState POST /api/v1/test/seed
   # contract_count=8 impl_count=8 missing_in_impl=[] extra_in_impl=[] ROUTE_DIFF=0 (exact match)
   ```

2. **互換性（`oasdiff breaking`）**：
   - `origin/main` に `contracts/openapi.yaml` が存在しないため **「新規」**（また `oasdiff` は環境に未インストール）。
   ```
   $ git show origin/main:contracts/openapi.yaml 2>&1 || true
   fatal: path 'contracts/openapi.yaml' exists on disk, but not in 'origin/main'
   $ command -v oasdiff || echo "oasdiff: not installed"
   oasdiff: not installed
   ```

3. **マイグレーション（`squawk` および `up -> down -> up`）**：
   - `squawk` は PostgreSQL 専用のため対象外（環境にも未インストール）。SQLite 本物の DB で `up -> down -> up` を実行し成功を確認（3節にログ貼付済み）。

4. **Supabase（`supabase db reset` / `test db` / `advisors`）**：
   - **対象外**（ADR 001 により Supabase / PostgreSQL は使用せず、Python 標準 `sqlite3` を採用しているため）。

5. **秘密検査（`gitleaks`）と鍵の混入検査（`service_role` grep）**：
   - `gitleaks` は環境に未インストールのため未検査。代替として正規表現による秘密鍵・APIトークンパターン検査および `service_role` 混入 grep を実行し、指摘 **0件** を確認した。
   ```
   $ command -v gitleaks || echo "gitleaks: not installed"
   gitleaks: not installed

   $ grep -rnE 'service_role|SERVICE_ROLE' backend/ || echo "service_role matches: 0"
   service_role matches: 0

   $ grep -rnE 'AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z\-_]{35}|sk-[A-Za-z0-9]{20,}|-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----' backend/ || echo "Secret pattern matches: 0"
   Secret pattern matches: 0
   ```

6. **依存パッケージ検査（`contracts/dependencies.md` との一致）**：
   - 追加パッケージ・lockfile は 0 件。AST 解析で `backend/` 配下の全 Python ファイルの `import` 文を走査し、サードパーティ製モジュールが **0件**（すべて Python 3.9 標準ライブラリのみ）であることを確認した。
   ```
   $ python3 -c '... AST import check ...'
   checked_files=18 third_party_imports=[]
   ```

---

## 9. 未確認のこと

1. **外部 CLI ツール（`schemathesis`, `oasdiff`, `gitleaks`）による直接実行**：ワークスペース環境に該当バイナリがインストールされておらず、かつ `contracts/dependencies.md` により外部パッケージ追加が禁止されているため未実行（代替として OpenAPI ルート・フィールド完全一致テスト `test_contract_conformance.py` および秘密パターン grep 検査で検証済み）。
2. **実ブラウザでの目視レンダリング・200%ズーム・オフライン手動再試行のスクリーンショット撮影**：`test-plan.md` 3章・7章の役割分担に従い、G3 で `verifier`、G4 で `Takuma` が実ブラウザで確認する（初期 HTML の必須10 `data-testid`、日英辞書完全一致、XSS エスケープ、権限 API 不使用は単体・受け入れテストで自動検証済み）。

---

## チェックリスト（craft-backend-engineer 6章）

- [x] 対応表の行の数が、技術設計メモの 4 の表の operation の数と同じ。（8行 ＝ 8 operationId で完全一致）
- [x] 交差テストの数が、ID を受け取るエンドポイントの数以上。（ID を受け取るエンドポイント 2個に対し、交差・未存在 ID テスト 6本を実装・合格）
- [x] 3章のテストのうち当てはまるものが、本物の DB で通ったログがある。（交差、割り当てすぎ、冪等、上限・429、500本文隠蔽、ログ検査、削除の全項目を本物の SQLite DB で実行し 38件 PASS）
- [x] schemathesis、oasdiff、squawk、advisors、gitleaks の出力がある（使わない道具は「対象外」と理由）。（8節にすべての出力・未検査理由・対象外理由と代替検証ログを記載）
- [x] マイグレーションの up、down、up のログがあり、列を消す変更は最低対応版より後になっている。（3節に `up -> down -> up` 成功ログを記載。列の削除は 0件）
- [x] 削除の地図の行ごとに、テストか RUNBOOK の手作業の手順がある。（6節の全行に単体テスト名または `backend/RUNBOOK.md` の該当節を明記）
- [x] 環境変数の名前が RUNBOOK にあり、値はコードにもログにもない。（`backend/RUNBOOK.md` 1節に一覧記載、秘密値のハードコード・ログ出力 0件）
- [x] 外部サービスごとに、月額の見積もりと、利用上限か請求アラートがある。（7節および `backend/RUNBOOK.md` 6節に記載。外部課金サービス 0件＝$0/月）
- [x] 報告の「自己点検」に API1 から API10 の10行がある。（指揮役への完了報告に OWASP API1〜API10 の全10行を記載）
