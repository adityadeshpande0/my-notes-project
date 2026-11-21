/**
 * Pure helpers for the code playground. No React here, so they are unit tested.
 *
 * Safety in layers:
 *  1. The code runs in an <iframe sandbox="allow-scripts"> with no same-origin
 *     access: it can't touch this page, its cookies or its storage.
 *  2. `protectLoops` rewrites every loop to call a guard that throws after a
 *     huge number of iterations. Browsers don't always run a sandboxed iframe
 *     on its own thread, so without this, `while (true) {}` could freeze the page.
 *  3. The parent also has a 2-second watchdog that throws the iframe away.
 */

/** Name of the guard function injected into user code. */
export const GUARD = '__loopGuard';
/** Total loop iterations allowed per run. Plenty for any beginner program. */
export const MAX_ITERATIONS = 10_000_000;
/** Console lines forwarded per run, so a chatty loop can't flood the page. */
export const MAX_LINES = 500;
export const LOOP_ERROR = 'StackscapeLoopLimit';

/**
 * Add a guard call to every `for`, `while` and `do…while` loop.
 *   while (x) …            → while (__loopGuard() && (x)) …
 *   for (a; b; c) …        → for (a; __loopGuard() && (b); c) …
 *   for (const v of xs) {  → for (const v of xs) { __loopGuard();
 * Strings, template literals and comments are skipped. Line breaks are kept,
 * so error line numbers still match what the reader typed.
 */
export function protectLoops(code: string): string {
  let out = '';
  let i = 0;
  const n = code.length;

  while (i < n) {
    const ch = code[i];
    const next = code[i + 1];

    // Skip comments and strings untouched.
    if (ch === '/' && next === '/') {
      const end = code.indexOf('\n', i);
      const stop = end === -1 ? n : end;
      out += code.slice(i, stop);
      i = stop;
      continue;
    }
    if (ch === '/' && next === '*') {
      const end = code.indexOf('*/', i + 2);
      const stop = end === -1 ? n : end + 2;
      out += code.slice(i, stop);
      i = stop;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      const stop = skipString(code, i);
      out += code.slice(i, stop);
      i = stop;
      continue;
    }

    // A `for` or `while` keyword (not part of a longer name like `forEach`).
    const kw = /^(for|while)\b/.exec(code.slice(i, i + 6));
    const prev = i > 0 ? code[i - 1] : '';
    if (kw && !/[\w$.]/.test(prev)) {
      const word = kw[1];
      let j = i + word.length;
      while (j < n && /\s/.test(code[j])) j++;
      if (code[j] === '(') {
        const close = matchParen(code, j);
        if (close !== -1) {
          const inner = code.slice(j + 1, close);
          out += code.slice(i, j + 1);
          if (word === 'while') {
            out += `${GUARD}() && (${inner})`;
            out += ')';
            i = close + 1;
            continue;
          }
          const parts = splitTopLevel(inner, ';');
          if (parts.length === 3) {
            const test = parts[1].trim() ? `(${parts[1]})` : 'true';
            out += `${parts[0]}; ${GUARD}() && ${test};${parts[2]})`;
            i = close + 1;
            continue;
          }
          // for…of / for…in: put the guard at the start of a braced body.
          out += inner + ')';
          let k = close + 1;
          while (k < n && /\s/.test(code[k])) k++;
          if (code[k] === '{') {
            out += code.slice(close + 1, k + 1) + ` ${GUARD}();`;
            i = k + 1;
          } else {
            i = close + 1;
          }
          continue;
        }
      }
    }

    out += ch;
    i++;
  }
  return out;
}

/** Index just past the string starting at `start`. */
function skipString(code: string, start: number): number {
  const quote = code[start];
  let i = start + 1;
  while (i < code.length) {
    if (code[i] === '\\') i += 2;
    else if (code[i] === quote) return i + 1;
    else if (quote !== '`' && code[i] === '\n')
      return i; // unterminated: stop at line end
    else i++;
  }
  return code.length;
}

/** Index of the `)` matching the `(` at `open`, or -1. */
function matchParen(code: string, open: number): number {
  let depth = 0;
  for (let i = open; i < code.length; i++) {
    const c = code[i];
    if (c === '"' || c === "'" || c === '`') {
      i = skipString(code, i) - 1;
      continue;
    }
    if (c === '(') depth++;
    else if (c === ')' && --depth === 0) return i;
  }
  return -1;
}

/** Split on `sep`, ignoring separators inside brackets or strings. */
function splitTopLevel(text: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let last = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'" || c === '`') {
      i = skipString(text, i) - 1;
      continue;
    }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === sep && depth === 0) {
      parts.push(text.slice(last, i));
      last = i + 1;
    }
  }
  parts.push(text.slice(last));
  return parts;
}

/** Theme colours passed into the iframe, so the page preview matches the site. */
export interface FrameTheme {
  bg: string;
  text: string;
  accent: string;
  border: string;
}

export const PAGE_HTML = `<h1>Hello, page!</h1>
<button type="button">Change it</button>`;

/**
 * Build the whole iframe document. The prelude replaces console.* with
 * functions that post each line to the parent, then the reader's code runs,
 * then a last script posts "done".
 */
export function buildSrcdoc(code: string, runId: string, theme: FrameTheme): string {
  const safe = protectLoops(code).replace(/<\/script/gi, '<\\/script');
  const before = `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; padding: 14px; background: ${theme.bg}; color: ${theme.text};
         font: 15px/1.5 Inter, system-ui, sans-serif; }
  h1 { margin: 0 0 12px; font: 600 22px/1.2 "Space Grotesk", system-ui, sans-serif; }
  button { padding: 6px 12px; border: 1px solid ${theme.accent}; border-radius: 10px;
           background: transparent; color: ${theme.accent}; font: inherit; cursor: pointer; }
</style></head>
<body>
${PAGE_HTML}
<script>
(function () {
  var RUN = ${JSON.stringify(runId)};
  var lines = 0, iterations = 0;
  function send(msg) { msg.run = RUN; parent.postMessage(msg, "*"); }
  function show(v) {
    if (typeof v === "string") return v;
    if (v instanceof Error) return v.name + ": " + v.message;
    if (typeof v === "function") return String(v);
    if (v === undefined) return "undefined";
    if (typeof v === "bigint") return v + "n";
    try { var s = JSON.stringify(v); return s === undefined ? String(v) : s; }
    catch (e) { return String(v); }
  }
  ["log", "info", "warn", "error"].forEach(function (level) {
    console[level] = function () {
      if (++lines > ${MAX_LINES}) {
        if (lines === ${MAX_LINES} + 1) send({ type: "log", level: "warn", text: "… more lines hidden" });
        return;
      }
      send({ type: "log", level: level, text: Array.prototype.map.call(arguments, show).join(" ") });
    };
  });
  window.${GUARD} = function () {
    if (++iterations > ${MAX_ITERATIONS}) throw new Error("${LOOP_ERROR}");
    return true;
  };
  window.onerror = function (message, source, line, col, error) {
    var text = error && error.message === "${LOOP_ERROR}" ? "${LOOP_ERROR}" : String(message);
    send({ type: "error", text: text, line: line });
    return true;
  };
  window.addEventListener("unhandledrejection", function (e) {
    send({ type: "error", text: "Uncaught (in promise) " + show(e.reason) });
  });
})();
</script>
<script>
`;
  const after = `
</script>
<script>parent.postMessage({ type: "done", run: ${JSON.stringify(runId)} }, "*");</script>
</body></html>`;
  return before + safe + after;
}

/** Line in the srcdoc where the reader's code starts, for mapping error lines back. */
export function codeStartLine(theme: FrameTheme): number {
  const marker = '\u0000CODE\u0000';
  const doc = buildSrcdoc(marker, 'x', theme);
  return doc.slice(0, doc.indexOf(marker)).split('\n').length;
}
