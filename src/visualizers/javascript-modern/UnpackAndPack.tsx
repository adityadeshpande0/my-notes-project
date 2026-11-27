import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CodeView, Tabs } from '../core/code';
import { HeapCard, MemoryBox, RefArrows, type HeapProp } from '../core/memory';
import { StepControls } from '../core/StepControls';
import { useStepper, type Stepper } from '../core/useStepper';
import {
  arrayPatternCode,
  BASE,
  CHIPS,
  combine,
  copyArray,
  DRINKS,
  fakeUseState,
  FOOD,
  maxSpread,
  maxWhole,
  modesFor,
  nestedPincode,
  nestedPincodeSafe,
  NESTED_USER,
  objectPatternCode,
  overrideAfter,
  overrideBefore,
  PRICES,
  Profile,
  reactUpdate,
  runArrayPattern,
  runObjectPattern,
  SLOT_NAMES,
  SNACKS,
  swap,
  totalSteps,
  USER,
  type ChipKey,
  type ChipMode,
  type ObjChoice,
} from './lib/destructure';
import { useFlights } from './useFlights';

/**
 * #1 Unpack and pack. Destructuring, spread and rest drawn as values moving
 * between boxes. Every value shown comes from running the real syntax
 * (lib/destructure.ts); the animation only shows where it went.
 *
 * React idea: a `key` resets a component. Each pattern gets its own stepper,
 * keyed by the pattern's code, so changing the pattern starts the
 * unpacking again from step 1 instead of keeping a stale position.
 */
type TabId = 'object' | 'array' | 'spread' | 'react';

export default function UnpackAndPack() {
  return (
    <div className="viz not-prose mj-unpack">
      <p className="viz-title">Unpack and pack</p>
      <p className="viz-sub">
        Build a pattern, then press Play (or step with the arrows) and watch each value move.
      </p>
      <Tabs<TabId>
        label="Parts of this visual"
        twoUp
        tabs={[
          { id: 'object', name: 'Object destructuring' },
          { id: 'array', name: 'Array destructuring' },
          { id: 'spread', name: 'Spread & rest' },
          { id: 'react', name: 'In React' },
        ]}
      >
        {(t) =>
          t === 'object' ? (
            <ObjectTab />
          ) : t === 'array' ? (
            <ArrayTab />
          ) : t === 'spread' ? (
            <SpreadTab />
          ) : (
            <ReactTab />
          )
        }
      </Tabs>
    </div>
  );
}

/** A value as code: "Riya" (with quotes), 19, undefined, [ … ]. */
const show = (v: unknown): string =>
  v === undefined ? 'undefined' : typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v);
const rows = (obj: object): HeapProp[] =>
  Object.entries(obj).map(([key, v]) => ({ key, value: show(v) }));

/** A box whose lid flips open (CSS 3D) when it's being unpacked. */
function Box({ open, label, children }: { open: boolean; label: string; children: ReactNode }) {
  return (
    <div className={`mj-box ${open ? 'is-open' : ''}`}>
      <div className="mj-lid" aria-hidden="true">
        📦 {label}
      </div>
      {children}
    </div>
  );
}

function Seg<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="viz-seg mj-seg">
      {options.map(([id, name]) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          aria-pressed={value === id}
          className="viz-seg-btn"
          onClick={() => onChange(id)}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

/** Fly a value for each new step. `targets(i)` says what moves at step i. */
function useStepFlights(
  s: Stepper,
  targets: (i: number) => { from: string; to: string; text: string; tone?: 'value' | 'warn' }[],
) {
  const { layer, fly } = useFlights();
  const last = useRef(s.index);
  useEffect(() => {
    // Only moving forward one step flies; jumping back just re-draws.
    if (s.index === last.current + 1) {
      const root = layer.current?.parentElement;
      for (const t of targets(s.index))
        fly(root?.querySelector(t.from), root?.querySelector(t.to), t.text, t.tone);
    }
    last.current = s.index;
  }, [s.index]); // eslint-disable-line react-hooks/exhaustive-deps
  return layer;
}

// ─── Tab: Object destructuring ───────────────────────────────────────

const START_CHOICE: ObjChoice = {
  modes: { name: 'rename', age: 'on', city: 'off', country: 'default', phone: 'off' },
  rest: true,
};
const MODE_TEXT = (key: ChipKey, m: ChipMode) => {
  const chip = CHIPS.find((c) => c.key === key)!;
  return m === 'off'
    ? 'skip'
    : m === 'on'
      ? 'take'
      : m === 'rename'
        ? `rename → ${chip.rename}`
        : `default = ${chip.def!.code}`;
};

function ObjectTab() {
  const [sub, setSub] = useState<'pattern' | 'nested'>('pattern');
  const [choice, setChoice] = useState<ObjChoice>(START_CHOICE);
  const code = objectPatternCode(choice);
  return (
    <>
      <Seg
        label="Object examples"
        value={sub}
        onChange={setSub}
        options={[
          ['pattern', 'Build a pattern'],
          ['nested', 'Nested'],
        ]}
      />
      {sub === 'nested' ? (
        <NestedDemo />
      ) : (
        <>
          <div className="mj-builder" role="group" aria-label="Pattern builder">
            {CHIPS.map((chip) => (
              <label
                key={chip.key}
                className={`mj-chip ${choice.modes[chip.key] !== 'off' ? 'is-on' : ''} ${chip.key in USER ? '' : 'is-missing'}`}
              >
                <span className="viz-mono">
                  {chip.key}
                  {chip.key in USER ? '' : ' (missing!)'}
                </span>
                <select
                  className="mj-select"
                  value={choice.modes[chip.key]}
                  onChange={(e) =>
                    setChoice((c) => ({
                      ...c,
                      modes: { ...c.modes, [chip.key]: e.target.value as ChipMode },
                    }))
                  }
                >
                  {modesFor(chip).map((m) => (
                    <option key={m} value={m}>
                      {MODE_TEXT(chip.key, m)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <label className={`mj-chip ${choice.rest ? 'is-on' : ''}`}>
              <input
                type="checkbox"
                checked={choice.rest}
                onChange={(e) => setChoice((c) => ({ ...c, rest: e.target.checked }))}
              />
              <span className="viz-mono">...others</span>
            </label>
          </div>
          <ObjectPlayer key={code} choice={choice} code={code} />
        </>
      )}
    </>
  );
}

function ObjectPlayer({ choice, code }: { choice: ObjChoice; code: string }) {
  const result = useMemo(() => runObjectPattern(choice), [choice]);
  const { bindings, others } = result;
  // Steps: 0 = closed box, 1 = lid opens, then one per variable, then the rest object.
  const total = 2 + bindings.length + (others ? 1 : 0);
  const s = useStepper(total, 1100);
  const shown = Math.max(0, s.index - 1);
  const memRef = useRef<HTMLDivElement>(null);
  // The source rows: real properties, plus ghost rows for asked-for properties that aren't there.
  const ghosts = bindings.filter((b) => b.missing).map((b) => b.from!);
  const keys = [...Object.keys(USER), ...ghosts];
  const current = s.index >= 2 && s.index - 2 < bindings.length ? bindings[s.index - 2] : null;
  const layer = useStepFlights(s, (i) => {
    const b = bindings[i - 2];
    if (b)
      return [
        {
          from: `.mj-src .heap-prop:nth-child(${keys.indexOf(b.from!) + 1})`,
          to: `[data-mem-box="${b.variable}"]`,
          text: b.variable !== b.from ? `${b.from} → ${b.variable}` : show(b.value),
          tone: b.missing ? 'warn' : 'value',
        },
      ];
    if (others && i === total - 1)
      return [{ from: '.mj-src', to: '[data-heap-id="others"]', text: '…the rest' }];
    return [];
  });
  const restShown = others && s.index === total - 1;
  const taken = new Set(bindings.slice(0, shown).map((b) => b.from));

  return (
    <>
      <pre className="mj-pattern viz-mono" aria-label="The pattern">
        {code}
      </pre>
      <div className="mj-stage" ref={memRef}>
        <div className="mj-flylayer" ref={layer} aria-hidden="true" />
        <div className="mj-src">
          <Box open={s.index >= 1} label="user">
            <HeapCard
              id="user"
              label="user"
              props={keys.map((k) => ({
                key: k,
                value: k in USER ? show(USER[k as ChipKey]) : '(not here)',
                role:
                  current?.from === k
                    ? 'read'
                    : taken.has(k as ChipKey) ||
                        (restShown && !taken.has(k as ChipKey) && k in USER)
                      ? 'read'
                      : undefined,
              }))}
            />
          </Box>
        </div>
        <div className="mj-vars" aria-live="polite">
          {bindings.slice(0, Math.max(0, s.index - 1)).map((b) => (
            <div key={b.variable} className="mj-var">
              <MemoryBox
                name={b.variable}
                kind="const"
                value={show(b.value)}
                state={b.missing && !b.defaultUsed ? 'error' : 'new'}
              />
              <span
                className={`mj-tag ${b.defaultUsed ? 'is-default' : b.missing ? 'is-missing' : ''}`}
              >
                {b.defaultUsed
                  ? 'default used'
                  : b.missing
                    ? 'not in user → undefined'
                    : b.variable !== b.from
                      ? `from ${b.from} (renamed)`
                      : `from ${b.from}`}
              </span>
            </div>
          ))}
          {restShown && (
            <div className="mj-rest">
              <MemoryBox
                name="others"
                kind="const"
                value=""
                refTo="others"
                refLabel="others"
                state="new"
              />
              <HeapCard id="others" label="others" props={rows(others)} state="new" />
              <span className="mj-tag is-new">a brand-new object (rest gathers the leftovers)</span>
            </div>
          )}
        </div>
        <RefArrows container={memRef} deps={`${code}-${s.index}`} />
      </div>
      <p className="viz-caption" aria-live="polite">
        {s.index === 0
          ? 'The { } on the LEFT of = means: unpack these properties, matched by NAME.'
          : s.index === 1
            ? 'The box opens…'
            : current
              ? current.defaultUsed
                ? `${current.from} isn’t in user, so the default is used: ${current.variable} = ${show(current.value)}.`
                : current.missing
                  ? `${current.from} isn’t in user, and there’s no default: ${current.variable} is undefined.`
                  : `${current.variable} gets user.${current.from}: ${show(current.value)}${current.variable !== current.from ? ' (a new name)' : ''}.`
              : restShown
                ? '...others gathers every property nobody asked for into a NEW object.'
                : 'Done.'}
      </p>
      <StepControls s={s} />
    </>
  );
}

function NestedDemo() {
  const [hasAddress, setHasAddress] = useState(true);
  const [safe, setSafe] = useState(false);
  const user = hasAddress ? NESTED_USER : USER;
  const result = safe ? nestedPincodeSafe(user) : nestedPincode(user);
  const code = `const { address: { pincode }${safe ? ' = {}' : ''} } = user;`;
  return (
    <>
      <div className="mj-row">
        <label className="mj-check">
          <input
            type="checkbox"
            checked={hasAddress}
            onChange={(e) => setHasAddress(e.target.checked)}
          />
          user has an address
        </label>
        <label className="mj-check">
          <input type="checkbox" checked={safe} onChange={(e) => setSafe(e.target.checked)} />
          add the safe default <code>= {'{}'}</code>
        </label>
      </div>
      <pre className="mj-pattern viz-mono">{code}</pre>
      <div className="mj-stage">
        <Box open label="user">
          <HeapCard
            id="nested-user"
            label="user"
            props={Object.entries(user).map(([key, v]) =>
              key === 'address'
                ? {
                    key,
                    value: '',
                    children: rows(v as object).map((r) => ({
                      ...r,
                      role: r.key === 'pincode' ? ('read' as const) : undefined,
                    })),
                  }
                : { key, value: show(v) },
            )}
          />
        </Box>
        <div className="mj-vars" aria-live="polite">
          {result.ok ? (
            <div className="mj-var">
              <MemoryBox name="pincode" kind="const" value={show(result.value)} state="new" />
              <span className="mj-tag">
                {result.value === undefined
                  ? 'no address, so the {} default was unpacked: undefined'
                  : 'pulled out of the inner box'}
              </span>
            </div>
          ) : (
            <div className="mj-error" role="status">
              <strong className="viz-mono">{result.error}</strong>
              <p className="mj-small">
                There’s no address, so JavaScript tries to read pincode from undefined. Tick “add
                the safe default = {'{}'}” to fix it.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Tab: Array destructuring ────────────────────────────────────────

function ArrayTab() {
  const [sub, setSub] = useState<'pattern' | 'swap'>('pattern');
  const [slots, setSlots] = useState([true, true, false]);
  const [rest, setRest] = useState(true);
  const code = arrayPatternCode({ slots, rest });
  return (
    <>
      <Seg
        label="Array examples"
        value={sub}
        onChange={setSub}
        options={[
          ['pattern', 'Fill the slots'],
          ['swap', 'Swap'],
        ]}
      />
      {sub === 'swap' ? (
        <SwapDemo />
      ) : (
        <>
          <div className="mj-builder" role="group" aria-label="Pattern slots">
            {SLOT_NAMES.map((name, i) => (
              <button
                key={name}
                type="button"
                className={`mj-slot ${slots[i] ? 'is-on' : ''}`}
                aria-pressed={slots[i]}
                onClick={() => setSlots((ss) => ss.map((x, k) => (k === i ? !x : x)))}
              >
                <span className="mj-small">slot {i}</span>
                <span className="viz-mono">{slots[i] ? name : '(skip)'}</span>
              </button>
            ))}
            <label className={`mj-chip ${rest ? 'is-on' : ''}`}>
              <input type="checkbox" checked={rest} onChange={(e) => setRest(e.target.checked)} />
              <span className="viz-mono">...rest</span>
            </label>
          </div>
          <ArrayPlayer key={code} slots={slots} rest={rest} code={code} />
        </>
      )}
    </>
  );
}

function ArrayPlayer({ slots, rest, code }: { slots: boolean[]; rest: boolean; code: string }) {
  const result = useMemo(() => runArrayPattern({ slots, rest }), [slots, rest]);
  // Steps: 0 closed, 1 open, then one per slot (bound or skipped), then the rest array.
  const total = 2 + slots.length + (rest ? 1 : 0);
  const s = useStepper(total, 1000);
  const memRef = useRef<HTMLDivElement>(null);
  const slot = s.index >= 2 && s.index - 2 < slots.length ? s.index - 2 : -1;
  const layer = useStepFlights(s, (i) => {
    const k = i - 2;
    if (k >= 0 && k < slots.length && slots[k])
      return [
        {
          from: `.mj-src .heap-prop:nth-child(${k + 1})`,
          to: `[data-mem-box="${SLOT_NAMES[k]}"]`,
          text: `[${k}] ${show(SNACKS[k])}`,
        },
      ];
    if (rest && i === total - 1)
      return [
        { from: '.mj-src .heap-prop:nth-child(4)', to: '[data-heap-id="rest"]', text: '…the rest' },
      ];
    return [];
  });
  const restShown = rest && s.index === total - 1;
  const done = Math.max(0, s.index - 1);
  return (
    <>
      <pre className="mj-pattern viz-mono">{code}</pre>
      <div className="mj-stage" ref={memRef}>
        <div className="mj-flylayer" ref={layer} aria-hidden="true" />
        <div className="mj-src">
          <Box open={s.index >= 1} label="snacks">
            <HeapCard
              id="snacks"
              label="snacks"
              isArray
              props={SNACKS.map((v, i) => ({
                key: String(i),
                value: show(v),
                role: i === slot ? 'read' : restShown && i >= 3 ? 'read' : undefined,
              }))}
            />
          </Box>
        </div>
        <div className="mj-vars" aria-live="polite">
          {slots.slice(0, done).map((on, i) =>
            on ? (
              <div key={i} className="mj-var">
                <MemoryBox
                  name={SLOT_NAMES[i]}
                  kind="const"
                  value={show(result.bindings.find((b) => b.index === i)!.value)}
                  state="new"
                />
                <span className="mj-tag">from index [{i}]</span>
              </div>
            ) : (
              <div key={i} className="mj-var is-skip">
                <span className="mj-tag">⏭ index [{i}] skipped</span>
              </div>
            ),
          )}
          {restShown && (
            <div className="mj-rest">
              <MemoryBox
                name="rest"
                kind="const"
                value=""
                refTo="rest"
                refLabel="rest"
                state="new"
              />
              <HeapCard
                id="rest"
                label="rest"
                isArray
                props={(result.rest ?? []).map((v, i) => ({ key: String(i), value: show(v) }))}
                state="new"
              />
              <span className="mj-tag is-new">a new array: everything after the slots</span>
            </div>
          )}
        </div>
        <RefArrows container={memRef} deps={`${code}-${s.index}`} />
      </div>
      <p className="viz-caption" aria-live="polite">
        {s.index === 0
          ? 'The [ ] on the left means: unpack by POSITION. Names don’t matter here, only the order.'
          : s.index === 1
            ? 'The box opens…'
            : slot >= 0
              ? slots[slot]
                ? `${SLOT_NAMES[slot]} gets index ${slot}: ${show(SNACKS[slot])}.`
                : `Slot ${slot} is empty (just a comma), so index ${slot} is skipped.`
              : restShown
                ? '...rest gathers everything left over into a new array.'
                : 'Done.'}
      </p>
      <StepControls s={s} />
    </>
  );
}

const SWAP = swap();
function SwapDemo() {
  const s = useStepper(5, 1200);
  const memRef = useRef<HTMLDivElement>(null);
  const a = s.index >= 3 ? SWAP.after.a : SWAP.before.a;
  const b = s.index >= 4 ? SWAP.after.b : SWAP.before.b;
  return (
    <>
      <CodeView
        label="Swap"
        lines={[
          { text: 'let a = "chai", b = "coffee";', state: s.index === 0 ? 'on' : undefined },
          { text: '[a, b] = [b, a];', state: s.index > 0 ? 'on' : undefined },
        ]}
      />
      <div className="mj-stage" ref={memRef}>
        <div className="mj-vars">
          <MemoryBox
            name="a"
            kind="let"
            value={show(a)}
            state={s.index === 3 ? 'changed' : 'same'}
          />
          <MemoryBox
            name="b"
            kind="let"
            value={show(b)}
            state={s.index === 4 ? 'changed' : 'same'}
          />
        </div>
        {s.index >= 1 && s.index < 5 && (
          <HeapCard
            id="temp"
            label="[b, a] (temporary)"
            isArray
            props={SWAP.temp.map((v, i) => ({
              key: String(i),
              value: show(v),
              role: s.index - 3 === i ? 'read' : undefined,
            }))}
            state="new"
          />
        )}
      </div>
      <p className="viz-caption" aria-live="polite">
        {
          [
            'Two variables. How do we swap them?',
            'The right side runs first: it builds a temporary array [b, a] = ["coffee", "chai"].',
            'Then the left side unpacks that array, by position…',
            'a gets index 0: "coffee".',
            'b gets index 1: "chai". Swapped! No temp variable needed (compare with article #2’s swap).',
          ][s.index]
        }
      </p>
      <StepControls s={s} />
    </>
  );
}

// ─── Tab: Spread & rest ──────────────────────────────────────────────

type SpreadMode = 'arrays' | 'objects' | 'call' | 'rest';

function SpreadTab() {
  const [mode, setMode] = useState<SpreadMode>('arrays');
  return (
    <>
      <Seg
        label="Spread and rest examples"
        value={mode}
        onChange={setMode}
        options={[
          ['arrays', 'Spread arrays'],
          ['objects', 'Who wins?'],
          ['call', 'Into a call'],
          ['rest', 'Rest parameters'],
        ]}
      />
      <p className={`mj-direction ${mode === 'rest' ? 'is-rest' : 'is-spread'}`}>
        {mode === 'rest' ? '📥 REST: gathering in' : '📤 SPREAD: unpacking out'}
      </p>
      {mode === 'arrays' ? (
        <SpreadArrays />
      ) : mode === 'objects' ? (
        <WhoWins />
      ) : mode === 'call' ? (
        <SpreadCall />
      ) : (
        <RestParams />
      )}
    </>
  );
}

const COMBINED = combine();
const COPY = copyArray();
function SpreadArrays() {
  const [copyMode, setCopyMode] = useState(false);
  return (
    <>
      <label className="mj-check">
        <input type="checkbox" checked={copyMode} onChange={(e) => setCopyMode(e.target.checked)} />
        Show the copy preset: <code>[...drinks]</code>
      </label>
      {copyMode ? <CopyDemo /> : <CombineDemo />}
    </>
  );
}

function CombineDemo() {
  // Each item pours out of its box into the new array, in order.
  const sources = [
    ...DRINKS.map((_, i) => ({ box: 'drinks', i })),
    ...FOOD.map((_, i) => ({ box: 'food', i })),
    { box: 'literal', i: 0 },
  ];
  const s = useStepper(COMBINED.length + 1, 900);
  const layer = useStepFlights(s, (i) => {
    const src = sources[i - 1];
    if (!src) return [];
    return [
      {
        from:
          src.box === 'literal'
            ? '.mj-literal'
            : `[data-heap-id="${src.box}"] .heap-prop:nth-child(${src.i + 1})`,
        to: `[data-heap-id="menu"] .heap-prop:nth-child(${i})`,
        text: show(COMBINED[i - 1]),
      },
    ];
  });
  return (
    <>
      <pre className="mj-pattern viz-mono">const menu = [...drinks, ...food, "jalebi"];</pre>
      <div className="mj-stage">
        <div className="mj-flylayer" ref={layer} aria-hidden="true" />
        <div className="mj-srcs">
          <HeapCard
            id="drinks"
            label="drinks"
            isArray
            props={DRINKS.map((v, i) => ({
              key: String(i),
              value: show(v),
              role:
                sources[s.index - 1]?.box === 'drinks' && sources[s.index - 1]?.i === i
                  ? 'read'
                  : undefined,
            }))}
          />
          <HeapCard
            id="food"
            label="food"
            isArray
            props={FOOD.map((v, i) => ({
              key: String(i),
              value: show(v),
              role: sources[s.index - 1]?.box === 'food' ? 'read' : undefined,
            }))}
          />
          <span className="mj-literal viz-mono">"jalebi"</span>
        </div>
        <HeapCard
          id="menu"
          label="menu (new array)"
          isArray
          props={COMBINED.slice(0, s.index).map((v, i) => ({
            key: String(i),
            value: show(v),
            role: i === s.index - 1 ? 'added' : undefined,
          }))}
          state="new"
        />
      </div>
      <p className="viz-caption" aria-live="polite">
        {s.index === 0
          ? 'Each ... pours one array’s items out, in order, into the new array.'
          : s.index === COMBINED.length
            ? `menu = ${show(COMBINED)}`
            : `${show(COMBINED[s.index - 1])} goes in at index ${s.index - 1}.`}
      </p>
      <StepControls s={s} />
    </>
  );
}

function CopyDemo() {
  const memRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <pre className="mj-pattern viz-mono">const copy = [...drinks];</pre>
      <div className="mj-stage" ref={memRef}>
        <div className="mj-vars">
          <MemoryBox name="drinks" kind="const" value="" refTo="drinks-c" refLabel="drinks" />
          <MemoryBox name="copy" kind="const" value="" refTo="copy-c" refLabel="copy" state="new" />
        </div>
        <div className="mj-srcs">
          <HeapCard
            id="drinks-c"
            label="the original"
            isArray
            props={DRINKS.map((v, i) => ({ key: String(i), value: show(v) }))}
          />
          <HeapCard
            id="copy-c"
            label="the copy (new array)"
            isArray
            props={COPY.copy.map((v, i) => ({ key: String(i), value: show(v) }))}
            state="new"
          />
        </div>
        <RefArrows container={memRef} deps="copy" />
      </div>
      <p className="mj-result viz-mono">copy === drinks → {String(COPY.same)}</p>
      <p className="mj-small">
        Same items, but two different arrays: two arrows to two boxes (a shallow copy, article #2).
      </p>
    </>
  );
}

/** Pour an object literal's parts in, left to right; repeated keys get overwritten. */
function pours(parts: ('base' | 'sugar2')[]) {
  const steps: { key: string; value: unknown; overwrote: boolean; from: string }[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    const entries = part === 'base' ? Object.entries(BASE) : [['sugar', 2] as [string, unknown]];
    for (const [key, value] of entries) {
      steps.push({
        key,
        value,
        overwrote: seen.has(key),
        from: part === 'base' ? '...base' : 'sugar: 2',
      });
      seen.add(key);
    }
  }
  return steps;
}

function WhoWins() {
  const columns = [
    {
      code: 'const order = { ...base, sugar: 2 };',
      parts: ['base', 'sugar2'] as ('base' | 'sugar2')[],
      real: overrideAfter(),
    },
    {
      code: 'const order = { sugar: 2, ...base };',
      parts: ['sugar2', 'base'] as ('base' | 'sugar2')[],
      real: overrideBefore(),
    },
  ];
  const s = useStepper(4, 1100);
  return (
    <>
      <HeapCard id="base" label="base" props={rows(BASE)} />
      <div className="mj-columns">
        {columns.map((col) => {
          const steps = pours(col.parts);
          const done = steps.slice(0, s.index);
          // Build the object the way the literal does: later keys overwrite earlier ones.
          const built: Record<string, unknown> = {};
          for (const st of done) built[st.key] = st.value;
          const last = done.at(-1);
          return (
            <div key={col.code} className="mj-column">
              <pre className="mj-pattern viz-mono">{col.code}</pre>
              <HeapCard
                id={`order-${col.parts[0]}`}
                label="order (new object)"
                props={Object.entries(built).map(([key, v]) => ({
                  key,
                  value: show(v),
                  role: last?.key === key ? (last.overwrote ? 'changed' : 'added') : undefined,
                }))}
                state="new"
              />
              <p className="mj-small" aria-live="polite">
                {last
                  ? last.overwrote
                    ? `⚠ ${last.key} again, from ${last.from}: the later value wins.`
                    : `${last.key} comes in from ${last.from}.`
                  : 'Empty, ready to fill left to right.'}
              </p>
              {s.index === 3 && (
                <p className="mj-result viz-mono">
                  = {JSON.stringify(col.real)}{' '}
                  {JSON.stringify(col.real) === JSON.stringify(built) ? '✓' : ''}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="viz-caption">
        Properties are poured in from left to right. When a key repeats, the LATER one wins.
      </p>
      <StepControls s={s} />
    </>
  );
}

function SpreadCall() {
  const s = useStepper(PRICES.length + 2, 900);
  const layer = useStepFlights(s, (i) =>
    i >= 1 && i <= PRICES.length
      ? [
          {
            from: `[data-heap-id="prices"] .heap-prop:nth-child(${i})`,
            to: `.mj-arg:nth-child(${i})`,
            text: String(PRICES[i - 1]),
          },
        ]
      : [],
  );
  return (
    <>
      <pre className="mj-pattern viz-mono">Math.max(...prices);</pre>
      <div className="mj-stage">
        <div className="mj-flylayer" ref={layer} aria-hidden="true" />
        <HeapCard
          id="prices"
          label="prices"
          isArray
          props={PRICES.map((v, i) => ({
            key: String(i),
            value: String(v),
            role: i === s.index - 1 ? 'read' : undefined,
          }))}
        />
        <div className="mj-call">
          <span className="viz-mono">Math.max(</span>
          {PRICES.map((p, i) => (
            <span key={i} className={`mj-arg viz-mono ${s.index > i ? 'is-filled' : ''}`}>
              {s.index > i ? p : '…'}
            </span>
          ))}
          <span className="viz-mono">)</span>
          {s.index === PRICES.length + 1 && (
            <strong className="mj-result viz-mono">→ {maxSpread()}</strong>
          )}
        </div>
      </div>
      <div className="mj-compare">
        <span className="viz-mono">Math.max(prices)</span>
        <span className="mj-arg viz-mono is-whole">[30, 20, 45]</span>
        <strong className="mj-bad viz-mono">→ {String(maxWhole())}</strong>
        <span className="mj-small">
          Without the dots, the whole array goes into ONE argument slot.
        </span>
      </div>
      <StepControls s={s} />
    </>
  );
}

const TOTAL = totalSteps(...PRICES);
function RestParams() {
  const s = useStepper(2 + TOTAL.steps.length, 1000);
  const layer = useStepFlights(s, (i) =>
    i === 1
      ? PRICES.map((p, k) => ({
          from: `.mj-arg:nth-child(${k + 2})`,
          to: '[data-heap-id="gathered"]',
          text: String(p),
        }))
      : [],
  );
  return (
    <>
      <CodeView
        label="Rest parameters"
        lines={[
          { text: 'function total(...prices) {', state: s.index === 1 ? 'on' : undefined },
          {
            text: '  return prices.reduce((sum, p) => sum + p, 0);',
            state: s.index >= 2 ? 'on' : undefined,
          },
          { text: '}' },
          { text: 'total(30, 20, 45);   // 95' },
        ]}
      />
      <div className="mj-stage">
        <div className="mj-flylayer" ref={layer} aria-hidden="true" />
        <div className="mj-call">
          <span className="viz-mono">total(</span>
          {PRICES.map((p, i) => (
            <span key={i} className="mj-arg viz-mono is-filled">
              {p}
            </span>
          ))}
          <span className="viz-mono">)</span>
        </div>
        {s.index >= 1 && (
          <HeapCard
            id="gathered"
            label="prices (one array)"
            isArray
            props={PRICES.map((v, i) => ({ key: String(i), value: String(v) }))}
            state="new"
          />
        )}
      </div>
      {s.index >= 2 && (
        <table className="mj-reduce">
          <thead>
            <tr>
              <th scope="col">sum</th>
              <th scope="col">p</th>
              <th scope="col">sum + p</th>
            </tr>
          </thead>
          <tbody>
            {TOTAL.steps.slice(0, s.index - 1).map((r, i) => (
              <tr key={i}>
                <td>{r.sum}</td>
                <td>{r.p}</td>
                <td>{r.next}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="viz-caption" aria-live="polite">
        {s.index === 0
          ? 'Three separate arguments…'
          : s.index === 1
            ? '...prices GATHERS them into one array called prices.'
            : s.index - 1 < TOTAL.steps.length
              ? 'Then reduce adds them up (article #6).'
              : `total(30, 20, 45) → ${TOTAL.result}`}
      </p>
      <StepControls s={s} />
    </>
  );
}

// ─── Tab: In React ───────────────────────────────────────────────────

const PROPS = { name: 'Riya', avatar: '🧕', age: 19 };
const PROFILE = Profile(PROPS);
const [COUNT, SET_COUNT] = fakeUseState(0);
const UPDATE = reactUpdate();

function ReactTab() {
  const [shown, setShown] = useState([false, false, false]);
  const memRef = useRef<HTMLDivElement>(null);
  const open = (i: number) => setShown((s) => s.map((x, k) => (k === i ? true : x)));
  return (
    <div className="mj-react" ref={memRef}>
      <div className="viz-panel">
        <pre className="mj-pattern viz-mono">
          {'function Profile({ name, avatar }) { … }\n<Profile name="Riya" avatar="🧕" age={19} />'}
        </pre>
        <button type="button" className="viz-btn" onClick={() => open(0)}>
          Unpack the props ▶
        </button>
        <div className="mj-stage">
          <Box open={shown[0]} label="props">
            <HeapCard
              id="props"
              label="props"
              props={rows(PROPS).map((r) => ({
                ...r,
                role: shown[0] && r.key !== 'age' ? 'read' : undefined,
              }))}
            />
          </Box>
          {shown[0] && (
            <div className="mj-vars">
              <MemoryBox name="name" kind="const" value={show(PROFILE.name)} state="new" />
              <MemoryBox name="avatar" kind="const" value={show(PROFILE.avatar)} state="new" />
            </div>
          )}
        </div>
        <p className="mj-small">
          React passes every component ONE props object; the {'{ }'} in the parameter unpacks it
          (age is simply ignored).
        </p>
      </div>
      <div className="viz-panel">
        <pre className="mj-pattern viz-mono">const [count, setCount] = useState(0);</pre>
        <button type="button" className="viz-btn" onClick={() => open(1)}>
          Unpack what useState returns ▶
        </button>
        <div className="mj-stage">
          <Box open={shown[1]} label="useState(0) returns">
            <HeapCard
              id="state"
              label="[value, setter]"
              isArray
              props={[
                { key: '0', value: String(COUNT) },
                { key: '1', value: 'ƒ setter', type: 'function' },
              ]}
            />
          </Box>
          {shown[1] && (
            <div className="mj-vars">
              <MemoryBox name="count" kind="const" value={String(COUNT)} state="new" />
              <MemoryBox
                name="setCount"
                kind="const"
                value={typeof SET_COUNT === 'function' ? 'ƒ' : '?'}
                state="new"
              />
            </div>
          )}
        </div>
        <p className="mj-small">
          It’s array destructuring, matched by position, so YOU choose the names: [count, setCount],
          [theme, setTheme]…
        </p>
      </div>
      <div className="viz-panel">
        <pre className="mj-pattern viz-mono">setUser({'{ ...user, age: 20 }'});</pre>
        <button type="button" className="viz-btn" onClick={() => open(2)}>
          Spread and override ▶
        </button>
        <div className="mj-stage">
          <div className="mj-vars">
            <MemoryBox name="user" kind="const" value="" refTo="ru-old" refLabel="user" />
            {shown[2] && (
              <MemoryBox
                name="next"
                kind="const"
                value=""
                refTo="ru-new"
                refLabel="new object"
                state="new"
              />
            )}
          </div>
          <div className="mj-srcs">
            <HeapCard id="ru-old" label="the old user" props={rows(UPDATE.user)} />
            {shown[2] && (
              <HeapCard
                id="ru-new"
                label="a NEW object"
                props={rows(UPDATE.updated).map((r) => ({
                  ...r,
                  role: r.key === 'age' ? 'changed' : undefined,
                }))}
                state="new"
              />
            )}
          </div>
        </div>
        {shown[2] && (
          <p className="mj-small">
            A new object (a new arrow): React sees it isn’t the same object (updated === user →{' '}
            {String(UPDATE.same)}) and re-renders.
          </p>
        )}
      </div>
      <RefArrows container={memRef} deps={shown.join()} />
    </div>
  );
}
