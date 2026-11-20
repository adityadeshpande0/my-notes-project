import { useId, useState } from 'react';
import { alpha, C } from '../core/colors';
import { useReducedMotion } from '../../lib/hooks';

/**
 * A MOSFET in cross-section. Drag the gate voltage: past the threshold a
 * channel of electrons forms between source and drain, and current flows.
 */

const THRESHOLD = 0.4; // volts needed to form the channel
const MAX_V = 1;

export default function TransistorSwitch() {
  const [volts, setVolts] = useState(0);
  const reducedMotion = useReducedMotion();
  const sliderId = useId();
  const gradientId = useId(); // SVG ids must be unique on the page

  // 0 below the threshold, rising to 1 at full voltage.
  const strength = Math.max(0, Math.min(1, (volts - THRESHOLD) / (MAX_V - THRESHOLD)));
  const on = strength > 0;
  const attracted = Math.round((volts / MAX_V) * 10); // electrons gathering under the gate
  const travelSeconds = on ? 2.6 - strength * 1.6 : 0; // more voltage, faster current
  const flowing = on && !reducedMotion ? 7 : 0; // electrons animating across the channel

  let caption: string;
  if (volts === 0) {
    caption =
      'Gate at 0 V: there is no path between Source and Drain. The p-type silicon blocks electrons. The switch is OFF, which the computer reads as 0.';
  } else if (on) {
    caption = `Gate at ${volts.toFixed(2)} V, above the ${THRESHOLD} V threshold: a thin channel of electrons forms under the gate, joining Source to Drain. Current flows. The switch is ON, which is a 1.${strength > 0.8 ? ' Fully on.' : ''}`;
  } else {
    caption = `Gate at ${volts.toFixed(2)} V: the positive gate starts pulling electrons toward it, but not enough to form a channel yet (we need ${THRESHOLD} V). Still OFF.`;
  }

  return (
    <div className="viz not-prose">
      <p className="viz-title">Inside a transistor: a switch with no moving parts</p>
      <p className="viz-sub">
        Drag the gate voltage. Watch the channel appear and current start to flow.
      </p>

      <svg
        viewBox="0 0 640 320"
        role="img"
        aria-label={`Transistor ${on ? 'on' : 'off'}, gate voltage ${volts.toFixed(2)} volts`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" style={{ stopColor: C.surface }} />
            <stop offset="1" style={{ stopColor: C.elevated }} />
          </linearGradient>
        </defs>

        {/* Source to ground */}
        <path d="M175 150 V60 H60" className="wire" />
        <text x={40} y={50} fontSize={12} style={{ fill: C.muted }}>
          0 V (ground)
        </text>

        {/* Drain to the lamp and power */}
        <path
          d="M465 150 V60 H540"
          className={`wire ${on ? 'on flow' : ''}`}
          style={
            on
              ? { animationDuration: `${travelSeconds / 2}s`, animationDirection: 'reverse' }
              : undefined
          }
        />
        <circle
          cx={565}
          cy={60}
          r={22}
          strokeWidth={2.5}
          style={{
            fill: on ? alpha(C.warn, 15 + strength * 35) : C.bg,
            stroke: on ? C.warn : C.border,
            transition: 'all .3s',
            filter: on ? `drop-shadow(0 0 ${6 + strength * 14}px ${alpha(C.warn, 80)})` : 'none',
          }}
        />
        <path
          d="M550 45 L580 75 M580 45 L550 75"
          strokeWidth={2}
          style={{ stroke: on ? C.warn : C.border }}
        />
        <text x={565} y={104} textAnchor="middle" fontSize={11} style={{ fill: C.muted }}>
          lamp, to + power
        </text>

        {/* Gate terminal */}
        <path
          d="M320 120 V40"
          className={`wire ${volts > 0 ? 'on' : ''}`}
          style={{ stroke: volts > 0 ? alpha(C.accent, 40 + 60 * (volts / MAX_V)) : undefined }}
        />
        <text x={330} y={44} fontSize={13} fontWeight={600} style={{ fill: C.accent }}>
          Gate (G) {volts.toFixed(2)} V
        </text>

        {/* The silicon body */}
        <rect
          x={60}
          y={150}
          width={520}
          height={150}
          rx={8}
          style={{ fill: `url(#${gradientId})`, stroke: C.border }}
        />
        <text x={320} y={285} textAnchor="middle" fontSize={12} style={{ fill: C.muted }}>
          p-type silicon (few free electrons)
        </text>

        {/* Source and drain wells */}
        <rect
          x={110}
          y={150}
          width={130}
          height={70}
          rx={14}
          style={{ fill: alpha(C.accent, 14), stroke: alpha(C.accent, 55) }}
        />
        <rect
          x={400}
          y={150}
          width={130}
          height={70}
          rx={14}
          style={{ fill: alpha(C.accent, 14), stroke: alpha(C.accent, 55) }}
        />
        <text x={175} y={192} textAnchor="middle" fontSize={13} fontWeight={600}>
          Source
        </text>
        <text x={175} y={209} textAnchor="middle" fontSize={10.5} style={{ fill: C.muted }}>
          n-type (lots of e⁻)
        </text>
        <text x={465} y={192} textAnchor="middle" fontSize={13} fontWeight={600}>
          Drain
        </text>
        <text x={465} y={209} textAnchor="middle" fontSize={10.5} style={{ fill: C.muted }}>
          n-type (lots of e⁻)
        </text>

        {/* Gate plate and the thin insulator under it */}
        <rect
          x={240}
          y={118}
          width={160}
          height={20}
          rx={3}
          style={{
            fill: volts > 0 ? alpha(C.accent, 35 + 60 * (volts / MAX_V)) : C.border,
            stroke: C.accent,
            transition: 'fill .25s',
          }}
        />
        <rect x={240} y={138} width={160} height={10} style={{ fill: alpha(C.muted, 35) }} />
        <text x={410} y={146} fontSize={10} style={{ fill: C.muted }}>
          insulator
        </text>
        {volts > 0 &&
          Array.from({ length: 6 }, (_, i) => (
            <text
              key={i}
              x={252 + i * 27}
              y={133}
              fontSize={12}
              fontWeight={700}
              style={{ fill: C.bg }}
            >
              +
            </text>
          ))}

        {/* The channel: fades in once we pass the threshold */}
        <rect
          x={240}
          y={150}
          width={160}
          height={16}
          style={{ fill: C.active, opacity: strength * 0.45, transition: 'opacity .3s' }}
        />

        {/* Electrons pulled up toward the gate */}
        {Array.from({ length: attracted }, (_, i) => (
          <circle
            key={`a${i}`}
            cx={250 + (i % 10) * 16}
            cy={on ? 158 : 175 + ((i * 7) % 20)}
            r={3.2}
            style={{ fill: C.active, opacity: 0.75, transition: 'all .4s' }}
          />
        ))}

        {/* Electrons flowing source → drain */}
        {Array.from({ length: flowing }, (_, i) => (
          <circle
            key={`f${i}`}
            cx={200}
            cy={158}
            r={4}
            className="electron"
            style={{
              fill: C.text,
              animationDuration: `${travelSeconds}s`,
              animationDelay: `${(-i * travelSeconds) / flowing}s`,
            }}
          />
        ))}

        {/* Status pill: green ON, coral OFF */}
        <rect
          x={250}
          y={228}
          width={140}
          height={30}
          rx={15}
          style={{ fill: on ? alpha(C.ok, 18) : alpha(C.danger, 14), stroke: on ? C.ok : C.danger }}
        />
        <text
          x={320}
          y={248}
          textAnchor="middle"
          fontSize={13}
          fontWeight={700}
          style={{ fill: on ? C.ok : C.danger }}
        >
          {on ? 'ON → 1' : 'OFF → 0'}
        </text>
      </svg>

      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 6 }}
      >
        <label htmlFor={sliderId} style={{ fontSize: 14 }}>
          Gate voltage
        </label>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={MAX_V}
          step={0.05}
          value={volts}
          onChange={(e) => setVolts(Number(e.target.value))}
          style={{ flex: '1 1 160px', accentColor: C.accent }}
        />
        <span className="viz-mono" style={{ width: 60 }}>
          {volts.toFixed(2)} V
        </span>
        <button
          type="button"
          className="viz-btn"
          aria-pressed={volts === 0}
          onClick={() => setVolts(0)}
        >
          Send 0
        </button>
        <button
          type="button"
          className="viz-btn"
          aria-pressed={volts === MAX_V}
          onClick={() => setVolts(MAX_V)}
        >
          Send 1
        </button>
      </div>

      <div className="viz-caption">{caption}</div>
    </div>
  );
}
