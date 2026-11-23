import { describe, expect, it } from 'vitest';
import {
  fibCalls,
  GUARD_DEPTH,
  STACK_PRESETS,
  traceCountdown,
  traceFactorial,
  traceFib,
  traceNoBase,
} from './callSim';
import {
  checkAge,
  hoistingGotcha,
  objectGotcha,
  PARAMS_PRESETS,
  readTaxOutside,
  returnVsLog,
  runDoTwice,
  shadowing,
  SQUARES,
} from './realFunctions';

/** Run the article's code, as text, for real. Tests only: the app never does this. */
function runReal(code: string): string[] {
  const out: string[] = [];
  new Function('console', code)({ log: (v: unknown) => out.push(String(v)) });
  return out;
}
const last = <T>(xs: T[]) => xs[xs.length - 1];

describe('CallStackTower presets match real JavaScript', () => {
  it('Order a chai prints Pay ₹540', () => {
    const preset = STACK_PRESETS[0];
    const trace = preset.run();
    expect(trace.output).toEqual(runReal(preset.code.join('\n')));
    expect(trace.output).toEqual(['Pay ₹540']);
  });

  it('shows the right local values on the plates', () => {
    const steps = STACK_PRESETS[0].run().steps;
    const withSubtotal = steps.find((s) =>
      s.stack.some((f) => f.locals.some(([k]) => k === 'subtotal')),
    );
    const frame = withSubtotal!.stack.find((f) => f.name === 'calculateTotal')!;
    expect(frame.args).toEqual([
      ['price', '200'],
      ['qty', '3'],
    ]);
    expect(frame.locals).toEqual([['subtotal', '600']]);
    // applyDiscount hands 540 back to calculateTotal, which hands it to placeOrder.
    const handoffs = steps.filter(
      (s) => s.event === 'handoff' && s.stack.some((f) => f.received === '540'),
    );
    expect(handoffs.length).toBeGreaterThanOrEqual(2);
    // The deepest the stack gets: main, placeOrder, calculateTotal, applyDiscount.
    expect(Math.max(...steps.map((s) => s.stack.length))).toBe(4);
  });

  it('Greeting chain prints HELLO RIYA!', () => {
    const preset = STACK_PRESETS[1];
    const trace = preset.run();
    expect(trace.output).toEqual(runReal(preset.code.join('\n')));
    expect(trace.output).toEqual(['HELLO RIYA!']);
  });

  it('the overflow preset stops at the guard depth', () => {
    const trace = STACK_PRESETS[2].run();
    expect(trace.overflow).toBe(true);
    expect(last(trace.steps).event).toBe('overflow');
    expect(last(trace.steps).stack).toHaveLength(GUARD_DEPTH);
    // ...and the real thing really does overflow.
    expect(() => runReal(STACK_PRESETS[2].code.join('\n'))).toThrow(RangeError);
  });
});

describe('RecursionTree matches real JavaScript', () => {
  it('countdown prints n…1 then Liftoff', () => {
    for (let n = 1; n <= 6; n++) {
      const real = runReal(
        `function countdown(n) { if (n === 0) { console.log("Liftoff! 🚀"); return; } console.log(n); countdown(n - 1); } countdown(${n});`,
      );
      expect(traceCountdown(n).output).toEqual(real);
    }
  });

  it('factorial 1–7', () => {
    const real = [1, 2, 6, 24, 120, 720, 5040];
    for (let n = 1; n <= 7; n++) {
      expect(traceFactorial(n).output).toEqual([String(real[n - 1])]);
      expect(traceFactorial(n).tree).toHaveLength(n);
    }
  });

  it('fib 1–7: values and call counts, naive and memoized', () => {
    const naive = [1, 3, 5, 9, 15, 25, 41];
    for (let n = 1; n <= 7; n++) {
      const realValue = Number(
        runReal(
          `function fib(n) { if (n <= 1) return n; return fib(n - 1) + fib(n - 2); } console.log(fib(${n}));`,
        )[0],
      );
      // A real memoized fib, counting every invocation (cache hits included).
      const realMemo = runReal(
        `let calls = 0; function fib(n, memo = {}) { calls++; if (n in memo) return memo[n]; if (n <= 1) return n; memo[n] = fib(n - 1, memo) + fib(n - 2, memo); return memo[n]; } fib(${n}); console.log(calls);`,
      );
      const plain = traceFib(n, false);
      const memo = traceFib(n, true);
      expect(Number(plain.output[0])).toBe(realValue);
      expect(Number(memo.output[0])).toBe(realValue);
      expect(plain.tree).toHaveLength(naive[n - 1]);
      expect(fibCalls(n, false).calls).toBe(naive[n - 1]);
      expect(memo.tree).toHaveLength(Number(realMemo[0]));
      expect(fibCalls(n, true).calls).toBe(Number(realMemo[0]));
      expect(fibCalls(n, true).calls).toBe(2 * n - 1);
    }
    expect(fibCalls(7, false).calls).toBe(41);
    expect(fibCalls(7, true).calls).toBe(13);
  });

  it('factorial without a base case hits the guard', () => {
    const trace = traceNoBase();
    expect(trace.overflow).toBe(true);
    expect(last(trace.steps).stack).toHaveLength(GUARD_DEPTH);
  });
});

describe('parameters and arguments match real JavaScript', () => {
  it('for every combination of up to 4 chips', () => {
    for (const preset of PARAMS_PRESETS) {
      const real = new Function(
        'console',
        `${preset.code.join('\n')}\nreturn ${preset.rest ? 'addToppings' : 'makeChai'};`,
      );
      const combos: unknown[][] = [[]];
      for (let len = 1; len <= 4; len++)
        for (let code = 0; code < preset.chips.length ** len; code++)
          combos.push(
            Array.from(
              { length: len },
              (_, k) =>
                preset.chips[Math.floor(code / preset.chips.length ** k) % preset.chips.length]
                  .value,
            ),
          );
      for (const args of combos) {
        const out: string[] = [];
        real({ log: (v: unknown) => out.push(String(v)) })(...args);
        const ours = preset.call(args);
        expect(ours.log).toBe(out[0]);
        if (!preset.rest) expect(ours.ignored).toEqual(args.slice(preset.params.length));
      }
    }
  });

  it('defaults apply for undefined but not null', () => {
    const d = PARAMS_PRESETS[2];
    expect(d.call([undefined, null]).slots).toEqual([
      ['sugar', 1],
      ['milk', null],
    ]);
  });

  it('rest gathers the extras into an array', () => {
    expect(PARAMS_PRESETS[3].call(['chai', 'ginger', 'honey']).slots).toEqual([
      ['base', 'chai'],
      ['extras', ['ginger', 'honey']],
    ]);
  });
});

describe('the small demos', () => {
  it('return vs console.log', () => {
    expect(returnVsLog(500)).toEqual({
      shown: '590',
      a: undefined,
      aFinal: 'NaN',
      b: 590,
      bFinal: '690',
    });
    // The other GST numbers used in the article are exact too.
    expect([100 * 1.18, 200 * 1.18, 100 * 1.18 + 200 * 1.18]).toEqual([118, 236, 354]);
    expect(checkAge(12)).toBe('Too young');
    expect(checkAge(30)).toBe('Welcome!');
  });

  it('all five squares agree, and the gotchas are real', () => {
    for (let n = -5; n <= 12; n++) expect(new Set(SQUARES.map((f) => f(n))).size).toBe(1);
    expect(objectGotcha()).toEqual({ without: 'undefined', with: '{name: "Riya"}' });
    expect(hoistingGotcha()).toEqual({
      declaration: '9',
      arrow: "ReferenceError: Cannot access 'square' before initialization",
    });
  });

  it('doTwice: pass the recipe, not the chai', () => {
    expect(runDoTwice('sayHi').printed).toEqual(['Hi!', 'Hi!']);
    expect(runDoTwice('clap').printed).toEqual(['Clap! 👏', 'Clap! 👏']);
    const bug = runDoTwice('sayHi()');
    expect(bug.printed).toEqual(['Hi!']);
    expect(bug.error).toBe('TypeError: action is not a function');
  });

  it('scope', () => {
    expect(readTaxOutside()).toBe('ReferenceError: tax is not defined');
    expect(shadowing()).toEqual(['Goa', 'Mumbai']);
  });
});
