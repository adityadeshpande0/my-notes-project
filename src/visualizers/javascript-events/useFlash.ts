import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * In-page feedback instead of alert(): a small toast, or a big overlay that
 * shows what WOULD have happened ("the page would reload here"). Each one
 * hides itself after a moment; the timer is cleared on unmount.
 */
export interface FlashState {
  id: number;
  toast?: string;
  overlay?: string;
}

export function useFlash(ms = 2600) {
  const [state, setState] = useState<FlashState | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const id = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = useCallback(
    (f: Omit<FlashState, 'id'>) => {
      clearTimeout(timer.current);
      setState({ ...f, id: ++id.current });
      timer.current = window.setTimeout(() => setState(null), ms);
    },
    [ms],
  );
  return { state, show };
}
