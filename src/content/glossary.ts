/**
 * Shared glossary. Any note can explain a word on hover with:
 *
 *   <Term id="big-o">Big-O</Term>
 *
 * Write definitions for a beginner: one or two plain sentences, no jargon that
 * would itself need a definition. `note` points to the topic that covers it in
 * depth; the link only appears once that note exists.
 */
export interface GlossaryEntry {
  term: string;
  definition: string;
  note?: string; // e.g. "/dsa/binary-search"
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  array: {
    term: 'Array',
    definition:
      'An ordered list of values stored side by side in memory. Each value has a numbered position called its index.',
    note: '/dsa/arrays-and-big-o',
  },
  index: {
    term: 'Index',
    definition:
      'The position number of an item in an array. Counting starts at 0, so the first item is at index 0 and the last is at length − 1.',
  },
  contiguous: {
    term: 'Contiguous memory',
    definition:
      'Stored in one unbroken block, with no gaps between items. This is what lets the computer jump straight to any item.',
  },
  'big-o': {
    term: 'Big-O notation',
    definition:
      'A way to describe how the work an algorithm does grows as its input gets bigger. It ignores small details and keeps only the overall shape of the growth.',
    note: '/dsa/arrays-and-big-o',
  },
  'constant-time': {
    term: 'Constant time, O(1)',
    definition:
      'The work takes the same number of steps however big the input is. Reading arr[5] costs the same in a list of 10 or 10 million.',
  },
  'linear-time': {
    term: 'Linear time, O(n)',
    definition:
      'The work grows in step with the input. Twice as many items means roughly twice as many steps.',
  },
  'logarithmic-time': {
    term: 'Logarithmic time, O(log n)',
    definition:
      'The work grows very slowly because each step cuts the problem in half. A million items take only about 20 steps.',
    note: '/dsa/binary-search',
  },
  'off-by-one': {
    term: 'Off-by-one error',
    definition:
      'A bug where a loop runs one time too many or too few, usually from mixing up < with <=, or length with length − 1.',
  },
  amortized: {
    term: 'Amortized cost',
    definition:
      'The average cost per operation over a long run. An occasional slow step is fine if it is rare enough that the average stays low.',
  },
};
