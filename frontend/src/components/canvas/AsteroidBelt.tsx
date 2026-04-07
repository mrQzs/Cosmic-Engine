'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { createAsteroidVariants } from '@/utils/asteroidGeometry';
import { useCosmicStore } from '@/stores/cosmicStore';
import { useAsteroidStore, type AsteroidData } from '@/stores/asteroidStore';
import { QualityLevel } from '@cosmic-engine/shared';

/** Belt config */
const BELT = {
  innerRadius: 75,
  outerRadius: 90,
  driftSpeed: 0.003,
} as const;

/** Instance counts per quality tier */
const INSTANCE_COUNTS: Record<string, number> = {
  [QualityLevel.High]: 5000,
  [QualityLevel.Medium]: 2000,
  [QualityLevel.Low]: 500,
  [QualityLevel.UltraLow]: 0,
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

interface AsteroidBeltProps {
  galaxyPosition: [number, number, number];
  galaxySeed: number;
  asteroids: AsteroidData[];
  onClick?: (id: string) => void;
}

export default function AsteroidBelt({
  galaxyPosition: _galaxyPosition,
  galaxySeed,
  asteroids,
  onClick,
}: AsteroidBeltProps) {
  const qualityLevel = useCosmicStore((s) => s.qualityLevel);
  const highlightedIds = useAsteroidStore((s) => s.highlightedIds);
  const searchQuery = useAsteroidStore((s) => s.searchQuery);
  const selectedForMerge = useAsteroidStore((s) => s.selectedForMerge);

  // 3 InstancedMesh refs for rough/medium/smooth
  const roughRef = useRef<THREE.InstancedMesh>(null);
  const mediumRef = useRef<THREE.InstancedMesh>(null);
  const smoothRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Geometry variants
  const geometries = useMemo(() => createAsteroidVariants(galaxySeed), [galaxySeed]);

  // Determine instance count
  const maxInstances = INSTANCE_COUNTS[qualityLevel] ?? 0;
  const totalAsteroids = Math.min(asteroids.length, maxInstances);

  // Assign each asteroid to a roughness bucket
  const assignments = useMemo(() => {
    const rough: number[] = [];
    const medium: number[] = [];
    const smooth: number[] = [];

    for (let i = 0; i < totalAsteroids; i++) {
      const a = asteroids[i];
      const editCount = a.editCount || 0;
      if (editCount < 2) rough.push(i);
      else if (editCount < 5) medium.push(i);
      else smooth.push(i);
    }
    return { rough, medium, smooth };
  }, [asteroids, totalAsteroids]);

  // Pre-compute belt positions (deterministic from seed)
  const beltPositions = useMemo(() => {
    const rng = mulberry32(galaxySeed);
    const positions: { angle: number; radius: number; y: number }[] = [];

    for (let i = 0; i < totalAsteroids; i++) {
      const t = i / Math.max(1, totalAsteroids - 1);
      const radius = BELT.innerRadius + t * (BELT.outerRadius - BELT.innerRadius);
      const angle = rng() * Math.PI * 2;
      const y = (rng() - 0.5) * 8;

      positions.push({ angle, radius, y });
    }
    return positions;
  }, [totalAsteroids, galaxySeed]);

  // Initialize matrices (full position + rotation + scale) for each bucket
  function initBucket(mesh: THREE.InstancedMesh | null, indices: number[]) {
    if (!mesh || indices.length === 0) return;

    for (let j = 0; j < indices.length; j++) {
      const i = indices[j];
      const a = asteroids[i];
      const pos = beltPositions[i];
      if (!pos) continue;

      const volume = 0.5 + Math.min(2.5, ((a.wordCount || 0) / 2000) * 2.5);

      // Full position in local space (galaxy-relative)
      const x = Math.cos(pos.angle) * pos.radius;
      const y = pos.y;
      const z = Math.sin(pos.angle) * pos.radius;

      _dummy.position.set(x, y, z);
      _dummy.scale.setScalar(volume);
      _dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      _dummy.updateMatrix();
      mesh.setMatrixAt(j, _dummy.matrix);

      // Color from creation time (warm=new, cool=old)
      const ageDays = (Date.now() - new Date(a.createdAt).getTime()) / 86400000;
      const t = Math.min(1, ageDays / 365);
      const hue = 0.08 + t * 0.52;
      const col = _color.setHSL(hue, 0.7, 0.55);
      if (searchQuery && !highlightedIds.has(a.id)) col.multiplyScalar(0.15);
      if (a.important) col.addScalar(0.15);
      if (selectedForMerge.has(a.id)) col.lerp(new THREE.Color('#38bdf8'), 0.5);
      mesh.setColorAt(j, col);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  useEffect(() => {
    initBucket(roughRef.current, assignments.rough);
    initBucket(mediumRef.current, assignments.medium);
    initBucket(smoothRef.current, assignments.smooth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, beltPositions, asteroids, searchQuery, highlightedIds, selectedForMerge]);

  // GPU-optimal drift: all asteroids share the same angular speed →
  // rotate the parent group instead of updating 5000 matrices per frame.
  // O(1) per frame, raycasting stays correct (group transform is applied).
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += BELT.driftSpeed * delta;
    }
  });

  const handleClick = (indices: number[], e: ThreeEvent<MouseEvent>) => {
    if (e.instanceId === undefined) return;
    e.stopPropagation();
    const globalIdx = indices[e.instanceId];
    const asteroid = asteroids[globalIdx];
    if (asteroid) {
      onClick?.(asteroid.id);
    }
  };

  if (qualityLevel === QualityLevel.UltraLow || totalAsteroids === 0) return null;

  return (
    <group ref={groupRef}>
      {assignments.rough.length > 0 && (
        <instancedMesh
          ref={roughRef}
          args={[geometries[0], undefined, assignments.rough.length]}
          onClick={(e) => handleClick(assignments.rough, e)}
          frustumCulled={false}
        >
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
      )}
      {assignments.medium.length > 0 && (
        <instancedMesh
          ref={mediumRef}
          args={[geometries[1], undefined, assignments.medium.length]}
          onClick={(e) => handleClick(assignments.medium, e)}
          frustumCulled={false}
        >
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
      )}
      {assignments.smooth.length > 0 && (
        <instancedMesh
          ref={smoothRef}
          args={[geometries[2], undefined, assignments.smooth.length]}
          onClick={(e) => handleClick(assignments.smooth, e)}
          frustumCulled={false}
        >
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
      )}
    </group>
  );
}
