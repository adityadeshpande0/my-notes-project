import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { ARTICLES, articlesUsed, FEATURES, type FeatureId } from './lib/features';
import { buildSrcdoc } from './lib/srcdoc';
import css from './reference/vanilla/style.css?raw';
import html from './reference/vanilla/index.html?raw';
import js from './reference/vanilla/script.js?raw';
import TodoFrame, { StorageNote } from './TodoFrame';
import { useTodoFrame } from './useTodoFrame';

/**
 * #1 The finished app, and where every idea came from. The real plain-JS
 * app runs on the left (sandboxed); hovering or focusing a feature, or
 * using it in the app, lights up the articles it uses on the course map.
 *
 * React idea: one piece of state drives two views. `active` (which feature
 * is lit) is set by the feature buttons AND by messages from the app, and
 * both the list and the map just read it.
 */
const SEED = ['Buy milk', 'Make chai', 'Call Riya'];
const CAUSE_TO_FEATURE: Record<string, FeatureId> = {
  add: 'add',
  toggle: 'toggle',
  delete: 'delete',
  filter: 'filter',
  clear: 'clear',
};

export default function FeatureMap() {
  const srcDoc = useMemo(() => buildSrcdoc({ html, css, js }), []);
  const [active, setActive] = useState<FeatureId | null>(null);
  const [fromApp, setFromApp] = useState(false);
  const { frame, ready, send } = useTodoFrame((m) => {
    const f = CAUSE_TO_FEATURE[m.cause];
    if (f) {
      setActive(f);
      setFromApp(true);
    }
  });
  // Three starter tasks, typed in by the "robot" when the app is ready.
  useEffect(() => {
    if (ready) send({ type: 'addMany', texts: SEED });
  }, [ready, send]);

  const feature = FEATURES.find((f) => f.id === active);
  const lit = new Map(feature?.uses.map((u) => [u.n, u.what]));
  const used = articlesUsed().length;

  return (
    <div className="viz not-prose td-featuremap">
      <p className="viz-title">The finished app, and where every idea came from</p>
      <p className="viz-sub">
        Use the app, or hover a feature, to see which articles it’s built from.
      </p>
      <div className="td-split">
        <div>
          <TodoFrame
            frameRef={frame}
            srcDoc={srcDoc}
            title="Chai To-Do, the finished plain-JavaScript app"
          />
          <StorageNote />
        </div>
        <div>
          <ul className="td-features" aria-label="Features">
            {FEATURES.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  className={`td-feature ${active === f.id ? 'is-on' : ''}`}
                  aria-pressed={active === f.id}
                  onMouseEnter={() => (setActive(f.id), setFromApp(false))}
                  onFocus={() => (setActive(f.id), setFromApp(false))}
                  onClick={() => (setActive(f.id), setFromApp(false))}
                >
                  <span aria-hidden="true">{f.icon}</span> {f.name}
                </button>
              </li>
            ))}
          </ul>
          <ol className="td-map" aria-label="The course map" aria-live="polite">
            {ARTICLES.map((a, i) => {
              const what = lit.get(a.n);
              return (
                <li
                  key={a.n}
                  className={`td-stop ${what ? 'is-lit' : ''}`}
                  style={{ '--i': i } as CSSProperties}
                >
                  <Link to={`/javascript/${a.slug}`} className="td-chip">
                    <span aria-hidden="true">{a.icon}</span> #{a.n} {a.title}
                  </Link>
                  {what && <span className="td-what viz-mono">{what}</span>}
                </li>
              );
            })}
          </ol>
          <p className="td-small" aria-live="polite">
            {feature
              ? `${feature.icon} ${feature.name}${fromApp ? ' (you just used it)' : ''}: ${feature.uses.length} article${feature.uses.length > 1 ? 's' : ''}.`
              : 'Pick a feature to light up its articles.'}
          </p>
          <p className="td-badge">
            This small app uses ideas from <strong>{used} of 13</strong> articles.
          </p>
        </div>
      </div>
    </div>
  );
}
