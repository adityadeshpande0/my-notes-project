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
  /** What the step will cover. Shown on the path while it's "coming soon". */
  blurb?: string;
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
  // The JavaScript learning path: 14 steps, built one at a time. Each group is
  // a module; topics are in the order a beginner should read them. The last
  // step, a small app, leads straight into the React collection.
  javascript: [
    {
      name: 'Getting started',
      topics: [
        {
          slug: 'what-is-javascript',
          title: 'JavaScript Basics',
          blurb: 'What JavaScript is and how it works.',
        },
      ],
    },
    {
      name: 'Core language',
      topics: [
        {
          slug: 'variables-and-data-types',
          title: 'Variables & Data Types',
          blurb: 'let, const, and the kinds of values JavaScript works with.',
        },
        {
          slug: 'operators-and-conditions',
          title: 'Operators & Conditions',
          blurb: 'if, switch, and what counts as truthy or falsy.',
        },
        {
          slug: 'loops',
          title: 'Loops',
          blurb: 'Repeat work with for and while, with a step-through loop visualizer.',
        },
        {
          slug: 'functions',
          title: 'Functions',
          blurb: 'Parameters, return values, and the call stack.',
        },
      ],
    },
    {
      name: 'Working with data',
      topics: [
        {
          slug: 'arrays-and-array-methods',
          title: 'Arrays & Array Methods',
          blurb: 'Lists of values, with map, filter and reduce shown as conveyor belts.',
        },
        {
          slug: 'objects-and-json',
          title: 'Objects & JSON',
          blurb: 'Group related values under names, and send them around as JSON.',
        },
      ],
    },
    {
      name: 'How JavaScript thinks',
      topics: [
        {
          slug: 'scope-hoisting-closures',
          title: 'Scope, Hoisting & Closures',
          blurb: 'Where a variable can be seen, and how functions remember it.',
        },
      ],
    },
    {
      name: 'In the browser',
      topics: [
        {
          slug: 'the-dom',
          title: 'The DOM',
          blurb: 'Change the page with JavaScript.',
        },
        {
          slug: 'events',
          title: 'Events',
          blurb: 'React to clicks and typing, and see how events bubble up the page.',
        },
      ],
    },
    {
      name: 'Asynchronous JavaScript',
      topics: [
        {
          slug: 'async-javascript',
          title: 'Asynchronous JavaScript',
          blurb: 'From callbacks to Promises to async/await.',
        },
        {
          slug: 'fetching-data',
          title: 'Fetching Data from APIs',
          blurb: 'Ask a server for data and show it on the page.',
        },
      ],
    },
    {
      name: 'Modern JavaScript',
      topics: [
        {
          slug: 'modern-javascript',
          title: 'Modern JS (ES6+)',
          blurb: 'Destructuring, spread, and modules.',
        },
      ],
    },
    {
      name: 'Build something',
      topics: [
        {
          slug: 'mini-project-todo-app',
          title: 'Mini Project: A To-Do App',
          blurb: 'Put it all together in a small app, which leads straight into React.',
        },
      ],
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
