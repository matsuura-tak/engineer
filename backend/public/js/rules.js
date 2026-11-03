// 状態を決める規則（contracts/data.md の 2〜5、7〜9）。DOM にも保存先にも触らない純粋な関数だけ。
import { LEVELS, CURRENT_VERSION } from './validate.js';

const clone = (v) => structuredClone(v);

export function emptyData(device) {
  const d = { formatVersion: CURRENT_VERSION, app: 'kyounoitte', diagnosis: {}, levels: {}, history: [] };
  if (device && Object.keys(device).length) d.device = clone(device);
  return d;
}

export function classify(data) {
  if (!data) return 'none';
  if (data.diagnosis?.completedOn || (data.history?.length ?? 0) > 0) return 'exists';
  if (data.diagnosis?.area) return 'inProgress';
  return 'none';
}

export function firstUnanswered(diagnosis) {
  if (!diagnosis?.area) return 1;
  if (!diagnosis.level) return 2;
  return 3;
}

export function targetOf(data) {
  const area = data.diagnosis.area;
  return { area, level: data.levels?.[area] ?? data.diagnosis.level };
}

export function issuedIds(data) {
  const ids = new Set(data.history.map((r) => r.taskId));
  if (data.current) ids.add(data.current.taskId);
  return ids;
}

export function pickTask(data, tasks) {
  const { area, level } = targetOf(data);
  const used = issuedIds(data);
  let best = null;
  for (const t of tasks) {
    if (t.area !== area || t.level !== level || used.has(t.id)) continue;
    if (best === null || t.id < best.id) best = t;
  }
  return best;
}

export function rowOn(history, date) {
  for (let i = history.length - 1; i >= 0; i--) if (history[i].date === date) return history[i];
  return null;
}

export function applyLevelRule(levels, history, area) {
  const next = clone(levels);
  const last = [...history].reverse().find((r) => r.area === area && r.report !== 'none');
  const now = next[area] ?? last?.level;
  if (!now) return next;
  const run = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const r = history[i];
    if (r.area !== area || r.report === 'none') continue;
    if (r.level !== now) break;
    run.push(r);
    if (run.length === 2) break;
  }
  if (run.length < 2) return next;
  const idx = LEVELS.indexOf(now);
  if (run[0].report === 'too_hard' && run[1].report === 'too_hard') next[area] = LEVELS[Math.max(0, idx - 1)];
  else if (run[0].report === 'too_easy' && run[1].report === 'too_easy') next[area] = LEVELS[Math.min(LEVELS.length - 1, idx + 1)];
  else next[area] = now;
  return next;
}

export function startOfDay(data, today, tasks) {
  let next = data;
  let changed = false;
  if (next.current && next.current.date !== today) {
    next = clone(next);
    const { date, taskId, area, level, mode, answer } = next.current;
    next.history.push({ date, taskId, area, level, mode, answer, report: 'none' });
    delete next.current;
    changed = true;
  }
  const row = rowOn(next.history, today);
  if (row) return { state: row.report === 'done' ? 'task.done' : 'task.skipped', data: next, changed, issued: false, row };
  if (next.current) return { state: 'task.today', data: next, changed, issued: false, row: null };
  const task = pickTask(next, tasks);
  if (!task) return { state: 'task.exhausted', data: next, changed, issued: false, row: null };
  if (next === data) next = clone(next);
  next.current = { date: today, taskId: task.id, area: task.area, level: task.level, mode: task.mode, answer: '' };
  return { state: 'task.today', data: next, changed: true, issued: true, row: null };
}

export function answerInitial(data, question, value, today) {
  const base = data ? clone(data) : emptyData();
  const wasNone = classify(data) === 'none';
  const d = base.diagnosis;
  if (question === 1) {
    if (d.area !== value) {
      delete d.level;
      delete d.years;
    }
    d.area = value;
    if (wasNone) base.firstOpenDate = today;
  } else if (question === 2) {
    d.level = value;
    delete d.years;
  }
  return base;
}

export function finishInitial(data, years, today, tasks) {
  const next = clone(data);
  next.diagnosis.years = years;
  next.diagnosis.completedOn = today;
  next.levels[next.diagnosis.area] = next.diagnosis.level;
  return startOfDay(next, today, tasks);
}

export function finishRedo(data, draft, today, tasks) {
  const next = clone(data);
  next.diagnosis = { area: draft.area, level: draft.level, years: draft.years, completedOn: today };
  next.levels[draft.area] = draft.level;
  return startOfDay(next, today, tasks);
}

export function setAnswer(data, answer) {
  const next = clone(data);
  next.current.answer = answer;
  return next;
}

export function reportTask(data, report, answer) {
  const next = clone(data);
  const { date, taskId, area, level, mode } = next.current;
  const row = { date, taskId, area, level, mode, answer, report };
  if (report === 'done') row.helpful = 'unanswered';
  next.history.push(row);
  delete next.current;
  next.levels = applyLevelRule(next.levels, next.history, area);
  return next;
}

export function rateTask(data, today, helpful) {
  const next = clone(data);
  for (let i = next.history.length - 1; i >= 0; i--) {
    const r = next.history[i];
    if (r.date === today && r.report === 'done') {
      r.helpful = helpful;
      break;
    }
  }
  return next;
}

export function withDevice(data, patch) {
  const next = data ? clone(data) : emptyData();
  next.device = { ...(next.device ?? {}), ...patch };
  return next;
}

export function exportOf(data) {
  const out = clone(data);
  delete out.device;
  return out;
}

export function importReplacement(fileData, currentData) {
  const next = clone(fileData);
  delete next.device;
  if (currentData?.device && Object.keys(currentData.device).length) next.device = clone(currentData.device);
  return next;
}

export function stats(data, today, weekStart) {
  const h = data.history;
  const done = h.filter((r) => r.report === 'done');
  const days = new Set(done.filter((r) => r.date >= weekStart && r.date <= today).map((r) => r.date));
  return {
    firstOpenDate: data.firstOpenDate,
    issued: h.length + (data.current ? 1 : 0),
    completed: done.length,
    firstDayCompleted: done.some((r) => r.date === data.firstOpenDate),
    daysCompleted7d: days.size,
    helpful: h.filter((r) => r.helpful === 'helpful').length,
    rated: h.filter((r) => r.helpful === 'helpful' || r.helpful === 'not_helpful').length,
    tooHard: h.filter((r) => r.report === 'too_hard').length,
    noTime: h.filter((r) => r.report === 'no_time').length,
  };
}
