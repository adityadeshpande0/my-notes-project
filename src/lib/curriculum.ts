/**
 * Pure helpers that merge the curriculum (roadmap.ts) with the notes that
 * actually exist (the content manifest). No React here, so it's unit tested.
 */
import { CURRICULUM } from './roadmap';
import { topicsForTrack } from './topics';
import { TRACK_IDS, type Level, type TopicMeta, type Track } from './types';

export interface OutlineEntry {
  slug: string;
  /** Short title for menus and lists. */
  title: string;
  /** URL, only for written notes. */
  href?: string;
  level?: Level;
  summary?: string;
  /** What a planned step will cover (from the curriculum). */
  blurb?: string;
}

export interface OutlineGroup {
  name: string;
  entries: OutlineEntry[];
}

export interface TrackOutline {
  track: Track;
  groups: OutlineGroup[];
  written: number;
  total: number;
}

/** "From Code to Electrons: How Your Program Really Runs" → "From Code to Electrons" */
export const shortTitle = (title: string) => title.split(':')[0].trim();

export function outlineFor(all: TopicMeta[], track: Track): TrackOutline {
  const notes = topicsForTrack(all, track);
  const bySlug = new Map(notes.map((n) => [n.slug, n]));
  const listed = new Set<string>();

  const toEntry = (slug: string, fallbackTitle: string, blurb?: string): OutlineEntry => {
    const note = bySlug.get(slug);
    if (!note) return { slug, title: fallbackTitle, blurb };
    return {
      slug,
      title: shortTitle(note.title),
      href: `/${track}/${slug}`,
      level: note.level,
      summary: note.summary,
    };
  };

  const groups: OutlineGroup[] = CURRICULUM[track].map((g) => ({
    name: g.name,
    entries: g.topics.map((t) => {
      listed.add(t.slug);
      return toEntry(t.slug, t.title, t.blurb);
    }),
  }));

  // Written notes nobody put in a group still deserve a place.
  const extra = notes.filter((n) => !listed.has(n.slug));
  if (extra.length)
    groups.push({ name: 'More', entries: extra.map((n) => toEntry(n.slug, n.title)) });

  const entries = groups.flatMap((g) => g.entries);
  return {
    track,
    groups,
    written: entries.filter((e) => e.href).length,
    total: entries.length,
  };
}

export const allOutlines = (all: TopicMeta[]) => TRACK_IDS.map((t) => outlineFor(all, t));

/** One step on a collection's learning path. */
export interface PathStep extends OutlineEntry {
  /** 1-based position on the path. */
  step: number;
  /** The group (module) this step belongs to. */
  group: string;
}

/** Every topic of a collection, written or not, in reading order. */
export function pathFor(all: TopicMeta[], track: Track): PathStep[] {
  let step = 0;
  return outlineFor(all, track).groups.flatMap((g) =>
    g.entries.map((e) => ({ ...e, step: ++step, group: g.name })),
  );
}

/**
 * Where a topic sits on its path: the step itself, the closest *written* steps
 * before and after it (so links always work), and the very next step even if
 * it isn't written yet (so the reader can see what's coming).
 */
export function pathPosition(all: TopicMeta[], track: Track, slug: string) {
  const path = pathFor(all, track);
  const i = path.findIndex((s) => s.slug === slug);
  if (i === -1)
    return { path, current: undefined, prev: undefined, next: undefined, upcoming: undefined };
  const before = path.slice(0, i).filter((s) => s.href);
  const after = path.slice(i + 1);
  return {
    path,
    current: path[i],
    prev: before.at(-1),
    next: after.find((s) => s.href),
    upcoming: after[0],
  };
}
