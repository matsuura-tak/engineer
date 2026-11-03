// 保存先（contracts/data.md の 1、2、7）。localStorage のキー kyounoitte:data だけを読み書き・削除する。
import { readDocument } from './validate.js';

export const KEY = 'kyounoitte:data';

export function openStore(getStorage) {
  let storage;
  let raw;
  try {
    storage = getStorage();
    raw = storage.getItem(KEY);
  } catch {
    return { kind: 'unavailable' };
  }
  if (raw === null) return { kind: 'ok', storage, data: null };
  const r = readDocument(raw);
  if (!r.ok) return { kind: 'unreadable', storage, raw };
  return { kind: 'ok', storage, data: r.data };
}

export function save(storage, data) {
  try {
    storage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function removeAll(storage) {
  try {
    storage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}
