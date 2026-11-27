/**
 * Which course articles each feature of the finished app uses (FeatureMap),
 * and which concepts each build-along stage introduces (BuildAlong). One
 * typed list each, so every view shows the same mapping.
 */
export interface Article {
  n: number;
  title: string;
  slug: string;
  icon: string;
}
export const ARTICLES: Article[] = [
  { n: 1, title: 'What is JavaScript?', slug: 'what-is-javascript', icon: '🌱' },
  { n: 2, title: 'Variables & data types', slug: 'variables-and-data-types', icon: '📦' },
  { n: 3, title: 'Operators & conditions', slug: 'operators-and-conditions', icon: '🔀' },
  { n: 4, title: 'Loops', slug: 'loops', icon: '🔁' },
  { n: 5, title: 'Functions', slug: 'functions', icon: '🧩' },
  { n: 6, title: 'Arrays', slug: 'arrays', icon: '📚' },
  { n: 7, title: 'Objects & JSON', slug: 'objects-and-json', icon: '🗂️' },
  { n: 8, title: 'Scope & closures', slug: 'scope-hoisting-closures', icon: '🎒' },
  { n: 9, title: 'The DOM', slug: 'the-dom', icon: '🌳' },
  { n: 10, title: 'Events', slug: 'events', icon: '🖱️' },
  { n: 11, title: 'Async JavaScript', slug: 'async', icon: '⏳' },
  { n: 12, title: 'Fetching data', slug: 'fetching-apis', icon: '🌐' },
  { n: 13, title: 'Modern JavaScript', slug: 'modern-javascript', icon: '✨' },
];

export type FeatureId =
  'add' | 'toggle' | 'delete' | 'count' | 'filter' | 'remember' | 'clear' | 'safe' | 'all';
export interface Feature {
  id: FeatureId;
  icon: string;
  name: string;
  uses: { n: number; what: string }[];
}
export const FEATURES: Feature[] = [
  {
    id: 'add',
    icon: '➕',
    name: 'Add a task',
    uses: [
      { n: 10, what: 'submit, preventDefault' },
      { n: 13, what: 'spread [...todos, new]' },
      { n: 2, what: 'const, trim()' },
      { n: 9, what: 'createElement' },
    ],
  },
  {
    id: 'toggle',
    icon: '✅',
    name: 'Tick off',
    uses: [
      { n: 10, what: 'event delegation' },
      { n: 6, what: 'map' },
      { n: 7, what: 'objects, dataset' },
      { n: 13, what: '{ ...todo, done }' },
    ],
  },
  {
    id: 'delete',
    icon: '🗑',
    name: 'Delete',
    uses: [
      { n: 6, what: 'filter' },
      { n: 10, what: 'event delegation' },
    ],
  },
  {
    id: 'count',
    icon: '🔢',
    name: 'Counter',
    uses: [
      { n: 6, what: 'filter().length' },
      { n: 3, what: 'ternary: task / tasks' },
      { n: 2, what: 'template literal' },
    ],
  },
  {
    id: 'filter',
    icon: '🔍',
    name: 'Filters',
    uses: [
      { n: 3, what: 'if / conditions' },
      { n: 6, what: 'filter' },
      { n: 9, what: 'aria-pressed attribute' },
    ],
  },
  {
    id: 'remember',
    icon: '💾',
    name: 'Remember tasks',
    uses: [
      { n: 7, what: 'JSON + localStorage' },
      { n: 3, what: '?? []' },
      { n: 11, what: 'storage is synchronous (unlike fetch)' },
    ],
  },
  {
    id: 'clear',
    icon: '🧹',
    name: 'Clear done',
    uses: [
      { n: 6, what: 'filter' },
      { n: 3, what: 'some() in a condition' },
    ],
  },
  {
    id: 'safe',
    icon: '🛡',
    name: 'Safe text',
    uses: [{ n: 9, what: 'textContent, not innerHTML (XSS)' }],
  },
  {
    id: 'all',
    icon: '🧠',
    name: 'Everything',
    uses: [
      { n: 5, what: 'small functions' },
      { n: 8, what: 'listeners are closures' },
      { n: 1, what: 'the event loop runs your handlers' },
      { n: 4, what: 'for...of over the filter buttons' },
      { n: 12, what: 'next: load tasks from an API (stretch goal)' },
    ],
  },
];

/** Every article the app uses, across all features. */
export const articlesUsed = () =>
  [...new Set(FEATURES.flatMap((f) => f.uses.map((u) => u.n)))].sort((a, b) => a - b);

export interface Stage {
  n: number;
  icon: string;
  title: string;
  tryIt: string;
  concepts: { name: string; n: number }[];
}
export const STAGES: Stage[] = [
  {
    n: 1,
    icon: '🧱',
    title: 'The skeleton',
    tryIt: 'Just HTML and CSS: nothing works yet. Notice the script is loaded with defer.',
    concepts: [
      { name: 'HTML structure', n: 9 },
      { name: 'defer', n: 9 },
    ],
  },
  {
    n: 2,
    icon: '🖼️',
    title: 'Data and render()',
    tryIt: 'The two sample tasks are drawn FROM the todos array.',
    concepts: [
      { name: 'array of objects', n: 7 },
      { name: 'createElement', n: 9 },
      { name: 'textContent', n: 9 },
      { name: 'map', n: 6 },
    ],
  },
  {
    n: 3,
    icon: '➕',
    title: 'Adding tasks',
    tryIt: 'Now try typing a task and pressing Enter.',
    concepts: [
      { name: 'submit event', n: 10 },
      { name: 'preventDefault', n: 10 },
      { name: 'trim()', n: 2 },
      { name: 'spread', n: 13 },
    ],
  },
  {
    n: 4,
    icon: '✅',
    title: 'Ticking off and deleting',
    tryIt: 'Tick a task, or press ✕ to delete it.',
    concepts: [
      { name: 'event delegation', n: 10 },
      { name: 'map / filter', n: 6 },
      { name: 'dataset', n: 9 },
      { name: '{ ...todo }', n: 13 },
    ],
  },
  {
    n: 5,
    icon: '🔍',
    title: 'Counter, empty state, filters',
    tryIt: 'Add a few tasks, tick some, then try the filters.',
    concepts: [
      { name: 'derived values', n: 6 },
      { name: 'ternary', n: 3 },
      { name: 'template literals', n: 2 },
      { name: 'aria-pressed', n: 9 },
    ],
  },
  {
    n: 6,
    icon: '💾',
    title: 'Remembering tasks',
    tryIt: 'Saving is off in this preview (see the note), but the app keeps working.',
    concepts: [
      { name: 'JSON + localStorage', n: 7 },
      { name: '?? []', n: 3 },
      { name: 'try...catch', n: 7 },
    ],
  },
  {
    n: 7,
    icon: '✨',
    title: 'Polish',
    tryIt: 'Tick a task: “Clear done” appears. Add a task: the cursor stays in the box.',
    concepts: [
      { name: 'aria-label', n: 9 },
      { name: 'focus()', n: 9 },
      { name: 'hidden', n: 9 },
    ],
  },
];
