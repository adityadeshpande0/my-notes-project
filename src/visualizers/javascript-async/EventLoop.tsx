import { ASYNC_PRESETS, EventLoop as SharedEventLoop } from '../core/eventloop';

/**
 * #3 The microtask VIP line: article #1's event loop, upgraded. Same engine
 * and renderer (core/eventloop), with the microtask queue switched on and
 * this article's programs. `preset` picks the tab to start on.
 */
export default function EventLoop({
  preset = 'puzzle',
}: {
  preset?: 'microtasks' | 'puzzle' | 'await' | 'chain' | 'mixed';
}) {
  const first = preset === 'microtasks' ? 'puzzle' : preset;
  // Put the chosen program first, so it's the open tab.
  const presets = [...ASYNC_PRESETS].sort(
    (a, b) => Number(b.id === first) - Number(a.id === first),
  );
  return (
    <SharedEventLoop
      presets={presets}
      title="The microtask VIP line"
      sub="Two queues now: tasks (timers, clicks) and microtasks (promises, await). Predict, then step through."
    />
  );
}
