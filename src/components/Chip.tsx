import type { ReactNode } from 'react';

const TONES = {
  neutral: 'border-border text-muted',
  accent: 'border-accent/40 text-accent',
  mint: 'border-accent-2/40 text-accent-2',
  amber: 'border-warn/40 text-warn',
} as const;

export function Chip({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
