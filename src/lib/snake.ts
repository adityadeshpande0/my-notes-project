/**
 * Snake layout for the learning path: steps fill a row left → right, drop down
 * one row, fill it right → left, drop again, and so on, like a board game.
 *
 * Pure maths, no React, so it can be unit tested. Rows and columns are 0-based.
 */
export interface SnakeCell {
  row: number;
  col: number;
  /** Which way the path leaves this cell: along the row, or down to the next row. */
  exit: 'right' | 'left' | 'down' | 'end';
}

export function snakeCell(index: number, count: number, cols: number): SnakeCell {
  const row = Math.floor(index / cols);
  const j = index % cols; // position along the row, in reading order
  const leftToRight = row % 2 === 0;
  const col = leftToRight ? j : cols - 1 - j;

  let exit: SnakeCell['exit'];
  if (index === count - 1) exit = 'end';
  else if (j === cols - 1)
    exit = 'down'; // last in its row: turn the corner
  else exit = leftToRight ? 'right' : 'left';

  return { row, col, exit };
}
