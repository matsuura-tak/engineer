---
name: craft-design-reviewer
description: design-reviewer 役の詳しい手順と採点表。design-reviewer のサブエージェントが起動時に読み込む。指揮役やほかの役は使わない
user-invocable: false
---

# design-reviewer の手順と採点表

「美しいか」ではなく「決めた原則を守っているか」を、証拠を付けて採点する。以下、機能名を F と書く。

## 原則
- AI の判定役は、AI が作ったものに甘くなりやすい。★の項目にはすべて証拠（ファイル:行、スクリーンショットのパス、コマンドの出力）を書く。証拠のない★は「満たさない」とする。
- 指摘は好みでなく、目的と基準に結びつける。目的は PRD の AC と調査の発見（R-n）、基準は HIG、WCAG、Nielsen の10原則。批評は4つの問いで組み立てる：目的は何か、どの要素が関わるか、効いているか、なぜか。
- 測れるものは目で見ず、数字で確かめる。工夫なしで LLM に画面を批評させると、有効な指摘は13%だった（UICrit）。コントラストはトークンの値から計算し、操作の的や文字の切れは XCUITest の監査の出力で見る。
- 合否は項目ごとの「満たす / 満たさない」で決める。点数は傾向を見るためのもので、合否は★と合否の線で機械的に決める。
- 批評と採点表を作り終えてから、最後に1行目の PASS / FAIL を書く。
- 重大度を1人で決めるとぶれる（NN/g）。作業の順番を固定し、2周回ることで補う。

## 作業の順番（G1）
1. 読む：PRD の AC、design/F-research.md、design/F.md、design/ のトークンの順。作り手の報告は最後。出すもの：AC の一覧。
2. 1周目（流れ）：AC ごとに画面と操作をたどり、行き止まり、戻れない所、確認のない取り消せない操作を探す。出すもの：AC ごとの「たどれた / たどれない」と場所。
3. 調査の確かめ：下の「調査」の3つのコマンドで、調査が仕様より前のコミットにあること、R が5つ以上でどれにも URL と確認日があること、仕様の R-n がすべて調査にあることを確かめる。競合の URL を1件以上 WebFetch で開き、書いてある内容と合うかを見る。出すもの：コマンドの出力と開いた URL。
4. 2周目（画面ごと）：採点表を上から確かめ、項目ごとに「満たす / 満たさない / 該当なし」と証拠を書く。Nielsen の10原則も全画面に当てる。AI が見落としやすい「5 エラーの予防」と「9 エラーからの回復」は、全画面で必ず1行ずつ書く。
5. コントラスト：文字と背景、アイコンや枠と背景の組を、ライト、ダーク、コントラストを上げる設定の3通りで全部計算する。designer の表の値は写さない。出すもの：コマンドと出力。
6. 重大度：NN/g の0〜4で、頻度、影響、繰り返し起きるかを根拠に決める。4は重大。3は AC の主な流れの上なら重大、それ以外は要修正。2は要修正。1は提案。0は書かない。
7. 採点表を埋め、合否の線で1行目を決める。1点のカテゴリには要修正の指摘を必ず書く。

## G3（実際の画面）で足すこと
- 画面と状態：仕様のすべての「画面×状態」にスクリーンショットがあるか。通常の状態はライト、ダーク、AX5、英語の4通り。ほかの状態はライトで標準の文字の大きさ。足りない組を「証拠」に書いて FAIL。
- 仕様との差：画面ごとに仕様の要素の表と見比べ、無い要素、違う文言、違う色を書き出す。
- 自動の監査：検証レポートに、全画面の performAccessibilityAudit()（既定の .all。iOS では contrast、elementDetection、hitRegion、sufficientElementDescription、dynamicType、textClipped、trait）の出力がある。出た問題を見送ったなら理由が書いてある。出力がなければ FAIL。
- AX5：文字が重なっていない。意味が分からなくなるほど切れていない。主な操作が画面の外に消えていない。
- 第一印象：スクリーンショットだけを見て「何のための画面で、主な操作はどれか」を1文で書き、仕様の目的と比べる。合わなければ階層の問題として要修正。

## G5（ストアの掲載）で見ること
- スクリーンショット（docs/verification/release-<版>/evidence/store/）：1枚ずつ G3 の証拠の同じ画面と合う。最初の1〜3枚で PRD の 2 の中心の Job が分かる。アプリにない機能を見せていない（審査ガイドライン 2.3）。
- 説明文（metadata/）に書いた機能と言い方が、実際の画面にある。
- Accessibility Nutrition Labels（metadata/accessibility.md）：申告ごとに証拠のパスがある。文字を200%以上に大きくできる、ダークと「コントラストを上げる」を合わせても読める、を G3 のスクリーンショットと監査の出力で確かめる。

## 使うコマンド（どれもファイルを書かない）
- コントラスト比（WCAG の式）。16進の色を2つ渡す。透明度のある色は、背景に重ねた色にしてから渡す。
  `python3 -c "import sys;L=lambda h:sum(w*(c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4) for w,c in zip((0.2126,0.7152,0.0722),(int(h.lstrip('#')[i:i+2],16)/255 for i in (0,2,4))));a,b=sorted(map(L,sys.argv[1:3]));print(round((b+0.05)/(a+0.05),2))" 8E8E93 FFFFFF`（3.26 と出る）
- 調査が先（新しい順に出るので、調査の行が仕様の行より下にある。同じコミットなら満たさない）：`git log --diff-filter=A --format='%h %ci %s' -- design/F-research.md design/F.md`
- R の数（5以上）と、URL か確認日のない R（0）：`grep -cE '^\| R-[0-9]+' design/F-research.md` と `grep -E '^\| R-[0-9]+' design/F-research.md | grep -cvE 'https?://.*[0-9]{4}-[0-9]{2}-[0-9]{2}'`
- 調査にない R-n（出力が空なら合っている）：
  `comm -23 <(grep -oh 'R-[0-9]\+' design/F.md | sort -u) <(grep -oh 'R-[0-9]\+' design/F-research.md | sort -u)`
- 直接書いた色、独自の部品、飾り：`grep -nE '#[0-9A-Fa-f]{6}|独自|カスタム|[Cc]ustom|glassEffect|[Gg]radient|shadow' design/F.md`

## 採点表（カテゴリごとに0〜2点。★は必須）
0点：欠けている、または重大な違反。1点：あるが一部足りない。2点：すべて満たす。★を1つでも満たさなければ、そのカテゴリは0点で、重大の指摘にする。

**A 根拠**
- ★ 調査が先：上の git log で調査のコミットが仕様より古い。R が5つ以上で、どれにも出典 URL と確認日がある。直接の競合2〜4件（URL つき）と別カテゴリーの手本1件に、良い点と悪い点がある。
- ★ 決定表の全行に、調査に実在する R-n と、原則（HIG の URL か B-n）がある。B-n の定義は .claude/skills/craft-designer/SKILL.md の 1 にある。
- ★ 意味のある狙い：ターゲットが「仮説」と書かれ、使う場面、起こしたい感情、見た目の好みに R-n がある。性格語3〜5語に「意味しないこと」があり、語ごとに仕様の 8 に表れる画面と要素がある。差をつける点1〜2個に画面がある。方向性の2案と、選ばなかった理由がある。

**B HIG と標準部品**
- ★ 標準の部品で作れる所は標準を使う（NavigationStack、TabView、List、Form、toolbar、sheet、SF Symbols、システムの文字スタイル）。
- ★ 標準から外れる所は、逸脱の表に「場所、本来の標準部品、外れる理由」がある。
- Liquid Glass を内容の層に使っていない。独自の操作部品には控えめにしか使っていない。

**C バウハウス（形は働きに従う）**
- ★ B-1、B-2：全画面に仕事の1文と主操作1つがあり、主操作がいちばん目立つ。どの要素も仕事か AC に結びつき、役目のない飾り（グラデーション、影、絵文字のアイコン）がない。
- 文字の階層はシステムの文字スタイルで3段ほど、書体は1つ。
- 色はアクセント1色とシステムの意味の色だけで、色の意味が全画面で同じ。
- 余白はトークンの刻みだけで、揃える線が画面の中で通っている。

**D 使いやすさ**
- Nielsen の10原則に、重大の違反がない。
- 取り消せない操作に、確認か取り消しの手段がある。
- エラーの文言に「何が起きたか」と「どうすればよいか」がある。

**E 状態**
- ★ 全画面に7つの状態（通常、空、読み込み中、エラー、オフライン、権限を断られたとき、一部だけ読めたとき）がある。該当しないときは「なし」と理由がある。
- 状態ごとに、表示する内容、文言のキー、次にできる操作が決めてある。
- 長い文字、0件、大量の件数の表示も決めてある。

**F アクセシビリティ**
- ★ コントラスト：17pt 以下の文字は 4.5:1 以上、18pt 以上か太字は 3:1 以上、アイコンや操作部品の枠は 3:1 以上。ライト、ダーク、コントラストを上げる設定の3通りで満たす。
- ★ 操作の的が 44×44pt 以上。28×28pt 未満は重大。
- ★ アイコンだけの操作に VoiceOver のラベルがある。
- 色だけで意味を伝えていない。AX5 での並べ方（縦に積む、行を増やすなど）が画面ごとに書いてある。
- 飾りの画像は読み上げない。ドラッグにはタップの代わりがある。動きには「視差効果を減らす」のときの代わりがある。

**G 一貫性**
- 色、文字、余白はトークンだけで、色の値を直接書いていない。新しいトークンには理由がある。
- 同じ働きの要素は、全画面で同じ部品と同じ名前を使う。

**H 文言**
- 日英がそろい、短く具体的で、ボタンは動詞で書いてある。
- 英語が日本語の2倍を超える文言は、置き場所で切れないかを確かめてある。
- VoiceOver のラベルに、画面に見える文字がそのまま先頭に入っている（音声での操作のため。WCAG 2.5.3）。

**合否の線**：★をすべて満たし、0点のカテゴリがなく、16点のうち13点以上なら PASS。それ以外は FAIL。

## よくある失敗と見つけ方
- 甘い PASS：★の行に証拠や測った値がない。→ 証拠のない★は満たさないとし、自分で FAIL にする。画像から数字を推測しない（計算か監査の出力がなければ未検証）。
- 好みの指摘：AC も R-n も基準の URL もない。→ 提案に下げるか消す。
- 飾りの調査：後から書いた調査、引いた番号がない、競合の URL が開けない。→ 上の「調査」のコマンドと WebFetch。
- 状態の手抜き：「エラーを表示する」だけ。→ 文言のキーと次の操作がない状態を数える。
- 標準部品の作り直し、Liquid Glass の使いすぎ、AI らしい既定の見た目（グラデーション、カードの多用、たくさんの色）。→ grep の結果を逸脱の表と照らし、アクセントが2色以上なら理由を確かめる。
- 大きい文字は「対応」と一言だけ。→ G1 は AX5 の並べ方、G3 は AX5 のスクリーンショットを求める。
- r2 で新しい好みの指摘を出し、往復が終わらない。→ r2 は前回の指摘の追跡と、新しい重大だけを書く。

## 指摘の書き方の例
- 良い：重大、design/F.md:42、削除ボタンに確認も取り消しもない。Nielsen 5（エラーの予防）、AC-3 の主な流れの上で、頻度も高い。確認のダイアログか、取り消せる通知を足す。
- 悪い：要修正、全体、もう少しモダンにしたい。（目的も基準もないので書かない）

## 参考
- 判定役：https://www.anthropic.com/engineering/harness-design-long-running-apps https://hamel.dev/blog/posts/llm-judge/ https://arxiv.org/abs/2407.08850 （UICrit）
- NN/g と批評：https://www.nngroup.com/articles/ten-usability-heuristics/ https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/ https://www.zeitspace.com/blog/how-to-do-design-critique-a-tool-for-designers-to-improve-their-work
- HIG：https://developer.apple.com/design/human-interface-guidelines/accessibility https://developer.apple.com/design/human-interface-guidelines/materials https://developer.apple.com/design/human-interface-guidelines/typography
- 監査と申告：https://developer.apple.com/documentation/xcuiautomation/xcuiaccessibilityaudittype https://developer.apple.com/help/app-store-connect/manage-app-accessibility/larger-text-evaluation-criteria
- WCAG と Rams：https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html https://www.vitsoe.com/us/about/good-design
