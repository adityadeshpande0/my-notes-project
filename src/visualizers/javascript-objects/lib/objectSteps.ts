/**
 * The engine behind "Objects & JSON". Plain TypeScript, no React.
 *
 * Every value, key list, path result, JSON string and error message comes
 * from running the real operation (obj[key], Object.keys, JSON.stringify…).
 * Nothing is ever eval'd. objectSteps.test.ts checks it all against real JS.
 */

export type Obj = Record<string, unknown>;

/** Write a value the way it looks in code. */
export function show(v: unknown): string {
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'function') return 'ƒ()';
  if (typeof v === 'number' && Object.is(v, -0)) return '-0';
  if (Array.isArray(v))
    return v.length > 4 ? `[…${v.length} items]` : `[${v.map(show).join(', ')}]`;
  if (v instanceof Date) return `Date(${v.toISOString().slice(0, 10)})`;
  if (v && typeof v === 'object') {
    const keys = Object.keys(v);
    return keys.length > 3 ? `{…${keys.length} keys}` : `{ ${keys.join(', ')} }`;
  }
  return String(v);
}

export const typeName = (v: unknown) =>
  v === null ? 'null' : Array.isArray(v) ? 'array' : v instanceof Date ? 'Date' : typeof v;

const IDENT = /^[A-Za-z_$][\w$]*$/;
/** How to write a property access in code: .name when allowed, ["final exam"] when not. */
export const accessCode = (key: string) =>
  IDENT.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`;

// ─── #1 The object card ───────────────────────────────────────────────

export const MAX_PROPS = 8;

export const makeChai = (): Obj => ({
  name: 'Masala Chai',
  price: 30,
  sizes: ['small', 'large'],
  isHot: true,
});

export interface ReadResult {
  code: string;
  value: unknown;
  /** The key that was really looked up. */
  key: string;
  found: boolean;
}

/** obj.key (dot) or obj[key] (bracket), for real. */
export function readProp(obj: Obj, key: string, mode: 'dot' | 'bracket'): ReadResult {
  const value = obj[key]; // the real lookup
  return {
    code: mode === 'dot' ? `chai${accessCode(key)}` : `chai[${JSON.stringify(key)}]`,
    value,
    key,
    found: key in obj,
  };
}

/** The variable-key demo: chai[field] looks inside `field` first; chai.field looks for "field". */
export function readWithVariable(obj: Obj, field: string, mode: 'bracket' | 'dot'): ReadResult {
  const key = mode === 'bracket' ? field : 'field';
  return {
    code: mode === 'bracket' ? 'chai[field]' : 'chai.field',
    value: obj[key],
    key,
    found: key in obj,
  };
}

export type ValueKind = 'string' | 'number' | 'boolean' | 'null';

/** Turn what the reader typed into a value of the chosen type. */
export function parseValue(text: string, kind: ValueKind): unknown {
  if (kind === 'number') return Number(text);
  if (kind === 'boolean') return text.trim() === 'true';
  if (kind === 'null') return null;
  return text;
}

export type CheckResult = { ok: true; key: string } | { ok: false; reason: string };

export function checkKey(obj: Obj, raw: string): CheckResult {
  const key = raw.trim();
  if (!key) return { ok: false, reason: 'A key can’t be empty.' };
  if (!(key in obj) && Object.keys(obj).length >= MAX_PROPS)
    return { ok: false, reason: `This card holds ${MAX_PROPS} properties. Delete one first.` };
  return { ok: true, key };
}

export interface SetResult {
  next: Obj;
  code: string;
  added: boolean;
  old: unknown;
}

/** obj.key = value, for real (on a copy, so React sees a new object). */
export function setProp(obj: Obj, key: string, value: unknown): SetResult {
  const next = { ...obj };
  const added = !(key in next);
  const old = next[key];
  next[key] = value;
  return { next, code: `chai${accessCode(key)} = ${show(value)};`, added, old };
}

/** delete obj.key, for real (on a copy). */
export function deleteProp(obj: Obj, key: string) {
  const next = { ...obj };
  const returned = delete next[key];
  return { next, code: `delete chai${accessCode(key)};`, returned };
}

export const hasProp = (obj: Obj, key: string) => key in obj;

export function loopHelpers(obj: Obj) {
  return {
    keys: Object.keys(obj),
    values: Object.values(obj),
    entries: Object.entries(obj),
  };
}

/** The counter from the article, with a real method that uses `this`. */
export function makeCounter() {
  return {
    count: 0,
    increment() {
      this.count++;
    },
  };
}

// ─── #2 The data explorer ─────────────────────────────────────────────

export const makeOrder = () => ({
  id: 1042,
  customer: {
    name: 'Aarav',
    address: {
      city: 'Mumbai',
      pincode: '400001',
    },
  },
  items: [
    { name: 'Vada Pav', price: 25, qty: 2 },
    { name: 'Cutting Chai', price: 15, qty: 3 },
  ],
  status: 'on the way',
});
export type Order = ReturnType<typeof makeOrder>;

export type Seg = { kind: 'prop'; key: string } | { kind: 'index'; i: number };

export const segCode = (s: Seg, optional = false) =>
  s.kind === 'index'
    ? `${optional ? '?.' : ''}[${s.i}]`
    : optional
      ? `?.${IDENT.test(s.key) ? s.key : `[${JSON.stringify(s.key)}]`}`
      : accessCode(s.key);

/** The JavaScript expression for a path, e.g. order.items[1].name */
export const pathCode = (segs: Seg[], root = 'order', optional = false) =>
  root + segs.map((s) => segCode(s, optional)).join('');

export interface TreeNode {
  id: string;
  segs: Seg[];
  label: string;
  value: unknown;
  type: string;
  children: TreeNode[];
}

/** The data as a tree. Every node remembers the path that reaches it. */
export function buildTree(value: unknown, segs: Seg[] = [], label = 'order'): TreeNode {
  const node: TreeNode = {
    id: pathCode(segs),
    segs,
    label,
    value,
    type: typeName(value),
    children: [],
  };
  if (Array.isArray(value)) {
    node.children = value.map((v, i) => buildTree(v, [...segs, { kind: 'index', i }], `[${i}]`));
  } else if (value && typeof value === 'object') {
    node.children = Object.entries(value).map(([k, v]) =>
      buildTree(v, [...segs, { kind: 'prop', key: k }], k),
    );
  }
  return node;
}

export const flatten = (n: TreeNode): TreeNode[] => [n, ...n.children.flatMap(flatten)];

export interface WalkStep {
  seg: Seg | null;
  value: unknown;
  /** For the last step only: what went wrong (the engine's real message). */
  error?: string;
  /** ?. stopped here because the value before was null/undefined. */
  stopped?: boolean;
}

/**
 * Walk a path one step at a time with real property access. Without ?.,
 * stepping into undefined throws the real TypeError; with ?. it stops
 * calmly at undefined.
 */
export function walk(root: unknown, segs: Seg[], optional: boolean): WalkStep[] {
  const steps: WalkStep[] = [{ seg: null, value: root }];
  let cur: unknown = root;
  for (const seg of segs) {
    if (optional && cur == null) {
      steps.push({ seg, value: undefined, stopped: true });
      return steps;
    }
    try {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      cur = (cur as any)[seg.kind === 'index' ? seg.i : seg.key];
    } catch (e) {
      steps.push({ seg, value: undefined, error: `${(e as Error).name}: ${(e as Error).message}` });
      return steps;
    }
    steps.push({ seg, value: cur });
  }
  return steps;
}

/** The keys you can pick next in "Build a path", plus a few that don't exist. */
export function nextOptions(value: unknown): Seg[] {
  const decoys: Seg[] = [
    { kind: 'prop', key: 'coupon' },
    { kind: 'prop', key: 'code' },
  ];
  if (Array.isArray(value))
    return [
      ...value.map((_, i) => ({ kind: 'index' as const, i })),
      { kind: 'index', i: value.length },
      ...decoys,
    ];
  if (value && typeof value === 'object')
    return [...Object.keys(value).map((key) => ({ kind: 'prop' as const, key })), ...decoys];
  return decoys;
}

export interface Item {
  name: string;
  price: number;
  qty: number;
}

export const MENU: Item[] = [
  { name: 'Vada Pav', price: 25, qty: 2 },
  { name: 'Cutting Chai', price: 15, qty: 3 },
  { name: 'Samosa', price: 20, qty: 1 },
  { name: 'Poha', price: 30, qty: 1 },
  { name: 'Bun Maska', price: 18, qty: 2 },
];

export type ItemsAction = 'map' | 'filter' | 'reduce';
export const ACTION_CODE: Record<ItemsAction, string> = {
  map: 'order.items.map(item => item.name)',
  filter: 'order.items.filter(item => item.price < 20)',
  reduce: 'order.items.reduce((sum, item) => sum + item.price * item.qty, 0)',
};

export interface ItemCall {
  index: number;
  result: unknown;
  acc?: number;
}

/** Run the real array method, recording each callback call (as in article #6). */
export function runItems(items: Item[], action: ItemsAction) {
  const calls: ItemCall[] = [];
  if (action === 'map') {
    const out = items.map((item, index) => {
      calls.push({ index, result: item.name });
      return item.name;
    });
    return { out, calls };
  }
  if (action === 'filter') {
    const out = items.filter((item, index) => {
      const r = item.price < 20;
      calls.push({ index, result: r });
      return r;
    });
    return { out, calls };
  }
  const out = items.reduce((sum, item, index) => {
    const r = sum + item.price * item.qty;
    calls.push({ index, result: r, acc: sum });
    return r;
  }, 0);
  return { out, calls };
}

// ─── #3 JSON ──────────────────────────────────────────────────────────

/** The sample object. createdAt is fixed so the output never changes between visits. */
export function makeSample(withNaN: boolean): Obj {
  const o: Obj = {
    name: 'Masala Chai',
    price: 30,
    sizes: ['small', 'large'],
    isHot: true,
    discount: null,
    greet() {
      return 'Namaste!';
    },
    notes: undefined,
    createdAt: new Date('2026-01-15T09:30:00.000Z'),
  };
  if (withNaN) o.score = NaN;
  return o;
}

export interface Luggage {
  key: string;
  what: 'dropped' | 'converted';
  why: string;
}

/** Real stringify, plus what happened to the values JSON can't hold. */
export function pack(obj: Obj, indent: number) {
  const text = JSON.stringify(obj, null, indent);
  const back = JSON.parse(text) as Obj;
  const luggage: Luggage[] = [];
  for (const [key, v] of Object.entries(obj)) {
    if (!(key in back)) {
      luggage.push({
        key,
        what: 'dropped',
        why:
          typeof v === 'function'
            ? 'functions are dropped'
            : typeof v === 'undefined'
              ? 'undefined is dropped'
              : 'dropped',
      });
    } else if (v instanceof Date) {
      luggage.push({ key, what: 'converted', why: `dates become text: ${show(back[key])}` });
    } else if (typeof v === 'number' && !Number.isFinite(v)) {
      luggage.push({ key, what: 'converted', why: `${v} becomes null` });
    }
  }
  return { text, back, luggage };
}

export type Validation =
  { ok: true; value: unknown } | { ok: false; message: string; position: number | null };

/** JSON.parse in a try/catch. The message is whatever this browser says. */
export function validate(text: string): Validation {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    const message = (e as Error).message;
    return { ok: false, message, position: errorPosition(text, message) };
  }
}

/** Find the error position, if the browser's message mentions one. */
export function errorPosition(text: string, message: string): number | null {
  const pos = /position (\d+)/i.exec(message);
  if (pos) return Math.min(Number(pos[1]), text.length);
  const lc = /line (\d+) column (\d+)/i.exec(message);
  if (lc) {
    const lines = text.split('\n');
    const line = Number(lc[1]) - 1;
    if (line < lines.length) {
      const before = lines.slice(0, line).reduce((n, l) => n + l.length + 1, 0);
      return Math.min(before + Number(lc[2]) - 1, text.length);
    }
  }
  return null;
}

export const MAX_JSON = 2000;

export const BROKEN: { id: string; name: string; text: string; fix: string; why: string }[] = [
  {
    id: 'keys',
    name: 'Unquoted key',
    text: '{ name: "Riya" }',
    fix: '{ "name": "Riya" }',
    why: 'Keys need double quotes in JSON.',
  },
  {
    id: 'single',
    name: 'Single quotes',
    text: `{ "name": 'Riya' }`,
    fix: '{ "name": "Riya" }',
    why: 'JSON strings use double quotes only.',
  },
  {
    id: 'comma',
    name: 'Trailing comma',
    text: '{ "name": "Riya", }',
    fix: '{ "name": "Riya" }',
    why: 'No comma after the last item.',
  },
  {
    id: 'comment',
    name: 'A comment',
    text: '{ "age": 19 // years\n}',
    fix: '{ "age": 19 }',
    why: 'JSON has no comments.',
  },
  {
    id: 'nan',
    name: 'NaN',
    text: '{ "total": NaN }',
    fix: '{ "total": null }',
    why: 'NaN isn’t valid JSON (use null, or a real number).',
  },
  {
    id: 'bracket',
    name: 'Missing bracket',
    text: '["chai", "samosa"',
    fix: '["chai", "samosa"]',
    why: 'Every [ needs a matching ].',
  },
];

/** Split JSON text into coloured pieces for display (strings, keys, numbers…). */
export function jsonTokens(
  text: string,
): { t: string; kind: 'key' | 'string' | 'number' | 'literal' | 'punct' | 'space' }[] {
  const out: { t: string; kind: 'key' | 'string' | 'number' | 'literal' | 'punct' | 'space' }[] =
    [];
  const re =
    /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m[1]) {
      out.push({ t: m[1], kind: m[2] ? 'key' : 'string' });
      if (m[2]) out.push({ t: m[2], kind: 'punct' });
    } else if (m[3]) out.push({ t: m[3], kind: 'number' });
    else if (m[4]) out.push({ t: m[4], kind: 'literal' });
    else if (m[5]) out.push({ t: m[5], kind: 'space' });
    else out.push({ t: m[6], kind: 'punct' });
  }
  return out;
}

export const SNACKS = ['Samosa', 'Vada Pav', 'Jalebi', 'Pani Puri', 'Dhokla', 'Chai'];
export const STORAGE_KEY = 'favs';

/** localStorage, carefully: it may be missing or throw (private modes, sandboxed frames). */
export const storage = {
  save(value: unknown): { ok: boolean; stored?: string; error?: string } {
    const text = JSON.stringify(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, text);
      return { ok: true, stored: text };
    } catch (e) {
      return { ok: false, stored: text, error: (e as Error).message };
    }
  },
  load(): { ok: boolean; raw?: string | null; value?: unknown; error?: string } {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return { ok: true, raw, value: raw === null ? null : JSON.parse(raw) };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },
};
