import { describe, expect, it } from 'vitest';
import { BUG_CASES, GUARD, rankFor } from './bugCases';

/** Real versions of every case, with a lap cap standing in for "forever". Tests only. */
const show = (v: unknown) => (typeof v === 'string' ? JSON.stringify(v) : String(v));
function capped(run: (log: (v: unknown) => void, tick: () => void) => void) {
  const out: string[] = [];
  let laps = 0;
  try {
    run(
      (v) => out.push(show(v)),
      () => {
        if (++laps > GUARD) throw new Error('infinite');
      },
    );
  } catch {
    return { output: out.slice(0, GUARD), infinite: true };
  }
  return { output: out, infinite: false };
}

const REAL: Record<string, { bug: ReturnType<typeof capped>; fixed?: ReturnType<typeof capped> }> =
  {
    down: {
      bug: capped((log, tick) => {
        // The bug on purpose: i-- moves the wrong way.
        // eslint-disable-next-line for-direction
        for (let i = 0; i < 5; i--) {
          tick();
          log(i);
        }
      }),
      fixed: capped((log) => {
        for (let i = 0; i < 5; i++) log(i);
      }),
    },
    missing: {
      bug: capped((log, tick) => {
        const n = 0;
        while (n < 3) {
          tick();
          log(n);
        }
      }),
      fixed: capped((log) => {
        let n = 0;
        while (n < 3) {
          log(n);
          n++;
        }
      }),
    },
    'off-by-one': {
      bug: capped((log) => {
        const arr = ['a', 'b', 'c'];
        for (let i = 0; i <= arr.length; i++) log(arr[i]);
      }),
      fixed: capped((log) => {
        const arr = ['a', 'b', 'c'];
        for (let i = 0; i < arr.length; i++) log(arr[i]);
      }),
    },
    short: {
      bug: capped((log) => {
        for (let i = 1; i < 5; i++) log(i);
      }),
      fixed: capped((log) => {
        for (let i = 1; i <= 5; i++) log(i);
      }),
    },
    threes: {
      bug: capped((log) => {
        for (let i = 0; i < 10; i += 3) log(i);
      }),
    },
    'for-in-array': {
      bug: capped((log) => {
        for (const i in ['x', 'y']) log(i + 1);
      }),
      fixed: capped((log) => {
        for (const i in ['x', 'y']) log(Number(i) + 1);
      }),
    },
  };

describe('LoopBugHunter cases', () => {
  for (const c of BUG_CASES) {
    it(`${c.title} matches real JavaScript`, () => {
      const real = REAL[c.id];
      expect(c.run()).toEqual(real.bug);
      if (c.runFixed) expect(c.runFixed()).toEqual(real.fixed);
    });
  }

  it('the guard catches cases 1 and 2', () => {
    expect(BUG_CASES[0].run().infinite).toBe(true);
    expect(BUG_CASES[1].run().infinite).toBe(true);
    expect(BUG_CASES[0].run().output).toHaveLength(GUARD);
  });

  it('ranks detectives', () => {
    expect(rankFor(0)).toBe('Rookie');
    expect(rankFor(6)).toBe('Sherlock 🕵️');
  });
});
