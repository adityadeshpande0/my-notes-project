/**
 * The shared "memory" drawing style for the JavaScript course.
 *
 * - A variable is a labelled box: the name on a tag, the value inside.
 * - Primitive values sit inside the box. Objects live in the heap as cards
 *   (HeapCard), and the box only holds an arrow to one (RefArrows draws it).
 * - const boxes get a lock, var boxes look faded ("old style").
 * - New boxes glow mint, changed values flash amber, errors shake in coral.
 */
export type BoxKind = 'let' | 'const' | 'var';
export type BoxState = 'new' | 'changed' | 'same' | 'error';

export interface MemoryBoxProps {
  name: string;
  /** The value inside, written as code ("10", "\"Riya\"", "undefined"). Ignored when `refTo` is set. */
  value: string;
  kind: BoxKind;
  state?: BoxState;
  /** Heap id this box points to (an object/array). Shows "→ #1" and anchors an arrow. */
  refTo?: string;
  /** Short label for the heap card, e.g. "#1". */
  refLabel?: string;
  /** Exists but holds `undefined` because of hoisting. */
  hoisted?: boolean;
  /** In the Temporal Dead Zone: exists, but can't be touched yet. */
  tdz?: boolean;
  /** Draw attention to the box (e.g. its object just changed). */
  pulse?: boolean;
}

export function MemoryBox({
  name,
  value,
  kind,
  state = 'same',
  refTo,
  refLabel,
  hoisted,
  tdz,
  pulse,
}: MemoryBoxProps) {
  const classes = [
    'mem-box',
    `mem-box--${kind}`,
    `is-${state}`,
    hoisted ? 'is-hoisted' : '',
    tdz ? 'is-tdz' : '',
    pulse ? 'is-pulse' : '',
  ].join(' ');

  return (
    <div className={classes} data-mem-box={name}>
      <div className="mem-tag">
        <span className="mem-kind">{kind}</span>
        <span className="mem-name">{name}</span>
        {kind === 'const' && (
          <span className="mem-lock" aria-label="locked (const)" role="img">
            🔒
          </span>
        )}
      </div>
      <div className="mem-value">
        {tdz ? (
          <span className="mem-tdz-label">TDZ ⛔</span>
        ) : refTo ? (
          <span className="mem-ref" data-ref-from={name} data-ref-to={refTo}>
            <span>→ {refLabel ?? refTo}</span>
            <span className="mem-ref-dot" aria-hidden="true" />
          </span>
        ) : (
          <code>{value}</code>
        )}
      </div>
      {hoisted && !tdz && <span className="mem-note">hoisted</span>}
    </div>
  );
}
