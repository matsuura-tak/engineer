// 単体テスト用の小さな DOM（view-*.js が使う分だけ）。依存を足さずに、組んだ要素の形と順番を確かめる。
class Text {
  constructor(text) {
    this.nodeType = 3;
    this.data = String(text);
    this.parentNode = null;
  }
  get textContent() {
    return this.data;
  }
}

class Element {
  constructor(tag, ns) {
    this.nodeType = 1;
    this.tagName = tag;
    this.namespaceURI = ns;
    this.attrs = new Map();
    this.childNodes = [];
    this.parentNode = null;
    this.listeners = new Map();
    this.value = '';
    const self = this;
    this.classList = {
      add: (...c) => self.setAttribute('class', [...new Set([...self.classes(), ...c])].join(' ')),
      remove: (...c) => self.setAttribute('class', self.classes().filter((x) => !c.includes(x)).join(' ')),
      contains: (c) => self.classes().includes(c),
    };
  }
  classes() {
    return (this.attrs.get('class') ?? '').split(' ').filter(Boolean);
  }
  get className() {
    return this.attrs.get('class') ?? '';
  }
  set className(v) {
    this.setAttribute('class', v);
  }
  get id() {
    return this.attrs.get('id') ?? '';
  }
  set id(v) {
    this.setAttribute('id', v);
  }
  setAttribute(k, v) {
    this.attrs.set(k, String(v));
  }
  getAttribute(k) {
    return this.attrs.has(k) ? this.attrs.get(k) : null;
  }
  hasAttribute(k) {
    return this.attrs.has(k);
  }
  get children() {
    return this.childNodes.filter((n) => n.nodeType === 1);
  }
  get firstChild() {
    return this.childNodes[0] ?? null;
  }
  append(...nodes) {
    for (const n of nodes) {
      const node = typeof n === 'string' ? new Text(n) : n;
      if (node.parentNode) node.parentNode.childNodes = node.parentNode.childNodes.filter((c) => c !== node);
      node.parentNode = this;
      this.childNodes.push(node);
    }
  }
  replaceChildren(...nodes) {
    for (const c of this.childNodes) c.parentNode = null;
    this.childNodes = [];
    this.append(...nodes);
  }
  remove() {
    if (!this.parentNode) return;
    this.parentNode.childNodes = this.parentNode.childNodes.filter((c) => c !== this);
    this.parentNode = null;
  }
  get textContent() {
    return this.childNodes.map((c) => c.textContent).join('');
  }
  set textContent(v) {
    this.replaceChildren(new Text(v));
  }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }
  dispatch(type) {
    for (const fn of this.listeners.get(type) ?? []) fn({ type, target: this });
  }
  /** 文書順に、data-testid を持つ子孫（自分を含む）を返す */
  testids() {
    const out = [];
    const walk = (el) => {
      if (el.nodeType !== 1) return;
      if (el.attrs.has('data-testid')) out.push(el);
      el.childNodes.forEach(walk);
    };
    walk(this);
    return out;
  }
  byTestid(id) {
    return this.testids().filter((e) => e.getAttribute('data-testid') === id);
  }
  querySelector(sel) {
    const m = /^\[data-testid="(.+)"\]$/.exec(sel);
    if (!m) throw new Error(`fake-dom: ${sel}`);
    return this.byTestid(m[1])[0] ?? null;
  }
}

export const HTML_NS = 'http://www.w3.org/1999/xhtml';

export function installFakeDocument() {
  globalThis.document = {
    createElement: (tag) => new Element(tag, HTML_NS),
    createElementNS: (ns, tag) => new Element(tag, ns),
    createTextNode: (text) => new Text(text),
  };
}
