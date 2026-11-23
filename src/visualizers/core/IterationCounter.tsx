/**
 * A lap counter chip: "🔁 3 laps". Used by the loop visuals, and later by
 * the DSA track to count operations. It gives a little pulse each time the
 * count goes up. The pulse is a CSS animation that replays because the
 * number is the element's `key`: a new key means React mounts a fresh
 * element, so the animation starts again.
 */
export function IterationCounter({
  count,
  label = 'laps',
  icon = '🔁',
  total,
  tone = 'normal',
}: {
  count: number;
  /** What is being counted ("laps", "operations"…). */
  label?: string;
  icon?: string;
  /** Show "of N" when the total is known. */
  total?: number;
  /** danger: e.g. an infinite loop was caught. */
  tone?: 'normal' | 'done' | 'danger';
}) {
  return (
    <span className={`viz-counter is-${tone}`} aria-live="polite">
      <span aria-hidden="true">{icon}</span>
      <span>{label}:</span>
      <strong key={count} className="viz-counter-n viz-mono">
        {count.toLocaleString('en-IN')}
      </strong>
      {total !== undefined && (
        <span className="viz-counter-total viz-mono">of {total.toLocaleString('en-IN')}</span>
      )}
    </span>
  );
}
