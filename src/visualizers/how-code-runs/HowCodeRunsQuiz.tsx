import { useState } from 'react';
import { alpha, C } from '../core/colors';

/** Five questions on the article. Each answer reveals why. */

const QUESTIONS = [
  {
    q: 'What is the ONLY language a CPU actually understands?',
    options: ['JavaScript', 'Assembly', 'Machine code (binary instructions)', 'English'],
    answer: 2,
    why: 'Assembly is a human-readable spelling of machine code, but the CPU only ever sees the bits.',
  },
  {
    q: 'In the fetch → decode → execute cycle, what does the Program Counter (PC) hold?',
    options: [
      'The result of the last addition',
      'The address of the next instruction',
      'The number of clock ticks so far',
      "The current variable's name",
    ],
    answer: 1,
    why: 'The PC points at the next instruction in memory. After each fetch it moves forward (or jumps, for loops and ifs).',
  },
  {
    q: 'What makes a transistor switch ON?',
    options: [
      'A tiny motor closes a contact',
      'Enough voltage on the gate pulls electrons into a channel',
      "The CPU's fan cools it down",
      'Light hits the silicon',
    ],
    answer: 1,
    why: 'Above the threshold voltage, the gate attracts electrons that form a conductive channel between source and drain.',
  },
  {
    q: '1 + 1 in a single full adder (no carry in) gives…',
    options: ['sum 2', 'sum 1, carry 0', 'sum 0, carry 1', 'sum 1, carry 1'],
    answer: 2,
    why: 'Binary has no digit "2". 1 + 1 = 10₂, so the sum bit is 0 and we carry 1 to the next column (sum = XOR, carry = AND).',
  },
  {
    q: 'How does JavaScript usually get to machine code in a browser?',
    options: [
      "It's compiled to an .exe before you visit the site",
      'The engine parses it, interprets bytecode, then JIT-compiles hot code to machine code',
      'The CPU reads JavaScript directly',
      "It's converted to Python first",
    ],
    answer: 1,
    why: 'Engines like V8 start fast with an interpreter, then compile frequently run ("hot") functions to optimized machine code while your page runs.',
  },
];

export default function HowCodeRunsQuiz() {
  // One entry per question: the chosen option's index, or null if unanswered.
  const [picked, setPicked] = useState<(number | null)[]>(() => QUESTIONS.map(() => null));
  const score = picked.filter((p, i) => p === QUESTIONS[i].answer).length;
  const answered = picked.filter((p) => p !== null).length;

  const choose = (question: number, option: number) =>
    setPicked((prev) => prev.map((p, i) => (i === question ? option : p)));

  return (
    <div className="viz not-prose">
      <p className="viz-title">Quick self-check</p>
      <p className="viz-sub">Pick an answer to see if you&rsquo;re right, and why.</p>

      <ol style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '1.25rem' }}>
        {QUESTIONS.map((question, qi) => {
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
            {score} / {QUESTIONS.length}
          </strong>
          {answered === QUESTIONS.length &&
            (score === QUESTIONS.length
              ? ' · Perfect.'
              : ' · Review the sections above and try again.')}
        </span>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="viz-btn"
          onClick={() => setPicked(QUESTIONS.map(() => null))}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
