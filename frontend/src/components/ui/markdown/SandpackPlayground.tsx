'use client';

import { Sandpack } from '@codesandbox/sandpack-react';

interface SandpackPlaygroundProps {
  code: string;
  language?: string;
}

export default function SandpackPlayground({
  code,
  language = 'javascript',
}: SandpackPlaygroundProps) {
  const template =
    language.includes('tsx') || language.includes('react')
      ? ('react-ts' as const)
      : language.includes('ts')
        ? ('vanilla-ts' as const)
        : ('vanilla' as const);

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-cosmic-frost/10">
      <Sandpack
        template={template}
        files={{
          [`/index.${language.includes('ts') ? 'ts' : 'js'}${language.includes('tsx') ? 'x' : ''}`]:
            {
              code,
              active: true,
            },
        }}
        theme={{
          colors: {
            surface1: '#0a0a1a',
            surface2: '#0d0d24',
            surface3: '#1a1a3a',
            clickable: '#e2e8f0',
            base: '#e2e8f0',
            disabled: '#4a4a6a',
            hover: '#06b6d4',
            accent: '#06b6d4',
            error: '#ef4444',
            errorSurface: '#1a0a0a',
          },
          font: {
            body: 'Inter, sans-serif',
            mono: 'JetBrains Mono, monospace',
            size: '13px',
          },
        }}
        options={{
          showConsoleButton: true,
          showLineNumbers: true,
          editorHeight: 300,
        }}
      />
    </div>
  );
}
