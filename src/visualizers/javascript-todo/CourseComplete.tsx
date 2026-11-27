import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { topics } from '../../lib/content';
import { pathFor } from '../../lib/curriculum';
import { useReducedMotion } from '../../lib/hooks';
import { useReadingHistory, wasVisited } from '../../lib/readingHistory';

/**
 * The course wrap-up: your progress through all 14 articles (from the
 * site's reading history, kept in this browser), and a small celebration
 * when you've read every one.
 *
 * React idea: reading shared state with a hook. useReadingHistory subscribes
 * to the same store the course page uses, so both always agree.
 */
export default function CourseComplete() {
  const history = useReadingHistory();
  const path = pathFor(topics, 'javascript');
  const read = path.filter((s) => s.href && wasVisited(history, 'javascript', s.slug));
  const all = path.length > 0 && read.length === path.length;
  const unread = path.filter((s) => !read.includes(s));
  const [copied, setCopied] = useState('');
  const share = 'I just finished the JavaScript course on Stackscape! 🎉';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(share);
      setCopied('Copied ✓');
    } catch {
      setCopied('Copying isn’t allowed here.');
    }
  };

  return (
    <div className="viz not-prose td-complete">
      <div className="td-complete-top">
        <div
          className="td-ring"
          aria-label={`You've read ${read.length} of ${path.length} articles`}
        >
          {path.map((s, i) => (
            <Link
              key={s.slug}
              to={s.href ?? '#'}
              className={`td-seg ${read.includes(s) ? 'is-read' : ''}`}
              style={{ '--a': `${(i / path.length) * 360}deg` } as CSSProperties}
              title={`#${s.step} ${s.title}${read.includes(s) ? ' (read)' : ''}`}
              aria-label={`Article ${s.step}: ${s.title}${read.includes(s) ? ', read' : ', not read yet'}`}
            >
              {s.step}
            </Link>
          ))}
          <div className="td-ring-centre">
            <strong>
              {read.length}/{path.length}
            </strong>
            <span className="td-small">read</span>
          </div>
        </div>
        {all ? (
          <div className="td-done-card">
            <Confetti />
            <p className="td-done-badge">🏅 JavaScript Course: Completed</p>
            <p className="td-small">
              {new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <div className="td-row">
              <button type="button" className="viz-btn" onClick={copy}>
                Copy share text
              </button>
              <span className="td-small" aria-live="polite">
                {copied}
              </span>
            </div>
          </div>
        ) : (
          <div>
            <p className="td-progress-text">
              You’ve read <strong>{read.length}</strong> of {path.length} articles.
            </p>
            {unread.length > 0 && (
              <>
                <p className="td-small td-muted">Still to read:</p>
                <ul className="td-unread">
                  {unread.map((s) => (
                    <li key={s.slug}>
                      {s.href ? (
                        <Link to={s.href}>
                          #{s.step} {s.title}
                        </Link>
                      ) : (
                        `#${s.step} ${s.title} (coming soon)`
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
      <div className="td-next">
        <Link className="td-nextcard" to="/react">
          <span aria-hidden="true">⚛️</span>
          <strong>The React track</strong>
          <span className="td-small">
            Components, state, effects and real apps. You already know why React works the way it
            does.
          </span>
        </Link>
        <Link className="td-nextcard" to="/dsa">
          <span aria-hidden="true">🧠</span>
          <strong>The DSA track</strong>
          <span className="td-small">Arrays, sorting, searching, recursion and Big-O.</span>
        </Link>
        <div className="td-nextcard">
          <span aria-hidden="true">🛠️</span>
          <strong>Build your own project</strong>
          <span className="td-small">
            A habit tracker, an expense splitter for friends, or a recipe saver.
          </span>
        </div>
      </div>
    </div>
  );
}

/** A tiny confetti burst on a canvas (no library). Skipped under reduced motion. */
function Confetti() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (reduced || !canvas || !ctx) return;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
    const style = getComputedStyle(document.documentElement);
    const colours = ['--accent', '--accent-2', '--warn', '--success', '--pink', '--violet'].map(
      (v) => style.getPropertyValue(v).trim() || 'gold',
    );
    const bits = Array.from({ length: 90 }, () => ({
      x: width / 2,
      y: height * 0.4,
      vx: (Math.random() - 0.5) * 9,
      vy: -Math.random() * 8 - 3,
      r: Math.random() * Math.PI,
      c: colours[Math.floor(Math.random() * colours.length)],
    }));
    let frame = 0;
    let t = 0;
    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      for (const b of bits) {
        b.vy += 0.25;
        b.x += b.vx;
        b.y += b.vy;
        b.r += 0.15;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.r);
        ctx.fillStyle = b.c;
        ctx.fillRect(-4, -2, 8, 4);
        ctx.restore();
      }
      if (++t < 150) frame = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, width, height);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced]);
  return reduced ? (
    <span className="td-static-party" aria-hidden="true">
      🎉
    </span>
  ) : (
    <canvas ref={ref} className="td-confetti" aria-hidden="true" />
  );
}
