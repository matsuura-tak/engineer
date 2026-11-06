# ADR 0004：受け入れテストは Playwright の Chromium と WebKit で、設定を受け入れテストのフォルダの中だけに置く

- 状態：提案（G1 で reviewer が判定する）
- 書いた役：tech-lead　日付：2026-10-30
- 関係する PRD、設計メモ、契約：docs/prd/001-daily-learning.md（11 の冒頭、AC-1〜AC-32）、docs/adr/features/001-daily-learning.md、contracts/test-hooks.md、contracts/dependencies.md
- 元に戻す手間：大（受け入れテストをすべて書き直す）

## 背景
- PRD の確かめ方は、ブラウザの自動テスト（オフライン、時刻の固定、UA の偽装、SW、ダウンロード、ファイルの選択、CDP の制限、axe-core）を前提にしている。対応ブラウザは Safari と Chrome。
- 組織の決まり：受け入れテストは受け入れテストのフォルダの中の設定だけで動く。verifier が書き、作り手は触らない。依存は contracts/dependencies.md の表だけ。
- HTTP の API がないので、spectral と oasdiff は使えない（指揮役の裁定 E2：JSON Schema の検査と見本のテストで代える）。

## 決定
- `@playwright/test` 1.64.1 で、projects は chromium と webkit。設定は `backend/tests/acceptance/playwright.config.mjs`。コマンドは `cd backend/tests/acceptance && npm ci && npx playwright install chromium webkit && npx playwright test`（2026-10-31 に直した。前の形 `cd backend && npx playwright test -c tests/acceptance` は、backend/ に @playwright/test がないと動かない）。
- 依存の置き場所（2026-10-31、tech-lead G2 r1 の未解決 (1) で B に決めた）：@playwright/test、@axe-core/playwright、ajv は backend/tests/acceptance/package.json と package-lock.json に置き、verifier が持つ。backend/package.json には ajv だけを入れる（check:contracts と単体テストのため。ADR 0001）。@playwright/test を 2 つの package.json に入れない。表は contracts/dependencies.md の「入る package.json」の列。
- テスト用の静的サーバーは、verifier が node の組み込みだけで書き、GitHub Pages と同じパス（/engineer/）とヘッダーを返す（test-hooks.md）。
- 監査は `@axe-core/playwright` 4.14.0。課題集、書き出し、seed、文言ファイルの検査は `ajv` 8.20.0（テストと単体テストの中だけ）。
- 契約の検査は `contracts/tools/check-schemas.mjs`（ajv で 3 つのスキーマをメタスキーマで検査し、見本の合否を確かめる）。backend の `npm test` の最初に走る（ADR 0001 の scripts）。

## 検討した案
| 案 | 良い点 | 悪い点 | 選ばなかった理由 |
|---|---|---|---|
| (a) Playwright の Chromium と WebKit（採用） | PRD の確かめ方がすべて API にある（clock、setOffline、fromServiceWorker、addInitScript、CDP）。WebKit で Safari に近い挙動を見られる | WebKit は Safari 17 そのものではない（最新の WebKit のビルド） | — |
| (b) Playwright の Chromium だけ | 速い。CI が軽い | Safari 固有の挙動（SW、ダウンロード、Trusted Types の有無）を見逃す | 主な利用者は iPhone の Safari |
| (c) WebdriverIO と safaridriver で本物の Safari | Safari そのもの | macOS の実行環境が要り、時刻の固定、オフライン、SW の応答の見分けが難しい | 確かめ方の半分が書けない。本物の Safari は G4 の実機で見る |
| (d) 静的サーバーに既存のパッケージ（serve、http-server） | 書く量が少ない | 依存が増え、Cache-Control と gzip を GitHub Pages に合わせにくい | ヘッダーを合わせることが AC-28 の要（G1 r1 の spike 2） |
| (e) スキーマの検査を ajv でなく手書きだけにする | 依存が 1 つ減る | 手書きの検査が正しいかを確かめる基準がない | 本番の手書きの検査を ajv と突き合わせることで、両方を守る |
| 置き場所 A：3 件とも backend/package.json に置く | lock が 1 つ。`cd backend && npm ci` だけで全部入る | 受け入れテストのフォルダの外の依存に頼る（「フォルダの中の設定だけで動く」を依存で満たさない）。backend-engineer の変更で Playwright の版が動く。backend/ がない間は赤も動かせない | 受け入れテストを作り手から切り離せない |
| 置き場所 B：受け入れテストのフォルダに置く（採用） | 依存と lock までフォルダの中で閉じる。verifier が道具の版を持つ。backend/ がなくても動く | lock が 2 つになり、ajv が 2 か所に入る（版は表で同じに固定）。`npm ci` が 2 回要る | — |
| 置き場所 C：両方に @playwright/test を入れる | どちらのフォルダからでも動く | 2 つのコピーができ、版がずれると Playwright が「2 つのコピー」のエラーを出す（verifier の報告。tech-lead は再現していない） | 得るものがなく危険だけが増える |

## いちばん強い反論と、それでも選んだ理由
- 反論：Playwright の WebKit で通っても、iOS の Safari 17 で動く保証はない。特に Blob の書き出し、ホーム画面の Web アプリ、7 日の消去は実機でしか分からない。
- それでも選んだ理由：使わない機能の一覧（budgets.md の 5）で Safari 17 との差を減らし、実機の 3 項目は G0 の承認で G4 に回してある（docs/approvals/001-daily-learning-G0.md）。自動テストは毎回、実機は版ごとに 1 回、と役を分ける。

## 結果
- 楽になること：PRD の 32 件すべてを 2 つのエンジンで自動で確かめられる。G3 の証拠（出力、スクリーンショット、axe の JSON）が同じ道具から出る。
- 難しくなること、守り続けること：ブラウザのバイナリ（`npx playwright install chromium webkit`）を CI と手元に入れる。lock が 2 つ（backend/ と backend/tests/acceptance/）あり、ajv の版を 2 か所で同じに保つ。Playwright の版を上げるときは、clock と SW の挙動を確かめ直す。
- 元に戻すとき：別の道具に移るなら、つなぎ口（test-hooks.md）はそのままで、テストのコードだけを書き直す。5 日以上。

## 見直す条件
- G4 の実機で、WebKit の受け入れテストが通ったのに Safari で落ちる項目が 1 件でも出た。
- @playwright/test か @axe-core/playwright が 12 か月更新されない。
- サーバーを持ち、HTTP の API ができた（そのときは OpenAPI、spectral、oasdiff に戻す）。

## 確かめたこと
- 2026-10-30、スクラッチパッドの仮の backend/tests/acceptance/playwright.config.mjs で `npx playwright test -c tests/acceptance` → `✓ [chromium] … ✓ [webkit] … 2 passed (1.8s)`、`info.config.configFile` が tests/acceptance/playwright.config.mjs。
- Playwright 1.64.1 の型定義に `setFixedTime(`、`fromServiceWorker(): boolean`、`serviceWorkers?: "allow"|"block"`、`setOffline(`、`newCDPSession(` がある（grep の件数 4、1、4、1、2）。`setFixedTime` の説明は「keeps all the timers running」。`serviceWorkers` はテストの設定の `use`（testOptions）でも `browser.newContext()` の引数でも渡せる（https://playwright.dev/docs/service-workers 「set testOptions.serviceWorkers to 'block'」、https://playwright.dev/docs/api/class-browser の newContext「Whether to allow sites to register Service workers. Defaults to 'allow'」。2026-10-30 に開いた）。
- tech-lead G1 r1 の spike 3 と、この ADR の spike：Trusted Types を含む厳しい CSP の下で、@axe-core/playwright 4.14.0 が Chromium 156 と WebKit 27.2 で動き、わざと置いた違反を `label:critical` で見つけた。
- `node contracts/tools/check-schemas.mjs`（ajv 8.20.0）：見本 38 件、期待と違う結果 0 件、終了コード 0（2026-10-30。G1 reviewer r1 の後に firstOpenDate の見本 4 件を足した。最初は 34 件）。わざと壊したスキーマ（`type: 'strin'`）はメタスキーマの検査で false、未知のキーワードは strict で例外。出力は設計メモの 4。Takuma の決定 D3（`app.name` の const の落ちる見本 1 件）と D10（AC-8 の seed 2 件）を足した後は、見本 41 件、期待と違う結果 0 件、終了コード 0（同じ日）。
- https://playwright.dev/docs/browsers（WebKit は最新の WebKit のビルド。G1 r1 で開いた）
- 置き場所 B（2026-10-31、node v24.22.1、npm 12.2.1）：本物の backend/tests/acceptance で `npm ci` → `found 0 vulnerabilities`、`npx playwright test --list` → `Total: 131 tests in 16 files`（tech-lead G2 r1）。スクラッチパッドの backend/ の写し（devDependencies は ajv だけ）で `cd backend && npx --no-install playwright test -c tests/acceptance --list` → `npx canceled due to missing packages`、`npm run test:acceptance -- --list` → 131 本、`npm ci && npm test` → 契約の検査（見本 41 件、0 件の違い）と単体テストが通り、受け入れテストは 131 件とも「build.mjs が見つからない」で落ちた（実装前の赤）。
- 未確認：Linux（CI）で WebKit を動かすための OS のライブラリ。`npx playwright install` は OS のライブラリを入れないので、CI では `npx playwright install-deps chromium webkit`（sudo）か `--with-deps` が要るかもしれない。CI の workflow（.github/。Takuma）で決める。

## 確かめ（B）
- [x] 案が2つ以上あり、どの案にも悪い点が書いてある
- [x] 反論、悪い結果、見直す条件が空でない
- [x] 確かめたことに、URL かコマンドの出力がある
