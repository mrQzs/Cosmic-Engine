'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { newtonRaphsonKepler, keplerPosition } from '@/utils/mathHelpers';
import type { CommentData } from '@/stores/commentStore';

/** Sub-satellite orbit constants (smaller than parent satellites) */
const SUB_ORBIT_BASE_RADIUS = 0.4;
const SUB_ORBIT_SPACING = 0.15;
const SUB_SCALE = 0.08; // 60% of parent's 0.15

function seedToColor(seed: string): THREE.Color {
  const val = parseInt(seed.slice(0, 6), 16) || 0;
  const hue = (val & 0xfff) / 0xfff;
  const sat = 0.5 + (((val >> 12) & 0xf) / 0xf) * 0.4;
  return new THREE.Color().setHSL(hue, sat, 0.65);
}

const _dummy = new THREE.Object3D();

interface SubSatelliteSwarmProps {
  /** Reply comments to render as sub-satellites */
  replies: CommentData[];
  /** Whether this thread is expanded */
  expanded: boolean;
}

export default function SubSatelliteSwarm({ replies, expanded }: SubSatelliteSwarmProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Limit to 3 nesting levels of visible sub-satellites
  const visibleReplies = useMemo(() => replies.slice(0, 24), [replies]);
  const count = visibleReplies.length;

  // Initialize colors
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || count === 0) return;

    for (let i = 0; i < count; i++) {
      const c = seedToColor(visibleReplies[i].avatarSeed);
      mesh.setColorAt(i, c);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [visibleReplies, count]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    const ring = ringRef.current;

    if (ring) ring.visible = !expanded && count > 0;
    if (mesh) mesh.visible = expanded && count > 0;

    if (!expanded || !mesh || count === 0) return;

    const time = clock.elapsedTime;
    const perRing = 6;

    for (let i = 0; i < count; i++) {
      const ringIdx = Math.floor(i / perRing);
      const posInRing = i % perRing;
      const orbitRadius = SUB_ORBIT_BASE_RADIUS + ringIdx * SUB_ORBIT_SPACING;
      const phaseSpacing = (2 * Math.PI) / Math.min(perRing, count - ringIdx * perRing);
      const phase = posInRing * phaseSpacing;
      const speed = 1.2 / Math.sqrt(orbitRadius * orbitRadius * orbitRadius);
      const ecc = 0.03;

      const M = phase + time * speed * 0.5;
      const E = newtonRaphsonKepler(M, ecc, 3);
      const [ox, oy] = keplerPosition(orbitRadius, ecc, E);

      _dummy.position.set(ox, oy * 0.3, oy * 0.95);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <group>
      {/* Expanded: individual sub-satellites */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        visible={false}
        frustumCulled={false}
      >
        <sphereGeometry args={[SUB_SCALE, 6, 6]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Collapsed: faint ring */}
      <mesh ref={ringRef} rotation={[Math.PI * 0.4, 0, 0]}>
        <torusGeometry args={[SUB_ORBIT_BASE_RADIUS, 0.02, 4, 32]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
