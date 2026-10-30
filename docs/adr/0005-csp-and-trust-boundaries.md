# ADR 0005：厳しい meta の CSP と Trusted Types で文字列の HTML を禁じ、origin の共有は受け入れて決まりで守る

- 状態：提案（G1 で reviewer が判定する）
- 書いた役：tech-lead　日付：2026-10-30
- 関係する PRD、設計メモ、契約：docs/prd/001-daily-learning.md（12 のセキュリティと配布）、docs/adr/features/001-daily-learning.md の 7、contracts/budgets.md の 3、contracts/data.md の 1 と 4
- 元に戻す手間：小（CSP は HTML の 1 行。ただし Trusted Types を外すと、innerHTML の禁止を機械で守れなくなる）

## 背景
- 新しい信頼の境界が 2 つある。
  - 読み込むファイル：利用者が選んだ JSON で、中身は信頼できない（AC-20、AC-22、AC-25）。課題集の文字列も、画面に出す前は信頼しない扱いにする。
  - origin の共有：`matsuura-tak.github.io` は同じアカウントの他の Pages のリポジトリと同じ origin で、localStorage と Cache Storage を共有する。ルートの scope の SW があれば `/engineer/` の要求も横取りできる。
- GitHub Pages では HTTP のヘッダーを足せないので、CSP は meta で書く。meta では `frame-ancestors` が効かない。
- HTTPS の転送（Enforce HTTPS）は、公開時に Takuma がリポジトリの Pages の設定で入れる（Takuma の決定 D7、2026-10-30。設計メモの E3）。

## 決定
- 本番の HTML に、budgets.md の 3 の CSP を meta で 1 つだけ置く。`default-src 'none'` から始め、自分の origin だけを許し、`require-trusted-types-for 'script'` と `trusted-types kyounoitte-sw` で文字列の HTML の代入を止める。
- 枠の中で開かれたら（`window.top !== window.self`）アプリを始めない。
- origin の共有は受け入れる。代わりに、アプリは自分のキー `kyounoitte:data` と接頭辞 `kyounoitte-` のキャッシュだけに触り、Takuma の他の Pages にルートの scope の SW を置かない決まりを RUNBOOK に書く。
- 読み込むファイルは 5,000,000 バイトまで、スキーマで全体を検査し、textContent でだけ出す。

## 検討した案
| 案 | 良い点 | 悪い点 | 選ばなかった理由 |
|---|---|---|---|
| (a) 厳しい meta の CSP + Trusted Types + 枠の中では始めない（採用） | innerHTML の誤用が Chromium と WebKit（Trusted Types のある版）で例外になり、受け入れテストで必ず見つかる。外への通信も CSP で止まる | SW の登録にポリシーが要る（1 つ）。Safari 17〜25 では Trusted Types が効かない | — |
| (b) meta の CSP だけ（Trusted Types なし） | 書く物が少ない | innerHTML の禁止は grep とレビューに頼る | 機械で止められる方を選ぶ |
| (c) CSP なし | 作る物が最も少ない | 読み込むファイルや課題集の文字列から XSS が起きたとき、守りがない。PRD 12 の確かめ方（meta が 1 つ）を満たさない | PRD に反する |
| (d) 独自のドメインで origin を分ける | 他のページと保存とキャッシュを共有しない | 料金が未確認で、Q7 で既定の URL に決めた | Takuma の決定の範囲の外。見直す条件に入れる |
| (e) フレームに入れられても何もしない | 3 行も要らない | 削除の確定を枠越しに押させる攻撃（クリックジャッキング）を防げない | 3 行で防げる |

## いちばん強い反論と、それでも選んだ理由
- 反論：同じ origin の他のページは、CSP に関係なく `kyounoitte:data` を読み書きでき、ルートの SW で偽の画面を返せる。CSP を厳しくしても、いちばん大きな穴（origin の共有）は残る。
- それでも選んだ理由：その穴を作れるのは Takuma の他のリポジトリだけで、Takuma は 1 人で全部を管理している。原因が自分の手の中にある危険は、決まりと見直す条件で扱う。独自のドメインは料金の確認と Takuma の決定が要るので、v1 では選べない。

## 結果
- 楽になること：XSS の主な入口（文字列の HTML）が機械で止まる。外への通信 0 件（AC-12、AC-23）を CSP でも支える。
- 難しくなること、守り続けること：インラインのスクリプト、スタイル、`style` 属性、イベント属性を書かない。ポリシーは `kyounoitte-sw` の 1 つだけ。CSP の文字列は budgets.md と単体テストで固定する。
- 元に戻すとき：HTML の meta の 1 行を直す。0.5 日。

## 見直す条件
- Takuma が同じアカウントで、別の Pages のリポジトリを公開した（ルートの SW がないか、localStorage の名前がぶつからないかを確かめる）。
- 独自のドメインを使うと決めた、または利用者を 10 人以上に広げて計測（Q1 の B）を足す（`connect-src` に送信先を足す ADR を書く）。
- Safari 26 未満の利用者の割合が 10% を下回った（Trusted Types がほぼ全員に効く）。

## 確かめたこと
- この ADR のための spike（2026-10-30、スクラッチパッド、Playwright 1.64.1）：
  - 上の CSP の下で `h1.innerHTML = …` → Chromium 156 と WebKit 27.2 の両方で `innerHTML-blocked:TypeError`。
  - 文字列のまま `navigator.serviceWorker.register('./sw.js')` → 両方で TypeError（Chromium「Failed to execute 'register' … This document requires」、WebKit「This assignment requires a TrustedScriptURL」）。`trustedTypes.createPolicy('kyounoitte-sw', …)` を通すと両方で `ok`。
  - `trusted-types kyounoitte-sw` を足した CSP の下で、Playwright の click と fill、@axe-core/playwright 4.14.0 の監査が両方で動いた（`label:critical` を検出）。
- MDN の互換データ 8.1.7：`http.headers.Content-Security-Policy.require-trusted-types-for` は Safari 26、Chrome 83。
- tech-lead G1 r1 の spike 2：CSP の下で Blob の書き出しが 2 つのエンジンで動き、CSP の違反は 0。
- https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https（HTTPS の転送は管理者の設定。G1 r1 で開いた）。`curl -sI http://octocat.github.io/` は 200（転送されない）。
- meta の CSP で frame-ancestors が効かないこと：MDN の互換データの `meta-element-support` の項目があることだけを確かめた。各ブラウザの挙動は未確認。

## 確かめ（B）
- [x] 案が2つ以上あり、どの案にも悪い点が書いてある
- [x] 反論、悪い結果、見直す条件が空でない
- [x] 確かめたことに、URL かコマンドの出力がある
