import type { CSSProperties } from 'react';

/**
 * An order token: the picture of one promise. Pending, it shows its number
 * and a ring that fills over its cooking time. When it settles it FLIPS
 * (a 3D card turn; a fade under reduced motion) to a mint "fulfilled" back
 * with the value, or a coral "rejected" back with the error. 🔒 = settled,
 * it will never change again.
 */
export type TokenState = 'pending' | 'fulfilled' | 'rejected' | 'skipped' | 'idle';

export default function Token({
  n,
  emoji,
  state,
  text,
  ms,
  size = 'md',
  label,
}: {
  n: number | string;
  emoji: string;
  state: TokenState;
  /** The value or error message, shown on the back. */
  text?: string;
  /** Real ms for the pending ring to fill (omit for no ring). */
  ms?: number;
  size?: 'md' | 'sm' | 'lg';
  label?: string;
}) {
  const settled = state === 'fulfilled' || state === 'rejected';
  return (
    <div
      className={`as-token is-${size} is-${state}`}
      role="img"
      aria-label={`${label ?? `Order #${n}`}: ${state}${text ? `, ${text}` : ''}`}
    >
      <div className="as-token-inner">
        <div className="as-token-face as-token-front">
          <span className="as-token-n viz-mono">#{n}</span>
          <span className="as-token-emoji" aria-hidden="true">
            {emoji}
          </span>
          {state === 'pending' && ms !== undefined ? (
            <span
              className="as-token-ring"
              style={{ '--ms': `${ms}ms` } as CSSProperties}
              aria-hidden="true"
            />
          ) : (
            <span className="as-token-status">
              {state === 'skipped' ? '⏭ skipped' : state === 'idle' ? 'not started' : '⏳ pending'}
            </span>
          )}
        </div>
        <div className="as-token-face as-token-back">
          <span className="as-token-status">
            {state === 'rejected' ? '❌ rejected' : '✅ fulfilled'}
          </span>
          {text && <span className="as-token-text viz-mono">{text}</span>}
          {settled && (
            <span className="as-token-lock" title="Settled: it won't change again">
              🔒
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
