import { useMemo, useState } from 'react';
import { CodeView, Tabs, type CodeLine } from '../core/code';
import { MemoryBox } from '../core/memory';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import { HOIST_PRESETS, hoistSteps, type HoistPreset } from './lib/scopeSim';

/**
 * #2 Two phases: set up memory, then run. Phase ① only creates slots
 * (var → undefined, let/const → TDZ, functions → ready). Phase ② runs the
 * lines in place. The code never moves. Outputs and error messages come
 * from lib/scopeSim.ts, tested against the real programs.
 */
export default function HoistingPhases() {
  const [pause, setPause] = useState(true);
  return (
    <div className="viz not-prose">
      <p className="viz-title">Two phases: set up memory, then run</p>
      <p className="viz-sub">
        Step through and watch JavaScript make space first, then run the code where it is.
      </p>
      <Tabs twoUp label="Examples" tabs={HOIST_PRESETS.map((p) => ({ id: p.id, name: p.name }))}>
        {(id) => (
          <Player
            key={`${id}-${pause}`}
            preset={HOIST_PRESETS.find((p) => p.id === id)!}
            pause={pause}
          />
        )}
      </Tabs>
      <label className="jc8-check jc8-gap">
        <input type="checkbox" checked={pause} onChange={(e) => setPause(e.target.checked)} />
        Pause on error (how real JavaScript runs)
      </label>
      {!pause && (
        <p className="jc8-small jc8-warn-text">
          Pretend mode: each line is tried on its own so you can see every result. Real JavaScript
          stops at the first uncaught error.
        </p>
      )}
    </div>
  );
}

function Player({ preset, pause }: { preset: HoistPreset; pause: boolean }) {
  const sim = useMemo(() => hoistSteps(preset, pause), [preset, pause]);
  const s = useStepper(sim.steps.length, 1100);
  const step = sim.steps[s.index];
  const setup = step.phase === 'setup';

  // What each console.log line printed (for predict mode), from the run itself.
  const printedBy = useMemo(() => {
    const map: Record<number, string> = {};
    sim.steps.forEach((st, k) => {
      const prev = sim.steps[k - 1];
      if (st.phase === 'run' && st.line && prev && st.output.length > prev.output.length)
        map[st.line - 1] = st.output.at(-1)!;
      if (st.phase === 'run' && st.line && st.error && !st.skipped)
        map[st.line - 1] = 'ReferenceError';
    });
    return map;
  }, [sim]);
  const [guesses, setGuesses] = useState<Record<number, string>>({});
  const reached = (i: number) =>
    sim.steps.slice(0, s.index + 1).some((st) => st.phase === 'run' && st.line === i + 1);

  const errName = step.error ? /'(\w+)'|(\w+) is not defined/.exec(step.error) : null;
  const errVar = errName?.[1] ?? errName?.[2];
  const skippedLines = new Set(
    sim.steps
      .slice(0, s.index + 1)
      .filter((st) => st.skipped)
      .map((st) => st.line),
  );

  const lines: CodeLine[] = preset.lines.map((l, i) => {
    const on = step.line === i + 1;
    return {
      text: l.code,
      state: on ? 'on' : skippedLines.has(i + 1) ? 'dim' : undefined,
      badge: skippedLines.has(i + 1)
        ? { text: 'never runs', tone: 'muted' }
        : on && setup && l.decl
          ? { text: `📥 ${l.decl.kind}`, tone: 'warn' }
          : on && step.error && !setup
            ? { text: '💥', tone: 'no' }
            : undefined,
    };
  });

  return (
    <>
      <div className="jc8-phases" role="status">
        <span className={`jc8-phase is-setup ${setup ? 'is-on' : ''}`}>① Setting up memory</span>
        <span className={`jc8-phase is-run ${step.phase === 'run' ? 'is-on' : ''}`}>② Running</span>
      </div>
      <div className="jc8-grid">
        <div className={`viz-panel ${setup ? 'jc8-scanning' : ''}`}>
          <div className="viz-label">Code (it never moves)</div>
          <CodeView lines={lines} />
        </div>
        <div className="viz-panel">
          <div className="viz-label">Memory</div>
          <div className="jc8-memory">
            {step.envs[0].vars.length === 0 && <span className="jc8-small jc8-muted">empty</span>}
            {step.envs[0].vars.map((v) => (
              <MemoryBox
                key={`${v.name}-${v.tdz}-${v.value}`}
                name={v.name}
                kind={v.kind === 'function' || v.kind === 'param' ? 'const' : v.kind}
                value={v.kind === 'function' || v.value.startsWith('ƒ') ? `📜 ${v.value}` : v.value}
                tdz={v.tdz}
                state={
                  errVar === v.name && step.error
                    ? 'error'
                    : step.changed === `global:${v.name}`
                      ? 'changed'
                      : 'same'
                }
              />
            ))}
          </div>
          <div className="viz-panel vc-console jc8-console" aria-label="Console">
            <div className="viz-mono" aria-live="polite">
              {step.output.length === 0 && !step.error && (
                <span className="vc-muted">(nothing yet)</span>
              )}
              {step.output.map((l, k) => (
                <div key={k} className={l.startsWith('(error)') ? 'jc8-error' : 'vc-out'}>
                  › {l}
                </div>
              ))}
              {step.error && pause && <div className="jc8-error">💥 Uncaught {step.error}</div>}
            </div>
          </div>
        </div>
      </div>

      {preset.predict && (
        <div className="jc8-predict">
          <div className="viz-label">Predict first</div>
          {Object.entries(preset.predict).map(([idx, options]) => {
            const i = Number(idx);
            const guess = guesses[i];
            const shown = reached(i);
            const right = shown && guess === printedBy[i];
            return (
              <div key={i} className="jc8-row">
                <code className="viz-mono">{preset.lines[i].code}</code>
                <select
                  className="jc8-input"
                  value={guess ?? ''}
                  onChange={(e) => setGuesses((g) => ({ ...g, [i]: e.target.value }))}
                  aria-label={`Your prediction for ${preset.lines[i].code}`}
                  disabled={shown}
                >
                  <option value="" disabled>
                    your guess…
                  </option>
                  {options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                {shown && (
                  <span className={right ? 'jc8-good' : 'jc8-bad'}>
                    {right ? '✓' : '✗'} prints {printedBy[i]}
                  </span>
                )}
              </div>
            );
          })}
          {s.atEnd && (
            <p className="jc8-small" aria-live="polite">
              Score:{' '}
              <strong>
                {
                  Object.keys(preset.predict).filter(
                    (k) => guesses[Number(k)] === printedBy[Number(k)],
                  ).length
                }{' '}
                / {Object.keys(preset.predict).length}
              </strong>
            </p>
          )}
        </div>
      )}

      <div className="viz-caption" aria-live="polite">
        {step.message}
      </div>
      <StepControls s={s} />
    </>
  );
}
