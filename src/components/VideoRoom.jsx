import { useEffect, useRef, useState } from 'react';
import { I } from './ui.jsx';
import { Avatar } from './Cosmetics.jsx';
import { useStore } from '../lib/store.js';
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

/** Demo video classroom: animated teacher, whiteboard, chat, own camera (if allowed). */
export default function VideoRoom({ tutor, slot, onLeave }) {
  const t = useT();
  const s = useStore();
  const S = subj(tutor.s);
  const [secs, setSecs] = useState(0);
  const [lines, setLines] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const [mic, setMic] = useState(false);
  const [cam, setCam] = useState(false);
  const [camErr, setCamErr] = useState(false);
  const [hand, setHand] = useState(false);
  const [text, setText] = useState('');
  const [step, setStep] = useState(0);
  const video = useRef(), stream = useRef(), chatEnd = useRef();
  const topic = slot[2];

  const say = (who, msg) => {
    setLines((l) => [...l, { who, msg, k: Math.random() }]);
    if (who === 'teacher') { setSpeaking(true); setTimeout(() => setSpeaking(false), Math.min(4000, 900 + msg.length * 45)); }
  };
  useEffect(() => {
    const script = ['room.l1', 'room.l2', 'room.l3', 'room.l4', 'room.l5'];
    const timers = script.map((k, i) => setTimeout(() => { say('teacher', t(k, { topic })); setStep(i + 1); }, 1200 + i * 6500));
    const clock = setInterval(() => setSecs((x) => x + 1), 1000);
    return () => { timers.forEach(clearTimeout); clearInterval(clock); stream.current?.getTracks().forEach((tr) => tr.stop()); };
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
    setTimeout(() => say('teacher', t('room.reply', { name: s.child })), 1600);
  };
  const raise = () => { setHand(true); sfx.tap(5); setTimeout(() => { say('teacher', t('room.handReply', { name: s.child })); setHand(false); }, 2200); };
  const mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0');
  const variant = tutor.n.length % 3;

  return (
    <div className="room" role="dialog" aria-modal="true" aria-label={topic}>
      <header className="room-head">
        <span className="chip live">{t('room.live')} · {mm}:{ss}</span>
        <div className="room-title"><b>{topic}</b><small>{tutor.n} · {t('subj.' + S.id)}</small></div>
      </header>
      <div className="room-main">
        <div className="room-stage">
          <div className={'tile teacher' + (speaking ? ' talking' : '')}>
            <Professor color={S.c} variant={variant} speaking={speaking} />
            <span className="tile-name">{tutor.n}{speaking && <span className="eq-bars" aria-hidden="true"><i /><i /><i /></span>}</span>
          </div>
          <div className="board">
            <small className="board-label">{t('room.board')}</small>
            <h3 className="hand">{topic}</h3>
            <svg viewBox="0 0 300 90" className="board-draw" aria-hidden="true">
              {step >= 2 && <g className="draw">{[0, 1, 2, 3].map((i) => <rect key={i} x={20 + i * 52} y="14" width="46" height="34" rx="6" fill={i < 3 ? S.c : 'none'} stroke="#E2E8F0" strokeWidth="2" opacity=".9" />)}</g>}
              {step >= 3 && <text x="240" y="40" className="hand-svg">= ?</text>}
              {step >= 4 && <path className="draw-line" d="M20 70 C 80 60, 160 82, 280 66" stroke="#FDE68A" strokeWidth="3" fill="none" strokeLinecap="round" />}
            </svg>
          </div>
          <div className="tile me">
            {cam ? <video ref={video} autoPlay playsInline muted /> : <div className="me-off"><Avatar avatar={s.equip.avatar} frame={s.equip.frame} size={72} /><small>{camErr ? t('room.camErr') : t('room.camOff')}</small></div>}
            <span className="tile-name">{t('room.you')}{hand && <I n="hand" className="hand-up" />}</span>
          </div>
        </div>
        <aside className="room-chat">
          <b>{t('room.chat')}</b>
          <ul>
            {lines.map((l) => <li key={l.k} className={l.who}><small>{l.who === 'teacher' ? tutor.n : t('room.you')}</small><p>{l.msg}</p></li>)}
            <li ref={chatEnd} className="end" />
          </ul>
          <form onSubmit={send}><input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('room.type')} aria-label={t('room.type')} /><button className="btn sm blue">{t('room.send')}</button></form>
        </aside>
      </div>
      <footer className="room-bar">
        <button className={'rb' + (mic ? ' on' : ' off')} onClick={() => setMic(!mic)} aria-pressed={mic}><I n="mic" /><span>{t('room.mic')}</span></button>
        <button className={'rb' + (cam ? ' on' : ' off')} onClick={toggleCam} aria-pressed={cam}><I n="cam" /><span>{t('room.cam')}</span></button>
        <button className={'rb' + (hand ? ' on' : '')} onClick={raise}><I n="hand" /><span>{t('room.hand')}</span></button>
        <button className="rb leave" onClick={onLeave}><I n="close" /><span>{t('room.leave')}</span></button>
      </footer>
      <p className="room-note">{t('room.demo')}</p>
    </div>
  );
}
