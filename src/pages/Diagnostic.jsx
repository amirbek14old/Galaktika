import { useState } from 'react';
import { useStore, update, recordEvidence, unlock, addXP, addGems, notify } from '../lib/store.js';
import { INITIAL, priorsFor, update as bayes, nextQuestion, conclude, status, STATUS, estimate } from '../lib/diagnostic.js';
import { CONCEPTS, MICRO } from '../data/concepts.js';
import InlineQuestion from '../components/InlineQuestion.jsx';
import { Html, Mascot, useUI } from '../components/ui.jsx';
import { F } from '../lib/util.js';
import { confetti, sfx } from '../lib/fx.js';
import { prep } from '../lib/questions.js';
import { useT } from '../lib/i18n.js';

/**
 * Diagnose → Explain → Teach → Practice → Reassess → Adapt.
 * The engine is Bayesian over named hypotheses; every belief update is shown to the student.
 */
export default function Diagnostic({ params }) {
  const ui = useUI();
  const t = useT();
  const [stage, setStage] = useState(params?.micro ? 'lesson' : 'intro');
  const [post, setPost] = useState(null);
  const [log, setLog] = useState([]);
  const [asked, setAsked] = useState([]);
  const [cur, setCur] = useState(null);
  const [first, setFirst] = useState(null);
  const [verdict, setVerdict] = useState(params?.micro ? { concept: params.micro, direct: true } : null);
  const [initialQ, setInitialQ] = useState(() => prep(INITIAL));

  const start = () => { setStage('initial'); setPost(null); setLog([]); setAsked([]); setVerdict(null); setFirst(null); setInitialQ(prep(INITIAL)); sfx.tap(4); };

  const onInitial = (r, a) => {
    const n = parseInt(a.n, 10), d = parseInt(a.d, 10);
    update((s) => recordEvidence(s, 'add', r.ok, 'd0'));
    setFirst({ ok: r.ok, n, d });
    setLog([{ ok: r.ok, html: `${F('{1/2} + {1/3}')} → ${t('ev.answer')} ${n}/${d}` }]);
    if (!r.ok) setPost(priorsFor(n, d));
  };
  const afterInitial = () => {
    if (first.ok) { finish(null); return; }
    setCur(prep(nextQuestion(post, []))); setStage('follow');
  };
  const onFollow = (r) => {
    const q = cur;
    update((s) => recordEvidence(s, q.c, r.ok, q.id));
    setPost(bayes(post, q, r.ok)); setAsked((x) => [...x, q.id]);
    setLog((l) => [...l, { ok: r.ok, html: `${q.expr ? F(q.expr.replace(/\s*=\s*$/, '')) : F(q.prompt)} → ${r.ok ? t('ev.right') : t('ev.wrong')}` }]);
  };
  const afterFollow = () => { const q = nextQuestion(post, asked); if (q) setCur(prep(q)); else finish(post); };
  const finish = (p) => {
    const v = p ? conclude(p) : { h: null, concept: 'add' };
    setVerdict(v); setStage('result'); sfx.win();
    update((s) => {
      unlock(s, 'first-diag'); addXP(s, 10); addGems(s, 5);
      if (v.h && v.h !== 'slip') notify(s, 'bad', 'diag', { cause: v.h });
      s.sessions = [...(s.sessions || []), { at: Date.now(), first: first ? `${first.n}/${first.d}` : '', asked: asked.length, hypothesis: v.h, p: v.p ? Math.round(v.p * 100) : null, concept: v.concept }].slice(-10);
    });
  };

  return (
    <div className="wrap wide">
      <div className="diag-grid">
        <div className="diag-main">
          {stage === 'intro' && <Intro onStart={start} />}
          {stage === 'initial' && <>
            <StepHead n={1} title={t('diag.task')} sub={t('diag.taskSub')} />
            <InlineQuestion key={initialQ.uid} q={initialQ} showAnswer={false} onAnswered={onInitial} onNext={afterInitial} nextLabel={first?.ok ? t('diag.seeResult') : t('diag.continueInv')} />
          </>}
          {stage === 'follow' && cur && <>
            <StepHead n={2} title={t('diag.followN', { n: asked.length + (asked.includes(cur.id) ? 0 : 1) })} sub={t('diag.followSub')} />
            <InlineQuestion key={cur.uid} q={cur} onAnswered={onFollow} onNext={afterFollow} />
          </>}
          {stage === 'result' && <Verdict v={verdict} log={log} onLesson={() => setStage('lesson')} onRestart={start} />}
          {stage === 'lesson' && <MicroLesson conceptId={verdict.concept} onFinish={() => setStage('done')} onMap={() => ui.go('map')} />}
          {stage === 'done' && <Done conceptId={verdict.concept} onMap={() => ui.go('map')} onRestart={start} />}
        </div>
        {(post || log.length > 0) && stage !== 'lesson' && stage !== 'done' && <Investigation post={post} log={log} />}
      </div>
    </div>
  );
}

const StepHead = ({ n, title, sub }) => (
  <div className="step-head"><span className="step-n">{n}</span><div><h2>{title}</h2><p className="muted">{sub}</p></div></div>
);

function Intro({ onStart }) {
  const t = useT();
  return (
    <div className="intro card">
      <div className="sheet-h"><Mascot mood="wow" /><div><span className="chip trapc">{t('diag.min')}</span><h1 className="page-title" style={{ marginTop: 6 }}>{t('diag.title')}</h1></div></div>
      <p className="page-sub" style={{ marginBottom: 12 }}>{t('diag.intro')}</p>
      <ol className="cycle">{['diag.s1', 'diag.s2', 'diag.s3', 'diag.s4', 'diag.s5'].map((k, i) => { const [a, b] = t.list(k); return <li key={k}><span className="hand">{i + 1}</span><div><b>{a}</b><small className="muted">{b}</small></div></li>; })}</ol>
      <button className="btn wide" onClick={onStart}>{t('diag.begin')}</button>
      <p className="note hand" style={{ marginTop: 12, marginBottom: 0, fontSize: 18 }}>{t('diag.demoNote')}</p>
    </div>
  );
}

function Investigation({ post, log }) {
  const t = useT();
  const rows = post ? Object.entries(post).sort((a, b) => b[1] - a[1]) : [];
  return (
    <aside className="investigation card" aria-live="polite">
      <h3>{t('inv.title')}</h3>
      {post ? <>
        <p className="muted small">{t('inv.sub')}</p>
        {rows.map(([h, p]) => (
          <div key={h} className="hyp"><div className="hyp-top"><span>{t('hyp.' + h)}</span><b>{Math.round(p * 100)}%</b></div><div className="hbar"><div style={{ width: p * 100 + '%' }} /></div></div>
        ))}
      </> : <p className="muted small">{t('inv.wait')}</p>}
      <h4>{t('inv.evidence')}</h4>
      <ul className="evidence">{log.map((e, i) => <li key={i} className={e.ok ? 'ok' : 'bad'}><span>{e.ok ? '✓' : '✗'}</span><Html html={e.html} /></li>)}</ul>
    </aside>
  );
}

function Verdict({ v, log, onLesson, onRestart }) {
  const t = useT();
  const cTitle = t('c.' + v.concept);
  if (!v.h) return (
    <div className="verdict card">
      <div className="sheet-h"><Mascot /><div><span className="chip ok">{t('verdict.okChip')}</span><h2 style={{ marginTop: 6 }}>{t('verdict.okTitle')}</h2></div></div>
      <p>{t('verdict.okText')}</p>
      <div className="row"><button className="btn" onClick={onLesson}>{t('verdict.practice', { c: cTitle })}</button><button className="btn ghost" onClick={onRestart}>{t('verdict.restart')}</button></div>
    </div>
  );
  return (
    <div className="verdict card">
      <div className="sheet-h"><Mascot mood="wow" /><div><span className="chip trapc">{t('verdict.chip', { p: Math.round(v.p * 100) })}</span>
        <h2 style={{ marginTop: 6 }}>{v.h === 'slip' ? t('verdict.slipTitle') : <>{t('verdict.' + v.word)} <span className="accent">{t('hyp.' + v.h).toLowerCase()}</span></>}</h2></div></div>
      <p>{v.h === 'slip' ? t('verdict.slipText') : t(v.p >= 0.5 ? 'verdict.textSure' : 'verdict.textMaybe', { c: cTitle })}</p>
      <details className="why"><summary>{t('verdict.why')}</summary><ul className="evidence">{log.map((e, i) => <li key={i} className={e.ok ? 'ok' : 'bad'}><span>{e.ok ? '✓' : '✗'}</span><Html html={e.html} /></li>)}</ul></details>
      <div className="row"><button className="btn" onClick={onLesson}>{t('verdict.lesson', { c: cTitle })}</button><button className="btn ghost" onClick={onRestart}>{t('verdict.restart')}</button></div>
    </div>
  );
}

/** objective → explanation cards → guided (hint) → practice → reassessment → result */
export function MicroLesson({ conceptId, onFinish, onMap }) {
  const t = useT();
  const m = MICRO[conceptId] || MICRO.add;
  const [step, setStep] = useState(0);
  const [score, setScore] = useState([]);
  const [alt, setAlt] = useState(false);
  const [qs] = useState(() => ({ guided: prep(m.guided), practice: m.practice.map(prep), reassess: m.reassess.map(prep) }));
  const cards = m.cards.length;
  const seq = [
    ...m.cards.map((c, i) => ({ kind: 'card', c, i })),
    { kind: 'q', label: t('micro.together'), q: qs.guided, hint: m.guided.hint },
    ...qs.practice.map((q) => ({ kind: 'q', label: t('micro.solo'), q })),
    ...qs.reassess.map((q, i) => ({ kind: 'q', label: t('micro.check', { a: i + 1, b: qs.reassess.length }), q, re: true })),
    { kind: 'end' }
  ];
  const it = seq[step], total = seq.length - 1;
  const record = (q, re) => (r) => { update((s) => recordEvidence(s, q.c || conceptId, r.ok, q.id || q.prompt)); if (re) setScore((x) => [...x, r.ok]); };
  const passed = score.length === qs.reassess.length && score.every(Boolean);
  const next = () => {
    const n = step + 1;
    if (seq[n]?.kind === 'end') {
      const ok = score.length === qs.reassess.length && score.every(Boolean);
      update((s) => {
        addXP(s, 15);
        if (ok) { addGems(s, 10); unlock(s, 'gap-closed'); notify(s, 'good', 'gap', { c: conceptId }); }
        if (CONCEPTS.every((c) => status(s.concepts[c.id]?.c, s.concepts[c.id]?.w) === 'mastered')) unlock(s, 'frac-master');
      });
      if (ok) { confetti(); sfx.win(); }
    }
    setStep(n);
  };
  const cTitle = t('c.' + conceptId);
  return (
    <div className="micro">
      <div className="micro-top"><span className="chip trapc">{t('micro.chip')}</span><div className="l-bar small"><div style={{ width: (Math.min(step, total) / total) * 100 + '%' }} /></div></div>
      <h2 className="micro-title">{cTitle}</h2>
      {t('contentRu') && <p className="note">{t('contentRu')}</p>}
      {step === 0 && <p className="objective"><b>{t('micro.goal')}</b> {m.objective}</p>}
      {it.kind === 'card' && (
        <div className="card lesson-card" key={step}>
          <h3>{it.c.h}</h3><Html as="div" html={F(it.c.html)} />
          <button className="btn" onClick={next}>{it.i === cards - 1 ? t('micro.try') : t('next')}</button>
        </div>
      )}
      {it.kind === 'q' && <InlineQuestion key={it.q.uid} q={it.q} hint={it.hint} tag={<span className={'chip ' + (it.re ? 'work' : 'none')}>{it.label}</span>} onAnswered={record(it.q, it.re)} onNext={next} showAnswer={!it.re} />}
      {it.kind === 'end' && (
        <div className="card verdict">
          <div className="sheet-h"><Mascot mood={passed ? 'wow' : 'sad'} /><div><span className={'chip ' + (passed ? 'ok' : 'work')}>{t('micro.score', { a: score.filter(Boolean).length, b: qs.reassess.length })}</span><h2 style={{ marginTop: 6 }}>{passed ? t('micro.closed') : t('micro.almost')}</h2></div></div>
          {passed ? <p>{t('micro.closedText', { c: cTitle })}</p> : <>
            <p>{t('micro.otherWay')}</p>
            {alt ? <Html as="div" className="alt" html={F(m.alt)} /> : <button className="link-btn" onClick={() => setAlt(true)}>{t('micro.showAlt')}</button>}
          </>}
          <div className="row">
            <button className="btn" onClick={onMap}>{t('rail.openMap')}</button>
            {!passed && <button className="btn ghost" onClick={() => { setScore([]); setStep(cards); }}>{t('micro.again')}</button>}
            {passed && onFinish && <button className="btn ghost" onClick={onFinish}>{t('next')}</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function Done({ conceptId, onMap, onRestart }) {
  const t = useT();
  const s = useStore();
  const ev = s.concepts[conceptId] || { c: 0, w: 0 };
  const st = STATUS[status(ev.c, ev.w)];
  return (
    <div className="card verdict">
      <div className="sheet-h"><Mascot /><div><span className={'chip ' + st.cls}>{t(st.key)}</span><h2 style={{ marginTop: 6 }}>{t('c.' + conceptId)}</h2></div></div>
      <p>{t('done.text', { p: Math.round(estimate(ev.c, ev.w) * 100), n: ev.c + ev.w })}</p>
      <div className="row"><button className="btn" onClick={onMap}>{t('nav.map')}</button><button className="btn ghost" onClick={onRestart}>{t('newDiag')}</button></div>
    </div>
  );
}
