import { useState, type ReactNode } from 'react';
import { alpha, C } from './colors';

export interface QuizQuestion {
  q: ReactNode;
  options: ReactNode[];
  /** Index of the correct option. */
  answer: number;
  why: ReactNode;
}

/**
 * A multiple-choice self-check. Each answer is locked in when picked and
 * reveals why. Used at the end of notes: <Quiz questions={QUESTIONS} />.
 */
export function Quiz({
  questions,
  title = 'Quick self-check',
  subtitle = 'Pick an answer to see if you’re right, and why.',
}: {
  questions: QuizQuestion[];
  title?: string;
  subtitle?: string;
}) {
  // One entry per question: the chosen option's index, or null if unanswered.
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const score = picked.filter((p, i) => p === questions[i].answer).length;
  const answered = picked.filter((p) => p !== null).length;

  const choose = (question: number, option: number) =>
    setPicked((prev) => prev.map((p, i) => (i === question ? option : p)));

  return (
    <div className="viz not-prose">
      <p className="viz-title">{title}</p>
      <p className="viz-sub">{subtitle}</p>

      <ol style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '1.25rem' }}>
        {questions.map((question, qi) => {
          const choice = picked[qi];
          const done = choice !== null;
          return (
            <li key={qi}>
              <p style={{ margin: '0 0 .5rem', fontWeight: 600 }}>{question.q}</p>
              <div style={{ display: 'grid', gap: 6 }}>
                {question.options.map((option, oi) => {
                  const isPicked = choice === oi;
                  const isRight = oi === question.answer;
                  // After answering: the right answer goes green, a wrong pick goes coral.
                  const color = done && isRight ? C.ok : isPicked ? C.danger : undefined;
                  return (
                    <button
                      type="button"
                      key={oi}
                      className="viz-btn"
                      disabled={done}
                      onClick={() => choose(qi, oi)}
                      style={{
                        textAlign: 'left',
                        opacity: 1,
                        cursor: done ? 'default' : 'pointer',
                        borderColor: color,
                        color,
                        background: color ? alpha(color, 10) : undefined,
                      }}
                    >
                      {done && isRight ? '✓ ' : isPicked ? '✗ ' : ''}
                      {option}
                    </button>
                  );
                })}
              </div>
              {done && (
                <p
                  className="viz-fade"
                  style={{ margin: '.5rem 0 0', fontSize: 14, color: C.muted }}
                >
                  <strong style={{ color: choice === question.answer ? C.ok : C.danger }}>
                    {choice === question.answer ? 'Correct. ' : 'Not quite. '}
                  </strong>
                  {question.why}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="viz-controls">
        <span aria-live="polite">
          Score:{' '}
          <strong className="viz-mono">
            {score} / {questions.length}
          </strong>
          {answered === questions.length &&
            (score === questions.length
              ? ' · Perfect.'
              : ' · Review the sections above and try again.')}
        </span>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="viz-btn"
          onClick={() => setPicked(questions.map(() => null))}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
