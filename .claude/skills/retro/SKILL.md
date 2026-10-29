---
name: retro
description: 機能やリリースのあとで、見逃しと手戻りを役と関門ごとに分け、キット（matsuura-tak/ai-）への具体的な直し方を提案する。issue は Takuma の OK を得てから作る。Takuma が /retro で始める
disable-model-invocation: true
argument-hint: "[機能名 例: 003-photo-upload または release-1.0.0]"
---

# /retro：振り返って、組織の直し方を提案する

対象：$ARGUMENTS（空なら docs/progress.md で最後に完了したもの）。以下、対象を T と書く。

あなた（メインセッション）は指揮役。この手順は自分で進める。
アプリの中の組織のファイル（.claude/、.github/、docs/org/、docs/templates/）は直さない。組織の直しは、キットのリポジトリ matsuura-tak/ai- への issue として提案する。

## 1. 集める
- docs/progress.md の T の記録と、docs/reviews/、docs/verification/、docs/approvals/ の T のファイル。
- `git log --oneline`。使えれば `gh pr list --state all --search T` と、各 PR の CI の結果。
- 数える：関門ごとの判定の回数と FAIL の数、2往復で決まらなかった件、Takuma からの差し戻し、CI の初回の失敗、後の関門や公開の後で見つかった不具合、ガードに止められた書き込み。

## 2. 見逃しを1件ずつ分ける
見逃しとは、後の関門や Takuma や利用者が見つけた問題、やり直し、止まって進めなくなったところ。1件を表の1行にする。

| # | 何が起きたか | 作った役 | 見つけるべきだった関門と役 | 原因の種類 | 証拠のファイル |
|---|---|---|---|---|---|

原因の種類は次から1つ選ぶ。
- 役割の指示が足りない（.claude/agents/）
- 手順が足りない（.claude/skills/、.claude/rules/org.md）
- 型の項目が足りない（docs/templates/）
- 関門の基準が甘い（docs/org/gates.md）
- 強制の穴（.claude/hooks/、.claude/settings.json、CI）
- 委任指示書があいまいだった（指揮役の書き方）
- アプリ固有（CLAUDE.md、app.json、そのアプリのコード）
- モデルの限界（今は直し方がない。記録だけ残す）

## 3. 直し方を書く
- キットで直すもの：直すファイルをキットの中のパスで書く（例：template/core/.claude/agents/verifier.md）。変える前と後の文を、そのまま貼れる形で書く。1件につき最小の変更にする。
- 指示の文を足す前に、hook や CI で機械的に止められないかを考える。止められるなら、そちらを第一案にする。
- アプリで直すもの：CLAUDE.md は tech-lead に任せる。app.json と .claude/ は Takuma に頼む。
- うまくいった仕組みも3行までで残す。後で消さないように。
- 秘密情報、個人情報、利用者の文章をそのまま書かない。

## 4. 記録して、issue を提案する
1. docs/reviews/retro-T.md に、数字、表、直し方をまとめる。
2. Takuma に、直し方の要約と issue のタイトル案を1通で見せ、作ってよいか聞く。ここで止まる。
3. OK なら次を実行し、issue の URL を docs/progress.md に書き足す。
   `gh issue create -R matsuura-tak/ai- --title "retro: <app_name> T <要約>" --body-file docs/reviews/retro-T.md`
4. gh が使えない（クラウドのセッションなど）ときは、docs/reviews/retro-T.md の場所を伝え、Takuma に issue を作ってもらう。
5. キットが直って版が上がったら、機能と機能の間に /ai-org:update で取り込む、と伝える。
