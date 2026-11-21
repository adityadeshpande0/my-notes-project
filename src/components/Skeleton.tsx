/**
 * Placeholder shapes shown while something loads. They're purely visual
 * (aria-hidden); the wrapper that uses them announces "Loading…" once
 * for screen readers instead.
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

/** A few lines of text, the last one shorter, like the end of a paragraph. */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-3/5' : 'w-full'}`} />
      ))}
    </div>
  );
}
