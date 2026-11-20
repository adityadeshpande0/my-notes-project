import { describe, expect, it } from 'vitest';
import { resultOf, rippleAdd, toBits } from './adder';

describe('toBits', () => {
  it('lists bits from least significant', () => {
    expect(toBits(5)).toEqual([1, 0, 1, 0]);
    expect(toBits(8)).toEqual([0, 0, 0, 1]);
  });
});

describe('rippleAdd', () => {
  it('adds every pair of 4-bit numbers correctly', () => {
    for (let a = 0; a < 16; a++) {
      for (let b = 0; b < 16; b++) {
        expect(resultOf(rippleAdd(a, b))).toBe(a + b);
      }
    }
  });

  it('ripples the carry: 1111 + 0001', () => {
    const cols = rippleAdd(15, 1);
    expect(cols.map((c) => c.cout)).toEqual([1, 1, 1, 1]);
    expect(cols.map((c) => c.sum)).toEqual([0, 0, 0, 0]);
  });

  it('feeds each carry into the next column', () => {
    const cols = rippleAdd(5, 3);
    for (let i = 1; i < cols.length; i++) expect(cols[i].cin).toBe(cols[i - 1].cout);
  });
});
