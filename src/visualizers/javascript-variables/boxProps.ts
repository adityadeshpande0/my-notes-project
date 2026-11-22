import type { Box } from './lib/memorySteps';

/**
 * Turn a step's Box into MemoryBox props. Done by hand (not `{...box}`) because
 * a box's `ref` field means "points to heap object", and spreading it would
 * collide with React's special `ref` prop.
 */
export function boxProps(b: Box, heapLabel?: (id: string) => string) {
  return {
    name: b.name,
    value: b.value,
    kind: b.kind,
    state: b.state,
    refTo: b.ref,
    refLabel: b.ref && heapLabel ? heapLabel(b.ref) : undefined,
    hoisted: b.hoisted,
    tdz: b.tdz,
    pulse: b.pulse,
  };
}
