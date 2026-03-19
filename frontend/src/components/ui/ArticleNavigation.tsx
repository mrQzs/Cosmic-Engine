'use client';

import Link from 'next/link';

interface NavPlanet {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  aestheticsParams?: {
    baseColorHSL: { h: number; s: number; l: number };
  };
}

interface ArticleNavigationProps {
  relatedPlanets?: NavPlanet[];
}

export default function ArticleNavigation({ relatedPlanets = [] }: ArticleNavigationProps) {
  if (relatedPlanets.length === 0) return null;

  const prev = relatedPlanets[0];
  const next = relatedPlanets.length > 1 ? relatedPlanets[1] : undefined;

  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {prev && <NavCard planet={prev} direction="prev" />}
      {next && <NavCard planet={next} direction="next" />}
    </div>
  );
}

function NavCard({ planet, direction }: { planet: NavPlanet; direction: 'prev' | 'next' }) {
  const hsl = planet.aestheticsParams?.baseColorHSL;
  const accentColor = hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : '#06b6d4';

  return (
    <Link
      href={`/post/${planet.slug}`}
      className="group block rounded-lg border border-cosmic-frost/10 bg-cosmic-void/40 p-4 backdrop-blur-sm transition-colors hover:border-cosmic-glow/30"
    >
      <div className="flex items-center gap-2 text-xs text-cosmic-frost/40">
        {direction === 'prev' && <span>←</span>}
        <span>{direction === 'prev' ? 'Previous' : 'Next'}</span>
        {direction === 'next' && <span>→</span>}
        <span className="ml-auto h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
      </div>
      <p className="mt-2 text-sm text-cosmic-frost group-hover:text-cosmic-glow">{planet.title}</p>
      {planet.excerpt && (
        <p className="mt-1 text-xs text-cosmic-frost/40 line-clamp-2">{planet.excerpt}</p>
      )}
    </Link>
  );
}
