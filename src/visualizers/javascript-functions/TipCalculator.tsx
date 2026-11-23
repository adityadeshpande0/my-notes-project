/**
 * #8 Tip Calculator: "Your first function-powered app"
 *
 * ─── YOUR TURN ─────────────────────────────────────────────────────────
 * This one is yours to build. The component below is a placeholder so the
 * article still reads well until you replace it.
 *
 * The app: inputs for Bill amount (₹, a number input), Tip % (buttons 5 /
 * 10 / 15 / 20 plus a custom input) and People (a − n + stepper, 1–20).
 * Results update live: Tip, Total and a big Per person, formatted with
 *   value.toLocaleString("en-IN", { style: "currency", currency: "INR" })
 * A small "Function call" panel shows the exact call, e.g.
 * calculateTip(1200, 15, 4), and the object it returned.
 * Extras: a "Round up per person" toggle (Math.ceil), and a friendly message
 * instead of results when the bill is empty or negative (an early return!).
 *
 * Suggested steps:
 *  1. Write calculateTip(bill, tipPercent = 10, people = 1) as a plain
 *     function in lib/calculateTip.ts. Test it FIRST in
 *     lib/calculateTip.test.ts:
 *       (1200, 15, 4) → { tip: 180, total: 1380, perPerson: 345 }
 *       (1000)        → { tip: 100, total: 1100, perPerson: 1100 }
 *       …and one case of your own.
 *  2. In this component keep bill, tipPercent and people in useState.
 *     DON'T put the results in state: call calculateTip(...) while
 *     rendering and use what it returns. That's derived state, like the
 *     name checker in article #2.
 *  3. For the stepper you can borrow the pattern from
 *     ../javascript-conditions/parts.tsx (Stepper).
 *  4. Notice your component is ALSO a function: it takes props and returns
 *     UI. Functions all the way down.
 * Ping me when you have a first version and I'll review it.
 * ───────────────────────────────────────────────────────────────────────
 */

// Placeholder: replace this whole component with your calculator.
export default function TipCalculator() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Tip calculator (coming soon)</p>
      <p className="viz-sub">
        A small app powered by the calculateTip function above is being built.
      </p>
      <p className="viz-caption">
        The idea: the function does the maths, and the interface simply calls it again whenever an
        input changes.
      </p>
    </div>
  );
}
