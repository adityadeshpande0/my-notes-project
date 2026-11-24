import { useEffect, useMemo, useRef, useState } from 'react';
import { CodeView, Tabs } from '../core/code';
import { MemoryBox, RefArrows } from '../core/memory';
import { Backpack } from '../core/scope';
import { StackFrame, StackTower } from '../core/stack';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import { COUNTER_CODE, counterSteps, loopClosures, makeMultiplier } from './lib/scopeSim';

/**
 * #3 Functions with a backpack. When a function is created, it keeps a LINK
 * to the scope it was born in: its backpack. When the outer function
 * finishes, its plate goes, but the variables the backpack links to stay
 * alive. They're the same variables, not copies.
 */
export default function ClosureBackpack() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Functions with a backpack</p>
      <p className="viz-sub">
        The plate disappears. The backpack stays, still linked to its variables.
      </p>
      <Tabs
        twoUp
        label="Examples"
        tabs={[
          { id: 'counter', name: 'makeCounter' },
          { id: 'two', name: 'Two counters' },
          { id: 'factory', name: 'Function factory' },
          { id: 'loop', name: 'The loop puzzle' },
          { id: 'stale', name: 'Stale closure (React)' },
        ]}
      >
        {(t) =>
          t === 'counter' ? (
            <Counter />
          ) : t === 'two' ? (
            <TwoCounters />
          ) : t === 'factory' ? (
            <Factory />
          ) : t === 'loop' ? (
            <LoopPuzzle />
          ) : (
            <Stale />
          )
        }
      </Tabs>
    </div>
  );
}

// ─── Tab 1 ────────────────────────────────────────────────────────────

function Counter() {
  const sim = useMemo(() => counterSteps(), []);
  const s = useStepper(sim.steps.length, 1500);
  const step = sim.steps[s.index];
  const mc = step.envs.find((e) => e.id === 'mc');
  const fn = step.fns[0];
  const counterVar = step.envs[0].vars.find((v) => v.name === 'counter');
  const searchedPack = step.search?.path.some((p) => p.envId === 'mc' && p.found);
  const memRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div className="jc8-three">
        <div className="viz-panel">
          <div className="viz-label">Code</div>
          <CodeView
            lines={COUNTER_CODE.map((text, k) => ({
              text,
              state: step.line === k + 1 ? 'on' : undefined,
            }))}
          />
          <div className="viz-panel vc-console jc8-console" aria-label="Console">
            <div className="viz-mono" aria-live="polite">
              {step.output.length === 0 ? (
                <span className="vc-muted">(nothing yet)</span>
              ) : (
                step.output.map((l, k) => (
                  <div key={k} className="vc-out">
                    › {l}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="viz-panel">
          <div className="viz-label">Call stack</div>
          <StackTower tilt keys={step.frames.map((f) => f.id)} empty="nothing running">
            {step.frames.map((f, k) => {
              const env = step.envs.find((e) => e.id === f.envId);
              return (
                <StackFrame
                  key={f.id}
                  name={f.name}
                  state={k === step.frames.length - 1 ? 'top' : 'waiting'}
                  locals={(env?.vars ?? []).map((v) => ({
                    name: v.name,
                    value: v.value,
                    fresh: step.changed === `${f.envId}:${v.name}`,
                  }))}
                />
              );
            })}
          </StackTower>
        </div>
        <div className="viz-panel jc8-heap" ref={memRef}>
          <div className="viz-label">Lives on</div>
          {counterVar && !counterVar.tdz && (
            <MemoryBox name="counter" kind="const" value="" refTo="fncard" refLabel="📜" />
          )}
          {fn ? (
            <div className="jc8-fncard heap-card" data-heap-id="fncard">
              <div className="heap-head">
                <span className="heap-label">📜 function</span>
                <span className="heap-type">count++; return count;</span>
              </div>
              <Backpack
                label={
                  mc?.alive
                    ? 'backpack: linked to makeCounter’s plate'
                    : 'backpack: makeCounter is gone, count lives on'
                }
                vars={(mc?.vars ?? []).map((v) => ({
                  name: v.name,
                  value: v.value,
                  kind: 'let',
                  mark: step.changed === `mc:${v.name}` ? 'changed' : undefined,
                }))}
                searching={searchedPack ? 'count' : undefined}
              />
            </div>
          ) : (
            <p className="jc8-small jc8-muted">No function yet.</p>
          )}
          <RefArrows container={memRef} deps={`${s.index}`} />
        </div>
      </div>
      <div className="viz-caption" aria-live="polite">
        {step.message}
      </div>
      <StepControls s={s} />
    </>
  );
}

// ─── Tab 2 ────────────────────────────────────────────────────────────

/** The real makeCounter from the article. */
function makeCounter() {
  let count = 0;
  return function () {
    count++;
    return count;
  };
}

function TwoCounters() {
  // Two real closures, each with its own backpack. The page can't see inside
  // them; it only knows what each call returns.
  const counters = useRef({ A: makeCounter(), B: makeCounter() });
  const [last, setLast] = useState({ A: 0, B: 0 });
  const [log, setLog] = useState<string[]>([]);
  const [lastWho, setLastWho] = useState<'A' | 'B' | null>(null);
  const call = (w: 'A' | 'B') => {
    const v = counters.current[w]();
    setLast((l) => ({ ...l, [w]: v }));
    setLog((l) => [...l, `counter${w}() → ${v}`].slice(-6));
    setLastWho(w);
  };
  return (
    <>
      <pre className="vc-code viz-mono jc8-small">
        {'const counterA = makeCounter();\nconst counterB = makeCounter();'}
      </pre>
      <div className="viz-grid-2 jc8-gap">
        {(['A', 'B'] as const).map((w) => (
          <div key={w} className="viz-panel">
            <button
              type="button"
              className="viz-btn viz-btn--primary viz-mono"
              onClick={() => call(w)}
            >
              counter{w}()
            </button>
            <div className="jc8-gap">
              <Backpack
                label={`backpack ${w}`}
                tint={w === 'A' ? 'mint' : 'violet'}
                vars={[
                  {
                    name: 'count',
                    value: String(last[w]),
                    kind: 'let',
                    mark: lastWho === w ? 'changed' : undefined,
                  },
                ]}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="viz-panel vc-console jc8-console" aria-label="Console">
        <div className="viz-mono" aria-live="polite">
          {log.length === 0 ? (
            <span className="vc-muted">Call them in any order.</span>
          ) : (
            log.map((l, k) => (
              <div key={k} className="vc-out">
                › {l}
              </div>
            ))
          )}
        </div>
      </div>
      <p className="viz-caption">
        Each call to makeCounter packs a brand-new backpack, with its own count.
      </p>
    </>
  );
}

// ─── Tab 3 ────────────────────────────────────────────────────────────

const double = makeMultiplier(2);
const triple = makeMultiplier(3);

function Factory() {
  const [n, setN] = useState(5);
  const [used, setUsed] = useState<'double' | 'triple' | null>(null);
  const result = used === 'double' ? double(n) : used === 'triple' ? triple(n) : null;
  return (
    <>
      <pre className="vc-code viz-mono jc8-small">
        {
          'function makeMultiplier(factor) {\n  return (n) => n * factor;\n}\nconst double = makeMultiplier(2);\nconst triple = makeMultiplier(3);'
        }
      </pre>
      <div className="jc8-row jc8-gap">
        <label className="jc8-row">
          <span className="viz-mono">n =</span>
          <input
            className="jc8-input jc8-num"
            type="number"
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            aria-label="n"
          />
        </label>
        <button type="button" className="viz-btn viz-mono" onClick={() => setUsed('double')}>
          double({n})
        </button>
        <button type="button" className="viz-btn viz-mono" onClick={() => setUsed('triple')}>
          triple({n})
        </button>
        {result !== null && (
          <strong className="viz-mono jc8-result" aria-live="polite">
            → {result}
          </strong>
        )}
      </div>
      <div className="viz-grid-2 jc8-gap">
        <Backpack
          label="double’s backpack"
          tint="mint"
          vars={[
            {
              name: 'factor',
              value: '2',
              kind: 'const',
              mark: used === 'double' ? 'found' : undefined,
            },
          ]}
        />
        <Backpack
          label="triple’s backpack"
          tint="violet"
          vars={[
            {
              name: 'factor',
              value: '3',
              kind: 'const',
              mark: used === 'triple' ? 'found' : undefined,
            },
          ]}
        />
      </div>
      <p className="viz-caption">
        Same recipe, different backpacks: each function remembers the factor it was made with.
      </p>
    </>
  );
}

// ─── Tab 4 ────────────────────────────────────────────────────────────

const VAR_OUT = loopClosures('var'); // [3, 3, 3], from real closures
const LET_OUT = loopClosures('let'); // [0, 1, 2]

function LoopPuzzle() {
  // Steps: start, laps 0–2, loop ends, then the 3 timers fire.
  const s = useStepper(8, 1100);
  const lap = Math.min(s.index - 1, 2); // the newest lap that has run (-1: none)
  const ended = s.index >= 4;
  const fired = Math.max(0, s.index - 4);
  const iNow = s.index === 0 ? '…' : ended ? '3' : String(lap);
  const cards = Math.max(0, lap + 1);

  return (
    <>
      <div className="viz-grid-2">
        <div className="viz-panel">
          <pre className="vc-code viz-mono jc8-small">
            {'for (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}'}
          </pre>
          <div className="jc8-shared jc8-gap">
            <MemoryBox
              name="i"
              kind="var"
              value={iNow}
              state={s.index > 0 ? 'changed' : 'same'}
              key={`i-${iNow}`}
            />
            <span className="jc8-small jc8-muted">one i for the whole loop</span>
          </div>
          <div className="jc8-cards">
            {Array.from({ length: cards }, (_, k) => (
              <Backpack
                key={k}
                label={`timer ${k + 1}`}
                vars={[{ name: 'i', value: `→ the shared i (${iNow})`, kind: 'var' }]}
              />
            ))}
          </div>
          <Fired outputs={VAR_OUT} fired={fired} />
        </div>
        <div className="viz-panel">
          <pre className="vc-code viz-mono jc8-small">
            {'for (let j = 0; j < 3; j++) {\n  setTimeout(() => console.log(j), 0);\n}'}
          </pre>
          <p className="jc8-small jc8-muted jc8-gap">a fresh j for every lap</p>
          <div className="jc8-cards">
            {Array.from({ length: cards }, (_, k) => (
              <Backpack
                key={k}
                label={`timer ${k + 1}`}
                tint="mint"
                vars={[{ name: 'j', value: String(k), kind: 'let' }]}
              />
            ))}
          </div>
          <Fired outputs={LET_OUT} fired={fired} />
        </div>
      </div>
      <div className="viz-caption" aria-live="polite">
        {s.index === 0
          ? 'Each lap creates an arrow function and hands it to setTimeout. Watch what each one links to.'
          : !ended
            ? `Lap ${lap}: a new arrow function is queued. With var, it links to the one shared i. With let, it gets its own j.`
            : fired === 0
              ? 'The loop is done: the shared i is now 3. The timers wait in the queue until the stack is empty (article #1).'
              : fired < 3
                ? 'A timer fires. The var version reads the shared i, which is 3. The let version reads its own j.'
                : 'var: 3, 3, 3, because every backpack links to the same i. let: 0, 1, 2, because each lap made a new j. Backpacks hold links, not copies.'}
      </div>
      <StepControls s={s} />
    </>
  );
}

function Fired({ outputs, fired }: { outputs: number[]; fired: number }) {
  return (
    <div className="jc8-queue">
      <span className="viz-label">Queue → console</span>
      <div className="jc8-row">
        {outputs.map((o, k) => (
          <span key={k} className={`jc8-timer ${k < fired ? 'is-fired' : ''}`}>
            {k < fired ? `› ${o}` : '⏱'}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Tab 5 ────────────────────────────────────────────────────────────

function Stale() {
  const [count, setCount] = useState(0);
  const [fixed, setFixed] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string; stale: boolean; now: number }[]>(
    [],
  );
  // The fix: a ref always holds the latest value (React's useRef does the same).
  const latest = useRef(count);
  useEffect(() => {
    latest.current = count; // keep the box up to date after every render
  }, [count]);
  const timers = useRef(new Set<number>());

  // Clean up any waiting timers if the visual leaves the page.
  useEffect(() => {
    const set = timers.current;
    return () => set.forEach((t) => window.clearTimeout(t));
  }, []);

  const showLater = () => {
    // This arrow function is a closure over `count` from THIS render.
    const captured = count;
    const t = window.setTimeout(() => {
      timers.current.delete(t);
      const now = latest.current;
      const value = fixed ? now : captured;
      setToasts((ts) =>
        [...ts, { id: t, text: `count is ${value}`, stale: value !== now, now }].slice(-3),
      );
    }, 2000);
    timers.current.add(t);
  };

  return (
    <>
      <p className="jc8-small jc8-muted">
        How React’s stale closure bug happens: a plain-JavaScript simulation.
      </p>
      <div className="jc8-row">
        <MemoryBox
          key={count}
          name="count"
          kind="let"
          value={String(count)}
          state={count ? 'changed' : 'same'}
        />
        <button type="button" className="viz-btn viz-mono" onClick={() => setCount((c) => c + 1)}>
          +1
        </button>
        <button type="button" className="viz-btn" onClick={showLater}>
          Show count in 2s
        </button>
        <label className="jc8-check">
          <input type="checkbox" checked={fixed} onChange={(e) => setFixed(e.target.checked)} />
          Read the latest value (ref)
        </label>
      </div>
      <pre className="vc-code viz-mono jc8-small jc8-gap">
        {fixed
          ? 'setTimeout(() => show(latestRef.current), 2000);   // reads the box when the timer fires'
          : 'setTimeout(() => show(count), 2000);   // count from the render that made this function'}
      </pre>
      <div className="jc8-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`jc8-toast ${t.stale ? 'is-stale' : 'is-fresh'}`}>
            {t.stale ? '😬 ' : '✓ '}
            {t.text}
            {t.stale && <span className="jc8-small"> (stale: it was really {t.now})</span>}
          </div>
        ))}
      </div>
      <p className="viz-caption">
        Click “Show count in 2s”, then +1 three times quickly. The timer’s function closed over the
        count from the moment you clicked, so it shows the old value. React’s fix: read the latest
        value with a ref, or update with
        <code> setCount(c =&gt; c + 1)</code>.
      </p>
    </>
  );
}
