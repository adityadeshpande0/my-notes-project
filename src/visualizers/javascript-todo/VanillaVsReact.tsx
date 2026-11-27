import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useReducedMotion } from '../../lib/hooks';
import { HeapCard } from '../core/memory';
import { countChanges, type ChangeCount } from './lib/domChanges';
import { driveTodo, type TodoAction } from './lib/drive';
import { buildSrcdoc, PREVIEW_FIX } from './lib/srcdoc';
import PreviewApp, { type PreviewTodo } from './preview/PreviewApp.jsx';
import appJsx from './reference/react/App.jsx?raw';
import filterJsx from './reference/react/FilterBar.jsx?raw';
import formJsx from './reference/react/TodoForm.jsx?raw';
import itemJsx from './reference/react/TodoItem.jsx?raw';
import css from './reference/vanilla/style.css?raw';
import html from './reference/vanilla/index.html?raw';
import js from './reference/vanilla/script.js?raw';
import TodoFrame, { StorageNote } from './TodoFrame';
import { useTodoFrame } from './useTodoFrame';

/**
 * #3 Same actions, two apps. The plain-JS reference runs in a sandboxed
 * iframe; the React reference (PreviewApp, identical to App.jsx apart from
 * its storage key and a state report) runs in its own shadow root, so its
 * page-wide styles can't touch the article. The robot drives both with the
 * same DOM events a user would, and a MutationObserver on each <ul> counts
 * the REAL changes (no-op attribute writes are filtered out).
 *
 * React idea: React only changes what's different. Both apps redraw "from
 * the data", but React compares the new result with the old one and touches
 * just the parts that changed. Watch the DOM-changes meter.
 */
const ROBOT: { label: string; action: TodoAction }[] = [
  { label: 'Add “Make chai”', action: { type: 'add', text: 'Make chai' } },
  {
    label: 'Add 5 tasks',
    action: {
      type: 'addMany',
      texts: ['Buy milk', 'Make chai', 'Call Riya', 'Fix the fan', 'Read article 9'],
    },
  },
  { label: 'Tick task 3', action: { type: 'tick', n: 3 } },
  { label: 'Delete task 2', action: { type: 'delete', n: 2 } },
  { label: 'Filter: Active', action: { type: 'filter', value: 'active' } },
  { label: 'Filter: All', action: { type: 'filter', value: 'all' } },
  { label: 'Clear done', action: { type: 'clear' } },
  { label: 'Reset both', action: { type: 'reset' } },
];
const FLOW = {
  vanilla: [
    'event listener',
    'addTodo() / toggleTodo()…',
    'update() → render()',
    'replaceChildren: new rows',
  ],
  react: [
    'onSubmit / onChange',
    'setTodos()',
    'React re-renders App',
    'React updates only what changed',
  ],
};
// Lines that call the DOM directly, in each version (counted from the real files).
const DOM_API =
  /document\.|createElement|replaceChildren|addEventListener|textContent|setAttribute|classList|\.append\(|dataset|\.hidden\b/;
const domLines = (src: string) =>
  src.split('\n').filter((l) => DOM_API.test(l) && !l.trim().startsWith('//')).length;

type Todo = Pick<PreviewTodo, 'text' | 'done'>;
const same = (a: Todo[] | null, b: Todo[] | null) =>
  !!a &&
  !!b &&
  JSON.stringify(a.map((t) => [t.text, t.done])) === JSON.stringify(b.map((t) => [t.text, t.done]));

export default function VanillaVsReact() {
  const reduced = useReducedMotion();
  const srcDoc = useMemo(() => buildSrcdoc({ html, css, js }), []);
  const [mode, setMode] = useState<'together' | 'free'>('together');
  const [busy, setBusy] = useState(false);
  const [flow, setFlow] = useState(-1);
  const [vChanges, setVChanges] = useState<ChangeCount | null>(null);
  const [rChanges, setRChanges] = useState<ChangeCount | null>(null);
  const [vTodos, setVTodos] = useState<Todo[] | null>(null);
  const [rTodos, setRTodos] = useState<Todo[] | null>(null);
  const { frame, ready, send } = useTodoFrame((m) => {
    setVTodos(m.todos);
    if (m.changes && m.cause !== 'load') setVChanges(m.changes);
  });

  // ── The React app, in its own shadow root ──
  const host = useRef<HTMLDivElement>(null);
  const shadow = useRef<ShadowRoot | null>(null);
  const records = useRef<MutationRecord[]>([]);
  const onState = useCallback((todos: PreviewTodo[]) => setRTodos(todos), []);
  useEffect(() => {
    const el = host.current!;
    const sr = el.shadowRoot ?? el.attachShadow({ mode: 'open' });
    shadow.current = sr;
    // The app is a light page of its own: color-scheme keeps form controls light
    // even though the article around it may be in dark mode.
    sr.innerHTML = `<style>${css}\n:host { display: block; color-scheme: light; } .app { box-shadow: none; } ${PREVIEW_FIX}</style><div class="react-root"></div>`;
    const root: Root = createRoot(sr.querySelector('.react-root')!);
    root.render(<PreviewApp onState={onState} />);
    // Watch everything React draws (React renders a moment later, so the
    // <ul> doesn't exist yet; countChanges picks out the list's own records).
    const mo = new MutationObserver((r) => records.current.push(...r));
    mo.observe(sr.querySelector('.react-root')!, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeOldValue: true,
    });
    return () => {
      mo.disconnect();
      // Unmount after this render finishes (React warns about unmounting a root mid-render).
      setTimeout(() => root.unmount());
    };
  }, [onState]);

  /** Run one action on both apps, and measure what each one changed. */
  const run = useCallback(
    async (action: TodoAction) => {
      const sr = shadow.current;
      if (!sr) return;
      setBusy(true);
      setVChanges(null);
      setRChanges(null);
      send(action); // the plain-JS app (inside its iframe)
      records.current = [];
      await driveTodo(sr, action); // the React app
      await new Promise((r) => setTimeout(r, 60));
      const ul = sr.querySelector('#todo-list');
      if (ul) setRChanges(countChanges(records.current.splice(0), ul));
      setBusy(false);
    },
    [send],
  );

  // Start both apps empty (the React preview may remember tasks from last time).
  const started = useRef(false);
  useEffect(() => {
    if (ready && !started.current) {
      started.current = true;
      void run({ type: 'reset' });
    }
  }, [ready, run]);

  // Light up the data-flow steps one after another.
  useEffect(() => {
    if (flow < 0 || flow >= 4) return;
    const t = setTimeout(() => setFlow((f) => f + 1), reduced ? 0 : 260);
    return () => clearTimeout(t);
  }, [flow, reduced]);

  const robot = (a: TodoAction) => {
    setFlow(0);
    void run(a);
  };
  const match = same(vTodos, rTodos);

  return (
    <div className="viz not-prose td-vs">
      <p className="viz-title">Same actions, two apps</p>
      <div className="td-robotbar">
        <div role="radiogroup" aria-label="Who controls the apps" className="viz-seg">
          {(
            [
              ['together', '🤖 Control both together'],
              ['free', '🖐 Free play'],
            ] as const
          ).map(([id, name]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={mode === id}
              aria-pressed={mode === id}
              className="viz-seg-btn"
              onClick={() => setMode(id)}
            >
              {name}
            </button>
          ))}
        </div>
        {mode === 'together' ? (
          <div className="td-row" role="group" aria-label="Robot actions">
            {ROBOT.map((r) => (
              <button
                key={r.label}
                type="button"
                className="viz-btn"
                disabled={busy || !ready}
                onClick={() => robot(r.action)}
              >
                {r.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="td-small td-muted">
            Use each app yourself. The data badges show when the two lists differ.
          </p>
        )}
      </div>

      <div className="td-vs-cols">
        {(['vanilla', 'react'] as const).map((side) => {
          const todos = side === 'vanilla' ? vTodos : rTodos;
          const ch = side === 'vanilla' ? vChanges : rChanges;
          const rowsNow = todos?.length ?? 0;
          return (
            <section
              key={side}
              className="viz-panel td-vs-col"
              aria-label={side === 'vanilla' ? 'Plain JavaScript' : 'React'}
            >
              <div className="viz-label">{side === 'vanilla' ? 'Plain JS' : 'React'}</div>
              {side === 'vanilla' ? (
                <>
                  <TodoFrame
                    frameRef={frame}
                    srcDoc={srcDoc}
                    title="Chai To-Do, plain JavaScript"
                    height={380}
                  />
                  <StorageNote />
                </>
              ) : (
                <div className="td-react-host" ref={host} />
              )}
              <ol className="td-flow" aria-label="What happens">
                {FLOW[side].map((stepName, i) => (
                  <li
                    key={stepName}
                    className={flow >= i + 1 || (flow >= 4 && i === 3) ? 'is-on' : ''}
                  >
                    {stepName}
                  </li>
                ))}
              </ol>
              <div className="td-meter" aria-live="polite">
                <div className="viz-label">DOM changes (last action)</div>
                {ch ? (
                  <p className="td-small">
                    Rows rebuilt: <strong>{Math.max(ch.rowsAdded, ch.rowsRemoved)}</strong> (−
                    {ch.rowsRemoved} / +{ch.rowsAdded}) · Rows kept:{' '}
                    <strong>{Math.max(0, rowsNow - ch.rowsAdded)}</strong> · Attributes changed:{' '}
                    <strong>{ch.attrs}</strong>
                    {ch.details.length > 0 && (
                      <span className="td-muted"> ({ch.details.join('; ')})</span>
                    )}
                  </p>
                ) : (
                  <p className="td-small td-muted">
                    {busy ? 'Measuring…' : 'Run an action to measure.'}
                  </p>
                )}
              </div>
              <HeapCard
                id={`todos-${side}`}
                label="todos"
                isArray
                props={(todos ?? []).map((t, i) => ({
                  key: String(i),
                  value: `{ text: ${JSON.stringify(t.text)}, done: ${t.done} }`,
                }))}
              />
            </section>
          );
        })}
      </div>
      <p className={`td-badge ${match ? 'is-good' : 'is-warn'}`} aria-live="polite">
        {match
          ? '✓ data matches'
          : vTodos && rTodos
            ? '≠ the two lists are different right now'
            : 'Loading…'}
      </p>
      <p className="viz-caption">
        Both apps redraw from the data. The plain-JS version rebuilds every row each time, which is
        simple and fine for a small list. React compares the new result with the old one and touches
        only what changed. That matters a lot in big apps, and you didn’t have to write any of it.
      </p>
      <details className="td-details">
        <summary>ℹ️ About the raw numbers</summary>
        <p className="td-small">
          A MutationObserver reports every attribute write, even when the value doesn’t change.
          React re-sets a couple of attributes on each checkbox (to the same values) as part of how
          it manages controlled inputs: those writes change nothing you can see, so the meter leaves
          them out
          {rChanges
            ? ` (this time: ${rChanges.noops} for React, ${vChanges?.noops ?? 0} for plain JS)`
            : ''}
          . If you open DevTools and see more records than the meter shows, that’s why.
        </p>
      </details>
      <div className="viz-panel td-loc">
        <div className="viz-label">Lines that change the page by hand</div>
        <p className="td-small">
          Plain JS: <strong>{domLines(js)}</strong> lines call the DOM directly (createElement,
          textContent, addEventListener…). React:{' '}
          <strong>
            {[appJsx, formJsx, itemJsx, filterJsx].reduce((n, f) => n + domLines(f), 0)}
          </strong>
          .
        </p>
        <p className="td-small td-muted">
          Things you no longer write in React: render() calls, createElement, replaceChildren,
          addEventListener, textContent, and manual aria-pressed updates.
        </p>
      </div>
    </div>
  );
}
