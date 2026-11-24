/**
 * The scope simulator behind "Scope, Hoisting & Closures". Plain TypeScript.
 *
 * It models scopes (environments) with their variables, the call stack, and
 * closures (a function plus a link to the environment it was created in).
 * Each preset is a short step script written against this model; nothing
 * parses or runs user code. Lookups walk the environment chain for real, so
 * the 🔍 path is computed, not drawn by hand.
 *
 * scopeSim.test.ts keeps each preset's real JavaScript source, runs it, and
 * checks the simulator prints exactly the same output and error message.
 */

export type DeclKind = 'var' | 'let' | 'const' | 'function' | 'param';

export interface VarSnap {
  name: string;
  /** The value as code ("\"Masala\"", "0", "ƒ printChai"). */
  value: string;
  kind: DeclKind;
  /** In the Temporal Dead Zone (declared with let/const, line not reached yet). */
  tdz?: boolean;
}

export interface EnvSnap {
  id: string;
  name: string;
  parent: string | null;
  vars: VarSnap[];
  /** False once its function call has finished (it may live on in a backpack). */
  alive: boolean;
}

export interface FrameSnap {
  id: string;
  name: string;
  envId: string;
}

export interface FnSnap {
  id: string;
  label: string;
  /** The environment it was created in: what its backpack links to. */
  envId: string;
}

export interface SearchSnap {
  name: string;
  /** Every room visited, in order, and whether the name was found there. */
  path: { envId: string; found: boolean }[];
}

export interface SimStep {
  line: number | null;
  envs: EnvSnap[];
  frames: FrameSnap[];
  fns: FnSnap[];
  output: string[];
  error?: string;
  message: string;
  search?: SearchSnap;
  /** "envId:name" of a variable that just changed. */
  changed?: string;
  phase?: 'setup' | 'run';
  /** For "pause on error": this step never runs in real JavaScript. */
  skipped?: boolean;
}

export class SimError extends Error {}

/** What console.log prints for a value written as code: strings lose their quotes. */
export const printed = (code: string) =>
  code.startsWith('"') ? (JSON.parse(code) as string) : code;

export class Sim {
  steps: SimStep[] = [];
  output: string[] = [];
  error?: string;
  phase?: 'setup' | 'run';
  private envs = new Map<string, EnvSnap>();
  private order: string[] = [];
  private frames: FrameSnap[] = [];
  private fns: FnSnap[] = [];

  env(id: string, name: string, parent: string | null) {
    this.envs.set(id, { id, name, parent, vars: [], alive: true });
    this.order.push(id);
    return id;
  }

  private v(envId: string, name: string) {
    return this.envs.get(envId)!.vars.find((x) => x.name === name);
  }

  /** Create a slot (phase 1 of a scope): var → undefined, let/const → TDZ. */
  declare(envId: string, name: string, kind: DeclKind, value?: string) {
    const env = this.envs.get(envId)!;
    const existing = env.vars.find((x) => x.name === name);
    const slot: VarSnap = {
      name,
      kind,
      value: value ?? 'undefined',
      tdz: kind === 'let' || kind === 'const' ? value === undefined : undefined,
    };
    if (existing) Object.assign(existing, slot);
    else env.vars.push(slot);
  }

  set(envId: string, name: string, value: string) {
    const slot = this.v(envId, name)!;
    slot.value = value;
    slot.tdz = false;
    return `${envId}:${name}`;
  }

  /** Walk outward from `from` looking for `name`, exactly like the scope chain. */
  search(from: string, name: string): { search: SearchSnap; envId: string | null } {
    const path: SearchSnap['path'] = [];
    let id: string | null = from;
    while (id) {
      const env: EnvSnap = this.envs.get(id)!;
      const hit = env.vars.some((x) => x.name === name);
      path.push({ envId: id, found: hit });
      if (hit) return { search: { name, path }, envId: id };
      id = env.parent;
    }
    return { search: { name, path }, envId: null };
  }

  /** Read a variable through the scope chain. Throws the V8-worded ReferenceError. */
  read(from: string, name: string): { value: string; search: SearchSnap; envId: string } {
    const r = this.search(from, name);
    if (!r.envId) throw new SimError(`ReferenceError: ${name} is not defined`);
    const slot = this.v(r.envId, name)!;
    if (slot.tdz)
      throw new SimError(`ReferenceError: Cannot access '${name}' before initialization`);
    return { value: slot.value, search: r.search, envId: r.envId };
  }

  push(name: string, envId: string) {
    this.frames.push({ id: `${name}#${this.steps.length}`, name, envId });
  }

  /** The call finishes: its plate comes off; its scope may live on in a backpack. */
  pop() {
    const f = this.frames.pop();
    if (f) this.envs.get(f.envId)!.alive = false;
  }

  /** Leave a block: blocks have no plate, their room just stops existing. */
  leave(envId: string) {
    this.envs.get(envId)!.alive = false;
    this.order = this.order.filter((id) => id !== envId);
  }

  fn(id: string, label: string, envId: string) {
    this.fns.push({ id, label, envId });
  }

  log(code: string) {
    this.output.push(printed(code));
  }

  fail(message: string) {
    this.error = message;
  }

  snap(line: number | null, message: string, extra: Partial<SimStep> = {}) {
    this.steps.push({
      line,
      envs: this.order.map((id) => {
        const e = this.envs.get(id)!;
        return { ...e, vars: e.vars.map((x) => ({ ...x })) };
      }),
      frames: this.frames.map((f) => ({ ...f })),
      fns: this.fns.map((f) => ({ ...f })),
      output: [...this.output],
      error: this.error,
      message,
      phase: this.phase,
      ...extra,
    });
  }

  /** Run a script; an uncaught SimError stops the program, like real JS. */
  static run(script: (s: Sim) => void): Sim {
    const s = new Sim();
    try {
      script(s);
    } catch (e) {
      if (!(e instanceof SimError)) throw e;
      s.fail(e.message);
      s.snap(s.steps.at(-1)?.line ?? null, `💥 Uncaught ${e.message}. The program stops here.`);
    }
    return s;
  }
}

// ─── #1 ScopeChain ────────────────────────────────────────────────────

export interface ScopePreset {
  id: string;
  code: string[];
  run: () => Sim;
  /** How the rooms are WRITTEN: room id → parent room id. */
  rooms: { id: string; name: string; parent: string | null }[];
}

export function lexicalPreset(moved: boolean): ScopePreset {
  const code = moved
    ? [
        'const chai = "Masala";',
        '',
        'function party() {',
        '  const chai = "Ginger";',
        '  function printChai() {',
        '    console.log(chai);',
        '  }',
        '  printChai();',
        '}',
        '',
        'party();',
      ]
    : [
        'const chai = "Masala";',
        '',
        'function printChai() {',
        '  console.log(chai);',
        '}',
        '',
        'function party() {',
        '  const chai = "Ginger";',
        '  printChai();          // what does this print?',
        '}',
        '',
        'party();',
      ];
  const L = moved
    ? { decl: 1, partyCall: 11, ginger: 4, printCall: 8, log: 6 }
    : { decl: 1, partyCall: 12, ginger: 8, printCall: 9, log: 4 };
  return {
    id: moved ? 'lexical-moved' : 'lexical',
    code,
    rooms: [
      { id: 'global', name: 'Global', parent: null },
      { id: 'party', name: 'party', parent: 'global' },
      { id: 'printChai', name: 'printChai', parent: moved ? 'party' : 'global' },
    ],
    run: () =>
      Sim.run((s) => {
        s.env('global', 'Global', null);
        s.declare('global', 'chai', 'const');
        if (!moved) s.declare('global', 'printChai', 'function', 'ƒ printChai');
        s.declare('global', 'party', 'function', 'ƒ party');
        s.snap(null, 'Before running, Global gets its variables and functions.');
        s.set('global', 'chai', '"Masala"');
        s.snap(L.decl, 'chai in Global is "Masala".');
        s.env('party', 'party', 'global');
        s.declare('party', 'chai', 'const');
        if (moved) s.declare('party', 'printChai', 'function', 'ƒ printChai');
        s.push('party', 'party');
        s.snap(
          L.partyCall,
          'party() is called: a plate goes on the stack, and party’s room is ready.',
        );
        s.set('party', 'chai', '"Ginger"');
        s.snap(L.ginger, 'party has its own chai: "Ginger".');
        // printChai's room hangs off where printChai was WRITTEN.
        s.env('printChai', 'printChai', moved ? 'party' : 'global');
        s.push('printChai', 'printChai');
        s.snap(L.printCall, 'party calls printChai(). A second plate goes on top.');
        const r = s.read('printChai', 'chai');
        s.snap(
          L.log,
          moved
            ? `The search starts in printChai, then goes out to party, where printChai is written: ${r.value}.`
            : `The search starts in printChai, then goes out to Global, where printChai is written: ${r.value}. It never looks in party.`,
          { search: r.search },
        );
        s.log(r.value);
        s.snap(L.log, `It prints ${printed(r.value)}.`);
        s.pop();
        s.pop();
        s.snap(null, 'Both calls are done.');
      }),
  };
}

export const threeLevelsPreset: ScopePreset = {
  id: 'levels',
  code: [
    'const city = "Mumbai";',
    'function outer() {',
    '  const area = "Bandra";',
    '  function inner() {',
    '    const shop = "Chai Point";',
    '    console.log(shop, area, city);',
    '    console.log(pincode);',
    '  }',
    '  inner();',
    '}',
    'outer();',
  ],
  rooms: [
    { id: 'global', name: 'Global', parent: null },
    { id: 'outer', name: 'outer', parent: 'global' },
    { id: 'inner', name: 'inner', parent: 'outer' },
  ],
  run: () =>
    Sim.run((s) => {
      s.env('global', 'Global', null);
      s.declare('global', 'city', 'const', '"Mumbai"');
      s.declare('global', 'outer', 'function', 'ƒ outer');
      s.snap(1, 'Global: city is "Mumbai".');
      s.env('outer', 'outer', 'global');
      s.declare('outer', 'area', 'const', '"Bandra"');
      s.declare('outer', 'inner', 'function', 'ƒ inner');
      s.push('outer', 'outer');
      s.snap(11, 'outer() runs: area is "Bandra".');
      s.env('inner', 'inner', 'outer');
      s.declare('inner', 'shop', 'const', '"Chai Point"');
      s.push('inner', 'inner');
      s.snap(9, 'inner() runs: shop is "Chai Point".');
      const parts: string[] = [];
      for (const name of ['shop', 'area', 'city']) {
        const r = s.read('inner', name);
        parts.push(printed(r.value));
        s.snap(
          6,
          `Looking for ${name}: found ${r.value}, ${r.search.path.length - 1} room${r.search.path.length === 2 ? '' : 's'} out.`,
          {
            search: r.search,
          },
        );
      }
      s.output.push(parts.join(' '));
      s.snap(6, `Each variable was found at a different level. It prints ${parts.join(' ')}.`);
      const miss = s.search('inner', 'pincode');
      s.snap(7, 'pincode: not in inner, not in outer, not in Global…', { search: miss.search });
      s.read('inner', 'pincode');
    }),
};

export const blockPreset: ScopePreset = {
  id: 'block',
  code: [
    'function order() {',
    '  if (true) {',
    '    let size = "large";',
    '    var sugar = 2;',
    '  }',
    '  console.log(sugar);',
    '  console.log(size);',
    '}',
    'order();',
  ],
  rooms: [
    { id: 'global', name: 'Global', parent: null },
    { id: 'order', name: 'order', parent: 'global' },
    { id: 'block', name: 'if { } block', parent: 'order' },
  ],
  run: () =>
    Sim.run((s) => {
      s.env('global', 'Global', null);
      s.declare('global', 'order', 'function', 'ƒ order');
      s.env('order', 'order', 'global');
      // var ignores the block: its slot is made in the FUNCTION room.
      s.declare('order', 'sugar', 'var');
      s.push('order', 'order');
      s.snap(9, 'order() runs. var sugar already has a slot in order’s room (var ignores blocks).');
      s.env('block', 'if { } block', 'order');
      s.declare('block', 'size', 'let');
      s.snap(2, 'Entering the block makes a block room. let size lives here.');
      s.set('block', 'size', '"large"');
      s.snap(3, 'size = "large", inside the block room.');
      const c = s.set('order', 'sugar', '2');
      s.snap(4, 'sugar = 2, but in order’s room: var walked through the block’s walls.', {
        changed: c,
      });
      s.leave('block');
      s.snap(5, 'The block ends. Its room (and size) is gone.');
      const r = s.read('order', 'sugar');
      s.log(r.value);
      s.snap(6, 'sugar is found in order’s room: 2.', { search: r.search });
      const miss = s.search('order', 'size');
      s.snap(7, 'size: not in order, not in Global. The block room is already gone.', {
        search: miss.search,
      });
      s.read('order', 'size');
    }),
};

// ─── #2 HoistingPhases ────────────────────────────────────────────────

export interface HoistLine {
  code: string;
  /** A declaration found in phase ①. */
  decl?: { name: string; kind: DeclKind; fn?: string };
  /** What running the line does in phase ②. */
  run?: (s: Sim) => string | void;
}

export interface HoistPreset {
  id: string;
  name: string;
  lines: HoistLine[];
  /** Predict mode: the options for each console.log line (by index). */
  predict?: Record<number, string[]>;
}

const logVar = (name: string) => (s: Sim) => {
  const r = s.read('global', name);
  s.log(r.value);
  return `reads ${name}: ${r.value}`;
};

export const HOIST_PRESETS: HoistPreset[] = [
  {
    id: 'var-let',
    name: 'var vs let',
    lines: [
      { code: 'console.log(a);', run: logVar('a') },
      {
        code: 'var a = 5;',
        decl: { name: 'a', kind: 'var' },
        run: (s) => void s.set('global', 'a', '5'),
      },
      { code: 'console.log(b);', run: logVar('b') },
      {
        code: 'let b = 5;',
        decl: { name: 'b', kind: 'let' },
        run: (s) => void s.set('global', 'b', '5'),
      },
    ],
  },
  {
    id: 'functions',
    name: 'Functions are ready early',
    lines: [
      {
        code: 'sayHi();',
        run: (s) => {
          s.read('global', 'sayHi');
          s.log('"Hi!"');
          return 'sayHi is already a complete function, so it runs';
        },
      },
      {
        code: 'function sayHi() { console.log("Hi!"); }',
        decl: { name: 'sayHi', kind: 'function', fn: 'ƒ sayHi' },
      },
      {
        code: 'greet();',
        run: (s) => {
          s.read('global', 'greet');
          s.log('"Hello!"');
        },
      },
      {
        code: 'const greet = () => console.log("Hello!");',
        decl: { name: 'greet', kind: 'const' },
        run: (s) => void s.set('global', 'greet', 'ƒ greet'),
      },
    ],
  },
  {
    id: 'predict',
    name: 'Predict first',
    lines: [
      { code: 'console.log(x);', run: logVar('x') },
      {
        code: 'var x = 1;',
        decl: { name: 'x', kind: 'var' },
        run: (s) => void s.set('global', 'x', '1'),
      },
      { code: 'console.log(x);', run: logVar('x') },
      {
        code: 'x = x + 1;',
        run: (s) => {
          const r = s.read('global', 'x');
          s.set('global', 'x', String(Number(r.value) + 1));
        },
      },
      {
        code: 'console.log(add(x, 3));',
        run: (s) => {
          s.read('global', 'add');
          const x = Number(s.read('global', 'x').value);
          s.log(String(x + 3));
        },
      },
      {
        code: 'function add(a, b) { return a + b; }',
        decl: { name: 'add', kind: 'function', fn: 'ƒ add' },
      },
      { code: 'console.log(x);', run: logVar('x') },
    ],
    predict: {
      0: ['undefined', '1', 'ReferenceError'],
      2: ['1', 'undefined', '2'],
      4: ['5', 'ReferenceError', '4'],
      6: ['2', '1', 'undefined'],
    },
  },
];

/**
 * Both phases, step by step. With `pause` on (real JavaScript), the first
 * uncaught error stops everything after it. With it off, each line is
 * tried on its own ("pretend"), so you can see every result.
 */
export function hoistSteps(p: HoistPreset, pause: boolean): Sim {
  const s = new Sim();
  s.env('global', 'Global', null);
  s.phase = 'setup';
  s.snap(
    null,
    '① Setting up memory: JavaScript scans the code for declarations. Nothing runs yet.',
  );
  p.lines.forEach((l, i) => {
    if (!l.decl) return;
    const { name, kind, fn } = l.decl;
    s.declare('global', name, kind, kind === 'function' ? fn : undefined);
    s.snap(
      i + 1,
      kind === 'var'
        ? `var ${name}: a slot is made and set to undefined.`
        : kind === 'function'
          ? `function ${name}: the whole function is ready to call.`
          : `${kind} ${name}: a slot is made, but it's not ready yet (TDZ ⛔).`,
    );
  });
  s.phase = 'run';
  s.snap(
    null,
    '② Running: now the code runs top to bottom. Nothing moved; the memory was just set up first.',
  );
  let stopped = false;
  p.lines.forEach((l, i) => {
    if (stopped) {
      s.snap(i + 1, 'Never runs: the program already stopped at the error.', { skipped: true });
      return;
    }
    if (!l.run) {
      s.snap(
        i + 1,
        l.decl?.kind === 'function'
          ? 'A function declaration: already set up in phase ①, nothing to do now.'
          : 'Nothing to do.',
      );
      return;
    }
    try {
      const note = l.run(s);
      const declared = l.decl ? `${l.decl.name} gets its value now.` : '';
      s.snap(i + 1, note ? `${note}.` : declared || 'Runs.', {
        changed: l.decl ? `global:${l.decl.name}` : undefined,
      });
    } catch (e) {
      if (!(e instanceof SimError)) throw e;
      if (pause) {
        s.fail(e.message);
        stopped = true;
      } else {
        s.output.push(`(error) ${e.message}`);
      }
      s.snap(
        i + 1,
        `💥 ${e.message}${pause ? '. The program stops here.' : ' (pretending this line was tried on its own).'}`,
        {
          error: e.message,
        },
      );
    }
  });
  return s;
}

// ─── #3 ClosureBackpack ───────────────────────────────────────────────

export const COUNTER_CODE = [
  'function makeCounter() {',
  '  let count = 0;',
  '',
  '  return function () {',
  '    count++;',
  '    return count;',
  '  };',
  '}',
  '',
  'const counter = makeCounter();',
  'counter();   // 1',
  'counter();   // 2',
  'counter();   // 3',
];

/** makeCounter, step by step: the plate goes, the backpack stays. */
export function counterSteps(): Sim {
  return Sim.run((s) => {
    s.env('global', 'Global', null);
    s.declare('global', 'makeCounter', 'function', 'ƒ makeCounter');
    s.declare('global', 'counter', 'const');
    s.snap(null, 'Global has makeCounter (ready) and counter (not ready yet).');
    s.env('mc', 'makeCounter', 'global');
    s.declare('mc', 'count', 'let', '0');
    s.push('makeCounter', 'mc');
    s.snap(10, 'makeCounter() is called. Its plate holds count: 0.');
    s.fn('counterFn', 'function () { count++; return count; }', 'mc');
    s.snap(
      4,
      'A new function is created, and it remembers where it was born: a link to makeCounter’s scope (count).',
    );
    s.pop();
    s.set('global', 'counter', 'ƒ (with 🎒)');
    s.snap(
      10,
      'makeCounter is done and its plate is gone. But count is still needed by the function, so it lives on, linked from the backpack. It’s the same count, not a copy.',
    );
    for (let call = 1; call <= 3; call++) {
      s.env(`call${call}`, 'counter call', 'mc');
      s.push('counter', `call${call}`);
      s.snap(10 + call, `counter() is called. A new plate, with no variables of its own.`);
      const r = s.search(`call${call}`, 'count');
      const changed = s.set('mc', 'count', String(call));
      s.snap(
        5,
        `count++: not on the plate, so the search reaches into the backpack. count goes ${call - 1} → ${call}.`,
        {
          search: r.search,
          changed,
        },
      );
      s.log(String(call));
      s.pop();
      s.snap(
        6,
        `It returns ${call}. The plate comes off; the backpack (and count = ${call}) stays.`,
      );
    }
  });
}

/** Two counters called in any order: what each call returns. Real closures. */
export function twoCounters(sequence: ('A' | 'B')[]): string[] {
  function makeCounter() {
    let count = 0;
    return function () {
      count++;
      return count;
    };
  }
  const counterA = makeCounter();
  const counterB = makeCounter();
  return sequence.map((w) => `counter${w}() → ${w === 'A' ? counterA() : counterB()}`);
}

/** makeMultiplier from the article, for real. */
export function makeMultiplier(factor: number) {
  return (n: number) => n * factor;
}

/**
 * The loop puzzle, with real closures. Each arrow is stored and called
 * later, exactly like setTimeout would. `var` shares one i; `let` makes a
 * fresh j for every lap.
 */
export function loopClosures(kind: 'var' | 'let'): number[] {
  const later: (() => number)[] = [];
  if (kind === 'var') {
    for (var i = 0; i < 3; i++) later.push(() => i); // eslint-disable-line no-var
  } else {
    for (let j = 0; j < 3; j++) later.push(() => j);
  }
  return later.map((f) => f());
}
