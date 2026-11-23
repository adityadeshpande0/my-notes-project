/**
 * The loop simulator behind every visual in "Loops". Plain TypeScript, no React.
 *
 * Nothing here runs code the reader typed. Each loop is described by
 * structured settings (a start value, an operator, an update…) and stepped
 * through by hand, one phase at a time. Every comparison and update uses the
 * real JavaScript operator, and loopSim.test.ts runs real loops with the same
 * settings to check the simulator gets the same output.
 *
 * The guard: a simulation stops after GUARD laps, so an infinite loop shows a
 * friendly warning instead of freezing the page.
 */

export const GUARD = 50;

// ─── #2 The for loop builder ──────────────────────────────────────────

export type CmpOp = '<' | '<=' | '>' | '>=' | '!==';
export const CMP_OPS: CmpOp[] = ['<', '<=', '>', '>=', '!=='];
export type Update = 'i++' | 'i--' | 'i += 2' | 'i += 3' | 'i -= 2' | 'i *= 2';
export const UPDATES: Update[] = ['i++', 'i--', 'i += 2', 'i += 3', 'i -= 2', 'i *= 2'];

export interface ForSpec {
  start: number;
  op: CmpOp;
  limit: number;
  update: Update;
}

/** The real comparison. */
export function compare(a: number, op: CmpOp, b: number): boolean {
  switch (op) {
    case '<':
      return a < b;
    case '<=':
      return a <= b;
    case '>':
      return a > b;
    case '>=':
      return a >= b;
    case '!==':
      return a !== b;
  }
}

/** The update. Each shortcut is plain arithmetic: i += 2 means i = i + 2. */
export function applyUpdate(i: number, update: Update): number {
  switch (update) {
    case 'i++':
      return i + 1;
    case 'i--':
      return i - 1;
    case 'i += 2':
      return i + 2;
    case 'i += 3':
      return i + 3;
    case 'i -= 2':
      return i - 2;
    case 'i *= 2':
      return i * 2;
  }
}

export type ForPhase = 'init' | 'check' | 'body' | 'update' | 'end' | 'guard';

export interface ForStep {
  phase: ForPhase;
  /** The value of i at this point. */
  i: number;
  /** For 'check': the condition's answer. */
  ok?: boolean;
  /** Laps (body runs) completed so far. */
  laps: number;
  /** How many times the update has run. */
  updates: number;
  output: string[];
  message: string;
}

export const condText = (s: ForSpec) => `i ${s.op} ${s.limit}`;

/**
 * Step through `for (let i = start; i op limit; update) { body(i) }`.
 * `body` returns what console.log prints (default: i itself).
 */
export function forSteps(spec: ForSpec, body: (i: number) => string = String): ForStep[] {
  const steps: ForStep[] = [];
  const out: string[] = [];
  let i = spec.start;
  let laps = 0;
  let updates = 0;
  const push = (phase: ForPhase, message: string, ok?: boolean) =>
    steps.push({ phase, i, ok, laps, updates, output: [...out], message });

  push('init', `① Start: let i = ${spec.start} creates the counter. This part runs only once.`);
  for (;;) {
    const ok = compare(i, spec.op, spec.limit);
    if (ok && laps >= GUARD) {
      push('guard', `🔥 Still true after ${GUARD} laps. This loop would never stop.`, ok);
      return steps;
    }
    push(
      'check',
      ok
        ? `② Check: ${i} ${spec.op} ${spec.limit} is true ✓, so run another lap.`
        : laps === 0
          ? `② Check: ${i} ${spec.op} ${spec.limit} is false ✗. The condition was false from the start, so the body never runs.`
          : `② Check: ${i} ${spec.op} ${spec.limit} is false ✗, so the loop ends.`,
      ok,
    );
    if (!ok) break;
    out.push(body(i));
    laps++;
    push('body', `Body: console.log(i) prints ${body(i)}. That's lap ${laps}.`);
    const before = i;
    i = applyUpdate(i, spec.update);
    updates++;
    push('update', `③ Update: ${spec.update} turns ${before} into ${i}.`);
  }
  push(
    'end',
    laps === 0
      ? 'The loop is over before it began: 0 laps.'
      : `The condition is false, so the loop ends after ${laps} lap${laps === 1 ? '' : 's'}. i is now ${i}.`,
  );
  return steps;
}

/** Why a loop never ends, in one sentence (for the guard panel). */
export function whyInfinite(spec: ForSpec): string {
  const up = spec.op === '<' || spec.op === '<=';
  const down = spec.op === '>' || spec.op === '>=';
  const grows = spec.update === 'i++' || spec.update === 'i += 2' || spec.update === 'i += 3';
  const shrinks = spec.update === 'i--' || spec.update === 'i -= 2';
  if (spec.update === 'i *= 2' && spec.start === 0)
    return '`i` starts at 0, and 0 × 2 is still 0. It never moves, so the condition never changes.';
  if (up && shrinks)
    return `\`i\` is moving away from the stopping point: \`${spec.update}\` makes it smaller, but the loop only stops when \`${condText(spec)}\` becomes false.`;
  if (down && (grows || spec.update === 'i *= 2'))
    return `\`i\` is moving away from the stopping point: \`${spec.update}\` makes it bigger, but the loop only stops when \`${condText(spec)}\` becomes false.`;
  if (spec.op === '!==')
    return `The loop only stops when \`i\` lands exactly on ${spec.limit}, and \`${spec.update}\` jumps right past it (or walks the other way).`;
  return `Nothing makes \`${condText(spec)}\` false, so the loop keeps going.`;
}

/** The smallest change that makes the loop finish. */
export function fixLoop(spec: ForSpec): ForSpec {
  const wantsUp =
    spec.op === '<' || spec.op === '<=' || (spec.op === '!==' && spec.start < spec.limit);
  return { ...spec, update: wantsUp ? 'i++' : 'i--' };
}

// ─── #3 while vs do...while ───────────────────────────────────────────

export type LaneKind = 'while' | 'doWhile';
export type LanePhase = 'start' | 'check' | 'body' | 'end' | 'guard';

export interface LaneStep {
  phase: LanePhase;
  value: number;
  ok?: boolean;
  laps: number;
  output: string[];
  message: string;
}

export interface LaneSpec {
  start: number;
  test: (v: number) => boolean;
  /** The condition as code, e.g. "level < 100". */
  cond: string;
  /** One lap: returns the new value and what it prints. `lap` counts from 0. */
  body: (v: number, lap: number) => { value: number; log: string };
  /** What one lap does, as code. */
  bodyCode: string;
}

export function laneSteps(kind: LaneKind, spec: LaneSpec): LaneStep[] {
  const steps: LaneStep[] = [];
  const out: string[] = [];
  let v = spec.start;
  let laps = 0;
  const push = (phase: LanePhase, message: string, ok?: boolean) =>
    steps.push({ phase, value: v, ok, laps, output: [...out], message });

  const runBody = () => {
    const r = spec.body(v, laps);
    v = r.value;
    out.push(r.log);
    laps++;
    push('body', `Lap ${laps}: ${spec.bodyCode}. ${r.log}`);
  };
  const check = () => {
    const ok = spec.test(v);
    push(
      'check',
      `Check ${spec.cond.replace(/^\w+/, String(v))}: ${ok ? 'true, go again' : 'false, stop'}.`,
      ok,
    );
    return ok;
  };

  push('start', kind === 'while' ? 'while checks first…' : 'do...while runs the body first…');
  if (kind === 'doWhile') runBody();
  while (check()) {
    if (laps >= GUARD) {
      push('guard', `🔥 Still going after ${GUARD} laps.`);
      return steps;
    }
    runBody();
  }
  push(
    'end',
    laps === 0
      ? 'Done ✓ without a single lap.'
      : `Done ✓ after ${laps} lap${laps === 1 ? '' : 's'}.`,
  );
  return steps;
}

export const CHAI_STARTS = [0, 25, 50, 75, 100, 120];

export const chaiSpec = (start: number): LaneSpec => ({
  start,
  test: (level) => level < 100,
  cond: 'level < 100',
  body: (level) => {
    level += 25;
    return { value: level, log: `Cup at ${level}%` };
  },
  bodyCode: 'level += 25',
});

/**
 * A small seeded random generator (mulberry32). The same seed always gives
 * the same rolls, so both lanes, and the tests, see identical dice.
 */
export function seededRolls(seed: number, count = GUARD + 5): number[] {
  let a = seed >>> 0;
  const rolls: number[] = [];
  for (let k = 0; k < count; k++) {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    rolls.push(1 + Math.floor(r * 6));
  }
  return rolls;
}

export const diceSpec = (rolls: number[]): LaneSpec => ({
  start: 0,
  test: (roll) => roll !== 6,
  cond: 'roll !== 6',
  body: (_, lap) => ({ value: rolls[lap], log: `Rolled a ${rolls[lap]}` }),
  bodyCode: 'roll = rollDie()',
});

// ─── #4 for...of and for...in ─────────────────────────────────────────

/** The values for...of really gives, collected from a real loop. */
export function collectOf(iterable: Iterable<unknown>): unknown[] {
  const got: unknown[] = [];
  for (const v of iterable) got.push(v);
  return got;
}

/** The keys for...in really gives, collected from a real loop. */
export function collectIn(obj: object): string[] {
  const got: string[] = [];
  for (const k in obj) got.push(k);
  return got;
}

// ─── #5 break and continue ────────────────────────────────────────────

export type House = 'open' | 'closed' | 'no-stock';
export const HOUSE_CYCLE: House[] = ['open', 'closed', 'no-stock'];
export const DEFAULT_STREET: House[] = [
  'open',
  'closed',
  'open',
  'open',
  'no-stock',
  'open',
  'open',
];

export type Visit = 'deliver' | 'continue' | 'break';

export interface RouteStep {
  phase: 'start' | 'visit' | 'end';
  /** House index (for 'visit'), or where the loop stopped (for 'end'). */
  i: number;
  outcome?: Visit;
  /** What happened at each house so far. */
  visits: Visit[];
  output: string[];
  message: string;
}

export interface RouteRules {
  useContinue: boolean;
  useBreak: boolean;
}

export function routeSteps(houses: House[], rules: RouteRules): RouteStep[] {
  const steps: RouteStep[] = [];
  const visits: Visit[] = [];
  const out: string[] = [];
  steps.push({
    phase: 'start',
    i: -1,
    visits: [],
    output: [],
    message: 'The scooter sets off. i starts at 0.',
  });
  let i = 0;
  for (; i < houses.length; i++) {
    let outcome: Visit;
    let message: string;
    if (rules.useContinue && houses[i] === 'closed') {
      outcome = 'continue';
      message = `House ${i} is closed, so continue: skip the rest of this lap and move on.`;
    } else if (rules.useBreak && houses[i] === 'no-stock') {
      outcome = 'break';
      message =
        'Out of stock! break exits the loop immediately. The remaining houses are never checked.';
    } else {
      outcome = 'deliver';
      out.push(`Delivered to house ${i}`);
      message =
        houses[i] === 'open'
          ? `House ${i} is open: deliver 📦.`
          : `House ${i} is ${houses[i]}, but there's no if for that any more, so it gets a delivery anyway.`;
    }
    visits.push(outcome);
    steps.push({ phase: 'visit', i, outcome, visits: [...visits], output: [...out], message });
    if (outcome === 'break') break;
  }
  steps.push({
    phase: 'end',
    i,
    visits: [...visits],
    output: [...out],
    message:
      visits[visits.length - 1] === 'break'
        ? `The loop ended early with break. ${houses.length - visits.length} house(s) not visited.`
        : `i is ${houses.length}, and ${houses.length} < ${houses.length} is false. Every house was visited.`,
  });
  return steps;
}

// ─── #6 Nested loops ──────────────────────────────────────────────────

export type GridPattern = 'table' | 'triangle' | 'pairs';

export interface GridStep {
  phase: 'start' | 'row' | 'cell' | 'end';
  row: number;
  col: number;
  /** Body runs so far. */
  ops: number;
  message: string;
}

/** Where the inner loop starts and stops for each pattern. */
export const innerRange = (pattern: GridPattern, row: number, n: number): [number, number] =>
  pattern === 'table' ? [1, n] : pattern === 'triangle' ? [1, row] : [row + 1, n];

export function gridSteps(pattern: GridPattern, n: number): GridStep[] {
  const steps: GridStep[] = [
    {
      phase: 'start',
      row: 0,
      col: 0,
      ops: 0,
      message: `n = ${n}. The outer loop is about to start.`,
    },
  ];
  let ops = 0;
  for (let row = 1; row <= n; row++) {
    const [from, to] = innerRange(pattern, row, n);
    steps.push({
      phase: 'row',
      row,
      col: from,
      ops,
      message:
        from > to
          ? `Outer lap: row = ${row}. The inner loop's condition is already false, so it runs 0 times.`
          : `Outer lap: row = ${row}. The inner loop starts again from col = ${from}.`,
    });
    for (let col = from; col <= to; col++) {
      ops++;
      steps.push({
        phase: 'cell',
        row,
        col,
        ops,
        message: `Inner lap: row = ${row}, col = ${col}. The body has run ${ops} times.`,
      });
    }
  }
  steps.push({
    phase: 'end',
    row: n,
    col: 0,
    ops,
    message: `Done. The body ran ${ops} times in total.`,
  });
  return steps;
}

export const gridTotal = (pattern: GridPattern, n: number) =>
  pattern === 'table' ? n * n : pattern === 'triangle' ? (n * (n + 1)) / 2 : (n * (n - 1)) / 2;
