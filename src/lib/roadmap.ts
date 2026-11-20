/**
 * Topics that are planned but not written yet. The landing page's contents list
 * shows these greyed out. When a note with the same slug is added to
 * src/content, it automatically shows as written instead.
 */
import type { Track } from './types';

export const PLANNED: Record<Track, { slug: string; title: string }[]> = {
  fundamentals: [{ slug: 'memory-and-caches', title: 'Memory and the Cache Hierarchy' }],
  dsa: [
    { slug: 'bubble-sort', title: 'Bubble Sort' },
    { slug: 'binary-search', title: 'Binary Search' },
    { slug: 'merge-sort', title: 'Merge Sort' },
    { slug: 'stack-and-queue', title: 'Stacks and Queues' },
    { slug: 'linked-list', title: 'Linked Lists' },
    { slug: 'binary-search-tree', title: 'Binary Search Trees' },
    { slug: 'bfs-and-dfs', title: 'BFS and DFS on a Grid' },
  ],
  react: [
    { slug: 'components-and-props', title: 'Components and Props' },
    { slug: 'use-state', title: 'useState' },
    { slug: 'use-effect', title: 'useEffect' },
    { slug: 're-rendering', title: 'Why Components Re-render' },
    { slug: 'context', title: 'Context' },
    { slug: 'custom-hooks', title: 'Custom Hooks' },
  ],
};
