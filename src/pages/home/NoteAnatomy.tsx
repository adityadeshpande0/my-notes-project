import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/**
 * "How a note works": four short steps on the left. On wide screens a sticky
 * preview on the right changes as each step scrolls past the middle of the
 * screen. On phones each step simply shows its own preview underneath.
 */

const PARTS: { title: string; text: string; preview: () => ReactNode }[] = [
  {
    title: 'Start with a picture in your head',
    text: 'Every note opens with a plain-language image before any jargon: a stack of plates, a waiter and a kitchen, a relay race. Hard words get a dotted underline. Hover or tap one for a one-line definition.',
    preview: IntuitionPreview,
  },
  {
    title: 'Watch it run',
    text: 'Then comes a visual you control. Play it, pause it, step backwards, drag to any moment. Colours mean the same thing on every page, so you only learn them once.',
    preview: VisualPreview,
  },
  {
    title: 'Read the code beside it',
    text: 'The line that is running lights up as the visual moves, so you can see exactly which line caused which change. The code stops being a wall of text.',
    preview: CodePreview,
  },
  {
    title: 'Check yourself',
    text: 'A few questions close every note. Each answer explains why, so a wrong guess still teaches you something.',
    preview: QuizPreview,
  },
];

export function NoteAnatomy() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  // Watch a thin band across the middle of the screen. Whichever step is
  // crossing it becomes the active one. The observer is created once and
  // cleaned up when the page unmounts.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.part));
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    for (const el of refs.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Preview = PARTS[active].preview;

  return (
    <div className="grid gap-x-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
      <ol className="space-y-14 lg:space-y-0">
        {PARTS.map((part, i) => {
          const Mini = part.preview;
          return (
            <li
              key={part.title}
              data-part={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              data-reveal
              className="lg:flex lg:min-h-[42vh] lg:items-center"
            >
              <div
                className={`border-l-2 pl-6 transition-[border-color,opacity] duration-500 ${
                  active === i ? 'border-accent-2' : 'border-border lg:opacity-45'
                }`}
              >
                <p className="font-mono text-xs text-muted">
                  {String(i + 1).padStart(2, '0')} / {String(PARTS.length).padStart(2, '0')}
                </p>
                <h3 className="mt-2 text-xl sm:text-2xl">{part.title}</h3>
                <p className="mt-3 max-w-[34rem] leading-relaxed text-muted">{part.text}</p>
                {/* Phones and tablets: the preview sits right under its step. */}
                <div className="mt-6 lg:hidden" aria-hidden="true">
                  <Frame step={i}>
                    <Mini />
                  </Frame>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Wide screens: one sticky preview that follows the active step. */}
      <div className="hidden lg:block" aria-hidden="true">
        <div className="sticky top-[calc(50vh-11rem)]">
          <Frame step={active}>
            {/* `key` remounts the preview, which replays its entrance animation. */}
            <div key={active} className="anatomy-swap">
              <Preview />
            </div>
          </Frame>
        </div>
      </div>
    </div>
  );
}

function Frame({ step, children }: { step: number; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-elevated shadow-glow">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 font-mono text-xs text-muted">
        <span>
          <span className="text-text">a-note</span>.mdx
        </span>
        <span className="flex gap-1.5">
          {PARTS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-5 rounded-full transition-colors duration-300 ${
                i <= step ? 'bg-accent-2' : 'bg-border'
              }`}
            />
          ))}
        </span>
      </div>
      <div className="min-h-[15rem] p-5 sm:p-6">{children}</div>
    </div>
  );
}

// ─── The four little previews: plain HTML and CSS, no libraries ─────────────

function IntuitionPreview() {
  return (
    <div className="space-y-4">
      <p className="leading-relaxed">
        JavaScript has one{' '}
        <span className="underline decoration-accent decoration-dotted decoration-[1.5px] underline-offset-4">
          call stack
        </span>
        . Think of a pile of plates: a new call goes on top, and it always works on the top plate.
      </p>
      <div className="anatomy-pop max-w-[19rem] rounded-btn border border-border bg-bg p-3.5 text-sm">
        <p className="font-mono text-xs text-accent">Call stack</p>
        <p className="mt-1 leading-snug text-muted">
          The list of functions running right now. The newest is on top.
        </p>
      </div>
      <div className="flex flex-col-reverse items-start gap-1.5">
        {['main()', 'greet()', 'console.log()'].map((f, i) => (
          <span
            key={f}
            style={{ '--i': i } as CSSProperties}
            className={`anatomy-plate rounded-full border px-4 py-1 font-mono text-xs ${
              i === 2 ? 'border-accent-2 bg-accent-2/10 text-text' : 'border-border text-muted'
            }`}
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

function VisualPreview() {
  const bars = [4, 7, 2, 9, 5];
  return (
    <div>
      <div className="flex h-36 items-end gap-2.5">
        {bars.map((v, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t-md ${
              i === 1
                ? 'anatomy-swap-a bg-warn'
                : i === 2
                  ? 'anatomy-swap-b bg-warn'
                  : 'bg-accent/35'
            }`}
            style={{ height: `${v * 10}%` }}
          />
        ))}
      </div>
      <p className="mt-4 border-l-2 border-accent-2 pl-3 text-sm">
        Compare 7 and 2: 7 &gt; 2, so swap.
      </p>
      <div className="mt-4 flex items-center gap-2 font-mono text-xs text-muted">
        <span className="grid size-7 place-items-center rounded-btn border border-border">‹</span>
        <span className="grid h-7 place-items-center rounded-btn bg-accent px-3 font-sans font-semibold text-bg">
          Pause
        </span>
        <span className="grid size-7 place-items-center rounded-btn border border-border">›</span>
        <span className="relative ml-2 h-1 flex-1 rounded-full bg-surface">
          <span className="anatomy-progress absolute inset-y-0 left-0 rounded-full bg-accent-2" />
        </span>
      </div>
    </div>
  );
}

function CodePreview() {
  const lines = [
    'for each pass i',
    '  for j from 0 to n − i − 2',
    '    if a[j] > a[j + 1]',
    '      swap a[j] and a[j + 1]',
    '  if nothing swapped, stop',
  ];
  return (
    <ol className="relative rounded-btn bg-surface py-2 font-mono text-[0.8rem] leading-7">
      {/* One highlight bar that hops from line to line (CSS steps() animation). */}
      <span
        aria-hidden="true"
        className="anatomy-line absolute inset-x-0 top-2 h-7 border-l-2 border-accent-2 bg-accent-2/12"
      />
      {lines.map((line, i) => (
        <li key={i} className="relative flex gap-3 px-3">
          <span className="w-4 text-right text-muted">{i + 1}</span>
          <span className="whitespace-pre">{line}</span>
        </li>
      ))}
    </ol>
  );
}

function QuizPreview() {
  return (
    <div>
      <p className="font-semibold">What does "5" + 3 give?</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <span className="rounded-btn border border-success bg-success/10 px-3 py-2 text-success">
          ✓ "53"
        </span>
        <span className="rounded-btn border border-border px-3 py-2 text-muted">8</span>
        <span className="rounded-btn border border-border px-3 py-2 text-muted">NaN</span>
        <span className="rounded-btn border border-border px-3 py-2 text-muted">An error</span>
      </div>
      <p className="anatomy-pop mt-4 text-sm text-muted">
        <strong className="text-success">Correct.</strong> + with a string joins text, so 3 becomes
        "3".
      </p>
    </div>
  );
}
