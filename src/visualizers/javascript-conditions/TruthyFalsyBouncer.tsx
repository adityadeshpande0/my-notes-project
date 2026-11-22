import { show } from './lib/format';

/**
 * #3 Truthy/Falsy Bouncer: "Who gets into the if?"
 *
 * ─── YOUR TURN ─────────────────────────────────────────────────────────
 * This one is yours to build. Everything below is a placeholder so the
 * article still reads well until you replace it.
 *
 * The game: value chips queue up at a party door labelled
 *   if ( ___ ) { 🎉 party }
 * For each chip the reader presses "Let in 🎉" (truthy) or "Not tonight 🚫"
 * (falsy). Right answers walk through the door (or get turned away) with a
 * ✓ and a short reason. Wrong answers make the bouncer shake his head and
 * show the reason. At the end: a "Falsy Hall of Fame" of all 8 falsy values
 * (highlight the ones the reader got wrong), the score, and "Play again"
 * (shuffled).
 *
 * Suggested steps:
 *  1. State: `const [index, setIndex] = useState(0)`, plus `score` and
 *     `mistakes` (an array of labels). Ask yourself: which of these could be
 *     *worked out* from the others instead of stored? (Derived state.)
 *  2. The answer is always `Boolean(chip.value)`. Never hard-code it.
 *  3. Render with a ternary, the very thing this article teaches:
 *       index < VALUES.length ? <Chip … /> : <Summary … />
 *  4. Show feedback for the last answer before moving on. A `lastAnswer`
 *     state ({ label, correct }) works well; clear it on "Next".
 *  5. Play again: shuffle a copy (`[...VALUES]`), never the original array.
 *  6. Style: reuse `.viz`, `.viz-btn`, `.viz-caption` and the colours in
 *     `C` from '../core/colors' (green = right, coral = wrong, with ✓/✗ too).
 *  7. Keyboard: buttons work with Tab + Enter for free. Reduced motion: let
 *     the chip appear in place instead of walking (viz.css already turns
 *     off CSS animations for you).
 * Ping me when you have a first version and I'll review it.
 * ───────────────────────────────────────────────────────────────────────
 */

/** The queue. `label` is how the value is written in code. */
const VALUES: { label: string; value: unknown }[] = [
  { label: '0', value: 0 },
  { label: '"0"', value: '0' },
  { label: '""', value: '' },
  { label: '" "', value: ' ' },
  { label: '[]', value: [] },
  { label: '{}', value: {} },
  { label: 'null', value: null },
  { label: 'undefined', value: undefined },
  { label: 'NaN', value: NaN },
  { label: '"false"', value: 'false' },
  { label: 'false', value: false },
  { label: '42', value: 42 },
  { label: '-1', value: -1 },
  { label: '0n', value: 0n },
  { label: '-0', value: -0 },
  { label: '"hello"', value: 'hello' },
];

/** The 8 falsy values, worked out by JavaScript from the queue above. */
const FALSY = VALUES.filter((v) => Boolean(v.value) === false);

// Placeholder: replace this whole component with your game.
export default function TruthyFalsyBouncer() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">The bouncer (coming soon)</p>
      <p className="viz-sub">
        A door game for sorting truthy from falsy is being built. Until then, here is the guest
        list. Only these {FALSY.length} values are turned away from the <code>if</code>:
      </p>
      <div className="jc-row">
        {FALSY.map((v) => (
          <code key={v.label} className="viz-chip viz-mono">
            {v.label}
          </code>
        ))}
      </div>
      <p className="viz-caption">
        Everyone else gets in, including {['0', ' ', 'false'].map((s) => show(s)).join(', ')},{' '}
        <code>[]</code> and <code>{'{}'}</code>.
      </p>
    </div>
  );
}
