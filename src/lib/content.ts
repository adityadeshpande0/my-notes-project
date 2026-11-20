/**
 * Content loading.
 *
 * - `topics`: frontmatter of every note, from our build-time manifest
 *   (plugins/content-manifest.ts). Small, so it's in the main bundle.
 * - `getNote()`: the note body itself. Each .mdx file becomes its own
 *   JavaScript chunk that's only downloaded when you open that page.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { MDXProps } from 'mdx/types';
import manifest from 'virtual:content-manifest';
import type { TopicMeta, Track } from './types';

export const topics: TopicMeta[] = manifest;

// `import.meta.glob` is a Vite feature: it finds files matching the pattern at
// build time and gives us a map of { path: () => import(path) }.
// Without `{ eager: true }`, each import is lazy (a separate chunk).
const loaders = import.meta.glob<{ default: ComponentType<MDXProps> }>('../content/**/*.mdx');

// React.lazy turns "a function that returns a Promise of a module" into a
// component that suspends while loading. We create each lazy component once
// (at module level) so React doesn't treat it as a new component every render.
const notes = new Map<string, LazyExoticComponent<ComponentType<MDXProps>>>();
for (const [file, load] of Object.entries(loaders)) {
  const key = file.replace('../content/', '').replace(/\.mdx$/, ''); // "dsa/binary-search"
  notes.set(key, lazy(load));
}

export function getTopic(track: Track, slug: string): TopicMeta | undefined {
  return topics.find((t) => t.track === track && t.slug === slug);
}

export function getNote(track: Track, slug: string) {
  return notes.get(`${track}/${slug}`);
}
