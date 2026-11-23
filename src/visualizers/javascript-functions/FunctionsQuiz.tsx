import { Quiz, type QuizQuestion } from '../core/Quiz';

/** End-of-article self-check for "Functions". */
const c = (code: string) => <code key={code}>{code}</code>;

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'What does declaring a function do?',
    options: [
      'Saves the recipe, but nothing runs yet',
      'Runs it once',
      'Runs it forever',
      'Prints it to the console',
    ],
    answer: 0,
    why: 'Declaring writes the recipe. Only calling it with () runs it.',
  },
  {
    q: (
      <>
        In {c('function add(a, b)')}, what are {c('a')} and {c('b')}?
      </>
    ),
    options: ['Parameters', 'Arguments', 'Return values', 'Global variables'],
    answer: 0,
    why: 'Parameters are the names in the definition. Arguments are the values passed in a call.',
  },
  {
    q: (
      <>
        What does {c('makeChai(2)')} give {c('milk')} in {c('function makeChai(sugar, milk)')}?
      </>
    ),
    options: [c('undefined'), c('0'), c('null'), 'An error'],
    answer: 0,
    why: 'A missing argument leaves its parameter undefined.',
  },
  {
    q: <>What does a function return if it has no {c('return')} statement?</>,
    options: [c('undefined'), c('null'), c('0'), c('false')],
    answer: 0,
    why: 'No return means the call gives back undefined.',
  },
  {
    q: (
      <>
        After {c('function f() { console.log(5); }')}, what is {c('const x = f();')}?
      </>
    ),
    options: [c('undefined'), c('5'), c('"5"'), 'An error'],
    answer: 0,
    why: 'console.log only shows the value; it doesn’t return it.',
  },
  {
    q: <>Which is a correct arrow function that returns double {c('n')}?</>,
    options: [c('n => n * 2'), c('n -> n * 2'), c('function => n * 2'), c('(n) { n * 2 }')],
    answer: 0,
    why: 'An arrow is =>, and a single expression after it is returned automatically.',
  },
  {
    q: 'You want to pass a function as a callback. Which is right?',
    options: [
      c('button.addEventListener("click", handleClick)'),
      c('button.addEventListener("click", handleClick())'),
      c('button.addEventListener("click", "handleClick")'),
      c('button.addEventListener(handleClick)'),
    ],
    answer: 0,
    why: 'Pass the function itself. handleClick() would run it right away and pass its result.',
  },
  {
    q: 'When a function returns, what happens to its plate on the call stack?',
    options: [
      'It’s removed, and the value goes to the caller',
      'It moves to the bottom',
      'It stays until the page reloads',
      'It’s copied',
    ],
    answer: 0,
    why: 'The plate comes off the top, and the plate underneath carries on with the returned value.',
  },
  {
    q: <>Can code outside a function read a {c('const')} declared inside it?</>,
    options: [
      'No, it’s local to that function',
      'Yes, always',
      'Only if it’s a number',
      'Only after calling the function',
    ],
    answer: 0,
    why: 'You can look outward, never inward. Outside code gets a ReferenceError.',
  },
  {
    q: 'What does every recursive function need to avoid a stack overflow?',
    options: ['A base case', 'A loop', 'A global variable', 'An arrow function'],
    answer: 0,
    why: 'The base case is where the calls stop. Without it, the plates pile up until the stack overflows.',
  },
];

export default function FunctionsQuiz() {
  return <Quiz questions={QUESTIONS} title="Test yourself" />;
}
