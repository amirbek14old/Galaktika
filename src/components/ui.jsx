import { createContext, useContext } from 'react';

export const UI = createContext(null);
export const useUI = () => useContext(UI);

/** Render trusted, authored markup (fraction notation, inline SVG). */
export const Html = ({ html, as: Tag = 'span', ...p }) => <Tag {...p} dangerouslySetInnerHTML={{ __html: html }} />;

const IC = {
  book: '<svg class="i" viewBox="0 0 24 24"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M4 21a2 2 0 012-2h13v2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M8 7h7M8 11h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  shop: '<svg viewBox="0 0 32 32"><path d="M6 12h20l-2 15H8z" fill="var(--violet)"/><path d="M11 12V9a5 5 0 0110 0v3" fill="none" stroke="var(--cyan)" stroke-width="2.6"/><path d="M13 17h6l2 3-5 5-5-5z" fill="#A5F3FC"/></svg>',
  more: '<svg viewBox="0 0 32 32"><circle cx="8" cy="16" r="3" fill="var(--muted)"/><circle cx="16" cy="16" r="3" fill="var(--muted)"/><circle cx="24" cy="16" r="3" fill="var(--muted)"/></svg>',
  edit: '<svg class="i" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M13 7l4 4" stroke="currentColor" stroke-width="2.2"/></svg>',
  galaxy: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="7" fill="var(--violet)"/><ellipse cx="16" cy="16" rx="14" ry="5" fill="none" stroke="var(--cyan)" stroke-width="2.4" transform="rotate(-20 16 16)"/><circle cx="25" cy="8" r="1.6" fill="#fff"/><circle cx="6" cy="25" r="1.2" fill="#fff"/></svg>',
  menu: '<svg viewBox="0 0 32 32"><rect x="4" y="4" width="11" height="11" rx="3" fill="var(--blue)"/><rect x="17" y="4" width="11" height="11" rx="3" fill="var(--cyan)"/><rect x="4" y="17" width="11" height="11" rx="3" fill="var(--violet)"/><rect x="17" y="17" width="11" height="11" rx="3" fill="var(--amber)"/></svg>',
  diag: '<svg viewBox="0 0 32 32"><circle cx="14" cy="14" r="9" fill="none" stroke="var(--cyan)" stroke-width="3.2"/><path d="M21 21l7 7" stroke="var(--cyan)" stroke-width="3.6" stroke-linecap="round"/><path d="M10 14h8M14 10v8" stroke="var(--amber)" stroke-width="2.6" stroke-linecap="round"/></svg>',
  map: '<svg viewBox="0 0 32 32"><path d="M6 24L13 9l8 11 5-6" stroke="var(--blue)" stroke-width="2" fill="none"/><circle cx="6" cy="24" r="3.4" fill="var(--green)"/><circle cx="13" cy="9" r="3.4" fill="var(--green)"/><circle cx="21" cy="20" r="3.4" fill="var(--amber)"/><circle cx="26" cy="14" r="3.4" fill="var(--red)"/></svg>',
  live: '<svg viewBox="0 0 32 32"><rect x="3" y="7" width="20" height="18" rx="4" fill="var(--red)"/><path d="M23 13l6-4v14l-6-4z" fill="var(--red-d)"/><circle cx="13" cy="16" r="3.5" fill="#fff"/></svg>',
  parents: '<svg viewBox="0 0 32 32"><circle cx="11" cy="10" r="5" fill="var(--blue)"/><circle cx="22" cy="13" r="4" fill="var(--violet)"/><path d="M2 27c0-6 4-10 9-10s9 4 9 10z" fill="var(--blue)"/><path d="M15 27c0-5 3-8 7-8s7 3 7 8z" fill="var(--violet)"/></svg>',
  user: '<svg viewBox="0 0 32 32"><circle cx="16" cy="11" r="6" fill="var(--green)"/><path d="M5 28c0-7 5-11 11-11s11 4 11 11z" fill="var(--green)"/></svg>',
  fire: '<svg class="i" viewBox="0 0 24 24"><path d="M12 2c1 4 6 6 6 12a6 6 0 01-12 0c0-3 1.5-4.5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z" fill="var(--orange)"/><path d="M12 13c1 1.5 3 2.5 3 4.5a3 3 0 01-6 0c0-1.5 1-2.5 3-4.5z" fill="var(--yellow)"/></svg>',
  fireOff: '<svg class="i" viewBox="0 0 24 24"><path d="M12 2c1 4 6 6 6 12a6 6 0 01-12 0c0-3 1.5-4.5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z" fill="var(--surface2)"/></svg>',
  bolt: '<svg class="i" viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="var(--yellow)" stroke="var(--yellow-d)" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  heart: '<svg class="i" viewBox="0 0 24 24"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.8-8 11-8 11z" fill="var(--red)"/><ellipse cx="8.5" cy="9" rx="1.6" ry="2.2" fill="#fff" opacity=".5"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="3" fill="currentColor"/><path d="M8 10V8a4 4 0 018 0v2" stroke="currentColor" stroke-width="2.5" fill="none"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z" fill="currentColor"/></svg>',
  okBig: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="var(--green)" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  badBig: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="var(--red)" stroke-width="3.5" stroke-linecap="round"/></svg>',
  close: '<svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  target: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="var(--blue)"/><circle cx="12" cy="12" r="5" fill="var(--bg)"/><circle cx="12" cy="12" r="2.2" fill="var(--blue)"/></svg>',
  clock: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="var(--violet)"/><path d="M12 7v5l3 2" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>',
  planetI: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6.5" fill="var(--cyan)"/><ellipse cx="12" cy="12" rx="11" ry="3.6" fill="none" stroke="var(--amber)" stroke-width="2" transform="rotate(-18 12 12)"/></svg>',
  medal: '<svg viewBox="0 0 24 24"><path d="M7 2h4l1 6-3 1zM17 2h-4l-1 6 3 1z" fill="var(--blue)"/><circle cx="12" cy="15" r="6.5" fill="var(--yellow)" stroke="var(--yellow-d)" stroke-width="1.5"/><path d="M12 11.5l1.1 2.2 2.4.3-1.8 1.6.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.6 2.4-.3z" fill="#fff"/></svg>',
  rocket: '<svg viewBox="0 0 48 48"><path d="M24 4c7 6 10 14 9 24l-9 6-9-6c-1-10 2-18 9-24z" fill="#E2E8F0"/><path d="M24 4c3 3 5 6 6 10H18c1-4 3-7 6-10z" fill="var(--red)"/><circle cx="24" cy="21" r="4" fill="var(--cyan)" stroke="#94A3B8" stroke-width="1.5"/><path d="M15 28l-6 8 8-2zM33 28l6 8-8-2z" fill="var(--red)"/><path d="M20 34l4 10 4-10z" fill="var(--orange)" class="flame"/></svg>'
};
export const I = ({ n, className = '' }) => <Html className={'ic ' + className} html={IC[n]} />;
export const icon = (n) => IC[n];

export const SubjGlyph = ({ s, size }) => (
  <span className="sg" style={{ '--c': s.c, ...(size ? { width: size, height: size, fontSize: size * 0.38, borderRadius: size * 0.27 } : {}) }} dangerouslySetInnerHTML={{ __html: s.g }} />
);

/** Qalam — the app's original pencil mascot, here in an astronaut helmet. */
export function Mascot({ mood = 'happy', className = '' }) {
  const mouth = mood === 'sad' ? '<path d="M50 84q10-8 20 0" stroke="#334155" stroke-width="4" fill="none" stroke-linecap="round"/>'
    : mood === 'wow' ? '<ellipse cx="60" cy="84" rx="7" ry="8" fill="#334155"/><ellipse cx="60" cy="88" rx="4" ry="3" fill="#FF8FA3"/>'
      : '<path d="M48 79q12 12 24 0" stroke="#334155" stroke-width="4" fill="#fff" stroke-linecap="round" stroke-linejoin="round"/>';
  const brows = mood === 'sad' ? '<path d="M40 56l12 4M80 56l-12 4" stroke="#334155" stroke-width="3.5" stroke-linecap="round"/>' : '';
  const ex = mood === 'sad' ? 0 : 2, ey = mood === 'sad' ? 67 : 65;
  const svg = `<svg viewBox="0 0 120 150" aria-hidden="true"><g transform="rotate(${mood === 'sad' ? -4 : 8} 60 75)">
  <rect x="34" y="8" width="52" height="24" rx="10" fill="#FF8FA3"/>
  <rect x="32" y="28" width="56" height="12" rx="3" fill="#B9C4CC"/><rect x="32" y="32" width="56" height="3" fill="#97A4AE"/>
  <rect x="34" y="38" width="52" height="72" fill="#FFC800"/><rect x="34" y="38" width="12" height="72" fill="#FFD84D"/><rect x="74" y="38" width="12" height="72" fill="#E5A800"/>
  <path d="M34 110h52l-26 32z" fill="#F5D3A1"/><path d="M52 132h16l-8 10z" fill="#334155"/>
  <ellipse cx="47" cy="64" rx="9" ry="10" fill="#fff"/><ellipse cx="73" cy="64" rx="9" ry="10" fill="#fff"/>
  <circle cx="${47 + ex}" cy="${ey}" r="5" fill="#334155"/><circle cx="${73 + ex}" cy="${ey}" r="5" fill="#334155"/>
  <circle cx="51" cy="62" r="1.8" fill="#fff"/><circle cx="77" cy="62" r="1.8" fill="#fff"/>${brows}${mouth}
  <ellipse cx="38" cy="80" rx="5" ry="3" fill="#FF8FA3" opacity=".7"/><ellipse cx="82" cy="80" rx="5" ry="3" fill="#FF8FA3" opacity=".7"/>
  <circle cx="60" cy="62" r="44" fill="rgba(125,211,252,.12)" stroke="rgba(186,230,253,.75)" stroke-width="3"/>
  <path d="M30 40q10-14 26-16" stroke="rgba(255,255,255,.7)" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g></svg>`;
  return <Html className={'mascot ' + className} html={svg} />;
}

