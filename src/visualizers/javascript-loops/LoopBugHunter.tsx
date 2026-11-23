import { useState } from 'react';
import { BUG_CASES, GUARD, rankFor, type BugCase, type RunResult } from './lib/bugCases';

/**
 * #8 Find the bug. Six case files: answer, run the loop (simulated, with the
 * 50-lap guard), then see the fix as a diff and run that too. Every output
 * comes from lib/bugCases.ts, tested against real loops.
 */
export default function LoopBugHunter() {
  const [at, setAt] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>(() => BUG_CASES.map(() => null));
  const done = at >= BUG_CASES.length;
  const score = picks.filter((p, k) => p === BUG_CASES[k].answer).length;

  return (
    <div className="viz not-prose">
      <p className="viz-title">Find the bug</p>
      <p className="viz-sub">
        Six case files. Answer the question, then run the loop to see what really happens.
      </p>
      <ol className="jl-case-dots" aria-label="Progress">
        {BUG_CASES.map((c, k) => (
          <li
            key={c.id}
            className={`${k === at ? 'is-on' : ''} ${picks[k] === null ? '' : picks[k] === c.answer ? 'is-right' : 'is-wrong'}`}
            aria-label={`Case ${k + 1}${picks[k] === null ? '' : picks[k] === c.answer ? ', solved' : ', missed'}`}
          >
            {picks[k] === null ? k + 1 : picks[k] === c.answer ? '✓' : '✗'}
          </li>
        ))}
      </ol>

      {done ? (
        <div className="jl-folder jl-verdict">
          <p className="jl-folder-tab">🕵️ Final report</p>
          <p className="jl-big">
            {score} / {BUG_CASES.length} solved. Rank: <strong>{rankFor(score)}</strong>
          </p>
          <button
            type="button"
            className="viz-btn viz-btn--primary"
            onClick={() => {
              setPicks(BUG_CASES.map(() => null));
              setAt(0);
            }}
          >
            Start over
          </button>
        </div>
      ) : (
        <CaseFile
          key={at}
          c={BUG_CASES[at]}
          pick={picks[at]}
          onPick={(p) => setPicks((ps) => ps.map((x, k) => (k === at ? p : x)))}
          onNext={() => setAt((k) => k + 1)}
          last={at === BUG_CASES.length - 1}
        />
      )}
    </div>
  );
}

function CaseFile({
  c,
  pick,
  onPick,
  onNext,
  last,
}: {
  c: BugCase;
  pick: number | null;
  onPick: (p: number) => void;
  onNext: () => void;
  last: boolean;
}) {
  const [ran, setRan] = useState(false);
  const [fixed, setFixed] = useState(false);
  const answered = pick !== null;

  return (
    <div className="jl-folder">
      <p className="jl-folder-tab">🗂️ {c.title}</p>
      <pre className="vc-code viz-mono jl-case-code">
        {c.code.map((line, k) => (
          <div key={k} className="vc-line">
            <span>
              {fixed && c.fix && c.fix.line === k ? (
                <>
                  {c.fix.before}
                  {c.fix.removed && <del className="jl-del">{c.fix.removed}</del>}
                  <ins className="jl-ins">{c.fix.added}</ins>
                  {c.fix.after}
                </>
              ) : (
                line
              )}
            </span>
          </div>
        ))}
      </pre>

      <p className="jl-question">{c.question}</p>
      <div className="viz-quiz-options">
        {c.options.map((o, k) => {
          const right = k === c.answer;
          const picked = k === pick;
          return (
            <button
              key={o}
              type="button"
              className={`viz-btn jl-option ${answered && right ? 'is-right' : ''} ${picked && !right ? 'is-wrong' : ''}`}
              disabled={answered}
              onClick={() => onPick(k)}
            >
              {answered && right ? '✓ ' : picked ? '✗ ' : ''}
              <span className="viz-mono">{o}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <p className="viz-caption">
          <strong>{pick === c.answer ? 'Correct. ' : 'Not quite. '}</strong>
          {c.why}
        </p>
      )}

      <div className="jl-row jl-gap">
        <button type="button" className="viz-btn" onClick={() => setRan(true)} disabled={!answered}>
          ▶ Run it
        </button>
        {c.fix && (
          <button
            type="button"
            className="viz-btn"
            onClick={() => setFixed(true)}
            disabled={!ran || fixed}
          >
            🔧 Fix it
          </button>
        )}
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="viz-btn viz-btn--primary"
          onClick={onNext}
          disabled={!answered}
        >
          {last ? 'See my rank' : 'Next case →'}
        </button>
      </div>
      {!answered && <p className="jl-small jl-muted">Answer first, then run it.</p>}

      {ran && <RunOutput title="As written" result={c.run()} />}
      {fixed && c.runFixed && <RunOutput title="Fixed" result={c.runFixed()} fixed />}
    </div>
  );
}

function RunOutput({
  title,
  result,
  fixed,
}: {
  title: string;
  result: RunResult;
  fixed?: boolean;
}) {
  const shown = result.output.slice(0, 6);
  const more = result.output.length - shown.length;
  return (
    <div
      className={`viz-panel vc-console jl-gap ${fixed ? 'jl-fixed-run' : ''}`}
      aria-live="polite"
    >
      <div className="viz-label">{title}: console</div>
      <div className="viz-mono">
        {shown.map((l, k) => (
          <div key={k} className="vc-out">
            <span aria-hidden="true">›</span> {l}
          </div>
        ))}
        {more > 0 && <div className="vc-muted">… {more} more lines</div>}
      </div>
      {result.infinite && (
        <div className="jl-guard-inline" role="alert">
          🔥 Infinite loop detected! The simulator stopped after {GUARD} laps. Real JavaScript would
          freeze the page here.
        </div>
      )}
      {!result.infinite && (
        <div className="jl-small jl-muted">
          Printed {result.output.length} time{result.output.length === 1 ? '' : 's'}.
        </div>
      )}
    </div>
  );
}
