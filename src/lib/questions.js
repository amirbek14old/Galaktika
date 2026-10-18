// Question model: builders, answer state, readiness and evaluation (pure, testable).
import { fmt, shuffle, lbl, F, esc } from './util.js';

export const pick = (prompt, visual, options, x = {}) => ({
  type: 'pick', prompt, visual,
  options: options.map(([t, v]) => ({ t, ok: v === true, mis: typeof v === 'string' ? v : null })), ...x
});
export const pickImg = (prompt, options, x = {}) => ({ type: 'pickimg', prompt, options: options.map(([p, v]) => ({ p, ok: v === true, mis: typeof v === 'string' ? v : null })), ...x });
export const cmp = (a, b, ans, mis, x = {}) => ({ type: 'compare', prompt: 'Какой знак поставить?', a, b, ans, mis, ...x });
export const inp = (prompt, expr, n, d, diag, x = {}) => ({ type: 'input', prompt, expr, n, d, diag, ...x });
export const shade = (prompt, n, d, kind = 'bar', x = {}) => ({ type: 'shade', prompt, n, d, kind, ...x });
export const match = (pairs, x = {}) => ({ type: 'match', prompt: 'Найди пары', pairs, ...x });
export const order = (items, ans, mis, x = {}) => ({ type: 'order', prompt: 'Расставь от меньшего к большему', items, ans, mis, ...x });

// misconception detectors for typed fractions
export const dWrite = (n, d) => (a, b) => (a === d && b === n ? 'swap' : a === d - n && b === d ? 'unshaded' : a === n && b === d - n ? 'part-part' : null);
export const dAdd = (n1, d1, n2, d2) => (a, b) => (a === n1 + n2 && b === d1 + d2 ? 'add-den' : null);
export const dEq = (n0) => (a) => (a === n0 ? 'not-equiv' : null);

/** Numeric/text answer → multiple choice, or a typed number ~45% of the time. */
export function Q(prompt, ans, wrongs, o = {}) {
  const isNum = typeof ans === 'number';
  if (isNum && !o.pickOnly && Number.isInteger(ans) && Math.random() < 0.45) return { type: 'num', prompt, ans };
  const A = isNum ? fmt(ans) : ans, ws = [];
  for (const w of wrongs) { const s = typeof w === 'number' ? fmt(w) : w; if (s !== A && !ws.includes(s)) ws.push(s); }
  let k = 1;
  while (isNum && !o.exact && ws.length < 3 && k < 20) {
    const s = fmt(ans + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (Number.isInteger(ans) ? 1 : 0.1));
    if (s !== A && !ws.includes(s)) ws.push(s); k++;
  }
  return pick(prompt, null, [[A, true], ...ws.slice(0, 3).map((w) => [w])]);
}

/** Text bank line → question. "Q|right|wrong|wrong" or "B>prompt|answer sentence|extra words" */
export function parseBank(txt) {
  return txt.trim().split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    if (l.startsWith('B>')) { const [p, a, x] = l.slice(2).split('|'); return { type: 'build', prompt: p, ans: a, extra: (x || '').split(' ').filter(Boolean) }; }
    const [p, ...o] = l.split('|');
    return pick(p, null, o.map((t, i) => [t, i === 0]));
  });
}

/** Clone a question for play: shuffle options, pre-shuffle word tiles. */
export function prep(q) {
  const c = { ...q, uid: Math.random().toString(36).slice(2) };
  if (c.options) c.options = shuffle(c.options.slice());
  if (c.type === 'build') c.tiles = shuffle([...c.ans.split(' '), ...c.extra]);
  if (c.type === 'order') c.tiles = c.items;
  return c;
}

export function initAnswer(q) {
  switch (q.type) {
    case 'input': return { n: '', d: q.fixedD ? String(q.fixedD) : '' };
    case 'num': return { x: '' };
    case 'shade': return { state: Array(q.d).fill(false) };
    case 'order': case 'build': return { order: [] };
    default: return { sel: null };
  }
}

export function isReady(q, a) {
  switch (q.type) {
    case 'pick': case 'pickimg': case 'compare': return a.sel !== null && a.sel !== undefined;
    case 'input': return a.n !== '' && a.d !== '';
    case 'num': return a.x.trim() !== '' && a.x !== '-';
    case 'shade': return a.state.some(Boolean);
    case 'order': return a.order.length === q.items.length;
    case 'build': return a.order.length > 0;
    default: return false;
  }
}

const norm = (s) => s.toLowerCase().replace(/[.,!?«»"]/g, '').replace(/\s+/g, ' ').trim();
const esym = (s) => s.replace('<', '&lt;').replace('>', '&gt;');
export const COMPARE = ['<', '=', '>'];

/** Correct answer as display HTML. */
export function answerHTML(q) {
  switch (q.type) {
    case 'pick': return lbl(q.options.find((x) => x.ok).t);
    case 'pickimg': { const c = q.options.find((x) => x.ok); return F(`{${c.p.n}/${c.p.d}}`); }
    case 'compare': return `${lbl(q.a)} ${esym(q.ans)} ${lbl(q.b)}`;
    case 'input': return F(`{${q.n}/${q.d}}`);
    case 'num': return fmt(q.ans);
    case 'shade': return `закрасить ${q.n} из ${q.d}`;
    case 'order': return q.ans.map(lbl).join(' &lt; ');
    case 'build': return esc(q.ans);
    default: return '';
  }
}

/** → { ok, mis } ; mis = detected misconception id or null */
export function evaluate(q, a) {
  switch (q.type) {
    case 'pick': case 'pickimg': { const o = q.options[a.sel]; return { ok: !!o?.ok, mis: o?.ok ? null : o?.mis || null }; }
    case 'compare': { const ok = COMPARE[a.sel] === q.ans; return { ok, mis: ok ? null : q.mis || null }; }
    case 'input': {
      const n = parseInt(a.n, 10), d = parseInt(a.d, 10);
      if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return { ok: false, mis: null };
      const ok = n * q.d === q.n * d;
      return { ok, mis: ok ? null : q.diag ? q.diag(n, d) : null };
    }
    case 'num': { const v = parseFloat(String(a.x).replace(',', '.').replace('−', '-')); return { ok: Number.isFinite(v) && Math.abs(v - q.ans) < 1e-6, mis: null }; }
    case 'shade': return { ok: a.state.filter(Boolean).length === q.n, mis: null };
    case 'order': { const ok = a.order.map((i) => q.items[i]).join() === q.ans.join(); return { ok, mis: ok ? null : q.mis || null }; }
    case 'build': return { ok: norm(a.order.map((i) => q.tiles[i]).join(' ')) === norm(q.ans), mis: null };
    default: return { ok: false, mis: null };
  }
}
