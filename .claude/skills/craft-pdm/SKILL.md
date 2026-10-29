---
name: craft-pdm
description: pdm 役の詳しい手順と確かめる基準。pdm のサブエージェントが起動時に読み込む。指揮役やほかの役は使わない
user-invocable: false
---

# pdm の手順とチェックリスト

PdM の深さは、調べた根拠、確かめ方、作る前に決めた線で見える形にする。以下、機能名を F と書く。

## 原則
- 実際のユーザーには会えない。机上調査で仮説を作り、確かめ方と撤退の線を先に決め、Takuma の確認と公開後の数字で判定する。擬似ユーザーの意見は仮説とインタビュー案の試しにだけ使い、根拠に数えない（NN/g）。
- リスクの持ち分は、価値と事業性が pdm、使いやすさが designer、実現性が tech-lead。ほかの役のリスクも表に書くが、判断は持ち主に任せる。
- 解決策より先に困りごと。1つの機能が解く中心の Job は1つだけ。2つ目が出たら機能を分ける（JTBD）。
- アイデアを丸ごと試さない。頼っている前提を1つずつ、いちばん安い方法で、合格の線を先に決めて確かめる（Torres）。
- 成功と撤退の線は作る前に数字と日付で決め、後から動かさない（Annie Duke）。
- 指標は顧客が受け取る価値を表すものにする。ダウンロード数、登録数、ページビューは主にしない（Amplitude）。
- 時間の枠を先に決め、中身を削って合わせる（Shape Up）。
- 根拠の印は［実データ］［公開情報 URL］［推測］の3つ。印のない文は根拠でない。

## 作業の順番
0. アプリ全体（docs/prd/product.md がないときだけ）。見出しは、対象の層、中心の Job、対象のストアの国（2文字の国コード）と言語、競合と代替の表、位置づけの1文、North Star（1つ）と入力指標（3〜5個）、アプリ名とサブタイトルの案（各30字以内）、キーワード案（100バイト以内。日本語は1字3バイトで約33字）。
   North Star は顧客が受け取る価値を表し、売上より先に動く数にする。入力指標はチームが日々の仕事で直接動かせる数にする。
1. 依頼を Job にする。出すもの：Job ストーリー1文と、機能、気持ち、人の目の面を1行ずつ。課題の文に画面名や機能名が入ったら、解決策から入っているので書き直す。
2. 競合と代替を集める。出すもの：PRD の 3 の表。product.md の表にあれば引き、足りない分だけ足す。
   - 下の「競合を集める」コマンドで、同じ Job の上位アプリを3件以上選ぶ。呼ぶのは1分に20回まで。WebFetch はこの API を断ることがあるので、Bash の curl を使う。
   - curl も断られたら、WebSearch で `site:apps.apple.com <Job の言葉>` を探す。それでも読めないアプリやレビューは「見ていない」と書き、根拠は［推測］か「未定（理由）」にする。
   - 低評価のレビューを製品ページ（結果の trackViewUrl）で読み、2件以上に出る不満を引用と URL で書く。
   - アプリ以外の代替（紙、標準のメモ、LINE、表計算、何もしない）を1つ以上入れる。
3. 不満を4つの力（押し、引き、不安、習慣）に分ける。不安と習慣を下げる手当てを1つ以上、やることか AC に入れる。
4. 機会と解決のツリー。根は product.md の入力指標の1つ。機会を顧客の言葉で3つ以上出し、解き方が2つ以上あるものだけ残す。1つ選んで理由を書く。解決案を3つ以上出し、採る理由と捨てる理由を書く。
5. リスクと前提。PRD の 6 の表を全行埋める。前提ごとに「外れたら失敗するか」と「証拠があるか」を付け、重要なのに証拠がないものから、確かめ方と合格の線を書く。
   - 確かめ方は安い順：机上調査、Takuma への質問か画面案（5分）、内部の TestFlight、機能フラグで一部にだけ出す。
   - 実際のユーザーに聞きたい問いは、Takuma への頼みとして 18 に3つまで書く。過去の行動を聞く形（「最後に〜したのはいつ、どうやったか」）にし、「使いますか」とは聞かない。
6. 事前の検死。「公開3か月後に失敗した」と仮定して理由を5つ書き、それぞれを撤退基準か対策（AC、やらないこと、ガードレール）に結び付ける。
7. 推奨。作る、作らない、形を変える、のどれか。いちばん強い反論と、作らない場合に起きることを1行ずつ書く。依頼された案への賛成だけで終わらせない。
8. 範囲。時間の枠を先に書き、やることを削って合わせる。やらないことに理由を1行ずつ、はまりやすい所に避け方を書く。
   - 足す前に3つ問う（Intercom）：対象の全員が使うか。中心の Job に直接効くか。「競合にあるから」だけでないか。作られた機能の8割はほとんど使われない（Pendo）。
   - 候補が複数なら RICE で並べ、削ったものの点と理由を PRD の 9 に書く。Reach は四半期の人数、Impact は 3、2、1、0.5、0.25、Confidence は 100%、80%、50%。Effort の代わりに時間の枠、Takuma の確認の回数、保守の手間を見る。点数より、根拠の印と Confidence の低さを重く見る。
   - 要求を Kano で仮に分け（当たり前、性能、魅力、無関心、逆効果）、PRD の 9 の表に書く。分け方は［推測］。当たり前は必ず入れ、無関心と逆効果は入れない。
9. 受け入れ条件。1つの AC に1つのふるまい。Given、When、Then、確かめ方、効く機会（O-n。空やエラーなどの当たり前の品質は「当たり前」）をそろえる。タップの手順でなく、ふるまいを書く。形容詞は数字にする。通常、空、エラー、オフライン、権限を断ったときを入れる。
10. 指標と撤退。仮説文、KPI の表、撤退基準の表を埋める。
   - 基準値がなければ「未計測（公開後14日で測る）」。新しいアプリは App Store Connect の同業比較（転換率、1・7・28日目の継続率、クラッシュ率、課金）を参考値にし、出典に書く。
   - ガードレールを1つ以上（クラッシュしない割合、起動の速さ、通知許可の取り消し、問い合わせの数、削除の数）。
   - 撤退基準は「状態、判定日、取る行動、判定する役」の4つ。例：公開28日後に〈指標〉が〈数値〉未満なら、機能を外す案を Takuma に出す。判定は pdm 以外。
11. イベント。名前は「対象＋動作」の形（例：Note Saved）で書き方を1つにそろえ、値は名前でなくプロパティに入れる。イベントごとに、App Store のプライバシー表示の区分、ユーザーと結び付くか、トラッキングに当たるかを書く。
12. 最後に冒頭の紹介文を見直す。調べた結果と合っているか、代替より何がどれだけよいかが数字で言えているか（Working Backwards）。
13. 下のチェックリストとテンプレート末尾の「G0 の前の確認」を自分で確かめ、満たせない項目を報告の「未解決」に書く。

## ストアでの位置づけ（product.md と metadata/）
- アプリ名とサブタイトル（各30字）で中心の価値を言う。確かめられない言い方（「世界一の」）をしない。サブタイトルにほかのアプリ名を入れない。
- キーワード（100バイト。日本語は約33字）に、競合のアプリ名、商標、カテゴリ名、「app」、重複の語を入れない。
- 最初の1〜3枚のスクリーンショットで、中心の Job が伝わるようにする。
- metadata/screenshots.md は1枚ごとに、順番、画面と状態（design/ の名前）、伝えること。metadata/accessibility.md は Nutrition Labels の項目ごとに、対応するかと G3 の証拠のパス。証拠のない項目を「対応する」にしない。
- 審査ガイドライン：4.3(b) ありふれた分野では、はっきり違うか、よりよい体験が要る。4.2 Web の焼き直しにしない。2.3 掲載文、スクリーンショット、プライバシー表示を実際の体験と一致させる。

## 使うコマンド（どれもファイルを書かない）
- 競合を集める（「検索する言葉」を Job の言葉に、XX を product.md の国コードに替える）：
  `curl -s --get https://itunes.apple.com/search --data-urlencode 'term=検索する言葉' -d entity=software -d country=XX -d limit=10 | python3 -c "import json,sys;[print(a['trackName'],a.get('userRatingCount'),a.get('formattedPrice'),a['trackViewUrl'],sep=' | ') for a in json.load(sys.stdin)['results']]"`
- 出典の URL の数：`grep -oE 'https?://[^ )|>]+' docs/prd/F.md | sort -u | wc -l`
- AC の形：`grep -cE '^- AC-[0-9]+：' docs/prd/F.md` と `grep -cE '^  - (Given|When|Then|確かめ方|効く機会)：' docs/prd/F.md`
- 数字のない形容詞（箇条書きの行だけを見る）：`grep -nE '^ *- .*(使いやすい|すばやく|すぐに|簡単に|直感的|スムーズ|適切に|なるべく)' docs/prd/F.md`
- 見かけの指標が主になっている行：`grep -nE '^\| *[^|]*(ダウンロード|登録数|ページビュー|DAU)[^|]*\| *主' docs/prd/F.md`
- 承認の後に線が動いていないか（直しのとき）：`git log -p -- docs/prd/F.md`
- キーワードのバイト数（100以下）：`python3 -c "import sys;print(len(sys.argv[1].encode()))" 'キーワード,をここに'`

## チェックリスト（PRD の中身は、テンプレート末尾の「G0 の前の確認」で見る）
- [ ] docs/prd/product.md があり、North Star が1つ、入力指標が3〜5個で、F の冒頭の「動かす入力指標」がその中にある。
- [ ] 出典の URL の数が3以上。
- [ ] AC の数の5倍が、Given、When、Then、確かめ方、効く機会の行の数と同じ。
- [ ] 数字のない形容詞の検索の出力が空。出たら数字に書き直す。
- [ ] 見かけの指標が主になっている行の検索の出力が空。
- [ ] 第1部（1〜8）が約120行以内。超えたら、表の行を削るか、詳しい引用を product.md に移す。
- [ ] 競合の表の URL を1件以上 WebFetch で開き、書いた内容と合うことを確かめた。
- [ ] 承認済みの PRD を直したとき、14 の撤退基準と 13 の目標を変えていない。変えたなら「Takuma に決めてほしいこと」に理由とともに書いた。
- [ ] metadata/ を書いたとき：名前とサブタイトルが30字以内、キーワードが100バイト以内（上のコマンド）で、競合の名前と商標がない。

## よくある失敗と見つけ方
- 解決策から入る：課題の文に画面名や機能名がある。解き方が1つしかない機会が残っている。
- 擬似ユーザーの声を事実として書く：印のない根拠がある。「ユーザーは〜と言う」に出典がない。
- 競合の表が機能の比較だけ：不満の列とレビューの URL がない。競合が3件未満。アプリ以外の代替がない。
- 見かけだけの指標：KPI がダウンロード数、登録数、ページビュー、DAU だけ。
- 線を後から動かす：撤退基準に数字か日付がない。G0 の後に撤退基準が変わっている（git の差分で見る）。
- 詰め込み：Job ストーリーが2つ以上。やらないことが空。どの機会にも結び付かない AC がある。
- 判定できない AC：数字のない形容詞がある。タップの手順を並べただけ。
- イベントとプライバシー表示のずれ：イベントで送るデータが、プライバシーの区分に書かれていない。
- 都合のよい証拠だけ集める：いちばん強い反論と、作らない場合が書かれていない。
- 調べすぎて決めない：第1部が約120行を超えている。推奨がない。

## 参考
- https://www.svpg.com/four-big-risks/
- https://www.producttalk.org/opportunity-solution-trees/
- https://www.producttalk.org/2023/10/assumption-testing/
- https://www.strategyzer.com/library/how-assumptions-mapping-can-focus-your-teams-on-running-experiments-that-matter
- https://hbr.org/2016/09/know-your-customers-jobs-to-be-done
- https://www.mountaingoatsoftware.com/blog/job-stories-offer-a-viable-alternative-to-user-stories
- https://jobstobedone.org/radio/pull-and-anxiety/
- https://amplitude.com/blog/good-bad-north-star-metric
- https://davidepstein.substack.com/p/annie-duke-quit
- https://hbr.org/2007/09/performing-a-project-premortem
- https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/
- https://basecamp.com/shapeup/1.2-chapter-03
- https://www.pendo.io/resources/the-2019-feature-adoption-report/
- https://cucumber.io/docs/bdd/better-gherkin/
- https://www.nngroup.com/articles/synthetic-users/
- https://developer.apple.com/app-store/product-page/
- https://developer.apple.com/app-store/review/guidelines/
- https://developer.apple.com/app-store/app-privacy-details/
- https://developer.apple.com/help/app-store-connect-analytics/benchmarks/peer-group-benchmarks/
- https://performance-partners.apple.com/resources/documentation/itunes-store-web-service-search-api/
