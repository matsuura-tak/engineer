# RUNBOOK（運用手順書）— DevForge Backend (`001-personal-learning-loop`)

本手順書は、DevForge バックエンドおよび単一ページ Web UI の起動・デプロイ・ロールバック・バックアップと復元・アラート対処・データ削除手順を定める。本番環境へのデプロイ・データ削除・設定変更は **Takuma のみ** が実施する。

---

## 1. 環境変数の一覧（値はコード・ログ・本書に記載しない）

| 環境変数名 | 必須 / 任意 | 既定値 | 役割と起動時の安全検証ルール |
|---|---|---|---|
| `DEVFORGE_HOST` | 任意 | `127.0.0.1` | 待ち受けホスト。認証なし構成のため、ループバック（`127.0.0.0/8`, `::1`, `localhost`）以外の指定時は非0終了コード（`2`）と標準エラー出力で起動を拒否する |
| `DEVFORGE_PORT` | 任意 | `8000` | 待ち受け TCP ポート（`1`〜`65535` の整数）。範囲外や非整数指定時は非0終了コード（`2`）で起動を拒否する |
| `DEVFORGE_DB_PATH` | 任意 | `~/.devforge/devforge.sqlite3` | SQLite DB ファイルの保存先（揮発検証用 `:memory:` も可）。未指定時は `~/.devforge` ディレクトリを自動作成する。明示指定時に親ディレクトリが存在しない場合は非0終了コード（`2`）で起動を拒否する |
| `APP_ENV` | 任意 | `development` | `production` を指定すると本番モードとなり、`/api/v1/test/*` をすべて HTTP 403（`TEST_SEAM_DISABLED`）で遮断し、`X-Test-Now` および `X-Test-Url-Fetch-Mode` ヘッダを無視する |
| `DEVFORGE_RATE_LIMIT_PER_MINUTE` | 任意 | `600` | 60秒スライディングウィンドウあたりの最大リクエスト数。超過時は HTTP 429 と `Retry-After` ヘッダを返す |

---

## 2. 起動・デプロイとロールバック手順（Takuma 実施）

### 2.1 ローカル / 本番モード起動手順
作業ディレクトリは常にリポジトリルートとする。

```bash
# 1. デプロイ前のオンラインバックアップ取得（既存DBがある場合）
python3 -m backend.migrations backup \
  --db "${DEVFORGE_DB_PATH:-$HOME/.devforge/devforge.sqlite3}" \
  --target "$HOME/.devforge/backups/devforge-$(date -u +%Y%m%dT%H%M%SZ).sqlite3"

# 2. マイグレーション状態の確認と適用
python3 -m backend.migrations up --db "${DEVFORGE_DB_PATH:-$HOME/.devforge/devforge.sqlite3}"

# 3. 本番モードでのサーバー起動
APP_ENV=production DEVFORGE_HOST=127.0.0.1 DEVFORGE_PORT=8000 python3 -m backend.app
```

### 2.2 ロールバック（戻し）手順
新リリースで異常（5xx 発生やデータ不整合）を検知した場合：
1. 稼働中の `python3 -m backend.app` プロセスへ `SIGTERM`（`Ctrl+C` または `kill -TERM <PID>`）を送り、WAL チェックポイント完了を待って停止する。
2. DB スキーマを戻す必要がある場合は、まずバックアップから復元（下記 3.2）するか、初回スキーマを巻き戻す場合は以下を実行する（※ `down` はテーブルを削除するため、必ずバックアップ取得後にのみ行うこと）：
   ```bash
   python3 -m backend.migrations down --db "${DEVFORGE_DB_PATH:-$HOME/.devforge/devforge.sqlite3}"
   ```
3. 前の安定コミット（タグ）をチェックアウトし、`APP_ENV=production python3 -m backend.app` で再起動して `GET http://127.0.0.1:8000/api/v1/skills/summary` が HTTP 200 を返すことを確認する。

---

## 3. バックアップの方式と復元の手順

### 3.1 バックアップ方式
- SQLite WAL モード稼働中でもロック競合や破損を起こさず一貫したスナップショットを取得できる **SQLite Online Backup API（`sqlite3.Connection.backup()`）** を使用する（単純な `cp` コマンドでは `-wal` / `-shm` が不整合になるおそれがあるため、必ず以下のコマンドを使う）。
- 推奨頻度：日次 1 回（cron / launchd）およびデプロイ直前。直近 7 世代を保持する。

```bash
python3 -m backend.migrations backup \
  --db "${DEVFORGE_DB_PATH:-$HOME/.devforge/devforge.sqlite3}" \
  --target "$HOME/.devforge/backups/devforge-backup.sqlite3"
```

### 3.2 復元（リストア）手順
1. `python3 -m backend.app` プロセスを停止する（`SIGTERM`）。
2. 破損・誤操作後の現 DB ファイルを念のため退避したうえで、`restore` コマンドを実行する（内部で `PRAGMA integrity_check;` が自動検証される）：
   ```bash
   python3 -m backend.migrations restore \
     --target "$HOME/.devforge/backups/devforge-backup.sqlite3" \
     --db "${DEVFORGE_DB_PATH:-$HOME/.devforge/devforge.sqlite3}"
   ```
3. サーバーを再起動し、`GET /api/v1/skills/summary` および `GET /api/v1/sessions/today` が HTTP 200 を返すことを確認する。

### 3.3 最後にバックアップ・復元を試した日と結果
- **実施日**：`2026-11-12`
- **検証結果**：レコード投入 → `backup`（`integrity=ok`）→ `purge`（全消去）→ `restore`（`integrity=ok`）→ 元の学習レコード `('lrn_bk1', 'BackupTitle')` が欠損なく復元されることを確認済み。

---

## 4. アラートごとの対処

| アラート / 症状 | 検知条件（構造化 JSON ログ / 指標） | 即時対処手順 |
|---|---|---|
| **Alert-1：API 5xx エラー発生** | JSON ログに `"status_code":500` または `"error_code":"INTERNAL_ERROR"` が 1 件以上出力（PRD 撤退基準3：7日間で非発生率 99.0% 未満時はリリース停止） | 1. 該当 `request_id` と `operation` を特定する。<br>2. ディスク空き容量（`df -h`）と DB ファイル権限（書き込み可否）を確認する。<br>3. `sqlite3 <DB> "PRAGMA integrity_check;"` を実行し、`ok` でなければプロセスを止めて 3.2 の手順で直近バックアップから復元する。 |
| **Alert-2：学習登録レイテンシ超過** | `"operation":"createLearning"` で `"processing_ms"` が `3000` を超えた場合 | 1. 外部ネットワークの名前解決遅延またはディスク I/O 詰まりを確認する。<br>2. `UrlFetcher` の 2.0秒タイムアウトにより通常は `fallback_used` で 2秒台に収まるため、SQLite WAL ファイルの肥大化がないか確認し必要時再起動で `wal_checkpoint(TRUNCATE)` を走らせる。 |
| **Alert-3：SSRF リダイレクト遮断** | JSON ログに `"operation":"ssrf_redirect_blocked"` が出力された場合 | サーバー側で内部 IP への接続はすでに遮断され `fallback_used` で安全に処理されている。入力された短縮 URL や外部記事 URL が悪意ある内部誘導を含んでいないか確認する。 |
| **Alert-4：429 レート制限多発** | `"status_code":429`（`RATE_LIMIT_EXCEEDED`）が連続発生 | 暴走スクリプトやブラウザ拡張による過剰リクエストがないか確認する。正当な一括インポート作業時のみ一時的に `DEVFORGE_RATE_LIMIT_PER_MINUTE` を引き上げる。 |

---

## 5. データ削除と手作業が残る所

1. **サーバー DB 内の全データ削除（自動コマンド）**：
   ```bash
   python3 -m backend.migrations purge --db "${DEVFORGE_DB_PATH:-$HOME/.devforge/devforge.sqlite3}"
   ```
   これにより `learnings`, `challenges`, `review_cards`, `idempotency_keys`, `telemetry_events` の全行が削除され、`skill_progress` と `user_stats` が初期値（0）に戻る。DB ファイル自体を完全消去する場合はプロセス停止後に `rm -f ~/.devforge/devforge.sqlite3*` を実行する。
2. **期限切れキャッシュ・イベントの定期削除**：
   Python から `LearningLoopService.purge_expired_records()` を呼ぶことで、24時間経過した `idempotency_keys` と90日経過した `telemetry_events` を削除できる。
3. **手作業が残る箇所**：
   - **ブラウザの `localStorage` 下書き**：通信切断時に保存された未送信ドラフト（キー名 `devforge_draft_learning_v1`）を端末から即座に消す場合は、ブラウザの開発者ツールまたはサイトデータ消去から該当オリジン（`http://127.0.0.1:8000`）のストレージを削除する。
   - **バックアップファイルと標準出力ログ**：`~/.devforge/backups/` 配下の過去スナップショットファイルおよびリダイレクト保存した標準出力ログファイルがある場合は、`rm -f ~/.devforge/backups/*.sqlite3` 等で手動削除する。

---

## 6. 外部サービスの利用上限と請求アラート設定

- **現在の構成（ローカル実行）**：
  - 使用する外部有料 API・クラウド SaaS・外部 LLM サービスは **0件** であり、月額費用は **$0.00**（課金発生リスクなし）。
  - 外部通信は利用者が `url` 欄に明示入力した公開 Web ページへの単発 HTTP(S) GET（タイムアウト 2.0秒・最大 512KB・リトライ 0回）のみ。
- **将来クラウド VPS 等へ配置する場合の必須設定（Takuma 実施）**：
  - 月額予算上限（Budget Cap）：**$10.00 / 月**（想定実費 $5〜$7 / 月）。
  - 請求アラート閾値：月額 **$5.00（50%）**、**$8.00（80%）**、**$10.00（100%）** の3段階でメール通知を有効化してから稼働させる。
