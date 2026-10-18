// Original illustrations: crystal coin, meteor streak, banners, avatars, frames, rockets.
import { useId } from 'react';
import { item } from '../data/shop.js';
import { Mascot } from './ui.jsx';
import { useStore } from '../lib/store.js';

/** Crystal coin — the app currency. */
export function Crystal({ size = 22, className = '' }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={'crystal ' + className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={id + 'a'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#A5F3FC" /><stop offset="1" stopColor="#22D3EE" /></linearGradient>
        <linearGradient id={id + 'b'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#818CF8" /><stop offset="1" stopColor="#6D28D9" /></linearGradient>
      </defs>
      <path d="M6 3h12l4 6-10 13L2 9z" fill={`url(#${id}b)`} />
      <path d="M6 3l2 6H2zM8 9h8l-4 13z" fill={`url(#${id}a)`} />
      <path d="M8 9l4-6 4 6z" fill="#E0F2FE" />
      <path d="M16 9l2-6 4 6z" fill="#67E8F9" opacity=".8" />
      <path d="M6 3h12l4 6-10 13L2 9z" fill="none" stroke="#1E1B4B" strokeOpacity=".35" strokeWidth=".8" strokeLinejoin="round" />
      <path className="glint" d="M19.5 1.2l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5z" fill="#fff" />
    </svg>
  );
}

/** Meteor — the day-streak icon. lit=false when today's mission isn't done yet. */
export function Meteor({ size = 26, lit = true, className = '' }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={'meteor ' + (lit ? 'lit ' : 'cold ') + className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id={id + 'h'} cx="45%" cy="55%" r="55%"><stop offset="0" stopColor="#FFFFFF" /><stop offset=".35" stopColor="#FFF1B8" /><stop offset=".65" stopColor="#FFA94D" /><stop offset="1" stopColor="#FF6B1A" stopOpacity="0" /></radialGradient>
        <linearGradient id={id + 't'} x1="0.15" y1="0.85" x2="0.95" y2="0.05"><stop offset="0" stopColor="#FFB547" stopOpacity=".95" /><stop offset=".35" stopColor="#E0702A" stopOpacity=".7" /><stop offset=".7" stopColor="#6B4A3A" stopOpacity=".35" /><stop offset="1" stopColor="#6B4A3A" stopOpacity="0" /></linearGradient>
        <filter id={id + 'b'}><feGaussianBlur stdDeviation="1.6" /></filter>
      </defs>
      <g className="m-tail">
        <path d="M12 46 C 26 30, 40 18, 62 2 C 50 20, 34 36, 22 54 Z" fill={`url(#${id}t)`} filter={`url(#${id}b)`} />
        <path d="M14 47 C 28 34, 42 22, 58 8" stroke="#FFE3A3" strokeOpacity=".55" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>
      <circle className="m-glow" cx="17" cy="47" r="15" fill={`url(#${id}h)`} />
      <circle cx="16" cy="48" r="6.5" fill="#FFF8E1" />
      <g className="m-sparks" fill="#FFD27A">
        <circle cx="30" cy="40" r="1.3" /><circle cx="24" cy="32" r="1" /><circle cx="36" cy="30" r=".9" /><circle cx="8" cy="40" r="1" />
      </g>
    </svg>
  );
}

const STARS = Array.from({ length: 46 }, (_, i) => [(i * 97) % 400, (i * 53) % 140, (i % 5) * 0.25 + 0.5]);
const Stars = ({ op = 0.9 }) => <g fill="#fff">{STARS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} opacity={op * (0.4 + (i % 3) * 0.2)} />)}</g>;

/** Profile banner art (400×140, cropped to fit). */
export function BannerArt({ id }) {
  const u = useId().replace(/:/g, '');
  const g = (n) => `${u}${n}`;
  let body;
  switch (id) {
    case 'nebula': body = <>
      <rect width="400" height="140" fill="#0B0820" />
      <g filter={`url(#${g('bl')})`}><ellipse cx="120" cy="70" rx="120" ry="45" fill="#7C3AED" opacity=".7" /><ellipse cx="250" cy="60" rx="110" ry="50" fill="#EC4899" opacity=".55" /><ellipse cx="320" cy="95" rx="90" ry="35" fill="#22D3EE" opacity=".45" /></g>
      <Stars /></>; break;
    case 'aurora': body = <>
      <rect width="400" height="140" fill="#06141F" />
      <g filter={`url(#${g('bl')})`} opacity=".85"><path d="M-10 70 Q 80 20 160 60 T 330 40 T 420 60 L420 85 Q 330 65 250 90 T 90 80 T -10 95Z" fill="#22C55E" /><path d="M-10 50 Q 100 10 200 45 T 420 30 L420 45 Q 300 40 200 60 T -10 65Z" fill="#22D3EE" opacity=".7" /></g>
      <Stars op={0.6} /><path d="M0 140 L0 110 L60 92 L110 112 L170 85 L230 115 L300 95 L360 112 L400 100 L400 140Z" fill="#020A12" /></>; break;
    case 'mars': body = <>
      <rect width="400" height="140" fill={`url(#${g('sky')})`} />
      <circle cx="290" cy="78" r="30" fill="#FFE6B0" opacity=".9" /><circle cx="290" cy="78" r="46" fill="#FFB86B" opacity=".25" />
      <path d="M0 140 L0 104 Q 60 92 120 106 T 250 100 T 400 108 L400 140Z" fill="#7C2D12" /><path d="M0 140 L0 122 Q 90 112 180 124 T 400 120 L400 140Z" fill="#431407" /></>; break;
    case 'starfall': body = <>
      <rect width="400" height="140" fill="#0A1030" /><Stars />
      {[[60, 10], [180, 0], [300, 20], [120, 60], [360, 50]].map(([x, y], i) => <line key={i} x1={x} y1={y} x2={x - 60} y2={y + 45} stroke={`url(#${g('tr')})`} strokeWidth="2.5" strokeLinecap="round" />)}</>; break;
    case 'saturn': body = <>
      <rect width="400" height="140" fill="#0D0B1F" /><Stars />
      <ellipse cx="270" cy="72" rx="120" ry="22" fill="none" stroke="#E9D5A1" strokeOpacity=".5" strokeWidth="10" transform="rotate(-12 270 72)" />
      <circle cx="270" cy="72" r="44" fill={`url(#${g('pl')})`} />
      <path d="M150 85 A120 22 -12 0 0 390 45" fill="none" stroke="#F5E3B3" strokeOpacity=".85" strokeWidth="10" /></>; break;
    case 'samarkand': body = <>
      <rect width="400" height="140" fill={`url(#${g('night')})`} /><Stars op={0.7} />
      <circle cx="330" cy="32" r="16" fill="#FEF3C7" /><circle cx="338" cy="27" r="14" fill="#1E1B4B" />
      <g fill="#0B0A1E">
        <rect x="40" y="70" width="12" height="70" /><rect x="36" y="64" width="20" height="8" />
        <path d="M80 140 V96 H170 V140Z" /><path d="M95 96 Q125 46 155 96Z" />
        <rect x="190" y="60" width="14" height="80" /><rect x="186" y="54" width="22" height="8" />
        <path d="M220 140 V102 H330 V140Z" /><path d="M240 102 Q275 58 310 102Z" />
        <rect x="350" y="76" width="11" height="64" />
      </g>
      <path d="M95 96 Q125 46 155 96" fill="none" stroke="#38BDF8" strokeOpacity=".5" strokeWidth="2" /><path d="M240 102 Q275 58 310 102" fill="none" stroke="#38BDF8" strokeOpacity=".5" strokeWidth="2" /></>; break;
    case 'crystals': body = <>
      <rect width="400" height="140" fill="#081226" /><Stars op={0.5} />
      {[[40, 140, 30, 70], [90, 140, 22, 50], [150, 140, 40, 95], [230, 140, 26, 60], [290, 140, 44, 105], [360, 140, 30, 75]].map(([x, y, w, h], i) => (
        <g key={i}><path d={`M${x - w / 2} ${y} L${x - w / 3} ${y - h * 0.8} L${x} ${y - h} L${x + w / 3} ${y - h * 0.8} L${x + w / 2} ${y}Z`} fill={i % 2 ? '#6D28D9' : '#0EA5E9'} opacity=".9" />
          <path d={`M${x} ${y - h} L${x + w / 3} ${y - h * 0.8} L${x + w / 2} ${y} L${x} ${y}Z`} fill="#fff" opacity=".18" /></g>))}</>; break;
    default: body = <><rect width="400" height="140" fill={`url(#${g('deep')})`} /><Stars /><circle cx="340" cy="40" r="18" fill="#334155" /><circle cx="334" cy="34" r="18" fill="#475569" opacity=".5" /></>;
  }
  return (
    <svg className="banner-art" viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <filter id={g('bl')}><feGaussianBlur stdDeviation="14" /></filter>
        <linearGradient id={g('sky')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7C2D12" /><stop offset=".6" stopColor="#EA580C" /><stop offset="1" stopColor="#FDBA74" /></linearGradient>
        <linearGradient id={g('tr')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <radialGradient id={g('pl')} cx="35%" cy="35%"><stop offset="0" stopColor="#FDE68A" /><stop offset=".6" stopColor="#D97706" /><stop offset="1" stopColor="#78350F" /></radialGradient>
        <linearGradient id={g('night')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1E1B4B" /><stop offset="1" stopColor="#4338CA" /></linearGradient>
        <radialGradient id={g('deep')} cx="20%" cy="30%"><stop offset="0" stopColor="#1E2A5A" /><stop offset="1" stopColor="#070B16" /></radialGradient>
      </defs>
      {body}
    </svg>
  );
}

/** Avatar art (circle). */
export function AvatarArt({ id }) {
  const u = useId().replace(/:/g, '');
  const photo = useStore((s) => s.photo);
  if (id === 'photo' && photo) return <img className="ava-art photo" src={photo} alt="" />;
  if (id === 'qalam') return <span className="ava-art qalam"><Mascot /></span>;
  let art;
  switch (id) {
    case 'moon': art = <><rect width="64" height="64" fill="#1E1B4B" /><circle cx="32" cy="32" r="20" fill="#FDE68A" /><circle cx="40" cy="26" r="18" fill="#1E1B4B" /><circle cx="22" cy="30" r="2" fill="#78350F" /><path d="M20 38 q4 3 8 0" stroke="#78350F" strokeWidth="2" fill="none" strokeLinecap="round" /><circle cx="48" cy="46" r="1.4" fill="#fff" /><circle cx="52" cy="18" r="1" fill="#fff" /></>; break;
    case 'alien': art = <><rect width="64" height="64" fill="#0F2A1C" /><path d="M24 14 l-4 -8 M40 14 l4 -8" stroke="#86EFAC" strokeWidth="2.5" strokeLinecap="round" /><circle cx="20" cy="6" r="2.5" fill="#FDE047" /><circle cx="44" cy="6" r="2.5" fill="#FDE047" /><ellipse cx="32" cy="36" rx="20" ry="24" fill="#4ADE80" /><ellipse cx="24" cy="34" rx="6" ry="8" fill="#052E16" transform="rotate(-15 24 34)" /><ellipse cx="40" cy="34" rx="6" ry="8" fill="#052E16" transform="rotate(15 40 34)" /><circle cx="22" cy="31" r="1.6" fill="#fff" /><circle cx="38" cy="31" r="1.6" fill="#fff" /><path d="M28 48 q4 3 8 0" stroke="#052E16" strokeWidth="2" fill="none" strokeLinecap="round" /></>; break;
    case 'robot': art = <><rect width="64" height="64" fill="#172033" /><line x1="32" y1="8" x2="32" y2="16" stroke="#94A3B8" strokeWidth="2.5" /><circle cx="32" cy="7" r="3" fill="#F87171" /><rect x="14" y="16" width="36" height="32" rx="9" fill="#CBD5E1" /><rect x="19" y="23" width="26" height="13" rx="6" fill="#0F172A" /><circle cx="26" cy="29.5" r="3" fill="#22D3EE" /><circle cx="38" cy="29.5" r="3" fill="#22D3EE" /><rect x="25" y="40" width="14" height="3" rx="1.5" fill="#64748B" /><rect x="20" y="50" width="24" height="10" rx="4" fill="#94A3B8" /></>; break;
    case 'meteor': art = <><rect width="64" height="64" fill="#1A1020" /><svg x="8" y="8" width="48" height="48" viewBox="0 0 64 64"><Meteor size={64} /></svg></>; break;
    default: art = <>
      <rect width="64" height="64" fill="#13224A" />
      <circle cx="32" cy="34" r="22" fill="#F1F5F9" /><circle cx="32" cy="34" r="22" fill="none" stroke="#94A3B8" strokeWidth="2" />
      <rect x="15" y="25" width="34" height="20" rx="10" fill={`url(#${u}v)`} />
      <path d="M20 30 q6 -4 12 -2" stroke="#fff" strokeOpacity=".7" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="22" y="54" width="20" height="8" rx="3" fill="#CBD5E1" /><circle cx="51" cy="18" r="1.4" fill="#fff" /><circle cx="10" cy="14" r="1" fill="#fff" />
      <defs><linearGradient id={u + 'v'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#38BDF8" /><stop offset="1" stopColor="#4338CA" /></linearGradient></defs></>;
  }
  return <svg className="ava-art" viewBox="0 0 64 64" aria-hidden="true">{art}</svg>;
}

export function Avatar({ avatar = 'astro', frame = 'none', size = 64 }) {
  return (
    <span className={'avatar frame-' + frame} style={{ '--as': size + 'px' }}>
      <span className="avatar-in"><AvatarArt id={avatar} /></span>
    </span>
  );
}

/** Rocket in a given skin. */
export function RocketArt({ skin = 'classic' }) {
  const [body, accent, glass] = item('rocket', skin).c;
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 4c7 6 10 14 9 24l-9 6-9-6c-1-10 2-18 9-24z" fill={body} />
      <path d="M24 4c3 3 5 6 6 10H18c1-4 3-7 6-10z" fill={accent} />
      <circle cx="24" cy="21" r="4" fill={glass} stroke="#94A3B8" strokeWidth="1.5" />
      <path d="M15 28l-6 8 8-2zM33 28l6 8-8-2z" fill={accent} />
      <path className="flame" d="M20 34l4 10 4-10z" fill="#FB923C" />
      <path className="flame" d="M22 34l2 6 2-6z" fill="#FDE68A" />
    </svg>
  );
}
