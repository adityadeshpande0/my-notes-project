import { Quiz, type QuizQuestion } from '../core/Quiz';

/** End-of-article self-check for "Arrays". */
const c = (code: string) => <code key={code}>{code}</code>;

const QUESTIONS: QuizQuestion[] = [
  {
    q: <>What is {c('["a", "b", "c"][1]')}?</>,
    options: [c('"b"'), c('"a"'), c('"c"'), c('undefined')],
    answer: 0,
    why: 'Indexes start at 0, so [1] is the second item.',
  },
  {
    q: <>What does {c('push')} return?</>,
    options: ['The new length of the array', 'The added item', 'The new array', c('undefined')],
    answer: 0,
    why: 'push (and unshift) return the new length. A favourite trick question!',
  },
  {
    q: 'Which method does NOT change the original array?',
    options: [c('map'), c('push'), c('sort'), c('splice')],
    answer: 0,
    why: 'map builds a new array. push, sort and splice change the original.',
  },
  {
    q: <>What is {c('[1, 2, 3].map(n => n * 10)')}?</>,
    options: [c('[10, 20, 30]'), c('60'), c('[1, 2, 3]'), c('[10]')],
    answer: 0,
    why: 'map transforms every item: same number in, same number out.',
  },
  {
    q: <>What is {c('[5, 12, 8].filter(n => n > 6)')}?</>,
    options: [c('[12, 8]'), c('[5]'), c('true'), c('[12]')],
    answer: 0,
    why: 'filter keeps every item where the callback returns true.',
  },
  {
    q: <>What is {c('[2, 3, 4].reduce((sum, n) => sum + n, 0)')}?</>,
    options: [c('9'), c('[2, 3, 4]'), c('24'), c('"234"')],
    answer: 0,
    why: '0 + 2 = 2, 2 + 3 = 5, 5 + 4 = 9.',
  },
  {
    q: <>What does {c('[3, 7, 9].find(n => n > 5)')} return?</>,
    options: [c('7'), c('[7, 9]'), c('true'), c('1')],
    answer: 0,
    why: 'find returns the first matching item itself, and stops looking.',
  },
  {
    q: <>What is {c('[10, 1, 5].sort()')}?</>,
    options: [c('[1, 10, 5]'), c('[1, 5, 10]'), c('[10, 5, 1]'), 'An error'],
    answer: 0,
    why: 'The default sort compares as text, and "10" comes before "5".',
  },
  {
    q: 'In React, how should you add an item to a state array?',
    options: [
      c('setItems([...items, newItem])'),
      c('items.push(newItem)'),
      c('items[items.length] = newItem'),
      c('setItems(items.push(newItem))'),
    ],
    answer: 0,
    why: 'Make a new array. Changing the old one keeps the same arrow, so React wouldn’t notice.',
  },
];

export default function ArraysQuiz() {
  return <Quiz questions={QUESTIONS} title="Test yourself" />;
}
