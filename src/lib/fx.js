// Sound and visual effects (sparks, red flash, floating numbers, confetti). All respect reduced motion.
import { getState } from './store.js';

let AC;
function tone(seq) {
  if (!getState().sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    let t = AC.currentTime;
    seq.forEach(([f, dur, type]) => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type || 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.02); t += dur * 0.8;
    });
  } catch (e) { /* audio unavailable */ }
}
export const sfx = {
  tap: (k = 0) => tone([[480 + k * 30, 0.05]]),
  ok: () => tone([[660, 0.12], [990, 0.22]]),
  bad: () => tone([[220, 0.18, 'triangle'], [165, 0.25, 'triangle']]),
  win: () => tone([[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.35]]),
  warp: () => tone([[200, 0.2, 'sawtooth'], [400, 0.2, 'sawtooth'], [800, 0.3]]),
  coin: () => tone([[1320, 0.08], [1760, 0.18]]),
  tick: () => tone([[1500, 0.04]]),
  whoosh: () => tone([[300, 0.25, 'sawtooth'], [120, 0.5, 'triangle']])
};

export const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const layer = () => document.getElementById('fx');

export function burst(el, good = true, n) {
  if (reducedMotion() || !el || !layer()) return;
  const r = el.getBoundingClientRect();
  const cols = good ? ['#22C55E', '#FACC15', '#22D3EE', '#865DFF', '#4F7CFF'] : ['#F87171', '#DC4C4C'];
  const count = n || (good ? 18 : 8);
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'spark' + (good && i % 3 === 0 ? ' star' : '');
    const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * (good ? 100 : 40);
    s.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;background:${cols[i % cols.length]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
    layer().appendChild(s); setTimeout(() => s.remove(), 800);
  }
}
export function flash() {
  if (reducedMotion() || !layer()) return;
  const f = document.createElement('div'); f.className = 'flash'; layer().appendChild(f); setTimeout(() => f.remove(), 750);
}
export function floaty(el, text, color, down) {
  if (!el || !layer()) return;
  const r = el.getBoundingClientRect(), s = document.createElement('span');
  s.className = 'floaty' + (down ? ' down' : ''); s.textContent = text;
  s.style.cssText = `left:${r.left + r.width / 2 - 10}px;top:${r.top}px;color:${color}`;
  layer().appendChild(s); setTimeout(() => s.remove(), 950);
}
export function confetti() {
  if (reducedMotion()) return;
  const cv = document.createElement('canvas'); cv.className = 'confetti'; document.body.appendChild(cv);
  const x = cv.getContext('2d'); cv.width = innerWidth; cv.height = innerHeight;
  const cols = ['#22C55E', '#4F7CFF', '#FACC15', '#F87171', '#865DFF', '#22D3EE'];
  const P = [...Array(140)].map(() => ({ x: innerWidth / 2, y: innerHeight * 0.35, vx: (Math.random() - 0.5) * 15, vy: -Math.random() * 15 - 4, r: Math.random() * 6 + 4, c: cols[Math.floor(Math.random() * 6)], a: Math.random() * 6 }));
  let f = 0;
  (function step() {
    x.clearRect(0, 0, cv.width, cv.height);
    P.forEach((p) => { p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.a += 0.2; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); });
    if (++f < 120) requestAnimationFrame(step); else cv.remove();
  })();
}

const GEM = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 3h12l4 6-10 13L2 9z" fill="#7C3AED"/><path d="M6 3l2 6H2zM8 9h8l-4 13z" fill="#22D3EE"/><path d="M8 9l4-6 4 6z" fill="#E0F2FE"/></svg>';
/** Crystals fly from one element to another (e.g. result tile → wallet). */
export function coinFly(fromEl, toEl, n = 6, onArrive) {
  if (!fromEl || !toEl || !layer()) { onArrive && onArrive(); return; }
  if (reducedMotion()) { onArrive && onArrive(); return; }
  const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
  const count = Math.min(10, Math.max(3, n));
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span'); s.className = 'coin'; s.innerHTML = GEM;
    const sx = a.left + a.width / 2 + (Math.random() - 0.5) * 60, sy = a.top + a.height / 2 + (Math.random() - 0.5) * 30;
    s.style.cssText = `left:${sx}px;top:${sy}px`;
    layer().appendChild(s);
    const dx = b.left + b.width / 2 - sx, dy = b.top + b.height / 2 - sy;
    const anim = s.animate([
      { transform: 'translate(0,0) scale(.4)', opacity: 0 },
      { transform: `translate(${(Math.random() - 0.5) * 80}px, ${-40 - Math.random() * 40}px) scale(1.2)`, opacity: 1, offset: 0.3 },
      { transform: `translate(${dx}px, ${dy}px) scale(.7)`, opacity: 1 }
    ], { duration: 900 + i * 70, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' });
    anim.onfinish = () => { s.remove(); if (i === count - 1) { sfx.coin(); onArrive && onArrive(); } else if (i % 2) sfx.tick(); };
  }
}
