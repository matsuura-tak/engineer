---
name: craft-tech-lead
description: tech-lead 役の詳しい手順と確かめる基準。tech-lead のサブエージェントが起動時に読み込む。指揮役やほかの役は使わない
user-invocable: false
---

# tech-lead の手引き

役のファイル（.claude/agents/tech-lead.md）の判断基準を、手順と確かめる基準にしたものです。
設計の跡は、技術設計メモ（docs/adr/features/F.md）、contracts/、docs/adr/ に残します。reviewer はそれだけを見て判定します。
以下、機能名を F、契約のフォルダ（app.json の paths.contracts）を contracts/、iOS のフォルダ（paths.ios）を ios/ と書きます。

## 1. 原則
- 作る前に決める。契約とデータモデルは作り手が書き始める前に1つにし、食い違いは紙の上で消す。
- 契約は機械で守らせる。iOS は Swift OpenAPI Generator（ビルド時に生成する Swift パッケージのプラグイン）で contracts/openapi.yaml からクライアントを作り、ずれたらビルドが落ちる形にする。生成の入力は写しでなく、contracts/openapi.yaml を指すシンボリックリンクにする。
- 単純さが先。標準を先に使う：URLSession、SwiftData、Keychain、CryptoKit、Logger、MetricKit、StoreKit 2、BackgroundTasks、AuthenticationServices。TCA のような設計用フレームワーク、自作の DI、マイクロサービスは入れない（要るなら ADR）。
- 目標は「数字と測り方」の組。測り方のない行は目標ではない。
- ADR にするのは元に戻しにくい判断だけ。代わりの案、悪い結果、見直す条件まで書く。
- 証拠は公式ドキュメントの URL か実際のビルドの出力。AI は存在しない API やパッケージ名を出すことがある。確かめていないものは「未確認」。
- 古い版のアプリは使われ続ける。API は同じ大きな版の中で足すことだけにする（Google AIP-180）。

## 2. 作業の順番
### G0 実現できるかの判定（何も書かず、報告だけ）
1. PRD の第1部（1〜8）と末尾の「G0 の前の確認」、11（受け入れ条件）、12（非機能要件）、15（イベント）、16（収益化）、17（審査と法務）と、既存の contracts/、docs/adr/、CLAUDE.md を読む。
2. 報告の「## 証拠」に、全 AC の表を入れる：AC 番号、判定（今の構成で作れる / 新しい API が要る / 新しい依存が要る / 未確認）、根拠の URL かコマンド。
3. 「未確認」は spike（小さく試すビルド）で確かめる。spike はリポジトリの外（スクラッチパッド）で作り、コマンドと出力を書く。確かめられなければ FAIL にするか、Takuma に決めてもらう項目にする。
4. 審査と権限で問題になりそうな箇所を並べる：バックグラウンドの実行、通知、entitlement、カメラや位置などの権限、外部の AI に送るデータ。
5. 月の費用を1行で見積もる：サーバー代と外部 API 代を、利用者1,000人あたりで。根拠の料金ページの URL を付ける。
6. 12 に数字か測り方のない行があれば「要修正」。15 のイベントごとに、アプリとサーバーのどちらで取れるかを確かめる。
7. 第1部（1〜8）と末尾の「G0 の前の確認」を、pdm の印を信じずに1項目ずつ確かめ、表（項目、満たす / 満たさない、証拠の PRD の行）を「## 証拠」に入れる。満たさない項目は重大。
8. 3 の競合の URL を1件以上 WebFetch で開き（断られたら Bash の curl）、引用した不満がページにあるかを見る。開いた URL と結果を書く。ない引用は重大。

### G1 デザインの判定（まだ契約はない。報告だけ）
1. design/F.md の画面と状態ごとに、要るデータと操作を書き出し、「要る operation の案」として報告に並べる。
2. 標準部品から外れた独自部品ごとに、作る手間と、Dynamic Type や VoiceOver を作り直す範囲を書く。理由のない独自部品は「要修正」。
3. オフラインと権限を断られたときの表示が、作れる動き（端末に何を置くか）と合っているかを確かめる。

### G1 設計（書く作業）
1. docs/adr/ に土台の ADR がなければ、先に「iOS の土台」の ADR を書く。決めること：
   - 最低の対応 OS（@Observable と SwiftData を使うなら iOS 17 以上）。ビルドは Xcode 26 と iOS 26 SDK（2026年4月28日からの App Store の条件）。
   - Swift 6 の言語モード、並行性の検査は「完全」、警告は0件。重い処理は @concurrent、複数の場所から変える状態は actor。
   - 既定の actor 分離をパッケージごとに表で決める（Xcode 26 の新しいアプリは MainActor が既定）。ローカルの Swift パッケージは Xcode の設定を受け継がないので、Package.swift の swiftSettings に書く（例：`.defaultIsolation(MainActor.self)`）。
   - モジュールはローカルの Swift パッケージで3つまで（例：生成した API クライアント、ドメインと保存、画面）。依存は一方向。
   - 強制アップデート：アプリが自分の版をヘッダーで送り、サーバーが動かせる最低の版を返す。v1.0 より前に入れる。
2. docs/templates/adr.md の A を写して docs/adr/features/F.md を作り、1 から順に埋める。長さは1から3ページ。
3. 契約（contracts/openapi.yaml、OpenAPI 3.1）を書く。
   - どの operation にも operationId、成功とエラーの例、認証の要否を書き、description に AC 番号を書く。
   - エラーは RFC 9457 の application/problem+json にそろえ、type ごとにアプリに出す文言（design/ の文言表の項目）を決める。
   - 何かを作る POST は Idempotency-Key ヘッダーを受け付ける（オフラインから送り直しても二重に作らないため）。
   - 返す enum に値を足すときは、古いアプリが知らない値を unknown として扱えるかを確かめ、その decode のテストを verifier に頼む項目に書く。
4. データモデルを決める。SwiftData は最初の版から VersionedSchema で包み、変えるたびに新しい版と MigrationStage を足す。サーバーの DB は「足す、移す、消す」の3段階で変え、書き込みをやめた列を同じリリースで消さない。
5. 依存を足すときは、パッケージの URL を開き、実際に解決してビルドしてから contracts/dependencies.md に足す。表に次の列がなければ足す：固定した版、ライセンス、最後の更新日、Swift 6 と対応 OS、Apple の「よく使われる SDK」の一覧に載るか、プライバシーマニフェスト、代わりの標準フレームワーク、外す手間。Package.resolved はコミットする形にする。
6. 下の「使うコマンド」で契約を検査し、出力を設計メモの 4 に貼る。
7. 元に戻しにくい判断ごとに、ひな形の B で ADR を書く。
8. CLAUDE.md のビルドとテストのコマンドは、実際に動かしたものだけ書く。
9. 設計メモ末尾の「確かめ」に印を付け、付けられない項目を報告の「## 未解決」に書く。

### G2 受け入れテストの判定（verifier の変更。報告だけ）
verifier と reviewer は同じモデルなので、別のモデルの判定役として見る。
1. 表を作る：AC 番号、テストの名前、使う operationId とつなぎ口（launch arguments、データの投入）、確かめている結果。テストのない AC は重大。
2. テストが使う operationId、つなぎ口、accessibilityIdentifier が、すべて contracts/ と design/F.md の6章にあるかを grep で確かめる。ないものは重大。
3. `grep -rn '\.exists' <受け入れテストのフォルダ>` で、要素の有無だけを見る確かめを探す。AC の結果（保存された、送られた）を見ていなければ要修正。
4. docs/verification/F/evidence/red.log を読み、落ちた理由が「まだない」（404、識別子が見つからない）ことを確かめる。ビルドや import のエラーなら重大。

### G5 プライバシー表記の判定（報告だけ）
metadata/ のプライバシー表記の下書きを、G4 の reviewer の報告にあるデータの流れの表と、PRD の 15 のイベントの表と1行ずつ照らす。下書きにない収集、区分の違い、追跡の有無の違いは重大。

### 頼まれたとき：実装が契約と ADR に従っているかの判定
下の grep を動かし、理由が ADR かコードのコメントにない行を数えて指摘に書く。oasdiff で、実装の PR が契約を変えていないかも見る。

## 3. 使うコマンド
- 形式：`npx --yes @stoplight/spectral-cli lint contracts/openapi.yaml --ruleset contracts/.spectral.yaml`（ルールは `extends: ["spectral:oas"]` から始める）
- 互換性：`git show origin/main:contracts/openapi.yaml > /tmp/openapi-main.yaml && oasdiff breaking --fail-on ERR /tmp/openapi-main.yaml contracts/openapi.yaml`（main に契約がなければ「新規」と書く）
- 並行性の警告を黙らせた箇所：`grep -rnE '@unchecked Sendable|nonisolated\(unsafe\)|@preconcurrency' ios/`
- ログの個人情報：`grep -rn 'privacy: .public' ios/`
- ATS の例外：`grep -rn 'NSAllowsArbitraryLoads' ios/`
- 依存の固定：`git ls-files | grep Package.resolved`
- 道具がなければ入れ方を1回だけ試す（例：`brew install oasdiff`）。それでも動かなければ「未検査」と理由を書く。

## 4. チェックリスト（設計メモと ADR の中身は、ひな形の末尾の「確かめ」で見る）
- [ ] G0 の報告に、全 AC の実現性の表、審査と権限の項目、月の費用の1行、「G0 の前の確認」の表、開いた競合の URL がある。
- [ ] 「未確認」のすべてに、spike のコマンドと出力か、Takuma に決めてもらう項目がある。
- [ ] 設計メモの 2 の表の行の数が、PRD の AC の数と同じ（`grep -cE '^- AC-[0-9]+：' docs/prd/F.md` と比べる）。
- [ ] 契約の operationId の数と、2 の表に出る operationId の数が合う（`grep -c 'operationId:' contracts/openapi.yaml`）。
- [ ] spectral と oasdiff の出力が設計メモにある。oasdiff の出力が空でないなら、ADR と大きな版の上げがある。
- [ ] 新しい依存に、解決とビルドの出力があり、dependencies.md の全列が埋まっている。
- [ ] 新しい ADR に、本当に選べた案が2つ以上、悪い結果、見直す条件がある。
- [ ] CLAUDE.md のコマンドに、動かした出力があるか「未確認」と書いてある。

## 5. よくある失敗と見つけ方
| 失敗 | 見つけ方 |
|---|---|
| iOS とバックエンドで契約がずれる | 生成したクライアントのビルドが落ちる。バックエンドの契約テストが落ちる |
| 気づかずに互換性を壊す | oasdiff breaking の出力が空でないのに、ADR も版の上げもない |
| 存在しない API やパッケージを前提にする | 「確かめたこと」に URL もビルドの出力もない。解決かビルドが失敗する |
| 作り込みすぎ | 実装が1つしかない protocol がある。モジュールが3つを超えているのに理由がない |
| 形容詞だけの非機能の目標 | 設計メモの 6 に、数字か測り方が空の行がある |
| 後から書いた ADR | 検討した案が実質1つ。悪い結果、反論、見直す条件が空 |
| 並行性の警告を黙らせる | 上の grep で出た行に理由がない |
| メインスレッドを止める | Instruments の Hangs、MetricKit の hang の診断 |
| 移行を試していない | 前の版のストアを開くテストがない。列を消すのと書き込みをやめるのが同じリリース |
| 古いアプリが知らない値で落ちる | 知らない enum の値を含む JSON を decode するテストがない |
| ログに個人情報が出る | `privacy: .public` の行に理由がない |
| 脅威モデルを黙って飛ばす | 設計メモの 7 に、STRIDE の表も「新しい境界なし」もない |

## 6. 省いてよいもの
C4 の部品図とコード図。すべての部品への正式な STRIDE。重い評価会。アプリ側の OpenTelemetry（MetricKit と Logger で足りる。要るようになったら ADR）。

## 7. 参考
- Apple の条件と性能：https://developer.apple.com/news/upcoming-requirements/ https://developer.apple.com/documentation/xcode/understanding-hangs-in-your-app https://developer.apple.com/documentation/xcode/reducing-your-app-s-launch-time https://developer.apple.com/documentation/metrickit
- Apple の構成：https://developer.apple.com/documentation/swiftui/migrating-from-the-observable-object-protocol-to-the-observable-macro https://developer.apple.com/documentation/swiftdata/schemamigrationplan https://developer.apple.com/documentation/xcode/organizing-your-code-with-local-packages
- Apple のセキュリティと電池：https://developer.apple.com/support/third-party-SDK-requirements/ https://developer.apple.com/documentation/security/preventing-insecure-network-connections https://developer.apple.com/documentation/uikit/encrypting-your-app-s-files https://developer.apple.com/documentation/devicecheck/establishing-your-app-s-integrity https://developer.apple.com/documentation/backgroundtasks/choosing-background-strategies-for-your-app https://developer.apple.com/documentation/usernotifications/pushing-background-updates-to-your-app
- Swift：https://www.swift.org/blog/swift-6.2-released/ https://www.donnywals.com/setting-default-actor-isolation-in-xcode-26/ https://useyourloaf.com/blog/approachable-concurrency-in-swift-packages/ https://github.com/apple/swift-openapi-generator
- API：https://google.aip.dev/180 https://github.com/oasdiff/oasdiff https://github.com/stoplightio/spectral https://www.rfc-editor.org/rfc/rfc9457.html https://docs.stripe.com/api/idempotent_requests https://martinfowler.com/bliki/ParallelChange.html
- 設計の記録：https://c4model.com/diagrams https://adr.github.io/ https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions https://www.industrialempathy.com/posts/design-docs-at-google/
- セキュリティと運用：https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html https://mas.owasp.org/MASVS/ https://sre.google/sre-book/service-level-objectives/
