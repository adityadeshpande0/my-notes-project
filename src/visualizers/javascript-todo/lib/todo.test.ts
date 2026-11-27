// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { countChanges } from './domChanges';
import { driveTodo } from './drive';
import { articlesUsed, FEATURES, STAGES } from './features';
import { foldDiff, lineDiff, sides } from './lineDiff';
import { buildSrcdoc } from './srcdoc';

// Every reference, stage and preview file, as text (Vite's ?raw import).
const FILES = import.meta.glob('../{stages,reference,preview}/**/*.{js,jsx,html,css}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;
const read = (p: string) => {
  const text = FILES[`../${p}`];
  if (text === undefined) throw new Error(`missing file: ${p}`);
  return text;
};

describe('line diff', () => {
  it('rebuilds both sides exactly, for every pair of stages', () => {
    for (let n = 2; n <= 7; n++) {
      const a = read(`stages/${n - 1}/script.js`);
      const b = read(`stages/${n}/script.js`);
      const d = lineDiff(a, b);
      expect(sides(d).before.join('\n')).toBe(a.replace(/\n$/, ''));
      expect(sides(d).after.join('\n')).toBe(b.replace(/\n$/, ''));
      // Folding hides only unchanged lines.
      const folded = foldDiff(d)
        .filter((c) => c.kind === 'fold')
        .flatMap((c) => c.lines);
      expect(folded.every((l) => l.kind === 'same')).toBe(true);
    }
  });
  it('handles small cases', () => {
    expect(lineDiff('a\nb\nc', 'a\nx\nc').map((l) => l.kind)).toEqual([
      'same',
      'del',
      'add',
      'same',
    ]);
    expect(lineDiff('', 'a').map((l) => l.kind)).toEqual(['add']);
  });
});

describe('the stages and the reference', () => {
  it('stage 7 is byte-identical to the reference', () => {
    expect(read('reference/vanilla/style.css')).toContain('.todo.done .text'); // really read, not an empty stub
    for (const f of ['index.html', 'style.css', 'script.js'])
      expect(read(`stages/7/${f}`)).toBe(read(`reference/vanilla/${f}`));
  });
  it('every stage has its files and a description', () => {
    expect(STAGES.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const s of STAGES) expect(read(`stages/${s.n}/index.html`)).toContain('id="todo-list"');
  });
  it('the preview React app differs from the reference only where marked', () => {
    const app = read('reference/react/App.jsx');
    const preview = read('preview/PreviewApp.jsx');
    const expected =
      preview.split('\n').slice(0, 4).join('\n') +
      '\n' +
      app
        .replaceAll('"./TodoForm.jsx"', '"../reference/react/TodoForm.jsx"')
        .replaceAll('"./TodoItem.jsx"', '"../reference/react/TodoItem.jsx"')
        .replaceAll('"./FilterBar.jsx"', '"../reference/react/FilterBar.jsx"')
        .replace('const STORAGE_KEY = "stackscape-todos";', () =>
          preview.split('\n').find((line: string) => line.startsWith('const STORAGE_KEY'))!,
        )
        .replace('export default function App() {', () =>
          preview
            .split('\n')
            .find((line: string) => line.startsWith('export default function App'))!,
        )
        .replace(
          '  }, [todos]);\n',
          '  }, [todos]);\n\n  // preview: tell the visual the current data (not in the reference app)\n  useEffect(() => onState?.(todos), [todos, onState]);\n',
        );
    expect(preview).toBe(expected);
    expect(preview).toContain('"stackscape-todos-preview"');
  });
});

describe('the feature map', () => {
  it('covers 13 of 13 articles', () => {
    expect(articlesUsed()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    expect(new Set(FEATURES.map((f) => f.id)).size).toBe(FEATURES.length);
  });
});

describe('the plain-JS reference, driven like a user (in jsdom)', () => {
  function mount() {
    const html = read('reference/vanilla/index.html');
    document.documentElement.innerHTML = html
      .replace(/^[\s\S]*?<html[^>]*>/, '')
      .replace(/<\/html>\s*$/, '');
    localStorage.clear();
    // Run the reference script the way a <script> tag would (tests only).
    new Function(read('reference/vanilla/script.js'))();
  }
  it('adds, ticks and counts; ticking rebuilds every row (5 removed + 5 added)', async () => {
    mount();
    await driveTodo(document, { type: 'addMany', texts: ['a', 'b', 'c', 'd', 'e'] });
    const list = document.querySelector('#todo-list')!;
    expect(list.children).toHaveLength(5);
    expect(document.querySelector('#count')!.textContent).toBe('5 tasks left');
    const records: MutationRecord[] = [];
    const mo = new MutationObserver((r) => records.push(...r));
    mo.observe(list, { subtree: true, childList: true, attributes: true, attributeOldValue: true });
    await driveTodo(document, { type: 'tick', n: 3 });
    records.push(...mo.takeRecords());
    const c = countChanges(records, list);
    expect([c.rowsRemoved, c.rowsAdded]).toEqual([5, 5]);
    expect(list.children[2].classList.contains('done')).toBe(true);
    await driveTodo(document, { type: 'reset' });
    expect(list.children).toHaveLength(0);
  });
  it('the preview copy inlines the CSS and script and adds the bridge', () => {
    const doc = buildSrcdoc({
      html: read('reference/vanilla/index.html'),
      css: read('reference/vanilla/style.css'),
      js: read('reference/vanilla/script.js'),
    });
    expect(doc).not.toContain('src="script.js"');
    expect(doc).toContain('.todo.done .text');
    expect(doc).toContain('e.source !== parentWin');
    expect(doc.indexOf('const STORAGE_KEY')).toBeLessThan(doc.indexOf('var driveTodo'));
  });
});
