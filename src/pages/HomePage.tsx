import { useRef, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router';
import { topics } from '../lib/content';
import { useReveal } from '../lib/hooks';
import { topicsForTrack } from '../lib/topics';
import { TRACK_IDS } from '../lib/types';
import { ContentsIndex } from './home/ContentsIndex';
import { HeroDemo } from './home/HeroDemo';
import { NoteAnatomy } from './home/NoteAnatomy';

// "Start with…" points at the first note of the first track that has one.
const firstNote = TRACK_IDS.map((track) => topicsForTrack(topics, track)[0]).find(Boolean);
// Long titles like "From Code to Electrons: How Your Program Really Runs" get shortened for the button.
const firstNoteLabel = firstNote?.title.split(':')[0];

/** Readers this is built for, each with a concrete first note. */
const READERS = [
  {
    who: 'You are learning to code',
    need: 'You can follow a tutorial, but you could not explain why the code works.',
    help: 'Start with the language itself: what JavaScript is, and how one call stack keeps a page responsive.',
    to: '/javascript/what-is-javascript',
    cta: 'JavaScript Basics',
  },
  {
    who: 'You have a coding interview coming',
    need: 'You have memorised sorts and searches, then blanked when asked to trace one.',
    help: 'Every algorithm here runs one comparison at a time, so you can trace it before you have to explain it.',
    to: '/dsa/arrays-and-big-o',
    cta: 'Arrays and Big-O',
  },
  {
    who: 'You write code, but the machine is a black box',
    need: 'You ship features, yet “what happens when this runs” stays vague.',
    help: 'Follow one line of code down through the compiler, the CPU and logic gates to electrons.',
    to: '/fundamentals/from-code-to-electrons',
    cta: 'From Code to Electrons',
  },
];

/** The practical facts, stated plainly. */
const SPECS: [string, string][] = [
  ['Price', 'Free. No ads, no paywall, nothing to unlock.'],
  ['Account', 'None. Open a page and start reading.'],
  ['Screens', 'Phones from 360px wide up to large monitors.'],
  ['Keyboard', 'Every visual works without a mouse. Space plays, arrows step.'],
  ['Motion', 'Follows your system’s reduce-motion setting. 3D falls back to 2D.'],
  ['Colour', 'Dark and light themes. Every colour also has a shape or label.'],
  ['Speed', 'Under 200 KB of JavaScript on first load. 3D only loads when you reach it.'],
  ['Safety', 'Code you type in a playground runs in a sealed sandbox.'],
];

// Newest first. Add a line whenever something worth mentioning ships.
const LOG = [
  {
    date: '21 Nov 2026',
    text: 'Every track is now split into groups. Hover a track in the navbar, or open the menu on a phone, to see all of it.',
  },
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
      <Spotlight className="grid items-center gap-12 lg:grid-cols-[1fr_minmax(0,32rem)] lg:gap-16 xl:grid-cols-[1fr_minmax(0,36rem)] xl:gap-24">
        <div>
          <p className="stagger font-mono text-sm text-muted" style={order(0)}>
            a visual notebook for <span className="text-text">how computers work</span>,{' '}
            <span className="text-text">JavaScript</span>, <span className="text-text">DSA</span>{' '}
            and <span className="text-text">React</span>
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
            Stackscape explains programming with visuals you can run, pause and step through. You
            watch an algorithm make each decision, see which line of code made it, then check
            yourself. The idea clicks first. The code makes sense after.
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
              href="#how-it-works"
              className="font-medium text-muted underline-offset-4 hover:text-text hover:underline"
            >
              How it works
            </a>
          </div>

          <p style={order(8)} className="stagger mt-10 font-mono text-xs text-muted">
            free · no sign-up · works on any screen
          </p>
        </div>

        <div style={order(4)} className="stagger-pop relative">
          <Annotation />
          <HeroDemo />
        </div>
      </Spotlight>

      {/* ── How a note works ─────────────────────────────────── */}
      <Section
        id="how-it-works"
        kicker="How it works"
        title="Every note, the same four steps"
        intro="Learn the pattern once, and every topic after that reads the same way."
      >
        <NoteAnatomy />
      </Section>

      {/* ── Who it helps ─────────────────────────────────────── */}
      <Section
        kicker="Who it helps"
        title="Pick the line that sounds like you"
        intro="Each one has a place to start today."
      >
        <ol className="border-t border-border">
          {READERS.map((r, i) => (
            <li key={r.who} data-reveal className="border-b border-border">
              <Link
                to={r.to}
                className="group grid gap-x-10 gap-y-3 py-7 transition-colors md:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1.1fr)_auto] md:items-baseline"
              >
                <span className="font-mono text-sm text-muted">0{i + 1}</span>
                <span>
                  <span className="block font-heading text-xl font-semibold group-hover:text-accent">
                    {r.who}
                  </span>
                  <span className="mt-1.5 block text-muted">{r.need}</span>
                </span>
                <span className="leading-relaxed">{r.help}</span>
                <span className="inline-flex items-center gap-2 font-mono text-sm whitespace-nowrap text-accent-2">
                  {r.cta}
                  <span
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Contents ─────────────────────────────────────────── */}
      <Section
        id="contents"
        kicker="Everything, by track"
        title="Contents"
        intro="Read them in order, or jump straight to whatever is confusing you this week."
      >
        <ContentsIndex />
      </Section>

      {/* ── Made for everyone ────────────────────────────────── */}
      <Section
        kicker="Made for everyone"
        title="The practical bits"
        intro="No catch. These are the promises every page is checked against before it ships."
      >
        <dl className="grid border-t border-border sm:grid-cols-2 sm:gap-x-12">
          {SPECS.map(([term, detail]) => (
            <div
              key={term}
              data-reveal
              className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-4 border-b border-border py-4"
            >
              <dt className="font-mono text-sm text-muted">{term}</dt>
              <dd className="leading-snug">{detail}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* ── Why this exists ──────────────────────────────────── */}
      <Section kicker="Behind it" title="Why this exists">
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

      {/* ── Closing call to action ───────────────────────────── */}
      <section
        aria-labelledby="start-heading"
        data-reveal
        className="relative overflow-hidden rounded-card border border-border bg-elevated px-6 pt-14 pb-24 text-center shadow-glow sm:px-12 sm:pt-20 sm:pb-28"
      >
        <div
          aria-hidden="true"
          className="cta-bars absolute inset-x-0 bottom-0 flex h-16 items-end gap-1.5 px-6 opacity-60 sm:px-12"
        >
          {[3, 6, 2, 8, 5, 9, 4, 7, 1, 6, 3, 8, 5, 2, 7, 4, 9, 6].map((v, i) => (
            <span
              key={i}
              style={{ height: `${v * 10}%`, '--i': i } as CSSProperties}
              className="cta-bar flex-1 rounded-t-sm bg-accent/15"
            />
          ))}
        </div>
        <div className="relative">
          <p className="font-mono text-sm text-accent-2">ten minutes is enough</p>
          <h2 id="start-heading" className="mx-auto mt-3 max-w-[36rem] text-3xl sm:text-5xl">
            Pick the one thing that confused you this week.
          </h2>
          <p className="mx-auto mt-5 max-w-[32rem] text-lg text-muted">
            Open its note, press play, and watch it happen one step at a time.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
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
              Browse all topics
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * The hero's background: the page's dot grid lights up in the accent colour
 * around your mouse pointer. The pointer position is written straight into two
 * CSS variables (no React state), so moving the mouse never re-renders anything.
 */
function Spotlight({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const onPointerMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== 'mouse') return;
    const box = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - box.left}px`);
    el.style.setProperty('--my', `${e.clientY - box.top}px`);
    // The glowing dots must sit exactly on the page's own 22px dot grid, which
    // starts at the top-left of the document. The dot layer starts 4rem above
    // this section, so shift its pattern by its position on the page, modulo 22.
    const dots = el.firstElementChild as HTMLElement | null;
    if (dots) {
      const r = dots.getBoundingClientRect();
      const x = r.left + window.scrollX;
      const y = r.top + window.scrollY;
      el.style.setProperty('--bx', `${-(x % 22)}px`);
      el.style.setProperty('--by', `${-(y % 22)}px`);
    }
  };
  return (
    <section
      ref={ref}
      onPointerMove={onPointerMove}
      className={`hero-spotlight relative ${className}`}
    >
      <div aria-hidden="true" className="hero-spotlight-dots" />
      {children}
    </section>
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
  kicker,
  title,
  intro,
  children,
}: {
  id?: string;
  /** A small label above the heading, e.g. "The idea". */
  kicker?: string;
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
        <div data-reveal className="lg:sticky lg:top-28 lg:self-start">
          {kicker && (
            <p className="mb-3 font-mono text-xs tracking-wide text-accent-2 uppercase">{kicker}</p>
          )}
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
