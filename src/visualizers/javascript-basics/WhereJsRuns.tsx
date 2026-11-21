import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../lib/hooks';
import { alpha, C } from '../core/colors';
import { PLANETS } from './planets';

/*
 * React.lazy + Suspense: `import('./WhereJsRuns3D')` becomes its own JavaScript
 * file (with three.js inside). The browser only downloads it the first time
 * <Orbit3D> renders, and Suspense shows the fallback until it arrives.
 * We also wait until this visual is near the screen before rendering it.
 */
const Orbit3D = lazy(() => import('./WhereJsRuns3D'));

/** Can this device comfortably run the 3D version? */
function canDo3D(): boolean {
  if (typeof window === 'undefined') return false;
  if ((navigator.hardwareConcurrency ?? 4) < 4) return false;
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

export default function WhereJsRuns() {
  const reduced = useReducedMotion();
  const [capable] = useState(canDo3D); // checked once, on first render
  // null = "use the default"; once the reader picks 2D or 3D, their choice wins.
  const [choice, setChoice] = useState<'2d' | '3d' | null>(null);
  const view = choice ?? (capable && !reduced ? '3d' : '2d');
  const [selected, setSelected] = useState<string | null>(null);
  const [near, setNear] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Start loading three.js only once the visual is within ~300px of the screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin: '300px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  const planet = PLANETS.find((p) => p.id === selected);
  const select = (id: string) => setSelected((cur) => (cur === id ? null : id));

  return (
    <div className="viz not-prose" ref={rootRef}>
      <p className="viz-title">JavaScript’s universe</p>
      <p className="viz-sub">
        Everywhere JavaScript runs today. {view === '3d' ? 'Drag to look around; c' : 'C'}lick a
        planet, or use the buttons below.
      </p>

      <div className="js-row" role="group" aria-label="View" style={{ marginBottom: '.75rem' }}>
        <button
          type="button"
          className="viz-btn"
          aria-pressed={view === '2d'}
          onClick={() => setChoice('2d')}
        >
          2D
        </button>
        <button
          type="button"
          className="viz-btn"
          aria-pressed={view === '3d'}
          onClick={() => setChoice('3d')}
          disabled={!capable}
          title={capable ? undefined : 'This device can’t run the 3D version smoothly'}
        >
          3D
        </button>
      </div>

      <div className="wr-stage">
        {view === '3d' && near ? (
          <Suspense fallback={<div className="wr-loading">Loading 3D…</div>}>
            <Orbit3D selected={selected} onSelect={select} />
          </Suspense>
        ) : view === '3d' ? (
          <div className="wr-loading">Loading 3D…</div>
        ) : (
          // Below ~460px wide the diagram scrolls sideways instead of shrinking its labels.
          <div className="viz-scroll">
            <Orbit2D selected={selected} onSelect={select} />
          </div>
        )}
      </div>

      {/* The same planets as real buttons: keyboard and screen readers use these. */}
      <div className="wr-list" role="group" aria-label="Platforms">
        {PLANETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="viz-btn"
            aria-pressed={selected === p.id}
            aria-controls="wr-info"
            onClick={() => select(p.id)}
          >
            <span aria-hidden="true">{p.icon}</span> {p.name}
          </button>
        ))}
      </div>

      <div id="wr-info" className="viz-caption" aria-live="polite">
        {planet ? (
          <div key={planet.id} className="viz-fade">
            <strong>
              <span aria-hidden="true">{planet.icon}</span> {planet.name}
            </strong>
            <p style={{ margin: '.25rem 0' }}>{planet.text}</p>
            <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>Example: {planet.example}</p>
          </div>
        ) : (
          <span style={{ color: C.muted }}>Pick a planet to see what JavaScript does there.</span>
        )}
      </div>
    </div>
  );
}

/** The 2D version: the JS sun with planets on static rings. */
function Orbit2D({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const cx = 300;
  const cy = 190;
  const rings = [90, 140, 180];
  return (
    <svg
      viewBox="0 0 600 380"
      style={{ minWidth: 460 }}
      role="img"
      aria-label="The JavaScript sun with six planets around it"
    >
      {rings.map((r) => (
        <ellipse
          key={r}
          cx={cx}
          cy={cy}
          rx={r * 1.45}
          ry={r * 0.95}
          fill="none"
          strokeDasharray="3 6"
          style={{ stroke: C.border }}
        />
      ))}
      <circle
        cx={cx}
        cy={cy}
        r={46}
        style={{ fill: C.warn, filter: `drop-shadow(0 0 18px ${alpha(C.warn, 60)})` }}
      />
      <text
        x={cx}
        y={cy + 9}
        textAnchor="middle"
        fontSize={26}
        fontWeight={700}
        style={{ fill: C.bg, fontFamily: 'var(--font-heading)' }}
      >
        JS
      </text>
      {PLANETS.map((p, i) => {
        const r = rings[i % 3];
        const angle = (i / PLANETS.length) * Math.PI * 2 - Math.PI / 2 + (i % 2) * 0.35;
        const x = cx + Math.cos(angle) * r * 1.45;
        const y = cy + Math.sin(angle) * r * 0.95;
        const on = selected === p.id;
        const color = `var(${p.colorVar})`;
        return (
          // Mouse users can click the planets; keyboard users have the button list below.
          <g
            key={p.id}
            onClick={() => onSelect(p.id)}
            style={{ cursor: 'pointer' }}
            aria-hidden="true"
          >
            <circle
              cx={x}
              cy={y}
              r={on ? 30 : 24}
              strokeWidth={on ? 3 : 1.5}
              style={{
                fill: alpha(color, on ? 30 : 16),
                stroke: color,
                transition: 'r .2s',
                filter: on ? `drop-shadow(0 0 10px ${alpha(color, 70)})` : 'none',
              }}
            />
            <text x={x} y={y + 7} textAnchor="middle" fontSize={20}>
              {p.icon}
            </text>
            <text
              x={x}
              y={y + (on ? 48 : 42)}
              textAnchor="middle"
              fontSize={16}
              style={{ fill: on ? color : C.muted }}
            >
              {p.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
