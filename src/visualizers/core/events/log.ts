import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Data for EventLog: one row per event, plus a hook that keeps the rows.
 * Kept out of EventLog.tsx so that file exports only a component.
 */
export type EventCategory = 'mouse' | 'key' | 'form' | 'focus' | 'other';

export interface EventRow {
  id: number;
  /** ms since the visual started. */
  t: number;
  /** Show this instead of the time (e.g. "#2" for a replayed order). */
  stamp?: string;
  /** The event type, shown on the chip ("click", "input"…). */
  type: string;
  /** Override the chip colour (e.g. "debounced" runs). */
  category?: EventCategory;
  /** Where it happened: "<input#search>". */
  target?: string;
  /** Short details: key: "a", value: "chai"… */
  detail?: string;
  /** Extra emphasis: highlight (e.g. the one change event), stopped, muted. */
  tone?: 'highlight' | 'stopped' | 'muted';
  /** Properties copied from the real event when it fired, for the inspector. */
  props?: [string, string][];
}

/** Fixed colours by kind: mouse periwinkle, keyboard amber, form mint, focus green. */
export function eventCategory(type: string): EventCategory {
  if (/^(click|dblclick|mouse|pointer|contextmenu)/.test(type)) return 'mouse';
  if (/^key/.test(type)) return 'key';
  if (/^(input|change|submit|reset)$/.test(type)) return 'form';
  if (/^(focus|blur)/.test(type)) return 'focus';
  return 'other';
}

export const MAX_ROWS = 50;

/** Rows newest-first, capped at 50, with timestamps from when the visual started. */
export function useEventLog() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const start = useRef(0);
  const nextId = useRef(1);
  useEffect(() => {
    start.current = performance.now();
  }, []);
  const push = useCallback((row: Omit<EventRow, 'id' | 't'>) => {
    const full = { ...row, id: nextId.current++, t: Math.round(performance.now() - start.current) };
    setRows((rs) => [full, ...rs].slice(0, MAX_ROWS));
    return full.id;
  }, []);
  const clear = useCallback(() => setRows([]), []);
  return { rows, push, clear };
}
