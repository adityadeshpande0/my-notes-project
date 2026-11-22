import { Quiz, type QuizQuestion } from '../core/Quiz';

/** End-of-article self-check for "Variables & Data Types". */
const QUESTIONS: QuizQuestion[] = [
  {
    q: 'Which keyword should you use by default?',
    options: [
      <code key="c">const</code>,
      <code key="l">let</code>,
      <code key="v">var</code>,
      'None of them',
    ],
    answer: 0,
    why: 'Use const unless the value must change. Then use let.',
  },
  {
    q: (
      <>
        What does <code>let x;</code> leave inside <code>x</code>?
      </>
    ),
    options: [
      <code key="u">undefined</code>,
      <code key="n">null</code>,
      <code key="z">0</code>,
      'An error',
    ],
    answer: 0,
    why: 'A box that has been created but not filled holds undefined.',
  },
  {
    q: (
      <>
        What is <code>typeof null</code>?
      </>
    ),
    options: [
      <code key="o">"object"</code>,
      <code key="n">"null"</code>,
      <code key="u">"undefined"</code>,
      <code key="e">"empty"</code>,
    ],
    answer: 0,
    why: 'A bug from 1995, kept so old websites keep working. null is still its own type.',
  },
  {
    q: (
      <>
        After <code>let a = 5; let b = a; b = 10;</code> what is <code>a</code>?
      </>
    ),
    options: [
      <code key="5">5</code>,
      <code key="10">10</code>,
      <code key="u">undefined</code>,
      'An error',
    ],
    answer: 0,
    why: 'Primitives are copied. b got its own 5, so changing b never touches a.',
  },
  {
    q: (
      <>
        After <code>const p = {'{ n: 1 }'}; const q = p; q.n = 2;</code> what is <code>p.n</code>?
      </>
    ),
    options: [
      <code key="2">2</code>,
      <code key="1">1</code>,
      <code key="u">undefined</code>,
      'An error',
    ],
    answer: 0,
    why: 'p and q are two arrows to the same object, so a change through q shows through p.',
  },
  {
    q: 'Which variable name is invalid?',
    options: [
      <code key="a">2ndPlayer</code>,
      <code key="b">player2</code>,
      <code key="c">_score</code>,
      <code key="d">$total</code>,
    ],
    answer: 0,
    why: 'A name can’t start with a digit. Underscores and dollar signs are allowed.',
  },
  {
    q: (
      <>
        What does <code>"10" - 4</code> give?
      </>
    ),
    options: [
      <code key="6">6</code>,
      <code key="104">"104"</code>,
      <code key="s6">"6"</code>,
      <code key="nan">NaN</code>,
    ],
    answer: 0,
    why: '- only works on numbers, so "10" becomes 10, and 10 - 4 is 6.',
  },
  {
    q: 'Which correctly copies an array?',
    options: [
      <code key="a">const b = [...a];</code>,
      <code key="b">const b = a;</code>,
      <code key="c">const b = a[];</code>,
      <code key="d">const b = copy a;</code>,
    ],
    answer: 0,
    why: 'Spread builds a new array. const b = a only copies the arrow.',
  },
  {
    q: 'How many data types does JavaScript have?',
    options: ['8', '5', '6', '10'],
    answer: 0,
    why: '7 primitives (string, number, bigint, boolean, undefined, null, symbol) plus object.',
  },
];

export default function VariablesQuiz() {
  return <Quiz questions={QUESTIONS} title="Test yourself" />;
}
