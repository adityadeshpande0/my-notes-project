/**
 * The six case files for LoopBugHunter (#8). Each case runs through the
 * simulator in loopSim.ts (never through eval), both as written and fixed.
 * bugCases.test.ts checks every output against a real loop.
 */
import { collectIn, forSteps, GUARD, laneSteps } from './loopSim';

export interface RunResult {
  output: string[];
  /** True when the guard stopped an infinite loop. */
  infinite: boolean;
}

export interface BugCase {
  id: string;
  title: string;
  code: string[];
  question: string;
  options: string[];
  answer: number;
  /** What the case teaches, shown after answering. */
  why: string;
  run: () => RunResult;
  /** The corrected line, as a diff: the part removed and the part added. */
  fix?: { line: number; before: string; removed: string; added: string; after: string };
  runFixed?: () => RunResult;
}

const forRun = (...args: Parameters<typeof forSteps>): RunResult => {
  const steps = forSteps(...args);
  const end = steps[steps.length - 1];
  return { output: end.output, infinite: end.phase === 'guard' };
};

const show = (v: unknown) => (typeof v === 'string' ? JSON.stringify(v) : String(v));
const ARR = ['a', 'b', 'c'];

export const BUG_CASES: BugCase[] = [
  {
    id: 'down',
    title: 'Case 1: The loop that wouldn’t stop',
    code: ['for (let i = 0; i < 5; i--) {', '  console.log(i);', '}'],
    question: 'How many times does it print?',
    options: ['5', '4', 'Forever'],
    answer: 2,
    why: 'i-- makes i smaller: 0, -1, -2… It’s always below 5, so the condition never becomes false.',
    run: () => forRun({ start: 0, op: '<', limit: 5, update: 'i--' }),
    fix: { line: 0, before: 'for (let i = 0; i < 5; ', removed: 'i--', added: 'i++', after: ') {' },
    runFixed: () => forRun({ start: 0, op: '<', limit: 5, update: 'i++' }),
  },
  {
    id: 'missing',
    title: 'Case 2: The forgetful counter',
    code: ['let n = 0;', 'while (n < 3) {', '  console.log(n);', '}'],
    question: 'What’s missing?',
    options: ['n++ inside the loop', 'A break', 'The word do'],
    answer: 0,
    why: 'Nothing inside the loop changes n, so n < 3 stays true forever.',
    run: () => {
      const steps = laneSteps('while', {
        start: 0,
        test: (n) => n < 3,
        cond: 'n < 3',
        body: (n) => ({ value: n, log: String(n) }),
        bodyCode: 'console.log(n)',
      });
      return {
        output: steps[steps.length - 1].output,
        infinite: steps[steps.length - 1].phase === 'guard',
      };
    },
    fix: { line: 2, before: '  console.log(n);', removed: '', added: ' n++;', after: '' },
    runFixed: () => {
      const steps = laneSteps('while', {
        start: 0,
        test: (n) => n < 3,
        cond: 'n < 3',
        body: (n) => {
          const log = String(n);
          n++;
          return { value: n, log };
        },
        bodyCode: 'console.log(n); n++',
      });
      return { output: steps[steps.length - 1].output, infinite: false };
    },
  },
  {
    id: 'off-by-one',
    title: 'Case 3: One step too far',
    code: [
      'const arr = ["a", "b", "c"];',
      'for (let i = 0; i <= arr.length; i++) {',
      '  console.log(arr[i]);',
      '}',
    ],
    question: 'What’s the last thing printed?',
    options: ['"c"', 'undefined', 'An error'],
    answer: 1,
    why: 'arr.length is 3, but the last index is 2. arr[3] doesn’t exist, and reading it gives undefined (not an error).',
    run: () =>
      forRun({ start: 0, op: '<=', limit: ARR.length, update: 'i++' }, (i) => show(ARR[i])),
    fix: {
      line: 1,
      before: 'for (let i = 0; i ',
      removed: '<=',
      added: '<',
      after: ' arr.length; i++) {',
    },
    runFixed: () =>
      forRun({ start: 0, op: '<', limit: ARR.length, update: 'i++' }, (i) => show(ARR[i])),
  },
  {
    id: 'short',
    title: 'Case 4: Print 1 to 5',
    code: ['for (let i = 1; i < 5; i++) {', '  console.log(i);', '}'],
    question: 'Does it print 5?',
    options: ['Yes', 'No, it stops at 4'],
    answer: 1,
    why: 'When i reaches 5, 5 < 5 is false, so the loop stops before printing it. Use <= to include 5.',
    run: () => forRun({ start: 1, op: '<', limit: 5, update: 'i++' }),
    fix: { line: 0, before: 'for (let i = 1; i ', removed: '<', added: '<=', after: ' 5; i++) {' },
    runFixed: () => forRun({ start: 1, op: '<=', limit: 5, update: 'i++' }),
  },
  {
    id: 'threes',
    title: 'Case 5: Counting by threes',
    code: ['for (let i = 0; i < 10; i += 3) {', '  console.log(i);', '}'],
    question: 'How many times does it print?',
    options: ['3', '4', '10'],
    answer: 1,
    why: 'Not a bug, a counting check: 0, 3, 6, 9. The next value, 12, fails i < 10.',
    run: () => forRun({ start: 0, op: '<', limit: 10, update: 'i += 3' }),
  },
  {
    id: 'for-in-array',
    title: 'Case 6: The string surprise',
    code: ['for (const i in ["x", "y"]) {', '  console.log(i + 1);', '}'],
    question: 'What prints?',
    options: ['1, 2', '"01", "11"', 'x1, y1'],
    answer: 1,
    why: 'for...in gives array indexes as strings: "0" and "1". And a string + 1 joins text (article #2!), so you get "01" and "11".',
    // The keys come from a real for...in, and + is the real operator.
    run: () => ({ output: collectIn(['x', 'y']).map((i) => show(i + 1)), infinite: false }),
    fix: {
      line: 1,
      before: '  console.log(',
      removed: 'i + 1',
      added: 'Number(i) + 1',
      after: ');',
    },
    runFixed: () => ({
      output: collectIn(['x', 'y']).map((i) => show(Number(i) + 1)),
      infinite: false,
    }),
  },
];

export { GUARD };

export const RANKS = ['Rookie', 'Sergeant', 'Detective', 'Sherlock 🕵️'];
/** 0–1 right: Rookie, 2–3: Sergeant, 4–5: Detective, 6: Sherlock. */
export const rankFor = (score: number) =>
  RANKS[score >= 6 ? 3 : score >= 4 ? 2 : score >= 2 ? 1 : 0];
