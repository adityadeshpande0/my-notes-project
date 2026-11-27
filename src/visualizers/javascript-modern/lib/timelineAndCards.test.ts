import { describe, expect, it } from 'vitest';
import { morphBetween } from '../../core/code/morph';
import { detect, EDITIONS, allFeatures, learnedCount, TC39_STAGES } from './esTimeline';
import { CARDS } from './oldNew';

describe('then vs now', () => {
  it('old and new give the same output, for every card', async () => {
    expect(CARDS).toHaveLength(10);
    for (const card of CARDS) {
      const { old, modern } = await card.run();
      expect(JSON.stringify(modern), card.id).toBe(JSON.stringify(old));
    }
  });
  it('morphs keep shared tokens and rebuild each version exactly', () => {
    for (const card of CARDS) {
      const { tokens, versions } = morphBetween([card.oldCode, card.newCode], ['', '']);
      expect(versions.map((v) => v.ids.map((id) => tokens[id]).join(''))).toEqual([
        card.oldCode,
        card.newCode,
      ]);
    }
  });
});

describe('the ES timeline', () => {
  it('matches the fact sheet', () => {
    expect(EDITIONS.map((e) => e.year)).toEqual([
      2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026,
    ]);
    expect(EDITIONS.map((e) => e.features.length)).toEqual([14, 2, 3, 3, 3, 6, 4, 5, 2, 2, 6, 7]);
    expect(EDITIONS.find((e) => e.year === 2026)!.features.map((f) => f.name)).toEqual([
      'Array.fromAsync',
      'Error.isError',
      'Math.sumPrecise',
      'Uint8Array Base64 / Hex methods',
      'Iterator.concat',
      'JSON.parse source text access',
      'Map.prototype.getOrInsert',
    ]);
    expect(TC39_STAGES.map(([s]) => s)).toEqual(['0', '1', '2', '2.7', '3', '4']);
  });
  it('feature detection never throws, and knows Node 22', () => {
    for (const f of allFeatures()) expect(() => detect(f)).not.toThrow();
    const byName = Object.fromEntries(allFeatures().map((f) => [f.name, detect(f)]));
    expect(byName['Array.prototype.at']).toBe(true);
    expect(byName['Optional chaining ?.']).toBe('syntax');
    expect(byName['JSON modules / import attributes']).toBe('unknown');
  });
  it('counts what the course taught from the article links', () => {
    expect(learnedCount()).toBe(allFeatures().filter((f) => f.article).length);
    expect(learnedCount()).toBeGreaterThan(20);
  });
});
