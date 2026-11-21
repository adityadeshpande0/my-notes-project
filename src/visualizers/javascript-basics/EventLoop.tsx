import { useRef, useState } from 'react';
import { alpha, C } from '../core/colors';
import { StepControls } from '../core/StepControls';
import { useStepper, type Stepper } from '../core/useStepper';
import { PRESETS, type ELStep, type Preset, type WebApiTask } from './eventLoop';

/**
 * Call stack, Web APIs, callback queue and the event loop, one step at a time.
 * The steps come from eventLoop.ts; this file only draws them.
 */
export default function EventLoop() {
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const preset = PRESETS.find((p) => p.id === presetId)!;

  // Arrow keys move between tabs, as screen-reader users expect from a tab list.
  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = PRESETS[(i + dir + PRESETS.length) % PRESETS.length];
    setPresetId(next.id);
    document.getElementById(`el-tab-${next.id}`)?.focus();
  };

  return (
    <div className="viz not-prose">
      <p className="viz-title">Call stack, Web APIs, queue and the event loop</p>
      <p className="viz-sub">
        Pick a program, then press Play or step with the arrows. Watch where each piece of code
        waits.
      </p>

      <div role="tablist" aria-label="Example programs" className="viz-seg viz-seg--2up">
        {PRESETS.map((p, i) => (
          <button
            key={p.id}
            id={`el-tab-${p.id}`}
            type="button"
            role="tab"
            aria-selected={p.id === presetId}
            aria-controls="el-panel"
            tabIndex={p.id === presetId ? 0 : -1}
            className="viz-seg-btn"
            onClick={() => setPresetId(p.id)}
            onKeyDown={(e) => onTabKey(e, i)}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* `key` gives each program a brand-new Player, so its stepper starts at step 1
          instead of keeping the old program's position. */}
      <div id="el-panel" role="tabpanel" aria-labelledby={`el-tab-${presetId}`}>
        <Player key={preset.id} preset={preset} />
      </div>
    </div>
  );
}

function Player({ preset }: { preset: Preset }) {
  const { steps } = preset;
  const waitIndex = steps.findIndex((st) => st.waitForClick);
  const [clicked, setClicked] = useState(false);
  const clickRef = useRef<HTMLButtonElement>(null);

  // For the click program, the stepper only "has" the steps up to the wait until
  // the reader really clicks. Then the rest of the steps appear.
  const total = waitIndex >= 0 && !clicked ? waitIndex + 1 : steps.length;
  const base = useStepper(total, 1500);
  const waiting = waitIndex >= 0 && !clicked && base.index === waitIndex;

  // While waiting, Play and Next point the reader at the button instead.
  const focusClick = () => clickRef.current?.focus();
  const s: Stepper = waiting
    ? { ...base, atEnd: false, next: focusClick, toggle: focusClick }
    : base;

  const st = steps[s.index];

  const onRealClick = () => {
    setClicked(true);
    base.next(); // runs with the new, longer step list on the next render
  };
  const onReset = () => {
    setClicked(false);
    base.reset();
  };

  return (
    <>
      <div className="el-grid">
        <Panel area="code" label="Code">
          <CodeView code={preset.code} line={st.line} />
          {waitIndex >= 0 && (
            <button
              ref={clickRef}
              type="button"
              className={`viz-btn viz-btn--primary el-click ${waiting ? 'el-click--waiting' : ''}`}
              onClick={onRealClick}
              disabled={!waiting}
            >
              {clicked ? 'Clicked ✓' : 'Click me'}
            </button>
          )}
        </Panel>

        <Panel area="stack" label="Call stack" role="🧑‍🍳 the waiter">
          <Stack frames={st.stack} />
        </Panel>

        <Panel area="apis" label="Web APIs" role="🍳 the kitchen">
          <WebApis tasks={st.webApis} clock={st.clock} />
        </Panel>

        <Panel area="queue" label="Callback queue" role="🛎️ pick-up counter">
          <Queue items={st.queue} />
        </Panel>

        <Panel area="loop" label="Event loop">
          <LoopIndicator step={st} />
        </Panel>

        <Panel area="console" label="Console">
          <div className="el-console viz-mono" aria-live="polite">
            {st.console.length === 0 ? (
              <span style={{ color: C.muted }}>(nothing printed yet)</span>
            ) : (
              st.console.map((line, i) => (
                <div key={i} className="el-console-line">
                  <span aria-hidden="true">›</span> {line}
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      <div className="viz-caption" aria-live="polite">
        {st.caption}
      </div>
      <StepControls s={{ ...s, reset: onReset }} />
    </>
  );
}

function Panel({
  area,
  label,
  role,
  children,
}: {
  area: string;
  label: string;
  role?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="viz-panel el-panel" style={{ gridArea: area }} aria-label={label}>
      <div className="el-panel-head">
        <span className="viz-label">{label}</span>
        {role && <span className="el-role">{role}</span>}
      </div>
      {children}
    </section>
  );
}

function CodeView({ code, line }: { code: string; line: number | null }) {
  return (
    <pre className="el-code viz-mono">
      {code.split('\n').map((text, i) => {
        const on = line === i + 1;
        return (
          <div
            key={i}
            className={`el-code-line ${on ? 'is-on' : ''}`}
            aria-current={on || undefined}
          >
            <span className="el-ln" aria-hidden="true">
              {i + 1}
            </span>
            <span>{text || ' '}</span>
          </div>
        );
      })}
    </pre>
  );
}

function Stack({ frames }: { frames: string[] }) {
  if (frames.length === 0) return <p className="el-empty">empty</p>;
  return (
    // column-reverse: the first frame (bottom of the stack) sits at the bottom.
    <ol className="el-stack">
      {frames.map((f, i) => (
        // Keyed by position + name, so a new plate mounts (and drops in) when pushed.
        <li
          key={`${i}-${f}`}
          className="el-plate viz-mono"
          data-top={i === frames.length - 1 || undefined}
        >
          {f}
        </li>
      ))}
    </ol>
  );
}

function WebApis({ tasks, clock }: { tasks: WebApiTask[]; clock: number }) {
  return (
    <>
      <p className="el-clock viz-mono">clock: {clock} ms</p>
      {tasks.length === 0 ? (
        <p className="el-empty">nothing in the kitchen</p>
      ) : (
        <ul className="el-apis">
          {tasks.map((t) => (
            <li key={t.id} className="el-api viz-fade">
              <Ring task={t} />
              <span className="viz-mono" style={{ fontSize: 12.5 }}>
                {t.label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** A countdown ring: full when the timer starts, empty when it's ready. */
function Ring({ task }: { task: WebApiTask }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const listening = !Number.isFinite(task.msLeft);
  const left = listening || task.msTotal === 0 ? (listening ? 1 : 0) : task.msLeft / task.msTotal;
  return (
    <svg viewBox="0 0 36 36" width={36} height={36} style={{ flexShrink: 0, width: 36 }}>
      <circle cx={18} cy={18} r={r} fill="none" strokeWidth={3} style={{ stroke: C.border }} />
      <circle
        cx={18}
        cy={18}
        r={r}
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - left)}
        transform="rotate(-90 18 18)"
        style={{ stroke: C.warn, transition: 'stroke-dashoffset .5s ease' }}
      />
      <text
        x={18}
        y={22}
        textAnchor="middle"
        fontSize={listening ? 12 : 9}
        style={{ fill: C.warn }}
      >
        {listening ? '👂' : `${task.msLeft}`}
      </text>
    </svg>
  );
}

function Queue({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="el-empty">empty</p>;
  return (
    <ol className="el-queue">
      {items.map((q, i) => (
        <li key={`${q}-${i}`} className="el-qitem viz-mono">
          {q}
        </li>
      ))}
    </ol>
  );
}

function LoopIndicator({ step }: { step: ELStep }) {
  const busy = step.loop !== 'idle';
  const text =
    step.loop === 'moving'
      ? 'Stack empty → moving a callback onto it'
      : step.loop === 'checking'
        ? step.stack.length === 0
          ? step.queue.length
            ? 'Stack empty, callback waiting…'
            : 'Stack empty, queue empty. Waiting.'
          : 'Stack busy. Callbacks must wait.'
        : 'Idle';
  const color = step.loop === 'moving' ? C.active : busy ? C.warn : C.muted;
  return (
    <div className="el-loop" style={{ color }}>
      <span
        className={`el-loop-icon ${busy ? 'is-spinning' : ''}`}
        aria-hidden="true"
        style={{ borderColor: color, background: alpha(color, 10) }}
      >
        ↻
      </span>
      <span style={{ fontSize: 13.5 }}>{text}</span>
    </div>
  );
}
