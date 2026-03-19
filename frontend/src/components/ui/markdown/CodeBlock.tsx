'use client';

import { useCallback, useState, lazy, Suspense, type ReactNode } from 'react';

const SandpackPlayground = lazy(() => import('./SandpackPlayground'));

interface CodeBlockProps {
  className?: string;
  children?: ReactNode;
}

export default function CodeBlock({ className, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const rawLang = className?.replace(/^language-/, '') ?? '';
  const isInteractive = rawLang.includes('interactive');
  const language = rawLang.replace(/\s*interactive\s*/, '').trim();

  const code = typeof children === 'string' ? children.trimEnd() : String(children ?? '').trimEnd();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  // Route interactive code blocks to Sandpack
  if (isInteractive) {
    return (
      <Suspense
        fallback={
          <div className="my-4 rounded-lg border border-cosmic-glow/20 bg-cosmic-void/80 p-4">
            <div className="flex items-center gap-2 text-sm text-cosmic-frost/40">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-cosmic-glow border-t-transparent" />
              Loading playground...
            </div>
          </div>
        }
      >
        <SandpackPlayground code={code} language={language || 'javascript'} />
      </Suspense>
    );
  }

  // Detect mermaid diagrams
  if (language === 'mermaid') {
    const MermaidDiagram = lazy(() => import('./MermaidDiagram'));
    return (
      <Suspense
        fallback={
          <div className="my-4 rounded-lg border border-cosmic-frost/10 bg-cosmic-void/60 p-4 text-sm text-cosmic-frost/40">
            Loading diagram...
          </div>
        }
      >
        <MermaidDiagram chart={code} />
      </Suspense>
    );
  }

  return (
    <div className="group relative my-4">
      {language && (
        <div className="absolute right-2 top-2 flex items-center gap-2">
          <span className="font-mono text-xs text-cosmic-frost/40">{language}</span>
          <button
            onClick={handleCopy}
            className="rounded border border-cosmic-frost/20 bg-cosmic-void/60 px-2 py-0.5 font-mono text-xs text-cosmic-frost/50 opacity-0 transition-opacity hover:border-cosmic-glow/40 hover:text-cosmic-glow group-hover:opacity-100"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto rounded-lg border border-cosmic-frost/10 bg-[#0d0d24] p-4 font-mono text-sm">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}
