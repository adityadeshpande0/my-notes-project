import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { C } from '../core/colors';
import { buildSrcdoc, codeStartLine, LOOP_ERROR, type FrameTheme } from './playground';

/**
 * Write and run real JavaScript, safely. The code runs inside a sandboxed
 * iframe (see playground.ts for the safety layers); this component is the
 * editor, the buttons and the console.
 */

const TIMEOUT_MS = 2000;

const PRESETS = [
  { id: 'hello', name: 'Hello, world', code: `console.log("Hello, Stackscape! 👋");` },
  {
    id: 'vars',
    name: 'Variables',
    code: `let cups = 2;
const flavour = "masala chai";
cups = cups + 1; // let can change, const can't

console.log(\`I've had \${cups} cups of \${flavour} today.\`);
console.log({ cups, flavour });`,
  },
  {
    id: 'function',
    name: 'A function',
    code: `function add(a, b) {
  return a + b;
}

console.log(add(2, 3));
console.log(add(10, -4));
console.log(add("2", 3)); // what happens with text?`,
  },
  {
    id: 'loop',
    name: 'Loop',
    code: `// Try changing 5 to 8. Or change row++ to row-- to see
// what happens with an infinite loop (it's safe here).
for (let row = 1; row <= 5; row++) {
  console.log("*".repeat(row));
}`,
  },
  {
    id: 'dom',
    name: 'Change the page (DOM)',
    page: true,
    code: `const title = document.querySelector("h1");
const button = document.querySelector("button");

button.addEventListener("click", () => {
  title.textContent = "You changed the page!";
  title.style.color = "tomato";
});

console.log("Now click the button in the Page panel.");`,
  },
  {
    id: 'async',
    name: 'Async taste',
    code: `console.log("1: start");

setTimeout(() => console.log("4: after 1000 ms"), 1000);
setTimeout(() => console.log("3: after 0 ms"), 0);

console.log("2: end of the script");
// The timers print last, even the 0 ms one.
// The Event Loop visual above shows why.`,
  },
] as const;

type PresetId = (typeof PRESETS)[number]['id'];

interface Line {
  level: 'log' | 'info' | 'warn' | 'error' | 'system';
  text: string;
}

/** Read the current theme's colours so the iframe page matches light or dark mode. */
function readTheme(): FrameTheme {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return { bg: v('--bg'), text: v('--text'), accent: v('--accent'), border: v('--border') };
}

export default function CodePlayground() {
  const [presetId, setPresetId] = useState<PresetId>('hello');
  // Edited code is kept per preset, so switching presets never loses your work.
  const [codes, setCodes] = useState<Record<string, string>>(() =>
    Object.fromEntries(PRESETS.map((p) => [p.id, p.code])),
  );
  const [lines, setLines] = useState<Line[]>([]);
  const [run, setRun] = useState<{ id: string; doc: string; offset: number } | null>(null);
  const [running, setRunning] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const escaped = useRef(false); // after Esc, Tab leaves the editor instead of indenting

  const preset = PRESETS.find((p) => p.id === presetId)!;
  const code = codes[presetId];
  const showPage = 'page' in preset;

  // Listen for messages from the iframe. Only trust ones that come from *our*
  // iframe (event.source) and from the current run (its id).
  useEffect(() => {
    if (!run) return;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const msg = e.data as {
        run?: string;
        type?: string;
        level?: Line['level'];
        text?: string;
        line?: number;
      };
      if (msg?.run !== run.id) return;
      if (msg.type === 'done') setRunning(false);
      else if (msg.type === 'log')
        setLines((l) => [...l, { level: msg.level ?? 'log', text: String(msg.text) }]);
      else if (msg.type === 'error') {
        const text =
          msg.text === LOOP_ERROR
            ? '⏱ Stopped: your code ran too long (infinite loop?)'
            : msg.line && msg.line >= run.offset
              ? `${msg.text} (line ${msg.line - run.offset + 1})`
              : String(msg.text);
        setLines((l) => [...l, { level: 'error', text }]);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [run]);

  // The watchdog: if the code hasn't finished within 2 s, throw the iframe away.
  useEffect(() => {
    if (!running || !run) return;
    const t = window.setTimeout(() => {
      setRunning(false);
      setRun(null); // unmounts the iframe, which stops anything still running in it
      setLines((l) => [
        ...l,
        { level: 'error', text: '⏱ Stopped: your code ran too long (infinite loop?)' },
      ]);
    }, TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [running, run]);

  const execute = () => {
    const theme = readTheme();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setLines([]);
    setRunning(true);
    // A new run id means a new `key` on the iframe below, so React builds a fresh
    // one: old timers and listeners from the previous run disappear with it.
    setRun({ id, doc: buildSrcdoc(code, id, theme), offset: codeStartLine(theme) });
  };

  const setCode = (value: string) => setCodes((c) => ({ ...c, [presetId]: value }));

  const onEditorKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      execute();
      return;
    }
    if (e.key === 'Escape') {
      escaped.current = true;
      return;
    }
    if (e.key === 'Tab' && !e.shiftKey && !escaped.current) {
      e.preventDefault();
      const el = e.currentTarget;
      el.setRangeText('  ', el.selectionStart, el.selectionEnd, 'end');
      setCode(el.value);
      return;
    }
    escaped.current = false;
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="viz not-prose">
      <p className="viz-title">Write real JavaScript</p>
      <p className="viz-sub">
        Pick an example, edit it, and press Run. It runs in a sealed-off sandbox, so you can’t break
        anything.
      </p>

      <div className="pg-toolbar">
        <label className="pg-select">
          <span className="viz-label" style={{ margin: 0 }}>
            Example
          </span>
          <select value={presetId} onChange={(e) => setPresetId(e.target.value as PresetId)}>
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="viz-btn"
          onClick={() => setCode(preset.code)}
          disabled={code === preset.code}
        >
          Reset
        </button>
        <button type="button" className="viz-btn viz-btn--primary" onClick={execute}>
          Run ▶
        </button>
      </div>

      <div className="pg-editor">
        <div className="pg-gutter viz-mono" ref={gutterRef} aria-hidden="true">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          className="viz-mono"
          value={code}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Code editor"
          aria-describedby="pg-hint"
          rows={Math.max(6, lineCount + 1)}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={onEditorKey}
          onScroll={(e) => {
            if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
          }}
        />
      </div>
      <p id="pg-hint" className="pg-hint">
        <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd> runs · <kbd>Tab</kbd> indents ·{' '}
        <kbd>Esc</kbd> then <kbd>Tab</kbd> leaves the editor
      </p>

      <div className={`pg-out ${showPage ? 'has-page' : ''}`}>
        <section className="viz-panel" aria-label="Console">
          <div className="viz-label">Console</div>
          <div className="pg-console viz-mono" role="log" aria-live="polite">
            {lines.length === 0 ? (
              <span style={{ color: C.muted }}>
                {running ? 'Running…' : 'Press Run to see output here.'}
              </span>
            ) : (
              lines.map((l, i) => (
                <div key={i} className={`pg-line pg-line--${l.level}`}>
                  {l.text}
                </div>
              ))
            )}
          </div>
        </section>

        {/* The iframe always exists while a run is active (it's where the code lives);
            it's only *visible* for the DOM example. */}
        <section className="viz-panel pg-page" aria-label="Page" hidden={!showPage}>
          <div className="viz-label">Page</div>
          {run ? (
            <iframe
              key={run.id}
              ref={iframeRef}
              title="Your page"
              sandbox="allow-scripts"
              srcDoc={run.doc}
            />
          ) : (
            <p className="pg-hint" style={{ margin: 0 }}>
              Press Run to load the page.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
