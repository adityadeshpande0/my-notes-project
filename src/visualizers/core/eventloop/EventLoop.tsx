import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { alpha, C } from '../colors';
import { Backpack } from '../scope';
import { StackFrame, StackTower } from '../stack';
import { StepControls } from '../StepControls';
import { useStepper, type Stepper } from '../useStepper';
import type { ELStep, Preset, WebApiTask } from './engine';

/**
 * Call stack, Web APIs, the queues and the event loop, one step at a time.
 * The steps come from the presets (basicsPresets.ts, asyncPresets.ts); this
 * file only draws them. Shared by articles #1 and #11:
 * - article #1 passes `showMicrotasks={false}`: its programs have no promises;
 * - article #11 shows the microtask "VIP" lane and the prediction mode.
 *
 * Import './eventloop.css' (plus '../stack/stack.css' and, for the backpack,
 * '../memory/memory.css' and '../scope/scope.css') from the note's index.
 */
export default function EventLoop({
  presets,
  showMicrotasks = true,
  title = 'Call stack, Web APIs, queue and the event loop',
  sub = 'Pick a program, then press Play or step with the arrows. Watch where each piece of code waits.',
}: {
  presets: Preset[];
  showMicrotasks?: boolean;
  title?: string;
  sub?: string;
}) {
  const PRESETS = presets;
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const preset = PRESETS.find((p) => p.id === presetId)!;

  // Arrow keys move between tabs, as screen-reader users expect from a tab list.
  const onTabKey = (e: KeyboardEvent, i: number) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = PRESETS[(i + dir + PRESETS.length) % PRESETS.length];
    setPresetId(next.id);
    document.getElementById(`el-tab-${next.id}`)?.focus();
  };

  return (
    <div className="viz not-prose">
      <p className="viz-title">{title}</p>
      <p className="viz-sub">{sub}</p>

      <div role="tablist" aria-label="Example programs" className="viz-seg viz-seg--2up el-tabs">
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
        <Player key={preset.id} preset={preset} micro={showMicrotasks} />
      </div>
    </div>
  );
}

function Player({ preset, micro }: { preset: Preset; micro: boolean }) {
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
      {preset.predict && <Predict answer={steps[steps.length - 1].console} seen={st.console} />}
      <div className={`el-grid ${micro ? 'has-micro' : ''}`}>
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

        {micro && (
          <Panel
            area="micro"
            label="⭐ Microtask queue"
            role="the VIP line: promises, await"
            className="is-micro"
          >
            {st.microtasks.length === 0 ? (
              <p className="el-empty">empty</p>
            ) : (
              <ol className="el-queue">
                {st.microtasks.map((q, i) => (
                  <li key={`${q}-${i}`} className="el-mitem viz-mono">
                    {q}
                  </li>
                ))}
              </ol>
            )}
            {st.parked.map((p) => (
              <div key={p.label} className="el-parked">
                <Backpack
                  label={`${p.label}: carries on at ${p.place}`}
                  vars={p.locals.map(([name, value]) => ({ name, value }))}
                  tint="amber"
                />
              </div>
            ))}
          </Panel>
        )}

        <Panel area="queue" label="Task queue" role="🛎️ pick-up counter (the callback queue)">
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
  className = '',
  children,
}: {
  area: string;
  label: string;
  role?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`viz-panel el-panel ${className}`}
      style={{ gridArea: area }}
      aria-label={label}
    >
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
  // The shared call-stack plates (core/stack), so the stack looks the same in
  // every article. Keyed by position + name, so a pushed plate drops in.
  return (
    <StackTower keys={frames.map((f, i) => `${i}-${f}`)}>
      {frames.map((f, i) => (
        <StackFrame key={i} compact name={f} state={i === frames.length - 1 ? 'top' : 'waiting'} />
      ))}
    </StackTower>
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
    step.loop === 'draining'
      ? 'Draining microtasks: ALL of them, before any task'
      : step.loop === 'moving'
        ? 'Stack empty → moving a callback onto it'
        : step.loop === 'checking'
          ? step.stack.length === 0
            ? step.queue.length
              ? 'Stack empty, callback waiting…'
              : 'Stack empty, queue empty. Waiting.'
            : 'Stack busy. Callbacks must wait.'
          : 'Idle';
  const color =
    step.loop === 'moving' ? C.active : step.loop === 'draining' ? C.warn : busy ? C.warn : C.muted;
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

/**
 * Predict the order: the reader arranges the printed lines before stepping.
 * Keyboard: focus a line, then ↑/↓ move it (the buttons do the same).
 */
function Predict({ answer, seen }: { answer: string[]; seen: string[] }) {
  // Start in a fixed "shuffled" order (rotated by one, then reversed), never the answer itself.
  const [order, setOrder] = useState(() => [...answer.slice(1), answer[0]].reverse());
  const [checked, setChecked] = useState(false);
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
    setChecked(false);
    requestAnimationFrame(() =>
      document.getElementById(`el-chip-${answer.indexOf(next[j])}`)?.focus(),
    );
  };
  const score = order.filter((line, i) => answer[i] === line).length;
  const done = seen.length === answer.length;
  return (
    <div className="el-predict">
      <p className="el-predict-title">Predict the order 🤔</p>
      <p className="el-role" style={{ margin: 0 }}>
        Arrange the lines in the order you think they print (focus one and use ↑ ↓), then check.
      </p>
      <ol className="el-chips" aria-label="Your predicted order">
        {order.map((line, i) => (
          <li
            key={line}
            id={`el-chip-${answer.indexOf(line)}`}
            tabIndex={0}
            className={`el-chip ${checked ? (answer[i] === line ? 'is-right' : 'is-wrong') : ''}`}
            aria-label={`${i + 1}: ${line}`}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                move(i, e.key === 'ArrowUp' ? -1 : 1);
              }
            }}
          >
            <span className="el-chip-text viz-mono">{line}</span>
            {checked && <span aria-hidden="true">{answer[i] === line ? '✓' : '✗'}</span>}
            <button
              type="button"
              className="viz-btn"
              tabIndex={-1}
              aria-hidden="true"
              onClick={() => move(i, -1)}
              disabled={i === 0}
            >
              ↑
            </button>
            <button
              type="button"
              className="viz-btn"
              tabIndex={-1}
              aria-hidden="true"
              onClick={() => move(i, 1)}
              disabled={i === order.length - 1}
            >
              ↓
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="viz-btn viz-btn--primary" onClick={() => setChecked(true)}>
        Check my order
      </button>
      {checked && (
        <p className="el-score" aria-live="polite">
          {score === answer.length
            ? `🎯 ${score}/${answer.length}: perfect! Step through to see why.`
            : `${score}/${answer.length} in the right place. Step through to see what really happens${done ? ' (the console below shows the real order).' : '.'}`}
        </p>
      )}
    </div>
  );
}
