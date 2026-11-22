/**
 * Comparison helpers for the balance scale (#2). Plain TypeScript, no React.
 * Results always come from the real operator; this file only explains them.
 */
import { applyBinary } from './evalSteps';
import { show, typeName } from './format';

export type CmpOp = '===' | '!==' | '==' | '>' | '<' | '>=' | '<=';
export const CMP_OPS: CmpOp[] = ['===', '!==', '==', '>', '<', '>=', '<='];

export const compare = (a: unknown, op: CmpOp, b: unknown) => applyBinary(op, a, b) as boolean;

/**
 * Where two strings first differ. `index` is the deciding position; when one
 * string runs out first (a prefix), `index` is the shorter length.
 */
export function decidingIndex(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/** Which way the scale tips: -1 left side is "bigger", 1 right is, 0 neither. */
export function tilt(a: unknown, b: unknown): -1 | 0 | 1 {
  if (compare(a, '>', b)) return -1;
  if (compare(a, '<', b)) return 1;
  return 0;
}

export interface Explanation {
  text: string;
  /** For two strings: the deciding position, to highlight. */
  strings?: { a: string; b: string; index: number };
}

const isRelational = (op: CmpOp) => op === '>' || op === '<' || op === '>=' || op === '<=';
const num = (v: unknown) => show(Number(v));

export function explain(a: unknown, op: CmpOp, b: unknown): Explanation {
  const ta = typeName(a);
  const tb = typeName(b);

  if (Number.isNaN(a) || Number.isNaN(b))
    return {
      text: 'NaN is never equal, bigger or smaller than anything, not even itself. So this is false (and !== is true).',
    };

  if (op === '===' || op === '!==') {
    if (ta !== tb)
      return {
        text: `Different types (${ta} vs ${tb}), so === is false immediately. No conversion happens.`,
      };
    return { text: `Same type (${ta}), so JavaScript just compares the values.` };
  }

  if (op === '==') {
    if (ta === tb) return { text: `Same type (${ta}), so == behaves just like ===.` };
    if ((a === null || a === undefined) && (b === null || b === undefined))
      return {
        text: 'A special rule: null and undefined are loosely equal to each other (and nothing else).',
      };
    if (a === null || a === undefined || b === null || b === undefined)
      return {
        text: `null and undefined are only == to each other, so ${show(a)} == ${show(b)} is false. No number conversion here.`,
      };
    return {
      text: `Different types, so == converts first: ${show(a)} becomes ${num(a)} and ${show(b)} becomes ${num(b)}. That’s why it surprises people. Prefer ===.`,
    };
  }

  // < > <= >=
  if (typeof a === 'string' && typeof b === 'string') {
    const index = decidingIndex(a, b);
    let text: string;
    if (index === a.length && index === b.length) text = 'Both strings are identical.';
    else if (index === a.length || index === b.length)
      text = `Compared alphabetically, character by character. ${show(index === a.length ? a : b)} runs out first, so it comes first.`;
    else {
      const ca = a[index];
      const cb = b[index];
      const first = ca < cb ? ca : cb;
      const second = ca < cb ? cb : ca;
      const caseNote =
        first.toLowerCase() === second.toLowerCase() ||
        (/[A-Z]/.test(first) && /[a-z]/.test(second))
          ? ' Uppercase letters come before lowercase ones.'
          : /\d/.test(first) && /\d/.test(second)
            ? ' As text, digits are compared one at a time, like in a dictionary.'
            : '';
      text = `Compared alphabetically, character by character: '${first}' (code ${first.charCodeAt(0)}) comes before '${second}' (code ${second.charCodeAt(0)}).${caseNote}`;
    }
    return { text, strings: { a, b, index } };
  }

  const parts: string[] = [];
  for (const v of [a, b]) {
    if (typeof v === 'number') continue;
    if (v === null) parts.push('null becomes 0');
    else if (v === undefined) parts.push('undefined becomes NaN');
    else if (typeof v === 'boolean') parts.push(`${v} becomes ${Number(v)}`);
    else parts.push(`the string ${show(v)} becomes the number ${num(v)}`);
  }
  if (parts.length === 0) return { text: 'Two numbers: compared the way you’d expect.' };
  const undefNote =
    a === undefined || b === undefined ? ' And NaN makes every comparison false.' : '';
  return {
    text: `${isRelational(op) ? 'To compare with < or >, both sides become numbers' : ''}: ${parts.join(' and ')}.${undefNote}`,
  };
}
