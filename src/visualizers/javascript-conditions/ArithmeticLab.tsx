import { useEffect, useState } from 'react';
import { useReducedMotion } from '../../lib/hooks';
import { applyBinary, type BinOp } from './lib/evalSteps';
import { show } from './lib/format';
import { Stepper } from './parts';

/**
 * #1 Samosa maths. Pick two numbers and an operator; the answer is always
 * computed with the real JavaScript operator. % deals samosas onto plates,
 * ** draws a square or a cube, and a clock shows % wrapping around.
 */

type ArithOp = '+' | '-' | '*' | '/' | '%' | '**';
const OPS: { op: ArithOp; name: string }[] = [
  { op: '+', name: 'add' },
  { op: '-', name: 'subtract' },
  { op: '*', name: 'multiply' },
  { op: '/', name: 'divide' },
  { op: '%', name: 'remainder' },
  { op: '**', name: 'power' },
];

export default function ArithmeticLab() {
  const [op, setOp] = useState<ArithOp>('%');
  const [a, setA] = useState(17);
  const [b, setB] = useState(5);
  const [evenOdd, setEvenOdd] = useState(false);

  // In even/odd mode the operator and b are locked to "% 2".
  const realOp: ArithOp = evenOdd ? '%' : op;
  const realB = evenOdd ? 2 : b;
  const bMax = realOp === '**' ? 10 : 12;
  const result = applyBinary(realOp as BinOp, a, realB) as number;

  return (
    <div className="viz not-prose">
      <p className="viz-title">Samosa maths</p>
      <p className="viz-sub">
        Pick two numbers and an operator. The answer is worked out by real JavaScript.
      </p>

      <div className="jc-row">
        <Stepper label="a" value={a} min={0} max={30} onChange={setA} />
        <Stepper
          label="b"
          value={Math.min(realB, bMax)}
          min={0}
          max={bMax}
          onChange={setB}
          disabled={evenOdd}
        />
      </div>
      <div className="viz-seg viz-seg--2up jc-ops" role="group" aria-label="Operator">
        {OPS.map((o) => (
          <button
            key={o.op}
            type="button"
            className="viz-seg-btn"
            aria-pressed={realOp === o.op}
            // The word is hidden on phones, so say it for screen readers too.
            aria-label={`${o.op} ${o.name}`}
            disabled={evenOdd && o.op !== '%'}
            onClick={() => {
              setOp(o.op);
              if (o.op === '**' && b > 10) setB(10);
            }}
          >
            <span className="viz-mono">{o.op}</span> <span className="jc-op-name">{o.name}</span>
          </button>
        ))}
      </div>

      <div className="jc-result viz-mono" aria-live="polite">
        {evenOdd ? (
          <>
            {a} % 2 === 0 ? "even" : "odd" <span className="jc-arrow">→</span>{' '}
            <strong>{show(a % 2 === 0 ? 'even' : 'odd')}</strong>
          </>
        ) : (
          <>
            {a} {realOp} {Math.min(realB, bMax)} <span className="jc-arrow">→</span>{' '}
            <strong>{show(result)}</strong>
          </>
        )}
      </div>

      {realOp === '%' && <SamosaDeal key={`${a}-${realB}`} a={a} b={realB} evenOdd={evenOdd} />}
      {realOp === '**' && <PowerView a={a} b={Math.min(b, 10)} result={result} />}
      {(realOp === '+' || realOp === '-' || realOp === '*' || realOp === '/') && (
        <SimpleView op={realOp} a={a} b={b} result={result} />
      )}

      <div className="viz-controls">
        <button
          type="button"
          className="viz-btn"
          aria-pressed={evenOdd}
          onClick={() => setEvenOdd((v) => !v)}
        >
          Even/odd checker {evenOdd ? 'on' : 'off'}
        </button>
        <span className="jc-muted jc-small">
          {evenOdd
            ? 'b is locked to 2. Change a to test numbers.'
            : 'Locks b to 2 to test any number.'}
        </span>
      </div>

      {realOp === '%' && <Clock />}
    </div>
  );
}

/** Deals a samosas onto b plates, one round at a time. */
function SamosaDeal({ a, b, evenOdd }: { a: number; b: number; evenOdd: boolean }) {
  const reduced = useReducedMotion();
  const rounds = b > 0 ? Math.floor(a / b) : 0;
  const left = b > 0 ? a % b : a;
  // Rounds dealt so far; rounds + 1 means the leftovers have moved to their tray.
  // Under reduced motion we start at the end: same picture, no animation.
  const [round, setRound] = useState(reduced ? rounds + 1 : 0);

  useEffect(() => {
    if (round > rounds) return;
    const timer = window.setTimeout(() => setRound((r) => r + 1), rounds > 8 ? 220 : 420);
    return () => window.clearTimeout(timer);
  }, [round, rounds]);

  if (b === 0) {
    return (
      <p className="viz-caption">
        Sharing between <strong>0 friends</strong> makes no sense, so JavaScript gives{' '}
        <code className="viz-mono">NaN</code> (“Not a Number”) for{' '}
        <code className="viz-mono">{a} % 0</code>.
      </p>
    );
  }

  const each = Math.min(round, rounds);
  const finished = round > rounds;
  const pile = a - each * b - (finished ? left : 0);

  return (
    <>
      <div className="jc-deal">
        <div className="jc-pile" aria-label={`${pile} samosas not dealt yet`}>
          <div className="viz-label">Pile</div>
          <Samosas n={pile} />
        </div>
        <div className="jc-plates">
          {Array.from({ length: b }, (_, i) => (
            <div key={i} className="jc-plate" aria-label={`Friend ${i + 1}: ${each} samosas`}>
              <Samosas n={each} />
              <span className="jc-plate-count viz-mono">{each}</span>
            </div>
          ))}
        </div>
        <div className={`jc-leftover ${finished && left > 0 ? 'is-on' : ''}`}>
          <div className="viz-label">Leftover</div>
          {finished ? <Samosas n={left} /> : <span className="jc-muted jc-small">…</span>}
          {finished && <span className="jc-plate-count viz-mono">{left}</span>}
        </div>
      </div>
      <p className="viz-caption" aria-live="polite">
        {finished ? (
          evenOdd ? (
            <>
              {a} split into pairs leaves <strong>{left}</strong> over, so{' '}
              <code className="viz-mono">{a} % 2</code> is {left}:{' '}
              <strong>{left === 0 ? 'even' : 'odd'}</strong>.
            </>
          ) : (
            <>
              {a} samosas shared between {b} friends: each gets {rounds},{' '}
              <strong>{left} left over</strong>, so{' '}
              <code className="viz-mono">
                {a} % {b} = {left}
              </code>
              .
            </>
          )
        ) : (
          <>Dealing round {each + 1}: one samosa to each friend…</>
        )}
      </p>
    </>
  );
}

function Samosas({ n }: { n: number }) {
  return (
    <span className="jc-samosas" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="jc-samosa">
          🥟
        </span>
      ))}
    </span>
  );
}

/** ** as area (b = 2), volume (b = 3), or written-out multiplication. */
function PowerView({ a, b, result }: { a: number; b: number; result: number }) {
  const written =
    b === 0
      ? `Anything ** 0 is 1. (${a} ** 0 = 1)`
      : b === 1
        ? `${a} ** 1 is just ${a}.`
        : `${a} ** ${b} = ${Array(b).fill(a).join(' × ')} = ${show(result)}`;

  if (b === 2 && a > 0 && a <= 12) {
    return (
      <div className="jc-vis">
        <div
          className="jc-square"
          style={{ gridTemplateColumns: `repeat(${a}, 1fr)`, maxWidth: `${a * 22}px` }}
          role="img"
          aria-label={`A ${a} by ${a} square of ${result} tiles`}
        >
          {Array.from({ length: a * a }, (_, i) => (
            <span key={i} style={{ animationDelay: `${Math.min(i * 12, 900)}ms` }} />
          ))}
        </div>
        <p className="viz-caption">
          <code className="viz-mono">{a} ** 2</code> is a square: {a} rows of {a} tiles,{' '}
          <strong>{result} tiles</strong>. That’s why it’s called “{a} squared”.
        </p>
      </div>
    );
  }
  if (b === 3 && a > 0 && a <= 6) {
    return (
      <div className="jc-vis">
        <div
          className="jc-cube-stage"
          role="img"
          aria-label={`A cube of ${a} layers of ${a} by ${a}`}
        >
          <div className="jc-cube" style={{ width: a * 18, height: a * 18 }}>
            {Array.from({ length: a }, (_, layer) => (
              <div
                key={layer}
                className="jc-cube-layer"
                style={{
                  gridTemplateColumns: `repeat(${a}, 1fr)`,
                  width: a * 18,
                  height: a * 18,
                  transform: `translateZ(${layer * 18}px)`,
                  animationDelay: `${layer * 120}ms`,
                }}
              >
                {Array.from({ length: a * a }, (_, i) => (
                  <span key={i} />
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="viz-caption">
          <code className="viz-mono">{a} ** 3</code> is a cube: {a} layers of {a} × {a} ={' '}
          <strong>{result} blocks</strong>. That’s “{a} cubed”.
        </p>
      </div>
    );
  }
  return (
    <p className="viz-caption viz-mono jc-written">
      {written}
      {(b === 2 && a > 12) || (b === 3 && a > 6) ? (
        <span className="jc-muted jc-small"> (too big to draw, so here it is written out)</span>
      ) : null}
    </p>
  );
}

function SimpleView({
  op,
  a,
  b,
  result,
}: {
  op: '+' | '-' | '*' | '/';
  a: number;
  b: number;
  result: number;
}) {
  if (op === '+')
    return (
      <div className="jc-vis">
        <Dots n={a} tone="a" />
        <Dots n={b} tone="b" />
        <p className="viz-caption">
          {a} dots and {b} more make <strong>{result}</strong>.
        </p>
      </div>
    );
  if (op === '-')
    return (
      <div className="jc-vis">
        <Dots n={a} tone="a" crossed={Math.min(a, b)} />
        <p className="viz-caption">
          Take {b} away from {a}: <strong>{result}</strong>
          {result < 0 && ' (below zero, so the answer is negative)'}.
        </p>
      </div>
    );
  if (op === '*')
    return (
      <div className="jc-vis">
        <div className="jc-rows" role="img" aria-label={`${b} rows of ${a} dots`}>
          {Array.from({ length: b }, (_, r) => (
            <Dots key={r} n={a} tone={r % 2 ? 'b' : 'a'} />
          ))}
        </div>
        <p className="viz-caption">
          {b} rows of {a} make <strong>{result}</strong>.
          {b === 0 && ' Zero rows means nothing at all.'}
        </p>
      </div>
    );
  // op === '/'
  if (b === 0)
    return (
      <p className="viz-caption">
        {a === 0 ? (
          <>
            <code className="viz-mono">0 / 0</code> has no sensible answer, so JavaScript gives{' '}
            <strong>NaN</strong>.
          </>
        ) : (
          <>
            Dividing by zero doesn’t crash JavaScript. It gives <strong>Infinity</strong>, a special
            number. (Many other languages throw an error here.)
          </>
        )}
      </p>
    );
  return (
    <div className="jc-vis">
      <div className="jc-plates">
        {Array.from({ length: b }, (_, i) => (
          <div key={i} className="jc-plate jc-plate--value viz-mono">
            {show(result)}
          </div>
        ))}
      </div>
      <p className="viz-caption">
        {a} shared into {b} equal parts is <strong>{show(result)}</strong> each. Unlike{' '}
        <code className="viz-mono">%</code>, <code className="viz-mono">/</code> keeps the decimal
        part.
      </p>
    </div>
  );
}

function Dots({ n, tone, crossed = 0 }: { n: number; tone: 'a' | 'b'; crossed?: number }) {
  return (
    <div className="jc-dots" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={`jc-dot is-${tone} ${i >= n - crossed ? 'is-crossed' : ''}`} />
      ))}
    </div>
  );
}

/** A 12-hour clock: % 12 wraps around, and 0 is shown as 12. */
function Clock() {
  const [hour, setHour] = useState(10);
  const [last, setLast] = useState<{ from: number; n: number } | null>(null);
  // Total turns of the hand, so it always moves forward instead of spinning back.
  const [turn, setTurn] = useState(10 * 30);

  const add = (n: number) => {
    const raw = (hour + n) % 12;
    setLast({ from: hour, n });
    setHour(raw === 0 ? 12 : raw);
    setTurn((t) => t + n * 30);
  };

  const raw = last ? (last.from + last.n) % 12 : null;

  return (
    <div className="jc-clock-wrap">
      <div className="viz-label">Wrap around: a clock</div>
      <div className="jc-clock-row">
        <svg
          viewBox="0 0 120 120"
          className="jc-clock"
          role="img"
          aria-label={`The clock shows ${hour} o'clock`}
        >
          <circle cx="60" cy="60" r="54" className="jc-clock-face" />
          {Array.from({ length: 12 }, (_, i) => {
            const h = i + 1;
            const ang = (h * 30 * Math.PI) / 180;
            return (
              <text
                key={h}
                x={60 + 42 * Math.sin(ang)}
                y={60 - 42 * Math.cos(ang)}
                textAnchor="middle"
                dominantBaseline="central"
                className={`jc-clock-num ${h === hour ? 'is-on' : ''}`}
              >
                {h}
              </text>
            );
          })}
          <line
            x1="60"
            y1="60"
            x2="60"
            y2="26"
            className="jc-clock-hand"
            style={{ transform: `rotate(${turn}deg)` }}
          />
          <circle cx="60" cy="60" r="4" className="jc-clock-pin" />
        </svg>
        <div>
          <div className="jc-row">
            {[1, 5, 9].map((n) => (
              <button key={n} type="button" className="viz-btn" onClick={() => add(n)}>
                +{n} hours
              </button>
            ))}
          </div>
          <p className="jc-small" aria-live="polite">
            {last ? (
              <>
                <code className="viz-mono">
                  ({last.from} + {last.n}) % 12
                </code>{' '}
                = <strong className="viz-mono">{raw}</strong>
                {raw === 0 ? ', and a clock shows 0 as 12.' : `, so it’s ${hour} o’clock.`}
              </>
            ) : (
              <>
                It’s 10 o’clock. What time is it 5 hours later? Not 15:{' '}
                <code className="viz-mono">%</code> wraps it around.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
