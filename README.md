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
