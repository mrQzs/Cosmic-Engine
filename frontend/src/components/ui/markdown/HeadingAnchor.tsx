'use client';

import type { ReactNode } from 'react';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]+/g, '')
    .replace(/--+/g, '-');
}

interface HeadingProps {
  children?: ReactNode;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export default function HeadingAnchor({ children, level }: HeadingProps) {
  const text = typeof children === 'string' ? children : '';
  const id = slugify(text);
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  const sizeClasses: Record<number, string> = {
    1: 'text-3xl mt-10 mb-4',
    2: 'text-2xl mt-8 mb-3',
    3: 'text-xl mt-6 mb-2',
    4: 'text-lg mt-4 mb-2',
    5: 'text-base mt-3 mb-1',
    6: 'text-sm mt-3 mb-1',
  };

  return (
    <Tag
      id={id}
      className={`font-heading text-cosmic-frost group scroll-mt-20 ${sizeClasses[level] ?? ''}`}
    >
      {children}
      <a
        href={`#${id}`}
        className="ml-2 text-cosmic-glow/0 transition-colors group-hover:text-cosmic-glow/60"
        aria-label={`Link to ${text}`}
      >
        #
      </a>
    </Tag>
  );
}
