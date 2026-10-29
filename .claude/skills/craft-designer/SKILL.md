---
name: craft-designer
description: designer 役の詳しい手順と確かめる基準。designer のサブエージェントが起動時に読み込む。指揮役やほかの役は使わない
user-invocable: false
---

# designer の手引き

役のファイル（.claude/agents/designer.md）の判断基準を、手順と確かめる基準にしたものです。
どれも design/<機能名>-research.md（調査）と design/<機能名>.md（仕様）に跡が残る形で行います。審査役は書いた文書だけを見て判定します。

## 1. 原則
### 土台：HIG と標準 UI
- HIG の Design principles を土台にする。とくに次の4つ。
  - 既存の解決策を調べ、作り直さない。自分の製品の違いを決める。
  - 起こしたい感情を決め、決定的な瞬間を作る。
  - 喜びを飾りと取り違えない。
  - 知られた型を、画面全体で一貫して使う。
- 標準部品を先に使う：NavigationStack、TabView、List、Form、sheet、alert、confirmationDialog、ContentUnavailableView、ProgressView、searchable、refreshable、Label、SF Symbols。
- 標準部品は、Dynamic Type、ダークモード、VoiceOver、システムの新しい見た目に自動で付いてくる。独自部品は付いてこない。
- 標準から外れるのは、標準部品では AC か「差をつける点」を満たせないときだけ。本来の標準部品、理由、アクセシビリティの対応を仕様に書く。
- Liquid Glass は操作とナビゲーションの層だけに使う。内容の層（背景、一覧の行）には使わず、標準の素材にする（HIG Materials）。

### 軸：バウハウス（様式ではなく方法。仕様では B 番号で引く）
- B-1 機能が形を決める。画面ごとに「この画面の仕事」を1文で書く。どの要素も、その仕事か AC に結びつける。結びつかない要素は消す。
- B-2 本質まで削る。目立つ主操作は1画面に1つ。意味のないグラデーション、影、イラストは置かない。置くなら理由を書く。
- B-3 グリッドで明快にする。余白はトークン（4、8、12、16、24、32pt）だけを使う。画面ごとに、要素をそろえる縦の線を決める。
- B-4 文字は伝達の道具。システムの text style だけを使い、1画面に3段を目安に、多くても4段。書体は1つ。階層は大きさと太さで作る。Ultralight、Thin、Light は使わない。
- B-5 色は目的のためだけに使う。アクセント色は主操作と状態にだけ。色は意味（成功、警告、エラー、選択）ごとのトークンにし、色だけで意味を伝えない。
- B-6 芸術と技術を一つにする。システムの機能（Dynamic Type、ダークモード、SF Symbols、システムの素材）を生かして形にし、使う text style、SF Symbols、素材の名前を仕様の 8 に書く。
- しないこと：赤黄青や円三角四角を並べた「バウハウス風」の飾り。

## 2. 作業の順番
指示書が調査だけを頼んでいれば、4 で止めて報告する。
1. **読む**：PRD（1 紹介文、2 中心の Job、3 競合と代替、10 やらないこと、11 AC）、design/ の既存のトークンと画面、contracts/ を読む。決めたいことと関係する AC を、research の「1. 問いと範囲」に書く。
2. **競合を選ぶ**：直接の競合を2から4本（NN/g の推奨）と、別カテゴリーの手本を1本選ぶ（Apple Design Awards の受賞アプリなど）。選んだ理由を書く。PRD の 3 のアプリから選び、見た目と操作の比較だけを足す（同じ調べものをやり直さない）。
3. **競合を調べる**（research の3と4）
   - App Store のページを WebFetch で開き、評価、説明、レビューを読む。不満の上位3つを、引用と URL で書く。
   - 見た目は公式サイトやプレス素材で確かめる。App Store の画面写真は取れないことが多い。見られなかったものは「見ていない」と書き、作らない。
   - 比べる表を埋める：主な作業のタップ数、ナビゲーションの構成、最初の価値までの画面数、空の状態、権限の求め方、色、文字、密度、文言の調子。
4. **ターゲットと方向を決める**（research の2と5から8）
   - 仮のペルソナを「仮説」と明記して書く。使う場面（片手か、移動中か、何秒か）、起こしたい感情、見た目の好み、アクセシビリティで必要なことを書く。根拠はレビューなどの引用にする。
   - 色の量と情報の密度は、ターゲットに合わせて根拠付きで決める。好みは性別、学歴、国で変わる（Reinecke と Gajos 2014）。
   - ブランドの性格語を3から5語決め、語ごとに「意味すること、意味しないこと」を書く。文言の調子は NN/g の4軸で位置を決める。
   - 「合わせる当たり前」と「差をつける点」1から2個（決定的な瞬間）を決める。
   - 方向性の案を2つ書き、性格語とターゲットに照らして1つ選ぶ。選ばなかった理由も書く。
   - 発見に R-1、R-2 と番号を振り、出典 URL と確認日を付ける。
5. **仕様を書く**（design/<機能名>.md）
   - 画面ごとに、仕事1文、主操作1つ、使う標準部品の名前を書く。
   - 決定表の各行に、R-n と原則（HIG の URL か B-n）を書く。根拠のない決定は書かない。
   - 状態、文言、権限、見た目、アクセシビリティを、3 のチェックリストの基準で書く。
6. **提出前に確かめる**：3 のチェックリストを上から見て、両方のテンプレートの最後にある「確かめ」に印を付ける。満たせない項目は、報告の「未解決」に書く。

## 3. チェックリスト
調査
- [ ] research は仕様より先に書いた。R が5つ以上あり、どの R にも出典 URL と確認日がある。
- [ ] 競合2つ以上と手本1つを調べた。レビューの不満は、引用と URL 付き。
- [ ] 見ていないものは「見ていない」と書いた。
- [ ] 差をつける点が1から2個あり、仕様のどの画面に表れるかを書いた。

画面と決定
- [ ] 全画面に、仕事1文、主操作1つ、標準部品の名前がある。標準から外れる所には、本来の部品、理由、アクセシビリティの対応がある。
- [ ] 取り消せない操作には、確認（confirmationDialog）か取り消しの手段がある。
- [ ] 決定表のすべての行に R-n と原則がある。R-n は research に実在する。
- [ ] 全画面に7つの状態がある：通常、空、読み込み中、エラー、オフライン、権限を断られたとき、一部だけ読めたとき（該当しなければ「なし」と理由）。
- [ ] 空とエラーは ContentUnavailableView などで「何が起きたか」と「次の一手のボタン」を出す。
- [ ] 読み込み中は形を先に出す（redacted）。長くかかるときは ProgressView。読み込み中に「0件」と出さない。

文言と権限
- [ ] ボタンは動詞にする。エラーは問題の近くに出し、何が起きたかとどう直すかを書く。責めない。入力を消さない。
- [ ] 正直である（Dieter Rams）：確かめられない言い方（「最高の」「かんたん」）と、だます画面（偽の確認、隠れた課金）がない。
- [ ] 日英がそろう。文字列をつなげない。数は String Catalog の複数形を使う。日付と数の書式を固定しない。日本語は禁則に従う。
- [ ] 権限は必要になったその時に、具体的な理由を添えて求める。事前の説明画面はボタン1つで、システムの確認を開くだけにする。報酬で釣らない。偽の確認画面を作らない。

見た目
- [ ] 余白、色、文字はトークンだけを使う。トークンは意味で名付ける（color.action.primary であって blue ではない）。
- [ ] システム色を優先する。独自の色には、ライト、ダーク、高コントラストの3つの値を用意する。
- [ ] SF Symbols は名前を書く。文字と同じ太さにする。塗りの記号は選択状態とタブに使う。ロゴやアプリのアイコンには使わない。
- [ ] 性格語ごとに、画面のどこに表れているかを1か所以上書いた。

アクセシビリティ
- [ ] 押せる範囲は 44x44pt 以上。
- [ ] コントラスト：17pt 以下の文字は 4.5:1 以上。18pt 以上か太字の文字と、アイコンや操作部品の枠は 3:1 以上。独自の色の組は、ライト、ダーク、コントラストを上げる設定の3通りで数字を書いた。
- [ ] いちばん大きい文字（AX5）で、横並びを縦並びに変える場所を書いた。
- [ ] 色だけで区別しない。動きを減らす設定と、透明度を下げる設定のときの見え方を書いた。
- [ ] VoiceOver の読み上げ順とラベル、テストで使う要素の accessibilityIdentifier を書いた。
- [ ] 英語が長くなっても切れないかを、疑似言語（Double-Length）で確かめる画面を書いた。

## 4. よくある失敗と見つけ方
| 失敗 | 見つけ方 |
|---|---|
| 調査が後付けか、作り話 | git log で research が仕様より後にできている。URL が開けない。引用がページにない |
| 根拠が形だけ | 決定表の空欄、research にない R 番号、同じ R ばかり引いている |
| 競合のまね | 差をつける点が空。画面の構成が競合と同じ |
| AI っぽい無難さ（既定の色のまま、紫のグラデーション、同じ角丸カードの並び） | 画面だけを見て、性格語を1つも当てられない |
| バウハウス風の飾り、主操作が2つ以上 | B-1、B-2 に照らす |
| 独自部品の乱用 | 「標準から外れる所」の欄に、本来の部品と理由がない |
| 状態の書き漏れ（とくにオフラインと、権限を断られたとき） | 状態の表の空欄 |
| 見た目の良さで使いにくさが隠れる | AC の操作手順を、タップ数で数え直す |

## 5. 参考
- HIG Design principles（2026-06-08 に再掲）：https://developer.apple.com/design/human-interface-guidelines/design-principles
- HIG アクセシビリティ（コントラストの表、44x44pt）：https://developer.apple.com/design/human-interface-guidelines/accessibility
- HIG Materials（Liquid Glass と内容の層）：https://developer.apple.com/design/human-interface-guidelines/materials
- WWDC26「Principles of great design」：https://developer.apple.com/videos/play/wwdc2026/250
- ContentUnavailableView：https://developer.apple.com/documentation/swiftui/contentunavailableview 、Apple Design Awards：https://developer.apple.com/design/awards/
- バウハウス（Gropius「物はその本質で決まる」、1923「芸術と技術、新しい統一」）：https://zkm.de/en/node/4174
- Moholy-Nagy「新しいタイポグラフィ」：https://www.readingdesign.org/the-new-typography
- Dieter Rams の10原則：https://vitsoe.com/gb/about/good-design
- NN/g 競合の評価：https://www.nngroup.com/articles/competitive-usability-evaluations/
- NN/g ブランドの性格語：https://www.nngroup.com/articles/brand-intention-interpretation/
- NN/g 文言の調子の4軸：https://www.nngroup.com/articles/tone-of-voice-dimensions/
- NN/g 空の状態：https://www.nngroup.com/articles/empty-state-interface-design/
- NN/g エラー文の採点表：https://www.nngroup.com/articles/error-messages-scoring-rubric/
- 見た目の好みの違い（Reinecke と Gajos 2014）：https://eecs.harvard.edu/~kgajos/papers/2014/reinecke14visual.shtml
- AI の無難なデザインと、別の採点役（Anthropic）：https://www.anthropic.com/engineering/harness-design-long-running-apps
- App Store の画面写真が取れない報告：https://developer.apple.com/forums/thread/780354
