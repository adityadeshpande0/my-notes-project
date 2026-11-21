/**
 * #7 Guess the Output: "Can you predict JavaScript?"
 *
 * ─── This one is yours to build! ───────────────────────────────────────────
 *
 * The questions are ready in guessQuestions.ts (each answer was checked in a
 * real console). Replace the placeholder component below with the game. Suggested plan:
 *
 *  1. State. Start with useState for each piece:
 *       index   – which question is showing (0…QUESTIONS.length − 1)
 *       picked  – the option the reader clicked, or null before they answer
 *       score   – how many right so far
 *       streak  – right answers in a row (reset to 0 on a miss) 🔥
 *     When the rules start to tangle (answer / next / play again), try moving them
 *     into one useReducer, like core/useStepper.ts does.
 *
 *  2. Show QUESTIONS[index].expr in a big code chip, and map over `options`
 *     to make the answer buttons (<button className="viz-btn">).
 *
 *  3. After a pick, colour the buttons: C.ok (green ✓) for the right one,
 *     C.danger (coral ✗) for a wrong pick. Always pair colour with ✓ / ✗.
 *     Then show `why` and a "Next" button.
 *
 *  4. After the last question: a summary (score, best streak) and "Play again",
 *     which shuffles the order. Tip: shuffle a copy, never the original array.
 *
 *  5. Keep the high score in localStorage. Wrap every read and write in
 *     try/catch: private windows can throw.
 *
 * Look at core/Quiz.tsx for button styling, and run `npm test` / `npm run dev`
 * as you go. Ask Claude for a review when it works!
 */

import { QUESTIONS } from './guessQuestions';

// ─── Placeholder: replace everything below with your game ───────────────────

export default function GuessTheOutput() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Can you predict JavaScript?</p>
      <p className="viz-sub">
        A quick game is being built here. Until it’s ready, guess each answer, then check it in the
        playground above with <code>console.log(…)</code>.
      </p>
      <ul className="go-teaser">
        {QUESTIONS.slice(0, 5).map((q) => (
          <li key={q.expr}>
            <code className="viz-mono">{q.expr}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
