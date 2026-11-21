import { Link, useLocation } from 'react-router';
import type { OutlineGroup } from '../lib/curriculum';

/**
 * A track's groups and their topics. Written topics are links; planned ones
 * are muted with a "soon" tag. Used by the navbar menu, the mobile menu and
 * the home page's contents, so all three always look and behave the same.
 */
export function OutlineGroups({
  groups,
  columns = false,
  onNavigate,
}: {
  groups: OutlineGroup[];
  /** Lay the groups out side by side (menu, contents) instead of stacked (sidebar). */
  columns?: boolean;
  /** Called when a link is followed, e.g. to close the menu it lives in. */
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  // Topics are numbered across the whole track, so each group needs to know
  // where its numbering starts: 1, then 1 + the first group's size, and so on.
  const starts = groups.map((_, i) =>
    groups.slice(0, i).reduce((sum, g) => sum + g.entries.length, 1),
  );

  return (
    <div className={columns ? 'grid gap-x-8 gap-y-7 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-5'}>
      {groups.map((group, gi) => (
        <div key={group.name}>
          <p className="mb-2 flex items-baseline justify-between gap-3 font-mono text-[0.7rem] tracking-wider text-muted uppercase">
            <span>{group.name}</span>
            <span className="tabular-nums">
              {group.entries.filter((e) => e.href).length}/{group.entries.length}
            </span>
          </p>
          <ul className="space-y-0.5">
            {group.entries.map((entry, ei) => {
              const number = String(starts[gi] + ei).padStart(2, '0');
              const current = entry.href === pathname;
              return (
                <li key={entry.slug}>
                  {entry.href ? (
                    <Link
                      to={entry.href}
                      onClick={onNavigate}
                      aria-current={current ? 'page' : undefined}
                      className={`group flex items-baseline gap-3 rounded-btn px-2.5 py-1.5 text-[0.95rem] transition-colors hover:bg-surface ${
                        current ? 'bg-surface text-accent' : 'text-text'
                      }`}
                    >
                      <span className="w-5 shrink-0 font-mono text-xs text-muted tabular-nums">
                        {number}
                      </span>
                      <span className="min-w-0 flex-1 leading-snug group-hover:text-accent">
                        {entry.title}
                      </span>
                      <span className="shrink-0 font-mono text-[0.7rem] text-accent-2">
                        {entry.level}
                      </span>
                    </Link>
                  ) : (
                    <span className="flex items-baseline gap-3 px-2.5 py-1.5 text-[0.95rem] text-muted/75">
                      <span className="w-5 shrink-0 font-mono text-xs tabular-nums">{number}</span>
                      <span className="min-w-0 flex-1 leading-snug">{entry.title}</span>
                      <span className="shrink-0 font-mono text-[0.7rem]">soon</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** A thin bar showing how much of a track is written. */
export function ProgressBar({ written, total }: { written: number; total: number }) {
  return (
    <span
      role="img"
      aria-label={`${written} of ${total} written`}
      className="block h-1 overflow-hidden rounded-full bg-border"
    >
      <span
        className="block h-full rounded-full bg-accent-2 transition-[width] duration-500"
        style={{ width: `${total ? (written / total) * 100 : 0}%` }}
      />
    </span>
  );
}
