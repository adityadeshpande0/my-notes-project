import { describe, expect, it } from 'vitest';
import * as math from '../demo/math';
import {
  allImportChoices,
  appBody,
  bundleOrder,
  EXPORTS,
  importCode,
  resolve,
  trySecret,
} from './modules';

describe('module resolution, for every import-editor choice', () => {
  const all = allImportChoices();
  it('reads the exports from the real module', () => {
    expect(EXPORTS.sort()).toEqual(['GST', 'addGST', 'default']);
    expect(math._forTestsOnly()).toBe(true);
  });
  it('gives the right outcome for all 256 combinations', () => {
    expect(all).toHaveLength(256);
    for (const c of all) {
      const r = resolve(c);
      const braced = c.braces && c.defaultName !== 'none';
      if (c.twoDefaults) expect(r).toMatchObject({ ok: false, where: 'math.js' });
      else if (braced) expect(r).toMatchObject({ ok: false, missing: 'formatRupees' });
      else if (c.named.addTax) expect(r).toMatchObject({ ok: false, missing: 'addTax' });
      else {
        expect(r.ok).toBe(true);
        // One console line per line of app code that uses an import.
        if (r.ok) expect(r.output).toHaveLength(appBody(c).length);
      }
    }
  });
  it('runs the article example for real', () => {
    const r = resolve({
      named: { GST: false, addGST: true, addTax: false },
      alias: false,
      defaultName: 'formatRupees',
      braces: false,
      twoDefaults: false,
    });
    expect(r).toMatchObject({ ok: true, output: ['₹118.00'] });
    expect(
      importCode({
        named: { GST: true, addGST: true, addTax: false },
        alias: true,
        defaultName: 'fmt',
        braces: false,
        twoDefaults: false,
      }),
    ).toBe('import fmt, { GST, addGST as withTax } from "./math.js";');
    expect(trySecret().error).toMatch(/^ReferenceError/);
  });
  it('bundles in dependency order from the entry', () => {
    expect(bundleOrder()).toEqual([
      'main',
      'react',
      'App',
      'Navbar',
      'SnackList',
      'SnackCard',
      'format',
    ]);
  });
});
