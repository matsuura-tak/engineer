// AC-1：初めて開くと自己診断が始まり、3 問で終わる。AC-2：診断を終えると、その場で今日の課題が 1 件出る。
// 期待値は PRD 11 の AC-1、AC-2 の Then（3 問、n / 3、500 ms、1 秒、領域と段階の一致）。
import { test, expect } from '../helpers/fixtures.mjs';
import * as app from '../helpers/app.mjs';

const TODAY = '2026-11-03';

test('AC1_初めて開くと診断が始まり3問で終わる_進み具合n/3_切り替え500ms以内', async ({ page, baseURL, request }, testInfo) => {
  const ja = await app.loadStrings(request, 'ja');
  await app.fixDate(page, TODAY);
  await app.open(page, baseURL);
  await app.expectState(page, 'diagnosis.start');
  await app.shot(page, testInfo, 'AC1_diagnosis.start');

  await app.tid(page, 'diagnosis.start.begin').click();
  await app.expectState(page, 'diagnosis.question');
  const progress = app.tid(page, 'diagnosis.progress');
  const answers = ['area.backend', 'level.intermediate', 'years.1to3'];
  const transitions = [];
  let lastIndex = 0;

  for (let n = 1; n <= 3; n++) {
    await expect(progress).toHaveAttribute('data-question-index', String(n));
    await expect(progress).toHaveAttribute('data-question-total', '3');
    await expect(progress).toHaveText(app.fill(ja['diagnosis.progress'], { n, total: 3 }));
    lastIndex = n;
    await app.shot(page, testInfo, `AC1_diagnosis.question_${n}`);
    await app.tid(page, answers[n - 1]).check();
    const t0 = Date.now();
    if (n < 3) {
      await app.tid(page, 'diagnosis.next').click();
      await expect(progress).toHaveAttribute('data-question-index', String(n + 1));
    } else {
      await app.tid(page, 'diagnosis.finish').click();
      await app.expectState(page, 'task.today');
    }
    transitions.push(Date.now() - t0);
  }

  testInfo.annotations.push({ type: '切り替えの時間 ms', description: transitions.join(', ') });
  expect(lastIndex, '最後の質問の番号').toBe(3);
  expect(transitions).toHaveLength(3);
  expect(transitions[0], '1 問目 → 2 問目').toBeLessThanOrEqual(500);
  expect(transitions[1], '2 問目 → 3 問目').toBeLessThanOrEqual(500);
  expect(transitions[2], '3 問目 → 課題（AC-2 の 1 秒）').toBeLessThanOrEqual(1000);
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
    const { finishMs } = await app.diagnose(page, c, { finishTo: null });
    await app.expectState(page, 'task.today', 1000);
    testInfo.annotations.push({ type: '最後の回答から task.today まで ms', description: String(finishMs) });
    expect(finishMs).toBeLessThanOrEqual(1000);
    const task = await app.readTask(page);
    expect(task.area).toBe(c.area);
    expect(task.level).toBe(c.level);
    await expect(app.tid(page, 'task.today')).toHaveCount(1);
    await app.shot(page, testInfo, `AC2_task.today_${c.area}_${c.level}`);
  });
}
