'use client';

import katex from 'katex';
import { useMemo } from 'react';

interface MathBlockProps {
  value: string;
  displayMode?: boolean;
}

export default function MathBlock({ value, displayMode = true }: MathBlockProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(value, {
        displayMode,
        throwOnError: false,
        trust: false,
        strict: false,
      });
    } catch {
      return `<span class="text-cosmic-danger">${value}</span>`;
    }
  }, [value, displayMode]);

  if (displayMode) {
    return (
      <div
        className="my-4 overflow-x-auto text-center"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
