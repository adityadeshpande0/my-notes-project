import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import { ARTICLES, STAGES } from './lib/features';
import { foldDiff, lineDiff, type DiffChunk } from './lib/lineDiff';
import { buildSrcdoc } from './lib/srcdoc';
import TodoFrame, { StorageNote } from './TodoFrame';
import { useTodoFrame } from './useTodoFrame';

/**
 * #2 Build it in 7 stages. Each stage is a complete, working snapshot
 * (stages/1 … stages/7, the last one identical to the reference). "What
 * changed" diffs this stage against the one before; "Try it" runs it.
 * The shared Playwright tests check each stage does what it says.
 *
 * React idea: derived values. The diff, the preview's HTML and the "new
 * concepts" are all calculated from ONE piece of state, the stage index,
 * the same way the to-do app derives its counter from `todos`.
 */
const FILES = import.meta.glob('./stages/*/*.{html,css,js}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;
const file = (n: number, name: string) => (n < 1 ? '' : (FILES[`./stages/${n}/${name}`] ?? ''));
const slug = (n: number) => ARTICLES.find((a) => a.n === n)!.slug;

export default function BuildAlong() {
  const s = useStepper(STAGES.length, 6000);
  const stage = STAGES[s.index];
  const n = stage.n;
  const [picked, setPicked] = useState<Record<number, 'script.js' | 'index.html'>>({});
  const [view, setView] = useState<'diff' | 'try'>('diff');
  const [copied, setCopied] = useState('');
  // Stage 1 is all HTML; after that, the changes are in script.js.
  const shownFile = n > 2 ? 'script.js' : (picked[n] ?? (n === 1 ? 'index.html' : 'script.js'));
  const diff = useMemo(
    () => foldDiff(lineDiff(file(n - 1, shownFile), file(n, shownFile))),
    [n, shownFile],
  );
  const added = diff.flatMap((c) => c.lines).filter((l) => l.kind === 'add').length;
  const removed = diff.flatMap((c) => c.lines).filter((l) => l.kind === 'del').length;
  const srcDoc = useMemo(
    () =>
      buildSrcdoc({
        html: file(n, 'index.html'),
        css: file(n, 'style.css'),
        js: file(n, 'script.js'),
      }),
    [n],
  );
  const { frame } = useTodoFrame();
  const seen = new Set(STAGES.slice(0, s.index).flatMap((st) => st.concepts.map((c) => c.name)));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(file(n, 'script.js'));
      setCopied('Copied ✓');
    } catch {
      setCopied('Copying isn’t allowed here: select the code instead.');
    }
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="viz not-prose td-build">
      <p className="viz-title">Build it in 7 stages</p>
      <ol className="td-rail" aria-label="Stages">
        {STAGES.map((st, i) => (
          <li key={st.n}>
            <button
              type="button"
              className={`td-railstep ${i < s.index ? 'is-done' : ''} ${i === s.index ? 'is-current' : ''}`}
              aria-current={i === s.index ? 'step' : undefined}
              // A full name even when the title is hidden on narrow screens.
              aria-label={`Stage ${st.n}: ${st.title}${i < s.index ? ' (done)' : ''}`}
              onClick={() => s.seek(i)}
            >
              <span className="td-railnum">{i < s.index ? '✓' : st.n}</span>
              <span className="td-railicon" aria-hidden="true">
                {st.icon}
              </span>
              <span className="td-railtitle">{st.title}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="td-stagehead">
        <strong>
          Stage {n}: {stage.title}
        </strong>{' '}
        <span className="td-small td-muted">{stage.tryIt}</span>
      </p>
      <ul className="td-concepts" aria-label="Concepts in this stage">
        {stage.concepts.map((c) => (
          <li key={c.name}>
            <Link className="td-concept" to={`/javascript/${slug(c.n)}`}>
              {!seen.has(c.name) && <span aria-label="new">✨ </span>}
              {c.name} · #{c.n}
            </Link>
          </li>
        ))}
      </ul>

      <div role="tablist" aria-label="View" className="viz-seg td-viewtabs">
        {(
          [
            ['diff', 'What changed'],
            ['try', 'Try it'],
          ] as const
        ).map(([id, name]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            className="viz-seg-btn"
            onClick={() => setView(id)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className={`td-panels show-${view}`}>
        <section className="viz-panel td-diffpanel" aria-label="What changed">
          <div className="td-row">
            <span className="viz-label" style={{ margin: 0 }}>
              What changed
            </span>
            {n <= 2 && (
              <span role="group" aria-label="File" className="td-row">
                {(['index.html', 'script.js'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className="viz-btn viz-mono td-filebtn"
                    aria-pressed={shownFile === f}
                    onClick={() => setPicked((p) => ({ ...p, [n]: f }))}
                  >
                    {f}
                  </button>
                ))}
              </span>
            )}
            {n > 2 && <span className="viz-mono td-small">script.js</span>}
            <span className="td-small">
              <span className="td-add">+{added}</span> <span className="td-del">−{removed}</span>
            </span>
          </div>
          <Diff key={`${n}-${shownFile}`} chunks={diff} />
          <div className="td-row td-gap">
            <button type="button" className="viz-btn" onClick={copy}>
              Copy this stage’s code
            </button>
            <span className="td-small" aria-live="polite">
              {copied}
            </span>
          </div>
        </section>
        <section className="viz-panel td-trypanel" aria-label="Try it">
          <div className="viz-label">Try it: stage {n}</div>
          <TodoFrame
            frameRef={frame}
            srcDoc={srcDoc}
            title={`Chai To-Do, stage ${n}`}
            height={400}
          />
          {n >= 6 && <StorageNote />}
        </section>
      </div>
      <StepControls s={s} />
    </div>
  );
}

function Diff({ chunks }: { chunks: DiffChunk[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  if (chunks.every((c) => c.lines.every((l) => l.kind === 'same')))
    return <p className="td-small td-muted">No changes in this file at this stage.</p>;
  return (
    <pre className="td-diff viz-mono" aria-label="The changes, line by line">
      {chunks.map((c, i) =>
        c.kind === 'fold' && !open.has(i) ? (
          <button
            key={i}
            type="button"
            className="td-fold"
            onClick={() => setOpen((o) => new Set(o).add(i))}
          >
            ⋯ {c.lines.length} unchanged lines
          </button>
        ) : (
          c.lines.map((l, k) => (
            <div key={`${i}-${k}`} className={`td-line is-${l.kind}`}>
              <span
                className="td-sign"
                aria-label={l.kind === 'add' ? 'added' : l.kind === 'del' ? 'removed' : undefined}
              >
                {l.kind === 'add' ? '+' : l.kind === 'del' ? '−' : ' '}
              </span>
              {l.text || ' '}
            </div>
          ))
        ),
      )}
    </pre>
  );
}
