import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { REFERENCE_PRESETS, SCOPE_PRESETS, VARIABLE_PRESETS, type MemPreset } from './memorySteps';

/** Run real code; return what it printed, the error it threw (if any), and named values. */
function runForReal(code: string, { call = '', read = [] as string[] } = {}) {
  const printed: string[] = [];
  const fakeConsole = { log: (...args: unknown[]) => printed.push(args.map(String).join(' ')) };
  let error: string | undefined;
  let values: unknown[] = [];
  try {
    const reader = read.length ? `\nreturn [${read.join(', ')}];` : '';
    values = new Function('console', `${code}\n${call}${reader}`)(fakeConsole) ?? [];
  } catch (e) {
    const err = e as Error;
    error = `${err.name}: ${err.message}`;
  }
  vi.runAllTimers();
  return { printed, error, values };
}

const last = (p: MemPreset) => p.steps[p.steps.length - 1];
const all = [...VARIABLE_PRESETS, ...SCOPE_PRESETS, ...REFERENCE_PRESETS];

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('every memory preset', () => {
  for (const preset of all) {
    it(`${preset.name}: console output and error match real JavaScript`, () => {
      const real = runForReal(preset.code, { call: preset.id === 'leak' ? 'demo();' : '' });
      expect(last(preset).console).toEqual(real.printed);
      expect(last(preset).error).toBe(real.error);
    });

    it(`${preset.name}: explains every step and only points at real lines`, () => {
      const lines = preset.code.split('\n').length;
      for (const step of preset.steps) {
        expect(step.caption.length).toBeGreaterThan(10);
        if (step.line !== null) expect(step.line).toBeGreaterThanOrEqual(1);
        if (step.line !== null) expect(step.line).toBeLessThanOrEqual(lines);
      }
    });

    it(`${preset.name}: an error, if any, is the final step`, () => {
      const firstError = preset.steps.findIndex((s) => s.error);
      if (firstError !== -1) expect(firstError).toBe(preset.steps.length - 1);
    });
  }
});

describe('final values in the boxes', () => {
  const value = (p: MemPreset, name: string) => last(p).boxes.find((b) => b.name === name)?.value;

  it('Create and change ends with score = 25', () => {
    const p = VARIABLE_PRESETS.find((x) => x.id === 'create')!;
    const real = runForReal(p.code, { read: ['score'] });
    expect(value(p, 'score')).toBe(String(real.values[0]));
  });

  it('Swap really swaps', () => {
    const p = VARIABLE_PRESETS.find((x) => x.id === 'swap')!;
    const real = runForReal(p.code, { read: ['a', 'b', 'temp'] });
    expect(['a', 'b', 'temp'].map((n) => value(p, n))).toEqual(
      real.values.map((v) => JSON.stringify(v)),
    );
  });

  it('the const error comes from the const box', () => {
    const p = VARIABLE_PRESETS.find((x) => x.id === 'const')!;
    expect(last(p).boxes.find((b) => b.state === 'error')?.name).toBe('name');
  });
});

describe('references', () => {
  it('"Objects share" ends with two arrows to one object', () => {
    const p = REFERENCE_PRESETS.find((x) => x.id === 'share')!;
    const refs = last(p).boxes.map((b) => b.ref);
    expect(refs[0]).toBeDefined();
    expect(refs[0]).toBe(refs[1]);
    expect(last(p).heap).toHaveLength(1);
  });

  it('"Real copy" ends with two separate objects', () => {
    const p = REFERENCE_PRESETS.find((x) => x.id === 'spread')!;
    const [r1, r2] = last(p).boxes.map((b) => b.ref);
    expect(r1).not.toBe(r2);
  });

  it('shallow copy shares the inner object; structuredClone does not', () => {
    const p = REFERENCE_PRESETS.find((x) => x.id === 'nested')!;
    const heap = last(p).heap;
    const addressOf = (name: string) => {
      const outer = heap.find((h) => h.id === last(p).boxes.find((b) => b.name === name)?.ref);
      return outer?.props.find((x) => x.key === 'address')?.ref;
    };
    expect(addressOf('a')).toBe(addressOf('b'));
    expect(addressOf('c')).not.toBe(addressOf('a'));
  });
});
