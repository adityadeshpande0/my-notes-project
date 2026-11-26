import { Quiz, type QuizQuestion } from '../core/Quiz';

/** End-of-article self-check for "Events". */
const c = (code: string) => <code key={code}>{code}</code>;

/** Questions are written with the right answer first; `at` moves it, so it isn't always option A. */
const place = (q: QuizQuestion, at: number): QuizQuestion => {
  const [right, ...rest] = q.options;
  return { ...q, options: [...rest.slice(0, at), right, ...rest.slice(at)], answer: at };
};
const POSITIONS = [1, 0, 2, 0, 3, 1, 2, 0, 3];

const WRITTEN: QuizQuestion[] = [
  {
    q: <>Which line correctly runs {c('save')} when a button is clicked?</>,
    options: [
      c('btn.addEventListener("click", save)'),
      c('btn.addEventListener("click", save())'),
      c('btn.addEventListener(save, "click")'),
      c('btn.onClick(save)'),
    ],
    answer: 0,
    why: 'Pass the function itself. save() would run it straight away and pass its result instead.',
  },
  {
    q: 'Which event fires on every keystroke in a text input?',
    options: [c('input'), c('change'), c('submit'), c('blur')],
    answer: 0,
    why: 'input fires on every change to the value; change waits until the value is committed.',
  },
  {
    q: <>What does {c('e.preventDefault()')} do in a form’s submit handler?</>,
    options: [
      'Stops the page from reloading',
      'Stops the event from bubbling',
      'Deletes the form data',
      'Disables the button',
    ],
    answer: 0,
    why: 'It cancels the browser’s default action for the event: for submit, sending the form and reloading.',
  },
  {
    q: 'You click a button inside a div, and both have click listeners. What happens by default?',
    options: [
      'The button’s handler runs, then the div’s',
      'Only the button’s',
      'Only the div’s',
      'The div’s, then the button’s',
    ],
    answer: 0,
    why: 'Listeners run in the bubble phase by default: the target first, then up through its ancestors.',
  },
  {
    q: <>During bubbling, what is {c('e.target')}?</>,
    options: [
      'The element where the event started',
      'The element whose listener is running',
      <>Always {c('document')}</>,
      'The parent element',
    ],
    answer: 0,
    why: 'target never changes during the journey. currentTarget is the one whose listener is running.',
  },
  {
    q: (
      <>
        Why doesn’t {c('btn.removeEventListener("click", () => go())')} remove a listener added with{' '}
        {c('btn.addEventListener("click", () => go())')}?
      </>
    ),
    options: [
      'The two arrow functions are different functions',
      'Arrow functions can never be listeners',
      <>You need {c('{ once: true }')}</>,
      'removeEventListener only works on forms',
    ],
    answer: 0,
    why: 'Writing an arrow function again makes a new function object, so it doesn’t match. Keep a reference to the original.',
  },
  {
    q: 'What’s the main benefit of event delegation?',
    options: [
      'One listener on a parent handles all its children, even new ones',
      'Events stop bubbling',
      'Handlers run twice as fast',
      'It prevents default actions',
    ],
    answer: 0,
    why: 'Clicks bubble up to the parent, and e.target.closest(...) finds which child was clicked.',
  },
  {
    q: 'Which technique fits a search box that should search only after the user pauses typing?',
    options: ['Debounce', 'Throttle', c('stopPropagation'), c('preventDefault')],
    answer: 0,
    why: 'Debounce waits until the events go quiet for a moment, then runs once.',
  },
  {
    q: <>How does React’s {c('onClick')} relate to this article?</>,
    options: [
      'It’s the same idea with nicer syntax, and React uses delegation internally',
      'It’s unrelated to DOM events',
      'It only works on links',
      'It disables bubbling',
    ],
    answer: 0,
    why: 'React listens at the root of your app and calls the right component’s handler: delegation.',
  },
];

const QUESTIONS = WRITTEN.map((q, i) => place(q, POSITIONS[i]));

export default function EventsQuiz() {
  return <Quiz questions={QUESTIONS} title="Test yourself" />;
}
