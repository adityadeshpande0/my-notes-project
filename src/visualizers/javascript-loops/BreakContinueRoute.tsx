import { useMemo, useState } from 'react';
import { CodeView, type CodeLine } from '../core/code';
import { IterationCounter } from '../core/IterationCounter';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import {
  DEFAULT_STREET,
  HOUSE_CYCLE,
  routeSteps,
  type House,
  type RouteRules,
  type RouteStep,
} from './lib/loopSim';

/**
 * #5 The delivery route. Click a house to change its status, then ride
 * along. `continue` hops over closed houses; `break` turns the scooter home
 * at the first out-of-stock house. The run comes from lib/loopSim.ts,
 * tested against a real loop for every street pattern.
 */
const CHIP: Record<House, string> = { open: 'open', closed: 'closed', 'no-stock': 'no-stock' };

export default function BreakContinueRoute() {
  const [houses, setHouses] = useState<House[]>(DEFAULT_STREET);
  const [rules, setRules] = useState<RouteRules>({ useContinue: true, useBreak: true });

  const cycle = (k: number) =>
    setHouses((hs) =>
      hs.map((h, j) => (j === k ? HOUSE_CYCLE[(HOUSE_CYCLE.indexOf(h) + 1) % 3] : h)),
    );

  return (
    <div className="viz not-prose">
      <p className="viz-title">The delivery route</p>
      <p className="viz-sub">Click a house to change it, then ride along with the scooter.</p>

      <div className="jl-row">
        <label className="jl-check viz-mono">
          <input
            type="checkbox"
            checked={rules.useContinue}
            onChange={(e) => setRules((r) => ({ ...r, useContinue: e.target.checked }))}
          />
          continue for closed
        </label>
        <label className="jl-check viz-mono">
          <input
            type="checkbox"
            checked={rules.useBreak}
            onChange={(e) => setRules((r) => ({ ...r, useBreak: e.target.checked }))}
          />
          break for no-stock
        </label>
        <button
          type="button"
          className="viz-btn viz-btn--ghost"
          onClick={() => setHouses(DEFAULT_STREET)}
        >
          Reset street
        </button>
      </div>

      <RouteRun
        key={`${houses.join()}-${rules.useContinue}-${rules.useBreak}`}
        houses={houses}
        rules={rules}
        onCycle={cycle}
      />
    </div>
  );
}

function codeLines(rules: RouteRules, step: RouteStep): CodeLine[] {
  const o = step.phase === 'visit' ? step.outcome : undefined;
  const lines: CodeLine[] = [
    {
      text: 'for (let i = 0; i < houses.length; i++) {',
      state: step.phase === 'end' && o === undefined ? 'on' : undefined,
    },
  ];
  if (rules.useContinue)
    lines.push(
      {
        text: '  if (houses[i] === "closed") {',
        state: o === 'continue' ? 'on' : undefined,
        badge: o
          ? { text: o === 'continue' ? '✓ true' : '✗', tone: o === 'continue' ? 'yes' : 'no' }
          : undefined,
      },
      { text: '    continue;', state: o === 'continue' ? 'on' : undefined },
      { text: '  }' },
    );
  if (rules.useBreak)
    lines.push(
      {
        text: '  if (houses[i] === "no-stock") {',
        state: o === 'break' ? 'on' : o === 'continue' ? 'dim' : undefined,
        badge:
          o === 'break'
            ? { text: '✓ true', tone: 'yes' }
            : o === 'deliver'
              ? { text: '✗', tone: 'no' }
              : undefined,
      },
      { text: '    break;', state: o === 'break' ? 'on' : o === 'continue' ? 'dim' : undefined },
      { text: '  }', state: o === 'continue' ? 'dim' : undefined },
    );
  lines.push(
    {
      text: '  console.log("Delivered to house " + i);',
      state: o === 'deliver' ? 'on' : o ? 'dim' : undefined,
      badge: o && o !== 'deliver' ? { text: 'skipped', tone: 'muted' } : undefined,
    },
    { text: '}' },
  );
  return lines;
}

function RouteRun({
  houses,
  rules,
  onCycle,
}: {
  houses: House[];
  rules: RouteRules;
  onCycle: (k: number) => void;
}) {
  const steps = useMemo(() => routeSteps(houses, rules), [houses, rules]);
  const s = useStepper(steps.length, 1000);
  const step = steps[s.index];
  const broke = step.visits[step.visits.length - 1] === 'break';
  const delivered = step.visits.filter((v) => v === 'deliver').length;
  const skipped = step.visits.filter((v) => v === 'continue').length;
  const notVisited = broke ? houses.length - step.visits.length : 0;
  // The scooter: at the current house, or home again after a break.
  const at =
    step.phase === 'start' ? -1 : step.phase === 'end' ? (broke ? -1 : houses.length) : step.i;

  return (
    <>
      <div className="viz-scroll">
        <div className="jl-street" style={{ ['--houses' as string]: houses.length }}>
          <span
            className={`jl-scooter ${broke ? 'is-home' : ''}`}
            style={{ ['--at' as string]: at }}
            aria-hidden="true"
          >
            {broke && step.phase === 'end' ? '🏁' : '🛵'}
          </span>
          {houses.map((h, k) => {
            const visit = step.visits[k];
            const unvisited = broke && k >= step.visits.length;
            return (
              <div
                key={k}
                className={`jl-house ${visit ? `is-${visit}` : ''} ${unvisited ? 'is-unvisited' : ''} ${k === step.i && step.phase === 'visit' ? 'is-here' : ''}`}
              >
                <span className="jl-house-icon" aria-hidden="true">
                  🏠
                </span>
                <span className="jl-house-n viz-mono">house {k}</span>
                <button
                  type="button"
                  className={`jl-status is-${h}`}
                  onClick={() => onCycle(k)}
                  aria-label={`House ${k} is ${h}. Click to change.`}
                >
                  {CHIP[h]}
                </button>
                <span className="jl-house-result">
                  {visit === 'deliver' && '📦 delivered'}
                  {visit === 'continue' && '⏭ skip'}
                  {visit === 'break' && '🛑 break'}
                  {unvisited && 'not visited'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="jl-row jl-gap">
        <IterationCounter
          count={step.visits.length}
          tone={step.phase === 'end' ? 'done' : 'normal'}
        />
        <span className="viz-counter">
          📦 delivered: <strong className="viz-mono">{delivered}</strong>
        </span>
        <span className="viz-counter">
          ⏭ skipped: <strong className="viz-mono">{skipped}</strong>
        </span>
        <span className="viz-counter">
          🚫 not visited: <strong className="viz-mono">{notVisited}</strong>
        </span>
      </div>

      <div className="jl-split jl-gap">
        <div className="viz-panel">
          <div className="viz-label">Code</div>
          <CodeView lines={codeLines(rules, step)} />
        </div>
        <div className="viz-panel vc-console" aria-label="Console">
          <div className="viz-label">Console</div>
          <div className="viz-mono">
            {step.output.length === 0 && <span className="vc-muted">(nothing printed yet)</span>}
            {step.output.map((l, k) => (
              <div key={k} className="vc-out">
                <span aria-hidden="true">›</span> {l}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="viz-caption" aria-live="polite">
        {step.message}
      </div>
      <StepControls s={s} />
    </>
  );
}
