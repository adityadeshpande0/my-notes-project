import { useState, type KeyboardEvent } from 'react';
import { alpha, C, mix } from '../core/colors';

/** The layers between your code and electricity, from most human to most physical. */
const LAYERS = [
  {
    name: 'Your code',
    tag: 'you write',
    color: C.accent,
    sees: 'Names, numbers and math. Readable by humans, meaningless to hardware.',
    view: 'let total = 5 + 3;',
  },
  {
    name: 'Compiler / JS engine',
    tag: 'translates',
    color: mix(C.accent, C.violet, 50),
    sees: 'Tokens and a tree of meaning: "declare total, set it to the sum of 5 and 3".',
    view: `VariableDeclaration
 └─ total =
     BinaryExpression (+)
      ├─ 5
      └─ 3`,
  },
  {
    name: 'Assembly',
    tag: 'human-readable CPU steps',
    color: C.violet,
    sees: 'Tiny commands, one per CPU action. Variables become registers and memory addresses.',
    view: `LOAD  R1, 5
LOAD  R2, 3
ADD   R3, R1, R2
STORE R3, [0x10]`,
  },
  {
    name: 'Machine code',
    tag: 'pure binary',
    color: mix(C.violet, C.pink, 50),
    sees: 'The same commands encoded as 1s and 0s. This is the only thing a CPU understands.',
    view: `0001 0001 0000 0101
0001 0010 0000 0011
0010 0011 0001 0010
0011 0011 0001 0000`,
  },
  {
    name: 'CPU',
    tag: 'fetch → decode → execute',
    color: C.pink,
    sees: 'One instruction at a time: fetch it from memory, decode the bits, execute it, repeat. Billions of times per second.',
    view: `PC → 2   IR = ADD R3,R1,R2
R1 = 5   R2 = 3
ALU: 5 + 3 → R3 = 8`,
  },
  {
    name: 'Logic gates',
    tag: 'AND · OR · XOR',
    color: C.warn,
    sees: 'The ALU adds using gates. 0101 + 0011 is worked out bit by bit, with carries flowing left.',
    view: `  0101   (5)
+ 0011   (3)
──────
  1000   (8)`,
  },
  {
    name: 'Transistors',
    tag: 'tiny switches',
    color: C.active,
    sees: 'Each gate is a few transistors. A modern chip has tens of billions of them, each either ON or OFF.',
    view: `gate = 1 → switch ON  → current flows
gate = 0 → switch OFF → no current`,
  },
  {
    name: 'Physics',
    tag: 'electrons in silicon',
    color: C.ok,
    sees: `Voltage on a transistor's gate attracts electrons into a thin channel, letting current pass. That is a "1".`,
    view: `high voltage ≈ 1
low voltage  ≈ 0`,
  },
];

export default function AbstractionLadder() {
  const [current, setCurrent] = useState(0);
  const layer = LAYERS[current];
  const last = LAYERS.length - 1;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') setCurrent((n) => Math.min(last, n + 1));
    else if (e.key === 'ArrowUp') setCurrent((n) => Math.max(0, n - 1));
    else return;
    e.preventDefault();
  };

  return (
    <div className="viz not-prose">
      <p className="viz-title">The 8 layers between your code and electricity</p>
      <p className="viz-sub">
        Click a layer (or use ↑ ↓) to see what <code className="viz-mono">let total = 5 + 3;</code>{' '}
        looks like there.
      </p>

      <div className="viz-grid-2" style={{ alignItems: 'center' }}>
        {/* The stack, tilted a little in 3D with plain CSS (no three.js needed). */}
        <div
          role="listbox"
          aria-label="Layers of abstraction"
          aria-activedescendant={`ladder-${current}`}
          tabIndex={0}
          onKeyDown={onKeyDown}
          style={{ perspective: '900px', padding: '8px 4px', borderRadius: 12 }}
        >
          <div
            style={{ transform: 'rotateX(24deg) rotateZ(-3deg)', transformStyle: 'preserve-3d' }}
          >
            {LAYERS.map((l, i) => {
              const selected = i === current;
              return (
                <div
                  key={l.name}
                  id={`ladder-${i}`}
                  role="option"
                  aria-selected={selected}
                  onClick={() => setCurrent(i)}
                  style={{
                    cursor: 'pointer',
                    margin: '0 0 6px',
                    padding: '9px 14px',
                    borderRadius: 10,
                    border: `1px solid ${selected ? l.color : C.border}`,
                    background: selected
                      ? `linear-gradient(90deg, ${alpha(l.color, 20)}, ${alpha(l.color, 5)})`
                      : C.surface,
                    boxShadow: selected
                      ? `0 10px 24px -10px ${alpha(l.color, 60)}`
                      : '0 3px 0 rgb(0 0 0 / .18)',
                    transform: selected ? 'translateZ(28px) translateX(10px)' : 'none',
                    transition:
                      'transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s, background .3s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    <span className="viz-mono" style={{ color: l.color, marginRight: 8 }}>
                      {i + 1}
                    </span>
                    {l.name}
                  </span>
                  <span className="viz-chip">{l.tag}</span>
                </div>
              );
            })}
          </div>
          <p className="viz-sub" style={{ textAlign: 'center', margin: '.5rem 0 0' }}>
            ↑ more human-friendly · ↓ closer to the hardware
          </p>
        </div>

        {/* key={current} restarts the fade-in animation each time the layer changes */}
        <div className="viz-fade" key={current}>
          <p style={{ margin: '0 0 .4rem', color: layer.color, fontWeight: 600 }}>
            Layer {current + 1}: {layer.name}
          </p>
          <p style={{ margin: '0 0 .8rem' }}>{layer.sees}</p>
          <pre
            className="viz-mono"
            style={{
              margin: 0,
              padding: 14,
              borderRadius: 10,
              background: C.bg,
              border: `1px solid ${alpha(layer.color, 40)}`,
              color: layer.color,
              fontSize: 13.5,
              whiteSpace: 'pre-wrap',
              minHeight: 110,
            }}
          >
            {layer.view}
          </pre>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              type="button"
              className="viz-btn"
              disabled={current === 0}
              onClick={() => setCurrent(current - 1)}
            >
              ↑ Up a layer
            </button>
            <button
              type="button"
              className="viz-btn"
              disabled={current === last}
              onClick={() => setCurrent(current + 1)}
            >
              ↓ Down a layer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
