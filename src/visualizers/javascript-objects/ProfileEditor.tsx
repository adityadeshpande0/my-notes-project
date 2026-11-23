/**
 * #4 Profile Editor: "Edit an object the React way"
 *
 * ─── YOUR TURN ─────────────────────────────────────────────────────────
 * This one is yours to build. The component below is a placeholder so the
 * article still reads well until you replace it.
 *
 * The app edits this object:
 *   {
 *     name: "Riya Sharma",
 *     age: 19,
 *     city: "Pune",
 *     skills: ["HTML", "CSS"],
 *     socials: { github: "riya-dev", twitter: "" },
 *   }
 * - Inputs for name, age and city.
 * - Skills as chips with ✕, plus an input to add one (no duplicates,
 *   ignoring case).
 * - Two inputs for the NESTED socials object.
 * - A live preview card, and a JSON panel showing
 *   JSON.stringify(profile, null, 2) as you type. (You can reuse JsonText
 *   from ./JsonConverter for the colouring.)
 * - Save to localStorage as JSON, Load it back (try/catch around both), and
 *   an "unsaved changes" dot when the profile differs from what's saved.
 * - Reset back to the default.
 *
 * Suggested steps:
 *  1. Keep the whole profile in ONE useState object.
 *  2. Top-level field:  setProfile({ ...profile, city: e.target.value })
 *  3. Nested field: copy BOTH levels:
 *       setProfile({ ...profile, socials: { ...profile.socials, github: value } })
 *     Try forgetting the inner spread and watch the other link disappear!
 *  4. Arrays:  skills: [...profile.skills, newSkill]
 *              skills: profile.skills.filter(s => s !== skill)
 *  5. One handler for every top-level input, using bracket notation:
 *       setProfile({ ...profile, [e.target.name]: e.target.value })
 *     That's the "key stored in a variable" case from this article.
 *  6. Write a pure updateSocial(profile, key, value) in lib/profile.ts and
 *     test it with Vitest, checking the ORIGINAL object is unchanged.
 * Ping me when you have a first version and I'll review it.
 * ───────────────────────────────────────────────────────────────────────
 */

// Placeholder: replace this whole component with your editor.
export default function ProfileEditor() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Profile editor (coming soon)</p>
      <p className="viz-sub">A form that edits a profile object, the React way, is on its way.</p>
      <p className="viz-caption">
        The key move: never change the object. Make a new one with{' '}
        <code>{'{ ...profile, city }'}</code>, and copy nested objects too.
      </p>
    </div>
  );
}
