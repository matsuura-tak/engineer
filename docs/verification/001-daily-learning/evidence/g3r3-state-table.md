# G3 r3 前半：design 5.1 の 54 行（test-plan.md 3.2）の埋まり具合（verifier、2026-11-05、HEAD 32236ec）

根拠のログ：g3r3-full-run.log（219 本、218 passed / 1 failed＝AC15 の chromium）、g3r3-repeat5.log（156 本 × 5 = 780 passed）、g3r3-screenshots-axe.log（177 枚、chromium の S4_task.rate_at100 だけ error → g3r3-screenshots-axe-at100.log で単独に撮り直し ok）、g3r3-explore*.log（探索 4 本 × 2 ブラウザ）。
「結果」は、その行を確かめるテストが両ブラウザで通ったか（AC-15 だけ chromium）。

| # | 画面と状態 | 確かめたもの | 結果 |
|---|---|---|---|
| 1 | S0 loading | tools S0_loading（light/dark/ax5/en、w320） | ok、axe 違反 0 |
| 2 | S0 error（読めない） | tools S0_error_invalidData、S0_error_notJson、S0_error_dialog_delete | ok、axe 違反 0（dialog は incomplete 1：7 章の既知） |
| 3 | S0 error（保存先が使えない） | tools S0_error_storageUnavailable | ok、axe 違反 0 |
| 4 | S1 通常 | AC1（両）、tools S1_diagnosis.start（4 通り + w320） | passed |
| 5 | S1 iOS の案内 | AC21（両）、tools S1_addToHomeScreen（light、en） | passed |
| 6 | S1 スタンドアロンの案内 | AC22（両）、tools S1_standalone_import | passed |
| 7 | S1 読み込みの失敗 | tools S1_standalone_import_error | ok |
| 8 | S2 1 問目（ヒント文、領域の説明） | AC39（両）、tools S2_question_1（4 通り）、探索 EXPLORE_R8_320_200（area.*.desc 6 件、幅 320 × 200%） | passed、axe 違反 0 |
| 9 | S2 2 問目 | tools S2_question_2、探索 320×200% | ok |
| 10 | S2 3 問目（years.never が先頭） | AC40（両）、AC18（years.never を Space で選ぶ）、tools S2_question_3、探索（radio 5 件、先頭 years.never） | passed |
| 11 | S2 未選択のエラー | tools S2_error_required | ok |
| 12 | S2 保存の失敗 | AC11（両）、tools S2_error_storage | passed |
| 13 | S2 やり直し | AC14（両）、tools S2_redo_fromSettings、S2_resume_inProgress | passed |
| 14 | S3 通常（1 件目、task.progress） | AC2、AC31、AC36（両）、tools S3_task.today（4 通り + w320、longest_inline_code） | passed |
| 15 | S3 external | AC30（両）、tools S3_task.today_external（light、en） | passed |
| 16 | S3 同じ日の 2 件目 | AC33（両）、tools S3_task.today_nth2、探索 35 件（nth 1〜35、EXPLORE_S3_nth12.png） | passed |
| 17 | S3 保存しました | AC32（両）、tools S3_answer_saved | passed |
| 18 | S3 上限 2,000 字 | tools S3_answer_limit | ok |
| 19 | S3 答えの保存の失敗 | tools S3_error_storage_answer | ok |
| 20 | S3 申告の保存の失敗 | DESIGN_D30（両）、tools S3_error_storage_report | passed |
| 21 | S3 task.dayChanged | DESIGN_D30（両）、tools S3_task.today_dayChanged（4 通り） | passed |
| 22 | S4 通常（累計 11） | AC35 n=10（両）、tools S4_task.rate_total11（4 通り） | passed、axe 違反 0 |
| 23 | S4 節目 7 | AC35 n=6（両）、tools S4_task.rate_at7（4 通り）、探索 35 件（7 件目で data-milestone 7、EXPLORE_S4_at7.png）、探索 320×200%（横スクロールなし） | passed |
| 24 | S4 節目 30 | AC35 n=29（両）、tools S4_task.rate_at30、探索 35 件（30 件目で 30） | passed |
| 25 | S4 節目 100 | AC35 n=99（両）、tools S4_task.rate_at100（webkit ok。chromium は 1 回目 error「1 秒後も task.total.prev が残っている」→ 単独で ok） | passed。tools の 1 回目の error は未解決（報告） |
| 26 | S4 回答の保存の失敗 | tools S4_error_storage | ok |
| 27 | S5 通常（D-45 の順） | AC5、AC37、AC38（両）、tools S5_task.done（4 通り） | passed |
| 28 | S5 再読み込み後 | AC5、AC33（両）、探索 35 件（S7 の再読み込みで S5） | passed |
| 29 | S5 task.next の保存の失敗 | tools S5_error_storage_next | ok |
| 30 | S6 難しすぎ（levelHint） | AC7（両）、tools S6_task.skipped_too_hard（4 通り）、too_easy | passed |
| 31 | S6 今日はできない | AC7（両）、tools S6_task.skipped_no_time、探索 U-17（S6 から task.next） | passed |
| 32 | S7 levelDone（補足なし） | AC10 初級 × 2、AC17、AC27（両）、tools S7_task.exhausted_levelDone（4 通り）、探索 35 件（初級・中級で levelDone、seenNext / nextDone 0 件） | passed |
| 33 | S7 levelDone（seenNext） | DESIGN_D40（両）、tools S7_task.exhausted_seenNext | passed |
| 34 | S7 allDone | AC10 上級 × 2、AC27（両）、tools（levelDone の変種は tools では撮らない。AC10 の shot）、探索 35 件（EXPLORE_S7_allDone.png、advance 0 件） | passed |
| 35 | S7 task.dayChanged | DESIGN_D30（両）、tools S7_task.exhausted_dayChanged（4 通り） | passed |
| 36 | S7 advance の保存の失敗 | tools S7_error_storage_advance | ok |
| 37 | S8 診断済み | AC13（両）、tools S8_settings（4 通り） | passed |
| 38 | S8 永続化の注意 | AC13、DESIGN_D31（両）、tools S8_settings_notPersisted | passed |
| 39 | S8 書き出しました | AC19（両）、tools S8_export_done | passed |
| 40 | S8 読み込みの失敗（2 通り） | AC25（両）、tools S8_import_error_version、S8_import_error_schema | passed |
| 41 | S8 iOS の節 | AC21（両）、tools S8_homeScreen_guide（light、en） | passed |
| 42 | S8 保存データなし | tools S8_settings_noData、S8_settings_inProgress | ok |
| 43 | settings.import.confirm | AC20（両）、tools dialog_settings.import.confirm（4 通り + ax5 のフォーカス） | passed |
| 44 | settings.delete.confirm | AC16（両）、tools dialog_settings.delete.confirm（4 通り + ax5 のフォーカス）、探索 R1 | passed |
| 45 | import.confirm の保存の失敗 | tools（S8 の失敗の場面は S1_standalone_import_error と S8_import_error_*。import.confirm の保存の失敗そのものの場面は tools にない） | 未撮影（後半で tools に足すか、範囲外の理由を書く） |
| 46 | S9 通常（11 行） | AC24（両）、tools S9_settings.stats（4 通り）、探索 35 件（11 値を手で数えた値と一致） | passed、axe 違反 0 |
| 47 | S9 診断直後 | tools S9_settings.stats_zero | ok |
| 48 | S10 通常 | AC24、AC36（両）、tools S10_history（4 通り）、S10_history_answerOpen | passed |
| 49 | S10 空 | AC16（両）、tools S10_history_empty | passed |
| 50 | S6 task.next の保存の失敗 | tools S6_error_storage_next、探索 U-17（S6 で失敗 → retry → nth 2） | ok |
| 51 | S5 task.next.note.last | DESIGN_D44（両）、tools S5_task.done_note.last、探索 35 件（14、28、35 件目で note.last） | passed |
| 52 | S6 task.skipped.levelChanged | AC8 10 通り目（両）、tools S6_task.skipped_levelChanged | passed |
| 53 | S7 levelDone（nextDone） | DESIGN_D40（両）、tools S7_task.exhausted_nextDone | passed |
| 54 | S6 levelChanged + note.last | DESIGN_D44（両）、tools S6_task.skipped_levelChanged_note.last | passed |

型の 9 行（test-plan 3.1）のうち自動の行は上の表に含まれる（データあり＝seed、更新＝AC28、オフライン＝AC12/AC23、権限を断った＝AC13、言語＝AC26 と en の撮影、大きい文字＝ax5 と探索 320×200%）。VoiceOver と実機 Safari は G4 の人（test-plan 9 章）。
