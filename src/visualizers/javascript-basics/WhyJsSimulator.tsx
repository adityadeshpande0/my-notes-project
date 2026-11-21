import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useReducedMotion } from '../../lib/hooks';
import { alpha, C } from '../core/colors';

/**
 * The same sign-up form, in 1995 (every check is a slow trip to the server)
 * and with JavaScript (checked instantly in the browser). Nothing here touches
 * the network: the "server" is a timer.
 */

/** One way over the dial-up line, in ms. Fixed, so the wait is predictable. */
const TRIP_MS = 3000;
/** Time the pretend server spends checking the form. */
const SERVER_MS = 600;
const TICK_MS = 120; // how often the counter updates (choppy on purpose: it's dial-up)

const START = { name: 'Riya', email: 'riya.gmail.com', password: 'chai1234' };
type Fields = typeof START;

type Phase = 'idle' | 'sending' | 'checking' | 'returning' | 'done';

function problems(f: Fields): Partial<Record<keyof Fields, string>> {
  const out: Partial<Record<keyof Fields, string>> = {};
  if (!f.name.trim()) out.name = 'Please enter your name';
  if (!f.email.includes('@')) out.email = 'Email needs an @';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) out.email = 'That email looks incomplete';
  if (f.password.length < 6) out.password = 'At least 6 characters';
  return out;
}

interface Stats {
  trips: number;
  waited: number; // ms
  retyped: number;
}
const NO_STATS: Stats = { trips: 0, waited: 0, retyped: 0 };

export default function WhyJsSimulator() {
  const [mode, setMode] = useState<'old' | 'js'>('old');
  const [fields, setFields] = useState<Fields>(START);
  // The request that's "on the wire" (null when nothing is). We decide at Submit
  // time whether the server will reject it; the fields are locked meanwhile.
  const [flight, setFlight] = useState<{ failed: boolean } | null>(null);
  const [elapsed, setElapsed] = useState(0); // ms since Submit
  const [banner, setBanner] = useState<'error' | 'ok' | null>(null);
  const [stats, setStats] = useState<Record<'old' | 'js', Stats>>({ old: NO_STATS, js: NO_STATS });
  const reduced = useReducedMotion();

  const errors = problems(fields);
  const valid = Object.keys(errors).length === 0;
  const total = TRIP_MS * 2 + SERVER_MS;

  // The phase isn't stored: it's worked out from the elapsed time on every render.
  // Deriving values like this keeps state small and impossible to get out of sync.
  const phase: Phase = !flight
    ? banner
      ? 'done'
      : 'idle'
    : elapsed < TRIP_MS
      ? 'sending'
      : elapsed < TRIP_MS + SERVER_MS
        ? 'checking'
        : 'returning';
  const inFlight = flight !== null;

  // The server's reply lands. useCallback with [] keeps the same function between
  // renders (it only uses state setters, which never change).
  const land = useCallback((failed: boolean) => {
    setFlight(null);
    setStats((s) => ({
      ...s,
      old: {
        trips: s.old.trips + 1,
        waited: s.old.waited + TRIP_MS * 2 + SERVER_MS,
        retyped: s.old.retyped + (failed ? 1 : 0),
      },
    }));
    if (failed) {
      // 1995: the server sends back a brand-new, empty page.
      setFields({ name: '', email: '', password: '' });
      setBanner('error');
    } else setBanner('ok');
  }, []);

  // While a request is in flight: tick the counter, and land it when time is up.
  // The cleanup cancels both timers if the reader skips, switches mode or leaves.
  useEffect(() => {
    if (!flight) return;
    const tick = window.setInterval(() => setElapsed((t) => t + TICK_MS), TICK_MS);
    const done = window.setTimeout(() => land(flight.failed), total);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(done);
    };
  }, [flight, total, land]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'js') {
      if (!valid) return;
      setBanner('ok');
      setStats((s) => ({ ...s, js: { ...s.js, trips: s.js.trips + 1 } }));
      return;
    }
    setBanner(null);
    setElapsed(0);
    setFlight({ failed: !valid });
  };

  const switchMode = (m: 'old' | 'js') => {
    setMode(m);
    setFields(START);
    setFlight(null);
    setElapsed(0);
    setBanner(null);
  };

  const field = (key: keyof Fields, label: string, type = 'text') => {
    const err = mode === 'js' ? errors[key] : undefined;
    return (
      <label className="wj-field">
        <span>{label}</span>
        <input
          type={type}
          value={fields[key]}
          disabled={inFlight}
          aria-invalid={!!err}
          aria-describedby={err ? `wj-${key}-err` : undefined}
          onChange={(e) => {
            setFields({ ...fields, [key]: e.target.value });
            if (banner === 'ok') setBanner(null);
          }}
        />
        {err && (
          <span id={`wj-${key}-err`} className="wj-err">
            ✗ {err}
          </span>
        )}
      </label>
    );
  };

  return (
    <div className="viz not-prose">
      <p className="viz-title">Life before and after JavaScript</p>
      <p className="viz-sub">
        The email has a mistake on purpose. Submit it in 1995, then switch to JavaScript.
      </p>

      <div className="viz-seg" role="group" aria-label="Choose an era">
        <button
          type="button"
          className="viz-seg-btn"
          aria-pressed={mode === 'old'}
          onClick={() => switchMode('old')}
        >
          1995: no JS
        </button>
        <button
          type="button"
          className="viz-seg-btn"
          aria-pressed={mode === 'js'}
          onClick={() => switchMode('js')}
        >
          Today: with JS
        </button>
      </div>

      <div className="wj-grid">
        <form className="wj-form" onSubmit={submit} noValidate>
          {banner === 'error' && (
            <p className="wj-banner wj-banner--err viz-fade" role="alert">
              Error: invalid email. Please fill in the form again.
            </p>
          )}
          {banner === 'ok' && (
            <p className="wj-banner wj-banner--ok viz-fade" role="status">
              ✓ Account created.{' '}
              {mode === 'js'
                ? 'Sent once, already correct.'
                : `After ${(total / 1000).toFixed(1)} s of waiting.`}
            </p>
          )}
          {field('name', 'Name')}
          {field('email', 'Email', 'email')}
          {field('password', 'Password', 'password')}
          <div className="js-row">
            <button
              type="submit"
              className="viz-btn viz-btn--primary"
              disabled={inFlight || (mode === 'js' && !valid)}
            >
              Submit
            </button>
            {inFlight && (
              <button
                type="button"
                className="viz-btn"
                onClick={() => flight && land(flight.failed)}
              >
                Skip wait
              </button>
            )}
          </div>
        </form>

        <Network mode={mode} phase={phase} elapsed={elapsed} reduced={reduced} />
      </div>

      <div className="viz-caption" aria-live="polite">
        {mode === 'js'
          ? valid
            ? 'Everything checks out, so Submit is enabled. The form only goes to the server once it is already right.'
            : 'Checked instantly, right in your browser. 0 trips to the server.'
          : phase === 'sending'
            ? 'Your whole form is crawling to the server over a dial-up modem…'
            : phase === 'checking'
              ? 'The server reads the form and finds the mistake.'
              : phase === 'returning'
                ? 'Now a whole new page crawls back to you…'
                : banner === 'error'
                  ? 'All that waiting, and the form came back empty. Type everything again!'
                  : 'In 1995 the browser could not check anything. Press Submit and wait.'}
      </div>

      <table className="wj-stats">
        <caption className="viz-label">Results so far</caption>
        <thead>
          <tr>
            <th scope="col" />
            <th scope="col">Trips</th>
            <th scope="col">Waited</th>
            <th scope="col">Retyped</th>
          </tr>
        </thead>
        <tbody>
          {(['old', 'js'] as const).map((m) => (
            <tr key={m}>
              <th scope="row">{m === 'old' ? '1995' : 'With JS'}</th>
              <td className="viz-mono">{stats[m].trips}</td>
              <td className="viz-mono" style={{ color: stats[m].waited ? C.danger : undefined }}>
                {(stats[m].waited / 1000).toFixed(1)} s
              </td>
              <td className="viz-mono">{stats[m].retyped}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Your computer, a wavy dial-up line, and the far-away server. */
function Network({
  mode,
  phase,
  elapsed,
  reduced,
}: {
  mode: 'old' | 'js';
  phase: Phase;
  elapsed: number;
  reduced: boolean;
}) {
  const W = 280;
  const x0 = 50;
  const x1 = W - 50;
  const wave = (p: number) => ({ x: x0 + p * (x1 - x0), y: 60 + 9 * Math.sin(p * Math.PI * 6) });
  const points = Array.from({ length: 61 }, (_, i) => wave(i / 60))
    .map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
    .join(' ');

  // Where the data packet is on the line (0 = your computer, 1 = server).
  let p: number | null = null;
  if (phase === 'sending') p = elapsed / TRIP_MS;
  else if (phase === 'checking') p = 1;
  else if (phase === 'returning') p = 1 - (elapsed - TRIP_MS - SERVER_MS) / TRIP_MS;
  const pkt = p === null ? null : wave(Math.min(1, Math.max(0, p)));
  const busy = phase !== 'idle' && phase !== 'done';
  const color = phase === 'returning' ? C.danger : C.warn;

  return (
    <div className="viz-panel wj-net" aria-label="Network">
      <svg
        viewBox={`0 0 ${W} 130`}
        role="img"
        aria-label={
          busy ? `Waiting on the server: ${(elapsed / 1000).toFixed(1)} seconds` : 'Network idle'
        }
      >
        <polyline
          points={points}
          fill="none"
          strokeWidth={2}
          strokeDasharray={mode === 'js' ? '3 6' : undefined}
          style={{ stroke: busy ? alpha(C.warn, 70) : C.border }}
        />
        <text x={x0} y={68} textAnchor="middle" fontSize={30}>
          💻
        </text>
        <text x={x1} y={68} textAnchor="middle" fontSize={30}>
          🖥️
        </text>
        <text x={x0} y={100} textAnchor="middle" fontSize={14} style={{ fill: C.muted }}>
          your computer
        </text>
        <text x={x1} y={100} textAnchor="middle" fontSize={14} style={{ fill: C.muted }}>
          server
        </text>
        {pkt && !reduced && (
          <circle
            cx={pkt.x}
            cy={pkt.y}
            r={7}
            style={{ fill: color, filter: `drop-shadow(0 0 5px ${alpha(color, 70)})` }}
          />
        )}
        {phase === 'checking' && (
          <text x={x1} y={28} textAnchor="middle" fontSize={14} style={{ fill: C.warn }}>
            checking…
          </text>
        )}
      </svg>
      <p className="wj-net-status viz-mono">
        {mode === 'js' ? (
          <span style={{ color: C.active }}>line quiet: checks happen in the browser</span>
        ) : busy ? (
          <>
            <span aria-hidden="true">📞 </span>dial-up noises… {(elapsed / 1000).toFixed(1)} s
          </>
        ) : (
          <span style={{ color: C.muted }}>line idle</span>
        )}
      </p>
    </div>
  );
}
