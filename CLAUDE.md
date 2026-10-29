# アプリの地図

このファイルはこのアプリの地図です。tech-lead（テックリード）が手入れし、100行以内に保ちます。
アプリ名と一言の説明は .claude/org/app.json の app_name と idea にあります。
組織の決まりは .claude/rules/org.md、関門は docs/org/gates.md、進み具合は docs/progress.md を読みます。

## 概要
- 何のアプリか（案：`DevForge`）：外部で学んだ技術記事URLや学習メモ（10〜2,000文字）を3秒以内に「6領域のスキル経験値（XP）」「設計・障害・トレードオフを問う実践思考問題1問」「SM-2忘却曲線カード」へ自動変換し、毎日3分（180秒）以内で消化できるエンジニア育成ローカル/Webアプリ。
- 使う人：日々の業務や技術記事・コードリーディングの知見を自分の血肉として定着させ、設計判断や障害対応で即座に引き出せるプロへ成長したいソフトウェアエンジニア（最初の1人＝Takuma自身）。
- いまの段階：`001-personal-learning-loop` の G1（設計）段階（G0 PRD承認済み、契約 `contracts/openapi.yaml`・技術設計メモ `docs/adr/features/001-personal-learning-loop.md`・ADR `docs/adr/001-python-stdlib-sqlite-architecture.md` 作成済み）。

## ビルド/テストのコマンド
.claude/org/app.json の commands と同じものを書きます。CI は app.json の方を使います。
コマンドを変えたら、app.json の更新を Takuma に頼みます（.claude/ は Takuma だけが直せます）。
受け入れテストは、受け入れテストのフォルダの中の設定だけで動く形にします。
- iOS のビルド：対象外（`.claude/org/app.json` の `stacks` が `["backend"]` のため未設定）
- iOS のテスト：対象外（`.claude/org/app.json` の `stacks` が `["backend"]` のため未設定）
- バックエンドのテスト（`app.json` の `commands.backend_test` 推奨値・Python 3.9.6 標準 `unittest` で動作確認済み）：
  - 単体・結合テスト：`python3 -m unittest discover -s backend/tests/unit -p "test_*.py"`
  - 受け入れテスト（`backend/tests/acceptance` 単体で完結）：`python3 -m unittest discover -s backend/tests/acceptance -t backend/tests/acceptance -p "test_*.py"`
  - 一括実行（`commands.backend_test`）：`python3 -m unittest discover -s backend/tests/unit -p "test_*.py" && python3 -m unittest discover -s backend/tests/acceptance -t backend/tests/acceptance -p "test_*.py"`
- ローカルサーバー起動（実装後）：`python3 -m backend.app`（既定 `http://127.0.0.1:8000`）
  - 未確認（backend/ の実装前のため動かしていない）。作業フォルダはリポジトリの根。受け入れテストもこのコマンドで起動し、`127.0.0.1:8000` に接続する。
  - 環境変数（`contracts/openapi.yaml` の `info.description`、設計メモ 3章 D-2）：
    - `DEVFORGE_HOST`：待ち受けるホスト（既定 `127.0.0.1`）。認証がないため、ループバック（`127.0.0.0/8`、`::1`、`localhost`）以外は起動しない。
    - `DEVFORGE_PORT`：待ち受けるポート（既定 `8000`、1〜65535）。
    - `DEVFORGE_DB_PATH`：SQLite のファイル（既定 `~/.devforge/devforge.sqlite3`。`:memory:` も可だが止めると消える）。指定したパスの親フォルダがなければ起動しない。
    - `APP_ENV=production`：`/api/v1/test/*` は 403、`X-Test-Now` と `X-Test-Url-Fetch-Mode` は無視する。
    - 誤った値のときは、0 でない終了コードと、変数名を含む理由を標準エラーに出す。

## 構成
既定の場所です。app.json の paths を変えたら、この表も同じに直します。

| 場所 | 中身 | 書く役 |
|---|---|---|
| backend/ | Python 3 標準ライブラリ製 HTTP API・SQLite DB・問題生成エンジン・ブラウザUI配信コード、単体テスト（`backend/tests/unit/`）、実装ノート（`backend/docs/`）、運用手順書（`backend/RUNBOOK.md`） | backend-engineer |
| backend/tests/acceptance/ | バックエンドとブラウザUI配信の受け入れテスト（`contracts/openapi.yaml` に準拠） | verifier |
| contracts/ | API 契約（`contracts/openapi.yaml`）、依存ライブラリの許可リスト（`contracts/dependencies.md`） | tech-lead |
| .gitignore、README.md、Makefile など | ルートの設定ファイル | tech-lead |
| design/ | 調査（`<機能名>-research.md`）、画面の仕様、デザイントークン、文言 | designer |
| docs/prd/、docs/support/、metadata/ | PRD（`product.md`, `001-personal-learning-loop.md`）、サポートページ、ストア掲載文 | pdm |
| docs/adr/ | 技術判断の記録（`001-python-stdlib-sqlite-architecture.md`）、機能ごとの技術設計メモ（`docs/adr/features/`） | tech-lead |
| docs/verification/ | テスト計画、検証レポート、証拠（`red.log` 等） | verifier |
| docs/progress.md、docs/reviews/、docs/approvals/ | 進捗、判定の記録、Takuma の承認 | 指揮役 |
| .claude/、.github/ | 組織の定義と CI（キットが管理） | Takuma だけ |

## このアプリだけの決まり
- **ランタイムと依存**：Python 3.9+ 標準ライブラリ（`http.server`, `sqlite3`, `urllib.request`, `ipaddress`, `json`, `unittest`）のみを使用し、外部パッケージ依存は0件とする（`docs/adr/001-python-stdlib-sqlite-architecture.md`）。
- **DB とトランザクション**：SQLite（WAL モード、`foreign_keys=ON`）を使用する。スキーマ変更は「足す、移す、消す」の3段階で行い、同一リリースで列を消さない。テスト時は `DEVFORGE_DB_PATH` 環境変数または `/api/v1/test/reset`・`/api/v1/test/seed` で独立状態を保証する。
- **固定6スキル領域**：`architecture`（設計・アーキテクチャ）、`backend`（バックエンド・API）、`data`（データ・DB）、`reliability`（インフラ・信頼性）、`security`（セキュリティ）、`trend`（技術トレンド）。100 XP ごとにレベルが1上がる（`floor(total_xp / 100) + 1`）。
- **エラー応答**：RFC 9457（`application/problem+json`）に準拠しつつ、PRD AC-7/AC-9 の `error.code` と `error.message` を必ず同梱する。
- **SSRF とタイムアウト保護**：外部URL取得は `http`/`https` のみ許可し、プライベートIP・ループバック・リンクローカル（`169.254.0.0/16`）・`localhost` はリクエスト発行前に HTTP 400（`INVALID_URL_SCHEME_OR_HOST`）で遮断する。公開URLの2秒タイムアウトや取得失敗時はエラーにせず `url_fetch_status: "fallback_used"` でメモ本文から生成する（AC-8/AC-9）。
