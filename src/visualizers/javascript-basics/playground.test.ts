import { describe, expect, it } from 'vitest';
import { buildSrcdoc, codeStartLine, GUARD, MAX_ITERATIONS, protectLoops } from './playground';

/** Run protected code with a guard that counts calls and throws at a small limit. */
function runGuarded(code: string, limit = 1000) {
  let calls = 0;
  const guard = () => {
    if (++calls > limit) throw new Error('limit');
    return true;
  };
  const logs: unknown[] = [];
  new Function(GUARD, 'console', protectLoops(code))(guard, { log: (v: unknown) => logs.push(v) });
  return { calls, logs };
}

describe('protectLoops', () => {
  it('stops infinite while, for and do…while loops', () => {
    expect(() => runGuarded('while (true) {}')).toThrow('limit');
    expect(() => runGuarded('for (;;) {}')).toThrow('limit');
    expect(() => runGuarded('let i = 0; do { i++ } while (i > -1)')).toThrow('limit');
    expect(() => runGuarded('for (let i = 0; i < 5; i--) {}')).toThrow('limit');
  });

  it('leaves normal loops working the same', () => {
    const tri = runGuarded('for (let row = 1; row <= 5; row++) { console.log("*".repeat(row)); }');
    expect(tri.logs).toEqual(['*', '**', '***', '****', '*****']);

    const sum = runGuarded(
      'let s = 0; for (const n of [1, 2, 3]) { s += n } let k = 0; while (k < 3) k++; console.log(s, k);',
    );
    expect(sum.logs).toEqual([6]);
  });

  it('guards for…of loops with a braced body', () => {
    expect(protectLoops('for (const x of xs) { a(x) }')).toContain(`{ ${GUARD}();`);
  });

  it('ignores loop words inside strings, comments and longer names', () => {
    const code = `const s = "while (true)"; // for (;;)\n[1].forEach(x => x); /* while(1) */`;
    expect(protectLoops(code)).toBe(code);
  });

  it('keeps line numbers the same', () => {
    const code = 'let i = 0;\nwhile (i < 3) {\n  i++;\n}\nfor (let j = 0;\n j < 2;\n j++) {}';
    expect(protectLoops(code).split('\n').length).toBe(code.split('\n').length);
  });

  it('handles parentheses and semicolons inside the loop header', () => {
    const r = runGuarded(
      'const a = [1,2]; for (let i = (0); i < a.length; i++) { console.log(a[i]) }',
    );
    expect(r.logs).toEqual([1, 2]);
  });
});

describe('buildSrcdoc', () => {
  const theme = { bg: 'black', text: 'white', accent: 'blue', border: 'grey' };

  it('cannot be broken out of with a closing script tag', () => {
    const doc = buildSrcdoc('console.log("</script><b>")', 'r1', theme);
    expect(doc.match(/<\/script>/g)?.length).toBe(3); // prelude, user code, "done"
  });

  it('knows where the reader’s code starts, for error line numbers', () => {
    const start = codeStartLine(theme);
    const lines = buildSrcdoc('first line\nsecond', 'r', theme).split('\n');
    expect(lines[start - 1]).toBe('first line');
  });

  it('sets a sensible iteration cap', () => {
    expect(MAX_ITERATIONS).toBeGreaterThanOrEqual(1_000_000);
  });
});
