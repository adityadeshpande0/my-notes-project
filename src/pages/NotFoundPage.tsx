import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <p className="font-mono text-sm text-danger">404</p>
      <h1 className="mt-2 text-4xl">This page isn't on the map.</h1>
      <p className="mt-4 text-muted">It may have moved, or it hasn't been written yet.</p>
      <Link
        to="/"
        className="mt-8 inline-block rounded-btn bg-accent px-5 py-2.5 font-medium text-bg"
      >
        Back home
      </Link>
    </div>
  );
}
