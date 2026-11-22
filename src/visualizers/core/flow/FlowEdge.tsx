import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../../lib/hooks';

export type Point = [x: number, y: number];

/**
 * An arrow between flowchart nodes: a polyline through `points`, with an
 * optional "yes"/"no" label. `active` makes it glow mint (the path taken).
 *
 * `travel` sends a little dot along the edge once. It's animated with
 * requestAnimationFrame and a ref: we move the dot by changing its attributes
 * directly, so React doesn't have to re-render 60 times a second. Change
 * `travelKey` to send another dot. Under reduced motion there's no dot.
 */
export function FlowEdge({
  points,
  label,
  labelAt,
  active,
  dim,
  travel,
  travelKey,
  duration = 450,
}: {
  points: Point[];
  label?: string;
  /** Where to put the label; defaults to just after the first corner. */
  labelAt?: Point;
  active?: boolean;
  dim?: boolean;
  travel?: boolean;
  travelKey?: string | number;
  duration?: number;
}) {
  const reduced = useReducedMotion();
  const dot = useRef<SVGCircleElement>(null);
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');

  // The arrowhead points along the last segment.
  const [px, py] = points[points.length - 2];
  const [ex, ey] = points[points.length - 1];
  const angle = (Math.atan2(ey - py, ex - px) * 180) / Math.PI;

  const [lx, ly] = labelAt ?? midpoint(points[0], points[1]);
  // Join the points into a string so the effect only re-runs when the shape really changes.
  const pointsKey = points.join(' ');

  useEffect(() => {
    const el = dot.current;
    if (!travel || reduced || !el) return;
    const pts = pointsKey.split(' ').map((p) => p.split(',').map(Number) as Point);
    let frame = 0;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const [x, y] = along(pts, ease(t));
      el.setAttribute('cx', String(x));
      el.setAttribute('cy', String(y));
      el.style.opacity = t >= 1 ? '0' : '1';
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame); // stop if the edge changes or unmounts
  }, [travel, travelKey, reduced, pointsKey, duration]);

  return (
    <g className={`flow-edge ${active ? 'is-active' : ''} ${dim ? 'is-dim' : ''}`}>
      <path className="flow-line" d={d} />
      <polygon
        className="flow-arrow"
        points="0,0 -8,-4.5 -8,4.5"
        transform={`translate(${ex} ${ey}) rotate(${angle})`}
      />
      {label && (
        <g transform={`translate(${lx} ${ly})`}>
          <rect className="flow-edge-tag" x={-14} y={-8} width={28} height={16} rx={8} />
          <text className="flow-edge-label" textAnchor="middle" dominantBaseline="central">
            {label}
          </text>
        </g>
      )}
      {travel && !reduced && (
        <circle ref={dot} className="flow-dot" r={5} cx={points[0][0]} cy={points[0][1]} />
      )}
    </g>
  );
}

const midpoint = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** The point a fraction `t` (0–1) of the way along a polyline. */
function along(pts: Point[], t: number): Point {
  const lengths = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let remaining = t * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const f = lengths[i] ? Math.min(1, remaining / lengths[i]) : 0;
      return [
        pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f,
        pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f,
      ];
    }
    remaining -= lengths[i];
  }
  return pts[pts.length - 1];
}
