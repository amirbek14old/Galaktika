// School marks (Uzbek 5-point scale) and the "3 → 4/5 by the end of the chorak" plan for grades 1–3.
import { planetsFor, SUBJ, avail } from './subjects.js';

export const GRADES = [1, 2, 3];
export const SCHOOL_SUBJ = ['math', 'rus', 'uzb', 'eng', 'nature'];
export const schoolSubjects = (grade) => SUBJ.filter((x) => SCHOOL_SUBJ.includes(x.id) && avail(x, grade));

/** Approximate chorak dates of the Uzbek school year (month is 0-based). */
const CHORAK = [
  { n: 1, from: [8, 2], to: [10, 1] },
  { n: 2, from: [10, 10], to: [11, 27] },
  { n: 3, from: [0, 12], to: [2, 20] },
  { n: 4, from: [2, 30], to: [4, 25] }
];
/** The current (or next) chorak with real dates. */
export function chorakNow(now = new Date()) {
  const y = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1; // school year starts in September
  const list = CHORAK.map((c) => {
    const fy = c.from[0] >= 7 ? y : y + 1, ty = c.to[0] >= 7 ? y : y + 1;
    return { n: c.n, from: new Date(fy, c.from[0], c.from[1]), to: new Date(ty, c.to[0], c.to[1], 23, 59) };
  });
  const c = list.find((x) => now <= x.to) || list[3];
  const daysLeft = Math.max(0, Math.ceil((c.to - now) / 864e5));
  const total = Math.max(1, Math.round((c.to - c.from) / 864e5));
  const passed = Math.min(1, Math.max(0, (now - c.from) / (c.to - c.from)));
  return { ...c, daysLeft, weeksLeft: Math.max(1, Math.ceil(daysLeft / 7)), total, passed };
}

/** Missions in the plan: this chorak's planet (+ the previous one for a 5). */
export function planMissions(sid, grade, target, chorakN) {
  const planets = planetsFor(sid, grade);
  const cur = planets.find((p) => p.t === chorakN) || planets[0];
  const prev = planets.find((p) => p.t === chorakN - 1), next = planets.find((p) => p.t === chorakN + 1);
  // a 5 needs more: revise last term's planet, or (in term 1) get a head start on the next one
  const extra = target === 5 ? (prev ? prev.lessons : next ? next.lessons.slice(0, 1) : []) : [];
  const list = [...cur.lessons, ...extra];
  return { planet: cur, list };
}
export const NEED_ACC = { 4: 70, 5: 85 };

/**
 * Forecast for one subject. done = missions finished, total = in plan, acc = accuracy %, passed = share of chorak gone.
 * Returns the mark the student is heading for and whether they are on track.
 */
export function forecast({ done, total, acc, passed, target }) {
  const progress = total ? done / total : 0;
  const onPace = progress >= Math.min(1, passed + 0.05) || progress >= 1;
  let mark = 3;
  if (progress >= 0.5 || onPace) mark = acc >= NEED_ACC[5] && progress >= Math.min(1, passed) ? 5 : acc >= NEED_ACC[4] ? 4 : 3;
  if (progress >= 1 && acc >= NEED_ACC[target]) mark = target;
  const status = mark >= target ? 'ok' : progress + 0.15 >= passed ? 'close' : 'risk';
  return { mark: Math.min(mark, 5), progress, status };
}

/* ---------- the class (demo classmates; the teacher sees this list) ---------- */
const NAMES = ['Алишер', 'Мадина', 'Сардор', 'Дильноза', 'Жасур', 'Севара', 'Бобур', 'Нигора', 'Азиз', 'Шахзода', 'Лола', 'Отабек', 'Камила', 'Рустам'];
const AV = ['astro', 'moon', 'alien', 'robot', 'meteor', 'qalam'];
const h = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 11);

export function classmates(grade) {
  const subs = schoolSubjects(grade).map((x) => x.id);
  return NAMES.map((n, i) => {
    const k = h(n + grade);
    const marks = {};
    subs.forEach((sid, j) => { marks[sid] = ((k >> (j * 3)) % 10) < 5 ? 4 : 5; });
    const nThree = [1, 0, 2, 1, 0, 1, 0, 0, 1, 2, 0, 1, 0, 1][i];
    for (let j = 0; j < nThree; j++) marks[subs[(k + j * 2) % subs.length]] = 3;
    return { id: 'c' + i, name: n, av: AV[i % AV.length], marks, pace: 0.25 + ((k >> 4) % 70) / 100, acc: 58 + ((k >> 7) % 38), goal: (k % 3) ? 4 : 5 };
  });
}
