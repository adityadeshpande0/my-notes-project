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

      <div className="ladder">
        {/* Left: the layers as a vertical path, top (human) to bottom (hardware). */}
        <div>
          <div className="mb-2 flex justify-between font-mono text-[11px] tracking-wide text-muted uppercase">
            <span>↑ human-friendly</span>
          </div>
          <ol
            role="listbox"
            aria-label="Layers of abstraction"
            aria-activedescendant={`ladder-${current}`}
            tabIndex={0}
            onKeyDown={onKeyDown}
            className="relative m-0 list-none rounded-[12px] p-0"
          >
            {/* The line joining the numbered dots */}
            <span
              aria-hidden="true"
              className="absolute top-5 bottom-5 left-[19px] w-px"
              style={{ background: C.border }}
            />
            {LAYERS.map((l, i) => {
              const selected = i === current;
              const passed = i < current; // layers the code has already travelled through
              return (
                <li
                  key={l.name}
                  id={`ladder-${i}`}
                  role="option"
                  aria-selected={selected}
                  onClick={() => setCurrent(i)}
                  className="relative flex cursor-pointer items-center gap-3 rounded-[10px] py-1.5 pr-3 pl-1.5 transition-colors"
                  style={{
                    background: selected ? alpha(l.color, 12) : 'transparent',
                    boxShadow: selected ? `inset 0 0 0 1px ${alpha(l.color, 55)}` : 'none',
                  }}
                >
                  {/* Numbered dot: filled for the current layer, tinted for ones above it */}
                  <span
                    className="relative z-10 grid size-[26px] shrink-0 place-items-center rounded-full font-mono text-xs font-semibold transition-colors"
                    style={{
                      background: selected ? l.color : passed ? alpha(l.color, 18) : C.elevated,
                      color: selected ? C.bg : l.color,
                      border: `1.5px solid ${selected || passed ? l.color : C.border}`,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block text-[0.95rem] leading-tight font-semibold"
                      style={{ color: selected ? C.text : undefined }}
                    >
                      {l.name}
                    </span>
                    <span className="block truncate text-xs" style={{ color: C.muted }}>
                      {l.tag}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="mt-2 font-mono text-[11px] tracking-wide text-muted uppercase">
            ↓ closer to the hardware
          </div>
        </div>

        {/* Right: what the code looks like at the chosen layer. key restarts the fade. */}
        <div className="viz-fade flex flex-col" key={current}>
          <p className="m-0 font-mono text-xs text-muted">
            Layer {current + 1} of {LAYERS.length}
          </p>
          <p
            className="mt-1 mb-2 font-heading text-xl font-semibold"
            style={{ color: layer.color }}
          >
            {layer.name}
          </p>
          <p className="m-0 mb-4 text-[0.95rem] leading-relaxed">{layer.sees}</p>
          <pre
            className="viz-mono m-0"
            style={{
              padding: '16px 18px',
              borderRadius: 10,
              background: C.bg,
              border: `1px solid ${alpha(layer.color, 40)}`,
              borderLeft: `3px solid ${layer.color}`,
              color: layer.color,
              fontSize: 14.5,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              minHeight: 140,
            }}
          >
            {layer.view}
          </pre>
          <div className="mt-3 flex gap-2">
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
