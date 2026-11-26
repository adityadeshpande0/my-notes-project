/**
 * A pretend kitchen that returns REAL promises. Nothing here touches the
 * network: each order is just a timer.
 *
 * makeOrder("chai", { ms: 2000 }) fulfils with { item, readyAt } after 2
 * "kitchen seconds", or rejects with an Error("chai burnt! 🔥") when
 * `fail` is true. `speed` scales the time (2 = twice as fast).
 *
 * Every timer can be cancelled: pass an AbortSignal, and on abort the timer
 * is cleared and the promise rejects with an AbortError. The visuals make one
 * AbortController per run and abort it on Reset and unmount. (fetch, in the
 * next article, takes a signal in exactly the same way.)
 */
export interface Order {
  item: string;
  /** Date.now() when it was ready. */
  readyAt: number;
}

export interface OrderOptions {
  /** How long it takes, in kitchen milliseconds. */
  ms: number;
  fail?: boolean;
  signal?: AbortSignal;
  /** 1 = a kitchen second is a real second; 2 = twice as fast. */
  speed?: number;
}

export const abortError = () => new DOMException('The order was cancelled', 'AbortError');

export const isAbort = (e: unknown) => e instanceof DOMException && e.name === 'AbortError';

export function makeOrder(
  item: string,
  { ms, fail = false, signal, speed = 1 }: OrderOptions,
): Promise<Order> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      if (fail) reject(new Error(`${item} burnt! 🔥`));
      else resolve({ item, readyAt: Date.now() });
    }, ms / speed);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
