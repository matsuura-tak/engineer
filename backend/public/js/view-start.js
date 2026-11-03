// S0 error、S1 diagnosis.start、S2 diagnosis.question と、画面をまたいで使う部品（エラーの枠、読み込みの部品、ホーム画面の案内）。
import { h, button } from './dom.js';
import { AREAS, LEVELS, YEARS } from './validate.js';

export function slot() {
  const el = h('div', { cls: 'slot' });
  return {
    el,
    set(node) {
      el.replaceChildren(node);
    },
    clear() {
      el.replaceChildren();
    },
  };
}

export function storageError(t, onRetry) {
  return h(
    'div',
    { cls: 'error-block' },
    h('p', { testid: 'error.storage.message', cls: 'msg-error', attrs: { role: 'alert' }, text: t('error.storage.message') }),
    button('error.storage.retry', t('error.storage.retry'), onRetry),
  );
}

export function errorSlots(t, names) {
  const slots = Object.fromEntries(names.map((n) => [n, slot()]));
  return {
    el: (name) => slots[name].el,
    show(name, onRetry) {
      for (const s of Object.values(slots)) s.clear();
      slots[name].set(storageError(t, onRetry));
    },
    clear() {
      for (const s of Object.values(slots)) s.clear();
    },
  };
}

export function importer(t, { buttonTestid, fileTestid, primary, onFile }) {
  const input = h('input', {
    testid: fileTestid,
    cls: 'visually-hidden',
    attrs: { type: 'file', accept: '.json,application/json', tabindex: '-1', 'aria-hidden': 'true' },
  });
  const btn = button(buttonTestid, t(buttonTestid), () => input.click(), primary ? 'primary' : 'secondary');
  const errors = slot();
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    input.value = '';
    if (file) onFile(file);
  });
  return {
    nodes: [btn, input, errors.el],
    button: btn,
    showImportError(reason) {
      errors.set(
        h(
          'div',
          { cls: 'error-block', attrs: { role: 'alert' } },
          h('p', { testid: 'error.import.message', cls: 'msg-error', text: t('error.import.message') }),
          h('p', { testid: `error.import.reason.${reason}`, cls: 'msg-error', text: t(`error.import.reason.${reason}`) }),
        ),
      );
    },
    showStorageError(onRetry) {
      errors.set(storageError(t, onRetry));
    },
    clear() {
      errors.clear();
    },
  };
}

export function guideSection(t, onClose) {
  const err = slot();
  const node = h(
    'section',
    { testid: 'home.addToHomeScreen', cls: 'notice', attrs: { 'aria-labelledby': 'guide-title' } },
    h('h2', { testid: 'home.addToHomeScreen.title', cls: 'warning', attrs: { id: 'guide-title' }, text: t('home.addToHomeScreen.title') }),
    h('p', { testid: 'home.addToHomeScreen.why', text: t('home.addToHomeScreen.why') }),
    h(
      'ol',
      { testid: 'home.addToHomeScreen.steps', cls: 'steps' },
      [1, 2, 3, 4].map((n) => h('li', { testid: `home.addToHomeScreen.steps.${n}`, text: t(`home.addToHomeScreen.steps.${n}`) })),
    ),
    err.el,
    button('home.addToHomeScreen.close', t('home.addToHomeScreen.close'), onClose),
  );
  return {
    node,
    showError(onRetry) {
      err.set(storageError(t, onRetry));
    },
  };
}

export function errorScreen(t, { variant, onReload, onExportRaw, onDelete }) {
  const unavailable = variant === 'unavailable';
  const title = h('h1', {
    testid: unavailable ? 'error.app.storageUnavailable.message' : 'error.app.message',
    attrs: { tabindex: '-1' },
    text: t(unavailable ? 'error.app.storageUnavailable.message' : 'error.app.message'),
  });
  const parts = [
    title,
    h('p', { testid: unavailable ? 'error.app.storageUnavailable.detail' : 'error.app.detail', text: t(unavailable ? 'error.app.storageUnavailable.detail' : 'error.app.detail') }),
    h('div', { cls: 'actions' }, button('error.app.reload', t('error.app.reload'), onReload, 'primary')),
  ];
  let del = null;
  if (!unavailable) {
    del = button('error.app.delete', t('error.app.delete'), onDelete, 'danger');
    parts.push(h('div', { cls: 'actions' }, button('error.app.exportRaw', t('error.app.exportRaw'), onExportRaw), del));
  }
  return { node: h('div', { cls: 'screen' }, ...parts), focus: title, deleteButton: del };
}

export function startScreen(t, { standalone, guide, importerParts, onBegin, onGuideClose }) {
  const title = h('h1', { testid: 'diagnosis.start.title', attrs: { tabindex: '-1' }, text: t('diagnosis.start.title') });
  const parts = [title, ...[1, 2, 3].map((n) => h('p', { testid: `diagnosis.start.lead.${n}`, text: t(`diagnosis.start.lead.${n}`) }))];
  if (standalone && importerParts) {
    parts.push(
      h(
        'section',
        { testid: 'home.standalone', cls: 'notice', attrs: { 'aria-labelledby': 'standalone-import' } },
        h('p', { testid: 'home.standalone.import', attrs: { id: 'standalone-import' }, text: t('home.standalone.import') }),
        ...importerParts,
      ),
    );
  }
  const g = guide ? guideSection(t, onGuideClose) : null;
  if (g) parts.push(g.node);
  const begin = button('diagnosis.start.begin', t('diagnosis.start.begin'), onBegin, 'primary');
  parts.push(h('div', { cls: 'actions' }, begin));
  return {
    node: h('div', { cls: 'screen' }, ...parts),
    focus: title,
    begin,
    removeGuide() {
      g?.node.remove();
    },
    showGuideError(onRetry) {
      g?.showError(onRetry);
    },
  };
}

const QUESTIONS = {
  1: { name: 'area', options: AREAS.map((v) => ({ value: v, key: `area.${v}` })) },
  2: { name: 'level', options: LEVELS.map((v) => ({ value: v, key: `level.${v}`, desc: `level.${v}.desc` })) },
  3: { name: 'years', options: YEARS.map((v) => ({ value: v, key: `years.${v}` })) },
};

export function questionScreen(t, { index, redo, values, onNext, onBack, onCancel }) {
  const q = QUESTIONS[index];
  const progress = h('p', {
    testid: 'diagnosis.progress',
    cls: 'small secondary',
    attrs: { 'data-question-index': index, 'data-question-total': 3, tabindex: '-1' },
    text: t('diagnosis.progress', { n: index, total: 3 }),
  });
  const legendText = index === 2 ? t('diagnosis.q2.legend', { area: t(`area.${values.area}`) }) : t(`diagnosis.q${index}.legend`);
  const required = slot();
  const errors = errorSlots(t, ['storage']);
  const choices = q.options.map((o) =>
    h(
      'label',
      { cls: 'choice' },
      h('input', { testid: o.key, attrs: { type: 'radio', name: q.name, value: o.value, checked: values[q.name] === o.value } }),
      h('span', { cls: 'choice-text' }, h('span', { text: t(o.key) }), o.desc ? h('span', { testid: o.desc, cls: 'small secondary', text: t(o.desc) }) : null),
    ),
  );
  const form = h(
    'form',
    { cls: 'screen', attrs: { novalidate: true } },
    progress,
    h(
      'fieldset',
      { testid: 'diagnosis.question', cls: 'question' },
      h('legend', { testid: `diagnosis.q${index}.legend`, text: legendText }),
      required.el,
      h('div', { cls: 'choices' }, choices),
    ),
    errors.el('storage'),
    h(
      'div',
      { cls: 'actions' },
      h('button', {
        testid: index === 3 ? 'diagnosis.finish' : 'diagnosis.next',
        cls: 'btn btn-primary',
        attrs: { type: 'submit' },
        text: t(index === 3 ? 'diagnosis.finish' : 'diagnosis.next'),
      }),
      index > 1 ? button('diagnosis.back', t('diagnosis.back'), onBack) : null,
      redo ? button('diagnosis.cancel', t('diagnosis.cancel'), onCancel) : null,
    ),
  );
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    onNext(e);
  });
  return {
    node: form,
    focus: progress,
    selected() {
      const el = form.querySelector('input[type="radio"]:checked');
      return el ? el.value : null;
    },
    showRequired() {
      required.set(h('p', { testid: 'error.diagnosis.required', cls: 'msg-error', attrs: { role: 'alert' }, text: t('error.diagnosis.required') }));
    },
    showStorageError(onRetry) {
      errors.show('storage', onRetry);
    },
    clearErrors() {
      required.clear();
      errors.clear();
    },
  };
}
