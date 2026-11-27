/**
 * A REAL tiny module, the article's math.js. ModuleMap imports it with
 * `import * as math from './demo/math'` and calls whichever exports the
 * learner chose, so the console output is genuine.
 */
export const GST = 0.18; // named export

export function addGST(price: number) {
  // named export
  return price * (1 + GST);
}

export default function formatRupees(n: number) {
  // default export (max ONE per file)
  return '₹' + n.toFixed(2);
}

// Not exported: only this file can see it (each module has its own scope).
const secretRecipe = 'two pinches of cardamom';
export const _forTestsOnly = () => secretRecipe.length > 0;
