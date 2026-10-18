import { useState } from 'react';
import { useStore, update, unlock } from '../lib/store.js';
import { TUTORS, slotDate } from '../data/tutors.js';
import { subj } from '../data/subjects.js';
import { SubjGlyph, Mascot, useUI } from '../components/ui.jsx';
import { burst } from '../lib/fx.js';
import { useT } from '../lib/i18n.js';

/** Live lessons with teachers (demo schedule). */
export default function Online() {
  const ui = useUI();
  const t = useT();
  const s = useStore();
  const [filter, setFilter] = useState('all');
  const [mine, setMine] = useState(true);
  const g = s.grade;
  const list = TUTORS.map((x, i) => ({ ...x, i })).filter((x) => (filter === 'all' || x.s === filter) && (!mine || (g >= x.g[0] && g <= x.g[1])));
  const booked = Object.keys(s.booked).filter((k) => s.booked[k]).map((k) => { const [ti, si] = k.split('-').map(Number); return { k, tu: TUTORS[ti], sl: TUTORS[ti]?.slots[si] }; }).filter((x) => x.sl).sort((a, b) => a.sl[0] - b.sl[0]);
  const subjIds = [...new Set(TUTORS.map((x) => x.s))];

  const toggle = (k, el) => {
    const on = !s.booked[k];
    update((st) => { st.booked[k] = on; if (on) unlock(st, 'online-first'); });
    const [ti, si] = k.split('-').map(Number);
    ui.toast(on ? t('online.bookedToast', { x: TUTORS[ti].slots[si][2] }) : t('online.cancelled'));
    if (on) burst(el, true);
  };
  const join = () => ui.showModal(<>
    <div className="sheet-h"><Mascot mood="wow" /><div><span className="chip live">{t('online.live')}</span><h2 style={{ marginTop: 6 }}>{t('online.video')}</h2></div></div>
    <p>{t('online.videoText')}</p>
    <button className="btn wide" onClick={ui.closeModal}>{t('gotit')}</button></>);

  return (
    <div className="wrap">
      <h1 className="page-title scribble">{t('nav.online')}</h1>
      <p className="page-sub">{t('online.sub')}</p>
      <p className="note">{t('online.note')}</p>
      {booked.length > 0 && <>
        <h2 className="h2">{t('online.my')}</h2>
        {booked.map((b) => (
          <div key={b.k} className="slot-row" style={{ marginBottom: 10 }}>
            <SubjGlyph s={subj(b.tu.s)} size={40} />
            <div className="topic"><b>{b.sl[2]}</b><br /><small className="muted">{b.tu.n}</small></div>
            <div className="when"><b>{b.sl[1]}</b><small>{slotDate(b.sl[0], t)}</small></div>
            {b.sl[3] ? <button className="btn red sm" onClick={join}>{t('online.join')}</button> : <button className="btn ghost sm" onClick={(e) => toggle(b.k, e.currentTarget)}>{t('online.cancel')}</button>}
          </div>
        ))}
      </>}
      <h2 className="h2" style={{ marginTop: 20 }}>{t('online.schedule')}</h2>
      <div className="filters">
        <button className={'tchip' + (filter === 'all' ? ' on' : '')} onClick={() => setFilter('all')}>{t('online.all')}</button>
        {subjIds.map((id) => <button key={id} className={'tchip' + (filter === id ? ' on' : '')} onClick={() => setFilter(id)}>{t('subj.' + id)}</button>)}
      </div>
      <div className="setting" style={{ border: 0, paddingTop: 0 }}><span>{t('online.mine', { n: g })}</span><button className="toggle" aria-pressed={mine} aria-label={t('online.mine', { n: g })} onClick={() => setMine(!mine)} /></div>
      {!list.length && <div className="empty">{t('online.empty')}</div>}
      {list.map((tu) => {
        const S = subj(tu.s);
        return (
          <div key={tu.i} className="tutor card">
            <div className="tutor-h">
              <div className="ava" style={{ background: S.c }}>{tu.n.split(' ').map((w) => w[0]).join('')}</div>
              <div style={{ minWidth: 0 }}><h3>{tu.n}</h3>
                <p>{t('subj.' + S.id)} · {t('online.grades', { a: tu.g[0], b: tu.g[1] })} · {t('online.exp', { n: tu.exp, y: t.pl('year', tu.exp) })}</p>
                <p>{tu.solo ? t('online.solo') : t('online.group', { n: tu.group })}</p></div>
            </div>
            {tu.slots.map((sl, si) => {
              const k = `${tu.i}-${si}`, bk = s.booked[k];
              return (
                <div key={k} className="slot-row">
                  <div className="when"><b>{sl[1]}</b><small>{slotDate(sl[0], t)}</small></div>
                  <div className="topic">{sl[2]} {sl[3] && <span className="chip live">{t('online.live')}</span>}</div>
                  {sl[3] ? <button className="btn red sm" onClick={join}>{t('online.join')}</button>
                    : <button className={'btn sm ' + (bk ? 'ghost' : 'blue')} onClick={(e) => toggle(k, e.currentTarget)}>{bk ? t('online.booked') : t('online.book')}</button>}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
