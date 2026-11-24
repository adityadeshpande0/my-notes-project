import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from '../../lib/hooks';
import { ArrayStrip } from '../core/array';
import { CodeView, Tabs } from '../core/code';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import DomTreeView from './DomTreeView';
import LiveDomSandbox, { type Sandbox } from './LiveDomSandbox';
import {
  inertHtml,
  inspectHtml,
  todoImperative,
  todoReducer,
  type DomNode,
  toTree,
  type Todo,
  type TodoAction,
} from './lib/domTree';
import { str } from './lib/remoteCode';
import { BUILD_PAGE, GREETING_PAGE, TODO_PAGE } from './lib/templates';
import { useDomMirror } from './useDomMirror';

/**
 * #3 Create, insert, stay safe, and meet React. Three tabs:
 * build an element step by step, textContent vs innerHTML, and the same
 * to-do list written imperatively (plain DOM) and declaratively (React).
 */
type TabId = 'build' | 'safe' | 'react';

export default function BuildAndCompare() {
  return (
    <div className="viz not-prose dm-bac">
      <p className="viz-title">Create, insert, stay safe, and meet React</p>
      <Tabs<TabId>
        label="Parts of this visual"
        twoUp
        tabs={[
          { id: 'build', name: 'Build an element' },
          { id: 'safe', name: 'textContent vs innerHTML' },
          { id: 'react', name: 'Imperative vs declarative' },
        ]}
      >
        {(t) => (t === 'build' ? <BuildTab /> : t === 'safe' ? <SafeTab /> : <CompareTab />)}
      </Tabs>
    </div>
  );
}

// ─── Tab 1: Build an element ─────────────────────────────────────────

const BUILD_CODE = [
  'const li = document.createElement("li");',
  'li.textContent = "Cardamom Chai";',
  'li.classList.add("new");',
  'const menu = document.querySelector("ul");',
  'menu.append(li);',
];
// Which code line each step has just run (step 0 = nothing yet).
const BUILD_LINE = [-1, 0, 1, 2, 4];
const BUILD_NOTES = [
  'Press ▶ or → to run the code one line at a time.',
  'createElement made a new <li> object. It exists in memory, but it isn’t on the page.',
  'textContent filled it in. Still only in memory: the page hasn’t changed.',
  'classList.add gave it a class. Still floating, still invisible.',
  'Only now does it appear: append attached it to the tree.',
];
type Insert = 'append' | 'prepend' | 'before' | 'after';
const MAX_ITEMS = 8;

function BuildTab() {
  const reduced = useReducedMotion();
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [name, setName] = useState('Lemon Tea');
  const [lastCode, setLastCode] = useState<string[]>([]);
  const mirror = useDomMirror(root);
  const s = useStepper(BUILD_NOTES.length, 1500);
  // The real, detached <li> the stepper builds. A ref, because it's a DOM
  // object we hold on to, not something React draws.
  const liRef = useRef<HTMLLIElement | null>(null);

  const onReady = useCallback((sb: Sandbox) => {
    liRef.current = null;
    setRoot(sb.root);
  }, []);

  // Make the real DOM match the current step. Each line is safe to repeat,
  // so stepping backwards works too.
  useEffect(() => {
    const menu = root?.querySelector('ul');
    if (!root || !menu) return;
    if (s.index === 0) {
      liRef.current?.remove();
      liRef.current = null;
      return;
    }
    const li = (liRef.current ??= root.ownerDocument.createElement('li'));
    li.textContent = s.index >= 2 ? 'Cardamom Chai' : '';
    li.classList.toggle('new', s.index >= 3);
    if (s.index >= 4) {
      if (!li.isConnected) {
        menu.append(li);
        if (!reduced)
          li.animate(
            [
              { opacity: 0, transform: 'translateX(40px)' },
              { opacity: 1, transform: 'none' },
            ],
            450,
          );
      }
    } else li.remove();
  }, [s.index, root, reduced]);

  const menu = root?.querySelector('ul');
  // Read the list straight from the page (mirror.version changes after every DOM change).
  const items = useMemo(() => (menu ? [...menu.children] : []), [menu, mirror.version]); // eslint-disable-line react-hooks/exhaustive-deps
  const full = items.length >= MAX_ITEMS;

  const insert = (how: Insert) => {
    if (!menu || full) return;
    const li = menu.ownerDocument.createElement('li');
    li.textContent = name; // user text: textContent only, never innerHTML
    li.classList.add('new');
    const first = menu.firstElementChild;
    if (how === 'append') menu.append(li);
    else if (how === 'prepend') menu.prepend(li);
    else if (!first) return;
    else if (how === 'before') first.before(li);
    else first.after(li);
    if (!reduced)
      li.animate(
        [
          { opacity: 0, transform: 'scale(0.9)' },
          { opacity: 1, transform: 'none' },
        ],
        300,
      );
    setLastCode([
      'const li = document.createElement("li");',
      `li.textContent = ${str(name)};`,
      ...(how === 'append' || how === 'prepend'
        ? [`menu.${how}(li);`]
        : ['const first = menu.firstElementChild;', `first.${how}(li);`]),
    ]);
  };

  const removeAt = (i: number) => {
    const li = items[i];
    if (!li) return;
    li.remove();
    if (li === liRef.current) liRef.current = null;
    setLastCode([`menu.children[${i}].remove();`]);
  };

  const tray = s.index >= 1 && s.index < 4;
  const flying = s.index === 4 && !reduced;

  return (
    <>
      <div className="dm-build dm-gap">
        <div>
          <LiveDomSandbox
            template={BUILD_PAGE}
            resetKey={resetKey}
            onReady={onReady}
            onMutate={mirror.onMutate}
            address="menu.html"
          />
          <p className="dm-sandbox-note">In this demo, document is the mini page.</p>
        </div>
        <div>
          <div className="viz-panel dm-tray" aria-live="polite">
            <div className="viz-label">Memory (not on the page)</div>
            {tray || flying ? (
              <span
                key={flying ? 'fly' : 'still'}
                className={`dm-chip-el viz-mono ${flying ? 'is-flying' : ''}`}
              >
                &lt;li{s.index >= 3 ? ' class="new"' : ''}&gt;{s.index >= 2 ? 'Cardamom Chai' : ''}
                &lt;/li&gt;
                {s.index >= 3 && <span className="dm-badge is-good">.new</span>}
              </span>
            ) : (
              <p className="dm-small dm-muted" style={{ margin: 0 }}>
                {s.index === 0 ? '(empty)' : 'Empty again: the <li> moved onto the page.'}
              </p>
            )}
            {tray && (
              <p className="dm-small dm-muted" style={{ margin: '0.4rem 0 0' }}>
                exists, but not attached
              </p>
            )}
          </div>
          <div className="viz-panel dm-minimap">
            <div className="viz-label">The tree (green = just added)</div>
            <DomTreeView nodes={mirror.tree} flash={mirror.flash} compact label="build-tree" />
          </div>
        </div>
      </div>
      <div className="dm-gap">
        <CodeView
          label="The code"
          lines={BUILD_CODE.map((text, i) => ({
            text,
            state: BUILD_LINE[s.index] === i ? 'on' : undefined,
          }))}
        />
        <p className="viz-caption">{BUILD_NOTES[s.index]}</p>
        <StepControls s={s} />
      </div>

      <div className="viz-panel dm-gap">
        <div className="viz-label">Free play: insert your own</div>
        <div className="dm-row">
          <input
            className="dm-input dm-grow"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Text for the new item"
            maxLength={40}
          />
        </div>
        <div className="dm-btns dm-gap">
          {(['append', 'prepend', 'before', 'after'] as Insert[]).map((how) => (
            <button
              key={how}
              type="button"
              className="viz-btn viz-mono"
              disabled={full || ((how === 'before' || how === 'after') && !items.length)}
              onClick={() => insert(how)}
            >
              {how === 'before' || how === 'after' ? `${how}(first)` : `${how}`}
            </button>
          ))}
          <button
            type="button"
            className="viz-btn"
            onClick={() => {
              setResetKey((k) => k + 1);
              s.reset();
              setLastCode([]);
            }}
          >
            ↺ Reset
          </button>
        </div>
        {full && (
          <p className="dm-small dm-warn">That’s {MAX_ITEMS} items: remove one to add more.</p>
        )}
        <ul className="dm-items" aria-label="Items on the page">
          {items.map((li, i) => (
            <li key={i}>
              <span className="viz-mono">
                {i}: {li.textContent || '(empty)'}
              </span>
              <button
                type="button"
                className="viz-btn viz-mono"
                onClick={() => removeAt(i)}
                aria-label={`Remove item ${i}, ${li.textContent}`}
              >
                remove()
              </button>
            </li>
          ))}
        </ul>
        {lastCode.length > 0 && (
          <CodeView label="What that did" lines={lastCode.map((text) => ({ text }))} />
        )}
      </div>
    </>
  );
}

// ─── Tab 2: textContent vs innerHTML ─────────────────────────────────

const NAMES = ['Riya', '<b>Riya</b>', '<i>Aarav</i>', `<img src=x onerror="alert('hacked')">`];

/**
 * The preview page for the iframe: an inert copy of the parsed HTML, inside an
 * empty sandbox (no scripts) with a policy that blocks every request.
 */
const previewDoc = (html: string) =>
  `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:"><style>body{margin:0;padding:12px;font:16px/1.4 system-ui,sans-serif;color:oklch(0.25 0.02 260);background:oklch(0.99 0 0)}</style></head><body><p style="margin:0">${html}</p></body></html>`;

function SafeTab() {
  const [name, setName] = useState(NAMES[3]);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const onReady = useCallback((sb: Sandbox) => setRoot(sb.root), []);
  const html = `Hello ${name}`;

  // The safe side: real textContent on the real (sandboxed) page.
  useEffect(() => {
    const p = root?.querySelector('#greeting');
    if (p) p.textContent = html;
  }, [root, html]);

  // The risky side: DOMParser builds the nodes but never runs anything.
  const parsed = useMemo(() => inspectHtml(html), [html]);
  const tree = useMemo(() => toTree(parsed.body), [parsed]);
  const risky = parsed.dangers.length > 0;

  return (
    <>
      <div className="dm-row dm-gap">
        <input
          className="dm-input viz-mono dm-grow"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Your name"
          spellCheck={false}
        />
      </div>
      <div className="dm-chips" aria-label="Try a name">
        {NAMES.map((n) => (
          <button
            key={n}
            type="button"
            className="viz-btn viz-btn--ghost"
            aria-pressed={n === name}
            onClick={() => setName(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="dm-compare">
        <div className="viz-panel">
          <div className="dm-card-head">
            <code className="viz-mono">greeting.textContent = "Hello " + name</code>
            <span className="dm-badge is-good">✓ safe</span>
          </div>
          <LiveDomSandbox template={GREETING_PAGE} onReady={onReady} address="greeting.html" />
          <p className="dm-small dm-muted">
            The tags show up literally, as plain text. Nothing is built, nothing runs.
          </p>
        </div>
        <div className="viz-panel">
          <div className="dm-card-head">
            <code className="viz-mono">greeting.innerHTML = "Hello " + name</code>
            {risky ? (
              <span className="dm-badge is-bad">⚠ XSS risk</span>
            ) : (
              <span className="dm-badge is-warn">builds HTML</span>
            )}
          </div>
          <div className="viz-label">What the browser would build</div>
          <div className="dm-parsed">
            <ParsedTree nodes={tree} />
          </div>
          {risky && (
            <ul className="dm-danger-list">
              {parsed.dangers.map((d, i) => (
                <li key={i}>
                  ⚠️ <code className="viz-mono">&lt;{d.tag}&gt;</code>:{' '}
                  <code className="viz-mono">{d.what}</code>. This code would RUN in a real page!
                </li>
              ))}
            </ul>
          )}
          <div className="viz-label dm-gap">What you’d see</div>
          <iframe
            className="dm-preview"
            sandbox=""
            srcDoc={previewDoc(inertHtml(parsed.body))}
            title="Preview of the innerHTML result (scripts can’t run here)"
          />
          <p className="dm-small dm-muted">
            Shown inside a locked sandbox, so even the dangerous version can’t run here. In a real
            page, it would.
          </p>
        </div>
      </div>
      <p className="dm-rule">
        Use textContent for text. Only use innerHTML with HTML you wrote yourself.
      </p>
    </>
  );
}

/** The parsed nodes with ALL their attributes, dangerous ones in coral. */
function ParsedTree({ nodes }: { nodes: DomNode[] }) {
  if (!nodes.length) return <p className="dt-empty">(nothing)</p>;
  return (
    <ul className="dt-tree is-compact" aria-label="Nodes innerHTML would create">
      {nodes.map((n) => (
        <li key={n.path.join('.')}>
          <div
            className={`dt-node is-${n.kind}`}
            style={{ paddingLeft: `${(n.path.length - 1) * 0.75}rem`, cursor: 'default' }}
          >
            {n.kind === 'text' ? (
              <span className="viz-mono dt-text">"{n.text}"</span>
            ) : (
              <span className="viz-mono" style={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
                <span className="dt-punct">&lt;</span>
                <span className="dt-tag">{n.tag}</span>
                {n.attrs?.map(([k, v]) => {
                  const bad = k.startsWith('on') || /^\s*javascript:/i.test(v);
                  return (
                    <span key={k} className={`dt-attr ${bad ? 'is-danger' : ''}`}>
                      {' '}
                      {bad && '⚠ '}
                      {k}="{v}"
                    </span>
                  );
                })}
                <span className="dt-punct">&gt;</span>
                <span className="dm-muted dm-small"> element</span>
              </span>
            )}
          </div>
          {n.children.length > 0 && <ParsedTree nodes={n.children} />}
        </li>
      ))}
    </ul>
  );
}

// ─── Tab 3: Imperative vs declarative ────────────────────────────────

const START = ['Buy milk', 'Learn the DOM'];

function CompareTab() {
  const [text, setText] = useState('Practise React');
  const [forget, setForget] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  // Left: the real DOM. Right: plain data that React draws.
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [calls, setCalls] = useState<string[]>([]);
  const [leftVersion, setLeftVersion] = useState(0);
  const [items, setItems] = useState<Todo[]>(START.map((t) => ({ text: t, done: false })));
  const [ids, setIds] = useState<number[]>(START.map((_, i) => i));
  const nextId = useRef(START.length);
  const [counts, setCounts] = useState({ left: 0, right: 0 });
  const rightList = useRef<HTMLDivElement>(null);

  const onReady = useCallback((sb: Sandbox) => {
    setRoot(sb.root);
    const list = sb.root.querySelector('#todos')!;
    const counter = sb.root.querySelector('#count')!;
    for (const t of START) todoImperative(list, counter, { kind: 'add', text: t });
  }, []);

  // Count the real DOM changes on each side with a MutationObserver.
  const onLeftMutate = useCallback((records: MutationRecord[]) => {
    setCounts((c) => ({ ...c, left: c.left + records.length }));
    setLeftVersion((v) => v + 1);
  }, []);
  useEffect(() => {
    const el = rightList.current;
    if (!el) return;
    const mo = new MutationObserver((records) =>
      setCounts((c) => ({ ...c, right: c.right + records.length })),
    );
    mo.observe(el, { subtree: true, childList: true, attributes: true, characterData: true });
    return () => mo.disconnect();
  }, []);

  const run = (a: TodoAction) => {
    const list = root?.querySelector('#todos');
    const counter = root?.querySelector('#count');
    if (!list || !counter) return;
    setCounts({ left: 0, right: 0 });
    // Imperative: every DOM step by hand.
    setCalls(todoImperative(list, counter, a, forget));
    // Declarative: change the data; React redraws the list from it.
    setItems((xs) => todoReducer(xs, a));
    if (a.kind === 'add') setIds((xs) => [...xs, nextId.current++]);
    if (a.kind === 'remove') setIds((xs) => xs.filter((_, i) => i !== a.index));
  };

  const reset = () => {
    setResetKey((k) => k + 1);
    setItems(START.map((t) => ({ text: t, done: false })));
    setIds(START.map((_, i) => i));
    setCalls([]);
    setCounts({ left: 0, right: 0 });
  };

  // What the left page's counter says, read from the real DOM.
  const shown = useMemo(() => {
    void leftVersion;
    return {
      counter: root?.querySelector('#count')?.textContent ?? '0',
      length: root?.querySelector('#todos')?.children.length ?? 0,
    };
  }, [root, leftVersion]);
  const outOfSync = shown.counter !== String(shown.length);
  const full = items.length >= MAX_ITEMS;

  return (
    <>
      <form
        className="dm-row dm-gap dm-todo-in"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim() && !full) run({ kind: 'add', text: text.trim() });
        }}
      >
        <input
          className="dm-input dm-grow"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="New to-do"
          maxLength={40}
        />
        <button type="submit" className="viz-btn viz-btn--primary" disabled={full || !text.trim()}>
          Add
        </button>
        <button
          type="button"
          className="viz-btn"
          onClick={() => run({ kind: 'doneAll' })}
          disabled={!items.length}
        >
          Mark all done
        </button>
        <button type="button" className="viz-btn" onClick={reset}>
          ↺ Reset
        </button>
      </form>
      <label className="dm-check">
        <input type="checkbox" checked={forget} onChange={(e) => setForget(e.target.checked)} />
        🐞 Forget a step (the plain-DOM side skips updating the counter on remove)
      </label>

      <div className="dm-compare dm-gap">
        <div className="viz-panel">
          <div className="viz-label">Plain DOM (imperative)</div>
          <LiveDomSandbox
            key={resetKey}
            template={TODO_PAGE}
            onReady={onReady}
            onMutate={onLeftMutate}
            address="todo.html"
          />
          <p className={`dm-small ${outOfSync ? 'dm-bad' : 'dm-muted'}`} aria-live="polite">
            {outOfSync
              ? `✗ Out of sync: the counter says ${shown.counter}, but the list has ${shown.length}. Manual updates are easy to forget.`
              : 'Manual updates are easy to forget.'}
          </p>
          <div className="viz-label">
            Last action: {calls.length} DOM call{calls.length === 1 ? '' : 's'} by hand
          </div>
          <pre className="dm-steplog viz-mono dm-js">
            {calls.length ? calls.join('\n') : '(do something above)'}
          </pre>
        </div>
        <div className="viz-panel">
          <div className="viz-label">Describe the result (declarative, React-style)</div>
          <div className="viz-label">The data: items</div>
          <ArrayStrip
            size="sm"
            items={items.map((t, i) => ({
              id: String(ids[i]),
              label: t.text,
              sub: t.done ? 'done' : undefined,
            }))}
            ariaLabel="The items array"
          />
          <div ref={rightList} className="dm-react-list">
            <p className="dm-small" style={{ margin: 0 }}>
              Items: <span className="dm-count">{items.length}</span>
            </p>
            <ul className="dm-items">
              {items.map((t, i) => (
                <li key={ids[i]} className={t.done ? 'is-done' : ''}>
                  <span>{t.text}</span>
                  <button
                    type="button"
                    className="viz-btn viz-btn--icon"
                    aria-label={`Remove ${t.text}`}
                    onClick={() => run({ kind: 'remove', index: i })}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <pre className="dm-steplog viz-mono dm-js">
            {'data changed → React re-rendered →\nit made the needed DOM changes for you'}
          </pre>
          <p className="dm-small dm-muted">
            The counter can’t go wrong: it’s worked out from the array every time.
          </p>
        </div>
      </div>
      <p className="dm-small dm-footer" aria-live="polite">
        Real DOM changes in the last action (counted with a MutationObserver): plain DOM{' '}
        <strong>{counts.left}</strong> · React <strong>{counts.right}</strong>. Both end up making
        the same kind of changes; React just works them out for you.
      </p>
    </>
  );
}
