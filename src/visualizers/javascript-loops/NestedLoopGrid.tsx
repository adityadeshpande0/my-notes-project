import { useMemo, useState } from 'react';
import { CodeView, Tabs, type CodeLine } from '../core/code';
import { IterationCounter } from '../core/IterationCounter';
import { MemoryBox } from '../core/memory';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import { gridSteps, gridTotal, innerRange, type GridPattern, type GridStep } from './lib/loopSim';

/**
 * #6 Loops inside loops. The outer loop picks a row; for every row, the
 * inner loop runs all of its laps. Steps come from gridSteps (tested against
 * real nested loops), and the counter shows how fast n × n grows.
 */
const FRIENDS = [
  'Riya',
  'Arjun',
  'Meera',
  'Kabir',
  'Zoya',
  'Ishaan',
  'Anya',
  'Dev',
  'Tara',
  'Neel',
];
const SPEEDS = [
  { label: 'Slow', ms: 900 },
  { label: 'Normal', ms: 450 },
  { label: 'Fast', ms: 150 },
];

export default function NestedLoopGrid() {
  const [n, setN] = useState(3);
  const [speed, setSpeed] = useState(1);
  return (
    <div className="viz not-prose">
      <p className="viz-title">Loops inside loops</p>
      <p className="viz-sub">
        For every lap of the outer loop, the inner loop runs all of its laps.
      </p>
      <div className="jl-row">
        <label className="jl-slider jl-slider--short">
          <span className="viz-mono">n = {n}</span>
          <input
            type="range"
            min={2}
            max={10}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
          />
        </label>
        <label className="jl-small">
          Speed{' '}
          <select
            className="jl-input"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            {SPEEDS.map((sp, k) => (
              <option key={sp.label} value={k}>
                {sp.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Tabs
        twoUp
        label="Patterns"
        tabs={[
          { id: 'table', name: 'Times table' },
          { id: 'triangle', name: 'Star triangle' },
          { id: 'pairs', name: 'Every pair' },
        ]}
      >
        {(p) => (
          <GridRun key={`${p}-${n}`} pattern={p as GridPattern} n={n} delay={SPEEDS[speed].ms} />
        )}
      </Tabs>
      <GrowthChart />
    </div>
  );
}

function codeFor(pattern: GridPattern, n: number, step: GridStep): CodeLine[] {
  const inner =
    pattern === 'table'
      ? `for (let col = 1; col <= ${n}; col++) {`
      : pattern === 'triangle'
        ? 'for (let col = 1; col <= row; col++) {'
        : `for (let col = row + 1; col <= ${n}; col++) {`;
  const body =
    pattern === 'table'
      ? 'cell[row][col] = row * col;'
      : pattern === 'triangle'
        ? 'draw("⭐");'
        : 'shakeHands(row, col);';
  return [
    {
      text: `for (let row = 1; row <= ${n}; row++) {`,
      state: step.phase === 'row' ? 'on' : undefined,
    },
    { text: `  ${inner}`, state: step.phase === 'cell' ? 'on' : undefined },
    { text: `    ${body}`, state: step.phase === 'cell' ? 'on' : undefined },
    { text: '  }' },
    { text: '}' },
  ];
}

function GridRun({ pattern, n, delay }: { pattern: GridPattern; n: number; delay: number }) {
  const steps = useMemo(() => gridSteps(pattern, n), [pattern, n]);
  const s = useStepper(steps.length, delay);
  const step = steps[s.index];
  const total = gridTotal(pattern, n);
  const ended = step.phase === 'end';

  /** Has the body already run for this cell? */
  const filled = (r: number, c: number) => {
    const [from, to] = innerRange(pattern, r, n);
    if (c < from || c > to) return false;
    if (ended) return true;
    if (r < step.row) return true;
    return r === step.row && step.phase === 'cell' && c <= step.col;
  };
  const label = (r: number, c: number) =>
    pattern === 'table' ? String(r * c) : pattern === 'triangle' ? '⭐' : '🤝';
  const head = (k: number) => (pattern === 'pairs' ? FRIENDS[k - 1] : String(k));

  return (
    <>
      <div className="jl-split">
        <div className="viz-panel">
          <div className="viz-label">Code</div>
          <CodeView lines={codeFor(pattern, n, step)} />
          <div className="jl-row jl-gap">
            <MemoryBox
              key={`r${step.row}`}
              name="row"
              kind="let"
              value={step.row ? String(step.row) : '…'}
              state={step.phase === 'row' ? 'changed' : 'same'}
            />
            <MemoryBox
              key={`c${s.index}`}
              name="col"
              kind="let"
              value={step.phase === 'cell' || step.phase === 'row' ? String(step.col) : '…'}
              state={step.phase === 'row' ? 'new' : step.phase === 'cell' ? 'changed' : 'same'}
            />
          </div>
          {step.phase === 'row' && (
            <p className="jl-small jl-reset">↺ col starts again from {step.col}</p>
          )}
        </div>

        <div className="viz-panel">
          <div className="viz-label">Grid</div>
          <div className="viz-scroll">
            <div className="jl-grid-stage">
              <div
                className={`jl-grid is-${pattern}`}
                style={{ gridTemplateColumns: `auto repeat(${n}, minmax(26px, 44px))` }}
                role="img"
                aria-label={`${n} by ${n} grid. ${step.message}`}
              >
                <span />
                {Array.from({ length: n }, (_, c) => (
                  <span key={`h${c}`} className="jl-grid-head jl-grid-head--col viz-mono">
                    {head(c + 1)}
                  </span>
                ))}
                {Array.from({ length: n }, (_, r) => (
                  <Row
                    key={r}
                    r={r + 1}
                    n={n}
                    pattern={pattern}
                    step={step}
                    filled={filled}
                    label={label}
                    head={head}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="jl-row jl-gap">
        <IterationCounter
          count={step.ops}
          total={total}
          label="body ran"
          icon="⚙️"
          tone={ended ? 'done' : 'normal'}
        />
        <span className="jl-small jl-muted">
          {pattern === 'table'
            ? `n × n = ${n} × ${n} = ${total}`
            : pattern === 'triangle'
              ? `1 + 2 + … + ${n} = n(n+1)/2 = ${total}`
              : `each pair once: n(n−1)/2 = ${total} handshakes`}
        </span>
      </div>
      <div className="viz-caption" aria-live="polite">
        {step.message}
      </div>
      <StepControls s={s} />
      <div className="jl-row">
        <button
          type="button"
          className="viz-btn viz-btn--ghost"
          onClick={() => s.seek(steps.length - 1)}
          disabled={s.atEnd}
        >
          Skip to end
        </button>
      </div>
    </>
  );
}

function Row({
  r,
  n,
  pattern,
  step,
  filled,
  label,
  head,
}: {
  r: number;
  n: number;
  pattern: GridPattern;
  step: GridStep;
  filled: (r: number, c: number) => boolean;
  label: (r: number, c: number) => string;
  head: (k: number) => string;
}) {
  const current = step.row === r && (step.phase === 'row' || step.phase === 'cell');
  return (
    <>
      <span className={`jl-grid-head viz-mono ${current ? 'is-row' : ''}`}>{head(r)}</span>
      {Array.from({ length: n }, (_, c) => {
        const col = c + 1;
        const here = step.phase === 'cell' && step.row === r && step.col === col;
        const on = filled(r, col);
        // Cells the inner loop never reaches for this pattern (e.g. below the diagonal).
        const [from, to] = innerRange(pattern, r, n);
        const out = col < from || col > to;
        return (
          <span
            key={col}
            className={`jl-cell viz-mono ${current ? 'is-row' : ''} ${on ? 'is-filled' : ''} ${here ? 'is-here' : ''} ${out ? 'is-out' : ''}`}
          >
            {on ? label(r, col) : ''}
          </span>
        );
      })}
    </>
  );
}

/** Operations vs n for one loop (n) and two nested loops (n²), n = 1…10. */
function GrowthChart() {
  const W = 320;
  const H = 170;
  const L = 36;
  const B = 24;
  const T = 12;
  const R = 70;
  const xs = Array.from({ length: 10 }, (_, k) => k + 1);
  const x = (n: number) => L + ((n - 1) / 9) * (W - L - R);
  const y = (v: number) => H - B - (v / 100) * (H - B - T);
  const line = (f: (n: number) => number) =>
    xs.map((n, k) => `${k ? 'L' : 'M'}${x(n)} ${y(f(n))}`).join(' ');

  return (
    <div className="jl-growth">
      <div className="viz-label">The cost of nesting: operations as n grows</div>
      <div className="jl-growth-row">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="jl-chart"
          role="img"
          aria-labelledby="jl-growth-sum"
        >
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="jl-chart-grid" />
              <text
                x={L - 6}
                y={y(v)}
                textAnchor="end"
                dominantBaseline="central"
                className="jl-chart-tick"
              >
                {v}
              </text>
            </g>
          ))}
          {xs.map((n) => (
            <text key={n} x={x(n)} y={H - 8} textAnchor="middle" className="jl-chart-tick">
              {n}
            </text>
          ))}
          <path d={line((n) => n * n)} className="jl-chart-line is-nested" />
          <path d={line((n) => n)} className="jl-chart-line is-single" />
          {xs.map((n) => (
            <g key={n}>
              <circle cx={x(n)} cy={y(n * n)} r={4} className="jl-chart-dot is-nested">
                <title>{`n = ${n}: nested loops run ${n * n} times`}</title>
              </circle>
              <circle cx={x(n)} cy={y(n)} r={4} className="jl-chart-dot is-single">
                <title>{`n = ${n}: one loop runs ${n} times`}</title>
              </circle>
            </g>
          ))}
          <text x={x(10) + 8} y={y(100)} dominantBaseline="central" className="jl-chart-label">
            n² (nested)
          </text>
          <text x={x(10) + 8} y={y(10)} dominantBaseline="central" className="jl-chart-label">
            n (one loop)
          </text>
        </svg>
        <div className="jl-growth-side">
          <ul className="jl-legend">
            <li>
              <span className="jl-swatch is-nested" aria-hidden="true" /> two nested loops (n²)
            </li>
            <li>
              <span className="jl-swatch is-single" aria-hidden="true" /> one loop (n)
            </li>
          </ul>
          <table className="jl-growth-table">
            <thead>
              <tr>
                <th scope="col">n</th>
                <th scope="col">one loop</th>
                <th scope="col">nested</th>
              </tr>
            </thead>
            <tbody>
              {[10, 100, 1000].map((n) => (
                <tr key={n}>
                  <th scope="row" className="viz-mono">
                    {n.toLocaleString('en-IN')}
                  </th>
                  <td className="viz-mono">{n.toLocaleString('en-IN')}</td>
                  <td className="viz-mono">{(n * n).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p id="jl-growth-sum" className="jl-small jl-muted">
        At n = 10, one loop runs 10 times and two nested loops run 100 times. The gap keeps
        widening: at n = 1,000 it’s 1,000 versus 10,00,000 (a million).
      </p>
    </div>
  );
}
