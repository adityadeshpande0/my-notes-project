import { describe, expect, it } from 'vitest';
import { bubbleSort } from './bubbleSort';

const run = (input: number[]) => [...bubbleSort(input)];

describe('bubbleSort', () => {
  it.each([[[5, 3, 8, 1, 4]], [[1, 2, 3, 4]], [[4, 3, 2, 1]], [[2, 2, 1, 2]], [[7]], [[]]])(
    'ends sorted and fully marked for %j',
    (input) => {
      const last = run(input).at(-1)!;
      expect(last.array).toEqual([...input].sort((a, b) => a - b));
      expect(last.sortedFrom).toBe(0);
    },
  );

  it('does not mutate its input', () => {
    const input = [3, 1, 2];
    run(input);
    expect(input).toEqual([3, 1, 2]);
  });

  it('only swaps neighbours that were out of order', () => {
    const steps = run([5, 3, 8, 1, 4]);
    steps.forEach((step, k) => {
      if (!step.swapping) return;
      const [i, j] = step.swapping;
      expect(j).toBe(i + 1);
      const before = steps[k - 1].array;
      expect(before[i]).toBeGreaterThan(before[j]);
      expect(step.array[i]).toBeLessThan(step.array[j]);
    });
  });

  it('stops early on already-sorted input', () => {
    // 1 start + 3 comparisons + 1 "no swaps" step
    expect(run([1, 2, 3, 4])).toHaveLength(5);
  });
});
