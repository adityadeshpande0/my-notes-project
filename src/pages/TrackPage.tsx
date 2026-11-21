import { useRef } from 'react';
import { Link } from 'react-router';
import { LevelChip } from '../components/LevelChip';
import { topics } from '../lib/content';
import { outlineFor, pathFor, pathPosition, type PathStep } from '../lib/curriculum';
import { useReveal } from '../lib/hooks';
import { useReadingHistory, wasVisited } from '../lib/readingHistory';
import { TRACKS, type Track } from '../lib/types';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * A collection's page, drawn as a learning path: modules in order, and inside
 * each one numbered steps on a line. Written steps are cards you can open;
 * planned ones are marked "coming soon". Steps you've read get a tick, and the
 * step to read next is highlighted.
 */
export function TrackPage({ track }: { track: Track }) {
  const info = TRACKS[track];
  const outline = outlineFor(topics, track);
  const path = pathFor(topics, track);
  const history = useReadingHistory();
  const listRef = useRef<HTMLDivElement>(null);
  useReveal(listRef);

  const firstWritten = path.find((s) => s.href);
  // "Up next": the written step after the last one you opened here, or step 1.
  // If you've already reached the newest written step, there is no "up next";
  // the button offers to read it again instead.
  const lastSlug = history.last[track];
  const lastStep = path.find((s) => s.slug === lastSlug && s.href);
  const nextAfterLast = lastStep ? pathPosition(topics, track, lastStep.slug).next : undefined;
  const resuming = Boolean(lastStep);
  const target = resuming ? (nextAfterLast ?? lastStep) : firstWritten;
  const upNext = resuming ? nextAfterLast : firstWritten;
  const buttonLabel = !resuming
    ? 'Start the path'
    : nextAfterLast
      ? `Continue: ${nextAfterLast.title}`
      : `Read again: ${lastStep!.title}`;

  return (
    <div>
      {/* ── Header ───────────────────────────────────────── */}
      <header className="mb-14 grid gap-10 border-b border-border pb-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
        <div className="max-w-3xl">
          <p className="mb-3 font-mono text-xs tracking-wide text-accent-2 uppercase">
            Collection · learning path
          </p>
          <h1 className="text-4xl sm:text-5xl">{info.name}</h1>
          <p className="mt-4 text-lg text-muted">{info.tagline}</p>
          <p className="mt-3 max-w-[40rem] text-muted">
            Start at step 1 and move forward one step at a time. Each step builds on the ones before
            it. Steps marked “coming soon” are being written.
          </p>

          {target?.href && (
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                to={target.href}
                className="group inline-flex items-center gap-2 rounded-btn bg-text px-5 py-3 font-medium text-bg transition-opacity hover:opacity-90"
              >
                {buttonLabel}
                <span
                  className="transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
              {resuming && firstWritten?.href && firstWritten.slug !== target.slug && (
                <Link to={firstWritten.href} className="font-medium text-muted hover:text-text">
                  Start from step 1
                </Link>
              )}
            </div>
          )}
        </div>

        {/* A small map of the modules, to jump around. */}
        <nav
          aria-label="Modules"
          className="hidden rounded-card border border-border bg-elevated p-5 lg:block"
        >
          <p className="mb-3 font-mono text-xs tracking-wide text-muted uppercase">Modules</p>
          <ol className="space-y-1">
            {outline.groups.map((g, i) => (
              <li key={g.name}>
                <a
                  href={`#module-${i + 1}`}
                  className="flex gap-3 rounded-btn px-2 py-1.5 text-[0.95rem] hover:bg-surface"
                >
                  <span className="font-mono text-xs leading-6 text-muted">{pad(i + 1)}</span>
                  {g.name}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      {/* ── The path ─────────────────────────────────────── */}
      <div ref={listRef} className="space-y-16">
        {outline.groups.map((g, gi) => {
          const steps = path.filter((s) => s.group === g.name);
          return (
            <section
              key={g.name}
              id={`module-${gi + 1}`}
              aria-labelledby={`module-${gi + 1}-title`}
              className="scroll-mt-24"
            >
              <div data-reveal className="mb-6 flex items-baseline gap-4">
                <span className="shrink-0 rounded-full border border-border px-3 py-1 font-mono text-xs whitespace-nowrap text-muted">
                  Module {pad(gi + 1)}
                </span>
                <h2 id={`module-${gi + 1}-title`} className="text-2xl sm:text-3xl">
                  {g.name}
                </h2>
              </div>

              {/* The line runs down the left; each step sits on it as a dot. */}
              <ol className="relative ml-3 border-l-2 border-border sm:ml-4">
                {steps.map((s) => (
                  <Step
                    key={s.slug}
                    step={s}
                    visited={wasVisited(history, track, s.slug)}
                    upNext={s.slug === upNext?.slug}
                  />
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Step({ step, visited, upNext }: { step: PathStep; visited: boolean; upNext: boolean }) {
  // The dot on the line: mint ring = read next, green tick = read, dashed = not written yet.
  const dot = upNext
    ? 'border-accent-2 bg-accent-2 path-pulse'
    : visited
      ? 'border-success bg-success'
      : step.href
        ? 'border-accent bg-bg'
        : 'border-dashed border-muted/60 bg-bg';

  return (
    <li data-reveal className="relative pb-6 pl-8 last:pb-0 sm:pl-10">
      <span
        aria-hidden="true"
        className={`absolute top-5 -left-[9px] grid size-4 place-items-center rounded-full border-2 ${dot}`}
      >
        {visited && !upNext && (
          <svg viewBox="0 0 12 12" className="size-2.5 text-bg">
            <path d="M2.5 6.5l2.2 2.2 4.8-5" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        )}
      </span>

      {step.href ? (
        <Link
          to={step.href}
          className={`group block rounded-card border bg-elevated p-5 transition-[border-color,box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-glow sm:p-6 ${
            upNext ? 'border-accent-2/70 shadow-glow' : 'border-border'
          }`}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-mono text-xs text-muted">Step {pad(step.step)}</span>
            {upNext && (
              <span className="rounded-full bg-accent-2/15 px-2 py-0.5 font-mono text-xs text-accent-2">
                up next
              </span>
            )}
            {visited && !upNext && <span className="font-mono text-xs text-success">✓ read</span>}
            <span className="ml-auto">{step.level && <LevelChip level={step.level} />}</span>
          </div>
          <h3 className="mt-2 text-xl group-hover:text-accent">{step.title}</h3>
          {step.summary && <p className="mt-2 max-w-[46rem] text-muted">{step.summary}</p>}
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
            {visited ? 'Read again' : 'Start this step'} <span aria-hidden="true">→</span>
          </span>
        </Link>
      ) : (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3.5 text-muted">
          <span className="font-mono text-xs">Step {pad(step.step)}</span>
          <span className="text-[1.05rem]">{step.title}</span>
          <span className="rounded-full border border-dashed border-border px-2 py-0.5 font-mono text-[0.7rem]">
            coming soon
          </span>
        </div>
      )}
    </li>
  );
}
