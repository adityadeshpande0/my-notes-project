import { describe, expect, it } from 'vitest';
import {
  copy,
  FILTER_PRESETS,
  MAP_PRESETS,
  mutate,
  ORDERS,
  PRODUCTS,
  REDUCE_PRESETS,
  runShelfOp,
  SEARCH_CONDITIONS,
  SONGS,
  textSort,
  traceChain,
  traceFilter,
  traceMap,
  traceReduce,
  traceSearch,
  traceSort,
  type Product,
  type SearchMethod,
  type ShelfOp,
  type Song,
} from './arraySteps';

const songs = (vals: string[]): Song[] => vals.map((value, k) => ({ id: `s${k}`, value }));
const values = (xs: Song[]) => xs.map((s) => s.value);

/** Every subset of the products, in order (including the empty array). */
const subsets: Product[][] = Array.from({ length: 2 ** PRODUCTS.length }, (_, mask) =>
  PRODUCTS.filter((_, k) => mask & (1 << k)),
);

describe('the array shelf matches real arrays', () => {
  const OPS: ShelfOp[] = [
    { kind: 'index', i: 0 },
    { kind: 'index', i: 5 },
    { kind: 'length' },
    { kind: 'at' },
    { kind: 'push', v: 'Ilahi' },
    { kind: 'pop' },
    { kind: 'unshift', v: 'Ilahi' },
    { kind: 'shift' },
    { kind: 'splice', i: 1 },
    { kind: 'set', i: 1, v: 'Kun Faya Kun' },
    { kind: 'includes', v: 'Tum Hi Ho' },
    { kind: 'includes', v: 'Ilahi' },
    { kind: 'indexOf', v: 'Tum Hi Ho' },
    { kind: 'indexOf', v: 'Ilahi' },
  ];
  /** The same operation on a plain array of strings: what real JS returns and leaves. */
  function real(vals: string[], op: ShelfOp): { returned: unknown; after: string[] } {
    const a = [...vals];
    switch (op.kind) {
      case 'index':
        return { returned: a[op.i], after: a };
      case 'length':
        return { returned: a.length, after: a };
      case 'at':
        return { returned: a.at(-1), after: a };
      case 'push':
        return { returned: a.push(op.v), after: a };
      case 'pop':
        return { returned: a.pop(), after: a };
      case 'unshift':
        return { returned: a.unshift(op.v), after: a };
      case 'shift':
        return { returned: a.shift(), after: a };
      case 'splice':
        return { returned: a.splice(op.i, 1), after: a };
      case 'set':
        return { returned: (a[op.i] = op.v), after: a };
      case 'includes':
        return { returned: a.includes(op.v), after: a };
      case 'indexOf':
        return { returned: a.indexOf(op.v), after: a };
    }
  }
  for (const start of [[], SONGS.slice(0, 1), SONGS.slice(0, 3)]) {
    it(`on ${start.length} songs`, () => {
      for (const op of OPS) {
        const r = runShelfOp(songs(start), op, 'new');
        const want = real(start, op);
        expect(r.returned).toEqual(want.returned);
        expect(values(r.items)).toEqual(want.after);
      }
    });
  }

  it('mutating vs copying', () => {
    const vals = ['Tum Hi Ho', 'Kesariya', 'Apna Bana Le'];
    const extra = { id: 'x', value: 'Ilahi' };
    const realMut: Record<string, (a: string[]) => unknown> = {
      push: (a) => a.push('Ilahi'),
      sort: (a) => a.sort(),
      reverse: (a) => a.reverse(),
      splice: (a) => a.splice(1, 1),
    };
    for (const op of ['push', 'sort', 'reverse', 'splice'] as const) {
      const arr = songs(vals);
      const r = mutate(arr, op, extra);
      const plain = [...vals];
      realMut[op](plain);
      expect(r.result).toBe(arr); // the same array: mutated in place
      expect(values(arr)).toEqual(plain);
    }
    const realCopy: Record<string, (a: string[]) => string[]> = {
      spread: (a) => [...a, 'Ilahi'],
      toSorted: (a) => a.toSorted(),
      toReversed: (a) => a.toReversed(),
      toSpliced: (a) => a.toSpliced(1, 1),
    };
    for (const op of ['spread', 'toSorted', 'toReversed', 'toSpliced'] as const) {
      const arr = songs(vals);
      const r = copy(arr, op, extra);
      expect(r.result).not.toBe(arr); // a new array
      expect(values(arr)).toEqual(vals); // the original is untouched
      expect(values(r.result)).toEqual(realCopy[op](vals));
    }
  });
});

describe('the factory matches real map / filter / reduce', () => {
  it('map, for every preset and every selection of items', () => {
    for (const items of subsets)
      for (const p of MAP_PRESETS) {
        const r = traceMap(items, p.fn);
        expect(r.out).toEqual(items.map(p.fn));
        expect(r.calls).toHaveLength(items.length);
      }
    expect(traceMap([], MAP_PRESETS[0].fn).out).toEqual([]);
    // GST is rounded so the display never shows 47.199999999999996.
    expect(traceMap(PRODUCTS, MAP_PRESETS[0].fn).out).toEqual([35.4, 23.6, 29.5, 47.2, 59]);
  });

  it('filter', () => {
    for (const items of subsets)
      for (const p of FILTER_PRESETS) {
        const r = traceFilter(items, p.fn);
        expect(r.out).toEqual(items.filter(p.fn));
        expect(r.calls).toHaveLength(items.length);
      }
  });

  it('reduce, with and without an initial value', () => {
    for (const items of subsets)
      for (const p of REDUCE_PRESETS) {
        const withInit = traceReduce(items, p.fn, { value: p.init });
        expect(withInit.out).toEqual(items.reduce(p.fn, p.init));
        expect(withInit.calls).toHaveLength(items.length);
        const without = traceReduce(items, p.fn, null);
        if (items.length === 0) {
          expect(without.error).toBe('TypeError: Reduce of empty array with no initial value');
        } else {
          expect(without.out).toEqual((items as unknown[]).reduce(p.fn as never));
          expect(without.calls).toHaveLength(items.length - 1); // starts from the second item
        }
      }
    expect(traceReduce([], REDUCE_PRESETS[0].fn, { value: 0 }).out).toBe(0);
  });

  it('find / findIndex / some / every stop early, like the real ones', () => {
    for (const items of subsets)
      for (const method of ['find', 'findIndex', 'some', 'every'] as SearchMethod[])
        for (const c of SEARCH_CONDITIONS) {
          let realCalls = 0;
          const counted = (p: Product) => {
            realCalls++;
            return c.fn(p);
          };
          const realOut = (items as Product[])[method](counted);
          const r = traceSearch(items, method, c.fn);
          expect(r.out).toEqual(realOut);
          expect(r.calls).toHaveLength(realCalls);
        }
  });

  it('chaining: filter → map → reduce', () => {
    const r = traceChain(ORDERS);
    expect(r.revenue).toBe(55);
    expect(r.revenue).toBe(
      ORDERS.filter((o) => o.delivered)
        .map((o) => o.price)
        .reduce((sum, p) => sum + p, 0),
    );
    expect(r.calls.filter((c) => c.stage === 0)).toHaveLength(3);
    expect(r.calls.filter((c) => c.stage === 1)).toHaveLength(2);
  });
});

describe('sorting', () => {
  it('the default sort compares as text', () => {
    expect(textSort([10, 1, 5, 100])).toEqual([1, 10, 100, 5]);
    expect(textSort([10, 1, 5, 100, 25])).toEqual([1, 10, 100, 25, 5]);
  });
  it('compare functions, with the real comparisons logged', () => {
    const asc = traceSort([10, 1, 5, 100, 25], 'asc');
    expect(asc.result).toEqual([1, 5, 10, 25, 100]);
    expect(asc.comparisons.length).toBeGreaterThan(0);
    for (const c of asc.comparisons) expect(c.r).toBe(c.a - c.b);
    expect(traceSort([10, 1, 5, 100, 25], 'desc').result).toEqual([100, 25, 10, 5, 1]);
  });
});

describe('numbers used in the article', () => {
  it('are exact in real JavaScript', () => {
    expect([100, 200, 50].map((p) => p * 1.18)).toEqual([118, 236, 59]);
    expect([120, 80, 200].reduce((s, p) => s + p, 0)).toBe(400);
    expect([92, 45, 78, 30, 88].filter((m) => m >= 50)).toEqual([92, 78, 88]);
    expect(['riya', 'aarav'].map((n) => n.toUpperCase())).toEqual(['RIYA', 'AARAV']);
  });
});
