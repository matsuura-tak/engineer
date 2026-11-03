// 日付（contracts/data.md の 4 と 6）。端末の日付の YYYY-MM-DD で、toISOString（UTC）を使わない。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { ymd, ymdShift } from '../../public/js/dates.js';

test('ymd は端末の暦の日付を 0 埋めで返す', () => {
  assert.equal(ymd(new Date(2026, 0, 5, 12)), '2026-01-05');
  assert.equal(ymd(new Date(2026, 10, 3, 0, 0, 0)), '2026-11-03');
  assert.equal(ymd(new Date(2026, 11, 31, 23, 59, 59)), '2026-12-31');
});

test('ymdShift は月末、年末、うるう日をまたぐ', () => {
  assert.equal(ymdShift(new Date(2026, 10, 3), -6), '2026-10-28');
  assert.equal(ymdShift(new Date(2026, 11, 31), 1), '2027-01-01');
  assert.equal(ymdShift(new Date(2028, 1, 28), 1), '2028-02-29');
  assert.equal(ymdShift(new Date(2026, 2, 1), -1), '2026-02-28');
});

test('東京の 0 時台（UTC では前日）でも端末の日付になる（toISOString の誤りを防ぐ）', () => {
  // 子のプロセスを TZ=Asia/Tokyo で動かす（このプロセスの TZ は変えない）。
  const code = "import('./public/js/dates.js').then(m => process.stdout.write(m.ymd(new Date('2026-11-02T15:30:00Z'))))";
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], {
    cwd: new URL('../..', import.meta.url),
    env: { ...process.env, TZ: 'Asia/Tokyo' },
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, '2026-11-03');
});

test('夏時間のある地域で、切り替えの日をまたいでも 1 日ずつ進む', () => {
  const code =
    "import('./public/js/dates.js').then(m => { const out = []; for (let i = 0; i < 3; i++) out.push(m.ymdShift(new Date(2026, 2, 7), i)); process.stdout.write(out.join(',')); })";
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], {
    cwd: new URL('../..', import.meta.url),
    env: { ...process.env, TZ: 'America/New_York' },
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, '2026-03-07,2026-03-08,2026-03-09');
});
