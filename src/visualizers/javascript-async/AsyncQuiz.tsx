import { Quiz, type QuizQuestion } from '../core/Quiz';

/** End-of-article self-check for "Asynchronous JavaScript". */
const c = (code: string) => <code key={code}>{code}</code>;

/** Questions are written with the right answer first; `at` moves it, so it isn't always option A. */
const place = (q: QuizQuestion, at: number): QuizQuestion => {
  const [right, ...rest] = q.options;
  return { ...q, options: [...rest.slice(0, at), right, ...rest.slice(at)], answer: at };
};
const POSITIONS = [2, 0, 1, 3, 0, 2, 1, 0, 3];

const WRITTEN: QuizQuestion[] = [
  {
    q: 'Why does JavaScript need asynchronous code?',
    options: [
      'So slow tasks don’t freeze the page',
      'To make code shorter',
      'Because it has many call stacks',
      'To run code in a random order',
    ],
    answer: 0,
    why: 'JavaScript has one call stack. Async code starts slow work and carries on, so the page stays responsive.',
  },
  {
    q: 'What are the three states of a Promise?',
    options: [
      'pending, fulfilled, rejected',
      'start, middle, end',
      'waiting, done, cancelled',
      'open, closed, error',
    ],
    answer: 0,
    why: 'A promise starts pending and settles once: fulfilled with a value, or rejected with an error.',
  },
  {
    q: (
      <>
        In a chain {c('a().then(b).then(c).catch(d)')}, if {c('b')} throws, what runs next?
      </>
    ),
    options: [c('d'), c('c'), <>{c('b')} again</>, 'Nothing'],
    answer: 0,
    why: 'An error skips every remaining .then and goes straight to the .catch.',
  },
  {
    q: <>What does an {c('async')} function always return?</>,
    options: ['A promise', c('undefined'), 'The value directly', 'An array'],
    answer: 0,
    why: 'A returned value fulfils that promise, and a thrown error rejects it.',
  },
  {
    q: <>Does {c('await')} freeze the whole page?</>,
    options: [
      'No, it only pauses that async function',
      'Yes, until the promise settles',
      'Only on mobile',
      'Only for timers',
    ],
    answer: 0,
    why: 'The rest of the function waits in the microtask queue; everything else keeps running.',
  },
  {
    q: (
      <>
        Three independent tasks take 2 s, 3 s and 1 s. About how long does{' '}
        {c('await Promise.all([...])')} take?
      </>
    ),
    options: ['3 s', '6 s', '1 s', '2 s'],
    answer: 0,
    why: 'They run at the same time, so it takes as long as the slowest one.',
  },
  {
    q: 'Which combinator never rejects and reports every result?',
    options: [c('Promise.allSettled'), c('Promise.all'), c('Promise.race'), c('Promise.any')],
    answer: 0,
    why: 'allSettled waits for every promise and gives a { status, value / reason } for each.',
  },
  {
    q: (
      <>
        What is the output order of{' '}
        {c(
          'console.log(1); setTimeout(() => console.log(2)); Promise.resolve().then(() => console.log(3)); console.log(4);',
        )}
        ?
      </>
    ),
    options: ['1, 4, 3, 2', '1, 2, 3, 4', '1, 4, 2, 3', '4, 3, 2, 1'],
    answer: 0,
    why: 'The script runs first (1, 4), then every microtask (3), then the next task (2).',
  },
  {
    q: 'How should you handle errors with async/await?',
    options: [
      c('try...catch'),
      <>{c('.finally()')} only</>,
      <>{c('if (error)')} after every line</>,
      'They can’t be handled',
    ],
    answer: 0,
    why: 'An awaited rejection throws, so an ordinary try...catch catches it.',
  },
];

const QUESTIONS = WRITTEN.map((q, i) => place(q, POSITIONS[i]));

export default function AsyncQuiz() {
  return <Quiz questions={QUESTIONS} title="Test yourself" />;
}
