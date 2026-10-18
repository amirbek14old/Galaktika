import { useEffect, useRef, useState } from 'react';
import { I } from './ui.jsx';
import { Avatar } from './Cosmetics.jsx';
import { useStore, isPremium } from '../lib/store.js';
import { STUDENTS, STUDENT_AVATARS, crowd, usd, OPEN_USD, earnings } from '../data/lessons.js';
import { PremiumBadge } from './Pay.jsx';
import { useT } from '../lib/i18n.js';
import { subj } from '../data/subjects.js';
import { sfx } from '../lib/fx.js';

/** Original illustrated teacher; mouth moves while "speaking". */
function Professor({ color = '#865DFF', variant = 0, speaking }) {
  const skin = ['#F2C9A0', '#E0AC80', '#C68B5E'][variant % 3];
  const hair = ['#2B1B12', '#5B3A1E', '#1F2937'][variant % 3];
  return (
    <svg className={'prof' + (speaking ? ' speaking' : '')} viewBox="0 0 200 200" aria-hidden="true">
      <defs><radialGradient id={'pbg' + variant} cx="50%" cy="35%"><stop offset="0" stopColor="#3B2F7A" /><stop offset="1" stopColor="#141236" /></radialGradient></defs>
      <rect width="200" height="200" fill={`url(#pbg${variant})`} />
      <rect x="18" y="26" width="64" height="44" rx="4" fill="#0F2A1C" stroke="#8B6B3D" strokeWidth="3" />
      <path d="M28 56 l10-12 8 8 12-16 14 20" stroke="#E2E8F0" strokeWidth="2" fill="none" opacity=".7" />
      <circle cx="160" cy="40" r="10" fill="#FDE68A" opacity=".8" /><circle cx="150" cy="70" r="4" fill="#F472B6" opacity=".7" />
      <path d="M40 200 C 44 150, 70 136, 100 136 C 130 136, 156 150, 160 200Z" fill={color} />
      <path d="M86 138 L100 160 L114 138Z" fill="#F8FAFC" />
      <rect x="90" y="118" width="20" height="22" rx="6" fill={skin} />
      <ellipse cx="100" cy="96" rx="34" ry="38" fill={skin} />
      {variant % 2 === 0
        ? <path d="M64 92 C 62 58, 138 52, 136 92 C 132 74, 112 66, 100 70 C 88 66, 70 74, 64 92Z" fill={hair} />
        : <><circle cx="100" cy="52" r="16" fill={hair} /><path d="M64 98 C 58 60, 142 56, 136 98 C 134 74, 66 74, 64 98Z" fill={hair} /></>}
      <g fill="none" stroke="#1E1B4B" strokeWidth="3"><circle cx="86" cy="96" r="10" /><circle cx="114" cy="96" r="10" /><path d="M96 96h8" /></g>
      <circle cx="86" cy="97" r="3" fill="#1E1B4B" /><circle cx="114" cy="97" r="3" fill="#1E1B4B" />
      <path d="M76 82 q10 -6 18 0 M106 82 q10 -6 18 0" stroke={hair} strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse className="mouth" cx="100" cy="117" rx="9" ry="3" fill="#7F1D1D" />
      <ellipse cx="74" cy="110" rx="5" ry="3" fill="#F87171" opacity=".3" /><ellipse cx="126" cy="110" rx="5" ry="3" fill="#F87171" opacity=".3" />
    </svg>
  );
}

const pickN = (arr, n, seed) => { const a = [...arr]; let x = seed; for (let i = a.length - 1; i > 0; i--) { x = (x * 9301 + 49297) % 233280; const j = x % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };

/**
 * Classroom. mode 'student': animated teacher, raise your hand and the teacher gives you the floor.
 * mode 'host' (teacher): your camera, a grid of students, and a queue of raised hands to pick from.
 * Other students are simulated in the demo.
 */
export default function VideoRoom({ lesson, mode = 'student', onLeave }) {
  const t = useT();
  const s = useStore();
  const host = mode === 'host';
  const S = subj(lesson.s);
  const total = Math.max(host ? 1 : 2, crowd(lesson) + (host ? 0 : 1));
  const [others] = useState(() => pickN(STUDENTS, Math.min(host ? 8 : 5, Math.max(1, total - (host ? 0 : 1))), lesson.id.length * 97 + 13).map((n, i) => ({ n, av: STUDENT_AVATARS[i % STUDENT_AVATARS.length] })));
  const [secs, setSecs] = useState(0);
  const [lines, setLines] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const [mic, setMic] = useState(host);
  const [cam, setCam] = useState(false);
  const [camErr, setCamErr] = useState(false);
  const [hand, setHand] = useState(false);
  const [floor, setFloor] = useState(null); // who has the floor: student name, or 'me'
  const [queue, setQueue] = useState([]); // raised hands (names; 'me' for the student)
  const [text, setText] = useState('');
  const [step, setStep] = useState(0);
  const [banner, setBanner] = useState(null);
  const video = useRef(), stream = useRef(), chatEnd = useRef(), timers = useRef([]), queueRef = useRef([]);
  queueRef.current = queue;
  const topic = lesson.topic, me = s.child || t('room.you');
  const later = (f, ms) => { const id = setTimeout(f, ms); timers.current.push(id); return id; };

  const say = (who, msg, name) => {
    setLines((l) => [...l, { who, msg, name, k: Math.random() }]);
    if (who === 'teacher') { setSpeaking(true); later(() => setSpeaking(false), Math.min(4000, 900 + msg.length * 45)); }
  };
  const giveFloor = (name, byTeacher = true) => {
    setQueue((q) => q.filter((x) => x !== name));
    setFloor(name);
    if (name === 'me') {
      setHand(false); setMic(true); sfx.win();
      setBanner(t('room.yourTurn'));
      say('teacher', t('room.handReply', { name: me }));
      later(() => setBanner(null), 3500);
      later(() => setFloor((f) => (f === 'me' ? null : f)), 12000);
      return;
    }
    if (byTeacher && host) say('sys', t('room.gaveFloor', { name }));
    else say('sys', t('room.teacherPicked', { name }));
    later(() => say('student', t.list('room.answers')[name.length % 4], name), 1500);
    later(() => setFloor((f) => (f === name ? null : f)), 7000);
  };

  useEffect(() => {
    if (!host) {
      const script = ['room.l1', 'room.l2', 'room.l3', 'room.l4', 'room.l5'];
      script.forEach((k, i) => later(() => { say('teacher', t(k, { topic })); setStep(i + 1); }, 1200 + i * 6500));
    } else {
      later(() => { say('sys', t('room.hostHello', { n: total })); setStep(1); }, 800);
      later(() => setStep(2), 5000); later(() => setStep(3), 9000); later(() => setStep(4), 14000);
    }
    // simulated students raise hands now and then
    let i = 0;
    const raiseTick = setInterval(() => {
      const st = others[(i++ * 3) % others.length];
      if (!st) return;
      setQueue((q) => (q.includes(st.n) || q.length > 4 ? q : [...q, st.n]));
    }, host ? 4500 : 7000);
    // in student mode the teacher sometimes picks another student
    const pickTick = !host && setInterval(() => {
      const q = queueRef.current, other = q.find((x) => x !== 'me');
      if (other && !q.includes('me')) giveFloor(other, false);
    }, 11000);
    const clock = setInterval(() => setSecs((x) => x + 1), 1000);
    return () => { timers.current.forEach(clearTimeout); clearInterval(clock); clearInterval(raiseTick); if (pickTick) clearInterval(pickTick); stream.current?.getTracks().forEach((tr) => tr.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { chatEnd.current?.scrollIntoView({ block: 'nearest' }); }, [lines]);

  const toggleCam = async () => {
    if (cam) { stream.current?.getTracks().forEach((tr) => tr.stop()); stream.current = null; setCam(false); return; }
    try {
      const st = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.current = st; setCam(true); setCamErr(false);
      setTimeout(() => { if (video.current) video.current.srcObject = st; }, 30);
    } catch (e) { setCamErr(true); }
  };
  const send = (e) => {
    e.preventDefault(); if (!text.trim()) return;
    say('me', text.trim()); setText(''); sfx.tap(2);
    if (!host) later(() => say('teacher', t('room.reply', { name: me })), 1600);
  };
  const raise = () => {
    if (hand) { setHand(false); setQueue((q) => q.filter((x) => x !== 'me')); return; }
    setHand(true); sfx.tap(5); setQueue((q) => [...q.filter((x) => x !== 'me'), 'me']);
    say('sys', t('room.youRaised'));
    later(() => giveFloor('me'), 2600 + Math.random() * 1600);
  };
  const mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0');
  const variant = lesson.teacher.length % 3;
  const prem = isPremium(s);
  const myTile = (
    <div className={'tile me' + (floor === 'me' || (host && mic) ? ' talking' : '')}>
      {cam ? <video ref={video} autoPlay playsInline muted /> : <div className="me-off"><Avatar avatar={s.equip.avatar} frame={s.equip.frame} size={host ? 96 : 72} /><small>{camErr ? t('room.camErr') : t('room.camOff')}</small></div>}
      <span className="tile-name">{host ? t('room.youTeacher') : t('room.you')}{prem && <PremiumBadge small />}{hand && <I n="hand" className="hand-up" />}{floor === 'me' && <span className="eq-bars" aria-hidden="true"><i /><i /><i /></span>}</span>
    </div>
  );
  const studentTile = (st) => (
    <div key={st.n} className={'tile stu' + (floor === st.n ? ' talking' : '') + (queue.includes(st.n) ? ' raised' : '')}>
      <div className="me-off"><Avatar avatar={st.av} size={52} /></div>
      <span className="tile-name">{st.n}{queue.includes(st.n) && <I n="hand" className="hand-up" />}{floor === st.n && <span className="eq-bars" aria-hidden="true"><i /><i /><i /></span>}</span>
      {host && queue.includes(st.n) && <button className="btn sm floor-btn" onClick={() => giveFloor(st.n)}>{t('room.give')}</button>}
    </div>
  );
  const e = earnings(lesson, total - (host ? 0 : 1));

  return (
    <div className={'room' + (host ? ' host' : '')} role="dialog" aria-modal="true" aria-label={topic}>
      <header className="room-head">
        <span className="chip live">{t('room.live')} · {mm}:{ss}</span>
        <div className="room-title"><b>{topic}</b><small>{lesson.teacher} · {t('subj.' + S.id)}</small></div>
        <span className="chip people"><I n="users" /> {t('room.people', { n: total })}</span>
        {lesson.kind === 'open' && <span className="chip open">{usd(OPEN_USD)} · {t('ap.openShort')}</span>}
        {host && <span className="chip ok">{t('teach.you')}: {e.cur === 'usd' ? usd(e.teacher) : e.teacher + ' ◆'}</span>}
      </header>
      {banner && <div className="floor-banner" role="status"><I n="mic" /> {banner}</div>}
      <div className="room-main">
        <div className="room-stage">
          {host ? myTile : (
            <div className={'tile teacher' + (speaking ? ' talking' : '')}>
              <Professor color={S.c} variant={variant} speaking={speaking} />
              <span className="tile-name">{lesson.teacher}{speaking && <span className="eq-bars" aria-hidden="true"><i /><i /><i /></span>}</span>
            </div>
          )}
          <div className="board">
            <small className="board-label">{t('room.board')}</small>
            <h3 className="hand">{topic}</h3>
            <svg viewBox="0 0 300 90" className="board-draw" aria-hidden="true">
              {step >= 2 && <g className="draw">{[0, 1, 2, 3].map((i) => <rect key={i} x={20 + i * 52} y="14" width="46" height="34" rx="6" fill={i < 3 ? S.c : 'none'} stroke="#E2E8F0" strokeWidth="2" opacity=".9" />)}</g>}
              {step >= 3 && <text x="240" y="40" className="hand-svg">= ?</text>}
              {step >= 4 && <path className="draw-line" d="M20 70 C 80 60, 160 82, 280 66" stroke="#FDE68A" strokeWidth="3" fill="none" strokeLinecap="round" />}
            </svg>
          </div>
          {!host && myTile}
          <div className="stu-grid">
            {others.map(studentTile)}
            {total - others.length - 1 > 0 && <div className="tile stu more"><b>+{total - others.length - 1}</b><small>{t('room.more')}</small></div>}
          </div>
        </div>
        <aside className="room-chat">
          <div className="hands">
            <b><I n="hand" /> {t('room.hands', { n: queue.length })}</b>
            {!queue.length && <small className="muted">{t('room.noHands')}</small>}
            <ul>{queue.map((n) => <li key={n}><span>{n === 'me' ? me + ' (' + t('room.you') + ')' : n}</span>
              {host ? <button className="btn sm" onClick={() => giveFloor(n)}>{t('room.give')}</button> : <small className="muted">{t('room.waiting')}</small>}</li>)}</ul>
          </div>
          <b>{t('room.chat')}</b>
          <ul>
            {lines.map((l) => <li key={l.k} className={l.who}>{l.who !== 'sys' && <small>{l.who === 'teacher' ? lesson.teacher : l.who === 'student' ? l.name : t('room.you')}</small>}<p>{l.msg}</p></li>)}
            <li ref={chatEnd} className="end" />
          </ul>
          <form onSubmit={send}><input value={text} onChange={(ev) => setText(ev.target.value)} placeholder={t('room.type')} aria-label={t('room.type')} /><button className="btn sm blue">{t('room.send')}</button></form>
        </aside>
      </div>
      <footer className="room-bar">
        <button className={'rb' + (mic ? ' on' : ' off')} onClick={() => setMic(!mic)} aria-pressed={mic}><I n="mic" /><span>{t('room.mic')}</span></button>
        <button className={'rb' + (cam ? ' on' : ' off')} onClick={toggleCam} aria-pressed={cam}><I n="cam" /><span>{t('room.cam')}</span></button>
        {!host && <button className={'rb' + (hand ? ' on' : '')} onClick={raise} aria-pressed={hand}><I n="hand" /><span>{hand ? t('room.lower') : t('room.hand')}</span></button>}
        {host && <button className="rb" disabled={!queue.length} onClick={() => queue[0] && giveFloor(queue[0])}><I n="hand" /><span>{t('room.next')}</span></button>}
        <button className="rb leave" onClick={onLeave}><I n="close" /><span>{host ? t('room.end') : t('room.leave')}</span></button>
      </footer>
      <p className="room-note">{host ? t('room.hostDemo') : t('room.demo')}</p>
    </div>
  );
}
