import { Quiz, type QuizQuestion } from '../core/Quiz';

/** End-of-article self-check for "Objects & JSON". */
const c = (code: string) => <code key={code}>{code}</code>;

const QUESTIONS: QuizQuestion[] = [
  {
    q: (
      <>
        What does {c('user.email')} give if {c('user')} has no {c('email')} property?
      </>
    ),
    options: [c('undefined'), c('null'), 'An error', c('""')],
    answer: 0,
    why: 'A missing property is just undefined. No error.',
  },
  {
    q: (
      <>
        With {c('const key = "age";')}, how do you read {c('user.age')} using {c('key')}?
      </>
    ),
    options: [c('user[key]'), c('user.key'), c('user."key"'), c('user(key)')],
    answer: 0,
    why: 'Brackets look inside the variable first. user.key looks for a property literally called "key".',
  },
  {
    q: (
      <>
        How do you add a new property {c('city')} to {c('user')}?
      </>
    ),
    options: [
      c('user.city = "Pune";'),
      c('user.add("city", "Pune");'),
      c('user.push({ city: "Pune" });'),
      c('add user.city = "Pune";'),
    ],
    answer: 0,
    why: 'Just assign it. If the key doesn’t exist yet, it’s created.',
  },
  {
    q: <>What does {c('Object.keys({ a: 1, b: 2 })')} return?</>,
    options: [c('["a", "b"]'), c('[1, 2]'), c('2'), c('{ a, b }')],
    answer: 0,
    why: 'Object.keys gives an array of the property names.',
  },
  {
    q: <>How do you read {c('"Cutting Chai"')} from the order example?</>,
    options: [
      c('order.items[1].name'),
      c('order.items.name[1]'),
      c('order[1].items.name'),
      c('order.items.1.name'),
    ],
    answer: 0,
    why: 'Go to order → open items → take index 1 → read name.',
  },
  {
    q: 'Which is valid JSON?',
    options: [
      c('{"name": "Riya"}'),
      c('{name: "Riya"}'),
      c("{'name': 'Riya'}"),
      c('{"name": "Riya",}'),
    ],
    answer: 0,
    why: 'Double-quoted keys and strings, and no trailing comma.',
  },
  {
    q: <>What does {c('JSON.stringify({ a: 1, f() {} })')} give?</>,
    options: [c(`'{"a":1}'`), c(`'{"a":1,"f":"function"}'`), 'An error', c("'{a:1}'")],
    answer: 0,
    why: 'Functions are dropped: JSON has no way to store them.',
  },
  {
    q: <>What does {c('JSON.parse')} do?</>,
    options: [
      'Turns JSON text into a JavaScript value',
      'Turns an object into text',
      'Checks if an object is valid',
      'Sends data to a server',
    ],
    answer: 0,
    why: 'parse unpacks text into a value. stringify is the one that packs.',
  },
  {
    q: <>In React, how do you update {c('user.name')} in state?</>,
    options: [
      c('setUser({ ...user, name: "Riya" })'),
      c('user.name = "Riya"'),
      c('setUser(user.name = "Riya")'),
      c('setUser(user)'),
    ],
    answer: 0,
    why: 'Make a new object. React only notices a change when it gets a new one.',
  },
];

export default function ObjectsQuiz() {
  return <Quiz questions={QUESTIONS} title="Test yourself" />;
}
