import { Link, useLocation } from 'react-router';
import type { OutlineGroup } from '../lib/curriculum';
import { useReadingHistory } from '../lib/readingHistory';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * A track's modules and their steps. Written steps are links; planned ones
 * are muted with a "soon" tag; steps you've read get a green tick. Used by the
 * navbar menu, the mobile menu and the home page's contents, so all three
 * always look and behave the same.
 */
export function OutlineGroups({
  groups,
  columns = false,
  onNavigate,
}: {
  groups: OutlineGroup[];
  /** Lay the modules out side by side (menu, contents) instead of stacked (sidebar). */
  columns?: boolean;
  /** Called when a link is followed, e.g. to close the menu it lives in. */
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const history = useReadingHistory();
  // Steps are numbered across the whole track, so each module needs to know
  // where its numbering starts: 1, then 1 + the first module's size, and so on.
  const starts = groups.map((_, i) =>
    groups.slice(0, i).reduce((sum, g) => sum + g.entries.length, 1),
  );

  return (
    // `columns` (CSS multi-column) packs modules of different lengths tightly,
    // like a newspaper, instead of leaving gaps under the short ones.
    <div className={columns ? 'gap-4 sm:columns-2 xl:columns-3' : 'space-y-5'}>
      {groups.map((group, gi) => {
        const ready = group.entries.filter((e) => e.href).length;
        return (
          <section
            key={group.name}
            aria-label={group.name}
            className={
              columns
                ? 'mb-4 break-inside-avoid rounded-card border border-border bg-bg/40 p-3'
                : undefined
            }
          >
            <div className="mb-1.5 flex items-baseline gap-2 px-2">
              <span className="font-mono text-[0.7rem] text-accent-2">{pad(gi + 1)}</span>
              <span className="min-w-0 flex-1 font-mono text-[0.7rem] tracking-wider text-muted uppercase">
                {group.name}
              </span>
              {columns && (
                <span className="font-mono text-[0.7rem] text-muted tabular-nums">
                  {ready}/{group.entries.length}
                </span>
              )}
            </div>
            <ul>
              {group.entries.map((entry, ei) => {
                const number = pad(starts[gi] + ei);
                if (!entry.href) {
                  return (
                    <li key={entry.slug}>
                      <span className="flex items-baseline gap-3 px-2 py-1.5 text-[0.92rem] text-muted/70">
                        <span className="w-5 shrink-0 font-mono text-xs tabular-nums">
                          {number}
                        </span>
                        <span className="min-w-0 flex-1 leading-snug">{entry.title}</span>
                        <span className="shrink-0 rounded-full border border-dashed border-border px-1.5 font-mono text-[0.65rem]">
                          soon
                        </span>
                      </span>
                    </li>
                  );
                }
                const current = entry.href === pathname;
                // `group/step` is a *named* group: hovering this link tints its
                // title, without reacting to other `group`s around it (the
                // phone menu's <details> is one).
                // href is "/track/slug"; history stores "track/slug".
                const read = history.visited.includes(entry.href.slice(1));
                return (
                  <li key={entry.slug}>
                    <Link
                      to={entry.href}
                      onClick={onNavigate}
                      aria-current={current ? 'page' : undefined}
                      className={`group/step flex items-baseline gap-3 rounded-btn px-2 py-1.5 text-[0.92rem] transition-colors hover:bg-surface ${
                        current ? 'bg-surface text-accent' : 'text-text'
                      }`}
                    >
                      <span className="w-5 shrink-0 font-mono text-xs text-muted tabular-nums">
                        {number}
                      </span>
                      <span className="min-w-0 flex-1 leading-snug group-hover/step:text-accent">
                        {entry.title}
                      </span>
                      {/* Beginner is the default, so only flag steps that step up. */}
                      {entry.level && entry.level !== 'beginner' && (
                        <span className="shrink-0 font-mono text-[0.65rem] text-warn">
                          {entry.level}
                        </span>
                      )}
                      {read && (
                        <span className="shrink-0 text-xs text-success">
                          <span aria-hidden="true">✓</span>
                          <span className="sr-only">read</span>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
