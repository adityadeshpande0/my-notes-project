import { useMemo } from 'react';
import { useActiveHeading } from '../../lib/hooks';

export interface Heading {
  id: string;
  text: string;
}

/** "On this page" list. The section you're reading is highlighted as you scroll. */
export function TableOfContents({ headings }: { headings: Heading[] }) {
  // useMemo keeps the same array between renders, so the scroll effect isn't re-subscribed each time.
  const ids = useMemo(() => headings.map((h) => h.id), [headings]);
  const active = useActiveHeading(ids);

  if (headings.length === 0) return null;

  return (
    <ol className="space-y-0.5 border-l border-border text-[0.9rem]">
      {headings.map((h, i) => {
        const isActive = h.id === active;
        return (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              aria-current={isActive ? 'location' : undefined}
              className={`-ml-px flex gap-3 border-l-2 py-1.5 pl-4 leading-snug transition-colors ${
                isActive
                  ? 'border-accent-2 text-text'
                  : 'border-transparent text-muted hover:border-border hover:text-text'
              }`}
            >
              <span
                className={`font-mono text-xs leading-[1.5rem] ${isActive ? 'text-accent-2' : 'opacity-60'}`}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="leading-6">{h.text}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}
