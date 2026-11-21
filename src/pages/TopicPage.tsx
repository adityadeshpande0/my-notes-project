import { Suspense, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import type { MDXProps } from 'mdx/types';
import { Chip } from '../components/Chip';
import { LevelChip } from '../components/LevelChip';
import { mdxComponents } from '../components/mdx-components';
import { getNote, getTopic, topics } from '../lib/content';
import { useReveal } from '../lib/hooks';
import { pathPosition, type PathStep } from '../lib/curriculum';
import { markVisited } from '../lib/readingHistory';
import { TRACKS, type TopicMeta, type Track } from '../lib/types';
import { NotFoundPage } from './NotFoundPage';
import { NoteSkeleton } from './topic/NoteSkeleton';
import { ReadingProgress } from './topic/ReadingProgress';
import { PathNav } from './topic/PathNav';
import { TableOfContents, type Heading } from './topic/TableOfContents';

interface Outline {
  headings: Heading[];
  minutes: number;
}

export function TopicPage({ track }: { track: Track }) {
  // useParams reads the `:slug` part of the URL, e.g. "binary-search".
  const { slug = '' } = useParams();
  const topic = getTopic(track, slug);
  const Note = getNote(track, slug);

  if (!topic || !Note) return <NotFoundPage />;

  // `key` makes React start fresh (new state, new effects) when the slug changes.
  return <TopicLayout key={slug} topic={topic} Note={Note} />;
}

function TopicLayout({ topic, Note }: { topic: TopicMeta; Note: ComponentType<MDXProps> }) {
  const articleRef = useRef<HTMLElement>(null);
  const [outline, setOutline] = useState<Outline>({ headings: [], minutes: 0 });
  // Where this note sits on its collection's learning path.
  const { current, prev, next, upcoming } = pathPosition(topics, topic.track, topic.slug);
  const trackName = TRACKS[topic.track].name;

  // Remember this step was read, so the path can tick it and offer "continue".
  useEffect(() => markVisited(topic.track, topic.slug), [topic.track, topic.slug]);

  return (
    <>
      <ReadingProgress target={articleRef} />

      <div className="grid gap-x-12 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)] xl:gap-x-16 2xl:grid-cols-[15rem_minmax(0,64rem)_17rem] 2xl:justify-between">
        {/* ── Left: the learning path, with this page's sections nested (desktop) ── */}
        <aside className="hidden lg:block" aria-label="Learning path">
          <div
            data-path-scroll
            className="sticky top-24 max-h-[calc(100dvh-7.5rem)] overflow-y-auto overscroll-contain pr-2 pb-6"
          >
            <PathNav track={topic.track} slug={topic.slug} headings={outline.headings} />
          </div>
        </aside>

        {/* ── Middle: the note ─────────────────────────────── */}
        <article ref={articleRef} className="min-w-0">
          <header className="mb-12 border-b border-border pb-10">
            <nav aria-label="Breadcrumb" className="mb-6 font-mono text-xs text-muted lg:hidden">
              <Link to={`/${topic.track}`} className="hover:text-text">
                {trackName}
              </Link>
              {current && (
                <>
                  <span aria-hidden="true"> / </span>
                  <span>{current.group}</span>
                </>
              )}
            </nav>
            <p className="mb-4 font-mono text-xs text-muted">
              {TRACKS[topic.track].short}
              {current && (
                <>
                  {' '}
                  · {current.group} · step {String(current.step).padStart(2, '0')}
                </>
              )}
              {outline.minutes > 0 && <> · {outline.minutes} min read</>}
            </p>
            <h1 className="max-w-[56rem] text-[2.5rem] leading-[1.08] tracking-tight sm:text-[3.25rem] 2xl:text-[3.75rem]">
              {topic.title}
            </h1>
            {topic.summary && (
              <p className="mt-5 max-w-[50rem] text-xl leading-relaxed text-muted">
                {topic.summary}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-2 2xl:hidden">
              <LevelChip level={topic.level} />
              {topic.complexity?.time && <Chip>time {topic.complexity.time}</Chip>}
              {topic.complexity?.space && <Chip>space {topic.complexity.space}</Chip>}
            </div>
          </header>

          {/* Phones and tablets: the contents list folds away at the top. */}
          {outline.headings.length > 0 && (
            <details className="group mb-10 rounded-card border border-border bg-elevated lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 font-mono text-xs tracking-wide text-muted uppercase">
                On this page
                <span className="transition-transform group-open:rotate-180" aria-hidden="true">
                  ▾
                </span>
              </summary>
              <div className="px-5 pb-4">
                <TableOfContents headings={outline.headings} />
              </div>
            </details>
          )}

          {/* The note is a lazy component: Suspense shows the fallback while its chunk downloads. */}
          <Suspense fallback={<NoteSkeleton />}>
            <NoteBody Note={Note} onOutline={setOutline} />
          </Suspense>

          <PathPager track={topic.track} prev={prev} next={next} upcoming={upcoming} />
        </article>

        {/* ── Right: at a glance (wide screens) ────────────── */}
        <aside className="hidden 2xl:block" aria-label="At a glance">
          <div className="sticky top-24 space-y-8">
            <dl className="divide-y divide-border rounded-card border border-border bg-elevated text-sm">
              <GlanceRow label="Level">
                <LevelChip level={topic.level} />
              </GlanceRow>
              {topic.complexity?.time && (
                <GlanceRow label="Time">{topic.complexity.time}</GlanceRow>
              )}
              {topic.complexity?.space && (
                <GlanceRow label="Space">{topic.complexity.space}</GlanceRow>
              )}
              {outline.minutes > 0 && <GlanceRow label="Reading">{outline.minutes} min</GlanceRow>}
            </dl>

            {topic.tags.length > 0 && (
              <div>
                <p className="mb-3 font-mono text-xs tracking-wide text-muted uppercase">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {topic.tags.map((tag) => (
                    <Chip key={tag}>{tag}</Chip>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm leading-relaxed text-muted">
              <span className="underline decoration-accent/60 decoration-dotted decoration-[1.5px] underline-offset-4">
                Dotted words
              </span>{' '}
              have a short explanation. Hover, tap, or tab to them.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

/**
 * Renders the note, then reads its headings and word count from the DOM to
 * build the table of contents and reading time. The effect only runs once the
 * lazy note has actually loaded and been put on the page.
 */
function NoteBody({
  Note,
  onOutline,
}: {
  Note: ComponentType<MDXProps>;
  onOutline: (o: Outline) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Visuals, code, tables, callouts and section headings fade up as you reach them.
  // Plain paragraphs and lists stay put, so reading never waits on an animation.
  useReveal(ref, ':scope > :not(p, ul, ol)');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const headings = [...el.querySelectorAll('h2[id]')].map((h) => ({
      id: h.id,
      text: h.textContent ?? '',
    }));
    const words = (el.textContent ?? '').trim().split(/\s+/).length;
    onOutline({ headings, minutes: Math.max(1, Math.round(words / 200)) });
  }, [Note, onOutline]);

  return (
    <div ref={ref} className="prose">
      <Note components={mdxComponents} />
    </div>
  );
}

function GlanceRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-mono text-xs text-text">{children}</dd>
    </div>
  );
}

/**
 * The end of a note: where to go next on the path. The next step is the big
 * card. If the very next step isn't written yet, say so, and still offer the
 * next written one (or the way back to the path).
 */
function PathPager({
  track,
  prev,
  next,
  upcoming,
}: {
  track: Track;
  prev?: PathStep;
  next?: PathStep;
  upcoming?: PathStep;
}) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const upcomingIsPlanned = upcoming && !upcoming.href;
  return (
    <nav aria-label="Learning path" className="mt-20 border-t border-border pt-10">
      <p className="mb-4 font-mono text-xs tracking-wide text-muted uppercase">Continue the path</p>

      {upcomingIsPlanned && (
        <div className="mb-4 rounded-card border border-dashed border-border p-5">
          <p className="font-mono text-xs text-muted">
            Next · step {pad(upcoming.step)} · {upcoming.group}
          </p>
          <p className="mt-1 font-heading text-lg font-semibold text-muted">{upcoming.title}</p>
          <p className="mt-1 text-sm text-muted">Coming soon. It&rsquo;s being written now.</p>
        </div>
      )}

      <div className={`grid gap-4 ${prev ? 'sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]' : ''}`}>
        {prev ? (
          <Link
            to={prev.href!}
            className="group rounded-card border border-border p-5 transition-colors hover:border-accent/60 hover:bg-elevated"
          >
            <span className="block font-mono text-xs text-muted">
              ← Previous · step {pad(prev.step)}
            </span>
            <span className="mt-1 block font-heading text-lg font-semibold group-hover:text-accent">
              {prev.title}
            </span>
          </Link>
        ) : null}
        {next ? (
          <Link
            to={next.href!}
            className="group rounded-card border border-accent-2/60 bg-elevated p-5 shadow-glow transition-[border-color,translate] duration-200 hover:-translate-y-0.5 hover:border-accent-2 sm:p-6"
          >
            <span className="block font-mono text-xs text-accent-2">
              {upcomingIsPlanned ? 'Next ready step' : 'Next step'} · step {pad(next.step)} ·{' '}
              {next.group} →
            </span>
            <span className="mt-1.5 block font-heading text-xl font-semibold group-hover:text-accent">
              {next.title}
            </span>
            {next.summary && <span className="mt-2 block text-sm text-muted">{next.summary}</span>}
          </Link>
        ) : (
          <Link
            to={`/${track}`}
            className="group rounded-card border border-border bg-elevated p-5 transition-colors hover:border-accent/60 sm:p-6"
          >
            <span className="block font-mono text-xs text-muted">
              You&rsquo;re at the newest step
            </span>
            <span className="mt-1.5 block font-heading text-xl font-semibold group-hover:text-accent">
              See the whole {TRACKS[track].name} path →
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}
