// 保存データ＝書き出しファイル＝seed の検査（contracts/schemas/data.schema.json を手で写したもの）。

export const CURRENT_VERSION = 1;
export const AREAS = ['backend', 'frontend', 'database', 'infra', 'testing', 'git'];
export const LEVELS = ['beginner', 'intermediate', 'advanced'];
export const YEARS = ['lt1', '1to3', '3to5', 'gte5'];
export const MODES = ['in_app', 'external'];
export const REPORTS = ['done', 'too_hard', 'too_easy', 'no_time', 'none'];
export const HELPFUL = ['helpful', 'not_helpful', 'unanswered'];
export const ANSWER_MAX = 2000;

const DATE_RE = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/u;
const TASK_ID_RE = /^(backend|frontend|database|infra|testing|git)-(beginner|intermediate|advanced)-[0-9]{3}$/u;

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const isDate = (v) => typeof v === 'string' && DATE_RE.test(v);
const codePoints = (s) => [...s].length;

function onlyKeys(obj, allowed, path, errs) {
  for (const k of Object.keys(obj)) if (!allowed.includes(k)) errs.push(`${path} に知らない項目 ${k}`);
}

function requireKeys(obj, keys, path, errs) {
  for (const k of keys) if (!has(obj, k)) errs.push(`${path} に ${k} がない`);
}

function enumOf(v, values, path, errs) {
  if (!values.includes(v)) errs.push(`${path} の値が違う`);
}

function checkTaskFields(o, path, errs) {
  if (has(o, 'date') && !isDate(o.date)) errs.push(`${path}.date の形が違う`);
  if (has(o, 'taskId') && !(typeof o.taskId === 'string' && TASK_ID_RE.test(o.taskId))) errs.push(`${path}.taskId の形が違う`);
  if (has(o, 'area')) enumOf(o.area, AREAS, `${path}.area`, errs);
  if (has(o, 'level')) enumOf(o.level, LEVELS, `${path}.level`, errs);
  if (has(o, 'mode')) enumOf(o.mode, MODES, `${path}.mode`, errs);
  if (has(o, 'answer') && !(typeof o.answer === 'string' && codePoints(o.answer) <= ANSWER_MAX)) errs.push(`${path}.answer が文字列でないか長すぎる`);
  for (const a of AREAS) {
    if (!has(o, 'area') || o.area === a) {
      if (has(o, 'taskId') && !(typeof o.taskId === 'string' && o.taskId.startsWith(`${a}-`))) errs.push(`${path}.taskId が領域 ${a} と合わない`);
    }
  }
  for (const l of LEVELS) {
    if (!has(o, 'level') || o.level === l) {
      if (has(o, 'taskId') && !(typeof o.taskId === 'string' && new RegExp(`-${l}-[0-9]{3}$`, 'u').test(o.taskId))) errs.push(`${path}.taskId が段階 ${l} と合わない`);
    }
  }
}

function checkRow(row, path, errs) {
  if (!isObject(row)) {
    errs.push(`${path} がオブジェクトでない`);
    return;
  }
  onlyKeys(row, ['date', 'taskId', 'area', 'level', 'mode', 'answer', 'report', 'helpful'], path, errs);
  requireKeys(row, ['date', 'taskId', 'area', 'level', 'mode', 'answer', 'report'], path, errs);
  checkTaskFields(row, path, errs);
  if (has(row, 'report')) enumOf(row.report, REPORTS, `${path}.report`, errs);
  if (has(row, 'helpful')) enumOf(row.helpful, HELPFUL, `${path}.helpful`, errs);
  const doneBranch = !has(row, 'report') || row.report === 'done';
  if (doneBranch) {
    if (!(has(row, 'helpful') && typeof row.helpful === 'string')) errs.push(`${path} は done なのに helpful がない`);
  } else if (has(row, 'helpful') && typeof row.helpful === 'string') {
    errs.push(`${path} は done でないのに helpful がある`);
  }
}

function checkCurrent(cur, errs) {
  if (!isObject(cur)) {
    errs.push('current がオブジェクトでない');
    return;
  }
  onlyKeys(cur, ['date', 'taskId', 'area', 'level', 'mode', 'answer'], 'current', errs);
  requireKeys(cur, ['date', 'taskId', 'area', 'level', 'mode', 'answer'], 'current', errs);
  checkTaskFields(cur, 'current', errs);
}

function checkDiagnosis(d, errs) {
  if (!isObject(d)) {
    errs.push('diagnosis がオブジェクトでない');
    return;
  }
  onlyKeys(d, ['area', 'level', 'years', 'completedOn'], 'diagnosis', errs);
  if (has(d, 'area')) enumOf(d.area, AREAS, 'diagnosis.area', errs);
  if (has(d, 'level')) enumOf(d.level, LEVELS, 'diagnosis.level', errs);
  if (has(d, 'years')) enumOf(d.years, YEARS, 'diagnosis.years', errs);
  if (has(d, 'completedOn') && !isDate(d.completedOn)) errs.push('diagnosis.completedOn の形が違う');
  if (has(d, 'level') && !has(d, 'area')) errs.push('diagnosis.level があるのに area がない');
  if (has(d, 'years') && !has(d, 'level')) errs.push('diagnosis.years があるのに level がない');
  if (has(d, 'completedOn')) requireKeys(d, ['area', 'level', 'years'], 'diagnosis', errs);
}

function checkLevels(levels, errs) {
  if (!isObject(levels)) {
    errs.push('levels がオブジェクトでない');
    return;
  }
  onlyKeys(levels, AREAS, 'levels', errs);
  for (const k of Object.keys(levels)) if (AREAS.includes(k)) enumOf(levels[k], LEVELS, `levels.${k}`, errs);
}

function checkDevice(dev, errs) {
  if (!isObject(dev)) {
    errs.push('device がオブジェクトでない');
    return;
  }
  onlyKeys(dev, ['homeGuideClosed', 'persistRequested', 'persistGranted'], 'device', errs);
  for (const k of Object.keys(dev)) if (typeof dev[k] !== 'boolean') errs.push(`device.${k} が真偽値でない`);
  if (has(dev, 'persistGranted') && !has(dev, 'persistRequested')) errs.push('device.persistGranted があるのに persistRequested がない');
}

export function validateData(doc) {
  const errs = [];
  if (!isObject(doc)) return ['オブジェクトでない'];
  onlyKeys(doc, ['formatVersion', 'app', 'firstOpenDate', 'diagnosis', 'levels', 'current', 'history', 'device'], '保存データ', errs);
  requireKeys(doc, ['formatVersion', 'app', 'diagnosis', 'levels', 'history'], '保存データ', errs);
  if (has(doc, 'formatVersion') && doc.formatVersion !== CURRENT_VERSION) errs.push('formatVersion が 1 でない');
  if (has(doc, 'app') && doc.app !== 'kyounoitte') errs.push('app が kyounoitte でない');
  if (has(doc, 'firstOpenDate') && !isDate(doc.firstOpenDate)) errs.push('firstOpenDate の形が違う');
  if (has(doc, 'diagnosis')) checkDiagnosis(doc.diagnosis, errs);
  if (has(doc, 'levels')) checkLevels(doc.levels, errs);
  if (has(doc, 'current')) checkCurrent(doc.current, errs);
  if (has(doc, 'history')) {
    if (!Array.isArray(doc.history)) errs.push('history が配列でない');
    else {
      if (doc.history.length > 20000) errs.push('history が多すぎる');
      doc.history.forEach((row, i) => checkRow(row, `history[${i}]`, errs));
    }
  }
  if (has(doc, 'device')) checkDevice(doc.device, errs);

  if (has(doc, 'current') && isObject(doc.current) && has(doc, 'diagnosis')) {
    if (!(isObject(doc.diagnosis) && has(doc.diagnosis, 'completedOn') && typeof doc.diagnosis.completedOn === 'string')) {
      errs.push('current があるのに診断を終えていない');
    }
  }
  const completed = isObject(doc.diagnosis) && has(doc.diagnosis, 'completedOn') && typeof doc.diagnosis.completedOn === 'string';
  if ((!has(doc, 'diagnosis') || completed) && has(doc, 'levels')) {
    if (!isObject(doc.levels) || Object.keys(doc.levels).length < 1) errs.push('診断を終えたのに levels が空');
  }
  if (!(has(doc, 'firstOpenDate') && typeof doc.firstOpenDate === 'string')) {
    if (has(doc, 'diagnosis') && !(isObject(doc.diagnosis) && Object.keys(doc.diagnosis).length === 0)) errs.push('firstOpenDate がないのに diagnosis がある');
    if (has(doc, 'levels') && !(isObject(doc.levels) && Object.keys(doc.levels).length === 0)) errs.push('firstOpenDate がないのに levels がある');
    if (has(doc, 'history') && !(Array.isArray(doc.history) && doc.history.length === 0)) errs.push('firstOpenDate がないのに history がある');
  }
  return errs;
}

export function readDocument(text) {
  let doc;
  try {
    doc = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'schema', errors: ['JSON.parse の失敗'] };
  }
  if (!isObject(doc)) return { ok: false, reason: 'schema', errors: ['オブジェクトでない'] };
  if (Number.isInteger(doc.formatVersion) && doc.formatVersion > CURRENT_VERSION) {
    return { ok: false, reason: 'version', errors: ['formatVersion が今の版より新しい'] };
  }
  const errors = validateData(doc);
  if (errors.length) return { ok: false, reason: 'schema', errors };
  return { ok: true, data: doc };
}
