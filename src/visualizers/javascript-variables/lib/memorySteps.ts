/**
 * Step generators for the memory visuals in "Variables & Data Types":
 * VariableBoxes (#1), LetConstVar (#3) and CopyVsReference (#7).
 *
 * Plain TypeScript, no React. A tiny model of memory (`Mem`) records a frozen
 * snapshot at each step with `snap()`; the components only draw snapshots.
 * memorySteps.test.ts runs every preset's real code and checks that the
 * console output, final values and error messages match.
 */
import type { BoxKind, BoxState } from '../../core/memory';

export interface Box {
  name: string;
  /** Value as code: 10, "Riya", undefined. Empty when `ref` is set. */
  value: string;
  kind: BoxKind;
  state: BoxState;
  /** Heap id this variable points to. */
  ref?: string;
  /** Which room (scope) the box lives in, for LetConstVar. */
  room?: string;
  hoisted?: boolean;
  tdz?: boolean;
  /** Highlight: something this box points to just changed. */
  pulse?: boolean;
}

export interface HeapProp {
  key: string;
  value: string;
  ref?: string;
}

export interface HeapObj {
  id: string;
  label: string;
  isArray?: boolean;
  props: HeapProp[];
  state: BoxState;
  changedKey?: string;
}

export interface Room {
  id: string;
  label: string;
  parent?: string;
  /** Dashed outline for blocks, solid for functions. */
  block?: boolean;
}

export interface MemStep {
  line: number | null;
  boxes: Box[];
  heap: HeapObj[];
  rooms: Room[];
  console: string[];
  /** The error that stopped the program, if any (exact JavaScript message). */
  error?: string;
  /** Working out the right-hand side, e.g. "score + 5 → 20 + 5 → 25". */
  bubble?: string;
  /** "Looking for…" line in LetConstVar. */
  lookup?: { name: string; from: string; found: boolean };
  caption: string;
}

export interface MemPreset {
  id: string;
  name: string;
  code: string;
  steps: MemStep[];
}

/** A small mutable model of memory. `snap()` stores a deep copy. */
class Mem {
  boxes: Box[] = [];
  heap: HeapObj[] = [];
  rooms: Room[] = [];
  console: string[] = [];
  steps: MemStep[] = [];
  private nextHeap = 1;

  snap(
    line: number | null,
    caption: string,
    extra: Partial<Pick<MemStep, 'error' | 'bubble' | 'lookup'>> = {},
  ) {
    this.steps.push({
      line,
      boxes: this.boxes.map((b) => ({ ...b })),
      heap: this.heap.map((h) => ({ ...h, props: h.props.map((p) => ({ ...p })) })),
      rooms: this.rooms.map((r) => ({ ...r })),
      console: [...this.console],
      caption,
      ...extra,
    });
    // Highlights only last for the step they happened on.
    for (const b of this.boxes) {
      b.state = 'same';
      b.pulse = false;
    }
    for (const h of this.heap) {
      h.state = 'same';
      h.changedKey = undefined;
    }
  }

  box(name: string) {
    const b = this.boxes.find((x) => x.name === name);
    if (!b) throw new Error(`no box ${name}`);
    return b;
  }
  declare(name: string, kind: BoxKind, value: string, room?: string) {
    this.boxes.push({ name, kind, value, state: 'new', room });
  }
  declareRef(name: string, kind: BoxKind, ref: string) {
    this.boxes.push({ name, kind, value: '', ref, state: 'new' });
  }
  set(name: string, value: string) {
    const b = this.box(name);
    Object.assign(b, { value, ref: undefined, state: 'changed', hoisted: false, tdz: false });
  }
  remove(name: string) {
    this.boxes = this.boxes.filter((b) => b.name !== name);
  }
  log(line: string) {
    this.console.push(line);
  }
  newObj(props: HeapProp[], isArray = false): string {
    const id = `h${this.nextHeap}`;
    this.heap.push({ id, label: `#${this.nextHeap}`, isArray, props, state: 'new' });
    this.nextHeap += 1;
    return id;
  }
  obj(id: string) {
    const h = this.heap.find((x) => x.id === id);
    if (!h) throw new Error(`no heap ${id}`);
    return h;
  }
  /** Change a property; every variable whose arrow leads here pulses. */
  setProp(id: string, key: string, value: string) {
    const h = this.obj(id);
    const p = h.props.find((x) => x.key === key);
    if (p) p.value = value;
    else h.props.push({ key, value });
    h.state = 'changed';
    h.changedKey = key;
    for (const b of this.boxes) if (b.ref === id) b.pulse = true;
    // Objects whose property points here count as "leading here" too.
    for (const other of this.heap) {
      if (other.props.some((x) => x.ref === id)) {
        for (const b of this.boxes) if (b.ref === other.id) b.pulse = true;
      }
    }
  }
}

const q = (s: string) => JSON.stringify(s); // "Riya" with quotes, as code

// ─── #1 VariableBoxes ───────────────────────────────────────────────────────

export const CREATE_CHANGE_CODE = `let score = 10;
score = 20;
score = score + 5;
console.log(score);`;

function createChange(): MemStep[] {
  const m = new Mem();
  m.snap(null, 'Memory is empty. Nothing has been created yet.');
  m.declare('score', 'let', '10');
  m.snap(1, '`let` makes a new box labelled score, and `=` puts 10 inside it.');
  m.set('score', '20');
  m.snap(2, 'No `let` this time: the box already exists. `=` replaces 10 with 20.');
  m.snap(3, 'First, JavaScript works out the right-hand side, using what is in the box now.', {
    bubble: 'score + 5 → 20 + 5 → 25',
  });
  m.set('score', '25');
  m.snap(3, 'Then it stores the answer, 25, in the box on the left. Right to left, always.');
  m.log('25');
  m.snap(4, 'console.log reads the box and prints 25.');
  return m.steps;
}

export const CONST_LOCKED_CODE = `const name = "Riya";
let age = 19;
age = 20;
name = "Aarav";`;

export const CONST_ERROR = 'TypeError: Assignment to constant variable.';

function constLocked(): MemStep[] {
  const m = new Mem();
  m.snap(null, 'Two variables are coming: one const, one let.');
  m.declare('name', 'const', q('Riya'));
  m.snap(1, '`const` makes a locked box. Whatever goes in now stays in.');
  m.declare('age', 'let', '19');
  m.snap(2, '`let` makes an ordinary box that can be changed later.');
  m.set('age', '20');
  m.snap(3, 'Changing a let box is fine: 19 becomes 20.');
  m.box('name').state = 'error';
  m.snap(4, 'Trying to put a new value in a const box fails. The program stops with an error.', {
    error: CONST_ERROR,
  });
  return m.steps;
}

export const SWAP_CODE = `let a = "chai";
let b = "coffee";
let temp = a;
a = b;
b = temp;`;

function swap(): MemStep[] {
  const m = new Mem();
  m.snap(null, 'Goal: swap the drinks in a and b.');
  m.declare('a', 'let', q('chai'));
  m.snap(1, 'Box a holds "chai".');
  m.declare('b', 'let', q('coffee'));
  m.snap(2, 'Box b holds "coffee".');
  m.declare('temp', 'let', q('chai'));
  m.snap(3, 'Save a copy of a in a spare box first, or "chai" would be lost on the next line.');
  m.set('a', q('coffee'));
  m.snap(4, 'Now a gets b\'s value. Without temp, "chai" would be gone for good.');
  m.set('b', q('chai'));
  m.snap(
    5,
    'b gets the saved "chai" from temp. Swapped! Modern shortcut: [a, b] = [b, a] does all of this in one line.',
  );
  return m.steps;
}

export const VARIABLE_PRESETS: MemPreset[] = [
  { id: 'create', name: 'Create and change', code: CREATE_CHANGE_CODE, steps: createChange() },
  { id: 'const', name: 'const is locked', code: CONST_LOCKED_CODE, steps: constLocked() },
  { id: 'swap', name: 'Swap two values', code: SWAP_CODE, steps: swap() },
];

// ─── #3 LetConstVar ─────────────────────────────────────────────────────────

export const VAR_LEAK_CODE = `function demo() {
  if (true) {
    var a = "I'm var";
    let b = "I'm let";
  }
  console.log(a);
  console.log(b);
}`;

export const B_NOT_DEFINED = 'ReferenceError: b is not defined';

function varLeak(): MemStep[] {
  const m = new Mem();
  m.snap(null, 'We call demo(). Watch which room each variable lives in.');
  m.rooms.push({ id: 'fn', label: 'function demo() room' });
  m.declare('a', 'var', 'undefined', 'fn');
  m.box('a').hoisted = true;
  m.snap(
    1,
    'The function room opens. var a is created right away in the FUNCTION room, holding undefined (that is hoisting).',
  );
  m.rooms.push({ id: 'block', label: 'if { } block room', parent: 'fn', block: true });
  m.snap(2, 'Entering the if block opens a smaller room inside the function room.');
  m.set('a', q("I'm var"));
  m.snap(
    3,
    'a gets its value. But its box is in the function room: var walks through the block wall.',
  );
  m.declare('b', 'let', q("I'm let"), 'block');
  m.snap(4, 'let b is created inside the block room. It stays in its room.');
  m.remove('b');
  m.rooms = m.rooms.filter((r) => r.id !== 'block');
  m.snap(5, 'The block ends: its room closes, and b disappears with it.');
  m.log("I'm var");
  m.snap(6, 'Looking for a from the function room… found it. Prints "I\'m var".', {
    lookup: { name: 'a', from: 'fn', found: true },
  });
  m.snap(
    7,
    'Looking for b… it is not in this room or any outer room. Error, and the program stops.',
    {
      lookup: { name: 'b', from: 'fn', found: false },
      error: B_NOT_DEFINED,
    },
  );
  return m.steps;
}

export const HOISTING_CODE = `console.log(x);
var x = 5;
console.log(y);
let y = 5;`;

export const Y_TDZ = "ReferenceError: Cannot access 'y' before initialization";

function hoisting(): MemStep[] {
  const m = new Mem();
  m.rooms.push({ id: 'top', label: 'script room' });
  m.declare('x', 'var', 'undefined', 'top');
  m.box('x').hoisted = true;
  m.declare('y', 'let', '', 'top');
  m.box('y').tdz = true;
  m.snap(
    null,
    'Before line 1 runs, JavaScript scans the code. var x already exists, holding undefined. let y exists too, but it is in the Temporal Dead Zone: off limits until its line.',
  );
  m.log('undefined');
  m.snap(
    1,
    'x is used before its line. No error: you silently get undefined. That is the var trap.',
    {
      lookup: { name: 'x', from: 'top', found: true },
    },
  );
  m.set('x', '5');
  m.snap(2, 'Now var x = 5 runs and fills the box.');
  m.snap(
    3,
    'y is used before its line. let refuses: a clear error instead of a silent undefined. Line 4 never runs.',
    { lookup: { name: 'y', from: 'top', found: false }, error: Y_TDZ },
  );
  return m.steps;
}

export const LOOP_CODE = `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log("var:", i), 0);
}
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log("let:", j), 0);
}`;

function loopGotcha(): MemStep[] {
  const m = new Mem();
  m.rooms.push({ id: 'top', label: 'script room' });
  m.snap(null, 'Two loops, each scheduling three timers. Which values will the timers print?');
  m.declare('i', 'var', '0', 'top');
  m.snap(1, 'var i: ONE box for the whole loop, in the outer room.');
  m.snap(
    2,
    'Three times, a timer is scheduled. Each one will read i later, from that same single box.',
  );
  m.set('i', '3');
  m.snap(1, 'The loop counts i up to 3 and stops. There is still only one i, and it now holds 3.');
  for (let r = 0; r < 3; r++) {
    m.rooms.push({ id: `round${r}`, label: `round ${r}`, parent: 'top', block: true });
    m.declare(`j (round ${r})`, 'let', String(r), `round${r}`);
  }
  m.snap(4, 'let j: each round of the loop gets its OWN room with a fresh j box: 0, 1 and 2.');
  m.snap(5, 'Each timer remembers the j from its own round.');
  m.log('var: 3');
  m.log('var: 3');
  m.log('var: 3');
  m.snap(2, 'The timers run. All three var timers read the one shared i: 3, 3, 3.');
  m.log('let: 0');
  m.log('let: 1');
  m.log('let: 2');
  m.snap(
    5,
    'The let timers each read their own j: 0, 1, 2. We will understand why in the Closures article.',
  );
  return m.steps;
}

export const SCOPE_PRESETS: MemPreset[] = [
  { id: 'leak', name: 'var leaks out', code: VAR_LEAK_CODE, steps: varLeak() },
  { id: 'hoisting', name: 'Hoisting', code: HOISTING_CODE, steps: hoisting() },
  { id: 'loop', name: 'Loop gotcha', code: LOOP_CODE, steps: loopGotcha() },
];

// ─── #7 CopyVsReference ─────────────────────────────────────────────────────

export const PRIMITIVE_CODE = `let a = 10;
let b = a;
b = 99;
console.log(a, b);`;

function primitives(): MemStep[] {
  const m = new Mem();
  m.snap(null, 'Numbers are primitives. Watch what "copy" means for them.');
  m.declare('a', 'let', '10');
  m.snap(1, 'Box a holds 10.');
  m.declare('b', 'let', '10');
  m.snap(2, 'b gets its own COPY of 10. Two boxes, two separate 10s.');
  m.set('b', '99');
  m.snap(3, "Changing b only changes b's box. a still holds its own 10.");
  m.log('10 99');
  m.snap(4, 'Prints 10 99. Primitives are copied, so they never affect each other.');
  return m.steps;
}

export const SHARE_CODE = `const user1 = { name: "Riya" };
const user2 = user1;
user2.name = "Aarav";
console.log(user1.name);`;

function share(): MemStep[] {
  const m = new Mem();
  m.snap(null, 'Objects live in the heap. Variables only hold an arrow to them.');
  const o = m.newObj([{ key: 'name', value: q('Riya') }]);
  m.declareRef('user1', 'const', o);
  m.snap(
    1,
    "The object is created in the heap (#1). user1's box holds an ARROW to it, not the object.",
  );
  m.declareRef('user2', 'const', o);
  m.snap(
    2,
    'user2 = user1 copies the ARROW. No new object is made: there are now two arrows to the same object.',
  );
  m.setProp(o, 'name', q('Aarav'));
  m.snap(3, 'Changing name through user2 changes the one shared object. Both variables see it.');
  m.log('Aarav');
  m.snap(4, 'user1.name follows its arrow to the same object, so it prints "Aarav".');
  return m.steps;
}

export const SPREAD_CODE = `const user1 = { name: "Riya" };
const user2 = { ...user1 };
user2.name = "Aarav";
console.log(user1.name);`;

function spread(): MemStep[] {
  const m = new Mem();
  m.snap(null, 'Same start, but this time we make a real copy.');
  const o1 = m.newObj([{ key: 'name', value: q('Riya') }]);
  m.declareRef('user1', 'const', o1);
  m.snap(1, 'user1 points to object #1.');
  const o2 = m.newObj([{ key: 'name', value: q('Riya') }]);
  m.declareRef('user2', 'const', o2);
  m.snap(
    2,
    '{ ...user1 } builds a NEW object (#2) and copies the properties into it. Two objects now.',
  );
  m.setProp(o2, 'name', q('Aarav'));
  m.snap(3, 'Changing user2.name only changes object #2.');
  m.log('Riya');
  m.snap(4, 'user1 still points to #1, which still says "Riya".');
  return m.steps;
}

export const ARRAYS_CODE = `const cart = ["chai"];
const sameCart = cart;
sameCart.push("samosa");
const newCart = [...cart, "jalebi"];
console.log(cart === sameCart, cart === newCart);`;

function arrays(): MemStep[] {
  const m = new Mem();
  m.snap(null, 'Arrays are objects too, so the same rules apply.');
  const c = m.newObj([{ key: '0', value: q('chai') }], true);
  m.declareRef('cart', 'const', c);
  m.snap(1, 'cart points to an array in the heap.');
  m.declareRef('sameCart', 'const', c);
  m.snap(2, 'sameCart copies the arrow: the same array.');
  m.setProp(c, '1', q('samosa'));
  m.snap(3, 'push changes the one shared array. cart sees "samosa" too.');
  const n = m.newObj(
    [
      { key: '0', value: q('chai') },
      { key: '1', value: q('samosa') },
      { key: '2', value: q('jalebi') },
    ],
    true,
  );
  m.declareRef('newCart', 'const', n);
  m.snap(4, '[...cart, "jalebi"] builds a NEW array with the old items plus one more.');
  m.log('true false');
  m.snap(
    5,
    'React compares arrows (===). sameCart has the same arrow, so React would see "no change". newCart is a new arrow, so React re-renders.',
  );
  return m.steps;
}

export const NESTED_CODE = `const a = { name: "Riya", address: { city: "Pune" } };
const b = { ...a };
b.address.city = "Delhi";
console.log(a.address.city);
const c = structuredClone(a);
c.address.city = "Goa";
console.log(a.address.city);`;

function nested(): MemStep[] {
  const m = new Mem();
  m.snap(null, 'An object with another object inside it. How deep does a copy go?');
  const addr = m.newObj([{ key: 'city', value: q('Pune') }]);
  const outer = m.newObj([
    { key: 'name', value: q('Riya') },
    { key: 'address', value: '', ref: addr },
  ]);
  m.declareRef('a', 'const', outer);
  m.snap(1, 'Two objects: the outer one (#2) holds an arrow to the address object (#1).');
  const outerB = m.newObj([
    { key: 'name', value: q('Riya') },
    { key: 'address', value: '', ref: addr },
  ]);
  m.declareRef('b', 'const', outerB);
  m.snap(
    2,
    'Spread copies the OUTER object only (#3). Its address property copies the arrow, so both still share #1. That is a shallow copy.',
  );
  m.setProp(addr, 'city', q('Delhi'));
  m.snap(3, 'Changing b.address.city changes the shared address object…');
  m.log('Delhi');
  m.snap(4, '…so a.address.city is "Delhi" too. The shallow copy did not protect it.');
  const addrC = m.newObj([{ key: 'city', value: q('Delhi') }]);
  const outerC = m.newObj([
    { key: 'name', value: q('Riya') },
    { key: 'address', value: '', ref: addrC },
  ]);
  m.declareRef('c', 'const', outerC);
  m.snap(5, 'structuredClone copies EVERY level: a new outer object and a new address object.');
  m.setProp(addrC, 'city', q('Goa'));
  m.snap(6, "Changing c.address.city only touches c's own address object.");
  m.log('Delhi');
  m.snap(7, 'a.address.city is still "Delhi". A deep copy is fully separate.');
  return m.steps;
}

export const REFERENCE_PRESETS: MemPreset[] = [
  { id: 'primitives', name: 'Primitives copy', code: PRIMITIVE_CODE, steps: primitives() },
  { id: 'share', name: 'Objects share', code: SHARE_CODE, steps: share() },
  { id: 'spread', name: 'Real copy', code: SPREAD_CODE, steps: spread() },
  { id: 'arrays', name: 'Arrays + React', code: ARRAYS_CODE, steps: arrays() },
  { id: 'nested', name: 'Shallow vs deep', code: NESTED_CODE, steps: nested() },
];
