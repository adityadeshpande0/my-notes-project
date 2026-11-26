/**
 * A pure model of an event's journey: capture (down) → target → bubble (up).
 * BubblingTower records what REALLY ran in the browser; this model predicts
 * the same order, and propagation.test.ts checks the two agree (with real
 * clicks in jsdom) for every combination of the visual's toggles.
 */
export type Phase = 1 | 2 | 3; // event.eventPhase: 1 capture, 2 at target, 3 bubble

export interface NodeListeners {
  capture: boolean;
  bubble: boolean;
  /** The listener(s) on this node call e.stopPropagation(). */
  stop: boolean;
}

export interface Call {
  node: string;
  phase: Phase;
  /** Which of the node's two listeners ran. */
  listener: 'capture' | 'bubble';
}

/**
 * @param path the nodes from the outermost to the target, e.g.
 *   ['document', 'grandparent', 'parent', 'child']
 */
export function predictCalls(path: string[], listeners: Record<string, NodeListeners>): Call[] {
  const calls: Call[] = [];
  const target = path[path.length - 1];
  const off: NodeListeners = { capture: false, bubble: false, stop: false };
  const at = (n: string) => listeners[n] ?? off;

  // 1. Capture: down from the top, stopping just above the target.
  for (const node of path.slice(0, -1)) {
    const l = at(node);
    if (l.capture) {
      calls.push({ node, phase: 1, listener: 'capture' });
      if (l.stop) return calls;
    }
  }
  // 2. At the target. Modern browsers run the target's capture listener at
  //    the end of the trip down, and its bubble listener at the start of the
  //    trip up: two separate moments, so a stopPropagation() in the first
  //    one also skips the second. (The tests caught this with real clicks!)
  const t = at(target);
  if (t.capture) {
    calls.push({ node: target, phase: 2, listener: 'capture' });
    if (t.stop) return calls;
  }
  if (t.bubble) {
    calls.push({ node: target, phase: 2, listener: 'bubble' });
    if (t.stop) return calls;
  }
  // 3. Bubble: back up from the target's parent to the top.
  for (const node of path.slice(0, -1).reverse()) {
    const l = at(node);
    if (l.bubble) {
      calls.push({ node, phase: 3, listener: 'bubble' });
      if (l.stop) return calls;
    }
  }
  return calls;
}

export const PHASE_NAME: Record<Phase, string> = { 1: 'capture', 2: 'target', 3: 'bubble' };
