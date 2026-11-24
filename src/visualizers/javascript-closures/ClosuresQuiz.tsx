import { Quiz, type QuizQuestion } from '../core/Quiz';

/** End-of-article self-check for "Scope, Hoisting & Closures". */
const c = (code: string) => <code key={code}>{code}</code>;

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'Where does JavaScript look first when you use a variable?',
    options: [
      'The current scope, then outward',
      'Global first',
      'The calling function first',
      'Inner functions first',
    ],
    answer: 0,
    why: 'The scope chain starts where you are and only ever goes outward.',
  },
  {
    q: 'What decides a function’s scope chain?',
    options: [
      'Where it’s written in the code',
      'Where it’s called',
      'The order the functions run',
      'Whether it’s an arrow function',
    ],
    answer: 0,
    why: 'That’s lexical scope: the written location decides, not the caller.',
  },
  {
    q: (
      <>
        With{' '}
        {c(
          'const x = "A"; function f() { console.log(x); } function g() { const x = "B"; f(); } g();',
        )}
        , what prints?
      </>
    ),
    options: [c('"A"'), c('"B"'), c('undefined'), 'An error'],
    answer: 0,
    why: 'f is written in the global room, so it finds the global x, even though g called it.',
  },
  {
    q: <>What does {c('console.log(v); var v = 3;')} print?</>,
    options: [c('undefined'), c('3'), c('ReferenceError'), c('null')],
    answer: 0,
    why: 'var gets a slot set to undefined during memory setup, before any line runs.',
  },
  {
    q: <>What happens with {c('console.log(w); let w = 3;')}?</>,
    options: [c('ReferenceError'), c('undefined'), c('3'), c('null')],
    answer: 0,
    why: 'w is in the Temporal Dead Zone until its line runs.',
  },
  {
    q: 'Which can be called before the line where it’s written?',
    options: [c('function f() {}'), c('const f = () => {}'), c('let f = function () {}'), 'None'],
    answer: 0,
    why: 'Function declarations are set up complete in phase ①. The others follow their const/let rules.',
  },
  {
    q: 'What is a closure?',
    options: [
      'A function plus the variables from where it was created',
      'A function that closes the browser',
      'A loop that ends early',
      'A private class',
    ],
    answer: 0,
    why: 'The function carries a link to its birthplace’s variables: its backpack.',
  },
  {
    q: (
      <>
        {c('const a = makeCounter(); const b = makeCounter(); a(); a(); b();')} What does {c('b()')}{' '}
        return?
      </>
    ),
    options: [c('1'), c('3'), c('2'), c('0')],
    answer: 0,
    why: 'Each call to makeCounter packs a new backpack with its own count.',
  },
  {
    q: (
      <>
        Why does {c('for (var i = 0; i < 3; i++) setTimeout(() => console.log(i))')} print 3, 3, 3?
      </>
    ),
    options: [
      'All the callbacks share one i, which is 3 when they run',
      'setTimeout is broken',
      'var counts in threes',
      'The loop runs three extra times',
    ],
    answer: 0,
    why: 'With var there’s a single i, and every backpack links to it. let would make a new one per lap.',
  },
];

export default function ClosuresQuiz() {
  return <Quiz questions={QUESTIONS} title="Test yourself" />;
}
