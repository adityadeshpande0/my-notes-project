import { describe, expect, it } from 'vitest';
import { evaluate, parse, ParseError, print, type Expr } from './evalSteps';
import { LOGIC_PRESETS, PRECEDENCE_PRESETS, SERVER_REPLY } from './presets';

/**
 * Run the printed expression as real JavaScript. Tests only: the app never
 * turns text into code.
 */
function realJs(expr: Expr, vars: Record<string, unknown> = {}) {
  let calls = 0;
  const askServer = () => {
    calls++;
    return SERVER_REPLY;
  };
  const names = Object.keys(vars);
  const fn = new Function(...names, 'askServer', `return (${print(expr)});`);
  const value = fn(...names.map((n) => vars[n]), askServer);
  return { value, calls };
}

function ours(expr: Expr, vars: Record<string, unknown> = {}) {
  const r = evaluate(expr, { vars, fns: { askServer: () => SERVER_REPLY } });
  const last = r.steps[r.steps.length - 1];
  return { value: r.value, calls: last.calls.askServer ?? 0, steps: r.steps };
}

describe('LogicShortCircuit presets', () => {
  for (const preset of LOGIC_PRESETS) {
    it(`${preset.name} matches real JavaScript`, () => {
      // Try every combination of the toggles, not just the default.
      const toggles = preset.toggles ?? [];
      for (let mask = 0; mask < 2 ** toggles.length; mask++) {
        const vars = { ...preset.vars };
        toggles.forEach((t, i) => (vars[t] = Boolean(mask & (1 << i))));
        for (const expr of preset.exprs) {
          const real = realJs(expr, vars);
          const mine = ours(expr, vars);
          expect(Object.is(mine.value, real.value)).toBe(true);
          expect(mine.calls).toBe(real.calls);
        }
      }
    });
  }

  it('skips askServer() after false &&', () => {
    const r = ours(LOGIC_PRESETS[0].exprs[0]);
    expect(r.calls).toBe(0);
    expect(r.steps[r.steps.length - 1].skipped).toEqual(['n.r']);
  });

  it('returns real values, not booleans', () => {
    expect(ours(LOGIC_PRESETS[2].exprs[0]).value).toBe('Guest');
    expect(ours(LOGIC_PRESETS[4].exprs[0], { user: null }).value).toBe(null);
  });
});

describe('PrecedenceTree presets', () => {
  for (const preset of PRECEDENCE_PRESETS) {
    it(`${preset.name} matches real JavaScript`, () => {
      expect(print(preset.expr)).toBe(preset.name);
      expect(Object.is(ours(preset.expr).value, realJs(preset.expr).value)).toBe(true);
    });
  }

  it('rewrites the big expression one piece at a time', () => {
    const lines = ours(PRECEDENCE_PRESETS[0].expr).steps.map((s) => s.text);
    const unique = lines.filter((l, i) => l !== lines[i - 1]);
    expect(unique).toEqual([
      '2 + 3 * 4 ** 2 > 40 && !false',
      '2 + 3 * 16 > 40 && !false',
      '2 + 48 > 40 && !false',
      '50 > 40 && !false',
      'true && !false',
      'true && true',
      'true',
    ]);
  });

  it('drops brackets once their inside is worked out', () => {
    const lines = ours(parse('(2 + 3) * 4')).steps.map((s) => s.text);
    expect(lines).toContain('5 * 4');
  });

  it('gets the classic gotchas right', () => {
    expect(ours(parse('10 - 4 - 3')).value).toBe(3);
    expect(ours(parse('2 ** 3 ** 2')).value).toBe(512);
    expect(ours(parse('5 > 3 > 1')).value).toBe(false);
    expect(ours(parse('"Total: " + 2 + 3')).value).toBe('Total: 23');
  });
});

describe('the safe parser', () => {
  it('rejects things JavaScript rejects', () => {
    expect(() => parse('-2 ** 2')).toThrow(ParseError);
    expect(() => parse('!2 ** 2')).toThrow(ParseError);
    expect(() => parse('1 ?? 2 || 3')).toThrow(ParseError);
    expect(() => parse('1 && 2 ?? 3')).toThrow(ParseError);
    // ...and the same things really are SyntaxErrors in JavaScript.
    for (const src of ['-2 ** 2', '1 ?? 2 || 3', '1 && 2 ?? 3'])
      expect(() => new Function(`return ${src}`)).toThrow(SyntaxError);
  });

  it('allows what JavaScript allows', () => {
    expect(ours(parse('(-2) ** 2')).value).toBe(4);
    expect(ours(parse('2 ** -1')).value).toBe(0.5);
    expect(ours(parse('(1 ?? 2) || 3')).value).toBe(1);
    expect(ours(parse('null ?? "x"')).value).toBe('x');
  });

  it('refuses names and unknown symbols (no code can sneak in)', () => {
    expect(() => parse('alert(1)')).toThrow(ParseError);
    expect(() => parse('a = 1')).toThrow(ParseError);
    expect(() => parse('2 +')).toThrow(ParseError);
    expect(() => parse('(2 + 3')).toThrow(ParseError);
  });

  // Random expressions: build source text, parse it, and compare with real JS.
  // A tiny seeded generator keeps the test repeatable.
  let seed = 42;
  const rand = (n: number) => {
    seed = (seed * 1103515245 + 12345) % 2 ** 31;
    return seed % n;
  };
  const pick = <T>(xs: T[]) => xs[rand(xs.length)];
  const ATOMS = [
    '0',
    '1',
    '2',
    '3',
    '7',
    '10',
    'true',
    'false',
    'null',
    '""',
    '"a"',
    '"10"',
    '"9"',
    'NaN',
  ];
  const OPS = ['+', '-', '*', '/', '%', '**', '<', '>', '<=', '>=', '===', '!==', '&&', '||'];

  const genFlat = () => {
    // No brackets at all: this tests precedence and associativity.
    let src = pick(ATOMS);
    const n = 1 + rand(5);
    for (let i = 0; i < n; i++) src += ` ${pick(OPS)} ${rand(4) === 0 ? '!' : ''}${pick(ATOMS)}`;
    return src;
  };
  const genNested = (depth: number): string => {
    if (depth === 0 || rand(3) === 0) return pick(ATOMS);
    const op = pick([...OPS, '??']);
    return `(${genNested(depth - 1)} ${op} ${genNested(depth - 1)})`;
  };

  it('matches real JavaScript on 400 random expressions', () => {
    for (let i = 0; i < 400; i++) {
      const src = i % 2 ? genFlat() : genNested(4);
      let tree: Expr;
      try {
        tree = parse(src);
      } catch (e) {
        // Our parser refused it, so JavaScript must refuse it too.
        expect(e).toBeInstanceOf(ParseError);
        expect(() => new Function(`return ${src}`)).toThrow(SyntaxError);
        continue;
      }
      const real = new Function(`return ${src}`)();
      const mine = ours(tree).value;
      expect(Object.is(mine, real), `${src}: got ${String(mine)}, JS says ${String(real)}`).toBe(
        true,
      );
    }
  });
});
