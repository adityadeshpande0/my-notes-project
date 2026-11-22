/**
 * Write any value the way you'd type it in code, so the visuals can show
 * `"Guest"` (a string) apart from `50` (a number) and `null`.
 */
export function show(v: unknown): string {
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'number') return Object.is(v, -0) ? '-0' : String(v);
  if (typeof v === 'bigint') return `${v}n`;
  if (Array.isArray(v)) return v.length === 0 ? '[]' : `[${v.map(show).join(', ')}]`;
  if (typeof v === 'function') return 'ƒ()';
  if (v !== null && typeof v === 'object') {
    const keys = Object.keys(v);
    return keys.length === 0 ? '{}' : `{ ${keys.join(', ')} }`;
  }
  return String(v); // true, false, null, undefined, NaN, Infinity
}

/** The type name a beginner expects: like typeof, but null says "null". */
export const typeName = (v: unknown) =>
  v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;

/** "truthy" or "falsy", decided by JavaScript itself. */
export const truthiness = (v: unknown) => (v ? 'truthy' : 'falsy');
