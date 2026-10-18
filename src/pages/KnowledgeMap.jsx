import { useState } from 'react';
import { useStore, update } from '../lib/store.js';
import { CONCEPTS, concept, ancestors, MICRO } from '../data/concepts.js';
import { status, STATUS, estimate, confidence } from '../lib/diagnostic.js';
import { useUI } from '../components/ui.jsx';
import { useT } from '../lib/i18n.js';

/** Constellation of fraction concepts. Every star's colour comes from the real evidence in the store. */
export default function KnowledgeMap() {
  const ui = useUI();
  const t = useT();
  const s = useStore();
  const ev = (id) => s.concepts[id] || { c: 0, w: 0, log: [] };
  const st = (id) => status(ev(id).c, ev(id).w);
  const [sel, setSel] = useState(() => (CONCEPTS.find((c) => ['gap', 'practice'].includes(st(c.id))) || CONCEPTS[0]).id);
  const chain = ancestors(sel);
  const c = concept(sel), e = ev(sel), stt = STATUS[st(sel)];
  const weakPre = c.pre.filter((p) => ['gap', 'practice', 'unknown'].includes(st(p)));
  const counts = CONCEPTS.reduce((a, x) => { a[st(x.id)] = (a[st(x.id)] || 0) + 1; return a; }, {});
  const k = st(sel);
  const rec = weakPre.length && k !== 'mastered' ? t('rec.weakPre') : t('rec.' + k);

  return (
    <div className="wrap wide">
      <h1 className="page-title scribble">{t('nav.map')}</h1>
      <p className="page-sub">{t('map.sub')}</p>
      <div className="legend">{Object.entries(STATUS).map(([key, v]) => <span key={key} className={'lg ' + v.cls}><i>{v.icon}</i>{t(v.key)} · {counts[key] || 0}</span>)}</div>
      <div className="map-grid">
        <div className="constellation card">
          <svg viewBox="0 0 840 470" role="group" aria-label={t('nav.map')}>
            {CONCEPTS.flatMap((n) => n.pre.map((p) => {
              const a = concept(p), hot = (sel === n.id && n.pre.includes(p)) || (chain.has(n.id) && chain.has(p));
              return <line key={p + n.id} x1={a.x} y1={a.y} x2={n.x} y2={n.y} className={'edge' + (hot ? ' hot' : '')} />;
            }))}
            {CONCEPTS.map((n) => {
              const kk = st(n.id), on = sel === n.id;
              return (
                <g key={n.id} className={`star ${STATUS[kk].cls}${on ? ' on' : ''}${chain.has(n.id) ? ' chain' : ''}`} transform={`translate(${n.x} ${n.y})`}
                  tabIndex={0} role="button" aria-label={`${t('c.' + n.id)}: ${t(STATUS[kk].key)}`}
                  onClick={() => setSel(n.id)} onKeyDown={(ev2) => { if (ev2.key === 'Enter' || ev2.key === ' ') { ev2.preventDefault(); setSel(n.id); } }}>
                  <circle r="36" className="halo" /><circle r="24" className="core" />
                  <text className="sym" dy="7">{STATUS[kk].icon}</text>
                  {wrapText(t('c.' + n.id)).map((line, i) => <text key={i} className="name" y={52 + i * 17}>{line}</text>)}
                </g>
              );
            })}
          </svg>
        </div>
        <aside className="card node-panel" aria-live="polite">
          <span className={'chip ' + stt.cls}>{stt.icon} {t(stt.key)}</span>
          <h2>{t('c.' + sel)}</h2>
          <p className="muted">{t('cd.' + sel)}</p>
          <dl className="facts">
            <div><dt>{t('map.understanding')}</dt><dd>{e.c + e.w ? Math.round(estimate(e.c, e.w) * 100) + '%' : '—'}</dd></div>
            <div><dt>{t('map.answers')}</dt><dd>{e.c + e.w} <small className="muted">({t('map.correctN', { n: e.c })})</small></dd></div>
            <div><dt>{t('map.confidence')}</dt><dd>{t(confidence(e.c + e.w))}</dd></div>
          </dl>
          {c.pre.length > 0 && <p className="small"><b>{t('map.pre')}</b> {c.pre.map((p) => t('c.' + p)).join(', ')}</p>}
          {e.log?.length > 0 && <div className="small"><b>{t('map.recent')}</b> <span className="dots">{e.log.map((l, i) => <i key={i} className={l.ok ? 'ok' : 'bad'} />)}</span></div>}
          <p className="small rec"><b>{t('map.rec')}</b> {rec}</p>
          <div className="row">
            {MICRO[sel] && <button className="btn" onClick={() => ui.go('diagnostic', { micro: sel })}>{t('micro.chip')}</button>}
            {weakPre.length > 0 && <button className="btn ghost" onClick={() => setSel(weakPre[0])}>{t('map.goTo', { c: t('c.' + weakPre[0]) })}</button>}
            <button className="btn ghost" onClick={() => { update((x) => { x.subj = 'math'; x.grade = 5; }); ui.go('galaxy'); }}>{t('map.fracMissions')}</button>
          </div>
        </aside>
      </div>
      <p className="note" style={{ marginTop: 14 }}>{t('map.note')}</p>
    </div>
  );
}

function wrapText(txt) {
  const w = txt.split(' '), lines = []; let cur = '';
  for (const x of w) { if ((cur + ' ' + x).trim().length > 17 && cur) { lines.push(cur); cur = x; } else cur = (cur + ' ' + x).trim(); }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}
