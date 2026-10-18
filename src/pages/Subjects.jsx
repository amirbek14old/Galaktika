import { useStore, update } from '../lib/store.js';
import { SUBJ, avail, planetsFor, planetDone, progressOf } from '../data/subjects.js';
import { tt } from '../data/titles.js';
import { SubjGlyph, useUI } from '../components/ui.jsx';
import { Planet } from '../components/Planet.jsx';
import { sfx } from '../lib/fx.js';
import { useT } from '../lib/i18n.js';

/** Menu: pick grade 1–11 and a subject ("galaxy"). */
export default function Subjects() {
  const ui = useUI();
  const t = useT();
  const s = useStore();
  const g = s.grade, band = g <= 4 ? 'band.primary' : g <= 9 ? 'band.middle' : 'band.high';
  const on = SUBJ.filter((x) => avail(x, g)), off = SUBJ.filter((x) => !avail(x, g));
  const setGrade = (n) => { sfx.tap(n); update((st) => { st.grade = n; if (!avail(SUBJ.find((x) => x.id === st.subj), n)) st.subj = 'math'; }); };
  const choose = (id) => { sfx.tap(5); update((st) => { st.subj = id; }); ui.go('galaxy'); };
  return (
    <div className="wrap">
      <h1 className="page-title scribble">{t('subj.title')}</h1>
      <p className="page-sub">{t('subj.sub')}</p>
      <h2 className="h2">{t('gradeH')}</h2>
      <div className="grades" role="group" aria-label={t('gradeH')}>
        {Array.from({ length: 11 }, (_, i) => <button key={i} className={'gchip' + (g === i + 1 ? ' on' : '')} aria-pressed={g === i + 1} onClick={() => setGrade(i + 1)}>{i + 1}</button>)}
      </div>
      <p className="band hand">{t(band)} · {t('grade', { n: g })}</p>
      <h2 className="h2">{t('galaxiesFor', { n: g })}</h2>
      <div className="subj-grid">
        {on.map((x, idx) => {
          const p = progressOf(x.id, g, s.done), planets = planetsFor(x.id, g);
          const cur = planets.find((pl, i) => !planetDone(pl, s.done) && (i === 0 || planetDone(planets[i - 1], s.done)));
          const show = cur || planets[planets.length - 1];
          return (
            <button key={x.id} className={'subj' + (s.subj === x.id ? ' on' : '')} onClick={() => choose(x.id)} style={{ '--tilt': (idx % 3 - 1) * 2 + 'deg' }}>
              <span className="subj-planet" aria-hidden="true"><Planet type={show.type} hue={show.hue} seed={show.seed} ring={show.ring} size={58} state={cur ? 'open' : 'done'} /></span>
              <SubjGlyph s={x} size={44} />
              <div><b>{t('subj.' + x.id)}</b><br /><small>{cur ? t('currentPlanet', { p: tt(cur.title, t.lang) }) : t('allPlanetsDone')}</small></div>
              <div className="pbar g"><div style={{ width: (p.total ? (p.done / p.total) * 100 : 0) + '%' }} /></div>
              <small>{t('missionsOf', { a: p.done, b: p.total })}</small>
            </button>
          );
        })}
        {off.map((x) => (
          <button key={x.id} className="subj" disabled><SubjGlyph s={x} size={44} /><div><b>{t('subj.' + x.id)}</b><br /><small>{g < x.from ? t('fromGrade', { n: x.from }) : t('toGrade', { n: x.to })}</small></div></button>
        ))}
      </div>
    </div>
  );
}
