'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { GALAXY_QUERY } from '@/graphql/queries/universe';
import { useCosmicStore } from '@/stores/cosmicStore';
import { useEffect } from 'react';
import { notFound } from 'next/navigation';

interface GalaxyQueryData {
  galaxy: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    position: { x: number; y: number; z: number };
    colorScheme: { primary: string; secondary: string; nebula: string };
    parent: { id: string; name: string; slug: string } | null;
    children: {
      id: string;
      name: string;
      slug: string;
      articleCount: number;
      starPhase: string | null;
    }[];
    articleCount: number;
    starPhase: string | null;
    bodies: unknown[];
  } | null;
}

export default function GalaxyPage() {
  const params = useParams<{ slug: string }>();
  const setCurrentGalaxy = useCosmicStore((s) => s.setCurrentGalaxy);
  const setCameraTarget = useCosmicStore((s) => s.setCameraTarget);
  const setViewMode = useCosmicStore((s) => s.setViewMode);

  const { data, loading, error } = useQuery<GalaxyQueryData>(GALAXY_QUERY, {
    variables: { slug: params.slug },
    skip: !params.slug,
  });

  const galaxy = data?.galaxy;

  useEffect(() => {
    if (galaxy) {
      setCurrentGalaxy(galaxy.slug);
      setCameraTarget([galaxy.position.x, galaxy.position.y, galaxy.position.z]);
      setViewMode('galaxy');
    }
    return () => {
      setCurrentGalaxy(null);
      setViewMode('universe');
    };
  }, [galaxy, setCurrentGalaxy, setCameraTarget, setViewMode]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="font-mono text-sm text-cosmic-glow animate-pulse-glow">
          Approaching galaxy...
        </p>
      </div>
    );
  }

  if (error || !galaxy) {
    notFound();
  }

  return (
    <div className="fixed bottom-8 left-8 max-w-md">
      <div className="hud-panel p-6">
        <h1 className="font-heading text-2xl text-cosmic-glow">{galaxy.name}</h1>
        {galaxy.description && (
          <p className="mt-2 text-sm text-cosmic-frost/70">{galaxy.description}</p>
        )}
        <div className="mt-4 flex gap-4 font-mono text-xs text-cosmic-frost/50">
          <span>{galaxy.articleCount} planets</span>
          <span>{galaxy.children?.length ?? 0} stars</span>
        </div>
      </div>
    </div>
  );
}
