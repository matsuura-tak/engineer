// 課題集の検査（contracts/schemas/tasks.schema.json を手で写したもの）。ビルドの手順は node の組み込みだけで動かす（ADR 0001）ので、
// ajv を使わずにここで検査する。合否が contracts/fixtures/tasks/ のすべてで ajv と同じことは tests/unit/tasks-check.test.mjs で確かめる。

const AREAS = ['backend', 'frontend', 'database', 'infra', 'testing', 'git'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const MODES = ['in_app', 'external'];
const TASK_ID_RE = /^(backend|frontend|database|infra|testing|git)-(beginner|intermediate|advanced)-[0-9]{3}$/u;
const TEXT_LIMITS = { title: 60, why: 200, how: 400, goal: 200 };
const KEYS = ['id', 'area', 'level', 'mode', 'minutes', 'title', 'why', 'how', 'goal', 'tools'];

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const len = (s) => [...s].length; // JSON Schema の長さは符号位置で数える（ajv と同じ）

function checkTask(task, path, errs) {
  if (!isObject(task)) {
    errs.push(`${path} がオブジェクトでない`);
    return;
  }
  for (const k of Object.keys(task)) if (!KEYS.includes(k)) errs.push(`${path} に知らない項目 ${k}`);
  for (const k of KEYS) if (!has(task, k)) errs.push(`${path} に ${k} がない`);
  if (has(task, 'id') && !(typeof task.id === 'string' && TASK_ID_RE.test(task.id))) errs.push(`${path}.id の形が違う`);
  if (has(task, 'area') && !AREAS.includes(task.area)) errs.push(`${path}.area の値が違う`);
  if (has(task, 'level') && !LEVELS.includes(task.level)) errs.push(`${path}.level の値が違う`);
  if (has(task, 'mode') && !MODES.includes(task.mode)) errs.push(`${path}.mode の値が違う`);
  if (has(task, 'minutes') && !(Number.isInteger(task.minutes) && task.minutes >= 1 && task.minutes <= 15)) errs.push(`${path}.minutes が 1〜15 の整数でない`);
  for (const [k, max] of Object.entries(TEXT_LIMITS)) {
    if (!has(task, k)) continue;
    const v = task[k];
    if (typeof v !== 'string' || len(v) < 1 || len(v) > max || !/\S/u.test(v) || /```/u.test(v)) errs.push(`${path}.${k} が決まりに合わない`);
  }
  if (has(task, 'title') && typeof task.title === 'string' && /\n/u.test(task.title)) errs.push(`${path}.title に改行がある`);
  if (has(task, 'tools')) {
    const tools = task.tools;
    if (!Array.isArray(tools)) errs.push(`${path}.tools が配列でない`);
    else {
      if (tools.length > 5) errs.push(`${path}.tools が多すぎる`);
      const seen = new Set();
      for (const tool of tools) {
        if (typeof tool !== 'string' || len(tool) < 1 || len(tool) > 40 || !/\S/u.test(tool)) errs.push(`${path}.tools の項目が決まりに合わない`);
        const key = JSON.stringify(tool);
        if (seen.has(key)) errs.push(`${path}.tools に重複`);
        seen.add(key);
      }
    }
  }
  // mode が external（なければ if は空で真）なら tools は 1 件以上。そうでなければ tools は 0 件で、本文に URL がない。
  const external = !has(task, 'mode') || task.mode === 'external';
  if (external) {
    if (has(task, 'tools') && !(Array.isArray(task.tools) && task.tools.length >= 1)) errs.push(`${path} は external なのに tools がない`);
  } else {
    if (has(task, 'tools') && !(Array.isArray(task.tools) && task.tools.length === 0)) errs.push(`${path} は in_app なのに tools がある`);
    for (const k of ['title', 'why', 'how', 'goal']) {
      if (!has(task, k)) continue;
      if (typeof task[k] !== 'string' || /https?:\/\//u.test(task[k])) errs.push(`${path}.${k} に URL がある`);
    }
  }
  // id と area、level の対応（スキーマの allOf の if/then。area がなければすべての then が効く）
  for (const a of AREAS) {
    if ((!has(task, 'area') || task.area === a) && has(task, 'id') && !(typeof task.id === 'string' && task.id.startsWith(`${a}-`))) errs.push(`${path}.id が領域 ${a} と合わない`);
  }
  for (const l of LEVELS) {
    if ((!has(task, 'level') || task.level === l) && has(task, 'id') && !(typeof task.id === 'string' && new RegExp(`-${l}-[0-9]{3}$`, 'u').test(task.id))) errs.push(`${path}.id が段階 ${l} と合わない`);
  }
}

/**
 * tasks.schema.json と同じ合否。違反の説明の配列を返す（空なら通る）。
 * @param {unknown} doc
 * @returns {string[]}
 */
export function validateTasks(doc) {
  const errs = [];
  if (!isObject(doc)) return ['オブジェクトでない'];
  for (const k of Object.keys(doc)) if (k !== 'formatVersion' && k !== 'tasks') errs.push(`知らない項目 ${k}`);
  if (!has(doc, 'formatVersion')) errs.push('formatVersion がない');
  else if (doc.formatVersion !== 1) errs.push('formatVersion が 1 でない');
  if (!has(doc, 'tasks')) errs.push('tasks がない');
  else if (!Array.isArray(doc.tasks)) errs.push('tasks が配列でない');
  else {
    if (doc.tasks.length < 1 || doc.tasks.length > 1000) errs.push('tasks の件数が 1〜1000 でない');
    doc.tasks.forEach((task, i) => checkTask(task, `tasks[${i}]`, errs));
  }
  return errs;
}
