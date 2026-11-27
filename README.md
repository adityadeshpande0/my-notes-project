# Stackscape

Visual, interactive notes for learning **React** and **data structures & algorithms**.
Each topic is a short note with visuals you can play, pause, and step through.

## Run it locally

```bash
npm install
npm run dev
```

| Script              | What it does                    |
| ------------------- | ------------------------------- |
| `npm run dev`       | Dev server with hot reload      |
| `npm run build`     | Type-check and build to `dist/` |
| `npm run preview`   | Serve the production build      |
| `npm test`          | Run unit tests (Vitest)         |
| `npm run lint`      | ESLint                          |
| `npm run typecheck` | TypeScript only                 |
| `npm run format`    | Prettier                        |

## Add a note

Create `src/content/dsa/my-topic.mdx` (or `src/content/react/...`) with frontmatter:

```yaml
---
title: Binary Search
track: dsa
level: beginner
order: 2
summary: Find an item in a sorted array by halving the search space each step.
tags: [searching, arrays]
complexity: { time: 'O(log n)', space: 'O(1)' }
---
```

It appears on the track page automatically, at `/dsa/my-topic`.

## Deploy

Vercel or Netlify: framework preset **Vite**, build command `npm run build`, output `dist`.
SPA rewrites are already configured (`vercel.json`, `public/_redirects`).

## Analytics

Two tools, both off until you switch them on:

- **Vercel Web Analytics** (visitors and page views, no cookies). In the Vercel
  project open **Analytics → Enable**, then redeploy. Nothing to configure in code.
- **PostHog** (what readers do: notes opened and finished, quizzes, visuals played,
  404s, JavaScript errors). Add `VITE_POSTHOG_KEY` (your project API key, `phc_…`)
  in **Vercel → Settings → Environment Variables** and redeploy. See `.env.example`.
  Events go through `/ingest` on this site (rewrites in `vercel.json`, US cloud) so
  ad blockers don't drop them. For an EU project, switch those rewrites to the `eu.`
  hosts and set `VITE_POSTHOG_UI_HOST=https://eu.posthog.com`.

Every custom event is listed, with its properties, in `src/lib/analytics.ts`.
Visitors stay anonymous, and "Do Not Track" is respected.
