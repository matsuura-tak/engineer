// S8 settings、S9 settings.stats、S10 history と、確認のダイアログ。DOM を作るだけで、保存はしない。
import { h, button, link, inline } from './dom.js';
import { slot, storageError, guideSection } from './view-start.js';

const REPORT_KEY = { done: 'report.done', too_hard: 'report.tooHard', too_easy: 'report.tooEasy', no_time: 'report.noTime', none: 'report.none' };
const HELPFUL_KEY = { helpful: 'helpful.yes', not_helpful: 'helpful.no', unanswered: 'helpful.unanswered' };

export function confirmDialog(t, { prefix, body, onOk, onCancel }) {
  const titleId = `${prefix.replace(/\./g, '-')}-title`;
  const err = slot();
  const cancel = button(`${prefix}.cancel`, t(`${prefix}.cancel`), onCancel);
  const node = h(
    'dialog',
    { testid: prefix, cls: 'dialog', attrs: { 'aria-labelledby': titleId } },
    h('h2', { testid: `${prefix}.title`, attrs: { id: titleId }, text: t(`${prefix}.title`) }),
    body,
    err.el,
    h('div', { cls: 'actions stack' }, button(`${prefix}.ok`, t(`${prefix}.ok`), onOk, 'danger'), cancel),
  );
  node.addEventListener('cancel', (e) => {
    e.preventDefault();
    onCancel(e);
  });
  return {
    node,
    focus: cancel,
    showStorageError(onRetry) {
      err.set(storageError(t, onRetry));
    },
  };
}

export function settingsScreen(t, o) {
  const exists = o.kind === 'exists';
  const title = h('h1', { testid: 'settings.title', attrs: { tabindex: '-1' }, text: t('settings.title') });
  const exportStatus = h('p', { cls: 'status small', attrs: { role: 'status' } });
  const dataSection = h(
    'section',
    { cls: 'section', attrs: { 'aria-labelledby': 'settings-data-title' } },
    h('h2', { testid: 'settings.data.title', attrs: { id: 'settings-data-title' }, text: t('settings.data.title') }),
    h('p', { testid: 'settings.data.note', text: t('settings.data.note') }),
    exists && o.notPersisted ? h('p', { testid: 'settings.storage.notPersisted', cls: 'warning', text: t('settings.storage.notPersisted') }) : null,
    exists ? h('div', { cls: 'actions' }, button('settings.export', t('settings.export'), o.onExport, 'primary')) : null,
    exists ? exportStatus : null,
    h('p', { testid: 'settings.import.note', text: t('settings.import.note') }),
    h('div', { cls: 'actions' }, o.importerParts),
  );
  const parts = [title, dataSection];

  if (exists) {
    const d = o.data.diagnosis;
    parts.push(
      h(
        'section',
        { cls: 'section', attrs: { 'aria-labelledby': 'settings-diagnosis-title' } },
        h('h2', { testid: 'settings.diagnosis.title', attrs: { id: 'settings-diagnosis-title' }, text: t('settings.diagnosis.title') }),
        h('p', {
          testid: 'settings.diagnosis.current',
          text: t('settings.diagnosis.current', { area: t(`area.${d.area}`), level: t(`level.${o.data.levels[d.area] ?? d.level}`) }),
        }),
        h('div', { cls: 'actions' }, button('settings.redo', t('settings.redo'), o.onRedo)),
        h('p', { testid: 'settings.redo.note', cls: 'small secondary', text: t('settings.redo.note') }),
      ),
    );
  }

  let guideBox = null;
  let openButton = null;
  if (o.homeScreen) {
    guideBox = h('div', { cls: 'slot' });
    openButton = button('settings.homeScreen.open', t('settings.homeScreen.open'), o.onHomeOpen, 'secondary', { 'aria-expanded': 'false' });
    parts.push(
      h(
        'section',
        { cls: 'section', attrs: { 'aria-labelledby': 'settings-home-title' } },
        h('h2', { testid: 'settings.homeScreen.title', attrs: { id: 'settings-home-title' }, text: t('settings.homeScreen.title') }),
        h('div', { cls: 'actions' }, openButton),
        guideBox,
      ),
    );
  }

  let deleteButton = null;
  if (exists) {
    deleteButton = button('settings.delete', t('settings.delete'), o.onDelete, 'danger');
    parts.push(
      h(
        'section',
        { cls: 'section', attrs: { 'aria-labelledby': 'settings-records-title' } },
        h('h2', { testid: 'settings.records.title', attrs: { id: 'settings-records-title' }, text: t('settings.records.title') }),
        h('p', {}, link('settings.stats.open', t('settings.stats.open'), o.onStats)),
        h('p', {}, link('settings.history.open', t('settings.history.open'), o.onHistory)),
      ),
      h(
        'section',
        { cls: 'section', attrs: { 'aria-labelledby': 'settings-delete-title' } },
        h('h2', { testid: 'settings.delete.title', attrs: { id: 'settings-delete-title' }, text: t('settings.delete.title') }),
        h('div', { cls: 'actions' }, deleteButton),
      ),
    );
  }
  parts.push(h('p', { testid: 'settings.version', cls: 'small secondary', text: t('settings.version', { version: o.version }) }));

  return {
    node: h('div', { cls: 'screen' }, parts),
    focus: title,
    deleteButton,
    showExported() {
      exportStatus.replaceChildren(h('span', { testid: 'settings.export.done', cls: 'saved', text: t('settings.export.done') }));
    },
    toggleGuide(onClose) {
      if (!guideBox) return null;
      if (guideBox.firstChild) {
        guideBox.replaceChildren();
        openButton.setAttribute('aria-expanded', 'false');
        return null;
      }
      const g = guideSection(t, onClose);
      guideBox.replaceChildren(g.node);
      openButton.setAttribute('aria-expanded', 'true');
      return g;
    },
    closeGuide() {
      if (!guideBox) return;
      guideBox.replaceChildren();
      openButton.setAttribute('aria-expanded', 'false');
      openButton.focus();
    },
  };
}

const STAT_ROWS = [
  ['firstOpenDate', 'first-open-date'],
  ['issued', 'issued'],
  ['completed', 'completed'],
  ['firstDayCompleted', 'first-day-completed'],
  ['daysCompleted7d', 'days-completed-7d'],
  ['helpful', 'helpful'],
  ['rated', 'rated'],
  ['tooHard', 'too-hard'],
  ['noTime', 'no-time'],
];

export function statsScreen(t, { today, values, onBack }) {
  const title = h('h1', { testid: 'settings.stats.title', attrs: { tabindex: '-1' }, text: t('settings.stats.title') });
  const rows = STAT_ROWS.flatMap(([key, attr]) => {
    const v = values[key];
    let shown;
    let attrValue;
    if (typeof v === 'boolean') {
      attrValue = String(v);
      const k = v ? 'settings.stats.firstDayCompleted.yes' : 'settings.stats.firstDayCompleted.no';
      shown = h('span', { testid: k, text: t(k) });
    } else {
      attrValue = String(v);
      shown = attrValue;
    }
    return [
      h('dt', { testid: `settings.stats.${key}`, text: t(`settings.stats.${key}`) }),
      h('dd', { testid: `settings.stats.${key}.value`, attrs: { [`data-stat-${attr}`]: attrValue } }, shown),
    ];
  });
  const node = h(
    'div',
    { cls: 'screen' },
    title,
    h('p', { testid: 'settings.stats.today', cls: 'small secondary', text: t('settings.stats.today', { date: today }) }),
    h('dl', { cls: 'stats' }, rows),
    h('p', { testid: 'settings.stats.note', cls: 'small', text: t('settings.stats.note') }),
    h('p', {}, link('settings.stats.back', t('settings.stats.back'), onBack)),
  );
  return { node, focus: title };
}

export function historyScreen(t, { history, titleOf, onToday }) {
  const title = h('h1', { testid: 'history.title', attrs: { tabindex: '-1' }, text: t('history.title') });
  let body;
  if (history.length === 0) {
    body = [
      h('p', { testid: 'history.empty', text: t('history.empty') }),
      h('div', { cls: 'actions' }, button('history.empty.action', t('history.empty.action'), onToday, 'primary')),
    ];
  } else {
    const items = [];
    for (let i = history.length - 1; i >= 0; i--) {
      const r = history[i];
      const status = [h('span', { testid: REPORT_KEY[r.report], text: t(REPORT_KEY[r.report]) })];
      if (r.report === 'done') status.push(' ・ ', h('span', { testid: HELPFUL_KEY[r.helpful], text: t(HELPFUL_KEY[r.helpful]) }));
      items.push(
        h(
          'li',
          {
            testid: 'history.row',
            cls: 'history-row',
            attrs: { 'data-task-id': r.taskId, 'data-date': r.date, 'data-report': r.report, 'data-helpful': r.report === 'done' ? r.helpful : null },
          },
          h('p', { testid: 'history.row.date', cls: 'small secondary', text: r.date }),
          h('p', { testid: 'history.row.taskTitle' }, inline(titleOf(r.taskId))),
          h('p', {}, status),
          r.answer
            ? h(
                'details',
                {},
                h('summary', { testid: 'history.row.answer', text: t('history.row.answer') }),
                h('p', { testid: 'history.row.answerText', cls: 'answer-text', text: r.answer }),
              )
            : null,
        ),
      );
    }
    body = [h('ol', { testid: 'history.list', cls: 'history' }, items)];
  }
  return { node: h('div', { cls: 'screen' }, title, body), focus: title };
}
