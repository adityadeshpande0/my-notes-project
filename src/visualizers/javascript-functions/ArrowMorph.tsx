import { useLayoutEffect, useRef, useState } from 'react';
import { Tabs } from '../core/code';
import { MemoryBox } from '../core/memory';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import { useReducedMotion } from '../../lib/hooks';
import { hoistingGotcha, objectGotcha, SQUARES } from './lib/realFunctions';

/**
 * #4 From function to arrow. The code is a row of tokens with stable ids,
 * so each step can show which ones leave, which arrive, and which simply
 * slide to a new place (a "FLIP" animation: measure where each token was,
 * let React re-render, measure again, and animate the difference).
 */
const TOKENS: Record<string, string> = {
  const: 'const ',
  name: 'square',
  eq: ' = ',
  function: 'function',
  sp1: ' ',
  open: '(',
  param: 'n',
  close: ')',
  arrow: ' =>',
  sp2: ' ',
  brace: '{ ',
  return: 'return ',
  body: 'n * n',
  semi: ';',
  end: ' }',
  semi2: ';',
};

const VERSIONS: { ids: string[]; title: string; caption: string }[] = [
  {
    ids: [
      'function',
      'sp1',
      'name',
      'open',
      'param',
      'close',
      'sp2',
      'brace',
      'return',
      'body',
      'semi',
      'end',
    ],
    title: 'Function declaration',
    caption: 'The classic way: the keyword function, a name, parameters and a body.',
  },
  {
    ids: [
      'const',
      'name',
      'eq',
      'function',
      'sp1',
      'open',
      'param',
      'close',
      'sp2',
      'brace',
      'return',
      'body',
      'semi',
      'end',
      'semi2',
    ],
    title: 'Function expression',
    caption:
      'The name moves into a const. The function itself has no name now; it’s a value stored in a variable.',
  },
  {
    ids: [
      'const',
      'name',
      'eq',
      'open',
      'param',
      'close',
      'arrow',
      'sp2',
      'brace',
      'return',
      'body',
      'semi',
      'end',
      'semi2',
    ],
    title: 'Arrow function',
    caption: 'The word function disappears, and an arrow => appears after the parameters.',
  },
  {
    ids: ['const', 'name', 'eq', 'open', 'param', 'close', 'arrow', 'sp2', 'body', 'semi2'],
    title: 'Implicit return',
    caption:
      'With a single expression, drop the { } and the return: the value is returned automatically.',
  },
  {
    ids: ['const', 'name', 'eq', 'param', 'arrow', 'sp2', 'body', 'semi2'],
    title: 'One parameter, no brackets',
    caption: 'With exactly one parameter, the ( ) around it are optional.',
  },
];
const text = (ids: string[]) => ids.map((id) => TOKENS[id]).join('');

export default function ArrowMorph() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">From function to arrow</p>
      <p className="viz-sub">Step through: same function, less typing each time.</p>
      <Tabs
        label="Views"
        tabs={[
          { id: 'morph', name: 'Shrink it' },
          { id: 'gotcha', name: 'Gotchas' },
        ]}
      >
        {(t) => (t === 'morph' ? <Morph /> : <Gotchas />)}
      </Tabs>
    </div>
  );
}

function Morph() {
  const s = useStepper(VERSIONS.length, 1800);
  const v = VERSIONS[s.index];
  const prev = VERSIONS[Math.max(0, s.index - 1)];
  const [n, setN] = useState(4);
  const first = text(VERSIONS[0].ids).length;
  const now = text(v.ids).length;

  return (
    <>
      <p className="jf-version-title">
        <span className="jf-step-n">{s.index + 1}</span> {v.title}
      </p>
      <TokenLine ids={v.ids} prev={s.index > 0 ? prev.ids : v.ids} />
      <p className="jf-small jf-muted">
        {first} → <strong className="jf-chars">{now}</strong> characters
      </p>
      <div className="viz-caption" aria-live="polite">
        {v.caption}
      </div>
      <StepControls s={s} />

      <div className="jf-tester">
        <label className="jf-row">
          <span className="viz-mono">n =</span>
          <input
            type="number"
            className="jf-input jf-num"
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            aria-label="n"
          />
        </label>
        <ul className="jf-ticks">
          {SQUARES.map((fn, k) => (
            <li key={k} className="viz-mono">
              <span className="jf-tick">✓</span> version {k + 1}: square({n}) → {fn(n)}
            </li>
          ))}
        </ul>
        <p className="jf-small jf-muted">
          {new Set(SQUARES.map((fn) => fn(n))).size === 1
            ? 'Every version gives the same answer.'
            : ''}
        </p>
      </div>
    </>
  );
}

/** The code as tokens. Tokens that stay slide to their new place; removed ones fade with a strikethrough. */
function TokenLine({ ids, prev }: { ids: string[]; prev: string[] }) {
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
    <pre className="jf-morph viz-mono" aria-label={text(ids)}>
      {shown.map((id) => (
        <span
          key={id}
          ref={(el) => {
            if (el) refs.current.set(id, el);
            else refs.current.delete(id);
          }}
          className={`jf-token ${leaving.includes(id) ? 'is-leaving' : ''} ${id === 'arrow' ? 'is-arrow' : ''}`}
          aria-hidden="true"
        >
          {TOKENS[id]}
        </span>
      ))}
    </pre>
  );
}

const OBJ = objectGotcha();
const HOIST = hoistingGotcha();

function Gotchas() {
  return (
    <div className="viz-grid-2">
      <div className="viz-panel">
        <div className="viz-label">Returning an object</div>
        <pre className="vc-code viz-mono">
          <div className="vc-line">
            <span>
              const a = () =&gt; {'{'} name: "Riya" {'}'};
            </span>
          </div>
          <div className="vc-line">
            <span>
              const b = () =&gt; ({'{'} name: "Riya" {'}'});
            </span>
          </div>
        </pre>
        <p className="jf-result viz-mono jf-bad-text">a() → {OBJ.without}</p>
        <p className="jf-result viz-mono jf-good-text">b() → {OBJ.with}</p>
        <p className="jf-small">
          Without the brackets, the {'{ }'} is read as the function’s body, not an object, so
          nothing is returned. Wrap an object in ( ).
        </p>
      </div>
      <div className="viz-panel">
        <div className="viz-label">Calling before the line</div>
        <pre className="vc-code viz-mono">
          <div className="vc-line">
            <span>square(3);</span>
          </div>
          <div className="vc-line">
            <span>
              function square(n) {'{'} … {'}'}
            </span>
          </div>
        </pre>
        <p className="jf-result viz-mono jf-good-text">→ {HOIST.declaration} ✓ (hoisted)</p>
        <pre className="vc-code viz-mono">
          <div className="vc-line">
            <span>square(3);</span>
          </div>
          <div className="vc-line">
            <span>const square = (n) =&gt; n * n;</span>
          </div>
        </pre>
        <div className="jf-row">
          <MemoryBox name="square" kind="const" value="" tdz />
        </div>
        <p className="jf-result viz-mono jf-bad-text">💥 {HOIST.arrow}</p>
      </div>
    </div>
  );
}
