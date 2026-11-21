/**
 * #2 Name Checker: "Is this a good variable name?"
 *
 * ─── This one is yours to build! ───────────────────────────────────────────
 *
 * It's small, and great practice for two React ideas: controlled inputs and
 * derived state. The word list and the challenge names are ready in
 * reservedWords.ts. Suggested plan:
 *
 *  1. A controlled input: keep the text in state,
 *       const [name, setName] = useState('');
 *     and give the <input> both `value={name}` and `onChange`.
 *
 *  2. Derived state: work out every check FROM `name` on each render.
 *     Don't store the results in more state; they'd only get out of sync.
 *       const startsWithDigit = /^[0-9]/.test(name);
 *       const validChars = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
 *       const reserved = RESERVED_WORDS.has(name);
 *
 *  3. Two checklists. Rules (✅/❌): not empty, doesn't start with a digit,
 *     only letters/digits/_/$, not a reserved word. Style tips (👍/💡):
 *     camelCase, descriptive (3+ characters, not x / a / temp), and, if it
 *     looks like a boolean, starts with is / has / can.
 *
 *  4. A verdict badge: "❌ Error", "⚠️ Works, but could be better" or
 *     "✅ Great name!", and a live preview line: let <name> = ...;
 *
 *  5. Challenge mode: map over NAME_CHALLENGE with Valid / Invalid buttons,
 *     then show each `why`.
 *
 * Use the shared look: <div className="viz not-prose">, viz-title, viz-sub,
 * viz-btn, viz-panel, and C.ok / C.danger from ../core/colors for ✅ / ❌.
 * Ask Claude for a review when it works!
 */
import { NAME_CHALLENGE } from './reservedWords';

// ─── Placeholder: replace everything below with your checker ────────────────

export default function NameChecker() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Is this a good variable name?</p>
      <p className="viz-sub">
        A live name checker is being built here. Until then, judge these yourself using the rules
        above: which are valid?
      </p>
      <ul className="go-teaser">
        {NAME_CHALLENGE.map((c) => (
          <li key={c.name}>
            <code className="viz-mono">{c.name}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
