import { useCallback, useRef } from 'react';
import { useReducedMotion } from '../../lib/hooks';

/**
 * Values that FLY from where they come from to the variable they land in.
 * Returns a ref for an overlay layer (an empty div React never renders
 * children into) and `fly(from, to, text)`, which adds a small chip to that
 * layer, animates it along a curve, and removes it. Under reduced motion it
 * does nothing: the boxes simply appear.
 *
 * React idea: a ref is a box React doesn't watch. We use one to reach a real
 * DOM element and animate it directly, which is fine as long as React itself
 * never renders anything inside that element.
 */
export function useFlights() {
  const layer = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const fly = useCallback(
    (
      from: Element | null | undefined,
      to: Element | null | undefined,
      text: string,
      tone: 'value' | 'warn' = 'value',
    ) => {
      const root = layer.current;
      if (!root || !from || !to || reduced) return;
      const base = root.getBoundingClientRect();
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      const chip = document.createElement('span');
      chip.className = `mj-flyer is-${tone}`;
      chip.textContent = text;
      root.append(chip);
      const x0 = a.left - base.left + a.width / 2;
      const y0 = a.top - base.top + a.height / 2;
      const x1 = b.left - base.left + b.width / 2;
      const y1 = b.top - base.top + b.height / 2;
      // A curve: up and over, then down onto the target.
      const lift = Math.min(60, Math.abs(x1 - x0) / 3 + 20);
      chip
        .animate(
          [
            {
              transform: `translate(${x0}px, ${y0}px) translate(-50%, -50%) scale(0.8)`,
              opacity: 0,
            },
            { offset: 0.15, opacity: 1 },
            {
              offset: 0.5,
              transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - lift}px) translate(-50%, -50%) scale(1.05)`,
            },
            {
              transform: `translate(${x1}px, ${y1}px) translate(-50%, -50%) scale(0.9)`,
              opacity: 0.2,
            },
          ],
          { duration: 700, easing: 'ease-in-out' },
        )
        .finished.then(
          () => chip.remove(),
          () => chip.remove(),
        );
    },
    [reduced],
  );
  return { layer, fly };
}
