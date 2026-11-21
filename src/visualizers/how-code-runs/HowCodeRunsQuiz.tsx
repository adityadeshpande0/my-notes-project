import { Quiz, type QuizQuestion } from '../core/Quiz';

/** Five questions on the article. Each answer reveals why. */

const QUESTIONS: QuizQuestion[] = [
  {
    q: 'What is the ONLY language a CPU actually understands?',
    options: ['JavaScript', 'Assembly', 'Machine code (binary instructions)', 'English'],
    answer: 2,
    why: 'Assembly is a human-readable spelling of machine code, but the CPU only ever sees the bits.',
  },
  {
    q: 'In the fetch → decode → execute cycle, what does the Program Counter (PC) hold?',
    options: [
      'The result of the last addition',
      'The address of the next instruction',
      'The number of clock ticks so far',
      "The current variable's name",
    ],
    answer: 1,
    why: 'The PC points at the next instruction in memory. After each fetch it moves forward (or jumps, for loops and ifs).',
  },
  {
    q: 'What makes a transistor switch ON?',
    options: [
      'A tiny motor closes a contact',
      'Enough voltage on the gate pulls electrons into a channel',
      "The CPU's fan cools it down",
      'Light hits the silicon',
    ],
    answer: 1,
    why: 'Above the threshold voltage, the gate attracts electrons that form a conductive channel between source and drain.',
  },
  {
    q: '1 + 1 in a single full adder (no carry in) gives…',
    options: ['sum 2', 'sum 1, carry 0', 'sum 0, carry 1', 'sum 1, carry 1'],
    answer: 2,
    why: 'Binary has no digit "2". 1 + 1 = 10₂, so the sum bit is 0 and we carry 1 to the next column (sum = XOR, carry = AND).',
  },
  {
    q: 'How does JavaScript usually get to machine code in a browser?',
    options: [
      "It's compiled to an .exe before you visit the site",
      'The engine parses it, interprets bytecode, then JIT-compiles hot code to machine code',
      'The CPU reads JavaScript directly',
      "It's converted to Python first",
    ],
    answer: 1,
    why: 'Engines like V8 start fast with an interpreter, then compile frequently run ("hot") functions to optimized machine code while your page runs.',
  },
];

export default function HowCodeRunsQuiz() {
  return <Quiz questions={QUESTIONS} />;
}
