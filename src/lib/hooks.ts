import { useEffect, useState, useSyncExternalStore, type RefObject } from 'react';

/*
 * useSyncExternalStore is React's tool for reading a value that lives *outside*
 * React (a media query, the tab's visibility) and re-rendering when it changes.
 * You give it: how to subscribe to changes, and how to read the current value.
 */

const REDUCED = '(prefers-reduced-motion: reduce)';

/** True when the user has asked their OS for less motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(REDUCED).matches,
  );
}

/** False while the browser tab is in the background. */
export function usePageVisible(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      document.addEventListener('visibilitychange', onChange);
      return () => document.removeEventListener('visibilitychange', onChange);
    },
    () => document.visibilityState === 'visible',
  );
}

/** True while the element is on screen. Used to pause animations nobody can see. */
export function useInView(ref: RefObject<Element | null>): boolean {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect(); // cleanup: stop observing when the component unmounts
  }, [ref]);
  return inView;
}
