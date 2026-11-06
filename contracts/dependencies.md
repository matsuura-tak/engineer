# 使ってよい依存ライブラリ

ここに書いたライブラリだけを使います。ここにないライブラリは足しません（要るときは報告に書き、tech-lead が判断して追加します）。
足すときは、公式のページで存在と保守の状況を確かめ、決めた理由を書きます。元に戻しにくいものは docs/adr/ にも残します。
reviewer は G2 で、差分の依存がこの表にあるかを確かめます。

## 決まり（001-daily-learning から。ADR 0001、ADR 0004、ADR 0007）
- 本番の配布物（backend/public/）に入る依存は 0 件です。文言、日付、検査、SW はすべて標準の Web API で書きます。
- 下の表はすべて `devDependencies` です。どの package.json に入るかは表の「入る package.json」の列のとおりです（ADR 0004 の「依存の置き場所」。B）。版は `^` や `~` を付けず、表の版に固定します。
  - backend/tests/acceptance/package.json と package-lock.json：verifier が持ち、コミットします（今ある）。
  - backend/package.json と package-lock.json：backend-engineer が作り、コミットします。入れるのは ajv と esbuild だけです（esbuild は 2026-11-06 から。ADR 0007。承認は G1 の reviewer の反論の後）。@playwright/test と @axe-core/playwright は入れません（2 つのコピーを作らないため）。
  - 2 つの ajv の版は同じにします（表の版）。
- Node は 24（.tool-versions）。npm は Node に付いてくるものを使います。
- 外す手間の「小」は、package.json の 1 行とそれを使うテストのファイルだけで済むことを指します。

| ライブラリ | 領域 | 入る package.json | 固定した版 | ライセンス | 版の公開日 | 本番に入るか | 何に使うか | 選んだ理由と、代わりの標準 | 外す手間 | 追加した日と ADR |
|---|---|---|---|---|---|---|---|---|---|---|
| @playwright/test | backend（テストだけ） | backend/tests/acceptance/ だけ | 1.64.1 | Apache-2.0 | 2026-10-14 | いいえ | 受け入れテスト（Chromium と WebKit）。時刻の固定、オフライン、addInitScript、ダウンロード、CDP | 2 つのエンジンを 1 つの道具で動かせ、PRD の確かめ方（setOffline、clock、fromServiceWorker）がそのまま使える。代わりの標準はない（node:test はブラウザを動かせない） | 大（受け入れテストをすべて書き直す） | 2026-10-30、ADR 0004 |
| @axe-core/playwright | backend（テストだけ） | backend/tests/acceptance/ だけ | 4.14.0（axe-core 4.14.0 を使う） | MPL-2.0 | 2026-10-15 | いいえ | AC-27 のアクセシビリティの監査（WCAG 2.1 A / AA のタグ） | PRD が axe-core を名指ししている。本番の CSP（Trusted Types を含む）の下でも 2 つのエンジンで動くことを spike で確かめた。代わりの標準はない | 小 | 2026-10-30、ADR 0004 |
| ajv | backend（テストだけ） | 両方（backend/ は check:contracts と単体テスト、backend/tests/acceptance/ は受け入れテスト） | 8.20.0 | MIT | 2026-04-24 | いいえ | contracts/schemas/ の JSON Schema 2020-12 の検査（課題集、書き出し、seed、文言ファイル、見本）。アプリの手書きの検査と同じ合否になるかの単体テスト | JSON Schema 2020-12 と strict の検査がある。`new Function` を使うのでブラウザの CSP の下では動かず、本番には入れない。代わりの標準はない（手書きの検査は本番の側で持つが、それを確かめる基準が要る） | 小 | 2026-10-30、ADR 0004 |
| esbuild | backend（ビルドだけ） | backend/ だけ | 0.28.2 | MIT | 2026-08-08 | いいえ（ビルドの時だけ動く。出力に node_modules の中身が入らないことを build.mjs が metafile で確かめる：ADR 0007） | build.mjs で `public/js/main.js` から 1 つの ESM `dist/js/app.js` を作り、空白だけ縮める（`buildSync`、`target: ['safari17']`）。sw.js はまとめない | 殻の枠 32,000 に収めるため（ADR 0001 の (iii)、ADR 0007）。依存が持ち込むのは自分の OS 用のバイナリ 1 つだけで、Rollup や Vite より少ない。代わりの標準はない（ブラウザの ES modules はまとめない形で、ADR 0001 の (a) として退けた理由は ADR 0007） | 小〜中（build.mjs のまとめる処理を外し、modulepreload と FILES を戻す。1 日：ADR 0007） | 2026-11-06、ADR 0007 |

## 推移的な依存（表の依存が持ち込むもの。2026-11-03 から）
決めたこと：推移的な依存は 1 件ずつ選ぶものではなく、上の表の親の行で受け入れたものとして扱います。ただし名前、版、ライセンスは下の表に 1 行ずつ書き、lockfile と同じに保ちます。
理由：上の表の列（選んだ理由、代わりの標準、外す手間）は親を選ぶときの判断で、子には当てはまりません（子だけを外すことはできず、外すなら親ごと）。それでも、新しい子や版の変化、ライセンスの変化は lockfile の差分では見落としやすいので、短い表にして reviewer が差分で見られるようにします。
選ばなかった案：(1) 子も上の表に 1 行ずつ足す（列の多くが空になり、選んだ物と持ち込まれた物の区別がつかない）。(2) 書かずに lockfile に任せる（ライセンスや新しい子の追加が表の差分に出ない）。

決まり：
- 版を固定するのは lockfile です。backend/package-lock.json と backend/tests/acceptance/package-lock.json をコミットし、コマンドと CI は `npm ci` だけを使います（`npm install` は上の表を変えるときだけ。親が `^` で子を求めていても、`npm ci` は lockfile の版を入れます）。
- 下の表は、各 lockfile の全パッケージから上の表の行を引いたものと同じにします。違えば、lockfile を変えた差分で下の表も直します（tech-lead が判断して足します）。
- lockfile のすべてのパッケージが `dev: true` であること（本番の依存 0 件）。`本番` の行が 1 つでも出たら止めます。
- ライセンスは MIT、ISC、BSD-2-Clause、BSD-3-Clause、Apache-2.0、MPL-2.0（axe-core。テストだけで使い、配らない）のどれか。ほかのライセンスが出たら tech-lead が判断します。
- 配布物に node_modules は入りません。ビルド（backend/scripts/build.mjs）は backend/public/ を写し（`public/js/` は写さない）、JS は esbuild でまとめた `js/app.js` 1 つにします。public/ の JS は相対の import だけです（CLAUDE.md の「本番の依存ライブラリは 0 件」）。まとめる前に、esbuild の metafile の inputs がすべて `public/js/` の下にあることを build.mjs が確かめます（ADR 0007）。
- install script（2026-11-06 から。ADR 0007）：npm 12 は既定で依存の install script を止め、`npm warn install-scripts … esbuild@0.28.2 (postinstall: node install.js)` と出します。これは止めたままにします（`npm install-scripts approve` も `allowScripts` の設定もしません）。esbuild は postinstall なしで、optional 依存として入る自分の OS 用の `@esbuild/<OS>-<CPU>` のバイナリで動きます（解決の記録の 2026-11-06）。動かない版が出たら ADR 0007 の見直す条件です。

確かめ方（どれも書き込みなし。2 と 3 はビルドの出力のフォルダで）：
1. lockfile の一覧（backend/ と backend/tests/acceptance/ で。`@esbuild/*` は 26 件で 1 行に数える）：`node -e 'const l=require("./package-lock.json");for(const[k,v]of Object.entries(l.packages))if(k)console.log(k.slice(13),v.version,v.license,v.dev?"dev":"本番")'` → 下の表と上の表を合わせたものと同じで、`本番` が 0 行。
2. 配布物に依存がない：`find dist -name node_modules -o -name 'package*.json'` が 0 行。
3. 配布物の JS が外のパッケージを読まない：`grep -rhoE "(import|from) +['\"][^'\"]+['\"]" dist/js dist/sw.js | grep -vE "['\"]\.\.?/"` が 0 行。

| パッケージ | 版（lockfile） | ライセンス | 版の公開日 | 持ち込む親（上の表） | 入る lockfile |
|---|---|---|---|---|---|
| fast-deep-equal | 3.1.3 | MIT | 2020-06-08 | ajv 8.20.0（`^3.1.3`） | 両方 |
| fast-uri | 3.1.9 | BSD-3-Clause | 2026-10-19 | ajv 8.20.0（`^3.0.1`） | 両方 |
| json-schema-traverse | 1.0.0 | MIT | 2020-12-13 | ajv 8.20.0（`^1.0.0`） | 両方 |
| require-from-string | 2.0.2 | MIT | 2018-04-09 | ajv 8.20.0（`^2.0.2`） | 両方 |
| axe-core | 4.14.0 | MPL-2.0 | 2026-10-05 | @axe-core/playwright 4.14.0（`~4.14.0`） | backend/tests/acceptance/ だけ |
| playwright | 1.64.1 | Apache-2.0 | 2026-10-14 | @playwright/test 1.64.1（`1.64.1`） | backend/tests/acceptance/ だけ |
| playwright-core | 1.64.1 | Apache-2.0 | 2026-10-14 | playwright 1.64.1（`1.64.1`） | backend/tests/acceptance/ だけ |
| @esbuild/aix-ppc64、@esbuild/android-arm、@esbuild/android-arm64、@esbuild/android-x64、@esbuild/darwin-arm64、@esbuild/darwin-x64、@esbuild/freebsd-arm64、@esbuild/freebsd-x64、@esbuild/linux-arm、@esbuild/linux-arm64、@esbuild/linux-ia32、@esbuild/linux-loong64、@esbuild/linux-mips64el、@esbuild/linux-ppc64、@esbuild/linux-riscv64、@esbuild/linux-s390x、@esbuild/linux-x64、@esbuild/netbsd-arm64、@esbuild/netbsd-x64、@esbuild/openbsd-arm64、@esbuild/openbsd-x64、@esbuild/openharmony-arm64、@esbuild/sunos-x64、@esbuild/win32-arm64、@esbuild/win32-ia32、@esbuild/win32-x64（26 件。lockfile ではどれも `optional` で `os` と `cpu` の指定つき。node_modules に入るのは手元の OS と CPU の 1 件だけ） | 0.28.2 | MIT | 2026-08-08 | esbuild 0.28.2（optionalDependencies、`0.28.2`） | backend/ だけ |

## 解決の記録
- 2026-10-30、スクラッチパッドで `npm install --save-dev --save-exact @playwright/test@1.64.1 @axe-core/playwright@4.14.0 ajv@8.20.0`（node v24.22.1、npm 12.2.1）→ `npm ls --depth=0` で 3 件とも表の版、`found 0 vulnerabilities`。
- 版の公開日とライセンスは `npm view <名前> license time --json` で確かめた。
- 動いた証拠：受け入れテストの形の確認（2026-10-30 の仮のフォルダで `npx playwright test -c tests/acceptance` を動かし chromium と webkit の 2 件が通過。今のコマンドの形は下の 2026-10-31 の行）、CSP と axe の spike、contracts/tools/check-schemas.mjs（ajv）の出力。どれも docs/adr/features/001-daily-learning.md の 4 と 9。
- 2026-10-31（置き場所 B の確認。スクラッチパッドに backend/ の写しを作り、backend/package.json の devDependencies を ajv 8.20.0 だけにした。node v24.22.1、npm 12.2.1）：`cd backend && npm ci` → `npm ls --depth=0` は `ajv@8.20.0` だけ、`found 0 vulnerabilities`。`npm run check:contracts` → 見本 41 件、期待と違う結果 0 件、終了コード 0。backend/node_modules を外すと `Cannot find module 'ajv/dist/2020'`。`npm run test:acceptance -- --list` → `Total: 131 tests in 16 files`。`npm ci && npm test` → 契約の検査と単体テスト（仮の 1 件）が通り、受け入れテストは 131 件とも「build.mjs が見つからない（実装がまだない）」で落ちた（赤。期待どおり）。
- 2026-11-03（推移的な依存の表。node v24.22.1、npm 12.2.1）：確かめ方の 1 を backend/ で動かし 5 行（ajv と推移的な依存の表の 4 件、すべて dev）、backend/tests/acceptance/ で 10 行（直接の依存の表の 3 件と推移的な依存の表の 7 件、すべて dev）。スクラッチパッドに backend/package.json と package-lock.json を写し、`npm ci` → `found 0 vulnerabilities`、`npm ls --all` は ajv@8.20.0 の下に 4 件。`npm ci --omit=dev` → `audited 1 package`、node_modules ができない、`npm ls --all --omit=dev` は `(empty)`。`npm view ajv@8.20.0 dependencies` と `npm view <名前>@<版> license`、`npm view <名前> time` で親の範囲、ライセンス、公開日を確かめた。`node scripts/build.mjs --out <スクラッチパッド>/dist --version 2026-11-03.1` → 19 ファイル、終了コード 0。確かめ方の 2 と 3 はどちらも 0 行。
- 2026-11-06（esbuild。ADR 0007。node v24.22.1、npm 12.2.1。スクラッチパッドの `g1adr/dep` に ajv 8.20.0 だけの package.json を置いた）：`npm install --save-dev --save-exact esbuild@0.28.2` → `added 7 packages, and audited 8 packages`、`found 0 vulnerabilities`、`npm warn install-scripts 1 package had install scripts blocked because they are not covered by allowScripts: esbuild@0.28.2 (postinstall: node install.js)`。lockfile の全パッケージは 32 件（ajv と推移的な依存の 4 件、esbuild、`@esbuild/*` 26 件）で、すべて `dev`。node_modules の `@esbuild/` は `darwin-arm64` だけ。install script が止まったまま `npx esbuild --version` → `0.28.2`。`rm -rf node_modules && npm ci` の後も JS の API が動いた（`api 0.28.2`）。`npm ci --omit=dev` → `audited 1 package`、node_modules ができない。今の backend/public/js/main.js を `buildSync` でまとめると inputs 12（node_modules 0）、gzip 後 16,943 バイト。`npm view esbuild@0.28.2 license scripts.postinstall --json` → MIT、`node install.js`。`npm view esbuild time --json` → 0.28.2 は 2026-08-08、modified も同じ日。未確認：Linux（`@esbuild/linux-x64`）での `npm ci` と buildSync、CI。backend/package-lock.json への反映は backend-engineer が G2 で行う（tech-lead はリポジトリの package.json を書かない）。
