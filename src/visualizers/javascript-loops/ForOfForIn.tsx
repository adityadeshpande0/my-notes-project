import { useState } from 'react';
import { Tabs } from '../core/code';
import { HeapCard, MemoryBox } from '../core/memory';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import { collectIn, collectOf } from './lib/loopSim';

/**
 * #4 The conveyor belt. Each step, the loop hands the next thing to its
 * variable. What it hands over is never typed by hand: it comes from running
 * the real for...of / for...in over the data first (collectOf / collectIn),
 * and the visual then plays those results back one at a time.
 */

const SNACKS = ['samosa', 'vada pav', 'jalebi'];
const EMOJI: Record<string, string> = { samosa: '🥟', 'vada pav': '🍔', jalebi: '🍥' };
const MARKS = { maths: 92, science: 85, english: 78 };

const show = (v: unknown) => (typeof v === 'string' ? JSON.stringify(v) : String(v));

type TabId = 'of-array' | 'of-string' | 'in-object' | 'in-array';

interface Scenario {
  varName: string;
  code: string[];
  /** The real values the loop gives, in order. */
  values: unknown[];
  /** What the source looks like: one card per item. */
  source: { label: string; icon?: string }[];
  /** Which source item each value came from. */
  sourceIndex: (k: number) => number;
  log: (v: unknown) => string;
  caption: (v: unknown) => string;
  finalCaption: string;
  warn?: boolean;
}

const SCENARIOS: Record<TabId, Scenario> = {
  'of-array': {
    varName: 'snack',
    code: [
      'const snacks = ["samosa", "vada pav", "jalebi"];',
      'for (const snack of snacks) {',
      '  console.log("I love " + snack);',
      '}',
    ],
    values: collectOf(SNACKS),
    source: SNACKS.map((s) => ({ label: s, icon: EMOJI[s] })),
    sourceIndex: (k) => k,
    log: (v) => `I love ${v}`,
    caption: (v) => `for...of hands over the next value: ${show(v)}.`,
    finalCaption: 'No index, no .length, no i++. Just each value, in order.',
  },
  'of-string': {
    varName: 'letter',
    code: ['for (const letter of "chai") {', '  console.log(letter);', '}'],
    values: collectOf('chai'),
    source: [...'chai'].map((c) => ({ label: c })),
    sourceIndex: (k) => k,
    log: (v) => String(v),
    caption: (v) =>
      `A string is a list of characters, so for...of gives one letter at a time: ${show(v)}.`,
    finalCaption: 'Strings work with for...of too, one character per lap.',
  },
  'in-object': {
    varName: 'subject',
    code: [
      'const marks = { maths: 92, science: 85, english: 78 };',
      'for (const subject in marks) {',
      '  console.log(subject + ": " + marks[subject]);',
      '}',
    ],
    values: collectIn(MARKS),
    source: [],
    sourceIndex: (k) => k,
    log: (v) => `${v}: ${MARKS[v as keyof typeof MARKS]}`,
    caption: (v) =>
      `for...in hands over a key: ${show(v)}. Then marks[subject] looks up its value, ${MARKS[v as keyof typeof MARKS]}.`,
    finalCaption: 'for...in gives you the keys IN an object. Use them to look up the values.',
  },
  'in-array': {
    varName: 'i',
    code: [
      'const snacks = ["samosa", "vada pav", "jalebi"];',
      'for (const i in snacks) {',
      '  console.log(i);',
      '}',
    ],
    values: collectIn(SNACKS),
    source: SNACKS.map((s) => ({ label: s, icon: EMOJI[s] })),
    sourceIndex: (k) => k,
    log: (v) => show(v),
    caption: (v) => `⚠️ for...in gave ${show(v)}: an index, and a string at that.`,
    finalCaption: 'You got the indexes, as strings! Use for...of for arrays.',
    warn: true,
  },
};

export default function ForOfForIn() {
  const [compare, setCompare] = useState(false);
  return (
    <div className="viz not-prose">
      <p className="viz-title">The conveyor belt</p>
      <p className="viz-sub">
        Each lap, the loop picks up one thing and puts it in the loop variable.
      </p>
      <label className="jl-check jl-mb">
        <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
        Compare for...of and for...in on the same array
      </label>
      {compare ? (
        <Player ids={['of-array', 'in-array']} />
      ) : (
        <Tabs
          twoUp
          label="Loops"
          tabs={[
            { id: 'of-array', name: 'for...of array' },
            { id: 'of-string', name: 'for...of string' },
            { id: 'in-object', name: 'for...in object' },
            { id: 'in-array', name: '⚠️ for...in array' },
          ]}
        >
          {(id) => <Player key={id} ids={[id as TabId]} />}
        </Tabs>
      )}
    </div>
  );
}

/** One stepper drives one belt, or two side by side in compare mode. */
function Player({ ids }: { ids: TabId[] }) {
  const n = Math.max(...ids.map((id) => SCENARIOS[id].values.length));
  // Step 0 = nothing picked yet; step k = the k-th value is in the variable.
  const s = useStepper(n + 1, 1100);
  const last = ids.map((id) => SCENARIOS[id]);
  return (
    <>
      <div className={ids.length > 1 ? 'viz-grid-2' : undefined}>
        {ids.map((id) => (
          <Belt key={id} sc={SCENARIOS[id]} index={s.index} />
        ))}
      </div>
      <div className="viz-caption" aria-live="polite">
        {s.index === 0
          ? 'Press play or → to start the belt.'
          : s.atEnd
            ? last.map((sc) => sc.finalCaption).join(' ')
            : last.map((sc) => sc.caption(sc.values[s.index - 1])).join(' ')}
      </div>
      <StepControls s={s} />
    </>
  );
}

function Belt({ sc, index }: { sc: Scenario; index: number }) {
  const k = Math.min(index, sc.values.length) - 1; // which value is in the variable (-1: none)
  const value = k >= 0 ? sc.values[k] : undefined;
  const isObject = sc.source.length === 0;
  const isString = typeof value === 'string';
  const output = sc.values.slice(0, k + 1).map(sc.log);

  return (
    <div className="jl-belt-panel">
      <pre className="vc-code viz-mono">
        {sc.code.map((line, j) => (
          <div key={j} className={`vc-line ${k >= 0 && j === sc.code.length - 2 ? 'is-on' : ''}`}>
            <span>{line}</span>
          </div>
        ))}
      </pre>

      <div className="jl-belt-row">
        {isObject ? (
          <HeapCard
            id="marks"
            label="marks"
            props={Object.entries(MARKS).map(([key, v]) => ({ key, value: String(v) }))}
            changedKey={k >= 0 ? String(value) : undefined}
          />
        ) : (
          <div className="jl-belt" aria-label="The data">
            <div className="jl-belt-track" aria-hidden="true" />
            <ol className="jl-belt-items">
              {sc.source.map((item, j) => {
                const at = sc.sourceIndex(k);
                return (
                  <li
                    key={j}
                    className={`jl-item ${j === at ? 'is-picked' : j < at ? 'is-done' : ''}`}
                  >
                    {item.icon && <span aria-hidden="true">{item.icon}</span>}
                    <span className="viz-mono">{show(item.label)}</span>
                    <span className="jl-item-index viz-mono">[{j}]</span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <div className="jl-belt-out">
          <span className="jl-hand" aria-hidden="true">
            {k >= 0 ? '🤲' : '✋'}
          </span>
          <MemoryBox
            key={k}
            name={sc.varName}
            kind="const"
            value={k >= 0 ? show(value) : '…'}
            state={k >= 0 ? 'new' : 'same'}
          />
          {k >= 0 && (
            <span className={`jl-type ${sc.warn ? 'is-warn' : ''}`}>
              {isString ? '🔤 string' : `🔢 ${typeof value}`}
            </span>
          )}
          {isObject && k >= 0 && (
            <span className="jl-lookup viz-mono">
              marks[{show(value)}] → {MARKS[value as keyof typeof MARKS]}
            </span>
          )}
        </div>
      </div>

      <div className="viz-panel vc-console jl-mini-console" aria-label="Console">
        {output.length === 0 ? (
          <span className="vc-muted">(nothing yet)</span>
        ) : (
          output.map((l, j) => (
            <div key={j} className="vc-out viz-mono">
              <span aria-hidden="true">›</span> {l}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
