/**
 * #7 FizzBuzz Board: "FizzBuzz, visualised"
 *
 * ─── YOUR TURN ─────────────────────────────────────────────────────────
 * This one is yours to build. The component below is a placeholder so the
 * article still reads well until you replace it.
 *
 * The board: a 10 × 10 grid of tiles for 1–100. "Run ▶" reveals tiles one
 * by one ("Skip" shows them all). Plain numbers are muted, Fizz amber, Buzz
 * periwinkle (accent), FizzBuzz mint with a soft glow. Under the board, live
 * counters: the final answers are 27 Fizz, 14 Buzz, 6 FizzBuzz, 53 numbers.
 *
 * Bug toggle: "Check FizzBuzz last (bug!)" reorders the conditions, so 15,
 * 30, 45… show "Fizz". Give those tiles a coral outline and a title tooltip:
 * "The first true condition wins! i % 3 === 0 caught 15 first."
 *
 * Suggested steps:
 *  1. Write a plain function fizzBuzz(n, bugMode) that builds the results
 *     with a for loop and results.push(...). Put it in lib/fizzBuzz.ts and
 *     add a Vitest test that counts 27 / 14 / 6 / 53. (Plain TS, no React.)
 *  2. Render the board with results.map((r, i) => <Tile key={i} … />).
 *     That's how React turns a loop into UI: an array in, a list of elements out.
 *  3. Keep `revealed` (how many tiles show) in state. To play, reuse
 *     useStepper(101) from '../core/useStepper' and use s.index as `revealed`,
 *     with <StepControls s={s} /> for free keyboard controls.
 *  4. Derive the counters from the results you've revealed
 *     (results.slice(0, revealed).filter(...).length). Don't store them in
 *     separate state, or they can drift out of sync.
 *  5. Colours: use theme classes or C.* from '../core/colors', and always pair
 *     a colour with the word on the tile, so it isn't colour-only.
 *  6. 360px: 10 tiles across is about 30px each, so keep the text small.
 * Stretch goal: let the reader change 3 and 5, and the words ("Chai" / "Samosa").
 * Ping me when you have a first version and I'll review it.
 * ───────────────────────────────────────────────────────────────────────
 */

// Placeholder: replace this whole component with your board.
export default function FizzBuzzBoard() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">FizzBuzz board (coming soon)</p>
      <p className="viz-sub">
        A 10 × 10 board that plays the loop above, tile by tile, is being built.
      </p>
      <p className="viz-caption">
        Until then, a teaser: from 1 to 100 there are 27 Fizz, 14 Buzz and only 6 FizzBuzz tiles.
        Can you name all six?
      </p>
    </div>
  );
}
