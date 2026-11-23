import { describe, expect, it } from 'vitest';
import { lookup, SCOPE_PRESETS } from './scope';

/** Run each preset's code for real and collect what it prints (or throws). Tests only. */
function runReal(code: string[]): string[] {
  const out: string[] = [];
  try {
    new Function('console', code.join('\n'))({ log: (v: unknown) => out.push(String(v)) });
  } catch (e) {
    out.push(`${(e as Error).name}: ${(e as Error).message}`);
  }
  return out;
}

describe('scope lookups match real JavaScript', () => {
  for (const preset of SCOPE_PRESETS) {
    it(preset.name, () => {
      const real = runReal(preset.code);
      expect(preset.logs.map((l) => l.result)).toEqual(real);
      for (const log of preset.logs) {
        const r = lookup(preset, log.scope, log.names);
        if (log.result.startsWith('ReferenceError')) expect(r.error).toBe(log.result);
        else expect(r.error).toBeUndefined();
      }
    });
  }

  it('the closest variable wins (shadowing)', () => {
    const shadow = SCOPE_PRESETS[1];
    const r = lookup(shadow, 'plan', ['city']);
    expect(r.steps).toEqual([{ name: 'city', scope: 'plan', found: true, value: '"Goa"' }]);
  });

  it('looks outward, never inward', () => {
    const bill = SCOPE_PRESETS[0];
    const r = lookup(bill, 'global', ['tax']);
    expect(r.steps.map((s) => s.scope)).toEqual(['global']);
  });
});
