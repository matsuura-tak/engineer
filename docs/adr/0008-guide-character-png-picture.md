# ADR 0008：案内役ミルの絵は 48×48 の索引色 PNG（ライト用とダーク用）を `<picture>` で切り替える

- 状態：提案（G1 で reviewer が反論を出す。design r13 の U-27 を閉じる）
- 書いた役：tech-lead　日付：2026-11-06
- 関係する PRD、設計メモ、契約：docs/prd/001-daily-learning.md（r13。AC-41、AC-44、AC-45、12）、design/001-daily-learning.md（r13。D-53、D-54、D-57、U-27）、design/001-daily-learning/characters/README.md、docs/adr/0005、docs/adr/0006、contracts/budgets.md の 1 と 5、contracts/service-worker.md の 3、contracts/test-hooks.md の W-12（どれも次の回で書き直す）
- 元に戻す手間：小（画像の置き場所と、絵を出す 1 モジュールの中だけ。保存データと文言は変わらない）

## 背景
- PRD r13 は案内役のキャラクターを 1 体、4 表情（idle、correct、incorrect、celebrate）で出し、ドット絵にする（FB2-5、FB2-6、AC-45）。Takuma はミル（カメレオン）を選んだ（Q28、delegation.md 2026-11-06）。
- designer の原本は 48×48、8 ビットの索引色の PNG で、ライトとダークで輪郭だけが違う 8 枚（design/001-daily-learning/characters/miru-*.png）。画面では 2 倍の 96×96 CSS px に `image-rendering: pixelated` で出す（D-54。AC-45 の整数倍）。
- 制約：CSP `img-src 'self'`（data: も blob: も許さない）、Trusted Types、`style` 属性なし、文字は textContent だけ（ADR 0005）。返しは 300 ms 以内（AC-41）。AC-44 は図の画像の要求を数える。

## 決定
- 8 枚を `./img/miru-<mood>.png` と `./img/miru-<mood>-dark.png`（mood は idle、correct、incorrect、celebrate）に置き、SW の FILES に足す（+8）。シート（miru-sheet-x6.png）は配らない。
- 絵は `<picture><source media="(prefers-color-scheme: dark)" srcset="./img/miru-<mood>-dark.png"><img src="./img/miru-<mood>.png" alt="" width="48" height="48"></picture>` を `createElement` で組む（`aria-hidden="true"` は `guide.sprite`。大きさは CSS のクラスで 96 px）。
- 先読み：S1 は idle の 1 枚だけを `<picture>` が取る。S3 を描いた時点で、今の配色の correct と incorrect の 2 枚を `new Image()` で読む（D-53、G1 tech-lead r3 の提案 3）。返しの終点の属性 `data-answer-result` は絵のデコードを待たずに付ける。

## 中身（契約は次の回で書く。ここでは方針だけ）
- 配色の判定は `<source media>` に任せ、JS で `matchMedia` を読まない（配色を変えたときもブラウザが差し替える）。先読みの 2 枚だけは JS が `matchMedia('(prefers-color-scheme: dark)').matches` で選ぶ。
- ビルド：build.mjs は `public/img/` をそのまま写す（変換しない）。FILES と出力の一致は今の検査で見る。
- 予算：初回に読む分にはミル 1 枚（最大 411 バイト）を数え、SW が貯める分には 8 枚（3,140 バイト）を数える。PNG は gzip が効かないので、check-budget.mjs は生のバイト数で数える（数え方は次の回の budgets.md の 1）。
- AC-44 の図の画像の要求の数え方からは、パスの接頭辞 `img/miru-` の要求を外す（次の回の test-hooks.md の W-12）。
- `showCharacter` が false のときは `<picture>` を作らない（要求も 0）。先読みの `new Image()` もしない。
- reduce（D-57）：絵は動かないので、手当ては要らない。

## 検討した案
| 案 | 良い点 | 悪い点 | 選ばなかった理由 |
|---|---|---|---|
| (a) PNG を `<picture>` で切り替える（採用） | designer の原本をそのまま配れる（変換の道具も手作業もない）。配色ごとに 1 枚だけ要求される（spike で確かめた）。JS は要素を組むだけで、画素のデータを持たない。`img-src 'self'` の範囲 | 配色ごとに 2 枚持つので 8 枚になる。色を CSS 変数で変えられない（コントラストを上げる設定でも同じ絵）。表情を足すたびに 2 枚足す。要求が絵の数だけ（最大 3 枚。S3 の先読みを含む） | — |
| (b) SVG の path を JSON に持ち、JS が `createElementNS` で描く（色は CSS 変数） | 色をトークンで変えられ、ライトとダークで 1 つのデータ。拡大しても崩れない | 48×48 の画素を path に直す変換が要り（原本は PNG）、そのデータを読む要求と、SVG を組む JS（約 +600 バイト以上［推測］）が増える。画素の数だけ `<rect>` か複雑な path になり、DOM が重くなる。AC-45 の「整数倍」の確かめ方が変わる | 原本と配る物がずれ、変換の手間と検査が増える。色を変えられる利点は、D-54 の「輪郭で形を持つ」で要らない |
| (c) PNG を CSS の `background-image` と `@media (prefers-color-scheme: dark)` で切り替える | JS が `<picture>` を組まなくてよい | 表情ごとにクラスが要る。背景画像は代替を持てず（`aria-hidden` なので要らないが）、AC-45 のテストが `img` の要求を見られない。印刷やコントラストの設定で消えることがある | `<picture>` で足りる |
| (d) 絵を出さない（文字だけの案内） | 要求も手間もない | AC-45 と FB2-5、FB2-6 を満たさない | PRD の決定に反する |

## いちばん強い反論と、それでも選んだ理由
- 反論：(a) はコントラストを上げる設定（`prefers-contrast: more`）や将来の配色の変更に追従できない。体の塗り #B48CE0 は地との比が 2.70 しかなく、色をトークンで変えられる (b) のほうがアクセシビリティの手当てを後から足しやすい。
- それでも選んだ理由：D-54 は形を輪郭（color.text の色、16.48 / 15.29）で持ち、SC 1.4.11 を輪郭で満たす設計で、塗りの色に意味を持たせていない。絵は `aria-hidden` の飾りで、意味は台詞の文字（`guide.say`）が持つ。配色を変える必要が出ても、designer が PNG を描き直して差し替えるだけで済み、コードは変わらない。(b) は変換の道具か手作業が要り、配る物と原本が別物になる。

## 結果
- これで楽になること：絵の差し替えはファイルの置き換えだけ。JS は要素を組むだけ。
- これで難しくなること、守り続けること：表情か配色を足すときは、FILES と予算と test-hooks.md の数え方を一緒に直す。`<picture>` の `<source>` は `media` だけを使い、`type`（AVIF、WebP）は使わない（Safari 17.0 で使えるかの確かめを増やさないため）。
- 元に戻すときの手順と手間：(b) に移すなら、PNG から path を作る手順と、描く処理を足す。1〜2 日。

## 見直す条件
- Takuma か designer が、コントラストを上げる設定に合わせた絵が要ると決めた（`<source media="(prefers-contrast: more)">` を足すか、(b) に移すかを考える）。
- 表情が 6 つを超える、またはキャラクターが 2 体以上になる（要求と FILES が増えるので、1 枚のシートに切り替えるかを考える）。
- ミルの画像が原因の表示の遅れ（返しの 300 ms を超える）が受け入れテストか G3 で 1 回でも出る。

## 確かめたこと
- `file design/001-daily-learning/characters/miru-*.png`（2026-11-06）：8 枚とも `PNG image data, 48 x 48, 8-bit colormap, non-interlaced`。大きさは celebrate 411、correct 390、idle 382、incorrect 387（ライトとダークで同じ）、8 枚の合計 3,140 バイト。シートは 13,607 バイト（配らない）。
- G1 tech-lead r3 の spike（スクラッチパッドの g1r6/cs.mjs、Playwright 1.64.1、本番と同じ CSP）：`<picture>` はライトで `miru-idle.png`、ダークで `miru-idle-dark.png` の 1 件だけを要求し、幅 96、`pixelated`。Chromium と WebKit で同じ結果。
- MDN の互換データ（G1 tech-lead r3、@mdn/browser-compat-data の main、2026-11-06）：Safari で `picture` 9.1、`source` の `media` 3.1、`image-rendering: pixelated` 10。どれも Safari 17.0 より前から使える。
- https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering （D-54 の根拠。designer が開いた）
- 未確認：Safari 17 の実機での見え方（G4 で Takuma が見る）。

## 確かめ（B）
- [x] 案が2つ以上あり、どの案にも悪い点が書いてある
- [x] 反論、悪い結果、見直す条件が空でない
- [x] 確かめたことに、URL かコマンドの出力がある
