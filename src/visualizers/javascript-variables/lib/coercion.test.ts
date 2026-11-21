import { describe, expect, it } from 'vitest';
import { explain, OPS, PRESETS, realResult } from './coercion';

describe('coercion engine', () => {
  it('matches real JavaScript for every preset × operator × preset', () => {
    let checked = 0;
    for (const left of PRESETS) {
      for (const right of PRESETS) {
        for (const op of OPS) {
          const a = left.make();
          const b = right.make();
          const engine = explain(a, op, b).result;
          const real = realResult(a, op, b);
          // Object.is treats NaN as equal to NaN, which is what we want here.
          expect(Object.is(engine, real), `${left.label} ${op} ${right.label}`).toBe(true);
          checked++;
        }
      }
    }
    expect(checked).toBe(PRESETS.length ** 2 * OPS.length);
  });

  it('always explains itself in at least one step', () => {
    for (const left of PRESETS)
      for (const right of PRESETS)
        for (const op of OPS)
          expect(explain(left.make(), op, right.make()).steps.length).toBeGreaterThan(0);
  });

  it('explains "5" - true like the article does', () => {
    const { result, steps } = explain('5', '-', true);
    expect(result).toBe(4);
    expect(steps).toEqual([
      '- only works on numbers, so both sides become numbers.',
      'Number("5") is 5',
      'Number(true) is 1',
      '5 - 1 is 4',
    ]);
  });

  it('knows the classics', () => {
    expect(explain('5', '+', 3).result).toBe('53');
    expect(explain(true, '+', true).result).toBe(2);
    expect(explain(null, '==', 0).result).toBe(false);
    expect(explain(null, '==', undefined).result).toBe(true);
    expect(explain(5, '===', '5').result).toBe(false);
  });
});
