import { useId, useMemo, useState } from 'react';
import { alpha, C } from '../core/colors';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import { explain, OPS, PRESETS, realResult, show, type Op, type Val } from './lib/coercion';

/**
 * #8 The type conversion machine. Pick two values and an operator, run it,
 * and watch each conversion step light up. The steps come from the rule
 * engine in lib/coercion.ts; the real JavaScript result is always computed
 * too, and shown if the engine ever disagrees, so it never shows a wrong answer.
 */

type InputType = 'number' | 'string' | 'boolean';
interface Hopper {
  /** A preset index, or -1 for "your own value". */
  preset: number;
  text: string;
  type: InputType;
}

function valueOf(h: Hopper): Val {
  if (h.preset >= 0) return PRESETS[h.preset].make();
  if (h.type === 'number') return Number(h.text);
  if (h.type === 'boolean') return h.text.trim() === 'true';
  return h.text;
}
const presetIndex = (label: string) => PRESETS.findIndex((p) => p.label === label);

const CHALLENGES: { left: string; op: Op; right: string; options: string[] }[] = [
  { left: '"5"', op: '+', right: '3', options: ['8', '"53"', 'NaN'] },
  { left: '"5"', op: '-', right: '3', options: ['2', '"2"', 'NaN'] },
  { left: 'true', op: '+', right: 'true', options: ['2', '"truetrue"', 'true'] },
  { left: 'null', op: '==', right: '0', options: ['true', 'false'] },
  { left: 'null', op: '==', right: 'undefined', options: ['true', 'false'] },
];
// "3" is not a hopper preset, so the challenges need it as a number preset too.
const challengeValue = (label: string): Val =>
  label === '3' ? 3 : PRESETS[presetIndex(label)].make();

export default function CoercionMachine() {
  const [left, setLeft] = useState<Hopper>({
    preset: presetIndex('"5"'),
    text: '',
    type: 'string',
  });
  const [right, setRight] = useState<Hopper>({
    preset: presetIndex('true'),
    text: '',
    type: 'number',
  });
  const [op, setOp] = useState<Op>('-');
  // A challenge card can load the machine with its own values.
  const [loaded, setLoaded] = useState<{ a: Val; b: Val; label: string } | null>(null);
  const [guesses, setGuesses] = useState<(string | null)[]>(() => CHALLENGES.map(() => null));
  const [pending, setPending] = useState<number | null>(null);

  const a = loaded ? loaded.a : valueOf(left);
  const b = loaded ? loaded.b : valueOf(right);
  // useMemo: only re-run the engine when the inputs change, not on every step.
  const { steps, real, agrees } = useMemo(() => {
    const e = explain(a, op, b);
    const r = realResult(a, op, b);
    return { ...e, real: r, agrees: Object.is(e.result, r) };
  }, [a, op, b]);

  // Step 0 = values loaded; then one step per explanation line; the last shows the result.
  const s = useStepper(steps.length + 1, 1100);
  const finished = s.atEnd;
  const lit = s.index; // how many explanation steps are lit

  const run = () => {
    s.reset();
    // Start playing on the next tick, after the reset has been applied.
    requestAnimationFrame(() => s.toggle());
  };

  const pickGuess = (i: number, guess: string) => {
    const c = CHALLENGES[i];
    setGuesses((g) => g.map((x, k) => (k === i ? guess : x)));
    setOp(c.op);
    setLoaded({
      a: challengeValue(c.left),
      b: challengeValue(c.right),
      label: `${c.left} ${c.op} ${c.right}`,
    });
    setPending(i);
    run();
  };

  const changeHopper = (side: 'left' | 'right', h: Hopper) => {
    setLoaded(null);
    setPending(null);
    (side === 'left' ? setLeft : setRight)(h);
    s.reset();
  };

  const busy = s.playing || (s.index > 0 && !finished);

  return (
    <div className="viz not-prose">
      <p className="viz-title">The type conversion machine</p>
      <p className="viz-sub">
        Load two values, pick an operator, and run it. Each step the machine takes lights up below.
      </p>

      <div className="cm-controls">
        <HopperPicker label="Left value" hopper={left} onChange={(h) => changeHopper('left', h)} />
        <div className="viz-seg cm-ops" role="group" aria-label="Operator">
          {OPS.map((o) => (
            <button
              key={o}
              type="button"
              className="viz-seg-btn viz-mono"
              aria-pressed={op === o}
              onClick={() => {
                setOp(o);
                setPending(null);
                s.reset();
              }}
            >
              {o}
            </button>
          ))}
        </div>
        <HopperPicker
          label="Right value"
          hopper={right}
          onChange={(h) => changeHopper('right', h)}
        />
      </div>
      {loaded && (
        <p className="jv-muted cm-loaded">
          Loaded from a challenge: <code className="viz-mono">{loaded.label}</code>.{' '}
          <button type="button" className="cm-link" onClick={() => setLoaded(null)}>
            Use my values
          </button>
        </p>
      )}

      <Machine
        a={a}
        b={b}
        op={op}
        result={finished ? real : undefined}
        working={busy}
        showResult={finished}
      />

      <div className="cm-run">
        <button type="button" className="viz-btn viz-btn--primary" onClick={run}>
          Run machine ▶
        </button>
      </div>

      <ol className="cm-steps">
        {steps.map((text, i) => (
          <li key={i} className={i < lit ? 'is-lit' : ''} aria-hidden={i >= lit}>
            <span className="cm-num viz-mono">{i + 1}</span>
            <span>{text}</span>
          </li>
        ))}
      </ol>

      <div className="viz-caption" aria-live="polite">
        {finished ? (
          <>
            <code className="viz-mono">
              {show(a)} {op} {show(b)}
            </code>{' '}
            is <strong className="viz-mono">{show(real)}</strong>.
            {!agrees && <> This one&rsquo;s extra tricky. Here&rsquo;s the real answer.</>}
          </>
        ) : s.index === 0 ? (
          'Values loaded. Press Run machine.'
        ) : (
          'Working…'
        )}
      </div>

      <StepControls s={s} />

      <div className="cm-challenges">
        <p className="viz-label">Predict before you run</p>
        <div className="cm-cards">
          {CHALLENGES.map((c, i) => {
            const guess = guesses[i];
            const truth = show(realResult(challengeValue(c.left), c.op, challengeValue(c.right)));
            const revealed = guess !== null && (pending !== i || finished);
            return (
              <div key={i} className="cm-card">
                <code className="viz-mono cm-expr">
                  {c.left} {c.op} {c.right}
                </code>
                <div
                  className="cm-options"
                  role="group"
                  aria-label={`Your guess for ${c.left} ${c.op} ${c.right}`}
                >
                  {c.options.map((o) => {
                    const picked = guess === o;
                    const color = revealed
                      ? o === truth
                        ? C.ok
                        : picked
                          ? C.danger
                          : undefined
                      : undefined;
                    return (
                      <button
                        key={o}
                        type="button"
                        className="viz-btn viz-mono"
                        aria-pressed={picked}
                        disabled={revealed}
                        onClick={() => pickGuess(i, o)}
                        style={{
                          opacity: 1,
                          borderColor: color,
                          color,
                          background: color ? alpha(color, 10) : undefined,
                        }}
                      >
                        {revealed && o === truth ? '✓ ' : revealed && picked ? '✗ ' : ''}
                        {o}
                      </button>
                    );
                  })}
                </div>
                {guess !== null && !revealed && <span className="jv-muted">Running…</span>}
                {revealed && (
                  <span className={guess === truth ? 'jv-true' : 'jv-false'}>
                    {guess === truth ? 'You called it.' : `It's ${truth}.`}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HopperPicker({
  label,
  hopper,
  onChange,
}: {
  label: string;
  hopper: Hopper;
  onChange: (h: Hopper) => void;
}) {
  const id = useId();
  return (
    <div className="cm-hopper">
      <label htmlFor={`${id}-p`} className="viz-label" style={{ margin: 0 }}>
        {label}
      </label>
      <select
        id={`${id}-p`}
        value={hopper.preset}
        onChange={(e) => onChange({ ...hopper, preset: Number(e.target.value) })}
        className="viz-mono"
      >
        {PRESETS.map((p, i) => (
          <option key={p.label} value={i}>
            {p.label}
          </option>
        ))}
        <option value={-1}>your own…</option>
      </select>
      {hopper.preset === -1 && (
        <div className="cm-custom">
          <input
            aria-label={`${label}: your value`}
            value={hopper.text}
            maxLength={12}
            onChange={(e) => onChange({ ...hopper, text: e.target.value })}
            placeholder="type a value"
          />
          <select
            aria-label={`${label}: type`}
            value={hopper.type}
            onChange={(e) => onChange({ ...hopper, type: e.target.value as InputType })}
          >
            <option value="number">number</option>
            <option value="string">string</option>
            <option value="boolean">boolean</option>
          </select>
        </div>
      )}
    </div>
  );
}

/** The machine itself: two hoppers, an operator dial, belts, and an output tray. */
function Machine({
  a,
  b,
  op,
  result,
  working,
  showResult,
}: {
  a: Val;
  b: Val;
  op: Op;
  result: Val;
  working: boolean;
  showResult: boolean;
}) {
  const text = (v: Val) => {
    const s = show(v);
    return s.length > 14 ? s.slice(0, 13) + '…' : s;
  };
  return (
    <div className="viz-scroll">
      <svg
        viewBox="0 0 600 230"
        style={{ minWidth: 420 }}
        role="img"
        aria-label={`Machine: ${show(a)} ${op} ${show(b)}`}
      >
        {/* belts */}
        <path d="M150 60 H250" className={`wire ${working ? 'on flow' : ''}`} />
        <path d="M450 60 H350" className={`wire ${working ? 'on flow' : ''}`} />
        <path d="M300 104 V150" className={`wire ${working ? 'on flow' : ''}`} />
        {/* hoppers */}
        {[
          { x: 20, v: a, label: 'left' },
          { x: 450, v: b, label: 'right' },
        ].map((h) => (
          <g key={h.label}>
            <path
              d={`M${h.x} 30 H${h.x + 130} L${h.x + 115} 90 H${h.x + 15} Z`}
              style={{ fill: alpha(C.accent, 10), stroke: C.accent }}
              strokeWidth={1.5}
            />
            <text
              x={h.x + 65}
              y={66}
              textAnchor="middle"
              fontSize={16}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {text(h.v)}
            </text>
            <text x={h.x + 65} y={20} textAnchor="middle" fontSize={12} style={{ fill: C.muted }}>
              {h.label} value
            </text>
          </g>
        ))}
        {/* operator dial */}
        <circle
          cx={300}
          cy={60}
          r={44}
          strokeWidth={2}
          className={working ? 'cm-dial is-working' : 'cm-dial'}
          style={{ fill: alpha(C.warn, working ? 18 : 8), stroke: C.warn }}
        />
        <text
          x={300}
          y={68}
          textAnchor="middle"
          fontSize={24}
          fontWeight={700}
          style={{ fill: C.warn, fontFamily: 'var(--font-mono)' }}
        >
          {op}
        </text>
        {/* output tray */}
        <rect
          x={200}
          y={150}
          width={200}
          height={56}
          rx={12}
          strokeWidth={2}
          style={{
            fill: showResult ? alpha(C.ok, 14) : C.surface,
            stroke: showResult ? C.ok : C.border,
          }}
        />
        <text
          x={300}
          y={185}
          textAnchor="middle"
          fontSize={18}
          fontWeight={600}
          style={{ fill: showResult ? C.ok : C.muted, fontFamily: 'var(--font-mono)' }}
        >
          {showResult ? text(result) : '?'}
        </text>
        <text x={410} y={185} fontSize={12} style={{ fill: C.muted }}>
          output
        </text>
      </svg>
    </div>
  );
}
