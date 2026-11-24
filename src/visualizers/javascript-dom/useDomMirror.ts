import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { describeNode, pathOf, toTree } from './lib/domTree';

/**
 * Keeps a tree view in step with the mini page. Pass `onMutate` to
 * LiveDomSandbox: every real DOM change arrives here as MutationRecords, the
 * tree is read again, and the touched nodes flash (amber = changed,
 * green = added). Removed nodes can't flash (they're gone), so they're listed.
 *
 * React idea: a custom hook. It's just a function whose name starts with
 * `use` and that calls other hooks, so two visuals can share this logic
 * without sharing any markup.
 */
export function useDomMirror(root: HTMLElement | null) {
  const [version, setVersion] = useState(0);
  const [flash, setFlash] = useState(new Map<string, 'changed' | 'added'>());
  const [removed, setRemoved] = useState<string[]>([]);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const onMutate = useCallback(
    (records: MutationRecord[]) => {
      if (!root) return;
      const next = new Map<string, 'changed' | 'added'>();
      const gone: string[] = [];
      const mark = (n: Node, kind: 'changed' | 'added') => {
        const p = pathOf(root, n);
        if (p && p.length && next.get(p.join('.')) !== 'added') next.set(p.join('.'), kind);
      };
      for (const r of records) {
        if (r.type === 'childList') {
          r.addedNodes.forEach((n) => mark(n, 'added'));
          r.removedNodes.forEach((n) => {
            // Text replaced by textContent isn't worth listing; elements are.
            if (n.nodeType === 1) gone.push(describeNode(n));
          });
          if (r.removedNodes.length && !r.addedNodes.length) mark(r.target, 'changed');
        } else mark(r.target, 'changed');
      }
      setVersion((v) => v + 1);
      // Clear first, then set on the next frame, so the flash animation restarts.
      setFlash(new Map());
      requestAnimationFrame(() => setFlash(next));
      if (gone.length) setRemoved(gone);
      timers.current.push(
        window.setTimeout(() => {
          setFlash(new Map());
          setRemoved([]);
        }, 1800),
      );
    },
    [root],
  );

  // `version` changes on every mutation, which is what re-reads the tree.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tree = useMemo(() => (root ? toTree(root) : []), [root, version]);
  return { tree, flash, removed, onMutate, version };
}
