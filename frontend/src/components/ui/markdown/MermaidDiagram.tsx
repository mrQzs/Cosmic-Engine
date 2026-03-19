'use client';

import { useEffect, useState } from 'react';

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const [svgHtml, setSvgHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        // Lazy-load mermaid (~1MB)
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict', // Prevents XSS in diagram definitions
          theme: 'dark',
          themeVariables: {
            darkMode: true,
            background: '#0a0a1a',
            primaryColor: '#06b6d4',
            primaryTextColor: '#e2e8f0',
            primaryBorderColor: '#38bdf8',
            lineColor: '#38bdf8',
            secondaryColor: '#7c3aed',
            tertiaryColor: '#1a1a3a',
          },
        });

        if (cancelled) return;

        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, chart);

        if (!cancelled) {
          setSvgHtml(svg);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to render diagram');
          setLoading(false);
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="my-4 rounded-lg border border-cosmic-danger/30 bg-cosmic-danger/10 p-4 font-mono text-sm text-cosmic-danger">
        Mermaid error: {error}
      </div>
    );
  }

  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-cosmic-frost/10 bg-cosmic-void/60 p-4">
      {loading && (
        <div className="flex items-center gap-2 text-sm text-cosmic-frost/40">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-cosmic-glow border-t-transparent" />
          Loading diagram...
        </div>
      )}
      {svgHtml && (
        <div
          className="flex justify-center"
          // Safe: Mermaid with securityLevel:'strict' sanitizes SVG output
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      )}
    </div>
  );
}
