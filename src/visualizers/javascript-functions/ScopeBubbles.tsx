import { useMemo, useState } from 'react';
import { Tabs } from '../core/code';
import { MemoryBox } from '../core/memory';
import { ScopeRoom, tintForDepth } from '../core/scope';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import {
  lookup,
  SCOPE_PRESETS,
  type LogLine,
  type ScopeDef,
  type ScopePreset,
  type SearchStep,
} from './lib/scope';

/**
 * #7 Look outward, never inward. Pick a console.log line and a magnifier
 * searches for each variable: first in the line's own bubble, then one
 * bubble out at a time. The search order comes from lib/scope.ts, tested
 * against the same code run for real (including the ReferenceError text).
 */
export default function ScopeBubbles() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Look outward, never inward</p>
      <p className="viz-sub">
        Pick a console.log line and watch JavaScript search for each variable.
      </p>
      <Tabs twoUp label="Examples" tabs={SCOPE_PRESETS.map((p) => ({ id: p.id, name: p.name }))}>
        {(id) => <Scopes key={id} preset={SCOPE_PRESETS.find((p) => p.id === id)!} />}
      </Tabs>
      <PureDemo />
    </div>
  );
}

function Scopes({ preset }: { preset: ScopePreset }) {
  const [logIndex, setLogIndex] = useState(0);
  const log = preset.logs[logIndex];
  return (
    <>
      <pre className="vc-code viz-mono jf-scope-code" aria-label="Code">
        {preset.code.map((text, k) => {
          const which = preset.logs.findIndex((l) => l.line === k + 1);
          return which >= 0 ? (
            <button
              key={k}
              type="button"
              className={`vc-line jf-line-btn ${which === logIndex ? 'is-on' : ''}`}
              aria-pressed={which === logIndex}
              onClick={() => setLogIndex(which)}
            >
              <span className="vc-ln" aria-hidden="true">
                {k + 1}
              </span>
              <span>{text}</span>
              <span className="jf-search-hint">🔍 search</span>
            </button>
          ) : (
            <div key={k} className="vc-line">
              <span className="vc-ln" aria-hidden="true">
                {k + 1}
              </span>
              <span>{text || ' '}</span>
            </div>
          );
        })}
      </pre>
      <Search key={`${preset.id}-${logIndex}`} preset={preset} log={log} />
    </>
  );
}

function Search({ preset, log }: { preset: ScopePreset; log: LogLine }) {
  const result = useMemo(() => lookup(preset, log.scope, log.names), [preset, log]);
  // One step per scope searched, plus the start and the final result.
  const s = useStepper(result.steps.length + 2, 1100);
  const shown = result.steps.slice(0, Math.max(0, s.index));
  const current: SearchStep | undefined =
    s.index >= 1 && s.index <= result.steps.length ? result.steps[s.index - 1] : undefined;
  const done = s.atEnd;
  const failed = done && Boolean(result.error);

  // Found variables, and outer ones hidden by a closer match (shadowing).
  const found = new Set(shown.filter((x) => x.found).map((x) => `${x.scope}:${x.name}`));
  const shadowedKeys = new Set<string>();
  for (const st of shown.filter((x) => x.found)) {
    let id = preset.scopes.find((sc) => sc.id === st.scope)?.parent;
    while (id) {
      const sc = preset.scopes.find((x) => x.id === id)!;
      if (sc.vars.some(([n]) => n === st.name)) shadowedKeys.add(`${sc.id}:${st.name}`);
      id = sc.parent ?? undefined;
    }
  }

  const root = preset.scopes.find((sc) => sc.parent === null)!;
  const render = (scope: ScopeDef, depth: number) => {
    const children = preset.scopes.filter((x) => x.parent === scope.id);
    const here = current?.scope === scope.id;
    // Searching from an outer scope: the inner rooms are walled off.
    const walled = log.scope === 'global' && scope.id !== 'global';
    return (
      <ScopeRoom
        key={scope.id}
        name={scope.name}
        tint={tintForDepth(depth)}
        searching={here && current ? { name: current.name, found: current.found } : undefined}
        label={walled ? <span className="jf-wall">🚫 can’t look inside</span> : undefined}
        vars={scope.vars.map(([name, value]) => {
          const key = `${scope.id}:${name}`;
          return {
            name,
            value,
            mark: found.has(key) ? 'found' : shadowedKeys.has(key) ? 'shadowed' : undefined,
            note: shadowedKeys.has(key) ? `hidden (shadowed) inside ${log.scope}` : undefined,
          };
        })}
      >
        {children.length > 0 ? children.map((c) => render(c, depth + 1)) : undefined}
      </ScopeRoom>
    );
  };

  const message =
    s.index === 0
      ? `Line ${log.line} runs inside ${preset.scopes.find((x) => x.id === log.scope)!.name}. It needs: ${log.names.join(', ')}.`
      : current
        ? current.found
          ? `Found ${current.name} in ${current.scope}: ${current.value}. The search for it stops here.`
          : `${current.name} isn’t in ${current.scope}, so look one bubble out.`
        : failed
          ? `Searched all the way out to Global and found nothing. JavaScript never looks into makeBill.`
          : `Every variable was found. The line prints: ${log.result}`;

  return (
    <>
      <div className="jf-bubbles" role="img" aria-label={message}>
        {render(root, 0)}
      </div>
      <div className="viz-panel vc-console jf-gap" aria-label="Console">
        <div className="viz-mono" aria-live="polite">
          {!done ? (
            <span className="vc-muted">searching…</span>
          ) : failed ? (
            <div className="jf-error">💥 Uncaught {result.error}</div>
          ) : (
            <div className="vc-out">› {log.result}</div>
          )}
        </div>
      </div>
      <div className="viz-caption" aria-live="polite">
        {message}
        {done && <> {preset.caption}</>}
      </div>
      <StepControls s={s} />
    </>
  );
}

/** Pure vs impure: does calling it change anything outside? */
function PureDemo() {
  const [total, setTotal] = useState(0);
  const [impureCalls, setImpureCalls] = useState(0);
  const [pureResult, setPureResult] = useState<number | null>(null);

  // The two functions from the article, for real. addToTotal changes `total`
  // outside itself (a side effect); add only returns a value.
  const addToTotal = (x: number) => setTotal((t) => t + x);
  const add = (a: number, b: number) => a + b;

  return (
    <div className="jf-pure">
      <div className="viz-label">Pure or not?</div>
      <div className="viz-grid-2">
        <div className="viz-panel">
          <code className="viz-mono jf-small">
            let total = 0;
            <br />
            function addToTotal(x) {'{'} total += x; {'}'}
          </code>
          <div className="jf-row jf-gap">
            <button
              type="button"
              className="viz-btn"
              onClick={() => {
                addToTotal(5);
                setImpureCalls((n) => n + 1);
              }}
            >
              addToTotal(5)
            </button>
            <MemoryBox
              key={impureCalls}
              name="total"
              kind="let"
              value={String(total)}
              state={impureCalls ? 'changed' : 'same'}
            />
            {impureCalls > 0 && <span className="jf-effect">side effect ⚠</span>}
          </div>
        </div>
        <div className="viz-panel">
          <code className="viz-mono jf-small">
            function add(a, b) {'{'} return a + b; {'}'}
          </code>
          <div className="jf-row jf-gap">
            <button type="button" className="viz-btn" onClick={() => setPureResult(add(2, 3))}>
              add(2, 3)
            </button>
            {pureResult !== null && (
              <span className="viz-mono">
                → {pureResult} <span className="jf-pure-badge">pure ✓</span>
              </span>
            )}
          </div>
          <p className="jf-small jf-muted">
            Same inputs, same answer, and nothing outside changes.
          </p>
        </div>
      </div>
    </div>
  );
}
