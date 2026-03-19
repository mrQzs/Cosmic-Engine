'use client';

import { useMemo } from 'react';
import { useUniverseData } from '@/hooks/useUniverseData';
import { useCosmicStore } from '@/stores/cosmicStore';
import Starfield from './Starfield';
import LightingSystem from './LightingSystem';
import Galaxy from './Galaxy';

interface UniverseProps {
  onPlanetClick?: (slug: string) => void;
  onGalaxyClick?: (slug: string) => void;
  visiblePlanets?: Set<string>;
}

export default function Universe({ onPlanetClick, onGalaxyClick, visiblePlanets }: UniverseProps) {
  const { galaxies, loading, error } = useUniverseData();
  const setFocusedBody = useCosmicStore((s) => s.setFocusedBody);

  // Build galaxy lights array for the lighting system
  const galaxyLights = useMemo(
    () =>
      galaxies.map((g) => ({
        position: [g.position.x, g.position.y, g.position.z] as [number, number, number],
        color: g.colorScheme.primary,
      })),
    [galaxies],
  );

  const handlePlanetClick = (slug: string) => {
    setFocusedBody(slug);
    onPlanetClick?.(slug);
  };

  const handleGalaxyClick = (slug: string) => {
    setFocusedBody(slug);
    onGalaxyClick?.(slug);
  };

  if (loading) return null;
  if (error) {
    console.error('Universe query error:', error);
    return null;
  }

  return (
    <>
      <LightingSystem galaxyLights={galaxyLights} />
      <Starfield />
      {galaxies.map((galaxy) => (
        <Galaxy
          key={galaxy.id}
          data={galaxy}
          onPlanetClick={handlePlanetClick}
          onGalaxyClick={handleGalaxyClick}
          visiblePlanets={visiblePlanets}
        />
      ))}
    </>
  );
}
