'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LOD } from '@/config/universeLayout';
import Planet from './Planet';
import type { GalaxyData } from '@/hooks/useUniverseData';

interface GalaxyProps {
  data: GalaxyData;
  onPlanetClick?: (slug: string) => void;
  onGalaxyClick?: (slug: string) => void;
  /** Set of planet slugs to show (undefined = show all) */
  visiblePlanets?: Set<string>;
}

const NEBULA_PARTICLE_COUNT = 500;

export default function Galaxy({
  data,
  onPlanetClick,
  onGalaxyClick,
  visiblePlanets,
}: GalaxyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const nebulaRef = useRef<THREE.Points>(null);
  const lodRef = useRef<'far' | 'mid' | 'near'>('far');
  const { camera } = useThree();

  const { x: gx, y: gy, z: gz } = data.position;
  const galaxyPos = useMemo<[number, number, number]>(() => [gx, gy, gz], [gx, gy, gz]);

  const primaryColor = useMemo(
    () => new THREE.Color(data.colorScheme.primary),
    [data.colorScheme.primary],
  );
  const nebulaColor = useMemo(
    () => new THREE.Color(data.colorScheme.nebula),
    [data.colorScheme.nebula],
  );

  // Nebula particles
  const nebulaGeometry = useMemo(() => {
    const positions = new Float32Array(NEBULA_PARTICLE_COUNT * 3);
    const sizes = new Float32Array(NEBULA_PARTICLE_COUNT);
    for (let i = 0; i < NEBULA_PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 10 + Math.random() * 60;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.3; // Flatten
      positions[i * 3 + 2] = r * Math.cos(phi);
      sizes[i] = 1 + Math.random() * 3;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, []);

  // Dispose nebula geometry on unmount to prevent GPU memory leak
  useEffect(() => {
    return () => {
      nebulaGeometry.dispose();
    };
  }, [nebulaGeometry]);

  // Star children (subcategories) geometries
  const starPhaseConfig = useMemo(
    () =>
      (data.children ?? []).map((star) => {
        let scale = 2;
        let color = '#ffdd44';
        switch (star.starPhase) {
          case 'MAIN_SEQUENCE':
            scale = 2;
            color = '#ffee66';
            break;
          case 'GIANT':
            scale = 3;
            color = '#ffaa33';
            break;
          case 'RED_GIANT':
            scale = 5;
            color = '#ff4422';
            break;
          case 'PROTOSTAR':
          default:
            scale = 1.5;
            color = '#886644';
            break;
        }
        // Distribute stars in a ring around the galaxy center
        const angle = Math.random() * Math.PI * 2;
        const dist = 15 + Math.random() * 30;
        return {
          ...star,
          scale,
          color,
          position: [Math.cos(angle) * dist, (Math.random() - 0.5) * 5, Math.sin(angle) * dist] as [
            number,
            number,
            number,
          ],
        };
      }),
    [data.children],
  );

  const galaxyVec = useMemo(() => new THREE.Vector3(gx, gy, gz), [gx, gy, gz]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Compute LOD from camera distance (reuse vector to avoid GC pressure)
    const dist = camera.position.distanceTo(galaxyVec);

    if (dist > LOD.galaxyFar) {
      lodRef.current = 'far';
    } else if (dist > LOD.galaxyMid) {
      lodRef.current = 'mid';
    } else {
      lodRef.current = 'near';
    }

    // Rotate nebula slowly — delta-time multiplied per CLAUDE.md rules
    if (nebulaRef.current) {
      nebulaRef.current.rotation.y += delta * 0.02;
    }
  });

  // Extract planets from bodies
  const planets = data.bodies ?? [];

  return (
    <group ref={groupRef} position={galaxyPos}>
      {/* Center black hole placeholder */}
      <mesh onClick={() => onGalaxyClick?.(data.slug)}>
        <sphereGeometry args={[4, 16, 16]} />
        <meshBasicMaterial color={primaryColor} transparent opacity={0.9} />
      </mesh>
      {/* Emissive glow around center */}
      <mesh>
        <sphereGeometry args={[6, 16, 16]} />
        <meshBasicMaterial
          color={primaryColor}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Star children (subcategories) */}
      {starPhaseConfig.map((star) => (
        <mesh key={star.id} position={star.position}>
          <sphereGeometry args={[star.scale, 12, 12]} />
          <meshBasicMaterial color={star.color} transparent opacity={0.85} />
        </mesh>
      ))}

      {/* Nebula particles */}
      <points ref={nebulaRef} geometry={nebulaGeometry}>
        <pointsMaterial
          color={nebulaColor}
          size={2}
          sizeAttenuation
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Planets (articles) — only at near/mid LOD */}
      {planets.map((planet) => (
        <Planet
          key={planet.id}
          slug={planet.slug}
          title={planet.title}
          galaxyPosition={[0, 0, 0]} // Relative to galaxy group
          physics={planet.physicsParams}
          aesthetics={planet.aestheticsParams}
          dimmed={visiblePlanets !== undefined && !visiblePlanets.has(planet.slug)}
          onClick={() => onPlanetClick?.(planet.slug)}
        />
      ))}
    </group>
  );
}
