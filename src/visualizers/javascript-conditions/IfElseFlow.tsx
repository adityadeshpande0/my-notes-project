import { useMemo, useState } from 'react';
import { useReducedMotion } from '../../lib/hooks';
import { FlowEdge, FlowNode } from '../core/flow';
import { MemoryBox } from '../core/memory';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import { ChainFlow } from './ChainFlow';
import { chainCodeLines } from './chainCode';
import {
  chainSteps,
  DELIVERY_CHAIN,
  DELIVERY_FEES,
  GRADE_CHAIN,
  WRONG_GRADE_CHAIN,
  type Cart,
} from './lib/ifChain';
import { CodeView, ConsoleOut, Tabs } from './parts';

/**
 * #5 Follow the decision path. Drag the marks slider and watch JavaScript
 * walk the if / else if / else chain: the code on one side, the flowchart on
 * the other. Every check is a real comparison (lib/ifChain.ts, tested).
 *
 * React idea: each "run" is a child component with a `key` made from the
 * input. When the input changes, the key changes, so React throws the old
 * child away and mounts a new one, whose stepper starts fresh and plays.
 */
export default function IfElseFlow() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Follow the decision path</p>
      <p className="viz-sub">Change the input and follow the path JavaScript takes.</p>
      <Tabs
        label="Examples"
        tabs={[
          { id: 'grades', name: 'Grades' },
          { id: 'ternary', name: 'Ternary' },
          { id: 'delivery', name: 'Free delivery' },
        ]}
      >
        {(tab) =>
          tab === 'grades' ? <GradesTab /> : tab === 'ternary' ? <TernaryTab /> : <DeliveryTab />
        }
      </Tabs>
    </div>
  );
}

/** Start at the end on first load and under reduced motion; play after the reader changes something. */
function useRunMode(touched: boolean) {
  const reduced = useReducedMotion();
  return { autoPlay: touched && !reduced, startAtEnd: !touched || reduced };
}

const printed = (action: string) => /console\.log\("(.*)"\)/.exec(action)?.[1] ?? action;

// ─── Tab 1: grades ────────────────────────────────────────────────────

function GradesTab() {
  const [marks, setMarks] = useState(72);
  const [wrongOrder, setWrongOrder] = useState(false);
  const [touched, setTouched] = useState(false);
  const change = (fn: () => void) => {
    fn();
    setTouched(true);
  };

  return (
    <>
      <div className="jc-row jc-slider-row">
        <label className="jc-slider">
          <span className="viz-mono">marks = {marks}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={marks}
            onChange={(e) => change(() => setMarks(Number(e.target.value)))}
          />
        </label>
        <div className="jc-row">
          {[95, 80, 60, 30].map((m) => (
            <button
              key={m}
              type="button"
              className="viz-btn"
              aria-pressed={marks === m}
              onClick={() => change(() => setMarks(m))}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <label className="jc-check jc-switch">
        <input
          type="checkbox"
          checked={wrongOrder}
          onChange={(e) => change(() => setWrongOrder(e.target.checked))}
        />
        Check conditions in the wrong order
      </label>
      <GradeRun
        key={`${marks}-${wrongOrder}`}
        marks={marks}
        wrongOrder={wrongOrder}
        touched={touched}
      />
    </>
  );
}

function GradeRun({
  marks,
  wrongOrder,
  touched,
}: {
  marks: number;
  wrongOrder: boolean;
  touched: boolean;
}) {
  const chain = wrongOrder ? WRONG_GRADE_CHAIN : GRADE_CHAIN;
  const steps = useMemo(() => chainSteps(chain, marks, (m) => `marks = ${m}`), [chain, marks]);
  const s = useStepper(steps.length, 750, useRunMode(touched));
  const step = steps[s.index];
  const done = step.phase === 'end';
  const n = chain.branches.length;
  const block =
    step.taken === null ? null : step.taken < n ? chain.branches[step.taken] : chain.otherwise;
  const correct =
    GRADE_CHAIN.branches.find((b) => b.test(marks))?.label ?? GRADE_CHAIN.otherwise.label;
  const showBug = wrongOrder && done && block && block.label !== correct;

  return (
    <>
      <div className="jc-split">
        <div className="viz-panel">
          <div className="viz-label">Code</div>
          <CodeView lines={chainCodeLines(chain, step, [`const marks = ${marks};`, ''])} />
          <ConsoleOut lines={done && block ? [printed(block.action)] : []} />
        </div>
        <div className="viz-panel jc-flow-panel">
          <div className="viz-label">Flowchart</div>
          <ChainFlow chain={chain} step={step} stepKey={s.index} />
        </div>
      </div>
      <div className="viz-caption" aria-live="polite">
        {showBug ? (
          <>
            <strong className="jc-warn-text">Bug!</strong> With {marks} marks you got {block!.label}
            , not {correct}. The first true condition wins, and the rest are skipped.
          </>
        ) : (
          step.message
        )}
      </div>
      <StepControls s={s} />
    </>
  );
}

// ─── Tab 2: the ternary ───────────────────────────────────────────────

function TernaryTab() {
  const [age, setAge] = useState(20);
  const [touched, setTouched] = useState(false);
  return (
    <>
      <label className="jc-slider">
        <span className="viz-mono">age = {age}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={age}
          onChange={(e) => {
            setAge(Number(e.target.value));
            setTouched(true);
          }}
        />
      </label>
      <TernaryRun key={age} age={age} touched={touched} />
    </>
  );
}

const TERNARY_MESSAGES = (age: number, ok: boolean, label: string) => [
  `const label = age >= 18 ? "Adult" : "Minor"; with age = ${age}.`,
  `First the condition: is ${age} >= 18? ${ok ? 'Yes, true.' : 'No, false.'}`,
  `${ok ? 'True' : 'False'}, so the ternary picks the value ${ok ? 'after ?' : 'after :'}: "${label}".`,
  `That value goes into the label box. label is now "${label}".`,
];

function TernaryRun({ age, touched }: { age: number; touched: boolean }) {
  // The real ternary, straight from the article.
  const label = age >= 18 ? 'Adult' : 'Minor';
  const ok = age >= 18;
  const s = useStepper(4, 900, useRunMode(touched));
  const i = s.index;
  const pick = (yes: boolean) =>
    i < 2 ? 'idle' : yes === ok ? (i === 2 ? 'active' : 'done') : 'skipped';

  return (
    <>
      <pre className="jc-code jc-ternary-code viz-mono" aria-label="Code">
        <span>const label = </span>
        <span className={`jc-part ${i === 1 ? 'is-on' : ''}`}>age &gt;= 18</span>
        <span> ? </span>
        <span className={`jc-part ${i >= 2 && ok ? 'is-on' : i >= 2 ? 'is-dim' : ''}`}>
          "Adult"
        </span>
        <span> : </span>
        <span className={`jc-part ${i >= 2 && !ok ? 'is-on' : i >= 2 ? 'is-dim' : ''}`}>
          "Minor"
        </span>
        <span>;</span>
      </pre>
      <div className="jc-ternary">
        <svg
          viewBox="0 0 320 170"
          className="jc-flow jc-flow--small"
          role="img"
          aria-label={TERNARY_MESSAGES(age, ok, label)[i]}
        >
          <FlowEdge
            points={[
              [70, 36],
              [70, 104],
            ]}
            label="yes"
            labelAt={[70, 72]}
            active={i >= 2 && ok}
            dim={i >= 2 && !ok}
            travel={i === 2 && ok}
            travelKey={i}
          />
          <FlowEdge
            points={[
              [250, 36],
              [250, 104],
            ]}
            label="no"
            labelAt={[250, 72]}
            active={i >= 2 && !ok}
            dim={i >= 2 && ok}
            travel={i === 2 && !ok}
            travelKey={i}
          />
          <FlowEdge
            points={[
              [70, 138],
              [70, 158],
              [150, 158],
              [150, 170],
            ]}
            active={i === 3 && ok}
            dim={i === 3 && !ok}
            travel={i === 3 && ok}
            travelKey={i}
          />
          <FlowEdge
            points={[
              [250, 138],
              [250, 158],
              [170, 158],
              [170, 170],
            ]}
            active={i === 3 && !ok}
            dim={i === 3 && ok}
            travel={i === 3 && !ok}
            travelKey={i}
          />
          <FlowNode
            shape="decision"
            x={160}
            y={36}
            w={180}
            h={56}
            label="age >= 18?"
            mono
            state={i === 1 ? 'active' : i > 1 ? (ok ? 'yes' : 'no') : 'idle'}
            badge={i >= 1 ? (ok ? '✓' : '✗') : undefined}
          />
          <FlowNode
            shape="action"
            x={70}
            y={121}
            w={100}
            h={34}
            label='"Adult"'
            mono
            state={pick(true)}
          />
          <FlowNode
            shape="action"
            x={250}
            y={121}
            w={100}
            h={34}
            label='"Minor"'
            mono
            state={pick(false)}
          />
        </svg>
        <div className="jc-ternary-box">
          <MemoryBox
            key={i === 3 ? 'filled' : 'empty'}
            name="label"
            kind="const"
            value={i === 3 ? `"${label}"` : '…'}
            state={i === 3 ? 'new' : 'same'}
          />
        </div>
      </div>
      <div className="viz-caption" aria-live="polite">
        {TERNARY_MESSAGES(age, ok, label)[i]}
      </div>
      <StepControls s={s} />
    </>
  );
}

// ─── Tab 3: free delivery ─────────────────────────────────────────────

function DeliveryTab() {
  const [total, setTotal] = useState(350);
  const [isPrime, setIsPrime] = useState(false);
  const [touched, setTouched] = useState(false);
  return (
    <>
      <div className="jc-row jc-slider-row">
        <label className="jc-slider">
          <span className="viz-mono">total = ₹{total}</span>
          <input
            type="range"
            min={0}
            max={1000}
            step={10}
            value={total}
            onChange={(e) => {
              setTotal(Number(e.target.value));
              setTouched(true);
            }}
          />
        </label>
        <label className="jc-check">
          <input
            type="checkbox"
            checked={isPrime}
            onChange={(e) => {
              setIsPrime(e.target.checked);
              setTouched(true);
            }}
          />
          Prime member
        </label>
      </div>
      <DeliveryRun key={`${total}-${isPrime}`} cart={{ total, isPrime }} touched={touched} />
    </>
  );
}

function DeliveryRun({ cart, touched }: { cart: Cart; touched: boolean }) {
  const steps = useMemo(
    () => chainSteps(DELIVERY_CHAIN, cart, (c) => `total = ₹${c.total} and isPrime = ${c.isPrime}`),
    [cart],
  );
  const s = useStepper(steps.length, 750, useRunMode(touched));
  const step = steps[s.index];
  const done = step.phase === 'end';
  const fee = step.taken === null ? null : DELIVERY_FEES[step.taken];

  return (
    <>
      <div className="jc-split">
        <div className="viz-panel">
          <div className="viz-label">Code</div>
          <CodeView
            lines={chainCodeLines(DELIVERY_CHAIN, step, [
              `const total = ${cart.total};`,
              `const isPrime = ${cart.isPrime};`,
              'let delivery;',
              '',
            ])}
          />
          <div className="viz-panel jc-order">
            <div className="viz-label">Order summary</div>
            <div className="jc-order-row">
              <span>Items</span>
              <span className="viz-mono">₹{cart.total}</span>
            </div>
            <div className="jc-order-row">
              <span>Delivery</span>
              <span className="viz-mono">
                {done && fee !== null ? (fee === 0 ? 'FREE' : `₹${fee}`) : '…'}
              </span>
            </div>
            <div className="jc-order-row is-total">
              <span>To pay</span>
              <span className="viz-mono">
                {done && fee !== null ? `₹${cart.total + fee}` : '…'}
              </span>
            </div>
          </div>
        </div>
        <div className="viz-panel jc-flow-panel">
          <div className="viz-label">Flowchart</div>
          <ChainFlow chain={DELIVERY_CHAIN} step={step} stepKey={s.index} />
        </div>
      </div>
      <div className="viz-caption" aria-live="polite">
        {step.message}
        {done &&
          cart.isPrime &&
          cart.total < 500 &&
          ' Prime made the || true, so the total didn’t matter.'}
      </div>
      <StepControls s={s} />
    </>
  );
}
