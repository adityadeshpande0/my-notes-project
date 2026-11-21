import { Link, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { ThemeToggle } from '../components/ThemeToggle';
import { DesktopNav } from './nav/DesktopNav';
import { MobileNav } from './nav/MobileNav';

/** The frame around every page. <Outlet /> is where the current route renders. */
export function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-btn focus:bg-elevated focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[112rem] items-center gap-x-3 px-5 py-3 sm:px-8 lg:gap-x-8 lg:px-12">
          {/* Phones: a menu button opens the sidebar. Wider screens: the full navbar. */}
          <MobileNav />
          <Link to="/" className="flex items-center gap-2 font-heading text-lg font-bold">
            <Logo />
            Stackscape
          </Link>
          <DesktopNav />
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main
        id="main"
        className="mx-auto w-full max-w-[112rem] flex-1 px-5 py-10 sm:px-8 sm:py-14 lg:px-12"
      >
        {/* A new `key` per URL makes React mount a fresh wrapper on every navigation,
            which replays the CSS entrance animation on `.page-enter`. */}
        <div key={pathname} className="page-enter">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[112rem] flex-wrap justify-between gap-2 px-5 py-6 text-sm text-muted sm:px-8 lg:px-12">
          <p>Stackscape: visual notes on how code really runs. Free for everyone, no sign-up.</p>
          <p>Built by a learner, for learners.</p>
        </div>
      </footer>

      {/* Scrolls to the top on navigation and restores position on back/forward. */}
      <ScrollRestoration />
    </div>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-surface" />
      <rect x="7" y="18" width="5" height="7" rx="1.5" className="fill-accent" />
      <rect x="13.5" y="12" width="5" height="13" rx="1.5" className="fill-accent-2" />
      <rect x="20" y="7" width="5" height="18" rx="1.5" className="fill-success" />
    </svg>
  );
}
