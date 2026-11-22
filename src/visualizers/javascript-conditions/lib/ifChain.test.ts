import { describe, expect, it } from 'vitest';
import { chainSteps, DELIVERY_CHAIN, GRADE_CHAIN, pickBranch, WRONG_GRADE_CHAIN } from './ifChain';

// The real code from the article, written out by hand.
function realGrade(marks: number) {
  if (marks >= 90) return 'Grade A';
  else if (marks >= 75) return 'Grade B';
  else if (marks >= 50) return 'Grade C';
  else return 'Try again';
}
function realWrongOrder(marks: number) {
  if (marks >= 50) return 'Grade C';
  else if (marks >= 75) return 'Grade B';
  else if (marks >= 90) return 'Grade A';
  else return 'Try again';
}
function realDelivery(total: number, isPrime: boolean) {
  let delivery;
  if (isPrime || total >= 500) delivery = 0;
  else if (total >= 300) delivery = 20;
  else delivery = 40;
  return delivery;
}

const labelOf = (chain: typeof GRADE_CHAIN, i: number) =>
  i < chain.branches.length ? chain.branches[i].label : chain.otherwise.label;

describe('if / else if / else chains', () => {
  it('match the real grade code for every mark from 0 to 100', () => {
    for (let m = 0; m <= 100; m++) {
      expect(labelOf(GRADE_CHAIN, pickBranch(GRADE_CHAIN, m))).toBe(realGrade(m));
      expect(labelOf(WRONG_GRADE_CHAIN, pickBranch(WRONG_GRADE_CHAIN, m))).toBe(realWrongOrder(m));
      const steps = chainSteps(GRADE_CHAIN, m, String);
      expect(labelOf(GRADE_CHAIN, steps[steps.length - 1].taken!)).toBe(realGrade(m));
    }
  });

  it('stop checking at the first true condition', () => {
    const steps = chainSteps(GRADE_CHAIN, 95, String);
    expect(steps[steps.length - 1].results).toEqual([true, null, null]);
    expect(steps.filter((s) => s.phase === 'check')).toHaveLength(1);
  });

  it('match the real delivery code', () => {
    for (let total = 0; total <= 1000; total += 10)
      for (const isPrime of [false, true]) {
        const i = pickBranch(DELIVERY_CHAIN, { total, isPrime });
        expect([0, 20, 40][i]).toBe(realDelivery(total, isPrime));
      }
  });
});
