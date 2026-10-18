import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import { useStore, update } from '../lib/store.js';
import { planetsFor, planetDone, subj, progressOf } from '../data/subjects.js';
import { tt } from '../data/titles.js';
import { theoryFor } from '../data/theory.js';
import { SubjGlyph, I, Html, icon, Mascot, useUI } from '../components/ui.jsx';
import { PlanCard } from './Plan.jsx';
import { Planet } from '../components/Planet.jsx';
import { RocketArt } from '../components/Cosmetics.jsx';
import { burst, sfx, reducedMotion } from '../lib/fx.js';
import { useT } from '../lib/i18n.js';
import { F } from '../lib/util.js';

/** The learning path: each term's topic is a planet; finishing a planet flies the rocket to the next one. */
export default function Galaxy() {
  const ui = useUI();
  const t = useT();
  const s = useStore();
  const S = subj(s.subj), planets = planetsFor(s.subj, s.grade);
  const pr = progressOf(s.subj, s.grade, s.done);
  const wrap = useRef(), pRefs = useRef({}), rocket = useRef();
  const [pos, setPos] = useState({});
  const [arrived, setArrived] = useState(null);

  const states = planets.map((p, i) => ({ done: planetDone(p, s.done), open: i === 0 || planetDone(planets[i - 1], s.done) }));
  const curIdx = states.findIndex((x) => x.open && !x.done);
  const flightKey = `${s.subj}-${s.grade}`;
  const flight = s.flight && s.flight.key === flightKey ? s.flight : null;
  const hour = new Date().getHours();
  const greetKey = hour < 12 ? 'greet.morning' : hour < 18 ? 'greet.day' : 'greet.evening';

  useLayoutEffect(() => {
    const measure = () => {
      const w = wrap.current?.getBoundingClientRect(); if (!w) return;
      const p = {};
      for (const [k, el] of Object.entries(pRefs.current)) { if (!el) continue; const r = el.getBoundingClientRect(); p[k] = { x: r.left - w.left + r.width / 2, y: r.top - w.top + r.height / 2, r: r.width / 2 }; }
      setPos(p);
    };
    measure(); const tm = setTimeout(measure, 300);
    addEventListener('resize', measure); return () => { clearTimeout(tm); removeEventListener('resize', measure); };
  }, [s.subj, s.grade, planets.length, curIdx]);

  useEffect(() => {
    if (!flight || !pos[flight.from] || s.streakUp) return;
    const to = flight.to && pos[flight.to];
    const finish = () => {
      update((st) => { st.flight = null; });
      if (to) {
        setArrived(flight.to); sfx.win();
        setTimeout(() => burst(pRefs.current[flight.to], true, 30), 50);
        ui.showModal(<NewPlanet title={tt(flight.title, t.lang)} done={tt(flight.done, t.lang)} onGo={ui.closeModal} />);
      } else ui.showModal(<NewPlanet allDone done={tt(flight.done, t.lang)} onGo={() => { ui.closeModal(); ui.go('subjects'); }} />);
    };
    if (!to || reducedMotion()) { finish(); return; }
    const from = pos[flight.from], el = rocket.current;
    pRefs.current[flight.to]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    sfx.warp();
    const cx = (from.x + to.x) / 2 + (from.x < to.x ? -120 : 120), cy = (from.y + to.y) / 2;
    const t0 = performance.now(), D = 1900; let raf, last = from;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / D), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const x = (1 - e) ** 2 * from.x + 2 * (1 - e) * e * cx + e * e * to.x, y = (1 - e) ** 2 * from.y + 2 * (1 - e) * e * cy + e * e * to.y;
      const ang = (Math.atan2(y - last.y, x - last.x) * 180) / Math.PI + 90; last = { x, y };
      if (el) { el.style.transform = `translate(${x - 24}px, ${y - 24}px) rotate(${ang}deg)`; el.classList.add('flying'); }
      if (k < 1) raf = requestAnimationFrame(step); else { el?.classList.remove('flying'); finish(); }
    };
    const start = setTimeout(() => (raf = requestAnimationFrame(step)), 500);
    return () => { clearTimeout(start); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight?.from, flight?.to, pos[flight?.from]?.x, !!s.streakUp]);

  useEffect(() => {
    if (!s.justDone) return;
    const l = planets.flatMap((p) => p.lessons).find((x) => x.id === s.justDone);
    if (l) setTimeout(() => burst(pRefs.current[l.planet], true, 14), 300);
    update((st) => { st.justDone = null; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const park = flight ? pos[flight.from] : pos[planets[curIdx]?.t];
  const rocketStyle = park ? { transform: `translate(${park.x + park.r * 0.75}px, ${park.y - park.r - 34}px) rotate(20deg)` } : { opacity: 0 };
  const path = planets.map((p) => pos[p.t]).filter(Boolean).map((p, i, arr) => {
    if (!i) return `M${p.x} ${p.y}`;
    const q = arr[i - 1], mx = (q.x + p.x) / 2 + (i % 2 ? 90 : -90);
    return `Q${mx} ${(q.y + p.y) / 2} ${p.x} ${p.y}`;
  }).join(' ');

  const openPlanet = (p, i, tab = 'missions') => {
    if (!states[i].open) { ui.toast(t('finishFirst', { p: tt(planets[i - 1].title, t.lang) })); sfx.bad(); return; }
    sfx.tap(3);
    ui.showModal(<PlanetSheet p={p} S={S} grade={s.grade} startTab={tab} />);
  };
  const cur = planets[curIdx];

  return (
    <div className="wrap">
      <section className="hello">
        <Mascot mood="happy" className="hello-mascot" />
        <div className="hello-bubble">
          <h1>{t(greetKey, { name: s.child })}</h1>
          <p className="hand">{cur ? t('greet.sub', { p: tt(cur.title, t.lang) }) : t('greet.done')}</p>
        </div>
      </section>
      <PlanCard />
      <div className="course card">
        <SubjGlyph s={S} />
        <div className="meta"><small className="muted">{t('grade', { n: s.grade })} · {t('missionsOf', { a: pr.done, b: pr.total })}</small><h2>{t('subj.' + S.id)}</h2>
          <div className="pbar g" style={{ marginTop: 8 }}><div style={{ width: (pr.done / pr.total) * 100 + '%' }} /></div></div>
        <button className="btn ghost sm" onClick={() => ui.go('subjects')}>{t('change')}</button>
      </div>
      {s.subj === 'math' && s.grade >= 5 && s.grade <= 6 && (
        <div className="cta-diag card">
          <I n="diag" />
          <div><b>{t('diagCta.title')}</b><p className="muted">{t('diagCta.text')}</p></div>
          <button className="btn blue sm" onClick={() => ui.go('diagnostic')}>{t('start')}</button>
        </div>
      )}
      <div className="galaxy" ref={wrap}>
        <svg className="route" aria-hidden="true"><path d={path} /></svg>
        {planets.map((p, i) => {
          const st = states[i], done = p.lessons.filter((l) => s.done[l.id]).length;
          const state = st.done ? 'done' : st.open ? (i === curIdx ? 'current' : 'open') : 'locked';
          return (
            <div key={p.t} className={'prow ' + (i % 2 ? 'right' : 'left')}>
              <button className={'pbtn ' + state + (arrived === p.t ? ' arrived' : '')} onClick={() => openPlanet(p, i)}
                aria-label={`${t('term', { n: p.t })}: ${tt(p.title, t.lang)}. ${st.done ? t('planetDone') : st.open ? t('missionsOf', { a: done, b: p.lessons.length }) : t('locked')}`}>
                <span ref={(el) => (pRefs.current[p.t] = el)} className="pwrap">
                  <Planet type={p.type} hue={p.hue} seed={p.seed} ring={p.ring} size={i === curIdx ? 150 : 124} state={state} moon={i === curIdx} />
                  {st.done && <span className="flag" aria-hidden="true"><Html html={icon('check')} /></span>}
                  {!st.open && <span className="plock" aria-hidden="true"><Html html={icon('lock')} /></span>}
                </span>
              </button>
              <div className="plabel">
                <small>{t('term', { n: p.t })}</small>
                <b>{tt(p.title, t.lang)}</b>
                <span className="moons" aria-hidden="true">{p.lessons.map((l) => <i key={l.id} className={s.done[l.id] ? 'on' : ''} />)}</span>
                <span className="muted">{st.done ? t('planetDone') : st.open ? t('missionsOf', { a: done, b: p.lessons.length }) : t('locked')}</span>
                {st.open && theoryFor(s.subj, p.title) && <button className="theory-link" onClick={() => openPlanet(p, i, 'theory')}><I n="book" />{t('theory')}</button>}
                {i === curIdx && <span className="here hand" aria-hidden="true"><svg viewBox="0 0 60 30"><path d="M4 22 C 18 4, 36 4, 54 16" /><path d="M46 8 L54 16 L44 20" /></svg>{t('youAreHere')}</span>}
              </div>
            </div>
          );
        })}
        <div className="rocket" ref={rocket} style={rocketStyle} aria-hidden="true"><RocketArt skin={s.equip.rocket} /></div>
      </div>
    </div>
  );
}

function PlanetSheet({ p, S, grade, startTab }) {
  const ui = useUI();
  const t = useT();
  const done = useStore((s) => s.done);
  const [tab, setTab] = useState(startTab);
  const th = theoryFor(S.id, p.title);
  const start = (l) => { ui.closeModal(); ui.openLesson({ lesson: l, qs: l.make(), xp: done[l.id] ? 5 : 10 }); };
  return (
    <>
      <div className="sheet-planet">
        <Planet type={p.type} hue={p.hue} seed={p.seed} ring={p.ring} size={96} state="open" />
        <div><small className="muted">{t('subj.' + S.id)} · {t('grade', { n: grade })} · {t('term', { n: p.t })}</small><h2>{tt(p.title, t.lang)}</h2></div>
      </div>
      {th && <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'missions'} className={tab === 'missions' ? 'on' : ''} onClick={() => setTab('missions')}>{t('missions')}</button>
        <button role="tab" aria-selected={tab === 'theory'} className={tab === 'theory' ? 'on' : ''} onClick={() => setTab('theory')}>{t('theory')}</button>
      </div>}
      {tab === 'theory' && th ? (
        <div className="theory">
          {t('theoryRu') && <p className="note">{t('theoryRu')}</p>}
          <ol>{th.p.map((x, i) => <li key={i}><span className="num hand">{i + 1}</span><Html html={F(x)} /></li>)}</ol>
          <div className="example"><b className="hand">{t('example')}</b><Html as="p" html={F(th.ex)} /></div>
          <button className="btn wide" onClick={() => setTab('missions')}>{t('missions')} →</button>
        </div>
      ) : (
        <div className="missions">
          {p.lessons.map((l, i) => {
            const d = !!done[l.id], open = i === 0 || done[p.lessons[i - 1].id];
            return (
              <div key={l.id} className={'mission' + (d ? ' done' : open ? '' : ' locked')}>
                <span className="mi"><Html html={icon(d ? 'check' : open ? 'star' : 'lock')} /></span>
                <div><b>{t('mission', { n: i + 1 })}: {tt(l.title, t.lang)}</b><small className="muted">{d ? t('missionDone') : open ? t('missionReady') : t('missionLocked')}</small></div>
                <button className={'btn sm' + (d ? ' ghost' : '')} disabled={!open} onClick={() => start(l)}>{d ? t('replay') : t('go')}</button>
              </div>
            );
          })}
        </div>
      )}
      <button className="btn ghost wide" onClick={ui.closeModal}>{t('close')}</button>
    </>
  );
}

function NewPlanet({ title, done, allDone, onGo }) {
  const t = useT();
  return (
    <>
      <div className="sheet-h"><Mascot mood="wow" /><div><span className="chip ok">{t('planetPassed', { p: done })}</span><h2 style={{ marginTop: 6 }}>{allDone ? t('allPlanets') : t('newPlanet', { p: title })}</h2></div></div>
      <p>{allDone ? t('allDoneText') : t('landed')} <span className="hand accent">{t('planetBonus')}</span></p>
      <button className="btn wide" autoFocus onClick={onGo}>{allDone ? t('pickSubject') : t('forward')}</button>
    </>
  );
}
