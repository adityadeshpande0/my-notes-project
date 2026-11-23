import { useLayoutEffect, useState, type RefObject } from 'react';

interface Path {
  d: string;
  key: string;
}

/**
 * Draws the arrows (references) inside a memory diagram. It finds every
 * `[data-ref-from][data-ref-to]` dot and the `[data-heap-id]` card it points
 * to, inside `container`, and draws a curve between them. Cards to the right
 * get a sideways curve; cards below (phones) get a downward one.
 *
 * Positions come from the real layout, so they're measured in a layout effect
 * (after React has put the boxes on the page, before the browser paints), and
 * again whenever the container is resized.
 */
export function RefArrows({
  container,
  deps,
}: {
  container: RefObject<HTMLElement | null>;
  /** Anything that changes the diagram (e.g. the step index). */
  deps: unknown;
}) {
  const [paths, setPaths] = useState<Path[]>([]);

  useLayoutEffect(() => {
    const measure = () => {
      const root = container.current;
      if (!root) return;
      const box = root.getBoundingClientRect();
      const next: Path[] = [];
      let gutter = 0; // each lane-routed arrow gets its own lane on the right
      root.querySelectorAll<HTMLElement>('[data-ref-to]').forEach((dot) => {
        const card = root.querySelector<HTMLElement>(`[data-heap-id="${dot.dataset.refTo}"]`);
        const from = dot.querySelector('.mem-ref-dot') ?? dot;
        if (!card) return;
        const a = from.getBoundingClientRect();
        const b = card.getBoundingClientRect();
        const x1 = a.left + a.width / 2 - box.left;
        const y1 = a.top + a.height / 2 - box.top;
        const fromCard = dot.closest<HTMLElement>('[data-heap-id]');
        let d: string;
        if (b.left > a.right + 8 && !fromCard) {
          // Card is to the right: curve across to its left edge.
          const x2 = b.left - box.left - 4;
          const y2 = Math.min(Math.max(y1, b.top - box.top + 18), b.bottom - box.top - 12);
          const mid = (x1 + x2) / 2;
          d = `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`;
        } else {
          // Object → object, or a card below (phones): leave to the right, run
          // along a lane beside the boxes, and come into the card's right edge.
          // Each arrow gets its own lane, so they never cross a box or each other.
          const owner = fromCard ?? dot.closest<HTMLElement>('[data-mem-box]') ?? dot;
          const right = Math.max(owner.getBoundingClientRect().right, b.right) - box.left;
          const lane = right + 10 + gutter * 7;
          gutter += 1;
          const y2 = b.top - box.top + 16;
          const x2 = b.right - box.left + 3;
          d = `M${x1},${y1} H${lane} V${y2} H${x2}`;
        }
        next.push({ d, key: `${dot.dataset.refFrom}->${dot.dataset.refTo}` });
      });
      setPaths(next);
    };
    // RefArrows usually sits INSIDE the container it measures. React runs a
    // child's layout effect before it attaches the parent's ref, so on the
    // very first render `container.current` can still be null. If so, start
    // on the next animation frame, when the ref is ready.
    let ro: ResizeObserver | undefined;
    let live = true;
    const start = () => {
      const root = container.current;
      if (!root || !live || ro) return;
      measure();
      ro = new ResizeObserver(measure);
      ro.observe(root);
    };
    start();
    // Measure again once layout has settled, and when web fonts arrive.
    const frame = requestAnimationFrame(() => (ro ? measure() : start()));
    document.fonts?.ready.then(() => live && measure());
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      ro?.disconnect();
    };
  }, [container, deps]);

  return (
    <svg className="ref-arrows" aria-hidden="true">
      <defs>
        <marker
          id="ref-head"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" className="ref-head" />
        </marker>
      </defs>
      {paths.map((p) => (
        <path key={p.key} d={p.d} className="ref-path" markerEnd="url(#ref-head)" />
      ))}
    </svg>
  );
}
