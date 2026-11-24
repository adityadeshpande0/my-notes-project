import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import { nodeLabel, samePath, type DomNode, type DomPath } from './lib/domTree';

/**
 * The DOM as a tree (like DevTools → Elements). A keyboard-friendly ARIA
 * tree: ↑ ↓ move, → open, ← close, Enter selects. Built from data read out of
 * the real mini page (lib/domTree.ts), so it always shows the live DOM.
 */
const key = (p: DomPath) => p.join('.');

export default function DomTreeView({
  nodes,
  selected,
  hovered,
  onSelect,
  onHover,
  flash,
  label = 'DOM tree',
  compact,
}: {
  nodes: DomNode[];
  selected?: DomPath | null;
  hovered?: DomPath | null;
  onSelect?: (n: DomNode) => void;
  onHover?: (n: DomNode | null) => void;
  /** Paths to flash: changed (amber) or added (green). */
  flash?: Map<string, 'changed' | 'added'>;
  label?: string;
  compact?: boolean;
}) {
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [focus, setFocus] = useState<string | null>(null);

  const visible: DomNode[] = [];
  const collect = (list: DomNode[]) =>
    list.forEach((n) => {
      visible.push(n);
      if (!closed.has(key(n.path))) collect(n.children);
    });
  collect(nodes);
  // The one node Tab lands on: the focused one if visible, else the selection, else the first.
  const tabStop =
    focus && visible.some((v) => key(v.path) === focus)
      ? focus
      : selected && visible.some((v) => samePath(v.path, selected))
        ? key(selected)
        : visible[0] && key(visible[0].path);

  const move = (n: DomNode | undefined) => {
    if (!n) return;
    setFocus(key(n.path));
    onHover?.(n);
    requestAnimationFrame(() => document.getElementById(`dt-${label}-${key(n.path)}`)?.focus());
  };
  const parentOf = (n: DomNode) => visible.find((v) => v.children.includes(n));

  const onKey = (e: KeyboardEvent, n: DomNode) => {
    const i = visible.indexOf(n);
    const k = key(n.path);
    if (e.key === 'ArrowDown') move(visible[i + 1]);
    else if (e.key === 'ArrowUp') move(visible[i - 1]);
    else if (e.key === 'ArrowRight') {
      if (n.children.length && closed.has(k))
        setClosed((s) => new Set([...s].filter((x) => x !== k)));
      else move(n.children[0]);
    } else if (e.key === 'ArrowLeft') {
      if (n.children.length && !closed.has(k)) setClosed((s) => new Set(s).add(k));
      else move(parentOf(n));
    } else if (e.key === 'Enter' || e.key === ' ') onSelect?.(n);
    else return;
    e.preventDefault();
  };

  const render = (n: DomNode, level: number) => {
    const k = key(n.path);
    const open = !closed.has(k);
    const isSel = samePath(n.path, selected);
    const isHot = samePath(n.path, hovered);
    return (
      <li
        key={k}
        role="treeitem"
        aria-level={level}
        aria-expanded={n.children.length ? open : undefined}
        aria-selected={isSel}
      >
        <div
          id={`dt-${label}-${k}`}
          className={`dt-node is-${n.kind} ${n.whitespace ? 'is-ws' : ''} ${isSel ? 'is-selected' : ''} ${isHot ? 'is-hot' : ''} ${flash?.get(k) ? `is-${flash.get(k)}` : ''}`}
          style={{ paddingLeft: `${(level - 1) * (compact ? 0.75 : 1)}rem` }}
          tabIndex={tabStop === k ? 0 : -1}
          onClick={() => {
            setFocus(k);
            onSelect?.(n);
          }}
          onMouseEnter={() => onHover?.(n)}
          onMouseLeave={() => onHover?.(null)}
          onFocus={() => onHover?.(n)}
          onKeyDown={(e) => onKey(e, n)}
        >
          <span
            className="dt-twisty"
            aria-hidden="true"
            onClick={(e) => {
              if (!n.children.length) return;
              e.stopPropagation();
              setClosed((s) => {
                const next = new Set(s);
                if (next.has(k)) next.delete(k);
                else next.add(k);
                return next;
              });
            }}
          >
            {n.children.length ? (open ? '▾' : '▸') : ''}
          </span>
          {n.kind === 'element' ? (
            <span className="viz-mono">
              <span className="dt-punct">&lt;</span>
              <span className="dt-tag">{n.tag}</span>
              {n.id && <span className="dt-attr">#{n.id}</span>}
              {n.classes && n.classes.length > 0 && (
                <span className="dt-attr">.{n.classes.join('.')}</span>
              )}
              <span className="dt-punct">&gt;</span>
            </span>
          ) : (
            <span className={`viz-mono ${n.whitespace ? 'dt-ws' : 'dt-text'}`}>
              {nodeLabel(n, compact)}
            </span>
          )}
        </div>
        {n.children.length > 0 && open && (
          <ul
            role="group"
            className="dt-group"
            // The parent/child rail sits under this node's twisty.
            style={{ '--rail': `${(level - 1) * (compact ? 0.75 : 1) + 0.45}rem` } as CSSProperties}
          >
            {n.children.map((c) => render(c, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <ul role="tree" aria-label={label} className={`dt-tree ${compact ? 'is-compact' : ''}`}>
      {nodes.length === 0 ? <li className="dt-empty">(empty)</li> : nodes.map((n) => render(n, 1))}
    </ul>
  );
}
