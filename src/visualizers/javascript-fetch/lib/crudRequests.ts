/**
 * The CRUD playground's requests. Each action becomes ONE plan: the method,
 * URL and body, plus the exact code shown to the learner. The visual sends
 * the plan and shows its code, so the two can't disagree
 * (crudRequests.test.ts checks the code mentions exactly what's sent).
 */
import { BASE } from './mockServer';

export interface Plan {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  url: string;
  /** The JSON body, if any. */
  body?: Record<string, unknown>;
  code: string;
}

const fetchCode = (url: string, method: string, body?: Record<string, unknown>) => {
  if (method === 'GET' && !body) return `const response = await fetch("${url}");`;
  const lines = [`const response = await fetch("${url}", {`, `  method: "${method}",`];
  if (body)
    lines.push(
      '  headers: { "Content-Type": "application/json" },',
      `  body: JSON.stringify(${JSON.stringify(body)}),`,
    );
  lines.push('});');
  return lines.join('\n');
};

const plan = (method: Plan['method'], path: string, body?: Record<string, unknown>): Plan => {
  const url = `${BASE}${path}`;
  return { method, url, body, code: fetchCode(url, method, body) };
};

export function getAll(category: 'all' | 'drink' | 'snack'): Plan {
  return plan(
    'GET',
    category === 'all' ? '/snacks' : `/snacks?${new URLSearchParams({ category })}`,
  );
}
export const getOne = (id: number) => plan('GET', `/snacks/${id}`);
export function create(form: {
  name: string;
  emoji: string;
  price: string;
  category: 'drink' | 'snack';
}): Plan {
  const body: Record<string, unknown> = {
    name: form.name,
    emoji: form.emoji,
    category: form.category,
  };
  // A missing price is left out on purpose, so the server can say 400.
  if (form.price.trim() !== '') body.price = Number(form.price);
  return plan('POST', '/snacks', body);
}
/** PATCH sends only the fields you changed. PUT sends them too, but REPLACES the item with them. */
export function update(
  id: number,
  changes: Record<string, unknown>,
  method: 'PATCH' | 'PUT' = 'PATCH',
): Plan {
  return plan(method, `/snacks/${id}`, changes);
}
export const remove = (id: number) => plan('DELETE', `/snacks/${id}`);

/** Send a plan with any fetch-like function. */
export function send(
  fetchFn: (url: string, init?: RequestInit) => Promise<Response>,
  p: Plan,
  signal?: AbortSignal,
) {
  return fetchFn(p.url, {
    method: p.method,
    headers: p.body ? { 'Content-Type': 'application/json' } : undefined,
    body: p.body ? JSON.stringify(p.body) : undefined,
    signal,
  });
}
