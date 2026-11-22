/**
 * A step-by-step simulation of a `switch` statement. Plain TypeScript, no React.
 *
 * The rules (the same as real JavaScript, for a switch whose `default` is last):
 * 1. Compare the value with each case using ===, top to bottom.
 * 2. Start running at the first match (or at default if nothing matched).
 * 3. Keep running case bodies, *without checking*, until a `break` (fall-through).
 *
 * switchSim.test.ts builds the real switch for every value and every
 * combination of break toggles and checks the console output is identical.
 */
import { show } from './format';

export interface SwitchCase {
  /** The value after `case`. */
  match: unknown;
  /** What the case logs, or null for an empty case that falls through on purpose. */
  output: string | null;
}

export interface SwitchSpec {
  id: string;
  name: string;
  /** The variable name, e.g. "day". */
  subject: string;
  cases: SwitchCase[];
  defaultOutput: string;
  /** The values you can send down the track. */
  values: unknown[];
}

export type SwitchPhase = 'start' | 'check' | 'run' | 'fall' | 'break' | 'end';

export interface SwitchStep {
  phase: SwitchPhase;
  /** Station index (cases.length = default), or -1 before the first station. */
  at: number;
  /** === result for 'check' steps. */
  matched?: boolean;
  /** Everything printed so far. */
  output: string[];
  message: string;
}

/**
 * `breaks[i]` says whether case i ends with `break;`. Empty cases never get
 * one (they share the next case's body).
 */
export function switchSteps(spec: SwitchSpec, value: unknown, breaks: boolean[]): SwitchStep[] {
  const { cases } = spec;
  const out: string[] = [];
  const steps: SwitchStep[] = [
    { phase: 'start', at: -1, output: [], message: `The train enters carrying ${show(value)}.` },
  ];

  let start = cases.length; // default
  for (let i = 0; i < cases.length; i++) {
    const ok = value === cases[i].match; // the real ===
    steps.push({
      phase: 'check',
      at: i,
      matched: ok,
      output: [...out],
      message: ok
        ? `${show(value)} === ${show(cases[i].match)} is true. A match! Start running here.`
        : `${show(value)} === ${show(cases[i].match)} is false. Keep going.${sameButDifferent(value, cases[i].match)}`,
    });
    if (ok) {
      start = i;
      break;
    }
  }
  if (start === cases.length) {
    steps.push({
      phase: 'run',
      at: cases.length,
      output: [...out, spec.defaultOutput],
      message: 'Nothing matched, so the train rides to default.',
    });
    out.push(spec.defaultOutput);
    steps.push({ phase: 'end', at: cases.length, output: [...out], message: 'End of the switch.' });
    return steps;
  }

  for (let i = start; i <= cases.length; i++) {
    const isDefault = i === cases.length;
    const body = isDefault ? spec.defaultOutput : cases[i].output;
    if (i > start) {
      steps.push({
        phase: 'fall',
        at: i,
        output: [...out],
        message: `No break above, so the train falls through into ${isDefault ? 'default' : `case ${show(cases[i].match)}`} without checking it.`,
      });
    }
    if (body !== null) {
      out.push(body);
      steps.push({
        phase: 'run',
        at: i,
        output: [...out],
        message: `Run console.log(${show(body)}).`,
      });
    }
    if (!isDefault && body !== null && breaks[i]) {
      steps.push({
        phase: 'break',
        at: i,
        output: [...out],
        message: 'break; jumps out of the switch.',
      });
      steps.push({ phase: 'end', at: i, output: [...out], message: 'Done.' });
      return steps;
    }
  }
  steps.push({
    phase: 'end',
    at: cases.length,
    output: [...out],
    message: 'Reached the end of the switch.',
  });
  return steps;
}

/** A hint when two values look alike but === says no. */
function sameButDifferent(a: unknown, b: unknown): string {
  if (typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase())
    return ' Case matters: they’re different strings.';
  if (typeof a !== typeof b && String(a) === String(b))
    return ` Same characters, different types (${typeof a} vs ${typeof b}).`;
  return '';
}

export interface SwitchLine {
  text: string;
  /** Which station the line belongs to (cases.length = default), or -1. */
  station: number;
  part: 'case' | 'body' | 'break' | 'other';
}

/** The switch as code, line by line. Lines for `break;` appear only where the toggle is on. */
export function switchCodeLines(spec: SwitchSpec, value: unknown, breaks: boolean[]): SwitchLine[] {
  const other = (text: string): SwitchLine => ({ text, station: -1, part: 'other' });
  const lines = [
    other(`const ${spec.subject} = ${show(value)};`),
    other(''),
    other(`switch (${spec.subject}) {`),
  ];
  spec.cases.forEach((c, i) => {
    lines.push({ text: `  case ${show(c.match)}:`, station: i, part: 'case' });
    if (c.output !== null) {
      lines.push({ text: `    console.log(${show(c.output)});`, station: i, part: 'body' });
      if (breaks[i]) lines.push({ text: '    break;', station: i, part: 'break' });
    }
  });
  const d = spec.cases.length;
  lines.push({ text: '  default:', station: d, part: 'case' });
  lines.push({ text: `    console.log(${show(spec.defaultOutput)});`, station: d, part: 'body' });
  lines.push(other('}'));
  return lines;
}

export const switchCode = (spec: SwitchSpec, value: unknown, breaks: boolean[]) =>
  switchCodeLines(spec, value, breaks)
    .map((l) => l.text)
    .join('\n');

export const SWITCH_PRESETS: SwitchSpec[] = [
  {
    id: 'days',
    name: 'Weekend or not',
    subject: 'day',
    cases: [
      { match: 'Sat', output: null },
      { match: 'Sun', output: 'Weekend! 🎉' },
      { match: 'Fri', output: 'Almost there…' },
    ],
    defaultOutput: 'Work day 💼',
    values: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'sat', 6, '6'],
  },
  {
    id: 'traffic',
    name: 'Traffic light',
    subject: 'light',
    cases: [
      { match: 'red', output: 'Stop' },
      { match: 'yellow', output: 'Slow down' },
      { match: 'green', output: 'Go' },
    ],
    defaultOutput: 'Broken light?',
    values: ['red', 'yellow', 'green', 'Red', 'blue'],
  },
];
