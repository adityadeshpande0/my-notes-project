export type Track = 'dsa' | 'react';
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

export const TRACKS: Record<Track, { name: string; tagline: string }> = {
  dsa: {
    name: 'Data Structures & Algorithms',
    tagline: 'Watch algorithms run, one step at a time.',
  },
  react: {
    name: 'React',
    tagline: 'See renders, state, and effects as they happen.',
  },
};

export const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];
