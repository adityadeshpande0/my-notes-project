import type { RefObject } from 'react';

/** The plain-JS app, running in a locked-down iframe (scripts only). */
export default function TodoFrame({
  frameRef,
  srcDoc,
  title,
  height = 430,
}: {
  frameRef: RefObject<HTMLIFrameElement | null>;
  srcDoc: string;
  title: string;
  height?: number;
}) {
  return (
    <iframe
      ref={frameRef}
      className="td-frame"
      title={title}
      // Scripts and form submit events only. No allow-same-origin, so the app
      // can't reach this page or its storage (localStorage throws, which the
      // app's try/catch handles). allow-forms is needed for the submit event
      // to fire at all; the app always calls preventDefault, so nothing is sent.
      sandbox="allow-scripts allow-forms"
      srcDoc={srcDoc}
      loading="lazy"
      style={{ height }}
    />
  );
}

export function StorageNote() {
  return (
    <p className="td-note">
      💾 Saving is off in this preview: storage is blocked in sandboxed frames. The app keeps
      working anyway, thanks to the try/catch from article #7.
    </p>
  );
}
