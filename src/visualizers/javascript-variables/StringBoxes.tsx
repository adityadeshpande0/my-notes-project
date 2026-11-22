import { useId, useState } from 'react';

/**
 * #5 Strings are rows of characters: indexes, length, immutability, and
 * template literals. Every result comes from calling the real string method.
 */

const MAX = 20;

interface Method {
  label: string;
  /** Call the real method on the string. */
  run: (s: string) => unknown;
  /** Code as shown, given the string's own code. */
  code: (lit: string) => string;
  /** Which characters to highlight (UTF-16 start/end), for index-style methods. */
  range?: (s: string) => [number, number] | null;
  /** True when the method returns a NEW string (shown as a new row). */
  makesString?: boolean;
}

const METHODS: Method[] = [
  {
    label: '.length',
    run: (s) => s.length,
    code: (l) => `${l}.length`,
    range: (s) => (s.length ? [0, s.length] : null),
  },
  {
    label: '[0]',
    run: (s) => s[0],
    code: (l) => `${l}[0]`,
    range: (s) => (s.length ? [0, s.codePointAt(0)! > 0xffff ? 2 : 1] : null),
  },
  {
    label: '.at(-1)',
    run: (s) => s.at(-1),
    code: (l) => `${l}.at(-1)`,
    range: (s) => (s.length ? [s.length - 1, s.length] : null),
  },
  {
    label: '.toUpperCase()',
    run: (s) => s.toUpperCase(),
    code: (l) => `${l}.toUpperCase()`,
    makesString: true,
  },
  {
    label: '.slice(0, 5)',
    run: (s) => s.slice(0, 5),
    code: (l) => `${l}.slice(0, 5)`,
    makesString: true,
  },
  {
    label: '.indexOf("s")',
    run: (s) => s.indexOf('s'),
    code: (l) => `${l}.indexOf("s")`,
    range: (s) => (s.indexOf('s') === -1 ? null : [s.indexOf('s'), s.indexOf('s') + 1]),
  },
  {
    label: '.includes("cape")',
    run: (s) => s.includes('cape'),
    code: (l) => `${l}.includes("cape")`,
    range: (s) => (s.indexOf('cape') === -1 ? null : [s.indexOf('cape'), s.indexOf('cape') + 4]),
  },
  {
    label: '.replace("Stack", "Snack")',
    run: (s) => s.replace('Stack', 'Snack'),
    code: (l) => `${l}.replace("Stack", "Snack")`,
    makesString: true,
  },
];

/** Show a result the way a console would: strings in quotes. */
const show = (v: unknown) => (typeof v === 'string' ? JSON.stringify(v) : String(v));

/** Each visible character with the UTF-16 index it starts at (emoji take 2). */
function tiles(s: string) {
  let at = 0;
  return Array.from(s).map((ch) => {
    const t = { ch, at };
    at += ch.length;
    return t;
  });
}

export default function StringBoxes() {
  const [text, setText] = useState('Stackscape');
  const [method, setMethod] = useState<Method | null>(null);
  const id = useId();

  // Everything below is worked out from `text` and `method` on each render.
  const result = method?.run(text);
  const range = method?.range?.(text) ?? null;
  const row = tiles(text);
  const surrogates = row.length !== text.length;
  const lit = JSON.stringify(text);

  return (
    <div className="viz not-prose">
      <p className="viz-title">Strings are rows of characters</p>
      <p className="viz-sub">Each character has a position, its index, counting from 0.</p>

      <div className="sb-input">
        <label htmlFor={`${id}-s`} className="viz-label" style={{ margin: 0 }}>
          Your string
        </label>
        <input
          id={`${id}-s`}
          value={text}
          maxLength={MAX}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          spellCheck={false}
        />
        <span className="jv-muted viz-mono">length {text.length}</span>
      </div>

      <div className="viz-scroll">
        <ol className="sb-row" aria-label="Characters">
          {row.length === 0 && <li className="jv-muted">"" (an empty string has no characters)</li>}
          {row.map((t, i) => {
            const on = range && t.at >= range[0] && t.at < range[1];
            return (
              <li key={i} className={`sb-tile ${on ? 'is-on' : ''}`}>
                <span className="sb-ch">{t.ch === ' ' ? '␣' : t.ch}</span>
                <span className="sb-idx viz-mono">{t.at}</span>
              </li>
            );
          })}
        </ol>
      </div>
      {surrogates && (
        <p className="jv-muted sb-note">
          Some characters (like emoji) take two index positions in a JavaScript string.
        </p>
      )}

      <div className="sb-methods" role="group" aria-label="String methods">
        {METHODS.map((m) => (
          <button
            key={m.label}
            type="button"
            className="viz-btn viz-mono"
            aria-pressed={method?.label === m.label}
            onClick={() => setMethod(m)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="viz-panel sb-result" aria-live="polite">
        {method ? (
          <>
            <code className="viz-mono">
              {method.code(lit)} <span className="jv-muted">→</span>{' '}
              <strong className="sb-value">{show(result)}</strong>
            </code>
            {method.makesString && (
              <div className="sb-new viz-fade" key={`${method.label}-${text}`}>
                <span className="viz-label">new string</span>
                <div className="viz-scroll">
                  <ol className="sb-row">
                    {tiles(String(result)).map((t, i) => (
                      <li key={i} className="sb-tile is-new">
                        <span className="sb-ch">{t.ch === ' ' ? '␣' : t.ch}</span>
                        <span className="sb-idx viz-mono">{t.at}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <span className="sb-badge">original is unchanged (strings are immutable)</span>
              </div>
            )}
          </>
        ) : (
          <span className="jv-muted">Pick a method to see what it returns.</span>
        )}
      </div>

      <TemplateBuilder />
    </div>
  );
}

function TemplateBuilder() {
  const [name, setName] = useState('Riya');
  const [count, setCount] = useState('3');
  const id = useId();
  const output = `Hi ${name}, you have ${count} messages`;

  return (
    <div className="sb-template">
      <p className="viz-label">Template literal builder</p>
      <div className="sb-fields">
        <label htmlFor={`${id}-n`}>
          name
          <input
            id={`${id}-n`}
            value={name}
            maxLength={MAX}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label htmlFor={`${id}-c`}>
          count
          <input
            id={`${id}-c`}
            value={count}
            maxLength={6}
            onChange={(e) => setCount(e.target.value)}
          />
        </label>
      </div>
      <code className="viz-mono sb-tpl">
        `Hi <span className="sb-slot">{'${name}'}</span>, you have{' '}
        <span className="sb-slot sb-slot--2">{'${count}'}</span> messages`
      </code>
      <p className="sb-tpl-out viz-mono" aria-live="polite">
        → "Hi <span className="sb-slot">{name}</span>, you have{' '}
        <span className="sb-slot sb-slot--2">{count}</span> messages"
      </p>
      {/* The output above is also built with a real template literal: */}
      <span className="sr-only">{output}</span>
    </div>
  );
}
