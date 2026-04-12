'use client';

import { useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useUniverseData } from '@/hooks/useUniverseData';
import { useCosmicStore } from '@/stores/cosmicStore';
import { useCameraFlyTo } from '@/hooks/useCameraFlyTo';
import LightingSystem from './LightingSystem';
import Galaxy from './Galaxy';
import Comet from './Comet';
import Wormhole from './Wormhole';
import Pulsar from './Pulsar';
import MeteorShower from './MeteorShower';

interface UniverseProps {
  onPlanetClick?: (slug: string, worldPosition?: THREE.Vector3) => void;
  onGalaxyClick?: (slug: string) => void;
  visiblePlanets?: Set<string>;
}

export default function Universe({ onPlanetClick, onGalaxyClick, visiblePlanets }: UniverseProps) {
  const { galaxies, comets, wormholes, pulsar, starGates, meteorShower, loading, error } =
    useUniverseData();
  const setFocusedBody = useCosmicStore((s) => s.setFocusedBody);
  const { flyTo } = useCameraFlyTo();

  const galaxyLights = useMemo(
    () =>
      galaxies.map((g) => ({
        position: [g.position.x, g.position.y, g.position.z] as [number, number, number],
        color: g.colorScheme.primary,
      })),
    [galaxies],
  );

  const handlePlanetClick = useCallback(
    (slug: string, worldPosition: THREE.Vector3) => {
      setFocusedBody(slug);
      flyTo([worldPosition.x, worldPosition.y, worldPosition.z], slug, { offset: 15 });
      onPlanetClick?.(slug, worldPosition);
    },
    [setFocusedBody, flyTo, onPlanetClick],
  );

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

  const handleCometClick = useCallback(
    (slug: string) => {
      setFocusedBody(slug);
    },
    [setFocusedBody],
  );

  const handleWormholeClick = useCallback((year: number) => {
    // TODO: navigate to archive/year
    console.log('Wormhole clicked, year:', year);
  }, []);

  const handlePulsarClick = useCallback(() => {
    setFocusedBody('pulsar');
    flyTo([pulsar.position.x, pulsar.position.y, pulsar.position.z], 'pulsar', {
      offset: 30,
      duration: 2,
    });
  }, [pulsar, setFocusedBody, flyTo]);

  const handleStarGateClick = useCallback((id: string) => {
    // TODO: show preview card
    console.log('StarGate clicked:', id);
  }, []);

  if (loading || error) return null;

  return (
    <>
      <LightingSystem galaxyLights={galaxyLights} />

      {/* Galaxies (contain black holes, stars, planets, satellites, asteroids,
          and one StarGate per galaxy parked outside the rim) */}
      {galaxies.map((galaxy, i) => (
        <Galaxy
          key={galaxy.id}
          data={galaxy}
          onPlanetClick={handlePlanetClick}
          onGalaxyClick={handleGalaxyClick}
          visiblePlanets={visiblePlanets}
          starGate={starGates[i % Math.max(starGates.length, 1)]}
          onStarGateClick={handleStarGateClick}
        />
      ))}

      {/* Comets (pinned articles) */}
      {comets.map((comet) => (
        <Comet key={comet.id} data={comet} onClick={handleCometClick} />
      ))}

      {/* Wormholes (archive entries) */}
      {wormholes.map((wh) => (
        <Wormhole key={wh.id} data={wh} onClick={handleWormholeClick} />
      ))}

      {/* Pulsar (about page) */}
      <Pulsar data={pulsar} onClick={handlePulsarClick} />

      {/* Meteor Shower (ambient activity effect) */}
      <MeteorShower config={meteorShower} />
    </>
  );
}
