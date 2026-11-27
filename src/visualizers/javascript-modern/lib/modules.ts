/**
 * The import editor's rules: given what app.js imports and what math.js
 * exports, decide what happens, the way a browser's module loader would.
 * The exports list comes from the REAL module (demo/math.ts), and running
 * calls the real exported functions. modules.test.ts covers every choice.
 */
import * as math from '../demo/math';

export type DefaultName = 'formatRupees' | 'rupees' | 'fmt' | 'none';
export interface ImportChoice {
  named: { GST: boolean; addGST: boolean; addTax: boolean };
  /** import { addGST as withTax } */
  alias: boolean;
  defaultName: DefaultName;
  /** The mistake: import { formatRupees } (braces) instead of import formatRupees. */
  braces: boolean;
  /** The mistake: math.js has two `export default`s. */
  twoDefaults: boolean;
}

/** What math.js really exports (minus our test helper). */
export const EXPORTS = Object.keys(math).filter((k) => !k.startsWith('_'));

export type Outcome =
  | { ok: true; output: string[]; code: string }
  | {
      ok: false;
      where: 'math.js' | 'app.js';
      name: 'SyntaxError';
      message: string;
      plain: string;
      missing?: string;
      code: string;
    };

/** The import line the learner built. */
export function importCode(c: ImportChoice): string {
  const named: string[] = [];
  if (c.braces && c.defaultName !== 'none') named.push('formatRupees');
  if (c.named.GST) named.push('GST');
  if (c.named.addGST) named.push(c.alias ? 'addGST as withTax' : 'addGST');
  if (c.named.addTax) named.push('addTax');
  const def = !c.braces && c.defaultName !== 'none' ? c.defaultName : '';
  const parts = [def, named.length ? `{ ${named.join(', ')} }` : ''].filter(Boolean);
  if (!parts.length) return 'import "./math.js"; // imports nothing';
  return `import ${parts.join(', ')} from "./math.js";`;
}

/** The lines of app.js that use what was imported. */
export function appBody(c: ImportChoice): string[] {
  const add = c.named.addGST ? (c.alias ? 'withTax' : 'addGST') : null;
  const fmt = !c.braces && c.defaultName !== 'none' ? c.defaultName : null;
  const lines: string[] = [];
  if (c.named.GST) lines.push('console.log(GST);');
  if (fmt) lines.push(`console.log(${fmt}(${add ? `${add}(100)` : '100'}));`);
  else if (add) lines.push(`console.log(${add}(100));`);
  return lines;
}

export function resolve(c: ImportChoice): Outcome {
  const code = [importCode(c), ...appBody(c)].join('\n');
  if (c.twoDefaults)
    return {
      ok: false,
      where: 'math.js',
      name: 'SyntaxError',
      message: "Duplicate export of 'default'",
      plain: 'A module can only have one default export.',
      code,
    };
  // Named imports are matched by NAME against the real exports, in order.
  const wanted = [
    ...(c.braces && c.defaultName !== 'none' ? ['formatRupees'] : []),
    ...(['GST', 'addGST', 'addTax'] as const).filter((n) => c.named[n]),
  ];
  const missing = wanted.find((n) => !EXPORTS.includes(n));
  if (missing)
    return {
      ok: false,
      where: 'app.js',
      name: 'SyntaxError',
      message: `The requested module './math.js' does not provide an export named '${missing}'`,
      plain:
        missing === 'formatRupees'
          ? 'formatRupees is the DEFAULT export. Default exports are imported without { }.'
          : `math.js has no export called ${missing}. Named imports must match an export's name exactly.`,
      missing,
      code,
    };
  // It links! Run it, calling the real functions.
  const output: string[] = [];
  const add = c.named.addGST ? math.addGST : null;
  const fmt = !c.braces && c.defaultName !== 'none' ? math.default : null;
  if (c.named.GST) output.push(String(math.GST));
  if (fmt) output.push(fmt(add ? add(100) : 100));
  else if (add) output.push(String(add(100)));
  return { ok: true, output, code };
}

/** Trying to use a variable math.js never exported. */
export function trySecret(): { error: string } {
  return 'secretRecipe' in math
    ? { error: 'It worked?' }
    : { error: 'ReferenceError: secretRecipe is not defined' };
}

export function allImportChoices(): ImportChoice[] {
  const out: ImportChoice[] = [];
  for (let m = 0; m < 8; m++)
    for (const alias of [false, true])
      for (const defaultName of ['formatRupees', 'rupees', 'fmt', 'none'] as DefaultName[])
        for (const braces of [false, true])
          for (const twoDefaults of [false, true])
            out.push({
              named: { GST: !!(m & 1), addGST: !!(m & 2), addTax: !!(m & 4) },
              alias,
              defaultName,
              braces,
              twoDefaults,
            });
  return out;
}

// ─── A real project (the dependency graph) ───────────────────────────

export interface ProjectFile {
  id: string;
  label: string;
  /** Column in the map (0 = the entry). */
  col: number;
  imports: string[];
  exports: string;
  pkg?: boolean;
  /** Code nobody imports (tree-shaking drops it). */
  unused?: string;
  /** Example size in KB (illustrative). */
  kb: number;
}
export const PROJECT: ProjectFile[] = [
  {
    id: 'main',
    label: 'main.jsx',
    col: 0,
    imports: ['react', 'App'],
    exports: '(the entry: nothing exported)',
    kb: 0.4,
  },
  {
    id: 'App',
    label: 'App.jsx',
    col: 1,
    imports: ['react', 'Navbar', 'SnackList'],
    exports: 'export default App',
    kb: 1.2,
  },
  {
    id: 'Navbar',
    label: 'Navbar.jsx',
    col: 2,
    imports: ['react'],
    exports: 'export default Navbar',
    kb: 0.8,
  },
  {
    id: 'SnackList',
    label: 'SnackList.jsx',
    col: 2,
    imports: ['react', 'SnackCard'],
    exports: 'export default SnackList',
    kb: 0.9,
  },
  {
    id: 'SnackCard',
    label: 'SnackCard.jsx',
    col: 3,
    imports: ['format'],
    exports: 'export default SnackCard',
    kb: 0.7,
  },
  {
    id: 'format',
    label: 'utils/format.js',
    col: 3,
    imports: [],
    exports: 'export { formatRupees, formatDate }',
    unused: 'formatDate',
    kb: 0.5,
  },
  {
    id: 'react',
    label: 'react',
    col: 4,
    imports: [],
    exports: 'useState, useEffect, …',
    pkg: true,
    kb: 52,
  },
];

/** The order a bundler visits files: follow imports depth-first from the entry. */
export function bundleOrder(files = PROJECT, entry = 'main'): string[] {
  const seen: string[] = [];
  const visit = (id: string) => {
    if (seen.includes(id)) return;
    seen.push(id);
    for (const dep of files.find((f) => f.id === id)?.imports ?? []) visit(dep);
  };
  visit(entry);
  return seen;
}
