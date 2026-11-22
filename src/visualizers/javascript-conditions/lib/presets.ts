/**
 * The example expressions for LogicShortCircuit (#4) and PrecedenceTree (#8).
 * evalSteps.test.ts runs each one as real JavaScript and checks the
 * evaluator gets the same answer.
 */
import { call, lit, logic, mem, not, parse, ref, group, type Expr } from './evalSteps';

export interface LogicPreset {
  id: string;
  name: string;
  /** One expression, or two shown side by side. */
  exprs: Expr[];
  /** Variables the expression reads. Booleans listed in `toggles` get checkboxes. */
  vars?: Record<string, unknown>;
  toggles?: string[];
  /** What to look for, shown above the expression. */
  hint: string;
}

export const LOGIC_PRESETS: LogicPreset[] = [
  {
    id: 'and-skip',
    name: 'false && …',
    exprs: [logic(lit(false), '&&', call('askServer'))],
    hint: 'Watch the 📞 counter. Does askServer() ever run?',
  },
  {
    id: 'or-skip',
    name: 'true || …',
    exprs: [logic(lit(true), '||', call('askServer'))],
    hint: 'true || anything is true, so does JavaScript bother calling the server?',
  },
  {
    id: 'guest',
    name: '"" || "Guest"',
    exprs: [logic(lit(''), '||', lit('Guest'))],
    hint: 'An empty name falls back to a default. Notice what comes back: not true, but a string.',
  },
  {
    id: 'riya',
    name: '"Riya" || "Guest"',
    exprs: [logic(lit('Riya'), '||', lit('Guest'))],
    hint: 'A real name is truthy, so the default is never needed.',
  },
  {
    id: 'user',
    name: 'user && user.name',
    exprs: [logic(ref('user'), '&&', mem(ref('user'), 'name'))],
    vars: { user: null },
    hint: 'Here user is null. Reading null.name would crash, but && protects us.',
  },
  {
    id: 'or-vs-nullish',
    name: '0 || 50 vs 0 ?? 50',
    exprs: [logic(lit(0), '||', lit(50)), logic(lit(0), '??', lit(50))],
    hint: 'Same values, different operators. One of them throws your 0 away.',
  },
  {
    id: 'double-not',
    name: '!!"hello"',
    exprs: [not(not(lit('hello')))],
    hint: 'The double NOT trick turns any value into a real true or false.',
  },
  {
    id: 'access',
    name: 'isAdmin || (…)',
    exprs: [logic(ref('isAdmin'), '||', group(logic(ref('isLoggedIn'), '&&', ref('hasPaid'))))],
    vars: { isAdmin: false, isLoggedIn: true, hasPaid: false },
    toggles: ['isAdmin', 'isLoggedIn', 'hasPaid'],
    hint: 'Can this person see the page? Flip the switches and watch which parts get skipped.',
  },
];

/** What askServer() returns in the presets. */
export const SERVER_REPLY = 'data';

export interface PrecedencePreset {
  id: string;
  name: string;
  expr: Expr;
  hint: string;
}

const p = (id: string, src: string, hint: string): PrecedencePreset => ({
  id,
  name: src,
  expr: parse(src),
  hint,
});

export const PRECEDENCE_PRESETS: PrecedencePreset[] = [
  p(
    'big',
    '2 + 3 * 4 ** 2 > 40 && !false',
    'Power first, then multiply, then add, then compare, then &&.',
  ),
  p('brackets', '(2 + 3) * 4', 'Brackets jump the queue: the + happens before the *.'),
  p('minus', '10 - 4 - 3', 'Same level, so left to right: (10 - 4) - 3 is 3, not 9.'),
  p(
    'power',
    '2 ** 3 ** 2',
    '** is the odd one out: it groups right to left, so 3 ** 2 goes first.',
  ),
  p('chain', '5 > 3 > 1', 'Looks true in maths, but JavaScript compares two at a time.'),
  p('text', '"Total: " + 2 + 3', 'Left to right: once there’s a string, + keeps joining text.'),
  p('text-brackets', '"Total: " + (2 + 3)', 'Brackets make the numbers add up first.'),
];
