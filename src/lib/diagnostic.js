// Diagnostic engine: transparent Bayesian reasoning over misconception hypotheses,
// plus an interpretable mastery model per concept. No hidden AI — every step is explainable.
import { pick, inp } from './questions.js';

/** Competing explanations for a wrong answer to 1/2 + 1/3. */
export const HYP = {
  addden: { label: 'Складывает числители и знаменатели напрямую', concept: 'addsame' },
  equiv: { label: 'Не видит равные дроби (1/2 = 3/6)', concept: 'equiv' },
  common: { label: 'Не умеет находить общий знаменатель', concept: 'common' },
  slip: { label: 'Случайная ошибка', concept: 'add' }
};

export const INITIAL = { ...inp('Сложи дроби', '{1/2} + {1/3} =', 5, 6, null), id: 'd0', c: 'add' };

/**
 * Follow-up questions. like[h] = probability a student with hypothesis h answers correctly.
 * These numbers are authored teacher estimates, shown openly in the UI.
 */
export const FOLLOW = [
  { ...pick('Равны ли {1/2} и {2/4}?', null, [['Да, это одна и та же часть', true], ['Нет, {2/4} больше'], ['Нет, {1/2} больше']]), id: 'f_equiv', c: 'equiv',
    like: { addden: 0.8, equiv: 0.15, common: 0.75, slip: 0.95 } },
  { ...inp('Преврати {1/2} в шестые', '{1/2} =', 3, 6, null, { fixedD: 6 }), id: 'f_convert', c: 'equiv',
    like: { addden: 0.7, equiv: 0.2, common: 0.55, slip: 0.95 } },
  { ...inp('Сложи дроби', '{1/4} + {2/4} =', 3, 4, null), id: 'f_addsame', c: 'addsame',
    like: { addden: 0.15, equiv: 0.8, common: 0.85, slip: 0.95 } },
  { ...pick('Какой общий знаменатель у {1/3} и {1/4}?', null, [['12', true], ['7'], ['4']]), id: 'f_lcd', c: 'common',
    like: { addden: 0.35, equiv: 0.45, common: 0.15, slip: 0.95 } },
  { ...inp('Сложи дроби', '{1/2} + {1/2} =', 1, 1, null), id: 'f_half', c: 'addsame',
    like: { addden: 0.2, equiv: 0.75, common: 0.8, slip: 0.95 } }
];

/** Prior beliefs given the first answer (n/d typed by the student). */
export function priorsFor(n, d) {
  if (n === 2 && d === 5) return { addden: 0.55, equiv: 0.15, common: 0.2, slip: 0.1 }; // classic 1+1 / 2+3
  if (d === 6 || d === 5) return { addden: 0.15, equiv: 0.35, common: 0.35, slip: 0.15 };
  return { addden: 0.2, equiv: 0.3, common: 0.35, slip: 0.15 };
}

const normalize = (p) => { const s = Object.values(p).reduce((a, b) => a + b, 0) || 1; return Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v / s])); };
export function update(post, q, ok) {
  return normalize(Object.fromEntries(Object.entries(post).map(([h, p]) => [h, p * (ok ? q.like[h] : 1 - q.like[h])])));
}
export const entropy = (p) => -Object.values(p).reduce((a, v) => a + (v > 0 ? v * Math.log2(v) : 0), 0);

/** Pick the follow-up that is expected to reduce uncertainty the most (max information gain). */
export function nextQuestion(post, askedIds, maxQuestions = 3) {
  if (askedIds.length >= maxQuestions || (askedIds.length >= 2 && Math.max(...Object.values(post)) >= 0.85)) return null;
  let best = null, bestH = Infinity;
  for (const q of FOLLOW) {
    if (askedIds.includes(q.id)) continue;
    const pc = Object.entries(post).reduce((a, [h, p]) => a + p * q.like[h], 0);
    const h = pc * entropy(update(post, q, true)) + (1 - pc) * entropy(update(post, q, false));
    if (h < bestH) { bestH = h; best = q; }
  }
  return best;
}

/** Most likely hypothesis + how sure we are, in plain words. */
export function conclude(post) {
  const [h, p] = Object.entries(post).sort((a, b) => b[1] - a[1])[0];
  return { h, p, word: p >= 0.75 ? 'likely' : p >= 0.5 ? 'probably' : 'maybe', concept: HYP[h].concept };
}

/* ---------- mastery model (Beta-Bernoulli mean, shown with its evidence) ---------- */
export const estimate = (c = 0, w = 0) => (c + 1) / (c + w + 2);
/** i18n key for how much evidence we have. */
export function confidence(n) { return n === 0 ? 'conf.none' : n < 3 ? 'conf.low' : n < 6 ? 'conf.mid' : 'conf.high'; }
export function status(c = 0, w = 0) {
  const n = c + w, e = estimate(c, w);
  if (n === 0) return 'unknown';
  if (e >= 0.75 && n >= 2) return 'mastered';
  if (e < 0.4 && n >= 2) return 'gap';
  return 'practice';
}
export const STATUS = {
  mastered: { key: 'st.mastered', icon: '✓', cls: 'st-ok' },
  practice: { key: 'st.practice', icon: '~', cls: 'st-practice' },
  gap: { key: 'st.gap', icon: '!', cls: 'st-gap' },
  unknown: { key: 'st.unknown', icon: '?', cls: 'st-unknown' }
};
