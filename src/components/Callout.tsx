import type { ReactNode } from 'react';

const KINDS = {
  tip: { label: 'Tip', className: 'border-accent-2/50', icon: '💡' },
  note: { label: 'Note', className: 'border-accent/50', icon: '📝' },
  warning: { label: 'Watch out', className: 'border-warn/60', icon: '⚠️' },
} as const;

/** Used inside MDX notes: <Callout kind="tip">...</Callout> */
export function Callout({
  kind = 'note',
  children,
}: {
  kind?: keyof typeof KINDS;
  children: ReactNode;
}) {
  const k = KINDS[kind];
  return (
    <aside
      className={`not-prose my-6 rounded-card border-l-4 bg-elevated px-5 py-4 ${k.className}`}
    >
      <p className="mb-1 font-heading text-sm font-semibold">
        <span aria-hidden="true">{k.icon} </span>
        {k.label}
      </p>
      <div className="text-[0.95em] text-muted [&_code]:font-mono [&_code]:text-text">
        {children}
      </div>
    </aside>
  );
}
