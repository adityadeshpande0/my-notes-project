import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { create, getAll, getOne, remove, send, update } from './crudRequests';
import { createMockFetch } from './mockFetch';
import { BASE, MockServer } from './mockServer';
import { createSearch, type RaceState } from './searchRace';

const setup = (controls: Partial<MockServer['controls']> = {}) => {
  const server = new MockServer({ latencyMs: 100, ...controls });
  return { server, fetch: createMockFetch(server) };
};

describe('mockServer routes, through mockFetch (real Response objects)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  /** Run a request to completion under fake timers. */
  async function go(p: Promise<Response>) {
    await vi.advanceTimersByTimeAsync(10_000);
    return p;
  }

  it('GET /snacks, with search and category', async () => {
    const { fetch } = setup();
    const all = await go(fetch(`${BASE}/snacks`));
    expect(all).toBeInstanceOf(Response);
    expect(all.ok).toBe(true);
    expect(all.headers.get('content-type')).toContain('application/json');
    expect(await all.json()).toHaveLength(12);
    const params = new URLSearchParams({ q: 'chai', category: 'drink' });
    expect(params.toString()).toBe('q=chai&category=drink');
    const found = (await (await go(fetch(`${BASE}/snacks?${params}`))).json()) as {
      name: string;
    }[];
    expect(found.map((s) => s.name)).toEqual(['Masala Chai', 'Ginger Chai']);
  });

  it('201, 204, 400, 404, PATCH and PUT', async () => {
    const { fetch, server } = setup();
    const made = await go(
      send(fetch, create({ name: 'Kachori', emoji: '🥮', price: '25', category: 'snack' })),
    );
    expect(made.status).toBe(201);
    expect(await made.json()).toMatchObject({ id: 13, name: 'Kachori', price: 25 });

    const bad = await go(
      send(fetch, create({ name: 'Kachori', emoji: '🥮', price: '', category: 'snack' })),
    );
    expect(bad.status).toBe(400);
    expect(await bad.json()).toEqual({ error: 'price is required (a number)' });

    const patched = await go(send(fetch, update(3, { price: 28 })));
    expect(await patched.json()).toMatchObject({ id: 3, name: 'Vada Pav', price: 28 });

    const put = await go(send(fetch, update(3, { price: 30 }, 'PUT')));
    expect(await put.json()).toEqual({ id: 3, price: 30 }); // the other fields are gone

    const del = await go(send(fetch, remove(3)));
    expect(del.status).toBe(204);
    expect(del.body).toBeNull();
    // 204 has no body, so .json() throws a real SyntaxError.
    await expect(del.json()).rejects.toThrow(SyntaxError);

    const gone = await go(send(fetch, getOne(3)));
    expect(gone.status).toBe(404);
    expect(gone.ok).toBe(false); // fetch still RESOLVED
    expect(await gone.json()).toEqual({ error: 'Snack not found' });
    expect((await go(fetch(`${BASE}/sneaks`))).status).toBe(404);
    expect(server.db).toHaveLength(12);
  });

  it('every fail mode behaves like the real thing', async () => {
    const s500 = setup({ failMode: '500' });
    const r500 = await go(s500.fetch(`${BASE}/snacks`));
    expect([r500.status, r500.ok]).toEqual([500, false]);

    const net = setup({ failMode: 'network' });
    const p = net.fetch(`${BASE}/snacks`);
    const rejected = expect(p).rejects.toMatchObject({
      name: 'TypeError',
      message: 'Failed to fetch',
    });
    await vi.advanceTimersByTimeAsync(1000);
    await rejected;

    const html = setup({ failMode: 'badJson' });
    const r = await go(html.fetch(`${BASE}/snacks`));
    expect(r.ok).toBe(true);
    await expect(r.json()).rejects.toThrow(SyntaxError);

    const slow = setup({ failMode: 'slow' });
    let done = false;
    slow.fetch(`${BASE}/snacks`).then(() => (done = true));
    await vi.advanceTimersByTimeAsync(3000);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    expect(done).toBe(true);
  });

  it('a body can only be read once', async () => {
    const { fetch } = setup();
    const res = await go(fetch(`${BASE}/snacks/1`));
    await res.json();
    expect(res.bodyUsed).toBe(true);
    await expect(res.json()).rejects.toThrow(TypeError);
  });

  it('abort rejects with AbortError and clears the timer; headers can come before the body', async () => {
    const { fetch } = setup({ latencyMs: 1000 });
    const ctrl = new AbortController();
    const p = fetch(`${BASE}/snacks`, { signal: ctrl.signal });
    const check = expect(p).rejects.toMatchObject({ name: 'AbortError' });
    ctrl.abort();
    await check;
    expect(vi.getTimerCount()).toBe(0);

    const split = setup({ latencyMs: 1000, bodyMs: 400 });
    let headers = false;
    let body = false;
    const resP = split.fetch(`${BASE}/snacks`).then((res) => {
      headers = true;
      return res.json().then(() => (body = true));
    });
    await vi.advanceTimersByTimeAsync(600);
    expect([headers, body]).toEqual([true, false]);
    await vi.advanceTimersByTimeAsync(400);
    await resP;
    expect(body).toBe(true);
  });

  it('logs each request and response for the inspector', async () => {
    const { fetch, server } = setup();
    await go(send(fetch, create({ name: 'Kachori', emoji: '🥮', price: '25', category: 'snack' })));
    const [entry] = server.log;
    expect(entry).toMatchObject({
      method: 'POST',
      path: '/snacks',
      status: 201,
      outcome: 'response',
    });
    expect(entry.requestHeaders).toContainEqual(['content-type', 'application/json']);
    expect(JSON.parse(entry.requestBody!)).toMatchObject({ name: 'Kachori', price: 25 });
  });
});

describe('timeouts (real timers: AbortSignal.timeout runs on its own clock)', () => {
  it('rejects with a TimeoutError', async () => {
    const { fetch } = setup({ latencyMs: 300 });
    await expect(
      fetch(`${BASE}/snacks`, { signal: AbortSignal.timeout(30) }),
    ).rejects.toMatchObject({ name: 'TimeoutError' });
  });
});

describe('the CRUD code shown always matches the request sent', () => {
  it('for every action', () => {
    const plans = [
      getAll('all'),
      getAll('drink'),
      getOne(4),
      create({ name: 'Kachori', emoji: '🥮', price: '25', category: 'snack' }),
      update(4, { price: 70 }),
      update(4, { price: 70 }, 'PUT'),
      remove(4),
    ];
    for (const p of plans) {
      expect(p.code).toContain(`"${p.url}"`);
      if (p.method !== 'GET') expect(p.code).toContain(`method: "${p.method}"`);
      if (p.body) expect(p.code).toContain(`JSON.stringify(${JSON.stringify(p.body)})`);
      else expect(p.code).not.toContain('body:');
    }
  });
});

describe('the search race condition', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  async function typeChai(mode: 'bug' | 'abort' | 'debounce') {
    // Seeded jitter: "c" is the slowest request, so it lands last.
    const { fetch } = setup({ latencyMs: 200, jitter: 1500 });
    let last: RaceState | null = null;
    const search = createSearch(fetch, mode, (s) => (last = s));
    for (const q of ['c', 'ch', 'cha', 'chai']) {
      search.type(q);
      await vi.advanceTimersByTimeAsync(120);
    }
    await vi.advanceTimersByTimeAsync(5000);
    search.dispose();
    return last! as RaceState;
  }

  it('bug: an old response arrives last and overwrites the right results', async () => {
    const s = await typeChai('bug');
    expect(s.shownFor).toBe('c');
    expect(s.requests).toHaveLength(4);
  });

  it('fix 1 (abort) and fix 2 (debounce + abort) show results for the final query', async () => {
    const aborted = await typeChai('abort');
    expect(aborted.shownFor).toBe('chai');
    expect(aborted.results.every((r) => r.name!.toLowerCase().includes('chai'))).toBe(true);
    expect(aborted.requests.filter((r) => r.state === 'cancelled')).toHaveLength(3);
    const debounced = await typeChai('debounce');
    expect(debounced.shownFor).toBe('chai');
    expect(debounced.requests).toHaveLength(1); // fewer requests sent at all
  });
});
