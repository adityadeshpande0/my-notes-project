import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeOrder } from './fakeKitchen';
import { runOrders, type Combinator, type OrderSpec } from './kitchenRun';

// Any unhandled rejection during these tests is a bug. (Tests run in Node,
// where `process` exists; the app's types don't include Node, hence the cast.)
type Proc = { on: (e: string, f: () => void) => void; off: (e: string, f: () => void) => void };
const process = (globalThis as unknown as { process: Proc }).process;
let unhandled = 0;
const onUnhandled = () => unhandled++;
beforeAll(() => process.on('unhandledRejection', onUnhandled));
afterAll(() => {
  process.off('unhandledRejection', onUnhandled);
});
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  expect(unhandled).toBe(0);
});

describe('makeOrder', () => {
  it('fulfils after the time, with the item', async () => {
    const p = makeOrder('chai', { ms: 2000 });
    let done = false;
    p.then(() => (done = true));
    await vi.advanceTimersByTimeAsync(1999);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(p).resolves.toMatchObject({ item: 'chai' });
  });

  it('rejects with a burnt error, and speed scales the time', async () => {
    const p = makeOrder('samosa', { ms: 2000, fail: true, speed: 2 });
    const check = expect(p).rejects.toThrow('samosa burnt! 🔥');
    await vi.advanceTimersByTimeAsync(1000);
    await check;
  });

  it('aborts: clears the timer and rejects with an AbortError', async () => {
    const ctrl = new AbortController();
    const p = makeOrder('jalebi', { ms: 5000, signal: ctrl.signal });
    const check = expect(p).rejects.toMatchObject({ name: 'AbortError' });
    ctrl.abort();
    await check;
    expect(vi.getTimerCount()).toBe(0);
    await expect(makeOrder('lassi', { ms: 10, signal: ctrl.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});

const MS = [2000, 3000, 1000];
const ITEMS = ['chai', 'samosa', 'jalebi'];

/** What each combinator SHOULD do, worked out from the rules (not from running it). */
function expected(kind: Combinator, fails: boolean[]) {
  const byTime = [0, 1, 2].sort((a, b) => MS[a] - MS[b]);
  if (kind === 'all') {
    const firstFail = byTime.find((i) => fails[i]);
    return firstFail === undefined
      ? { status: 'fulfilled', at: 3000, summary: JSON.stringify(ITEMS) }
      : { status: 'rejected', at: MS[firstFail], summary: `Error: ${ITEMS[firstFail]} burnt! 🔥` };
  }
  if (kind === 'allSettled') return { status: 'fulfilled', at: 3000 };
  if (kind === 'race') {
    const i = byTime[0];
    return fails[i]
      ? { status: 'rejected', at: MS[i], summary: `Error: ${ITEMS[i]} burnt! 🔥` }
      : { status: 'fulfilled', at: MS[i], summary: JSON.stringify(ITEMS[i]) };
  }
  if (kind === 'any') {
    const firstOk = byTime.find((i) => !fails[i]);
    return firstOk === undefined
      ? { status: 'rejected', at: 3000, summary: 'AggregateError: All promises were rejected' }
      : { status: 'fulfilled', at: MS[firstOk], summary: JSON.stringify(ITEMS[firstOk]) };
  }
  // sequential: one after another, stopping at the first failure
  let t = 0;
  for (let i = 0; i < 3; i++) {
    t += MS[i];
    if (fails[i]) return { status: 'rejected', at: t, summary: `Error: ${ITEMS[i]} burnt! 🔥` };
  }
  return { status: 'fulfilled', at: 6000, summary: JSON.stringify(ITEMS) };
}

describe('combinators, for every success/failure mix of 3 orders', () => {
  for (const kind of ['all', 'allSettled', 'race', 'any', 'sequential'] as Combinator[]) {
    it(kind, async () => {
      for (let mask = 0; mask < 8; mask++) {
        const fails = [0, 1, 2].map((i) => !!(mask & (1 << i)));
        const specs: OrderSpec[] = ITEMS.map((item, i) => ({ item, ms: MS[i], fail: fails[i] }));
        const run = runOrders(kind, specs);
        await vi.advanceTimersByTimeAsync(7000);
        const rec = await run;
        expect(rec.outcome).toMatchObject(expected(kind, fails));
        if (kind === 'allSettled')
          expect(rec.outcome!.parts!.map((p) => p.status)).toEqual(
            fails.map((f) => (f ? 'rejected' : 'fulfilled')),
          );
        // Every order that started settled exactly once, at its own time.
        for (const st of rec.settles) expect(st.at - rec.started[st.index]!).toBe(MS[st.index]);
        if (kind !== 'sequential') expect(rec.settles).toHaveLength(3); // the others keep cooking
      }
    });
  }

  it('aborting a run clears every timer and leaves nothing unhandled', async () => {
    const ctrl = new AbortController();
    const run = runOrders(
      'all',
      ITEMS.map((item, i) => ({ item, ms: MS[i], fail: i === 1 })),
      { signal: ctrl.signal },
    );
    const check = expect(run).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(500);
    ctrl.abort();
    await check;
    expect(vi.getTimerCount()).toBe(0);
  });
});
