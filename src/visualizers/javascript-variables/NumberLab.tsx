import { useId, useState } from 'react';
import { PresetTabs } from './parts';

/**
 * #6 Number surprises: decimal drift, weird results, the safe integer limit
 * and conversions. Every value on screen is computed live by real JavaScript.
 */

const TABS = [
  { id: 'drift', name: 'Decimal drift' },
  { id: 'weird', name: 'Weird results' },
  { id: 'safe', name: 'Safe limit' },
  { id: 'convert', name: 'Convert it' },
];

/** Show a value the way a console would. */
const show = (v: unknown) =>
  typeof v === 'string' ? JSON.stringify(v) : typeof v === 'bigint' ? `${v}n` : String(v);

export default function NumberLab() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Number surprises</p>
      <p className="viz-sub">
        Four small experiments. Every result is calculated live, right here.
      </p>
      <PresetTabs
        presets={TABS}
        label="Experiments"
        render={(t) =>
          t.id === 'drift' ? (
            <Drift />
          ) : t.id === 'weird' ? (
            <Weird />
          ) : t.id === 'safe' ? (
            <Safe />
          ) : (
            <Convert />
          )
        }
      />
    </div>
  );
}

function Drift() {
  const [adds, setAdds] = useState(0);
  const [fixed, setFixed] = useState(false);

  // Derived, not stored: add 0.1 `adds` times, exactly like a loop would.
  const history: { total: number; cents: number }[] = [];
  let total = 0;
  for (let k = 0; k < adds; k++) {
    total += 0.1;
    history.push({ total, cents: (k + 1) * 10 });
  }

  return (
    <div className="nl-panel">
      <div className="js-row-flex">
        <button
          type="button"
          className="viz-btn viz-btn--primary"
          onClick={() => setAdds((n) => n + 1)}
          disabled={adds >= 12}
        >
          + 0.1
        </button>
        <button type="button" className="viz-btn" onClick={() => setAdds(0)} disabled={adds === 0}>
          Reset
        </button>
        <label className="nl-toggle">
          <input type="checkbox" checked={fixed} onChange={(e) => setFixed(e.target.checked)} /> Fix
          it (count in cents)
        </label>
      </div>
      <ol className="nl-history viz-mono" aria-live="polite">
        {history.length === 0 && <li className="jv-muted">total = 0. Press + 0.1.</li>}
        {history.map((h, k) => {
          const exact = String(h.total);
          const drifted = h.total !== h.cents / 100; // not the number we meant
          return (
            <li key={k} className={drifted && !fixed ? 'is-drift' : ''}>
              {fixed ? (
                <>
                  {h.cents} cents / 100 → <strong>{(h.cents / 100).toFixed(2)}</strong>
                </>
              ) : (
                <>
                  total → <strong>{exact}</strong>
                  {drifted && (
                    <span className="nl-flag"> not exactly {(h.cents / 100).toFixed(1)}</span>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ol>
      <p className="jv-muted">
        {fixed
          ? 'Whole numbers are stored exactly, so count money in cents (or paise), and only format with toFixed(2) when you show it.'
          : 'Computers store numbers in binary, and 0.1 has no exact binary form, just as 1/3 has no exact decimal form.'}
      </p>
    </div>
  );
}

const WEIRD: { code: string; run: () => unknown; note: string }[] = [
  { code: '1 / 0', run: () => 1 / 0, note: 'Dividing by zero gives Infinity, not an error.' },
  { code: '-1 / 0', run: () => -1 / 0, note: 'And there is a negative Infinity too.' },
  {
    code: '"chai" * 2',
    run: () => Number('chai') * 2,
    note: 'Maths on text that is not a number gives NaN.',
  },
  { code: 'typeof NaN', run: () => typeof NaN, note: '“Not a Number” is… a number.' },
  {
    code: 'NaN === NaN',
    // eslint-disable-next-line use-isnan -- comparing NaN to itself is exactly the lesson
    run: () => Number.NaN === Number.NaN,
    note: 'NaN is not equal to anything, even itself.',
  },
  {
    code: 'Number.isNaN(NaN)',
    run: () => Number.isNaN(NaN),
    note: 'This is how you check for NaN.',
  },
];

function Weird() {
  const [shown, setShown] = useState<Set<number>>(() => new Set());
  return (
    <div className="nl-weird">
      {WEIRD.map((w, i) => {
        const open = shown.has(i);
        return (
          <button
            key={w.code}
            type="button"
            className={`nl-card ${open ? 'is-open' : ''}`}
            aria-expanded={open}
            onClick={() => setShown((s) => new Set(s).add(i))}
          >
            <code className="viz-mono">{w.code}</code>
            {open ? (
              <span className="viz-fade">
                <strong className="viz-mono nl-result">→ {show(w.run())}</strong>
                <span className="jv-muted nl-note">{w.note}</span>
              </span>
            ) : (
              <span className="jv-muted nl-note">Guess, then tap to reveal</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Safe() {
  const MAX = Number.MAX_SAFE_INTEGER; // 9007199254740991
  const [num, setNum] = useState(MAX);
  const [big, setBig] = useState(BigInt(MAX));
  const [useBig, setUseBig] = useState(false);
  const step = (d: 1 | -1) => {
    setNum((n) => n + d);
    setBig((b) => b + BigInt(d));
  };
  const reset = () => {
    setNum(MAX);
    setBig(BigInt(MAX));
  };
  const past = big > BigInt(MAX);
  const stuck = BigInt(num) !== big;

  // Mixing BigInt and number throws. Show the real error, live.
  let mixError = '';
  try {
    // @ts-expect-error: deliberately mixing types to show the real error
    void (big + 1);
  } catch (e) {
    mixError = `${(e as Error).name}: ${(e as Error).message}`;
  }

  return (
    <div className="nl-panel">
      <div className="js-row-flex">
        <button type="button" className="viz-btn" onClick={() => step(-1)}>
          − 1
        </button>
        <button type="button" className="viz-btn viz-btn--primary" onClick={() => step(1)}>
          + 1
        </button>
        <button type="button" className="viz-btn" onClick={reset}>
          Reset
        </button>
        <label className="nl-toggle">
          <input type="checkbox" checked={useBig} onChange={(e) => setUseBig(e.target.checked)} />{' '}
          Use BigInt
        </label>
      </div>

      <div className={`nl-big viz-mono ${!useBig && stuck ? 'is-stuck' : ''}`} aria-live="polite">
        {useBig ? `${big}n` : String(num)}
      </div>
      <div className="nl-cliff" aria-hidden="true">
        <span className={`nl-cliff-bar ${past && !useBig ? 'is-past' : ''}`} />
        <span className="nl-cliff-label viz-mono">safe limit 9007199254740991</span>
      </div>
      <p className="jv-muted">
        {useBig
          ? 'BigInt counts exactly, however big it gets. Write it with an n on the end.'
          : stuck
            ? 'Stuck! Past the safe limit, a number can’t store every whole number exactly, so +1 can land on the same value.'
            : past
              ? 'Past the safe limit. Keep pressing + 1 and watch.'
              : 'Up to Number.MAX_SAFE_INTEGER, every whole number is exact. Press + 1 twice.'}
      </p>
      {useBig && (
        <p className="nl-mix viz-mono">
          {`${big}n + 1`} → <span className="jv-false">{mixError}</span>
        </p>
      )}
    </div>
  );
}

const CONVERT_PRESETS = ['"42"', '"42px"', '"3.14abc"', '""', '"  7  "', '"chai"'];

function Convert() {
  const [x, setX] = useState('42px');
  const id = useId();
  const rows: [string, unknown][] = [
    ['Number(x)', Number(x)],
    ['parseInt(x)', parseInt(x)],
    ['parseFloat(x)', parseFloat(x)],
  ];
  return (
    <div className="nl-panel">
      <div className="sb-input">
        <label htmlFor={`${id}-x`} className="viz-label" style={{ margin: 0 }}>
          x =
        </label>
        <input
          id={`${id}-x`}
          value={x}
          maxLength={20}
          onChange={(e) => setX(e.target.value)}
          spellCheck={false}
        />
      </div>
      <div className="js-row-flex" role="group" aria-label="Try these">
        {CONVERT_PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            className="viz-btn viz-mono"
            onClick={() => setX(JSON.parse(p))}
          >
            {p}
          </button>
        ))}
      </div>
      <table className="nl-table viz-mono">
        <tbody>
          {rows.map(([code, v]) => (
            <tr key={code}>
              <th scope="row">{code.replace('x', JSON.stringify(x))}</th>
              <td className={Number.isNaN(v) ? 'jv-false' : ''}>{show(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="jv-muted">
        Number() wants the whole text to be a number. parseInt and parseFloat read from the start
        and stop at the first character they can’t use.
      </p>
    </div>
  );
}
