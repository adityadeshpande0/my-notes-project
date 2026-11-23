/**
 * Scope lookups for ScopeBubbles (#7). Plain TypeScript, no React.
 *
 * To find a variable, JavaScript looks in the current scope first, then
 * the one around it, and so on out to Global. It never looks inward.
 * scope.test.ts checks every lookup against the same code run for real.
 */
import { readTaxOutside, shadowing } from './realFunctions';

export interface ScopeDef {
  id: string;
  name: string;
  parent: string | null;
  vars: [name: string, value: string][];
}

export interface LogLine {
  /** 1-based code line. */
  line: number;
  /** The scope the line runs in. */
  scope: string;
  /** The variables it reads, in order. */
  names: string[];
  /** What the line really prints (or throws). */
  result: string;
}

export interface ScopePreset {
  id: string;
  name: string;
  code: string[];
  scopes: ScopeDef[];
  logs: LogLine[];
  caption: string;
}

export interface SearchStep {
  name: string;
  scope: string;
  found: boolean;
  /** The value, once found. */
  value?: string;
}

export interface Lookup {
  steps: SearchStep[];
  /** Set when a name wasn't found anywhere: the real error. */
  error?: string;
}

/** Search for each name, starting in `from` and moving outward. */
export function lookup(preset: ScopePreset, from: string, names: string[]): Lookup {
  const byId = new Map(preset.scopes.map((s) => [s.id, s]));
  const steps: SearchStep[] = [];
  for (const name of names) {
    let scope = byId.get(from) ?? null;
    let found = false;
    while (scope) {
      const hit = scope.vars.find(([n]) => n === name);
      steps.push({ name, scope: scope.id, found: Boolean(hit), value: hit?.[1] });
      if (hit) {
        found = true;
        break;
      }
      scope = scope.parent ? (byId.get(scope.parent) ?? null) : null;
    }
    if (!found) return { steps, error: `ReferenceError: ${name} is not defined` };
  }
  return { steps };
}

const shadowed = shadowing(); // ["Goa", "Mumbai"], from the real code

export const SCOPE_PRESETS: ScopePreset[] = [
  {
    id: 'bill',
    name: 'The bill',
    code: [
      'const shopName = "Chai Corner";',
      '',
      'function makeBill() {',
      '  const tax = 18;',
      '  console.log(shopName + " adds " + tax + "% tax");',
      '}',
      '',
      'makeBill();',
      'console.log(tax);',
    ],
    scopes: [
      { id: 'global', name: 'Global', parent: null, vars: [['shopName', '"Chai Corner"']] },
      { id: 'makeBill', name: 'makeBill', parent: 'global', vars: [['tax', '18']] },
    ],
    logs: [
      {
        line: 5,
        scope: 'makeBill',
        names: ['shopName', 'tax'],
        result: 'Chai Corner' + ' adds ' + 18 + '% tax',
      },
      { line: 9, scope: 'global', names: ['tax'], result: readTaxOutside() },
    ],
    caption:
      'Inside makeBill you can see outward to Global. From Global you can’t see into makeBill.',
  },
  {
    id: 'shadow',
    name: 'Shadowing',
    code: [
      'const city = "Mumbai";',
      'function plan() {',
      '  const city = "Goa";',
      '  console.log(city);   // Goa',
      '}',
      'plan();',
      'console.log(city);     // Mumbai',
    ],
    scopes: [
      { id: 'global', name: 'Global', parent: null, vars: [['city', '"Mumbai"']] },
      { id: 'plan', name: 'plan', parent: 'global', vars: [['city', '"Goa"']] },
    ],
    logs: [
      { line: 4, scope: 'plan', names: ['city'], result: shadowed[0] },
      { line: 7, scope: 'global', names: ['city'], result: shadowed[1] },
    ],
    caption:
      'The search stops at the first match, so the closest city wins. The outer one is hidden (shadowed) inside plan.',
  },
  {
    id: 'nested',
    name: 'Nested functions',
    code: [
      'const app = "Stackscape";',
      'function outer() {',
      '  const user = "Riya";',
      '  function inner() {',
      '    const greeting = "Hi";',
      '    console.log(greeting + " " + user + ", welcome to " + app);',
      '  }',
      '  inner();',
      '}',
      'outer();',
    ],
    scopes: [
      { id: 'global', name: 'Global', parent: null, vars: [['app', '"Stackscape"']] },
      { id: 'outer', name: 'outer', parent: 'global', vars: [['user', '"Riya"']] },
      { id: 'inner', name: 'inner', parent: 'outer', vars: [['greeting', '"Hi"']] },
    ],
    logs: [
      {
        line: 6,
        scope: 'inner',
        names: ['greeting', 'user', 'app'],
        result: 'Hi' + ' ' + 'Riya' + ', welcome to ' + 'Stackscape',
      },
    ],
    caption:
      'Inner functions can see their parents’ variables. This becomes a superpower in the Closures article.',
  },
];
