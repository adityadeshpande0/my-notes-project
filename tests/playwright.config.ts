import { defineConfig } from '@playwright/test';
import type { TodoOptions } from './todo.spec';

/**
 * The to-do project's shared tests (article #14).
 *
 * One test file, many targets ("projects"):
 * - reference-vanilla / reference-react: the tested reference apps. Must pass.
 * - stage-1 … stage-7: the build-along snapshots. Stage N runs only the
 *   tests tagged @stage1 … @stageN, proving each stage does what the article
 *   says it does.
 * - vanilla / react: YOUR apps in projects/. They fail until you build them!
 *   Run them with:  npm run test:todo -- --project=vanilla
 * - article: checks the "Same actions, two apps" visual's DOM-change meter.
 *
 * Everything is served by Vite's dev server, so the React apps' JSX works.
 */
const PORT = 5179;
const stageGrep = (n: number) => new RegExp(`@stage[1-${n}]\\b`);

const app = (name: string, appPath: string, grep?: RegExp) => ({
  name,
  testMatch: /todo\.spec\.ts/,
  grep,
  use: { appPath } satisfies TodoOptions,
});

export default defineConfig<TodoOptions>({
  testDir: '.',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'off' },
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    cwd: '..',
    timeout: 60_000,
  },
  projects: [
    app('reference-vanilla', '/src/visualizers/javascript-todo/reference/vanilla/index.html'),
    app('reference-react', '/src/visualizers/javascript-todo/reference/react/index.html'),
    ...[1, 2, 3, 4, 5, 6, 7].map((n) =>
      app(`stage-${n}`, `/src/visualizers/javascript-todo/stages/${n}/index.html`, stageGrep(n)),
    ),
    app('vanilla', '/projects/todo-vanilla/index.html'),
    app('react', '/projects/todo-react/index.html'),
    { name: 'article', testMatch: /todo-visual\.spec\.ts/ },
  ],
});
