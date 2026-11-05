// AC-1：初めて開くと自己診断が始まり、3 問で終わる。AC-2：診断を終えると、その場で今日の課題が 1 件出る。
// 期待値は PRD 11 の AC-1、AC-2 の Then（3 問、n / 3、500 ms、1 秒、領域と段階の一致）と PRD 12（切り替え 500 ms × 3、AC-2 の 1 秒）。
// 時間の計り方（contracts/test-hooks.md「時間の計り方」の「文書が変わらない区間」）：ページの中で計る。始点は操作の click の capture 段の
// performance.now()、終点は MutationObserver が data-state / data-question-index の条件を見た時刻。記録は globalThis.__acceptanceTiming
// （helpers/app.mjs の armTiming / readInterval）。差を取った後で expect で状態を確かめる（expect は時間には使わない）。
// expect の待ちで終点を取らない（確かめる間隔の分だけ長くなる：tech-lead G2 r2 の要修正）。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';

const TODAY = '2026-11-03';

test('AC1_初めて開くと診断が始まり3問で終わる_進み具合n/3_切り替え500ms以内', async ({ page, baseURL, request }, testInfo) => {
  const ja = await app.loadStrings(request, 'ja');
  await app.fixDate(page, TODAY);
  await app.open(page, baseURL);
  await app.expectState(page, 'diagnosis.start');
  await app.shot(page, testInfo, 'AC1_diagnosis.start');

  // 文言ファイルにキーがなければ、赤の理由が「テストの誤り（fill(undefined)）」に見えないよう先に落とす
  expect(ja, 'ja.json に diagnosis.progress がある').toHaveProperty(['diagnosis.progress']); // 配列：キーの「.」を経路に読ませない

  const progress = app.tid(page, 'diagnosis.progress');
  const answers = ['area.backend', 'level.intermediate', 'years.1to3'];
  // 4 区間：始める → 1 問目、1 → 2、2 → 3（各 500 ms。PRD 12「AC-1 で 3 回計る」）、3 問目 → 課題（1,000 ms。AC-2）
  const intervals = [];
  let lastIndex = 0;

  await app.armTiming(page);
  await app.tid(page, 'diagnosis.start.begin').click();
  await app.expectState(page, 'diagnosis.question');
  await expect(progress).toHaveAttribute('data-question-index', '1');
  intervals.push({
    step: '始める → 1 問目',
    ms: await app.readInterval(page, { startTestId: 'diagnosis.start.begin', state: 'diagnosis.question', index: '1' }),
    limit: 500,
  });

  for (let n = 1; n <= 3; n++) {
    await expect(progress).toHaveAttribute('data-question-index', String(n));
    await expect(progress).toHaveAttribute('data-question-total', '3');
    await expect(progress).toHaveText(app.fill(app.text(ja, 'diagnosis.progress'), { n, total: 3 }));
    lastIndex = n;
    await app.shot(page, testInfo, `AC1_diagnosis.question_${n}`);
    await app.tid(page, answers[n - 1]).check();
    if (n < 3) {
      await app.tid(page, 'diagnosis.next').click();
      await expect(progress).toHaveAttribute('data-question-index', String(n + 1));
      intervals.push({
        step: `${n} 問目 → ${n + 1} 問目`,
        ms: await app.readInterval(page, { startTestId: 'diagnosis.next', state: 'diagnosis.question', index: String(n + 1) }),
        limit: 500,
      });
    } else {
      await app.tid(page, 'diagnosis.finish').click();
      await app.expectState(page, 'task.today');
      intervals.push({
        step: '3 問目 → 課題（AC-2 の 1 秒）',
        ms: await app.readInterval(page, { startTestId: 'diagnosis.finish', state: 'task.today' }),
        limit: 1000,
      });
    }
  }

  testInfo.annotations.push({ type: '切り替えの時間 ms（始める→1、1→2、2→3、3→課題）', description: intervals.map((i) => `${i.step}: ${i.ms}`).join(', ') });
  expect(lastIndex, '最後の質問の番号').toBe(3);
  expect(intervals).toHaveLength(4);
  for (const i of intervals) expect(i.ms, `${i.step}（${i.limit} ms 以内）`).toBeLessThanOrEqual(i.limit);
  await expect(progress, '4 問目はない').toHaveCount(0);
});

const cases = [
  { area: 'backend', level: 'intermediate', years: '1to3' },
  { area: 'frontend', level: 'beginner', years: 'lt1' },
  { area: 'git', level: 'advanced', years: 'gte5' },
];

for (const c of cases) {
  test(`AC2_診断を終えると1秒以内に課題が1件出て領域と段階が一致する_${c.area}_${c.level}`, async ({ page, baseURL }, testInfo) => {
    await app.fixDate(page, TODAY);
    await app.open(page, baseURL);
    await app.expectState(page, 'diagnosis.start');
    // finishMs は finish の click（capture 段）から data-state=task.today になった DOM の変化までを、ページの中で計った値（helpers/app.mjs の diagnose。契約「時間の計り方」）
    const { finishMs } = await app.diagnose(page, c, { finishTo: 'task.today' });
    testInfo.annotations.push({ type: '最後の回答の確定から task.today の表示まで ms', description: String(finishMs) });
    expect(finishMs, '最後の回答の確定から task.today まで（1,000 ms 以内）').toBeLessThanOrEqual(1000);
    const task = await app.readTask(page);
    expect(task.area).toBe(c.area);
    expect(task.level).toBe(c.level);
    await expect(app.tid(page, 'task.today')).toHaveCount(1);
    await app.shot(page, testInfo, `AC2_task.today_${c.area}_${c.level}`);
  });
}
