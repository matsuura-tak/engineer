# デザイントークン（今日の一手。ブラウザだけで動く Web アプリ）

- 書いた役：designer　日付：2026-10-30　初版（001-daily-learning で導入）。**r9（2026-11-06）：仕様 r12 に合わせ、1 の color.warning の使う所から「答えの上限」を消し（キーは r11 で消えていた）、4 のホバーと押した瞬間の表に `aria-disabled="true"` の行を足した（design-reviewer G1 r5 の 8、11）。値は変えていない。** r8（2026-11-06）：仕様 r11（PRD r13 の FB2、Takuma の選択：ミルと案D「5 色」）に合わせ、1 に color.figure.accent と color.guide、3 に図の寸法 3 つ（size.figure.border、size.figure.border.accent、size.radius.figure）、4 に部品 5 行（選択肢、返しの区画、図、案内役、チェックボックス）を足し、1 の「箱を置かない」の例外に図の箱を足し、5 の動きに返しの区画の不透明度を足した。既存の値は変えていない。入力欄（textarea）の行は 001 では使わなくなったが、部品の定義として残す。**r2：G1 r1 の design-reviewer の指摘 3、5、10、11 を反映（color.overlay、リンクの最小幅、ホバーと押した瞬間、定義リストの使い所、ファイルの読み込みの部品）。r3：G1 r2 の design-reviewer の提案 1 を反映（4「リンク」の列挙にヘッダーのアプリ名 `app.name` を足した）。r4：Takuma の決定 D1（主操作の色は青。値は変えない）と D5（ホーム画面のアイコンの色）を受けて、1 にアイコンの 1 行。r5（2026-11-03）：G3 r1 の design-reviewer の指摘 4〜6 と提案 9、11 を受けて、1 に案内の枠の例外と color.warning の使い所、4 にボタンの幅の規則が及ぶ範囲、リンクと summary の左端、入力欄のエラーの枠、「案内」と「開閉」の行。値は変えていない。r6（2026-11-05）：仕様 r7（FB-2、FB-3）に合わせ、2 の text.title の「使う所」に累計の値を足した。新しいトークンは足さず、値も変えていない。r7（2026-11-05）：仕様 r8（Takuma の答え「控えめな演出を足す」。D-43）に合わせ、5 に動きのトークン 4 つ（motion.fade、motion.tick、motion.draw、motion.delay.tick）を足し、1 の color.success の使う所に完了の印と節目の文を足した。色と文字と余白の値は変えていない
- 使い方：画面の仕様（design/<機能名>.md）と実装（CSS カスタムプロパティ）は、ここにある名前だけを使う。色の値を直接書かない。
- 単位：CSS px。文字と余白は実装では rem（16 px = 1 rem）にして、ブラウザの文字サイズ設定と拡大に追従させる（調査 R-16、R-26）。
- 根拠：design/001-daily-learning-research.md の R 番号と、原則 B-1〜B-6（.claude/skills/craft-designer/SKILL.md）。コントラスト比は WCAG 2.2 の式で計算した（計算スクリプトの出力は design/001-daily-learning.md の 9 に転記）。

## 1. 色（color.*）
意味で名付ける。色は意味（主操作、成功、注意、エラー、枠、フォーカス）にだけ使い、飾りには使わない（B-5、R-7）。
3通りの値を持つ：ライト（既定）、ダーク（`prefers-color-scheme: dark`。R-22）、コントラストを上げる（`prefers-contrast: more`。ライトとダークの両方）。
`forced-colors: active`（Windows のハイコントラストなど）ではブラウザのシステム色に置き換わるので、ここでは値を持たない。枠と下線で意味を保つ（design/001-daily-learning.md の 9）。

| トークン | 意味 | ライト | ダーク | 上げる（ライト） | 上げる（ダーク） | CSS |
|---|---|---|---|---|---|---|
| color.bg | ページの地 | #FFFFFF | #121212 | #FFFFFF | #000000 | `--color-bg` |
| color.text | 本文、見出し、印の文字 | #1F1F1F | #E8E8E8 | #000000 | #FFFFFF | `--color-text` |
| color.text.secondary | 補助の文、日付、注記 | #595959 | #B3B3B3 | #2E2E2E | #E0E0E0 | `--color-text-secondary` |
| color.action.primary | 主操作のボタンの塗り、リンクの文字 | #1D4ED8 | #8AB4F8 | #0B3B9E | #A8C7FA | `--color-action-primary` |
| color.action.onPrimary | 主操作のボタンの文字 | #FFFFFF | #0B1A33 | #FFFFFF | #000000 | `--color-action-on-primary` |
| color.border | 副操作のボタン、入力欄、印、区切りの枠 | #6B6B6B | #8C8C8C | #000000 | #FFFFFF | `--color-border` |
| color.focus | キーボードのフォーカスの枠 | #1D4ED8 | #8AB4F8 | #0B3B9E | #A8C7FA | `--color-focus` |
| color.success | 成功の知らせの文字（「書き出しました」）。r7：S4 の完了の印の線と、節目（7 / 30 / 100）の祝いの文の文字（design/001-daily-learning.md の D-43、D-36）。r8：正誤の返し「正解」の文字と印 `task.answer.mark`、正解の選択肢の印と「正解」の文字（D-47、D-48）。不正解には色を使わない | #1B6E3A | #7FD39A | #0E4D28 | #A6E3B5 | `--color-success` |
| color.warning | 注意の文字（永続化を断られた、ホーム画面の案内の見出し、日付が変わった知らせ） | #7A4A00 | #F2C35B | #5A3600 | #F7D98B | `--color-warning` |
| color.error | エラーの文字と枠、取り消せない操作のボタンの文字 | #B42318 | #F28B82 | #8A1A12 | #F7B1AB | `--color-error` |
| color.figure.accent | 図の強調（r8。案D「5 色」）：`highlight` の箱の枠（3 px）と、そのラベルの文字（700）だけ。主操作、意味色、案内役には使わない（design/001-daily-learning.md の D-50、D-58） | #B45309 | #F2A33A | #7A3400 | #FFC877 | `--color-figure-accent` |
| color.guide | 案内役ミルの色（r8。案D）：名前 `guide.name` の文字（text.small）と、台詞の左の 2 px の縦線だけ。絵（PNG）の体の色は #B48CE0（ライトとダークで同じ。輪郭だけ color.text に切り替える）で、ライトの文字と線には体の陰の色 #7E55C2 を使う（地と 5.30）。図の強調、主操作、意味色には使わない（D-53、D-54、D-58） | #7E55C2 | #B48CE0 | #5B2FA8 | #DCCBF5 | `--color-guide` |
| color.overlay | ダイアログの `::backdrop`（後ろの画面を暗くする。半透明はここだけ） | rgba(0,0,0,0.5) | rgba(0,0,0,0.5) | rgba(0,0,0,0.5) | rgba(0,0,0,0.5) | `--color-overlay` |

- 地の色は1つだけ。カード、面、影、グラデーションは置かない（案A「一枚の紙」。B-2）。区切りは余白と 1 px の `color.border` の線だけ。例外は 2 つ。r8 で足した例外：図の中の箱（`task.figure` の `[data-figure-part="box"]`。図の型を表す線で、飾りではない：design/001-daily-learning.md の D-50。塗りと影はない）。もう 1 つは 4 の「案内」：「閉じる」で消える範囲を示すために四方を 1 px の `color.border` で囲む（塗りと影はない。R-30）。これ以外に四方を囲む箱は作らない。
- ホーム画面のアイコン（`./icon-180.png`。design/001-daily-learning.md の 8 と D-29）は color.bg と color.text のライトの値（#FFFFFF、#1F1F1F）だけで描く。PNG はダークモードや `prefers-contrast` に追従しないので、ライトの値を固定して使う唯一の場所。
- color.overlay は `prefers-reduced-transparency: reduce` では不透明の color.bg にし、ダイアログの境目は枠（color.border）で見せる。地に重ねたときの比は design/001-daily-learning.md の 9（ライトは地の差 3.95:1、ダークは枠 5.92:1 で境目が見える）。
- リンクは `color.action.primary` の文字に下線を必ず付ける（色だけで区別しない。WCAG 2.2 SC 1.4.1）。
- `<meta name="color-scheme" content="light dark">` を置き、フォーム部品とスクロールバーもダークに追従させる（R-22）。

## 2. 文字（text.*）
書体は1つ。システムの sans-serif だけを使い、Web フォントは読まない（初回転送 150 KB の枠。R-26 の Noto Sans JP の転送量は確かめていない）。
`font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Hiragino Sans", "Noto Sans JP", sans-serif`。行内のコードは `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`、大きさは周囲と同じ 1em。
段階は4つ（B-4：3段を目安に多くても4段）。Ultralight、Thin、Light は使わない。

| トークン | 大きさ | 太さ | 行間 | 使う所 | CSS |
|---|---|---|---|---|---|
| text.title | 24 px（1.5 rem） | 700 | 1.4 | 画面の h1（課題の題名、画面の題名）。r6（2026-11-05）：完了の直後の累計の値 `task.total.value`（S4、S5、S7）にも使う。見出し以外でこの段を使う唯一の場所（design/001-daily-learning.md の D-35。指揮役の決定「本文より大きい text style で 1 行」） | `--text-title` |
| text.heading | 16 px（1 rem） | 700 | 1.6 | 画面内の h2（問 n / 3、ひとこと解説、設定の節）、r8：正誤の返しの文字「正解」「惜しい」（仕様の D-48） | `--text-heading` |
| text.body | 16 px（1 rem） | 400 | 1.6 | 本文、ボタン、選択肢、説明、案内役の台詞、図のラベル（強調のラベルだけ 700） | `--text-body` |
| text.small | 14 px（0.875 rem） | 400 | 1.6 | 日付、進み具合、注記、保存の知らせ。14 px 未満は使わない（R-26） | `--text-small` |

- 入力欄（textarea、radio のラベル）は 16 px 以上に固定する（iOS Safari のフォーカス時の拡大を防ぐ。R-25）。
- 行間は単位なしの数で書く。WCAG 2.2 SC 1.4.12（行間 1.5 倍、段落間 2 倍、字間 0.12、語間 0.16）の上書きで崩れないように、高さを固定した箱を作らない。
- 長い語（URL、コマンド、英語の長い単語）は `overflow-wrap: anywhere` で折り返す（AC-17 の横スクロール 0。R-16）。`text-overflow: ellipsis` は使わない。

## 3. 余白と寸法（space.*、size.*）
余白はこの刻みだけ（B-3）。

| トークン | 値 | 使う所 |
|---|---|---|
| space.1 | 4 px | 印の内側の上下、ラベルと補助文の間 |
| space.2 | 8 px | ラベルと入力欄の間、選択肢どうしの間、行内の要素の間 |
| space.3 | 12 px | ボタンどうしの間、ボタンの上下の内側 |
| space.4 | 16 px | 段落の間、画面の左右の余白（幅 600 px 未満）、ボタンの左右の内側 |
| space.5 | 24 px | 節の間、画面の左右の余白（幅 600 px 以上） |
| space.6 | 32 px | 題名の上、申告のボタン群の上、画面の下の余白 |

| トークン | 値 | 意味 |
|---|---|---|
| size.content.max | 640 px（40 rem） | 本文の列の最大の幅。中央に置き、左の線をそろえる |
| size.target.min | 44 × 44 px | 押せる範囲の最小（主操作、申告、設定の操作。R-17 の AAA を目標にする） |
| size.radius | 4 px | ボタン、入力欄、印の角。飾りではなく、枠線の角の欠けを防ぐ最小の値 |
| size.border | 1 px | 副操作のボタン、入力欄、印、区切り |
| size.border.strong | 2 px | エラーの枠（入力欄がエラーのとき） |
| size.focus.width | 3 px | フォーカスの枠（`outline`）。AC-18 の 2 px 以上を満たす値として 3 px に決める |
| size.focus.offset | 2 px | フォーカスの枠と要素の間。塗りのボタンでも枠が地（color.bg）と接して 3:1 以上を保つ |
| size.figure.border | 2 px | 図の箱の枠と連結線、矢印の線（r8。design/001-daily-learning.md の D-50。地と 3:1 以上：color.text） |
| size.figure.border.accent | 3 px | 図の強調の箱の枠（color.figure.accent。D-50） |
| size.radius.figure | 8 px | 図の箱の角（r8。FB2-4 の「pop」を線の太さと角丸で作る：調査 3.3 の示唆 2。ボタンと入力欄の size.radius 4 px とは別で、図の中だけに使う） |

## 4. 部品の形（component.*）
標準の HTML 部品に、上のトークンだけで様式を当てる。独自の部品は作らない。

| 部品 | 形 |
|---|---|
| ボタン（主操作） | `<button>`。塗り color.action.primary、文字 color.action.onPrimary、text.body の太さ 600、高さ 44 px 以上、内側 space.3 と space.4、角 size.radius。幅は列いっぱい（幅 480 px 未満）か内容に合わせる（480 px 以上）。この幅の規則は `<button>` のすべて（主操作、副操作、取り消せない操作）に、どの入れ物（申告の群、設定の節、案内の中、エラーの直下）にあっても同じに当てる（design-reviewer G3 r1 の 5） |
| ボタン（副操作） | `<button>`。塗りなし、枠 size.border の color.border、文字 color.text。寸法は主操作と同じ |
| ボタン（取り消せない操作） | `<button>`。塗りなし、枠 color.error、文字 color.error。確認ダイアログの「削除する」「置き換える」と、設定の「すべてのデータを削除」 |
| リンク | `<a>`。文字 color.action.primary、下線あり（太さ 1 px）。文字だけでは押せる範囲が 44 px に満たないので、単独で置くとき（ヘッダーのアプリ名 `app.name`、nav、「履歴を見る」、「統計を見る」、「設定に戻る」、「プライバシーについて」）は `display: inline-block`、上下に space.3 の内側、左右に space.2 の内側、`min-width: 44px` で 44 × 44 px 以上にする（R-17。design-reviewer r1 の 5）。行の先頭に単独で置くときは、左の内側 space.2 の分を負の margin-left（`calc(-1 * space.2)`）で戻し、文字の左端を列の左の線にそろえる（ヘッダーの `app.name` と同じ扱い。design-reviewer G3 r1 の 4）。文中のリンクはこの機能にはない |
| 入力欄（textarea） | `<textarea>`。枠 color.border、角 size.radius、文字 text.body、内側 space.3、`rows="6"`、幅は列いっぱい。縦だけ伸ばせる。エラーのとき（直下に `error.storage.message` が出ている間）は枠を size.border.strong の color.error にし、`aria-describedby` に補助文とエラーの文の両方を入れる。エラーが消えたら戻す。`aria-invalid` は付けない（値が不正なのではなく保存の失敗のため。design-reviewer G3 r1 の 6） |
| 選択肢（radio） | ネイティブの `<input type="radio">` と `<label>`。ラベル全体を押せる範囲にし、高さ 44 px 以上、選択肢の間 space.2。`accent-color: var(--color-action-primary)` |
| ダイアログ | ネイティブの `<dialog>` を `showModal()` で開く（開くときに DOM に足し、閉じたら外す）。幅は min(列の幅, 480 px)、内側 space.5、枠 size.border の color.border、地 color.bg。背景は `::backdrop` を color.overlay にする（design-reviewer r1 の 11） |
| 印（badge） | `<span>` の文字と枠だけ。枠 size.border の color.text、内側 space.1 と space.2、角 size.radius。色は付けない |
| 知らせ（status、alert） | `<p role="status">` か `<p role="alert">`。文字だけ。成功は color.success、注意は color.warning、エラーは color.error。アイコンは置かない |
| 定義リスト（統計、要る道具） | `<dl>`。`<dt>` は text.heading、`<dd>` は text.body。常に縦に積む（横並びにしない。R-16）。S9 の 9 つの値と、S3 の `task.external.tools` に使う |
| 見出しと段落（課題の 4 要素） | `<h2>`（text.heading）と `<p>`（text.body）。`task.why` / `task.how` / `task.goal` の見出しと本文。定義リストにはしない（読み上げソフトの見出し移動のため。design-reviewer r1 の 3） |
| ファイルの読み込み | 見える `<button>`（副操作の形。保存データなしの S8 では主操作の形）が、隠した `<input type="file">` の `click()` を呼ぶ。input は視覚的に隠し（1 px、`clip-path: inset(50%)`。`display: none` にしない）、`tabindex="-1"` と `aria-hidden="true"`。フォーカスの枠と名前はボタンが持つ（design/001-daily-learning.md の 9。design-reviewer r1 の 4） |
| 案内（notice） | `<section aria-labelledby>`。`home.addToHomeScreen`（S1、S8）と `home.standalone`（S1）。四方を size.border の color.border で囲み、角 size.radius、内側 space.4、上下の外側 space.5。塗り、影、アイコンはない。枠は「閉じる」で消える（または読み込みで置き換わる）範囲を示すためで、1 の例外（R-30。design-reviewer G3 r1 の 11）。中の h2 は text.heading で、`home.addToHomeScreen.title` だけ color.warning |
| 開閉（details / summary） | ネイティブの `<details>` と `<summary>`（S10 の答え）。summary は text.body、高さ 44 px 以上、上下 space.3 と左右 space.2 の内側。行の先頭に置くので、リンクと同じ負の margin-left で、見える左端（開閉の印）を列の左の線にそろえる（design-reviewer G3 r1 の 4） |
| 選択肢（3 択の問題。r8） | `<button data-testid="task.choice">`。副操作の形（塗りなし、枠 size.border の color.border、文字 color.text、text.body、左寄せ、折り返す）、高さ 44 px 以上、列いっぱい、縦に 3 つ、間 space.2。答えた後は `aria-disabled="true"`（`disabled` にしない）、選んだ選択肢の枠は size.border.strong の color.border、正解の選択肢に印 `task.answer.mark`（1em の inline SVG、color.success）と文字「正解」。none の選択肢の見た目は変えない（design/001-daily-learning.md の D-47） |
| 返しの区画（r8） | `<div data-testid="task.question.feedback">`。塗り、枠、影なし。上の外側 space.3。正誤の文（text.heading。正解は color.success、惜しいは color.text）→ 案内役 → 説明（ラベルは text.small の secondary、本文は text.body）→ 主操作のボタン。現れるときの不透明度 0→1 は motion.fade（reduce では 0 ms） |
| 図（r8） | `<figure data-testid="task.figure" role="img">`。地は `background-color: var(--color-bg)` を明示。箱：枠 size.figure.border の color.text、角 size.radius.figure、内側 space.2 と space.3、塗りなし。強調の箱：枠 size.figure.border.accent の color.figure.accent、ラベルは 700 で color.figure.accent。線と矢印：size.figure.border の color.text。ラベルは text.body、`overflow-wrap: anywhere`。幅は列いっぱい、上下の外側 space.4。型ごとの組み方は仕様の D-51 |
| 案内役（r8） | `<aside data-testid="guide.character">`。絵 `guide.sprite` は 96 × 96 CSS px に固定（48 の 2 倍。rem にしない）、`image-rendering: pixelated`。名前は text.small の color.guide、台詞は text.body の color.text で、台詞の左に 2 px の縦線（color.guide、内側 space.2）。吹き出し、塗り、影はない。幅 480 px 以上は絵を左に横並び（間 space.3）、未満は縦に積む。4 表情で絵の大きさと位置は同じ（D-53、D-54） |
| チェックボックス（r8） | ネイティブの `<input type="checkbox">` と `<label>`（`settings.character.show`）。ラベル全体を押せる範囲にし高さ 44 px 以上、`accent-color: var(--color-action-primary)`。radio と同じ扱い |

### ホバーと押した瞬間（design-reviewer r1 の 10）
新しい色を足さない。変えるのは下線と、既にある 2 色の入れ替えだけ。切り替えに transition を付けない（5）。

| 状態 | ボタン（主操作、副操作、取り消せない操作） | リンク |
|---|---|---|
| ホバー（`@media (hover: hover)` の中だけ。タッチでは出ない） | 文字に下線（`text-decoration: underline`、太さ 1 px）。塗り、枠、色は変えない | 下線の太さを 2 px（`text-decoration-thickness`）。色は変えない |
| 押した瞬間（`:active`） | 塗りと文字の色を入れ替える。主操作：塗り color.action.onPrimary、文字と枠 color.action.primary。副操作：塗り color.text、文字 color.bg。取り消せない操作：塗り color.error、文字 color.bg。入れ替えた組の比は仕様 9 の表にある組と同じ（最小 6.57:1） | ホバーと同じ（下線 2 px） |
| `aria-disabled="true"` のボタン（答えた後の選択肢 `task.choice`。仕様の D-47。r9） | ホバーの下線も、押した瞬間の入れ替えも当てない（`:hover` と `:active` の規則を `:not([aria-disabled="true"])` に限る）。見た目は答えた直後のまま（選んだ枠 2 px、正解の印と文字）。理由：入れ替えると正解の印 color.success と塗り color.text の比が 2.62（ライト）/ 1.47（ダーク）で読めず、下線は押せると誤って伝える（design-reviewer G1 r5 の 8） | — |
| フォーカス（`:focus-visible`） | size.focus.width の `outline`、size.focus.offset、color.focus（3 の表。ホバーや押した瞬間と重なってもそのまま出す） | 同左 |
| 無効（`disabled`） | 使わない。進めないときは無効にせず、エラーの文を出す（仕様の D-8） | — |
| `forced-colors: active` | システム色に任せ、下線と枠だけ残す | 同左 |

## 5. 動き（motion.*）
- 画面の切り替えに動きを付けない（状態の差し替えだけ）。r8：図と案内役の絵にも動きを付けない（絵は表情の差し替えだけ：仕様の D-57）。
- 動きは 4 つだけ（r8 で「保存しました」を「書き出しました」に、S3 の返しの区画の不透明度を足した）：「書き出しました」の知らせの不透明度（0→1、motion.fade）、S3 の返しの区画 `task.question.feedback` が現れるときの不透明度（0→1、motion.fade。仕様の D-13）、`app.loading` の文の遅延表示（1 秒後に不透明度 0→1、motion.fade）、S4 を「完了」の直後に描いたときの完了の演出（design/001-daily-learning.md の D-43。1 秒未満で 1 回。印の線が描かれ、累計の数字が前の値から増える。節目では円が先に描かれる）。
- `prefers-reduced-motion: reduce` では motion.* のトークン 4 つ（motion.fade、motion.draw、motion.tick、motion.delay.tick。上の「動きは 3 つ」は動く場面の数で、完了の演出が draw、tick、delay.tick の 3 つを使う）をすべて 0 ms にする（R-23、R-33、R-38。design-reviewer G1 r4 の提案 4、2026-11-05）。完了の演出は動きなしで最終の状態だけ（印は完成した形、数字は最終の値、前の値の要素は作らない）。色は reduce でも同じ。
- イージングは `ease-out` だけ（CSS のキーワード。独自の cubic-bezier は足さない：B-2）。拡大、回転、ぼかし、横方向の移動は使わない（R-40 の引き金）。
- 実装は app.css のクラスと `@keyframes` だけで行う（CSP：`style` 属性とインラインのスタイルを使わない。contracts/budgets.md の 3）。

| トークン | 値 | 使う所 | CSS |
|---|---|---|---|
| motion.fade | 150 ms | 「書き出しました」と `app.loading` の不透明度、r8：S3 の返しの区画の不透明度（r6 までの `--motion`。名前を変えた） | `--motion-fade` |
| motion.tick | 250 ms | S4 の累計の数字：`task.total.prev`（前の値）が上へ 0.3em 動いて消え、`task.total.value`（新しい値）が下から 0.3em 上がって現れる（D-43） | `--motion-tick` |
| motion.draw | 400 ms | S4 の完了の印：`stroke-dashoffset` 1→0 で線が描かれる。節目では円（400 ms）の後にチェック（400 ms） | `--motion-draw` |
| motion.delay.tick | 300 ms | S4 を描いてから数字が動き始めるまで。節目では motion.draw（円の分）を足して 700 ms | `--motion-delay-tick` |

- 時間の表（0 は S4 を描いた時点）：通常＝チェック 0〜400 ms、数字 300〜550 ms。節目＝円 0〜400 ms、チェック 400〜800 ms、数字 700〜950 ms。どちらも 1 秒未満で、途中でもボタンは押せる（R-32）。
