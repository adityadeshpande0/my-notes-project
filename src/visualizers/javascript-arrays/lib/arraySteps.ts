/**
 * The engine behind "Arrays". Plain TypeScript, no React.
 *
 * Every result here comes from calling the REAL array method. To animate a
 * method step by step, we wrap the callback so that each time the real
 * method calls it, we write down what it was given and what it returned.
 * Those recorded calls ARE the steps: if find stops early, the record stops
 * early too. arraySteps.test.ts checks every result against the plain method.
 */

export const show = (v: unknown): string => {
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(show).join(', ')}]`;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if ('name' in o) return `{ ${o.emoji ?? ''} ${o.name} }`.replace('{  ', '{ ');
    return '{…}';
  }
  return String(v);
};

// ─── #1 The array shelf ───────────────────────────────────────────────

/** An item with a stable id, so the strip can animate it as it moves. */
export interface Song {
  id: string;
  value: string;
}

export const SONGS = [
  'Kesariya',
  'Tum Hi Ho',
  'Apna Bana Le',
  'Kun Faya Kun',
  'Raataan Lambiyan',
  'Ilahi',
];
export const MAX_SHELF = 8;

export type ShelfOp =
  | { kind: 'index'; i: number }
  | { kind: 'length' }
  | { kind: 'at' }
  | { kind: 'push'; v: string }
  | { kind: 'pop' }
  | { kind: 'unshift'; v: string }
  | { kind: 'shift' }
  | { kind: 'splice'; i: number }
  | { kind: 'set'; i: number; v: string }
  | { kind: 'includes'; v: string }
  | { kind: 'indexOf'; v: string };

export interface OpResult {
  items: Song[];
  code: string;
  returned: unknown;
  mutates: boolean;
  /** Items taken out (pop, shift, splice, or replaced by [i] =). */
  removed: Song[];
  /** Indexes to highlight (finds, reads). */
  hits: number[];
  /** True when a find came back empty-handed (-1 / false / undefined). */
  miss: boolean;
  note?: string;
}

/**
 * Run one operation for real. The array holds {id, value} objects so tiles
 * keep their identity; reads and finds run on the plain values.
 */
export function runShelfOp(items: Song[], op: ShelfOp, newId: string): OpResult {
  const arr = [...items];
  const values = items.map((s) => s.value);
  const base = { items: arr, removed: [] as Song[], hits: [] as number[], miss: false };
  switch (op.kind) {
    case 'index': {
      const r = values[op.i];
      return {
        ...base,
        code: `playlist[${op.i}]`,
        returned: r,
        mutates: false,
        hits: r === undefined ? [] : [op.i],
        miss: r === undefined,
        note: r === undefined ? 'No item there: you get undefined, not an error.' : undefined,
      };
    }
    case 'length':
      return { ...base, code: 'playlist.length', returned: values.length, mutates: false };
    case 'at': {
      const r = values.at(-1);
      return {
        ...base,
        code: 'playlist.at(-1)',
        returned: r,
        mutates: false,
        hits: r === undefined ? [] : [values.length - 1],
        note: 'at(-1) counts from the end: the last item.',
      };
    }
    case 'push': {
      const r = arr.push({ id: newId, value: op.v });
      return {
        ...base,
        code: `playlist.push(${show(op.v)})`,
        returned: r,
        mutates: true,
        hits: [arr.length - 1],
        note: 'push returns the new length!',
      };
    }
    case 'pop': {
      const r = arr.pop();
      return {
        ...base,
        code: 'playlist.pop()',
        returned: r?.value,
        mutates: true,
        removed: r ? [r] : [],
        note: r
          ? 'pop returns the item it removed.'
          : 'Nothing to remove: pop on an empty array gives undefined.',
      };
    }
    case 'unshift': {
      const r = arr.unshift({ id: newId, value: op.v });
      return {
        ...base,
        code: `playlist.unshift(${show(op.v)})`,
        returned: r,
        mutates: true,
        hits: [0],
        note: 'Every other item moved one place right, and all their indexes changed. That’s extra work for big arrays.',
      };
    }
    case 'shift': {
      const r = arr.shift();
      return {
        ...base,
        code: 'playlist.shift()',
        returned: r?.value,
        mutates: true,
        removed: r ? [r] : [],
        note: 'Everything after it moved one place left to close the gap.',
      };
    }
    case 'splice': {
      const r = arr.splice(op.i, 1);
      return {
        ...base,
        code: `playlist.splice(${op.i}, 1)`,
        returned: r.map((s) => s.value),
        mutates: true,
        removed: r,
        note: 'splice returns an array of the removed items.',
      };
    }
    case 'set': {
      const old = arr[op.i];
      const r = (arr[op.i] = { id: newId, value: op.v }).value;
      return {
        ...base,
        code: `playlist[${op.i}] = ${show(op.v)}`,
        returned: r,
        mutates: true,
        removed: old ? [old] : [],
        hits: [op.i],
      };
    }
    case 'includes': {
      const r = values.includes(op.v);
      return {
        ...base,
        code: `playlist.includes(${show(op.v)})`,
        returned: r,
        mutates: false,
        hits: values.flatMap((v, i) => (v === op.v ? [i] : [])),
        miss: !r,
      };
    }
    case 'indexOf': {
      const r = values.indexOf(op.v);
      return {
        ...base,
        code: `playlist.indexOf(${show(op.v)})`,
        returned: r,
        mutates: false,
        hits: r >= 0 ? [r] : [],
        miss: r < 0,
        note: r < 0 ? '-1 means "not found".' : 'indexOf gives the first match.',
      };
    }
  }
}

// ─── Mutate vs copy ───────────────────────────────────────────────────

export type MutateOp = 'push' | 'sort' | 'reverse' | 'splice';
export type CopyOp = 'spread' | 'toSorted' | 'toReversed' | 'toSpliced';

/** The default string sort, written as a compare function so it works on {id, value} items. */
const byValue = (a: Song, b: Song) => (a.value < b.value ? -1 : a.value > b.value ? 1 : 0);

/** Change the array in place (the same array comes back). */
export function mutate(arr: Song[], op: MutateOp, extra: Song): { code: string; result: Song[] } {
  switch (op) {
    case 'push':
      arr.push(extra);
      return { code: `playlist.push(${show(extra.value)})`, result: arr };
    case 'sort':
      return { code: 'playlist.sort()', result: arr.sort(byValue) };
    case 'reverse':
      return { code: 'playlist.reverse()', result: arr.reverse() };
    case 'splice':
      arr.splice(1, 1);
      return { code: 'playlist.splice(1, 1)', result: arr };
  }
}

/** True if this browser has the ES2023 copying methods. */
export const hasCopyMethods = () =>
  typeof Array.prototype.toSorted === 'function' &&
  typeof Array.prototype.toReversed === 'function' &&
  typeof Array.prototype.toSpliced === 'function';

/** Make a new array; the original is left alone. */
export function copy(arr: Song[], op: CopyOp, extra: Song): { code: string; result: Song[] } {
  switch (op) {
    case 'spread':
      return { code: `[...playlist, ${show(extra.value)}]`, result: [...arr, extra] };
    case 'toSorted':
      return { code: 'playlist.toSorted()', result: arr.toSorted(byValue) };
    case 'toReversed':
      return { code: 'playlist.toReversed()', result: arr.toReversed() };
    case 'toSpliced':
      return { code: 'playlist.toSpliced(1, 1)', result: arr.toSpliced(1, 1) };
  }
}

// ─── #2 The factory ───────────────────────────────────────────────────

export interface Product {
  id: string;
  emoji: string;
  name: string;
  price: number;
}

export const PRODUCTS: Product[] = [
  { id: 'chai', emoji: '☕', name: 'Chai', price: 30 },
  { id: 'samosa', emoji: '🥟', name: 'Samosa', price: 20 },
  { id: 'vadapav', emoji: '🍔', name: 'Vada Pav', price: 25 },
  { id: 'jalebi', emoji: '🍮', name: 'Jalebi', price: 40 },
  { id: 'lassi', emoji: '🥤', name: 'Lassi', price: 50 },
];

/** One recorded callback call. */
export interface Call {
  index: number;
  item: unknown;
  result: unknown;
  /** reduce only: the accumulator going in. */
  acc?: unknown;
}

export interface Preset<F> {
  id: string;
  name: string;
  /** The callback as code, shown on the machine. */
  code: string;
  fn: F;
  /** Explain one call, e.g. "30 * 1.18 = 35.4". */
  explain: (item: Product, result: unknown, acc?: unknown) => string;
}

// GST results are rounded to 2 decimals: 40 * 1.18 is 47.199999999999996 in real JavaScript.
const gst = (p: Product) => Math.round(p.price * 1.18 * 100) / 100;

export const MAP_PRESETS: Preset<(p: Product) => unknown>[] = [
  {
    id: 'gst',
    name: 'add 18% GST',
    code: 'p => Math.round(p.price * 1.18 * 100) / 100',
    fn: gst,
    explain: (p, r) => `${p.price} × 1.18 = ${r} (rounded to paise)`,
  },
  {
    id: 'names',
    name: 'just the names',
    code: 'p => p.name',
    fn: (p) => p.name,
    explain: (p) => `the name: ${show(p.name)}`,
  },
  {
    id: 'upper',
    name: 'names in uppercase',
    code: 'p => p.name.toUpperCase()',
    fn: (p) => p.name.toUpperCase(),
    explain: (p, r) => `${show(p.name)} → ${show(r)}`,
  },
  {
    id: 'double',
    name: 'double the price',
    code: 'p => p.price * 2',
    fn: (p) => p.price * 2,
    explain: (p, r) => `${p.price} × 2 = ${r}`,
  },
];

export const FILTER_PRESETS: Preset<(p: Product) => boolean>[] = [
  {
    id: 'cheap',
    name: 'price under ₹30',
    code: 'p => p.price < 30',
    fn: (p) => p.price < 30,
    explain: (p, r) => `${p.price} < 30 is ${r}`,
  },
  {
    id: 'pricey',
    name: 'price ≥ ₹30',
    code: 'p => p.price >= 30',
    fn: (p) => p.price >= 30,
    explain: (p, r) => `${p.price} >= 30 is ${r}`,
  },
  {
    id: 'i',
    name: "name includes 'i'",
    code: 'p => p.name.includes("i")',
    fn: (p) => p.name.includes('i'),
    explain: (p, r) => `${show(p.name)}.includes("i") is ${r}`,
  },
];

export const REDUCE_PRESETS: (Preset<(acc: unknown, p: Product) => unknown> & {
  init: number;
  accName: string;
})[] = [
  {
    id: 'total',
    name: 'total price',
    code: '(sum, p) => sum + p.price',
    accName: 'sum',
    init: 0,
    fn: (sum, p) => (sum as number) + p.price,
    explain: (p, r, acc) => `${show(acc)} + ${p.price} = ${show(r)}`,
  },
  {
    id: 'max',
    name: 'most expensive',
    code: '(max, p) => p.price > max ? p.price : max',
    accName: 'max',
    init: 0,
    fn: (max, p) => (p.price > (max as number) ? p.price : max),
    explain: (p, r, acc) =>
      p.price > (acc as number)
        ? `${p.price} > ${show(acc)}, so max = ${p.price}`
        : `${p.price} > ${show(acc)} is false, keep ${show(r)}`,
  },
  {
    id: 'count',
    name: 'count items under ₹30',
    code: '(n, p) => p.price < 30 ? n + 1 : n',
    accName: 'n',
    init: 0,
    fn: (n, p) => (p.price < 30 ? (n as number) + 1 : n),
    explain: (p, r, acc) =>
      `${p.price} < 30? ${p.price < 30 ? `yes, ${show(acc)} + 1 = ${show(r)}` : `no, stays ${show(r)}`}`,
  },
];

export function traceMap(items: Product[], fn: (p: Product) => unknown) {
  const calls: Call[] = [];
  const out = items.map((p, index) => {
    const result = fn(p);
    calls.push({ index, item: p, result });
    return result;
  });
  return { calls, out };
}

export function traceFilter(items: Product[], fn: (p: Product) => boolean) {
  const calls: Call[] = [];
  const out = items.filter((p, index) => {
    const result = fn(p);
    calls.push({ index, item: p, result });
    return result;
  });
  return { calls, out };
}

export function traceReduce(
  items: Product[],
  fn: (acc: unknown, p: Product) => unknown,
  init: { value: unknown } | null,
) {
  const calls: Call[] = [];
  const reducer = (acc: unknown, p: Product, index: number) => {
    const result = fn(acc, p);
    calls.push({ index, item: p, result, acc });
    return result;
  };
  try {
    const out = init
      ? items.reduce(reducer, init.value)
      : (items as unknown[]).reduce(reducer as never);
    return { calls, out, error: undefined as string | undefined };
  } catch (e) {
    // The engine's own message, e.g. "Reduce of empty array with no initial value".
    return { calls, out: undefined, error: `${(e as Error).name}: ${(e as Error).message}` };
  }
}

export type SearchMethod = 'find' | 'findIndex' | 'some' | 'every';
export const SEARCH_CONDITIONS = [
  { id: 'gt25', code: 'p => p.price > 25', fn: (p: Product) => p.price > 25 },
  { id: 'gt45', code: 'p => p.price > 45', fn: (p: Product) => p.price > 45 },
  { id: 'lt45', code: 'p => p.price < 45', fn: (p: Product) => p.price < 45 },
];

export function traceSearch(items: Product[], method: SearchMethod, fn: (p: Product) => boolean) {
  const calls: Call[] = [];
  const cb = (p: Product, index: number) => {
    const result = fn(p);
    calls.push({ index, item: p, result });
    return result;
  };
  const out =
    method === 'find'
      ? items.find(cb)
      : method === 'findIndex'
        ? items.findIndex(cb)
        : method === 'some'
          ? items.some(cb)
          : items.every(cb);
  return { calls, out };
}

// ─── Chaining ─────────────────────────────────────────────────────────

export interface Order {
  id: string;
  emoji: string;
  item: string;
  price: number;
  delivered: boolean;
}

export const ORDERS: Order[] = [
  { id: 'chai', emoji: '☕', item: 'Chai', price: 30, delivered: true },
  { id: 'samosa', emoji: '🥟', item: 'Samosa', price: 20, delivered: false },
  { id: 'vadapav', emoji: '🍔', item: 'Vada Pav', price: 25, delivered: true },
];

export interface ChainCall {
  stage: 0 | 1 | 2;
  index: number;
  item: unknown;
  result: unknown;
  acc?: unknown;
}

/** filter → map → reduce, recording every callback call of each real method. */
export function traceChain(orders: Order[]) {
  const calls: ChainCall[] = [];
  const delivered = orders.filter((o, index) => {
    const result = o.delivered;
    calls.push({ stage: 0, index, item: o, result });
    return result;
  });
  const prices = delivered.map((o, index) => {
    const result = o.price;
    calls.push({ stage: 1, index, item: o, result });
    return result;
  });
  const revenue = prices.reduce((sum, p, index) => {
    const result = sum + p;
    calls.push({ stage: 2, index, item: p, result, acc: sum });
    return result;
  }, 0);
  return { calls, delivered, prices, revenue };
}

// ─── #3 Sorting ───────────────────────────────────────────────────────

export interface Comparison {
  a: number;
  b: number;
  r: number;
}

/** Sort a copy with the real sort, logging every comparison the engine really makes. */
export function traceSort(nums: number[], dir: 'asc' | 'desc') {
  const comparisons: Comparison[] = [];
  const result = [...nums].sort((a, b) => {
    const r = dir === 'asc' ? a - b : b - a;
    comparisons.push({ a, b, r });
    return r;
  });
  return { result, comparisons };
}

/** The default sort: no compare function, so JavaScript compares the items as text. */
export const textSort = (nums: number[]) => [...nums].sort();

export const NUMBER_SETS: { name: string; nums: number[] }[] = [
  { name: 'The classic', nums: [10, 1, 5, 100, 25] },
  { name: 'Marks', nums: [92, 45, 78, 30, 88] },
  { name: 'Mixed sizes', nums: [3, 20, 100, 9, 1000] },
];
