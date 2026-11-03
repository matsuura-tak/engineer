// 単体テストの共通の道具。ajv は backend/package.json の devDependencies（contracts/dependencies.md）。
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020Module from 'ajv/dist/2020.js';

export const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const REPO_DIR = path.dirname(BACKEND_DIR);
export const CONTRACTS_DIR = path.join(REPO_DIR, 'contracts');
export const FIXTURES_DIR = path.join(CONTRACTS_DIR, 'fixtures');

const Ajv2020 = Ajv2020Module.default ?? Ajv2020Module;

export function ajvValidator(kind) {
  const ajv = new Ajv2020({ strict: true, allErrors: true });
  const schema = JSON.parse(readFileSync(path.join(CONTRACTS_DIR, 'schemas', `${kind}.schema.json`), 'utf8'));
  return ajv.compile(schema);
}

export function walk(dir) {
  return readdirSync(dir)
    .sort()
    .flatMap((n) => (statSync(path.join(dir, n)).isDirectory() ? walk(path.join(dir, n)) : [path.join(dir, n)]));
}

export function readJsonFile(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** localStorage の代わり（Storage の getItem、setItem、removeItem だけ）。throwOn で例外を起こせる。 */
export function fakeStorage(initial = {}, { throwOn = [] } = {}) {
  const map = new Map(Object.entries(initial));
  const calls = [];
  const guard = (op) => {
    calls.push(op);
    if (throwOn.includes(op)) {
      const e = new Error('QuotaExceededError');
      e.name = op === 'setItem' ? 'QuotaExceededError' : 'SecurityError';
      throw e;
    }
  };
  return {
    map,
    calls,
    getItem(k) {
      guard('getItem');
      return map.has(k) ? map.get(k) : null;
    },
    setItem(k, v) {
      guard('setItem');
      map.set(k, String(v));
    },
    removeItem(k) {
      guard('removeItem');
      map.delete(k);
    },
  };
}
