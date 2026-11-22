import { Fragment, useState, type KeyboardEvent, type ReactNode } from 'react';

/** Small pieces shared by the visuals in "Operators & Conditions". */

export interface CodeLine {
  text: string;
  /** on = running now (mint), dim = never runs. */
  state?: 'on' | 'dim';
  /** A mark at the end of the line: ✓, ✗, "skipped"… */
  badge?: { text: string; tone: 'yes' | 'no' | 'muted' | 'warn' };
}

/** Code with line numbers, a highlighted line, and ✓/✗ marks. */
export function CodeView({ lines, label = 'Code' }: { lines: CodeLine[]; label?: string }) {
  return (
    <pre className="jc-code viz-mono" aria-label={label}>
      {lines.map((l, i) => (
        <div
          key={i}
          className={`jc-line ${l.state ? `is-${l.state}` : ''}`}
          aria-current={l.state === 'on' || undefined}
        >
          <span className="jc-ln" aria-hidden="true">
            {i + 1}
          </span>
          <span className="jc-text">{l.text || ' '}</span>
          {l.badge && <span className={`jc-badge is-${l.badge.tone}`}>{l.badge.text}</span>}
        </div>
      ))}
    </pre>
  );
}

/** What the program printed. */
export function ConsoleOut({ lines, flash }: { lines: string[]; flash?: number }) {
  return (
    <div className="viz-panel jc-console" aria-label="Console">
      <div className="viz-label">Console</div>
      <div className="viz-mono" aria-live="polite">
        {lines.length === 0 && <span className="jc-muted">(nothing printed yet)</span>}
        {lines.map((l, i) => (
          <div key={`${flash}-${i}`} className="jc-out">
            <span aria-hidden="true">›</span> {l}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Turns `backticks` in a sentence into <code>, so the step notes written in
 * the plain-TypeScript engines can show code without containing JSX.
 */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split('`').map((part, i) =>
        i % 2 ? (
          <code key={i} className="viz-mono">
            {part}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * A row of tabs (the ARIA tabs pattern: ← and → move between them).
 * `children` gets the active tab's id.
 */
export function Tabs<T extends string>({
  tabs,
  label,
  children,
  twoUp,
}: {
  tabs: { id: T; name: string }[];
  label: string;
  children: (active: T) => ReactNode;
  twoUp?: boolean;
}) {
  const [active, setActive] = useState<T>(tabs[0].id);
  const onKey = (e: KeyboardEvent, i: number) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const j = (i + dir + tabs.length) % tabs.length;
    setActive(tabs[j].id);
    (e.currentTarget.parentElement?.children[j] as HTMLElement | undefined)?.focus();
  };
  return (
    <>
      <div role="tablist" aria-label={label} className={`viz-seg ${twoUp ? 'viz-seg--2up' : ''}`}>
        {tabs.map((t, i) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === active}
            tabIndex={t.id === active ? 0 : -1}
            className="viz-seg-btn"
            onClick={() => setActive(t.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div role="tabpanel">{children(active)}</div>
    </>
  );
}

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
