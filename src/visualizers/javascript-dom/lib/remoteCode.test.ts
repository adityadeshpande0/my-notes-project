import { describe, expect, it } from 'vitest';
import { actionCode, findExpr } from './remoteCode';

describe('the remote writes the code a learner would', () => {
  it('finds with each method', () => {
    expect(findExpr('querySelector', '.tagline')).toBe('document.querySelector(".tagline")');
    expect(findExpr('getElementById', 'title')).toBe('document.getElementById("title")');
    expect(findExpr('querySelectorAll', '[data-id="3"]')).toBe(
      'document.querySelectorAll("[data-id=\\"3\\"]")',
    );
  });
  it('changes one element, the first of a list, or all of them', () => {
    const t = (x: string) => `${x}.textContent = "Fresh every morning"`;
    expect(actionCode('querySelector', '.tagline', false, t)).toBe(
      'document.querySelector(".tagline").textContent = "Fresh every morning";',
    );
    expect(actionCode('querySelectorAll', '.item', false, t)).toBe(
      'document.querySelectorAll(".item")[0].textContent = "Fresh every morning";',
    );
    expect(actionCode('querySelectorAll', '.item', true, (x) => `${x}.remove()`)).toBe(
      'for (const el of document.querySelectorAll(".item")) {\n  el.remove();\n}',
    );
  });
});
