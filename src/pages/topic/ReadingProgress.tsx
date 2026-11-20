import { useEffect, useRef, type RefObject } from 'react';

/**
 * A thin bar under the header that fills as you read the article.
 * It updates the bar's style directly through a ref instead of using state,
 * so scrolling doesn't re-render any React components.
 */
export function ReadingProgress({ target }: { target: RefObject<HTMLElement | null> }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const el = target.current;
      const bar = barRef.current;
      if (!el || !bar) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
      bar.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [target]);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-0.5" aria-hidden="true">
      <div ref={barRef} className="h-full origin-left scale-x-0 bg-accent-2" />
    </div>
  );
}
