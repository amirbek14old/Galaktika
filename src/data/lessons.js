// Online appointments: the demo schedule (from TUTORS) + appointments created by teachers on this device.
import { TUTORS } from './tutors.js';

export const OPEN_USD = 1.5;          // one open lesson, any number of students
export const PREMIUM_USD = 10;        // premium per month
export const PREMIUM_FREE = 5;        // free online lessons included in premium
export const TEACHER_SHARE = 0.8;     // 80% to the teacher, 20% to Galaktika
export const split = (usd) => ({ teacher: +(usd * TEACHER_SHARE).toFixed(2), site: +(usd * (1 - TEACHER_SHARE)).toFixed(2) });
export const usd = (n) => '$' + n.toFixed(2);

export const STUDENTS = ['Алишер', 'Мадина', 'Сардор', 'Дильноза', 'Жасур', 'Севара', 'Бобур', 'Нигора', 'Азиз', 'Шахзода', 'Лола', 'Отабек', 'Камила', 'Рустам', 'Зарина', 'Ильяс'];
export const STUDENT_AVATARS = ['astro', 'moon', 'alien', 'robot', 'meteor', 'qalam'];

const hash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
export const atOf = (d, time) => { const x = new Date(); x.setDate(x.getDate() + d); const [h, m] = time.split(':').map(Number); x.setHours(h, m, 0, 0); return x.getTime(); };

const OPEN = [
  { teacher: 'Нилуфар Каримова', s: 'math', exp: 12, topic: 'Открытый урок: из тройки в пятёрку по математике', live: true },
  { teacher: 'Елена Ким', s: 'eng', exp: 9, topic: 'Open class: English for everyone', d: 1, time: '19:00' },
  { teacher: 'Дилноза Юсупова', s: 'rus', exp: 20, topic: 'Открытый урок: пишем без ошибок', d: 2, time: '18:00' }
];

/** Fresh every call so "today / live now" stay current. */
export function demoLessons() {
  const out = [];
  OPEN.forEach((o, i) => out.push({ id: 'open-' + i, teacher: o.teacher, s: o.s, g: [1, 3], exp: o.exp, topic: o.topic,
    at: o.live ? Date.now() - 6 * 60e3 : atOf(o.d, o.time), dur: 45, kind: 'open', demo: true, live: !!o.live }));
  TUTORS.forEach((tu, i) => tu.slots.forEach((sl, si) => out.push({
    id: `${i}-${si}`, teacher: tu.n, s: tu.s, g: tu.g, exp: tu.exp, topic: sl[2],
    at: sl[3] ? Date.now() - 8 * 60e3 : atOf(sl[0], sl[1]), dur: 45, kind: 'group',
    price: tu.exp >= 15 ? 40 : 30, seats: tu.solo ? 4 : tu.group, demo: true, live: !!sl[3] })));
  return out;
}
export function allLessons(s) { return [...(s.lessons || []), ...demoLessons()].sort((a, b) => a.at - b.at); }
export const lessonById = (s, id) => allLessons(s).find((l) => l.id === id);

export const isLive = (l, now = Date.now()) => l.live || (now >= l.at - 5 * 60e3 && now < l.at + l.dur * 60e3);
export const isOver = (l, now = Date.now()) => !l.live && now >= l.at + l.dur * 60e3;

/** Simulated number of other students who joined. Teacher-made lessons fill up slowly after creation. */
export function crowd(l, now = Date.now()) {
  const cap = l.kind === 'open' ? 400 : Math.max(0, (l.seats || 8) - 1);
  if (l.own) return Math.min(cap, Math.floor((now - (l.created || now)) / 12000) + (l.kind === 'open' ? 3 : 1));
  return l.kind === 'open' ? 60 + (hash(l.id) % 140) : Math.min(cap, 1 + (hash(l.id) % Math.max(1, cap)));
}
/** What the teacher earns from a lesson (80%) and what the platform keeps (20%). */
export function earnings(l, n = crowd(l)) {
  if (l.kind === 'open') { const gross = n * OPEN_USD; return { cur: 'usd', gross, teacher: gross * TEACHER_SHARE, site: gross * (1 - TEACHER_SHARE) }; }
  const gross = n * (l.price || 0); return { cur: 'gems', gross, teacher: Math.round(gross * TEACHER_SHARE), site: gross - Math.round(gross * TEACHER_SHARE) };
}
export const seatsLeft = (l) => (l.kind === 'open' ? Infinity : Math.max(0, (l.seats || 8) - crowd(l)));
export const fits = (l, grade) => grade >= l.g[0] && grade <= l.g[1];

/** "Today" / "Tomorrow" / "Mon, 20.10" + "16:00". */
export function whenOf(at, t) {
  const x = new Date(at), today = new Date(); today.setHours(0, 0, 0, 0);
  const d = Math.round((new Date(x).setHours(0, 0, 0, 0) - today) / 864e5);
  const day = d === 0 ? t('today') : d === 1 ? t('tomorrow') : `${t.list('dow')[x.getDay()]}, ${x.getDate()}.${String(x.getMonth() + 1).padStart(2, '0')}`;
  return [day, `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`];
}
