import { useEffect, useRef, useState, type ComponentProps, type ReactElement } from 'react';

const LANGUAGES: Record<string, string> = {
  ts: 'TypeScript',
  tsx: 'TSX',
  js: 'JavaScript',
  jsx: 'JSX',
  py: 'Python',
  python: 'Python',
  cpp: 'C++',
  java: 'Java',
  bash: 'Terminal',
  sh: 'Terminal',
  json: 'JSON',
  css: 'CSS',
  html: 'HTML',
};

/**
 * Replaces markdown's ``` code blocks in notes: adds a header with the
 * language name and a copy button. The colors come from Shiki at build time.
 */
export function CodeBlock({ children, className = '', style, ...rest }: ComponentProps<'pre'>) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  // Shiki puts "language-ts" on the inner <code> element.
  const codeClass = (children as ReactElement<{ className?: string }>)?.props?.className ?? '';
  const lang = /language-(\w+)/.exec(codeClass)?.[1];

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(preRef.current?.innerText ?? '');
      setCopied(true);
      // TODO (owner): record the copy with analytics. The event is already
      // defined in lib/analytics.ts as `code_copied`, with one property,
      // `language`. Import `track` from '../lib/analytics' and call it here.
      // Hint: `lang` may be undefined, so pass a fallback like 'text'.
    } catch {
      // Clipboard can be unavailable (http, old browsers). Selecting by hand still works.
    }
  };

  return (
    <div className="not-prose my-8 overflow-hidden rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-2 font-mono text-xs text-muted">
        <span>{lang ? (LANGUAGES[lang] ?? lang) : 'Code'}</span>
        <button
          type="button"
          onClick={copy}
          className="rounded-md px-2 py-0.5 transition-colors hover:bg-elevated hover:text-text"
          aria-live="polite"
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <pre
        ref={preRef}
        {...rest}
        style={{ ...style, background: 'transparent' }}
        className={`${className} overflow-x-auto px-4 py-4 font-mono text-[0.85rem] leading-[1.7]`}
      >
        {children}
      </pre>
    </div>
  );
}
