import { useEffect, useRef, useState } from 'react';
import { Html, Mascot } from './ui.jsx';
import { F, lbl, esc, fracSVG, pic, shuffle } from '../lib/util.js';
import { COMPARE } from '../lib/questions.js';
import { sfx, burst } from '../lib/fx.js';
import { useT } from '../lib/i18n.js';

const esym = (s) => s.replace('<', '&lt;').replace('>', '&gt;');

/**
 * Renders one question. Controlled: `a` is the answer state, `setA` updates it.
 * phase: 'answer' | 'checked'; res: { ok } after checking. Match questions report via onMatchDone.
 */
export default function QuestionBody({ q, a, setA, phase, res, tag, onMatchDone, onMatchMiss, compact }) {
  const t = useT();
  const locked = phase !== 'answer';
  const optCls = (i, isRight) => {
    let c = 'opt';
    if (a.sel === i) c += locked ? (res?.ok ? ' good' : ' bad') : ' sel';
    if (locked && !res?.ok && isRight) c += ' reveal';
    return c;
  };
  const choose = (i) => { if (!locked) { setA({ sel: i }); sfx.tap(); } };
  const vis = (v) => (Array.isArray(v) ? v.map((p) => pic(p, 96)).join('<span class="op">+</span>') : pic(v, 140));
  const title = q.type === 'build' ? t('translateSentence') : q.prompt;

  let body = null;
  if (q.type === 'pick') {
    const short = q.options.every((o) => o.t.length <= 12);
    body = <>
      {q.visual && <div className="scene">{!compact && <Mascot />}<Html as="div" className="vis" html={vis(q.visual)} /></div>}
      <div className={'opts' + (short ? ' two' : '')}>
        {q.options.map((o, i) => <button key={i} className={optCls(i, o.ok)} onClick={() => choose(i)} disabled={locked}><span className="k">{i + 1}</span><Html className="lbl" html={lbl(o.t)} /></button>)}
      </div></>;
  } else if (q.type === 'pickimg') {
    body = <div className="opts" style={{ gridTemplateColumns: `repeat(${q.options.length},minmax(0,1fr))` }}>
      {q.options.map((o, i) => <button key={i} className={optCls(i, o.ok) + ' pic'} onClick={() => choose(i)} disabled={locked}><Html html={pic(o.p, 92)} /><span className="k">{i + 1}</span></button>)}
    </div>;
  } else if (q.type === 'compare') {
    const [an, ad] = q.a.split('/').map(Number), [bn, bd] = q.b.split('/').map(Number);
    const sym = a.sel != null ? COMPARE[a.sel] : null;
    body = <>
      <div className="cmp">
        <div className="side"><Html html={lbl(q.a)} /><Html html={fracSVG(an, ad, 'bar', 62)} /></div>
        <Html className={'slot' + (sym ? ' filled' : '') + (locked ? (res?.ok ? ' popa okc' : ' shake badc') : '')} html={sym ? esym(sym) : '?'} />
        <div className="side"><Html html={lbl(q.b)} /><Html html={fracSVG(bn, bd, 'bar', 62)} /></div>
      </div>
      <div className="cmp-opts">{COMPARE.map((s, i) => <button key={s} className={optCls(i, s === q.ans)} onClick={() => choose(i)} disabled={locked}><Html html={esym(s)} /></button>)}</div></>;
  } else if (q.type === 'input') {
    const set = (k) => (e) => setA({ ...a, [k]: e.target.value.replace(/\D/g, '').slice(0, 3) });
    body = <>
      {q.visual && <div className="scene">{!compact && <Mascot />}<Html as="div" className="vis" html={pic(q.visual, 140)} /></div>}
      <div className={'eq' + (locked ? (res?.ok ? ' good popa' : ' bad shake') : '')}>
        {q.expr && <Html html={F(q.expr)} />}
        <span className="fin">
          <input aria-label="Числитель" inputMode="numeric" autoComplete="off" value={a.n} onChange={set('n')} disabled={locked} autoFocus />
          <i />
          <input aria-label="Знаменатель" inputMode="numeric" autoComplete="off" value={a.d} onChange={set('d')} disabled={locked} readOnly={!!q.fixedD} />
        </span>
      </div></>;
  } else if (q.type === 'num') {
    body = <div className="scene">{!compact && <Mascot />}<div className="vis"><div className={'eq' + (locked ? (res?.ok ? ' good popa' : ' bad shake') : '')}>
      <input className="numin" aria-label="Ответ" placeholder="?" inputMode="decimal" autoComplete="off" autoFocus value={a.x} disabled={locked}
        onChange={(e) => setA({ x: e.target.value.replace(/[^\d.,\-−]/g, '').slice(0, 10) })} />
    </div></div></div>;
  } else if (q.type === 'shade') {
    const k = a.state.filter(Boolean).length;
    const onClick = (e) => {
      const s = e.target.closest('.seg'); if (!s || locked) return;
      const st = a.state.slice(); st[+s.dataset.i] = !st[+s.dataset.i]; setA({ state: st }); sfx.tap(st.filter(Boolean).length);
    };
    body = <div className={'shade-box' + (locked ? (res?.ok ? ' popa' : ' shake') : '')}>
      <Html as="div" onClick={onClick} html={fracSVG(0, q.d, q.kind, 180, { interactive: true, state: a.state })} />
      <span className="count">{t('shaded', { a: k, b: q.d })}</span>
    </div>;
  } else if (q.type === 'match') {
    body = <Match q={q} onDone={onMatchDone} onMiss={onMatchMiss} />;
  } else if (q.type === 'order' || q.type === 'build') {
    const isOrder = q.type === 'order';
    const label = (t) => (isOrder ? lbl(t) : esc(t));
    const add = (i) => { if (locked || a.order.includes(i)) return; setA({ order: [...a.order, i] }); sfx.tap(a.order.length); };
    const remove = (j) => { if (locked) return; const o = a.order.slice(); o.splice(j, 1); setA({ order: o }); };
    body = <>
      {!isOrder && <div className="scene">{!compact && <Mascot />}<div className="vis say">{q.prompt.replace(/^Переведи:\s*/, '')}</div></div>}
      <div className={'order-line' + (isOrder ? '' : ' words')}>
        {a.order.map((i, j) => <span key={i} className="tile-wrap">{j > 0 && isOrder && <span className="lt">&lt;</span>}
          <button className={'opt' + (locked ? (res?.ok ? ' good' : ' bad') : '')} onClick={() => remove(j)} disabled={locked}><Html html={label(q.tiles[i])} /></button></span>)}
      </div>
      <div className="order-bank">{q.tiles.map((t, i) => <button key={i} className={'opt' + (a.order.includes(i) ? ' ph' : '')} onClick={() => add(i)} disabled={locked}><Html html={label(t)} /></button>)}</div></>;
  }

  return (
    <div className={'q' + (compact ? ' compact' : '')} key={q.uid}>
      <div className="q-tag">{tag}<span>{t('type.' + q.type)}</span></div>
      <Html as="h2" className="q-title" html={F(title)} />
      {body}
    </div>
  );
}

/** Tap-to-match pairs. Completes on its own; wrong pairs shake. */
function Match({ q, onDone, onMiss }) {
  const [right] = useState(() => shuffle(q.pairs.map((p, i) => ({ i, x: p[1] }))));
  const [gone, setGone] = useState([]);
  const [sel, setSel] = useState({ l: null, r: null });
  const [flashState, setFlash] = useState({});
  const refs = useRef({});
  const item = (x) => (typeof x === 'string' ? lbl(x) : pic(x, 58));
  useEffect(() => {
    if (sel.l == null || sel.r == null) return;
    const { l, r } = sel;
    if (l === r) {
      setFlash({ [`l${l}`]: 'right', [`r${r}`]: 'right' }); burst(refs.current[`r${r}`], true, 10); sfx.tap(gone.length * 3 + 4);
      setTimeout(() => { setGone((g) => { const n = [...g, l]; if (n.length === q.pairs.length) setTimeout(() => onDone && onDone(), 250); return n; }); setFlash({}); }, 350);
    } else {
      setFlash({ [`l${l}`]: 'wrong', [`r${r}`]: 'wrong' }); sfx.bad(); onMiss && onMiss();
      setTimeout(() => setFlash({}), 450);
    }
    setSel({ l: null, r: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);
  const btn = (side, i, x) => {
    const key = side + i, isGone = gone.includes(i);
    const cls = 'opt' + (isGone ? ' gone' : '') + (flashState[key] ? ' ' + flashState[key] : sel[side] === i ? ' sel' : '');
    return <button key={key} ref={(el) => (refs.current[key] = el)} className={cls} disabled={isGone} onClick={() => setSel((s) => ({ ...s, [side]: i }))}><Html html={item(x)} /></button>;
  };
  return <div className="match"><div className="colm">{q.pairs.map((p, i) => btn('l', i, p[0]))}</div><div className="colm">{right.map((o) => btn('r', o.i, o.x))}</div></div>;
}
