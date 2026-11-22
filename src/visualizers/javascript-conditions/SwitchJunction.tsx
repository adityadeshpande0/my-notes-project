import { useMemo, useState } from 'react';
import { useReducedMotion } from '../../lib/hooks';
import { FlowEdge, FlowNode, type FlowState, type Point } from '../core/flow';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import { show } from './lib/format';
import {
  SWITCH_PRESETS,
  switchCodeLines,
  switchSteps,
  type SwitchSpec,
  type SwitchStep,
} from './lib/switchSim';
import { CodeView, ConsoleOut, Tabs, type CodeLine } from './parts';

/**
 * #6 The railway junction. A train carrying the value rides down past each
 * `case` station. Each station checks with ===; the first match turns green
 * and runs. Switch off a `break` and the train falls through the next
 * stations without checking them. The steps come from lib/switchSim.ts,
 * which is tested against a real switch for every combination.
 */
export default function SwitchJunction() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">The railway junction</p>
      <p className="viz-sub">
        Pick a value and press Run. Then switch off a <code>break</code> and run it again.
      </p>
      <Tabs label="Examples" tabs={SWITCH_PRESETS.map((p) => ({ id: p.id, name: p.name }))}>
        {(id) => <Junction key={id} spec={SWITCH_PRESETS.find((p) => p.id === id)!} />}
      </Tabs>
    </div>
  );
}

function Junction({ spec }: { spec: SwitchSpec }) {
  const [value, setValue] = useState<unknown>(spec.values[spec.id === 'days' ? 5 : 0]);
  const [breaks, setBreaks] = useState(() => spec.cases.map(() => true));
  // Each press of Run gets a new number, so the run below remounts and plays.
  const [run, setRun] = useState(0);

  return (
    <>
      <div className="viz-label">Value</div>
      <div className="jc-row jc-values" role="group" aria-label={`Value of ${spec.subject}`}>
        {spec.values.map((v) => (
          <button
            key={show(v)}
            type="button"
            className="viz-btn viz-mono jc-small"
            aria-pressed={Object.is(v, value)}
            onClick={() => {
              setValue(v);
              setRun(0);
            }}
          >
            {show(v)}
          </button>
        ))}
      </div>
      <div className="viz-label jc-gap">break after each case</div>
      <div className="jc-row">
        {spec.cases.map((c, i) =>
          c.output === null ? (
            <span key={i} className="jc-small jc-muted viz-mono">
              case {show(c.match)}: empty (shares the next case)
            </span>
          ) : (
            <label key={i} className="jc-check viz-mono jc-small">
              <input
                type="checkbox"
                checked={breaks[i]}
                onChange={(e) => {
                  setBreaks((b) => b.map((x, k) => (k === i ? e.target.checked : x)));
                  setRun(0);
                }}
              />
              {show(c.match)}: break
            </label>
          ),
        )}
      </div>
      <JunctionRun
        key={`${show(value)}-${breaks.join()}-${run}`}
        spec={spec}
        value={value}
        breaks={breaks}
        autoPlay={run > 0}
        onRun={() => setRun((r) => r + 1)}
      />
    </>
  );
}

// Layout of the track (SVG units).
const TRAIN_X = 22; // x of the train's own lane, left of the stations
const DX = 114;
const AX = 274;
const RAIL = 362;
const ROW = 70;
const TOP = 30;
const BOX_W = 124;
const BOX_H = 34;
const D_W = 126;
const D_H = 46;
const rowY = (i: number) => TOP + 44 + i * ROW;

function JunctionRun({
  spec,
  value,
  breaks,
  autoPlay,
  onRun,
}: {
  spec: SwitchSpec;
  value: unknown;
  breaks: boolean[];
  autoPlay: boolean;
  onRun: () => void;
}) {
  const reduced = useReducedMotion();
  const steps = useMemo(() => switchSteps(spec, value, breaks), [spec, value, breaks]);
  const s = useStepper(steps.length, 850, {
    autoPlay: autoPlay && !reduced,
    startAtEnd: autoPlay && reduced,
  });
  const step = steps[s.index];
  const n = spec.cases.length;
  const endY = rowY(n) + 62;
  const height = endY + 24;
  const history = steps.slice(0, s.index + 1);

  // Edges the train has used so far.
  const used = new Set<string>();
  for (const st of history) {
    if (st.phase === 'check') used.add(st.at === 0 ? 'enter' : `track${st.at - 1}`);
    if (
      st.phase === 'run' &&
      st.at === n &&
      !history.some((h) => h.phase === 'fall' && h.at === n)
    ) {
      used.add('enter');
      for (let i = 0; i < n; i++) used.add(`track${i}`);
      used.add(`yes${n}`);
    }
    if (st.phase === 'run' && st.at < n) used.add(`yes${st.at}`);
    if (st.phase === 'fall') used.add(`fall${st.at - 1}`);
    if (st.phase === 'break') used.add(`exit${st.at}`);
    if (st.phase === 'end' && st.at === n) used.add('out');
  }
  // The very first fall from an empty case also starts at its yes edge.
  const matchedAt = history.find((h) => h.phase === 'check' && h.matched)?.at;
  if (matchedAt !== undefined) used.add(`yes${matchedAt}`);

  const stationState = (i: number): { state: FlowState; badge?: string } => {
    const check = history.find((h) => h.phase === 'check' && h.at === i);
    if (!check)
      return { state: history.some((h) => h.phase === 'fall' && h.at === i) ? 'warn' : 'idle' };
    if (step.phase === 'check' && step.at === i)
      return { state: 'active', badge: check.matched ? '✓' : '✗' };
    return check.matched ? { state: 'yes', badge: '✓' } : { state: 'no', badge: '✗' };
  };
  const bodyState = (i: number): { state: FlowState; badge?: string } => {
    const fell = history.some((h) => h.phase === 'fall' && h.at === i);
    const ran =
      history.some((h) => (h.phase === 'run' || h.phase === 'fall') && h.at === i) ||
      matchedAt === i;
    if (step.at === i && (step.phase === 'run' || step.phase === 'fall' || step.phase === 'break'))
      return { state: fell ? 'warn' : 'active', badge: fell ? 'fall-through!' : undefined };
    if (fell) return { state: 'warn', badge: 'fall-through!' };
    if (ran) return { state: 'done' };
    return { state: 'idle' };
  };

  // Where the train is: it rides down its own lane, level with the current station.
  const ty = step.phase === 'start' ? TOP - 8 : step.phase === 'end' ? endY : rowY(step.at);

  const edge = (id: string, points: Point[], label?: string, labelAt?: Point) => (
    <FlowEdge
      key={id}
      points={points}
      label={label}
      labelAt={labelAt}
      active={used.has(id)}
      travelKey={s.index}
    />
  );

  const codeLines: CodeLine[] = switchCodeLines(spec, value, breaks).map((l) => {
    const here = l.station === step.at;
    const on =
      here &&
      ((step.phase === 'check' && l.part === 'case') ||
        (step.phase === 'run' && l.part === 'body') ||
        (step.phase === 'fall' && l.part === 'case') ||
        (step.phase === 'break' && l.part === 'break'));
    const check = history.find((h) => h.phase === 'check' && h.at === l.station);
    return {
      text: l.text,
      state: on ? 'on' : undefined,
      badge:
        l.part === 'case' && check
          ? check.matched
            ? { text: '✓ ===', tone: 'yes' }
            : { text: '✗', tone: 'no' }
          : l.part === 'case' && history.some((h) => h.phase === 'fall' && h.at === l.station)
            ? { text: 'not checked', tone: 'warn' }
            : undefined,
    };
  });

  return (
    <>
      <div className="jc-split">
        <div className="viz-panel">
          <div className="viz-label">Code</div>
          <CodeView lines={codeLines} />
          <ConsoleOut lines={step.output} />
        </div>
        <div className="viz-panel jc-flow-panel">
          <div className="viz-label">Track</div>
          <svg
            viewBox={`0 0 380 ${height}`}
            className="jc-flow"
            role="img"
            aria-label={`Railway junction. ${step.message}`}
          >
            {edge('enter', [
              [DX, 4],
              [DX, rowY(0) - D_H / 2],
            ])}
            {spec.cases.map((c, i) => (
              <g key={i}>
                {edge(
                  `track${i}`,
                  [
                    [DX, rowY(i) + D_H / 2],
                    [DX, rowY(i + 1) - (i + 1 === n ? 14 : D_H / 2)],
                  ],
                  'no',
                  [DX + 18, rowY(i) + D_H / 2 + 12],
                )}
                {edge(
                  `yes${i}`,
                  [
                    [DX + D_W / 2, rowY(i)],
                    [AX - BOX_W / 2, rowY(i)],
                  ],
                  'yes',
                  [(DX + D_W / 2 + AX - BOX_W / 2) / 2, rowY(i) - 11],
                )}
                {edge(`fall${i}`, [
                  [AX, rowY(i) + BOX_H / 2],
                  [AX, rowY(i + 1) - BOX_H / 2],
                ])}
                {c.output !== null &&
                  breaks[i] &&
                  edge(`exit${i}`, [
                    [AX + BOX_W / 2, rowY(i)],
                    [RAIL, rowY(i)],
                    [RAIL, endY],
                    [AX + 60, endY],
                  ])}
              </g>
            ))}
            {edge(`yes${n}`, [
              [DX + 42, rowY(n)],
              [AX - BOX_W / 2, rowY(n)],
            ])}
            {edge('out', [
              [AX, rowY(n) + BOX_H / 2],
              [AX, endY - 14],
            ])}

            {spec.cases.map((c, i) => (
              <g key={i}>
                <FlowNode
                  shape="decision"
                  x={DX}
                  y={rowY(i)}
                  w={D_W}
                  h={D_H}
                  label={`=== ${show(c.match)}?`}
                  mono
                  {...stationState(i)}
                />
                <FlowNode
                  shape="action"
                  x={AX}
                  y={rowY(i)}
                  w={BOX_W}
                  h={BOX_H}
                  label={c.output === null ? '(empty)' : `log ${show(c.output)}`}
                  badgePos="above"
                  {...bodyState(i)}
                />
              </g>
            ))}
            <FlowNode
              shape="terminal"
              x={DX}
              y={rowY(n)}
              w={84}
              h={28}
              label="default"
              state={stationDefault(history, n)}
            />
            <FlowNode
              shape="action"
              x={AX}
              y={rowY(n)}
              w={BOX_W}
              h={BOX_H}
              label={`log ${show(spec.defaultOutput)}`}
              badgePos="above"
              {...bodyState(n)}
            />
            <FlowNode
              shape="terminal"
              x={AX}
              y={endY}
              w={120}
              h={28}
              label="end of switch"
              state={step.phase === 'end' ? 'done' : 'idle'}
            />

            <g
              className="jc-train"
              style={{ transform: `translate(${TRAIN_X}px, ${ty}px)` }}
              aria-hidden="true"
            >
              <text y={-4} textAnchor="middle" dominantBaseline="central" className="jc-train-icon">
                🚆
              </text>
              <rect
                x={-20}
                y={10}
                width={Math.max(40, show(value).length * 7 + 10)}
                height={17}
                rx={8.5}
                className="jc-train-tag"
              />
              <text x={-15} y={18.5} dominantBaseline="central" className="jc-train-value">
                {show(value)}
              </text>
            </g>
          </svg>
        </div>
      </div>
      <div className="viz-caption" aria-live="polite">
        {step.message}
      </div>
      <StepControls s={s} />
      <div className="jc-row jc-gap">
        <button type="button" className="viz-btn viz-btn--primary" onClick={onRun}>
          Run ▶
        </button>
        <button
          type="button"
          className="viz-btn viz-btn--ghost"
          onClick={() => s.seek(steps.length - 1)}
          disabled={s.atEnd}
        >
          Skip to the end
        </button>
      </div>
    </>
  );
}

function stationDefault(history: SwitchStep[], n: number): FlowState {
  if (
    history.some(
      (h) =>
        h.phase === 'run' && h.at === n && !history.some((f) => f.phase === 'fall' && f.at === n),
    )
  )
    return 'yes';
  return 'idle';
}
