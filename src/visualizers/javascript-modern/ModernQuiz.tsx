import { Quiz, type QuizQuestion } from '../core/Quiz';

/** End-of-article self-check for "Modern JavaScript (ES6+)". */
const c = (code: string) => <code key={code}>{code}</code>;

/** Questions are written with the right answer first; `at` moves it, so it isn't always option A. */
const place = (q: QuizQuestion, at: number): QuizQuestion => {
  const [right, ...rest] = q.options;
  return { ...q, options: [...rest.slice(0, at), right, ...rest.slice(at)], answer: at };
};
const POSITIONS = [1, 0, 2, 3, 0, 2, 1, 0, 3, 1];

const WRITTEN: QuizQuestion[] = [
  {
    q: (
      <>
        What does {c('const { name } = { name: "Riya", age: 19 }')} give {c('name')}?
      </>
    ),
    options: [c('"Riya"'), c('{ name: "Riya" }'), c('undefined'), c('19')],
    answer: 0,
    why: 'Object destructuring matches by name, so name gets the name property.',
  },
  {
    q: (
      <>
        {c('const [a, , c] = [1, 2, 3]')}: what is {c('c')}?
      </>
    ),
    options: [c('3'), c('2'), c('undefined'), c('[2, 3]')],
    answer: 0,
    why: 'Array destructuring goes by position; the empty slot skips index 1.',
  },
  {
    q: (
      <>
        {c('const { country = "India" } = { city: "Pune" }')}: what is {c('country')}?
      </>
    ),
    options: [c('"India"'), c('undefined'), c('"Pune"'), 'An error'],
    answer: 0,
    why: 'There’s no country property (it’s undefined), so the default is used.',
  },
  {
    q: <>What is {c('{ ...{ sugar: 1, size: "M" }, sugar: 2 }')}?</>,
    options: [
      c('{ sugar: 2, size: "M" }'),
      c('{ sugar: 1, size: "M" }'),
      c('{ sugar: [1, 2], size: "M" }'),
      'An error',
    ],
    answer: 0,
    why: 'Later properties win: sugar: 2 comes after the spread, so it overwrites sugar: 1.',
  },
  {
    q: (
      <>
        In {c('function f(...args)')}, what is {c('...args')} doing?
      </>
    ),
    options: [
      'Rest: gathering all the arguments into an array',
      'Spread: unpacking an array',
      'Copying an object',
      'Nothing',
    ],
    answer: 0,
    why: 'In a parameter list, ... gathers the rest of the arguments into one array.',
  },
  {
    q: <>What is {c('Math.max(...[3, 9, 4])')}?</>,
    options: [c('9'), c('NaN'), c('[3, 9, 4]'), c('3')],
    answer: 0,
    why: 'Spread turns the array into three separate arguments: Math.max(3, 9, 4).',
  },
  {
    q: 'How many default exports can a module have?',
    options: ['At most one', 'Unlimited', 'Exactly two', 'None'],
    answer: 0,
    why: 'A second export default is a SyntaxError. Named exports have no limit.',
  },
  {
    q: <>Which correctly imports a default export from {c('./Navbar.js')}?</>,
    options: [
      c('import Navbar from "./Navbar.js"'),
      c('import { default } from "./Navbar.js"'),
      <>{c('import { Navbar } from "./Navbar.js"')} (only right for a named export)</>,
      c('require Navbar'),
    ],
    answer: 0,
    why: 'Default exports are imported without { }, and you choose the name.',
  },
  {
    q: <>Why does {c('const [count, setCount] = useState(0)')} use square brackets?</>,
    options: [
      <>{c('useState')} returns an array, so array destructuring lets you choose the names</>,
      'Square brackets are required for all hooks',
      'It creates a new array',
      'It’s a typo',
    ],
    answer: 0,
    why: 'useState returns [value, setter]; unpacking by position means any names work.',
  },
  {
    q: 'Which committee designs new JavaScript features?',
    options: ['TC39', 'W3C', 'The React team', 'Node.js'],
    answer: 0,
    why: 'TC39 moves proposals through stages 0 to 4; stage 4 features join the next yearly edition.',
  },
];

const QUESTIONS = WRITTEN.map((q, i) => place(q, POSITIONS[i]));

export default function ModernQuiz() {
  return <Quiz questions={QUESTIONS} title="Test yourself" />;
}
