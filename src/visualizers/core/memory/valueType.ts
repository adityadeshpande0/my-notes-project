/** The kinds of value a HeapCard row can colour. */
export type ValueType =
  'string' | 'number' | 'boolean' | 'null' | 'undefined' | 'object' | 'array' | 'function';

/** Guess a value's type from how it's written as code. */
export function typeOfCode(code: string): ValueType {
  if (code.startsWith('"') || code.startsWith("'")) return 'string';
  if (/^-?(\d|Infinity|NaN)/.test(code)) return 'number';
  if (code === 'true' || code === 'false') return 'boolean';
  if (code === 'null') return 'null';
  if (code === 'undefined') return 'undefined';
  if (code.startsWith('[')) return 'array';
  if (code.startsWith('ƒ') || code.includes('=>') || code.endsWith('()')) return 'function';
  return 'object';
}
