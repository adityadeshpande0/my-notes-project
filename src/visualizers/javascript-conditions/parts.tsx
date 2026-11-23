/** Small pieces shared by the visuals in "Operators & Conditions". */

// The code view, console, notes and tabs now live in core, so other articles can use them too.
export { CodeView, ConsoleOut, Rich, Tabs, type CodeLine } from '../core/code';

/** A − value + control for small whole numbers. */
export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  const set = (n: number) => onChange(Math.min(max, Math.max(min, n)));
  return (
    <div className="jc-stepper" role="group" aria-label={label}>
      <span className="jc-stepper-name viz-mono">{label}</span>
      <button
        type="button"
        className="viz-btn viz-btn--icon"
        onClick={() => set(value - 1)}
        disabled={disabled || value <= min}
        aria-label={`Decrease ${label}`}
      >
        −
      </button>
      <input
        type="number"
        className="jc-stepper-input viz-mono"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => {
          const n = Math.round(Number(e.target.value));
          if (Number.isFinite(n)) set(n);
        }}
      />
      <button
        type="button"
        className="viz-btn viz-btn--icon"
        onClick={() => set(value + 1)}
        disabled={disabled || value >= max}
        aria-label={`Increase ${label}`}
      >
        +
      </button>
    </div>
  );
}

/** A big true/false badge: green ✓ for true, coral ✗ for false. */
export function BoolBadge({ value }: { value: boolean }) {
  return (
    <span className={`jc-bool ${value ? 'is-true' : 'is-false'}`}>
      <span aria-hidden="true">{value ? '✓' : '✗'}</span> {String(value)}
    </span>
  );
}
