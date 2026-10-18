import { useState } from 'react';
import { useStore, update } from '../lib/store.js';
import { MIS } from '../data/fractions.js';
import { SUBJ, avail, progressOf } from '../data/subjects.js';
import { CONCEPTS } from '../data/concepts.js';
import { status, STATUS } from '../lib/diagnostic.js';
import { I, SubjGlyph } from '../components/ui.jsx';
import { Meteor } from '../components/Cosmetics.jsx';
import { dayKey } from '../lib/util.js';
import { useT } from '../lib/i18n.js';

/** Report for parents: no grades, just where the child struggles and what to do at home. */
export default function Parents() {
  const t = useT();
  const s = useStore();
  const [msg, setMsg] = useState('');
  const misStatus = (m) => (!m || !m.wrong ? ['none', ''] : m.fixed >= m.wrong ? ['st-ok', t('trap.fixed')] : ['st-practice', t('trap.work')]);
  const acc = s.stats.answered ? Math.round((s.stats.correct / s.stats.answered) * 100) : 0;
  const doneN = Object.keys(s.done).length, mins = Math.round(s.stats.secs / 60);
  const dow = t.list('dow');
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return { k: dayKey(d), w: dow[d.getDay()], today: i === 6 }; });
  const max = Math.max(20, ...days.map((d) => s.hist[d.k] || 0));
  const found = Object.keys(s.mis).filter((k) => s.mis[k].wrong > 0).sort((a, b) => (s.mis[b].wrong - s.mis[b].fixed) - (s.mis[a].wrong - s.mis[a].fixed));
  const weak = CONCEPTS.filter((c) => ['gap', 'practice'].includes(status(s.concepts[c.id]?.c, s.concepts[c.id]?.w)));
  const name = s.child || '—';

  const copy = () => {
    const txt = `Galaktika · ${name}, ${t('grade', { n: s.grade })}\n${t('streak')}: ${s.streak} · ${t('par.missions')}: ${doneN} · ${t('accuracy')}: ${acc}%\n`
      + (weak.length ? `${t('par.review')}: ${weak.map((c) => t('c.' + c.id)).join(', ')}\n` : '')
      + found.map((k) => `— ${MIS[k].name} (${misStatus(s.mis[k])[1]}). ${t('par.home')}: ${MIS[k].home}`).join('\n');
    try { navigator.clipboard.writeText(txt).then(() => setMsg(t('par.copied')), () => setMsg(t('par.copyFail'))); } catch (e) { setMsg(t('par.copyFail')); }
  };

  return (
    <div className="wrap">
      <h1 className="page-title scribble">{t('par.title')}</h1>
      <p className="page-sub">{t('par.sub', { name })}</p>
      <div className="field"><label htmlFor="childName" className="muted">{t('par.childName')}</label>
        <input id="childName" defaultValue={name} maxLength={24} onBlur={(e) => update((x) => { x.child = e.target.value.trim() || x.child; })} />
        <span className="muted">{t('grade', { n: s.grade })}</span></div>
      <div className="grid4">
        <div className="tile"><Meteor size={34} lit={s.streak > 0} /><div><b>{s.streak}</b><span>{t.pl('day', s.streak)} {t('inRowW')}</span></div></div>
        <div className="tile"><I n="planetI" /><div><b>{doneN}</b><span>{t('par.missions')}</span></div></div>
        <div className="tile"><I n="target" /><div><b>{acc}%</b><span>{t('accuracy')}</span></div></div>
        <div className="tile"><I n="clock" /><div><b>{mins}</b><span>{t('par.minutes')}</span></div></div>
      </div>
      <div className="card" style={{ marginBottom: 22 }}><h3>{t('par.week')}</h3>
        <div className="week">{days.map((d) => { const v = s.hist[d.k] || 0; return <div key={d.k} className={'col' + (d.today ? ' today' : '')}><span className="v">{v || ''}</span><div className={'b' + (v ? '' : ' zero')} style={{ height: Math.max(4, (v / max) * 100) + '%' }} /><span className="d">{d.w}</span></div>; })}</div>
      </div>
      <div className="card" style={{ marginBottom: 22 }}><h3>{t('par.subjects', { g: t('grade', { n: s.grade }) })}</h3>
        {SUBJ.filter((x) => avail(x, s.grade)).map((x) => { const p = progressOf(x.id, s.grade, s.done); return <div key={x.id} className="sp-row"><SubjGlyph s={x} size={36} /><div style={{ minWidth: 0 }}><small>{t('subj.' + x.id)}</small><div className="pbar g"><div style={{ width: (p.total ? (p.done / p.total) * 100 : 0) + '%' }} /></div></div><span className="num">{p.done}/{p.total}</span></div>; })}
      </div>
      {weak.length > 0 && <div className="card" style={{ marginBottom: 22 }}><h3>{t('par.review')}</h3>
        {weak.map((c) => { const k = status(s.concepts[c.id]?.c, s.concepts[c.id]?.w); return <div key={c.id} className="sp-row two"><span className={'chip ' + STATUS[k].cls}>{t(STATUS[k].key)}</span><span>{t('c.' + c.id)}</span></div>; })}</div>}
      <h2 className="h2">{t('par.where', { name })}</h2>
      {t('contentRu') && found.length > 0 && <p className="note">{t('contentRu')}</p>}
      {!found.length && <div className="empty">{t('par.empty')}</div>}
      {found.map((k) => { const m = MIS[k], [c, label] = misStatus(s.mis[k]), st = s.mis[k]; return (
        <div key={k} className="trap card"><div className="trap-h"><div><h3>{m.name}</h3><p className="muted" style={{ marginTop: 4 }}>{m.short} {t('par.mistakes', { a: st.wrong, b: Math.min(st.fixed, st.wrong) })}</p></div><span className={'chip ' + c}>{label}</span></div>
          <div className="tip"><b>{t('par.home')}</b>{m.home}</div></div>); })}
      <div className="row" style={{ marginTop: 18 }}><button className="btn blue" onClick={copy}>{t('par.copy')}</button><span className="muted">{msg}</span></div>
    </div>
  );
}
