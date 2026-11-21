/** Questions for GuessTheOutput. Each answer was checked in a real console. */

export interface GuessQuestion {
  /** The expression, exactly as you'd type it in a console. */
  expr: string;
  /** Answer options, written the way the console prints them. */
  options: string[];
  /** Index of the correct option. */
  answer: number;
  why: string;
}

export const QUESTIONS: GuessQuestion[] = [
  {
    expr: '"5" + 3',
    options: ['8', '"53"', 'NaN', 'Error'],
    answer: 1,
    why: '+ with a string joins text.',
  },
  {
    expr: '"5" - 3',
    options: ['"53"', '"2"', '2', 'NaN'],
    answer: 2,
    why: '- only does math, so "5" becomes 5.',
  },
  {
    expr: '"5" * "2"',
    options: ['10', '"55"', '"10"', 'NaN'],
    answer: 0,
    why: 'Both strings are converted to numbers.',
  },
  {
    expr: 'true + 1',
    options: ['"true1"', '2', 'NaN', 'true'],
    answer: 1,
    why: 'true becomes 1.',
  },
  {
    expr: '[] + []',
    options: ['[]', '0', '""', 'Error'],
    answer: 2,
    why: 'Both arrays become empty strings, and "" + "" is "".',
  },
  {
    expr: 'typeof null',
    options: ['"null"', '"object"', '"undefined"', 'Error'],
    answer: 1,
    why: 'A famous bug from 1995, kept so old sites don’t break.',
  },
  {
    expr: '0.1 + 0.2 === 0.3',
    options: ['true', 'false'],
    answer: 1,
    why: 'Binary floating point gives 0.30000000000000004.',
  },
  {
    expr: '5 == "5"',
    options: ['true', 'false'],
    answer: 0,
    why: '== converts types first.',
  },
  {
    expr: '5 === "5"',
    options: ['true', 'false'],
    answer: 1,
    why: '=== compares type and value.',
  },
  {
    expr: 'NaN === NaN',
    options: ['true', 'false'],
    answer: 1,
    why: 'NaN is not equal to anything, even itself.',
  },
];
