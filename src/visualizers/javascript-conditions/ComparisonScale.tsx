import { useId, useState } from 'react';
import { CMP_OPS, compare, explain, tilt, type CmpOp } from './lib/compare';
import { show, typeName } from './lib/format';
import { BoolBadge } from './parts';

/**
 * #2 The balance scale. Put a value in each pan and press an operator.
 * The true/false answer comes from the real operator; the beam tips toward
 * whichever side JavaScript thinks is bigger, and a strip explains how it
 * compared (strings letter by letter, numbers after conversion…).
 */

const PRESETS: { label: string; value: unknown }[] = [
  5,
  '5',
  10,
  '10',
  '9',
  'apple',
  'banana',
  'Apple',
  0,
  '',
  null,
  undefined,
  true,
  NaN,
].map((value) => ({ label: show(value), value }));

type OwnType = 'number' | 'string' | 'boolean';
interface Pan {
  /** Index into PRESETS, or -1 for "your own value". */
  preset: number;
  text: string;
  type: OwnType;
}

const panValue = (p: Pan): unknown => {
  if (p.preset >= 0) return PRESETS[p.preset].value;
  if (p.type === 'number') return Number(p.text);
  if (p.type === 'boolean') return p.text.trim() === 'true';
  return p.text;
};
const presetPan = (value: unknown): Pan => ({
  preset: PRESETS.findIndex((p) => Object.is(p.value, value)),
  text: '',
  type: 'string',
});

const SURPRISES: { left: unknown; op: CmpOp; right: unknown; note: string }[] = [
  { left: '10', op: '<', right: '9', note: 'strings' },
  { left: 'apple', op: '<', right: 'banana', note: 'alphabetical' },
  { left: 'Apple', op: '<', right: 'apple', note: 'capitals first' },
  { left: null, op: '>=', right: 0, note: 'true!' },
  { left: null, op: '==', right: 0, note: 'false!' },
  { left: NaN, op: '===', right: NaN, note: 'never equal' },
];

export default function ComparisonScale() {
  const [left, setLeft] = useState<Pan>(presetPan('10'));
  const [right, setRight] = useState<Pan>(presetPan('9'));
  const [op, setOp] = useState<CmpOp>('<');

  const a = panValue(left);
  const b = panValue(right);
  const result = compare(a, op, b);
  const ex = explain(a, op, b);
  const isEquality = op === '===' || op === '!==' || op === '==';
  // Equality keeps the beam level; < > <= >= tip it toward the bigger side.
  const lean = isEquality ? 0 : tilt(a, b);
  const angle = lean * 12; // clamped to ±12° so it always looks sensible
  const glow = isEquality ? (result ? 'is-true' : 'is-false') : '';

  return (
    <div className="viz not-prose">
      <p className="viz-title">The balance scale</p>
      <p className="viz-sub">Put a value in each pan, then press an operator to weigh them.</p>

      <div className="jc-pans">
        <PanPicker label="Left pan" pan={left} onChange={setLeft} />
        <PanPicker label="Right pan" pan={right} onChange={setRight} />
      </div>

      <div className="jc-scale-stage" style={{ transform: `rotateY(${lean * 6}deg)` }}>
        <svg viewBox="0 0 320 190" role="img" aria-label={scaleLabel(a, b, lean, isEquality)}>
          <path className="jc-scale-post" d="M160 46 V168 M120 172 H200" />
          <g
            className="jc-scale-pan"
            style={{ transform: `translateY(${-100 * Math.sin((angle * Math.PI) / 180)}px)` }}
          >
            <PanShape x={60} value={a} />
          </g>
          <g
            className="jc-scale-pan"
            style={{ transform: `translateY(${100 * Math.sin((angle * Math.PI) / 180)}px)` }}
          >
            <PanShape x={260} value={b} />
          </g>
          <g className={`jc-scale-beam ${glow}`} style={{ transform: `rotate(${angle}deg)` }}>
            <rect x="56" y="43" width="208" height="7" rx="3.5" />
          </g>
          <circle cx="160" cy="46" r="7" className="jc-scale-pivot" />
        </svg>
      </div>

      <div className="viz-seg jc-cmp-ops" role="group" aria-label="Operator">
        {CMP_OPS.map((o) => (
          <button
            key={o}
            type="button"
            className="viz-seg-btn viz-mono"
            aria-pressed={op === o}
            onClick={() => setOp(o)}
          >
            {o}
          </button>
        ))}
      </div>

      <div className="jc-result viz-mono" aria-live="polite">
        {show(a)} {op} {show(b)} <span className="jc-arrow">→</span> <BoolBadge value={result} />
      </div>

      <div className="viz-caption">
        {ex.strings && <StringDiff {...ex.strings} />}
        <span>{ex.text}</span>
        {op === '==' && (
          <span className="jc-muted jc-small">
            {' '}
            Compare: with === it’s {String(compare(a, '===', b))}.
          </span>
        )}
      </div>

      <div className="viz-label jc-gap">Surprises: click to load</div>
      <div className="viz-choices">
        {SURPRISES.map((s, i) => (
          <button
            key={i}
            type="button"
            className="viz-btn"
            onClick={() => {
              setLeft(presetPan(s.left));
              setRight(presetPan(s.right));
              setOp(s.op);
            }}
          >
            <code className="viz-mono">
              {show(s.left)} {s.op} {show(s.right)}
            </code>
            <span className="jc-muted jc-small"> · {s.note}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function scaleLabel(a: unknown, b: unknown, lean: number, isEquality: boolean) {
  if (isEquality) return `The scale stays level with ${show(a)} and ${show(b)}.`;
  if (lean < 0) return `The scale tips left: ${show(a)} is bigger.`;
  if (lean > 0) return `The scale tips right: ${show(b)} is bigger.`;
  return 'The scale stays level: neither side is bigger.';
}

function PanShape({ x, value }: { x: number; value: unknown }) {
  const label = show(value);
  return (
    <>
      <path className="jc-scale-string" d={`M${x} 50 L${x - 34} 108 M${x} 50 L${x + 34} 108`} />
      <path
        className="jc-scale-dish"
        d={`M${x - 46} 108 H${x + 46} Q${x + 40} 132 ${x} 132 Q${x - 40} 132 ${x - 46} 108 Z`}
      />
      <text x={x} y={96} textAnchor="middle" className="jc-scale-value">
        {label.length > 10 ? label.slice(0, 9) + '…' : label}
      </text>
      <text x={x} y={150} textAnchor="middle" className="jc-scale-type">
        {typeName(value)}
      </text>
    </>
  );
}

/** Two strings as letter boxes, with the deciding position highlighted. */
function StringDiff({ a, b, index }: { a: string; b: string; index: number }) {
  const row = (s: string) => (
    <div className="jc-chars viz-mono">
      {[...s].map((c, i) => (
        <span
          key={i}
          className={`jc-char ${i < index ? 'is-same' : i === index ? 'is-decide' : ''}`}
        >
          {c === ' ' ? '␣' : c}
        </span>
      ))}
      {index >= s.length && <span className="jc-char is-decide is-end">end</span>}
    </div>
  );
  return (
    <div className="jc-strdiff" aria-hidden="true">
      {row(a)}
      {row(b)}
    </div>
  );
}

function PanPicker({
  label,
  pan,
  onChange,
}: {
  label: string;
  pan: Pan;
  onChange: (p: Pan) => void;
}) {
  const id = useId(); // a unique id, so the <label> can point at its <select>
  return (
    <div className="jc-panpick">
      <label className="viz-label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="jc-select viz-mono"
        value={pan.preset}
        onChange={(e) => onChange({ ...pan, preset: Number(e.target.value) })}
      >
        {PRESETS.map((p, i) => (
          <option key={i} value={i}>
            {p.label}
          </option>
        ))}
        <option value={-1}>Your own…</option>
      </select>
      {pan.preset < 0 && (
        <div className="jc-own">
          <input
            className="jc-input viz-mono"
            value={pan.text}
            placeholder="type a value"
            aria-label={`${label}: your value`}
            onChange={(e) => onChange({ ...pan, text: e.target.value })}
          />
          <select
            className="jc-select"
            value={pan.type}
            aria-label={`${label}: type`}
            onChange={(e) => onChange({ ...pan, type: e.target.value as OwnType })}
          >
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
          </select>
        </div>
      )}
    </div>
  );
}
