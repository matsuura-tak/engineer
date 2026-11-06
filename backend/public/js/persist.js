// data.md の 11、design の D-23 と D-31。sm は navigator.storage。例外を外に出さず、結果は保存しない。
export const canRequestPersist = (sm) => Boolean(sm) && typeof sm.persist === 'function';
export const PERSISTED_WAIT_MS = 1000;

export function requestPersist(sm, onAnswered) {
  if (!canRequestPersist(sm)) return;
  try {
    Promise.resolve(sm.persist()).then(onAnswered, () => {});
  } catch {}
}

// persisted() が false のときだけ true。ない、例外、reject、上限までに返らないときは false
export function readNotPersisted(sm, { limitMs = PERSISTED_WAIT_MS, timers = globalThis } = {}) {
  let timer;
  const answer = (async () => {
    try {
      return (await sm.persisted()) === false;
    } catch {
      return false;
    }
  })();
  const limit = new Promise((resolve) => {
    timer = timers.setTimeout(() => resolve(false), limitMs);
  });
  return Promise.race([answer, limit]).then((v) => {
    timers.clearTimeout(timer);
    return v;
  });
}

// 待つ間に次の操作が始まったら（isCurrent が false）描かない
export function drawWhenPersistedKnown(sm, isCurrent, draw, opts) {
  return readNotPersisted(sm, opts).then((notPersisted) => {
    if (isCurrent()) draw(notPersisted);
  });
}
