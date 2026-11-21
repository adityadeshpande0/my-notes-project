import { Link } from 'react-router';
import { topics } from '../../lib/content';
import { PLANNED } from '../../lib/roadmap';
import { topicsForTrack } from '../../lib/topics';
import { TRACK_IDS, TRACKS, type Level, type Track } from '../../lib/types';

interface Entry {
  slug: string;
  title: string;
  level?: Level; // only written notes have a level
}

/** Written notes first (in order), then the planned ones that don't exist yet. */
function entriesFor(track: Track): Entry[] {
  const written = topicsForTrack(topics, track);
  const writtenSlugs = new Set(written.map((t) => t.slug));
  const planned = PLANNED[track].filter((p) => !writtenSlugs.has(p.slug));
  return [...written, ...planned];
}

const NUMERALS = ['I', 'II', 'III', 'IV', 'V'];

export function ContentsIndex() {
  return (
    <div className="grid gap-x-12 gap-y-12 md:grid-cols-2 2xl:grid-cols-3">
      {TRACK_IDS.map((track, i) => ({ track, numeral: NUMERALS[i], name: TRACKS[track].name })).map(
        (part) => (
          <section key={part.track} aria-labelledby={`part-${part.track}`}>
            <h3
              id={`part-${part.track}`}
              data-reveal
              className="mb-5 flex items-baseline gap-3 text-lg"
            >
              <span className="font-mono text-sm font-normal text-muted">Part {part.numeral}</span>
              <Link to={`/${part.track}`} className="hover:text-accent">
                {part.name}
              </Link>
            </h3>

            <ol className="border-t border-border">
              {entriesFor(part.track).map((entry, i) => {
                const number = String(i + 1).padStart(2, '0');
                const row = (
                  <>
                    <span className="w-6 shrink-0 font-mono text-xs text-muted tabular-nums">
                      {number}
                    </span>
                    <span className="min-w-0">{entry.title}</span>
                    {/* The dotted "leader" line between title and status, like a printed contents page */}
                    <span
                      aria-hidden="true"
                      className="mx-1 min-w-4 flex-1 translate-y-[-0.3em] border-b border-dotted border-border"
                    />
                    <span className="shrink-0 font-mono text-xs">{entry.level ?? 'soon'}</span>
                  </>
                );

                return (
                  <li key={entry.slug} data-reveal className="border-b border-border">
                    {entry.level ? (
                      <Link
                        to={`/${part.track}/${entry.slug}`}
                        className="group flex items-baseline gap-3 py-3 transition-colors hover:text-accent [&>span:last-child]:text-accent-2"
                      >
                        {row}
                      </Link>
                    ) : (
                      <div className="flex items-baseline gap-3 py-3 text-muted/70">{row}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ),
      )}
    </div>
  );
}
