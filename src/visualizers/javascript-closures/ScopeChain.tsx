import { useMemo, useState } from 'react';
import { CodeView, Tabs } from '../core/code';
import { ScopeRoom, tintForDepth } from '../core/scope';
import { StackFrame, StackTower } from '../core/stack';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import {
  blockPreset,
  lexicalPreset,
  threeLevelsPreset,
  type ScopePreset,
  type SimStep,
} from './lib/scopeSim';

/**
 * #1 Where you write it, not where you call it. On the left, the rooms are
 * drawn the way the code is WRITTEN. On the right, the plates show what is
 * RUNNING. When a lookup happens, the 🔍 follows the rooms, never the plates.
 * Every step comes from lib/scopeSim.ts, tested against the real programs.
 */
export default function ScopeChain() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Where you write it, not where you call it</p>
      <p className="viz-sub">
        Rooms show where code is written. Plates show what’s running. Watch which one the search
        follows.
      </p>
      <Tabs
        twoUp
        label="Examples"
        tabs={[
          { id: 'lexical', name: 'Lexical scope' },
          { id: 'levels', name: 'Three levels' },
          { id: 'block', name: 'Block scope' },
        ]}
      >
        {(t) =>
          t === 'lexical' ? (
            <Lexical />
          ) : (
            <Player key={t} preset={t === 'levels' ? threeLevelsPreset : blockPreset} />
          )
        }
      </Tabs>
    </div>
  );
}

function Lexical() {
  const [moved, setMoved] = useState(false);
  const preset = useMemo(() => lexicalPreset(moved), [moved]);
  return (
    <>
      <label className="jc8-check">
        <input type="checkbox" checked={moved} onChange={(e) => setMoved(e.target.checked)} />
        Move printChai inside party
      </label>
      <Player key={String(moved)} preset={preset} moved={moved} />
    </>
  );
}

function Player({ preset, moved }: { preset: ScopePreset; moved?: boolean }) {
  const sim = useMemo(() => preset.run(), [preset]);
  const s = useStepper(sim.steps.length, 1300);
  const step = sim.steps[s.index];

  return (
    <>
      <div className="jc8-grid">
        <div className="viz-panel">
          <div className="viz-label">Code</div>
          <CodeView
            lines={preset.code.map((text, k) => ({
              text,
              state: step.line === k + 1 ? 'on' : undefined,
            }))}
          />
          <div className="viz-panel vc-console jc8-console" aria-label="Console">
            <div className="viz-mono" aria-live="polite">
              {step.output.length === 0 && !step.error && (
                <span className="vc-muted">(nothing yet)</span>
              )}
              {step.output.map((l, k) => (
                <div key={k} className="vc-out">
                  › {l}
                </div>
              ))}
              {step.error && <div className="jc8-error">💥 Uncaught {step.error}</div>}
            </div>
          </div>
        </div>
        <div className="jc8-rooms-col">
          <div className="viz-label">Rooms: where the code is written</div>
          <Rooms preset={preset} step={step} />
          <div className="viz-label jc8-gap">Plates: what’s running</div>
          <StackTower keys={step.frames.map((f) => f.id)} empty="nothing running">
            {step.frames.map((f, k) => (
              <StackFrame
                key={f.id}
                compact
                name={`${f.name}()`}
                state={k === step.frames.length - 1 ? 'top' : 'waiting'}
              />
            ))}
          </StackTower>
        </div>
      </div>
      <div className="viz-caption" aria-live="polite">
        {step.message}
        {s.atEnd && preset.id.startsWith('lexical') && (
          <>
            {' '}
            {moved
              ? 'Same call, different written location, different answer. That’s lexical scope.'
              : 'The search follows where printChai was written (rooms), not who called it (plates).'}
          </>
        )}
      </div>
      <StepControls s={s} />
    </>
  );
}

/** The rooms, nested the way the code is written, filled from the current step. */
function Rooms({ preset, step }: { preset: ScopePreset; step: SimStep }) {
  const env = (id: string) => step.envs.find((e) => e.id === id && e.alive);
  const path = step.search?.path ?? [];
  const foundIn = path.find((p) => p.found)?.envId;
  const onStack = new Set(step.frames.map((f) => f.envId));

  const render = (roomId: string, depth: number) => {
    const room = preset.rooms.find((r) => r.id === roomId)!;
    const e = env(roomId);
    const visit = path.findIndex((p) => p.envId === roomId);
    const kids = preset.rooms.filter((r) => r.parent === roomId);
    // A room that's on the call stack but not on the search path: the whole point.
    const skipped = step.search && visit < 0 && onStack.has(roomId);
    return (
      <ScopeRoom
        key={roomId}
        name={room.name}
        tint={tintForDepth(depth)}
        dim={!e}
        searching={
          visit >= 0
            ? { name: `${visit + 1}. ${step.search!.name}`, found: path[visit].found }
            : undefined
        }
        label={skipped ? '📞 called from here, but not searched' : !e ? 'not running' : undefined}
        vars={(e?.vars ?? []).map((v) => ({
          name: v.name,
          value: v.value,
          kind: v.kind === 'function' || v.kind === 'param' ? 'const' : v.kind,
          tdz: v.tdz,
          mark:
            foundIn === roomId && v.name === step.search?.name
              ? 'found'
              : step.changed === `${roomId}:${v.name}`
                ? 'changed'
                : undefined,
        }))}
        row
      >
        {kids.length ? kids.map((k) => render(k.id, depth + 1)) : undefined}
      </ScopeRoom>
    );
  };
  return <div className="jc8-rooms">{render('global', 0)}</div>;
}
