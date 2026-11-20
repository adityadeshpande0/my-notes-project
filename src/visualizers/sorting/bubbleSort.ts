import type { SortStep } from './types';

/** Shown next to the visual. Line numbers match `step.line`. */
export const bubbleSortPseudocode = [
  'for each pass i',
  '  for j from 0 to n − i − 2',
  '    if a[j] > a[j + 1]',
  '      swap a[j] and a[j + 1]',
  '  if nothing swapped, stop',
];

/**
 * Bubble sort as a generator: instead of just sorting, it *yields* a snapshot
 * after every interesting moment. Pure TypeScript: no React, easy to test.
 */
export function* bubbleSort(input: readonly number[]): Generator<SortStep> {
  const a = [...input]; // never mutate the caller's array
  const n = a.length;
  let sortedFrom = n;

  yield { array: [...a], sortedFrom, line: 0, message: `Start with ${n} values.` };

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;

    for (let j = 0; j < n - i - 1; j++) {
      const [x, y] = [a[j], a[j + 1]];
      const bigger = x > y;
      yield {
        array: [...a],
        comparing: [j, j + 1],
        sortedFrom,
        line: 3,
        message: bigger
          ? `Compare ${x} and ${y}: ${x} > ${y}, so swap.`
          : `Compare ${x} and ${y}: already in order.`,
      };

      if (bigger) {
        [a[j], a[j + 1]] = [y, x];
        swapped = true;
        yield {
          array: [...a],
          swapping: [j, j + 1],
          sortedFrom,
          line: 4,
          message: `Swap ${x} and ${y}.`,
        };
      }
    }

    sortedFrom = n - i - 1;

    if (!swapped) {
      yield {
        array: [...a],
        sortedFrom: 0,
        line: 5,
        message: 'No swaps this pass, so everything is in order.',
      };
      return;
    }

    yield {
      array: [...a],
      sortedFrom,
      line: 1,
      message: `${a[sortedFrom]} has bubbled up to its final place.`,
    };
  }

  yield { array: [...a], sortedFrom: 0, line: 0, message: 'Sorted.' };
}
