import type { Chain, ChainStep } from './lib/ifChain';
import type { CodeLine } from './parts';

/**
 * The chain's code with the line being checked highlighted, ✓/✗ on checked
 * conditions, and blocks that never run dimmed.
 */
export function chainCodeLines<T>(
  chain: Chain<T>,
  step: ChainStep,
  header: string[] = [],
): CodeLine[] {
  const n = chain.branches.length;
  const ran = step.phase === 'run' || step.phase === 'end';
  const lines: CodeLine[] = header.map((text) => ({ text }));
  chain.branches.forEach((b, i) => {
    const r = step.results[i];
    lines.push({
      text: `${i === 0 ? 'if' : '} else if'} (${b.cond}) {`,
      state: step.phase === 'check' && step.at === i ? 'on' : ran && r === null ? 'dim' : undefined,
      badge:
        r === true
          ? { text: '✓ true', tone: 'yes' }
          : r === false
            ? { text: '✗ false', tone: 'no' }
            : ran
              ? { text: 'skipped', tone: 'muted' }
              : undefined,
    });
    lines.push({
      text: `  ${b.action};`,
      state: ran && step.taken === i ? 'on' : ran ? 'dim' : undefined,
    });
  });
  lines.push({ text: '} else {', state: ran && step.taken !== n ? 'dim' : undefined });
  lines.push({
    text: `  ${chain.otherwise.action};`,
    state: ran && step.taken === n ? 'on' : ran ? 'dim' : undefined,
  });
  lines.push({ text: '}' });
  return lines;
}
