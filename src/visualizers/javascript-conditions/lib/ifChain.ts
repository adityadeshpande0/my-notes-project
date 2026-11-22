/**
 * Steps for an if / else if / else chain. Plain TypeScript, no React.
 *
 * Each condition is a real JavaScript test (`(m) => m >= 90`), so the path
 * shown is exactly the path real code would take. ifChain.test.ts checks
 * this against a hand-written if/else for every input.
 */

export interface Branch<T> {
  /** The condition as code, e.g. "marks >= 90". */
  cond: string;
  test: (input: T) => boolean;
  /** What the block does, e.g. 'console.log("Grade A")'. */
  action: string;
  /** A short result label for the flowchart box, e.g. "Grade A". */
  label: string;
}

export interface Chain<T> {
  branches: Branch<T>[];
  /** The else block. */
  otherwise: { action: string; label: string };
}

export type ChainPhase = 'start' | 'check' | 'run' | 'end';

export interface ChainStep {
  phase: ChainPhase;
  /** Which condition is being checked or which block runs (branches.length = the else). */
  at: number;
  /** One entry per condition: true/false once checked, null if never checked. */
  results: (boolean | null)[];
  /** The block that runs, once known. */
  taken: number | null;
  message: string;
}

/** Which block runs: the index of the first true condition, or branches.length for else. */
export const pickBranch = <T>(chain: Chain<T>, input: T) => {
  const i = chain.branches.findIndex((b) => b.test(input));
  return i < 0 ? chain.branches.length : i;
};

export function chainSteps<T>(
  chain: Chain<T>,
  input: T,
  describe: (input: T) => string,
): ChainStep[] {
  const n = chain.branches.length;
  const results: (boolean | null)[] = chain.branches.map(() => null);
  const steps: ChainStep[] = [
    {
      phase: 'start',
      at: -1,
      results: [...results],
      taken: null,
      message: `Start with ${describe(input)}.`,
    },
  ];
  let taken = n;
  for (let i = 0; i < n; i++) {
    const b = chain.branches[i];
    const ok = b.test(input);
    results[i] = ok;
    steps.push({
      phase: 'check',
      at: i,
      results: [...results],
      taken: null,
      message: ok
        ? `Is ${b.cond}? Yes. This is the first true condition, so its block wins.`
        : `Is ${b.cond}? No, so move on to the next check.`,
    });
    if (ok) {
      taken = i;
      break;
    }
  }
  const skippedRest = taken < n - 1;
  const block = taken < n ? chain.branches[taken] : chain.otherwise;
  steps.push({
    phase: 'run',
    at: taken,
    results: [...results],
    taken,
    message:
      taken < n
        ? `Run ${block.action}.${skippedRest ? ' The checks below are skipped, even if they would also be true.' : ''}`
        : `Nothing matched, so the else block runs: ${block.action}.`,
  });
  steps.push({
    phase: 'end',
    at: taken,
    results: [...results],
    taken,
    message: `Done. Result: ${block.label}.`,
  });
  return steps;
}

// ─── The chains used in IfElseFlow ────────────────────────────────────

const grade = (min: number, label: string, emoji: string): Branch<number> => ({
  cond: `marks >= ${min}`,
  test: (m) => m >= min,
  action: `console.log("${label} ${emoji}")`,
  label,
});

export const GRADE_CHAIN: Chain<number> = {
  branches: [grade(90, 'Grade A', '🌟'), grade(75, 'Grade B', '👍'), grade(50, 'Grade C', '🙂')],
  otherwise: { action: 'console.log("Try again 💪")', label: 'Try again' },
};

/** The bug: the same checks in the wrong order. */
export const WRONG_GRADE_CHAIN: Chain<number> = {
  branches: [grade(50, 'Grade C', '🙂'), grade(75, 'Grade B', '👍'), grade(90, 'Grade A', '🌟')],
  otherwise: GRADE_CHAIN.otherwise,
};

export const chainCode = (chain: Chain<number>, marks: number) =>
  [
    `const marks = ${marks};`,
    '',
    ...chain.branches.flatMap((b, i) => [
      `${i === 0 ? 'if' : '} else if'} (${b.cond}) {`,
      `  ${b.action};`,
    ]),
    '} else {',
    `  ${chain.otherwise.action};`,
    '}',
  ].join('\n');

export interface Cart {
  total: number;
  isPrime: boolean;
}

export const DELIVERY_CHAIN: Chain<Cart> = {
  branches: [
    {
      cond: 'isPrime || total >= 500',
      test: ({ isPrime, total }) => isPrime || total >= 500,
      action: 'delivery = 0',
      label: 'Free',
    },
    {
      cond: 'total >= 300',
      test: ({ total }) => total >= 300,
      action: 'delivery = 20',
      label: '₹20',
    },
  ],
  otherwise: { action: 'delivery = 40', label: '₹40' },
};

export const DELIVERY_FEES = [0, 20, 40];

export const DELIVERY_CODE = `if (isPrime || total >= 500) {
  delivery = 0;
} else if (total >= 300) {
  delivery = 20;
} else {
  delivery = 40;
}`;
