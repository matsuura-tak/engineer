// 文言（contracts/strings.md）。言語の決め方と、差し込み {name} と {name, plural, one {…} other {…}} の 2 つだけ。

export function pickLang(language) {
  return String(language ?? '').toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

function pluralText(options, n, lang) {
  let category = 'other';
  try {
    category = new Intl.PluralRules(lang).select(n);
  } catch {
    category = 'other';
  }
  const text = category in options ? options[category] : options.other ?? '';
  return text.replace(/#/g, String(n));
}

function parseOptions(body) {
  const options = {};
  const re = /\s*(one|other)\s*\{([^{}]*)\}/gy;
  let m;
  while ((m = re.exec(body)) !== null) options[m[1]] = m[2];
  return options;
}

export function format(template, values = {}, lang = 'ja') {
  let out = '';
  let i = 0;
  while (i < template.length) {
    const open = template.indexOf('{', i);
    if (open < 0) {
      out += template.slice(i);
      break;
    }
    out += template.slice(i, open);
    let depth = 0;
    let close = -1;
    for (let j = open; j < template.length; j++) {
      if (template[j] === '{') depth++;
      else if (template[j] === '}') {
        depth--;
        if (depth === 0) {
          close = j;
          break;
        }
      }
    }
    if (close < 0) {
      out += template.slice(open);
      break;
    }
    const inner = template.slice(open + 1, close);
    const plural = /^\s*(\w+)\s*,\s*plural\s*,([\s\S]*)$/.exec(inner);
    if (plural) {
      const name = plural[1];
      out += name in values ? pluralText(parseOptions(plural[2]), Number(values[name]), lang) : template.slice(open, close + 1);
    } else {
      const name = inner.trim();
      out += name in values ? String(values[name]) : template.slice(open, close + 1);
    }
    i = close + 1;
  }
  return out;
}
