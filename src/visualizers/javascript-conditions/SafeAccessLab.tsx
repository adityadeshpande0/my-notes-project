import { useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from '../../lib/hooks';
import { HeapCard, MemoryBox, RefArrows } from '../core/memory';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import { show } from './lib/format';
import { Tabs } from './parts';

/**
 * #7 ?? vs ||, and the ?. path walker. Every result here is computed by
 * running the real expression, and the crash message is the one the
 * JavaScript engine itself throws (caught with try/catch), not a copy.
 */
export default function SafeAccessLab() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Safe defaults and safe paths</p>
      <p className="viz-sub">
        Compare <code>??</code> with <code>||</code>, then walk a path with and without{' '}
        <code>?.</code>.
      </p>
      <Tabs
        label="Tools"
        tabs={[
          { id: 'nullish', name: '?? vs ||' },
          { id: 'chain', name: '?. path walker' },
        ]}
      >
        {(tab) => (tab === 'nullish' ? <Showdown /> : <PathWalker />)}
      </Tabs>
    </div>
  );
}

// ─── Tab 1: ?? vs || ──────────────────────────────────────────────────

const ROW_VALUES: unknown[] = [0, '', false, null, undefined, NaN, 'Riya', 42];

function Showdown() {
  const [volume, setVolume] = useState(0);
  // The real operators, straight from the article.
  const withOr = volume || 50;
  const withNullish = volume ?? 50;

  return (
    <>
      <div className="jc-table-wrap">
        <table className="jc-table">
          <thead>
            <tr>
              <th scope="col">value</th>
              <th scope="col" className="viz-mono">
                value || "default"
              </th>
              <th scope="col" className="viz-mono">
                value ?? "default"
              </th>
            </tr>
          </thead>
          <tbody>
            {ROW_VALUES.map((v) => {
              const or = v || 'default';
              const nullish = v ?? 'default';
              const differ = !Object.is(or, nullish);
              return (
                <tr key={show(v)} className={differ ? 'is-differ' : undefined}>
                  <th scope="row" className="viz-mono">
                    {show(v)}
                  </th>
                  <td className="viz-mono">{show(or)}</td>
                  <td className="viz-mono">
                    {show(nullish)}
                    {differ && <span className="jc-differ-tag"> differs</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="jc-small jc-muted">
        Highlighted rows are where the two disagree: <code>||</code> throws away every falsy value,{' '}
        <code>??</code> only replaces <code>null</code> and <code>undefined</code>.
      </p>

      <div className="viz-label jc-gap">Settings: volume (default 50)</div>
      <label className="jc-slider">
        <span className="viz-mono">volume = {volume}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
      </label>
      <div className="viz-grid-2 jc-gap">
        <VolumeCard code="volume || 50" value={withOr} wrong={withOr !== volume} />
        <VolumeCard code="volume ?? 50" value={withNullish} wrong={withNullish !== volume} />
      </div>
    </>
  );
}

function VolumeCard({ code, value, wrong }: { code: string; value: number; wrong: boolean }) {
  return (
    <div className={`viz-panel jc-volume ${wrong ? 'is-wrong' : 'is-right'}`}>
      <code className="viz-mono">{code}</code>
      <div className="jc-volume-line">
        <span className="jc-volume-icon" aria-hidden="true">
          {value === 0 ? '🔇' : '🔊'}
        </span>
        <strong className="viz-mono jc-big">{value}</strong>
      </div>
      <span className="jc-small">
        {wrong ? '✗ Your 0 was thrown away: 0 is falsy.' : '✓ Keeps exactly what you set.'}
      </span>
    </div>
  );
}

// ─── Tab 2: the ?. path walker ────────────────────────────────────────

interface Shape {
  user: boolean;
  address: boolean;
  city: boolean;
}

/** Build the data the reader chose. Missing pieces are simply left out. */
function buildUser(shape: Shape): unknown {
  if (!shape.user) return undefined;
  if (!shape.address) return { name: 'Riya' };
  return { name: 'Riya', address: shape.city ? { city: 'Pune' } : {} };
}

const SEGMENTS = ['user', 'address', 'city'];

/** How far a walk gets: the values read at each step, until one is null/undefined. */
function walk(user: unknown) {
  const values: unknown[] = [user];
  let current: unknown = user;
  for (const key of SEGMENTS.slice(1)) {
    if (current == null) break;
    current = (current as Record<string, unknown>)[key];
    values.push(current);
  }
  return values;
}

function PathWalker() {
  const [shape, setShape] = useState<Shape>({ user: true, address: false, city: false });
  const [touched, setTouched] = useState(false);
  const set = (key: keyof Shape, on: boolean) => {
    setTouched(true);
    setShape((s) => {
      const next = { ...s, [key]: on };
      // A city can't exist without an address, or an address without a user.
      if (!next.user) next.address = false;
      if (!next.address) next.city = false;
      return next;
    });
  };
  const user = buildUser(shape);
  const memRef = useRef<HTMLDivElement>(null);
  const hasAddress = shape.user && shape.address;

  return (
    <>
      <div className="jc-row">
        <label className="jc-check viz-mono">
          <input
            type="checkbox"
            checked={shape.user}
            onChange={(e) => set('user', e.target.checked)}
          />{' '}
          user
        </label>
        <label className="jc-check viz-mono">
          <input
            type="checkbox"
            checked={shape.address}
            disabled={!shape.user}
            onChange={(e) => set('address', e.target.checked)}
          />{' '}
          user.address
        </label>
        <label className="jc-check viz-mono">
          <input
            type="checkbox"
            checked={shape.city}
            disabled={!shape.address}
            onChange={(e) => set('city', e.target.checked)}
          />{' '}
          user.address.city
        </label>
      </div>

      <div className="jc-walk-grid">
        <div className="viz-panel jc-memory" ref={memRef}>
          <div className="viz-label">Data</div>
          <div className="jc-mem-stack">
            {shape.user ? (
              <MemoryBox name="user" kind="const" value="" refTo="u" refLabel="#1" />
            ) : (
              <MemoryBox name="user" kind="let" value="undefined" />
            )}
            {shape.user && (
              <HeapCard
                id="u"
                label="#1"
                props={[
                  { key: 'name', value: '"Riya"' },
                  ...(hasAddress
                    ? [{ key: 'address', value: '', refTo: 'a', refLabel: '#2' }]
                    : []),
                ]}
              />
            )}
            {hasAddress && (
              <HeapCard
                id="a"
                label="#2"
                props={shape.city ? [{ key: 'city', value: '"Pune"' }] : []}
              />
            )}
          </div>
          <RefArrows container={memRef} deps={JSON.stringify(shape)} />
        </div>

        <WalkRun key={JSON.stringify(shape)} user={user} touched={touched} />
      </div>
    </>
  );
}

function WalkRun({ user, touched }: { user: unknown; touched: boolean }) {
  const reduced = useReducedMotion();
  const s = useStepper(SEGMENTS.length + 1, 700, {
    autoPlay: touched && !reduced,
    startAtEnd: !touched || reduced,
  });

  // Plain dot access, for real. If it throws, keep the engine's own message.
  let plain: { value?: unknown; error?: string };
  try {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    plain = { value: (user as any).address.city };
  } catch (err) {
    plain = { error: `${(err as Error).name}: ${(err as Error).message}` };
  }
  // Optional chaining, for real.
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const safe = (user as any)?.address?.city ?? 'Unknown';
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const safeChain = (user as any)?.address?.city;

  const values = walk(user);
  // Steps: 0 = not started, 1..3 = reading user, .address, .city.
  const reached = Math.min(s.index, values.length);
  const finished = s.index >= values.length || s.atEnd;
  // Did the walk stop because something was missing before the end?
  const stoppedAt = values.length < SEGMENTS.length ? values.length : null;

  return (
    <div className="jc-walks">
      <Walk
        title="user.address.city"
        values={values}
        reached={reached}
        mode="plain"
        stoppedAt={stoppedAt}
        finished={finished}
        result={
          plain.error ? (
            <span className="jc-crash">💥 {plain.error}</span>
          ) : (
            <code className="viz-mono">{show(plain.value)}</code>
          )
        }
      />
      <Walk
        title='user?.address?.city ?? "Unknown"'
        values={values}
        reached={reached}
        mode="safe"
        stoppedAt={stoppedAt}
        finished={finished}
        result={
          <span>
            {safeChain === undefined && (
              <span className="jc-muted viz-mono">undefined → ?? → </span>
            )}
            <code className="viz-mono">{show(safe)}</code>
          </span>
        }
      />
      <StepControls s={s} />
    </div>
  );
}

function Walk({
  title,
  values,
  reached,
  mode,
  stoppedAt,
  finished,
  result,
}: {
  title: string;
  values: unknown[];
  reached: number;
  mode: 'plain' | 'safe';
  stoppedAt: number | null;
  finished: boolean;
  result: ReactNode;
}) {
  return (
    <div className="viz-panel jc-walk">
      <code className="viz-mono jc-walk-title">{title}</code>
      <ol className="jc-path" aria-label="Path">
        {SEGMENTS.map((seg, i) => {
          const read = i < reached && i < values.length;
          const isStop = stoppedAt === i && finished;
          const here = read && (i === reached - 1 || i === values.length - 1) && !isStop;
          return (
            <li
              key={seg}
              className={`jc-path-node ${read ? 'is-read' : ''} ${isStop ? (mode === 'plain' ? 'is-crash' : 'is-stop') : ''}`}
            >
              <span className="viz-mono">
                {i === 0 ? seg : `${mode === 'safe' ? '?.' : '.'}${seg}`}
              </span>
              <span className="jc-path-val viz-mono">
                {isStop ? (mode === 'plain' ? '💥' : '🛑 stop') : read ? show(values[i]) : ''}
              </span>
              {here && !finished && (
                <span className="jc-walker" aria-hidden="true">
                  🚶
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <div className="jc-walk-result" aria-live="polite">
        {finished ? result : <span className="jc-muted">walking…</span>}
      </div>
      {finished && stoppedAt !== null && (
        <p className="jc-small jc-muted">
          {mode === 'plain'
            ? `${SEGMENTS.slice(0, stoppedAt).join('.')} is undefined, and you can't read .${SEGMENTS[stoppedAt]} of undefined. Crash.`
            : `${SEGMENTS.slice(0, stoppedAt).join('?.')} is undefined, so ?. stops calmly with undefined.`}
        </p>
      )}
      {finished && stoppedAt === null && values[values.length - 1] === undefined && (
        <p className="jc-small jc-muted">
          Reading a missing property just gives <code>undefined</code>. No crash: it only crashes
          when you go one step further.
        </p>
      )}
    </div>
  );
}
