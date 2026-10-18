import { useState } from 'react';
import { useStore, update, setState, seed, blank, getState, ACH_IDS } from '../lib/store.js';
import { subj } from '../data/subjects.js';
import { SHOP, nameOf } from '../data/shop.js';
import { Html, icon, I, useUI } from '../components/ui.jsx';
import { BannerArt, Avatar, Crystal, Meteor } from '../components/Cosmetics.jsx';
import { useT, LANGS } from '../lib/i18n.js';

const rankOf = (xp) => (xp < 100 ? 0 : xp < 300 ? 1 : xp < 800 ? 2 : 3);

/** Banner + framed avatar + name + rank. */
export function ProfileCard({ look, name, xp, small, children }) {
  const t = useT();
  return (
    <div className={'pcard' + (small ? ' small' : '')}>
      <div className="pcard-banner"><BannerArt id={look.banner} /></div>
      <div className="pcard-body">
        <Avatar avatar={look.avatar} frame={look.frame} size={small ? 72 : 96} />
        <div className="pcard-name"><h2>{name}</h2><span className="rank hand">{t('rank.' + rankOf(xp))}</span></div>
        {children}
      </div>
    </div>
  );
}

export default function Profile() {
  const ui = useUI();
  const t = useT();
  const s = useStore();
  const [sure, setSure] = useState(false);
  const missions = Object.keys(s.done).length;
  return (
    <div className="wrap">
      <ProfileCard look={s.equip} name={s.child} xp={s.xp}>
        <button className="btn ghost sm edit-btn" onClick={() => ui.showModal(<EditProfile />)}><I n="edit" /> {t('prof.edit')}</button>
      </ProfileCard>
      <div className="pstats">
        <div><Meteor size={30} lit={s.streak > 0} /><b>{s.streak}</b><small>{t.pl('day', s.streak)} {t('inRowW')}</small></div>
        <div><Crystal size={28} /><b>{s.gems}</b><small>{t('crystalsW')}</small></div>
        <div><I n="bolt" /><b>{s.xp}</b><small>{t('xp')}</small></div>
        <div><I n="planetI" /><b>{missions}</b><small>{t('prof.missions')}</small></div>
      </div>

      <h2 className="h2">{t('prof.ach')}</h2>
      <div className="ach-grid">
        {ACH_IDS.map((id) => { const [title, desc] = t.list('ach.' + id); return (
          <div key={id} className={'ach card' + (s.ach[id] ? ' got' : '')}>
            <Html className="medal" html={icon('medal')} />
            <div><b>{title}</b><small className="muted">{s.ach[id] ? t('prof.got', { d: s.ach[id].split('-').reverse().join('.') }) : desc}</small></div>
          </div>); })}
      </div>

      <h2 className="h2" style={{ marginTop: 26 }}>{t('prof.settings')}</h2>
      <div className="setting"><div><b>{t('lang')}</b></div>
        <div className="seg" role="group" aria-label={t('lang')}>{LANGS.map(([k, , short]) => <button key={k} className={s.lang === k ? 'on' : ''} aria-pressed={s.lang === k} onClick={() => update((x) => { x.lang = k; })}>{short}</button>)}</div></div>
      <div className="setting"><div><b>{t('prof.gradeSubj')}</b><p className="muted small">{t('subj.' + subj(s.subj).id)}, {t('grade', { n: s.grade })}</p></div><button className="btn ghost sm" onClick={() => ui.go('subjects')}>{t('change')}</button></div>
      <div className="setting"><div><b>{t('nav.map')}</b></div><button className="btn ghost sm" onClick={() => ui.go('map')}>{t('open')}</button></div>
      <div className="setting"><div><b>{t('nav.online')}</b></div><button className="btn ghost sm" onClick={() => ui.go('online')}>{t('open')}</button></div>
      <div className="setting"><div><b>{t('nav.parents')}</b></div><button className="btn ghost sm" onClick={() => ui.go('parents')}>{t('open')}</button></div>
      <div className="setting"><div><b>{t('prof.sound')}</b><p className="muted small">{t('prof.soundSub')}</p></div><button className="toggle" aria-pressed={s.sound} aria-label={t('prof.sound')} onClick={() => update((x) => { x.sound = !x.sound; })} /></div>
      <div className="setting"><div><b>{t('prof.reset')}</b><p className="muted small">{t('prof.resetSub')}</p></div>
        <button className={'btn sm ' + (sure ? 'red' : 'ghost')} onClick={() => { if (!sure) { setSure(true); return; } setState(blank(getState())); ui.toast(t('prof.resetDone')); ui.go('galaxy'); }}>{sure ? t('prof.sure') : t('prof.resetBtn')}</button></div>
      <div className="setting"><div><b>{t('prof.demo')}</b><p className="muted small">{t('prof.demoSub')}</p></div><button className="btn ghost sm" onClick={() => { setState({ ...seed(), lang: s.lang }); ui.toast(t('prof.demoDone')); ui.go('galaxy'); }}>{t('prof.demoBtn')}</button></div>
    </div>
  );
}

/** Name, avatar, banner and frame — from items the student owns. */
function EditProfile() {
  const ui = useUI();
  const t = useT();
  const s = useStore();
  const [name, setName] = useState(s.child);
  const [look, setLook] = useState({ ...s.equip });
  const pick = (k) => (
    <div className="pick-row" role="group" aria-label={t('shop.' + k)}>
      {SHOP[k].filter((it) => s.owned[k].includes(it.id)).map((it) => (
        <button key={it.id} className={'pick' + (look[k] === it.id ? ' on' : '')} aria-pressed={look[k] === it.id} title={nameOf(it, t.lang)} onClick={() => setLook({ ...look, [k]: it.id })}>
          {k === 'banner' ? <span className="pick-banner"><BannerArt id={it.id} /></span> : <Avatar avatar={k === 'avatar' ? it.id : look.avatar} frame={k === 'frame' ? it.id : 'none'} size={48} />}
        </button>
      ))}
    </div>
  );
  return (
    <>
      <h2>{t('prof.edit')}</h2>
      <ProfileCard look={look} name={name || '…'} xp={s.xp} small />
      <label className="field-col"><span className="muted small">{t('prof.name')}</span><input value={name} maxLength={24} onChange={(e) => setName(e.target.value)} /></label>
      <b className="small">{t('shop.avatar')}</b>{pick('avatar')}
      <b className="small">{t('shop.banner')}</b>{pick('banner')}
      <b className="small">{t('shop.frame')}</b>{pick('frame')}
      <button className="link-btn" onClick={() => ui.go('shop')}>{t('prof.inShop')} →</button>
      <button className="btn wide" onClick={() => { update((x) => { x.child = name.trim() || x.child; x.equip = { ...x.equip, ...look }; }); ui.closeModal(); ui.toast(t('prof.saved')); }}>{t('prof.save')}</button>
    </>
  );
}
