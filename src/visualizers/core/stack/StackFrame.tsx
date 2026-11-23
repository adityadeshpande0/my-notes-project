import type { ReactNode } from 'react';

/**
 * The call stack, drawn the same way everywhere in the JavaScript course:
 * a pile of plates that grows upwards, where JavaScript always works on the
 * top plate (it glows mint). Each plate is one function call.
 *
 * - Compact plates (just "name()") for overviews like the Event Loop.
 * - Full plates show the arguments, local variables, what the plate is
 *   waiting for, and the value it returns.
 *
 * Import `stack.css` from the note's visualizer index.
 */
export interface FrameVar {
  name: string;
  /** The value as code: "200", "\"riya\"", "undefined". */
  value: string;
  /** Flash it: it was just created or changed. */
  fresh?: boolean;
}

export type FrameState = 'top' | 'waiting' | 'returning' | 'overflow';

export interface StackFrameProps {
  name: string;
  args?: FrameVar[];
  locals?: FrameVar[];
  state?: FrameState;
  /** What a waiting plate is waiting for, e.g. "applyDiscount". */
  waitingFor?: string;
  /** Where the answer will land, e.g. "const total = ▢". */
  slot?: string;
  /** A value that just came back from the plate above, shown in the slot. */
  received?: string;
  /** The value this plate is handing back (shown while it lifts off). */
  returns?: string;
  /** A quick built-in call (console.log, toUpperCase…), drawn faintly. */
  builtin?: boolean;
  /** Just a pill with the name, no details. */
  compact?: boolean;
}

export function StackFrame({
  name,
  args = [],
  locals = [],
  state = 'waiting',
  waitingFor,
  slot,
  received,
  returns,
  builtin,
  compact,
}: StackFrameProps) {
  const cls = [
    'sf-plate',
    `is-${state}`,
    builtin ? 'is-builtin' : '',
    compact ? 'is-compact' : '',
  ].join(' ');
  const signature = compact
    ? name
    : `${name}(${args.map((a) => `${a.name}: ${a.value}`).join(', ')})`;

  return (
    <div className={cls}>
      <div className="sf-head">
        {state === 'top' && (
          <span className="sf-now" aria-label="running now">
            ▶
          </span>
        )}
        <span className="sf-sig viz-mono">{signature}</span>
        {builtin && !compact && <span className="sf-tag">built-in</span>}
      </div>
      {!compact && locals.length > 0 && (
        <div className="sf-locals">
          {locals.map((v) => (
            <span key={v.name} className={`sf-var viz-mono ${v.fresh ? 'is-fresh' : ''}`}>
              <span className="sf-var-name">{v.name}</span>
              <span className="sf-var-value">{v.value}</span>
            </span>
          ))}
        </div>
      )}
      {!compact && state === 'waiting' && waitingFor && (
        <div className="sf-wait">
          ⏸ waiting for {waitingFor}…{slot && <span className="sf-slot viz-mono"> {slot}</span>}
        </div>
      )}
      {!compact && received !== undefined && slot && (
        <div className="sf-received viz-mono">
          {slot.replace('▢', '')}
          <span className="sf-token is-landed">{received}</span>
        </div>
      )}
      {!compact && returns !== undefined && (
        <div className="sf-returns">
          returns <span className="sf-token">{returns}</span>
        </div>
      )}
    </div>
  );
}

/**
 * The pile of plates. Give it plates from the bottom of the stack to the top;
 * it draws them growing upwards. `tilt` gives the 3D "seen from above" look
 * (switched off under reduced motion and on narrow cards).
 */
export function StackTower({
  children,
  empty = 'empty',
  tilt,
  label = 'Call stack',
  keys,
}: {
  children: ReactNode[];
  /** One key per plate. A new key mounts a new plate, which drops in. Defaults to the position. */
  keys?: string[];
  empty?: ReactNode;
  tilt?: boolean;
  label?: string;
}) {
  if (children.length === 0) return <p className="sf-empty">{empty}</p>;
  return (
    <ol className={`sf-tower ${tilt ? 'is-tilted' : ''}`} aria-label={label}>
      {children.map((child, i) => (
        // Plates are positional: index 0 is the bottom of the stack.
        <li key={keys?.[i] ?? i} className="sf-slot-li">
          {child}
        </li>
      ))}
    </ol>
  );
}
