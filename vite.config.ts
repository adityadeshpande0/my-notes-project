/// <reference types="vitest/config" />
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import remarkGfm from 'remark-gfm';
import rehypeShiki from '@shikijs/rehype';
import rehypeSlug from 'rehype-slug';
import { contentManifest } from './plugins/content-manifest.ts';

export default defineConfig({
  plugins: [
    // MDX must run before the React plugin so the compiled JSX gets Fast Refresh.
    {
      enforce: 'pre',
      ...mdx({
        // Parse the YAML block at the top of each note and export it as `frontmatter`.
        remarkPlugins: [
          remarkFrontmatter,
          remarkGfm, // tables, strikethrough, task lists
          [remarkMdxFrontmatter, { name: 'frontmatter' }],
        ],
        // Highlight code blocks at build time, so no highlighter ships to the browser.
        // Both themes are emitted as CSS variables; styles/index.css picks one per theme.
        // rehype-slug gives every heading an id ("## How it works" -> id="how-it-works"),
        // which the table of contents links to.
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeShiki,
            {
              themes: { light: 'github-light', dark: 'tokyo-night' },
              defaultColor: false,
              addLanguageClass: true, // lets the code block header show "TypeScript"
            },
          ],
        ],
      }),
    },
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
    tailwindcss(),
    contentManifest(path.resolve(import.meta.dirname, 'src/content')),
  ],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
