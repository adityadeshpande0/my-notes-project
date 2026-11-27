/**
 * A small line diff (longest common subsequence), for "What changed" between
 * two stages of the build-along. Good enough for files of a few hundred
 * lines, with no library needed.
 */
export type DiffLine = { kind: 'same' | 'add' | 'del'; text: string };

export function lineDiff(before: string, after: string): DiffLine[] {
  const a = before === '' ? [] : before.replace(/\n$/, '').split('\n');
  const b = after === '' ? [] : after.replace(/\n$/, '').split('\n');
  // lcs[i][j] = length of the longest common subsequence of a[i..] and b[j..].
  const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ kind: 'same', text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) out.push({ kind: 'del', text: a[i++] });
    else out.push({ kind: 'add', text: b[j++] });
  }
  while (i < a.length) out.push({ kind: 'del', text: a[i++] });
  while (j < b.length) out.push({ kind: 'add', text: b[j++] });
  return out;
}

/** Rebuild each side from a diff (the tests use this to prove the diff is right). */
export const sides = (d: DiffLine[]) => ({
  before: d.filter((l) => l.kind !== 'add').map((l) => l.text),
  after: d.filter((l) => l.kind !== 'del').map((l) => l.text),
});

export type DiffChunk = { kind: 'lines'; lines: DiffLine[] } | { kind: 'fold'; lines: DiffLine[] };

/** Fold long runs of unchanged lines ("⋯ 24 unchanged lines"), keeping `context` lines around each change. */
export function foldDiff(d: DiffLine[], context = 2): DiffChunk[] {
  const keep = d.map(
    (l, i) =>
      l.kind !== 'same' ||
      d.slice(Math.max(0, i - context), i + context + 1).some((x) => x.kind !== 'same'),
  );
  const chunks: DiffChunk[] = [];
  for (let i = 0; i < d.length;) {
    const k = keep[i];
    let j = i;
    while (j < d.length && keep[j] === k) j++;
    const lines = d.slice(i, j);
    // A fold of 1–2 lines isn't worth hiding.
    chunks.push(!k && lines.length > 2 ? { kind: 'fold', lines } : { kind: 'lines', lines });
    i = j;
  }
  return chunks;
}
