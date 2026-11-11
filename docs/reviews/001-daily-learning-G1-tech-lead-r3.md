# 001-daily-learning G1 tech-lead r3（仕様 r11 を今の構成で作れるか。FB 2 回目。a3affdc...8e7b6ca）

PASS

仕様 r11 は、今の構成（ブラウザだけ、本番の依存 0、CSP と Trusted Types、textContent、localStorage 1 キー、Safari 17 以上）で作れます。重大な指摘はありません。
ただし今の分け方のままだと、殻の枠 32,000 と ADR 0001 の JS の線 27,000 を両方超える見込みです。ADR 0001 の決まり（線の引き直しは 2 度目を禁止）に従い、G1 の設計で「まとめる道具」の新しい ADR が要ります。esbuild でまとめる案は、リポジトリの外の spike で、本番の CSP の下、Chromium と WebKit の両方で動きました。
要修正は 3 件です。どれも designer の仕様の直しです。提案は 6 件です。

## 指摘

### 要修正 1：U-24 の決定が仕様に入っていない。復元したときの規則も足りない
- 場所：design/001-daily-learning.md の :37（1 の流れ）、:79（AC-23 の行）、:179（D-53「再読み込みで復元した返しには出ない」）、:239（5.1 の #27「ミル 0 件」）、:626（U-24）
- 問題：
  - docs/approvals/delegation.md:60（2026-11-06）は「復元した返しにもミルを出す（D-53 を 1 行変える）」と決めました。r11 の仕様は逆のままです。
  - このままだと、AC-23 の「`guide.character` の件数と `data-mood` が再読み込み前と同じ」が、仕様どおりの実装で落ちます。前が 1 件、後が 0 件になるためです。
  - 「出す」にしても、規則が 1 行では決まりません。AC-32 の Then では、復元の後に次の問（問 n+1）が未回答で押せる状態で出ていなければなりません。一方、D-46 と AC-45 の「次の問題へで消える」とも両立させる必要があります。
  - 保存データ（`current.answers` の数）からは、「次の問題へ」を押したかどうかは分かりません。押したかを保存すると setItem が 1 つ増えます。
- 直す方向（designer）：次の 3 点を、D-53、1、AC-23 の行、5.1 の #27、U-24 にそろえて書く。
  - 復元では、答えた問が n 件（1〜2）のとき、問 n の返しにだけミルを出す。`data-mood` は `answers[n-1].correct` から決める。
  - 問 n+1 は未回答で出す。問 n の「次の問題へ」は出さない。
  - 復元では返しの区画のフェードを当てない。
- 技術の答え：保存を足さずに作れます。

### 要修正 2：組のファイルを貯め終える前のオフラインで、S2 と S10 の状態がない
- 場所：:187（D-61）、:200（S2 のオフライン「通常と同じ」）、:210（S10 の読み込み中とエラーが「なし」）、:259 と :268（#47、#56）
- 問題：
  - SW は install で FILES を全部取り終えてから有効になります（contracts/service-worker.md の 3）。その前は、別の組のファイルを取る操作がどれも失敗し得ます。
  - D-61 は `task.next` と `task.exhausted.advance` しか扱っていません。次の操作がどちらの分け方でも抜けています。
    - (1) 初回の診断の `diagnosis.finish`：S1 の時点では領域が分からないので、組のファイルは診断の途中で取ります。
    - (2) やり直しの `diagnosis.finish`。
    - (3) S10 の題名と、選んだ選択肢の文：履歴にある別の組のファイルが要ります。
  - 18 組に分ける場合は、さらに次も抜けています。
    - (4) S7 の `seenNext` / `nextDone` の判定：次の段階のファイルが要ります。
    - (5) 規則で段階が変わった後の `task.next`。
  - tech-lead の推奨は 6 領域に分ける形です（証拠の 7）。そうすると (4) と (5)、D-61 の S5、S6、S7 の場合は起きません。残るのは S2 と S10 だけで、AC-23 の 3 通り目は「やり直しの診断で別の領域へ移る `diagnosis.finish`」と読み替えます（PRD :233 と AC-23 の Given が読み替えを認めています）。
- 直す方向（designer。分け方は G1 の ADR で決まるので、それに合わせる）：
  - S2 に、`diagnosis.finish` の直上に出る `error.tasks.offline` と `task.next.retry`（か S2 用のやり直しのキー）の状態を足す。状態は S2 の 3/3 のまま、回答は保ち、保存しない。
  - S10 に、ファイルを読めない行の出し方を足す。例：題名の代わりに課題の ID を出す、または `error.tasks.offline` を出す。
  - 5.1 の #47 と #56 を、分け方に合わせて置き換える。

### 要修正 3：`role="status"` を中身ごと差し込むと読み上げられないことがある
- 場所：:174（D-48。`<p role="status">` を返しの区画の中に置く）、:304（6 の返しの区画）、:202
- 問題：
  - 返しの区画 `task.question.feedback` は、答えた後に初めて DOM に入ります。そのため status の領域と中身が同時に現れます。
  - MDN は「中身を変える前に live region を置く。いちばん確かなのは最初のマークアップに入れること。`role="alert"` だけは例外」と書いています。
  - このままだと、正誤が VoiceOver で読まれないことがあります（D-48 と 9 の読み上げ順の前提が崩れます）。受け入れテストでは見つけられません。
- 直す方向（designer）：各 `task.question` に、空の `role="status"` の入れ物を描いた時点から置く。答えたときに、その中へ `task.answer.result.*` の `<p>` を入れる。
  - testid と文言はそのままでよい。
  - 復元のときは中身ごと描いてよい（読ませる必要がない）。

### 提案 1：D-52 の線の測り方は、辺ごとの値（longhand）で読む
- 場所：:178
- `border-color` は 4 辺をまとめた値（shorthand）です。辺ごとに色が違うと 4 つの値の列になります。
- 契約（test-hooks.md）では次のように書きます。「`line` の要素の、`border-<辺>-width` が 0 でない辺の `border-<辺>-color`。SVG は `data-figure-part="line"` を `<svg>` に置き、`stroke` を `<svg>` に指定する」。
- spike で、両方のエンジンの計算済みの値が `rgb()` に解決されることを確かめました（証拠の 9）。(a) は作れます。

### 提案 2：U-26 は `task.today` の要素に置く
- 場所：:628、PRD :210
- `data-task-question-index` と `data-task-question-total` は `[data-testid="task.today"]` に置きます。他の `data-task-*` と同じで、identifiers.md の 4 で決めます。
- PRD :210 の「ルートの要素に」は `<html>` と読めます。pdm に「`task.today` の要素に」と直してもらうと、食い違いがなくなります。

### 提案 3：ミルの絵の表示を待たせない
- 返しは 300 ms 以内です（AC-41）。終点の属性 `data-answer-result` は、絵のデコードを待たずに付けます。
- そのうえで、S3 を描いた時点で、今の配色の correct と incorrect の 2 枚を `new Image()` で先に読んでおくと、表示の遅れが出ません。G3 のスクリーンショットは `img.complete` を待ちます。

### 提案 4：文言の枠が詰まっている
- 7 の表から ja と en の JSON を作って測ると、gzip 後で 4,754 + 4,078 = 8,832 でした。枠 9,000 の 98% です。
- 課題集の枠を作り直すとき（budgets.md の 1）に、文言の枠を 10,000 にします（tech-lead が G1 で行う）。仕様の直しは要りません。

### 提案 5：S8 の削除の確認文にミルの設定を足す
- `showCharacter` は削除（`removeItem`）で一緒に消えます。削除の後の S1 では、ミルがまた出ます。
- `settings.delete.confirm.body` に「案内役の設定も消える」を足すかは、designer が決めてください。

### 提案 6：D-60 の段階の知らせは、保存した事実から決める
- 「段階が変わった後の最初の課題の間は出す」を履歴から推し量ると、次の場合に誤って出ることがあります：診断のやり直しで、たまたま同じ段階を選んだとき。
- 契約では、規則で段階が動いた done の行に事実を残します（例：`levelChange: "down" | "up"`）。今の `current` がその領域でその行の次に出した課題のときだけ知らせを出します。tech-lead が G1 の data.md で決めます。仕様の直しは要りません。

## 証拠

- 対象：
  - design/001-daily-learning.md（r11、8e7b6ca。1〜6、8〜11 と確かめは全行。7 は表を機械で読んだ）
  - `git diff --stat a3affdc 8e7b6ca -- design/`（67 ファイル。仕様、characters/README.md、tokens.md、screens.md は stat と本文の該当箇所。ミルの PNG 8 枚は `file` で確かめた）
  - docs/prd/001-daily-learning.md（11 の冒頭、AC-23、AC-24、AC-32、AC-41〜AC-45、12）
  - docs/reviews/001-daily-learning-G0-tech-lead-r5.md（全行）
  - docs/approvals/delegation.md の 2026-11-06 の 3 行
  - contracts/（data.md の 1〜4、budgets.md の 1〜2、test-hooks.md の W-4〜W-6、時間の計り方、W-12、W-13、service-worker.md の 3〜5、見出し）
  - docs/adr/0001
  - backend/public/（index.html と JS の一覧）、backend/scripts/check-budget.mjs（実行した）
  - verifier r5 の G0 の報告（H-1〜H-8）は今回開いていない。それに触れる点は、PRD r13 の本文と G0 tech-lead r5 の「G1 で行うこと」で代えた。

### 1. 決定ごとの実現性（書き直した D と新しい D-46〜D-65）

| 決定 | 判定 | 高くつく所と根拠 |
|---|---|---|
| D-3、D-5、D-26、D-46、D-47、D-49、D-64 | 作れる | 問を足していく形、`<button>` に `aria-disabled`、同期の保存。押した後のボタンは、handler で `aria-disabled` を見て何もしない。1 問ごとに 1 回の setItem |
| D-48 | 作れる（要修正 3） | live region を先に置く |
| D-6、D-44、D-59、D-62、D-63、D-65 | 作れる | 申告の型を done / no_time / none にし、score と answers から数える。S9 の 3 つの値は履歴から計算できる（G0 で AC-24 の seed を手で数え直して一致） |
| D-13、D-43、D-57 | 作れる | `@keyframes` を `(prefers-reduced-motion: no-preference)` の中だけに書く。ミルは動かない |
| D-15、D-58 | 作れる | トークン 2 色を足す。CSS 変数だけ |
| D-18、D-50、D-51 | 作れる（高くつく） | 6 型を HTML と CSS で組み、480 px で組み直す。矢印は `createElementNS`。JS は約 1.5〜2 KB、CSS は約 1 KB（gzip 後）増える見込み［推測］。新しいモジュール 1 つ |
| D-52 | 作れる（提案 1） | spike で計算済みの値を確かめた |
| D-53〜D-56 | 作れる（要修正 1） | PNG と `<picture>`（U-27）。設定はトップレベルの `showCharacter`（U-25） |
| D-60 | 作れる（提案 6） | 段階が動いた事実を保存データに残す |
| D-61 | 作れる（要修正 2） | fetch の失敗をボタンの近くに出す |
| D-19、D-20、D-34、D-36 | 作れる | 文言と並び |

### 2. 状態（5.1 の 73 行）、識別子（6.1）、文言 189 キー
- 73 行のうち、作るのに新しい仕掛けが要るのは次の 6 行です。どれも作れます。
  - #17〜#22（図の 6 型）
  - #27（復元。要修正 1）
  - #47 と #56（オフライン。要修正 2）
  - #32 と #33（保存の失敗）：W-9 の注入をそのまま使う
- 残りは r10 の仕掛け（seed、時刻の固定、注入、UA の偽装）で出せます。
- 識別子：文字を持たない要素 17 行と、属性 15 行。今の identifiers.md の 3〜5 と名前がぶつかるものはありません。`data-question-index`（診断）と `data-question-number`（課題の問）は別の名前です。
- 文言：7 の表を機械で読むと 189 キーで、`guide.*` は 11 キーでした。en の長さ（コードポイント）は 4、35、30、31、31、40、32、40、34、33、38 で、どれも 40 以下です。

### 3. U-25、U-26、U-27、U-29、D-52 への技術の答え
- U-25：書けます。
  - `showCharacter` はトップレベルの任意の真偽値にし、ないときは true と読みます。`device` に入れないのは、読み込みで `device` だけ手元の値が残り、AC-19 と AC-20 が成り立たなくなるためです（G0 r5 の表）。
  - 保存データ「なし」でも、`homeGuideClosed` と同じく 1 回の setItem で書けます。`firstOpenDate` は書かず、3 つの区分も変わりません（data.md の 3 は `diagnosis.area` と `completedOn` と `history` だけで決まる）。読み込むとファイルの値に置き換わり、削除で消えます（提案 5）。
- U-26：`task.today` の要素に置きます（提案 2）。
- U-27：案 (b) の PNG と `<picture>` を推します。
  - 配色ごとに 1 枚だけ要求され、96 px、`pixelated` で出ることを両方のエンジンで確かめました（9）。
  - 8 枚は生で合計 3,140 バイト前後です（1 枚 382〜411 バイト、48×48、8 ビットの索引色）。
  - 置き場所は `./img/miru-<mood>[-dark].png` にし、SW の FILES に足します。AC-44 の画像の要求の数え方からは、パスの接頭辞 `img/miru-` で外します。
  - 案 (a) の path の JSON は、色を CSS 変数にできる代わりに、JSON を取る要求と、SVG を作る JS が増えます。designer の原本も PNG です。ADR では 2 案を比べて書きます。
- U-29：契約には、選択肢の click の handler の中で、同期で次の順に行うと書きます。
  1. setItem。失敗したら error を出して終わる。属性は付けない。
  2. 3 つの選択肢に `data-choice-state` と `aria-disabled` を付ける。
  3. 返しの中身を DOM に入れる：正誤の `<p>`（status の中）、ミルの `<aside>` と `<img>`（src は入れるが、デコードは待たない）、説明のラベルと説明 1〜2、次へかまとめへのボタン。
  4. `task.today` の `data-task-question-index` を 1 増やす。
  5. 最後にその問の `data-answer-result` を付ける。

  計り方は、時間の計り方の attributeFilter に `data-answer-result` を足し、始点を `task.choice` の click、上限を 300 ms にします。
- D-52：(a) を採ってよいです（提案 1）。補助として、(b) のトークンの数値（5.02 / 8.99 / 9.06 / 13.78）を identifiers.md か budgets.md に写します。

### 4. 画面ごとに要る保存と読み込み（operation の案の代わり。サーバーはない）
- S1：案内を閉じる（device）。
- S2：1、2 問目の確定（diagnosis、firstOpenDate）。1 問目を確定した時点で、その領域のファイルの fetch を始める。終える（diagnosis、levels、current、persistRequested）。終えるときは、そのファイルの読み込みを待つ。
- S3：選択肢を押す（`current.answers` に足す。3 問目では current を外し、done の行（answers、score、levelChange）と levels を 1 回で保存）。今日はやめておく（no_time の行と、答えた分の answers と score）。日付が変わったときの 1 回。
- S4：役に立ったか（その行の helpful）。
- S5、S6：task.next。
- S7：advance（levels と current）、redo。
- S8：`showCharacter`、読み込み、削除、redo。
- S10：履歴にある領域のファイルを読む。

### 5. 独自部品の手間
- 選択肢の `<button>`：小さい。APG の Button の型。
- 図の 6 型：大きい。文字 200% と幅 320 の組み直し。読み上げは `role="img"` と alt だけなので作り直さない。
- ミル：小さい。`<aside aria-label>` と `<img alt="" aria-hidden>`。
- live region：要修正 3。

### 6. 契約に要る変更（G1 の設計で tech-lead が書く）
- data.md と data.schema.json：
  - 行から `answer` を外す。`answers[{choice, correct}]`（0〜3）、`score`、`levelChange` を足す。
  - `current.answers`（0〜2）とトップレベルの `showCharacter` を足す。`report` から too_hard と too_easy を外す。
  - 2 の保存の表を作り直す（書く欄の行を消し、選択肢、やめておく、`showCharacter` の行を足す）。
  - 5 の段階の規則を score に置き換える（2 件連続で 1 以下なら下げる、3 件連続で 3 なら上げる）。
  - 9 の統計を 13 にし、6 の表の `levelHint` の行を消す。
- identifiers.md：
  - 3：testid を 17 行足し、20 個ほど消す。
  - 4：属性を 15 行足す（`data-task-question-*` は `task.today` に置く）。
  - 5：図の型 6、`data-mood` 4、申告 3。
  - 6：文言 189 キー。
- strings.md：
  - 5 の本文のフィールドを intro、questions[].text、choices[].text と explain、insight、figure.labels と alt にする。
  - 7 に D-65、AC-42、AC-45 の語の検査と、AC-43 の 1 文 60 字を足す。
- schemas：tasks.schema.json を新しい型にする。問は 3、選択肢は 3、正解の index、figure の型ごとのラベルの数（比較は 4〜8）、各 1〜12 字、alt 1〜80 字。strings.schema.json は 189 キーにする。
- test-hooks.md：
  - 「選択肢 → 返し」の区間（3 の U-29）。
  - W-4 を組のファイルの URL と差し替え方に直す（AC-44 の 6 型は `page.route`）。
  - AC-23 の 3 通り目の手順：`serviceWorkers: 'block'` で開き、目当てのファイルを読む前に setOffline。
  - W-12 に resourceType を記録し、ミルを除く。
  - W-7 の seed を answers と score で作り直す。
  - D-52 の読み方、AC-45 の整数倍（96 / 48 = 2）、reduce で `getAnimations({subtree:true})`。
- budgets.md：
  - 1 を「初回に読む分 150,000」と「SW が貯める分 400,000」の 2 つの枠にする。殻、文言 10,000、アイコン、ミル、課題集の 1 ファイルの内訳も決める。check-budget.mjs の直しは backend-engineer に頼む。
  - 2 の 1 件ごとの上限を新しい型に直す（pdm に知らせる）。
  - 5 の使う機能の一覧に次を足す：`<picture>` Safari 9.1、`<source media>` 3.1、`image-rendering: pixelated` 10、`overflow-wrap: anywhere` 15.4、`accent-color` 15.4。どれも 17.0 より前から使える（MDN の互換データ、2026-11-06）。
- service-worker.md：FILES の `tasks.json` を組のファイル（6 か 18）に替え、PNG 8 枚を足す。貯め終える前は、アプリが fetch の失敗として扱う。
- fixtures：data の v1 の valid と invalid、seeds（AC-8 の 9 通り、AC-24、AC-14、AC-35、AC-36）、tasks（6 型、境界）、strings（189 キー）を作り直す。
- 脅威モデル：新しい境界なし。PNG と課題集は同じ origin で、`img-src 'self'` と `connect-src 'self'` の範囲。読み込むファイルは、新しい項目もスキーマで検査する。

### 7. ADR
- 0002 の改訂：formatVersion 1 のまま形を作り直す。
  - 根拠：まだ公開していない。2026-11-06 に `curl https://matsuura-tak.github.io/engineer/` は 404、origin/main の backend/public/ は 0 件。
  - 比べる案：formatVersion 2 にして v1 から移す。
  - 見直す条件：G1 が終わる前に公開したら、版を上げる。
- 新しい ADR：課題集を分ける形。推奨は 6 領域。
  - 良い点：段階の変化（規則と進級）でファイルを取り直さない。S7 の判定がそのファイルの中で済む。要修正 2 の抜けが S2 と S10 に減る。FILES は差し引き +5。
  - 悪い点：初回に読む量が約 +20 KB（1 ファイル約 30〜32 KB、スキーマの上限いっぱいで約 50 KB）、AC-15 が約 +100 ms［推測］。
  - 比べる案：18 組（1 ファイル約 10.7 KB）。
- 新しい ADR：JS をまとめる道具（ADR 0001 の (iii) に当たる）。推奨は esbuild 0.28.2（MIT）を devDependency にし、ESM で 1 ファイルにまとめ、空白だけ縮める。sw.js は別のまま。
  - 本番の依存は 0 のままです。JS のファイルは 2 つ（app.js と sw.js）になり、15 の上限の問題も消えます。
  - 比べる案：(a') モジュールのまま線をなくす。ただし ADR 0001 の決まりに反し、殻の枠も超えます。
  - dependencies.md に足すもの：esbuild 本体と、lockfile に載る 26 個の `@esbuild/<OS と CPU>` の optional 依存。install の script についての npm の警告。
- 新しい ADR：キャラクターの描き方（U-27）。

### 8. JS の増え方と予算の見積もり（gzip 後のバイト。［推測］は見込み）

| 部分 | 今（実測） | まとめない（今の形） | esbuild でまとめる（空白だけ縮める） |
|---|---|---|---|
| JS（sw.js を含む） | 25,829（13 ファイル） | 29,800〜32,300（15 ファイルで上限ちょうど）［推測］ | 16,823＋増える分 3,400〜5,500＋sw.js 約 1,000 ＝ 21,200〜23,300［推測］ |
| HTML と CSS | 4,199 | 5,500〜6,000［推測］ | 同じ |
| 殻（枠 32,000） | 30,022 | 35,300〜38,300（枠を超える） | 26,700〜29,300（枠の中） |
| 文言（枠 9,000） | 8,045 | 約 8,832（7 の表から） | 同じ |
| アイコンと manifest | 2,173 | 2,173 | 2,173 |
| ミル（初回は idle の 1 枚） | — | 約 400〜800 | 同じ |
| 課題集（初回の 1 ファイル） | 69,313（1 つの JSON） | 6 領域：約 30,000〜32,000（スキーマの上限いっぱいで約 50,000）。18 組：約 10,700 | 同じ |
| 初回の合計（枠 150,000） | 109,553 | 6 領域で約 82,000〜100,000 | 6 領域で約 74,000〜92,000 |
| SW が貯める分の合計（案 400,000） | — | 約 235,000〜335,000 | 約 226,000〜331,000 |

- JS の増え方の内訳［推測］：問と返しで +1,000〜1,500、図で +1,500〜2,000、ミルで約 +600、検査（課題集と保存データ）で +700〜1,000、組のファイルを読む処理と復元と設定で +1,200、sw.js で約 +150。書く欄、申告のボタン、levelHint を消して −1,000〜−1,500。合計 +4,000〜+6,500。
- AC-15：G0 の spike で、分けた形は 904〜930 ms。6 領域では約 +100 ms の見込みで、見直しの線 1,600 ms の下です［推測。G2 で実物を計る］。

### 9. 実行したコマンドと結果（スクラッチパッドは /private/tmp/claude-501/-Users-takumamatsuura-src-engineer/ae59c026-8475-4247-a5d7-fd24469df965/scratchpad/g1r6/）
- `node scripts/build.mjs --out <スクラッチパッド>/dist --version 2026-11-06.1`：20 ファイル。続けて `node scripts/check-budget.mjs`：殻 30,022、文言 8,045、アイコン 2,173、課題集 69,313、合計 109,553、OK。ファイルごとの gzip 後の大きさも測った（JS 12 個で 24,934、sw.js 895）。
- strings.mjs（7 の表から ja と en を作る）：r11 で 189 キー、ja 4,754、en 4,078。今のファイルは 174 キーで 4,323 と 3,720。
- esb/ に esbuild 0.28.2 を入れた（`npm view`：MIT、最終更新 2026-08-08）。今の public/js を `--bundle --format=esm --target=safari17` でまとめると、縮めない形で 19,597、空白だけ縮めると 17,255（dist の写しでは 16,823）、全部縮めると 14,856。`eval`、`new Function`、`innerHTML` は 0 件。
- run-b.mjs：まとめた配布物（modulepreload を外し、`./js/app.js` 1 つにした。本番の CSP の meta はそのまま）と元の配布物を、Playwright 1.64.1 で開いた。Chromium 156 と WebKit 27.2 のどちらも、`diagnosis.start` から begin を押して `diagnosis.question` になり、コンソールのエラーは 0 件。
- cs.mjs：本番と同じ CSP と、同じ origin の CSS で確かめた。
  - `figure` の `background-color` は rgb(255,255,255) / rgb(18,18,18)。
  - `border-left` の線と、SVG の `stroke: currentColor` の計算済みの値は rgb(31,31,31) / rgb(232,232,232)。
  - 強調の枠は rgb(180,83,9)。
  - `<picture>` はライトで `miru-idle.png`、ダークで `miru-idle-dark.png` の 1 件だけを要求し、幅 96、`pixelated`。
  - 両方のエンジンで同じ結果。
- `file miru-*.png`：8 枚とも 48×48、8 ビットの索引色。
- `curl https://matsuura-tak.github.io/engineer/` は 404。`git ls-tree origin/main` の backend/public/ は 0 件。
- bcd.mjs（MDN の互換データの main）：Safari で picture 9.1、source.media 3.1、pixelated 10、overflow-wrap:anywhere 15.4、accent-color 15.4。

### 開いた URL（2026-11-06）
- https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions （要修正 3 の引用）
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/ の css/properties/{overflow-wrap,accent-color,image-rendering}.json と html/elements/{picture,source}.json
- https://matsuura-tak.github.io/engineer/ （404）
- npm registry の esbuild（`npm view`）

### 未検証
- なし。作れるかどうかは、spike の出力と公式の互換データで裏付けました。
- 見込みの数字（JS と CSS の増え方、AC-15 の +100 ms）は［推測］と書いてあり、G2 で実物を数えます。
- Safari 17 の実機と VoiceOver での見え方は、互換データと MDN で代えています。これまでと同じく、G4 で Takuma が実機で確かめます。

### 指揮役へ
- 次の 3 つは元に戻しにくい判断です。G1 の ADR で reviewer に反論を出してもらってください。
  - formatVersion 1 のまま形を作り直す
  - 課題集を 6 領域に分ける
  - esbuild を入れる（ADR 0001 の (a) を置き換える）
- 要修正 1〜3 は designer の直しです。要修正 2 は課題集の分け方に合わせるので、tech-lead の ADR を先に書くか、指揮役が 6 領域で先に決めてから designer に渡すと、往復が 1 回減ります。

## 記録
- 関門：G1
- 判定した役：tech-lead
- 回：r3（G1 の tech-lead の判定。r1、r2 は前の周回。FB 2 回目で 1 回目）
- 対象：feat/001-daily-learning、a3affdc...8e7b6ca（design/）
- 日付：2026-11-06
