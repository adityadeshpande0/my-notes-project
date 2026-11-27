/**
 * Count the REAL changes a MutationObserver saw on a to-do list.
 * - rows added / removed: <li> elements added to or removed from the list;
 * - attribute changes: only those where the value really ended up different
 *   (React re-writes some checkbox attributes, even removing and re-adding
 *   them, which changes nothing you can see; those records are counted
 *   separately as "no-ops").
 *
 * Self-contained on purpose (no imports, no outside variables): the plain-JS
 * preview's bridge script embeds this exact function inside its iframe.
 */
export interface ChangeCount {
  rowsAdded: number;
  rowsRemoved: number;
  attrs: number;
  noops: number;
  details: string[];
}

export function countChanges(records: MutationRecord[], list: Element): ChangeCount {
  const out: ChangeCount = { rowsAdded: 0, rowsRemoved: 0, attrs: 0, noops: 0, details: [] };
  // For each element + attribute, remember the value it had BEFORE this batch
  // (the oldValue of its first record). React sometimes removes an attribute
  // and sets it straight back: two records, but no change in the end.
  const before = new Map<Element, Map<string, string | null>>();
  let attrRecords = 0;
  for (const r of records) {
    if (r.type === 'childList' && r.target === list) {
      r.addedNodes.forEach((n) => {
        if ((n as Element).tagName === 'LI') out.rowsAdded++;
      });
      r.removedNodes.forEach((n) => {
        if ((n as Element).tagName === 'LI') out.rowsRemoved++;
      });
    } else if (r.type === 'attributes' && list.contains(r.target)) {
      attrRecords++;
      const el = r.target as Element;
      const seen = before.get(el) ?? new Map<string, string | null>();
      if (!seen.has(r.attributeName!)) seen.set(r.attributeName!, r.oldValue);
      before.set(el, seen);
    }
  }
  // A real change: the value now differs from the value before the batch.
  before.forEach((attrs, el) =>
    attrs.forEach((old, name) => {
      const now = el.getAttribute(name);
      if (now !== old) {
        out.attrs++;
        out.details.push(`${el.tagName.toLowerCase()} ${name}: "${old ?? ''}" → "${now ?? ''}"`);
      }
    }),
  );
  out.noops = attrRecords - out.attrs;
  return out;
}
