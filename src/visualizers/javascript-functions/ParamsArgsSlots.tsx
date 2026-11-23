import { useState, type DragEvent } from 'react';
import { Tabs } from '../core/code';
import { HeapCard, MemoryBox } from '../core/memory';
import { callCode, PARAMS_PRESETS, type ParamsPreset } from './lib/realFunctions';

/**
 * #2 Filling the slots. Put argument chips into the call (drag them, or just
 * click / press Enter on a chip), then press Call. The slot values and the
 * console line come from calling the real function with those arguments.
 */
const show = (v: unknown) => (typeof v === 'string' ? JSON.stringify(v) : String(v));
const MAX_ARGS = 4;

const CAPTIONS: Record<string, string> = {
  order: 'Order matters! JavaScript fills parameters by position, not by meaning.',
  missing:
    'Too few arguments: the missing parameters are undefined. Too many: the extras are ignored.',
  defaults:
    'A default fills in when the argument is undefined, whether it was left out or passed explicitly. null is a real value, so it doesn’t use the default.',
  rest: 'The first argument goes into base. ...extras gathers all the rest into one array.',
};

export default function ParamsArgsSlots() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Filling the slots</p>
      <p className="viz-sub">
        Add argument chips to the call (drag, click, or Enter), then press Call.
      </p>
      <Tabs twoUp label="Functions" tabs={PARAMS_PRESETS.map((p) => ({ id: p.id, name: p.name }))}>
        {(id) => <Slots key={id} preset={PARAMS_PRESETS.find((p) => p.id === id)!} />}
      </Tabs>
    </div>
  );
}

function Slots({ preset }: { preset: ParamsPreset }) {
  const [args, setArgs] = useState<unknown[]>(preset.start);
  // How many times Call was pressed with these exact args (0 = not called yet).
  const [called, setCalled] = useState(0);
  const result = called ? preset.call(args) : null;

  const change = (next: unknown[]) => {
    setArgs(next.slice(0, MAX_ARGS));
    setCalled(0);
  };
  const add = (k: number) => args.length < MAX_ARGS && change([...args, preset.chips[k].value]);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const k = Number(e.dataTransfer.getData('text/chip'));
    if (!Number.isNaN(k)) add(k);
  };

  return (
    <>
      <pre className="vc-code viz-mono jf-sig">
        {preset.code.map((line, k) => (
          <div key={k} className="vc-line">
            <span>{line}</span>
          </div>
        ))}
      </pre>

      <div className="viz-label jf-gap">Parameters</div>
      <div className="jf-row jf-slots">
        {preset.params.map((p, k) => {
          const got = result?.slots[k];
          const filled = result !== null;
          const isUndef = filled && got?.[1] === undefined;
          return (
            <div
              key={`${p}-${called}`}
              className={`jf-slot ${isUndef ? 'is-undef' : ''}`}
              style={{ animationDelay: `${k * 150}ms` }}
            >
              <MemoryBox
                name={p}
                kind="let"
                value={
                  filled ? show(got?.[1]) : preset.defaults?.[p] ? `${preset.defaults[p]}` : ''
                }
                state={filled ? (isUndef ? 'same' : 'new') : 'same'}
              />
              {!filled && preset.defaults?.[p] && <span className="jf-default-note">default</span>}
              {isUndef && <span className="jf-undef-stamp">undefined</span>}
            </div>
          );
        })}
        {preset.rest && (
          <div className="jf-slot">
            {result ? (
              <HeapCard
                key={called}
                id="extras"
                label={`...${preset.rest}`}
                isArray
                state="new"
                props={(result.slots[1][1] as unknown[]).map((v, k) => ({
                  key: String(k),
                  value: show(v),
                }))}
              />
            ) : (
              <MemoryBox name={`...${preset.rest}`} kind="let" value="" />
            )}
          </div>
        )}
      </div>

      <div className="viz-label jf-gap">Arguments (click or drag into the call)</div>
      <div className="jf-row" role="group" aria-label="Argument chips">
        {preset.chips.map((c, k) => (
          <button
            key={c.label}
            type="button"
            className="jf-chip viz-mono"
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/chip', String(k))}
            onClick={() => add(k)}
            disabled={args.length >= MAX_ARGS}
            aria-label={`Add argument ${c.label}`}
          >
            + {c.label}
          </button>
        ))}
      </div>

      <div
        className="jf-callbar"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        aria-label="The call"
      >
        <code className="viz-mono">{preset.rest ? 'addToppings' : 'makeChai'}(</code>
        {args.length === 0 && <span className="jf-muted jf-small">drop arguments here</span>}
        {args.map((a, k) => (
          <span
            key={k}
            className={`jf-arg-chip viz-mono ${result && !preset.rest && k >= preset.params.length ? 'is-ignored' : ''}`}
          >
            {show(a)}
            <button
              type="button"
              className="jf-x"
              onClick={() => change(args.filter((_, j) => j !== k))}
              aria-label={`Remove argument ${k + 1}, ${show(a)}`}
            >
              ×
            </button>
          </span>
        ))}
        <code className="viz-mono">)</code>
      </div>

      <div className="jf-row jf-gap">
        <button
          type="button"
          className="viz-btn viz-btn--primary"
          onClick={() => setCalled((n) => n + 1)}
        >
          Call ▶
        </button>
        {preset.id === 'order' && (
          <button
            type="button"
            className="viz-btn"
            onClick={() => change([args[1], args[0], ...args.slice(2)])}
            disabled={args.length < 2}
          >
            Swap the arguments
          </button>
        )}
        <button type="button" className="viz-btn viz-btn--ghost" onClick={() => change([])}>
          Clear
        </button>
      </div>

      {result && result.ignored.length > 0 && (
        <p className="jf-bin">
          🗑 ignored: <span className="viz-mono">{result.ignored.map(show).join(', ')}</span> (no
          parameter to hold {result.ignored.length === 1 ? 'it' : 'them'})
        </p>
      )}

      <div className="viz-panel vc-console jf-gap" aria-label="Console">
        <div className="viz-label">Console</div>
        <div className="viz-mono" aria-live="polite">
          <div className="jf-muted">› {callCode(preset, args)}</div>
          {result ? (
            <div key={called} className="vc-out">
              <span aria-hidden="true">›</span> {result.log}
            </div>
          ) : (
            <span className="vc-muted">Press Call to run it.</span>
          )}
        </div>
      </div>
      <p className="viz-caption">{CAPTIONS[preset.id]}</p>
    </>
  );
}
