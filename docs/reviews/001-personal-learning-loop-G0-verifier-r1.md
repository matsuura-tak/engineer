PASS

## 指摘
重大度は3つ。重大が1件でもあれば FAIL。
- 重大：この関門を通せない。
- 要修正：この関門は通してよいが、直す。指揮役が同じ作り手に直させる。
- 提案：直すかどうかは作り手に任せる。

- 提案、docs/prd/001-personal-learning-loop.md:146、AC-5 の Then にあるレスポンスフィールド名 `` `weekly_ mastered_count` `` に半角スペースが入っている、根拠：AC-5（docs/prd/001-personal-learning-loop.md:143-148）、直す方向：G1 で `contracts/`（OpenAPI 等）を定義する際、フィールド名をスペースなしの `weekly_mastered_count` に統一し、必要に応じて PRD 側も揃える。
- 提案、docs/prd/001-personal-learning-loop.md:137-142、AC-4 の Then で `grade: 3`（`repetition_count: 2`, `interval_days: 6`）と `grade: 1`（`repetition_count: 0`, `interval_days: 1`）の期待値は具体化されているが、9節4行目にある `grade: 2`（間隔×1.2）および `grade: 4`（SM-2間隔×1.3）の端数処理（切り捨て/四捨五入/最小1日）と `ease_factor` の更新式が AC 本文には明記されていない、根拠：AC-4（docs/prd/001-personal-learning-loop.md:99, 137-142）、直す方向：G1 の `contracts/` および技術設計メモで `grade: 1..4` 全段階の計算式と端数丸め規則を明記する。

## 証拠
- 対象：`e208265...f488d78`（G0 PRD 判定）
  - `[x]` docs/prd/001-personal-learning-loop.md
  - `[x]` docs/prd/product.md
- 観点の表：

### 1. AC-1〜AC-9 のテスト可能性判定表

| AC番号 | 状態区分 | Given / When / Then / 確かめ方 / 効く機会 | Then の具体的な値（件数・状態・フィールド・秒数） | 測れない言葉の有無 | 判定 |
|---|---|---|---|---|---|
| AC-1 (L119-L124) | 通常系（学習登録・生成） | すべて揃っている（O-1） | 3秒（3,000ms）以内、HTTP 201、`learning_id`、`category`（6領域）、`earned_xp: 15`、`challenge`（`question`, `rubric_items` 3件）、`review_card`（`interval_days: 1`, `ease_factor: 2.5`, `repetition_count: 0`, `next_review_at`）、画面表示 `+15 XP` | なし | PASS |
| AC-2 (L125-L130) | 通常系（日次セッション取得・上限） | すべて揃っている（O-3） | 1秒（1,000ms）以内、HTTP 200、`active_challenge` 1件のみ、`due_reviews` 5件（最大上限5件・期限が古い順）、`total_due_count: 7`、`estimated_seconds: 180` 以下、画面表示「本日のセッション（全6問・目安3分）」 | なし | PASS |
| AC-3 (L131-L136) | 通常系（思考問題の回答・採点） | すべて揃っている（O-2） | 1秒（1,000ms）以内、HTTP 200、`status: "completed"`、`earned_xp`（`20 + matched_rubric_count * 10`＝`20`〜`50`）、`total_xp`、`level`、`streak_days`（当日初回 `+1`）、`model_points` | なし | PASS |
| AC-4 (L137-L142) | 通常系（忘却曲線カードの4段階評価） | すべて揃っている（O-1） | 1秒（1,000ms）以内、HTTP 200、`grade: 3` で `repetition_count: 2`, `interval_days: 6`、`grade: 1` で `repetition_count: 0`, `interval_days: 1`、`next_review_at`（現在時刻＋`interval_days` 日後のISO8601）、`earned_xp: 10`、未消化リスト `-1` 件 | なし | PASS |
| AC-5 (L143-L148) | 通常系（6領域スキルツリー表示） | すべて揃っている（O-3） | 1秒（1,000ms）以内、HTTP 200、`categories` 固定6領域（`architecture`, `backend`, `data`, `reliability`, `security`, `trend`）、`label_ja`, `total_xp`, `level`（`floor(total_xp / 100) + 1`）, `xp_to_next_level`（`100 - (total_xp % 100)`）、全体 `total_xp`, `overall_level`, `streak_days`, `weekly_mastered_count` | なし | PASS |
| AC-6 (L149-L154) | 空状態（データ0件・復習0件） | すべて揃っている（当たり前） | HTTP 200、`active_challenge: null`、`due_reviews: []`、`total_due_count: 0`、6領域すべて `total_xp: 0`, `level: 1`、空状態メッセージ文言と登録誘導ボタン表示 | なし | PASS |
| AC-7 (L155-L160) | エラー系（不正入力・境界値） | すべて揃っている（当たり前） | `memo` 9文字以下・2,001文字以上、`grade` 1〜4以外（`0`, `5`）で 1秒（1,000ms）以内に HTTP 400、`error.code: "VALIDATION_ERROR"`、フィールド名入り `error.message`、DB未保存 | なし | PASS |
| AC-8 (L161-L166) | オフライン・外部取得失敗系 | すべて揃っている（当たり前） | URL取得失敗・2秒タイムアウト時に 3秒（3,000ms）以内に HTTP 201（`url_fetch_status: "fallback_used"`）を返し問題とカードを生成。バックエンド通信切断時は入力テキスト保持＋エラーバナー＋「再試行」ボタン表示 | なし | PASS |
| AC-9 (L167-L172) | 権限・セキュリティ系（SSRF拒否・権限拒否） | すべて揃っている（当たり前） | プライベートIP・ローカルホスト・非HTTP(S)スキーム指定時に外部通信0件で HTTP 400（`error.code: "INVALID_URL_SCHEME_OR_HOST"`）。ブラウザの通知・クリップボード権限拒否時もエラー0件で AC-1〜AC-5 が完了 | なし | PASS |

- 状態カバレッジ確認：通常（AC-1〜AC-5）、空（AC-6）、エラー/不正入力（AC-7）、オフライン/外部取得失敗（AC-8）、権限/セキュリティ（AC-9）の5区分すべてが11節に揃っている。

### 2. G1 で `contracts/` に用意してもらう必要がある「テストに要るつなぎ口（Test Seams）」一覧

| # | つなぎ口（Test Seam） | 対象 AC | 必要な理由と `contracts/` に書くべき仕様 |
|---|---|---|---|
| 1 | **DB状態の初期化・シードデータ投入（State Reset & Seed）** | AC-1〜AC-7 | テストごとに独立した状態を即座に作るため、テスト環境専用の初期化・シード投入エンドポイント（例：`POST /api/v1/test/reset`, `POST /api/v1/test/seed`）またはテストごとの独立SQLite DB切り替え方式を定義すること。 |
| 2 | **現在時刻の固定・注入（Clock Injection）** | AC-2, AC-3, AC-4, AC-5 | `sleep` を使わずに復習期限到来判定、次回日時算出、連続日数、直近7日間の `weekly_mastered_count` を決定論的に検証するため、リクエストヘッダ（例：`X-Test-Now: <ISO8601>`）またはテスト用時刻設定APIでサーバー基準時刻を固定できる契約を入れること。 |
| 3 | **外部URL取得のスタブ接続・タイムアウト制御（URL Fetcher Seam）** | AC-1, AC-8, AC-9 | 外部インターネットに依存せず、①正常応答、②2秒超の遅延（タイムアウトによる `url_fetch_status: "fallback_used"`）、③接続失敗（HTTP 500/DNS失敗）を再現するため、かつ AC-9 の SSRF 拒否と両立させるため、テスト環境でモック用URL/ドメインまたはスタブアダプタを注入する仕組みを定義すること。 |
| 4 | **フロントエンド接続先URLと通信切断シミュレーション（Offline / Base URL Seam）** | AC-8, AC-9 | 画面の受け入れテストでバックエンド通信失敗時に入力内容が消えずエラーバナーと「再試行」ボタンが出ることを確かめるため、フロントエンドのAPI接続先切り替えと、フォーム・エラーバナー・再試行ボタンの一意な識別子（`data-testid` / `accessibilityIdentifier`）を定義すること。 |
| 5 | **APIキー不要の決定論的生成モード（Deterministic Generator Seam）** | AC-1, AC-8 | CI やローカル検証環境で外部LLMのAPIキーや通信がなくても 3,000ms 以内に確定した構造（`question` と `rubric_items` 3件）を返すルールベース生成モードをデフォルトとして契約に明記すること。 |

- 読んだファイル：
  - `.claude/agents/verifier.md`
  - `.claude/skills/craft-verifier/SKILL.md`
  - `docs/org/gates.md`
  - `docs/templates/review-report.md`
  - `.claude/org/app.json`
  - `docs/prd/product.md`
  - `docs/prd/001-personal-learning-loop.md`
- 実行したコマンドと結果：
  - `git diff --name-only e208265...f488d78` → 終了コード 0（出力：`docs/prd/001-personal-learning-loop.md`, `docs/prd/product.md`）
  - `grep -nE '^- AC-[0-9]+|Given：|When：|Then：|確かめ方：|効く機会：' docs/prd/001-personal-learning-loop.md` → 終了コード 0（AC-1〜AC-9 の全9件それぞれに Given / When / Then / 確かめ方 / 効く機会 の5項目すべてが存在することを確認、計54行ヒット）
  - `grep -nE '適切に|すばやく|わかりやすく|スムーズに|簡単に|高速に|十分に|なるべく|適宜|よしなに' docs/prd/001-personal-learning-loop.md` → 終了コード 0（該当 0件）
- 開いた URL と確認した日付：なし（G0 の URL 開披確認は tech-lead の担当）
- 未検証：なし

## 記録（指揮役が保存するときに書き足す）
- 関門：G0
- 判定した役：verifier
- 回：r1
- 対象：`docs/prd/001-personal-learning-loop.md`、`docs/prd/product.md`（`e208265...f488d78`）
- 日付：2026-10-29
