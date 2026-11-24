// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  childrenPath,
  cssPath,
  flattenTree,
  followChildrenPath,
  inertHtml,
  inspectHtml,
  nodeAt,
  pathOf,
  queryCssPath,
  textPath,
  toTree,
  todoImperative,
  todoReducer,
  type TodoAction,
  type Todo,
} from './domTree';
import { CAFE_PAGE, CHAI_PAGE, BUILD_PAGE } from './templates';

/** A fresh root filled with a template, standing in for document.body. */
function mount(html: string) {
  const root = document.createElement('div');
  root.innerHTML = html; // our own trusted template
  document.body.append(root);
  return root;
}

describe('the tree is read from the real DOM', () => {
  it('matches childNodes, with and without whitespace', () => {
    const root = mount(CHAI_PAGE);
    const ul = root.querySelector('ul')!;
    const withWs = flattenTree(toTree(root, true));
    const without = flattenTree(toTree(root, false));
    expect(without.every((n) => !n.whitespace)).toBe(true);
    expect(withWs.some((n) => n.whitespace)).toBe(true);
    // The counts shown in the visual: 3 element children, 7 child nodes.
    expect(ul.children.length).toBe(3);
    expect(ul.childNodes.length).toBe(7);
    for (const n of withWs) expect(nodeAt(root, n.path)).not.toBeNull();
  });
});

describe('both JavaScript paths reach every node', () => {
  for (const [name, html] of [
    ['chai page', CHAI_PAGE],
    ['café page', CAFE_PAGE],
    ['build page', BUILD_PAGE],
  ] as const) {
    it(name, () => {
      const root = mount(html);
      for (const n of flattenTree(toTree(root, true))) {
        const node = nodeAt(root, n.path)!;
        expect(pathOf(root, node)).toEqual(n.path);
        if (n.kind === 'element') {
          const el = node as Element;
          expect(queryCssPath(root, cssPath(root, el))).toBe(el);
          expect(followChildrenPath(root, childrenPath(root, el))).toBe(el);
        } else {
          // parent.childNodes[k] is the text node itself.
          const expr = textPath(root, node);
          const k = Number(/childNodes\[(\d+)\]$/.exec(expr)![1]);
          expect(node.parentNode!.childNodes[k]).toBe(node);
        }
      }
    });
  }
});

describe('the XSS inspector', () => {
  it('flags code that would run, and never runs it', () => {
    const w = window as unknown as { hacked?: boolean };
    w.hacked = false;
    const evil = inspectHtml('Hello <img src="x" onerror="window.hacked = true">');
    expect(evil.dangers.map((d) => d.tag)).toEqual(['img']);
    expect(evil.body.querySelector('img')?.getAttribute('onerror')).toBe('window.hacked = true');
    expect(inspectHtml('<script>window.hacked = true</script>').dangers).toHaveLength(1);
    expect(inspectHtml('<a href="javascript:alert(1)">x</a>').dangers).toHaveLength(1);
    expect(inspectHtml('Hello <b>Riya</b>').dangers).toHaveLength(0);
    expect(inspectHtml('Hello Riya').dangers).toHaveLength(0);
    expect(w.hacked).toBe(false);
  });

  it('makes an inert copy for the preview that still looks the same', () => {
    const html = inertHtml(
      inspectHtml(
        'Hi <b>Riya</b> <img src="x" onerror="window.hacked = true"><script>1</script><a href="javascript:x()">a</a>',
      ).body,
    );
    expect(html).toContain('<b>Riya</b>');
    expect(html).toContain('<img src="data:,">');
    expect(html).not.toMatch(/onerror|<script|javascript:/);
  });
});

describe('imperative and declarative to-do lists agree', () => {
  it('for random sequences of actions', () => {
    let seed = 11;
    const rand = (n: number) => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed % n;
    };
    for (let round = 0; round < 50; round++) {
      const root = mount('<ul></ul><span>0</span>');
      const list = root.querySelector('ul')!;
      const counter = root.querySelector('span')!;
      let items: Todo[] = [];
      for (let k = 0; k < 12; k++) {
        const r = rand(4);
        const a: TodoAction =
          r < 2 || items.length === 0
            ? { kind: 'add', text: `task ${k}` }
            : r === 2
              ? { kind: 'remove', index: rand(items.length) }
              : { kind: 'doneAll' };
        todoImperative(list, counter, a);
        items = todoReducer(items, a);
        expect([...list.children].map((li) => li.textContent)).toEqual(items.map((t) => t.text));
        expect([...list.children].map((li) => li.classList.contains('done'))).toEqual(
          items.map((t) => t.done),
        );
        expect(counter.textContent).toBe(String(items.length));
      }
    }
  });

  it('forgetting a step breaks only the counter', () => {
    const root = mount('<ul></ul><span>0</span>');
    const list = root.querySelector('ul')!;
    const counter = root.querySelector('span')!;
    todoImperative(list, counter, { kind: 'add', text: 'a' });
    todoImperative(list, counter, { kind: 'add', text: 'b' });
    todoImperative(list, counter, { kind: 'remove', index: 0 }, true);
    expect(list.children.length).toBe(1);
    expect(counter.textContent).toBe('2'); // out of sync
  });
});
