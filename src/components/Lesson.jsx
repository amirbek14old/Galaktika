import { useEffect, useRef, useState, useCallback } from 'react';
import QuestionBody from './QuestionBody.jsx';
import { Html, I, Mascot, icon, useUI } from './ui.jsx';
import { Crystal } from './Cosmetics.jsx';
import { initAnswer, isReady, evaluate, answerHTML, prep } from '../lib/questions.js';
import { update, getState, recordEvidence, addXP, addGems, unlock, useStore } from '../lib/store.js';
import { MIS, REM } from '../data/fractions.js';
import { planetsFor, planetDone } from '../data/subjects.js';
import { tt } from '../data/titles.js';
import { sfx, burst, flash, floaty, confetti, reducedMotion, coinFly } from '../lib/fx.js';
import { ch } from '../lib/util.js';
import { useT } from '../lib/i18n.js';

/** Full-screen lesson player ("mission"). cfg: { lesson?, qs, xp, trap? } */
export default function Lesson({ cfg, onClose }) {
  const ui = useUI();
  const t = useT();
  const hearts = useStore((s) => s.hearts);
  const gems = useStore((s) => s.gems);
  const [shownGems, setShownGems] = useState(gems);
  const [st, setSt] = useState(() => {
    const queue = cfg.qs.map(prep);
    return { queue: queue.slice(1), q: queue[0], total: queue.length, solved: 0, mistakes: 0, combo: 0, best: 0, remAdded: {}, t0: Date.now() };
  });
  const [a, setA] = useState(() => initAnswer(st.q));
  const [phase, setPhase] = useState('answer'); // answer | checked | hearts | result
  const [res, setRes] = useState(null);
  const [react, setReact] = useState(null);
  const [result, setResult] = useState(null);
  const barRef = useRef(), heartRef = useRef(), gemRef = useRef(), qRef = useRef(), btnRef = useRef(), footRef = useRef();

  const concept = (q) => q.c || cfg.lesson?.concept;

  const applyResult = useCallback((r, skipped) => {
    const q = st.q;
    update((s) => {
      s.stats.answered++;
      if (r.ok) {
        s.stats.correct++;
        recordEvidence(s, concept(q), true, q.id || q.prompt);
        if (q.remed) { const m = s.mis[q.remed] || (s.mis[q.remed] = { wrong: 0, fixed: 0 }); m.fixed++; }
      } else {
        s.hearts = Math.max(0, s.hearts - 1);
        if (!skipped) recordEvidence(s, r.mis ? MIS[r.mis].concept : concept(q), false, q.id || q.prompt);
        if (r.mis) { const m = s.mis[r.mis] || (s.mis[r.mis] = { wrong: 0, fixed: 0 }); m.wrong++; }
      }
    });
    setSt((p) => {
      const n = { ...p };
      if (r.ok) { n.solved++; n.combo++; n.best = Math.max(n.best, n.combo); }
      else {
        n.mistakes++; n.combo = 0;
        n.queue = [...p.queue, prep(q)];
        if (r.mis && !q.remed && !p.remAdded[r.mis] && REM[r.mis]) {
          n.remAdded = { ...p.remAdded, [r.mis]: 1 };
          n.queue = [n.queue[0], prep({ ...REM[r.mis], remed: r.mis }), ...n.queue.slice(1)].filter(Boolean);
          n.total++;
        }
      }
      return n;
    });
    setRes({ ...r, skipped }); setPhase('checked');
    if (r.ok) {
      sfx.ok(); burst(qRef.current?.querySelector('.good, .okc, .eq, .shade-box') || qRef.current, true);
      const bw = barRef.current; if (bw) { bw.classList.remove('glow'); void bw.offsetWidth; bw.classList.add('glow'); }
      floaty(barRef.current, '+1', 'var(--green)');
    } else {
      sfx.bad(); flash();
      const h = heartRef.current; if (h) { h.classList.remove('hit'); void h.offsetWidth; h.classList.add('hit'); floaty(h, '−1', 'var(--red)', true); }
    }
    setReact({ ok: r.ok, text: ch(t.list(r.ok ? 'cheer' : 'oops')), k: Date.now() });
    setTimeout(() => btnRef.current?.focus(), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.q, t.lang]);

  const check = (skipped) => {
    if (phase !== 'answer') return;
    applyResult(skipped ? { ok: false, mis: null } : evaluate(st.q, a), skipped);
  };

  const next = () => {
    setReact(null);
    if (getState().hearts <= 0) { setPhase('hearts'); return; }
    if (!st.queue.length) return finish();
    const [q, ...rest] = st.queue;
    setSt((p) => ({ ...p, q, queue: rest }));
    setA(initAnswer(q)); setRes(null); setPhase('answer');
  };

  const finish = () => {
    const secs = Math.round((Date.now() - st.t0) / 1000), acc = Math.round((st.total / (st.total + st.mistakes)) * 100);
    const l = cfg.lesson, perfect = st.mistakes === 0;
    const xp = cfg.xp + (perfect ? 5 : 0);
    let flight = null, earned = 0;
    setShownGems(getState().gems);
    update((s) => {
      const first = l ? !s.done[l.id] : false;
      earned = (cfg.trap ? 3 : first ? 5 : 2) + (perfect ? 3 : 0);
      addXP(s, xp); s.stats.secs += secs;
      if (st.best >= 5) unlock(s, 'no-miss');
      if (l) {
        s.done[l.id] = true;
        if (first) s.justDone = l.id;
        const planets = planetsFor(l.subj, l.grade), p = planets.find((x) => x.t === l.planet);
        if (first && p && planetDone(p, s.done)) {
          earned += 15;
          unlock(s, 'first-planet');
          const nextP = planets.find((x) => x.t === l.planet + 1);
          flight = { key: `${l.subj}-${l.grade}`, from: l.planet, to: nextP ? nextP.t : null, title: nextP?.title || null, done: p.title };
        }
      }
      addGems(s, earned);
    });
    setResult({ xp, acc, secs, flight, perfect, earned });
    setPhase('result'); sfx.win(); confetti();
  };

  // crystals fly into the wallet once the result is shown
  useEffect(() => {
    if (phase !== 'result' || !result) return;
    const tm = setTimeout(() => coinFly(qRef.current?.querySelector('.rt.gems'), gemRef.current, result.earned, () => {
      setShownGems(getState().gems);
      const g = gemRef.current; if (g) { g.classList.remove('hit'); void g.offsetWidth; g.classList.add('hit'); }
    }), 700);
    return () => clearTimeout(tm);
  }, [phase, result]);

  useEffect(() => { if (phase !== 'result') setShownGems(gems); }, [gems, phase]);

  useEffect(() => {
    const onKey = (e) => {
      if (document.querySelector('.modal')) return;
      if (e.key === 'Enter') { const b = btnRef.current; if (b && !b.disabled) { e.preventDefault(); b.click(); } }
      else if (e.key === 'Escape') onClose();
      else if (phase === 'answer' && /^[1-9]$/.test(e.key) && document.activeElement.tagName !== 'INPUT' && (st.q.options || st.q.type === 'compare')) {
        const i = +e.key - 1; if ((st.q.options && i < st.q.options.length) || (st.q.type === 'compare' && i < 3)) setA({ sel: i });
      }
    };
    addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey);
  });

  const ready = phase === 'answer' && st.q.type !== 'match' && isReady(st.q, a);
  const doneCls = phase === 'checked' ? (res?.ok ? ' done-ok' : ' done-bad') : '';
  const pct = phase === 'result' ? 100 : (st.solved / st.total) * 100;

  let btn;
  if (phase === 'answer') btn = <button ref={btnRef} className="btn" disabled={!ready} onClick={() => check(false)}>{t('check')}</button>;
  else if (phase === 'checked') btn = <button ref={btnRef} className={'btn' + (res.ok ? '' : ' red')} onClick={next}>{res.ok ? t('continue') : t('gotit')}</button>;
  else if (phase === 'hearts') btn = <button ref={btnRef} className="btn blue" onClick={() => { update((s) => { s.hearts = 5; }); setPhase('checked'); setTimeout(next, 0); }}>{t('restoreHearts')}</button>;
  else btn = <button ref={btnRef} className="btn" onClick={() => onClose(result)}>{result?.flight?.to ? t('flyOn') : t('continue')}</button>;

  const q = st.q;
  if (typeof window !== 'undefined') window.__galaktikaQ = q; // used by automated UI tests
  const praise = useRef(ch(t.list('praise')));
  useEffect(() => { praise.current = ch(t.list('praise')); }, [st.q]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={'lesson' + doneCls} role="dialog" aria-label="Lesson">
      <header className="l-head">
        <button className="icon-btn" onClick={() => onClose()} aria-label={t('leave')}><I n="close" /></button>
        <div className="l-bar" ref={barRef} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin="0" aria-valuemax="100"><div style={{ width: pct + '%' }} /></div>
        <span className="stat gem" ref={gemRef} title={t('crystalsW')}><Crystal size={22} />{shownGems}</span>
        <span className="stat heart" ref={heartRef} title={t('hearts')}><I n="heart" />{hearts}</span>
      </header>
      <div className="l-body" ref={qRef}>
        {phase === 'hearts' ? (
          <div className="q out"><Mascot mood="sad" /><h2 className="q-title">{t('heartsOut')}</h2><p className="muted" style={{ maxWidth: '40ch', lineHeight: 1.5 }}>{t('heartsText')}</p></div>
        ) : phase === 'result' ? (
          <Result r={result} trap={cfg.trap} t={t} />
        ) : (
          <QuestionBody q={q} a={a} setA={setA} phase={phase} res={res}
            tag={q.remed ? <span className="chip trapc">{t('fixingTrap')}</span> : null}
            onMatchDone={() => applyResult({ ok: true, mis: null })}
            onMatchMiss={() => setSt((p) => ({ ...p, mistakes: p.mistakes + 1, combo: 0 }))} />
        )}
      </div>
      <footer className="l-foot" ref={footRef} aria-live="polite">
        <div className="l-foot-in">
          <div className="fb">
            {phase === 'checked' && res.ok && <><Html className="badge" html={icon('okBig')} /><div><h3>{q.remed ? t('trapFixed') : praise.current} {st.combo >= 3 && <span className="combo"><I n="fire" />{t('inRow', { n: st.combo })}</span>}</h3></div></>}
            {phase === 'checked' && !res.ok && <><Html className="badge" html={icon('badBig')} /><div style={{ minWidth: 0 }}>
              <h3>{res.skipped ? t('skipped') : t('wrong')}</h3>
              <div className="ans">{t('correctAnswer')} <Html html={answerHTML(q)} /></div>
              {res.mis && <div className="diag"><span>{t('trapLike', { t: MIS[res.mis].name })}</span><button className="diag-btn" onClick={() => ui.explainTrap(res.mis, true)}>{t('why')}</button></div>}
            </div></>}
          </div>
          <div className="l-actions">
            {phase === 'answer' && q.type !== 'match' && <button className="btn ghost" onClick={() => check(true)}>{t('skip')}</button>}
            {btn}
          </div>
        </div>
      </footer>
      {react && phase === 'checked' && !reducedMotion() && (
        <div key={react.k} className={'react ' + (react.ok ? 'jump' : 'sad')} style={{ bottom: (footRef.current?.offsetHeight || 160) + 8 }} aria-hidden="true">
          <div className="bub">{react.text}</div><Mascot mood={react.ok ? 'happy' : 'sad'} />
        </div>
      )}
    </div>
  );
}

function Result({ r, trap, t }) {
  const [n, setN] = useState({ xp: 0, acc: 0, earned: 0 });
  useEffect(() => {
    if (reducedMotion()) { setN(r); return; }
    const t0 = performance.now(); let raf;
    const f = (tm) => { const p = Math.min(1, (tm - t0) / 800), e = 1 - Math.pow(1 - p, 3); setN({ xp: Math.round(r.xp * e), acc: Math.round(r.acc * e), earned: Math.round(r.earned * e) }); if (p < 1) raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf);
  }, [r]);
  const lang = t.lang;
  return (
    <div className="q res">
      <Mascot mood="wow" className="bounce" />
      <h2>{trap ? t('trapDoneH') : r.flight ? t('planetDoneH', { p: tt(r.flight.done, lang) }) : t('missionDoneH')}</h2>
      <p className="muted">{r.flight?.to ? t('nextStop', { p: tt(r.flight.title, lang) }) : r.perfect ? t('perfect') : t('keepGoing')}</p>
      <div className="res-tiles">
        <div className="rt gems" style={{ '--c': '#22D3EE' }}><small>{t('crystalsW')}</small><b><Crystal size={20} /> +{n.earned}</b></div>
        <div className="rt" style={{ '--c': 'var(--yellow)' }}><small>{t('xp')}</small><b>+{n.xp}</b></div>
        <div className="rt" style={{ '--c': 'var(--green)' }}><small>{t('accuracy')}</small><b>{n.acc}%</b></div>
      </div>
    </div>
  );
}
