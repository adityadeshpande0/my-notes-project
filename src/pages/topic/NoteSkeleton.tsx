import { Skeleton, SkeletonText } from '../../components/Skeleton';

/**
 * The shape of a note (heading, paragraphs, a visual) shown while its chunk
 * downloads. Matching the real layout means the page doesn't jump when the
 * note arrives.
 */
export function NoteSkeleton() {
  return (
    <div role="status" className="skeleton-group max-w-[50rem] space-y-6">
      <span className="sr-only">Loading note…</span>
      <Skeleton className="h-3 w-8" />
      <Skeleton className="h-8 w-2/5" />
      <SkeletonText lines={4} />
      <Skeleton className="h-64 w-full rounded-card" />
      <SkeletonText lines={3} />
    </div>
  );
}

/** Placeholder for the "On this page" list until the note's headings are known. */
export function TocSkeleton() {
  return (
    <div className="skeleton-group space-y-3 border-l border-border pl-4" aria-hidden="true">
      {['w-4/5', 'w-3/5', 'w-11/12', 'w-2/3', 'w-3/4'].map((w) => (
        <Skeleton key={w} className={`h-3.5 ${w}`} />
      ))}
    </div>
  );
}
