/**
 * Hide the loading screen from index.html once the page is really ready:
 * the web fonts have arrived (so text doesn't jump), the browser's `load`
 * event has fired, and, if you landed on a note, that note's own chunk has
 * loaded. A time limit makes sure nothing can keep the page hidden for long.
 *
 * Plain DOM code, no React: the splash lives outside React's #root.
 */
const MAX_WAIT = 5000; // ms
export const NOTE_READY = 'stackscape:note-ready';

/** Called by a note once it has rendered (TopicPage's NoteBody). */
export function signalNoteReady() {
  window.dispatchEvent(new Event(NOTE_READY));
}

export function hideSplashWhenReady() {
  const splash = document.getElementById('splash');
  if (!splash) return;

  // Listen from the start, so a fast note can't finish before we're listening.
  let noteLoaded = false;
  const noteReady = new Promise<void>((resolve) =>
    window.addEventListener(
      NOTE_READY,
      () => {
        noteLoaded = true;
        resolve();
      },
      { once: true },
    ),
  );

  const pageLoaded = new Promise<void>((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', () => resolve(), { once: true });
  });

  // Resolves after the browser has painted twice, i.e. React's latest render is on screen.
  const nextPaint = () =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );

  const ready = Promise.all([document.fonts.ready, pageLoaded])
    .then(nextPaint)
    .then(() => {
      // Still showing the "loading note" skeleton? Wait for the note itself.
      const waitingOnNote = !noteLoaded && document.querySelector('[data-note-skeleton]');
      return waitingOnNote ? noteReady.then(nextPaint) : undefined;
    });
  const timeout = new Promise((resolve) => setTimeout(resolve, MAX_WAIT));

  Promise.race([ready, timeout]).then(() => {
    splash.classList.add('is-done'); // fades out (CSS in index.html)
    setTimeout(() => splash.remove(), 400);
  });
}
