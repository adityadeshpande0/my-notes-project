import type { ReactNode } from 'react';

/**
 * One box in a flowchart, drawn in SVG. Shared by the conditions, loops and
 * functions articles.
 *
 * - terminal: a pill for Start / End
 * - decision: a diamond holding a yes/no question
 * - action:   a rectangle for "do this"
 *
 * States follow the visualizer colours: active = mint (where we are now),
 * yes = green, no = muted with a cross, skipped = faded. Every state also
 * changes a mark or the text, so colour is never the only signal.
 * Import `flow.css` from the note's visualizer index.
 */
export type FlowShape = 'terminal' | 'decision' | 'action';
export type FlowState = 'idle' | 'active' | 'yes' | 'no' | 'done' | 'skipped' | 'warn';

export interface FlowNodeProps {
  shape: FlowShape;
  /** Centre of the node. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Text inside. A string with "\n" in it is drawn as several lines. */
  label: ReactNode;
  state?: FlowState;
  /** Show the label in the code font. */
  mono?: boolean;
  /** A small mark next to the node (✓, ✗, "skipped"…). */
  badge?: string;
  /** right: beside the top-right corner (default). above: over the node's right end. */
  badgePos?: 'right' | 'above';
}

export function FlowNode({
  shape,
  x,
  y,
  w,
  h,
  label,
  state = 'idle',
  mono,
  badge,
  badgePos = 'right',
}: FlowNodeProps) {
  const left = x - w / 2;
  const top = y - h / 2;
  return (
    <g className={`flow-node flow-node--${shape} is-${state}`}>
      {shape === 'decision' ? (
        <polygon
          className="flow-shape"
          points={`${x},${top} ${left + w},${y} ${x},${top + h} ${left},${y}`}
        />
      ) : (
        <rect
          className="flow-shape"
          x={left}
          y={top}
          width={w}
          height={h}
          rx={shape === 'terminal' ? h / 2 : 8}
        />
      )}
      <text
        className={`flow-label ${mono ? 'flow-label--mono' : ''}`}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {typeof label === 'string' && label.includes('\n')
          ? label.split('\n').map((line, i, all) => (
              // Centre the block of lines on y: shift each line by its distance from the middle.
              <tspan key={i} x={x} dy={i === 0 ? `${-(all.length - 1) * 0.6}em` : '1.2em'}>
                {line}
              </tspan>
            ))
          : label}
      </text>
      {badge && (
        <text
          className="flow-badge"
          x={badgePos === 'right' ? left + w + 4 : left + w}
          y={badgePos === 'right' ? top : top - 8}
          textAnchor={badgePos === 'right' ? 'start' : 'end'}
          dominantBaseline="central"
        >
          {badge}
        </text>
      )}
    </g>
  );
}
