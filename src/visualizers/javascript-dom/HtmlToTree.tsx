import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from '../../lib/hooks';
import DomTreeView from './DomTreeView';
import LiveDomSandbox, { type Highlight, type Sandbox } from '../core/sandbox/LiveDomSandbox';
import {
  childrenPath,
  cssPath,
  describeNode,
  flattenTree,
  nodeAt,
  pathOf,
  siblingOf,
  textPath,
  toTree,
  type DomPath,
} from './lib/domTree';
import { CHAI_PAGE } from './lib/templates';

/**
 * #1 HTML → Tree → Page. The tree is read from the REAL mini page (never
 * typed in by hand), and all three panels share one "which node?" state, so
 * hovering anything lights up the same node everywhere.
 *
 * React idea: lifting state up. The page, the tree and the source don't talk
 * to each other. They all read `selected`/`hovered` from their shared parent
 * and report back to it, so they can never disagree.
 */
const LINES = CHAI_PAGE.split('\n');

/** Which source lines each element was written on (tags appear in tree order). */
function sourceLines(root: HTMLElement) {
  const map = new Map<string, [number, number]>();
  let from = 0;
  for (const n of flattenTree(toTree(root))) {
    if (n.kind !== 'element') continue;
    const start = LINES.findIndex((l, i) => i >= from && l.includes(`<${n.tag}`));
    if (start < 0) continue;
    const end = LINES.findIndex((l, i) => i >= start && l.includes(`</${n.tag}>`));
    map.set(n.path.join('.'), [start, end < 0 ? start : end]);
    from = start + 1;
  }
  return map;
}

export default function HtmlToTree() {
  const reduced = useReducedMotion();
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [whitespace, setWhitespace] = useState(false);
  const [peelOn, setPeelOn] = useState(false);
  const [selected, setSelected] = useState<DomPath | null>(null);
  const [hovered, setHovered] = useState<DomPath | null>(null);
  const peeled = peelOn && !reduced;
  const panelsRef = useRef<HTMLDivElement>(null);
  const [links, setLinks] = useState<[number, number][]>([]);

  const onReady = useCallback((sb: Sandbox) => {
    setRoot(sb.root);
    // Start on the second menu item, as in the article's example.
    const li = sb.root.querySelectorAll('li')[1];
    setSelected(li ? pathOf(sb.root, li) : null);
  }, []);

  // The tree is re-read from the real DOM, and the HTML lines are matched to it.
  const tree = useMemo(() => (root ? toTree(root, whitespace) : []), [root, whitespace]);
  const lines = useMemo(
    () => (root ? sourceLines(root) : new Map<string, [number, number]>()),
    [root],
  );

  const active = hovered ?? selected;
  const activeNode = root && active ? nodeAt(root, active) : null;
  // Text nodes can't be outlined on their own: light up their parent element.
  const activeEl =
    activeNode && (activeNode.nodeType === 1 ? (activeNode as Element) : activeNode.parentElement);
  const elPath = root && activeEl ? pathOf(root, activeEl) : null;
  const activeRange = elPath ? lines.get(elPath.join('.')) : undefined;
  const highlights: Highlight[] = useMemo(
    () =>
      activeEl && activeEl !== root ? [{ el: activeEl, tone: hovered ? 'hover' : 'match' }] : [],
    [activeEl, root, hovered],
  );

  const lineToPath = (i: number): DomPath | null => {
    let best: string | null = null;
    for (const [k, [a, b]] of lines)
      if (a <= i && i <= b && (best === null || k.length > best.length)) best = k;
    return best === null ? null : best.split('.').map(Number);
  };

  // Peeled: draw a dashed line through the same node in each layer.
  useLayoutEffect(() => {
    const box = panelsRef.current;
    if (!peeled || !box || !activeEl) {
      setLinks([]);
      return;
    }
    const measure = () => {
      const base = box.getBoundingClientRect();
      const centre = (el: Element | null | undefined) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return [
          r.left + Math.min(r.width / 2, 60) - base.left,
          r.top + r.height / 2 - base.top,
        ] as [number, number];
      };
      const line = box.querySelector<HTMLElement>('.dm-source .vc-line.is-on');
      const node =
        box.querySelector<HTMLElement>('.dt-node.is-hot') ??
        box.querySelector<HTMLElement>('.dt-node.is-selected');
      // Each sheet is cut short: scroll it so the active node is in view.
      for (const el of [line, node]) {
        const sheet = el?.closest<HTMLElement>('.dm-panel');
        if (!el || !sheet) continue;
        // Add up offsetTop until we reach the sheet (transforms don't affect it).
        let y = 0;
        let cur: HTMLElement | null = el;
        while (cur && cur !== sheet && sheet.contains(cur)) {
          y += cur.offsetTop;
          cur = cur.offsetParent as HTMLElement | null;
        }
        if (cur !== sheet) y -= sheet.offsetTop;
        sheet.scrollTop = y - sheet.clientHeight / 2;
      }
      const pts = [centre(line), centre(node), centre(activeEl)].filter(
        (p): p is [number, number] => !!p,
      );
      setLinks(pts);
    };
    measure();
    // Measure again once the sheets have finished tilting.
    box.addEventListener('animationend', measure);
    window.addEventListener('resize', measure);
    return () => {
      box.removeEventListener('animationend', measure);
      window.removeEventListener('resize', measure);
    };
  }, [peeled, activeEl, active, whitespace]);

  const ul = root?.querySelector('ul');

  return (
    <div className="viz not-prose">
      <p className="viz-title">HTML → Tree → Page</p>
      <p className="viz-sub">
        Hover or focus anything in any panel. The same node lights up in all three, like your
        browser’s DevTools.
      </p>
      <div className="dm-row dm-toggles">
        <label className="dm-check">
          <input
            type="checkbox"
            checked={whitespace}
            onChange={(e) => setWhitespace(e.target.checked)}
          />
          Show whitespace text nodes
        </label>
        {!reduced && (
          <label className="dm-check">
            <input type="checkbox" checked={peelOn} onChange={(e) => setPeelOn(e.target.checked)} />
            Peel apart
          </label>
        )}
      </div>
      {whitespace && ul && (
        <p className="dm-small dm-note">
          The DOM keeps even the spaces!{' '}
          <code className="viz-mono">ul.children.length = {ul.children.length}</code> vs{' '}
          <code className="viz-mono">ul.childNodes.length = {ul.childNodes.length}</code>. That’s
          why <code>children</code> (elements only) is often handier than <code>childNodes</code>{' '}
          (everything).
        </p>
      )}

      <div ref={panelsRef} className={`dm-panels ${peeled ? 'is-peeled' : ''}`}>
        <div className="viz-panel dm-panel is-page">
          <div className="viz-label">Page</div>
          <LiveDomSandbox
            template={CHAI_PAGE}
            onReady={onReady}
            onHover={(el) => setHovered(el && root ? pathOf(root, el) : null)}
            highlights={highlights}
          />
        </div>
        <div className="viz-panel dm-panel is-tree">
          <div className="viz-label">DOM tree (inside body)</div>
          <DomTreeView
            nodes={tree}
            selected={selected}
            hovered={hovered}
            onSelect={(n) => setSelected(n.path)}
            onHover={(n) => setHovered(n ? n.path : null)}
            label="chai-tree"
          />
        </div>
        <div className="viz-panel dm-panel is-html">
          <div className="viz-label">HTML source</div>
          <pre
            className="vc-code viz-mono dm-source"
            aria-label="HTML source (click a line to select its element)"
          >
            {LINES.map((line, i) => {
              const on = !!activeRange && i >= activeRange[0] && i <= activeRange[1];
              return (
                <div
                  key={i}
                  className={`vc-line ${on ? 'is-on' : ''}`}
                  onMouseEnter={() => setHovered(lineToPath(i))}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => {
                    const p = lineToPath(i);
                    if (p) setSelected(p);
                  }}
                >
                  <span className="vc-ln" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span>
                    <HtmlLine text={line} />
                  </span>
                </div>
              );
            })}
          </pre>
        </div>
        {peeled && links.length > 1 && (
          <svg className="dm-links" aria-hidden="true">
            <polyline points={links.map((p) => p.join(',')).join(' ')} />
            {links.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r={4} />
            ))}
          </svg>
        )}
      </div>
      {peeled && (
        <p className="dm-small dm-muted dm-legend">
          <span>Back: the HTML you wrote</span>
          <span>Middle: the tree the browser built</span>
          <span>Front: the page drawn from the tree</span>
        </p>
      )}

      {root && selected && (
        <Inspector root={root} path={selected} whitespace={whitespace} onJump={setSelected} />
      )}
    </div>
  );
}

/** A line of HTML with simple colouring: tags and attributes. */
function HtmlLine({ text }: { text: string }) {
  const parts = text.split(/(<\/?[a-z0-9]+|\s[a-z-]+="[^"]*"|>)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => (
        <span
          key={i}
          className={
            p.startsWith('<') || p === '>'
              ? 'dm-h-tag'
              : /^\s[a-z-]+="/.test(p)
                ? 'dm-h-attr'
                : undefined
          }
        >
          {p}
        </span>
      ))}
    </>
  );
}

/** Details of the selected node, read straight from the real DOM. */
function Inspector({
  root,
  path,
  whitespace,
  onJump,
}: {
  root: HTMLElement;
  path: DomPath;
  whitespace: boolean;
  onJump: (p: DomPath) => void;
}) {
  const node = nodeAt(root, path);
  if (!node) return null;
  const isEl = node.nodeType === 1;
  const el = node as Element;
  const parent = node.parentNode === root ? null : node.parentNode;
  const prev = siblingOf(node, 'prev', whitespace);
  const next = siblingOf(node, 'next', whitespace);

  const family = (name: string, n: Node | null) => (
    <span className="dm-small">
      {name}:{' '}
      <button
        type="button"
        className="dm-link viz-mono"
        disabled={!n}
        onClick={() => {
          const p = n && pathOf(root, n);
          if (p) onJump(p);
        }}
      >
        {n ? describeNode(n) : name === 'parent' ? '<body>' : 'none'}
      </button>
    </span>
  );

  return (
    <div className="dm-inspector" aria-live="polite">
      <div className="dm-row">
        <span className="dm-badge">{isEl ? 'element node' : 'text node'}</span>
        {family('parent', parent)}
        {isEl && <span className="dm-small">children: {el.children.length}</span>}
        {family('previous', prev)}
        {family('next', next)}
      </div>
      <div className="dm-js viz-mono" aria-label="JavaScript that reaches this node">
        {isEl ? (
          <>
            <div>document.querySelector({JSON.stringify(cssPath(root, el))})</div>
            <div>{childrenPath(root, el)}</div>
          </>
        ) : (
          <div>{textPath(root, node)}</div>
        )}
      </div>
      {isEl ? (
        <dl className="dm-props viz-mono">
          <dt>tagName</dt>
          <dd>"{el.tagName}"</dd>
          <dt>id</dt>
          <dd>"{el.id}"</dd>
          <dt>className</dt>
          <dd>"{el.className}"</dd>
          <dt>textContent</dt>
          <dd>{JSON.stringify(el.textContent ?? '')}</dd>
        </dl>
      ) : (
        <dl className="dm-props viz-mono">
          <dt>nodeName</dt>
          <dd>"#text"</dd>
          <dt>textContent</dt>
          <dd>{JSON.stringify(node.textContent ?? '')}</dd>
        </dl>
      )}
      <p className="dm-sandbox-note">In this demo, document.body is the mini page.</p>
    </div>
  );
}
