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

  const toEntry = (slug: string, fallbackTitle: string): OutlineEntry => {
    const note = bySlug.get(slug);
    if (!note) return { slug, title: fallbackTitle };
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
      return toEntry(t.slug, t.title);
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
