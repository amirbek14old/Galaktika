// Turning stored parent notifications into text, and optional browser (push-style) notifications.
import { MIS } from '../data/fractions.js';
import { tt } from '../data/titles.js';

export function noteText(n, t, name) {
  const v = n.v || {};
  return t('note.' + n.key, {
    name,
    title: v.title ? tt(v.title, t.lang) : '',
    acc: v.acc,
    trap: v.trap ? MIS[v.trap]?.name || v.trap : '',
    cause: v.cause ? t('hyp.' + v.cause) : '',
    c: v.c ? t('c.' + v.c) : '',
    n: v.n,
    d: v.n ? t.pl('day', v.n) : ''
  });
}
export function ago(at, t) {
  const m = Math.round((Date.now() - at) / 60000);
  if (m < 1) return t('ago.now');
  if (m < 60) return t('ago.min', { n: m });
  if (m < 1440) return t('ago.h', { n: Math.round(m / 60) });
  return t('ago.d', { n: Math.round(m / 1440) });
}
/** Ask the browser for permission. Resolves true/false. */
export async function askPush() {
  try {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    return (await Notification.requestPermission()) === 'granted';
  } catch (e) { return false; }
}
export function showPush(title, body) {
  try { if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body }); } catch (e) { /* not available here */ }
}
