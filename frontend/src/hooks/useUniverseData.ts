'use client';

import { useQuery } from '@apollo/client/react';
import { UNIVERSE_QUERY } from '@/graphql/queries/universe';
import { MOCK_GALAXIES } from '@/config/mockUniverseData';

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface PhysicsParams {
  mass: number;
  orbitRadius: number;
  eccentricity: number;
  orbitInclination: number;
  phaseOffset: number;
  orbitalSpeed: number;
  textureSeed: number;
}

export interface AestheticsParams {
  planetType: string;
  baseColorHSL: HSLColor;
  atmosphereColor: string | null;
  surfaceRoughness: number;
  hasRing: boolean;
  glowIntensity: number;
  noiseType: string;
}

export interface PlanetData {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  viewCount: number;
  commentCount: number;
  tags: { id: string; name: string; slug: string; color: string }[];
  physicsParams: PhysicsParams;
  aestheticsParams: AestheticsParams;
}

export interface StarData {
  id: string;
  name: string;
  slug: string;
  articleCount: number;
  starPhase: string | null;
}

export interface GalaxyData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  position: { x: number; y: number; z: number };
  colorScheme: { primary: string; secondary: string; nebula: string };
  parent: { id: string; slug: string } | null;
  children: StarData[];
  articleCount: number;
  starPhase: string | null;
  bodies: PlanetData[];
}

export interface SiteStats {
  totalPlanets: number;
  totalComments: number;
  totalGalaxies: number;
  totalTags: number;
  totalViews: number;
  runningDays: number;
}

export interface UniverseData {
  universe: {
    galaxies: GalaxyData[];
    stats: SiteStats;
  };
}

export function useUniverseData() {
  const { data, loading, error } = useQuery<UniverseData>(UNIVERSE_QUERY);

  // Fallback to mock data when backend is unreachable (dev without backend)
  const useMock = !loading && (!!error || !data);

  if (useMock) {
    return {
      galaxies: MOCK_GALAXIES as GalaxyData[],
      stats: null,
      loading: false,
      error: undefined,
    };
  }

  return {
    galaxies: data?.universe.galaxies ?? [],
    stats: data?.universe.stats ?? null,
    loading,
    error,
  };
}
