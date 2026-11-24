import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { OutlineGroups } from '../../components/OutlineGroups';
import { allOutlines } from '../../lib/curriculum';
import { topics } from '../../lib/content';
import { TRACKS, type Track } from '../../lib/types';

const OUTLINES = allOutlines(topics);
const OPEN_DELAY = 90; // ms: brushing past a menu item shouldn't open it
const CLOSE_DELAY = 160; // ms: time to move the mouse from the item down into the panel

/**
 * The main navigation on wide screens. Hovering a collection (or pressing its ▾
 * button) opens a panel under the header with its whole learning path.
 */
export function DesktopNav() {
  const { pathname } = useLocation();
  // Which menu is open, and on which page it was opened. Storing the path means
  // the menu closes by itself after you navigate: no effect needed, the "open"
  // value simply stops matching the current page.
  const [open, setOpen] = useState<{ track: Track; path: string } | null>(null);
  const openTrack = open?.path === pathname ? open.track : null;
  const timer = useRef<number | undefined>(undefined);
  const buttons = useRef<Partial<Record<Track, HTMLButtonElement | null>>>({});

  const schedule = (track: Track | null, delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => setOpen(track ? { track, path: pathname } : null),
      delay,
    );
  };
  // After you pick a link in the menu, the panel vanishes from under the mouse
  // and the browser reports a fresh "mouse entered the menu item". Ignore that
  // until the mouse really leaves, or the menu would pop straight back open.
  const justNavigated = useRef(false);
  const closeAfterNavigate = () => {
    window.clearTimeout(timer.current);
    justNavigated.current = true;
    setOpen(null);
  };
  const toggle = (track: Track) => {
    window.clearTimeout(timer.current);
    setOpen(openTrack === track ? null : { track, path: pathname });
  };
  const navRef = useRef<HTMLElement>(null);

  // While a menu is open, a click anywhere outside the nav closes it. The
  // listener only exists while the menu is open, and the cleanup removes it.
  useEffect(() => {
    if (!openTrack) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [openTrack]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && openTrack) {
      setOpen(null);
      buttons.current[openTrack]?.focus(); // put focus back where the menu came from
    }
  };

  const item = (active: boolean) =>
    `block rounded-btn px-3 py-1.5 transition-colors ${
      active ? 'bg-surface text-text' : 'text-muted hover:text-text'
    }`;

  return (
    <nav ref={navRef} aria-label="Main" className="hidden lg:block" onKeyDown={onKeyDown}>
      <ul className="flex items-center gap-0.5 text-sm whitespace-nowrap">
        {OUTLINES.map((outline) => {
          const { track } = outline;
          const isOpen = openTrack === track;
          const panelId = `menu-${track}`;
          return (
            <li
              key={track}
              onMouseEnter={() => {
                if (!justNavigated.current) schedule(track, openTrack ? 0 : OPEN_DELAY);
              }}
              onMouseLeave={() => {
                justNavigated.current = false;
                schedule(null, CLOSE_DELAY);
              }}
            >
              <div className="flex items-center">
                <NavLink to={`/${track}`} className={({ isActive }) => item(isActive || isOpen)}>
                  {TRACKS[track].short}
                </NavLink>
                <button
                  ref={(el) => {
                    buttons.current[track] = el;
                  }}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  aria-label={`${TRACKS[track].name} topics`}
                  onClick={() => toggle(track)}
                  className="-ml-1.5 grid size-6 place-items-center rounded-md text-muted hover:text-text"
                >
                  <svg
                    viewBox="0 0 12 12"
                    className={`size-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  >
                    <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              </div>

              {/* The panel lives inside the <li>, so Tab moves from the button
                  straight into its links. It's positioned against the header. */}
              {isOpen && (
                <div
                  id={panelId}
                  className="mega-panel thin-scroll absolute inset-x-0 top-full max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain border-b border-border bg-elevated shadow-glow"
                >
                  <div className="mx-auto grid max-w-[112rem] gap-10 px-5 py-8 whitespace-normal sm:px-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-12 lg:px-12">
                    <div className="lg:sticky lg:top-0 lg:self-start">
                      <p className="font-mono text-xs tracking-wide text-accent-2 uppercase">
                        Collection · learning path
                      </p>
                      <p className="mt-2 font-heading text-2xl font-semibold">
                        {TRACKS[track].name}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {TRACKS[track].tagline}
                      </p>

                      {/* How much of this collection is written so far. */}
                      <div className="mt-6">
                        <div className="flex justify-between font-mono text-xs text-muted">
                          <span>
                            {outline.groups.length} modules · {outline.total} steps
                          </span>
                          <span>{outline.written} ready</span>
                        </div>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{
                              width: `${(outline.written / Math.max(outline.total, 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      <Link
                        to={`/${track}`}
                        onClick={closeAfterNavigate}
                        className="group mt-6 inline-flex items-center gap-2 rounded-btn bg-text px-4 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
                      >
                        Open the learning path
                        <span
                          aria-hidden="true"
                          className="transition-transform group-hover:translate-x-0.5"
                        >
                          →
                        </span>
                      </Link>
                    </div>
                    <OutlineGroups
                      groups={outline.groups}
                      columns
                      onNavigate={closeAfterNavigate}
                    />
                  </div>
                </div>
              )}
            </li>
          );
        })}
        <li className="ml-2 border-l border-border pl-2">
          <NavLink to="/playground" className={({ isActive }) => item(isActive)}>
            Playground
          </NavLink>
        </li>
        <li>
          <NavLink to="/about" className={({ isActive }) => item(isActive)}>
            About
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
