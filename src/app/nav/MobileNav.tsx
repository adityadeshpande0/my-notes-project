import { useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { OutlineGroups } from '../../components/OutlineGroups';
import { ThemeToggle } from '../../components/ThemeToggle';
import { topics } from '../../lib/content';
import { allOutlines } from '../../lib/curriculum';
import { TRACKS } from '../../lib/types';

const OUTLINES = allOutlines(topics);

/*
 * The phone menu: a hamburger button that opens a sidebar with every collection,
 * group and topic.
 *
 * It's built on the browser's own <dialog> element. `showModal()` gives us, for
 * free, what used to take a lot of code: focus moves inside and stays there,
 * Esc closes it, and the page behind can't be clicked or tabbed into.
 */
export function MobileNav() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { pathname } = useLocation();
  const currentTrack = pathname.split('/')[1];

  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={open}
        aria-label="Open menu"
        aria-haspopup="dialog"
        className="grid size-9 place-items-center rounded-btn border border-border bg-elevated text-muted transition-colors hover:text-text"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Site menu"
        className="drawer"
        // A click on the dimmed backdrop lands on the <dialog> element itself
        // (its content is inside a child div), so that closes it too.
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <Link to="/" onClick={close} className="font-heading text-lg font-bold">
              Stackscape
            </Link>
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="grid size-9 place-items-center rounded-btn text-muted hover:bg-surface hover:text-text"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <nav
            aria-label="All topics"
            className="flex-1 overflow-y-auto overscroll-contain px-3 py-4"
          >
            {OUTLINES.map((o, i) => (
              // <details> is a native open/close section: no state needed.
              // The track you're reading starts open.
              <details
                key={o.track}
                open={o.track === currentTrack || (!currentTrack && i === 0)}
                className="group mb-1 rounded-card"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 rounded-btn px-2.5 py-3 hover:bg-surface">
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading font-semibold">{TRACKS[o.track].name}</span>
                  </span>
                  <svg
                    viewBox="0 0 12 12"
                    className="size-3.5 text-muted transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  >
                    <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </summary>
                <div className="pt-1 pb-4 pl-1">
                  <Link
                    to={`/${o.track}`}
                    onClick={close}
                    className="mb-3 ml-2.5 inline-block text-sm text-accent hover:underline"
                  >
                    Open the learning path →
                  </Link>
                  <OutlineGroups groups={o.groups} onNavigate={close} />
                </div>
              </details>
            ))}

            <div className="mt-3 border-t border-border pt-3">
              {[
                { to: '/playground', label: 'Playground' },
                { to: '/about', label: 'About' },
              ].map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={close}
                  className={({ isActive }) =>
                    `block rounded-btn px-2.5 py-2.5 ${isActive ? 'bg-surface text-accent' : 'hover:bg-surface'}`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </nav>

          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm text-muted">
            <span>Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </dialog>
    </div>
  );
}
