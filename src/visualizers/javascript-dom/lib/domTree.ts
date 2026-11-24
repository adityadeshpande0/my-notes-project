/**
 * Helpers for "The DOM". Plain TypeScript working on real DOM nodes (in the
 * browser, or in jsdom for the tests). No React.
 *
 * - toTree: read a live DOM subtree into plain data for the tree view.
 * - cssPath / childrenPath: two JavaScript expressions that reach a node.
 *   domTree.test.ts checks both really select the node, for every node.
 * - inspectHtml: parse an HTML string WITHOUT running it (DOMParser) and
 *   flag anything that would run code (on* handlers, <script>, javascript:).
 * - The to-do helpers for the imperative-vs-declarative tab.
 */

export type DomPath = number[];

export interface DomNode {
  /** childNodes indexes from the root: stable, and includes text nodes. */
  path: DomPath;
  kind: 'element' | 'text';
  /** Element tag, lowercase ("li"). */
  tag?: string;
  id?: string;
  classes?: string[];
  attrs?: [string, string][];
  /** Text node content (or an element's own short text, for previews). */
  text?: string;
  /** A text node made only of spaces and line breaks. */
  whitespace?: boolean;
  children: DomNode[];
}

const isWhitespace = (n: Node) => n.nodeType === 3 && !(n.textContent ?? '').trim();

/** Read the live DOM under `root` into plain data. */
export function toTree(root: Node, withWhitespace = false, path: DomPath = []): DomNode[] {
  const out: DomNode[] = [];
  root.childNodes.forEach((n, i) => {
    const p = [...path, i];
    if (n.nodeType === 3) {
      const ws = isWhitespace(n);
      if (ws && !withWhitespace) return;
      out.push({ path: p, kind: 'text', text: n.textContent ?? '', whitespace: ws, children: [] });
    } else if (n.nodeType === 1) {
      const el = n as Element;
      out.push({
        path: p,
        kind: 'element',
        tag: el.tagName.toLowerCase(),
        id: el.id || undefined,
        classes: [...el.classList],
        attrs: [...el.attributes].map((a) => [a.name, a.value] as [string, string]),
        children: toTree(el, withWhitespace, p),
      });
    }
  });
  return out;
}

export const flattenTree = (nodes: DomNode[]): DomNode[] =>
  nodes.flatMap((n) => [n, ...flattenTree(n.children)]);

export const samePath = (a: DomPath | null | undefined, b: DomPath | null | undefined) =>
  !!a && !!b && a.length === b.length && a.every((x, i) => x === b[i]);

export function nodeAt(root: Node, path: DomPath): Node | null {
  let cur: Node | null = root;
  for (const i of path) {
    cur = cur?.childNodes[i] ?? null;
    if (!cur) return null;
  }
  return cur;
}

export function pathOf(root: Node, node: Node): DomPath | null {
  const path: number[] = [];
  let cur: Node | null = node;
  while (cur && cur !== root) {
    const parent: Node | null = cur.parentNode;
    if (!parent) return null;
    path.unshift([...parent.childNodes].indexOf(cur as ChildNode));
    cur = parent;
  }
  return cur === root ? path : null;
}

const cssEscape = (s: string) =>
  typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(s) : s.replace(/[^\w-]/g, '\\$&');

/**
 * A CSS selector that finds exactly this element inside `root`: the nearest
 * ancestor with an id, then `> tag:nth-child(k)` steps down to it.
 */
export function cssPath(root: Element, el: Element): string {
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur !== root) {
    if (cur.id) {
      parts.unshift(`#${cssEscape(cur.id)}`);
      return parts.join(' > ');
    }
    const parent: Element | null = cur.parentElement;
    if (!parent) break;
    const k = [...parent.children].indexOf(cur) + 1;
    parts.unshift(`${cur.tagName.toLowerCase()}:nth-child(${k})`);
    cur = parent;
  }
  // Reached the root: anchor at it (in the demo, `document.body`).
  return `body > ${parts.join(' > ')}`;
}

/** The element-children route: document.body.children[2].children[1] */
export function childrenPath(root: Element, el: Element): string {
  const steps: number[] = [];
  let cur: Element | null = el;
  while (cur && cur !== root) {
    const parent: Element | null = cur.parentElement;
    if (!parent) break;
    steps.unshift([...parent.children].indexOf(cur));
    cur = parent;
  }
  return `document.body${steps.map((i) => `.children[${i}]`).join('')}`;
}

/** How to reach a text node: its parent element, then childNodes[k]. */
export function textPath(root: Element, text: Node): string {
  const parent = text.parentElement!;
  const k = [...parent.childNodes].indexOf(text as ChildNode);
  const base =
    parent === root
      ? 'document.body'
      : `document.querySelector(${JSON.stringify(cssPath(root, parent))})`;
  return `${base}.childNodes[${k}]`;
}

/**
 * Follow a childrenPath expression for real (the tests use this to prove the
 * expression reaches the right element). `root` plays document.body.
 */
export function followChildrenPath(root: Element, expr: string): Element | null {
  let cur: Element | null = root;
  for (const m of expr.matchAll(/\.children\[(\d+)\]/g)) cur = cur?.children[Number(m[1])] ?? null;
  return cur;
}

/** Run a cssPath inside `root`, where "body" means the root itself. */
export function queryCssPath(root: Element, selector: string): Element | null {
  return root.querySelector(selector.replace(/^body\s*>\s*/, ':scope > '));
}

// ─── XSS inspection ───────────────────────────────────────────────────

export interface Danger {
  tag: string;
  what: string;
}

/**
 * Parse HTML with DOMParser, which builds the nodes but never runs scripts or
 * event handlers, then list everything that WOULD run code if this went into
 * innerHTML on a real page.
 */
export function inspectHtml(html: string): { body: HTMLElement; dangers: Danger[] } {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const dangers: Danger[] = [];
  // Scan the whole document: a lone <script> is parsed into <head>, not <body>.
  for (const el of doc.documentElement.querySelectorAll('*')) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'script') dangers.push({ tag, what: 'a <script> element' });
    for (const a of el.attributes) {
      if (a.name.toLowerCase().startsWith('on'))
        dangers.push({ tag, what: `${a.name}="${a.value}" would run code` });
      if (/^\s*javascript:/i.test(a.value))
        dangers.push({ tag, what: `${a.name} is a javascript: URL` });
    }
  }
  return { body: doc.body, dangers };
}

// ─── Imperative vs declarative to-do ──────────────────────────────────

export type TodoAction =
  { kind: 'add'; text: string } | { kind: 'remove'; index: number } | { kind: 'doneAll' };

export interface Todo {
  text: string;
  done: boolean;
}

/** Declarative: the data changes; the UI is drawn from it. */
export function todoReducer(items: Todo[], a: TodoAction): Todo[] {
  if (a.kind === 'add') return [...items, { text: a.text, done: false }];
  if (a.kind === 'remove') return items.filter((_, i) => i !== a.index);
  return items.map((t) => ({ ...t, done: true }));
}

/**
 * Imperative: change the list element step by step. Returns the DOM calls
 * made, in words. With `forgetCounter`, removing an item skips updating the
 * counter: the classic forgotten step.
 */
export function todoImperative(
  list: Element,
  counter: Element,
  a: TodoAction,
  forgetCounter = false,
): string[] {
  const doc = list.ownerDocument;
  const calls: string[] = [];
  if (a.kind === 'add') {
    const li = doc.createElement('li');
    li.textContent = a.text;
    list.append(li);
    calls.push('createElement("li")', 'li.textContent = …', 'list.append(li)');
    counter.textContent = String(list.children.length);
    calls.push('counter.textContent = …');
  } else if (a.kind === 'remove') {
    const li = list.children[a.index];
    if (li) {
      li.remove();
      calls.push('li.remove()');
    }
    if (!forgetCounter) {
      counter.textContent = String(list.children.length);
      calls.push('counter.textContent = …');
    }
  } else {
    for (const li of list.children) {
      li.classList.add('done');
      calls.push('li.classList.add("done")');
    }
  }
  return calls;
}
