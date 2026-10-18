import { useRef, useState } from 'react';
import QuestionBody from './QuestionBody.jsx';
import { Html, icon } from './ui.jsx';
import { initAnswer, isReady, evaluate, answerHTML } from '../lib/questions.js';
import { sfx, burst, flash } from '../lib/fx.js';
import { useT } from '../lib/i18n.js';

/** A question card with its own check button — used by the diagnostic and micro-lessons. */
export default function InlineQuestion({ q, tag, hint, onAnswered, onNext, nextLabel, showAnswer = true }) {
  const t = useT();
  const [a, setA] = useState(() => initAnswer(q));
  const [phase, setPhase] = useState('answer');
  const [res, setRes] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const box = useRef();
  const check = () => {
    const r = evaluate(q, a); setRes(r); setPhase('checked');
    if (r.ok) { sfx.ok(); burst(box.current?.querySelector('.good, .eq, .slot') || box.current, true); } else { sfx.bad(); flash(); }
    onAnswered && onAnswered(r, a);
  };
  return (
    <div className={'iq card' + (phase === 'checked' ? (res.ok ? ' iq-ok' : ' iq-bad') : '')} ref={box}>
      <QuestionBody q={q} a={a} setA={setA} phase={phase} res={res} tag={tag} compact onMatchDone={() => { setRes({ ok: true }); setPhase('checked'); onAnswered && onAnswered({ ok: true }); }} />
      {hint && phase === 'answer' && (showHint ? <p className="hint">{hint}</p> : <button className="link-btn" onClick={() => setShowHint(true)}>{t('hint')}</button>)}
      <div className="iq-foot" aria-live="polite">
        {phase === 'checked' && (
          <div className="iq-fb">
            <Html className="badge sm" html={icon(res.ok ? 'okBig' : 'badBig')} />
            <div><b>{res.ok ? t('correct') : t('notQuite')}</b>{!res.ok && showAnswer && <span className="muted"> {t('rightIs')} <Html html={answerHTML(q)} /></span>}</div>
          </div>
        )}
        {phase === 'answer'
          ? <button className="btn" disabled={!isReady(q, a)} onClick={check}>{t('check')}</button>
          : <button className="btn" autoFocus onClick={() => onNext(res)}>{nextLabel || t('next')}</button>}
      </div>
    </div>
  );
}
