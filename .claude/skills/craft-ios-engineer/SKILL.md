---
name: craft-ios-engineer
description: ios-engineer 役の詳しい手順と確かめる基準。ios-engineer のサブエージェントが起動時に読み込む。指揮役やほかの役は使わない
user-invocable: false
---

# ios-engineer の手引き

役のファイル（.claude/agents/ios-engineer.md）の判断基準を、手順と確かめる基準にしたものです。
どれも差分か報告に跡が残る形で行います。reviewer（G2）は、差分と報告だけを見て判定します。
Mac がない環境では、Mac が要る項目（ビルド、テスト、Preview の表示、Instruments）に「Mac で未確認」と書き、できたことにしません。

## 1. 原則
1. 事実で書く。AI が書く Swift で多い失敗は、存在しない API と古い API。公式の文書で名前と対応 OS を確かめ、ビルドが通るまでは使えたことにしない。
2. 標準の部品を先に使う。標準の部品なら、Dynamic Type、ダークモード、VoiceOver、Liquid Glass が自動で効く。自作の部品には効かない。
3. コンパイラに守らせる。並行処理の安全は Swift 6 の言語モードで確かめさせる。警告を黙らせる書き方で逃げない。
4. 全部の状態を作る。design/ の状態の表のマスは、どれも画面として存在させる。
5. 契約どおりに呼ぶ。項目名、省略できるか、日付の形、エラーの形まで contracts/ に合わせる。
6. 小さく出し、証拠を付ける。1回の変更は1つの AC か1つの層（モデル、通信、画面）だけにする。

## 2. 作業の順番
1. **読む**：PRD の AC、design/<機能名>.md の3章（標準部品）、5章（状態）、6章（識別子）、7章（文言）、contracts/、docs/adr/、test-plan.md。最低対応 OS とコマンドは CLAUDE.md で確かめる。
2. **範囲を決める**：今回満たす AC と触るファイルを決める。差分の目安は100行前後。数百行を超えそうなら、層ごとに分ける案を報告で出す。
3. **API を確かめる**：新しく使う Apple の API を1つずつ開き、5章の「API の確認」の表に書く。
   - developer.apple.com の文書は、URL の末尾に .md を付けて WebFetch すると本文が読める（そのままでは本文が空になる）。
   - 最低対応 OS より新しい API は、#available で分けるか、報告で聞く。
   - Takuma が Mac で Xcode の MCP（xcrun mcpbridge）をつないでいれば、文書の検索、ビルド、Preview の取り込みに使う。
4. **状態とモデル**：画面の状態を enum で書き、switch では default でまとめない。モデルは @Observable で書く。
5. **通信**：contracts/openapi.yaml があり、dependencies.md で許されていれば、swift-openapi-generator でクライアントを作る。手で書くなら、契約の例の JSON をデコードする単体テストを先に書く。
6. **画面**：design/ の3章の標準部品で組む。非同期の読み込みは .task { } で始める。状態ごとに #Preview("<画面>/<状態>") を置き、AX5 の文字とダークモードの Preview も1つずつ置く。
7. **文言と識別子**：design/ の7章のキーを String Catalog に入れる。6章の accessibilityIdentifier と VoiceOver のラベルを、名前を変えずに付ける。
8. **単体テスト**：状態の移り変わり、エラーの変換、デコードを Swift Testing で確かめる。
9. **検査と実行**：4章の検査を実行する。ビルド、単体テスト、受け入れテストを動かす。
10. **報告**：5章の節を埋め、3章で印を付けられない項目を「未解決」に書く。

## 3. チェックリスト
並行処理
- [ ] ADR に別の決めがなければ、Swift 6 の言語モードで、Default Actor Isolation は MainActor（Xcode 26 の新しいアプリの既定）。
- [ ] 重い処理だけを @concurrent の関数か actor に出した。
- [ ] DispatchQueue.main、Task.detached、@unchecked Sendable、nonisolated(unsafe)、@preconcurrency は、使ったら1件ごとに理由を報告に書いた。
- [ ] onAppear の中で Task { } を作っていない（.task なら画面が消えると止まる）。

SwiftUI と状態
- [ ] ObservableObject、@Published、@StateObject、@EnvironmentObject、@ObservedObject を新しく書いていない。@Observable、@State、@Environment、@Bindable を使う。
- [ ] body の中で Formatter を作っていない。並べ替えや絞り込みは、データが変わったときに計算して持っている。
- [ ] 一覧の1行のビューが、配列全体を読んでいない（読むと1件の変更で全部の行が描き直される）。
- [ ] 状態ごとの Preview、AX5 の Preview、ダークモードの Preview がある。

見た目とアクセシビリティ
- [ ] 文字は .body や .headline などのスタイルだけ。.font(.system(size:)) と、文字が入る場所の固定の高さがない。
- [ ] 色はシステムの色か、ライト、ダーク、高コントラストの値をそろえたアセット。画面のコードに Color(red:) がない。
- [ ] 押せるものは Button。onTapGesture は、押した位置や回数が要るときだけ。画像だけのボタンは Button("名前", systemImage:) にする。
- [ ] NavigationStack、toolbar、タブバーに自作の背景を付けていない（Liquid Glass を壊す）。

文言
- [ ] 画面に出る文字はすべて String Catalog（.xcstrings）を通る。Text の外では String(localized:) を使う。
- [ ] design/ の文言のキーは手で作るキーとして登録し、Xcode が作る記号（Text(.キー名)）で使う。打ち間違いがビルドのエラーになる。
- [ ] 翻訳する人向けのコメントがある。数で形が変わる文は Vary by Plural にした。ja と en の訳がないキーは0件。

通信と契約
- [ ] コードに書いたパスと項目名が、すべて contracts/ にある。
- [ ] 通信の前に「つながっているか」を調べていない。waitsForConnectivity を使うか、URLError（notConnectedToInternet、timedOut）をオフラインの表示とやり直しのボタンに変える。
- [ ] 契約にあるエラーごとに、出す文言の対応表がある。知らない値が来ても落ちない。

安全とプライバシー
- [ ] トークンはキーチェーンに置く。ログは os の Logger で、個人の情報には privacy: .private を付ける。print は残さない。
- [ ] 製品のコードに !、try!、as! がない。
- [ ] 依存を足したときと、理由の申告が要る API（UserDefaults、ファイルの日時、空き容量、起動からの時間）を使ったときに、PrivacyInfo.xcprivacy を直した。

性能
- [ ] 最初の画面を出す前に、通信、同期、重い初期化をしていない。
- [ ] 主スレッドを 250ms 以上ふさぐ処理がない（Apple の道具が hang と数える）。押してから反応が見えるまでの目標は 100ms 以内。
- [ ] 一覧のある画面は、Mac の Instruments（SwiftUI テンプレート）で長い body の更新を探し、直す前と後を記録した。
- [ ] 画面を閉じるとビューモデルが消える（weak 参照が nil になるテスト）。機能ごとに1回、-enableThreadSanitizer YES でテストを動かした。

テスト
- [ ] 単体テストは Swift Testing（@Test、#expect、#require）。入力だけが違うテストは @Test(arguments:) にまとめた。
- [ ] テストは並列で動くので、状態を共有しない。通信は URLProtocol の差し替えで止め、本物のサーバーにつながない。
- [ ] UI テストと性能の測定は XCTest。受け入れテストには触っていない。
- [ ] 新しい警告は0件。xcodebuild test に -resultBundlePath を付け、結果のファイルを残した。

## 4. よくある失敗と見つけ方
数え方：`grep -rnE --include='*.swift' --exclude-dir='*Tests' '<型>' ios/`（paths.ios が違えば読み替える）。件数を報告に書き、0件でないものは1件ずつ理由を書く。
- 並行処理を黙らせる：`DispatchQueue\.main|@unchecked Sendable|nonisolated\(unsafe\)|Task\.detached|@preconcurrency`
- 古い書き方：`ObservableObject|@Published|@StateObject|@EnvironmentObject|NavigationView|foregroundColor\(|\.cornerRadius\(|tabItem`
- 大きい文字で崩れる、色の直書き：`\.system\(size:|\.frame\(height:|Color\(red:|UIColor\(red:`
- VoiceOver で読めないボタン：`onTapGesture`
- 強制アンラップ：`[]A-Za-z0-9_)]!([^=]|$)`（文字列の中の ! も拾うので、目で確かめる）
- 秘密や個人情報の漏れ：`print\(|apiKey|secret`。UserDefaults にトークンを書いていないかも見る。
- 動いたふり：`-i` を付けて `TODO|FIXME|mock|dummy|sample|lorem`。仮の値が画面に出ていないかも見る。Preview の中だけで使うものは、理由に「Preview 用」と書く。
- 重い body：View のファイルで `Formatter\(\)|\.sorted|\.filter`
- プライバシーマニフェストの漏れ：`UserDefaults|creationDate|modificationDate|systemUptime|volumeAvailableCapacity` の結果を、PrivacyInfo.xcprivacy の NSPrivacyAccessedAPITypes と突き合わせる。
- 存在しない API、古い API：ビルドの失敗と非推奨の警告。「API の確認」の表で URL がない行。
- 状態の抜け：design/ の5章の列と、enum の case、#Preview の名前を突き合わせる。
- 契約とのずれ：契約の例の JSON をデコードするテストが落ちる。コードのパスが openapi.yaml にない。
- 大きすぎる差分、範囲の外の変更：`git diff --stat`
- 証拠のない「通った」：報告にコマンドと出力がなければ、gates.md の共通ルールで FAIL になる。

## 5. 報告に足す節
役のファイルの「報告の形」の節に、次を足す。reviewer は同じ表で確かめる。
- API の確認：| API | URL | 対応 OS | 最低対応 OS 以下か（違えば #available の場所） |
- 画面の状態と識別子：| 画面 | 状態（design/ の5章の列） | 実装の場所（ファイル:行） | Preview の名前 |。空欄は不可。「なし」の状態は design/ の理由を写す。続けて、6章の識別子の一致数（例：12/12）、ja と en がそろったキーの数と、そろっていないキーの数（0であること）。
- 実行したコマンドと結果：コマンド、終了コード、警告の数（うち新しいもの）、テストの件数（成功、失敗、飛ばした数）、結果のファイルのパス、4章の検査の件数、PrivacyInfo.xcprivacy を変えたかとその理由。3章の性能の確かめ（Instruments の前と後、weak 参照のテストの名前、Thread Sanitizer の実行の出力。Mac がなければ「未検証」）。

## 6. 参考
- AI が書く Swift で直すこと：https://www.hackingwithswift.com/articles/281/what-to-fix-in-ai-generated-swift-code 、https://github.com/twostraws/swiftui-agent-skill
- Default Actor Isolation：https://www.donnywals.com/setting-default-actor-isolation-in-xcode-26/ 、移行の進め方：https://github.com/swiftlang/swift-migration-guide/blob/main/Guide.docc/MigrationStrategy.md
- @Observable への移行：https://developer.apple.com/documentation/swiftui/migrating-from-the-observable-object-protocol-to-the-observable-macro
- SwiftUI の性能と Instruments（WWDC25 306）：https://developer.apple.com/videos/play/wwdc2025/306/
- String Catalog と記号（WWDC25 225）：https://developer.apple.com/videos/play/wwdc2025/225/
- Liquid Glass：https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass
- アクセシビリティの自動監査（WWDC23 10035）：https://developer.apple.com/videos/play/wwdc2023/10035/
- hang（250ms と 100ms）：https://developer.apple.com/documentation/xcode/understanding-hangs-in-your-app 、起動時間：https://developer.apple.com/documentation/xcode/reducing-your-app-s-launch-time
- メモリとスレッドの検査：https://developer.apple.com/documentation/xcode/diagnosing-memory-thread-and-crash-issues-early
- Swift Testing：https://developer.apple.com/documentation/testing/migratingfromxctest 、プライバシーマニフェスト：https://developer.apple.com/documentation/bundleresources/privacy-manifest-files
- 提出の要件（2026年4月28日から iOS 26 SDK が必須）：https://developer.apple.com/news/upcoming-requirements/
- 事前に接続を確かめない（Apple のフォーラム）：https://developer.apple.com/forums/thread/106344
- swift-openapi-generator：https://github.com/apple/swift-openapi-generator 、OWASP MASVS：https://mas.owasp.org/MASVS/
- Xcode 26.3 と MCP：https://www.apple.com/newsroom/2026/02/xcode-26-point-3-unlocks-the-power-of-agentic-coding/
- 小さい変更：https://google.github.io/eng-practices/review/developer/small-cls.html
