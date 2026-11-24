import { describe, expect, it } from 'vitest';
import { snakeCell } from './snake';

const layout = (count: number, cols: number) =>
  Array.from({ length: count }, (_, i) => snakeCell(i, count, cols));

describe('snakeCell', () => {
  it('fills the first row left to right, the second right to left', () => {
    const cells = layout(6, 3);
    expect(cells.map((c) => [c.row, c.col])).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 1],
      [1, 0],
    ]);
  });

  it('turns down at the end of each row and stops at the last step', () => {
    expect(layout(5, 3).map((c) => c.exit)).toEqual(['right', 'right', 'down', 'left', 'end']);
  });

  it('puts the next row’s first step right under the turn', () => {
    const cells = layout(7, 3);
    expect(cells[3].col).toBe(cells[2].col);
    expect(cells[6].col).toBe(cells[5].col);
  });

  it('is a plain vertical list with one column', () => {
    expect(layout(3, 1)).toEqual([
      { row: 0, col: 0, exit: 'down' },
      { row: 1, col: 0, exit: 'down' },
      { row: 2, col: 0, exit: 'end' },
    ]);
  });
});
