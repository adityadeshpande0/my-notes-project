import { useEffect, useMemo, useRef, useState } from 'react';
import { Tabs } from '../core/code';
import { HeapCard, MemoryBox, RefArrows, type HeapProp } from '../core/memory';
import {
  BROKEN,
  jsonTokens,
  makeSample,
  MAX_JSON,
  pack,
  show,
  SNACKS,
  storage,
  validate,
  type Validation,
} from './lib/objectSteps';

/**
 * #3 Pack and unpack. Everything shown comes from the real JSON.stringify
 * and JSON.parse (and, for errors, the browser's own message). Nothing is
 * eval'd: JSON.parse is a parser, it never runs code.
 */
export default function JsonConverter() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Pack and unpack</p>
      <p className="viz-sub">
        Objects travel as JSON text. Pack one, unpack it, then try breaking the rules.
      </p>
      <Tabs
        twoUp
        label="Views"
        tabs={[
          { id: 'pack', name: 'Pack & unpack' },
          { id: 'mistakes', name: 'Spot the mistake' },
          { id: 'save', name: 'Save it' },
        ]}
      >
        {(t) => (t === 'pack' ? <PackTab /> : t === 'mistakes' ? <MistakesTab /> : <SaveTab />)}
      </Tabs>
    </div>
  );
}

/** JSON text with syntax colouring. */
export function JsonText({ text, mark }: { text: string; mark?: number | null }) {
  const tokens = useMemo(() => jsonTokens(text), [text]);
  if (mark == null)
    return (
      <pre className="jo-json viz-mono">
        {tokens.map((t, i) => (
          <span key={i} className={`jt-${t.kind}`}>
            {t.t}
          </span>
        ))}
      </pre>
    );
  // Highlight the character where the parser gave up.
  return (
    <pre className="jo-json viz-mono">
      {text.slice(0, mark)}
      <mark className="jo-err-mark">{text[mark] ?? '␣'}</mark>
      {text.slice(mark + 1)}
    </pre>
  );
}

/** Draw any parsed value as nested HeapCard rows. */
function toProps(value: unknown): HeapProp[] {
  if (Array.isArray(value)) return value.map((v, i) => row(String(i), v));
  if (value && typeof value === 'object') return Object.entries(value).map(([k, v]) => row(k, v));
  return [row('value', value)];
}
function row(key: string, v: unknown): HeapProp {
  if (v && typeof v === 'object')
    return {
      key,
      value: Array.isArray(v) ? '[ ]' : '{ }',
      type: Array.isArray(v) ? 'array' : 'object',
      children: toProps(v),
      childIsArray: Array.isArray(v),
    };
  return { key, value: show(v) };
}

// ─── Tab 1 ────────────────────────────────────────────────────────────

function PackTab() {
  const [withNaN, setWithNaN] = useState(false);
  const [indent, setIndent] = useState(2);
  const [phase, setPhase] = useState<'object' | 'packed' | 'parsed'>('object');
  const [sends, setSends] = useState(0);
  const original = useMemo(() => makeSample(withNaN), [withNaN]);
  const r = useMemo(() => pack(original, indent), [original, indent]); // the real stringify + parse
  const memRef = useRef<HTMLDivElement>(null);
  const lost = new Map(r.luggage.map((l) => [l.key, l]));

  const origProps: HeapProp[] = Object.entries(original).map(([k, v]) => ({
    key: k,
    value: show(v),
    role:
      phase !== 'object'
        ? lost.get(k)?.what === 'dropped'
          ? 'deleted'
          : lost.has(k)
            ? 'changed'
            : undefined
        : undefined,
  }));

  return (
    <>
      <div className="jo-row">
        <label className="jo-check">
          <input
            type="checkbox"
            checked={withNaN}
            onChange={(e) => {
              setWithNaN(e.target.checked);
              setPhase('object');
            }}
          />
          Include <code>score: NaN</code>
        </label>
        <label className="jo-small">
          Indent{' '}
          <select
            className="jo-input"
            value={indent}
            onChange={(e) => setIndent(Number(e.target.value))}
          >
            {[0, 2, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="jo-pack">
        <div className="viz-panel jo-memory" ref={memRef}>
          <div className="jo-vars">
            <MemoryBox name="chai" kind="const" value="" refTo="orig" refLabel="{ }" />
            {phase === 'parsed' && (
              <MemoryBox
                name="back"
                kind="const"
                value=""
                refTo="parsed"
                refLabel="{ }"
                state="new"
              />
            )}
          </div>
          <div className="jo-heap">
            <HeapCard id="orig" label="JavaScript object" props={origProps} />
            {phase === 'parsed' && (
              <HeapCard
                id="parsed"
                label="parsed (a new object)"
                props={toProps(r.back)}
                state="new"
              />
            )}
          </div>
          <RefArrows container={memRef} deps={`${phase}-${withNaN}`} />
        </div>

        <div className="jo-pack-buttons">
          <button
            type="button"
            className="viz-btn viz-btn--primary viz-mono"
            onClick={() => setPhase('packed')}
          >
            JSON.stringify →
          </button>
          <button
            type="button"
            className="viz-btn viz-mono"
            onClick={() => setPhase('parsed')}
            disabled={phase === 'object'}
          >
            ← JSON.parse
          </button>
        </div>

        <div className="viz-panel jo-text-panel">
          <div className="viz-label">JSON text</div>
          {phase === 'object' ? (
            <p className="jo-muted jo-small">Nothing packed yet.</p>
          ) : (
            <div key={`${indent}-${withNaN}`} className="viz-fade">
              <code className="viz-mono jo-small">
                JSON.stringify(chai{indent ? `, null, ${indent}` : ''})
              </code>
              <JsonText text={r.text} />
            </div>
          )}
        </div>
      </div>

      {phase !== 'object' && r.luggage.length > 0 && (
        <div className="jo-luggage viz-fade">
          <div className="viz-label">🧳 Lost luggage</div>
          <ul>
            {r.luggage.map((l) => (
              <li key={l.key} className={`is-${l.what}`}>
                <code className="viz-mono">{l.key}</code>: {l.why}
              </li>
            ))}
          </ul>
        </div>
      )}
      {phase === 'parsed' && (
        <p className="jo-result is-found">
          <code className="viz-mono">chai === back → false</code>
          <span className="jo-note">
            {' '}
            A brand-new object. And createdAt is still just a string: JSON has no dates.
          </span>
        </p>
      )}

      {phase !== 'object' && (
        <div className="jo-network">
          <div className="jo-net-row" aria-hidden="true">
            <span>💻 you</span>
            <span className="jo-net-line">
              {sends > 0 && (
                <span key={sends} className="jo-packet viz-mono">
                  {'{"name":…}'}
                </span>
              )}
            </span>
            <span>🌐</span>
            <span className="jo-net-line">
              {sends > 0 && (
                <span key={sends} className="jo-packet is-late viz-mono">
                  {'{"name":…}'}
                </span>
              )}
            </span>
            <span>🖥️ server</span>
          </div>
          <div className="jo-row">
            <button type="button" className="viz-btn" onClick={() => setSends((n) => n + 1)}>
              📡 Send
            </button>
            {sends > 0 && (
              <span key={sends} className="jo-small jo-server-got" aria-live="polite">
                Server: received {r.text.length} characters of text, parsed it: name is{' '}
                {show(r.back.name)} ✓
              </span>
            )}
          </div>
          <p className="jo-small jo-muted">Only text can travel. That’s why we need JSON.</p>
        </div>
      )}
    </>
  );
}

// ─── Tab 2 ────────────────────────────────────────────────────────────

function MistakesTab() {
  const [text, setText] = useState(BROKEN[0].text);
  const [preset, setPreset] = useState<string | null>(BROKEN[0].id);
  const [result, setResult] = useState<Validation>(() => validate(BROKEN[0].text));
  const [fixShown, setFixShown] = useState(false);

  // Validate 200 ms after the last keystroke, with the real JSON.parse.
  useEffect(() => {
    const timer = window.setTimeout(() => setResult(validate(text)), 200);
    return () => window.clearTimeout(timer);
  }, [text]);

  const current = BROKEN.find((b) => b.id === preset);
  return (
    <>
      <div className="jo-row" role="group" aria-label="Broken examples">
        {BROKEN.map((b) => (
          <button
            key={b.id}
            type="button"
            className="viz-btn jo-small"
            aria-pressed={preset === b.id}
            onClick={() => {
              setText(b.text);
              setPreset(b.id);
              setFixShown(false);
            }}
          >
            {b.name}
          </button>
        ))}
      </div>
      <label className="jo-field jo-gap">
        <span className="jo-small">JSON text (edit it!)</span>
        <textarea
          className="jo-textarea viz-mono"
          value={text}
          maxLength={MAX_JSON}
          spellCheck={false}
          rows={4}
          onChange={(e) => setText(e.target.value.slice(0, MAX_JSON))}
        />
      </label>
      <div className="jo-row">
        {result.ok ? (
          <span className="jo-valid">✓ valid JSON</span>
        ) : (
          <span className="jo-invalid">✗ {result.message}</span>
        )}
        {current && !result.ok && (
          <button
            type="button"
            className="viz-btn viz-btn--ghost jo-small"
            onClick={() => {
              setText(current.fix);
              setFixShown(true);
            }}
          >
            Show the fix
          </button>
        )}
      </div>
      {fixShown && current && <p className="jo-small jo-good">Fixed: {current.why}</p>}
      {!result.ok && result.position !== null && (
        <div className="jo-gap">
          <div className="viz-label">Where the parser gave up</div>
          <JsonText text={text} mark={result.position} />
        </div>
      )}
      {result.ok && (
        <div className="jo-gap viz-fade">
          <div className="viz-label">Parsed</div>
          <HeapCard
            id="parsed-mini"
            label="JSON.parse(text)"
            isArray={Array.isArray(result.value)}
            props={toProps(result.value)}
          />
        </div>
      )}
      <p className="jo-small jo-muted">
        The red message is this browser’s own words. Other browsers word it differently.
      </p>
    </>
  );
}

// ─── Tab 3 ────────────────────────────────────────────────────────────

function SaveTab() {
  const [favs, setFavs] = useState<string[]>(['Samosa', 'Chai']);
  const [stored, setStored] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const toggle = (s: string) =>
    setFavs((f) => (f.includes(s) ? f.filter((x) => x !== s) : [...f, s]));
  return (
    <>
      <div className="jo-row" role="group" aria-label="Favourite snacks">
        {SNACKS.map((s) => (
          <button
            key={s}
            type="button"
            className="jo-toggle"
            aria-pressed={favs.includes(s)}
            onClick={() => toggle(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="jo-row jo-gap">
        <button
          type="button"
          className="viz-btn viz-btn--primary"
          onClick={() => {
            const r = storage.save(favs);
            setStored(r.stored ?? null);
            setStatus(
              r.ok ? 'Saved ✓' : 'Storage isn’t available here, so this only lives in memory.',
            );
          }}
        >
          Save
        </button>
        <button
          type="button"
          className="viz-btn"
          onClick={() => {
            const r = storage.load();
            if (!r.ok) setStatus('Storage isn’t available here.');
            else if (r.raw === null) setStatus('Nothing saved yet.');
            else if (Array.isArray(r.value)) {
              setFavs(r.value.filter((x): x is string => typeof x === 'string'));
              setStored(r.raw ?? null);
              setStatus('Loaded ✓');
            } else setStatus('What was stored isn’t a list.');
          }}
        >
          Load
        </button>
        <span className="jo-small jo-muted" aria-live="polite">
          {status}
        </span>
      </div>
      <pre className="vc-code viz-mono jo-small jo-gap">
        {
          'localStorage.setItem("favs", JSON.stringify(favs));\nconst favs = JSON.parse(localStorage.getItem("favs"));'
        }
      </pre>
      <div className="viz-panel jo-gap">
        <div className="viz-label">What’s really stored</div>
        {stored === null ? (
          <p className="jo-muted jo-small">Press Save.</p>
        ) : (
          <JsonText text={stored} />
        )}
        <p className="jo-small jo-muted">
          localStorage can only hold text, so the array is stored as a string and parsed back on
          load.
        </p>
      </div>
    </>
  );
}
