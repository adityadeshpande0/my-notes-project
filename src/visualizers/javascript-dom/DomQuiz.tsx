import { Quiz, type QuizQuestion } from '../core/Quiz';

/** End-of-article self-check for "The DOM". */
const c = (code: string) => <code key={code}>{code}</code>;

/** Questions are written with the right answer first; `at` moves it, so it isn't always option A. */
const place = (q: QuizQuestion, at: number): QuizQuestion => {
  const [right, ...rest] = q.options;
  return { ...q, options: [...rest.slice(0, at), right, ...rest.slice(at)], answer: at };
};
const POSITIONS = [0, 2, 1, 3, 0, 1, 2, 1, 3];

const WRITTEN: QuizQuestion[] = [
  {
    q: 'What is the DOM?',
    options: [
      'The browser’s tree of objects built from the HTML',
      'A JavaScript library',
      'The HTML file on the server',
      'A CSS framework',
    ],
    answer: 0,
    why: 'The browser reads your HTML and builds a live tree of objects. JavaScript changes that tree, not the file.',
  },
  {
    q: <>What does {c('document.querySelector(".item")')} return?</>,
    options: [
      <>The first element with class {c('item')}</>,
      <>All elements with class {c('item')}</>,
      'An array',
      <>Always {c('true')}</>,
    ],
    answer: 0,
    why: 'querySelector gives the first match. For all of them, use querySelectorAll.',
  },
  {
    q: <>What does {c('querySelector')} return when nothing matches?</>,
    options: [c('null'), c('undefined'), 'An empty array', 'An error'],
    answer: 0,
    why: 'It returns null, so check (or use ?.) before changing it.',
  },
  {
    q: 'Which is the cleanest way to switch dark mode on an element?',
    options: [
      c('el.classList.toggle("dark")'),
      c('el.style = "dark"'),
      c('el.dark = true'),
      c('el.innerHTML = "dark"'),
    ],
    answer: 0,
    why: 'Keep the looks in a .dark CSS class and just switch the class from JavaScript.',
  },
  {
    q: (
      <>
        After {c('const li = document.createElement("li")')}, is the {c('li')} on the page?
      </>
    ),
    options: [
      'No, not until it’s appended to the tree',
      'Yes, at the bottom',
      'Yes, at the top',
      'Only if it has text',
    ],
    answer: 0,
    why: 'A new element only exists in memory until you attach it with append, prepend, before or after.',
  },
  {
    q: <>Which method adds an element as the last child of {c('list')}?</>,
    options: [c('list.append(el)'), c('list.push(el)'), c('list.add(el)'), c('list.last = el')],
    answer: 0,
    why: 'append adds at the end; prepend adds at the start. push is for arrays.',
  },
  {
    q: <>Why is {c('el.innerHTML = userInput')} dangerous?</>,
    options: [
      'User input can inject HTML that runs code (XSS)',
      'It’s slower',
      'It deletes the page',
      'It only works in Chrome',
    ],
    answer: 0,
    why: 'innerHTML builds real elements, and handlers like onerror on them run. Use textContent for text.',
  },
  {
    q: (
      <>
        What does the {c('defer')} attribute on a {c('<script>')} do?
      </>
    ),
    options: [
      'Runs the script after the HTML has been read',
      'Never runs the script',
      'Runs it twice',
      'Loads it from the cache only',
    ],
    answer: 0,
    why: 'The script downloads straight away but waits to run until the HTML is parsed, so your elements exist.',
  },
  {
    q: 'How does React relate to the DOM?',
    options: [
      'You describe the UI, and React makes the DOM changes for you',
      'React doesn’t use the DOM',
      'React replaces HTML with JSON',
      'React edits your HTML files',
    ],
    answer: 0,
    why: 'React compares what you described with last time and applies the DOM changes needed: the same methods you met here.',
  },
];

const QUESTIONS = WRITTEN.map((q, i) => place(q, POSITIONS[i]));

export default function DomQuiz() {
  return <Quiz questions={QUESTIONS} title="Test yourself" />;
}
