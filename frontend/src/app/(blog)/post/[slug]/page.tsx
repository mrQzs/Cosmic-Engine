'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { PLANET_QUERY } from '@/graphql/queries/universe';
import { useCosmicStore } from '@/stores/cosmicStore';
import { useEffect } from 'react';
import { notFound } from 'next/navigation';
import ArticleReader from '@/components/ui/ArticleReader';

interface PlanetQueryData {
  planet: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    coverUrl: string | null;
    content: string;
    readingTime: number;
    publishedAt: string | null;
    viewCount: number;
    commentCount: number;
    pinned: boolean;
    tags: { id: string; name: string; slug: string; color: string }[];
    galaxy: { id: string; name: string; slug: string } | null;
    relatedPlanets: {
      id: string;
      title: string;
      slug: string;
      excerpt: string | null;
      aestheticsParams: { baseColorHSL: { h: number; s: number; l: number } };
    }[];
    createdAt: string;
    updatedAt: string;
  } | null;
}

export default function PostPage() {
  const params = useParams<{ slug: string }>();
  const setCurrentPlanet = useCosmicStore((s) => s.setCurrentPlanet);
  const setViewMode = useCosmicStore((s) => s.setViewMode);

  const { data, loading, error } = useQuery<PlanetQueryData>(PLANET_QUERY, {
    variables: { slug: params.slug },
    skip: !params.slug,
  });

  const planet = data?.planet;

  useEffect(() => {
    if (planet) {
      setCurrentPlanet(planet.slug);
      setViewMode('article');
    }
    return () => {
      setCurrentPlanet(null);
      setViewMode('universe');
    };
  }, [planet, setCurrentPlanet, setViewMode]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="font-mono text-sm text-cosmic-glow animate-pulse-glow">
          Entering atmosphere...
        </p>
      </div>
    );
  }

  if (error || !planet) {
    notFound();
  }

  return <ArticleReader planet={planet} />;
}
