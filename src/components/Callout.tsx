import type { ReactNode } from 'react';

const KINDS = {
  tip: { label: 'Tip', border: 'border-accent-2', text: 'text-accent-2' },
  note: { label: 'Note', border: 'border-accent', text: 'text-accent' },
  warning: { label: 'Watch out', border: 'border-warn', text: 'text-warn' },
} as const;

/** Used inside MDX notes: <Callout kind="tip">...</Callout> */
export function Callout({
  kind = 'note',
  title,
  children,
}: {
  kind?: keyof typeof KINDS;
  /** Replaces the default label, e.g. <Callout kind="tip" title="Key idea"> */
  title?: string;
  children: ReactNode;
}) {
  const k = KINDS[kind];
  return (
    <aside className={`not-prose my-7 border-l-2 pl-5 ${k.border}`}>
      <p className={`mb-1 font-mono text-xs tracking-wide uppercase ${k.text}`}>
        {title ?? k.label}
      </p>
      <div className="text-[0.95em] leading-relaxed text-muted [&_code]:font-mono [&_code]:text-text">
        {children}
      </div>
    </aside>
  );
}
