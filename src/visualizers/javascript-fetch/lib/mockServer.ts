/**
 * A pretend "Chai Corner API" that lives inside the browser. No network:
 * mockFetch (next door) hands requests to `handle()` here, after a pretend
 * delay. The data is kept in memory; `reset()` brings it back.
 *
 * Routes (base URL https://api.chaicorner.dev):
 *   GET    /snacks            ?q= (search by name)  ?category=drink|snack
 *   GET    /snacks/:id
 *   POST   /snacks            JSON body; name and price required → 201
 *   PATCH  /snacks/:id        partial update → 200
 *   PUT    /snacks/:id        full replacement (missing fields are GONE) → 200
 *   DELETE /snacks/:id        → 204 No Content (no body)
 *   unknown id → 404 { "error": "Snack not found" }, bad body → 400 { "error": … }
 */
export const BASE = 'https://api.chaicorner.dev';
export const HOST = 'api.chaicorner.dev';

export interface Snack {
  id: number;
  name?: string;
  emoji?: string;
  price?: number;
  category?: 'drink' | 'snack';
  veg?: boolean;
}

export type FailMode = 'none' | '500' | 'network' | 'slow' | 'badJson';

export interface Controls {
  /** Pretend round-trip time, in ms (0–4000). */
  latencyMs: number;
  failMode: FailMode;
  /** Random extra delay, up to this many ms (from a seeded sequence, so demos and tests repeat). */
  jitter: number;
  /** Part of the time spent sending the body after the headers arrive (ms). 0 = all at once. */
  bodyMs: number;
}

export interface Reply {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  /** null = no body at all (204). */
  body: string | null;
}

export const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  404: 'Not Found',
  405: 'Method Not Allowed',
  500: 'Internal Server Error',
};

const SEED: Snack[] = [
  { id: 1, name: 'Samosa', emoji: '🥟', price: 20, category: 'snack', veg: true },
  { id: 2, name: 'Masala Chai', emoji: '☕', price: 30, category: 'drink', veg: true },
  { id: 3, name: 'Vada Pav', emoji: '🍔', price: 25, category: 'snack', veg: true },
  { id: 4, name: 'Mango Lassi', emoji: '🥭', price: 60, category: 'drink', veg: true },
  { id: 5, name: 'Jalebi', emoji: '🍥', price: 40, category: 'snack', veg: true },
  { id: 6, name: 'Filter Coffee', emoji: '🫖', price: 35, category: 'drink', veg: true },
  { id: 7, name: 'Pani Puri', emoji: '🫓', price: 30, category: 'snack', veg: true },
  { id: 8, name: 'Nimbu Pani', emoji: '🍋', price: 25, category: 'drink', veg: true },
  { id: 9, name: 'Dhokla', emoji: '🟨', price: 35, category: 'snack', veg: true },
  { id: 10, name: 'Ginger Chai', emoji: '🍵', price: 30, category: 'drink', veg: true },
  { id: 11, name: 'Aloo Tikki', emoji: '🥔', price: 30, category: 'snack', veg: true },
  { id: 12, name: 'Coconut Water', emoji: '🥥', price: 45, category: 'drink', veg: true },
];

/** Jitter factors (0–1), used in order. Fixed, so the race demo is the same every time. */
export const JITTER_SEQUENCE = [1, 0.15, 0.7, 0.05, 0.5, 0.3, 0.9, 0.2, 0.6, 0.1];

export type LogEntry = {
  id: number;
  method: string;
  url: string;
  path: string;
  requestHeaders: [string, string][];
  requestBody: string | null;
  startedAt: number;
  /** Filled in when it ends. */
  ms?: number;
  outcome?: 'response' | 'network' | 'aborted';
  errorName?: string;
  status?: number;
  statusText?: string;
  responseHeaders?: [string, string][];
  responseBody?: string | null;
};

export class MockServer {
  controls: Controls = { latencyMs: 600, failMode: 'none', jitter: 0, bodyMs: 0 };
  db: Snack[] = [];
  nextId = 13;
  log: LogEntry[] = [];
  private jitterIndex = 0;
  private listeners = new Set<() => void>();

  constructor(controls: Partial<Controls> = {}) {
    this.reset();
    Object.assign(this.controls, controls);
  }

  /** Fresh data, empty log, jitter sequence from the start. */
  reset() {
    this.db = SEED.map((s) => ({ ...s }));
    this.nextId = 13;
    this.jitterIndex = 0;
    this.log = [];
    this.emit();
  }

  /** Change the latency / failure settings (the dev controls). */
  setControls(patch: Partial<Controls>) {
    Object.assign(this.controls, patch);
  }

  /** The delay for the next request. */
  latency(): number {
    const j = this.controls.jitter
      ? JITTER_SEQUENCE[this.jitterIndex++ % JITTER_SEQUENCE.length] * this.controls.jitter
      : 0;
    return this.controls.latencyMs + j + (this.controls.failMode === 'slow' ? 3000 : 0);
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  emit() {
    this.listeners.forEach((fn) => fn());
  }

  /** Answer one request. This is where the "database" changes. */
  handle(method: string, url: URL, body: string | null): Reply {
    if (this.controls.failMode === '500') return json(500, { error: 'Internal Server Error' });
    if (this.controls.failMode === 'badJson')
      return {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'text/html' },
        body: '<html>Server error page</html>',
      };

    const m = /^\/snacks(?:\/([^/]+))?\/?$/.exec(url.pathname);
    if (!m) return json(404, { error: `Not found: ${url.pathname}` });
    const idPart = m[1];

    if (idPart === undefined) {
      if (method === 'GET') {
        const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
        const cat = url.searchParams.get('category');
        return json(
          200,
          this.db.filter(
            (s) =>
              (!q || (s.name ?? '').toLowerCase().includes(q)) &&
              (!cat || cat === 'all' || s.category === cat),
          ),
        );
      }
      if (method === 'POST') {
        const data = parseBody(body);
        if (!data.ok) return json(400, { error: data.error });
        const v = data.value;
        if (typeof v.name !== 'string' || !v.name.trim())
          return json(400, { error: 'name is required' });
        if (typeof v.price !== 'number')
          return json(400, { error: 'price is required (a number)' });
        const snack: Snack = {
          id: this.nextId++,
          name: v.name.trim(),
          emoji: typeof v.emoji === 'string' ? v.emoji : '🍽️',
          price: v.price,
          category: v.category === 'drink' ? 'drink' : 'snack',
          veg: true,
        };
        this.db.push(snack);
        return json(201, snack, { location: `/snacks/${snack.id}` });
      }
      return json(405, { error: `${method} is not allowed on /snacks` });
    }

    const id = Number(idPart);
    const index = this.db.findIndex((s) => s.id === id);
    if (index < 0) return json(404, { error: 'Snack not found' });

    if (method === 'GET') return json(200, this.db[index]);
    if (method === 'DELETE') {
      this.db.splice(index, 1);
      return { status: 204, statusText: STATUS_TEXT[204], headers: {}, body: null };
    }
    if (method === 'PATCH' || method === 'PUT') {
      const data = parseBody(body);
      if (!data.ok) return json(400, { error: data.error });
      const fields = Object.fromEntries(
        Object.entries(data.value).filter(([k]) => k !== 'id'),
      ) as Partial<Snack>;
      // PATCH changes only the fields you send; PUT replaces the whole item with what you send.
      this.db[index] = method === 'PATCH' ? { ...this.db[index], ...fields } : { id, ...fields };
      return json(200, this.db[index]);
    }
    return json(405, { error: `${method} is not allowed on /snacks/${id}` });
  }
}

function json(status: number, value: unknown, headers: Record<string, string> = {}): Reply {
  return {
    status,
    statusText: STATUS_TEXT[status] ?? '',
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
    body: JSON.stringify(value),
  };
}

function parseBody(
  body: string | null,
): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  if (!body) return { ok: false, error: 'A JSON body is required' };
  try {
    const v: unknown = JSON.parse(body);
    if (!v || typeof v !== 'object' || Array.isArray(v))
      return { ok: false, error: 'The body must be a JSON object' };
    return { ok: true, value: v as Record<string, unknown> };
  } catch {
    return { ok: false, error: 'The body must be valid JSON' };
  }
}
