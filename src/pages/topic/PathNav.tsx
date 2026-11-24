import { Link } from 'react-router';
import { topics } from '../../lib/content';
import { pathFor } from '../../lib/curriculum';
import { TRACKS, type Track } from '../../lib/types';
import { TableOfContents, type Heading } from './TableOfContents';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The left sidebar on a note: a link back to the collection, where this step
 * sits in it, and this note's own sections ("on this page"). The full list of
 * steps lives on the collection page; here we keep the focus on this note.
 */
export function PathNav({
  track,
  slug,
  headings,
}: {
  track: Track;
  slug: string;
  headings: Heading[];
}) {
  const path = pathFor(topics, track);
  const step = path.find((s) => s.slug === slug);

  return (
    <nav aria-label="On this page">
      <Link
        to={`/${track}`}
        className="mb-6 flex items-center gap-2 text-sm text-muted hover:text-text"
      >
        <span aria-hidden="true">←</span> {TRACKS[track].name} path
      </Link>

      {step && (
        <div className="mb-6">
          <p className="font-mono text-[0.7rem] tracking-wider text-muted uppercase">
            Step {pad(step.step)} of {pad(path.length)} · {step.group}
          </p>
          <p className="mt-1.5 font-heading text-lg leading-snug">{step.title}</p>
        </div>
      )}

      {headings.length > 0 && (
        <>
          <p className="mb-2 font-mono text-[0.7rem] tracking-wider text-muted uppercase">
            On this page
          </p>
          <TableOfContents headings={headings} />
        </>
      )}
    </nav>
  );
}
