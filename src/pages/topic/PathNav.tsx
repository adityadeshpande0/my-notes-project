import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { topics } from '../../lib/content';
import { pathFor } from '../../lib/curriculum';
import { useReadingHistory, wasVisited } from '../../lib/readingHistory';
import { TRACKS, type Track } from '../../lib/types';
import { TableOfContents, type Heading } from './TableOfContents';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The left sidebar on a note: the whole learning path of its collection, with
 * the current step highlighted and its sections ("on this page") nested
 * underneath. Steps you've read get a small tick.
 */
export function PathNav({
  track,
  slug,
  headings,
}: {
  track: Track;
  slug: string;
  headings: Heading[];
}) {
  const path = pathFor(topics, track);
  const groups = [...new Set(path.map((s) => s.group))];
  const history = useReadingHistory();
  const currentRef = useRef<HTMLLIElement>(null);

  // On a long path the current step may be below the fold of the sidebar:
  // scroll the sidebar (only the sidebar, not the page) so it's visible.
  useEffect(() => {
    const li = currentRef.current;
    const box = li?.closest('[data-path-scroll]');
    if (li && box) box.scrollTop = li.offsetTop - box.clientHeight / 3;
  }, [slug]);

  return (
    <nav aria-label={`${TRACKS[track].name} learning path`}>
      <Link
        to={`/${track}`}
        className="mb-6 flex items-center gap-2 text-sm text-muted hover:text-text"
      >
        <span aria-hidden="true">←</span> {TRACKS[track].name} path
      </Link>

      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group}>
            <p className="mb-1.5 font-mono text-[0.7rem] tracking-wider text-muted uppercase">
              {group}
            </p>
            <ol className="space-y-0.5 text-[0.9rem]">
              {path
                .filter((s) => s.group === group)
                .map((s) => {
                  const current = s.slug === slug;
                  const read = wasVisited(history, track, s.slug);
                  const number = (
                    <span
                      className={`w-5 shrink-0 font-mono text-[0.7rem] leading-6 ${current ? 'text-accent-2' : 'text-muted'}`}
                    >
                      {read && !current ? <span className="text-success">✓</span> : pad(s.step)}
                    </span>
                  );
                  return (
                    <li key={s.slug} ref={current ? currentRef : undefined}>
                      {s.href ? (
                        <Link
                          to={s.href}
                          aria-current={current ? 'page' : undefined}
                          className={`flex gap-2 rounded-btn px-2 py-1 leading-6 transition-colors ${
                            current
                              ? 'bg-surface font-medium text-text'
                              : 'text-muted hover:bg-surface hover:text-text'
                          }`}
                        >
                          {number}
                          <span className="min-w-0">{s.title}</span>
                        </Link>
                      ) : (
                        <span className="flex gap-2 px-2 py-1 leading-6 text-muted/60">
                          {number}
                          <span className="min-w-0">{s.title}</span>
                        </span>
                      )}
                      {/* This page's own sections, under its step. */}
                      {current && headings.length > 0 && (
                        <div className="my-2 ml-3">
                          <TableOfContents headings={headings} />
                        </div>
                      )}
                    </li>
                  );
                })}
            </ol>
          </div>
        ))}
      </div>
    </nav>
  );
}
