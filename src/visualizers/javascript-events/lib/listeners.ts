/**
 * A "bag" of event listeners. Every addEventListener goes through `add`,
 * which remembers the exact element, type, function and capture setting, so
 * `removeAll()` can take every one of them off again. The visuals call
 * removeAll() in their effect cleanup: on unmount and on Reset.
 *
 * That's the article's lesson in code: to remove a listener you need the
 * SAME function (and the same capture setting), so keep a reference to it.
 */
export interface ListenerBag {
  add: (
    target: EventTarget,
    type: string,
    fn: (e: Event) => void,
    options?: { capture?: boolean; once?: boolean },
  ) => void;
  /** Remove one (only if it's the same function and capture setting). */
  remove: (target: EventTarget, type: string, fn: (e: Event) => void, capture?: boolean) => void;
  removeAll: () => void;
  /** How many listeners are attached right now (once-listeners drop out after firing). */
  count: () => number;
}

interface Entry {
  target: EventTarget;
  type: string;
  fn: (e: Event) => void;
  real: (e: Event) => void;
  capture: boolean;
}

export function createListenerBag(): ListenerBag {
  let entries: Entry[] = [];
  const same = (e: Entry, t: EventTarget, type: string, fn: (e: Event) => void, capture: boolean) =>
    e.target === t && e.type === type && e.fn === fn && e.capture === capture;
  return {
    add(target, type, fn, options = {}) {
      const capture = !!options.capture;
      // The browser ignores an identical second add, so we don't count it either.
      if (entries.some((e) => same(e, target, type, fn, capture))) return;
      const entry: Entry = {
        target,
        type,
        fn,
        capture,
        real: options.once
          ? (ev) => {
              entries = entries.filter((x) => x !== entry); // the browser removes it after one run
              fn(ev);
            }
          : fn,
      };
      entries.push(entry);
      target.addEventListener(type, entry.real, { capture, once: options.once });
    },
    remove(target, type, fn, capture = false) {
      const entry = entries.find((e) => same(e, target, type, fn, capture));
      if (!entry) return; // a different function: nothing to remove (just like the browser)
      target.removeEventListener(type, entry.real, { capture });
      entries = entries.filter((e) => e !== entry);
    },
    removeAll() {
      for (const e of entries) e.target.removeEventListener(e.type, e.real, { capture: e.capture });
      entries = [];
    },
    count: () => entries.length,
  };
}
