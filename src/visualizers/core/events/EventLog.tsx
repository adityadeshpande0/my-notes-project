import { useState } from 'react';
import { eventCategory, MAX_ROWS, type EventRow } from './log';

/**
 * A scrolling, timestamped log of events (newest on top). Each row has a
 * chip coloured by the kind of event, the target and short details. Rows that
 * carry `props` open an inspector of the event object when clicked.
 *
 * Screen readers hear only the LATEST row (one polite live region), so a
 * burst of events doesn't flood them. Used by the Events article's visuals.
 * Import `events.css` from the note's visualizer index.
 */
export function EventLog({
  rows,
  onClear,
  label = 'Event log',
  empty = 'Nothing yet. Try the mini page!',
  height = '16rem',
}: {
  rows: EventRow[];
  onClear?: () => void;
  label?: string;
  empty?: string;
  height?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const latest = rows[0];
  return (
    <div className="viz-panel ev-log">
      <div className="ev-log-head">
        <span className="viz-label" style={{ margin: 0 }}>
          {label}
        </span>
        <span className="ev-log-count viz-mono">
          {rows.length}/{MAX_ROWS}
        </span>
        {onClear && (
          <button
            type="button"
            className="viz-btn ev-log-clear"
            onClick={onClear}
            disabled={!rows.length}
          >
            Clear
          </button>
        )}
      </div>
      <ol className="ev-log-rows" style={{ maxHeight: height }} aria-label={label}>
        {rows.length === 0 && <li className="ev-log-empty">{empty}</li>}
        {rows.map((r) => {
          const body = (
            <>
              <span className="ev-time viz-mono">{r.stamp ?? `+${r.t}ms`}</span>
              <span className={`ev-chip is-${r.category ?? eventCategory(r.type)} viz-mono`}>
                {r.type}
              </span>
              {r.target && <span className="ev-target viz-mono">{r.target}</span>}
              {r.detail && <span className="ev-detail viz-mono">{r.detail}</span>}
            </>
          );
          return (
            <li key={r.id} className={`ev-row ${r.tone ? `is-${r.tone}` : ''}`}>
              {r.props ? (
                <button
                  type="button"
                  className="ev-row-btn"
                  aria-expanded={open === r.id}
                  onClick={() => setOpen(open === r.id ? null : r.id)}
                >
                  {body}
                  <span className="ev-open" aria-hidden="true">
                    {open === r.id ? '▾' : '▸'}
                  </span>
                </button>
              ) : (
                <div className="ev-row-btn">{body}</div>
              )}
              {r.props && open === r.id && (
                <dl className="ev-props viz-mono">
                  {r.props.map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          );
        })}
      </ol>
      {/* Only the newest row is announced. */}
      <p className="sr-only" aria-live="polite">
        {latest
          ? `${latest.type}${latest.target ? ` on ${latest.target}` : ''}${latest.detail ? `, ${latest.detail}` : ''}`
          : ''}
      </p>
    </div>
  );
}
