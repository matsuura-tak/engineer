// S3 task.today、S4 task.rate、S5 task.done、S6 task.skipped、S7 task.exhausted。DOM を作るだけで、保存はしない。
import { h, button, link, inline, paragraphs } from './dom.js';
import { ANSWER_MAX } from './validate.js';
import { slot, errorSlots } from './view-start.js';

const REPORT_BUTTONS = [
  ['too_hard', 'task.report.tooHard'],
  ['too_easy', 'task.report.tooEasy'],
  ['no_time', 'task.report.noTime'],
];

// identifiers.md の 3
export function dayChangedNotice(t) {
  return h('p', { testid: 'task.dayChanged', cls: 'day-changed warning', attrs: { role: 'status', tabindex: '-1' }, text: t('task.dayChanged') });
}

const ANSWER_HELP_ID = 'task-answer-help';
const ANSWER_ERROR_ID = 'task-answer-error';

export function todayScreen(t, { task, current, nth = 1, progress, onInput, onReport }) {
  const title = h('h1', { testid: 'task.today.title', attrs: { tabindex: '-1' } }, inline(task.title));
  const label =
    nth > 1
      ? h('p', { testid: 'task.today.label.nth', cls: 'small secondary', text: t('task.today.label.nth', { nth, date: current.date }) })
      : h('p', { testid: 'task.today.label', cls: 'small secondary', text: t('task.today.label', { date: current.date }) });
  const parts = [
    label,
    progress ? h('p', { testid: 'task.progress', cls: 'small secondary', text: t('task.progress', progress) }) : null,
    title,
    h('p', {
      testid: 'task.meta',
      cls: 'small',
      text: t('task.meta', { area: t(`area.${task.area}`), level: t(`level.${task.level}`), minutes: task.minutes }),
    }),
  ];
  if (task.mode === 'external') {
    parts.push(
      h('p', {}, h('span', { testid: 'task.external.badge', cls: 'badge', text: t('task.external.badge') })),
      h(
        'dl',
        { testid: 'task.external.tools', cls: 'tools' },
        h('dt', { testid: 'task.external.tools.label', text: t('task.external.tools.label') }),
        h('dd', {}, h('ul', {}, task.tools.map((tool) => h('li', { testid: 'task.external.tools.item', text: tool })))),
      ),
    );
  }
  for (const key of ['why', 'how', 'goal']) {
    parts.push(h('h2', { testid: `task.${key}`, text: t(`task.${key}`) }), h('div', { testid: `task.${key}.text`, cls: 'body-text' }, paragraphs(task[key])));
  }

  const errors = errorSlots(t, ['answer', 'report', 'startup']);
  const area = h('textarea', {
    testid: 'task.answer',
    attrs: { id: 'task-answer', rows: 6, maxlength: ANSWER_MAX, 'aria-describedby': ANSWER_HELP_ID },
  });
  // tokens 4「入力欄」（aria-invalid は付けない）
  const syncAnswerError = () => {
    const msg = errors.el('answer').querySelector('[data-testid="error.storage.message"]');
    if (msg) {
      msg.id = ANSWER_ERROR_ID;
      area.classList.add('is-error');
      area.setAttribute('aria-describedby', `${ANSWER_HELP_ID} ${ANSWER_ERROR_ID}`);
    } else {
      area.classList.remove('is-error');
      area.setAttribute('aria-describedby', ANSWER_HELP_ID);
    }
  };
  area.value = current.answer;
  const status = h('p', { cls: 'status small', attrs: { role: 'status' } });
  const limit = slot();
  limit.el.setAttribute('aria-live', 'polite');
  const updateLimit = () => {
    if (area.value.length >= ANSWER_MAX) {
      if (!limit.el.firstChild) limit.set(h('p', { testid: 'task.answer.limit', cls: 'small warning', text: t('task.answer.limit', { max: ANSWER_MAX }) }));
    } else limit.clear();
  };
  area.addEventListener('input', onInput);
  updateLimit();

  parts.push(
    h(
      'div',
      { cls: 'answer' },
      h('label', { testid: 'task.answer.label', cls: 'label', attrs: { for: 'task-answer' }, text: t('task.answer.label') }),
      h('p', { testid: 'task.answer.help', cls: 'small secondary', attrs: { id: ANSWER_HELP_ID }, text: t('task.answer.help') }),
      area,
      status,
      limit.el,
      errors.el('answer'),
    ),
    errors.el('startup'),
    h('p', { testid: 'task.report.note', cls: 'small', text: t('task.report.note') }),
    errors.el('report'),
    h(
      'div',
      { cls: 'report' },
      button('task.report.done', t('task.report.done'), onReport('done'), 'primary'),
      h('div', { cls: 'report-secondary' }, REPORT_BUTTONS.map(([report, key]) => button(key, t(key), onReport(report)))),
    ),
  );

  const node = h(
    'article',
    {
      testid: 'task.today',
      cls: 'screen',
      attrs: {
        'data-task-id': current.taskId,
        'data-task-area': current.area,
        'data-task-level': current.level,
        'data-task-mode': current.mode,
        'data-task-nth-today': String(nth),
        'data-progress-index': progress ? String(progress.index) : null,
        'data-progress-total': progress ? String(progress.total) : null,
      },
    },
    parts,
  );
  return {
    node,
    focus: title,
    value: () => area.value,
    updateLimit,
    showSaved() {
      status.replaceChildren(h('span', { testid: 'task.answer.saved', cls: 'saved', text: t('task.answer.saved') }));
    },
    hideSaved() {
      status.replaceChildren();
    },
    showError(where, onRetry) {
      errors.show(where, onRetry);
      syncAnswerError();
    },
    clearErrors() {
      errors.clear();
      syncAnswerError();
    },
  };
}

// D-43 の印（createElementNS。ADR 0005）
const SVG_NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

export function rateMark(milestone, animate) {
  const ring = milestone !== 'none';
  const cls = ['mark', ring ? 'is-milestone' : null, animate ? 'is-animated' : null].filter(Boolean).join(' ');
  const el = svg('svg', { 'data-testid': 'task.rate.mark', class: cls, viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' });
  if (ring) el.append(svg('circle', { class: 'mark-ring', cx: 12, cy: 12, r: 10.5, pathLength: 1 }));
  el.append(svg('path', { class: 'mark-check', d: 'M6 12.5l4 4L18 8', pathLength: 1 }));
  return el;
}

// D-35、D-43。value は最初から最終の値。prev は value の兄弟
export function totalLine(t, count, { animate = false, milestone = 'none' } = {}) {
  const value = h('span', { testid: 'task.total.value', cls: 'total-value', attrs: { 'data-stat-completed': String(count) }, text: t('task.total.value', { count }) });
  const wrap = h('span', { cls: 'total-wrap' }, value);
  if (animate) {
    wrap.className = milestone !== 'none' ? 'total-wrap is-ticking is-milestone' : 'total-wrap is-ticking';
    const prev = h('span', { testid: 'task.total.prev', cls: 'total-prev', attrs: { 'aria-hidden': 'true' }, text: t('task.total.value', { count: count - 1 }) });
    const drop = () => prev.remove();
    prev.addEventListener('animationend', drop);
    prev.addEventListener('animationcancel', drop);
    wrap.append(prev);
  }
  return h('p', { testid: 'task.total', cls: 'total' }, h('span', { testid: 'task.total.label', cls: 'small secondary', text: t('task.total.label') }), ' ', wrap);
}

// D-44、D-36
function doneFacts(t, { progress, milestone, count }) {
  return [
    progress
      ? h('p', {
          testid: 'task.progress.done',
          cls: 'small secondary',
          attrs: { 'data-progress-index': String(progress.index), 'data-progress-total': String(progress.total) },
          text: t('task.progress.done', progress),
        })
      : null,
    h('p', {
      testid: 'task.cheer',
      cls: milestone !== 'none' ? 'cheer is-milestone' : 'cheer',
      attrs: { 'data-milestone': milestone },
      text: milestone !== 'none' ? t(`task.cheer.at${milestone}`) : t('task.cheer.default', { count }),
    }),
  ];
}

function insightParts(t, insight) {
  if (typeof insight !== 'string') return [];
  return [h('h2', { testid: 'task.insight', text: t('task.insight') }), h('p', { testid: 'task.insight.text', text: insight })];
}

const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

export function rateScreen(t, { count, milestone, progress, insight, onRate, onClose, reduce = reducedMotion() }) {
  const animate = !reduce;
  const title = h('h1', { testid: 'task.rate.title', attrs: { tabindex: '-1' } }, rateMark(milestone, animate), t('task.rate.title'));
  const errors = errorSlots(t, ['rate']);
  const node = h(
    'div',
    { cls: 'screen' },
    title,
    totalLine(t, count, { animate, milestone }),
    doneFacts(t, { progress, milestone, count }),
    insightParts(t, insight),
    h('p', { testid: 'task.rate.question', text: t('task.rate.question') }),
    errors.el('rate'),
    h(
      'div',
      { cls: 'actions stack' },
      button('task.rate.helpful', t('task.rate.helpful'), onRate('helpful')),
      button('task.rate.notHelpful', t('task.rate.notHelpful'), onRate('not_helpful')),
      button('task.rate.close', t('task.rate.close'), onClose, 'text'),
    ),
  );
  return {
    node,
    focus: title,
    showError(onRetry) {
      errors.show('rate', onRetry);
    },
  };
}

function nextParts(t, note, onNext, errors) {
  const text = note?.last ? t('task.next.note.last', { area: t(`area.${note.area}`), level: t(`level.${note.level}`) }) : t('task.next.note');
  return [h('p', { testid: 'task.next.note', cls: 'small', text }), errors.el('next'), h('div', { cls: 'actions' }, button('task.next', t('task.next'), onNext))];
}

// D-45 の並び
export function doneScreen(t, { title, count, milestone, progress, week, insight, note, onNext, onHistory }) {
  const h1 = h('h1', { testid: 'task.done.title', attrs: { tabindex: '-1' }, text: t('task.done.title') });
  const errors = errorSlots(t, ['next']);
  const node = h(
    'div',
    { cls: 'screen' },
    h1,
    title ? h('p', { testid: 'task.done.task', cls: 'small secondary', text: t('task.done.task', { title }) }) : null,
    totalLine(t, count),
    doneFacts(t, { progress, milestone, count }),
    h('p', { testid: 'task.week', attrs: { 'data-stat-days-completed-week': String(week) }, text: t('task.week', { days: week }) }),
    nextParts(t, note, onNext, errors),
    insightParts(t, insight),
    h('p', {}, link('task.done.history', t('task.done.history'), onHistory)),
  );
  return { node, focus: h1, showError: (where, onRetry) => errors.show(where, onRetry) };
}

export function skippedScreen(t, { notice, note, onNext, onHistory }) {
  const h1 = h('h1', { testid: 'task.skipped.title', attrs: { tabindex: '-1' }, text: t('task.skipped.title') });
  const errors = errorSlots(t, ['next']);
  let hint = null;
  if (notice?.kind === 'levelChanged') hint = h('p', { testid: 'task.skipped.levelChanged', text: t('task.skipped.levelChanged', { level: t(`level.${notice.level}`) }) });
  else if (notice?.kind === 'levelHint') hint = h('p', { testid: 'task.skipped.levelHint', text: t('task.skipped.levelHint') });
  const node = h(
    'div',
    { cls: 'screen' },
    h1,
    hint,
    nextParts(t, note, onNext, errors),
    h('p', {}, link('task.skipped.history', t('task.skipped.history'), onHistory)),
  );
  return { node, focus: h1, showError: (where, onRetry) => errors.show(where, onRetry) };
}

export function exhaustedScreen(t, { info, count, onAdvance, onRedo }) {
  const area = t(`area.${info.area}`);
  const level = t(`level.${info.level}`);
  const errors = errorSlots(t, ['startup', 'advance']);
  const parts = [];
  let h1;
  if (info.variant === 'allDone') {
    h1 = h('h1', { testid: 'task.exhausted.allDone', attrs: { tabindex: '-1' }, text: t('task.exhausted.allDone', { area }) });
    parts.push(h1, totalLine(t, count), h('p', { testid: 'task.exhausted.allDone.detail', text: t('task.exhausted.allDone.detail', { total: info.total }) }), errors.el('startup'));
    parts.push(h('div', { cls: 'actions' }, button('task.exhausted.redo', t('task.exhausted.redo'), onRedo, 'primary')));
  } else {
    const nextLevel = t(`level.${info.nextLevel}`);
    h1 = h('h1', { testid: 'task.exhausted.levelDone', attrs: { tabindex: '-1' }, text: t('task.exhausted.levelDone', { area, level }) });
    parts.push(
      h1,
      totalLine(t, count),
      h('p', { testid: 'task.exhausted.levelDone.detail', text: t('task.exhausted.levelDone.detail', { total: info.total }) }),
      h('p', { testid: 'task.exhausted.next', text: t('task.exhausted.next', { nextLevel, desc: t(`level.${info.nextLevel}.desc`) }) }),
      info.note ? h('p', { testid: `task.exhausted.${info.note}`, cls: 'small', text: t(`task.exhausted.${info.note}`, { nextLevel }) }) : null,
      errors.el('startup'),
      errors.el('advance'),
      h(
        'div',
        { cls: 'actions stack' },
        button('task.exhausted.advance', t('task.exhausted.advance', { nextLevel }), onAdvance, 'primary'),
        button('task.exhausted.redo', t('task.exhausted.redo'), onRedo),
      ),
    );
  }
  const node = h('div', { cls: 'screen' }, parts);
  return {
    node,
    focus: h1,
    showError(where, onRetry) {
      errors.show(where, onRetry);
    },
    clearErrors() {
      errors.clear();
    },
  };
}
