import { describe, expect, it } from 'vitest';
import { compare, decidingIndex, explain, tilt } from './compare';

describe('comparison helpers', () => {
  it('finds the deciding character', () => {
    expect(decidingIndex('10', '9')).toBe(0);
    expect(decidingIndex('apple', 'apricot')).toBe(2);
    expect(decidingIndex('app', 'apple')).toBe(3);
  });

  it('uses the real operators', () => {
    expect(compare('10', '<', '9')).toBe(true);
    expect(compare(null, '>=', 0)).toBe(true);
    expect(compare(null, '==', 0)).toBe(false);
    expect(compare(NaN, '===', NaN)).toBe(false);
    expect(compare('Apple', '<', 'apple')).toBe(true);
  });

  it('tilts toward the bigger side, and stays level for NaN', () => {
    expect(tilt(10, 3)).toBe(-1);
    expect(tilt('10', '9')).toBe(1);
    expect(tilt(NaN, 1)).toBe(0);
    expect(tilt(5, '5')).toBe(0);
  });

  it('explains the surprises', () => {
    expect(explain('10', '<', '9').text).toContain("'1'");
    expect(explain('10', '<', '9').strings?.index).toBe(0);
    expect(explain(5, '===', '5').text).toContain('Different types');
    expect(explain(NaN, '===', NaN).text).toContain('NaN');
    expect(explain(null, '>=', 0).text).toContain('null becomes 0');
    expect(explain('Apple', '<', 'apple').text).toContain('Uppercase');
  });
});
