import { useState } from 'react';
import { MemoryBox } from '../core/memory';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import { CREATE_CHANGE_CODE, VARIABLE_PRESETS, type MemPreset } from './lib/memorySteps';
import { boxProps } from './boxProps';
import { CodeLines, ConsoleOut, PresetTabs } from './parts';

/** #1 Watch memory change: a variable is a labelled box, and `=` puts a value in. */
export default function VariableBoxes() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Watch memory change</p>
      <p className="viz-sub">Step through the code. Each variable is a labelled box in memory.</p>
      <PresetTabs
        presets={VARIABLE_PRESETS}
        label="Examples"
        render={(p) => <Player key={p.id} preset={p} />}
      />
    </div>
  );
}

function Player({ preset }: { preset: MemPreset }) {
  const s = useStepper(preset.steps.length, 1700);
  const st = preset.steps[s.index];
  // "Your turn" (first preset only): the operations you added. The box's value
  // is worked out from this list on every render (derived state), so it can
  // never get out of sync with the code panel.
  const [mine, setMine] = useState<Op[]>([]);
  const yourTurn = mine.length > 0;
  const score = mine.reduce(apply, 25);
  const add = (op: Op) => setMine((m) => [...m, op]);

  if (yourTurn) {
    const lastOp = mine[mine.length - 1];
    const before = mine.slice(0, -1).reduce(apply, 25);
    return (
      <>
        <div className="jv-grid">
          <div className="viz-panel">
            <div className="viz-label">Code</div>
            <CodeLines
              code={[CREATE_CHANGE_CODE, ...mine.map((op) => OPS[op].code)].join('\n')}
              line={4 + mine.length}
            />
          </div>
          <div className="viz-panel">
            <div className="viz-label">Memory</div>
            <div className="jv-shelf">
              {/* A new key per click replays the amber "changed" flash. */}
              <MemoryBox
                key={mine.length}
                name="score"
                value={String(score)}
                kind="let"
                state="changed"
              />
            </div>
          </div>
        </div>
        <div className="viz-caption" aria-live="polite">
          <code className="viz-mono">{OPS[lastOp].code}</code> works out the right side first (
          <code className="viz-mono">{OPS[lastOp].working(before)}</code>), then stores the answer
          in the box.
        </div>
        <YourTurnButtons add={add} />
        <div className="viz-controls">
          <button type="button" className="viz-btn" onClick={() => setMine([])}>
            ← Back to the walkthrough
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="jv-grid">
        <div className="viz-panel">
          <div className="viz-label">Code</div>
          <CodeLines code={preset.code} line={st.line} />
        </div>
        <div className="viz-panel">
          <div className="viz-label">Memory</div>
          <div className="jv-shelf">
            {st.boxes.length === 0 && <span className="jv-muted">empty</span>}
            {st.boxes.map((b) => (
              // Keyed by name + state + step, so each change replays its animation.
              <MemoryBox key={`${b.name}-${s.index}`} {...boxProps(b)} />
            ))}
          </div>
          {st.bubble && (
            <p className="jv-bubble viz-mono" aria-live="polite">
              {st.bubble}
            </p>
          )}
        </div>
      </div>
      <ConsoleOut lines={st.console} error={st.error} />
      <div className="viz-caption" aria-live="polite">
        {st.caption}
      </div>
      <StepControls s={s} />
      {preset.id === 'create' && <YourTurnButtons add={add} />}
    </>
  );
}

type Op = 'plus1' | 'times2' | 'zero';
const OPS: Record<Op, { label: string; code: string; working: (n: number) => string }> = {
  plus1: { label: '+1', code: 'score = score + 1;', working: (n) => `${n} + 1 → ${n + 1}` },
  times2: { label: '×2', code: 'score = score * 2;', working: (n) => `${n} * 2 → ${n * 2}` },
  zero: { label: 'reset to 0', code: 'score = 0;', working: () => '0' },
};
const apply = (n: number, op: Op) => (op === 'plus1' ? n + 1 : op === 'times2' ? n * 2 : 0);

function YourTurnButtons({ add }: { add: (op: Op) => void }) {
  return (
    <div className="jv-yourturn">
      <span className="viz-label" style={{ margin: 0 }}>
        Your turn
      </span>
      {(Object.keys(OPS) as Op[]).map((op) => (
        <button key={op} type="button" className="viz-btn" onClick={() => add(op)}>
          {OPS[op].label}
        </button>
      ))}
    </div>
  );
}
