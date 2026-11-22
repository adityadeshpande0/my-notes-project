import { useMemo, useState, type FormEvent } from 'react';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import {
  evaluate,
  isInside,
  LADDER,
  parse,
  ParseError,
  precedenceLevel,
  ROOT,
  type Expr,
} from './lib/evalSteps';
import { show } from './lib/format';
import { PRECEDENCE_PRESETS } from './lib/presets';
import { Rich } from './parts';

/**
 * #8 Solve it step by step. The expression is drawn as a tree: operators are
 * nodes, values are leaves. Each step works out one node (in JavaScript's
 * real order), its children slide into it, and the line above is rewritten.
 * Steps come from lib/evalSteps.ts, tested against real JavaScript.
 */
export default function PrecedenceTree() {
  const [choice, setChoice] = useState(PRECEDENCE_PRESETS[0].id);
  const [own, setOwn] = useState('');
  const [ownExpr, setOwnExpr] = useState<Expr | null>(null);
  const [error, setError] = useState('');
  const [solves, setSolves] = useState(0); // a new number per Solve, to restart the stepper

  const preset = PRECEDENCE_PRESETS.find((p) => p.id === choice);
  const expr = choice === 'own' && ownExpr ? ownExpr : (preset ?? PRECEDENCE_PRESETS[0]).expr;
  const hint =
    choice === 'own' ? 'Your expression, solved the way JavaScript does it.' : preset?.hint;

  const solve = (e: FormEvent) => {
    e.preventDefault();
    try {
      // The safe parser: it builds a tree from a tiny grammar. Nothing is ever eval'd.
      setOwnExpr(parse(own));
      setChoice('own');
      setSolves((n) => n + 1);
      setError('');
    } catch (err) {
      if (err instanceof ParseError) setError(err.message);
      else throw err;
    }
  };

  return (
    <div className="viz not-prose">
      <p className="viz-title">Solve it step by step</p>
      <p className="viz-sub">Step through and watch JavaScript solve one piece at a time.</p>

      <div className="viz-choices" role="group" aria-label="Examples">
        {PRECEDENCE_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="viz-btn viz-mono jc-small"
            aria-pressed={choice === p.id}
            onClick={() => setChoice(p.id)}
          >
            {p.name}
          </button>
        ))}
      </div>
      <p className="jc-hint">{hint}</p>

      <Solver key={choice === 'own' ? `own-${solves}` : choice} expr={expr} />

      <form className="jc-own-expr" onSubmit={solve}>
        <label className="viz-label" htmlFor="jc-own-expr">
          Try your own
        </label>
        <div className="jc-row">
          <input
            id="jc-own-expr"
            className="jc-input viz-mono"
            value={own}
            placeholder="e.g. 1 + 2 * 3 === 7 || false"
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setOwn(e.target.value)}
            aria-describedby="jc-own-help"
          />
          <button type="submit" className="viz-btn">
            Solve
          </button>
        </div>
        <p
          id="jc-own-help"
          className={`jc-small ${error ? 'jc-error-text' : 'jc-muted'}`}
          aria-live="polite"
        >
          {error ||
            'Numbers, "strings", true/false/null, brackets and + - * / % ** < > <= >= === !== && || ?? !'}
        </p>
      </form>
    </div>
  );
}

interface TreeNode {
  id: string;
  label: string;
  x: number;
  y: number;
  parent: string | null;
  expr: Expr;
  leaf: boolean;
  /** Written inside brackets in the code. */
  bracketed: boolean;
}

const COL = 66;
const ROW = 64;
const PAD = 34;

/** Leaves get the next column; parents sit above the middle of their children. */
function layout(expr: Expr) {
  const nodes: TreeNode[] = [];
  let column = 0;
  const place = (
    e: Expr,
    id: string,
    depth: number,
    parent: string | null,
    bracketed = false,
  ): number => {
    if (e.kind === 'group') return place(e.expr, `${id}.e`, depth, parent, true);
    const node: TreeNode = {
      id,
      label: '',
      x: 0,
      y: PAD + depth * ROW,
      parent,
      expr: e,
      leaf: false,
      bracketed,
    };
    nodes.push(node);
    if (e.kind === 'unary') {
      node.label = e.op;
      node.x = place(e.arg, `${id}.a`, depth + 1, id);
    } else if (e.kind === 'binary' || e.kind === 'logical') {
      node.label = e.op;
      const lx = place(e.left, `${id}.l`, depth + 1, id);
      const rx = place(e.right, `${id}.r`, depth + 1, id);
      node.x = (lx + rx) / 2;
    } else {
      node.leaf = true;
      node.label = e.kind === 'lit' ? show(e.value) : e.kind === 'var' ? e.name : '?';
      node.x = PAD + column++ * COL;
    }
    return node.x;
  };
  place(expr, ROOT, 0, null);
  const width = Math.max(...nodes.map((n) => n.x)) + PAD;
  const height = Math.max(...nodes.map((n) => n.y)) + PAD;
  return { nodes, width, height };
}

function Solver({ expr }: { expr: Expr }) {
  const result = useMemo(() => evaluate(expr), [expr]);
  const tree = useMemo(() => layout(expr), [expr]);
  const s = useStepper(result.steps.length, 1300);
  const step = result.steps[s.index];
  const byId = new Map(tree.nodes.map((n) => [n.id, n]));

  // Only drawn nodes count (brackets aren't drawn as nodes).
  const doneIds = Object.keys(step.done).filter((id) => byId.has(id));
  /** The highest worked-out ancestor that has swallowed this node, if any. */
  const swallowedBy = (id: string) =>
    doneIds.filter((d) => d !== id && isInside(id, d)).sort((a, b) => a.length - b.length)[0];

  // The rewritten expression so far: one line per change.
  const lines: string[] = [];
  for (const st of result.steps.slice(0, s.index + 1))
    if (lines[lines.length - 1] !== st.text) lines.push(st.text);

  const current = byId.get(step.id);
  const level = current
    ? precedenceLevel(current.bracketed ? { kind: 'group', expr: current.expr } : current.expr)
    : null;
  const opLevel = current ? precedenceLevel(current.expr) : null;

  return (
    <>
      <div className="jc-prec">
        <div className="jc-prec-main">
          <ol className="jc-lines viz-mono" aria-label="The expression, rewritten after each step">
            {lines.map((l, i) => (
              <li key={i} className={i === lines.length - 1 ? 'is-on' : undefined}>
                {l}
              </li>
            ))}
          </ol>

          <div className="viz-scroll jc-tree-scroll">
            <svg
              className="jc-tree"
              viewBox={`0 0 ${tree.width} ${tree.height}`}
              style={{ width: tree.width, maxWidth: 'none' }}
              role="img"
              aria-label={`Expression tree. Current step: ${step.text}`}
            >
              {tree.nodes.map((n) => {
                if (!n.parent) return null;
                const p = byId.get(n.parent)!;
                const hidden =
                  Boolean(swallowedBy(n.id)) || Boolean(step.done[n.parent] && byId.has(n.parent));
                const skipped = step.skipped.some((sk) => isInside(n.id, sk));
                return (
                  <line
                    key={`e-${n.id}`}
                    x1={p.x}
                    y1={p.y}
                    x2={n.x}
                    y2={n.y}
                    className={`jc-tree-edge ${hidden ? 'is-hidden' : ''} ${skipped ? 'is-skipped' : ''}`}
                  />
                );
              })}
              {tree.nodes.map((n) => {
                const owner = swallowedBy(n.id);
                const target = owner ? byId.get(owner)! : n;
                const done = step.done[n.id];
                const skipped = step.skipped.some((sk) => isInside(n.id, sk));
                const active = step.id === n.id;
                const label = done ? show(done.value) : n.label;
                const cls = [
                  'jc-tree-node',
                  n.leaf ? 'is-leaf' : 'is-op',
                  owner ? 'is-hidden' : '',
                  done && !n.leaf ? 'is-done' : '',
                  active ? 'is-active' : '',
                  skipped ? 'is-skipped' : '',
                ].join(' ');
                const w = Math.max(40, label.length * 8 + 16);
                return (
                  <g
                    key={n.id}
                    className={cls}
                    style={{ transform: `translate(${target.x}px, ${target.y}px)` }}
                  >
                    <rect x={-w / 2} y={-15} width={w} height={30} rx={n.leaf || done ? 8 : 15} />
                    <text textAnchor="middle" dominantBaseline="central" className="viz-mono">
                      {n.bracketed && !done ? `(${label})` : label}
                    </text>
                    {skipped && (
                      <text y={26} textAnchor="middle" className="jc-tree-skip">
                        skipped
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <ol className="jc-ladder" aria-label="Precedence: which operator goes first">
          {LADDER.map((rung, i) => {
            const on = level === i + 1 || opLevel === i + 1;
            return (
              <li key={rung.ops} className={on ? 'is-on' : undefined}>
                <span className="jc-ladder-n">{i + 1}</span>
                <span className="viz-mono jc-ladder-ops">{rung.ops}</span>
                <span className="jc-ladder-name">{rung.name}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="viz-caption" aria-live="polite">
        <Rich text={step.note} />
      </div>
      <StepControls s={s} />
    </>
  );
}
