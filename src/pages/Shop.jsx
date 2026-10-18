import { useState } from 'react';
import { useStore, update, unlock, isPremium } from '../lib/store.js';
import { PremiumSheet, Crown } from '../components/Pay.jsx';
import { SHOP, nameOf } from '../data/shop.js';
import { BannerArt, Avatar, RocketArt, Crystal } from '../components/Cosmetics.jsx';
import { useUI, I } from '../components/ui.jsx';
import { burst, sfx } from '../lib/fx.js';
import { useT } from '../lib/i18n.js';
import { ProfileCard } from './Profile.jsx';

const KINDS = ['banner', 'avatar', 'frame', 'rocket', 'boost'];

/** Spend crystals on cosmetics and boosts. */
export default function Shop() {
  const ui = useUI();
  const t = useT();
  const s = useStore();
  const [kind, setKind] = useState('banner');
  const [preview, setPreview] = useState(null);

  const prem = isPremium(s);
  const owned = (k, id) => (s.owned[k] || []).includes(id) || (prem && SHOP[k].find((x) => x.id === id)?.premium);
  const buy = (k, it, el) => {
    if (it.premium && !prem) { ui.showModal(<PremiumSheet />); return; }
    if (s.gems < it.price) { sfx.bad(); el?.classList.remove('shake'); void el?.offsetWidth; el?.classList.add('shake'); ui.toast(t('shop.short', { n: it.price - s.gems })); return; }
    if (k === 'boost') {
      if (it.id === 'hearts' && s.hearts >= 5) { ui.toast(t('shop.full')); return; }
      if (it.id === 'freeze' && s.freezes >= (it.max || 2)) { ui.toast(t('shop.max')); return; }
    }
    update((st) => {
      st.gems -= it.price;
      if (k === 'boost') { if (it.id === 'hearts') st.hearts = 5; else st.freezes = (st.freezes || 0) + 1; }
      else { st.owned[k] = [...(st.owned[k] || []), it.id]; st.equip[k] = it.id; }
      unlock(st, 'first-buy');
    });
    sfx.coin(); burst(el, true, 22);
    ui.toast(t('shop.bought', { x: nameOf(it, t.lang) }));
  };
  const equip = (k, id) => { sfx.tap(4); update((st) => { st.equip[k] = id; }); };

  const look = { ...s.equip, ...(preview && preview.k !== 'boost' && preview.k !== 'rocket' ? { [preview.k]: preview.id } : {}) };

  return (
    <div className="wrap">
      <div className="shop-head">
        <div><h1 className="page-title scribble">{t('shop.title')}</h1><p className="page-sub">{t('shop.sub')}</p></div>
        <div className="wallet" aria-label={t('shop.balance')}><Crystal size={40} className="spin" /><div><small>{t('shop.balance')}</small><b>{s.gems}</b></div></div>
      </div>
      {!prem && <button className="prem-promo card" onClick={() => ui.showModal(<PremiumSheet />)}><Crown /><div><b>{t('prem.promo')}</b><small>{t('prem.promoSub')}</small></div><span className="btn sm prem-btn">{t('prem.more')}</span></button>}
      <ProfileCard look={look} name={s.child} xp={s.xp} small />
      <p className="note hand" style={{ margin: '8px 4px 16px' }}>↑ {t('shop.preview')}</p>
      <div className="tabs shop-tabs" role="tablist">
        {KINDS.map((k) => <button key={k} role="tab" aria-selected={kind === k} className={kind === k ? 'on' : ''} onClick={() => { setKind(k); setPreview(null); }}>{t('shop.' + k)}</button>)}
      </div>
      <div className={'shop-grid kind-' + kind}>
        {SHOP[kind].map((it) => {
          const have = kind !== 'boost' && owned(kind, it.id), on = s.equip[kind] === it.id;
          return (
            <div key={it.id} className={'shop-item card' + (on ? ' equipped' : '') + (it.premium ? ' prem-item' : '')} onMouseEnter={() => setPreview({ k: kind, id: it.id })} onFocus={() => setPreview({ k: kind, id: it.id })}>
              <div className="si-art">
                {kind === 'banner' && <BannerArt id={it.id} />}
                {kind === 'avatar' && <Avatar avatar={it.id} frame={s.equip.frame} size={76} />}
                {kind === 'frame' && <Avatar avatar={s.equip.avatar} frame={it.id} size={76} />}
                {kind === 'rocket' && <span className="si-rocket"><RocketArt skin={it.id} /></span>}
                {kind === 'boost' && (it.id === 'hearts' ? <I n="heart" className="si-boost" /> : <svg className="si-freeze" viewBox="0 0 24 24" aria-hidden="true"><g stroke="#7DD3FC" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"/><path d="M9 4l3 2 3-2M9 20l3-2 3 2M4 10.5l3.4-.4L6 7M20 13.5l-3.4.4L18 17M4 13.5l3.4.4L6 17M20 10.5l-3.4-.4L18 7"/></g></svg>)}
              </div>
              <div className="si-meta">
                <b>{nameOf(it, t.lang)}</b>
                {it.premium && <small className="prem-tag"><Crown /> Premium</small>}
                {it.desc && <small className="muted">{nameOf({ name: it.desc }, t.lang)}</small>}
                {kind === 'boost' && it.id === 'freeze' && <small className="muted">{t('shop.have', { n: s.freezes || 0 })}</small>}
              </div>
              {kind === 'boost' || !have
                ? <button className={'btn sm buy' + (s.gems < it.price ? ' poor' : '')} onClick={(e) => buy(kind, it, e.currentTarget)}>{it.premium ? <><Crown /> Premium</> : it.price ? <><Crystal size={16} /> {it.price}</> : t('shop.free')}</button>
                : on ? <span className="chip ok">{t('shop.equipped')}</span>
                  : <button className="btn ghost sm" onClick={() => equip(kind, it.id)}>{t('shop.equip')}</button>}
            </div>
          );
        })}
      </div>
      <div className="card earn">
        <h3>{t('shop.earn')}</h3>
        <ul>{['shop.e1', 'shop.e2', 'shop.e3', 'shop.e4'].map((k) => <li key={k}><Crystal size={16} />{t(k)}</li>)}</ul>
      </div>
    </div>
  );
}
