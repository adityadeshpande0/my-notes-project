import { describe, expect, it } from 'vitest';
import {
  allArrayChoices,
  allObjectChoices,
  arrayPatternCode,
  combine,
  copyArray,
  maxSpread,
  maxWhole,
  nestedPincode,
  nestedPincodeSafe,
  NESTED_USER,
  objectPatternCode,
  overrideAfter,
  overrideBefore,
  reactUpdate,
  runArrayPattern,
  runObjectPattern,
  SNACKS,
  swap,
  total,
  USER,
} from './destructure';

/** Run the learner's code for real (tests only) and return the named variables. */
function runCode(code: string, names: string[], scope: Record<string, unknown>) {
  const keys = Object.keys(scope);
  const fn = new Function(...keys, `${code}\nreturn { ${names.join(', ')} };`);
  return fn(...keys.map((k) => scope[k]));
}

describe('object destructuring builder', () => {
  const choices = allObjectChoices();
  it('covers every combination', () => expect(choices.length).toBe(3 * 3 * 3 * 3 * 3 * 2));
  it('matches the real syntax shown, for every combination', () => {
    for (const c of choices) {
      const code = objectPatternCode(c);
      const { bindings, others } = runObjectPattern(c);
      const names = [...bindings.map((b) => b.variable), ...(c.rest ? ['others'] : [])];
      const real = runCode(code, names, { user: USER });
      for (const b of bindings) expect(b.value, code).toEqual(real[b.variable]);
      if (c.rest) expect(others, code).toEqual(real.others);
    }
  });
  it('uses defaults only for missing properties', () => {
    const r = runObjectPattern({
      modes: { name: 'rename', age: 'default', city: 'off', country: 'default', phone: 'on' },
      rest: true,
    });
    expect(r.bindings.map((b) => [b.variable, b.value, !!b.defaultUsed])).toEqual([
      ['fullName', 'Riya', false],
      ['age', 19, false],
      ['country', 'India', true],
      ['phone', undefined, false],
    ]);
    expect(r.others).toEqual({ city: 'Pune' });
  });
});

describe('nested destructuring', () => {
  it('pulls the pincode out, and throws a real TypeError without an address', () => {
    expect(nestedPincode(NESTED_USER)).toEqual({ ok: true, value: '411001' });
    const bad = nestedPincode(USER);
    expect(bad.ok).toBe(false);
    expect(!bad.ok && bad.error).toMatch(/^TypeError: /);
    expect(nestedPincodeSafe(USER)).toEqual({ ok: true, value: undefined });
  });
});

describe('array destructuring builder', () => {
  it('matches the real syntax shown, for every combination', () => {
    for (const c of allArrayChoices()) {
      const code = arrayPatternCode(c);
      const { bindings, rest } = runArrayPattern(c);
      const names = [...bindings.map((b) => b.variable), ...(c.rest ? ['rest'] : [])];
      const real = runCode(code, names, { snacks: SNACKS });
      for (const b of bindings) expect(b.value, code).toEqual(real[b.variable]);
      if (c.rest) expect(rest, code).toEqual(real.rest);
    }
  });
  it('swaps without a temp variable', () => {
    expect(swap().after).toEqual({ a: 'coffee', b: 'chai' });
  });
});

describe('spread and rest', () => {
  it('give the results the article states', () => {
    expect(combine()).toEqual(['chai', 'lassi', 'samosa', 'jalebi']);
    expect(copyArray()).toEqual({ copy: ['chai', 'lassi'], same: false });
    expect(overrideAfter()).toEqual({ size: 'medium', sugar: 2 });
    expect(overrideBefore()).toEqual({ sugar: 1, size: 'medium' });
    expect(maxSpread()).toBe(45);
    expect(maxWhole()).toBeNaN();
    expect(total(30, 20, 45)).toBe(95);
    expect(reactUpdate()).toMatchObject({ updated: { name: 'Riya', age: 20 }, same: false });
  });
});
