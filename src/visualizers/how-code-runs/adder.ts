/**
 * A 4-bit ripple-carry adder, simulated bit by bit with logic gates.
 * Pure functions, no React: see adder.test.ts.
 */

export const BITS = 4;

/** 5 → [1, 0, 1, 0]  (least significant bit first, i.e. column 0 first) */
export const toBits = (n: number): number[] => Array.from({ length: BITS }, (_, i) => (n >> i) & 1);

export interface Column {
  a: number;
  b: number;
  /** carry coming in from the column to the right */
  cin: number;
  /** a XOR b, used in both the sum and the carry */
  x: number;
  sum: number;
  cout: number;
}

/** One full adder per column, from right (column 0) to left. */
export function rippleAdd(a: number, b: number): Column[] {
  const as = toBits(a);
  const bs = toBits(b);
  const columns: Column[] = [];
  let carry = 0;
  for (let i = 0; i < BITS; i++) {
    const x = as[i] ^ bs[i]; // XOR gate
    const sum = x ^ carry; // second XOR gate
    const cout = (as[i] & bs[i]) | (carry & x); // two ANDs into an OR
    columns.push({ a: as[i], b: bs[i], cin: carry, x, sum, cout });
    carry = cout;
  }
  return columns;
}

/** The number the adder's output wires represent, including the final carry. */
export function resultOf(columns: Column[]): number {
  const sum = columns.reduce((total, col, i) => total + (col.sum << i), 0);
  return sum + (columns[BITS - 1].cout << BITS);
}
