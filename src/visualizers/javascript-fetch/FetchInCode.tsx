import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrayStrip } from '../core/array';
import { CodeView, Tabs } from '../core/code';
import { StepControls } from '../core/StepControls';
import { Token, type TokenState } from '../core/token';
import { useStepper } from '../core/useStepper';
import { createMockFetch } from './lib/mockFetch';
import { BASE, MockServer, type FailMode, type Snack } from './lib/mockServer';
import { createSearch, type RaceMode, type RaceState } from './lib/searchRace';

/**
 * #2 Inside the fetch code. Each tab runs REAL fetch code (against the
 * pretend server) and shows what happened.
 *
 * React idea: an effect's cleanup is where you cancel. Each tab keeps its
 * AbortController(s) in a ref and aborts them when the tab unmounts, the same
 * way a React component cancels its fetch in a useEffect cleanup (which is
 * also the fix for the race condition in the last tab).
 */
type TabId = 'awaits' | 'cancel' | 'race';

export default function FetchInCode() {
  return (
    <div className="viz not-prose fx-code-viz">
      <p className="viz-title">Inside the fetch code</p>
      <Tabs<TabId>
        label="Parts of this visual"
        twoUp
        tabs={[
          { id: 'awaits', name: 'The two awaits' },
          { id: 'cancel', name: 'Cancel & timeout' },
          { id: 'race', name: 'Race condition' },
        ]}
      >
        {(t) => (t === 'awaits' ? <AwaitsTab /> : t === 'cancel' ? <CancelTab /> : <RaceTab />)}
      </Tabs>
      <p className="fx-note">
        In this demo, fetch talks to a pretend server inside your browser. The code is exactly what
        you’d write for a real API.
      </p>
    </div>
  );
}

// ─── Tab: The two awaits ─────────────────────────────────────────────

const SHOW_SNACKS = [
  'async function showSnacks() {',
  '  showLoading();',
  '  try {',
  '    const response = await fetch("https://api.chaicorner.dev/snacks");',
  '    if (!response.ok) throw new Error(`Server said ${response.status}`);',
  '    const snacks = await response.json();',
  '    showList(snacks);',
  '  } catch (error) {',
  '    showError(error.message);',
  '  } finally {',
  '    hideLoading();',
  '  }',
  '}',
];
type Scenario = 'none' | '404' | '500' | 'network' | 'badJson' | 'slow';

/** One moment in the run, merged into a full picture of the state at that moment. */
interface Snap {
  line: number;
  note: string;
  ui: 'idle' | 'loading' | 'success' | 'error';
  token: TokenState;
  response?: { status: number; statusText: string; headers: [string, string][] };
  parcel: 'none' | 'sealed' | 'opening' | 'open' | 'broken';
  ok?: boolean;
  data?: Snack[];
  error?: string;
  loader: boolean;
  /** ms since the start: when the headers and the body arrived. */
  headersAt?: number;
  bodyAt?: number;
}
const START: Snap = { line: 1, note: '', ui: 'idle', token: 'idle', parcel: 'none', loader: false };

function AwaitsTab() {
  const [scenario, setScenario] = useState<Scenario>('none');
  const [run, setRun] = useState<{ id: number; snaps: Snap[]; done: boolean } | null>(null);
  const [twice, setTwice] = useState('');
  const ctrl = useRef<AbortController | null>(null);
  const kept = useRef<Response | null>(null);
  useEffect(() => () => ctrl.current?.abort(), []);

  const go = async () => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    kept.current = null;
    setTwice('');
    const failMode: FailMode =
      scenario === 'none' || scenario === '404' ? 'none' : (scenario as FailMode);
    // Headers after 700 ms, then the body takes another 700 ms to arrive.
    const fetchFn = createMockFetch(new MockServer({ latencyMs: 1400, bodyMs: 700, failMode }));
    const url = scenario === '404' ? `${BASE}/snacks/99` : `${BASE}/snacks`;
    const t0 = performance.now();
    const id = Date.now();
    const snaps: Snap[] = [];
    // Record one moment: a copy of the previous picture plus what changed.
    const rec = (patch: Partial<Snap>) => {
      if (c.signal.aborted) return;
      const prev = snaps.at(-1) ?? START;
      snaps.push({ ...prev, ...patch });
      setRun({ id, snaps: [...snaps], done: false });
    };
    // The article's showSnacks(), for real, with a note at each step.
    rec({
      line: 1,
      ui: 'loading',
      loader: true,
      note: 'showLoading(): the list shows a skeleton while we wait.',
    });
    try {
      rec({
        line: 3,
        token: 'pending',
        note: 'await fetch(…): the request is sent and this function pauses.',
      });
      const response = await fetchFn(url, { signal: c.signal });
      kept.current = response;
      rec({
        line: 3,
        token: 'fulfilled',
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: [...response.headers.entries()],
        },
        parcel: 'sealed',
        headersAt: Math.round(performance.now() - t0),
        note: 'The status and headers arrived: fetch resolved with a Response. The body is still a sealed parcel 📦.',
      });
      rec({
        line: 4,
        ok: response.ok,
        note: response.ok
          ? 'response.ok is true, so no throw.'
          : `response.ok is false (${response.status}), so we throw our own error.`,
      });
      if (!response.ok) throw new Error(`Server said ${response.status}`);
      rec({
        line: 5,
        parcel: 'opening',
        note: 'await response.json(): wait for the whole body, then parse it.',
      });
      try {
        const snacks = (await response.json()) as Snack[];
        rec({
          line: 5,
          parcel: 'open',
          data: snacks,
          bodyAt: Math.round(performance.now() - t0),
          note: 'The body arrived and was parsed into a JavaScript array.',
        });
        rec({ line: 6, ui: 'success', note: 'showList(snacks): the data is on screen.' });
      } catch (e) {
        rec({ line: 5, parcel: 'broken', bodyAt: Math.round(performance.now() - t0) });
        throw e;
      }
    } catch (e) {
      const err = e as Error;
      if (c.signal.aborted) return;
      rec({
        line: 8,
        ui: 'error',
        error: `${err.name}: ${err.message}`,
        token: snaps.at(-1)?.response ? 'fulfilled' : 'rejected',
        note: `Jumped to catch: ${err.name}: ${err.message}`,
      });
    } finally {
      rec({ line: 10, loader: false, note: 'finally: hide the loader, whatever happened.' });
      if (!c.signal.aborted) setRun({ id, snaps: [...snaps], done: true });
    }
  };

  const readTwice = async () => {
    if (!kept.current) return;
    try {
      await kept.current.json();
      setTwice('No error?');
    } catch (e) {
      // The real message from this browser.
      setTwice(`${(e as Error).name}: ${(e as Error).message}`);
    }
  };

  return (
    <>
      <div className="fx-row">
        <label className="fx-field">
          <span className="fx-label">Scenario</span>
          <select
            className="fx-select"
            value={scenario}
            onChange={(e) => setScenario(e.target.value as Scenario)}
          >
            <option value="none">everything works</option>
            <option value="404">404 (a wrong id)</option>
            <option value="500">500 server error</option>
            <option value="network">network failure</option>
            <option value="badJson">HTML instead of JSON</option>
            <option value="slow">slow (3 s more)</option>
          </select>
        </label>
        <button type="button" className="viz-btn viz-btn--primary" onClick={go}>
          ▶ Run showSnacks()
        </button>
      </div>
      {run ? (
        <AwaitsView key={`${run.id}-${run.done}`} snaps={run.snaps} done={run.done} onRetry={go} />
      ) : (
        <p className="fx-callout">
          Pick a scenario and run the code. Then step back through what happened.
        </p>
      )}
      {run?.done && run.snaps.at(-1)?.ui === 'success' && (
        <div className="fx-row fx-gap">
          <button type="button" className="viz-btn viz-mono" onClick={readTwice}>
            await response.json() again
          </button>
          {twice && (
            <span className="fx-bad viz-mono" role="status">
              {twice}
            </span>
          )}
        </div>
      )}
      {twice && <p className="fx-small">A response body can only be read once.</p>}
    </>
  );
}

function AwaitsView({
  snaps,
  done,
  onRetry,
}: {
  snaps: Snap[];
  done: boolean;
  onRetry: () => void;
}) {
  // While running, follow the latest moment; afterwards, step back through it.
  const s = useStepper(snaps.length, 1200, { startAtEnd: true });
  const snap = done ? snaps[s.index] : snaps.at(-1)!;
  const lines = SHOW_SNACKS.map((text, i) => ({
    text,
    state: i === snap.line ? ('on' as const) : undefined,
    badge:
      i === 4 && snap.ok !== undefined && snap.line >= 4
        ? {
            text: snap.ok ? 'ok ✓' : 'not ok ✗',
            tone: snap.ok ? ('yes' as const) : ('no' as const),
          }
        : undefined,
  }));
  return (
    <>
      <div className="fx-split fx-gap">
        <CodeView label="showSnacks()" lines={lines} />
        <div className="fx-stack">
          <div className="viz-panel fx-preview">
            <div className="fx-row">
              <span className="viz-label" style={{ margin: 0 }}>
                The app
              </span>
              <span className={`fx-badge is-${snap.ui}`}>
                {snap.ui === 'loading'
                  ? 'loading ⏳'
                  : snap.ui === 'success'
                    ? 'success ✅'
                    : snap.ui === 'error'
                      ? 'error ❌'
                      : 'idle'}
              </span>
            </div>
            {snap.ui === 'loading' && (
              <div className="fx-skeleton" aria-label="Loading">
                <span />
                <span />
                <span />
              </div>
            )}
            {snap.ui === 'success' && snap.data && (
              <ul className="fx-list">
                {snap.data.slice(0, 6).map((x) => (
                  <li key={x.id}>
                    {x.emoji} {x.name} <span className="fx-muted">₹{x.price}</span>
                  </li>
                ))}
                {snap.data.length > 6 && <li className="fx-muted">+{snap.data.length - 6} more</li>}
              </ul>
            )}
            {snap.ui === 'error' && (
              <div className="fx-error">
                <p>😕 Something went wrong</p>
                <p className="fx-small viz-mono">{snap.error}</p>
                <button type="button" className="viz-btn" onClick={onRetry}>
                  Retry
                </button>
              </div>
            )}
          </div>
          <div className="fx-row">
            <Token
              n="fetch"
              emoji="🌐"
              state={snap.token}
              size="sm"
              ms={snap.token === 'pending' ? 700 : undefined}
              label="The fetch promise"
              text={snap.response ? `Response ${snap.response.status}` : snap.error}
            />
            {snap.response && (
              <div className={`viz-panel fx-response is-${snap.parcel}`}>
                <div className="viz-label">Response</div>
                <p className="fx-small viz-mono">
                  status {snap.response.status} {snap.response.statusText} · ok{' '}
                  {String(snap.response.status >= 200 && snap.response.status < 300)}
                </p>
                <p className="fx-parcel">
                  {snap.parcel === 'sealed'
                    ? '📦 body: not read yet'
                    : snap.parcel === 'opening'
                      ? '📦 … reading the body'
                      : snap.parcel === 'open'
                        ? '📭 body: read and parsed'
                        : snap.parcel === 'broken'
                          ? '💥 body: not valid JSON'
                          : ''}
                </p>
              </div>
            )}
          </div>
          {snap.data && snap.parcel === 'open' && (
            <div>
              <div className="viz-label">snacks (an array, from the JSON)</div>
              <ArrayStrip
                size="sm"
                items={snap.data.slice(0, 5).map((x) => ({ id: String(x.id), label: x.emoji }))}
                ariaLabel="The snacks array"
              />
            </div>
          )}
          <ol className="fx-progress" aria-label="The response's progress">
            <li className={snap.headersAt !== undefined ? 'is-done' : ''}>
              headers received{snap.headersAt !== undefined && ` (${snap.headersAt} ms)`}
            </li>
            <li className={snap.bodyAt !== undefined ? 'is-done' : ''}>
              body downloaded{snap.bodyAt !== undefined && ` (${snap.bodyAt} ms)`}
            </li>
            <li
              className={
                snap.parcel === 'open' ? 'is-done' : snap.parcel === 'broken' ? 'is-bad' : ''
              }
            >
              parsed
            </li>
          </ol>
        </div>
      </div>
      <p className="viz-caption" aria-live="polite">
        {snap.note}
      </p>
      {done ? (
        <StepControls s={s} />
      ) : (
        <p className="fx-small fx-muted">
          Running the real code… (you can step back through it when it’s done)
        </p>
      )}
    </>
  );
}

// ─── Tab: Cancel & timeout ───────────────────────────────────────────

const CANCEL_CODE = [
  'const controller = new AbortController();',
  'try {',
  '  const response = await fetch(url, { signal: controller.signal });',
  '  showList(await response.json());',
  '} catch (error) {',
  '  if (error.name === "AbortError") return; // cancelled, not an error',
  '  showError(error.message);',
  '}',
  '// The Cancel button:',
  'cancelButton.onclick = () => controller.abort();',
];
const DEADLINE = 3000;

function CancelTab() {
  const [load, setLoad] = useState<{
    state: 'idle' | 'loading' | 'done' | 'cancelled';
    text?: string;
  }>({ state: 'idle' });
  const [latency, setLatency] = useState(2000);
  const [tm, setTm] = useState<{
    state: 'idle' | 'loading' | 'done' | 'timeout';
    at?: number;
    error?: string;
  }>({ state: 'idle' });
  const [now, setNow] = useState(0);
  const loadCtrl = useRef<AbortController | null>(null);
  const unmount = useRef(new AbortController());
  const frame = useRef(0);
  useEffect(() => {
    const u = unmount.current;
    return () => {
      loadCtrl.current?.abort();
      u.abort();
      cancelAnimationFrame(frame.current);
    };
  }, []);

  const startLoad = async () => {
    loadCtrl.current?.abort();
    const c = new AbortController();
    loadCtrl.current = c;
    setLoad({ state: 'loading' });
    const fetchFn = createMockFetch(new MockServer({ latencyMs: 4000 }));
    try {
      const response = await fetchFn(`${BASE}/snacks`, { signal: c.signal });
      const list = (await response.json()) as Snack[];
      setLoad({ state: 'done', text: `${list.length} snacks loaded` });
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        if (!unmount.current.signal.aborted)
          setLoad({ state: 'cancelled', text: `${(e as Error).name}: ${(e as Error).message}` });
        return; // cancelled, not an error
      }
      setLoad({ state: 'done', text: (e as Error).message });
    }
  };

  const startTimeout = async () => {
    cancelAnimationFrame(frame.current);
    setTm({ state: 'loading' });
    const t0 = performance.now();
    const tick = () => {
      setNow(performance.now() - t0);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    const fetchFn = createMockFetch(new MockServer({ latencyMs: latency }));
    // A real timeout signal; also cancelled if this tab closes (where AbortSignal.any exists).
    const timeout = AbortSignal.timeout(DEADLINE);
    const signal =
      'any' in AbortSignal ? AbortSignal.any([timeout, unmount.current.signal]) : timeout;
    try {
      await (await fetchFn(`${BASE}/snacks`, { signal })).json();
      if (!unmount.current.signal.aborted)
        setTm({ state: 'done', at: Math.round(performance.now() - t0) });
    } catch (e) {
      if (!unmount.current.signal.aborted)
        setTm({
          state: 'timeout',
          at: Math.round(performance.now() - t0),
          error: `${(e as Error).name}: ${(e as Error).message}`,
        });
    } finally {
      cancelAnimationFrame(frame.current);
    }
  };

  const span = Math.max(latency, DEADLINE) * 1.1;
  const shown = tm.state === 'loading' ? now : (tm.at ?? 0);
  return (
    <div className="fx-split">
      <div>
        <div className="viz-label">Cancel</div>
        <div className="fx-row">
          <button
            type="button"
            className="viz-btn viz-btn--primary"
            onClick={startLoad}
            disabled={load.state === 'loading'}
          >
            Load (4 s)
          </button>
          <button
            type="button"
            className="viz-btn"
            onClick={() => loadCtrl.current?.abort()}
            disabled={load.state !== 'loading'}
          >
            Cancel
          </button>
          <Token
            n="load"
            emoji="🌐"
            size="sm"
            label="The fetch promise"
            state={
              load.state === 'loading'
                ? 'pending'
                : load.state === 'cancelled'
                  ? 'rejected'
                  : load.state === 'done'
                    ? 'fulfilled'
                    : 'idle'
            }
            ms={4000}
            text={load.state === 'cancelled' ? 'AbortError' : load.text}
          />
        </div>
        <p className="fx-small" aria-live="polite">
          {load.state === 'cancelled'
            ? `Cancelled. (${load.text}) The app just stops: no scary error message.`
            : load.state === 'done'
              ? `✅ ${load.text}`
              : load.state === 'loading'
                ? 'Loading… press Cancel.'
                : ' '}
        </p>
        <CodeView
          label="Cancelling"
          lines={CANCEL_CODE.map((text, i) => ({
            text,
            state: load.state === 'cancelled' && (i === 5 || i === 9) ? ('on' as const) : undefined,
          }))}
        />
      </div>
      <div>
        <div className="viz-label">Timeout</div>
        <label className="fx-field">
          <span className="fx-label">The server takes {(latency / 1000).toFixed(1)} s</span>
          <input
            type="range"
            className="fx-range"
            min={500}
            max={6000}
            step={250}
            value={latency}
            onChange={(e) => setLatency(Number(e.target.value))}
          />
        </label>
        <div className="fx-row fx-gap">
          <button
            type="button"
            className="viz-btn viz-btn--primary"
            onClick={startTimeout}
            disabled={tm.state === 'loading'}
          >
            Load with a 3 s timeout
          </button>
        </div>
        <pre className="fx-snippet viz-mono">
          fetch(url, {'{'} signal: AbortSignal.timeout(3000) {'}'});
        </pre>
        <div className="fx-deadline" aria-hidden="true">
          <span
            className={`fx-deadline-bar is-${tm.state}`}
            style={{
              width: `${(Math.min(shown, tm.state === 'loading' ? span : shown) / span) * 100}%`,
            }}
          />
          <span className="fx-deadline-line" style={{ left: `${(DEADLINE / span) * 100}%` }}>
            3 s deadline
          </span>
          <span className="fx-deadline-server" style={{ left: `${(latency / span) * 100}%` }}>
            server replies
          </span>
        </div>
        <p className="fx-small" aria-live="polite">
          {tm.state === 'done'
            ? `✅ Loaded in ${(tm.at! / 1000).toFixed(1)} s, before the deadline.`
            : tm.state === 'timeout'
              ? `⏰ Gave up at ${(tm.at! / 1000).toFixed(1)} s: ${tm.error}`
              : tm.state === 'loading'
                ? 'Waiting…'
                : 'Under 3 s it loads; over 3 s it gives up with a TimeoutError.'}
        </p>
      </div>
    </div>
  );
}

// ─── Tab: Race condition ─────────────────────────────────────────────

const MODES: { id: RaceMode; name: string; code: string[] }[] = [
  {
    id: 'bug',
    name: '🐞 Every keystroke, no cancelling',
    code: [
      'input.addEventListener("input", async () => {',
      '  const res = await fetch(`/snacks?q=${input.value}`);',
      '  showList(await res.json()); // whichever arrives LAST wins',
      '});',
    ],
  },
  {
    id: 'abort',
    name: 'Fix 1: abort the previous request',
    code: [
      'let controller;',
      'input.addEventListener("input", async () => {',
      '  controller?.abort(); // cancel the old one',
      '  controller = new AbortController();',
      '  const res = await fetch(`/snacks?q=${input.value}`, { signal: controller.signal });',
      '  showList(await res.json());',
      '});',
    ],
  },
  {
    id: 'debounce',
    name: 'Fix 2: debounce + abort',
    code: [
      'const search = debounce(async (q) => {',
      '  controller?.abort();',
      '  controller = new AbortController();',
      '  …fetch and showList, as in fix 1',
      '}, 300);',
      'input.addEventListener("input", () => search(input.value));',
    ],
  },
];

function RaceTab() {
  const [mode, setMode] = useState<RaceMode>('bug');
  const [query, setQuery] = useState('');
  const [state, setState] = useState<RaceState>({ requests: [], shownFor: null, results: [] });
  const [now, setNow] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const typing = useRef<number[]>([]);
  // A fresh pretend server (with seeded random delays) and search for each mode and replay.
  const search = useMemo(() => {
    void epoch;
    const fetchFn = createMockFetch(new MockServer({ latencyMs: 200, jitter: 1500 }));
    return createSearch(fetchFn, mode, setState);
  }, [mode, epoch]);
  useEffect(() => () => search.dispose(), [search]);
  useEffect(() => () => typing.current.forEach(clearTimeout), []);
  // The replay's timers type into the LATEST search (a new one is made on restart).
  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  // The timeline's "now", while any request is still out.
  const pending = state.requests.some((r) => r.state === 'pending');
  useEffect(() => {
    if (!pending) return;
    const t0 = performance.now() - now;
    let f = 0;
    const tick = () => {
      setNow(performance.now() - t0);
      f = requestAnimationFrame(tick);
    };
    f = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(f);
  }, [pending]); // eslint-disable-line react-hooks/exhaustive-deps

  const restart = (m: RaceMode) => {
    typing.current.forEach(clearTimeout);
    setMode(m);
    setQuery('');
    setNow(0);
    setState({ requests: [], shownFor: null, results: [] });
    setEpoch((e) => e + 1);
  };
  const replay = () => {
    restart(mode);
    // Type "chai" one letter at a time, like a person would.
    ['c', 'ch', 'cha', 'chai'].forEach((q, i) =>
      typing.current.push(
        window.setTimeout(
          () => {
            setQuery(q);
            searchRef.current?.type(q);
          },
          150 + i * 130,
        ),
      ),
    );
  };
  const reqs = state.requests;
  const span = Math.max(2200, now, ...reqs.map((r) => r.end ?? 0)) * 1.05;
  const wrong = state.shownFor !== null && state.shownFor !== query.trim() && !pending;
  const sent = reqs.length;
  const cancelled = reqs.filter((r) => r.state === 'cancelled').length;
  const applied = reqs.filter((r) => r.state === 'applied').length;

  return (
    <>
      <div role="radiogroup" aria-label="How the search box fetches" className="fx-row">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={mode === m.id}
            aria-pressed={mode === m.id}
            className="viz-btn"
            onClick={() => restart(m.id)}
          >
            {m.name}
          </button>
        ))}
      </div>
      <div className="fx-split fx-gap">
        <div>
          <div className="fx-row">
            <input
              className="fx-input"
              value={query}
              placeholder="Search snacks"
              aria-label="Search snacks"
              onChange={(e) => {
                setQuery(e.target.value);
                search.type(e.target.value.trim());
              }}
            />
            <button type="button" className="viz-btn viz-btn--primary" onClick={replay}>
              ▶ Type “chai” for me
            </button>
          </div>
          <div className={`viz-panel fx-results ${wrong ? 'is-wrong' : ''}`} aria-live="polite">
            <div className="viz-label">
              Showing results for:{' '}
              <strong className="viz-mono">
                {state.shownFor === null ? '(nothing yet)' : `"${state.shownFor}"`}
              </strong>
            </div>
            {wrong && (
              <p className="fx-bad fx-small">
                ⚠️ The box says “{query}”, but the list shows results for “{state.shownFor}”! An
                old, slow response arrived last.
              </p>
            )}
            <ul className="fx-list">
              {state.results.slice(0, 6).map((x) => (
                <li key={x.id}>
                  {x.emoji} {x.name}
                </li>
              ))}
              {state.results.length > 6 && (
                <li className="fx-muted">+{state.results.length - 6} more</li>
              )}
            </ul>
          </div>
          <p className="fx-small">
            Requests sent: <strong>{sent}</strong> · cancelled: <strong>{cancelled}</strong> ·
            results applied: <strong>{applied}</strong>
          </p>
        </div>
        <CodeView
          label="The search code"
          lines={MODES.find((m) => m.id === mode)!.code.map((text) => ({ text }))}
        />
      </div>
      <div
        className="fx-race"
        role="img"
        aria-label={`Request timeline: ${reqs.map((r) => `"${r.q}" ${r.state}`).join(', ') || 'no requests yet'}`}
      >
        {reqs.length === 0 && (
          <p className="fx-small fx-muted">
            Each request will appear here as a bar, from when it was sent to when it finished.
          </p>
        )}
        {reqs.map((r) => {
          const end = r.end ?? now;
          return (
            <div key={r.id} className="fx-race-row">
              <span className="fx-race-q viz-mono">"{r.q}"</span>
              <div className="fx-race-track">
                <span
                  className={`fx-race-bar is-${r.state}`}
                  style={{
                    left: `${(r.start / span) * 100}%`,
                    width: `${(Math.max(0, end - r.start) / span) * 100}%`,
                  }}
                >
                  {r.state === 'cancelled' ? 'cancelled' : r.state === 'applied' ? 'applied' : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
