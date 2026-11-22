import { FlowEdge, FlowNode, type FlowState, type Point } from '../core/flow';
import type { Chain, ChainStep } from './lib/ifChain';

/**
 * The flowchart for an if / else if / else chain, drawn from one ChainStep.
 * Questions go down the left; "yes" goes right to that block; "no" goes
 * down to the next question; the last "no" lands in else. It's always
 * vertical, so it fits a phone screen.
 */
const DX = 80; // x of the questions
const AX = 252; // x of the blocks
const RAIL = 350; // x of the line that collects the blocks into End
const ROW = 78;
const TOP = 26;
const D_W = 146;
const D_H = 54;
const A_W = 118;
const A_H = 34;

export function ChainFlow<T>({
  chain,
  step,
  stepKey,
}: {
  chain: Chain<T>;
  step: ChainStep;
  stepKey: number;
}) {
  const n = chain.branches.length;
  const rowY = (i: number) => TOP + 62 + i * ROW;
  const elseY = rowY(n);
  const endY = elseY + 66;
  const endX = (DX + AX) / 2 + 20;
  const height = endY + 26;

  const { phase, at, results, taken } = step;
  const ran = phase === 'run' || phase === 'end';

  // Which edges the "train of thought" has travelled so far, in order.
  const path: string[] = [];
  if (phase !== 'start') {
    path.push('start');
    const lastChecked = phase === 'check' ? at : (taken ?? n) === n ? n - 1 : taken!;
    for (let i = 0; i < lastChecked; i++) path.push(`no${i}`);
    if (ran) path.push(taken! < n ? `yes${taken}` : `no${n - 1}`);
    if (phase === 'end') path.push(taken! < n ? `out${taken}` : 'outElse');
  }
  const lastEdge = path[path.length - 1];
  const edge = (id: string, points: Point[], label?: string, labelAt?: Point) => (
    <FlowEdge
      key={id}
      points={points}
      label={label}
      labelAt={labelAt}
      active={path.includes(id)}
      dim={ran && !path.includes(id)}
      travel={id === lastEdge}
      travelKey={stepKey}
    />
  );

  const qState = (i: number): { state: FlowState; badge?: string } => {
    if (phase === 'check' && at === i) return { state: 'active', badge: results[i] ? '✓' : '✗' };
    if (results[i] === true) return { state: 'yes', badge: '✓' };
    if (results[i] === false) return { state: 'no', badge: '✗' };
    return ran ? { state: 'skipped', badge: 'skipped' } : { state: 'idle' };
  };
  const blockState = (i: number): FlowState => {
    if (!ran) return 'idle';
    if (taken !== i) return 'skipped';
    return phase === 'run' ? 'active' : 'done';
  };

  return (
    <svg
      viewBox={`0 0 380 ${height}`}
      className="jc-flow"
      role="img"
      aria-label={flowLabel(chain, step)}
    >
      {edge('start', [
        [DX, TOP + 14],
        [DX, rowY(0) - D_H / 2],
      ])}
      {chain.branches.map((_, i) => (
        <g key={i}>
          {edge(
            `yes${i}`,
            [
              [DX + D_W / 2, rowY(i)],
              [AX - A_W / 2, rowY(i)],
            ],
            'yes',
            [(DX + D_W / 2 + AX - A_W / 2) / 2, rowY(i) - 11],
          )}
          {edge(
            `no${i}`,
            [
              [DX, rowY(i) + D_H / 2],
              [DX, i < n - 1 ? rowY(i + 1) - D_H / 2 : elseY - A_H / 2],
            ],
            'no',
            [DX + 18, rowY(i) + D_H / 2 + 12],
          )}
          {edge(`out${i}`, [
            [AX + A_W / 2, rowY(i)],
            [RAIL, rowY(i)],
            [RAIL, endY],
            [endX + 46, endY],
          ])}
        </g>
      ))}
      {edge('outElse', [
        [DX, elseY + A_H / 2],
        [DX, endY],
        [endX - 46, endY],
      ])}

      <FlowNode
        shape="terminal"
        x={DX}
        y={TOP}
        w={84}
        h={28}
        label="Start"
        state={phase === 'start' ? 'active' : 'done'}
      />
      {chain.branches.map((b, i) => (
        <g key={i}>
          <FlowNode
            shape="decision"
            x={DX}
            y={rowY(i)}
            w={D_W}
            h={D_H}
            label={wrap(`${b.cond}?`)}
            mono
            {...qState(i)}
          />
          <FlowNode
            shape="action"
            x={AX}
            y={rowY(i)}
            w={A_W}
            h={A_H}
            label={b.label}
            state={blockState(i)}
          />
        </g>
      ))}
      <FlowNode
        shape="action"
        x={DX}
        y={elseY}
        w={A_W}
        h={A_H}
        label={`else: ${chain.otherwise.label}`}
        state={blockState(n)}
      />
      <FlowNode
        shape="terminal"
        x={endX}
        y={endY}
        w={92}
        h={28}
        label="End"
        state={phase === 'end' ? 'active' : 'idle'}
      />
    </svg>
  );
}

/** Long conditions go on two lines, split at the space nearest the middle. */
function wrap(s: string) {
  if (s.length <= 14) return s;
  const spaces = [...s].map((c, i) => (c === ' ' ? i : -1)).filter((i) => i > 0);
  const mid = spaces.reduce((best, i) =>
    Math.abs(i - s.length / 2) < Math.abs(best - s.length / 2) ? i : best,
  );
  return `${s.slice(0, mid)}\n${s.slice(mid + 1)}`;
}

function flowLabel<T>(chain: Chain<T>, step: ChainStep) {
  const checked = step.results
    .map((r, i) => (r === null ? null : `${chain.branches[i].cond} is ${r}`))
    .filter(Boolean)
    .join(', ');
  return `Flowchart. ${checked ? `Checked: ${checked}. ` : ''}${step.message}`;
}
