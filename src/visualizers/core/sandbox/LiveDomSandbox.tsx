import { useEffect, useLayoutEffect, useRef } from 'react';

/**
 * LiveDomSandbox: a real mini web page that the visuals change with real DOM
 * methods (querySelector, classList, createElement…).
 *
 * Why it's built this way (an important React lesson): React expects to own
 * every element it renders. If other code changes those elements behind its
 * back, React's picture of the page goes stale and things break in confusing
 * ways. So React renders ONE empty <div> here and never renders anything
 * inside it. We attach a Shadow DOM to that div and fill it ourselves with a
 * trusted template. Inside, plain DOM code is in charge; outside, React is.
 * The shadow root also keeps the mini page's styles from leaking either way.
 *
 * A MutationObserver watches the mini page, so the tree views can re-read it
 * whenever the DOM changes.
 */
export interface Sandbox {
  /** The mini page's "body": run every query against this, never `document`. */
  root: HTMLElement;
}

export interface Highlight {
  el: Element;
  label?: string;
  tone?: 'match' | 'hover' | 'gone';
}

export default function LiveDomSandbox({
  template,
  resetKey = 0,
  onReady,
  onMutate,
  onHover,
  highlights = [],
  address = 'chai-corner.html',
  height,
  css = '',
}: {
  /** Trusted HTML written by us (never user text). */
  template: string;
  /** Change it to refill the page from the template. */
  resetKey?: number;
  onReady?: (sb: Sandbox) => void;
  onMutate?: (records: MutationRecord[]) => void;
  onHover?: (el: Element | null) => void;
  highlights?: Highlight[];
  address?: string;
  height?: number;
  /** Extra styles for this visual's mini page (added after the base styles). */
  css?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const parts = useRef<{ doc: HTMLElement; overlay: HTMLElement; viewport: HTMLElement } | null>(
    null,
  );
  // Keep the latest callbacks in refs, so the page isn't rebuilt when they change.
  const cb = useRef({ onReady, onMutate, onHover });
  useEffect(() => {
    cb.current = { onReady, onMutate, onHover };
  });

  useLayoutEffect(() => {
    const host = hostRef.current!;
    // In development React may run this twice; reuse the shadow root if it exists.
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${SANDBOX_CSS}${css}</style>
<div class="window">
  <div class="bar"><span class="dots"><i></i><i></i><i></i></span><span class="url"></span></div>
  <div class="viewport"><div class="doc"></div><div class="overlay" aria-hidden="true"></div></div>
</div>`;
    const doc = shadow.querySelector<HTMLElement>('.doc')!;
    const overlay = shadow.querySelector<HTMLElement>('.overlay')!;
    const viewport = shadow.querySelector<HTMLElement>('.viewport')!;
    shadow.querySelector('.url')!.textContent = address;
    doc.innerHTML = template; // a trusted, hard-coded template: never user input
    parts.current = { doc, overlay, viewport };

    const observer = new MutationObserver((records) => cb.current.onMutate?.(records));
    observer.observe(doc, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    });
    const over = (e: Event) => {
      const t = e.target as Element;
      cb.current.onHover?.(t === doc ? null : t);
    };
    const leave = () => cb.current.onHover?.(null);
    // Safety net: a link or form in the mini page must never navigate or
    // reload the article. This runs last (bubble phase, at the top), so the
    // visual's own handlers still see the event first.
    const guard = (e: Event) => {
      if (e.type === 'submit' || (e.target as Element).closest?.('a[href]')) e.preventDefault();
    };
    doc.addEventListener('pointerover', over);
    doc.addEventListener('pointerleave', leave);
    doc.addEventListener('click', guard);
    doc.addEventListener('submit', guard);
    cb.current.onReady?.({ root: doc });
    return () => {
      observer.disconnect(); // stop watching when the visual goes away
      doc.removeEventListener('pointerover', over);
      doc.removeEventListener('pointerleave', leave);
      doc.removeEventListener('click', guard);
      doc.removeEventListener('submit', guard);
    };
  }, [template, resetKey, address, css]);

  // Draw the highlight boxes on a separate overlay layer, so drawing them
  // never changes the mini page's own DOM (or shows up in its tree).
  useLayoutEffect(() => {
    const p = parts.current;
    if (!p) return;
    // Where an element sits inside the viewport, in the page's own pixels.
    // (offsetLeft/Top ignore CSS transforms, so this stays right even when
    // the whole window is tilted in 3D.)
    const place = (el: Element) => {
      if (!(el instanceof HTMLElement)) return null;
      let x = 0;
      let y = 0;
      let cur: HTMLElement | null = el;
      while (cur && cur !== p.viewport) {
        x += cur.offsetLeft;
        y += cur.offsetTop;
        cur = cur.offsetParent as HTMLElement | null;
      }
      return cur ? { x, y, w: el.offsetWidth, h: el.offsetHeight } : null;
    };
    const draw = () => {
      p.overlay.replaceChildren();
      for (const h of highlights) {
        if (!h.el.isConnected) continue;
        const r = place(h.el);
        if (!r || (!r.w && !r.h)) continue;
        const box = document.createElement('div');
        box.className = `box is-${h.tone ?? 'match'}`;
        Object.assign(box.style, {
          left: `${r.x - 3}px`,
          top: `${r.y - 3}px`,
          width: `${r.w + 6}px`,
          height: `${r.h + 6}px`,
        });
        if (h.label) {
          const tag = document.createElement('span');
          tag.textContent = h.label;
          box.append(tag);
        }
        p.overlay.append(box);
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(p.viewport);
    return () => ro.disconnect();
  }, [highlights]);

  return (
    <div ref={hostRef} className="dom-sandbox" style={height ? { minHeight: height } : undefined} />
  );
}

/**
 * The mini page's own look: a plain, light web page in a browser window, so
 * it reads as "a website" against the dark article. These colours belong to
 * that pretend website, not to Stackscape's theme, and live inside the shadow
 * root where they can't affect the rest of the page.
 */
const SANDBOX_CSS = `
:host { display: block; }
.window {
  --ink: oklch(0.25 0.02 260); --paper: oklch(0.99 0 0); --soft: oklch(0.95 0.01 260);
  --line: oklch(0.86 0.01 260); --brand: oklch(0.55 0.15 40); --glow: oklch(0.72 0.17 165);
  border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: var(--paper);
  color: var(--ink); font: 15px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif;
  box-shadow: 0 6px 24px oklch(0 0 0 / 0.25);
}
.bar { display: flex; align-items: center; gap: 10px; padding: 7px 10px; background: var(--soft); border-bottom: 1px solid var(--line); }
.dots { display: flex; gap: 5px; }
.dots i { width: 9px; height: 9px; border-radius: 50%; background: var(--line); }
.url { flex: 1; padding: 2px 10px; border-radius: 999px; background: var(--paper); color: oklch(0.5 0.02 260); font-size: 12px; }
.viewport { position: relative; padding: 14px 16px 18px; overflow: auto; }
.overlay { position: absolute; inset: 0; pointer-events: none; }
.box { position: absolute; border: 2px solid var(--glow); border-radius: 6px; background: oklch(0.72 0.17 165 / 0.12); }
.box.is-hover { border-color: oklch(0.6 0.15 265); background: oklch(0.6 0.15 265 / 0.12); border-style: dashed; }
.box span { position: absolute; top: -10px; left: -10px; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 9px;
  background: var(--glow); color: var(--paper); font: 700 11px/18px system-ui; text-align: center; }
h1 { margin: 0 0 4px; font-size: 22px; color: var(--brand); }
p { margin: 0 0 10px; }
.tagline { color: oklch(0.45 0.02 260); font-style: italic; }
ul { margin: 8px 0 12px; padding-left: 20px; }
#menu.cards, ul#menu { list-style: none; padding: 0; display: grid; gap: 6px; }
li { padding: 6px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); }
li .price { float: right; font-weight: 700; color: var(--brand); }
.sold-out { opacity: 0.5; text-decoration: line-through; }
.new { border-color: var(--glow); background: oklch(0.72 0.17 165 / 0.1); }
.done { opacity: 0.55; text-decoration: line-through; }
.highlight { box-shadow: 0 0 0 3px oklch(0.85 0.15 90), 0 0 14px oklch(0.85 0.15 90); }
.dark { background: oklch(0.28 0.02 260) !important; color: oklch(0.96 0 0) !important; }
.dark .price { color: oklch(0.85 0.12 70); }
header { margin-bottom: 8px; }
img { display: block; width: 120px; height: 70px; margin: 4px 0 8px; border-radius: 10px; }
button { padding: 7px 14px; border: 0; border-radius: 8px; background: var(--brand); color: var(--paper); font: inherit; font-weight: 600; }
#greeting { font-size: 18px; padding: 10px; border: 1px dashed var(--line); border-radius: 8px; overflow-wrap: anywhere; }
`;
