// 要素を作る小さな道具。文字は textContent（createTextNode）でだけ入れる（contracts/strings.md の 4、ADR 0005）。

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  if (props.testid) el.setAttribute('data-testid', props.testid);
  if (props.cls) el.className = props.cls;
  if (props.attrs) {
    for (const [k, v] of Object.entries(props.attrs)) {
      if (v === null || v === undefined || v === false) continue;
      el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  if (props.on) for (const [type, fn] of Object.entries(props.on)) el.addEventListener(type, fn);
  if (props.text !== undefined) el.textContent = props.text;
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.append(typeof c === 'string' ? document.createTextNode(c) : c);
  }
}

export function inline(text) {
  const out = [];
  let rest = text;
  for (;;) {
    const a = rest.indexOf('`');
    const b = a < 0 ? -1 : rest.indexOf('`', a + 1);
    if (a < 0 || b < 0) {
      if (rest) out.push(document.createTextNode(rest));
      break;
    }
    if (a > 0) out.push(document.createTextNode(rest.slice(0, a)));
    const code = document.createElement('code');
    code.textContent = rest.slice(a + 1, b);
    out.push(code);
    rest = rest.slice(b + 1);
  }
  return out;
}

export function paragraphs(text) {
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => h('p', {}, inline(line)));
}

export function link(testid, text, onClick, attrs = {}) {
  return h('a', { testid, cls: 'link', attrs: { href: './', ...attrs }, on: { click: onClick }, text });
}

export function button(testid, text, onClick, kind = 'secondary', attrs = {}) {
  return h('button', { testid, cls: `btn btn-${kind}`, attrs: { type: 'button', ...attrs }, on: onClick ? { click: onClick } : undefined, text });
}
