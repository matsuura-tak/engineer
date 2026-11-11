# プロダクト全体：今日の一手（ブラウザだけで動く Web アプリ。URL：https://matsuura-tak.github.io/engineer/ ）

- 書いた役：pdm　日付：2026-11-05（r4。r2 で Takuma の決定により iOS アプリから Web アプリに直し、r3 で 001 の G0 の指摘（E-7 の訂正、IP の記録の書き分け、E-5 の件数）を反映した。r4 は Takuma の FB 1 回目（docs/approvals/001-daily-learning-FB1.md）を受け、対象の層に「未経験」を入れ（FB-1）、「1 日 1 つ」を「毎日 1 つは出る。同じ日に続けて進める」に直し（FB-2）、面白さの方針（FB-3）を位置づけに足した。r5 は tech-lead r3 の提案 2 で、競合の下の Duolingo の参照を E-12 から E-13 に直した。r6（2026-11-05）は Takuma の FB 2 回目（docs/approvals/001-daily-learning-FB2.md）を受け、Job の機能の面に「合っていたかがその場で分かる」を足し、競合に Pythonプログラミング入門（3 択クイズ型）を足し、位置づけに「選んで学ぶ」型、図、キャラクターを足した。North Star と入力指標 5 つは変えていない）　状態：下書き（001-daily-learning r12 の G0 と一緒に指揮役が確認する。承認は委任：docs/approvals/delegation.md）
- 元の着想（.claude/org/app.json の idea）：最強のエンジニアとして成長するための人間育成アプリ。他で学んだことも反映でき、その人に合わせたパーソナルな学習をさせる。続ければ圧倒的なプロフェッショナルになれる。トレンドも敏感に取り入れる。
- 決定済み（2026-10-29、docs/progress.md）：ブラウザだけで動く Web アプリ。サーバーなし、ログインなし、データはその人のブラウザの中（localStorage）に保存、費用ほぼ0、静的ホスティング（GitHub Pages）に置く。
- 根拠の印：［実データ］［公開情報 URL］［推測］。印のない文は根拠に数えない。

## 対象の層
- 主：日本語で学ぶ、コードをほとんど書いたことがない人（未経験）から、実務 1〜5 年目のソフトウェアエンジニアまで。「伸びたいが、次に何をやればよいか決められない」人。段階「初級」が未経験、「中級」がすでに書いている人、「上級」が設計を決めて人に教えている人に当たる。［推測］（r3 までは「すでに仕事で書いている人」に絞っていた。Takuma の FB-1（2026-11-05）「初級はコードをほとんど触ったことない未経験を対象にしてください」で広げた）
- 使う端末：スマホのブラウザ（通勤中）を主、PC のブラウザを副と置く。［推測］（001 の 18 の Q8 で確かめる。回答なし）
- 外す：小中学生（まなんでパズル等の層）、特定の言語や資格の試験対策（paiza のスキルチェック、Progate の言語コースの層。このアプリは言語を教えず、1 日 15 分の「一手」を出す）。
- 未経験を入れたことで増える弱み：このアプリはブラウザの中でコードを実行しない（001 の 10）。未経験の人にとって「書いて動かす」体験は Progate、Mimo、paiza の方が強い。このアプリの初級は「読んで予想する、選んで理由を書く」型で、動かす学習の前の 10 分の助走として位置づける。［推測］

## 中心の Job
- Job ストーリー：学びたい気持ちはあるが、何から手を付ければよいか迷うとき（未経験なら「用語も環境も分からない」、現役なら「技術の幅が広すぎる」）、今の自分の段階に合った次の一手を知りたい。そうすれば迷う時間をなくし、毎日少しずつ積み上げられる。
- 機能の面：今日やる学習が1つに決まり、答えが合っていたかがその場で分かり、やりたい日はその場で次に進める。気持ちの面：「自分は前に進んでいる」「分かった」と感じられ、終えた直後に小さな発見がある。間違えても責められない。人の目の面：同僚や面接で「最近学んだこと」を具体的に話せる。
- 「他で学んだことも反映」「トレンド」は、この Job を支える後続の機能（002 以降）として扱う。最初の機能では扱わない。

## 配布の形と言語
- 配布：Web（静的ホスティング。GitHub Pages。HTTPS）。URL を開くだけで使え、インストールもアカウントもない。ストアの審査はない。配信元の GitHub Pages は、訪問者の IP アドレスを接続の記録として保存する（https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages ［公開情報 URL］）。
- iOS の Safari は7日間操作がないサイトの保存を消し、ホーム画面に追加した Web アプリは Safari と保存を共有しない（001 の E-7）。端末やブラウザをまたぐ引き継ぎは、ファイルの書き出し・読み込みで行う。
- 届け方：v1 は Takuma と周りのエンジニア（5人程度）に URL を渡す。未経験の人にも 1〜2 人渡せるかは 001 の 18 の Q14 で聞く。公開の範囲を広げるかは North Star が動いてから決める。［推測］
- 言語：日本語（主）、英語（副。画面の文言のみ）。対象の地域は日本。
- 理由：JP の学習アプリ上位は英語のみのものが多く、レビューに「日本語に対応してほしい」の趣旨が出る（Sololearn は RSS 57件中 7件、Mimo は 47件中 7件、Codecademy Go は 8件中 1件。下の表と 001 の E-5）。［公開情報 URL］
- iOS 版を出すときに書く：ストアの国（JP を想定）、キーワード（100バイト以内）、App Store のプライバシー表示、4.3(b) への答え。Web 版では使わない。

## 競合と代替
| 名前 | URL | 評価の数（JP / US） | 価格と課金の形 | 強み | 繰り返し出る不満（引用と URL） |
|---|---|---|---|---|---|
| Progate（アプリと Web） | https://progate.com/ 、https://apps.apple.com/jp/app/progate/id1335868128 | 1,179 / — ［公開情報 URL］ | 無料＋Plus 月 ¥990〜、Pro 月 ¥2,490〜（2026-11-05 確認） | 日本発。「未経験でも、独学でも大丈夫」「スライド学習」、ブラウザで書いて動かす | 「当たり前のように専門用語を使ってきて腹が立ちました。用語などの意味を知るためにこのアプリを入れたのに本末転倒」（2020-03-19）「Web版は日本語なのにアプリは全部英語」「解約したのに請求を半年以上されていた」（App Store の URL） |
| Pythonプログラミング入門（アプリ） | https://apps.apple.com/jp/app/python%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0%E5%85%A5%E9%96%80/id1540203303 | 8,583 / — ［公開情報 URL］ | 無料＋広告非表示の課金 | 日本語。「3択クイズに答えていくだけで、知識ゼロからでもプログラミングの基礎が身につきます」。各問題と「間違えた時の解説」 | 「説明文の内容が曖昧かつ断片的で、理解するのに時間がかかる」（2025-05-13、評価 1）「問題が間違っている 学習アプリとして1番やってはいけないことやってます」（2024-06-01、評価 1）「問題を解いても構文は意識することがほとんどないので力はつかない」（2021-11-22、評価 2）。広告への不満が評価 3 以下 17 件中 8 件（001 の E-26。同 URL と RSS） |
| Mimo（アプリ） | https://apps.apple.com/jp/app/mimo-learn-programming-coding/id1133960732 | 1,033 / 110,885 ［公開情報 URL］ | 無料＋Pro（年 ¥8,600〜¥12,000 など） | 短いレッスンと連続記録。初心者の導入がうまい | 「日本語ないんか…英語わからんから勘でいったら間違えてハートが減る」「ゲーム内のハートにストレスが溜まる」「too HARD 難し　過ぎ」（2025-09-24、評価 1）「no way to review them practice continuously on weak points」（同 URL） |
| Sololearn（アプリ） | https://www.sololearn.com/ 、https://apps.apple.com/jp/app/sololearn-learn-to-code/id1210079064 | 2,591 / 82,126 ［公開情報 URL］ | 無料＋Pro（広告、ハート制） | コース数と対戦。コミュニティ。「No matter your experience level」。Pro の「Daily goals」「Habit building features」 | 「日本語に対応してほしい」「対戦の問題がレベルオーバー…まだ学習してないことが出題される」「There are too many advertisements」「Why was I suddenly charged for a yearly subscription」（App Store の URL） |
| paiza ラーニング（Web） | https://paiza.jp/works/mondai | 未確認（Web。トップページは本文が取れず見ていない） | 無料＋月額（料金のページは見ていない） | 日本語。動画と演習。「メニューは上から順番に解いていくとレベルアップできる」問題集、D〜S のランク | 不満の記録なし（レビューのページを見ていない） |
| Codecademy Go（アプリ） | https://apps.apple.com/jp/app/codecademy-go/id1376029326 | 550 / 38,016 ［公開情報 URL］ | 無料＋Pro | Web 版の復習用。週の目標とバッジ（ヘルプの一覧。記事本文は 403 で見ていない） | 「日本語で翻訳出来る様にして欲しい」「All I get are flash cards?」「Doesn't correlate to what you learn on the site」（同 URL） |
| Enki（アプリ） | https://apps.apple.com/us/app/enki-learn-coding-programming/id993753145 | — / 1,113 ［公開情報 URL］ | 無料（読むだけ）＋年額 | 「毎日5分」「パーソナル」を掲げる。領域が広い | 「you actually save my curriculum preferences when I click "Save"…I'm not interested in React (we use Angular)」「React material out of date…class components」「You never actually code」（同 URL）。JP ストアでは検索上位に出ない |
| エンジニア大学（アプリ） | https://apps.apple.com/jp/app/%E6%9C%AC%E6%A0%BC%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0%E5%AD%A6%E7%BF%92-%E3%82%A8%E3%83%B3%E3%82%B8%E3%83%8B%E3%82%A2%E5%A4%A7%E5%AD%A6-ai%E3%82%B5%E3%83%9D%E3%83%BC%E3%83%88%E4%BB%98%E3%81%8D/id1609827348 | 463 / — ［公開情報 URL］ | 無料＋課金（体力、AI） | 日本語。解説のあとに演習 | 「半角スペースの有無の判定…完全一致でなければ全て不正解」（同趣旨が3件以上）「問題数が少なく、入り口に触れるくらい」（同 URL） |
| Exercism（Web） | https://exercism.org/ 、https://exercism.org/about | Trustpilot 18 件、2.3（2026-10-29 確認） ［公開情報 URL］ | 無料（寄付） | 言語ごとの練習問題と、人のメンターによる添削。「not competitive, frustrating or stressful」を掲げる | 「I've made a mentoring request (Ruby track) 8 days ago, and there seem to be no takers」（https://forum.exercism.org/t/what-happens-if-no-mentor-takes-my-request/7271 2023-09-13）「NOT for beginners. It's more like solving riddles than teaching you anything」（https://ie.trustpilot.com/review/exercism.org 2026-07-13） |
| freeCodeCamp（Web） | https://www.freecodecamp.org/ | Trustpilot 41 件、3.5（2026-10-29 確認） ［公開情報 URL］ | 無料（寄付） | 無料で網羅的。ブラウザの中でコードを書いて進める | 「Most lessons are outdated and useless for 2026 tech」（2026-03-17）「Many steps and explanations are skipped and it creates great confusion」（2024-08-19）「The nagging for donations is annoying」（2024-10-12）（https://se.trustpilot.com/review/freecodecamp.org ） |
| roadmap.sh（Web、地図） | https://roadmap.sh/ | 「3.2M registered users」と表示（2026-10-29 確認） | 無料 | 領域ごとの学習の地図が網羅的（「All 96 roadmaps」） | 「giant roadmap diagrams that list 100+ technologies」「trying to learn everything at once will slow you down」（https://dev.to/matemiller/finding-the-right-path-as-a-developer-roadmaps-vs-reality-5c6b 2025-03-07）［公開情報 URL］ |
| ChatGPT などに「次に何を学ぶべきか」を聞く（アプリ以外） | — | — | 無料〜月額 | その場で答えが出る。文脈を自由に渡せる | 自分の段階を毎回説明し直す必要があり、答えが毎回変わる。翌日に続かない。［推測］（レビューの記録なし） |
| 先輩に聞く、書籍や Udemy を積む、何もしない（アプリ以外） | — | — | 0円〜 | 信頼できる。深い | 先輩の時間に依存する。積んだ教材のどれから手を付けるか決まらず止まる。［推測］ |

- 面白さの参考（同じ Job ではないので表に入れない）：Duolingo（https://apps.apple.com/jp/app/duolingo/id570060128 、JP 評価 77 万件）。連続記録の効き目と副作用の両方が JP のレビューに出る（001 の E-13。通知、ライフ、クエストのポイント、リーグへの不満は別の仕組みとして書き分けてある）。間違えた理由の説明への好意と「解説がおざなり」「間違えたらキャラクターが笑ってくる」の不満も出る（001 の E-27）。Swift Playground（https://apps.apple.com/jp/app/swift-playground/id908519492 、JP 評価 550 件）は Takuma の FB2-5 の手本で、3D のステージとキャラクター、「楽しいアニメーション」で知識を見せる（001 の E-29）。
- 上位3件（Progate、Mimo、Sololearn）との違い：3件とも「アプリの中でコードを書いて動かす初心者向けコース」で、専門用語、ハート、広告、英語の壁が不満の中心。このアプリは「未経験から現役まで、今日やる一手を 1 つだけ、登録なしで出す」役で、教材も実行環境も抱えず、ハート、広告、連続記録の失う仕組みを置かない。未経験には「動かす前の 10 分」、現役には「迷わない 15 分」を出す。［推測］
- Web の学習サイト（Exercism、freeCodeCamp、roadmap.sh、paiza）との違い：「何をやるか」は本人が選ぶか人を待つ。このアプリは開いた瞬間に今日の1件が決まり、登録もメンターの待ち時間もない。［推測］

## 位置づけ
- 未経験から実務 5 年目までの人に、今の段階と目標から「今日やる学習」を 1 つ、ブラウザを開くだけで、登録なしに、迷わず出す Web アプリ。1 つの学習は、図つきの短い説明と 3 択 × 3 問で、選んだ瞬間に正誤と「選んだ答えに合わせた説明」が返る。案内役のキャラクターが正解でも不正解でも一緒に進み、責めない。終えたら「ひとこと解説」で小さな発見があり、同じ日にもう 1 つ進める。段階は正誤で自動で合わせ直す。段階の課題をやり切ると次の段階へ進める。連続記録を失う仕組み、ハート、広告は置かない。入力したデータは本人のブラウザの中だけに置き、ブラウザの外に送らない（配信元が IP アドレスを記録することは、プライバシーのページに書く）。

## North Star と入力指標
- North Star：週に3日以上「今日の学習」を完了した利用者の数（Weekly Committed Learners）。顧客が受け取る価値（学習が続き、積み上がる）を表し、課金より先に動く。日数で数えるので、1 日に何件進めても 1 日は 1 日（FB-2 で件数が増えても North Star は膨らまない）。［推測］（新しいアプリのため基準値は未計測。公開後14日で測る）
- 入力指標（チームが直接動かせるもの）：
  1. 初めて開いた日に1件目を完了した利用者の割合
  2. 出した学習に対する完了率（Task Completed ÷ Task Issued）
  3. 完了後の「役に立った」率（Task Rated で helpful の割合。未回答を除く）
  4. 公開14日後の時点で、直近7日に3日以上完了した利用者の割合（North Star の入口）
  5. 完了のうち、同じ日の 2 件目以降の割合（FB-2 の「一気に進めたい」需要が実際にあるかを見る。r4 で追加）
  - 補助（入力指標には数えない）：正答率（答えた問題のうち正解の割合。帯 50〜85%）。課題の難しさが段階に合っているかを見る。001 の 13（r12）
- 測り方：サーバーがないので、v1 はアプリが自分の統計（上の 5 指標と1対1の値。001 の AC-24）を設定の画面に表示し、利用者が判定日にスクリーンショットで報告する（001 の 13）。匿名計測（GoatCounter など）は利用者を区別できないので、1 と 4 は件数からは出せない（001 の E-11）。iOS 版を出すときは App Store Connect の同業比較（https://developer.apple.com/help/app-store-connect-analytics/benchmarks/peer-group-benchmarks/ ［公開情報 URL］）を参考値にする。
- 見かけの指標（ページビュー、訪問者数、登録数、DAU）は主にしない。

## 名前とタグラインの案（各30字以内。名前は A「今日の一手」に確定：001 の 18 の Q7、2026-10-30 Takuma 承認。URL は GitHub Pages の既定 https://matsuura-tak.github.io/engineer/ ）
| 案 | 名前（サイトの title） | タグライン（meta description の先頭） |
|---|---|---|
| A | 今日の一手 | 未経験から現役まで、毎日15分の一手。登録なし |
| B | Tetsu（てつ） | 今の段階に合う学習を、今日1つから |
| C | DevDaily | 今日やる学習が1つ決まる |
- 避けること：「最強」「世界一」のような確かめられない言い方、他アプリ名、商標。
- meta description の案（120字以内）：「コードを書いたことがない人から現役エンジニアまで。3問の診断で今の段階を伝えると、15分で終わる今日の学習が1つ出ます。やりたい日は続けて次へ。登録なし、無料、データはあなたのブラウザの中だけ。」

## iOS 版を出すときに書く
- App Store のキーワード案（100バイト以内。日本語は1字3バイト）：`エンジニア,学習,毎日,スキル,成長,習慣,未経験,入門,継続,目標`（30字＝90バイト）。Web 版では使わない。
- ストアの国（JP を想定）、App Store のプライバシー表示、4.3(b)（ありふれた分野）と 4.2（Web の焼き直し）への答え。
