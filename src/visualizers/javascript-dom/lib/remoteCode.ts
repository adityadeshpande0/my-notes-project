/**
 * The code the DOM remote shows for each action, as a learner would write it
 * on a real page. Pure string building: no DOM, so it's easy to test.
 */
export type FindMethod = 'querySelector' | 'querySelectorAll' | 'getElementById';

/** `document.querySelector(".item")` and friends. */
export const findExpr = (method: FindMethod, query: string) =>
  `document.${method}(${JSON.stringify(query)})`;

/**
 * One change, written out in full. `stmt` turns an element expression into
 * the statement (e.g. x => `${x}.remove()`).
 * - one element: `document.querySelector("h1").remove();`
 * - a NodeList, first item: `document.querySelectorAll(".item")[0].remove();`
 * - a NodeList, all items: a for...of loop (article #4!)
 */
export function actionCode(
  method: FindMethod,
  query: string,
  loop: boolean,
  stmt: (el: string) => string,
): string {
  const found = findExpr(method, query);
  if (method !== 'querySelectorAll') return `${stmt(found)};`;
  if (!loop) return `${stmt(`${found}[0]`)};`;
  return `for (const el of ${found}) {\n  ${stmt('el')};\n}`;
}

/** A JavaScript string literal for a value (handles quotes and newlines). */
export const str = (s: string) => JSON.stringify(s);
