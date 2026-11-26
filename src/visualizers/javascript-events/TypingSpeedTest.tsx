/**
 * #4 Typing Speed Test: 👋 Owner, this one is yours to build, in React.
 * Everything from the course comes together here: events, state, a timer
 * with cleanup and derived values.
 *
 * What it should do
 * - Pick one of 5 short, friendly sentences at random
 *   (e.g. "Chai and code make every morning better.").
 * - Show the sentence character by character: correct letters mint, mistakes
 *   coral AND underlined (never colour alone), a blinking caret at the
 *   current position.
 * - An input (labelled!) where the user types. The timer starts on the first
 *   keystroke and stops when the sentence is complete.
 * - Live stats: time, WPM = (correctChars / 5) / minutes, accuracy =
 *   correct / typed × 100.
 * - Block paste: onPaste={(e) => e.preventDefault()}, plus a toast
 *   "No pasting, type it! 😄" (no alert()).
 * - onKeyDown shortcuts: Escape restarts; Enter after finishing goes to the
 *   next sentence.
 * - A results card with "Try again", announced with aria-live. Save the best
 *   WPM to localStorage as JSON, inside try/catch (article #7).
 *
 * Hints
 * 1. State: typed (string), startTime (number | null), now (number, for the
 *    live timer), finished (boolean).
 * 2. DON'T store WPM or accuracy in state: work them out from typed, the
 *    target and the times during render (derived state).
 * 3. The live timer: a useEffect that starts a setInterval while the test is
 *    running and RETURNS a cleanup that clears it. Same idea as
 *    removeEventListener in this article: always clean up what you start.
 * 4. onChange={(e) => setTyped(e.target.value)} is React's version of the
 *    `input` event, and e.target.value is the same as in plain DOM.
 * 5. Write a pure scoreTyping(target, typed, ms) in lib/scoreTyping.ts with
 *    Vitest tests FIRST (a perfect sentence in 60 s gives the expected WPM;
 *    one mistake lowers the accuracy correctly).
 * 6. Styles: add a few classes to js-events.css using the theme tokens
 *    (var(--accent-2) for correct, var(--danger) for mistakes).
 *
 * When it works, replace the card below with your component. Happy typing!
 */
export default function TypingSpeedTest() {
  return (
    <div className="ev-soon not-prose">
      <h3>🚧 Coming soon: build it yourself!</h3>
      <p>
        A typing speed test in React: onChange, onKeyDown, preventDefault, a timer with cleanup, and
        words per minute worked out as you type. The plan and the hints are at the top of{' '}
        <code>TypingSpeedTest.tsx</code>.
      </p>
    </div>
  );
}
