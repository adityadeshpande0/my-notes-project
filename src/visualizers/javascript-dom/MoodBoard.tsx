/**
 * #4 The owner's mood board: a page built with plain HTML, CSS and
 * JavaScript (no React) in public/demos/mood-board/.
 *
 * 👋 Owner: when your index.html, style.css and script.js are ready, change
 * MOOD_BOARD_READY to true. The article then shows your page in an iframe.
 * (A flag, rather than checking for the file at runtime, so the article
 * never makes a request for a page that doesn't exist yet.)
 */
const MOOD_BOARD_READY = false;
const SRC = '/demos/mood-board/index.html';

export default function MoodBoard() {
  if (!MOOD_BOARD_READY)
    return (
      <div className="dm-soon not-prose">
        <h3>🚧 Coming soon: build it yourself!</h3>
        <p>
          This is where your plain-JavaScript mood board will live. Follow the “Your turn” box
          below, then switch it on.
        </p>
      </div>
    );
  return (
    <div className="viz not-prose">
      <p className="viz-title">My Mood Board</p>
      <p className="viz-sub">Plain HTML, CSS and JavaScript. No framework.</p>
      <iframe className="dm-mood" src={SRC} title="Mood board demo" loading="lazy" />
      <p className="dm-small dm-gap">
        <a href={SRC} target="_blank" rel="noopener">
          Open in new tab ↗
        </a>
      </p>
    </div>
  );
}
