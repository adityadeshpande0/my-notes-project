import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import { CodeView, Tabs } from '../core/code';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import {
  appBody,
  bundleOrder,
  EXPORTS,
  importCode,
  PROJECT,
  resolve,
  trySecret,
  type DefaultName,
  type ImportChoice,
  type Outcome,
} from './lib/modules';

/**
 * #2 Files that share. Import badges on the left of a file connect to export
 * badges on the right of another. The outcome of "Run" comes from a real
 * check against the real module's exports (lib/modules.ts + demo/math.ts),
 * and the output from calling the real exported functions.
 *
 * React idea: measuring after render. The arrows join DOM elements, so their
 * positions only exist once React has put the cards on the page. A
 * useLayoutEffect measures them right after rendering (before the browser
 * paints), and again whenever the area is resized.
 */
type TabId = 'named' | 'project';

export default function ModuleMap() {
  return (
    <div className="viz not-prose mj-modules">
      <p className="viz-title">Files that share</p>
      <Tabs<TabId>
        label="Parts of this visual"
        tabs={[
          { id: 'named', name: 'Named vs default' },
          { id: 'project', name: 'A real project' },
        ]}
      >
        {(t) => (t === 'named' ? <NamedTab /> : <ProjectTab />)}
      </Tabs>
    </div>
  );
}

interface Path {
  d: string;
  tone: string;
  missing?: boolean;
  end?: [number, number];
}

/**
 * Curves between each `[data-arrow-from]` element and the element whose
 * `data-arrow-id` it names (or a ❓ when there isn't one), measured inside
 * `box` after every render that changes `deps`.
 * - 'from-left': the target is on the LEFT (math.js exports → app.js imports).
 * - 'to-right': the target is on the RIGHT (a file → the files it imports).
 */
function useArrows(
  box: RefObject<HTMLDivElement | null>,
  deps: unknown,
  dir: 'from-left' | 'to-right' = 'from-left',
) {
  const [paths, setPaths] = useState<Path[]>([]);
  useLayoutEffect(() => {
    const root = box.current;
    if (!root) return;
    const measure = () => {
      const base = root.getBoundingClientRect();
      const out: Path[] = [];
      root.querySelectorAll<HTMLElement>('[data-arrow-from]').forEach((src) => {
        const target = root.querySelector<HTMLElement>(
          `[data-arrow-id="${src.dataset.arrowFrom}"]`,
        );
        const a = src.getBoundingClientRect();
        // From the export (target, right edge) to the import (source, left edge).
        const x1 = a.left - base.left;
        const y1 = a.top + a.height / 2 - base.top;
        if (!target) {
          const x0 = x1 - 60;
          out.push({
            d: `M ${x1} ${y1} C ${x1 - 30} ${y1}, ${x0 + 20} ${y1 - 30}, ${x0} ${y1 - 30}`,
            tone: 'missing',
            missing: true,
            end: [x0, y1 - 30],
          });
          return;
        }
        const b = target.getBoundingClientRect();
        const tone = src.dataset.arrowTone ?? '';
        if (dir === 'to-right') {
          // From the import chip's right edge to the imported file's left edge.
          const sx = a.right - base.left;
          const tx = b.left - base.left;
          const ty = b.top + b.height / 2 - base.top;
          const m = (sx + tx) / 2;
          out.push({ d: `M ${sx} ${y1} C ${m} ${y1}, ${m} ${ty}, ${tx} ${ty}`, tone });
          return;
        }
        const x0 = b.right - base.left;
        const y0 = b.top + b.height / 2 - base.top;
        const mid = (x0 + x1) / 2;
        out.push({ d: `M ${x0} ${y0} C ${mid} ${y0}, ${mid} ${y1}, ${x1} ${y1}`, tone });
      });
      setPaths(out);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [deps]); // eslint-disable-line react-hooks/exhaustive-deps
  return paths;
}

function Arrows({ paths }: { paths: Path[] }) {
  return (
    <svg className="mj-arrows" aria-hidden="true">
      {paths.map((p, i) => (
        <g key={i} className={`is-${p.tone}`}>
          <path d={p.d} />
          {p.missing && p.end && (
            <text x={p.end[0] - 6} y={p.end[1] + 5}>
              ❓
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ─── Tab: Named vs default ───────────────────────────────────────────

const MATH_CODE = [
  'export const GST = 0.18;',
  'export function addGST(price) {',
  '  return price * (1 + GST);',
  '}',
  'export default function formatRupees(n) {',
  '  return "₹" + n.toFixed(2);',
  '}',
  'const secretRecipe = "…"; // not exported',
];
const START: ImportChoice = {
  named: { GST: false, addGST: true, addTax: false },
  alias: false,
  defaultName: 'formatRupees',
  braces: false,
  twoDefaults: false,
};

function NamedTab() {
  const [c, setC] = useState<ImportChoice>(START);
  const [ran, setRan] = useState<Outcome | null>(null);
  const [secret, setSecret] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const set = (patch: Partial<ImportChoice>) => {
    setC((x) => ({ ...x, ...patch }));
    setRan(null);
  };
  const paths = useArrows(box, JSON.stringify(c));
  const mathCode = c.twoDefaults ? [...MATH_CODE, 'export default function oops() {}'] : MATH_CODE;
  // The import badges on app.js, pointing at the export each one uses.
  const imports: { label: string; to: string; tone: string }[] = [];
  if (c.defaultName !== 'none')
    imports.push(
      c.braces
        ? { label: '{ formatRupees }', to: 'formatRupees', tone: 'named' }
        : { label: c.defaultName, to: 'default', tone: 'default' },
    );
  if (c.named.GST) imports.push({ label: 'GST', to: 'GST', tone: 'named' });
  if (c.named.addGST)
    imports.push({ label: c.alias ? 'addGST as withTax' : 'addGST', to: 'addGST', tone: 'named' });
  if (c.named.addTax) imports.push({ label: 'addTax', to: 'addTax', tone: 'named' });
  const fileError = c.twoDefaults;

  return (
    <>
      <div className="mj-files" ref={box}>
        <section className={`mj-file is-room ${fileError ? 'has-error' : ''}`} aria-label="math.js">
          <div className="mj-file-head viz-mono">
            math.js {fileError && <span className="mj-badge is-error">SyntaxError</span>}
          </div>
          <pre className="mj-file-code viz-mono">{mathCode.join('\n')}</pre>
          <div className="mj-exports" aria-label="Exports">
            {EXPORTS.filter((e) => e !== 'default').map((e) => (
              <span key={e} className="mj-badge is-named viz-mono" data-arrow-id={e}>
                {e}
              </span>
            ))}
            <span className="mj-badge is-default viz-mono" data-arrow-id="default">
              default
            </span>
            {c.twoDefaults && (
              <span className="mj-badge is-default is-error viz-mono">default (again!)</span>
            )}
          </div>
          <label className="mj-check mj-small">
            <input
              type="checkbox"
              checked={c.twoDefaults}
              onChange={(e) => set({ twoDefaults: e.target.checked })}
            />
            Mistake: add a second export default
          </label>
        </section>
        <section className="mj-file is-room" aria-label="app.js">
          <div className="mj-file-head viz-mono">app.js</div>
          <div className="mj-imports" aria-label="Imports">
            {imports.length === 0 && <span className="mj-small mj-muted">(no imports)</span>}
            {imports.map((im) => {
              const exists = im.to === 'default' || EXPORTS.includes(im.to);
              return (
                <span
                  key={im.label}
                  className={`mj-badge is-${im.tone} viz-mono ${exists ? '' : 'is-missing'}`}
                  data-arrow-from={im.to}
                  data-arrow-tone={exists ? im.tone : 'missing'}
                >
                  {im.label} <span className="mj-from">← from math.js{exists ? '' : ' ❓'}</span>
                </span>
              );
            })}
          </div>
          <pre className="mj-file-code viz-mono">
            {[importCode(c), '', ...appBody(c)].join('\n')}
          </pre>
          <fieldset className="mj-editor">
            <legend className="mj-small">Import editor</legend>
            <div className="mj-row">
              {(['GST', 'addGST', 'addTax'] as const).map((n) => (
                <label key={n} className="mj-check viz-mono">
                  <input
                    type="checkbox"
                    checked={c.named[n]}
                    onChange={(e) => set({ named: { ...c.named, [n]: e.target.checked } })}
                  />
                  {`{ ${n} }`}
                  {n === 'addTax' ? ' (wrong name!)' : ''}
                </label>
              ))}
            </div>
            <div className="mj-row">
              <label className="mj-check">
                <input
                  type="checkbox"
                  checked={c.alias}
                  disabled={!c.named.addGST}
                  onChange={(e) => set({ alias: e.target.checked })}
                />
                rename: <code>addGST as withTax</code>
              </label>
              <label className="mj-row mj-small">
                default import name
                <select
                  className="mj-select"
                  value={c.defaultName}
                  onChange={(e) => set({ defaultName: e.target.value as DefaultName })}
                >
                  <option value="formatRupees">formatRupees</option>
                  <option value="rupees">rupees</option>
                  <option value="fmt">fmt</option>
                  <option value="none">(don’t import it)</option>
                </select>
              </label>
              <label className="mj-check">
                <input
                  type="checkbox"
                  checked={c.braces}
                  onChange={(e) => set({ braces: e.target.checked })}
                />
                Mistake: import the default with {'{ }'}
              </label>
            </div>
          </fieldset>
        </section>
        <Arrows paths={paths} />
      </div>
      <div className="mj-row mj-gap">
        <button
          type="button"
          className="viz-btn viz-btn--primary"
          onClick={() => setRan(resolve(c))}
        >
          ▶ Run app.js
        </button>
        <button
          type="button"
          className="viz-btn viz-mono"
          onClick={() => setSecret(trySecret().error)}
        >
          console.log(secretRecipe)
        </button>
      </div>
      <div className="viz-panel mj-console" aria-live="polite">
        <div className="viz-label">Console</div>
        {secret && (
          <p className="mj-bad viz-mono">
            ✗ {secret}{' '}
            <span className="mj-muted mj-small">
              Each module has its own scope. Only exports are shared (article #8’s scope rooms).
            </span>
          </p>
        )}
        {!ran ? (
          <p className="mj-muted mj-small">Press Run.</p>
        ) : ran.ok ? (
          ran.output.length ? (
            ran.output.map((line, i) => (
              <p key={i} className="viz-mono mj-out">
                › {line}
              </p>
            ))
          ) : (
            <p className="mj-muted mj-small">(nothing imported, so nothing printed)</p>
          )
        ) : (
          <div>
            <p className="mj-bad viz-mono">
              ✗ {ran.name} in {ran.where}: {ran.message}
            </p>
            <p className="mj-small">{ran.plain}</p>
            <p className="mj-small mj-muted">
              This is Chromium’s wording; the exact wording varies by browser. The file never runs
              at all: imports are checked first.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Tab: A real project ─────────────────────────────────────────────

const ORDER = bundleOrder();

function ProjectTab() {
  const [active, setActive] = useState<string | null>(null);
  const [bundling, setBundling] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const s = useStepper(ORDER.length + 2, 700);
  const paths = useArrows(box, `${active}-${bundling}`, 'to-right');
  const visiting = bundling ? Math.min(s.index, ORDER.length) : -1;
  const visited = bundling ? ORDER.slice(0, Math.min(s.index, ORDER.length)) : [];
  const packed = bundling > 0 && s.index >= ORDER.length;
  const total = useMemo(() => PROJECT.reduce((sum, f) => sum + f.kb, 0), []);
  const cols = [0, 1, 2, 3, 4];

  return (
    <>
      <p className="mj-small">
        Hover or Tab to a file: periwinkle arrows show what it imports, amber ones who imports it.
      </p>
      <div className="mj-project" ref={box}>
        {cols.map((col) => (
          <div key={col} className="mj-col">
            {PROJECT.filter((f) => f.col === col).map((f) => {
              const out = active
                ? PROJECT.find((p) => p.id === active)!.imports.includes(f.id)
                : false;
              const inc = active ? f.imports.includes(active) : false;
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`mj-pfile ${f.pkg ? 'is-pkg' : ''} ${active === f.id ? 'is-active' : ''} ${out ? 'is-out' : ''} ${inc ? 'is-in' : ''} ${visited.includes(f.id) ? 'is-visited' : ''} ${ORDER[visiting - 1] === f.id ? 'is-current' : ''}`}
                  data-arrow-id={f.id}
                  onMouseEnter={() => setActive(f.id)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(f.id)}
                  onBlur={() => setActive(null)}
                >
                  <span className="viz-mono">
                    {f.pkg ? '📦 ' : '📄 '}
                    {f.label}
                  </span>
                  <span className="mj-small mj-muted">{f.exports}</span>
                  {f.imports.length > 0 && (
                    <span className="mj-deps">
                      {f.imports.map((d) => (
                        <span
                          key={d}
                          className="mj-dep viz-mono"
                          // Arrows only for the file you're pointing at, so the map stays readable.
                          data-arrow-from={active === f.id || active === d ? d : undefined}
                          data-arrow-tone={active === f.id ? 'out' : 'in'}
                        >
                          ← {PROJECT.find((p) => p.id === d)!.label}
                        </span>
                      ))}
                    </span>
                  )}
                  {f.unused && packed && (
                    <span className="mj-shaken viz-mono">
                      ✂ {f.unused}() dropped: never imported
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
        <Arrows paths={paths} />
      </div>
      <div className="mj-row mj-gap">
        <button
          type="button"
          className="viz-btn viz-btn--primary"
          onClick={() => {
            setBundling((b) => b + 1);
            s.reset();
            s.toggle();
          }}
        >
          Bundle it 📦
        </button>
        <span className="mj-small mj-muted" aria-live="polite">
          {bundling === 0
            ? 'The bundler starts at main.jsx and follows every import.'
            : !packed
              ? `🤖 Visiting ${PROJECT.find((f) => f.id === ORDER[visiting - 1])?.label ?? 'main.jsx'} (${visiting} of ${ORDER.length})`
              : 'Every file visited. Now squash them into one.'}
        </span>
      </div>
      {bundling > 0 && <StepControls s={s} />}
      {packed && (
        <div
          className={`mj-bundle ${s.index >= ORDER.length + 1 ? 'is-squashed' : ''}`}
          aria-live="polite"
        >
          <div className="mj-stack" aria-hidden="true">
            {ORDER.map((id, i) => (
              <span key={id} className="mj-sheet viz-mono" style={{ '--i': i } as CSSProperties}>
                {PROJECT.find((f) => f.id === id)!.label}
              </span>
            ))}
          </div>
          <div className="mj-output">
            <span className="viz-mono">📦 assets/index-4f2a9c.js</span>
            <span className="mj-small">
              ≈ {(total - 0.2).toFixed(1)} KB (example sizes), from {ORDER.length} files. formatDate
              never made it in (tree-shaking).
            </span>
          </div>
          <p className="mj-small mj-muted">Bundlers like Vite do this when you build your site.</p>
        </div>
      )}
      <div className="viz-panel mj-gap">
        <div className="viz-label">How the browser starts it</div>
        <CodeView
          label="index.html"
          lines={[{ text: '<script type="module" src="/src/main.jsx"></script>' }]}
        />
        <p className="mj-small">
          type="module" tells the browser this file uses import/export. Module scripts are deferred
          automatically (like defer in article #9), and in development Vite serves each file on its
          own; the build bundles them.
        </p>
      </div>
    </>
  );
}
