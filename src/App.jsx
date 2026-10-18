import { useEffect, useState, useCallback } from 'react';
import { UI, I, Html, Mascot, SubjGlyph, icon } from './components/ui.jsx';
import Starfield from './components/Starfield.jsx';
import Lesson from './components/Lesson.jsx';
import { Crystal, Meteor } from './components/Cosmetics.jsx';
import { StreakCelebration, StreakSheet } from './components/Streak.jsx';
import Galaxy from './pages/Galaxy.jsx';
import Subjects from './pages/Subjects.jsx';
import Diagnostic from './pages/Diagnostic.jsx';
import KnowledgeMap from './pages/KnowledgeMap.jsx';
import Online from './pages/Online.jsx';
import Shop from './pages/Shop.jsx';
import Parents from './pages/Parents.jsx';
import Profile from './pages/Profile.jsx';
import { useStore, update, onAchievement } from './lib/store.js';
import { subj } from './data/subjects.js';
import { MIS } from './data/fractions.js';
import { CONCEPTS } from './data/concepts.js';
import { status } from './lib/diagnostic.js';
import { TUTORS, slotDate } from './data/tutors.js';
import { F, dayKey } from './lib/util.js';
import { sfx } from './lib/fx.js';
import { useT, tr, LANGS } from './lib/i18n.js';
import { getState } from './lib/store.js';

const PAGES = {
  galaxy: { icon: 'galaxy', C: Galaxy },
  subjects: { icon: 'menu', C: Subjects },
  diagnostic: { icon: 'diag', C: Diagnostic, short: 'navs.diagnostic' },
  map: { icon: 'map', C: KnowledgeMap, short: 'navs.map' },
  online: { icon: 'live', C: Online, short: 'navs.online' },
  shop: { icon: 'shop', C: Shop },
  parents: { icon: 'parents', C: Parents },
  profile: { icon: 'user', C: Profile }
};
const MOBILE = ['galaxy', 'subjects', 'diagnostic', 'shop'];
const MORE = ['map', 'online', 'parents', 'profile'];

export default function App() {
  const t = useT();
  const initial = location.hash.slice(1);
  const [page, setPage] = useState(PAGES[initial] ? initial : 'galaxy');
  const [params, setParams] = useState(null);
  const [modal, setModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [lesson, setLesson] = useState(null);
  const s = useStore();

  const go = useCallback((p, prm = null) => {
    setPage(p); setParams(prm); setModal(null);
    try { history.replaceState(null, '', '#' + p); } catch (e) { /* sandboxed */ }
    scrollTo(0, 0);
  }, []);
  const toast = useCallback((text, kind) => { const id = Math.random(); setToasts((x) => [...x, { id, text, kind }]); setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 2800); }, []);
  const showModal = useCallback((node) => setModal(node), []);
  const closeModal = useCallback(() => setModal(null), []);
  const explainTrap = useCallback((k, inLesson) => {
    const m = MIS[k];
    setModal(<>
      <div className="sheet-h"><Mascot mood="wow" /><div><span className="chip trapc">{m.name}</span></div></div>
      <Html as="p" html={F(m.text)} />
      <Html as="div" className="ex-vis" html={m.vis()} />
      {inLesson && <p className="tip">{m.short}</p>}
      <button className="btn wide" autoFocus onClick={() => setModal(null)}>OK</button>
    </>);
  }, []);
  const openLesson = useCallback((cfg) => { setLesson(cfg); sfx.tap(6); }, []);

  useEffect(() => { onAchievement((id) => { toast(tr(getState().lang, 'ach.toast', { x: tr(getState().lang, 'ach.' + id).split('|')[0] }) + '  +10 ◆', 'ach'); sfx.win(); }); }, [toast]);
  useEffect(() => { document.body.style.overflow = lesson || modal ? 'hidden' : ''; }, [lesson, modal]);
  useEffect(() => { document.documentElement.lang = s.lang; }, [s.lang]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && modal) setModal(null); };
    addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey);
  }, [modal]);

  const ui = { go, toast, showModal, closeModal, explainTrap, openLesson };
  const Page = PAGES[page].C;
  const S = subj(s.subj);
  const label = (k, short) => t(short && PAGES[k].short ? PAGES[k].short : 'nav.' + k);
  const navBtn = (k, short) => (
    <button key={k} className={'nav-btn' + (page === k ? ' on' : '')} onClick={() => go(k)} aria-current={page === k ? 'page' : undefined}>
      <I n={PAGES[k].icon} /><span>{label(k, short)}</span>
    </button>
  );
  const openMore = () => setModal(<>
    <h2>{t('nav.more')}</h2>
    <div className="more-grid">{MORE.map((k) => <button key={k} className="more-item" onClick={() => go(k)}><I n={PAGES[k].icon} /><span>{t('nav.' + k)}</span></button>)}</div>
    <LangSwitch />
  </>);
  const showStreakUp = s.streakUp && !lesson && Date.now() - s.streakUp.at < 60000;

  return (
    <UI.Provider value={ui}>
      <Starfield />
      <div className="app">
        <aside className="side" aria-label="Menu">
          <div className="logo"><Logo />Galaktika</div>
          <nav>{Object.keys(PAGES).map((k) => navBtn(k))}</nav>
          <div className="side-foot"><LangSwitch /></div>
        </aside>
        <div className="center">
          <header className="top">
            <button className="course-pill" onClick={() => go('subjects')}><SubjGlyph s={S} size={28} /><span>{t('gradeShort', { n: s.grade })}</span></button>
            <Stats s={s} />
          </header>
          <main className="main" key={page + JSON.stringify(params) + s.lang}><Page params={params} /></main>
        </div>
        <Rail s={s} go={go} />
      </div>
      <nav className="bnav" aria-label="Navigation">
        {MOBILE.map((k) => navBtn(k, true))}
        <button className={'nav-btn' + (MORE.includes(page) ? ' on' : '')} onClick={openMore}><I n="more" /><span>{t('nav.more')}</span></button>
      </nav>

      {lesson && <Lesson cfg={lesson} onClose={(r) => { setLesson(null); if (r?.flight) update((x) => { x.flight = r.flight; }); if (r && page !== 'galaxy' && lesson.lesson) go('galaxy'); }} />}
      {modal && <div className="modal" onClick={(e) => e.target === e.currentTarget && setModal(null)}><div className="sheet" role="dialog" aria-modal="true">{modal}</div></div>}
      {showStreakUp && <StreakCelebration n={s.streakUp.n} onClose={() => update((x) => { x.streakUp = null; })} />}
      <div className="toasts" aria-live="polite">{toasts.map((x) => <div key={x.id} className={'toast ' + (x.kind || '')}>{x.kind === 'ach' && <Html className="medal" html={icon('medal')} />}{x.text}</div>)}</div>
      <div id="fx" aria-hidden="true" />
    </UI.Provider>
  );

  function Stats({ s: st }) {
    const lit = st.lastDay === dayKey();
    return (
      <div className="stats">
        <button className={'stat streak ' + (lit ? 'fire' : 'off')} title={t('streak')} onClick={() => setModal(<StreakSheet />)}><Meteor size={30} lit={lit} />{st.streak}</button>
        <button className="stat gem" title={t('crystalsW')} onClick={() => go('shop')}><Crystal size={22} />{st.gems}</button>
        <span className="stat heart" title={t('hearts')}><I n="heart" />{st.hearts}</span>
      </div>
    );
  }
}

function LangSwitch() {
  const lang = useStore((s) => s.lang);
  return (
    <div className="seg lang" role="group" aria-label="Language">
      {LANGS.map(([k, full, short]) => <button key={k} title={full} className={lang === k ? 'on' : ''} aria-pressed={lang === k} onClick={() => update((x) => { x.lang = k; })}>{short}</button>)}
    </div>
  );
}

const Logo = () => <svg viewBox="0 0 40 40" aria-hidden="true"><defs><radialGradient id="lg" cx="35%" cy="35%"><stop offset="0" stopColor="#A5B4FC" /><stop offset=".6" stopColor="#4F7CFF" /><stop offset="1" stopColor="#3730A3" /></radialGradient></defs><circle cx="20" cy="20" r="11" fill="url(#lg)" /><ellipse cx="20" cy="20" rx="19" ry="6" fill="none" stroke="#22D3EE" strokeWidth="2.6" transform="rotate(-22 20 20)" /></svg>;

function Rail({ s, go }) {
  const t = useT();
  const todayXP = s.hist[dayKey()] || 0, goal = 20;
  const counts = CONCEPTS.reduce((a, c) => { const k = status(s.concepts[c.id]?.c, s.concepts[c.id]?.w); a[k] = (a[k] || 0) + 1; return a; }, {});
  const nb = Object.keys(s.booked).filter((k) => s.booked[k]).map((k) => { const [ti, si] = k.split('-').map(Number); return { tu: TUTORS[ti], sl: TUTORS[ti]?.slots[si] }; }).filter((x) => x.sl).sort((a, b) => a.sl[0] - b.sl[0])[0];
  const lit = s.lastDay === dayKey();
  return (
    <aside className="rail">
      <div className="rail-top">
        <button className="stat streak fire" onClick={() => go('profile')} title={t('streak')}><Meteor size={34} lit={lit} />{s.streak}</button>
        <button className="stat gem" onClick={() => go('shop')} title={t('crystalsW')}><Crystal size={24} />{s.gems}</button>
        <span className="stat heart" title={t('hearts')}><I n="heart" />{s.hearts}</span>
      </div>
      <div className="card"><h3>{t('rail.daily')}</h3>
        <div className="goal"><I n="bolt" /><div style={{ flex: 1 }}><div className="muted small" style={{ marginBottom: 6 }}>{t('rail.dailyText', { n: goal })}</div><div className="pbar"><div style={{ width: Math.min(100, (todayXP / goal) * 100) + '%' }} /></div></div><b>{Math.min(todayXP, goal)}/{goal}</b></div>
      </div>
      <div className="card shop-card"><Crystal size={44} className="spin" /><div><h3>{t('nav.shop')}</h3><p className="muted small">{t('rail.shop', { n: s.gems })}</p></div>
        <button className="btn blue wide" onClick={() => go('shop')}>{t('open')}</button></div>
      <div className="card"><h3>{t('nav.map')}</h3>
        <p className="muted small" style={{ marginBottom: 12 }}>{t('rail.map', { a: counts.mastered || 0, b: CONCEPTS.length })}{counts.gap ? t('rail.gaps', { n: counts.gap }) : ''}</p>
        <button className="btn ghost wide" onClick={() => go('map')}>{t('rail.openMap')}</button>
      </div>
      <div className="card"><h3>{t('online.card')}</h3>
        {nb ? <p className="muted small" style={{ marginBottom: 12 }}>{t('online.youBooked')} <b className="fg">{nb.sl[2]}</b><br />{slotDate(nb.sl[0], t)}, {nb.sl[1]} · {nb.tu.n}</p> : <p className="muted small" style={{ marginBottom: 12 }}>{t('online.cardText')}</p>}
        <button className="btn ghost wide" onClick={() => go('online')}>{nb ? t('online.schedule') : t('online.pick')}</button>
      </div>
    </aside>
  );
}
