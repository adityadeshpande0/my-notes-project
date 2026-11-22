import { useMemo, useState } from 'react';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import { evaluate, isInside, ROOT, walk, type EvalStep, type Expr } from './lib/evalSteps';
import { show, truthiness } from './lib/format';
import { LOGIC_PRESETS, SERVER_REPLY, type LogicPreset } from './lib/presets';
import { Rich } from './parts';

/**
 * #4 Watch JavaScript skip work. A spotlight moves left to right over the
 * expression. When && or || already knows the answer, the rest is greyed out
 * and stamped "skipped", and the 📞 counter proves askServer() never ran.
 * Every step comes from lib/evalSteps.ts, which is tested against real JS.
 */
export default function LogicShortCircuit() {
  const [presetId, setPresetId] = useState(LOGIC_PRESETS[0].id);
  const preset = LOGIC_PRESETS.find((p) => p.id === presetId)!;
  // The checkbox values for presets with toggles (preset 8).
  const [vars, setVars] = useState<Record<string, unknown>>({});
  const env = { ...preset.vars, ...vars };

  return (
    <div className="viz not-prose">
      <p className="viz-title">Watch JavaScript skip work</p>
      <p className="viz-sub">Pick an example and step through it. Skipped parts never run.</p>

      <div className="viz-choices" role="group" aria-label="Examples">
        {LOGIC_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="viz-btn viz-mono jc-small"
            aria-pressed={p.id === presetId}
            onClick={() => {
              setPresetId(p.id);
              setVars({});
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      <p className="jc-hint">{preset.hint}</p>

      {preset.toggles && (
        <div className="jc-row jc-toggles">
          {preset.toggles.map((name) => (
            <label key={name} className="jc-check viz-mono">
              <input
                type="checkbox"
                checked={Boolean(env[name])}
                onChange={(e) => setVars((v) => ({ ...v, [name]: e.target.checked }))}
              />
              {name} = {String(Boolean(env[name]))}
            </label>
          ))}
        </div>
      )}
      {preset.vars && !preset.toggles && (
        <p className="jc-small jc-muted viz-mono">
          {Object.entries(preset.vars)
            .map(([k, v]) => `const ${k} = ${show(v)};`)
            .join(' ')}
        </p>
      )}

      {/* A new key when the example or a checkbox changes: React mounts a fresh
          player, so its stepper starts again from step 1. */}
      <Player key={`${presetId}-${JSON.stringify(vars)}`} preset={preset} vars={env} />
    </div>
  );
}

function Player({ preset, vars }: { preset: LogicPreset; vars: Record<string, unknown> }) {
  // useMemo: only re-run the evaluator when the example changes, not on every step.
  const runs = useMemo(
    () =>
      preset.exprs.map((expr) => evaluate(expr, { vars, fns: { askServer: () => SERVER_REPLY } })),
    [preset, vars],
  );
  const total = Math.max(...runs.map((r) => r.steps.length));
  const s = useStepper(total, 1300);

  return (
    <>
      <div className={runs.length > 1 ? 'viz-grid-2' : undefined}>
        {runs.map((run, i) => (
          <Lane
            key={i}
            expr={preset.exprs[i]}
            steps={run.steps}
            index={Math.min(s.index, run.steps.length - 1)}
            value={run.value}
            finished={s.index >= run.steps.length - 1}
          />
        ))}
      </div>
      <StepControls s={s} />
    </>
  );
}

interface Tile {
  text: string;
  id: string;
  kind: 'operand' | 'op' | 'paren';
}

/** Flatten the tree into tiles in reading order. Each tile remembers its node. */
function toTiles(e: Expr, id = ROOT): Tile[] {
  switch (e.kind) {
    case 'lit':
      return [{ text: show(e.value), id, kind: 'operand' }];
    case 'var':
      return [{ text: e.name, id, kind: 'operand' }];
    case 'call':
      return [{ text: `${e.name}()`, id, kind: 'operand' }];
    case 'member': {
      // Show `user.name` as one tile; its object is evaluated as part of it.
      const obj = toTiles(e.object, `${id}.o`)
        .map((t) => t.text)
        .join('');
      return [{ text: `${obj}${e.optional ? '?.' : '.'}${e.prop}`, id, kind: 'operand' }];
    }
    case 'unary':
      return [{ text: e.op, id, kind: 'op' }, ...toTiles(e.arg, `${id}.a`)];
    case 'binary':
    case 'logical':
      return [
        ...toTiles(e.left, `${id}.l`),
        { text: e.op, id, kind: 'op' },
        ...toTiles(e.right, `${id}.r`),
      ];
    case 'group':
      return [
        { text: '(', id, kind: 'paren' },
        ...toTiles(e.expr, `${id}.e`),
        { text: ')', id, kind: 'paren' },
      ];
  }
}

function Lane({
  expr,
  steps,
  index,
  value,
  finished,
}: {
  expr: Expr;
  steps: EvalStep[];
  index: number;
  value: unknown;
  finished: boolean;
}) {
  const step = steps[index];
  const tiles = toTiles(expr);
  let hasCall = false;
  walk(expr, (e) => {
    if (e.kind === 'call') hasCall = true;
  });

  // Which operands have been checked for truthiness so far (and what they were).
  const tested = new Map<string, unknown>();
  for (const st of steps.slice(0, index + 1)) if (st.kind === 'test') tested.set(st.id, st.value);
  const calls = Object.values(step.calls).reduce((a, b) => a + b, 0);
  const badgeShown = new Set<string>();

  return (
    <div className="jc-lane">
      <div className="jc-tiles" role="list" aria-label="The expression">
        {tiles.map((t, i) => {
          const skipped = step.skipped.some((sk) => isInside(t.id, sk));
          const active = step.kind !== 'start' && isInside(t.id, step.id) && !skipped;
          const wasTested = tested.has(t.id) && !badgeShown.has(t.id);
          if (wasTested) badgeShown.add(t.id);
          const done = t.kind === 'operand' ? step.done[t.id] : undefined;
          return (
            <span
              key={i}
              role="listitem"
              className={`jc-tile is-${t.kind} ${active ? 'is-active' : ''} ${skipped ? 'is-skipped' : ''}`}
            >
              <span className="viz-mono">{t.text}</span>
              {skipped && t.kind === 'operand' && <span className="jc-stamp">⏭ skipped</span>}
              {wasTested && !skipped && (
                <span className={`jc-tile-badge is-${truthiness(tested.get(t.id))}`}>
                  {truthiness(tested.get(t.id))}
                </span>
              )}
              {done && !wasTested && (
                <span className="jc-tile-value viz-mono">{show(done.value)}</span>
              )}
            </span>
          );
        })}
      </div>

      {hasCall && (
        <p className="jc-calls" aria-live="polite">
          <span aria-hidden="true">📞</span> askServer() calls made:{' '}
          <strong className="viz-mono">{calls}</strong>
          {finished && calls === 0 && <span className="jc-muted"> (it never ran)</span>}
        </p>
      )}

      <div className="viz-caption" aria-live="polite">
        <Rich text={step.note} />
      </div>

      <div className={`jc-returns ${finished ? 'is-on' : ''}`}>
        <span className="viz-label">Returns</span>
        {finished ? (
          <span>
            <code className="viz-mono jc-big">{show(value)}</code>
            {typeof value !== 'boolean' && (
              <span className="jc-muted jc-small"> the actual value, not true or false!</span>
            )}
          </span>
        ) : (
          <span className="jc-muted">…</span>
        )}
      </div>
    </div>
  );
}
