import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from '../../lib/hooks';
import { CodeView, Tabs } from '../core/code';
import { EventLog, useEventLog, type EventRow } from '../core/events';
import LiveDomSandbox, { type Sandbox } from '../core/sandbox/LiveDomSandbox';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import { tagOf } from './lib/describe';
import { createListenerBag } from './lib/listeners';
import { predictCalls, type Call, type NodeListeners, type Phase } from './lib/propagation';
import { CARD_PAGE, EVENTS_CSS, MENU_PAGE, SNACKS, snackItem, TOWER_PAGE } from './lib/templates';
import Stage from './Stage';
import { useFlash } from './useFlash';

/**
 * #2 BubblingTower: down, then back up. Real click listeners sit on the
 * mini page's elements; each one writes down what really happened
 * (eventPhase, target, currentTarget). The replay is drawn from that
 * recording, not from a script, and lib/propagation.ts predicts the same
 * order (checked by its tests, and shown live in the badge).
 *
 * React idea: useStepper replays a recording. The click happens instantly in
 * the browser; React state just remembers it, and the stepper walks through
 * it slowly. Giving the replay a `key` per click restarts it from step 1.
 */
type TabId = 'journey' | 'bug' | 'delegation';

export default function BubblingTower() {
  return (
    <div className="viz not-prose ev-tower">
      <p className="viz-title">Down, then back up</p>
      <Tabs<TabId>
        label="Parts of this visual"
        twoUp
        tabs={[
          { id: 'journey', name: 'The journey' },
          { id: 'bug', name: 'A bubbling bug' },
          { id: 'delegation', name: 'Delegation' },
        ]}
      >
        {(t) => (t === 'journey' ? <JourneyTab /> : t === 'bug' ? <BugTab /> : <DelegationTab />)}
      </Tabs>
    </div>
  );
}

// ─── Tab: The journey ────────────────────────────────────────────────

const NODES = ['document', 'grandparent', 'parent', 'child'] as const;
type NodeName = (typeof NODES)[number] | 'background';
const LABEL: Record<NodeName, string> = {
  document: 'document',
  grandparent: 'Café (div.grandparent)',
  parent: 'Table 4 (div.parent)',
  child: '☕ Order (button)',
  background: 'the page background',
};
const SHORT: Record<NodeName, string> = {
  document: 'document',
  grandparent: 'Café',
  parent: 'Table 4',
  child: '☕ Order',
  background: 'background',
};

interface Recorded extends Call {
  stopped: boolean;
}
interface Trip {
  id: number;
  target: NodeName;
  /** Outermost first, ending at the target. */
  path: NodeName[];
  calls: Recorded[];
  matchesModel: boolean;
}
interface Step {
  node: NodeName;
  phase: 'capture' | 'target' | 'bubble';
  calls: Recorded[];
}

const OFF: NodeListeners = { capture: false, bubble: false, stop: false };
const START: Record<string, NodeListeners> = Object.fromEntries(
  NODES.map((n) => [n, { ...OFF, bubble: true }]),
);

function JourneyTab() {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [settings, setSettings] = useState(START);
  const [trip, setTrip] = useState<Trip | null>(null);
  const onReady = useCallback((sb: Sandbox) => setRoot(sb.root), []);

  useEffect(() => {
    if (!root) return;
    const el = (n: (typeof NODES)[number]) =>
      n === 'document' ? root : root.querySelector<HTMLElement>(`[data-name="${n}"]`)!;
    const nameOf = (t: EventTarget | null): NodeName =>
      t === root
        ? 'document'
        : (((t as HTMLElement | null)?.dataset?.name as NodeName | undefined) ?? 'background');
    const bag = createListenerBag();
    let current: Trip | null = null;
    let id = 0;

    // A quiet helper ABOVE the mini page (on its shadow root) notes the start
    // of each click. It's not part of the demo: it just opens a new recording.
    const shadow = root.getRootNode();
    bag.add(
      shadow,
      'click',
      (e) => {
        const target = nameOf(e.target);
        const path: NodeName[] = [];
        for (let n: HTMLElement | null = e.target as HTMLElement; n; n = n.parentElement) {
          const name = nameOf(n);
          if (n === e.target || name !== 'background') path.unshift(name);
          if (n === root) break;
        }
        const trip: Trip = { id: ++id, target, path, calls: [], matchesModel: true };
        current = trip;
        // Once the browser has finished the whole journey, hand the recording to React.
        setTimeout(() => {
          trip.matchesModel =
            JSON.stringify(
              trip.calls.map(({ node, phase, listener }) => ({ node, phase, listener })),
            ) === JSON.stringify(predictCalls(trip.path, settings));
          setTrip(trip);
        });
      },
      { capture: true },
    );

    // The real listeners: one per element per switched-on phase.
    for (const n of NODES) {
      const s = settings[n];
      for (const listener of ['capture', 'bubble'] as const) {
        if (!s[listener]) continue;
        bag.add(
          el(n),
          'click',
          (e) => {
            current?.calls.push({
              node: nameOf(e.currentTarget),
              phase: e.eventPhase as Phase,
              listener,
              stopped: s.stop,
            });
            if (s.stop) e.stopPropagation();
          },
          { capture: listener === 'capture' },
        );
      }
    }
    return () => bag.removeAll(); // every listener off: on toggle change, Reset and unmount
  }, [root, settings]);

  const set = (n: string, k: keyof NodeListeners, v: boolean) =>
    setSettings((s) => ({ ...s, [n]: { ...s[n], [k]: v } }));
  const clickEl = (n: (typeof NODES)[number]) => {
    if (!root) return;
    (n === 'document' ? root : root.querySelector<HTMLElement>(`[data-name="${n}"]`))?.click();
  };

  return (
    <>
      <div className="ev-split">
        <div>
          <LiveDomSandbox
            template={TOWER_PAGE}
            onReady={onReady}
            css={EVENTS_CSS}
            address="cafe.html"
          />
          <div className="ev-row ev-gap" role="group" aria-label="Click with the keyboard">
            <span className="ev-small ev-muted">Or run el.click() on:</span>
            {(['child', 'parent', 'grandparent'] as const).map((n) => (
              <button key={n} type="button" className="viz-btn" onClick={() => clickEl(n)}>
                {SHORT[n]}
              </button>
            ))}
          </div>
          <p className="ev-note">
            Tip: click the padding of “Table 4” (not the button) and the journey gets shorter.
          </p>
        </div>
        <div>
          <table className="ev-settings">
            <caption className="viz-label">Listeners (all for “click”)</caption>
            <thead>
              <tr>
                <th scope="col">Element</th>
                <th scope="col">capture ↓</th>
                <th scope="col">bubble ↑</th>
                <th scope="col">
                  stop
                  <wbr />
                  Propagation()
                </th>
              </tr>
            </thead>
            <tbody>
              {NODES.map((n) => (
                <tr key={n}>
                  <th scope="row">{SHORT[n]}</th>
                  {(['capture', 'bubble', 'stop'] as const).map((k) => (
                    <td key={k}>
                      <input
                        type="checkbox"
                        aria-label={`${SHORT[n]}: ${k === 'stop' ? 'stopPropagation' : `listen in ${k}`}`}
                        checked={settings[n][k]}
                        onChange={(e) => set(n, k, e.target.checked)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {NODES.some((n) => settings[n].stop && !settings[n].capture && !settings[n].bubble) && (
            <p className="ev-note ev-warn">
              stopPropagation() only runs inside a listener: switch one on for that element too.
            </p>
          )}
        </div>
      </div>
      {trip ? (
        <Replay key={trip.id} trip={trip} root={root} />
      ) : (
        <p className="ev-callout ev-gap">
          Click anything in the café to send a click on its journey.
        </p>
      )}
    </>
  );
}

function stepsOf(trip: Trip): { steps: Step[]; stopAt: number | null } {
  const outer = trip.path.slice(0, -1);
  const raw: Step[] = [
    ...outer.map((node) => ({ node, phase: 'capture' as const, calls: [] as Recorded[] })),
    { node: trip.target, phase: 'target', calls: [] },
    ...[...outer]
      .reverse()
      .map((node) => ({ node, phase: 'bubble' as const, calls: [] as Recorded[] })),
  ];
  const phaseOf: Record<Phase, Step['phase']> = { 1: 'capture', 2: 'target', 3: 'bubble' };
  for (const c of trip.calls)
    raw.find((s) => s.node === c.node && s.phase === phaseOf[c.phase])?.calls.push(c);
  const stopAt = raw.findIndex((s) => s.calls.some((c) => c.stopped));
  return {
    steps: stopAt >= 0 ? raw.slice(0, stopAt + 1) : raw,
    stopAt: stopAt >= 0 ? stopAt : null,
  };
}

const PATH_ROWS: (NodeName | 'window' | 'html' | 'body')[] = [
  'window',
  'document',
  'html',
  'body',
  'grandparent',
  'parent',
  'child',
];

function Replay({ trip, root }: { trip: Trip; root: HTMLElement | null }) {
  const reduced = useReducedMotion();
  const { steps, stopAt } = useMemo(() => stepsOf(trip), [trip]);
  const s = useStepper(steps.length, 1000, { autoPlay: !reduced, startAtEnd: reduced });
  const step = steps[s.index];
  const stopped = stopAt !== null && s.index === stopAt;

  // Light up the real element for this step (classes on the mini page's own elements).
  useEffect(() => {
    if (!root) return;
    const named = [root, ...root.querySelectorAll<HTMLElement>('[data-name]')];
    const all = ['is-capture', 'is-target', 'is-bubble', 'is-wall', 'is-unreached'];
    named.forEach((el) => el.classList.remove(...all));
    const el =
      step.node === 'document'
        ? root
        : root.querySelector<HTMLElement>(`[data-name="${step.node}"]`);
    if (el && step.node !== 'document') el.classList.add(stopped ? 'is-wall' : `is-${step.phase}`);
    return () => named.forEach((n) => n.classList.remove(...all));
  }, [root, step, stopped]);

  const rows: EventRow[] = steps
    .slice(0, s.index + 1)
    .flatMap((st) => st.calls)
    .map((c, i) => ({
      id: i,
      t: i,
      stamp: `#${i + 1}`,
      type: 'click',
      target: `currentTarget: ${SHORT[c.node as NodeName]}`,
      detail: `eventPhase ${c.phase} (${c.phase === 1 ? 'capture' : c.phase === 2 ? 'at target' : 'bubble'}) · target: ${SHORT[trip.target]}${c.stopped ? ' · stopPropagation()' : ''}`,
      tone: c.stopped ? ('stopped' as const) : undefined,
    }))
    .reverse();

  const ranHere = step.calls.length > 0;
  const onTrip = (n: string) => trip.path.includes(n as NodeName);
  const unreached = (n: string, phase: Step['phase']) =>
    stopAt !== null && onTrip(n) && !steps.some((st) => st.node === n && st.phase === phase);

  return (
    <div className="ev-replay ev-gap">
      <div className="ev-split">
        <div>
          <div
            className="ev-path"
            role="img"
            aria-label={`The click's path: down from window to ${SHORT[trip.target]}, then back up.`}
          >
            <span className="ev-path-head">capture ↓</span>
            <span className="ev-path-head" />
            <span className="ev-path-head">bubble ↑</span>
            {PATH_ROWS.map((n) => {
              const isTarget =
                n === trip.target || (n === 'child' && trip.target === 'background' && false);
              const here = (phase: Step['phase']) => step.node === n && step.phase === phase;
              const cell = (phase: 'capture' | 'bubble') => {
                const at = isTarget ? here('target') : here(phase);
                const done = steps
                  .slice(0, s.index + 1)
                  .some(
                    (st) =>
                      st.node === n && (st.phase === phase || (isTarget && st.phase === 'target')),
                  );
                return (
                  <span
                    className={`ev-path-cell ${at ? (stopped ? 'is-wall' : `is-${isTarget ? 'target' : phase}`) : done ? 'is-done' : ''} ${unreached(n, phase) ? 'is-unreached' : ''}`}
                  >
                    {at
                      ? stopped
                        ? '🧱'
                        : '●'
                      : unreached(n, phase)
                        ? 'never reached'
                        : done
                          ? '·'
                          : ''}
                  </span>
                );
              };
              return (
                <div
                  key={n}
                  className={`ev-path-row ${onTrip(n) ? '' : 'is-faded'} ${isTarget ? 'is-target-row' : ''}`}
                >
                  {cell('capture')}
                  <span className="ev-path-node viz-mono">
                    {n === 'window' || n === 'html' || n === 'body' ? n : SHORT[n as NodeName]}
                    {isTarget && ' 🎯'}
                  </span>
                  {cell('bubble')}
                </div>
              );
            })}
          </div>
          <p className="ev-note">
            window, html and body have no listeners in this demo; the click passes through them
            anyway.
          </p>
        </div>
        <div>
          <div className="ev-targets" aria-live="polite">
            <div className="ev-target-badge is-pinned">
              <span className="viz-label">event.target 📌</span>
              <strong className="viz-mono">{LABEL[trip.target]}</strong>
            </div>
            <div className="ev-target-badge">
              <span className="viz-label">event.currentTarget</span>
              <strong className="viz-mono">
                {ranHere ? LABEL[step.node] : `(no listener on ${SHORT[step.node]})`}
              </strong>
            </div>
          </div>
          <p className="ev-small ev-muted">
            target = where it started. currentTarget = whose listener is running now.
          </p>
          <p className="viz-caption">
            {stopped
              ? `🧱 stopPropagation() at ${SHORT[step.node]}: the journey ends here. Every later stop is never reached.`
              : step.phase === 'capture'
                ? `Capture: travelling down through ${SHORT[step.node]}${ranHere ? ', where a capture listener runs.' : ' (no capture listener here).'}`
                : step.phase === 'target'
                  ? `Target: the click arrives at ${SHORT[step.node]}${ranHere ? ` and ${step.calls.length} listener${step.calls.length > 1 ? 's run' : ' runs'}.` : ' (no listener on it).'}`
                  : `Bubble: rising back up through ${SHORT[step.node]}${ranHere ? ', where a bubble listener runs.' : ' (no bubble listener here).'}`}
          </p>
          <span className={`ev-badge ${trip.matchesModel ? 'is-good' : 'is-bad'}`}>
            {trip.matchesModel
              ? '✓ The real order matches the model'
              : '✗ The real order differs from the model'}
          </span>
        </div>
      </div>
      <StepControls s={s} />
      <EventLog
        rows={rows}
        label={`Listeners that ran (${trip.calls.length} in total)`}
        empty="No listener has run yet."
        height="12rem"
      />
    </div>
  );
}

// ─── Tab: A bubbling bug ─────────────────────────────────────────────

type Fix = 'none' | 'stop' | 'closest';
const BUG_CODE: Record<Fix, string[]> = {
  none: [
    'card.addEventListener("click", () => openDetails());',
    'like.addEventListener("click", () => toggleLike());',
    '// 🐞 Clicking Like ALSO opens the details: the click bubbles up to the card.',
  ],
  stop: [
    'card.addEventListener("click", () => openDetails());',
    'like.addEventListener("click", (e) => {',
    '  e.stopPropagation(); // fix 1: stop the click here',
    '  toggleLike();',
    '});',
  ],
  closest: [
    'card.addEventListener("click", (e) => {',
    '  if (e.target.closest(".like")) return; // fix 2: ignore clicks on Like',
    '  openDetails();',
    '});',
    'like.addEventListener("click", () => toggleLike());',
  ],
};

function BugTab() {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [fix, setFix] = useState<Fix>('none');
  const log = useEventLog();
  const { push } = log;
  const flash = useFlash();
  const { show } = flash;
  const onReady = useCallback((sb: Sandbox) => setRoot(sb.root), []);

  useEffect(() => {
    if (!root) return;
    const bag = createListenerBag();
    const card = root.querySelector('.product')!;
    const like = root.querySelector<HTMLElement>('.like')!;
    let said: string[] = [];
    const say = (m: string) => {
      // Collect what one click did, then show it all together.
      if (!said.length)
        setTimeout(() => {
          show({ toast: said.length > 1 ? `${said.join('  +  ')}  😬 both ran!` : said[0] });
          said = [];
        });
      said.push(m);
    };
    bag.add(card, 'click', (e) => {
      if (fix === 'closest' && (e.target as Element).closest('.like')) {
        push({
          type: 'click',
          target: 'card handler',
          detail: 'e.target.closest(".like") found Like: return early',
          tone: 'muted',
        });
        return;
      }
      push({
        type: 'click',
        target: 'card handler',
        detail: `openDetails() · target: ${tagOf(e.target)}`,
      });
      say('📄 Opening details…');
    });
    bag.add(like, 'click', (e) => {
      if (fix === 'stop') e.stopPropagation();
      like.classList.toggle('on');
      push({
        type: 'click',
        target: 'like handler',
        detail: fix === 'stop' ? 'toggleLike() + stopPropagation()' : 'toggleLike()',
      });
      say(like.classList.contains('on') ? '♥ Liked!' : '♡ Unliked');
    });
    return () => bag.removeAll();
  }, [root, fix, push, show]);

  return (
    <div className="ev-split">
      <div>
        <Stage flash={flash.state}>
          <LiveDomSandbox
            template={CARD_PAGE}
            onReady={onReady}
            css={EVENTS_CSS}
            address="menu.html"
          />
        </Stage>
        <p className="ev-note">The whole card is clickable (it opens details). Now press ♥ Like…</p>
      </div>
      <div>
        <div role="radiogroup" aria-label="Fix" className="ev-btns">
          {(
            [
              ['none', '🐞 No fix'],
              ['stop', 'Fix 1: stopPropagation()'],
              ['closest', 'Fix 2: check e.target'],
            ] as [Fix, string][]
          ).map(([id, name]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={fix === id}
              aria-pressed={fix === id}
              className="viz-btn"
              onClick={() => setFix(id)}
            >
              {name}
            </button>
          ))}
        </div>
        <CodeView
          label="The handlers"
          lines={BUG_CODE[fix].map((text) => ({
            text,
            state: /fix|🐞/.test(text) ? 'on' : undefined,
          }))}
        />
        <p className="ev-note">
          Fix 2 is usually better: the click still bubbles, so other code that relies on it (like
          “close the menu when you click outside”) keeps working.
        </p>
        <EventLog rows={log.rows} onClear={log.clear} height="9rem" />
      </div>
    </div>
  );
}

// ─── Tab: Delegation ─────────────────────────────────────────────────

type Mode = 'each' | 'delegate';
const DELEGATE_CODE: Record<Mode, string[]> = {
  each: [
    '// one listener per item (new items won’t have one!)',
    'document.querySelectorAll(".item").forEach((item) => {',
    '  item.addEventListener("click", handleItem);',
    '});',
  ],
  delegate: [
    '// one listener on the parent handles every item, even future ones',
    'menu.addEventListener("click", (e) => {',
    '  const item = e.target.closest(".item"); // the clicked item (or null)',
    '  if (!item) return; // the click wasn’t on an item',
    '  console.log("You picked " + item.dataset.name);',
    '});',
  ],
};

function DelegationTab() {
  const reduced = useReducedMotion();
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [mode, setMode] = useState<Mode>('each');
  const [resetKey, setResetKey] = useState(0);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState(4);
  const [walk, setWalk] = useState<{
    id: number;
    steps: [string, boolean][];
    found: boolean;
  } | null>(null);
  const walkId = useRef(0);
  const log = useEventLog();
  const { push } = log;
  const onReady = useCallback((sb: Sandbox) => {
    setRoot(sb.root);
    setItems(4);
  }, []);

  useEffect(() => {
    if (!root) return;
    const bag = createListenerBag();
    const menu = root.querySelector('#menu')!;
    const handled = new WeakSet<Event>();
    const pick = (li: Element) => {
      root.querySelectorAll('.picked').forEach((x) => x.classList.remove('picked'));
      li.classList.add('picked');
    };
    if (mode === 'each') {
      // Only the items that exist RIGHT NOW get a listener.
      menu.querySelectorAll('.item').forEach((item) =>
        bag.add(item, 'click', (e) => {
          handled.add(e);
          pick(item);
          push({
            type: 'click',
            target: tagOf(item),
            detail: `You picked ${(item as HTMLElement).dataset.name}`,
          });
        }),
      );
    } else {
      bag.add(menu, 'click', (e) => {
        handled.add(e);
        // Walk up from the clicked element, just as closest() does, and draw each step.
        const steps: [string, boolean][] = [];
        for (let el: Element | null = e.target as Element; el; el = el.parentElement) {
          const ok = el.matches('.item');
          steps.push([tagOf(el), ok]);
          if (ok || el === root) break;
        }
        const item = (e.target as Element).closest('.item');
        if (!item) steps.push(['…up to the top', false]);
        setWalk({ id: ++walkId.current, steps, found: !!item });
        if (!item) {
          push({
            type: 'click',
            target: tagOf(menu),
            detail: 'closest(".item") → null, so return early',
            tone: 'muted',
          });
          return;
        }
        pick(item);
        push({
          type: 'click',
          target: tagOf(menu),
          detail: `You picked ${(item as HTMLElement).dataset.name} (target was ${tagOf(e.target)})`,
        });
      });
    }
    setCount(bag.count()); // eslint-disable-line react-hooks/set-state-in-effect
    // A helper (not counted, not part of the lesson) that notices clicks on an item no listener handled.
    const spy = (e: Event) => {
      const li = (e.target as Element).closest('.item');
      if (!li || handled.has(e)) return;
      li.classList.add('dud');
      setTimeout(() => li.classList.remove('dud'), 900);
      push({
        type: 'click',
        target: tagOf(li),
        detail: '😶 no listener! Nothing happens.',
        tone: 'stopped',
      });
    };
    root.addEventListener('click', spy);
    return () => {
      bag.removeAll();
      root.removeEventListener('click', spy);
    };
  }, [root, mode, push]);

  const addItem = () => {
    const menu = root?.querySelector('#menu');
    if (!menu || items >= SNACKS.length) return;
    // A trusted template string, written by us.
    menu.insertAdjacentHTML('beforeend', snackItem(SNACKS[items]));
    setItems((n) => n + 1);
    push({
      type: 'append',
      target: '<ul#menu>',
      detail: `added ${SNACKS[items][1]} (no listener attached to it)`,
      category: 'other',
    });
  };

  return (
    <div className="ev-split">
      <div>
        <div role="radiogroup" aria-label="How the clicks are handled" className="viz-seg ev-gapb">
          {(
            [
              ['each', 'A listener on every item'],
              ['delegate', 'One listener on the list'],
            ] as [Mode, string][]
          ).map(([id, name]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={mode === id}
              aria-pressed={mode === id}
              className="viz-seg-btn"
              onClick={() => {
                setMode(id);
                setWalk(null);
                setResetKey((k) => k + 1); // a fresh page with 4 items
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <LiveDomSandbox
          template={MENU_PAGE}
          resetKey={resetKey}
          onReady={onReady}
          css={EVENTS_CSS}
          address="snacks.html"
        />
        <div className="ev-row ev-gap">
          <span className={`ev-badge ${count === 1 ? 'is-good' : ''}`}>
            {count} listener{count === 1 ? '' : 's'}
          </span>
          <span className="ev-small ev-muted">{items} items</span>
          <button
            type="button"
            className="viz-btn"
            onClick={addItem}
            disabled={items >= SNACKS.length}
          >
            + Add item
          </button>
        </div>
      </div>
      <div>
        <CodeView label="The code" lines={DELEGATE_CODE[mode].map((text) => ({ text }))} />
        {mode === 'delegate' && (
          <div className="ev-walk" aria-live="polite">
            <span className="viz-label">e.target.closest(".item") walks up:</span>
            {walk ? (
              <ol key={walk.id} className="ev-walk-steps">
                {walk.steps.map(([label, ok], i) => (
                  <li
                    key={i}
                    className={ok ? 'is-match' : ''}
                    style={reduced ? undefined : { animationDelay: `${i * 0.3}s` }}
                  >
                    <span className="viz-mono">{label}</span> {ok ? '✓ matches' : '✗'}
                  </li>
                ))}
                <li
                  className={walk.found ? 'is-match' : 'is-null'}
                  style={reduced ? undefined : { animationDelay: `${walk.steps.length * 0.3}s` }}
                >
                  → {walk.found ? 'the <li>' : <strong className="viz-mono">null</strong>}
                </li>
              </ol>
            ) : (
              <p className="ev-small ev-muted">
                Click an emoji, a price, or the empty space in the list.
              </p>
            )}
          </div>
        )}
        <EventLog rows={log.rows} onClear={log.clear} height="9rem" />
      </div>
    </div>
  );
}
