/**
 * debounce and throttle: the two classic ways to calm down events that fire
 * very often (typing, scrolling). Both are a closure plus a timer.
 *
 * - debounce: wait until the calls stop for `delay` ms, then run once, with
 *   the latest arguments. The same code as in the article, plus `cancel`.
 * - throttle: run straight away (the "leading" call), then at most once per
 *   `interval`. If calls arrive while cooling down, the latest one runs when
 *   the interval ends (the "trailing" call), so the final value is never lost.
 *
 * `cancel()` clears any planned call: the visuals call it when they unmount,
 * so no timer outlives the component. The optional hooks only report what's
 * happening (for the "How it works" tab); they don't change the behaviour.
 */
export interface Limited<A extends unknown[]> {
  (...args: A): void;
  /** Forget any planned call. */
  cancel: () => void;
  /** Is a call planned (debounce) or cooling down (throttle)? */
  pending: () => boolean;
}

export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  delay: number,
  hooks: { onSchedule?: () => void; onClear?: () => void } = {},
): Limited<A> {
  let timer: ReturnType<typeof setTimeout> | undefined; // remembered by the closure 🎒
  const limited = (...args: A) => {
    if (timer !== undefined) {
      clearTimeout(timer); // cancel the previous plan
      hooks.onClear?.();
    }
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, delay); // plan again
    hooks.onSchedule?.();
  };
  limited.cancel = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  limited.pending = () => timer !== undefined;
  return limited;
}

export type ThrottleState = 'ready' | 'cooling';

export function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  interval: number,
  hooks: { onState?: (s: ThrottleState) => void } = {},
): Limited<A> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let trailing: A | null = null;
  const cool = () => {
    timer = setTimeout(() => {
      if (trailing) {
        // Calls came in while cooling down: run the latest one now.
        const args = trailing;
        trailing = null;
        fn(...args);
        cool();
      } else {
        timer = undefined;
        hooks.onState?.('ready');
      }
    }, interval);
  };
  const limited = (...args: A) => {
    if (timer === undefined) {
      fn(...args); // ready: run straight away
      hooks.onState?.('cooling');
      cool();
    } else trailing = args; // cooling down: remember only the latest
  };
  limited.cancel = () => {
    clearTimeout(timer);
    timer = undefined;
    trailing = null;
  };
  limited.pending = () => timer !== undefined;
  return limited;
}
