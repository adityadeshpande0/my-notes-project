import type { CSSProperties, ReactNode } from 'react';
import type { BoxState } from './MemoryBox';
import { typeOfCode, type ValueType } from './valueType';

/**
 * An object or array living in the heap, drawn as a card of property rows:
 * key on the left, value on the right. Its id is the target for RefArrows.
 *
 * Each row can:
 * - colour its value by type (string mint, number amber, boolean periwinkle…),
 *   worked out from the value text unless `type` is given;
 * - point to another card (`refTo`), or show a nested object/array inline
 *   (`children`, for tree-like views);
 * - carry a highlight role: read (mint glow), changed (amber flash),
 *   added (green slide-in) or deleted (coral fade-out);
 * - hold an extra control on the right (`extra`, e.g. a delete button).
 */
export type PropRole = 'read' | 'changed' | 'added' | 'deleted';

export interface HeapProp {
  key: string;
  /** Value as code, e.g. "\"Riya\"". Ignored when `refTo` is set. */
  value: string;
  /** This property holds an arrow to another heap card. */
  refTo?: string;
  refLabel?: string;
  role?: PropRole;
  /** Override the colour-by-type guess. */
  type?: ValueType;
  /** A nested object or array, drawn inline under this row. */
  children?: HeapProp[];
  /** For inline children: is the nested value an array? */
  childIsArray?: boolean;
  /** Something extra at the end of the row (a button, a note). */
  extra?: ReactNode;
}

export function HeapCard({
  id,
  label,
  isArray,
  props,
  state = 'same',
  changedKey,
  arrows = 0,
  typeLabel,
  className = '',
  style,
  children,
}: {
  id: string;
  label: string;
  isArray?: boolean;
  props: HeapProp[];
  state?: BoxState;
  /** Shorthand for giving that row the "changed" role. */
  changedKey?: string;
  arrows?: number;
  /** Replace the "object" / "array" text in the header. */
  typeLabel?: string;
  className?: string;
  style?: CSSProperties;
  /** Anything to draw under the rows (an ArrayStrip, a note…). */
  children?: ReactNode;
}) {
  return (
    <div className={`heap-card is-${state} ${className}`} data-heap-id={id} style={style}>
      <div className="heap-head">
        <span className="heap-label">{label}</span>
        <span className="heap-type">{typeLabel ?? (isArray ? 'array' : 'object')}</span>
        {arrows > 1 && (
          <span className="heap-shared">
            {arrows} arrows → 1 {isArray ? 'array' : 'object'}
          </span>
        )}
      </div>
      {(props.length > 0 || !children) && (
        <PropRows props={props} isArray={isArray} owner={id} changedKey={changedKey} />
      )}
      {children}
    </div>
  );
}

function PropRows({
  props,
  isArray,
  owner,
  changedKey,
}: {
  props: HeapProp[];
  isArray?: boolean;
  owner: string;
  changedKey?: string;
}) {
  return (
    <dl className="heap-props">
      {props.length === 0 && <span className="heap-empty">empty</span>}
      {props.map((p) => {
        const role = p.role ?? (p.key === changedKey ? 'changed' : undefined);
        const type = p.type ?? (p.refTo ? undefined : typeOfCode(p.value));
        return (
          <div
            key={p.key}
            className={`heap-prop ${role ? `is-${role}` : ''} ${p.children ? 'has-children' : ''}`}
          >
            <dt>{isArray ? `[${p.key}]` : p.key}</dt>
            <dd className={type ? `is-${type}` : undefined}>
              {p.refTo ? (
                <span className="mem-ref" data-ref-from={`${owner}.${p.key}`} data-ref-to={p.refTo}>
                  <span>→ {p.refLabel ?? p.refTo}</span>
                  <span className="mem-ref-dot" aria-hidden="true" />
                </span>
              ) : (
                <code>{p.value}</code>
              )}
            </dd>
            {p.extra && <span className="heap-extra">{p.extra}</span>}
            {p.children && (
              <div className="heap-nested">
                <PropRows props={p.children} isArray={p.childIsArray} owner={`${owner}.${p.key}`} />
              </div>
            )}
          </div>
        );
      })}
    </dl>
  );
}
