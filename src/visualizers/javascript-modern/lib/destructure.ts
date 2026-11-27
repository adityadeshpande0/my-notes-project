/**
 * The destructuring and spread presets for "Unpack and pack". Every result
 * shown in the visual comes from RUNNING real destructuring / spread syntax
 * here, never from strings or eval. The pattern builder's choices map onto
 * real destructuring (computed keys, defaults, rest), and destructure.test.ts
 * checks every combination against the code the learner sees.
 */

export interface User {
  name?: string;
  age?: number;
  city?: string;
  country?: string;
  phone?: string;
  address?: { city: string; pincode: string };
}
export const USER: User = { name: 'Riya', age: 19, city: 'Pune' };

// ─── Object destructuring builder ────────────────────────────────────

export type ChipKey = 'name' | 'age' | 'city' | 'country' | 'phone';
export type ChipMode = 'off' | 'on' | 'rename' | 'default';
export interface Chip {
  key: ChipKey;
  /** The new variable name for "rename". */
  rename?: string;
  /** The default, as code and as a value, for "default". */
  def?: { code: string; value: string | number };
}
export const CHIPS: Chip[] = [
  { key: 'name', rename: 'fullName' },
  { key: 'age', def: { code: '18', value: 18 } },
  { key: 'city', rename: 'hometown' },
  { key: 'country', def: { code: '"India"', value: 'India' } },
  { key: 'phone', def: { code: '"none"', value: 'none' } },
];
export const modesFor = (c: Chip): ChipMode[] => [
  'off',
  'on',
  ...(c.rename ? (['rename'] as const) : []),
  ...(c.def ? (['default'] as const) : []),
];

export interface ObjChoice {
  modes: Record<ChipKey, ChipMode>;
  rest: boolean;
}

export interface Binding {
  /** The variable that gets the value. */
  variable: string;
  /** The property it came from (null for the rest object). */
  from: ChipKey | null;
  value: unknown;
  missing?: boolean;
  defaultUsed?: boolean;
}

/** The pattern, as the learner sees it. */
export function objectPatternCode(c: ObjChoice, source = 'user'): string {
  const parts: string[] = [];
  for (const chip of CHIPS) {
    const m = c.modes[chip.key];
    if (m === 'on') parts.push(chip.key);
    if (m === 'rename') parts.push(`${chip.key}: ${chip.rename}`);
    if (m === 'default') parts.push(`${chip.key} = ${chip.def!.code}`);
  }
  if (c.rest) parts.push('...others');
  return parts.length ? `const { ${parts.join(', ')} } = ${source};` : `const {} = ${source};`;
}

/** Run the pattern for real, one property at a time. */
export function runObjectPattern(
  c: ObjChoice,
  user: User = USER,
): { bindings: Binding[]; others?: Record<string, unknown> } {
  const bindings: Binding[] = [];
  for (const chip of CHIPS) {
    const m = c.modes[chip.key];
    if (m === 'off') continue;
    const key = chip.key;
    let value: unknown;
    if (m === 'default') {
      // Real destructuring with a default (used only when the value is undefined).
      const { [key]: v = chip.def!.value } = user;
      value = v;
    } else {
      const { [key]: v } = user;
      value = v;
    }
    bindings.push({
      variable: m === 'rename' ? chip.rename! : key,
      from: key,
      value,
      missing: !(key in user),
      defaultUsed: m === 'default' && user[key] === undefined,
    });
  }
  let others: Record<string, unknown> | undefined;
  if (c.rest) {
    // Real rest: take out each named property, keep "the rest of them".
    const named = CHIPS.filter((ch) => c.modes[ch.key] !== 'off').map((ch) => ch.key as string);
    others = named.reduce<Record<string, unknown>>(
      (obj, k) => {
        const { [k]: _taken, ...remaining } = obj; // eslint-disable-line @typescript-eslint/no-unused-vars
        return remaining;
      },
      { ...user },
    );
  }
  return { bindings, others };
}

/** Every builder combination (for the tests). */
export function allObjectChoices(): ObjChoice[] {
  let combos: Record<ChipKey, ChipMode>[] = [{} as Record<ChipKey, ChipMode>];
  for (const chip of CHIPS)
    combos = combos.flatMap((m) => modesFor(chip).map((mode) => ({ ...m, [chip.key]: mode })));
  return combos.flatMap((modes) => [false, true].map((rest) => ({ modes, rest })));
}

// ─── Nested ──────────────────────────────────────────────────────────

export const NESTED_USER: User = { ...USER, address: { city: 'Pune', pincode: '411001' } };

export type Outcome = { ok: true; value: unknown } | { ok: false; error: string };

/** const { address: { pincode } } = user; — throws if there's no address. */
export function nestedPincode(user: User): Outcome {
  try {
    const {
      address: { pincode },
    } = user as Required<User>;
    return { ok: true, value: pincode };
  } catch (e) {
    return { ok: false, error: `${(e as Error).name}: ${(e as Error).message}` };
  }
}
/** const { address: { pincode } = {} } = user; — the default {} makes it safe. */
export function nestedPincodeSafe(user: User): Outcome {
  const { address: { pincode } = {} as { pincode?: string } } = user;
  return { ok: true, value: pincode };
}

// ─── Array destructuring builder ─────────────────────────────────────

export const SNACKS = ['samosa', 'vada pav', 'jalebi', 'lassi'];
export const SLOT_NAMES = ['first', 'second', 'third'];
export interface ArrChoice {
  /** true = the slot has a variable; false = skipped (an empty slot). */
  slots: boolean[];
  rest: boolean;
}

export function arrayPatternCode(c: ArrChoice, source = 'snacks'): string {
  const parts = c.slots.map((on, i) => (on ? SLOT_NAMES[i] : ''));
  if (c.rest) parts.push('...rest');
  // An empty last slot needs a trailing comma to still count as a slot.
  const body = parts.join(', ').replace(/ +/g, ' ').trim();
  return `const [${body}${!c.rest && !c.slots[c.slots.length - 1] ? ',' : ''}] = ${source};`;
}

export function runArrayPattern(
  c: ArrChoice,
  arr: string[] = SNACKS,
): { bindings: (Binding & { index: number })[]; rest?: string[] } {
  // Real array destructuring, by position.
  const [s0, s1, s2, ...rest] = arr;
  const values = [s0, s1, s2];
  const bindings = c.slots.flatMap((on, i) =>
    on
      ? [
          {
            variable: SLOT_NAMES[i],
            from: null,
            index: i,
            value: values[i],
            missing: i >= arr.length,
          },
        ]
      : [],
  );
  return { bindings, rest: c.rest ? rest : undefined };
}

export function allArrayChoices(): ArrChoice[] {
  const out: ArrChoice[] = [];
  for (let m = 0; m < 8; m++)
    for (const rest of [false, true])
      out.push({ slots: [0, 1, 2].map((i) => !!(m & (1 << i))), rest });
  return out;
}

/** let a = "chai", b = "coffee"; [a, b] = [b, a]; */
export function swap() {
  let a = 'chai';
  let b = 'coffee';
  const before = { a, b };
  const temp = [b, a]; // the temporary array the right-hand side builds
  [a, b] = [b, a];
  return { before, temp, after: { a, b } };
}

// ─── Spread and rest ─────────────────────────────────────────────────

export const DRINKS = ['chai', 'lassi'];
export const FOOD = ['samosa'];
export const combine = () => [...DRINKS, ...FOOD, 'jalebi'];
export function copyArray() {
  const copy = [...DRINKS];
  return { copy, same: copy === DRINKS };
}

export const BASE = { size: 'medium', sugar: 1 };
export const overrideAfter = () => ({ ...BASE, sugar: 2 });
// TypeScript warns that BASE's sugar overwrites this one, which is exactly the lesson,
// so BASE is typed loosely here to let the real code run.
const looseBase: Record<string, unknown> = BASE;
export const overrideBefore = () => ({ sugar: 2, ...looseBase });

export const PRICES = [30, 20, 45];
export const maxSpread = () => Math.max(...PRICES);
// Without spread, the whole array is ONE argument, so the answer is NaN.
export const maxWhole = () => Math.max(PRICES as unknown as number);

export function total(...prices: number[]) {
  return prices.reduce((sum, p) => sum + p, 0);
}
/** The reduce, one step at a time, for the mini table. */
export function totalSteps(...prices: number[]) {
  const steps: { sum: number; p: number; next: number }[] = [];
  prices.reduce((sum, p) => {
    steps.push({ sum, p, next: sum + p });
    return sum + p;
  }, 0);
  return { prices, steps, result: total(...prices) };
}

// ─── In React ────────────────────────────────────────────────────────

/** function Profile({ name, avatar }) — object destructuring of props. */
export function Profile({ name, avatar }: { name: string; avatar: string; age?: number }) {
  return { name, avatar };
}
/** A stand-in for useState: it returns an ARRAY of two things. */
export function fakeUseState<T>(initial: T): [T, (v: T) => void] {
  return [initial, () => {}];
}
export function reactUpdate() {
  const user = { name: 'Riya', age: 19 };
  const updated = { ...user, age: 20 };
  return { user, updated, same: updated === user };
}
