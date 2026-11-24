import { describe, expect, it } from 'vitest';
import {
  blockPreset,
  counterSteps,
  HOIST_PRESETS,
  hoistSteps,
  lexicalPreset,
  loopClosures,
  makeMultiplier,
  threeLevelsPreset,
  twoCounters,
} from './scopeSim';

/**
 * Run a preset's real source and collect what it prints, plus the uncaught
 * error (if any) with V8's wording. Tests only: the app never runs code.
 */
function runReal(code: string): { output: string[]; error?: string } {
  const output: string[] = [];
  const log = (...args: unknown[]) => output.push(args.map(String).join(' '));
  try {
    new Function('console', code)({ log });
  } catch (e) {
    return { output, error: `${(e as Error).name}: ${(e as Error).message}` };
  }
  return { output };
}

const finalOf = (sim: { output: string[]; error?: string }) => ({
  output: sim.output,
  ...(sim.error ? { error: sim.error } : {}),
});

describe('ScopeChain presets match real JavaScript', () => {
  for (const preset of [
    lexicalPreset(false),
    lexicalPreset(true),
    threeLevelsPreset,
    blockPreset,
  ]) {
    it(preset.id, () => {
      expect(finalOf(preset.run())).toEqual(runReal(preset.code.join('\n')));
    });
  }

  it('the lexical example prints Masala, and Ginger once printChai is moved', () => {
    expect(lexicalPreset(false).run().output).toEqual(['Masala']);
    expect(lexicalPreset(true).run().output).toEqual(['Ginger']);
  });

  it('the search follows where printChai is written, never the party room', () => {
    const steps = lexicalPreset(false).run().steps;
    const search = steps.find((s) => s.search)!.search!;
    expect(search.path.map((p) => p.envId)).toEqual(['printChai', 'global']);
    const moved = lexicalPreset(true)
      .run()
      .steps.find((s) => s.search)!.search!;
    expect(moved.path.map((p) => p.envId)).toEqual(['printChai', 'party']);
  });
});

describe('HoistingPhases presets match real JavaScript (pause on error)', () => {
  for (const preset of HOIST_PRESETS) {
    it(preset.name, () => {
      const real = runReal(preset.lines.map((l) => l.code).join('\n'));
      expect(finalOf(hoistSteps(preset, true))).toEqual(real);
    });
  }

  it('phase ① sets up var as undefined, let/const as TDZ, functions complete', () => {
    const steps = hoistSteps(HOIST_PRESETS[0], true).steps;
    const afterSetup = steps.filter((s) => s.phase === 'setup').at(-1)!;
    const vars = afterSetup.envs[0].vars;
    expect(vars.find((v) => v.name === 'a')).toMatchObject({ value: 'undefined' });
    expect(vars.find((v) => v.name === 'b')).toMatchObject({ tdz: true });
    const fns = hoistSteps(HOIST_PRESETS[1], true)
      .steps.filter((s) => s.phase === 'setup')
      .at(-1)!;
    expect(fns.envs[0].vars.find((v) => v.name === 'sayHi')).toMatchObject({ value: 'ƒ sayHi' });
  });
});

describe('ClosureBackpack matches real JavaScript', () => {
  it('makeCounter: 1, 2, 3', () => {
    const real = runReal(
      'function makeCounter() { let count = 0; return function () { count++; return count; }; }\n' +
        'const counter = makeCounter(); console.log(counter()); console.log(counter()); console.log(counter());',
    );
    expect(counterSteps().output).toEqual(real.output);
  });

  it('two counters, in any order of calls', () => {
    const realFor = (seq: string[]) =>
      runReal(
        'function makeCounter() { let count = 0; return function () { count++; return count; }; }\n' +
          'const counterA = makeCounter(); const counterB = makeCounter();\n' +
          seq.map((w) => `console.log("counter${w}() → " + counter${w}());`).join('\n'),
      ).output;
    expect(twoCounters(['A', 'A', 'B'])).toEqual([
      'counterA() → 1',
      'counterA() → 2',
      'counterB() → 1',
    ]);
    // Random sequences, repeatable thanks to a tiny seeded generator.
    let seed = 7;
    for (let k = 0; k < 40; k++) {
      const seq = Array.from({ length: 1 + (k % 8) }, () => {
        seed = (seed * 1103515245 + 12345) % 2 ** 31;
        return seed % 2 ? 'A' : 'B';
      }) as ('A' | 'B')[];
      expect(twoCounters(seq)).toEqual(realFor(seq));
    }
  });

  it('function factory: double(5) = 10, triple(5) = 15', () => {
    expect(makeMultiplier(2)(5)).toBe(10);
    expect(makeMultiplier(3)(5)).toBe(15);
  });

  it('the loop puzzle, against real setTimeout', async () => {
    const out: number[] = [];
    // eslint-disable-next-line no-var
    for (var i = 0; i < 3; i++) setTimeout(() => out.push(i), 0);
    for (let j = 0; j < 3; j++) setTimeout(() => out.push(j + 100), 0);
    await new Promise((r) => setTimeout(r, 20));
    expect(out.filter((n) => n < 100)).toEqual(loopClosures('var'));
    expect(out.filter((n) => n >= 100).map((n) => n - 100)).toEqual(loopClosures('let'));
    expect(loopClosures('var')).toEqual([3, 3, 3]);
    expect(loopClosures('let')).toEqual([0, 1, 2]);
  });
});
