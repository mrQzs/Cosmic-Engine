'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { newtonRaphsonKepler, keplerPosition, frameLerp } from '@/utils/mathHelpers';
import { SATELLITE_LOD } from '@/config/universeLayout';
import type { CommentData, PendingComment, OrbitalParams } from '@/stores/commentStore';

/** Deterministic color from avatar seed hex string */
function seedToColor(seed: string): THREE.Color {
  const val = parseInt(seed.slice(0, 6), 16) || 0;
  const hue = (val & 0xfff) / 0xfff;
  const sat = 0.5 + (((val >> 12) & 0xf) / 0xf) * 0.4;
  return new THREE.Color().setHSL(hue, sat, 0.6);
}

interface SatelliteItem {
  id: string;
  orbitalParams: OrbitalParams;
  avatarSeed: string;
  isPending: boolean;
  parentId?: string | null;
}

interface SatelliteSwarmProps {
  /** Only render comments matching this slug */
  bodySlug: string;
  comments: CommentData[];
  pendingComments: PendingComment[];
  planetWorldPosition: THREE.Vector3;
  onSatelliteClick?: (id: string, position: THREE.Vector3) => void;
  onSatelliteHover?: (id: string | null, position: THREE.Vector3 | null) => void;
}

// Reusable objects — allocated once, never in useFrame
const _dummy = new THREE.Object3D();
const _vec3 = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();

export default function SatelliteSwarm({
  bodySlug,
  comments,
  pendingComments,
  planetWorldPosition,
  onSatelliteClick,
  onSatelliteHover,
}: SatelliteSwarmProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const fadeRef = useRef(1); // 1 = fully visible mesh, 0 = fully points
  const hoveredRef = useRef<number | null>(null);

  // Filter comments by bodySlug, then merge confirmed + pending
  const items: SatelliteItem[] = useMemo(() => {
    const confirmed: SatelliteItem[] = comments
      .filter((c) => c.bodySlug === bodySlug && !c.parentId) // Match slug + top-level only
      .slice(0, SATELLITE_LOD.maxInstances)
      .map((c) => ({
        id: c.id,
        orbitalParams: c.orbitalParams,
        avatarSeed: c.avatarSeed,
        isPending: false,
        parentId: c.parentId,
      }));
    const pending: SatelliteItem[] = pendingComments.map((p) => ({
      id: p.tempId,
      orbitalParams: p.orbitalParams,
      avatarSeed: p.avatarSeed,
      isPending: true,
      parentId: p.parentId,
    }));
    return [...confirmed, ...pending];
  }, [comments, pendingComments, bodySlug]);

  const count = items.length;

  // Points geometry for far LOD
  const pointsPositions = useMemo(() => new Float32Array(Math.max(count, 1) * 3), [count]);

  // Initialize instance colors
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || count === 0) return;

    for (let i = 0; i < count; i++) {
      const item = items[i];
      const c = seedToColor(item.avatarSeed);
      if (item.isPending) {
        c.multiplyScalar(0.5); // Ghost tint
      }
      mesh.setColorAt(i, c);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items, count]);

  const { camera } = useThree();

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    const points = pointsRef.current;
    if (count === 0) return;

    // Camera distance for LOD
    const dist = camera.position.distanceTo(planetWorldPosition);
    const farThresh = SATELLITE_LOD.far;
    const band = farThresh * SATELLITE_LOD.crossFadeBand;

    // Target fade: 1 = full mesh, 0 = points only
    let targetFade = 1;
    if (dist > farThresh + band) {
      targetFade = 0;
    } else if (dist > farThresh - band) {
      targetFade = 1 - (dist - (farThresh - band)) / (2 * band);
    }
    fadeRef.current = frameLerp(fadeRef.current, targetFade, 6, 0.016);

    const showMesh = fadeRef.current > 0.01;
    const showPoints = fadeRef.current < 0.99;

    if (mesh) mesh.visible = showMesh;
    if (points) points.visible = showPoints;

    const time = clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const { orbitalParams: op, isPending } = items[i];

      // Kepler orbit position
      const M = op.phaseOffset + time * op.orbitalSpeed * 0.3;
      const E = newtonRaphsonKepler(M, op.eccentricity, 3);
      const [ox, oy] = keplerPosition(op.orbitRadius, op.eccentricity, E);

      // Apply inclination
      const cosI = Math.cos(op.orbitInclination);
      const sinI = Math.sin(op.orbitInclination);
      const x = ox;
      const y = oy * sinI;
      const z = oy * cosI;

      // Update InstancedMesh
      if (showMesh && mesh) {
        _dummy.position.set(x, y, z);

        // Pending: breathing scale animation
        let scale = 0.15;
        if (isPending) {
          scale *= 0.8 + 0.2 * Math.sin(time * 3);
        }
        // Hovered: slight enlarge
        if (hoveredRef.current === i) {
          scale *= 1.3;
        }
        _dummy.scale.setScalar(scale / 0.15); // geometry radius is 0.15
        _dummy.updateMatrix();
        mesh.setMatrixAt(i, _dummy.matrix);
      }

      // Update points positions
      if (showPoints) {
        pointsPositions[i * 3] = x;
        pointsPositions[i * 3 + 1] = y;
        pointsPositions[i * 3 + 2] = z;
      }
    }

    if (showMesh && mesh) {
      mesh.instanceMatrix.needsUpdate = true;
    }

    if (showPoints && points) {
      const posAttr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
      posAttr.needsUpdate = true;
    }
  });

  // Raycast handler for hover — use reusable _mat4
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (e.instanceId === undefined) {
      if (hoveredRef.current !== null) {
        hoveredRef.current = null;
        onSatelliteHover?.(null, null);
      }
      return;
    }
    e.stopPropagation();
    hoveredRef.current = e.instanceId;
    const item = items[e.instanceId];
    if (item) {
      const mesh = meshRef.current;
      if (mesh) {
        mesh.getMatrixAt(e.instanceId, _mat4);
        _vec3.setFromMatrixPosition(_mat4);
        _vec3.add(planetWorldPosition);
        onSatelliteHover?.(item.id, _vec3.clone());
      }
    }
  };

  const handlePointerOut = () => {
    hoveredRef.current = null;
    onSatelliteHover?.(null, null);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.instanceId === undefined) return;
    e.stopPropagation();
    const item = items[e.instanceId];
    if (item && !item.isPending) {
      const mesh = meshRef.current;
      if (mesh) {
        mesh.getMatrixAt(e.instanceId, _mat4);
        _vec3.setFromMatrixPosition(_mat4);
        _vec3.add(planetWorldPosition);
        onSatelliteClick?.(item.id, _vec3.clone());
      }
    }
  };

  if (count === 0) return null;

  return (
    <group>
      {/* Near LOD: InstancedMesh spheres */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Far LOD: Points */}
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pointsPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={3}
          sizeAttenuation
          color="#38bdf8"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
