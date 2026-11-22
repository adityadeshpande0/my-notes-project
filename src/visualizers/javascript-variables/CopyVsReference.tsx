import { useId, useRef, useState } from 'react';
import { HeapCard, MemoryBox, RefArrows } from '../core/memory';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import { REFERENCE_PRESETS, type MemPreset, type MemStep } from './lib/memorySteps';
import { boxProps } from './boxProps';
import { CodeLines, ConsoleOut, PresetTabs } from './parts';

/** #7 Copies vs arrows: primitives are copied, objects are shared by reference. */
export default function CopyVsReference() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Copies vs arrows</p>
      <p className="viz-sub">
        Variables on the left, objects in the heap on the right. An arrow means “points to”.
      </p>
      <PresetTabs
        presets={REFERENCE_PRESETS}
        label="Examples"
        render={(p) => <Player key={p.id} preset={p} />}
      />
    </div>
  );
}

function Player({ preset }: { preset: MemPreset }) {
  const s = useStepper(preset.steps.length, 2100);
  const st = preset.steps[s.index];
  const memRef = useRef<HTMLDivElement>(null);
  const label = (id: string) => st.heap.find((h) => h.id === id)?.label ?? id;

  // How many arrows lead to each heap object (from variables and from other objects).
  const arrowsTo = (id: string) =>
    st.boxes.filter((b) => b.ref === id).length +
    st.heap.reduce((n, h) => n + h.props.filter((p) => p.ref === id).length, 0);

  return (
    <>
      <div className="jv-grid jv-grid--ref">
        <div className="viz-panel">
          <div className="viz-label">Code</div>
          <CodeLines code={preset.code} line={st.line} />
        </div>

        {/* Variables + heap share one positioned box, so arrows can be drawn across both. */}
        <div className="viz-panel jv-memory" ref={memRef}>
          <div className="jv-mem-col">
            <div className="viz-label">Variables</div>
            <div className="jv-stack">
              {st.boxes.length === 0 && <span className="jv-muted">none yet</span>}
              {st.boxes.map((b) => (
                <MemoryBox key={`${b.name}-${s.index}`} {...boxProps(b, label)} />
              ))}
            </div>
          </div>
          <div className="jv-mem-col">
            <div className="viz-label">Heap</div>
            <div className="jv-heap">
              {st.heap.length === 0 && <span className="jv-muted">no objects yet</span>}
              {st.heap.map((h) => (
                <HeapCard
                  key={`${h.id}-${s.index}`}
                  id={h.id}
                  label={h.label}
                  isArray={h.isArray}
                  state={h.state}
                  changedKey={h.changedKey}
                  arrows={arrowsTo(h.id)}
                  props={h.props.map((p) => ({
                    key: p.key,
                    value: p.value,
                    refTo: p.ref,
                    refLabel: p.ref ? label(p.ref) : undefined,
                  }))}
                />
              ))}
            </div>
          </div>
          <RefArrows container={memRef} deps={s.index} />
        </div>
      </div>

      <ConsoleOut lines={st.console} error={st.error} />
      <div className="viz-caption" aria-live="polite">
        {st.caption}
      </div>
      <StepControls s={s} />
      <SameArrowTest step={st} />
    </>
  );
}

/** Pick two variables and see what === says, and why. */
function SameArrowTest({ step }: { step: MemStep }) {
  const names = step.boxes.map((b) => b.name);
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(1);
  const id = useId();
  if (names.length < 2) return null;

  // Clamp in case the step has fewer variables than the last time we picked.
  const a = step.boxes[Math.min(left, names.length - 1)];
  const b = step.boxes[Math.min(right, names.length - 1)];
  let same: boolean;
  let why: string;
  if (a.ref || b.ref) {
    same = a.ref === b.ref;
    why =
      a.ref && b.ref
        ? same
          ? 'Same arrow: both point to the same object.'
          : 'Different arrows: two separate objects, even if they look alike.'
        : 'One holds an arrow, the other a plain value. Never the same.';
  } else {
    same = a.value === b.value;
    why = same ? 'Both boxes hold the same primitive value.' : 'The boxes hold different values.';
  }

  return (
    <div className="jv-eqtest">
      <span className="viz-label" style={{ margin: 0 }}>
        === test
      </span>
      <label className="sr-only" htmlFor={`${id}-l`}>
        Left variable
      </label>
      <select
        id={`${id}-l`}
        value={Math.min(left, names.length - 1)}
        onChange={(e) => setLeft(Number(e.target.value))}
      >
        {names.map((n, i) => (
          <option key={n} value={i}>
            {n}
          </option>
        ))}
      </select>
      <code className="viz-mono">===</code>
      <label className="sr-only" htmlFor={`${id}-r`}>
        Right variable
      </label>
      <select
        id={`${id}-r`}
        value={Math.min(right, names.length - 1)}
        onChange={(e) => setRight(Number(e.target.value))}
      >
        {names.map((n, i) => (
          <option key={n} value={i}>
            {n}
          </option>
        ))}
      </select>
      <strong className={same ? 'jv-true' : 'jv-false'} aria-live="polite">
        {String(same)}
      </strong>
      <span className="jv-muted">
        {a.name === b.name ? 'A variable is always === itself.' : why}
      </span>
    </div>
  );
}
