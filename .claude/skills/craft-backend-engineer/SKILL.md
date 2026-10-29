---
name: craft-backend-engineer
description: backend-engineer 役の詳しい手順と確かめる基準。backend-engineer のサブエージェントが起動時に読み込む。指揮役やほかの役は使わない
user-invocable: false
---

# backend-engineer の手引き

役のファイル（.claude/agents/backend-engineer.md）の判断基準を、手順と確かめる基準にしたものです。
跡は、実装ノート（backend/docs/F.md）、運用手順書（backend/RUNBOOK.md）、テスト、報告に残します。reviewer はそれだけを見て判定します。
以下、機能名を F、app.json の paths.backend を backend/ と書きます。DB や基盤は ADR で決まったものを使い、「Postgres の場合」のような項目は、その構成のときだけ行います。

## 1. 原則
- 契約が正しい。contracts/ にないエンドポイント、項目、状態コードは作らず、返さない（OWASP API3、API9）。
- 既定は拒否。すべての入口で、ログインと「この行を触ってよい人か」を確かめる。DB 側とアプリ側の両方で止める（API1、API5）。
- 古いアプリ版は動き続ける。利用者がいつ更新するかは分からない。契約と DB は足すだけにし、壊す変更は「足す、移す、消す」の3段に分ける。
- モバイル回線では失敗と再送が起きる。冪等にし、一覧に上限を付け、エラーの形をそろえる。
- 消せる、戻せる、見える。削除の経路、マイグレーションの戻し、復元の手順、ログと指標を用意する。
- 秘密と個人情報は、コード、ログ、エラーの本文に出さない。費用と回数に上限を付ける（API4）。
- 強いモデルでも安全なコードになるとは限らない（AI が書いたコードは45%のタスクで脆弱性があった。Veracode）。安全はテストとコマンドの出力で示す。

## 2. 作業の順番
1. **読む**：PRD の AC、技術設計メモ（docs/adr/features/F.md）の 2、4、5、7、contracts/openapi.yaml、ADR、test-plan、contracts/dependencies.md。
2. **表を先に作る**：4章の型で backend/docs/F.md を作り、対応表に今回の operationId をすべて並べ、認可の表（誰が、どの行に、何をできるか）を埋める。ログインなしで使える入口は理由を書く。契約の不足や矛盾は自分で直さず「未解決」に書く。
3. **データを変える**（あれば）：マイグレーションは up と down の対で書く。NOT NULL、外部キー、一意は DB の制約にし、外部キーには索引を付ける。列の削除、改名、型の変更は3段に分け、今どの段かをノートに書く。
   - Postgres の場合：lock_timeout を設定し、索引は CONCURRENTLY で作り、制約は NOT VALID で足してから VALIDATE する。
4. **認可を DB に置く**（Postgres や Supabase の場合）：公開スキーマのすべての表で RLS を有効にする。ポリシーは select、insert、update、delete ごとに分け、`to authenticated` のように役割を明示し、`(select auth.uid())` の形で書く。ポリシーが絞る列には索引。利用者が書き換えられる user_metadata を認可に使わない。ビューは security_invoker にする。
5. **API を作る**：応答は項目を1つずつ選んで組み立て、ORM のオブジェクトをそのまま返さない。入力は型、長さ、範囲、列挙、件数で確かめる。更新できる項目は許可リストにし、本文を丸ごと ORM に渡さない。行の ID は推測できない値（UUID など）にする。
6. **失敗と再送**：
   - 作る POST は Idempotency-Key を受ける。同じキーと同じ中身なら最初の結果を返す。違う中身なら 422、前の要求が処理中なら 409、要るのにキーがなければ 400。キーを残す期間（例：24時間）をノートに書く。
   - 一覧はすべてページングする。page_size の上限を決め、超えたら上限に丸める。次のページのトークンは中身が読めない形にし、最後のページでは空にする。
   - エラーは RFC 9457（application/problem+json）で、type は契約の一覧どおり。detail にスタックトレースや SQL を出さない。
   - 外部 API にはタイムアウトと再試行の上限を付け、返ってきた応答も検証する（API10）。
7. **Apple と結ぶ所**（あるときだけ）：
   - Sign in with Apple：identity token をサーバーで検証し、/auth/token で得た refresh token をサーバーに保存する（削除のときの取り消しに使う）。
   - App Store Server Notifications V2：App Store Server Library で署名を検証し、notificationUUID で重複を捨て、保存してから 200 を返す。取りこぼしは Get Notification History で取り戻す。
   - 課金や価値の高い操作：App Attest の1回限りのチャレンジを出し、attestation と assertion をサーバーで検証する。
   - 最低対応版：ADR の形どおりに返す。版は文字列でなく数字で比べる（文字列だと "1.10" が "1.2" より小さくなる）。
8. **削除**：削除の地図（個人データの置き場所：表、Storage、外部サービス、ログ、バックアップ）ごとに、消し方と期限を書く。アカウント削除は、無効にするだけでなく消す。ゲストも消せる。Storage のファイルも消す。Sign in with Apple は /auth/revoke で取り消し、consent-revoked の通知でも消す。終わったら利用者に知らせ、法律で残すものがあればそれも知らせる。
9. **乱用、費用、ログ**：
   - ログイン、確認コードの送信、AI の呼び出し、アップロードに利用者ごとの上限を付け、超えたら 429 と Retry-After。アップロードのサイズにも上限。外部サービスごとに「1回の費用 × 想定の回数」の月額をノートに書く。
   - ログは JSON。入れる：時刻、request_id、仮名の利用者 ID、操作、結果、状態コード、かかった時間。出さない：パスワード、トークン、セッション ID、鍵、接続文字列、メールなどの個人情報。入力の改行は消す。
   - 必ず残す出来事：認証の成功と失敗、認可の失敗、入力検証の失敗、アカウント削除、管理の操作。指標は遅延、量、エラー、飽和の4つ。アラートは症状にもとづき、受けた人がすぐ動けるものだけにする。
10. **インフラはコードで**：スキーマ、RLS、バケット、関数、定期実行の設定をすべて backend/ に置く。空の DB から1つのコマンド（例：`supabase db reset`）で同じ状態を作れること。
11. **確かめる**：3章のテストを書き、本物の DB（例：`supabase start`、Testcontainers）で動かす。5章のコマンドを動かし、出力をノートの 8 に貼る。RUNBOOK を更新し、6章のチェックリストをノートの末尾に写して印を付ける。

## 3. 書くテスト（当てはまるものはすべて。テスト名を対応表に書く）
- 交差：ユーザー B が A の ID で GET、PATCH、DELETE を送ると、契約どおり 404 か 403。ID を受け取るエンドポイントごとに1つ以上。
- 割り当てすぎ：本文に role、user_id、is_admin を混ぜても保存されない。
- 冪等：同じキーで2回送ると行は1つだけ増える。同じキーで違う中身なら 422。
- 上限：page_size=100000 で上限の件数だけ返る。回数の上限を超えると 429 と Retry-After。
- エラーの本文：わざと 500 を起こし、本文に traceback も SQL もない。
- ログ：テストで出たログに、禁止のパターン（トークン、パスワード、メールの形）が0件。
- 削除：削除の後、その user_id の行をすべての表で数えると0、Storage の一覧も0。
- 通知（あるとき）：偽の署名で 4xx。同じ notificationUUID を2回送っても処理は1回。
- Postgres の場合：pgTAP（`supabase test db`）で、別のユーザーの行が0件。

## 4. 実装ノートと RUNBOOK の型
backend/docs/F.md は次の節で書く。
1. 契約との対応表：operationId、実装ファイル、認可のルール、テスト名
2. 認可の表と交差テストの結果。ログインなしの入口と理由
3. データの変更：マイグレーション名、up、down、up のログ、3段のどこか、squawk の出力
4. 互換性：oasdiff breaking の出力と、最低対応版への影響
5. 失敗の扱い：冪等にした操作とキーの期間、ページの上限、エラーの type の一覧
6. 個人データと削除の地図
7. 運用：ログの項目、指標、アラート、回数の上限、月額の見積もり
8. 実行したコマンドと出力：テストの件数と 5章のコマンド
9. 未確認のこと

backend/RUNBOOK.md：環境変数の名前の一覧（値は書かない）、Takuma が行うデプロイと戻しの手順、バックアップの方式と復元の手順と最後に試した日、アラートごとの対処、削除で手作業が残る所、外部サービスの利用上限と請求アラートの設定。

## 5. 使うコマンド（ADR の構成にあるものだけ。道具がなければ入れ方を1回だけ試し、だめなら「未検査」と理由）
- 契約との差：`schemathesis run contracts/openapi.yaml --url http://localhost:<port>`（スキーマ違反と契約にない状態コードが0件）。ルート一覧を出すコマンドの出力と、契約の operation の差が0。
- 互換性：`git show origin/main:contracts/openapi.yaml > /tmp/openapi-main.yaml && oasdiff breaking --fail-on ERR /tmp/openapi-main.yaml contracts/openapi.yaml`（main に契約がなければ「新規」）
- マイグレーション：`squawk <マイグレーションのファイル>` の指摘が0件。up、down、up を流したログ。
- Supabase：`supabase db reset`、`supabase test db`、`supabase db advisors`（security の指摘が0件。CLI 2.81 以降。旗は `--help` で確かめる）
- 秘密：`gitleaks dir backend` の指摘が0件。
- 鍵の混入：`grep -rnE 'service_role|SERVICE_ROLE' backend/`。利用者の要求を処理するコードに出たら直す。
- 依存：lockfile のパッケージが、すべて contracts/dependencies.md にある。

## 6. チェックリスト（ノートの末尾に写して印を付ける）
- [ ] 対応表の行の数が、技術設計メモの 4 の表の operation の数と同じ。
- [ ] 交差テストの数が、ID を受け取るエンドポイントの数以上。
- [ ] 3章のテストのうち当てはまるものが、本物の DB で通ったログがある。
- [ ] schemathesis、oasdiff、squawk、advisors、gitleaks の出力がある（使わない道具は「対象外」と理由）。
- [ ] マイグレーションの up、down、up のログがあり、列を消す変更は最低対応版より後になっている。
- [ ] 削除の地図の行ごとに、テストか RUNBOOK の手作業の手順がある。
- [ ] 環境変数の名前が RUNBOOK にあり、値はコードにもログにもない。
- [ ] 外部サービスごとに、月額の見積もりと、利用上限か請求アラートがある。
- [ ] 報告の「自己点検」に API1 から API10 の10行がある。

## 7. よくある失敗と見つけ方
| 失敗 | 見つけ方 |
|---|---|
| RLS を切る、`using (true)` でテストを通す | advisors の 0013（public の RLS 無効）と 0024（緩すぎるポリシー）、pgTAP の交差テスト |
| service_role で RLS を素通りする | 5章の grep。reviewer も確かめる |
| 他人の ID で読める（BOLA） | 交差テストの数がエンドポイントの数より少ない |
| 本文を丸ごと保存する | role や is_admin を混ぜるテストがない |
| 契約とずれる、余分な項目やルートがある | schemathesis、ルート一覧と契約の差 |
| 存在しないライブラリを書く（AI が作る名前は5%から22%） | dependencies.md と lockfile の差、公式 URL がない |
| 古いアプリを壊す（削除、改名、必須化） | oasdiff breaking の出力が空でない |
| 戻せない、表をロックするマイグレーション | squawk の指摘、up、down、up のログがない |
| 再送で二重に作る、二重に課金する | 同じキーで2回送るテストがない |
| 一覧に上限がない、エラーに SQL が出る | page_size の巨大な値のテスト、500 の本文のテスト |
| ログに秘密や個人情報、ログ注入 | ログの検査テスト、gitleaks |
| 削除の取りこぼし（Storage、外部、SIWA の取り消し） | 削除の地図の行ごとのテスト |
| DB をモックしただけで「通った」 | 本物の DB で動かしたログがない |
| 課金通知の署名を見ない、2回処理する | 偽の署名のテスト、同じ UUID のテスト |
| 費用が止まらない | RUNBOOK に上限と請求アラートがない |

## 8. 参考
- OWASP：https://owasp.org/API-Security/editions/2023/en/0x11-t10/ https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html https://owasp.org/www-project-application-security-verification-standard/
- Apple：https://developer.apple.com/support/offering-account-deletion-in-your-app https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple https://developer.apple.com/documentation/appstoreservernotifications/responding-to-app-store-server-notifications https://github.com/apple/app-store-server-library-python https://developer.apple.com/documentation/devicecheck/establishing-your-app-s-integrity
- Supabase：https://supabase.com/docs/guides/database/postgres/row-level-security https://supabase.com/docs/guides/database/database-advisors https://supabase.com/docs/guides/local-development/testing/overview https://supabase.com/docs/guides/platform/backups
- API の形：https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header https://docs.stripe.com/api/idempotent_requests https://www.rfc-editor.org/rfc/rfc9457.html https://google.aip.dev/158 https://martinfowler.com/bliki/ParallelChange.html
- 道具：https://github.com/oasdiff/oasdiff https://schemathesis.readthedocs.io/en/stable/quick-start/ https://squawkhq.com/docs/ https://github.com/gitleaks/gitleaks https://www.docker.com/blog/testcontainers-testing-with-real-dependencies/
- 運用：https://sre.google/sre-book/monitoring-distributed-systems/ https://12factor.net/config
- AI のコードの危うさ：https://www.veracode.com/press-release/ai-generated-code-poses-major-security-risks-in-nearly-half-of-all-development-tasks-veracode-research-reveals/ https://nvd.nist.gov/vuln/detail/CVE-2025-48757 https://www.darkreading.com/application-security/ai-code-tools-widely-hallucinate-packages
