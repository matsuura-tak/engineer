// contracts/schemas/*.schema.json を ajv（2020-12、strict）で検査する（contracts/test-hooks.md の W-6、W-7、W-9）。
import { readFileSync } from 'node:fs';
import path from 'node:path';
import Ajv2020Module from 'ajv/dist/2020.js';
import { SCHEMAS_DIR } from './paths.mjs';

const Ajv2020 = Ajv2020Module.default ?? Ajv2020Module;
const ajv = new Ajv2020({ strict: true, allErrors: true });
const cache = new Map();

export function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** @param {'tasks'|'data'|'strings'} name */
export function validator(name) {
  if (!cache.has(name)) {
    cache.set(name, ajv.compile(readJson(path.join(SCHEMAS_DIR, `${name}.schema.json`))));
  }
  return cache.get(name);
}

/** 通らなければ理由つきで例外（テストのコードの誤りを早く見つける）。 */
export function assertValid(name, doc, label = name) {
  const v = validator(name);
  if (!v(doc)) {
    throw new Error(`${label} が contracts/schemas/${name}.schema.json に通らない：${ajv.errorsText(v.errors, { separator: '\n' })}`);
  }
  return doc;
}

/** 合否だけ返す（Then で使う）。 */
export function validate(name, doc) {
  const v = validator(name);
  const ok = v(doc);
  return { ok, errors: ok ? '' : ajv.errorsText(v.errors, { separator: '\n' }) };
}
