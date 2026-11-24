import { useCallback, useMemo, useState } from 'react';
import { useReducedMotion } from '../../lib/hooks';
import { ArrayStrip } from '../core/array';
import DomTreeView from './DomTreeView';
import LiveDomSandbox, { type Highlight, type Sandbox } from './LiveDomSandbox';
import { cssPath, describeNode, nodeAt } from './lib/domTree';
import { actionCode, findExpr, str, type FindMethod } from './lib/remoteCode';
import { CAFE_PAGE, HERO_IMAGES } from './lib/templates';
import { useDomMirror } from './useDomMirror';

/**
 * #2 The DOM remote control: find elements with a real selector, then change
 * them with real DOM methods. Every change goes to the mini page's actual
 * DOM (inside LiveDomSandbox), and the code for it is written to the log.
 *
 * React idea: React state holds only *our* notes (what you searched for,
 * what's selected, the code log). The mini page itself is NOT in React state:
 * it lives in the real DOM, and we change it directly, which is safe only
 * because React never renders anything inside the sandbox.
 */
const PRESETS: Record<FindMethod, string[]> = {
  querySelector: [
    'h1',
    '#title',
    '.item',
    '.price',
    '#menu li',
    'li:first-child',
    '.sold-out',
    '[data-id="3"]',
    '.does-not-exist',
  ],
  querySelectorAll: [
    '.item',
    '.price',
    '#menu li',
    'li:first-child',
    '.sold-out',
    '[data-id="3"]',
    '.does-not-exist',
  ],
  getElementById: ['title', 'menu', 'hero', 'order', 'nope'],
};
const METHODS: FindMethod[] = ['querySelector', 'querySelectorAll', 'getElementById'];
const IMAGE_NAMES = ['chaiPicture', 'gingerPicture'];

type Result =
  | { kind: 'found'; method: FindMethod; query: string; els: Element[] }
  | { kind: 'null'; method: FindMethod; query: string }
  | { kind: 'error'; method: FindMethod; query: string; message: string };

export default function DomRemote() {
  const reduced = useReducedMotion();
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [method, setMethod] = useState<FindMethod>('querySelector');
  const [query, setQuery] = useState('.tagline');
  const [result, setResult] = useState<Result | null>(null);
  const [loop, setLoop] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [goneNote, setGoneNote] = useState('');
  const [text, setText] = useState('Fresh every morning');
  const [color, setColor] = useState('#ffe08a');
  const [size, setSize] = useState(18);
  const [alt, setAlt] = useState(HERO_IMAGES[1].alt);
  const mirror = useDomMirror(root);

  /** Run a search for real, on the mini page only. */
  const find = useCallback(
    (m: FindMethod, q: string, page = root) => {
      if (!page) return;
      setGoneNote('');
      setLoop(false);
      try {
        // getElementById exists only on `document`; on our mini page we ask for "#id" instead.
        const els =
          m === 'getElementById'
            ? [page.querySelector(`#${CSS.escape(q)}`)].filter((e): e is Element => !!e && !!q)
            : m === 'querySelector'
              ? [page.querySelector(q)].filter((e): e is Element => !!e)
              : [...page.querySelectorAll(q)];
        setResult(
          els.length || m === 'querySelectorAll'
            ? { kind: 'found', method: m, query: q, els }
            : { kind: 'null', method: m, query: q },
        );
      } catch (e) {
        // An invalid selector throws a real SyntaxError: show the browser's own words.
        const err = e as Error;
        setResult({ kind: 'error', method: m, query: q, message: `${err.name}: ${err.message}` });
      }
    },
    [root],
  );

  const onReady = useCallback(
    (sb: Sandbox) => {
      setRoot(sb.root);
      find('querySelector', '.tagline', sb.root);
    },
    // Only the first search on load; later ones use the current state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const els = result?.kind === 'found' ? result.els.filter((e) => e.isConnected) : [];
  const many = result?.kind === 'found' && result.method === 'querySelectorAll';
  const targets = many && !loop ? els.slice(0, 1) : els;
  const first = targets[0];
  const allImgs = targets.length > 0 && targets.every((e) => e.tagName === 'IMG');

  const highlights: Highlight[] = useMemo(
    () =>
      els.map((el, i) => ({
        el,
        label: String(i + 1),
        tone: !many || loop || i === 0 ? 'match' : 'hover',
      })),
    // `mirror.version` moves the boxes after the page changes size.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result, loop, mirror.version],
  );

  /** Do one change to every target, and write its code to the log. */
  const act = (stmt: (x: string) => string, run: (el: HTMLElement) => void) => {
    if (!result || result.kind !== 'found' || !targets.length) return;
    targets.forEach((el) => run(el as HTMLElement));
    setLog((l) => [...l, actionCode(result.method, result.query, loop, stmt)]);
  };

  const remove = () => {
    if (!result || result.kind !== 'found') return;
    const doomed = targets;
    setLog((l) => [...l, actionCode(result.method, result.query, loop, (x) => `${x}.remove()`)]);
    // The element is gone, so nothing is selected any more.
    setResult(null);
    setGoneNote(
      `Removed ${doomed.length === 1 ? describeNode(doomed[0]) : `${doomed.length} elements`}. Find something else to keep going.`,
    );
    for (const el of doomed) {
      if (reduced) el.remove();
      else
        el.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(0.96)' }], 280).finished.then(
          () => el.remove(),
          () => el.remove(),
        );
    }
  };

  const reset = () => {
    setResetKey((k) => k + 1);
    setResult(null);
    setGoneNote('');
    setLog((l) => (l.length ? [...l, '// (page reset)'] : l));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(log.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const changeOk = targets.length > 0;
  const realLines = log.filter((l) => !l.startsWith('//')).length;

  return (
    <div className="viz not-prose">
      <p className="viz-title">The DOM remote control</p>
      <p className="viz-sub">
        Find elements on the mini page with any CSS selector, then change them with real DOM
        methods.
      </p>
      <div className="dm-remote">
        <div className="dm-remote-page">
          <LiveDomSandbox
            template={CAFE_PAGE}
            resetKey={resetKey}
            onReady={onReady}
            onMutate={mirror.onMutate}
            highlights={highlights}
          />
          <p className="dm-sandbox-note">In this demo, document is the mini page.</p>
          <div className="dm-row dm-gap">
            <button type="button" className="viz-btn" onClick={reset}>
              ↺ Reset page
            </button>
          </div>
        </div>

        <div>
          <details className="dm-step" open>
            <summary>1. Find 🔍</summary>
            <div className="dm-step-body">
              <div role="radiogroup" aria-label="Method" className="dm-btns">
                {METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={method === m}
                    aria-pressed={method === m}
                    className="viz-btn"
                    onClick={() => {
                      setMethod(m);
                      // getElementById takes a bare id, so the box adapts.
                      const q =
                        m === 'getElementById'
                          ? 'title'
                          : query.startsWith('#') || !query
                            ? '.item'
                            : query;
                      setQuery(q);
                      find(m, q);
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <form
                className="dm-row dm-gap"
                onSubmit={(e) => {
                  e.preventDefault();
                  find(method, query);
                }}
              >
                <code className="viz-mono dm-small">document.{method}(</code>
                <input
                  className="dm-input viz-mono dm-grow"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label={method === 'getElementById' ? 'An id, without #' : 'A CSS selector'}
                  placeholder={method === 'getElementById' ? 'title' : '.item'}
                  spellCheck={false}
                  autoCapitalize="off"
                />
                <code className="viz-mono dm-small">)</code>
                <button type="submit" className="viz-btn viz-btn--primary">
                  Run
                </button>
              </form>
              <div className="dm-chips" aria-label="Try one">
                {PRESETS[method].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="viz-btn viz-btn--ghost"
                    onClick={() => {
                      setQuery(p);
                      find(method, p);
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <ResultPanel result={result} els={els} loop={loop} setLoop={setLoop} />
              {goneNote && <p className="dm-gone">{goneNote}</p>}
            </div>
          </details>

          <details className={`dm-step ${changeOk ? '' : 'is-disabled'}`} open>
            <summary>2. Change 🎛️</summary>
            <div className="dm-step-body">
              {!changeOk && (
                <p className="dm-small dm-muted">Find an element first, then change it here.</p>
              )}
              <fieldset disabled={!changeOk} className="dm-fieldset">
                <div className="dm-group">
                  <p className="dm-group-title">Text</p>
                  <div className="dm-row">
                    <input
                      className="dm-input dm-grow"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      aria-label="New text"
                    />
                    <button
                      type="button"
                      className="viz-btn viz-mono"
                      onClick={() =>
                        act(
                          (x) => `${x}.textContent = ${str(text)}`,
                          (el) => (el.textContent = text),
                        )
                      }
                    >
                      textContent =
                    </button>
                  </div>
                </div>
                <div className="dm-group">
                  <p className="dm-group-title">Classes</p>
                  <div className="dm-btns">
                    <button
                      type="button"
                      className="viz-btn"
                      onClick={() =>
                        act(
                          (x) => `${x}.classList.add("highlight")`,
                          (el) => el.classList.add('highlight'),
                        )
                      }
                    >
                      classList.add("highlight")
                    </button>
                    <button
                      type="button"
                      className="viz-btn"
                      onClick={() =>
                        act(
                          (x) => `${x}.classList.remove("highlight")`,
                          (el) => el.classList.remove('highlight'),
                        )
                      }
                    >
                      classList.remove("highlight")
                    </button>
                    <button
                      type="button"
                      className="viz-btn"
                      onClick={() =>
                        act(
                          (x) => `${x}.classList.toggle("dark")`,
                          (el) => el.classList.toggle('dark'),
                        )
                      }
                    >
                      classList.toggle("dark")
                    </button>
                  </div>
                  {first && (
                    <p className="dm-small viz-mono dm-gap" aria-live="polite">
                      classList.contains("dark") →{' '}
                      <span className={first.classList.contains('dark') ? 'dm-good' : 'dm-muted'}>
                        {String(first.classList.contains('dark'))}
                      </span>
                    </p>
                  )}
                </div>
                <div className="dm-group">
                  <p className="dm-group-title">Inline style</p>
                  <div className="dm-row">
                    <input
                      type="color"
                      className="dm-color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      aria-label="Background colour"
                    />
                    <button
                      type="button"
                      className="viz-btn viz-mono"
                      onClick={() =>
                        act(
                          (x) => `${x}.style.backgroundColor = ${str(color)}`,
                          (el) => (el.style.backgroundColor = color),
                        )
                      }
                    >
                      style.backgroundColor
                    </button>
                  </div>
                  <div className="dm-row dm-gap">
                    <input
                      type="range"
                      className="dm-range"
                      min={12}
                      max={28}
                      value={size}
                      onChange={(e) => setSize(Number(e.target.value))}
                      aria-label="Font size in pixels"
                    />
                    <button
                      type="button"
                      className="viz-btn viz-mono"
                      onClick={() =>
                        act(
                          (x) => `${x}.style.fontSize = "${size}px"`,
                          (el) => (el.style.fontSize = `${size}px`),
                        )
                      }
                    >
                      style.fontSize = "{size}px"
                    </button>
                  </div>
                  <div className="dm-btns dm-gap">
                    <button
                      type="button"
                      className="viz-btn"
                      onClick={() =>
                        act(
                          (x) => `${x}.removeAttribute("style")`,
                          (el) => el.removeAttribute('style'),
                        )
                      }
                    >
                      removeAttribute("style")
                    </button>
                  </div>
                </div>
                <div className="dm-group">
                  <p className="dm-group-title">Attributes</p>
                  {allImgs ? (
                    <>
                      <div className="dm-btns">
                        {HERO_IMAGES.map((img, i) => (
                          <button
                            key={i}
                            type="button"
                            className="viz-btn"
                            onClick={() =>
                              act(
                                (x) => `${x}.setAttribute("src", ${IMAGE_NAMES[i]})`,
                                (el) => el.setAttribute('src', img.src),
                              )
                            }
                          >
                            setAttribute("src", {IMAGE_NAMES[i]})
                          </button>
                        ))}
                      </div>
                      <p className="dm-small dm-muted">
                        (Each picture is a small inline SVG, so the demo never downloads anything.)
                      </p>
                      <div className="dm-row dm-gap">
                        <input
                          className="dm-input dm-grow"
                          value={alt}
                          onChange={(e) => setAlt(e.target.value)}
                          aria-label="Alt text"
                        />
                        <button
                          type="button"
                          className="viz-btn viz-mono"
                          onClick={() =>
                            act(
                              (x) => `${x}.alt = ${str(alt)}`,
                              (el) => ((el as HTMLImageElement).alt = alt),
                            )
                          }
                        >
                          alt =
                        </button>
                      </div>
                      {first && (
                        <p className="dm-small viz-mono dm-gap">
                          getAttribute("alt") → {str(first.getAttribute('alt') ?? '')}
                        </p>
                      )}
                    </>
                  ) : first instanceof HTMLElement && first.dataset.id ? (
                    <p className="dm-small viz-mono">
                      dataset.id → {str(first.dataset.id)}{' '}
                      <span className="dm-muted">(from data-id, always a string)</span>
                    </p>
                  ) : (
                    <p className="dm-small dm-muted">
                      Find <code>#hero</code> (try getElementById) to swap its picture, or an{' '}
                      <code>.item</code> to read its <code>dataset</code>.
                    </p>
                  )}
                </div>
                <div className="dm-group">
                  <p className="dm-group-title">Remove</p>
                  <button type="button" className="viz-btn" onClick={remove}>
                    {loop && targets.length > 1 ? `remove() all ${targets.length}` : 'remove()'}
                  </button>
                </div>
              </fieldset>
            </div>
          </details>

          <div className="viz-panel dm-log">
            <div className="dm-row" style={{ justifyContent: 'space-between' }}>
              <span className="viz-label" style={{ margin: 0 }}>
                Your DOM code
              </span>
              <span className="dm-row">
                {realLines >= 5 && (
                  <span className="dm-badge is-good">
                    📜 You’ve written {realLines} lines of real DOM code!
                  </span>
                )}
                <button type="button" className="viz-btn" onClick={copy} disabled={!log.length}>
                  {copied ? 'Copied ✓' : 'Copy'}
                </button>
              </span>
            </div>
            <pre className="dm-log-lines viz-mono" aria-live="polite" aria-label="Code log">
              {log.length === 0 ? (
                <span className="dm-muted">(each change you make is written here)</span>
              ) : (
                log.map((l, i) => <div key={i}>{l}</div>)
              )}
            </pre>
          </div>

          <div className="viz-panel dm-minimap">
            <div className="viz-label">The tree, live (amber = changed, green = added)</div>
            <DomTreeView
              nodes={mirror.tree}
              flash={mirror.flash}
              compact
              label="cafe-tree"
              selected={null}
              onSelect={(n) => {
                if (!root || n.kind !== 'element') return;
                // Picking a node in the tree writes a selector that finds it.
                const target = nodeAt(root, n.path) as Element | null;
                if (!target) return;
                const q = cssPath(root, target).replace(/^body > /, '');
                setMethod('querySelector');
                setQuery(q);
                find('querySelector', q);
              }}
            />
            {mirror.removed.length > 0 && (
              <p className="dm-gone">✕ removed from the tree: {mirror.removed.join(', ')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultPanel({
  result,
  els,
  loop,
  setLoop,
}: {
  result: Result | null;
  els: Element[];
  loop: boolean;
  setLoop: (b: boolean) => void;
}) {
  if (!result) return null;
  const code = findExpr(result.method, result.query);
  if (result.kind === 'error')
    return (
      <div className="dm-result is-error" role="status">
        <code className="viz-mono">{code}</code>
        <p
          className="dm-bad dm-small viz-mono"
          style={{ margin: '0.35rem 0 0', overflowWrap: 'anywhere' }}
        >
          ✗ {result.message}
        </p>
        <p className="dm-small dm-muted" style={{ margin: '0.25rem 0 0' }}>
          Caught with try/catch, so nothing crashed. Fix the selector and run it again.
        </p>
      </div>
    );
  if (result.kind === 'null')
    return (
      <div className="dm-result is-null" role="status">
        <code className="viz-mono">{code}</code> → <strong className="dm-bad viz-mono">null</strong>
        <p className="dm-small" style={{ margin: '0.3rem 0 0' }}>
          Nothing matched. Use <code>?.</code> before changing it!{' '}
          {result.method === 'getElementById' && result.query.startsWith('#') && (
            <>(getElementById takes the id without the #.)</>
          )}
        </p>
      </div>
    );
  if (result.method !== 'querySelectorAll')
    return (
      <div className="dm-result" role="status">
        <code className="viz-mono">{code}</code>
        <p className="dm-small" style={{ margin: '0.3rem 0 0' }}>
          → 1 element:{' '}
          <code className="viz-mono dm-good">
            {els[0] ? describeNode(els[0], false) : '(removed)'}
          </code>
        </p>
      </div>
    );
  return (
    <div className="dm-result" role="status">
      <code className="viz-mono">{code}</code> →{' '}
      <strong className="viz-mono">NodeList({els.length})</strong>
      {els.length > 0 ? (
        <ArrayStrip
          size="sm"
          items={els.map((el, i) => ({ id: String(i), label: describeNode(el) }))}
          highlight={loop ? Object.fromEntries(els.map((_, i) => [i, 'match'])) : { 0: 'current' }}
          ariaLabel="The NodeList"
        />
      ) : (
        <p className="dm-small dm-muted" style={{ margin: '0.3rem 0 0' }}>
          An empty NodeList (not null!). Its <code>.length</code> is 0.
        </p>
      )}
      <p className="dm-small viz-mono" style={{ margin: '0.3rem 0 0' }}>
        .length → {els.length}
      </p>
      {els.length > 1 && (
        <label className="dm-check dm-gap">
          <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
          Loop over them (changes apply to all {els.length}){!loop && ', otherwise just [0]'}
        </label>
      )}
    </div>
  );
}
