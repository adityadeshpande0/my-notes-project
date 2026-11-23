import { useState } from 'react';
import { makeChai } from './lib/realFunctions';

/**
 * #1 Build it once, use it many times. The machine starts as a blueprint:
 * declaring the function builds it (and prints nothing). Only pressing CALL
 * runs it. Every message comes from the article's real makeChai.
 */
type Milk = 'no' | 'half' | 'full';
const MILKS: Milk[] = ['no', 'half', 'full'];

interface Call {
  sugar: number;
  milk: Milk;
}

export default function FunctionMachine() {
  const [declared, setDeclared] = useState(false);
  const [sugar, setSugar] = useState(2);
  const [milk, setMilk] = useState<Milk>('full');
  const [calls, setCalls] = useState<Call[]>([]);
  const last = calls[calls.length - 1];

  const call = () => setCalls((cs) => [...cs, { sugar, milk }]);

  return (
    <div className="viz not-prose">
      <p className="viz-title">Build it once, use it many times</p>
      <p className="viz-sub">First declare the function, then call it as often as you like.</p>

      <div className="jf-split">
        <div className="viz-panel">
          <div className="viz-label">Code</div>
          <pre className={`vc-code viz-mono jf-decl ${declared ? 'is-declared' : ''}`}>
            <div className="vc-line">
              <span>function makeChai(sugar, milk) {'{'}</span>
            </div>
            <div className="vc-line">
              <span>
                {'  '}console.log("Chai with " + sugar + " spoons of sugar and " + milk + " milk");
              </span>
            </div>
            <div className="vc-line">
              <span>{'}'}</span>
            </div>
          </pre>
          {calls.length > 0 && (
            <pre className="vc-code viz-mono jf-calls" aria-label="Calls">
              {calls.slice(-5).map((c, k, shown) => (
                <div
                  key={calls.length - shown.length + k}
                  className={`vc-line ${k === shown.length - 1 ? 'is-on' : ''}`}
                >
                  <span>
                    makeChai({c.sugar}, "{c.milk}");
                  </span>
                </div>
              ))}
            </pre>
          )}
          <div className="viz-panel vc-console jf-console" aria-label="Console">
            <div className="viz-label">Console</div>
            <div className="viz-mono">
              {calls.length === 0 && <span className="vc-muted">(empty: nothing has run yet)</span>}
              {calls.slice(-4).map((c, k) => (
                <div key={`${calls.length}-${k}`} className="vc-out">
                  <span aria-hidden="true">›</span> {makeChai(c.sugar, c.milk)}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="jf-machine-col">
          <div className="jf-funnels">
            <label className="jf-funnel">
              <span className="viz-mono">sugar</span>
              <select
                className="jf-input"
                value={sugar}
                onChange={(e) => setSugar(Number(e.target.value))}
              >
                {[0, 1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="jf-funnel">
              <span className="viz-mono">milk</span>
              <select
                className="jf-input"
                value={milk}
                onChange={(e) => setMilk(e.target.value as Milk)}
              >
                {MILKS.map((m) => (
                  <option key={m} value={m}>
                    "{m}"
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="jf-stage">
            <Machine declared={declared} shakeKey={calls.length} last={last} />
          </div>
          <div className="jf-row jf-center">
            {!declared ? (
              <button
                type="button"
                className="viz-btn viz-btn--primary"
                onClick={() => setDeclared(true)}
              >
                Declare the function
              </button>
            ) : null}
            <button
              type="button"
              className="jf-call"
              onClick={call}
              disabled={!declared}
              title={
                declared
                  ? 'Run makeChai with these arguments'
                  : 'Declare the function first: there is no machine to run yet'
              }
              aria-describedby="jf-call-help"
            >
              CALL
            </button>
          </div>
          <p id="jf-call-help" className="jf-small jf-muted jf-center-text">
            {declared
              ? `Calls makeChai(${sugar}, "${milk}")`
              : 'CALL is off until the function is declared.'}
          </p>
        </div>
      </div>

      <div className="jf-row jf-gap">
        <span className="viz-counter">
          Declared: <strong className="viz-mono">{declared ? 1 : 0}</strong> time
          {declared ? '' : 's'}
        </span>
        <span className="viz-counter">
          Called:{' '}
          <strong key={calls.length} className="viz-counter-n viz-mono">
            {calls.length}
          </strong>{' '}
          time
          {calls.length === 1 ? '' : 's'}
        </span>
      </div>
      <p className="viz-caption" aria-live="polite">
        {!declared
          ? 'This is only a blueprint. Declare the function to build the machine.'
          : calls.length === 0
            ? 'The recipe is written. Nothing has been cooked yet: the console is still empty!'
            : calls.length >= 5
              ? `Written once, used ${calls.length} times: that's the point of functions.`
              : `${makeChai(last.sugar, last.milk)}. Change the arguments and call it again.`}
      </p>
    </div>
  );
}

/** The machine (SVG). A blueprint until declared; it shakes and pours on every call. */
function Machine({
  declared,
  shakeKey,
  last,
}: {
  declared: boolean;
  shakeKey: number;
  last?: Call;
}) {
  return (
    <svg
      viewBox="0 0 220 230"
      className={`jf-machine ${declared ? 'is-built' : 'is-blueprint'}`}
      role="img"
      aria-label={
        !declared
          ? 'A blueprint of the makeChai machine'
          : last
            ? `The machine poured: ${makeChai(last.sugar, last.milk)}`
            : 'The makeChai machine, ready to be called'
      }
    >
      <g key={shakeKey} className={shakeKey > 0 ? 'jf-shake' : undefined}>
        {/* funnels */}
        <path d="M45 10 h40 l-12 26 h-16 z" className="jf-metal" />
        <path d="M135 10 h40 l-12 26 h-16 z" className="jf-metal" />
        {last && (
          <g key={shakeKey} className="jf-drop">
            <text x="65" y="26" textAnchor="middle" className="jf-arg">
              {last.sugar}
            </text>
            <text x="155" y="26" textAnchor="middle" className="jf-arg">
              "{last.milk}"
            </text>
          </g>
        )}
        {/* body */}
        <rect x="25" y="36" width="170" height="104" rx="14" className="jf-metal" />
        <rect x="55" y="50" width="110" height="26" rx="6" className="jf-plate" />
        <text
          x="110"
          y="64"
          textAnchor="middle"
          dominantBaseline="central"
          className="jf-nameplate"
        >
          makeChai
        </text>
        <circle cx="70" cy="110" r="10" className="jf-light" />
        <circle cx="150" cy="110" r="10" className="jf-light" />
        {/* spout */}
        <rect x="100" y="140" width="20" height="18" className="jf-metal" />
      </g>
      {last && <Cup key={shakeKey} sugar={last.sugar} milk={last.milk} />}
    </svg>
  );
}

function Cup({ sugar, milk }: Call) {
  return (
    <g className="jf-cup-in">
      <path d="M80 170 h60 l-6 50 h-48 z" className="jf-cup" />
      <path d={`M82 ${180} h56 l-5 38 h-46 z`} className={`jf-chai is-${milk}`} />
      {Array.from({ length: sugar }, (_, k) => (
        <rect
          key={k}
          x={150 + (k % 2) * 13}
          y={182 + Math.floor(k / 2) * 13}
          width="10"
          height="10"
          rx="2"
          className="jf-sugar"
        />
      ))}
    </g>
  );
}
