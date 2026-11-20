import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { bubbleSort, bubbleSortPseudocode } from '../../visualizers/sorting/bubbleSort';
import { useInView, usePageVisible, useReducedMotion } from '../../lib/hooks';

const FIRST_INPUT = [5, 3, 8, 1, 9, 2, 6];
const STEP_MS = 800;
const PAUSE_AT_END_MS = 2800;

/** Seven distinct values from 1–12, shuffled. Distinct, so each value can be its own key. */
function randomInput(): number[] {
  const pool = Array.from({ length: 12 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 7);
}

type BarState = 'idle' | 'compare' | 'swap' | 'sorted';

const BAR_CLASS: Record<BarState, string> = {
  idle: 'bg-accent/30 border-accent/40',
  compare: 'bg-warn border-warn',
  swap: 'bg-danger border-danger',
  sorted: 'bg-success/80 border-success',
};

/**
 * A small, self-playing bubble sort for the landing page.
 * Phase 1 replaces the player logic here with the shared useStepper hook.
 */
export function HeroDemo() {
  const reducedMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const inView = useInView(panelRef);
  const pageVisible = usePageVisible();

  const [input, setInput] = useState(FIRST_INPUT);
  // useMemo: only re-run the algorithm when the input changes, not on every render.
  const steps = useMemo(() => [...bubbleSort(input)], [input]);
  const [index, setIndex] = useState(0);
  // With reduced motion we start paused; the reader steps through by hand.
  const [playing, setPlaying] = useState(!reducedMotion);

  const step = steps[index];
  const atEnd = index === steps.length - 1;

  // The playback timer. It only runs while playing, on screen, and in a visible tab.
  useEffect(() => {
    if (!playing || !inView || !pageVisible) return;
    const timer = setTimeout(
      () => {
        if (atEnd) {
          setInput(randomInput());
          setIndex(0);
        } else {
          setIndex(index + 1);
        }
      },
      atEnd ? PAUSE_AT_END_MS : STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [playing, inView, pageVisible, index, atEnd]);

  const stepBy = (delta: number) => {
    setPlaying(false);
    setIndex((i) => Math.min(steps.length - 1, Math.max(0, i + delta)));
  };

  const shuffle = () => {
    setInput(randomInput());
    setIndex(0);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') stepBy(1);
    else if (e.key === 'ArrowLeft') stepBy(-1);
    // Space on a focused button already "clicks" it, so only handle it on the panel itself.
    else if (e.key === ' ' && e.target === e.currentTarget) setPlaying((p) => !p);
    else return;
    e.preventDefault();
  };

  const max = Math.max(...input);
  const width = 100 / input.length;

  const stateOf = (position: number): BarState => {
    if (step.swapping?.includes(position)) return 'swap';
    if (step.comparing?.includes(position)) return 'compare';
    if (position >= step.sortedFrom) return 'sorted';
    return 'idle';
  };

  return (
    <div
      ref={panelRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      role="group"
      aria-label="Bubble sort demo. Space plays or pauses, arrow keys step."
      aria-roledescription="visualizer"
      className="rounded-card border border-border bg-elevated"
    >
      {/* Title strip */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 font-mono text-xs text-muted">
        <span>
          <span className="text-text">bubble-sort</span>.ts
        </span>
        <span className="tabular-nums">
          step {String(index + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
        </span>
      </div>

      {/* Bars. Each bar is keyed by its value and slides to its position with a CSS transform. */}
      <div className="px-4 pt-6 sm:px-6">
        <div className="relative h-44 sm:h-52" aria-hidden="true">
          {input.map((value) => {
            const position = step.array.indexOf(value);
            const state = stateOf(position);
            return (
              <div
                key={value}
                className="absolute inset-y-0 left-0 flex flex-col justify-end transition-transform duration-500 ease-[cubic-bezier(.3,.7,.2,1)]"
                style={{ width: `${width}%`, transform: `translateX(${position * 100}%)` }}
              >
                <div className="mb-1 h-4 text-center font-mono text-xs leading-4">
                  {state === 'compare' && <span className="text-warn">▼</span>}
                  {state === 'swap' && <span className="text-danger">⇄</span>}
                </div>
                <div
                  className={`mx-[14%] rounded-t-md border transition-colors duration-300 ${BAR_CLASS[state]}`}
                  style={{ height: `${(value / max) * 78}%` }}
                />
                <div className="mt-1.5 flex h-5 items-center justify-center gap-0.5 font-mono text-xs tabular-nums">
                  <span className={state === 'idle' ? 'text-muted' : 'text-text'}>{value}</span>
                  {state === 'sorted' && <span className="text-success">✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Caption: what just happened, in words */}
      <p
        className="mx-4 mt-4 min-h-[3em] border-l-2 border-accent-2 pl-3 text-[0.95rem] leading-snug sm:mx-6"
        aria-live={playing ? 'off' : 'polite'}
      >
        {step.message}
      </p>

      {/* Pseudocode with the current line highlighted */}
      <ol className="mx-4 mt-4 rounded-btn bg-surface py-2 font-mono text-[0.75rem] leading-6 sm:mx-6 sm:text-[0.8rem]">
        {bubbleSortPseudocode.map((line, i) => {
          const current = step.line === i + 1;
          return (
            <li
              key={line}
              className={`flex gap-3 px-3 transition-colors ${current ? 'bg-accent-2/15 text-text' : 'text-muted'}`}
            >
              <span
                className={`w-3 shrink-0 text-right ${current ? 'text-accent-2' : 'opacity-50'}`}
              >
                {i + 1}
              </span>
              <span className="whitespace-pre">{line}</span>
            </li>
          );
        })}
      </ol>

      {/* Controls */}
      <div className="mt-4 flex items-center gap-1.5 border-t border-border px-3 py-2.5 sm:px-4">
        <IconButton label="Previous step" onClick={() => stepBy(-1)} disabled={index === 0}>
          <path d="M15 6l-6 6 6 6" />
        </IconButton>
        <IconButton
          label={playing ? 'Pause' : 'Play'}
          onClick={() => setPlaying((p) => !p)}
          primary
        >
          {playing ? (
            <path d="M9 6v12M15 6v12" />
          ) : (
            <path d="M8 5.5v13l10-6.5z" fill="currentColor" />
          )}
        </IconButton>
        <IconButton label="Next step" onClick={() => stepBy(1)} disabled={atEnd}>
          <path d="M9 6l6 6-6 6" />
        </IconButton>
        <button
          type="button"
          onClick={shuffle}
          className="ml-auto rounded-btn px-2.5 py-1.5 font-mono text-xs text-muted transition-colors hover:bg-surface hover:text-text"
        >
          new array
        </button>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  primary,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid size-8 place-items-center rounded-btn transition-colors disabled:opacity-35 ${
        primary
          ? 'bg-accent text-bg hover:opacity-90'
          : 'text-muted hover:bg-surface hover:text-text'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}
