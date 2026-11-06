// 日付（contracts/data.md の 4 と 6）。「今日」は端末の日付の YYYY-MM-DD。

const pad = (n) => String(n).padStart(2, '0');

export function ymd(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function ymdShift(date, days) {
  return ymd(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
}
