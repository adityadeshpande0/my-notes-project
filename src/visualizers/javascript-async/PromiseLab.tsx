import { useEffect, useRef, useState } from 'react';
import { CodeView, Tabs } from '../core/code';
import { EventLog, useEventLog } from '../core/events';
import { isAbort, makeOrder } from './lib/fakeKitchen';
import { runOrders, type Combinator, type OrderSpec, type RunRecord } from './lib/kitchenRun';
import Speed from './Speed';
import { Token, type TokenState } from '../core/token';

/**
 * #2 Order tokens: every promise here is REAL (makeOrder from the fake
 * kitchen), and the visual draws what actually happened: when each one
 * settled, and which handlers ran, in which order.
 *
 * React idea: async work updates state when it finishes, using the updater
 * form, setX(prev => ...). Several orders can finish at different times, and
 * each must update the LATEST list, not the list from when it started (the
 * stale-closure lesson from article #8).
 */
type TabId = 'one' | 'chain' | 'many';

const ITEMS = [
  { name: 'chai', emoji: '☕' },
  { name: 'samosa', emoji: '🥟' },
  { name: 'jalebi', emoji: '🍮' },
  { name: 'lassi', emoji: '🥤' },
];
const emojiOf = (item: string) => ITEMS.find((i) => i.name === item)?.emoji ?? '🍽️';
const secs = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

export default function PromiseLab() {
  const [speed, setSpeed] = useState(1);
  return (
    <div className="viz not-prose as-lab">
      <p className="viz-title">Order tokens</p>
      <p className="viz-sub">
        Each token is a real promise. Place orders, make some fail, and watch them settle.
      </p>
      <Speed value={speed} onChange={setSpeed} />
      <Tabs<TabId>
        label="Parts of this visual"
        twoUp
        tabs={[
          { id: 'one', name: 'One promise' },
          { id: 'chain', name: 'Chaining' },
          { id: 'many', name: 'Several at once' },
        ]}
      >
        {(t) =>
          t === 'one' ? (
            <OneTab speed={speed} />
          ) : t === 'chain' ? (
            <ChainTab speed={speed} />
          ) : (
            <ManyTab speed={speed} />
          )
        }
      </Tabs>
    </div>
  );
}

/** One AbortController for everything a tab starts; aborted when the tab goes away. */
function useAbortOnUnmount() {
  const ctrl = useRef(new AbortController());
  useEffect(() => {
    const c = ctrl.current;
    return () => c.abort();
  }, []);
  return ctrl;
}

// ─── Tab: One promise ────────────────────────────────────────────────

type Handler = 'then' | 'catch' | 'finally';
interface OneOrder {
  id: number;
  item: string;
  realMs: number;
  state: TokenState;
  text?: string;
  ran: Handler[];
}

function OneTab({ speed }: { speed: number }) {
  const [item, setItem] = useState('chai');
  const [ms, setMs] = useState(2000);
  const [fail, setFail] = useState(false);
  const [orders, setOrders] = useState<OneOrder[]>([]);
  const log = useEventLog();
  const ctrl = useAbortOnUnmount();
  const next = useRef(41);

  const update = (id: number, patch: (o: OneOrder) => Partial<OneOrder>) =>
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, ...patch(o) } : o)));

  const place = () => {
    const id = ++next.current;
    const signal = ctrl.current.signal;
    setOrders((os) =>
      [{ id, item, realMs: ms / speed, state: 'pending' as TokenState, ran: [] }, ...os].slice(
        0,
        3,
      ),
    );
    log.push({
      type: 'order',
      category: 'other',
      target: `#${id}`,
      detail: `makeOrder("${item}") → pending promise`,
    });
    // The real chain, exactly as in the code panel.
    makeOrder(item, { ms, fail, signal, speed })
      .then((order) => {
        update(id, (o) => ({ state: 'fulfilled', text: order.item, ran: [...o.ran, 'then'] }));
        log.push({
          type: '.then',
          category: 'form',
          target: `#${id}`,
          detail: `Got ${order.item}`,
        });
      })
      .catch((err: Error) => {
        if (isAbort(err)) return;
        update(id, (o) => ({ state: 'rejected', text: err.message, ran: [...o.ran, 'catch'] }));
        log.push({
          type: '.catch',
          category: 'key',
          target: `#${id}`,
          detail: `Problem: ${err.message}`,
          tone: 'stopped',
        });
      })
      .finally(() => {
        if (signal.aborted) return;
        update(id, (o) => ({ ran: [...o.ran, 'finally'] }));
        log.push({ type: '.finally', category: 'other', target: `#${id}`, detail: 'Order closed' });
      });
  };

  const latest = orders[0];
  const order = (h: Handler) => {
    const i = latest?.ran.indexOf(h) ?? -1;
    return i >= 0 ? { text: `ran ${['1st', '2nd'][i]}`, tone: 'yes' as const } : undefined;
  };
  const code = [
    { text: `makeOrder("${item}", { ms: ${ms}, fail: ${fail} })` },
    { text: '  .then(order => console.log("Got", order.item))', badge: order('then') },
    { text: '  .catch(err => console.log("Problem:", err.message))', badge: order('catch') },
    { text: '  .finally(() => console.log("Order closed"));', badge: order('finally') },
  ].map((l) => ({ ...l, state: l.badge ? ('on' as const) : undefined }));

  return (
    <div className="as-split">
      <div>
        <div className="as-form">
          <div role="radiogroup" aria-label="Item" className="as-row">
            {ITEMS.map((it) => (
              <button
                key={it.name}
                type="button"
                role="radio"
                aria-checked={item === it.name}
                aria-pressed={item === it.name}
                className="viz-btn"
                onClick={() => setItem(it.name)}
              >
                {it.emoji} {it.name}
              </button>
            ))}
          </div>
          <label className="as-row as-gap">
            <span className="as-small">Cooking time</span>
            <input
              type="range"
              className="as-range"
              min={500}
              max={5000}
              step={500}
              value={ms}
              onChange={(e) => setMs(Number(e.target.value))}
            />
            <strong className="viz-mono as-small">{secs(ms)}</strong>
          </label>
          <div className="as-row as-gap">
            <label className="as-check">
              <input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} />
              Will it fail? 🔥
            </label>
            <button type="button" className="viz-btn viz-btn--primary" onClick={place}>
              Place order
            </button>
          </div>
        </div>
        <CodeView label="The code for this order" lines={code} />
        <div className="as-tokens" aria-live="polite">
          {orders.length === 0 && (
            <p className="as-small as-muted">Your order tokens appear here.</p>
          )}
          {orders.map((o) => (
            <Token
              key={o.id}
              n={o.id}
              emoji={emojiOf(o.item)}
              state={o.state}
              text={o.text}
              ms={o.realMs}
            />
          ))}
        </div>
      </div>
      <div>
        <StateDiagram state={latest?.state ?? 'idle'} />
        <HandMade />
        <EventLog
          rows={log.rows}
          onClear={log.clear}
          label="What ran, in order"
          height="10rem"
          empty="Place an order."
        />
      </div>
    </div>
  );
}

/** pending → fulfilled / rejected, with the current state glowing. */
function StateDiagram({ state }: { state: TokenState }) {
  const node = (s: 'pending' | 'fulfilled' | 'rejected', label: string) => (
    <span className={`as-node is-${s} ${state === s ? 'is-active' : ''}`}>{label}</span>
  );
  return (
    <div
      className="as-diagram"
      role="img"
      aria-label={`Promise states. Now: ${state === 'idle' ? 'no order yet' : state}.`}
    >
      {node('pending', '⏳ pending')}
      <div className="as-arrows" aria-hidden="true">
        <span className={state === 'fulfilled' ? 'is-taken' : ''}>↗</span>
        <span className={state === 'rejected' ? 'is-taken' : ''}>↘</span>
      </div>
      <div className="as-ends">
        {node('fulfilled', '✅ fulfilled')}
        {node('rejected', '❌ rejected')}
      </div>
    </div>
  );
}

/** A promise you settle by hand, to prove that settling only happens once. */
function HandMade() {
  const ref = useRef<{ resolve: (v: string) => void; reject: (e: Error) => void } | null>(null);
  const [state, setState] = useState<{ status: TokenState; text?: string; tries: number }>({
    status: 'idle',
    tries: 0,
  });
  const make = () => {
    const p = new Promise<string>((resolve, reject) => {
      ref.current = { resolve, reject };
    });
    // Handled both ways, so a reject never becomes an "unhandled rejection".
    p.then(
      (v) => setState((s) => ({ ...s, status: 'fulfilled', text: v })),
      (e: Error) => setState((s) => ({ ...s, status: 'rejected', text: e.message })),
    );
    setState({ status: 'pending', tries: 0 });
  };
  const attempt = (how: 'resolve' | 'reject') => {
    if (!ref.current) return;
    if (how === 'resolve') ref.current.resolve('chai ☕');
    else ref.current.reject(new Error('out of milk'));
    setState((s) => ({ ...s, tries: s.tries + 1 }));
  };
  const settled = state.status === 'fulfilled' || state.status === 'rejected';
  return (
    <div className="viz-panel as-handmade">
      <div className="viz-label">A hand-made promise</div>
      <div className="as-row">
        <button type="button" className="viz-btn viz-mono" onClick={make}>
          new Promise(…)
        </button>
        <button
          type="button"
          className="viz-btn viz-mono"
          onClick={() => attempt('resolve')}
          disabled={state.status === 'idle'}
        >
          resolve("chai ☕")
        </button>
        <button
          type="button"
          className="viz-btn viz-mono"
          onClick={() => attempt('reject')}
          disabled={state.status === 'idle'}
        >
          reject(new Error("out of milk"))
        </button>
      </div>
      <p className="as-small" aria-live="polite">
        {state.status === 'idle'
          ? 'Make a promise, then settle it. Then try to settle it again.'
          : !settled
            ? 'Pending: waiting for you to resolve or reject it.'
            : state.tries > 1
              ? `🔒 Still ${state.status} (${state.text}). You called it ${state.tries} times, but a settled promise never changes.`
              : `${state.status === 'fulfilled' ? '✅ fulfilled' : '❌ rejected'} with ${state.text}. Now try the other button…`}
      </p>
    </div>
  );
}

// ─── Tab: Chaining ───────────────────────────────────────────────────

const CHAIN = [
  { name: 'boil', emoji: '💧', out: 'water' },
  { name: 'tea', emoji: '🍃', out: 'tea' },
  { name: 'milk', emoji: '🥛', out: 'chai' },
  { name: 'serve', emoji: '☕', out: 'served chai' },
];
const CHAIN_MS = 900;
const PROMISE_LINES = [
  'boilWater()',
  '  .then((water) => addTea(water))',
  '  .then((tea) => addMilk(tea))',
  '  .then((chai) => serve(chai))',
  '  .then(() => console.log("Enjoy! ☕"))',
  '  .catch((err) => console.log(err.message));',
];
const AWAIT_LINES = [
  'try {',
  '  const water = await boilWater();',
  '  const tea = await addTea(water);',
  '  const chai = await addMilk(tea);',
  '  await serve(chai);',
  '  console.log("Enjoy! ☕");',
  '} catch (err) {',
  '  console.log(err.message);',
  '}',
];

interface ChainState {
  steps: { state: TokenState; text?: string }[];
  caught?: string;
  done: boolean;
}
const FRESH: ChainState = {
  steps: CHAIN.map(() => ({ state: 'idle' as TokenState })),
  done: false,
};

function ChainTab({ speed }: { speed: number }) {
  const [failAt, setFailAt] = useState(-1);
  const [asAwait, setAsAwait] = useState(false);
  const [run, setRun] = useState<ChainState>(FRESH);
  const ctrl = useRef<AbortController | null>(null);
  useEffect(() => () => ctrl.current?.abort(), []);

  const start = () => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    const signal = c.signal;
    setRun(FRESH);
    const setStep = (k: number, st: { state: TokenState; text?: string }) =>
      !signal.aborted &&
      setRun((r) => ({ ...r, steps: r.steps.map((s, i) => (i === k ? st : s)) }));
    /** One step: a real promise that fulfils with this step's output. */
    const step = (k: number, input?: string) => {
      setStep(k, { state: 'pending', text: input });
      return makeOrder(CHAIN[k].name, { ms: CHAIN_MS, fail: failAt === k, signal, speed }).then(
        () => {
          setStep(k, { state: 'fulfilled', text: CHAIN[k].out });
          return CHAIN[k].out;
        },
        (e: Error) => {
          if (!isAbort(e)) setStep(k, { state: 'rejected', text: e.message });
          throw e;
        },
      );
    };
    step(0)
      .then((water) => step(1, water))
      .then((tea) => step(2, tea))
      .then((chai) => step(3, chai))
      .then(() => !signal.aborted && setRun((r) => ({ ...r, done: true })))
      .catch((e: Error) => {
        if (isAbort(e)) return;
        // Every step that never started is skipped: the error jumped straight here.
        setRun((r) => ({
          ...r,
          caught: e.message,
          steps: r.steps.map((s) => (s.state === 'idle' ? { state: 'skipped' } : s)),
        }));
      });
  };

  const active = run.steps.findIndex((s) => s.state === 'pending');
  const failed = run.steps.findIndex((s) => s.state === 'rejected');
  const lines = asAwait
    ? AWAIT_LINES.map((text, i) => ({
        text,
        state:
          (active >= 0 && i === active + 1) || (run.done && i === 5) ? ('on' as const) : undefined,
        badge:
          run.caught && (i === 7 || i === failed + 1)
            ? { text: i === 7 ? 'caught' : 'threw', tone: 'no' as const }
            : undefined,
      }))
    : PROMISE_LINES.map((text, i) => ({
        text,
        state: (active >= 0 && i === active) || (run.done && i === 4) ? ('on' as const) : undefined,
        badge:
          run.caught && (i === 5 || i === failed)
            ? { text: i === 5 ? 'caught' : 'rejected', tone: 'no' as const }
            : undefined,
      }));

  return (
    <>
      <div className="as-row">
        <label className="as-row as-small">
          Fail at step
          <select
            className="as-select"
            value={failAt}
            onChange={(e) => setFailAt(Number(e.target.value))}
          >
            <option value={-1}>none</option>
            {CHAIN.map((c, k) => (
              <option key={c.name} value={k}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="viz-btn viz-btn--primary" onClick={start}>
          ▶ Run the chain
        </button>
        <label className="as-check">
          <input type="checkbox" checked={asAwait} onChange={(e) => setAsAwait(e.target.checked)} />
          Show the async/await version
        </label>
      </div>
      <div className="as-pipeline" aria-live="polite">
        {CHAIN.map((c, k) => (
          <div key={c.name} className="as-pipe-step">
            <Token
              n={k + 1}
              emoji={c.emoji}
              state={run.steps[k].state}
              text={run.steps[k].text}
              ms={CHAIN_MS / speed}
              size="sm"
              label={c.name}
            />
            {k < CHAIN.length - 1 && (
              <span
                className={`as-pipe-arrow ${run.steps[k].state === 'fulfilled' ? 'is-carrying' : ''}`}
              >
                <span className="viz-mono">
                  {run.steps[k].state === 'fulfilled' ? `"${c.out}"` : ''}
                </span>{' '}
                →
              </span>
            )}
          </div>
        ))}
        <div className={`as-catch ${run.caught ? 'is-hit' : ''} ${run.done ? 'is-done' : ''}`}>
          {run.done ? 'Enjoy! ☕' : run.caught ? `.catch(): ${run.caught}` : '.catch()'}
        </div>
      </div>
      {run.caught && (
        <div className="as-bypass" aria-hidden="true">
          ↪ the error skips every remaining step, straight to .catch()
        </div>
      )}
      <CodeView label={asAwait ? 'async/await version' : 'Promise chain'} lines={lines} />
      <p className="as-note">
        Each <code>.then()</code> receives what the previous step returned. One{' '}
        <code>.catch()</code> handles an error from any step.
      </p>
    </>
  );
}

// ─── Tab: Several at once ────────────────────────────────────────────

const KINDS: { id: Combinator; name: string }[] = [
  { id: 'all', name: 'Promise.all' },
  { id: 'allSettled', name: 'allSettled' },
  { id: 'race', name: 'race' },
  { id: 'any', name: 'any' },
  { id: 'sequential', name: 'Sequential' },
];
const START: OrderSpec[] = [
  { item: 'chai', ms: 2000, fail: false },
  { item: 'samosa', ms: 3000, fail: false },
  { item: 'jalebi', ms: 1000, fail: false },
  { item: 'lassi', ms: 1500, fail: false },
];

function combinatorCode(kind: Combinator, specs: OrderSpec[]): string[] {
  const calls = specs.map(
    (s) => `  makeOrder("${s.item}", { ms: ${s.ms}${s.fail ? ', fail: true' : ''} }),`,
  );
  if (kind === 'sequential')
    return [
      'const results = [];',
      'for (const order of orders) {',
      '  results.push(await makeOrder(order.item, order));',
      '}',
    ];
  const name = kind === 'all' ? 'Promise.all' : `Promise.${kind}`;
  return [`const result = await ${name}([`, ...calls, ']);'];
}

function ManyTab({ speed }: { speed: number }) {
  const [specs, setSpecs] = useState(START);
  const [four, setFour] = useState(false);
  const [kind, setKind] = useState<Combinator>('all');
  const [rec, setRec] = useState<RunRecord | null>(null);
  const [now, setNow] = useState(0);
  const [history, setHistory] = useState<{ kind: Combinator; at: number }[]>([]);
  const ctrl = useRef<AbortController | null>(null);
  const frame = useRef(0);
  useEffect(
    () => () => {
      ctrl.current?.abort();
      cancelAnimationFrame(frame.current);
    },
    [],
  );
  const used = four ? specs : specs.slice(0, 3);

  const start = () => {
    ctrl.current?.abort();
    cancelAnimationFrame(frame.current);
    const c = new AbortController();
    ctrl.current = c;
    setRec(null);
    const t0 = performance.now();
    let finished = false;
    // A "now" line that moves while the kitchen is busy (it's information, so it moves even with reduced motion).
    const tick = () => {
      setNow((performance.now() - t0) * speed);
      if (!finished) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    runOrders(kind, used, {
      signal: c.signal,
      speed,
      onUpdate: (r) => {
        if (c.signal.aborted) return;
        setRec(r);
        // Stop the clock once every order that started has settled.
        const startedCount = r.started.filter((x) => x !== null).length;
        if (r.outcome && r.settles.length >= startedCount) {
          finished = true;
          setNow(Math.max(r.outcome.at, ...r.settles.map((s) => s.at)));
        }
      },
    }).then(
      (r) => {
        setHistory((h) => [{ kind, at: r.outcome!.at }, ...h].slice(0, 5));
        // Orders that never started (sequential after a failure) also mean we're done.
        if (r.settles.length >= r.started.filter((x) => x !== null).length) finished = true;
      },
      () => {
        finished = true; // aborted (reset or unmount): nothing to show
      },
    );
  };

  const setSpec = (i: number, patch: Partial<OrderSpec>) =>
    setSpecs((ss) => ss.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  const total =
    kind === 'sequential' ? used.reduce((t, s) => t + s.ms, 0) : Math.max(...used.map((s) => s.ms));
  const scale = Math.max(total, now, 1000) * 1.05;
  const pct = (ms: number) => `${(ms / scale) * 100}%`;
  const outcome = rec?.outcome ?? null;
  const summary = rec
    ? used
        .map((s, i) => {
          const st = rec.settles.find((x) => x.index === i);
          return `${s.item} ${st ? `${st.status} at ${secs(st.at)}` : rec.started[i] === null ? 'never started' : 'still cooking'}`;
        })
        .join(', ') +
      (outcome
        ? `. ${KINDS.find((k) => k.id === kind)!.name} ${outcome.status} at ${secs(outcome.at)}.`
        : '.')
    : '';

  return (
    <>
      <div className="as-rows">
        {used.map((s, i) => (
          <div key={s.item} className="as-order-row">
            <span className="as-order-name">
              {emojiOf(s.item)} {s.item}
            </span>
            <input
              type="range"
              className="as-range"
              min={500}
              max={5000}
              step={500}
              value={s.ms}
              aria-label={`${s.item} cooking time`}
              onChange={(e) => setSpec(i, { ms: Number(e.target.value) })}
            />
            <span className="viz-mono as-small">{secs(s.ms)}</span>
            <label className="as-check">
              <input
                type="checkbox"
                checked={s.fail}
                onChange={(e) => setSpec(i, { fail: e.target.checked })}
              />
              fail
            </label>
          </div>
        ))}
        <label className="as-check">
          <input type="checkbox" checked={four} onChange={(e) => setFour(e.target.checked)} />
          Add a 4th order (lassi)
        </label>
      </div>
      <div role="radiogroup" aria-label="How to wait" className="as-row as-gap">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            role="radio"
            aria-checked={kind === k.id}
            aria-pressed={kind === k.id}
            className="viz-btn viz-mono"
            onClick={() => setKind(k.id)}
          >
            {k.name}
          </button>
        ))}
        <button type="button" className="viz-btn viz-btn--primary" onClick={start}>
          ▶ Start
        </button>
      </div>
      <div className="as-split as-gap">
        <CodeView label="The code" lines={combinatorCode(kind, used).map((text) => ({ text }))} />
        <div className="as-result">
          <Token
            n={kind === 'sequential' ? 'seq' : kind}
            emoji="🧾"
            size="lg"
            label={`The ${kind} promise`}
            state={outcome ? outcome.status : rec ? 'pending' : 'idle'}
            text={outcome?.summary}
          />
          {outcome?.parts && (
            <ul className="as-parts">
              {outcome.parts.map((p, i) => (
                <li key={i} className={`is-${p.status} viz-mono`}>
                  {p.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div
        className="as-timeline-wrap"
        role="region"
        aria-label="Timeline (scrolls sideways on small screens)"
        tabIndex={0}
      >
        <div className="as-timeline">
          {used.map((s, i) => {
            const startAt = rec?.started[i] ?? null;
            const st = rec?.settles.find((x) => x.index === i);
            const end = st ? st.at : now;
            const ignored =
              !!outcome &&
              kind !== 'allSettled' &&
              kind !== 'sequential' &&
              (!st || st.at > outcome.at);
            return (
              <div key={s.item} className="as-lane">
                <span className="as-lane-name">
                  {emojiOf(s.item)} {s.item}
                </span>
                <div className="as-lane-track">
                  {startAt !== null && (
                    <span
                      className={`as-bar ${st ? `is-${st.status}` : 'is-pending'} ${ignored ? 'is-ignored' : ''}`}
                      style={{ left: pct(startAt), width: pct(Math.max(0, end - startAt)) }}
                    >
                      {st ? (st.status === 'fulfilled' ? '✅' : '❌') : ''}
                    </span>
                  )}
                  {rec && startAt === null && <span className="as-lane-note">never started</span>}
                  {ignored && (
                    <span className="as-lane-note is-right">ignored, already settled</span>
                  )}
                </div>
              </div>
            );
          })}
          {rec && (
            <span
              className="as-now"
              style={{ left: `calc(6.5rem + (100% - 6.5rem) * ${now / scale})` }}
              aria-hidden="true"
            />
          )}
          {outcome && (
            <span
              className={`as-settle is-${outcome.status}`}
              style={{ left: `calc(6.5rem + (100% - 6.5rem) * ${outcome.at / scale})` }}
            >
              🧾 {secs(outcome.at)}
            </span>
          )}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {outcome ? summary : ''}
      </p>
      {outcome && <p className="as-small">{summary}</p>}
      {history.length > 0 && (
        <p className="as-history">
          Last runs:{' '}
          {history.map((h, i) => (
            <span key={i} className="as-badge">
              {KINDS.find((k) => k.id === h.kind)!.name} {secs(h.at)}
            </span>
          ))}
        </p>
      )}
    </>
  );
}
