import { MemoryBox } from '../core/memory';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import { SCOPE_PRESETS, type MemPreset, type MemStep, type Room as RoomT } from './lib/memorySteps';
import { boxProps } from './boxProps';
import { CodeLines, ConsoleOut, PresetTabs } from './parts';

/** #3 Rooms and walls: block scope, function scope, hoisting and the TDZ. */
export default function LetConstVar() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Rooms and walls</p>
      <p className="viz-sub">
        Each <code>{'{ }'}</code> is a room. <code>let</code> and <code>const</code> stay in their
        room; <code>var</code> walks through walls.
      </p>
      <PresetTabs
        presets={SCOPE_PRESETS}
        label="Examples"
        render={(p) => <Player key={p.id} preset={p} />}
      />
    </div>
  );
}

function Player({ preset }: { preset: MemPreset }) {
  const s = useStepper(preset.steps.length, 2000);
  const st = preset.steps[s.index];
  const tops = st.rooms.filter((r) => !r.parent);

  return (
    <>
      <div className="jv-grid">
        <div className="viz-panel">
          <div className="viz-label">Code</div>
          <CodeLines code={preset.code} line={st.line} />
        </div>
        <div className="viz-panel">
          <div className="viz-label">Rooms (scopes)</div>
          {tops.length === 0 ? (
            <span className="jv-muted">No rooms open yet.</span>
          ) : (
            tops.map((r) => <Room key={r.id} room={r} step={st} stepIndex={s.index} />)
          )}
        </div>
      </div>
      <ConsoleOut lines={st.console} error={st.error} />
      <div className="viz-caption" aria-live="polite">
        {st.caption}
      </div>
      <StepControls s={s} />
    </>
  );
}

/** A room draws its own variables, then the rooms nested inside it (recursion). */
function Room({ room, step, stepIndex }: { room: RoomT; step: MemStep; stepIndex: number }) {
  const boxes = step.boxes.filter((b) => b.room === room.id);
  const children = step.rooms.filter((r) => r.parent === room.id);
  const lookup = step.lookup?.from === room.id ? step.lookup : undefined;

  return (
    <div
      className={`jv-room ${room.block ? 'is-block' : ''} ${
        lookup ? (lookup.found ? 'is-found' : 'is-missing') : ''
      }`}
    >
      <div className="jv-room-label">{room.label}</div>
      {lookup && (
        <p className={`jv-lookup ${lookup.found ? 'is-found' : 'is-missing'}`}>
          looking for <code>{lookup.name}</code>… {lookup.found ? '✓ found' : '✗ not available'}
        </p>
      )}
      {boxes.length > 0 && (
        <div className="jv-shelf">
          {boxes.map((b) => (
            <MemoryBox key={`${b.name}-${stepIndex}`} {...boxProps(b)} />
          ))}
        </div>
      )}
      {children.length > 0 && (
        <div className="jv-room-children">
          {children.map((r) => (
            <Room key={r.id} room={r} step={step} stepIndex={stepIndex} />
          ))}
        </div>
      )}
      {boxes.length === 0 && children.length === 0 && !lookup && (
        <span className="jv-muted">empty</span>
      )}
    </div>
  );
}
