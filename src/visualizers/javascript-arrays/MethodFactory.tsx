import { useMemo, useState } from 'react';
import { ArrayStrip, type StripItem, type TileRole } from '../core/array';
import { Tabs } from '../core/code';
import { IterationCounter } from '../core/IterationCounter';
import { MemoryBox } from '../core/memory';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import {
  FILTER_PRESETS,
  MAP_PRESETS,
  ORDERS,
  PRODUCTS,
  REDUCE_PRESETS,
  SEARCH_CONDITIONS,
  show,
  traceChain,
  traceFilter,
  traceMap,
  traceReduce,
  traceSearch,
  type Order,
  type Product,
  type SearchMethod,
} from './lib/arraySteps';

/**
 * #2 The array factory. The real method runs first, with its callback
 * wrapped so every call is recorded (lib/arraySteps.ts). Stepping just
 * replays those recorded calls: item in, callback answer, item out.
 *
 * React idea: the machines never keep the results in state. Only your
 * choices (items, preset) are state; the trace is worked out from them with
 * useMemo, and the step number decides how much of it to show.
 */
type TabId = 'map' | 'filter' | 'reduce' | 'search' | 'chain';

export default function MethodFactory() {
  const [picked, setPicked] = useState<string[]>(PRODUCTS.map((p) => p.id));
  const items = PRODUCTS.filter((p) => picked.includes(p.id));
  const toggle = (id: string) =>
    setPicked((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <div className="viz not-prose">
      <p className="viz-title">The array factory</p>
      <p className="viz-sub">
        Items ride the belt into a machine. The callback on its panel decides what comes out.
      </p>
      <Tabs
        twoUp
        label="Machines"
        tabs={[
          { id: 'map', name: 'map 🔁' },
          { id: 'filter', name: 'filter 🚧' },
          { id: 'reduce', name: 'reduce 🗜️' },
          { id: 'search', name: 'find / some / every 🔍' },
          { id: 'chain', name: 'Chaining ⛓️' },
        ]}
      >
        {(t) =>
          t === 'chain' ? (
            <Chain />
          ) : (
            <>
              <div className="ja-row ja-picker" role="group" aria-label="Items on the belt">
                <span className="ja-small ja-muted">On the belt:</span>
                {PRODUCTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="ja-toggle"
                    aria-pressed={picked.includes(p.id)}
                    onClick={() => toggle(p.id)}
                  >
                    {p.emoji} {p.name}
                  </button>
                ))}
              </div>
              <Machine
                key={t}
                tab={t as Exclude<TabId, 'chain'>}
                items={items}
              />
            </>
          )
        }
      </Tabs>
    </div>
  );
}

const productTile = (p: Product): StripItem => ({
  id: p.id,
  label: `${p.emoji} ${p.name}`,
  sub: `₹${p.price}`,
});
const valueTile = (v: unknown, k: number): StripItem => ({ id: `out-${k}`, label: show(v) });

function Machine({ tab, items }: { tab: Exclude<TabId, 'chain'>; items: Product[] }) {
  const [preset, setPreset] = useState(0);
  const [noInit, setNoInit] = useState(false);
  const [method, setMethod] = useState<SearchMethod>('find');

  const presets =
    tab === 'map'
      ? MAP_PRESETS
      : tab === 'filter'
        ? FILTER_PRESETS
        : tab === 'reduce'
          ? REDUCE_PRESETS
          : SEARCH_CONDITIONS.map((c) => ({ id: c.id, name: c.code, code: c.code }));

  return (
    <>
      <div className="ja-row">
        {tab === 'search' && (
          <label className="ja-small">
            Method{' '}
            <select
              className="ja-input viz-mono"
              value={method}
              onChange={(e) => setMethod(e.target.value as SearchMethod)}
            >
              {(['find', 'findIndex', 'some', 'every'] as SearchMethod[]).map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
        )}
        <label className="ja-small">
          {tab === 'search' ? 'Condition' : 'Callback'}{' '}
          <select
            className="ja-input"
            value={preset}
            onChange={(e) => setPreset(Number(e.target.value))}
          >
            {presets.map((p, k) => (
              <option key={p.id} value={k}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        {tab === 'reduce' && (
          <label className="ja-check">
            <input type="checkbox" checked={noInit} onChange={(e) => setNoInit(e.target.checked)} />
            Remove the initial value
          </label>
        )}
      </div>
      <Run
        key={`${preset}-${noInit}-${method}-${items.map((p) => p.id).join()}`}
        tab={tab}
        items={items}
        preset={preset}
        noInit={noInit}
        method={method}
      />
    </>
  );
}

const ICON = { map: '🔁', filter: '🚧', reduce: '🗜️', search: '🔍' };
const NAME = { map: 'transformer', filter: 'gate', reduce: 'compactor', search: 'detector' };

function Run({
  tab,
  items,
  preset,
  noInit,
  method,
}: {
  tab: Exclude<TabId, 'chain'>;
  items: Product[];
  preset: number;
  noInit: boolean;
  method: SearchMethod;
}) {
  // Run the real method once, recording every callback call.
  const run = useMemo(() => {
    if (tab === 'map') {
      const p = MAP_PRESETS[preset];
      const r = traceMap(items, p.fn);
      return {
        ...r,
        code: `items.map(${p.code})`,
        callback: p.code,
        explain: p.explain,
        error: undefined as string | undefined,
        accName: '',
      };
    }
    if (tab === 'filter') {
      const p = FILTER_PRESETS[preset];
      const r = traceFilter(items, p.fn);
      return {
        ...r,
        code: `items.filter(${p.code})`,
        callback: p.code,
        explain: p.explain,
        error: undefined,
        accName: '',
      };
    }
    if (tab === 'reduce') {
      const p = REDUCE_PRESETS[preset];
      const r = traceReduce(items, p.fn, noInit ? null : { value: p.init });
      return {
        ...r,
        code: `items.reduce(${p.code}${noInit ? '' : `, ${p.init}`})`,
        callback: p.code,
        explain: p.explain,
        accName: p.accName,
      };
    }
    const c = SEARCH_CONDITIONS[preset];
    const r = traceSearch(items, method, c.fn);
    return {
      ...r,
      code: `items.${method}(${c.code})`,
      callback: c.code,
      explain: (it: Product, res: unknown) =>
        `${c.code.replace('p => ', '').replace('p.price', String(it.price))} is ${res}`,
      error: undefined,
      accName: '',
    };
  }, [tab, items, preset, noInit, method]);

  const total = run.calls.length + 2; // ready, one step per call, then the result
  const s = useStepper(total, 1200);
  const k = s.index - 1; // the call being shown (-1: not started)
  const done = s.atEnd;
  const call = k >= 0 && k < run.calls.length ? run.calls[k] : undefined;
  const seen = run.calls.slice(0, Math.max(0, Math.min(k + 1, run.calls.length)));
  const checked = new Set(seen.map((c) => c.index));
  const lastChecked = run.calls.length ? run.calls[run.calls.length - 1].index : -1;

  // The belt: the item being processed glows; finished ones fade; for the
  // search machines, items after an early stop are marked as never checked.
  const highlight: Record<number, TileRole> = {};
  const labels: Record<number, string> = {};
  items.forEach((_, i) => {
    if (call?.index === i) highlight[i] = 'current';
    else if (checked.has(i))
      highlight[i] =
        tab === 'filter' ? (seen.find((c) => c.index === i)?.result ? 'match' : 'miss') : 'muted';
    if (done && tab === 'search' && i > lastChecked) {
      highlight[i] = 'muted';
      labels[i] = '⏭ skipped';
    }
  });
  if (tab === 'reduce' && noInit && items.length && s.index >= 1) labels[0] = 'start value';

  const outItems: StripItem[] =
    tab === 'map'
      ? seen.map((c, j) => valueTile(c.result, j))
      : tab === 'filter'
        ? seen.filter((c) => c.result).map((c) => productTile(c.item as Product))
        : [];
  const rejected =
    tab === 'filter' ? seen.filter((c) => !c.result).map((c) => c.item as Product) : [];
  const acc =
    tab === 'reduce'
      ? seen.length
        ? seen[seen.length - 1].result
        : noInit
          ? items[0]
          : REDUCE_PRESETS[preset].init
      : undefined;

  const outCount =
    tab === 'map'
      ? (run.out as unknown[]).length
      : tab === 'filter'
        ? (run.out as unknown[]).length
        : null;
  const caption = !s.index
    ? `${items.length} item${items.length === 1 ? '' : 's'} on the belt. Press play or → to start the ${NAME[tab]}.`
    : call
      ? `Item ${call.index}: ${run.explain(call.item as Product, call.result, call.acc)}.`
      : run.error
        ? `💥 ${run.error}. With no starting value and no items, reduce has nothing to start from.`
        : tab === 'search' && run.calls.length < items.length
          ? `Stopped early after ${run.calls.length} of ${items.length} items: it already knew the answer.`
          : `Done. The result is ${show(run.out)}.`;

  return (
    <>
      <div className="ja-factory">
        <div className="ja-belt-wrap">
          <div className="viz-label">Input</div>
          <div className="ja-belt">
            <ArrayStrip
              items={items.map(productTile)}
              highlight={highlight}
              labels={labels}
              size="sm"
              ariaLabel="Input array"
            />
          </div>
        </div>

        <div className={`ja-machine is-${tab} ${call ? 'is-working' : ''}`}>
          <div className="ja-machine-head">
            <span aria-hidden="true">{ICON[tab]}</span> {NAME[tab]}
          </div>
          <code className="ja-panel viz-mono">{run.callback}</code>
          <div className="ja-calc viz-mono" aria-live="polite">
            {call ? (
              <>
                {tab === 'filter' || tab === 'search' ? (call.result ? '✅ ' : '❌ ') : ''}
                {run.explain(call.item as Product, call.result, call.acc)}
              </>
            ) : (
              <span className="ja-muted">{done ? 'finished' : 'waiting…'}</span>
            )}
          </div>
          {tab === 'reduce' && (
            <div className="ja-acc">
              <MemoryBox
                key={s.index}
                name={run.accName}
                kind="let"
                value={acc === undefined ? '…' : show(acc)}
                state={call ? 'changed' : 'same'}
              />
            </div>
          )}
        </div>

        <div className="ja-belt-wrap">
          <div className="viz-label">Output</div>
          {(tab === 'map' || tab === 'filter') && (
            <ArrayStrip items={outItems} size="sm" ariaLabel="Output array so far" />
          )}
          {tab === 'filter' && rejected.length > 0 && (
            <p className="ja-bin">
              🗑 rejected: {rejected.map((p) => `${p.emoji} ${p.name}`).join(', ')}
            </p>
          )}
          {(tab === 'reduce' || tab === 'search') && (
            <div className={`ja-final ${done ? (run.error ? 'is-bad' : 'is-on') : ''}`}>
              {done ? (run.error ? `💥 ${run.error}` : show(run.out)) : '…'}
            </div>
          )}
          {done && outCount !== null && (
            <span className="ja-badge ja-gap">
              {items.length} in → {outCount} out
            </span>
          )}
        </div>
      </div>

      {tab === 'reduce' && seen.length > 0 && (
        <table className="ja-table">
          <thead>
            <tr>
              <th scope="col">Step</th>
              <th scope="col">{run.accName} (before)</th>
              <th scope="col">item</th>
              <th scope="col">new {run.accName}</th>
            </tr>
          </thead>
          <tbody>
            {seen.map((c, j) => (
              <tr key={j} className={j === seen.length - 1 && !done ? 'is-now' : undefined}>
                <td>{j + 1}</td>
                <td className="viz-mono">{show(c.acc)}</td>
                <td className="viz-mono">
                  {(c.item as Product).emoji} ₹{(c.item as Product).price}
                </td>
                <td className="viz-mono">
                  <strong>{show(c.result)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="ja-row ja-gap">
        <code className="viz-mono ja-code">{run.code}</code>
        <IterationCounter
          count={seen.length}
          label="callback called"
          icon="📞"
          tone={done ? 'done' : 'normal'}
        />
      </div>
      <div className="viz-caption" aria-live="polite">
        {caption}
        {done && tab === 'reduce' && noInit && !run.error && items.length > 0 && (
          <>
            {' '}
            Without a starting value, the first item ({show(items[0])}) became the start, and the
            callback ran one time fewer.
          </>
        )}
      </div>
      <StepControls s={s} />
    </>
  );
}

// ─── Chaining ─────────────────────────────────────────────────────────

const orderTile = (o: Order): StripItem => ({
  id: o.id,
  label: `${o.emoji} ${o.item}`,
  sub: `₹${o.price} ${o.delivered ? '✓' : '✗'}`,
});
const STAGES = ['filter(o => o.delivered)', 'map(o => o.price)', 'reduce((sum, p) => sum + p, 0)'];

function Chain() {
  const [orders, setOrders] = useState(ORDERS);
  const toggle = (id: string) =>
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, delivered: !o.delivered } : o)));
  return (
    <>
      <div className="ja-row ja-picker" role="group" aria-label="Orders">
        <span className="ja-small ja-muted">Delivered? (click to toggle)</span>
        {orders.map((o) => (
          <button
            key={o.id}
            type="button"
            className="ja-toggle"
            aria-pressed={o.delivered}
            onClick={() => toggle(o.id)}
          >
            {o.emoji} {o.item} {o.delivered ? '✓' : '✗'}
          </button>
        ))}
      </div>
      <ChainRun key={orders.map((o) => o.delivered).join()} orders={orders} />
    </>
  );
}

function ChainRun({ orders }: { orders: Order[] }) {
  const run = useMemo(() => traceChain(orders), [orders]);
  const s = useStepper(run.calls.length + 2, 1000);
  const k = s.index - 1;
  const call = k >= 0 && k < run.calls.length ? run.calls[k] : undefined;
  const seen = run.calls.slice(0, Math.max(0, Math.min(k + 1, run.calls.length)));
  const stageDone = (stage: number) => s.atEnd || (call ? call.stage > stage : false);
  const stage = call?.stage ?? (s.atEnd ? 3 : -1);

  const passed = seen.filter((c) => c.stage === 0 && c.result).map((c) => c.item as Order);
  const prices = seen.filter((c) => c.stage === 1).map((c) => c.result as number);
  const sums = seen.filter((c) => c.stage === 2);
  const sum = sums.length ? (sums[sums.length - 1].result as number) : 0;
  // The filter stage colours each order: being checked, passed or left behind.
  const orderRoles: Record<number, TileRole> = {};
  orders.forEach((o, i) => {
    if (call?.stage === 0 && call.index === i) orderRoles[i] = 'current';
    else if (seen.some((c) => c.stage === 0 && c.index === i))
      orderRoles[i] = o.delivered ? 'match' : 'miss';
  });

  return (
    <>
      <div className="ja-chain">
        <div className="ja-belt-wrap">
          <div className="viz-label">orders</div>
          <ArrayStrip items={orders.map(orderTile)} highlight={orderRoles} size="sm" />
        </div>
        {[0, 1, 2].map((st) => (
          <div key={st} className="ja-chain-step">
            <div
              className={`ja-machine is-mini ${stage === st ? 'is-working' : ''} ${stageDone(st) ? 'is-done' : ''}`}
            >
              <code className="viz-mono">.{STAGES[st]}</code>
            </div>
            <div className="ja-belt-wrap">
              {st === 0 && (
                <ArrayStrip items={passed.map(orderTile)} size="sm" ariaLabel="After filter" />
              )}
              {st === 1 && (
                <ArrayStrip
                  items={prices.map((p, j) => valueTile(p, j))}
                  size="sm"
                  ariaLabel="After map"
                />
              )}
              {st === 2 && (
                <div className={`ja-final ${s.atEnd ? 'is-on' : ''}`}>
                  {sums.length || s.atEnd ? sum : '…'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <pre className="vc-code viz-mono ja-chain-code">
        <div className="vc-line">
          <span>const revenue = orders</span>
        </div>
        {STAGES.map((t, st) => (
          <div key={st} className={`vc-line ${stage === st ? 'is-on' : ''}`}>
            <span> .{t}</span>
          </div>
        ))}
      </pre>
      <div className="ja-row ja-gap">
        <IterationCounter
          count={seen.length}
          label="callbacks called"
          icon="📞"
          tone={s.atEnd ? 'done' : 'normal'}
        />
      </div>
      <div className="viz-caption" aria-live="polite">
        {!s.index
          ? 'Three machines in a row. Each one hands its new array to the next.'
          : call
            ? call.stage === 0
              ? `filter: ${(call.item as Order).item} delivered? ${call.result ? 'yes, it passes ✓' : 'no, it stays behind ✗'}`
              : call.stage === 1
                ? `map: take just the price of ${(call.item as Order).item}: ${call.result}.`
                : `reduce: ${call.acc} + ${call.item} = ${call.result}.`
            : `Revenue: ${run.revenue}. Read the chain top to bottom like a recipe.`}
      </div>
      <StepControls s={s} />
    </>
  );
}
