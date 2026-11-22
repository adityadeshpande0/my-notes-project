import { useEffect, useReducer } from 'react';

/*
 * useStepper: the "media player" every step-by-step visual shares.
 *
 * The state is tiny ({ index, playing }), but it changes in several ways
 * (next, prev, reset, seek, toggle). useReducer keeps all those rules in one
 * pure function, `stepperReducer`, which is easy to read and to unit test.
 */

export interface StepperState {
  index: number;
  playing: boolean;
}

export type StepperAction =
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'reset' }
  | { type: 'toggle' }
  | { type: 'seek'; index: number };

/** `last` is the index of the final step (total − 1). */
export function stepperReducer(
  state: StepperState,
  action: StepperAction,
  last: number,
): StepperState {
  switch (action.type) {
    case 'next':
      // Playing past the end just stops.
      return state.index >= last
        ? { ...state, playing: false }
        : { ...state, index: state.index + 1 };
    case 'prev':
      return { playing: false, index: Math.max(0, state.index - 1) };
    case 'reset':
      return { playing: false, index: 0 };
    case 'seek':
      return { playing: false, index: Math.min(last, Math.max(0, action.index)) };
    case 'toggle':
      if (state.playing) return { ...state, playing: false };
      // Pressing play at the end starts again from the top.
      return { playing: true, index: state.index >= last ? 0 : state.index };
  }
}

export interface Stepper {
  index: number;
  total: number;
  playing: boolean;
  atStart: boolean;
  atEnd: boolean;
  next: () => void;
  prev: () => void;
  reset: () => void;
  toggle: () => void;
  seek: (index: number) => void;
}

export interface StepperOptions {
  /** Start playing as soon as the component mounts. */
  autoPlay?: boolean;
  /** Start on the last step (e.g. under reduced motion: show the result, no animation). */
  startAtEnd?: boolean;
}

/**
 * @param total  how many steps there are
 * @param delay  milliseconds between steps while playing
 * @param options  where to start. These only apply on mount: to "run again"
 *   with new input, give the component a new `key` so React mounts it fresh.
 */
export function useStepper(total: number, delay = 1400, options: StepperOptions = {}): Stepper {
  const last = Math.max(0, total - 1);
  const [state, dispatch] = useReducer(
    (s: StepperState, a: StepperAction) => stepperReducer(s, a, last),
    options,
    // The third argument builds the first state once, from `options`.
    (o): StepperState =>
      o.startAtEnd ? { index: last, playing: false } : { index: 0, playing: Boolean(o.autoPlay) },
  );

  // While playing, schedule the next step. Changing `index` re-runs this
  // effect, and the cleanup cancels the old timer first.
  useEffect(() => {
    if (!state.playing) return;
    const timer = window.setTimeout(() => dispatch({ type: 'next' }), delay);
    return () => window.clearTimeout(timer);
  }, [state.playing, state.index, delay]);

  // If `total` shrinks (new input), never point past the end.
  const index = Math.min(state.index, last);

  return {
    index,
    total,
    playing: state.playing,
    atStart: index === 0,
    atEnd: index === last,
    next: () => dispatch({ type: 'next' }),
    prev: () => dispatch({ type: 'prev' }),
    reset: () => dispatch({ type: 'reset' }),
    toggle: () => dispatch({ type: 'toggle' }),
    seek: (i) => dispatch({ type: 'seek', index: i }),
  };
}
