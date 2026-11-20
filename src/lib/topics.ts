/**
 * Pure helpers for working with topic lists. No React and no Vite here, so
 * they're easy to unit test (see topics.test.ts).
 */
import type { Level, TopicMeta, Track } from './types';

/** Topics in one track, sorted by their `order` frontmatter field. */
export function topicsForTrack(all: TopicMeta[], track: Track): TopicMeta[] {
  return all.filter((t) => t.track === track).sort((a, b) => a.order - b.order);
}

/** Group a track's topics by level, keeping the order inside each group. */
export function groupByLevel(topics: TopicMeta[]): Record<Level, TopicMeta[]> {
  const groups: Record<Level, TopicMeta[]> = { beginner: [], intermediate: [], advanced: [] };
  for (const topic of topics) groups[topic.level].push(topic);
  return groups;
}

/** The topics before and after `slug` in its track, for prev/next links. */
export function neighbours(
  all: TopicMeta[],
  track: Track,
  slug: string,
): { prev?: TopicMeta; next?: TopicMeta } {
  const list = topicsForTrack(all, track);
  const i = list.findIndex((t) => t.slug === slug);
  if (i === -1) return {};
  return { prev: list[i - 1], next: list[i + 1] };
}
