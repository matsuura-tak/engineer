# 進捗ログ

指揮役（メインセッション）だけが書きます。セッションを始めたら、まずここを読みます。
関門を通ったとき、止まったとき、Takuma の返事を待つときに、「## 記録」のいちばん下へ1行ずつ書き足します。
古い行は書き換えません。セッションの最初に、最後の3行が表示されます。

1行の形：`- 日付 機能名 関門かステップ 結果 根拠のファイル`
例：`- 2026-10-09 001-sign-in G0 PASS docs/approvals/001-sign-in-G0.md`
例：`- 2026-10-10 001-sign-in G1 Takuma待ち デザインの色を決めてほしい（docs/reviews/001-sign-in-G1-design-reviewer-r1.md）`

## 記録
- 組織を導入した。最初の機能は Takuma が /feature で始める。
- 2026-10-29 組織 main のルールセット ai-org（id 26122949）を変更した（承認1件・コードオーナーの承認が必須、管理者は PR 経由でだけ例外）。Takuma が自分で実行した
- 2026-10-29 001-daily-learning 開始 着手 依頼「診断と今日の学習」（最初に今のスキルと目標を聞き、その人向けに今日やることを1つ出す）
- 2026-10-29 001-daily-learning G0 Takuma待ち Takuma が「アプリではなくブラウザ」に方針を変えた。キット 0.2.0 に Web のスタックはないため、組織の形を決めてもらう。verifier r1 は PASS（docs/reviews/001-daily-learning-G0-verifier-r1.md）、tech-lead r1 は途中で止めた
- 2026-10-29 001-daily-learning G0 方針変更 Takuma の決定：ブラウザだけの Web アプリ（サーバーなし）。組織は backend スタックだけに変え、Web の画面とコードは backend/ に置く。PRD は第1部を残し第2部を書き直す。app.json の stacks 変更は Takuma が main で行う
- 2026-10-29 001-daily-learning G0 FAIL tech-lead r1（重大2件：ホーム画面の Web アプリは Safari と保存を共有しない、freeCodeCamp の引用がページにない）。verifier r2 は PASS（要修正6件）。pdm に直させて r2 へ（docs/reviews/001-daily-learning-G0-tech-lead-r1.md）
- 2026-10-29 001-daily-learning G0 判定PASS tech-lead r2 PASS（要修正4）、verifier r3 PASS（要修正2）。要修正は pdm が直す。Takuma に Q1〜Q9 と承認を聞く（docs/reviews/001-daily-learning-G0-tech-lead-r2.md、docs/reviews/001-daily-learning-G0-verifier-r3.md）
- 2026-10-30 001-daily-learning G0 PASS Takuma が承認「承認します」。Q1〜Q9 はすべて推奨どおり（docs/approvals/001-daily-learning-G0.md）。要修正6件と決定の反映を pdm に任せる
- 2026-10-30 001-daily-learning G0 再承認待ち Takuma の追加2点（ブラウザの中で完結、楽に継続）を PRD r5 に反映（AC 28→32、原則 P-1/P-2、Q10 追加）。範囲を変えた箇所と Q10 を Takuma に見せて承認を取り直す（docs/prd/001-daily-learning.md）
- 2026-10-30 001-daily-learning G0 PASS Takuma が PRD r5 を再承認「承認します」、Q10 は A（docs/approvals/001-daily-learning-G0.md）。G1 へ：designer の調査（5a）から
- 2026-10-30 001-daily-learning G1 判定r1 design-reviewer FAIL（重大2：診断前の設定への道、状態の表の理由なし「なし」12）、tech-lead PASS（要修正2：答えの保存の間隔、診断途中の再読み込み）。designer に直させて design-reviewer r2 へ（docs/reviews/001-daily-learning-G1-design-reviewer-r1.md、docs/reviews/001-daily-learning-G1-tech-lead-r1.md）
- 2026-10-30 001-daily-learning G1 判定r2 design-reviewer PASS（16/16、提案4）。tech-lead r1 PASS と合わせてステップ6通過。tech-lead に設計メモ・契約・ADR（ステップ7）を任せる。Takuma の D1〜D7 は返事待ち（docs/reviews/001-daily-learning-G1-design-reviewer-r2.md）
- 2026-10-30 001-daily-learning G1 確認 pdm（読むだけ）：契約の段階の規則と統計の数え方は PRD と一致。firstOpenDate は「初回の診断の1問目を確定した日」に固定すべき（契約 data.md :18/:30/:38 の直しは tech-lead）。PRD 11 冒頭と 13 の母数に明記が要る。AC-8 に例を足すかは Takuma（D9、D10）
- 2026-10-30 001-daily-learning G1 PASS design-reviewer r2 PASS、tech-lead r1 PASS、reviewer（設計）r1 PASS（要修正1：起動時の setItem の文の矛盾。提案6）。要修正と firstOpenDate の不整合は tech-lead が直す。Takuma の D1〜D10 は返事待ち（docs/reviews/001-daily-learning-G1-reviewer-r1.md）
- 2026-10-30 001-daily-learning G1 要修正の反映 tech-lead（契約・ADR、firstOpenDate）52dc7bb、designer r3（提案4件、契約との整合）をコミット。残り：Takuma の D1〜D10 → pdm の PRD 直しと再承認 → verifier の受け入れテスト（9）
- 2026-10-30 001-daily-learning G1 Takuma の決定 D1〜D10 すべて推奨どおり（docs/approvals/001-daily-learning-G0.md）。pdm に PRD r6（D6、D9、D10、段階の規則の文）を任せ、再承認へ
- 2026-10-30 001-daily-learning G0 再承認 Takuma が PRD r6 を承認「承認します」（docs/approvals/001-daily-learning-G0.md）。designer r4（決定待ちの確定）をコミット。tech-lead に契約の印の確定と AC-8 の seed の文を直させ、verifier（9）へ
- 2026-10-31 001-daily-learning G2（受け入れテスト）判定r1 reviewer PASS（要修正1：AC-2 の計測）、tech-lead FAIL（重大1：AC-18 の Tab が WebKit で止まらない。要修正4）。依存の置き場所は B（tests/acceptance の中）。tech-lead が契約・ADR・CLAUDE.md を直し、verifier がテストを直して tech-lead r2 へ（docs/reviews/001-daily-learning-G2-tests-reviewer-r1.md、docs/reviews/001-daily-learning-G2-tests-tech-lead-r1.md）
- 2026-10-31 001-daily-learning G2（受け入れテスト）判定r2 tech-lead PASS（要修正1：時間の計り方）。reviewer r1 PASS と合わせて2体 PASS。要修正は契約に「時間の計り方」を足して verifier が直し、その後 push と下書き PR（docs/reviews/001-daily-learning-G2-tests-tech-lead-r2.md）
- 2026-10-31 001-daily-learning 受け入れテスト r3（時間の計り方）をコミット 478ef41。push は Takuma が許可せず保留。PRD r7（pdm）をコミット。Takuma に push の方法、D8、r7 の再承認と Q11 を聞く
- 2026-11-01 001-daily-learning G0 再承認 Takuma が PRD r7 を承認、Q11 は A。push と下書き PR は指揮役が実行（docs/approvals/001-daily-learning-G0.md）
- 2026-11-01 001-daily-learning 実装前の準備が完了 PR #4（下書き）。契約 Q11、テスト 133 本（red）、design r5 をコミット。Takuma の D8（app.json の backend_test）待ちで、入り次第 backend-engineer の実装（G2）へ
- 2026-11-01 001-daily-learning 課題集 v1 の下書き 126 件（docs/prd/001-daily-learning/tasks.v1.json。スキーマ通過、external 7 件、gzip 約 30KB）。Takuma の全件確認待ち（tasks-review.md）。D8 も待ち
- 2026-11-03 001-daily-learning Takuma が承認をこのプロジェクトで指揮役に委任。課題集 v1 を採用、T1〜T3 は推奨どおり。D8 は未だが実装（G2）を始める（docs/approvals/delegation.md）
- 2026-11-03 001-daily-learning 実装をコミット（1398191）。AC20 のテストの直し（verifier、a7fc7e9）。npm test 終了コード 0（契約 41、単体 85/85、受け入れ 133/133）。CLAUDE.md と依存の決まり（tech-lead）。次は push、CI、reviewer（コード）
