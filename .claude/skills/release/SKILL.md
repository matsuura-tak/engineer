---
name: release
description: G3 を通った機能をまとめて出す指揮役の手順。G4（外部 TestFlight 前）、G5（審査提出前）、G6（段階リリース）を進める。Takuma が /release で始める
disable-model-invocation: true
argument-hint: "[バージョン 例: 1.0.0]"
---

# /release：G4 から G6 まで進める

バージョン：$ARGUMENTS（空なら Takuma に聞く）。以下、バージョンを V と書く。

あなた（メインセッション）は指揮役。任せ方は /feature と同じで、作り手は1体ずつ、model は渡さない（fable が上限の間だけ、fable の役に model: "opus" を付ける。ガードの指示に従う）、作り手と判定役の往復は2回まで。
コミットは範囲を確かめてから指揮役が行い、main へのマージは Takuma に頼む（指揮役はマージしない）。
**【Takuma だけ】** の付いた作業は、指揮役もサブエージェントも行わない。手順と確認リストを1通で渡し、終わったら知らせてもらう。

委任指示書の型：

```text
目的：
入力ファイル：
出力ファイル：（判定役は「なし。報告の文章を返す」）
触ってよい範囲：
完了条件：（返してほしい証拠）
守るルール：役割ファイルと docs/org/gates.md に従う。範囲の外は直さず報告する。わからないことは推測で埋めず、質問として返す。
```

記録の置き場所：判定の報告は docs/reviews/release-V-<関門>-<役>-r<回>.md、Takuma の返事は docs/approvals/release-V-<関門>.md、進み具合は docs/progress.md に1行ずつ。記録は区切りごとに指揮役がコミットし、PR にして Takuma にマージを頼む。

## 0. 始める
1. CLAUDE.md、.claude/org/app.json、docs/progress.md、docs/org/gates.md を読む。
2. docs/progress.md から、この版に入れる機能を挙げる。G3 を通っていない機能は入れない。
3. main を最新にして `git switch -c release/V` を作り、開始と入れる機能を docs/progress.md に書き足す。

## 1. 準備
4. ios-engineer：アプリのバージョンを V にし、ビルド番号を上げる。ビルドとテストのコマンドと出力を返させる。
5. pdm：metadata/ にリリースノート、ストアの説明文、キーワード、プライバシー表記の下書き、ストアのスクリーンショットの計画 metadata/screenshots.md（順番、画面と状態、伝えること）、Accessibility Nutrition Labels の申告 metadata/accessibility.md（項目ごとに G3 の証拠のパス）を書く。docs/support/ にサポートページと FAQ を書く。初めての公開なら、プライバシーポリシーと利用規約の草案も docs/support/ に書く。
6. バックエンドに変更があれば、backend-engineer：本番に出す手順と戻す手順（ロールバック）を backend/ に書く。
7. 4〜6 は変更ごとに reviewer（観点はコード）と CI を通す（G2）。指揮役がコミットして PR にし、Takuma にマージを頼む。

## 2. G4 外部 TestFlight 前
8. verifier：入れる機能すべての受け入れテストを再試行なしで回帰として動かし、docs/verification/release-V/verification.md に書く（型は docs/templates/verification-report.md）。前の版が公開されていれば、前の版からの更新も必ず試させる。metadata/screenshots.md に従って、ストア用のスクリーンショットを docs/verification/release-V/evidence/store/ に撮らせる。
9. reviewer（観点はセキュリティとプライバシー）：BASE（前のリリースのタグ。初めてなら最初のコミット）を指示書に書く。MASVS の24項目、エンドポイントの認可、データの流れの表を作らせ、重大な指摘が0件なら PASS。第三者の AI に個人データを送るなら、同意の取り方（審査ガイドライン 5.1.2(i)）も見させる。
10. **【Takuma だけ】** ビルドを TestFlight に上げ、実機で確かめる。指揮役は、PRD の受け入れ条件から作った10項目以内の確認リストを渡す。
11. **【Takuma だけ】** 外部のテスターに配る。OK の返事を docs/approvals/release-V-G4.md に残して G4 通過。

## 3. G5 審査提出前
12. **【Takuma だけ】** バックエンドを本番に出す（6 の手順書を渡す）。出した後、verifier に本番を読むだけで確かめさせて記録する：ヘルスチェック、デモアカウントでのログイン、GET だけの API。本番のデータを作る、変える、消す操作はさせない（Takuma が名前を決めて承認したテスト用アカウントだけは例外）。
13. reviewer（観点は審査）：BASE と metadata/ のパスを指示書に書く。最新の App Review Guidelines と Upcoming Requirements を Web で開いてから、メタデータ、スクリーンショット、課金、ログインとアカウント削除、隠し機能、データ収集と同意、デモアカウント、審査メモを監査する。項目ごとに、番号、引用した文、URL と日付、証拠を書かせる。並列に、design-reviewer に、ストアのスクリーンショット、説明文、metadata/accessibility.md が実際の画面と対応に合うかを、tech-lead に、プライバシー表記の下書きが G4 の reviewer の報告のデータの流れの表と PRD のイベントの表に合うかを判定させる（掲載文を書く pdm と reviewer は同じモデルのため、別のモデルの2役を足す）。3体とも PASS で G5 の判定は通る。
14. **【Takuma だけ】** プライバシーポリシーと利用規約の最終承認。App Store Connect での入力と審査への提出。指揮役は、監査の結果と提出前のチェックリストを1通にまとめて渡す。
15. 提出したことを docs/approvals/release-V-G5.md に残す。却下されたら理由を記録し、直す役に任せてから 13 からやり直す。

## 4. G6 段階リリース
16. 公開の前に、止める基準を Takuma と決めて docs/approvals/release-V-G6.md に書く。例：クラッシュしないユーザーの割合が 99.5% を下回る、PRD の撤退基準に当たる、重大な不具合の報告がある。
17. **【Takuma だけ】** 段階リリースの開始、一時停止、再開、全公開。
18. 公開中は、指揮役が数字（Takuma からもらうか、見られる範囲で集める）を基準と比べ、続けるか止めるかの推奨を1通で出す。決めるのは Takuma。
19. 全公開したら、提出したビルドのコミットに `git tag v<V>`（例：v1.0.0）を付けて push する。docs/progress.md に完了を書き足し、`/retro release-V` を勧める。

## 止まるとき
- iOS のビルドやシミュレーターが要るのに Mac でないときは、そのステップを「未検証」とし、Mac で続けるよう Takuma に頼む。
- App Store Connect の API キー、署名の証明書、本番の接続情報が要る作業は、エージェントに渡さず Takuma に頼む。
- 元に戻せない操作（提出、本番デプロイ、課金の設定、データの削除）は、頼まれても指揮役とサブエージェントは行わない。手順を渡して Takuma に行ってもらう。
