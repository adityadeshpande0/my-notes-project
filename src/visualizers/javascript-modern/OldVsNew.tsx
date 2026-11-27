import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { CodeMorph, Tabs } from '../core/code';
import { morphBetween } from '../core/code/morph';
import {
  allFeatures,
  detect,
  EDITIONS,
  learnedCount,
  TC39_STAGES,
  type Feature,
} from './lib/esTimeline';
import { CARDS, type Card } from './lib/oldNew';

/**
 * #3 Then vs now, plus the yearly timeline. Each card morphs old-style code
 * into the modern version (the shared CodeMorph, first built for article #5)
 * and "Run both" calls the two REAL functions (lib/oldNew.ts). The timeline's
 * "Supported in your browser?" is a live, safe feature check.
 *
 * React idea: useMemo for work that only depends on fixed inputs. Splitting
 * each card's code into tokens is done once per card, not on every render.
 */
type TabId = 'cards' | 'timeline';

const SLUGS: Record<number, string> = {
  2: 'variables-and-data-types',
  3: 'operators-and-conditions',
  4: 'loops',
  5: 'functions',
  6: 'arrays',
  7: 'objects-and-json',
  11: 'async',
  13: 'modern-javascript',
};

export default function OldVsNew() {
  return (
    <div className="viz not-prose mj-oldnew">
      <p className="viz-title">Then vs now</p>
      <Tabs<TabId>
        label="Parts of this visual"
        tabs={[
          { id: 'cards', name: 'Then vs now' },
          { id: 'timeline', name: 'Timeline' },
        ]}
      >
        {(t) => (t === 'cards' ? <Cards /> : <Timeline />)}
      </Tabs>
    </div>
  );
}

function Cards() {
  return (
    <div
      className="mj-cards"
      role="region"
      aria-label="Then vs now cards (scroll sideways on small screens)"
      tabIndex={0}
    >
      {CARDS.map((c) => (
        <MorphCard key={c.id} card={c} />
      ))}
    </div>
  );
}

const fmt = (v: unknown) => (typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v));

function MorphCard({ card }: { card: Card }) {
  const morph = useMemo(
    () =>
      morphBetween([card.oldCode, card.newCode], ['The old way.', card.caption], ['Then', 'Now']),
    [card],
  );
  const [out, setOut] = useState<{ old: unknown; modern: unknown } | null>(null);
  const saved = card.oldCode.length - card.newCode.length;
  return (
    <section className="viz-panel mj-card" aria-label={card.title}>
      <div className="mj-row">
        <strong>{card.title}</strong>
        <span className="mj-badge is-year">{card.year}</span>
        {card.article && (
          <Link className="mj-badge is-article" to={`/javascript/${card.article.slug}`}>
            📘 Article #{card.article.n}
          </Link>
        )}
        {saved > 0 && <span className="mj-badge is-saved">−{saved} characters</span>}
      </div>
      <CodeMorph tokens={morph.tokens} versions={morph.versions} delay={2200} label={card.title} />
      <div className="mj-row">
        <button type="button" className="viz-btn" onClick={async () => setOut(await card.run())}>
          ▶ Run both
        </button>
      </div>
      {out && (
        <dl className="mj-runboth viz-mono" aria-live="polite">
          <dt>old</dt>
          <dd>{fmt(out.old)}</dd>
          <dt>new</dt>
          <dd>{fmt(out.modern)}</dd>
          <dt />
          <dd className={fmt(out.old) === fmt(out.modern) ? 'mj-good' : 'mj-bad'}>
            {fmt(out.old) === fmt(out.modern) ? '✓ the same output' : '✗ different!'}
          </dd>
        </dl>
      )}
    </section>
  );
}

// ─── Tab: Timeline ───────────────────────────────────────────────────

function Timeline() {
  const [year, setYear] = useState(2020);
  const [pick, setPick] = useState<Feature | null>(null);
  const edition = EDITIONS.find((e) => e.year === year)!;
  const total = allFeatures().length;
  const learned = learnedCount();
  const support = pick ? detect(pick) : null;
  return (
    <>
      <p className="mj-celebrate">
        🎉 You’ve met {learned} of these {total} features in this course.
      </p>
      <div className="mj-timeline" role="tablist" aria-label="ECMAScript editions">
        {EDITIONS.map((e) => (
          <button
            key={e.year}
            type="button"
            role="tab"
            aria-selected={e.year === year}
            className={`mj-year ${e.year === year ? 'is-on' : ''}`}
            onClick={() => {
              setYear(e.year);
              setPick(null);
            }}
          >
            <span className="mj-dot" aria-hidden="true" />
            ES{e.year}
            <span className="mj-small mj-muted">{e.features.length}</span>
          </button>
        ))}
      </div>
      <div className="mj-features" role="tabpanel" aria-label={`ES${year} features`}>
        {edition.features.map((f) => (
          <button
            key={f.name}
            type="button"
            className={`mj-feature ${pick?.name === f.name ? 'is-on' : ''} ${f.article ? 'is-learned' : ''}`}
            aria-pressed={pick?.name === f.name}
            onClick={() => setPick(f)}
          >
            {f.name}
            {f.article && <span aria-label={`taught in article ${f.article}`}> 📘</span>}
          </button>
        ))}
      </div>
      {pick && (
        <div className="viz-panel mj-feature-card" aria-live="polite">
          <strong>{pick.name}</strong> <span className="mj-badge is-year">ES{year}</span>
          <p className="mj-small">{pick.explain}</p>
          <pre className="mj-pattern viz-mono">{pick.example}</pre>
          <p className="mj-small">
            Supported in your browser?{' '}
            {support === 'syntax' ? (
              <strong className="mj-good">
                ✅ syntax: supported if this page runs (this site’s own code uses it)
              </strong>
            ) : support === 'unknown' ? (
              <strong className="mj-muted">
                can’t check from here (it needs a module to be loaded)
              </strong>
            ) : support ? (
              <strong className="mj-good">✅ yes</strong>
            ) : (
              <strong className="mj-bad">❌ not yet (check MDN for which browsers have it)</strong>
            )}
          </p>
          {pick.article && (
            <Link className="mj-badge is-article" to={`/javascript/${SLUGS[pick.article]}`}>
              📘 Article #{pick.article}
            </Link>
          )}
        </div>
      )}
      <div className="mj-stages">
        <div className="viz-label">How a feature gets in: TC39’s stages</div>
        <ol>
          {TC39_STAGES.map(([n, text]) => (
            <li key={n}>
              <span className="mj-stage-n viz-mono">{n}</span> {text}
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
