import { useRef } from 'react';
import { Link } from 'react-router';
import { LevelChip } from '../components/LevelChip';
import { topics } from '../lib/content';
import { outlineFor } from '../lib/curriculum';
import { useReveal } from '../lib/hooks';
import { TRACKS, type Track } from '../lib/types';

export function TrackPage({ track }: { track: Track }) {
  const outline = outlineFor(topics, track);
  const info = TRACKS[track];
  const listRef = useRef<HTMLDivElement>(null);
  useReveal(listRef); // cards marked `data-reveal` fade up as they scroll in

  return (
    <div>
      <header className="mb-14 border-b border-border pb-10">
        <div className="max-w-3xl">
          <p className="mb-3 font-mono text-sm text-accent-2">track</p>
          <h1 className="text-4xl sm:text-5xl">{info.name}</h1>
          <p className="mt-4 text-lg text-muted">{info.tagline}</p>
        </div>
      </header>

      <div ref={listRef} className="space-y-14">
        {outline.groups.map((group, gi) => {
          const id = `group-${gi}`;
          return (
            <section key={group.name} aria-labelledby={id}>
              <div className="mb-5 flex items-baseline gap-3">
                <span className="font-mono text-sm text-muted">
                  {String(gi + 1).padStart(2, '0')}
                </span>
                <h2 id={id} className="text-xl sm:text-2xl">
                  {group.name}
                </h2>
              </div>
              <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.entries.map((entry) => (
                  <li key={entry.slug} data-reveal>
                    {entry.href ? (
                      <Link
                        to={entry.href}
                        className="flex h-full flex-col rounded-card border border-border bg-elevated p-5 transition-[border-color,box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-glow"
                      >
                        <div className="mb-2 flex items-center justify-end">
                          {entry.level && <LevelChip level={entry.level} />}
                        </div>
                        <h3 className="text-lg">{entry.title}</h3>
                        {entry.summary && (
                          <p className="mt-2 text-sm text-muted">{entry.summary}</p>
                        )}
                        <span className="mt-auto pt-4 text-sm font-medium text-accent">
                          Read the note <span aria-hidden="true">→</span>
                        </span>
                      </Link>
                    ) : (
                      <div className="flex h-full flex-col rounded-card border border-dashed border-border p-5 text-muted">
                        <span className="mb-2 self-end font-mono text-xs">coming soon</span>
                        <h3 className="text-lg">{entry.title}</h3>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
