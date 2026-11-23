import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { useReducedMotion } from '../../../lib/hooks';

/**
 * ArrayStrip: an array drawn as a row of tiles, with each tile's index
 * underneath (the same look as StringBoxes in article #2). Shared by the
 * JavaScript course and the DSA track (sorting, searching…).
 *
 * API
 * - `items`: the tiles, in order. Each needs a stable `id`: when an item
 *   moves, React keeps its tile and it glides to its new place (FLIP).
 *   New ids drop in; ids that disappear simply leave.
 * - `highlight`: { [index]: role } colours a tile by its job. Roles follow the
 *   site's fixed visualizer colours, always paired with a mark:
 *     current (mint ▶) · compare (amber ?) · swap (coral ⇄) · done (green ✓)
 *     match (green ✓) · miss (coral ✗) · muted (faded)
 * - `ghosts`: tiles that are leaving (or not checked), drawn faded at a
 *   position: { id, label, at, note? }. They don't get an index number.
 * - `labels`: { [index]: text } a small tag above a tile ("i", "lo", "min").
 * - `showIndex` (default true), `size` ('md' | 'sm'), `ariaLabel`.
 *
 * Import `array.css` from the note's visualizer index.
 */
export type TileRole = 'current' | 'compare' | 'swap' | 'done' | 'match' | 'miss' | 'muted';

export interface StripItem {
  id: string;
  label: ReactNode;
  /** Extra line inside the tile (e.g. a price). */
  sub?: ReactNode;
}

export interface StripGhost extends StripItem {
  /** Where to draw it (an index into `items`; drawn just before that item). */
  at: number;
  note?: string;
}

export interface ArrayStripProps {
  items: StripItem[];
  highlight?: Record<number, TileRole>;
  ghosts?: StripGhost[];
  labels?: Record<number, string>;
  showIndex?: boolean;
  size?: 'md' | 'sm';
  ariaLabel?: string;
}

const MARK: Record<TileRole, string> = {
  current: '▶',
  compare: '?',
  swap: '⇄',
  done: '✓',
  match: '✓',
  miss: '✗',
  muted: '',
};

export function ArrayStrip({
  items,
  highlight = {},
  ghosts = [],
  labels = {},
  showIndex = true,
  size = 'md',
  ariaLabel,
}: ArrayStripProps) {
  const reduced = useReducedMotion();
  const refs = useRef(new Map<string, HTMLLIElement>());
  const last = useRef(new Map<string, DOMRect>());
  const order = items.map((it) => it.id).join('|');

  // FLIP: after React moves the tiles, measure where each one ended up,
  // jump it back to where it was, then let it glide to the new place.
  useLayoutEffect(() => {
    const next = new Map<string, DOMRect>();
    refs.current.forEach((el, id) => {
      const rect = el.getBoundingClientRect();
      next.set(id, rect);
      const before = last.current.get(id);
      if (!before || reduced) return;
      const dx = before.left - rect.left;
      const dy = before.top - rect.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
        duration: 420,
        easing: 'cubic-bezier(0.3, 0.8, 0.3, 1)',
      });
    });
    last.current = next;
  }, [order, reduced]);

  // Merge the real items and the ghosts into one row.
  const row: { item: StripItem; index: number | null; ghost?: StripGhost }[] = [];
  items.forEach((item, index) => {
    for (const g of ghosts.filter((g) => g.at === index))
      row.push({ item: g, index: null, ghost: g });
    row.push({ item, index });
  });
  for (const g of ghosts.filter((g) => g.at >= items.length))
    row.push({ item: g, index: null, ghost: g });

  return (
    <ol
      className={`as-strip is-${size}`}
      aria-label={ariaLabel ?? `Array of ${items.length} item${items.length === 1 ? '' : 's'}`}
    >
      {row.length === 0 && <li className="as-empty">[ ] empty</li>}
      {row.map(({ item, index, ghost }) => {
        const role = index === null ? undefined : highlight[index];
        return (
          <li
            key={item.id}
            ref={(el) => {
              if (el) refs.current.set(item.id, el);
              else refs.current.delete(item.id);
            }}
            className={`as-tile ${role ? `is-${role}` : ''} ${ghost ? 'is-ghost' : ''}`}
            aria-label={ghost ? `${ghost.note ?? 'leaving'}` : undefined}
          >
            {index !== null && labels[index] && <span className="as-tag">{labels[index]}</span>}
            {role && MARK[role] && (
              <span className="as-mark" aria-hidden="true">
                {MARK[role]}
              </span>
            )}
            <span className="as-label">{item.label}</span>
            {item.sub !== undefined && <span className="as-sub">{item.sub}</span>}
            {showIndex && (
              <span className="as-index">{index === null ? (ghost?.note ?? '') : index}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
