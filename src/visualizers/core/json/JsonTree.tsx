/**
 * A collapsible JSON tree (in the spirit of article #7's data explorer):
 * objects and arrays fold open and shut with the keyboard (Enter/Space on a
 * row), values are coloured by type. Built on <details>, so it needs no state.
 * Import './json.css' from the note's visualizer index.
 */
type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

const typeOf = (v: Json) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);

function Leaf({ v }: { v: Json }) {
  const t = typeOf(v);
  return <span className={`jt-v is-${t}`}>{t === 'string' ? JSON.stringify(v) : String(v)}</span>;
}

function Node({
  name,
  v,
  depth,
  openDepth,
}: {
  name?: string;
  v: Json;
  depth: number;
  openDepth: number;
}) {
  const key = name !== undefined && <span className="jt-k">{name}: </span>;
  if (v === null || typeof v !== 'object')
    return (
      <div className="jt-row">
        {key}
        <Leaf v={v} />
      </div>
    );
  const entries: [string, Json][] = Array.isArray(v)
    ? v.map((x, i) => [String(i), x])
    : Object.entries(v);
  const [open, close] = Array.isArray(v) ? ['[', ']'] : ['{', '}'];
  if (!entries.length)
    return (
      <div className="jt-row">
        {key}
        <span className="jt-p">
          {open}
          {close}
        </span>
      </div>
    );
  return (
    <details className="jt-node" open={depth < openDepth}>
      <summary className="jt-row">
        {key}
        <span className="jt-p">{open}</span>
        <span className="jt-preview">
          {' '}
          {Array.isArray(v) ? `${entries.length} items` : `${entries.length} keys`} {close}
        </span>
      </summary>
      <div className="jt-children">
        {entries.map(([k, x]) => (
          <Node key={k} name={k} v={x} depth={depth + 1} openDepth={openDepth} />
        ))}
      </div>
      <div className="jt-row jt-p">{close}</div>
    </details>
  );
}

export function JsonTree({
  value,
  openDepth = 2,
  label = 'JSON',
}: {
  value: unknown;
  openDepth?: number;
  label?: string;
}) {
  return (
    <div className="jt-tree viz-mono" role="group" aria-label={label}>
      <Node v={value as Json} depth={0} openDepth={openDepth} />
    </div>
  );
}
