import { useMemo, useState, type CSSProperties } from 'react';
import { Rich } from '../core/code';
import { FlowNode } from '../core/flow';
import { IterationCounter } from '../core/IterationCounter';
import { MemoryBox } from '../core/memory';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import {
  CMP_OPS,
  condText,
  fixLoop,
  forSteps,
  GUARD,
  UPDATES,
  whyInfinite,
  type CmpOp,
  type ForSpec,
  type ForStep,
  type Update,
} from './lib/loopSim';

/**
 * #2 The running track. Build a for loop from three coloured slots, then
 * watch the runner: ① the start gate once, ② the judge before every lap,
 * the lap itself (the body), ③ the lap board after every lap. The steps come
 * from lib/loopSim.ts (tested against real for loops); the runner's motion
 * is only decoration on top of them.
 */

interface Preset {
  name: string;
  spec: ForSpec;
  /** Printed after the loop ends. */
  after?: string;
}

const PRESETS: Preset[] = [
  { name: 'Count 1 to 5', spec: { start: 1, op: '<=', limit: 5, update: 'i++' } },
  { name: 'Even numbers to 10', spec: { start: 0, op: '<=', limit: 10, update: 'i += 2' } },
  {
    name: 'Countdown 🚀',
    spec: { start: 5, op: '>=', limit: 1, update: 'i--' },
    after: 'Liftoff!',
  },
  { name: 'Doubling', spec: { start: 1, op: '<=', limit: 64, update: 'i *= 2' } },
  { name: 'Never starts', spec: { start: 10, op: '<', limit: 5, update: 'i++' } },
  { name: '💥 Infinite', spec: { start: 0, op: '<', limit: 5, update: 'i--' } },
];

const LIMITS = [...Array.from({ length: 21 }, (_, k) => k), 64];
const same = (a: ForSpec, b: ForSpec) =>
  a.start === b.start && a.op === b.op && a.limit === b.limit && a.update === b.update;

export default function ForLoopTrack() {
  const [spec, setSpec] = useState<ForSpec>(PRESETS[0].spec);
  const [after, setAfter] = useState<string | undefined>();
  const [predict, setPredict] = useState(false);
  const [guess, setGuess] = useState('');
  // Changing a slot by hand drops a preset's "after the loop" line.
  const edit = (patch: Partial<ForSpec>) => {
    setSpec((s) => ({ ...s, ...patch }));
    setAfter(undefined);
  };

  return (
    <div className="viz not-prose">
      <p className="viz-title">The running track</p>
      <p className="viz-sub">
        Set the three parts of the loop, then step through it. Try counting by 2s, counting down, or
        breaking it on purpose.
      </p>

      <div className="viz-choices" role="group" aria-label="Presets">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            className="viz-btn jl-small"
            aria-pressed={same(p.spec, spec) && p.after === after}
            onClick={() => {
              setSpec(p.spec);
              setAfter(p.after);
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      <LoopBuilder spec={spec} edit={edit} />

      <div className="jl-row jl-gap">
        <label className="jl-check">
          <input type="checkbox" checked={predict} onChange={(e) => setPredict(e.target.checked)} />
          Predict first
        </label>
        {predict && (
          <label className="jl-guess">
            How many laps will it run?
            <input
              className="jl-input viz-mono"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="5, or forever"
              size={10}
            />
          </label>
        )}
      </div>

      {/* A new key whenever the loop changes: React mounts a fresh run, so the stepper starts over. */}
      <TrackRun
        key={`${JSON.stringify(spec)}-${after}`}
        spec={spec}
        after={after}
        guess={predict ? guess : null}
        onFix={() => edit(fixLoop(spec))}
      />
    </div>
  );
}

/** The loop's first line, with each part as a coloured dropdown. */
function LoopBuilder({ spec, edit }: { spec: ForSpec; edit: (p: Partial<ForSpec>) => void }) {
  return (
    <div className="jl-builder viz-mono" role="group" aria-label="Build the loop">
      <span>for (</span>
      <span className="jl-slot is-start">
        let i ={' '}
        <select
          aria-label="① Start value"
          value={spec.start}
          onChange={(e) => edit({ start: Number(e.target.value) })}
        >
          {Array.from({ length: 11 }, (_, k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </span>
      <span>;</span>
      <span className="jl-slot is-cond">
        i{' '}
        <select
          aria-label="② Comparison"
          value={spec.op}
          onChange={(e) => edit({ op: e.target.value as CmpOp })}
        >
          {CMP_OPS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>{' '}
        <select
          aria-label="② Limit"
          value={spec.limit}
          onChange={(e) => edit({ limit: Number(e.target.value) })}
        >
          {LIMITS.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </span>
      <span>;</span>
      <span className="jl-slot is-update">
        <select
          aria-label="③ Update"
          value={spec.update}
          onChange={(e) => edit({ update: e.target.value as Update })}
        >
          {UPDATES.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </span>
      <span>) {'{'}</span>
    </div>
  );
}

// Where things sit on the oval track (SVG units). The runner moves along the
// track with CSS offset-path; offset-distance is a percentage of one lap.
const TRACK = 'M120 40 H280 A75 75 0 0 1 280 190 H120 A75 75 0 0 1 120 40 Z';
const AT = { start: 60, check: 85, body: 110, update: 135 };

/** How far along the track (in % of a lap, counting every lap) the runner is. */
function distance(step: ForStep): number {
  const lap = step.laps * 100;
  switch (step.phase) {
    case 'init':
      return AT.start;
    case 'check':
    case 'guard':
      return AT.check + lap;
    case 'body':
      return AT.body + lap - 100; // laps already counts this lap
    case 'update':
      return AT.update + lap - 100;
    case 'end':
      return AT.start + lap + 100;
  }
}

function TrackRun({
  spec,
  after,
  guess,
  onFix,
}: {
  spec: ForSpec;
  after?: string;
  guess: string | null;
  onFix: () => void;
}) {
  const steps = useMemo(() => forSteps(spec), [spec]);
  const s = useStepper(steps.length, 700);
  const step = steps[s.index];
  const ended = step.phase === 'end';
  const guard = step.phase === 'guard';
  const output = ended && after ? [...step.output, after] : step.output;
  const finalLaps = steps[steps.length - 1].laps;
  const infinite = steps[steps.length - 1].phase === 'guard';
  const active =
    step.phase === 'init'
      ? 'start'
      : step.phase === 'check' || guard
        ? 'cond'
        : step.phase === 'update'
          ? 'update'
          : step.phase === 'body'
            ? 'body'
            : null;

  return (
    <>
      <div className="jl-track-grid">
        <div className={`jl-stadium-wrap ${guard ? 'is-guard' : ''}`}>
          <Stadium spec={spec} step={step} />
          <Lane spec={spec} step={step} active={active} />
          {guard && (
            <div className="jl-guard" role="alert">
              <strong>🔥 Infinite loop detected!</strong>
              <span>JavaScript would freeze the page here.</span>
              <span className="jl-small">
                <Rich text={whyInfinite(spec)} />
              </span>
              <button type="button" className="viz-btn viz-btn--primary" onClick={onFix}>
                Fix it for me
              </button>
            </div>
          )}
        </div>

        <div className="jl-side">
          <pre className="vc-code viz-mono jl-code" aria-label="Code">
            <div
              className={`vc-line ${active === 'start' || active === 'cond' || active === 'update' ? 'is-on' : ''}`}
            >
              <span>
                for (
                <span className={`jl-part is-start ${active === 'start' ? 'is-lit' : ''}`}>
                  let i = {spec.start}
                </span>
                ;{' '}
                <span className={`jl-part is-cond ${active === 'cond' ? 'is-lit' : ''}`}>
                  {condText(spec)}
                </span>
                ;{' '}
                <span className={`jl-part is-update ${active === 'update' ? 'is-lit' : ''}`}>
                  {spec.update}
                </span>
                ) {'{'}
              </span>
            </div>
            <div className={`vc-line ${active === 'body' ? 'is-on' : ''}`}>
              <span>{'  '}console.log(i);</span>
            </div>
            <div className="vc-line">
              <span>{'}'}</span>
            </div>
            {after && (
              <div className={`vc-line ${ended ? 'is-on' : ''}`}>
                <span>console.log("{after}");</span>
              </div>
            )}
          </pre>
          <div className="jl-row">
            <MemoryBox
              key={s.index}
              name="i"
              kind="let"
              value={String(step.i)}
              state={step.phase === 'init' ? 'new' : step.phase === 'update' ? 'changed' : 'same'}
            />
            <IterationCounter
              count={step.laps}
              tone={guard ? 'danger' : ended ? 'done' : 'normal'}
            />
          </div>
          <div className="viz-panel vc-console" aria-label="Console">
            <div className="viz-label">Console</div>
            <div className="viz-mono">
              {output.length === 0 && <span className="vc-muted">(nothing printed yet)</span>}
              {output.length > 6 && (
                <div className="vc-muted">… {output.length - 6} earlier lines</div>
              )}
              {output.slice(-6).map((line, k) => (
                <div key={`${output.length}-${k}`} className="vc-out">
                  <span aria-hidden="true">›</span> {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="viz-caption" aria-live="polite">
        {ended && after
          ? `${step.message} Then the line after the loop prints "${after}".`
          : step.message}
        {ended && finalLaps > 0 && step.laps === finalLaps && (
          <>
            {' '}
            Note that the update ran {step.updates} times, the same as the body, but the check ran
            one extra time.
          </>
        )}
      </div>

      {guess !== null && (ended || guard) && guess.trim() !== '' && (
        <p className="jl-reveal" aria-live="polite">
          {revealText(guess, infinite ? null : finalLaps)}
        </p>
      )}

      <StepControls s={s} />
    </>
  );
}

function revealText(guess: string, laps: number | null) {
  const saidForever = /forever|inf|∞/i.test(guess);
  const said = Number(guess);
  const right = laps === null ? saidForever : !saidForever && said === laps;
  const actual =
    laps === null
      ? `forever (the guard stopped it at ${GUARD})`
      : `${laps} lap${laps === 1 ? '' : 's'}`;
  return `${right ? '✓ Spot on!' : '✗ Not quite.'} You said ${guess.trim()}; it ran ${actual}.`;
}

/** The tilted stadium (wide screens). */
function Stadium({ spec, step }: { spec: ForSpec; step: ForStep }) {
  const p = step.phase;
  const judgeState = p === 'check' ? (step.ok ? 'yes' : 'no') : p === 'guard' ? 'warn' : 'idle';
  return (
    <div className="jl-stadium">
      <svg viewBox="0 0 400 230" role="img" aria-label={`Running track. ${step.message}`}>
        <path d={TRACK} className="jl-track" />
        <path d={TRACK} className="jl-track-line" />
        {/* ① start / finish gate */}
        <g className={`jl-gate ${p === 'init' ? 'is-on' : ''} ${p === 'end' ? 'is-end' : ''}`}>
          <line x1="200" y1="172" x2="200" y2="208" />
          <text x="200" y="224" textAnchor="middle">
            {p === 'end' ? '🏁 finish' : '① start'}
          </text>
        </g>
        {/* ② the judge */}
        <FlowNode
          shape="decision"
          x={128}
          y={115}
          w={98}
          h={50}
          label={`${condText(spec)}?`}
          mono
          state={judgeState}
          badge={p === 'check' ? (step.ok ? '✓' : '✗') : undefined}
        />
        <text
          x="128"
          y="155"
          textAnchor="middle"
          className={`jl-cp-label is-cond ${p === 'check' || p === 'guard' ? 'is-on' : ''}`}
        >
          ② another lap?
        </text>
        {/* the body: the lap itself */}
        <text
          x="200"
          y="72"
          textAnchor="middle"
          className={`jl-cp-label is-body ${p === 'body' ? 'is-on' : ''}`}
        >
          body: console.log(i)
        </text>
        {/* ③ the lap board */}
        <g className={`jl-board ${p === 'update' ? 'is-on' : ''}`}>
          <rect x="236" y="96" width="78" height="40" rx="8" />
          <text x="275" y="111" textAnchor="middle" className="jl-board-op">
            ③ {spec.update}
          </text>
          <text x="275" y="127" textAnchor="middle" className="jl-board-i">
            i = {step.i}
          </text>
        </g>
        <g
          className={`jl-runner ${p === 'guard' ? 'is-guard' : ''}`}
          style={
            {
              offsetPath: `path('${TRACK}')`,
              offsetDistance: `${distance(step)}%`,
            } as CSSProperties
          }
        >
          <circle r="12" />
          <text textAnchor="middle" dominantBaseline="central">
            🏃
          </text>
        </g>
      </svg>
    </div>
  );
}

/** The same checkpoints as a straight lane (narrow screens). */
function Lane({ spec, step, active }: { spec: ForSpec; step: ForStep; active: string | null }) {
  const rows = [
    { id: 'start', label: `① let i = ${spec.start}`, note: 'once' },
    {
      id: 'cond',
      label: `② ${condText(spec)}?`,
      note: step.phase === 'check' ? (step.ok ? 'true ✓' : 'false ✗') : 'before every lap',
    },
    { id: 'body', label: 'console.log(i)', note: 'the lap' },
    { id: 'update', label: `③ ${spec.update}`, note: 'after every lap' },
  ];
  return (
    <ol className="jl-lane" aria-label="The loop's checkpoints">
      {rows.map((r) => (
        <li key={r.id} className={`jl-lane-row is-${r.id} ${active === r.id ? 'is-on' : ''}`}>
          <span className="jl-lane-runner" aria-hidden="true">
            {active === r.id ? '🏃' : ''}
          </span>
          <span className="viz-mono">{r.label}</span>
          <span className="jl-lane-note">{r.note}</span>
        </li>
      ))}
      <li className={`jl-lane-row is-end ${step.phase === 'end' ? 'is-on' : ''}`}>
        <span className="jl-lane-runner" aria-hidden="true">
          {step.phase === 'end' ? '🏁' : ''}
        </span>
        <span>exit</span>
        <span className="jl-lane-note">when ② is false</span>
      </li>
    </ol>
  );
}
