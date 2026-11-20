import { Suspense } from 'react';
import { Link, useParams } from 'react-router';
import { Chip } from '../components/Chip';
import { LevelChip } from '../components/LevelChip';
import { mdxComponents } from '../components/mdx-components';
import { getNote, getTopic, topics } from '../lib/content';
import { neighbours } from '../lib/topics';
import { TRACKS, type Track } from '../lib/types';
import { NotFoundPage } from './NotFoundPage';

export function TopicPage({ track }: { track: Track }) {
  // useParams reads the `:slug` part of the URL, e.g. "binary-search".
  const { slug = '' } = useParams();
  const topic = getTopic(track, slug);
  const Note = getNote(track, slug);

  if (!topic || !Note) return <NotFoundPage />;

  const { prev, next } = neighbours(topics, track, slug);

  return (
    <article className="mx-auto max-w-[70ch]">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <Link to={`/${track}`} className="hover:text-text">
          {TRACKS[track].name}
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-text">{topic.title}</span>
      </nav>

      <header className="mb-10">
        <h1 className="text-4xl sm:text-5xl">{topic.title}</h1>
        {topic.summary && <p className="mt-4 text-lg text-muted">{topic.summary}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <LevelChip level={topic.level} />
          {topic.complexity?.time && <Chip>time {topic.complexity.time}</Chip>}
          {topic.complexity?.space && <Chip>space {topic.complexity.space}</Chip>}
        </div>
      </header>

      {/* The note is a lazy component: Suspense shows the fallback while its chunk downloads. */}
      <Suspense fallback={<p className="text-muted">Loading note…</p>}>
        <div className="prose">
          {/* `Note` isn't created here: getNote() returns a React.lazy component built once in
              lib/content.ts, so React sees the same component on every render. The lint rule
              can't see that from this file. */}
          {/* eslint-disable-next-line react-hooks/static-components */}
          <Note components={mdxComponents} />
        </div>
      </Suspense>

      <nav
        aria-label="More topics"
        className="mt-16 grid gap-4 border-t border-border pt-8 sm:grid-cols-2"
      >
        {prev ? (
          <Link
            to={`/${track}/${prev.slug}`}
            className="rounded-card border border-border bg-elevated p-4 hover:border-accent/60"
          >
            <span className="block text-xs text-muted">← Previous</span>
            {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            to={`/${track}/${next.slug}`}
            className="rounded-card border border-border bg-elevated p-4 text-right hover:border-accent/60"
          >
            <span className="block text-xs text-muted">Next →</span>
            {next.title}
          </Link>
        )}
      </nav>
    </article>
  );
}
