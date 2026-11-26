import { Quiz, type QuizQuestion } from '../core/Quiz';

/** End-of-article self-check for "Fetching Data from APIs". */
const c = (code: string) => <code key={code}>{code}</code>;

/** Questions are written with the right answer first; `at` moves it, so it isn't always option A. */
const place = (q: QuizQuestion, at: number): QuizQuestion => {
  const [right, ...rest] = q.options;
  return { ...q, options: [...rest.slice(0, at), right, ...rest.slice(at)], answer: at };
};
const POSITIONS = [0, 3, 1, 2, 0, 1, 3, 2, 0];

const WRITTEN: QuizQuestion[] = [
  {
    q: 'Which HTTP method is used to read data?',
    options: [c('GET'), c('POST'), c('DELETE'), c('PATCH')],
    answer: 0,
    why: 'GET reads. POST creates, PATCH/PUT update, DELETE removes.',
  },
  {
    q: 'What does a status code in the 4xx range mean?',
    options: [
      'The request was wrong (a client error)',
      'Success',
      'The server crashed',
      'A redirect',
    ],
    answer: 0,
    why: '4xx means you asked wrongly (404, 400, 401…). 5xx is the server’s fault.',
  },
  {
    q: <>Why does {c('fetch')} need two awaits?</>,
    options: [
      'The first waits for the response to start (status and headers), and the second reads and parses the body',
      'To send the request twice',
      <>Because {c('fetch')} is slow</>,
      'The second one is optional',
    ],
    answer: 0,
    why: 'await fetch() gives a Response as soon as the headers arrive; await response.json() waits for the body.',
  },
  {
    q: <>What happens when {c('fetch')} gets a 404 response?</>,
    options: [
      <>
        The promise resolves, and {c('response.ok')} is {c('false')}
      </>,
      'The promise rejects',
      'It retries automatically',
      <>It returns {c('null')}</>,
    ],
    answer: 0,
    why: 'The server did answer, so fetch resolves. Checking response.ok is your job.',
  },
  {
    q: <>When does {c('fetch')} reject?</>,
    options: [
      'On network failure (or when aborted)',
      'On any non-200 status',
      'On 404 only',
      'Never',
    ],
    answer: 0,
    why: 'Only when no answer could come back at all, or when you cancel it.',
  },
  {
    q: 'What must you include to POST JSON?',
    options: [
      <>
        {c('method: "POST"')}, a {c('Content-Type: application/json')} header and{' '}
        {c('body: JSON.stringify(data)')}
      </>,
      c('Just body: data'),
      c('method: "JSON"'),
      c('headers: "POST"'),
    ],
    answer: 0,
    why: 'The method says what to do, the header says it’s JSON, and the body must be a JSON string.',
  },
  {
    q: <>How do you cancel a {c('fetch')}?</>,
    options: [
      <>
        Pass an {c('AbortController')}’s {c('signal')}, then call {c('controller.abort()')}
      </>,
      c('Call fetch.stop()'),
      <>Set the URL to {c('null')}</>,
      'Reload the page',
    ],
    answer: 0,
    why: 'The fetch then rejects with an AbortError, which you can ignore quietly.',
  },
  {
    q: 'Why shouldn’t you put a secret API key in front-end JavaScript?',
    options: [
      'Anyone can see it in DevTools',
      'It makes fetch slower',
      'Browsers delete it',
      'It breaks JSON',
    ],
    answer: 0,
    why: 'Front-end code and its requests are visible to every visitor. Keep secrets on a server.',
  },
  {
    q: <>What does {c('204 No Content')} mean for your code?</>,
    options: [
      <>There’s no body, so don’t call {c('response.json()')} on it</>,
      'The request failed',
      'The server is down',
      'You must retry',
    ],
    answer: 0,
    why: 'It succeeded, but there’s nothing to parse: response.json() would throw a SyntaxError.',
  },
];

const QUESTIONS = WRITTEN.map((q, i) => place(q, POSITIONS[i]));

export default function FetchQuiz() {
  return <Quiz questions={QUESTIONS} title="Test yourself" />;
}
