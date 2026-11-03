# 契約（contracts/）

このアプリには HTTP の API がありません（ブラウザだけで動く Web アプリ）。契約は「アプリと課題集、保存データ、文言、受け入れテストの間の境目」です。
tech-lead だけが書きます。変えるときは足すだけにし、読み手が知らない値を書く変更は版を上げます（ADR 0002）。

| ファイル | 中身 |
|---|---|
| schemas/tasks.schema.json | 課題集の形（JSON Schema 2020-12） |
| schemas/data.schema.json | 保存データ＝書き出しファイル＝seed の形 |
| schemas/strings.schema.json | 文言ファイルの形と 146 個のキー |
| data.md | 保存の決まり、起動時の行き先の判定順、課題の選び方と段階の規則、統計の数え方 |
| strings.md | 言語の決め方、差し込み、本文の出し方 |
| identifiers.md | data-state、data-testid、data-* の名前と値 |
| test-hooks.md | 受け入れテストのつなぎ口 W-1〜W-16 |
| service-worker.md | Service Worker の決まり |
| budgets.md | 転送量、課題集の長さ、CSP、対応ブラウザと使わない機能、ホーム画面のアイコンと manifest |
| dependencies.md | 使ってよい依存ライブラリ |
| fixtures/ | 見本（valid-、seed- は通る、invalid- は落ちる）。data/v1/ は消さない |
| tools/check-schemas.mjs | スキーマと見本の検査。`cd backend && node ../contracts/tools/check-schemas.mjs` |
