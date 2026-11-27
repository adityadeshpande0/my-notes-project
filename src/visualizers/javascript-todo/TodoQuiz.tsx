import { Quiz, type QuizQuestion } from '../core/Quiz';

/** The final quiz: the to-do project, and the whole course. */
const c = (code: string) => <code key={code}>{code}</code>;

/** Questions are written with the right answer first; `at` moves it, so it isn't always option A. */
const place = (q: QuizQuestion, at: number): QuizQuestion => {
  const [right, ...rest] = q.options;
  return { ...q, options: [...rest.slice(0, at), right, ...rest.slice(at)], answer: at };
};
const POSITIONS = [2, 0, 1, 3, 0, 1, 2, 0, 3, 1];

const WRITTEN: QuizQuestion[] = [
  {
    q: (
      <>
        In the plain-JS app, why do we change {c('todos')} and then call {c('render()')}, instead of
        editing the page directly?
      </>
    ),
    options: [
      'So the page always matches the data',
      'Because the DOM can’t be edited',
      <>It’s required by {c('localStorage')}</>,
      'To make the code longer',
    ],
    answer: 0,
    why: 'One source of truth: the page is always drawn from the data, so the two can’t drift apart.',
  },
  {
    q: <>Why does the submit handler call {c('event.preventDefault()')}?</>,
    options: [
      'To stop the form from reloading the page',
      'To stop bubbling',
      'To clear the input',
      <>To save to {c('localStorage')}</>,
    ],
    answer: 0,
    why: 'Submitting a form reloads the page by default (article #10).',
  },
  {
    q: (
      <>
        Why is the task text set with {c('textContent')} instead of {c('innerHTML')}?
      </>
    ),
    options: [
      <>It’s user input, and {c('innerHTML')} could run injected code (XSS)</>,
      <>{c('textContent')} is faster to type</>,
      <>
        {c('innerHTML')} doesn’t work on {c('<span>')}
      </>,
      'There’s no difference',
    ],
    answer: 0,
    why: 'textContent always treats the value as plain text (article #9).',
  },
  {
    q: <>One listener on the {c('<ul>')} handles clicks for every task. What is this called?</>,
    options: ['Event delegation', 'Bubbling prevention', 'A closure', 'Hoisting'],
    answer: 0,
    why: 'Clicks bubble up to the list, and closest(".todo") finds which task (article #10).',
  },
  {
    q: 'Which line toggles one task without mutating the array?',
    options: [
      c('todos = todos.map(t => t.id === id ? { ...t, done: !t.done } : t)'),
      c('todos[id].done = !todos[id].done'),
      c('todos.push({ id, done: true })'),
      c('todos.sort()'),
    ],
    answer: 0,
    why: 'map builds a new array, and the spread builds a new object for the changed task.',
  },
  {
    q: (
      <>
        Why wrap {c('localStorage')} calls in {c('try...catch')}?
      </>
    ),
    options: [
      'Storage can be blocked or the saved data broken, and the app should still work',
      <>{c('localStorage')} is asynchronous</>,
      'It makes saving faster',
      'JSON requires it',
    ],
    answer: 0,
    why: 'You saw it in the previews: storage is blocked in sandboxed frames, and the app kept working.',
  },
  {
    q: <>In React, what replaces the plain-JS {c('render()')} calls?</>,
    options: [
      <>Calling the state setter ({c('setTodos')}), which re-renders automatically</>,
      c('document.render()'),
      <>A {c('for')} loop</>,
      <>{c('useEffect')} only</>,
    ],
    answer: 0,
    why: 'Changing state tells React the data changed; React re-renders for you.',
  },
  {
    q: (
      <>
        Why does {c('TodoItem')} need {c('key={todo.id}')}?
      </>
    ),
    options: [
      'So React can tell the items apart and update the right one',
      'To style it',
      'To save it',
      'Keys are optional decoration',
    ],
    answer: 0,
    why: 'A stable, unique key lets React match each item with its previous version.',
  },
  {
    q: 'Ticking one task in a list of 5: what did each version do to the page in our test?',
    options: [
      'Plain JS rebuilt all 5 rows, and React changed just the one row’s class',
      'Both rebuilt every row',
      'Both changed only one row',
      'React rebuilt the whole page',
    ],
    answer: 0,
    why: 'replaceChildren rebuilds every row; React compares and changes only what differs.',
  },
  {
    q: 'Where should values like “tasks left” live?',
    options: [
      <>Calculated from {c('todos')} during render (derived), not stored separately</>,
      'In their own state variable',
      <>In {c('localStorage')} only</>,
      'In a global variable updated by hand',
    ],
    answer: 0,
    why: 'Derived values can never get out of sync with the data they come from.',
  },
];

const QUESTIONS = WRITTEN.map((q, i) => place(q, POSITIONS[i]));

export default function TodoQuiz() {
  return <Quiz questions={QUESTIONS} title="Test yourself (the final quiz!)" />;
}
