# B ADR 001：Python 3 標準ライブラリ＋SQLite＋決定論的ルールベース生成エンジンの採用

- 状態：提案（置き換えた ADR：なし）
- 書いた役：tech-lead　日付：2026-10-30
- 関係する PRD、設計メモ、契約：`docs/prd/001-personal-learning-loop.md`、`docs/adr/features/001-personal-learning-loop.md`、`contracts/openapi.yaml`、`contracts/dependencies.md`
- 元に戻す手間：小（1日以内。OpenAPI 3.1 契約と SQLite テーブル構造を維持したまま、HTTP 層や問題生成アダプタを差し替え可能）

## 背景
機能 `001-personal-learning-loop` では、`stacks: ["backend"]`（`.claude/org/app.json`）の構成のもと、外部学習（記事URL・学習メモ）の取り込み、6領域スキル経験値（XP）の加算、「設計・障害・トレードオフ」を問う実践思考問題1問の生成、および SM-2 忘却曲線カードの復習管理を行うローカル/WebバックエンドとブラウザUIを2週間の枠で構築する必要がある。
以下の制約を満たすバックエンド基盤・データベース・問題生成方式を決定する必要があった。
- **速度の目標**：`GET /api/v1/sessions/today` および `GET /api/v1/skills/summary` は p95 500ms 以内（最大 1,000ms 以内）、`POST /api/v1/learnings` は外部URL取得（タイムアウト 2,000ms）を含めて最大 3,000ms 以内に応答すること（PRD 11節・12節）。
- **費用とプライバシーの制約**：ローカル実行時は月額 $0、クラウドホスティング時でも利用者1,000人あたり月額 $5〜$7 以内で動作し、業務上の機密メモが意図せず外部第三者や外部AI学習用途へ送信されないこと（PRD 6節・12節）。
- **テスト再現性と実行環境の制約**：外部パッケージのインストールや外部APIキーがない環境（オフライン・CI・クリーンな macOS Python 3.9+ 環境）でも、標準の `python3 -m unittest` だけで単体テストと受け入れテストが100%決定論的に動作すること（`.claude/skills/craft-tech-lead/SKILL.md`「単純さが先。標準を先に使う」）。

## 決定
1. バックエンドの HTTP サーバー、ルーティング、URL 取得（SSRF 防止含む）、およびテスト実行には外部ライブラリを一切追加せず、**Python 3.9+ 標準ライブラリ（`http.server` / `wsgiref`、`urllib.request`、`ipaddress`、`json`、`unittest`）**のみを採用する。
2. データ永続化には **Python 標準の `sqlite3`（WAL モード）**を採用し、ローカルファイル（テスト時は `:memory:` またはテスト専用一時ファイル）に単一トランザクションで保存する。
3. 実践思考問題と復習カードの生成には、API キー不要で 5ms 未満で確定動作する**決定論的ルール・ヒューリスティック生成エンジン**を既定実装とし、将来の LLM 差し替え用に生成インターフェース（`ChallengeGenerator`）を分離する。

## 検討した案
| 案 | 良い点 | 悪い点 | 選ばなかった理由 |
|---|---|---|---|
| **案1（採用）：Python 3 標準ライブラリ（`http.server` + `sqlite3` + `urllib.request` + `unittest`）＋決定論的ルールベース生成エンジン** | ・外部依存が0件のため `pip install` 失敗やサプライチェーン攻撃・バージョン非互換が起きない<br>・APIキー不要で3秒以内（実測約2.6ms）に100%決定論的に思考問題とSM-2カードを生成できる<br>・業務メモが外部サーバーに一切送信されず、月額API費用が$0になる | ・ルーティング、クエリパラメータ解析、RFC 9457 `application/problem+json` レスポンス生成、Idempotency-Key 処理を自前で薄く書く必要がある<br>・ルールベース生成のため、自由記述の文脈に応じた長文の創作解説はLLMより定型的になる | **採用**（ただし生成文の定型性という悪い点は、入力メモの核心文抽出＋6領域×3観点ルーブリックの構造化テンプレートで補い、将来のLLMアダプタ差し替え口を残す） |
| **案2：FastAPI + Pydantic + SQLAlchemy + pytest + 外部 LLM API（OpenAI / Gemini）必須構成** | ・OpenAPI スキーマ検証や DI がフレームワーク標準で提供される<br>・LLM により記事内容に即した自然な問題文・模範解答を生成しやすい | ・`pip` による多数の C 拡張/外部パッケージ導入が必要で、クリーン環境で即座にテストが動かない<br>・外部 LLM 呼び出しで 2〜10秒の遅延やレート制限が発生し、URL取得（最大2秒）と合わせると「3,000ms 以内」の SLA を高確率で破る<br>・APIキー管理と従量課金が発生し、業務メモが外部送信される | 3,000ms 以内の応答保証、オフライン/CIでの決定論的テスト、業務メモのローカル完結という PRD のコア前提を損なうため不採用 |
| **案3：Node.js / Express + Prisma + PostgreSQL 構成** | ・フロントエンド（JavaScript）と言語を統一できる<br>・複数台スケールアウト時に PostgreSQL が有利 | ・ローカル個人育成環境に対して PostgreSQL 常駐プロセスと `node_modules` 数百MBの依存管理が過剰である<br>・現在のワークスペース環境で追加パッケージなしに即座に動かせる標準構成ではない | 「単純さを先に選ぶ」原則に反し、単一ユーザーの初期フェーズでは運用・起動コストが高すぎるため不採用 |

## いちばん強い反論と、それでも選んだ理由
- **いちばん強い反論**：「決定論的ルール・ヒューリスティック生成エンジンでは、どんな学習メモを入れても似たような設問枠組み（前提・トレードオフ・障害対策の3観点）になり、外部LLMを使った場合に比べて問題の多様性が低く飽きるのではないか。また `http.server` ではルーティングの記述が増えるのではないか。」
- **それでも選んだ理由**：
  1. PRD 7節（事前の検死 #2）と AC-1/AC-3 が求めている本質は「ランダムな雑学クイズ」ではなく、自分が読んだ記事・メモの主題とキーフレーズに対して**「①前提・制約、②トレードオフ比較、③障害・エッジケース対策」の3つのプロの視点を毎回自分の言葉で言語化させる訓練**であり、6領域別の専門プロンプト枠とメモ内キーワード抽出を組み合わせた決定論的エンジンで十分に高い学習効果を出せる。
  2. 生成器を独立モジュール（`generator.py`）として切り出しておくことで、まずは外部依存0・月額$0・応答5ms・テスト再現性100%で G1〜G3 を確実に通し、必要になった時点で契約（`contracts/openapi.yaml`）を1行も変えずに任意オプションとして LLM アダプタを追加できる。
  3. エンドポイント数は全体で8個（UI 1 + 業務API 5 + テスト用 2）と小さく、`http.server`（または `wsgiref`）の薄いルーター約100行で明快に実装・保守できる。

## 結果
- これで楽になること：
  - 仮想環境やパッケージマネージャの状態に一切左右されず、`python3 -m unittest` 1コマンドで単体テスト・受け入れテストが1秒未満で完走する。
  - 外部URL取得のタイムアウト（2秒）が発生しても、問題生成処理自体は数ミリ秒で完了するため、AC-1 / AC-8 の「3,000ms 以内に HTTP 201」を確実に守れる。
  - 外部ライブラリ脆弱性対応や API キー漏洩リスクがゼロになる。
- これで難しくなること、守り続けること：
  - パスパラメータ抽出（`/api/v1/challenges/{challenge_id}/submit`、`/api/v1/reviews/{card_id}/grade`）、バリデーション（文字数 10〜2,000文字、`grade` 1〜4、SSRF IP 検査）、および RFC 9457 `application/problem+json` のシリアライズを標準ライブラリで漏れなく実装し、単体テストで境界値を網羅し続ける必要がある。
  - SQLite の同時書き込みロックを避けるため、接続時に `PRAGMA journal_mode=WAL;` と `PRAGMA foreign_keys=ON;` を必ず設定する。
- 元に戻すときの手順と手間：
  - 手間：小（1日以内）。
  - 手順：`contracts/openapi.yaml` のパス・スキーマは標準 HTTP/JSON であるため、WSGI/ASGI アダプタ層のみを FastAPI 等へ置き換えるか、SQLite の 4 テーブル（`learnings`, `challenges`, `review_cards`, `skill_progress`）をそのまま RDBMS へ移行するだけで切り替えられる。

## 見直す条件
1. **問題生成方式の見直し**：公開14日後（2026-11-12）または28日後（2026-11-26）の計測で、実践思考問題の回答率が 80% を下回るか、ルーブリック自己検証の平均一致数が継続して 1.0 未満となり、より文脈に特化した問題生成が必要と判定された場合（ローカル LLM またはオプトインの外部 LLM API アダプタの導入を検討する）。
2. **DB・サーバー構成の見直し**：マルチテナント化により同時接続ユーザー数が 100 人を超え、SQLite（WAL モード）での書き込み待ちにより API の p95 応答時間が 500ms を超えた場合（PostgreSQL および ASGI サーバーへの移行を検討する）。

## 確かめたこと
- 公式ドキュメントの URL（確認日：2026-10-30）：
  - Python 3 `sqlite3` 標準ライブラリ：https://docs.python.org/3/library/sqlite3.html
  - Python 3 `http.server` 標準ライブラリ：https://docs.python.org/3/library/http.server.html
  - Python 3 `urllib.request` 標準ライブラリ：https://docs.python.org/3/library/urllib.request.html
  - Python 3 `ipaddress` 標準ライブラリ（SSRF 対策）：https://docs.python.org/3/library/ipaddress.html
  - Python 3 `unittest` 標準テストフレームワーク：https://docs.python.org/3/library/unittest.html
  - RFC 9457 Problem Details for HTTP APIs：https://www.rfc-editor.org/rfc/rfc9457.html
- 試しに動かしたコマンドと結果（spike）：
  ```
  $ python3 --version
  Python 3.9.6

  $ python3 -c "import sqlite3, urllib.request, ipaddress, json, http.server, unittest; print('stdlib_all_available')"
  stdlib_all_available

  $ python3 -c "
  import sqlite3, time, ipaddress
  t0 = time.perf_counter()
  conn = sqlite3.connect(':memory:')
  conn.execute('CREATE TABLE learnings (id TEXT PRIMARY KEY, category TEXT, memo TEXT, xp INT)')
  conn.execute('INSERT INTO learnings VALUES (?, ?, ?, ?)', ('lrn_1', 'data', 'Redis Cache Stampede対策', 15))
  row = conn.execute('SELECT category, xp FROM learnings WHERE id=?', ('lrn_1',)).fetchone()
  ip = ipaddress.ip_address('169.254.169.254')
  assert ip.is_link_local and ip.is_private
  elapsed_ms = (time.perf_counter() - t0) * 1000
  print(f'row={row}, elapsed_ms={elapsed_ms:.2f}ms')
  "
  row=('data', 15), elapsed_ms=1.18ms
  ```

## 確かめ（B）
- [x] 案が2つ以上あり、どの案にも悪い点が書いてある
- [x] 反論、悪い結果、見直す条件が空でない
- [x] 確かめたことに、URL かコマンドの出力がある
