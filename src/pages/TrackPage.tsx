import { useRef } from 'react';
import { Link } from 'react-router';
import { LevelChip } from '../components/LevelChip';
import { topics } from '../lib/content';
import { outlineFor, pathFor, pathPosition, type PathStep } from '../lib/curriculum';
import { useMediaQuery, useReveal } from '../lib/hooks';
import { useReadingHistory, wasVisited } from '../lib/readingHistory';
import { snakeCell, type SnakeCell } from '../lib/snake';
import { TRACKS, type Track } from '../lib/types';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * A collection's page, drawn as a learning path: modules in order, and inside
 * each one numbered steps laid out as a snake (left → right, down, right → left…). Written steps are cards you can open;
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

  // How many steps fit side by side. The path snakes across that many columns
  // and wraps; on a phone it's a single column, i.e. a plain vertical list.
  const sm = useMediaQuery('(min-width: 640px)');
  const lg = useMediaQuery('(min-width: 1024px)');
  const xl = useMediaQuery('(min-width: 1280px)');
  const cols = xl ? 4 : lg ? 3 : sm ? 2 : 1;

  const ready = path.filter((s) => s.href);
  const readCount = ready.filter((s) => wasVisited(history, track, s.slug)).length;
  const firstWritten = ready[0];
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
      <header className="mb-14 grid gap-10 border-b border-border pb-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="max-w-2xl">
          <p className="mb-3 font-mono text-xs tracking-wide text-accent-2 uppercase">
            Collection · learning path
          </p>
          <h1 className="text-4xl sm:text-5xl">{info.name}</h1>
          <p className="mt-4 text-lg text-muted">{info.tagline}</p>

          {/* The collection at a glance. */}
          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
            <Stat label="Modules" value={outline.groups.length} />
            <Stat label="Steps" value={path.length} />
            <Stat label="Ready to read" value={ready.length} />
          </dl>

          {/* Your progress, or how to use the path if you haven't started. */}
          {readCount > 0 ? (
            <div className="mt-8 max-w-md">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted">
                  Your progress
                  {/* Every step written and read: the whole collection is done. */}
                  {readCount === path.length && ready.length === path.length && (
                    <span className="ml-2 rounded-full border border-success px-2 py-0.5 font-mono text-xs text-success">
                      ✓ Completed
                    </span>
                  )}
                </span>
                <span className="font-mono text-xs text-muted">
                  {readCount} of {ready.length} read
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Steps read"
                aria-valuemin={0}
                aria-valuemax={ready.length}
                aria-valuenow={readCount}
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface"
              >
                <div
                  className="h-full rounded-full bg-success transition-[width] duration-500"
                  style={{ width: `${(readCount / Math.max(ready.length, 1)) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-8 max-w-[34rem] text-muted">
              Start at step 1 and go one step at a time; each builds on the last.
            </p>
          )}

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

        {/* A map of the modules: jump to one, and see how far along each is. */}
        <nav
          aria-label="Modules"
          className="hidden self-start rounded-card border border-border bg-elevated p-4 lg:block"
        >
          <p className="px-2 pb-2 font-mono text-xs tracking-wide text-muted uppercase">Modules</p>
          <ol>
            {outline.groups.map((g, i) => {
              const steps = path.filter((s) => s.group === g.name);
              const written = steps.filter((s) => s.href).length;
              return (
                <li key={g.name}>
                  <a
                    href={`#module-${i + 1}`}
                    className="flex items-center gap-3 rounded-btn px-2 py-2 text-[0.95rem] hover:bg-surface"
                  >
                    <span className="font-mono text-xs text-muted">{pad(i + 1)}</span>
                    <span className="min-w-0 flex-1 truncate">{g.name}</span>
                    <StepPips steps={steps} isRead={(slug) => wasVisited(history, track, slug)} />
                    <span className="sr-only">
                      , {written} of {steps.length} steps ready
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
          {/* Key for the pips. */}
          <div
            aria-hidden="true"
            className="mt-3 flex gap-4 border-t border-border px-2 pt-3 font-mono text-[0.7rem] text-muted"
          >
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-3 rounded-full bg-success" /> read
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-3 rounded-full bg-accent" /> ready
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-3 rounded-full bg-border" /> coming soon
            </span>
          </div>
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

              <SnakePath
                steps={steps}
                cols={cols}
                visited={(slug) => wasVisited(history, track, slug)}
                upNextSlug={upNext?.slug}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}

/** A big number with a small label, for the header's "at a glance" row. */
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="mt-1 font-mono text-xs tracking-wide text-muted uppercase">{label}</dt>
      <dd className="font-heading text-3xl">{value}</dd>
    </div>
  );
}

/** One small pill per step in a module: green = read, periwinkle = ready, grey = coming soon. */
function StepPips({ steps, isRead }: { steps: PathStep[]; isRead: (slug: string) => boolean }) {
  return (
    <span aria-hidden="true" className="flex shrink-0 gap-1">
      {steps.map((s) => (
        <span
          key={s.slug}
          className={`h-1.5 w-3 rounded-full ${
            !s.href ? 'bg-border' : isRead(s.slug) ? 'bg-success' : 'bg-accent'
          }`}
        />
      ))}
    </span>
  );
}

/**
 * One module's steps as boxes joined by lines, snaking across `cols` columns.
 *
 * The list stays in step order in the HTML (so Tab and screen readers go 1, 2,
 * 3…); only the CSS grid position changes. Each box draws the line *leaving*
 * it: sideways to its neighbour, or down at the end of a row.
 */
function SnakePath({
  steps,
  cols,
  visited,
  upNextSlug,
}: {
  steps: PathStep[];
  cols: number;
  visited: (slug: string) => boolean;
  upNextSlug?: string;
}) {
  return (
    <ol
      className="grid gap-x-10 gap-y-10"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {steps.map((s, i) => {
        const cell = snakeCell(i, steps.length, cols);
        return (
          <li
            key={s.slug}
            data-reveal
            className="relative flex"
            // Grid lines are 1-based, the layout helper is 0-based.
            style={{ gridRow: cell.row + 1, gridColumn: cell.col + 1 }}
          >
            <Step step={s} visited={visited(s.slug)} upNext={s.slug === upNextSlug} />
            {cell.exit !== 'end' && <Connector exit={cell.exit} done={visited(s.slug)} />}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The line out of a box, filling the 2.5rem gap (gap-x-10 / gap-y-10) to the
 * next one, with a small arrowhead in the middle showing which way to go.
 * It turns green once you've read the step it leaves from.
 */
function Connector({ exit, done }: { exit: Exclude<SnakeCell['exit'], 'end'>; done: boolean }) {
  const place = {
    right: 'top-1/2 left-full h-0.5 w-10 -translate-y-1/2',
    left: 'top-1/2 right-full h-0.5 w-10 -translate-y-1/2',
    down: 'top-full left-1/2 h-10 w-0.5 -translate-x-1/2',
  }[exit];
  const rotate = { right: 0, down: 90, left: 180 }[exit];

  return (
    <span
      aria-hidden="true"
      className={`absolute ${place} ${done ? 'bg-success/70 text-success' : 'bg-border text-muted'}`}
    >
      <svg
        viewBox="0 0 10 10"
        className="absolute top-1/2 left-1/2 size-3 -translate-1/2 bg-bg"
        style={{ rotate: `${rotate}deg` }}
      >
        <path d="M3 1.5L6.5 5 3 8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </span>
  );
}

function Step({ step, visited, upNext }: { step: PathStep; visited: boolean; upNext: boolean }) {
  // The number badge: mint = read next, green tick = read, ring = ready, dashed = not written yet.
  const badge = upNext
    ? 'border-accent-2 bg-accent-2 text-bg path-pulse'
    : visited
      ? 'border-success bg-success text-bg'
      : step.href
        ? 'border-accent text-accent'
        : 'border-dashed border-muted/60 text-muted';

  const number = (
    <span
      aria-hidden="true"
      className={`grid size-8 shrink-0 place-items-center rounded-full border-2 font-mono text-xs ${badge}`}
    >
      {visited && !upNext ? (
        <svg viewBox="0 0 12 12" className="size-3.5">
          <path d="M2.5 6.5l2.2 2.2 4.8-5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      ) : (
        pad(step.step)
      )}
    </span>
  );

  if (!step.href) {
    return (
      <div className="flex w-full flex-col rounded-card border border-dashed border-border p-5 text-muted">
        <div className="flex items-center gap-3">
          {number}
          <span className="font-mono text-xs">Step {pad(step.step)}</span>
          <span className="ml-auto rounded-full border border-dashed border-border px-2 py-0.5 font-mono text-[0.7rem]">
            coming soon
          </span>
        </div>
        <h3 className="mt-3 text-lg text-muted">{step.title}</h3>
        {step.blurb && <p className="mt-1 text-sm text-muted/80">{step.blurb}</p>}
      </div>
    );
  }

  return (
    <Link
      to={step.href}
      className={`group flex w-full flex-col rounded-card border bg-elevated p-5 transition-[border-color,box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-glow ${
        upNext ? 'border-accent-2/70 shadow-glow' : 'border-border'
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {number}
        <span className="font-mono text-xs text-muted">Step {pad(step.step)}</span>
        {upNext && (
          <span className="rounded-full bg-accent-2/15 px-2 py-0.5 font-mono text-xs text-accent-2">
            up next
          </span>
        )}
        {visited && !upNext && <span className="font-mono text-xs text-success">read</span>}
      </div>
      <h3 className="mt-3 text-lg group-hover:text-accent">{step.title}</h3>
      {step.summary && <p className="mt-2 line-clamp-3 text-sm text-muted">{step.summary}</p>}
      {/* mt-auto pins this row to the bottom, so boxes in a row line up. */}
      <div className="mt-auto flex items-center gap-3 pt-4">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
          {visited ? 'Read again' : 'Start'} <span aria-hidden="true">→</span>
        </span>
        <span className="ml-auto">{step.level && <LevelChip level={step.level} />}</span>
      </div>
    </Link>
  );
}
