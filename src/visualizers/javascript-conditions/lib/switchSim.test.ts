import { describe, expect, it } from 'vitest';
import { SWITCH_PRESETS, switchCode, switchSteps } from './switchSim';

/** Run the generated switch code for real and collect what it logs. Tests only. */
function realOutput(code: string): string[] {
  const logs: string[] = [];
  new Function('console', code)({ log: (s: string) => logs.push(s) });
  return logs;
}

describe('switchSteps matches a real switch', () => {
  for (const spec of SWITCH_PRESETS) {
    it(`${spec.name}: every value × every break combination`, () => {
      const n = spec.cases.length;
      for (const value of spec.values) {
        for (let mask = 0; mask < 2 ** n; mask++) {
          const breaks = spec.cases.map((_, i) => Boolean(mask & (1 << i)));
          const steps = switchSteps(spec, value, breaks);
          const ours = steps[steps.length - 1].output;
          expect(ours).toEqual(realOutput(switchCode(spec, value, breaks)));
        }
      }
    });
  }

  it('"sat" goes to default because case matters', () => {
    const days = SWITCH_PRESETS[0];
    const steps = switchSteps(days, 'sat', [true, true, true]);
    expect(steps[steps.length - 1].output).toEqual(['Work day 💼']);
    expect(steps.some((s) => s.message.includes('Case matters'))).toBe(true);
  });

  it('falls through when break is missing', () => {
    const days = SWITCH_PRESETS[0];
    const steps = switchSteps(days, 'Sun', [true, false, true]);
    expect(steps[steps.length - 1].output).toEqual(['Weekend! 🎉', 'Almost there…']);
    expect(steps.some((s) => s.phase === 'fall')).toBe(true);
  });
});
