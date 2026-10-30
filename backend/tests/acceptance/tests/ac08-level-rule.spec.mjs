// AC-8：同じ種類の申告が 2 回連続すると、段階が 1 つ動く（9 通り。5 通り目は PRD の「または」で 2 本）。
// 手順（PRD 11 AC-8 の確かめ方、contracts/data.md の 5 の表）：seed で段階と古い方の履歴を投入 → 2026-11-03 に固定して開き、
// 画面で直近の 1 件を申告 → 2026-11-04 に固定して開き、data-task-level を読む。実装の関数は呼ばない。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';
import { injectSeed, loadSeed, loadContractFixture } from '../helpers/seed.mjs';

const DAY1 = '2026-11-03';
const DAY2 = '2026-11-04';

const CASES = [
  { no: '1', name: '中で難しすぎ難しすぎ→初', seed: () => loadContractFixture('seeds/seed-ac8-intermediate-one-too-hard.json'), report: 'task.report.tooHard', before: 'intermediate', after: 'beginner' },
  { no: '2', name: '中で簡単すぎ簡単すぎ→上', seed: () => loadSeed('seed-ac8-intermediate-one-too-easy.json'), report: 'task.report.tooEasy', before: 'intermediate', after: 'advanced' },
  { no: '3', name: '中で難しすぎ1回だけ→中のまま', seed: () => loadSeed('seed-ac8-intermediate-two-done.json'), report: 'task.report.tooHard', before: 'intermediate', after: 'intermediate' },
  { no: '4', name: '中で簡単すぎ1回だけ→中のまま', seed: () => loadSeed('seed-ac8-intermediate-two-done.json'), report: 'task.report.tooEasy', before: 'intermediate', after: 'intermediate' },
  { no: '5a', name: '中で難しすぎ完了難しすぎ→中のまま', seed: () => loadSeed('seed-ac8-intermediate-too-hard-done.json'), report: 'task.report.tooHard', before: 'intermediate', after: 'intermediate' },
  { no: '5b', name: '中で難しすぎ今日はできない難しすぎ→中のまま', seed: () => loadSeed('seed-ac8-intermediate-too-hard-no-time.json'), report: 'task.report.tooHard', before: 'intermediate', after: 'intermediate' },
  { no: '6', name: '初で難しすぎ2回連続→初のまま', seed: () => loadSeed('seed-ac8-beginner-one-too-hard.json'), report: 'task.report.tooHard', before: 'beginner', after: 'beginner' },
  { no: '7', name: '上で簡単すぎ2回連続→上のまま', seed: () => loadSeed('seed-ac8-advanced-one-too-easy.json'), report: 'task.report.tooEasy', before: 'advanced', after: 'advanced' },
  { no: '8', name: '中で難しすぎ_none_難しすぎ→初（noneは数えず流れも切らない）', seed: () => loadContractFixture('seeds/seed-ac8-intermediate-too-hard-then-none.json'), report: 'task.report.tooHard', before: 'intermediate', after: 'beginner' },
  { no: '9', name: '上で2回難しすぎで中になった翌日に中で難しすぎ1回→中のまま', seed: () => loadContractFixture('seeds/seed-ac8-intermediate-after-advanced-two-too-hard.json'), report: 'task.report.tooHard', before: 'intermediate', after: 'intermediate' },
];

for (const c of CASES) {
  test(`AC8_${c.no}通り目_${c.name}`, async ({ context, page, baseURL }, testInfo) => {
    const seed = c.seed();
    const seededIds = seed.history.map((r) => r.taskId);
    await injectSeed(context, seed);

    await app.fixDate(page, DAY1);
    await app.open(page, baseURL);
    await app.expectState(page, 'task.today');
    const day1 = await app.readTask(page);
    expect(day1.area).toBe('backend');
    expect(day1.level, '1 日目の段階は seed の levels').toBe(c.before);
    expect(seededIds).not.toContain(day1.id);

    await app.tid(page, c.report).click();
    await app.expectState(page, 'task.skipped');

    await app.fixDate(page, DAY2);
    await page.reload();
    await app.expectState(page, 'task.today');
    const day2 = await app.readTask(page);
    testInfo.annotations.push({ type: 'data-task-level', description: `${DAY1}: ${day1.level}（${day1.id}）→ ${DAY2}: ${day2.level}（${day2.id}）` });
    expect(day2.area).toBe('backend');
    expect(day2.level, `${DAY2} の data-task-level`).toBe(c.after);
    expect([...seededIds, day1.id]).not.toContain(day2.id);
    await app.shot(page, testInfo, `AC8_${c.no}_task.today_${DAY2}`);
  });
}
