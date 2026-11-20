import { Link } from 'react-router';
import { LevelChip } from '../components/LevelChip';
import { topics } from '../lib/content';
import { groupByLevel, topicsForTrack } from '../lib/topics';
import { LEVELS, TRACKS, type Track } from '../lib/types';

export function TrackPage({ track }: { track: Track }) {
  const groups = groupByLevel(topicsForTrack(topics, track));
  const info = TRACKS[track];

  return (
    <div>
      <header className="mb-12 max-w-3xl">
        <p className="mb-3 font-mono text-sm text-accent-2">track</p>
        <h1 className="text-4xl sm:text-5xl">{info.name}</h1>
        <p className="mt-4 text-lg text-muted">{info.tagline}</p>
      </header>

      {/* Phase 3 turns this list into a path / skill-tree with progress rings. */}
      <div className="space-y-12">
        {LEVELS.map((level) =>
          groups[level].length === 0 ? null : (
            <section key={level} aria-labelledby={`level-${level}`}>
              <h2 id={`level-${level}`} className="mb-4 text-xl capitalize">
                {level}
              </h2>
              <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups[level].map((topic) => (
                  <li key={topic.slug}>
                    <Link
                      to={`/${track}/${topic.slug}`}
                      className="flex h-full flex-col rounded-card border border-border bg-elevated p-5 transition-[border-color,box-shadow] hover:border-accent/60 hover:shadow-glow"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-muted">#{topic.order}</span>
                        <LevelChip level={topic.level} />
                      </div>
                      <h3 className="text-lg">{topic.title}</h3>
                      {topic.summary && <p className="mt-2 text-sm text-muted">{topic.summary}</p>}
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ),
        )}

        {LEVELS.every((l) => groups[l].length === 0) && (
          <p className="text-muted">
            No notes yet. Add an <code className="font-mono">.mdx</code> file to{' '}
            <code className="font-mono">src/content/{track}/</code> to start this track.
          </p>
        )}
      </div>
    </div>
  );
}
