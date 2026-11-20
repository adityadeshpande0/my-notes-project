import { useState } from 'react';
import { alpha, C } from '../core/colors';

/**
 * 8 clickable bits → decimal value. Each bit is a little "wire" that is
 * either at high voltage (1, glowing) or low voltage (0, dark).
 */

const WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1];
const PRESETS = [
  { label: '5', value: 5 },
  { label: '3', value: 3 },
  { label: '8', value: 8 },
  { label: "'A' (65)", value: 65 },
  { label: '255', value: 255 },
];

export default function BinaryBits() {
  const [value, setValue] = useState(5);
  const bits = WEIGHTS.map((w) => (value & w ? 1 : 0));
  // XOR with the weight flips just that one bit.
  const flip = (w: number) => setValue((v) => v ^ w);
  const parts = WEIGHTS.filter((w) => value & w);

  return (
    <div className="viz not-prose">
      <p className="viz-title">Bits: numbers made of on/off switches</p>
      <p className="viz-sub">
        Click any bit to flip it. Each position is worth double the one to its right.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 6 }}>
        {bits.map((b, i) => {
          const w = WEIGHTS[i];
          return (
            <button
              type="button"
              key={w}
              onClick={() => flip(w)}
              aria-label={`Bit worth ${w}, currently ${b}`}
              aria-pressed={b === 1}
              className="viz-btn"
              style={{
                padding: '10px 0 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                background: b ? alpha(C.active, 14) : C.surface,
                borderColor: b ? C.active : C.border,
                boxShadow: b
                  ? `0 0 16px ${alpha(C.active, 30)}, inset 0 0 12px ${alpha(C.active, 15)}`
                  : 'none',
                transition: 'all .2s',
              }}
            >
              {/* A tiny "voltage" bar: tall and lit for 1, flat and dark for 0 */}
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 18,
                  borderRadius: 3,
                  background: b ? C.active : C.border,
                  transform: b ? 'scaleY(1)' : 'scaleY(.25)',
                  transformOrigin: 'bottom',
                  transition: 'all .2s',
                }}
              />
              <span
                className="viz-mono"
                style={{ fontSize: 22, fontWeight: 700, color: b ? C.active : C.muted }}
              >
                {b}
              </span>
              <span className="viz-mono" style={{ fontSize: 11, color: C.muted }}>
                {w}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="viz-caption"
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 12 }}
      >
        <span className="viz-mono" style={{ fontSize: 20, letterSpacing: 2 }}>
          {bits.join('')}
        </span>
        <span style={{ color: C.muted }}>=</span>
        <span className="viz-mono" style={{ color: C.muted }}>
          {parts.length ? parts.join(' + ') : '0'}
        </span>
        <span style={{ color: C.muted }}>=</span>
        <strong style={{ fontSize: 24 }}>{value}</strong>
      </div>

      <div className="viz-controls">
        <span className="viz-sub" style={{ margin: 0 }}>
          Try:
        </span>
        {PRESETS.map((p) => (
          <button
            type="button"
            key={p.label}
            className="viz-btn"
            aria-pressed={value === p.value}
            onClick={() => setValue(p.value)}
          >
            {p.label}
          </button>
        ))}
        <button type="button" className="viz-btn" onClick={() => setValue(0)}>
          Clear
        </button>
      </div>
    </div>
  );
}
