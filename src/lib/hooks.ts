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

/** True while a CSS media query matches, e.g. `useMediaQuery('(min-width: 640px)')`. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
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

/**
 * Which heading the reader is currently in: the last one whose top has
 * scrolled past a line just under the sticky header.
 */
export function useActiveHeading(ids: string[], offset = 140): string | undefined {
  const [active, setActive] = useState<string>();
  useEffect(() => {
    if (ids.length === 0) return;
    let frame = 0;
    const update = () => {
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) current = id;
      }
      setActive(current);
    };
    // requestAnimationFrame batches scroll updates to at most once per frame.
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [ids, offset]);
  return active;
}

/**
 * Scroll reveal: elements matching `selector` inside `ref` fade up as they
 * scroll into view. Elements already on screen when the page opens are left
 * visible, so nothing flashes on first paint. Elements that arrive together
 * are staggered slightly so a row of cards ripples in instead of popping.
 *
 * Pass `deps` when the content inside `ref` can change (e.g. a lazy note
 * that loads later), so the hook looks for new elements.
 */
export function useReveal(
  ref: RefObject<Element | null>,
  selector = '[data-reveal]',
  deps: unknown[] = [],
) {
  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia(REDUCED).matches) return;

    const els = [...root.querySelectorAll<HTMLElement>(selector)].filter(
      // Skip anything that starts on screen (or above it).
      (el) => el.getBoundingClientRect().top > window.innerHeight,
    );

    const observer = new IntersectionObserver(
      (entries) => {
        let n = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.style.transitionDelay = `${Math.min(n++, 10) * 60}ms`;
          el.dataset.reveal = 'shown';
          observer.unobserve(el); // reveal once, then stop watching
        }
      },
      // Trigger a little before the element is fully in view.
      { rootMargin: '0px 0px -8% 0px' },
    );

    for (const el of els) {
      el.dataset.reveal = 'hidden';
      observer.observe(el);
    }
    return () => {
      observer.disconnect();
      // Never leave content hidden if this effect is torn down (e.g. navigation).
      for (const el of els) el.dataset.reveal = 'shown';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `deps` is the caller's list
  }, [ref, selector, ...deps]);
}
