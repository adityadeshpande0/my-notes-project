import { useState, type KeyboardEvent, type ReactNode } from 'react';

/** Small pieces shared by the visuals in this article. */

/** Code with line numbers; the running line is highlighted in mint. */
export function CodeLines({ code, line }: { code: string; line: number | null }) {
  return (
    <pre className="jv-code viz-mono">
      {code.split('\n').map((text, i) => {
        const on = line === i + 1;
        return (
          <div key={i} className={`jv-line ${on ? 'is-on' : ''}`} aria-current={on || undefined}>
            <span className="jv-ln" aria-hidden="true">
              {i + 1}
            </span>
            <span>{text || ' '}</span>
          </div>
        );
      })}
    </pre>
  );
}

/** What the program printed, plus the error that stopped it (in coral). */
export function ConsoleOut({ lines, error }: { lines: string[]; error?: string }) {
  return (
    <div className="viz-panel jv-console" aria-label="Console">
      <div className="viz-label">Console</div>
      <div className="viz-mono" aria-live="polite">
        {lines.length === 0 && !error && <span className="jv-muted">(nothing printed yet)</span>}
        {lines.map((l, i) => (
          <div key={i} className="jv-out">
            <span aria-hidden="true">›</span> {l}
          </div>
        ))}
        {error && (
          <div className="jv-out jv-error">
            <span aria-hidden="true">✗</span> Uncaught {error}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * A row of tabs for presets (the ARIA tabs pattern: ← and → move between them).
 * `render` gets the active id; give the content a `key` so it resets per tab.
 */
export function PresetTabs<T extends { id: string; name: string }>({
  presets,
  label,
  render,
}: {
  presets: T[];
  label: string;
  render: (preset: T) => ReactNode;
}) {
  const [active, setActive] = useState(presets[0].id);
  const preset = presets.find((p) => p.id === active)!;
  const onKey = (e: KeyboardEvent, i: number) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = presets[(i + dir + presets.length) % presets.length];
    setActive(next.id);
    (e.currentTarget.parentElement?.children[presets.indexOf(next)] as HTMLElement)?.focus();
  };
  return (
    <>
      <div role="tablist" aria-label={label} className="viz-seg viz-seg--2up">
        {presets.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === active}
            tabIndex={p.id === active ? 0 : -1}
            className="viz-seg-btn"
            onClick={() => setActive(p.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div role="tabpanel">{render(preset)}</div>
    </>
  );
}
