/** Kitchen speed: 0.5×, 1× or 2× (2× = twice as fast). A row of radio buttons. */
export default function Speed({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Kitchen speed" className="as-speed">
      <span className="as-small as-muted">Speed</span>
      {[0.5, 1, 2].map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          aria-pressed={value === v}
          className="viz-btn"
          onClick={() => onChange(v)}
        >
          {v}×
        </button>
      ))}
    </div>
  );
}
