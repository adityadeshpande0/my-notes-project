import { useState, type ReactNode } from 'react';

/** Java and JavaScript side by side. Pick a topic to flip both answers over. */

interface Row {
  topic: string;
  java: ReactNode;
  js: ReactNode;
}

const ROWS: Row[] = [
  {
    topic: 'Created by',
    java: 'James Gosling at Sun Microsystems (1995)',
    js: 'Brendan Eich at Netscape (1995)',
  },
  {
    topic: 'Mainly runs',
    java: 'On the JVM: servers, Android, enterprise apps',
    js: 'In browsers, plus Node.js on servers',
  },
  {
    topic: 'Typing',
    java: 'Static: types are declared and checked before running',
    js: 'Dynamic: types are decided while running',
  },
  {
    topic: 'How it runs',
    java: 'Compiled to bytecode first, then run on the JVM',
    js: 'Shipped as source; the engine parses and JIT-compiles it',
  },
  {
    topic: 'Hello world',
    java: (
      <pre className="jj-code viz-mono">{`public class Main {
  public static void main(String[] args) {
    System.out.println("Hi");
  }
}`}</pre>
    ),
    js: <pre className="jj-code viz-mono">{`console.log("Hi");`}</pre>,
  },
];

export default function JavaVsJavaScript() {
  // Which rows have been flipped, and which one was picked last (highlighted).
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const [active, setActive] = useState<number | null>(null);

  const pick = (i: number) => {
    // State must be replaced, not mutated: copy the Set, then change the copy.
    setRevealed((prev) => new Set(prev).add(i));
    setActive(i);
  };
  const all = revealed.size === ROWS.length;

  const card = (lang: 'java' | 'js') => (
    <section
      className={`jj-card jj-card--${lang}`}
      aria-label={lang === 'java' ? 'Java' : 'JavaScript'}
    >
      <p className="jj-name">
        <span aria-hidden="true">{lang === 'java' ? '☕ ' : '⚡ '}</span>
        {lang === 'java' ? 'Java' : 'JavaScript'}
      </p>
      <dl className="jj-rows">
        {ROWS.map((row, i) => {
          const open = revealed.has(i);
          return (
            <div key={row.topic} className={`jj-row ${active === i ? 'is-active' : ''}`}>
              <dt className="viz-label">{row.topic}</dt>
              <dd className={`jj-flip ${open ? 'is-open' : ''}`}>
                {/* Both faces sit in the same grid cell; the back is pre-rotated 180°. */}
                {/* The front is a button too: tap the "?" to reveal this row. It's
                    hidden from the keyboard here because the topic buttons above do the same. */}
                <button
                  type="button"
                  className="jj-face jj-front"
                  aria-hidden={true}
                  tabIndex={-1}
                  onClick={() => pick(i)}
                >
                  <span className="jj-q">?</span> tap to reveal
                </button>
                <span className="jj-face jj-back" aria-hidden={!open}>
                  {row[lang]}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );

  return (
    <div className="viz not-prose">
      <p className="viz-title">Same name, different languages</p>
      <p className="viz-sub">Pick a topic to flip both cards and compare.</p>

      <div className="viz-choices viz-choices--6 jj-chips" role="group" aria-label="Compare">
        {ROWS.map((row, i) => (
          <button
            key={row.topic}
            type="button"
            className="viz-btn"
            aria-pressed={active === i}
            onClick={() => pick(i)}
          >
            {revealed.has(i) ? '✓ ' : ''}
            {row.topic}
          </button>
        ))}
        <button
          type="button"
          className="viz-btn viz-btn--ghost"
          onClick={() => {
            if (all) {
              setRevealed(new Set());
              setActive(null);
            } else setRevealed(new Set(ROWS.map((_, i) => i)));
          }}
        >
          {all ? 'Hide all' : 'Reveal all'}
        </button>
      </div>

      <div className="jj-cards">
        {card('java')}
        {card('js')}
      </div>

      <p className="jj-foot">
        “Java is to JavaScript as car is to carpet.”{' '}
        <span role="img" aria-label="car is not carpet">
          🚗 ≠ 🧶
        </span>
      </p>
    </div>
  );
}
