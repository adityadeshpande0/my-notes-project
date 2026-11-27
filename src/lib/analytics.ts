/**
 * Analytics: one small door every part of the site goes through.
 *
 * Components call `track('quiz_completed', { score: 4, total: 5 })` and never
 * talk to PostHog directly. That keeps three promises:
 *
 *  1. Performance: posthog-js is ~60KB gzipped, so it is NOT in the first
 *     bundle. It is downloaded with a dynamic import() once the browser is idle.
 *     Events sent before it arrives wait in a small queue.
 *  2. It only runs when configured: no VITE_POSTHOG_KEY (local dev, tests,
 *     forks of this repo) means every call quietly does nothing.
 *  3. Privacy: no names, emails or accounts. Visitors stay anonymous
 *     (`person_profiles: 'identified_only'` and we never call identify), and
 *     "Do Not Track" is respected.
 *
 * Vercel Web Analytics is separate: the <Analytics /> component in main.tsx.
 */
import type { PostHog } from 'posthog-js';
import type { Track } from './types';

/**
 * Every custom event and its properties. Adding an event here first means a
 * typo in a name or a missing property is a TypeScript error, not a silent gap
 * in the dashboard. Page views are automatic and not listed.
 */
export interface AnalyticsEvents {
  /** A note page was opened. */
  note_viewed: { track: Track; slug: string; level: string; step?: number; group?: string };
  /** The reader scrolled to the "Continue the path" box at the end of a note. */
  note_finished: { track: Track; slug: string; seconds: number };
  /** A previous / next card at the end of a note was clicked. */
  path_nav_clicked: {
    track: Track;
    from: string;
    to: string;
    direction: 'prev' | 'next' | 'track';
  };
  /** A collection (track) page was opened. */
  track_viewed: { track: Track; read: number; total: number };
  /** Play was pressed on a step-through visual (the first press per visual is enough to know it was used). */
  visualizer_played: { steps: number };
  /** One self-check answer. `question` is the 1-based number. */
  quiz_answered: { question: number; correct: boolean };
  /** Every question in a self-check has an answer. */
  quiz_completed: { score: number; total: number };
  /** The light / dark switch. */
  theme_changed: { theme: 'light' | 'dark' };
  /** A code block's Copy button. */
  code_copied: { language: string };
  /** Every note in a collection has been opened. */
  course_completed: { track: Track; notes: number };
  /** A URL that matches no page. */
  page_not_found: { path: string };
}
export type AnalyticsEvent = keyof AnalyticsEvents;

const KEY = import.meta.env.VITE_POSTHOG_KEY;
// "/ingest" goes through our own domain (see the rewrites in vercel.json), so
// ad blockers that block posthog.com don't silently drop every event.
const HOST = import.meta.env.VITE_POSTHOG_HOST || '/ingest';
const UI_HOST = import.meta.env.VITE_POSTHOG_UI_HOST || 'https://us.posthog.com';

export const analyticsEnabled = Boolean(KEY) && import.meta.env.MODE !== 'test';

let client: PostHog | undefined;
let loading = false;
const queue: [string, Record<string, unknown>][] = [];

/** Load PostHog when the browser has a quiet moment. Called once from main.tsx. */
export function initAnalytics() {
  if (!analyticsEnabled || loading || typeof window === 'undefined') return;
  loading = true;
  const start = () => {
    import('posthog-js')
      .then(({ default: posthog }) => {
        posthog.init(KEY!, {
          api_host: HOST,
          ui_host: UI_HOST,
          defaults: '2026-08-30',
          // Page views on every route change (this is a single-page app, so
          // the URL changes without a full page load), and time on page.
          capture_pageview: 'history_change',
          capture_pageleave: true,
          // Clicks on links and buttons, for free.
          autocapture: true,
          // JavaScript errors readers hit, so we hear about bugs.
          capture_exceptions: true,
          person_profiles: 'identified_only',
          respect_dnt: true,
          // Recordings are heavy and personal; turn them on in PostHog only if needed.
          disable_session_recording: true,
          persistence: 'localStorage+cookie',
        });
        client = posthog;
        for (const [event, props] of queue.splice(0)) posthog.capture(event, props);
      })
      .catch(() => {
        // Blocked or offline: the site works the same without analytics.
        queue.length = 0;
      });
  };
  // requestIdleCallback isn't in every browser (Safari), so fall back to a timeout.
  if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 4000 });
  else setTimeout(start, 2000);
}

/** Record one event. Safe to call anywhere, any time: it never throws. */
export function track<E extends AnalyticsEvent>(event: E, props: AnalyticsEvents[E]) {
  if (!analyticsEnabled) return;
  const properties = props as unknown as Record<string, unknown>;
  try {
    if (client) client.capture(event, properties);
    else if (queue.length < 50) queue.push([event, properties]);
  } catch {
    /* analytics must never break the page */
  }
}
