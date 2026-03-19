'use client';

import { isValidElement, type ReactNode } from 'react';
import type { Components } from 'react-markdown';
import HeadingAnchor from './HeadingAnchor';
import CodeBlock from './CodeBlock';
import CalloutBlock from './CalloutBlock';

const CALLOUT_REGEX = /^\[!(NOTE|WARNING|TIP|DANGER)\]\s*/;

/** Extract text content from React children for callout detection */
function getChildText(children: ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(getChildText).join('');
  if (isValidElement(children)) {
    const props = children.props as Record<string, unknown>;
    if (props.children) return getChildText(props.children as ReactNode);
  }
  return '';
}

/**
 * Component registry for react-markdown.
 * Maps HTML elements to custom cosmic-themed components.
 * Restricted element set for XSS safety — no raw HTML allowed.
 */
export const markdownComponents: Components = {
  h1: ({ children }) => <HeadingAnchor level={1}>{children}</HeadingAnchor>,
  h2: ({ children }) => <HeadingAnchor level={2}>{children}</HeadingAnchor>,
  h3: ({ children }) => <HeadingAnchor level={3}>{children}</HeadingAnchor>,
  h4: ({ children }) => <HeadingAnchor level={4}>{children}</HeadingAnchor>,
  h5: ({ children }) => <HeadingAnchor level={5}>{children}</HeadingAnchor>,
  h6: ({ children }) => <HeadingAnchor level={6}>{children}</HeadingAnchor>,

  code: ({ className, children, ...props }) => {
    // Inline code vs block code
    const isBlock = className?.startsWith('language-');
    if (isBlock) {
      return <CodeBlock className={className}>{children}</CodeBlock>;
    }
    return (
      <code
        className="rounded bg-cosmic-frost/10 px-1.5 py-0.5 font-mono text-sm text-cosmic-glow"
        {...props}
      >
        {children}
      </code>
    );
  },

  pre: ({ children }) => <>{children}</>,

  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-cosmic-glow underline decoration-cosmic-glow/30 underline-offset-2 transition-colors hover:text-cosmic-glow/80 hover:decoration-cosmic-glow/60"
    >
      {children}
    </a>
  ),

  blockquote: ({ children }) => {
    const text = getChildText(children);
    const match = text.match(CALLOUT_REGEX);
    if (match) {
      const type = match[1] as 'NOTE' | 'WARNING' | 'TIP' | 'DANGER';
      return <CalloutBlock type={type}>{children}</CalloutBlock>;
    }
    return (
      <blockquote className="my-4 border-l-2 border-cosmic-glow/40 pl-4 italic text-cosmic-frost/70">
        {children}
      </blockquote>
    );
  },

  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-cosmic-frost/10">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),

  thead: ({ children }) => (
    <thead className="border-b border-cosmic-frost/10 bg-cosmic-void/50 font-mono text-xs uppercase text-cosmic-glow/70">
      {children}
    </thead>
  ),

  th: ({ children }) => <th className="px-4 py-2 text-left">{children}</th>,
  td: ({ children }) => <td className="px-4 py-2 text-cosmic-frost/80">{children}</td>,

  ul: ({ children }) => (
    <ul className="my-2 ml-6 list-disc space-y-1 text-cosmic-frost/80">{children}</ul>
  ),

  ol: ({ children }) => (
    <ol className="my-2 ml-6 list-decimal space-y-1 text-cosmic-frost/80">{children}</ol>
  ),

  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  p: ({ children }) => <p className="my-3 leading-relaxed text-cosmic-frost/85">{children}</p>,

  hr: () => <hr className="my-8 border-t border-cosmic-frost/10" />,

  img: ({ src, alt }) => {
    // Reject javascript: protocol
    const srcStr = typeof src === 'string' ? src : '';
    if (srcStr && /^javascript:/i.test(srcStr)) return null;
    return (
      <figure className="my-6">
        <img
          src={srcStr}
          alt={alt ?? ''}
          loading="lazy"
          className="max-w-full rounded-lg border border-cosmic-frost/10"
        />
        {alt && (
          <figcaption className="mt-2 text-center text-sm text-cosmic-frost/50">{alt}</figcaption>
        )}
      </figure>
    );
  },

  strong: ({ children }) => <strong className="font-semibold text-cosmic-frost">{children}</strong>,

  em: ({ children }) => <em className="text-cosmic-frost/90">{children}</em>,
};
