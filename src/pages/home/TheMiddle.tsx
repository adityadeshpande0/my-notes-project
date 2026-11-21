import { useMemo, useState, type CSSProperties } from 'react';
import { bubbleSort } from '../../visualizers/sorting/bubbleSort';
import type { SortStep } from '../../visualizers/sorting/types';

/**
 * "Most tutorials skip the middle": every step of one bubble sort run as a
 * filmstrip. A textbook shows the first and last frame; the notes show all of
 * them. Hover, tap, drag the slider or use the arrow keys to look inside.
 */

const INPUT = [5, 3, 8, 1, 9, 2, 6];
const MAX = Math.max(...INPUT);

type BarState = 'idle' | 'compare' | 'swap' | 'sorted';

function stateOf(step: SortStep, i: number): BarState {
  if (step.swapping?.includes(i)) return 'swap';
  if (step.comparing?.includes(i)) return 'compare';
  if (i >= step.sortedFrom) return 'sorted';
  return 'idle';
}

// Bar colours follow the site-wide reading key: amber compare, coral swap, green done.
const BAR: Record<BarState, string> = {
  idle: 'bg-accent/35',
  compare: 'bg-warn',
  swap: 'bg-danger',
  sorted: 'bg-success/80',
};

export function TheMiddle() {
  // useMemo: run the generator once and keep the frames, instead of on every render.
  const steps = useMemo(() => [...bubbleSort(INPUT)], []);
  const last = steps.length - 1;
  // Start somewhere in the middle, because that's the point being made.
  const [index, setIndex] = useState(Math.round(last * 0.3));
  const step = steps[index];
  const isEnd = index === 0 || index === last;

  return (
    <div data-reveal className="rounded-card border border-border bg-elevated shadow-glow">
      {/* The big frame */}
      <div className="grid gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,15rem)] sm:p-7">
        <div className="flex h-40 items-end gap-2 sm:h-48" aria-hidden="true">
          {step.array.map((v, i) => {
            const s = stateOf(step, i);
            return (
              <div key={i} className="flex h-full flex-1 flex-col items-center gap-1.5">
                {/* A box with a real height, so the bar's % height has something to measure. */}
                <div className="relative w-full flex-1">
                  <div
                    className={`absolute inset-x-0 bottom-0 rounded-t-md transition-[height,background-color] duration-300 ${BAR[s]}`}
                    style={{ height: `${(v / MAX) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-muted tabular-nums">{v}</span>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-muted">
              frame {String(index + 1).padStart(2, '0')} of {steps.length}
            </p>
            <p className="mt-2 leading-snug" aria-live="polite">
              {step.message}
            </p>
          </div>
          <p className={`font-mono text-xs ${isEnd ? 'text-muted' : 'text-accent-2'}`}>
            {isEnd ? 'A textbook shows this frame.' : 'A textbook skips this frame.'}
          </p>
        </div>
      </div>

      {/* The filmstrip: one tiny frame per step */}
      <div className="border-t border-border px-5 pt-5 pb-6 sm:px-7">
        <div className="mb-3 flex justify-between font-mono text-[0.7rem] tracking-wide text-muted uppercase">
          <span>start</span>
          <span className="text-accent-2">
            the middle<span className="hidden sm:inline">, where it actually happens</span>
          </span>
          <span>end</span>
        </div>
        <div
          className="filmstrip grid gap-px sm:gap-[3px]"
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        >
          {steps.map((s, i) => (
            <button
              key={i}
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              onPointerEnter={(e) => e.pointerType === 'mouse' && setIndex(i)}
              onClick={() => setIndex(i)}
              style={{ '--i': i } as CSSProperties}
              className={`film-frame flex h-10 items-end rounded-[3px] border sm:h-12 sm:gap-px sm:p-[2px] ${
                i === index
                  ? 'border-accent-2 bg-accent-2/10'
                  : i === 0 || i === last
                    ? 'border-muted/60'
                    : 'border-transparent hover:border-border'
              }`}
            >
              {s.array.map((v, j) => (
                <span
                  key={j}
                  className={`flex-1 rounded-[1px] ${BAR[stateOf(s, j)]}`}
                  style={{ height: `${(v / MAX) * 100}%` }}
                />
              ))}
            </button>
          ))}
        </div>

        {/* The real control: a slider, so keyboard and screen-reader users can scrub too. */}
        <input
          type="range"
          min={0}
          max={last}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          aria-label="Frame"
          aria-valuetext={`Frame ${index + 1} of ${steps.length}: ${step.message}`}
          className="film-range mt-4 w-full"
        />
      </div>
    </div>
  );
}
