import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

/**
 * #4 Meet the 8 types: flip cards to explore each type, then a sorting game.
 * Every `typeof` shown is computed from a real value, never typed in by hand.
 */

type TypeId =
  'string' | 'number' | 'bigint' | 'boolean' | 'undefined' | 'null' | 'symbol' | 'object';

interface TypeInfo {
  id: TypeId;
  icon: string;
  examples: string[];
  forWhat: string;
  /** A real value of this type, so typeof is computed, not hard-coded. */
  sample: unknown;
  primitive: boolean;
}

const TYPES: TypeInfo[] = [
  {
    id: 'string',
    icon: '🔤',
    examples: ['"Hello"', "'chai'", '`Hi ${name}`'],
    forWhat: 'Text.',
    sample: 'Hello',
    primitive: true,
  },
  {
    id: 'number',
    icon: '🔢',
    examples: ['42', '3.14', '-7'],
    forWhat: 'All ordinary numbers, whole and decimal.',
    sample: 42,
    primitive: true,
  },
  {
    id: 'bigint',
    icon: '🐘',
    examples: ['9007199254740993n'],
    forWhat: 'Huge whole numbers, beyond what number holds exactly.',
    sample: 9007199254740993n,
    primitive: true,
  },
  {
    id: 'boolean',
    icon: '🔀',
    examples: ['true', 'false'],
    forWhat: 'Yes or no, on or off.',
    sample: true,
    primitive: true,
  },
  {
    id: 'undefined',
    icon: '❔',
    examples: ['undefined'],
    forWhat: '“No value has been given yet.”',
    sample: undefined,
    primitive: true,
  },
  {
    id: 'null',
    icon: '🕳️',
    examples: ['null'],
    forWhat: '“Empty on purpose.” You chose this.',
    sample: null,
    primitive: true,
  },
  {
    id: 'symbol',
    icon: '🔑',
    examples: ['Symbol("id")'],
    forWhat: 'A guaranteed-unique ID. Advanced, rarely needed early on.',
    sample: Symbol('id'),
    primitive: true,
  },
  {
    id: 'object',
    icon: '📦',
    examples: ['{ name: "Riya" }', '[1, 2, 3]'],
    forWhat: 'Collections of values: objects, arrays, functions, dates…',
    sample: { name: 'Riya' },
    primitive: false,
  },
];

interface Chip {
  label: string;
  value: unknown;
  answer: TypeId;
  /** Shown after answering: the surprising part. */
  why?: string;
  /** Shown on a wrong guess. */
  hint: string;
}

const CHIPS: Chip[] = [
  {
    label: '"42"',
    value: '42',
    answer: 'string',
    hint: 'Quotes make it a string, even if it looks like a number!',
  },
  { label: '42', value: 42, answer: 'number', hint: 'No quotes, just digits.' },
  {
    label: '42n',
    value: 42n,
    answer: 'bigint',
    hint: 'Look at the n on the end.',
    why: 'The n on the end makes it a BigInt.',
  },
  {
    label: 'true',
    value: true,
    answer: 'boolean',
    hint: 'No quotes: it is one of the two yes/no values.',
  },
  {
    label: '"false"',
    value: 'false',
    answer: 'string',
    hint: 'Quotes make it a string, even if it looks like a boolean!',
  },
  {
    label: 'null',
    value: null,
    answer: 'null',
    hint: 'It is its own type, whatever typeof says.',
    why: 'null is its own type, even though typeof null says "object" (a bug from 1995).',
  },
  {
    label: 'undefined',
    value: undefined,
    answer: 'undefined',
    hint: 'It is the value of a box that was never filled.',
  },
  {
    label: '[1, 2]',
    value: [1, 2],
    answer: 'object',
    hint: 'Lists are a kind of container.',
    why: 'Arrays are objects.',
  },
  { label: '{}', value: {}, answer: 'object', hint: 'Curly braces make a container.' },
  {
    label: '`hi`',
    value: `hi`,
    answer: 'string',
    hint: 'Backticks are quotes too.',
    why: 'Backticks make a string too (a template literal).',
  },
  {
    label: 'NaN',
    value: NaN,
    answer: 'number',
    hint: 'Despite its name…',
    why: '“Not a Number” is still of type number!',
  },
  { label: 'Symbol("id")', value: Symbol('id'), answer: 'symbol', hint: 'It makes a unique ID.' },
  {
    label: 'function(){}',
    value: function () {},
    answer: 'object',
    hint: 'Functions are a special kind of container.',
    why: 'Functions are objects, though typeof says "function".',
  },
  { label: '0', value: 0, answer: 'number', hint: 'Zero is still a number.' },
  {
    label: '""',
    value: '',
    answer: 'string',
    hint: 'Empty quotes are still quotes.',
    why: 'An empty string is still a string.',
  },
];

const icon = (t: TypeId) => TYPES.find((x) => x.id === t)!.icon;

function shuffled<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TypeZoo() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Meet the 8 types</p>
      <p className="viz-sub">Flip a card to meet each type. Then sort the values below.</p>
      <Explore />
      <SortingGame />
    </div>
  );
}

function Explore() {
  const [open, setOpen] = useState<Set<TypeId>>(() => new Set());
  const toggle = (id: TypeId) =>
    setOpen((prev) => {
      const next = new Set(prev); // never change state in place: copy, then edit the copy
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="tz-grid">
      {TYPES.map((t) => {
        const isOpen = open.has(t.id);
        const real = typeof t.sample;
        return (
          <button
            key={t.id}
            type="button"
            className={`tz-card ${isOpen ? 'is-open' : ''}`}
            aria-pressed={isOpen}
            aria-label={`${t.id}: ${isOpen ? 'hide details' : 'show details'}`}
            onClick={() => toggle(t.id)}
          >
            <span className="tz-face tz-front" aria-hidden={isOpen}>
              <span className="tz-icon">{t.icon}</span>
              <span className="tz-name viz-mono">{t.id}</span>
              <span className={`tz-kind ${t.primitive ? '' : 'is-object'}`}>
                {t.primitive ? 'primitive' : 'object'}
              </span>
            </span>
            <span className="tz-face tz-back" aria-hidden={!isOpen}>
              <span className="tz-examples viz-mono">{t.examples.join('  ')}</span>
              <span className="tz-for">{t.forWhat}</span>
              <span className="tz-typeof viz-mono">
                typeof → "{real}"{t.id === 'null' && <span className="tz-bug"> 🐛 bug</span>}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface Feedback {
  correct: boolean;
  bin: TypeId;
  text: string;
}

function SortingGame() {
  // A shuffled deck, the current position, and the score. Math.random only
  // runs in the initializer and in "Play again", never during a normal render.
  const [deck, setDeck] = useState(() => shuffled(CHIPS));
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(false); // already guessed wrong on this chip?
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selected, setSelected] = useState(false);
  const [fill, setFill] = useState<Record<string, number>>({});
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const start = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const binsRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const done = i >= deck.length;
  const chip = deck[Math.min(i, deck.length - 1)];
  const solved = feedback?.correct === true;

  const answer = (bin: TypeId) => {
    if (solved || done) return;
    setSelected(false);
    if (bin === chip.answer) {
      if (!missed) setScore((n) => n + 1);
      setFill((f) => ({ ...f, [bin]: (f[bin] ?? 0) + 1 }));
      setFeedback({ correct: true, bin, text: chip.why ?? 'Correct!' });
      // Move focus to "Next", so keyboard users can carry straight on.
      requestAnimationFrame(() => nextRef.current?.focus());
    } else {
      setMissed(true);
      setFeedback({ correct: false, bin, text: chip.hint });
    }
  };

  const next = () => {
    setI((n) => n + 1);
    setFeedback(null);
    setMissed(false);
    requestAnimationFrame(() => chipRef.current?.focus());
  };

  const replay = () => {
    setDeck(shuffled(CHIPS));
    setI(0);
    setScore(0);
    setFill({});
    setFeedback(null);
    setMissed(false);
  };

  // ── Dragging with pointer events (mouse, pen and touch) ──
  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (solved) return;
    start.current = { x: e.clientX, y: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.moved && Math.hypot(dx, dy) < 6) return; // a tiny wobble is still a tap
    s.moved = true;
    setDrag({ dx, dy });
  };
  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    const s = start.current;
    start.current = null;
    if (!s?.moved) return; // it was a tap: onClick handles it
    setDrag(null);
    // Which bin is under the finger? The chip ignores pointer hits while dragging.
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-bin]');
    if (el?.dataset.bin) answer(el.dataset.bin as TypeId);
  };

  const onChipClick = () => {
    if (solved || drag) return;
    setSelected((v) => !v);
    // With a keyboard, jump to the bins so arrows + Enter can drop the chip.
    if (!selected)
      requestAnimationFrame(() =>
        binsRef.current?.querySelector<HTMLElement>('[data-bin]')?.focus(),
      );
  };

  const onBinsKey = (e: KeyboardEvent) => {
    const bins = [...(binsRef.current?.querySelectorAll<HTMLElement>('[data-bin]') ?? [])];
    const idx = bins.indexOf(document.activeElement as HTMLElement);
    const dir =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0;
    if (!dir || idx === -1) return;
    e.preventDefault();
    bins[(idx + dir + bins.length) % bins.length].focus();
  };

  if (done) {
    return (
      <div className="tz-game tz-done">
        <p className="tz-done-score">
          You sorted <strong>{score}</strong> of {deck.length} on the first try.
        </p>
        <p className="jv-muted">
          {score === deck.length
            ? 'Perfect. You know your types.'
            : 'The tricky ones were NaN, null, arrays and functions.'}
        </p>
        <button type="button" className="viz-btn viz-btn--primary" onClick={replay}>
          Play again
        </button>
      </div>
    );
  }

  return (
    <div className="tz-game">
      <div className="tz-game-head">
        <span className="viz-label" style={{ margin: 0 }}>
          Sorting game
        </span>
        <span className="jv-muted viz-mono">
          {i + 1}/{deck.length} · score {score}
        </span>
      </div>
      <p className="jv-muted tz-instructions">
        Drag the value into its type, or tap it and then tap a type. Keyboard: Enter, then arrows
        and Enter.
      </p>

      <div className="tz-chip-row">
        <button
          ref={chipRef}
          key={i}
          type="button"
          className={`tz-chip viz-mono ${selected ? 'is-selected' : ''} ${feedback && !feedback.correct ? 'is-bounce' : ''} ${drag ? 'is-dragging' : ''} ${solved ? 'is-solved' : ''}`}
          style={drag ? { transform: `translate(${drag.dx}px, ${drag.dy}px)` } : undefined}
          aria-pressed={selected}
          aria-label={`Value ${chip.label}. ${selected ? 'Selected: now choose a type.' : 'Press to pick it up.'}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            start.current = null;
            setDrag(null);
          }}
          onClick={onChipClick}
        >
          {chip.label}
        </button>
      </div>

      <div ref={binsRef} className="tz-bins" role="group" aria-label="Types" onKeyDown={onBinsKey}>
        {TYPES.map((t) => {
          const state = feedback?.bin === t.id ? (feedback.correct ? 'is-right' : 'is-wrong') : '';
          return (
            <button
              key={t.id}
              type="button"
              data-bin={t.id}
              className={`tz-bin ${state}`}
              onClick={() => answer(t.id)}
              disabled={solved}
            >
              <span aria-hidden="true">{t.icon}</span>
              <span className="viz-mono">{t.id}</span>
              {(fill[t.id] ?? 0) > 0 && (
                <span className="tz-fill" aria-label={`${fill[t.id]} sorted`}>
                  {'•'.repeat(Math.min(fill[t.id], 5))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="tz-feedback" aria-live="polite">
        {feedback && (
          <>
            <span className={feedback.correct ? 'jv-true' : 'jv-false'}>
              {feedback.correct ? `✓ ${icon(chip.answer)} ${chip.answer}. ` : '✗ Not quite. '}
            </span>
            {feedback.text}
            {feedback.correct && (
              <button ref={nextRef} type="button" className="viz-btn tz-next" onClick={next}>
                Next value →
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
