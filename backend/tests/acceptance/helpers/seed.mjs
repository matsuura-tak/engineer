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
 * 永続化の拒否の注入（AC-13、W-9、data.md の 11）：`persist()` と `persisted()` の両方を false にする。
 * S8 の注意 `settings.storage.notPersisted` は S8 を描くたびに `persisted()` で決まる（design D-31）ので、`persist()` だけでは
 * エンジンの既定の `persisted()` の値で結果が変わる。
 * `persist()` が呼ばれた回数はテスト側の変数（globalThis。アプリは読まない）に数え、拒否の注入が実際に効いたこと
 * （初回の診断を終えた読み込みでちょうど 1 回、同じ日の再読み込みと翌日の S3 では 0 回）を確かめられるようにする。回数は読み込みごと（ページの globalThis）。
 */
export const PERSIST_CALLS_FLAG = '__acceptancePersistCalls';

export async function injectPersistDenied(context) {
  await context.addInitScript((flag) => {
    if (typeof StorageManager !== 'undefined') {
      StorageManager.prototype.persist = async function () {
        globalThis[flag] = (globalThis[flag] ?? 0) + 1;
        return false;
      };
      StorageManager.prototype.persisted = async () => false;
    }
  }, PERSIST_CALLS_FLAG);
}

export async function readPersistCalls(page) {
  return page.evaluate((flag) => globalThis[flag] ?? 0, PERSIST_CALLS_FLAG);
}

/**
 * 保存データ（localStorage のキー `kyounoitte:data`。data.md の 1）を `getItem` 1 回で読み、JSON に通し、data.schema.json に通してから返す。なければ null。
 * 書き出しに含まれない `device` の印（`persistRequested`。W-9「保存データの印の読み方」）を見るためだけに使う。setItem も removeItem もしない。
 * スキーマに通らなければ例外（形の崩れも見つける。W-9「読んだ値は contracts/schemas/data.schema.json に ajv で通してよい」）。
 */
export async function readStoredData(page) {
  const raw = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  return raw === null ? null : assertValid('data', JSON.parse(raw), `localStorage['${STORAGE_KEY}']`);
}

/**
 * S8 の待つ上限の確かめ（data.md の 11「待つ上限は 1,000 ms」、W-9「S8 の待つ上限を確かめるときは…」、design D-31）：
 * `StorageManager.prototype.persisted` を、delayMs が null なら返らない約束、数値なら setTimeout で delayMs 遅らせて value を返す約束にする。
 * `persist()` は触らない（回数を数えるテストは AC-13 の injectPersistDenied）。
 * 約束が決まった回数はテスト側の変数（globalThis。アプリは読まない）に数え、「答えが返った後」を sleep ではなく状態の変化として待てるようにする。
 * W-3 の setFixedTime の下でもタイマーは動く。
 */
export const PERSISTED_SETTLED_FLAG = '__acceptancePersistedSettled';

export async function injectPersistedStub(context, { delayMs, value = false }) {
  await context.addInitScript(
    ({ flag, delayMs, value }) => {
      if (typeof StorageManager !== 'undefined') {
        StorageManager.prototype.persisted = function () {
          return new Promise((resolve) => {
            if (delayMs === null) return;
            setTimeout(() => {
              globalThis[flag] = (globalThis[flag] ?? 0) + 1;
              resolve(value);
            }, delayMs);
          });
        };
      }
    },
    { flag: PERSISTED_SETTLED_FLAG, delayMs, value },
  );
}

export async function readPersistedSettled(page) {
  return page.evaluate((flag) => globalThis[flag] ?? 0, PERSISTED_SETTLED_FLAG);
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

// ---- r8 後半で足した seed の組み立て（test-hooks.md W-7「AC-35 の seed」「design の 5.1 #33」、data.md の 5「S7 の変種と補足の 1 文」） ----

/** 領域 × 段階の組を固定の順に並べたもの（他の組の行を使うときの順。目標の組は呼び出し側が除く）。 */
export const AREAS = ['backend', 'frontend', 'database', 'infra', 'testing', 'git'];
export const LEVELS = ['beginner', 'intermediate', 'advanced'];

/**
 * 完了の行を n 行持つ seed（AC-35 の 10、29、99 件。W-7 の決まり）：
 *   - 1 つの ID は 1 回だけ。目標の組（area / level）からは最大 maxFromTarget 件（既定 13。未出を 1 件以上残す）を新しい方に置き、
 *     残りは他の組の ID を古い方に置く（組の順は AREAS × LEVELS で目標の組を除く）。
 *   - 他の領域の行を入れた領域は、その領域の `levels` に最後の行の段階を入れる。
 *   - 日付は古い順に 1 日 1 行（firstOpenDate から）。時刻は最後の行の翌日（nextDate）に固定して開く。
 * 戻り値：{ seed, lastDate, nextDate, targetIds（目標の組で使った ID）, nextId（開いたときに出るはずの目標の組の最小の未出 ID） }
 */
export function completedSeed(tasks, { n, area, level, firstOpenDate, maxFromTarget = 13 }) {
  const target = tasksOf(tasks, area, level);
  if (target.length <= maxFromTarget) throw new Error(`目標の組 ${area}/${level} が ${target.length} 件で、未出を残せない`);
  const fromTarget = Math.min(n, maxFromTarget);
  const fromOthers = n - fromTarget;
  const others = [];
  for (const a of AREAS) {
    for (const l of LEVELS) {
      if (a === area && l === level) continue;
      for (const t of tasksOf(tasks, a, l)) others.push(t);
    }
  }
  if (others.length < fromOthers) throw new Error(`他の組の課題が ${others.length} 件しかなく、${fromOthers} 件を置けない`);
  const otherRows = others.slice(0, fromOthers);
  const targetRows = target.slice(0, fromTarget);
  const rows = [...otherRows, ...targetRows].map((t) => ({ taskId: t.id, report: 'done', mode: t.mode, helpful: 'helpful' }));
  const levels = { [area]: level };
  for (const t of otherRows) levels[t.area] = t.level; // 最後の行の段階が残る（古い順に上書き）
  const seed = makeSeed({ area, level, firstOpenDate, rows, levels });
  seed.device = { persistRequested: true };
  assertValid('data', seed, 'completedSeed');
  return {
    seed,
    lastDate: addDays(firstOpenDate, rows.length - 1),
    nextDate: addDays(firstOpenDate, rows.length),
    targetIds: targetRows.map((t) => t.id),
    nextId: target[fromTarget].id,
  };
}

/**
 * design 5.1 #33（S7 levelDone に `task.exhausted.seenNext`）の seed（W-7 の作り方）：
 *   diagnosis は area / intermediate、levels[area] は beginner、current なし。history の古い順に、中級の最初の 2 件を `too_hard`（level intermediate）で 2 日、
 *   続けて初級の全件を `done`（level beginner）。時刻は最後の行の翌日に固定して開くと、初級を出し終えているので S7、levels が beginner なので levelDone、
 *   中級に未出が残り、history に中級の行があるので seenNext が 1 つ（data.md の 5「S7 の変種と補足の 1 文」）。
 */
export function seenNextSeed(tasks, { area, firstOpenDate }) {
  const mid = tasksOf(tasks, area, 'intermediate');
  const low = tasksOf(tasks, area, 'beginner');
  if (mid.length < 3 || low.length < 1) throw new Error(`課題集に ${area} の中級 3 件以上と初級 1 件以上がない`);
  const rows = [
    ...mid.slice(0, 2).map((t) => ({ taskId: t.id, report: 'too_hard', mode: t.mode, level: 'intermediate' })),
    ...low.map((t) => ({ taskId: t.id, report: 'done', mode: t.mode, level: 'beginner', helpful: 'helpful' })),
  ];
  const seed = makeSeed({ area, level: 'intermediate', firstOpenDate, rows, levels: { [area]: 'beginner' } });
  return { seed, nextDate: addDays(firstOpenDate, rows.length), midUnissued: mid.length - 2 };
}

/**
 * design 5.1 #53（S7 levelDone に `task.exhausted.nextDone`）の seed：初級と中級の両方を出し終え、段階が初級。
 *   history の古い順に中級の全件（level intermediate、done）、続けて初級の全件（level beginner、done）。levels[area] は beginner。
 */
export function nextDoneSeed(tasks, { area, firstOpenDate }) {
  const mid = tasksOf(tasks, area, 'intermediate');
  const low = tasksOf(tasks, area, 'beginner');
  if (mid.length < 1 || low.length < 1) throw new Error(`課題集に ${area} の中級と初級がない`);
  const rows = [
    ...mid.map((t) => ({ taskId: t.id, report: 'done', mode: t.mode, level: 'intermediate', helpful: 'helpful' })),
    ...low.map((t) => ({ taskId: t.id, report: 'done', mode: t.mode, level: 'beginner', helpful: 'helpful' })),
  ];
  const seed = makeSeed({ area, level: 'intermediate', firstOpenDate, rows, levels: { [area]: 'beginner' } });
  return { seed, nextDate: addDays(firstOpenDate, rows.length) };
}

/**
 * design 5.1 #54（S6 で `task.skipped.levelChanged` と `task.next.note.last` が重なる）の seed：初級を出し終えて中級に進んだ形。
 *   history は初級の全件（level beginner、done）、levels[area] は intermediate、diagnosis は area / intermediate。時刻は最後の行の翌日に固定して開くと中級の 1 件目が出る。
 */
export function beginnerDoneAtIntermediateSeed(tasks, { area, firstOpenDate }) {
  const low = tasksOf(tasks, area, 'beginner');
  const mid = tasksOf(tasks, area, 'intermediate');
  if (low.length < 1 || mid.length < 3) throw new Error(`課題集に ${area} の初級 1 件以上と中級 3 件以上がない`);
  const rows = low.map((t) => ({ taskId: t.id, report: 'done', mode: t.mode, level: 'beginner', helpful: 'helpful' }));
  const seed = makeSeed({ area, level: 'intermediate', firstOpenDate, rows, levels: { [area]: 'intermediate' } });
  return { seed, nextDate: addDays(firstOpenDate, rows.length), mid };
}
