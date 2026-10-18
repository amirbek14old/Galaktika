import { useState } from 'react';
import { useStore, update, unlock, notify } from '../lib/store.js';
import { TUTORS, slotDate } from '../data/tutors.js';
import { subj } from '../data/subjects.js';
import { SubjGlyph, useUI } from '../components/ui.jsx';
import { Crystal } from '../components/Cosmetics.jsx';
import { burst, sfx } from '../lib/fx.js';
import { useT } from '../lib/i18n.js';

export const priceOf = (tu) => (tu.exp >= 15 ? 40 : 30);

/** Live video lessons with professors, paid in crystals (demo schedule). */
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

  /** Pay and book. Returns true when the class is paid. */
  const pay = (k, tu, el) => {
    const price = priceOf(tu);
    if (s.paid?.[k]) return true;
    if (s.gems < price) { sfx.bad(); ui.toast(t('shop.short', { n: price - s.gems })); return false; }
    const [, si] = k.split('-').map(Number);
    update((st) => { st.gems -= price; st.paid = { ...(st.paid || {}), [k]: true }; st.booked[k] = true; unlock(st, 'online-first'); notify(st, 'info', 'class', { title: tu.slots[si][2] }); });
    sfx.coin(); burst(el, true); ui.toast(t('online.paidToast', { n: price }));
    return true;
  };
  const cancel = (k, tu) => {
    const price = priceOf(tu);
    update((st) => { st.booked[k] = false; if (st.paid?.[k]) { st.paid[k] = false; st.gems += price; } });
    ui.toast(t('online.refund', { n: price }));
  };
  const enter = (k, tu, sl, el) => { if (pay(k, tu, el)) setTimeout(() => ui.openRoom(tu, sl), 300); };

  return (
    <div className="wrap">
      <h1 className="page-title scribble">{t('nav.online')}</h1>
      <p className="page-sub">{t('online.sub')}</p>
      <div className="pay-note card"><Crystal size={30} className="spin" /><p>{t('online.howPay')}</p></div>
      <p className="note">{t('online.note')}</p>
      {booked.length > 0 && <>
        <h2 className="h2">{t('online.my')}</h2>
        {booked.map((b) => (
          <div key={b.k} className="slot-row mine" style={{ marginBottom: 10 }}>
            <SubjGlyph s={subj(b.tu.s)} size={40} />
            <div className="topic"><b>{b.sl[2]}</b><br /><small className="muted">{b.tu.n}</small></div>
            <div className="when"><b>{b.sl[1]}</b><small>{slotDate(b.sl[0], t)}</small></div>
            <div className="row">
              <button className={'btn sm ' + (b.sl[3] ? 'red' : 'blue')} onClick={(e) => enter(b.k, b.tu, b.sl, e.currentTarget)}>{t('online.enter')}</button>
              {!b.sl[3] && <button className="btn ghost sm" onClick={() => cancel(b.k, b.tu)}>{t('online.cancel')}</button>}
            </div>
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
        const S = subj(tu.s), price = priceOf(tu);
        return (
          <div key={tu.i} className="tutor card">
            <div className="tutor-h">
              <div className="ava" style={{ background: S.c }}>{tu.n.split(' ').map((w) => w[0]).join('')}</div>
              <div style={{ minWidth: 0, flex: 1 }}><h3>{tu.n}</h3>
                <p>{t('subj.' + S.id)} · {t('online.grades', { a: tu.g[0], b: tu.g[1] })} · {t('online.exp', { n: tu.exp, y: t.pl('year', tu.exp) })}</p>
                <p>{tu.solo ? t('online.solo') : t('online.group', { n: tu.group })}</p></div>
              <span className="price-tag"><Crystal size={18} />{price}</span>
            </div>
            {tu.slots.map((sl, si) => {
              const k = `${tu.i}-${si}`, bk = s.booked[k];
              return (
                <div key={k} className="slot-row">
                  <div className="when"><b>{sl[1]}</b><small>{slotDate(sl[0], t)}</small></div>
                  <div className="topic">{sl[2]} {sl[3] && <span className="chip live">{t('online.live')}</span>}</div>
                  {sl[3]
                    ? <button className="btn red sm pay" onClick={(e) => enter(k, tu, sl, e.currentTarget)}>{s.paid?.[k] ? t('online.enter') : <><Crystal size={16} /> {price} · {t('online.join')}</>}</button>
                    : bk ? <span className="chip ok">{t('online.booked')}</span>
                      : <button className="btn sm blue pay" onClick={(e) => pay(k, tu, e.currentTarget)}><Crystal size={16} /> {price} · {t('online.book')}</button>}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
