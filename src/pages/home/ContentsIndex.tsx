import { useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router';
import { OutlineGroups } from '../../components/OutlineGroups';
import { topics } from '../../lib/content';
import { allOutlines } from '../../lib/curriculum';
import { TRACKS, type Track } from '../../lib/types';

const OUTLINES = allOutlines(topics);
const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

/**
 * The home page's collections: one tab per collection, and
 * the chosen collection's modules and topics underneath. Tabs follow the ARIA tabs
 * pattern: ← and → move between them.
 */
export function ContentsIndex() {
  const [active, setActive] = useState<Track>(OUTLINES[0].track);
  const outline = OUTLINES.find((o) => o.track === active)!;

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = OUTLINES[(i + dir + OUTLINES.length) % OUTLINES.length].track;
    setActive(next);
    document.getElementById(`contents-tab-${next}`)?.focus();
  };

  return (
    <div data-reveal>
      <div role="tablist" aria-label="Tracks" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {OUTLINES.map((o, i) => {
          const selected = o.track === active;
          return (
            <button
              key={o.track}
              id={`contents-tab-${o.track}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="contents-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(o.track)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`rounded-card border p-4 text-left transition-[border-color,background-color] duration-200 ${
                selected
                  ? 'border-accent/70 bg-elevated shadow-glow'
                  : 'border-border hover:border-accent/40 hover:bg-elevated/60'
              }`}
            >
              <span className="block font-mono text-xs text-muted">Part {NUMERALS[i]}</span>
              <span className="mt-1 block font-heading text-[1.05rem] leading-snug font-semibold">
                {TRACKS[o.track].name}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id="contents-panel"
        role="tabpanel"
        aria-labelledby={`contents-tab-${active}`}
        className="mt-4 rounded-card border border-border bg-elevated p-5 sm:p-7"
      >
        {/* `key` replays the fade when you switch tracks. */}
        <div key={active} className="anatomy-swap">
          <div className="mb-7 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-border pb-5">
            <p className="max-w-[36rem] text-muted">{TRACKS[active].tagline}</p>
            <Link
              to={`/${active}`}
              className="text-sm font-medium whitespace-nowrap text-accent hover:underline"
            >
              Open the {TRACKS[active].short} path <span aria-hidden="true">→</span>
            </Link>
          </div>
          <OutlineGroups groups={outline.groups} columns />
        </div>
      </div>
    </div>
  );
}
