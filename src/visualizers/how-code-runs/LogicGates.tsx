import { useState } from 'react';
import { alpha, C } from '../core/colors';

/**
 * Interactive logic gates: pick a gate, flip the inputs, see the output,
 * the truth table, and (for the basic ones) the same idea built from switches.
 */

type GateId = 'NOT' | 'AND' | 'OR' | 'NAND' | 'XOR';

const GATES: Record<
  GateId,
  { fn: (a: number, b: number) => number; rule: string; transistors: string; built: string }
> = {
  NOT: {
    fn: (a) => 1 - a,
    rule: 'Flips the input: 1 becomes 0, 0 becomes 1.',
    transistors: '2 transistors',
    built:
      'One switch pulls the output up to power, the other pulls it down to ground. Only one is ever on.',
  },
  AND: {
    fn: (a, b) => a & b,
    rule: 'Output is 1 only if A AND B are both 1.',
    transistors: '6 transistors',
    built: 'A NAND gate followed by a NOT gate.',
  },
  OR: {
    fn: (a, b) => a | b,
    rule: 'Output is 1 if A OR B (or both) are 1.',
    transistors: '6 transistors',
    built: 'A NOR gate followed by a NOT gate.',
  },
  NAND: {
    fn: (a, b) => 1 - (a & b),
    rule: '"Not AND": output is 0 only when both inputs are 1.',
    transistors: '4 transistors',
    built:
      "The chip designer's favourite: any other gate (and so any computer) can be built from NANDs alone.",
  },
  XOR: {
    fn: (a, b) => a ^ b,
    rule: '"Exclusive OR": output is 1 when the inputs are different.',
    transistors: '≈ 8–12 transistors',
    built:
      "Usually made from a few NAND/NOR gates. It's the heart of the adder: 1 ⊕ 1 = 0 (and carry the 1).",
  },
};
const ORDER: GateId[] = ['NOT', 'AND', 'OR', 'NAND', 'XOR'];

const mono = { fontFamily: 'var(--font-mono)' };

function GateSymbol({ id, a, b, out }: { id: GateId; a: number; b: number; out: number }) {
  const single = id === 'NOT';
  const wire = (v: number) => `wire ${v ? 'on' : ''}`;
  const body = { strokeWidth: 2.5, style: { fill: C.bg, stroke: C.accent } };
  const AND = 'M120 30 H180 A50 50 0 0 1 180 130 H120 Z';
  const OR = 'M112 30 Q200 30 240 80 Q200 130 112 130 Q142 80 112 30 Z';
  const curvedInput = id === 'OR' || id === 'XOR';

  return (
    <svg viewBox="0 0 380 160" role="img" aria-label={`${id} gate with output ${out}`}>
      {single ? (
        <line x1={20} y1={80} x2={120} y2={80} className={wire(a)} />
      ) : (
        <>
          <line x1={20} y1={50} x2={curvedInput ? 128 : 120} y2={50} className={wire(a)} />
          <line x1={20} y1={110} x2={curvedInput ? 128 : 120} y2={110} className={wire(b)} />
        </>
      )}
      <text
        x={20}
        y={single ? 70 : 40}
        fontSize={13}
        style={{ ...mono, fill: a ? C.active : C.muted }}
      >
        A = {a}
      </text>
      {!single && (
        <text x={20} y={100} fontSize={13} style={{ ...mono, fill: b ? C.active : C.muted }}>
          B = {b}
        </text>
      )}

      {id === 'NOT' && (
        <>
          <path d="M120 35 L220 80 L120 125 Z" {...body} />
          <circle cx={228} cy={80} r={8} {...body} />
        </>
      )}
      {id === 'AND' && <path d={AND} {...body} />}
      {id === 'NAND' && (
        <>
          <path d={AND} {...body} />
          <circle cx={238} cy={80} r={8} {...body} />
        </>
      )}
      {id === 'OR' && <path d={OR} {...body} />}
      {id === 'XOR' && (
        <>
          <path
            d="M98 30 Q128 80 98 130"
            strokeWidth={2.5}
            style={{ fill: 'none', stroke: C.accent }}
          />
          <path d={OR} {...body} />
        </>
      )}

      <text
        x={id === 'NOT' ? 160 : 168}
        y={86}
        fontSize={13}
        fontWeight={700}
        textAnchor="middle"
        style={{ fill: C.accent }}
      >
        {id}
      </text>

      <line
        x1={id === 'NOT' ? 236 : id === 'NAND' ? 246 : 230}
        y1={80}
        x2={318}
        y2={80}
        className={wire(out)}
      />
      {/* Output lamp */}
      <circle
        cx={340}
        cy={80}
        r={20}
        strokeWidth={2.5}
        style={{
          fill: out ? alpha(C.ok, 25) : C.bg,
          stroke: out ? C.ok : C.border,
          transition: 'all .25s',
          filter: out ? `drop-shadow(0 0 10px ${alpha(C.ok, 70)})` : 'none',
        }}
      />
      <text
        x={340}
        y={86}
        textAnchor="middle"
        fontSize={16}
        fontWeight={700}
        style={{ ...mono, fill: out ? C.ok : C.muted }}
      >
        {out}
      </text>
    </svg>
  );
}

/** Battery → switches → lamp. Shows why AND = series and OR = parallel. */
function SwitchView({ id, a, b, out }: { id: GateId; a: number; b: number; out: number }) {
  const sw = (x: number, y: number, closed: number, name: string) => (
    <g>
      <circle cx={x} cy={y} r={4} style={{ fill: C.text }} />
      <circle cx={x + 50} cy={y} r={4} style={{ fill: C.text }} />
      <line
        x1={x}
        y1={y}
        x2={closed ? x + 50 : x + 42}
        y2={closed ? y : y - 24}
        strokeWidth={3}
        strokeLinecap="round"
        style={{ stroke: closed ? C.active : C.muted, transition: 'all .2s' }}
      />
      <text
        x={x + 25}
        y={y + 22}
        textAnchor="middle"
        fontSize={12}
        style={{ ...mono, fill: closed ? C.active : C.muted }}
      >
        {name}={closed}
      </text>
    </g>
  );

  // Circuit-diagram battery: a long plate (+) and a short plate (−).
  const battery = (
    <g aria-hidden="true">
      <line x1={22} y1={46} x2={22} y2={74} strokeWidth={3} style={{ stroke: C.text }} />
      <line x1={32} y1={53} x2={32} y2={67} strokeWidth={5} style={{ stroke: C.text }} />
      <path d="M32 60 H40" className="wire" />
      <text x={22} y={40} textAnchor="middle" fontSize={10} style={{ fill: C.muted }}>
        +
      </text>
    </g>
  );

  // Circuit-diagram lamp: a circle with a cross, glowing amber when lit.
  const lamp = (
    <g>
      <circle
        cx={330}
        cy={60}
        r={18}
        strokeWidth={2.5}
        style={{
          fill: out ? alpha(C.warn, 30) : C.bg,
          stroke: out ? C.warn : C.border,
          filter: out ? `drop-shadow(0 0 12px ${alpha(C.warn, 80)})` : 'none',
          transition: 'all .25s',
        }}
      />
      <path
        d="M317 47 L343 73 M343 47 L317 73"
        strokeWidth={2}
        style={{ stroke: out ? C.warn : C.border }}
      />
    </g>
  );
  const c = `wire ${out ? 'on flow' : ''}`;

  if (id === 'AND')
    return (
      <svg viewBox="0 0 380 130" role="img" aria-label="Two switches in series powering a lamp">
        {battery}
        <path d="M40 60 H90" className={c} />
        <path d="M140 60 H190" className={c} />
        <path d="M240 60 H312" className={c} />
        {sw(90, 60, a, 'A')}
        {sw(190, 60, b, 'B')}
        {lamp}
        <text x={190} y={120} textAnchor="middle" fontSize={12} style={{ fill: C.muted }}>
          Switches in a line (series): both must be closed.
        </text>
      </svg>
    );
  if (id === 'OR')
    return (
      <svg viewBox="0 0 380 130" role="img" aria-label="Two switches in parallel powering a lamp">
        {battery}
        <path d="M40 60 H80 V30 H140 M80 60 V90 H140" className={c} />
        <path d="M190 30 H240 V60 M190 90 H240 V60 H312" className={c} />
        {sw(140, 30, a, 'A')}
        {sw(140, 90, b, 'B')}
        {lamp}
        <text x={190} y={126} textAnchor="middle" fontSize={12} style={{ fill: C.muted }}>
          Switches side by side (parallel): either one works.
        </text>
      </svg>
    );
  if (id === 'NOT')
    return (
      <svg
        viewBox="0 0 380 130"
        role="img"
        aria-label="A switch that drains current away from the lamp"
      >
        {battery}
        <path d="M40 60 H312" className={c} />
        <path d="M175 60 V100" className={`wire ${a ? 'on' : ''}`} />
        {sw(175, 100, a, 'A')}
        <text x={234} y={104} fontSize={11} style={{ fill: C.muted }}>
          → ground
        </text>
        {lamp}
        <text x={190} y={20} textAnchor="middle" fontSize={12} style={{ fill: C.muted }}>
          Closing A drains the current away, so the lamp goes off.
        </text>
      </svg>
    );
  return null;
}

export default function LogicGates() {
  const [gate, setGate] = useState<GateId>('AND');
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const g = GATES[gate];
  const out = g.fn(a, b);
  const single = gate === 'NOT';
  const rows = single
    ? [
        [0, 0],
        [1, 0],
      ]
    : [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ];

  const toggle = (v: number, set: (n: number) => void, name: string) => (
    <button
      type="button"
      className="viz-btn viz-mono"
      aria-pressed={v === 1}
      onClick={() => set(1 - v)}
      style={{
        minWidth: 90,
        background: v ? alpha(C.active, 15) : undefined,
        borderColor: v ? C.active : undefined,
        color: v ? C.active : undefined,
      }}
    >
      {name} = {v}
    </button>
  );

  return (
    <div className="viz not-prose">
      <p className="viz-title">Logic gates: tiny decision makers</p>
      <p className="viz-sub">Choose a gate, flip the inputs, and watch the output.</p>

      <div
        role="group"
        aria-label="Choose a gate"
        style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}
      >
        {ORDER.map((id) => (
          <button
            type="button"
            key={id}
            className="viz-btn"
            aria-pressed={gate === id}
            onClick={() => setGate(id)}
          >
            {id}
          </button>
        ))}
      </div>

      <div className="viz-grid-2" style={{ alignItems: 'center' }}>
        <div>
          <GateSymbol id={gate} a={a} b={b} out={out} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
            {toggle(a, setA, 'A')}
            {!single && toggle(b, setB, 'B')}
          </div>
        </div>

        <div>
          <table
            className="viz-mono"
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, textAlign: 'center' }}
          >
            <thead>
              <tr style={{ color: C.muted }}>
                <th style={{ padding: 6 }}>A</th>
                {!single && <th>B</th>}
                <th>{gate}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([ra, rb]) => {
                // Highlight the row that matches the current inputs.
                const current = ra === a && (single || rb === b);
                const o = g.fn(ra, rb);
                return (
                  <tr
                    key={`${ra}${rb}`}
                    style={{
                      background: current ? alpha(C.active, 12) : 'transparent',
                      outline: current ? `1px solid ${C.active}` : 'none',
                      transition: 'background .2s',
                    }}
                  >
                    <td style={{ padding: 6 }}>{ra}</td>
                    {!single && <td>{rb}</td>}
                    <td style={{ color: o ? C.ok : C.muted, fontWeight: 700 }}>{o}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="viz-sub" style={{ margin: '.5rem 0 0', textAlign: 'center' }}>
            Truth table: every possible input, and the output it gives.
          </p>
        </div>
      </div>

      {(gate === 'AND' || gate === 'OR' || gate === 'NOT') && (
        <div className="viz-panel" style={{ marginTop: 10 }}>
          <div className="viz-label">The same gate, built from switches</div>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            {/* key: a fresh drawing per gate, so shapes do not animate between unrelated diagrams */}
            <SwitchView key={gate} id={gate} a={a} b={b} out={out} />
          </div>
        </div>
      )}

      <div className="viz-caption">
        <strong>{gate}</strong>: {g.rule}{' '}
        <span className="viz-chip" style={{ marginLeft: 6 }}>
          {g.transistors}
        </span>
        <br />
        <span style={{ color: C.muted }}>{g.built}</span>
      </div>
    </div>
  );
}
