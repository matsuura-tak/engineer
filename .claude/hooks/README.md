# フックの説明

.claude/settings.json に登録しているフックです。settings.json にはコメントを書けないので、ここで説明します。
このフォルダはキット（matsuura-tak/ai-）が管理します。アプリの中では直さず、直したいときはキットに issue を立てます。

## guard.sh と guard.py（PreToolUse：Edit、Write、MultiEdit、NotebookEdit、Bash、Agent、Skill、SendMessage、PowerShell、mcp__.*）
Agent だけは別の行で登録し、timeout を40秒にしています（fable を確かめるのに長くて25秒かかるため）。ほかは10秒です。
役ごとに書いてよい場所を決め、ほかへの書き込みを exit 2 で止めます。止めた理由と、そのパスを書ける役を日本語で返します。

| 役 | 書ける場所 |
|---|---|
| 指揮役（メインセッション） | docs/progress.md、docs/reviews/、docs/approvals/ |
| pdm | docs/prd/、docs/support/、metadata/ |
| designer | app.json の paths.design |
| tech-lead | paths.contracts、docs/adr/、CLAUDE.md、ルートの設定ファイル（.gitignore、README.md、Makefile、Gemfile、.tool-versions、.editorconfig、.swiftlint.yml、fastlane/） |
| ios-engineer | paths.ios（受け入れテストを除く） |
| backend-engineer | paths.backend（受け入れテストを除く） |
| verifier | paths.acceptance_tests、docs/verification/ |
| design-reviewer、reviewer | なし（読み取り専用） |

- 役は入力の agent_type（役割ファイルの name）で決めます。agent_type も agent_id もなければメインセッションなので指揮役です。8つの役以外（general-purpose、Explore、agent_type のないサブエージェントなど）は何も書けません。
- 全員：.claude、.github、.git（下のフォルダの中にあるものも）、.mcp.json、秘密情報（.env*、*.p8、*.p12、*.pem、*.key、*.mobileprovision など）は書けません。
- 全員：エージェントへの指示として自動で読み込まれるファイル（どこにある CLAUDE.md、CLAUDE.local.md、AGENTS.md も）は書けません。例外はリポジトリ直下の CLAUDE.md（tech-lead）だけです。作り手が判定役への指示を仕込めないようにするためです。
- 全員：受け入れテストのフォルダより上にある conftest.py は書けません（受け入れテストの動きを変えられるため）。
- プロジェクトの外には書けません。例外はスクラッチパッドと、指揮役のプランモードの計画ファイル（~/.claude/plans/*.md）です。大文字と小文字だけが違うパス（macOS では同じ場所）はプロジェクトの中として扱います。
- Edit と Write は、迷ったら止めます。app.json が読めない、入力が読めない、中でエラーが出た、のどれでも止めます。
- guard.sh は、python3 が動かない、guard.py が落ちた、というときも止める側に倒すための入口です（Claude Code は exit 2 以外では止めないため）。

### Bash
- 書き先を見るもの：リダイレクト（>、>>）、tee、rm、mv、cp、touch、sed -i、perl -i、awk -i inplace、dd、curl -o、wget -O、find -delete と -exec rm、tar -x -C、unzip -d、git rm、git mv、git restore、git checkout、git -C、bash -c と eval の中。プロジェクトの外（/tmp など）への書き込みは見ません。
- 指揮役は、`git restore <パス>` と `git checkout -- <パス>`（版を指定しないもの）で、範囲の外のファイルも元に戻せます。.claude、.github、.git とリポジトリ全体（.）は除きます。
- サブエージェントには、さらに次を止めます。
  - git で履歴、ブランチ、リモート、設定を変える操作（commit、push、reset、stash、switch、-- のない checkout、clean、update-index、apply、am、tag、branch -d など）。コミットと push は指揮役だけが行います。
  - gh で GitHub を変える操作（pr create、pr merge、release、repo、書き込みの api など）。gh pr view、gh pr diff、gh run view などの読むだけのものは使えます。
  - patch、書き換えるコマンドを渡した xargs。
  - 読み取れないコマンド（引用符の数が合わない、$'...' など）。
  - 書き先や cd の行き先に、値の決まらない $ や ` があるもの（$HOME、$TMPDIR、$CLAUDE_PROJECT_DIR は展開します）。
- 指揮役の読み取れないコマンドは通します。

### Agent、SendMessage、Skill、PowerShell、MCP
- Agent：subagent_type がない、isolation: worktree、汎用エージェント（general-purpose、claude、fork）、組織の役に model を渡す、のどれかなら止めます。model を渡すと役割ファイルのモデルが上書きされ、worktree では書き込みがすべて .claude/ の下になるためです。役の名前は大文字小文字を区別しません（Claude Code は PDM でも pdm の役を動かすため）。
  - 例外は fable の役（役割ファイルが model: fable の役。いまは pdm、designer、verifier、reviewer）です。呼ぶたびに fable_status.py の結果（古ければ確かめ直す）を見て、fable が使えるなら model があると止め、それ以外（上限、確かめられない）なら model: "opus" がないと止めます。opus 以外の model は、どちらのときも止めます。
  - 「使える」の結果があっても model: "opus" で呼ばれたら、その場で確かめ直し、上限なら通します（止めた役を opus で呼び直せるように）。
  - fable_status.py が読めない、確かめの途中で失敗した、というときも、opus なら通します。
- SendMessage：だれも使えません。指揮役が SendMessage で役に続きを頼むと、新しく呼ぶ決まりと、上の fable の確かめを通らないためです（fable で始まった役に続きを頼むと、上限の間は待ち続けます）。続きは Agent で新しく呼びます。
- Skill：役の手引き（.claude/skills/craft-<役>/）を、その役以外（指揮役、ほかの役）が Skill ツールで開くのを止めます。手引きは役割ファイルの skills: で役の起動時に読み込まれ、Skill ツールを通らないので、この確認では止まりません。
- PowerShell：書き先を確かめられないので、だれも使えません。
- MCP：ファイルや GitHub を直接書き換えるツール（名前に create_or_update_file、push_files、delete_file、write_file、edit_file、move_file、merge などを含むもの）は、だれも使えません。claude.ai の GitHub コネクタのように、ガードと git を通らずに main まで書けてしまうためです。PR や issue を作るツールは使えます。settings.json の deny にも、GitHub コネクタの名前で同じものを書いています。

## evidence.py（SubagentStop と、PreToolUse の SubagentHandback）
組織の役が、証拠のない報告で終わろうとしたら、1体につき1回だけ差し戻します。
- 全員：「## 証拠」か「## 実行したコマンドと結果」の見出しと、その下に1行以上の中身が要ります。
- design-reviewer と reviewer：1行目が PASS か FAIL の1語だけであることも見ます。
- SubagentStop では、stop_hook_active が true のとき（2回目）は必ず通します。
- auto モード（claude.ai の Project のスレッドなど）では、報告が SubagentHandback ツールで届くことがあるので、そちらも見ます。こちらには stop_hook_active がないので、差し戻した agent_id を一時フォルダ（ai-org-evidence-<agent_id>）に記録し、2回目は通します。
- このフックが壊れたときは通します（作業を止めすぎないため）。

## session_start.py（SessionStart）
セッションの最初、再開、/clear、要約の後に、10行以内で次を知らせます。timeout は40秒です（fable を確かめるため）。
- このリポジトリは AI 組織で動き、メインセッションは指揮役であること。機能は Takuma が /feature で始めること。
- docs/progress.md の「## 記録」の最後の3行。
- 組織のファイルが lock.json と違うとき、組織のフォルダにキットにないファイルがあるとき、app.json が読めないときの注意。
- fable が使えるか。使えるなら fable の役は model を付けずに呼び、上限か確かめられないなら model: "opus" を付けて呼ぶこと。おぼえた結果が古ければ、ここで確かめます。役のセッションでは確かめません。

## fable_status.py（guard.py と session_start.py から使う）
fable が使えるか（上限にかかっていないか）を確かめ、結果をおぼえます。「使える」は1分、「上限」は10分です（使えると出た後に上限にかかると役が何時間も待つので、使えるの方を短くしています）。fable の役は、fable が上限にかかっていると 429 のまま何時間も待ち続け、失敗も別のモデルへの切り替えも起きないためです。
- 確かめ方：プロジェクトの外の空の一時フォルダで、`claude -p` を `--model fable` で1回だけ動かし、stream-json の出力を読みます。ツールなし、MCP なし、フックなし（`--settings '{"disableAllHooks": true}'`）、セッションを残さない設定です。
- 使える（usable）：fable から返事が届き、上限の知らせもエラーもないとき。
- 上限（limited、opus を使う）：rate_limit_event の status が rejected、api_retry（再試行）、エラー、25秒の時間切れ、claude が見つからない、確かめの途中の失敗、のどれか。決まったらすぐ claude を止め、一時フォルダを消します。迷ったら opus に倒します。知らせでは、429 の上限なら「上限にかかっています」、ほかは「確かめられませんでした」と書き分けます。
- 使う claude は、動いている Claude Code（CLAUDE_CODE_EXECPATH）が先で、なければ PATH の claude です（PATH には古い別の claude があることがあるため）。
- 環境変数は今のセッションのものを使います。CLAUDE_CODE_ENTRYPOINT などで上限の判定が変わる（外すと、本当は上限なのに使えると出た）ためです。親のセッションにつながる変数（CLAUDE_CODE_SESSION_ID、CLAUDE_CODE_REMOTE*、CLAUDE_CODE_MESSAGING*、記憶の同期の CLAUDE_MEMORY_STORES など）だけを外し、AI_ORG_FABLE_PROBE=1 と CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1（題名づけなどの別のリクエストを出さない）を付けます。この変数があるときは、もう一度確かめることはしません（ガードの確認は外れません）。
- 結果は ~/.cache/ai-org/fable-<印>.json（XDG_CACHE_HOME があればその下、AI_ORG_FABLE_CACHE で変えられる）に、状態と理由と時刻を書きます。リポジトリには書きません。<印> はアカウント、組織、設定の場所（CLAUDE_CONFIG_DIR）、入口（CLAUDE_CODE_ENTRYPOINT）、API キーなどから作るハッシュの先頭で、別のアカウントや設定の結果は使いません。先の時刻の結果も使いません。
- 手で確かめるとき：`python3 .claude/hooks/fable_status.py --refresh`（確かめて usable か limited を出す）、`--status`（おぼえた結果だけ。古いかなければ unknown）。
- 1回の確かめは、上限のときで約1秒、使えるときで約2秒でした（遅いと10秒ほど）。リクエストは fable への1回だけで、使えるときはその短い返事の分だけ費用がかかります。

## settings.json のほかの設定
- `autoMemoryEnabled: false`：組織の状態はリポジトリのファイルに置くので、自動の記憶は使いません（記憶の書き込みはプロジェクトの外なので、ガードに止められて混乱するのを避けるため）。
- `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH: 1`：サブエージェントがさらにサブエージェントを呼べないようにします。
- `skillOverrides`（craft-<役> を `name-only`）：指揮役のセッションに、役の手引きの説明文を出さず名前だけにします（指揮役が手引きを使おうとしないため、文脈を減らすため）。役の起動時の読み込みはそのまま効きます。`off` と `user-invocable-only` にすると読み込みが止まるので使いません。
- deny：.claude/ と .github/ への書き込み（下のフォルダの .claude/ も）、秘密情報の読み書き、汎用エージェント、force push、main への直接の push、gh pr merge（マージは Takuma）、gh auth token、printenv など。

## 分かっている穴
- Bash の中で python や node が書くファイルと読むファイルは見えません。Bash の確認はできる範囲のものです。
- MCP のツールの名前はサーバーごとに違うので、名前で止められないものがあり得ます。
- org-check は PR の中の checker と lock.json を使うので、わざとの書き換えは止められません。それを見るのは org-guard（ベースのブランチの checker で、PR が組織のファイルを変えていないかを見る）と、Takuma がマージすることです。
- claude.ai の Project にリポジトリが2つ以上あると、settings.json のフック、権限、env は効きません。アプリ1つにつき Project を1つにします。
- python3 がない Mac ではガードが動かず、すべての書き込みが止まります。`python3 --version` で確かめてください。
- fable の確かめは役を呼ぶ前だけです。役が動いている途中で fable が上限にかかると、その役は待ち続けます。長く返ってこなければ止めて、呼び直します（次はガードが opus で呼ばせます）。
- fable の確かめに使う claude の起動の仕方（`--tools`、`--settings` など）を古い Claude Code が知らないと、確かめはいつもエラーになり、fable の役はいつも opus で動きます（止まりはしません）。
