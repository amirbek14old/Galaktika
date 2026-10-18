// Small shared helpers: math, formatting, fraction rendering.

export const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const ch = (a) => a[Math.floor(Math.random() * a.length)];
export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export const fmt = (x) => String(Math.round(x * 1000) / 1000).replace('.', ',');
const SUPD = '⁰¹²³⁴⁵⁶⁷⁸⁹', SUBD = '₀₁₂₃₄₅₆₇₈₉';
export const sup = (n) => String(n).split('').map((c) => (c === '-' ? '⁻' : SUPD[c])).join('');
export const sub = (n) => String(n).split('').map((c) => SUBD[c]).join('');
export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c; };
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return dayKey(d); };

/** "{3/4}" in a string → stacked fraction markup (trusted, authored content only). */
export const F = (s) => String(s).replace(/\{(\d+)\/(\d+)\}/g, (m, a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`);
/** Option label: "3/4" alone becomes a stacked fraction, everything else is escaped text. */
export const lbl = (t) => (/^\d+\/\d+$/.test(t) ? F('{' + t + '}') : F(esc(t)));

/** Fraction picture as an SVG string (pizza circle or chocolate bar). */
export function fracSVG(n, d, kind = 'circle', size = 120, opt = {}) {
  const on = opt.on || (kind === 'circle' ? 'var(--orange)' : 'var(--cyan)'), off = 'var(--surface2)', sep = 'var(--bg)';
  const isOn = (i) => (opt.state ? opt.state[i] : i < n);
  const cls = opt.interactive ? 'class="seg"' : '';
  let s = '';
  if (kind === 'circle') {
    const r = size / 2 - 4, c = size / 2;
    if (d === 1) s = `<circle ${cls} data-i="0" cx="${c}" cy="${c}" r="${r}" fill="${isOn(0) ? on : off}"/>`;
    else for (let i = 0; i < d; i++) {
      const a0 = ((-90 + (i * 360) / d) * Math.PI) / 180, a1 = ((-90 + ((i + 1) * 360) / d) * Math.PI) / 180;
      const x0 = c + r * Math.cos(a0), y0 = c + r * Math.sin(a0), x1 = c + r * Math.cos(a1), y1 = c + r * Math.sin(a1);
      s += `<path ${cls} data-i="${i}" d="M${c} ${c}L${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${360 / d > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z" fill="${isOn(i) ? on : off}" stroke="${sep}" stroke-width="3" stroke-linejoin="round"/>`;
    }
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${n} из ${d}">${s}</svg>`;
  }
  const W = Math.round(size * 1.7), H = Math.round(size * 0.46), g = 4, w = (W - g * (d - 1)) / d;
  for (let i = 0; i < d; i++) s += `<rect ${cls} data-i="${i}" x="${(i * (w + g)).toFixed(2)}" y="0" width="${w.toFixed(2)}" height="${H}" rx="6" fill="${isOn(i) ? on : off}"/>`;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${n} из ${d}" style="max-width:100%;height:auto">${s}</svg>`;
}
export const pic = (p, size) => fracSVG(p.n, p.d, p.kind || 'circle', size || 110);
