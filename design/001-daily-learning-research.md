# デザイン調査 001-daily-learning：診断と今日の学習（今日の一手）

- 対象の PRD：docs/prd/001-daily-learning.md（r5、G0 承認済み）
- 書いた役：designer　日付：2026-10-30（R-27〜R-31 は 2026-11-03 に、G3 r1 の design-reviewer の指摘を直すために足した。仕様 r6 より先に書いた。R-1〜R-26 と 1〜7 は変えていない）
- この文書は仕様（design/001-daily-learning.md）より先に書く。仕様の決定は、8 の R 番号を根拠に引く。
- 見られなかったもの、開けなかったページは「見ていない」と書く。推測で埋めない。
- 読み替え：このアプリは iOS アプリではなく、ブラウザだけで動く Web アプリ（静的 HTML/CSS/JS、GitHub Pages、サーバーなし、ログインなし）。型の「App Store の評価」は「公開されている評価や利用者数」、「権限の求め方」は「通知や保存の許可（`navigator.storage.persist()`、Web Push）とアカウント登録の求め方」に読み替えた。原則の根拠は HIG に加えて WCAG 2.2 と WAI-ARIA APG の URL を使う（PRD の AC-27 は axe-core の WCAG 2.1 AA 監査）。HIG の2ページ（Design principles、Accessibility）は開いたが本文が取れなかったので、HIG の文言は引用しない（8 の末尾）。

## 1. 問いと範囲
- この調査で決めたいこと：
  1. 画面の流れ：初回（診断3問 → 今日の課題）と2回目以降（開いたら課題）を、何画面で、どんな並びにするか
  2. 1日1つの見せ方：課題の4要素（題名、なぜ今これか、やり方、完了の目安）と4つの申告を、1画面にどう置くか。「今日は終わり」をどう見せるか
  3. 答えを書く欄：任意で、1秒以内に保存し、同じ日に復元する欄（AC-32）をどう見せるか。保存されたことをどう伝えるか
  4. 外で行う課題の印：`external` の印と要る道具（AC-30）を、色だけに頼らずどう見せるか
  5. 空の状態と知らせ：課題が尽きた（AC-10）、履歴が0件、ホーム画面の案内（AC-21、AC-22）、保存の永続化を断られた（AC-13）、読み込みの失敗（AC-25）、保存の失敗（AC-11）
  6. 統計の見せ方：13 の指標と1対1の 9 つの値（AC-24）を、利用者がスクリーンショットで送れる1画面にどう並べるか
  7. 日英の文言：調子（5）と、英語で長くなっても崩れない並び（AC-26）
  8. ダークモードと文字サイズ：OS の設定に従う形（独自の切り替えを持つか）、本文の最小サイズ、320 CSS px での並び（AC-17）、フォーカスの枠（AC-18）、コントラスト（AC-27）
  9. ブランドの性格語と、競合に対する「差をつける点」
- 関係する受け入れ条件（AC 番号）：AC-1、AC-2（診断と1件目）、AC-3、AC-30（課題の4要素と外で行う印）、AC-5、AC-7、AC-9（申告と評価の流れ）、AC-10（尽きたとき）、AC-11、AC-25（エラー）、AC-13（永続化を断られたとき）、AC-16、AC-19、AC-20（設定：削除、書き出し、読み込み）、AC-17、AC-18、AC-27（アクセシビリティ）、AC-21、AC-22（ホーム画面の案内）、AC-24（統計）、AC-26（英語）、AC-31（操作0回）、AC-32（答えの欄）
- 範囲の外：課題集の中身（pdm と Takuma）、保存の方式と ID（tech-lead の ADR と contracts/）、Service Worker の作り（AC-23、AC-28 は画面に出ない）。

## 2. ターゲット（仮説）
人に聞いた調査ではなく、PRD とレビューなどから立てた仮説として書く（PRD の Q8 は回答なしのため、すべて［推測］に当たる）。
- 誰が（仮説）：日本のソフトウェアエンジニアで実務1〜5年目（docs/prd/product.md の対象の層。［推測］と明記されている）。すでにコードを書いていて、「次に何を学ぶか」を決める時間が惜しい人。英語の UI を避けたい人が JP の学習アプリのレビューに一定数いる（PRD の E-5：Sololearn 57件中 7件、Mimo 47件中 7件が「日本語に対応してほしい」）。
- 使う場面（仮説）：平日の朝か通勤中、スマホのブラウザで片手、15分（PRD 2 の Job ストーリー）。開いてから課題が見えるまで2秒・操作0回（AC-15、AC-31）。PC のブラウザは副（product.md）。iOS では「ホーム画面に追加」から開く人もいる（AC-21、AC-22。R-24）。
- 起こしたい感情：「今日も前に進んだ」（PRD 2 の気持ちの面）。開いた瞬間は「迷わない」、終えた瞬間は「今日はここまででいい」。手本の Wordle は1日1つの制約で「1日3分だけ使う」ことを意図した（R-6）。
- 見た目の好み（色の量、情報の密度）と根拠：色は少なく、密度は低く、1画面1件にする。根拠：(1) 教育水準が高いほど「カラフルさ」の好みが下がる（R-13。対象はエンジニアで、高等教育を受けた人が多いと仮定［推測］）。(2) 「パーソナル」を掲げる Enki のレビューに「just how busy the screen is」「The progress bar on top when you scroll down is a little distracting」（R-2）があり、競合の密度そのものが不満になっている。(3) roadmap.sh は「All 96 roadmaps」の高密度な一覧で、PRD の E-1 の「learn everything at once will slow you down」の不満につながる（R-5）。(4) 手本の Wordle は、色を黄・緑の2つの意味にだけ使い、ルールは10行未満の案内で足りる（R-7）。
- アクセシビリティで必要なこと：
  - 文字の拡大：幅 320 CSS px（200% 相当）で横スクロール 0（AC-17。R-16）。本文は 16 CSS px 以上、14 px 未満は使わない（R-26）。入力欄は 16 px 以上にしないと iOS Safari がフォーカスで拡大する（R-25）。
  - キーボード：Tab と Enter と Space だけで診断から完了まで（AC-18）。選択肢はラジオグループの型（R-21）。フォーカスの枠は 2 CSS px 以上（AC-18）で、周囲と 3:1 以上（R-15）。
  - コントラスト：本文 4.5:1、大きい文字（24 px 以上、または 18.5 px 以上の太字）と操作部品の枠は 3:1（R-14、R-15）。
  - 押せる範囲：WCAG AA は 24×24 CSS px（R-17）だが、片手のスマホ操作を主と置くので、主操作と申告のボタンは AAA の 44×44 CSS px を目標にする（R-17）。
  - ダークモード：OS の設定に従う（R-22）。動きを減らす設定では切り替えのアニメーションを消すか不透明度の変化だけにする（R-23）。
  - 色だけで意味を伝えない：外で行う印、保存済みの印、申告の結果は、文字とアイコンを併記する（R-7 の High Contrast Mode の例。R-15 の「状態」の条項）。
  - 読み上げ：答えの欄の「保存しました」のような状態の知らせは、フォーカスを奪わずに `role="status"` で伝える（R-19）。

## 3. 競合
直接の競合を4本。PRD の 3 にある候補（Enki、Mimo、Sololearn、Progate、Exercism、freeCodeCamp、roadmap.sh）から、「毎日・短時間」を掲げる2本（Enki、Mimo）と、ブラウザで完結する Web の2本（Exercism、roadmap.sh）を選んだ。価格とレビューの不満は PRD の 3 にあるので繰り返さず、見た目と操作の比較だけを足す。すべて 2026-10-30 に確認。アプリの画面そのものは App Store の画面写真が文字で取れないので見ていない。公式サイトと App Store の本文、ヘルプセンターの一覧から読めたことだけを書く。

| 項目 | Enki | Mimo | Exercism | roadmap.sh |
|---|---|---|---|---|
| 名前、URL、選んだ理由 | https://www.enki.com/ 、App Store US https://apps.apple.com/us/app/enki-learn-coding-programming/id993753145 。「5分のワークアウト」「毎日」「パーソナル」を掲げ、Job が最も近い | https://mimo.org/ 、App Store JP https://apps.apple.com/jp/app/mimo-learn-programming-coding/id1133960732 。短いレッスンと継続の仕組み（ストリーク）の代表 | https://exercism.org/ 、https://exercism.org/tracks 、https://exercism.org/tracks/python 。ブラウザで練習問題を解く Web の代表 | https://roadmap.sh/ 、https://roadmap.sh/backend 。「何を学ぶか」を地図で見せる Web の代表（PRD の E-1 の対極） |
| 良い点（取り入れる考え、R 番号） | 「5-minute "workout"」と「Daily reminders」で、1回の量を小さく固定する考え（R-2）。段階に合う入口を探す「Starting Points」（R-2） | 「短いレッスンだから、忙しい日でも続けられる」「最初の 1 行のコードから始めて」。最初の一歩を具体的に小さくする（R-3） | 「Learn」と「Practice」を分ける構成。ブラウザのエディタが「CLI-first」の補助として存在する（R-4） | 1クリックで領域ごとの地図に着く。「Personalize」の入口がある（R-5）。ただし地図の密度は取り入れない |
| 主な作業のタップ数 | 見ていない（アプリの中は開けない）。公式サイトの「Get started」はサインアップ（learn.enki.com/join）に向かい、登録なしで課題には着かない（R-2） | 見ていない。公式サイトの「Start learning for free」「Sign up with Google」はどちらも登録ページに向かう（R-3） | トップ →「Sign up for free」→ トラック → 演習、で少なくとも3画面。未登録で演習を開けるかは「見ていない」（ページに書かれていない。R-4） | トップ → 領域の地図まで1クリック（R-5）。「今日やる1件」には着かない（地図を見て自分で選ぶ） |
| ナビゲーションの構成 | 公式サイトはセクション積みの長いページ（ロゴ列、スキルカード、推薦文）。アプリ内は見ていない（R-2） | 公式サイトは長いページ（コースのカード、レビューの繰り返し）。アプリ内は見ていない（R-3） | 上部に Sign up / Log in。トラック一覧は 85 言語のテキストリンクを 5 列に並べた一覧（検索や絞り込みなし）。トラックの中は Learn / Practice の2区分（R-4） | 上部ナビは Roadmaps、AI Tutor、Packs、Newsletters。地図のページは Roadmap、Projects、AI Tutor、Personalize。検索は ⌘K（R-5） |
| 最初の価値までの画面数 | 見ていない。登録が先（R-2） | 見ていない。登録が先（R-3） | 登録を含めて3画面以上（R-4） | 1画面で地図は見えるが、「今日の1件」は決まらない（R-5） |
| 空の状態 | 見ていない | 見ていない | 見ていない | 見ていない |
| 権限の求め方（Web 読み替え：通知、保存、登録） | 「Daily reminders」を機能として掲げるので通知の許可を求めると読めるが、求める画面は見ていない（R-2）。登録が先 | 見ていない。登録が先（R-3） | 登録が先。通知や保存の許可は見ていない（R-4） | 登録なしで読める。「Register yourself」「Commit to your growth」の登録の誘いが下部にある（R-5） |
| 色、文字、情報の密度 | 公式サイトは画像とロゴ列が多く、区切りの多い高密度。ブランド色は青（画像のファイル名から。画面の色そのものは見ていない）。レビュー「just how busy the screen is」（R-2） | 公式サイトは高密度（コースのカード、長いレビュー列）。色と書体は見ていない（R-3） | カードとセクションの構成で区切り線が多い。余白は中程度。色は見ていない（R-4） | 高密度：96 本の地図の一覧、ガイド、動画、コースのパック、コミュニティの数字（371K stars、3.2M users、52K Discord）を1ページに並べる（R-5） |
| 文言の調子 | くだけて熱っぽい。「Learn 10x faster」「Busy professionals ❤️ us」「maybe even fun!」。絵文字あり（R-2） | 親しみやすく励ます。「Learn by doing」「Learn at your own pace」。推薦文に「Think of Duolingo, but for programming」（R-3） | 親しみやすく、絵文字（👋 🎉）あり。「Get really good at programming」「human mentoring, for free」（R-4） | 直接的で短い。「Skill up with community created roadmaps」「Commit to your growth」「Help us reach #1」（R-5） |
| App Store の評価（Web 読み替え：公開されている評価と利用者数） | App Store US 4.8 / 1.1K 件（R-2） | App Store JP 4.8 / 1,033 件（R-3） | Trustpilot 2.3 / 18 件（PRD の 3）。トラックのページに「848,745 students」（R-4） | 「3.2M registered users」「371K GitHub stars」（R-5） |
| 悪い点（レビューの不満の上位3つ、R 番号。価格と教材の古さは PRD の 3 にあるので、見た目と操作に関わるものだけ） | (1)「just how busy the screen is」（2024-11-01）。(2)「The progress bar on top when you scroll down is a little distracting too」（同）。(3)「It isn't the most beginner friendly application」（2023-04-17）（R-2） | (1) ハートが 0 になると進めない（「the number of hearts will be 0」。PRD の E-4 と同じレビュー）。(2) ストリークを切らすと「Streak repair」をストアの「coin」で買う（ヘルプの一覧。記事本文は 403 で見ていない。R-3）。(3) 日本語がない（PRD の E-5） | (1) 主要な動線が登録とメンター待ちに依存（PRD の E-6）。(2) 85 言語のテキスト一覧に絞り込みがない（R-4）。(3)「CLI-first」で、画面の中だけでは終えにくい設計（R-4） | (1) 96 本の地図を並べ、「今日何をするか」を決めない（R-5。PRD の E-1）。(2) 毎日の計画やスケジュールの仕組みがない（地図のページに「daily」「schedule」の記述なし。R-5）。(3) 進み具合の記録は登録の誘い（「Register yourself」）とセット（R-5） |

## 4. 手本（別カテゴリー）
- 名前と選んだ理由：Wordle（NYT Games。ワードゲーム）。「1日1つ」「開いたらすぐ本題」「登録なし、広告なし」で始まり、1日あたりの利用時間を短く保つことを意図して設計された。NYT のゲーム本体と NYT ヘルプのページは取得できなかった（Claude Code が nytimes.com を開けない）ので、Wikipedia と設計の解説記事から確かめた（R-6、R-7）。
- 取り入れる考え方（R 番号）：
  - 1日1つの制約を「足りない」でなく「今日はここまで」と見せる。「creates a sense of scarcity, leaving players wanting more」「encourages players to spend only three minutes on the game each day」（R-6）。このアプリの `task.done` と `task.skipped` は、次の課題を見せず「今日は終わり」と言い切る画面にする（PRD の AC-5、AC-7）。
  - 開いたら本題。ルールの説明は「a popup that takes less than 10 lines」（R-7）。診断の冒頭（`diagnosis.start`）の説明は 10 行以内を目安にし、診断済みなら説明なしで課題を出す（AC-31）。
  - 色は意味にだけ使う。黄と緑の2色だけに意味を持たせ、色覚に配慮した High Contrast Mode では「replaces yellow and green with blue and orange」（R-7）。このアプリは成功、警告、エラーの意味色にだけ色を使い、印には文字を併記する。
  - データと注意を奪わない正直さ。「It's not trying to do anything shady with your data or your eyeballs」（R-6）。このアプリの「ブラウザの外に送らない」（PRD 1）と「ストリークとハートを置かない」（PRD 10）はこの線にある。
  - 取り入れないもの：共有用の絵文字グリッド（「these emoji results don't support text-to-speech」の指摘。R-7）と、NYT 移行後に加わった「account logins to track stats」（R-6）。このアプリの統計はブラウザの中だけで、共有はスクリーンショット（PRD 13）。

## 5. ブランドの性格語と文言の調子
性格語は4語。NN/g は「a set of 3–7 words that express the essence of your Brand」を選び、語ごとに意味を定めて文言、書体に当てることを勧める（R-12）。

| 性格語 | 意味すること | 意味しないこと |
|---|---|---|
| ひとつ | 1画面に1件、主操作は1つ。今日の課題だけが画面の中心にあり、一覧や地図を見せない（R-5 の対極、R-6） | 機能が少ないこと。設定、履歴、統計は「ひとつ」の外に置くだけで、消さない（AC-16、AC-19、AC-24） |
| 静か | 色は意味色だけ、動きは最小、飾りと絵文字を置かない（R-2 の「busy」の不満、R-13）。通知もハートも急かさない（PRD 10） | 冷たい、素っ気ない。完了の瞬間には一言の労い（「今日も前に進みました」のような、確かめられる事実の言い方）を置く |
| 正直 | 「ブラウザの外に送らない」「課題が尽きた」「データは引き継がれない」を隠さず言う（AC-10、AC-21、AC-22。R-6）。「最高」「かんたん」のような確かめられない言い方をしない（docs/prd/product.md の「避けること」） | 不安を煽る。警告はエラーの見た目にしない（R-10 の「Warnings should not look like errors」） |
| 手早い | 開いて2秒・操作0回で課題（AC-15、AC-31）。診断は3問・1画面1問（R-8）。文は短く、動詞のボタン | 雑。答えの欄は急がせず、保存は黙って行い、状態だけ知らせる（R-19） |

文言の調子（NN/g の4軸。R-11）
- かしこまる ⇔ くだける：やや「かしこまる」寄り。です・ます調で、絵文字と感嘆符を使わない。競合3本（Enki、Mimo、Exercism）が「くだける」側に寄っている（R-2、R-3、R-4）ので、対象（仕事で書いている人）に合わせて逆に置く。
- まじめ ⇔ おどける：「まじめ」。
- ていねい ⇔ ちゃかす：「ていねい」。申告の文言は本人を責めない（「今日はできない」は選択肢として並べ、理由を聞かない）。
- 淡々 ⇔ 熱っぽい：「淡々」。「10x faster」（R-2）や「Commit to your growth」（R-5）のような煽りを使わない。例外は完了の直後の1文だけで、そこも事実を言う。
- 英語の調子：同じ位置（plain、direct、no exclamation marks）。英語のボタンは動詞始まり（Start、Done、Export）。

## 6. 合わせる当たり前と、差をつける点
- 合わせる当たり前（利用者がほかのアプリで覚えた型）と R 番号：
  - 1画面1問の診断と「n / 3」の進み具合（R-8。GOV.UK の「one thing per page」：モバイルで使いやすく、回答を自動で保存できる。AC-1 の「n / 3」と AC-11 の保存の失敗に合う）。
  - 選択肢はネイティブのラジオボタンの型（Tab でグループに入り、矢印で移動、Space で選ぶ。R-21）。
  - 取り消せない操作（全削除、読み込みの置き換え）は確認のダイアログ（`role="dialog"`、`aria-modal="true"`、Escape で閉じる、閉じたら呼び出し元へフォーカスを戻す。R-20）。
  - 空の状態は「何が起きたか」と「次の一手のボタン」（R-9。「Tell the user what could be displayed, and how to populate the area with that content」）。読み込み中に「0件」を出さない（R-9）。
  - エラーは問題の近くに、何が起きたかとどう直すかを書き、入力を保つ（R-10。AC-11）。
  - ダークモードは OS の設定に従い、`<meta name="color-scheme" content="light dark">` と `prefers-color-scheme` で切り替える（R-22）。独自の切り替えボタンは置かない（設定が増えるため。B-2）。
  - 動きを減らす設定に従う（R-23）。
  - iOS の「ホーム画面に追加」の作法：`apple-touch-icon`（180×180）、`apple-mobile-web-app-capable`、起動画像、`navigator.standalone` での判定（R-24。PRD の 11 の冒頭と同じ）。
  - 本文 16 CSS px 以上、行間 1.5 以上（1.6〜1.7 を目安）、14 px 未満を使わない（R-26）。入力欄も 16 px 以上（R-25）。
  - 固定ヘッダーやバナーでフォーカスを隠さない（R-18）。案内（AC-21、AC-22）は課題を覆わない（AC-31 の「重なる要素 0 件」と同じ）。
- 差をつける点（1から2個。どの画面のどの瞬間か）と R 番号：
  1. **課題そのものがホーム画面**。開いた瞬間（`task.today` の初期表示）に、一覧も地図もダッシュボードも挟まず、今日の課題の題名が最初の見出しとして出る。競合は登録（R-2、R-3、R-4）か地図の一覧（R-5）が先で、「今日の1件」までが遠い。手本の Wordle は開いたら盤面（R-7）。決定的な瞬間は「読み込みが終わった0.5秒後に、題名と『なぜ今これか』が読める」こと（AC-31、AC-15）。
  2. **「今日はここまで」と言い切る終わりの画面**。`task.done` と `task.skipped` は、次の課題もストリークも見せず、「今日の一手は終わりです。次は明日」と1文で終える（R-6 の「spend only three minutes」の意図、PRD 10 のストリーク非採用）。完了の直後の `task.rate` は1問だけで、答えなくても閉じられる（AC-9）。決定的な瞬間は「完了を押したあと、画面が静かになる」こと。
  - どちらも、デザインの採点と判断（見た目の良さではなく「迷わない」「終われる」）に結び付く。仕様では `task.today` と `task.done` の2画面に表れる。

## 7. 方向性の2案
| | 案A「一枚の紙」 | 案B「進み具合の盤」 |
|---|---|---|
| ひとことで | 白（ダークでは黒）の地に本文の文字だけ。1画面に課題1件。色はアクセント1色（主操作）と意味色（成功、警告、エラー）だけ。システムの書体、角丸カードなし、区切りは余白で作る | 上部に今日の進み具合（輪や7日のドット）、課題はカード、領域ごとの色分け、完了時に小さな祝いのアニメーション |
| 性格語との合い方 | 「ひとつ」「静か」「正直」「手早い」の4語にそのまま合う。飾りがないので「静か」が最も強く表れる | 「ひとつ」に反する（進み具合が課題と並んで主役になる）。「静か」に反する（領域の色分けとアニメーション）。「正直」は保てる |
| ターゲットとの合い方 | 教育水準が高いほどカラフルさの好みが下がる（R-13）。Enki の「busy」の不満（R-2）を避ける。通勤中に片手で、文字だけを読んで進める | 継続の見える化は O-3 に効くが、PRD 10 でストリークを採らないと決めた。7日のドットは「連続記録」に見える危険がある。領域の色分けは、1日1件しか出ない画面では意味を持たない |
| 選んだか、その理由 | **選ぶ**。差をつける点1と2（課題がホーム、終わりを言い切る）を最も直接に形にできる。コントラストと 320 px の並び（R-14、R-16）も、文字だけの構成が最も壊れにくい。弱点は「地味で、続ける動機が画面にない」ことだが、PRD の P-2 は「開けば課題」「書きかけから再開」で続けやすさを作る方針なので、見た目の仕掛けに頼らない | 選ばない。理由：PRD 10 の「連続記録を採らない」に近づく。1画面に主役が2つになり B-2 に反する。独自の色を領域分だけ持つと、ライト、ダーク、高コントラストの3通りのコントラストを 6 領域 × 3 で確かめる手間が増える（R-14） |

案A の中で、統計の画面（`settings.stats`）だけは例外として数字を大きく置く（13 の指標の報告用スクリーンショットになるため。AC-24）。ここでも色は使わず、値は定義リストの形で、ラベルと値の対を縦に並べる（320 px でも崩れない。R-16）。

## 8. 発見の一覧
| R | 発見（引用は「」で） | 出典 URL | 確認日 |
|---|---|---|---|
| R-1 | 競合の評価は「A typical competitive evaluation focuses on 2 to 4 competitors' sites」。「Data on what works well or poorly on other sites saves you from implementing useless features」 | https://www.nngroup.com/articles/competitive-usability-evaluations/ | 2026-10-30 |
| R-2 | Enki。公式サイト：見出し「Personalized, AI-powered learning in coding and tech skills」、主 CTA「Get started」はサインアップ（learn.enki.com/join。開いたが題名しか取れず、画面の中身は見ていない）へ。調子は「Learn 10x faster」「Busy professionals ❤️ us」「maybe even fun!」。セクション積みの高密度。App Store US：「Enki creates a 5-minute "workout" for you」「Daily reminders to help you build a learning habit」「Tracked learning streaks to motivate your progress」「Starting Points… finds the perfect entry point in the curriculum」。評価 4.8 / 1.1K。レビュー「just how busy the screen is」「The progress bar on top when you scroll down is a little distracting too」（2024-11-01）、「It isn't the most beginner friendly application」（2023-04-17）。画面写真は説明が取れず見ていない | https://www.enki.com/ 、https://apps.apple.com/us/app/enki-learn-coding-programming/id993753145 | 2026-10-30 |
| R-3 | Mimo。公式サイト：見出し「Learn to Code in Python, JavaScript, HTML, CSS, & more」、CTA「Start learning for free」「Sign up with Google」はどちらも登録ページへ。「short, interactive, and guided step by step」「Just a few minutes a day can make progress」、推薦文「Think of Duolingo, but for programming」。長い高密度のページ。App Store JP：「毎日のやる気アップ機能つき」「最初の 1 行のコードから始めて」、推薦文「短いレッスンだから、忙しい日でも続けられる」。評価 4.8 / 1,033。レビュー「I already find the UI very impressive」「the number of hearts will be 0」。ヘルプセンターの一覧に「I've lost my Mimo streak. How can I repair it?」「Streak Freeze」「Keys – here's how they work」。検索の抜粋では修復は「tap the coin icon to open the Mimo store」「once per month」。記事本文は 403 で見ていない。画面写真は見ていない | https://mimo.org/ 、https://apps.apple.com/jp/app/mimo-learn-programming-coding/id1133960732 、https://support.mimo.org/hc/en-us/sections/12794269907986-Streaks-Progress | 2026-10-30 |
| R-4 | Exercism。トップ：「Get really good at programming」、CTA「Sign up for free」と「Explore languages」、「primarily built as a CLI-first tool」「Download and submit exercises right from your terminal」、ブラウザのエディタと「automatic analysis」もある。「human mentoring, for free」。絵文字（👋 🎉）あり。トラック一覧：「85 languages for you to master」をテキストリンクで 5 列、絞り込みも件数もない。Python トラック：「146 exercises」「17 concepts」「848,745 students」、CTA「Join the Python Track」はサインインへ、「Learn」と「Practice」の2区分。未登録で演習を開けるかはページに書かれておらず見ていない | https://exercism.org/ 、https://exercism.org/tracks 、https://exercism.org/tracks/python | 2026-10-30 |
| R-5 | roadmap.sh。トップ：「Developer Roadmaps」「Skill up with community created roadmaps, guides, and courses」、「All 96 roadmaps」（31 role-based、60 skill-based、5 best-practice）、単一の導入 CTA はなく一覧と検索（⌘K）が入口、上部ナビは Roadmaps / AI Tutor / Packs / Newsletters、「371K GitHub stars」「3.2M registered users」「52K Discord members」、登録の誘いは「Register yourself」「Commit to your growth」。Backend の地図：ナビは Roadmap / Projects / AI Tutor / Personalize、毎日の計画やスケジュールの記述はなし、「Track your progress」「Mark as done」の文言は本文になし。地図の図そのものは文字で取れず見ていない | https://roadmap.sh/ 、https://roadmap.sh/backend | 2026-10-30 |
| R-6 | Wordle（Wikipedia）。Wardle は1日1問が「creates a sense of scarcity, leaving players wanting more」「encourages players to spend only three minutes on the game each day」（2022-01）。「It's not trying to do anything shady with your data or your eyeballs ... It's just a game that's fun」（Guardian、2022-01-04）。「a high-contrast mode for colourblind accessibility」（緑と黄を橙と青に）。「a shareable emoji-based results format」。NYT 移行（2022-02-10）で「introduction of account logins to track stats」。「from 90 players on November 1, 2021, to over 300,000 by January 2, 2022」。NYT のゲーム本体（https://www.nytimes.com/games/wordle/index.html ）と NYT ヘルプ（https://help.nytimes.com/hc/en-us/articles/360058287251-Wordle ）は取得できず見ていない | https://en.wikipedia.org/wiki/Wordle | 2026-10-30 |
| R-7 | Wordle の設計の解説（Kobe Digital）。「These rules are explained in a popup that takes less than 10 lines」「A fixed frequency of just one game per day encourages habit formation」「You don't need to think too hard to interact with it」、黄と緑のタイル、High Contrast Mode は「replaces yellow and green with blue and orange」、絵文字の共有は「don't support text-to-speech」。解析者の意見であり、計測された研究ではない。Medium（uxdesign.cc）と Webflow の記事は 403 とヘッダーエラーで見ていない | https://kobedigital.com/ux-tips-from-wordle/ | 2026-10-30 |
| R-8 | GOV.UK「Start with one thing per page」。1ページ1問にすると、人が「understand what you're asking them to do」「focus on the specific question and its answer」「find their way through an unfamiliar process」「use the service on a mobile device」でき、作り手は「save a user's answers automatically as they go」できる | https://www.gov.uk/service-manual/design/form-structure | 2026-10-30 |
| R-9 | NN/g 空の状態。「Totally empty states cause confusion about how and whether the system is working」。読み込み中に偽の「no records」を出さない。「Tell the user what could be displayed, and how to populate the area with that content」。要素は、正確な状態、学びの手がかり、直接の道筋（最初の一歩のボタン） | https://www.nngroup.com/articles/empty-state-interface-design/ | 2026-10-30 |
| R-10 | NN/g エラー文の採点表。「The error should be displayed next to the associated interface element(s)」「Warnings should not look like errors and should not use conventional error-message styling」「The error message should describe a solution that is sufficient for the user to fix the problem」、入力は「automatically preserved and referenced within the error message」、「The tone of the error message should be positive」 | https://www.nngroup.com/articles/error-messages-scoring-rubric/ | 2026-10-30 |
| R-11 | NN/g 文言の調子の4軸：「Formal vs. casual」「Serious vs. funny」「Respectful vs. irreverent」「Matter-of-fact vs. enthusiastic」。「variations along the four tone dimensions would produce measurable differences in users' impressions of the sites」 | https://www.nngroup.com/articles/tone-of-voice-dimensions/ | 2026-10-30 |
| R-12 | NN/g ブランドの性格語。「a set of 3–7 words that express the essence of your Brand」を選び、語の意味を定めて文言、書体、音に当てる。意図と解釈の差を埋めないと「Brand is compromised」 | https://www.nngroup.com/articles/brand-intention-interpretation/ | 2026-10-30 |
| R-13 | Reinecke と Gajos 2014。「the level of colorfulness and visual complexity at which visual appeal is highest strongly varies」。「Females, for example, liked colorful websites more than males」「A high education level generally lowers this preference for colorfulness」「Russians preferred a lower visual complexity」 | https://eecs.harvard.edu/~kgajos/papers/2014/reinecke14visual.shtml | 2026-10-30 |
| R-14 | WCAG 2.2 SC 1.4.3 Contrast (Minimum)。「a contrast ratio of at least 4.5:1」、大きい文字は「at least 3:1」。大きい文字は「at least 18 point or 14 point bold」で、「14pt and 18pt are equivalent to approximately 18.5px and 24px」。「the computed values should not be rounded (e.g., 4.499:1 would not meet the 4.5:1 threshold)」 | https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html | 2026-10-30 |
| R-15 | WCAG 2.2 SC 1.4.11 Non-text Contrast。「a contrast ratio of at least 3:1 against adjacent color(s)」が「Visual information required to identify user interface components and states」に要る。作り手が様式を変えたフォーカスの印は「must have sufficient contrast against the adjacent background」 | https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html | 2026-10-30 |
| R-16 | WCAG 2.2 SC 1.4.10 Reflow。「Vertical scrolling content at a width equivalent to 320 CSS pixels」で2方向のスクロールなしに提示できること。例外は地図、図、データ表など2次元が要るもので、「each cell within a table, would still need to meet this success criterion」 | https://www.w3.org/WAI/WCAG22/Understanding/reflow.html | 2026-10-30 |
| R-17 | WCAG 2.2 SC 2.5.8 Target Size (Minimum、AA)：「at least 24 by 24 CSS pixels」、例外は間隔（24 px の円が他の的と交わらない）と文中のリンク。SC 2.5.5 Target Size (Enhanced、AAA)：「at least 44 by 44 CSS pixels」 | https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html 、https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html | 2026-10-30 |
| R-18 | WCAG 2.2 SC 2.4.11 Focus Not Obscured (Minimum)。「When a user interface component receives keyboard focus, the component is not entirely hidden due to author-created content」。固定の Cookie バナーは「will fail this success criterion if it entirely obscures a component receiving focus」。回避はモーダルにするか scroll padding | https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html | 2026-10-30 |
| R-19 | WCAG 2.2 SC 4.1.3 Status Messages。「status messages can be programmatically determined through role or properties such that they can be presented to the user by assistive technologies without receiving focus」。例：「Saved in 'Wedding' album」の知らせが読み上げられる。成功の知らせは ARIA22（`role="status"`） | https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html | 2026-10-30 |
| R-20 | WAI-ARIA APG モーダルダイアログ。「The element that serves as the dialog container has a role of dialog」「The dialog container element has aria-modal set to true」「When a dialog opens, focus moves to an element contained in the dialog」「Escape: Closes the dialog」「When a dialog closes, focus returns to the element that invoked the dialog」。aria-modal は「can prevent users of some assistive technologies from perceiving content outside the dialog」ので、外を本当に操作できなくするときだけ | https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ | 2026-10-30 |
| R-21 | WAI-ARIA APG ラジオグループ。Tab と Shift+Tab は「Move focus into and out of the radio group」、Space は「checks the focused radio button if it is not already checked」、矢印キーで前後に移動し端で折り返す | https://www.w3.org/WAI/ARIA/apg/patterns/radio/ | 2026-10-30 |
| R-22 | MDN `prefers-color-scheme`：「used to detect if a user has requested light or dark color themes」。`light` は「has not expressed an active preference」も含む。「A common usage is to use a light color scheme by default, and then use prefers-color-scheme: dark to override」。`<meta name="color-scheme" content="light dark">` は「the first scheme is preferred by the document, but that the second scheme is acceptable if the user prefers it」。「only dark」は無効 | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme 、https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/color-scheme | 2026-10-30 |
| R-23 | MDN `prefers-reduced-motion`：「detect if a user has enabled a setting on their device to minimize the amount of non-essential motion」。「Animations such as scaling or panning large objects can be vestibular motion triggers」。`reduce` で動きを「removes, reduces, or replaces」する（例は拡大縮小を不透明度の変化に置き換え） | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion | 2026-10-30 |
| R-24 | Apple「Configuring Web Applications」（アーカイブ）。「Set the apple-mobile-web-app-capable meta tag to yes to turn on standalone mode」、スタンドアロンでは「there is no browser URL text field at the top of the screen or button bar at the bottom of the screen」、判定は「window.navigator.standalone read-only Boolean JavaScript property」、`apple-touch-icon` の例は 180×180（iPhone Retina）と 167×167（iPad Retina）、起動画像は「By default, a screenshot of the web application the last time it was launched is used」、`apple-touch-startup-image` で差し替え | https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html | 2026-10-30 |
| R-25 | iOS Safari の入力欄の拡大。「16px or larger, Safari on iOS will focus into the input normally」、「15px or less」では入力欄にズームする。対策は「make the font big enough」 | https://css-tricks.com/16px-or-larger-text-prevents-ios-form-zoom/ | 2026-10-30 |
| R-26 | デジタル庁デザインシステム タイポグラフィ。「本文やUIにおいては16 CSS px以上が基準値となります」「14 CSS px未満の大きさの使用は原則として許容されません」「本文テキストの行ボックスの高さ（行高）はフォントサイズに対して少なくとも1.5倍を維持することを推奨します」、行間は 150% が「本文の行間としては最低限度」、160%・170% が一般の本文向け。書体は「Noto Sans JP」と「Noto Sans Mono」。line-height は単位なしの数で書く | https://design.digital.go.jp/foundations/typography/ | 2026-10-30 |
| R-27 | NN/g の 10 のユーザビリティ原則（1994-04-24、2024-01-30 に見直し）。1「Visibility of system status」：「The design should always keep users informed about what is going on」。8「Aesthetic and minimalist design」：「Interfaces should not contain information that is irrelevant or rarely needed」。9「Help users recognize, diagnose, and recover from errors」：「Error messages should be expressed in plain language (no error codes), precisely indicate the problem」、直し方を建設的に示す。G3 r1 の design-reviewer の指摘 3（日付が変わった後の操作に知らせがない）と提案 8（出続ける注意は効き目が薄れる）の根拠 | https://www.nngroup.com/articles/ten-usability-heuristics/ | 2026-11-03 |
| R-28 | MDN `tabindex`。負の値は「the element is not reachable via sequential keyboard navigation」だが、「can be focused with JavaScript (by calling the focus() method)」。「may be useful for elements that should not be navigated to directly using the Tab key, but need to have keyboard focus set to them」。操作の後に差し替わった画面の知らせへフォーカスを移す手段（読み上げと、画面の先頭へのスクロールを兼ねる）。`<dialog>` には付けない | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex | 2026-11-03 |
| R-29 | web.dev「Persistent storage」。Chromium は確認を出さずに判断し、「if a site is considered important, the persistent storage permission is automatically granted」。基準は「How high is the level of site engagement?」「Has the site been installed or bookmarked?」「Has the site been granted permission to show notifications?」。「If the request was denied, it can be requested again later and will be evaluated using the same heuristics」。今の状態は「Calling navigator.storage.persisted() returns a Promise that resolves with a boolean」。Firefox は「prompts the user with a UI popup」（確認が出る）。Safari の挙動の記述はない（15.2 で対応とだけ） | https://web.dev/articles/persistent-storage | 2026-11-03 |
| R-30 | NN/g「The Principle of Common Region」（2020-07-12）。「items within a boundary are perceived as a group」で、同じ性質か働きを持つと受け取られる。枠や地の色の箱は構造を早く見せるが、使いすぎると散らかるので、多くの場合は余白だけで足りる。枠で囲むのは「閉じる」で消える範囲を示す案内 1 か所だけに限る根拠 | https://www.nngroup.com/articles/common-region/ | 2026-11-03 |
| R-31 | MDN `StorageManager.persisted()`。「returns a Promise that resolves to true if your site's storage bucket is persistent」。Baseline「Widely available」「has been available across browsers since December 2021」（対応ブラウザの版の表は取れなかった。Safari 17 で使えるかは実機で未確認） | https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persisted | 2026-11-03 |

### 8.1 決めたいことごとの示唆（仕様に渡す。決定そのものは design/001-daily-learning.md で行う）
| 決めたいこと（1 の番号） | 示唆 | 根拠 |
|---|---|---|
| 1 画面の流れ | 初回：`diagnosis.start`（10 行以内の説明と「始める」1つ）→ `diagnosis.question` ×3（1画面1問、n / 3、ネイティブのラジオ）→ `task.today`。2回目以降：開いたら `task.today`（または `task.done` / `task.skipped` / `task.exhausted`）。設定、履歴、統計は `task.*` から1タップで行き、戻る | R-7、R-8、R-21、AC-1、AC-2、AC-31 |
| 2 1日1つの見せ方 | 題名を最初の見出し（h1）にし、4要素を見出しなしの短い段落か定義リストで縦に並べる。4つの申告は同じ画面の末尾に、「完了」を主操作、他3つを副操作として縦並び（320 px で横並びにしない）。`task.done` と `task.skipped` は次の課題を見せず「今日は終わり」の1文と、履歴へのリンクだけ | R-5 の対極、R-6、R-7、R-16、R-17、差をつける点 1・2 |
| 3 答えを書く欄 | 課題の本文の下、申告の上に `textarea` を1つ。ラベルに「任意」と明記。フォントは 16 px 以上。保存は黙って行い、「保存しました」を `role="status"` の小さな文で出す（視覚にも文字で） | R-19、R-25、R-26、AC-32 |
| 4 外で行う課題の印 | 題名の直下に文字の印（「外で行う」/「Outside the browser」）と道具の一覧を、アイコン＋文字で出す。色だけに頼らず、枠は 3:1 以上 | R-7、R-15、AC-30 |
| 5 空の状態と知らせ | 「何が起きたか」＋「次の一手のボタン」の2要素で統一。`task.exhausted`：尽きたこと＋「診断をやり直す」。履歴0件：まだ無いこと＋「今日の課題へ」。AC-21 の案内は `diagnosis.start` の本文の一部として（課題を覆わない）。AC-13 の知らせは設定の中に文字と「書き出す」ボタン。読み込みの失敗は選んだファイルのそばに理由と直し方 | R-9、R-10、R-18、AC-10、AC-11、AC-13、AC-21、AC-22、AC-25 |
| 6 統計の見せ方 | 1画面に 9 つの値を定義リストで縦に並べ、ラベルは 13 の指標の名前と同じ語。グラフは使わない（色と2次元が増える）。スクリーンショット1枚に収まる高さを目安 | R-16、案A、AC-24 |
| 7 日英 | です・ます、絵文字なし、ボタンは動詞。英語は Start / Done / Too hard / Too easy / Not today / Export / Import。英語で長くなる箇所（申告の4ボタン、設定の項目）は最初から縦並び | R-11、5 の調子、AC-26 |
| 8 ダークモードと文字 | OS の設定に従い、独自の切り替えなし。`color-scheme: light dark`。本文 16 px 以上、行間 1.6〜1.7、14 px 未満なし。書体はシステムの sans-serif（Web フォントは初回転送 150 KB 以内の PRD 12 の枠に入らない可能性が高いため。Noto Sans JP の実際の転送量は見ていない）。フォーカスの枠 2 px 以上で 3:1 以上。主操作は 44×44 px 以上 | R-14、R-15、R-17、R-22、R-23、R-26、AC-17、AC-18、AC-27 |

見られなかったもの：
- 競合4本のアプリ内の画面（App Store の画面写真は説明が取れず、アプリは開けない）。タップ数と空の状態は4本とも「見ていない」。
- Enki のサインアップ画面（learn.enki.com/join は題名しか取れなかった）。
- Mimo のヘルプ記事の本文（support.mimo.org は 403。一覧の題名と検索の抜粋だけ）。
- Exercism の未登録での演習画面（ページに記述がない）。
- roadmap.sh の地図の図そのもの（文字で取れない）。
- NYT の Wordle 本体と NYT ヘルプ（nytimes.com、help.nytimes.com は取得できない）。Medium（uxdesign.cc）の Wordle 記事（403）、Webflow のブログ（ヘッダーエラー）。
- Apple HIG の Design principles と Accessibility のページ（開いたが本文が取れなかった。HIG の文言は引用せず、WCAG と B-n で代える）。
- Noto Sans JP の Web フォントの転送量（確かめていない）。

## 確かめ（提出前に designer が印を付ける。design-reviewer はこれを信じずに確かめる）
- [x] R が5つ以上あり、どれにも出典 URL と確認日がある（R-1〜R-26 は 2026-10-30、R-27〜R-31 は 2026-11-03）
- [x] 競合を2つ以上と、手本を1つ調べた。不満は引用と URL 付き（競合4本：Enki、Mimo、Exercism、roadmap.sh。手本：Wordle）
- [x] ターゲットは「仮説」と書き、根拠に R 番号がある
- [x] 性格語ごとに「意味しないこと」がある
- [x] 差をつける点が1から2個ある（2個）
- [x] 方向性の2案と、選ばなかった理由がある
