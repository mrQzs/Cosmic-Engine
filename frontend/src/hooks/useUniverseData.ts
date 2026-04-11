'use client';

import { useQuery } from '@apollo/client/react';
import { UNIVERSE_QUERY } from '@/graphql/queries/universe';
import {
  MOCK_GALAXIES,
  MOCK_COMETS,
  MOCK_WORMHOLES,
  MOCK_PULSAR,
  MOCK_STARGATES,
  MOCK_METEOR_SHOWER,
} from '@/config/mockUniverseData';

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

export interface CometData {
  id: string;
  title: string;
  slug: string;
  color: string;
  pathPoints: { x: number; y: number; z: number }[];
  speed: number;
}

export interface WormholeData {
  id: string;
  year: number;
  position: { x: number; y: number; z: number };
  color: string;
}

export interface PulsarData {
  position: { x: number; y: number; z: number };
  color: string;
  rotationSpeed: number;
}

export interface StarGateData {
  id: string;
  name: string;
  url: string;
  position: { x: number; y: number; z: number };
  color: string;
}

export interface MeteorShowerConfig {
  count: number;
  spawnRadius: number;
  color: string;
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
      comets: MOCK_COMETS,
      wormholes: MOCK_WORMHOLES,
      pulsar: MOCK_PULSAR,
      starGates: MOCK_STARGATES,
      meteorShower: MOCK_METEOR_SHOWER,
      stats: null,
      loading: false,
      error: undefined,
    };
  }

  return {
    galaxies: data?.universe.galaxies ?? [],
    comets: [] as CometData[],
    wormholes: [] as WormholeData[],
    pulsar: {
      position: { x: 0, y: 80, z: -400 },
      color: '#38bdf8',
      rotationSpeed: 3.0,
    } as PulsarData,
    starGates: [] as StarGateData[],
    meteorShower: { count: 8, spawnRadius: 600, color: '#38bdf8' } as MeteorShowerConfig,
    stats: data?.universe.stats ?? null,
    loading,
    error,
  };
}
