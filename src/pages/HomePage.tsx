import { Link } from 'react-router';
import { topics } from '../lib/content';
import { topicsForTrack } from '../lib/topics';
import { TRACKS, type Track } from '../lib/types';

export function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero. Phase 3 replaces the right side with the lazy-loaded 3D constellation. */}
      <section className="max-w-3xl">
        <p className="mb-4 font-mono text-sm text-accent-2">visual notes · react · dsa</p>
        <h1 className="text-4xl sm:text-6xl">
          Learn by <span className="text-accent">watching</span> it happen.
        </h1>
        <p className="mt-6 max-w-[60ch] text-lg text-muted">
          Short, friendly notes with interactive visuals you can play, pause, and step through.
          Change the input and see how the algorithm or React concept responds.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/dsa"
            className="rounded-btn bg-accent px-5 py-2.5 font-medium text-bg shadow-glow transition-opacity hover:opacity-90"
          >
            Start with DSA
          </Link>
          <Link
            to="/react"
            className="rounded-btn border border-border bg-elevated px-5 py-2.5 font-medium transition-colors hover:border-accent"
          >
            Explore React
          </Link>
        </div>
      </section>

      <section aria-labelledby="tracks-heading">
        <h2 id="tracks-heading" className="mb-6 text-2xl">
          Two tracks
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <TrackCard track="dsa" />
          <TrackCard track="react" />
        </div>
      </section>
    </div>
  );
}

function TrackCard({ track }: { track: Track }) {
  const count = topicsForTrack(topics, track).length;
  const info = TRACKS[track];
  return (
    <Link
      to={`/${track}`}
      className="group block rounded-card border border-border bg-elevated p-6 transition-[border-color,box-shadow] hover:border-accent/60 hover:shadow-glow sm:p-8"
    >
      <p className="font-mono text-xs uppercase tracking-wider text-muted">
        {count} {count === 1 ? 'topic' : 'topics'}
      </p>
      <h3 className="mt-2 text-2xl">{info.name}</h3>
      <p className="mt-2 text-muted">{info.tagline}</p>
      <p className="mt-6 text-sm font-medium text-accent">
        Open track{' '}
        <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
      </p>
    </Link>
  );
}
