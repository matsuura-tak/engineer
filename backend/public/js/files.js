// 書き出しと読み込み（contracts/data.md の 7）。外には送らない（Blob と a download、input type=file だけ）。
import { readDocument } from './validate.js';
import { classify } from './rules.js';

export const IMPORT_MAX_BYTES = 5_000_000;

export function download(filename, text, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readImport(file) {
  if (!file || file.size > IMPORT_MAX_BYTES) return { ok: false, reason: 'schema' };
  let text;
  try {
    text = await file.text();
  } catch {
    return { ok: false, reason: 'schema' };
  }
  const r = readDocument(text);
  if (!r.ok) return { ok: false, reason: r.reason };
  if (classify(r.data) === 'none') return { ok: false, reason: 'schema' };
  return { ok: true, data: r.data };
}
