---
name: craft-verifier
description: verifier 役の詳しい手順と確かめる基準。verifier のサブエージェントが起動時に読み込む。指揮役やほかの役は使わない
user-invocable: false
---

# verifier の手引き

役のファイル（.claude/agents/verifier.md）の判断基準を、手順と確かめる基準にしたものです。
深さは test-plan.md と verification.md の表に残します。判定役は、その表と証拠のファイルだけを見て確かめます。
Mac がない環境では、xcodebuild とシミュレーターが要る項目に「この環境では実行できない」と書き、できたことにしません。

## 1. 原則
1. 合否の基準は PRD の AC だけ。期待する結果は、実装を見る前に具体的な値で書き、後から読み替えない。
2. 深さはリスクで決める。利用者に大きな害が出るところほど、試す状態と技法を増やす（ISTQB）。
3. 画面のテストは主な流れに絞る。組み合わせの多い確認は API の受け入れテストに下ろす（テストピラミッド）。
4. 一度緑になっただけでは合格ではない。同じコミットで通ったり落ちたりするテストがある AC は「未検証」（Fowler）。
5. 証拠で判定する。コマンド、終了コード、件数、スクリーンショット、ログがそろわない PASS は出さない。
6. テストを直したくなったら止まる。止まってよいと決めておくと、AI がテストを書き換えて通すことが減る（ImpossibleBench：GPT-5 で54%から9%）。

## 2. 作業の順番
### G0（何も書かず、判定だけを返す）
1. AC ごとに Given、When、Then がそろい、Then に具体的な値（件数、文言のキー、状態の名前、秒数）があるかを見る。
2. 「適切に」「すばやく」「わかりやすく」など測れない言葉は、数値か例を求めて「重大」にする（G0 は FAIL）。
3. 空、エラー、オフライン、権限を断ったときの AC が PRD の11章にあるかを見る。なく、「なし」の理由もなければ「要修正」。
4. テストに要るつなぎ口（状態の初期化、データの投入、接続先の URL、時刻の固定）を挙げ、G1 で tech-lead が contracts/ に書くよう報告に書く。

### テストを書く（G1 の後、実装の前）
1. **読む**：PRD の11章と12章、design/<機能名>.md の5章（状態）、6章（識別子）、7章（文言のキー）、contracts/ だけ。読んだファイルを test-plan の冒頭に並べる。
2. **リスク表**：リスク、影響（大中小）、起きやすさ（大中小）、試す深さを書く。影響「大」は、自動テスト、状態の表の行、探索1本。影響「小」は代表のテスト1本。
3. **技法と値**：AC の形で技法を選び、test-plan の AC の表に技法と試す値を書く。
   - 入力がある：同値分割と境界値。最小、最小より1小さい、最大、最大より1大きい、空、空白だけ、絵文字、全角。
   - 状態が移る（下書き、送信中、完了など）：状態遷移表。正しい遷移はすべて。ありえない遷移（二度押し、保存中に戻る）も。
   - 条件が重なるルール：デシジョンテーブル。ルールの列ごとに1テスト。
   - 設定の組み合わせ（言語、文字の大きさ、ダーク、機種）：全部ではなくペアワイズ。不具合の多くは1つか2つの要素で起きる（NIST）。
   - 期待する結果に迷ったら、前の版、PRD の約束、同じアプリのほかの画面、標準や法律との一貫性を根拠として書く（HICCUPPS）。
4. **状態の表**：test-plan の9行を、自動、G4 の人、範囲外（理由）のどれかに決める。作り方は3章。
5. **つなぎ口**：使う launch arguments、データの投入、接続先、時刻の固定が contracts/ のどこにあるかを書く。なければ報告の「未解決」に tech-lead への依頼として書く。
6. **書く**：3章に従う。名前に AC 番号を入れる（AC-3 なら test_AC3_再起動後も残る）。AC のないテストは作らない。
7. **赤の証拠**：実行して、出力を evidence/red.log に残す。落ちた理由が「機能がまだない」こと（識別子が見つからない、404 など）を1行で書く。書き間違い（文法、つなぎ口の名前違い）で落ちていたら直してから残す。

### G3（PR の最新のコミットで）
1. コミット（`git rev-parse HEAD`）、Xcode の版、シミュレーターの機種と iOS の版、バックエンドの接続先を書く。
2. 再試行なしで、この機能の受け入れテストをすべて動かす。xcodebuild の -retry-tests-on-failure、pytest の --reruns を付けない。結果のファイル（.xcresult）はリポジトリの外（/tmp など）に置く。
3. **揺れ**：影響「大」の AC のテストと、一度でも落ちたテストを繰り返す。iOS は `-test-iterations 5 -run-tests-until-failure`、pytest は同じコマンドを5回。1回でも落ちれば不安定で、その AC は未検証。原因の型（待ち方、順番、時刻、外部サービス、後片付け）を書く。
4. **状態**：状態の表で「自動」にした行を動かす。言語と地域は test plan の構成（Application Language、Application Region）で ja と en を回す。
5. **回帰**：前の機能の受け入れテストをすべて動かし、機能ごとに件数を書く。
6. **アクセシビリティ**：design/<機能名>.md の全画面で performAccessibilityAudit() を呼ぶテストの結果を書く。通っても、VoiceOver の確認は G4 の人に回す。
7. **探索**：影響「大」のリスクごとに1本。チャーター（test-plan の6章）に沿い、30分か40操作で区切る。受け入れテストのフォルダに使い捨ての UI テストを書き、手順ごとにスクリーンショットと app.debugDescription を残す。終わったら消すか、不具合を再現するテスト（AC 番号つき）に直す。
8. **変更の確認**：`git log --oneline origin/main..HEAD -- <受け入れテストのフォルダ>` のいちばん下（いちばん古い）の行で、この機能のテストを最初に入れたコミットを探し、`git diff <そのコミット>..HEAD -- <受け入れテストのフォルダ>` を見る。変わった所ごとに PRD の根拠を書く。根拠のない変更が1つでもあれば FAIL。
9. **証拠**：スクリーンショットを .xcresult から evidence/ に書き出す（`xcrun xcresulttool export attachments --path <.xcresult> --output-path <evidence/>`。動かなければ --help で確かめる）。design/ の全画面と全状態をそろえる。通常の状態はライト、ダーク、AX5、英語の4通り（名前は <画面>_<状態>_<light|dark|ax5|en>.png）。
10. **まとめ**：4章の検査を数え、verification.md を埋める。AC の範囲の不具合は、再現するテストを先に足し、直す役を書く。

## 3. チェックリスト
画面のテスト（XCUITest）
- [ ] 要素は design/ の6章の accessibilityIdentifier で探す。表示の文字（app.buttons["保存"]）や並び順（element(boundBy:)）で探さない。例外はシステムの確認画面のボタンだけ。
- [ ] 待つのは waitForExistence(timeout:)、waitForNonExistence(timeout:)、wait(for:toEqual:timeout:) だけ。待ち時間は1か所の定数。
- [ ] 保存や変更のテストは、app.terminate() と app.launch() の後にも結果を見る。
- [ ] 状態はテストごとに launch arguments で作り直し、順番に頼らない。test plan は実行順をランダムにし、Automatic Screen Capture をオンにした。
- [ ] 権限は resetAuthorizationStatus(for:) で未回答に戻してから、断る操作をテストの中で書いた。あとから設定で断った場合も試した。
- [ ] 大きい文字は launch argument の `-UIPreferredContentSizeCategoryName UICTContentSizeCategoryAccessibilityXXXL` で、文字が切れず、ボタンが押せるかを見た。ダークは `xcrun simctl ui booted appearance dark`。
- [ ] 復帰は XCUIDevice.shared.press(.home) の後に app.activate()。入力の途中の内容が残るかを見た。
- [ ] スクリーンショットは XCTAttachment（lifetime は .keepAlways、名前は AC3_オフライン の形）。
- [ ] @testable import をしていない（画面のテストは外から操作するもの）。

API のテスト
- [ ] 本物の HTTP で呼ぶ。作り手のモジュールを import してモックしない。接続先は test-plan の4章のものだけ。
- [ ] 1つの操作で、状態コード、中身の形（contracts/ のスキーマ）、残った結果（POST の後に GET）の3つを見る。
- [ ] 失敗の側：認証なしは 401、他人のデータは 403 か 404（OWASP API1）、不正な入力は 400 か 422、同じ要求の二度送り。
- [ ] contracts/ が OpenAPI で、contracts/dependencies.md に Schemathesis があれば、スキーマとの食い違いと 500 を探した。
- [ ] テストごとに一意なデータを作る。ほかのテストが作ったデータに頼らない。

状態の作り方
- [ ] 前の版からの更新：前のタグのコードを `git archive <タグ> | tar -x -C /tmp/<機能名>-prev` で取り出してビルドし、simctl install してデータを作る。新しいビルドを消さずに上から入れて起動し、データが読めるかを見る。版を飛ばす更新も試す（更新で多い不具合は、前の版のデータを扱えないこと。Apple TN2285）。
- [ ] オフラインとサーバーエラー：接続先を、つながらない先か、500 やタイムアウトを返すスタブに向けた。
- [ ] 容量不足、電話などの割り込み：つなぎ口で失敗を入れたか、G4 の人に回して理由を書いた。

## 4. よくある失敗と見つけ方
数え方：`grep -rnE '<型>' <受け入れテストのフォルダ>`。件数を verification.md の6章に書く。sleep、飛ばす、再試行、中を覗く、AC の抜けは0件であること。ほかは0件でないものに1件ずつ理由を書く。
- sleep で待つ：`sleep\(|usleep|Thread\.sleep|time\.sleep|asyncio\.sleep`
- テストを飛ばす、失敗を許す：`XCTSkip|XCTExpectFailure|pytest\.mark\.skip|skipif|xfail|pytest\.skip|unittest\.skip`
- 再試行で緑にする：`-i 'retry|rerun'`。受け入れテストのフォルダと、verification.md に書いたコマンドの行。
- 表示の文字や並び順で探す：`(buttons|staticTexts|textFields|cells|switches)\["|element\(boundBy:` の結果を、design/ の6章の識別子と突き合わせる。
- 要素があるかだけを見る：`\.exists` を含む assert しかないテスト。保存のテストに app.terminate() の後の確認がない。
- 中を覗く：`@testable import`。バックエンドでは paths.backend の実装のパッケージの import。
- AC の抜けと、AC のないテスト：`grep -oE 'AC-[0-9]+' docs/prd/<機能名>.md | sort -u` と `grep -rhoE 'AC[0-9]+_' <受け入れテストのフォルダ> | sort -u` を突き合わせる。
- テストを実装に合わせた：2章 G3 の8の git diff に、PRD の根拠のない変更がある。
- 動かしていない PASS：コマンドに終了コードと件数がない。verification.md に書いたファイルが `ls` で見つからない。環境の欄が空。
- 順番に頼る：ランダム順や、1本だけで動かすと落ちる。
- 初めて起動したときしか試していない：状態の表に空欄がある。
- 指摘を盛る：AC にひも付かない指摘が「重大」になっている。探せと言われた検証役は何かを見つけてくるので、AC の外は「提案」にとどめる。

## 5. 報告に足す節
- G0：「## 指摘」に、AC ごとの測れない言葉と、足りない状態（空、エラー、オフライン、権限）。「## 証拠」に PRD の行。
- テストを書いたとき：「## 実行したコマンドと結果」に、赤の証拠のパスと、落ちた理由の1行と、4章の検査の件数。「## 未解決」に、tech-lead に頼むつなぎ口と、PRD との食い違い。
- G3：「## 証拠」に、コマンド、終了コード、件数（成功、失敗、飛ばした）、揺れの確認の回数と結果、4章の検査の件数、verification.md のパス。

## 6. 参考
- 非決定的なテスト（Fowler）：https://www.martinfowler.com/articles/nonDeterminism.html 、Google の不安定なテスト：https://testing.googleblog.com/2016/05/
- 大きいテストとシードデータ（Software Engineering at Google 14章）：https://abseil.io/resources/swe-book/html/ch14.html
- テストピラミッド：https://martinfowler.com/articles/practical-test-pyramid.html 、Given、When、Then：https://martinfowler.com/bliki/GivenWhenThen.html
- テスト技法とリスク（ISTQB CTFL v4.0）：https://istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/
- 組み合わせテスト（NIST）：https://csrc.nist.gov/Projects/automated-combinatorial-testing-for-software/combinatorial-methods-in-testing/interactions-involved-in-software-failures
- 探索テスト（SBTM、Bach）：https://www.satisfice.com/download/session-based-test-management 、チャーターの型：https://club.ministryoftesting.com/t/what-do-you-put-in-your-exploratory-testing-charters/39983
- 期待する結果の根拠（HICCUPPS、Bolton）：https://developsense.com/resource/Oracles.pdf
- Xcode の test plan：https://developer.apple.com/documentation/xcode/organizing-tests-to-improve-feedback 、待つ API：https://developer.apple.com/documentation/xcuiautomation/xcuielement
- アクセシビリティ監査：https://developer.apple.com/documentation/accessibility/performing-accessibility-audits-for-your-app 、https://developer.apple.com/videos/play/wwdc2023/10035
- 権限のリセットと割り込み：https://wwdcnotes.com/notes/wwdc20/10220 、テストの繰り返し：https://wwdcnotes.com/notes/wwdc21/10296
- 更新のテスト（TN2285）：https://developer.apple.com/library/content/technotes/tn2285/_index.html
- launch arguments：https://swiftbysundell.com/articles/launch-arguments-in-swift 、文字の大きさ：https://docs.appetize.io/guides-and-samples/test-accessibility-font-sizes
- シミュレーターのダーク：https://developer.apple.com/forums/thread/121115 、添付の書き出し：https://www.simplified.guide/_export/xhtml/xcuitest/screenshot-capture
- ImpossibleBench：https://arxiv.org/abs/2510.20270 、Claude Code のベストプラクティス：https://code.claude.com/docs/en/best-practices
- Schemathesis：https://github.com/schemathesis/schemathesis 、OWASP API Security Top 10 2023：https://owasp.org/API-Security/editions/2023/en/0x11-t10/
