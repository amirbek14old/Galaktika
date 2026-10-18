import { useEffect, useRef } from 'react';
import { reducedMotion } from '../lib/fx.js';

/** Twinkling star background (canvas, fixed behind the app). */
export default function Starfield() {
  const ref = useRef();
  useEffect(() => {
    const cv = ref.current, x = cv.getContext('2d');
    let W, H, stars = [], raf;
    const resize = () => {
      W = cv.width = innerWidth * devicePixelRatio; H = cv.height = innerHeight * devicePixelRatio;
      stars = Array.from({ length: Math.round((innerWidth * innerHeight) / 5000) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.3 + 0.3) * devicePixelRatio, p: Math.random() * 6.28, s: 0.5 + Math.random() * 1.5 }));
    };
    const draw = (t) => {
      x.clearRect(0, 0, W, H);
      for (const s of stars) { x.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(s.p + (t / 1000) * s.s * 0.6)); x.fillStyle = '#E2E8F0'; x.beginPath(); x.arc(s.x, s.y, s.r, 0, 6.28); x.fill(); }
      if (!reducedMotion()) raf = requestAnimationFrame(draw);
    };
    resize(); draw(0);
    addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="starfield" aria-hidden="true" />;
}
