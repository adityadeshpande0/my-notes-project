import { useState } from 'react';
import { CodeView, Tabs, type CodeLine } from '../core/code';
import { MemoryBox } from '../core/memory';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import { checkAge, returnVsLog } from './lib/realFunctions';

/**
 * #3 Show it vs hand it back. Both functions work out 500 × 1.18, but only
 * one hands the answer back. All values come from running the real code
 * (lib/realFunctions.ts): NaN and 690 are what JavaScript itself prints.
 */
export default function ReturnVsLog() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Show it vs hand it back</p>
      <p className="viz-sub">The same maths, two endings. Step through both at once.</p>
      <Tabs
        label="Examples"
        tabs={[
          { id: 'compare', name: 'return vs log' },
          { id: 'stops', name: 'return stops it' },
        ]}
      >
        {(t) => (t === 'compare' ? <Compare /> : <Stops />)}
      </Tabs>
    </div>
  );
}

const R = returnVsLog(500);
const show = (v: unknown) => (typeof v === 'string' ? JSON.stringify(v) : String(v));

const MESSAGES = [
  'Both sides are about to call their function with 500.',
  `Inside: 500 * 1.18 is ${R.b}. The log version shows it on the screen. The return version hands it back.`,
  `The call is replaced by what came back: a gets ${show(R.a)}, b gets ${R.b}.`,
  `The last lines: undefined + 100 is ${R.aFinal}, but ${R.b} + 100 is ${R.bFinal}. The value was only shown, so the program never got it back.`,
];

function Compare() {
  const s = useStepper(4, 1500);
  const i = s.index;
  return (
    <>
      <div className="viz-grid-2">
        <Side
          kind="log"
          i={i}
          fn={['function addGST_log(price) {', '  console.log(price * 1.18);', '}']}
          callLine={i >= 2 ? 'const a = undefined;' : 'const a = addGST_log(500);'}
          finalLine="console.log(a + 100);"
          box="a"
          boxValue={show(R.a)}
          final={R.aFinal}
          shown={R.shown}
        />
        <Side
          kind="return"
          i={i}
          fn={['function addGST_return(price) {', '  return price * 1.18;', '}']}
          callLine={i >= 2 ? `const b = ${R.b};` : 'const b = addGST_return(500);'}
          finalLine="console.log(b + 100);"
          box="b"
          boxValue={String(R.b)}
          final={R.bFinal}
        />
      </div>
      <div className="viz-caption" aria-live="polite">
        {MESSAGES[i]}
      </div>
      <StepControls s={s} />
    </>
  );
}

function Side({
  kind,
  i,
  fn,
  callLine,
  finalLine,
  box,
  boxValue,
  final,
  shown,
}: {
  kind: 'log' | 'return';
  i: number;
  fn: string[];
  callLine: string;
  finalLine: string;
  box: string;
  boxValue: string;
  final: string;
  shown?: string;
}) {
  const lines: CodeLine[] = [
    ...fn.map((text, k) => ({ text, state: i === 1 && k === 1 ? ('on' as const) : undefined })),
    { text: '' },
    { text: callLine, state: i === 2 ? 'on' : undefined },
    { text: finalLine, state: i === 3 ? 'on' : undefined },
  ];
  const bad = kind === 'log';
  return (
    <div className={`viz-panel jf-side is-${kind}`}>
      <div className="jf-side-head viz-mono">
        {kind === 'log' ? 'console.log version' : 'return version'}
      </div>
      {/* A new key when the line changes, so the swap crossfades. */}
      <div key={callLine} className="viz-fade">
        <CodeView lines={lines} />
      </div>
      <div className="jf-flow">
        <div className={`jf-hop ${i >= 1 ? 'is-on' : ''}`}>
          {kind === 'log' ? (
            <>
              <span className="jf-monitor" aria-hidden="true">
                🖥️
              </span>
              <span>
                {i >= 1 ? (
                  <>
                    shown on screen: <strong className="viz-mono">{shown}</strong>
                  </>
                ) : (
                  'the screen'
                )}
              </span>
              <span className="jf-muted jf-small">{i >= 1 ? 'nothing comes back ✗' : ''}</span>
            </>
          ) : (
            <>
              <span className="jf-receipt" aria-hidden="true">
                🧾
              </span>
              <span>
                {i >= 1 ? (
                  <>
                    handed back: <strong className="viz-mono">{boxValue}</strong> ↓
                  </>
                ) : (
                  'a receipt'
                )}
              </span>
            </>
          )}
        </div>
        <MemoryBox
          key={`${box}-${i >= 2}`}
          name={box}
          kind="const"
          value={i >= 2 ? boxValue : '…'}
          state={i === 2 ? (bad ? 'error' : 'new') : 'same'}
        />
      </div>
      <div
        className={`jf-final viz-mono ${i >= 3 ? (bad ? 'is-bad' : 'is-good') : ''}`}
        aria-live="polite"
      >
        › {i >= 3 ? final : '…'}
      </div>
    </div>
  );
}

function Stops() {
  const [age, setAge] = useState(15);
  const result = checkAge(age); // the real function
  const young = age < 18;
  const lines: CodeLine[] = [
    { text: 'function checkAge(age) {' },
    {
      text: '  if (age < 18) {',
      badge: { text: young ? '✓ true' : '✗ false', tone: young ? 'yes' : 'no' },
    },
    { text: '    return "Too young";', state: young ? 'on' : 'dim' },
    { text: '  }', state: young ? 'dim' : undefined },
    {
      text: '  return "Welcome!";',
      state: young ? 'dim' : 'on',
      badge: young ? { text: '⛔ not reached', tone: 'muted' } : undefined,
    },
    {
      text: '  console.log("This never runs");',
      state: 'dim',
      badge: { text: '⛔ never runs', tone: 'muted' },
    },
    { text: '}' },
  ];
  return (
    <>
      <label className="jf-slider">
        <span className="viz-mono">age = {age}</span>
        <input
          type="range"
          min={1}
          max={60}
          value={age}
          onChange={(e) => setAge(Number(e.target.value))}
        />
      </label>
      <div className="jf-gap">
        <CodeView lines={lines} />
      </div>
      <p className="jf-result viz-mono" aria-live="polite">
        checkAge({age}) → <strong>"{result}"</strong>
      </p>
      <p className="viz-caption">
        The first <code>return</code> that runs ends the function on the spot. Everything below it
        is skipped, and code after the last <code>return</code> never runs at all.
      </p>
    </>
  );
}
