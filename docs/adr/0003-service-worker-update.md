# ADR 0003：Service Worker は先に全部取っておいて返し、新しい版はすぐ有効にする（知らせは出さない）

- 状態：提案（G1 で reviewer が判定する）
- 書いた役：tech-lead　日付：2026-10-30
- 関係する PRD、設計メモ、契約：docs/prd/001-daily-learning.md（9、10、AC-12、AC-23、AC-28）、docs/adr/features/001-daily-learning.md、contracts/service-worker.md
- 元に戻す手間：中（配った SW は利用者のブラウザに残り、次の版の SW でしか置き換えられない）

## 背景
- 一度読み込んだ後は、オフラインで再読み込みしても 3 秒以内に同じ状態を出す（AC-23）。
- 課題集は v1 が 126 件で、公開後 14 日までに 252 件版を配る（Q2）。配り直した版が、オンラインで 3 回以内の読み込みで届く必要がある（AC-28）。
- GitHub Pages は `Cache-Control: max-age=600` を返す（G1 r1 の curl）。
- 「更新があります」の知らせと、裏での取得は 002 以降（PRD 10）。

## 決定
install で配布物の全ファイルを `cache: 'reload'` で取り、`skipWaiting`。activate で自分の接頭辞の古いキャッシュを消して `clients.claim`。fetch は自分の scope の GET だけを、URL の引数を無視してキャッシュから返す。細かい決まりは contracts/service-worker.md。

## 検討した案
| 案 | 良い点 | 悪い点 | 選ばなかった理由 |
|---|---|---|---|
| (a) 先に全部取る + cache-first + skipWaiting + claim + `cache: 'reload'`（採用） | オフラインで全画面が動く。新しい版は次の読み込みで使われる。spike で 2 秒おき 2 回目に切り替わった | 初回の通信が最大 2 倍。開いたままの古い画面は、新しいキャッシュの下で古い JS のまま動く | — |
| (b) HTML だけ network-first、他は cache-first | オンラインなら毎回最新の HTML | 遅い回線で HTML の待ちが毎回入り、AC-15 と AC-23 の時間が延びる。HTML と JS の版がずれうる | 「開いたらすぐ」（P-2）を削る |
| (c) skipWaiting せず、「更新があります」を出して利用者が再読み込み | 版の混ざりがない | 知らせが重なる要素になり AC-31 とぶつかる。PRD 10 で 002 以降に回した | 範囲の外 |
| (d) SW を使わない（HTTP キャッシュだけ） | 作る物が減る | オフラインで開けない（AC-23 を満たせない） | AC を満たせない |

## いちばん強い反論と、それでも選んだ理由
- 反論：skipWaiting は、開いたままの古い画面と新しい SW を混ぜる。古い画面が新しい版のファイルを後から読めば壊れる。
- それでも選んだ理由：画面は最初に全モジュールを読み終え、動的な `import()` を使わない（ADR 0001）ので、古い画面が新しいファイルを読む機会がない。保存データの版を上げるリリースでは、古い画面は新しい版のデータを「読めない」として止まり、上書きしない（ADR 0002）。

## 結果
- 楽になること：配り直しは配布物を差し替えるだけ。知らせの画面が要らない。
- 難しくなること、守り続けること：FILES と配布物を必ず一致させる（ビルドで検査）。sw.js のバイトをリリースごとに変える（版の刻印）。`cache: 'reload'` を外さない。キャッシュの接頭辞 `kyounoitte-` を変えない（変えると古いキャッシュが残る）。
- 元に戻すとき：fetch で何もしない sw.js（自分のキャッシュを消して `self.registration.unregister()`）を配る。0.5 日。最大 10 分（Fastly のキャッシュ）は古い SW が残る。

## 見直す条件
- AC-28 の受け入れテストで、3 回目までに切り替わらないことが 1 度でも起きた。
- 公開後に「新しい課題が出ない」の報告が 1 件でも来た。
- 002 で Web Push、裏での取得、更新の知らせを入れると決めた。

## 確かめたこと
- tech-lead G0 r2 の spike（t_upd.js）：sw.js のバイトとキャッシュの名前を変え、skipWaiting と claim で配り直すと、2 秒おきで Chromium と WebKit とも `2,4,4,4,4`（2 回目から新しい版）。0.5 秒おきでは Chromium が `2,2,2`。保存データは残った。
- tech-lead G1 r1 の spike 2（`Cache-Control: max-age=600` と gzip を返すサーバー）：Chromium で `cache: 'reload'` なしは 5 回とも旧版、ありは 2 回目から新版。WebKit はどちらも 2 回目から。
- tech-lead G0 r2 の spike：URL の引数まで一致させるとオフラインの再読み込みが `net::ERR_FAILED`、ignoreSearch なら成功（16〜37 ms）。
- MDN の互換データ 8.1.7：`api.Cache.addAll` Safari 11.1、`api.Clients.claim` 11.1、`api.ServiceWorkerGlobalScope.skipWaiting` 11.1、`api.Request.cache` 10.1。
- https://playwright.dev/docs/service-workers（serviceWorkers: 'block'、fromServiceWorker の説明。G0 r2 で開いた）
- この ADR のための spike（2026-10-30）：Trusted Types を求める CSP の下では register に TrustedScriptURL が要る。名前つきのポリシーを通せば Chromium と WebKit で成功（設計メモの 4）。

## 確かめ（B）
- [x] 案が2つ以上あり、どの案にも悪い点が書いてある
- [x] 反論、悪い結果、見直す条件が空でない
- [x] 確かめたことに、URL かコマンドの出力がある
