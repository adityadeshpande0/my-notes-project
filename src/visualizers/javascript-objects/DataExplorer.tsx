import { useMemo, useState, type KeyboardEvent } from 'react';
import { ArrayStrip } from '../core/array';
import { Tabs } from '../core/code';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import {
  ACTION_CODE,
  buildTree,
  flatten,
  makeOrder,
  MENU,
  nextOptions,
  pathCode,
  runItems,
  segCode,
  show,
  typeName,
  walk,
  type Item,
  type ItemsAction,
  type Order,
  type Seg,
  type TreeNode,
} from './lib/objectSteps';

/**
 * #2 Explore real data. A food order as a tree. Click any node to get the
 * JavaScript path to it, then watch a walker follow the path one step at a
 * time. Paths are built from the data (lib/objectSteps.ts) and the tests
 * check that every one, run as real JavaScript, returns the value shown.
 */
export default function DataExplorer() {
  const [order, setOrder] = useState<Order>(makeOrder);
  return (
    <div className="viz not-prose">
      <p className="viz-title">Explore real data</p>
      <p className="viz-sub">
        A food delivery order: objects inside objects, and an array of objects.
      </p>
      <Tabs
        twoUp
        label="Modes"
        tabs={[
          { id: 'find', name: 'Click to find the path' },
          { id: 'build', name: 'Build a path' },
          { id: 'array', name: 'Array of objects' },
        ]}
      >
        {(t) =>
          t === 'find' ? (
            <FindMode order={order} />
          ) : t === 'build' ? (
            <BuildMode order={order} />
          ) : (
            <ArrayMode order={order} setOrder={setOrder} />
          )
        }
      </Tabs>
      <EditDrawer order={order} setOrder={setOrder} />
    </div>
  );
}

// ─── The tree ─────────────────────────────────────────────────────────

const preview = (n: TreeNode) =>
  n.type === 'array'
    ? `[ ${n.children.length} ]`
    : n.type === 'object'
      ? `{ ${n.children.length} }`
      : show(n.value);

function Tree({
  root,
  selected,
  onSelect,
  hot,
  walker,
}: {
  root: TreeNode;
  selected: string;
  onSelect: (n: TreeNode) => void;
  /** A node to highlight (hovered path chip). */
  hot?: string;
  /** Where the walker is. */
  walker?: string;
}) {
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(['order', 'order.customer', 'order.items', 'order.items[1]']),
  );
  const [focus, setFocus] = useState(selected);
  const all = useMemo(() => flatten(root), [root]);
  const parentOf = (id: string) => all.find((n) => n.children.some((c) => c.id === id));
  // The nodes you can see right now, in order: what ↑ and ↓ move through.
  const visible: TreeNode[] = [];
  const collect = (n: TreeNode) => {
    visible.push(n);
    if (open.has(n.id)) n.children.forEach(collect);
  };
  collect(root);
  // The one node Tab lands on. If the remembered one is hidden inside a closed
  // folder, fall back to the selected node, then to the top, so the tree can
  // always be reached with the keyboard.
  const tabStop = visible.some((v) => v.id === focus)
    ? focus
    : visible.some((v) => v.id === selected)
      ? selected
      : visible[0].id;

  const toggle = (id: string, to?: boolean) =>
    setOpen((s) => {
      const next = new Set(s);
      if (to ?? !next.has(id)) next.add(id);
      else next.delete(id);
      return next;
    });

  const move = (id: string) => {
    setFocus(id);
    requestAnimationFrame(() => document.getElementById(`jo-node-${cssId(id)}`)?.focus());
  };

  const onKey = (e: KeyboardEvent, n: TreeNode) => {
    const i = visible.findIndex((v) => v.id === n.id);
    if (e.key === 'ArrowDown' && i < visible.length - 1) move(visible[i + 1].id);
    else if (e.key === 'ArrowUp' && i > 0) move(visible[i - 1].id);
    else if (e.key === 'ArrowRight') {
      if (n.children.length && !open.has(n.id)) toggle(n.id, true);
      else if (n.children.length) move(n.children[0].id);
    } else if (e.key === 'ArrowLeft') {
      if (open.has(n.id) && n.children.length) toggle(n.id, false);
      else {
        const p = parentOf(n.id);
        if (p) move(p.id);
      }
    } else if (e.key === 'Enter' || e.key === ' ') onSelect(n);
    else if (e.key === 'Home') move(visible[0].id);
    else if (e.key === 'End') move(visible[visible.length - 1].id);
    else return;
    e.preventDefault();
  };

  const render = (n: TreeNode, level: number) => {
    const isOpen = open.has(n.id);
    const hasKids = n.children.length > 0;
    return (
      <li
        key={n.id}
        role="treeitem"
        aria-level={level}
        aria-expanded={hasKids ? isOpen : undefined}
        aria-selected={selected === n.id}
        className="jo-tree-li"
      >
        <div
          id={`jo-node-${cssId(n.id)}`}
          className={`jo-node ${selected === n.id ? 'is-selected' : ''} ${hot === n.id ? 'is-hot' : ''} ${walker === n.id ? 'is-walker' : ''}`}
          tabIndex={tabStop === n.id ? 0 : -1}
          onClick={() => {
            setFocus(n.id);
            onSelect(n);
          }}
          onKeyDown={(e) => onKey(e, n)}
          style={{ paddingLeft: `${(level - 1) * 1}rem` }}
        >
          <span
            className="jo-twisty"
            aria-hidden="true"
            onClick={(e) => {
              if (!hasKids) return;
              e.stopPropagation();
              toggle(n.id);
            }}
          >
            {hasKids ? (isOpen ? '▾' : '▸') : ''}
          </span>
          <span className={`jo-icon is-${n.type}`} aria-hidden="true">
            {n.type === 'array' ? '[ ]' : n.type === 'object' ? '{ }' : '•'}
          </span>
          <span className="jo-key viz-mono">{n.label}</span>
          <span className={`jo-preview viz-mono is-${n.type}`}>{preview(n)}</span>
          {walker === n.id && (
            <span className="jo-walker" aria-hidden="true">
              🚶
            </span>
          )}
        </div>
        {hasKids && isOpen && (
          <ul role="group" className="jo-tree-group">
            {n.children.map((c) => render(c, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <ul role="tree" aria-label="The order data" className="jo-tree">
      {render(root, 1)}
    </ul>
  );
}

const cssId = (id: string) => id.replace(/[^\w-]/g, '_');

/** The path as chips: order › .items › [1] › .name */
function PathChips({
  segs,
  optional,
  onHover,
}: {
  segs: Seg[];
  optional?: boolean;
  onHover?: (k: number | null) => void;
}) {
  return (
    <div className="jo-chips" aria-label={`Path: ${pathCode(segs, 'order', optional)}`}>
      <span
        className="jo-chip viz-mono"
        onMouseEnter={() => onHover?.(0)}
        onMouseLeave={() => onHover?.(null)}
      >
        order
      </span>
      {segs.map((s, k) => (
        <span key={k} className="jo-chip-wrap">
          <span className="jo-sep" aria-hidden="true">
            ›
          </span>
          <span
            className="jo-chip viz-mono"
            onMouseEnter={() => onHover?.(k + 1)}
            onMouseLeave={() => onHover?.(null)}
          >
            {segCode(s, optional)}
          </span>
        </span>
      ))}
    </div>
  );
}

function describe(seg: Seg | null, value: unknown) {
  if (!seg) return 'go to order';
  if (seg.kind === 'index') return `take index ${seg.i}`;
  const t = typeName(value);
  // Objects and arrays get opened; plain values get read.
  return t === 'object' || t === 'array'
    ? `open ${seg.key}${t === 'array' ? ' (an array)' : ''}`
    : `read ${seg.key}`;
}

// ─── Mode 1: click to find the path ───────────────────────────────────

function FindMode({ order }: { order: Order }) {
  const root = useMemo(() => buildTree(order), [order]);
  const nodes = useMemo(() => flatten(root), [root]);
  const [selectedId, setSelectedId] = useState('order.items[1].name');
  const selected = nodes.find((n) => n.id === selectedId) ?? root;
  const [hover, setHover] = useState<number | null>(null);
  const [copied, setCopied] = useState('');
  // Hovering chip k lights up the node that the first k steps reach.
  const hot = hover === null ? undefined : pathCode(selected.segs.slice(0, hover));

  // The walk lives here (not in a keyed child), so clicking a new node
  // doesn't remount the tree and lose which folders are open.
  const steps = useMemo(() => walk(root.value, selected.segs, false), [root, selected]);
  const s = useStepper(steps.length, 900);
  const [walking, setWalking] = useState(false);
  const walkerId = walking ? pathCode(selected.segs.slice(0, s.index)) : undefined;
  const words = steps.slice(0, s.index + 1).map((st) => describe(st.seg, st.value));

  const select = (n: TreeNode) => {
    setSelectedId(n.id);
    setCopied('');
    setWalking(false);
    s.reset();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(selected.id);
      setCopied('Copied ✓');
    } catch {
      setCopied('Couldn’t copy here. Select the text instead.');
    }
  };

  return (
    <div className="jo-explorer">
      <div className="jo-pathbar">
        <PathChips segs={selected.segs} onHover={setHover} />
        <button type="button" className="viz-btn viz-btn--ghost jo-small" onClick={copy}>
          📋 Copy
        </button>
        {copied && (
          <span className="jo-small jo-muted" aria-live="polite">
            {copied}
          </span>
        )}
      </div>
      <div className="jo-walk-grid">
        <div className="viz-panel jo-tree-panel">
          <Tree root={root} selected={selected.id} onSelect={select} hot={hot} walker={walkerId} />
          <p className="jo-small jo-muted">Keys: ↑ ↓ move · → open · ← close · Enter select</p>
        </div>
        <div className="viz-panel jo-result-panel">
          <div className="viz-label">Value</div>
          <p className="jo-value">
            <strong className={`viz-mono is-${selected.type}`}>{show(selected.value)}</strong>{' '}
            <span className="jo-badge">{selected.type}</span>
          </p>
          <button
            type="button"
            className="viz-btn"
            onClick={() => {
              setWalking(true);
              s.reset();
              requestAnimationFrame(() => s.toggle());
            }}
          >
            Walk the path ▶
          </button>
          {walking && (
            <>
              <p className="jo-words jo-small" aria-live="polite">
                {words.join(' → ')}
                {s.atEnd && (
                  <>
                    {' → '}
                    <strong className="viz-mono">{show(selected.value)}</strong>
                  </>
                )}
              </p>
              <StepControls s={s} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Mode 2: build a path ─────────────────────────────────────────────

function BuildMode({ order }: { order: Order }) {
  const [segs, setSegs] = useState<Seg[]>([
    { kind: 'prop', key: 'coupon' },
    { kind: 'prop', key: 'code' },
  ]);
  const [optional, setOptional] = useState(false);
  // Values along the path (with ?. so building never throws).
  const along = walk(order, segs, true);
  const setAt = (k: number, seg: Seg) => setSegs([...segs.slice(0, k), seg]);
  const segValue = (s: Seg) => (s.kind === 'index' ? `i:${s.i}` : `k:${s.key}`);
  const fromValue = (v: string): Seg =>
    v.startsWith('i:')
      ? { kind: 'index', i: Number(v.slice(2)) }
      : { kind: 'prop', key: v.slice(2) };

  return (
    <>
      <div className="jo-build">
        <span className="jo-chip viz-mono">order</span>
        {segs.map((s, k) => {
          const opts = nextOptions(along[k]?.value);
          const has = opts.some((o) => segValue(o) === segValue(s));
          return (
            <select
              key={k}
              className="jo-input viz-mono"
              value={segValue(s)}
              onChange={(e) => setAt(k, fromValue(e.target.value))}
              aria-label={`Step ${k + 1}`}
            >
              {!has && <option value={segValue(s)}>{segCode(s, optional)}</option>}
              {opts.map((o) => (
                <option key={segValue(o)} value={segValue(o)}>
                  {segCode(o, optional)}
                </option>
              ))}
            </select>
          );
        })}
        {segs.length < 5 && (
          <button
            type="button"
            className="viz-btn viz-btn--icon"
            aria-label="Add a step"
            onClick={() => setSegs([...segs, nextOptions(along[segs.length]?.value)[0]])}
          >
            +
          </button>
        )}
        {segs.length > 0 && (
          <button
            type="button"
            className="viz-btn viz-btn--icon"
            aria-label="Remove the last step"
            onClick={() => setSegs(segs.slice(0, -1))}
          >
            −
          </button>
        )}
      </div>
      <label className="jo-check jo-gap">
        <input type="checkbox" checked={optional} onChange={(e) => setOptional(e.target.checked)} />
        Use <code>?.</code> instead
      </label>
      <BuildWalk
        key={`${pathCode(segs)}-${optional}`}
        order={order}
        segs={segs}
        optional={optional}
      />
    </>
  );
}

function BuildWalk({ order, segs, optional }: { order: Order; segs: Seg[]; optional: boolean }) {
  const steps = useMemo(() => walk(order, segs, optional), [order, segs, optional]);
  const s = useStepper(steps.length, 900);
  const last = steps[steps.length - 1];
  const shown = steps.slice(0, s.index + 1);
  const now = shown[shown.length - 1];
  return (
    <>
      <p className="jo-code-line viz-mono">{pathCode(segs, 'order', optional)}</p>
      <ol className="jo-path-walk" aria-label="The walk">
        {steps.map((st, k) => {
          const reached = k <= s.index;
          const crash = reached && st.error;
          const stop = reached && st.stopped;
          return (
            <li
              key={k}
              className={`jo-step ${reached ? 'is-reached' : ''} ${crash ? 'is-crash' : ''} ${stop ? 'is-stop' : ''}`}
            >
              <span className="viz-mono">{st.seg ? segCode(st.seg, optional) : 'order'}</span>
              <span className="jo-step-val viz-mono">
                {reached ? (crash ? '💥' : stop ? '🛑 undefined' : show(st.value)) : ''}
              </span>
              {k === s.index && !crash && !stop && (
                <span className="jo-walker" aria-hidden="true">
                  🚶
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <div
        className={`jo-result ${s.atEnd ? (last.error ? 'is-missing' : 'is-found') : ''}`}
        aria-live="polite"
      >
        {!s.atEnd ? (
          <span className="jo-muted">
            {now.seg
              ? `At ${segCode(now.seg, optional)}: ${show(now.value)}`
              : 'Step through the path.'}
          </span>
        ) : last.error ? (
          <>
            <strong className="jo-bad">💥 {last.error}</strong>
            <span className="jo-note">
              {' '}
              The step before was undefined, and you can’t read a property of undefined.
            </span>
          </>
        ) : last.stopped ? (
          <>
            <strong className="viz-mono">🛑 undefined</strong>
            <span className="jo-note">
              {' '}
              ?. saw undefined and stopped calmly instead of crashing.
            </span>
          </>
        ) : (
          <>
            → <strong className="viz-mono">{show(last.value)}</strong>
            {last.value === undefined && (
              <span className="jo-note"> (a missing property is just undefined)</span>
            )}
          </>
        )}
      </div>
      <StepControls s={s} />
    </>
  );
}

// ─── Mode 3: an array of objects ──────────────────────────────────────

function ArrayMode({ order, setOrder }: { order: Order; setOrder: (o: Order) => void }) {
  const [action, setAction] = useState<ItemsAction | null>(null);
  const items = order.items;
  const setItems = (next: Item[]) => setOrder({ ...order, items: next });
  const unused = MENU.filter((m) => !items.some((i) => i.name === m.name));
  return (
    <>
      <div className="jo-row">
        <span className="jo-small jo-muted">order.items:</span>
        {items.map((it) => (
          <button
            key={it.name}
            type="button"
            className="jo-toggle"
            onClick={() => items.length > 1 && setItems(items.filter((i) => i !== it))}
            disabled={items.length <= 1}
            aria-label={`Remove ${it.name}`}
          >
            {it.name} ✕
          </button>
        ))}
        {items.length < 5 &&
          unused.map((m) => (
            <button
              key={m.name}
              type="button"
              className="jo-toggle is-add"
              onClick={() => setItems([...items, { ...m }])}
              aria-label={`Add ${m.name}`}
            >
              + {m.name}
            </button>
          ))}
      </div>
      <div className="jo-row jo-gap">
        {(['map', 'filter', 'reduce'] as ItemsAction[]).map((a) => (
          <button
            key={a}
            type="button"
            className="viz-btn viz-mono"
            aria-pressed={action === a}
            onClick={() => setAction(a)}
          >
            {a}
          </button>
        ))}
      </div>
      {action ? (
        <ItemsRun key={`${action}-${JSON.stringify(items)}`} items={items} action={action} />
      ) : (
        <p className="jo-muted jo-small jo-gap">Pick a method to run on order.items.</p>
      )}
    </>
  );
}

function ItemsRun({ items, action }: { items: Item[]; action: ItemsAction }) {
  const run = useMemo(() => runItems(items, action), [items, action]);
  const s = useStepper(run.calls.length + 2, 900);
  const k = s.index - 1;
  const seen = run.calls.slice(0, Math.max(0, Math.min(k + 1, run.calls.length)));
  const current = k >= 0 && k < run.calls.length ? run.calls[k].index : -1;
  return (
    <>
      <p className="jo-code-line viz-mono">{ACTION_CODE[action]}</p>
      <div className="jo-item-cards">
        {items.map((it, i) => {
          const visit = seen.find((c) => c.index === i);
          return (
            <div
              key={it.name}
              className={`jo-item ${i === current ? 'is-now' : ''} ${visit && action === 'filter' ? (visit.result ? 'is-kept' : 'is-dropped') : visit ? 'is-done' : ''}`}
            >
              <span className="viz-mono">[{i}]</span>
              <strong>{it.name}</strong>
              <span className="viz-mono jo-small">
                ₹{it.price} × {it.qty}
              </span>
            </div>
          );
        })}
      </div>
      <div className="jo-gap">
        {action === 'map' && (
          <ArrayStrip
            items={seen.map((c, j) => ({ id: `m${j}`, label: show(c.result) }))}
            size="sm"
            ariaLabel="Names so far"
          />
        )}
        {action === 'filter' && (
          <ArrayStrip
            items={seen
              .filter((c) => c.result)
              .map((c) => ({
                id: items[c.index].name,
                label: items[c.index].name,
                sub: `₹${items[c.index].price}`,
              }))}
            size="sm"
            ariaLabel="Matching items"
          />
        )}
        {action === 'reduce' && seen.length > 0 && (
          <table className="jo-table">
            <thead>
              <tr>
                <th scope="col">sum before</th>
                <th scope="col">item</th>
                <th scope="col">price × qty</th>
                <th scope="col">new sum</th>
              </tr>
            </thead>
            <tbody>
              {seen.map((c) => (
                <tr key={c.index}>
                  <td className="viz-mono">{c.acc}</td>
                  <td>{items[c.index].name}</td>
                  <td className="viz-mono">
                    {items[c.index].price} × {items[c.index].qty}
                  </td>
                  <td className="viz-mono">
                    <strong>{String(c.result)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="jo-result" aria-live="polite">
        {s.atEnd ? (
          <>
            Result: <strong className="viz-mono">{show(run.out)}</strong>
          </>
        ) : (
          <span className="jo-muted">The callback visits one item per step.</span>
        )}
      </p>
      <StepControls s={s} />
    </>
  );
}

// ─── Editing the data ─────────────────────────────────────────────────

function EditDrawer({ order, setOrder }: { order: Order; setOrder: (o: Order) => void }) {
  return (
    <details className="jo-drawer">
      <summary>Edit data</summary>
      <div className="jo-form">
        <label className="jo-field">
          <span className="jo-small">status</span>
          <select
            className="jo-input"
            value={order.status}
            onChange={(e) => setOrder({ ...order, status: e.target.value })}
          >
            {['on the way', 'preparing', 'delivered'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="jo-field">
          <span className="jo-small">city</span>
          <input
            className="jo-input"
            value={order.customer.address.city}
            maxLength={20}
            onChange={(e) =>
              setOrder({
                ...order,
                customer: {
                  ...order.customer,
                  address: { ...order.customer.address, city: e.target.value },
                },
              })
            }
          />
        </label>
        {order.items.map((it, i) => (
          <label key={it.name} className="jo-field">
            <span className="jo-small">{it.name} qty</span>
            <input
              className="jo-input jo-short"
              type="number"
              min={1}
              max={9}
              value={it.qty}
              onChange={(e) => {
                const qty = Math.min(9, Math.max(1, Math.round(Number(e.target.value)) || 1));
                setOrder({
                  ...order,
                  items: order.items.map((x, j) => (j === i ? { ...x, qty } : x)),
                });
              }}
            />
          </label>
        ))}
        <button
          type="button"
          className="viz-btn viz-btn--ghost"
          onClick={() => setOrder(makeOrder())}
        >
          Reset
        </button>
      </div>
    </details>
  );
}
