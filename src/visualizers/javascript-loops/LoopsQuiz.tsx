import { Quiz, type QuizQuestion } from '../core/Quiz';

/** End-of-article self-check for "Loops". */
const c = (code: string) => <code key={code}>{code}</code>;

const QUESTIONS: QuizQuestion[] = [
  {
    q: (
      <>
        In {c('for (let i = 0; i < 3; i++)')}, when does {c('i++')} run?
      </>
    ),
    options: ['After each lap', 'Before each lap', 'Only once', 'Only at the end'],
    answer: 0,
    why: 'The order is: start → check → body → update → check → …',
  },
  {
    q: <>How many times does {c('for (let i = 0; i < 3; i++)')} run its body?</>,
    options: ['3', '2', '4', 'Forever'],
    answer: 0,
    why: 'i is 0, 1 and 2. When i reaches 3, 3 < 3 is false.',
  },
  {
    q: 'Which loop always runs its body at least once?',
    options: [c('do...while'), c('while'), c('for'), c('for...of')],
    answer: 0,
    why: 'do...while checks its condition after the body, so the first lap always happens.',
  },
  {
    q: (
      <>
        What does {c('for (const x of ["a", "b"])')} give you in {c('x')}?
      </>
    ),
    options: [
      <>
        {c('"a"')}, then {c('"b"')}
      </>,
      <>
        {c('0')}, then {c('1')}
      </>,
      <>
        {c('"0"')}, then {c('"1"')}
      </>,
      'The whole array',
    ],
    answer: 0,
    why: 'for...of gives the values of a list.',
  },
  {
    q: <>What does {c('for...in')} give you when looping over an object?</>,
    options: ['Its keys', 'Its values', 'Key-value pairs', 'Its length'],
    answer: 0,
    why: 'for...in gives the keys in an object. Use obj[key] to get each value.',
  },
  {
    q: <>What does {c('continue')} do?</>,
    options: [
      'Skips the rest of this lap and goes to the next',
      'Stops the loop',
      'Restarts the loop from the start',
      'Pauses the loop',
    ],
    answer: 0,
    why: 'continue skips to the next lap. break is the one that stops the loop.',
  },
  {
    q: 'A loop inside a loop, both running 10 times. How many times does the inner body run?',
    options: ['100', '20', '10', '11'],
    answer: 0,
    why: 'For each of the 10 outer laps, the inner loop runs 10 times: 10 × 10.',
  },
  {
    q: <>What’s wrong with {c('for (let i = 0; i <= arr.length; i++)')}?</>,
    options: [
      'It runs one extra time and reads undefined',
      'Nothing',
      'It skips the first item',
      'It never runs',
    ],
    answer: 0,
    why: 'The last index is length − 1. Use < with length.',
  },
  {
    q: <>Why does FizzBuzz check {c('i % 3 === 0 && i % 5 === 0')} first?</>,
    options: [
      'The first true condition wins, and 15 would be caught by % 3',
      'It’s faster',
      'JavaScript requires it',
      '&& must always come first',
    ],
    answer: 0,
    why: 'An if / else if chain stops at the first true condition (article #3).',
  },
];

export default function LoopsQuiz() {
  return <Quiz questions={QUESTIONS} title="Test yourself" />;
}
