import { Quiz, type QuizQuestion } from '../core/Quiz';

/** End-of-article self-check for "Operators & Conditions". */
const c = (code: string) => <code key={code}>{code}</code>;

const QUESTIONS: QuizQuestion[] = [
  {
    q: <>What is {c('17 % 5')}?</>,
    options: [c('2'), c('3'), c('3.4'), c('12')],
    answer: 0,
    why: '5 fits into 17 three times (15), with 2 left over.',
  },
  {
    q: (
      <>
        How do you check if <code>n</code> is even?
      </>
    ),
    options: [c('n % 2 === 0'), c('n / 2 === 0'), c('n % 2 === 1'), c('n ** 2 === 0')],
    answer: 0,
    why: 'An even number leaves no remainder when divided by 2.',
  },
  {
    q: 'Which value is truthy?',
    options: [c('"0"'), c('0'), c('""'), c('null')],
    answer: 0,
    why: 'Any non-empty string is truthy, even "0".',
  },
  {
    q: <>What does {c('"" || "Guest"')} return?</>,
    options: [c('"Guest"'), c('true'), c('""'), c('false')],
    answer: 0,
    why: '|| returns the first truthy value. "" is falsy, so it moves on to "Guest".',
  },
  {
    q: <>What does {c('0 ?? 50')} return?</>,
    options: [c('0'), c('50'), c('null'), c('false')],
    answer: 0,
    why: '?? only replaces null or undefined. 0 is a real value, so it stays.',
  },
  {
    q: (
      <>
        With <code>marks = 95</code>, which block runs if the conditions are checked in the order{' '}
        <code>&gt;= 50</code>, <code>&gt;= 75</code>, <code>&gt;= 90</code>?
      </>
    ),
    options: [
      <>
        The <code>&gt;= 50</code> block
      </>,
      <>
        The <code>&gt;= 90</code> block
      </>,
      'All three',
      'None',
    ],
    answer: 0,
    why: 'The first true condition wins, and everything after it is skipped.',
  },
  {
    q: (
      <>
        What happens if you forget <code>break</code> in a matching <code>case</code>?
      </>
    ),
    options: [
      'Execution continues into the next case',
      'A syntax error',
      'The switch restarts',
      'Nothing',
    ],
    answer: 0,
    why: 'That’s fall-through: JavaScript keeps running the next cases without checking them.',
  },
  {
    q: <>What is {c('2 + 3 * 4')}?</>,
    options: [c('14'), c('20'), c('24'), c('"234"')],
    answer: 0,
    why: '* goes before +, so it’s 2 + 12.',
  },
  {
    q: (
      <>
        What does <code>user?.address?.city</code> give when <code>user.address</code> is missing?
      </>
    ),
    options: [c('undefined'), 'a TypeError', c('null'), c('""')],
    answer: 0,
    why: '?. stops at the missing address and gives undefined instead of crashing.',
  },
  {
    q: 'Which comparison is true?',
    options: [c('"10" < "9"'), c('10 < 9'), c('"b" < "a"'), c('NaN === NaN')],
    answer: 0,
    why: 'Strings compare character by character, and "1" comes before "9".',
  },
];

export default function ConditionsQuiz() {
  return <Quiz questions={QUESTIONS} title="Test yourself" />;
}
