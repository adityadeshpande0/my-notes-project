export type Track = 'fundamentals' | 'javascript' | 'dsa' | 'react';
export type Level = 'beginner' | 'intermediate' | 'advanced';

/** Everything we know about a topic from its frontmatter (no note body). */
export interface TopicMeta {
  title: string;
  track: Track;
  level: Level;
  order: number;
  summary?: string;
  tags: string[];
  complexity?: { time?: string; space?: string };
  /** File name without `.mdx`, used in the URL: /dsa/binary-search */
  slug: string;
  /** Path relative to src/content, e.g. "dsa/binary-search.mdx" */
  path: string;
}

/** Display info for each track. The object's key order is the order tracks appear in. */
export const TRACKS: Record<Track, { name: string; short: string; tagline: string }> = {
  fundamentals: {
    name: 'How Computers Work',
    short: 'Fundamentals',
    tagline: 'Follow your code all the way down to electrons.',
  },
  javascript: {
    name: 'JavaScript',
    short: 'JavaScript',
    tagline: 'The language of the web, from its first ten days to the event loop.',
  },
  dsa: {
    name: 'Data Structures & Algorithms',
    short: 'DSA',
    tagline: 'Watch algorithms run, one step at a time.',
  },
  react: {
    name: 'React',
    short: 'React',
    tagline: 'See renders, state, and effects as they happen.',
  },
};

export const TRACK_IDS = Object.keys(TRACKS) as Track[];

export const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];
