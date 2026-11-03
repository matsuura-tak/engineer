// data.md の 11、design の D-23 と D-31。sm は navigator.storage。例外を外に出さず、結果は保存しない。
export const canRequestPersist = (sm) => Boolean(sm) && typeof sm.persist === 'function';

export function requestPersist(sm, onAnswered) {
  if (!canRequestPersist(sm)) return;
  try {
    Promise.resolve(sm.persist()).then(onAnswered, () => {});
  } catch {}
}

// persisted() が false のときだけ true。ない、例外、reject では false
export async function readNotPersisted(sm) {
  try {
    return (await sm.persisted()) === false;
  } catch {
    return false;
  }
}
