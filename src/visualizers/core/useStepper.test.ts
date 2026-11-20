import { describe, expect, it } from 'vitest';
import { stepperReducer, type StepperState } from './useStepper';

const LAST = 3; // 4 steps: 0..3
const run = (state: StepperState, ...actions: Parameters<typeof stepperReducer>[1][]) =>
  actions.reduce((s, a) => stepperReducer(s, a, LAST), state);
const start: StepperState = { index: 0, playing: false };

describe('stepperReducer', () => {
  it('steps forward and stops at the last step', () => {
    expect(run(start, { type: 'next' }, { type: 'next' }).index).toBe(2);
    const end = run({ index: 3, playing: true }, { type: 'next' });
    expect(end).toEqual({ index: 3, playing: false });
  });

  it('never goes below 0', () => {
    expect(run(start, { type: 'prev' }).index).toBe(0);
  });

  it('pauses on any manual move', () => {
    const playing = { index: 2, playing: true };
    expect(run(playing, { type: 'prev' }).playing).toBe(false);
    expect(run(playing, { type: 'seek', index: 0 }).playing).toBe(false);
    expect(run(playing, { type: 'reset' })).toEqual(start);
  });

  it('clamps seek into range', () => {
    expect(run(start, { type: 'seek', index: 99 }).index).toBe(LAST);
    expect(run(start, { type: 'seek', index: -5 }).index).toBe(0);
  });

  it('play at the end restarts from the beginning', () => {
    expect(run({ index: LAST, playing: false }, { type: 'toggle' })).toEqual({
      index: 0,
      playing: true,
    });
  });
});
