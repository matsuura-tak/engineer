---
name: feature
description: 1つの機能を G0（PRD承認）から G3（機能完了）まで進める指揮役の手順。Takuma が /feature で始める
disable-model-invocation: true
argument-hint: "[作りたい機能の説明 または 続ける機能の番号]"
---

# /feature：1つの機能を G0 から G3 まで進める

依頼：$ARGUMENTS

あなた（メインセッション）は指揮役。各ステップを決められた役に任せ、自分では PRD、デザイン、契約、コード、テストを書かない。
関門の合格条件は docs/org/gates.md、成果物の型は docs/templates/ にある。

## 0. 始める
1. CLAUDE.md、.claude/org/app.json、docs/progress.md、docs/org/gates.md を読む。
2. 依頼が「003」や「003-photo-upload」のように既存の機能を指すなら、`git branch --list 'feat/<番号>*'` と `git branch -r --list 'origin/feat/<番号>*'` でブランチを探して `git switch` し、そのブランチの docs/progress.md で最後の記録を探して、次のステップから再開する。
3. 新しい機能なら、docs/prd/ の最大の番号に1を足した3桁と、英小文字とハイフンの短い名前で機能名を決める（例：003-photo-upload）。以下、機能名を F と書く。
4. main を最新にして `git switch -c feat/F` を作り、docs/progress.md に開始を書き足す。

パスは app.json の paths に従う（以下は既定値で書く）。stacks にない領域のステップは飛ばす。ios がなければ画面のステップ（5a、5b、6 の design-reviewer、16 のスクリーンショット、17）も飛ばす。

## 任せ方（全ステップ共通）
Agent ツールの subagent_type に役の名前を渡す。isolation は渡さない。model も渡さないが、fable が上限にかかっている間は、fable の役（pdm、designer、verifier、reviewer）に model: "opus" を付ける（セッションの最初の知らせとガードの指示に従う）。毎回、次の委任指示書を書く。

```text
目的：（このステップで決めること、作るもの）
入力ファイル：（読むべきファイルをパスで全部）
出力ファイル：（作るファイルのパス。判定役は「なし。報告の文章を返す」）
触ってよい範囲：（その役の範囲のうち、今回使う部分だけ）
完了条件：（何ができたら終わりか。返してほしい証拠）
守るルール：役割ファイルと docs/org/gates.md に従う。範囲の外は直さず報告する。わからないことは推測で埋めず、質問として返す。コミットはしない。
```

- 作り手は1体ずつ呼び、結果が返ってから次を呼ぶ。判定役どうしは並列でよい。
- 判定役の報告（docs/templates/review-report.md の形）は、指揮役が docs/reviews/F-<関門>-<役>-r<回>.md に保存する。
- FAIL なら、指摘をそのまま作り手に渡して直させ、同じ役の判定役を新しく呼ぶ（r2）。r2 も FAIL なら3回目は回さず、指揮役が裁定する。指摘を退けるなら理由を docs/reviews/F-<関門>-ruling.md に書く。仕様や範囲を変える必要があるなら Takuma に上げる。
- PASS でも「要修正」の指摘があれば、同じ作り手に直させる。コードの直しは G2 を通す。
- 作り手を呼ぶ前に `git rev-parse HEAD` を BASE として控える。終わったら次を確かめる。
  - `git rev-parse HEAD` がまだ BASE と同じ（違えば、作り手が履歴を変えたので FAIL として Takuma に知らせる）。
  - `git diff --name-only BASE` と `git status --short --untracked-files=all` に出るファイルが、すべてその役の範囲の中。範囲の外があれば FAIL として戻す。
  - 範囲の中だけなら、指揮役がそのパスだけを `git add <パス>` して（`git add -A` は使わない）、`git commit -m "F <ステップ>（<役>）"` する。
- 関門を通るたびに、docs/progress.md に「日付、F、関門、PASS、根拠のファイル」を1行で書き足す。

## G0 PRD 承認
1. pdm：docs/templates/prd.md に従って docs/prd/F.md を書く。入力は依頼、app.json の app_name と idea、docs/prd/product.md（なければ先に作らせる）、既存の PRD。第1部（発見：競合と代替の調査、Job、前提、推奨）を先に書き、8 の推奨が「作らない」なら第2部を書かずに返させ、その推奨と理由を Takuma に送って止まる。わからない点は「Takuma に決めてほしいこと」に書く。
2. tech-lead（実現性、非機能要件、費用。AC ごとの実現性の表、審査と権限で気になる点、利用者1,000人あたりの月の費用。第1部と「G0 の前の確認」を印を信じずに確かめ、競合の URL を1件以上開く）と verifier（受け入れ条件がテストできるか。テストに要るつなぎ口の一覧）を並列で呼ぶ。2体ともこのステップでは何も書かず、判定だけを返す。FAIL なら pdm に直させる。
3. **【Takuma の関門】** PRD の要約（紹介文、Job、推奨といちばん強い反論、受け入れ条件の数、やらないこと、KPI、撤退基準）、判定の結果、決めてほしいことへの推奨を1通にまとめて承認を求め、ここで止まる。会話が途切れても `/feature F` で再開できると添える。
4. 承認の返事を、日付と一緒に、言い換えずにそのまま引用して docs/approvals/F-G0.md に残す。「いいね、でも…」のように条件が付いていれば承認とせず、その点を聞き直す。直しの指示なら pdm に戻して 2 からやり直す。承認の後で PRD を変えるときは、もう一度承認を取る。

## G1 設計
5a. designer（調査だけ）：docs/templates/design-research.md に従って design/F-research.md を書く。指示書に「調査だけ。仕様は書かない」と書き、PRD の 3 のアプリを競合の候補として渡す（見た目と操作の比較だけを足させる）。返ったら、このファイルだけをコミットする。
5b. designer：docs/templates/design-spec.md に従って design/F.md を書く（図は design/F/）。決定はすべて F-research.md の R-n と原則（HIG の URL か B-n）を根拠にさせる。5a と別のコミットにする（調査が先だったことを git log で示すため）。
6. design-reviewer（採点表。入力は PRD、F-research.md、F.md、design/ のトークン）と tech-lead（このデザインを今の構成で作れるか、契約に何が要るか）を並列で呼ぶ。まだ契約はない。
7. tech-lead：先に docs/adr/features/F.md（docs/templates/adr.md の A）を書き、続けて要る範囲で contracts/ に API 契約、docs/adr/ に ADR（同じ型の B）を書く。G0 で verifier が挙げたテストのつなぎ口（docs/reviews/F-G0-verifier-r<回>.md）も contracts/ に書く。契約は spectral と oasdiff で確かめ、出力を設計メモに貼る。使う依存ライブラリを contracts/dependencies.md に足す。CLAUDE.md の構成と、ビルドとテストのコマンド（受け入れテストは受け入れテストのフォルダの設定だけで動かす形）を決める。
8. reviewer（観点は設計）：BASE を指示書に書く。設計メモ、契約、ADR で PRD の受け入れ条件をすべて満たせるか、エンドポイントごとの認可、元に戻しにくい判断へのいちばん強い反論を、設計メモと ADR の「確かめ」を信じずに判定する。6 と 8 がすべて PASS で G1 通過。

## 受け入れテスト（実装より先）
9. verifier：PRD、design/F.md、contracts/ だけを読み、実装を見ずに受け入れテストと、それを動かす設定を受け入れテストのフォルダの中に書く（ios/AcceptanceTests/、backend/tests/acceptance/）。docs/templates/test-plan.md に従って docs/verification/F/test-plan.md（リスク表、AC ごとの技法と値、状態の表、つなぎ口）を書く。実装の前なので落ちるのが正しく、そのログを docs/verification/F/evidence/red.log に残させる。
10. reviewer（観点はテスト）と tech-lead（テストが contracts/ とつなぎ口どおりで、要素の有無ではなく AC の結果まで確かめているか）を並列で呼ぶ。verifier と reviewer は同じモデルなので、別のモデルの tech-lead を足す。2体の指示書に BASE と「今回は verifier の変更なので、受け入れテストの変更は範囲内」と書く。この変更は、org-check が緑で2体とも PASS なら G2 通過（スタックの CI は落ちるのが正しい）。
11. push して、`gh pr create --draft` で機能の PR を作る。

## 実装と G2（変更ごと）
12. **【Takuma の関門】** この機能で使う領域の app.json の commands（ios_test、backend_test など）が空なら、tech-lead が CLAUDE.md に書いたコマンドを Takuma に送り、止まる。空のままではその領域の CI が失敗し、G2 は通らない。.claude/ は Takuma だけが直せるので、Takuma に main で直してもらう（GitHub の画面で `.claude/org/app.json` を編集し、PR を作ってマージ。org-guard が赤いのは正しい）。マージされたら `git fetch origin && git merge origin/main` で機能のブランチに取り込む（機能の PR に .claude/ の変更を入れないため）。
13. backend-engineer、次に ios-engineer の順に呼ぶ。1体ごとに 14 と 15 を終えてから次を呼ぶ。入力は PRD、design/F.md、contracts/、docs/adr/（docs/adr/features/F.md を含む）、docs/verification/F/test-plan.md。backend-engineer には実装ノート backend/docs/F.md と backend/RUNBOOK.md の追記も出させる。完了条件は、app.json の commands のビルドとテストが通り、自分の領域の受け入れテストも通ること（通らなければテスト名と理由を返す）。実行したコマンドと出力を返させる。作り手のコマンドが CLAUDE.md と違えば、tech-lead に CLAUDE.md を直させ、12 と同じく Takuma に app.json を直してもらう。
14. コミットして push し、`gh pr checks --watch` で CI を待つ。その変更の領域のワークフロー、org-check、org-guard が緑であること。「飛ばしました」で終わったワークフローは緑に数えない。まだ作っていない側の受け入れテストが落ちているのは、次の作り手で直るので構わない。
15. reviewer（観点はコード）：控えた BASE の値と、作り手の報告（API の確認、画面の状態と識別子、自己点検などの表）をそのまま指示書に書き、`git diff BASE...HEAD` を判定させる。表の件数は reviewer が自分でコマンドを動かして確かめる。CI と reviewer が両方 PASS で、その変更は G2 通過。

## G3 機能完了
16. verifier：PR の最新のコミットで、この機能と前の機能の受け入れテストを再試行なしで動かす。影響「大」の AC のテストと一度でも落ちたテストは5回繰り返す。状態の表、画面ごとのアクセシビリティ監査、リスクごとの探索、受け入れテストの変更の確かめも行う。design/F.md の全画面と全状態のスクリーンショット（通常の状態はライト、ダーク、AX5、英語の4通り）を docs/verification/F/evidence/ に撮り、docs/templates/verification-report.md に従って docs/verification/F/verification.md を書く。
17. design-reviewer：スクリーンショット、監査の出力、verification.md を design/F.md と比べ、採点表で判定する。r2 では r1 の報告のパスも渡す。
18. どちらかが FAIL なら、原因の作り手に直させ（13〜15 と同じく G2 を通す）、16 からやり直す。往復は2回まで。
19. CI がすべて緑で、16 と 17 が PASS で、`git diff --name-only origin/main...HEAD -- .claude .github` が空なら G3 通過。空でなければ G3 を通さず、どの役がなぜ変えたかを Takuma に知らせる。通ったら docs/progress.md に「G3 PASS、Takuma のマージ待ち」を書き足してコミットし、push する。
20. **【Takuma の関門】** `gh pr ready` のあと、Takuma に1通で知らせ、マージを頼む：受け入れ条件ごとの合否、証拠の場所、残った課題、PR の URL。指揮役はマージしない（マージで本番に出ることがあり、それは Takuma だけが行う）。
21. マージされたら `/retro F` を勧める。

## 止まるとき
- iOS のビルドやシミュレーターが要るのに Mac でない（`uname` が Darwin でない）ときは、そのステップを「未検証」とし、Mac で続けるよう Takuma に頼む。未検証のまま G3 を通さない。
- 作り手が「受け入れテストが PRD と合わない」と言ったら、verifier に PRD と照らして確かめさせる。作り手にテストを直させない。verification.md の「PRD とテストの食い違い」に行があれば、pdm に PRD を確かめさせるか、Takuma に聞く。
- 役から「入力が足りない」「範囲の外を直す必要がある」と返ってきたら、自分で直さず、その範囲の役に任せるか Takuma に聞く。
- ガードに書き込みを止められたら、範囲を広げず、正しい役に任せ直す。範囲の外の変更を元に戻すのは `git restore <パス>` で指揮役が行ってよい。
- gh が使えない環境では、PR の作成と CI の確認を Takuma に頼む。その間は作り手と verifier が実行したコマンドの出力を証拠にする。
