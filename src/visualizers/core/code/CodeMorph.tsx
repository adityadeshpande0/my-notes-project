import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { useReducedMotion } from '../../../lib/hooks';
import { StepControls } from '../StepControls';
import { useStepper } from '../useStepper';
import { morphText, type MorphVersion } from './morph';

/**
 * CodeMorph: code that changes from one version to the next, a token at a
 * time (first built for article #5's ArrowMorph). The code is a row of
 * tokens with stable ids, so each step shows which tokens leave (struck
 * through), which arrive, and which simply slide to their new place: a
 * "FLIP" animation (measure where each token was, let React re-render,
 * measure again, and animate the difference). Under reduced motion the
 * tokens just jump.
 *
 * - `tokens`: id → text. A token whose text is "\n" starts a new line.
 * - `versions`: each version is a list of token ids, a title and a caption.
 * - `accent`: token ids to colour (e.g. the new syntax).
 * - `children(index)`: extra content under the caption for the current step.
 */
export function CodeMorph({
  tokens,
  versions,
  accent = [],
  delay = 1800,
  label = 'Code',
  children,
}: {
  tokens: Record<string, string>;
  versions: MorphVersion[];
  accent?: string[];
  delay?: number;
  label?: string;
  children?: (index: number) => ReactNode;
}) {
  const s = useStepper(versions.length, delay);
  const v = versions[s.index];
  const prev = versions[Math.max(0, s.index - 1)];
  const first = morphText(tokens, versions[0].ids).length;
  const now = morphText(tokens, v.ids).length;
  return (
    <>
      {v.title && (
        <p className="cm-title">
          <span className="cm-step-n">{s.index + 1}</span> {v.title}
        </p>
      )}
      <TokenLine
        tokens={tokens}
        ids={v.ids}
        prev={s.index > 0 ? prev.ids : v.ids}
        accent={accent}
        label={label}
      />
      <p className="cm-chars">
        {first} → <strong>{now}</strong> characters
      </p>
      <div className="viz-caption" aria-live="polite">
        {v.caption}
      </div>
      {children?.(s.index)}
      <StepControls s={s} />
    </>
  );
}

/** The tokens. Ones that stay slide to their new place; removed ones fade with a strikethrough. */
export function TokenLine({
  tokens,
  ids,
  prev,
  accent = [],
  label = 'Code',
}: {
  tokens: Record<string, string>;
  ids: string[];
  prev: string[];
  accent?: string[];
  label?: string;
}) {
  const leaving = prev.filter((id) => !ids.includes(id));
  const reduced = useReducedMotion();
  const refs = useRef(new Map<string, HTMLSpanElement>());
  const lastRects = useRef(new Map<string, DOMRect>());
  // Show the leaving tokens where they used to be: right after the token
  // that came before them in the previous version.
  const shown = [...ids];
  for (const id of leaving) {
    const before = prev
      .slice(0, prev.indexOf(id))
      .reverse()
      .find((p) => shown.includes(p));
    shown.splice(before ? shown.indexOf(before) + 1 : 0, 0, id);
  }

  useLayoutEffect(() => {
    const next = new Map<string, DOMRect>();
    refs.current.forEach((el, id) => {
      const rect = el.getBoundingClientRect();
      next.set(id, rect);
      const before = lastRects.current.get(id);
      if (!before || reduced || leaving.includes(id)) return;
      const dx = before.left - rect.left;
      const dy = before.top - rect.top;
      if (!dx && !dy) return;
      // Invert: jump back to where it was… then Play: glide to the new place.
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
        duration: 450,
        easing: 'cubic-bezier(0.3, 0.8, 0.3, 1)',
      });
    });
    lastRects.current = next;
  }, [ids, prev, reduced]); // eslint-disable-line react-hooks/exhaustive-deps -- `leaving` is derived from these

  return (
    <pre className="cm-code viz-mono" aria-label={`${label}: ${morphText(tokens, ids)}`}>
      {shown.map((id) =>
        tokens[id] === '\n' ? (
          <span key={id} className="cm-br" aria-hidden="true" />
        ) : (
          <span
            key={id}
            ref={(el) => {
              if (el) refs.current.set(id, el);
              else refs.current.delete(id);
            }}
            className={`cm-token ${leaving.includes(id) ? 'is-leaving' : ''} ${accent.includes(id) ? 'is-accent' : ''}`}
            aria-hidden="true"
          >
            {tokens[id]}
          </span>
        ),
      )}
    </pre>
  );
}
