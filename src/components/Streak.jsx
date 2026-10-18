import { useEffect, useRef, useState } from 'react';
import { Meteor } from './Cosmetics.jsx';
import { useT } from '../lib/i18n.js';
import { useStore } from '../lib/store.js';
import { dayKey } from '../lib/util.js';
import { reducedMotion, sfx } from '../lib/fx.js';

/** Burning meteor drawn on canvas: flies in from the top-right, then hovers and keeps burning. */
function MeteorCanvas({ onLanded }) {
  const ref = useRef();
  useEffect(() => {
    const cv = ref.current, x = cv.getContext('2d');
    const dpr = devicePixelRatio || 1;
    const W = (cv.width = innerWidth * dpr), H = (cv.height = innerHeight * dpr);
    const from = { x: W + 60 * dpr, y: -60 * dpr }, to = { x: W * 0.5, y: H * 0.34 };
    const dir = Math.atan2(to.y - from.y, to.x - from.x);
    const P = []; let raf, t0 = performance.now(), landed = false;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 1300), e = 1 - Math.pow(1 - k, 3);
      const hx = from.x + (to.x - from.x) * e, hy = from.y + (to.y - from.y) * e;
      if (k >= 1 && !landed) { landed = true; onLanded && onLanded(); }
      const speed = k < 1 ? 7 : 3.2;
      for (let i = 0; i < (k < 1 ? 16 : 9); i++) {
        const a = dir + Math.PI + (Math.random() - 0.5) * 0.5, v = (Math.random() * 2 + speed) * dpr;
        P.push({ x: hx + (Math.random() - 0.5) * 10 * dpr, y: hy + (Math.random() - 0.5) * 10 * dpr, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, r: (Math.random() * 4 + 3) * dpr });
      }
      x.clearRect(0, 0, W, H);
      x.globalCompositeOperation = 'lighter';
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i]; p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.vy *= 0.97; p.life -= 0.022; p.r *= 0.985;
        if (p.life <= 0) { P.splice(i, 1); continue; }
        const l = p.life;
        const col = l > 0.75 ? `rgba(255,248,220,${l * 0.55})` : l > 0.45 ? `rgba(255,160,60,${l * 0.5})` : `rgba(150,95,75,${l * 0.35})`;
        x.fillStyle = col; x.beginPath(); x.arc(p.x, p.y, p.r * (l > 0.45 ? 1.2 : 2.4 - l), 0, 6.283); x.fill();
      }
      const g = x.createRadialGradient(hx, hy, 0, hx, hy, 46 * dpr);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,236,170,.95)'); g.addColorStop(0.6, 'rgba(255,140,40,.5)'); g.addColorStop(1, 'rgba(255,90,20,0)');
      x.fillStyle = g; x.beginPath(); x.arc(hx, hy, 46 * dpr, 0, 6.283); x.fill();
      x.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <canvas ref={ref} className="meteor-canvas" aria-hidden="true" />;
}

/** Shown when the day streak grows. */
export function StreakCelebration({ n, onClose }) {
  const t = useT();
  const [landed, setLanded] = useState(reducedMotion());
  useEffect(() => { sfx.whoosh(); }, []);
  return (
    <div className="streak-celebrate" role="dialog" aria-modal="true" aria-label={t('streak.title')}>
      {!reducedMotion() && <MeteorCanvas onLanded={() => { setLanded(true); sfx.win(); }} />}
      {reducedMotion() && <div className="sc-static"><Meteor size={180} /></div>}
      <div className={'sc-text' + (landed ? ' in' : '')}>
        <div className="sc-num">{n}</div>
        <h2>{t('streak.up', { n: '', d: t.pl('day', n) }).trim()}</h2>
        <p>{t('streak.upText')}</p>
        <button className="btn" autoFocus onClick={onClose}>{t('streak.cool')}</button>
      </div>
    </div>
  );
}

/** Streak details (opened from the header meteor). */
export function StreakSheet() {
  const t = useT();
  const s = useStore();
  const lit = s.lastDay === dayKey();
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return { k: dayKey(d), w: t.list('dow')[d.getDay()], today: i === 6 }; });
  return (
    <>
      <div className="streak-hero">
        <Meteor size={120} lit={lit} className="big" />
        <div><div className="streak-num">{s.streak}</div><b>{t.pl('day', s.streak)} {t('inRowW')}</b></div>
      </div>
      <h2>{t('streak.title')}</h2>
      <p>{t('streak.text')}</p>
      <div className="streak-week" aria-label={t('streak.week')}>
        {days.map((d) => (
          <div key={d.k} className={'sw-day' + (s.hist[d.k] ? ' on' : '') + (d.today ? ' today' : '')}>
            {s.hist[d.k] ? <Meteor size={30} /> : <span className="sw-dot" />}
            <small>{d.w}</small>
          </div>
        ))}
      </div>
      <p className="muted small">{lit ? t('streak.lit') : t('streak.notLit')} {s.freezes > 0 && t('streak.freezes', { n: s.freezes })}</p>
    </>
  );
}
