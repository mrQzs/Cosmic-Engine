'use client';

import { useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useUniverseData } from '@/hooks/useUniverseData';
import { useCosmicStore } from '@/stores/cosmicStore';
import { useCameraFlyTo } from '@/hooks/useCameraFlyTo';
import LightingSystem from './LightingSystem';
import Galaxy from './Galaxy';

interface UniverseProps {
  onPlanetClick?: (slug: string, worldPosition?: THREE.Vector3) => void;
  onGalaxyClick?: (slug: string) => void;
  visiblePlanets?: Set<string>;
}

export default function Universe({ onPlanetClick, onGalaxyClick, visiblePlanets }: UniverseProps) {
  const { galaxies, loading, error } = useUniverseData();
  const setFocusedBody = useCosmicStore((s) => s.setFocusedBody);
  const { flyTo } = useCameraFlyTo();

  // Build galaxy lights array for the lighting system
  const galaxyLights = useMemo(
    () =>
      galaxies.map((g) => ({
        position: [g.position.x, g.position.y, g.position.z] as [number, number, number],
        color: g.colorScheme.primary,
      })),
    [galaxies],
  );

  // Click planet → fly to planet's current world position
  const handlePlanetClick = useCallback(
    (slug: string, worldPosition: THREE.Vector3) => {
      setFocusedBody(slug);
      flyTo([worldPosition.x, worldPosition.y, worldPosition.z], slug, { offset: 15 });
      onPlanetClick?.(slug, worldPosition);
    },
    [setFocusedBody, flyTo, onPlanetClick],
  );

  // Click black hole → fly into galaxy, whole spiral appears before you
  const handleGalaxyClick = useCallback(
    (slug: string) => {
      setFocusedBody(slug);
      const galaxy = galaxies.find((g) => g.slug === slug);
      if (galaxy) {
        flyTo([galaxy.position.x, galaxy.position.y, galaxy.position.z], slug, {
          offset: 100,
          duration: 2,
        });
      }
      onGalaxyClick?.(slug);
    },
    [galaxies, setFocusedBody, flyTo, onGalaxyClick],
  );

  return (
    <>
      <LightingSystem galaxyLights={galaxyLights} />
      {!loading &&
        !error &&
        galaxies.map((galaxy) => (
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
