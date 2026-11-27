/**
 * Build the sandboxed preview of a plain-JS stage: its HTML with the CSS and
 * the script inlined, plus (in this preview copy only, never in the
 * reference files) a small bridge script that lets the visual drive the app
 * and hear what happened, through postMessage.
 *
 * The iframe is sandboxed without allow-same-origin, so localStorage throws
 * inside it. The app's own try/catch (article #7) keeps it working.
 */
import { countChanges } from './domChanges';
import { driveTodo } from './drive';

export interface Files {
  html: string;
  css: string;
  js: string;
}

/** Messages the bridge sends up to the page. */
export type BridgeMessage =
  | { from: 'chai-todo'; type: 'ready' }
  | {
      from: 'chai-todo';
      type: 'state';
      todos: { id: string; text: string; done: boolean }[] | null;
      changes: ReturnType<typeof countChanges> | null;
      cause: string;
    };

/** The bridge script, built from the SAME driveTodo and countChanges the page uses. */
function bridge() {
  return `
(function () {
  var driveTodo = ${driveTodo.toString()};
  var countChanges = ${countChanges.toString()};
  var parentWin = window.parent;
  var list = document.querySelector('#todo-list');
  var records = [];
  function readTodos() {
    // The app's \`todos\` is a top-level let: other classic scripts can read it by name.
    try { return typeof todos === 'undefined' ? null : JSON.parse(JSON.stringify(todos)); } catch (e) { return null; }
  }
  var pending = null;
  function report(cause) {
    clearTimeout(pending);
    pending = setTimeout(function () {
      var changes = list ? countChanges(records.splice(0), list) : null;
      parentWin.postMessage({ from: 'chai-todo', type: 'state', todos: readTodos(), changes: changes, cause: cause }, '*');
    }, 30);
  }
  if (list) {
    new MutationObserver(function (r) { records.push.apply(records, r); })
      .observe(list, { subtree: true, childList: true, attributes: true, attributeOldValue: true });
  }
  // What the user did by hand (for the feature map), reported after the app reacts.
  document.addEventListener('submit', function () { report('add'); }, true);
  document.addEventListener('change', function (e) { if (e.target.matches && e.target.matches('.toggle')) report('toggle'); }, true);
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : null;
    if (!t) return;
    if (t.closest('.delete')) report('delete');
    else if (t.closest('[data-filter]')) report('filter');
    else if (t.closest('#clear-done')) report('clear');
  }, true);
  window.addEventListener('message', function (e) {
    if (e.source !== parentWin) return; // only the page that made this frame may drive it
    var d = e.data;
    if (!d || d.to !== 'chai-todo') return;
    records.length = 0;
    driveTodo(document, d.action).then(function () { report('robot'); });
  });
  parentWin.postMessage({ from: 'chai-todo', type: 'ready' }, '*');
  report('load');
})();`;
}

/**
 * Preview-only CSS (never in the reference files): in a narrow preview, the
 * text input's default minimum width pushes the Add button out of the card,
 * so let it shrink. Phones would show the same thing with the reference CSS.
 */
export const PREVIEW_FIX = '#todo-input { min-width: 0; }';

export function buildSrcdoc({ html, css, js }: Files): string {
  // Inline the stylesheet and the script. The script moves to the end of
  // <body> (an inline script can't be deferred) so the elements exist first.
  let doc = html.replace(
    /<link rel="stylesheet" href="style\.css">/,
    () => `<style>\n${css}/* preview only */ ${PREVIEW_FIX}\n</style>`,
  );
  doc = doc.replace(/\s*<script src="script\.js" defer><\/script>/, '');
  return doc.replace(
    '</body>',
    () => `<script>\n${js}\n</script>\n<script>${bridge()}</script>\n</body>`,
  );
}
