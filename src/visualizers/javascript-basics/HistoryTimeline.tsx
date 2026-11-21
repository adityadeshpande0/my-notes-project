import { useEffect, useRef, type KeyboardEvent } from 'react';
import { useReducedMotion } from '../../lib/hooks';
import { C } from '../core/colors';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';

/** The big moments in JavaScript's history, on a horizontal track. */

interface Event {
  year: string;
  title: string;
  text: string;
  icon: string;
}

const EVENTS: Event[] = [
  {
    year: '1993',
    title: 'Mosaic and the first popular browsers',
    text: 'The web is mostly static documents: text, images and links. Every click asks a server for a whole new page.',
    icon: '📄',
  },
  {
    year: 'May 1995',
    title: 'Mocha is born',
    text: 'Netscape wants a simple language that lives inside the browser. Brendan Eich writes the first version in about 10 days.',
    icon: '🌱',
  },
  {
    year: 'Sep 1995',
    title: 'Renamed LiveScript',
    text: 'The language ships under its second name in a beta of Netscape Navigator 2.0.',
    icon: '🏷️',
  },
  {
    year: 'Dec 1995',
    title: 'Becomes JavaScript',
    text: 'Renamed alongside Netscape’s partnership with Sun, partly to ride the popularity of Sun’s Java. The two languages are otherwise unrelated.',
    icon: '☕',
  },
  {
    year: '1996',
    title: 'Microsoft’s JScript',
    text: 'Internet Explorer 3 ships its own compatible version, called JScript. Two slightly different JavaScripts: the browser wars begin.',
    icon: '⚔️',
  },
  {
    year: '1997',
    title: 'ECMAScript 1',
    text: 'To settle the differences, Ecma International publishes the first official standard, ECMA-262. JavaScript now has a rulebook.',
    icon: '📘',
  },
  {
    year: '1999',
    title: 'ES3',
    text: 'Adds regular expressions, try/catch and more. This is the version the web runs on for about a decade.',
    icon: '🧱',
  },
  {
    year: '2005',
    title: '“Ajax”',
    text: 'Gmail (2004) and Google Maps (2005) update without reloading the page, and the term Ajax is coined. People start taking JavaScript seriously.',
    icon: '🗺️',
  },
  {
    year: '2006',
    title: 'jQuery',
    text: 'A library that makes cross-browser JavaScript easy. It goes on to be used on a huge share of websites.',
    icon: '🧰',
  },
  {
    year: '2008',
    title: 'Chrome and V8',
    text: 'Google’s V8 engine compiles JavaScript to machine code and makes it dramatically faster. The speed race between browsers begins.',
    icon: '🚀',
  },
  {
    year: '2009',
    title: 'Node.js and ES5',
    text: 'Ryan Dahl takes V8 out of the browser to run JavaScript on servers. The same year, ES5 adds strict mode and JSON.',
    icon: '🖥️',
  },
  {
    year: '2012',
    title: 'TypeScript',
    text: 'Microsoft releases TypeScript: JavaScript with optional types, checked before the code runs.',
    icon: '🔷',
  },
  {
    year: '2013',
    title: 'React',
    text: 'Facebook open-sources React, a library for building user interfaces out of components. (Hello, next track!)',
    icon: '⚛️',
  },
  {
    year: '2015',
    title: 'ES6 / ES2015',
    text: 'The biggest upgrade ever: let/const, arrow functions, classes, modules and promises. From now on, a new edition every year.',
    icon: '🎉',
  },
  {
    year: '2017',
    title: 'async/await',
    text: 'Writing asynchronous code finally reads like normal, top-to-bottom code.',
    icon: '⏳',
  },
  {
    year: '2026',
    title: 'ES2026',
    text: 'The 17th edition, approved on 30 June 2026, adds handy built-ins like Math.sumPrecise, Map.prototype.getOrInsert and Array.fromAsync.',
    icon: '✨',
  },
];

/** Eras drawn as coloured bands behind the track: [first event index, last event index]. */
const ERAS = [
  { name: 'Birth', years: '1995–97', from: 1, to: 4, color: C.active },
  { name: 'Browser wars', years: '1997–2004', from: 5, to: 6, color: C.danger },
  { name: 'Renaissance', years: '2005–2014', from: 7, to: 12, color: C.violet },
  { name: 'Modern JS', years: '2015–today', from: 13, to: 15, color: C.accent },
];

const GAP = 76; // px between dots
const PAD = 40; // px before the first dot

export default function HistoryTimeline() {
  const s = useStepper(EVENTS.length, 3000);
  const ev = EVENTS[s.index];
  const scrollRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const reduced = useReducedMotion();

  // Keep the active dot in view when it changes (Play, Prev/Next, or keys).
  // An effect is right here: scrolling is a side effect on the DOM, outside React.
  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    const x = PAD + s.index * GAP - box.clientWidth / 2;
    box.scrollTo({ left: x, behavior: reduced ? 'auto' : 'smooth' });
  }, [s.index, reduced]);

  const onDotKey = (e: KeyboardEvent) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    const to =
      e.key === 'Home' ? 0 : e.key === 'End' ? EVENTS.length - 1 : dir ? s.index + dir : -1;
    if (to < 0 || to >= EVENTS.length) return;
    e.preventDefault();
    s.seek(to);
    dotRefs.current[to]?.focus();
  };

  const width = PAD * 2 + GAP * (EVENTS.length - 1);

  return (
    <div className="viz not-prose">
      <p className="viz-title">The story of JavaScript</p>
      <p className="viz-sub">
        Click a dot, use ← and →, or press Play to walk through thirty years.
      </p>

      <div className="viz-scroll ht-scroll" ref={scrollRef}>
        <div className="ht-track" style={{ width }}>
          {ERAS.map((era) => (
            <div
              key={era.name}
              className="ht-era"
              style={{
                left: PAD + era.from * GAP - GAP / 2 + 4,
                width: (era.to - era.from + 1) * GAP - 8,
                ['--era' as string]: era.color,
              }}
            >
              <span>{era.name}</span> <span className="ht-era-years">{era.years}</span>
            </div>
          ))}
          <div className="ht-line" />
          <div role="group" aria-label="Timeline events" onKeyDown={onDotKey}>
            {EVENTS.map((e, i) => (
              <button
                key={e.year}
                ref={(el) => {
                  dotRefs.current[i] = el;
                }}
                type="button"
                className="ht-dot"
                style={{ left: PAD + i * GAP }}
                aria-current={i === s.index ? 'step' : undefined}
                aria-label={`${e.year}: ${e.title}`}
                // Roving tabindex: only the active dot is a Tab stop; arrows move between dots.
                tabIndex={i === s.index ? 0 : -1}
                onClick={() => s.seek(i)}
              >
                <span className="ht-dot-mark" data-past={i < s.index || undefined} />
                <span className="ht-dot-year viz-mono">{e.year}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* `key` remounts the card for each event, which replays the viz-fade entrance. */}
      <div key={s.index} className="ht-card viz-fade" aria-live="polite">
        <span className="ht-icon" aria-hidden="true">
          {ev.icon}
        </span>
        <div>
          <p className="ht-year viz-mono">{ev.year}</p>
          <p className="ht-title">{ev.title}</p>
          <p className="ht-text">{ev.text}</p>
        </div>
      </div>

      <StepControls s={s} />
    </div>
  );
}
