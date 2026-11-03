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

export function todayScreen(t, { task, current, onInput, onReport }) {
  const title = h('h1', { testid: 'task.today.title', attrs: { tabindex: '-1' } }, inline(task.title));
  const parts = [
    h('p', { testid: 'task.today.label', cls: 'small secondary', text: t('task.today.label', { date: current.date }) }),
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
      attrs: { 'data-task-id': current.taskId, 'data-task-area': current.area, 'data-task-level': current.level, 'data-task-mode': current.mode },
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

export function rateScreen(t, { onRate, onClose }) {
  const title = h('h1', { testid: 'task.rate.title', attrs: { tabindex: '-1' }, text: t('task.rate.title') });
  const errors = errorSlots(t, ['rate']);
  const node = h(
    'div',
    { cls: 'screen' },
    title,
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

export function doneScreen(t, { title, onHistory }) {
  const h1 = h('h1', { testid: 'task.done.title', attrs: { tabindex: '-1' }, text: t('task.done.title') });
  const node = h(
    'div',
    { cls: 'screen' },
    h1,
    h('p', { testid: 'task.done.message', text: t('task.done.message') }),
    title ? h('p', { testid: 'task.done.task', cls: 'small secondary', text: t('task.done.task', { title }) }) : null,
    h('p', {}, link('task.done.history', t('task.done.history'), onHistory)),
  );
  return { node, focus: h1 };
}

export function skippedScreen(t, { report, onHistory }) {
  const h1 = h('h1', { testid: 'task.skipped.title', attrs: { tabindex: '-1' }, text: t('task.skipped.title') });
  const node = h(
    'div',
    { cls: 'screen' },
    h1,
    h('p', { testid: 'task.skipped.message', text: t('task.skipped.message') }),
    report === 'too_hard' || report === 'too_easy' ? h('p', { testid: 'task.skipped.levelHint', text: t('task.skipped.levelHint') }) : null,
    h('p', {}, link('task.skipped.history', t('task.skipped.history'), onHistory)),
  );
  return { node, focus: h1 };
}

export function exhaustedScreen(t, { onRedo }) {
  const h1 = h('h1', { testid: 'task.exhausted.message', attrs: { tabindex: '-1' }, text: t('task.exhausted.message') });
  const errors = errorSlots(t, ['startup']);
  const node = h(
    'div',
    { cls: 'screen' },
    h1,
    h('p', { testid: 'task.exhausted.detail', text: t('task.exhausted.detail') }),
    errors.el('startup'),
    h('div', { cls: 'actions' }, button('task.exhausted.redo', t('task.exhausted.redo'), onRedo, 'primary')),
  );
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
