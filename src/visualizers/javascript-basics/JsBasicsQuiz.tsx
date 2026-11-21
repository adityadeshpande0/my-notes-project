import { Quiz, type QuizQuestion } from '../core/Quiz';

/** End-of-article self-check for "JavaScript Basics". */
const QUESTIONS: QuizQuestion[] = [
  {
    q: 'Who created JavaScript?',
    options: ['Brendan Eich', 'James Gosling', 'Tim Berners-Lee', 'Ryan Dahl'],
    answer: 0,
    why: 'Eich wrote it at Netscape in 1995. Gosling created Java, Berners-Lee invented the web, and Dahl created Node.js.',
  },
  {
    q: 'What was JavaScript’s very first name?',
    options: ['Mocha', 'LiveScript', 'JScript', 'ECMAScript'],
    answer: 0,
    why: 'Mocha (May 1995), then LiveScript (Sep 1995), then JavaScript (Dec 1995).',
  },
  {
    q: 'What is ECMAScript?',
    options: [
      'The official standard (rulebook) JavaScript follows',
      'A different language',
      'A JavaScript framework',
      'Java’s browser version',
    ],
    answer: 0,
    why: 'Ecma International publishes the ECMAScript standard. JavaScript engines implement it.',
  },
  {
    q: (
      <>
        What does this print?{' '}
        <code>console.log(1); setTimeout(() =&gt; console.log(2), 0); console.log(3);</code>
      </>
    ),
    options: ['1, 3, 2', '1, 2, 3', '2, 1, 3', '3, 2, 1'],
    answer: 0,
    why: 'The timer callback waits in the queue until the call stack is empty, so 2 comes last.',
  },
  {
    q: 'Which is the best analogy for JavaScript in a web page?',
    options: ['The electricity in a house', 'The walls', 'The paint', 'The address'],
    answer: 0,
    why: 'HTML is the walls, CSS is the paint, and JavaScript is the electricity that makes things work.',
  },
  {
    q: (
      <>
        What does <code>"5" + 3</code> give?
      </>
    ),
    options: [
      <code key="a">"53"</code>,
      <code key="b">8</code>,
      <code key="c">NaN</code>,
      'An error',
    ],
    answer: 0,
    why: '+ with a string joins text, so 3 is turned into "3" and stuck on the end.',
  },
  {
    q: 'Is Java the same as JavaScript?',
    options: [
      'No, they’re different languages with a similar name',
      'Yes',
      'JavaScript is Java for browsers',
      'Java is JavaScript’s old name',
    ],
    answer: 0,
    why: 'The name was mostly marketing. They differ in typing, where they run and how they run.',
  },
];

export default function JsBasicsQuiz() {
  return <Quiz questions={QUESTIONS} title="Test yourself" />;
}
