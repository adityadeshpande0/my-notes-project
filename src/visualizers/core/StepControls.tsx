import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { track } from '../../lib/analytics';
import type { Stepper } from './useStepper';

/**
 * Restart / back / play / forward, a progress bar and a step counter.
 * Keyboard: ← and → step, space plays or pauses (when the controls have focus).
 * The progress bar is a real range input, so you can drag (or arrow-key) to any step.
 */
export function StepControls({ s }: { s: Stepper }) {
  // Play / pause, plus one analytics event when playback starts.
  const toggle = () => {
    if (!s.playing) track('visualizer_played', { steps: s.total });
    s.toggle();
  };
  const onKeyDown = (e: KeyboardEvent) => {
    // The slider handles its own arrow keys.
    if (e.target instanceof HTMLInputElement) return;
    if (e.key === 'ArrowRight') s.next();
    else if (e.key === 'ArrowLeft') s.prev();
    // A focused button already reacts to space, so only handle it on the group itself.
    else if (e.key === ' ' && e.target === e.currentTarget) toggle();
    else return;
    e.preventDefault();
  };
  const progress = s.total > 1 ? (s.index / (s.total - 1)) * 100 : 100;

  return (
    <div
      className="viz-controls"
      onKeyDown={onKeyDown}
      role="group"
      aria-label="Step controls"
      tabIndex={-1}
    >
      <IconButton label="Restart" onClick={s.reset} disabled={s.atStart}>
        <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" />
      </IconButton>
      <IconButton label="Previous step" onClick={s.prev} disabled={s.atStart}>
        <path d="M15 6l-6 6 6 6" />
      </IconButton>
      <button
        type="button"
        className="viz-btn viz-btn--primary"
        onClick={toggle}
        aria-label={s.playing ? 'Pause' : 'Play'}
      >
        {s.playing ? 'Pause' : s.atEnd ? 'Replay' : 'Play'}
      </button>
      <IconButton label="Next step" onClick={s.next} disabled={s.atEnd}>
        <path d="M9 6l6 6-6 6" />
      </IconButton>
      <input
        type="range"
        className="viz-progress"
        min={0}
        max={Math.max(0, s.total - 1)}
        value={s.index}
        onChange={(e) => s.seek(Number(e.target.value))}
        aria-label="Step"
        aria-valuetext={`Step ${s.index + 1} of ${s.total}`}
        // The filled part of the track is drawn with a CSS variable (see viz.css).
        style={{ '--progress': `${progress}%` } as CSSProperties}
      />
      <span className="viz-stepcount viz-mono" aria-live="polite">
        {s.index + 1} / {s.total}
      </span>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="viz-btn viz-btn--icon"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
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
