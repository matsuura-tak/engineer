// seed（データの投入。contracts/test-hooks.md の W-7）と、保存の失敗・拒否の注入（W-9）、偽装（W-16）。
// すべて Playwright の側（addInitScript）から差し込む。アプリの側につなぎ口はない。
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { SEEDS_DIR, CONTRACT_FIXTURES_DIR, STORAGE_KEY, SEEDED_MARK } from './paths.mjs';
import { assertValid } from './schema.mjs';

/** 自分のフォルダ（seeds/）の seed を読み、ajv に通してから返す。 */
export function loadSeed(name) {
  const doc = JSON.parse(readFileSync(path.join(SEEDS_DIR, name), 'utf8'));
  return assertValid('data', doc, `seeds/${name}`);
}

/** contracts/fixtures/ の見本を読み、ajv に通してから返す（seed- と valid- だけに使う）。 */
export function loadContractFixture(rel) {
  const doc = JSON.parse(readFileSync(path.join(CONTRACT_FIXTURES_DIR, rel), 'utf8'));
  return assertValid('data', doc, `contracts/fixtures/${rel}`);
}

export function contractFixturePath(rel) {
  return path.join(CONTRACT_FIXTURES_DIR, rel);
}

/**
 * localStorage のキー kyounoitte:data に seed を書く。addInitScript は読み込みのたびに動くので、印のキーで 1 回だけにする（W-7）。
 * W-9 の失敗の注入より先に登録すること。
 */
export async function injectSeed(context, seed) {
  assertValid('data', seed, 'seed');
  await context.addInitScript(
    ({ key, mark, json }) => {
      if (!localStorage.getItem(mark)) {
        localStorage.setItem(key, json);
        localStorage.setItem(mark, '1');
      }
    },
    { key: STORAGE_KEY, mark: SEEDED_MARK, json: JSON.stringify(seed) },
  );
}

/**
 * 保存の失敗の注入（AC-11、W-9）：Storage.prototype.setItem を包み、テストが印を立てた後の次の 1 回だけ QuotaExceededError を投げる。
 * 印はテストの側の globalThis に置く（アプリは読まない）。armStorageFailure(page) で立てる。
 */
export const STORAGE_FAILURE_FLAG = '__acceptanceFailNextSetItem';

export async function injectStorageFailure(context) {
  await context.addInitScript((flag) => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (globalThis[flag]) {
        globalThis[flag] = false;
        throw new DOMException('injected', 'QuotaExceededError');
      }
      return original.call(this, k, v);
    };
  }, STORAGE_FAILURE_FLAG);
}

export async function armStorageFailure(page) {
  await page.evaluate((flag) => {
    globalThis[flag] = true;
  }, STORAGE_FAILURE_FLAG);
}

/**
 * 永続化の拒否の注入（AC-13、W-9）。呼ばれた回数をテスト側の変数（globalThis。アプリは読まない）に数え、
 * 拒否の注入が実際に効いた（アプリが persist() を 1 回呼んだ）ことを確かめられるようにする。回数は読み込みごと（ページの globalThis）。
 */
export const PERSIST_CALLS_FLAG = '__acceptancePersistCalls';

export async function injectPersistDenied(context) {
  await context.addInitScript((flag) => {
    if (typeof StorageManager !== 'undefined') {
      StorageManager.prototype.persist = async function () {
        globalThis[flag] = (globalThis[flag] ?? 0) + 1;
        return false;
      };
    }
  }, PERSIST_CALLS_FLAG);
}

export async function readPersistCalls(page) {
  return page.evaluate((flag) => globalThis[flag] ?? 0, PERSIST_CALLS_FLAG);
}

/** navigator.standalone の偽装（AC-21、AC-22、W-16）。 */
export async function injectStandalone(context, value) {
  await context.addInitScript((v) => {
    Object.defineProperty(Navigator.prototype, 'standalone', { get: () => v, configurable: true });
  }, value);
}

/** iPadOS の Safari の偽装（Mac の UA と maxTouchPoints > 1。W-16）。 */
export async function injectMaxTouchPoints(context, value) {
  await context.addInitScript((v) => {
    Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => v, configurable: true });
  }, value);
}

// ---- seed を組み立てる（AC-10、AC-14、AC-30 は本番の課題集から「出し終えた」履歴を作る：PRD 11 AC-10 の確かめ方、W-4） ----

/** 'YYYY-MM-DD' に n 日足す（文字列の日付だけで計算。UTC で安全）。 */
export function addDays(ymd, n) {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * 履歴の行を 1 日 1 行で並べた seed を作る。
 * @param {{ area: string, level: string, years?: string, firstOpenDate: string, levels?: object,
 *           rows: Array<{ taskId: string, report: string, level?: string, mode?: string, answer?: string, helpful?: string }> }} o
 */
export function makeSeed(o) {
  const history = o.rows.map((r, i) => {
    const row = {
      date: addDays(o.firstOpenDate, i),
      taskId: r.taskId,
      area: r.taskId.split('-')[0],
      level: r.level ?? r.taskId.split('-')[1],
      mode: r.mode ?? 'in_app',
      report: r.report,
      answer: r.answer ?? '',
    };
    if (r.report === 'done') row.helpful = r.helpful ?? 'unanswered';
    return row;
  });
  const seed = {
    formatVersion: 1,
    app: 'kyounoitte',
    firstOpenDate: o.firstOpenDate,
    diagnosis: { area: o.area, level: o.level, years: o.years ?? '1to3', completedOn: o.firstOpenDate },
    levels: o.levels ?? { [o.area]: o.level },
    history,
  };
  return assertValid('data', seed, 'makeSeed');
}

/** 課題集から、領域 × 段階の組の課題を ID の順に返す。 */
export function tasksOf(tasks, area, level) {
  return tasks.tasks.filter((t) => t.area === area && t.level === level).sort((a, b) => (a.id < b.id ? -1 : 1));
}

/**
 * 組の課題を全部（または mode で絞って）出し終えた seed。最後の行の翌日が「今日」になるように firstOpenDate から並べる。
 * reportFor(index, task, total) で各行の申告を決める（既定は done）。
 */
export function exhaustedSeed(tasks, { area, level, firstOpenDate, only, reportFor }) {
  const list = tasksOf(tasks, area, level).filter((t) => (only ? t.mode === only : true));
  if (list.length === 0) throw new Error(`課題集に ${area}/${level}${only ? `/${only}` : ''} の課題がない`);
  const rows = list.map((t, i) => {
    const report = reportFor ? reportFor(i, t, list.length) : 'done';
    return { taskId: t.id, report, mode: t.mode, helpful: report === 'done' ? 'helpful' : undefined };
  });
  const seed = makeSeed({ area, level, firstOpenDate, rows });
  return { seed, list, lastDate: addDays(firstOpenDate, list.length - 1), nextDate: addDays(firstOpenDate, list.length) };
}
