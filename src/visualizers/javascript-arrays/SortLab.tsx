import { useRef, useState } from 'react';
import { ArrayStrip, type StripItem } from '../core/array';
import { Tabs } from '../core/code';
import { MemoryBox, RefArrows } from '../core/memory';
import {
  hasCopyMethods,
  NUMBER_SETS,
  PRODUCTS,
  textSort,
  traceSort,
  type Comparison,
  type Product,
} from './lib/arraySteps';

/**
 * #3 Why is 100 before 5? Every order shown comes from the real sort. The
 * comparison log records the calls the browser's sort really made to your
 * compare function, so it can differ between browsers; only the final order
 * is guaranteed.
 */
export default function SortLab() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Why is 100 before 5?</p>
      <p className="viz-sub">Sort the tiles three ways, then ask why.</p>
      <Tabs
        twoUp
        label="Views"
        tabs={[
          { id: 'numbers', name: 'Numbers' },
          { id: 'objects', name: 'Sort objects' },
          { id: 'copy', name: 'sort vs toSorted' },
        ]}
      >
        {(t) =>
          t === 'numbers' ? <Numbers /> : t === 'objects' ? <Objects /> : <SortVsToSorted />
        }
      </Tabs>
    </div>
  );
}

interface Num {
  id: string;
  v: number;
}
const toNums = (vs: number[]): Num[] => vs.map((v) => ({ id: `n${v}`, v }));
/** Put the tiles in the order of `values` (the numbers are unique, so each tile keeps its id). */
const reorder = (nums: Num[], values: number[]) => values.map((v) => nums.find((n) => n.v === v)!);
const tile = (n: Num): StripItem => ({ id: n.id, label: String(n.v) });

type Action = 'text' | 'asc' | 'desc';
const CODE: Record<Action, string> = {
  text: 'nums.sort()',
  asc: 'nums.sort((a, b) => a - b)',
  desc: 'nums.sort((a, b) => b - a)',
};

function Numbers() {
  const [nums, setNums] = useState<Num[]>(toNums(NUMBER_SETS[0].nums));
  const [last, setLast] = useState<{ action: Action; comparisons: Comparison[] } | null>(null);
  const [why, setWhy] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const sortBy = (action: Action) => {
    const values = nums.map((n) => n.v);
    if (action === 'text') {
      setNums(reorder(nums, textSort(values)));
      setLast({ action, comparisons: [] });
    } else {
      const r = traceSort(values, action);
      setNums(reorder(nums, r.result));
      setLast({ action, comparisons: r.comparisons });
    }
    setWhy(false);
  };
  const shuffle = () => {
    const copy = [...nums];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setNums(copy);
    setLast(null);
    setWhy(false);
  };

  return (
    <>
      <div className="ja-row">
        <label className="ja-small">
          Numbers{' '}
          <select
            className="ja-input"
            onChange={(e) => {
              setNums(toNums(NUMBER_SETS[Number(e.target.value)].nums));
              setLast(null);
              setWhy(false);
            }}
          >
            {NUMBER_SETS.map((s, k) => (
              <option key={s.name} value={k}>
                {s.name}: [{s.nums.join(', ')}]
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="viz-btn" onClick={shuffle}>
          🔀 Shuffle
        </button>
      </div>

      <div className="ja-sort-strip">
        <ArrayStrip items={nums.map(tile)} ariaLabel={`nums: ${nums.map((n) => n.v).join(', ')}`} />
      </div>

      <div className="ja-row">
        {(['text', 'asc', 'desc'] as Action[]).map((a) => (
          <button
            key={a}
            type="button"
            className="viz-btn viz-mono"
            aria-pressed={last?.action === a}
            onClick={() => sortBy(a)}
          >
            {CODE[a].replace('nums', '')}
          </button>
        ))}
      </div>

      {last && (
        <div
          className={`ja-result ${last.action === 'text' ? 'is-warn' : 'is-good'}`}
          aria-live="polite"
        >
          <code className="viz-mono">
            {CODE[last.action]} → <strong>[{nums.map((n) => n.v).join(', ')}]</strong>
          </code>
          {last.action === 'text' ? (
            <span className="ja-note">
              Not in number order!{' '}
              <button
                type="button"
                className="ja-link"
                onClick={() => setWhy((w) => !w)}
                aria-expanded={why}
              >
                {why ? 'Hide why' : 'Why?'}
              </button>
            </span>
          ) : (
            <span className="ja-note">
              {last.action === 'asc' ? 'Smallest to largest.' : 'Largest to smallest.'}
            </span>
          )}
        </div>
      )}

      {why && last?.action === 'text' && <WhyText values={nums.map((n) => n.v)} />}

      {last && last.action !== 'text' && (
        <div className="ja-gap">
          <label className="ja-check">
            <input
              type="checkbox"
              checked={showLog}
              onChange={(e) => setShowLog(e.target.checked)}
            />
            Show comparisons ({last.comparisons.length})
          </label>
          {showLog && (
            <>
              <ol className="ja-log viz-mono">
                {last.comparisons.map((c, k) => (
                  <li key={k}>
                    a = {c.a}, b = {c.b} → {c.r} →{' '}
                    <span className={c.r < 0 ? 'is-neg' : c.r > 0 ? 'is-pos' : 'is-zero'}>
                      {c.r < 0
                        ? 'negative: a first'
                        : c.r > 0
                          ? 'positive: b first'
                          : 'zero: keep as is'}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="ja-small ja-muted">
                These are the real calls this browser’s sort made. Another browser may compare
                different pairs in a different order; only the final order is guaranteed.
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}

/** Show the numbers as text and line up their first characters, like a dictionary. */
function WhyText({ values }: { values: number[] }) {
  const texts = values.map(String);
  return (
    <div className="ja-why viz-fade">
      <div className="viz-label">The same numbers, as text</div>
      <ol className="ja-why-list viz-mono">
        {texts.map((t, k) => (
          <li key={k}>
            "<span className="ja-first">{t[0]}</span>
            {t.slice(1)}"
          </li>
        ))}
      </ol>
      <p className="ja-small">
        Without a compare function, <code>sort()</code> turns every item into text and compares
        character by character. As text, {[...new Set(texts.map((t) => `'${t[0]}'`))].join(' < ')},
        so a number starting with a smaller digit always comes first, however big it is. (The same
        thing made <code>"10" &lt; "9"</code> true in article #3.)
      </p>
    </div>
  );
}

// ─── Objects ──────────────────────────────────────────────────────────

const PRODUCT_SORTS: {
  id: string;
  name: string;
  code: string;
  cmp: (a: Product, b: Product) => number;
}[] = [
  {
    id: 'cheap',
    name: 'price: low → high',
    code: 'items.sort((a, b) => a.price - b.price)',
    cmp: (a, b) => a.price - b.price,
  },
  {
    id: 'dear',
    name: 'price: high → low',
    code: 'items.sort((a, b) => b.price - a.price)',
    cmp: (a, b) => b.price - a.price,
  },
  {
    id: 'name',
    name: 'name: A → Z',
    code: 'items.sort((a, b) => a.name.localeCompare(b.name))',
    cmp: (a, b) => a.name.localeCompare(b.name),
  },
];

function Objects() {
  const [items, setItems] = useState<Product[]>(PRODUCTS);
  const [by, setBy] = useState<string | null>(null);
  const current = PRODUCT_SORTS.find((s) => s.id === by);
  return (
    <>
      <div className="ja-row">
        {PRODUCT_SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            className="viz-btn"
            aria-pressed={by === s.id}
            onClick={() => {
              setItems([...items].sort(s.cmp)); // the real sort, on a copy for React
              setBy(s.id);
            }}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className="ja-sort-strip">
        <ArrayStrip
          items={items.map((p) => ({
            id: p.id,
            label: `${p.emoji} ${p.name}`,
            sub: `₹${p.price}`,
          }))}
          size="sm"
        />
      </div>
      <div className="ja-result" aria-live="polite">
        {current ? (
          <code className="viz-mono">{current.code}</code>
        ) : (
          <span className="ja-muted">Pick an order.</span>
        )}
        <span className="ja-note">
          The compare function decides <em>what</em> gets compared: prices with subtraction, names
          with localeCompare.
        </span>
      </div>
    </>
  );
}

// ─── sort vs toSorted ─────────────────────────────────────────────────

const START = [10, 1, 5, 100, 25];

function SortVsToSorted() {
  const [orig, setOrig] = useState<Num[]>(toNums(START));
  const [copy, setCopy] = useState<Num[] | null>(null);
  const [last, setLast] = useState<'sort' | 'toSorted' | null>(null);
  const memRef = useRef<HTMLDivElement>(null);
  const supported = hasCopyMethods();
  const asc = (a: number, b: number) => a - b;

  return (
    <>
      <div className="ja-row">
        <button
          type="button"
          className="viz-btn viz-mono"
          onClick={() => {
            const values = orig.map((n) => n.v);
            values.sort(asc); // the real, mutating sort
            setOrig(reorder(orig, values));
            setCopy(null);
            setLast('sort');
          }}
        >
          nums.sort((a, b) =&gt; a - b)
        </button>
        <button
          type="button"
          className="viz-btn viz-mono"
          disabled={!supported}
          title={supported ? undefined : 'This browser doesn’t have toSorted yet (added in 2023).'}
          onClick={() => {
            const values = orig.map((n) => n.v);
            const sorted = values.toSorted(asc); // the real, copying sort
            setCopy(sorted.map((v) => ({ id: `c${v}`, v })));
            setLast('toSorted');
          }}
        >
          nums.toSorted((a, b) =&gt; a - b)
        </button>
        <button
          type="button"
          className="viz-btn viz-btn--ghost"
          onClick={() => {
            setOrig(toNums(START));
            setCopy(null);
            setLast(null);
          }}
        >
          Reset
        </button>
      </div>
      {!supported && (
        <p className="ja-small ja-muted">
          Your browser doesn’t support toSorted (ES2023) yet, so only sort() works here.
        </p>
      )}

      <div className="viz-panel ja-memory ja-memory--two" ref={memRef}>
        <div className="ja-vars">
          <MemoryBox name="nums" kind="const" value="" refTo="nums" refLabel="[ ]" />
          {copy && (
            <MemoryBox
              name="sorted"
              kind="const"
              value=""
              refTo="sorted"
              refLabel="[ ]"
              state="new"
            />
          )}
        </div>
        <div className="ja-heap">
          <div
            className={`heap-card ja-card ${last === 'sort' ? 'is-changed' : ''}`}
            data-heap-id="nums"
          >
            <div className="heap-head">
              <span className="heap-label">nums</span>
              <span className="heap-type">array</span>
              {last === 'sort' && <span className="ja-badge">changed in place 🔧</span>}
              {last === 'toSorted' && <span className="ja-badge">original unchanged ✓</span>}
            </div>
            <div className="ja-card-body">
              <ArrayStrip items={orig.map(tile)} size="sm" />
            </div>
          </div>
          {copy && (
            <div className="heap-card ja-card is-new" data-heap-id="sorted">
              <div className="heap-head">
                <span className="heap-label">new array</span>
                <span className="heap-type">array</span>
              </div>
              <div className="ja-card-body">
                <ArrayStrip items={copy.map(tile)} size="sm" />
              </div>
            </div>
          )}
        </div>
        <RefArrows container={memRef} deps={`${last}-${orig.map((n) => n.v).join()}`} />
      </div>
      <p className="viz-caption" aria-live="polite">
        {last === 'sort'
          ? 'sort() rearranged the original array itself. Anything else pointing at nums sees the change.'
          : last === 'toSorted'
            ? 'toSorted() made a brand-new sorted array and left nums exactly as it was. That’s the one to use with React state.'
            : 'Try both and watch which array changes.'}
      </p>
    </>
  );
}
