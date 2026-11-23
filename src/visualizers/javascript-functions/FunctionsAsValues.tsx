import { useEffect, useRef, useState } from 'react';
import { CodeView, Tabs, type CodeLine } from '../core/code';
import { HeapCard, MemoryBox, RefArrows } from '../core/memory';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import { runDoTwice, type Passed } from './lib/realFunctions';

/**
 * #5 Pass the recipe, not the chai. A function is a value: it can sit in a
 * variable, in an array, or be handed to another function. The doTwice
 * results (including the TypeError) come from running the real code.
 */
export default function FunctionsAsValues() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Pass the recipe, not the chai</p>
      <p className="viz-sub">A function is a value: store it, share it, pass it along.</p>
      <Tabs
        twoUp
        label="Examples"
        tabs={[
          { id: 'boxes', name: 'Functions in boxes' },
          { id: 'twice', name: 'doTwice' },
          { id: 'real', name: 'Real callbacks' },
        ]}
      >
        {(t) => (t === 'boxes' ? <Boxes /> : t === 'twice' ? <DoTwice /> : <RealCallbacks />)}
      </Tabs>
    </div>
  );
}

// ─── Tab 1 ────────────────────────────────────────────────────────────

const BOX_CODE = [
  'const sayHi = () => console.log("Hi!");',
  'const sayBye = () => console.log("Bye!");',
  'const greet = sayHi;',
  'const helpers = [sayHi, sayBye];',
  'greet();',
];
const BOX_NOTES = [
  'sayHi holds a function: a recipe card 📜 in memory, with an arrow pointing to it.',
  'sayBye is a second recipe card.',
  'greet = sayHi copies the arrow, not the recipe. Two arrows, one card (just like objects in article #2).',
  'An array can hold functions too. Its two slots point at the same two cards.',
  'greet() follows its arrow to sayHi’s card and runs it: "Hi!".',
];

function Boxes() {
  const s = useStepper(BOX_CODE.length, 1600);
  const i = s.index;
  const memRef = useRef<HTMLDivElement>(null);
  const lines: CodeLine[] = BOX_CODE.map((text, k) => ({
    text,
    state: k === i ? 'on' : k > i ? 'dim' : undefined,
  }));
  return (
    <>
      <div className="jf-split">
        <div className="viz-panel">
          <div className="viz-label">Code</div>
          <CodeView lines={lines} />
          <div className="viz-panel vc-console jf-console" aria-label="Console">
            <div className="viz-mono">
              {i >= 4 ? (
                <div className="vc-out">› Hi!</div>
              ) : (
                <span className="vc-muted">(nothing yet)</span>
              )}
            </div>
          </div>
        </div>
        <div className="viz-panel jf-memory" ref={memRef}>
          <div className="jf-mem-col">
            <MemoryBox
              name="sayHi"
              kind="const"
              value=""
              refTo="hi"
              refLabel="📜"
              pulse={i === 4}
            />
            {i >= 1 && <MemoryBox name="sayBye" kind="const" value="" refTo="bye" refLabel="📜" />}
            {i >= 2 && (
              <MemoryBox
                name="greet"
                kind="const"
                value=""
                refTo="hi"
                refLabel="📜"
                state={i === 2 ? 'new' : 'same'}
                pulse={i === 4}
              />
            )}
            {i >= 3 && (
              <MemoryBox
                name="helpers"
                kind="const"
                value=""
                refTo="arr"
                refLabel="[ ]"
                state={i === 3 ? 'new' : 'same'}
              />
            )}
          </div>
          <div className="jf-mem-col">
            <HeapCard
              id="hi"
              label="📜 recipe"
              props={[{ key: 'code', value: '() => console.log("Hi!")' }]}
              state={i === 4 ? 'changed' : 'same'}
              arrows={1 + (i >= 2 ? 1 : 0) + (i >= 3 ? 1 : 0)}
            />
            {i >= 1 && (
              <HeapCard
                id="bye"
                label="📜 recipe"
                props={[{ key: 'code', value: '() => console.log("Bye!")' }]}
              />
            )}
            {i >= 3 && (
              <HeapCard
                id="arr"
                label="helpers"
                isArray
                props={[
                  { key: '0', value: '', refTo: 'hi', refLabel: '📜' },
                  { key: '1', value: '', refTo: 'bye', refLabel: '📜' },
                ]}
              />
            )}
          </div>
          <RefArrows container={memRef} deps={i} />
        </div>
      </div>
      <div className="viz-caption" aria-live="polite">
        {BOX_NOTES[i]}
      </div>
      <StepControls s={s} />
    </>
  );
}

// ─── Tab 2 ────────────────────────────────────────────────────────────

const PICKS: { id: Passed; code: string; note: string }[] = [
  { id: 'sayHi', code: 'doTwice(sayHi)', note: 'the recipe card' },
  { id: 'sayHi()', code: 'doTwice(sayHi())', note: 'the cooked result' },
  { id: 'clap', code: 'doTwice(() => console.log("Clap! 👏"))', note: 'a recipe written inline' },
];

function DoTwice() {
  const [pick, setPick] = useState<Passed | null>(null);
  const run = pick ? runDoTwice(pick) : null;
  return (
    <>
      <pre className="vc-code viz-mono">
        {[
          'const sayHi = () => console.log("Hi!");',
          '',
          'function doTwice(action) {',
          '  action();',
          '  action();',
          '}',
        ].map((t, k) => (
          <div key={k} className="vc-line">
            <span>{t || ' '}</span>
          </div>
        ))}
      </pre>
      <div className="viz-label jf-gap">What do you pass in?</div>
      <div className="viz-quiz-options">
        {PICKS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="viz-btn jf-pick"
            aria-pressed={pick === p.id}
            onClick={() => setPick(p.id)}
          >
            <code className="viz-mono">{p.code}</code>
            <span className="jf-muted jf-small"> {p.note}</span>
          </button>
        ))}
      </div>

      {run && (
        <div key={pick} className="jf-twice viz-fade">
          <div className={`jf-machine-slot ${run.error ? 'is-bad' : 'is-good'}`}>
            <span className="viz-label">action received</span>
            <code className="viz-mono">{run.received}</code>
          </div>
          <div className="viz-panel vc-console" aria-live="polite">
            <div className="viz-label">Console</div>
            <div className="viz-mono">
              {run.printed.map((l, k) => (
                <div key={k} className="vc-out">
                  › {l}
                  {pick === 'sayHi()' && (
                    <span className="jf-muted jf-small">
                      {' '}
                      (printed before doTwice even started)
                    </span>
                  )}
                </div>
              ))}
              {run.error && <div className="jf-error">💥 Uncaught {run.error}</div>}
            </div>
          </div>
          <p className="viz-caption">
            {pick === 'sayHi'
              ? 'You passed the function itself. doTwice called it twice. ✓'
              : pick === 'clap'
                ? 'An arrow function written right there in the call. doTwice called it twice. ✓'
                : 'sayHi() ran immediately and printed "Hi!" once. Its return value, undefined, is what got passed. doTwice then tried to call undefined: TypeError. Pass sayHi, not sayHi().'}
          </p>
        </div>
      )}
    </>
  );
}

// ─── Tab 3 ────────────────────────────────────────────────────────────

function RealCallbacks() {
  return (
    <div className="jf-real">
      <TimeoutDemo />
      <ClickDemo />
      <MapDemo />
    </div>
  );
}

function TimeoutDemo() {
  const [state, setState] = useState<'idle' | 'waiting' | 'done'>('idle');
  const [run, setRun] = useState(0);

  // A real setTimeout. The cleanup function cancels it if the timer is
  // replaced or the visual leaves the page, so the callback never fires
  // into a component that's gone.
  useEffect(() => {
    if (run === 0) return;
    const timer = window.setTimeout(() => setState('done'), 1500);
    return () => window.clearTimeout(timer);
  }, [run]);

  return (
    <div className="viz-panel">
      <div className="viz-label">setTimeout</div>
      <code className="viz-mono jf-small">
        setTimeout(() =&gt; console.log("Chai is ready ☕"), 1500);
      </code>
      <div className="jf-row jf-gap">
        <button
          type="button"
          className="viz-btn"
          onClick={() => {
            setState('waiting');
            setRun((r) => r + 1);
          }}
        >
          Start the timer
        </button>
        <span
          key={run}
          className={`jf-ring ${state === 'waiting' ? 'is-running' : ''} ${state === 'done' ? 'is-done' : ''}`}
          aria-hidden="true"
        />
        <span className="viz-mono jf-small" aria-live="polite">
          {state === 'idle' ? '' : state === 'waiting' ? 'waiting 1.5 s…' : '› Chai is ready ☕'}
        </span>
      </div>
    </div>
  );
}

function ClickDemo() {
  const [count, setCount] = useState(0);
  const button = useRef<HTMLButtonElement>(null);

  // The real addEventListener from the article. React usually does this for
  // you with onClick; here we do it by hand to show the callback being passed.
  useEffect(() => {
    const el = button.current;
    if (!el) return;
    const handleClick = () => setCount((c) => c + 1);
    el.addEventListener('click', handleClick); // handleClick, no brackets!
    return () => el.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="viz-panel">
      <div className="viz-label">addEventListener</div>
      <code className="viz-mono jf-small">
        button.addEventListener("click", <mark className="jf-mark">handleClick</mark>);
      </code>
      <div className="jf-row jf-gap">
        <button ref={button} type="button" className="viz-btn">
          Click me
        </button>
        <span className="viz-mono jf-small" aria-live="polite">
          handleClick ran {count} time{count === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  );
}

const MAP_IN = [1, 2, 3];
const double = (n: number) => n * 2;
const MAP_OUT = MAP_IN.map(double); // the real map

function MapDemo() {
  const s = useStepper(MAP_IN.length + 1, 900);
  return (
    <div className="viz-panel">
      <div className="viz-label">Next article: map</div>
      <code className="viz-mono jf-small">[1, 2, 3].map(n =&gt; n * 2)</code>
      <div className="jf-belt">
        {MAP_IN.map((n, k) => (
          <span
            key={k}
            className={`jf-belt-item viz-mono ${k < s.index ? 'is-done' : ''} ${k === s.index - 1 ? 'is-now' : ''}`}
          >
            {k < s.index ? MAP_OUT[k] : n}
          </span>
        ))}
      </div>
      <p className="viz-mono jf-small" aria-live="polite">
        → [{MAP_OUT.slice(0, s.index).join(', ')}
        {s.index < MAP_IN.length ? '…' : ''}]
      </p>
      <StepControls s={s} />
    </div>
  );
}
