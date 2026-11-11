PASS

## 指摘
- 提案、contracts/openapi.yaml:824-856、`POST /api/v1/test/seed`（`seedTestState`）の `responses` に `"403"`（`TEST_SEAM_DISABLED`）の定義がない（`POST /api/v1/test/reset` には contracts/openapi.yaml:758-776 で定義済み）、根拠：docs/adr/features/001-personal-learning-loop.md:201（「`APP_ENV=production` の場合は `/api/v1/test/*` をすべて HTTP 403（`TEST_SEAM_DISABLED`）で拒否する」）、直す方向：`seedTestState` にも同じ `"403"`（`ProblemDetails` / `TEST_SEAM_DISABLED`）を追記する。
- 提案、docs/adr/features/001-personal-learning-loop.md:199、SSRF 対策で DNS 解決後に `ipaddress` で検証してからホスト名のまま `urllib.request.urlopen` を呼ぶと、2回目の名前解決で内部 IP を返す DNS Rebinding（TOCTOU）の余地が残る、根拠：AC-9（docs/prd/001-personal-learning-loop.md:167-172）、OWASP API7:2023（https://owasp.org/API-Security/editions/2023/en/0x11-t10/ ）、直す方向：G2 の `UrlFetcher` 実装で検証済み IP へ接続を固定するか、リダイレクト毎に再検証する。
- 提案（既存）、.claude/org/app.json:19-23、`commands.backend_test` が空文字列のまま、根拠：docs/org/gates.md:54（「app.json の commands のうち、その領域のものが空でない」）、CLAUDE.md:13-21、直す方向：G2 の前に CLAUDE.md:21 のコマンドを `commands.backend_test` に設定するよう Takuma に頼む。

## 証拠
- 対象：`197baf604bc91bc0ef061c2f7a78f7973cb00577...061f5f91224f2efbb5b0aa74f31e24b7bd21e4c0`（観点：設計 G1）
  - [x] CLAUDE.md（全46行）
  - [x] contracts/dependencies.md（全23行）
  - [x] contracts/openapi.yaml（全1,505行）
  - [x] docs/adr/001-python-stdlib-sqlite-architecture.md（全85行）
  - [x] docs/adr/features/001-personal-learning-loop.md（全245行）

### 1. AC 対応表
| AC | 使う `operationId` | データ / スキーマ | テストつなぎ口の反映 | 判定 |
|---|---|---|---|---|
| AC-1 | `createLearning`、`getWebAppUi` | `learnings`, `challenges`, `review_cards`, `skill_progress`, `telemetry_events` / `CreateLearningRequest`, `CreateLearningResponse` | Seam #3（`X-Test-Url-Fetch-Mode`）、Seam #5（決定論的生成） | PASS |
| AC-2 | `getTodaySession`、`seedTestState`、`getWebAppUi` | `challenges`, `review_cards` / `TodaySessionResponse` | Seam #1（`/api/v1/test/seed`）、Seam #2（`X-Test-Now`） | PASS |
| AC-3 | `submitChallenge`、`getWebAppUi` | `challenges`, `skill_progress`, `user_stats` / `SubmitChallengeRequest`, `SubmitChallengeResponse` | Seam #2（当日初回 `streak_days` 判定） | PASS |
| AC-4 | `gradeReviewCard`、`getWebAppUi` | `review_cards`, `skill_progress`, `user_stats` / `GradeReviewRequest`, `GradeReviewResponse` | `grade: 1..4` の計算式と `round_half_up` を contracts/openapi.yaml:471-493 に明記 | PASS |
| AC-5 | `getSkillsSummary`、`getWebAppUi` | `skill_progress`, `user_stats` / `SkillsSummaryResponse` | `weekly_mastered_count` 正規化を contracts/openapi.yaml:614 に明記 | PASS |
| AC-6 | `resetTestState`、`getTodaySession`、`getSkillsSummary`、`getWebAppUi` | `emptySession`, `emptySummary` の例 | Seam #1（`/api/v1/test/reset`）、`data-testid="empty-state-guide"` | PASS |
| AC-7 | `createLearning`、`submitChallenge`、`gradeReviewCard`、`getWebAppUi` | `ProblemDetails`, `ErrorDetailObject`（RFC 9457 + `error.code` / `error.message` / `field`） | `minLength: 10, maxLength: 2000`、`minimum: 1, maximum: 4` | PASS |
| AC-8 | `createLearning`、`getWebAppUi`（`?api_base_url=`） | `CreateLearningResponse`（`createdFallback`）、`draft_learning_input` | Seam #3（`stub_timeout`, `stub_error`）、Seam #4（`offline-error-banner`, `retry-submit-btn`） | PASS |
| AC-9 | `createLearning`、`getWebAppUi` | `ProblemDetails`（`ssrfBlocked`） | SSRF 検査をスタブ判定より前に行う順序（docs/adr/features/001-personal-learning-loop.md:90） | PASS |

### 2. エンドポイントごとの認可の表（空欄なし）
| `operationId` | メソッド・パス | 認証 | 認可（API1 / API5） | 返すフィールド（API3） | 上限（API4 / API6） |
|---|---|---|---|---|---|
| `getWebAppUi` | `GET /` | 不要（`127.0.0.1` バインド、単一ユーザー） | テナント境界なし（静的 HTML/JS 配信のみ） | HTML のみ | 初期配信 p95 100ms、ポーリング0件 |
| `createLearning` | `POST /api/v1/learnings` | 不要（同一オリジン CORS ＋ `application/json` 必須） | 単一ユーザーの DB に作成（他者の ID 指定なし） | 画面表示に必要な項目のみ | ボディ 64KB、`memo` 10〜2,000、URL 取得 2.0秒・512KB、全体 3,000ms、`Idempotency-Key` |
| `getTodaySession` | `GET /api/v1/sessions/today` | 不要 | 単一ユーザーの DB のみ参照 | セッション項目のみ | `active_challenge` 最大1件、`due_reviews` 最大5件、p95 500ms |
| `submitChallenge` | `POST /api/v1/challenges/{challenge_id}/submit` | 不要（同一オリジン ＋ `application/json`） | `challenge_id` の実在確認（なければ 404 `RESOURCE_NOT_FOUND`） | 結果項目のみ | ボディ 64KB、`answer` 10〜2,000、`matched_rubric_count` 0〜3、`Idempotency-Key` |
| `gradeReviewCard` | `POST /api/v1/reviews/{card_id}/grade` | 不要（同一オリジン ＋ `application/json`） | `card_id` の実在確認（なければ 404 `RESOURCE_NOT_FOUND`） | 結果項目のみ | ボディ 64KB、`grade` 1〜4、`Idempotency-Key` |
| `getSkillsSummary` | `GET /api/v1/skills/summary` | 不要 | 単一ユーザーの固定6領域のみ参照 | 固定6要素＋全体集計 | p95 500ms |
| `resetTestState` | `POST /api/v1/test/reset` | テスト環境のみ | `APP_ENV=production` で 403 `TEST_SEAM_DISABLED` | `status` のみ | べき等 |
| `seedTestState` | `POST /api/v1/test/seed` | テスト環境のみ | `APP_ENV=production` で 403 `TEST_SEAM_DISABLED`（契約への 403 追記は提案1） | `status` と件数のみ | ボディ 64KB |

### 3. 信頼の境界
| 境界 | 越えるデータ | 検証と認可 | 判定 |
|---|---|---|---|
| ブラウザ ↔ API（`127.0.0.1:8000`） | `title`, `url`, `memo`, `answer`, `matched_rubric_count`, `grade`, ID | サーバー側の範囲検証、SQL のパラメータバインド、`textContent` で描画（XSS 防止）、`application/json` 強制と同一オリジン CORS | PASS |
| `UrlFetcher` ↔ 外部インターネット | ユーザー指定 URL への GET | スキーム検証、`getaddrinfo` 後の全 IP を `ipaddress` で検証、2.0秒・512KB 上限、失敗時はフォールバック（DNS Rebinding は提案2） | PASS |

### 4. 元に戻しにくい判断と、いちばん強い反論
| 判断 | いちばん強い反論 | ADR の答え | 戻し方 | 判定 |
|---|---|---|---|---|
| Python 標準ライブラリのみ（ADR 001） | 自前のルーター・エラー整形・SSRF 検証はバグが混入しやすい | 8エンドポイントと小さく、外部依存0でクリーン環境のテストが確実に動く利点が上回る。境界値は単体テストで網羅 | 契約とドメイン層を分けており、アダプタ層だけ FastAPI 等へ差し替え可能 | PASS |
| 決定論的ルールベース生成（ADR 001） | 定型的な設問になり飽きる | 目的は3視点を言語化する訓練。3,000ms 保証・月額 \$0・機密メモを外へ送らない・CI で決定論的 | `ChallengeGenerator` を分離。回答率80%未満で LLM アダプタへ差し替え | PASS |
| SQLite（WAL） | 複数ユーザー同時書き込みでロック | 初期は単一ユーザー。WAL で 1.18ms | 同時接続100人超かつ p95 > 500ms で PostgreSQL へ移行 | PASS |
| 認証なし（`security: []`） | 悪意あるサイトからローカル API へのリクエスト、外部公開時の改ざん | ループバックバインド、同一オリジン CORS、`application/json` 必須で単純 POST を遮断 | 外部公開時は Bearer トークンと認証 ADR を足す（破壊的変更なし） | PASS |

### 5. 確かめ（A）（B）・依存・CLAUDE.md
- 確かめ（A）1〜9：全項目を自分で確かめ、満たす（AC 9行に空欄なし、図の全要素と矢印、全8 operation に `operationId`・例・認証要否・AC 番号・`problem+json`、spectral は「未検査」と理由と代替検証、oasdiff は「新規」、全8エンティティの列、非機能の数値と測り方、STRIDE 6行、全6イベントの送り先、dependencies.md の全列）。
- 確かめ（B）1〜3：3案すべてに良い点と悪い点、反論、悪い結果、見直す条件2件、公式 URL 6件と spike の出力がある。
- CLAUDE.md は46行（100行以内）で、単体テストと受け入れテストのコマンドがある。

- 読んだファイル：.claude/agents/reviewer.md、.claude/skills/craft-reviewer/SKILL.md、docs/org/gates.md、docs/templates/review-report.md、.claude/org/app.json、docs/prd/001-personal-learning-loop.md、docs/reviews/001-personal-learning-loop-G0-verifier-r1.md、docs/approvals/001-personal-learning-loop-G0.md、docs/progress.md、差分の5ファイル全体
- 実行したコマンドと結果：
  - コミット履歴の確認：`197baf6`（G0承認）→ `061f5f9`（技術設計と契約（tech-lead））
  - contracts/openapi.yaml 全1,505行の精査：8つの `operationId` が一意で、AC-1〜AC-9 と Seam #1〜#5 がすべてある
  - 外部の規則ページ4件を取得（すべて HTTP 200）
- 開いた URL と確認した日付：
  - https://owasp.org/API-Security/editions/2023/en/0x11-t10/ （2026-10-30）引用：「API7:2023 - Server Side Request Forgery: Server-Side Request Forgery (SSRF) flaws can occur when an API is fetching a remote resource without validating the user-supplied URI.」
  - https://www.rfc-editor.org/rfc/rfc9457.html （2026-10-30）引用：「This document defines a "problem detail" to carry machine-readable details of errors in HTTP response content」
  - https://docs.python.org/3/library/ipaddress.html （2026-10-30）
  - https://docs.python.org/3/library/sqlite3.html （2026-10-30）
- 未検証：なし

## 記録（指揮役が保存するときに書き足す）
- 関門：G1
- 判定した役：reviewer
- 回：r1
- 対象：CLAUDE.md、contracts/dependencies.md、contracts/openapi.yaml、docs/adr/001-python-stdlib-sqlite-architecture.md、docs/adr/features/001-personal-learning-loop.md（`197baf6...061f5f9`）
- 日付：2026-10-30
- 指揮役の注記：報告の受け取り直後に reviewer のセッションが 429（使用量の上限）で終了したが、報告は完了した状態で届いている。
