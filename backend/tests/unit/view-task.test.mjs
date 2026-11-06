// S4 task.rate、S5 task.done、S7 task.exhausted の組み立て（public/js/view-task.js。design の D-34〜D-36、D-38、D-43〜D-45、
// contracts/identifiers.md の 3 と 4）。DOM は fake-dom.mjs（依存なし）。動きそのものは CSS なので受け入れテスト（DESIGN_D43_）で見る。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { installFakeDocument } from './fake-dom.mjs';
import { format } from '../../public/js/i18n.js';
import { rateMark, totalLine, rateScreen, doneScreen, exhaustedScreen } from '../../public/js/view-task.js';
import { questionScreen } from '../../public/js/view-start.js';
import { BACKEND_DIR, readJsonFile } from './helpers.mjs';

installFakeDocument();
const JA = readJsonFile(path.join(BACKEND_DIR, 'public', 'i18n', 'ja.json'));
const t = (key, values) => {
  assert.ok(key in JA, `文言キー ${key}`);
  return format(JA[key], values, 'ja');
};
const SVG_NS = 'http://www.w3.org/2000/svg';
const noop = () => () => {};
const ids = (node) => node.testids().map((e) => e.getAttribute('data-testid'));
const one = (node, id) => {
  const found = node.byTestid(id);
  assert.equal(found.length, 1, `${id} は 1 件`);
  return found[0];
};
const INSIGHT = '解説の本文です。';
const RATE = { count: 11, milestone: 'none', progress: { index: 4, total: 14 }, insight: INSIGHT, onRate: noop, onClose: () => {} };

test('D-43：印は svg（aria-hidden、focusable=false、viewBox 0 0 24 24）の中に pathLength=1 のチェック 1 本。節目では円がチェックより先', () => {
  const plain = rateMark('none', true);
  assert.equal(plain.namespaceURI, SVG_NS);
  assert.equal(plain.getAttribute('data-testid'), 'task.rate.mark');
  assert.equal(plain.getAttribute('aria-hidden'), 'true');
  assert.equal(plain.getAttribute('focusable'), 'false');
  assert.equal(plain.getAttribute('viewBox'), '0 0 24 24');
  assert.deepEqual(plain.children.map((c) => c.tagName), ['path']);
  assert.equal(plain.children[0].namespaceURI, SVG_NS);
  assert.equal(plain.children[0].getAttribute('d'), 'M6 12.5l4 4L18 8');
  assert.equal(plain.children[0].getAttribute('pathLength'), '1');
  assert.ok(plain.classList.contains('is-animated'));
  assert.ok(!plain.classList.contains('is-milestone'));

  const ring = rateMark('7', false);
  assert.deepEqual(ring.children.map((c) => c.tagName), ['circle', 'path']);
  assert.deepEqual(['cx', 'cy', 'r', 'pathLength'].map((k) => ring.children[0].getAttribute(k)), ['12', '12', '10.5', '1']);
  assert.ok(ring.classList.contains('is-milestone'));
  assert.ok(!ring.classList.contains('is-animated'), '動かさないときはクラスを付けない');
});

test('D-35、D-43：累計の value は最初から最終の値。prev は value の兄弟で aria-hidden、animationend で外れる。動かさないときは prev を作らない', () => {
  const p = totalLine(t, 7, { animate: true, milestone: '7' });
  assert.deepEqual(ids(p), ['task.total', 'task.total.label', 'task.total.value', 'task.total.prev']);
  const value = one(p, 'task.total.value');
  const prev = one(p, 'task.total.prev');
  assert.equal(value.getAttribute('data-stat-completed'), '7');
  assert.equal(value.textContent, '7 件', 'value の文字に prev が混ざらない（AC-35）');
  assert.equal(prev.textContent, '6 件');
  assert.equal(prev.getAttribute('aria-hidden'), 'true');
  assert.equal(prev.parentNode, value.parentNode, 'prev は value の兄弟');
  assert.equal(value.parentNode.getAttribute('data-testid'), null, '包みに識別子はない');
  assert.ok(value.parentNode.classList.contains('is-ticking') && value.parentNode.classList.contains('is-milestone'));
  assert.equal(value.getAttribute('aria-live'), null, 'aria-live を付けない');
  prev.dispatch('animationend');
  assert.equal(p.byTestid('task.total.prev').length, 0, 'animationend で DOM から外れる');
  assert.equal(value.textContent, '7 件');

  const still = totalLine(t, 7);
  assert.deepEqual(ids(still), ['task.total', 'task.total.label', 'task.total.value']);
  assert.ok(!one(still, 'task.total.value').parentNode.classList.contains('is-ticking'));
});

test('D-34：S4 の並びは h1（先頭に印）→ 累計 → n / N 件目でした → 祝い → 解説 → 問い → 答える 2 つと「今回は答えない」', () => {
  const v = rateScreen(t, { ...RATE, reduce: false });
  assert.deepEqual(ids(v.node), [
    'task.rate.title',
    'task.rate.mark',
    'task.total',
    'task.total.label',
    'task.total.value',
    'task.total.prev',
    'task.progress.done',
    'task.cheer',
    'task.insight',
    'task.insight.text',
    'task.rate.question',
    'task.rate.helpful',
    'task.rate.notHelpful',
    'task.rate.close',
  ]);
  const h1 = one(v.node, 'task.rate.title');
  assert.equal(h1.childNodes[0].getAttribute('data-testid'), 'task.rate.mark', '印は h1 の先頭');
  assert.equal(h1.textContent, JA['task.rate.title']);
  assert.equal(v.focus, h1);
  const done = one(v.node, 'task.progress.done');
  assert.equal(done.getAttribute('data-progress-index'), '4');
  assert.equal(done.getAttribute('data-progress-total'), '14');
  assert.equal(done.textContent, 'この段階の 4 / 14 件目でした');
  const cheer = one(v.node, 'task.cheer');
  assert.equal(cheer.getAttribute('data-milestone'), 'none');
  assert.equal(cheer.textContent, '11 件目を終えました。');
  assert.ok(!cheer.classList.contains('is-milestone'));
  assert.equal(one(v.node, 'task.insight').tagName, 'h2');
  assert.equal(one(v.node, 'task.insight.text').textContent, INSIGHT);
  assert.equal(one(v.node, 'task.rate.mark').getAttribute('class'), 'mark is-animated');
});

test('D-43：reduce の S4 は prev を作らず印にクラス is-animated を付けない（印は完成形のまま）。累計は最終の値', () => {
  const v = rateScreen(t, { ...RATE, count: 7, milestone: '7', reduce: true });
  assert.equal(v.node.byTestid('task.total.prev').length, 0);
  const mark = one(v.node, 'task.rate.mark');
  assert.equal(mark.getAttribute('class'), 'mark is-milestone');
  assert.deepEqual(mark.children.map((c) => c.tagName), ['circle', 'path']);
  assert.equal(one(v.node, 'task.total.value').textContent, '7 件');
  const cheer = one(v.node, 'task.cheer');
  assert.equal(cheer.getAttribute('data-milestone'), '7');
  assert.equal(cheer.textContent, JA['task.cheer.at7']);
  assert.ok(cheer.classList.contains('is-milestone'), '節目の文は color.success のクラス');
});

test('D-36：節目の 30 と 100 は at30 / at100 の文（差し込みなし）', () => {
  for (const m of ['30', '100']) {
    const v = rateScreen(t, { ...RATE, count: Number(m), milestone: m, reduce: true });
    assert.equal(one(v.node, 'task.cheer').textContent, JA[`task.cheer.at${m}`]);
  }
});

test('D-45：S5 の並びは h1 → 題名 → 累計 → n / N → 祝い → 今週 → note → 次の一手 → 解説 → 履歴。印と prev はない', () => {
  const v = doneScreen(t, { title: '課題の題名', count: 5, milestone: 'none', progress: { index: 2, total: 14 }, week: 3, insight: INSIGHT, note: { last: false }, onNext: () => {}, onHistory: () => {} });
  assert.deepEqual(ids(v.node), [
    'task.done.title',
    'task.done.task',
    'task.total',
    'task.total.label',
    'task.total.value',
    'task.progress.done',
    'task.cheer',
    'task.week',
    'task.next.note',
    'task.next',
    'task.insight',
    'task.insight.text',
    'task.done.history',
  ]);
  const week = one(v.node, 'task.week');
  assert.equal(week.getAttribute('data-stat-days-completed-week'), '3');
  assert.equal(week.textContent, '今週（月曜から）の完了日数：3 日');
  assert.equal(one(v.node, 'task.total.value').getAttribute('data-stat-completed'), '5');
  assert.equal(one(v.node, 'task.next.note').textContent, JA['task.next.note']);
});

test('D-44：組の最後の S5 の note は note.last（{area}、{level}）。解説がない（課題集に ID がない）ときは h2 も本文も置かない', () => {
  const v = doneScreen(t, { title: 'x', count: 14, milestone: 'none', progress: { index: 14, total: 14 }, week: 1, insight: null, note: { last: true, area: 'backend', level: 'intermediate' }, onNext: () => {}, onHistory: () => {} });
  assert.equal(one(v.node, 'task.next.note').textContent, format(JA['task.next.note.last'], { area: JA['area.backend'], level: JA['level.intermediate'] }));
  assert.equal(v.node.byTestid('task.insight').length, 0);
  assert.equal(v.node.byTestid('task.insight.text').length, 0);
});

test('D-35、D-40：S7 の両方の変種で、累計は h1 の直後で静止（prev なし）', () => {
  const levelDone = exhaustedScreen(t, { info: { variant: 'levelDone', area: 'backend', level: 'beginner', total: 14, nextLevel: 'intermediate', note: 'seenNext' }, count: 9, onAdvance: () => {}, onRedo: () => {} });
  assert.deepEqual(ids(levelDone.node).slice(0, 5), ['task.exhausted.levelDone', 'task.total', 'task.total.label', 'task.total.value', 'task.exhausted.levelDone.detail']);
  const allDone = exhaustedScreen(t, { info: { variant: 'allDone', area: 'backend', level: 'advanced', total: 14, nextLevel: null, note: null }, count: 40, onAdvance: () => {}, onRedo: () => {} });
  assert.deepEqual(ids(allDone.node).slice(0, 5), ['task.exhausted.allDone', 'task.total', 'task.total.label', 'task.total.value', 'task.exhausted.allDone.detail']);
  assert.equal(one(allDone.node, 'task.total.value').getAttribute('data-stat-completed'), '40');
  assert.equal(allDone.node.byTestid('task.total.prev').length, 0);
});

test('D-41：1 問目の 6 つの radio は、名前と area.*.desc が同じ label の中。2 問目は level.*.desc と legend の {area}。3 問目の先頭は years.never', () => {
  const q1 = questionScreen(t, { index: 1, redo: false, values: {}, onNext() {}, onBack() {}, onCancel() {} });
  const areas = ['backend', 'frontend', 'database', 'infra', 'testing', 'git'];
  for (const a of areas) {
    const desc = one(q1.node, `area.${a}.desc`);
    assert.equal(desc.textContent, JA[`area.${a}.desc`]);
    let label = desc.parentNode;
    while (label && label.tagName !== 'label') label = label.parentNode;
    assert.ok(label, `area.${a}.desc の祖先に label`);
    assert.equal(label.byTestid(`area.${a}`).length, 1, '同じ label に radio');
    assert.ok(label.textContent.startsWith(JA[`area.${a}`]), '見える名前が先頭（SC 2.5.3）');
  }
  const q2 = questionScreen(t, { index: 2, redo: false, values: { area: 'git' }, onNext() {}, onBack() {}, onCancel() {} });
  assert.equal(one(q2.node, 'diagnosis.q2.legend').textContent, format(JA['diagnosis.q2.legend'], { area: JA['area.git'] }));
  for (const l of ['beginner', 'intermediate', 'advanced']) assert.equal(one(q2.node, `level.${l}.desc`).textContent, JA[`level.${l}.desc`]);
  const q3 = questionScreen(t, { index: 3, redo: false, values: {}, onNext() {}, onBack() {}, onCancel() {} });
  const radios = q3.node.testids().filter((e) => e.getAttribute('type') === 'radio');
  assert.deepEqual(radios.map((e) => e.getAttribute('value')), ['never', 'lt1', '1to3', '3to5', 'gte5']);
});
