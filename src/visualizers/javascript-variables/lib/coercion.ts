/**
 * The Coercion Machine's rule engine. Plain TypeScript, no React.
 *
 * Given two values and an operator, it works out the answer the way the
 * JavaScript spec does (a simplified but correct subset), writing down each
 * step in plain English. coercion.test.ts checks every preset combination
 * against the real operator, and the component always shows the real result
 * too, so the machine can never show a wrong answer.
 */

export type Op = '+' | '-' | '*' | '==' | '===';
export const OPS: Op[] = ['+', '-', '*', '==', '==='];

/** Values the machine accepts. Arrays are only ever the empty array []. */
export type Val = string | number | boolean | null | undefined | unknown[];

export interface Explained {
  result: Val;
  steps: string[];
}

/** Write a value the way you'd type it in code. */
export function show(v: Val): string {
  if (Array.isArray(v)) return `[${v.map((x) => show(x as Val)).join(', ')}]`;
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'number' && Object.is(v, -0)) return '-0';
  return String(v);
}

export const typeName = (v: Val) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);

/** Arrays become primitives through toString(): [] → "", [1, 2] → "1,2". */
function toPrimitive(v: Val, steps: string[]): Exclude<Val, unknown[]> {
  if (!Array.isArray(v)) return v;
  const p = v.toString();
  steps.push(`An array isn't a primitive, so it becomes text: ${show(v)}.toString() is ${show(p)}`);
  return p;
}

function toNumber(v: Exclude<Val, unknown[]>, steps: string[]): number {
  const n = Number(v);
  if (typeof v !== 'number') steps.push(`Number(${show(v)}) is ${show(n)}`);
  return n;
}

function strictEquals(a: Val, b: Val, steps: string[]): boolean {
  if (typeName(a) !== typeName(b) && !(Array.isArray(a) || Array.isArray(b))) {
    steps.push(
      `The types differ (${typeName(a)} vs ${typeName(b)}), so === says false. No conversion.`,
    );
    return false;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    const same = a === b;
    steps.push(
      Array.isArray(a) && Array.isArray(b)
        ? `Two arrays are only equal if they are the SAME array (the same arrow). ${same ? 'They are.' : 'These are two different arrays.'}`
        : `The types differ (${typeName(a)} vs ${typeName(b)}), so === says false. No conversion.`,
    );
    return same;
  }
  if (typeof a === 'number' && Number.isNaN(a)) {
    steps.push('NaN is never equal to anything, not even NaN.');
    return false;
  }
  const same = a === b;
  steps.push(
    `Same type (${typeName(a)}). Compare the values: ${show(a)} and ${show(b)} are ${same ? 'equal' : 'different'}.`,
  );
  return same;
}

function looseEquals(a: Val, b: Val, steps: string[]): boolean {
  // Same type: == behaves exactly like ===.
  if (typeName(a) === typeName(b)) {
    steps.push('Same type on both sides, so == works just like ===.');
    return strictEquals(a, b, steps);
  }
  const isNullish = (v: Val) => v === null || v === undefined;
  if (isNullish(a) || isNullish(b)) {
    const both = isNullish(a) && isNullish(b);
    steps.push(
      both
        ? 'Special rule: null and undefined are == to each other, and to nothing else.'
        : `Special rule: ${isNullish(a) ? show(a) : show(b)} is only == to null or undefined. No conversion happens.`,
    );
    return both;
  }
  if (typeof a === 'boolean' || typeof b === 'boolean') {
    steps.push('A boolean is involved, so it is turned into a number first.');
    const na = typeof a === 'boolean' ? toNumber(a, steps) : a;
    const nb = typeof b === 'boolean' ? toNumber(b, steps) : b;
    return looseEquals(na, nb, steps);
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    return looseEquals(toPrimitive(a, steps), toPrimitive(b, steps), steps);
  }
  // Now it's string vs number.
  steps.push('A string and a number: the string is turned into a number.');
  const na = typeof a === 'string' ? toNumber(a, steps) : (a as number);
  const nb = typeof b === 'string' ? toNumber(b, steps) : (b as number);
  if (Number.isNaN(na) || Number.isNaN(nb)) {
    steps.push('One side became NaN, and NaN is never equal to anything.');
    return false;
  }
  const same = na === nb;
  steps.push(`Compare ${show(na)} and ${show(nb)}: ${same ? 'equal' : 'not equal'}.`);
  return same;
}

export function explain(a: Val, op: Op, b: Val): Explained {
  const steps: string[] = [];
  let result: Val;

  switch (op) {
    case '+': {
      const pa = toPrimitive(a, steps);
      const pb = toPrimitive(b, steps);
      if (typeof pa === 'string' || typeof pb === 'string') {
        steps.push('+ with a string on either side means "join text". Both sides become strings.');
        result = String(pa) + String(pb);
        steps.push(`${show(String(pa))} + ${show(String(pb))} is ${show(result)}`);
      } else {
        steps.push('No strings involved, so + does maths. Both sides become numbers.');
        const na = toNumber(pa, steps);
        const nb = toNumber(pb, steps);
        result = na + nb;
        steps.push(`${show(na)} + ${show(nb)} is ${show(result)}`);
      }
      break;
    }
    case '-':
    case '*': {
      steps.push(`${op} only works on numbers, so both sides become numbers.`);
      const na = toNumber(toPrimitive(a, steps), steps);
      const nb = toNumber(toPrimitive(b, steps), steps);
      result = op === '-' ? na - nb : na * nb;
      steps.push(`${show(na)} ${op} ${show(nb)} is ${show(result)}`);
      break;
    }
    case '===':
      result = strictEquals(a, b, steps);
      break;
    case '==':
      result = looseEquals(a, b, steps);
      break;
  }
  return { result, steps };
}

/** The real JavaScript answer, using the actual operator. */
export function realResult(a: Val, op: Op, b: Val): Val {
  // `any` on purpose: we want JavaScript's own behaviour for every type mix.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const x = a as any;
  const y = b as any;
  switch (op) {
    case '+':
      return x + y;
    case '-':
      return x - y;
    case '*':
      return x * y;
    case '==':
      return x == y;
    case '===':
      return x === y;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

/** The preset values in the machine's hoppers. `[]` makes a fresh array each time. */
export const PRESETS: { label: string; make: () => Val }[] = [
  { label: '5', make: () => 5 },
  { label: '"5"', make: () => '5' },
  { label: '"chai"', make: () => 'chai' },
  { label: 'true', make: () => true },
  { label: 'false', make: () => false },
  { label: 'null', make: () => null },
  { label: 'undefined', make: () => undefined },
  { label: '""', make: () => '' },
  { label: '0', make: () => 0 },
  { label: '[]', make: () => [] },
  { label: '"3"', make: () => '3' },
];
