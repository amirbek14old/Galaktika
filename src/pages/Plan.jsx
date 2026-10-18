import { useState } from 'react';
import { useStore, update } from '../lib/store.js';
import { GRADES, schoolSubjects, chorakNow, planMissions, forecast, classmates, NEED_ACC } from '../data/school.js';
import { tt } from '../data/titles.js';
import { SubjGlyph, I, useUI } from '../components/ui.jsx';
import { Avatar } from '../components/Cosmetics.jsx';
import { sfx } from '../lib/fx.js';
import { useT } from '../lib/i18n.js';

const markCls = (m) => 'mark m' + m;
const Mark = ({ m }) => <span className={markCls(m)}>{m}</span>;
const dateStr = (d) => `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;

export function ChorakBar() {
  const t = useT();
  const c = chorakNow();
  return (
    <div className="chorak card">
      <div className="chorak-h"><b>{t('plan.chorak', { n: c.n })}</b><span className="chip">{t('plan.until', { d: dateStr(c.to) })}</span></div>
      <div className="pbar"><div style={{ width: c.passed * 100 + '%' }} /></div>
      <small className="muted">{t('plan.daysLeft', { n: c.daysLeft })} · {t('plan.approx')}</small>
    </div>
  );
}

/** Plan for my own (or my child's) subjects where the school mark is 3. */
export function myPlans(s) {
  const c = chorakNow();
  const acc = s.stats.answered ? Math.round((s.stats.correct / s.stats.answered) * 100) : 0;
  return schoolSubjects(s.grade).filter((x) => (s.marks?.[x.id] || 4) === 3).map((x) => {
    const target = s.goals?.[x.id] || 4;
    const { planet, list } = planMissions(x.id, s.grade, target, c.n);
    const done = list.filter((l) => s.done[l.id]).length;
    return { S: x, target, planet, list, done, acc, f: forecast({ done, total: list.length, acc, passed: c.passed, target }) };
  });
}

export default function Plan() {
  const s = useStore();
  return s.role === 'teacher' ? <TeacherClass /> : <StudentPlan />;
}

function StudentPlan() {
  const t = useT();
  const ui = useUI();
  const s = useStore();
  const c = chorakNow();
  const plans = myPlans(s);
  const parent = s.role === 'parent';
  const setMark = (sid, m) => { sfx.tap(m); update((x) => { x.marks = { ...(x.marks || {}), [sid]: m }; }); };
  const setGoal = (sid, g) => { sfx.tap(g + 2); update((x) => { x.goals = { ...(x.goals || {}), [sid]: g }; }); };
  const start = (l) => ui.openLesson({ lesson: l, qs: l.make(), xp: s.done[l.id] ? 5 : 10 });

  return (
    <div className="wrap">
      <h1 className="page-title scribble">{t('plan.title')}</h1>
      <p className="page-sub">{parent ? t('plan.subParent', { name: s.child }) : t('plan.sub')}</p>
      <ChorakBar />

      <h2 className="h2">{parent ? t('plan.marksChild', { name: s.child }) : t('plan.marks')}</h2>
      <div className="marks card">
        {schoolSubjects(s.grade).map((x) => { const m = s.marks?.[x.id] || 4; return (
          <div key={x.id} className="mark-row">
            <SubjGlyph s={x} size={34} /><span className="mr-name">{t('subj.' + x.id)}</span>
            <div className="seg marks-seg" role="group" aria-label={t('subj.' + x.id)}>
              {[3, 4, 5].map((n) => <button key={n} className={m === n ? 'on m' + n : ''} aria-pressed={m === n} onClick={() => setMark(x.id, n)}>{n}</button>)}
            </div>
          </div>); })}
      </div>

      {!plans.length && <div className="empty plan-empty"><b>{t('plan.none')}</b><p className="muted">{t('plan.noneSub')}</p></div>}
      {plans.map(({ S, target, planet, list, done, acc, f }) => {
        const next = list.filter((l) => !s.done[l.id]).slice(0, 2);
        const perWeek = Math.ceil((list.length - done) / c.weeksLeft);
        return (
          <div key={S.id} className={'plan card ' + f.status}>
            <div className="plan-h">
              <SubjGlyph s={S} size={44} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <b className="plan-title">{t('subj.' + S.id)}: <Mark m={3} /> → <Mark m={target} /></b>
                <small className="muted">{t('plan.topic', { p: tt(planet.title, t.lang), n: c.n })}</small>
              </div>
              <span className={'chip fc ' + f.status}>{t('plan.st.' + f.status, { m: f.mark })}</span>
            </div>
            <div className="goal-pick"><span className="small muted">{t('plan.goal')}</span>
              <div className="seg">{[4, 5].map((g) => <button key={g} className={target === g ? 'on' : ''} onClick={() => setGoal(S.id, g)}>{g}</button>)}</div>
            </div>
            <div className="plan-prog"><div className="pbar g"><div style={{ width: (done / list.length) * 100 + '%' }} /></div><b>{done}/{list.length}</b></div>
            <ul className="plan-req">
              <li className={done >= list.length ? 'ok' : ''}>{t('plan.req1', { n: list.length, d: dateStr(c.to) })}</li>
              <li className={acc >= NEED_ACC[target] ? 'ok' : ''}>{t('plan.req2', { p: NEED_ACC[target], a: acc })}</li>
              {done < list.length && <li>{t('plan.req3', { n: perWeek })}</li>}
            </ul>
            {next.length > 0 && !parent && <div className="plan-next"><small className="muted">{t('plan.week')}</small>
              {next.map((l) => <button key={l.id} className="btn sm blue" onClick={() => start(l)}><I n="rocket" /> {tt(l.title, t.lang)}</button>)}
            </div>}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------ teacher: the class list ------------------------------ */
function TeacherClass() {
  const t = useT();
  const ui = useUI();
  const s = useStore();
  const [only, setOnly] = useState('all');
  const c = chorakNow();
  const g = s.grade;
  const subs = schoolSubjects(g);
  const over = s.roster?.[g] || {};
  const kids = classmates(g).map((k) => ({ ...k, marks: { ...k.marks, ...(over[k.id] || {}) } }));
  const withPlan = (k) => {
    const threes = subs.filter((x) => k.marks[x.id] === 3);
    const items = threes.map((x) => {
      const total = planMissions(x.id, g, k.goal, c.n).list.length;
      const done = Math.min(total, Math.round(total * Math.min(1, k.pace * (0.4 + c.passed))));
      return { S: x, total, done, f: forecast({ done, total, acc: k.acc, passed: c.passed, target: k.goal }) };
    });
    return { ...k, items };
  };
  const all = kids.map(withPlan);
  const three = all.filter((k) => k.items.length && (only === 'all' || k.items.some((i) => i.S.id === only)));
  const rest = all.filter((k) => !k.items.length);
  const onTrack = all.filter((k) => k.items.length && k.items.every((i) => i.f.status === 'ok')).length;

  return (
    <div className="wrap">
      <h1 className="page-title scribble">{t('cls.title')}</h1>
      <p className="page-sub">{t('cls.sub')}</p>
      <div className="grades three" role="group" aria-label={t('prof.grade')}>
        {GRADES.map((n) => <button key={n} className={'gchip' + (g === n ? ' on' : '')} aria-pressed={g === n} onClick={() => update((x) => { x.grade = n; })}>{t('gradeShort', { n })}</button>)}
      </div>
      <ChorakBar />
      <div className="grid4 teach-stats three-col">
        <div className="tile"><I n="users" /><div><b>{all.length}</b><span>{t('cls.students')}</span></div></div>
        <div className="tile"><Mark m={3} /><div><b>{three.length}</b><span>{t('cls.withThree')}</span></div></div>
        <div className="tile"><I n="target" /><div><b>{onTrack}</b><span>{t('cls.onTrack')}</span></div></div>
      </div>

      <h2 className="h2">{t('cls.listTitle')}</h2>
      <div className="filters">
        <button className={'tchip' + (only === 'all' ? ' on' : '')} onClick={() => setOnly('all')}>{t('online.all')}</button>
        {subs.map((x) => <button key={x.id} className={'tchip' + (only === x.id ? ' on' : '')} onClick={() => setOnly(x.id)}>{t('subj.' + x.id)}</button>)}
      </div>
      {!three.length && <div className="empty">{t('cls.empty')}</div>}
      <div className="kids">
        {three.map((k) => (
          <button key={k.id} className="kid card" onClick={() => ui.showModal(<KidSheet id={k.id} />)}>
            <Avatar avatar={k.av} size={46} />
            <div className="kid-main">
              <b>{k.name}</b>
              <div className="kid-subs">{k.items.map((i) => <span key={i.S.id} className="kid-sub"><SubjGlyph s={i.S} size={20} />{t('subj.' + i.S.id)} <Mark m={3} />→<Mark m={k.goal} /></span>)}</div>
              {(() => { const d = k.items.reduce((a, i) => a + i.done, 0), tot = k.items.reduce((a, i) => a + i.total, 0); return <div className="plan-prog sm"><div className="pbar g"><div style={{ width: (d / tot) * 100 + '%' }} /></div><small>{d}/{tot}</small></div>; })()}
            </div>
            <span className={'chip fc ' + worst(k.items)}>{t('plan.st.' + worst(k.items), { m: Math.min(...k.items.map((i) => i.f.mark)) })}</span>
          </button>
        ))}
      </div>
      {rest.length > 0 && <>
        <h2 className="h2" style={{ marginTop: 22 }}>{t('cls.rest')}</h2>
        <div className="rest card">{rest.map((k) => <span key={k.id} className="rest-kid"><Avatar avatar={k.av} size={28} />{k.name} {subs.map((x) => <Mark key={x.id} m={k.marks[x.id]} />)}</span>)}</div>
      </>}
      <p className="note" style={{ marginTop: 14 }}>{t('cls.note')}</p>
    </div>
  );
}
const worst = (items) => (items.some((i) => i.f.status === 'risk') ? 'risk' : items.some((i) => i.f.status === 'close') ? 'close' : 'ok');

/** One student: change school marks, see the plan, send it to the parents. */
function KidSheet({ id }) {
  const t = useT();
  const ui = useUI();
  const s = useStore();
  const g = s.grade, c = chorakNow();
  const base = classmates(g).find((k) => k.id === id);
  const marks = { ...base.marks, ...(s.roster?.[g]?.[id] || {}) };
  const set = (sid, m) => update((x) => { x.roster = x.roster || {}; x.roster[g] = x.roster[g] || {}; x.roster[g][id] = { ...(x.roster[g][id] || {}), [sid]: m }; });
  const threes = schoolSubjects(g).filter((x) => marks[x.id] === 3);
  return (
    <>
      <div className="sheet-h"><Avatar avatar={base.av} size={56} /><div><h2>{base.name}</h2><small className="muted">{t('gradeShort', { n: g })} · {t('plan.chorak', { n: c.n })}</small></div></div>
      <div className="marks">{schoolSubjects(g).map((x) => (
        <div key={x.id} className="mark-row"><SubjGlyph s={x} size={30} /><span className="mr-name">{t('subj.' + x.id)}</span>
          <div className="seg marks-seg">{[3, 4, 5].map((n) => <button key={n} className={marks[x.id] === n ? 'on m' + n : ''} onClick={() => set(x.id, n)}>{n}</button>)}</div></div>))}
      </div>
      {threes.length > 0 && <div className="tip">
        <b>{t('cls.planFor', { name: base.name })}</b>
        <ul className="plan-req">{threes.map((x) => { const { planet, list } = planMissions(x.id, g, base.goal, c.n); return <li key={x.id}>{t('cls.planLine', { s: t('subj.' + x.id), p: tt(planet.title, t.lang), n: list.length, w: Math.ceil(list.length / c.weeksLeft), m: base.goal })}</li>; })}</ul>
      </div>}
      <button className="btn wide" onClick={() => { sfx.coin(); ui.closeModal(); ui.toast(t('cls.sent', { name: base.name })); }}>{t('cls.send')}</button>
    </>
  );
}

/** Compact card for the main page. */
export function PlanCard() {
  const t = useT();
  const ui = useUI();
  const s = useStore();
  const plans = myPlans(s);
  const c = chorakNow();
  if (!plans.length) return null;
  return (
    <button className="plan-mini card" onClick={() => ui.go('plan')}>
      <span className="pm-badge"><Mark m={3} /><I n="bolt" /><Mark m={plans[0].target} /></span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <b>{t('plan.miniTitle', { n: c.daysLeft })}</b>
        <small className="muted">{plans.map((p) => `${t('subj.' + p.S.id)} ${p.done}/${p.list.length}`).join(' · ')}</small>
      </div>
      <span className="btn sm blue">{t('open')}</span>
    </button>
  );
}
