// 契約の検査（ADR 0004、設計メモ 4）。node の組み込みと ajv だけを使う。
// 使い方：ajv を入れたフォルダで実行する（例：cd backend && node ../contracts/tools/check-schemas.mjs）。
// 1. contracts/schemas/*.schema.json を JSON Schema 2020-12 のメタスキーマで検査し、strict で組み立てる。
// 2. contracts/fixtures/ の見本を検査する。valid-* と seed-* は通り、invalid-* は落ちるのが正しい。
// 3. data の valid-* と seed-* は、スキーマの外の決まり（contracts/data.md の 8「書き手が守る決まり」）も満たす。
// 4. strings の valid-* は語の検査（contracts/strings.md の 7.1、7.2。AC-35、AC-42、AC-45）に通り、valid-ja と valid-en は差し込みの名前がキーごとにそろう。
// 5. tasks の valid-* は ID が重ならず、highlight と選択肢の決まり（strings.md の 5）、文の調子（7.3。AC-43）、初級（7.4。AC-34）を満たし、合わせて正解の位置が偏らない（AC-29）。
// 6. invalid-* はスキーマで落ちるか、スキーマに通ってスキーマの外の決まり（3〜5）で落ちる。どちらで落ちたかを出す。
// 期待と違う結果が 1 件でもあれば終了コード 1。
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(join(process.cwd(), 'noop.js'));
const Ajv2020 = require('ajv/dist/2020').default;
const ajvVersion = require('ajv/package.json').version;

const contracts = dirname(dirname(fileURLToPath(import.meta.url)));
const schemaDir = join(contracts, 'schemas');
const fixtureDir = join(contracts, 'fixtures');
const ajv = new Ajv2020({ strict: true, allErrors: true });
let failures = 0;
const say = (ok, msg) => { if (!ok) failures++; console.log(`${ok ? 'OK ' : 'NG '} ${msg}`); };

console.log(`ajv ${ajvVersion}（Ajv2020、strict）`);
const validators = {};
for (const f of readdirSync(schemaDir).filter((f) => f.endsWith('.schema.json')).sort()) {
  const schema = JSON.parse(readFileSync(join(schemaDir, f), 'utf8'));
  const metaOk = ajv.validateSchema(schema);
  say(metaOk === true, `メタスキーマ ${f}${metaOk ? '' : ' ' + ajv.errorsText(ajv.errors)}`);
  try { validators[f.replace('.schema.json', '')] = ajv.compile(schema); say(true, `組み立て ${f}`); }
  catch (e) { say(false, `組み立て ${f} ${e.message}`); }
}

const kindOf = (rel) => ({ tasks: 'tasks', data: 'data', seeds: 'data', strings: 'strings' })[rel.split('/')[0]];
const walk = (d) => readdirSync(d).flatMap((n) => statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]);

function semantic(doc) {
  const errs = [];
  const h = doc.history;
  const nashi = !doc.diagnosis.completedOn && h.length === 0 && !doc.diagnosis.area; // data.md の 3 の「なし」
  if (nashi && 'firstOpenDate' in doc) errs.push('「なし」なのに firstOpenDate がある（1 問目の確定の前には書かない）');
  // 日付の古い順。同じ日付の行は出した順に何行でも並ぶ（data.md の 8。AC-33 の同じ日の「次の一手に進む」）
  for (let i = 1; i < h.length; i++) if (h[i].date < h[i - 1].date) errs.push(`history[${i}] の日付が前の行より古い`);
  for (const r of h) if (r.date < doc.firstOpenDate) errs.push(`${r.date} が firstOpenDate より前`);
  if (doc.current) {
    if (h.length && doc.current.date < h[h.length - 1].date) errs.push('current の日付が history の最後の行より古い');
    if (doc.current.date < doc.firstOpenDate) errs.push('current の日付が firstOpenDate より前');
  }
  const ids = [...h.map((r) => r.taskId), ...(doc.current ? [doc.current.taskId] : [])];
  if (new Set(ids).size !== ids.length) errs.push('同じ taskId が 2 回出ている');
  if (doc.diagnosis.completedOn && !doc.levels[doc.diagnosis.area]) errs.push('診断済みなのに levels に目標の領域がない');
  // 段階の規則の数え始め（data.md の 5 と 8。2026-11-08）：history の行数以下で、levels にある領域だけ
  for (const [a, i] of Object.entries(doc.levelStart ?? {})) {
    if (i > h.length) errs.push(`levelStart.${a}（${i}）が history の行数（${h.length}）より大きい`);
    if (!doc.levels[a]) errs.push(`levelStart.${a} があるのに levels.${a} がない`);
  }
  return errs;
}

// 語の検査（contracts/strings.md の 7）。語を変えるときは strings.md と一緒に直す。
// 7.1 文言ファイルの全キー（AC-35、AC-42、D-65）。日本語の語と en の語は ja.json と en.json の両方に当てる。XP の部分一致だけは ja.json に当てる（en の explanation、expect に当たるため）
const WORDS_JA = [/連続/, /途切れ/, /逃した/, /[0-9０-９]点/, /点数/, /得点/, /満点/, /ランク/, /レベルアップ/];
const WORDS_JA_ONLY = [/XP/i];
const WORDS_EN = /\b(streak|missed|points?|score|rank|xp|level up)\b/i;
// 7.2 guide.* と task.level.adjusted.*（AC-45、D-55、D-65）。両方のファイルに当てる。guide.* の 40 字は strings.schema.json の maxLength
const GUIDE_KEY = /^(guide\.|task\.level\.adjusted\.)/;
const GUIDE_JA = [/残念/, /ダメ/, /失敗/, /間違い/, /不正解/, /サボ/, /まだやって/];
const GUIDE_EN = /\b(fail|failed|failure|wrong|stupid|lazy)\b/i;
// 7.3 課題集の文の調子（AC-43）。intro、questions[].text、choices[].explain、insight
const AC43_WORDS = ['書き出し', '書き出す', 'メモし', '書いてみ', '書きまし', 'ノートに'];
const AC43_POLITE = ['です', 'ます', 'でしょう', 'ましょう', 'ください'];
const AC43_MAX = 60;
// 7.4 初級（AC-34）。intro、questions[].text、choices[].explain、insight
const AC34_WORDS = ['自分のAPI', '自分のリポジトリ', '自分のサービス', '自分のチーム', '実務で', '業務で'];
const noSpace = (s) => s.replace(/[ \u3000]/g, '');
const cp = (s) => [...s].length;
const sentences = (s) => s.split(/(?<=[。！？])/).filter((x) => x.length > 0);
const names = (s) => [...new Set([...s.matchAll(/\{([A-Za-z]+)[,}]/g)].map((m) => m[1]))].sort().join(',');
const langOf = (name) => (/(^|-)en(-|\.json$)/.test(name) ? 'en' : 'ja');

function stringsSemantic(doc, name) {
  const errs = [];
  const ja = langOf(name) === 'ja';
  for (const [k, v] of Object.entries(doc)) {
    for (const w of [...WORDS_JA, ...(ja ? WORDS_JA_ONLY : [])]) if (w.test(v)) errs.push(`${k} に「${v.match(w)[0]}」`);
    if (WORDS_EN.test(v)) errs.push(`${k} に ${v.match(WORDS_EN)[0]}`);
    if (GUIDE_KEY.test(k)) {
      for (const w of GUIDE_JA) if (w.test(v)) errs.push(`${k} に「${v.match(w)[0]}」（AC-45）`);
      if (GUIDE_EN.test(v)) errs.push(`${k} に ${v.match(GUIDE_EN)[0]}（AC-45）`);
    }
  }
  return errs;
}

// 1 件の本文の中で、AC-43 と AC-34 を当てる項目（場所の名前、文字列）
const bodyParts = (t) => [['intro', t.intro], ...t.questions.flatMap((q, i) => [[`questions[${i}].text`, q.text], ...q.choices.map((c, j) => [`questions[${i}].choices[${j}].explain`, c.explain])]), ['insight', t.insight]];
const figures = (t) => [['figure', t.figure], ...t.questions.flatMap((q, i) => (q.figure ? [[`questions[${i}].figure`, q.figure]] : []))];

function tasksSemantic(doc) {
  const errs = [];
  const ids = doc.tasks.map((t) => t.id);
  if (new Set(ids).size !== ids.length) errs.push('ID が重なっている');
  for (const t of doc.tasks) {
    for (const [where, f] of figures(t)) if ('highlight' in f && f.highlight >= f.labels.length) errs.push(`${t.id} の ${where}.highlight が labels の数以上`);
    t.questions.forEach((q, i) => {
      if (new Set(q.choices.map((c) => c.text)).size !== q.choices.length) errs.push(`${t.id} の questions[${i}] の選択肢の text が重なっている`);
      if (new Set(q.choices.map((c) => c.explain)).size !== q.choices.length) errs.push(`${t.id} の questions[${i}] の explain が重なっている`);
    });
    for (const [where, s] of bodyParts(t)) {
      for (const x of sentences(s)) if (cp(x) > AC43_MAX) errs.push(`${t.id} の ${where} に ${cp(x)} 字の文（AC-43）`);
      for (const w of AC43_WORDS) if (s.includes(w)) errs.push(`${t.id} の ${where} に「${w}」（AC-43）`);
      if (s.includes('しなさい')) errs.push(`${t.id} の ${where} に「しなさい」（AC-43）`);
      if (/せよ(?=[。！？]|$)/.test(s)) errs.push(`${t.id} の ${where} の文末に「せよ」（AC-43）`);
    }
    for (const [where, s] of [['intro', t.intro], ...t.questions.map((q, i) => [`questions[${i}].text`, q.text])]) {
      if (!AC43_POLITE.some((w) => s.includes(w))) errs.push(`${t.id} の ${where} に です・ます がない（AC-43）`);
    }
    if (t.level === 'beginner') {
      if (t.minutes > 10) errs.push(`${t.id} の所要時間が 10 分を超える（AC-34）`);
      for (const [where, s] of bodyParts(t)) for (const w of AC34_WORDS) if (noSpace(s).includes(w)) errs.push(`${t.id} の ${where} に「${w}」（AC-34）`);
    }
  }
  return errs;
}

const semanticOf = { data: semantic, strings: stringsSemantic, tasks: tasksSemantic };
const validStrings = {};
const validTasks = [];

let n = 0;
for (const file of walk(fixtureDir).sort()) {
  const rel = relative(fixtureDir, file);
  const kind = kindOf(rel);
  const name = basename(file);
  const expectValid = name.startsWith('valid-') || name.startsWith('seed-');
  if (!kind || !(expectValid || name.startsWith('invalid-'))) { say(false, `${rel} 名前の決まり（valid- / invalid- / seed-）に合わない`); continue; }
  n++;
  let doc, parseErr = null;
  try { doc = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { parseErr = e.message; }
  if (!validators[kind]) { say(false, `${rel} スキーマ ${kind} を組み立てられなかった`); continue; }
  const valid = parseErr === null && validators[kind](doc);
  const why = parseErr ? `JSON.parse の失敗` : valid ? '' : ajv.errorsText(validators[kind].errors, { separator: ' / ' }).slice(0, 160);
  if (expectValid) {
    const extra = valid ? semanticOf[kind](doc, name) : [];
    if (valid && kind === 'strings') validStrings[name] = doc;
    if (valid && kind === 'tasks') validTasks.push(...doc.tasks);
    say(valid && extra.length === 0, `${rel} 期待：通る → ${valid ? '通った' : '落ちた ' + why}${extra.length ? ' スキーマの外の決まり：' + extra.join('、') : ''}`);
  } else {
    // invalid-* はスキーマで落ちるか、スキーマに通ってスキーマの外の決まりで落ちる（どちらで落ちたかを出す）
    const extra = valid ? semanticOf[kind](doc, name) : [];
    say(!valid || extra.length > 0, `${rel} 期待：落ちる → ${!valid ? '落ちた（' + why + '）' : extra.length ? '落ちた（スキーマの外の決まり：' + extra.join('、') + '）' : '通ってしまった'}`);
  }
}
// valid-ja と valid-en：キーごとに差し込みの名前が同じ（片方だけに {name} がある、名前が違う、を見つける）
const ja = validStrings['valid-ja.json'], en = validStrings['valid-en.json'];
if (ja && en) {
  const diff = Object.keys(ja).filter((k) => names(ja[k]) !== names(en[k] ?? ''));
  say(diff.length === 0, `strings/valid-ja.json と valid-en.json の差し込みの名前${diff.length ? 'が違うキー：' + diff.join('、') : 'がすべてのキーでそろう（差し込みのあるキー ' + Object.keys(ja).filter((k) => names(ja[k])).length + ' 個）'}`);
} else say(false, 'strings/valid-ja.json か valid-en.json がない');
// tasks の valid-* を合わせた正解の位置の偏り（AC-29：位置ごとに全体の 20% 以上 50% 以下。受け入れテストは本番の 6 ファイルを合わせて数える）
{
  const qs = validTasks.flatMap((t) => t.questions);
  const counts = [0, 1, 2].map((a) => qs.filter((q) => q.answer === a).length);
  const ok = qs.length > 0 && counts.every((c) => c >= qs.length * 0.2 && c <= qs.length * 0.5);
  say(ok, `tasks の valid-* の正解の位置（${qs.length} 問）：0 が ${counts[0]}、1 が ${counts[1]}、2 が ${counts[2]}（20% 以上 50% 以下）`);
}
console.log(`見本 ${n} 件、期待と違う結果 ${failures} 件`);
process.exit(failures ? 1 : 0);
