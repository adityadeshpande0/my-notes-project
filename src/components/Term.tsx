import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { GLOSSARY } from '../content/glossary';
import { topics } from '../lib/content';

const OPEN_DELAY = 120;
const CLOSE_DELAY = 180; // long enough to move the mouse from the word into the card
const EDGE = 16; // keep the card this far from the screen edge
const HEADER = 72; // don't place the card under the sticky header

function noteExists(href: string) {
  const [, track, slug] = href.split('/');
  return topics.some((t) => t.track === track && t.slug === slug);
}

/**
 * A word with an explanation on hover (mouse), focus (keyboard), or tap (touch).
 *
 *   <Term id="big-o">Big-O</Term>                     uses the shared glossary
 *   <Term tip="Short explanation">some word</Term>     one-off explanation
 */
export function Term({ id, tip, children }: { id?: string; tip?: string; children?: ReactNode }) {
  const entry = id ? GLOSSARY[id] : undefined;
  if (import.meta.env.DEV && id && !entry) console.warn(`<Term>: no glossary entry for "${id}"`);

  const definition = tip ?? entry?.definition;
  const label = children ?? entry?.term;
  const { pathname } = useLocation();
  const onThatNote = entry?.note === pathname;
  const href = entry?.note && !onThatNote && noteExists(entry.note) ? entry.note : undefined;

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const lastPointer = useRef<string>('');
  const descId = useId(); // a unique id, so aria-describedby can point at the definition

  const schedule = (next: boolean, delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(next), delay);
  };

  // Clear any pending timer if the component unmounts.
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // useLayoutEffect runs after React updates the DOM but *before* the browser paints,
  // so we can measure the card and move it into place without a visible jump.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = triggerRef.current;
      const card = cardRef.current;
      if (!trigger || !card) return;
      const t = trigger.getBoundingClientRect();
      const { offsetWidth: w, offsetHeight: h } = card;
      const left = Math.min(
        Math.max(EDGE, t.left + t.width / 2 - w / 2),
        window.innerWidth - EDGE - w,
      );
      const fitsAbove = t.top - 10 - h > HEADER;
      card.style.left = `${left}px`;
      card.style.top = `${fitsAbove ? t.top - 10 - h : t.bottom + 10}px`;
      card.dataset.side = fitsAbove ? 'top' : 'bottom';
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  // While open, a tap or click anywhere else closes it.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  if (!definition) return <>{label}</>;

  return (
    <span
      ref={wrapperRef}
      className="relative"
      onPointerEnter={(e) => e.pointerType === 'mouse' && schedule(true, OPEN_DELAY)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && schedule(false, CLOSE_DELAY)}
      onFocus={() => schedule(true, 0)}
      onBlur={(e) => {
        // Stay open while focus moves from the word to the link inside the card.
        if (!wrapperRef.current?.contains(e.relatedTarget as Node)) schedule(false, 0);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-describedby={open ? descId : undefined}
        onPointerDown={(e) => (lastPointer.current = e.pointerType)}
        // Mouse users already opened it by hovering; touch users tap to toggle.
        onClick={() => (lastPointer.current === 'mouse' ? setOpen(true) : setOpen((o) => !o))}
        className="cursor-help rounded-sm text-inherit underline decoration-accent/60 decoration-dotted decoration-[1.5px] underline-offset-[0.22em] transition-colors hover:decoration-accent hover:decoration-solid aria-expanded:bg-accent/10 aria-expanded:decoration-accent"
      >
        {label}
      </button>

      {open && (
        <span
          ref={cardRef}
          className="term-card fixed top-0 left-0 z-50 block w-[min(21rem,calc(100vw-2rem))] rounded-card border border-border bg-elevated p-4 text-left shadow-[0_12px_40px_-12px_rgb(0_0_0/0.45)]"
        >
          {entry && (
            <span className="mb-1 block font-heading text-[0.95rem] font-semibold text-text">
              {entry.term}
            </span>
          )}
          <span
            id={descId}
            className="block font-sans text-[0.9rem] leading-relaxed font-normal text-muted"
          >
            {definition}
          </span>
          {href ? (
            <Link
              to={href}
              className="mt-3 inline-block font-mono text-xs text-accent no-underline hover:underline"
              onClick={() => setOpen(false)}
            >
              Read the full note →
            </Link>
          ) : (
            entry?.note &&
            !onThatNote && (
              <span className="mt-3 block font-mono text-xs text-muted/70">
                Full note coming soon
              </span>
            )
          )}
        </span>
      )}
    </span>
  );
}
