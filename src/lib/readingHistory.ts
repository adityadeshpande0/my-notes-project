/**
 * Reading history: which notes you've opened, and the last one in each
 * collection, so a learning path can say "continue where you left off".
 *
 * It lives only in this browser (localStorage). Nothing is sent anywhere.
 * Every read and write is wrapped in try/catch, because storage can be
 * blocked (private windows, strict settings) and the site must still work.
 */
import { useSyncExternalStore } from 'react';
import type { Track } from './types';

const KEY = 'stackscape-reading';

interface History {
  /** "javascript/what-is-javascript" for every note opened */
  visited: string[];
  /** The last note opened in each collection */
  last: Partial<Record<Track, string>>;
}

const EMPTY: History = { visited: [], last: {} };
const listeners = new Set<() => void>();

// A cached snapshot: useSyncExternalStore needs the *same object* back until
// something really changes, or it would re-render forever.
let cache: History | undefined;

function read(): History {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null') as History | null;
    cache = parsed && Array.isArray(parsed.visited) ? parsed : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

/** Remember that a note was opened. Called once when a note page mounts. */
export function markVisited(track: Track, slug: string) {
  const id = `${track}/${slug}`;
  const now = read();
  if (now.last[track] === slug && now.visited.includes(id)) return;
  cache = {
    visited: now.visited.includes(id) ? now.visited : [...now.visited, id],
    last: { ...now.last, [track]: slug },
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* storage blocked: keep it in memory for this visit */
  }
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** The reading history, kept up to date in every component that uses it. */
export function useReadingHistory(): History {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const wasVisited = (h: History, track: Track, slug: string) =>
  h.visited.includes(`${track}/${slug}`);
