/**
 * A tiny expression evaluator that writes down every step it takes.
 * Plain TypeScript, no React. Shared by LogicShortCircuit (#4) and
 * PrecedenceTree (#8).
 *
 * It never runs `eval` on text. Expressions are trees: either written by
 * hand for the presets, or built by the small safe parser at the bottom of
 * this file. Every operator is applied with the real JavaScript operator
 * (`a + b`, `a < b`, …), and evalSteps.test.ts checks the final value of
 * every preset, plus hundreds of random expressions, against real JS.
 *
 * Evaluation order is JavaScript's: the left operand is worked out fully,
 * then the right, then the operator. `&&`, `||` and `??` look at their left
 * value first and skip the right side when they already know the answer.
 */
import { show, truthiness } from './format';

export type BinOp =
  '+' | '-' | '*' | '/' | '%' | '**' | '<' | '>' | '<=' | '>=' | '===' | '!==' | '==' | '!=';
export type LogicOp = '&&' | '||' | '??';

export type Expr =
  | { kind: 'lit'; value: unknown }
  | { kind: 'var'; name: string }
  | { kind: 'call'; name: string }
  | { kind: 'member'; object: Expr; prop: string; optional?: boolean }
  | { kind: 'unary'; op: '!' | '-'; arg: Expr }
  | { kind: 'binary'; op: BinOp; left: Expr; right: Expr }
  | { kind: 'logical'; op: LogicOp; left: Expr; right: Expr }
  | { kind: 'group'; expr: Expr };

// ─── Builders, so presets read almost like code ───────────────────────
export const lit = (value: unknown): Expr => ({ kind: 'lit', value });
export const ref = (name: string): Expr => ({ kind: 'var', name });
export const call = (name: string): Expr => ({ kind: 'call', name });
export const mem = (object: Expr, prop: string, optional = false): Expr => ({
  kind: 'member',
  object,
  prop,
  optional,
});
export const not = (arg: Expr): Expr => ({ kind: 'unary', op: '!', arg });
export const bin = (left: Expr, op: BinOp, right: Expr): Expr => ({
  kind: 'binary',
  op,
  left,
  right,
});
export const logic = (left: Expr, op: LogicOp, right: Expr): Expr => ({
  kind: 'logical',
  op,
  left,
  right,
});
export const group = (expr: Expr): Expr => ({ kind: 'group', expr });

// ─── Node ids ─────────────────────────────────────────────────────────
// Every node gets an id from its path: the root is "n", its left child
// "n.l", that node's right child "n.l.r", and so on.
export const ROOT = 'n';

export function children(e: Expr): [key: string, child: Expr][] {
  switch (e.kind) {
    case 'member':
      return [['o', e.object]];
    case 'unary':
      return [['a', e.arg]];
    case 'binary':
    case 'logical':
      return [
        ['l', e.left],
        ['r', e.right],
      ];
    case 'group':
      return [['e', e.expr]];
    default:
      return [];
  }
}

/** True if `id` is `ancestor` itself or somewhere inside it. */
export const isInside = (id: string, ancestor: string) =>
  id === ancestor || id.startsWith(ancestor + '.');

/** Visit every node, parents before children. */
export function walk(e: Expr, visit: (e: Expr, id: string) => void, id = ROOT) {
  visit(e, id);
  for (const [key, child] of children(e)) walk(child, visit, `${id}.${key}`);
}

// ─── Printing ─────────────────────────────────────────────────────────
export type Done = Record<string, { value: unknown }>;

/**
 * Write the expression as code. Nodes in `done` are replaced by their
 * value, which is how "2 + 3 * 4" becomes "2 + 12".
 */
export function print(e: Expr, done: Done = {}, id = ROOT): string {
  if (done[id]) return show(done[id].value);
  switch (e.kind) {
    case 'lit':
      return show(e.value);
    case 'var':
      return e.name;
    case 'call':
      return `${e.name}()`;
    case 'member':
      return `${print(e.object, done, `${id}.o`)}${e.optional ? '?.' : '.'}${e.prop}`;
    case 'unary':
      return `${e.op}${print(e.arg, done, `${id}.a`)}`;
    case 'binary':
    case 'logical':
      return `${print(e.left, done, `${id}.l`)} ${e.op} ${print(e.right, done, `${id}.r`)}`;
    case 'group': {
      const inner = `${id}.e`;
      // Once the inside is worked out, the brackets have done their job: (5) is just 5.
      if (done[inner]) return show(done[inner].value);
      return `(${print(e.expr, done, inner)})`;
    }
  }
}

// ─── Precedence (the simplified 11-level table from the article) ──────
export const LADDER: { ops: string; name: string }[] = [
  { ops: '( )', name: 'Parentheses' },
  { ops: '!  -x', name: 'Not, negate' },
  { ops: '**', name: 'Power' },
  { ops: '*  /  %', name: 'Multiply, divide' },
  { ops: '+  -', name: 'Add, subtract' },
  { ops: '<  >  <=  >=', name: 'Compare' },
  { ops: '===  !==', name: 'Equality' },
  { ops: '&&', name: 'AND' },
  { ops: '||  ??', name: 'OR, nullish' },
  { ops: '? :', name: 'Ternary' },
  { ops: '=  +=', name: 'Assignment' },
];

/** Which rung of LADDER (1–11) an operator node sits on, or null for values. */
export function precedenceLevel(e: Expr): number | null {
  switch (e.kind) {
    case 'group':
      return 1;
    case 'unary':
      return 2;
    case 'binary':
      if (e.op === '**') return 3;
      if (e.op === '*' || e.op === '/' || e.op === '%') return 4;
      if (e.op === '+' || e.op === '-') return 5;
      if (e.op === '<' || e.op === '>' || e.op === '<=' || e.op === '>=') return 6;
      return 7;
    case 'logical':
      return e.op === '&&' ? 8 : 9;
    default:
      return null;
  }
}

// ─── The evaluator ────────────────────────────────────────────────────
export type StepKind = 'start' | 'call' | 'test' | 'eval' | 'error';

export interface EvalStep {
  kind: StepKind;
  /** The node this step is about ('' for the start step). */
  id: string;
  value?: unknown;
  /** What happened, in plain English (may contain `code` in backticks). */
  note: string;
  /** Ids of every node skipped so far (short-circuiting). */
  skipped: string[];
  /** Nodes worked out so far, and their values. */
  done: Done;
  /** The expression with everything worked out so far replaced by values. */
  text: string;
  /** How many times each side-effect function has run so far. */
  calls: Record<string, number>;
}

export interface EvalResult {
  steps: EvalStep[];
  value?: unknown;
  /** The real error message, if evaluating threw (e.g. reading a property of null). */
  error?: string;
}

export interface Env {
  vars?: Record<string, unknown>;
  /** Functions the expression may call. They run for real, so we can count calls. */
  fns?: Record<string, () => unknown>;
}

class Stop extends Error {}

/** Apply a binary operator with JavaScript's own behaviour for every type mix. */
export function applyBinary(op: BinOp, a: unknown, b: unknown): unknown {
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
    case '/':
      return x / y;
    case '%':
      return x % y;
    case '**':
      return x ** y;
    case '<':
      return x < y;
    case '>':
      return x > y;
    case '<=':
      return x <= y;
    case '>=':
      return x >= y;
    case '===':
      return x === y;
    case '!==':
      return x !== y;
    case '==':
      return x == y;
    case '!=':
      return x != y;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

/** A sentence explaining one binary operation, with the gotchas called out. */
function binaryNote(op: BinOp, a: unknown, b: unknown, v: unknown): string {
  const sa = show(a);
  const sb = show(b);
  const base = `\`${sa} ${op} ${sb}\` is \`${show(v)}\``;
  if (op === '+' && (typeof a === 'string' || typeof b === 'string'))
    return `${base}. With a string on either side, \`+\` joins text instead of adding.`;
  if (
    op === '**' &&
    typeof a === 'number' &&
    Number.isInteger(b) &&
    (b as number) >= 2 &&
    (b as number) <= 6
  )
    return `${base} (${Array(b as number)
      .fill(sa)
      .join(' × ')}).`;
  const relational = op === '<' || op === '>' || op === '<=' || op === '>=';
  if (relational && (typeof a === 'boolean' || typeof b === 'boolean')) {
    const na = typeof a === 'boolean' ? Number(a) : a;
    const nb = typeof b === 'boolean' ? Number(b) : b;
    return `${base}. To compare, \`true\` becomes \`1\` and \`false\` becomes \`0\`, so this is really \`${show(na)} ${op} ${show(nb)}\`.`;
  }
  if (relational && typeof a === 'string' && typeof b === 'string')
    return `${base}. Two strings compare alphabetically, character by character.`;
  return `${base}.`;
}

export function evaluate(expr: Expr, env: Env = {}): EvalResult {
  const vars = env.vars ?? {};
  const fns = env.fns ?? {};
  const steps: EvalStep[] = [];
  const skipped: string[] = [];
  const done: Done = {};
  const calls: Record<string, number> = {};
  // Ids of member nodes whose optional chain already stopped (a?.b.c stops as a whole).
  const chainStopped = new Set<string>();

  const push = (kind: StepKind, id: string, note: string, value?: unknown) =>
    steps.push({
      kind,
      id,
      value,
      note,
      skipped: [...skipped],
      done: { ...done },
      text: print(expr, done),
      calls: { ...calls },
    });

  push('start', '', `Start with the whole expression: \`${print(expr)}\`.`);

  const ev = (e: Expr, id: string): unknown => {
    switch (e.kind) {
      case 'lit':
        return e.value;

      case 'var':
        if (!(e.name in vars)) {
          push('error', id, `ReferenceError: ${e.name} is not defined`);
          throw new Stop(`ReferenceError: ${e.name} is not defined`);
        }
        return vars[e.name];

      case 'call': {
        const fn = fns[e.name];
        calls[e.name] = (calls[e.name] ?? 0) + 1;
        const value = fn ? fn() : undefined;
        done[id] = { value };
        push(
          'call',
          id,
          `\`${e.name}()\` runs (call #${calls[e.name]}) and returns \`${show(value)}\`.`,
          value,
        );
        return value;
      }

      case 'member': {
        const objId = `${id}.o`;
        const obj = ev(e.object, objId);
        if (chainStopped.has(objId)) {
          chainStopped.add(id);
          done[id] = { value: undefined };
          return undefined;
        }
        if (e.optional && obj == null) {
          chainStopped.add(id);
          done[id] = { value: undefined };
          push(
            'eval',
            id,
            `The left side is \`${show(obj)}\`, so \`?.\` stops calmly and gives \`undefined\`.`,
            undefined,
          );
          return undefined;
        }
        let value: unknown;
        try {
          value = (obj as Record<string, unknown>)[e.prop];
        } catch (err) {
          // The real message from the JavaScript engine, not a made-up one.
          const message = `${(err as Error).name}: ${(err as Error).message}`;
          push('error', id, message);
          throw new Stop(message);
        }
        done[id] = { value };
        push('eval', id, `Read \`.${e.prop}\`: it's \`${show(value)}\`.`, value);
        return value;
      }

      case 'unary': {
        const a = ev(e.arg, `${id}.a`);
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const value = e.op === '!' ? !a : -(a as any);
        done[id] = { value };
        push(
          'eval',
          id,
          e.op === '!'
            ? `\`${show(a)}\` is ${truthiness(a)}, so \`!${show(a)}\` flips it to \`${show(value)}\`.`
            : `\`-${show(a)}\` is \`${show(value)}\`.`,
          value,
        );
        return value;
      }

      case 'binary': {
        const a = ev(e.left, `${id}.l`);
        const b = ev(e.right, `${id}.r`);
        const value = applyBinary(e.op, a, b);
        done[id] = { value };
        push('eval', id, binaryNote(e.op, a, b, value), value);
        return value;
      }

      case 'logical': {
        const leftId = `${id}.l`;
        const rightId = `${id}.r`;
        const a = ev(e.left, leftId);
        const sa = show(a);
        let stop: boolean;
        let why: string;
        if (e.op === '&&') {
          stop = !a;
          why = stop
            ? `\`${sa}\` is falsy, so \`&&\` already knows the answer. It stops here.`
            : `\`${sa}\` is truthy, so \`&&\` has to look at the right side too.`;
        } else if (e.op === '||') {
          stop = Boolean(a);
          why = stop
            ? `\`${sa}\` is truthy, so \`||\` already knows the answer. It stops here.`
            : `\`${sa}\` is falsy, so \`||\` keeps looking to the right.`;
        } else {
          stop = a != null;
          why = stop
            ? `\`${sa}\` is not null or undefined, so \`??\` keeps it and stops here.`
            : `\`${sa}\` is ${sa}, so \`??\` uses the right side instead.`;
        }
        push('test', leftId, why, a);

        let value: unknown;
        if (stop) {
          skipped.push(rightId);
          value = a;
        } else {
          value = ev(e.right, rightId);
        }
        done[id] = { value };
        const what =
          e.op === '&&'
            ? 'first falsy value'
            : e.op === '||'
              ? 'first truthy value'
              : 'first value that isn’t null or undefined';
        const returned = stop
          ? `The right side was never evaluated. \`${e.op}\` returns \`${show(value)}\`, the left value itself.`
          : `\`${e.op}\` returns \`${show(value)}\`: the ${what}${e.op === '??' ? '' : ' (or the last one)'}.`;
        push('eval', id, returned, value);
        return value;
      }

      case 'group': {
        const value = ev(e.expr, `${id}.e`);
        if (chainStopped.has(`${id}.e`)) chainStopped.add(id);
        done[id] = { value };
        return value;
      }
    }
  };

  try {
    const value = ev(expr, ROOT);
    return { steps, value };
  } catch (err) {
    if (err instanceof Stop) return { steps, error: err.message };
    throw err;
  }
}

// ─── A small, safe parser for "Try your own" ──────────────────────────
// It only understands numbers, quoted strings, true/false/null/undefined,
// brackets and the operators below. Anything else is a friendly error.
// It's a "Pratt parser": each operator has a binding power (how tightly it
// holds its operands), which is exactly what a precedence table is.

type Token = { t: 'num' | 'str' | 'word' | 'op'; v: string; at: number };

const OPERATORS = [
  '===',
  '!==',
  '**',
  '<=',
  '>=',
  '&&',
  '||',
  '??',
  '==',
  '!=',
  '+',
  '-',
  '*',
  '/',
  '%',
  '<',
  '>',
  '!',
  '(',
  ')',
];

export class ParseError extends Error {}

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    const num = /^\d+(\.\d+)?/.exec(src.slice(i));
    if (num) {
      out.push({ t: 'num', v: num[0], at: i });
      i += num[0].length;
      continue;
    }
    if (c === '"' || c === "'") {
      const end = src.indexOf(c, i + 1);
      if (end < 0) throw new ParseError(`This string never ends: add a closing ${c}.`);
      const body = src.slice(i + 1, end);
      if (body.includes('\\'))
        throw new ParseError('Backslashes in strings aren’t supported here.');
      out.push({ t: 'str', v: body, at: i });
      i = end + 1;
      continue;
    }
    const word = /^[A-Za-z_$][\w$]*/.exec(src.slice(i));
    if (word) {
      out.push({ t: 'word', v: word[0], at: i });
      i += word[0].length;
      continue;
    }
    const op = OPERATORS.find((o) => src.startsWith(o, i));
    if (!op) throw new ParseError(`“${c}” isn’t allowed here.`);
    out.push({ t: 'op', v: op, at: i });
    i += op.length;
  }
  return out;
}

const WORDS: Record<string, unknown> = {
  true: true,
  false: false,
  null: null,
  undefined: undefined,
  NaN: NaN,
  Infinity: Infinity,
};

// Binding powers: higher holds tighter. Matches JavaScript's real precedence.
const BINDING: Record<string, number> = {
  '||': 2,
  '??': 2,
  '&&': 3,
  '===': 4,
  '!==': 4,
  '==': 4,
  '!=': 4,
  '<': 5,
  '>': 5,
  '<=': 5,
  '>=': 5,
  '+': 6,
  '-': 6,
  '*': 7,
  '/': 7,
  '%': 7,
  '**': 8,
};
const PREFIX_POWER = 9;

const isAndOr = (e: Expr) => e.kind === 'logical' && e.op !== '??';
const isNullish = (e: Expr) => e.kind === 'logical' && e.op === '??';

export function parse(src: string): Expr {
  const tokens = tokenize(src);
  if (tokens.length === 0) throw new ParseError('Type an expression first.');
  let pos = 0;
  const peek = () => tokens[pos];

  const prefix = (): Expr => {
    const tok = tokens[pos++];
    if (!tok) throw new ParseError('The expression ends too early.');
    if (tok.t === 'num') return lit(Number(tok.v));
    if (tok.t === 'str') return lit(tok.v);
    if (tok.t === 'word') {
      if (tok.v in WORDS) return lit(WORDS[tok.v]);
      throw new ParseError(`Only values are allowed, not names like “${tok.v}”.`);
    }
    if (tok.v === '(') {
      const inner = expression(0);
      if (peek()?.v !== ')') throw new ParseError('A “(” is missing its “)”.');
      pos++;
      return group(inner);
    }
    if (tok.v === '!' || tok.v === '-') {
      return { kind: 'unary', op: tok.v, arg: expression(PREFIX_POWER) };
    }
    throw new ParseError(`“${tok.v}” can’t start a value.`);
  };

  const expression = (minPower: number): Expr => {
    let left = prefix();
    for (;;) {
      const tok = peek();
      if (!tok || tok.v === ')') break;
      const power = BINDING[tok.v];
      if (tok.t !== 'op' || power === undefined)
        throw new ParseError(`Expected an operator before “${tok.v}”.`);
      if (power < minPower) break;
      pos++;
      if (tok.v === '**' && left.kind === 'unary')
        throw new ParseError(
          'JavaScript doesn’t allow a ! or - right before ** (it’s a SyntaxError). Add brackets: (-2) ** 2.',
        );
      // ** groups right to left (2 ** 3 ** 2 is 2 ** 9); everything else left to right.
      const right = expression(tok.v === '**' ? power : power + 1);
      if (tok.v === '&&' || tok.v === '||' || tok.v === '??') {
        const op = tok.v as LogicOp;
        const mixes =
          op === '??' ? isAndOr(left) || isAndOr(right) : isNullish(left) || isNullish(right);
        if (mixes)
          throw new ParseError(
            'JavaScript doesn’t let you mix ?? with && or || without brackets (it’s a SyntaxError).',
          );
        left = logic(left, op, right);
      } else {
        left = bin(left, tok.v as BinOp, right);
      }
    }
    return left;
  };

  const tree = expression(0);
  if (pos < tokens.length) throw new ParseError(`Unexpected “${tokens[pos].v}”.`);
  return tree;
}
