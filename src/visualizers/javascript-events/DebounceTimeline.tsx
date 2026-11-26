import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useInView, useReducedMotion } from '../../lib/hooks';
import { CodeView, Tabs } from '../core/code';
import { C } from '../core/colors';
import { EventLog, useEventLog } from '../core/events';
import { debounce, throttle, type ThrottleState } from './lib/rateLimit';

/**
 * #3 DebounceTimeline: raw vs debounced vs throttled, on a timeline.
 *
 * Here the events come from React's own event props, `onChange` on the
 * search box and `onScroll` on the box, not addEventListener. Same events,
 * nicer syntax: React's onChange on a text box fires on every keystroke,
 * just like the plain DOM `input` event.
 *
 * React idea: useMemo + cleanup for things that hold timers. The debounced
 * and throttled functions are made once per delay (useMemo), and an effect's
 * cleanup cancels their timers, so nothing fires after the visual is gone.
 */
type TabId = 'typing' | 'scroll' | 'how';

export default function DebounceTimeline() {
  const [delay, setDelay] = useState(300);
  return (
    <div className="viz not-prose ev-debounce">
      <p className="viz-title">Raw vs debounced vs throttled</p>
      <div className="ev-row ev-gapb">
        <label className="ev-check" htmlFor="ev-delay">
          Delay: <strong className="viz-mono">{delay}ms</strong>
        </label>
        <input
          id="ev-delay"
          type="range"
          className="ev-range"
          min={100}
          max={1000}
          step={50}
          value={delay}
          onChange={(e) => setDelay(Number(e.target.value))}
        />
      </div>
      <Tabs<TabId>
        label="Parts of this visual"
        twoUp
        tabs={[
          { id: 'typing', name: 'Typing (search box)' },
          { id: 'scroll', name: 'Scrolling' },
          { id: 'how', name: 'How it works' },
        ]}
      >
        {(t) =>
          t === 'typing' ? (
            <TypingTab delay={delay} />
          ) : t === 'scroll' ? (
            <ScrollTab delay={delay} />
          ) : (
            <HowTab delay={delay} />
          )
        }
      </Tabs>
    </div>
  );
}

// ─── Shared: the three lanes and the timeline ────────────────────────

interface Lanes {
  raw: number[];
  deb: number[];
  thr: number[];
}
const WINDOW = 6000;

/** Keeps the time of every raw event and every real run, plus the counts. */
function useLanes() {
  const lanes = useRef<Lanes>({ raw: [], deb: [], thr: [] });
  const [counts, setCounts] = useState({ raw: 0, deb: 0, thr: 0, last: 0 });
  // useCallback with no dependencies: the same function every render, so
  // the timers made below can safely hold on to it.
  const mark = useCallback((lane: keyof Lanes) => {
    const t = performance.now();
    const list = lanes.current[lane];
    list.push(t);
    // Only the last ~6 seconds are drawn; forget older marks.
    while (list.length && list[0] < t - WINDOW - 1000) list.shift();
    setCounts((c) => ({ ...c, [lane]: c[lane] + 1, last: t }));
  }, []);
  return { lanes, counts, mark };
}

function Counters({ counts }: { counts: { raw: number; deb: number; thr: number } }) {
  const saved = counts.raw ? Math.max(0, Math.round((1 - counts.deb / counts.raw) * 100)) : 0;
  return (
    <div className="ev-counters" aria-live="polite">
      <div className="ev-counter is-raw">
        <span className="viz-label">Raw</span>
        <strong className="viz-mono">{counts.raw}</strong>
      </div>
      <div className="ev-counter is-deb">
        <span className="viz-label">Debounced</span>
        <strong className="viz-mono">{counts.deb}</strong>
      </div>
      <div className="ev-counter is-thr">
        <span className="viz-label">Throttled</span>
        <strong className="viz-mono">{counts.thr}</strong>
      </div>
      <span className="viz-counter is-done">
        <span aria-hidden="true">✂️</span> work saved by debounce:{' '}
        <strong className="viz-mono">{saved}%</strong>
      </span>
    </div>
  );
}

const LANES: { key: keyof Lanes; name: string; color: string }[] = [
  { key: 'raw', name: 'Raw events', color: C.warn },
  { key: 'deb', name: 'Debounced', color: C.active },
  { key: 'thr', name: 'Throttled', color: C.accent },
];

/**
 * The last 6 seconds, scrolling left. It animates with requestAnimationFrame
 * only while something happened recently AND it's on screen; otherwise it
 * stops. Under reduced motion it doesn't scroll: it redraws once a second.
 */
function Timeline({ lanes, last }: { lanes: Lanes; last: number }) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const visible = useInView(box);
  const [now, setNow] = useState(() => last);

  useEffect(() => {
    if (!visible) return;
    if (reduced) {
      const id = window.setInterval(() => setNow(performance.now()), 1000);
      // Draw once straight away too (inside a callback, not during the effect itself).
      const first = requestAnimationFrame(() => setNow(performance.now()));
      return () => {
        clearInterval(id);
        cancelAnimationFrame(first);
      };
    }
    let frame = 0;
    const loop = () => {
      const t = performance.now();
      setNow(t);
      // Keep going until everything has scrolled off the left edge.
      if (t - last < WINDOW + 1500) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [last, visible, reduced]);

  const W = 600;
  const LANE = 34;
  const x = (t: number) => W - ((now - t) / WINDOW) * W;
  const recent = (list: number[]) => list.filter((t) => now - t <= WINDOW);
  return (
    <div ref={box} className="ev-timeline">
      <svg
        viewBox={`0 0 ${W} ${LANE * 3 + 18}`}
        role="img"
        aria-label="Timeline of the last 6 seconds"
      >
        {LANES.map((l, i) => {
          const y = i * LANE + LANE / 2;
          return (
            <g key={l.key}>
              <line x1={0} x2={W} y1={y} y2={y} style={{ stroke: C.border }} />
              <text x={4} y={y - 8} style={{ fill: C.muted, fontSize: 11 }}>
                {l.name}
              </text>
              {recent(lanes[l.key]).map((t, k) =>
                l.key === 'raw' ? (
                  <line
                    key={k}
                    x1={x(t)}
                    x2={x(t)}
                    y1={y - 9}
                    y2={y + 9}
                    style={{ stroke: l.color, strokeWidth: 2 }}
                  />
                ) : (
                  <circle key={k} cx={x(t)} cy={y} r={6} style={{ fill: l.color }} />
                ),
              )}
            </g>
          );
        })}
        <text x={W - 4} y={LANE * 3 + 14} textAnchor="end" style={{ fill: C.muted, fontSize: 11 }}>
          now
        </text>
        <text x={4} y={LANE * 3 + 14} style={{ fill: C.muted, fontSize: 11 }}>
          6 seconds ago
        </text>
      </svg>
      <p className="sr-only">
        In the last 6 seconds: {recent(lanes.raw).length} raw events, {recent(lanes.deb).length}{' '}
        debounced runs and {recent(lanes.thr).length} throttled runs.
      </p>
    </div>
  );
}

// ─── Tab: Typing ─────────────────────────────────────────────────────

const SNACKS = [
  'Masala Chai',
  'Ginger Chai',
  'Cutting Chai',
  'Filter Coffee',
  'Lassi',
  'Mango Lassi',
  'Nimbu Pani',
  'Jaljeera',
  'Aam Panna',
  'Coconut Water',
  'Badam Milk',
  'Thandai',
  'Rose Sharbat',
  'Kokum Sherbet',
  'Buttermilk',
  'Sugarcane Juice',
  'Samosa',
  'Kachori',
  'Vada Pav',
  'Pav Bhaji',
  'Pani Puri',
  'Bhel Puri',
  'Sev Puri',
  'Dahi Puri',
  'Aloo Tikki',
  'Dhokla',
  'Khandvi',
  'Idli',
  'Medu Vada',
  'Masala Dosa',
  'Uttapam',
  'Pakora',
  'Onion Bhaji',
  'Murukku',
  'Banana Chips',
  'Jalebi',
  'Gulab Jamun',
  'Rasgulla',
  'Kulfi',
  'Mysore Pak',
];
const search = (text: string) => {
  const q = text.trim().toLowerCase();
  return q ? SNACKS.filter((s) => s.toLowerCase().includes(q)) : [];
};

function TypingTab({ delay }: { delay: number }) {
  const { lanes, counts, mark } = useLanes();
  const [text, setText] = useState('');
  const [results, setResults] = useState({ raw: 0, deb: [] as string[], thr: 0 });
  const [searching, setSearching] = useState(false);
  const log = useEventLog();
  const { push } = log;

  const limited = useMemo(
    () => ({
      deb: debounce((q: string) => {
        const found = search(q);
        mark('deb');
        setSearching(false);
        setResults((r) => ({ ...r, deb: found }));
        push({
          type: 'debounced',
          category: 'form',
          detail: `search(${JSON.stringify(q)}) → ${found.length} results`,
        });
      }, delay),
      thr: throttle((q: string) => {
        mark('thr');
        setResults((r) => ({ ...r, thr: search(q).length }));
        push({ type: 'throttled', category: 'mouse', detail: `search(${JSON.stringify(q)})` });
      }, delay),
    }),
    [delay, mark, push],
  );
  // Cancel any planned call when the delay changes or the tab closes.
  useEffect(() => () => (limited.deb.cancel(), limited.thr.cancel()), [limited]);

  return (
    <>
      <div className="ev-search">
        <input
          className="ev-input"
          value={text}
          placeholder="Search snacks: try “chai” or “puri”"
          aria-label="Search snacks"
          autoComplete="off"
          // React's onChange = the plain DOM "input" event: once per keystroke.
          onChange={(e) => {
            const q = e.target.value;
            setText(q);
            mark('raw');
            setResults((r) => ({ ...r, raw: search(q).length }));
            setSearching(true);
            limited.deb(q);
            limited.thr(q);
          }}
        />
        {searching && <span className="ev-spinner">🔍 searching…</span>}
      </div>
      <Timeline lanes={lanes.current} last={counts.last} />
      <Counters counts={counts} />
      <div className="ev-split ev-gap">
        <div className="viz-panel">
          <div className="viz-label">Debounced results (update when you pause)</div>
          {results.deb.length ? (
            <ul className="ev-results">
              {results.deb.slice(0, 8).map((r) => (
                <li key={r}>{r}</li>
              ))}
              {results.deb.length > 8 && (
                <li className="ev-muted">+{results.deb.length - 8} more</li>
              )}
            </ul>
          ) : (
            <p className="ev-small ev-muted">{text ? 'No matches (yet).' : 'Type to search.'}</p>
          )}
          <p className="ev-small ev-muted">
            A raw search would have run <strong>{counts.raw}</strong> times; debounced, it ran{' '}
            <strong>{counts.deb}</strong>.
          </p>
        </div>
        <EventLog
          rows={log.rows}
          onClear={log.clear}
          label="Real runs"
          height="11rem"
          empty="Type in the box above."
        />
      </div>
    </>
  );
}

// ─── Tab: Scrolling ──────────────────────────────────────────────────

const STRIP = Array.from({ length: 48 }, (_, i) => {
  const items = [
    '☕ chai',
    '🥟 samosa',
    '🍮 jalebi',
    '🥥 coconut',
    '🌶️ chutney',
    '🍋 nimbu pani',
    '🥔 tikki',
    '🍡 jamun',
  ];
  return `${i + 1}. ${items[i % items.length]}`;
});

function ScrollTab({ delay }: { delay: number }) {
  const { lanes, counts, mark } = useLanes();
  const [progress, setProgress] = useState(0);
  const [stoppedAt, setStoppedAt] = useState<number | null>(null);
  const limited = useMemo(
    () => ({
      deb: debounce((p: number) => {
        mark('deb');
        setStoppedAt(p);
      }, delay),
      thr: throttle((p: number) => {
        mark('thr');
        setProgress(p); // the bar moves on throttled calls only
      }, delay),
    }),
    [delay, mark],
  );
  useEffect(() => () => (limited.deb.cancel(), limited.thr.cancel()), [limited]);

  return (
    <>
      <div className="ev-scrollwrap">
        <div className="ev-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div
          className="ev-scrollbox"
          tabIndex={0}
          role="region"
          aria-label="A long, scrollable list (scroll it with the mouse, or focus it and use the arrow keys)"
          // React's onScroll: the plain DOM "scroll" event, on this box only.
          onScroll={(e) => {
            const el = e.currentTarget;
            const p = Math.round(
              (el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight)) * 100,
            );
            mark('raw');
            limited.deb(p);
            limited.thr(p);
          }}
        >
          {STRIP.map((s) => (
            <p key={s}>{s}</p>
          ))}
        </div>
      </div>
      <p className="ev-small" aria-live="polite">
        Progress bar (throttled): <strong className="viz-mono">{progress}%</strong>
        {stoppedAt !== null && (
          <>
            {' '}
            · scrolling stopped at <strong className="viz-mono">{stoppedAt}%</strong> (debounced)
          </>
        )}
      </p>
      <Timeline lanes={lanes.current} last={counts.last} />
      <Counters counts={counts} />
      <p className="ev-note">
        Updating the bar on every raw event would have meant <strong>{counts.raw}</strong> updates.
        Throttled, it took <strong>{counts.thr}</strong>, and it still looks smooth.
      </p>
    </>
  );
}

// ─── Tab: How it works ───────────────────────────────────────────────

const DEBOUNCE_CODE = [
  'function debounce(fn, delay) {',
  '  let timer; // remembered by the closure 🎒',
  '  return (...args) => {',
  '    clearTimeout(timer); // cancel the previous plan',
  '    timer = setTimeout(() => fn(...args), delay); // plan again',
  '  };',
  '}',
];
type Card = { n: number; status: 'pending' | 'shredded' | 'fired' };

function HowTab({ delay }: { delay: number }) {
  const reduced = useReducedMotion();
  const [cards, setCards] = useState<Card[]>([]);
  const [line, setLine] = useState<number | null>(null);
  const [runs, setRuns] = useState(0);
  const [thr, setThr] = useState<{ state: ThrottleState; runs: number; presses: number }>({
    state: 'ready',
    runs: 0,
    presses: 0,
  });
  const n = useRef(0);

  // The REAL debounce, with hooks that only report what it's doing.
  const deb = useMemo(
    () =>
      debounce(
        () => {
          setCards((cs) => cs.map((c) => (c.status === 'pending' ? { ...c, status: 'fired' } : c)));
          setRuns((r) => r + 1);
          setLine(4);
        },
        delay,
        {
          onClear: () =>
            setCards((cs) =>
              cs.map((c) => (c.status === 'pending' ? { ...c, status: 'shredded' } : c)),
            ),
          onSchedule: () =>
            setCards((cs) => [...cs.slice(-4), { n: ++n.current, status: 'pending' }]),
        },
      ),
    [delay],
  );
  const thro = useMemo(
    () =>
      throttle(() => setThr((t) => ({ ...t, runs: t.runs + 1 })), delay, {
        onState: (state) => setThr((t) => ({ ...t, state })),
      }),
    [delay],
  );
  useEffect(() => () => (deb.cancel(), thro.cancel()), [deb, thro]);

  const pending = cards.find((c) => c.status === 'pending');

  return (
    <div className="ev-split">
      <div>
        <CodeView
          label="debounce"
          lines={DEBOUNCE_CODE.map((text, i) => ({ text, state: line === i ? 'on' : undefined }))}
        />
        <div className="ev-row ev-gap">
          <button
            type="button"
            className="viz-btn viz-btn--primary"
            onClick={() => {
              setLine(pending ? 3 : 4);
              deb();
            }}
          >
            ⌨️ Type a letter
          </button>
          <span className="ev-small ev-muted">
            fn has run <strong>{runs}</strong> time{runs === 1 ? '' : 's'}
          </span>
        </div>
        <div className="ev-backpack" aria-live="polite">
          <span className="viz-label">🎒 the closure’s backpack</span>
          <code className="viz-mono">
            timer = {pending ? `timer #${pending.n} (waiting)` : 'nothing planned'}
          </code>
        </div>
        <ul className="ev-cards" aria-label="Planned timers">
          {cards.map((c) => (
            <li key={c.n} className={`ev-card is-${c.status}`}>
              <span
                className="ev-ring"
                aria-hidden="true"
                style={{ '--ms': `${delay}ms` } as CSSProperties}
                data-static={reduced || undefined}
              />
              <span className="viz-mono">setTimeout #{c.n}</span>
              <span className="ev-small">
                {c.status === 'pending'
                  ? `fires in ${delay}ms…`
                  : c.status === 'shredded'
                    ? '✂️ cleared'
                    : '✓ fn ran!'}
              </span>
            </li>
          ))}
          {!cards.length && (
            <li className="ev-small ev-muted">
              Press “Type a letter” a few times quickly, then stop.
            </li>
          )}
        </ul>
      </div>
      <div>
        <div className="viz-panel">
          <div className="viz-label">Throttle, for comparison</div>
          <p className="ev-small">
            Runs straight away, then cools down for {delay}ms. Presses while cooling down are saved:
            the last one runs when the time is up.
          </p>
          <div className="ev-row">
            <button
              type="button"
              className="viz-btn"
              onClick={() => (setThr((t) => ({ ...t, presses: t.presses + 1 })), thro())}
            >
              Fire an event
            </button>
            <span
              className={`ev-badge ${thr.state === 'ready' ? 'is-good' : 'is-warn'}`}
              aria-live="polite"
            >
              {thr.state === 'ready' ? '● ready' : `⏳ cooling down ${delay}ms`}
            </span>
          </div>
          <p className="ev-small ev-muted">
            {thr.presses} presses → fn ran {thr.runs} time{thr.runs === 1 ? '' : 's'}
          </p>
          <p className="ev-small ev-muted">
            * This throttle also makes one “trailing” call at the end of a cool-down if events came
            in meanwhile, so the final value is never lost.
          </p>
        </div>
      </div>
    </div>
  );
}
