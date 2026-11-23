/**
 * The real functions behind the small visuals in "Functions". Plain
 * TypeScript, no React. Each one is the code from the article, written out
 * for real here (never eval'd from text), so every slot value, result and
 * error message on screen comes from JavaScript itself.
 */

const show = (v: unknown): string =>
  typeof v === 'string' ? JSON.stringify(v) : typeof v === 'function' ? 'ƒ' : String(v);

// ─── #2 Parameters and arguments ──────────────────────────────────────

export interface Chip {
  label: string;
  value: unknown;
}
const chip = (value: unknown): Chip => ({ label: show(value), value });

export interface CallResult {
  /** Each parameter and the value it got. */
  slots: [string, unknown][];
  /** Arguments no parameter took. */
  ignored: unknown[];
  /** What console.log printed. */
  log: string;
}

export interface ParamsPreset {
  id: string;
  name: string;
  /** The definition, exactly as shown. */
  code: string[];
  params: string[];
  /** Defaults shown faintly in the empty slots. */
  defaults?: Record<string, string>;
  rest?: string;
  chips: Chip[];
  start: unknown[];
  call: (args: unknown[]) => CallResult;
}

/** The article's makeChai message, for real. */
export function makeChai(sugar?: unknown, milk?: unknown) {
  return 'Chai with ' + sugar + ' spoons of sugar and ' + milk + ' milk';
}
function makeChaiDefaults(sugar: unknown = 1, milk: unknown = 'half') {
  return {
    slots: [
      ['sugar', sugar],
      ['milk', milk],
    ] as [string, unknown][],
    log: 'Chai with ' + sugar + ' spoons of sugar and ' + milk + ' milk',
  };
}
function addToppings(base?: unknown, ...extras: unknown[]) {
  return {
    slots: [
      ['base', base],
      ['extras', extras],
    ] as [string, unknown][],
    log: base + ' topped with ' + (extras.length ? extras.join(' and ') : 'nothing'),
  };
}

const plainChai = (args: unknown[]): CallResult => {
  const [sugar, milk] = args;
  return {
    slots: [
      ['sugar', sugar],
      ['milk', milk],
    ],
    ignored: args.slice(2),
    log: makeChai(...(args as [unknown, unknown])),
  };
};

const CHAI_CODE = [
  'function makeChai(sugar, milk) {',
  '  console.log("Chai with " + sugar + " spoons of sugar and " + milk + " milk");',
  '}',
];

export const PARAMS_PRESETS: ParamsPreset[] = [
  {
    id: 'order',
    name: 'Basic order',
    code: CHAI_CODE,
    params: ['sugar', 'milk'],
    chips: [chip(2), chip('full'), chip(0), chip('no')],
    start: [2, 'full'],
    call: plainChai,
  },
  {
    id: 'missing',
    name: 'Missing & extra',
    code: CHAI_CODE,
    params: ['sugar', 'milk'],
    chips: [chip(2), chip('full'), chip('ginger'), chip(0)],
    start: [2],
    call: plainChai,
  },
  {
    id: 'defaults',
    name: 'Defaults',
    code: [
      'function makeChai(sugar = 1, milk = "half") {',
      '  console.log("Chai with " + sugar + " spoons of sugar and " + milk + " milk");',
      '}',
    ],
    params: ['sugar', 'milk'],
    defaults: { sugar: '1', milk: '"half"' },
    chips: [chip(2), chip('full'), chip(undefined), chip(null)],
    start: [undefined, null],
    call: (args) => ({ ...makeChaiDefaults(...args), ignored: args.slice(2) }),
  },
  {
    id: 'rest',
    name: 'Rest ...extras',
    code: [
      'function addToppings(base, ...extras) {',
      '  console.log(base + " topped with " + (extras.length ? extras.join(" and ") : "nothing"));',
      '}',
    ],
    params: ['base'],
    rest: 'extras',
    chips: [chip('chai'), chip('ginger'), chip('elaichi'), chip('honey')],
    start: ['chai', 'ginger', 'elaichi'],
    call: (args) => ({ ...addToppings(...args), ignored: [] }),
  },
];

export const callCode = (preset: ParamsPreset, args: unknown[]) =>
  `${preset.rest ? 'addToppings' : 'makeChai'}(${args.map(show).join(', ')});`;

// ─── #3 return vs console.log ─────────────────────────────────────────

/** Runs the two versions from the article, capturing what they print. */
export function returnVsLog(price: number) {
  const printed: string[] = [];
  const log = (v: unknown) => printed.push(String(v));

  function addGST_log(p: number) {
    log(p * 1.18);
  }
  function addGST_return(p: number) {
    return p * 1.18;
  }

  const logPrinted: string[] = [];
  const a = addGST_log(price) as unknown;
  logPrinted.push(...printed.splice(0));
  log((a as number) + 100); // undefined + 100
  const aFinal = printed.splice(0)[0];

  const b = addGST_return(price);
  log(b + 100);
  const bFinal = printed.splice(0)[0];

  return {
    shown: logPrinted[0], // what addGST_log showed on the console
    a, // undefined
    aFinal, // "NaN"
    b, // 590
    bFinal, // "690"
  };
}

export function checkAge(age: number): string {
  if (age < 18) {
    return 'Too young';
  }
  return 'Welcome!';
}

// ─── #4 Arrow functions ───────────────────────────────────────────────

// The five versions from the article, defined for real. The tester calls all of them.
function squareDeclaration(n: number) {
  return n * n;
}
const squareExpression = function (n: number) {
  return n * n;
};
const squareArrowBlock = (n: number) => {
  return n * n;
};
const squareArrow = (n: number) => n * n;
const squareArrowNoParens = (n: number) => n * n; // `n => n * n` once TypeScript types are stripped

export const SQUARES = [
  squareDeclaration,
  squareExpression,
  squareArrowBlock,
  squareArrow,
  squareArrowNoParens,
];

// The object-literal gotcha, for real.
/* eslint-disable @typescript-eslint/no-unused-expressions, no-unused-labels -- the bug on purpose */
// Without the brackets, { name: "Riya" } is a code block holding a label, not an object.
const withoutBrackets: () => unknown = () => {
  name: 'Riya';
};
/* eslint-enable @typescript-eslint/no-unused-expressions, no-unused-labels */
const withBrackets = () => ({ name: 'Riya' });

export const objectGotcha = () => ({
  without: show(withoutBrackets()),
  with: JSON.stringify(withBrackets()).replace(/"(\w+)":/g, '$1: '),
});

/** Call square(3) before its line, both ways: the real results. */
export function hoistingGotcha() {
  const results = { declaration: '', arrow: '' };
  {
    // A function declaration is hoisted, so this works.
    results.declaration = String(square(3));
    function square(n: number) {
      return n * n;
    }
  }
  {
    try {
      // @ts-expect-error: used before its line, on purpose
      results.arrow = String(square(3));
    } catch (e) {
      results.arrow = `${(e as Error).name}: ${(e as Error).message}`;
    }
    const square = (n: number) => n * n;
    void square;
  }
  return results;
}

// ─── #5 Functions as values ───────────────────────────────────────────

export type Passed = 'sayHi' | 'sayHi()' | 'clap';

/** doTwice from the article, run for real with what the reader picked. */
export function runDoTwice(pick: Passed) {
  const out: string[] = [];
  const sayHi = () => {
    out.push('Hi!');
  };
  function doTwice(action: unknown) {
    (action as () => void)();
    (action as () => void)();
  }
  const events: { printed: string[]; received: string; error?: string } = {
    printed: out,
    received: '',
  };
  try {
    if (pick === 'sayHi') {
      events.received = 'sayHi (the function itself)';
      doTwice(sayHi);
    } else if (pick === 'clap') {
      events.received = '() => console.log("Clap! 👏")';
      doTwice(() => out.push('Clap! 👏'));
    } else {
      // sayHi() runs first; its return value (undefined) is what gets passed.
      const result = sayHi() as unknown;
      events.received = show(result);
      doTwice(result);
    }
  } catch (e) {
    events.error = `${(e as Error).name}: ${(e as Error).message}`;
  }
  return events;
}

// ─── #7 Scope ─────────────────────────────────────────────────────────

/** Reading a variable that only exists inside makeBill, from outside: the real error. */
export function readTaxOutside(): string {
  try {
    // @ts-expect-error: `tax` doesn't exist out here. That's the whole point.
    return String(tax);
  } catch (e) {
    return `${(e as Error).name}: ${(e as Error).message}`;
  }
}

/** The shadowing example, run for real. */
export function shadowing() {
  const printed: string[] = [];
  const city = 'Mumbai';
  function plan() {
    const city = 'Goa';
    printed.push(city);
  }
  plan();
  printed.push(city);
  return printed;
}
