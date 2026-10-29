PASS

## 指摘
- 提案、docs/prd/001-personal-learning-loop.md:175、12節「速さ」に目標数値（`GET /api/v1/sessions/today` および `GET /api/v1/skills/summary` が p95 500ms 以内・最大 1,000ms 以内、`POST /api/v1/learnings` が最大 3,000ms 以内）は明記されているが、12節の文面単体では p95 の具体的な測り方（テストでの反復計測条件や `processing_ms` ログの集計方法）が11節・15節に分散している、根拠：.claude/skills/craft-tech-lead/SKILL.md:17（「目標は『数字と測り方』の組」）、直す方向：G1 の技術設計メモ（`docs/adr/features/001-personal-learning-loop.md` の6節）および必要に応じて PRD 12節に「API受け入れテストでの応答時間アサーションおよび `Learning Created` イベントの `processing_ms` で計測する」と明記する。

## 証拠
- 対象：`e208265...f488d78`（G0 PRD 判定。`git diff --name-only e208265...f488d78` の一覧に、読んだ印を付けたもの）
  - [x] `docs/prd/001-personal-learning-loop.md`
  - [x] `docs/prd/product.md`

- 観点の表：

### 1. AC-1〜AC-9 ごとの実現性の表
| AC 番号 | 判定 | 実現方法・技術要素（`stacks: ["backend"]`） | 根拠の URL かコマンド |
|---|---|---|---|
| AC-1 | 新しい API が要る（今の構成で作れる） | `POST /api/v1/learnings` を新設。Python 標準の `sqlite3` で永続化し、キーワード分類＋決定論的ルーブリック生成エンジンで実践思考問題1問（3観点ルーブリック付）と初回 SM-2 カード（`interval_days: 1`, `ease_factor: 2.5`, `repetition_count: 0`）、`earned_xp: 15` を 3,000ms 以内に返す（外部依存なしで実測 2.59ms） | `python3 -c "import sqlite3, urllib.request, ipaddress, json, http.server; print('stdlib ok')"` / https://docs.python.org/3/library/sqlite3.html |
| AC-2 | 新しい API が要る（今の構成で作れる） | `GET /api/v1/sessions/today` を新設。未回答の思考問題1件（`LIMIT 1`）と期限到来カード最大5件（`WHERE next_review_at <= :now ORDER BY next_review_at ASC LIMIT 5`）および全体の期限到来数 `COUNT(*)` を SQLite クエリで取得し 1,000ms 以内に返す | `python3 -c` インメモリ SQLite 検証（2.59ms） / https://docs.python.org/3/library/sqlite3.html |
| AC-3 | 新しい API が要る（今の構成で作れる） | `POST /api/v1/challenges/{challenge_id}/submit` を新設。10〜2,000文字の回答テキストと `matched_rubric_count`（`0`〜`3`）を検証し、`20 + matched_rubric_count * 10` の XP 加算・レベル計算・当日初回完了時の `streak_days` 更新をトランザクションで記録して 1,000ms 以内に返す | https://docs.python.org/3/library/sqlite3.html |
| AC-4 | 新しい API が要る（今の構成で作れる） | `POST /api/v1/reviews/{card_id}/grade` を新設。4段階の `grade`（`1`〜`4`）に基づき SM-2 アルゴリズムで `repetition_count`, `interval_days`, `ease_factor`, `next_review_at` を算出し、`earned_xp: 10` を加算して 1,000ms 以内に返す | `python3 -c` での SM-2 計算検証（`grade=3, rep=1 -> rep=2, interval=6`） |
| AC-5 | 新しい API が要る（今の構成で作れる） | `GET /api/v1/skills/summary` を新設。固定6領域（`architecture`, `backend`, `data`, `reliability`, `security`, `trend`）の `total_xp`, `level`（`floor(total_xp / 100) + 1`）, `xp_to_next_level`（`100 - (total_xp % 100)`）と全体集計を 1,000ms 以内に返す | https://docs.python.org/3/library/math.html |
| AC-6 | 新しい API が要る（今の構成で作れる） | 0件時に `GET /api/v1/sessions/today` が `active_challenge: null, due_reviews: [], total_due_count: 0`、`GET /api/v1/skills/summary` が6領域すべて `total_xp: 0, level: 1` を HTTP 200 で返し、ブラウザUIが空状態文言と登録フォーム誘導ボタンを表示する | https://docs.python.org/3/library/sqlite3.html |
| AC-7 | 新しい API が要る（今の構成で作れる） | リクエストボディ検証で `memo` が9文字以下・2,001文字以上、または `grade` が `1`〜`4` 以外の場合に DB 書き込みを行わず HTTP 400（`error.code: "VALIDATION_ERROR"`）を 1,000ms 以内に返す（G1 契約では RFC 9457 `application/problem+json` と整合させる） | https://www.rfc-editor.org/rfc/rfc9457.html |
| AC-8 | 新しい API が要る（今の構成で作れる） | `urllib.request.urlopen(req, timeout=2.0)`（最大512KB読込）で外部URL取得を行い、`URLError` / `socket.timeout` 発生時は例外を捕捉して `url_fetch_status: "fallback_used"` とし、入力 `title` と `memo` から 3,000ms 以内に HTTP 201 を返す。ブラウザ通信切断時は `fetch` catch 節でフォーム state を保持し再試行ボタンを表示する | https://docs.python.org/3/library/urllib.request.html |
| AC-9 | 新しい API が要る（今の構成で作れる） | `urllib.parse.urlparse` と `ipaddress.ip_address`（および `socket.getaddrinfo` による名前解決後のIP検査）で `http`/`https` 以外のスキーム・`localhost`・プライベートIP・ループバック・リンクローカル（`169.254.169.254` 等）を外部リクエスト発行前に遮断し HTTP 400（`error.code: "INVALID_URL_SCHEME_OR_HOST"`）を返す。ブラウザUIは通知・クリップボード権限 API を一切要求せず標準 DOM 入力のみで完結する | `python3 -c` での `ipaddress` SSRF 検証コマンド出力 / https://docs.python.org/3/library/ipaddress.html |

### 2. 第1部（1〜8）と末尾「G0 の前の確認」の検証表（印を信じず全項目を自力検証）
| # | 確認項目 | 満たす / 満たさない | 証拠（PRD の行・コマンド・Web取得結果） |
|---|---|---|---|
| 1 | 3 にアプリが3件以上と、アプリ以外の代替が1つ以上ある。アプリの行にはすべて URL と、不満の引用（URL つき）か「不満の記録なし」がある | 満たす | docs/prd/001-personal-learning-loop.md:30-37、docs/prd/product.md:26-33。iOSアプリ4件＋Web 1件＋アプリ以外の代替1件があり、全アプリに URL と不満の引用（URL・確認日 2026-10-29 つき）がある。さらに Python スクリプトで全 URL の HTML を取得し、引用文言がページ内に実在することを確認済み |
| 2 | 根拠のすべてに印があり、［推測］だけで支えた結論がない。出典の URL が3つ以上ある | 満たす | docs/prd/001-personal-learning-loop.md:12-216。全根拠に印があり、独立した公開 URL は8件ある |
| 3 | Job ストーリーが1つで、2 の文に画面名や機能名が入っていない | 満たす | docs/prd/001-personal-learning-loop.md:16-17 |
| 4 | 機会と解決案がそれぞれ3つ以上あり、選んだ理由と捨てた理由がある | 満たす | docs/prd/001-personal-learning-loop.md:53-64 |
| 5 | 6 の全行と 7 の5行が埋まり、7 の各行に結び付けた先がある | 満たす | docs/prd/001-personal-learning-loop.md:66-82 |
| 6 | 8 に推奨、いちばん強い反論、作らない場合が書いてある | 満たす | docs/prd/001-personal-learning-loop.md:84-87 |
| 7 | 9 のやることのすべてに Kano の分類と効く機会があり、無関心と逆効果がない | 満たす | docs/prd/001-personal-learning-loop.md:94-106 |
| 8 | 10 のやらないことが1つ以上あり、すべてに理由がある | 満たす | docs/prd/001-personal-learning-loop.md:109-116 |
| 9 | すべての AC に Given、When、Then、確かめ方、効く機会があり、数字のない形容詞がない | 満たす | docs/prd/001-personal-learning-loop.md:118-172 |
| 10 | 13 にガードレールが1つ以上あり、主の指標が見かけの指標でない。全行に基準値の出典と判定日がある | 満たす | docs/prd/001-personal-learning-loop.md:184-189 |
| 11 | 14 の全行に、数値、日付、取る行動、判定する役（pdm 以外）がある | 満たす | docs/prd/001-personal-learning-loop.md:194-198 |
| 12 | 15 のイベントのすべてにプライバシー表示の区分がある | 満たす | docs/prd/001-personal-learning-loop.md:201-208 |

### 3. 審査と権限で気になる点
- **バックグラウンドの実行・通知・OS権限**：プッシュ通知やバックグラウンド定期フェッチは非目標であり、OS権限も一切使用しない（entitlement追加不要）。
- **外部の AI・第三者サーバーに送るデータ**：初期実装はローカル DB 保存＋決定論的ルール・ヒューリスティック生成エンジンで動作するため、ユーザーの学習メモが外部 AI API や第三者サーバーへ送信されることはない。
- **外部 URL 取得に伴う SSRF と著作権配慮**：SSRF 対策として `http`/`https` 以外のスキーム、プライベート IP、ループバック、クラウドメタデータ IP（`169.254.169.254`）を DNS 解決後も含めて遮断し（AC-9）、取得した本文は全文再配布せず個人用問題生成と参照リンク表示のみに限定する。

### 4. 利用者1,000人あたりの月の費用の見積もり
- **ローカル実行時は月額 $0（¥0）、クラウドホスティング時は利用者1,000人あたり月額 $7（約¥1,050：サーバー代 $7/月 ＋ 外部 LLM/API 代 $0/月）**（出典：https://render.com/pricing ）。

- 読んだファイル：
  - `.claude/agents/tech-lead.md`
  - `.claude/skills/craft-tech-lead/SKILL.md`
  - `docs/org/gates.md`
  - `docs/templates/review-report.md`
  - `.claude/org/app.json`
  - `CLAUDE.md`
  - `contracts/dependencies.md`
  - `docs/prd/product.md`
  - `docs/prd/001-personal-learning-loop.md`

- 実行したコマンドと結果：
  - `git diff --name-only e208265...f488d78` → `docs/prd/001-personal-learning-loop.md`, `docs/prd/product.md`
  - `grep -cE '^- AC-[0-9]+：' docs/prd/001-personal-learning-loop.md` → `9`
  - 競合 URL 6件の本文取得と PRD 引用文言の実在確認 → 全引用文言で `[True]` を確認
  - 標準ライブラリ（`sqlite3`, `urllib.request`, `ipaddress`, `json`, `http.server`）でのインメモリ検証 → `Spike verification passed in 2.59 ms`

- 開いた URL と確認した日付：
  - https://apps.apple.com/jp/app/ankimobile-flashcards/id373493387 （2026-10-29）
  - https://apps.apple.com/jp/app/%E3%83%97%E3%83%AD%E5%8D%98-%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0%E5%8D%98%E8%AA%9E%E5%B8%B3/id6470341059 （2026-10-29）
  - https://apps.apple.com/jp/app/%E5%BF%98%E5%8D%B4%E6%9B%B2%E7%B7%9A%E3%81%A7%E6%9A%97%E8%A8%98%E3%82%A2%E3%83%97%E3%83%AA-remindo/id1058865810 （2026-10-29）
  - https://apps.apple.com/jp/app/progate/id1335868128 （2026-10-29）
  - https://roadmap.sh/about （2026-10-29）
  - https://docs.ankiweb.net/manual/background.md （2026-10-29）
  - https://developer.apple.com/help/app-store-connect-analytics/benchmarks/peer-group-benchmarks/ （2026-10-29）
  - https://developer.apple.com/app-store/review/guidelines/ （2026-10-29）
  - https://render.com/pricing （2026-10-29）

- 未検証：なし

## 記録（指揮役が保存するときに書き足す）
- 関門：G0
- 判定した役：tech-lead
- 回：r1
- 対象：`docs/prd/001-personal-learning-loop.md`, `docs/prd/product.md` (`e208265...f488d78`)
- 日付：2026-10-29
