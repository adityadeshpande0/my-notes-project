import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce, throttle } from './rateLimit';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/** Call `f` every `gap` ms, `n` times, passing the call number. */
function burst(f: (i: number) => void, n: number, gap: number) {
  for (let i = 0; i < n; i++) {
    f(i);
    vi.advanceTimersByTime(gap);
  }
}

describe('debounce', () => {
  it('runs once, after the burst goes quiet, with the latest value', () => {
    const fn = vi.fn();
    const d = debounce(fn, 300);
    burst(d, 10, 50); // 10 calls, 50ms apart
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(9);
  });

  it('runs again for a second burst, and cancel() drops a planned call', () => {
    const fn = vi.fn();
    const d = debounce(fn, 300);
    d(1);
    vi.advanceTimersByTime(400);
    d(2);
    expect(d.pending()).toBe(true);
    d.cancel();
    vi.advanceTimersByTime(1000);
    expect(fn.mock.calls).toEqual([[1]]);
  });
});

describe('throttle', () => {
  it('runs at once, then at most once per interval, and keeps the last value', () => {
    const times: number[] = [];
    const values: number[] = [];
    const start = Date.now();
    const t = throttle((i: number) => {
      times.push(Date.now() - start);
      values.push(i);
    }, 300);
    burst(t, 20, 50); // 1 second of calls
    vi.advanceTimersByTime(1000);
    expect(times[0]).toBe(0); // leading call
    for (let k = 1; k < times.length; k++)
      expect(times[k] - times[k - 1]).toBeGreaterThanOrEqual(300);
    expect(values.at(-1)).toBe(19); // trailing call: the final value isn't lost
    expect(times.length).toBeLessThanOrEqual(Math.ceil(1000 / 300) + 1);
  });

  it('is ready again after a quiet interval, and cancel() stops the trailing call', () => {
    const fn = vi.fn();
    const states: string[] = [];
    const t = throttle(fn, 300, { onState: (s) => states.push(s) });
    t(1);
    t(2);
    t.cancel();
    vi.advanceTimersByTime(1000);
    expect(fn.mock.calls).toEqual([[1]]);
    t(3);
    vi.advanceTimersByTime(1000);
    expect(fn.mock.calls).toEqual([[1], [3]]);
    expect(states.at(-1)).toBe('ready');
  });
});
