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
