import { describe, it, expect } from 'vitest';
import { priorsFor, update, nextQuestion, conclude, FOLLOW, estimate, status, entropy, INITIAL } from './diagnostic.js';
import { evaluate, initAnswer, isReady } from './questions.js';

const q = (id) => FOLLOW.find((f) => f.id === id);
const sum = (p) => Object.values(p).reduce((a, b) => a + b, 0);

describe('diagnostic engine', () => {
  it('a single wrong answer does not prove a misconception', () => {
    const r = conclude(priorsFor(2, 5));
    expect(r.p).toBeLessThan(0.75);
    expect(r.word).not.toBe('likely');
  });

  it('posteriors stay a valid probability distribution', () => {
    let p = priorsFor(2, 5);
    for (const f of FOLLOW) { p = update(p, f, Math.random() < 0.5); expect(sum(p)).toBeCloseTo(1, 6); Object.values(p).forEach((v) => { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }); }
  });

  it('different answer patterns lead to different conclusions', () => {
    let a = priorsFor(2, 5); a = update(a, q('f_equiv'), true); a = update(a, q('f_addsame'), false);
    let b = priorsFor(2, 5); b = update(b, q('f_equiv'), false); b = update(b, q('f_convert'), false);
    expect(conclude(a).h).toBe('addden');
    expect(conclude(b).h).toBe('equiv');
  });

  it('all-correct follow-ups point to a slip', () => {
    let p = priorsFor(3, 6);
    for (const id of ['f_equiv', 'f_addsame', 'f_lcd']) p = update(p, q(id), true);
    expect(conclude(p).h).toBe('slip');
  });

  it('picks an informative follow-up and stops after the limit', () => {
    const p = priorsFor(2, 5);
    const first = nextQuestion(p, []);
    expect(first).not.toBeNull();
    expect(entropy(update(p, first, false))).toBeLessThan(entropy(p) + 1);
    expect(nextQuestion(p, ['a', 'b', 'c'])).toBeNull();
  });

  it('mastery estimate stays in range and reflects evidence', () => {
    expect(estimate(0, 0)).toBe(0.5);
    expect(estimate(10, 0)).toBeLessThan(1);
    expect(estimate(0, 10)).toBeGreaterThan(0);
    expect(status(0, 0)).toBe('unknown');
    expect(status(1, 0)).toBe('practice'); // one answer is not enough to call it mastered
    expect(status(4, 0)).toBe('mastered');
    expect(status(0, 3)).toBe('gap');
  });
});

describe('question evaluation', () => {
  it('accepts equivalent fractions and handles malformed input safely', () => {
    expect(evaluate(INITIAL, { n: '10', d: '12' }).ok).toBe(true);
    expect(evaluate(INITIAL, { n: '2', d: '5' }).ok).toBe(false);
    expect(evaluate(INITIAL, { n: '', d: '' }).ok).toBe(false);
    expect(evaluate(INITIAL, { n: '1', d: '0' }).ok).toBe(false);
    expect(isReady(INITIAL, initAnswer(INITIAL))).toBe(false);
  });
});
