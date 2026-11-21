import type { CSSProperties } from 'react';
/** Map-style legend for the visualizer colours. Each colour also has a shape. */

type Highlight = 'compare' | 'swap' | 'sorted' | 'current';

const KEY: {
  id: Highlight;
  name: string;
  mark: string;
  text: string;
  color: string;
  bar: string;
}[] = [
  {
    id: 'current',
    name: 'Current',
    mark: '▍',
    text: 'Where the algorithm is right now, and the matching line of code.',
    color: 'text-accent-2',
    bar: 'bg-accent-2',
  },
  {
    id: 'compare',
    name: 'Comparing',
    mark: '▼',
    text: 'Two values being looked at side by side.',
    color: 'text-warn',
    bar: 'bg-warn',
  },
  {
    id: 'swap',
    name: 'Swapping',
    mark: '⇄',
    text: 'Values changing places, or a conflict that needs fixing.',
    color: 'text-danger',
    bar: 'bg-danger',
  },
  {
    id: 'sorted',
    name: 'Done',
    mark: '✓',
    text: 'Sorted, found, or finished. It won’t move again.',
    color: 'text-success',
    bar: 'bg-success/80',
  },
];

const HEIGHTS = [45, 80, 60];

export function ReadingKey() {
  return (
    <dl
      data-reveal
      className="grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2"
    >
      {KEY.map((item, k) => (
        <div key={item.id} className="flex gap-5 bg-bg p-5 sm:p-6">
          {/* A tiny three-bar sketch with the middle bar highlighted */}
          <div className="flex h-14 w-12 shrink-0 items-end gap-1" aria-hidden="true">
            {HEIGHTS.map((h, i) => (
              <div
                key={i}
                className={`key-bar flex-1 rounded-t-sm ${i === 1 ? item.bar : 'bg-accent/25'}`}
                // --i staggers the bars growing in when this card scrolls into view
                style={{ height: `${h}%`, '--i': k * 2 + i } as CSSProperties}
              />
            ))}
          </div>
          <div>
            <dt className="flex items-center gap-2 font-heading font-semibold">
              <span className={`font-mono text-sm ${item.color}`} aria-hidden="true">
                {item.mark}
              </span>
              {item.name}
            </dt>
            <dd className="mt-1 text-[0.95rem] leading-snug text-muted">{item.text}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
