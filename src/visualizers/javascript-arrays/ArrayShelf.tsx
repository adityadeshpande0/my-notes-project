import { useRef, useState } from 'react';
import { ArrayStrip, type StripGhost, type TileRole } from '../core/array';
import { Tabs } from '../core/code';
import { MemoryBox, RefArrows } from '../core/memory';
import {
  copy,
  hasCopyMethods,
  MAX_SHELF,
  mutate,
  runShelfOp,
  show,
  SONGS,
  type CopyOp,
  type MutateOp,
  type OpResult,
  type ShelfOp,
  type Song,
} from './lib/arraySteps';

/**
 * #1 The array shelf. Every button runs the real array method (see
 * lib/arraySteps.ts) on the playlist, and the strip animates from the old
 * array to the new one. The return value shown is the real one.
 */
export default function ArrayShelf() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">The array shelf</p>
      <p className="viz-sub">Press a method to run it on the real playlist array.</p>
      <Tabs
        label="Views"
        tabs={[
          { id: 'shelf', name: 'Read, change, find' },
          { id: 'mutate', name: 'Mutate vs copy' },
        ]}
      >
        {(t) => (t === 'shelf' ? <Shelf /> : <MutateVsCopy />)}
      </Tabs>
    </div>
  );
}

const START = SONGS.slice(0, 3);
const toSongs = (vals: string[]) => vals.map((value, k) => ({ id: `start-${k}`, value }));

/** A heap card with the array inside: the arrow from a variable lands on it. */
function ArrayCard({
  id,
  title,
  items,
  highlight,
  ghosts,
  badge,
  state,
}: {
  id: string;
  title: string;
  items: Song[];
  highlight?: Record<number, TileRole>;
  ghosts?: StripGhost[];
  badge?: string;
  state?: 'changed' | 'new';
}) {
  return (
    <div className={`heap-card ja-card ${state ? `is-${state}` : ''}`} data-heap-id={id}>
      <div className="heap-head">
        <span className="heap-label">{title}</span>
        <span className="heap-type">array</span>
        <span className="ja-length viz-mono">length: {items.length}</span>
        {badge && <span className="ja-badge">{badge}</span>}
      </div>
      <div className="ja-card-body">
        <ArrayStrip
          items={items.map((s) => ({ id: s.id, label: `🎵 ${s.value}` }))}
          highlight={highlight}
          ghosts={ghosts}
          size="sm"
          ariaLabel={`${title}: ${items.map((s) => s.value).join(', ') || 'empty'}`}
        />
      </div>
    </div>
  );
}

function Shelf() {
  const [items, setItems] = useState<Song[]>(toSongs(START));
  const [last, setLast] = useState<{ op: OpResult; before: Song[] } | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [i, setI] = useState(1);
  const [pick, setPick] = useState(SONGS[3]);
  const nextId = useRef(0);
  const memRef = useRef<HTMLDivElement>(null);

  const run = (op: ShelfOp) => {
    const r = runShelfOp(items, op, `n${nextId.current++}`);
    setLast({ op: r, before: items });
    setItems(r.items);
    setHistory((h) => [`${r.code}  →  ${show(r.returned)}`, ...h].slice(0, 5));
  };
  const full = items.length >= MAX_SHELF;
  const fullTip = full ? `The shelf holds ${MAX_SHELF} songs here. Remove one first.` : undefined;

  // Ghosts: what the last operation took out, shown fading where it used to be.
  const ghosts: StripGhost[] = (last?.op.removed ?? []).map((s) => ({
    id: s.id,
    label: `🎵 ${s.value}`,
    at: last!.before.findIndex((b) => b.id === s.id),
    note: 'removed',
  }));
  const highlight: Record<number, TileRole> = {};
  for (const h of last?.op.hits ?? []) highlight[h] = last!.op.mutates ? 'current' : 'match';

  return (
    <>
      <div className="viz-panel ja-memory" ref={memRef}>
        <MemoryBox name="playlist" kind="const" value="" refTo="playlist" refLabel="[ ]" />
        <ArrayCard
          id="playlist"
          title="playlist"
          items={items}
          highlight={highlight}
          ghosts={ghosts}
        />
        <RefArrows container={memRef} deps={items.map((s) => s.id).join()} />
      </div>

      <div className="ja-groups">
        <div className="ja-group">
          <div className="viz-label">Read</div>
          <div className="ja-row">
            <span className="ja-stepper" role="group" aria-label="Index">
              <button
                type="button"
                className="viz-btn viz-btn--icon"
                onClick={() => setI((n) => Math.max(0, n - 1))}
                aria-label="Smaller index"
              >
                −
              </button>
              <span className="viz-mono">i = {i}</span>
              <button
                type="button"
                className="viz-btn viz-btn--icon"
                onClick={() => setI((n) => Math.min(MAX_SHELF - 1, n + 1))}
                aria-label="Bigger index"
              >
                +
              </button>
            </span>
            <button
              type="button"
              className="viz-btn viz-mono"
              onClick={() => run({ kind: 'index', i })}
            >
              [{i}]
            </button>
            <button
              type="button"
              className="viz-btn viz-mono"
              onClick={() => run({ kind: 'length' })}
            >
              .length
            </button>
            <button type="button" className="viz-btn viz-mono" onClick={() => run({ kind: 'at' })}>
              .at(-1)
            </button>
          </div>
        </div>

        <div className="ja-group">
          <div className="viz-label">
            Change <span className="ja-mutates">🔧 mutates</span>
          </div>
          <label className="ja-row jl-small">
            <span className="ja-small">Song to add:</span>
            <select className="ja-input" value={pick} onChange={(e) => setPick(e.target.value)}>
              {SONGS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <div className="ja-row">
            <button
              type="button"
              className="viz-btn viz-mono"
              onClick={() => run({ kind: 'push', v: pick })}
              disabled={full}
              title={fullTip}
            >
              push(…)
            </button>
            <button type="button" className="viz-btn viz-mono" onClick={() => run({ kind: 'pop' })}>
              pop()
            </button>
            <button
              type="button"
              className="viz-btn viz-mono"
              onClick={() => run({ kind: 'unshift', v: pick })}
              disabled={full}
              title={fullTip}
            >
              unshift(…)
            </button>
            <button
              type="button"
              className="viz-btn viz-mono"
              onClick={() => run({ kind: 'shift' })}
            >
              shift()
            </button>
            <button
              type="button"
              className="viz-btn viz-mono"
              onClick={() => run({ kind: 'splice', i })}
            >
              splice({i}, 1)
            </button>
            <button
              type="button"
              className="viz-btn viz-mono"
              onClick={() => run({ kind: 'set', i, v: pick })}
              disabled={i >= items.length}
              title={i >= items.length ? `There's no item at index ${i} to replace.` : undefined}
            >
              [{i}] = …
            </button>
          </div>
        </div>

        <div className="ja-group">
          <div className="viz-label">Find</div>
          <div className="ja-row">
            <button
              type="button"
              className="viz-btn viz-mono"
              onClick={() => run({ kind: 'includes', v: pick })}
            >
              includes(…)
            </button>
            <button
              type="button"
              className="viz-btn viz-mono"
              onClick={() => run({ kind: 'indexOf', v: pick })}
            >
              indexOf(…)
            </button>
          </div>
        </div>
      </div>

      <div className={`ja-result ${last?.op.miss ? 'is-miss' : ''}`} aria-live="polite">
        {last ? (
          <>
            <code className="viz-mono">
              {last.op.code}
              {'  →  '}
              <strong>{show(last.op.returned)}</strong>
            </code>
            {last.op.note && <span className="ja-note">{last.op.note}</span>}
          </>
        ) : (
          <span className="ja-muted">Press a method. Its return value appears here.</span>
        )}
      </div>
      {history.length > 1 && (
        <ol className="ja-history viz-mono" aria-label="Recent operations">
          {history.slice(1).map((h, k) => (
            <li key={k}>{h}</li>
          ))}
        </ol>
      )}
      <div className="ja-row ja-gap">
        <button
          type="button"
          className="viz-btn viz-btn--ghost"
          onClick={() => {
            setItems(toSongs(START));
            setLast(null);
            setHistory([]);
          }}
        >
          Reset the shelf
        </button>
      </div>
    </>
  );
}

const MUTATORS: MutateOp[] = ['push', 'sort', 'reverse', 'splice'];
const COPIERS: CopyOp[] = ['spread', 'toSorted', 'toReversed', 'toSpliced'];
const LABEL: Record<string, string> = {
  push: 'push("Ilahi")',
  sort: 'sort()',
  reverse: 'reverse()',
  splice: 'splice(1, 1)',
  spread: '[...arr, "Ilahi"]',
  toSorted: 'toSorted()',
  toReversed: 'toReversed()',
  toSpliced: 'toSpliced(1, 1)',
};

function MutateVsCopy() {
  const [original, setOriginal] = useState<Song[]>(
    toSongs(['Tum Hi Ho', 'Kesariya', 'Apna Bana Le']),
  );
  const [last, setLast] = useState<{
    kind: 'mutate' | 'copy';
    code: string;
    result: Song[];
  } | null>(null);
  const [flash, setFlash] = useState(0);
  const nextId = useRef(0);
  const memRef = useRef<HTMLDivElement>(null);
  const supported = hasCopyMethods();
  const extra = () => ({ id: `x${nextId.current++}`, value: 'Ilahi' });

  const doMutate = (op: MutateOp) => {
    // The visual keeps one "same array": change it in place, then tell React to redraw.
    const arr = [...original];
    const r = mutate(arr, op, extra());
    setOriginal(arr);
    setLast({ kind: 'mutate', code: r.code, result: arr });
    setFlash((n) => n + 1);
  };
  const doCopy = (op: CopyOp) => {
    const r = copy(original, op, extra());
    setLast({ kind: 'copy', code: r.code, result: r.result });
  };

  const isCopy = last?.kind === 'copy';
  return (
    <>
      <div className="viz-grid-2">
        <div className="ja-group">
          <div className="viz-label">
            Mutating <span className="ja-mutates">🔧 changes the original</span>
          </div>
          <div className="ja-row">
            {MUTATORS.map((op) => (
              <button
                key={op}
                type="button"
                className="viz-btn viz-mono"
                onClick={() => doMutate(op)}
                disabled={op === 'push' && original.length >= MAX_SHELF}
              >
                {LABEL[op]}
              </button>
            ))}
          </div>
        </div>
        <div className="ja-group">
          <div className="viz-label">Copying ✨ makes a new array</div>
          <div className="ja-row">
            {COPIERS.map((op) => (
              <button
                key={op}
                type="button"
                className="viz-btn viz-mono"
                onClick={() => doCopy(op)}
                disabled={
                  (!supported && op !== 'spread') ||
                  (op === 'spread' && original.length >= MAX_SHELF)
                }
                title={
                  !supported && op !== 'spread'
                    ? 'This browser doesn’t have toSorted / toReversed / toSpliced yet (added in 2023).'
                    : undefined
                }
              >
                {LABEL[op]}
              </button>
            ))}
          </div>
          {!supported && (
            <p className="ja-small ja-muted">
              Your browser is older than these methods (ES2023), so only spread works here.
            </p>
          )}
        </div>
      </div>

      <div className="viz-panel ja-memory ja-memory--two" ref={memRef}>
        <div className="ja-vars">
          <MemoryBox name="playlist" kind="const" value="" refTo="orig" refLabel="[ ]" />
          <MemoryBox
            key={`same-${flash}`}
            name="sameList"
            kind="const"
            value=""
            refTo="orig"
            refLabel="[ ]"
            state={last?.kind === 'mutate' ? 'changed' : 'same'}
          />
          {isCopy && (
            <MemoryBox
              key={last.code}
              name="result"
              kind="const"
              value=""
              refTo="copy"
              refLabel="[ ]"
              state="new"
            />
          )}
        </div>
        <div className="ja-heap">
          <ArrayCard
            key={`orig-${flash}`}
            id="orig"
            title="original"
            items={original}
            state={last?.kind === 'mutate' ? 'changed' : undefined}
            badge={
              last?.kind === 'mutate'
                ? 'changed (sameList too!)'
                : isCopy
                  ? 'original unchanged ✓'
                  : undefined
            }
          />
          {isCopy && (
            <ArrayCard
              key={last.code}
              id="copy"
              title="new array"
              items={last.result}
              state="new"
            />
          )}
        </div>
        <RefArrows container={memRef} deps={`${last?.code}-${flash}-${original.length}`} />
      </div>

      <div
        className={`ja-result ${last ? (isCopy ? 'is-good' : 'is-warn') : ''}`}
        aria-live="polite"
      >
        {last ? (
          <>
            {isCopy ? (
              <>
                <code className="viz-mono">const result = {last.code};</code>
                <code className="viz-mono">
                  playlist === result → <strong>false</strong>
                </code>
              </>
            ) : (
              <>
                <code className="viz-mono">{last.code};</code>
                <code className="viz-mono">
                  playlist === sameList → <strong>true</strong>
                </code>
              </>
            )}
            <span className="ja-note">
              {isCopy
                ? 'A new array with a new arrow, so React would notice the change and re-render.'
                : 'Still the same array behind the same arrow, so React wouldn’t notice anything changed.'}
            </span>
          </>
        ) : (
          <span className="ja-muted">Try a button on each side and compare the arrows.</span>
        )}
      </div>
      <div className="ja-row ja-gap">
        <button
          type="button"
          className="viz-btn viz-btn--ghost"
          onClick={() => {
            setOriginal(toSongs(['Tum Hi Ho', 'Kesariya', 'Apna Bana Le']));
            setLast(null);
          }}
        >
          Reset
        </button>
      </div>
    </>
  );
}
