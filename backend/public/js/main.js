// 起動と画面の切り替え（contracts/data.md の 4 の判定順、identifiers.md の data-state）。
import { h, link } from './dom.js';
import { ymd } from './dates.js';
import { pickLang, format } from './i18n.js';
import { openStore, save, removeAll } from './store.js';
import * as R from './rules.js';
import { download, readImport } from './files.js';
import { errorScreen, startScreen, questionScreen, importer } from './view-start.js';
import { todayScreen, rateScreen, doneScreen, skippedScreen, exhaustedScreen, dayChangedNotice } from './view-task.js';
import { settingsScreen, statsScreen, historyScreen, confirmDialog } from './view-settings.js';
import { canRequestPersist, requestPersist, drawWhenPersistedKnown } from './persist.js';

const root = document.documentElement;
const TASK_STATES = new Set(['task.today', 'task.done', 'task.skipped', 'task.exhausted']);
const ANSWER_DELAY_MS = 300;

const swPolicy =
  typeof window.trustedTypes !== 'undefined' && window.trustedTypes && typeof window.trustedTypes.createPolicy === 'function'
    ? window.trustedTypes.createPolicy('kyounoitte-sw', {
        createScriptURL(url) {
          if (url !== './sw.js') throw new TypeError('kyounoitte-sw は ./sw.js だけを通す');
          return url;
        },
      })
    : null;

const app = {
  lang: 'ja',
  strings: {},
  tasks: [],
  byId: new Map(),
  storage: null,
  data: null,
  day: '', // 画面を描いた日（端末の日付）
  checkDay: false,
  notice: null, // task.dayChanged
  seq: 0, // 操作と render の回数（S8 の待ちを捨てる。data.md の 11）
  draft: null, // やり直しの診断の下書き（メモリだけ。U-7）
  dialog: null,
  answer: null, // S3 の答えの欄 { view, timer, shown }
  loadMsWritten: false,
  swScheduled: false,
  persistAsked: false,
};

const main = document.querySelector('main');
const nav = document.querySelector('header nav');

const t = (key, values) => format(app.strings[key] ?? key, values, app.lang);
const today = () => ymd(new Date());

function track(_name) {}

function isStandalone() {
  return navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}

function isIosSafari() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return ios && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

// 操作の入口（data.md の 4、D-30、U-17）
function act(fn, op = '') {
  return (ev) => {
    if (ev && typeof ev.preventDefault === 'function' && ev.type !== 'change') ev.preventDefault();
    app.seq += 1;
    clearNotice();
    if (app.checkDay && today() !== app.day) {
      dayChanged(op);
      return;
    }
    fn(ev);
  };
}

function clearNotice() {
  if (app.notice) app.notice.remove();
  app.notice = null;
}

// data.md の 4「画面を開いたまま日付が変わったとき」
function dayChanged(op) {
  const a = app.answer;
  let held = null;
  if (a) {
    clearTimeout(a.timer);
    held = { value: a.view.value(), shown: a.shown };
    app.answer = null;
  }
  app.draft = null;
  closeDialog();
  decide({ focus: true, held, dayChanged: true, op });
}

function commit(next, onOk, onFail) {
  if (save(app.storage, next)) {
    app.data = next;
    onOk();
    return;
  }
  onFail(act(() => commit(next, onOk, onFail)));
}

function navKind() {
  return R.classify(app.data) === 'exists' ? 'diagnosed' : 'start';
}

function renderNav(kind, state) {
  if (kind === 'none') {
    nav.replaceChildren();
    return;
  }
  const items = [];
  if (kind === 'diagnosed') {
    items.push(link('nav.history', t('nav.history'), act(() => showHistory({ focus: true })), { 'aria-current': state === 'history' ? 'page' : null }));
  }
  items.push(link('nav.settings', t('nav.settings'), act(() => showSettings({ focus: true })), { 'aria-current': state === 'settings' ? 'page' : null }));
  nav.replaceChildren(...items);
}

function closeDialog({ restoreFocus = false } = {}) {
  const d = app.dialog;
  if (!d) return;
  app.dialog = null;
  if (d.node.open) d.node.close();
  d.node.remove();
  if (restoreFocus && d.returnFocus?.isConnected) d.returnFocus.focus();
}

function render(state, node, { navAs = navKind(), focus = null, lead = null } = {}) {
  app.seq += 1;
  closeDialog();
  if (state !== 'diagnosis.question') app.draft = null;
  flushAnswer();
  app.answer = null;
  app.notice = lead;
  renderNav(navAs, state);
  if (lead) main.replaceChildren(lead, node);
  else main.replaceChildren(node);
  root.setAttribute('data-state', state);
  app.day = today();
  app.checkDay = R.checksDay(state, app.data);
  if (!app.loadMsWritten && TASK_STATES.has(state)) {
    root.setAttribute('data-debug-load-ms', String(Math.round(performance.now())));
    app.loadMsWritten = true;
  }
  if (lead) {
    lead.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  } else if (focus) focus.focus();
  scheduleServiceWorker();
}

function decide(opts = {}) {
  const s = openStore(() => window.localStorage);
  if (s.kind === 'unavailable') {
    app.storage = null;
    showError('unavailable', null, opts);
    return;
  }
  app.storage = s.storage;
  if (s.kind === 'unreadable') {
    showError('unreadable', s.raw, opts);
    return;
  }
  app.data = s.data;
  route(opts);
}

function route(opts = {}) {
  app.draft = null;
  const kind = R.classify(app.data);
  if (kind === 'inProgress') return showQuestion(R.firstUnanswered(app.data.diagnosis), false, opts);
  if (kind === 'none') return showStart(opts);
  const r = R.planDay(app.data, today(), app.tasks, {
    canPersist: canRequestPersist(navigator.storage),
    shown: opts.held?.shown ?? null,
    held: opts.held?.value ?? null,
  });
  let saveFailed = false;
  if (r.changed) {
    app.data = r.data;
    saveFailed = !save(app.storage, r.data);
  }
  if (r.issued) track('Task Issued');
  showDay(r.state, { focus: opts.focus, saveFailed, dayChanged: opts.dayChanged === true && R.showsDayChanged(opts.op, r.state) });
  if (r.askPersist) askPersist();
}

// data.md の 11
function askPersist() {
  if (app.persistAsked) return;
  app.persistAsked = true;
  requestPersist(navigator.storage, () => track('Storage Persist Answered'));
}

function retryStartupSave(view) {
  return act(() => {
    if (save(app.storage, app.data)) view.clearErrors?.();
    else view.showError('startup', retryStartupSave(view));
  });
}

function showDay(state, opts = {}) {
  if (state === 'task.today') return showToday(opts);
  if (state === 'task.done') return showDone(opts);
  if (state === 'task.skipped') return showSkipped(opts);
  return showExhausted(opts);
}

function showError(variant, raw, opts) {
  const view = errorScreen(t, {
    variant,
    onReload: act(() => location.reload()),
    onExportRaw: act(() => download(`kyounoitte-raw-${today()}.json`, raw ?? '')),
    onDelete: act(() => openDeleteConfirm(view.deleteButton)),
  });
  render('error', view.node, { navAs: 'none', focus: opts.focus ? view.focus : null });
}

function showStart(opts = {}) {
  const standalone = isStandalone();
  const guide = !standalone && isIosSafari() && !app.data?.device?.homeGuideClosed;
  const imp = standalone ? makeImporter('home.standalone.importButton', 'home.standalone.importFile', false) : null;
  const view = startScreen(t, {
    standalone,
    guide,
    importerParts: imp?.nodes,
    onBegin: act(() => showQuestion(1, false, { focus: true })),
    onGuideClose: act(() => {
      commit(
        R.withDevice(app.data, { homeGuideClosed: true }),
        () => {
          track('Home Screen Guide Closed');
          view.removeGuide();
          view.begin.focus();
        },
        (retry) => view.showGuideError(retry),
      );
    }),
  });
  render('diagnosis.start', view.node, { focus: opts.focus ? view.focus : null });
}

function showQuestion(index, redo, opts = {}) {
  const values = redo ? app.draft : app.data?.diagnosis ?? {};
  const view = questionScreen(t, {
    index,
    redo,
    values,
    onNext: act(() => onAnswer(view, index, redo)),
    onBack: act(() => showQuestion(index - 1, redo, { focus: true })),
    onCancel: act(() => cancelRedo()),
  });
  render('diagnosis.question', view.node, { focus: opts.focus ? view.focus : null });
}

function onAnswer(view, index, redo) {
  const value = view.selected();
  if (!value) {
    view.showRequired();
    return;
  }
  view.clearErrors();
  const day = today();
  if (redo) {
    const key = ['area', 'level', 'years'][index - 1];
    if (index === 1 && app.draft.area !== value) {
      delete app.draft.level;
      delete app.draft.years;
    }
    app.draft[key] = value;
    if (index < 3) {
      showQuestion(index + 1, true, { focus: true });
      return;
    }
    const r = R.markPersist(R.finishRedo(app.data, app.draft, day, app.tasks), canRequestPersist(navigator.storage));
    commit(
      r.data,
      () => {
        track('Diagnosis Completed');
        if (r.issued) track('Task Issued');
        showDay(r.state, { focus: true });
        if (r.askPersist) askPersist();
      },
      (retry) => view.showStorageError(retry),
    );
    return;
  }
  if (index < 3) {
    commit(
      R.answerInitial(app.data, index, value, day),
      () => {
        if (index === 1) track('Diagnosis Started');
        showQuestion(index + 1, false, { focus: true });
      },
      (retry) => view.showStorageError(retry),
    );
    return;
  }
  const r = R.markPersist(R.finishInitial(app.data, value, day, app.tasks), canRequestPersist(navigator.storage));
  commit(
    r.data,
    () => {
      track('Diagnosis Completed');
      if (r.issued) track('Task Issued');
      showDay(r.state, { focus: true });
      if (r.askPersist) askPersist();
    },
    (retry) => view.showStorageError(retry),
  );
}

function startRedo(origin) {
  app.draft = { origin };
  showQuestion(1, true, { focus: true });
}

// 下書きは S8 を描くときに render が捨てる（data.md の 11）
function cancelRedo() {
  if (app.draft?.origin === 'settings') showSettings({ focus: true });
  else route({ focus: true });
}

function showToday(opts = {}) {
  const current = app.data.current;
  const task = app.byId.get(current.taskId) ?? { ...current, id: current.taskId, title: current.taskId, why: '', how: '', goal: '', tools: [], minutes: 0 };
  const view = todayScreen(t, {
    task,
    current,
    nth: R.nthToday(app.data),
    progress: R.progressOfCurrent(app.data, app.tasks),
    onInput: () => {
      const a = app.answer;
      if (!a) return;
      a.view.hideSaved();
      a.view.updateLimit();
      clearTimeout(a.timer);
      a.timer = setTimeout(saveAnswer, ANSWER_DELAY_MS);
    },
    onReport: (report) => act(() => onReport(view, report)),
  });
  render('task.today', view.node, { focus: opts.focus ? view.focus : null, lead: opts.dayChanged ? dayChangedNotice(t) : null });
  app.answer = { view, timer: 0, shown: { date: current.date, taskId: current.taskId } };
  if (opts.saveFailed) view.showError('startup', retryStartupSave(view));
}

function saveAnswer() {
  const a = app.answer;
  if (!a) return;
  clearTimeout(a.timer);
  a.timer = 0;
  const value = a.view.value();
  if (!app.data?.current || value === app.data.current.answer) return;
  const next = R.setAnswer(app.data, value);
  if (save(app.storage, next)) {
    app.data = next;
    a.view.clearErrors();
    a.view.showSaved();
  } else {
    a.view.showError('answer', act(saveAnswer));
  }
}

function flushAnswer() {
  if (app.answer) saveAnswer();
}

function onReport(view, report) {
  if (app.answer) clearTimeout(app.answer.timer);
  const before = app.data.levels;
  const next = R.reportTask(app.data, report, view.value());
  commit(
    next,
    () => {
      track(report === 'done' ? 'Task Completed' : 'Task Skipped');
      if (JSON.stringify(before) !== JSON.stringify(next.levels)) track('Level Changed');
      if (report === 'done') showRate();
      else showSkipped({ focus: true });
    },
    (retry) => view.showError('report', retry),
  );
}

function showRate() {
  const view = rateScreen(t, {
    onRate: (helpful) =>
      act(() =>
        commit(
          R.rateTask(app.data, today(), helpful),
          () => {
            track('Task Rated');
            showDone({ focus: true });
          },
          (retry) => view.showError(retry),
        ),
      ),
    onClose: act(() => showDone({ focus: true })),
  });
  render('task.rate', view.node, { focus: view.focus });
}

function showDone(opts = {}) {
  const row = R.rowOn(app.data.history, today());
  const title = row ? app.byId.get(row.taskId)?.title ?? row.taskId : '';
  const view = doneScreen(t, {
    title,
    note: R.nextNote(app.data, app.tasks),
    onNext: act(() => onNext(view), 'task.next'),
    onHistory: act(() => showHistory({ focus: true })),
  });
  render('task.done', view.node, { focus: opts.focus ? view.focus : null });
}

function showSkipped(opts = {}) {
  const view = skippedScreen(t, {
    notice: R.levelNotice(app.data, today()),
    note: R.nextNote(app.data, app.tasks),
    onNext: act(() => onNext(view), 'task.next'),
    onHistory: act(() => showHistory({ focus: true })),
  });
  render('task.skipped', view.node, { focus: opts.focus ? view.focus : null });
}

function showExhausted(opts = {}) {
  const view = exhaustedScreen(t, {
    info: R.exhaustedInfo(app.data, app.tasks),
    onAdvance: act(() => onAdvance(view), 'task.exhausted.advance'),
    onRedo: act(() => startRedo('exhausted')),
  });
  render('task.exhausted', view.node, { focus: opts.focus ? view.focus : null, lead: opts.dayChanged ? dayChangedNotice(t) : null });
  if (opts.saveFailed) view.showError('startup', retryStartupSave(view));
}

// data.md の 4「操作で出す」と 2 の失敗
function issueByAction(r, view, where, onSaved = () => {}) {
  const marked = R.markPersist(r, canRequestPersist(navigator.storage));
  if (!marked.changed) {
    showDay(marked.state, { focus: true });
    return;
  }
  commit(
    marked.data,
    () => {
      onSaved();
      if (marked.issued) track('Task Issued');
      showDay(marked.state, { focus: true });
      if (marked.askPersist) askPersist();
    },
    (retry) => view.showError(where, retry),
  );
}

function onNext(view) {
  issueByAction(R.nextTask(app.data, today(), app.tasks), view, 'next');
}

function onAdvance(view) {
  issueByAction(R.advanceLevel(app.data, today(), app.tasks), view, 'advance', () => track('Level Changed'));
}

function makeImporter(buttonTestid, fileTestid, primary) {
  const imp = importer(t, { buttonTestid, fileTestid, primary, onFile: act((file) => onImportFile(file, imp)) });
  return imp;
}

async function onImportFile(file, imp) {
  imp.clear();
  const r = await readImport(file);
  if (!r.ok) {
    imp.showImportError(r.reason);
    return;
  }
  if (R.classify(app.data) === 'exists') {
    openImportConfirm(r.data, imp);
    return;
  }
  replaceWith(r.data, (retry) => imp.showStorageError(retry));
}

function replaceWith(fileData, onFail) {
  commit(
    R.importReplacement(fileData, app.data),
    () => {
      track('Data Imported');
      route({ focus: true });
    },
    onFail,
  );
}

function openDialog(d, returnFocus) {
  closeDialog();
  app.dialog = { node: d.node, returnFocus };
  main.append(d.node);
  d.node.showModal();
  d.focus.focus();
}

function openImportConfirm(fileData, imp) {
  const d = confirmDialog(t, {
    prefix: 'settings.import.confirm',
    body: [
      h('p', {
        testid: 'settings.import.confirm.summary',
        text: t('settings.import.confirm.summary', { count: fileData.history.length, date: fileData.firstOpenDate ?? '' }),
      }),
      h('p', { testid: 'settings.import.confirm.body', text: t('settings.import.confirm.body') }),
    ],
    onOk: act(() => replaceWith(fileData, (retry) => d.showStorageError(retry))),
    onCancel: act(() => closeDialog({ restoreFocus: true })),
  });
  openDialog(d, imp.button);
}

function openDeleteConfirm(returnFocus) {
  const doDelete = act(() => {
    if (!app.storage || !removeAll(app.storage)) {
      d.showStorageError(doDelete);
      return;
    }
    track('Data Deleted');
    app.data = null;
    app.persistAsked = false;
    showStart({ focus: true });
  });
  const d = confirmDialog(t, {
    prefix: 'settings.delete.confirm',
    body: [h('p', { testid: 'settings.delete.confirm.body', text: t('settings.delete.confirm.body') })],
    onOk: doDelete,
    onCancel: act(() => closeDialog({ restoreFocus: true })),
  });
  openDialog(d, returnFocus);
}

// data.md の 11、design の D-31
function showSettings(opts = {}) {
  if (R.classify(app.data) !== 'exists') {
    drawSettings(false, opts);
    return;
  }
  const seq = app.seq;
  drawWhenPersistedKnown(navigator.storage, () => seq === app.seq, (notPersisted) => drawSettings(notPersisted, opts));
}

function drawSettings(notPersisted, opts) {
  const imp = makeImporter('settings.import', 'settings.import.file', R.classify(app.data) !== 'exists');
  const view = settingsScreen(t, {
    kind: R.classify(app.data),
    data: app.data,
    version: root.getAttribute('data-build-version') ?? '',
    notPersisted,
    homeScreen: isIosSafari() && !isStandalone(),
    importerParts: imp.nodes,
    onExport: act(() => {
      download(`kyounoitte-${today()}.json`, JSON.stringify(R.exportOf(app.data), null, 2));
      track('Data Exported');
      view.showExported();
    }),
    onRedo: act(() => startRedo('settings')),
    onHomeOpen: act(() => {
      const g = view.toggleGuide(
        act(() => {
          if (app.data?.device?.homeGuideClosed) {
            view.closeGuide();
            return;
          }
          commit(
            R.withDevice(app.data, { homeGuideClosed: true }),
            () => {
              track('Home Screen Guide Closed');
              view.closeGuide();
            },
            (retry) => g?.showError(retry),
          );
        }),
      );
    }),
    onStats: act(() => showStats({ focus: true })),
    onHistory: act(() => showHistory({ focus: true })),
    onDelete: act(() => openDeleteConfirm(view.deleteButton)),
  });
  render('settings', view.node, { focus: opts.focus ? view.focus : null });
}

function showStats(opts = {}) {
  const now = new Date();
  const view = statsScreen(t, {
    today: ymd(now),
    values: R.stats(app.data, now),
    onBack: act(() => showSettings({ focus: true })),
  });
  render('settings.stats', view.node, { focus: opts.focus ? view.focus : null });
}

function showHistory(opts = {}) {
  const view = historyScreen(t, {
    history: app.data?.history ?? [],
    titleOf: (id) => app.byId.get(id)?.title ?? id,
    onToday: act(() => route({ focus: true })),
  });
  render('history', view.node, { focus: opts.focus ? view.focus : null });
}

function scheduleServiceWorker() {
  if (app.swScheduled) return;
  app.swScheduled = true;
  if (!('serviceWorker' in navigator)) return;
  const register = () => {
    try {
      const url = swPolicy ? swPolicy.createScriptURL('./sw.js') : './sw.js';
      navigator.serviceWorker.register(url, { scope: './' }).catch(() => {});
    } catch {
    }
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

async function boot() {
  if (window.top !== window.self) return;
  app.lang = pickLang(navigator.language);
  let strings;
  let tasks;
  try {
    [strings, tasks] = await Promise.all([fetchJson(`./i18n/${app.lang}.json`), fetchJson('./data/tasks.json')]);
  } catch (e) {
    console.error('配布物を読めなかった', e instanceof Error ? e.name : 'Error');
    return;
  }
  app.strings = strings;
  app.tasks = tasks.tasks;
  app.byId = new Map(app.tasks.map((task) => [task.id, task]));
  root.setAttribute('lang', app.lang);

  document.querySelector('[data-testid="app.name"]').addEventListener(
    'click',
    act(() => {
      flushAnswer();
      decide({ focus: true });
    }),
  );
  window.addEventListener('pagehide', flushAnswer);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushAnswer();
  });
  track('Page Loaded');
  decide();
}

boot();
