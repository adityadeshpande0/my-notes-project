import { useMemo, useState } from 'react';
import { CodeView, Tabs } from '../core/code';
import { IterationCounter } from '../core/IterationCounter';
import { StackTower } from '../core/stack';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import {
  COUNTDOWN_CODE,
  FACTORIAL_CODE,
  FIB_CODE,
  FIB_MEMO_CODE,
  fibCalls,
  GUARD_DEPTH,
  NO_BASE_CODE,
  traceCountdown,
  traceFactorial,
  traceFib,
  traceNoBase,
  type CallStep,
  type Trace,
  type TreeNode,
} from './lib/callSim';
import { FrameView } from './FrameView';

/**
 * #9 Down to the base case, and back up. One run, two views that move
 * together: the call stack (plates) and the call tree (who called whom).
 * Both read the same step from lib/callSim.ts, whose values and call counts
 * are tested against real recursive functions.
 */
type TabId = 'countdown' | 'factorial' | 'fib' | 'nobase';

export default function RecursionTree() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Down to the base case, and back up</p>
      <p className="viz-sub">The stack and the call tree show the same run, step by step.</p>
      <Tabs
        twoUp
        label="Examples"
        tabs={[
          { id: 'countdown', name: 'Countdown' },
          { id: 'factorial', name: 'Factorial' },
          { id: 'fib', name: 'Fibonacci' },
          { id: 'nobase', name: 'No base case 💥' },
        ]}
      >
        {(t) => <Example key={t} tab={t as TabId} />}
      </Tabs>
    </div>
  );
}

function Example({ tab }: { tab: TabId }) {
  const [n, setN] = useState(tab === 'countdown' ? 3 : tab === 'factorial' ? 5 : 5);
  const [memo, setMemo] = useState(false);
  const max = tab === 'countdown' ? 6 : 7;
  const trace = useMemo(
    () =>
      tab === 'countdown'
        ? traceCountdown(n)
        : tab === 'factorial'
          ? traceFactorial(n)
          : tab === 'fib'
            ? traceFib(n, memo)
            : traceNoBase(),
    [tab, n, memo],
  );
  const code =
    tab === 'countdown'
      ? COUNTDOWN_CODE
      : tab === 'factorial'
        ? FACTORIAL_CODE
        : tab === 'fib'
          ? memo
            ? FIB_MEMO_CODE
            : FIB_CODE
          : NO_BASE_CODE;

  return (
    <>
      {tab !== 'nobase' && (
        <div className="jf-row">
          <label className="jf-slider jf-slider--short">
            <span className="viz-mono">n = {n}</span>
            <input
              type="range"
              min={1}
              max={max}
              value={n}
              onChange={(e) => setN(Number(e.target.value))}
            />
          </label>
          {tab === 'fib' && (
            <label className="jf-check">
              <input type="checkbox" checked={memo} onChange={(e) => setMemo(e.target.checked)} />
              Memoize
            </label>
          )}
        </div>
      )}
      <Player key={`${n}-${memo}`} tab={tab} trace={trace} code={code} memo={memo} />
      {tab === 'fib' && <FibChart />}
    </>
  );
}

function Player({
  tab,
  trace,
  code,
  memo,
}: {
  tab: TabId;
  trace: Trace;
  code: string[];
  memo: boolean;
}) {
  const s = useStepper(trace.steps.length, tab === 'fib' ? 500 : 900);
  const step = trace.steps[s.index];
  const overflow = step.event === 'overflow';
  // Show the recursive plates; main() stays at the bottom like everywhere else.
  return (
    <>
      <div className="jf-rec-grid">
        <div className="viz-panel">
          <div className="viz-label">Code</div>
          <CodeView
            lines={code.map((text, k) => ({ text, state: step.line === k + 1 ? 'on' : undefined }))}
          />
          <div className="jf-row jf-gap">
            <IterationCounter
              count={step.calls}
              label="calls"
              icon="📞"
              tone={overflow ? 'danger' : s.atEnd ? 'done' : 'normal'}
            />
            <span className="viz-counter">
              depth: <strong className="viz-mono">{Math.max(0, step.stack.length - 1)}</strong>
            </span>
          </div>
          <div className="viz-panel vc-console jf-console" aria-label="Console">
            <div className="viz-mono" aria-live="polite">
              {step.output.length === 0 ? (
                <span className="vc-muted">(nothing yet)</span>
              ) : (
                step.output.map((l, k) => (
                  <div key={k} className="vc-out">
                    › {l}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="viz-panel jf-tower-panel">
          <div className="viz-label">Stack view</div>
          <div className="jf-tower-scroll">
            <StackTower keys={step.stack.map((f) => String(f.id))}>
              {step.stack.map((f, k) => (
                <FrameView
                  key={f.id}
                  frame={f}
                  isTop={k === step.stack.length - 1}
                  returning={step.event === 'return' && k === step.stack.length - 1}
                  overflow={overflow}
                />
              ))}
            </StackTower>
          </div>
        </div>
      </div>

      <div className="viz-panel jf-gap">
        <div className="viz-label">Tree view</div>
        <CallTree tab={tab} tree={trace.tree} step={step} memo={memo} />
      </div>

      {overflow && (
        <div className="jf-overflow" role="alert">
          <strong>📚 Stack overflow!</strong> Without a base case, factorial calls itself forever.
          Real JavaScript gives up after thousands of plates with{' '}
          <code className="viz-mono">RangeError: Maximum call stack size exceeded</code>. We stopped
          at {GUARD_DEPTH}.
        </div>
      )}
      <div className="viz-caption" aria-live="polite">
        {step.message}
      </div>
      <StepControls s={s} />
    </>
  );
}

const COL = 74;
const ROW = 62;

/** The call tree. Nodes appear as calls are made: mint = running, amber = waiting, green = returned. */
function CallTree({
  tab,
  tree,
  step,
  memo,
}: {
  tab: TabId;
  tree: TreeNode[];
  step: CallStep;
  memo: boolean;
}) {
  const layout = useMemo(() => {
    const kids = new Map<number | null, TreeNode[]>();
    for (const n of tree) kids.set(n.parent, [...(kids.get(n.parent) ?? []), n]);
    const pos = new Map<number, { x: number; y: number }>();
    let col = 0;
    const place = (node: TreeNode, depth: number): number => {
      const cs = kids.get(node.id) ?? [];
      const x = cs.length
        ? cs.map((c) => place(c, depth + 1)).reduce((a, b) => a + b, 0) / cs.length
        : 36 + col++ * COL;
      pos.set(node.id, { x, y: 28 + depth * ROW });
      return x;
    };
    for (const root of kids.get(null) ?? []) place(root, 0);
    const xs = [...pos.values()];
    return {
      pos,
      width: Math.max(...xs.map((p) => p.x), 0) + 40,
      height: Math.max(...xs.map((p) => p.y), 0) + 44,
    };
  }, [tree]);

  // How often each call appears in the whole run (naive fib repeats a lot).
  const repeats = new Map<string, number>();
  for (const n of tree) repeats.set(n.label, (repeats.get(n.label) ?? 0) + 1);
  const status = new Map(step.nodes.map((n) => [n.id, n]));
  const argOf = (label: string) => Number(/\((-?\d+)\)/.exec(label)?.[1]);

  return (
    <div className="viz-scroll">
      <svg
        className="jf-tree"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        style={{ width: layout.width, maxWidth: 'none' }}
        role="img"
        aria-label={`Call tree with ${step.nodes.length} calls so far. ${step.message}`}
      >
        {tree.map((node) => {
          if (node.parent === null || !status.has(node.id)) return null;
          const a = layout.pos.get(node.parent)!;
          const b = layout.pos.get(node.id)!;
          return (
            <line
              key={`e${node.id}`}
              x1={a.x}
              y1={a.y + 14}
              x2={b.x}
              y2={b.y - 14}
              className="jf-tree-edge"
            />
          );
        })}
        {tree.map((node) => {
          const st = status.get(node.id);
          if (!st) return null;
          const p = layout.pos.get(node.id)!;
          const k = argOf(node.label);
          const times = repeats.get(node.label) ?? 1;
          const repeated = tab === 'fib' && !memo && times > 1;
          const extra =
            tab === 'factorial' && k > 1
              ? st.status === 'done'
                ? `${k} × ${Number(st.value) / k} = ${st.value}`
                : `${k} × ?`
              : tab === 'countdown' && k === 0
                ? 'STOP 🛑'
                : st.status === 'memo'
                  ? `📦 ${st.value}`
                  : st.status === 'done' && st.value !== 'undefined'
                    ? `= ${st.value}`
                    : '';
          return (
            <g
              key={node.id}
              className={`jf-node is-${st.status} ${repeated ? `rep-${k % 4}` : ''}`}
              transform={`translate(${p.x} ${p.y})`}
            >
              <title>{repeated ? `${node.label} is computed ${times} times!` : node.label}</title>
              <rect x={-34} y={-13} width={68} height={26} rx={8} />
              <text textAnchor="middle" dominantBaseline="central" className="jf-node-label">
                {node.label}
              </text>
              {extra && (
                <text y={24} textAnchor="middle" className="jf-node-extra">
                  {extra}
                </text>
              )}
              {repeated && (
                <text x={30} y={-16} textAnchor="middle" className="jf-node-rep">
                  ×{times}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Calls vs n, naive vs memoized (counts from fibCalls, which the tests check). */
function FibChart() {
  const ns = [1, 2, 3, 4, 5, 6, 7];
  const data = ns.map((n) => ({
    n,
    naive: fibCalls(n, false).calls,
    memo: fibCalls(n, true).calls,
  }));
  const max = Math.max(...data.map((d) => d.naive));
  return (
    <div className="jf-fibchart">
      <div className="viz-label">How many calls? Naive vs memoized</div>
      <table className="jf-bars-table">
        <caption className="jf-small jf-muted">
          At n = 7, the naive version makes {data[6].naive} calls; with a memo it makes{' '}
          {data[6].memo}.
        </caption>
        <thead>
          <tr>
            <th scope="col">n</th>
            <th scope="col">naive</th>
            <th scope="col">memoized</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.n}>
              <th scope="row" className="viz-mono">
                {d.n}
              </th>
              <td>
                <span className="jf-hbar is-naive" style={{ width: `${(d.naive / max) * 80}%` }} />
                <span className="viz-mono">{d.naive}</span>
              </td>
              <td>
                <span className="jf-hbar is-memo" style={{ width: `${(d.memo / max) * 80}%` }} />
                <span className="viz-mono">{d.memo}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
