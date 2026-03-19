'use client';

import { useState, useCallback, useEffect } from 'react';
import type { GalaxyData } from '@/hooks/useUniverseData';

interface QuickJumpProps {
  galaxies: GalaxyData[];
  onSelect: (slug: string, type: 'galaxy' | 'planet') => void;
}

export default function QuickJump({ galaxies, onSelect }: QuickJumpProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Tab key toggles
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery('');
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const lowerQuery = query.toLowerCase();

  const galaxyResults = galaxies.filter(
    (g) => g.name.toLowerCase().includes(lowerQuery) || g.slug.includes(lowerQuery),
  );

  const planetResults = galaxies.flatMap((g) =>
    (g.bodies ?? [])
      .filter((p) => p.title.toLowerCase().includes(lowerQuery) || p.slug.includes(lowerQuery))
      .map((p) => ({ ...p, galaxyName: g.name })),
  );

  const handleSelect = useCallback(
    (slug: string, type: 'galaxy' | 'planet') => {
      onSelect(slug, type);
      setOpen(false);
    },
    [onSelect],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh]">
      <div
        className="absolute inset-0 bg-cosmic-void/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative z-10 w-full max-w-lg">
        <div className="hud-panel overflow-hidden">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to galaxy or planet..."
            autoFocus
            className="w-full border-b border-cosmic-frost/10 bg-transparent px-4 py-3 font-mono text-sm text-cosmic-frost outline-none placeholder:text-cosmic-frost/30"
          />
          <div className="max-h-[50vh] overflow-y-auto">
            {galaxyResults.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1 font-mono text-xs uppercase text-cosmic-frost/30">
                  Galaxies
                </p>
                {galaxyResults.slice(0, 10).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleSelect(g.slug, 'galaxy')}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-cosmic-frost/70 hover:bg-cosmic-frost/5 hover:text-cosmic-glow"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: g.colorScheme.primary }}
                    />
                    {g.name}
                    <span className="ml-auto font-mono text-xs text-cosmic-frost/30">
                      {g.articleCount} posts
                    </span>
                  </button>
                ))}
              </div>
            )}
            {planetResults.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1 font-mono text-xs uppercase text-cosmic-frost/30">
                  Planets
                </p>
                {planetResults.slice(0, 20).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.slug, 'planet')}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-cosmic-frost/70 hover:bg-cosmic-frost/5 hover:text-cosmic-glow"
                  >
                    {p.title}
                    <span className="ml-auto font-mono text-xs text-cosmic-frost/30">
                      {p.galaxyName}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {galaxyResults.length === 0 && planetResults.length === 0 && query && (
              <p className="p-4 text-center text-sm text-cosmic-frost/30">No results</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
