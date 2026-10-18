import { useState } from 'react';
import { useStore, update, isPremium } from '../lib/store.js';
import { PREMIUM_USD, PREMIUM_FREE, usd } from '../data/lessons.js';
import { useUI, I } from './ui.jsx';
import { BannerArt, Avatar } from './Cosmetics.jsx';
import { confetti, sfx } from '../lib/fx.js';
import { useT } from '../lib/i18n.js';

/** Demo checkout: shows the bill, never asks for card data. */
export function Checkout({ title, amount, lines = [], onPay, onBack }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const pay = () => { setBusy(true); setTimeout(() => { setBusy(false); onPay(); }, 900); };
  return (
    <div className="checkout">
      <h2>{t('pay.title')}</h2>
      <div className="bill card">
        <div className="bill-row main"><span>{title}</span><b>{usd(amount)}</b></div>
        {lines.map(([k, v]) => <div key={k} className="bill-row"><span className="muted">{k}</span><span>{v}</span></div>)}
        <div className="bill-row total"><span>{t('pay.total')}</span><b>{usd(amount)}</b></div>
      </div>
      <div className="pay-methods" aria-hidden="true"><span>Payme</span><span>Click</span><span>Uzum</span><span>Visa / Mastercard</span></div>
      <p className="note">{t('pay.demo')}</p>
      <button className="btn wide" disabled={busy} onClick={pay}>{busy ? t('pay.busy') : t('pay.btn', { x: usd(amount) })}</button>
      {onBack && <button className="link-btn" onClick={onBack}>← {t('back')}</button>}
    </div>
  );
}

export function PremiumBadge({ small }) {
  const t = useT();
  return <span className={'prem-badge' + (small ? ' sm' : '')}><Crown />{t('prem.badge')}</span>;
}
export const Crown = () => <svg className="crown" viewBox="0 0 52 42" aria-hidden="true"><path d="M2 34 L6 8 L17 22 L26 2 L35 22 L46 8 L50 34Z" fill="#FCD34D" stroke="#B45309" strokeWidth="3" strokeLinejoin="round" /><rect x="2" y="33" width="48" height="8" rx="2" fill="#F59E0B" /></svg>;

/** Premium: what you get + demo purchase. */
export function PremiumSheet() {
  const t = useT();
  const ui = useUI();
  const s = useStore();
  const [step, setStep] = useState('info');
  const on = isPremium(s);
  const buy = () => {
    update((x) => {
      const from = isPremium(x) ? x.premium.until : Date.now();
      x.premium = { until: from + 30 * 864e5, free: (isPremium(x) ? x.premium.free : 0) + PREMIUM_FREE, since: x.premium?.since || Date.now() };
      x.hearts = 5;
      x.payments = [{ what: 'premium', amt: PREMIUM_USD, at: Date.now() }, ...(x.payments || [])].slice(0, 30);
    });
    sfx.win(); confetti(); ui.closeModal(); ui.toast(t('prem.done', { n: PREMIUM_FREE }), 'ach');
  };
  if (step === 'pay') return <Checkout title={t('prem.name')} amount={PREMIUM_USD} lines={[[t('prem.period'), t('prem.month')], [t('prem.freeL'), String(PREMIUM_FREE)]]} onPay={buy} onBack={() => setStep('info')} />;
  const perks = [['crown', 'prem.p1'], ['user', 'prem.p2'], ['heart', 'prem.p3'], ['bolt', 'prem.p4'], ['live', 'prem.p5']];
  return (
    <div className="premium">
      <div className="prem-hero">
        <div className="prem-banner"><BannerArt id="royal" /></div>
        <Avatar avatar={s.equip.avatar} frame="crown" size={78} />
        <h2>{t('prem.name')}</h2>
        <p className="prem-price"><b>{usd(PREMIUM_USD)}</b> / {t('prem.month')}</p>
      </div>
      <ul className="perks">
        {perks.map(([ic, k]) => <li key={k}>{ic === 'crown' ? <Crown /> : <I n={ic} />}<span>{t(k, { n: PREMIUM_FREE })}</span></li>)}
      </ul>
      {on
        ? <><p className="tip">{t('prem.active', { d: new Date(s.premium.until).toLocaleDateString(), n: s.premium.free })}</p>
          <button className="btn ghost wide" onClick={() => setStep('pay')}>{t('prem.extend')}</button></>
        : <button className="btn wide prem-btn" onClick={() => setStep('pay')}>{t('prem.get', { x: usd(PREMIUM_USD) })}</button>}
    </div>
  );
}
