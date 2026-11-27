/**
 * The ECMAScript editions and their headline features (the article's fact
 * sheet), plus a SAFE live check for each: only typeof / "in" tests inside
 * try/catch, never parsing new syntax. Syntax-only features are marked
 * "syntax": if this page runs, your browser supports them (the site's own
 * code uses them).
 */
export type Support = boolean | 'syntax' | 'unknown';

export interface Feature {
  name: string;
  explain: string;
  example: string;
  /** Live feature detection. */
  check?: () => boolean;
  syntax?: boolean;
  /** The course article that teaches it. */
  article?: number;
}
export interface Edition {
  year: number;
  features: Feature[];
}

const g = globalThis as unknown as Record<string, Record<string, unknown> | undefined>;
const has = (obj: unknown, key: string) =>
  obj != null && typeof (obj as Record<string, unknown>)[key] === 'function';
const proto = (ctor: string, key: string) => has(g[ctor]?.prototype, key);

export function detect(f: Feature): Support {
  if (f.syntax) return 'syntax';
  if (!f.check) return 'unknown';
  try {
    return !!f.check();
  } catch {
    return false;
  }
}

export const EDITIONS: Edition[] = [
  {
    year: 2015,
    features: [
      {
        name: 'let / const',
        explain: 'Block-scoped variables.',
        example: 'const city = "Pune";',
        syntax: true,
        article: 2,
      },
      {
        name: 'Arrow functions',
        explain: 'Short function syntax.',
        example: 'n => n * 2',
        syntax: true,
        article: 5,
      },
      {
        name: 'Classes',
        explain: 'Blueprints for objects.',
        example: 'class Cup { sip() {} }',
        syntax: true,
        article: 13,
      },
      {
        name: 'Modules (import/export)',
        explain: 'Split code into files that share.',
        example: 'import { addGST } from "./math.js";',
        syntax: true,
        article: 13,
      },
      {
        name: 'Template literals',
        explain: 'Strings with ${values} inside.',
        example: '`Hi ${name}`',
        syntax: true,
        article: 2,
      },
      {
        name: 'Destructuring',
        explain: 'Unpack arrays and objects into variables.',
        example: 'const { name } = user;',
        syntax: true,
        article: 13,
      },
      {
        name: 'Default and rest parameters',
        explain: 'Parameters with fallbacks, or that gather the rest.',
        example: 'function f(tip = 10, ...rest) {}',
        syntax: true,
        article: 5,
      },
      {
        name: 'Array spread',
        explain: 'Unpack an array into another, or into a call.',
        example: '[...drinks, "jalebi"]',
        syntax: true,
        article: 6,
      },
      {
        name: 'for...of',
        explain: 'Loop over the values of anything iterable.',
        example: 'for (const x of list) {}',
        syntax: true,
        article: 4,
      },
      {
        name: 'Promises',
        explain: 'Objects for future values.',
        example: 'fetch(url).then(…)',
        check: () => typeof Promise === 'function',
        article: 11,
      },
      {
        name: 'Map / Set',
        explain: 'Key-value maps with any keys, and sets of unique values.',
        example: 'new Set([1, 1, 2]).size // 2',
        check: () => typeof Map === 'function' && typeof Set === 'function',
      },
      {
        name: 'Symbol',
        explain: 'Guaranteed-unique values.',
        example: 'Symbol("id")',
        check: () => typeof Symbol === 'function',
        article: 2,
      },
      {
        name: 'Iterators / generators',
        explain: 'Functions that produce values one at a time.',
        example: 'function* count() { yield 1; }',
        syntax: true,
      },
      {
        name: 'Shorthand properties and computed keys',
        explain: 'Shorter object literals.',
        example: '{ name, [key]: value }',
        syntax: true,
      },
    ],
  },
  {
    year: 2016,
    features: [
      {
        name: 'Array.prototype.includes',
        explain: 'Is this value in the array?',
        example: '["chai"].includes("chai")',
        check: () => proto('Array', 'includes'),
        article: 6,
      },
      {
        name: 'Exponent operator **',
        explain: 'Powers without Math.pow.',
        example: '2 ** 10 // 1024',
        syntax: true,
      },
    ],
  },
  {
    year: 2017,
    features: [
      {
        name: 'async / await',
        explain: 'Promise code that reads top to bottom.',
        example: 'const res = await fetch(url);',
        syntax: true,
        article: 11,
      },
      {
        name: 'Object.values / Object.entries',
        explain: 'An object’s values, or [key, value] pairs.',
        example: 'Object.entries(chai)',
        check: () => has(Object, 'values') && has(Object, 'entries'),
        article: 7,
      },
      {
        name: 'padStart / padEnd',
        explain: 'Pad a string to a length.',
        example: '"7".padStart(2, "0") // "07"',
        check: () => proto('String', 'padStart'),
      },
    ],
  },
  {
    year: 2018,
    features: [
      {
        name: 'Object rest / spread',
        explain: 'Copy and merge objects with ...',
        example: '{ ...base, sugar: 2 }',
        syntax: true,
        article: 7,
      },
      {
        name: 'Promise.prototype.finally',
        explain: 'Run code whether a promise succeeds or fails.',
        example: 'p.finally(hideLoading)',
        check: () => proto('Promise', 'finally'),
        article: 11,
      },
      {
        name: 'Async iteration (for await...of)',
        explain: 'Loop over values that arrive over time.',
        example: 'for await (const chunk of stream) {}',
        syntax: true,
      },
    ],
  },
  {
    year: 2019,
    features: [
      {
        name: 'flat / flatMap',
        explain: 'Flatten nested arrays.',
        example: '[[1], [2]].flat() // [1, 2]',
        check: () => proto('Array', 'flat') && proto('Array', 'flatMap'),
      },
      {
        name: 'Object.fromEntries',
        explain: 'Turn [key, value] pairs back into an object.',
        example: 'Object.fromEntries([["a", 1]])',
        check: () => has(Object, 'fromEntries'),
      },
      {
        name: 'Optional catch binding',
        explain: 'catch without naming the error.',
        example: 'try { … } catch { … }',
        syntax: true,
      },
    ],
  },
  {
    year: 2020,
    features: [
      {
        name: 'Optional chaining ?.',
        explain: 'Stop at null or undefined instead of crashing.',
        example: 'user?.address?.city',
        syntax: true,
        article: 3,
      },
      {
        name: 'Nullish coalescing ??',
        explain: 'A fallback only for null or undefined.',
        example: 'tip ?? 10',
        syntax: true,
        article: 3,
      },
      {
        name: 'BigInt',
        explain: 'Whole numbers of any size.',
        example: '9007199254740993n',
        check: () => typeof BigInt === 'function',
        article: 2,
      },
      {
        name: 'Promise.allSettled',
        explain: 'Wait for every promise, success or failure.',
        example: 'await Promise.allSettled(orders)',
        check: () => has(Promise, 'allSettled'),
        article: 11,
      },
      {
        name: 'globalThis',
        explain: 'The global object, with one name everywhere.',
        example: 'globalThis.setTimeout',
        check: () => typeof globalThis === 'object',
      },
      {
        name: 'Dynamic import()',
        explain: 'Load a module only when you need it.',
        example: 'const m = await import("./big.js");',
        syntax: true,
      },
    ],
  },
  {
    year: 2021,
    features: [
      {
        name: 'Logical assignment (||=, &&=, ??=)',
        explain: 'Assign only if a condition holds.',
        example: 'settings.theme ??= "dark";',
        syntax: true,
        article: 13,
      },
      {
        name: 'Numeric separators',
        explain: 'Underscores to make big numbers readable.',
        example: '1_400_000_000',
        syntax: true,
        article: 13,
      },
      {
        name: 'String.prototype.replaceAll',
        explain: 'Replace every match, not just the first.',
        example: '"a-a".replaceAll("a", "b")',
        check: () => proto('String', 'replaceAll'),
        article: 13,
      },
      {
        name: 'Promise.any',
        explain: 'The first promise to succeed.',
        example: 'await Promise.any(mirrors)',
        check: () => has(Promise, 'any'),
        article: 11,
      },
    ],
  },
  {
    year: 2022,
    features: [
      {
        name: 'Array.prototype.at',
        explain: 'Index from the end with negatives.',
        example: '[10, 20, 30].at(-1) // 30',
        check: () => proto('Array', 'at'),
        article: 6,
      },
      {
        name: 'Object.hasOwn',
        explain: 'Does the object have this key itself?',
        example: 'Object.hasOwn(chai, "price")',
        check: () => has(Object, 'hasOwn'),
        article: 7,
      },
      {
        name: 'Class fields and private #members',
        explain: 'Fields declared in the class body; # makes them private.',
        example: 'class Account { #balance = 0; }',
        syntax: true,
        article: 13,
      },
      {
        name: 'Top-level await',
        explain: 'await at the top of a module.',
        example: 'const data = await load();',
        syntax: true,
      },
      {
        name: 'Error cause',
        explain: 'Say which error caused this one.',
        example: 'new Error("Failed", { cause: err })',
        check: () => (new Error('x', { cause: 1 }) as Error & { cause?: unknown }).cause === 1,
      },
    ],
  },
  {
    year: 2023,
    features: [
      {
        name: 'findLast / findLastIndex',
        explain: 'Search from the end.',
        example: '[3, 8, 5, 12].findLast(n => n > 4) // 12',
        check: () => proto('Array', 'findLast') && proto('Array', 'findLastIndex'),
        article: 13,
      },
      {
        name: 'Change array by copy (toSorted, toReversed, toSpliced, with)',
        explain: 'Like sort/reverse/splice, but they return a new array.',
        example: 'prices.toSorted((a, b) => a - b)',
        check: () => proto('Array', 'toSorted') && proto('Array', 'with'),
        article: 6,
      },
    ],
  },
  {
    year: 2024,
    features: [
      {
        name: 'Object.groupBy / Map.groupBy',
        explain: 'Sort items into groups by a key.',
        example: 'Object.groupBy(menu, i => i.category)',
        check: () => has(Object, 'groupBy') && has(Map, 'groupBy'),
        article: 13,
      },
      {
        name: 'Promise.withResolvers',
        explain: 'A promise plus its resolve and reject, in one call.',
        example: 'const { promise, resolve } = Promise.withResolvers();',
        check: () => has(Promise, 'withResolvers'),
      },
    ],
  },
  {
    year: 2025,
    features: [
      {
        name: 'Iterator helpers',
        explain: 'map, filter, take… on any iterator.',
        example: 'iter.map(x => x * 2).take(3)',
        check: () => has(g.Iterator?.prototype, 'map'),
      },
      {
        name: 'New Set methods',
        explain: 'union, intersection, difference and more.',
        example: 'a.union(b)',
        check: () => proto('Set', 'union') && proto('Set', 'intersection'),
      },
      {
        name: 'Promise.try',
        explain: 'Start a promise chain from any function.',
        example: 'Promise.try(() => mightThrow())',
        check: () => has(Promise, 'try'),
      },
      {
        name: 'RegExp.escape',
        explain: 'Make a string safe to use inside a RegExp.',
        example: 'RegExp.escape("1+1")',
        check: () => has(RegExp, 'escape'),
      },
      {
        name: 'JSON modules / import attributes',
        explain: 'Import a JSON file as a module.',
        example: 'import data from "./menu.json" with { type: "json" };',
      },
      {
        name: 'Float16Array',
        explain: 'An array of 16-bit floating-point numbers.',
        example: 'new Float16Array(4)',
        check: () => typeof g.Float16Array === 'function',
      },
    ],
  },
  {
    year: 2026,
    features: [
      {
        name: 'Array.fromAsync',
        explain: 'Build an array from values that arrive over time.',
        example: 'await Array.fromAsync(stream)',
        check: () => has(Array, 'fromAsync'),
      },
      {
        name: 'Error.isError',
        explain: 'Is this value really an Error?',
        example: 'Error.isError(e)',
        check: () => has(Error, 'isError'),
      },
      {
        name: 'Math.sumPrecise',
        explain: 'Add up numbers without rounding errors creeping in.',
        example: 'Math.sumPrecise([0.1, 0.2])',
        check: () => has(Math, 'sumPrecise'),
      },
      {
        name: 'Uint8Array Base64 / Hex methods',
        explain: 'Convert bytes to and from Base64 or hex.',
        example: 'bytes.toBase64()',
        check: () => has(Uint8Array, 'fromBase64') && proto('Uint8Array', 'toBase64'),
      },
      {
        name: 'Iterator.concat',
        explain: 'Join several iterators into one.',
        example: 'Iterator.concat(a, b)',
        check: () => has(g.Iterator, 'concat'),
      },
      {
        name: 'JSON.parse source text access',
        explain: 'See the exact text a JSON value came from.',
        example: 'JSON.parse(text, (k, v, { source }) => …)',
        check: () => has(JSON, 'rawJSON'),
      },
      {
        name: 'Map.prototype.getOrInsert',
        explain: 'Get a value, or add it if the key is missing.',
        example: 'counts.getOrInsert(word, 0)',
        check: () => proto('Map', 'getOrInsert'),
      },
    ],
  },
];

export const TC39_STAGES: [string, string][] = [
  ['0', 'An idea, written down.'],
  ['1', 'The committee agrees the problem is worth solving.'],
  ['2', 'A draft of the feature’s design.'],
  ['2.7', 'The design is approved; now it needs tests (added in 2024).'],
  ['3', 'Ready to build: browsers start implementing it.'],
  ['4', 'Finished: it joins the next yearly edition.'],
];

export const allFeatures = () =>
  EDITIONS.flatMap((e) => e.features.map((f) => ({ ...f, year: e.year })));
/** How many of the features the course teaches (worked out from the article links). */
export const learnedCount = () => allFeatures().filter((f) => f.article).length;
