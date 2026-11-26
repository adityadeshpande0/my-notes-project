import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CodeView, Tabs } from '../core/code';
import { EventLog, useEventLog } from '../core/events';
import LiveDomSandbox, { type Sandbox } from '../core/sandbox/LiveDomSandbox';
import { detailOf, snapshot, tagOf } from './lib/describe';
import { createListenerBag } from './lib/listeners';
import { EVENTS_CSS, FORM_PAGE, LAB_PAGE, ORDER_PAGE } from './lib/templates';
import Stage from './Stage';
import { useFlash } from './useFlash';

/**
 * #1 EventLab: every event, logged. Three tabs, each with its own mini page.
 *
 * Two kinds of events live side by side here, and it's worth noticing:
 * - Inside the mini page we use the article's plain DOM way:
 *   `element.addEventListener("click", handler)`, added in a useEffect and
 *   removed in its cleanup (so no listener is ever left behind).
 * - The controls around it (the checkboxes and buttons) are React elements,
 *   so they use React's event props: `onChange={...}`, `onClick={...}`.
 *   React attaches those for us, and removes them for us too.
 */
type TabId = 'listen' | 'default' | 'remove';

export default function EventLab() {
  return (
    <div className="viz not-prose ev-lab">
      <p className="viz-title">Every event, logged</p>
      <Tabs<TabId>
        label="Parts of this visual"
        twoUp
        tabs={[
          { id: 'listen', name: 'Listen' },
          { id: 'default', name: 'Default actions' },
          { id: 'remove', name: 'Removing listeners' },
        ]}
      >
        {(t) => (t === 'listen' ? <ListenTab /> : t === 'default' ? <DefaultTab /> : <RemoveTab />)}
      </Tabs>
    </div>
  );
}

// ─── Tab: Listen ─────────────────────────────────────────────────────

/** Which elements each event type is attached to (by id, which is also the variable name in the code). */
const WIRING: [string, string[]][] = [
  ['click', ['order', 'card']],
  ['input', ['search']],
  ['change', ['search', 'size', 'notify']],
  ['keydown', ['search']],
  ['focus', ['search', 'order']],
  ['blur', ['search', 'order']],
  ['mouseenter', ['card']],
  ['mouseleave', ['card']],
];

function ListenTab() {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [on, setOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(WIRING.map(([t]) => [t, true])),
  );
  const log = useEventLog();
  const onReady = useCallback((sb: Sandbox) => setRoot(sb.root), []);
  // How many input events came before the next change (for the "input vs change" lesson).
  const inputsSince = useRef(0);
  const { push } = log;

  // Attach a REAL listener for every switched-on type. When a switch flips
  // (or the visual goes away), the cleanup removes every one of them first.
  useEffect(() => {
    if (!root) return;
    const bag = createListenerBag();
    const handler = (e: Event) => {
      const fromSearch = (e.target as Element).id === 'search';
      if (e.type === 'input' && fromSearch) inputsSince.current++;
      const isChange = e.type === 'change' && fromSearch;
      const detail = detailOf(e);
      push({
        type: e.type,
        target: tagOf(e.target),
        detail: isChange ? `${detail} (after ${inputsSince.current} input events)` : detail,
        tone: isChange ? 'highlight' : undefined,
        props: snapshot(e),
      });
      if (isChange) inputsSince.current = 0;
    };
    for (const [type, ids] of WIRING) {
      if (!on[type]) continue;
      for (const id of ids) bag.add(root.querySelector(`#${id}`)!, type, handler);
    }
    return () => bag.removeAll();
  }, [root, on, push]);

  // One listener per switched-on (type, element) pair: exactly what the effect attaches.
  const attached = WIRING.reduce((n, [type, ids]) => n + (on[type] ? ids.length : 0), 0);

  return (
    <div className="ev-split">
      <div>
        <LiveDomSandbox
          template={LAB_PAGE}
          onReady={onReady}
          css={EVENTS_CSS}
          address="chai-corner.html"
        />
        <p className="ev-note">
          Try: click, type in Search then press Tab, pick a size, tick the box, hover the card. With
          the keyboard, Tab moves focus and Enter or Space clicks.
        </p>
      </div>
      <div>
        <details className="ev-panel" open>
          <summary>
            Listener switchboard <span className="ev-badge">{attached} listeners attached</span>
          </summary>
          <ul className="ev-switches">
            {WIRING.map(([type, ids]) => (
              <li key={type}>
                <label className="ev-switch">
                  <input
                    type="checkbox"
                    checked={on[type]}
                    // A React event prop: React calls this with its own event object, but e.target.checked works the same.
                    onChange={(e) => setOn((o) => ({ ...o, [type]: e.target.checked }))}
                  />
                  <span
                    className={`ev-chip is-${type === 'click' || type.startsWith('mouse') ? 'mouse' : type === 'keydown' ? 'key' : type === 'focus' || type === 'blur' ? 'focus' : 'form'} viz-mono`}
                  >
                    {type}
                  </span>
                </label>
                <code className={`ev-code viz-mono ${on[type] ? '' : 'is-off'}`}>
                  {ids.map((id) => `${id}.addEventListener("${type}", log);`).join('\n')}
                </code>
              </li>
            ))}
          </ul>
        </details>
        <EventLog
          rows={log.rows}
          onClear={log.clear}
          label="Event log (click a row to inspect the event object)"
        />
        <p className="ev-note">
          <strong>input vs change:</strong> type in Search, then leave the box. You get one{' '}
          <code>input</code> per keystroke, but only one <code>change</code> (highlighted), when the
          value is committed.
        </p>
      </div>
    </div>
  );
}

// ─── Tab: Default actions ────────────────────────────────────────────

const FORM_CODE = (submit: boolean, link: boolean) => [
  { text: 'form.addEventListener("submit", (e) => {' },
  submit
    ? { text: '  e.preventDefault(); // stop the page reload', state: 'on' as const }
    : { text: '  // e.preventDefault();', state: 'dim' as const },
  { text: '  const name = form.elements.name.value;' },
  { text: '  showMessage("Thanks, " + name + "!");' },
  { text: '});' },
  { text: 'link.addEventListener("click", (e) => {' },
  link
    ? { text: '  e.preventDefault(); // stay on this page', state: 'on' as const }
    : { text: '  // e.preventDefault();', state: 'dim' as const },
  { text: '  showMenuHere();' },
  { text: '});' },
];

function DefaultTab() {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [preventSubmit, setPreventSubmit] = useState(true);
  const [preventLink, setPreventLink] = useState(true);
  const log = useEventLog();
  const { push } = log;
  const flash = useFlash();
  const { show } = flash;
  const onReady = useCallback((sb: Sandbox) => setRoot(sb.root), []);

  useEffect(() => {
    if (!root) return;
    const bag = createListenerBag();
    const form = root.querySelector('form')!;
    const link = root.querySelector('a')!;
    bag.add(form, 'submit', (e) => {
      if (preventSubmit) e.preventDefault();
      const name = (form.elements.namedItem('name') as HTMLInputElement).value;
      push({
        type: 'submit',
        target: tagOf(e.target),
        detail: `defaultPrevented: ${e.defaultPrevented}`,
        props: snapshot(e),
      });
      // Text from the input goes into the toast as plain text (React escapes it).
      if (e.defaultPrevented) show({ toast: `Thanks, ${name || 'friend'}!` });
      else show({ overlay: '🔄 The page would reload here, and your form data would be lost!' });
    });
    bag.add(link, 'click', (e) => {
      if (preventLink) e.preventDefault();
      push({
        type: 'click',
        target: tagOf(e.target),
        detail: `defaultPrevented: ${e.defaultPrevented}`,
        props: snapshot(e),
      });
      if (e.defaultPrevented) show({ toast: 'Handled by JavaScript: the menu opens right here.' });
      else show({ overlay: '➡️ The browser would navigate to /menu' });
    });
    return () => bag.removeAll();
  }, [root, preventSubmit, preventLink, push, show]);

  return (
    <div className="ev-split">
      <div>
        <Stage flash={flash.state}>
          <LiveDomSandbox
            template={FORM_PAGE}
            onReady={onReady}
            css={EVENTS_CSS}
            address="order.html"
          />
        </Stage>
        <p className="ev-note">
          This demo always stops the <em>real</em> reload or navigation, so the article stays put.
          With a switch off, it shows you what would have happened instead.
        </p>
      </div>
      <div>
        <div className="ev-row">
          <label className="ev-check">
            <input
              type="checkbox"
              checked={preventSubmit}
              onChange={(e) => setPreventSubmit(e.target.checked)}
            />
            Call <code>e.preventDefault()</code> on submit
          </label>
          <label className="ev-check">
            <input
              type="checkbox"
              checked={preventLink}
              onChange={(e) => setPreventLink(e.target.checked)}
            />
            …on link click
          </label>
        </div>
        <CodeView label="The handlers" lines={FORM_CODE(preventSubmit, preventLink)} />
        <EventLog rows={log.rows} onClear={log.clear} height="10rem" />
      </div>
    </div>
  );
}

// ─── Tab: Removing listeners ─────────────────────────────────────────

function RemoveTab() {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [, setVersion] = useState(0);
  const [note, setNote] = useState('');
  const log = useEventLog();
  const { push } = log;
  const onReady = useCallback((sb: Sandbox) => setRoot(sb.root), []);
  const arrows = useRef(0);
  const refresh = () => setVersion((v) => v + 1);

  // One bag per mini page. Its cleanup removes everything on Reset and unmount.
  const bag = useMemo(() => createListenerBag(), [root]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => bag.removeAll(), [bag]);
  // Named functions: the SAME function object every time, so they can be removed.
  const handleClick = useMemo(
    () => () => push({ type: 'click', target: '<button#order>', detail: 'handleClick ran' }),
    [push],
  );
  const handleOnce = useMemo(
    () => () => {
      push({
        type: 'click',
        target: '<button#order>',
        detail: 'handleOnce ran (once: true, so it’s gone now)',
        tone: 'highlight',
      });
      // The bag drops it as it runs; redraw the counter after this event.
      setTimeout(() => setVersion((v) => v + 1));
    },
    [push],
  );

  const btn = () => root?.querySelector('#order');

  const add = (kind: 'named' | 'arrow' | 'once') => {
    const b = btn();
    if (!b) return;
    const before = bag.count();
    if (kind === 'named') bag.add(b, 'click', handleClick);
    else if (kind === 'once') bag.add(b, 'click', handleOnce, { once: true });
    else {
      const n = ++arrows.current;
      bag.add(b, 'click', () =>
        push({ type: 'click', target: '<button#order>', detail: `inline arrow #${n} ran` }),
      );
    }
    setNote(
      bag.count() === before
        ? 'Nothing changed: adding the same function (with the same options) twice is ignored.'
        : kind === 'arrow'
          ? 'Added a brand-new arrow function. Each click of this button adds another one.'
          : 'Added.',
    );
    refresh();
  };

  const remove = (kind: 'named' | 'arrow') => {
    const b = btn();
    if (!b) return;
    const before = bag.count();
    // The arrow version writes a NEW function here, so it matches nothing.
    bag.remove(b, 'click', kind === 'named' ? handleClick : () => push({ type: 'click' }));
    setNote(
      bag.count() < before
        ? 'Removed: it was the same function object, so the browser found it.'
        : kind === 'arrow'
          ? 'Nothing removed! A new arrow function is a different function, even if it looks identical. Same lesson as article #2’s references.'
          : 'Nothing to remove: handleClick isn’t attached.',
    );
    refresh();
  };

  const count = bag.count();
  return (
    <div className="ev-split">
      <div>
        <LiveDomSandbox
          template={ORDER_PAGE}
          resetKey={resetKey}
          onReady={onReady}
          css={EVENTS_CSS}
          address="order.html"
        />
        <p className="ev-count" aria-live="polite">
          Listeners on “Place order”: <strong className="viz-mono">{count}</strong>
        </p>
        <p className="ev-note">Click “Place order”: each attached listener logs one row.</p>
        <button
          type="button"
          className="viz-btn"
          onClick={() => {
            setResetKey((k) => k + 1);
            setNote('Reset: every listener was removed, and the page rebuilt.');
          }}
        >
          ↺ Reset
        </button>
      </div>
      <div>
        <p className="ev-group">Add</p>
        <div className="ev-btns">
          <button type="button" className="viz-btn viz-mono" onClick={() => add('named')}>
            addEventListener("click", handleClick)
          </button>
          <button type="button" className="viz-btn viz-mono" onClick={() => add('arrow')}>
            addEventListener("click", () =&gt; …)
          </button>
          <button type="button" className="viz-btn viz-mono" onClick={() => add('once')}>
            addEventListener("click", handleOnce, {'{ once: true }'})
          </button>
        </div>
        <p className="ev-group">Remove</p>
        <div className="ev-btns">
          <button type="button" className="viz-btn viz-mono" onClick={() => remove('named')}>
            removeEventListener("click", handleClick)
          </button>
          <button type="button" className="viz-btn viz-mono" onClick={() => remove('arrow')}>
            removeEventListener("click", () =&gt; …)
          </button>
        </div>
        {note && (
          <p className="ev-note ev-callout" role="status">
            {note}
          </p>
        )}
        <EventLog rows={log.rows} onClear={log.clear} height="10rem" />
      </div>
    </div>
  );
}
