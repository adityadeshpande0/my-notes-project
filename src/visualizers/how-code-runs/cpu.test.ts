import { describe, expect, it } from 'vitest';
import { simulate } from './cpu';

describe('toy CPU simulate()', () => {
  const steps = simulate();

  it('stores 5 + 3 = 8 in memory at the end', () => {
    expect(steps.at(-1)!.total).toBe(8);
    expect(steps.at(-1)!.regs).toEqual({ R1: 5, R2: 3, R3: 8 });
  });

  it('starts READY and ends DONE', () => {
    expect(steps[0].phase).toBe('READY');
    expect(steps.at(-1)!.phase).toBe('DONE');
  });

  it('fetches each instruction once, before decoding it', () => {
    const phases = steps.map((s) => s.phase);
    expect(phases.filter((p) => p === 'FETCH')).toHaveLength(4);
    phases.forEach((p, i) => {
      if (p === 'DECODE') expect(phases[i - 1]).toBe('FETCH');
    });
  });

  it('ticks the clock once per step', () => {
    steps.forEach((s, i) => expect(s.tick).toBe(i));
  });

  it('moves the program counter forward on every fetch', () => {
    const pcs = steps.filter((s) => s.phase === 'FETCH').map((s) => s.pc);
    expect(pcs).toEqual([1, 2, 3, 4]);
  });
});
