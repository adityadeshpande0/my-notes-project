/**
 * The curriculum: every track split into groups, with each group's topics in
 * reading order. It lists written *and* planned topics by slug. A topic whose
 * .mdx file exists shows as written (with its real title); the rest show as
 * "soon". The navbar menu, mobile menu, home page and track pages all read this,
 * so the structure only lives in one place.
 *
 * To add a topic: put it in the right group here, then write
 * src/content/<track>/<slug>.mdx. A written note that isn't listed here still
 * appears, in a "More" group at the end of its track.
 */
import type { Track } from './types';

export interface PlannedTopic {
  slug: string;
  /** Short title, used until the note exists (then its own title wins). */
  title: string;
}

export interface CurriculumGroup {
  name: string;
  topics: PlannedTopic[];
}

export const CURRICULUM: Record<Track, CurriculumGroup[]> = {
  fundamentals: [
    {
      name: 'How code runs',
      topics: [{ slug: 'from-code-to-electrons', title: 'From Code to Electrons' }],
    },
    {
      name: 'Memory',
      topics: [{ slug: 'memory-and-caches', title: 'Memory and the Cache Hierarchy' }],
    },
  ],
  javascript: [
    {
      name: 'Getting started',
      topics: [{ slug: 'what-is-javascript', title: 'JavaScript Basics' }],
    },
    {
      name: 'Core language',
      topics: [
        { slug: 'variables-and-data-types', title: 'Variables & Data Types' },
        { slug: 'functions', title: 'Functions' },
      ],
    },
    {
      name: 'In the browser',
      topics: [{ slug: 'the-dom', title: 'The DOM' }],
    },
  ],
  dsa: [
    {
      name: 'Foundations',
      topics: [{ slug: 'arrays-and-big-o', title: 'Arrays and Big-O' }],
    },
    {
      name: 'Sorting',
      topics: [
        { slug: 'bubble-sort', title: 'Bubble Sort' },
        { slug: 'merge-sort', title: 'Merge Sort' },
      ],
    },
    {
      name: 'Searching',
      topics: [{ slug: 'binary-search', title: 'Binary Search' }],
    },
    {
      name: 'Linear structures',
      topics: [
        { slug: 'stack-and-queue', title: 'Stacks and Queues' },
        { slug: 'linked-list', title: 'Linked Lists' },
      ],
    },
    {
      name: 'Trees and graphs',
      topics: [
        { slug: 'binary-search-tree', title: 'Binary Search Trees' },
        { slug: 'bfs-and-dfs', title: 'BFS and DFS on a Grid' },
      ],
    },
  ],
  react: [
    {
      name: 'Building blocks',
      topics: [
        { slug: 'components-and-props', title: 'Components and Props' },
        { slug: 'use-state', title: 'useState' },
      ],
    },
    {
      name: 'Effects and rendering',
      topics: [
        { slug: 'use-effect', title: 'useEffect' },
        { slug: 're-rendering', title: 'Why Components Re-render' },
      ],
    },
    {
      name: 'Sharing logic',
      topics: [
        { slug: 'context', title: 'Context' },
        { slug: 'custom-hooks', title: 'Custom Hooks' },
      ],
    },
  ],
};
