import { useEffect, useState } from 'react';
import { useReducedMotion } from '../../lib/hooks';

/**
 * HTML = structure, CSS = looks, JavaScript = behaviour. Three switches turn
 * each layer on and off on a tiny fake web page.
 */

type Layer = 'html' | 'css' | 'js';

const LAYERS: { id: Layer; name: string; analogy: string }[] = [
  { id: 'html', name: 'HTML', analogy: 'the walls and rooms' },
  { id: 'css', name: 'CSS', analogy: 'the paint and furniture' },
  { id: 'js', name: 'JavaScript', analogy: 'the electricity' },
];

const SOURCE: Record<Layer, string> = {
  html: `<h1>Welcome to Chai Corner ☕</h1>
<p>Fresh chai, slow mornings. <a href="/menu">See the menu</a></p>
<button id="theme">Dark mode</button>
<button id="like">Like ♥ 0</button>`,
  css: `body   { font-family: "Inter", sans-serif; }
.card  { padding: 20px; border-radius: 14px; }
button { border-radius: 10px; background: periwinkle; }`,
  js: `let likes = 0;
like.addEventListener("click", () => {
  likes = likes + 1;
  like.textContent = "Like ♥ " + likes;
});
theme.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});`,
};

export default function WebsiteLayers() {
  const [on, setOn] = useState<Record<Layer, boolean>>({ html: true, css: false, js: false });
  const [likes, setLikes] = useState(0);
  const [dark, setDark] = useState(false);
  // A changing number restarts a CSS animation: React remounts an element when its `key` changes.
  const [shake, setShake] = useState<{ id: string; n: number } | null>(null);
  const [toast, setToast] = useState<{ text: string; n: number } | null>(null);
  const [exploded, setExploded] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const reduced = useReducedMotion();

  // Effects with a cleanup: each new toast cancels the previous hide-timer.
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!exploded) return;
    const t = window.setTimeout(() => setExploded(false), 700);
    return () => window.clearTimeout(t);
  }, [exploded]);

  const toggle = (layer: Layer) => {
    const next = { ...on, [layer]: !on[layer] };
    setOn(next);
    // Turning JavaScript off wipes its memory, so the page starts over.
    // We reset here, in the event handler, rather than in an effect that
    // watches `on.js`: it's simpler and avoids an extra render.
    if (layer === 'js' && !next.js) {
      setLikes(0);
      setDark(false);
    }
    setShake(null);
    if (!reduced) setExploded(true);
  };

  const press = (id: 'like' | 'theme') => {
    if (!on.js) {
      setShake((s) => ({ id, n: (s?.n ?? 0) + 1 }));
      return;
    }
    if (id === 'like') {
      const n = likes + 1;
      setLikes(n);
      setToast({ text: `click → likes = ${n}`, n: Date.now() });
    } else {
      setDark(!dark);
      setToast({ text: `click → theme = "${dark ? 'light' : 'dark'}"`, n: Date.now() });
    }
  };

  const caption = !on.html
    ? 'No HTML = nothing on the page at all. CSS and JavaScript have nothing to style or control.'
    : shake && on.css
      ? 'Looks great… but nothing happens. No JavaScript!'
      : shake
        ? 'Click all you like: without JavaScript, a button is just a picture of a button.'
        : !on.css && !on.js
          ? 'Plain HTML: the content is all there, in the browser’s default look. The buttons do nothing.'
          : !on.css
            ? 'The buttons work, but nothing is styled. Behaviour without looks.'
            : !on.js
              ? 'CSS makes it look finished. Now try the buttons.'
              : 'All three layers: structure, style and behaviour. Try the buttons.';

  const pageClass = ['wl-page', on.css ? 'is-styled' : 'is-raw', dark ? 'is-dark' : ''].join(' ');

  return (
    <div className="viz not-prose">
      <p className="viz-title">Build a webpage, layer by layer</p>
      <p className="viz-sub">Switch each layer on and off and watch what the page can do.</p>

      <div className="wl-grid">
        <div className="wl-side">
          {LAYERS.map((l) => (
            <button
              key={l.id}
              type="button"
              role="switch"
              aria-checked={on[l.id]}
              className="wl-switch"
              onClick={() => toggle(l.id)}
            >
              <span className="wl-track" aria-hidden="true">
                <span className="wl-thumb" />
              </span>
              <span>
                <strong>{l.name}</strong>
                <span className="wl-analogy">{l.analogy}</span>
              </span>
            </button>
          ))}

          {/* Decorative: the three layers as stacked planes that pop apart on each toggle. */}
          <div className={`wl-planes ${exploded ? 'is-exploded' : ''}`} aria-hidden="true">
            {(['js', 'css', 'html'] as Layer[]).map((l, i) => (
              <div
                key={l}
                className={`wl-plane wl-plane--${l} ${on[l] ? 'is-on' : ''}`}
                style={{ '--i': i } as React.CSSProperties}
              >
                {l.toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        <div className="wl-browser">
          <div className="wl-bar" aria-hidden="true">
            <span className="wl-dots">
              <i />
              <i />
              <i />
            </span>
            <span className="wl-url viz-mono">my-first-site.com</span>
          </div>
          <div className="wl-viewport">
            {on.html ? (
              <div className={pageClass}>
                <h4>Welcome to Chai Corner ☕</h4>
                <p>
                  Fresh chai, slow mornings.{' '}
                  <a href="#menu" onClick={(e) => e.preventDefault()}>
                    See the menu
                  </a>
                </p>
                <div className="wl-buttons">
                  <button
                    type="button"
                    key={`theme-${shake?.id === 'theme' ? shake.n : 0}`}
                    className={shake?.id === 'theme' ? 'wl-shake' : ''}
                    onClick={() => press('theme')}
                  >
                    {dark ? 'Light mode' : 'Dark mode'}
                  </button>
                  <button
                    type="button"
                    key={`like-${shake?.id === 'like' ? shake.n : 0}`}
                    className={shake?.id === 'like' ? 'wl-shake' : ''}
                    onClick={() => press('like')}
                    aria-label={`Like, ${likes} likes`}
                  >
                    Like <span aria-hidden="true">♥</span>{' '}
                    <span key={likes} className={likes ? 'wl-pop' : ''}>
                      {likes}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="wl-empty" />
            )}
            {toast && (
              <div key={toast.n} className="wl-toast viz-mono viz-fade" role="status">
                <span aria-hidden="true">⚡ </span>
                {toast.text}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="viz-caption" aria-live="polite">
        {caption}
      </div>

      <div className="viz-controls">
        <button
          type="button"
          className="viz-btn"
          aria-expanded={showCode}
          aria-controls="wl-code"
          onClick={() => setShowCode(!showCode)}
        >
          {showCode ? 'Hide code' : 'Show code'}
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Layers that are off are struck through.
        </span>
      </div>
      {showCode && (
        <div id="wl-code" className="wl-code viz-fade">
          {LAYERS.map((l) => (
            <div key={l.id} className={`wl-src ${on[l.id] ? '' : 'is-off'}`}>
              <div className="viz-label">
                {l.name} {on[l.id] ? '· on' : '· off'}
              </div>
              <pre className="viz-mono">{SOURCE[l.id]}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
