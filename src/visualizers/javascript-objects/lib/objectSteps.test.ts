import { describe, expect, it } from 'vitest';
import {
  BROKEN,
  buildTree,
  deleteProp,
  flatten,
  jsonTokens,
  loopHelpers,
  makeChai,
  makeCounter,
  makeOrder,
  makeSample,
  MENU,
  pack,
  pathCode,
  readProp,
  readWithVariable,
  runItems,
  setProp,
  validate,
  walk,
  type Seg,
} from './objectSteps';

/** Evaluate a path expression for real against the data. Tests only: the app never does this. */
const evalPath = (code: string, order: unknown) => new Function('order', `return ${code};`)(order);

describe('the object card matches real objects', () => {
  it('reads with dot and brackets', () => {
    const chai = makeChai();
    expect(readProp(chai, 'price', 'bracket').value).toBe(chai['price']);
    expect(readProp(chai, 'name', 'dot').value).toBe('Masala Chai');
    const missing = readProp(chai, 'discount', 'dot');
    expect(missing.value).toBeUndefined();
    expect(missing.found).toBe(false);
    // The variable-key demo.
    const field = 'price';
    expect(readWithVariable(chai, field, 'bracket').value).toBe(chai[field]);
    expect(readWithVariable(chai, field, 'dot').value).toBe((chai as { field?: unknown }).field);
  });

  it('adds, changes and deletes like the real thing', () => {
    const chai = makeChai();
    const changed = setProp(chai, 'price', 35);
    expect(changed.added).toBe(false);
    expect(changed.old).toBe(30);
    expect(changed.next.price).toBe(35);
    expect(chai.price).toBe(30); // the copy changed, not the original
    const added = setProp(chai, 'discount', 5);
    expect(added.added).toBe(true);
    expect(Object.keys(added.next)).toEqual(['name', 'price', 'sizes', 'isHot', 'discount']);
    const real = makeChai();
    const deleted = deleteProp(chai, 'isHot');
    expect(deleted.returned).toBe(delete real.isHot);
    expect(deleted.next).toEqual(real);
    expect('isHot' in deleted.next).toBe(false);
  });

  it('Object.keys / values / entries', () => {
    const chai = makeChai();
    const l = loopHelpers(chai);
    expect(l.keys).toEqual(['name', 'price', 'sizes', 'isHot']);
    expect(l.values).toEqual(['Masala Chai', 30, ['small', 'large'], true]);
    expect(l.entries[1]).toEqual(['price', 30]);
  });

  it('a method uses this', () => {
    const counter = makeCounter();
    counter.increment();
    counter.increment();
    expect(counter.count).toBe(2);
  });
});

describe('the data explorer', () => {
  it('every node’s path is valid JavaScript that returns its value', () => {
    const order = makeOrder();
    const nodes = flatten(buildTree(order));
    expect(nodes.length).toBeGreaterThan(10);
    for (const n of nodes) {
      expect(evalPath(n.id, order)).toEqual(n.value);
      expect(pathCode(n.segs)).toBe(n.id);
    }
    expect(nodes.find((n) => n.id === 'order.items[1].name')?.value).toBe('Cutting Chai');
  });

  it('walking a broken path gives the real TypeError, and ?. stops safely', () => {
    const order = makeOrder();
    const segs: Seg[] = [
      { kind: 'prop', key: 'coupon' },
      { kind: 'prop', key: 'code' },
    ];
    const plain = walk(order, segs, false);
    let real = '';
    try {
      evalPath('order.coupon.code', order);
    } catch (e) {
      real = `${(e as Error).name}: ${(e as Error).message}`;
    }
    expect(plain[plain.length - 1].error).toBe(real);
    expect(real).toContain("reading 'code'");
    const safe = walk(order, segs, true);
    expect(safe[safe.length - 1].value).toBe(evalPath('order.coupon?.code', order));
    expect(safe[safe.length - 1].stopped).toBe(true);
  });

  it('array methods on the items, including the article’s total', () => {
    const order = makeOrder();
    expect(runItems(order.items, 'reduce').out).toBe(95);
    expect(runItems(order.items, 'map').out).toEqual(order.items.map((i) => i.name));
    for (let n = 3; n <= 5; n++) {
      const items = MENU.slice(0, n);
      expect(runItems(items, 'filter').out).toEqual(items.filter((i) => i.price < 20));
      expect(runItems(items, 'reduce').out).toBe(items.reduce((s, i) => s + i.price * i.qty, 0));
      expect(runItems(items, 'map').calls).toHaveLength(n);
    }
  });
});

describe('JSON', () => {
  it('stringify drops and converts exactly like the real thing', () => {
    const sample = makeSample(true);
    const r = pack(sample, 0);
    expect(r.text).toBe(JSON.stringify(sample));
    expect(r.text).not.toContain('greet');
    expect(r.text).not.toContain('notes');
    expect(r.back.createdAt).toBe('2026-01-15T09:30:00.000Z');
    expect(r.back.score).toBeNull();
    expect(r.luggage.map((l) => l.key)).toEqual(['greet', 'notes', 'createdAt', 'score']);
    expect(pack(sample, 2).text).toBe(JSON.stringify(sample, null, 2));
  });

  it('every broken preset fails to parse, and every fix parses', () => {
    for (const b of BROKEN) {
      const bad = validate(b.text);
      expect(bad.ok).toBe(false);
      if (!bad.ok) {
        let real = '';
        try {
          JSON.parse(b.text);
        } catch (e) {
          real = (e as Error).message;
        }
        expect(bad.message).toBe(real);
      }
      expect(validate(b.fix).ok).toBe(true);
    }
  });

  it('the validator never throws, whatever you type', () => {
    const junk = [
      '',
      '{',
      '}',
      '"',
      'nul',
      '[1,]',
      '{"a":}',
      '\u0000',
      '😀',
      '{"a":1}}',
      '1e999',
      '-',
    ];
    for (const t of junk) expect(() => validate(t)).not.toThrow();
  });

  it('colouring keeps every character', () => {
    const text = JSON.stringify(makeSample(false), null, 2);
    expect(
      jsonTokens(text)
        .map((t) => t.t)
        .join(''),
    ).toBe(text);
  });
});
