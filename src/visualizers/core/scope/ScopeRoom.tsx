import type { ReactNode } from 'react';
import { MemoryBox, type BoxKind } from '../memory';

/**
 * Scope rooms: the JavaScript course's way to draw scope. Each scope is a
 * tinted room with its variables inside; inner scopes are rooms inside rooms.
 * Lookups search outward, room by room (ScopeSearch is the 🔍 chip), and
 * never look into an inner room.
 *
 * Import `scope.css` from the note's visualizer index.
 */
import type { RoomTint } from './tints';
export type { RoomTint };

export interface ScopeVar {
  name: string;
  /** As code: "\"Masala\"", "0", "undefined". Ignored when `tdz` is set. */
  value: string;
  kind?: BoxKind;
  /** found: the search stopped here · shadowed: hidden by a closer one · changed: just updated. */
  mark?: 'found' | 'shadowed' | 'changed';
  /** In the Temporal Dead Zone: exists, but can't be touched yet. */
  tdz?: boolean;
  /** A small note under the box. */
  note?: ReactNode;
}

/** The 🔍 chip that shows what a lookup is searching for, in the room it's searching. */
export function ScopeSearch({ name, found }: { name: string; found?: boolean }) {
  return (
    <span
      className={`sr-lens ${found === true ? 'is-found' : found === false ? 'is-miss' : ''}`}
      aria-live="polite"
    >
      🔍 {name}
      {found === true ? ' ✓ found' : found === false ? ' ✗ not here' : '?'}
    </span>
  );
}

export function ScopeVars({ vars }: { vars: ScopeVar[] }) {
  if (vars.length === 0) return null;
  return (
    <div className="sr-vars">
      {vars.map((v) => (
        <div key={v.name} className={`sr-var ${v.mark ? `is-${v.mark}` : ''}`}>
          <MemoryBox
            key={v.mark === 'changed' ? `${v.name}-${v.value}` : v.name}
            name={v.name}
            kind={v.kind ?? 'const'}
            value={v.value}
            tdz={v.tdz}
            state={v.mark === 'found' ? 'new' : v.mark === 'changed' ? 'changed' : 'same'}
          />
          {v.note && <span className="sr-note">{v.note}</span>}
        </div>
      ))}
    </div>
  );
}

export function ScopeRoom({
  name,
  tint = 'global',
  vars = [],
  searching,
  label,
  dim,
  row,
  id,
  children,
}: {
  name: ReactNode;
  tint?: RoomTint;
  vars?: ScopeVar[];
  /** The lookup happening in this room right now. */
  searching?: { name: string; found?: boolean };
  /** A note on the room's wall ("🚫 can't look inside", "📞 called from here…"). */
  label?: ReactNode;
  dim?: boolean;
  /** Lay inner rooms side by side (when there's room) instead of stacked. */
  row?: boolean;
  /** For RefArrows: a backpack can point at this room. */
  id?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`sr-room is-${tint} ${searching ? 'is-searching' : ''} ${dim ? 'is-dim' : ''}`}
      data-heap-id={id}
    >
      <div className="sr-head">
        <span className="viz-mono sr-name">{name}</span>
        {searching && <ScopeSearch name={searching.name} found={searching.found} />}
        {label && <span className="sr-label">{label}</span>}
      </div>
      <ScopeVars vars={vars} />
      {children && <div className={`sr-inner ${row ? 'is-row' : ''}`}>{children}</div>}
    </div>
  );
}
