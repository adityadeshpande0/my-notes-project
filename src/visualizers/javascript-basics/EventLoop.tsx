import { BASICS_PRESETS, EventLoop as SharedEventLoop } from '../core/eventloop';

/**
 * Article #1's event loop. The engine and renderer now live in
 * core/eventloop (article #11 adds a microtask queue to the same visual);
 * this article's programs have no promises, so that lane stays hidden.
 */
export default function EventLoop() {
  return <SharedEventLoop presets={BASICS_PRESETS} showMicrotasks={false} />;
}
