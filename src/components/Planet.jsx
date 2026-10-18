// Procedural planets: a seamless noise texture is painted on a canvas once, then scrolled inside a
// shaded sphere so the planet slowly rotates. Types: ocean world, gas giant, rocky moon, lava, ice.
import { useMemo, useId } from 'react';

const cache = new Map();

function hash(x, y, seed) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
function noise(x, y, period, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const w = (i) => ((i % period) + period) % period;
  const s = (t) => t * t * (3 - 2 * t);
  const a = hash(w(xi), yi, seed), b = hash(w(xi + 1), yi, seed), c = hash(w(xi), yi + 1, seed), d = hash(w(xi + 1), yi + 1, seed);
  const u = s(xf), v = s(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
/** Fractal noise, seamless in x (period = base lattice width). */
function fbm(x, y, period, seed, oct = 5) {
  let sum = 0, amp = 0.5, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) { sum += amp * noise(x * f, y * f, period * f, seed + i * 31); norm += amp; amp *= 0.5; f *= 2; }
  return sum / norm;
}
function hsl(h, s, l) {
  s /= 100; l /= 100; const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = (v) => Math.max(0, Math.min(1, v));

function texture(type, hue, seed) {
  const key = `${type}-${hue}-${seed}`;
  if (cache.has(key)) return cache.get(key);
  const W = 256, H = 128, P = 6;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(W, H);
  const craters = Array.from({ length: 18 }, (_, i) => ({ x: hash(i, 1, seed) * W, y: 14 + hash(i, 2, seed) * (H - 28), r: 3 + hash(i, 3, seed) * 10 }));
  for (let y = 0; y < H; y++) {
    const lat = Math.abs(y / H - 0.5) * 2; // 0 at equator, 1 at poles
    for (let x = 0; x < W; x++) {
      const u = (x / W) * P, v = (y / H) * (P / 2);
      const n = fbm(u, v, P, seed);
      let col;
      if (type === 'gas') {
        const band = Math.sin(v * 7 + n * 5.5) * 0.5 + 0.5;
        const storm = fbm(u * 2, v * 2, P * 2, seed + 7, 3);
        col = mix(hsl(hue, 70, 28), hsl(hue + 25, 80, 66), band);
        col = mix(col, hsl(hue - 20, 85, 82), clamp((storm - 0.62) * 4));
      } else if (type === 'ocean') {
        const land = n > 0.53;
        col = land ? mix(hsl(hue + 100, 45, 32), hsl(hue + 60, 40, 55), clamp((n - 0.53) * 6)) : mix(hsl(hue, 80, 22), hsl(hue, 75, 45), clamp(n * 1.6));
        if (land && n > 0.66) col = mix(col, [235, 225, 210], 0.5);
        const cloud = fbm(u * 1.6 + 3, v * 1.6, P * 2, seed + 99, 4);
        col = mix(col, [250, 252, 255], clamp((cloud - 0.55) * 3) * 0.9);
        col = mix(col, [245, 250, 255], clamp((lat - 0.82) * 6));
      } else if (type === 'lava') {
        const crack = 1 - clamp(Math.abs(n - 0.5) * 22);
        col = mix(hsl(hue + 340, 25, 10), hsl(hue + 350, 30, 22), n);
        col = mix(col, hsl(20, 100, 58), crack);
        col = mix(col, hsl(45, 100, 75), crack * crack * 0.7);
      } else if (type === 'ice') {
        col = mix(hsl(hue, 45, 62), hsl(hue, 60, 92), n);
        const crack = 1 - clamp(Math.abs(fbm(u * 2, v * 2, P * 2, seed + 5, 3) - 0.5) * 30);
        col = mix(col, hsl(hue + 10, 70, 45), crack * 0.6);
      } else { // rocky
        col = mix(hsl(hue, 18, 26), hsl(hue + 15, 25, 62), n);
        for (const c of craters) {
          const dx = Math.min(Math.abs(x - c.x), W - Math.abs(x - c.x)), d = Math.hypot(dx, y - c.y) / c.r;
          if (d < 1) col = mix(col, [0, 0, 0], 0.28 * (1 - d * d));
          else if (d < 1.25) col = mix(col, [255, 255, 255], 0.15);
        }
      }
      const i = (y * W + x) * 4;
      img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const url = cv.toDataURL('image/png');
  cache.set(key, url);
  return url;
}

export const PLANET_TYPES = ['ocean', 'gas', 'rocky', 'lava', 'ice'];

/**
 * <Planet type hue seed size ring state />
 * state: 'open' | 'current' | 'done' | 'locked'
 */
export function Planet({ type = 'gas', hue = 220, seed = 1, size = 120, ring = false, state = 'open', moon = false, className = '' }) {
  const tex = useMemo(() => (typeof document === 'undefined' ? '' : texture(type, hue, seed)), [type, hue, seed]);
  const rid = useId().replace(/:/g, '');
  const glow = type === 'lava' ? 'hsl(20 100% 55% / .55)' : type === 'ice' ? 'hsl(190 90% 75% / .5)' : `hsl(${hue} 90% 62% / .5)`;
  const speed = 40 + (seed % 5) * 8;
  const ringSvg = (half) => (
    <svg className={'pring ' + half} viewBox="0 0 200 60" aria-hidden="true">
      <defs>
        <linearGradient id={rid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={`hsl(${hue + 40} 70% 75%)`} stopOpacity=".2" /><stop offset=".5" stopColor={`hsl(${hue + 40} 80% 85%)`} stopOpacity=".95" /><stop offset="1" stopColor={`hsl(${hue + 40} 70% 75%)`} stopOpacity=".2" />
        </linearGradient>
        <clipPath id={rid + half}><rect x="0" y={half === 'back' ? 0 : 30} width="200" height="30" /></clipPath>
      </defs>
      <g clipPath={`url(#${rid + half})`}>
        <ellipse cx="100" cy="30" rx="96" ry="22" fill="none" stroke={`url(#${rid})`} strokeWidth="9" />
        <ellipse cx="100" cy="30" rx="80" ry="17" fill="none" stroke={`url(#${rid})`} strokeWidth="4" opacity=".7" />
        <ellipse cx="100" cy="30" rx="70" ry="14" fill="none" stroke={`url(#${rid})`} strokeWidth="2" opacity=".5" />
      </g>
    </svg>
  );
  return (
    <span className={`planet3 ${state} ${className}`} style={{ '--s': size + 'px', '--glow': glow }}>
      {ring && ringSvg('back')}
      <span className="globe" style={{ backgroundImage: `url(${tex})`, animationDuration: speed + 's' }}>
        <span className="shade" />
      </span>
      {ring && ringSvg('front')}
      {moon && <span className="orbit" aria-hidden="true"><span className="moon" /></span>}
    </span>
  );
}
