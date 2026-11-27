# Your turn: modernise the legacy shop

`legacy/shop.js` runs a small Chai Corner shop: a menu, a cart, prices with GST,
discount codes and a receipt. It **works**, but it's written the old way: `var`
everywhere, a constructor function with `prototype` methods, string
concatenation, index loops, `Object.assign` copies and `&&` chains.

Your job: **rewrite it with modern JavaScript and split it into modules**, while
the tests prove it still behaves exactly the same. Improving code without
changing what it does is called **refactoring**, and it's a very real developer
task.

## The rules

- `tests/shop.test.js` describes what the shop does. **Don't change the tests.**
- The tests import everything from `src/index.js`. Right now that file just
  re-exports the legacy code, so **all the tests pass already**.
- Run them from the project root:

  ```bash
  npx vitest run exercises/legacy-shop
  ```

  (`npm test` runs them too, along with the rest of the site's tests.)

## The steps

1. **Split into modules** under `src/`:
   - `pricing.js`: named exports `GST`, `addGST`, `applyDiscount`
   - `menu.js`: `MENU`, `findItem`, `groupByCategory` (use `Object.groupBy`) and `cheapestFirst`
   - `cart.js`: a `Cart` **class**, with the items in a private `#items` field
   - `format.js`: a **default export** `formatReceipt`, plus a named `formatRupees`
   - `index.js`: re-export the public API from your modules
     (`export { Cart } from "./cart.js";` and so on)
2. **Modernise** as you go: `const`/`let`, template literals, arrow functions,
   destructuring (including in parameters), spread instead of `Object.assign`,
   `?.`/`??` instead of `&&` chains and ternaries, `toSorted` instead of
   `slice().sort()`, and `for...of` or array methods instead of index loops.
3. **Keep the tests green.** When your modules are ready, switch `src/index.js`
   from the legacy file to them, run the tests, and fix anything that changed.
   All 18 tests must pass, unchanged.

## Checklist

Tick each one off when you've used it at least once:

- [ ] `const` and `let` (no `var` left)
- [ ] Template literals instead of `+` string building
- [ ] Arrow functions
- [ ] Object destructuring, including in a parameter (e.g. `formatReceipt(cart, { customer, code } = {})`)
- [ ] Array destructuring or a rest parameter
- [ ] Spread (`{ ...item, quantity }`) instead of `Object.assign`
- [ ] Optional chaining `?.` and nullish coalescing `??`
- [ ] Default parameter values (e.g. `quantity = 1`)
- [ ] A `class` with a private `#field`
- [ ] `toSorted` (no mutating `sort`)
- [ ] `Object.groupBy`
- [ ] `for...of` or array methods (`map`, `filter`, `reduce`, `find`) instead of index loops
- [ ] Named exports, one default export, and re-exports in `index.js`

## Hints

- Work in **small steps**, and run the tests after each one.
- Start with `pricing.js`: it's the smallest. Then `menu.js`, `format.js` and
  finally `cart.js`.
- Commit after each module, so you can always go back.
- If a test fails, its message tells you which behaviour changed. Read it before
  changing anything else.
- Watch out: the receipt shows "Guest" when there's no customer name. Does `??`
  or `||` give the same behaviour for an empty object? (Check the last test.)
- When you're done, ask Claude Code to **review** your refactor rather than
  write it for you.
