# デザイントークン（今日の一手。ブラウザだけで動く Web アプリ）

- 書いた役：designer　日付：2026-10-30　初版（001-daily-learning で導入）
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
| color.success | 成功の知らせの文字（「保存しました」） | #1B6E3A | #7FD39A | #0E4D28 | #A6E3B5 | `--color-success` |
| color.warning | 注意の文字（永続化を断られた、ホーム画面の案内の見出し） | #7A4A00 | #F2C35B | #5A3600 | #F7D98B | `--color-warning` |
| color.error | エラーの文字と枠、取り消せない操作のボタンの文字 | #B42318 | #F28B82 | #8A1A12 | #F7B1AB | `--color-error` |

- 地の色は1つだけ。カード、面、影、グラデーションは置かない（案A「一枚の紙」。B-2）。区切りは余白と 1 px の `color.border` の線だけ。
- リンクは `color.action.primary` の文字に下線を必ず付ける（色だけで区別しない。WCAG 2.2 SC 1.4.1）。
- `<meta name="color-scheme" content="light dark">` を置き、フォーム部品とスクロールバーもダークに追従させる（R-22）。

## 2. 文字（text.*）
書体は1つ。システムの sans-serif だけを使い、Web フォントは読まない（初回転送 150 KB の枠。R-26 の Noto Sans JP の転送量は確かめていない）。
`font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Hiragino Sans", "Noto Sans JP", sans-serif`。行内のコードは `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`、大きさは周囲と同じ 1em。
段階は4つ（B-4：3段を目安に多くても4段）。Ultralight、Thin、Light は使わない。

| トークン | 大きさ | 太さ | 行間 | 使う所 | CSS |
|---|---|---|---|---|---|
| text.title | 24 px（1.5 rem） | 700 | 1.4 | 画面の h1（課題の題名、画面の題名） | `--text-title` |
| text.heading | 16 px（1 rem） | 700 | 1.6 | 画面内の h2（なぜ今これか、やり方、完了の目安、設定の節）、入力欄のラベル | `--text-heading` |
| text.body | 16 px（1 rem） | 400 | 1.6 | 本文、ボタン、入力欄、選択肢 | `--text-body` |
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

## 4. 部品の形（component.*）
標準の HTML 部品に、上のトークンだけで様式を当てる。独自の部品は作らない。

| 部品 | 形 |
|---|---|
| ボタン（主操作） | `<button>`。塗り color.action.primary、文字 color.action.onPrimary、text.body の太さ 600、高さ 44 px 以上、内側 space.3 と space.4、角 size.radius。幅は列いっぱい（幅 480 px 未満）か内容に合わせる（480 px 以上） |
| ボタン（副操作） | `<button>`。塗りなし、枠 size.border の color.border、文字 color.text。寸法は主操作と同じ |
| ボタン（取り消せない操作） | `<button>`。塗りなし、枠 color.error、文字 color.error。確認ダイアログの「削除する」「置き換える」と、設定の「すべてのデータを削除」 |
| リンク | `<a>`。文字 color.action.primary、下線あり。押せる範囲は行の高さで 44 px に満たないので、単独で置くときは上下に space.3 の内側を付ける |
| 入力欄（textarea） | `<textarea>`。枠 color.border、角 size.radius、文字 text.body、内側 space.3、`rows="6"`、幅は列いっぱい。縦だけ伸ばせる |
| 選択肢（radio） | ネイティブの `<input type="radio">` と `<label>`。ラベル全体を押せる範囲にし、高さ 44 px 以上、選択肢の間 space.2。`accent-color: var(--color-action-primary)` |
| ダイアログ | `<dialog>` を `showModal()` で開く。幅は min(列の幅, 480 px)、内側 space.5、枠 size.border の color.border、地 color.bg。背景は `::backdrop` を半透明の黒（rgba(0,0,0,0.5)）にする |
| 印（badge） | `<span>` の文字と枠だけ。枠 size.border の color.text、内側 space.1 と space.2、角 size.radius。色は付けない |
| 知らせ（status、alert） | `<p role="status">` か `<p role="alert">`。文字だけ。成功は color.success、注意は color.warning、エラーは color.error。アイコンは置かない |
| 定義リスト（統計、課題の要素） | `<dl>`。`<dt>` は text.heading、`<dd>` は text.body。常に縦に積む（横並びにしない。R-16） |

## 5. 動き
- 画面の切り替えに動きを付けない（状態の差し替えだけ）。
- 唯一の動きは「保存しました」の知らせの不透明度（0→1、150 ms）と、`app.loading` の文の遅延表示（1 秒後に不透明度 0→1）。`prefers-reduced-motion: reduce` では時間を 0 にする（R-23）。
