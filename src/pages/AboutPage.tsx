export function AboutPage() {
  return (
    <div className="prose">
      <h1>About Stackscape</h1>
      <p>
        Stackscape is a set of visual, interactive notes for learning <strong>React</strong> and{' '}
        <strong>data structures &amp; algorithms</strong>. Each topic is a short note with visuals
        you can play, pause, and step through.
      </p>
      <p>
        It's built by someone learning React while building it, so the codebase is part of the
        curriculum too. It's free for anyone to use.
      </p>
      <h2>Reading the visuals</h2>
      <p>Colors mean the same thing on every page, and always come with a label or shape:</p>
      <ul>
        <li>
          <span className="text-accent-2">Mint</span>: the current step
        </li>
        <li>
          <span className="text-warn">Amber</span>: comparing
        </li>
        <li>
          <span className="text-danger">Coral</span>: swapping or conflict
        </li>
        <li>
          <span className="text-success">Green</span>: sorted, found, or done
        </li>
      </ul>
    </div>
  );
}
