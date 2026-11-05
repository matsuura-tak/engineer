// 状態を決める規則（contracts/data.md の 2〜5、7〜9）。DOM にも保存先にも触らない純粋な関数だけ。
import { LEVELS, CURRENT_VERSION } from './validate.js';
import { ymd, ymdShift } from './dates.js';

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

// data.md の 4（U-15）
export function checksDay(state, data) {
  return state !== 'error' && classify(data) === 'exists';
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

export function lastIndexOn(history, date) {
  for (let i = history.length - 1; i >= 0; i--) if (history[i].date === date) return i;
  return -1;
}

export function rowOn(history, date) {
  const i = lastIndexOn(history, date);
  return i < 0 ? null : history[i];
}

export function levelAbove(level) {
  const i = LEVELS.indexOf(level);
  return i < 0 || i === LEVELS.length - 1 ? null : LEVELS[i + 1];
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

// 4 の 6-1
function moveStale(data, today) {
  if (!data.current || data.current.date === today) return { data, changed: false };
  const next = clone(data);
  const { date, taskId, area, level, mode, answer } = next.current;
  next.history.push({ date, taskId, area, level, mode, answer, report: 'none' });
  delete next.current;
  return { data: next, changed: true };
}

// 4 の 6-4
function issueToday(data, today, tasks, changed) {
  const task = pickTask(data, tasks);
  if (!task) return { state: 'task.exhausted', data, changed, issued: false, row: null };
  const next = clone(data);
  next.current = { date: today, taskId: task.id, area: task.area, level: task.level, mode: task.mode, answer: '' };
  return { state: 'task.today', data: next, changed: true, issued: true, row: null };
}

// 4 の 6。6-2 が 6-3 より先
export function startOfDay(data, today, tasks) {
  const moved = moveStale(data, today);
  const next = moved.data;
  if (next.current) return { state: 'task.today', data: next, changed: moved.changed, issued: false, row: null };
  const row = rowOn(next.history, today);
  if (row) return { state: row.report === 'done' ? 'task.done' : 'task.skipped', data: next, changed: moved.changed, issued: false, row };
  return issueToday(next, today, tasks, moved.changed);
}

// task.next（4 の「操作で出す」）。今日の current があれば上書きしない
export function nextTask(data, today, tasks) {
  const moved = moveStale(data, today);
  if (moved.data.current) return { state: 'task.today', data: moved.data, changed: moved.changed, issued: false, row: null };
  return issueToday(moved.data, today, tasks, moved.changed);
}

// task.exhausted.advance（2 の表）
export function advanceLevel(data, today, tasks) {
  const { area, level } = targetOf(data);
  const up = levelAbove(level);
  if (!up) return { state: 'task.exhausted', data, changed: false, issued: false, row: null };
  const moved = moveStale(data, today);
  const next = clone(moved.data);
  next.levels[area] = up;
  if (next.current) return { state: 'task.today', data: next, changed: true, issued: false, row: null };
  return issueToday(next, today, tasks, true);
}

// data.md の 4 の 2
export function carryAnswer(data, shown, held) {
  if (!data?.current || !shown || typeof held !== 'string') return data;
  const c = data.current;
  if (c.date !== shown.date || c.taskId !== shown.taskId || c.answer === held) return data;
  return setAnswer(data, held);
}

// data.md の 2、11
export function markPersist(r, canPersist) {
  if (!r.issued || !canPersist || r.data.device?.persistRequested === true) return { ...r, askPersist: false };
  const device = { ...(r.data.device ?? {}), persistRequested: true };
  return { ...r, data: { ...r.data, device }, changed: true, askPersist: true };
}

// data.md の 4 の 6
export function planDay(data, today, tasks, { canPersist = false, shown = null, held = null } = {}) {
  const base = carryAnswer(data, shown, held);
  let r = startOfDay(base, today, tasks);
  if (base !== data && !r.changed) r = { ...r, changed: true };
  return markPersist(r, canPersist);
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

// やり直しの行き先（2）
export function finishRedo(data, draft, today, tasks) {
  const moved = moveStale(data, today);
  const next = clone(moved.data);
  next.diagnosis = { area: draft.area, level: draft.level, years: draft.years, completedOn: today };
  next.levels[draft.area] = draft.level;
  if (next.current) return { state: 'task.today', data: next, changed: true, issued: false, row: null };
  return issueToday(next, today, tasks, true);
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

// 9 の数え方
export function mondayOf(now) {
  return ymdShift(now, -((now.getDay() + 6) % 7));
}

function completedDaysBetween(history, from, to) {
  return new Set(history.filter((r) => r.report === 'done' && r.date >= from && r.date <= to).map((r) => r.date)).size;
}

export function completedCount(data) {
  return data.history.filter((r) => r.report === 'done').length;
}

export function daysCompletedWeek(data, now) {
  return completedDaysBetween(data.history, mondayOf(now), ymd(now));
}

export function extraCompleted(history) {
  const perDay = new Map();
  for (const r of history) if (r.report === 'done') perDay.set(r.date, (perDay.get(r.date) ?? 0) + 1);
  let n = 0;
  for (const c of perDay.values()) n += Math.max(0, c - 1);
  return n;
}

export function stats(data, now) {
  const h = data.history;
  const today = ymd(now);
  return {
    firstOpenDate: data.firstOpenDate,
    issued: h.length + (data.current ? 1 : 0),
    completed: completedCount(data),
    firstDayCompleted: h.some((r) => r.report === 'done' && r.date === data.firstOpenDate),
    daysCompleted7d: completedDaysBetween(h, ymdShift(now, -6), today),
    daysCompletedWeek: daysCompletedWeek(data, now),
    extraCompleted: extraCompleted(h),
    helpful: h.filter((r) => r.helpful === 'helpful').length,
    rated: h.filter((r) => r.helpful === 'helpful' || r.helpful === 'not_helpful').length,
    tooHard: h.filter((r) => r.report === 'too_hard').length,
    noTime: h.filter((r) => r.report === 'no_time').length,
  };
}

// 画面の数（9）

export function groupSize(tasks, area, level) {
  let n = 0;
  for (const t of tasks) if (t.area === area && t.level === level) n += 1;
  return n;
}

export function nthToday(data) {
  const date = data.current.date;
  return data.history.filter((r) => r.date === date).length + 1;
}

export function progressOfCurrent(data, tasks) {
  const { area, level } = data.current;
  return { index: data.history.filter((r) => r.area === area && r.level === level).length + 1, total: groupSize(tasks, area, level) };
}

export function progressOfRow(history, i, tasks) {
  const r = history[i];
  let index = 0;
  for (let j = 0; j <= i; j++) if (history[j].area === r.area && history[j].level === r.level) index += 1;
  return { index, total: groupSize(tasks, r.area, r.level) };
}

export function milestoneOf(count) {
  return count === 7 || count === 30 || count === 100 ? String(count) : 'none';
}

// S4 / S5 の数。完了の行は今日の最後の行
export function doneInfo(data, tasks, now) {
  const count = completedCount(data);
  const i = lastIndexOn(data.history, ymd(now));
  return {
    count,
    milestone: milestoneOf(count),
    progress: i < 0 ? null : progressOfRow(data.history, i, tasks),
    week: daysCompletedWeek(data, now),
    taskId: i < 0 ? null : data.history[i].taskId,
  };
}

export function nextNote(data, tasks) {
  const { area, level } = targetOf(data);
  return { last: pickTask(data, tasks) === null, area, level };
}

export function levelNotice(data, today) {
  const i = lastIndexOn(data.history, today);
  if (i < 0) return null;
  const r = data.history[i];
  if (r.report !== 'too_hard' && r.report !== 'too_easy') return null;
  const moved = applyLevelRule({ [r.area]: r.level }, data.history.slice(0, i + 1), r.area)[r.area];
  if (moved !== r.level && data.levels?.[r.area] === moved) return { kind: 'levelChanged', level: moved };
  return { kind: 'levelHint', level: null };
}

// 5 の S7 の変種
export function exhaustedInfo(data, tasks) {
  const { area, level } = targetOf(data);
  const total = groupSize(tasks, area, level);
  const nextLevel = levelAbove(level);
  if (!nextLevel) return { variant: 'allDone', area, level, total, nextLevel: null, note: null };
  const used = issuedIds(data);
  let unseen = 0;
  for (const t of tasks) if (t.area === area && t.level === nextLevel && !used.has(t.id)) unseen += 1;
  let note = null;
  if (unseen === 0) note = 'nextDone';
  else if (data.history.some((r) => r.area === area && r.level === nextLevel)) note = 'seenNext';
  return { variant: 'levelDone', area, level, total, nextLevel, note };
}

// U-17
export function showsDayChanged(op, state) {
  if (state !== 'task.today' && state !== 'task.exhausted') return false;
  return op !== 'task.next';
}
