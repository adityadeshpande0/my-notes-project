import { useState } from 'react';

/**
 * #1 Why loops? Drag the slider: the copy-paste version grows a line per
 * number, the loop stays 3 lines. Only a handful of lines are ever put on
 * the page (the rest is a "… and 988 more" footer), so a big number costs
 * nothing to draw.
 */
const SIZES = [1, 5, 10, 50, 100, 500, 1000];
const SHOWN = 12;
const fmt = (n: number) => n.toLocaleString('en-IN');

export default function CopyPasteVsLoop() {
  const [k, setK] = useState(1);
  const n = SIZES[k];
  const shown = Math.min(n, SHOWN);
  const more = n - shown;
  const scale = Math.max(n, 3); // the bars share one scale

  return (
    <div className="viz not-prose">
      <p className="viz-title">Why loops?</p>
      <p className="viz-sub">Print the numbers 1 to n, with and without a loop.</p>

      <label className="jl-slider">
        <span>
          How many numbers? <strong className="viz-mono">{fmt(n)}</strong>
        </span>
        <input
          type="range"
          min={0}
          max={SIZES.length - 1}
          value={k}
          onChange={(e) => setK(Number(e.target.value))}
          aria-valuetext={`${fmt(n)} numbers`}
        />
      </label>

      <div className="viz-grid-2 jl-gap">
        <div className="viz-panel">
          <div className="viz-label">Without a loop</div>
          <pre className="vc-code viz-mono jl-copy" aria-label={`${fmt(n)} lines of console.log`}>
            {Array.from({ length: shown }, (_, i) => (
              <div key={i}>console.log({i + 1});</div>
            ))}
            {more > 0 && <div className="jl-more">… and {fmt(more)} more lines</div>}
          </pre>
          <p className="jl-lines">
            <span aria-hidden="true">📄</span> <strong className="viz-mono">{fmt(n)}</strong> line
            {n === 1 ? '' : 's'} of code
          </p>
        </div>
        <div className="viz-panel">
          <div className="viz-label">With a loop</div>
          <pre className="vc-code viz-mono" aria-label="A three-line for loop">
            <div>
              for (let i = 1; i &lt;={' '}
              <span key={n} className="jl-bump">
                {n}
              </span>
              ; i++) {'{'}
            </div>
            <div>{'  '}console.log(i);</div>
            <div>{'}'}</div>
          </pre>
          <p className="jl-lines">
            <span aria-hidden="true">📄</span> <strong className="viz-mono">3</strong> lines of code
          </p>
        </div>
      </div>

      <div
        className="jl-bars"
        role="img"
        aria-label={`Lines of code: ${fmt(n)} without a loop, 3 with a loop.`}
      >
        <div className="jl-bar-row">
          <span className="jl-bar-name">Copy-paste</span>
          <span className="jl-bar is-copy" style={{ width: `${(n / scale) * 100}%` }} />
          <span className="viz-mono jl-bar-n">{fmt(n)}</span>
        </div>
        <div className="jl-bar-row">
          <span className="jl-bar-name">Loop</span>
          <span className="jl-bar is-loop" style={{ width: `${(3 / scale) * 100}%` }} />
          <span className="viz-mono jl-bar-n">3</span>
        </div>
      </div>

      <p className="viz-caption" aria-live="polite">
        {n === 1000
          ? 'Same result. One of these you could write before lunch.'
          : n < 3
            ? 'For a single number, copy-paste is actually shorter. Keep dragging.'
            : `Both print 1 to ${fmt(n)}. Only one of them grows.`}
      </p>
    </div>
  );
}
