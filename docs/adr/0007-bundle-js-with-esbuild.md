# ADR 0007：JS は esbuild（devDependency、版を固定）で 1 ファイルにまとめて配る。sw.js は別のまま

- 状態：承認（2026-11-08、委任。指揮役の委任指示書による。G1 reviewer r3 の指摘を直した後、reviewer r4 で確かめる前提。2026-11-06 は提案）。ADR 0001 の「まとめずに配る」「JS 15 ファイルまで」と見直しの線 27,000 を置き換える
- 書いた役：tech-lead　日付：2026-11-06
- 関係する PRD、設計メモ、契約：docs/prd/001-daily-learning.md（r13。12、AC-15、AC-28）、docs/adr/0001（見直しの記録の (iii)）、docs/adr/0003、docs/adr/0005、contracts/budgets.md の 1 と 3、contracts/service-worker.md の 3、contracts/dependencies.md、docs/adr/features/001-daily-learning.md
- 元に戻す手間：小〜中（build.mjs のまとめる処理を外し、modulepreload と FILES を戻す。1 日。ソースの ES modules はそのまま残すので、コードの書き直しは要らない）

## 背景
- ADR 0001 は JS をまとめずに配り、15 ファイルまで、見直しの線 27,000（2026-11-05 に 1 回だけ引き直し、2 度目を禁じた）と決めた。超えるときは (iii)「線を引き直さず、まとめる道具を新しい ADR で決める」。
- PRD r13（FB 2 回目）で、問と返し、図の 6 型、ミル、領域ごとの課題集を読む処理、復元と設定が増える。G1 tech-lead r3 の 8 の見込みは、まとめない形で JS 29,800〜32,300（15 ファイルちょうど）、殻 35,300〜38,300 で、殻の枠 32,000 と線 27,000 を両方超える［推測］。今の実測は JS 25,829（13 ファイル）、殻 30,022。
- 制約：本番の依存 0（ADR 0001）、CSP `script-src 'self'` と `require-trusted-types-for 'script'`（ADR 0005）、Safari 17.0 にない機能を使わない（budgets.md の 5）、build({ out, version, tasks }) は同期の関数として test-hooks.md から呼ばれる。

## 決定
- backend/package.json の devDependencies に esbuild 0.28.2（`--save-exact`）を足す。build.mjs が `esbuild.buildSync` で `public/js/main.js` から 1 つの ESM ファイル `dist/js/app.js` を作る。空白だけ縮める（名前は縮めない）。ソースマップは配らない。
- sw.js はまとめない（今のまま写して VERSION と FILES を刻印する）。本番の配布物に入る依存は 0 件のまま（esbuild はビルドの時だけ動き、出力に node_modules の中身が入らないことをビルドが確かめる）。

## ADR 0001 の決まりをどう置き換えるか
| ADR 0001 の決まり | この ADR の後 |
|---|---|
| JS は変換もまとめもせず ES modules のまま配る | ソースは ES modules のまま `backend/public/js/` に書く。配るのは esbuild でまとめた `./js/app.js` 1 つと `./sw.js`。開発中は public/ をそのまま開いても動く（まとめる前と同じ相対 import） |
| 全モジュールの `modulepreload` | index.html の `<script type="module" src="./js/app.js">` 1 つと、`modulepreload` 1 つ（`./js/app.js`）。build.mjs が書き換える |
| JS のファイルは 15 個まで | 配るファイルの上限はなくなる（2 つ）。ソースのモジュールの数の上限もなくす。代わりに「1 モジュールは 1 つの関心」と、class の継承、DI、状態管理のライブラリを作らない決まりは残す |
| 動的な `import()` を使わない | 残す。まとめた 1 ファイルの中に閉じるため。ビルドが出力に `import(` があれば失敗する |
| 見直しの線：JS の gzip 後 27,000 | なくす。代わりに殻の枠（budgets.md の 1。次の回で数字を決め直す）で見る。新しい見直しの線は下の「見直す条件」 |
| build.mjs は写して刻印するだけ。コメントを落とす道具を入れない | build.mjs は「写す、刻印する、JS をまとめる」。コメントは esbuild の `minifyWhitespace` が構文を読んで落とす（ADR 0001 の見直しの記録 2 の「構文を読まずに落とすと壊す」心配は、構文解析器を使うので当たらない） |
| Safari 17.0 にない機能を使わない | 残す。esbuild の `target: ['safari17']` は構文を下げる道具で、ない API は補わない |

## build.mjs の変え方の方針（backend-engineer が作る。tech-lead は書かない）
1. `public/` を出力に写すとき、`public/js/` は写さない（ソースを配らない）。
2. `buildSync({ entryPoints: ['public/js/main.js'], bundle: true, format: 'esm', target: ['safari17'], minifyWhitespace: true, legalComments: 'none', sourcemap: false, metafile: true, write: false, logLevel: 'warning' })` の出力を `dist/js/app.js` に書く。`build()` は同期のままにする（test-hooks.md のビルドの約束を変えない）。
3. 確かめて、違えば BuildError で終了コード 1：
   - metafile の inputs がすべて `public/js/` の下（`node_modules` が 0 件。本番の依存 0 の機械の確かめ）。
   - 出力に `import(`、`eval(`、`new Function`、`innerHTML`、`outerHTML`、`insertAdjacentHTML`、`document.write` が 0 件（ADR 0005）。
   - `dist/js/` のファイルが `app.js` 1 つだけ。index.html の `<script>` と `modulepreload` が `./js/app.js` を 1 回ずつ指す。
   - FILES と出力のフォルダのファイルが一致する（今と同じ）。
4. 今の `MAX_JS_FILES = 15` の検査と、全モジュールの modulepreload の検査は外す。
5. 単体テストは、ソースの各モジュールをそのまま `import` して確かめる（まとめた物は受け入れテストで確かめる）。`FILES` と出力の一致、上の 3 の検査ごとに落ちる見本を 1 つずつ足す。
6. CSP の文字列（budgets.md の 3）は変えない。

## CSP と Trusted Types の下で動くこと（G1 tech-lead r3 の spike。2026-11-06 にこの ADR のために再実行）
- まとめた配布物（`./js/app.js` 1 つ。modulepreload を外し、本番の CSP の meta はそのまま：`default-src 'none'; script-src 'self'; … require-trusted-types-for 'script'; trusted-types kyounoitte-sw`）を Playwright 1.64.1 で開いた。Chromium と WebKit のどちらも `diagnosis.start` → begin を押して `diagnosis.question`、コンソールのエラー 0 件。
- esbuild は ESM のまとめで `eval` も `new Function` も出さない。まとめた出力の grep で `import(`、`eval(`、`new Function`、`innerHTML` は 0 件。

## 検討した案
| 案 | 良い点 | 悪い点 | 選ばなかった理由 |
|---|---|---|---|
| (a) esbuild で 1 ファイル（採用） | 殻が約 26,700〜29,300 で枠 32,000 の中に戻る［推測］。要求が 1 つで、15 ファイルの上限の問題も消える。依存が持ち込むのは自分の OS 用のバイナリだけ（下の確かめたこと）。速い（ビルドは 1 秒未満） | devDependency が 1 件と、lockfile に `@esbuild/*` の optional 依存が 26 件増える。配る物が生成物になり、レビューは配った物でなくソースを読む。esbuild は 0.x で、版の上げで設定が変わることがある。install script（postinstall）を npm 12 が止める | — |
| (b) まとめない ES modules のまま、線と枠を引き直す（ADR 0001 の (a') ） | 道具が 0。配る物と書いた物が同じ | ADR 0001 が 2 度目の線の引き直しを禁じている。殻の枠 32,000 も超えるので、課題集か文言の枠を削るか合計の枠を変える必要。15 ファイルの上限にも着く | 自分で決めた「先送りしない」決まりを破り、枠の取り合いが残る |
| (c) 手で縮める（ADR 0001 の (i)：使われない処理とコメントを消す） | 道具が 0 | 粗い見積もりで −2,654（行頭とブロックのコメント）。増える見込みの +4,000〜+6,500 に足りない。コメントを削るほど、契約を引きに行く手間が増える | 足りない |
| (d) Rollup か Vite | 広く使われ、プラグインが多い | 依存が数十件。Vite は開発サーバーと設定の手間。Rollup は縮めるのに別のプラグイン（terser など）が要る | 必要なのは「まとめて空白を落とす」だけで、esbuild 1 件で足りる |
| (e) TypeScript の tsc だけ | 型の検査が入る | まとめない。依存が増え、ソースを書き直す | 目的（大きさ）を満たさない |

## いちばん強い反論と、それでも選んだ理由
- 反論：ADR 0001 の利点「配る物と書いた物が同じで、レビューと不具合の追跡が簡単」を失う。AI の作り手と判定役は、配った物を読んで確かめられなくなる。しかも esbuild はネイティブのバイナリで、install script を持ち、0.x の道具。サプライチェーンの入口を 1 つ増やしてまで、gzip の後で約 3〜4 KB を縮める価値があるのか。
- それでも選んだ理由：
  - 縮めるのは空白とコメントだけで、名前は残す。配った物でも関数と変数の名前はソースのまま残るので、名前から追える（モジュールの境目のコメントは消える）。レビューはこれまでどおりソースの差分で行い、配った物は受け入れテストが 2 つのエンジンで確かめる。
  - 守る枠は殻 32,000 と合計 150,000 で、(b)(c) ではどちらかを動かすしかない。動かすと課題集か文言の枠が減り、FB 2 回目の中身（選択肢の説明、図）を削ることになる。
  - サプライチェーン：esbuild の依存は自分の OS 用のバイナリ 1 つだけで、他のパッケージを持ち込まない。npm 12 は postinstall を既定で止め、止めたままでもビルドが動いた（下の確かめたこと）。出力に node_modules の中身が入らないことはビルドが metafile で毎回確かめる。版は固定し、`npm ci` だけで入れる。

## 結果
- これで楽になること：殻の枠に余りができる。JS のファイルの数を気にせずモジュールを分けられる（読みやすさのために分けてよい）。modulepreload の一覧の手入れがなくなる。
- これで難しくなること、守り続けること：
  - 配った物の不具合は、ソースの名前から探す。ソースマップは配らない（配ると転送量と FILES が増える。要るならビルドの出力のフォルダの外に置く案を見直しで考える）。
  - esbuild の版を上げるときは、dependencies.md の表と推移的な依存の表を直し、受け入れテストを 2 つのエンジンで流す。
  - Linux の CI（`npm ci` で入る `@esbuild/linux-x64`）で動くかは未確認。CI は Takuma が持つ（.github/）。
  - npm 12 の `install-scripts` の警告は毎回出る。approve はしない（下の dependencies.md の決まり）。
  - 受け入れテストを単独で動かす前に `cd backend && npm ci` が要る（2026-11-08 に足した。G1 reviewer r3 の要修正 5）。受け入れテストの global-setup は backend/scripts/build.mjs を動かし、build.mjs が backend/node_modules の esbuild を読むため。今の build.mjs は node: の組み込みだけを読むので、この ADR の前は要らなかった。
    - ADR 0004 は案 A を「受け入れテストのフォルダの外の依存に頼る」として退けた。ここで生まれる向き（受け入れテスト → build.mjs → backend の devDependency）は、それとは別の向きとして受け入れる。理由：受け入れテストが確かめるのは、配る物を作る build.mjs の出力そのもので、ビルドの道具を受け入れテストのフォルダにもう 1 つ入れると、テストと本番で違う版の esbuild でまとめることがあり得る。テストの道具（@playwright/test、@axe-core/playwright、ajv）は今までどおり受け入れテストのフォルダだけに置く。
    - 分かる文で止める：global-setup（verifier が書く）は、build.mjs の import か esbuild の読み込みに失敗したら、`cd backend && npm ci` を先に実行するよう書いた文を出し、終了コード 1 で止める（contracts/test-hooks.md の実行の環境）。CI の `cd backend && npm ci && npm test` は先に入れるので、この文には当たらない。
    - CLAUDE.md と test-hooks.md の受け入れテストのコマンドは、`cd backend && npm ci` から始める形に直した。
- 元に戻すときの手順と手間：build.mjs のまとめる処理を外し、`public/js/` を写す形と全モジュールの modulepreload に戻し、ADR 0001 の 15 ファイルの検査を戻す。ソースは ES modules のままなので書き直しは要らない。esbuild を devDependencies から外す。1 日。ただし枠を超える問題は戻る。

## 見直す条件
- まとめた `app.js` と `sw.js` の gzip 後の合計が 28,000 バイトを超える、または殻が枠の 95% を超える（contracts/budgets.md の 1 の殻の枠 32,000 の 95% は 30,400）。
- AC-15 の 5 回の最大値が 1,600 ms を超える。
- esbuild の新しい版が 12 か月出ない、セキュリティの勧告が出る、または install script を許さないと動かない版になる。
- まとめた物にだけ出る不具合（ソースを直接開くと出ない）が G3 か公開後に 2 件を超える。
- 型の誤りが原因の不具合が 2 件を超える（ADR 0001 と同じ。esbuild は TypeScript を読めるので、型の検査を足すなら tsc の要否を別に決める）。

## 確かめたこと
- `npm view esbuild@0.28.2 license scripts.postinstall --json` → `"license": "MIT"`、`"scripts.postinstall": "node install.js"`。`npm view esbuild time --json` → `"0.28.2": "2026-08-08T20:00:55.454Z"`、`"modified": "2026-08-08T20:00:55.803Z"`（2026-11-06）。
- スクラッチパッド（`…/scratchpad/g1adr/dep`、node v24.22.1、npm 12.2.1）で、ajv 8.20.0 だけの package.json に `npm install --save-dev --save-exact esbuild@0.28.2` → `added 7 packages, and audited 8 packages`、`found 0 vulnerabilities`、`npm warn install-scripts 1 package had install scripts blocked because they are not covered by allowScripts: esbuild@0.28.2 (postinstall: node install.js)`。lockfile は 32 件（ajv と子 4 件、esbuild 1 件、`@esbuild/*` 26 件、すべて `dev`、`@esbuild/*` は `optional` で os と cpu の指定つき）。node_modules に入った `@esbuild/*` は `darwin-arm64` 1 件だけ。
- install script が止まったままで `npx esbuild --version` → `0.28.2`。`rm -rf node_modules && npm ci` の後も JS の API が動いた（`api 0.28.2`）。`npm ci --omit=dev` → `audited 1 package`、node_modules ができない。
- 今のソースで `buildSync({ entryPoints: ['backend/public/js/main.js'], bundle: true, format: 'esm', target: ['safari17'], minifyWhitespace: true, metafile: true, write: false })` → inputs 12、そのうち node_modules 0、出力 61,076 バイト、gzip 後 16,943、`import(` 0、`eval` と `new Function` 0、`innerHTML` 0。
- CSP の下の動作：上の「CSP と Trusted Types の下で動くこと」（スクラッチパッドの `g1r6/run-b.mjs` を 2026-11-06 に再実行。出力 `chromium bdist state diagnosis.start -> diagnosis.question errors []`、`webkit bdist state diagnosis.start -> diagnosis.question errors []`）。まとめた `app.js` は gzip 後 16,848。
- https://esbuild.github.io/api/#target （target は構文を下げるだけで、API は補わない）、https://esbuild.github.io/api/#minify （`minifyWhitespace` を単独で使える）、https://esbuild.github.io/api/#metafile 。この 3 つの URL は esbuild の公式の API の節の名前で、今回は開いていない（未確認。動作はスクラッチパッドの出力で確かめた）。
- 未確認：Linux（`@esbuild/linux-x64`）と CI での `npm ci` と buildSync。Safari 17 の実機。

## 確かめ（B）
- [x] 案が2つ以上あり、どの案にも悪い点が書いてある
- [x] 反論、悪い結果、見直す条件が空でない
- [x] 確かめたことに、URL かコマンドの出力がある（URL は未確認と書いた）
