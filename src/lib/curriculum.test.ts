import { describe, expect, it } from 'vitest';
import { outlineFor, shortTitle } from './curriculum';
import type { TopicMeta } from './types';

const note = (slug: string, title: string, order = 1): TopicMeta => ({
  slug,
  title,
  track: 'dsa',
  level: 'beginner',
  order,
  tags: [],
  path: `dsa/${slug}.mdx`,
});

describe('outlineFor', () => {
  it('marks written notes with a link and their real (short) title', () => {
    const o = outlineFor([note('bubble-sort', 'Bubble Sort: Watch It Swap')], 'dsa');
    const entry = o.groups.flatMap((g) => g.entries).find((e) => e.slug === 'bubble-sort')!;
    expect(entry.href).toBe('/dsa/bubble-sort');
    expect(entry.title).toBe('Bubble Sort');
  });

  it('keeps planned topics, without a link', () => {
    const o = outlineFor([], 'dsa');
    expect(o.written).toBe(0);
    expect(o.total).toBeGreaterThan(0);
    expect(o.groups.every((g) => g.entries.every((e) => !e.href))).toBe(true);
  });

  it('puts written notes missing from the curriculum in a "More" group', () => {
    const o = outlineFor([note('tries', 'Tries')], 'dsa');
    expect(o.groups.at(-1)).toMatchObject({ name: 'More', entries: [{ slug: 'tries' }] });
    expect(o.written).toBe(1);
  });

  it('never lists a topic twice', () => {
    const o = outlineFor([note('arrays-and-big-o', 'Arrays and Big-O')], 'dsa');
    const slugs = o.groups.flatMap((g) => g.entries.map((e) => e.slug));
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('shortTitle', () => {
  it('drops the subtitle after a colon', () => {
    expect(shortTitle('JavaScript Basics: What It Is')).toBe('JavaScript Basics');
    expect(shortTitle('useState')).toBe('useState');
  });
});
