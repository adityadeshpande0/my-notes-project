import { useId, useMemo, useState, type ReactNode } from 'react';
import { Tabs } from '../core/code';
import { FlowEdge, FlowNode } from '../core/flow';
import { IterationCounter } from '../core/IterationCounter';
import { MemoryBox } from '../core/memory';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import {
  CHAI_STARTS,
  chaiSpec,
  diceSpec,
  laneSteps,
  seededRolls,
  type LaneKind,
  type LaneSpec,
  type LaneStep,
} from './lib/loopSim';

/**
 * #3 Check first vs check after. Two lanes run the same loop, one as
 * `while` and one as `do...while`, driven by ONE shared stepper so they stay
 * in step. A lane that finishes early just shows "done ✓" while the other
 * keeps going.
 */
export default function WhileVsDoWhile() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Check first vs check after</p>
      <p className="viz-sub">
        The same loop written two ways. The only difference is <em>when</em> the condition is
        checked.
      </p>
      <Tabs
        label="Scenarios"
        tabs={[
          { id: 'chai', name: 'Pour the chai ☕' },
          { id: 'dice', name: 'Roll until 6 🎲' },
        ]}
      >
        {(tab) => (tab === 'chai' ? <Chai /> : <Dice />)}
      </Tabs>
    </div>
  );
}

function Chai() {
  const [start, setStart] = useState(100);
  const spec = useMemo(() => chaiSpec(start), [start]);
  return (
    <>
      <div className="jl-row" role="group" aria-label="Starting level">
        <span className="viz-label jl-inline-label">START level</span>
        {CHAI_STARTS.map((v) => (
          <button
            key={v}
            type="button"
            className="viz-btn viz-mono"
            aria-pressed={v === start}
            onClick={() => setStart(v)}
          >
            {v}
          </button>
        ))}
      </div>
      <Race
        key={start}
        spec={spec}
        varName="level"
        code={{
          while: [`let level = ${start};`, 'while (level < 100) {', '  level += 25;', '}'],
          doWhile: [`let level = ${start};`, 'do {', '  level += 25;', '} while (level < 100);'],
        }}
        picture={(v) => <Cup level={v} />}
        note={(w, d) =>
          w.laps === 0 && d.laps === 1
            ? `while checked first, saw ${start} < 100 was false, and poured nothing. do...while poured once anyway${d.value > 100 ? `, and the cup overflowed to ${d.value}%` : ''}. do...while always runs at least once, even when the condition was already false.`
            : w.laps === d.laps
              ? `Both poured ${w.laps} time${w.laps === 1 ? '' : 's'}. When the condition starts out true, the two loops behave the same. Try START = 100.`
              : ''
        }
      />
    </>
  );
}

function Dice() {
  const [seed, setSeed] = useState(7);
  const rolls = useMemo(() => seededRolls(seed), [seed]);
  const spec = useMemo(() => diceSpec(rolls), [rolls]);
  return (
    <>
      <div className="jl-row">
        <button type="button" className="viz-btn" onClick={() => setSeed((n) => n + 1)}>
          🎲 New seed
        </button>
        <span className="jl-small jl-muted">
          Seed {seed}: the dice are random-looking but repeatable, so both lanes roll the same
          numbers.
        </span>
      </div>
      <Race
        key={seed}
        spec={spec}
        varName="roll"
        code={{
          while: ['let roll = 0;', 'while (roll !== 6) {', '  roll = rollDie();', '}'],
          doWhile: ['let roll;', 'do {', '  roll = rollDie();', '} while (roll !== 6);'],
        }}
        picture={(v) => <Die value={v} />}
        note={(w) =>
          `Nobody knew in advance how many rolls it would take: this time it was ${w.laps}. That's what while loops are for.`
        }
      />
    </>
  );
}

function Race({
  spec,
  varName,
  code,
  picture,
  note,
}: {
  spec: LaneSpec;
  varName: string;
  code: Record<LaneKind, string[]>;
  picture: (value: number) => ReactNode;
  note: (w: LaneStep, d: LaneStep) => string;
}) {
  const lanes = useMemo(
    () => ({ while: laneSteps('while', spec), doWhile: laneSteps('doWhile', spec) }),
    [spec],
  );
  // One stepper for both lanes: as long as the longer lane.
  const total = Math.max(lanes.while.length, lanes.doWhile.length);
  const s = useStepper(total, 900);
  const at = (kind: LaneKind) => lanes[kind][Math.min(s.index, lanes[kind].length - 1)];
  const w = at('while');
  const d = at('doWhile');
  const bothDone = s.atEnd;

  return (
    <>
      <div className="viz-grid-2 jl-gap">
        {(['while', 'doWhile'] as LaneKind[]).map((kind) => (
          <LaneView
            key={kind}
            kind={kind}
            step={at(kind)}
            code={code[kind]}
            spec={spec}
            varName={varName}
            picture={picture}
            stepKey={s.index}
          />
        ))}
      </div>
      <div className="viz-caption" aria-live="polite">
        {bothDone && note(w, d) ? note(w, d) : `while: ${w.message} · do...while: ${d.message}`}
      </div>
      <StepControls s={s} />
    </>
  );
}

function LaneView({
  kind,
  step,
  code,
  spec,
  varName,
  picture,
  stepKey,
}: {
  kind: LaneKind;
  step: LaneStep;
  code: string[];
  spec: LaneSpec;
  varName: string;
  picture: (value: number) => ReactNode;
  stepKey: number;
}) {
  const done = step.phase === 'end';
  const p = step.phase;
  // Which code line is running: the condition line or the body line.
  const condLine = kind === 'while' ? 1 : 3;
  const bodyLine = 2;
  const isWhile = kind === 'while';
  const condY = isWhile ? 34 : 118;
  const bodyY = isWhile ? 104 : 40;
  const condState = p === 'check' ? (step.ok ? 'yes' : 'no') : 'idle';

  return (
    <div className={`viz-panel jl-lane-panel ${done ? 'is-done' : ''}`}>
      <div className="jl-lane-head">
        <code className="viz-mono">{isWhile ? 'while' : 'do...while'}</code>
        {done && <span className="jl-done">done ✓</span>}
      </div>
      <pre className="vc-code viz-mono">
        {code.map((line, k) => (
          <div
            key={k}
            className={`vc-line ${(p === 'check' && k === condLine) || (p === 'body' && k === bodyLine) || (p === 'start' && k === 0) ? 'is-on' : ''}`}
          >
            <span>{line}</span>
          </div>
        ))}
      </pre>
      <div className="jl-lane-body">
        <svg
          viewBox="0 0 220 150"
          className="jl-mini-flow"
          role="img"
          aria-label={`${isWhile ? 'while' : 'do...while'} flowchart: the check is at the ${isWhile ? 'top' : 'bottom'}.`}
        >
          {isWhile ? (
            <>
              <FlowEdge
                points={[
                  [90, 0],
                  [90, condY - 22],
                ]}
                active={p === 'start'}
                travel={p === 'check' && step.laps === 0}
                travelKey={stepKey}
              />
              <FlowEdge
                points={[
                  [90, condY + 22],
                  [90, bodyY - 16],
                ]}
                label="yes"
                labelAt={[110, 72]}
                active={p === 'body'}
                travel={p === 'body'}
                travelKey={stepKey}
              />
              <FlowEdge
                points={[
                  [30, bodyY],
                  [12, bodyY],
                  [12, condY],
                  [32, condY],
                ]}
                active={p === 'check' && step.laps > 0}
                travel={p === 'check' && step.laps > 0}
                travelKey={stepKey}
              />
              <FlowEdge
                points={[
                  [148, condY],
                  [208, condY],
                  [208, 140],
                ]}
                label="no"
                labelAt={[178, condY - 10]}
                active={done}
                travel={done}
                travelKey={stepKey}
              />
            </>
          ) : (
            <>
              <FlowEdge
                points={[
                  [90, 0],
                  [90, bodyY - 16],
                ]}
                active={p === 'start'}
                travel={p === 'body' && step.laps === 1}
                travelKey={stepKey}
              />
              <FlowEdge
                points={[
                  [90, bodyY + 16],
                  [90, condY - 22],
                ]}
                active={p === 'check'}
                travel={p === 'check'}
                travelKey={stepKey}
              />
              <FlowEdge
                points={[
                  [32, condY],
                  [12, condY],
                  [12, bodyY],
                  [30, bodyY],
                ]}
                label="yes"
                labelAt={[12, 80]}
                active={p === 'body' && step.laps > 1}
                travel={p === 'body' && step.laps > 1}
                travelKey={stepKey}
              />
              <FlowEdge
                points={[
                  [148, condY],
                  [208, condY],
                  [208, 146],
                ]}
                label="no"
                labelAt={[178, condY - 10]}
                active={done}
                travel={done}
                travelKey={stepKey}
              />
            </>
          )}
          <FlowNode
            shape="decision"
            x={90}
            y={condY}
            w={116}
            h={44}
            label={`${spec.cond}?`}
            mono
            state={condState}
            badge={p === 'check' ? (step.ok ? '✓' : '✗') : undefined}
          />
          <FlowNode
            shape="action"
            x={90}
            y={bodyY}
            w={120}
            h={32}
            label={spec.bodyCode}
            mono
            state={p === 'body' ? 'active' : 'idle'}
          />
        </svg>
        <div className="jl-lane-side">
          {picture(step.value)}
          <MemoryBox
            key={stepKey}
            name={varName}
            kind="let"
            value={String(step.value)}
            state={p === 'body' ? 'changed' : 'same'}
          />
          <IterationCounter
            count={step.laps}
            tone={done ? 'done' : step.phase === 'guard' ? 'danger' : 'normal'}
          />
        </div>
      </div>
      <div className="viz-panel vc-console jl-mini-console" aria-label="Console">
        {step.output.length === 0 ? (
          <span className="vc-muted">(nothing yet)</span>
        ) : (
          step.output.slice(-4).map((l, k) => (
            <div key={`${step.output.length}-${k}`} className="vc-out viz-mono">
              <span aria-hidden="true">›</span> {l}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/** A cup of chai: the fill level follows the variable, and spills over 100. */
function Cup({ level }: { level: number }) {
  const fill = Math.min(level, 100) / 100;
  const spill = level > 100;
  const clip = useId(); // two cups on the page need two different clip-path ids
  return (
    <svg
      viewBox="0 0 80 80"
      className="jl-cup"
      role="img"
      aria-label={`Cup at ${level}%${spill ? ', overflowing' : ''}`}
    >
      <defs>
        <clipPath id={clip}>
          <path d="M14 14 H62 L57 70 H19 Z" />
        </clipPath>
      </defs>
      <rect
        x="10"
        y={14 + 56 * (1 - fill)}
        width="60"
        height={56 * fill}
        clipPath={`url(#${clip})`}
        className="jl-chai"
      />
      <path d="M14 14 H62 L57 70 H19 Z" className="jl-cup-outline" />
      <path d="M62 26 Q76 28 74 42 Q72 52 60 52" className="jl-cup-outline" />
      {spill && (
        <g className="jl-spill">
          <path d="M14 14 Q6 30 8 60" />
          <ellipse cx="10" cy="74" rx="9" ry="3" />
        </g>
      )}
      <text x="38" y="46" textAnchor="middle" dominantBaseline="central" className="jl-cup-text">
        {level}%
      </text>
    </svg>
  );
}

const PIPS: Record<number, [number, number][]> = {
  1: [[30, 30]],
  2: [
    [18, 18],
    [42, 42],
  ],
  3: [
    [18, 18],
    [30, 30],
    [42, 42],
  ],
  4: [
    [18, 18],
    [42, 18],
    [18, 42],
    [42, 42],
  ],
  5: [
    [18, 18],
    [42, 18],
    [30, 30],
    [18, 42],
    [42, 42],
  ],
  6: [
    [18, 16],
    [42, 16],
    [18, 30],
    [42, 30],
    [18, 44],
    [42, 44],
  ],
};

function Die({ value }: { value: number }) {
  return (
    <svg
      viewBox="0 0 60 60"
      className={`jl-die ${value === 6 ? 'is-six' : ''}`}
      role="img"
      aria-label={value ? `Die shows ${value}` : 'Not rolled yet'}
    >
      <rect x="4" y="4" width="52" height="52" rx="10" />
      {(PIPS[value] ?? []).map(([x, y], k) => (
        <circle key={k} cx={x} cy={y} r="4.5" />
      ))}
      {!value && (
        <text x="30" y="30" textAnchor="middle" dominantBaseline="central">
          ?
        </text>
      )}
    </svg>
  );
}
