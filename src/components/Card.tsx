import type { ReactNode } from 'react';

/** A plain elevated panel. Add `className` for spacing or layout tweaks. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-card border border-border bg-elevated p-6 ${className}`}>
      {children}
    </div>
  );
}
