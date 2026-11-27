import { useState } from 'react';
import { CodeMorph, Tabs, type MorphVersion } from '../core/code';
import { MemoryBox } from '../core/memory';
import { hoistingGotcha, objectGotcha, SQUARES } from './lib/realFunctions';

/**
 * #4 From function to arrow. The code is a row of tokens with stable ids,
 * drawn by the shared CodeMorph (core/code): each step shows which tokens
 * leave, which arrive, and which simply slide to a new place.
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

const VERSIONS: MorphVersion[] = [
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
  const [n, setN] = useState(4);
  return (
    <CodeMorph tokens={TOKENS} versions={VERSIONS} accent={['arrow']} label="square">
      {() => (
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
      )}
    </CodeMorph>
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
