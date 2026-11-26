/**
 * Run several orders with a real combinator (Promise.all, allSettled, race,
 * any) or one by one, and RECORD what happened: when each order started and
 * settled, and when and how the combinator itself settled. The timeline in
 * PromiseLab is drawn from this record, so it can't show anything that
 * didn't really happen. Tested with fake timers in kitchenRun.test.ts.
 *
 * Every promise made here is handled, so no "unhandled rejection" ever
 * reaches the console.
 */
import { isAbort, makeOrder } from './fakeKitchen';

export type Combinator = 'all' | 'allSettled' | 'race' | 'any' | 'sequential';

export interface OrderSpec {
  item: string;
  /** Kitchen milliseconds. */
  ms: number;
  fail: boolean;
}

export interface Settle {
  index: number;
  status: 'fulfilled' | 'rejected';
  /** Kitchen ms since the run started. */
  at: number;
  text: string;
}

export interface Outcome {
  status: 'fulfilled' | 'rejected';
  /** Kitchen ms since the run started. */
  at: number;
  /** What the combinator gave back, written as a learner would see it. */
  summary: string;
  /** For allSettled (and any's AggregateError): one part per order. */
  parts?: { status: 'fulfilled' | 'rejected'; text: string }[];
}

export interface RunRecord {
  kind: Combinator;
  /** When each order started (kitchen ms), or null if it never started. */
  started: (number | null)[];
  settles: Settle[];
  outcome: Outcome | null;
}

export async function runOrders(
  kind: Combinator,
  specs: OrderSpec[],
  {
    signal,
    speed = 1,
    onUpdate,
  }: { signal?: AbortSignal; speed?: number; onUpdate?: (r: RunRecord) => void } = {},
): Promise<RunRecord> {
  const t0 = Date.now();
  const now = () => Math.round((Date.now() - t0) * speed);
  const rec: RunRecord = { kind, started: specs.map(() => null), settles: [], outcome: null };
  const update = () => onUpdate?.({ ...rec, started: [...rec.started], settles: [...rec.settles] });

  /** Start order i, and write down when it settles. */
  const start = (i: number) => {
    const s = specs[i];
    rec.started[i] = now();
    const p = makeOrder(s.item, { ms: s.ms, fail: s.fail, signal, speed });
    // A separate, handled branch that only records (the combinator gets `p` itself).
    p.then(
      (o) => {
        rec.settles.push({ index: i, status: 'fulfilled', at: now(), text: o.item });
        update();
      },
      (e: Error) => {
        if (isAbort(e)) return;
        rec.settles.push({ index: i, status: 'rejected', at: now(), text: e.message });
        update();
      },
    );
    return p;
  };

  try {
    if (kind === 'sequential') {
      const values: string[] = [];
      // await inside a loop: each order starts only when the previous one is done.
      for (let i = 0; i < specs.length; i++) values.push((await start(i)).item);
      rec.outcome = { status: 'fulfilled', at: now(), summary: JSON.stringify(values) };
    } else {
      const ps = specs.map((_, i) => start(i));
      update();
      if (kind === 'all') {
        const all = await Promise.all(ps);
        rec.outcome = {
          status: 'fulfilled',
          at: now(),
          summary: JSON.stringify(all.map((o) => o.item)),
        };
      } else if (kind === 'allSettled') {
        const res = await Promise.allSettled(ps);
        const parts = res.map((r) =>
          r.status === 'fulfilled'
            ? {
                status: 'fulfilled' as const,
                text: `{ status: "fulfilled", value: "${r.value.item}" }`,
              }
            : {
                status: 'rejected' as const,
                text: `{ status: "rejected", reason: "${(r.reason as Error).message}" }`,
              },
        );
        rec.outcome = { status: 'fulfilled', at: now(), summary: `${parts.length} results`, parts };
      } else if (kind === 'race') {
        const first = await Promise.race(ps);
        rec.outcome = { status: 'fulfilled', at: now(), summary: JSON.stringify(first.item) };
      } else {
        const first = await Promise.any(ps);
        rec.outcome = { status: 'fulfilled', at: now(), summary: JSON.stringify(first.item) };
      }
    }
  } catch (e) {
    if (isAbort(e)) throw e; // reset or unmount: the caller ignores it
    if (e instanceof AggregateError)
      rec.outcome = {
        status: 'rejected',
        at: now(),
        summary: `AggregateError: ${e.message}`,
        parts: e.errors.map((x: Error) => ({ status: 'rejected' as const, text: x.message })),
      };
    else rec.outcome = { status: 'rejected', at: now(), summary: `Error: ${(e as Error).message}` };
  }
  update();
  return rec;
}
