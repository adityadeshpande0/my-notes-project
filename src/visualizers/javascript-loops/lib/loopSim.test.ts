import { describe, expect, it } from 'vitest';
import {
  CHAI_STARTS,
  chaiSpec,
  CMP_OPS,
  collectIn,
  collectOf,
  diceSpec,
  fixLoop,
  forSteps,
  GUARD,
  gridSteps,
  gridTotal,
  laneSteps,
  routeSteps,
  seededRolls,
  UPDATES,
  type ForSpec,
  type GridPattern,
  type House,
} from './loopSim';

/**
 * Run a real for loop built from the same settings. Tests only: the app
 * never turns text into code. Returns null if it would run past the guard.
 */
function realFor(spec: ForSpec): string[] | null {
  const fn = new Function(
    `const out = [];
     let laps = 0;
     for (let i = ${spec.start}; i ${spec.op} ${spec.limit}; ${spec.update}) {
       if (laps === ${GUARD}) return null;
       out.push(String(i));
       laps++;
     }
     return out;`,
  );
  return fn();
}

const last = <T>(xs: T[]) => xs[xs.length - 1];

describe('forSteps matches real for loops', () => {
  it('for every builder combination', () => {
    let checked = 0;
    for (let start = 0; start <= 10; start++)
      for (const op of CMP_OPS)
        for (let limit = 0; limit <= 20; limit++)
          for (const update of UPDATES) {
            const spec = { start, op, limit, update };
            const steps = forSteps(spec);
            const real = realFor(spec);
            const end = last(steps);
            if (real === null) {
              expect(end.phase).toBe('guard');
              expect(end.laps).toBe(GUARD); // the guard triggers exactly at 50
            } else {
              expect(end.phase).toBe('end');
              expect(end.output).toEqual(real);
            }
            checked++;
          }
    expect(checked).toBe(11 * 5 * 21 * 6);
  });

  it('runs ① once, ② before every lap and ③ after every lap', () => {
    const steps = forSteps({ start: 1, op: '<=', limit: 5, update: 'i++' });
    const phases = steps.map((s) => s.phase);
    expect(phases.filter((p) => p === 'init')).toHaveLength(1);
    expect(phases.filter((p) => p === 'check')).toHaveLength(6);
    expect(phases.filter((p) => p === 'body')).toHaveLength(5);
    expect(phases.filter((p) => p === 'update')).toHaveLength(5);
    expect(last(steps).i).toBe(6);
  });

  it('fixLoop turns every infinite preset-style loop into one that ends', () => {
    for (let start = 0; start <= 10; start++)
      for (const op of CMP_OPS)
        for (let limit = 0; limit <= 20; limit++)
          for (const update of UPDATES) {
            const spec = { start, op, limit, update };
            if (last(forSteps(spec)).phase !== 'guard') continue;
            expect(last(forSteps(fixLoop(spec))).phase).toBe('end');
          }
  });
});

describe('while vs do...while', () => {
  it('matches real loops for every START value', () => {
    for (const start of CHAI_STARTS) {
      let level = start;
      let whileLaps = 0;
      while (level < 100) {
        level += 25;
        whileLaps++;
      }
      const whileEnd = level;
      level = start;
      let doLaps = 0;
      do {
        level += 25;
        doLaps++;
      } while (level < 100);

      const w = last(laneSteps('while', chaiSpec(start)));
      const d = last(laneSteps('doWhile', chaiSpec(start)));
      expect([w.laps, w.value]).toEqual([whileLaps, whileEnd]);
      expect([d.laps, d.value]).toEqual([doLaps, level]);
    }
  });

  it('do...while pours once even at 100 (and overflows to 125)', () => {
    expect(last(laneSteps('while', chaiSpec(100))).laps).toBe(0);
    const d = last(laneSteps('doWhile', chaiSpec(100)));
    expect([d.laps, d.value]).toEqual([1, 125]);
  });

  it('rolls dice deterministically per seed, and matches a real loop', () => {
    expect(seededRolls(7)).toEqual(seededRolls(7));
    expect(seededRolls(7)).not.toEqual(seededRolls(8));
    for (let seed = 1; seed <= 30; seed++) {
      const rolls = seededRolls(seed);
      expect(rolls.every((r) => r >= 1 && r <= 6)).toBe(true);
      let k = 0;
      let roll;
      do {
        roll = rolls[k++];
      } while (roll !== 6);
      expect(last(laneSteps('doWhile', diceSpec(rolls))).laps).toBe(k);
      expect(last(laneSteps('while', diceSpec(rolls))).laps).toBe(k);
    }
  });
});

describe('for...of and for...in', () => {
  it('collect values and keys from real loops', () => {
    expect(collectOf(['samosa', 'vada pav'])).toEqual(['samosa', 'vada pav']);
    expect(collectOf('chai')).toEqual(['c', 'h', 'a', 'i']);
    expect(collectIn({ maths: 92, science: 85 })).toEqual(['maths', 'science']);
    expect(collectIn(['x', 'y'])).toEqual(['0', '1']); // strings!
  });
});

describe('break and continue', () => {
  function realRoute(houses: House[], useContinue: boolean, useBreak: boolean) {
    const out: string[] = [];
    for (let i = 0; i < houses.length; i++) {
      if (useContinue && houses[i] === 'closed') continue;
      if (useBreak && houses[i] === 'no-stock') break;
      out.push('Delivered to house ' + i);
    }
    return out;
  }

  it('matches real JS for every street pattern and toggle', () => {
    const kinds: House[] = ['open', 'closed', 'no-stock'];
    for (let code = 0; code < 3 ** 7; code++) {
      const houses = Array.from({ length: 7 }, (_, k) => kinds[Math.floor(code / 3 ** k) % 3]);
      for (const useContinue of [false, true])
        for (const useBreak of [false, true]) {
          const steps = routeSteps(houses, { useContinue, useBreak });
          expect(last(steps).output).toEqual(realRoute(houses, useContinue, useBreak));
        }
    }
  });
});

describe('nested loops', () => {
  function realCount(pattern: GridPattern, n: number) {
    let ops = 0;
    for (let row = 1; row <= n; row++) {
      if (pattern === 'table') for (let col = 1; col <= n; col++) ops++;
      if (pattern === 'triangle') for (let col = 1; col <= row; col++) ops++;
      if (pattern === 'pairs') for (let col = row + 1; col <= n; col++) ops++;
    }
    return ops;
  }

  it('counts body runs like real nested loops', () => {
    for (const pattern of ['table', 'triangle', 'pairs'] as GridPattern[])
      for (let n = 2; n <= 10; n++) {
        expect(last(gridSteps(pattern, n)).ops).toBe(realCount(pattern, n));
        expect(gridTotal(pattern, n)).toBe(realCount(pattern, n));
      }
  });
});
