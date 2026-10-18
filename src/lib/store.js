// Tiny global store (useSyncExternalStore) persisted to localStorage with a versioned schema.
import { useSyncExternalStore } from 'react';
import { dayKey, daysAgo } from './util.js';

const KEY = 'galaktika';
const VERSION = 5;

const DEFAULT_OWNED = { banner: ['deep'], avatar: ['astro', 'qalam'], frame: ['none'], rocket: ['classic'] };
const DEFAULT_EQUIP = { banner: 'deep', avatar: 'astro', frame: 'none', rocket: 'classic' };

export function seed() {
  return {
    v: VERSION, lang: 'ru', child: 'Тимур', grade: 2, subj: 'math', sound: true,
    xp: 95, streak: 3, lastDay: daysAgo(1), hearts: 5,
    gems: 140, gemsEarned: 140, freezes: 0,
    owned: structuredClone(DEFAULT_OWNED), equip: { ...DEFAULT_EQUIP },
    done: { 'math-2-1-0': true, 'eng-2-1-0': true, 'rus-2-1-0': true },
    mis: { swap: { wrong: 2, fixed: 1 }, 'part-part': { wrong: 1, fixed: 1 } },
    concepts: { meaning: { c: 5, w: 1, log: [] }, numden: { c: 3, w: 2, log: [] } },
    hist: { [daysAgo(4)]: 10, [daysAgo(3)]: 15, [daysAgo(2)]: 25, [daysAgo(1)]: 25 },
    stats: { answered: 31, correct: 26, secs: 780 },
    ach: { 'first-planet': daysAgo(3), 'streak-3': daysAgo(1) },
    sessions: [], flight: null, justDone: null, streakUp: null,
    role: 'child', photo: null, pushOn: false, notesSeen: 0,
    onboarded: true, tSubj: 'math', marks: { math: 3, rus: 4, uzb: 5, eng: 3, nature: 4 }, goals: { math: 5, eng: 4 }, roster: {}, seenInfo: {}, lessons: [], joined: { '1-1': { via: 'gems', amt: 30, at: Date.now() - 864e5 } }, premium: null, payments: [],
    notes: [
      { id: 'n1', at: Date.now() - 3 * 864e5, kind: 'good', key: 'perfect', v: { title: 'Сложение до 100' } },
      { id: 'n2', at: Date.now() - 2 * 864e5, kind: 'bad', key: 'struggle', v: { title: 'Вычитание до 100', acc: 58 } },
      { id: 'n3', at: Date.now() - 2 * 864e5 + 6e5, kind: 'good', key: 'planet', v: { title: 'Сложение до 100' } },
      { id: 'n4', at: Date.now() - 864e5, kind: 'info', key: 'streak', v: { n: 3 } }
    ]
  };
}
export function blank(prev) {
  return { ...seed(), xp: 0, streak: 0, lastDay: '', gems: 30, gemsEarned: 30, done: {}, mis: {}, concepts: {}, hist: {}, stats: { answered: 0, correct: 0, secs: 0 }, ach: {}, sessions: [], joined: {}, payments: [], premium: prev.premium || null, lessons: prev.lessons || [], onboarded: true, marks: prev.marks, goals: prev.goals, roster: prev.roster || {}, seenInfo: prev.seenInfo || {}, tSubj: prev.tSubj || 'math',
    owned: structuredClone(DEFAULT_OWNED), equip: { ...DEFAULT_EQUIP },
    notes: [], photo: prev.photo, role: prev.role, pushOn: prev.pushOn, notesSeen: 0,
    lang: prev.lang, child: prev.child, grade: prev.grade, subj: prev.subj, sound: prev.sound };
}

function fromV3(s) { // bookings → joined, plus the v4 fields
  const joined = {};
  Object.keys(s.paid || {}).forEach((k) => { if (s.paid[k]) joined[k] = { via: 'gems', amt: 30, at: Date.now() }; });
  const { booked, paid, ...rest } = s; // eslint-disable-line no-unused-vars
  return { ...rest, tSubj: 'math', lessons: [], joined, premium: null, payments: [] };
}
function toV5(s) { // grades 1–3 only, school marks, no onboarding
  const d = seed();
  return { ...s, v: VERSION, onboarded: true, grade: s.grade >= 1 && s.grade <= 3 ? s.grade : 2, subj: ['math', 'rus', 'eng', 'uzb', 'nature'].includes(s.subj) ? s.subj : 'math',
    marks: s.marks || d.marks, goals: s.goals || d.goals, roster: s.roster || {}, seenInfo: s.seenInfo || {},
    lessons: (s.lessons || []).map((l) => ({ ...l, g: [Math.min(3, l.g[0]), Math.min(3, l.g[1])] })) };
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && s.v === VERSION) return s;
    if (s && (s.v === 3 || s.v === 4)) return toV5(s.v === 3 ? fromV3(s) : s);

  } catch (e) { /* storage blocked */ }
  return seed();
}
let state = load();
try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
const subs = new Set();

export function getState() { return state; }
export function setState(next) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  subs.forEach((f) => f());
}
/** Mutate a copy of the state. */
export function update(fn) { const next = structuredClone(state); fn(next); setState(next); }
export function useStore(sel = (s) => s) {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => sel(state));
}

/* ---------- domain actions (call inside update) ---------- */
export function recordEvidence(s, conceptId, ok, qid) {
  if (!conceptId) return;
  const c = s.concepts[conceptId] || (s.concepts[conceptId] = { c: 0, w: 0, log: [] });
  ok ? c.c++ : c.w++;
  c.log = [...(c.log || []), { ok, q: qid || '', t: Date.now() }].slice(-8);
  c.at = Date.now();
}
export const isPremium = (s) => !!(s.premium && s.premium.until > Date.now());
export function addGems(s, n) { s.gems += n; s.gemsEarned = (s.gemsEarned || 0) + n; }

/** XP + day streak. A saved freeze bridges exactly one missed day. Never punishes beyond a reset. */
export function addXP(s, xp) {
  s.xp += xp; const t = dayKey(); s.hist[t] = (s.hist[t] || 0) + xp;
  if (s.lastDay !== t) {
    if (s.lastDay === daysAgo(1)) s.streak += 1;
    else if (s.lastDay === daysAgo(2) && s.freezes > 0) { s.freezes -= 1; s.streak += 1; }
    else s.streak = 1;
    s.lastDay = t;
    s.streakUp = { n: s.streak, at: Date.now() };
    if (s.streak >= 2) notify(s, 'info', 'streak', { n: s.streak });
    if (s.streak >= 3) unlock(s, 'streak-3');
  }
}

export const ACH_IDS = ['first-planet', 'first-diag', 'gap-closed', 'no-miss', 'frac-master', 'online-first', 'streak-3', 'first-buy'];
let achListener = null;
export function onAchievement(f) { achListener = f; }
export function unlock(s, id) {
  if (s.ach[id]) return;
  s.ach[id] = dayKey();
  addGems(s, 10);
  setTimeout(() => achListener && achListener(id), 400);
}

/* ---------- parent notifications ---------- */
let noteListener = null;
export function onNote(f) { noteListener = f; }
/** kind: good | bad | info. key → i18n "note.<key>", v → variables (titles in Russian, translated on render). */
export function notify(s, kind, key, v = {}) {
  const n = { id: Math.random().toString(36).slice(2), at: Date.now(), kind, key, v };
  s.notes = [n, ...(s.notes || [])].slice(0, 40);
  setTimeout(() => noteListener && noteListener(n), 600);
}
