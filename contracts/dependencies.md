# 使ってよい依存ライブラリ

ここに書いたライブラリだけを使います。ここにないライブラリは足しません（要るときは報告に書き、tech-lead が判断して追加します）。
足すときは、公式のページで存在と保守の状況を確かめ、決めた理由を書きます。元に戻しにくいものは docs/adr/ にも残します。
reviewer は G2 で、差分の依存がこの表にあるかを確かめます。

## 決まり（001-daily-learning から。ADR 0001、ADR 0004）
- 本番の配布物（backend/public/）に入る依存は 0 件です。文言、日付、検査、SW はすべて標準の Web API で書きます。
- 下の表はすべて backend/package.json の `devDependencies` です。版は `^` や `~` を付けず、表の版に固定します。backend/package-lock.json をコミットします（backend-engineer が作る）。
- Node は 24（.tool-versions）。npm は Node に付いてくるものを使います。
- 外す手間の「小」は、package.json の 1 行とそれを使うテストのファイルだけで済むことを指します。

| ライブラリ | 領域 | 固定した版 | ライセンス | 版の公開日 | 本番に入るか | 何に使うか | 選んだ理由と、代わりの標準 | 外す手間 | 追加した日と ADR |
|---|---|---|---|---|---|---|---|---|---|
| @playwright/test | backend（テストだけ） | 1.64.1 | Apache-2.0 | 2026-10-14 | いいえ | 受け入れテスト（Chromium と WebKit）。時刻の固定、オフライン、addInitScript、ダウンロード、CDP | 2 つのエンジンを 1 つの道具で動かせ、PRD の確かめ方（setOffline、clock、fromServiceWorker）がそのまま使える。代わりの標準はない（node:test はブラウザを動かせない） | 大（受け入れテストをすべて書き直す） | 2026-10-30、ADR 0004 |
| @axe-core/playwright | backend（テストだけ） | 4.14.0（axe-core 4.14.0 を使う） | MPL-2.0 | 2026-10-15 | いいえ | AC-27 のアクセシビリティの監査（WCAG 2.1 A / AA のタグ） | PRD が axe-core を名指ししている。本番の CSP（Trusted Types を含む）の下でも 2 つのエンジンで動くことを spike で確かめた。代わりの標準はない | 小 | 2026-10-30、ADR 0004 |
| ajv | backend（テストだけ） | 8.20.0 | MIT | 2026-04-24 | いいえ | contracts/schemas/ の JSON Schema 2020-12 の検査（課題集、書き出し、seed、文言ファイル、見本）。アプリの手書きの検査と同じ合否になるかの単体テスト | JSON Schema 2020-12 と strict の検査がある。`new Function` を使うのでブラウザの CSP の下では動かず、本番には入れない。代わりの標準はない（手書きの検査は本番の側で持つが、それを確かめる基準が要る） | 小 | 2026-10-30、ADR 0004 |

## 解決の記録
- 2026-10-30、スクラッチパッドで `npm install --save-dev --save-exact @playwright/test@1.64.1 @axe-core/playwright@4.14.0 ajv@8.20.0`（node v24.22.1、npm 12.2.1）→ `npm ls --depth=0` で 3 件とも表の版、`found 0 vulnerabilities`。
- 版の公開日とライセンスは `npm view <名前> license time --json` で確かめた。
- 動いた証拠：受け入れテストの形の確認（`npx playwright test -c tests/acceptance` で chromium と webkit の 2 件が通過）、CSP と axe の spike、contracts/tools/check-schemas.mjs（ajv）の出力。どれも docs/adr/features/001-daily-learning.md の 4 と 9。
