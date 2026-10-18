import { useState } from 'react';
import { useStore, update } from '../lib/store.js';
import { SUBJ, subj } from '../data/subjects.js';
import { I, Mascot, SubjGlyph } from './ui.jsx';
import { Avatar } from './Cosmetics.jsx';
import { sfx } from '../lib/fx.js';
import { useT, LANGS } from '../lib/i18n.js';

const ROLES = [['child', 'user'], ['parent', 'parents'], ['teacher', 'teach']];

/** Creating a profile: language → who you are → name → grade (or subject for teachers). */
export default function Onboarding({ onDone }) {
  const t = useT();
  const s = useStore();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState(s.role === 'teacher' || s.role === 'parent' ? s.role : 'child');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(s.grade || 5);
  const [tSubj, setTSubj] = useState(s.tSubj || 'math');
  const steps = 4;
  const next = () => { sfx.tap(step + 3); setStep(step + 1); };
  const finish = () => {
    update((x) => {
      x.onboarded = true; x.role = role;
      x.child = name.trim() || x.child;
      if (role === 'teacher') x.tSubj = tSubj;
      else { x.grade = grade; const S = subj(x.subj); if (S.from > grade || S.to < grade) x.subj = 'math'; }
    });
    sfx.win(); onDone(role);
  };
  const nameLabel = role === 'parent' ? t('onb.childName') : role === 'teacher' ? t('onb.teacherName') : t('onb.name');

  return (
    <div className="onb" role="dialog" aria-modal="true" aria-label={t('onb.title')}>
      <div className="onb-card">
        <div className="onb-dots" aria-hidden="true">{Array.from({ length: steps }, (_, i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>
        {step === 0 && <>
          <Mascot className="onb-mascot" />
          <h1 className="scribble">{t('onb.title')}</h1>
          <p className="muted">{t('onb.sub')}</p>
          <div className="onb-langs">{LANGS.map(([k, full]) => <button key={k} className={'role card' + (s.lang === k ? ' on' : '')} aria-pressed={s.lang === k} onClick={() => update((x) => { x.lang = k; })}><b>{full}</b></button>)}</div>
          <button className="btn wide" onClick={next}>{t('onb.next')}</button>
        </>}
        {step === 1 && <>
          <h2>{t('role.title')}</h2>
          <div className="onb-roles">{ROLES.map(([r, ic]) => (
            <button key={r} className={'role card' + (role === r ? ' on' : '')} aria-pressed={role === r} onClick={() => { setRole(r); sfx.tap(3); }}>
              <I n={ic} /><div><b>{t('role.' + r)}</b><small className="muted">{t('role.' + r + 'Sub')}</small></div>
            </button>))}</div>
          <button className="btn wide" onClick={next}>{t('onb.next')}</button>
        </>}
        {step === 2 && <>
          <Avatar avatar={s.equip.avatar} frame={s.equip.frame} size={86} />
          <h2>{nameLabel}</h2>
          <input className="onb-input" autoFocus value={name} maxLength={24} placeholder={role === 'teacher' ? 'Нилуфар Каримова' : 'Тимур'} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && name.trim() && next()} />
          <button className="btn wide" disabled={!name.trim()} onClick={next}>{t('onb.next')}</button>
        </>}
        {step === 3 && role !== 'teacher' && <>
          <h2>{role === 'parent' ? t('prof.childGrade') : t('onb.grade')}</h2>
          <div className="grades onb-grades" role="group" aria-label={t('prof.grade')}>
            {Array.from({ length: 11 }, (_, i) => <button key={i} className={'gchip' + (grade === i + 1 ? ' on' : '')} aria-pressed={grade === i + 1} onClick={() => { setGrade(i + 1); sfx.tap(i); }}>{i + 1}</button>)}
          </div>
          <p className="muted small">{t('onb.gradeHint')}</p>
          <button className="btn wide" onClick={finish}>{t('onb.go')}</button>
        </>}
        {step === 3 && role === 'teacher' && <>
          <h2>{t('onb.subject')}</h2>
          <div className="onb-subj">{SUBJ.map((x) => <button key={x.id} className={'tchip' + (tSubj === x.id ? ' on' : '')} onClick={() => setTSubj(x.id)}><SubjGlyph s={x} size={24} /> {t('subj.' + x.id)}</button>)}</div>
          <button className="btn wide" onClick={finish}>{t('onb.go')}</button>
        </>}
        {step > 0 && <button className="link-btn" onClick={() => setStep(step - 1)}>← {t('back')}</button>}
      </div>
    </div>
  );
}
