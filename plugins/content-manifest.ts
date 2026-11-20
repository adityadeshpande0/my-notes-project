/**
 * content-manifest: a tiny Vite plugin.
 *
 * Problem: the track pages need the *list* of topics (title, order, level...),
 * but we don't want to ship every note's full content just to build that list.
 *
 * Solution: at build time, read only the YAML frontmatter of every .mdx file
 * and expose it as a virtual module:
 *
 *   import topics from 'virtual:content-manifest';
 *
 * The note bodies are still loaded lazily, one per page (see src/lib/content.ts).
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import type { Plugin, ViteDevServer } from 'vite';

const VIRTUAL_ID = 'virtual:content-manifest';
const RESOLVED_ID = '\0' + VIRTUAL_ID;
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;
const TRACKS = ['dsa', 'react'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];

function listMdxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listMdxFiles(full);
    return entry.name.endsWith('.mdx') ? [full] : [];
  });
}

function readTopic(file: string, contentDir: string) {
  const rel = path.relative(contentDir, file).split(path.sep).join('/');
  const match = fs.readFileSync(file, 'utf8').match(FRONTMATTER_RE);
  if (!match) throw new Error(`[content-manifest] ${rel} has no frontmatter`);

  const data = parse(match[1]) ?? {};
  const [folder] = rel.split('/');
  const slug = path.basename(file, '.mdx');

  // Fail the build early on obvious mistakes instead of rendering a broken page.
  if (typeof data.title !== 'string') throw new Error(`[content-manifest] ${rel}: missing "title"`);
  if (data.track !== folder || !TRACKS.includes(data.track)) {
    throw new Error(`[content-manifest] ${rel}: "track" must be "${folder}" (its folder name)`);
  }
  if (!LEVELS.includes(data.level)) {
    throw new Error(`[content-manifest] ${rel}: "level" must be one of ${LEVELS.join(', ')}`);
  }
  if (typeof data.order !== 'number') throw new Error(`[content-manifest] ${rel}: missing "order"`);

  return { ...data, slug, path: rel, tags: data.tags ?? [] };
}

export function contentManifest(contentDir: string): Plugin {
  return {
    name: 'content-manifest',

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },

    load(id) {
      if (id !== RESOLVED_ID) return;
      const topics = listMdxFiles(contentDir).map((file) => {
        this.addWatchFile(file);
        return readTopic(file, contentDir);
      });
      return `export default ${JSON.stringify(topics, null, 2)};`;
    },

    // In dev, rebuild the manifest when a note is added, removed, or edited.
    configureServer(server: ViteDevServer) {
      const refresh = (file: string) => {
        if (!file.startsWith(contentDir) || !file.endsWith('.mdx')) return;
        const graph = server.environments.client.moduleGraph;
        const mod = graph.getModuleById(RESOLVED_ID);
        if (mod) graph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', refresh);
      server.watcher.on('unlink', refresh);
      server.watcher.on('change', refresh);
    },
  };
}
