/**
 * Theme colours for visualizers, as CSS variables. Use these instead of hex
 * codes so every visual works in both light and dark themes.
 *
 * In SVG, apply them through `style` (style={{ fill: C.accent }}), because
 * plain attributes like fill="var(--accent)" aren't supported everywhere.
 */
export const C = {
  bg: 'var(--bg)',
  elevated: 'var(--bg-elevated)',
  surface: 'var(--surface)',
  border: 'var(--border)',
  text: 'var(--text)',
  muted: 'var(--text-muted)',
  accent: 'var(--accent)',
  active: 'var(--accent-2)', // mint: "on" / current
  warn: 'var(--warn)', // amber: working / comparing
  danger: 'var(--danger)', // coral: overflow / wrong
  ok: 'var(--success)', // green: result / correct
  violet: 'var(--violet)',
  pink: 'var(--pink)',
} as const;

/** A see-through version of a colour: alpha(C.active, 15) is mint at 15% opacity. */
export const alpha = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;

/** A colour part-way between two others: mix(C.accent, C.violet, 50). */
export const mix = (a: string, b: string, percentOfB: number) =>
  `color-mix(in oklab, ${a}, ${b} ${percentOfB}%)`;
