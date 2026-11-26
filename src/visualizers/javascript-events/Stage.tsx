import type { ReactNode } from 'react';
import type { FlashState } from './useFlash';

/**
 * Wraps a mini page so a toast or an overlay can sit on top of it. These are
 * React elements placed NEXT TO the sandbox host (never inside it).
 */
export default function Stage({
  children,
  flash,
}: {
  children: ReactNode;
  flash: FlashState | null;
}) {
  return (
    <div className="ev-stage">
      {children}
      {flash?.overlay && (
        <div key={flash.id} className="ev-overlay" role="status">
          <span>{flash.overlay}</span>
        </div>
      )}
      {flash?.toast && (
        <div key={flash.id} className="ev-toast" role="status">
          {flash.toast}
        </div>
      )}
    </div>
  );
}
