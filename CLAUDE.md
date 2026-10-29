# アプリの地図

このファイルはこのアプリの地図です。tech-lead（テックリード）が手入れし、100行以内に保ちます。
アプリ名と一言の説明は .claude/org/app.json の app_name と idea にあります。
組織の決まりは .claude/rules/org.md、関門は docs/org/gates.md、進み具合は docs/progress.md を読みます。

## 概要
- 何のアプリか：（G0 で PRD が決まったら、tech-lead が1〜2行で書く）
- 使う人：
- いまの段階：まだ機能はない

## ビルド/テストのコマンド
.claude/org/app.json の commands と同じものを書きます。CI は app.json の方を使います。
コマンドを変えたら、app.json の更新を Takuma に頼みます（.claude/ は Takuma だけが直せます）。
受け入れテストは、受け入れテストのフォルダの中の設定だけで動く形にします。
- iOS のビルド：（未設定）
- iOS のテスト：（未設定）
- バックエンドのテスト：（未設定）

## 構成
既定の場所です。app.json の paths を変えたら、この表も同じに直します。使わない行は消してかまいません。

| 場所 | 中身 | 書く役 |
|---|---|---|
| ios/ | iOS アプリ（SwiftUI）と単体テスト | ios-engineer |
| ios/AcceptanceTests/ | iOS の受け入れテスト | verifier |
| backend/ | API、DB、インフラのコードと単体テスト、実装ノート（backend/docs/）、運用手順書（backend/RUNBOOK.md） | backend-engineer |
| backend/tests/acceptance/ | バックエンドの受け入れテスト | verifier |
| contracts/ | API 契約、依存ライブラリの許可リスト（contracts/dependencies.md） | tech-lead |
| .gitignore、README.md、Makefile、fastlane/ など | ルートの設定ファイル | tech-lead |
| design/ | 調査（<機能名>-research.md）、画面の仕様、デザイントークン、文言 | designer |
| docs/prd/、docs/support/、metadata/ | PRD、サポートページ、ストア掲載文 | pdm |
| docs/adr/ | 技術判断の記録、機能ごとの技術設計メモ（docs/adr/features/） | tech-lead |
| docs/verification/ | テスト計画、検証レポート、証拠 | verifier |
| docs/progress.md、docs/reviews/、docs/approvals/ | 進捗、判定の記録、Takuma の承認 | 指揮役 |
| .claude/、.github/ | 組織の定義と CI（キットが管理） | Takuma だけ |

## このアプリだけの決まり
- （例：対応する iOS の最低バージョン、使う DB、名前の付け方。決まったら tech-lead が書く）
