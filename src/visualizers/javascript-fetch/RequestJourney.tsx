import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useReducedMotion } from '../../lib/hooks';
import { CodeView, Tabs } from '../core/code';
import { JsonTree } from '../core/json';
import { Token, type TokenState } from '../core/token';
import { createMockFetch } from './lib/mockFetch';
import { BASE, MockServer, type Controls, type FailMode, type LogEntry } from './lib/mockServer';

/**
 * #1 Request → Server → Response. Every packet, status, header and body
 * shown here comes from a real call to mockFetch, which answers with real
 * Response objects from a pretend server inside the browser (no network).
 *
 * React idea: useSyncExternalStore. The pretend server keeps its own log
 * outside React; this hook subscribes to it, so the inspector re-renders
 * whenever a request is logged, without copying the log into state by hand.
 */
type TabId = 'build' | 'verdicts';

export default function RequestJourney() {
  return (
    <div className="viz not-prose fx-journey-viz">
      <p className="viz-title">Request → Server → Response</p>
      <p className="viz-sub">
        Build a request, send it to the pretend Chai Corner API, and inspect what comes back.
      </p>
      <Tabs<TabId>
        label="Parts of this visual"
        tabs={[
          { id: 'build', name: 'Send a request' },
          { id: 'verdicts', name: 'What does fetch do?' },
        ]}
      >
        {(t) => (t === 'build' ? <BuildTab /> : <VerdictTab />)}
      </Tabs>
      <CheatCard />
      <p className="fx-note">
        In this demo, fetch talks to a pretend server inside your browser. The code is exactly what
        you’d write for a real API.
      </p>
    </div>
  );
}

/** One pretend server per visual, its fetch, and its log as React sees it. */
function useMockApi(controls: Partial<Controls>) {
  const server = useMemo(() => new MockServer(controls), []); // eslint-disable-line react-hooks/exhaustive-deps
  const fetchFn = useMemo(() => createMockFetch(server), [server]);
  const log = useSyncExternalStore(
    (fn) => server.subscribe(fn),
    () => server.log,
  );
  return { server, fetchFn, log };
}

// ─── Tab: Send a request ─────────────────────────────────────────────

const METHODS = ['GET', 'POST', 'PATCH', 'DELETE'] as const;
type Method = (typeof METHODS)[number];
const ENDPOINTS = ['/snacks', '/snacks/3', '/snacks/99', '/sneaks'];
const PARAMS: [string, string][] = [
  ['category', 'drink'],
  ['q', 'chai'],
];
const BODIES: Record<string, string> = {
  POST: '{\n  "name": "Kachori",\n  "emoji": "🥮",\n  "price": 25,\n  "category": "snack"\n}',
  PATCH: '{\n  "price": 28\n}',
};
type Phase = 'idle' | 'out' | 'server' | 'back' | 'done' | 'broken';
type Result =
  | { kind: 'response'; status: number; statusText: string; size: number; text: string }
  | { kind: 'error'; name: string; message: string };

function BuildTab() {
  const reduced = useReducedMotion();
  const [method, setMethod] = useState<Method>('GET');
  const [endpoint, setEndpoint] = useState('/snacks/3');
  const [params, setParams] = useState<Record<string, boolean>>({});
  const [auth, setAuth] = useState(false);
  const [body, setBody] = useState(BODIES.POST);
  const [latency, setLatency] = useState(900);
  const [failMode, setFailMode] = useState<FailMode>('none');
  const [animate, setAnimate] = useState(true);
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<Result | null>(null);
  const [sent, setSent] = useState<{ method: string; path: string } | null>(null);
  const { server, fetchFn, log } = useMockApi({ latencyMs: 900 });
  const ctrl = useRef<AbortController | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(
    () => () => {
      ctrl.current?.abort();
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const hasBody = method === 'POST' || method === 'PATCH';
  // The query string, built safely with URLSearchParams.
  const query = new URLSearchParams(PARAMS.filter(([k]) => params[k])).toString();
  const url = `${BASE}${endpoint}${query ? `?${query}` : ''}`;
  const headers: [string, string][] = [
    ...(hasBody ? [['Content-Type', 'application/json'] as [string, string]] : []),
    ...(auth ? [['Authorization', 'Bearer demo-token'] as [string, string]] : []),
  ];
  let bodyError = '';
  if (hasBody) {
    try {
      JSON.parse(body);
    } catch (e) {
      bodyError = (e as Error).message;
    }
  }
  const moving = animate && !reduced;

  const sendIt = async () => {
    ctrl.current?.abort();
    timers.current.forEach(clearTimeout);
    const c = new AbortController();
    ctrl.current = c;
    server.setControls({ latencyMs: latency, failMode });
    setResult(null);
    setSent({ method, path: endpoint + (query ? `?${query}` : '') });
    setPhase('out');
    // The packet reaches the server after its trip (or straight away without animation).
    timers.current.push(
      window.setTimeout(() => setPhase((p) => (p === 'out' ? 'server' : p)), moving ? 700 : 0),
    );
    try {
      const res = await fetchFn(url, {
        method,
        headers: Object.fromEntries(headers),
        body: hasBody ? body : undefined,
        signal: c.signal,
      });
      const text = await res.text();
      if (c.signal.aborted) return;
      setResult({
        kind: 'response',
        status: res.status,
        statusText: res.statusText,
        size: new Blob([text]).size,
        text,
      });
      setPhase('back');
      timers.current.push(window.setTimeout(() => setPhase('done'), moving ? 750 : 0));
    } catch (e) {
      if (c.signal.aborted) return;
      setResult({ kind: 'error', name: (e as Error).name, message: (e as Error).message });
      setPhase('broken');
    }
  };

  const statusClass =
    result?.kind === 'response' ? `is-${Math.floor(result.status / 100)}xx` : 'is-error';
  const entry = log[0];

  return (
    <>
      <div className="fx-builder">
        <div className="fx-row">
          <label className="fx-field">
            <span className="fx-label">Method</span>
            <select
              className={`fx-select fx-method is-${method.toLowerCase()}`}
              value={method}
              onChange={(e) => {
                const m = e.target.value as Method;
                setMethod(m);
                if (BODIES[m]) setBody(BODIES[m]);
              }}
            >
              {METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="fx-field fx-grow">
            <span className="fx-label">Endpoint</span>
            <select
              className="fx-select viz-mono"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            >
              {ENDPOINTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                  {p === '/sneaks' ? '  (a typo!)' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="fx-row">
          <span className="fx-label">Query</span>
          {PARAMS.map(([k, v]) => (
            <label key={k} className="fx-check viz-mono">
              <input
                type="checkbox"
                checked={!!params[k]}
                onChange={(e) => setParams((p) => ({ ...p, [k]: e.target.checked }))}
              />
              {k}={v}
            </label>
          ))}
          <label className="fx-check">
            <input type="checkbox" checked={auth} onChange={(e) => setAuth(e.target.checked)} />
            Authorization header
          </label>
        </div>
        <p className="fx-url viz-mono" aria-label="The full URL">
          <span className={`fx-chip is-${method.toLowerCase()}`}>{method}</span> {BASE}
          <strong>{endpoint}</strong>
          {query && <span className="fx-query">?{query}</span>}
        </p>
        {hasBody && (
          <label className="fx-field">
            <span className="fx-label">
              Body (JSON){' '}
              {bodyError ? (
                <span className="fx-bad">✗ {bodyError}</span>
              ) : (
                <span className="fx-good">✓ valid JSON</span>
              )}
            </span>
            <textarea
              className={`fx-body viz-mono ${bodyError ? 'is-bad' : ''}`}
              rows={hasBody && method === 'POST' ? 6 : 3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              spellCheck={false}
            />
          </label>
        )}
        <div className="fx-row">
          <label className="fx-field">
            <span className="fx-label">Server delay: {latency} ms</span>
            <input
              type="range"
              className="fx-range"
              min={0}
              max={4000}
              step={100}
              value={latency}
              onChange={(e) => setLatency(Number(e.target.value))}
            />
          </label>
          <label className="fx-field">
            <span className="fx-label">Make it fail</span>
            <select
              className="fx-select"
              value={failMode}
              onChange={(e) => setFailMode(e.target.value as FailMode)}
            >
              <option value="none">no</option>
              <option value="500">500 server error</option>
              <option value="network">🔌 network failure</option>
              <option value="badJson">HTML instead of JSON</option>
            </select>
          </label>
          {!reduced && (
            <label className="fx-check">
              <input
                type="checkbox"
                checked={animate}
                onChange={(e) => setAnimate(e.target.checked)}
              />
              Animate
            </label>
          )}
          <button
            type="button"
            className="viz-btn viz-btn--primary"
            onClick={sendIt}
            disabled={!!bodyError}
          >
            Send ▶
          </button>
        </div>
      </div>

      <div
        className={`fx-journey is-${phase} ${moving ? 'is-moving' : 'is-static'}`}
        aria-live="polite"
      >
        <div className="fx-end">
          <span aria-hidden="true">💻</span> Your app
        </div>
        <div className="fx-path">
          <span className="fx-cloud" aria-hidden="true">
            ☁️ the internet
          </span>
          {sent && phase !== 'idle' && (
            <span className={`fx-packet is-req is-${sent.method.toLowerCase()}`}>
              ✉️ {sent.method} {sent.path}
            </span>
          )}
          {result?.kind === 'response' && (
            <span className={`fx-packet is-res ${statusClass}`}>
              {result.status} {result.statusText} · {result.size} B
            </span>
          )}
          {phase === 'broken' && (
            <span className="fx-boom" role="img" aria-label="The request broke on the way">
              💥
            </span>
          )}
        </div>
        <div className={`fx-end is-server ${phase === 'server' ? 'is-working' : ''}`}>
          <span aria-hidden="true">🖥️</span> Chai Corner server{' '}
          <span className="fx-gear" aria-hidden="true">
            ⚙️
          </span>
          <span aria-hidden="true">🗄️</span>
        </div>
      </div>
      <p className="fx-small" aria-live="polite">
        {phase === 'idle'
          ? 'Press Send to make a real request to the pretend server.'
          : phase === 'out' || phase === 'server'
            ? `Waiting for the server… (${latency} ms)`
            : phase === 'broken'
              ? `No response at all: fetch rejected with ${result?.kind === 'error' ? `${result.name}: ${result.message}` : 'an error'}.`
              : result?.kind === 'response'
                ? `${result.status} ${result.statusText}, ${result.size} bytes.`
                : ''}
      </p>
      <Inspector entry={entry} />
    </>
  );
}

/** JSON.parse, or undefined if it isn't JSON (e.g. an HTML error page). */
function tryJson(text: string | null | undefined): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Like DevTools → Network: the request and the response, from the server's log. */
function Inspector({ entry }: { entry?: LogEntry }) {
  const [tab, setTab] = useState<'req' | 'res'>('req');
  if (!entry) return null;
  const parsed = tryJson(entry.responseBody);
  const reqBody =
    entry.requestBody === null ? undefined : (tryJson(entry.requestBody) ?? entry.requestBody);
  const [path, search] = entry.url.split('?');
  return (
    <div className="viz-panel fx-inspector">
      <div role="tablist" aria-label="Inspector" className="fx-row">
        {(
          [
            ['req', 'Request'],
            ['res', 'Response'],
          ] as const
        ).map(([id, name]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className="viz-btn"
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {name}
          </button>
        ))}
        <span className="fx-small fx-muted">
          {entry.ms !== undefined ? `${entry.ms} ms` : 'in flight…'}
        </span>
      </div>
      {tab === 'req' ? (
        <dl className="fx-dl viz-mono">
          <dt>method</dt>
          <dd>{entry.method}</dd>
          <dt>url</dt>
          <dd>
            {path}
            {search && <span className="fx-query">?{search}</span>}
          </dd>
          <dt>headers</dt>
          <dd>
            {entry.requestHeaders.length
              ? entry.requestHeaders.map(([k, v]) => `${k}: ${v}`).join('\n')
              : '(none)'}
          </dd>
          <dt>body</dt>
          <dd>
            {reqBody === undefined ? (
              '(none)'
            ) : typeof reqBody === 'string' ? (
              reqBody
            ) : (
              <JsonTree value={reqBody} label="Request body" />
            )}
          </dd>
        </dl>
      ) : entry.outcome === 'response' ? (
        <dl className="fx-dl viz-mono">
          <dt>status</dt>
          <dd className={`is-${Math.floor(entry.status! / 100)}xx`}>
            {entry.status} {entry.statusText}
          </dd>
          <dt>headers</dt>
          <dd>
            {entry.responseHeaders?.length
              ? entry.responseHeaders.map(([k, v]) => `${k}: ${v}`).join('\n')
              : '(none)'}
          </dd>
          <dt>body</dt>
          <dd>
            {entry.responseBody === null ? (
              '(no body)'
            ) : parsed !== undefined ? (
              <JsonTree value={parsed} label="Response body" />
            ) : (
              entry.responseBody
            )}
          </dd>
        </dl>
      ) : (
        <p className="fx-small">
          {entry.outcome === undefined
            ? 'No response yet…'
            : `No response: the request failed with ${entry.errorName}.`}
        </p>
      )}
    </div>
  );
}

// ─── Tab: What does fetch do? ────────────────────────────────────────

interface Scenario {
  id: string;
  label: string;
  method: string;
  path: string;
  body?: Record<string, unknown>;
  controls?: Partial<Controls>;
}
const SCENARIOS: Scenario[] = [
  { id: '200', label: '200 OK', method: 'GET', path: '/snacks/2' },
  {
    id: '201',
    label: '201 Created',
    method: 'POST',
    path: '/snacks',
    body: { name: 'Kachori', price: 25 },
  },
  { id: '204', label: '204 No Content', method: 'DELETE', path: '/snacks/5' },
  { id: '404', label: '404 Not Found', method: 'GET', path: '/snacks/99' },
  {
    id: '400',
    label: '400 Bad Request',
    method: 'POST',
    path: '/snacks',
    body: { name: 'Kachori' },
  },
  {
    id: '500',
    label: '500 Server Error',
    method: 'GET',
    path: '/snacks',
    controls: { failMode: '500' },
  },
  {
    id: 'net',
    label: '🔌 Network failure',
    method: 'GET',
    path: '/snacks',
    controls: { failMode: 'network' },
  },
  {
    id: 'slow',
    label: '🐢 Slow (3 s)',
    method: 'GET',
    path: '/snacks/2',
    controls: { failMode: 'slow', latencyMs: 0 },
  },
];

interface Verdict {
  id: string;
  rejected: boolean;
  error?: string;
  status?: number;
  statusText?: string;
  ok?: boolean;
}

function VerdictTab() {
  const [running, setRunning] = useState<string | null>(null);
  const [v, setV] = useState<Verdict | null>(null);
  const ctrl = useRef<AbortController | null>(null);
  useEffect(() => () => ctrl.current?.abort(), []);
  const sc = SCENARIOS.find((s) => s.id === (running ?? v?.id)) ?? SCENARIOS[0];

  const run = async (s: Scenario) => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setRunning(s.id);
    setV(null);
    // A fresh pretend server for each scenario.
    const fetchFn = createMockFetch(new MockServer({ latencyMs: 500, ...s.controls }));
    try {
      const res = await fetchFn(`${BASE}${s.path}`, {
        method: s.method,
        headers: s.body ? { 'Content-Type': 'application/json' } : undefined,
        body: s.body ? JSON.stringify(s.body) : undefined,
        signal: c.signal,
      });
      if (!c.signal.aborted)
        setV({
          id: s.id,
          rejected: false,
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
        });
    } catch (e) {
      if (!c.signal.aborted)
        setV({ id: s.id, rejected: true, error: `${(e as Error).name}: ${(e as Error).message}` });
    } finally {
      if (!c.signal.aborted) setRunning(null);
    }
  };

  const tokenState: TokenState = running
    ? 'pending'
    : v
      ? v.rejected
        ? 'rejected'
        : 'fulfilled'
      : 'idle';
  const code = [
    'try {',
    `  const response = await fetch("${BASE}${sc.path}"${sc.method === 'GET' ? '' : `, { method: "${sc.method}"${sc.body ? ', … ' : ' '}}`});`,
    '  console.log(response.ok, response.status);',
    '} catch (error) {',
    '  console.log("fetch rejected:", error.name);',
    '}',
  ];
  return (
    <>
      <div className="fx-scenarios" role="group" aria-label="Scenarios">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            className="viz-btn"
            aria-pressed={(running ?? v?.id) === s.id}
            onClick={() => run(s)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="fx-split">
        <CodeView
          label="The code that ran"
          lines={code.map((text, i) => ({
            text,
            state:
              v && ((!v.rejected && i === 2) || (v.rejected && i === 4))
                ? ('on' as const)
                : undefined,
          }))}
        />
        <div className="fx-verdict" aria-live="polite">
          <Token
            n={sc.id}
            emoji="🌐"
            state={tokenState}
            text={v ? (v.rejected ? v.error : `Response ${v.status}`) : undefined}
            ms={running === 'slow' ? 3500 : running ? 500 : undefined}
            label="The fetch promise"
          />
          <div className="fx-badges">
            <span className={`fx-badge ${v ? (v.rejected ? 'is-bad' : 'is-good') : ''}`}>
              Did fetch reject?{' '}
              {v ? (v.rejected ? '❌ Yes, it rejected' : '✅ No, it resolved!') : '…'}
            </span>
            <span className={`fx-badge ${v && !v.rejected ? (v.ok ? 'is-good' : 'is-bad') : ''}`}>
              Is response.ok?{' '}
              {v
                ? v.rejected
                  ? 'no response at all'
                  : `${v.ok} (${v.status} ${v.statusText})`
                : '…'}
            </span>
          </div>
        </div>
      </div>
      <p className="fx-callout" aria-live="polite">
        {!v
          ? running
            ? 'Waiting for the pretend server…'
            : 'Pick a scenario. Each one runs a real fetch against the pretend server.'
          : v.rejected
            ? 'No answer came back at all, so the fetch promise rejected. This (and aborting) is the only time fetch throws.'
            : v.ok
              ? 'It worked: the promise resolved and response.ok is true.'
              : 'The server answered, so fetch resolved. It’s YOUR job to check response.ok.'}
      </p>
    </>
  );
}

// ─── The status code cheat-card ──────────────────────────────────────

const CODES: { cls: string; name: string; codes: [number, string][] }[] = [
  {
    cls: '2xx',
    name: '✅ Success',
    codes: [
      [200, 'OK: here’s what you asked for.'],
      [201, 'Created: the new thing was made (after a POST).'],
      [204, 'No Content: it worked, and there’s no body (often after a DELETE).'],
    ],
  },
  {
    cls: '3xx',
    name: '↪️ Redirect',
    codes: [[301, 'Moved Permanently: it lives at a new URL now; the browser follows it for you.']],
  },
  {
    cls: '4xx',
    name: '🙋 Client error (you)',
    codes: [
      [400, 'Bad Request: the server didn’t understand what you sent (a missing field, bad JSON).'],
      [401, 'Unauthorized: you need to log in (send a token).'],
      [403, 'Forbidden: you’re logged in, but not allowed to do this.'],
      [404, 'Not Found: there’s nothing at that URL (a wrong id, or a typo in the path).'],
      [429, 'Too Many Requests: slow down, you hit a rate limit. Debounce that search box!'],
    ],
  },
  {
    cls: '5xx',
    name: '🔥 Server error (them)',
    codes: [
      [500, 'Internal Server Error: the server broke while answering.'],
      [503, 'Service Unavailable: the server is down or overloaded; try again later.'],
    ],
  },
];

function CheatCard() {
  const [pick, setPick] = useState<[number, string]>([404, CODES[2].codes[3][1]]);
  return (
    <details className="fx-cheat">
      <summary>Status code cheat-card</summary>
      <div className="fx-cheat-grid">
        {CODES.map((c) => (
          <div key={c.cls} className={`fx-cheat-col is-${c.cls}`}>
            <span className="fx-label">
              {c.cls} {c.name}
            </span>
            <div className="fx-row">
              {c.codes.map(([code, text]) => (
                <button
                  key={code}
                  type="button"
                  className="viz-btn viz-mono"
                  aria-pressed={pick[0] === code}
                  onClick={() => setPick([code, text])}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="fx-callout" aria-live="polite">
        <strong className="viz-mono">{pick[0]}</strong> {pick[1]}
      </p>
    </details>
  );
}
