import { useCallback, useEffect, useRef, useState } from 'react';
import type { TodoAction } from './lib/drive';
import type { BridgeMessage } from './lib/srcdoc';

type StateMsg = Extract<BridgeMessage, { type: 'state' }>;

/**
 * Talk to a plain-JS preview running in a sandboxed iframe. Messages are
 * accepted ONLY from that iframe's own window (event.source), and actions
 * are posted only to it. Returns the frame ref, `send(action)`, whether the
 * app is ready, and its latest reported state.
 *
 * React idea: an effect that subscribes and cleans up. The message listener
 * is added when the visual mounts and removed when it unmounts, just like
 * the listeners in article #10.
 */
export function useTodoFrame(onMessage?: (m: StateMsg) => void) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<StateMsg | null>(null);
  const cb = useRef(onMessage);
  useEffect(() => {
    cb.current = onMessage;
  });
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!frame.current || e.source !== frame.current.contentWindow) return; // only our own frame
      const d = e.data as BridgeMessage;
      if (!d || d.from !== 'chai-todo') return;
      if (d.type === 'ready') setReady(true);
      else {
        setState(d);
        cb.current?.(d);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const send = useCallback((action: TodoAction) => {
    // The sandboxed frame has an opaque ("null") origin, so "*" is the only
    // target that reaches it; we only ever send it actions, never secrets.
    frame.current?.contentWindow?.postMessage({ to: 'chai-todo', action }, '*');
  }, []);
  // A new srcdoc means a fresh app: wait for its "ready" again.
  const onLoadStart = useCallback(() => setReady(false), []);
  return { frame, ready, state, send, onLoadStart };
}
