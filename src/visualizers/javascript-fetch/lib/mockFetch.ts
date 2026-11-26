/**
 * A drop-in for `fetch` that talks to MockServer instead of the network.
 * Same signature, same behaviour:
 * - it resolves with a REAL `Response` (so res.ok, res.status, res.headers,
 *   res.json(), res.text() and the "body can only be read once" rule all
 *   behave exactly like the real thing), even for 404 and 500;
 * - failMode "network" → it REJECTS with TypeError("Failed to fetch");
 * - it respects `signal`: an abort rejects with the signal's reason
 *   (AbortError, or TimeoutError for AbortSignal.timeout) and clears the timer;
 * - with controls.bodyMs > 0, the headers arrive first and the body streams in
 *   later, so `await res.json()` really waits (the "two awaits").
 * Every request and response is written to server.log for the inspectors.
 */
import { HOST, MockServer, type LogEntry } from './mockServer';

export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

let nextLogId = 1;

const abortReason = (signal: AbortSignal): unknown =>
  signal.reason ?? new DOMException('This operation was aborted', 'AbortError');

/** Wait `ms`, unless the signal aborts first (then reject with its reason). */
function wait(ms: number, signal?: AbortSignal | null) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(abortReason(signal));
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortReason(signal!));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export function createMockFetch(server: MockServer): FetchLike {
  return async function mockFetch(input, init = {}) {
    const url = new URL(String(input));
    const method = (init.method ?? 'GET').toUpperCase();
    const headers = new Headers(init.headers);
    const body =
      typeof init.body === 'string' ? init.body : init.body == null ? null : String(init.body);
    const signal = init.signal;
    const entry: LogEntry = {
      id: nextLogId++,
      method,
      url: url.href,
      path: url.pathname + url.search,
      requestHeaders: [...headers.entries()],
      requestBody: body,
      startedAt: Date.now(),
    };
    server.log = [entry, ...server.log].slice(0, 50);
    server.emit();
    const finish = (patch: Partial<LogEntry>) => {
      Object.assign(entry, patch, { ms: Date.now() - entry.startedAt });
      server.log = [...server.log];
      server.emit();
    };

    const total = server.latency();
    const bodyMs = Math.min(server.controls.bodyMs, total);
    try {
      if (url.host !== HOST || server.controls.failMode === 'network') {
        // The request never gets an answer: it breaks on the way.
        await wait(total / 2, signal);
        throw new TypeError('Failed to fetch');
      }
      await wait(total - bodyMs, signal); // until the headers arrive
    } catch (e) {
      const name = (e as Error).name;
      finish({ outcome: name === 'TypeError' ? 'network' : 'aborted', errorName: name });
      throw e;
    }

    const reply = server.handle(method, url, body);
    finish({
      outcome: 'response',
      status: reply.status,
      statusText: reply.statusText,
      responseHeaders: Object.entries(reply.headers),
      responseBody: reply.body,
    });

    let responseBody: BodyInit | null = reply.body;
    // (Only JSON bodies stream in slowly: an HTML error page arrives at once, so the
    // browser's SyntaxError reads exactly as it would with a real server.)
    if (reply.body !== null && bodyMs > 0 && reply.headers['content-type']?.includes('json')) {
      // Headers now; the body trickles in over bodyMs (abortable, like a real download).
      const text = reply.body;
      responseBody = new ReadableStream<Uint8Array>({
        start(controller) {
          const t = setTimeout(() => {
            controller.enqueue(new TextEncoder().encode(text));
            controller.close();
          }, bodyMs);
          signal?.addEventListener(
            'abort',
            () => {
              clearTimeout(t);
              try {
                controller.error(abortReason(signal));
              } catch {
                /* already closed */
              }
            },
            { once: true },
          );
        },
      });
    }
    return new Response(responseBody, {
      status: reply.status,
      statusText: reply.statusText,
      headers: reply.headers,
    });
  };
}

/** A ready-made server and fetch, for the owner's Snack Explorer. */
export const defaultServer = new MockServer();
export const mockFetch = createMockFetch(defaultServer);
