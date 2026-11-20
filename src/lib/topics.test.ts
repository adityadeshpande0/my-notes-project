import { describe, expect, it } from 'vitest';
import { groupByLevel, neighbours, topicsForTrack } from './topics';
import type { TopicMeta } from './types';

const topic = (
  slug: string,
  track: TopicMeta['track'],
  order: number,
  level: TopicMeta['level'] = 'beginner',
): TopicMeta => ({
  title: slug,
  slug,
  track,
  order,
  level,
  tags: [],
  path: `${track}/${slug}.mdx`,
});

const all = [
  topic('merge-sort', 'dsa', 3, 'intermediate'),
  topic('arrays', 'dsa', 1),
  topic('use-state', 'react', 1),
  topic('binary-search', 'dsa', 2),
];

describe('topicsForTrack', () => {
  it('keeps only the requested track, sorted by order', () => {
    expect(topicsForTrack(all, 'dsa').map((t) => t.slug)).toEqual([
      'arrays',
      'binary-search',
      'merge-sort',
    ]);
  });
});

describe('groupByLevel', () => {
  it('puts each topic under its level', () => {
    const groups = groupByLevel(topicsForTrack(all, 'dsa'));
    expect(groups.beginner.map((t) => t.slug)).toEqual(['arrays', 'binary-search']);
    expect(groups.intermediate.map((t) => t.slug)).toEqual(['merge-sort']);
    expect(groups.advanced).toEqual([]);
  });
});

describe('neighbours', () => {
  it('finds prev and next within the same track', () => {
    const { prev, next } = neighbours(all, 'dsa', 'binary-search');
    expect(prev?.slug).toBe('arrays');
    expect(next?.slug).toBe('merge-sort');
  });

  it('has no prev for the first topic and no next for the last', () => {
    expect(neighbours(all, 'dsa', 'arrays').prev).toBeUndefined();
    expect(neighbours(all, 'dsa', 'merge-sort').next).toBeUndefined();
  });

  it('returns nothing for an unknown slug', () => {
    expect(neighbours(all, 'dsa', 'nope')).toEqual({});
  });
});
