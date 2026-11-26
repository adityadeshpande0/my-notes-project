import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CodeView } from '../core/code';
import { EventLog, useEventLog } from '../core/events';
import { JsonTree } from '../core/json';
import { create, getAll, getOne, remove, send, update, type Plan } from './lib/crudRequests';
import { createMockFetch } from './lib/mockFetch';
import { MockServer, type Snack } from './lib/mockServer';

/**
 * #3 Create, Read, Update, Delete against the pretend server. Each card
 * builds a request PLAN (lib/crudRequests.ts); the same plan is shown as code
 * and sent, so they always match. The table is the server's real database,
 * re-read after every response.
 *
 * React idea: derived highlights. We keep the previous table and the new one
 * in state and work out what changed (added, changed cells, removed) while
 * rendering, instead of storing "which row is green" by hand.
 */
type Action = 'all' | 'one' | 'create' | 'update' | 'delete';
interface Shown {
  plan: Plan;
  status: number;
  statusText: string;
  body: unknown;
  /** No body at all (204). */
  empty: boolean;
  ms: number;
  res: Response;
}
const EXPLAIN: Record<number, string> = {
  200: '200 OK: it worked, and here’s the data.',
  201: '201 Created: the server made a new snack and sent it back with its new id.',
  204: '204 No Content: it was deleted, and there’s no body at all.',
  400: '400 Bad Request: the server didn’t accept what you sent.',
  404: '404 Not Found: no snack with that id. fetch still resolved: check response.ok!',
};
const EMOJIS = ['🥮', '🍪', '🧁', '🍩', '🥤', '🍧'];

export default function CrudPlayground() {
  const server = useMemo(() => new MockServer({ latencyMs: 350 }), []);
  const fetchFn = useMemo(() => createMockFetch(server), [server]);
  const [rows, setRows] = useState<Snack[]>(() => server.db.map((s) => ({ ...s })));
  const [before, setBefore] = useState<Snack[]>(rows);
  const [read, setRead] = useState<number[]>([]);
  const [shown, setShown] = useState<Shown | null>(null);
  const [busy, setBusy] = useState(false);
  const [twice, setTwice] = useState('');
  const log = useEventLog();
  const ctrl = useRef(new AbortController());
  useEffect(() => {
    const c = ctrl.current;
    return () => c.abort();
  }, []);

  // Inputs for each card.
  const [category, setCategory] = useState<'all' | 'drink' | 'snack'>('all');
  const [oneId, setOneId] = useState(3);
  const [form, setForm] = useState({
    name: 'Kachori',
    emoji: '🥮',
    price: '25',
    category: 'snack' as 'drink' | 'snack',
  });
  const [updId, setUpdId] = useState(3);
  const [updPrice, setUpdPrice] = useState('28');
  const [updName, setUpdName] = useState('');
  const [put, setPut] = useState(false);
  const [delId, setDelId] = useState(5);

  const changes: Record<string, unknown> = {};
  if (updPrice.trim() !== '') changes.price = Number(updPrice);
  if (updName.trim() !== '') changes.name = updName.trim();
  const plans: Record<Action, Plan> = {
    all: getAll(category),
    one: getOne(oneId),
    create: create(form),
    update: update(updId, changes, put ? 'PUT' : 'PATCH'),
    delete: remove(delId),
  };

  const run = async (action: Action) => {
    const plan = plans[action];
    setBusy(true);
    setTwice('');
    const t0 = performance.now();
    try {
      const res = await send(fetchFn, plan, ctrl.current.signal);
      // Parse only when there IS a body (204 has none).
      const empty = res.status === 204;
      const body = empty ? null : await res.clone().json();
      const ms = Math.round(performance.now() - t0);
      setShown({ plan, status: res.status, statusText: res.statusText, body, empty, ms, res });
      setBefore(rows);
      setRows(server.db.map((s) => ({ ...s })));
      // GET lights up the rows it read.
      setRead(
        res.ok && plan.method === 'GET'
          ? Array.isArray(body)
            ? body.map((s: Snack) => s.id)
            : [(body as Snack).id]
          : [],
      );
      log.push({
        type: plan.method,
        category: plan.method === 'GET' ? 'form' : plan.method === 'DELETE' ? 'key' : 'mouse',
        target: plan.url.replace('https://api.chaicorner.dev', ''),
        detail: `${res.status} ${res.statusText} · ${ms} ms`,
        tone: res.ok ? undefined : 'stopped',
      });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setShown(null);
    } finally {
      if (!ctrl.current.signal.aborted) setBusy(false);
    }
  };

  const tryJson = async () => {
    if (!shown) return;
    try {
      await shown.res.json();
      setTwice('It parsed?');
    } catch (e) {
      setTwice(`${(e as Error).name}: ${(e as Error).message}`);
    }
  };

  const reset = () => {
    server.reset();
    const fresh = server.db.map((s) => ({ ...s }));
    setRows(fresh);
    setBefore(fresh);
    setRead([]);
    setShown(null);
    setTwice('');
    log.clear();
  };

  // What changed between the last two pictures of the database.
  const oldById = new Map(before.map((s) => [s.id, s]));
  const newIds = new Set(rows.map((s) => s.id));
  const removed = before.filter((s) => !newIds.has(s.id));
  const priceMissing = shown?.status === 400 && shown.plan.method === 'POST';
  const ids = rows.map((s) => s.id);

  const idPicker = (value: number, set: (n: number) => void, label: string) => (
    <label className="fx-field">
      <span className="fx-label">{label}</span>
      <input
        className="fx-input fx-num"
        type="number"
        min={1}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
      />
    </label>
  );

  return (
    <div className="viz not-prose fx-crud">
      <p className="viz-title">Create, Read, Update, Delete</p>
      <p className="viz-sub">
        Each card shows the exact fetch it sends. Watch the server’s database change.
      </p>
      <div className="fx-crud-grid">
        <div className="fx-cards">
          <Card title="Read" tone="get">
            <div className="fx-row">
              <label className="fx-field">
                <span className="fx-label">Category</span>
                <select
                  className="fx-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as typeof category)}
                >
                  <option value="all">all</option>
                  <option value="drink">drink</option>
                  <option value="snack">snack</option>
                </select>
              </label>
              <button type="button" className="viz-btn" onClick={() => run('all')} disabled={busy}>
                Get all
              </button>
            </div>
            <CodeView
              label="Get all"
              lines={plans.all.code.split('\n').map((text) => ({ text }))}
            />
            <div className="fx-row">
              {idPicker(oneId, setOneId, 'id')}
              <button type="button" className="viz-btn" onClick={() => run('one')} disabled={busy}>
                Get one
              </button>
            </div>
            <CodeView
              label="Get one"
              lines={plans.one.code.split('\n').map((text) => ({ text }))}
            />
          </Card>
          <Card title="Create" tone="post">
            <div className="fx-row">
              <label className="fx-field fx-grow">
                <span className="fx-label">name</span>
                <input
                  className="fx-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label className="fx-field">
                <span className="fx-label">price</span>
                <input
                  className={`fx-input fx-num ${priceMissing ? 'is-bad' : ''}`}
                  value={form.price}
                  inputMode="numeric"
                  placeholder="(empty)"
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  aria-invalid={priceMissing || undefined}
                />
              </label>
              <label className="fx-field">
                <span className="fx-label">category</span>
                <select
                  className="fx-select"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as 'drink' | 'snack' })
                  }
                >
                  <option>snack</option>
                  <option>drink</option>
                </select>
              </label>
            </div>
            <div className="fx-row" role="radiogroup" aria-label="Emoji">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  role="radio"
                  aria-checked={form.emoji === em}
                  aria-pressed={form.emoji === em}
                  className="viz-btn fx-emoji"
                  onClick={() => setForm({ ...form, emoji: em })}
                >
                  {em}
                </button>
              ))}
              <button
                type="button"
                className="viz-btn"
                onClick={() => run('create')}
                disabled={busy}
              >
                POST it
              </button>
            </div>
            {priceMissing && (
              <p className="fx-bad fx-small">
                The server said: {(shown!.body as { error: string }).error}. Fill in the price.
              </p>
            )}
            <CodeView
              label="Create"
              lines={plans.create.code.split('\n').map((text) => ({ text }))}
            />
          </Card>
          <Card title="Update" tone="patch">
            <div className="fx-row">
              {idPicker(updId, setUpdId, 'id')}
              <label className="fx-field">
                <span className="fx-label">new price</span>
                <input
                  className="fx-input fx-num"
                  value={updPrice}
                  inputMode="numeric"
                  onChange={(e) => setUpdPrice(e.target.value)}
                />
              </label>
              <label className="fx-field fx-grow">
                <span className="fx-label">new name (optional)</span>
                <input
                  className="fx-input"
                  value={updName}
                  onChange={(e) => setUpdName(e.target.value)}
                />
              </label>
            </div>
            <div className="fx-row">
              <label className="fx-check">
                <input type="checkbox" checked={put} onChange={(e) => setPut(e.target.checked)} />
                Use PUT instead of PATCH
              </label>
              <button
                type="button"
                className="viz-btn"
                onClick={() => run('update')}
                disabled={busy || !Object.keys(changes).length}
              >
                {put ? 'PUT it' : 'PATCH it'}
              </button>
            </div>
            <p className="fx-small fx-muted">
              {put
                ? '⚠️ PUT REPLACES the whole snack with what you send. Fields you leave out disappear!'
                : 'PATCH sends only the fields you changed; the rest stay as they are.'}
            </p>
            <CodeView
              label="Update"
              lines={plans.update.code.split('\n').map((text) => ({ text }))}
            />
          </Card>
          <Card title="Delete" tone="delete">
            <div className="fx-row">
              {idPicker(delId, setDelId, 'id')}
              <button
                type="button"
                className="viz-btn"
                onClick={() => run('delete')}
                disabled={busy}
              >
                DELETE it
              </button>
            </div>
            <CodeView
              label="Delete"
              lines={plans.delete.code.split('\n').map((text) => ({ text }))}
            />
          </Card>
        </div>

        <div className="fx-stack">
          <div className="viz-panel">
            <div className="fx-row">
              <span className="viz-label" style={{ margin: 0 }}>
                🗄️ Server database ({rows.length} snacks)
              </span>
              <button type="button" className="viz-btn" onClick={reset}>
                ↺ Reset database
              </button>
            </div>
            <table className="fx-table">
              <thead>
                <tr>
                  <th scope="col">id</th>
                  <th scope="col">name</th>
                  <th scope="col">price</th>
                  <th scope="col">category</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const old = oldById.get(s.id);
                  const isNew = !old && before.length > 0 && shown?.plan.method === 'POST';
                  const cell = (k: 'name' | 'price' | 'category', label: string) => {
                    const changed = old && old[k] !== s[k];
                    return (
                      <td
                        data-label={label}
                        className={changed ? 'is-changed' : ''}
                        title={changed ? `${old![k] ?? '(gone)'} → ${s[k] ?? '(gone)'}` : undefined}
                      >
                        {k === 'name'
                          ? `${s.emoji ?? ''} ${s.name ?? '(gone)'}`
                          : k === 'price'
                            ? s.price === undefined
                              ? '(gone)'
                              : `₹${s.price}`
                            : (s.category ?? '(gone)')}
                        {changed && (
                          <span className="fx-was"> was {String(old![k] ?? '(gone)')}</span>
                        )}
                      </td>
                    );
                  };
                  return (
                    <tr
                      key={s.id}
                      className={`${isNew ? 'is-new' : ''} ${read.includes(s.id) ? 'is-read' : ''}`}
                    >
                      <td data-label="id">
                        {s.id}
                        {isNew && ' (new)'}
                      </td>
                      {cell('name', 'name')}
                      {cell('price', 'price')}
                      {cell('category', 'category')}
                    </tr>
                  );
                })}
                {removed.map((s) => (
                  <tr key={`gone-${s.id}`} className="is-gone">
                    <td data-label="id">{s.id}</td>
                    <td data-label="name">
                      {s.emoji} {s.name}
                    </td>
                    <td data-label="price">deleted</td>
                    <td data-label="category">✕</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="fx-small fx-muted">
              Ids in the table: {ids.join(', ')}. Mint = just read · green = new · amber = changed ·
              coral = deleted.
            </p>
          </div>

          {shown && (
            <div className="viz-panel fx-response-panel" aria-live="polite">
              <div className="fx-row">
                <span className={`fx-chip is-${shown.plan.method.toLowerCase()}`}>
                  {shown.plan.method}
                </span>
                <span className={`fx-status is-${Math.floor(shown.status / 100)}xx viz-mono`}>
                  {shown.status} {shown.statusText}
                </span>
                <span className="fx-small fx-muted">{shown.ms} ms</span>
              </div>
              <p className="fx-small">{EXPLAIN[shown.status] ?? ''}</p>
              {shown.empty ? (
                <>
                  <p className="fx-small fx-muted">(no body)</p>
                  <div className="fx-row">
                    <button type="button" className="viz-btn viz-mono" onClick={tryJson}>
                      Try await response.json() on this
                    </button>
                    {twice && (
                      <span className="fx-bad viz-mono fx-small" role="status">
                        {twice}
                      </span>
                    )}
                  </div>
                  {twice && (
                    <pre className="fx-snippet viz-mono">
                      {'if (response.status !== 204) data = await response.json();'}
                    </pre>
                  )}
                </>
              ) : (
                <JsonTree value={shown.body} label="Response body" />
              )}
            </div>
          )}
          <EventLog
            rows={log.rows}
            onClear={log.clear}
            label="Requests"
            height="9rem"
            empty="Send a request from a card."
          />
        </div>
      </div>
      <p className="fx-note">
        In this demo, fetch talks to a pretend server inside your browser. The code is exactly what
        you’d write for a real API.
      </p>
    </div>
  );
}

function Card({ title, tone, children }: { title: string; tone: string; children: ReactNode }) {
  return (
    <section className={`viz-panel fx-card is-${tone}`} aria-label={title}>
      <div className="viz-label">{title}</div>
      {children}
    </section>
  );
}
