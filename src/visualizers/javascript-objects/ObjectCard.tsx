import { useMemo, useRef, useState, type PointerEvent } from 'react';
import { useReducedMotion } from '../../lib/hooks';
import { ArrayStrip } from '../core/array';
import { Tabs } from '../core/code';
import { HeapCard, MemoryBox, RefArrows, type HeapProp, type PropRole } from '../core/memory';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import {
  checkKey,
  deleteProp,
  hasProp,
  loopHelpers,
  makeChai,
  makeCounter,
  parseValue,
  readProp,
  readWithVariable,
  setProp,
  show,
  type Obj,
  type ReadResult,
  type ValueKind,
} from './lib/objectSteps';

/**
 * #1 The object ID card. The card is a live object kept in React state; every
 * button runs the real operation on it (chai[key], delete, Object.keys…) via
 * lib/objectSteps.ts, and the card shows what changed.
 *
 * React idea: the object is never changed in place. Each change makes a new
 * object ({ ...chai }) and puts it in state, which is how React notices.
 */
type Mark = { key: string; role: PropRole } | null;

export default function ObjectCard() {
  const [chai, setChai] = useState<Obj>(makeChai);
  const [mark, setMark] = useState<Mark>(null);
  // A deleted row stays on the card (faded) until the next action.
  const [ghost, setGhost] = useState<{ key: string; value: unknown } | null>(null);
  const [version, setVersion] = useState(0);

  const update = (next: Obj, m: Mark, g: typeof ghost = null) => {
    setChai(next);
    setMark(m);
    setGhost(g);
    setVersion((v) => v + 1);
  };

  return (
    <div className="viz not-prose">
      <p className="viz-title">The object ID card</p>
      <p className="viz-sub">A live object. Read it, change it, loop over it.</p>
      <div className="jo-layout">
        <ChaiCard chai={chai} mark={mark} ghost={ghost} version={version} />
        <div className="jo-actions">
          <Tabs
            twoUp
            label="Actions"
            tabs={[
              { id: 'read', name: 'Read' },
              { id: 'change', name: 'Change' },
              { id: 'loop', name: 'Loop' },
              { id: 'method', name: 'Method' },
            ]}
          >
            {(t) =>
              t === 'read' ? (
                <ReadTab
                  chai={chai}
                  onRead={(r) => {
                    setMark(r.found ? { key: r.key, role: 'read' } : null);
                    setGhost(null);
                  }}
                />
              ) : t === 'change' ? (
                <ChangeTab chai={chai} update={update} />
              ) : t === 'loop' ? (
                <LoopTab chai={chai} />
              ) : (
                <MethodTab />
              )
            }
          </Tabs>
        </div>
      </div>
      <div className="jo-row jo-gap">
        <button
          type="button"
          className="viz-btn viz-btn--ghost"
          onClick={() => update(makeChai(), null)}
        >
          Reset the card
        </button>
      </div>
    </div>
  );
}

function ChaiCard({
  chai,
  mark,
  ghost,
  version,
}: {
  chai: Obj;
  mark: Mark;
  ghost: { key: string; value: unknown } | null;
  version: number;
}) {
  const reduced = useReducedMotion();
  const memRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  // A gentle 3D tilt that follows the pointer, like holding an ID card.
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((e.clientY - r.top) / r.height - 0.5) * -8,
      y: ((e.clientX - r.left) / r.width - 0.5) * 10,
    });
  };
  const props: HeapProp[] = Object.entries(chai).map(([key, v]) => ({
    key,
    value: show(v),
    role: mark?.key === key ? mark.role : undefined,
  }));
  if (ghost) props.push({ key: ghost.key, value: show(ghost.value), role: 'deleted' });

  return (
    <div className="viz-panel jo-memory" ref={memRef}>
      <MemoryBox name="chai" kind="const" value="" refTo="chai" refLabel="{ }" />
      <div
        className="jo-card-stage"
        onPointerMove={onMove}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      >
        <HeapCard
          key={version}
          id="chai"
          label="chai"
          typeLabel={`object · ${Object.keys(chai).length} properties`}
          props={props}
          className="jo-idcard"
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        />
      </div>
      <RefArrows container={memRef} deps={`${version}-${Object.keys(chai).length}`} />
    </div>
  );
}

function ResultBox({ r, note }: { r: ReadResult | null; note?: string }) {
  if (!r) return <p className="jo-result jo-muted">Press a button to read a property.</p>;
  return (
    <p className={`jo-result ${r.found ? 'is-found' : 'is-missing'}`} aria-live="polite">
      <code className="viz-mono">{r.code}</code> →{' '}
      <strong className="viz-mono">{show(r.value)}</strong>
      {!r.found && <span className="jo-note"> no error, just undefined</span>}
      {note && <span className="jo-note"> {note}</span>}
    </p>
  );
}

function ReadTab({ chai, onRead }: { chai: Obj; onRead: (r: ReadResult) => void }) {
  const keys = [...Object.keys(chai), ...['discount', 'field'].filter((k) => !(k in chai))];
  const [key, setKey] = useState(keys[1] ?? keys[0]);
  const [last, setLast] = useState<{ r: ReadResult; variable?: boolean } | null>(null);
  const read = (r: ReadResult, variable = false) => {
    setLast({ r, variable });
    onRead(r);
  };
  const field = 'price';
  return (
    <>
      <label className="jo-row jo-small">
        Key:
        <select className="jo-input viz-mono" value={key} onChange={(e) => setKey(e.target.value)}>
          {keys.map((k) => (
            <option key={k} value={k}>
              {k}
              {k in chai ? '' : ' (missing)'}
            </option>
          ))}
        </select>
      </label>
      <div className="jo-row jo-gap">
        <button
          type="button"
          className="viz-btn viz-mono jo-big-btn"
          onClick={() => read(readProp(chai, key, 'dot'))}
        >
          chai.{key}
        </button>
        <button
          type="button"
          className="viz-btn viz-mono jo-big-btn"
          onClick={() => read(readProp(chai, key, 'bracket'))}
        >
          chai["{key}"]
        </button>
      </div>
      <ResultBox r={last && !last.variable ? last.r : null} />

      <div className="jo-sub">
        <div className="viz-label">When the key is in a variable</div>
        <code className="viz-mono jo-small">const field = "price";</code>
        <div className="jo-row jo-gap">
          <MemoryBox
            name="field"
            kind="const"
            value={`"${field}"`}
            pulse={last?.variable && last.r.code === 'chai[field]'}
          />
          <button
            type="button"
            className="viz-btn viz-mono"
            onClick={() => read(readWithVariable(chai, field, 'bracket'), true)}
          >
            chai[field]
          </button>
          <button
            type="button"
            className="viz-btn viz-mono"
            onClick={() => read(readWithVariable(chai, field, 'dot'), true)}
          >
            chai.field
          </button>
        </div>
        {last?.variable && (
          <>
            <p className="jo-steps jo-small" aria-live="polite">
              {last.r.code === 'chai[field]' ? (
                <>
                  ① look inside <code>field</code>: it holds <strong>"price"</strong> → ② find the
                  row <code>price</code>
                </>
              ) : (
                <>
                  Dot looks for a row literally called <code>field</code>. The variable is never
                  opened.
                </>
              )}
            </p>
            <ResultBox r={last.r} />
          </>
        )}
      </div>
    </>
  );
}

function ChangeTab({
  chai,
  update,
}: {
  chai: Obj;
  update: (next: Obj, m: Mark, g?: { key: string; value: unknown } | null) => void;
}) {
  const [key, setKey] = useState('discount');
  const [text, setText] = useState('5');
  const [kind, setKind] = useState<ValueKind>('number');
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [hasKey, setHasKey] = useState('price');
  const [hasResult, setHasResult] = useState<boolean | null>(null);

  const set = () => {
    const check = checkKey(chai, key);
    if (!check.ok) {
      setError(check.reason);
      return;
    }
    const r = setProp(chai, check.key, parseValue(text, kind));
    setError('');
    setCode(
      r.added
        ? `${r.code}   // added`
        : `${r.code}   // changed: ${show(r.old)} → ${show(r.next[check.key])}`,
    );
    update(r.next, { key: check.key, role: r.added ? 'added' : 'changed' });
  };
  const remove = (k: string) => {
    const r = deleteProp(chai, k);
    setCode(`${r.code}   // returns ${r.returned}`);
    update(r.next, null, { key: k, value: chai[k] });
  };

  return (
    <>
      <div className="jo-form">
        <label className="jo-field">
          <span className="jo-small">key</span>
          <input
            className="jo-input viz-mono"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            list="jo-keys"
            maxLength={20}
          />
          <datalist id="jo-keys">
            {Object.keys(chai).map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
        </label>
        <label className="jo-field">
          <span className="jo-small">value</span>
          <input
            className="jo-input viz-mono"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={kind === 'null'}
            maxLength={30}
          />
        </label>
        <label className="jo-field">
          <span className="jo-small">type</span>
          <select
            className="jo-input"
            value={kind}
            onChange={(e) => setKind(e.target.value as ValueKind)}
          >
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
            <option value="null">null</option>
          </select>
        </label>
        <button type="button" className="viz-btn viz-btn--primary" onClick={set}>
          Set
        </button>
      </div>
      {error && <p className="jo-error jo-small">{error}</p>}
      {code && <pre className="vc-code viz-mono jo-code">{code}</pre>}

      <div className="viz-label jo-gap">Delete a property</div>
      <div className="jo-row">
        {Object.keys(chai).map((k) => (
          <button
            key={k}
            type="button"
            className="viz-btn viz-mono jo-small"
            onClick={() => remove(k)}
            aria-label={`delete chai.${k}`}
          >
            🗑 {k}
          </button>
        ))}
      </div>

      <div className="viz-label jo-gap">Has it?</div>
      <div className="jo-row">
        <input
          className="jo-input viz-mono jo-short"
          value={hasKey}
          onChange={(e) => setHasKey(e.target.value)}
          aria-label="Key to check"
          maxLength={20}
        />
        <button
          type="button"
          className="viz-btn viz-mono"
          onClick={() => setHasResult(hasProp(chai, hasKey.trim()))}
        >
          "{hasKey.trim()}" in chai
        </button>
        {hasResult !== null && (
          <strong className={`viz-mono ${hasResult ? 'jo-good' : 'jo-bad'}`} aria-live="polite">
            → {String(hasResult)}
          </strong>
        )}
      </div>
    </>
  );
}

type LoopKind = 'keys' | 'values' | 'entries';

function LoopTab({ chai }: { chai: Obj }) {
  const [kind, setKind] = useState<LoopKind | null>(null);
  const l = useMemo(() => loopHelpers(chai), [chai]); // the real Object.keys / values / entries
  const items =
    kind === 'keys'
      ? l.keys.map((k) => ({ id: `k-${k}`, label: show(k) }))
      : kind === 'values'
        ? l.values.map((v, i) => ({ id: `v-${i}`, label: show(v) }))
        : kind === 'entries'
          ? l.entries.map(([k, v]) => ({ id: `e-${k}`, label: `[${show(k)}, ${show(v)}]` }))
          : [];
  return (
    <>
      <div className="jo-row">
        {(['keys', 'values', 'entries'] as LoopKind[]).map((k) => (
          <button
            key={k}
            type="button"
            className="viz-btn viz-mono"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
          >
            Object.{k}(chai)
          </button>
        ))}
      </div>
      {kind && (
        <div className="jo-gap viz-fade" key={kind}>
          <ArrayStrip items={items} size="sm" ariaLabel={`Object.${kind}(chai)`} />
        </div>
      )}
      <div className="jo-sub">
        <pre className="vc-code viz-mono jo-small">
          {
            'for (const [key, value] of Object.entries(chai)) {\n  console.log(key + " → " + value);\n}'
          }
        </pre>
        <LoopRun key={l.entries.map(([k]) => k).join()} entries={l.entries} />
      </div>
    </>
  );
}

function LoopRun({ entries }: { entries: [string, unknown][] }) {
  const s = useStepper(entries.length + 1, 900);
  // The real string concatenation from the article's loop.
  const printed = entries.slice(0, s.index).map(([key, value]) => key + ' → ' + value);
  return (
    <>
      <div className="viz-panel vc-console jo-gap" aria-label="Console">
        <div className="viz-mono">
          {printed.length === 0 ? (
            <span className="vc-muted">(press play)</span>
          ) : (
            printed.map((p, i) => (
              <div key={i} className="vc-out">
                › {p}
              </div>
            ))
          )}
        </div>
      </div>
      <StepControls s={s} />
    </>
  );
}

function MethodTab() {
  // The real counter object, with a real method that uses `this`.
  const counter = useRef(makeCounter());
  const [count, setCount] = useState(0);
  const [calls, setCalls] = useState(0);
  const memRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <pre className="vc-code viz-mono jo-small">
        {'const counter = {\n  count: 0,\n  increment() {\n    this.count++;\n  },\n};'}
      </pre>
      <div className="viz-panel jo-memory jo-gap" ref={memRef}>
        <MemoryBox name="counter" kind="const" value="" refTo="counter" refLabel="{ }" />
        <HeapCard
          key={calls}
          id="counter"
          label="counter"
          props={[
            { key: 'count', value: String(count), role: calls ? 'changed' : undefined },
            { key: 'increment', value: 'ƒ()', role: calls ? 'read' : undefined },
          ]}
        />
        <RefArrows container={memRef} deps={calls} />
      </div>
      <div className="jo-row jo-gap">
        <button
          type="button"
          className="viz-btn viz-btn--primary viz-mono"
          onClick={() => {
            counter.current.increment(); // `this` is counter: the object before the dot
            setCount(counter.current.count);
            setCalls((c) => c + 1);
          }}
        >
          counter.increment()
        </button>
        {calls > 0 && (
          <span key={calls} className="jo-this viz-fade">
            <code>this</code> → <code>counter</code> (the object before the dot)
          </span>
        )}
      </div>
      <p className="jo-small jo-muted">
        Inside increment, <code>this.count</code> is <code>counter.count</code>, now{' '}
        <strong className="viz-mono">{count}</strong>.
      </p>
    </>
  );
}
