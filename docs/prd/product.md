# プロダクト全体：（名前は未定。ブラウザだけで動く Web アプリ）

- 書いた役：pdm　日付：2026-10-29（r3。r2 で Takuma の決定により iOS アプリから Web アプリに直し、r3 で 001 の G0 の指摘（E-7 の訂正、IP の記録の書き分け、E-5 の件数）を反映した）　状態：下書き（001-daily-learning の G0 と一緒に Takuma が確認する）
- 元の着想（.claude/org/app.json の idea）：最強のエンジニアとして成長するための人間育成アプリ。他で学んだことも反映でき、その人に合わせたパーソナルな学習をさせる。続ければ圧倒的なプロフェッショナルになれる。トレンドも敏感に取り入れる。
- 決定済み（2026-10-29、docs/progress.md）：ブラウザだけで動く Web アプリ。サーバーなし、ログインなし、データはその人のブラウザの中（localStorage か IndexedDB）に保存、費用ほぼ0、静的ホスティング（GitHub Pages など）に置く。
- 根拠の印：［実データ］［公開情報 URL］［推測］。印のない文は根拠に数えない。

## 対象の層
- 主：日本のソフトウェアエンジニア（実務1〜5年目、または就職直前）で、「伸びたいが、次に何を学べばよいか決められない」人。［推測］（idea の「最強のエンジニアとして成長」は、コードを初めて書く人ではなく、すでに仕事で書いている人を指すと読んだ。Takuma が仮置きで了承）
- 使う端末：スマホのブラウザ（通勤中）を主、PC のブラウザを副と置く。［推測］（001 の 18 の Q8 で確かめる）
- 外す：プログラミング未経験者（Mimo、Sololearn、Progate、freeCodeCamp の層。同じ土俵では勝てない）、小中学生（まなんでパズル等の層）。

## 中心の Job
- Job ストーリー：仕事で触れる技術の幅が広がり、何を伸ばせばよいか迷うとき、今の自分の段階と目標に合った次の一手を知りたい。そうすれば迷う時間をなくし、毎日少しずつ専門性を積み上げられる。
- 機能の面：今日やる学習が1つに決まる。気持ちの面：「自分は前に進んでいる」と感じられる。人の目の面：同僚や面接で「最近学んだこと」を具体的に話せる。
- 「他で学んだことも反映」「トレンド」は、この Job を支える後続の機能（002 以降）として扱う。最初の機能では扱わない。

## 配布の形と言語
- 配布：Web（静的ホスティング。GitHub Pages を想定。HTTPS）。URL を開くだけで使え、インストールもアカウントもない。ストアの審査はない。配信元の GitHub Pages は、訪問者の IP アドレスを接続の記録として保存する（https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages ［公開情報 URL］）。
- iOS の Safari は7日間操作がないサイトの保存を消し、ホーム画面に追加した Web アプリは Safari と保存を共有しない（001 の E-7）。端末やブラウザをまたぐ引き継ぎは、ファイルの書き出し・読み込みで行う。
- 届け方：v1 は Takuma と周りのエンジニア（5人程度）に URL を渡す。公開の範囲を広げるかは North Star が動いてから決める。［推測］
- 言語：日本語（主）、英語（副。画面の文言のみ）。対象の地域は日本。
- 理由：JP の学習アプリ上位は英語のみのものが多く、レビューに「日本語に対応してほしい」の趣旨が出る（Sololearn は RSS 57件中 7件、Mimo は 47件中 7件、Codecademy Go は 8件中 1件。下の表と 001 の E-5）。［公開情報 URL］
- iOS 版を出すときに書く：ストアの国（JP を想定）、キーワード（100バイト以内）、App Store のプライバシー表示、4.3(b) への答え。Web 版では使わない。

## 競合と代替
| 名前 | URL | 評価の数（JP / US） | 価格と課金の形 | 強み | 繰り返し出る不満（引用と URL） |
|---|---|---|---|---|---|
| Mimo（アプリ） | https://apps.apple.com/jp/app/mimo-learn-programming-coding/id1133960732 | 1,033 / 110,885 ［公開情報 URL］ | 無料＋Pro（年 ¥8,600〜¥12,000 など）［公開情報 URL］ | 短いレッスンと連続記録。初心者の導入がうまい | 「日本語ないんか…英語わからんから勘でいったら間違えてハートが減る」「ゲーム内のハートにストレスが溜まる」「no way to review them practice continuously on weak points」（同 URL のレビュー） |
| Sololearn（アプリ） | https://apps.apple.com/jp/app/sololearn-learn-to-code/id1210079064 | 2,591 / 82,126 ［公開情報 URL］ | 無料＋Pro（広告、ハート制） | コース数と対戦。コミュニティ | 「日本語に対応してほしい」「対戦の問題がレベルオーバー…まだ学習してないことが出題される」「There are too many advertisements」「Why was I suddenly charged for a yearly subscription」（同 URL） |
| Progate（アプリと Web） | https://apps.apple.com/jp/app/progate/id1335868128 | 1,179 / — ［公開情報 URL］ | 無料＋月額 | 日本発。Web 版は日本語 | 「Web版は日本語なのにアプリは全部英語」「記載の内容をそのままを進めると古すぎて内容が全然違う」「解約したのに請求を半年以上されていた」（同 URL） |
| Codecademy Go（アプリ） | https://apps.apple.com/jp/app/codecademy-go/id1376029326 | 550 / 38,016 ［公開情報 URL］ | 無料＋Pro | Web 版の復習用 | 「日本語で翻訳出来る様にして欲しい」「All I get are flash cards?」「Doesn't correlate to what you learn on the site」（同 URL） |
| Enki（アプリ） | https://apps.apple.com/us/app/enki-learn-coding-programming/id993753145 | — / 1,113 ［公開情報 URL］ | 無料（読むだけ）＋年額 | 「毎日5分」「パーソナル」を掲げる。領域が広い | 「you actually save my curriculum preferences when I click "Save"…I'm not interested in React (we use Angular)」「React material out of date…class components」「You never actually code」（同 URL）。JP ストアでは検索上位に出ない |
| エンジニア大学（アプリ） | https://apps.apple.com/jp/app/%E6%9C%AC%E6%A0%BC%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0%E5%AD%A6%E7%BF%92-%E3%82%A8%E3%83%B3%E3%82%B8%E3%83%8B%E3%82%A2%E5%A4%A7%E5%AD%A6-ai%E3%82%B5%E3%83%9D%E3%83%BC%E3%83%88%E4%BB%98%E3%81%8D/id1609827348 | 463 / — ［公開情報 URL］ | 無料＋課金（体力、AI） | 日本語。解説のあとに演習 | 「半角スペースの有無の判定…完全一致でなければ全て不正解」（同趣旨が3件以上）「問題数が少なく、入り口に触れるくらい」（同 URL） |
| Exercism（Web） | https://exercism.org/ | Trustpilot 18 件、2.3（2026-10-29 確認） ［公開情報 URL］ | 無料（寄付） | 言語ごとの練習問題と、人のメンターによる添削 | 「I've made a mentoring request (Ruby track) 8 days ago, and there seem to be no takers」「There's a big discrepancy between 1hr and 8 days」（https://forum.exercism.org/t/what-happens-if-no-mentor-takes-my-request/7271 2023-09-13）「NOT for beginners. It's more like solving riddles than teaching you anything」（https://ie.trustpilot.com/review/exercism.org 2026-07-13） |
| freeCodeCamp（Web） | https://www.freecodecamp.org/ | Trustpilot 41 件、3.5（2026-10-29 確認） ［公開情報 URL］ | 無料（寄付） | 無料で網羅的。ブラウザの中でコードを書いて進める | 「Most lessons are outdated and useless for 2026 tech」（2026-03-17）「Many steps and explanations are skipped and it creates great confusion」（2024-08-19）「The nagging for donations is annoying」（2024-10-12）（https://se.trustpilot.com/review/freecodecamp.org ） |
| roadmap.sh（Web、地図） | https://roadmap.sh/ | 「3.2M registered users」と表示（2026-10-29 確認） | 無料 | 領域ごとの学習の地図が網羅的（「All 96 roadmaps」） | 「giant roadmap diagrams that list 100+ technologies」「trying to learn everything at once will slow you down」（https://dev.to/matemiller/finding-the-right-path-as-a-developer-roadmaps-vs-reality-5c6b 2025-03-07）［公開情報 URL］ |
| ChatGPT などに「次に何を学ぶべきか」を聞く（アプリ以外） | — | — | 無料〜月額 | その場で答えが出る。文脈を自由に渡せる | 自分の段階を毎回説明し直す必要があり、答えが毎回変わる。翌日に続かない。［推測］（レビューの記録なし） |
| 先輩に聞く、書籍や Udemy を積む、何もしない（アプリ以外） | — | — | 0円〜 | 信頼できる。深い | 先輩の時間に依存する。積んだ教材のどれから手を付けるか決まらず止まる。［推測］ |

- 上位3件（Mimo、Sololearn、Progate）との違い：3件とも「アプリの中でコードを学ぶ初心者向けコース」で、ハートや広告や英語の壁が不満の中心。このアプリは「すでに書いている人に、今日やる学習を1つだけ処方する」役で、教材そのものを抱えず、ハートも広告も置かない。［推測］
- Web の学習サイト（Exercism、freeCodeCamp、roadmap.sh）との違い：3つとも「何をやるか」は本人が選ぶか人を待つ。このアプリは開いた瞬間に今日の1件が決まり、登録もメンターの待ち時間もない。［推測］

## 位置づけ
- すでにコードを書いているエンジニアに、今の段階と目標から「今日やる学習」を1つだけ、ブラウザを開くだけで、登録なしに、迷わず出す Web アプリ。入力したデータは本人のブラウザの中だけに置き、ブラウザの外に送らない（配信元が IP アドレスを記録することは、プライバシーのページに書く）。

## North Star と入力指標
- North Star：週に3日以上「今日の学習」を完了した利用者の数（Weekly Committed Learners）。顧客が受け取る価値（学習が続き、積み上がる）を表し、課金より先に動く。［推測］（新しいアプリのため基準値は未計測。公開後14日で測る）
- 入力指標（チームが直接動かせるもの）：
  1. 初めて開いた日に1件目を完了した利用者の割合
  2. 出した学習に対する完了率（Task Completed ÷ Task Issued）
  3. 完了後の「役に立った」率（Task Rated で helpful の割合。未回答を除く）
  4. 公開14日後の時点で、直近7日に3日以上完了した利用者の割合（North Star の入口）
- 測り方：サーバーがないので、v1 はアプリが自分の統計（上の 4 指標と1対1の値。001 の AC-24）を設定の画面に表示し、利用者が判定日にスクリーンショットで報告する（001 の 13）。匿名計測（GoatCounter など）は利用者を区別できないので、1 と 4 は件数からは出せない（001 の E-11）。匿名計測を入れるかは 001 の 18 の Q1。iOS 版を出すときは App Store Connect の同業比較（https://developer.apple.com/help/app-store-connect-analytics/benchmarks/peer-group-benchmarks/ ［公開情報 URL］）を参考値にする。
- 見かけの指標（ページビュー、訪問者数、登録数、DAU）は主にしない。

## 名前とタグラインの案（各30字以内。確定は Takuma：001 の 18 の Q7）
| 案 | 名前（サイトの title） | タグライン（meta description の先頭） |
|---|---|---|
| A | 今日の一手 | エンジニアの毎日15分学習。登録なし |
| B | Tetsu（てつ） | 今の段階に合う学習を1日1つ |
| C | DevDaily | 今日やる学習が1つ決まる |
- 避けること：「最強」「世界一」のような確かめられない言い方、他アプリ名、商標。
- meta description の案（120字以内）：「すでにコードを書いているエンジニア向け。3問の診断で今の段階と目標を伝えると、15分で終わる今日の学習が1つだけ出ます。登録なし、無料、データはあなたのブラウザの中だけ。」

## iOS 版を出すときに書く
- App Store のキーワード案（100バイト以内。日本語は1字3バイト）：`エンジニア,学習,毎日,スキル,成長,習慣,キャリア,開発者,継続,目標`（30字＝90バイト）。Web 版では使わない。
- ストアの国（JP を想定）、App Store のプライバシー表示、4.3(b)（ありふれた分野）と 4.2（Web の焼き直し）への答え。
