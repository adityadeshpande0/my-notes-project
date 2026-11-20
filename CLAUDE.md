# Stackscape: conventions for Claude

Visual, interactive notes for learning **React** and **DSA**. The owner is learning React while
building this, so the codebase is part of the curriculum.

## Stack

Vite 8 · React 19 · TypeScript · React Router 8 (`react-router`) · Tailwind CSS 4 (CSS-first config
in `src/styles/index.css`) · MDX (`@mdx-js/rollup` + frontmatter + GFM) · Shiki (build-time, via
`@shikijs/rehype`) · Framer Motion (`motion`) · React Three Fiber + drei · Vitest · ESLint + Prettier.
State: React state/hooks first; Zustand only if global state really grows.

## Commands

`npm run dev` · `npm run build` · `npm run typecheck` · `npm run lint` · `npm test` · `npm run format`

## Layout

- `src/app/` router, layout, providers (theme context)
- `src/components/` generic UI (Card, Chip, Callout, mdx-components)
- `src/visualizers/<topic>/` step generators + 2D/3D renderers; `core/` holds `useStepper` and `<Visualizer>`
- `src/three/` shared 3D bits (always lazy-loaded)
- `src/content/{dsa,react}/*.mdx` notes; `src/lib/` content loading + pure helpers
- `plugins/content-manifest.ts` exposes all notes' frontmatter as `virtual:content-manifest`;
  note bodies are lazy chunks loaded via `import.meta.glob` in `src/lib/content.ts`

## Content

Frontmatter: `title`, `track` (must match folder), `level` (beginner|intermediate|advanced), `order`,
`summary`, `tags`, `complexity: { time, space }`. The build fails on missing or invalid fields.
Page template: Intuition → Interactive visual → How it works → Code → Complexity → Common mistakes
→ Try it → Quick self-check. `<Callout kind="tip|note|warning">` is available in every note.
Explain jargon on hover with `<Term id="big-o">Big-O</Term>` (shared definitions in
`src/content/glossary.ts`) or `<Term tip="...">word</Term>` for one-offs. Never start a line with
`<Term`: MDX then treats it as a block. Prettier skips `.mdx` for this reason.
Planned-but-unwritten topics live in `src/lib/roadmap.ts` (shown as "soon" on the landing page).
Landing page voice: plain, specific, human. No emoji, gradient text, blobs, or generic feature-card grids.

## Theme ("Midnight Lab" dark default, "Daylight Lab" light)

Tokens are CSS variables on `[data-theme]`, mapped to Tailwind colors: `bg`, `elevated`, `surface`,
`border`, `text`, `muted`, `accent` (periwinkle), `accent-2` (mint), `warn` (amber), `danger` (coral),
`success` (green). Never hard-code hex values in components.
**Visualizer semantics are fixed:** mint = current, amber = comparing, coral = swapping, green = done,
always paired with a label, icon, or shape. Fonts: Space Grotesk (headings), Inter (body),
JetBrains Mono (code/data). Radius: `rounded-card` 14px, `rounded-btn` 10px, chips full. Soft glows
(`shadow-glow`), not hard shadows. Glass blur only on the visualizer control bar.

## Visualizer pattern

`algorithm (pure generator yielding Steps)` → `useStepper(steps)` → `Renderer (2D or 3D)`.

- Generators are plain TS, no React, unit tested with Vitest (e.g. last step is sorted).
- Each Step carries the data snapshot, highlight indices, `line` (pseudocode) and `message`.
- `useStepper`: play/pause/next/prev/reset/speed/seek via `useReducer` + `useEffect` timer.
- 2D and 3D renderers take the _same_ step and only draw it.
- `<Visualizer>` shell: control bar, speed, 2D/3D toggle, editable input, pseudocode, caption.

## Performance rules (non-negotiable)

- All three.js code lazy-loaded (`React.lazy` + `Suspense`); never in the initial bundle.
- Visualizers use `<Canvas frameloop="demand">`; the hero may use `"always"` but pauses off-screen / tab hidden.
- `dpr={[1, 1.75]}`; use `<Instances>` for many identical meshes.
- Respect `prefers-reduced-motion` (no camera flights, auto-rotate, bloom; default to 2D).
- Every 3D visual has a 2D fallback; weak devices (no WebGL2 / low cores) default to 2D.
- Targets: Lighthouse perf ≥ 90 on home, 60fps playback, initial JS < 200KB gzipped.

## Definition of done

Works from 360px wide · keyboard accessible (space = play/pause, arrows = step) with visible focus ·
reduced-motion path · no console errors · `tsc` passes · tests pass · checked on the live URL.

## Working agreement

- **Teach as you build:** when introducing a React concept, explain it in 2–3 sentences and why it's used here.
- Small, reviewable steps: one feature per commit, clear messages.
- Leave one or two small pieces per phase for the owner to write; review their code kindly and specifically.
- Simple, readable code over clever; comment where a learner might get lost.
- Never trade the performance rules for visual flair.
