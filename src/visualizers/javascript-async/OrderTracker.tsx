/**
 * #4 Order Tracker: 👋 Owner, this one is yours to build, in React.
 * Loading, error and success states for async work: every React app needs
 * them, and you'll reuse this pattern in the next article with fetch.
 *
 * What it should do
 * - A menu of 5 items, each with a cook time and a small chance of burning
 *   (a "Kitchen settings" panel with a fail-rate slider, 0% to 50%).
 * - Clicking an item adds an order card: ⏳ Cooking… (a progress bar and a
 *   Cancel button), ✅ Ready (with the time it took), or 🔥 Burnt (the error
 *   message and a Retry button). Cancelled orders show "Cancelled".
 * - Group order: select several items, then "Order one by one" or "Order all
 *   at once" (Promise.all). A banner shows the total time for each, so you
 *   SEE Promise.all win. A third option, "Order all, show whatever works",
 *   uses Promise.allSettled and shows partial success.
 * - An empty state when there are no orders.
 *
 * Hints
 * 1. import { makeOrder, isAbort } from './lib/fakeKitchen' (already built,
 *    real promises, and it takes an AbortSignal).
 * 2. Each order is an object in a state array:
 *    { id, item, status: "cooking" | "ready" | "burnt" | "cancelled",
 *      startedAt, finishedAt, error }. Update it immutably with map.
 * 3. Write the handler as an async function with try / catch / finally:
 *
 *    async function placeOrder(item) {
 *      const id = crypto.randomUUID();
 *      setOrders(prev => [...prev, { id, item, status: "cooking", startedAt: Date.now() }]);
 *      try {
 *        await makeOrder(item.name, { ms: item.time, fail: Math.random() < failRate, signal });
 *        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "ready", finishedAt: Date.now() } : o));
 *      } catch (err) {
 *        // set "burnt" (or "cancelled" if isAbort(err))
 *      }
 *    }
 *
 *    Notice setOrders(prev => …). That's the stale-closure fix from article
 *    #8! Orders finishing at different times must each update the LATEST list.
 * 4. Keep one AbortController per order in a useRef map (by id), and abort
 *    them all in a useEffect cleanup when the component unmounts.
 * 5. Write Vitest tests for a pure helper summariseOrders(orders) in
 *    lib/summariseOrders.ts (counts per status, average cook time).
 *
 * When it works, replace the card below with your component.
 */
export default function OrderTracker() {
  return (
    <div className="as-soon not-prose">
      <h3>🚧 Coming soon: build it yourself!</h3>
      <p>
        An order tracker in React with loading, success and error states, cancelling, and one-by-one
        vs all-at-once. The plan and the hints are at the top of <code>OrderTracker.tsx</code>.
      </p>
    </div>
  );
}
