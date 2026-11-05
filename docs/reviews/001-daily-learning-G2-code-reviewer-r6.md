# 001-daily-learning G2 コード reviewer r6（r5 の要修正の再判定。cf354ae...a7383da）

PASS

## 指摘
- 要修正：なし。
- 提案（文書。作り手の範囲）：/Users/takumamatsuura/src/engineer/backend/docs/001-daily-learning.md:203 の表「2：1 回の setItem、失敗で画面とメモリを変えない」のテスト欄が「—（main.js は DOM が要るので受け入れテスト）」のまま。今回 main.js の act / commit / issueByAction を切り出して動かす単体テスト tests/unit/main-retry.test.mjs（U-17 の例外、再試行の op）ができたので、欄をそれに更新するとよい。判定には数えない。
- 提案（テストの作り方。直さなくてよい）：/Users/takumamatsuura/src/engineer/backend/tests/unit/main-retry.test.mjs:12-18、21-41。`fnSource` は `\nfunction <名前>(` から最初の `\n}\n` までを切り出し、`new Function` の中で周りの名前（app、today、dayChanged、save、R、canRequestPersist、navigator、showDay、track、askPersist、clearNotice）を差し替えて動かす。本物とずれる恐れを自分で確かめた結果：(1) 3 関数とも main.js に 1 か所ずつで、切り出した本文は `function …(` の行から行頭 `}` まで（act 12 行、commit 8 行、issueByAction 18 行）で本物と同じ。(2) 関数を改名・改行の形を変えると `assert.ok` で、本文の依存が増えると ReferenceError で、どちらも「落ちる」側にずれる（黙って通る側ではない）。(3) ただし、将来 3 関数が Node にも同名のグローバルがあるもの（setTimeout、console など）を使い始めると、差し替えずに Node の本物が使われる。今は該当なし。`new Function` は本番コードには入っていない（`git grep 'new Function\|eval(' -- backend/public` 0 件）ので ADR 0005 / CSP には触れない。
- 提案（verifier。r5 の提案の再掲）：「保存の失敗 → 日付が変わってから `error.storage.retry`」の経路を画面で確かめる受け入れテストはまだない（design-d30 の 183 行目のテストは「知らせのある S3 での申告の保存の失敗」で、`task.next` の再試行は含まない）。単体の harness で代替できているので、足すかは verifier の判断。

## 前回の指摘の追跡（r6）
| 前回（r5）の指摘 | 直った / 直っていない | 証拠 |
|---|---|---|
| 要修正（小）：commit の再試行の入口に op が渡らず、`task.next` の保存失敗 → 日付が変わってからの再試行で `task.dayChanged` が出る（data.md 4 の U-17 の例外に反する） | 直った | main.js:97 `function commit(next, onOk, onFail, op = '')`、:103 `onFail(act(() => commit(next, onOk, onFail, op), op))`、:460 `where === 'next' ? 'task.next' : 'task.exhausted.advance'`。呼び出し元 onNext:464 は `where='next'`、onAdvance:468 は `'advance'`。act:65 は `dayChanged(op)` → decide → route:188 `R.showsDayChanged(opts.op, r.state)`（rules.js:360-363：`op !== 'task.next'`）。新しい単体テスト 3 本が HEAD で合格、BASE の main.js に差し替えると 3 本とも「actual '' / expected 'task.next'（'task.exhausted.advance'）」で落ちることを自分で確かめた（下） |
| 提案：JS gzip が 26,000 の線まで 195 バイト | 変わらず線の内側 | 自分のビルドで JS 13 ファイルの gzip 合計 25,830（作り手の 25,829 と 1 バイト差は sw.js の版の文字列）。線 26,000 まで 170 バイト。判定に数えない。tech-lead の方針待ちのまま |
| 提案：CLAUDE.md の数値のずれ（tech-lead） | 範囲外のまま | この差分は main.js とテストだけ。指揮役から tech-lead へ |
| 提案（既存）：render() 先頭の flushAnswer | 範囲外のまま | 変更なし |
| 提案（verifier）：U-17 の受け入れテスト | 単体で代替 | 上の提案のとおり |

### 見てほしいことへの答え
- 契約どおりか：data.md 4「実装は、操作の入口に操作の名前を渡し、`task.next` のときだけ知らせを描かない形にします」「`task.exhausted.advance` は例外にしません。段階は上がらず（保存しない）、知らせを出します」に対し、再試行の入口 `act(…, op)` に `task.next` / `task.exhausted.advance` が渡り、advance は showsDayChanged が true のまま（知らせを出す）。単体テスト 2 本目で advance の再試行が `dayChangedOps = ['task.exhausted.advance']` になり、route で `showsDayChanged('task.exhausted.advance', …)` は true なので今までどおり知らせが出る。保存し直さないこと（`saved = []`）も同じテストで確認。
- ほかの commit の呼び出し元 9 か所（main.js:233 ガイドを閉じる、280 やり直しの診断、293/304 初回の診断、375 申告、399 評価、492 読み込み、578 設定のガイド）は op を渡さず `''` のまま。data.md 4「S4 の評価、nav、`app.name`、申告も今までどおり知らせを出します」のとおり、`''` は知らせを出す側なので正しい。初回の診断は `app.checkDay` が false（U-15）で act が日付を見ない。
- 新しい誤り：なし。2 回目の失敗の再試行にも同じ op が続く（テスト 3 本目で確認）。引数を足しただけで既存の呼び出し元の挙動は変わらない（既定値 `''`）。

## 証拠
- 対象：cf354ae...a7383da、観点「コード（G2）」r6、機能 001-daily-learning。`git diff --name-only cf354ae...a7383da`（2 ファイル。すべて全文を読んだ：✔）
  - ✔ /Users/takumamatsuura/src/engineer/backend/public/js/main.js（差分 3 行＋act:65-75、dayChanged:84-95、commit:97-104、decide:156-170、route:172-190、retryStartupSave:199-204、issueByAction:444-462、onNext/onAdvance:464-469、commit の呼び出し元 9 か所の前後を読んだ）
  - ✔ /Users/takumamatsuura/src/engineer/backend/tests/unit/main-retry.test.mjs（新規 94 行、全文。エージェント向けの指示のような文はなし）
  - 呼び出し元・規則として読んだ未変更ファイル：backend/public/js/rules.js:360-363（showsDayChanged）、backend/public/js/view-task.js（showError の where：130、251、268、304）、backend/tests/unit/helpers.mjs（BACKEND_DIR）、contracts/data.md 4（「操作で出すとき」「画面を開いたまま日付が変わったとき」の 1〜4 と U-17 の例外、2026-11-05 に開いて上に引用）、docs/reviews/001-daily-learning-G2-code-reviewer-r5.md、docs/templates/review-report.md、backend/docs/001-daily-learning.md:52-56、203。
- 観点の表（この差分で触った AC / 設計項目だけ）：

| 項目 | 実装 | テスト | 自分で動かした結果 |
|---|---|---|---|
| design D-30 / U-17（data.md 4 の例外）、AC-33 の再試行 | main.js commit:97-103、issueByAction:460 | 単体 main-retry.test.mjs 3 本、受け入れ design-d30（14 本）＋ ac33（2 本） | 単体 158/158、受け入れ 16/16、BASE に戻すと新テスト 0/3 |

  範囲外の変更ファイル：なし。
- テストを弱める変更の検査（craft-reviewer 3「コード」2）：
  - A（受け入れテスト、.claude/、.github/、テスト設定）：0 件（exit 1）
  - B（skip / only / fixme の追加）：0 件
  - C（tests の assert 行の増減）：`16 +`、`-` なし
  - D（本番コードのテスト分岐 isRunningTests / #if DEBUG / __test / new Function）：0 件
  - テストの入力値の決め打ち：`git grep "2026-11-03\|2026-11-04\|task.exhausted.advance\|'task.next'" -- backend/public/js` → 日付は 0 件。`'task.next'` / `'task.exhausted.advance'` は contracts/identifiers.md の操作名としての既存の使用（main.js:417、427、437、rules.js:362）と今回の 460 行目だけで、テストの値に合わせた分岐ではない。
  - 依存：`git diff … -- '*.lock' 'package.json'` 0 行。秘密情報の grep 0 件。
- 実行したコマンドと結果（2026-11-05、macOS、node v24.22.1、HEAD a7383da）：
  - `cd backend && node --test 'tests/unit/**/*.test.mjs'` → tests 158 / pass 158 / fail 0 / skipped 0
  - `node --test tests/unit/main-retry.test.mjs` → 3/3 合格
  - BASE の検証：`git archive cf354ae backend contracts` をスクラッチパッド /private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/base に展開し、HEAD の main-retry.test.mjs を置いて実行 → `function commit(next, onOk, onFail)`（BASE）で pass 0 / fail 3。落ち方は 3 本とも `+ actual ''` / `- expected 'task.next'`（2 本目は `'task.exhausted.advance'`）。直した所をそのまま捉えている。
  - 切り出しの照合（node で main.js を読んで同じ切り出しをした）：act 64 行目から 12 行、commit 96 行目から 8 行、issueByAction 444 行目から 18 行。各名前の `\nfunction 名(` は 1 か所。末尾は行頭 `}`。
  - `node scripts/build.mjs --out <スクラッチパッド>/dist --version 2026-11-05.2` → 20 ファイル、exit 0。`node scripts/check-budget.mjs <同>` → 殻 30,024 / 32,000、文言 8,045 / 9,000、アイコンと manifest 2,173 / 4,000、課題集 69,313 / 105,000、合計 109,555 / 150,000、OK、exit 0。JS 13 ファイルの gzip 合計 25,830（自分の node で gzip level 9）。
  - `cd backend/tests/acceptance && npx playwright test tests/design-d30*.spec.mjs tests/ac33*.spec.mjs --reporter=line` → 16 passed (29.7s)、exit 0。
  - `git log cf354ae..a7383da` → a7383da の 1 コミットだけ（backend-engineer。受け入れテストの変更なし）。
  - 作り手の報告との照合（上の確認の後に読んだ）：単体 158、受け入れ 16/16、commit の呼び出し元 9 か所は op 空、JS gzip 25,829（自分は 25,830）、「BASE に戻すと 3 本落ちる」はすべて自分の出力と一致。
- 開いた URL と日付：なし（コードの観点。規則は contracts/data.md 4 を 2026-11-05 に開いて引用）。
- 未検証：なし。

## 記録
- 関門：G2（コード）
- 判定した役：reviewer
- 回：r6（r5 の要修正の再判定）
- 対象：feat/001-daily-learning、cf354ae...a7383da
- 日付：2026-11-05
