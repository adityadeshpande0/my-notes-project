/**
 * The search-box race condition, and two fixes. A search runs on every
 * keystroke; with random delays, an OLD request can finish LAST and
 * overwrite the right results.
 *
 * - bug:      apply whichever response arrives (last one wins, even if old)
 * - abort:    each new keystroke aborts the previous request
 * - debounce: wait for a pause (article #10's debounce), then abort + fetch
 *
 * Every request is recorded (for the timeline). searchRace.test.ts checks the
 * bug really happens and both fixes end with results for the final query.
 */
import { debounce } from '../../javascript-events/lib/rateLimit';
import type { FetchLike } from './mockFetch';
import { BASE, type Snack } from './mockServer';

export type RaceMode = 'bug' | 'abort' | 'debounce';

export interface RaceRequest {
  id: number;
  q: string;
  start: number;
  end?: number;
  state: 'pending' | 'applied' | 'cancelled' | 'ignored';
}

export interface RaceState {
  requests: RaceRequest[];
  /** The query whose results are showing, and those results. */
  shownFor: string | null;
  results: Snack[];
}

export function createSearch(
  fetchFn: FetchLike,
  mode: RaceMode,
  onChange: (s: RaceState) => void,
  { debounceMs = 300 }: { debounceMs?: number } = {},
) {
  const t0 = Date.now();
  const state: RaceState = { requests: [], shownFor: null, results: [] };
  let current: AbortController | null = null;
  let disposed = false;
  let nextId = 1;
  const emit = () =>
    !disposed && onChange({ ...state, requests: state.requests.map((r) => ({ ...r })) });

  const send = (q: string) => {
    if (mode !== 'bug') current?.abort(); // the fixes: cancel the previous request
    const ctrl = new AbortController();
    current = ctrl;
    const req: RaceRequest = { id: nextId++, q, start: Date.now() - t0, state: 'pending' };
    state.requests.push(req);
    emit();
    const params = new URLSearchParams({ q });
    fetchFn(`${BASE}/snacks?${params}`, { signal: ctrl.signal })
      .then((res) => res.json() as Promise<Snack[]>)
      .then(
        (items) => {
          req.end = Date.now() - t0;
          // In bug mode every response is applied, whenever it arrives.
          req.state = 'applied';
          state.shownFor = q;
          state.results = items;
          emit();
        },
        (e: Error) => {
          req.end = Date.now() - t0;
          req.state = e.name === 'AbortError' ? 'cancelled' : 'ignored';
          emit();
        },
      );
  };

  const debounced = debounce(send, debounceMs);
  return {
    /** The search box changed to `q`. */
    type(q: string) {
      if (mode === 'debounce') debounced(q);
      else send(q);
    },
    /** Stop everything: abort the request in flight and any planned one. */
    dispose() {
      disposed = true;
      debounced.cancel();
      current?.abort();
    },
  };
}
