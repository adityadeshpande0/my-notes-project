import { useMemo, useState } from 'react';
import { alpha, C } from '../core/colors';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import { BITS, rippleAdd, resultOf } from './adder';

/**
 * A 4-bit ripple-carry adder. Step 0 is the intro, steps 1–4 work through
 * columns 0–3 (right to left), and the last step shows the result.
 */

/** A clickable bit in the inputs. */
function BitButton({ value, onFlip, label }: { value: number; onFlip: () => void; label: string }) {
  return (
    <button
      type="button"
      className="viz-btn viz-mono"
      onClick={onFlip}
      aria-label={`${label}, currently ${value}`}
      aria-pressed={value === 1}
      style={{
        width: 38,
        padding: '6px 0',
        fontSize: 16,
        fontWeight: 700,
        color: value ? C.bg : C.muted,
        background: value ? C.active : C.surface,
        borderColor: value ? C.active : C.border,
      }}
    >
      {value}
    </button>
  );
}

export default function AdderCircuit() {
  const [a, setA] = useState(5);
  const [b, setB] = useState(3);
  const columns = useMemo(() => rippleAdd(a, b), [a, b]);
  const s = useStepper(BITS + 2, 2400);

  const flip = (which: 'A' | 'B', bit: number) => {
    (which === 'A' ? setA : setB)((v) => v ^ (1 << bit));
    s.reset(); // new numbers: start the walkthrough again
  };

  const done = Math.min(BITS, Math.max(0, s.index)); // columns finished so far
  const activeCol = s.index >= 1 && s.index <= BITS ? s.index - 1 : -1;
  const finished = s.index > BITS;
  const carryOut = columns[BITS - 1].cout;
  const sums = columns.map((c) => c.sum);
  const total = resultOf(columns);
  const colX = (i: number) => 580 - i * 150; // column 0 on the right, like on paper
  const wireColor = (bit: number) => (bit ? C.active : C.border);
  const bin = (n: number) => n.toString(2).padStart(BITS, '0');

  let caption: string;
  if (s.index === 0) {
    caption = `We want ${a} + ${b}. In binary that's ${bin(a)} + ${bin(b)}. Each box is a "full adder" made of logic gates, and it handles one column. Press play.`;
  } else if (activeCol >= 0) {
    const c = columns[activeCol];
    caption = `Column ${activeCol} (worth ${1 << activeCol}): ${c.a} + ${c.b} + carry-in ${c.cin} = ${c.a + c.b + c.cin}. Sum bit = ${c.sum}${c.cout ? ', and carry 1 to the next column ←' : ', no carry'}.`;
  } else {
    caption = `Result: ${carryOut ? '1' : ''}${[...sums].reverse().join('')} = ${total}. ${
      carryOut
        ? 'The final carry needed a 5th bit, which real CPUs flag as an overflow (carry flag).'
        : `That's ${a} + ${b} = ${a + b}, all done with switches.`
    }`;
  }
  const active = activeCol >= 0 ? columns[activeCol] : null;

  return (
    <div className="viz not-prose">
      <p className="viz-title">A 4-bit adder: how the ALU adds</p>
      <p className="viz-sub">
        Click the bits to change the numbers. The carry ripples right → left, like adding by hand.
      </p>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}>
        {(['A', 'B'] as const).map((name) => {
          const value = name === 'A' ? a : b;
          return (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <strong className="viz-mono" style={{ width: 18 }}>
                {name}
              </strong>
              {[3, 2, 1, 0].map((bit) => (
                <BitButton
                  key={bit}
                  value={(value >> bit) & 1}
                  onFlip={() => flip(name, bit)}
                  label={`${name} bit ${bit}`}
                />
              ))}
              <span className="viz-mono" style={{ color: C.muted, marginLeft: 6 }}>
                = {value}
              </span>
            </div>
          );
        })}
      </div>

      <div className="viz-scroll">
        <svg
          viewBox="0 0 740 300"
          style={{ minWidth: 560 }}
          role="img"
          aria-label="Four full adders chained by carry wires"
        >
          {columns.map((c, i) => {
            const x = colX(i);
            const isDone = i < done;
            const isActive = i === activeCol;
            return (
              <g key={i}>
                {/* Inputs */}
                <text
                  x={x + 30}
                  y={22}
                  textAnchor="middle"
                  fontSize={13}
                  style={{ fill: c.a ? C.active : C.muted, fontFamily: 'var(--font-mono)' }}
                >
                  A{i}={c.a}
                </text>
                <text
                  x={x + 90}
                  y={22}
                  textAnchor="middle"
                  fontSize={13}
                  style={{ fill: c.b ? C.active : C.muted, fontFamily: 'var(--font-mono)' }}
                >
                  B{i}={c.b}
                </text>
                <line
                  x1={x + 30}
                  y1={30}
                  x2={x + 30}
                  y2={90}
                  className={`wire ${c.a ? 'on' : ''}`}
                  style={{ stroke: wireColor(c.a) }}
                />
                <line
                  x1={x + 90}
                  y1={30}
                  x2={x + 90}
                  y2={90}
                  className={`wire ${c.b ? 'on' : ''}`}
                  style={{ stroke: wireColor(c.b) }}
                />

                {/* The full adder box: amber while working, mint once done */}
                <rect
                  x={x}
                  y={90}
                  width={120}
                  height={90}
                  rx={12}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  style={{
                    fill: isActive ? alpha(C.warn, 14) : isDone ? alpha(C.active, 6) : C.bg,
                    stroke: isActive ? C.warn : isDone ? C.active : C.border,
                    transition: 'all .3s',
                    filter: isActive ? `drop-shadow(0 0 10px ${alpha(C.warn, 50)})` : 'none',
                  }}
                />
                <text x={x + 60} y={128} textAnchor="middle" fontSize={13} fontWeight={600}>
                  Full adder
                </text>
                <text
                  x={x + 60}
                  y={148}
                  textAnchor="middle"
                  fontSize={11}
                  style={{ fill: C.muted }}
                >
                  column {i} · worth {1 << i}
                </text>

                {/* Sum output */}
                <line
                  x1={x + 60}
                  y1={180}
                  x2={x + 60}
                  y2={240}
                  className={`wire ${isDone && c.sum ? 'on' : ''}`}
                  style={{ stroke: isDone ? wireColor(c.sum) : C.border }}
                />
                <circle
                  cx={x + 60}
                  cy={262}
                  r={20}
                  strokeWidth={2}
                  style={{
                    fill: isDone && c.sum ? alpha(C.ok, 20) : C.bg,
                    stroke: isDone ? (c.sum ? C.ok : C.muted) : C.border,
                  }}
                />
                <text
                  x={x + 60}
                  y={268}
                  textAnchor="middle"
                  fontSize={17}
                  fontWeight={700}
                  style={{
                    fill: isDone ? (c.sum ? C.ok : C.text) : C.border,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {isDone ? c.sum : '?'}
                </text>

                {/* Carry out, flowing left into the next column */}
                <line
                  x1={x}
                  y1={150}
                  x2={x - 30}
                  y2={150}
                  className={`wire ${isDone && c.cout ? 'on flow' : ''}`}
                  style={{ stroke: isDone ? wireColor(c.cout) : C.border }}
                />
                {isDone && (
                  <text
                    x={x - 15}
                    y={140}
                    textAnchor="middle"
                    fontSize={11}
                    style={{ fill: c.cout ? C.active : C.muted, fontFamily: 'var(--font-mono)' }}
                  >
                    c={c.cout}
                  </text>
                )}
              </g>
            );
          })}

          {/* Carry into column 0 is always 0 */}
          <line x1={700} y1={150} x2={735} y2={150} className="wire" />
          <text
            x={718}
            y={140}
            textAnchor="middle"
            fontSize={11}
            style={{ fill: C.muted, fontFamily: 'var(--font-mono)' }}
          >
            c=0
          </text>

          {/* Final carry out: coral if it overflows into a 5th bit */}
          <text x={80} y={186} textAnchor="middle" fontSize={10} style={{ fill: C.muted }}>
            carry out
          </text>
          <circle
            cx={80}
            cy={150}
            r={14}
            strokeWidth={2}
            style={{
              fill: finished && carryOut ? alpha(C.danger, 20) : C.bg,
              stroke: finished && carryOut ? C.danger : C.border,
            }}
          />
          <text
            x={80}
            y={155}
            textAnchor="middle"
            fontSize={12}
            style={{
              fill: finished ? (carryOut ? C.danger : C.muted) : C.border,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {finished ? carryOut : '·'}
          </text>
        </svg>
      </div>

      <div className="viz-grid-2" style={{ marginTop: 6 }}>
        <div className="viz-panel">
          <div className="viz-label">Inside the active full adder</div>
          {active ? (
            <div
              className="viz-mono viz-fade"
              key={activeCol}
              style={{ fontSize: 13.5, lineHeight: 1.8 }}
            >
              <div>
                sum = A <span style={{ color: C.warn }}>XOR</span> B{' '}
                <span style={{ color: C.warn }}>XOR</span> Cin
              </div>
              <div style={{ color: C.muted }}>
                {'     '}= {active.a} ⊕ {active.b} ⊕ {active.cin} ={' '}
                <span style={{ color: C.ok }}>{active.sum}</span>
              </div>
              <div>
                Cout = (A <span style={{ color: C.warn }}>AND</span> B){' '}
                <span style={{ color: C.warn }}>OR</span> (Cin{' '}
                <span style={{ color: C.warn }}>AND</span> (A ⊕ B))
              </div>
              <div style={{ color: C.muted }}>
                {'     '}= ({active.a}·{active.b}) + ({active.cin}·{active.x}) ={' '}
                <span style={{ color: C.active }}>{active.cout}</span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13.5, color: C.muted }}>
              Step through to see the gate formulas with real values.
            </div>
          )}
        </div>

        <div className="viz-panel">
          <div className="viz-label">Same thing on paper</div>
          <pre
            className="viz-mono"
            style={{ margin: 0, fontSize: 15, lineHeight: 1.5, whiteSpace: 'pre' }}
          >
            {`carry   ${[4, 3, 2, 1].map((c) => (c <= done && columns[c - 1].cout ? '1' : ' ')).join('')}
         ${bin(a)}   (${a})
       + ${bin(b)}   (${b})
       ──────
        ${finished && carryOut ? '1' : ' '}${sums
          .map((bit, i) => (i < done ? String(bit) : '?'))
          .reverse()
          .join('')}   ${finished ? `(${total})` : ''}`}
          </pre>
        </div>
      </div>

      <div className="viz-caption">{caption}</div>
      <StepControls s={s} />
    </div>
  );
}
