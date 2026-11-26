import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Tabs } from '../core/code';
import { isAbort, makeOrder } from './lib/fakeKitchen';
import Speed from './Speed';

/**
 * #1 Three ways to wait (and one way to freeze).
 *
 * React idea: effects that clean up after async work. Every run gets its own
 * AbortController; the effect's cleanup (and Reset) calls abort(), which
 * clears the kitchen's timers. Without it, a timer could finish after the
 * visual is gone and try to update state that no longer exists.
 */
type TabId = 'freeze' | 'styles';

export default function WaitingStyles() {
  const [speed, setSpeed] = useState(1);
  return (
    <div className="viz not-prose as-waiting">
      <p className="viz-title">Three ways to wait (and one way to freeze)</p>
      <Speed value={speed} onChange={setSpeed} />
      <Tabs<TabId>
        label="Parts of this visual"
        tabs={[
          { id: 'freeze', name: 'Freeze vs flow' },
          { id: 'styles', name: 'Callbacks → Promises → async/await' },
        ]}
      >
        {(t) => (t === 'freeze' ? <FreezeTab speed={speed} /> : <StylesTab speed={speed} />)}
      </Tabs>
    </div>
  );
}

// ─── Tab: Freeze vs flow ─────────────────────────────────────────────

const CHAI_MS = 3000;

function FreezeTab({ speed }: { speed: number }) {
  const [frozen, setFrozen] = useState(false);
  const [count, setCount] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [cooking, setCooking] = useState<{ id: number; ms: number } | null>(null);
  const [status, setStatus] = useState('');
  const frozenRef = useRef(false);
  const heldClicks = useRef(0);
  const ctrl = useRef<AbortController | null>(null);
  const timers = useRef<number[]>([]);

  // The ticking clock. While "frozen" it simply skips updates, like a stuck page.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!frozenRef.current) setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);
  // Leaving the tab: cancel the kitchen and any pending "unfreeze".
  useEffect(
    () => () => {
      ctrl.current?.abort();
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const blockSync = () => {
    // SIMULATED: we never really block the page (that would freeze this whole
    // article). We pause the animations and hold the clicks instead.
    frozenRef.current = true;
    setFrozen(true);
    setStatus('');
    timers.current.push(
      window.setTimeout(() => {
        frozenRef.current = false;
        setFrozen(false);
        // A real browser runs the clicks it was holding, all at once.
        const held = heldClicks.current;
        heldClicks.current = 0;
        setBuffered(0);
        setCount((c) => c + held);
        setStatus('Chai ready ☕ (and the page woke up: the waiting clicks all landed at once)');
      }, CHAI_MS / speed),
    );
  };

  const cookAsync = async () => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setStatus('');
    setCooking({ id: Date.now(), ms: CHAI_MS / speed });
    try {
      // A REAL promise and a real timer: the page stays alive while it waits.
      await makeOrder('chai', { ms: CHAI_MS, signal: c.signal, speed });
      setStatus('Chai ready ☕ (and the page never stopped)');
    } catch (e) {
      if (!isAbort(e)) setStatus('Something went wrong');
    } finally {
      if (ctrl.current === c) setCooking(null);
    }
  };

  return (
    <>
      <div className={`as-live ${frozen ? 'is-frozen' : ''}`}>
        <div className="as-live-row">
          <span className="as-cup" aria-hidden="true">
            ☕
          </span>
          <span className="as-clock viz-mono" aria-label={`Clock: ${seconds} seconds`}>
            ⏱ {String(Math.floor(seconds / 60)).padStart(2, '0')}:
            {String(seconds % 60).padStart(2, '0')}
          </span>
          <button
            type="button"
            className="viz-btn"
            onClick={() => {
              if (!frozenRef.current) return setCount((c) => c + 1);
              heldClicks.current++;
              setBuffered(heldClicks.current);
            }}
          >
            Click me: {count}
          </button>
          {buffered > 0 && <span className="as-badge is-warn">{buffered} clicks waiting…</span>}
        </div>
        {cooking && (
          <div className="as-progress" aria-label="Cooking">
            <span key={cooking.id} style={{ '--ms': `${cooking.ms}ms` } as CSSProperties} />
          </div>
        )}
        {frozen && (
          <div className="as-frozen" role="status">
            🥶 Page frozen: JavaScript is stuck waiting
          </div>
        )}
      </div>
      <div className="as-row as-gap">
        <button type="button" className="viz-btn" onClick={blockSync} disabled={frozen}>
          Make chai synchronously (blocks)
        </button>
        <button
          type="button"
          className="viz-btn viz-btn--primary"
          onClick={cookAsync}
          disabled={frozen || !!cooking}
        >
          Make chai asynchronously
        </button>
      </div>
      <p className="as-status" aria-live="polite">
        {status}
      </p>
      <p className="as-note">
        We’re simulating the freeze. A real 3-second block would freeze this whole article! To fake
        it, the animations pause, the clock stops and your clicks are held back, then applied all at
        once at the end, just as a real browser would. The async button is real:{' '}
        <code>await makeOrder("chai", {'{ ms: 3000 }'})</code>.
      </p>
    </>
  );
}

// ─── Tab: Callbacks → Promises → async/await ─────────────────────────

const STEPS = [
  { name: 'boil', icon: '💧', ms: 1000 },
  { name: 'tea', icon: '🍃', ms: 1000 },
  { name: 'milk', icon: '🥛', ms: 800 },
  { name: 'serve', icon: '☕', ms: 500 },
];
type Style = 'callbacks' | 'promises' | 'async';

/** The code for each style, and which line belongs to each step / the error handler. */
function codeFor(
  style: Style,
  errors: boolean,
): { lines: string[]; step: number[]; done: number; catchAt: number[] } {
  if (style === 'callbacks' && !errors)
    return {
      lines: [
        'boilWater((water) => {',
        '  addTea(water, (tea) => {',
        '    addMilk(tea, (chai) => {',
        '      serve(chai, () => {',
        '        console.log("Enjoy! ☕");',
        '      });',
        '    });',
        '  });',
        '});',
      ],
      step: [0, 1, 2, 3],
      done: 4,
      catchAt: [],
    };
  if (style === 'callbacks')
    return {
      lines: [
        'boilWater((err, water) => {',
        '  if (err) return showError(err);',
        '  addTea(water, (err, tea) => {',
        '    if (err) return showError(err);',
        '    addMilk(tea, (err, chai) => {',
        '      if (err) return showError(err);',
        '      serve(chai, (err) => {',
        '        if (err) return showError(err);',
        '        console.log("Enjoy! ☕");',
        '      });',
        '    });',
        '  });',
        '});',
      ],
      step: [0, 2, 4, 6],
      done: 8,
      // The error from step k is handled on the line after that step's callback starts.
      catchAt: [1, 3, 5, 7],
    };
  if (style === 'promises')
    return {
      lines: [
        'boilWater()',
        '  .then((water) => addTea(water))',
        '  .then((tea) => addMilk(tea))',
        '  .then((chai) => serve(chai))',
        '  .then(() => console.log("Enjoy! ☕"))',
        '  .catch((err) => showError(err));',
      ],
      step: [0, 1, 2, 3],
      done: 4,
      catchAt: [5, 5, 5, 5],
    };
  return {
    lines: [
      'async function makeAndServe() {',
      '  try {',
      '    const water = await boilWater();',
      '    const tea = await addTea(water);',
      '    const chai = await addMilk(tea);',
      '    await serve(chai);',
      '    console.log("Enjoy! ☕");',
      '  } catch (err) {',
      '    showError(err);',
      '  }',
      '}',
    ],
    step: [2, 3, 4, 5],
    done: 6,
    catchAt: [8, 8, 8, 8],
  };
}

interface Col {
  /** Step running now, or -1. */
  active: number;
  done: number;
  phase: 'idle' | 'running' | 'done' | 'error';
  /** Which step failed. */
  failed: number;
}
const IDLE: Col = { active: -1, done: 0, phase: 'idle', failed: -1 };

function StylesTab({ speed }: { speed: number }) {
  const [failMilk, setFailMilk] = useState(false);
  const [cols, setCols] = useState<Record<Style, Col>>({
    callbacks: IDLE,
    promises: IDLE,
    async: IDLE,
  });
  const ctrl = useRef<AbortController | null>(null);
  useEffect(() => () => ctrl.current?.abort(), []);

  const runAll = () => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    const signal = c.signal;
    const set = (s: Style, patch: Partial<Col>) => {
      if (!signal.aborted) setCols((cs) => ({ ...cs, [s]: { ...cs[s], ...patch } }));
    };
    setCols({ callbacks: IDLE, promises: IDLE, async: IDLE });
    // One kitchen step, as a promise. It reports when it starts (for the highlight).
    const step = (s: Style, k: number) => {
      set(s, { active: k, phase: 'running', done: k });
      return makeOrder(STEPS[k].name, {
        ms: STEPS[k].ms,
        fail: failMilk && k === 2,
        signal,
        speed,
      });
    };
    const finish = (s: Style) => set(s, { active: -1, done: 4, phase: 'done' });
    const fail = (s: Style, k: number, e: unknown) => {
      if (!isAbort(e)) set(s, { active: -1, phase: 'error', failed: k });
    };

    // 1. Callbacks: each step calls the next one from inside its callback.
    const cbStep = (k: number, cb: (err: unknown) => void) =>
      step('callbacks', k).then(
        () => cb(null),
        (e) => cb(e),
      );
    cbStep(0, (err) => {
      if (err) return fail('callbacks', 0, err);
      cbStep(1, (err) => {
        if (err) return fail('callbacks', 1, err);
        cbStep(2, (err) => {
          if (err) return fail('callbacks', 2, err);
          cbStep(3, (err) => {
            if (err) return fail('callbacks', 3, err);
            finish('callbacks');
          });
        });
      });
    });

    // 2. Promises: a flat chain with one .catch().
    let at = 0;
    step('promises', 0)
      .then(() => step('promises', (at = 1)))
      .then(() => step('promises', (at = 2)))
      .then(() => step('promises', (at = 3)))
      .then(() => finish('promises'))
      .catch((e) => fail('promises', at, e));

    // 3. async/await: reads top to bottom, try...catch for errors.
    (async () => {
      let k = 0;
      try {
        for (k = 0; k < 4; k++) await step('async', k);
        finish('async');
      } catch (e) {
        fail('async', k, e);
      }
    })();
  };

  const reset = () => {
    ctrl.current?.abort();
    setCols({ callbacks: IDLE, promises: IDLE, async: IDLE });
  };

  return (
    <>
      <div className="as-row">
        <button type="button" className="viz-btn viz-btn--primary" onClick={runAll}>
          ▶ Run all three
        </button>
        <label className="as-check">
          <input
            type="checkbox"
            checked={failMilk}
            onChange={(e) => setFailMilk(e.target.checked)}
          />
          Make the milk step fail
        </label>
        <button type="button" className="viz-btn" onClick={reset}>
          ↺ Reset
        </button>
      </div>
      <div
        className="as-cols"
        role="region"
        aria-label="The same recipe in three styles (scrolls sideways on small screens)"
        tabIndex={0}
      >
        {(['callbacks', 'promises', 'async'] as Style[]).map((s) => (
          <StyleColumn key={s} style={s} col={cols[s]} errors={failMilk} />
        ))}
      </div>
      <p className="as-note">
        Same recipe, same kitchen, same finishing time. The only difference is how easy the code is
        to read.
      </p>
    </>
  );
}

const STYLE_NAME: Record<Style, string> = {
  callbacks: 'Callbacks',
  promises: 'Promises .then()',
  async: 'async / await',
};

function StyleColumn({ style, col, errors }: { style: Style; col: Col; errors: boolean }) {
  const code = codeFor(style, errors);
  const depth = Math.max(...code.lines.map((l) => (l.length - l.trimStart().length) / 2));
  const on = new Set<number>();
  const bad = new Set<number>();
  if (col.phase === 'running' && col.active >= 0) on.add(code.step[col.active]);
  if (col.phase === 'done') on.add(code.done);
  if (col.phase === 'error') {
    bad.add(code.step[col.failed]);
    if (code.catchAt[col.failed] !== undefined) bad.add(code.catchAt[col.failed]);
  }
  return (
    <div className={`viz-panel as-col is-${col.phase}`}>
      <div className="as-col-head">
        <span className="viz-label">{STYLE_NAME[style]}</span>
        <span className="as-badge">{code.lines.length} lines</span>
        <span className={`as-badge ${depth > 3 ? 'is-warn' : ''}`}>nesting {depth}</span>
      </div>
      <ol className="as-steps" aria-label="Progress">
        {STEPS.map((st, k) => (
          <li
            key={st.name}
            className={
              col.phase === 'error' && col.failed === k
                ? 'is-bad'
                : k < col.done || col.phase === 'done'
                  ? 'is-done'
                  : k === col.active
                    ? 'is-on'
                    : ''
            }
          >
            <span aria-hidden="true">{st.icon}</span> {st.name}
          </li>
        ))}
      </ol>
      <pre className="as-code viz-mono">
        {code.lines.map((line, i) => {
          const indent = line.length - line.trimStart().length;
          return (
            <div
              key={i}
              className={`as-line ${on.has(i) ? 'is-on' : ''} ${bad.has(i) ? 'is-bad' : ''}`}
            >
              {/* Faint bands for each level of nesting: the pyramid shape, made visible. */}
              {style === 'callbacks' &&
                Array.from({ length: indent / 2 }, (_, k) => (
                  <span key={k} className={`as-band is-${k % 4}`} aria-hidden="true" />
                ))}
              <span>{line.trimStart() || ' '}</span>
            </div>
          );
        })}
      </pre>
      <p className="as-small" aria-live="polite">
        {col.phase === 'done'
          ? '✓ Enjoy! ☕'
          : col.phase === 'error'
            ? style === 'callbacks'
              ? '✗ Handled by the if (err) at that level'
              : style === 'promises'
                ? '✗ Skipped to the one .catch()'
                : '✗ Jumped to catch'
            : col.phase === 'running'
              ? `${STEPS[col.active]?.name ?? ''}…`
              : ' '}
      </p>
    </div>
  );
}
