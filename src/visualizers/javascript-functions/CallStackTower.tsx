import { useEffect, useMemo, useRef } from 'react';
import { CodeView, Tabs, type CodeLine } from '../core/code';
import { IterationCounter } from '../core/IterationCounter';
import { StackTower } from '../core/stack';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import { GUARD_DEPTH, STACK_PRESETS, type CallStep, type StackPreset } from './lib/callSim';
import { FrameView } from './FrameView';

/**
 * #6 Plates on the stack. Calling a function puts a plate on top; returning
 * takes it off and hands the value to the plate below. Every step is a
 * snapshot from lib/callSim.ts, whose output is tested against the real code.
 */
export default function CallStackTower() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Plates on the stack</p>
      <p className="viz-sub">
        Step through and watch the plates stack up, then come back down with their answers.
      </p>
      <Tabs twoUp label="Programs" tabs={STACK_PRESETS.map((p) => ({ id: p.id, name: p.name }))}>
        {(id) => <Run key={id} preset={STACK_PRESETS.find((p) => p.id === id)!} />}
      </Tabs>
    </div>
  );
}

function codeLines(preset: StackPreset, step: CallStep): CodeLine[] {
  const top = step.stack[step.stack.length - 1];
  return preset.code.map((text, k) => {
    const on = step.line === k + 1;
    return {
      text,
      state: on ? 'on' : undefined,
      badge:
        on && step.event === 'call' && top && !top.builtin
          ? { text: `→ calls ${top.name}`, tone: 'warn' }
          : on && step.event === 'handoff'
            ? { text: '← value back', tone: 'yes' }
            : undefined,
    };
  });
}

function Run({ preset }: { preset: StackPreset }) {
  const trace = useMemo(() => preset.run(), [preset]);
  const s = useStepper(trace.steps.length, 1100);
  const step = trace.steps[s.index];
  const overflow = step.event === 'overflow';
  const tower = useRef<HTMLDivElement>(null);

  // Keep the top plate in view as the tower grows (the overflow preset).
  useEffect(() => {
    const el = tower.current;
    if (el) el.scrollTop = 0;
  }, [s.index]);

  return (
    <>
      <div className="jf-stack-grid">
        <div className="viz-panel">
          <div className="viz-label">Code</div>
          <CodeView lines={codeLines(preset, step)} />
        </div>

        <div className={`viz-panel jf-tower-panel ${overflow ? 'is-overflow' : ''}`}>
          <div className="viz-label">Call stack</div>
          <div className="jf-tower-scroll" ref={tower}>
            <StackTower
              tilt
              keys={step.stack.map((f) => String(f.id))}
              empty="empty: nothing is running"
            >
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

        <div className="jf-side-col">
          <IterationCounter
            count={step.stack.length}
            label="stack depth"
            icon="📚"
            tone={overflow ? 'danger' : 'normal'}
          />
          <div className="viz-panel vc-console" aria-label="Console">
            <div className="viz-label">Console</div>
            <div className="viz-mono" aria-live="polite">
              {step.output.length === 0 && <span className="vc-muted">(nothing yet)</span>}
              {step.output.map((l, k) => (
                <div key={k} className="vc-out">
                  › {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {overflow && (
        <div className="jf-overflow" role="alert">
          <strong>📚 Stack overflow!</strong> Real JavaScript gives up after thousands of plates
          with <code className="viz-mono">RangeError: Maximum call stack size exceeded</code>. No
          base case, so it never stops. We stopped at {GUARD_DEPTH} to save your screen.
        </div>
      )}
      <div className="viz-caption" aria-live="polite">
        {step.message}
      </div>
      <StepControls s={s} />
    </>
  );
}
