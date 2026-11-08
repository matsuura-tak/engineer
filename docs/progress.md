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
- 2026-11-03 001-daily-learning G2（コード）reviewer r1 PASS（要修正：単体テスト 4 点）→ 直し 7660d5f → r2 PASS。契約の長さの文は tech-lead が直した（24dcd46、3add898）。CI は org-check と org-guard が緑。backend 用のワークフローと app.json の backend_test が空のため backend のテストは CI で動いていない（Takuma の D8 と .github 待ち）。手元の npm test 終了コード 0 を証拠に G3 へ進む（docs/reviews/001-daily-learning-G2-code-reviewer-r2.md）
- 2026-11-03 001-daily-learning G3 verifier r1 PASS（32 AC 合格、133 本、5 回繰り返し 445 本、axe 違反 0）。design-reviewer r1 FAIL（11/16。S6 と S0 loading の 4 通りのスクリーンショットの不足、見た目の差 3 件、日付が変わったときの知らせなし）。直しは designer → tech-lead → backend-engineer → reviewer → verifier → design-reviewer r2（docs/reviews/001-daily-learning-G3-design-reviewer-r1.md）
- 2026-11-04 001-daily-learning G3 PASS（verifier r2：32 AC 合格、155 本、5 回繰り返し 555 本、axe 違反 0。design-reviewer r2：16/16）。.claude と .github の差分 0。backend 用の CI はまだない（D8 と .github は Takuma）。Takuma の FB 待ち、その後マージ待ち（docs/reviews/001-daily-learning-G3-verifier-r2.md、G3-design-reviewer-r2.md）
- 2026-11-05 001-daily-learning Takuma の FB 1 回目（初級を未経験に、1 日 1 問をやめる、面白さを調べて入れる）。PRD の範囲が変わるので G0 に戻し、G0〜G3 をやり直す。PR #4 は下書きに戻す（docs/approvals/001-daily-learning-FB1.md）
- 2026-11-05 組織の更新（/ai-org:update）は Takuma の指示で「タイミングを見て」行う。いまはキットもリポジトリも 0.2.0 で差なし。001 のマージ後、次の /feature の前に版を確かめ、新しければ更新する。未追跡の .agents/、.codex/、AGENTS.md は Takuma の片付け待ち
- 2026-11-05 001-daily-learning G0 PASS（PRD r10。verifier r4 PASS、tech-lead r3 FAIL → r4 PASS。AC 40 件。委任により指揮役が再承認。Q14 は Takuma の返事待ち）（docs/approvals/001-daily-learning-G0.md）。次は G1（designer の調査から）
- 2026-11-05 001-daily-learning G1 PASS（FB 1 回目の作り直し。design-reviewer r3 PASS 15/16 → Takuma の答え「控えめな演出」→ r4 PASS 15/16、tech-lead r2 PASS、reviewer（設計）r2 PASS。要修正はすべて直した。PRD r11、design r9、契約は見本 52 件で検査 OK）。G3 の前提：Takuma が使ったすべてのブラウザとホーム画面の Web アプリで「すべてのデータを削除」し、書き出しファイルに旧 *-beginner-* の行がないことを確かめる（ADR 0002）。G4 の reviewer に ID と語彙の固定テストを確かめさせる。次は課題集（pdm）と受け入れテスト（verifier）（docs/reviews/001-daily-learning-G1-*-r2〜r4.md）
- 2026-11-05 001-daily-learning G2（受け入れテスト）PASS（reviewer r2 FAIL → r3 PASS、tech-lead r4 FAIL → r5 PASS。219 本。96 件は実装が古いので正しい赤。提案はテストと契約の小さな直しとして後で入れる）（docs/reviews/001-daily-learning-G2-tests-*-r3、r5）
- 2026-11-05 001-daily-learning 指揮役の手違い：実装・前半の 1 体目が「作業の上限で中断」と知らされた後も裏で動いており、2 体目（続き）と同じ時間に書く役が 2 体になった。1 体目は他の変更に気づいて自分の書き足し（実装ノート）だけを戻して止まり、コードは a21ef94 に入っている。被害なし（作業ツリーは HEAD と同じ）。以後、上限の知らせの後は報告が届くまで次の書く役を呼ばない（/retro で扱う）
- 2026-11-05 001-daily-learning G2（コード）PASS（reviewer r5 PASS・要修正 1 → a7383da で直した → r6 PASS。単体 158/158、受け入れ 219/219、合計 109,555 / 150,000。CI は org-check、org-guard が緑。backend の CI は D8 と .github 待ちのまま）（docs/reviews/001-daily-learning-G2-code-reviewer-r5.md、r6.md）
- 2026-11-05 001-daily-learning G3 PASS（FB 1 回目の作り直し。verifier r3：AC-1〜AC-40 合格、219/219、5 回の繰り返し 780/780、AC-15 は単独で 55 計測すべて 2,000 ms 以下、スクリーンショット 190 枚、axe 127 画面で違反 0、幅 320 × 200% の探索で S1〜S10 とダイアログのはみ出し 0。design-reviewer r3：15/16、要修正 1 は仕様 r10 で直した）。.claude と .github の差分 0。Takuma の FB 待ち、その後マージ待ち。v1 で直さず FB の回か 002 に回すもの：summary の開閉の印、初級の行内コードの組み方、画面を離れるときの保存の失敗（docs/reviews/001-daily-learning-G3-verifier-r3.md、G3-design-reviewer-r3.md）
- 2026-11-05 001-daily-learning Takuma の FB 2 回目（選択肢をタップ、正誤とその人に合わせた説明、図解と pop な見た目、キャラクター、手本は Swift Playgrounds と Progate）。PRD の範囲が変わるので G0 に戻し、G0〜G3 をやり直す。PR #4 は下書きに戻す（docs/approvals/001-daily-learning-FB2.md）
- 2026-11-05 001-daily-learning G0 PASS（FB 2 回目。PRD r13。verifier r5 PASS、tech-lead r5 PASS、要修正は r13 で直した。AC 44 件。委任により指揮役が再承認）。次は G1（designer の調査から。キャラクターの 3 案を Takuma に見せる）（docs/approvals/001-daily-learning-G0.md）
- 2026-11-08 001-daily-learning G1 PASS（FB 2 回目。design-reviewer r5 FAIL → r6 PASS 14/16、tech-lead r3 PASS、reviewer（設計）r3 FAIL → r4 PASS。仕様 r14、契約は見本 127 件で OK、ADR 0002 改訂 2・0006・0007・0008 を確定。キャラクターはミル、配色は 5 色（Takuma の答え）。次は課題集 v3（126 件、新しい型）、受け入れテスト、実装。G3 の前提：Takuma が使ったすべてのブラウザでデータを削除（ADR 0002 改訂 2）（docs/reviews/001-daily-learning-G1-*）
