import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PRESETS, type ELStep } from './eventLoop';

/**
 * Run a preset's real source code with a fake console (and, for the click
 * preset, a fake button) and return everything it printed, in order.
 */
function runForReal(code: string, { click = false } = {}): string[] {
  const printed: string[] = [];
  const fakeConsole = { log: (...args: unknown[]) => printed.push(args.map(String).join(' ')) };

  let listener: (() => void) | undefined;
  const fakeDocument = {
    querySelector: () => ({
      addEventListener: (_type: string, fn: () => void) => {
        listener = fn;
      },
    }),
  };

  // new Function runs the code with `console` and `document` swapped for our fakes.
  new Function('console', 'document', code)(fakeConsole, fakeDocument);
  vi.runAllTimers(); // let every setTimeout fire, in real timer order
  if (click) listener?.();
  return printed;
}

const last = (steps: ELStep[]) => steps[steps.length - 1];

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('event loop presets', () => {
  for (const preset of PRESETS) {
    describe(preset.name, () => {
      it('ends with exactly the console output real JavaScript prints', () => {
        const real = runForReal(preset.code, { click: preset.id === 'click' });
        expect(last(preset.steps).console).toEqual(real);
      });

      it('ends with an empty stack, queue and no pending timers', () => {
        const end = last(preset.steps);
        expect(end.stack).toEqual([]);
        expect(end.queue).toEqual([]);
        // The click listener stays registered, like in a real page.
        expect(end.webApis.filter((t) => Number.isFinite(t.msLeft))).toEqual([]);
      });

      it('explains every step and only points at real lines', () => {
        const lines = preset.code.split('\n').length;
        for (const step of preset.steps) {
          expect(step.caption.length).toBeGreaterThan(10);
          if (step.line !== null) expect(step.line).toBeGreaterThanOrEqual(1);
          if (step.line !== null) expect(step.line).toBeLessThanOrEqual(lines);
        }
      });

      it('only moves a callback from the queue when the stack is empty', () => {
        preset.steps.forEach((step, i) => {
          if (i === 0) return;
          const before = preset.steps[i - 1];
          if (step.queue.length < before.queue.length) expect(before.stack).toEqual([]);
        });
      });
    });
  }

  it('prints in the surprising orders the article promises', () => {
    const output = Object.fromEntries(PRESETS.map((p) => [p.id, last(p.steps).console]));
    expect(output.sync).toEqual(['Start', 'Hi Riya', 'End']);
    expect(output.timeout0.map((l) => l[0])).toEqual(['1', '2', '3']);
    expect(output.timers).toEqual(['C (now)', 'A (500ms)', 'B (1000ms)']);
  });

  it('the click preset pauses for a click exactly once', () => {
    const click = PRESETS.find((p) => p.id === 'click')!;
    expect(click.steps.filter((s) => s.waitForClick)).toHaveLength(1);
  });
});
