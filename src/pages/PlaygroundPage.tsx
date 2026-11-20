import { Card } from '../components/Card';

export function PlaygroundPage() {
  return (
    <div className="max-w-3xl">
      <p className="mb-3 font-mono text-sm text-accent-2">coming in phase 1</p>
      <h1 className="text-4xl sm:text-5xl">Playground</h1>
      <p className="mt-4 text-lg text-muted">
        Every visualizer in one place, with your own input. Sorting comes first.
      </p>
      <Card className="mt-10">
        <p className="text-muted">
          Nothing to play with yet. The first visualizer (bubble sort) arrives in Phase 1.
        </p>
      </Card>
    </div>
  );
}
