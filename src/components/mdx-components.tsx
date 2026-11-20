import type { MDXComponents } from 'mdx/types';
import { Link } from 'react-router';
import { Callout } from './Callout';
import { CodeBlock } from './CodeBlock';
import { Term } from './Term';

/**
 * Components available inside every .mdx note without importing them,
 * plus overrides for plain markdown elements.
 */
export const mdxComponents: MDXComponents = {
  Callout,
  Term,
  pre: CodeBlock,
  // Internal links ("/dsa/...") use the router (no full page reload); external ones open in a new tab.
  a: ({ href = '', ...props }) =>
    href.startsWith('/') ? (
      <Link to={href} {...props} />
    ) : (
      <a href={href} target="_blank" rel="noreferrer" {...props} />
    ),
  // Wide tables scroll sideways instead of stretching the page on phones.
  table: (props) => (
    <div className="table-wrap">
      <table {...props} />
    </div>
  ),
};
