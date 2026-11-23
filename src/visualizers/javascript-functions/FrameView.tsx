import { StackFrame } from '../core/stack';
import type { FrameSnap } from './lib/callSim';

/** Draw one simulator frame with the shared StackFrame plate. Used by #6 and #9. */
export function FrameView({
  frame,
  isTop,
  returning,
  overflow,
}: {
  frame: FrameSnap;
  isTop: boolean;
  returning: boolean;
  overflow?: boolean;
}) {
  return (
    <StackFrame
      name={frame.name}
      args={frame.args.map(([name, value]) => ({ name, value }))}
      locals={frame.locals.map(([name, value]) => ({ name, value, fresh: frame.fresh === name }))}
      state={overflow && isTop ? 'overflow' : returning ? 'returning' : isTop ? 'top' : 'waiting'}
      waitingFor={frame.waitingFor}
      slot={frame.slot}
      received={frame.received}
      returns={returning ? frame.returns : undefined}
      builtin={frame.builtin}
    />
  );
}
