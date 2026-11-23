/**
 * The call-stack simulator for "Functions". Plain TypeScript, no React.
 *
 * Each preset program is written twice: once as the real code shown in the
 * article, and once here as the same code wrapped in a Tracer, which writes
 * down a snapshot of the call stack at every step. The tracer never parses or
 * evaluates text; the presets are ordinary TypeScript functions, and every
 * value is computed by real JavaScript operators. callSim.test.ts checks the
 * traced output against the plain code.
 *
 * The guard: the stack is capped at GUARD_DEPTH plates, so a runaway
 * recursion stops with a friendly message instead of crashing the page.
 */

export const GUARD_DEPTH = 12;

const show = (v: unknown): string =>
  typeof v === 'string' ? JSON.stringify(v) : typeof v === 'function' ? 'ƒ' : String(v);

export interface FrameSnap {
  id: number;
  name: string;
  args: [string, string][];
  locals: [string, string][];
  /** The local that was just set (to flash it). */
  fresh?: string;
  builtin?: boolean;
  /** Set while this plate waits for a call it made. */
  waitingFor?: string;
  slot?: string;
  /** A value that just landed back on this plate. */
  received?: string;
  /** Set on the step where this plate returns. */
  returns?: string;
}

export type CallEvent =
  'start' | 'call' | 'line' | 'return' | 'handoff' | 'log' | 'overflow' | 'end';

export interface NodeSnap {
  id: number;
  status: 'active' | 'waiting' | 'done' | 'memo';
  value?: string;
}

export interface CallStep {
  event: CallEvent;
  /** Code line (1-based) to highlight, or null. */
  line: number | null;
  /** Plates from the bottom of the stack to the top. */
  stack: FrameSnap[];
  output: string[];
  message: string;
  /** Call-tree nodes created so far (for the tree view). */
  nodes: NodeSnap[];
  /** Function calls made so far (built-ins not counted). */
  calls: number;
}

export interface TreeNode {
  id: number;
  parent: number | null;
  label: string;
}

export interface Trace {
  steps: CallStep[];
  output: string[];
  /** Every call made, for drawing the call tree. */
  tree: TreeNode[];
  overflow: boolean;
}

class Overflow extends Error {}

/** Records what the call stack looks like as a traced program runs. */
export class Tracer {
  steps: CallStep[] = [];
  output: string[] = [];
  tree: TreeNode[] = [];
  private stack: FrameSnap[] = [];
  private frameIds: number[] = []; // tree node id of each plate
  private nodeStatus = new Map<number, NodeSnap>();
  private nextId = 0;
  private calls = 0;

  snap(event: CallEvent, line: number | null, message: string) {
    this.steps.push({
      event,
      line,
      stack: this.stack.map((f) => ({
        ...f,
        args: f.args.map((a) => [...a] as [string, string]),
        locals: f.locals.map((l) => [...l] as [string, string]),
      })),
      output: [...this.output],
      message,
      nodes: [...this.nodeStatus.values()].map((n) => ({ ...n })),
      calls: this.calls,
    });
    // Flashes and landed values only show for one step.
    for (const f of this.stack) {
      f.fresh = undefined;
      f.received = undefined;
    }
  }

  private get top() {
    return this.stack[this.stack.length - 1];
  }

  /**
   * Call a traced function: push a plate, run `body`, then hand the value
   * back to the plate underneath. `slot` is what the caller is waiting to
   * fill, e.g. "const total = ▢".
   */
  call<T>(
    name: string,
    args: Record<string, unknown>,
    line: number | null,
    body: () => T,
    opts: {
      slot?: string;
      builtin?: boolean;
      returnLine?: number | null;
      label?: string;
      /** The main() plate: on the stack, but not a node in the call tree. */
      root?: boolean;
    } = {},
  ): T {
    const caller = this.top;
    if (this.stack.length >= GUARD_DEPTH) {
      this.snap(
        'overflow',
        line,
        `📚 Stack overflow! ${GUARD_DEPTH} plates and still going. No base case, so it never stops.`,
      );
      throw new Overflow();
    }
    if (caller) {
      caller.waitingFor = name;
      caller.slot = opts.slot;
    }
    const id = this.nextId++;
    if (!opts.builtin && !opts.root) {
      this.calls++;
      const above = this.frameIds[this.frameIds.length - 1];
      const parent = this.tree.some((n) => n.id === above) ? above : null;
      this.tree.push({
        id,
        parent,
        label: opts.label ?? `${name}(${Object.values(args).map(show).join(', ')})`,
      });
      if (parent !== null && this.nodeStatus.has(parent))
        this.nodeStatus.get(parent)!.status = 'waiting';
      this.nodeStatus.set(id, { id, status: 'active' });
    }
    this.stack.push({
      id,
      name,
      args: Object.entries(args).map(([k, v]) => [k, show(v)]),
      locals: [],
      builtin: opts.builtin,
    });
    this.frameIds.push(id);
    this.snap(
      'call',
      line,
      opts.builtin
        ? `${name} is a built-in function: a quick plate on top.`
        : `Calling ${name}(${Object.values(args).map(show).join(', ')}) puts a new plate on top. JavaScript now works on it.`,
    );

    const value = body();

    const frame = this.top;
    frame.returns = show(value);
    if (!opts.builtin && !opts.root) {
      this.nodeStatus.set(id, { id, status: 'done', value: show(value) });
    }
    this.snap(
      'return',
      opts.returnLine ?? null,
      value === undefined
        ? `${name} is done. With no return value, it gives back undefined, and its plate comes off.`
        : `${name} returns ${show(value)}. Its plate comes off the stack.`,
    );
    this.stack.pop();
    this.frameIds.pop();
    if (caller) {
      caller.waitingFor = undefined;
      if (opts.slot) caller.received = show(value);
      const parentNode = this.nodeStatus.get(this.frameIds[this.frameIds.length - 1]);
      if (parentNode && parentNode.status === 'waiting') parentNode.status = 'active';
      this.snap(
        'handoff',
        line,
        opts.slot
          ? `${show(value)} lands on ${caller.name}'s plate: ${opts.slot.replace('▢', show(value))}. It carries on exactly where it left off.`
          : `Back on ${caller.name}'s plate, which carries on where it left off.`,
      );
      caller.slot = undefined;
    }
    return value;
  }

  /** A cache hit in memoized recursion: an instant answer, no new work. */
  memoHit(label: string, value: unknown, line: number | null) {
    const above = this.frameIds[this.frameIds.length - 1];
    const parent = this.tree.some((n) => n.id === above) ? above : null;
    const id = this.nextId++;
    this.calls++;
    this.tree.push({ id, parent, label });
    this.nodeStatus.set(id, { id, status: 'memo', value: show(value) });
    this.snap(
      'line',
      line,
      `${label} is already in the memo: 📦 ${show(value)}, straight from memory.`,
    );
  }

  /** Set a local variable on the top plate. */
  local(name: string, value: unknown, line: number | null, message?: string) {
    const f = this.top;
    const existing = f.locals.find((l) => l[0] === name);
    if (existing) existing[1] = show(value);
    else f.locals.push([name, show(value)]);
    f.fresh = name;
    this.snap('line', line, message ?? `${name} is now ${show(value)}.`);
  }

  /** A plain step on the top plate. */
  line(line: number | null, message: string) {
    this.snap('line', line, message);
  }

  /** console.log: a quick built-in plate, and a line in the console. */
  log(value: unknown, line: number | null) {
    const text = typeof value === 'string' ? value : show(value);
    this.call(
      'console.log',
      { value },
      line,
      () => {
        this.output.push(text);
        return undefined;
      },
      { builtin: true },
    );
  }

  /** Run a whole program inside a main() plate, like article #1. */
  static run(
    program: (t: Tracer) => void,
    startMessage = 'The file starts running inside main().',
  ): Trace {
    const t = new Tracer();
    t.snap('start', null, 'Before anything runs, the call stack is empty.');
    let overflow = false;
    try {
      t.call(
        'main',
        {},
        null,
        () => {
          t.line(null, startMessage);
          program(t);
          return undefined;
        },
        { root: true },
      );
    } catch (e) {
      if (!(e instanceof Overflow)) throw e;
      overflow = true;
    }
    if (!overflow) t.snap('end', null, 'main() is done and the stack is empty again.');
    return { steps: t.steps, output: t.output, tree: t.tree, overflow };
  }
}

// ─── #6 CallStackTower presets ────────────────────────────────────────

export interface StackPreset {
  id: string;
  name: string;
  code: string[];
  run: () => Trace;
}

const ORDER_CODE = [
  'function applyDiscount(amount) {',
  '  return amount * 0.9;',
  '}',
  '',
  'function calculateTotal(price, qty) {',
  '  const subtotal = price * qty;',
  '  return applyDiscount(subtotal);',
  '}',
  '',
  'function placeOrder() {',
  '  const total = calculateTotal(200, 3);',
  '  console.log("Pay ₹" + total);',
  '}',
  '',
  'placeOrder();',
];

const GREETING_CODE = [
  'function shout(text) {',
  '  return text.toUpperCase() + "!";',
  '}',
  '',
  'function welcome(name) {',
  '  return shout("hello " + name);',
  '}',
  '',
  'console.log(welcome("riya"));',
];

const FOREVER_CODE = ['function forever(n) {', '  return forever(n + 1);', '}', '', 'forever(1);'];

export const STACK_PRESETS: StackPreset[] = [
  {
    id: 'order',
    name: 'Order a chai',
    code: ORDER_CODE,
    run: () =>
      Tracer.run((t) => {
        const applyDiscount = (amount: number) =>
          t.call(
            'applyDiscount',
            { amount },
            7,
            () => {
              t.line(2, `amount * 0.9 is ${amount * 0.9}.`);
              return amount * 0.9;
            },
            { slot: 'return ▢', returnLine: 2 },
          );
        const calculateTotal = (price: number, qty: number) =>
          t.call(
            'calculateTotal',
            { price, qty },
            11,
            () => {
              const subtotal = price * qty;
              t.local(
                'subtotal',
                subtotal,
                6,
                `subtotal = ${price} * ${qty}, which is ${subtotal}.`,
              );
              return applyDiscount(subtotal);
            },
            { slot: 'const total = ▢', returnLine: 7 },
          );
        const placeOrder = () =>
          t.call(
            'placeOrder',
            {},
            15,
            () => {
              const total = calculateTotal(200, 3);
              t.local('total', total, 11);
              t.log('Pay ₹' + total, 12);
              return undefined;
            },
            { returnLine: 13 },
          );
        placeOrder();
      }),
  },
  {
    id: 'greeting',
    name: 'Greeting chain',
    code: GREETING_CODE,
    run: () =>
      Tracer.run((t) => {
        const shout = (text: string) =>
          t.call(
            'shout',
            { text },
            6,
            () => {
              const upper = t.call('text.toUpperCase', {}, 2, () => text.toUpperCase(), {
                builtin: true,
                slot: 'return ▢ + "!"',
              });
              return upper + '!';
            },
            { slot: 'return ▢', returnLine: 2 },
          );
        const welcome = (name: string) =>
          t.call('welcome', { name }, 9, () => shout('hello ' + name), {
            slot: 'console.log(▢)',
            returnLine: 6,
          });
        t.log(welcome('riya'), 9);
      }),
  },
  {
    id: 'overflow',
    name: 'Stack overflow 💥',
    code: FOREVER_CODE,
    run: () =>
      Tracer.run((t) => {
        const forever = (n: number): number =>
          t.call('forever', { n }, n === 1 ? 5 : 2, () => forever(n + 1), { slot: 'return ▢' });
        forever(1);
      }),
  },
];

// ─── #9 RecursionTree presets ─────────────────────────────────────────

export const COUNTDOWN_CODE = [
  'function countdown(n) {',
  '  if (n === 0) {',
  '    console.log("Liftoff! 🚀");',
  '    return;',
  '  }',
  '  console.log(n);',
  '  countdown(n - 1);',
  '}',
];

export function traceCountdown(n: number): Trace {
  return Tracer.run((t) => {
    const countdown = (k: number): void =>
      t.call(
        'countdown',
        { n: k },
        k === n ? null : 7,
        () => {
          if (k === 0) {
            t.line(2, 'n === 0: the base case. STOP here 🛑');
            t.log('Liftoff! 🚀', 3);
            return;
          }
          t.line(2, `n is ${k}, not 0, so keep going.`);
          t.log(k, 6);
          countdown(k - 1);
        },
        { returnLine: k === 0 ? 4 : 8 },
      );
    countdown(n);
  });
}

export const FACTORIAL_CODE = [
  'function factorial(n) {',
  '  if (n <= 1) return 1;',
  '  return n * factorial(n - 1);',
  '}',
];

export function traceFactorial(n: number): Trace {
  return Tracer.run((t) => {
    const factorial = (k: number): number =>
      t.call(
        'factorial',
        { n: k },
        k === n ? null : 3,
        () => {
          if (k <= 1) {
            t.line(2, `n is ${k}: the base case. Return 1 without calling again.`);
            return 1;
          }
          const rest = factorial(k - 1);
          t.line(3, `${k} * ${rest} = ${k * rest}`);
          return k * rest;
        },
        {
          slot: k === n ? 'console.log(▢)' : `${k + 1} * ▢`,
          returnLine: k <= 1 ? 2 : 3,
          label: `factorial(${k})`,
        },
      );
    t.log(factorial(n), null);
  });
}

export const NO_BASE_CODE = [
  'function factorial(n) {',
  '  return n * factorial(n - 1);',
  '}',
  '',
  'factorial(5);',
];

export function traceNoBase(): Trace {
  return Tracer.run((t) => {
    const factorial = (k: number): number =>
      t.call('factorial', { n: k }, k === 5 ? 5 : 2, () => k * factorial(k - 1), {
        slot: k === 5 ? undefined : `${k + 1} * ▢`,
      });
    factorial(5);
  });
}

export const FIB_CODE = [
  'function fib(n) {',
  '  if (n <= 1) return n;',
  '  return fib(n - 1) + fib(n - 2);',
  '}',
];

export const FIB_MEMO_CODE = [
  'function fib(n, memo = {}) {',
  '  if (n in memo) return memo[n];',
  '  if (n <= 1) return n;',
  '  memo[n] = fib(n - 1, memo) + fib(n - 2, memo);',
  '  return memo[n];',
  '}',
];

export function traceFib(n: number, memoize: boolean): Trace {
  return Tracer.run((t) => {
    const memo: Record<number, number> = {};
    const fib = (k: number, slot: string): number => {
      if (memoize && k in memo) {
        t.memoHit(`fib(${k})`, memo[k], 2);
        return memo[k];
      }
      return t.call(
        'fib',
        { n: k },
        null,
        () => {
          if (k <= 1) {
            t.line(memoize ? 3 : 2, `n is ${k}: the base case. Return ${k}.`);
            return k;
          }
          const a = fib(k - 1, `▢ + fib(${k - 2})`);
          const b = fib(k - 2, `${a} + ▢`);
          if (memoize) memo[k] = a + b;
          t.line(memoize ? 4 : 3, `${a} + ${b} = ${a + b}`);
          return a + b;
        },
        { slot, label: `fib(${k})` },
      );
    };
    t.log(fib(n, 'console.log(▢)'), null);
  });
}

/** Plain fib, counting invocations. Used by the mini chart and the tests. */
export function fibCalls(n: number, memoize: boolean): { value: number; calls: number } {
  let calls = 0;
  const memo: Record<number, number> = {};
  const fib = (k: number): number => {
    calls++;
    if (memoize && k in memo) return memo[k];
    if (k <= 1) return k;
    const v = fib(k - 1) + fib(k - 2);
    if (memoize) memo[k] = v;
    return v;
  };
  return { value: fib(n), calls };
}
