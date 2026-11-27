/**
 * #4 Snack Explorer: 👋 Owner, this one is yours to build, in React. It's
 * the most common real-world React task: fetching in an effect, with loading
 * and error states, cancelling with AbortController, and a debounced search.
 *
 * What it should do
 * - A search box (debounced 300 ms) and category tabs (All / Drinks / Snacks).
 * - Fetch from the pretend API: import { mockFetch as fetch } from
 *   './lib/mockFetch' (or take `fetch` as a prop), so the same code could
 *   point at a real API later. Base URL: https://api.chaicorner.dev
 * - States: a skeleton while loading, snack cards on success, an empty state
 *   ("No snacks match 'xyz' 😕"), and an error state with the message and a
 *   Retry button.
 * - A collapsible "Dev controls" panel: latency slider, fail mode (none / 500
 *   / network / badJson) and a jitter toggle, so you can test every state.
 *   (defaultServer.setControls({ latencyMs, failMode, jitter }) from
 *   './lib/mockFetch' changes them.)
 * - Clicking a card fetches GET /snacks/:id and shows it in a side panel, with
 *   its own loading state.
 * - Stretch: an "Add snack" form that POSTs, then refreshes the list. Or try
 *   a real API: https://jsonplaceholder.typicode.com (free, no sign-up).
 *
 * Hints
 * 1. State: snacks, status ("idle" | "loading" | "success" | "error"), error,
 *    query, category. ONE status value, not several booleans (isLoading,
 *    isError…) that can contradict each other.
 * 2. Fetch inside useEffect, depending on [debouncedQuery, category, reloadCount]:
 *
 *    useEffect(() => {
 *      const controller = new AbortController();
 *      async function load() {
 *        setStatus("loading");
 *        try {
 *          const params = new URLSearchParams({ q: debouncedQuery, category });
 *          const res = await fetch(`https://api.chaicorner.dev/snacks?${params}`, { signal: controller.signal });
 *          if (!res.ok) throw new Error(`Server said ${res.status}`);
 *          setSnacks(await res.json());
 *          setStatus("success");
 *        } catch (err) {
 *          if (err.name === "AbortError") return; // a newer request replaced this one
 *          setError(err.message);
 *          setStatus("error");
 *        }
 *      }
 *      load();
 *      return () => controller.abort(); // cleanup: cancel when the query changes or on unmount
 *    }, [debouncedQuery, category, reloadCount]);
 *
 *    The cleanup's abort() is the fix for the race condition in #2.
 *    (The pretend server treats category "all" as no filter.)
 * 3. Make a small useDebouncedValue(value, delay) hook: setTimeout in a
 *    useEffect, and clearTimeout in its cleanup (article #10's idea).
 * 4. Retry = setReloadCount(c => c + 1) (the updater form, article #8).
 * 5. Tests: the mockServer routes you rely on (see lib/fetch.test.ts for
 *    examples), and that your pure helpers handle the "500" fail mode.
 *
 * When it works, replace the card below with your component.
 */
export default function SnackExplorer() {
  return (
    <div className="fx-soon not-prose">
      <h3>🚧 Coming soon: build it yourself!</h3>
      <p>
        A snack explorer in React: fetching in an effect, loading and error states, a debounced
        search and cancelling with AbortController. The plan and the hints are at the top of{' '}
        <code>SnackExplorer.tsx</code>.
      </p>
    </div>
  );
}
