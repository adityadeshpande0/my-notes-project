import { Fragment, useState, type KeyboardEvent, type ReactNode } from 'react';

/**
 * Code and console pieces shared by the JavaScript course's visuals:
 * code with a highlighted line and ✓/✗ marks, a console panel, `backtick`
 * notes, and a row of tabs. Import `code.css` from the note's visualizer index.
 */

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
    <pre className="vc-code viz-mono" aria-label={label}>
      {lines.map((l, i) => (
        <div
          key={i}
          className={`vc-line ${l.state ? `is-${l.state}` : ''}`}
          aria-current={l.state === 'on' || undefined}
        >
          <span className="vc-ln" aria-hidden="true">
            {i + 1}
          </span>
          <span className="vc-text">{l.text || ' '}</span>
          {l.badge && <span className={`vc-badge is-${l.badge.tone}`}>{l.badge.text}</span>}
        </div>
      ))}
    </pre>
  );
}

/** What the program printed. */
export function ConsoleOut({ lines, flash }: { lines: string[]; flash?: number }) {
  return (
    <div className="viz-panel vc-console" aria-label="Console">
      <div className="viz-label">Console</div>
      <div className="viz-mono" aria-live="polite">
        {lines.length === 0 && <span className="vc-muted">(nothing printed yet)</span>}
        {lines.map((l, i) => (
          <div key={`${flash}-${i}`} className="vc-out">
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
