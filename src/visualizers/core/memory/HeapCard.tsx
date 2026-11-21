import type { BoxState } from './MemoryBox';

export interface HeapProp {
  key: string;
  /** Value as code, e.g. "\"Riya\"". Ignored when `refTo` is set. */
  value: string;
  /** This property holds an arrow to another heap card. */
  refTo?: string;
  refLabel?: string;
}

/**
 * An object or array living in the heap, drawn as a card. Its id is the
 * target for RefArrows. `arrows` shows a "2 arrows → 1 object" badge.
 */
export function HeapCard({
  id,
  label,
  isArray,
  props,
  state = 'same',
  changedKey,
  arrows = 0,
}: {
  id: string;
  label: string;
  isArray?: boolean;
  props: HeapProp[];
  state?: BoxState;
  changedKey?: string;
  arrows?: number;
}) {
  return (
    <div className={`heap-card is-${state}`} data-heap-id={id}>
      <div className="heap-head">
        <span className="heap-label">{label}</span>
        <span className="heap-type">{isArray ? 'array' : 'object'}</span>
        {arrows > 1 && (
          <span className="heap-shared">
            {arrows} arrows → 1 {isArray ? 'array' : 'object'}
          </span>
        )}
      </div>
      <dl className="heap-props">
        {props.length === 0 && <span className="heap-empty">empty</span>}
        {props.map((p) => (
          <div key={p.key} className={`heap-prop ${p.key === changedKey ? 'is-changed' : ''}`}>
            <dt>{isArray ? `[${p.key}]` : p.key}</dt>
            <dd>
              {p.refTo ? (
                <span className="mem-ref" data-ref-from={`${id}.${p.key}`} data-ref-to={p.refTo}>
                  <span>→ {p.refLabel ?? p.refTo}</span>
                  <span className="mem-ref-dot" aria-hidden="true" />
                </span>
              ) : (
                <code>{p.value}</code>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
