import { useRef, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router';
import { topics } from '../lib/content';
import { useReveal } from '../lib/hooks';
import { PLANNED } from '../lib/roadmap';
import { topicsForTrack } from '../lib/topics';
import { TRACK_IDS } from '../lib/types';
import { ContentsIndex } from './home/ContentsIndex';
import { HeroDemo } from './home/HeroDemo';
import { ReadingKey } from './home/ReadingKey';

const writtenCount = topics.length;
const plannedCount = TRACK_IDS.reduce((sum, track) => {
  const written = new Set(topics.filter((t) => t.track === track).map((t) => t.slug));
  return sum + PLANNED[track].filter((p) => !written.has(p.slug)).length;
}, 0);

// "Start with…" points at the first note of the first track that has one.
const firstNote = TRACK_IDS.map((track) => topicsForTrack(topics, track)[0]).find(Boolean);
// Long titles like "From Code to Electrons: How Your Program Really Runs" get shortened for the button.
const firstNoteLabel = firstNote?.title.split(':')[0];

// Newest first. Add a line whenever something worth mentioning ships.
const LOG = [
  {
    date: '21 Nov 2026',
    text: 'New JavaScript track. First note: JavaScript Basics, with an event loop you can step through and a sandboxed playground.',
  },
  {
    date: '20 Nov 2026',
    text: 'First long read: From Code to Electrons. Eight interactive visuals, from compiler to transistor.',
  },
  {
    date: '20 Nov 2026',
    text: 'Live bubble sort on the front page. Press the arrows, it waits for you.',
  },
  { date: '20 Nov 2026', text: 'First note written: Arrays and Big-O.' },
  { date: '20 Nov 2026', text: 'The site exists. Dark mode works. Light mode too.' },
];

export function HomePage() {
  const pageRef = useRef<HTMLDivElement>(null);
  useReveal(pageRef); // everything marked `data-reveal` below fades up on scroll

  return (
    <div ref={pageRef} className="space-y-24 sm:space-y-32">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="grid items-center gap-12 lg:grid-cols-[1fr_minmax(0,32rem)] lg:gap-16 xl:grid-cols-[1fr_minmax(0,36rem)] xl:gap-24">
        <div>
          <p className="stagger font-mono text-sm text-muted" style={order(0)}>
            a visual notebook for <span className="text-text">how computers work</span>,{' '}
            <span className="text-text">DSA</span> and <span className="text-text">React</span>
          </p>

          {/* Each word is its own span so they can rise in one after another. */}
          <h1 className="mt-5 text-[2.6rem] leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.25rem] xl:text-[5rem]">
            <Word i={1}>Notes</Word> <Word i={2}>you</Word> <Word i={3}>can</Word>{' '}
            <Word i={4}>press</Word>{' '}
            <span
              style={order(5)}
              className="key-pop inline-flex translate-y-[-0.08em] items-center gap-[0.25em] rounded-[0.22em] border border-b-[0.09em] border-border bg-elevated px-[0.3em] py-[0.02em] align-middle text-[0.62em] font-semibold text-accent-2"
            >
              <svg viewBox="0 0 24 24" className="size-[0.7em]" aria-hidden="true">
                <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />
              </svg>
              play
            </span>{' '}
            <Word i={6}>on.</Word>
          </h1>

          <p
            style={order(6)}
            className="stagger mt-7 max-w-[34rem] text-lg leading-relaxed text-muted"
          >
            Every note comes with a visual you can run, pause, and step through one comparison at a
            time. The idea clicks first. The code makes sense after.
          </p>

          <div
            style={order(7)}
            className="stagger mt-9 flex flex-wrap items-center gap-x-6 gap-y-4"
          >
            {firstNote && (
              <Link
                to={`/${firstNote.track}/${firstNote.slug}`}
                className="group inline-flex items-center gap-2 rounded-btn bg-text px-5 py-3 font-medium text-bg transition-opacity hover:opacity-90"
              >
                Start with {firstNoteLabel}
                <span
                  className="transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            )}
            <a
              href="#contents"
              className="font-medium text-muted underline-offset-4 hover:text-text hover:underline"
            >
              See all topics
            </a>
          </div>

          <p style={order(8)} className="stagger mt-10 font-mono text-xs text-muted">
            {writtenCount} {writtenCount === 1 ? 'note' : 'notes'} written · {plannedCount} on the
            way · free, no sign-up
          </p>
        </div>

        <div style={order(4)} className="stagger-pop relative">
          <Annotation />
          <HeroDemo />
        </div>
      </section>

      {/* ── Contents ─────────────────────────────────────────── */}
      <Section
        id="contents"
        title="Contents"
        intro="Read them in order, or jump straight to whatever is confusing you this week."
      >
        <ContentsIndex />
      </Section>

      {/* ── Reading key ──────────────────────────────────────── */}
      <Section
        title="Reading the visuals"
        intro="Colours mean the same thing on every page. Each one also has its own mark, so colour is never the only clue."
      >
        <ReadingKey />
      </Section>

      {/* ── Why this exists ──────────────────────────────────── */}
      <Section title="Why this exists">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
          <div data-reveal className="max-w-[38rem] space-y-5 text-lg leading-relaxed">
            <p>
              Most explanations of bubble sort show you the finished code and a diagram of the
              result. What actually helps is watching the middle: which two values got compared, why
              one moved, and what changed after.
            </p>
            <p className="text-muted">
              That&rsquo;s what these notes are for. They&rsquo;re written while learning, so they
              stay close to the questions a beginner really asks. When something here is wrong or
              unclear, it gets rewritten.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-mono text-xs font-normal tracking-wide text-muted uppercase">
              Notebook log
            </h3>
            <ol className="space-y-4 border-l border-border">
              {LOG.map((entry, i) => (
                <li key={i} data-reveal className="relative pl-5">
                  <span
                    aria-hidden="true"
                    className={`log-dot absolute top-[0.55em] -left-[4.5px] size-2 rounded-full ${i === 0 ? 'bg-accent-2' : 'bg-border'}`}
                  />
                  <p className="font-mono text-xs text-muted">{entry.date}</p>
                  <p className="mt-0.5 text-[0.95rem] leading-snug">{entry.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>
    </div>
  );
}

/** Position in the hero's entrance sequence. A CSS variable can be set like any style. */
function order(i: number) {
  return { '--i': i } as CSSProperties;
}

/** One word of the headline, rising in at position `i`. */
function Word({ i, children }: { i: number; children: ReactNode }) {
  return (
    <span style={order(i)} className="hero-word">
      {children}
    </span>
  );
}

/** A full-width rule with the heading and intro on the left, content on the right (on wide screens). */
function Section({
  id,
  title,
  intro,
  children,
}: {
  id?: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  const headingId = `${title.toLowerCase().replace(/\W+/g, '-')}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="scroll-mt-24 border-t border-border pt-8"
    >
      <div className="grid gap-x-16 gap-y-8 lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">
        <div data-reveal>
          <h2 id={headingId} className="text-2xl sm:text-3xl">
            {title}
          </h2>
          {intro && <p className="mt-3 max-w-[30rem] text-muted">{intro}</p>}
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

/** A hand-drawn style note pointing at the demo (wide screens only). */
function Annotation() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-11 right-2 hidden items-end gap-1 font-mono text-xs text-muted lg:flex"
    >
      <span className="mb-4">it&rsquo;s live. space pauses, arrows step</span>
      <svg
        viewBox="0 0 40 40"
        className="size-9 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      >
        <path d="M4 10c14-2 24 6 26 22" />
        <path d="M24 27l6 6 4-8" />
      </svg>
    </div>
  );
}
