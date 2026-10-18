import { useEffect, useState } from 'react';
import { useStore, update, unlock, notify, isPremium, getState } from '../lib/store.js';
import { allLessons, lessonById, isLive, isOver, crowd, earnings, seatsLeft, fits, whenOf, split, usd, OPEN_USD, TEACHER_SHARE } from '../data/lessons.js';
import { SUBJ, subj } from '../data/subjects.js';
import { SubjGlyph, useUI, I } from '../components/ui.jsx';
import { Crystal } from '../components/Cosmetics.jsx';
import { Checkout, PremiumSheet, Crown } from '../components/Pay.jsx';
import { burst, sfx, confetti } from '../lib/fx.js';
import { useT } from '../lib/i18n.js';

/** Re-render every few seconds so "live now" and the simulated attendee counts move. */
function useTick(ms = 5000) { const [, set] = useState(0); useEffect(() => { const id = setInterval(() => set((x) => x + 1), ms); return () => clearInterval(id); }, [ms]); }

export default function Online() {
  const s = useStore();
  return s.role === 'teacher' ? <TeacherDesk /> : <StudentOnline />;
}

/* ------------------------------ student / parent ------------------------------ */

function priceLabel(l, t) {
  return l.kind === 'open' ? usd(OPEN_USD) : <><Crystal size={16} /> {l.price}</>;
}

function StudentOnline() {
  useTick();
  const ui = useUI();
  const t = useT();
  const s = useStore();
  const [filter, setFilter] = useState('all');
  const [mine, setMine] = useState(true);
  const prem = isPremium(s);
  const lessons = allLessons(s).filter((l) => !isOver(l));
  const joined = lessons.filter((l) => s.joined?.[l.id]);
  const open = lessons.filter((l) => l.kind === 'open');
  const groups = lessons.filter((l) => l.kind !== 'open' && (filter === 'all' || l.s === filter) && (!mine || fits(l, s.grade)));
  const subjIds = [...new Set(lessons.filter((l) => l.kind !== 'open').map((l) => l.s))];
  const openJoin = (l) => ui.showModal(<JoinSheet id={l.id} />);
  const enter = (l) => ui.openRoom(l, 'student');

  const action = (l) => {
    const j = s.joined?.[l.id], live = isLive(l);
    if (j && live) return <button className="btn red sm" onClick={() => enter(l)}>{t('online.enter')}</button>;
    if (j) return <span className="chip ok">{t('online.booked')}</span>;
    if (l.kind !== 'open' && seatsLeft(l) <= 0) return <span className="chip">{t('ap.full')}</span>;
    return <button className={'btn sm pay ' + (live ? 'red' : 'blue')} onClick={() => openJoin(l)}>{priceLabel(l, t)} · {live ? t('online.join') : t('online.book')}</button>;
  };

  return (
    <div className="wrap">
      <h1 className="page-title scribble">{t('nav.online')}</h1>
      <p className="page-sub">{t('online.sub')}</p>

      {prem
        ? <div className="prem-strip card"><Crown /><p>{t('prem.left', { n: s.premium.free })}</p></div>
        : <button className="prem-promo card" onClick={() => ui.showModal(<PremiumSheet />)}><Crown /><div><b>{t('prem.promo')}</b><small>{t('prem.promoSub')}</small></div><span className="btn sm prem-btn">{t('prem.more')}</span></button>}

      {joined.length > 0 && <>
        <h2 className="h2">{t('online.my')}</h2>
        {joined.map((l) => <LessonRow key={l.id} l={l} t={t} mine>
          {isLive(l) ? <button className="btn red sm" onClick={() => enter(l)}>{t('online.enter')}</button>
            : <button className="btn ghost sm" onClick={() => cancel(l, s, ui, t)}>{t('online.cancel')}</button>}
        </LessonRow>)}
      </>}

      <h2 className="h2" style={{ marginTop: 20 }}>{t('ap.openTitle')}</h2>
      <p className="muted small" style={{ margin: '-6px 0 12px' }}>{t('ap.openSub', { x: usd(OPEN_USD), a: usd(split(OPEN_USD).teacher), b: usd(split(OPEN_USD).site) })}</p>
      <div className="open-grid">
        {open.map((l) => { const S = subj(l.s), [day, time] = whenOf(l.at, t); return (
          <div key={l.id} className="open-card card" style={{ '--sc': S.c }}>
            <div className="oc-top"><SubjGlyph s={S} size={40} />{isLive(l) ? <span className="chip live">{t('online.live')}</span> : <span className="chip">{day}, {time}</span>}</div>
            <b className="oc-title">{l.topic}</b>
            <small className="muted">{l.teacher}{l.own ? ' · ' + t('ap.new') : ''}</small>
            <div className="oc-meta"><span><I n="users" /> {t('ap.going', { n: crowd(l) })}</span><span className="usd">{usd(OPEN_USD)}</span></div>
            {action(l)}
          </div>); })}
      </div>

      <h2 className="h2" style={{ marginTop: 20 }}>{t('online.schedule')}</h2>
      <div className="filters">
        <button className={'tchip' + (filter === 'all' ? ' on' : '')} onClick={() => setFilter('all')}>{t('online.all')}</button>
        {subjIds.map((id) => <button key={id} className={'tchip' + (filter === id ? ' on' : '')} onClick={() => setFilter(id)}>{t('subj.' + id)}</button>)}
      </div>
      <div className="setting" style={{ border: 0, paddingTop: 0 }}><span>{t('online.mine', { n: s.grade })}</span><button className="toggle" aria-pressed={mine} aria-label={t('online.mine', { n: s.grade })} onClick={() => setMine(!mine)} /></div>
      {!groups.length && <div className="empty">{t('online.empty')}</div>}
      {groups.map((l) => <LessonRow key={l.id} l={l} t={t}>{action(l)}</LessonRow>)}
      <p className="note" style={{ marginTop: 14 }}>{t('online.note')}</p>
    </div>
  );
}

function LessonRow({ l, t, mine, children }) {
  const S = subj(l.s), [day, time] = whenOf(l.at, t);
  return (
    <div className={'slot-row lrow' + (mine ? ' mine' : '')}>
      <SubjGlyph s={S} size={40} />
      <div className="topic"><b>{l.topic}</b> {isLive(l) && <span className="chip live">{t('online.live')}</span>}{l.own && <span className="chip new">{t('ap.new')}</span>}<br />
        <small className="muted">{l.teacher} · {t('online.grades', { a: l.g[0], b: l.g[1] })} · {l.kind === 'open' ? t('ap.openShort') : t('ap.seats', { n: seatsLeft(l) })}</small></div>
      <div className="when"><b>{time}</b><small>{day}</small></div>
      <div className="row">{children}</div>
    </div>
  );
}

function cancel(l, s, ui, t) {
  const j = s.joined[l.id];
  update((x) => {
    delete x.joined[l.id];
    if (j.via === 'gems') x.gems += j.amt;
    if (j.via === 'free' && x.premium) x.premium.free += 1;
  });
  ui.toast(j.via === 'gems' ? t('online.refund', { n: j.amt }) : j.via === 'free' ? t('ap.refundFree') : t('ap.refundUsd', { x: usd(j.amt) }));
}

/** Pick how to pay for one lesson: premium credit, crystals, or $1.50 (open lesson). */
function JoinSheet({ id }) {
  const t = useT();
  const ui = useUI();
  const s = useStore();
  const [step, setStep] = useState('pick');
  const l = lessonById(s, id);
  if (!l) return null;
  const S = subj(l.s), [day, time] = whenOf(l.at, t), prem = isPremium(s), free = prem ? s.premium.free : 0;
  const sp = split(OPEN_USD);

  const join = (via, el) => {
    const amt = via === 'gems' ? l.price : via === 'usd' ? OPEN_USD : 0;
    if (via === 'gems' && getState().gems < amt) { sfx.bad(); ui.toast(t('shop.short', { n: amt - getState().gems })); return; }
    update((x) => {
      x.joined = { ...(x.joined || {}), [l.id]: { via, amt, at: Date.now() } };
      if (via === 'gems') x.gems -= amt;
      if (via === 'free') x.premium.free -= 1;
      if (via === 'usd') x.payments = [{ what: 'lesson', id: l.id, amt, at: Date.now() }, ...(x.payments || [])].slice(0, 30);
      unlock(x, 'online-first');
      notify(x, 'info', 'class', { title: l.topic });
    });
    sfx.coin(); if (el) burst(el, true); confetti();
    ui.closeModal();
    if (isLive(l)) setTimeout(() => ui.openRoom(l, 'student'), 350);
    else ui.toast(t('ap.joinedToast', { x: l.topic, d: day, h: time }));
  };

  if (step === 'usd') return <Checkout title={l.topic} amount={OPEN_USD} onBack={() => setStep('pick')} onPay={() => join('usd')}
    lines={[[t('ap.toTeacher', { p: Math.round(TEACHER_SHARE * 100) }), usd(sp.teacher)], [t('ap.toSite', { p: Math.round((1 - TEACHER_SHARE) * 100) }), usd(sp.site)]]} />;

  return (
    <div className="join">
      <div className="sheet-h"><SubjGlyph s={S} size={52} /><div><span className={'chip ' + (l.kind === 'open' ? 'open' : '')}>{l.kind === 'open' ? t('ap.openShort') : t('ap.group')}</span><h2 style={{ marginTop: 6 }}>{l.topic}</h2></div></div>
      <p className="muted">{l.teacher} · {t('subj.' + S.id)} · {isLive(l) ? t('online.live') : `${day}, ${time}`} · {t('ap.min', { n: l.dur })}</p>
      {l.kind === 'open' && <>
        <p>{t('ap.openExplain')}</p>
        <div className="split" aria-label={t('ap.splitTitle')}>
          <div className="split-bar"><span style={{ width: TEACHER_SHARE * 100 + '%' }}>{Math.round(TEACHER_SHARE * 100)}%</span><span>{Math.round((1 - TEACHER_SHARE) * 100)}%</span></div>
          <div className="split-legend"><span><i className="dot t" />{t('ap.teacherGets', { x: usd(sp.teacher) })}</span><span><i className="dot g" />{t('ap.siteGets', { x: usd(sp.site) })}</span></div>
        </div>
      </>}
      {free > 0 && <button className="btn wide prem-btn" onClick={(e) => join('free', e.currentTarget)}><Crown /> {t('ap.useFree', { n: free })}</button>}
      {l.kind === 'open'
        ? <button className={'btn wide ' + (free > 0 ? 'ghost' : '')} onClick={() => setStep('usd')}>{t('ap.payUsd', { x: usd(OPEN_USD) })}</button>
        : <button className={'btn wide buy ' + (free > 0 ? 'ghost' : '') + (s.gems < l.price ? ' poor' : '')} onClick={(e) => join('gems', e.currentTarget)}><Crystal size={18} /> {t('ap.payGems', { n: l.price })}</button>}
      {l.kind !== 'open' && <small className="muted txt-center">{t('ap.balance', { n: s.gems })}</small>}
      {!prem && <button className="link-btn" onClick={() => ui.showModal(<PremiumSheet />)}>{t('ap.premHint')} →</button>}
    </div>
  );
}

/* ------------------------------ teacher ------------------------------ */

function TeacherDesk() {
  useTick(4000);
  const ui = useUI();
  const t = useT();
  const s = useStore();
  const mine = (s.lessons || []).filter((l) => l.own).sort((a, b) => a.at - b.at);
  const tot = mine.reduce((a, l) => { const n = crowd(l), e = earnings(l, n); a.n += n; if (e.cur === 'usd') { a.usd += e.teacher; a.site += e.site; } else a.gems += e.teacher; return a; }, { n: 0, usd: 0, gems: 0, site: 0 });
  const del = (l) => { update((x) => { x.lessons = x.lessons.filter((y) => y.id !== l.id); }); ui.toast(t('ap.deleted')); };

  return (
    <div className="wrap">
      <h1 className="page-title scribble">{t('teach.title')}</h1>
      <p className="page-sub">{t('teach.sub', { name: s.child, s: t('subj.' + (s.tSubj || 'math')) })}</p>

      <div className="grid4 teach-stats">
        <div className="tile"><I n="users" /><div><b>{tot.n}</b><span>{t('teach.students')}</span></div></div>
        <div className="tile"><span className="usd big">$</span><div><b>{usd(tot.usd)}</b><span>{t('teach.earned', { p: Math.round(TEACHER_SHARE * 100) })}</span></div></div>
        <div className="tile"><Crystal size={30} /><div><b>{tot.gems}</b><span>{t('teach.gems')}</span></div></div>
        <div className="tile"><I n="planetI" /><div><b>{usd(tot.site)}</b><span>{t('teach.site')}</span></div></div>
      </div>
      <div className="pay-note card"><span className="usd big">80/20</span><p>{t('teach.how', { x: usd(OPEN_USD), a: usd(split(OPEN_USD).teacher), b: usd(split(OPEN_USD).site) })}</p></div>

      <div className="row" style={{ justifyContent: 'space-between', margin: '22px 0 12px' }}>
        <h2 className="h2" style={{ margin: 0 }}>{t('teach.mine')}</h2>
        <button className="btn sm" onClick={() => ui.showModal(<NewLesson />)}><I n="plus" /> {t('teach.new')}</button>
      </div>
      {!mine.length && <div className="empty teach-empty"><p>{t('teach.empty')}</p>
        <button className="btn blue" onClick={() => ui.showModal(<NewLesson preset="now" />)}>{t('teach.quick')}</button></div>}
      {mine.map((l) => { const n = crowd(l), e = earnings(l, n), [day, time] = whenOf(l.at, t), live = isLive(l), over = isOver(l); return (
        <div key={l.id} className="my-ap card">
          <div className="map-h">
            <SubjGlyph s={subj(l.s)} size={44} />
            <div style={{ minWidth: 0, flex: 1 }}><b>{l.topic}</b><small className="muted">{live ? t('online.live') : `${day}, ${time}`} · {t('ap.min', { n: l.dur })} · {t('online.grades', { a: l.g[0], b: l.g[1] })}</small></div>
            <span className={'chip ' + (l.kind === 'open' ? 'open' : '')}>{l.kind === 'open' ? usd(OPEN_USD) : <><Crystal size={14} /> {l.price}</>}</span>
          </div>
          <div className="map-stats">
            <span><I n="users" /> {l.kind === 'open' ? t('ap.going', { n }) : t('ap.of', { n, m: l.seats })}</span>
            <span>{t('teach.you')}: <b>{e.cur === 'usd' ? usd(e.teacher) : <><Crystal size={14} /> {e.teacher}</>}</b></span>
            <span className="muted">Galaktika: {e.cur === 'usd' ? usd(e.site) : e.site + ' ◆'}</span>
          </div>
          <div className="row">
            {!over && <button className={'btn sm ' + (live ? 'red' : 'blue')} onClick={() => ui.openRoom(l, 'host')}>{live ? t('teach.start') : t('teach.startEarly')}</button>}
            {over && <span className="chip">{t('teach.over')}</span>}
            <button className="btn ghost sm" onClick={() => del(l)} aria-label={t('ap.delete')}><I n="trash" /></button>
          </div>
        </div>); })}
      <p className="note" style={{ marginTop: 14 }}>{t('teach.note')}</p>
    </div>
  );
}

const pad = (n) => String(n).padStart(2, '0');
const toDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Appointment form for teachers. */
function NewLesson({ preset }) {
  const t = useT();
  const ui = useUI();
  const s = useStore();
  const soon = new Date(Date.now() + 60 * 60e3); soon.setMinutes(soon.getMinutes() < 30 ? 30 : 60, 0, 0);
  const [f, setF] = useState({ topic: '', s: s.tSubj || 'math', g0: 5, g1: 9, kind: preset === 'now' ? 'open' : 'group', price: 30, seats: 8,
    date: toDate(soon), time: `${pad(soon.getHours())}:${pad(soon.getMinutes())}`, dur: 45, now: preset === 'now' });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = () => {
    const topic = f.topic.trim() || (f.kind === 'open' ? t('ap.defOpen') : t('ap.defGroup'));
    const [y, m, d] = f.date.split('-').map(Number), [h, mi] = f.time.split(':').map(Number);
    const at = f.now ? Date.now() : new Date(y, m - 1, d, h, mi).getTime();
    if (!f.now && at < Date.now() - 60e3) { ui.toast(t('ap.past')); return; }
    const g = [Math.min(f.g0, f.g1), Math.max(f.g0, f.g1)];
    update((x) => { x.lessons = [...(x.lessons || []), { id: 'my-' + Math.random().toString(36).slice(2, 8), own: true, created: Date.now(), teacher: x.child, s: f.s, g, topic, at, dur: f.dur, kind: f.kind, ...(f.kind === 'open' ? {} : { price: f.price, seats: f.seats }) }]; });
    sfx.win(); ui.closeModal(); ui.toast(t('ap.created'));
  };
  const grades = Array.from({ length: 11 }, (_, i) => i + 1);
  return (
    <div className="ap-form">
      <h2>{t('teach.new')}</h2>
      <div className="seg kind-seg" role="group">
        <button className={f.kind === 'group' ? 'on' : ''} onClick={() => set('kind', 'group')}><Crystal size={16} /> {t('ap.group')}</button>
        <button className={f.kind === 'open' ? 'on' : ''} onClick={() => set('kind', 'open')}>{usd(OPEN_USD)} · {t('ap.openShort')}</button>
      </div>
      <p className="muted small">{f.kind === 'open' ? t('ap.openForm', { a: usd(split(OPEN_USD).teacher), b: usd(split(OPEN_USD).site) }) : t('ap.groupForm')}</p>
      <label className="field-col"><span className="muted small">{t('ap.topic')}</span><input value={f.topic} maxLength={60} placeholder={f.kind === 'open' ? t('ap.defOpen') : t('ap.defGroup')} onChange={(e) => set('topic', e.target.value)} /></label>
      <label className="field-col"><span className="muted small">{t('ap.subject')}</span>
        <select value={f.s} onChange={(e) => set('s', e.target.value)}>{SUBJ.map((x) => <option key={x.id} value={x.id}>{t('subj.' + x.id)}</option>)}</select></label>
      <div className="two-col">
        <label className="field-col"><span className="muted small">{t('ap.from')}</span><select value={f.g0} onChange={(e) => set('g0', +e.target.value)}>{grades.map((g) => <option key={g} value={g}>{g}</option>)}</select></label>
        <label className="field-col"><span className="muted small">{t('ap.to')}</span><select value={f.g1} onChange={(e) => set('g1', +e.target.value)}>{grades.map((g) => <option key={g} value={g}>{g}</option>)}</select></label>
      </div>
      {f.kind === 'group' && <div className="two-col">
        <label className="field-col"><span className="muted small">{t('ap.price')}</span><select value={f.price} onChange={(e) => set('price', +e.target.value)}>{[10, 20, 30, 40, 60, 80].map((p) => <option key={p} value={p}>{p} ◆</option>)}</select></label>
        <label className="field-col"><span className="muted small">{t('ap.seatsL')}</span><select value={f.seats} onChange={(e) => set('seats', +e.target.value)}>{[1, 4, 6, 8, 12, 20].map((p) => <option key={p} value={p}>{p}</option>)}</select></label>
      </div>}
      <div className="setting" style={{ border: 0, padding: 0 }}><span>{t('ap.now')}</span><button className="toggle" aria-pressed={f.now} aria-label={t('ap.now')} onClick={() => set('now', !f.now)} /></div>
      {!f.now && <div className="two-col">
        <label className="field-col"><span className="muted small">{t('ap.date')}</span><input type="date" value={f.date} min={toDate(new Date())} onChange={(e) => set('date', e.target.value)} /></label>
        <label className="field-col"><span className="muted small">{t('ap.time')}</span><input type="time" value={f.time} onChange={(e) => set('time', e.target.value)} /></label>
      </div>}
      <label className="field-col"><span className="muted small">{t('ap.dur')}</span><select value={f.dur} onChange={(e) => set('dur', +e.target.value)}>{[30, 45, 60, 90].map((p) => <option key={p} value={p}>{t('ap.min', { n: p })}</option>)}</select></label>
      <button className="btn wide" onClick={save}>{t('ap.create')}</button>
    </div>
  );
}
