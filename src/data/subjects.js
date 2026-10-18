// Subjects, grade availability, and the course structure: subject × grade → 4 planets (one per term).
import { MATH } from './math.js';
import { BANK } from './banks.js';
import { FR2, FR3 } from './fractions.js';
import { parseBank } from '../lib/questions.js';

const GL = {
  leaf: '<svg viewBox="0 0 24 24"><path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15z" fill="currentColor"/><path d="M5 19l9-9" stroke="rgba(0,0,0,.25)" stroke-width="2"/></svg>',
  globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
  atom: '<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-60 12 12)"/></g><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>',
  flask: '<svg viewBox="0 0 24 24"><path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M7 16h10l1.6 3H5.4z" fill="currentColor"/></svg>',
  column: '<svg viewBox="0 0 24 24"><path d="M3 9l9-5 9 5z" fill="currentColor"/><rect x="5" y="10" width="2.5" height="8" fill="currentColor"/><rect x="10.75" y="10" width="2.5" height="8" fill="currentColor"/><rect x="16.5" y="10" width="2.5" height="8" fill="currentColor"/><rect x="3" y="19" width="18" height="2.5" fill="currentColor"/></svg>',
  dna: '<svg viewBox="0 0 24 24"><path d="M7 3c0 6 10 6 10 12s-10 6-10 6M17 3c0 6-10 6-10 12s10 6 10 6" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M9 7h6M8 12h8M9 17h6" stroke="currentColor" stroke-width="1.8"/></svg>'
};

/** hue: base colour of this subject's planets */
export const SUBJ = [
  { id: 'math', name: 'Математика', from: 1, to: 11, c: '#4F7CFF', hue: 225, g: 'π' },
  { id: 'rus', name: 'Русский язык', from: 1, to: 11, c: '#F87171', hue: 0, g: 'Аа' },
  { id: 'eng', name: 'Английский', from: 1, to: 11, c: '#22D3EE', hue: 190, g: 'En' },
  { id: 'uzb', name: "O'zbek tili", from: 1, to: 11, c: '#2DD4BF', hue: 168, g: 'Oʻz' },
  { id: 'nature', name: 'Природоведение', from: 1, to: 4, c: '#84CC16', hue: 90, g: GL.leaf },
  { id: 'bio', name: 'Биология', from: 5, to: 11, c: '#22C55E', hue: 140, g: GL.dna },
  { id: 'hist', name: 'История', from: 5, to: 11, c: '#F59E0B', hue: 35, g: GL.column },
  { id: 'geo', name: 'География', from: 5, to: 9, c: '#38BDF8', hue: 205, g: GL.globe },
  { id: 'phys', name: 'Физика', from: 6, to: 11, c: '#865DFF', hue: 262, g: GL.atom },
  { id: 'chem', name: 'Химия', from: 7, to: 11, c: '#F472B6', hue: 325, g: GL.flask },
  { id: 'inf', name: 'Информатика', from: 5, to: 11, c: '#A78BFA', hue: 250, g: '&lt;/&gt;' }
];
export const subj = (id) => SUBJ.find((s) => s.id === id);
export const avail = (s, g) => g >= s.from && g <= s.to;

/** Planets for a subject and grade: one per term, each with 2–3 missions (lessons). */
export function planetsFor(sid, grade) {
  const s = subj(sid);
  const planets = [1, 2, 3, 4].map((t) => {
    const si = SUBJ.indexOf(s);
    const types = ['ocean', 'gas', 'rocky', 'lava', 'ice'];
    const look = { hue: (s.hue + (t - 1) * 38) % 360, ring: (t + si) % 3 === 1, type: types[(si + t + grade) % 5], seed: si * 50 + grade * 4 + t };
    if (sid === 'math') {
      if (grade === 5 && t === 2) return { t, ...look, title: 'Обыкновенные дроби', lessons: FR2.map((l) => ({ ...l })) };
      if (grade === 5 && t === 3) return { t, ...look, title: 'Сравнение и сложение дробей', lessons: FR3.map((l) => ({ ...l })) };
      const g = MATH[grade][t - 1];
      return { t, ...look, title: g.t, lessons: ['Знакомство', 'Тренировка', 'Мастер'].map((n, i) => ({ id: `math-${grade}-${t}-${i}`, title: n, make: () => Array.from({ length: 6 }, () => g.f(i)) })) };
    }
    const band = (BANK[sid] || []).find((b) => grade >= b.g[0] && grade <= b.g[1]);
    if (!band) return null;
    const [title, txt] = band.t[t - 1];
    return { t, ...look, title, lessons: ['Урок', 'Закрепление'].map((n, i) => ({ id: `${sid}-${grade}-${t}-${i}`, title: n, make: () => parseBank(txt) })) };
  }).filter(Boolean);
  planets.forEach((p) => p.lessons.forEach((l, i) => { l.idx = i; l.planet = p.t; l.subj = sid; l.grade = grade; }));
  return planets;
}

export function planetDone(p, done) { return p.lessons.every((l) => done[l.id]); }
export function progressOf(sid, grade, done) {
  const L = planetsFor(sid, grade).flatMap((p) => p.lessons);
  return { done: L.filter((l) => done[l.id]).length, total: L.length };
}
