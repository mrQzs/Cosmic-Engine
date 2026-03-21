'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { createAsteroidVariants } from '@/utils/asteroidGeometry';
import { useCosmicStore } from '@/stores/cosmicStore';
import { useAsteroidStore, type AsteroidData } from '@/stores/asteroidStore';
import { QualityLevel } from '@cosmic-engine/shared';

/** Belt config */
const BELT = {
  innerRadius: 75,
  outerRadius: 90,
  zones: 8,
  zoneUpdateSkip: 4, // Far zones update every N frames
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
// Reusable objects for per-frame matrix decomposition — never allocate in useFrame
const _reuseMat4 = new THREE.Matrix4();
const _reuseScale = new THREE.Vector3();
const _reuseQuat = new THREE.Quaternion();

interface AsteroidBeltProps {
  galaxyPosition: [number, number, number];
  galaxySeed: number;
  asteroids: AsteroidData[];
  onClick?: (id: string) => void;
}

export default function AsteroidBelt({
  galaxyPosition,
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

  const frameCountRef = useRef(0);
  const { camera } = useThree();

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
      // Sort by creation time: newest at outer edge
      const t = i / Math.max(1, totalAsteroids - 1);
      const radius = BELT.innerRadius + t * (BELT.outerRadius - BELT.innerRadius);
      const angle = rng() * Math.PI * 2;
      const y = (rng() - 0.5) * 8; // Vertical spread

      positions.push({ angle, radius, y });
    }
    return positions;
  }, [totalAsteroids, galaxySeed]);

  // Color from creation time (warm=new, cool=old)
  function asteroidColor(a: AsteroidData): THREE.Color {
    const ageDays = (Date.now() - new Date(a.createdAt).getTime()) / 86400000;
    const t = Math.min(1, ageDays / 365);
    // Warm (orange 0.08) → Cool (blue 0.6)
    const hue = 0.08 + t * 0.52;
    return _color.setHSL(hue, 0.7, 0.55);
  }

  // Initialize matrices and colors for each bucket
  function initBucket(mesh: THREE.InstancedMesh | null, indices: number[]) {
    if (!mesh || indices.length === 0) return;

    for (let j = 0; j < indices.length; j++) {
      const i = indices[j];
      const a = asteroids[i];
      const pos = beltPositions[i];
      if (!pos) continue;

      const volume = 0.5 + Math.min(2.5, ((a.wordCount || 0) / 2000) * 2.5);
      const x = galaxyPosition[0] + Math.cos(pos.angle) * pos.radius;
      const y = galaxyPosition[1] + pos.y;
      const z = galaxyPosition[2] + Math.sin(pos.angle) * pos.radius;

      _dummy.position.set(x, y, z);
      _dummy.scale.setScalar(volume);
      _dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      _dummy.updateMatrix();
      mesh.setMatrixAt(j, _dummy.matrix);

      // Color
      const col = asteroidColor(a);
      // Dim non-highlighted when searching
      if (searchQuery && !highlightedIds.has(a.id)) {
        col.multiplyScalar(0.15);
      }
      // Glow for important
      if (a.important) {
        col.addScalar(0.15);
      }
      // Selected for merge: bright tint
      if (selectedForMerge.has(a.id)) {
        col.lerp(new THREE.Color('#38bdf8'), 0.5);
      }
      mesh.setColorAt(j, col);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  useEffect(() => {
    initBucket(roughRef.current, assignments.rough);
    initBucket(mediumRef.current, assignments.medium);
    initBucket(smoothRef.current, assignments.smooth);
  }, [assignments, beltPositions, asteroids, searchQuery, highlightedIds, selectedForMerge]);

  // Per-frame drift animation with zone-based partial updates
  useFrame((_, delta) => {
    frameCountRef.current++;
    if (totalAsteroids === 0) return;

    const meshes = [
      { ref: roughRef.current, indices: assignments.rough },
      { ref: mediumRef.current, indices: assignments.medium },
      { ref: smoothRef.current, indices: assignments.smooth },
    ];

    // Determine camera azimuth relative to galaxy center
    const dx = camera.position.x - galaxyPosition[0];
    const dz = camera.position.z - galaxyPosition[2];
    const cameraAngle = Math.atan2(dz, dx);

    for (const { ref: mesh, indices } of meshes) {
      if (!mesh || indices.length === 0) continue;

      for (let j = 0; j < indices.length; j++) {
        const i = indices[j];
        const pos = beltPositions[i];
        if (!pos) continue;

        // Zone-based update: check if this asteroid is near camera
        const angleDiff = Math.abs(
          ((pos.angle - cameraAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI,
        );
        const zoneIdx = Math.floor((pos.angle / (Math.PI * 2)) * BELT.zones) % BELT.zones;
        const nearCamera = angleDiff < Math.PI / 3; // Within 60° of camera

        // Skip far zones on most frames
        if (
          !nearCamera &&
          frameCountRef.current % BELT.zoneUpdateSkip !== zoneIdx % BELT.zoneUpdateSkip
        ) {
          continue;
        }

        // Apply drift
        pos.angle += BELT.driftSpeed * delta;

        const x = galaxyPosition[0] + Math.cos(pos.angle) * pos.radius;
        const y = galaxyPosition[1] + pos.y;
        const z = galaxyPosition[2] + Math.sin(pos.angle) * pos.radius;

        mesh.getMatrixAt(j, _reuseMat4);
        _reuseMat4.decompose(_dummy.position, _reuseQuat, _reuseScale);

        _dummy.position.set(x, y, z);
        _dummy.quaternion.copy(_reuseQuat);
        _dummy.scale.copy(_reuseScale);
        _dummy.updateMatrix();
        mesh.setMatrixAt(j, _dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
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
    <group>
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
