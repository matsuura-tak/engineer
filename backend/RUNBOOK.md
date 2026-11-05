# 運用手順書：今日の一手（kyounoitte）

サーバーのない静的な Web アプリ。配布先は GitHub Pages の https://matsuura-tak.github.io/engineer/（ADR 0001）。データは利用者のブラウザの localStorage にだけあり、運用側が持つ利用者のデータはない。
本番への配布、戻し、Pages と .github/ の設定は Takuma だけが行う。

## 1. 環境変数
- 本番：0 個（秘密も接続情報もない）。
- テストだけ：`KYOUNOITTE_DIST`（受け入れテストに、ビルド済みの配布物のフォルダを渡すとき。値は端末のパス）。`CI`（Playwright の workers と forbidOnly）。

## 2. ビルドと検査（backend/ で実行）
1. `npm ci`
2. `npm test`（契約の検査 → 単体テスト → 受け入れテスト）
3. `node scripts/build.mjs --out dist --version <YYYY-MM-DD.N>`（例 `2026-11-30.1`。同じ日に 2 回配るなら N を上げる。形が違えば終了コード 1）
4. `node scripts/check-budget.mjs dist`（gzip 後の合計 150,000 バイト以下で終了コード 0）
5. 出力の dist/ だけを配る（dist/ はコミットしない）

### アイコンを作り直すとき（scripts/make-icon.mjs）
- 手で 1 回だけ動かす道具。ビルド（build.mjs）、`npm test`、CI では動かさない。配るのは生成物の `public/icon-180.png` だけで、スクリプトは配布物に入らない（build.mjs は public/ だけを写す）。
- 依存は受け入れテストのフォルダ（tests/acceptance/）の Playwright を `createRequire` で借りる。backend/package.json には足さない（contracts/dependencies.md の「入る package.json」は受け入れテストのフォルダ）。そのため、受け入れテストのフォルダの依存が変わると動かなくなることがある。
- 手順：`cd tests/acceptance && npm ci && npx playwright install chromium && cd ../.. && node scripts/make-icon.mjs`。作り直したら `node --test tests/unit/build.test.mjs` で、PNG の署名、IHDR の 180×180、4,000 バイト以下（contracts/budgets.md の 6。2026-11-04 に 10,000 から下げた）を確かめる。
- 作り直すのは、design/001-daily-learning.md の 8 のアイコンの指定が変わったときだけ。

## 3. 配布（Takuma）
- 前提：Pages の配布の仕組み（.github/ のワークフロー）はまだない（2026-11-03 時点で .github/workflows は ios.yml、org-check.yml、org-guard.yml だけ）。作るのは Takuma（設計メモ 3 の図：Actions で build.mjs を動かし Pages に置く）。
- 手順：2 の 1〜4 が通った dist/ を `/engineer/` に置く。版は毎回新しくする（sw.js のキャッシュ名が版から作られるので、版が同じだと利用者に届かない）。
- 置いた後に確かめる：
  - `curl -sI https://matsuura-tak.github.io/engineer/` が 200。
  - `curl -s https://matsuura-tak.github.io/engineer/ | grep -o 'data-build-version="[^"]*"'` が今回の版。
  - `curl -sI https://matsuura-tak.github.io/engineer/manifest.webmanifest` の Content-Type（設計メモ 10 の未確認）。
  - ブラウザで開き、2 秒おきに 3 回以内の再読み込みで新しい版に変わる（AC-28）。
- 公開時に 1 回：Pages の設定で Enforce HTTPS を入れる（設計メモ D7）。

## 4. 戻し（Takuma）
- 前の版の dist/ を、**新しい版番号で**ビルドし直して配る（例：2026-11-30.1 が壊れていたら、前のコミットから 2026-11-30.2 を作る）。同じ版番号のまま古い中身を置くと、SW のキャッシュ名が変わらず、利用者に届かない。
- 保存データの形（formatVersion）を上げた版を戻すときは注意：新しい版で保存されたデータは古いアプリでは「読めない」になる（新しい版のデータを古い版は拒む。data.md の 6）。v1 から版を上げる変更を配る前に、戻し方をノートに書く。
- 課題の ID は戻しでも消さない（identifiers.md の 5）。

## 5. 利用者のデータ（バックアップ、復元、削除）
- バックアップ：運用側にはない。利用者の手段は設定の「書き出し」（JSON ファイル）だけ。
- 復元：利用者が設定の「読み込み」でそのファイルを読み込む（AC-20）。最後に試した日：2026-11-03（受け入れテストの写しで、Chromium と WebKit。実装ノートの 9 の 1）。
- 壊れたデータ：起動時に `error` の画面が出る。利用者は「壊れたデータを保存」（元の文字列のままファイルにする）→「すべて削除」→ 診断からやり直す、の順で進める。問い合わせが来たら、保存したファイルを受け取り、contracts/schemas/data.schema.json で検査して壊れた所を見る。
- 削除：利用者が設定の「すべて削除」で localStorage の `kyounoitte:data` を消す（AC-16）。運用側で手作業の削除はない。書き出したファイルは利用者の端末にあり、アプリからは消せない。GitHub Pages の接続記録（IP）は GitHub が持ち、こちらでは消せない。

## 6. 守る決まり（同じ origin の共有）
- `matsuura-tak.github.io` の他の Pages（Takuma の他のリポジトリ）は、このアプリと同じ localStorage と Cache Storage を見られる。他の Pages に、ルート（`/`）の scope の Service Worker を置かない。他の Pages で `kyounoitte:data` のキーと `kyounoitte-` で始まるキャッシュに触らない（設計メモ 7 の S、ADR 0005）。

## 7. アラートと外部サービス
- アラート：なし（サーバーも計測もない。v1 はイベントを記録しない：PRD 15、D6）。
- 外部サービス：GitHub Pages だけ。月額 0 円。GitHub Pages の上限（公開するサイトは 1 GB まで、帯域は月 100 GB の soft limit。https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits 、2026-11-03 に確認）に対し、配布物は gzip 後で約 108 KB（2026-11-05 の check-budget で 107,715 バイト。課題集を 210 件にした後）。初回の読み込みだけなら月 100 GB は約 93 万回分（SW の取り直しで最大 2 倍の通信になる初回は約 46 万回分）。請求の設定はない（無料）。
- 利用者からの報告で気づく症状と対処：
  | 症状 | まず見る所 | 対処 |
  |---|---|---|
  | 新しい版が届かない | 配った index.html の data-build-version、sw.js の VERSION | 版を上げて配り直す（4） |
  | 開くと error の画面 | 利用者が保存した壊れたデータのファイル | 5 の壊れたデータ |
  | 課題が出ない（task.exhausted） | その領域と段階の課題の数（課題集は 210 件。上級は各領域 7 件） | 初級と中級なら仕様どおり：画面の「次の段階に進む」（`task.exhausted.advance`）か診断のやり直しで続けられる（contracts/data.md の 5 の「S7 の変種」）。上級を出し終えた（allDone）なら、課題集を足した版を配る（AC-28。ID は消さず使い回さない） |
  | 「次の一手に進む」で同じ日に何件も出る、再読み込みで「今日の課題」に戻る | 仕様どおりか（同じ日に出せる数に上限はない。今日の課題があれば再読み込みでもその課題を出す。data.md の 4 の 6-2） | 不具合ではない。統計の「2 件目以降の完了」に数える（data.md の 9） |
  | 「日付が変わったため、直前の操作は無効になりました」が出て、完了や評価が記録されていない | 仕様どおりか（画面を開いたまま日付が変わった後の最初の操作は実行しない。contracts/data.md の 4、design の D-30） | 不具合ではない。前の課題は履歴の「申告なし」の行にあり、書きかけの答えもそこに残る。サポートのページで説明する（pdm） |
  | 設定に「このブラウザは保存の永続化を許可しませんでした」が出る | 設定を開くたびに `navigator.storage.persisted()` の今の値で決まる（保存した値は使わない。data.md の 11）。`persist()` は保存データごとに 1 回だけ求め、求め直さない | 利用者に「ファイルに書き出す」を勧める。Safari はホーム画面に追加すると通りやすい。データが消えた報告が続くなら、求め直す案を tech-lead と pdm に上げる（data.md の 11 の「見直す条件」） |
  | 設定を押してから画面が変わるまでに間がある（最大で約 1 秒） | 仕様どおりか（設定の画面は `persisted()` の答えを待ってから描く。待つ上限は 1,000 ms で、超えたら注意なしで描く。待つ間は前の画面がそのまま使え、その間に別のボタンを押すとそちらが優先されて設定の画面は出ない。data.md の 11） | 1 秒を大きく超えて設定の画面が出ないなら不具合。ブラウザと版を聞き、`navigator.storage.persisted()` が返るかを開発者ツールで確かめて tech-lead に上げる |
