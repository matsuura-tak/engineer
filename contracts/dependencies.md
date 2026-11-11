# 使ってよい依存ライブラリ

ここに書いたライブラリだけを使います。ここにないライブラリは足しません（要るときは報告に書き、tech-lead が判断して追加します）。
足すときは、公式のページで存在と保守の状況を確かめ、決めた理由を書きます。元に戻しにくいものは docs/adr/ にも残します。
reviewer は G2 で、差分の依存がこの表にあるかを確かめます。

## 方針（`001-personal-learning-loop`）
- **外部サードパーティ依存ライブラリ：0件（追加なし）**。
- 「単純さを先に選ぶ。標準フレームワークで済むなら外部ライブラリを入れない」（`.claude/agents/tech-lead.md`）および `docs/adr/001-python-stdlib-sqlite-architecture.md` に従い、バックエンド・DB・URL取得・テストはすべて **Python 3.9+ 標準ライブラリ**のみで構成する。ブラウザUIも外部 JS フレームワークや CDN を読み込まず、標準 Web API（Vanilla JS / HTML5 / CSS3）のみで完結させる。

| ライブラリ | 領域（ios / backend） | 何に使うか | 選んだ理由 | 固定した版 | ライセンス | 最後の更新日 | Swift 6 と対応 OS | Apple の「よく使われる SDK」の一覧に載るか | プライバシーマニフェスト | 代わりの標準フレームワーク | 外す手間 | 追加した日と ADR |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| なし（Python 3 標準ライブラリのみ：`http.server`, `sqlite3`, `urllib.request`, `ipaddress`, `json`, `unittest`） | backend | HTTP API配信、SQLite永続化、SSRF防止付き外部URL取得、単体・受け入れテスト実行 | 外部パッケージへの依存を0件に保つことで、オフラインやクリーン環境でも `python3` のみで100%確実に動作し、サプライチェーンリスクと保守コストをゼロにするため | Python 3.9.6（内蔵 SQLite 3.54.0） | PSF License Version 2 | 2026-10-30（OS標準同梱） | 対象外（`stacks: ["backend"]`、macOS / Linux Python 3.9+ 対応） | 対象外（OS/言語標準ライブラリ） | 不要（iOS 同梱 SDK ではない） | これ自体が言語標準ライブラリ（https://docs.python.org/3/library/index.html） | 小（OpenAPI 3.1 契約を維持したまま1日以内で差し替え可） | 2026-10-30 / `docs/adr/001-python-stdlib-sqlite-architecture.md` |

## 解決とビルド（動作確認）の出力
外部パッケージマネージャ（`pip` / `npm` / `SwiftPM`）の追加依存は0件であり、ワークスペースの標準 `python3` ランタイムで必要な全標準モジュールが解決・動作することを確認済み。

```
$ python3 --version && python3 -c "import sqlite3, http.server, urllib.request, urllib.parse, ipaddress, json, math, datetime, uuid, unittest; print('All required Python stdlib modules resolved and verified: SQLite version =', sqlite3.sqlite_version)"
Python 3.9.6
All required Python stdlib modules resolved and verified: SQLite version = 3.54.0
```
