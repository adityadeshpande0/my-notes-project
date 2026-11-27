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
      <h2>What we measure</h2>
      <p>
        To learn which notes help and which confuse, the site counts anonymous visits and a few
        actions: opening and finishing a note, answering a self-check, playing a visual. There are
        no accounts, names, or emails, and if your browser sends &ldquo;Do Not Track&rdquo; only the
        anonymous visit count remains. Your reading progress stays in your browser.
      </p>
    </div>
  );
}
